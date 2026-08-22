/**
 * Campaigns.
 *
 * ⚠️ **These tests are the D35 claim, written down as assertions.** The engine
 * has always said it is a complete strategy game that knows nothing about
 * certifications, and until there was a second subject that was an untested
 * belief. What is checked here is not that DP-600 works, which the rest of the
 * suite covers, but that the things a SECOND campaign will depend on are real:
 * that the engine needs no knowledge of the subject, that a campaign long
 * enough to unlock every unit is required rather than hoped for, and that the
 * join between an outline's clusters and its factions is validated rather than
 * assumed.
 */

import { describe, expect, it } from 'vitest';
import {
  createGameState,
  minimumTopicCount,
  unitsOf,
  PLAYER_FACTION_ID,
  UNIT_TYPES,
  type AntagonistDefinition,
} from '@fabric-empires/engine';
import {
  CAMPAIGNS,
  DEFAULT_CAMPAIGN_ID,
  DP600_CAMPAIGN,
  campaignById,
  topicsFor,
  validateCampaign,
  type Campaign,
} from '../src/index.js';

describe('the campaign registry', () => {
  it('has a default that exists', () => {
    expect(campaignById(DEFAULT_CAMPAIGN_ID)).toBeDefined();
  });

  it('gives every campaign a unique id', () => {
    const ids = CAMPAIGNS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns nothing for an unknown id rather than throwing', () => {
    expect(campaignById('klasse-99')).toBeUndefined();
  });

  it('validates every shipped campaign', () => {
    for (const campaign of CAMPAIGNS) {
      expect(validateCampaign(campaign), campaign.id).toEqual([]);
    }
  });
});

describe('⚠️ the 41 topic floor', () => {
  it('is computed from the unit table, not written down', () => {
    const highest = Object.values(UNIT_TYPES).reduce(
      (most, type) => Math.max(most, type.unlockedBySkill ?? 0),
      0,
    );
    expect(minimumTopicCount()).toBe(highest);
    // If this ever drops to zero the check below becomes meaningless.
    expect(minimumTopicCount()).toBeGreaterThan(0);
  });

  it('is met by the shipped campaign', () => {
    expect(topicsFor(DP600_CAMPAIGN).nodes.length).toBeGreaterThanOrEqual(
      minimumTopicCount(),
    );
  });

  it('is reported, loudly, when a campaign is too short', () => {
    /*
     * The failure this exists to prevent: a Year 1 curriculum with thirty
     * topics would look completely fine, and its last unit unlocks would
     * simply never fire, forever, with nothing anywhere saying why.
     */
    const short: Campaign = {
      ...DP600_CAMPAIGN,
      id: 'too-short',
      outline: {
        ...DP600_CAMPAIGN.outline,
        branches: DP600_CAMPAIGN.outline.branches.slice(0, 1),
      },
    };
    const problems = validateCampaign(short);
    expect(problems.join(' ')).toContain('unit unlock');
  });
});

describe('the outline and the factions must agree', () => {
  const roster = (over: Partial<AntagonistDefinition>[]): AntagonistDefinition[] =>
    DP600_CAMPAIGN.antagonists.map((a, i) => ({ ...a, ...(over[i] ?? {}) }));

  it('complains when a faction quizzes on a cluster that does not exist', () => {
    const broken: Campaign = {
      ...DP600_CAMPAIGN,
      id: 'renamed',
      antagonists: roster([{ topicCluster: 'Z9' }]),
    };
    const problems = validateCampaign(broken).join(' ');
    expect(problems).toContain('Z9');
    expect(problems).toContain('does not define');
  });

  it('complains when a cluster has no faction to hold it', () => {
    const broken: Campaign = {
      ...DP600_CAMPAIGN,
      id: 'orphan',
      antagonists: DP600_CAMPAIGN.antagonists.slice(0, -1),
    };
    expect(validateCampaign(broken).join(' ')).toContain('no faction holds');
  });

  it('complains when a cluster has no questions', () => {
    const broken: Campaign = {
      ...DP600_CAMPAIGN,
      id: 'unasked',
      questions: DP600_CAMPAIGN.questions.filter((q) => q.cluster !== 'B1'),
    };
    expect(validateCampaign(broken).join(' ')).toContain('B1 has no questions');
  });
});

describe('the exam settings are per campaign', () => {
  it('rejects an exam of no questions', () => {
    const broken: Campaign = {
      ...DP600_CAMPAIGN,
      id: 'empty-exam',
      exam: { ...DP600_CAMPAIGN.exam, length: 0 },
    };
    expect(validateCampaign(broken).join(' ')).toContain('not an exam');
  });

  it('rejects a pass mark that is not a share', () => {
    for (const passMark of [0, 1.5, -0.2]) {
      const broken: Campaign = {
        ...DP600_CAMPAIGN,
        id: 'bad-mark',
        exam: { ...DP600_CAMPAIGN.exam, passMark },
      };
      expect(validateCampaign(broken).join(' '), String(passMark)).toContain('pass mark');
    }
  });
});

