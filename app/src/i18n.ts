/**
 * Two languages, one interface.
 *
 * ⚠️ **Translations are keyed by the English string itself**, so `t('End turn')`
 * looks up German and falls back to the literal it was given. That choice is
 * about risk rather than tidiness. A conventional key namespace means naming
 * 250 strings, touching every call site twice, and showing the player a raw
 * `hud.endTurn` the first time somebody mistypes one. Here the worst failure is
 * that a sentence stays English, which is exactly what it did before, so the
 * game is shippable at every point during the translation rather than only at
 * the end. D214 deferred this pass because it "touches every file the DP-600
 * submission depends on"; this is how it stops being able to break them.
 *
 * The cost is real and worth writing down: **editing an English string silently
 * orphans its German.** `missingTranslations()` finds entries that were never
 * written, and nothing can find one that used to match. Change English text and
 * the German here needs changing with it.
 *
 * ## What is NOT translated, on purpose
 *
 * - **The DP-600 questions.** The exam is sat in English and its terminology is
 *   the subject: somebody who revises "Direktsee" has learned a word that will
 *   not be on the paper. The Klasse 1 bank is German for the mirror reason.
 * - **Fabric product terms**: Compute, CU, Lakehouse, Warehouse, Direct Lake.
 *   These are names, not words, and a German Fabric user says them in English.
 *   Ordinary English words like Trust and Data are translated normally.
 */

export type Lang = 'en' | 'de';

const STORE_KEY = 'fabric-empires:lang';

/**
 * English source text to German.
 *
 * Kept as one flat object rather than split by screen, because the key IS the
 * English string and duplicates across screens should collapse to one entry.
 */
