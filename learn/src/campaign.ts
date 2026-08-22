/**
 * A campaign: everything the game needs in order to teach one subject.
 *
 * ⚠️ **This is the payoff of D35, and the first thing to test whether it was
 * real.** The engine has always claimed to be a complete strategy game that
 * knows nothing about certifications. Measured before writing any of this:
 * every mention of DP-600 in `engine/` is a comment, and `unlockedBySkill` is
 * a 1-based index into the topic graph rather than a topic id, exactly as its
 * doc comment promised. So a second subject needs **no engine change at all**.
 *
 * What it does need is somewhere to put the things that are genuinely
 * subject-specific and were sitting in the wrong place: the outline, the
 * question bank, the exam's shape, and the enemies. The Silo Horde quizzes on
 * DP-600 cluster B1, which is correct for that campaign and meaningless for a
 * Year 1 class that needs Die Zahlendreher instead.
 */

import {
  ANTAGONISTS,
  minimumTopicCount,
  validateTopicGraph,
  type AntagonistDefinition,
  type TopicGraph,
} from '@fabric-empires/engine';
import { DP600_OUTLINE, buildTopicGraph, type Outline } from './outline.js';
import { DP600_QUESTIONS } from './bank.js';
import type { Question } from './questions.js';

/** Interface language a campaign is written for. */
export type CampaignLanguage = 'en' | 'de';

/**
 * How the final exam works for this subject.
 *
 * ⚠️ Per campaign, because forty questions at forty-five seconds each is a
 * reasonable professional certification and a cruel thing to do to a
 * six-year-old.
 */
export interface CampaignExam {
  /** Questions in the final paper. */
  readonly length: number;
  /** Share of the paper needed to pass, 0..1. */
  readonly passMark: number;
  /** Readiness at which the Proctor appears, 0..1. */
  readonly threshold: number;
  /** Seconds per question in the final paper. */
  readonly questionMs: number;
}

export interface Campaign {
  readonly id: string;
  /** Shown on the setup screen. */
  readonly title: string;
  readonly blurb: string;
  readonly language: CampaignLanguage;
  readonly outline: Outline;
  readonly questions: readonly Question[];
  /**
   * The enemies, one per cluster of this outline.
   *
   * Opaque cluster strings as far as the engine is concerned; the join between
   * these and the outline is checked by `validateCampaign`, because nothing
   * else would catch a renamed cluster.
   */
  readonly antagonists: readonly AntagonistDefinition[];
  readonly exam: CampaignExam;
}

export const DP600_CAMPAIGN: Campaign = Object.freeze({
  id: 'dp600',
  title: 'Fabric Empires',
  blurb:
    'The DP-600 outline is the tech tree. Rival factions each hold one branch of it: beat them and take what they know, or burn it and stay ignorant.',
  language: 'en',
  outline: DP600_OUTLINE,
  questions: DP600_QUESTIONS,
  antagonists: ANTAGONISTS,
  exam: { length: 40, passMark: 0.7, threshold: 0.8, questionMs: 45_000 },
});

export const CAMPAIGNS: readonly Campaign[] = Object.freeze([DP600_CAMPAIGN]);

export const DEFAULT_CAMPAIGN_ID = DP600_CAMPAIGN.id;

export function campaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}

/** The tech tree this campaign produces. */
export function topicsFor(campaign: Campaign): TopicGraph {
  return buildTopicGraph(campaign.outline);
}

/**
 * Everything wrong with a campaign, as a list rather than a throw.
 *
 * A content author should see all of it at once. Returning strings rather than
 * failing loudly also lets a test assert the exact problems, which is how the
 * 41-topic floor stops being invisible.
 */
export function validateCampaign(campaign: Campaign): string[] {
  const problems: string[] = [];
  const graph = topicsFor(campaign);

  problems.push(...validateTopicGraph(graph));

  /*
   * ⚠️ The floor nobody had hit.
   *
   * Units unlock at a 1-based index into the topic graph, and the table goes
   * up to 41. A curriculum with thirty topics never unlocks the unit gated at
   * forty-one: `unitUnlocked` returns false forever and nothing says why. It
   * was invisible while there was exactly one campaign, which happened to be
   * exactly long enough.
   */
  const floor = minimumTopicCount();
  if (graph.nodes.length < floor) {
    problems.push(
      `${campaign.id}: ${graph.nodes.length} topics, but units unlock up to index ${floor}. ` +
        `The last ${floor - graph.nodes.length} unit unlock(s) can never fire.`,
    );
  }

  // Every cluster in the outline needs a faction, and every faction a cluster.
  const clusters = new Set(
    campaign.outline.branches.flatMap((b) => b.clusters.map((c) => c.id)),
  );
  const held = new Set(campaign.antagonists.map((a) => a.topicCluster));

  for (const antagonist of campaign.antagonists) {
    if (!clusters.has(antagonist.topicCluster)) {
      problems.push(
        `${campaign.id}: ${antagonist.label} quizzes on "${antagonist.topicCluster}", which the outline does not define.`,
      );
    }
  }
  for (const cluster of clusters) {
    if (!held.has(cluster)) {
      problems.push(`${campaign.id}: no faction holds cluster ${cluster}.`);
    }
  }

  // A cluster with no questions cannot test anybody.
  const asked = new Set(campaign.questions.map((q) => q.cluster));
  for (const cluster of clusters) {
    if (!asked.has(cluster)) {
      problems.push(`${campaign.id}: cluster ${cluster} has no questions.`);
    }
  }

  if (campaign.exam.length < 1) {
    problems.push(`${campaign.id}: an exam of ${campaign.exam.length} questions is not an exam.`);
  }
  if (campaign.exam.passMark <= 0 || campaign.exam.passMark > 1) {
    problems.push(`${campaign.id}: pass mark ${campaign.exam.passMark} is not a share of the paper.`);
  }
  if (campaign.exam.threshold <= 0 || campaign.exam.threshold > 1) {
    problems.push(`${campaign.id}: threshold ${campaign.exam.threshold} is not a share of readiness.`);
  }

  return problems;
}