describe('⚠️ the engine takes a roster it knows nothing about', () => {
  /*
   * The whole point. These factions quiz on clusters from an invented
   * curriculum, and the engine places them, gives them villages and fights
   * them without any idea what subject it is teaching.
   */
  const GERMAN_ROSTER: AntagonistDefinition[] = [
    { id: 'zahlendreher', label: 'Die Zahlendreher', topicCluster: 'M1', colour: '#b5533f', seat: 'Zahlenburg', seatKind: 'lakehouse' },
    { id: 'silbenschlucker', label: 'Die Silbenschlucker', topicCluster: 'D1', colour: '#4f7f7a', seat: 'Silbenhain', seatKind: 'eventhouse' },
    { id: 'punktvergesser', label: 'Die Punktvergesser', topicCluster: 'D2', colour: '#8a6fb0', seat: 'Satzende', seatKind: 'warehouse' },
  ];

  it('spawns a roster the engine has never seen', () => {
    const state = createGameState('KLASSE1', { antagonists: GERMAN_ROSTER });

    expect([...state.factions.keys()]).toHaveLength(GERMAN_ROSTER.length + 1);
    for (const antagonist of GERMAN_ROSTER) {
      expect(state.factions.get(antagonist.id)?.label).toBe(antagonist.label);
      expect(state.factions.get(antagonist.id)?.topicCluster).toBe(antagonist.topicCluster);
    }
  });

  it('gives each of them a village with the name the campaign chose', () => {
    const state = createGameState('KLASSE1', { antagonists: GERMAN_ROSTER });
    const seats = [...state.cities.values()].map((c) => c.name).sort();
    expect(seats).toEqual(['Satzende', 'Silbenhain', 'Zahlenburg']);
  });

  it('still lets the player choose a subset of that roster', () => {
    const state = createGameState('KLASSE1', {
      antagonists: GERMAN_ROSTER,
      antagonistIds: ['zahlendreher'],
    });
    expect([...state.factions.keys()]).toHaveLength(2);
    expect(state.factions.has('zahlendreher')).toBe(true);
  });

  it('leaves the player exactly as they always were', () => {
    // A different curriculum must not change how a game starts.
    const german = createGameState('FABRIC', { antagonists: GERMAN_ROSTER });
    const normal = createGameState('FABRIC');
    expect(unitsOf(german, PLAYER_FACTION_ID).map((u) => u.typeId)).toEqual(
      unitsOf(normal, PLAYER_FACTION_ID).map((u) => u.typeId),
    );
  });

  it('falls back to the built-in roster when handed an empty one', () => {
    // Better a normal game than a world with nobody in it.
    const state = createGameState('FABRIC', { antagonists: [] });
    expect([...state.factions.keys()].length).toBeGreaterThan(1);
  });
});

describe('⚠️ a course is not a world', () => {
  /*
   * Both names exist because they are read in different places and only one
   * of them answers "what am I being asked about". DP-600's world is called
   * Fabric Empires, which is a fine name for a world and tells a player
   * nothing when it sits on a seat beside "1. Klasse: Mathe und Deutsch".
   */
  it('names the subject on every campaign', () => {
    for (const campaign of CAMPAIGNS) {
      expect(campaign.course.trim(), campaign.id).not.toBe('');
    }
  });

  it('gives the two seats labels a player can tell apart', () => {
    const courses = CAMPAIGNS.map((c) => c.course);
    expect(new Set(courses).size).toBe(courses.length);
  });

  it('says which certification the DP-600 course is', () => {
    // The submission is a DP-600 study aid, so the exam code has to appear.
    expect(DP600_CAMPAIGN.course).toContain('DP-600');
  });
});

describe('⚠️ the second seat', () => {
  const klasse1 = campaignById('klasse1');

  it('is registered', () => {
    expect(klasse1).toBeDefined();
  });

  it('supplies questions without claiming to build a world', () => {
    expect(klasse1?.role).toBe('questions');
    expect(klasse1?.antagonists).toEqual([]);
  });

  it('⚠️ is exempt from the rules that would otherwise reject it', () => {
    /*
     * This exemption IS the feature. A Year 1 curriculum has 24 skills where
     * a world needs 41, and no business fielding armies. Without `role`, the
     * only way to let a six-year-old play would be to weaken the check that
     * stops a short DP-600 outline shipping with dead unit unlocks.
     */
    expect(validateCampaign(klasse1!)).toEqual([]);
    expect(topicsFor(klasse1!).nodes.length).toBeLessThan(minimumTopicCount());
  });

  it('still refuses a short campaign that does claim to build a world', () => {
    const overreaching: Campaign = { ...klasse1!, id: 'overreach', role: 'world' };
    expect(validateCampaign(overreaching).join(' ')).toContain('unit unlock');
  });

  it('asks in German', () => {
    expect(klasse1?.language).toBe('de');
  });

  it('asks a six-year-old a shorter question than an exam candidate', () => {
    // D216: a stem has to be readable by somebody still learning to read.
    for (const question of klasse1!.questions) {
      expect(question.stem.length, question.stem).toBeLessThanOrEqual(60);
    }
    const longest = Math.max(...DP600_CAMPAIGN.questions.map((q) => q.stem.length));
    expect(longest).toBeGreaterThan(60);
  });

  it('gives them a gentler paper than the real certification', () => {
    expect(klasse1!.exam.length).toBeLessThan(DP600_CAMPAIGN.exam.length);
    expect(klasse1!.exam.questionMs).toBeGreaterThan(DP600_CAMPAIGN.exam.questionMs);
  });

  it('covers both subjects rather than only the maths', () => {
    const branches = new Set(klasse1!.questions.map((q) => q.cluster[0]));
    expect([...branches].sort()).toEqual(['D', 'M']);
  });
});
