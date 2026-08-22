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
| D08 | Combat | Civ-style HP combat. Strength plus HP, with the question applying a large plus/minus modifier to the attack roll |
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
- ⚠️ `rayfin/.deployments.json` carries a `publishableKey`. **Gitignore it.**
- `NOTICE.md` records AI art provenance (model, date, that prompts are committed) and audio provenance.
- Grep the README and every PR body before publishing for German characters, customer names, and disclosure phrasing.

### 12.1 Intellectual property: the genre, the trademarks, and the art prompts

Not legal advice. This records the reasoning so it can be re-examined.

**Game mechanics are not copyrightable.** 17 U.S.C. 102(b) excludes procedures, processes, systems and methods of operation. *Baker v. Selden* (1879) is the root; *Allen v. Academic Games League of America* (9th Cir. 1994) applied it to games directly. Hex grids, tech trees, four resources, settlers and workers, fog of war, strength-versus-HP combat, era progression and victory conditions are genre vocabulary. *Freeciv* has been GPL since 1996 and *Unciv* is an open-source reimplementation of a commercial 4X's rules, both long-lived and unchallenged. Mathematical damage formulas are functional and not protectable.

**Visual expression is protectable, and that is where the real risk sits.** *Tetris Holding v. Xio Interactive* (D.N.J. 2012): copying the rules was permitted, copying the look was not.

⚠️ The original art style suffix named a specific commercial game. Those prompts are committed publicly, so 250 files would have documented an intent to reproduce another product's art direction, generated by a model that has certainly seen it. **Corrected (D21):** the style vocabulary is now self-contained and names no product.

**Rules that apply to this repo:**
- No competitor or product names anywhere in the tree, including art prompts, code comments and commit messages. `tools/verify_publishable.py` carries a trademark class matching `Civilization|Civ ?[IVX0-9]|Sid Meier|Firaxis|Take-Two|2K Games|Age of Empires|Ensemble Studios`. It **warns** rather than fails (D47).
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

*Last updated: 22 August 2026*
