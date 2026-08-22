# NOTICE

Fabric Empires is a study aid for the Microsoft DP-600 certification, built for
the Microsoft Fabric community Certification Prep Challenge.

## What ships in this repository

Source only. There are no bundled art or audio assets, by design: the terrain
material, the water, the sky, every surface detail and every object on the map
are generated at runtime from the world seed. The rule is recorded as D59 in
PLAN.md and is the reason a clone of this repository is a few megabytes rather
than a few hundred.

## What deliberately does not ship

### The anthem, "Familia Nostra"

The opening title sequence has a score. It is **not in this repository**, and
the omission is about licensing rather than file size.

- **Written for this project.** The Latin and German words are original, and so
  is the setting. `fabrica` is Latin for a craftsman's workshop and `texere`
  means *to weave*, which is why the chorus can say "let us weave together" and
  "let us learn together" in the same breath. The lyrics and a translation are
  in `media/familia-nostra.txt`.
- **Generated with [Suno](https://suno.com)** from those lyrics and a style
  prompt describing the genre. No existing recording, melody or artist was
  named in the prompt, and nothing here is derived from a specific song.
- **Licensed for non-commercial use**, because it was generated on Suno's free
  plan. Commercial rights require a paid plan. That is a poor fit for a public
  repository under a permissive licence, so the file stays out of it.

The game handles this gracefully rather than depending on it. `app/src/audio.ts`
probes for `app/public/audio/anthem.mp3` at load; if the file is absent, which
is the state of every fresh clone, every call is a no-op and the opening plays
in silence. Nothing breaks and nothing is logged as an error.

To hear it, put your own `anthem.mp3` at that path.

### The trailer

`media/fabric-empires-intro.mp4` carries the anthem, so it inherits the same
non-commercial terms and is ignored by git for the same reason. It is published
on Discord and LinkedIn, where that licence is not a problem, rather than
committed here.

Everything in the trailer other than the music is the game rendering itself
live: no shot was staged, composited or drawn by hand.

## Third-party software

Dependencies and their licences are declared in `package.json` and the lockfile.
The notable one is [three.js](https://threejs.org) (MIT), which does all of the
rendering.

## The exam

"DP-600" and "Microsoft Fabric" are Microsoft names. This project is an
independent, unofficial study aid. It is not affiliated with, endorsed by, or
sponsored by Microsoft, and the questions are written from the public exam
skills outline rather than taken from any exam.
