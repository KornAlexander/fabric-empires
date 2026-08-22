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
| 3b | 23 Aug | **Fog of war** (D149). Per-faction visibility and memory, revealed by unit and city sight | |
| 3c | 23 to 26 Aug | **Units at 1600** (D148). Pike, shot, horse and cannon, replacing the tracked hulls | |
| 4 | 24 to 28 Aug | **The siege** (19). Walls, siege state, the assault set piece, the four defender options | Fog of war, for what a besieger can see |
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

*Last updated: 22 August 2026*
