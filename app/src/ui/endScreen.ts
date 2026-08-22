import type { Outcome } from '@fabric-empires/engine';

/**
 * How a game ended.
 *
 * A superset of the engine's outcome, because the Exam victory is not an
 * engine concept and must not become one: it is a statement about weighted
 * readiness against a published certification outline, which the rules layer
 * is not allowed to know exists (D35).
 */
export type EndOutcome = Outcome | { readonly kind: 'exam'; readonly summary: string };

/**
 * The end of a game.
 *
 * Until now a finished game just kept going: the player could press End Turn
 * forever with nothing left to command, and the only sign was a line in the
 * log that scrolled away. An ending has to interrupt, which is the one thing
 * a log entry is designed not to do.
 *
 * ⚠️ It offers a new empire rather than closing back to the map. There is
 * nothing to go back to: on a defeat there is nothing to command, and on a
 * victory there is nothing left to take. A dismissable overlay would only
 * leave the player pressing a button that no longer does anything.
 */

const STYLE = `
.fe-end {
  position: fixed; inset: 0; z-index: 60; display: none;
  align-items: center; justify-content: center;
  background: rgba(5, 8, 13, 0.72); backdrop-filter: blur(4px);
  font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; color: #e8eaf0;
}
.fe-end[data-open='true'] { display: flex; }
.fe-end-card {
  width: min(460px, 92vw); padding: 26px 28px; text-align: center;
  background: rgba(14, 18, 26, 0.96); border: 1px solid rgba(255,255,255,0.14);
  border-radius: 12px; box-shadow: 0 24px 70px rgba(0,0,0,0.55);
}
.fe-end-kind {
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  color: #7f96ad; margin-bottom: 6px;
}
.fe-end-card h2 { margin: 0 0 10px; font-size: 25px; }
.fe-end-card p { margin: 0 0 18px; color: #b9c7d6; }
.fe-end-stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  margin-bottom: 20px; padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.09);
  border-bottom: 1px solid rgba(255,255,255,0.09);
}
.fe-end-stats div { display: flex; flex-direction: column; gap: 3px; }
.fe-end-stats b { font-size: 19px; font-variant-numeric: tabular-nums; }
.fe-end-stats span { font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; color: #7f96ad; }
.fe-end button {
  font: inherit; font-weight: 600; padding: 9px 20px; cursor: pointer;
  color: #08101c; background: #6fb3ff; border: none; border-radius: 6px;
}
.fe-end button:hover { background: #8cc4ff; }
.fe-end.win h2 { color: #8fd694; }
.fe-end.lose h2 { color: #ff9b91; }
.fe-end-cheats {
  margin: -8px 0 16px; font-size: 11px; line-height: 1.5;
  color: #ffcf7a;
}
`;

export interface EndScreenStats {
  readonly turn: number;
  readonly skills: string;
  readonly cities: number;
  /**
   * Cheat codes used in this game.
   *
   * ⚠️ Shown, always. A study tool must never let somebody finish believing an
   * empire was won unaided when it was not, because the next inference they
   * draw is about themselves.
   */
  readonly cheats: readonly string[];
}

export interface EndScreen {
  show(outcome: EndOutcome, stats: EndScreenStats): void;
  hide(): void;
  readonly isOpen: boolean;
}

const TITLES: Record<EndOutcome['kind'], string> = {
  defeat: 'Your empire has fallen',
  domination: 'Domination',
  science: 'Every skill mastered',
  exam: 'The Proctor is satisfied',
};

export function createEndScreen(onNewGame: () => void): EndScreen {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);

  const root = document.createElement('div');
  root.className = 'fe-end';
  root.dataset.testid = 'end-screen';
  root.dataset.open = 'false';
  root.innerHTML = `
    <div class="fe-end-card">
      <div class="fe-end-kind" data-f="kind"></div>
      <h2 data-f="title"></h2>
      <p data-f="summary"></p>
      <div class="fe-end-stats">
        <div><b data-f="turn">-</b><span>turns</span></div>
        <div><b data-f="skills">-</b><span>skills</span></div>
        <div><b data-f="cities">-</b><span>cities</span></div>
      </div>
      <p class="fe-end-cheats" data-f="cheats" hidden></p>
      <button type="button" data-f="again">New empire</button>
    </div>
  `;
  document.body.append(root);

  const field = (name: string) => root.querySelector<HTMLElement>(`[data-f="${name}"]`);
  let open = false;

  root.querySelector<HTMLButtonElement>('[data-f="again"]')!.addEventListener('click', () => {
    hide();
    onNewGame();
  });

  function hide(): void {
    open = false;
    root.dataset.open = 'false';
  }

  return {
    show(outcome, stats) {
      open = true;
      root.classList.toggle('win', outcome.kind !== 'defeat');
      root.classList.toggle('lose', outcome.kind === 'defeat');
      const kind = field('kind');
      if (kind) kind.textContent = outcome.kind === 'defeat' ? 'Defeat' : 'Victory';
      const title = field('title');
      if (title) title.textContent = TITLES[outcome.kind];
      const summary = field('summary');
      if (summary) summary.textContent = outcome.summary;
      const turn = field('turn');
      if (turn) turn.textContent = String(stats.turn);
      const skills = field('skills');
      if (skills) skills.textContent = stats.skills;
      const cities = field('cities');
      if (cities) cities.textContent = String(stats.cities);

      const cheats = field('cheats');
      if (cheats) {
        const used = stats.cheats;
        cheats.hidden = used.length === 0;
        if (used.length > 0) {
          const unique = [...new Set(used)];
          cheats.textContent =
            `This empire had help: ${unique.join(', ')}. ` +
            'Your readiness figure did not, and never does.';
        }
      }
      root.dataset.open = 'true';
      root.dataset.kind = outcome.kind;
    },
    hide,
    get isOpen() {
      return open;
    },
  };
}
