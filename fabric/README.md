# Fabric analytics: semantic model and report

What the game records about itself, turned into a Power BI report.

| Item | Id |
| --- | --- |
| Workspace | `5249380b-543f-4e2b-ab7a-39d5ae7633e8` (Rayfin Apps) |
| SQL database | `3fd28292-2ef2-4ead-b040-535db90bc889` |
| Semantic model | `2a16e8d0-3301-4e0b-8c8e-7a382a3567fc` |
| Report | `badef49c-97c9-47ec-b825-65b04ba22671` |

[Open the report](https://app.powerbi.com/groups/5249380b-543f-4e2b-ab7a-39d5ae7633e8/reports/badef49c-97c9-47ec-b825-65b04ba22671)

## Why Direct Lake, and why it works at all

A Fabric SQL database mirrors its tables into OneLake as delta automatically, so
the model reads `Tables/dbo/<name>` directly. No refresh schedule, no stored
credentials, and the report is never staler than the mirror.

Two things that are easy to get wrong here:

- The layout is schema-enabled, so every partition **must** carry
  `schemaName: dbo`. Omit it and the partition points at `Tables/<name>`, which
  does not exist, and every table silently fails to frame.
- A newly created Direct Lake model holds table metadata but no loaded database.
  Until it is refreshed once, DAX reports `Cannot find table 'Attempt'`, which
  looks exactly like a broken TMDL and is not.

## The tables

`Game` and `Attempt` are the app's own tables. `Skill` is the DP-600 outline,
created by `create_skills_dimension.py` as a real SQL table so that it mirrors
too and the join stays pure Direct Lake. A DAX calculated table would have been
an import table, and relating an import dimension to a Direct Lake fact is the
one join that drops the model out of Direct Lake.

⚠️ `dbo.Skills` is **not** declared in `rayfin/data/schema.ts`. It is reporting
reference data that the game never reads or writes. If a future `rayfin up` ever
removes it, re-run the script.

## Sample data

`seed_sample_stats.py` writes ~48 games and ~1,400 attempts, every row carrying
`userId` prefixed `sample:`. Remove them with:

```sql
DELETE FROM dbo.QuestionAttempts WHERE userId LIKE 'sample:%';
DELETE FROM dbo.GameResults      WHERE userId LIKE 'sample:%';
```

The report's `Data Notice` measure says how many seeded games are present and
disappears by itself once they are gone, so no caption has to be remembered.

## Rebuilding

```powershell
python tools/fabric/build_semantic_model.py   # TMDL  -> fabric/Fabric Empires.SemanticModel
python tools/fabric/deploy_semantic_model.py
python tools/fabric/refresh_semantic_model.py # frame Direct Lake
python tools/fabric/validate_semantic_model.py

python tools/fabric/build_report.py           # PBIR  -> fabric/Fabric Empires.Report
python tools/fabric/deploy_report.py
```

Both deploy scripts are idempotent: they update the existing item by display
name rather than creating a duplicate.

## Notes

- Measures live on a disconnected calculated `Measure` table, in import mode.
  That is the one calculated table a Direct Lake model tolerates comfortably,
  because it needs no relationship.
- `Skill Coverage` uses `ALLNOBLANKROW`, not `ALL`. `ALL` counts the blank row
  the engine materialises on the one side of a relationship, which reported full
  coverage of 41 skills as 97.6%.
- The IBCS custom visuals are deliberately not used. The measures that carry
  this report are percentages, and that visual renders a percentage measure as
  `1` because it rounds and ignores the model format string.