const DE: Readonly<Record<string, string>> = Object.freeze({
  // The shell -------------------------------------------------------------
  'End turn': 'Zug beenden',
  Cities: 'Städte',
  Council: 'Rat',
  'Council ({n})': 'Rat ({n})',
  Library: 'Bibliothek',
  'New game': 'Neues Spiel',
  Skip: 'Überspringen',
  'Face the Proctor': 'Der Prüfung stellen',
  'Turn the music off': 'Musik ausschalten',
  'Turn the music on': 'Musik einschalten',
  'Nothing selected': 'Nichts ausgewählt',
  'Click one of your units.': 'Wähle eine deiner Einheiten.',
  'Hover a tile': 'Zeige auf ein Feld',
  'Researching nothing': 'Keine Forschung',
  'Choose what to study.': 'Wähle, was du lernen willst.',
  'Who is coming': 'Wer kommt',
  'Your empire begins.': 'Dein Reich beginnt.',
  'Turn {n}': 'Runde {n}',

  // Resources. Trust and Data are ordinary words; Compute and CU are Fabric
  // capacity terms and stay as they are.
  Trust: 'Vertrauen',
  Data: 'Daten',

  // Orders ----------------------------------------------------------------
  'Found city': 'Stadt gründen',
  Fortify: 'Befestigen',
  Raid: 'Plündern',
  Raze: 'Niederbrennen',
  Capture: 'Erobern',
  Attack: 'Angreifen',
  Move: 'Bewegen',

  // The log ---------------------------------------------------------------
  'Enemy unit destroyed.': 'Gegnerische Einheit vernichtet.',
  'Your unit was destroyed.': 'Deine Einheit wurde vernichtet.',
  'Your answer strengthened the attack.': 'Deine Antwort hat den Angriff verstärkt.',
  'Your answer weakened the attack.': 'Deine Antwort hat den Angriff geschwächt.',
  'Nothing was learned there.': 'Dort wurde nichts gelernt.',
  'Upkeep could not be paid in full.': 'Der Unterhalt konnte nicht voll bezahlt werden.',
  'Both of you knew it. The walls hold.': 'Ihr wusstet es beide. Die Mauern halten.',
  'Player 2 held the line where you did not.':
    'Spieler 2 hat gehalten, wo du es nicht konntest.',
  'A saved game was found but could not be read, so this is a new one.':
    'Ein Spielstand wurde gefunden, war aber nicht lesbar. Dies ist ein neues Spiel.',
  '{name} grew.': '{name} ist gewachsen.',
  '{name} is now a {rank}. {why}': '{name} ist jetzt {rank}. {why}',
  'Yields +{percent}%.': 'Erträge +{percent}%.',
  'The first step.': 'Der erste Schritt.',
  'Turn {n} ended. {gains}': 'Runde {n} beendet. {gains}',
  'No income yet.': 'Noch keine Einnahmen.',

  // Setting up a world ----------------------------------------------------
  'The world': 'Die Welt',
  'The exam': 'Die Prüfung',
  'Who is playing': 'Wer spielt',
  'The seed': 'Der Startwert',
  Begin: 'Los geht’s',
  Shape: 'Form',
  Land: 'Land',
  Size: 'Größe',
  Focus: 'Schwerpunkt',
  Rivals: 'Gegner',
  Pace: 'Tempo',
  Seats: 'Plätze',
  'One player': 'Ein Spieler',
  'Two players, together': 'Zwei Spieler, gemeinsam',
  'You answer every question yourself.': 'Du beantwortest jede Frage selbst.',
  'One empire. Every battle asks you both at once, each from your own course.':
    'Ein Reich. Jeder Kampf fragt euch beide gleichzeitig, jeden aus seinem eigenen Kurs.',
  'Player 1 answers with 1 2 3 4': 'Spieler 1 antwortet mit 1 2 3 4',
  'Player 2 answers with A B C D': 'Spieler 2 antwortet mit A B C D',
  '{n} rivals': '{n} Gegner',
  'Every branch of the outline has a faction holding it.':
    'Jeder Zweig des Lehrplans wird von einer Fraktion gehalten.',
  '{n} of the seven clusters come at you. A shorter war.':
    '{n} der sieben Gebiete greifen dich an. Ein kürzerer Krieg.',
  'Same seed and same choices, same world. Send one to a friend.':
    'Gleicher Startwert, gleiche Auswahl, gleiche Welt. Schick einen an eine Freundin.',

  // Two seats -------------------------------------------------------------
  'Player 1': 'Spieler 1',
  'Player 2': 'Spieler 2',
  Correct: 'Richtig',
  'The answer was: {answer}': 'Richtig wäre: {answer}',

  // Settlement ranks are engine data and carry their own German. What the
  // panel says around them lives here.
  'pop {n}': 'Einw. {n}',
  'unrest {n}': 'Unruhe {n}',
  '{rank} needs {what}': '{rank} braucht {what}',
  'Rising to {rank}': 'Wird bald {rank}',
  '{n} more citizen': '{n} Einwohner mehr',
  '{n} more citizens': '{n} Einwohner mehr',
  '{n} more topic at {band}': '{n} Thema mehr auf {band}',
  '{n} more topics at {band}': '{n} Themen mehr auf {band}',
  ' and ': ' und ',
  familiar: 'vertraut',
  strong: 'sicher',
  'A city': 'Eine Stadt',

  // Unit panel. The unit's own name stays English; these do not.
  HP: 'TP',
  moves: 'Züge',
  strength: 'Stärke',
  fortified: 'befestigt',
  '{known}/{total} known ({percent}%)': '{known}/{total} gelernt ({percent}%)',
  '{percent}% exam': '{percent}% Prüfung',
  '{known}/{total} known': '{known}/{total} gelernt',

  // The help card.
  'click a unit to select, click to move or attack':
    'Einheit anklicken, dann klicken zum Ziehen oder Angreifen',
  'drag to pan, wheel to zoom, space ends turn':
    'Ziehen zum Verschieben, Rad zum Zoomen, Leertaste beendet den Zug',
  '` opens the console, type help': '` öffnet die Konsole, tippe help',

  // Starting out.
  'New empire on seed {seed}. {shape}, {size}, {rivals} rivals.':
    'Neues Reich auf Startwert {seed}. {shape}, {size}, {rivals} Gegner.',

  // The opening -----------------------------------------------------------
  'Out of nothing, the land rises': 'Aus dem Nichts erhebt sich das Land',
  'The rivers find their way': 'Die Flüsse finden ihren Weg',
  'Small hands, great hands': 'Kleine Hände, große Hände',
  'Learn Fabric. Learn as a family.': 'Lerne Fabric. Lernt als Familie.',
  'Esc to skip': 'Esc zum Überspringen',

  // Bringing your own questions.
  'Your own questions': 'Deine eigenen Fragen',
  'Download the sample, replace the rows with your own, and upload it. Any subject works.':
    'Lade die Vorlage herunter, ersetze die Zeilen durch eigene und lade sie hoch. Jedes Fach geht.',
  'Download sample': 'Vorlage herunterladen',
  'Upload a file': 'Datei hochladen',
  'Use these questions': 'Diese Fragen verwenden',
  'Reading {file}…': 'Lese {file}…',
  '{questions} questions across {topics} topics, from {file}.':
    '{questions} Fragen aus {topics} Themen, aus {file}.',
  'Rows that could not be used': 'Zeilen, die nicht verwendet werden konnten',
  'Worth a look': 'Einen Blick wert',
  'Row {row}: {message}': 'Zeile {row}: {message}',
  'and {n} more': 'und {n} weitere',
  'Ignored columns: {columns}': 'Ignorierte Spalten: {columns}',
  'Nothing in this file can be played yet.':
    'Aus dieser Datei lässt sich noch nichts spielen.',
  '{title} is ready. Pick it as a course below.':
    '{title} ist bereit. Wähle es unten als Kurs aus.',
  'Those questions could not be prepared.':
    'Diese Fragen konnten nicht vorbereitet werden.',
  'That file could not be read. Excel and CSV both work.':
    'Diese Datei konnte nicht gelesen werden. Excel und CSV funktionieren beide.',
  'The sample could not be saved.': 'Die Vorlage konnte nicht gespeichert werden.',
  'My questions': 'Meine Fragen',

  // The study coach.
  'Ask about your progress…': 'Frag nach deinem Fortschritt…',
  Ask: 'Fragen',
  'Thinking…': 'Denkt nach…',
  due: 'fällig',
  unseen: 'ungesehen',
  learning: 'am Lernen',
  'Answer a few questions and this will fill in.':
    'Beantworte ein paar Fragen, dann füllt sich das hier.',
  'Ask me what to study, or how close you are. I read your progress, not your answers.':
    'Frag mich, was du lernen sollst oder wie nah du bist. Ich sehe deinen Fortschritt, nicht deine Antworten.',
  'What should I work on next?': 'Was soll ich als Nächstes lernen?',

  // Endings ---------------------------------------------------------------
  Victory: 'Sieg',
  Defeat: 'Niederlage',
  'Play again': 'Nochmal spielen',
  'Codes used': 'Benutzte Codes',
  'Your readiness did not have help, and never does.':
    'Deine Lernwerte hatten keine Hilfe. Das haben sie nie.',

  /*
   * Engine option text.
   *
   * The engine keeps its labels in English as the canonical form and the app
   * translates them on the way to the screen, so no engine interface needs a
   * second field and the two can never disagree about which is which.
   *
   * ⚠️ Unit names and city kinds are deliberately absent. Workspace, Lakehouse,
   * Warehouse, Eventhouse and Semantic Model are literal Fabric item types, and
   * Pipeline Runner, Query Slinger, Notebook Cannon, RLS Sentinel and Direct
   * Lake Titan are jokes built on Fabric terminology. A German Fabric user says
   * all of them in English, and translating them would teach vocabulary that is
   * not on the exam.
   */
  'One great continent': 'Ein großer Kontinent',
  'A single landmass with a long, worked coastline. Nowhere to hide.':
    'Eine einzige Landmasse mit langer, zerklüfteter Küste. Kein Versteck.',
  'A few large islands': 'Einige große Inseln',
  'A broad home island and three lesser lands across the water.':
    'Eine weite Heimatinsel und drei kleinere Länder jenseits des Wassers.',
  'Many small islands': 'Viele kleine Inseln',
  'A crowded home island ringed by scattered isles and a great deal of sea.':
    'Eine enge Heimatinsel, umringt von verstreuten Eilanden und viel Meer.',
  Gentle: 'Sanft',
  'Broad plains and few mountains. Armies move freely and fronts are wide.':
    'Weite Ebenen und wenige Berge. Armeen ziehen frei, die Fronten sind breit.',
  Rolling: 'Hügelig',
  'Hills, river valleys and a spine of mountains. The balanced world.':
    'Hügel, Flusstäler und ein Gebirgsrücken. Die ausgewogene Welt.',
  Rugged: 'Schroff',
  'High country everywhere. Passes matter, and a held valley is worth an army.':
    'Überall Hochland. Pässe zählen, und ein gehaltenes Tal ist eine Armee wert.',
  Small: 'Klein',
  'About 2,800 tiles. Quick to build, and everyone is close.':
    'Etwa 2.800 Felder. Schnell aufgebaut, und alle sind nah.',
  Standard: 'Standard',
  'About 6,200 tiles. Room to expand before anyone reaches you.':
    'Etwa 6.200 Felder. Platz zum Wachsen, bevor dich jemand erreicht.',
  Large: 'Groß',
  'About 9,600 tiles. A long war, and a longer wait to begin it.':
    'Etwa 9.600 Felder. Ein langer Krieg, und ein längeres Warten darauf.',
  'The whole exam': 'Die ganze Prüfung',
  'Rivals drawn from every branch, nearest first.':
    'Gegner aus allen Zweigen, die nächsten zuerst.',
  'Maintain and govern': 'Verwalten und steuern',
  'Security, access control, version control, deployment pipelines.':
    'Sicherheit, Zugriffssteuerung, Versionsverwaltung, Deployment-Pipelines.',
  'Prepare data': 'Daten vorbereiten',
  'Connections, ingestion, transformation, and querying.':
    'Verbindungen, Ingestion, Transformation und Abfragen.',
  'Semantic models': 'Semantische Modelle',
  'Model design, storage modes, DAX, and optimisation.':
    'Modelldesign, Speichermodi, DAX und Optimierung.',
  Relaxed: 'Entspannt',
  'Half as long again to answer. For learning something new.':
    'Die Hälfte mehr Zeit zum Antworten. Zum Neulernen.',
  'Fourteen seconds to think in battle, plus time to read.':
    'Vierzehn Sekunden Bedenkzeit im Kampf, dazu Zeit zum Lesen.',
  'Exam pace': 'Prüfungstempo',
  'A third less time. Closer to sitting the real thing.':
    'Ein Drittel weniger Zeit. Näher an der echten Prüfung.',
});

