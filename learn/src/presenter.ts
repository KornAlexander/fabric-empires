/**
 * Turning a question into a ChallengeOutcome.
 *
 * The presenter owns everything the engine must not see: the question, the
 * answer, the explanation and the scoring curve. It hands back a single number
 * in -1..+1 (D35).
 *
 * The UI is injected, so the whole loop is testable headlessly. A test drives
 * it with a scripted answerer and asserts the score, which is not something a
 * DOM-bound implementation would allow.
 */

import type {
  ChallengeOutcome,
  ChallengeRequest,
} from '@fabric-empires/engine';
import { checkAnswer, decryptExplanation } from './crypto.js';
import { selectQuestion, type SelectOptions } from './bank.js';
import { candidateAnswers, type Question } from './questions.js';

/**
 * Recover the correct answer by testing every candidate against the stored
 * hash.
 *
 * ⚠️ This is the brute force the plan already described as trivial, performed
 * by the app itself. It means the answer obfuscation is decorative for a
 * multiple-choice item, and that is a deliberate trade: telling a learner
 * nothing at the exact moment they are most receptive is a worse failure than
 * a determined player recovering an answer they could have recovered anyway.
 *
 * The hashing still earns its place: the shipped JSON is not a readable answer
 * key, which was always the only claim worth making.
 */
export async function revealCorrectAnswer(
  question: Question,
): Promise<string | string[] | undefined> {
  for (const candidate of candidateAnswers(question)) {
    if (await checkAnswer(question.id, candidate, question.answerHash)) {
      return candidate;
    }
  }
  return undefined;
}

export interface QuestionPrompt {
  readonly question: Question;
  readonly request: ChallengeRequest;
}

export interface QuestionAnswer {
  /**
   * What the player chose. Explicitly allows undefined as well as being
   * optional, so a caller can pass `{ answer: undefined }` to mean "no answer"
   * without fighting exactOptionalPropertyTypes.
   */
  readonly answer?: string | readonly string[] | undefined;
  readonly elapsedMs: number;
  readonly abandoned: boolean;
}

export interface QuestionResult {
  readonly question: Question;
  readonly correct: boolean;
  readonly given: string | readonly string[] | undefined;
  /**
   * The right answer, so a learner who missed is corrected rather than left
   * guessing. Present whether they were right or wrong.
   */
  readonly correctAnswer: string | string[] | undefined;
  readonly explanation: string | undefined;
  readonly score: number;
  readonly elapsedMs: number;
}

export interface QuestionUi {
  ask(prompt: QuestionPrompt): Promise<QuestionAnswer>;
  reveal(result: QuestionResult): Promise<void>;
}

/**
 * Score curve, from the plan.
 *
 * Speed is a bonus and never an extra penalty: a slow correct answer still
 * scores well, because taking time to think is not a mistake.
 */
export const SCORE_CORRECT_FAST = 1;
export const SCORE_CORRECT = 0.6;
export const SCORE_TIMEOUT = -0.6;
export const SCORE_WRONG = -1;

export function scoreFor(
  correct: boolean,
  elapsedMs: number,
  timeLimitMs: number,
  abandoned: boolean,
): number {
  if (abandoned) return SCORE_TIMEOUT;
  if (!correct) return SCORE_WRONG;
  return elapsedMs <= timeLimitMs / 2 ? SCORE_CORRECT_FAST : SCORE_CORRECT;
}

export interface PresenterOptions extends SelectOptions {
  /** Questions already asked, so a session repeats itself as little as possible. */
  readonly asked?: Set<string>;
  /**
   * The pool to draw from. Defaults to the whole bank.
   *
   * Exists so the empty-bank path stays testable now that every skill in the
   * outline has questions. It also gives a future exam mode somewhere to pass
   * a restricted set without the presenter needing to know why.
   */
  readonly questions?: readonly Question[];
}

/**
 * Build a presenter around a UI.
 *
 * When the topic has no question yet, it resolves neutral without troubling
 * the player. That is the honest behaviour for a bank still being written: the
 * game continues, and knowledge simply contributes nothing on that topic.
 */
export function createQuestionPresenter(
  ui: QuestionUi,
  options: PresenterOptions = {},
): (request: ChallengeRequest) => Promise<ChallengeOutcome> {
  const asked = options.asked ?? new Set<string>();
  const { questions: pool, ...selectOptions } = options;

  return async function present(
    request: ChallengeRequest,
  ): Promise<ChallengeOutcome> {
    const question = selectQuestion(
      request.topicId,
      { tier: request.tier, exclude: asked, ...selectOptions },
      pool,
    );

    if (!question) {
      return { score: 0, elapsedMs: 0, abandoned: false };
    }
    asked.add(question.id);

    const given = await ui.ask({ question, request });
    const answered = given.answer;

    const correct =
      !given.abandoned &&
      answered !== undefined &&
      (Array.isArray(answered) ? answered.length > 0 : String(answered).length > 0) &&
      (await checkAnswer(question.id, answered, question.answerHash));

    const score = scoreFor(
      correct,
      given.elapsedMs,
      request.timeLimitMs,
      given.abandoned,
    );

    // Teach on the way out, whatever happened. A learner who was wrong sees
    // the right answer and the reasoning; the spaced repetition system will
    // bring the item back regardless.
    const correctAnswer = correct
      ? (answered as string | string[])
      : await revealCorrectAnswer(question);

    const explanation =
      correctAnswer === undefined
        ? undefined
        : await decryptExplanation(
            question.id,
            correctAnswer,
            question.explanationCipher,
          );

    await ui.reveal({
      question,
      correct,
      given: answered,
      correctAnswer,
      explanation,
      score,
      elapsedMs: given.elapsedMs,
    });

    return { score, elapsedMs: given.elapsedMs, abandoned: given.abandoned };
  };
}
