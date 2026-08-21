/**
 * Build the shipped question bank from the plaintext authoring sources.
 *
 *   node tools/content/build-questions.mjs [--check]
 *
 * Reads learn/content/dp-600/questions/src/*.json, replaces each item's
 * `answer` and `explanation` with a hash and a ciphertext, and writes the
 * result alongside. With --check it verifies the built files are up to date
 * instead of writing, which is what CI runs.
 *
 * The crypto lives in learn/src/crypto.ts and is shared with the runtime, so
 * the bank is always built by exactly the code that reads it.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const SRC_DIR = path.join(ROOT, 'learn', 'content', 'dp-600', 'questions', 'src');
const OUT_DIR = path.join(ROOT, 'learn', 'content', 'dp-600', 'questions');

const ANSWER_SALT = 'fabric-empires:dp600:v1';
const PBKDF2_ITERATIONS = 100_000;
const IV_BYTES = 12;

function normaliseAnswer(answer) {
  const parts = (Array.isArray(answer) ? answer : [answer])
    .map((part) => String(part).trim().toLowerCase().replace(/\s+/g, ' '))
    .filter((part) => part.length > 0)
    .sort();
  return parts.join('|');
}

async function hashAnswer(questionId, answer) {
  const payload = `${ANSWER_SALT}|${questionId}|${normaliseAnswer(answer)}`;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(payload),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveKey(questionId, answer) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${normaliseAnswer(answer)}|${questionId}`),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(ANSWER_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptExplanation(questionId, answer, explanation) {
  const key = await deriveKey(questionId, answer);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(explanation),
  );
  const packed = new Uint8Array(iv.length + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), iv.length);
  return Buffer.from(packed).toString('base64');
}

async function buildFile(name, check) {
  const source = JSON.parse(await readFile(path.join(SRC_DIR, name), 'utf8'));
  const outPath = path.join(OUT_DIR, name);

  const existing =
    existsSync(outPath) ? JSON.parse(await readFile(outPath, 'utf8')) : undefined;
  const existingById = new Map(
    (existing?.questions ?? []).map((q) => [q.id, q]),
  );

  const questions = [];
  for (const draft of source.questions) {
    const { answer, explanation, ...rest } = draft;
    if (answer === undefined || explanation === undefined) {
      throw new Error(`${draft.id}: authoring source needs answer and explanation`);
    }

    const answerHash = await hashAnswer(draft.id, answer);
    const previous = existingById.get(draft.id);

    // Reuse the existing ciphertext when the answer and explanation are
    // unchanged. AES-GCM uses a fresh random IV every time, so rebuilding
    // unconditionally would rewrite every line of every file on every run and
    // make the diff useless for review.
    let explanationCipher;
    if (previous && previous.answerHash === answerHash) {
      const stillMatches = await decryptMatches(
        draft.id,
        answer,
        previous.explanationCipher,
        explanation,
      );
      explanationCipher = stillMatches
        ? previous.explanationCipher
        : await encryptExplanation(draft.id, answer, explanation);
    } else {
      explanationCipher = await encryptExplanation(draft.id, answer, explanation);
    }

    questions.push({ ...rest, answerHash, explanationCipher });
  }

  const built = {
    cluster: source.cluster,
    generated: 'tools/content/build-questions.mjs',
    questions,
  };
  const text = `${JSON.stringify(built, null, 2)}\n`;

  if (check) {
    const current = existsSync(outPath) ? await readFile(outPath, 'utf8') : '';
    return { name, upToDate: current === text, count: questions.length };
  }

  await writeFile(outPath, text, 'utf8');
  return { name, upToDate: true, count: questions.length };
}

async function decryptMatches(questionId, answer, cipher, expected) {
  try {
    const packed = Buffer.from(cipher, 'base64');
    const iv = packed.subarray(0, IV_BYTES);
    const ciphertext = packed.subarray(IV_BYTES);
    const key = await deriveKey(questionId, answer);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(plain) === expected;
  } catch {
    return false;
  }
}

const check = process.argv.includes('--check');
const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith('.json')).sort();

let failed = false;
for (const name of files) {
  const result = await buildFile(name, check);
  if (check && !result.upToDate) {
    console.error(`STALE  ${name} (run: node tools/content/build-questions.mjs)`);
    failed = true;
  } else {
    console.log(`${check ? 'ok    ' : 'built '} ${name}  ${result.count} questions`);
  }
}

process.exit(failed ? 1 : 0);
