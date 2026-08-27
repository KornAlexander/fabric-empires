// @vitest-environment jsdom
/**
 * Two ways to start, and they must stay the same way.
 *
 * ⚠️ The setup card is taller than the screen it opens on: measured at
 * 1860 px on a 1280x800 desktop and 3008 px on a 390x844 phone. For a long
 * time the only way in was a button at the very bottom of that, so a player
 * who did not care about world shape still had to scroll the whole form.
 *
 * The risk in fixing that is not the button, it is DRIFT: a second control
 * that resolves its own copy of the payload will silently disagree with the
 * first the day a tenth setting is added, and only on the path fewer people
 * take. These tests pin the two properties that make that impossible to do
 * quietly: the quick control comes FIRST in the document, and it resolves
 * exactly what Begin resolves.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_WORLD_CHOICE } from '@fabric-empires/engine';
import { createSetupScreen } from '../src/ui/setupScreen.js';

const defaults = { ...DEFAULT_WORLD_CHOICE, seed: 'FABRIC' };

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('starting without answering the form', () => {
  it('puts a start control ABOVE the form, not only under it', async () => {
    const screen = createSetupScreen();
    const settled = screen.ask(defaults);

    const quick = document.querySelector<HTMLButtonElement>('button.fe-setup-quick-play');
    const begin = document.querySelector<HTMLButtonElement>('button.fe-setup-play');
    expect(quick, 'the quick start control is missing').not.toBeNull();
    expect(begin, 'the primary Begin button is missing').not.toBeNull();

    // Document order IS the feature. A quick-start button underneath the form
    // would compile, pass a "does it exist" test, and help nobody.
    const beginFollowsQuick =
      quick!.compareDocumentPosition(begin!) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(beginFollowsQuick, 'quick start must come first in the document').toBeTruthy();

    quick!.click();
    await expect(settled).resolves.toMatchObject({ seed: 'FABRIC' });
  });

  it('starts exactly the game the Begin button would', async () => {
    const first = createSetupScreen();
    const viaQuick = first.ask(defaults);
    document.querySelector<HTMLButtonElement>('button.fe-setup-quick-play')!.click();
    const quickResult = await viaQuick;

    document.body.innerHTML = '';

    const second = createSetupScreen();
    const viaBegin = second.ask(defaults);
    document.querySelector<HTMLButtonElement>('button.fe-setup-play')!.click();
    const beginResult = await viaBegin;

    // Not field-by-field: a new setting must be covered without editing this.
    expect(quickResult).toEqual(beginResult);
  });

  it('is not a second copy of the primary button', () => {
    const screen = createSetupScreen();
    void screen.ask(defaults);
    const quick = document.querySelector<HTMLButtonElement>('button.fe-setup-quick-play')!;
    const begin = document.querySelector<HTMLButtonElement>('button.fe-setup-play')!;
    // Same job, different weight. Two identical primary bars read as a bug.
    expect(quick.className).not.toBe(begin.className);
    expect(quick.textContent).not.toBe(begin.textContent);
  });
});
