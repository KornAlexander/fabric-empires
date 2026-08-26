import { describe, expect, it } from 'vitest';
import {
  ANTAGONIST_FACTION_ID,
  PLAYER_FACTION_ID,
  createGameState,
  planUnitAction,
  previewAttack,
  unitsOf,
  type GameState,
} from '../src/index.js';
import { HOPELESS_ASSAULT_TURNS } from '../src/rules/ai.js';

describe('scratch: will the AI ever storm a player town', () => {
  it('measures', () => {
    const base = createGameState('FABRIC');
    const player = unitsOf(base, PLAYER_FACTION_ID)[0]!;
    const cityHex = player.hex;
    const foeHex = { q: cityHex.q + 1, r: cityHex.r };

    const cities = new Map(base.cities);
    cities.set('mine', {
      id: 'mine', factionId: PLAYER_FACTION_ID, hex: cityHex, name: 'Mine',
      kind: 'workspace', hp: 200, population: 1, rank: 0, wallLevel: 0, wallHp: 0,
    } as never);
    const units = new Map();
    units.set('foe', {
      id: 'foe', typeId: 'pipelineRunner', factionId: ANTAGONIST_FACTION_ID,
      hex: foeHex, hp: 100, movesLeft: 2, fortified: false,
    });
    const state = { ...base, cities, units } as unknown as GameState;

    const preview = previewAttack(state, 'foe', cityHex);
    const perHit = preview?.expectedDamageToDefender ?? 0;
    const intent = planUnitAction(state, 'foe');

    console.log('MEASURED', JSON.stringify({
      perHit,
      turnsToTake: perHit > 0 ? 200 / perHit : null,
      threshold: HOPELESS_ASSAULT_TURNS,
      skippedAsHopeless: perHit <= 0 || 200 / perHit > HOPELESS_ASSAULT_TURNS,
      intentKind: intent?.kind,
      intentTargetKind: (intent as { targetKind?: string } | undefined)?.targetKind,
    }));
    expect(true).toBe(true);
  });
});
