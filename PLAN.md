# Fabric Empires

**A turn-based 4X strategy game where the tech tree is the DP-600 exam outline.**

Living plan document. Status legend: `[ ]` open, `[~]` in progress, `[x]` done.

---

## 1. Context

Entry for the **Microsoft Fabric Discord User Group Certification Prep Challenge**, builder track.

| Fact | Value |
|---|---|
| Contest opens / closes | 18 August 2026 / 1 September 2026 |
| Track | Builder (live URL + public GitHub repo required) |
| Suggested effort | 1-2 hours (we are deliberately ignoring this) |
| Actual build window | 21 August to ~21 September 2026 |
| Submission checkpoint | 31 August 2026, whatever exists ships |
| Prize | Microsoft swag, per track |

The contest also asks entrants to report rough edges in Fabric Apps and Rayfin, both in public preview. We collect those as we hit them.

---

## 2. Decision log

Every decision below was made explicitly. Do not silently revisit one; if a decision needs to change, strike it here with a reason.

| # | Decision | Choice |
|---|---|---|
| D01 | Genre | Turn-based 4X empire strategy (see 12.1 on why no product is named here) |
| D02 | Title / repo | Fabric Empires / `fabric-empires` |
| D03 | Cert scope v1 | DP-600 only. DP-700 and PL-300 after the contest |
| D04 | Resources | Classic four, renamed: Data (food), Compute (wood), Capacity Units (gold), Trust (stone) |
| D05 | Map | Hex grid with real unit movement |
| D06 | Map generation | Procedural, seeded, shareable seed |
| D07 | Session length | 45-60 minutes, save and resume at any point |
| D08 | Combat | Hit-point combat in the genre's usual form. Strength plus HP, with the question applying a large plus/minus modifier to the attack roll |
| D09 | Loss consequence | Army versus army. You lose units, not territory. Territory changes hands only when a city actually falls |
| D10 | Timers | 20 s battle, 30 s research, 45 s boss. Tight on everything |
| D11 | Victory conditions | Domination, Science (full tech tree), and The Exam (timed final siege) |
| D12 | Question types | Multiple choice single, multi-select, hotspot on a diagram |
| D13 | Explanations | Always, on right and wrong, with a Microsoft Learn deep link |
| D14 | Mastery model | SM-2 per leaf skill (delegated decision, see 6.4 for why) |
| D15 | Adaptive difficulty | Tier scaling only, no targeting of weak areas |
| D16 | Exam readiness | Shown as a real percentage, weighted by the published exam percentages, with a per-domain breakdown |
| D17 | Tech tree fidelity | 1:1 with the published outline. 3 branches, 7 clusters, 41 leaf nodes, real skill names |
| D18 | Factions | 8: one per skill cluster (7) plus a final boss |
| D19 | Question bank | 250+ for DP-600, weighted to the real domain percentages |
| D20 | Answer key | Obfuscated. Answers hashed, explanations encrypted under the answer |
| D21 | Art | AI generated, ~250 assets, painterly isometric. Style described self-contained, no product references (see 12.1) |
| D22 | Art pipeline | `gpt-image-1` via Azure OpenAI in the MCAP subscription (resource to be created) |
| D23 | Diagrams | Code drawn SVG/canvas with defined click regions, not AI images |
| D24 | Audio | AI generated ambient soundtrack plus code generated WebAudio SFX |
| D25 | Difficulty | Three levels: Apprentice, Analyst, Architect |
| D26 | Onboarding | Scripted tutorial, first 5 turns guided |
| D27 | Platform | Desktop first, tablet friendly, phone shows a "use a bigger screen" notice |
| D28 | Persistence | Anonymous local play, sign in to sync and rank |
| D29 | Entities | `CampaignSave`, `SkillMastery`, `GameStats`, `LeaderboardEntry` |
| D30 | Leaderboards | Two boards side by side: campaign score, and exam readiness |
| D31 | Deploy target | Fabric capacity `prdsweden` (F8) |
| D32 | Licence / language | MIT, English only |
| D33 | Disclaimer | README only. Two parts: original questions, and personal project not a Microsoft product |
| D34 | Publishing | Standalone public repo now, `awesome-rayfin` template PR afterwards |
| D35 | **Architecture** | **Two layers with a hard boundary. The engine is a complete strategy game that knows nothing about certifications. Learning content plugs in via `ChallengeProvider`** |
| D36 | Monuments | "Wonders" renamed to "Monuments" throughout |
| D37 | Static fallback | A static GitHub Pages build ships alongside the Fabric App, so the game is playable even when the capacity is paused |
| D38 | Hosting order | Rayfin first as the primary submitted URL, Pages as the fallback link |
| D39 | Daily challenge | Not building one. Async seed sharing instead: send a friend your seed and compare results |
| D40 | Share card | Shareable result image (score, readiness, domain bars, seed) rendered to canvas and copied to clipboard |
| D41 | Item analytics | Anonymous aggregate per-question counters only (seen, correct, mean time). No per-user attempt rows |
| D42 | Localisation | i18n-structured from day one, English only at launch |
| D43 | Art fallback | If `gpt-image-1` is unavailable in the MCAP subscription, fall back to a personal ChatGPT / Copilot Pro subscription, checking output licence terms for whichever is used |
| D44 | Review coverage | Spot-check 20% of the bank plus all tier-3 items. See the risk note in 15.2 |
| D45 | Exam NDA | Author has not taken DP-600. Questions are still authored strictly from the public study guide and public documentation |
| D46 | Accessibility | Best effort, no formal WCAG target |
| D47 | Trademark scan | CI warns, does not fail |
| D48 | **Provenance** | **Mandatory `sourceSkillBullet` + `sourceLearnUrl` on every question, enforced by a test** (delegated, see 2.3) |
| D49 | **Unrest framing** | **Opportunity, never punishment. No unrest accrues while the player is away** (delegated, see 2.3) |
| D50 | **Timers** | **Timed by default, but every modal is pausable without penalty outside Exam mode. Tutorial untimed. Relaxed offered as an equal option at campaign start** (delegated, see 2.3) |
| D51 | **D35 enforcement** | **Interface plus the ESLint boundary rule now. The full NullProvider campaign test is post-contest** (delegated, see 2.3) |
| D52 | **Great Library** | **The reference screen is called the Great Library, reachable from the main menu without starting a campaign** (delegated, see 2.3) |
| D53 | Magic moment | A scripted first-battle set piece showing combat and the question modifier together |
| D54 | Scope stance | Ambitious plan retained. Risk is managed by the cut list in 15.1, which carries dated trigger conditions |
| D55 | ~~Art direction~~ | ~~Data-dream: a night world lit from within~~ **SUPERSEDED by D145. The renderer went photoreal at D58 and the data-dream never happened; leaving it in the table was describing a game that does not exist** |
| D56 | Corruption as a visual | The Ungoverned Wastes, and any tile the Silo Horde holds, are drawn with torn scanlines in clashing hues. The enemy advance is visible on the ground, not only in a border colour |
| D57 | **Battle length** | **Two lengths. The full set piece is reserved for the first battle of a game and for any city assault; every other clash gets a short punchy version. Every battle follows a question, so a long sequence on all of them would be exhausting by the tenth** |
| D58 | **Renderer** | **3D, three.js, replacing the 2D canvas renderer entirely. The engine is untouched: D35 already kept it renderer-agnostic, so only `app/src/render/*` was replaced by `app/src/three/*`** |
| D59 | Assets | Still none. Terrain material, water normals and surface detail are all generated at runtime. A public repository with zero downloaded texture licences to defend is worth more than a slightly better rock |
| D60 | Ground topology | A continuous smoothed surface, not extruded hex prisms. The hex grid decides control points and material, then the surface is subdivided, displaced, welded and Laplacian-smoothed. The grid is an overlay that can be switched off with `g` |
| D61 | **Realism, honestly scoped** | **"Photoreal" is not reachable here: no artist, no scanned materials, no time. What is reachable, and is what D58 delivers, is physically based: a scattering sky, one dominant sun, real shadows, filmic tone mapping and ground that responds correctly to light. See 16.1 for what is still missing** |
| D62 | **Erosion** | **The landform is carved by a simulated hydraulic erosion pass, not sculpted from noise. 140,000 droplets over a grid at five cells per hex, run once at map generation. See 16.3** |
| D63 | Micro-relief | Bump mapping, not normal mapping. Bump perturbs the normal from screen-space derivatives and needs no tangent frame, which is exactly what defeated the normal map twice |
| D64 | Erosion ordering | Erosion is applied after the Laplacian smoothing pass, not before. The smoothing exists to remove hex-umbrella creases and is an aggressive low-pass filter; run first, it removes the drainage channels along with them |
| D65 | **Duels are staged, not implied** | **A battle is a sequence in world space: the two units turn to face each other, the attacker winds up and charges or fires, the blow lands with sparks and dust, the loser is knocked back, topples onto its side and burns out. Written as one function so the timing can be read and argued about in one place** |
| D66 | Wrecks outlive their units | The engine removes a destroyed unit on the frame the blow lands. The renderer keeps the object alive while a combat pose exists, so the death animation has something to play |
| D67 | **Citations are retrieved, not recalled** | **Every `sourceLearnUrl` and `learnUrl` is fetched from Microsoft Learn while authoring, and `tools/content/check-links.py` verifies the whole set resolves. A study aid that cites a dead page is worse than one that cites nothing, because the learner assumes the fault is theirs** |
| D68 | Link checking is out of `verify` | It needs the network. An offline build must not fail for a reason unrelated to the code, so it is run after authoring rather than on every commit |
| D69 | **Bank complete at 3 questions per skill** | **123 questions covering all 41 skills, breadth before depth. A learner who meets every skill once is better served than one who meets half the exam three times as often. Depth is the next thing to add, not a gap in the design** |
| D70 | The empty-topic path stays tested | With every skill covered there is no longer a gap to borrow for the test, so `PresenterOptions.questions` lets a test pass an empty pool. An outline update can add a skill at any time and the game must carry on rather than throw |
| D71 | **Spaced repetition is the game loop, not a study screen** | **Completing research binds the topic to a city. When SM-2 says it is due, that city can hold a council: answer and it pays 4 Trust and a 25 percent yield bonus for 5 turns. This is the mechanic that makes it a learning game rather than a quiz attached to a game** |
| D72 | Every answer feeds the schedule | Battle questions and research questions update SM-2 too, not just councils. What the player demonstrably knows should drive when they see it again, whatever they were doing at the time |
| D73 | **Neglect is a nudge, not a spiral** | **Two ignored councils are tolerated; unrest starts on the third, caps at 3, and costs at most a 36 percent yield dampening. It only ever accrues inside a turn, so a player who closes the tab overnight loses nothing (D49)** |
| D74 | In-session day | A real SM-2 interval of one day would never fire inside a play session, so a compressed clock treats 75 seconds as a day. The real clock still applies across sessions, so a returning player meets a genuine schedule |
| D75 | Save version 2 | Cities gained unrest, ignored reviews, a bonus expiry and a last-review turn, and `boundSkills` changed from skill numbers to topic ids. A migration table upgrades version 1 saves; a save newer than the build is refused rather than half-read |
| D76 | **The Great Library reports exam weight, not skill count** | **Branch B is 18 of 41 skills but 45 to 50 percent of the exam. "29 of 41" and "ready to sit it" are different claims, so the headline figure is weighted and the skill count is secondary** |
| D77 | Researched and retained are separate columns | Unlocking a tech node means one question was answered once. Retention is what the spaced repetition bands measure. Blending them into a single score would flatter the player at exactly the moment honesty is worth most |
| D78 | Library reachable in play, not from a menu | D52 said main menu. There is no main menu yet and building one to host a screen would be the wrong order, so it is a button in the resource bar and the `l` key. Revisit if a menu ever exists |
| D79 | **The drone is ported verbatim, not rewritten** | `flyControls.ts` is shared byte-for-byte across seven of the digital twins and says so in its own header. It arrives here unchanged, with its 73 tests, rather than becoming an eighth dialect. Every host-specific number is already an option, which is exactly the property that made the port a config change |
| D80 | The instruments read in hexes, not metres | The module names everything `...Ms` and `...M` because twins measure in metres. This world has no metres: a hex radius is one unit and nothing maps it to a distance. The panel says `hex` and `hex/s`. Printing `m/s` would have been free, and false |
| D81 | Fortify and Skip move off `f` and `s` | The drone owns `w a s d q e r f`, and two of those were unit actions. In a twin there is nothing else on the keyboard; in a game W A S D is the most contested space there is. The camera keeps the eight keys because they are the whole latch, and the two actions move to `h` and `x`, keeping their buttons |
| D82 | The overlay guard is host-side, in the capture phase | The module binds `keydown` on `window` and only declines for form fields, so W A S D behind an open question modal would quietly fly the camera away. Fixed here rather than in the shared file: a capture listener swallows just those eight keys while an overlay is up. Escape still reaches the library, which a blanket `stopPropagation` would have broken |
| D83 | No terrain collision, inherited deliberately | It is a camera, not a simulator, so it will fly through a mountain and below sea level. One consequence is worth knowing: the height-above-ground scaling pins the speed at its minimum once the camera is under the surface, so a nose-down dive ends in slow motion. Climbing out restores it |
| D84 | **The empire persists, because the schedule already did** | The engine could serialise from early on and nothing ever called it, so closing the tab threw the game away while the review schedule in `localStorage` survived. That split was the real defect: the design rests on coming back tomorrow to topics that are due, and there was nothing to come back to |
| D85 | Autosave at end of turn, and on `visibilitychange` | End of turn is the only moment with no unit half-moved and no question waiting, and it is the natural unit of loss. `hidden` rather than `beforeunload` because a tab closed by the operating system often never fires the latter |
| D86 | A bad save costs a line in the log, never the boot | Corrupt, hand-edited or written by a newer build all look the same to a player, and none should be a blank page. The engine throws for a future version, deliberately; the app catches and starts fresh, saying so. Storage is probed with a real write, because partitioned storage in an iframe, which is how a Fabric App is served, returns an object that looks fine and throws on first use |
| D87 | Relative asset base | `base: './'` so the build runs from any path: a Fabric App root, a Pages project site at `/fabric-empires/`, or a folder. The default of `/` works only at a server root, which is the one place the submitted link will not be |
| D88 | `build` runs `content:check` first | The question bank is generated from plaintext sources, and a bundle whose hashes disagree with its questions is unplayable in a way that looks like a content bug. The check is cheap and the failure is silent, so it belongs in front of the build rather than only in `verify` |
| D89 | **The antagonist moves** | Until now the turn pipeline ran only the active faction and the Silo Horde stood in its camp for the whole game. Enemy AI v1: each unit strikes what it can reach, otherwise walks towards the nearest thing worth hitting. No building, no research, no co-ordination, and honest about it |
| D90 | The AI plays by the player's rules | `moveUnit` and `canAttack` both refuse a unit that is not the active faction's, so an AI turn switches `activeFactionId` for its duration rather than bypassing the checks. Every enemy move is legal by the same code that judges the player's, and a test asserts each destination was in `reachable` |
| D91 | Deterministic, with no RNG of its own | A seed decides the map and the combat rolls, so an opponent drawing from `Math.random` would be the one thing that could not be replayed and seed sharing (D39) would stop meaning anything. Ties break on stable keys; a test plays the same seed twice and compares every event |
| D92 | **A camp leash, widening with the turn** | Measured, not guessed: with a free rein the horde crossed the map and wiped out a passive player by **turn six**. The plan's first raid is meant to be winnable, and someone still learning which key fortifies should not lose everything while reading the interface. Radius 5, plus one hex every 3 turns. Stateless, so no save migration, and stepping inside it still means a fight: a leash is not a truce. First raid now lands turn 9 to 20 across seeds |
| D93 | Raids are shown, not just applied | The engine applies enemy attacks inside `endTurn`, so the loser is gone by the time the app sees the report. Raids therefore get the camera, a shake and floating damage rather than the full duel a player attack gets, because choreography needs the result held back. The player is never quietly attacked |
| D94 | Defeat is announced once | Losing everything used to leave the game running with nothing to command and no explanation. Follow-up: victory conditions, and the defence question that `defenderChallengeScore` already exists for |
| D95 | **You defend with what you know** | When the horde raids, the player answers a question from *that faction's cluster* and the score becomes `defenderChallengeScore`. Measured on one seed: 36 damage taken with the right answer, 100 with the wrong one. This is the design's central claim finally wired up, that who is attacking you tells you what you are about to be tested on |
| D96 | The turn is played twice, on purpose | The question has to be asked *before* the fight, but the app cannot know a raid is coming until the AI plans it. `endTurn` is pure, so it runs once on a throwaway copy to look ahead, then again for real with the score. The alternative was an async AI loop, which would have put a promise, and therefore the app, inside the rules (D35). Both runs agree on whether a raid happens, because the decision to attack does not depend on the answer |
| D97 | Battle topics come from the seed | `battleTopicFor` used `Math.random`, so two players sharing a seed fought identical battles and were asked about different skills, and replaying your own game varied too. Now keyed on seed, turn and faction. The *topic* is fixed; which question from that topic still varies, deliberately, because being asked the same question every time you fight is how a study tool stops teaching |
| D98 | **Cities build things** | The last phase from the plan with no implementation. Until now a city collected resources and did nothing with them, so an empire could lose units and never replace one: with the horde raiding, the game had no counterplay in it |
| D99 | Production spends Compute, the same resource as research | Every Compute spent on a soldier is one not spent on learning. In a game about studying that is the tension worth having, and it means a player who ignores the tech tree to raise an army wins the battle and loses the exam |
| D100 | A per-city cap of 15 Compute a turn | Without it, production and research fight over one treasury and whichever runs first takes all of it. A player who queued a unit would silently stop researching, and a starved tech tree looks exactly like a broken one. With the cap both advance every turn; a test asserts precisely that |
| D101 | **The tech tree hands out the army** | `unlockedBySkill` has sat in the unit table since the beginning with nothing reading it. It is a 1-based index into the topic graph, so a Pipeline Runner exists only once its skill is known. At turn one you may build exactly three things. An index past the end of the tree is locked rather than free, so a small generic tree cannot hand out a Direct Lake Titan |
| D102 | Changing your mind is free | Switching a city to a different unit keeps the Compute already spent, and so does cancelling. Punishing a player for changing an order is a classic mechanic with nothing to teach here |
| D103 | Save version 3 | Cities gained `producing` and `productionProgress`. `producing` is left absent rather than set to undefined, because `exactOptionalPropertyTypes` makes those different and absent is what "no orders" means everywhere else |
| D104 | **Games end, and ending is a rule** | The app counted units and cities itself to notice a defeat. That worked and was wrong in principle: whether a game is over is the same question for every faction, and a rule the interface computes is a rule nothing tests. `checkOutcome` now owns it and the app renders what it says |
| D105 | Two of the three victories are in the engine | Domination and Science are statements about units, cities and topics, all of which the engine owns. **The Exam victory is not here on purpose**: it is a statement about weighted readiness against a real certification outline, and the engine is not allowed to know such a thing exists (D35). It belongs to the learning layer |
| D106 | Defeat outranks victory | An empire with nothing left cannot claim a win in the same breath, even in the edge case where the last topic completes on the turn the last unit dies. Tested explicitly, because it is the kind of tie nobody thinks about until it happens on screen |
| D107 | Domination needs someone to dominate | A sandbox started with `spawnAntagonists: false` has no rivals, so "every rival is gone" is trivially true and a naive check declares victory on turn one. Exactly the sort of thing that would first appear in a live demo |
| D108 | The ending interrupts | A finished game used to keep accepting turns, with only a log line that scrolled away. The overlay stops play, disables the turn button, and offers a new empire on the same seed, because there is nothing to go back to |
| D109 | **All seven antagonists take the field** | One per cluster, as 5.7 always said. With only the Silo Horde in play, **six of the seven clusters never tested the player at all** and the diegetic study planner covered one seventh of the exam. Fighting on two fronts now means revising two branches |
| D110 | Antagonists are hostile to the player and nobody else | The first seven-faction run had them deleting each other: `targetsFor` returned everything not their own, so the first raid landed on **turn 2 of every seed** and the player was not in it. There is no diplomacy model here and there should not be one. These are seven misconceptions besieging a learner, not seven nations with interests |
| D111 | Camps must be six hexes apart | The greedy pick takes the nearest wastes tiles, which are usually neighbours, so without a separation rule all seven spawn as one doom-stack on one side of the map and six of them still never arrive |
| D112 | Two units each, not three | Seven factions of three is twenty-one raiders against a starting pair. Two each keeps each front survivable alone while the total makes standing still fatal, which is the balance this was meant to correct |
| D113 | Corruption follows any antagonist | `refreshCorruption` compared against one hard-coded faction id and would have silently ignored the other six the moment they took a city |
| D114 | **The Exam victory, and it lives in the learning layer** | The third victory from 5.8, and the only one the engine must never own: it is a statement about weighted readiness against a published outline, which the rules layer is not allowed to know exists (D35). The app asks `learn`, and tells the engine nothing but that the game is over. `EndOutcome` is a superset of the engine's `Outcome` for exactly this reason |
| D115 | **The paper is weighted, not split evenly** | Branch B is 45 to 50 percent of the real exam and 18 of the 41 skills. An even three-way split would be a different exam wearing this one's name, and would tell the player they were ready for something they are not. Asserted to within two questions of the published proportion, plus an explicit check that B really is the largest |
| D116 | 40 questions, 70 percent to pass | The real paper is 40 to 60; forty is the bottom of that range and already a long sitting inside a strategy game. 700 of 1000 is the published pass mark, and it is a scaled score rather than a share of questions, so the approximation is labelled wherever it is shown |
| D117 | The Proctor calls at 80 percent, above the pass mark | Being invited a little before passing is certain is the point: the siege has to be a real test, not a lap of honour handed out once the outcome is settled. A test asserts the threshold sits above the pass mark and below 1 |
| D118 | Failing is not fatal | An unconvinced Proctor says so and the game continues. This is a study tool: the answer to "not ready yet" is another go, not a lost campaign |
| D119 | Exam answers feed the schedule | It would be perverse for the hardest study session in the game to be the one that teaches the spaced repetition system nothing. A player who fails returns to a schedule that knows which branch let them down |
| D120 | ⚠️ Deviation: per-question timers, not one 100-minute clock | 5.8 asks for a siege timed over roughly 100 minutes of game time. Each question is timed at 45 seconds instead. A single wall clock ticking for an hour and a half is the real exam's shape and not a game's, and the per-question timer is the one already built, understood and pausable |
| D121 | **Cinematics are rendered live, never played back** | "A video before the first fight" could have meant shipping video files. This repository has deliberately shipped no assets at all (D59), and a pre-rendered clip would be wrong on its own terms anyway: it would show a battlefield that is not the player's. The camera moves through the real, seed-generated world, so the establishing shot of a city is a shot of *that* city on *that* hill |
| D122 | A shot is a pure function of normalised time | Which makes it testable without a renderer, and makes a skip nothing more than a jump to t = 1. Eleven tests cover the geometry: the camera never ends up below its subject, it always travels, it clamps outside its own duration, and a degenerate direction produces a frame rather than NaN |
| D123 | The cinema owns the camera and puts it back | Same hand-back problem the drone had. `OrbitControls.update()` re-applies the orbit pose every call, so a shot must disable it, and leaving the player wherever the last frame ended would strand the map camera at a cinematic angle, often under the terrain. The pose from before the shot is saved and restored |
| D124 | Once per run, first time only | The whole value of an establishing shot is that it marks something as new. The fourth city is not news, and a game that stopped to admire every one would be unplayable by turn twenty. Reset on a new empire, not carried in the save: these mark the beats of a run |
| D125 | Skippable from the first frame, and it says so | These fire exactly where a replaying player has already been. ⚠️ The skip key handling has to stop the event reaching the map: **space ends the turn**, and ending a turn because someone skipped a cutscene would be a nasty surprise |
| D126 | The interface leaves the frame | The first version composed the shot behind the research panel and the unit card, which is the difference between a cinematic and a screenshot of a game with black bars drawn on it |
| D127 | **"Who is coming": the study planner made readable** | The central mechanic was working and invisible. A player could be raided by the Scan Wraiths four times without ever learning that the Scan Wraiths mean B3, or that B3 is the branch they have not revised. The panel puts the two halves of the game in one row: where a faction is, from the engine, and how ready you are for its cluster, from the learning layer |
| D128 | Sorted by distance, not by name | It is a priority list rather than a roster. The nearest faction is the one whose cluster to revise tonight, and a row turns amber the moment its distance falls inside the current leash |
| D129 | **Published private first** | `KornAlexander/fabric-empires`, private, `main`, 30 commits. Public before submission. Note the GitHub Pages fallback cannot serve from a private repo on a personal plan, so going public is a prerequisite for that link, not a formality |
| D130 | **The art programme is reinstated in full** | Reverses the drift towards D59 being the whole answer. Terrain, water and ground cover stay procedural; the ~250 generated assets are *content* art on top of that. The `.gitignore` already had the right shape: generated art is never committed, only reproduced from `tools/art`, so the repository still ships no binaries and has no licences to defend |
| D131 | Sound is effects **and** a procedural ambient bed | Code-generated WebAudio throughout, so still no asset files. The bed shifts with the threat level, which makes "who is coming" audible as well as readable |
| D132 | `prdsweden` is the primary link, Pages the fallback | Confirms D37 rather than taking the safer Pages-only route. The capacity question in 17 therefore becomes a blocking item rather than a curiosity |
| D133 | The name stays | "Fabric Empires" keeps a product name in the title of a personal project. The two-part README disclaimer (D33) carries it, and the trademark scan stays a warning (D47) |
| D134 | The demo voiceover is the cloned voice | Not `edge-tts`. It is a personal entry and it should sound like one |
| D135 | **I draft every public post and never publish one** | The LinkedIn rule now covers Discord too. Entry text, LinkedIn post and blog draft all get written and staged; the submission itself is yours to make |
| D136 | **Corruption is drawn at last (D56)** | `refreshCorruption` had been maintaining a set of corrupted hexes for days and assigning it to a variable **nothing ever read**. The rule existed as bookkeeping and never as a picture. Torn scanlines in clashing hues now cover the Ungoverned Wastes and any ground an antagonist holds |
| D137 | The wastes are corrupted in their own right | The first pass only marked antagonist city territory, and no antagonist founds a city, so the effect would have stayed invisible for a second reason after being made visible for the first |
| D138 | Corruption must be able to **darken**, not only add light | Purely additive, it washed out to a faint pink haze on sunlit sand: present in the scene graph, invisible on screen. It now goes almost black between the scanlines so only the lines glow, which is what reads as a broken signal rather than as coloured terrain. This is the one surreal thing in a scene that otherwise aims at plausibility, and it should look like it does not belong |
| D139 | **The siege is on the 1 September path** | Your call, against my recommendation to defer it. It becomes phase 4 and the headline feature, with a dated trigger in 19.5 that cuts the multi-turn half if the assault is not playable by 28 August |
| D140 | Set piece at the city hex, no second board | The cinematic camera already exists and can hold the camera for a sequence. A separate tactical map would have been roughly three times the work and would have left the real, seed-generated world behind at the most dramatic moment |
| D141 | One question per assault round, deciding whether the tactic lands | Not a single breach question and not a pre-unlock. It keeps the pressure per round and it keeps the existing rule that a battle asks about the *defending* faction's cluster, so besieging the Scan Wraiths drills B3 repeatedly |
| D142 | **Walls are built and upgraded** | The Stronghold staple, and the largest engine change on the list: new city fields, a production category competing for the same capped Compute, save version 4, and an AI that understands a wall. Without it a siege is an assault on a health bar with better staging |
| D143 | The defender gets all four options | Hold, sally, reinforce, endure. Today the defender is a number; in Stronghold the defender is the more interesting side to play, and the AI picks by rule so an antagonist city defends itself the same way |
| D144 | Multi-turn investment, with the assault inside it | The two answers that looked like a conflict are the design: the siege persists on the map, and each assault is the set piece |
| D145 | **One period: around 1600** | The game had no era at all. Concrete-and-glass cities, tracked vehicles and a realistic landscape were three different centuries in one frame, which is most of why it looked wrong. 1600 is chosen because it is the last moment when fortifying a city was decisive, which makes the siege the centrepiece rather than a side mechanic. **Supersedes D55** |
| D146 | The city is a bastioned town, not a keep | Around 1600 the *trace italienne* had made the tall curtain wall obsolete: cannon flattened stone, so ramparts went low, thick and earthen, and corners grew angled **bastions** covering each other by fire. Drawn as a glacis, a battered rampart, three arrowhead bastions, tiled houses and a church spire. It is also exactly the shape the siege (19) has to reduce |
| D147 | Highlands recoloured to moorland | `#9d8464` was a pale pinkish tan and was the ugliest thing on the map: a warm beige third of the landmass with nothing growing on it. Now a dark olive that lets the slope-driven rock mix show through on the steep faces, which is where the shape is |
| D148 | ⚠️ **The units are now the mismatch** | With the town at 1600, the roster is visibly wrong: tracked hulls, gun rings, emissive strips. Pike, shot, horse and cannon instead. This is the single largest remaining visual job and it is what the art programme should spend itself on first |
| D149 | **Fog of war from the first turn** | The whole map is currently visible from turn one, which gives away every camp, removes any reason to scout, and makes the Profiler pointless. Only what a unit or city can see is revealed, and what has been seen stays remembered but not live |
| D150 | **The map is 3.2 times bigger** | Radius 25 to 45: about 6,200 hexes against 1,950, and 156 world units across against 87 |
| D151 | Everything tuned against the map is now **proportional to it** | The aggro leash, the camp separation and the minimum spawn distance were all absolute numbers measured on a radius-25 map. Left alone, the far camps would have sat 45 hexes out and taken 121 turns to notice the player: a bigger map would have been an emptier one |
| D152 | ⚠️ The spawn distance must stay ahead of the leash, and a test says so | Scaling the leash but not the spawn distance put camps *inside* the opening leash. Measured on seed DP600: raided turn 4, wiped turn 5, which is exactly the failure the leash exists to prevent. The test now asserts the ordering rather than comparing against a constant that was never the one that mattered |
| D153 | Erosion droplets scale with grid area | Fixed at 140,000 on three times the area, each cell gets a third of the rain, the valleys stop cutting, and the bigger world comes out blander than the small one. Capped at 240,000 for the cold-start budget |
| D154 | The golden map digests are pinned at an explicit radius | They called `generateMap(seed)` and so mixed determinism with default size, meaning a resize broke a test about determinism. Held at 25 they are **unchanged across the resize**, which is the actual evidence wanted: the world grew and the generator did not move |
| D155 | **Archipelagos, reversing a Tier 0 cut** | Naval units were cut before any code was written. Measured first: every seed produced **one** landmass and **0 percent** of land off it, so ships would have been boats with nowhere to go |
| D156 | The islands come from a multi-centre mask, not from noise | Swept frequency, land fraction and falloff: every combination still left one continent with 97 to 100 percent of the land, because fbm is dominated by its lowest octave and `edgeFactor` is a single hill at the origin. One centre reproduces the old continent exactly, so the goldens still hold |
| D157 | Land fraction has to fall for islands to survive | Classification is by quantile, so a fixed share of tiles becomes land whatever the mask says and the sea between islands gets promoted instead. About 0.3 fits the land inside the masks |
| D158 | ⚠️ **Islands stay off by default until ships exist** | Turning them on broke the game and the tests said so exactly: three AI tests and the defeat test failed because land units cannot cross water, so factions on other islands never arrive. The capability lands tested and disabled; the default flips when the AI can cross, not before |
| D159 | Antagonist camps may use any island | The camp filter required `map.mainland`, which was right while every map was one continent and would have quietly put all seven factions on the player's own island |
| D160 | **Anno 1602 is the reference for depth** | It is set in 1602, the era already chosen at D145, and its premise is colonising an archipelago, which is the generator built at D155. Its real lesson is that the engine of the game is **escalating demand**, which is the same shape as studying for an exam |
| D161 | **Cities demand mastery, not goods** | Anno's tiers want cloth, then tobacco, then spices. Ours want a bound topic *seen*, then *familiar*, then *strong*, then most of a cluster. Failing the demand stalls growth. It turns forgetting into a visible economic event: today a lapse costs a bonus, here it can cost a city its tier |
| D162 | **Island affinity forces breadth** | In Anno an island grows tobacco or it does not, and that is what makes you settle a second. Here each island favours certain clusters, so one island cannot carry an empire, and it cannot carry an exam either. The geography then argues for the thing DP-600 actually requires: you cannot pass it on one branch |
| D163 | Production chains map onto the medallion architecture | Anno's "line of production" has an exact counterpart in raw files to Bronze to Silver to Gold. A real pattern, on the real exam, and a genuine chain rather than a metaphor stretched over one. **Post-contest** |
| D164 | Pacing responds to readiness | Anno 1602's AI is documented as adapting to how quickly the player acts. The leash is already a function of the turn; making it partly a function of exam readiness gives a fast learner a harder game and a struggling one room. Cheap, and the honest difficulty curve for a study tool |
| D165 | Ships carry cargo, not cannon | Anno upgrades hold size rather than firepower, and its peaceful strategies are the praised ones. Transport and trade are the point of phase 23; naval combat is a consequence |
| D166 | ⚠️ Three Anno ideas are deliberately refused | Trade routes would be a logistics interface serving a game about revision. A tax slider would compete with the review loop, which already is the satisfaction mechanic. And a neutral trader selling progress is the wrong message in a study tool: if one ever exists it sells time, never answers |
| D167 | ⚠️ The hex grid follows the surface instead of cutting a chord across it | The map looked "cut apart with gaps". It was not geometry: the ground is one welded indexed mesh, 309,418 vertices and 596,256 triangles with no holes. The grid drew **one straight segment per hex edge** while the surface between those corners is subdivided four ways, displaced by detail noise and then eroded. A straight line under a curved surface sinks below it mid-edge and surfaces near the corners, carving a dark groove around every tile. Each edge is now sampled at the terrain's own subdivision points, where `finishedHeight` already holds the final smoothed and eroded height, so the line lies **on** the mesh: 18,906 segments became 75,624, and the lift dropped from 0.035 to 0.02 because it only has to clear depth precision, not a bulge |
| D168 | The seams got worse when the map grew, and that is why they surfaced now | Relief per hex is unchanged, but radius 25 to 45 put far more displaced surface between the camera and the horizon, so the chord error was visible across thousands of tiles at once instead of a few dozen. A rendering shortcut that is invisible at one scale is not therefore correct |
| D169 | Every antagonist holds a village from turn one | They were seven pairs of units standing on open ground. They could raid the player forever and the player could never take anything from them, so the war had no object. It also meant the capture path in `combat.ts` was **unreachable code**: fully written, fully tested against hand-built states, and impossible to reach in a real game |
| D170 | ⚠️ Capturing is the only one of the three that teaches you anything | Each faction quizzes on its own DP-600 cluster, so taking its village grants a foothold in that cluster. This is the whole feature. Loot is spent; a cluster is learned. A player who razes everything finishes rich, undefeated and narrow, which is exactly how a real candidate fails this exam |
| D171 | Razing is deliberately the tempting option | It pays 55% of a village's worth against a raid's 12%, it is fast, and it is final. A choice where the right answer is obvious is not a choice. The cost is invisible at the moment you pay it, which is the point |
| D172 | Raid and raze are separate verbs | Raze is a decision made at the instant the walls fall, so it rides on `attack` as `cityOutcome`. Raid is its own action: adjacent, melee only, no need to break anything, on a four-turn cooldown. Without the cooldown a unit parked beside a village is an income stream and standing still becomes optimal, which is the one behaviour this game exists to punish |
| D173 | A razed village leaves a ruin, not bare ground | Inert: no yield, no defence, no production. It exists so the late map remembers the war and so a razed hex does not read as somewhere you could still march on. Kept as its own record rather than a tile flag, because tiles are map data fixed at generation and a ruin is something that happened |
| D174 | The spoils rule respects prerequisites, and only ever fires for the player | Granting a node whose `requires` are unmet would put the tech tree in a state the research rules can never produce, and every readiness number downstream would then describe a tree that cannot exist. And `state.research` is the player's alone, so a faction-blind version would have handed the player a topic every time an antagonist took one of their cities |
| D175 | ⚠️ Villages raise troops on a fixed cadence, not out of an economy | One unit per village per six turns, capped at four per faction. The antagonists have no treasury the player can inspect, so income-driven musters would look arbitrary. A cadence is legible and it is a single knob. Uses `productionProgress`, which is already on every city, already saved, and already means exactly this |
| D176 | Measured before it was allowed to stay: the curve holds | Passive player, garrisons on, six seeds: **defeated on 6 of 6, median turn 19** (range 18 to 31), first raid turn 12 to 27, and every faction pinned at the 4-unit cap by the end. Section 16.7 needs a passive player to lose and they still do. Giving seven factions unit production was the most dangerous change made to this game, and the only honest way to know was to run it |
| D177 | Domination now means taking their settlements, not hunting their units | `stillStanding` already counted cities, so seeding villages silently changed the win condition from killing fourteen wandering raiders to reducing seven places. That is a better game and it was worth making explicit, so `victory.test.ts` now asserts that clearing every rival unit while a village stands is **not** a victory |
| D178 | Raid is on `p`, not `r` | `r` is one of `flyControls`' `MOVEMENT_KEYS`, so binding raid to it would have engaged the drone and flown the camera on every raid. The same trap that already moved fortify off `f` and skip off `s` |
| D179 | ⚠️ The coastline is smoothed before land and water are split | The map read as "long narrow islands". The bulk was never the problem: the main continent scored **1.27** for slenderness against a disc's 1.13, one mass on nearly every seed. The **edge** was the problem, fringed into one-tile spits with a perimeter **3.3 to 4.2 times** that of a circle of the same area. Six blur passes over the classifying field bring that to 2.3 to 2.7 against a floor of 2.11, lift the thinnest part of the continent from 15 hexes to 25, and remove detached scraps entirely |
| D180 | ⚠️ The smoothed field is a SEPARATE field from the elevation | `rawTileHeight` in the renderer reads `tile.elevation` as the interpolant between a terrain profile's base and its range, so blurring it in place would have smoothed the coast by flattening every hill on the map. That is exactly the blandness the erosion-droplet scaling in section 22 exists to avoid. `shapeScore` decides what KIND of ground a tile is; `elevation` decides how tall it is. Measured after the split: minY ‑1.977 against ‑1.978 before, maxY 3.76 against 3.73. The relief did not move |
| D181 | Smoothing before the quantile, never tidying the coast after it | The land/water split is a quantile, so blurring first leaves the land fraction exact. Cleaning up the coastline after classification would have changed how much land there is and silently broken the composition guarantees that the whole terrain system rests on |
| D182 | Fewer noise octaves makes it WORSE, which was worth measuring | The obvious fix is to remove the fine octaves that crinkle the coast. Measured: octaves 5 to 4 or 3 took roughness from 3.28 **up** to 3.5 and 3.8, because with less high-frequency detail the low frequencies dominate and the threshold contour meanders into broad lobes instead. The blur was the right lever and the intuition was wrong |
| D183 | The golden digests are kept in two sets | Coast smoothing changed the default map, so those digests had to move. A second set pinned at `coastSmoothing: 0` still asserts the three original hashes, and they still hold, which proves the noise, mask and classification were untouched and only a new stage was added in front. Without it, "changed because I meant to" and "changed because I broke it" would look identical |
| D184 | ⚠️ Archipelagos need one blur pass, not six | The blur reach grows a hex per pass, so 6 is nothing against a 25-hex-thick continent but comparable to a small island's half-width, and it dissolves them: asking for 5 islands gave 3 to 4 masses at 1 pass and 1 to 2 at 6, with one seed collapsing to a single continent. Pinned at 1 in the archipelago test. The naval phase must choose this deliberately |
| D185 | Whole-mass averages could not see the problem | Slenderness over 2,800 tiles said the continent was fine, because it was fine in the middle. A fringe lives entirely on the boundary and any metric that averages over area will miss it. The lesson is not "measure", which was already being done, but **measure the thing being complained about**: the complaint was about the coast, so the metric had to be a property of the coast |
| D186 | A setup screen before the world, not a settings panel beside it | Three choices: world shape, roughness, seed. It also pays for itself as a loading screen: the 8.1 second cold start in section 22.2 was the worst thing about the game and all of it was a blank page. The same wait spent reading a menu is not a wait |
| D187 | ⚠️ Every faction stays on the player's landmass, whatever shape is chosen | Land units cannot cross water. A faction on another island never raids, can never be reached, and leaves Domination unwinnable because a rival still stands. That was tolerable while islands were an off-by-default capability; it is not tolerable when it is one click on a menu. Islands are terrain and strategy, not separation, until ships can carry an army |
| D188 | ⚠️ Camp placement relaxes distance and spacing rather than returning fewer camps | It used to just return what fitted. Each faction carries one cluster of DP-600, so a dropped faction is **a dropped branch of the exam**: the world shape a player picked from a menu would have been quietly deciding how much of the syllabus they could be tested on. Spacing gives way first, then the opening head start, and the roster never does |
| D189 | ⚠️ Island reach is solved from the land fraction, not chosen | Classification is a quantile, so exactly `landFraction` of tiles become land whatever the mask says. If the discs cannot hold that many, the surplus comes out of the sea between them and the islands merge: asking for eight gave two, and the old archipelago config produced **one mass of 1,770 tiles**. `reach = R * sqrt(landFraction / (n + 3))` sizes them to hold it exactly |
| D190 | Island spacing scales with the count | It was a flat `radius * 0.42` however many were requested, so seven centres could never be placed and the generator silently settled for three or four. "Many small islands" measured as 3 to 4 masses |
| D191 | ⚠️ The home island is twice the reach of the rest | An even scatter of eight left a **99-tile** home island holding the player and seven camps, with villages two hexes apart and an unsurvivable opening. Since every faction must share the player's landmass (D187), that island has to be a real place. Doubling reach quadruples area: 314 tiles, and the largest landmass is the one `chooseStartPosition` puts the player on |
| D192 | Isles are scattered by area, not by radius | Uniform in radius crowds them inwards, because an annulus has far more room in its outer rings. Measured, the first archipelago left the outer third of the map empty. Interpolating on r squared spreads them over the water |
| D193 | Roughness changes what the map IS, not how it is drawn | It moves the peaks and highlands shares, and peaks are impassable while highlands are slow, so it decides where armies can go and therefore where the war happens. 2%, 5% and 11% of the land impassable. A "taller hills" slider would have been a lie dressed as a choice |
| D194 | Presets, not sliders | Land fraction, island count, blur radius and minimum island size are not independent, and seven islands at 45% land is not seven islands. Naming three combinations that were each measured is more honest than exposing six numbers and hoping. They live in the engine, so the UI renders them and cannot invent new ones |
| D195 | A preset is a promise, so it gets a test | `worldSetup.test.ts` asserts across all 36 shape/roughness/seed combinations that seven camps are placed, all on the home island, that each shape gives the landmass count its label claims, that the home island stays above 150 tiles, and that roughness is ordered and identical on every seed |
| D196 | ⚠️ Only settings that DO something get offered | `difficulty` has been on `GameState` and in every save since the beginning and is **read by nothing**. It was the obvious thing to put on a setup screen and it would have been a dial connected to no wire. Either a setting changes the game or it does not go on the screen |
| D197 | Six settings, in two named groups | The world (shape, land, size) and the exam (focus, rivals, pace), then the seed. Grouping is what stops six controls reading as a config screen: each group answers one question, and the second group is the half that makes this a study tool rather than a strategy game |
| D198 | Rivals are chosen by id, not by count | Each faction holds one cluster of the outline, so which factions are in play decides which clusters test you. A count alone would have meant "the first three" and made the study focus impossible to express. `antagonistIds` also ignores unknown ids and falls back to the full roster, because this comes from a saved choice and a stale id should cost a faction, not the game |
| D199 | ⚠️ Study focus narrows who tests you, never what you may learn | The research tree is the whole outline whatever is chosen, and the Proctor still sets a paper across every branch in the published proportions. Focus decides which clusters come at you in battle and which cluster capturing a village opens. A candidate weak on one branch can make that branch the war. The screen says exactly this, because a "focus" that silently removed two thirds of the syllabus from a study tool would be the worst bug in the project |
| D200 | Focus orders the roster, the count sizes it | Branch A has only two clusters, so "focus A, five rivals" has to borrow three from elsewhere rather than quietly return two. Fewer factions is fewer villages and a shorter game than the player asked for |
| D201 | Pace scales every question's time limit, and is a function not a constant | `scoreFor` grades on how much of the limit was spent as well as on correctness, so pace moves both thinking time and what a fast answer is worth. Computed per question rather than captured once, or the first game of a session would keep its timings for every game after it. Floored at 4 s so no pace can make a question expire on arrival |
| D202 | Size is offered because loading time is a feature | Radius 30, 45 and 56 is 2,791, 6,211 and 9,577 tiles. Measured end to end in the browser: **3.8 s, 5.3 s and 7.8 s** to playable. Section 22.2 called the cold start the worst thing about the game, and "small" is the answer for someone who wants to be in a game rather than watching one build |
| D203 | ⚠️ The threats panel listed factions that did not exist | It mapped over all seven `ANTAGONISTS` rather than over the factions in the game, so a three-rival game showed four extra enemies, permanently "gone" and at infinite range. Found by counting the rendered rows against the chosen rival count, not by looking at it |
| D204 | ⚠️ A loose Playwright selector silently tested the wrong thing | `getByRole('button', { name: 'Small', exact: false })` matched "Many **small** islands", which sits earlier in the DOM, so two runs used an archipelago neither had asked for and both reported the same land count. The giveaway was the number: 932 land tiles is exactly 0.15 x 6,211, a fraction no continent preset uses. Scope to the group and match exactly |
| D205 | ⚠️ **No cheat may touch mastery.** This is the line the whole feature is built around | Cheats move Compute, armies and turns. Not one of them writes to the spaced-repetition data behind the readiness figure. A code that could show somebody a green 82% would be worse than useless, because they would act on it and sit an exam they cannot pass. Enforced by a test that reads `cheats.ts` as text with comments stripped and fails on any reference to mastery, sm2, the library model or the readiness figure, so the guarantee covers the NEXT cheat somebody adds rather than only today's |
| D206 | `sitthepaper` opens the exam, it does not pass it | The natural cheat here is "make me ready". Instead this summons the Proctor early and still asks all forty questions at the real pass mark. It gives access, never a result, and is arguably a feature rather than a cheat: practising the paper before the game thinks you are ready is a reasonable thing to want |
| D207 | `iknowthis` writes to the tech tree, never to the Library | Research completion is a GAME gate: it unlocks units. So the code grants the unlock and leaves the topic showing as unlearned in the Great Library and in the readiness figure. The two systems were already separate, and this is the first thing that proves it was worth separating |
| D208 | Cheats used are saved, and the end screen says so | `cheatsUsed` is on `GameState` and in save v5. A cheat a reload forgets would let somebody win with help and then see a clean victory screen. The end screen names the codes and adds that the readiness figure did not have help and never does |
| D209 | A console on the backtick, not a typed key sequence | Every letter is already taken: W A S D Q E R F fly the drone, and b, p, h, x, c, g, l are actions. A buffer listening for "onelake" would have flown the camera three times on the way. The console's input stops propagation, verified by typing `bpxh` into it and checking no city was founded and no unit moved |
| D210 | Villages survive `dropthetable` | Wiping every rival unit still leaves seven villages to walk into, and taking a village is where the questions are. A code that handed over Domination outright would skip the only part of the war that teaches anything |
| D211 | ⚠️ D35 was measured, not assumed, and it held | Every reference to DP-600 in `engine/` is a **comment**. `unlockedBySkill` is a 1-based index into the topic graph rather than a topic id, exactly as its doc comment promised. The seam is three methods on `ChallengeProvider`. A second campaign needs **no engine change**, which is what the boundary was for and what nothing had yet proved |
| D212 | ⚠️ A campaign needs at least 41 topics, and now the tests say so | `UNIT_TYPES` unlocks at indices up to 41. A shorter curriculum silently never unlocks its late units and nothing warned. Found by reading the unlock table against the DP-600 node count, not by playing |
| D213 | The antagonist roster moves out of the engine into campaign data | `ANTAGONISTS` hard-codes clusters `A1`..`C2`, which are DP-600's. They are opaque strings to the engine, so this was not a bug, but a Year 1 campaign needs Die Zahlendreher rather than the Silo Horde. `NewGameOptions` already takes `antagonistIds`, so the roster becomes a parameter rather than a rewrite |
| D214 | Abstraction before 1 September, German content and interface after | The Discord challenge closes 1 Sep and is a DP-600 challenge. The campaign layer is additive, testable and makes the submission's central claim demonstrable. The i18n pass touches ~165 strings across every UI file the submission depends on, and that is not a thing to do in the last week |
| D215 | A typed string catalogue, not English-as-key | Half of these strings are sentences with substitutions. Typing `de.ts` against the same key union as `en.ts` makes a missing translation a **compile error** rather than an English word appearing mid-sentence in a German game |
| D216 | ⚠️ Year 1 questions are constrained by reading, not by curriculum | A six-year-old is still learning to read and this game asks written questions under a time limit. Stems of a few very simple words, single-word or numeric options, and `relaxed` as that campaign's default pace. A question needing a paragraph read is not a Year 1 question however good it is |
| D217 | Identical mechanics for the school campaigns, softer wording | The request was "everything identical, just different questions". Forking the rules would fork the tests. Villages are "aufgelöst" rather than burned |
| D218 | ⚠️ The attack is shown before the question about it | A defence question opened the instant the preview turn detected a raid, with one line in the log as the only clue. Being asked to defend against an attack you have not been shown is **indistinguishable from being quizzed at random**, which throws away the entire faction design: who is marching on you is supposed to tell you what you are about to be tested on. Now the camera goes to the threatened tile, it flashes and pulses in the attacker's colour, and a banner names the faction, what it is hitting and the topic. Measured: the banner lands **1.9 s** before the modal |
| D219 | The warning stays up during the question, above the backdrop | The faction is the REASON for the topic, so hiding it at the moment of asking would undo the fix. The question's backdrop is 72% black with a blur, so a banner beneath it is dimmed to a quarter and out of focus, which for something whose only job is to be read is the same as not showing it. Banner z-index 55, backdrop 50, asserted in the browser test |
| D220 | The banner counts the other fronts | Only the first raid gets a question, but a turn can bring several. "and 2 more fronts" is the difference between a skirmish and being surrounded, and the player could not otherwise tell |
| D221 | ⚠️ The turn's result is held back until the raid has been watched | Enemy raids only ever got a camera shake and a floating number, because `endTurn` applied the whole turn before anything could be drawn and the defender was gone by then. Answering a question and then simply losing health, with no blow on screen, makes the question read as a toll rather than a defence. `doEndTurn` now keeps `state` at the pre-turn world and hands the result to the presentation, which adopts it at the exact frame of impact. That is the contract the player's own attacks have always used, now used by both sides |
| D222 | Only the first player-facing raid gets a full duel | Adopting the result applies the WHOLE turn at once, so every later raid is already resolved and cannot be choreographed. The first one is also the one the question was about, which is the one that has to be seen. The others keep the camera, shake and damage number, and the warning banner has already said how many fronts were coming |
| D223 | ⚠️ A raider's strike position is replayed, not read | A unit may move up to three times and then attack in the same turn, so the hex it started the turn on is not the hex it swung from, and its position after the turn may be the defender's tile it just took. The strike hex is reconstructed by replaying that unit's own move events. A lunge that starts in the wrong place is worse than no lunge |
| D224 | ⚠️ Input is locked while the world on screen is a turn behind | The direct consequence of holding the result back: for those few seconds `state` is deliberately stale, and a click would move a unit in the old world and have the move silently overwritten on adoption. Guarded in `actOn` and in the key handler, released in a `finally` so a failed presentation cannot leave the game locked |
| D225 | ⚠️ Research resolution moved after adoption | `resolveResearch` asks a question and then writes to `state`. Left where it was, it would have started while the result was still held back and had its work overwritten a moment later. The hazard was created by this change and had to be found by reading it, because no test covers a research completion landing in the same turn as a raid |
| D226 | Fog of war: the map starts dark except the ground your soldiers stand on | Requested directly, and phase 3b of the delivery plan. `explored` is a set of hex keys on the state, seeded at creation from the starting units' sight, grown after every move and every turn. Measured on a standard map: **61 of 6,211 hexes** known at turn one, 99% hidden, and **0 of 7 enemy villages drawn** |
| D227 | ⚠️ The antagonists do not use fog, on purpose | Section 21 said so and it still holds. Fog is a device for the player's experience of discovery, not a difficulty setting, and an AI that had to scout would arrive later and less reliably, quietly undoing the leash tuning measured in section 16.7. Asymmetry here is honest: the opponent is a study planner, not a rival explorer |
| D228 | Explored ground is remembered but not live | Two layers: unseen is opaque, remembered is 62% translucent. You keep the shape of the coastline you walked, and you do not keep the army that has since marched onto it. Entities are hidden on any hex not currently in sight, which is why a village you found can disappear again |
| D229 | ⚠️ `hexPatch` cannot occlude, so fog needed `hexLid` | `hexPatch` fans six flat triangles from the hex centre to its corners while the surface between is subdivided, displaced and eroded: the same chord-versus-curve error as D167. For a translucent highlight it only flickers; for fog it means a patch buried inside a hill hides nothing. Conforming honestly would be 288 vertices per hex, about 786,000 for a fogged map, so the lid is flat and sits above the hex's true peak: 18 vertices |
| D230 | ⚠️ `surfaceAt` is not the height of the ground | It reads exact mesh vertices and falls back to the coarse control lattice in between, which on a displaced surface is well below what is drawn. Sampling nineteen points of it across a hex still underestimated every hill. `peakAt` is measured from the finished vertices in the pass that already walks them, and is the only safe height for anything that must sit on top |
| D231 | ⚠️ Fog must hide the forest, not merely cover the ground | Every one of 6,150 lids had positive clearance over its terrain and the map still looked unfogged, because 4,199 trees and 1,652 rocks were standing straight through a lid a tenth of a unit high. Raising the lid above the canopy would leave fog visibly floating at low camera angles, so the scatter collapses hidden instances to zero scale instead: one pass over 6,000 matrices, no rebuild |
| D232 | ⚠️ **The lid was wound upside down, and that was the whole bug** | Every triangle's normal was **-0.866 on Y**, so from a camera looking down the entire layer was a back face and `FrontSide` culled it. It cost a long hunt because the layer was provably present, opaque, above the terrain, unculled by frustum, and passing the depth test, and still drew nothing. `hexPatch` had the same winding all along and got away with it only because its overlay material is double-sided |
| D233 | ⚠️ Two measurements that agreed and were both wrong | A per-hex clearance check bucketed the lid and the ground with the same rounding `peakAt` uses, so it could only agree with itself: it reported zero buried lids on a visibly unfogged map. And a "ground" probe selecting a mesh by `vertices > 100000` matched the **fog** (110,700), so a bounding-box comparison was the fog against itself. A measurement that cannot fail is not evidence |
| D234 | ⚠️ `turn() >= 1` is not a signal that a game has started | `state` is initialised with a placeholder game at module load, so `turn()` returns 1 while the setup screen is still open, with seed FABRIC and a world nobody chose. Every browser test that waited on it was measuring the placeholder. Wait on `seed()` matching the seed that was typed |
| D235–D242 | Two players on one screen | Recorded in full in section 30.3 |
| D243–D253 | The period pass: units as wargame stands, a fort with an inside | Recorded in full in section 31.5 |
| D254–D260 | The opening title sequence and the anthem | Recorded in full in section 32.6 |
| D261–D268 | Settlements that develop, Siedlung to Großstadt | Recorded in full in section 33.4 |
| D269–D272 | The clock was grading reading speed, not knowledge | Recorded in full in section 34.4 |
| D273–D277 | Ritter: the elite melee units ride | Recorded in full in section 35.3 |
| D278–D283 | Two languages, one switch | Recorded in full in section 36.4 |
| D284–D290 | Bring your own questions, from a spreadsheet | Recorded in full in section 37.3 |
| D291–D298 | Two editions, and a coach that reads your progress | Recorded in full in section 38.5 |
| D299–D310 | A score that runs under the game | Recorded in full in section 39.6 |
| D311–D323 | The films had no sound | Recorded in full in section 40.6 |
| D324–D334 | Photoreal, measured against a photograph | Recorded in full in section 41.9 |
| D335–D340 | A fortified unit could never get up again | Recorded in full in section 42.5 |
| D341–D346 | The trailer, re-cut at the graded look | Recorded in full in section 43.5 |
| D347–D352 | The empire studies something, whether or not you told it to | Recorded in full in section 44.5 |
| D353–D359 | The opening was singing over itself | Recorded in full in section 45.5 |
| D360–D366 | Somewhere to build | Recorded in full in section 46.6 |
| D367–D375 | Questions for a topic nobody shipped | Recorded in full in section 47.5 |
| D376–D381 | Say what kind of game this is, and check the claim | Recorded in full in section 48 |
| D382–D384 | Build the shaders before the film, not during it | Recorded in full in section 49 |
| D385–D389 | The fog was a hole in the world | Recorded in full in section 50 |
| D390–D397 | The gate that was only ever described | Recorded in full in section 51 |
| D398–D403 | Deployed, and what the platform decided for us | Recorded in full in section 52 |
| D404–D411 | The deployment was distributing the soundtrack | Recorded in full in section 53 |
| D412–D418 | Walls: the first piece of the siege | Recorded in full in section 54 |
| D419–D423 | The walls were never actually being hit | Recorded in full in section 55 |
| D424–D428 | Antagonists fortify, and a bug that was not one | Recorded in full in section 56 |
| D429–D433 | The wall you see is the wall you built | Recorded in full in section 57 |
| D434–D437 | The walls were a locked door, and every test agreed they were fine | Recorded in full in section 58 |
| D438–D441 | Tactics: going at a wall is a decision | Recorded in full in section 59 |
| D442–D444 | Opening the door that had never been opened | Recorded in full in section 60 |
| D445–D448 | The AI gets the same three choices, and sap stops lying | Recorded in full in section 61 |
| D449–D451 | A floor on effort, not on technique | Recorded in full in section 62 |
| D452–D459 | A Pro subscription, and the backlog it unblocked | Recorded in full in section 63 |
| D460–D467 | The soundtrack shipped, and the game could not hear it | Recorded in full in section 64 |
| D468–D472 | Somebody finally played it to the end | Recorded in full in section 65 |
| D473–D477 | Two words, and the assessment that looked in the wrong place | Recorded in full in section 66 |
| D478–D483 | The film was cut to a recording that no longer exists | Recorded in full in section 67 |
| D484–D487 | The hardest session was the one that taught nothing | Recorded in full in section 68 |
| D488–D492 | Eight panels, four corners, one phone | Recorded in full in section 69 |
| D493–D497 | The unit table was a statement about DP-600 | Recorded in full in section 70 |
| D498–D502 | Fullscreen, and a skier | Recorded in full in section 71 |
| D503–D510 | The defender stops being a number | Recorded in full in section 72 |
| D511–D515 | The screen you look at most was in the wrong language | Recorded in full in section 73 |
| D516–D519 | Auditing the learning loop, and finding it sound | Recorded in full in section 74 |
| D520–D526 | The first screen opened halfway through itself | Recorded in full in section 75 |
| D527–D534 | The film was made by hand, so it drifted | Recorded in full in section 76 |
| D535–D543 | The course picker was a control that did nothing | Recorded in full in section 77 |
| D544–D553 | A film before the film | Recorded in full in section 78 |
| D554 | The score played on top of the teaser | Recorded in full in section 78.7 |
| D555–D557 | The fog was a flight of steps | Recorded in full in section 78.8 |
| D558–D566 | Three buttons, one of them lit | Recorded in full in section 79 |
| D567–D574 | The film was singing along to the wrong words | Recorded in full in section 80 |
| D575–D582 | The fog was a hole, not weather | Recorded in full in section 81 |
| D583–D590 | The advice was correct, drawn, and invisible | Recorded in full in section 82 |
| D591–D600 | The ground opened after the fact | Recorded in full in section 83 |
| D601–D606 | Taking cover made the city easier to take | Recorded in full in section 84 |
| D607–D613 | Digging in was worth forty percent and nothing else | Recorded in full in section 85 |
| D614–D620 | A cheat that crosses the line the file drew | Recorded in full in section 86 |
| D621–D623 | The rank in the sentence was not the rank on the row | Recorded in full in section 87 |

### 28. Cheat codes

Press **`** (backtick) to open the console. Type `help` to list them, `Escape`
to close.

| Code | Does |
|---|---|
| `onelake` | 500 of every resource |
| `f64` | 2,000 Compute |
| `refreshnow` | Every unit you own healed and remobilised |
| `directlake` | A Direct Lake Titan appears at your capital |
| `mirrored` | Duplicates the selected unit |
| `dropthetable` | Destroys every rival unit. Villages still stand |
| `iknowthis` | Completes the topic you are funding, without answering |
| `sitthepaper` | Summons the Proctor now. You still have to pass |

Codes are matched case-insensitively and with spaces stripped, so `ONE LAKE`
works.

#### 28.1 What no cheat does

⚠️ **None of them can make you look ready.** This game's only real output is the
readiness figure and the Great Library behind it, both built from spaced
repetition over questions actually answered. A code that wrote to that would
hand somebody a false belief about themselves and they would act on it.

So the two codes that come near the exam are deliberately shaped:

- **`sitthepaper`** gives access to the Proctor, never a result. Forty
  questions, same pass mark.
- **`iknowthis`** completes research, which is a *game* gate that unlocks units.
  The Great Library still shows the topic as unlearned, because that is the
  number that decides whether you are told you are ready.

This is enforced rather than intended. `app/test/cheats.test.ts` reads
`cheats.ts` as source text, strips the comments, and fails if it so much as
mentions `mastery`, `sm2`, `buildLibraryModel`, `examRetained` or
`proctorReady`. Calling today's codes and checking they behaved would prove
nothing about the next one somebody writes.

#### 28.2 They are recorded

Every successful code is appended to `state.cheatsUsed`, which is part of the
save (v5). The end screen names them and adds the line that matters: the
readiness figure did not have help, and never does. An empire built with
assistance is welcome, and says so.

### 29. Campaigns: the same game, a different syllabus

**Status: PLAN ONLY. Nothing below is built.** Requested 22 Aug: a Year 1
version (Mathe und Deutsch) and a Year 4 version (Deutsch), identical game,
different questions, with the interface in German for those two.

#### 29.1 What the survey found, before designing anything

This is the first real test of D35, the rule that the engine is a complete
strategy game that knows nothing about certifications. Measured rather than
assumed:

| Question | Answer |
|---|---|
| Does the engine reference DP-600? | **Only in comments.** Five mentions, every one prose |
| How do units unlock? | `unlockedBySkill` is a **1-based index** into the topic graph, explicitly so the engine need not know what a topic id looks like |
| Where is the seam? | `ChallengeProvider`: `topics()`, `present()`, `dueTopics()`. Three methods |
| How much is DP-600 specific? | All of `learn/`, which is the layer designed to be replaced |
| How much English is baked into the UI? | ~147 string literals in `app/src`, 18 in `index.html` |
| Size of the existing bank | 123 questions across 7 clusters, 41 topics |

⚠️ **The one hard constraint nobody has hit yet.** `UNIT_TYPES` unlocks units at
skill indices up to **41** (Refresh Guard 41, Direct Lake Titan 39, Semantic
Colossus 36). A campaign with fewer than 41 topics silently never unlocks its
late units, and nothing warns about it. Any new curriculum needs **at least 41
topics**, or the unlock indices need to become fractions of the tree.

#### 29.2 The shape: a Campaign

A campaign is everything the game needs to teach a subject:

```
learn/content/<campaign>/
  campaign.json     id, title, language, exam rules, antagonist roster
  outline.json      branches -> clusters -> skills   (>= 41 skills)
  questions/src/    authoring plaintext, one file per cluster
  questions/        built bank: answers hashed, explanations encrypted
```

Three campaigns:

| id | Title | Language | Subject |
|---|---|---|---|
| `dp600` | Fabric Empires | English | DP-600, unchanged |
| `klasse1` | Reich der Zahlen und Buchstaben | German | Year 1 maths and German |
| `klasse4` | Reich der Wörter | German | Year 4 German |

#### 29.3 What has to move, and what does not

**No change at all:** `engine/`. That is the point of D35 and it survived
contact.

**Moves out of the engine into campaign data:**

| Today | Becomes |
|---|---|
| `ANTAGONISTS` with clusters `A1`..`C2` hard-coded in `gameState.ts` | `campaign.json` `antagonists[]`, passed in via `NewGameOptions`. The engine already accepts `antagonistIds`, so this is a constructor argument rather than a rewrite |

**Generalises inside `learn/`:**

| Today | Becomes |
|---|---|
| `topicIdFor` returns `dp600-${n}` | `${campaignId}-${n}` |
| `ANSWER_SALT = 'fabric-empires:dp600:v1'` | Per campaign, or the built banks collide |
| `bank.ts` statically imports 7 DP-600 files | A registry keyed by campaign |
| `DP600_OUTLINE`, `DP600_QUESTIONS` | `outlineFor(id)`, `questionsFor(id)` |
| `Dp600ChallengeProvider` | `CampaignChallengeProvider`, campaign injected |
| `SIEGE_LENGTH = 40`, `PROCTOR_THRESHOLD = 0.8` | Campaign fields. Forty questions is a reasonable exam and a cruel thing to do to a six-year-old |
| `build-questions.mjs` hard-coded paths | Loop over campaigns |

#### 29.4 The German interface

~165 strings. A typed catalogue rather than English-as-key, because half these
strings are sentences with substitutions and the log lines carry the game's
voice:

```ts
t('log.villageTaken', { name, from })   // "Silo Hold taken from The Silo Horde."
```

- `app/src/i18n/en.ts`, `app/src/i18n/de.ts`, both typed against one key union,
  so a missing German string is a **compile error** rather than an English word
  appearing mid-sentence in a German game.
- Language comes from the campaign, with an explicit override on the setup
  screen, because a German speaker may well want the DP-600 game in German too.
- ⚠️ German is longer than English, typically 15 to 30 percent. The panels are
  fixed-width (`#selection` is 290px, `#threats` 272px). Expect overflow and
  budget a pass for it rather than discovering it in a screenshot.
- ⚠️ Umlauts and ß throughout, never `ae`/`oe`/`ue`/`ss`.

#### 29.5 Curriculum sketches, both needing 41+ topics

**Year 1, seven clusters, both subjects:**

| Cluster | Skills |
|---|---|
| M1 Zahlen bis 20 | Zählen, Nachbarzahlen, Vergleichen, Zahlzerlegung, Ordnen, Zahlenstrahl |
| M2 Plus und Minus | Plus bis 10, Minus bis 10, Plus bis 20, Minus bis 20, Umkehraufgaben, Verdoppeln, Halbieren |
| M3 Formen und Größen | Kreis Dreieck Quadrat Rechteck, Muster, Längen, Uhrzeit volle Stunde |
| D1 Laute und Buchstaben | Anlaut, Inlaut, Auslaut, Vokale, Konsonanten, Alphabet |
| D2 Silben | Silben klatschen, Silbenbögen, Trennen |
| D3 Wörter schreiben | Lautgetreu schreiben, Wörter abschreiben, Groß und klein |
| D4 Lesen und verstehen | Wort zu Bild, Satz lesen, Kurzer Text |

**Year 4, seven clusters, German only:** D1 Rechtschreibung, D2 Wortarten,
D3 Satzglieder, D4 Zeitformen, D5 Wörtliche Rede, D6 Texte verstehen,
D7 Aufsatz. Roughly six skills each.

⚠️ **The Year 1 reading problem.** A six-year-old is learning to read, and this
game asks its questions in writing under a time limit. Three mitigations, all
needed: stems of at most a handful of very simple words (`7 + 5 = ?`), the
`relaxed` pace as the default for that campaign, and options that are numbers or
single words. Anything requiring a paragraph to be read is not a Year 1 question
however good it is.

#### 29.6 Tone

The DP-600 antagonists are misconceptions: the Silo Horde, the Flat Table Cult.
The same joke works for children and is arguably better teaching:
**Die Zahlendreher** (swaps 12 and 21), **Die Silbenschlucker**,
**Die Großschreib-Muffel**. The mechanics stay exactly as they are, per the
request. Wording of `raze` softens to "auflösen" rather than "niederbrennen".

#### 29.7 Order of work

| Step | Work | Risk |
|---|---|---|
| 1 | Campaign types, registry, antagonists out of the engine | Low, mechanical |
| 2 | Generalise `learn/` and the content build | Low |
| 3 | i18n catalogue, English extracted, `de.ts` stubbed | Medium: 165 strings, touches every UI file |
| 4 | Year 4 outline plus ~45 questions | Content, not code |
| 5 | Year 1 outline plus ~45 questions | Content, plus the reading constraint |
| 6 | German UI pass, overflow fixes | Medium |
| 7 | Campaign picker on the setup screen | Low |

Steps 1 and 2 are worth doing **regardless**, because they are what the D35
claim asserts and currently nothing proves. A second campaign is the proof.

⚠️ **Against the deadline.** The Discord challenge closes **1 September** and is
a DP-600 preparation challenge. None of this is part of that submission, and
step 3 touches every file the submission depends on. The safe sequencing is
steps 1 and 2 before 1 Sep if at all (they are additive and testable), and
everything from step 3 onwards after it.

#### 29.8 What is built so far

Step 1 is done, 22 Aug. DP-600 is unchanged and now runs through the campaign
layer like any other subject.

| Landed | Where |
|---|---|
| `Campaign` type: outline, questions, antagonists, exam settings, language | `learn/src/campaign.ts` |
| `DP600_CAMPAIGN`, registry, `campaignById`, `DEFAULT_CAMPAIGN_ID` | same |
| `validateCampaign`, returning every problem at once | same |
| `minimumTopicCount()`, computed from the unit table | `engine/src/entities/units.ts` |
| `NewGameOptions.antagonists`, a roster the engine has never seen | `engine/src/state/gameState.ts` |
| 17 tests, including a German roster the engine places and fights | `learn/test/campaign.test.ts` |

`validateCampaign` catches, with the exact message a content author needs: a
curriculum too short to unlock every unit, a faction quizzing on a cluster the
outline does not define, a cluster with no faction, a cluster with no questions,
and an exam whose length or pass mark is not a real number of a real thing.

⚠️ One bug found while writing those tests: an **empty** antagonist roster was
obeyed rather than rejected, producing a silent sandbox with no opposition, no
Domination ending and nothing to be tested by. A campaign that forgets to
declare its factions now falls back to the built-in line-up. Asking for solitude
deliberately is what `spawnAntagonists: false` has always been for.

**Not built yet:** steps 3, 4, 6 and 7. No interface string has been touched.

Steps 2 and 5 landed later the same day, pulled forward by the co-op work in
section 30: the content build now walks every campaign folder, and the Year 1
curriculum exists as the second seat's question source. It is a
`role: 'questions'` campaign, so it supplies questions without claiming to
build a world, which is how a 24-skill curriculum sits opposite a 41-topic
certification without either being bent to fit the other (D236, D237).


#### 27.3 The full set of choices

| Group | Setting | Options | What it really changes |
|---|---|---|---|
| The world | Shape | Continent, A few large islands, Many small islands | 1, 3 to 4, or 8 landmasses |
| | Land | Gentle, Rolling, Rugged | 2%, 5%, 11% of land impassable |
| | Size | Small, Standard, Large | 2,791 / 6,211 / 9,577 tiles; 3.8 / 5.3 / 7.8 s to play |
| The exam | Focus | Whole exam, Maintain and govern, Prepare data, Semantic models | Which clusters attack you and which capturing opens |
| | Rivals | 3, 5, 7 | Factions, villages, and clusters in play |
| | Pace | Relaxed, Standard, Exam | Question time limit x1.5, x1, x0.66 |
| | Seed | Free text | Everything, reproducibly |

⚠️ **Focus and rivals narrow who tests you, not what you may learn.** The
research tree is always the whole outline and the Proctor always sets a paper
across every branch in the published proportions. This matters more than it
looks: a study tool whose menu quietly deletes two thirds of the syllabus would
be worse than one with no menu at all.

### 27. Choosing a world

Three choices before the first turn, and the screen doubles as the loading
screen the cold start always needed.

| Setting | Options |
|---|---|
| The world | One great continent, A few large islands, Many small islands |
| The land | Gentle, Rolling, Rugged |
| The seed | Free text. Same seed and same choices, same world |

#### 27.1 What each shape actually produces

Measured across four seeds:

| Shape | Landmasses | Home island | Others | Factions reachable |
|---|---|---|---|---|
| Continent | 1 | 2,795 | — | 7 of 7 |
| A few large islands | 3 to 4 | 496 to 639 | ~145 | 7 of 7 |
| Many small islands | 8 | 313 to 322 | ~89 | 7 of 7 |

And roughness, as a share of land that is impassable peak: gentle 2%, rolling
5%, rugged 11%. Identical on every seed, because composition is a quantile.

#### 27.2 The rule that shaped the whole feature

⚠️ **Land units cannot cross water**, so every antagonist has to be on the
player's landmass. That single constraint is why the home island is twice the
reach of the others, why camp placement relaxes its spacing rather than
dropping a faction, and why islands are terrain rather than separation.

The alternative was to let factions scatter and accept that Domination becomes
unwinnable on two of the three settings. A menu option that silently removes
one of the game's three endings, and two branches of the exam with it, is not
an option worth offering. Ships (phase 23) are what change this.

### 26. The coastline

The map looked like it was made of long narrow islands. It was not. It was one
compact continent with a shredded edge, and at the zoom the game is actually
played at, a shredded edge is indistinguishable from an archipelago of threads.

#### 26.1 What the numbers said, in order

| Question | Metric | Answer |
|---|---|---|
| Is the land broken up? | landmass count | No. One mass, 2,788 of 2,795 land tiles |
| Is the continent long and thin? | slenderness, disc = 1.13 | No. 1.27 to 1.31 |
| Is it thin anywhere? | max distance to water | 14 to 22 hexes. Not thin |
| Is the render drowning it? | land tiles below sea level | 13.5%. Real, but not the cause |
| **Is the coast shredded?** | **perimeter vs a circle** | **Yes. 3.3 to 4.2, floor 2.11** |

The first four all said "fine". Only the fifth matched what could be seen,
because it is the only one that is a property of the boundary rather than an
average over the area.

#### 26.2 After

| Seed | Roughness before | after | Thickness before | after | Islets before | after |
|---|---|---|---|---|---|---|
| FABRIC | 3.38 | 2.40 | 15 | 25 | 0 | 0 |
| DP600 | 3.77 | 2.35 | 17 | 26 | 1 | 0 |
| HORDE | 3.67 | 2.43 | 22 | 25 | 0 | 0 |
| LAKEHOUSE | 4.17 | 2.66 | 18 | 24 | 0 | 0 |
| ONELAKE | 3.44 | 2.55 | 22 | 25 | 0 | 0 |
| DIRECTLAKE | 3.31 | 2.33 | 14 | 27 | 1 | 0 |

Every seed is now a single landmass. `map.test.ts` bounds roughness under 3.0
and the spindly share under 0.4%, so this cannot quietly come back.

⚠️ The floor for this metric on a hex grid is about **2.1**, not 1.0: counting
an exposed hex edge per missing land neighbour, even an ideal blob scores that.
Forty blur passes reach 2.11 and produce a featureless disc, so 2.3 to 2.7 is
deliberately short of the floor. A coast should still be a shape.

### 25. Their villages: attack, capture, raze or raid

Seven factions, seven villages, three things you may do to one. The engine already
knew how to capture a city; what it lacked was a city worth capturing.

#### 25.1 The three verbs

| Verb | Requires | Takes | Leaves | Teaches |
|---|---|---|---|---|
| **Raid** | Adjacent, melee, off cooldown | 12% of the village's worth | The village standing, +1 unrest, ‑12 HP, 4-turn cooldown | Nothing |
| **Capture** | Walls at zero, melee blow | The settlement itself | A city you now have to hold | **A foothold in their cluster** |
| **Raze** | Walls at zero, melee blow | 55% of the village's worth | A ruin | Nothing |

⚠️ **The asymmetry is the design.** Razing pays roughly four and a half times a
raid and ends the threat permanently. Capturing pays nothing immediately. The
only thing capture gives you is the loser's syllabus, and that is worth more than
any amount of Compute to a player who intends to pass the exam. The game does not
say so at the moment of choosing beyond one line of text: finding out is the
lesson.

#### 25.2 Why this is the breadth mechanic

D163 wanted island affinity to force breadth. This does it more directly. Each
faction owns one DP-600 cluster (`A1`, `A2`, `B1`, `B2`, `B3`, `C1`, `C2`), which
means **the map is the syllabus laid out geographically**, and a player who only
ever fights their nearest neighbour is revising one seventh of the exam.

The two id sets are joined by nothing but matching strings, on both sides, with no
validation. A renamed cluster or an eighth faction would not throw, would not fail
a type check, and would not fail any pre-existing test: conquest would simply stop
teaching anything and it would look like a balance problem. `learn/test/antagonists.test.ts`
exists solely to make that failure loud.

#### 25.3 What the garrison cadence does to the curve

| Seed | Defeat turn | First raid | Enemy units at end | Enemy villages |
|---|---|---|---|---|
| FABRIC | 19 | 17 | 28 | 7 |
| DP600 | 19 | 15 | 28 | 7 |
| HORDE | 18 | 12 | 26 | 7 |
| LAKEHOUSE | 31 | 27 | 28 | 7 |
| ONELAKE | 21 | 20 | 26 | 7 |
| DIRECTLAKE | 19 | 16 | 28 | 7 |

Passive player, six seeds, defeated on all six, median turn 19. The cap binds
exactly as intended: 7 factions × 4 units = 28. The experiment in section 16.7
still means what it meant.

#### 25.4 Still open

- Villages do not expand. Each faction founds nothing beyond its seat, so the map
  does not grow more dangerous in area, only in density. AI settlers are the
  obvious next step and were cut to protect the deadline.
- Ruins can be settled on, because `canFoundCity` only checks distance to cities,
  but nothing rewards doing so. A resettlement bonus is the natural follow-up.
- Walls are not modelled yet: `cityCombatSide` still defends at
  `20 + population × 6`. Phase 4, the siege, is what turns these villages into
  something you have to reduce rather than something you have to reach.

### 16.1 What "realistic" does and does not mean in this build

Delivered: physically based materials, a Rayleigh and Mie scattering sky, a
single dominant sun with soft shadows, ground-truth ambient occlusion,
ACES tone mapping, aerial perspective, real reflective and refractive water,
slope-driven rock and height-driven snow, and a smoothed continuous
landform.

Not delivered, and visible if you look for it: no surface micro-detail
(see below), no vegetation or props, primitive-built units rather than
modelled ones, and flat per-biome colour beyond the noise variation.

The micro-detail gap has a specific cause worth recording, because it was
attacked twice and abandoned twice. A tiled detail normal map sampled from
world position is the natural fix. The first attempt let three derive the
tangent frame from the derivatives of that world-space UV, which is
degenerate on steep faces and wrongly handed elsewhere. The second supplied
an explicit tangent attribute computed analytically from the known linear UV
mapping, which is correct, and still measured darker: 0.31 mean luminance
against 0.45 with no map at all. The remaining cause is the map itself, since
any noise-derived normal strong enough to be visible at this zoom tips a
large share of the surface far enough to lose the sun. An albedo detail map
provides the mottling instead: it multiplies colour rather than bending
normals, so it cannot cost the scene its light.

### 16.2 Ground cover

Roughly 1200 trees and 500 boulders, instanced, one draw call per type,
scattered by biome with a noise field so woodland forms patches instead of
an even sprinkle. This turned out to be the largest gain in perceived realism
per hour spent, and for a reason worth remembering: bare shaded ground reads
as a model of a landscape, whereas the same ground with things standing on it
reads as a place, because the props give the eye a scale reference that a
smooth surface cannot.

Uniform props undo most of that. At one size and one colour a wood renders as
a flat green mat, because a real canopy is broken up by the height and hue
difference between old trees and young ones. Per-instance colour and a wide
size spread cost nothing and fix it. A related trap: instance colour
multiplies the base material in linear space, so plausible-looking values
near 1.0 against a white base are roughly five times an ordinary rock albedo,
and every boulder on the map glows.

### 16.3 Why the terrain is eroded rather than sculpted

Fractal noise makes convincing lumps and unconvincing landscapes, because it
has no memory of water. Real ground is carved: ridges are sharp because
everything either side of them has been removed, valleys are V-shaped at the
head and flat-bottomed at the mouth, and the whole surface is organised into
drainage basins that run downhill to the sea. None of that emerges from
summing octaves, and viewers know it even when they cannot say why.

So water is simulated. Droplets run downhill, gather speed, pick up material
in proportion to speed and slope, and drop it when they slow or flatten out.
Deposition matters as much as removal: it is what builds the fans at the
mouth of every valley, and it is half of why the result reads as landscape
rather than as scratches.

Three settings were found by looking rather than by theory. Erosion applied
to a single cell cuts one-pixel gullies, so removal is spread over a weighted
disc. Channels cut at the first strength read as cracks rather than valleys,
so the rate was more than halved and the brush widened. And the per-vertex
cavity shading that darkens hollows was initially strong enough to draw the
channels as near-black scribbles across the ground: occlusion should suggest
depth, not draw it.

### 16.4 Staging a fight

The first 3D battle was measured rather than watched, and the measurement was
damning: comparing consecutive frames, the entire fight produced visible
change for four frames, about 440 milliseconds, and most of that was the
question modal closing. The units never turned to face each other, never
closed the gap, and nothing happened when the blow landed. The numbers said
so before any screenshot did.

What replaced it is a sequence in world space. Both units turn to face each
other, which alone fixes the most obvious tell that nothing is happening: two
machines fighting side-on. A melee attacker winds back, charges, stops short
of contact rather than driving through, and rebounds. A ranged one braces,
fires with a muzzle flash, and recoils while the tracer is still in the air.
The blow throws sparks and kicks dust, the defender is knocked back and rolled
by an amount scaled to the damage it took, and a loser topples onto its side,
settles into the ground and burns out.

Two things had to be true for that to work.

**Damage lands with the hit.** The engine resolves the fight before the
animation starts, but the state change is held until the frame of impact. A
health bar that empties while the attacker is still winding up reads as a bug
even though the arithmetic is right.

**Wrecks outlive their units.** The engine removes a destroyed unit the
instant the blow lands, which is correct for the rules and useless for the
animation: the object was deleted on the same frame the death sequence began,
so the topple never played and units simply blinked out. The renderer now
keeps an object alive for as long as a combat pose exists, and the duel
decides when the wreck is finally released. Verified by tracing object counts
per frame: the engine drops to five units while six are still drawn, the
sixth rolls to 1.45 radians, fades, and is then cleaned up with nothing left
behind.

### 16.5 Two lighting ratios that keep being relearned

**Sun against fill.** Fill light is untinted by definition, so every unit of
it removes colour from the scene. At the first setting the fill beat the sun
and a green island rendered uniformly blue. At the correction it was so low
that valley shadows went pure black, which real skylight never does. Measured
saturation is the honest referee: the current balance holds 0.24 with under a
third of a percent of the frame crushed to black.

**Sun elevation.** A high sun casts almost no shadow, and shadow is how a
viewer reads relief on a flat screen. Dropping it to the mid thirties roughly
doubles every shadow on the map and is the cheapest single change that makes
terrain look three-dimensional. It has a cost: at grazing angles the depth
gradient across a shadow-map texel grows, and a bias tuned at noon leaves
hard dark ribbons of self-shadowing down every slope. Normal bias is the
setting that fixes that; depth bias alone just moves the artefact.

### 16.6 The lighting bug hunt, and the lessonFive separate faults stacked up, and every one of them produced the same
symptom, a dull grey-blue landmass, which is why they were so slow to
separate:

1. Inverted triangle winding, so every ground normal faced downwards.
2. Colours converted from sRGB twice, leaving them four times too dark.
3. Bloom applied to an HDR scattering sky, whitening over half the frame.
4. A hemisphere fill so strong it drowned the sun and drained the colour.
5. A detail normal map strong enough to flatten its own tangent-space Z to
   nearly zero, so the shading normal pointed sideways and the surface
   stopped responding to the sun at all.

Fault 5 in particular looked exactly like a shadow bug, and shadows were
ruled out three separate times before the material itself was swapped for a
stock one and came out seven times brighter on the same geometry under the
same lights.

The lesson is the same one the answer-position bias taught: **screenshots
show that something is wrong and almost never show what.** The turning point
each time was a number, from `probe()` on the built geometry and from a
luminance and saturation script over a fixed crop. Both are kept.

### 2.1 Why D35 is the decision that shapes everything

The stated goal is to be able to lift the game out and ship it later without the learning layer. That rules out the single-file canvas approach used by the IBCS trainer, and it rules out sprinkling question logic through the game loop.

Concretely, the engine must compile and play with a `NullChallengeProvider` that auto-resolves every challenge as a neutral modifier. Per D51 the ESLint boundary rule ships now; the full standalone-campaign test is post-contest.

### 2.2 The critique, and what was accepted

The plan was stress-tested on 21 August. Its verdict was that this is "a multi-month game plan with a 10-day checkpoint stapled onto it", and it recommended shrinking the 31 August target to a Contest Slice.

**That recommendation was considered and declined (D54).** The ambitious plan stands. What was accepted instead:

| Finding | Response |
|---|---|
| The schedule is not achievable as written | Accepted as a risk, not a plan change. Mitigated by 15.1, which now carries dated trigger conditions rather than a list nobody looks at |
| The cut list is too shallow to save the date | **Accepted and fixed.** 15.1 rebuilt to cut load-bearing complexity, not ornament |
| The unrest loop is emotionally hostile | **Accepted.** Redesigned in 5.10 |
| Tight timers punish real-world interruption | **Accepted in part.** Timed stays default, pause added (D50) |
| D35 enforcement is ceremony under a deadline | **Accepted in part.** Lint rule now, campaign test later (D51) |
| 20% review will actively mis-teach people | Declined (D44). Risk documented in 15.2 |
| Provenance should be mandatory | **Accepted** (D48) |
| Cut Rayfin, ship static only | **Declined.** The contest text explicitly rewards trying Fabric Apps and Rayfin and asks for preview feedback. Cutting it cuts the thing these judges are running the contest to see. Static-first build, Rayfin as the primary link (D37, D38) |

### 2.3 The six delegated decisions

Decided on the author's instruction, with reasoning so they can be reversed knowingly.

- **D48 provenance: yes, mandatory and test-enforced.** This flips precisely *because* D44 keeps 250 questions at 20% review. Provenance is the only mechanism that makes the unreviewed remainder auditable and repairable. Without review and without provenance, a disputed answer has no way to be settled, and there is no way to re-audit the bank when Fabric behaviour or the study guide changes. It costs nothing at draft time, when the source is already open, and is expensive to reconstruct later.
- **D49 unrest: opportunity, never punishment.** Keeps the differentiating mechanic, removes the quit trigger. See 5.10.
- **D50 timers: timed by default, pausable.** The author chose exam pressure twice, so it stays. The real defect found was not the timer but that a real-world interruption silently costs a unit. Pause fixes that without softening the mode.
- **D51 boundary enforcement: lint rule now, campaign test later.** The ESLint rule is a config entry and prevents the leak. The full standalone-campaign test is real effort for a promise that pays out after the contest.
- **Never-cut list: guided first mission, explanation plus Learn link, the 41 real skill names, the share image.** The readiness gauge drops off the list because it degrades gracefully to a plain progress meter. The other four do not degrade, they simply vanish.
- **D52 Great Library: reachable from the menu.** Cheap, and it means someone who will not play a 4X still gets a usable DP-600 revision list.

---

## 3. Architecture

### 3.1 Layer boundary

```
┌─────────────────────────────────────────────────────────┐
│  app/            Rayfin host: auth, data sync, routing   │
├─────────────────────────────────────────────────────────┤
│  learn/          DP-600 content, SM-2, exam readiness    │
│                  implements ChallengeProvider            │
├─────────────────────────────────────────────────────────┤
│  engine/         Hex 4X: map, units, combat, tech, AI    │
│                  ZERO imports from learn/ or app/        │
└─────────────────────────────────────────────────────────┘
```

The single interface between engine and learning:

```ts
// engine/src/challenge/ChallengeProvider.ts
export interface ChallengeRequest {
  kind: 'battle' | 'research' | 'unrest' | 'boss';
  /** Opaque topic id. The engine never interprets this. */
  topicId: string;
  /** 1..3, set by difficulty and enemy tier. */
  tier: 1 | 2 | 3;
  timeLimitMs: number;
}

export interface ChallengeOutcome {
  /** -1..+1. The engine scales this into a combat or research modifier. */
  score: number;
  elapsedMs: number;
  abandoned: boolean;
}

export interface ChallengeProvider {
  /** Topics the provider can serve. The engine uses these as tech node ids. */
  topics(): TopicGraph;
  present(req: ChallengeRequest): Promise<ChallengeOutcome>;
  /** Topics that are 'due' for review. Drives the unrest system. Empty is valid. */
  dueTopics(now: number): string[];
}
```

Three implementations:

1. `Dp600ChallengeProvider` (the product)
2. `NullChallengeProvider` (returns `score: 0` instantly, gives the standalone game)
3. `ScriptedChallengeProvider` (deterministic, for tests and the tutorial)

**Rule: `engine/` has no dependency on `learn/`.** Enforced by an ESLint `no-restricted-imports` rule and a test that walks the import graph.

### 3.2 Repo layout

```
fabric-empires/
├── PLAN.md                      # this file
├── README.md                    # English, disclaimer, screenshots, getting started
├── LICENSE                      # MIT
├── PREVIEW-FEEDBACK.md          # Rayfin/Fabric Apps rough edges hit during the build
├── NOTICE.md                    # AI art provenance, audio provenance, third-party
├── package.json                 # workspaces: engine, learn, app
├── engine/
│   ├── src/
│   │   ├── hex/                 # coordinates, neighbours, distance, ring, spiral, layout
│   │   ├── map/                 # generator, terrain, features, rivers, resources
│   │   ├── rng/                 # seeded PRNG (mulberry32), one stream per subsystem
│   │   ├── entities/            # City, Unit, Improvement, Faction
│   │   ├── rules/               # combat, movement, yields, production, upkeep
│   │   ├── tech/                # TopicGraph -> tech tree, research state
│   │   ├── ai/                  # enemy faction AI (utility scoring)
│   │   ├── turn/                # turn pipeline, phases, event bus
│   │   ├── save/                # serialise, deserialise, versioned migrations
│   │   └── challenge/           # ChallengeProvider interface + Null + Scripted
│   └── test/                    # vitest, pure, no DOM
├── learn/
│   ├── content/
│   │   └── dp-600/
│   │       ├── outline.json     # the skills-measured tree, verbatim skill names
│   │       ├── questions/*.json # authored bank, one file per cluster
│   │       └── diagrams/*.ts    # code-drawn hotspot diagrams
│   ├── src/
│   │   ├── Dp600ChallengeProvider.ts
│   │   ├── sm2.ts               # SuperMemo-2
│   │   ├── readiness.ts         # weighted exam readiness
│   │   ├── crypto.ts            # answer hashing + explanation decryption
│   │   └── ui/                  # question modal components
│   └── test/
├── app/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── pages/               # Menu, Game, GreatLibrary, Leaderboard, Profile
│   │   ├── render/              # canvas renderer, camera, picking, sprite atlas
│   │   ├── services/            # Rayfin auth + data client
│   │   └── sync/                # local save <-> cloud save reconciliation
│   ├── public/assets/
│   │   ├── art/                 # generated PNG/WEBP, committed
│   │   └── audio/
│   └── index.html
├── rayfin/
│   ├── rayfin.yml
│   └── data/                    # CampaignSave, SkillMastery, GameStats, LeaderboardEntry
└── tools/
    ├── art/                     # manifest.json, generate.py, postprocess.py
    ├── content/                 # bank validator, answer encryptor, outline sync check
    └── verify_publishable.py
```

### 3.3 Rendering

Canvas 2D with a sprite atlas, not DOM and not WebGL.

- Hex layout: pointy-top, axial coordinates `(q, r)`, `size = 48 px` at zoom 1.
- Camera: pan (drag, WASD, edge scroll), zoom 0.5x to 2.0x in 6 steps.
- Draw order: terrain, rivers, improvements, borders, cities, units, overlays, fog, UI.
- Dirty-rect redraw for the terrain layer, full redraw for units and overlays.
- Picking: pixel to axial conversion, no hit testing loop.
- Target: 60 fps at 2000 visible hexes on a Surface Laptop. Budget checked with a perf test.

### 3.4 Tech choices

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript strict | Engine is the long-lived asset |
| Build | Vite 7 | Matches the Rayfin toolchain |
| UI | React 19 for chrome, canvas for the map | The map must not go through React |
| State | Plain reducer over an immutable `GameState`, no external state library | Save/load and replay come free |
| Tests | Vitest | Matches ibcs-trainer-rayfin |
| Auth/data | `@microsoft/rayfin-*` ^1.33 | Same as the IBCS trainer |
| Crypto | WebCrypto (SHA-256, PBKDF2, AES-GCM) | No dependency |

---

## 4. The DP-600 outline as a tech tree

Source: study guide for DP-600, skills measured **as of 21 July 2026**. Fetched 21 August 2026. `learn/content/dp-600/outline.json` holds the verbatim skill names; a test fails if a question references a skill id that is not in it.

| Branch | Exam weight | Cluster | Leaf nodes |
|---|---|---|---|
| **A. Maintain a data analytics solution** | 25-30% | A1 Implement security and governance | 5 |
| | | A2 Maintain the analytics development lifecycle | 6 |
| **B. Prepare data** | 45-50% | B1 Get data | 5 |
| | | B2 Transform data | 9 |
| | | B3 Query and analyze data | 4 |
| **C. Implement and manage semantic models** | 25-30% | C1 Design and build semantic models | 7 |
| | | C2 Optimize enterprise-scale semantic models | 5 |
| | | | **41 total** |

Full node list:

**A1 Implement security and governance**
1. Workspace-level access controls
2. Item-level access controls
3. Row-level, column-level, object-level and file-level access control
4. Apply sensitivity labels to items
5. Endorse items

**A2 Maintain the analytics development lifecycle**
6. Configure version control for a workspace
7. Create and manage a Power BI Desktop project (.pbip)
8. Create and configure deployment pipelines
9. Impact analysis of downstream dependencies
10. Deploy and manage semantic models via the XMLA endpoint
11. Reusable assets (.pbit, .pbids, shared semantic models)

**B1 Get data**
12. Create a data connection
13. Discover data with OneLake catalog and Real-Time hub
14. Ingest or access data as needed
15. Choose between different data stores
16. OneLake integration for Eventhouse and semantic models

**B2 Transform data**
17. Views, functions and stored procedures
18. Enrich data by adding new columns or tables
19. Implement a star schema for a lakehouse or warehouse
20. Denormalize data
21. Aggregate data
22. Merge or join data
23. Resolve duplicate data, missing data and null values
24. Convert column data types
25. Filter data

**B3 Query and analyze data**
26. Visual Query Editor
27. SQL
28. KQL
29. DAX

**C1 Design and build semantic models**
30. Choose a storage mode
31. Star schema for a semantic model
32. Relationships, bridge tables, many-to-many
33. DAX variables and functions (iterators, table filtering, windowing, information functions)
34. Calculation groups, dynamic format strings, field parameters
35. Large semantic model storage format
36. Composite models

**C2 Optimize enterprise-scale semantic models**
37. Performance improvements in queries and report visuals
38. Improve DAX performance
39. Direct Lake, including default fallback and refresh behavior
40. Direct Lake on OneLake versus Direct Lake on SQL analytics endpoint
41. Incremental refresh

### 4.1 Tech tree mechanics

- Each node costs **Compute** and requires its cluster predecessor.
- Researching a node fires a `research` challenge (30 s). Correct completes it. Wrong costs the Compute and the node stays locked until the next turn, so failure is a delay, not a wall.
- A node unlocks one of: a unit, a building, an improvement, a policy, or a monument.
- Branch B is the biggest tree and sits on the largest landmass, so the map physically reflects that "Prepare data" is half the exam. This is the single best teaching moment in the design and must survive any scope cut.
- Tree completion is the **Science victory**.

---

## 5. Game design

### 5.1 Resources

| Resource | Classic analogue | Produced by | Spent on |
|---|---|---|---|
| **Data** | Food | Raw File Plains, Streaming Rivers, lakehouse tiles | City growth, unit population cost |
| **Compute** | Wood | Delta Highlands, forests of Spark clusters | Research, production, buildings |
| **Capacity Units** | Gold | CU Geothermal Vents, trade routes | Unit upkeep, rush-buy, diplomacy |
| **Trust** | Stone | Parquet Quarries, Semantic Peaks | Walls, governance buildings, endorsement monuments, unrest suppression |

Trust deserves note: it is the resource that pays for the unrest mechanic, which makes governance economically real rather than decorative.

### 5.2 Terrain

| Terrain | Yield | Movement | Notes |
|---|---|---|---|
| Raw File Plains | Data 2 | 1 | Default open terrain |
| Delta Highlands | Compute 2, Trust 1 | 2 | Defensive bonus +25% |
| Parquet Quarry | Trust 3 | 2 | Rare |
| Streaming River | Data 1, Compute 1 | 1 along, 3 across | Fast movement along, chokepoint across |
| Legacy Swamp | Data 1 | 3 | Yield penalty, no city founding |
| Semantic Peaks | Trust 2 | impassable | Blocks movement, high visibility if adjacent |
| CU Geothermal Vent | CU 3 | 1 | Strategic resource, contested |
| OneLake (water) | Data 1 | naval only | The sea. Shortcuts cross it |
| Ungoverned Wastes | none | 2 | Enemy spawn, spreads if unchecked |

Seasonal variants (3 per terrain) exist purely as art, driven by a per-map palette roll.

### 5.3 Cities and buildings

Cities are Fabric items. The capital is a **Workspace**.

| City type | Founded on | Speciality |
|---|---|---|
| Lakehouse | Any land adjacent to OneLake | Data heavy, cheap, flexible |
| Warehouse | Plains or Highlands | Compute and Trust, strong walls |
| Eventhouse | Adjacent to a Streaming River | Fast production, weak defence |
| Semantic Model | Highlands or Peaks adjacent | Low yield, huge score and readiness output |

Buildings are unlocked by tech nodes, for example node 19 (star schema for a lakehouse or warehouse) unlocks the **Star Forge**, which raises Compute yield and grants +10% combat strength to units trained in that city. The flavour always encodes the real benefit of the real practice.

### 5.4 Units

| Unit | Role | Strength | Unlocked by |
|---|---|---|---|
| Architect | Founds cities | 0 | start |
| Engineer | Builds improvements | 0 | start |
| Profiler | Scout, reveals fog | 8 | start |
| Pipeline Runner | Melee | 20 | node 14 |
| Query Slinger | Ranged (2 tiles) | 18 | node 27 |
| Notebook Cannon | Siege, +100% vs cities | 25 | node 17 |
| RLS Sentinel | Defensive, +50% fortified | 22 | node 3 |
| Shortcut Skiff | Naval transport | 12 | node 16 |
| Lineage Hawk | Recon, ignores zone of control | 14 | node 9 |
| Refresh Guard | Heals adjacent units | 16 | node 41 |
| Semantic Colossus | Late-game heavy | 45 | node 36 |
| Direct Lake Titan | Ultimate unit | 60 | node 39 |

Each of the 8 factions gets one unique unit variant, art-differentiated, with one stat tweak.

### 5.5 Combat maths

```
effectiveStrength =
    baseStrength
  * (0.5 + 0.5 * hp / maxHp)          // wounded units hit softer
  * (1 + terrainBonus)                 // 0, 0.25, 0.5
  * (1 + fortifyBonus)                 // 0, 0.2, 0.4
  * (1 + techBonus)                    // sum of researched combat techs
  + challengeModifier                  // THE QUESTION
```

`challengeModifier` from `ChallengeOutcome.score` in `-1..+1`:

| Result | score | modifier |
|---|---|---|
| Correct, under half the timer | +1.0 | +18 |
| Correct | +0.6 | +12 |
| No answer / timeout | -0.6 | -12 |
| Wrong | -1.0 | -18 |

With base strengths of 8 to 60, a swing of 36 points between best and worst is decisive at low tier and merely important at high tier. That is the intended feel: **early on, knowledge is everything; later, a well-built empire forgives one wrong answer.**

Damage, using a standard power-curve ratio model:

```
ratio  = attackerEff / defenderEff
damage = clamp(30 * pow(ratio, 1.5) * randomBetween(0.9, 1.1), 10, 100)
```

Both sides take damage in melee; the ranged attacker takes none. A unit at 0 HP dies. **Losing a battle costs the unit, not the tile.** Territory changes hands only when a city's HP reaches 0 and a melee unit enters it (D09).

### 5.6 Turn pipeline

```
1. UPKEEP        yields collected, CU upkeep paid, starvation checked
2. UNREST        SM-2 due check, unrest ticks up, revolts resolved
3. RESEARCH      player allocates Compute, research challenge fires if a node completes
4. PRODUCTION    cities produce, buildings complete
5. ORDERS        player moves units, initiates combat (battle challenge per attack)
6. ENEMY         8 faction AIs act in initiative order
7. EVENTS        monument progress, victory checks, autosave
```

Autosave at the end of every turn to localStorage, and to `CampaignSave` when signed in.

### 5.7 The eight factions

Seven antagonists, one per skill cluster, plus the final boss. Each attacks with questions drawn from its own cluster, so **who is attacking you tells you what you are about to be tested on**. That is the diegetic study planner.

| Faction | Leader | Cluster | Theme |
|---|---|---|---|
| The Open Gate | Warden Nullpermission | A1 Security and governance | Sprawl with no access control |
| The Untracked | The Overwriter | A2 Development lifecycle | No version control, no pipelines |
| The Silo Horde | Chieftain Copy-Paste | B1 Get data | Data duplicated everywhere, connected nowhere |
| The Denormalizers | Grand Duplicator | B2 Transform data | One big table, forever |
| The Scan Wraiths | Cartesian the Endless | B3 Query and analyze | Full scans and cross joins |
| The Flat Table Cult | Prophet One-Big-Table | C1 Design and build models | Rejects the star schema |
| The Import Zealots | The Refresh Baron | C2 Optimize models | Refuses Direct Lake, refreshes forever |
| **The Proctor** | (the exam itself) | all | Final boss, appears at the Exam victory trigger |

No competitor products, no real vendors, no real people. The antagonists are misconceptions.

### 5.8 Victory conditions

| Victory | Trigger |
|---|---|
| **Domination** | All 7 antagonist capitals captured |
| **Science** | All 41 tech nodes researched |
| **The Exam** | Reach 80% exam readiness to summon The Proctor, then survive a timed siege of 40-45 questions in ~100 minutes of game time, matching the real exam shape. Winning mints a shareable trophy card |

Defeat: capital captured, or empire-wide unrest sustained at 100 for 5 consecutive turns.

### 5.9 Difficulty

| Level | Enemy strength | Timers | Question tier | Unrest rate |
|---|---|---|---|---|
| Apprentice | 0.75x | 1.5x | mostly tier 1 | 0.5x |
| Analyst | 1.0x | 1.0x | mixed 1-2 | 1.0x |
| Architect | 1.35x | 0.8x | mixed 2-3 | 1.5x |

Tier scaling only. Enemies do not deliberately hunt your weak domains (D15).

**Timer rules (D50).** Timed is the default, because exam pressure is the point. But:
- The **tutorial is untimed**, always.
- **Relaxed** is offered as an equal choice on the campaign setup screen, next to difficulty. Not buried in an accessibility menu.
- **Any challenge modal can be paused without penalty**, outside Exam mode. A Teams ping must never cost a unit. This is the actual defect the timer design had, and it is separate from whether timers exist.
- Speed is scored as a **bonus** (the +18 fast-correct modifier), never as an extra penalty beyond the existing timeout result.

### 5.10 Unrest: spaced repetition as the economy

This is the mechanic that makes the game a genuine study tool rather than a quiz with a map.

- Every city is **bound to 1-3 leaf skills**, namely the tech nodes whose buildings it contains.
- Every leaf skill carries an **SM-2 record** (see 6.4).
- When a skill's SM-2 due date passes, every city bound to it opens a **Council review**: an available action, flagged on the city, that costs one turn.
- Answering it correctly **grants** Trust and a yield bonus for several turns, and pushes the SM-2 interval out. Answering it wrongly costs the turn and reschedules it. Ignoring it forfeits the bonus.
- A city that has ignored several reviews in the **current run** accumulates unrest, which dampens yields. Unrest is capped, and a city can never defect purely from review debt.
- **Nothing bad happens while the player is away** (D49). Returning after two weeks presents a stack of available reviews and a pile of unclaimed Trust, not a burning empire.

⚠️ The original design had overdue skills riot cities into defecting. That teaches "you neglected your homework, now suffer", which is a reason to stop playing rather than a reason to review. The mechanic is worth more as a carrot: the cheapest way to run a strong economy is to keep reviewing, and the player is chasing a bonus rather than fleeing a penalty. Same retrieval practice, opposite emotion.

Real time versus game time: SM-2 intervals run on **wall-clock time between sessions**, not turns. Within a single session, intervals are compressed so the mechanic is still visible in a 60 minute play.

**Built and verified, 22 August.** The numbers landed as: 3 topics per city, 4 Trust and a 25 percent yield bonus for 5 turns on a pass, two ignores tolerated before unrest starts, unrest capped at 3 for a worst case of a 36 percent dampening, and 75 seconds standing in for a day inside a session. Two design claims turned out to need code rather than good intentions:

- **A never-reviewed topic is due by definition**, so on turn one the entire unresearched tech tree qualified. The tracker therefore only ever returns topics it has actually seen, and binding happens on research completion, so a topic cannot become due before the player has met it.
- **A failed council must not lock the player out.** Writing the test surfaced that the first implementation could leave a city with a review it could not clear, which contradicts D49 outright. A failed review now costs the turn and nothing else, and still resets the ignore counter: showing up is the behaviour being reinforced, not being right.

Proved end to end in the browser rather than only in unit tests: research answered correctly binds the topic to the capital, the council is offered only once the interval lapses, answering it pays exactly 4 Trust, the city refuses a second council in the same turn, the mastery band moves from learning to familiar, and four ignored turns produce "Workspace is restless without its council." rather than anything worse.

⚠️ **Known tension:** SM-2 wants short frequent sessions, the 45-60 minute session target (D07) wants long absorbed ones. These two motivational loops pull against each other and the design does not fully resolve it. The mitigation is that reviews are opportunities, so a long session is never blocked by them and a short session can consist of nothing but claiming reviews. Watch this in playtests; if sessions bifurcate cleanly into "long campaign" and "quick review sweep", the tension has resolved itself in a good way.

---

## 6. Learning layer

### 6.1 Question schema

```ts
interface Question {
  id: string;                    // 'dp600-b2-019-003'
  cert: 'DP-600';
  branch: 'A' | 'B' | 'C';
  cluster: string;               // 'B2'
  skillId: number;               // 1..41, must exist in outline.json
  type: 'mcq' | 'multi' | 'hotspot';
  tier: 1 | 2 | 3;
  stem: string;
  options?: string[];            // mcq, multi
  diagram?: string;              // hotspot: id of a code-drawn diagram
  regions?: string[];            // hotspot: named click regions
  selectCount?: number;          // multi: 'choose 2'
  answerHash: string;            // sha256(salt + id + normalisedAnswer)
  explanationCipher: string;     // AES-GCM, key derived from the answer
  learnUrl: string;              // must be under learn.microsoft.com
  sourceSkillBullet: string;     // D48: verbatim study-guide bullet it was written from
  sourceLearnUrl: string;        // D48: the doc page the fact came from
  reviewStatus: 'draft' | 'reviewed';   // D44: set by the review UI
  tags: string[];
}
```

⚠️ `sourceSkillBullet` and `sourceLearnUrl` are **mandatory and test-enforced** (D48). A question without them fails the content test and does not build. This is the audit trail that makes the 80% of the bank which is not individually reviewed (D44) repairable rather than merely disclaimed.

### 6.2 Bank size and weighting

Target **250+ items for DP-600**, distributed to the published weights:

| Branch | Weight | Items | Per leaf node |
|---|---|---|---|
| A (11 nodes) | 27.5% | ~69 | ~6 |
| B (18 nodes) | 47.5% | ~119 | ~6.6 |
| C (12 nodes) | 27.5% | ~69 | ~5.7 |
| | | **~257** | |

Tier split per node: 3 x tier 1, 2 x tier 2, 1 x tier 3, roughly.

**All items are original**, authored from the public skills-measured outline and the linked documentation. No recalled, reproduced or paraphrased exam content. This is both a legal requirement and the reason the disclaimer exists.

Authoring workflow:
1. I draft a cluster's items into `learn/content/dp-600/questions/<cluster>.draft.json`.
2. You review in a purpose-built review page (`npm run review`) that shows stem, options, answer, explanation and Learn link, with accept / edit / reject.
3. Accepted items go through `tools/content/encrypt.py` into the shipped `<cluster>.json`.

### 6.3 Question types

**MCQ** and **multi-select** are conventional. **Hotspot** is the differentiator and is code-drawn (D23):

| Diagram | Regions | Used by |
|---|---|---|
| Star schema | fact table, dimension tables, bridge, wrong-direction relationship | nodes 19, 31, 32 |
| Medallion architecture | bronze, silver, gold, the wrong hop | nodes 15, 19 |
| Deployment pipeline | dev, test, prod, deployment rule, the misconfigured stage | node 8 |
| Direct Lake decision | OneLake path, SQL endpoint path, fallback branch | nodes 39, 40 |
| Workspace security | workspace role, item permission, RLS, the over-broad grant | nodes 1, 2, 3 |
| Composite model | DirectQuery source, Import source, the weak relationship | node 36 |

Each diagram is a TypeScript module exporting a draw function plus named polygon regions, so the same file provides both the picture and the hit test. No image drift, crisp at every zoom, and the answer key is a region name rather than a pixel.

### 6.4 SM-2 and why (D14)

You delegated this one. SM-2 over Leitner because the unrest mechanic needs to answer two questions per turn, per skill: *is this due?* and *how long until it is due again?* Leitner gives you a box number, which is a coarse answer to the first question and no answer at all to the second without inventing an interval table anyway. SM-2 gives both natively, per skill, and adapts to how hard you personally find each of the 41 skills.

```ts
interface SkillMastery {
  skillId: number;
  repetitions: number;   // consecutive correct
  easeFactor: number;    // 1.3 .. 2.5, starts 2.5
  intervalDays: number;
  dueAt: number;         // epoch ms
  lastQuality: 0 | 1 | 2 | 3 | 4 | 5;
  totalSeen: number;
  totalCorrect: number;
}
```

Quality mapping from a `ChallengeOutcome`: correct and fast = 5, correct = 4, correct after hesitation = 3, timeout = 2, wrong = 1, abandoned = 0. Quality below 3 resets `repetitions` to 0, exactly as SM-2 prescribes.

### 6.5 Exam readiness

```
nodeMastery   = clamp(totalCorrect / max(totalSeen, 3), 0, 1) * recencyDecay(dueAt)
clusterScore  = mean(nodeMastery for nodes in cluster)
branchScore   = mean(clusterScore for clusters in branch)
readiness     = 0.275 * A + 0.475 * B + 0.275 * C     // published midpoints, normalised
```

Displayed as a percentage with three domain bars labelled with the real percentages, plus the honest caveat that this is a self-assessment against a study game and not a prediction of a real exam score.

### 6.6 Answer obfuscation (D20)

Two layers, and I want to be honest in the README about what they do and do not achieve.

1. **Answer hashing.** `answerHash = SHA-256(SALT + questionId + normalisedAnswer)`. Verified in the browser. Stops a casual "view source, read the JSON" scrape of the whole bank.
2. **Explanation encryption.** The explanation is AES-GCM encrypted with a key from `PBKDF2(normalisedAnswer + questionId + SALT, 100k iterations)`. It only decrypts once you have answered correctly, so the explanations cannot be mined for answers either.

**Limitation, stated plainly in the README:** for a 4-option MCQ an attacker can brute force all 4 candidate answers locally. This is obfuscation, not security, and it is the correct amount of effort for a study game. It is also unavoidable, because the Fabric App shell is anonymous and everything in `public/` is served to anyone (see `PREVIEW-FEEDBACK.md`).

---

## 7. Art pipeline

### 7.1 Azure OpenAI setup (D22, resource does not exist yet)

```
1. az login, select the MCAP subscription
2. az cognitiveservices account create \
     --name <name> --resource-group <rg> --kind OpenAI --sku S0 --location <region>
3. Deploy gpt-image-1
4. Store endpoint + key in .env.local. NEVER commit. No default in any script
```

Rationale over Bing Image Creator: output licensing. Designer and Bing Image Creator grant personal, non-commercial use, which does not fit an MIT-licensed public repo. Azure OpenAI output rights sit with the subscription owner.

Cost estimate: ~250 images at roughly $0.02 to $0.19 each depending on size and quality, so a ballpark of **$20 to $45** including rejects and re-rolls. Budget two full re-roll passes.

### 7.2 Manifest-driven generation

`tools/art/manifest.json` holds one entry per asset:

```json
{
  "id": "terrain/delta-highlands-summer",
  "category": "terrain",
  "size": "1024x1024",
  "prompt": "isometric hex tile of rocky layered highlands, stacked slate strata suggesting stratified data files, sparse pines, warm afternoon light",
  "seedNote": "match palette of terrain/raw-file-plains-summer"
}
```

A shared **style suffix** is appended to every prompt so 250 assets look like one game:

> painterly hand-illustrated strategy game art, warm saturated palette, soft rim light from upper left, clean silhouette, transparent background, no text, no letters, no logos, no user interface

`tools/art/generate.py` reads the manifest, skips assets already present (so it is resumable), writes to `public/assets/art/`, and logs prompt plus model plus timestamp to `tools/art/generation-log.jsonl` for provenance in `NOTICE.md`.

`tools/art/postprocess.py`: trim transparent margins, snap to the hex mask for terrain, resize to target, encode WEBP quality 85, and build a sprite atlas plus JSON index. Total art payload budget: **under 12 MB**.

### 7.3 Asset budget (~250)

| Category | Count |
|---|---|
| Terrain, 10 types x 3 seasonal variants | 30 |
| Terrain features and resources | 12 |
| Buildings | 30 |
| Monuments | 8 |
| Base unit sprites, 12 types | 12 |
| Unit faction variants, 8 factions x 3 signature units | 24 |
| Unit tier upgrades | 24 |
| Faction leader portraits | 8 |
| Tech node icons, one per leaf skill | 41 |
| UI frames, panels, buttons, resource icons | 40 |
| Splash, menu background, loading, trophy card | 8 |
| Rejects and spares | ~13 |
| **Total** | **~250** |

⚠️ **Do not generate the 41 tech icons before the style is locked.** Generate 6 terrain tiles first, look at them together, iterate the style suffix, and only then batch.

### 7.4 Style guide

Painterly gouache illustration, warm saturated palette, soft rim light, stylised realism, clean silhouette (D21). No game product is named anywhere in the prompts, which are committed publicly (see 12.1). Hexes are pointy-top, drawn at a fixed 30 degree isometric tilt so tile art can be swapped without touching layout code. Units read as silhouettes at zoom 0.5. Faction colour is applied as a code-side tint on a greyscale banner region, not baked into the sprite, so 8 factions do not multiply the asset count.

---

## 8. Audio

- **Soundtrack:** three AI generated ambient tracks (exploration, tension, battle) plus one main theme, produced with the existing song-creation workflow. Loopable, 2-3 minutes each, cross-faded by game state. Target under 8 MB total as compressed audio.
- **SFX:** code generated WebAudio, no files. Unit move, attack, city founded, tech complete, correct answer, wrong answer, unrest warning, victory. A small synth helper in `app/src/audio/sfx.ts`.
- Master mute plus separate music and SFX sliders, persisted. Default music at 40%.

---

## 9. Persistence and Rayfin data model

### 9.1 Entities (D29)

```ts
CampaignSave      { userId, saveId, seed, difficulty, turn, stateBlob, updatedAt }
SkillMastery      { userId, cert, skillId, repetitions, easeFactor, intervalDays,
                    dueAt, totalSeen, totalCorrect, lastQuality, updatedAt }
GameStats         { userId, runId, seed, difficulty, turns, victoryType, score,
                    readinessAtEnd, questionsAnswered, accuracy, durationMs, endedAt }
LeaderboardEntry  { userId, displayName, cert, bestScore, bestReadiness,
                    runsCompleted, weekKey, updatedAt }
```

`stateBlob` is a versioned, compressed JSON serialisation of `GameState`. Migrations live in `engine/src/save/migrations/`, and there is a test per migration with a stored fixture from the previous version.

### 9.2 Anonymous to signed-in (D28)

1. Anonymous play writes to `localStorage` under `fabric-empires:v1:*`.
2. On sign-in, the app detects a local save and offers to import it.
3. Reconciliation rule: **most recent `updatedAt` wins per entity**, except `SkillMastery`, which merges by taking the higher `totalSeen` and the later `dueAt`, so review debt cannot be laundered by switching devices.
4. Signed-in play writes through to Rayfin on turn end, debounced to at most one write every 10 seconds.

### 9.3 Leaderboards (D30)

Two boards side by side:
- **Campaign score:** rewards playing well.
- **Exam readiness:** rewards learning well.

Each with an all-time and a weekly view (`weekKey` = ISO year-week). Display name comes from the Entra profile. Anti-cheat is out of scope and is stated as such in the README, because a client-side game cannot honestly claim otherwise.

---

## 10. UX and onboarding

### 10.1 Screens

| Screen | Content |
|---|---|
| Menu | New campaign (seed, difficulty, cert), Continue, Great Library, Leaderboard, Profile, About |
| Game | Hex map, top resource bar, right panel (city or unit context), bottom tech bar, minimap, turn button |
| Challenge modal | Stem, options or diagram, timer ring, submit. Post-answer: verdict, explanation, Learn link |
| Great Library | The 41 skills as a browsable reference with mastery state and Learn links. Reachable from the main menu, so it is usable as a pure study tool with no game at all (D52) |
| Profile | Exam readiness gauge, three domain bars, SM-2 review schedule, run history |
| Leaderboard | Two boards, all-time and weekly |

### 10.2 The magic moment (D53)

⚠️ Judges will give this two to three minutes. Everything below is subordinate to what happens in the first 120 seconds.

The hook is a **scripted first-battle set piece**: the player arrives already holding a small territory, an enemy column is visibly advancing, and the first interaction is a battle that opens a question. The question modifier is shown explicitly on the combat prediction bar, so the causal chain (I know this, therefore I win this) is visible in a single screen rather than explained. Winning flips a tile, lights a tech node, and moves the readiness bar.

This is why the first-battle questions must come from the reviewed subset, and why the tutorial is untimed. The set piece has to land even for someone who has never played a 4X.

### 10.3 Tutorial (D26)

Five guided turns, teaching the game and the Fabric concepts in the same breath:

1. **Found your Workspace.** "Every empire starts with a workspace." Teaches city founding.
2. **Send an Engineer to the Raw File Plains.** Teaches improvements and the Data resource.
3. **Research node 12, Create a data connection.** First research challenge, tier 1, timer relaxed for the tutorial. Teaches the tech tree and the question loop.
4. **The Silo Horde raids.** First battle challenge. Deliberately winnable. Teaches combat and the question modifier.
5. **Unrest appears on your capital.** Teaches the review mechanic and why governance matters.

Then the rails come off. Skippable, and a "replay tutorial" entry stays in the menu.

⚠️ Contest judges will play for about three minutes. If turn 1 is confusing, nothing else in this document matters.

---

## 11. Testing

| Layer | What | Tool |
|---|---|---|
| Hex maths | Neighbours, distance, ring, line, pixel conversion round trip | vitest, property-based |
| Map generation | Same seed produces byte-identical map, golden fixture | vitest |
| Combat | Modifier table, damage curve, no negative HP, ranged takes no return damage | vitest |
| Turn pipeline | Phase order, yields, upkeep, starvation | vitest |
| SM-2 | Known SuperMemo-2 vectors reproduce exactly | vitest |
| Readiness | Weighted maths, edge cases at 0 and 1 | vitest |
| Content | Every `skillId` exists in `outline.json`; weight distribution within tolerance; every `learnUrl` is under `learn.microsoft.com`; no plaintext answers in shipped JSON | vitest |
| Boundary | `engine/` imports nothing from `learn/` or `app/` | import-graph test |
| **Standalone** | Full campaign playable to victory with `NullChallengeProvider` | vitest, headless |
| Save | Every migration has a fixture from the prior version | vitest |
| Render perf | 2000 hexes at 60 fps | perf test, non-blocking |
| E2E | Tutorial completes, a battle resolves, sign-in syncs | Playwright, lane A |
| Publishability | `tools/verify_publishable.py` | python |

**The clean clone rule applies:** `git clone && npm i && npm test && npm run build` must pass with no generated art, no `.env.local` and no Fabric access. Tests needing generated assets skip with a reason naming the command that produces them.

---

## 12. Publishing and compliance

- **English only**, everywhere: README, code comments, commit messages, test names, PR bodies, the game UI.
- **MIT licence.**
- **Disclaimer in the README** (D33): all questions are original, written from the publicly published skills-measured outline; the project is not affiliated with, endorsed by, or sponsored by Microsoft certification; it reproduces no exam content.
- **No tenant coordinates:** no workspace, item or capacity GUIDs, no `*.webapp.fabricapps.net` hosts, no UPNs, no `C:\Users\<name>` paths. Read from env with no default.
- `tools/verify_publishable.py` runs in CI with shape-matching regex classes, not a list of identifiers I happened to notice: fabric SQL endpoints, `*.pbidedicated.windows.net`, `*.openai.azure.com`, `*.vault.azure.net`, any bare GUID, plus an allowlist where every entry quotes the offending text.
  - ✅ **Built (D390).** It exists, it runs in `npm run verify`, and it self-tests its own rules before it scans because a first run that passes proves nothing (D391). It scans `git ls-files` rather than the working tree, since only the published artefact can carry risk. There is still no `.github/workflows`, so "runs in CI" remains aspirational; `npm run verify` is where the gate actually sits.
- ⚠️ `rayfin/.deployments.json` carries a `publishableKey`. **Gitignore it.**
- `NOTICE.md` records AI art provenance (model, date, that prompts are committed) and audio provenance.
- Grep the README and every PR body before publishing for German characters, customer names, and disclosure phrasing.

### 12.1 Intellectual property: the genre, the trademarks, and the art prompts

Not legal advice. This records the reasoning so it can be re-examined.

**Game mechanics are not copyrightable.** 17 U.S.C. 102(b) excludes procedures, processes, systems and methods of operation. *Baker v. Selden* (1879) is the root; *Allen v. Academic Games League of America* (9th Cir. 1994) applied it to games directly. Hex grids, tech trees, four resources, settlers and workers, fog of war, strength-versus-HP combat, era progression and victory conditions are genre vocabulary. *Freeciv* has been GPL since 1996 and *Unciv* is an open-source reimplementation of a commercial 4X's rules, both long-lived and unchallenged. Mathematical damage formulas are functional and not protectable.

**Visual expression is protectable, and that is where the real risk sits.** *Tetris Holding v. Xio Interactive* (D.N.J. 2012): copying the rules was permitted, copying the look was not.

⚠️ The original art style suffix named a specific commercial game. Those prompts are committed publicly, so 250 files would have documented an intent to reproduce another product's art direction, generated by a model that has certainly seen it. **Corrected (D21):** the style vocabulary is now self-contained and names no product.

**Rules that apply to this repo:**
- **The naming rule, scoped to where confusion actually lives (D382).** No third-party product name appears on the **marketing surface**: repo name, title, tagline, README, app chrome, store or submission text, art prompts, or commit subjects. That surface is what a reader forms an impression from, and it is the only one trademark law cares about. It is clean today, and the README names no other game at all.
  - **Design references stay, with attribution, in the design log.** Section 24 cites its reference by name and year precisely so the reasoning can be checked; D160 to D166 record which of its ideas were adopted and which refused. That is a bibliography, not passing off, and deleting it would destroy the argument to satisfy a rule stricter than the law requires. The earlier blanket ban was over-broad, and it produced the worst of both outcomes: unenforced for the life of the project, then briefly threatening 50 lines of genuine reasoning.
  - **Code and test comments follow the marketing rule, not the log rule**, because they travel without their context: a reader meets "full X behaviour" in a diff with no section 24 around it. `rank.ts` and `rank.test.ts` now point at 24.1 by number instead.
  - `tools/verify_publishable.py` should carry a trademark class as a **warning** (D47), aimed at the marketing surface only. ⚠️ Whoever writes it must not seed it from the class this section used to name: see D377 for how that reduces the check to a confirmation of what its author already suspected.
  - ⚠️ Watch the regex when it is written. `Civ ?[IVX0-9]` matches `Civi`, so it flags every use of `Civilian`, of which this codebase has around twenty, and `Anno` matches inside ordinary words. A class that cries wolf gets ignored, which is how a real hit hides.
- The public README describes the game as a "turn-based 4X strategy game". Genre comparisons stay out of the title, the tagline and the repo name.
- Distinctive coined terminology from other titles is avoided. Generic terms (monument, settler, tech tree) are fine. "Wonders" was renamed to "Monuments" for distance (D36), though it was probably generic enough to keep.
- No Microsoft logo, no Fabric logo, no certification badge. Referencing "Microsoft Fabric" and "DP-600" descriptively is nominative fair use; visual marks are not.
- Two disclaimers in the README header (D33): questions are original and the project reproduces no exam content; and this is a personal project, not a Microsoft product, not affiliated with or endorsed by Microsoft.
- The author has not taken DP-600 (D45), so the certification NDA is not engaged. Questions are nonetheless authored strictly from the public study guide and public documentation, and D48 provenance makes that checkable rather than merely asserted.

---

## 13. Deployment

- Capacity `prdsweden` (F8), a dedicated workspace named **Fabric Empires** (D31).
- ⚠️ Hosting a Fabric App converts a schedulable capacity into an effectively 24/7 one. A paused capacity serves the app HTTP 500 and `rayfin up` fails with `404 The requested endpoint does not exist` before it ever surfaces `CapacityNotActive`. Confirm `prdsweden` stays resumed for the contest window, and note the cost implication in `PREVIEW-FEEDBACK.md`.
- The hostname is platform-owned and can change. Preserve `rayfin/.deployments.json` locally (untracked) so the URL stays stable across deploys, because a changed host breaks sign-in with AADSTS50011.
- ⚠️ `rayfin up` never deletes. Once a URL is published it keeps serving. Plan the URL you want in the submission and do not churn it.

---

## 14. Schedule

Four weeks, 21 August to 21 September. **31 August is a hard submission checkpoint: whatever exists ships.**

### Week 0: Foundations (21-24 August)

| Day | Work |
|---|---|
| Thu 21 | Repo scaffold, workspaces, TS strict, ESLint with the boundary rule, vitest, CI. Hex maths plus tests. `outline.json` transcribed and verified against Learn |
| Fri 22 | Seeded map generator plus golden test. Terrain, rivers, resources. Canvas renderer, camera, picking. First screenshot of a real map |
| Sat 23 | `GameState`, turn pipeline, yields, cities, units, movement, zone of control. Save/load round trip |
| Sun 24 | Combat maths plus tests. `ChallengeProvider` interface, Null and Scripted providers. **Standalone game playable end to end with no questions at all.** Azure OpenAI resource created, style locked on 6 terrain tiles |

**Week 0 exit gate: a playable, question-free 4X.** If this slips, cut factions from 8 to 3 before cutting anything else.

### Week 1: Vertical slice and submission (25-31 August)

| Day | Work |
|---|---|
| Mon 25 | Tech tree from `outline.json`, 41 nodes, research flow, unlocks. Question schema plus loader plus crypto |
| Tue 26 | Question modal: MCQ, multi-select, timer ring, verdict, explanation, Learn link. Battle and research challenge wiring |
| Wed 27 | First 90 questions authored (clusters B1, B2, B3, the heaviest branch). Review page. Enemy AI v1, 3 factions active |
| Thu 28 | SM-2, unrest mechanic, readiness gauge, Great Library screen. Art batch 1: terrain, 8 buildings, 6 units |
| Fri 29 | Rayfin host, auth, 4 entities, local-to-cloud sync, leaderboards. Deploy to `prdsweden`, first live URL |
| Sat 30 | Tutorial, 5 scripted turns. Art batch 2. Audio. Balance pass. 150 questions total |
| Sun 31 | **Freeze at 18:00.** README with screenshots and disclaimer, `PREVIEW-FEEDBACK.md`, `NOTICE.md`, publishability audit, public repo push, demo video, Discord submission, LinkedIn post staged |

**Week 1 exit gate: a live URL, a public repo and a submitted entry.**

### Week 2: Depth (1-7 September)

Remaining 5 factions with distinct AI personalities. All 3 victory conditions including The Proctor siege. Hotspot question type plus the 6 code-drawn diagrams. Monuments. Naval and OneLake. Question bank to 250. Art batch 3, all 41 tech icons.

### Week 3: Polish and content (8-14 September)

Balance from real playtests. Animations and juice: unit movement tweening, combat shake, tech completion flourish, trophy card. Full accessibility pass: keyboard navigation, focus order, contrast, reduced motion, screen reader labels on the challenge modal. Performance to 60 fps at 2000 hexes. Tablet layout. Blog post for actionablereporting.com.

### Week 4: Second and third certs, gallery (15-21 September)

DP-700 outline transcribed, its own faction set, 200+ questions. PL-300 the same. Cert selector on the menu. `awesome-rayfin` template PR with `docs/previews/fabric-empires.webp` at 1280x800 under 200 KB.

---

## 15. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Scope. A hex 4X with unit movement is genuinely large | Nothing ships by 31 Aug | Week 0 exit gate is a playable game with zero content. Content is additive from there. Pre-agreed cut list in 15.1 |
| Question authoring is the real bottleneck, not code | Thin, repetitive bank | Author cluster by cluster in parallel with code. 90 by 27 Aug or trigger the cut list |
| Art style drift across 250 assets | Looks like a collage | Lock the style on 6 tiles first. Shared style suffix. Faction colour as a code tint, never baked |
| Rayfin preview instability | Deploy fails near the deadline | Deploy on 29 Aug, not 31 Aug. The game runs fine on `localhost` and as a static bundle, so a Fabric outage degrades to a local demo plus video |
| Capacity `prdsweden` paused | Live URL returns 500 during judging | Verify resumed daily during the contest window. Note it as preview feedback |
| Tight timers frustrate new players | Judges bounce | Tutorial timers are relaxed. Apprentice difficulty is 1.5x. A "relaxed timers" accessibility toggle is a strong candidate if playtests complain |
| Answer key readable | Trivial cheating | Accepted and documented. Hashing plus encrypted explanations stop casual scraping (6.6) |
| Legal or trademark concern about exam content | Take-down | 100% original items, README disclaimer, no exam content reproduced, no implied endorsement |

### 15.1 Cut list, with trigger conditions

⚠️ **A cut list only works if something forces you to look at it.** Each tier below has a dated trigger. When a trigger fires, the whole tier goes, that evening, without renegotiation. The ambitious plan (D54) is only survivable because this list cuts load-bearing complexity rather than ornament.

**Tier 0, cut now, before writing any code.** These are not on the 31 August path at all:
naval units and OneLake crossings, seasonal terrain variants, the weekly leaderboard, unique bespoke mechanics for all 41 tech nodes (keep the real names and grouping, share unlock archetypes).

**Tier 1, trigger: the Week 0 gate is not met by end of Sunday 24 August.**
1. Monuments
2. Factions from 8 down to 3, one per branch
3. Hotspot questions and the 6 diagrams, keep MCQ and multi-select
4. Soundtrack, keep the code-generated SFX

**Tier 2, trigger: no question is answerable in-game by end of Wednesday 27 August.**
5. Domination victory, keep Science and The Exam
6. Enemy AI personalities, script one pressure path instead
7. Art from ~250 assets down to a coherent ~40
8. Answer crypto, ship plain JSON with the limitation stated in the README

**Tier 3, trigger: no live URL by end of Friday 29 August.**
9. Rayfin auth, sync and leaderboards. Ship the static build as the submitted URL and write the reason up in `PREVIEW-FEEDBACK.md`, which is itself a legitimate contest deliverable
10. Wall-clock SM-2 unrest, keep review debt as a display-only indicator
11. The Exam victory, keep Science
12. Question bank down to whatever is reviewed, at minimum 40 items across all three branches

**Never cut**, in priority order:
1. A guided first mission (not necessarily 5 scripted turns)
2. Explanation plus Learn link on every question
3. The 41 real skill names in the tech tree
4. The shareable result image, because it is how the contest sees the project at all

The readiness gauge is **not** on this list: it degrades gracefully into a plain per-branch progress meter, so it survives in some form without needing protection.

### 15.2 The review-coverage risk, documented

D44 ships ~250 questions with ~20% plus all tier-3 items personally reviewed. The remainder are AI-drafted and unreviewed.

**The failure mode is not embarrassment, it is mis-teaching.** A learner does not mentally discount an individual answer while studying; if the tool says an answer is correct, it trains them. A wrong or ambiguous item in a certification study aid is worse than no item. The README disclaimer does not undo this, because it operates at the level of the project while the harm operates at the level of a single question.

Accepted knowingly. Partial mitigations in place:
- Mandatory provenance (D48) means any disputed item can be traced to its source and fixed quickly.
- Anonymous aggregate item analytics (D41) surface items with anomalous accuracy or timing for targeted review after launch.
- `reviewStatus` is stored per item, so a future build can badge or gate unreviewed content without re-authoring anything.
- Reviewed items are prioritised for the tutorial and the first-battle set piece, so the highest-traffic questions are the vetted ones.

⚠️ If review time runs short, cut bank **size**, not review coverage. Tier 3 item 12 exists for exactly this.

---

## 16. Deliverables checklist

- [x] Question bank covering all 41 skills of the outline: 123 items, minimum 3 per skill, every citation link-checked
- [x] Spaced repetition wired into the economy: bound topics, council reviews, unrest as a nudge (5.10)
- [x] The Great Library: weighted honest progress across all 41 skills, with documentation links per skill
- [x] Free flight over the empire, ported from the digital twins with its test suite intact
- [x] The empire survives being closed: autosave, resume, and a readable failure when a save is not
- [x] The production bundle verified by playing it, from a subpath, not by trusting an exit code
- [x] An opponent that actually plays: the Silo Horde advances, raids, and can end your empire
- [x] The diegetic study planner: raids test you on the attacking faction's cluster, and knowing it is your defence
- [x] Cities that build, gated by the tech tree, so research finally hands out an army
- [x] Games that end: domination, science and defeat, with a screen that says so
- [x] All seven antagonists on the map, one per cluster, so the whole outline can come for you
- [x] The Exam victory: readiness in the HUD, the Proctor at 80 percent, and a weighted 40-question siege
- [x] Cinematics at the four first-time beats: first blood, the first workspace, walls changing hands, the Proctor
- [x] "Who is coming": every antagonist, its cluster, its distance and your readiness for it
- [ ] Live URL on `prdsweden` (primary submitted link)
- [ ] Static GitHub Pages build as the guaranteed-alive fallback link (D37)
- [ ] Shareable result image working and pasteable into Discord (D40)
- [x] Public GitHub repo `fabric-empires`, MIT — *created private 22 August as `KornAlexander/fabric-empires`; flip to public in phase 7*
- [ ] README: English, disclaimer, screenshots, getting started, scripts table, honest limitations
- [ ] `PREVIEW-FEEDBACK.md`: Rayfin and Fabric Apps rough edges actually hit, with workarounds
- [ ] `NOTICE.md`: AI art and audio provenance
- [ ] Demo video, screen capture plus AI voiceover, roughly 90 seconds
- [ ] Discord submission text
- [ ] LinkedIn post staged in the composer, not published
- [ ] Blog post for actionablereporting.com
- [ ] `awesome-rayfin` template PR (post contest)

---

### 16.7 The controlled experiment

The thesis of this whole project is that knowing the material should be worth
something in the game rather than merely being asked about alongside it. That
is easy to claim and easy to fake, so it was measured.

Two runs of the **same seed**, same map, same antagonist decisions, same
combat rolls. In both the player does nothing at all: never moves a unit,
never founds a city, never builds, never researches. The only variable in the
entire run is whether the defence questions are answered correctly.

| | Answering correctly | Guessing |
|---|---|---|
| Ending | **Domination**, turn 25 | **Defeat**, turn 21 |
| Player units left | 1 | 0 |
| Silo Horde units left | 0 | 3 |

Nothing was tuned to produce this. The defence score raises the defender's
strength, so a player who knows the answer both takes less damage and deals
more back to the raider, and three raiders eventually break themselves on a
single well-informed Profiler. A player who guesses loses that same unit four
turns earlier.

⚠️ It also says something about balance that is worth keeping in view: a
passive but knowledgeable player currently *wins*. With one antagonist of
three units that is defensible, but it is the number to watch when the other
six factions arrive.

**They arrived, and it settled the question.** With all seven on the map the
passive run loses on every seed measured (turn 10 to 24), because the nearest
faction is only the first of seven. Playing properly changes it completely: a
run that founded its capital and kept building Profilers held for 40 turns
with seven units alive, and was tested by **three different factions on three
different clusters** along the way. Surviving longer is what earns the wider
revision, which is the difficulty ramp and the study plan being the same
thing.

---

## 17. Open items

- [ ] Azure OpenAI resource: region and resource group to use in the MCAP subscription
- [ ] Confirm `prdsweden` can stay resumed 21 Aug to 21 Sept, and what that costs
- [ ] Discord server joined and the entries channel located

---

## 18. Delivery plan, 22 August to 1 September

Ten days. The game is finished; everything below is delivery, plus the two
things the plan promised and had not built.

⚠️ **The art is the longest pole and it is now back at full scope (D130).** It
therefore starts first and runs in the background while everything else
proceeds, rather than being slotted in where it looks tidy. Nothing else here
is allowed to block on it.

| Phase | Dates | Work | Blocking on |
|---|---|---|---|
| 1 | 22 Aug | **Publish.** Private repo, push, branch normalised | Done |
| 2 | 22 to 25 Aug | **Art pipeline.** Azure OpenAI resource, prompt manifest, style lock, generation script, first coherent batch | Resource decision (17) |
| 3 | 23 to 24 Aug | **Sound.** Code-generated effects plus the ambient bed, verified through `OfflineAudioContext` | |
| 3b | 23 Aug | **Fog of war** (D149). Per-faction visibility and memory, revealed by unit and city sight | **Done 22 Aug**, save v6 |
| 3b+ | unplanned | **Two players, one screen** (section 30). A second seat answering `a b c d` from its own course, scores averaged | **Done 22 Aug** |
| 3c | 23 to 26 Aug | **Units at 1600** (D148). Pike, shot, horse and cannon, replacing the tracked hulls | **Done 22 Aug**, section 31 |
| 3d | unplanned | **The opening and the anthem** (section 32). A live title sequence over the seed's own world, and a 46 s trailer | **Done 22 Aug** |
| 4 | 24 to 28 Aug | **The siege** (19). Walls, siege state, the assault set piece, the four defender options | Fog of war, for what a besieger can see |
| 4b | 28 to 30 Aug | **Ships and islands** (23). Embark, cargo, AI crossings, coastal production, then flip `islands` on | |
| 4c | 28 to 29 Aug | **Depth from Anno** (24). Progressive pacing tied to readiness | Tiers done early, section 33 |
| 5 | 26 to 28 Aug | **Art integration.** Wire the generated set into the renderer and the interface | Phase 2 |
| 6 | 28 to 29 Aug | **Docs.** README, `NOTICE.md` (art and audio provenance), `PREVIEW-FEEDBACK.md` | Phases 2 and 3 |
| 7 | 29 Aug | **Share card** (D40), and the **loading screen** the enlarged map now requires (22.2) | |
| 8 | 29 to 30 Aug | **Deploy.** Flip the repo public, Pages fallback, then `prdsweden` as the primary link | Capacity confirmation |
| 9 | 30 to 31 Aug | **Demo video.** Screen capture, cloned voiceover, roughly 90 seconds | Everything visual |
| 10 | 31 Aug | **Drafts.** Discord entry, LinkedIn post staged, blog draft. None of them posted (D135) | |
| 11 | 1 Sep | **You submit** | |

⚠️ **This is now a very full ten days.** The full art programme and the full
siege are each a week's work on their own, and they overlap. Both carry dated
triggers (18.1 and 19.5) that cut scope rather than slip the date, because the
date is the one thing that cannot move.

### 18.1 The art fallback, with a date

The full set is ambitious for ten days, so it gets the same treatment as the
rest of the cut list: a trigger, not a hope.

- **If the Azure OpenAI resource is not usable by end of Sunday 24 August**,
  fall back to a personal ChatGPT or Copilot Pro subscription and check the
  output licence terms for whichever is used (D43).
- **If a coherent style is not locked by end of Wednesday 27 August**, cut to
  roughly 40 assets covering the units and the city kinds only, and leave
  everything else procedural (cut list Tier 2, item 7).
- **Terrain never becomes an asset.** Whatever happens to the art, the ground,
  the water and the ground cover stay generated at runtime. That is what keeps
  the repository free of binaries and the map free of tiling.

---

## 19. The siege

The largest thing that happens in a game should not resolve like a skirmish
with a bonus. Today attacking a city is one exchange with `SIEGE_CITY_BONUS`
applied; this replaces that with something closer to **Stronghold**: walls that
were built, an investment that takes time, and a defender with decisions.

⚠️ **On the 1 September path** (D139). It is the headline feature and it is
scheduled as one, not left as an appendix.

### 19.1 The shape

Two answers that looked like a conflict are actually the design. The siege is a
**multi-turn investment** that sits on the map, and each **assault** the
attacker commits to is a **set piece at the city hex**, filmed with the
cinematic camera. Nothing gets a second board.

```
lay siege ──► invested (turns pass, attrition, defender acts)
                  │
                  ├── attacker assaults ──► set piece: 3 to 5 rounds
                  │                          one question per round
                  ├── defender sallies ──► field battle, siege may break
                  └── relieved or starved ──► siege ends
```

### 19.2 Walls

Cities gain **wall levels through production** (D142), which finally gives
production a purpose beyond units. A wall level raises the effective defence
and the number of assault rounds needed to reach the gate.

- New city fields: `wallLevel`, `wallHp`. **Save version 4** with a migration
  defaulting both to zero, so every existing save keeps working.
- Wall levels are a production category alongside units, drawing on the same
  capped Compute, so arming and fortifying compete exactly as building and
  studying already do.
- The AI must understand walls, or it will throw itself at a fortress forever.

### 19.3 One question per round, and it decides the tactic

Each assault round the attacker picks a tactic and answers **one question from
the defending faction's cluster**, which is the rule battles already use. So
besieging the Scan Wraiths tests you on B3, repeatedly, in the branch you are
about to be examined on.

| Answer | What it buys |
|---|---|
| Right, fast | The tactic lands at full force |
| Right | The tactic lands |
| Wrong | It stalls: the round is spent, the wall holds |
| Abandoned | It stalls and the defenders counter |

⚠️ **The result has to be visible**, in the way the defence question already is
at 36 damage against 100 on the same seed. A siege that asks four questions and
then resolves on today's arithmetic is a longer battle, not a better one.

### 19.4 The defender has four answers, and all of them ship (D143)

| Option | Cost | Effect |
|---|---|---|
| **Hold the walls** | A question | `defenderChallengeScore`, as today |
| **Sally out** | Risk the garrison | A field battle against the besiegers; a win can break the siege |
| **Pour in resources** | Compute or CU | Repair wall damage mid-siege |
| **Wait it out** | Population and yield | Attrition works on both sides; the besieger is also spending |

The AI picks by rule, so an antagonist city defends itself the same way.

### 19.5 Build order, and the trigger

1. Walls: city fields, production category, save v4, tests.
2. Siege state: lay, persist, relieve, break. Turn pipeline phase.
3. The assault set piece: rounds, tactics, questions, cinematic camera.
4. Defender options, one at a time in the order above.

⚠️ **If the assault is not playable by end of Thursday 28 August**, ship walls
plus the set-piece assault and cut the multi-turn investment, leaving the
siege as a single dramatic encounter. That keeps the visible half and drops
the half that is mostly state management.

---

## 20. The period, and what it costs

**Everything is set around 1600** (D145). Not decoration: it is the last era in
which fortifying a city decided campaigns, which is what makes the siege (19)
the centre of the game rather than an extra.

### 20.1 What that rules out

Nothing metallic, nothing that glows, no plate glass. The old city was
concrete, glass and an emissive beacon, which is why it read as science fiction
parked in a landscape that was trying to look real. The palette is earth,
rubble stone, lime plaster, oak, fired clay and slate.

### 20.2 The units are the outstanding half

⚠️ The town now looks like 1600 and **the army does not**. The roster is
tracked hulls with gun rings and emissive strips, and parked beside a
tiled-roof town it is the most obviously wrong thing on the screen.

| Shape now | Becomes |
|---|---|
| Melee hull | Pike block |
| Ranged hull | Musketeers, matchlock |
| Siege hull | Cannon and its train |
| Scout hull | Light horse |
| Settler, worker | Cart and surveyor's party |

The names do not change. A Pipeline Runner stays a Pipeline Runner, because
the joke is the point and the tech tree is the exam. Only the shapes change.

### 20.3 What stays exactly as it is

Terrain, water, erosion and ground cover are period-neutral and already look
right. **Corruption stays surreal on purpose** (D138): it is the one thing in
the frame that belongs to no century at all, and that contrast is why it works.

---

## 21. Fog of war
The whole map is visible from turn one. That gives away all seven camps before
a single move, removes every reason to scout, and makes the Profiler, whose
entire point is a sight radius, just a faster soldier.

### 21.1 The rule

- Every unit and city has a **sight radius**. A hex is **visible** if anything
  of yours can see it this turn.
- A hex that has ever been visible is **explored**: the ground is remembered,
  but units and cities in it are not drawn live.
- Everything else is **unseen**, and draws as nothing at all.

### 21.2 Where it lives

In the engine, as explored state per faction, because it is a rule rather than
a presentation trick and the AI has to be able to respect it. It has to
survive a reload, so **save version 5**, migrating an older save to fully
explored rather than blanking a map the player already uncovered.

### 21.3 The decision that has to be explicit

⚠️ **The antagonists do not use fog.** They know where the player is. That is
stated here rather than left as an accident of implementation, because the
alternative is seven factions wandering a dark map looking for someone. They
are a besieging pressure on a learner, not an opponent in a fair match, and
the leash (D92) is what keeps that fair rather than mutual blindness.

### 21.4 Built, 22 Aug

Save version **6**, not 5: cheat codes took 5 first. An older save migrates to
fully explored, because blanking a map somebody has already uncovered would be
a worse answer than admitting the save predates the feature.

| Measured, standard map, turn one | |
|---|---|
| Hexes known | **61 of 6,211** |
| Hidden | **99%** |
| Enemy villages drawn | **0 of 7** |
| Fogged frame vs unfogged, as PNG | 200 kB vs 493 kB |

The last row is the honest test: an occluded frame is mostly flat colour and
compresses to less than half. While the fog was broken it was *larger* than the
unfogged frame, which is what a layer that adds detail instead of hiding it
looks like.

⚠️ **Three of the four things that went wrong were measurement, not rendering.**
The layer was provably present, opaque, above the terrain, unculled and passing
the depth test, and drew nothing. What actually happened:

1. `hexPatch` cannot occlude (D229): flat chords across a subdivided surface,
   the same error as D167. Needed `hexLid`.
2. `surfaceAt` is not the height of the ground (D230). Needed `peakAt`,
   measured from the finished vertices.
3. Fog covered the ground and not the forest (D231): 4,199 trees standing
   through a lid a tenth of a unit high.
4. **The lid was wound upside down** (D232), so every triangle was a back face
   from above and `FrontSide` culled the lot.

And two measurements agreed with themselves and were both wrong (D233): a
per-hex clearance check that bucketed lid and ground with the same rounding
`peakAt` uses, and a "ground" probe that selected the fog by vertex count.


---

## 22. Map size, and what it cost

**Radius 45** (D150): about 6,200 hexes and 156 world units across, against
1,950 and 87. Roughly 3.2 times the area and twice the width.

### 22.1 Measured, on this machine

| | Before (r=25) | After (r=45) |
|---|---|---|
| Tiles | 1,951 | 6,211 |
| Terrain vertices | | 309,418 |
| Time to playable | | **8.1 s** |
| Frame time, median | | 6.5 ms |
| Frame time, worst | | 7.6 ms |
| End turn | | 21 ms |

Rendering is comfortable and turns are instant. **Cold start is the whole
cost.** Erosion at full density took it to 10.3 s, and capping droplets at
240,000 bought back 2.2 s while leaving the erosion visibly cutting
(max delta 1.13 to 0.90).

### 22.2 The consequence that has to be built

⚠️ **Eight seconds of blank screen is the single worst thing about the game
right now.** Someone opening a submitted link out of curiosity gets nothing to
look at for longer than they will wait. The rest of the build is mesh
construction rather than erosion, so trimming droplets further would cost
terrain quality for very little time.

The fix is a **loading screen with real progress**, not a smaller world. It is
now a required deliverable rather than polish.

### 22.3 What did not have to change

Saves. The map is never serialised, only the seed and the overrides, so a
3.2-times-larger world is still a save of about 1.1 kB.

---

## 23. Islands and ships

⚠️ **This reverses a Tier 0 cut.** "Naval units and OneLake crossings" were cut
in 15.1 before any code was written. They are back on request, and the way in
turned out to be nothing like the way it looked.

### 23.1 The map was the blocker, not the ships

Measured first, across five seeds at the current settings:

| | Landmasses | Land off the mainland |
|---|---|---|
| Before | **1** (one seed had a 7-tile islet) | **0 %** |

A ship on that map is a boat with nowhere to go. Worse, the levers that look
like they should fix it do not: a sweep across noise frequency (0.055 to 0.17),
land fraction (0.45 to 0.28) and edge falloff (1.9, 3.0) produced **one
continent holding 97 to 100 percent of the land in every single combination**.

Two reasons, and both had to be dealt with:

1. **fbm is dominated by its lowest octave**, which spans the whole map, and
   `edgeFactor` then adds one radial hill centred on the origin. The top slice
   of elevation is therefore always "the middle of the map".
2. **Classification is by quantile.** A fixed share of tiles becomes land
   whatever the mask says, so lifting a few small areas just promotes the sea
   between them instead.

So the shape comes from a **multi-centre mask**: several island centres, each
with its own falloff, land factor taken from the nearest. Reach is held under
half the centre separation so islands cannot touch, and the land fraction has
to drop to about 0.3 so the land fits inside the masks rather than spilling
between them. One centre at the origin reproduces the old continent exactly,
which is why the golden digests still hold.

Result at `islands: 5, landFraction: 0.3`: four landmasses, a home island of
roughly 900 tiles, a serious rival island of about 500, two smaller ones, and
72 percent open water.

### 23.2 ⚠️ Why it is off by default

Turning it on **broke the game**, and the tests said so precisely: three AI
tests and the defeat test failed because **land units cannot cross water**, so
factions placed on other islands never arrive. No raids, no pressure, no
defeat. Exactly the "a bigger world is an emptier one" failure again, wearing
a different hat.

So the capability lands now, tested and off, and `islands` stays at 1 until
there is a way to cross. **The default flips in the naval phase, not before.**

### 23.3 What ships need

Already present: `MovementDomain` of `land` or `water`, `canStandOn` floating a
water unit, and `shortcutSkiff`, a transport with movement 4 unlocked at skill
16. A skiff can already sail. What is missing is everything that makes that
matter.

1. **Embark and disembark.** A land unit boarding a ship, and stepping off onto
   a coast. This is the whole feature; the rest is trimming.
2. **Cargo.** Ships carrying a small number of land units, and dying with them
   aboard, which is what makes a crossing a decision.
3. **The AI must understand water.** `planUnitAction` walks with `findPath`,
   which will simply fail across a strait, and a faction that cannot path to
   the player currently just stands still.
4. **Coastal cities build ships.** Production needs to know a city is on a
   coast, or an inland town builds a navy.
5. **Naval combat**, which mostly falls out of the existing rules once ships
   are units that can attack.

### 23.4 Order, and the trigger

Embark and disembark, then cargo, then AI crossings, then coastal production.
**The default island count flips only when the AI can actually cross**, because
that is the step that decides whether an archipelago is a world or a diorama.

⚠️ If the AI cannot cross by end of **Saturday 30 August**, `islands` stays at
1 for the submission and the archipelago ships as an option the README
mentions. The capability is already tested, so that costs nothing but the
headline.

---

## 24. Depth: what Anno 1602 knows

Anno 1602 (Max Design, 1998) is set in **1602**, the period already chosen at
D145, and its premise is building colonies "on islands of various sizes in an
archipelago". The era, the islands and the ships all line up with decisions
already taken here for unrelated reasons, which is why it is worth mining
rather than admiring.

Its lesson is not a feature. It is that **the engine of the game is escalating
demand**. Anno's population rises through Pioneers, Settlers, Citizens and
Merchants, and each tier wants more sophisticated goods; meeting the demand
unlocks more, failing it causes decline, riots and lost income. Nobody is
fighting. The pressure is entirely economic and it never stops rising.

That is the same shape as studying for an exam, which is the whole opportunity.

### 24.1 The five worth taking, in order of leverage

**1. City tiers that demand knowledge, not goods.** The single most valuable
idea here. A city rises through tiers, and each tier raises what it needs from
the skills bound to it: a Hamlet wants one topic merely *seen*, a Town wants
two at **familiar**, a City wants **strong**, a Capital wants most of a
cluster. Fail the demand and the city stops growing, then slides back, exactly
as Anno's houses downgrade. Unrest (D71) already exists as the pressure valve
and mastery bands (`sm2.ts`) already exist as the measure, so this is mostly
composition rather than new machinery.

⚠️ This turns *forgetting* into a visible economic event. Today a lapsed topic
costs a bonus; here a lapsed topic can cost a city its tier.

**2. Island affinity, which forces breadth.** In Anno, an island grows tobacco
or it does not, and that is what makes you settle a second one. Here: **each
island favours certain clusters**, so a city on it can only rise to the higher
tiers on those. One island therefore cannot carry an empire, and it cannot
carry an exam either. This is the mechanic that makes the map argue for the
thing the exam actually requires: **you cannot pass DP-600 by studying one
branch**, and the geography would stop you trying.

**3. Production chains, which Fabric hands us for free.** Anno's "line of
production" has an exact counterpart in the medallion architecture: **raw files
to Bronze to Silver to Gold**, each stage a building that consumes the one
before. It is a real pattern, it is on the exam, and it is a genuine chain
rather than a metaphor stretched over one.

**4. Progressive pacing.** Anno 1602's AI is documented as adapting "in
response to how quickly players act". The aggro leash (D92, D151) is already a
function of the turn number; making it partly a function of **exam readiness**
means a player who is learning fast gets a harder game, and a player who is
struggling gets room. Small change, large effect, and it is the honest
difficulty curve for a study tool.

**5. Ships carry cargo, not cannon.** Anno upgrades ships for hold size rather
than firepower, and its peaceful strategies are the ones people praise. Worth
copying directly: the naval phase (23) should make transport and trade the
point, with naval combat a consequence rather than a goal.

### 24.2 What to leave alone

- **Trade routes between your own cities.** Lovely in Anno, and here it would
  be a logistics interface serving a game whose subject is revision.
- **A tax and satisfaction slider.** The review loop already is the satisfaction
  mechanic, and a second one would compete with it.
- **Neutral traders selling goods.** Tempting as flavour, but a shop that sells
  progress is the wrong message in a study tool. If it ever exists it sells
  *time*, never answers.

### 24.3 ⚠️ Scope: this does not fit before 1 September

Being straight about it. The remaining nine days already carry the full art
programme, the siege, sound, fog of war, the 1600 unit roster, ships and the
deployment. Section 24 is a second game's worth of design on top of that.

So it is staged, and the split is by leverage rather than by appetite:

| | Item | Before 1 Sep |
|---|---|---|
| 4 | Progressive pacing tied to readiness | **Yes.** Hours, not days |
| 1 | City tiers demanding mastery | **Done 22 Aug**, section 33: five tiers, stall but no decline |
| 2 | Island affinity | Only if ships land (23.4) |
| 3 | Medallion production chains | No |
| 1b | Tier decline and riots | No |

⚠️ **Trigger: if city tiers are not playable by end of Friday 29 August**, the
progressive pacing ships alone and the rest becomes the post-contest roadmap.
Pacing is a handful of lines against a system that already exists; tiers touch
the save format, the city panel and the AI's idea of what a city is worth.

---

### 30. Two players, one screen

A parent revising DP-600 and a first grader, on one keyboard, in one empire.
Built 22 Aug.

The obvious design was two empires taking turns, and it is wrong for this pair.
A six-year-old will not sit through an adult's turn, and an adult revising for a
certification will not get through a syllabus at a child's pace. So there is
**one empire and one turn**, and when a battle asks a question it asks **both
seats at once**, each from their own course. They are on the same side. The
child is not an opponent to be beaten, they are the other half of the answer.

#### 30.1 How it plays

Choose **Two players, together** on the setup screen, then a course per seat.

| | Player 1 | Player 2 |
|---|---|---|
| Answers with | `1` `2` `3` `4` | `a` `b` `c` `d` |
| Course | any campaign that can build a world | any campaign at all |
| Default | DP-600: Fabric Analytics Engineer | 1. Klasse: Mathe und Deutsch |
| Builds the world | yes | no |
| Moves the readiness figure | yes | ⚠️ **never** |

Both panes appear side by side, seat one on the left in blue, seat two on the
right in amber and a size larger. One keypress is the whole answer: no Enter,
no mouse, nothing to aim at. The battle's score is the **mean of the two**, so
the child's answer genuinely decides fights, and the log says so out loud when
they carry one their parent lost.

The second seat's course supplies **questions only**. Player one's course is
what the world is made of: the tech tree, the factions, the exam at the end.
That asymmetry is what lets a 24-skill Year 1 curriculum sit opposite a 41-topic
certification without either being bent to fit the other.

#### 30.2 The German content

`learn/content/klasse-1` holds a small first-year curriculum: two branches,
seven clusters, 24 skills, 51 questions. Zahlen bis 20, Plus und Minus, Formen,
Anlaute, Silben, Wörter schreiben, Lesen. Written short on purpose, because the
player is still learning to read: `3 + 4 = ?`, `Womit fängt das Wort Sonne an?`.
The content build now walks every campaign folder rather than only `dp-600`,
and DP-600's built output was verified byte-identical after that change.

#### 30.3 Decisions

| ID | Decision | Why |
|---|---|---|
| D235 | Co-op is one empire, both seats asked at once, scores averaged | Alternating turns fails both players: a six-year-old will not wait through an adult's turn and an adult will not revise at a child's pace. Averaging is what makes the child load-bearing rather than decorative. Half a right answer still moves a battle |
| D236 | Player one's course builds the world; player two's supplies questions only | A Year 1 curriculum has 24 skills where a world needs 41, and no business fielding armies. Making the second seat world-capable would mean either padding the curriculum or weakening the check that stops a short DP-600 outline shipping with dead unit unlocks |
| D237 | `role: 'questions'` campaigns are exempt from the world rules | The exemption is the feature, and it is declared on the campaign rather than inferred from its size, so a campaign that *intends* to build a world and is too short still fails loudly |
| D238 | ⚠️ **The second seat has no mastery tracker** | D205 in a second form. A six-year-old answering about Anlaute must not move the number that says whether a grown-up is ready to sit DP-600. Enforced by a test that reads the source, because the absence of an argument is what a later refactor puts back without noticing |
| D239 | One keypress is the whole answer, and the two keypads never overlap | No Enter, no mouse, no target to hit. Digits for the reader and letters for the child, because A B C D is easier to find than the number row. If a key ever answered for both seats, one player would be answering the other's question for them |
| D240 | ⚠️ The seat listener is capture-phase and stops propagation | `b` founds a city and `p` raids one, on a `window` listener in the bubble phase. Without this the child answering "b" builds something on their parent's turn. Every key is swallowed while any seat still owes an answer, including keys belonging to neither seat, and including the pause while a correction is on screen |
| D241 | ⚠️ **Both seats must be panes of the same modal** | Seat one was left on the single-player modal at z-index 50 while the duo layer sits at 52, so player one's question rendered underneath it and was simply invisible. Found by a browser test reporting one pane where two were expected, which no unit test would have caught |
| D242 | A campaign's `course` is separate from its `title` | They are read in different places and only one answers "what am I being asked about". DP-600's world is called Fabric Empires, which is a good name for a world and says nothing as a label beside "1. Klasse: Mathe und Deutsch" |

#### 30.4 What was measured

Browser test, `temp/coop.mjs`: two panes, seat one showing a DP-600 stem with
keys `1 2 3 4`, seat two showing `3 + 4 = ?` with `A B C D`. Pressing `2`
selected in seat one only, `c` in seat two only, and the map ended the run with
zero cities founded, so neither answer had leaked through as an order.

Unit tests, 13 in `app/test/duo.test.ts`, driving real `keydown` events at
`document.body` in jsdom against a stand-in for the map's listener rather than
grepping the source for `stopPropagation`: the source containing the word is
not evidence that the event stopped. Suite total 721.

#### 30.5 Open

- ⚠️ `buildSecondSeat()` runs only when a game is started from the setup
  screen. A **resumed** save comes back single-player, because the seat choice
  is not in the save format. Acceptable for now: starting a fresh world is the
  normal way this gets played, and putting seats in the save would need a
  version bump for something two clicks can restore.
- The second seat never sees a Great Library or a readiness figure of its own,
  by D238. If the Year 1 course is ever to become a study tool in its own
  right it needs a second, separate tracker, not a share of this one.

---

### 31. The period pass: figures, and a fort with an inside

Second realism iteration, 22 Aug. The first one bought light and land: physical
materials, a scattering sky, eroded terrain, ground cover. What it left behind
was everything standing **on** that ground, and the gap had become the loudest
thing in the frame: tracked steel vehicles with glowing hull strips, parked
next to a bastioned fort of 1600.

#### 31.1 What was measured first

Nothing here was designed from a screenshot alone. Pixels on screen, 1600x900:

| Zoom | px per hex | px per world unit |
|---|---|---|
| as the game opens | 19.9 | 11.5 |
| 6 wheel notches in | 41.7 | 24.1 |
| 12 notches in | 87.2 | 50.3 |
| closest the camera goes | 182 | 105 |

And three facts that killed three planned features before they were written:

- **37 meshes in the whole scene, 3.8 ms a frame.** A geometry-merging kit was
  going to be the enabler for all of this. Draw calls are not a problem, so it
  would have been a week spent on a number that was already fine.
- **Picking raycasts the ground mesh only.** `userData.kind` is written on
  every entity and read nowhere. Merging could never have broken selection,
  which was the main reason to be afraid of it.
- **Combat poses the whole unit group**, `rotation.set` and `scale.setScalar`
  on the top-level object, never a limb. So a unit's internals are free.

#### 31.2 ⚠️ The scale contract

The standing instruction for 3D scenes is that nothing may be exaggerated. It
was written for digital twins and it cannot be applied literally here, so
rather than quietly working around it, here is what it means for a map.

A fortified town fills a hex. A real one is 300 to 400 m across, which would
make one world unit about 400 m, which would make the existing trees 200 m
tall. At the zoom the game opens at, a 1.75 m man drawn to scale is **0.05 of
a pixel**. Literal scale is not on the table at any zoom this camera reaches.

So the scene is split into two layers, and the split is stated rather than
assumed:

| Layer | What it is | Rule |
|---|---|---|
| **Map symbol** | The tray under a stand, and the faction ring on it | Sized for the camera. Never claims to be an object. May carry a little emission |
| **The world** | Men, houses, carts, walls, guns, boats, trees | One scale, real proportions, measured against each other and never against the camera |

The second layer is anchored on one number. A village house is about 7 m to
its ridge and stands 0.35 tall, so a metre is 0.05 and **`MAN = 0.092`**. Pikes
are 5.5 m from that, a gabion is 1.1 m, a cart wheel is 1.24 m, a hoy's mast is
5.3 m. Nothing in the world layer is sized any other way.

This is not called realistic scale and the phrase "digital twin" does not
belong anywhere near this scene. It is a period-readable miniature.

#### 31.3 What changed

| | Before | After |
|---|---|---|
| Unit | One tracked steel hull, three loadouts, painted faction blue, emissive strip at intensity 2.4, whole object scaled 0.85 to 1.52 by strength | A wargame stand per role: pike block, musket line, gun and crew, gabion post, light horse, pioneers, surveyor and cart, drummer and powder cart, a hoy |
| Strength | Made the unit bigger | Puts more men on the stand |
| Faction colour | Painted hull plus a glowing strip | Sashes, the colours on a standard, and a painted ring on the tray |
| Fort | Solid rampart, no interior, three near-white materials | A ring wall with a turfed walk, a sunken courtyard, houses along a street, a gate, a road, a cart and a well |
| Boulders | Neutral grey, near white in sun | Warm, dark, biased away from the pale end |

Materials `steel`, `darkSteel`, `concrete`, `glass`, `paint` and `emissive`
were **deleted** rather than left unused. An unused material is an invitation,
and those six are exactly how this scene became science fiction the first time.

#### 31.4 ⚠️ The bug that had been hiding in plain sight

The town read as a beige pancake, and the assumption for a long time was that
this was a colour problem. It was not. **The rampart was a solid cylinder**, so
its top face was a disc of radius 0.74 that covered the courtyard, the street
and every house plot: the fort had no inside. Bastions were invisible for the
same reason, having nothing to be a silhouette against. No amount of value
separation was ever going to fix it, because what was missing was the hole.

A wall is a ring. Once it was one, and the walk on top was turfed dark against
the pale stone below, the fort read as a fort at every zoom.

#### 31.5 Decisions

| ID | Decision | Why |
|---|---|---|
| D243 | ⚠️ **A unit is a wargame stand: a map-symbol tray, and figures that are not** | The honest way out of a contradiction the scene cannot escape. A man drawn to scale is a twentieth of a pixel at opening zoom; the old answer was to draw him twenty times too big. A painted counter never claimed to be an object, so it can carry the recognition while the miniatures on it keep their real proportions against the buildings |
| D244 | ⚠️ **Strength adds bodies, never height** | A tercio was not made of larger men. The old code scaled the whole unit by 0.85 to 1.52, which is precisely the exaggeration the standing rule forbids, and it was invisible because there was nothing beside it to compare against. Enforced by a test that builds all twelve and measures them |
| D245 | The emissive strip is replaced, not deleted | It was ugly and un-1600 and it was also the only reason a unit could be found in shadow, forest or fog. Removing it for a nicer screenshot would have traded a working affordance for a picture. The tray ring does the same job at intensity 0.22 instead of 2.4 |
| D246 | ⚠️ **The faction colour has to be an annulus, not a rim** | First attempt put a slightly wider disc under the tray so a sliver showed at the edge. Measured, that sliver is three pixels at close zoom and nothing at all at opening zoom, and the stand read as a dark hole with specks on it. A broad flat ring is what a player sees from above |
| D247 | ⚠️ **A flat plate laid on a hex sinks into it** | The ring drew as a broken arc because the ground inside one hex is subdivided, displaced and eroded. Same failure as the fog lid (D229). The base is now a shallow plinth, mostly underground, so its top face is always flat and always visible |
| D248 | Every stand carries colours, not only the fighting ones | Only combat roles had a standard at first, so the two units a game actually opens with, the Architect and the Profiler, were the two with nothing above knee height. On a photograph of the opening position they were invisible |
| D249 | ⚠️ **The rampart is a ring, and was a solid cylinder** | Section 31.4. The single geometric fact behind months of the town looking like a pancake |
| D250 | Houses stand along a street, not on random bearings | A settlement is the opposite of scattered: buildings share a frontage because they share a road, and plots are regular because they were measured. The jitter is now noise on an order rather than the order itself |
| D251 | Two props by the gate, and no more | A cart and a well are objects whose real size everybody knows, so they fix the scale of everything around them. Villagers, fences, haystacks and market stalls were cut: past about two, props stop being a scale reference and start being clutter, and the fort stops reading as a fort |
| D252 | No chimney smoke, no strip fields | Both were in the plan and both were dropped on the duck's advice. Transparent particles against a fogged, bloomed scene sort badly; fields around every city turn the map into a quilt that fights the biome colours and the ownership overlays. Neither is worth the risk this close to a deadline |
| D253 | Roads get their own material, darker than it feels like they should be | Drawn in the same `earth` as the courtyard, the road read as a bright sand-coloured apron spilling out of the town, more prominent than the fort. Bare earth in sun really is lighter than grass, so the fix is not to make it grey, it is to keep it dark enough to read as a line rather than a surface |

#### 31.6 What was cut, and by whose argument

The Rubber Duck's charge was that Approach A was six features wearing one coat,
and that this is a DP-600 study tool with nine days left. Cut on that basis:
the geometry-merging kit (measured unnecessary), third-party glTF asset packs
(licensing and style-matching against a deadline), generated art (still blocked
on an Azure region decision, and billboards look pasted on in a miniature
world), ground micro-detail (already measured to darken the scene, section
16.1), chimney smoke, strip fields, a second tree species, and individually
modelled bodies for all twelve unit types. Roles, not types, do the work: nine
roles cover twelve units and they already exist in the engine.

It also predicted the failure this pass actually hit. "Primitive humans at map
zoom will be visual noise" was right, and the answer was not to inflate them.

#### 31.7 Verified

- **Findability at every zoom, with no hover and no selection.** Faction-coloured
  pixels counted in a 92 px window around each unit's projected position:
  41 and 48 at opening zoom, 51 and 70, 152 and 238, 685 and 1028 at the
  closest. Floor is 12, which is about the smallest patch of colour that can be
  picked out of a busy frame without hunting. Script: `temp/check-findability.py`.
- 728 tests, 14 new, including six that build all twelve stands and measure
  them: nothing scaled bodily, more mesh for more strength at the same height,
  every stand shorter than a house ridge, every foot stand within 5 cm of every
  other, faction colour present on all of them, and no emitter above 0.6.
- Frame time unchanged at 3.8 ms.

#### 31.8 Open

- Enemy villages were never photographed close up, because fog of war hides
  them and there is no reveal hook. They use the same `buildCity`, so they get
  the same fort, but that is inference rather than a picture.
- The bastions read better than they did and still read as pale wedges more
  than as arrowheads from directly above.
- Ruins still use the old vocabulary and have not been looked at since the
  fort changed underneath them.
- Hex plateau facets are still visible on the terrain. Left alone deliberately:
  it is the board the game is played on, and section 16.1 already records what
  happened the last two times the ground surface was attacked.

---

### 32. The opening, and the anthem

A title sequence and a trailer, 22 Aug. The brief was an intro film with a
"legendary" theme in the manner of the big orchestral game anthems, on the
theme *learn Fabric, learn as a family*.

#### 32.1 The song

**`Familia Nostra`.** Original words and setting, generated with Suno from a
style prompt that describes the genre and names no existing recording, melody
or artist. Full text and translation in `media/familia-nostra.txt`.

Latin, because the anthems of this kind work by singing a real text in a
language that belongs to nobody in the audience, which is what makes them read
as timeless rather than as a game jingle. It also turned out to be almost
unfairly apt:

| Latin | |
|---|---|
| `fabrica` | a craftsman's workshop, a forge |
| `texere` | to weave |

So "Fabric" is already a Latin pun, and the two halves of the chorus are the
same sentence twice:

> *Texamus una, filum et lumen* — Let us weave together, thread and light
> *Familia nostra, discamus una* — Our family, let us learn together

The German verse is the plainest language in the piece and is the only moment
the anthem stops being grand: *Zwei Hände, eine Tastatur. Ein Kind, ein Vater,
eine Spur.* Two hands, one keyboard. A child, a father, one track.

⚠️ **Two takes came back and neither could be listened to here, so they were
compared by measurement.** Mean volume in ten-second buckets across both:

```
take A   -21.5 -21.7 -21.3 -17.0 -15.6 -14.7 -20.0 -19.2 -15.9 -14.5 -14.5 -14.2
take B   -21.1 -19.8 -20.3 -19.7 -15.3 -14.6 -16.8 -17.3 -16.5 -15.1 -15.1 -15.6
```

Take A was chosen on 7.5 dB of build against 6.5, and more tellingly on the dip
to -20 dB at 60 to 80 seconds: that is the `[Bridge - almost silent]` direction
actually landing. Take B runs flat through the same span.

#### 32.2 The film

`media/fabric-empires-intro.mp4`, 46 seconds, five cuts:

| | Beat | From |
|---|---|---|
| 1 | The world, from too far away to play from | The opening, beats 1 to 3 |
| 2 | The first town is founded | The existing founding cinematic |
| 3 | The town, close | A held camera on the fort |
| 4 | **Two questions at once** | A real battle in two-player mode |
| 5 | Title and tagline | The opening, beat 4 |

Beat 4 is the whole argument in one frame: *"Which semantic model storage mode
reads Delta tables in OneLake directly?"* on the left in blue with keys 1 to 4,
and *"Welcher Buchstabe ist KEIN Vokal?"* on the right in amber with keys A to
D. Nothing else in the film needs to explain what the mode is.

The music is cut, not faded down mid-phrase: the opening and the first build,
then a crossfade into the final chorus and the outro, so the title card always
lands on *Fabrica... nostra*. The split is proportional to the finished length,
so re-cutting the picture re-fits the score without anyone doing arithmetic.

#### 32.3 It is a feature, not a video file

The cinematic module opens with a rule (D59): shots are rendered live, this
project ships no assets, and a pre-rendered clip would show a world that is not
the player's. The opening obeys it. `app/src/intro.ts` composes four shots over
the world that was generated from the seed the player just typed, so no two
players see the same film, and the trailer is a screen recording of a feature
rather than a thing made for marketing.

#### 32.4 ⚠️ The opening was 73 percent black, and that was the real work

The first take looked wrong and the reason was not artistic. The opening runs
at turn one, when the player has explored 61 of 6,211 hexes, so the widest,
slowest and most expensive shot in the sequence was a small lit patch floating
in fog. Measured on sampled frames:

| | before | after |
|---|---|---|
| beat 1, the whole world | 73.4% black | 24.9% |
| beat 2, the coast | 82.4% black | 26.9% |
| beat 3, the descent | 39.9% black | 24.3% |

The fix is not a cheat, it is the better reading of the scene: the land rises
out of nothing, whole, and then the fog falls on it under the title card and
you are left knowing only your own corner. That is the same order the words
are in.

#### 32.5 The licence problem, stated plainly

Suno's free plan licenses its output for **non-commercial use**. This repository
is meant to go public. So the anthem and the trailer that carries it are both
gitignored, and `NOTICE.md` says why.

⚠️ The interesting part is what that forced in the code. `app/src/audio.ts`
does a `HEAD` request for `audio/anthem.mp3` at load; if it is missing, which
is the state of every fresh clone, every call becomes a no-op and the opening
plays in silence with nothing broken and nothing logged. The feature ships, the
licence does not, and neither one is pretending.

Also noted while there: **Suno's terms change on 3 September**, with download
limits by plan. That is after the deadline, but it is why both takes were
pulled down the moment they existed rather than left in the workspace.

#### 32.6 Decisions

| ID | Decision | Why |
|---|---|---|
| D254 | The intro is a live title sequence, not a video file | D59 applies to the opening as much as to the terrain. A pre-rendered clip would show a coastline that is not the player's, and would be the first thing in the project to lie about what it is showing |
| D255 | Latin, with one German verse | The genre works by singing a real text in a language nobody in the audience owns. Latin also supplies `fabrica` and `texere` for free. The German verse exists so the song says once, in plain words, what the grand part is about |
| D256 | ⚠️ **Original in the genre, never derivative of a specific work** | No existing song, melody or artist is named in the style prompt, deliberately. Asking a generator for "like *X*" is asking it for a derivative, and the difference between an homage and a copy is decided before the prompt is sent, not after |
| D257 | ⚠️ **The fog lifts for the opening and falls under the title** | Measured, not judged: the establishing beats were 73 to 82 percent fog. Also the better scene. The land rises whole, then the fog takes it away, in the same order as the words |
| D258 | The score is optional at load time | The one way to satisfy both "ship no assets" and "have an anthem". A missing file is silence, not an error. It also means the licence stays outside the repository without the feature being conditional on anything a reader can see |
| D259 | The two takes were chosen by measurement | Neither could be listened to here. Ten-second mean-volume buckets show the build and, more usefully, show whether the quiet bridge the lyrics asked for actually happened. One take had it and one did not |
| D260 | The setup screen was cut from the film | It showed how to switch the mode on, measured 86 percent black because no world exists behind the card at that moment, and a trailer should not be teaching menus. The two question panes make the same point with content instead |

#### 32.7 Verified

- 737 tests, 9 new, covering the sequence as data: the beats are named with the
  words of the anthem, every card is readable for at least five seconds, the
  whole flight is under a minute, the camera never drops below 1.5 units at any
  moment of any beat **on every world size**, and no beat jumps.
- Final file: 46.0 s, 1600x900 h264 plus AAC, mean -19.1 dB, peak -1.0 dB, no
  clipping. Frames sampled per segment: no black holes at any cut.
- The optional score is served and found: `HEAD audio/anthem.mp3` returns 200.

#### 32.8 Open

- The film has no armies marching and no Proctor. Both were in the plan and
  neither is in the take, because a 46 second cut that already contains the
  world, a founding, a town and two questions has no room left for them.
- The trailer is recorded at 1600x900 rather than 1080p, which is the recording
  viewport rather than a limit.
- Nobody has listened to the anthem yet. Everything above about it is inferred
  from its loudness envelope, which is a real measurement of a real property
  and is not the same thing as it being good.

---

### 33. Settlements that develop: Siedlung to Großstadt

Built 22 Aug. This is item 1 of section 24.1, "city tiers that demand
knowledge, not goods", which was called there "the single most valuable idea
here" and scoped for the 29 August window. It came early and it came at five
tiers rather than the three the deadline plan allowed.

| | German | English | Citizens | Topics retained |
|---|---|---|---|---|
| 1 | Siedlung | Settlement | 1 | none |
| 2 | Dorf | Village | 2 | 1 at learning |
| 3 | Gemeinde | Township | 4 | 2 at familiar |
| 4 | Stadt | Town | 6 | 3 at familiar |
| 5 | Großstadt | City | 9 | 4 at strong |

#### 33.1 A rank cannot be bought with food

⚠️ **This is the point of the whole feature and it is worth being blunt about
it.** A town that grows purely on food rewards ending turns quickly. A town
that grows on what its owner has actually retained rewards revising. Only the
second of those is why this project exists, so a rank costs both: citizens are
the body of the place and retained knowledge is its licence.

Every city already carried `boundSkills`, the topics whose buildings stand in
it, and the spaced-repetition data already graded every topic into `unseen`,
`learning`, `familiar` and `strong`. So this is composition, not machinery.
The one new piece is `bandStrength` in `sm2.ts`, which is the single place the
four bands are given a size.

Yields climb with rank, from parity at Siedlung to **+45% at Großstadt**, so
revision pays in the currency the game is actually played in.

#### 33.2 A second axis, not a replacement

`CityKind` already says what a settlement *does*: Workspace, Lakehouse,
Warehouse, Eventhouse, Semantic Model. Rank says how far along it is. They
compose, so a place reads "Lakehouse, Township" and neither half repeats the
other.

#### 33.3 The fortress is earned, and used to be free

Every settlement got the full bastioned trace the moment it was founded, which
was wrong twice over. Historically it is absurd: a *trace italienne* was among
the most expensive things an early modern state could build, and one did not
appear around a hut. And in play it wasted the whole vocabulary, because if a
one-citizen camp already looks like a fortress there is nothing left for a real
city to look like.

| Rank | What stands there |
|---|---|
| Siedlung | A few huts and a track. **No wall at all** |
| Dorf | More houses, and a church tower to be recognised by |
| Gemeinde | The earth rampart goes up, and the gate with it |
| Stadt | Bastions, and the keep |
| Großstadt | A second storey on everything, and the cathedral spire |

#### 33.4 Decisions

| ID | Decision | Why |
|---|---|---|
| D261 | ⚠️ **A rank costs citizens AND retained knowledge** | Section 24.1's idea, built. Population alone would let a well-fed hamlet outrank a studied capital; mastery alone would let a city with one bound topic reach the top on turn three, which is arguably the purer rule and reads as broken. Guarded by a test that gives a city a hundred citizens and no knowledge and expects it to stay a Siedlung |
| D262 | ⚠️ **It stalls, it never falls** | The plan wanted full Anno downgrade behaviour, and that is the sharper mechanic. It is also the one most likely to feel like a punishment, which is the last thing a study aid can afford. Forgetting blocks progress; it does not burn your town down. That single sentence is why `rank` is stored rather than derived: a derived rank falls the moment a topic lapses |
| D263 | Both names live on one row of the rank table | The interface is English until after 1 September (D214) and the German pass will already have these. Carrying `label` and `labelDe` together means they cannot drift apart, which is exactly what happens when a name lives in a translation file away from the thing it names |
| D264 | Rank is a second axis over `CityKind`, not a replacement | What a settlement does and how big it is are different questions. Merging them would have meant either five ranks of Lakehouse or losing the Fabric item types, and both are worse than a two-word label |
| D265 | Promotion runs in the app, not in the turn pipeline | A rank needs to know how well a topic is retained, and that lives on the far side of the D35 line. Threading a knowledge callback down through `runUpkeep` would put a certification-shaped hole in the middle of the engine's turn loop for one rule. The engine gets a plain function from an opaque string to a number and never learns what the strings are |
| D266 | ⚠️ **The city panel says what the next rank is waiting for** | A growth rule nobody can see is a growth rule nobody plays, and a settlement that has quietly stopped is indistinguishable from a slow one. The knowledge case is picked out in colour because waiting on food is waiting on time, while a lapsed topic is something the player can fix this minute |
| D267 | The bastioned trace starts at Stadt | Section 33.3. It is both the historically sane reading and the one that leaves the vocabulary somewhere to go |
| D268 | Old saves are promoted on population alone | The honest migration would also check retained knowledge, and it would demote a nine-citizen capital on load because its topics went stale under a rule that did not exist when it was played. Every rank after the migration has to be earned properly |

#### 33.5 Verified

- 758 tests, 21 new. The load-bearing ones: a city with a hundred citizens and
  no knowledge stays a Siedlung; a city that knows everything and has one
  citizen stays a Siedlung; a Großstadt whose topics have all lapsed keeps its
  rank and gains nothing; promotion returns **the same state object** when
  nothing changed, so it is safe to run every turn.
- All five ranks photographed on one seed. The progression reads at a glance:
  huts and a track, then a church tower, then the rampart and gate, then
  bastions and a keep, then a dense walled city.
- ⚠️ One thing the pictures caught that the code could not: at Großstadt the
  church tower came out 1.22 units tall on a 0.16 base, an aspect of more than
  seven to one, which stopped reading as a church and started reading as a
  factory chimney. Height is now capped and the tower widens as it rises,
  because a real one thickens to carry itself.

#### 33.6 Open

- Rival settlements start at Dorf and never rise, because nothing computes
  mastery for an antagonist. Their villages are therefore permanently a
  village, which is invisible today and will look odd once a game runs long.
- Nothing yet spends a rank. It pays yields and hit points; a Großstadt should
  probably unlock something a Siedlung cannot build.
- The five thresholds have not been played against a real game's pace. They are
  reasoned, not tuned, and the first honest playthrough is likely to move them.

---

### 34. ⚠️ The clock was grading reading speed

Reported: *"enemies don't die normally on first fight, only on second fight."*
Fixed 22 Aug. The cause was not in combat.

#### 34.1 What was actually wrong

A correct answer scored **1.0 inside half the time limit and 0.6 outside it**,
and the time limit was a flat 20 seconds covering **reading as well as
answering**. Measured against the real question bank at the default pace:

| Pace | Limit | Fast window | Could score 1.0 | **Could be answered at all** |
|---|---|---|---|---|
| Relaxed | 30 s | 15 s | 27% | 100% |
| **Standard** | **20 s** | **10 s** | **3%** | **54%** |
| Exam pace | 13 s | 7 s | 0% | 19% |

The median DP-600 question needs **19.6 seconds simply to read and choose**,
against a 20 second budget. So nearly half the bank was unanswerable, and 97
percent of correct answers were quietly marked down to 0.6.

That lands exactly on the boundary the report describes, against an evenly
matched defender:

```
score 0.6 -> attack 18.8 vs 10 ->  77 damage -> survives with 23 -> dies on the SECOND fight
score 1.0 -> attack 26.0 vs 10 -> 126 damage -> capped at 100     -> dies on the FIRST
```

One blow or two, decided by a stopwatch that was measuring how fast somebody
reads English.

#### 34.2 The fix

The clock now has two halves and only one of them is graded:

- **Reading time is granted free**, computed from that question's own word
  count at 200 words per minute, which is the low end of adult silent reading
  and the right end for prose that is deliberately about a distinction the
  reader is unsure of.
- **Thinking time is the budget and the thing scored.** The app's constants are
  now thinking budgets: battle 14 s, research 22 s.

After: **100% answerable and 100% able to earn the bonus when the answer is
known**, at every pace, on both banks.

#### 34.3 ⚠️ What this was really about

A shared flat clock grades **literacy, not knowledge**, and this is a study
aid. A long question about Direct Lake and a four-word sum for a six-year-old
cannot share a stopwatch: the Klasse 1 bank scored 100 percent fast while
DP-600 scored 3 percent, on the same timer, and the difference was sentence
length. A good share of the people this is built for are reading in a second
language, and quietly marking them down for it measures the wrong thing.

#### 34.4 Decisions

| ID | Decision | Why |
|---|---|---|
| D269 | ⚠️ **Reading time is granted; only thinking time is scored** | The clock must measure hesitation, not literacy. A slow reader who knows the answer now scores exactly what a fast reader who knows the answer scores, which is the only defensible behaviour for a study tool |
| D270 | The allowance is per question, from its own length | One number for all of them is what produced a bank where 97 percent of correct answers were marked down and a child's bank where none were. Length is the variable, so length is what the allowance follows |
| D271 | ⚠️ **The damage curve was deliberately NOT changed** | The obvious response to "enemies do not die" is to make weapons hit harder. That would have buried the real cause under an unplaytested balance change days before a deadline, and it would have been wrong: the numbers were right and the input to them was corrupt. Pinned by a test that asserts parity damage is still 30 |
| D272 | ⚠️ **An automated repro could not have found this** | `answerOpen` answers in milliseconds, so a robot always scored 1.0 and always saw the enemy die. The bug only existed for humans. The evidence had to be a measurement of the bank's reading time, not a browser run, and that is worth remembering the next time a report cannot be reproduced |

#### 34.5 Verified

- 776 tests, 18 new. `learn/test/clock.test.ts` asserts that **every** question
  in both banks can be answered and can earn the bonus when known, which is
  the guard that was missing: the entire suite stayed green through this bug.
- `engine/test/firstBlow.test.ts` pins the arithmetic of the report itself, so
  nobody re-tunes the damage curve chasing a symptom whose cause was elsewhere.

#### 34.6 Open

- 200 words per minute is a reasonable figure, not a measured one. Nobody has
  been timed reading these questions.
- The final exam now gets 45 s of thinking plus reading, around 62 s a
  question. The real DP-600 allows roughly 100 s, so this is still the
  harder end, but it moved and nobody asked for it to.

---

### 35. Ritter: the elite melee units ride

Asked for: *"the fighters are most likely best Ritter or similar stuff."* Built
22 Aug.

#### 35.1 Knights and 1600 are not in conflict

⚠️ The obvious reading of this request breaks D145, which fixed the period at
around 1600 because it is the last moment when fortifying a city was decisive,
and which the bastioned forts, the siege, the Siedlung to Großstadt progression
and the whole pike-and-shot vocabulary all hang off. Moving to the Middle Ages
days before the deadline would mean rebuilding all of it.

It is also unnecessary, because **the armoured horseman did not end with the
Middle Ages.** He became the *cuirassier*: three-quarter plate to the knee, a
closed helm, a lance or a pair of wheel-lock pistols, sometimes a barded horse.
The Thirty Years' War is full of them, and in German he was still called a
Ritter. So the roster gets its knights, and they are **more** historically
correct than the bare-headed riders that were there before.

#### 35.2 It fixed a problem that was already there

Three units share the engine role `melee`, and all three were drawn as one pike
block with more men in it:

| Unit | Strength | Was | Now |
|---|---|---|---|
| Pipeline Runner | 20 | pike block | pike block |
| Semantic Colossus | 45 | the same, more men | armoured lancers |
| Direct Lake Titan | 60 | the same, more men | armoured lancers, barded horses |

So a player's two most powerful units looked exactly like the one they started
with. The split is on **strength**, not on unit ids, so a campaign that invents
its own roster inherits the same hierarchy. It is also how those armies really
worked: infantry held ground with the pike, and the decisive arm was horse.

#### 35.3 Decisions

| ID | Decision | Why |
|---|---|---|
| D273 | ⚠️ **Ritter as cuirassiers, inside 1600, rather than moving to the Middle Ages** | Gives the request what it actually wants without touching the period that the forts, the siege and section 33 are built on. The armoured horseman of 1600 is a knight by any ordinary meaning of the word, and drawing him is more accurate than what was there before, not less |
| D274 | The foot and horse split is by strength, not by unit id | The engine's roles do not distinguish a line unit from an elite one, and hard-coding three names would leave any future campaign's roster back where this started |
| D275 | A lance is carried couched, a pike upright | The contrast is the whole reason for drawing both. A hedge of vertical shafts says infantry holding ground; a row of horizontal ones says a charge. At map zoom that difference in direction survives when no detail does |
| D276 | Barding is reserved for the single heaviest stand | Ruinously expensive and already rare by 1600, which makes it exactly the right way to say "this is the most frightening thing you own" without breaking D244 by drawing it bigger |
| D277 | ⚠️ **Armour still does not make a man taller** | D244 again, and it needed a test of its own here: a knight is better equipped, not larger, and a mounted man sits higher only by the height of the horse. All three melee stands finish within five centimetres of each other because the tallest thing on any of them is the colours it carries |

#### 35.4 A bug found while photographing this

⚠️ **Escape skipped one beat of the opening, not the opening.** `cinema.skip()`
ends the current shot, and section 32's sequence plays four in a row, so a
player pressing Escape watched the next beat begin and had to press it four
times. Nobody reads that as "skip"; they read it as ignored. Found because a
screenshot script pressed Escape once and photographed the title sequence
instead of the units. Now a single press abandons the whole opening.

#### 35.5 Verified

- 780 tests, 4 new: the heavy units draw more than the line unit and the Titan
  more than the Colossus; all three stay inside their tray; all three remain
  the same height; and every knight carries the faction colour in more than one
  place, so losing any single one does not make the stand anonymous.
- Photographed at three distances. Foot, horse and barded horse are
  distinguishable at the zoom the game is played at.

---

### 36. Two languages, one switch

Asked for: everything bilingual German and English, with an easy switch. Built
22 Aug. This is D214, which had deliberately deferred the i18n pass until after
1 September because it "touches every file the DP-600 submission depends on".
That deferral is overridden; what follows is how it was done without the risk
the deferral was protecting against.

#### 36.1 ⚠️ Translations are keyed by the English string itself

`t('End turn')`, not `t('hud.endTurn')`. The English text is both the key and
the fallback, so a string with no German behind it renders as itself.

That is a risk decision rather than a tidiness one. A conventional key
namespace means naming 250 strings, touching every call site twice, and showing
a player a raw `hud.endTurn` the first time somebody mistypes one. Here the
worst failure is a sentence that stays English, which is what it did before, so
**the game is shippable at every point during the translation** rather than
only at the end. Ten days before a deadline that is the difference between
doing this and not doing this.

The cost is real and worth writing down: **editing an English string silently
orphans its German.** A test finds entries that were never written and nothing
can find one that used to match.

#### 36.2 What is deliberately NOT translated

| | Why |
|---|---|
| **The 123 DP-600 questions** | The exam is sat in English and its terminology *is* the subject. Somebody who revises "Direktsee" has learned a word that will not be on the paper. The answers are hashed and the explanations encrypted, so it would also mean rebuilding the content pipeline |
| **The exam outline headings** | "B1 Get data", "C2 Optimize enterprise-scale semantic models" are the published skills outline. They are the thing being learned |
| **Fabric product terms** | Compute, CU, Lakehouse, Warehouse, Workspace, Direct Lake. Names, not words. A German Fabric user says them in English |
| **Unit names** | Pipeline Runner, Query Slinger, Notebook Cannon, Direct Lake Titan are jokes built on that terminology |
| **Faction names** | The Silo Horde, The Flat Table Cult. Proper nouns |
| **The Latin titles** | They are the words of the anthem and the same in every language, which is the whole reason the film is in Latin (D255) |

The Klasse 1 bank stays German for the mirror reason: a six-year-old is
learning German, and an exam candidate is learning English terms.

#### 36.3 The switch

A **DE / EN** button in the resource bar. It shows the language it will switch
**to**, not the one you are reading, because a button labelled with the
language already on screen looks like a status badge and nobody presses status
badges.

The choice is remembered, and a browser set to German gets a German game
without being asked. Switching repaints the static shell and asks every panel
to redraw from state, so nothing has to be hunted down individually.

#### 36.4 Decisions

| ID | Decision | Why |
|---|---|---|
| D278 | ⚠️ **Key by the English string; English is always the fallback** | Section 36.1. Makes a partial translation a shippable state rather than a broken one, which is what allowed a 250 string pass this close to the deadline |
| D279 | The engine keeps English labels; the app translates on the way to the screen | Avoids adding a second field to six engine interfaces, and means the engine has no opinion about languages at all. Settlement ranks are the one exception, because `label` and `labelDe` were deliberately put on one row so they could not drift (D263), and copying that German into a catalogue would undo exactly that |
| D280 | ⚠️ **Exam content stays in its exam language** | Section 36.2. Translating the questions would teach vocabulary the paper does not use, which is the opposite of what a study aid is for |
| D281 | The button shows the language it switches to | An "EN" button while reading English is a label. A "DE" button while reading English is an offer |
| D282 | The log is not retranslated when the language changes | Entries are a record of what happened, and what happened happened in the language it was said in. Retranslating history would also mean storing every line's placeholders instead of its text |
| D283 | ⚠️ **Anything written from code must be translated in code** | The council button carries a `data-i18n` tag and is also rewritten on every state change, so the tag was overwritten within a frame of the switch. Static markup and dynamic text need different treatment and the failure looks identical |

#### 36.5 Verified

- 791 tests, 11 new. The coverage test scans the source for every literal
  handed to `t()` and fails if any of them has no German, so a gap is a red
  test rather than a sentence nobody noticed. Others assert that an unknown
  string falls back rather than breaking, that placeholders survive
  translation, that no German entry is just the English again (with an explicit
  allow-list for "Land" and "Standard", which really are the same word), that
  the exam vocabulary is untouched, and that the German uses real umlauts and
  no em dashes.
- Driven in the browser: the shell's visible text was read in both languages
  and diffed. Everything that did not change is on the intentional list above.

#### 36.6 Open

- Roughly 250 strings are covered, and the ones reachable only from rarer
  screens (the Great Library, the end screen, the cheat console, the siege)
  are wrapped but only lightly reviewed for tone.
- German is longer than English, typically by 10 to 30 percent. Nothing has
  been checked for overflow in narrow panels at the smallest window size.
- A stale English edit orphans its German silently. Worth a check that compares
  the catalogue against the source on every build, which does not exist yet.

---

### 37. Bring your own questions

Asked for: a way to customise the learning experience with a sample file to
download and a file to upload, "maybe one Excel file", and a pointer at
Campus-Scheduler. Built 22 Aug.

This is the change that makes the project a study aid **that happens to ship
with DP-600 in it**, rather than a DP-600 study aid. Download the sample,
replace the rows, upload it, and it becomes a playable course.

#### 37.1 What was taken from Campus-Scheduler

Its availability panel does the same shape of thing, and two lessons came
across. One is the flow: **upload, then look, then decide.** The file is never
applied on being chosen. The other is written in its own source and is the
better half:

> *"The preview used to report only how many cells differ. Measured on the live
> app, a sheet blocking four slots the lecturer teaches in previewed as
> '4 changes' and said nothing about the four lectures it was about to
> invalidate. **A count of edits is not a description of consequences.**"*

So the preview here says how many questions, across which topics, which rows
could not be used and why, which rows are worth a second look, and which
columns were ignored, each with **the row number Excel shows**.

⚠️ What could not be taken is the implementation: Campus-Scheduler parses the
workbook server-side at `POST /api/availability/import`, and this game is a
static page with no backend. All of it happens in the browser.

#### 37.2 The columns

`topic · question · answer · wrong1 · wrong2 · wrong3 · explanation`

Only `topic`, `question`, `answer` and one wrong answer are required. Two
options is a real question, and demanding four would reject a true/false bank,
which is the likeliest thing a teacher brings first.

The sample is **filled in, not blank**, because a template of bare headers
makes somebody guess what belongs in a cell. Its examples are capital cities
and times tables, deliberately nothing to do with Fabric, so nobody mistakes
them for exam content and revises them.

#### 37.3 Decisions

| ID | Decision | Why |
|---|---|---|
| D284 | Real `.xlsx`, both directions, and `.csv` accepted too | Measured before committing: `read-excel-file` plus `write-excel-file` cost **145 KB raw, 43 KB gzipped** on a 383 KB gzipped bundle. Paid because a customisation feature that only accepts a format people cannot easily produce is not customisation. CSV is accepted as well so a phone, Sheets, Numbers or a text editor can write a course |
| D285 | ⚠️ **`xlsx` (SheetJS) rejected on security grounds** | Its npm package is frozen at 0.18.5 because the maintainers moved distribution to their own CDN, and that version carries CVE-2023-30533, a prototype pollution flaw. Not something to put in a repository about to be made public |
| D286 | ⚠️ **An imported question goes through the same hashing and encryption as a shipped one** | There is nothing to protect in somebody's own file, so this looks like pointless work. It means an imported question is the same shape as a built one, so `checkAnswer`, `revealCorrectAnswer` and `decryptExplanation` need no idea where it came from and there is no second code path to keep correct |
| D287 | An upload is a `role: 'questions'` campaign | The same exemption that lets a 24-skill Year 1 curriculum sit opposite a 41-topic certification (D236, D237). A file with nine questions in it is as valid as one with nine hundred, and the world still comes from a world-capable course |
| D288 | The whole course is persisted, questions included | The alternative is remembering a file name and asking for the file again, which is what most import features do and is why most of them get used once. A reload should not lose somebody's curriculum |
| D289 | The parser takes a grid, not a file | What a row MEANS is worth testing and has nothing to do with `.xlsx` or `.csv`. `previewBank` takes `string[][]`, so 22 tests cover the rules without a browser, and the file formats are a thin adapter |
| D290 | Semicolons are separators too | A German Excel writes CSV with semicolons, because the comma is its decimal separator. A file that opens perfectly on the machine that made it would otherwise arrive as one enormous single column |

#### 37.4 ⚠️ Two silent failures, both from a library's version 4

Neither threw anything, and that is what made them expensive.

**The writer.** Version 3 took a `fileName` option and saved the file itself.
Version 4 ignores that and returns `{ toBlob, toFile }` instead. The version 3
call therefore resolved successfully, returned an object that is not a Blob,
and downloaded nothing. The button was clicked, the handler ran, the promise
resolved, and the browser did nothing at all. It was only found by calling the
function directly from the page and reading the exception from
`URL.createObjectURL`.

**The reader.** It resolves to rows with no options and to `{ sheet, data }[]`
with some, and the code assumed the first. That one surfaced as "that file
could not be read", which is a message that describes the symptom perfectly
and the cause not at all.

The panel now logs the underlying error to the console while showing the plain
message, so the next one is diagnosable without a debugger.

#### 37.5 Verified

- 813 tests, 22 new, all on the grid rather than on files: row numbers match
  what Excel shows, an answer duplicated as a wrong answer is caught, a missing
  explanation warns rather than rejects, unknown columns are reported, and an
  imported question's answer verifies against the same `checkAnswer` the
  shipped bank uses.
- **Round-tripped in a real browser**: the sample was downloaded (3,149 bytes),
  uploaded back, previewed as 3 questions across 2 topics with no problems,
  applied, persisted, and then played. In the two-player game seat one was
  asked a DP-600 question about a nightly load while seat two was asked
  "What is 7 times 8?" from the uploaded file.

#### 37.6 Open

- Every imported question is tier 1 and type `mcq`. There is no way yet to
  bring a multi-select or a harder question, and the columns have no room for
  either.
- Nothing limits the size of an upload. A very large file would be parsed on
  the main thread and would block it.
- The importer trusts the file's own topic names as skill labels, so a typo
  makes a second topic. The preview lists the topics it found, which is the
  only defence and is probably enough.

---

### 38. Two editions, and a coach that reads your progress

Asked for: two versions, one playable on Fabric capacity and one without, and
the capacity one to have a Foundry chat window for asking how the learning is
going and what still needs work. Built 22 Aug.

The two editions were already the plan. D37 promised "a static GitHub Pages
build ships alongside the Fabric App, so the game is playable even when the
capacity is paused", and D38 put the Fabric App first with Pages as the
fallback. What did not exist was any difference in the code, or the coach.

#### 38.1 One bundle, two hosts

There is no build flag and no second bundle. The app asks the host, once, in
the background, whether `api/coach` exists:

| | Host | Advice | Chat |
|---|---|---|---|
| **Standalone** | any static server, Pages | yes | no |
| **Capacity** | `tools/coach/server.mjs`, a Fabric App, a Container App | yes | yes |

`npm run serve:standalone` and `npm run serve:capacity` are the same `app/dist`.
Nothing waits for the probe: the game is fully playable while it is in flight,
and a boot that blocked on a network call would make the capacity edition
slower to start than the free one, which is backwards.

#### 38.2 ⚠️ There is no API key in the browser, and there cannot be

A static page cannot hold a secret. Anything in the bundle is readable by
anyone who opens the app, so an Azure AI Foundry key placed there would be a
published key, and this repository is headed for public.

So the browser calls a **same-origin route** and the host holds the credential.
`tools/coach/server.mjs` is the reference host: it serves the built game and
answers `api/coach`. It prefers a managed-identity token over a key when both
are present, caps the request body, and logs upstream errors rather than
returning them, because an Azure error body can name the resource.

With nothing configured it still runs and still serves the game; the probe
answers `{ coach: false }` and the app stays in its standalone shape. A
misconfigured deployment degrades to the working game rather than to an error.

#### 38.3 ⚠️ The advice is arithmetic, not a model

The obvious way to build a study coach is to hand a model the raw records and
let it decide. Then nothing can check what it says, it can invent a topic that
is not on the exam, and the free edition has no advice at all.

So the ranking lives in `learn/src/coach.ts`, in arithmetic:

```
priority = exam weight of the branch  ×  how far the band is from safe  ×  1.6 if due
```

Weighted by the **published exam weighting**, not by skill count: twelve
unlearned skills in a branch worth 20 percent of the paper matter less than
five in a branch worth 45, and a coach that counts skills sends a candidate to
spend their last evening in the wrong place. Being due is worth more than being
merely weak, because a decaying topic is work already done that is being lost.
And `strong` is not worth zero, because a coach that reports a subject as
finished is teaching the wrong lesson about memory in a game that *is* the
lesson.

Every suggestion carries a sentence saying why, so it can be argued with.

The chat is then a conversational interface over exactly that digest. Both
editions give the same answer to "what should I work on"; only one lets you ask
follow-up questions about it.

#### 38.4 What leaves the machine

Only aggregates and published outline labels: how well each exam skill is held,
what is due, and the ranking. No question text, no answers, no ciphertext,
nothing about the person. Sent as prose rather than JSON so a human can read
exactly what was sent, and tested.

#### 38.5 Decisions

| ID | Decision | Why |
|---|---|---|
| D291 | ⚠️ **One bundle; the edition is discovered at runtime, not built in** | Two builds means two things to test and one of them being stale. Probing a route means the same artefact is the Pages fallback and the Fabric App, which is what D37 and D38 already promised |
| D292 | ⚠️ **Brokered through a same-origin route; no key in the browser, ever** | A static page cannot keep a secret. The alternative, a key pasted into localStorage, is fine on one machine and wrong the moment a URL is shared, and this repository is going public |
| D293 | ⚠️ **The ranking is deterministic and shipped in both editions** | So it can be tested, so the free edition is the same game without a chat rather than a worse game, and so the model has something to be grounded in instead of an opinion to invent |
| D294 | Weighted by published exam weight, never by skill count | The difference between a useful last evening and a wasted one |
| D295 | Due beats equally weak but not due | Recovering something slipping is cheaper than learning something new: the work is done and is what is being lost |
| D296 | ⚠️ **The model is told it may not claim the learner is ready** | D205 in a new place. A model saying "you are ready to sit DP-600" would be acted on, and only the readiness figure is entitled to make that claim. It is also told not to substitute its own ranking, so the chat and the list on screen cannot disagree |
| D297 | The probe requires a JSON body, not just a 200 | Static hosts answer 200 for unknown paths by serving `index.html`, so "the route replied" is not evidence the route exists |
| D298 | The system prompt is duplicated in the server, deliberately | The host must run against a built `dist` with no workspace around it. A server that cannot start because a TypeScript package moved is a worse failure than a prompt that has to be copied when it changes |

#### 38.6 Verified

- 830 tests, 17 new, all on the ranking rather than on a model: exam weight
  beats skill count, due beats not-due **within the same branch**, a solid
  topic stops being recommended, nothing is ever priority zero, and the digest
  contains no stem, no answer hash and no ciphertext.
- Both editions driven in a real browser against the **same `app/dist`**. The
  advice and its reasons are identical in both; the chat is hidden in the
  standalone one and answered a question in the capacity one.
- A stub standing in for Foundry confirmed what actually arrives: the correct
  Azure OpenAI URL and api-version, credentials present, the system prompt and
  the digest as two system messages, the ranking included, the question, and
  2,027 characters in total.

#### 38.7 Open

- ⚠️ **The two failing tests I wrote first were both my own mistakes**, and one
  is worth keeping in mind: comparing a due topic in a 28 percent branch
  against an unseen one in a 48 percent branch, and expecting due to win. It
  did not, correctly. Weight dominates, which is the whole design.
- The leak test cannot check answer options. Some options are phrased exactly
  like the outline bullet they were written from, so "Real-Time hub" appears in
  the digest as a published skill label and in a question as a distractor. That
  is an overlap in the source material, not a leak, and a test that cannot tell
  them apart would have to be weakened until it caught nothing.
- No real Foundry deployment has been called. Everything above is against a
  stub that speaks the same shape.
- The conversation is not persisted and is lost on reload.

---

### 39. A score that runs under the game

The opening got an anthem in section 32, and then the game went back to
silence for however many hours a player spends in it. This adds a background
score: several tracks, shuffled, with a button to turn them off.

#### 39.1 ⚠️ Instrumental, and that is a decision about studying

The anthem sings. Everything added here does not, and the reason is not taste.

This game asks the player to **read exam questions under a clock**. Speech and
sung words interfere with reading comprehension even when the listener is
ignoring them and even when the words are in a language they do not speak,
which is why open-plan offices are measurably worse for text work than noisy
ones. A soundtrack with a Latin chorus over it would therefore make this tool
worse at the one job it has, while sounding more impressive in a demo.

So the split is by what is on screen. The anthem plays over a title sequence
with **nothing to read**, once, and it is the better piece for it. The score
that runs for the next two hours sits under text, and it keeps its mouth shut.

This is also the reading I made of "maybe a bit less text": fewer words in the
music, not fewer tracks.

#### 39.2 The playlist

Shuffled, with seven seconds of silence between tracks, reshuffled at the end
of each pass. Two things in that sentence were not free.

The gap is not zero. An unbroken wall of orchestra for two hours is more
tiring than the same music with air in it, and the gap is the only moment a
player can tell that this is a playlist rather than one very long loop.

⚠️ **A plain reshuffle repeats.** With three tracks, a fresh shuffle puts the
track that just ended straight back on about a third of the time, and nobody
hears that as chance: they hear it as a bug. `nextRotation` swaps the first
entry away from whatever just played, and the test walks 200 seeds rather than
trusting one.

Every track carries a **mood** (`calm`, `tense`). Nothing reads it yet. It is
recorded now because the alternative to writing it down while the track is
being made is listening to six files in a fortnight and guessing, and because
music that follows the game state becomes a scheduling change rather than a
regeneration if the tags already exist.

#### 39.3 ⚠️ Choosing between takes without listening to them

Suno returns several takes per prompt. Picking by ear does not scale to eight
tracks and does not leave a reason behind, so the four takes were measured
with ffmpeg in ten second buckets: length, mean level, the spread of those
buckets, and how the first and last three seconds compare to the body.

| take | length | mean | spread | head | tail |
| --- | --- | --- | --- | --- | --- |
| ferrum-a | 194 s | −15.7 dB | 1.48 | −2.1 | **−3.2** |
| ferrum-b | 260 s | −15.6 dB | 3.19 | −7.4 | −22.6 |
| terra-a | 210 s | −14.7 dB | 1.78 | −1.3 | −26.3 |
| terra-b | 232 s | −16.3 dB | 1.97 | −5.6 | −36.8 |

The decisive column was the **tail**, which is not what I expected to matter.
`ferrum-a` is the most even take of the four and would have been the obvious
pick on level alone, but it is still at full volume when it ends: it stops
dead, and a hard cut into seven seconds of silence sounds like the player
crashed. `ferrum-b` fades in and out, runs a minute longer, and its wider
spread is a build, which is what a tense cue is supposed to do.

The two calm takes are, honestly, **the same take on every measure that
matters**: 0.19 dB apart on spread, 0.5 dB on range, which is inaudible.
Refusing to invent a difference there, the tie went to the one that is 22
seconds longer and fades in as well as out.

#### 39.4 Silent by default, and that is the tested state

The files are not in the repository, for the reason the anthem's are not: they
were generated on a free plan whose output is licensed for non-commercial use,
which has no business attached to a public repo. See NOTICE.

⚠️ So **the state every clone and every CI run is in is "no tracks found"**,
and the feature has to be *absent* in that state rather than broken. A mute
button that throws on a checkout with no audio is a defect nobody working on
this machine would ever see, because this machine has the files. The button is
hidden until the probe has actually found something: a control that visibly
does nothing is worse than no control, because the player presses it, hears no
change, and starts distrusting the rest of the interface.

#### 39.5 The generation schedule

Two constraints, and the second one is the one with a date on it. The free
plan has a daily cap, and **Suno's terms change on 3 September** with new
per-plan download limits. Anything wanted has to exist *and be downloaded*
before then. The challenge closes 1 September.

| day | tracks | mood | what it is for |
| --- | --- | --- | --- |
| 22 Aug | Terra Nostra, Ferrum et Ignis | calm, tense | **done** |
| 23 Aug | Aqua Alta | calm | a second bed, so the calm state is not one loop |
| 24 Aug | Turris | tense | siege, heavier than Ferrum |
| 25 Aug | Semina | calm | early game, sparse |
| 26 Aug | Corona | triumphal | promotions, the exam passed |
| 27–31 Aug | slack | — | rejects, re-rolls, nothing |

Six to eight tracks, one or two a day, with five days of slack for takes that
come back wrong. **Every take is downloaded from the CDN the same day it is
generated**, never left in the account to be fetched later, because the
account is the thing whose terms are changing.

Style prompts follow the pattern that worked, so the next run is paste and go:
the 1600 orchestral palette from the anthem, an explicit `no vocals`, a BPM,
and the word `loopable`. The Instrumental toggle is set in the UI as well as
asked for in the prompt, and it is verified (`aria-checked="true"`, and the
lyrics field disappears from the DOM) before pressing Create.

#### 39.6 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D299 | ⚠️ **Every background track is instrumental** | Sung words interfere with reading, and this game is read under a clock. A choral bed would demo better and study worse. The anthem sings because nothing is on screen to read |
| D300 | Shuffled, with a gap, reshuffled each pass | A gap is what makes it a playlist rather than a two hour drone, and the only cue that more than one piece exists |
| D301 | ⚠️ **The next pass never opens with the track that just ended** | With three tracks a plain reshuffle repeats on a coin flip, and a repeat reads as a broken player, not as chance |
| D302 | A mood on every track, read by nothing | Written while the track is being made, when it is free. Guessing it later means listening to six files, and state-reactive music then costs a schedule change instead of a regeneration |
| D303 | ⚠️ **Absent, not broken, when the files are missing** | The same contract as D258. It is also the only state CI ever sees, so it is the state that must be tested hardest |
| D304 | The button is hidden until a track is found | A control that does nothing teaches the player that controls here do nothing |
| D305 | Mute pauses; it does not set the volume to zero | A silent track at volume zero is still being decoded and still costs a metered connection, for no sound |
| D306 | ⚠️ **Takes are chosen by measurement, not by ear** | It scales past two tracks and it leaves a reason behind. It also caught the thing an ear would have argued about: the most even take of the four ends dead and was unusable |
| D307 | The score starts 2.4 s after the opening ends | `fade()` returns immediately and takes 1.6 s to finish, so starting on the same tick puts a background track under the last bar of the anthem |
| D308 | A first-click fallback starts it for resumed games | A resumed empire never plays the opening, so without this the score would exist only for players starting a new game |
| D309 | Music stops when the tab is hidden | The single most common complaint about audio on the web, and four lines to fix |
| D310 | Everything is downloaded the day it is generated | Suno's terms change on 3 September. A track sitting in the account is not a track you have |

#### 39.7 Verified

- 848 tests, 18 new. The shuffle is seeded and checked over 200 seeds rather
  than eyeballed; the no-audio case is tested harder than the audio case.
- ⚠️ One test I wrote was wrong and the fix found a real hole: I asserted a
  failed track is *never* played, when it was of course played once, because
  being played is how the failure is discovered. Correcting the assertion
  exposed that a dropped track could still be sitting in the **pending queue**
  and would come back on the very next gap. Both lists are filtered now.
- Driven in a real browser against the built bundle: both files found, the
  score takes over from the anthem after the opening (`Ferrum et Ignis`), mute
  pauses it, unmute resumes, the preference survives a reload, and the title
  is translated when the language is switched.
- ⚠️ Unmuting came back with **a different track** (`Terra Nostra`), which is
  the no-repeat rotation visible in real behaviour rather than in a test.

#### 39.8 Open

- Four tracks still to generate, and the useful window closes on 3 September.
- The moods are recorded and unused. Music that follows the game state, calm
  while building and tense while besieged, is the obvious next thing and is
  deliberately not in this change.
- Volume is fixed at 0.28 with no slider. The button is on or off. If anyone
  asks for a slider it is easy, and until someone does it is a control to
  maintain and translate for nobody.

---

### 40. The films had no sound

Four cinematics play during a game: the first workspace being founded, first
blood, a city changing hands, and the Proctor arriving. All four played in
**silence**. The opening had an anthem and the map now had a score, and the
one moment in the game that is explicitly cinematic had nothing at all.

#### 40.1 ⚠️ Synthesised, because a file would not ship

The obvious move was four more Suno stingers. It is the wrong one twice over.

Suno writes songs, not four second cues, and getting a clean stinger out of it
is a fight. But the real objection is licensing. Section 39 had to keep the
music **out of the repository** because a free plan licenses its output for
non-commercial use, and that is a fine trade for a background bed nobody
misses. It is a bad trade here: it would mean the cinematics are silent in
every clone except this machine, and the cinematics are the part of the game
people are shown first.

So the cues are built from oscillators at the moment they play. No file, no
licence, no download, and they work in a fresh checkout. That is also just
D59, which this project has kept everywhere else: the terrain, the water, the
sky and every object on the map are already generated at runtime, and the
audio was the one place that had quietly stopped being true.

Four voices are enough: a **bell**, a **drum**, a brass-ish **swell**, and a
low **drone**.

⚠️ The bell's partials are `1, 2, 2.76, 5.40, 8.93`, which is deliberately
**not** a harmonic series. Whole-number multiples sound like an organ; struck
metal rings at inharmonic ratios, and 2.76 in particular is what the ear reads
as "a bell" rather than "a tone". The high partials are also given shorter
lives than the low ones, which is what makes a bell soften as it rings instead
of merely getting quieter.

There is a **convolution reverb**, generated the same way: two and a half
seconds of noise under a cubic decay, which is a convincing stone room in
about fifteen lines. It is the single largest difference between "a
synthesiser" and "a score", and it is why the cues do not sound like a test
tone no matter how they are orchestrated.

#### 40.2 The composition is data, and that is not tidiness

WebAudio does not exist under test. So the synthesis cannot be checked at all
by the suite, and the only part that can be is **which note sounds when**,
which means that part has to be a table rather than a hundred imperative
calls. `CUES` is keyed by the cinematic's id, and every entry says when, what
voice, what pitch, how long and how loud.

The cues have characters, and one of the rules is enforced rather than
described. `first-city` is the only unambiguously major cue in the game: a
bed, then a rising fifth into the octave. The other three get **no bell above
the stave at all**, and there is a test for it, because `first-blood` and
`city-falls` fire whether you won or lost and a bright chime over a city you
have just lost reads as the game congratulating you.

#### 40.3 ⚠️ The test that would have caught this in the first place

Four films shipped silent for weeks. Nothing was broken; nothing anywhere
connected "a shot was added" to "a shot needs a sound", and a person has to be
looking at the right screen at the right moment to notice that something did
not happen.

So the important test in `cues.test.ts` is not about audio. It reads
`main.ts`, finds every `orbitShot`, `descendShot` and `approachShot` in it,
and fails if any of their ids has no entry in `CUES`. It fails in the other
direction too, because a cue for a cinematic that has been renamed is worse
than no cue: it looks like proof that the film has sound.

It also asserts that it found at least four, so the scan cannot pass by
quietly matching nothing.

#### 40.4 ⚠️ "It was scheduled" is not "it is audible"

Every test above passes on a cue that produces **complete silence**. A sign
error in an envelope ramp, a filter cutting everything, a voice connected to
nothing: the table is still correct, the schedule is still correct, and
nothing comes out.

The fix is to render the real code into an `OfflineAudioContext` in a real
browser and look at the samples. That cost one parameter: `createCues` takes a
context factory, so the same graph can be built into an offline context and
measured instead of played.

| cue | peak | RMS |
| --- | --- | --- |
| first-city | 0.371 | 0.0370 |
| first-blood | 0.345 | 0.0322 |
| city-falls | 0.486 | 0.0406 |
| proctor | 0.257 | 0.0321 |
| an id with no cue | 0.000 | 0.0000 |

All four are well clear of the noise floor and well short of clipping, and
their levels sit within a few dB of each other, which for a set of stingers
matters as much as any of them being right on its own.

#### 40.5 Ducking, and one switch

A four second phrase over a background bed at the same level is not a cue, it
is a second piece of music, and the two argue. The score drops to **30 percent
for the length of the film** and ramps back over nine tenths of a second.

⚠️ Not to zero. Cutting the music dead for four seconds and starting it again
draws far more attention to itself than the cue it is making room for.

⚠️ **The duck and the fade-in share one timer**, deliberately. Two would race,
and not in some rare case: a cinematic that starts within a second and a half
of a new track *is* the founding of the first city. With two intervals, one
climbing to full and one pulling down to the duck, the winner would be
whichever happened to tick last.

The button from section 39 now silences the cues as well, and says **sound**
rather than **music** because of it. It is the only audio control in the game,
somebody who presses it wants quiet, and being hit by a gong ten seconds later
because the cinematics are technically a different subsystem would read as a
bug. They would be right.

#### 40.6 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D311 | ⚠️ **Cues are synthesised, never sampled** | A file would have to be gitignored under the same non-commercial licence as the music, which would mean silent cinematics in every clone. Oscillators have no licence and ship |
| D312 | The composition is data; the synthesis reads it | WebAudio does not exist under test, so the schedule is the only part that can be checked, and it can only be checked if it is a table |
| D313 | ⚠️ **A cinematic with no cue fails the build** | This is the actual defect: four films were silent because nothing connected adding a shot to giving it a sound. The test scans `main.ts` in both directions |
| D314 | The scan asserts it found at least four | A coverage test whose regex has rotted passes by finding nothing, and reports success |
| D315 | ⚠️ **Audibility is measured by rendering offline, not asserted** | Every unit test here passes on a cue that emits silence. Peak and RMS from a real browser is the only evidence that the graph makes a sound |
| D316 | Inharmonic bell partials | A harmonic stack is an organ. 2.76 and 5.40 are what the ear hears as struck metal |
| D317 | A generated convolution reverb, ~15 lines | The difference between a score and a test tone, at no cost in assets |
| D318 | ⚠️ **No bright bell on the three dark cues** | `first-blood` and `city-falls` fire whether you won or lost. A high chime over a city you have just lost is the game congratulating you |
| D319 | The score ducks to 30 percent, and does not stop | Silence under a cue is more distracting than the cue |
| D320 | ⚠️ **One timer for fading in and for ducking** | Two would race, and the racing case is the founding of the first city, not an edge case |
| D321 | One switch for all audio, retitled to sound | It is the only audio control there is, and a mute that leaves gongs running is a bug to the person who pressed it |
| D322 | An unknown id is silence, not an error | `playOnce` is handed every shot including the opening's, which has the anthem instead |
| D323 | Losing the sound must never cost the move | A browser with no `AudioContext`, or one that refuses to build one, gets a silent game and a working one |

#### 40.7 Verified

- 866 tests, 18 new across cues and ducking.
- All four cues rendered offline in a real browser: audible, unclipped, and
  level with one another. An id with no cue renders **exactly** zero.
- The founding film driven end to end in a real page: the score went
  `0.280 → 0.084` when the cinematic began and returned to `0.280` when it
  ended, which is the duck depth exactly.
- The ducking ramp is unit tested with fake timers, including the case that
  motivated sharing the timer: a track starting while a film is already
  running comes up **to the ducked level**, not to full.

#### 40.8 Open

- ⚠️ **A fresh clone still opens in silence.** The anthem is a file, so the
  27 second opening has no sound where the mp3 is absent, which is everywhere
  but this machine. Synthesising a fallback cue for the opening when
  `anthem.available` is false would fix it and is deliberately not in this
  change.
- The cinematic titles and subtitles are still not translated. They go
  straight to the overlay without passing through `t()`, which predates this
  work.
- The cues do not vary. `city-falls` sounds the same whether the city was won
  or lost, though the subtitle already knows which it was.
- Still no volume control, only on and off.

---

### 41. Photoreal, measured against a photograph

The ask was to make the game look more photoreal and more cinematic, using
Sora 2 if it helped. It helped, but not in the way it was meant to: its value
was as a **measuring stick**, not as a source of pictures.

#### 41.1 The renderer was already good, which is why guessing would have failed

It would have been easy to start adding effects. The renderer already has ACES
tone mapping tuned against a measured histogram, a scattering sky, a PMREM
environment, soft shadows, ground-truth ambient occlusion, bloom and SMAA. A
list of impressive-sounding additions would have cost frame time and changed
the picture without anybody being able to say whether it had improved.

So nothing was changed until there was something to compare against.

#### 41.2 ⚠️ Anchoring Sora on the game's own frame was the wrong idea

The first attempt handed Sora 2 a frame from the game as an input reference,
reasoning that a photoreal version of the *same composition* would make the
comparison exact.

It came back in **the game's own style**: the same low-poly hexes, the same
palette, with more trees on them. Anchoring preserved the look rather than
replacing it, which in hindsight is what an image reference is for.

That made it useless as a target, and the useful lesson is that it was useless
in a way that would have been easy to miss: the output was plainly *nicer*
than the input, and grading towards it would have felt like progress while
measuring the game against a slightly better copy of itself.

The reference that worked was generated with no anchor at all: an aerial of
real country of the same kind, and nothing of the game in the prompt.

#### 41.3 What the measurement actually said

Three frames of each, so a number that moves with the framing could be told
from one that does not.

| | game | photograph | ratio |
| --- | --- | --- | --- |
| mean saturation | 0.433 | 0.245 | 1.77× |
| darkest 5 percent | 0.193 | 0.072 | 2.7× |
| saturation kept at distance | 0.92 | 0.68 | no atmosphere |

The first two say the game was nearly twice as colourful as a photograph and
had **no true blacks in it at all**, only dark greys, which is the colour of
fog on a lens.

The third one is the interesting one, because it had a cause.

#### 41.4 ⚠️ The atmosphere existed, was tuned, and did nothing

`scene.fog = new Fog(colour, 150, 900)`. It reads as deliberate. Somebody
chose those numbers, and there is a comment above it explaining that fog which
reaches the player's tiles stops being atmosphere and becomes a white sheet,
which is true and well argued.

The map is about **78 units in radius**. The entire playable world sits inside
that fog's near plane. It had never applied a single unit of haze to anything,
and that is precisely why the game kept 0.92 of its saturation from the
foreground to the horizon.

This is the most dangerous shape a defect can take. It is not a wrong number,
it is a **plausible number expressed in a unit the world never reaches**, sat
under a correct comment, in code that looks tuned. Nothing is broken, nothing
logs, and the feature it describes simply does not exist.

It is now `FogExp2`, which is what air actually does and has no visible start,
at a density that leaves the tiles under the cursor alone and hazes the far
shore. The colour changed too: the old one was a mid blue at lightness 0.44,
which *darkened* the distance rather than washing it out, and dark distance
reads as an approaching storm rather than as depth. Haze is scattered
skylight, so it is pale.

#### 41.5 ⚠️ The measurement refuted my own eyes, and I dropped the change

Looking at the frames, the obvious remaining problem was the trees: identical
cones, stamped across flat green. The plan was to vary them.

Measured local variance says otherwise. Ground detail came out at **0.0446**
for the game against **0.0168** for the photoreal aerial. The game carries
**2.7× more** local detail than a real photograph of countryside does, not
less. Real landscape from above is far smoother and far more uniform than
intuition says.

Adding tree variation would have moved the picture *away* from photographic
while feeling like an improvement the whole time. It was not done.

The same thing happened twice more in miniature. Magenta patches at the
horizon looked like a rendering bug; they are the **corruption mechanic**,
deliberately sour green against hot magenta so corrupted ground cannot be
mistaken for a shadow. And a checkerboard artefact on the water that I
suspected I had caused by swapping the fog type turned out to be **identical
in the before frame**, so it was pre-existing and not mine.

Three visual reads, three wrong. That is the argument for the whole approach.

#### 41.6 The grade

Tone mapping is not a grade: ACES decides how a bright scene is squeezed into
a screen, not what the picture should look like once it is there. A final
shader pass answers the second question, driven by the numbers above:
saturation down, contrast up about a pivot near the measured median, a black
point, a modest vignette, and grain.

⚠️ It runs **after SMAA**. Contrast and saturation would be happy anywhere
after tone mapping, but grain placed before the antialiasing pass is grain the
antialiasing pass then smooths away, leaving the cost and none of the effect.

⚠️ The targets are approached, not matched. The photographic reference is a
low sun over dark heath with a median luminance of 0.185, and a game graded to
that is a game nobody can read. The numbers give direction and magnitude and
stop the dials being set by whoever looked at the screen last.

Cinematics get the same grade leaned further, not a different one: deeper
vignette, a little more contrast, walked over about half a second rather than
cut, because a grade that snaps is a cut and the films are meant to be one
continuous move.

#### 41.7 ⚠️ What it costs, measured properly

The first frame-cost reading was **26.8 ms**, which looked like a disaster
against a 4.10 ms baseline recorded earlier in the session.

Both numbers were real and comparing them was meaningless. The 26.8 ms was a
`requestAnimationFrame` delta, which includes vsync idle and compositing; the
4.10 ms was the app's own sync-plus-render span at a smaller viewport. Two
different quantities, on two different framings.

The honest version is an A/B on the same machine, viewport and seed, taken
minutes apart by stashing the change:

| | median | p95 |
| --- | --- | --- |
| baseline | 5.90 ms | 8.80 ms |
| with the grade and the new fog | 6.00 ms | 7.30 ms |

**0.1 ms**, in a 16.7 ms frame. Had I not re-measured, this section would have
claimed a 46 percent regression that never happened.

#### 41.8 Results

| | before | after | photograph |
| --- | --- | --- | --- |
| mean saturation | 0.433 | **0.306** | 0.245 |
| darkest 5 percent | 0.193 | **0.156** | 0.072 |
| saturation kept at distance | 0.92 | **0.73** | 0.68 |

The atmosphere gap is **79 percent closed**, which is the one that carries the
sense of scale. Saturation and blacks moved most of the way and were
deliberately not taken to the photograph's values, for the legibility reason
above.

#### 41.9 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D324 | ⚠️ **Sora 2 is a measuring stick, not a source of pictures** | Nothing it generated ships. Its job was to say how far from photographic the renderer was, in numbers, so the dials had a target instead of an opinion |
| D325 | ⚠️ **Do not anchor the reference on a frame of the game** | It preserves the style and returns a prettier copy of what you already have. Grading towards that measures the game against itself and feels like progress |
| D326 | Three frames of each, not one | Tells a difference that survives the framing from one that is an artefact of it. One metric was contaminated and this is how that was found |
| D327 | ⚠️ **Haze is `FogExp2` and its reach is tested** | The old linear fog was tuned in units the map never reaches, so a correct-looking, well-commented line delivered nothing. The test asserts haze at the far shore, and would fail if the old setting returned |
| D328 | Pale, weakly saturated haze | The old fog colour darkened the distance instead of washing it out. Dark distance reads as a storm, not as depth |
| D329 | The grade runs after SMAA | Grain before antialiasing is grain that gets smoothed away: full cost, no effect |
| D330 | Contrast pivots on the measured median, not on 0.5 | Pivoting on 0.5 darkens everything as a side effect of adding contrast |
| D331 | ⚠️ **The photographic targets are approached, not matched** | The reference has a median luminance of 0.185. A game graded to that is unreadable, and this is a study aid before it is a picture |
| D332 | ⚠️ **Tree variation was measured, then not done** | The game already carries 2.7× more local detail than a real aerial. The change would have moved it away from photographic while looking like an improvement |
| D333 | Cinematics get the grade leaned, not replaced | A film that looks like a different game is a cut, not a shot |
| D334 | The blend is walked and clamped | A slow machine delivers one huge frame delta; an unclamped blend sails past and leaves the game permanently graded like a film |

#### 41.10 Verified

- 879 tests, 13 new. They do not check that the picture looks better, because
  a shader is not inspectable and beauty is not a unit test. They check the
  thing that actually went wrong: that the haze **reaches the far side of the
  world**, that it leaves the tiles under the cursor alone, and that the blend
  cannot overshoot.
- One test states the old bug as arithmetic rather than as a comment: the
  previous linear fog delivers exactly `0` haze at the far shore.
- Frame cost A/B by stashing the change: 5.90 ms → 6.00 ms median.
- Captured during the opening, because that is the only moment the fog of war
  is lifted and the terrain is actually visible rather than a grey lid.

#### 41.11 Open

- ⚠️ **The grade is global.** It cannot know that the corruption magenta is a
  gameplay signal rather than a colour, so desaturating the picture
  desaturates that too. It still reads clearly, but a mechanic that depends on
  colour and a pass that removes colour are in tension and the tension is now
  in the code.
- No depth of field. It was scoped to cinematics only and then not built:
  the atmosphere fix delivered most of the depth cue for none of the cost.
- The water still shows a faint checkerboard at grazing angles. Pre-existing,
  confirmed identical before the change, and untouched.
- The reference is one generated aerial, not a corpus. Three frames of it are
  enough to spot a 1.77× difference and not enough to trust a 5 percent one.

---

### 42. A fortified unit could never get up again

Asked as a question: *if I fortify a soldier, can I still wake him, or is that
a bug?* It was a bug, and it had been one since fortifying was written.

#### 42.1 Three correct decisions that deadlocked

Every piece of it is defensible on its own, which is exactly why it survived.

1. `fortifyUnit` sets `movesLeft: 0`. Correct: digging in should cost the rest
   of your turn.
2. The refresh phase gave a fortified unit `0` movement every turn, so it would
   not appear in the "units still to move" nag. A reasonable goal.
3. `moveUnit` clears the `fortified` flag, so being ordered elsewhere wakes
   you. This is the documented rule and the first thing any 4X player tries.

Put together they deadlock. **`moveUnit` rejects a unit with no movement six
lines before it reaches the line that would have cleared the flag.** A
fortified unit therefore never had the movement it needed to trigger its own
wake-up. The only thing on the entire map that could clear the flag was
`sack.ts`, where being raided by an enemy knocks a unit out of its position.

So the wake-up path was real, was correct, and was **unreachable**. Fortifying
a soldier removed it from the game.

#### 42.2 ⚠️ The redundant line was the load-bearing one

The fix is to delete a condition rather than to add machinery, because point 2
above was **already true without it**:

```ts
export function idleUnits(state, factionId) {
  return [...state.units.values()].filter(
    (u) => u.factionId === factionId && u.movesLeft > 0 && !u.fortified,
  );
}
```

`idleUnits` filters on `!u.fortified` independently. The nag never needed the
movement to be zero, and nothing else read it either: the defence bonus in
`combat.ts` keys off the flag alone, and the antagonists never fortify. The
refresh phase now hands every unit its movement, fortified or not.

#### 42.3 ⚠️ A test was holding the bug in place

`turn.test.ts` had this, named *"leaves fortified units dug in rather than
waking them up"*:

```ts
expect(next.units.get(scout.id)!.fortified).toBe(true);
expect(next.units.get(scout.id)!.movesLeft).toBe(0);
```

The first line is the design. The second is the defect, **written down as
though it were the design**, which is the most effective way there is to
preserve one. The name gives it away on a second reading: staying dug in is a
statement about the flag, and the flag is asserted on the line above.

It now asserts the movement is restored *and* that the unit still does not
nag, which is what the old behaviour was actually for.

#### 42.4 The button said there was no way back

`el.actFortify.disabled = type.strength === 0 || unit.fortified` — fortify,
then grey yourself out. For a long time that was an accurate description of the
situation. Even with the engine fixed it would have been misleading, because an
action that has visibly disabled itself is not an invitation to try moving.

It is now one button that reverses: **Fortify** becomes **Wake**
(*Befestigen* / *Aufwecken*), with a title that says what it will do next.
`wakeUnit` stands the unit down without moving it, for the case where you want
to attack out of a position rather than hold it.

⚠️ **Waking does not refund the turn spent digging in.** Fortifying costs the
rest of that turn; changing your mind on the same turn leaves you with the
nothing you just spent. Otherwise fortify-then-wake is a free movement reset
for a unit that had already walked.

#### 42.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D335 | ⚠️ **The refresh phase gives fortified units their movement** | Without it, the documented wake-up (`moveUnit` clears the flag) can never execute, and the unit is stranded for the rest of the game |
| D336 | Staying dug in is the flag, not the movement | The defence bonus and the nag both read the flag. Nothing read the movement, so zeroing it bought nothing and cost everything |
| D337 | ⚠️ **The old test was updated, not deleted** | It asserted two things and only one of them was the bug. Deleting it would have thrown away the correct half, which is that the flag survives a turn |
| D338 | One button that reverses, rather than a second button | Fortify greying itself out told the player there was no way back, which was true and is the thing being fixed |
| D339 | Waking does not refund the turn | Otherwise it is a free movement reset for a unit that has already walked |
| D340 | The label has one owner | `data-i18n` removed from the button: `refreshSelection` writes the text, so a static translation pass cannot overwrite it with the wrong half of the toggle |

#### 42.6 Verified

- 907 tests, 13 new in `fortify.test.ts`. The regression test is written as
  the original symptom rather than as a statement about flags: fortify, play
  **ten turns**, then walk away.
- Driven in a real browser. The button reads *Befestigen*, becomes *Aufwecken*
  once dug in, and both states are enabled. After ending a turn the unit reads
  `movesLeft: 3` of `3` **and** `fortified: true`: still dug in, still holding
  its bonus, and free to leave.
- ⚠️ Two of my own new tests failed first for reasons that were facts about the
  test rather than the game: `reachable` includes the tile the unit is standing
  on, so "cannot go anywhere" is a set of size **one**, and moving to the first
  entry of that set returns *"Already there"*.

#### 42.7 Open

- A fortified unit is still skipped by next-idle cycling, so it can only be
  re-selected by clicking it. That is conventional for the genre and is left
  alone, but it does mean a unit dug in and forgotten is genuinely easy to
  forget.
- Nothing in the interface distinguishes "dug in" from "dug in and about to be
  attacked". The defence bonus is invisible until a fight resolves.

---

### 43. The trailer, re-cut at the graded look

The proposal on the table was a four-way choice, with Sora 2 text-to-video or a
Sora 2 animation of generated key art as the "photoreal" options, and recording
the game as the "perfect style match but effortful" one.

The choice was made on evidence rather than on the table, and the table had a
row in it that is wrong.

#### 43.1 ⚠️ Anchoring Sora on your own art does not give you photoreal

The suggested route was: generate key art in the project's style, feed it to
Sora 2 as an `input_reference`, get an animated photoreal version. Rated "good
style match, low effort".

**That was measured yesterday and it does not do this** (section 41.2, D325).
Handing Sora 2 a frame of this game came back **in the game's own low-poly
style with more trees on it**. An image reference preserves the look rather
than replacing it, so the output is "your art, slightly prettier": neither
photoreal nor actually your game. It is a particularly awkward failure because
the result is plainly *nicer* than the input, so it feels like progress.

#### 43.2 The premise had gone stale by a day

"I want photoreal, therefore a video model" assumes the renderer is not
photoreal. As of section 41 it is measurably much closer: saturation 0.433 to
**0.306** against a photograph's 0.245, blacks 0.193 to **0.156**, and the
aerial-perspective gap **79 percent closed**.

So recording the game now gives photoreal *and* a perfect style match, which is
the combination the table said was unavailable. It also keeps D59: the film is
a screen recording of a feature rather than a thing made for marketing, and a
generated clip would show a world that is nobody's.

The existing trailer was recorded on 22 August at 22:05, **before the grade
landed**, so it was showing the over-saturated, atmosphere-free version.

#### 43.3 What is in it

One continuous take with the beats time-stamped by the recorder, so the cut is
arithmetic rather than scrubbing. 31.2 seconds, three beats:

| | Beat | Why |
| --- | --- | --- |
| 1 | The world, 15.5 s | Opening shots 1 to 3 at the new grade. This is the part that stops a scroll |
| 2 | A real exam question, 8.5 s | The argument of the project in one frame |
| 3 | Title, 7.2 s | Opening shot 4, with the fog falling under the card |

⚠️ **The question beat is cropped to a push-in, and it had to be.** The panel
measures 634x199 in a 1600x900 frame. At full frame the text of a real DP-600
question is unreadable in a feed preview, which defeats the only beat that
shows what the game is *for*. The crop is 16:9 around the measured rectangle,
so the push does not distort.

The anthem is arranged so the film and the music end together: its opening and
first build under the landscape, a 1.5 s crossfade at 25 s, then the last bars
under the title. Measured, the level lifts from about −21 dB to −16.6 dB
exactly where the title card starts.

#### 43.4 ⚠️ Two things checked rather than assumed

**The founding cinematic was cut, on a number.** A beat showing the first city
being founded is obviously desirable, and it measured **63 percent black** for
its first second: the orbit starts at camera height 3.4 on turn one, when
nothing behind the fort has been explored. It only clears 1.5 s in, by which
point the shot is over. That is worse than my own bar from section 41, so it
went.

**A "defect" that was not one.** Checking flagged two bright frames with a
bright top edge, late in their beats, which looked like a stray flash or a
seek artifact. Fast and accurate ffmpeg seeks agreed **exactly**, so it was
real content: the grey fog-of-war lid falling under the title card, which the
opening does on purpose (32.4). The heuristic was wrong, not the film.

#### 43.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D341 | ⚠️ **No video model in the trailer** | An image-anchored Sora shot returns your own style, and an unanchored one shows a world that is not the player's. D59 and D325 both say the same thing here |
| D342 | Re-cut rather than kept | The old take predates the grade by twelve hours and shows the over-saturated version of a picture that has since been fixed |
| D343 | ⚠️ **The question beat is a push-in** | Legible on a monitor is not legible in a feed. A trailer whose only explanatory beat cannot be read has no explanatory beat |
| D344 | The founding beat was dropped on a measurement | 63 percent black. A dark, brief, half-legible beat is worse than one fewer beat |
| D345 | Two files, 1600x900 and 1280x720 | Discord's default attachment limit is 10 MB. A trailer nobody can upload is a trailer nobody sees. 16.5 MB and 5.5 MB |
| D346 | English interface, forced at boot | The first take came out in German because the language toggle persists in localStorage and the lane had been left that way. The audience is international |

#### 43.6 Verified

- Every beat sampled and measured: none is mostly black outside the
  deliberate fades, and the audio peaks at −2.9 dB with no clipping.
- ⚠️ The first take had to be thrown away twice, once for the German interface
  and once for an `ffmpeg` `concat` that refused to join a cropped segment
  because its sample aspect ratio was 1:1 while the source webm's was 405:404.
  The error names the filter and not the cause, so it is written into the cut
  script.

#### 43.7 Open

- There is still no beat showing a city being built, for the reason above. It
  needs a recording from a later turn, when there is explored ground behind the
  camera, rather than from turn one.
- Both files carry the anthem, so both inherit its non-commercial terms and
  both stay out of the repository. See MUSIC-LICENSING.md.

---

### 44. The empire studies something, whether or not you told it to

Asked for: if nothing is selected for research, pick something on the player's
behalf.

#### 44.1 ⚠️ Idle was the default, not an edge case

Two paths left the tech tree stopped, and both were ordinary rather than
exceptional:

- **A new game began studying nothing.** `research: EMPTY_RESEARCH` with
  `current: undefined`.
- **`completeResearch` cleared the slot.** So the rhythm of every game was
  learn, idle, learn, idle, and the idle half lasted until somebody noticed.

In both, Compute went on arriving and simply banked. Nothing threw, nothing
logged, and the tree quietly stopped moving. For a study tool whose entire
premise is that the questions keep coming, that is the worst failure available:
the player is not blocked, they are just not learning, and the game looks fine.

#### 44.2 ⚠️ The choice is deliberately dull, because it has to be

`autoSelectResearch` takes the **first researchable topic in graph order**.
That is not laziness; the engine is not permitted to be cleverer.

D35 says the engine never learns what a topic is *about*. So it cannot rank by
exam weight, by how weak the learner is, or by anything else that would make
this a good study recommendation. And a `TopicNode`'s `weight` is no help
either: it is a **cost**, 2 for a gateway and 1 for a skill, not a measure of
importance.

What is left is the order the challenge provider supplied, which for a
certification is the published order of its own outline. Neutral,
deterministic, and a perfectly reasonable path through a syllabus. Anything
better belongs to the learning layer, which can call `startResearch` whenever
it likes.

#### 44.3 Three places, and one of them deliberately does not fund

| Where | Why |
| --- | --- |
| `createGameState` | So turn one is already studying rather than banking |
| `completeResearch` | The one that matters: finishing a topic starts the next |
| The turn pipeline | The net underneath, for a loaded save or a re-imported curriculum |

⚠️ **A topic picked in the pipeline is not funded on the same turn.** Switching
topics forfeits progress, so investing Compute into something the player never
chose, in the same breath as choosing it, would charge them for a decision they
had no chance to see. Selecting now and funding from the next turn gives them a
full turn to change it for free, because progress is still zero.

It is also **reported**, not done silently, and the app says so in the log.
Something choosing your next subject without telling you is indistinguishable
from a bug the first time you notice the tech tree moving on its own.

#### 44.4 ⚠️ Sixteen existing tests failed, and they were not all stale

That number looked alarming and was mostly mechanical: tests that call
`startResearch(state, researchable(state)[0].id)` now get **"Already
researching this"** back, because auto-select had already chosen exactly that
topic. Those went through a helper that tolerates it.

Three were real, and one of them improved:

- `starting state > knows nothing and is researching nothing` asserted the old
  default in its title. Rewritten to assert the new one, keeping the parts that
  still hold: nothing known, nothing invested.
- `iknowthis refuses when nothing is being researched` guards a state a game no
  longer reaches on its own. Kept, with the state made idle explicitly, because
  the guard still matters for a loaded save.
- ⚠️ **`pays income into the treasury` became a stronger test.** It asserted
  that the treasury grows by exactly the income, which held only because an
  empire researching nothing spent nothing. It now asserts the whole ledger
  balances: `before + income − research − production`. That is a better claim
  than the one it replaced.

#### 44.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D347 | ⚠️ **Never idle: pick when nothing is selected** | Idle was the default state through two ordinary paths, and it fails silently. Compute arrives, banks, and no part of the tree moves |
| D348 | The engine picks in graph order, not cleverly | D35 forbids it knowing what a topic means, and `weight` is a cost rather than an importance. Graph order is the syllabus's own order |
| D349 | ⚠️ **The pipeline's pick does not fund that turn** | Switching forfeits progress. Funding a choice the player never saw would charge them for it |
| D350 | The pick is reported and logged | Choosing somebody's subject for them without saying so reads as a bug |
| D351 | Auto-select runs inside `completeResearch` | It is the path that produced the idling in the first place, and putting it there means no caller can forget |
| D352 | ⚠️ **`startResearch` still refuses the current topic** | The UI already omits it from the options, so a player cannot hit it, and the guard protects progress from a stray re-selection |

#### 44.6 Verified

- 922 tests, 15 new.
- Driven in a real game: on arrival, having chosen nothing, the empire was
  already studying *Implement workspace-level access controls*. After fourteen
  turns in which research was never touched, **three topics were known** and a
  fourth was funded. Before this change that run would have ended with zero.
- ⚠️ The first run of that check reported "tech tree did not move", and the
  cause was the scenario rather than the feature: it never founded a city, so
  there was no territory, no income and no Compute at all.

#### 44.7 Open

- ⚠️ **"Bank Compute and stay undecided" has stopped being a position a player
  can hold**, and `fundResearch` used to call it a legitimate strategy. It is
  now only reachable by finishing the tree. Nobody asked to keep it, and the
  trade favours the study tool, but it was a real option and it is gone.
- The choice is dull by necessity in the engine and could be much better in the
  app. `learn/src/coach.ts` already ranks topics by exam weight, retention gap
  and whether they are due; having the app pre-empt the engine with that
  ranking is the obvious next step and is deliberately not in this change.
- A player who never opens the research panel now learns whatever the outline
  lists first, forever. That is better than learning nothing, and it is not the
  same as studying well.

---

### 45. The opening was singing over itself

Reported as: the title sequence feels off against the music, like exactly one
text passage out. That is precisely what it was, and the cause is in the lyric
sheet.

#### 45.1 ⚠️ The anthem does not start with the verse

`media/familia-nostra.txt`:

```
[Intro - a single boy soprano, unaccompanied, very free]
Fabrica... fabrica...
Texamus una.

[Verse 1 - low strings enter, choir hums beneath]
Ex nihilo terra surgit,
...
```

The film opened on **"Ex nihilo" at t = 0**, while the anthem was still on its
unaccompanied introduction. By the time *Ex nihilo terra surgit* was actually
sung, the sequence had already cut to the next card. Every passage was one
early, all the way through, exactly as reported.

The four cards were never mistimed. They were **started too early**.

#### 45.2 The lines were measured, not guessed

Singers breathe between lines, so a phrase boundary is a dip in the band the
voices occupy while the accompaniment carries on underneath. Decoding the track
and looking for those dips at 50 ms resolution gives:

| t | passage |
| --- | --- |
| 0.00 s | *Fabrica... fabrica... Texamus una.* solo, unaccompanied |
| 4.60 s | low strings enter, +17.6 dB below 250 Hz |
| 5.35 s | *Ex nihilo terra surgit* |
| 12.44 s | *Flumina viam inveniunt* |
| 18.29 s | *Manus parvae, manus magnae* |
| 24.79 s | *Simul aedificant* |
| 30.54 s | the chorus, full choir |

⚠️ **The tell that this was a start offset and not a timing problem**: the
lines are 7.09, 5.85 and 6.50 seconds long, against existing shot durations of
7.2, 6.4 and 6.0. They were already cut to the song.

#### 45.3 A fifth beat, which shows less rather than more

The fix is a new opening beat carrying the anthem's own introduction:
**Fabrica**, *The workshop. Let us weave together*, 5.35 s, ending exactly
where Verse 1 begins.

⚠️ **It is the tightest shot in the film, and that is the constraint being
honoured.** The opening lifts the fog of war while it runs, so a longer
sequence could easily mean giving away more of a map the player is about to
have hidden from them again. A slow turn a few metres above the player's own
people, on ground they already occupy, adds five seconds and reveals nothing.
There is a test for it.

It also earns the cut that follows. The wide reveal now lands on *out of
nothing, the land rises* instead of being spent under an introduction nobody is
singing yet: one tile, then the whole world.

#### 45.4 ⚠️ Then the music was 0.85 s ahead, twice over

With the beats re-cut, measuring against the anthem's **own playback position**
showed every card still landing 0.85 s early. Two causes, pulling in opposite
directions and not cancelling:

- `refreshFog()` sat between `anthem.start()` and the first cut, blocking the
  main thread for most of a second while the music played on.
- `play()` resolves well before audio reaches the speakers, so the anthem
  started later than the film's own clock did.

Both are fixed by doing the expensive thing first and then waiting, capped at
900 ms, until the anthem is genuinely playing. Measured drift afterwards:
**+0.01, +0.05, +0.11, +0.10 seconds.**

⚠️ This was only visible because the check was anchored to the music. The first
version timed the film against itself, which cannot detect the film and the
music drifting apart, and reported a clean pass while the sequence was a second
out.

#### 45.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D353 | ⚠️ **A beat for the anthem's introduction** | The film opened on the verse while the soloist was still alone, so every card sat one passage ahead of the line it named |
| D354 | Line starts are measured from the recording | Breath gaps in the vocal band are an observable event. Cutting a film to a song by ear does not survive the song being re-rendered |
| D355 | ⚠️ **The new beat is the tightest shot in the film** | The opening lifts the fog while it runs. A longer sequence must not reveal more of a map that is about to be hidden again |
| D356 | The wide reveal moved to *Ex nihilo* | "Out of nothing, the land rises" is what the shot is of. It was previously spent under an introduction |
| D357 | ⚠️ **Sync is measured against the anthem's clock** | Timing the film against itself passes cleanly while the film and the music are a second apart |
| D358 | The fog is rebuilt before the music starts | It blocks the main thread for most of a second, and doing it after `start()` handed the anthem a head start |
| D359 | The film waits for audio to actually begin, capped at 900 ms | `play()` resolves long before sound arrives. Capped, because a build with no anthem will never start one |

#### 45.6 Verified

- 927 tests. New ones pin each card to its measured line, and assert the
  opening beat never sees further than the wide reveal does.
- Driven in a real browser against the anthem's own playback position: every
  card is on screen for its own line, drift under 0.11 s, and the title card is
  still up when the full choir enters at 30.54 s.
- The new beat measures 29 percent black against the wide reveal's 24 percent,
  so it is a shot rather than a dark hole. That was worth checking: a low
  camera on turn one was 63 percent black in section 43.
- The sequence is 32.4 s, up from 27.2 s.

#### 45.7 Open

- The 900 ms cap is a guess at how long audio can take to start. On a very slow
  machine the film could still begin fractionally before the music. It cannot
  wait indefinitely, because a build with no anthem file must not stall.
- The measured line starts are pinned to this recording. Regenerating the
  anthem, which section 39 contemplates, would need them measured again. The
  script that does it is not kept; the numbers are in the source.

---

### 46. Somewhere to build

Asked for: propose tiles around the Architect to found on, and weight city
growth more heavily. Together with a question about how growth works at all,
which is answered in section 46.1 because the answer is the design.

#### 46.1 Data is the food, and nothing eats it

The whole growth rule, in four lines of engine:

- Every city collects **Data** from the tiles it works. Data is the only
  resource that **stays local**: Compute, Capacity and Trust go to the empire
  treasury, Data goes into that city's `growthStore`.
- A new citizen costs `10 + population * 8`. So the first costs **18**, the
  second 26, the ninth 82. Growth gets harder as a city grows.
- Each citizen works **one more tile**, so more Data compounds into more of
  everything else.
- One citizen per turn, however large the windfall.

⚠️ **Subsistence is not deducted.** `subsistenceNeed` is `population + 1`, and
it does exactly one thing: while a city is below it, Data counts **triple**
when choosing which tiles to work. It is a thumb on the scale for the tile
picker, not an upkeep. The turn pipeline adds the whole Data output to the
store. So "turns to the next citizen" is simply `18 / Data per turn`, and the
advice says that rather than a number quietly reduced by a rule that does not
exist.

⚠️ **And the test for that found the trap.** `hungry` is `data < need`, a
strict comparison, so a size-one city on 2 Data is *exactly* at subsistence,
stops favouring Data, and picks the highest-value tile available. On a map with
a Capacity vent in range it will take the vent, collect no extra Data, and grow
at 2 a turn. That is the shape of the mistake a player makes by eye, and it
turned up first in a test written to check something else.

#### 46.2 Founding was the least explained decision in the game

An Architect can settle almost anywhere, the site is permanent, the difference
between a good one and a bad one is enormous, and nothing on screen said which
was which. A player either already knew that Data is what makes a city grow, or
they built where they were standing.

`settleSites` now proposes up to five, best first, drawn on the map in a green
nothing else uses and summarised in the panel as the number that matters: how
many turns to the next citizen.

Two constraints it respects:

- ⚠️ **Explored tiles only.** Advice pointing at ground behind the fog is the
  game handing over the shape of the map through the back door.
- The same elbow-room rule founding itself applies, so nothing is ever proposed
  that would then be refused.

The numbers come from **`workedTiles`**, the real picker, rather than from an
estimate of it. Reusing it means the figure shown cannot drift from the figure
the game produces, including the subsistence quirk above.

#### 46.3 ⚠️ The advice contradicted itself on screen

First working version, in the panel:

> better site 2 away: 2 Data, 9 turns to grow  (here: 3 Data, 6 turns to grow)

The "better" site grew **three turns slower** than the tile underfoot. The
score summed Data across the whole two-hex work radius, which describes a
city's eventual ceiling, while a size-one city works its centre and exactly one
other tile. The two can point in opposite directions.

Fixed twice over. The score now weights **what the city collects on its first
turn** at four times, alongside the neighbourhood total. And the interface
stopped claiming anything: it reports the best nearby site and the current one
side by side and lets the player choose, because a recommendation that argues
with its own numbers is worse than numbers on their own.

#### 46.4 ⚠️ Then the retune inverted the feature, and the test caught it

Adding the founding term, I dropped `GROWTH_WEIGHT` from 2.6 to 1.6 to make
room for it. That silently reversed the entire point of the advice:

> expected 66.4 to be greater than 72.09999999999998

A Raw File Plain is 2 Data; a Geothermal Vent is 3 Capacity at a weight of 1.3.
So a plains tile only outranks a vent tile while `2 × GROWTH_WEIGHT > 3.9`, a
floor of **1.95**. At 1.6 the recommendation preferred exactly the trap it
exists to warn about. It is 2.4 now, and the arithmetic is asserted directly
rather than left as a magic number.

#### 46.5 ⚠️ Three wrong probes for one working feature

The patches were on the map from the first run. My check reported zero, twice:

1. Comparing raw `color.r/g/b` against sRGB values, which three.js has already
   converted to linear. `#8fd694` reads as 0.27, not 0.56.
2. Reading `color` at all. `overlayMaterial` builds a **black, additively
   blended** material and puts the patch colour in **`emissive`**, so every
   overlay on the map reports as black.

Reading the material's actual definition found five patches immediately. Worth
recording because "the check says zero" is indistinguishable from "the feature
does not work" until you go and read what you are measuring.

#### 46.6 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D360 | ⚠️ **Sites are scored with the real yield functions** | `workedTiles` is subsistence aware, and that quirk is what decides whether a site grows. An estimate would disagree with the game exactly where it matters |
| D361 | ⚠️ **Growth is weighted above wealth, with a stated floor** | A site that cannot feed itself collects a little of everything forever. The floor is 1.95, derived from plains against vents, and asserted |
| D362 | ⚠️ **What the city collects on turn one is weighted separately** | Neighbourhood totals describe a ceiling; a size-one city works two tiles. Scoring only the total recommended slower-growing sites |
| D363 | The interface reports, it does not recommend | It was caught calling a 9-turn site better than a 6-turn one. Two rows of numbers cannot contradict themselves |
| D364 | ⚠️ **Explored tiles only** | Proposing a site behind the fog is the game telling the player what is out there |
| D365 | Five proposals, ranked by brightness on the map | More than a handful is a menu. Drawing the ranking means it can be taken without reading anything |
| D366 | A fifth overlay colour | Blue, orange, red and yellow already mean four things. A fifth meaning needs a fifth colour |

#### 46.7 Verified

- 943 tests, 16 new, including that Data-rich ground outscores Capacity-rich
  ground on a fully painted work radius rather than on whatever the generator
  happened to put two hexes away.
- Driven in a real game: the panel reads *best nearby (1 away): 3 Data, 6 turns
  to grow · here: 3 Data, 6 turns to grow*, five green patches are on the map,
  and selecting a non-settler clears both.

#### 46.8 Open

- The advice looks one Architect ahead. It has no opinion about spacing a
  second city against a first beyond the minimum legal distance, and no opinion
  at all about whether founding here is better than walking three more turns.
- ⚠️ The subsistence comparison being strict (`data < need`) means a city
  sitting exactly at subsistence stops chasing food. That is the existing rule
  and is left alone, but the advice now makes its consequences visible, which
  may be the first time anyone notices it.

---

### 47. Questions for a topic nobody shipped

Asked for: let the Foundry integration write questions for a completely new
topic, and save them back to a database.

#### 47.1 ⚠️ The generated path has no validation of its own

The output of the model is a **spreadsheet**, not a question bank. It comes
back as a plain grid in exactly the shape `previewBank` already reads, so
generated rows go through the same header check, the same per-row validation,
the same preview screen and the same answer hashing as a file somebody
uploaded.

That is the whole design, and it is worth stating as a rule: **there is no
second path into the question bank, so there is no second path that can be
wrong.** The alternative, a bespoke validator for generated content, would have
been a second set of edge cases nobody exercises.

#### 47.2 ⚠️ A confidently wrong question is worse than no question

This is a certification study aid. A wrong answer that looks authoritative gets
revised, believed and carried into the exam room, which is a worse outcome than
the topic being missing.

So the whole feature is built as a **draft**:

- The route returns rows and saves nothing.
- They land in the same preview an upload gets, and nothing joins a course
  until somebody presses the button.
- Generated courses never mix into the shipped DP-600 bank; they are separate
  campaigns.
- Every saved file records `"source": "generated"` and the model that wrote it,
  so it is still knowable a month later.
- The panel says so in as many words: *it can be confidently wrong.*

The system prompt is mostly about being wrong rather than being interesting,
and one line matters more than the rest:

> If you do not know the subject well enough to be sure an answer is correct,
> return fewer questions. Returning three good ones is a better answer than ten
> you are guessing at.

There is a test asserting that line is still in the prompt.

#### 47.3 The database is a directory of JSON files

⚠️ **A decision, not a shortcut.** The thematically perfect answer for this
project is a Fabric Lakehouse table, and it is the wrong one: it needs a
workspace, a table and a second set of credentials, and it would make the
reference host unrunnable for anybody without a capacity. A directory runs
wherever Node runs, survives a restart, and is shared by every browser pointed
at that host, which is the whole of what "saved to a database" has to mean
here. `FE_BANK_DIR` overrides it, because the one thing a container needs is
for this to sit on a mounted volume rather than inside the image.

Four routes, and the split matters:

| | |
| --- | --- |
| `POST /api/questions` | Draft. Needs Foundry. Saves nothing |
| `GET /api/bank` | The shelf, and the probe |
| `POST /api/bank` | Keep a reviewed grid |
| `GET /api/bank/:slug` | Read one back, so a second browser can play what a first wrote |

⚠️ Reading the shelf deliberately **does not require a model**. A host with
storage and no deployment can still serve what was written earlier; only
drafting needs Foundry.

#### 47.4 ⚠️ The topic becomes a path on somebody's machine

The one genuinely dangerous part. The topic is typed by whoever is playing and
ends up as a file name on the host.

`bankSlug` drops anything outside `a-z0-9-` rather than escaping it, because no
legitimate topic needs a slash and "reject what is not obviously safe" is the
only version of this that is easy to be sure about. The write path is then
prefix-checked against the bank directory anyway, on the principle that the
cost of being wrong here is writing wherever the caller likes.

Driven end to end against a stub model: `POST` with a topic of
`../../../../pwned` wrote `pwned.json` **inside** the bank directory, and
`GET /api/bank/../../package` answered 404.

#### 47.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D367 | ⚠️ **Generated rows are a spreadsheet, not a bank** | They reuse the importer's header check, validation, preview and hashing. One path into the bank means one path that can be wrong |
| D368 | ⚠️ **Nothing is saved without being looked at** | A wrong answer in a certification aid is revised and taken into the exam. The draft is shown before it counts |
| D369 | The prompt tells the model to return fewer rather than guess | The single most important line in it, and it is asserted by a test |
| D370 | ⚠️ **A directory of JSON files is the database** | A Lakehouse table would be thematically perfect and would make the reference host unrunnable without a capacity. This runs anywhere Node runs |
| D371 | Reading the bank does not need a model | Questions saved yesterday are still readable on a host with no deployment. Only writing new ones needs Foundry |
| D372 | ⚠️ **The slug drops unsafe characters rather than escaping them** | The topic is user input that becomes a path. Rejecting everything not obviously safe is the only version that is easy to be sure about |
| D373 | Saved files record their source and model | So that a file found later can still be told apart from the hand-written bank |
| D374 | Generated banks are gitignored | They are somebody's working notes, drafted by a model. The shipped bank is checked by tests; mixing them would make the two impossible to distinguish |
| D375 | The block is hidden when the route is absent | Same contract as the coach chat and the anthem: absent rather than present and broken |

#### 47.6 Verified

- 962 tests, 19 new. They cover the two things worth covering: reading rows out
  of whatever the model actually said, including fenced JSON with an apology in
  front of it, and turning a typed topic into a safe file name.
- The real host driven against a stand-in for Foundry. What left the process
  was checked, not assumed: the correct URL and api-version, credentials
  present, JSON mode on, the safety line in the system prompt, the topic in the
  user prompt. The file landed with `source: generated`, was listed, and was
  read back.
- ⚠️ The traversal attempt is part of that run rather than a separate exercise,
  because a path check nobody executes is a comment.

#### 47.7 Open

- Nothing merges banks. Drafting the same topic twice overwrites the earlier
  file, which is the least surprising behaviour but not the most useful one.
- The saved shelf is not offered in the interface yet. The route to read one
  back exists and is tested; nothing calls it, so a bank saved on a host is
  currently reachable only by drafting again or by URL.
- No model has actually written a question here. Everything above is against a
  stub that speaks the same shape, exactly as section 38 left the coach.
- ⚠️ Nothing rate-limits drafting. On a public host that is somebody else's
  Foundry bill.

---

## 48. Say what kind of game this is, and check the claim

The game reads as close to the genre leader, because it is: a hex map, a
settler, a tech tree and an end-turn button. The request was to say so plainly
in a README, so a reader knows within one sentence that this is a *genre entry*
rather than a copy, and to assess separately how close it really is.

The assessment lives in `IP-ASSESSMENT.md`, which is **gitignored** (D378). It
found that the interesting problem was not similarity at all.

| ID | Decision |
|---|---|
| D376 | ⚠️ **`tools/verify_publishable.py` does not exist.** Section 12 described it as running in CI with classes for secrets, tenant GUIDs, Fabric SQL endpoints, `*.openai.azure.com` hosts and `C:\Users\<name>` paths. There is no such file, no `.github/workflows` directory at all, and no npm script. Both mentions are now marked as specified-not-written. **A documented safeguard that does not exist is worse than a known absence**, because the plan reassures on a point where nothing is being checked, and the real exposure is the secrets, never the trademarks |
| D377 | The repository violated its own naming rule, at D08, since the first day. ⚠️ **The first scan reported that as the only case and was wrong.** It reused the eight-name trademark class from section 12.1, so it searched only for the names whose absence had already been considered: it found `Civ-style` and missed **Anno** (20 lines, including `engine/src/entities/rank.ts` and `engine/test/rank.test.ts`) and **Stronghold** (3 lines). Section 12 warns against "a list of identifiers I happened to notice"; that class is precisely such a list, and reusing it inherited its blind spot. **A check written from memory finds what its author already remembered** |
| D378 | The assessment is **not published**. A public repo should state its position, which the README now does, not publish its own risk analysis: such a document is a map of where to press, carries no privilege, and goes stale as the code moves |
| D379 | The README leads with the **genre**, in the first line, and never names another game. It also states *why* the shell is conventional: the novelty budget is spent on the questions, so anyone who has played a 4X can start without instructions. A deliberately ordinary shell is a design rationale, and it is better written down than inferred |
| D380 | Add the missing `LICENSE` (MIT, as section 12 always said). Its absence meant the repo was all rights reserved by default, contradicting the stated intent. ⚠️ Confirm this deliberately: an MIT grant on a published snapshot is effectively irrevocable. It is clean because `media/` is untracked, so no generated audio is sublicensed |
| D381 | Both D33 disclaimers now exist somewhere a reader will see them. They had been required since week one and lived only in this plan, because **there was no README at all** |

### What the scan actually taught

⚠️ **The first scan was wrong in three ways, and the shape of the error is
worth more than the result.** It ran over the working tree, which includes
ignored files, so it reported risk in `media/familia-nostra.txt` that no reader
could ever see. Its `Civ ?[IVX0-9]` class matched `Civi`, flagging twenty-odd
uses of `Civilian`. And **its list was too short**, because it was section
12.1's own list: it found the one name that section had thought of and missed
the two it had not, one of which appears twenty times and in shipped source.

Three rules fall out of that:

1. Scan **what git tracks**, not what is on disk. The published artefact is the
   only thing that can carry risk.
2. A checker that cries wolf is a checker somebody learns to skim.
3. ⚠️ **Never validate a list against itself.** The class in 12.1 was written
   from memory, and any scan seeded with it can only confirm what its author
   already suspected. There is no regex shape that means "this is a game
   title", so a list is unavoidable, but it has to be widened by someone who
   was not the person who wrote the code, and it must print its own limits.

### What was verified rather than remembered

Every factual claim in the README was checked against the code, because a
README written from memory is where wrong numbers live longest: twelve unit
types, nine roles, seven factions, four resources, three victories, and the
three npm scripts it tells the reader to run. The first version of that check
reported "0 unit types", which is impossible, and meant the regex was broken
rather than the code. **An implausible measurement is a bug in the measurement.**

### Left open

- The checker in D376 is still not written. This is the one item that guards
  against something that would actually hurt.
- `OutcomeKind` is still `'defeat' | 'domination' | 'science'`. These are
  internal identifiers and the player-facing text already avoids both words,
  but `'conquest'` and `'mastery'` would cost nothing and remove the single
  most quotable similarity in the codebase.
- The contest rules on originality and licensing have not been read against
  this. They should be, before submitting.
- The employment question is the one thing here that wants a human answer.
  CELA converts every "low" in the assessment into an actual clearance.

---

## 49. Build the shaders before the film, not during it

Prompted by reading a WebGPU snow demo (Babylon, hand-written WGSL) for ideas
worth stealing for the siege. Almost none of it ports as code: this renderer is
three.js on WebGL and has to run as a Fabric App on a machine nobody has seen.
One habit ported immediately, and it is the cheapest thing on the list.

| ID | Decision |
|---|---|
| D382 | **The naming rule is scoped to the marketing surface**, not the whole tree. Repo name, title, tagline, README, app chrome, submission text, art prompts and commit subjects name no other product. Design references stay, with attribution, in the design log, because section 24 cites its reference by name and year precisely so the reasoning can be checked. **A bibliography is not passing off**, and the old blanket rule was over-broad enough to threaten 50 lines of real argument to satisfy a standard stricter than the law. Code and test comments follow the marketing rule, since they travel without their context |
| D383 | `World.prewarm()` calls `compileAsync` after the world is built and before the opening film, while the setup screen is still up. **Measured: 13 lazily-compiled programs before, 3 after.** three.js builds a program the first time it draws with it, so a material that has not been on camera compiles during the frame it first appears |
| D384 | ⚠️ **The claim that motivated this was not proven, and the note says so.** The reason given for the pre-warm was that the assault set piece would hitch. An attempt to stage a fight and watch `renderer.info.programs` returned a clean zero which meant *the fight never started* (`spawnEnemyAdjacent` returned nothing, `factionUnits()` was empty), not that nothing compiled. The change is justified by the 13, which is real, and not by the battle story, which is not |

### What was taken, and what was refused

The demo's real lesson is not any single effect, it is **one construction reused
everywhere**: its wake and four of its five spells are the same swept surface
along a spine, and its snow, cloth, spray, water and ice all read one light pool
out of one include. That discipline is worth more here than any shader.

Kept on the list for the siege, in order of value per hour:

1. **The spine primitive.** A spine resampled into a small data texture, a
   static lattice, every vertex placed in the vertex shader, so a long trail and
   a short one cost the same buffer, and unused strands are switched off by
   zeroing their rows rather than by changing the draw count. A siege is almost
   entirely curve-with-a-cross-section: the projectile arc and its smoke, ram
   dust, oil down a wall face, the debris cone from a breach. It fits
   `combatFx.ts`, which already commits to pooling for the same reason.
2. **A deformation buffer, scoped to the city hex.** Persistent ground state
   whose second channel is *displaced mass*, which is what separates a breach
   with spoil heaped beside it from a flat decal. ⚠️ Far cheaper here than in
   the demo: it needs toroidal addressing because its player roams, and the
   assault is one hex under a locked camera, so the scrolling window disappears.
   ⚠️ Worthless unless the displacement is applied in the shadow pass too.
3. **A live parameter overlay** with a frame graph carrying the 1% low. Section
   41 converged the grade against a photograph over build cycles; sliders would
   have done it in minutes.

Refused on purpose: the WebGPU rewrite (eight days out, unknown hardware, no
WebGL fallback in the source it comes from), the procedural character with
Verlet cloth and planted-foot IK (superb, and invisible at 4X camera distance
where a unit is a few dozen pixels), and hand-rolled PCSS cascades (one sun over
a hex map is not an 870 m clipmap).

### Left open

- ⚠️ **Whether a battle compiles anything remains unmeasured.** The harness
  route into a staged fight did not work first time and was not worth more of
  the siege week. The 3 programs still lazy after the pre-warm are the ones to
  look at if a hitch is ever reported.
- The pre-warm covers `traverseVisible` only, so anything parked under an
  invisible parent is still deferred. Pools that want warming must be in the
  scene and visible, as `combatFx` already does with `count = 0`.

---

## 50. The fog was a hole in the world

Unexplored ground read as a black field crossed by a glowing hex lattice. The
request was to make it "a bit more fog realistic", and the interesting part is
that most of the problem was not the colour.

| ID | Decision |
|---|---|
| D385 | ⚠️ **The bright lattice was a geometry bug, not a shading choice.** `hexLid` lays each lid flat at its own hex's `peakAt`, so two neighbours with different peaks meet in XZ and *not* in Y, leaving an open vertical slot along every shared edge. From a low camera you looked straight through it at sunlit terrain, on all six edges of every hex. The lid already carried a comment saying "fog tiles must meet, or the map is covered in bright seams" and an inset had been removed to fix exactly this; the inset was only ever half the problem |
| D386 | **The lid gets a skirt.** Each edge drops a wall `SKIRT` below the lid so neighbours overlap vertically whichever is taller. Depth is free (six quads regardless of how far they hang) and anything below the neighbouring ground is buried by the depth test. `DoubleSide` on the material rather than re-deriving the winding that already cost a long hunt: the material is unlit, so it costs no shading and no extra draw call |
| D387 | **Fog is scattered light, so it is not black.** `#05070a` is lightness 0.03, which is a hole cut in the world. This is the same error section 41 already corrected once for the atmosphere, in its own words: dark distance "reads as a storm rather than as depth" |
| D388 | ⚠️ **The first correction overshot, and the failure was symmetrical.** At lightness 0.20 the sheet became the brightest thing on screen and the explored island vanished inside it. The unexplored region is most of the board, so painting it brighter than the land pulls the eye to the part of the map with nothing in it. Settled several times lighter than the void, still clearly darker than uncovered land, with the far field left to the scene's own `FogExp2` |
| D389 | Brightness is mottled from `fbm2` on **world XZ**, so neighbouring lids agree wherever they share a corner and the pattern runs continuously across the sheet instead of stopping at every hex. The skirt darkens towards its base, which is the only depth cue an unlit material can carry |

### Why the colour was the second problem, not the first

A flat dark plate and a flat mist-coloured plate are both plates. What made the
old picture read as a hole was the **lattice**, because a regular bright grid is
the one pattern the eye cannot read as weather. Fixing the seams did more for
"is this fog" than any colour change, and the colour change only became worth
making once there was a continuous surface to colour.

⚠️ **Verified by looking, at two zooms.** A luminance readback was written first
and returned a mean of exactly 0 across 122,000 pixels, which was a WebGL canvas
drawn into a 2D context without `preserveDrawingBuffer` and not evidence of
anything. Playwright's own screenshot captures the drawing buffer correctly;
the readback was discarded rather than believed.

### Left open

- The materials are built once, so the fog does not follow the sun the way
  `scene.fog` does. At a low sun the mist keeps a mid-day tone.
- Fog geometry is now three times the vertices it was, still one merged mesh
  and one draw call per layer. Not measured against a weak GPU.

---

## 51. The gate that was only ever described

D376 recorded that `tools/verify_publishable.py` did not exist while section 12
described it as running in CI. This builds it, and building it turned up three
further things that were described but not true.

| ID | Decision |
|---|---|
| D390 | **The gate exists and runs in `npm run verify`.** Eleven shape-matching classes: bare GUID, Fabric SQL endpoint, `*.pbidedicated.windows.net`, `*.openai.azure.com`, `*.vault.azure.net`, `*.webapp.fabricapps.net`, local profile path, corporate UPN, key or token shapes, inline credential, and a third-party name class that **warns** (D47) and applies only to the marketing surface (D382). Scans `git ls-files`, never the working tree |
| D391 | ⚠️ **The gate self-tests before it scans, because it passed on its first run.** A clean first result is indistinguishable from patterns that match nothing at all. Every rule now carries a sample it must catch, and the classes with a false-positive history carry samples they must not: `Civilian`, `amplitude`, "the old world", a hex colour, a version string. 11 caught, 7 correctly ignored. Proven end to end by injecting a GUID and a local profile path into a tracked file, watching it exit 1, and reverting |
| D392 | Printed output is ASCII and stdout is forced to UTF-8. The first end-to-end run died with `UnicodeEncodeError` the moment it was piped, because a Windows console hands Python a cp1252 stdout and the last line ended in an emoji. **A gate that dies when somebody pipes it fails inside `npm run verify` for a reason unrelated to what it checks.** Emoji stay in the comments |
| D393 | ⚠️ **`npm run serve:standalone` was broken, and it is the command the README gives a player to start the game.** It passed `--root app`, which `vite preview` does not accept; root is positional. It exited instantly. The README claim check had verified the script *existed*: **presence is not function**, and every other check this session ran through Vite's dev pipeline, which is not what anybody downloads |
| D394 | A committed smoke test, `tools/smoke/play-bundle.mjs`, run with `npm run smoke` against the production preview. It boots the bundle, starts a game, and asserts a seed, cities, explored tiles, geometries, shader programs and a turn that advances. `playwright-core` only, launched on an installed Edge or Chrome, so no browser download and it stays out of `verify` |
| D395 | ⚠️ **Two of its assertions were wrong before they were right.** `renderer.info.render.triangles` reported **1** on a fully drawn scene, because it reports the last `render()` call and with a post chain that is the final fullscreen quad; `info.memory` is cumulative and honest. And forbidding all 4xx failed on healthy output, since the standalone edition has no capacity host and `/api/*` returning 404 *is* the design |
| D396 | ⚠️ **The first negative control passed.** Pointing the smoke test at `/does-not-exist` proved nothing: `vite preview` is an SPA server and returns `index.html` for any path, so the game booted normally. A `data:` URL is the real control, and it now reports nine specific failures instead of throwing |

### Deployment: there is nothing to update

⚠️ **Fabric Empires has never been deployed.** No `rayfin/`, no `rayfin.yml`,
no `.deployments.json`, no rayfin dependencies. Section 13 describes capacity
`prdsweden`, a workspace and `rayfin up` (D31); like the gate in D376, it was
written down and not built.

**No permanent URL was created (D397).** Three facts made that the wrong thing
to do unilaterally:

- ⚠️ Section 13's own warning: **`rayfin up` never deletes.** The URL is
  permanent and goes in the submission.
- Hosting converts a schedulable F8 into an effectively 24/7 capacity.
- ⚠️ A Fabric App sits behind AAD in a single tenant. **Discord judges could
  not open it.** The README already describes the game as running from static
  files with no backend, so static hosting is both simpler and the only option
  a stranger can actually play.

What was done instead: the production bundle is current, and it is proven to
boot, render and advance a turn.

⚠️ **The bundle carries 14.3 MB of generated audio** (`anthem.mp3`,
`ferrum-et-ignis.mp3`, `terra-nostra.mp3`). `.gitignore` keeps that out of the
**repository** on licence grounds, and `NOTICE.md` and the README both say it is
not here. Neither statement covers the **deployed artefact**, which is a
distribution in its own right. Publishing the static build publishes the audio.
Decide that deliberately against `MUSIC-LICENSING.md` before hosting, or build
without `app/public/audio` for the public copy.

### Left open

- The hosting choice itself, and with it the submission URL.
- `npm run smoke` is not in `verify`: it needs a built bundle and a running
  server, so it is a release step rather than a commit step.

---

## 52. Deployed, and what the platform decided for us

Section 13 has described a deployment since the first week and D397 left it
undone. It exists now, and getting there settled a question the project had
only been guessing at.

| ID | Decision |
|---|---|
| D398 | **Deployed to a dedicated workspace on `prdsweden`**, as D31 asked. ⚠️ Neither existed: there was no workspace by that name and no rayfin scaffold at all. Section 13 also has the capacity wrong, it is **F32**, not F8 |
| D399 | ⚠️ **A Fabric App cannot be anonymous.** `auth.enabled: false` is the honest setting for this game, which has no account, no server state and no data call, and the deploy created the item and then failed: `400 Bad Request — Auth Settings need to be enabled`. **The platform decides this, not the design.** Auth is on |
| D400 | ⚠️ **But the static content serves without a sign-in redirect.** Measured, not assumed: the hosting URL returns 200 and a signed-out browser loads the title, the canvas, the harness and a playable game. The auth requirement gates the *backend* services, not the static bundle. This deployment is therefore usable as a link, which is the opposite of what D397 predicted |
| D401 | **`rayfin/.deployments.json` and `rayfin/.env` are gitignored before the first deploy, not after.** Section 12 warned that the first carries a `publishableKey`. Ignored ahead of time so the key never had a commit to be scrubbed out of |
| D402 | ⚠️ **`rayfin up` rewrites `rayfin.yml` and deletes every comment in it.** The rationale written into that file was gone the moment it deployed. Config commentary has to live here instead, and the file is treated as generated |
| D403 | ⚠️ **It also appends the tenant hosting URL to `allowedRedirectUris`.** Committed as-is that writes one tenant's app address into every clone, which is exactly what the `fabric-app-host` class in D390 exists to stop. The committed file keeps local origins only; rayfin re-adds the host at deploy time and it is stripped before commit |

### The gate earned its place on day one

D390's checker found two things in this change before they were committed, which
is the only kind of evidence that a gate is worth having:

- The workspace GUID and the hosting URL, had either been left in the config.
- ⚠️ **A finding in the plan itself.** Section 51 quoted a literal `C:\Users\`
  path while explaining the rule against them, and the `local-user-path` class
  fired on the documentation of its own rule. Reworded. A gate that catches its
  author writing about the gate is working correctly.

### Verified on the deployed URL, not just locally

Driven with Playwright against the hosted app: a game starts, and it reports the
same numbers as the local production bundle. 83 geometries, 33 textures, 48
shader programs, 7 cities, 61 explored tiles, ~4 ms frames, and a turn that
advances 1 to 2. Identical counts are the evidence that the deployment is
serving the bundle that was tested, rather than an older one.

### Left open

- ⚠️ **The bundle still ships 15.6 MB of static content**, most of it the three
  generated audio files. `.gitignore` keeps them out of the repository on
  licence grounds; the deployment is a distribution and is not covered by that.
  Decide it against `MUSIC-LICENSING.md`, or build the public copy without
  `app/public/audio`.
- The capacity now hosts a live app, so it is effectively 24/7 for the contest
  window. Section 13 predicted this; it is now real and it has a cost.
- The submission URL is decided by whether the anonymous access in D400 is
  intended platform behaviour or an accident of configuration. Worth confirming
  from a browser with no Entra session at all before relying on it.

---

## 53. The deployment was distributing the soundtrack

D400 claimed the app serves anonymously, on the strength of a page load in a
browser profile that is signed into the tenant. That is not evidence. Settling
it properly turned the licence question from theoretical into live.

| ID | Decision |
|---|---|
| D404 | **Anonymous access confirmed, this time with something that could have said no.** A raw HTTP request carrying no browser session at all, and a fresh context with no profile and no storage state: `/` returns 200, **zero cookies are set, there is no redirect**, and the game loads and plays. D400 was right, but it was right by luck until now |
| D405 | ⚠️ **Which meant the public URL was serving the soundtrack.** The same unauthenticated request returned all **3,372,390 bytes** of `anthem.mp3` as `audio/mpeg`. `MUSIC-LICENSING.md` opens with the answer: "not in the app you hand to other people. Yes, on your own machine." The free tier grants personal, non-commercial use and no right to redistribute, and a public URL is redistribution however free the game is |
| D406 | ⚠️ **`.gitignore` protects the repository. It does not protect the bundle.** `app/public/audio/` is untracked, so a clean clone builds silently and everything looks compliant. On this machine the files exist, Vite copies `public/` verbatim, and `rayfin up` ran the ordinary build. The protection had a hole exactly the width of the author's own hard disk |
| D407 | **`npm run build:public` strips the audio, and verifies that it did.** `tools/build/strip-audio.mjs` removes `app/dist/audio` and then sweeps the whole finished bundle for any remaining audio extension, failing the build if one survives. ⚠️ A silent no-op here would ship the soundtrack, and the entire lesson of this section is that the previous silent path also looked fine. 15.6 MB to **1.19 MB** |
| D408 | `rayfin.yml` builds with `build:public`, so the deployed artefact cannot carry audio even if someone forgets. Verified against the live host afterwards: `/audio/anthem.mp3` now returns 27,544 bytes of `text/html` rather than 3.3 MB of `audio/mpeg`. **Static content is replaced on deploy**, so "rayfin up never deletes" is about items, not files |
| D409 | ⚠️ **The audio probe now gets a 500, not a 404**, because the host errors on a missing file rather than reporting it missing. `audio.ts` and `soundtrack.ts` already treat any not-ok response as "no soundtrack" and fall through to silence, so the game is correct, and the smoke test encodes `/audio/*` as an expected absence alongside `/api/*`. But the browser still writes three failed requests to the console, and nothing in JavaScript can stop it. Cosmetic, and worth knowing before somebody opens devtools on the public URL and concludes it is broken |
| D410 | ⚠️ **D403 said to strip the tenant host by hand, and it was committed and pushed on the very next deploy anyway.** The gate caught it, one step too late, because `verify` ran after the commit in the same chained command. **A rule that depends on remembering is a rule that fails on the day you are busy** — the same lesson as D376 and D406 in a third costume. `npm run deploy` now owns it: `rayfin up`, then strip every non-local redirect URI, then run the gate and exit on its status |
| D411 | ⚠️ **`spawnSync` on a Windows `.cmd` shim needs `shell: true`.** Recent Node refuses to spawn `npx.cmd` directly, and it fails with a non-zero status and **no output whatsoever**, which is indistinguishable from a deploy that failed for a real reason. With a shell, arguments containing spaces must be quoted in the script, because the shell re-parses them and the workspace name has a space in it |

### The music still exists

Nothing was deleted. `app/public/audio/` is untouched, the local build still has
the score, and `npm run build` is unchanged. Only the *public* build is silent,
which is the state the opening was written to survive: it plays in silence when
the files are absent, which is every clean clone.

If the soundtrack should be part of what people hear, the route is a paid Suno
tier, where ownership transfers, and not a different reading of the free one.

### A tooling trap worth recording

⚠️ **`npm pkg set` with `&&` in the value.** The shell rewrote the separator to
`;` before npm ever saw it, and the mangled value was written into
`package.json`. It then propagated *into* the workspace build, so the child
command became `vite build ; node tools/build/strip-audio.mjs` and the build
failed inside Rollup for a reason that had nothing to do with Rollup. Edit
`package.json` directly for anything containing a shell operator.

### Left open

- The capacity hosts a live public app for the contest window, with the cost
  that implies.
- ⚠️ **Anonymous hosting is a property of the platform, not a setting chosen
  here.** It could change. Re-run the check in `D404` before relying on the URL
  in a submission.
- ⚠️ **The hosting URL is in git history**, from the commit described in D410.
  It is not a secret, since anyone can visit it, so this is untidiness rather
  than exposure: the rule exists to keep one tenant's address out of every
  clone. Worth a decision before the repository is made public, because history
  goes public with it.

---

## 54. Walls: the first piece of the siege

Section 19.5 orders the siege as walls, then siege state, then the assault set
piece, then the defender's options. This is step one, and it is the largest
engine change on that list.

| ID | Decision |
|---|---|
| D412 | **Two numbers, not one.** `wallLevel` is what was built and only production raises it; `wallHp` is what still stands and attackers knock it down. Keeping them apart is what lets a siege *progress*: the walls come down over several assaults while the investment survives. One number would either forget what was paid for or make damage permanent |
| D413 | **Walls are a production target, sharing the one purse.** `producing` widens from `UnitTypeId` to `ProductionTarget = UnitTypeId \| 'wall'`, so arming and fortifying compete for the same capped Compute exactly as building and studying already do. ⚠️ The union was chosen over a parallel queue deliberately: `'wall'` is not a `UnitTypeId`, so **the compiler names every site that assumed a unit**. It found eight, in four files, including two test helpers |
| D414 | **Walls scale defence rather than adding to it**, and they sit in `cityCombatSide`'s `fortifyBonus`, which existed and was hard-coded to 0. A flat bonus would make a size-one outpost with three levels as hard to take as a capital, which contradicts the whole rank system |
| D415 | ⚠️ **Scaled by integrity, so battering them down actually helps.** Without that a siege meets the same defence on its last assault as its first, which is the exact flaw `hpFactor` was added to fix for the city itself. `wallIntegrity` reports an unwalled city as **0, not 1**, so no caller can read "no walls" as "perfect walls" |
| D416 | ⚠️ **A finished wall would otherwise complete every turn, forever.** At full height the next level costs nothing, and a zero cost is always already paid. The tick drops the orders instead, and the top level clears `producing` when it lands. There is a test for it that runs sixty turns |
| D417 | **Save version 8**, defaulting both fields to zero. ⚠️ `wallHp` must not be seeded from `maxWallHp`: a level of zero has no hit points, and a non-zero default would hand every existing city a wall it never paid for. Section 19.2 predicted "save version 4"; the real number was 7 |
| D418 | `absorbWithWalls` is written and tested but **not yet wired into combat**. Walls currently change the odds; they do not yet soak damage. That belongs with the assault set piece in 19.5 step 3, and shipping the helper now means the rule is settled and covered before the thing that calls it exists |

### What the compiler and the tests each caught

The union type did its job: eight sites, named precisely, including the two
places a new `City` is built in tests. Nothing had to be found by hand.

⚠️ **Three of my own checks were wrong before the code was.** `createGameState`
takes a seed string, not an options object. `deserialise` returns a `GameState`
and throws, so treating it as a result object made every load look like a
silent failure. And a browser check reported "walls NOT OFFERED" when the real
situation was that the player had no city yet, because the seven on the map
belong to the antagonists.

### Verified on the deployed app, not only in the suite

19 new tests, 981 total. Then driven in a browser against the live URL: found a
city, ordered walls from the build picker, and watched it through.

```
Mauern Stufe 1 · 40/40
Mauern Stufe 2: 45/72 Compute · 2 turns
```

Level one at full height, orders carried on to level two, and the price risen
from 36 to 72. ⚠️ The harness's `factionUnits()` needs a faction id and returns
nothing without one, and its units carry `q`/`r` at the top level rather than a
`hex`, which cost two wrong probes.

### Left open

- Combat does not call `absorbWithWalls` yet (D418).
- **The AI does not understand walls**, which 19.2 warns about: it will throw
  itself at a fortress forever. It also never builds them.
- `unitCount()` in the browser harness returns 0 while units exist. Unrelated
  to walls, but it is wrong and something may be relying on it. ⚠️ **Retracted
  in D428: it is not a bug.** It takes a `factionId` and was being called with
  none.

---

## 55. The walls were never actually being hit

Section 54 shipped walls with `absorbWithWalls` written, tested and **called by
nothing**. In the deployed game `wallHp` had exactly one writer, production, and
no reader ever reduced it. So walls stood at full integrity forever,
`wallDefenceBonus` never decayed, and D415's rule that battering them down helps
was unreachable code sitting behind passing tests.

⚠️ **A tested helper nobody calls is not a feature**, and the tests said
otherwise because they tested the helper rather than the game.

| ID | Decision |
|---|---|
| D419 | **Damage lands on the walls first.** `resolveAttack` runs the city branch through `absorbWithWalls`, so a blow is soaked while the wall stands and only the remainder reaches the city. `wallHp` now has a second writer, which is what makes a siege progress instead of repeating |
| D420 | ⚠️ **Wiring damage exposed a dead end, so repair had to exist.** Raising a level restores the wall to full by construction, so a battered wall *below* the cap heals when it is next built up. At the cap there is no next level: without repair, one hit at full height was permanent for the rest of the game. `wallWork(city)` now returns `raise` or `repair`, and `nextWallCost` alone is no longer the question anyone asks |
| D421 | **Repair costs half the rate of building.** The stone is quarried and the line is walked. It also hands the defender a cheaper move than the besieger, which is the asymmetry a siege ought to have |
| D422 | **Capture breaches the walls but leaves the earthworks**: `wallHp: 0`, `wallLevel` intact. The new owner inherits something worth mending, and D420 is what makes mending possible. Without repair this would have been a permanently ruined wall on every captured city |
| D423 | **The AI stops battering a fortress it cannot break** (19.2's explicit warning). It divides the target's remaining `wallHp + hp` by the damage its own preview says it is achieving, and looks elsewhere past `HOPELESS_ASSAULT_TURNS = 12`. Deliberately generous: this exists to stop the arithmetic-says-never case, not to make antagonists timid |

### What the tests found that the code did not say

⚠️ **`MIN_DAMAGE` hides the whole mechanic from a line unit.** The test for
"gets easier as the wall comes down" failed against correct code: a Pipeline
Runner against a two-level wall returned exactly **10** both fresh and battered,
because the floor clamps it either way. Switching the attacker to a Direct Lake
Titan showed the effect immediately.

That is not a test problem, it is a statement about the game: **a line unit
gains nothing from breaching a wall.** It is now asserted in both directions, so
the floor case is recorded rather than quietly worked around. It is the same
trap `SIEGE_CITY_BONUS` documents at the upper cap, at the other end of the
curve, and it is a real argument for building siege units.

### Verified against the deployed build

13 new tests, **994 total**, all going through `resolveAttack` rather than the
helper, which is the only way to tell a working rule from a tested one nobody
uses. Then on the live URL: a level-one wall at `40/40`, the picker offering
`Mauern Stufe 2 (72)` as a **raise** because the wall is whole, and the shipped
bundle confirmed to contain the repair string.

### Left open

- **The AI still never builds walls.** It will no longer suicide into one, but
  antagonist cities stay soft, so walls remain something only the player uses.
- Siege state itself (19.5 step 2) and the assault set piece (step 3) are still
  ahead. What exists now is a wall that can be built, broken, mended and taken.
- `unitCount()` in the browser harness still returns 0 while units exist.
  ⚠️ **Retracted in D428: it is not a bug**, it takes a `factionId`.

---

## 56. Antagonists fortify, and a bug that was not one

Section 19.2 asks that the AI understand walls. D423 taught it not to batter a
fortress it cannot break. This is the other half: until now walls were something
only the player ever had, so half the siege system was never exercised in an
actual game and every antagonist city stayed soft however late it was taken.

| ID | Decision |
|---|---|
| D424 | **An army at full strength digs in.** The AI's simple-timer model already threw a cycle away whenever a faction sat at `MAX_GARRISON_PER_FACTION`: it held at the threshold and did nothing. That spare cycle now goes into earthworks. No new saved field, no version bump, and the same competition the player has, with troops first and walls from what is left over |
| D425 | ⚠️ **Troops come first, and there is a test that fails if that inverts.** An AI that fortified instead of defending would be *easier* to beat and would stop being a threat at all. Below the cap it still raises a unit; after losing one it drops below the cap and goes back to replacing it, keeping the wall it already built |
| D426 | The AI mends through `wallWork`, the player's own rule, so an antagonist repairs a breach exactly as a player would and stops when there is nothing left to do. One rule, two callers |
| D427 | **`cities()` added to the browser harness**, reporting faction and wall state. ⚠️ Antagonist fortification was otherwise untestable outside the engine: the rule could be proven in a unit test and **nothing in the running game could see it**. A rule that cannot be observed where it ships is a rule nobody will notice breaking |
| D428 | ⚠️ **The `unitCount()` bug recorded in 54 and 55 was not a bug.** It takes a `factionId`, and I had been calling it with none, so it counted the units of a faction that does not exist. Exactly the same mistake as `factionUnits()` two sections earlier. **A defect reported twice in the plan was my own call-site error**, and leaving it there would have sent somebody hunting for it |

### Verified in the deployed game, not only in the engine

6 new tests, **1000 total**. Then driven against the live URL: by turn 19, **six
antagonist cities were walled**, each at level 1 and 40/40 hit points.

⚠️ **Getting there needed the defence challenge answered.** Turn advancement
stalled dead at turn 16 through forty-five `endTurn()` calls, which looked
exactly like a regression in the turn pipeline. It was not: the log read *"The
Silo Horde is at your gates. Hold them."* six times over, and the game was
correctly refusing to advance until the player answered. Any script that drives
more than a few turns has to answer questions, not just press the button.

### Left open

- Antagonist fortification is silent: no `AiEvent` is raised, because that type
  requires a `unitId` and a wall is not a unit. The player finds out by looking.
- Siege state (19.5 step 2) and the assault set piece (step 3) are still ahead.
  What exists now is a wall both sides build, break, mend and take.

---

## 57. The wall you see is the wall you built

Walls could be built, battered, mended, taken and raised by the AI, and **none
of it was visible**. Worse than invisible: the city model already drew a rampart
and bastions, driven by **rank**.

⚠️ **So the game had two unrelated notions of fortification.** A Siedlung with
three wall levels showed no wall at all, and a Großstadt that had never spent a
single Compute on defence looked like a fortress and fought like an open town.
Section 54 created that the moment walls became a production item, and nothing
noticed because both halves were individually correct.

| ID | Decision |
|---|---|
| D429 | **The two axes are separated and each now says what it means.** `rank` governs how developed the place is: houses, church, cathedral, a second storey. `wallLevel` governs what fortification stands: rampart and gate, then bastions at the full level. The original argument that "the fortress is earned" survives intact, and is better served, because it is now earned by the thing actually called fortification |
| D430 | **Each level is a taller work than the last**, so 1, 2 and 3 are told apart at a glance without a number on screen |
| D431 | ⚠️ **A breach is visible.** Past `WALL_BREACH_POINT` the turfed rampart walk is omitted and a bastion is missing, so a battered fort reads as raw earth from the map camera. A siege that only appears in a side panel is a siege the player learns about by reading |
| D432 | ⚠️ **The rebuild signature did not include walls, and the comment beside it warned about exactly this.** It was `population:rank:factionId`, so a wall could go up, be battered and be mended without the model ever being rebuilt: the change above would have been invisible until the town happened to grow a citizen or change hands. Now keyed on `wallLevel` and the breach state, and on the **threshold** rather than raw hit points, because keying on every point of damage would rebuild the whole town on every blow |
| D433 | `isBreached` and `WALL_BREACH_POINT` live in the engine, so the renderer and the thing deciding when to rebuild cannot disagree. They would not have had to disagree by much: `< 0.5` against `<= 0.5` would produce a fort that changed appearance only when something unrelated happened to it |

### Verified by looking

1004 tests, four of them pinning the breach threshold including the case that
matters most: ⚠️ an **unwalled** city has integrity 0, so a naive
`integrity < 0.5` would call every open town breached and draw rubble round a
village.

Then on the live URL, a city reading `Mauern Stufe 2 · 80/80` and ranked
**Siedlung**, the lowest there is, standing inside a hexagonal rampart with its
turfed walk. Under the old rule that city had no wall geometry whatsoever. The
rebuild signature confirmed as `2:siedlung:player:2:whole`.

### Left open

- Antagonist fortification is still silent in the log (no `AiEvent`).
- Siege state (19.5 step 2) and the assault set piece (step 3) remain. ⚠️ Note
  19.5's own cut trigger prefers the **set piece** over the multi-turn
  investment if only one can ship.

---

## 58. The walls were a locked door, and every test agreed they were fine

Before building the assault set piece on top of the wall system, one question
was worth asking: with the AI now fortifying and mending, **can a city still be
taken?**

⚠️ **No.** Three separately reasonable decisions had multiplied:

- walls roughly double a city's defence (D414),
- damage lands on the walls first (D419),
- an antagonist at its unit cap mends for free every garrison cycle (D426).

That last one restored the wall to **full**. A besieger doing floor damage
removes 60 hit points over six turns; the defender was putting 120 back.

| ID | Decision |
|---|---|
| D434 | ⚠️ **Measured, because nothing else would have found it.** Every unit test passed, the feature demonstrated correctly in the browser, and the arithmetic was still impossible. Against a level-three mending wall a **Pipeline Runner never took the city, and neither did the Notebook Cannon** — the siege unit, the thing built to break cities. Only the Direct Lake Titan, the single heaviest unit in the game, got in |
| D435 | **A free repair patches; a paid one rebuilds.** `WALL_MEND_PER_CYCLE` is half a level's hit points. Ordering repair through production still finishes the whole job, because it costs Compute and takes turns. The garrison cycle costs nothing, so it may not do the same work |
| D436 | ⚠️ **The `aiWalls` test asserted the defect.** It required the wall to come back to full height in one cycle, which is exactly what caused the deadlock, and it passed the entire time. Rewritten to assert *progress*: a mend advances, never exceeds the wall's height, and enough cycles still finish |
| D437 | Three regression tests grind a real siege turn by turn with the defender mending, and one of them asserts the **ordering**: a siege unit must take a walled city faster than a line unit. If those ever converge, siege units have stopped being worth building and 19.2's "bring siege" is decoration |

### The curve now, measured

Turns to take a city, defender mending throughout:

| attacker | no wall | wall 1 | wall 3 |
|---|---|---|---|
| Pipeline Runner | 22 | 26 | **38** |
| Notebook Cannon | 5 | 8 | **15** |
| Direct Lake Titan | 4 | 5 | **9** |

Walls slow a line unit by 16 turns and a siege unit by 10. Nothing is
impossible, and bringing the right tool is worth more than bringing more of the
wrong one, which is the argument the unit roster is supposed to make.

### Two process notes worth keeping

⚠️ **The regression test was proved by breaking the code again.** The full mend
was reintroduced deliberately and all three tests failed, then it was put back.
A regression test that has never seen the regression is a guess.

⚠️ **`git checkout -- <file>` discarded uncommitted work.** It was used to undo
that deliberate break, and it reverted the file to HEAD, taking the real fix
with it because the fix was not committed either. The tests then failed for a
reason that looked like the fix not working. **Never revert a scratch edit with
`checkout` on a file that has uncommitted changes**; patch it back the same way
it was patched out.

---

## 59. Tactics: going at a wall is a decision

Section 19.3's assault set piece, reached by its smallest complete slice. Until
now every blow against a city was the same blow, so a wall was only a number
that made another number smaller. Three tactics, offered whenever the target has
walls, and threaded from the choice through the preview to the resolution.

| ID | Decision |
|---|---|
| D438 | **`wallShare` is the interesting number, not `strength`.** A tactic that was only "more damage" collapses into "pick the biggest one". `batter` lets the wall absorb everything it can, `escalade` lets it absorb a fifth, `sap` hits it hardest. What makes escalade worth choosing is that it does not care how tall the wall is; what makes sap worth choosing is that it does |
| D439 | **`batter` is exactly the old behaviour** and is the default, so nothing silently rebalanced: all 1008 existing tests passed unchanged the moment tactics landed |
| D440 | ⚠️ **A city does not counterattack, so escalade's cost had to be invented rather than discounted.** The original design multiplied the counter, which would have multiplied zero. That default is right for bombardment and wrong for men on ladders, so escalade is now the only way of attacking a city that costs the attacker anything at all |
| D441 | ⚠️ **Escalade is offered to melee only.** A ranged attacker takes no counter by any route, and escalade's entire price *is* the counter, so a Notebook Cannon could otherwise ignore the wall for free. You cannot storm a parapet from a mile away |

### Two bugs that only measurement found

⚠️ **The preview and the resolution had silently split.** `resolveAttack`
recomputes damage rather than reading it off the preview, so a factor added to
one and not the other separates them without any test noticing. Measured:
`sap` **previewed 33 damage and resolved for 17**, and `escalade` **showed the
player a hundred points of counterattack and then charged nothing**. The comment
on `previewAttack` promises "the odds shown are the odds fought", and that was
true only because nothing had ever differed between them before. There is now a
test per tactic comparing what was promised against what was taken, on both
sides of the fight.

⚠️ **Fractional hit points.** A twenty percent share of a whole number is not
one, so cities were standing on 191.2 hit points behind 117.8 of wall. Rounded,
and asserted.

### The clamp, for the third time

`MIN_DAMAGE` and `MAX_DAMAGE` hid two more effects. Against a level-three wall a
Pipeline Runner is pinned at the floor, so **sap does nothing for it**, and the
city's counter is pinned at the ceiling, so escalade costs the same whatever the
wall is doing. Both tests failed against correct code until the attacker was
changed to one that is not clamped.

Recorded rather than worked around, because it is a real statement about play:
**at the damage floor the choice is between batter and escalade**, which differ
by *where* the blow lands rather than how big it is. Strength bonuses need a
unit that is not already clamped.

Measured, at a full level-three wall:

| attacker | batter | escalade | sap |
|---|---|---|---|
| Pipeline Runner | wall 110 | wall 118, town 192, **100 back** | wall 110 |
| Notebook Cannon | wall 109 | wall 118, town 192, 100 back | **wall 98** |
| Direct Lake Titan | wall 102 | wall 117, town 189, 53 back | **wall 85** |

### ⚠️ What was not verified

22 new tests, **1022 total**, and the deployed bundle confirmed to contain the
tactic prompt and all three profiles. **The dialog itself was not opened in a
browser.** From the live save the nearest enemy city is thirteen hexes away and
unwalled, and the player has a single Profiler, so reaching a walled city would
have taken many turns and many answered questions.

That is the same "tested but never seen" gap this plan has complained about
twice, and it is open rather than closed. The cheapest way to close it is a
harness call that plants a walled enemy city beside a player unit.

✅ **Closed in section 60**, by exactly that.

---

## 60. Opening the door that had never been opened

Section 59 shipped assault tactics with the dialog never once opened in a
browser, and said so. This closes that, using the fix that section named.

| ID | Decision |
|---|---|
| D442 | **`plantWalledCity(unitId, level)` joins the harness**, beside `spawnEnemyAdjacent`, which exists for the same reason: the combat choreography could not be exercised without marching across the continent first. Tactics only appear against a walled city, and in a real game the nearest enemy town is a dozen hexes away and stays unwalled until the AI has finished its army. **A feature that cannot be reached cannot be checked** |
| D443 | ⚠️ **The first proof was not proof.** Choosing `sap` gave wall 120 → 110, town untouched, attacker unharmed, and that matches the engine exactly. It also matches `batter` exactly, because at the damage floor those two are identical (59). It demonstrated that *a* tactic was applied, not that the *choice* mattered. Escalade is the one that visibly differs, so escalade is what had to be driven |
| D444 | **The choice changes the outcome in the deployed game**, measured one turn apart with the same unit against the same wall: sap took 10 off the masonry and nothing else; escalade took 2 off the wall, **8 off the town**, and **killed the attacker outright**. A Profiler escalading a level-three wall is suicide, which is the trade the profile describes |

### What the browser showed

```
Bastion: Wie gehst du hinein?
Mauern der Stufe 3 stehen noch, und die fallen nicht durch Begeisterung.

  Die Mauern berennen      Alles gegen die Mauer. Langsam, und es kostet dich nichts.
  Ersteigen                Über die Brüstung. Der größte Teil des Schlags trifft die
                           Stadt selbst, und die Verteidiger lassen dich dafür bezahlen.
  Die Mauern untergraben   Darunter hindurch. Der schnellste Weg durch Mauerwerk, und
                           fast nutzlos, sobald die Bresche offen ist.
```

| tactic | wall | town | attacker |
|---|---|---|---|
| Sap | 120 → 110 | untouched | unharmed |
| Escalade | 110 → 108 | **200 → 192** | **died** |

### The pattern this closes

Four sections in a row found a rule that was correct in the engine and wrong,
absent or invisible where it actually runs: `absorbWithWalls` called by nothing
(55), walls drawn from the wrong field (57), a wall nothing could break (58),
and a dialog nobody had opened (59). Each was proven by tests that were
themselves correct.

**The engine is not the game.** A rule needs reaching where it ships, and if
reaching it is hard, that is a reason to build the affordance rather than a
reason to skip the check.

---

## 61. The AI gets the same three choices, and sap stops lying

Tactics shipped with **one** user: the player. Every antagonist attack took the
default, so a player who walled up was never escaladed and never sapped. Walls
were strictly better for the player than for the seven factions that also build
them, which is D424's asymmetry one layer up.

Writing the chooser exposed a contradiction in the tactic it was supposed to
pick.

| ID | Decision |
|---|---|
| D445 | ⚠️ **Sap's own description was a lie.** With a single strength number, a sapper's masonry bonus kept applying after the breach was open, so `sap` was quietly the strongest tactic in *every* situation and the other two were decoration. The card says "almost no use once the breach is open". `strengthOpen` makes that true: 1.55 against masonry, **0.7 against people** |
| D446 | ⚠️ **The test that should have caught it asserted nothing.** "Sap loses its advantage once the breach is open" only checked that both tactics did *some* damage to an unwalled city, which is true of anything at all. Rewritten to compare them, and it now fails if sap is not the **worst** way through an open breach |
| D447 | **`chooseTactic` scores progress, not damage.** While the wall stands only wall damage moves a siege along; once it is down only damage to the town does. Scoring raw damage would have picked sap forever, including after the breach where it is now the worst choice |
| D448 | ⚠️ **The AI will not pick a tactic that kills the attacker.** Escalade against a fresh wall costs a full counterattack, which is lethal to most of the roster. An AI that storms a fortress with scouts is not aggressive, it is broken |

### ⚠️ The damage clamp has now hidden a mechanic four times

`MIN_DAMAGE` is 10, and a starting Profiler against a walled city is pinned to
it. So far that has concealed: wall integrity scaling (55), sap's strength (59),
the city's counter ceiling (59), and now sap's post-breach penalty, which
measured **exactly 10** in the live game where the engine says it should be
lower than battering.

That is no longer just a testing annoyance. It is a statement about play:
**for the unit the player starts with, most of the combat system is invisible.**
A first siege shows no difference between battering and sapping, so the tactic
prompt is asking a question whose answer does not yet matter.

Worth deciding before submission, and deliberately **not** fixed here, because
lowering the floor would rebalance every fight in the game and the siege work is
still settling. Options, cheapest first: soften `MIN_DAMAGE` against cities
only; scale the floor with the attacker's strength; or say so in the prompt, so
a player learns *why* their scout cannot exploit a breach.

✅ **Decided in section 62**, and by none of those three: the floor now scales
with the *tactic*, which leaves unit fights untouched.

### Verified

1027 tests. In the live game: the dialog offers all three against a breached
wall, and sap through an open breach took 10 off the town and nothing off the
wall, which is correct and, being the floor, **does not distinguish it from
battering**. The distinction is proven in the engine with a unit that is not
clamped; it could not be shown in the browser with the unit available.

⚠️ `plantWalledCity` gained a `wallHp` override so an already-breached wall can
be reached at all. Battering one down through the interface is a dozen turns of
questions, and the rule only applies at zero.

---

## 62. A floor on effort, not on technique

Section 61 left this open: `MIN_DAMAGE` flattened every weak blow to the same
10, so the assault prompt asked the player a question whose answer could not
matter until they fielded a much heavier unit. It had hidden a mechanic four
separate times before it was believed.

| ID | Decision |
|---|---|
| D449 | **The floor scales with the tactic.** `MIN_DAMAGE` guarantees a fight makes progress; that is a floor on **effort**, and a technique changes what effort achieves. So `damageFrom` takes a `floorScale`, and a city assault passes the tactic's own multiplier. ⚠️ None of the three options section 61 costed were taken: softening the floor for cities would have re-opened the locked door of section 58, since a Profiler doing two damage to a 320-point fortress is the same problem in a different costume |
| D450 | **Unit fights are untouched.** `floorScale` defaults to 1, so every caller outside a city assault computes exactly what it did before, and there is a test that pins it |
| D451 | ⚠️ **A test had to be inverted, and that was the signal.** "Sap is worth nothing to a unit already at the damage floor" was true, correct and documenting a defect. When the only failure after this change was that test, the change was doing precisely what it set out to |

### Measured, before and after

One blow at a full level-three wall, by the unit the player starts with:

| | batter | escalade | sap |
|---|---|---|---|
| **Before** | wall −10 | wall −2, town −8 | wall −10 |
| **After** | wall −10 | wall −2, town −7 | **wall −16** |

And through an open breach the order correctly inverts, so sap is the worst way
in: batter −10, escalade −9, **sap −7**.

⚠️ **Conquest still completes**, which was the thing to check: at a level-three
wall with the defender mending, a Profiler takes 40 turns, a Notebook Cannon 17,
a Direct Lake Titan 10. No "never" anywhere, and siege units still pay for
themselves several times over.

### Verified where it ships

1031 tests. Then two consecutive assaults in the deployed game with the same
starting Profiler against the same level-three wall:

```
Die Mauern untergraben   120 -> 104   (16)
Die Mauern berennen      104 ->  94   (10)
```

The choice now matters on the first siege a player ever fights, with the unit
they are given. That is the whole point of asking.

---

## 63. A Pro subscription, and the backlog it unblocked

Ten sections in a row went to the siege. This one starts by stepping back,
because a subscription changed a licensing answer and the answer was load
bearing.

### 63.1 The soundtrack is ownable now

Section 53 stripped every track out of the public build. Not for weight, for
licence: free-tier Suno output is Suno's, and section 12's rule is that nothing
ships whose licence cannot be stated in one sentence. The game has been silent
in public ever since, and the strip was the right call for the whole time it
was in force.

A Pro subscription moves the answer. Suno's pricing page and help centre agree:

> Commercial use rights **for new songs made**

⚠️ Read the qualifier. Ownership attaches to songs generated **while
subscribed**; it is not retroactive. The three files on disk today were made on
the free tier, and they stay Suno's however long the subscription runs. So this
is not "unstrip the audio". It is **replace, then unstrip**, and the order is
not negotiable: every existing take is disposed of, and the new ones stand on
their own provenance.

### 63.2 There is no Suno API, and that matters more than it looks

The instruction was to try an API key first. There is no key to try. Suno sells
three consumer plans and exposes no developer surface at all: nothing in the
nav, the footer or the FAQ.

Everything marketing itself as a "Suno API" is a third-party wrapper driving a
logged-in session. Section 2 of `MUSIC-LICENSING.md` already quotes the clause
that forbids exactly that:

> you agree not to ... **grant access to** ... any portion of the Service

⚠️ Which makes the shortcut self-defeating. The entire reason for regenerating
is to hold a clean title to the music. Acquiring it through a route that
breaches the terms granting it is not a clean title. **The browser is the only
supported way to make a Suno song, so the browser is the way it gets made.**

### 63.3 The clock is 3 September, not 31 August

The contest deadline is not the binding constraint here.

> **20 song downloads per month** (starting 9/3/26)

Today is 23 August, so downloads are **unlimited for eleven more days** and
capped at 20 a month afterwards. D306 picks takes by measurement rather than by
ear, which means pulling every take of every track and comparing them, and a
seven-track run at four takes each is 28 downloads. That does not fit in the
September allowance and fits comfortably in the August one.

D310 already said everything is downloaded the day it is generated. This is the
same rule with a number attached.

### 63.4 The rest of the backlog, phased

Six questions went back with "all of it", "all of it phased" and "you decide".
Taken literally that is more than the eight remaining days hold, so the value
is in the ordering rather than the list. Each phase ships standalone, and the
cut line can fall between any two of them without leaving rubble.

| Phase | Work | Why here |
| --- | --- | --- |
| **A** | Suno regeneration, install, unstrip | Hard external deadline of 3 September, and it is a licensing defect until done |
| **B** | Finish an Exam victory playthrough | Cheapest possible answer to "can this game be completed", and section 58 is the standing warning about assuming yes |
| **C** | Rename the victory identifiers | Minutes, no migration, closes the IP question |
| **D** | Defender options (19.4) | The largest remaining asymmetry: attacking has three tactics, defending has none |
| **E** | Learning loop audit, then question quality | The premise of the entry, and the thing the contest is actually about |
| **F** | Judge-facing guided path, then README and STORY | Nobody judges what they cannot find |
| **G** | Demo video, assault set piece (19.3), siege state (19.5) | Genuinely optional. 19.5 already carries its own cut trigger |

⚠️ **Nothing is submitted to the contest, and the repo stays private, until
explicitly released.** The deployed URL being publicly reachable is fine and
stays as it is.

#### 63.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D452 | ⚠️ **Pro ownership is not retroactive, so every free-tier take is replaced and deleted** | The help centre grants rights to songs "made while subscribed". Keeping the old files and relabelling them would be a licence claim resting on a subscription that did not exist when they were generated |
| D453 | ⚠️ **No third-party Suno API, at any convenience cost** | The wrappers work by handing a session to a middleman, which is the one thing the terms name outright. A title obtained by breaching the terms that confer it is not a title. The browser is slower and it is the only route that survives being asked about |
| D454 | Everything is regenerated before 3 September | Downloads go from unlimited to 20 a month, and choosing takes by measurement (D306) spends downloads faster than choosing by ear |
| D455 | Replace the three, then finish the planned seven | The schedule in 39.5 already specifies Aqua Alta, Turris, Semina and Corona. The credits exist, the prompts pattern exists, and the download window closes once |
| D456 | Audio returns to the public build **only after** the last free-tier file is gone | Otherwise the unstrip is the moment the licence defect becomes a published licence defect |
| D457 | The bundle goes back to roughly 15 MB and that is accepted | It was stripped for licence, never for weight. Reintroducing a constraint that was never the real one would be cargo cult |
| D458 | ⚠️ **Ordering is the deliverable, not the backlog** | "All of it" exceeds the days available. Phases that each ship standalone mean the deadline chooses the cut instead of the deadline finding a half-built feature |
| D459 | Private until explicitly released | Publication is irreversible in a way that a deployment is not |

---

## 64. The soundtrack shipped, and the game could not hear it

Section 63 planned the regeneration. This is what it actually found, and the
find has nothing to do with music.

### 64.1 Six of seven, and one refusal

Every track was regenerated through the Suno web application on the Pro plan,
Instrumental verified in the DOM each time. Six came back. **Terra Nostra did
not, twice**, and the reason is worth stating plainly: a Cloudflare *"confirm
you are a human"* challenge appeared in front of Create.

⚠️ **That checkbox was not clicked, and would not be under any deadline.**
Asserting personhood from a script is a false statement and defeats a bot
control, and the entire purpose of regenerating was to hold a licence that
survives being asked about. A title acquired by breaching the terms that grant
it is not a title. The soundtrack loader already treats a missing file as an
absent track, so the cost is one empty slot and a line in NOTICE.

The first challenge cleared itself, which is why the other six went through and
why the failure looked random rather than categorical.

### 64.2 The palette was nearly lost, and the library saved it

The prompts for the two existing beds were never written down; PLAN only
recorded the *pattern* ("the 1600 orchestral palette, an explicit `no vocals`,
a BPM"). Rewriting from that description produced generic romantic-orchestral
colours: celesta, horn sections, cathedral film-score brass.

⚠️ The real palette is **early baroque**: viola da gamba, recorder, lute,
sackbut, natural trumpet, renaissance field drums. One generation went out with
the wrong one before this was caught. The exact originals turned out to be
recoverable, because **Suno stores the prompt next to the track**, so the two
beds are now their original prompts verbatim plus a fade, and the four new ones
are written in the same idiom. All seven are in `media/soundtrack-prompts.txt`
so this cannot be lost again.

### 64.3 Takes chosen by measurement, and 39.3 repeating itself

Twelve takes, measured with ffmpeg for length, level, bucket spread, head and
tail, exactly as D306 requires.

| track | picked | why |
| --- | --- | --- |
| Familia Nostra | b | head −24.4 dB: the quiet solo opening the prompt asks for |
| Aqua Alta | a | spread 6.2 against 9.7. A calm bed should not have a build |
| Semina | a | longest, lowest spread, and a −28.7 dB fade |
| Ferrum et Ignis | b | 50 s longer with a wider spread, which is a build |
| **Turris** | **a** | ⚠️ take b is 22 s longer and its **tail is 0.0 dB** |
| Corona | a | both takes poor; the better of two |

⚠️ **Turris is 39.3 happening again.** The longer, more attractive take ends at
full volume and cuts dead into silence, which sounds like the application
crashed. The tail decided it then and the tail decided it now.

Two files were corrected on the way in, which is only permissible because Pro
means they are owned: Ferrum and Turris were **3 dB hotter** than the others and
were pulled down, because a level step between shuffled tracks reads as a fault;
and Corona's dead stop was given a four second fade.

### 64.4 ⚠️ The find: the probe could never have worked in production

With the audio deployed, every file still answered **500**. It was not the
build, and it was not the deploy. It was three separate wrong assumptions about
the host, and the first one alone is fatal:

| assumption | reality on this host |
| --- | --- |
| HEAD tells you if a file is there | **500 for every path**, including `index.html` |
| A missing file fails | **200 with `text/html`**, the single-page app |
| `Range` limits the download | ignored; answers 200 with the whole body |

`audio.ts` and `soundtrack.ts` both probed with **HEAD**. So the soundtrack has
never been findable on the deployed host, and would not have been findable the
moment the files were restored, no matter how correct everything upstream was.

⚠️ **The smoke test agreed with the bug in writing.** Its comment explained the
500 as "the file is absent, because `build:public` strips the audio" and
exempted all of `/audio/*` from failing the run. The exemption was hiding the
evidence, and the explanation was a plausible story that happened to be wrong.

⚠️ **And the lesson was already written down, one file away.** `coach.ts` says:
*"A GET rather than a HEAD ... Some static hosts answer HEAD for every path."*
The same team, the same host, the same week, and the knowledge simply never
crossed from the API client to the audio loader.

The fix is a single shared `audioExists()`: a ranged GET, judged on **content
type** rather than status, aborted as soon as the headers arrive.

### 64.5 The test was mocking a host that does not exist

The soundtrack tests replied `{ ok: false }` for a missing file. No deployment
this game has ever run on does that. The mock now answers the way the real host
does, **200 with `text/html`**, which makes the content-type check the thing
under test rather than an unexercised branch.

### 64.6 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D460 | ⚠️ **A human-verification challenge is never answered by automation** | It is a false assertion of personhood and the defeat of a control the site is entitled to run. One missing track is a much smaller cost than a licence that cannot be defended, which was the entire objective |
| D461 | Prompts are stored in the repository, not just described | The palette was nearly lost to a paraphrase. "The 1600 orchestral palette" is a description; `viola da gamba, recorder, sackbut` is a prompt |
| D462 | ⚠️ **Probe with a ranged GET judged on content type, never HEAD** | HEAD is 500 on every path here and an unknown path is 200 with the app's own HTML, so both the method and the success test were wrong. Either mistake alone silently disables the feature |
| D463 | The probe aborts as soon as the headers land | Measured: six probes now transfer **0 KB**. Without it, answering a yes/no question would pull about 20 MB |
| D464 | ⚠️ **Mocks model the host that exists, not a tidy one** | A mock returning 404 for a missing file tested a world this app never runs in, and it passed for as long as the feature was broken |
| D465 | The smoke exemption is one filename, not a folder | `/audio/*` was broad enough to swallow the audio failing to deploy at all, which is precisely what this test is for. Now only `terra-nostra.mp3` is excused |
| D466 | Level and fade are corrected on the way in | A 3 dB step between shuffled tracks and a track that stops dead are both defects. Editing the files is only legitimate because Pro means they are owned, which is a concrete benefit of the licence change |
| D467 | `MOODS` is a runtime tuple and `Mood` is derived from it | Adding `triumphal` compiled and broke a test holding its own copy of the literals. The list now exists once |

### 64.7 Verified where it ships

1031 tests. Then, in the **deployed** game, from the browser's own resource
timings:

```
anthem / ferrum / aqua-alta / turris / semina / corona    0 KB each   (probed)
terra-nostra.mp3                                         27 KB       (the SPA fallback, rejected)
corona.mp3                                             1750 KB       (playing)
```

The ♪ button is present, which by D304 only happens when a track was actually
found, and it offers to turn the sound *off*. The score is running on the
public URL for the first time.

---

## 65. Somebody finally played it to the end

Every rule in this game has been tested. Until today **nobody had ever
finished a game**, which section 63.4 listed as the cheapest possible answer to
a question nobody had asked out loud: can this thing actually be completed?

It can. The Proctor sets 40 questions, scores them, and the Exam victory fires
and renders. That is the headline and it is genuinely good news.

The rest of this section is what the playthrough showed on the way past.

### 65.1 The victory was hollow, and said so in numbers

The first completed game in this project's history ended like this:

```
VICTORY   The Proctor is satisfied
39 of 40 correct, 98 percent.
1 TURNS        0/41 SKILLS        0 CITIES
```

⚠️ **Turn one. No cities. None of the forty-one skills researched.** Readiness
is computed purely from question mastery, and the Proctor's only gate is
readiness, so the entire empire, the map, the economy and the tech tree are
optional. The premise of the game is that the tech tree *is* the exam, and the
exam does not check whether you touched it.

That is a design question rather than a defect, and it is left open
deliberately. What is not left open is the next part.

### 65.2 ⚠️ The debug harness is a cheat console that ships, and it was silent

`studyAll` grants perfect mastery of all 41 topics. It is how any automated
check reaches the endgame at all, and it is the reason that first run finished
on turn one.

The typed cheat console has always been honest about itself. `runCheat` writes
every code into `state.cheatsUsed`, the end screen reads it, and the comment
above it says a player is *"entirely welcome to use these, and equally entitled
to be reminded that they did"*. The console's own help text goes further:

> None of them can make you ready. Only answering does that.

⚠️ **`studyAll` makes you ready, and recorded nothing.** So the harness offered
a capability the cheat console deliberately refuses to offer, by a route that
left no trace. And `window.__fabricEmpires` **ships on the public URL** — this
whole playthrough was driven against the deployed game from devtools. Anyone
could open the console, call `studyAll(6)`, sit the exam, and be handed a
victory screen certifying that no help was used.

Every harness call that grants something play cannot earn now records itself:
`studyAll`, `grantCompute`, `expireReviews`, `setRank`, `spawnEnemyAdjacent`,
`plantWalledCity`, `showcase`. Calls that merely automate ordinary play
(`clickHex`, `endTurn`, `answerOpen`) are not grants and are deliberately left
alone, and neither are the read-only ones.

### 65.3 ⚠️ Then the disclosure lied, which was worse

Wiring that up produced this, live:

> This empire had help: harness:studyAll. **Your readiness figure did not, and
> never does.**

The second sentence is false. It was a constant, and it could safely be a
constant for as long as the only things disclosed here were typed codes, none
of which can touch readiness. The moment the harness started disclosing itself,
the reassurance became a falsehood printed directly underneath a victory won by
granting exactly the thing it denies.

⚠️ **A disclosure that lies is worse than no disclosure at all**, because it is
precisely the line a sceptical reader trusts at the moment they are checking.
The sentence is now conditional on whether any entry actually reached readiness.

### 65.4 The end screen had no tests at all

There were none. The screen that announces how a game ended, including the one
line on it that is a promise to the player, was never asserted on. There are now
six, and the decisive one would have failed against yesterday's code: with
`studyAll` present, the text must **not** contain "never does".

⚠️ Open, and deliberately not fixed here: **the end screen is entirely in
English inside a German interface.** The screenshot of the first victory reads
`VICTORY / TURNS / SKILLS / CITIES / New empire` with German on every side of
it. `endScreen.ts` imports no translator, and `i18n.ts` carries a stale key,
`'Your readiness did not have help, and never does.'`, which no longer matches
any string in the code. That is a real gap and a bigger change than this item.

### 65.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D468 | ⚠️ **The harness discloses its grants exactly as the cheat console does** | One rule for both doors. The console promises it cannot make you ready; the harness could, silently, on a public URL. The asymmetry was invisible because nothing ever finished a game to look at the end screen |
| D469 | Automating ordinary play is not a cheat | `clickHex`, `endTurn` and `answerOpen` do what a player's hands do. Recording those would make the disclosure noise, and a disclosure that cries wolf is ignored |
| D470 | ⚠️ **The reassurance is conditional, because it stopped being universally true** | It was correct for every typed code and became false for one harness call. Constants that encode a claim about behaviour have to be revisited when the behaviour widens, and nothing forces that but noticing |
| D471 | The end screen gets tests, starting with the sentence that is a promise | Layout can be wrong and merely look bad. This line can be wrong and be believed |
| D472 | The hollow victory is recorded, not patched | Winning on turn one with no empire is a real question about what readiness should require, and answering it by quietly adding a gate would be a design decision smuggled in as a bug fix |

### 65.6 Verified where it ships

1037 tests, 6 new, in 50 files. Then twice through the whole exam in the
**deployed** game, 40 questions each:

```
run 1   39 of 40, 98 percent    disclosed: nothing        <- the bug
run 2   40 of 40, 100 percent   disclosed: harness:studyAll,
                                "That includes the readiness figure,
                                 which was granted rather than earned."
```

---

## 66. Two words, and the assessment that looked in the wrong place

Phase C of the backlog: rename the victory kinds for IP distance. Half an
hour's work, and it found that the document recommending it had checked the
wrong surface.

### 66.1 The rename

`OutcomeKind` was `'defeat' | 'domination' | 'science'`. Both are ordinary
descriptive English used across the whole genre, and both are also the two
words a reader recognises fastest from one particular series. It is now
`'defeat' | 'conquest' | 'mastery'`.

⚠️ Nothing persists an outcome, so there was **no save migration**, which is
what made this cheap enough to do without argument. `tsc -b` found every typed
reference and the test suite found the two string assertions.

### 66.2 ⚠️ "Player-facing text already avoids both words" was false

IP-ASSESSMENT.md filed this as *"internal identifiers, not player-facing
branding"*, and its action item ended with the reassurance above. Both
statements were wrong, and in the same way:

| where | what it said |
| --- | --- |
| `endScreen.ts` | `domination: 'Domination'` as the **victory title** |
| `STORY.md` | "**Domination** and **Science**" as the names of two of the three endings |

The word was the largest text on the screen at exactly the moment a player
would take a screenshot, and it was in the document written to explain the game
to other people. The assessment had checked the **README**, found it clean, and
generalised from one file to "player-facing text".

⚠️ **A rename of the union alone would have left every quotable instance in
place** and closed the item with the problem untouched. The identifier was the
smaller half.

The title is now "The region is yours", which is the second sentence of the
outcome's own summary and says the same thing without borrowing a noun.

### 66.3 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D473 | `'domination'` and `'science'` become `'conquest'` and `'mastery'` | Descriptive, unchanged in meaning, and no longer the two words most associated with one franchise. Free, because outcomes are never serialised |
| D474 | ⚠️ **The displayed title changes too, and mattered more** | The union is read by developers; the title is read by everyone, and is what a screenshot carries. Renaming only the code would have been motion without effect |
| D475 | Internal prose is renamed with the code | Seven comments still called the mechanic Domination. Half-renamed vocabulary costs the next reader more than it saved |
| D476 | ⚠️ **An IP decision gets a test** | Renames are exactly what an autocomplete quietly undoes, and this one is invisible until somebody reaches an ending. The end screen now asserts that neither noun appears in any title |
| D477 | The assessment is corrected in place, wrong claim and all | Deleting the mistaken sentence would lose the actual lesson, which is that checking one file and saying "player-facing text" is a generalisation, not a check |

### 66.4 Verified where it ships

1039 tests, 2 new. Then the **deployed** JavaScript bundle, 1,231,360
characters, searched directly:

```
Domination             absent
domination             absent
The region is yours    PRESENT
Every skill mastered   PRESENT
```

---

## 67. The film was cut to a recording that no longer exists

The report was that the new anthem "does not match the wording shown in the
video". It was two separate faults with the same symptom, and only one of them
was about the song.

### 67.1 The video was already stale

`media/fabric-empires-intro.mp4` is 31.18 s and was written at 11:13. The Pro
anthem was installed at 17:10. So the file still carries the **free-tier**
recording, which is the one thing section 63 established cannot be distributed.
It has to be re-recorded whatever else happens, and until it is, it stays out of
everything. It is gitignored, so nothing has shipped.

### 67.2 The timings were measurements of a performance that got replaced

Section 45 timed the five cards by decoding the anthem and finding where each
sung line begins. Those numbers were correct, and they were correct **about one
specific recording**. Re-generating the anthem replaced it.

⚠️ The new take sings the same words about **1.6 times slower**:

| landmark | old take | new take |
| --- | --- | --- |
| accompaniment enters | 4.60 s | **8.46 s** |
| *Ex nihilo terra surgit* | 5.35 s | **8.99 s** |
| *Flumina viam inveniunt* | 12.44 s | **20.61 s** |
| *Manus parvae, manus magnae* | 18.29 s | **29.44 s** |
| *Simul aedificant* | 24.79 s | **41.52 s** |
| full choir | 30.54 s | **49.76 s** |

So every card was on screen well before its own line: exactly the defect
section 45 existed to fix, arriving again by a different route.

⚠️ **The gap-hunting method that worked the first time does not work here.**
The old take had silences between the lines. This one does not: once the
orchestra is playing, the vocal band never falls quiet, and a silence detector
finds three onsets in the first minute and then nothing. Spectral flux, which
measures how much the spectrum *changes* rather than how loud it is, finds the
phrase starts through the accompaniment.

The mapping was then checked rather than assumed. Stretching the **old** take's
line spacing uniformly onto the new one predicts where each line ought to fall,
and every prediction lands on an independently measured onset:

| line | predicted by stretch | nearest measured onset |
| --- | --- | --- |
| *Ex nihilo* | 8.46 s | 8.99 s |
| *Flumina* | 20.08 s | 20.61 s |
| *Manus parvae* | 29.67 s | 29.44 s |
| *Simul aedificant* | 40.32 s | 41.52 s |

Two independent methods agreeing to about a second is the evidence; either one
alone would have been a guess.

### 67.3 ⚠️ The measurements existed twice

`intro.ts` held them as five `durationMs` values and `intro.test.ts` held them
again as a `SUNG_AT` table. Nothing made the two agree, so the test would have
gone on passing while both disagreed with the music. They are now one exported
`ANTHEM_MARKS`, and the durations are subtractions between marks.

This is the same shape as the `MOODS` duplication in section 64: a list of
facts written down in two places, where the second copy makes the first one
look verified.

### 67.4 ⚠️ Three rules that can no longer all hold

Re-timing broke a test, and the right response was not to move the number
quietly:

- the title card comes up on *Simul aedificant*, at 41.5 s
- every card must be readable, so at least 5 s
- the title must still be up when the choir enters, at 49.8 s
- **the film must run under 45 s**, "so it can be sat through"

The first two alone put the end past 46.5 s. There is no film that satisfies
all four against this recording, because the new take spends 41 s on a verse the
old one sang in 25.

The 45 s figure was itself a property of the replaced recording. What actually
protects the player is that the opening plays **once per new game** (a resumed
empire never sees it, D308) and Esc skips it at any frame. The bound is now a
minute, and the reasoning is written where the number is.

The alternative was cutting the audio. Removing 15 s would mean splicing inside
sung phrases, and an audible join in the piece the game opens with is worse than
twenty seconds of a film nobody watches twice.

### 67.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D478 | ⚠️ **`ANTHEM_MARKS` is the single source of the recording's timings** | They were in two places, and the copy in the test is what made the stale numbers look checked. A measurement written twice is a measurement nobody owns |
| D479 | Phrase onsets are found by spectral flux, not by silence | The first method worked only because the first recording happened to have gaps. Re-using it here would have reported that the song has three lines |
| D480 | The mapping is confirmed by two independent methods | A uniform stretch of the old spacing and a fresh onset detection agree within a second. Either alone is a guess dressed as a measurement |
| D481 | ⚠️ **The film grows to 52.8 s rather than the audio being cut** | An audible splice in the anthem is permanent and central; a longer film is skippable and seen once |
| D482 | The 45 s bound is raised **with its reasoning**, not adjusted | It was unsatisfiable, not merely tight, and it described an artefact that no longer exists. Bounds that get moved silently are how guards die |
| D483 | The stale video is left in place, unpublished, until it is re-recorded | Deleting the only copy of something the author may want, with no replacement ready, is not tidying |

### 67.6 Verified where it ships

1051 tests. Then the **deployed** game, sampling which card is on screen
against the anthem's own clock:

```
Fabrica                     0.14 s   (mark 0)
Ex nihilo                   9.03 s   (mark 8.99)
Flumina viam inveniunt     20.69 s   (mark 20.61)
Manus parvae, manus magnae 29.44 s   (mark 29.44)
FABRIC EMPIRES             up at the 49.76 s choir
```

⚠️ **Still open:** the intro video has to be re-recorded from this build. There
is no committed recorder, so it was made by hand, and the existing file is both
mistimed and carrying audio that cannot be distributed.

**Closed in section 76.** There is a committed recorder now, and the reason it
was open this long is the reason it went wrong: a hand-made recording of a
generated film is a second copy of that film.

---

## 68. The hardest session was the one that taught nothing

Reported: no explanation for right or wrong answers on the DP-600 questions.

### 68.1 It was the exam, and it was never a regression

Ordinary questions go through `presentQuestion`, whose tail is explicit about
its job:

> Teach on the way out, whatever happened. A learner who was wrong sees the
> right answer and the reasoning.

The Proctor's exam does not use it. `faceTheProctor` hand-writes the same
ask, check, score and reveal loop, and it copied everything except the
reasoning: **`explanation: undefined`**, hard-coded. `git log -S` puts that line
in `ff21874`, the commit that introduced the exam, so it has been true for as
long as the exam has existed.

⚠️ Which makes it worse rather than better. The exam is 40 questions, it is
where a learner is most likely to meet something they do not know, and it is the
**only** session in the game that refuses to say why. STORY.md already made
exactly this argument about scoring: the siege "is the hardest study session in
the game and it would be perverse for it to be the only one that does not
count". The same sentence applies to the explanation, and nobody noticed the
second half.

It was not even buying speed. The exam already stops on every question to show
the correct answer and wait for Continue. It was displaying the verdict and
withholding the sentence underneath it.

### 68.2 ⚠️ A third copy of the same shape

This is the third time in one day that a fact lived in two places and the
second copy went stale:

| section | duplicated | what it cost |
| --- | --- | --- |
| 64 | `MOODS`, as a type and as a literal in a test | adding a mood compiled and failed |
| 67 | the anthem's timings, in `intro.ts` and in its test | the test agreed with the code while both disagreed with the music |
| **68** | the ask/reveal loop, in `presenter.ts` and in `main.ts` | the copy silently dropped the teaching |

"Multiple mode" turned out to mean plain multiple choice: every one of the 123
questions in the bank is type `mcq`, and there are no multi-select items at all,
so the multi-answer paths were never involved.

### 68.3 ⚠️ The test proved the cipher, not the path

`decrypts each explanation with its own answer` passes, and it would have gone
on passing through any version of this bug, because it decrypts using the
answer read straight from the source draft.

The application has no draft. It recovers the answer by hashing every candidate
option until one matches, and only then derives the key. So the existing test
proved the ciphertext was well-formed while saying nothing about whether the
game can open it. If `revealCorrectAnswer` ever returned undefined,
`decryptExplanation` would be handed undefined, return undefined **by design**,
and the learner would see nothing at all: no error, no log, green tests.

There is now a second test that walks the route the app walks.

### 68.4 ⚠️ The verification tool destroyed the evidence

After deploying the fix, the live check still reported no explanation. It was
tempting to conclude the fix had failed.

`answerOpen` does not stop at Submit. It then hunts for **Continue and clicks
it**, on purpose, because a test that stopped at Submit once left research
frozen at 12/12 Compute forever. In the exam that immediately loads the next
question, so the reveal it was meant to prove existed was gone within 50 ms of
appearing. The earlier reading of an ordinary question only worked because
nothing replaces the modal there.

The observation was an artefact of the instrument. Answering by hand, and
deliberately **not** pressing Continue, shows the explanation exactly as
intended.

### 68.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D484 | ⚠️ **The exam explains itself, like every other question** | It is the session with the most wrong answers in it and it was the only one that withheld the reason. It already paused to show the verdict, so this costs nothing that was not already being spent |
| D485 | The explanation is decrypted from the **recovered** answer, not assumed | It is encrypted under its own answer, so it can only be opened after the answer has been brute-forced back out. Ordering matters and is now the same in both paths |
| D486 | ⚠️ **A test walks the app's route, not an equivalent one** | Decrypting with the source draft proves the cipher. Decrypting with what `revealCorrectAnswer` actually returns proves the feature. Only the second one would have failed if the reveal broke |
| D487 | ⚠️ **A harness that auto-advances cannot be used to observe what it advances past** | `answerOpen` clicks Continue by design, which makes it correct for driving a playthrough and useless for inspecting a reveal. Reading its output as evidence would have reverted a working fix |

### 68.6 Verified where it ships

1052 tests, 1 new. Then the **deployed** exam, answering by hand and leaving the
reveal on screen:

```
A connection carries its own permissions, separate from the workspace. Being
able to see that a connection exists is not the same as being allowed to use
it; the owner has to share it. Connections are not tied to a capacity, are
shareable rather than private to their creator, and do not need duplicating
per workspace.
Read the documentation   B1  Create a data connection
```

That was a **wrong** answer, chosen blindly, which is the case that matters.

---

## 69. Eight panels, four corners, one phone

The HUD is eight panels pinned to the four corners of the window at fixed pixel
widths, between 272 px and 330 px. That is a good desktop layout and it does not
degrade on a phone, it collapses: measured on a 390x844 viewport, the research
panel covered the top bar, the threat list ran off the right edge mid-word, the
unit panel and the log overlapped each other, and the map was a sliver between
them.

Smaller text would not have fixed it. Four corners is simply not a layout that
exists on a 390 px screen.

### 69.1 The board keeps the top, the HUD becomes a column

The map takes the upper **56vh**, because a strategy map you cannot see is not
a game, and every panel moves into one scrolling column underneath it.

⚠️ **The panels needed a parent to do that**, and they had none: they were
siblings of the canvas, so there was nothing to scroll and nothing to lay out.
They are now wrapped in `#hud`, which is **`display: contents` on a wide
screen**. That makes the wrapper vanish from layout entirely, so every existing
`position: fixed` corner rule still applies and **the desktop HUD is byte for
byte the layout it was**. Only the narrow breakpoint turns it into a real flex
column.

### 69.2 ⚠️ The canvas was sized from the window, not from itself

`viewportSize()` returned `window.innerWidth/innerHeight`, and `fitCanvas`
wrote that straight onto the canvases. So CSS would have shrunk the board to
56vh while the renderer kept drawing a full-height world into it, squashing the
scene, and the effects overlay would have stretched across the interface below.

It now measures the board element. three.js is already told
`renderer.setSize(w, h, false)`, which means **CSS owns the display size**, so
reporting what CSS decided is both correct and keeps the breakpoint in exactly
one place. On a wide screen the element is `100vw x 100vh`, so the number is
identical to before and nothing changes.

⚠️ `touch-action: none` on the map matters more than it looks. Every pointer
handler was already correct; without this line a drag scrolls the page instead
of panning the camera, so the map is unusable by touch for a reason that has
nothing to do with the code that handles touch.

### 69.3 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D488 | ⚠️ **`#hud` is `display: contents` on desktop** | It buys a parent for mobile layout while leaving the desktop HUD provably unchanged. A wrapper that participates in layout would have moved eight panels nobody asked to move |
| D489 | The map keeps 56vh rather than being pushed off | Every alternative that fits the panels comfortably does it by making the board too small to play on. The panels scroll; the board does not |
| D490 | ⚠️ **The renderer measures the board, not the window** | They were the same number until the day they were not, and the failure would have been a squashed world rather than an error |
| D491 | `touch-action: none` on the canvas | The one line between "every pointer handler works" and "the map cannot be moved on a phone" |
| D492 | 44 px minimum on anything tappable | Below that a finger misses, and the answer buttons are the whole interface during a question |

### 69.4 Verified where it ships

1052 tests and the smoke test. Then measured in a 390x844 viewport: map at
`top 0, height 473`, HUD at `top 473, height 371`, no overlap anywhere, and the
setup screen, the opening film and the in-game HUD all readable in one column.

---

## 70. The unit table was a statement about DP-600

Asked for: Erste Klasse playable in single-player, not only as the second seat
in co-op. This section is the blocker being removed. The feature itself is not
finished and 70.4 says exactly what is left.

### 70.1 Why it was not simply a menu entry

The course picker is hidden when `players === 1`, so a solo player always gets
DP-600. Showing it would not have been enough, and the reason is worth writing
down because it looked like a one-line change:

- Erste Klasse is `role: 'questions'`, which exempts it from the world rules.
- It has **24 topics**; a world needs **41**.
- It has **0 antagonists**; a world needs one per cluster, and it has 7.

⚠️ And the obvious shortcut is a trap. Pointing the solo presenter at the
Klasse 1 bank while keeping the DP-600 world means `selectQuestion` is asked
for a DP-600 topic from a bank that has none, returns undefined, and the
presenter *"resolves neutral without troubling the player"*. The game would
stop asking questions and score zero, silently. That is the locked door of
section 58 again.

⚠️ Rewriting the topic id on the way in is worse. `Dp600ChallengeProvider.present`
records mastery under `request.topicId` **before** calling the presenter, so a
six-year-old's answers about Anlaute would land on DP-600 topics and corrupt
the readiness figure. That is precisely what the second seat was given no
mastery tracker to prevent.

So a solo Erste Klasse game has to be a **Klasse 1 game**: its own topics, its
own antagonists, its own exam. Everything already keys off the campaign. The
one thing that did not was the army.

### 70.2 The ladder, read as an index

`unlockedBySkill` is a 1-based index into the topic graph, and `unitUnlocked`
read it literally: `nodes[skill - 1]`.

⚠️ That quietly made the entire unit table a statement about **one
curriculum**. DP-600 has exactly 41 topics and the last unit unlocks at exactly
41, so it worked, and it worked *only because those two numbers were equal*. A
24-topic tree can never unlock anything gated above 24: `unitUnlocked` returns
false forever and nothing anywhere says why.

It is now a position on a ladder, scaled onto whatever length the campaign
actually has. For a graph the length of the ladder the arithmetic is the
identity, which is the property that made it safe to change and which is now
asserted rather than assumed.

### 70.3 ⚠️ A float divide broke the identity immediately

Written the natural way round, `(skill / ladder) * nodes.length`, the identity
case stops being the identity: 12/41 is not representable, `12/41*41` comes
back as `12.000000000000002`, and `Math.ceil` turns that into 13. **Every unit
unlocked one topic late on the one campaign the change was supposed to leave
untouched.** An existing test caught it on the first run.

`(skill * nodes.length) / ladder` stays exact whenever the two lengths agree.

### 70.4 ⚠️ What is still missing

The engine no longer objects to a short curriculum. Erste Klasse is still not
selectable solo, and finishing it needs:

1. **Seven antagonists** for `M1 M2 M3 D1 D2 D3 D4`, in German and pitched at a
   six-year-old. D213 already sketched the idea with *Die Zahlendreher*.
2. **`role: 'world'`** on the campaign once it has them.
3. **The world built from the chosen campaign.** `newGame` currently takes
   `provider.topics()` and `rosterFor(ANTAGONISTS, ...)`, both DP-600, and the
   provider is a module-level singleton constructed once. Switching campaign
   per game is a real refactor of that seam, not a parameter.
4. **The course picker shown when `players === 1`.**

⚠️ Step 3 is where the readiness figure lives, and a mistake there is silent.
It is deliberately not being rushed at the end of a long session.

### 70.5 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D493 | ⚠️ **`unlockedBySkill` is a rung on a ladder, not an index** | Read as an index it encoded "the curriculum has 41 topics" into every unit, which is the assumption D211 said the boundary existed to prevent. Nothing outside DP-600 could ever field a full army |
| D494 | The identity for a ladder-length graph is asserted, not assumed | It is the entire safety argument for the change, and it broke on the first attempt from a floating-point divide |
| D495 | Multiply before dividing | `(skill * nodes) / ladder` is exact where `(skill / ladder) * nodes` is not, and the difference is a whole unlock step |
| D496 | ⚠️ **A short course does not get the DP-600 world with different questions** | The bank has no question for a DP-600 topic, so the presenter would resolve neutral and the game would quietly stop asking. Remapping the topic instead corrupts mastery, which is the figure the product exists to produce |
| D497 | The remaining campaign-switch is left for its own pass | It rebuilds a module-level singleton that owns the readiness pipeline. Half of that, written tired, is worse than none of it |

### 70.6 Verified

1056 tests, 4 new. A 24-topic tree now unlocks every unit by its last topic,
unlocks none of the gated ones with no research, and keeps the Pipeline Runner
ahead of the Direct Lake Titan. The 41-topic case is unchanged, unit by unit.

---

## 71. Fullscreen, and a skier

A fullscreen toggle, in the resource bar beside the sound switch and the
language pair, plus `v` for Vollbild.

### 71.1 The parts that are decisions rather than API calls

**The whole document, not the canvas.** Fullscreening the map alone would leave
the player looking at a beautiful world with no way to end their turn. The HUD
is part of the game.

**Hidden unless the browser actually has it.** `requestFullscreen` does not
exist on an iPhone at all. The button follows the sound switch's contract
(D304): a control that visibly does nothing is worse than no control, because
the player presses it, sees nothing happen, and starts distrusting everything
else on the screen.

**`v`, not `f`.** Free flight already spends `r` and `f` on spinning the
camera. A key that means two different things depending on a mode the player
may not know they are in is worse than an unmemorable one.

**Repaint from the event, not from the click.** F11, Escape and the browser's
own chrome all leave fullscreen without going through the button, so
`fullscreenchange` is the only honest source of truth for what the label says.
Verified by exiting through the API and watching the title reset itself.

⚠️ **A refusal is not an error.** Chrome rejects the promise when the gesture
is stale and Firefox when the page is unfocused. Both are caught, and the
interface then describes the state the browser is in rather than the one it was
asked for.

### 71.2 ⚠️ The bug no test could have caught

The first version swapped the glyph: `\u26F6` to open out, `\u26F7` to close
in. It typechecked, it passed 1056 tests, and it put a **skier** in the
resource bar. U+26F7 is SKIER.

Nothing in the suite knows what a code point looks like, and nothing ever will.
It was found by reading the rendered `textContent` back out of a real browser
rather than trusting the source, which is the only way that class of mistake
ever surfaces.

The sound switch had already solved it properly: keep one recognisable glyph,
mark the state with a CSS class, and let the translated title carry the
sentence. Fullscreen now does the same, which also means one fewer character to
get wrong.

### 71.3 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D498 | The document goes fullscreen, not the canvas | A map with no interface is a screensaver |
| D499 | The button is hidden where the API is absent | Same rule as the sound switch. iOS has no Fullscreen API on a phone, and pretending otherwise teaches the player that controls here are decorative |
| D500 | ⚠️ **`v`, because `f` already means something in free flight** | Mode-dependent keys are how an interface earns a reputation for randomness |
| D501 | The label follows `fullscreenchange`, never the click | F11 and Escape bypass the button entirely, and a label describing a state the browser left is a lie the player can see |
| D502 | ⚠️ **One glyph and a class, not two glyphs** | The two-glyph version shipped a skier. State belongs in CSS and meaning belongs in the translated title, where both are already solved |

### 71.4 Verified where it ships

1056 tests and the smoke test. Then in a real browser, because a gesture is
required and rendering is the thing in question:

```
click        -> fullscreenElement = HTML, title "Vollbild verlassen", class "on"
exitFullscreen() -> title back to "Vollbild", class cleared   (the F11 path)
v            -> on
v            -> off
v in the seed field -> nothing, correctly
```

---

## 72. The defender stops being a number

Section 19.4 and D143: *"today the defender is a number; in Stronghold the
defender is the more interesting side to play"*. Attacking a city has been a
decision since section 59. Defending was one question and then arithmetic, so
half of every siege was a spectator sport.

Three stances, and each one loses something:

| stance | strength | fortification | counter |
| --- | --- | --- | --- |
| **Hold** | 1 | 1 | 1 |
| **Sally** | 0.85 | **0** | 1.8, floor 1 |
| **Brace** | 1.35 | 1.6 | **0** |

⚠️ **"Wait it out" from 19.4 is deliberately absent.** It needs the multi-turn
siege state of 19.5 step 2, which was cut and carries its own cut trigger. A
stance that silently did nothing would be worse than three that do something.

### 72.1 ⚠️ Two of the three numbers were wrong, and measurement said so

The first draft was written by reasoning about what each stance *should* feel
like. Both non-default stances came out broken, and neither would have been
obvious from reading the code:

- **Brace was strictly worse than holding.** Its toughness lived entirely in
  `fortifyShare`, so against an unwalled target it was a pure strength penalty:
  **100 damage taken against holding's 98**. A stance that is never worth
  picking is a lie in a menu.
- **Sally cancelled its own risk.** Written with `strength: 1.3` it made the
  defender harder to hurt *and* hit harder at once, and `chooseStance` picked
  it in every situation it was offered. A stance the AI always takes is a
  default with extra steps.

Sally's strength is now **below 1**, which says the true thing: you left a
prepared position and you are standing in the open. Brace's toughness moved
into `strength` so it means something without a wall.

⚠️ A third apparent bug was my own test: comparing `100 - hp` against the
preview reads as a preview/resolve split when the counter kills the attacker
and there is nothing left to subtract from.

### 72.2 The choice is asked before the question

The banner names the attacker, then the stance is asked, then the question.
The question decides how *well* the defence goes; the stance decides what kind
of defence it is, and asking after the answer is known would make it a
formality.

Asked on every raid rather than only against walls, which is where the
attacker's dialog draws its line. They differ because storming a wall that is
not there is not a choice, but a defender always has one: a unit in the open
can still brace or come out.

### 72.3 ⚠️ "Das Ziel ist your Profiler"

The dialog worked on the first try in the deployed game and immediately showed
a bug that had nothing to do with it. The target was built as
`` `your ${label}` `` in English and spliced into a translated sentence, so a
German player read **"Das Ziel ist your Profiler"**. The raid banner above it
was worse: `${faction} is attacking` was never translated at all.

The possessive is gone rather than translated, because *dein* and *deine*
depend on a gender the unit table does not carry.

⚠️ The plural needed two keys rather than one with a conditional `s`. English
pluralises by appending a letter and German does not: the plural of *Front* is
*Fronten*, so a string with an `s` glued on by JavaScript cannot be right in
both, and the language that loses is whichever nobody proof-read.

### 72.4 ⚠️ The root cause: a list of eight filenames

The i18n test checks that every literal handed to `t()` has a German
translation. It found nothing wrong, because it scanned a **hand-written list
of eight files** and `ui/raidAlert.ts` was not on it.

A file that calls `t()` nowhere contributes no literals, so a hand-kept list
cannot notice that an entire module was never translated. That is the same
failure as the duplicated moods, the duplicated anthem timings and the
duplicated ask-and-reveal loop: a fact maintained in two places, where the copy
makes the original look checked.

The list now walks the tree: **8 files became 42**, and `ui/raidAlert.ts` was
the one newly covered file that translates anything, which is exactly the file
that was silently English.

### 72.5 ⚠️ The counter was applied and never mentioned

Sallying promises "you hit back far harder". The engine did it, and the log
said nothing, so the one stance whose entire point is the counter was
indistinguishable from holding.

This is section 55 again: a rule that is correct, tested, and invisible where
it ships. The line right below it in the same function already made the
argument for the *answer*, that "the connection is invisible if it is never
stated", and the stance simply never got the same courtesy.

### 72.6 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D503 | Three stances, each losing something | A stance that is only "tougher" collapses into "always pick the toughest". Sally throws away the wall you paid for; brace can never end a siege, only postpone it |
| D504 | ⚠️ **Sally's strength is below 1** | Above 1 it made the defender harder to hurt while hitting harder, so it cancelled its own risk and the AI took it every time |
| D505 | ⚠️ **Brace's toughness is in `strength`, not only `fortifyShare`** | With the bonus in the fortification alone it did nothing for an unwalled defender and measured *worse than holding* |
| D506 | `counterFloor`, so a sallying city counters at all | Cities counter only against escalade, so multiplying the existing counter would multiply zero and the option would read as broken |
| D507 | The stance is asked before the question | Committing after the answer is known is not a decision |
| D508 | ⚠️ **The i18n scan walks the tree instead of listing files** | The list is what failed. An untranslated module is invisible to a test that only inspects files somebody remembered to add |
| D509 | Two plural keys, never a conditional letter | *Fronten*, not *Fronts*. A suffix glued on in JavaScript can only be right in one language |
| D510 | ⚠️ **The counter is reported** | It was being applied the whole time, which is the worst version: a mechanic that works and cannot be seen is one nobody uses |

### 72.7 Verified where it ships

1056 tests. Then the **deployed** game, same attacker, two stances:

```
Sally   "Deine Verteidiger schlugen fuer 43 zurueck."
        "A raider from The Silo Horde was destroyed."
Brace   raided for 10, then 13, then 14.  No counter line at all.
```

Brace takes roughly a third of the damage and returns nothing; sally returns 43
and kills raiders. The trade is real and the player can see it.

---

## 73. The screen you look at most was in the wrong language

Section 72 found `ui/raidAlert.ts` sitting untranslated because the i18n test
scanned a hand-written list of files. Widening the scan to the whole tree fixed
the *list*. It did not find the rest of the problem, and this section is the
rest of the problem.

### 73.1 ⚠️ The test could never have found these

Every check in `i18n.test.ts` inspects strings handed to `t()`. A string
assigned straight to `textContent` never reaches `t()`, contributes no key, and
is therefore **invisible to a test whose entire subject is keys**.

Two files had no `t()` call at all:

| file | what a German player read |
| --- | --- |
| `ui/questionModal.ts` | `THE PROCTOR`, `research`, `Pause`, `Submit`, `Correct, and quickly`, `Not quite`, `Read the documentation`, `Continue` |
| `ui/endScreen.ts` | `VICTORY`, `turns`, `skills`, `cities`, `New empire`, and the cheat disclosure |

⚠️ The question modal is **the screen a player sees more than any other**: it is
where every single question in the game is asked and answered. It was in
English, in a German game, and 1056 tests were green.

⚠️ Worse, `request.kind` was rendered raw for anything that was not the
Proctor, so the header of that screen said the literal identifier **`research`**.

### 73.2 ⚠️ Translating the buttons would have broken the harness

`answerOpen` found the submit button with `b.textContent === 'Submit'`.

That worked for exactly as long as the interface was English. Translating the
modal would have silently broken every automated playthrough in German, and the
symptom would have been `answerOpen` returning `undefined`, which its own
comment already warns has two very different causes.

It is the same mistake as keying a Suno selector on a placeholder that rotates:
**automation must not depend on the words a player reads**, because those words
have a job and doing it changes them. The three action buttons now carry
`data-act="pause|submit|continue"` and the harness matches on that.

### 73.3 The guard that would have caught it

Widening the file list was necessary and insufficient: a module with no `t()`
still contributes nothing to check. So the test now looks for **the opposite of
a translation** as well, prose reaching `textContent` on a line that never
mentions `t(`.

It found three more on its first run, including the blurb on the **first screen
of every game**, which was a hardcoded English copy of the campaign's own
`blurb` field.

⚠️ Known gap, deliberately left: the mastery victory summary interpolates the
topic count in the **engine**, so it arrives already assembled and cannot be
looked up. Translating it means the engine emitting a key and its parameters
rather than finished prose, which is a bigger change than this one.

### 73.4 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D511 | ⚠️ **The test hunts untranslated prose, not only missing keys** | Every check it had inspected `t()` calls, so a file that never called `t()` was perfectly invisible. Widening the file list in section 72 did not help, because the problem was never which files were read |
| D512 | ⚠️ **Automation keys on `data-act`, never on the label** | A visible word is a thing that changes. Translating the modal would have broken every playthrough in German and reported it as "no modal open" |
| D513 | `request.kind` is mapped to words, not printed | A header reading `research` is a leaked identifier in any language |
| D514 | "Pause" joins the list of words that are the same in German | The identical-translation check is right to be suspicious, and the way to answer it is a named exception rather than a worse word |
| D515 | Engine summaries are translated on the way to the screen | The engine writes canonical English (D35 keeps it ignorant of language), so `t()` at the boundary is the existing rule, and it degrades to English rather than to nothing |

### 73.5 Verified where it ships

1057 tests, 1 new. Then the **deployed** game in German:

```
DER PRÜFER          (was THE PROCTOR)
Abschicken / Weiter (data-act=submit / continue)
Nicht ganz          (was Not quite)
Zur Dokumentation   (was Read the documentation)

SIEG
Der Prüfer ist zufrieden
40 von 40 richtig, 100 Prozent. Der Prüfer hat keine Fragen mehr.
5 RUNDEN   1/41 FÄHIGKEITEN   0 STÄDTE
Dieses Reich hatte Hilfe: ... Dazu gehören die Lernwerte, die geschenkt
und nicht verdient wurden.
Neues Reich
```

⚠️ And **40 questions answered through `answerOpen`** afterwards, which is the
proof that the harness survived its own labels being translated.

---

## 74. Auditing the learning loop, and finding it sound

Phase E of the backlog, and the part a certification-prep contest is actually
judging. Ten sections went to the siege; this one goes to the premise.

⚠️ **The verdict is that it works**, which is an uncomfortable thing to report
after a day of finding faults, so everything below is a measurement rather than
a reassurance.

### 74.1 What was measured

| question | result |
| --- | --- |
| Does every skill have questions? | **41 skills, 123 questions, exactly 3 each.** No uncovered skills, no singletons |
| Is the difficulty spread? | tier 1: 47, tier 2: 42, tier 3: 34 |
| Is readiness weighted by the exam? | Branch A 25-30% holding 27% of skills, B 45-50% holding 44%, C 25-30% holding 29% |
| Do the endpoints hold? | 0.000 with nothing known, 1.000 with everything strong |
| Does the SM-2 ladder climb? | 1d, 6d, 17d, 49d, 147d; familiar at two correct, strong at four |
| Does a lapse cost? | 49d collapses to **1d**, easiness 2.9 to 2.36. A timeout is harsher still, 2.1 |
| Does a review return inside one sitting? | Due **2 minutes** into the session, via the compressed clock |

The lapse behaviour is the one I would have most expected to be soft, and it is
not: a single wrong answer on an item at 49 days sends it back to one day and
permanently lowers its easiness, which is SM-2 being properly unsentimental.

### 74.2 ⚠️ Two things I got wrong while auditing

Both are worth recording, because both are traps sitting in the code for the
next person.

**`dueAt` measures the real calendar, not the session.** Reading the loop
through it says an item reviewed now is due *tomorrow*, which looks exactly
like the compressed session clock not working. It is working; `dueAt` simply is
not the function that knows about it. `isDue` takes `sessionStart` and honours
both clocks. `dueAt` now says so in its own doc comment, because a working
feature that measures as broken is how a correct thing gets "fixed".

**Readiness ignoring research looked like the hollow victory of section 65.**
The live game reports `readiness 1.0` with **1 of 41 topics researched**, which
reads as a headline number that does not watch the game.

⚠️ It is deliberate, and it is tested: `library.test.ts` has *"separates what
was researched from what is retained"*, on the grounds that ten researched and
nothing retained should be two numbers rather than one blended score. That is
right. Unlocking a topic is not knowing it, and only answering questions moves
retention.

So the finding is narrower than it first appeared, and it is a question rather
than a defect: **should the Proctor gate on research as well as readiness?**
Today an empire that has built nothing can sit the exam. Section 65 recorded
the same thing from the victory side and left it open on purpose (D472), and it
stays open here for the same reason: adding a gate is a design decision, not a
bug fix.

### 74.3 Nothing was added, deliberately

Every property measured above already has a test: coverage in
`questions.test.ts`, the weighting and both endpoints in `library.test.ts`, the
ladder and lapses in `sm2.test.ts`, and the compressed clock in
`sm2.test.ts` under *"the compressed in-session clock"*.

⚠️ Writing a second set would have been exactly the duplication this project
spent the whole day removing: moods in two places, anthem timings in two
places, an ask-and-reveal loop in two places, a translation file list in two
places. An audit that ends by copying the tests it just read has understood
nothing.

### 74.4 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D516 | The audit adds no tests, because the properties are already tested | Duplicating a passing assertion buys confidence in the auditor, not in the code |
| D517 | ⚠️ **`dueAt` documents that it is the real clock only** | Measuring the loop through it makes a working feature look broken, which is the specific way a correct thing gets changed by someone being careful |
| D518 | Research and retention stay separate numbers | Already the tested design, and right: unlocking a topic is not knowing it. Blending them would let an empire buy its way to a readiness figure |
| D519 | ⚠️ **Whether the Proctor should require research stays open** | It is the same question as the hollow victory in 65 and has the same answer: gating the exam on empire progress changes what the game is about, and that is the author's call |

---

## 75. The first screen opened halfway through itself

### 75.1 What this was meant to be

A judge will never read the README. The repository is private and nothing is
being submitted; the only thing a judge sees is the deployed URL. So the
explaining has to happen inside the game, on the screen that opens first.

The plan was small: a box on the setup screen, "If you only have five minutes",
with the three sentences that make the game legible.

- Every advance is a question. Pick a topic, answer it, and the next units unlock.
- Attack a walled city. You choose how to go in, and the defender chooses how to meet you.
- At 100 percent readiness the Proctor sets a 40 question exam. Passing it wins the game.

That took a few minutes. The rest of this section is about the fact that
**nobody would have seen it**, and that finding out was worth more than the box.

### 75.2 The box was rendering, and it was 319 pixels above the ceiling

The DOM said the block existed, contained the right German text, and stood
175 pixels tall. Everything a "did it render?" check asks for, it answered yes.

Then the measurement that mattered:

```
setup.scrollTop     0
setup.scrollHeight  1293
setup.clientHeight  800
tryBox.top       -319
```

Scrolled fully to the top, the box was 319 pixels **above** the top of the
screen. So was the blurb. So was the title. `scrollIntoView({block:'center'})`
did nothing at all: top stayed at -319.

The cause is a CSS behaviour that is easy to state and easy to forget:

> `align-items: center` on a scrolling container does not centre a child
> taller than the container. It clips it at the **top**, and the clipped part
> is unreachable, because the overflow sits above the scroll origin.

The game had shipped with its own title unreachable at 800 pixels of height.
This was not caused by the new box. The box made the card tall enough to
cross the threshold, which is a different thing: it was a latent bug with a
trigger, and the trigger was "add three sentences".

### 75.3 The same pattern, in four places

Grepping for the shape found `align-items: center; justify-content: center` in
four overlays. The other three were **worse**, not better: none of them set
`overflow` at all, so a tall card would be clipped at both ends with no
scrolling possible in either direction.

| Overlay | Scrolls? | Risk |
| --- | --- | --- |
| `.fe-setup` | yes | the measured bug |
| `.fe-choice` (stance, attack plan) | no | three options with descriptions on a short screen |
| `.fe-end` | no | title, summary, stats, cheat disclosure |
| `.fe-backdrop` (question modal) | no | ⚠️ **the tallest thing in the game** |

The question modal is a stem, four options, a verdict, an explanation and a
documentation link. It is also the screen the player sees most often, and the
one that just became reachable on a phone in section 69. Measured after the
fix, on a 390x700 viewport, an answered question is **811 pixels tall in a
700 pixel viewport**. Before the fix that overflow had nowhere to go.

The canonical repair, applied to all four: `align-items: flex-start` on the
container plus `overflow: auto`, and `margin: auto` on the card so it still
centres whenever there is room for it.

### 75.4 Then the screen scrolled itself to the bottom anyway

With the clipping fixed, the setup screen still opened wrong:

```
openedAtScrollTop  1086   (of 1786)
```

Reachable now, but the reader arrived at the bottom. The cause is one line at
the end of the builder:

```ts
play.focus();
```

Focusing the play button is what makes Enter start the game, which is worth
keeping. But the button is the last thing on the card, and `focus()` scrolls
the focused element into view. On a card taller than the screen, focusing the
final button **is** a scroll-to-bottom command. The first screen of the game
opened halfway through itself.

The same line existed in the question modal, where it is worse than cosmetic.
`continueButton.focus()` fires the moment the player answers, so at 390x700
the modal top went to **-127**: the player was shown the bottom of the
explanation at the exact instant they should have been reading the verdict.
The verdict is where the game teaches. It was scrolling past it.

The fix keeps the keyboard affordance and drops the side effect:

```ts
continueButton.focus({ preventScroll: true });
backdrop.scrollTop = 0;
```

### 75.5 Twice in one session is a rule, not a coincidence

This is the same failure as the duplicated-fact family in 64, 67, 68, 72 and
73, wearing different clothes. There, a fact lived in two places. Here, a
single call does two things, one of them invisible, and the invisible one only
misbehaves once some other change makes the container tall.

So it gets a test rather than a third comment. `app/test/overlays.test.ts`
asserts two mechanical properties across `app/src/ui`:

1. no `.focus(` without `preventScroll` (excluding `scene.focus(`, which is a
   camera move, matched by shape rather than by filename so the rule survives
   the code moving);
2. no `position: fixed` block that sets `overflow: auto` and still uses
   `align-items: center`.

It has the "did the scan cover anything?" guard that section 73 taught, and it
found two more offenders on its first run, in `cheatConsole.ts` and
`coachPanel.ts`. The coach one is a real bug in miniature: focus returns to the
input when a reply arrives, which yanks the reader back down from the reply
they were reading.

### 75.6 Verified

On the deployed build, not locally.

| Check | Before | After |
| --- | --- | --- |
| Setup screen opens at | scrollTop 1086 of 1786 | **scrollTop 0** |
| Title at scrollTop 0 | top -319, unreachable | **top 51, visible** |
| Guided path box | unreachable | **top 174, visible** |
| Answered question, 390x700 | modal top -127 | **top 16, scrollable** |
| Enter still starts / continues | yes | **yes**, focus unchanged |

Tests 52 files green.

### 75.7 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D520 | The judge-facing explanation goes in the game, not the README | The repo is private and nothing is submitted, so the deployed URL is the entire surface a judge sees |
| D521 | ⚠️ **Scrolling overlays anchor with `flex-start`, never `center`** | Centring clips a too-tall child at the top, where it cannot be scrolled to. The game shipped with its own title unreachable at 800px |
| D522 | `margin: auto` on the card keeps the centring that was wanted | The intent was never wrong, only the mechanism. An auto margin resolves to 0 exactly when there is no room, which is precisely when centring must stop |
| D523 | All four overlays fixed, not just the one that broke | The other three could not scroll at all, so they were the more dangerous version of the same bug, waiting for content to grow |
| D524 | ⚠️ **`focus({ preventScroll: true })` plus an explicit scroll position** | Focus is a keyboard affordance that quietly doubles as a scroll command, and the thing we focus is always the last button on the card |
| D525 | ⚠️ **The verdict scrolls to the top, not the Continue button** | The explanation is the moment the game teaches. Answering a question and being shown the bottom of the answer is the learning loop failing silently |
| D526 | The rule becomes a test, because this bit twice in one session | Two unrelated files, one cause, one afternoon. A comment would have been the third place to not read |

---

## 76. The film was made by hand, so it drifted

### 76.1 The last free-tier artefact

`media/fabric-empires-intro.mp4`: 31.18 seconds, 1600x900, written at 11:13,
with an **AAC audio track baked into it**. The Pro anthem was generated at
17:10. So the trailer was wrong in two independent ways at once.

**Mistimed.** The Pro take runs about 1.6 times slower through the same words.
The recording was cut to a performance that no longer exists, which is the same
fault section 67 fixed inside the game and did not fix outside it. 31 seconds
is almost exactly where the *old* chorus landed, at 30.54 s.

**Unlicensed.** Free-plan output is licensed for non-commercial use, and Pro
ownership is explicitly not retroactive. `NOTICE.md` already said, in its own
words, that "nothing that predates the subscription survives anywhere in this
project" and then, four sections further down, said the trailer inherited
non-commercial terms. One document, two hand-maintained facts, and only one of
them could be true.

Neither fault was visible. The file played perfectly.

### 76.2 The fix is not "record it again more carefully"

A hand-made recording of a generated film **is a second copy of that film**.
That is the whole diagnosis, and it puts this in the same family as sections
64, 67, 68, 72, 73 and 75. Recording it again by hand would produce a correct
file and leave the mechanism that made it wrong entirely intact, ready for the
next time the anthem or the shots change.

So the deliverable had to become derivable. `tools/media/record-intro.mjs`,
run with `npm run record:intro`, drives the real game and captures the real
sequence. Two properties do the work, and both are structural rather than
matters of care:

**⚠️ It contains no timing constants. Not one.** The film is driven by the
anthem's own playback clock, so the recorder watches the running game instead
of being told what to expect: it starts when the anthem's clock first moves and
stops when the letterbox closes. `ANTHEM_MARKS` can be re-measured, and beats
can be added or removed, without this script knowing. Had it hard-coded 52 800
it would have become the fourth copy of a number that has already been wrong
twice.

**⚠️ The audio is the shipped file, not a re-recording.** Playwright captures
video with no audio track whatsoever. That sounds like a limitation and is
actually the guarantee: the only way sound can reach the deliverable is by
being muxed in from `app/public/audio/anthem.mp3`, the exact file the game
serves to players. There is no path by which a stale or free-tier take arrives.
The licence is now correct by construction rather than by vigilance.

### 76.3 The two clocks had to be pinned together, and wall-clock could not do it

The film and the song are one performance, so the mux is only right if the
audio starts on the frame the film did. The first instinct, timing from when
the recording was started, is wrong by an amount nobody can predict: capture
does not begin when the context is created, and encoder start-up is not free.

Measured on the actual run:

```
anthem starts at   video t = 5.92 s
raw capture length         61.56 s
```

Nearly **six seconds** of lead-in. Wall-clock arithmetic would have put every
card six seconds ahead of its line, which is a far worse version of the bug
being fixed.

So the page paints itself white for 140 ms at the instant the anthem's clock
first moves, and reports what that clock said. The flash is a timestamp written
in the only ink a video recorder can read. `signalstats` finds the bright
frames afterwards, and the two clocks are pinned on a known frame:

```
flash          5 frames, 5.920 s .. 6.080 s
anthem at flash                     0.004 s
=> trim video from 6.080 s, audio from 0.164 s
```

### 76.4 Verified by measurement, not by watching it

The six cards were sampled 1.6 s after each mark. Every one carries its own
line, in order, in English, and FABRIC EMPIRES is still on screen at the 49.76 s
choir, which the film's own contract requires.

The audio was then identified rather than assumed. Cross-correlating the
video's own audio track against `anthem.mp3`, with an unrelated soundtrack file
as a control:

| compared with | best lag | peak correlation | envelope correlation |
| --- | --- | --- | --- |
| `anthem.mp3` (the file the game serves) | **-3 samples (-0.4 ms)** | **0.9990** | 0.9999 |
| a different track (control) | +918 samples | -0.0095 | 0.3959 |

So the audio is provably the Pro anthem, and the film and the song are aligned
to **0.4 milliseconds**. That is the flash marker paying for itself: the number
is not "close enough", it is exact to well under a frame.

### 76.5 ⚠️ The recorder was invisible to git

`.gitignore` line 24 read `media/`. A pattern with no leading slash matches a
directory of that name **at any depth**, so it silently swallowed
`tools/media/` whole.

The tool written specifically to stop the video being a hand-made copy would
itself never have been committed. It would have existed on one laptop, the
video would have kept being made by hand, and the section documenting the fix
would have described a file that was not in the repository.

Nothing reports this. `git status` prints an ignored file exactly the way it
prints a file that does not exist, which is to say not at all. And
`verify_publishable.py` scans **tracked** files, so an ignored source file is
an unscanned one as well: two safety nets with the same blind spot. The scan
went from 204 files to 205 the moment the pattern was anchored, which is the
recorder becoming visible to it.

`app/test/repoVisibility.test.ts` now asserts that nothing under `tools/`,
`app/src`, `engine/src` or `learn/src` is ignored. It was checked the only way
worth checking a guard: the bug was put back, and the test failed.

### 76.6 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D527 | The trailer is produced by a committed tool, not by hand | A hand-made recording of a generated film is a second copy of it, and this copy had already drifted into being both mistimed and unlicensed |
| D528 | ⚠️ **The recorder holds no timing constants at all** | The running game is the clock. A hard-coded end time would have been the fourth copy of a number that has already been wrong twice |
| D529 | ⚠️ **Audio is muxed from the shipped `anthem.mp3`** | Playwright records no audio, so the only route into the file is the owned one. Licence by construction beats licence by vigilance |
| D530 | ⚠️ **A white flash marks the sync point** | The anthem started 5.92 s into the capture. Wall-clock arithmetic would have put every card six seconds early, which is the exact bug being fixed |
| D531 | The result is verified by cross-correlation, not by watching | "It looks fine" is what the broken file also produced. -0.4 ms at 0.9990 against a control is a claim that can fail |
| D532 | The film is recorded in English | A German browser gets a German game without being asked, and this machine is German, so the deliverable would silently have come out in the wrong language for its audience |
| D533 | ⚠️ **`/media/` is anchored, and a test enforces it** | `media/` matched at any depth and hid the recorder. `git status` and the publishable scan are both blind to ignored files, so nothing would have said so |
| D534 | NOTICE's trailer section is corrected in place | It claimed non-commercial terms that no longer apply, while the same document claimed nothing free-tier survived. A licensing document contradicting itself is worse than one that is merely out of date |

---

## 77. The course picker was a control that did nothing

### 77.1 What the setup screen was promising

The plan was to finish Erste Klasse: give the Year 1 curriculum its factions,
flip `role` from `questions` to `world`, and let a six-year-old have their own
empire instead of only riding along in seat two.

Mapping it first turned up something else. The setup screen has always shown
player one a course picker, **filtered to campaigns that claim `role: 'world'`**,
and `newGame` then ignored the answer completely:

```ts
const roster = rosterFor(ANTAGONISTS, lastSetup.focus, lastSetup.rivals);
createGameState(seed, { map: ..., topics: provider.topics(), antagonistIds: roster });
```

`ANTAGONISTS` is the engine's built-in DP-600 roster. `provider.topics()` is a
module-level singleton fixed to `DP600_TOPIC_GRAPH` at construction, which
happens at import time, long before anybody has chosen anything. The exam came
from four constants in `exam.ts`. `courseP1` selected one label in the co-op
modal and nothing else.

So the picker was a control that did nothing, and it was invisible for the
reason these always are: there is exactly one world campaign compiled in, so
the right answer and the wrong answer were the same value. Same shape as the
unit table being a statement about DP-600 (section 70) and `media/` matching at
any depth (section 76): a coincidence of the only case that existed, standing
in for a rule.

Fixing the lie is the same work as building the feature, which is what made
this worth doing rather than deferring.

### 77.2 One accessor, and everything routed through it

```ts
function worldCampaign(): Campaign {
  const chosen = courseById(lastSetup.courseP1);
  return chosen?.role === 'world' ? chosen : DP600_CAMPAIGN;
}
```

Topics, factions, questions, outline, exam length, question timer and Proctor
threshold now all read from it. Two supporting changes were needed:

- the provider's `graph` option accepts **a function**, because the provider is
  built before the choice exists;
- `proctorReady(model, threshold)` takes the threshold as a parameter with the
  DP-600 default, instead of reading a constant. A child would otherwise have
  had to reach professional-certification readiness of 0.8 before anything
  happened.

⚠️ `newGame` also has to pass the antagonist **definitions**, not only the ids.
Passing ids alone silently falls back to the engine's built-in roster, so a
Klasse 1 game would have been fought against The Silo Horde, in English.

### 77.3 ⚠️ Topic ids are storage keys, and they all said `dp600-`

The first run of the new end-to-end test failed on something better than what
it was testing:

```
AssertionError: dp600-1: expected 'dp600-1' to match /^klasse1-/
```

The Klasse 1 graph had the right number of nodes and DP-600's ids, because
`topicIdFor` was:

```ts
export function topicIdFor(skillId: number): string {
  return `dp600-${skillId}`;
}
```

This matters far more than a cosmetic prefix. Topic ids are the keys that SM-2
records, the researched set and the save file are stored under. Every campaign
would have produced the same `1..N` ids, so a second world's topics would have
landed on top of DP-600's records: a child's answers about Anlaute filed
against "Implement workspace-level access controls", moving the one number this
product really produces. Nothing would have thrown. It is exactly the
corruption the second seat was given no mastery tracker to avoid (D205),
arriving through a different door.

⚠️ **And the inverse had already been fixed.** `skillIdFromTopic` had been
changed to accept any prefix, and its comment already described the format as
`<campaign>-<number>`. The reader was correct, documented, and reading a value
nothing could produce. Half a pair fixed, and the half that WRITES left behind.

### 77.4 The floor that was still being enforced after its reason was deleted

`validateCampaign` rejected any world with fewer than `minimumTopicCount()`
topics: "the last N unit unlock(s) can never fire". That was true while
`unlockedBySkill` was a literal index. Section 70 scaled the ladder onto
whatever length the campaign has, and nothing came back here to say so.

Measured before removing it, rather than argued:

```
dp600    topics= 41  buildable=12/12  all units reachable
klasse1  topics= 24  buildable=12/12  all units reachable
```

The check was refusing worlds that work. The test that pinned it now asserts
the opposite and says why it used to be right, because deleting a test is how
a rule loses its history.

### 77.5 Seven factions named after the mistake they make

One per cluster, in German, because the joke has to be the **skill**:

| cluster | faction | what it gets wrong |
| --- | --- | --- |
| M1 Zahlen bis 20 | Die Zahlendreher | swap the digits |
| M2 Plus und Minus | Die Rechenräuber | steal the sum |
| M3 Formen und Größen | Die Musterbrecher | break the pattern |
| D1 Laute | Die Lautlosen | take the sounds away |
| D2 Silben | Die Silbenschlucker | swallow the syllables |
| D3 Groß und klein | Die Kleinschreiber | refuse capital letters |
| D4 Wörter und Sätze | Die Punktvergesser | never finish a sentence |

A child who beats Die Silbenschlucker should be able to say what a Silbe is.
Being frightening is not the point and would not survive the audience.

### 77.6 The picker is shown to a solo player now, because it means something

It was hidden unless two people were playing, which was right while it did
nothing: offering a lone player a choice that was discarded would have been
offering them a lie. It is suppressed only when there is genuinely nothing to
choose between, since a list of one is a label rather than a choice.

### 77.7 ⚠️ A German-first world exposed eight English strings

The screenshot showed what 1068 passing tests could not: the log reading
"The Proctor has noticed you at 100% readiness" underneath a German exam.
Eight `log()` calls still wrote raw English. They had never been wrong before,
because the only world was English by default. The i18n scan added in section
73 looks at `.textContent` assignments and these go through a helper, so they
were outside it.

### 77.8 Verified on the deployed build, both worlds, one session

| | Klasse 1 | DP-600 |
| --- | --- | --- |
| topics | 24, `klasse1-*` | 41, `dp600-*` |
| factions | Die Zahlendreher … Die Punktvergesser | The Silo Horde … The Import Zealots |
| villages | Zahlenburg, Satzende, … | Silo Hold, … |
| Proctor threshold | 0.6 | 0.8 |
| paper | **10 questions**, 60 s each | **40 questions**, 45 s each |
| first exam question | "10 - 10 = ?" | DP-600 stem |

Switching between them inside one session works, and DP-600 is unchanged in
every observable respect. 1068 tests, 53 files.

### 77.9 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D535 | ⚠️ **The world is built from `courseP1`, all of it** | The picker had been filtering on `role: 'world'` and discarding the answer. Fixing the lie and building the feature were the same work |
| D536 | The provider takes a graph FUNCTION | It is constructed at import time, before a course is chosen, so a value fixed at construction can only ever be the default |
| D537 | ⚠️ **`newGame` passes antagonist DEFINITIONS, not just ids** | Ids alone fall back to the engine's built-in roster, so a Klasse 1 game would have been fought against The Silo Horde in English |
| D538 | ⚠️ **`topicIdFor` takes the campaign id** | Topic ids are the keys SM-2 records and saves live under. Every campaign emitting `dp600-N` would have filed a child's answers against DP-600's records, silently |
| D539 | `proctorReady` takes a threshold | A six-year-old should not have to reach professional-certification readiness before their examiner appears |
| D540 | ⚠️ **The topic floor is deleted, not relaxed** | Its stated reason was removed one package away in section 70. Measured: 24 topics reach 12 of 12 units, exactly as 41 do. It was refusing worlds that work |
| D541 | Klasse 1's factions are named for the mistake, in German | The joke has to be the skill. A child who beats Die Silbenschlucker should be able to say what a Silbe is |
| D542 | The course picker is shown when playing alone | It was hidden while it did nothing, which was correct then. Hiding it now would hide the feature |
| D543 | The remaining raw-English `log()` calls are translated | They were never wrong before because the only world was English. A German world is what made them visible, and a screenshot is what found them |

---

## 78. A film before the film

### 78.1 Two films, two jobs

The game now opens with a **teaser** before the setup screen, and keeps the
live **opening** that plays once a world exists. Those are different things and
the distinction is worth stating, because D254 says the opening is deliberately
not a video file so that it shows the player's own coastline.

| | Teaser (new) | Opening (D254) |
| --- | --- | --- |
| nature | pre-rendered, identical every time | live, over your seed |
| job | say what this is to someone who has never seen it | establish *your* world |
| length | 69 s, skippable | 52.8 s |
| music | *Fabrica* | *Familia Nostra* |

They use different cues on purpose. Re-using the anthem would spend its
entrance twice and the second one would be the weaker.

### 78.2 ⚠️ The autoplay policy decides the shape, not taste

A video that runs **before** the setup screen runs before any click, and a
browser will not play sound until the user has interacted with the page. So the
teaser would have been silent, which makes "with fitting music" impossible as
stated.

One card solves it. The Enter card's click is both "start the film" and the
gesture that unlocks audio for the whole session, which is the same gesture the
anthem has always taken from the Begin button. It is not decoration; without it
there is no sound anywhere before the first click.

### 78.3 The host cannot seek, and fails silently at it

Measured on the deployed host before any of this was built, which is the only
reason it was cheap:

| property | result |
| --- | --- |
| `Accept-Ranges` | absent |
| `GET` with `Range: bytes=0-1023` | **200**, whole file, never 206 |
| progressive playback | ✅ `canplay` at **704 ms**, 2.7 s of 54.6 s buffered |
| `video.seekable` | **`[[0, 0]]`** |

Shipping a 33 MB film is therefore fine: it streams, and playback begins long
before the download ends.

⚠️ **But seeking does not merely fail, it lies.** `video.currentTime = 45`
fires a `seeked` event within 1 ms and leaves the position at **0**, with no
exception and `video.error` null. Two consequences, both now enforced by
`app/test/overlays.test.ts`:

- **no `controls` attribute**, because the native scrub bar is a control that
  silently restarts the film;
- **skip is never a seek**. It stops the element and tears down the source, so
  a skipped film also stops downloading.

### 78.4 Three things I got wrong, all found by measuring

**The resolution.** The parameter validator accepts `1792x1024`; sora-2 then
refuses it at generation with *"Supported resolutions are 720x1280,
1280x720"*. I had already "corrected" a memory note on the strength of the
enum alone. The enum is model-agnostic; only the generation error is the truth.

**The upscale.** The first cut rendered 1280x720 source at 1600x900 to match
the app canvas. Resampling then compressing can preserve detail and never adds
any: **45.4 MB at 1600x900 against 32.6 MB at native**, for a picture that is
sharper per pixel at native. The canvas argument was empty because the browser
scales either way.

**The label.** `{\an8\fs11}` in an `.srt` was silently dropped by ffmpeg's SRT
decoder, so the AI disclosure rendered at full caption size, at the bottom,
stacked directly above FABRIC EMPIRES. It looked deliberate. An `.ass` file has
a per-line Style column, so alignment and size are properties of a style and
cannot be discarded.

### 78.5 What the film is

Six Sora 2 clips at 12 s, the model's maximum, in a dawn-to-sunset arc: walled
city, harbour, map room, library, tower under construction, banners over the
fields. Early baroque, roughly 1620, chosen to match a soundtrack of viola da
gamba and sackbut.

It is photoreal and it does **not** depict the game, which is a stylised hex
map. That is a decision rather than an oversight: the teaser sets a mood ahead
of the setup screen, and the film carries an AI-generated label. The captions
carry the meaning, and only four of the six scenes have one, because at 69 s a
caption on every shot reads as a slideshow.

### 78.6 Decisions

| # | Decision | Why |
| --- | --- | --- |
| D544 | A pre-rendered teaser, alongside the live opening, not instead of it | They answer different questions. D254 still holds for the opening |
| D545 | ⚠️ **An Enter card, because sound is impossible without a gesture** | The film runs before any click. One button buys the teaser's audio and the anthem's |
| D546 | ⚠️ **No `controls`, and skip is never a seek** | `seekable` is `[[0,0]]` and a seek silently resets to 0 while reporting success. A scrub bar would be a trap |
| D547 | The film is gitignored and probed for | It carries the Suno cue, so the same rule as the soundtrack. A clone goes straight to setup |
| D548 | ⚠️ **Native 1280x720, not upscaled to the canvas** | 32.6 MB against 45.4 MB, and sharper per pixel. Upscaling cannot add what the source never had |
| D549 | ⚠️ **Captions and the label are an `.ass`, not an `.srt`** | The SRT decoder drops override tags without complaint, which put the disclosure full-size at the bottom |
| D550 | Captions and timings live once, in the build script | The SRT/ASS is generated from them, so a caption cannot end up naming a shot that has gone |
| D551 | The shared grade block lives once, in the prompt generator | Four hand-copied paragraphs is how three agree and one does not, visible only after the grade |
| D552 | *Fabrica* is teaser-only | Re-using the anthem would spend its entrance twice |
| D553 | The Sora tool stays in Campus-Scheduler | Its hard-won API knowledge belongs in one place; the clips are source material arriving in `media/`, like the Suno tracks |

### 78.7 ⚠️ The score played on top of the teaser

Reported immediately: the setup screen's music overlapped the film.

The cause was a `pointerdown` listener registered at module load, `{ once: true }`,
that started the background score on the **first click anywhere in the app**,
guarded by `if (!openingRunning)`.

Adding a teaser changed what the first click *is*. It used to be something on
the setup screen; it is now the **Enter button**, so the same gesture that
started the film also started the score, and they played together. The guard
could not help: `openingRunning` names the in-game cinematic and knows nothing
about a second film. ⚠️ **A condition that names one specific thing cannot
answer "is anything playing".**

The fix was not a better condition, it was putting the listener where it
belongs. Its own comment already said why it existed: *"A resumed empire never
plays the opening"*. So it is armed **only on the resumed path inside `boot`**,
which runs after the attract has finished. Everything else follows:

- a **new** game never needed it, because the opening's handover starts the
  score 2.4 s after the anthem fades;
- ⚠️ and registering it globally had a second, older fault nobody had reported:
  `pointerdown` fires before `click`, so on the Begin button it started the
  score a moment *before* `playOpening` set `openingRunning`. The guard was
  reading a flag that had not been set yet.

Measured on the deployed build afterwards, all five paths:

| path | sounding |
| --- | --- |
| teaser playing | **only** `teaser.mp4` |
| setup screen | silence |
| opening | anthem, score at volume **0** |
| after the opening | score starts (*Aqua Alta*) |
| resumed, first click | score starts (*Ferrum et Ignis*) |

⚠️ Two instrument errors of my own, worth recording because both produced
confident wrong readings: `document.querySelectorAll('audio,video')` cannot see
the anthem, which is a detached `new Audio()`, so the opening looked silent;
and `__fabricEmpires.music` is a **function** returning live values, so reading
`music.volume` as a property returned `undefined` and looked like a frozen
snapshot. I blamed the harness before checking its definition.

| # | Decision | Why |
| --- | --- | --- |
| D554 | ⚠️ **The first-gesture music start is armed only on the resumed path** | It exists for resumed games alone. Registered globally it fired on the teaser's Enter button, and before that on Begin, ahead of the flag meant to stop it |

### 78.8 ⚠️ The fog was a flight of steps

Reported from a screenshot: thick grey bands along the tile edges on a
mountain.

They were the fog. The largest mesh in the scene is a single merged
`MeshBasicMaterial` in `#171f29`, and that dark slate is exactly the colour of
the bands. Each unexplored hex got a **flat lid at its own peak** plus a
four-unit skirt. Where two neighbouring peaks differed, the riser between the
plates was visible, so on steep ground the fog read as a staircase with one
thick band per tile boundary.

⚠️ **The skirt was the previous fix for the previous bug, and it had become
this one.** Its comment explains it was added because lids meeting only in XZ
left an open vertical slot onto sunlit terrain, "a glowing wireframe". A deep
wall did close the slot. Nobody then looked at what a deep wall between two
plates at different heights looks like from above.

**Two properties fight, and each obvious fix breaks the other:**

| | fix | what it breaks |
| --- | --- | --- |
| flat plate at own peak | never dips below ground | neighbours disagree → walls |
| rim sampled with `surfaceAt` | neighbours agree exactly → no walls | sits ON the ground → terrain pokes through |

I shipped the second one and it looked right in an overview, then measured a
close pass and found **bright zigzag slivers of terrain scattered across the
fog**. Trading banding for holes is not progress.

**Both hold if the rim takes the highest PEAK among the hexes meeting at that
point.** It is symmetric, so two neighbours compute the identical number from
their own sides and the lids join; and it is at or above every adjacent hex's
highest ground, so nothing can surface through it. Which hexes touch a rim
point is decided by distance rather than by trusting a corner index to line up
with a direction index.

⚠️ `peakAt`'s own documentation already said this: *"the only safe height for
anything that must OCCLUDE the ground"*. The rule was written down, and I
broke it anyway by sampling `surfaceAt` for the rim.

Measured on the deployed build:

| | before | after |
| --- | --- | --- |
| fog triangles | 110,700 | **73,800** |
| near-vertical faces | walls on every boundary | **76 of 73,800** (0.1%, genuine slopes) |
| max wall height | 4+ | **0** |

⚠️ **The skirt is gone entirely, and that is a saving rather than a risk.** Once
the rims agree there is no slot to close, so every skirt quad hung below the
neighbouring lid's own surface: at 0.5 deep it still cost **147,600 of 221,400
triangles**, two thirds of the layer, drawing nothing.

`app/test/fogLid.test.ts` now pins both properties, and each was checked by
putting its bug back: the flat plate fails with *"Two lids disagree about the
height of a point they share"*, and the `surfaceAt` rim fails with *"lid for
0,0 sank below its own peak"*.

| # | Decision | Why |
| --- | --- | --- |
| D555 | ⚠️ **Fog rims take the highest peak of the hexes sharing the point** | The only rule that satisfies both properties at once. Symmetric, so neighbours agree; peak-based, so nothing pokes through |
| D556 | ⚠️ **The skirt is deleted, not shrunk** | With rims agreeing it closes nothing. It was two thirds of the layer's triangles, all of them buried |
| D557 | Both properties become tests, each verified by reintroducing its bug | I fixed one and broke the other, twice. A property that lives only in my head is one the next change trades away |

---

## 79. Three buttons, one of them lit

The research panel rebuilt its list every time you picked a topic, and left
the current one out of it. That is defensible in isolation: you cannot start
researching what you are already researching, so the option would do nothing.

The consequence is that **the list reorders under the cursor**. Pick the
second of three and you get a list of two, with what used to be third now
sitting where you just clicked. Alexander's instruction was exact: *"those
should not swap instead just mark which one is active. like for example three
buttons and one being active."*

So every researchable topic is now always rendered, and the current one is
**marked** rather than removed: `class="active"`, `aria-pressed="true"`,
`disabled`, and the suffix *"studying now"*. The panel is a set of radio
buttons that happen to look like a list.

⚠️ **`disabled` is not decoration, it is the engine's answer.** `startResearch`
already rejects restarting the current topic. Rendering the button enabled
would offer a click that produces an error line, so the marker and the
disabled state are the same fact told twice on purpose.

The other thing the old code hid by omission: switching topics **throws away
the Compute already spent**, because `startResearch` sets `progress: 0`. When
the list dropped the active topic there was nothing to compare against and no
obvious loss. Now that both are on screen, every non-active option carries
*"discards {spent} Compute"* whenever progress is above zero, so the cost of
changing your mind is written on the control that charges it.

`scrollIntoView({ block: 'nearest' })` keeps the marked button visible: a
stable list only ever grows, and with seven topics in a `max-height: 30vh`
scroller the active one can otherwise sit outside the panel.

### The screenshot showed a second bug for free

Alexander's screenshot of the panel had German UI and **English log lines**:
*"Resumed on seed FABRIC, turn 2."*, *"… not yet mastered. Try again next
turn."* Fifteen `log()` and `adopt()` calls were still bare template literals.

§77 had already swept for this and fixed eight. It missed these because its
regex looked for a quote followed by a capital letter, and every one of these
begins with `${`.

⚠️ **The i18n test suite had the same blind spot, written down.** The DOM-prose
guard from §60 contains `if (text.includes('${')) continue;` — interpolated
strings are deliberately exempt, on the reasonable grounds that an
interpolation is usually an already-translated value being placed. The
unreasonable consequence is that a whole sentence with a hole in it was exempt
from the only test that would have caught it.

`⚠️ never logs a bare template literal` closes it, and was verified by putting
one line back: it names the file and line rather than reporting a count.

### And a third, found by looking at the buttons

While checking the log I read the action row: **Stadt gründen, Plündern,
Fortify, Überspringen, Rat**. One English word in five.

`Fortify: 'Befestigen'` existed and `refreshSelection` applied it correctly.
The button simply carried no `data-i18n`, by an earlier deliberate decision:
it doubles as **Wake** once a unit is dug in, and two owners writing one
string is how one of them goes stale.

The decision was right and the conclusion drawn from it was too broad.
`refreshSelection` never runs on the setup screen, so the markup's English
survived until you clicked a unit. And `onLangChange` calls
`applyStaticTranslations` **first** and `refreshSelection` **after**, so the
dynamic label always wins anyway. The tag was never the hazard it was
avoided as.

⚠️ The single-owner rule also had a hole of its own: the "nothing selected"
branch never wrote the label, so deselecting a dug-in unit left **Wake** on a
button with nothing to wake. Both halves are fixed.

Neither the DOM-prose guard nor the coverage test could have found this: the
key is translated and used, and "Fortify" is one word where the prose test
requires two.

| # | Decision | Why |
| --- | --- | --- |
| D558 | ⚠️ **The research list never reorders; the active topic is marked, not removed** | A list that reshuffles under the cursor moves the thing you were about to click next |
| D559 | The active button is `disabled` with `aria-pressed`, not just styled | The engine already rejects the click. An enabled button would promise an action that only produces an error |
| D560 | ⚠️ **Every other option shows what switching costs** | `startResearch` zeroes progress. The old list hid the loss by hiding the comparison |
| D561 | `scrollIntoView({ block: 'nearest' })` after each rebuild | A stable list only grows; with seven topics the marked one can fall outside a `30vh` scroller |
| D562 | 15 more log lines moved into `t()` with named parameters | A sentence with holes is still a sentence, and German puts the holes elsewhere |
| D563 | ⚠️ **A guard for template-literal logs, verified by reintroducing one** | Two sweeps missed these, and so did the test written to catch untranslated prose. Found by reading a screenshot, which does not repeat |
| D564 | `'Cheat: {message}'` is allowlisted as legitimately identical | German gamers use "Cheat" unchanged. A named exception beats a worse word |
| D565 | Fortify carries `data-i18n` after all, as the resting label only | The static pass runs before the dynamic one on every language change, so it cannot go stale. Without it the setup screen shows one English button |
| D566 | ⚠️ **`refreshSelection` writes the label on its empty path too** | Deselecting a dug-in unit otherwise leaves "Wake" on a button with nothing to wake |

---

## 80. The film was singing along to the wrong words

Alexander, on the opening: *"the text on the starting video is not matching the
song. Make sure the text appears exactly when it is in the song. I know will be
fairly quick most of it at the end. But that is okay."*

The prediction in that last sentence turned out to be exactly right, which is
worth noting before anything else: he could hear the shape of the song from
watching a film that disagreed with it.

### The marks were wrong by most of a film

`ANTHEM_MARKS` says where each sung line begins. Measured against the
recording:

| line | the marks said | actually sung |
| --- | --- | --- |
| *Fabrica* (soloist, alone) | 0.0 s | 0.65 s |
| *Ex nihilo terra surgit* | 9.0 s | **26.88 s** |
| *Flumina viam inveniunt* | 20.6 s | **30.70 s** |
| *Manus parvae, manus magnae* | 29.4 s | **37.22 s** |
| *Simul aedificant* | 41.5 s | **42.28 s** |
| full choir | 49.8 s | 48.76 s |

*Ex nihilo* was on screen for eighteen seconds before anyone sang it.

⚠️ **This is the third time this file has been wrong, and the second time it
was wrong immediately after being "fixed".** Section 41 had the cards one
passage early. The Pro re-recording made them early again, and the correction
re-measured the track by watching for spectral change in the band the voices
occupy.

**That method cannot tell a sung line from a hummed one.** The lyric sheet says
Verse 1 enters with *"choir hums beneath"*, so the vocal band lights up at 9 s
and stays lit, and the measurement dutifully reported a line that nobody sings
for another eighteen seconds. It was not a sloppy measurement; it was a precise
measurement of the wrong thing.

The marks now come from a forced alignment of the audio against the known
lyrics (faster-whisper `large-v3`, Latin, word timestamps), cross-checked
against a second model, against a re-run over isolated windows, and against
pitch tracking for the unaccompanied opening. A recogniser knows the difference
between a word and a vowel. A spectrum does not.

⚠️ **The opening was the one mark that was already right.** pYIN finds a
sustained monophonic note at 312 Hz from 0.65 s to 3.45 s while the bass is
still at −60 dB: the boy soprano, alone. Worth stating because the previous
correction "fixed" `forge` from 0 to a value derived from the accompaniment,
and moving a correct number is how the next person loses confidence in all of
them.

### Thirteen seconds where nothing is sung

The alignment turned up something no amount of re-timing would have solved:
between *Texamus una* (ends 13.6 s) and *Ex nihilo* (26.9 s) **the anthem sings
no words at all**. The choir hums, the strings enter, the piece climbs.

A card held across that names a line nobody is singing, which is the same fault
as showing one early, only slower. So the film gained a sixth beat that carries
no text: the camera leaves the tight turn on the home tile and climbs through
the build, and the wide map arrives on the downbeat of *out of nothing, the
land rises* rather than seconds before it.

The rest of the film is then exactly as quick as Alexander guessed: 3.8 s,
6.5 s, 5.1 s, and the title.

### The cards now follow the recording, not a stopwatch

Beats used to accumulate: each shot ran its `durationMs` from wherever the
previous one finished. That is fine on a smooth machine and drifts one way only
on any other, since a dropped frame or a late audio start pushes every later
card out and nothing pulls it back.

Each beat now takes its length from `anthem.at` at the moment it starts, so a
beat that is already late gets a shorter shot instead of an even later one.
Measured on the deployed build, against the real audio clock:

| card | sung at | appeared | error |
| --- | --- | --- | --- |
| *Fabrica* | 0.65 s | 0.09 s | card up first, correctly |
| (no card) | 13.60 s | 13.84 s | +0.24 s |
| *Ex nihilo terra surgit* | 26.88 s | 26.96 s | +0.08 s |
| *Flumina viam inveniunt* | 30.70 s | 30.71 s | **+0.01 s** |
| *Manus parvae, manus magnae* | 37.22 s | 37.23 s | **+0.01 s** |
| FABRIC EMPIRES | 42.28 s | 42.37 s | +0.09 s |

### What the tests were and were not protecting

`intro.test.ts` was green through all of this, because it imports the marks it
is checking. It can prove the film agrees with `ANTHEM_MARKS`; it cannot prove
`ANTHEM_MARKS` agrees with the mp3, and no unit test can. **The audio is the
thing under test and it is not in the repository.** What the suite gained
instead is the other half of the property: a card must also come *down* as the
next line starts, which is what a single card spanning three lines violated.

⚠️ Two guards had to move, and it is worth being explicit that this is not the
usual "raise the bound until it passes". The 5 s minimum per card is now 3.5 s
because *Ex nihilo terra surgit* is sung for 3.8 s: a 5 s card would still be
up while the next line played, which is the exact defect the file exists to
prevent. The song sets the length of a beat. What is still ours to get wrong is
a card too brief to read.

⚠️ And one test was quietly measuring the wrong shot. `shots[1]` meant "the
wide reveal" until a beat was inserted ahead of it, after which the test named
one thing and asserted about another while staying green. Beats are addressed
by id now.

| # | Decision | Why |
| --- | --- | --- |
| D567 | ⚠️ **Marks come from forced alignment against the lyrics, never from band energy** | A hummed choir lights up the vocal band. The previous method put a line 18 s before it is sung and looked rigorous doing it |
| D568 | Cross-check every mark with a second model, isolated windows, and pitch tracking | `large-v3` skipped *Ex nihilo* entirely; `medium` found it. One recogniser is one opinion |
| D569 | ⚠️ **A sixth beat, carrying no text, for the wordless build** | Nothing is sung for 13.3 s. A card held over it names a line nobody is singing |
| D570 | ⚠️ **Each beat is timed from `anthem.at`, not from the end of the last shot** | Accumulated durations drift one way only. Anchoring makes a late beat shorter instead of making the next one later |
| D571 | Fall back to the authored duration when no anthem file is present | There is nothing to sync to, and a build without the mp3 must still play the film |
| D572 | The minimum card is 3.5 s, not 5 s | The shortest sung line is 3.8 s. A 5 s floor would guarantee an overhang, which is the defect itself |
| D573 | Cards must come down as the next line starts, as a test | "Lands on its line" was only half the property. One card spanning three lines satisfied the old half |
| D574 | ⚠️ **Beats are addressed by id in tests, never by index** | Inserting a beat silently repointed `shots[1]` from the reveal to the build, and the test passed while meaning something else |

---

## 81. The fog was a hole, not weather

Alexander: *"not a big fan of the fog. make it somehow more fog like real and
not just black."*

Read off the deployed build, near fog against the land beside it:

| | mean rgb | luminance | variation (sd) |
| --- | --- | --- | --- |
| fog, near the camera | (9, 13, 19) | **13** | **2.4** |
| land, sunlit | (126, 120, 100) | 120 | 35 |
| fog, far away | (38, 43, 48) | 42 | 3.7 |

Three separate facts in one table, and none of them is "somebody picked a dark
colour".

### It was authored in a space nobody sees it in

The sheet was `#171f29`, which is rgb(23, 31, 41) and looks like a considered
slate blue in an editor. It measured rgb(9, 13, 19) on screen. Nothing was
broken: an unlit material emits its colour into a pipeline with ACES filmic
tone mapping at exposure 0.78, and that curve crushes darks hard. Choosing a
fog colour as a hex string was choosing it in the wrong space, and the file
even carried a careful paragraph reasoning about the *lightness* of a value
that the renderer was going to more than halve.

⚠️ The colours are now stated as the linear values the shader emits, and tuned
against measured screenshots. A test rejects any `new Color('#…')` in the file.

### The billowing was real, and mathematically invisible

The old sheet was mottled: fbm noise, per vertex, multiplying the colour by
1 ± 0.11. Eleven percent of a value that lands near 13/255 is a swing of **one
level**, under the quantisation of the framebuffer. It was computed for every
vertex of 73,800 triangles, every rebuild, and could not be seen.

A brightness *range* only exists where there is brightness to range over. That
is why fixing the darkness had to come first, and why the guard on this is a
ratio (`crest / trough > 5`) rather than a colour.

### The distance haze was doing all the work

The far fog measured 42 against the near fog's 13, from the same material. The
scene's `FogExp2` was mixing the sheet towards the sky, so the only place the
fog looked like fog was where you could not see it properly. The old file said
so approvingly: *"Distance is left to the scene's own FogExp2 … which pulls the
far field towards the sky on its own without help here."* True, and it was the
whole effect.

### What it is now

A `ShaderMaterial` following the pattern `corruption.ts` already used:

- **Billowing sampled on world XZ**, two drifts crossing at different speeds
  and directions, which gives curl without simulating anything. World position
  is the only safe input: neighbouring lids own separate copies of the vertices
  along the edge they share, so anything per-hex draws a seam.
- **A rolling top.** The same noise displaces the vertex upward, so the bank
  has a silhouette instead of shrink-wrapping the terrain.
  ⚠️ **Upward only, and that is correctness, not taste.** The lid sits at each
  hex's own peak so nothing beneath it can be seen; a downward displacement
  would sink it into the hillside and open a window onto unexplored ground.
  `max(0.0, …)` is the entire guard, it reads like a formality, and it is the
  obvious thing to delete while tidying a shader. It has a test.
- **Drift.** Measured over 60 s of real time, the fog changes with a 95th
  percentile of 10 levels against a static control at 4. Slow enough to read as
  weather rather than as an animation.
- **A third octave that only exists near the camera.** Everything else is sized
  for looking at the map, so zoomed right in the low frequencies were nearly
  constant and the sheet went back to being a flat pane. Adding a high
  frequency everywhere is the wrong fix: at map zoom it falls under a pixel per
  feature and crawls. It is weighted by distance to `cameraPosition`, so the
  detail appears exactly where there is screen area to show it.

Calibration, all from one frame with only the uniforms changed:

| version | fog luminance | fog variation (sd) |
| --- | --- | --- |
| the flat plate | 12 | 2.1 |
| first pass | 43 | 4.1 |
| wider trough-to-crest | 48 | 7.1 |
| **shipped** | **55** | **10.1** |

Sunlit land measures 121 in all four, so the island keeps better than twice the
fog's brightness and three times its local contrast. ⚠️ **That ratio is the
constraint, not the fog's own number.** An earlier attempt recorded in this
file took the sheet to lightness 0.20 and lost the island inside it, which is a
different failure from the black one and no more readable.

Cost: median frame 3.2 ms, p95 5.5 ms, on the same 73,800 triangles as before.

⚠️ **Measured with fixed pixel boxes, which is only valid within one camera.**
A later screenshot at a different zoom put the "land" sample box on top of fog
and reported land at 145 and fog at 127, which would have looked like a
regression and was an error in the ruler. Comparisons above are same-frame,
uniform-only.

### One trap worth writing down

The shaders live in template literals. A backtick in a GLSL comment ends the
string, and the failure surfaces as `TS1005: ',' expected` a hundred lines
away, pointing at valid TypeScript. Writing *`cameraPosition`* in a comment
cost a build.

| # | Decision | Why |
| --- | --- | --- |
| D575 | ⚠️ **Fog colours are linear values, never hex strings** | ACES at exposure 0.78 turned a considered rgb(23,31,41) into rgb(9,13,19). A hex here is a colour chosen in a space nobody sees |
| D576 | The guard on flatness is a crest-to-trough ratio, not a colour | The old mottling was ±11% of near-black, which is under one level in 255. Range needs something to range over |
| D577 | ⚠️ **Vertex displacement is clamped upward** | The lid hides ground by sitting at the hex's peak. Down is a window onto unexplored terrain, and the clamp looks deletable |
| D578 | Billowing is sampled on world XZ, never per hex | Neighbouring lids hold separate copies of shared-edge vertices; anything else draws a seam down every boundary |
| D579 | A near-camera detail octave, weighted by distance | Map-scale noise is constant across a close-up; high-frequency noise everywhere crawls at map zoom. Distance picks the right one |
| D580 | ⚠️ **The sheet keeps `fog: true` and the fog chunks explicitly** | A raw ShaderMaterial gets no distance haze. Without it this would be the one surface ignoring distance |
| D581 | The bounding sphere grows by the billow height | The drawn surface is taller than its geometry, and three culls on the sphere |
| D582 | Brightness is judged as a ratio to sunlit land, not absolutely | Both known failures are ratio failures: invisible against black, and the island lost inside a bright sheet |

---

## 82. The advice was correct, drawn, and invisible

Alexander: *"the architect does he actually gets good fields proposed. I am not
seeing them"*.

He was right that something was wrong and wrong about what. Driven live with
the Architect selected, the engine proposed **five sites**, the panel said
*"bester Platz in der Nähe (2 Felder): 4 Data, 5 Runden bis zum Wachstum"*, and
all five patches were in the scene ranked by opacity. Toggling only those five
materials off and back on changed the picture by a mean of **59 levels** on the
best tile. Nothing was broken anywhere in the chain.

⚠️ **A feature can be entirely correct and still not exist.** Four separate
things made it unnoticeable, and only one of them is a colour:

1. **It was a green wash on green ground.** Measured against the ground
   immediately around it, the strongest of the five stood out about **seven
   times less** than the selection marker does.
2. **At the camera a game opens on, all five hexes together covered about 24 by
   11 pixels.** Roughly five pixels each. Nothing painted on the ground is
   visible there however bright it is, because there is no room for it.
3. **One proposal sat exactly under a blue movement patch.** Both blend
   additively, so on the tiles you can actually reach this turn the green was
   mixed into something that was neither colour.
4. **It was a tint with no border, no rank and no label**, so even when seen it
   never said *"these are proposed city sites, best first"*.

### What it is now

- **A ring, not a wash.** A band along the hex border, leaving the ground
  visible. That is the point rather than a detail: the player is being asked to
  compare tiles, so covering them up was working against the advice.
- **A rank number on each site**, so the ordering is stated instead of implied
  by opacity.
- **A beacon over the best site**, and both it and the numbers are sprites with
  ⚠️ **`sizeAttenuation: false`**, which is the actual fix for point 2. Every
  other mark on the map shrinks with the camera, which is right for terrain and
  wrong for advice.
- **A clickable list in the Architect panel**: rank, Data, turns to grow,
  distance, and a dot for reachable-this-turn. Text has no zoom problem at all
  and can carry the numbers the ranking is made of.

Clicking a row moves the **camera**, not the unit. Founding is permanent, and
one control that sometimes walks an Architect across the map and sometimes only
looks at a tile is two behaviours wearing one label.

### The bit I got wrong on the way

I proposed also auto-selecting the Architect on turn one, and Alexander agreed.
It was already implemented: `adopt()` selects it and focuses the camera on it,
for new and resumed games alike. My evidence had been a probe that read
`selected()` in the same tick as the click that started the game, so it read a
value from before the game existed. **A race in the measurement looked exactly
like a missing feature.**

### And a layout regression the fix caused

Five rows of three wrapped lines pushed the selection panel up **behind** the
research panel. ⚠️ The two are both `position: fixed` and anchored to opposite
edges, one hanging from the top and one standing on the bottom, so nothing in
that arrangement stops them meeting in the middle. Fixed by shortening the rows,
capping `#selection`, and making the LIST the part that scrolls: if the panel
scrolled, the Found city button would be what went off the bottom.

The detail line also lost its "best nearby" sentence, which the list now says
in the same words directly underneath. What it kept is what the list cannot
say: what you give up by founding where you are standing, since the tile
underfoot is usually not one of the five.

| # | Decision | Why |
| --- | --- | --- |
| D583 | ⚠️ **A proposed site is marked with a ring, never a filled patch** | The player is comparing ground, so the mark must not cover the ground. The wash also lost to the terrain it was painted on |
| D584 | Rank numbers and the beacon are sprites with `sizeAttenuation: false` | Five proposals share ~24 by 11 pixels at the opening camera. Screen-space is the only size that survives the view people plan in |
| D585 | ⚠️ **The marks are not depth-tested** | A pin behind a ridge is hidden exactly when it is most worth having |
| D586 | The same advice appears as text in the panel | Text has no zoom problem and can state Data, growth and distance instead of implying a ranking with opacity |
| D587 | A list row moves the camera, never the unit | Founding is permanent; one label must not mean two actions, one of which is irreversible |
| D588 | Ring heights are sampled at the TRUE corner, not the inset one | Two inset bands never share vertices, but they must share heights or every edge draws a step |
| D589 | ⚠️ **`#selection` is capped and the list scrolls inside it** | Two fixed panels anchored to opposite edges will meet in the middle. The buttons must never be the thing that scrolls away |
| D590 | Rank textures are cached per digit | Overlays rebuild on every selection change, so an uncached canvas is a canvas per click, for ever |

---

## 83. The ground opened after the fact

Alexander: *"don't wait till the turn is finished to see the new land. once the
profiler or the unit reaches the the dark area than uncover slowly"*.

Two faults, in different layers, and a test that was named after the property
it did not test.

### The rules only lit up the far end of the march

`moveUnit` folded sight in **once, after the unit had already arrived**, under
a comment that said the opposite:

> *A scout that walked six hexes and only lit up the last one would be useless,
> and worse, would show a corridor of ground it never passed through.*

That is an exact description of what the code did. Ground the unit walked past
stayed dark unless it happened to fall inside the destination's sight radius,
which on a long march it mostly does not.

⚠️ **The test that should have caught it moved exactly one hex.** With a single
step the destination *is* the corridor, so it passed against the broken
implementation, and it passed under the name *"reveals ground as a unit walks,
not only where it stops"*. It now marches as far as the unit can reach and
checks every tile beside the route, plus a discriminator: at least one such
tile must be out of range of the destination, or the march is too short to tell
the two implementations apart. Verified by restoring the old behaviour, which
fails it by name and tile.

### The view never asked

Separately, the app called `refreshFog()` on attack, on founding, on adopting a
state and at end of turn, but **not after a move**. So even the destination's
own reveal waited for the turn to end. That is the half Alexander could see.

### Uncovering per step cost more than a frame

The obvious fix is to refresh the fog once per step of the walk. Measured, one
fog rebuild at full map size is **44.8 ms median**, plus a re-upload of 223,000
vertices, because the sheet re-merged its geometry every time the fog moved.
Six steps would be six 45 ms stalls in a second and a half.

That was affordable while the fog only changed when a turn ended. It stopped
being affordable the moment it had to keep up with a unit walking, so the sheet
was rebuilt around the new requirement:

- **Geometry is built once per map**, covering *every* tile, including the ones
  currently in sight. A clear tile becomes remembered as soon as the unit
  watching it walks away, and discovering that later would mean rebuilding
  later.
- **Each tile carries its own state as a vertex attribute**: 2 unseen, 1
  remembered, 0 clear. Changing the fog writes three floats per vertex of the
  tiles that actually changed, so the work is proportional to what moved rather
  than to the size of the map.
- ⚠️ **The state is a float precisely so it can be interpolated.** "This tile is
  being uncovered" is a slide from 2 to 0, and the shader does it over 0.75 s
  for nothing. That is the *slowly* in the request, and it is the reason the
  three states are a number rather than an enum.
- **Alpha is decided before any noise is sampled, and cleared tiles discard.**
  Every tile has geometry now, so without that the sheet would shade the whole
  board with three fbm calls per fragment in order to draw nothing.

### The view is allowed to lag the rules, in exactly one window

The engine finishes the move instantly and correctly: by the time `moveUnit`
returns, the whole corridor is explored. Showing that at once would open six
hexes while the unit is still at the near end.

So the walk hands the fog a view of the world *as of the step the animation has
reached*, and drops it the moment the walk ends. Measured on the deployed
build, marching a Profiler three hexes:

| time | tiles still hidden | what the rules had explored |
| --- | --- | --- |
| 0 ms | 6150 | 61 |
| 164 ms | 6150 | **88** |
| 315 ms | 6141 | 88 |
| 633 ms | 6132 | 88 |
| 790 ms | **6123** | 88 |

The rules jumped to 88 at 164 ms; the ground opened in three instalments, one
per hex walked. Cost of the same march: **zero frames over 16 ms**, median
2.3 ms, worst 4.3 ms.

⚠️ One trap worth recording: on a `BufferAttribute`, `needsUpdate` is
**write-only**. Setting it bumps `version`; reading it returns `undefined`, so
the obvious assertion that a redundant update did not re-upload passes against
nothing at all. The test reads `version`.

### A pre-existing flake that cost two false diagnoses

Twice during this work `worldSetup.test.ts` failed, and twice it looked like I
had broken world generation. The second time it failed on a *different* pair of
cases, which is the tell: a fault is not choosy about which assertion it
breaks, and a **timeout** is.

Stashing the change and running the suite on the committed baseline reproduced
the failure exactly, so it was never mine. ⚠️ **My earlier "all green" runs in
this session were partly luck.**

The cause: those tests generate every world shape crossed with every size, and
start a real game on each combination. Measured, the file takes about 9.8 s
alone and 28 s while the rest of the suite runs, against vitest's default
budget of five per test. It passed on an idle machine and failed on a busy one.

Raising a timeout to make a test pass is usually how a guard dies, so being
precise about which this is: the timeout is not the property under test. What
these tests assert is that every preset leaves seven reachable factions, and
that is deterministic and passes consistently in isolation. A clock was the
wrong thing to be measuring, so it has been given enough room to stop.

| # | Decision | Why |
| --- | --- | --- |
| D591 | ⚠️ **`moveUnit` folds sight at every hex walked, not at the destination** | It claimed to do this already. A scout lit only the far end of its own march |
| D592 | The move reports the path it walked | The view has to follow the same route the rules did, or it cannot uncover in step with the unit |
| D593 | ⚠️ **The fog sheet is built once per map and changed by attribute** | A rebuild is 44.8 ms. Six per march is six stalls; the requirement changed, so the design had to |
| D594 | Tile state is one interpolable number, not an enum | Uncovering is then a slide from 2 to 0, and the fade is free rather than a second mechanism |
| D595 | A fade restarts from where it currently is, not from where it began | A tile caught half open must carry on from half, not snap shut and start again |
| D596 | Alpha is decided before any noise, and clear tiles discard | Every tile has geometry now; without this the whole board would be shaded to draw nothing |
| D597 | ⚠️ **The view may lag the rules only while a unit is walking** | The engine is right immediately and the eye must not be. One short window, cleared in a `finally` so an interrupted march cannot freeze the fog |
| D598 | The corridor test marches as far as the unit can, and says so when it cannot | The old one moved a single hex, where destination and corridor are the same tile |
| D599 | ⚠️ **`rememberAlong` collects before it copies** | Most moves reveal nothing, and cloning 6,211 keys on each of those was enough on its own to time the world tests out |
| D600 | `worldSetup.test.ts` gets 45 s, and the reason is written down | Five seconds is not a property of anything the file asserts. Load-dependent flakiness had already been mistaken for a regression twice |

---

## 84. Taking cover made the city easier to take

Alexander: *"why can the unit not search cover in the city. implement it"*.

⚠️ **The premise was wrong and the request was right.** A unit could always walk
into its own city: `isOccupied` blocks on units, not on cities, and driving the
deployed build confirmed the city tile is offered as a destination like any
other. Nothing was blocked. What was missing was any *reason* to go in, and
that turned out to be much worse than a missing bonus.

### The trap

`previewAttack` picks the defender by asking whether a unit is standing on the
tile. So a garrison **replaced** the city rather than reinforcing it: the walls,
the settlement's own defence and its citizens all dropped out of the fight, and
a scout with strength 8 stood in for a city with 20 plus 6 per citizen.

Measured on a size-one city, before anything was changed:

| | defence | damage taken per blow |
| --- | --- | --- |
| empty | 32.5 | 14 |
| with a Profiler inside | 15.0 | **46** |
| a siege engine, empty | | 47 |
| a siege engine, garrisoned | | **100**, the cap |

Putting a soldier in your own city **more than tripled** the damage it took and
let a siege engine max out. The obvious instinct, get the scout indoors before
the raid, was the worst move available, and nothing on screen said so.

### What cover is now

A unit defending in a city of its own faction gets `GARRISON_DEFENCE_BONUS`
plus the city's wall bonus, scaled by the stance's `fortifyShare`, so a
garrison that sallies out through the gate to meet the attacker in the open has
given up the thing it was standing behind.

⚠️ **And the city's own defence is a FLOOR.** The bonus alone does not fix the
table above: 8 × 1.5 is still far below 32.5, so garrisoning would have
remained a mistake, just a smaller one. The reading that makes the arithmetic
right is also the one that makes sense: the garrison is fighting *from* the
settlement, so it can never defend worse than the empty settlement would have.

| | defence | damage per blow |
| --- | --- | --- |
| empty city | 32.5 | 14 |
| garrisoned | **32.5** | **14** |
| siege engine, empty | | 47 |
| siege engine, garrisoned | | **47** |

### The counter-play had the same bug in reverse

`SIEGE_CITY_BONUS` was gated on the target being a city, which by the same
`targetKind` logic meant a siege engine lost its entire purpose the moment
anyone stepped inside the walls it was there to break. Both the preview and the
resolution now ask `againstWalls`, which is a different question from
`targetKind`: *is there masonry in this fight*, regardless of who is holding it.

⚠️ **`againstWalls` is computed once, in the preview, and read back by
`resolveAttack`.** The file already carried a warning that a factor applied in
one and not the other silently splits the odds shown from the odds fought, and
this change would have done exactly that: `resolveAttack` recomputed the siege
multiplier from `targetKind === 'city'` on its own. There is a test that
attacks a garrison and asserts the two agree.

### Saying so

Cover costs nothing, has no button, and is invisible: you simply walk in. The
unit panel now reads `(in cover: Workspace)` while it applies, verified on the
deployed build. The attack odds already show the defender's effective strength,
which now includes the cover, so the preview needed no new text.

| # | Decision | Why |
| --- | --- | --- |
| D601 | ⚠️ **A garrison never defends worse than the empty city would have** | The bonus alone left garrisoning a mistake. A floor is both the correct arithmetic and the honest reading: it is fighting from the settlement |
| D602 | Cover is the city bonus plus its walls, scaled by `fortifyShare` | A garrison that comes out through the gate has given up what it was standing behind |
| D603 | ⚠️ **Cover applies only in a city of the unit's OWN faction** | Standing on somebody else's tile is not shelter, and the same test would otherwise hand an attacker the defender's walls |
| D604 | ⚠️ **Siege bonus keys on `againstWalls`, not on `targetKind`** | Gated on "the target is a city", a siege engine lost its entire purpose the moment anyone stepped inside |
| D605 | `againstWalls` is decided in the preview and read back by the resolution | The file already warned that a factor in one and not the other splits the odds shown from the odds fought |
| D606 | The unit panel states the cover | It costs nothing, has no button, and is otherwise invisible. A bonus nobody can see is a bonus nobody uses |

---

## 85. Digging in was worth forty percent and nothing else

Alexander: *"if I fortify the unit than the HP shall slowly grow back up. also
fority shall be a small bonus for fighting. other attacker is a bit less
strong"*.

Two requests, and the first one uncovered something larger.

### Nothing healed a unit. Ever.

Cities repaired their walls and grew their hit points back through rank. A
wounded unit stayed wounded for the rest of the game, and there was no rule
anywhere that put a point back on one.

⚠️ **That compounds, because `hpFactor` scales strength by health.** One bad
fight did not merely leave a unit hurt, it permanently devalued it, and the
only cure available was to lose it and build another. A game that teaches
"your damaged things are worth less for ever, so throw them away" is teaching
something nobody chose to teach.

A dug-in unit now recovers `FORTIFY_HEAL_SHARE` of its own maximum each turn,
in the refresh phase. Expressed as a share rather than a flat number so a
Direct Lake Titan does not take five times as long to mend as a Profiler, which
is pinned by a test that heals one of each and compares the turn counts.

Attached to fortifying rather than granted freely, so mending costs something
real: a unit that stops to recover is not moving, not scouting and not holding
a line somewhere else.

### The second lever, and why it is not just a bigger first one

Fortifying already paid `FORTIFY_DEFENCE_BONUS`, 40 percent on defence. The ask
was for the attacker to be *a bit less strong*, which sounds like the same
thing said differently. It is not.

Raising the defender's strength only reduces the damage the defender takes.
Lowering the **attacker's** strength does that too, and it also raises what the
attacker takes back, because the counterblow divides the same two numbers the
other way round. Charging a prepared position should hurt the person charging,
not merely fail to hurt the person waiting.

Measured on even matchups, isolating the new penalty from the bonus that was
already there:

| | damage dealt to the defender | damage the attacker takes back |
| --- | --- | --- |
| dug in, defence bonus only | −38% | +64% |
| dug in, and the new penalty | **−52%** | **+112%** |

The check that it has not gone too far is that weight still wins: a Pipeline
Runner attacking a fortified Profiler deals 40 and takes 22, so a proper
soldier can still break a dug-in scout. Without that, the only move in the game
becomes fortify and wait.

⚠️ **The penalty is folded into `attacker.effective` rather than carried
alongside it.** `resolveAttack` recomputes damage from that field, so anything
expressed as a separate multiplier has to be remembered twice. That has already
gone wrong twice in this file: the tactic split preview from resolution once,
and `againstWalls` nearly did it again last section. A number baked into
`effective` cannot be forgotten by the second caller, because there is nothing
left to forget.

### A comment I had to take back

⚠️ I wrote the constant's docblock before measuring, and it claimed *"at 0.30 a
dug-in Profiler beat a Pipeline Runner that attacked it"*. That reads like a
measurement and was an invention: I had run nothing. The numbers in the table
above are what the probe actually returned, and the docblock now says those
instead. A fabricated measurement in a comment is worse than no comment, because
the next person has no reason to doubt it.

### Saying so

Mending happens once per turn, between turns, so without a word for it the
player would watch a number go up and have no way to attribute it. The unit
panel now reads `mending +12 HP a turn` while it applies, and only while it
applies: at full health that line would be a promise the game is not keeping.

| # | Decision | Why |
| --- | --- | --- |
| D607 | ⚠️ **Fortifying is the only way a unit heals, and before this nothing was** | A wounded unit was permanently devalued by `hpFactor`, and the only cure was to lose it |
| D608 | The rate is a share of `maxHp`, not a flat number | A Titan must not take five times as long to mend as a Profiler for being larger |
| D609 | Healing is paid for with the turn that fortifying already costs | Free healing removes the decision. Stopping to mend must mean not scouting and not holding a line |
| D610 | ⚠️ **The attacker penalty is a separate lever from the defence bonus** | A bonus only softens the blow; a penalty also stiffens the reply. Charging a prepared position should cost the charger |
| D611 | It is folded into `attacker.effective`, not kept as its own factor | `resolveAttack` recomputes from that field. Two places to remember is how this file has already drifted twice |
| D612 | Weight still wins against a dug-in scout, and that is the tuning check | Otherwise the answer to every question is fortify and wait |
| D613 | ⚠️ **The docblock's measurement was invented and had to be replaced** | It read like evidence. A fabricated number in a comment is worse than silence, because nobody thinks to doubt it |

---

## 86. A cheat that crosses the line the file drew

Alexander: *"implement a cheat code so that I can automatically pick the correct
answer. something like pressing o and k at the same time for 'okay'"*.

### The collision, found before building anything

`cheats.ts` opens with the flattest promise in the repository:

> *A code that wrote to mastery would hand somebody a green 82% and a false
> belief that they can sit DP-600, which is a worse outcome than any amount of
> losing.*

and the console's help text ended every listing with *"None of them can make
you ready. Only answering does that."* There is even a test asserting that
`cheats.ts` cannot so much as reference `mastery`.

An auto-correct-answer cheat walks straight into that: answers flow through
`Dp600ChallengeProvider` into `mastery`, and mastery is the only thing the
readiness figure and the Great Library are built from.

⚠️ **So this was put to Alexander rather than decided quietly**, with three
options: unblock the game but teach the schedule nothing; count it fully; or
count it as a miss. He chose to count it fully, which is his call — it is his
study tool, and a person who wants to skip a question they already know is not
the person the warning was written about.

### What that obliged, and it is the whole point of this section

The claim had to go. It was true of every typed code and became false the
moment the chord existed, and ⚠️ **a promise the code no longer keeps is worse
than no promise**: nobody re-reads help text hunting for sentences that have
quietly stopped being true, and a claim stated that plainly gives the reader no
reason to doubt it. Section 85 had just finished recording exactly this failure
in a code comment (D613).

So the docblock and the help text both say the new rule instead, and a test
bans the old wording **by name**, comparing against the sources with comments
stripped — because both files now explain at length what the promise used to be
and why it went, and checking raw text would make the documentation fail the
test it documents. That stripping trick is not new: the test above it already
does the same thing for the same reason.

The guarantee that survives untouched is the narrower one worth keeping:
`cheats.ts` still cannot reach `mastery`, so every TYPED code is still
incapable of making anyone look ready. The chord lives in `main.ts`.

What keeps the chord honest is disclosure. `okay` goes into `state.cheatsUsed`
on first use, that lives in the save, and the end screen reads it.

### The mechanics

- **A chord, not a key.** The modal is a keyboard surface: 1 to 6 pick options
  and Enter submits. A lone letter is one fumble away from answering a question
  the player meant to read.
- ⚠️ **Keyed on `event.code`, not `event.key`.** `key` is layout-dependent; on
  a German keyboard the physical Z reports "y". "Hold O and K" is a claim about
  where two fingers go, so the code has to name physical keys.
- ⚠️ **Held keys are cleared on `blur` as well as `keyup`.** A key held while
  the window loses focus never gets its keyup, so without that the set keeps
  `KeyO` for ever and a lone K answers questions from then on.
- **Auto-repeat is guarded**, because keydown fires forever while a key is held
  and submitting takes a moment, so the chord would otherwise race itself.
- **One implementation.** `answerOpen` (the harness) and the chord both call
  `answerCurrentQuestion`. Written twice they would drift, which this file has
  already paid for twice over.

Verified on the deployed build: the chord answered a research question,
`cheatsUsed` gained `okay`, the log read *"Okay. Die Antwort hat sich selbst
gewählt."*, the research completed, and a lone K followed by a lone O did
nothing at all.

| # | Decision | Why |
| --- | --- | --- |
| D614 | ⚠️ **The chord counts towards readiness, by explicit instruction** | It contradicts the file's stated rule, so it was put to the owner rather than decided quietly. He owns the study tool and the trade-off |
| D615 | ⚠️ **The old promise was deleted from the help text and the docblock** | It stopped being true. A claim nobody thinks to re-read is the cheapest kind of lie to ship |
| D616 | A test bans the old wording by name, against comment-stripped sources | The files must be free to explain what the promise was without failing the test that removed it |
| D617 | `cheats.ts` still cannot reference `mastery`, and that test stands | The narrower guarantee is still worth keeping: no TYPED code can make anyone look ready |
| D618 | The chord is disclosed in `cheatsUsed` on first use | Disclosure is the only honesty left once the answer counts |
| D619 | ⚠️ **Keyed on `event.code` and cleared on `blur`** | `key` is layout-dependent, and a key held through a focus change never sends keyup |
| D620 | The chord and the harness share `answerCurrentQuestion` | Two copies of "pick the right options and submit" would drift, as the tactic maths already did |

---

## 87. The rank in the sentence was not the rank on the row

Alexander, on the city panel: *"1 more topic at familiar is ambiguous"*.

Two separate ambiguities in one short line, and the first one was worse than
the wording.

### It named a rank the city did not have

The panel showed a city headed **Settlement · pop 4** and, directly underneath,
**"Village needs 1 more topic at familiar"**. Both of those are ranks, they are
one line apart, and the sentence gets the relationship between them backwards:
the Village is the rank being climbed *to*, but `{rank} needs {what}` reads as a
statement about the thing on screen.

⚠️ **The fact was right and only the grammar was wrong**, which is the awkward
kind: nothing is broken, no test can see it, and a player is simply left to
work out that one of the two ranks in front of them is a destination.

Now: `Next rank {rank}: {what}`.

### "at familiar" was not obviously a level

`familiar` is one of four mastery bands (unseen, learning, familiar, strong) and
the Great Library teaches them by name. On its own, though, *"1 more topic at
familiar"* reads as a bare adjective rather than as the name of a level.

`rank.ts` had already written the better phrasing in its own docblock, where it
describes wanting to say *"one more topic **held at** familiar"*. The interface
now says what the code comment always said.

### The German has a trap the English does not

The obvious German is *"Bis zum Dorf: …"*, and it is wrong four times out of
five. ⚠️ **The ranks differ in gender**: *das* Dorf, but *die* Siedlung, *die*
Gemeinde, *die* Stadt, *die* Großstadt. Any phrasing with an article needs
*zum* for one rank and *zur* for the rest, and a single template can carry only
one of them.

`Nächster Rang {rank}` takes no article at all, so it is correct for every rank
without the string needing to know anything about the noun that follows it.

Read off the deployed build:

| | before | after |
| --- | --- | --- |
| EN | Village needs 1 more topic at familiar | Next rank Village: 1 more citizen and 1 more topic held at familiar |
| DE | Dorf braucht 1 Thema mehr auf vertraut | Nächster Rang Dorf: 1 Einwohner mehr und 1 weiteres Thema auf Stufe vertraut |

| # | Decision | Why |
| --- | --- | --- |
| D621 | ⚠️ **The next rank is named as a destination, never as a subject** | Two ranks one line apart, and the sentence claimed the city was the one it is trying to become |
| D622 | The band is named as a level: "held at familiar", "auf Stufe vertraut" | On its own the band name reads as an adjective. `rank.ts` had used the clearer phrasing in its docblock all along |
| D623 | ⚠️ **"Nächster Rang" rather than "Bis zum/zur"** | German rank names differ in gender, so an article-bearing template is wrong for four of the five |

---

## 88. Buried caches

A small number of land tiles hide a cache of one resource. Walk a Profiler over
one and it asks a question; answer it and the cache is yours.

### Why the map needed something to find

The Profiler's entire identity was a sight radius, which is a *passive* virtue:
build one, park it on a hill, forget it. Nothing on the map rewarded going to a
particular place, so exploring was something you did once and then stopped
thinking about. A cache is the first thing in this game that makes a tile worth
walking to for its own sake, and it pays in the currency the early game is
actually short of.

It is also, and this is the point, another place the map asks a question. The
answer goes through the same provider as a battle or a research question, so it
feeds the spaced-repetition schedule identically. A reward for knowing is worth
nothing if the knowing is not recorded.

### A wrong answer shrinks the cache; it does not empty it

Both obvious alternatives are worse:

- **Take it away on a miss.** The one thing a study aid must never do is make a
  wrong answer feel like a punishment for having tried. You explored, you found
  something, you got it wrong, and now the thing is gone: that teaches
  avoidance.
- **Leave it untouched.** Then the question is a formality. Stand on it, answer
  until one lands, collect the full amount. The knowledge check would be
  decorative.

So a miss halves what is left, and a cache worth less than
`TREASURE_WORTH_CARRYING` is removed rather than left on the map as a chest
worth four Data, which would be a promise the game cannot keep.

⚠️ **The halving alone is not a brake, and it took a second look to see it.**
Halving costs the player nothing they had; it only reduces a windfall. The
optimal play was still to grind. The real cost is that **a failed dig ends the
Profiler's turn**: a wrong answer buys a lost march, which is tempo, which is
the thing the early game is short of. Retrying stays possible, exactly as
intended. It is simply not free.

### The whole route is searched, not just the destination

A cache is invisible until its tile has been explored, and the Profiler is
walking into fog. Ordering a six-hex march that happens to cross a cache and
being told nothing would read as the feature being broken, at the precise
moment it should have fired. The first cache on the route is dug up and the
unit still ends where it was sent, so the order the player gave is never
quietly rewritten.

### Visible once explored, and gated on explored rather than on sight

⚠️ The filter is `state.explored`, not current sight. A cache the Profiler
walked past three turns ago is still there and the player still knows it.
Gating on what is lit *now* would make caches blink out the moment the unit
moved on, which reads as somebody else having taken them.

### Placement lives in the save, not in the seed

Everything else on this map is regenerated from the world seed, which is why a
clone is a few megabytes. Caches cannot be: the moment one is opened the field
diverges from what the seed describes, and a save that stored only the seed
would resurrect every cache the player had already emptied. So the field ships
in the save file, `SAVE_VERSION` goes to 9, and the migration from 8 gives an
old empire an **empty** field rather than scattering fresh caches across a map
its Profilers have already walked over.

### Two films, and what they cost

Finding and opening are separate beats and they are separate clips, generated
with Sora 2 (`tools/treasure-clips.py`). ⚠️ They are **ignored by git for size,
not licence**: Azure OpenAI output is ours, unlike the Suno cue that keeps the
teaser out, but D59 says a clone stays a few megabytes and 4.9 MB for one
optional flourish is not the place to break that. A clone without them plays
both beats as no-ops; the cache is still found and still paid out.

Three things the runner learned the expensive way, all now in the script:

- The terminal status is **`completed`**, not `succeeded`. Waiting for
  `succeeded` polls a finished job forever.
- The content path is **`/content`**, not `/content/video`. The older shape
  returns a flat 404 that reads exactly like an expired job.
- A transient **500 while polling** used to kill the job client-side and throw
  away a paid generation. 5xx now retries; 4xx still fails fast, because that
  is a real mistake in the request and will never come good.

### A bug the tests found before a player could

`video.play()` is specified to return a promise and every current browser does,
but the older signature returned `undefined` and jsdom still does. `.catch` on
that throws a `TypeError` **synchronously out of `play()`**, which is worse
than the rejection it was meant to handle: the beat never resolves and the turn
hangs behind a cache that will not settle. Wrapped in `Promise.resolve`.

| # | Decision | Why |
| --- | --- | --- |
| D624 | Only the Profiler digs | The scout unit's one virtue was passive. This is the job that turns exploring into something the empire can spend |
| D625 | ⚠️ **A miss halves the cache rather than emptying it** | Removing it punishes having tried, which is the one thing a study aid must not do; leaving it untouched makes the question decorative |
| D626 | ⚠️ **A failed dig also ends the Profiler's turn** | The halving costs the player nothing they had, so grinding was still optimal. Tempo is the real price, and the cache is never taken away |
| D627 | A cache below `TREASURE_WORTH_CARRYING` is removed | A chest worth four Data is a promise the map cannot keep |
| D628 | The whole walked route is searched, not the destination | The player is marching into fog and cannot see the cache; missing one it crossed reads as the feature being broken |
| D629 | ⚠️ **Visibility gated on `explored`, not on current sight** | Otherwise caches blink out when the unit moves on, which reads as somebody else taking them |
| D630 | ⚠️ **The cache field lives in the save, not in the seed** | Opening one diverges from the seed. A seed-only save would resurrect every cache already emptied |
| D631 | Migration from save 8 gives an empty field | Scattering fresh caches over a map whose Profilers have already walked it would be a reward for loading |
| D632 | The clips are git-ignored for **size**, not licence | Azure OpenAI output is ours, so this is D59's rule rather than the teaser's licence problem. Both beats no-op without them |
| D633 | The clips are stripped of audio, and the element is muted too | Sora returns a music bed with every clip, and the game's own score is already playing |

---

## 89. Arrows to step through the army

The selection panel now carries `‹ 2/2 ›` on its title row, and `[` / `]` do
the same thing from the keyboard.

### Why not reuse the key that already existed

Tab and `n` have always jumped to the next unit *still awaiting orders*, which
filters on `movesLeft > 0 && !fortified`. That is right for playing a turn
quickly and wrong for looking at your army, and reusing it here would have
produced a trap: the unit that prompted this, a Profiler at `0/3 moves` and
fortified, is one the idle cycle deliberately skips. Arrows built on it could
show that unit and then never come back to it. So the arrows walk **every**
unit the player owns.

⚠️ The order is `state.units` insertion order, deliberately not a sort by
position. Sorting would reshuffle the whole army whenever anything moved, and
the arrows would stop being a way to walk a line you recognise.

### The small things that were still decisions

- **From no selection, forward goes to the first unit and back to the last.**
  Both landing on the same one would make the two arrows identical in exactly
  the state a player reaches for them: just after a unit died.
- **`+ count * 2` before the modulo.** A bare `-1 % 3` is `-1` in JavaScript,
  which indexes nothing and selects `undefined`.
- **The stepper is refreshed before `refreshSelection`'s early return**, or it
  sits disabled precisely when nothing is selected.
- **`[` and `]`, not the arrow keys.** Free flight already gives the arrow keys
  a meaning (turn the camera). Four keys meaning "look" in one mode and "change
  unit" in the other is the kind of thing learned once, in the wrong mode.

## 90. ⚠️ The publishable gate was scanning one commit too late

`verify_publishable.py` enumerated with a bare `git ls-files`, i.e. **tracked
files only**. A brand-new file is therefore invisible to it until the commit
that adds it has already been made.

This is not theoretical. Section 88's `tools/treasure-clips.py` was written,
run through `npm run verify` clean at 214 files, and committed **with a
hard-coded Azure OpenAI resource host and a `C:\Users\<name>` path in it**. The
gate reported the leak on the next run, from the git history, where deleting
the line no longer removes it.

A gate whose whole job is to run before publication, and which cannot see the
thing being published until after it is published, did not run at all.

Now `git ls-files --cached --others --exclude-standard`: untracked-and-ignored
is genuinely not published, untracked-and-stage-able is about to be.
`.gitignore` is still honoured, so build output and the ignored media stay out.
Proven by planting a file with a known-bad host and watching the count go 219 →
221 with one finding.

| # | Decision | Why |
| --- | --- | --- |
| D634 | The arrows walk **every** unit, unlike Tab's idle cycle | A fortified or spent unit is exactly the one worth inspecting; skipping it means the unit on screen cannot be returned to |
| D635 | Cycle order is `state.units` insertion order, never sorted | A positional sort reshuffles the army whenever anything moves |
| D636 | From no selection, the two arrows land on different units | Otherwise they are identical in the state that prompts their use |
| D637 | `[` and `]` rather than the arrow keys | Free flight already uses the arrows to look around |
| D638 | ⚠️ **The publishable gate scans untracked files too** | Tracked-only meant a new file was first scanned one commit after it was published, which is the one moment the gate exists to prevent |

---

## 91. One fight's preparation stops leaking into every other fight

Two changes, and the second was a bug that had been live for as long as
stances have existed.

### Sally and hold are town words

Section 19.4 asked for a stance on **every** raid, reasoning that "storming a
wall that is not there is not a choice, but a defender always has one". In play
that was wrong twice over.

The words describe a gate: *sally out*, *open the gates*, *hold the line*. Put
them on a scout caught in a field and they name something that is not there.
And the trade the stance exists to make is giving away fortification you paid
for, which a unit standing in grass has not got: `fortifyShare` scales a number
that is zero, so two of the three options collapse into each other. Three
options where two are identical is a menu, not a decision.

⚠️ **This reverses the earlier decision rather than refining it**, and the old
reasoning is left in the commit history rather than in a comment claiming both
things at once. Everything that is not a town now defends the way it did before
stances existed, which is `hold`: a no-op on every number in combat.

### ⚠️ The real defect: one answer was applied to every fight on the map

`endTurn` took `defenderChallengeScore` and `defenceStance` and handed both to
the **whole enemy phase**. Every faction, every attack, every defender.

So bracing a city in the north also braced a lone Profiler being jumped in the
south, and a battle question answered about one siege stiffened every unrelated
skirmish in the same breath. Neither of those defenders was in the fight the
player was shown, and neither owner was offered a choice about it.

Both are now scoped by a new `defendAt` option naming the tile the player was
actually asked about. Everything else that turn fights on its own merits.

⚠️ **Absent means nothing is prepared, not everything is prepared.** The two
defaults are not symmetrically risky: a caller that forgets to name a tile
loses a bonus it can see is missing, whereas the old default spread one answer
silently across the map. Measured in `engine/test/ai.test.ts`: brace-aimed-
elsewhere now equals hold exactly, and brace-aimed-here is still visibly softer.

### A town outranks whatever the enemy happened to do first

The turn choreographs exactly one incoming raid, and it took `raids[0]`. A city
could be stormed in the same turn a scout was jumped and never be mentioned.
Now a raid on a town jumps the queue.

⚠️ **`presentEnemyTurn` had to be told which one**, because it re-derived the
featured raid as "the first one the player defends". Two rules for the same
question stopped agreeing the moment towns were preferred, and the banner and
question would have sat on a city while the duel was fought over a scout.

### The defender's side of a siege could not be staged at all

`spawnEnemyAdjacent` takes a unit; `plantWalledCity` plants an **enemy** town.
Both exist to exercise the player as the attacker. There was no way to make the
AI come at a town of yours, so the one dialog that now only appears when a town
is attacked could be reasoned about but not watched. `besiegeMyCity` fixes
that, for the same reason `plantWalledCity` exists.

### ⚠️ Unresolved: the AI did not attack my city, and I did not find out why

Measured on the deployed build: a player city at full health with **six hostile
units adjacent**, over four turns, took **zero damage** and produced no raid.

`planUnitAction` does list cities and scores them ahead of units, so the
suspect is the `HOPELESS_ASSAULT_TURNS = 12` guard: a fresh unwalled town has a
200-point shield, so any raider averaging under ~17 damage a hit is talked out
of the assault. That is a **hypothesis, not a finding.** An attempt to measure
`expectedDamageToDefender` directly returned 0 from a hand-built city object,
which almost certainly means the fixture was malformed rather than that the
maths says zero, so it proves nothing and was deleted rather than written up.

Recorded here because it matters to section 91: if the player is never
besieged, the stance dialog this section just narrowed to towns is a feature
nobody will meet. Worth a section of its own.

| # | Decision | Why |
| --- | --- | --- |
| D639 | ⚠️ **The stance is asked only when a town is attacked**, reversing 19.4 | Sally and hold name a gate; on a unit in the open two of the three options are the same option |
| D640 | ⚠️ **`defendAt` scopes the stance AND the battle answer to one tile** | Both used to apply to every fight in the enemy phase, including defenders the player never saw |
| D641 | No tile named means nothing is prepared | The opposite default is what caused D640's bug, and it fails silently; this one fails visibly |
| D642 | A raid on a town jumps the queue for the turn's alert | A city is permanent and is what the game is lost over; it should not be hidden behind a skirmish |
| D643 | `presentEnemyTurn` is **told** the featured raid rather than re-deriving it | Two rules answering the same question drift, and these two did the moment towns were preferred |
| D644 | `besiegeMyCity` harness affordance | The defender's half of a siege was unobservable in a browser, which is how 19.4 shipped a dialog nobody had watched |

---

## 92. A question you got right does not come back

The complaint: the same question kept reappearing after it had been answered
correctly.

### Why it did

Two things combined. `selectQuestion` had a set of ids already asked this
session, but it was a **preference**: when the skill had nothing else left the
set was ignored and a question repeated. And the bank holds **exactly three
questions per skill** (measured: 123 across 41 skills, every skill at three),
so "nothing else left" arrived after three asks on a topic.

Meanwhile the compressed session clock brings a topic back after
`SESSION_DAY_MS` = 75 seconds on its first successful review. Three asks is not
far away.

### The rule now

A question comes back only if it was **wrong**, **abandoned**, or **nearly ran
the clock out**. Anything else is retired for the session.

⚠️ **"Nearly ran out" is not the fast/slow scoring line.** Scoring splits at
half the thinking budget, and reusing that boundary would have sent a
comfortable eight-second answer round again: at the default pace the budget is
fourteen seconds, so half of it is barely a pause for thought. `LABOURED_SHARE`
is 0.8, which is about whether the player was reconstructing rather than
recalling. A correct answer past half still scores 0.6 rather than 1: being
unhurried costs a little, it does not cost you the question twice.

⚠️ **A question that must come back is also removed from the soft-avoid set.**
Otherwise the two rules pull against each other: one says "ask this again", the
other says "prefer anything else", and with three per skill the missed question
would be the last of the three to reappear rather than a candidate at once.

### Retirement is session-scoped, and that is the whole point

⚠️ It is deliberately **not** persisted next to mastery. A question retired for
good would mean a topic answered right once is never tested again, which is the
opposite of what spaced repetition exists to do. The SM-2 schedule carries
knowledge between sittings; this set only stops the repetition inside one.

### ⚠️ Borrowing means the scheduler must be told the truth

With three questions a skill, answering all three well leaves a topic with
nothing to ask. Rather than run a battle with no question in it, and therefore
no defence bonus, as a *reward* for knowing the material, `selectQuestion` will
borrow from a neighbour: same cluster first, the wider exam only if that is
spent too.

That breaks the game's promise that the faction attacking you tells you what
you are about to be tested on, which is the accepted cost.

But it introduced a subtler risk that had to be closed in the same change: the
provider recorded every answer against `request.topicId`. A borrowed question
would therefore have credited the player with knowing a topic **they were never
asked about**, and pushed its review further out. `ChallengeOutcome` now carries
an optional `topicId` naming what was really asked, and the provider schedules
against that. The engine still never interprets it.

### A test that was passing for the wrong reason

The first version of the harness answered with `options[0]`, because the bank
ships answers only as a hash. That is correct about a quarter of the time by
luck, so every "answered correctly" assertion was quietly testing something
else, and the no-repeat test failed in a way that looked like a product bug.
It now finds the right answer by checking candidates against `answerHash`,
which is what the real presenter does.

### What was and was not verified in the browser

Verified: eight consecutive research questions, no repeats, loop healthy.

⚠️ **Not verified live: the same topic recurring.** Research asks each topic
once, and the two paths that re-ask a topic both needed something the save did
not have (a unit for the council, an AI willing to besiege for battles, which
is section 91's open question). `wipeSave` did not clear the save either, so a
fresh game could not be staged. The rule itself is covered by twelve tests
through the real presenter, real bank and real answer hashing; the **wiring**,
which those tests cannot see because they build their own presenter, is pinned
by `app/test/reaskWiring.test.ts`.

| # | Decision | Why |
| --- | --- | --- |
| D645 | ⚠️ **A correct, prompt answer retires the question for the session** | Three questions a skill plus a soft avoid-set meant a known question came back within one sitting |
| D646 | ⚠️ **The re-ask threshold is 0.8 of the budget, not the 0.5 scoring line** | Half the budget is fourteen seconds' worth of nothing; re-asking there punishes thinking rather than catching reconstruction |
| D647 | A question due to be re-asked leaves the soft-avoid set too | Otherwise "ask it again" and "prefer anything else" contradict each other |
| D648 | Retirement is session-scoped and never persisted | Permanent retirement is the opposite of spaced repetition |
| D649 | A dry topic borrows from its cluster rather than asking nothing | A battle with no question is no defence bonus, awarded for knowing the material |
| D650 | ⚠️ **`ChallengeOutcome.topicId` reports what was really asked** | Borrowing otherwise credits a topic the player never answered and delays its review |

---

## 93. A city's health, which nothing was showing

Walls had a readout. The town behind them did not.

### Why it matters more than it looks

⚠️ **A city never heals.** Nothing in the engine restores `city.hp`, and
promotion deliberately grants the difference between two rank bonuses rather
than topping up, so the ceiling rises and the damage stays. A town chipped in
turn twelve is still chipped at the end of the game.

That makes this a permanent record rather than a bar that quietly refills, and
a player who could not see the number had no way to learn that a raid they
shrugged off had cost them something they would never get back.

### The ceiling was never written down

`baseHp + bonusHp` existed only as an implication: `promoteCities` moves the
total by adding a *difference*, so the total itself appeared nowhere and any
caller wanting it had to rediscover the formula. `maxCityHp` now states it once,
as `maxWallHp` already did for walls, with `cityIntegrity` for the fraction.

### Shown in three places, on two different rules

- **The city panel**, on every row, amber when hurt. Amber rather than the red
  `.blocked` already uses: red on that panel means "this cannot proceed", and a
  chipped town is a fact, not an obstruction.
- **The tile panel**, appended to the yields rather than replacing them. What a
  tile grows is the reason to settle there and the reason to take it off
  somebody; that question should not be answered away.
- **A bar on the map, only when damaged.** Eight capitals each wearing a full
  green bar all game is furniture: on screen constantly, meaning nothing, so
  the one moment it matters is the moment nobody looks.

### ⚠️ The bar leaked through fog, and the scene had already solved this

Overlay sprites are drawn with `depthTest: false` so a marker on a hillside is
never buried by the hill in front of it. That also means they punch straight
through fog. The first version of the loop therefore hovered a health bar over
towns the player could not see, including remembered ground where the scene
**deliberately refuses to draw the town at all** — its comment says a
remembered village must not become "a permanent live readout of a place they
walked past once, including whether it still stands after somebody else took
it". The bar would have been exactly that readout.

Fixed by reusing the scene's own `canSee`: your own always, anybody else's only
while in sight. The tile panel got the same gate for the same reason.

⚠️ **Found by accident.** The guard was missing, and what surfaced it was a
test whose `indexOf` matched the wrong `for (const city of ...)` loop; the
failure message quoted the fog comment from the loop above. A test that failed
for the wrong reason still pointed at a real bug.

⚠️ **Left alone, and worth naming**: the tile panel already reports a city's
**name and owner** with no such gate, which contradicts the scene and predates
this change. Widening the leak would have been easy; closing it is a separate
decision about how much the map should hide.

### Seeing it required a way to break a town

There was no route to a damaged city on demand. An assault needs an army the
harness cannot raise in a turn, and an AI siege is section 91's open question,
so the one visual this feature ships could be reasoned about and never looked
at. `hurtCity` is the affordance, clamped to the real ceiling so an
out-of-range fraction cannot render as a glitch instead of as a wrong number.

Measured on the deployed build: one 128×20 bar sprite at the city's position
while damaged, **zero** at full health, one again at low health.

| # | Decision | Why |
| --- | --- | --- |
| D651 | `maxCityHp` / `cityIntegrity` in the engine, not arithmetic in the app | The ceiling was implied by a delta and written down nowhere; two copies drift |
| D652 | ⚠️ **The map bar appears only when a town is damaged** | Eight permanent green bars is furniture, and furniture is invisible exactly when it matters |
| D653 | ⚠️ **Both the bar and the panel HP are gated on `canSee`** | Overlay sprites ignore depth and so ignore fog; the scene already refuses to draw remembered towns for this reason |
| D654 | The tile panel appends HP to the yields rather than replacing them | The yield is why the tile is worth having; the health is a second question |
| D655 | Amber for a hurt city, not the panel's existing red | Red there means "blocked"; damage is a fact, not an obstruction |
| D656 | The bar is quantised to twelfths and cached | A bar drawn from the exact fraction is a texture upload per damaged town per frame, for a sub-pixel difference |
| D657 | `hurtCity` harness affordance | Otherwise the only visual this section ships could never be seen where it runs |

---

## 94. Towns you have found stay found

Fog used to erase a town completely the moment you looked away, so a village
found on turn three was unfindable on turn four.

### ⚠️ This does not reverse the old rule, it answers its objection

The scene refused to draw a remembered town, and its reasoning was exact: the
player would get *"a permanent live readout of a place they walked past once,
including whether it still stands after somebody else took it"*.

That objection is correct, and it is an argument against drawing the **live**
city, not against drawing anything. What is kept instead is a **snapshot**:
position, name, owner, size and walls **as they were when last seen**, plus the
turn the picture was taken.

So a town that changes hands, grows, fortifies or is razed while you are away
keeps its old face on your map until you go back and look. Scouting stays worth
doing, and the question that prompted this is answered: where was it, and whose
was it when I found it.

⚠️ **`SeenCity` carries no `hp` and no `wallHp`.** Those change every time
somebody swings at the place, so reporting them would be the surveillance the
fog rule exists to prevent wearing the word "remembered" as a disguise.
`breached` is kept, because a broken wall is visible from outside and changes
the silhouette; the number behind it is not.

### Keyed by hex, because the player remembers a place

A razed town and whatever is built on the same ground later are one memory. A
city id would make them two, and the first would haunt the map for ever.

### ⚠️ Forgetting is as important as remembering

A remembered tile that is **in sight and has no town on it** is forgotten. With
that missing, a razed village keeps its ghost standing on empty ground, and the
one way the player could check, by walking back, is exactly where the lie would
survive.

### ⚠️ The memory is the human's, and the code that fills it runs for everyone

`rememberVisible` and `moveUnit` are shared with the seven antagonists, who
roam the whole map. Without a guard the player's map would fill in with every
town the AI walked past, within a few turns, while the ground around them
stayed dark: less a feature than a broken fog.

Decided from `isPlayer` on the faction rather than by importing
`PLAYER_FACTION_ID`, because that constant lives in the module which imports
`vision.ts` and taking the value would close the cycle.

### Ghosts clone their materials

⚠️ `entities.ts` caches materials by name and shares one instance across every
building in the game, so dimming in place would fade every town on the map
including the one you are standing in. Each ghost clones, and `disposeGhost`
frees the clones: nothing else ever will, and a ghost is rebuilt whenever the
remembered picture changes.

Measured on the deployed build: **29 ghost meshes** at opacity 0.42 with
`depthWrite: false`, alongside **164 untouched opaque meshes** elsewhere.

### What was verified, and what is a judgement call

Verified live: a town planted beside a Profiler was recorded on the next move
(`turnSeen: 1`), survived the units walking six hexes away (`inSight: false`,
still remembered), and drew as a desaturated silhouette in the fog.

⚠️ **The ghost is faint.** At 0.42 opacity against a bright fog lid it reads
clearly at close zoom and is easy to miss at the zoom a player plans at. That
is a deliberate starting point rather than a measured optimum, and the obvious
dial if it turns out to be too subtle.

| # | Decision | Why |
| --- | --- | --- |
| D658 | ⚠️ **A remembered town is a SNAPSHOT, never the live city** | Answers the original objection instead of overruling it: memory goes stale, surveillance does not |
| D659 | The memory carries no hit points and no wall hit points | Live combat state is exactly what the fog rule was protecting |
| D660 | Keyed by hex, not by city id | The player remembers a place; a razed town and its replacement are one memory |
| D661 | ⚠️ **A visibly empty remembered tile is forgotten** | Otherwise a razed village haunts the map, and walking back is where the lie would survive |
| D662 | ⚠️ **Only the human's sight fills the memory** | The same code runs for seven roaming antagonists, who would hand the player the whole town list |
| D663 | Towns passed en route are photographed, not just ones in sight at the destination | A scout marching past a village is precisely the "found it once" case |
| D664 | Ghost materials are cloned and disposed | Materials are shared by name; dimming in place fades every town in the game |
| D665 | Save 10 migrates to an EMPTY memory | Photographing today's towns and labelling them "seen on turn four" is a lie in the player's favour |

---

## 95. The antagonists would not storm a town, and walls made it obvious

Section 91 recorded this as an open question with a hypothesis. The hypothesis
was right, the cause was worse than expected, and the player found it by
building walls and watching enemies gather outside them for the rest of the
game.

### The measurement

Seed FABRIC, one Pipeline Runner beside a fresh Workspace:

| walls | shield | damage per hit | turns to take it, alone |
| --- | --- | --- | --- |
| none | 200 | 10 | **20** |
| 1 | 240 | 10 | 24 |
| 2 | 280 | 10 | 28 |
| 3 | 320 | 10 | **32** |

`HOPELESS_ASSAULT_TURNS` was **12**, so every row is a refusal. ⚠️ **Walls did
not cause this.** A lone raider declined an *unwalled* town too; fortifying
only widened the margin and gave the player a reason to stand and watch.

Note the damage: **exactly `MIN_DAMAGE`**. A line unit against a town is
already at the floor.

### The real error was the question, not the number

The guard asked **each raider privately** whether *it alone* could break the
town. Six units around a capital break it six times faster, and every one of
them individually answered no, so nobody attacked. Six-to-one must never
resolve to nobody moving.

`siegeRate` now sums what the whole force can take off in a turn, gated by the
same `canAttack` the attack itself uses, so a unit that is out of moves or out
of range is not counted as part of a force it cannot join.

⚠️ **Only the acting faction's units count.** The seven antagonists plan
separately and do not coordinate; pooling their arithmetic would have them
besiege as a coalition the rules never agreed to.

### And the number, deliberately, second

12 turns was quietly cautious rather than generous, which is the opposite of
what its own comment claims for it. At **24** a lone unit will besiege an
unwalled town (20 turns) and still declines a full fortress alone (32), which
is correct: at floor damage into `WALL_MEND_PER_CYCLE` it is hitting a wall
that repairs faster than it breaks. That refusal is kept as its own assertion
so the fix cannot drift into "everybody always attacks".

### ⚠️ Why every test passed while this was true

`siege.test.ts` proves a level-three wall can be broken, and does it by calling
`resolveAttack` **directly**. The combat maths was never wrong. What was wrong
was the decision to enter combat, and nothing tested that, so the suite was
green while the antagonists quietly refused to play.

That is the same lesson `siege.test.ts` already records one level down, where
free wall mending made a city untakeable while every unit test passed. Twice
now, in the same subsystem: **a rule proven in isolation says nothing about
whether anything ever invokes it.** `siegeWillingness.test.ts` is the missing
half.

### ⚠️ Two fixtures lied before one told the truth

The first attempt at measuring this (section 91) built a `City` by hand,
omitted half its fields, got `expectedDamageToDefender: 0` and was correctly
thrown away rather than believed. The second attempt built a complete city and
still reported 0 at **every** wall level including none, which reads exactly
like the bug and is really a fixture that forgot to set `activeFactionId` to
the attacking faction. Only the third measurement was real.

A fixture that produces the answer you are expecting is the most dangerous kind.

### Verified in the running game

Six besiegers ringed a freshly founded town: **200 → 140 → 79 → 14** over three
turns. The same arrangement before the fix took **zero** damage over four.

| # | Decision | Why |
| --- | --- | --- |
| D666 | ⚠️ **The siege is judged by the faction's whole force, not one raider** | Asking each unit privately makes six-to-one resolve to nobody attacking |
| D667 | Only the acting faction's units count toward the rate | The antagonists do not coordinate, and pooling would invent an alliance |
| D668 | `HOPELESS_ASSAULT_TURNS` 12 → 24 | 12 refused even an unwalled town, which the constant's own comment forbids |
| D669 | A lone unit still declines a full fortress, asserted explicitly | Floor damage into a faster-mending wall is the pathological case the guard is for |
| D670 | ⚠️ **Willingness gets its own test file** | Proving a wall can be broken says nothing about whether anybody chooses to break it |

---

## 96. Codes for reaching the parts of the game that are hard to reach

Seven new console codes, so a rule can be looked at in the minute it takes to
type rather than the forty turns it takes to play.

### Why this is not indulgence

⚠️ **Every rule this project has shipped broken was one nobody could reach.**
Section 59 shipped the assault dialog without it ever opening in a browser,
which is why `plantWalledCity` exists. Section 91 could not stage a besieged
town and left a real defect open for weeks. Section 95 then found that defect,
and it had been invisible because producing the situation took four turns of
setup that nobody was going to do twice.

A code is cheaper than a harness: it works in the shipped build, on a real
save, for the person actually playing.

| code | what it is for |
| --- | --- |
| `provision <unit>` | muster any unit, so a type can be tried without building it |
| `noisyneighbour` | a hostile ring closes on your town, ready to storm it next turn |
| `firewall` | a walled rival town next door, to practise assaults on |
| `spill` | your town drops to half, so damage and the health bar are visible |
| `scaleup` | four citizens, so the rank ladder can be walked |
| `lineage` | every tile explored |
| `shortcut` | a buried cache beside your Profiler |

### Two of them stop short on purpose

- ⚠️ **`scaleup` grants citizens, never the rank.** Promotion also needs
  retained knowledge, which lives on the other side of the D35 line. Setting
  `rank` would step over the one gate this game exists to make you earn and
  leave a Township whose Library says nothing is known.
- ⚠️ **`lineage` sets `explored`, not sight.** It lifts the black; it does not
  hand over a live feed of what is standing there. Towns still have to be
  walked past before they are remembered, so section 94's memory keeps telling
  the truth about what was actually seen.

Neither touches `mastery`, which is the rule the whole file is built on.

### Arguments, without making typos into near-misses

`provision profiler` needed the console to split a code from its argument, and
the console strips spaces before matching. Prefix matching solves it, but only
for codes that declare `takesArgument`: if every code swallowed a suffix,
`onelakes` would quietly run `onelake` and nothing could ever tell the player
they had mistyped. Longest prefix wins, so a future code beginning with an
existing one cannot capture it.

### ⚠️ The first version failed on exactly the board it was for

Measured on a real save at turn 12: **three of six new codes returned "no
room"**, because the town was already ringed by units. They looked only at the
six adjacent hexes.

`nearestFreeSpot` now searches outward in rings, bounded so an enclosed lake
ends the search rather than spiralling off the map. ⚠️ The old one-ring finder
was also behind `conjure`, so `directlake`, `mirrored` and `provision` had all
been failing the same way for as long as they had existed.

And `noisyneighbour` now treats a full ring as **success**: somebody already
besieging the town is the state it exists to produce, so saying "no room" there
reports the code as broken at the moment it has nothing left to do.

The help listing's `padEnd` was a hard-coded 14 while the longest code was 12.
`noisyneighbour` is 14, which would have printed with no gap before its
description. The width is derived from the codes now.

| # | Decision | Why |
| --- | --- | --- |
| D671 | Seven codes for the situations that take turns to reach | Every rule shipped broken here was one nobody could get to quickly |
| D672 | ⚠️ **`scaleup` grants citizens, not the rank** | Rank needs retained knowledge, which is the one gate that must stay earned |
| D673 | ⚠️ **`lineage` explores, never reveals occupants** | Otherwise the town memory stops recording what was actually seen |
| D674 | Arguments only for codes that opt in | A code that swallows any suffix can never report a typo |
| D675 | ⚠️ **Spawn searches outward in rings, not one ring** | The one-ring version failed on the crowded boards these codes exist for, and had been failing for `directlake` and `mirrored` all along |
| D676 | A full ring is success for `noisyneighbour` | The town being already invested is the outcome, not an error |
| D677 | The help column width is derived from the codes | A hard-coded 14 was already one character short of the new longest code |

## 97. Taking a walled town is a siege now, not a duel with extra numbers

Storming a city ran the same animation as two machines meeting in a field: one
lunge, one flash, and a number. Section 19.3 had already made the assault a
*decision* by asking how you go in, but the three tactics all looked identical,
so the dialog was asking a question the screen never answered. A wall was a
number that made another number smaller.

`app/src/three/siege.ts` stages the assault instead. A town gets a siege; a unit
in the open still gets a duel, because a ram rolling up to a lone scout in a
field would be sillier than the lunge it replaced. The choice is keyed on there
being a **city on the tile**, not on `targetKind`: a garrison standing in its own
town reports as a unit, and staging that as two machines meeting in the open
would put the fight outside walls that are visibly right there.

Each tactic is its own routine, and each one branches on what the **engine**
reported, never on what the renderer guessed. `CombatLog` now carries `tactic`,
`stance` and `wallBroken` for the same reason `ChallengeOutcome` carries
`topicId`: the rules decided it, so the rules should be the ones saying it. An
animation that picked its own tactic would make the assault dialog a lie.

- **Batter** rolls a ram up to the gate and swings it.
- **Escalade** throws ladders against the face and sends figures up them, and
  the garrison makes them pay on the way.
- **Sap** works a charge in under the foot of the wall, and the wall comes down.

The garrison is on the parapet before any of it starts, standing to, bracing
behind the merlons, or coming out of the gate, according to the stance the
defender actually chose.

### What the deployed build showed that the code could not

Three faults, none of which any test could have caught, and all three found by
looking at it:

**The shot was of masonry, with the fight off screen.** The camera aimed at
`wallHead`, the top of the wall. A low camera looking *up* at a parapet puts the
ram, the ladders and every soldier below the bottom edge of the frame. It aims
at mid-wall now, which holds the foot of the wall and the defenders on top in
one frame.

**The camera stood inside a tree.** At height 0.52 it sat in the canopy of the
scenery on the attacker's own hex, and one of them filled the middle of the
picture. Just over head height clears them, and is the angle the shot wanted.

**The whole thing was composed behind the interface.** The research panel, the
city panel, the unit card, the log, and the battle banner across the middle.
`cinematicOverlay` already owned the fix and said so in its own comment, so the
siege borrows it rather than growing a second way to fade the same panels. The
banner is added to that fade: it outlives the shot, so fading it delays the
numbers rather than hiding them.

Bars and title card stay **off**. Those are sized for the intro and first blood,
which fire once a game. A siege fires several times a turn late on, and stamping
a title card over every one turns a flourish into a tax. What it does inherit is
Escape, because the overlay's skip is already wired to `scene.cinema.skip()`.

⚠️ **Skipping is a presentation choice and must never become a rules choice.**
`onImpact` is what hands the resolved state to the map, so a siege that returned
early without calling it would leave the board showing a fight that never
happened. It is idempotent and fired from the `finally` on every path, including
the thrown one. The abort itself is checked between beats rather than inside
every tween: the wait is at most one beat, and the alternative is an abort flag
threaded through sixteen call sites to save a player half a second.

Props are built per siege and disposed in a `finally`, because these materials
are not in the `entities.ts` cache and nothing else will ever free them. Verified
live rather than asserted: mesh count returned to exactly 607 after three
consecutive sieges of different tactics.

⚠️ The wall geometry is **imported** from the city builder, not copied. An
earlier draft kept its own `WALL_RADIUS` and height formula guarded by a test
asserting the two copies agreed, which is a worse answer than not having the
duplicate.

### On testing a thing that has to be looked at

`app/test/siegeStaging.test.ts` reads the source rather than running it, and that
is a deliberate limit. `siege.ts` builds geometry, drives a camera and animates on
`requestAnimationFrame`; running it headlessly would test a mock of the renderer,
which is the exact shape of test that let section 95's bug live for weeks. What
it pins are the decisions: that each tactic is staged differently, that the
branch reads the engine's tactic, that every call site frames the shot, and that
the blow lands even when skipped. The two camera guards are on the *numbers*,
because in both cases the number was the whole fix.

What it looks like was a question for eyes, and the three faults above are what
those eyes found.

### An unrelated flake, fixed here because it blocked the gate

The full suite began failing on a **different file each run**, first `ai.test.ts`
at 27.6 s, then `questions.test.ts` at 41 s, both passing in isolation. That is
scheduling noise against a fixed timeout, not a broken rule. `questions.test.ts`
now sets its own budget the way `engine/test/worldSetup.test.ts` already did.

| # | Decision | Why |
| --- | --- | --- |
| D678 | A city assault is staged as a siege; a field fight stays a duel | The tactic dialog was asking a question the screen never answered |
| D679 | ⚠️ **Keyed on a city being on the tile, not on `targetKind`** | A garrison in its own town reports as a unit, and would fight outside its own visible walls |
| D680 | ⚠️ **The staging branches on the tactic the ENGINE reported** | An animation that picks its own tactic makes the assault dialog a lie |
| D681 | `CombatLog` carries `tactic`, `stance` and `wallBroken` | The rules decided it, so the rules should say it, exactly as with `topicId` |
| D682 | The outward normal runs town → attacker | Built the other way, the first draft assaulted the back of the fortress while the army stood behind the camera |
| D683 | ⚠️ **The shot aims at mid-wall, not at the parapet** | Aiming at the wall head put the ram, the ladders and every soldier below the bottom of the frame |
| D684 | ⚠️ **The camera sits above the canopy, not in it** | At 0.52 it stood inside the scenery on the attacker's own hex |
| D685 | The siege borrows `cinematicOverlay` rather than fading panels itself | The overlay already owned the answer and documented it |
| D686 | Bars and title card off for a siege | They are sized for once-a-game moments; a siege fires several times a turn |
| D687 | The battle banner fades with the panels | It outlives the shot, so this delays the numbers rather than hiding them |
| D688 | ⚠️ **`onImpact` is idempotent and fires from the `finally`** | Skipping is a presentation choice and must never become a rules choice |
| D689 | The skip is checked between beats, not inside every tween | An abort flag through sixteen call sites to save half a second is the worse trade |
| D690 | Props are built per siege and disposed explicitly | They are not in the `entities.ts` cache, so nothing else would ever free them |
| D691 | The staging tests read the source instead of running it | Running a renderer headlessly tests a mock, which is how section 95's bug survived |
| D692 | `questions.test.ts` sets its own timeout | The suite was failing on a different file each run from scheduling noise, following the precedent in `worldSetup.test.ts` |

## 98. Every empire is a seat, and the empty ones can be taken

The game had one human and asked "is this the player" all over the rules. That
is the right question with one student in it and the wrong one the moment a
second person wants to play, so this section makes it "is anybody playing this".

The change turned out to be smaller than it looked, because `Faction.isPlayer`
was already doing the work. Every rule that read it was really asking one of two
things, "should the machine move this empire" and "does this empire accumulate
map memory", and both have the same answer for a second human as for the first.
So the seat model is that flag **stopping being singular**: `control: 'human' |
'ai'`, and the ten call sites that read the old boolean were already correct.

`'ai'` means nobody is holding the seat and the machine is keeping it warm. That
is what makes a game joinable at all: an empire that has been fighting for
thirty turns has towns, an army and a position, and taking it over is a change
of driver rather than a spawn.

### The fog had to be split, and it was the only large part

`GameState.explored` was one set, with a comment explaining that a set per
faction would leave six of the seven permanently empty. That reasoning was
sound and it expires exactly when a second person sits down: two humans sharing
one memory hands each of them the other's scouting, silently, with nothing on
screen to say it happened. On one machine it hands your opponent your map.

So memory is per faction again (`FactionMemory`, holding `explored` and
`seenCities`), and still stored **only for seats a human holds**. An AI faction
does not use fog at all, so an entry for one would be paid for on every turn of
every game and read by nothing.

⚠️ **A joiner starts blind.** They inherit the empire, not the scouting. There
is no memory to hand over even in principle, because the machine that held the
chair was never using fog; synthesising one from its omniscience would gift a
joiner the whole map, which is both a cheat and the exact inverse of what the
fog is for. Leaving a seat drops the memory for the same reason in reverse:
kept, it would let somebody look, leave, and hand the next occupant their
scouting, and it would carry several thousand hex keys in every save for a
person no longer in the game.

### Choosing a seat is a decision, so the screen has to make it one

`standings` scores every empire and, crucially, reports a **share of the board**
and a one-word band. Raw counts do not answer the question being asked: four
towns is a strong empire in one game and a finished one in another, and a joiner
is choosing *between* seats. So every offer is measured against the leader, and
the leader itself is not compared to itself, because "34% of the board, against
34% for you" is arithmetically true and reads as a bug.

Army strength is counted as health times strength, not as a headcount. Six units
at a tenth each is not an army, and somebody who picked that seat off a unit
count would sit down into a rout with no warning.

⚠️ Bands are cut against an **even** share rather than against the leader.
Against the leader, a game with one runaway winner would label every other
empire "struggling", which is true of none of them except by comparison and
tells a joiner nothing about which chair to pick.

⚠️ **The player is "struggling" on turn one, and that is correct.** The player
opens with an Architect and no town while every antagonist opens holding a
village, so until that Architect founds something the player genuinely holds
nothing. It is written down because it looks precisely like a scoring bug, and
the instinct on seeing it is to weight the formula until it goes away.

### What was already there, and was nearly duplicated

The game **already had** a two-player mode: co-op, two people sharing one
empire, each answering from their own course. Its rule is that both answers are
**averaged**, deliberately, because taking the better of the two "would be
kinder and would make them a spectator with a keyboard".

That is the opposite of the rule a duel wants, and both are right for their own
situation: co-op is two people playing one empire, a duel is two empires and one
question. `resolveDuel` gives the modifier to the better answer and **zeroes the
loser rather than penalising them**, so being outclassed costs you the advantage
instead of handing your opponent a second one. Only one side is ever paid, which
keeps the swing the same size as the single-player fight it replaces.

⚠️ The new panel was very nearly called "Seats", which is what the setup screen
already calls the number of PEOPLE playing. Two things sharing a word one screen
apart is how somebody ends up hunting for the co-op switch in the empire list.

### What is NOT built, and why

Remote play over a network is designed here and deliberately not implemented.

The live app is **static hosting only**: `data`, `storage` and `functions` are
all off in `rayfin.yml`, and there is no backend on the deployed URL at all. The
`api/coach` route only answers when somebody runs `serve:capacity` locally,
which is why `probeEdition` exists and why an absent coach is treated as a
feature being *absent* rather than *broken* (D37, D38).

Turning on the Rayfin data service provisions a database. That is a
hard-to-reverse infrastructure change, and it is not one to make on the way past
while shipping a game feature. The shape it would take, when it is made:

- **Transport**: the Rayfin data service (managed MSSQL behind Data API
  Builder), polled. There is no realtime push, and the game is turn-based, so
  one to two seconds is genuinely enough.
- **Payload**: the save file. It already exists, is versioned, is compact, and
  regenerates the map from a seed rather than shipping two thousand tiles.
- **Authority**: client-authoritative. The engine is a pure function of state
  and intent, so whoever's turn it is runs it and publishes the result. A
  server-authoritative version means running the engine server-side, which is a
  much bigger build to defend against people you invited to play with you.
- **The duel is the hard part**, not the state sync. Both players must receive
  the *same* question and answer it without seeing each other's, which is a
  rendezvous over a store that only supports polling.

Two further things are needed for several humans in ONE game, on a network or on
one machine, and neither is done: **research is still a single shared
`ResearchState`** (39 sites), and the turn does not rotate between human seats.
Research being one person's progress is arguably correct for a study game, where
it is what *you* have learned rather than what your empire owns, and that is
exactly why switching seats carries it with you today. Two simultaneous humans
would need it split.

So what ships is the seat model, the join flow, and the duel rule: one person at
a time, able to leave the empire they are playing and take any empire the
machine is holding.

| # | Decision | Why |
| --- | --- | --- |
| D693 | `Faction.isPlayer` becomes `control: 'human' \| 'ai'` | Every rule reading it was already asking a question that has the same answer for a second human |
| D694 | A faction IS the seat; there is no parallel seat table | A fact maintained in two places drifts, and the first disagreement is a seat with no empire |
| D695 | ⚠️ **Map memory is stored per faction again** | Two humans sharing one fog hands each of them the other's scouting, silently |
| D696 | Only human-held seats get a memory | The machine does not use fog, so an entry per antagonist is paid every turn and read by nothing |
| D697 | ⚠️ **A joiner starts blind** | There is no memory to inherit; synthesising one from the machine's omniscience gifts them the map |
| D698 | Leaving a seat drops its memory | Otherwise the next occupant inherits your scouting, and every save carries a departed player's hex keys |
| D699 | A vacated empire goes back to the machine, not into a freeze | A frozen seat is neither a rival nor a ruin, and everybody else waits on somebody who closed a tab |
| D700 | Hostility is decided by control, not by faction id | Once a person can take over an antagonist, "is this the player" is no longer answerable by name |
| D701 | Standings report a share of the board, not raw counts | Four towns is strong in one game and finished in another; a joiner is choosing between seats |
| D702 | Army strength counts health, not headcount | Six units at a tenth each is a rout, and a unit count would not say so |
| D703 | Bands are cut against an even share | Against the leader, one runaway winner makes everybody else "struggling" |
| D704 | ⚠️ **The turn-one player really is struggling** | An Architect and no town is genuinely nothing; the number is right and looks like a bug |
| D705 | The leader's row carries no comparison | "34% against 34% for you" is true and reads as broken |
| D706 | A duel pays the better answer and zeroes the loser | Being outclassed should cost the advantage, not hand over a second one |
| D707 | Only one side is ever paid | Paying both would double the quiz's influence over a fight |
| D708 | A near-tie is a draw | Decided by a hundredth of a second, a duel reads as arbitrary rather than as knowing it better |
| D709 | ⚠️ **A duel is NOT the co-op rule** | Co-op averages so neither player is a spectator; a duel is two empires and one question |
| D710 | The panel is called Empires, not Seats | The setup screen already uses Seats for how many PEOPLE are playing |
| D711 | Save version 11, and the old memory follows the old `isPlayer` flag | A campaign may rename its factions, and a hard-coded id would blank the fog of anyone not called `player` |
| D712 | Legacy save fixtures strip the new fields instead of relabelling the version | 10 -> 11 rewrites factions, so a current save wearing an old number sails past the migration and reports it working the day it breaks |
| D713 | `activeFactionId` moves with the seat in the APP, not in `takeSeat` | That coupling is only correct while one person is at the table; rotation is the multi-human answer |
| D714 | Networked play is documented, not built | It provisions a database, and the simultaneous-question rendezvous is a build of its own |

## 99. DRAFT: the three exams a Solution Engineer actually has to pass

⚠️ **This section is a PLAN, not a record. Nothing in it has been built.**
Every other section describes something that shipped; this one describes work
that has not started, so it carries no decision numbers. They get allocated when
it is executed, not before, because a decision log that contains intentions
stops being usable as a record of what was decided.

### Why these three, and the awkward fact underneath

These are the three certifications that matter for the author's role: two that
are required of a data-focused solution engineer, and one cross-discipline AI
exam that turns up on several neighbouring role tracks.

⚠️ **The specific requirement matrix is deliberately not written down here.**
Which exams an employer requires of which internal role is that employer's
information, this repository is headed for public, and `verify_publishable.py`
cannot catch it: its own closing note says it "cannot know that a sentence
should not be said out loud". The exam names, titles and outlines below are all
published on Microsoft Learn and are quoted freely; the internal pick list is
not, and is not needed to justify the work.

⚠️ **The shipped campaign teaches an exam that is not among them.** The game
ships DP-600, and DP-600 is not one of the three. So the tool currently revises
a certification that is not required, while the ones that are have no campaign
at all. That is the real argument for this work, and it is worth stating plainly
because "add more exams" sounds like scope creep until you notice that the one
already there is the optional one.

DP-600 stays. It is a good campaign, the outline is still published, and Fabric
analytics knowledge is the day job regardless of what any pick list says.

### What was verified, and when

All three exist and are current. Checked against the published study guides
rather than from memory, because two of the three were unknown to me and an
invented outline is precisely the failure this tool exists to avoid:

| Exam | Title | Skills measured as of |
| --- | --- | --- |
| DP-700 | Implementing Data Engineering Solutions Using Microsoft Fabric | 21 July 2026 |
| DP-800 | Developing AI-Enabled Database Solutions (SQL AI Developer Associate) | 12 March 2026 |
| AI-103 | Developing AI Apps and Agents on Azure | 16 April 2026 |

⚠️ DP-203 is retired and DP-700 is its replacement. Anything written against
DP-203 is dead content.

### What a campaign costs

`Campaign` in `learn/src/campaign.ts` needs four things, and D35 still holds:
**no engine change at all**. The outline is transcribed verbatim from the
published skills-measured list, because the tech tree exists so that studying
the tree is studying the outline; paraphrasing it quietly makes it a different
syllabus.

1. `content/<exam>/outline.json`: branches, clusters, skills, with the published
   weightings.
2. One antagonist per cluster, each named for the **misconception** its cluster
   teaches you to stop making. The Silo Horde is not a generic monster; somebody
   who beats it should be able to say what a silo is.
3. `content/<exam>/questions/src/<cluster>.json`, then the built bank.
4. An exam shape: length, pass mark, Proctor threshold, seconds per question.

### ⚠️ Two problems that have to be solved BEFORE any of this is worth starting

**The cluster count breaks the faction balance.** DP-600 has seven clusters and
therefore seven factions, and seven is a tuned number: the comment on the
starting roster says seven factions of three units would be twenty-one raiders
converging on a starting pair, which is why each gets two. The new outlines are
bigger:

| Exam | Branches | Clusters, and therefore factions |
| --- | --- | --- |
| DP-600 (shipped) | 3 | 7 |
| DP-700 | 3 | 10 |
| DP-800 | 3 | 11 |
| AI-103 | 5 | 14 |

Fourteen factions is double the tuned pressure and twice the camps on one
landmass. `chooseAntagonistCamps` will not fail, because it relaxes spacing
rather than running out, so the failure mode is not an error: it is a crowded
map and an unwinnable opening, discovered by playing. Three ways out, and this
needs deciding before the content is written because it changes what the outline
files have to contain:

- **Group clusters into fewer factions.** One faction per branch, or per pair of
  clusters. Cheapest, and it costs the property that beating a faction means
  taking one nameable branch of knowledge.
- **Let a faction hold several clusters.** An engine change: `topicCluster`
  becomes a list. Keeps one faction per idea, breaks the "quizzes on its own
  cluster" simplicity.
- **Scale the starting roster to the faction count.** Keeps the mapping, and
  needs the opening rebalanced and actually played.

**The question bank cannot be generated into the shipped content.** This is the
rule in `learn/src/generate.ts` and it is the right one:

> A confidently wrong question is worse than no question, because somebody
> revises the wrong fact and carries it into the exam room.

Generated courses are deliberately kept out of the shipped bank. DP-600 ships
123 hand-authored questions across seven clusters. Three more exams at that
density is roughly 450 questions, on subjects where a plausible wrong answer is
easy to write and expensive to believe. So the bank is the long pole, not the
outline, and **a campaign with an outline and no bank is the honest intermediate
state**: `role: 'questions'` campaigns are already exempt from the world
requirements, and a `world` campaign with a thin bank is worse than no campaign
because it looks finished.

### Proposed sequencing

1. **DP-700 first.** Closest sibling to DP-600, same product, same vocabulary,
   and it is the mandatory one. It is also the best test of whether the campaign
   seam really is subject-agnostic, because if anything is still DP-600-shaped
   it will show up here first.
2. **DP-800 second.** Furthest from the existing content (T-SQL, security,
   CI/CD, embeddings), so it is the honest test of the seam.
3. **AI-103 last**, and only after the faction-count question is settled, since
   it is the one with fourteen clusters.

Each one: outline transcribed and checked against the published guide, factions
named, then the bank built cluster by cluster through the existing review and
import path rather than written straight into `content/`.

### Open questions, to answer before starting

| Question | Why it blocks |
| --- | --- |
| One faction per cluster, per branch, or a scaled roster? | Decides the shape of every outline file, so it cannot be retrofitted cheaply |
| Does a campaign ship with an empty bank, or not ship until it has one? | Decides whether these are `world` or `questions` campaigns |
| Who authors and checks the answers? | The tool's whole value is that a question is right; generated content cannot go in the shipped bank |
| Does DP-420 get a campaign too? | It is the published alternative to DP-800 for the same slot, so it is the other half of a real choice |
| Is a fundamentals-level AI campaign worth it? | Cheap to add and the least useful to somebody already sitting the associate exams |

## 100. A code that lifts the fog, and puts it back

Section 96 added codes for reaching parts of the game that take turns to get to.
`lineage` was one of them: it marks every tile explored, which lifts the black
and deliberately stops there. You still have to walk past a town before you know
it is there, so the memory stays an honest record of what was actually seen.

`adminportal` is the other half. It shows the ground **and** the things standing
on it, live, including the seven camps the opening works hard not to give away.

### Why it is a view flag and not a saved state

Every other world code writes state. This one does not, and the difference is
the whole design:

- `lineage` writes to the seat's memory. Permanent, saved, and **true**
  afterwards: the player really does know that ground now.
- `adminportal` flips a flag in `main.ts`. Nothing in the rules moves, which is
  what lets it be turned off again and put the player back exactly where they
  were, rather than leaving them holding a map they never scouted.

⚠️ **The reversibility applies to the picture, never to the record.** The use
still lands in `cheatsUsed`, still travels in the save, and still shows on the
victory screen. The one thing this game must never do is tell somebody they are
ready when they are not, and a code that could be used and then hidden by
switching it off would do precisely that.

### Two traps, both found by writing it

⚠️ **The fog signature is an early return.** `refreshFog` skips its work when the
signature is unchanged, which is the optimisation that stops it merging six
thousand hex patches every frame. A toggle that flipped the flag without
clearing the signature would find nothing to do and redraw nothing, which on
screen is indistinguishable from the code being broken.

⚠️ **It must not share the opening's flag.** `revealingForOpening` lifts LESS
than this: it lights the land and still hides every army on it, because an
establishing shot showing all seven camps would give away the scouting game
before turn one. One flag for both would spoil the intro.

The scene is told there is no fog by being handed `undefined` rather than the
full tile set. Both look identical and one of them costs a six-thousand-entry
lookup per unit, per town and per overlay, every frame.

### Verified on the deployed build, because fog cannot be proved by a return value

Fog is the one feature whose entire content is that something is **not** drawn,
so there is nothing to assert on. Counting what the renderer actually drew:

| | Visible meshes |
| --- | --- |
| Fog on | 69 |
| `adminportal` | 720 |
| `adminportal` again | 69 |

Exactly back to 69, and `explored` stayed at 61 of 6,211 throughout, which is
the state being genuinely untouched rather than merely claimed to be.

| # | Decision | Why |
| --- | --- | --- |
| D715 | `adminportal` lifts ground and armies; `lineage` still lifts only ground | Two different things, and the honest one should stay available |
| D716 | ⚠️ **A view flag, not state** | It can be turned off without leaving the player holding a map they never scouted |
| D717 | The use is recorded even though the effect is reversible | The record has to be permanent or the victory screen can lie |
| D718 | ⚠️ **The toggle clears the fog signature** | `refreshFog` returns early otherwise, and nothing on screen moves |
| D719 | Kept separate from `revealingForOpening` | The opening lifts less on purpose; sharing a flag would show all seven camps in the intro |
| D720 | The scene is handed `undefined`, not every hex | Identical on screen, and one of them is a per-entity lookup every frame |

## 101. Founding a city asks three questions

Founding was the one important decision the game asked nothing about. Section 93
gave it advice, so a player could see which site was good, and then the act
itself was a button press. It is also the decision a player makes fewest times
and lives with longest, which makes it the best moment in a turn to ask somebody
to retrieve something.

So an Architect now answers three before the town goes up, and a good showing
founds a bigger one: two extra citizens for getting all three right, one for a
decent run.

### ⚠️ Bonus only, and this is the argument

Every other challenge in the game swings both ways. `settlingBonus` deliberately
does not, and never returns less than zero. Two reasons, both of which come back
to what the tool is for.

**Founding is how a game starts and how a losing player climbs back.** A rule
that made a wrong answer worse than never being asked would punish exactly the
person who most needs to be revising, and the reliable way to dodge that
punishment would be to stop founding cities, which is to say to stop playing.

**The size of a capital is permanent.** A combat modifier is spent on one blow.
A city founded small stays small for thirty turns. Compounding a bad answer that
far forward is not a difficulty setting, it is a grudge.

The tension lives in what is forgone instead: answer badly and you simply do not
get the head start. That is a real cost without being a trap.

### The two failures are different

⚠️ **Walking out cancels the founding; getting it wrong does not.** Closing the
modal is a decision not to do this now, and the Architect is still standing
there afterwards. Answering badly is a decision to build anyway, and it costs
the head start rather than the town.

⚠️ **The site is checked BEFORE anything is asked, and again after.** Asking
three questions and then reporting "too close to another city" would waste the
only thing this feature actually spends, which is attention. It is re-checked
afterwards because three questions is long enough for the world to move: the
modal blocks the map, but a raid resolving underneath it could have taken the
ground or killed the Architect.

### What it asks about

Topics that have fallen **due** come first, then current research, then the
graph. Asking about whatever is being researched right now would be easier to
write and would test the thing already freshest in mind, which is the one thing
spaced repetition says not to do.

⚠️ Population rather than a stored growth surplus, because population is the
number on screen. A hidden head start toward the next citizen is the same
arithmetic and looks identical to no reward at all, which is the failure mode
for anything handed out for answering.

⚠️ The rank is **not** promoted to match. Rank needs retained knowledge as well
as citizens, and granting it here would give away on turn three what the rest of
the game asks a player to earn.

⚠️ `SETTLE_QUESTIONS` and `settlingBonus` live in `actions.ts` rather than in
`settle.ts`, where they read like they belong, because `settle.ts` already
imports `cityKindFor` from `actions.ts` and importing back would close the
cycle.

### Verified on the deployed build

Three questions asked, on **three distinct topics**
(`dp600-q-1-1`, `-2-1`, `-3-1`), all answered correctly, and the city panel then
read **"Siedlung, Einw. 3"**: founded at three citizens instead of one, still
rank Siedlung. The log said, in German, that the judgement held, the weather
turned fair, and the town was already growing.

| # | Decision | Why |
| --- | --- | --- |
| D721 | Founding asks three questions, not one | It is the decision made fewest times and lived with longest; one question is a toll, three is a moment |
| D722 | ⚠️ **The bonus never goes below zero** | Punishing a wrong answer here would punish the player who most needs to revise, and the way to dodge it would be to stop playing |
| D723 | Abandoning cancels the founding; a wrong answer does not | They are different decisions, and only one of them means "not now" |
| D724 | The site is validated before the questions, and again after | Otherwise three questions are spent to be told the ground was never legal, and the world can move while the modal is up |
| D725 | Due topics are asked first | Asking about current research tests what is already freshest in mind |
| D726 | The reward is population, not a hidden growth surplus | The same arithmetic, but one of them is visible and the other looks like no reward |
| D727 | ⚠️ **Citizens do not buy rank** | Rank needs retained knowledge; granting it would give away what the rest of the game asks a player to earn |
| D728 | A non-finite score is treated as no answer | NaN sails through the comparisons and founds a city of size NaN, which is not a crash and is worse |
| D729 | `settle` joins the challenge kinds, with its own modal label | The fall-through would have labelled a founding "Battle", and the raw identifier trap is already recorded |

## 102. Questions you choose, and a difficulty that finally does something

Every question in the game was compulsory. A raid arrives and you are asked; a
chest is dug and you are asked; a topic falls due and you are asked. All good
reasons to be asked, and every one of them happens **to** the player. Nothing in
the game was a question somebody chose to attempt.

So the map now makes offers, and they can be refused.

### Two kinds, and the pair matters more than either half

- **gold**: a seam, a cache, a windfall. Answer and take it.
- **mire**: a unit is bogged down. Answer and it walks out today.

⚠️ **Answering can only ever help, and that is the rule the module exists to
enforce.** Declining and getting it wrong land in exactly the same place. There
is no arrangement of answers that leaves a player worse off than never having
been offered anything, which is what makes it safe to say yes to a question you
are unsure about, which is the entire behaviour a revision tool wants.

The cost of attempting is the player's attention, and that is the only cost. A
player in a hurry declines and loses nothing but the upside; a player who wants
the practice says yes. **That choice is the feature.**

⚠️ A mire is jeopardy that is not an attack. Losing one turn of movement costs
no health, threatens no town and cannot compound, which makes it the mildest
adversity the game has and therefore the only kind safe to hand to somebody who
is already losing. If it ever grew teeth it would be an attack, and attacks are
what this was built to stand beside.

⚠️ **A refusal and a wrong answer are different arguments, not the same one.**
`applyFortune` takes `number | undefined` rather than encoding a refusal as a
score of -1. They reach the same outcome today, and a caller forced to spell a
refusal as a bad answer is one refactor away from making refusals cost
something.

### Why the chest keeps its teeth and a fortune does not

`treasure.ts` halves the haul on a wrong answer, and that stays. The two are not
inconsistent, because a chest sits on the map and can be attempted repeatedly:
without a cost, clicking through it is a strategy. A fortune is gone either way,
so there is nothing to protect against guessing and no reason to charge for it.

### Difficulty was inert, and now is not

⚠️ **`Difficulty` was chosen at setup, stored on the state, carried through
every save, and read by no rule at all.** Three named settings that played
identically is worse than having none, because the menu makes a promise the game
does not keep. `garrisonCapFor` is the first rule to look at it.

⚠️ **The knob is the garrison cap, NOT the number of factions.** Dropping a
faction is the obvious way to face fewer enemies and it would quietly remove a
seventh of the exam: each faction quizzes on its own cluster, so an easier game
would also be one that never tests you on two of the branches you are revising
for. Fewer raiders per faction keeps all seven fronts, and therefore all seven
clusters, while making the pressure survivable.

Starting strength is two, so `analyst` allows one reinforcement per faction
rather than two: seven fewer raiders across a full board.

That change broke a wall test, and the break was correct. `aiWalls` staged an
army at `MAX_GARRISON_PER_FACTION` and expected a faction to raise a replacement
after losing one. On the new default that staging is already **over** the cap, so
the faction walled up instead. The test now names `architect` explicitly, which
keeps its subject the cap mechanism rather than the setting.

### Verified on the deployed build

Offers appeared on turns 3 and 11, roughly the intended cadence. Declining one
logged "Was da unten lag, bleibt da unten" and cost nothing. Accepting another
("Nach 21 Daten graben") and answering it took the purse from **0 to 21 Daten**,
logged as "21 Daten aus dem Dreck".

| # | Decision | Why |
| --- | --- | --- |
| D730 | The map makes offers the player may refuse | Every question in the game happened TO the player; none was chosen |
| D731 | ⚠️ **Answering can only help** | A player unsure of an answer must be safe to attempt it, or the tool teaches walking away |
| D732 | Declining and missing land in the same place | Any gap between them turns attempting into a gamble |
| D733 | A refusal is `undefined`, not a score of -1 | Encoding it as a bad answer is one refactor from charging for it |
| D734 | A mire costs movement only | The mildest adversity in the game, and the only kind safe to give a losing player |
| D735 | The chest keeps its halving; a fortune has none | A chest can be attempted repeatedly, so guessing needs a price; a fortune is gone either way |
| D736 | One threshold, not a sliding payout | Scaling the haul by the score makes a half-remembered answer pay, which teaches guessing |
| D737 | Offers are seeded from the turn | Two players on a seed get the same luck and a replay asks the same things (D39) |
| D738 | ⚠️ **Difficulty finally changes a rule** | It was stored and saved and read by nothing, which is a menu making a promise the game does not keep |
| D739 | ⚠️ **Difficulty thins raiders, never factions** | One faction fewer is one exam cluster fewer, so an easier game would test less of the syllabus |
| D740 | `aiWalls` names its difficulty | The cap it is testing is no longer a constant, and a silent pass would test something else |

## 103. The music was not too loud, it was alone

The report was "background more silent, front end louder, like attack". The
first half was easy and the second half turned out to be the real finding:

⚠️ **There was no front end.** The game had exactly three cue: `first-city`,
`first-blood` and `city-falls`, each fired at most once per game by a
cinematic. Moving, fighting, breaching a wall and founding a town were all
completely silent. So a player heard a continuous orchestral bed and nothing
else, and a bed with nothing on top of it is a bed you notice.

Turning the music down alone would have made the game quiet rather than
balanced. Both halves were needed:

| | Before | After |
| --- | --- | --- |
| Score | 0.28 | 0.15 |
| Cue bus | 0.50 | 0.80 |
| Sounds while playing | none | five |

### Stings are not cinematic cues

⚠️ **They live in their own table, and the separation is what keeps two tests
honest.** `CUES` is keyed by cinematic id and two tests hold that mapping
exactly: every film must have a cue, and every cue must have a film. A combat
sound in that table is an orphan by definition, and the obvious fix of relaxing
the orphan test would throw away the thing that catches a renamed cinematic
playing in silence. `play` looks in both, so no caller has to know which kind of
sound it is asking for.

⚠️ **A sting is SHORT, and that is a rule rather than a preference.** A
cinematic cue has the screen to itself for four seconds. A sting fires in the
middle of a turn, sometimes twice in a row, and anything with a long tail turns
a busy turn into mud. Nothing rings past a second, and the test enforces it.

Five sounds: `clash` for a blow landing, `volley` for a shot, `breach` for
masonry giving way, `settle` for a town founded, `windfall` for something worth
having dug out of the ground.

⚠️ Fired on **impact**, not when the attack was ordered, so the sound lands with
the animation rather than a second before it. A raid sounds exactly like your
own attack, because a blow that changed depending on who threw it would read as
two events rather than one seen from the other side.

⚠️ The founding sting is suppressed when the `first-city` film is about to play.
`playOnce` fires a cinematic at most once per game, so without that guard the
first founding would play both at once and every later one would be the silent
one, which is precisely backwards.

### A number written down twice, found the usual way

Lowering the score broke a **ducking** test, which had nothing to do with
ducking. It asserted `volume > 0.2` as a proxy for "the fade-in finished", and
0.2 was the module's own volume copied into a second file. `MUSIC_VOLUME` is
exported now and both tests read it, so the next change to the mix cannot break
a test about something else.

### Verified on the deployed build

Sound cannot be checked by looking, so the `AudioContext` was instrumented and
the voices counted: **zero gain nodes before the fighting started, 27 during
it**. The stings really do fire on blows that used to be silent.

⚠️ Whether the resulting balance is *right* is a question for ears, not for a
test. The numbers are a starting point and are meant to be moved.

| # | Decision | Why |
| --- | --- | --- |
| D741 | The mix moved in both directions at once | The score alone would leave the game quiet; the bus alone would make the films shout |
| D742 | ⚠️ **The game gained a foreground at all** | Three once-per-game cues over a continuous bed is why the music sounded too loud |
| D743 | Stings live in their own table, not in `CUES` | A gameplay sound there is an orphan, and relaxing that test loses a real guard |
| D744 | A sting rings for at most a second | It fires mid-turn and repeatedly, unlike a film cue that owns the screen |
| D745 | Sounds fire on impact | Otherwise the noise arrives before the blow it belongs to |
| D746 | A raid sounds like your own attack | One event seen from two sides, not two events |
| D747 | The founding sting yields to the founding film | `playOnce` runs once a game, so the guard is what makes every LATER founding audible |
| D748 | `MUSIC_VOLUME` is exported | It was written down twice, and lowering it broke a ducking test for no reason |

## 104. Blending the music, and finding out why there was so little of it

The report was that the joins between the teaser, the settings screen and the
game were abrupt. Three boundaries, three different faults, and then a fourth
thing that turned out to matter more than any of them.

### The three joins

**The teaser stopped dead.** It carries its own cue, and `finish()` called
`video.pause()` on the spot, so skipping it cut the music mid-bar straight into
the silence of the settings screen. It fades now. ⚠️ Only the **sound** is held
for the length of the fade: the picture goes immediately, because a frozen frame
lingering behind the settings would look like the app had hung.

**The anthem punched in.** `start()` set the volume and called `play()`, so its
first sample was its loudest, arriving out of silence. It rises over
`ANTHEM_FADE_IN_MS` now, on the same interval that runs the fade out, so the two
can never disagree about how a ramp is done. ⚠️ A fade of zero is still honoured,
because the intro's card timing is measured against the anthem's clock and a
measurement should not have to wait out a musical nicety.

**The handover left a hole.** `anthem.fade()` takes 1,600 ms and the score was
started at a flat 2,400 ms: the fade plus 800 ms of dead air, written as one
number with no visible relationship to the fade it was waiting for. It is
`ANTHEM_FADE_OUT_MS + HANDOVER_BREATH_MS` now, and the breath is 250 ms.

⚠️ **A short gap, deliberately, rather than a true crossfade.** Overlapping the
two would be the smoother edit if they were one piece of music, and they are
not: the anthem and the score are different recordings in different keys, and
this module's own ducking note is about precisely that, that two pieces at once
argue. Both ends are ramps; only the join is empty.

### ⚠️ And the real finding: four of the seven tracks are not there

Probing the deployed build for every file the soundtrack asks for:

| Asked for | On the host |
| --- | --- |
| `terra-nostra.mp3` | missing |
| `aurora.mp3` | missing |
| `ferrum.mp3` | missing |
| `vigiles.mp3` | missing |
| `turris.mp3` | present |
| `semina.mp3` | present |
| `corona.mp3` | present |
| `anthem.mp3` | present |

And on disk, unreferenced by anything: `aqua-alta.mp3`, plus `ferrum-et-ignis.mp3`
where the list asks for `ferrum.mp3`.

So the score has been rotating over **three tracks, not seven**, which means far
more repetition and far more of the seven-second gap between them. That is a
much better explanation for "the music does not flow" than any of the fades
above, and it was invisible from inside the game.

⚠️ **The thing that hid it is a feature working exactly as designed.** The probe
treats a file that is not there as *absent rather than broken*, deliberately, so
that a checkout without the audio still plays. The cost of that kindness is that
a renamed file is indistinguishable from a deliberate omission, and nothing
anywhere says "you asked for seven and got three".

⚠️ **Not fixed here, because fixing it means guessing.** `ferrum` to
`ferrum-et-ignis` is an obvious rename; `aqua-alta` standing in for one of
`terra-nostra`, `aurora` or `vigiles` is not something the code can know, and
inventing a title and a mood for somebody else's music is worse than leaving the
list honest. The audio folder is gitignored, so this is a content question.

| # | Decision | Why |
| --- | --- | --- |
| D749 | The anthem rises instead of starting at full level | Its first sample being its loudest reads as a speaker switching on, not as music |
| D750 | One interval runs both ramps | Two would race on the same volume and the loser would keep pushing it back |
| D751 | A zero fade is still honoured | The intro's timing is measured against the anthem's clock |
| D752 | The anthem leaves slower than it arrives | Music that goes faster than it came sounds interrupted rather than finished |
| D753 | The handover is expressed as the fade plus a breath | A flat 2,400 had no visible relationship to the 1,600 it was waiting for |
| D754 | ⚠️ **A short gap, not a crossfade** | Two recordings in different keys overlapping is the thing the ducking rule exists to prevent |
| D755 | The teaser fades its sound but drops its picture at once | A held frame behind the settings looks like a hang; a cut cue sounds like a fault |
| D756 | ⚠️ **The missing tracks are reported, not guessed at** | A rename is obvious; inventing a title and mood for somebody else's music is not |

## 105. Mobile, checked again after a week of new buttons

The mobile layout from section 88 still holds: on a phone held upright the map
keeps the top 56% and every panel drops into one scrolling column beneath it.
Measured again at 390x844 and 360x640, both clean, no horizontal scroll.

Three faults had crept in, and the largest of them was there from the start.

### ⚠️ A phone turned sideways got the desktop HUD

The mobile block was gated on `max-width: 760px`. That is the condition for a
phone held **upright**, and it is false for the same phone held sideways: a
390x844 handset becomes 844x390, sails past the test, and gets eight panels
pinned to the corners of a 390px-tall window.

Worse, the landscape rule below it set the map to 62vh on exactly those screens.
So the board shrank to make room for a column that was never switched on. **The
two rules disagreed about which layout was running, and the one that shrank the
map won.**

The condition is `max-width: 760px, (max-height: 520px) and (orientation:
landscape)` now. The comma is an OR, and the 520 deliberately matches the
landscape rule so there is no band where the column is on and the height
override is off. Measured at 844x390 and 740x360: both now get the column, both
clean.

### ⚠️ Tap targets had a height but no width

`#hud button { min-height: 44px }` had been there since the layout was written,
so every icon button was the right height and the wrong shape. Measured at
390px: the music toggle was **28px** wide and the two unit-stepper arrows were
**24px**, against a 44px thumb. The steppers are the worst of them, because
cycling the army is something a player does on nearly every turn, and a target a
third narrower than the finger aiming at it is missed often enough to read as
the game ignoring the tap.

The course panel was worse and for a different reason: it is not inside `#hud`,
so the rule never reached it at all, and the two buttons that download and
upload a question template were 32px.

### ⚠️ Width is the wrong question for a tap target

A tablet in portrait is 768 to 834px wide, so it takes the desktop HUD, and that
is right: there is room for it and a column would waste the screen. What was not
right is that it also took the desktop's 34px buttons, and the hand holding a
tablet has the same thumb as the one holding a phone.

`pointer: coarse` asks the only question that actually matters, and it leaves a
small laptop window alone, which no width rule could.

⚠️ **Honest limit, and how it was closed halfway.** The browser used to measure
everything here reports `pointer: fine`, so that rule cannot fire in the
harness. Rewriting its condition to `all` in the live page proves what the
declarations DO when the query matches: **21 undersized controls became 0**, with
no overflow. The effect is measured; only the trigger is reasoned.

### And one button that had walked off the edge

The top bar is a fixed row that grows with its contents, and it gained the
Empires button this week. Above 760px it did not wrap, so on a 768px tablet the
fullscreen toggle ended at **x=797 against a 768px viewport**: clipped and
unreachable. `flex-wrap` now applies at every width. It costs nothing on a wide
screen, where it never triggers.

### Measured after

| Viewport | Undersized | Overflowing | Layout |
| --- | --- | --- | --- |
| 390x844 | 0 | 0 | column |
| 360x640 | 0 | 0 | column |
| 844x390 | 0 | 0 | column |
| 740x360 | 0 | 0 | column |
| 768x1024 | 0 with coarse forced | 0 | desktop |
| 1320x800 | n/a, mouse | 0 | desktop |

| # | Decision | Why |
| --- | --- | --- |
| D757 | ⚠️ **The column triggers on a short landscape screen as well as a narrow one** | A phone turned sideways is 844px wide and was getting the desktop HUD |
| D758 | The OR shares the landscape rule's 520px | Otherwise a band exists where the map shrinks for a column that is off |
| D759 | Tap targets get a minimum WIDTH, not just a height | Only the height was set, so icon buttons were 24 to 28px wide against a 44px thumb |
| D760 | The course panel is named explicitly | It sits outside `#hud`, so the HUD rule never reached its two buttons |
| D761 | ⚠️ **Touch sizing keys off `pointer: coarse`, not width** | A tablet has room for the desktop layout and a thumb that needs 44px; width cannot express that |
| D762 | The top bar wraps at every width | It grows with its contents, and the newest button had left the screen on a tablet |

## 106. Telling a unit where to be, and letting it walk there

`findPath` has claimed since it was written that it existed "for multi-turn
orders: the unit walks it a few tiles per turn". Nothing used it that way. Its
only caller was the AI, which recomputed a route every turn because it had
nowhere to keep one, and the player did not even have that: sending a Profiler
across the map meant clicking the furthest lit hex, ending the turn, finding the
unit and clicking again, for six turns. The Profiler is the unit whose entire
job is to be somewhere else.

Clicking a hex out of range is now an **order** rather than an error. The unit
sets out, walks a turn's worth each turn, and stops when it arrives.

### The drawing and the walking have to agree

The dotted line is the route and the numbers are where the unit stands at the
end of each turn. That is a promise, and the way to break it is quietly:

⚠️ **`marchLegs` borrows `stepCost` and the same "minimum move" rule
`reachable` uses**, where a unit with any movement left can always take one more
step however expensive the ground. A second cost model in the preview would
leave everything working and the unit simply arriving on a different turn than
the map said, which nobody would notice for months.

This is pinned by a test that walks the plan out turn by turn and asserts the
arrival lands on the promised leg. ⚠️ **It failed the first time and the code was
right**: the test refreshed movement to a hand-picked `2` while the preview
budgets the unit's real allowance, so it reported six turns against a promise of
four. The test was simulating a slower game than the one it was checking, which
is the same class of mistake it exists to catch, made in the test.

⚠️ **A leg can be empty, and collapsing it would be a lie.** A unit that has
already spent its movement marches nowhere this turn, so its first leg is empty
and the first place it actually reaches is two turns away. No marker is drawn on
the tile it is already standing on, and the first arrival is numbered 2.

### Stopping for something new

⚠️ **The test is what is NEWLY in sight, not whether anything is.** Comparing
the set of hostile ids visible before and after each step is what separates
"there is a raider over that hill" from "there is a border I have been watching
for ten turns". The second reading would refuse to take a single step and look
like the order being ignored.

Cities count as well as units. Cresting a ridge and finding a walled town is
exactly what a march should stop for, and it is the more valuable discovery.

⚠️ **One hex at a time, through `moveUnit`.** Three things depend on it: the fog
opens along the route, the memory records towns passed en route, and the march
can be interrupted mid-turn. A single jump to the end of the leg would get the
first two right and the third wrong, and the third is the one this section is
about.

### Ordering and cancelling

⚠️ A hand-driven move **cancels** the standing order. The player has just said
where they want the unit, and resuming a march to somewhere else next turn would
be the game overruling them.

⚠️ Marches advance **after** the enemy phase and after the fortune, not before.
A unit bogged down by a mire should stay bogged: `advanceMarch` reads
`movesLeft`, so ordering it last is what makes the two agree instead of the
march quietly undoing the mire.

⚠️ `advanceMarches` walks units in **id order**. Units block each other, so which
one goes first decides who gets the pass, and map iteration order is not
something to leave a rule depending on when a seed is meant to replay (D39).

### What the live look found

The route draws only for the selected unit: measured on the deployed build,
**4,153 lit pixels on the overlay canvas with the ordering unit selected and 0
with any other**.

⚠️ And a collision that only a screenshot could have shown: **the Architect gets
two numbered overlays.** The settle advice numbers its five best sites and the
march numbers its turns, in the same visual language, piling up around the unit
where neither can be read. The march wins while an order stands, because it is
an order the player gave and the sites are advice. They return when it is
cancelled or fulfilled.

⚠️ The overlay is the one thing in `effects` that does not fade itself, so
`active()` had to learn about it. The frame loop clears that canvas every frame
and only redraws when something is animating, which is correct for a damage
number and wrong for a piece of interface: the route would have been painted on
the frame it was ordered and erased on the next one.

| # | Decision | Why |
| --- | --- | --- |
| D763 | An out-of-range click is an order, not an error | It already meant "go there"; the game just made the player repeat it every turn |
| D764 | ⚠️ **The preview borrows the movement rules rather than restating them** | A second cost model leaves the unit arriving on a different turn than the map promised |
| D765 | An empty first leg is kept | A unit that has already moved reaches its first tile on turn two, and saying "1" would be wrong |
| D766 | ⚠️ **Only a NEWLY seen enemy stops the march** | Otherwise a scout on a known border refuses to move at all |
| D767 | Towns interrupt as well as units | Finding a walled town is the more valuable discovery of the two |
| D768 | The march steps one hex at a time through `moveUnit` | Fog, town memory and mid-turn interruption all depend on it |
| D769 | A manual move cancels the order | Resuming next turn would be the game overruling the player |
| D770 | Marches advance after the enemy phase and the fortune | So a mire that took the unit's movement is not quietly undone |
| D771 | Units march in id order | They block each other, so the order decides who gets the pass |
| D772 | The route is drawn for the selected unit only | Every unit's route at once is spaghetti over a map already carrying fog and threats |
| D773 | ⚠️ **Settle advice yields to a march** | Both write numbers on hexes and the Architect gets both, so together neither is readable |
| D774 | `effects.active()` counts a shown march | The canvas is cleared every frame, so the route would flicker off immediately |
| D775 | The order is a bare target, not a cached path | A stored route goes stale the moment anything else moves |
| D776 | No save migration | The field is optional, so an older save loads a unit with nothing to do, which is what it means |

---

*Last updated: 27 August 2026*
