/**
 * The screen that comes before the world.
 *
 * ⚠️ It also earns its keep by covering the cold start. Section 22.2 measured
 * 8.1 seconds from load to playable on the enlarged map, and the worst thing
 * about the game was that all of it was a blank screen. A menu the player is
 * reading is the same wait, spent differently.
 */

import {
  ROUGHNESS_LEVELS,
  WORLD_SHAPES,
  type RoughnessId,
  type WorldChoice,
  type WorldShapeId,
} from '@fabric-empires/engine';

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

      const card = document.createElement('div');
      card.className = 'fe-setup-card';

      const title = document.createElement('h1');
      title.textContent = 'Fabric Empires';
      card.append(title);

      const blurb = document.createElement('p');
      blurb.className = 'fe-setup-blurb';
      blurb.textContent =
        'Seven rival factions hold the exam between them. Take what you need to know, or burn it and stay ignorant.';
      card.append(blurb);

      card.append(
        optionList('The world', WORLD_SHAPES, shape, (id) => {
          shape = id;
        }),
      );
      card.append(
        optionList('The land', ROUGHNESS_LEVELS, roughness, (id) => {
          roughness = id;
        }),
      );

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
        resolve({ shape, roughness, seed: seedInput.value.trim() || defaults.seed });
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
