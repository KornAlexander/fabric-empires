/**
 * The screen that comes before the world.
 *
 * ⚠️ It also earns its keep by covering the cold start. Section 22.2 measured
 * 8.1 seconds from load to playable on the enlarged map, and the worst thing
 * about the game was that all of it was a blank screen. A menu the player is
 * reading is the same wait, spent differently.
 */

import {
  FOCUS_OPTIONS,
  PACES,
  RIVAL_COUNTS,
  ROUGHNESS_LEVELS,
  WORLD_SHAPES,
  WORLD_SIZES,
  type FocusId,
  type PaceId,
  type RoughnessId,
  type WorldChoice,
  type WorldShapeId,
  type WorldSizeId,
} from '@fabric-empires/engine';
import { CAMPAIGNS } from '@fabric-empires/learn';

export interface SetupResult extends WorldChoice {
  readonly seed: string;
}

export interface SetupScreen {
  /** Show the screen and resolve when the player commits. */
  ask(defaults: SetupResult): Promise<SetupResult>;
  hide(): void;
  readonly isOpen: () => boolean;
}

export function createSetupScreen(): SetupScreen {
  const root = document.createElement('div');
  root.className = 'fe-setup';
  root.style.display = 'none';
  document.body.append(root);

  let showing = false;

  function optionList<T extends string>(
    title: string,
    items: readonly { id: T; label: string; detail: string }[],
    selected: T,
    onPick: (id: T) => void,
  ): HTMLElement {
    const group = new Map<T, HTMLButtonElement>();
    const wrap = document.createElement('div');
    wrap.className = 'fe-setup-group';

    const heading = document.createElement('h3');
    heading.textContent = title;
    wrap.append(heading);

    const list = document.createElement('div');
    list.className = 'fe-setup-options';

    const paint = (active: T) => {
      for (const [id, button] of group) {
        button.classList.toggle('active', id === active);
        button.setAttribute('aria-pressed', String(id === active));
      }
    };

    for (const item of items) {
      const button = document.createElement('button');
      button.className = 'fe-setup-option';
      button.type = 'button';

      const label = document.createElement('span');
      label.className = 'fe-setup-label';
      label.textContent = item.label;
      button.append(label);

      const detail = document.createElement('span');
      detail.className = 'fe-setup-detail';
      detail.textContent = item.detail;
      button.append(detail);

      button.addEventListener('click', () => {
        onPick(item.id);
        paint(item.id);
      });

      group.set(item.id, button);
      list.append(button);
    }

    wrap.append(list);
    paint(selected);
    return wrap;
  }

  const ask = (defaults: SetupResult): Promise<SetupResult> =>
    new Promise((resolve) => {
      showing = true;
      root.innerHTML = '';
      root.style.display = 'flex';

      let shape: WorldShapeId = defaults.shape;
      let roughness: RoughnessId = defaults.roughness;
      let size: WorldSizeId = defaults.size;
      let focus: FocusId = defaults.focus;
      let rivals: number = defaults.rivals;
      let pace: PaceId = defaults.pace;
      let players: 1 | 2 = defaults.players;
      let courseP1: string = defaults.courseP1;
      let courseP2: string = defaults.courseP2;

      const card = document.createElement('div');
      card.className = 'fe-setup-card';

      const title = document.createElement('h1');
      title.textContent = 'Fabric Empires';
      card.append(title);

      const blurb = document.createElement('p');
      blurb.className = 'fe-setup-blurb';
      blurb.textContent =
        'The DP-600 outline is the tech tree. Rival factions each hold one branch of it: beat them and take what they know, or burn it and stay ignorant.';
      card.append(blurb);

      const section = (label: string): HTMLElement => {
        const heading = document.createElement('h2');
        heading.className = 'fe-setup-section';
        heading.textContent = label;
        card.append(heading);
        return heading;
      };

      section('The world');
      card.append(
        optionList('Shape', WORLD_SHAPES, shape, (id) => {
          shape = id;
        }),
      );
      card.append(
        optionList('Land', ROUGHNESS_LEVELS, roughness, (id) => {
          roughness = id;
        }),
      );
      card.append(
        optionList('Size', WORLD_SIZES, size, (id) => {
          size = id;
        }),
      );

      section('The exam');
      card.append(
        optionList('Focus', FOCUS_OPTIONS, focus, (id) => {
          focus = id;
        }),
      );      card.append(
        optionList(
          'Rivals',
          RIVAL_COUNTS.map((n) => ({
            id: String(n),
            label: `${n} rivals`,
            detail:
              n === RIVAL_COUNTS[RIVAL_COUNTS.length - 1]
                ? 'Every branch of the outline has a faction holding it.'
                : `${n} of the seven clusters come at you. A shorter war.`,
          })),
          String(rivals),
          (id) => {
            rivals = Number(id);
          },
        ),
      );
      card.append(
        optionList('Pace', PACES, pace, (id) => {
          pace = id;
        }),
      );

      // Players -----------------------------------------------------------
      section('Who is playing');
      card.append(
        optionList(
          'Seats',
          [
            {
              id: '1',
              label: 'One player',
              detail: 'You answer every question yourself.',
            },
            {
              id: '2',
              label: 'Two players, together',
              detail:
                'One empire. Every battle asks you both at once, each from your own course.',
            },
          ],
          String(players),
          (id) => {
            players = id === '2' ? 2 : 1;
            paintSeats();
          },
        ),
      );

      const courseGroup = document.createElement('div');
      courseGroup.className = 'fe-setup-seats';
      courseGroup.append(
        optionList(
          'Player 1 answers with 1 2 3 4',
          CAMPAIGNS.filter((c) => c.role === 'world').map((c) => ({
            id: c.id,
            label: c.course,
            detail: c.blurb,
          })),
          courseP1,
          (id) => {
            courseP1 = id;
          },
        ),
      );
      // ⚠️ Only player one's course may build the world, so the second seat is
      // offered every course including the question-only ones.
      courseGroup.append(
        optionList(
          'Player 2 answers with A B C D',
          CAMPAIGNS.map((c) => ({ id: c.id, label: c.course, detail: c.blurb })),
          courseP2,
          (id) => {
            courseP2 = id;
          },
        ),
      );
      card.append(courseGroup);

      const paintSeats = (): void => {
        courseGroup.style.display = players === 2 ? '' : 'none';
      };
      paintSeats();

      // Seed --------------------------------------------------------------
      const seedGroup = document.createElement('div');
      seedGroup.className = 'fe-setup-group';
      const seedHeading = document.createElement('h3');
      seedHeading.textContent = 'The seed';
      seedGroup.append(seedHeading);

      const seedRow = document.createElement('div');
      seedRow.className = 'fe-setup-seed';
      const seedInput = document.createElement('input');
      seedInput.value = defaults.seed;
      seedInput.spellcheck = false;
      seedInput.setAttribute('aria-label', 'World seed');
      seedRow.append(seedInput);

      const seedNote = document.createElement('span');
      seedNote.className = 'fe-setup-detail';
      seedNote.textContent = 'Same seed and same choices, same world. Send one to a friend.';
      seedRow.append(seedNote);
      seedGroup.append(seedRow);
      card.append(seedGroup);

      // Commit -------------------------------------------------------------
      const play = document.createElement('button');
      play.className = 'fe-setup-play';
      play.type = 'button';
      play.textContent = 'Begin';
      const commit = () => {
        if (!showing) return;
        showing = false;
        root.style.display = 'none';
        root.innerHTML = '';
        resolve({
          shape,
          roughness,
          size,
          focus,
          rivals,
          pace,
          players,
          courseP1,
          courseP2,
          seed: seedInput.value.trim() || defaults.seed,
        });
      };
      play.addEventListener('click', commit);
      seedInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commit();
      });
      card.append(play);

      root.append(card);
      play.focus();
    });

  return {
    ask,
    hide: () => {
      showing = false;
      root.style.display = 'none';
    },
    isOpen: () => showing,
  };
}
