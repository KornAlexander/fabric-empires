/**
 * Remove the soundtrack from a build that is going somewhere public.
 *
 * ⚠️ **`.gitignore` protects the repository. It does not protect the bundle.**
 *
 * `app/public/audio/` is untracked on licence grounds, so a fresh clone builds
 * silently and everything looks compliant. On the author's machine the files
 * exist, Vite copies `public/` verbatim, and `rayfin up` runs the ordinary
 * build. The first deployment therefore served 15.6 MB of static content whose
 * three largest files were the soundtrack, fetchable anonymously: a raw GET
 * with no session returned all 3,372,390 bytes of `anthem.mp3`.
 *
 * MUSIC-LICENSING.md answers this in its own first line: "not in the app you
 * hand to other people. Yes, on your own machine." The free tier grants
 * personal, non-commercial use and no right to redistribute, and a public URL
 * is redistribution however free the game is.
 *
 * The game is built to lose this gracefully. The opening plays in silence when
 * the files are absent, which is the state of every clean clone anyway.
 */

import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(repo, 'app', 'dist');
const audio = join(dist, 'audio');

if (!existsSync(dist)) {
  console.error('strip-audio: app/dist does not exist. Run the build first.');
  process.exit(1);
}

let removed = 0;
let bytes = 0;

if (existsSync(audio)) {
  for (const name of readdirSync(audio)) {
    bytes += statSync(join(audio, name)).size;
    removed += 1;
  }
  rmSync(audio, { recursive: true, force: true });
}

// ⚠️ Verify, do not assume. A silent no-op here ships the audio, and the whole
// point of this file is that the previous silent path looked fine too. Sweep
// the finished bundle for anything that is still an audio file, whatever
// folder it ended up in.
const stragglers = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(mp3|wav|ogg|m4a|flac|opus)$/i.test(name)) {
      stragglers.push(full.slice(dist.length + 1));
    }
  }
};
walk(dist);

if (stragglers.length > 0) {
  console.error('strip-audio: audio is STILL in the bundle:');
  for (const s of stragglers) console.error('  ' + s);
  console.error('This build must not be published. See MUSIC-LICENSING.md.');
  process.exit(1);
}

console.log(
  `strip-audio: removed ${removed} file(s), ${(bytes / 1024 / 1024).toFixed(1)} MB. ` +
    'Bundle carries no audio.',
);
