/**
 * Bring your own questions.
 *
 * ⚠️ **Upload, then look, then decide.** The file is never applied on choosing
 * it. Campus-Scheduler learned that the expensive way and wrote it down: a
 * spreadsheet that blocked four slots a lecturer was teaching in previewed as
 * "4 changes" and said nothing about the four lectures it would invalidate.
 * *A count of edits is not a description of consequences.* So this reports
 * what the file contains, what it could not use and why, in the author's own
 * row numbers, and nothing happens until the button is pressed.
 */

import {
  buildImportedCampaign,
  previewBank,
  type BankPreview,
  type Campaign,
} from '@fabric-empires/learn';
import { downloadSample, readGrid } from '../spreadsheet.js';
import { t } from '../i18n.js';

export interface CoursePanel {
  readonly root: HTMLElement;
  /** Called when a course has been imported and should join the pickers. */
  onImported(handler: (campaign: Campaign) => void): void;
}

export function createCoursePanel(): CoursePanel {
  const root = document.createElement('div');
  root.className = 'fe-course';

  const heading = document.createElement('h3');
  heading.textContent = t('Your own questions');
  root.append(heading);

  const blurb = document.createElement('p');
  blurb.className = 'fe-setup-detail';
  blurb.textContent = t(
    'Download the sample, replace the rows with your own, and upload it. Any subject works.',
  );
  root.append(blurb);

  const buttons = document.createElement('div');
  buttons.className = 'fe-course-buttons';

  const download = document.createElement('button');
  download.type = 'button';
  download.textContent = t('Download sample');
  download.addEventListener('click', () => {
    void downloadSample().catch(() => {
      say(t('The sample could not be saved.'), 'bad');
    });
  });

  const pick = document.createElement('button');
  pick.type = 'button';
  pick.textContent = t('Upload a file');

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.csv,.txt';
  input.hidden = true;
  pick.addEventListener('click', () => input.click());

  buttons.append(download, pick, input);
  root.append(buttons);

  const report = document.createElement('div');
  report.className = 'fe-course-report';
  root.append(report);

  const handlers = new Set<(campaign: Campaign) => void>();
  let pending: BankPreview | undefined;
  let pendingName = '';

  function say(message: string, tone: 'good' | 'bad' | 'plain' = 'plain'): void {
    report.replaceChildren();
    const line = document.createElement('div');
    line.className = `fe-course-note ${tone}`;
    line.textContent = message;
    report.append(line);
  }

  /** Show what the file would do, and offer to do it. */
  function showPreview(preview: BankPreview, name: string): void {
    report.replaceChildren();

    const summary = document.createElement('div');
    summary.className = 'fe-course-note';
    summary.textContent = t('{questions} questions across {topics} topics, from {file}.', {
      questions: preview.questions.length,
      topics: preview.topics.length,
      file: name,
    });
    report.append(summary);

    if (preview.topics.length > 0) {
      const topics = document.createElement('div');
      topics.className = 'fe-course-topics';
      topics.textContent = preview.topics.slice(0, 8).join(' · ');
      if (preview.topics.length > 8) topics.textContent += ' · …';
      report.append(topics);
    }

    /*
     * Problems and warnings, each with the row number the author sees in Excel.
     * Capped at six, because a file with forty broken rows has one broken idea
     * and a wall of text helps nobody find it.
     */
    for (const [items, tone, title] of [
      [preview.problems, 'bad', t('Rows that could not be used')],
      [preview.warnings, 'warn', t('Worth a look')],
    ] as const) {
      if (items.length === 0) continue;
      const box = document.createElement('div');
      box.className = `fe-course-issues ${tone}`;
      const head = document.createElement('b');
      head.textContent = `${title} (${items.length})`;
      box.append(head);
      for (const item of items.slice(0, 6)) {
        const line = document.createElement('div');
        line.textContent = t('Row {row}: {message}', { row: item.row, message: item.message });
        box.append(line);
      }
      if (items.length > 6) {
        const more = document.createElement('div');
        more.textContent = t('and {n} more', { n: items.length - 6 });
        box.append(more);
      }
      report.append(box);
    }

    if (preview.unknownColumns.length > 0) {
      const line = document.createElement('div');
      line.className = 'fe-course-note warn';
      line.textContent = t('Ignored columns: {columns}', {
        columns: preview.unknownColumns.join(', '),
      });
      report.append(line);
    }

    if (preview.questions.length === 0) {
      const line = document.createElement('div');
      line.className = 'fe-course-note bad';
      line.textContent = t('Nothing in this file can be played yet.');
      report.append(line);
      return;
    }

    const use = document.createElement('button');
    use.type = 'button';
    use.className = 'fe-course-use';
    use.textContent = t('Use these questions');
    use.addEventListener('click', () => {
      void apply(name);
    });
    report.append(use);
  }

  async function apply(name: string): Promise<void> {
    if (!pending) return;
    const title = name.replace(/\.(xlsx|csv|txt)$/i, '') || t('My questions');
    try {
      const campaign = await buildImportedCampaign(title, pending);
      pending = undefined;
      input.value = '';
      say(
        t('{title} is ready. Pick it as a course below.', { title: campaign.course }),
        'good',
      );
      for (const handler of handlers) handler(campaign);
    } catch {
      say(t('Those questions could not be prepared.'), 'bad');
    }
  }

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    pendingName = file.name;
    say(t('Reading {file}…', { file: file.name }));
    void readGrid(file)
      .then((grid) => {
        pending = previewBank(grid);
        showPreview(pending, pendingName);
      })
      .catch((error: unknown) => {
        pending = undefined;
        // Shown plainly to the player, and logged in full for whoever has to
        // work out why somebody's spreadsheet will not open.
        console.error('Could not read the uploaded file', error);
        say(t('That file could not be read. Excel and CSV both work.'), 'bad');
      });
  });

  return {
    root,
    onImported(handler) {
      handlers.add(handler);
    },
  };
}
