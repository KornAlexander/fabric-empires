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
import type { Question } from './questions.js';

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
  /** Decrypted only when the answer was right, by construction. */
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

  return async function present(
    request: ChallengeRequest,
  ): Promise<ChallengeOutcome> {
    const question = selectQuestion(
      request.topicId,
      { tier: request.tier, exclude: asked, ...options },
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

    const explanation = correct
      ? await decryptExplanation(question.id, answered!, question.explanationCipher)
      : undefined;

    await ui.reveal({
      question,
      correct,
      given: answered,
      explanation,
      score,
      elapsedMs: given.elapsedMs,
    });

    return { score, elapsedMs: given.elapsedMs, abandoned: given.abandoned };
  };
}