const listeners = new Set<() => void>();

function load(): Lang {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved === 'de' || saved === 'en') return saved;
    // A German browser gets a German game without being asked.
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('de')) return 'de';
  } catch {
    // Private mode, or no storage. English then.
  }
  return 'en';
}

let current: Lang = load();

export function lang(): Lang {
  return current;
}

export function setLang(next: Lang): void {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(STORE_KEY, next);
  } catch {
    // Not being able to remember the choice is not a reason to refuse it.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  for (const fn of listeners) fn();
}

export function toggleLang(): Lang {
  setLang(current === 'en' ? 'de' : 'en');
  return current;
}

/** Called after every change, so panels can redraw themselves. */
export function onLangChange(fn: () => void): void {
  listeners.add(fn);
}

/**
 * Translate, with optional `{placeholders}`.
 *
 * The English text is both the key and the fallback, so an untranslated string
 * renders as itself rather than as a broken lookup.
 */
export function t(en: string, vars?: Readonly<Record<string, string | number>>): string {
  const base = (current === 'de' ? DE[en] : undefined) ?? en;
  if (!vars) return base;
  return base.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

/** Pick the singular or plural English key, then translate it. */
export function plural(
  n: number,
  one: string,
  many: string,
  vars?: Readonly<Record<string, string | number>>,
): string {
  return t(n === 1 ? one : many, { n, ...vars });
}

/** Every English string that has a German translation. For tests. */
export function translatedKeys(): readonly string[] {
  return Object.keys(DE);
}

/**
 * Apply translations to static markup.
 *
 * Anything carrying `data-i18n` has its text replaced, and `data-i18n-title`
 * its tooltip. Runs on load and again on every switch, so the shell follows the
 * language without every element needing a listener of its own.
 */
export function applyStaticTranslations(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const source = el.dataset.i18n;
    if (source) el.textContent = t(source);
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-title]')) {
    const source = el.dataset.i18nTitle;
    if (source) el.title = t(source);
  }
}
