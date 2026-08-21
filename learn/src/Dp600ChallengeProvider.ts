/**
 * The DP-600 challenge provider.
 *
 * Supplies the real tech tree today. Question presentation is delegated to an
 * injected presenter, which does not exist yet: the question bank is the next
 * piece of work.
 *
 * The fallback is deliberately NEUTRAL rather than a fake correct answer. A
 * provider that silently reported success would make the game look finished
 * while teaching nothing, which is the failure mode most worth avoiding here.
 */

import {
  NEUTRAL_OUTCOME,
  type ChallengeOutcome,
  type ChallengeProvider,
  type ChallengeRequest,
  type TopicGraph,
} from '@fabric-empires/engine';
import { DP600_TOPIC_GRAPH } from './outline.js';

/** Presents a question to the player and resolves with how they did. */
export type QuestionPresenter = (
  request: ChallengeRequest,
) => Promise<ChallengeOutcome>;

export interface Dp600ProviderOptions {
  readonly presenter?: QuestionPresenter;
  readonly graph?: TopicGraph;
  /** Topic ids currently due for review. Wired to SM-2 later. */
  readonly due?: () => string[];
}

export class Dp600ChallengeProvider implements ChallengeProvider {
  private readonly graph: TopicGraph;
  private readonly presenter: QuestionPresenter | undefined;
  private readonly due: (() => string[]) | undefined;

  constructor(options: Dp600ProviderOptions = {}) {
    this.graph = options.graph ?? DP600_TOPIC_GRAPH;
    this.presenter = options.presenter;
    this.due = options.due;
  }

  /** True once a real question bank is wired in. */
  get hasQuestions(): boolean {
    return this.presenter !== undefined;
  }

  topics(): TopicGraph {
    return this.graph;
  }

  async present(request: ChallengeRequest): Promise<ChallengeOutcome> {
    if (!this.presenter) return NEUTRAL_OUTCOME;
    return this.presenter(request);
  }

  dueTopics(_now: number): string[] {
    return this.due ? this.due() : [];
  }
}
