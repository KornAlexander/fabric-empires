import { describe, it, expect } from 'vitest';
import {
  ANSWER_SALT,
  DP600_QUESTIONS,
  LOADED_CLUSTERS,
  SCORE_CORRECT,
  SCORE_CORRECT_FAST,
  SCORE_TIMEOUT,
  SCORE_WRONG,
  allSkills,
  checkAnswer,
  coverage,
  coveredSkills,
  createQuestionPresenter,
  decryptExplanation,
  encryptExplanation,
  hashAnswer,
  normaliseAnswer,
  questionsForCluster,
  questionsForSkill,
  scoreFor,
  selectQuestion,
  validateBank,
  validateQuestion,
  type Question,
  type QuestionAnswer,
  type QuestionPrompt,
  type QuestionResult,
  type QuestionUi,
} from '../src/index.js';
import draftFile from '../content/dp-600/questions/src/B1.json' with { type: 'json' };

interface Draft {
  readonly id: string;
  readonly answer: string;
  readonly explanation: string;
  readonly options?: readonly string[];
  readonly stem: string;
}
const DRAFTS = (draftFile as { questions: Draft[] }).questions;
const draftById = new Map(DRAFTS.map((d) => [d.id, d]));

function questionById(id: string): Question {
  const found = DP600_QUESTIONS.find((q) => q.id === id);
  if (!found) throw new Error(`No built question ${id}`);
  return found;
}

describe('answer normalisation', () => {
  it('ignores case and surrounding space', () => {
    expect(normaliseAnswer('  Direct Lake ')).toBe(normaliseAnswer('direct lake'));
  });

  it('collapses runs of whitespace', () => {
    expect(normaliseAnswer('Direct   Lake')).toBe(normaliseAnswer('Direct Lake'));
  });

  it('ignores the order of a multi-select', () => {
    // A player who picks the right two options in the wrong order being told
    // they are wrong would be the worst possible bug in a teaching tool.
    expect(normaliseAnswer(['b', 'a'])).toBe(normaliseAnswer(['a', 'b']));
  });

  it('drops empty entries', () => {
    expect(normaliseAnswer(['a', '', '  '])).toBe(normaliseAnswer('a'));
  });
});

