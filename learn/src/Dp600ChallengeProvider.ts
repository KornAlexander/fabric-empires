/**
 * The DP-600 challenge provider.
 *
 * Supplies the real tech tree and, when a presenter and a mastery tracker are
 * injected, the whole learning loop: it asks the question, scores it, and
 * reschedules the topic through SM-2 so the engine can offer a council review
 * when it next falls due.
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
import type { MasteryTracker } from './mastery.js';

/** Presents a question to the player and resolves with how they did. */
export type QuestionPresenter = (
  request: ChallengeRequest,
) => Promise<ChallengeOutcome>;

export interface Dp600ProviderOptions {
  readonly presenter?: QuestionPresenter;
  readonly graph?: TopicGraph;
  /**
   * Where review scheduling lives. Without one the game is playable and
   * teaches nothing between sessions, which is the honest degraded mode.
   */
  readonly mastery?: MasteryTracker;
  /** Overrides the tracker entirely. Mostly useful for tests. */
  readonly due?: () => string[];
}

export class Dp600ChallengeProvider implements ChallengeProvider {
  private readonly graph: TopicGraph;
  private readonly presenter: QuestionPresenter | undefined;
  private readonly mastery: MasteryTracker | undefined;
  private readonly due: (() => string[]) | undefined;

  constructor(options: Dp600ProviderOptions = {}) {
    this.graph = options.graph ?? DP600_TOPIC_GRAPH;
    this.presenter = options.presenter;
    this.mastery = options.mastery;
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
    const outcome = await this.presenter(request);

    /*
     * Every answered challenge feeds the schedule, not just the ones labelled
     * as reviews. A battle question about workspace roles is retrieval
     * practice on workspace roles whatever the game called it, and pretending
     * otherwise would throw away most of the evidence the scheduler has.
     */
    this.mastery?.record(request.topicId, outcome.score, outcome.abandoned);
    return outcome;
  }

  dueTopics(now: number): string[] {
    if (this.due) return this.due();
    if (!this.mastery) return [];
    return this.mastery.dueTopics(
      now,
      this.graph.nodes.map((node) => node.id),
    );
  }
}
