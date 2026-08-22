/**
 * The capacity edition, in one file.
 *
 * Serves the built game AND the `api/coach` route the connected edition looks
 * for. Run this and you have the Fabric-capacity flavour; serve `app/dist`
 * from anything else and you have the standalone one. Same bundle either way,
 * which is the point: there is one game and two ways to host it.
 *
 * ## ⚠️ Why this exists at all
 *
 * A static page cannot hold a secret. The browser never sees the Foundry key;
 * it POSTs a question and a progress digest to this process, and this process
 * holds the credential. That is the entire reason for the hop.
 *
 * ## Running it
 *
 *   npm run build
 *   set AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
 *   set AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
 *   set AZURE_OPENAI_KEY=<key>            # or use a managed identity, below
 *   node tools/coach/server.mjs
 *
 * With no endpoint configured it still runs and still serves the game: the
 * probe answers `{ coach: false }` and the app quietly stays in its standalone
 * shape. That is deliberate, so a misconfigured deployment degrades to the
 * working game rather than to an error.
 *
 * ⚠️ **A key in an environment variable is the second-best answer.** On Fabric
 * or Azure the better one is a managed identity: set `AZURE_OPENAI_TOKEN` from
 * `az account get-access-token --resource https://cognitiveservices.azure.com`
 * and no key exists anywhere. The code below prefers the token when both are
 * present.
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 5183);
const ROOT = resolve(process.cwd(), 'app/dist');

const ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT ?? '').replace(/\/+$/, '');
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT ?? '';
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';
const KEY = process.env.AZURE_OPENAI_KEY ?? '';
const TOKEN = process.env.AZURE_OPENAI_TOKEN ?? '';

const configured = Boolean(ENDPOINT && DEPLOYMENT && (KEY || TOKEN));

/**
 * Kept in step with `learn/src/coach.ts` by hand.
 *
 * ⚠️ Deliberately duplicated rather than imported. This process must be able to
 * run against a built `dist` with no workspace around it, and a server that
 * cannot start because a TypeScript package moved is a worse failure than a
 * prompt that has to be copied when it changes.
 */
const SYSTEM_PROMPT = [
  'You are a study coach for the Microsoft DP-600 exam, inside a strategy game',
  'where the exam outline is the tech tree.',
  '',
  "You are given a factual digest of the learner's spaced-repetition data,",
  'including a ranking of what is most valuable to study next. That ranking is',
  'already weighted by the published exam weighting and by how far each topic',
  'has decayed.',
  '',
  'Rules:',
  '- Answer from the digest. Do not invent topics, numbers or progress.',
  '- If the digest does not contain the answer, say so plainly.',
  '- Keep the given ranking. You may explain it, group it or reorder within',
  '  ties, but do not substitute a different opinion about priorities.',
  '- Be brief and concrete. Two or three sentences unless asked for more.',
  '- Never claim the learner is ready to sit the exam. Report the number and',
  '  let them decide.',
  '- Answer in the language the learner writes in.',
].join('\n');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
};

const json = (res, code, body) => {
  const text = JSON.stringify(body);
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
  });
  res.end(text);
};

/** Read a JSON body, with a cap. A coach question is small; anything else is not a question. */
async function readBody(req, limit = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('body too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function askFoundry(question, digest, history) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `Learner progress digest:\n\n${digest}` },
    ...history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .slice(-6)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
    { role: 'user', content: question },
  ];

  const url = `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;
  const headers = { 'content-type': 'application/json' };
  // A managed-identity token is preferred; a key is the fallback.
  if (TOKEN) headers.authorization = `Bearer ${TOKEN}`;
  else headers['api-key'] = KEY;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, temperature: 0.2, max_tokens: 400 }),
  });

  if (!response.ok) {
    // ⚠️ The upstream body may name the resource or quote the request. Logged
    // for whoever runs this, never returned to the browser.
    console.error('Foundry rejected the request', response.status, await response.text());
    throw new Error(`upstream ${response.status}`);
  }

  const body = await response.json();
  return body?.choices?.[0]?.message?.content?.trim() ?? '';
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const wanted = url.pathname === '/' ? '/index.html' : url.pathname;
  // ⚠️ Normalised and prefix-checked, so `..` cannot walk out of dist.
  const path = join(ROOT, normalize(wanted).replace(/^(\.\.[/\\])+/, ''));
  if (!path.startsWith(ROOT) || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
  createReadStream(path).pipe(res);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/coach') {
    if (req.method === 'GET') {
      // The probe. `coach: false` is a real answer, not a failure: it tells the
      // app to stay standalone rather than to show a chat that cannot work.
      json(res, 200, { coach: configured });
      return;
    }
    if (req.method === 'POST') {
      if (!configured) {
        json(res, 503, { error: 'No model configured' });
        return;
      }
      void (async () => {
        try {
          const body = await readBody(req);
          const question = String(body.question ?? '').slice(0, 2000);
          const digest = String(body.digest ?? '').slice(0, 20_000);
          if (!question) {
            json(res, 400, { error: 'No question' });
            return;
          }
          const reply = await askFoundry(question, digest, body.history ?? []);
          json(res, 200, { reply });
        } catch (error) {
          console.error('Coach failed', error);
          json(res, 502, { error: 'The coach could not answer' });
        }
      })();
      return;
    }
    res.writeHead(405).end();
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Fabric Empires, capacity edition, on http://localhost:${PORT}`);
  console.log(`  serving ${ROOT}`);
  console.log(
    configured
      ? `  coach: ${DEPLOYMENT} at ${ENDPOINT} (${TOKEN ? 'managed identity' : 'key'})`
      : '  coach: not configured, the game runs in its standalone shape',
  );
});
