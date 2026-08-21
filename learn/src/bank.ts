/**
 * The loaded question bank.
 *
 * Only built files are imported here. The plaintext authoring sources in
 * `src/` are never bundled, so a shipped app contains no readable answer key.
 */

import type { Question } from './questions.js';
import { skillIdFromTopic } from './outline.js';
import b1 from '../content/dp-600/questions/B1.json' with { type: 'json' };
import b3 from '../content/dp-600/questions/B3.json' with { type: 'json' };

interface BankFile {
  readonly cluster: string;
  readonly questions: readonly Question[];
}

const FILES: readonly BankFile[] = [
  b1 as unknown as BankFile,
  b3 as unknown as BankFile,
];

export const DP600_QUESTIONS: readonly Question[] = FILES.flatMap(
  (file) => file.questions,
);

export const LOADED_CLUSTERS: readonly string[] = FILES.map((f) => f.cluster);

/** Skills that have at least one question. */
export function coveredSkills(
  questions: readonly Question[] = DP600_QUESTIONS,
): Set<number> {
  return new Set(questions.map((q) => q.skillId));
}

export interface SelectOptions {
  /** Preferred difficulty. Falls back to any tier rather than returning none. */
  readonly tier?: 1 | 2 | 3;
  /** Ids already used this session, avoided where possible. */
  readonly exclude?: ReadonlySet<string>;
  /** Injectable for deterministic tests. */
  readonly random?: () => number;
}

/**
 * Choose a question for a topic.
 *
 * Returns undefined when the skill has no questions yet, which is the normal
 * case for most of the 41 while the bank is being written. The caller treats
 * that as "no challenge", not as an error: an unfinished bank must degrade to
 * the neutral behaviour rather than blocking the game.
 */
export function selectQuestion(
  topicId: string,
  options: SelectOptions = {},
  questions: readonly Question[] = DP600_QUESTIONS,
): Question | undefined {
  const skillId = skillIdFromTopic(topicId);
  if (skillId === undefined) return undefined;

  const forSkill = questions.filter((q) => q.skillId === skillId);
  if (forSkill.length === 0) return undefined;

  const exclude = options.exclude ?? new Set<string>();
  const unseen = forSkill.filter((q) => !exclude.has(q.id));
  const pool = unseen.length > 0 ? unseen : forSkill;

  const atTier =
    options.tier === undefined ? [] : pool.filter((q) => q.tier === options.tier);
  const candidates = atTier.length > 0 ? atTier : pool;

  const random = options.random ?? Math.random;
  const index = Math.min(
    candidates.length - 1,
    Math.floor(random() * candidates.length),
  );
  return candidates[index];
}
