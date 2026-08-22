/**
 * The DP-600 outline, and its translation into a tech tree.
 *
 * The engine knows nothing about certifications (D35). This module is the
 * bridge: it reads the published skills-measured outline and emits a
 * `TopicGraph`, which is the only shape the engine understands.
 *
 * Skill labels are verbatim from the outline. The whole premise of the game is
 * that researching the tech tree is reading the exam blueprint, and that stops
 * being true the moment a label is "improved".
 */

import {
  validateTopicGraph,
  type TopicGraph,
  type TopicNode,
} from '@fabric-empires/engine';
import outlineJson from '../content/dp-600/outline.json' with { type: 'json' };

export interface OutlineSkill {
  readonly id: number;
  readonly label: string;
}

export interface OutlineCluster {
  readonly id: string;
  readonly label: string;
  readonly skills: readonly OutlineSkill[];
}

export interface OutlineBranch {
  readonly id: string;
  readonly label: string;
  /** Published exam weighting, as a percentage range. */
  readonly weightMin: number;
  readonly weightMax: number;
  readonly clusters: readonly OutlineCluster[];
}

export interface Outline {
  readonly cert: string;
  readonly title: string;
  readonly revision: string;
  readonly source: string;
  readonly branches: readonly OutlineBranch[];
}

export const DP600_OUTLINE: Outline = outlineJson as Outline;

/** Research cost of a gateway skill, which opens the rest of its cluster. */
export const GATEWAY_WEIGHT = 2;
export const SKILL_WEIGHT = 1;

export function topicIdFor(skillId: number): string {
  return `dp600-${skillId}`;
}

/**
 * The skill number inside a topic id.
 *
 * ⚠️ **Any campaign prefix, not just `dp600-`.** This was pinned to DP-600,
 * which was correct while there was one curriculum and silently wrong the
 * moment a second seat asked from another bank: `selectQuestion` would return
 * undefined for every topic, the presenter would score it neutral, and a
 * child would sit in front of a game that never asked them anything. Nothing
 * would have thrown.
 *
 * The shape is `<campaign>-<number>`, so the number is what follows the last
 * hyphen.
 */
export function skillIdFromTopic(topicId: string): number | undefined {
  const match = /-(\d+)$/.exec(topicId);
  return match ? Number(match[1]) : undefined;
}

export function allSkills(outline: Outline = DP600_OUTLINE): OutlineSkill[] {
  return outline.branches.flatMap((branch) =>
    branch.clusters.flatMap((cluster) => cluster.skills),
  );
}

export function clusterOf(
  skillId: number,
  outline: Outline = DP600_OUTLINE,
): { branch: OutlineBranch; cluster: OutlineCluster } | undefined {
  for (const branch of outline.branches) {
    for (const cluster of branch.clusters) {
      if (cluster.skills.some((s) => s.id === skillId)) return { branch, cluster };
    }
  }
  return undefined;
}

/**
 * Build the tech tree.
 *
 * Shape: each cluster's first skill is a **gateway**. A gateway requires the
 * previous cluster's gateway in the same branch, and every other skill in the
 * cluster requires its own gateway.
 *
 * That produces three parallel branches that fan out rather than one long
 * chain, and it means the three exam domains can genuinely be researched in
 * any order, which is how people actually study. Because branch B has 18 of
 * the 41 nodes, the tree is visibly dominated by "Prepare data", exactly as
 * the exam is.
 */
export function buildTopicGraph(outline: Outline = DP600_OUTLINE): TopicGraph {
  const nodes: TopicNode[] = [];

  for (const branch of outline.branches) {
    let previousGateway: string | undefined;

    for (const cluster of branch.clusters) {
      const [gateway, ...rest] = cluster.skills;
      if (!gateway) continue;

      const gatewayId = topicIdFor(gateway.id);
      nodes.push({
        id: gatewayId,
        label: gateway.label,
        cluster: cluster.id,
        requires: previousGateway ? [previousGateway] : [],
        weight: GATEWAY_WEIGHT,
      });

      for (const skill of rest) {
        nodes.push({
          id: topicIdFor(skill.id),
          label: skill.label,
          cluster: cluster.id,
          requires: [gatewayId],
          weight: SKILL_WEIGHT,
        });
      }

      previousGateway = gatewayId;
    }
  }

  return { nodes };
}

export const DP600_TOPIC_GRAPH: TopicGraph = buildTopicGraph();

/** Problems with the built graph, for a content test to assert is empty. */
export function validateDp600Graph(): string[] {
  return validateTopicGraph(DP600_TOPIC_GRAPH);
}

/** Share of the tree, by node count, belonging to each branch. */
export function branchShares(
  outline: Outline = DP600_OUTLINE,
): { id: string; label: string; nodes: number; share: number }[] {
  const total = allSkills(outline).length;
  return outline.branches.map((branch) => {
    const nodes = branch.clusters.reduce((sum, c) => sum + c.skills.length, 0);
    return {
      id: branch.id,
      label: branch.label,
      nodes,
      share: nodes / total,
    };
  });
}
