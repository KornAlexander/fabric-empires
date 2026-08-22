/**
 * Two languages.
 *
 * ⚠️ **The design choice being tested is that a missing translation is
 * harmless.** Translations are keyed by the English string itself, so `t()`
 * falls back to the text it was handed. That is what let a 250 string pass
 * happen ten days before a deadline without the game being broken in between,
 * and it is also the thing most likely to hide a gap: an untranslated string
 * looks exactly like a translated one until you play in German.
 *
 * So the coverage check below is not decoration. It is the only thing standing
 * between "falls back gracefully" and "half the game is quietly English".
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { lang, plural, setLang, t, translatedKeys } from '../src/i18n.js';

afterEach(() => setLang('en'));

const source = (relative: string): string =>
  readFileSync(resolve(process.cwd(), `app/src/${relative}`), 'utf8');

/** Every string literal handed to `t(...)` anywhere in the app. */
function literalsPassedToT(): string[] {
  const files = [
    'main.ts',
    'i18n.ts',
    'ui/setupScreen.ts',
    'ui/duoModal.ts',
    'ui/coursePanel.ts',
    'intro.ts',
  ];
  const found = new Set<string>();
  for (const file of files) {
    const code = source(file);
    // t('...') and plural(n, '...', '...') with single quotes only, which is
    // the house style for these strings.
    for (const m of code.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)) found.add(m[1]!);
    for (const m of code.matchAll(/\bplural\([^,]+,\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'/g)) {
      found.add(m[1]!);
      found.add(m[2]!);
    }
  }
  return [...found];
}

describe('the switch', () => {
  it('starts in one of the two languages', () => {
    expect(['en', 'de']).toContain(lang());
  });

  it('changes what comes back', () => {
    setLang('en');
    expect(t('End turn')).toBe('End turn');
    setLang('de');
    expect(t('End turn')).toBe('Zug beenden');
  });

  it('⚠️ falls back to English rather than to a broken key', () => {
    setLang('de');
    const nonsense = 'A sentence nobody has translated yet.';
    expect(t(nonsense)).toBe(nonsense);
  });

  it('fills placeholders in both languages', () => {
    setLang('en');
    expect(t('Turn {n}', { n: 7 })).toBe('Turn 7');
    setLang('de');
    expect(t('Turn {n}', { n: 7 })).toBe('Runde 7');
  });

  it('leaves an unknown placeholder alone instead of printing undefined', () => {
    expect(t('Turn {n}', {})).toBe('Turn {n}');
  });

  it('picks singular and plural before translating', () => {
    setLang('de');
    expect(plural(1, '{n} more citizen', '{n} more citizens')).toBe('1 Einwohner mehr');
    expect(plural(3, '{n} more citizen', '{n} more citizens')).toBe('3 Einwohner mehr');
  });
});

describe('⚠️ coverage', () => {
  it('translates every string the app asks it to translate', () => {
    const asked = literalsPassedToT();
    const known = new Set(translatedKeys());
    const missing = asked.filter((s) => !known.has(s)).sort();

    expect(asked.length, 'no t() calls found, the scan must be broken').toBeGreaterThan(40);
    expect(
      missing,
      `${missing.length} strings reach t() with no German behind them`,
    ).toEqual([]);
  });

  it('has no German entry that is just the English again', () => {
    /*
     * A few are legitimately identical, and they are listed here so that
     * adding a new one is a decision rather than an oversight. "Land" and
     * "Standard" really are the same word in German; the rest are product
     * terms that must not be translated at all.
     */
    const allowed = new Set(['Standard', 'Land', 'Data', 'DAX']);
    setLang('de');
    const lazy = translatedKeys().filter((k) => !allowed.has(k) && t(k) === k);
    expect(lazy, 'these look untranslated').toEqual([]);
  });

  it('⚠️ leaves the exam vocabulary in English', () => {
    /*
     * The DP-600 paper is sat in English and its terminology is the subject.
     * Somebody who revises a translated "Direktsee" has learned a word that
     * will not appear on it. Product names are not words.
     */
    setLang('de');
    for (const term of ['Compute', 'Lakehouse', 'Direct Lake', 'Workspace']) {
      expect(t(term), `${term} must not be translated`).toBe(term);
    }
  });
});

describe('German text quality', () => {
  it('uses real umlauts and eszett, never ae oe ue ss', () => {
    setLang('de');
    // If a translation had been typed with ASCII replacements this catches it:
    // every one of these is a word that must contain a real umlaut.
    expect(t('Cities')).toBe('Städte');
    expect(t('Size')).toBe('Größe');
    expect(t('Skip')).toBe('Überspringen');
  });

  it('never uses an em dash or en dash', () => {
    // House rule, and it applies to generated interface text too.
    const offenders = translatedKeys().filter((k) => /[—–]/.test(t(k)));
    expect(offenders).toEqual([]);
  });
});