describe('answer hashing', () => {
  it('is stable for the same input', async () => {
    expect(await hashAnswer('q1', 'yes')).toBe(await hashAnswer('q1', 'yes'));
  });

  it('is a 64 character hex digest', async () => {
    expect(await hashAnswer('q1', 'yes')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs per question, so one answer key does not unlock another', async () => {
    expect(await hashAnswer('q1', 'yes')).not.toBe(await hashAnswer('q2', 'yes'));
  });

  it('accepts a correct answer and rejects a wrong one', async () => {
    const hash = await hashAnswer('q1', 'Direct Lake');
    expect(await checkAnswer('q1', 'direct lake', hash)).toBe(true);
    expect(await checkAnswer('q1', 'Import', hash)).toBe(false);
  });
});

describe('explanation encryption', () => {
  it('round trips with the right answer', async () => {
    const cipher = await encryptExplanation('q1', 'Direct Lake', 'Because it reads Delta.');
    expect(await decryptExplanation('q1', 'Direct Lake', cipher)).toBe(
      'Because it reads Delta.',
    );
  });

  it('returns undefined for a wrong answer instead of throwing', async () => {
    // A wrong answer is a normal event in a study tool, not an error.
    const cipher = await encryptExplanation('q1', 'Direct Lake', 'secret');
    expect(await decryptExplanation('q1', 'Import', cipher)).toBeUndefined();
  });

  it('cannot be opened with the right answer to a different question', async () => {
    const cipher = await encryptExplanation('q1', 'Direct Lake', 'secret');
    expect(await decryptExplanation('q2', 'Direct Lake', cipher)).toBeUndefined();
  });

  it('produces a different ciphertext each time, from a fresh IV', async () => {
    const a = await encryptExplanation('q1', 'x', 'same text');
    const b = await encryptExplanation('q1', 'x', 'same text');
    expect(a).not.toBe(b);
    expect(await decryptExplanation('q1', 'x', a)).toBe('same text');
    expect(await decryptExplanation('q1', 'x', b)).toBe('same text');
  });

  it('uses a salt that is public by necessity, and says so', () => {
    // Documented rather than hidden: everything the client needs is in the
    // client, so a "secret" salt would be theatre.
    expect(ANSWER_SALT.length).toBeGreaterThan(0);
  });
});

describe('the built bank', () => {
  it('loaded the B1 cluster', () => {
    expect(LOADED_CLUSTERS).toContain('B1');
    expect(DP600_QUESTIONS.length).toBe(15);
  });

  it('passes validation', () => {
    expect(validateBank(DP600_QUESTIONS)).toEqual([]);
  });

  it('ships no plaintext answer or explanation', async () => {
    /*
     * The whole point of the build step. If this ever fails, the shipped
     * bundle carries a readable answer key.
     */
    const text = JSON.stringify(DP600_QUESTIONS);
    for (const question of DP600_QUESTIONS) {
      const draft = draftById.get(question.id)!;
      expect(text).not.toContain(draft.explanation);
      expect(Object.keys(question)).not.toContain('answer');
      expect(Object.keys(question)).not.toContain('explanation');
    }
  });

  it('accepts the authored answer for every question', async () => {
    // Proves the build hashed what the author actually wrote.
    for (const question of DP600_QUESTIONS) {
      const draft = draftById.get(question.id)!;
      expect(
        await checkAnswer(question.id, draft.answer, question.answerHash),
        `${question.id} does not accept its own answer`,
      ).toBe(true);
    }
  });

  it('rejects every distractor', async () => {
    // Catches an authoring slip where the recorded answer is not among the
    // options, or two options are effectively the same.
    for (const question of DP600_QUESTIONS) {
      const draft = draftById.get(question.id)!;
      for (const option of question.options ?? []) {
        if (normaliseAnswer(option) === normaliseAnswer(draft.answer)) continue;
        expect(
          await checkAnswer(question.id, option, question.answerHash),
          `${question.id} accepts distractor "${option}"`,
        ).toBe(false);
      }
    }
  });

  it('has an answer that is one of the offered options', async () => {
    for (const question of DP600_QUESTIONS) {
      const draft = draftById.get(question.id)!;
      if (!question.options) continue;
      const match = question.options.some(
        (o) => normaliseAnswer(o) === normaliseAnswer(draft.answer),
      );
      expect(match, `${question.id}: answer is not among its options`).toBe(true);
    }
  });

  it('decrypts each explanation with its own answer', async () => {
    for (const question of DP600_QUESTIONS) {
      const draft = draftById.get(question.id)!;
      expect(
        await decryptExplanation(question.id, draft.answer, question.explanationCipher),
      ).toBe(draft.explanation);
    }
  });

  it('covers every skill in the loaded cluster', () => {
    const covered = coveredSkills();
    for (const skillId of [12, 13, 14, 15, 16]) {
      expect(covered.has(skillId), `skill ${skillId} has no questions`).toBe(true);
    }
  });

  it('gives each covered skill more than one question', () => {
    const report = coverage(DP600_QUESTIONS);
    for (const skillId of [12, 13, 14, 15, 16]) {
      expect(report.perSkill.get(skillId)!).toBeGreaterThanOrEqual(3);
    }
  });

  it('reports the skills still without questions, honestly', () => {
    // 41 skills, one cluster written. The report must say so rather than
    // implying the bank is complete.
    const report = coverage(DP600_QUESTIONS);
    expect(report.uncovered.length).toBe(allSkills().length - 5);
  });

  it('writes stems as questions, not fragments', () => {
    for (const question of DP600_QUESTIONS) {
      expect(question.stem.length).toBeGreaterThan(40);
      expect(question.stem.trim().endsWith('?')).toBe(true);
    }
  });

  it('offers at least four options on every multiple choice item', () => {
    for (const question of DP600_QUESTIONS) {
      if (question.type !== 'mcq') continue;
      expect(question.options!.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('spreads difficulty rather than sitting at one tier', () => {
    const tiers = new Set(DP600_QUESTIONS.map((q) => q.tier));
    expect(tiers.size).toBeGreaterThan(1);
  });
});

describe('provenance', () => {
  it('records the verbatim outline bullet on every item', () => {
    // The check that makes D48 real: a mismatch here means the item drifted
    // from the published wording it claims to come from.
    const labels = new Map(allSkills().map((s) => [s.id, s.label]));
    for (const question of DP600_QUESTIONS) {
      expect(question.sourceSkillBullet).toBe(labels.get(question.skillId));
    }
  });

  it('records a documentation URL on every item', () => {
    for (const question of DP600_QUESTIONS) {
      expect(question.sourceLearnUrl).toContain('learn.microsoft.com');
      expect(question.learnUrl).toContain('learn.microsoft.com');
    }
  });

  it('rejects an item whose provenance does not match the outline', () => {
    const [first] = DP600_QUESTIONS;
    const tampered = { ...first!, sourceSkillBullet: 'Something I made up' };
    const problems = validateQuestion(tampered);
    expect(problems.some((p) => p.includes('sourceSkillBullet'))).toBe(true);
  });

  it('rejects an item filed under the wrong cluster', () => {
    const [first] = DP600_QUESTIONS;
    const problems = validateQuestion({ ...first!, cluster: 'C2' });
    expect(problems.some((p) => p.includes('cluster'))).toBe(true);
  });

  it('rejects a non-Microsoft source URL', () => {
    const [first] = DP600_QUESTIONS;
    const problems = validateQuestion({
      ...first!,
      sourceLearnUrl: 'https://example.com/whatever',
    });
    expect(problems.some((p) => p.includes('sourceLearnUrl'))).toBe(true);
  });

  it('rejects an item that still carries a plaintext answer', () => {
    const [first] = DP600_QUESTIONS;
    const leaky = { ...first!, answer: 'Direct Lake' } as unknown as Question;
    expect(validateQuestion(leaky).some((p) => p.includes('plaintext'))).toBe(true);
  });
});

describe('selecting a question', () => {
  it('picks one for a covered topic', () => {
    expect(selectQuestion('dp600-12')).toBeDefined();
  });

  it('returns nothing for a topic with no questions yet', () => {
    // Most of the 41 are in this state, and that must not break anything.
    expect(selectQuestion('dp600-1')).toBeUndefined();
  });

  it('returns nothing for a nonsense topic id', () => {
    expect(selectQuestion('not-a-topic')).toBeUndefined();
  });

  it('prefers the requested tier when one exists', () => {
    const picked = selectQuestion('dp600-16', { tier: 3, random: () => 0 });
    expect(picked?.tier).toBe(3);
  });

  it('falls back to another tier rather than returning nothing', () => {
    const picked = selectQuestion('dp600-12', { tier: 3, random: () => 0 });
    expect(picked).toBeDefined();
  });

  it('avoids repeating a question already asked', () => {
    const first = selectQuestion('dp600-12', { random: () => 0 })!;
    const second = selectQuestion('dp600-12', {
      exclude: new Set([first.id]),
      random: () => 0,
    })!;
    expect(second.id).not.toBe(first.id);
  });

  it('repeats rather than giving up once everything has been asked', () => {
    const all = new Set(questionsForSkill(DP600_QUESTIONS, 12).map((q) => q.id));
    expect(selectQuestion('dp600-12', { exclude: all, random: () => 0 })).toBeDefined();
  });

  it('filters by cluster', () => {
    expect(questionsForCluster(DP600_QUESTIONS, 'B1')).toHaveLength(15);
    expect(questionsForCluster(DP600_QUESTIONS, 'A1')).toHaveLength(0);
  });
});

describe('scoring', () => {
  it('rewards a fast correct answer most', () => {
    expect(scoreFor(true, 1000, 20_000, false)).toBe(SCORE_CORRECT_FAST);
  });

  it('still rewards a slow correct answer well', () => {
    // Taking time to think is not a mistake.
    expect(scoreFor(true, 19_000, 20_000, false)).toBe(SCORE_CORRECT);
    expect(SCORE_CORRECT).toBeGreaterThan(0);
  });

  it('penalises a wrong answer most', () => {
    expect(scoreFor(false, 1000, 20_000, false)).toBe(SCORE_WRONG);
  });

  it('penalises abandoning less than answering wrongly', () => {
    // Running out of time says less about knowledge than a confident error.
    expect(scoreFor(false, 20_000, 20_000, true)).toBe(SCORE_TIMEOUT);
    expect(SCORE_TIMEOUT).toBeGreaterThan(SCORE_WRONG);
  });
});

describe('the presenter', () => {
  function scriptedUi(answerFor: (p: QuestionPrompt) => QuestionAnswer): {
    ui: QuestionUi;
    results: QuestionResult[];
    prompts: QuestionPrompt[];
  } {
    const results: QuestionResult[] = [];
    const prompts: QuestionPrompt[] = [];
    return {
      prompts,
      results,
      ui: {
        async ask(prompt) {
          prompts.push(prompt);
          return answerFor(prompt);
        },
        async reveal(result) {
          results.push(result);
        },
      },
    };
  }

  const request = {
    kind: 'research' as const,
    topicId: 'dp600-12',
    tier: 1 as const,
    timeLimitMs: 30_000,
  };

  it('scores a correct answer and reveals the explanation', async () => {
    const { ui, results } = scriptedUi((prompt) => ({
      answer: draftById.get(prompt.question.id)!.answer,
      elapsedMs: 2_000,
      abandoned: false,
    }));
    const present = createQuestionPresenter(ui);

    const outcome = await present(request);
    expect(outcome.score).toBe(SCORE_CORRECT_FAST);
    expect(results[0]!.correct).toBe(true);
    expect(results[0]!.explanation).toBeDefined();
    expect(results[0]!.explanation!.length).toBeGreaterThan(20);
  });

  it('withholds the explanation on a wrong answer', async () => {
    // Not a policy choice: the explanation is encrypted under the answer, so
    // getting it wrong genuinely cannot open it.
    const { ui, results } = scriptedUi(() => ({
      answer: 'Something plainly incorrect',
      elapsedMs: 3_000,
      abandoned: false,
    }));
    const outcome = await createQuestionPresenter(ui)(request);
    expect(outcome.score).toBe(SCORE_WRONG);
    expect(results[0]!.correct).toBe(false);
    expect(results[0]!.explanation).toBeUndefined();
  });

  it('treats abandoning as a timeout, not a wrong answer', async () => {
    const { ui } = scriptedUi(() => ({
      answer: undefined,
      elapsedMs: 30_000,
      abandoned: true,
    }));
    expect((await createQuestionPresenter(ui)(request)).score).toBe(SCORE_TIMEOUT);
  });

  it('resolves neutral without bothering the player when a topic has no questions', async () => {
    // Most of the bank does not exist yet. An unfinished bank must degrade
    // quietly rather than blocking research.
    const { ui, prompts } = scriptedUi(() => ({
      answer: 'anything',
      elapsedMs: 1,
      abandoned: false,
    }));
    const outcome = await createQuestionPresenter(ui)({
      ...request,
      topicId: 'dp600-1',
    });
    expect(outcome.score).toBe(0);
    expect(prompts).toHaveLength(0);
  });

  it('does not repeat a question within a session', async () => {
    const asked = new Set<string>();
    const { ui, prompts } = scriptedUi((prompt) => ({
      answer: draftById.get(prompt.question.id)!.answer,
      elapsedMs: 1_000,
      abandoned: false,
    }));
    const present = createQuestionPresenter(ui, { asked, random: () => 0 });

    await present(request);
    await present(request);
    await present(request);
    expect(new Set(prompts.map((p) => p.question.id)).size).toBe(3);
  });

  it('never hands the engine anything but a score in range', async () => {
    for (const answer of ['wrong', undefined]) {
      const { ui } = scriptedUi(() => ({
        answer,
        elapsedMs: 5_000,
        abandoned: answer === undefined,
      }));
      const outcome = await createQuestionPresenter(ui)(request);
      expect(outcome.score).toBeGreaterThanOrEqual(-1);
      expect(outcome.score).toBeLessThanOrEqual(1);
    }
  });
});
