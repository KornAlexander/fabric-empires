#!/usr/bin/env python3
"""Refuse to publish anything that should not leave this machine.

PLAN section 12 has described this file since the first week, and D376 recorded
that it did not exist: the plan claimed a control that was never built, which is
worse than a known absence because it reassures on a point nobody is checking.
This is that control.

Two ideas shape it, both taken from the plan and from the way its absence was
discovered.

**Shape, not memory.** Section 12 asks for "shape-matching regex classes, not a
list of identifiers I happened to notice". A GUID has a shape. A Key Vault host
has a shape. A list of the particular secrets someone remembered leaking does
not, and D377 is what that costs: the trademark list in 12.1 was written from
memory, a scan seeded with it found only the name that list already contained,
and it missed two titles that were named twenty-three times between them.

**Only what git tracks.** The published artefact is the sole thing that can
carry risk. Scanning the working tree reports findings in ignored files that no
reader could ever see, which trains the reader to skim.

Exit codes: 0 clean or warnings only, 1 something must not be published.
"""

from __future__ import annotations

import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# ⚠️ Printed output stays ASCII, and stdout is forced to UTF-8 anyway.
#
# The first end-to-end run of this file crashed with UnicodeEncodeError the
# moment its output was piped: a Windows console hands Python a cp1252 stdout,
# and the warning line ended in an emoji. A publishability gate that dies when
# somebody pipes it is worse than no gate, because it fails inside `npm run
# verify` for a reason that has nothing to do with what it checks. Emoji belong
# in the comments here, never in a print.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SKIP_SUFFIXES = {'.png', '.jpg', '.jpeg', '.mp3', '.mp4', '.webm', '.woff', '.woff2', '.ico'}

# Files a stranger forms an impression from. D382 scopes the third-party naming
# rule to these rather than to the whole tree, because that is the only surface
# on which confusion about origin is possible. The design log is a bibliography
# and is deliberately not listed.
MARKETING_SURFACE = {
    'README.md',
    'NOTICE.md',
    'package.json',
    'app/index.html',
}


@dataclass(frozen=True)
class Rule:
    name: str
    pattern: re.Pattern[str]
    why: str
    fatal: bool = True
    # Paths this rule does not apply to, each with the text it would have hit.
    allow: tuple[tuple[str, str], ...] = field(default=())


# ⚠️ Every pattern here describes a SHAPE. If you find yourself adding a literal
# string you saw once, you are writing D377 again.
RULES: tuple[Rule, ...] = (
    Rule(
        'guid',
        re.compile(r'\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b'),
        'A bare GUID is a workspace, item, capacity or tenant coordinate.',
    ),
    Rule(
        'fabric-sql-endpoint',
        re.compile(r'\b[\w-]+\.(datawarehouse|datamart)\.fabric\.microsoft\.com\b', re.I),
        'A Fabric SQL endpoint names a real tenant.',
    ),
    Rule(
        'pbi-dedicated',
        re.compile(r'\b[\w-]+\.pbidedicated\.windows\.net\b', re.I),
        'A dedicated capacity host names a real capacity.',
    ),
    Rule(
        'azure-openai-host',
        re.compile(r'\b[\w-]+\.openai\.azure\.com\b', re.I),
        'An Azure OpenAI host names a real resource. Read it from env.',
    ),
    Rule(
        'key-vault-host',
        re.compile(r'\b[\w-]+\.vault\.azure\.net\b', re.I),
        'A Key Vault host names a real vault.',
    ),
    Rule(
        'fabric-app-host',
        re.compile(r'\b[\w-]+\.webapp\.fabricapps\.net\b', re.I),
        'A Fabric App host is tenant-owned and should not be committed.',
    ),
    Rule(
        'local-user-path',
        re.compile(r'[A-Za-z]:[\\/]{1,2}Users[\\/]{1,2}[A-Za-z0-9._-]+'),
        'A local profile path leaks a username and a machine layout.',
    ),
    Rule(
        'corporate-upn',
        re.compile(r'\b[\w.+-]+@(?:microsoft\.com|[\w-]+\.onmicrosoft\.com)\b', re.I),
        'A UPN identifies a person in a real tenant.',
    ),
    Rule(
        'bearer-or-key',
        re.compile(
            r'\b(?:sk-[A-Za-z0-9]{20,}'
            r'|gh[pousr]_[A-Za-z0-9]{20,}'
            r'|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.)'
        ),
        'That is the shape of an API key or a signed token.',
    ),
    Rule(
        'inline-credential',
        re.compile(
            r'(?:AccountKey|SharedAccessSignature|client_secret|ClientSecret)\s*[=:]\s*["\']?[A-Za-z0-9+/=_-]{12,}',
            re.I,
        ),
        'A credential assigned inline. Read it from env with no default.',
    ),
    # ⚠️ WARNS, never fails (D47). A third-party name on the marketing surface is
    # a judgement call, not a leak, and a check that blocks a commit over one
    # will simply be disabled.
    Rule(
        'third-party-name',
        re.compile(
            r'\b(?:Civilization|Sid\s?Meier|Firaxis|Take-Two|2K\s?Games|Age\s+of\s+Empires'
            r'|Ensemble\s+Studios|Stronghold|Firefly\s+Studios|Anno\s*\d{0,4}|Max\s+Design'
            r'|Total\s+War|Crusader\s+Kings|Europa\s+Universalis|Endless\s+Legend|Humankind'
            r'|Master\s+of\s+Orion|Alpha\s+Centauri|Northgard|Frostpunk|Tropico|Caesar\s+III)\b',
            re.I,
        ),
        'A third-party product name on the marketing surface invites the comparison. '
        'The design log may name its influences; this surface may not.',
        fatal=False,
    ),
)


def tracked_files() -> list[str]:
    """
    Everything that is in the repository, or about to be.

    ⚠️ **`--others` matters as much as the tracked list, and its absence let a
    real leak through.** `git ls-files` alone names only files git already
    knows, so a BRAND NEW file is invisible to this checker until the commit
    that adds it has been made: you run the gate, it passes on 214 files, you
    commit, and only the *next* run scans the file you just published. That is
    exactly one commit too late, which for a gate whose whole job is to run
    before publication means it did not run at all.

    It happened: `tools/treasure-clips.py` was written, verified clean, and
    committed with a hard-coded Azure resource host and a `C:\\Users\\<name>`
    path in it. The gate caught it on the following run, from the git history,
    where removing it is no longer enough.

    `--exclude-standard` keeps .gitignore honoured, so build output and the
    ignored media are still skipped. Untracked-and-ignored is genuinely not
    published; untracked-and-stage-able is about to be.
    """
    out = subprocess.run(
        ['git', 'ls-files', '--cached', '--others', '--exclude-standard'],
        cwd=REPO,
        capture_output=True,
        text=True,
        check=True,
    )
    return out.stdout.split('\n')


# ⚠️ A checker that passes on its first run has proved nothing. This one did,
# and that is indistinguishable from a checker whose patterns never match
# anything at all. Every rule therefore carries a sample it MUST catch, and the
# classes that have already produced false positives carry samples they must
# NOT catch: D377 was caused by a class matching `Civi` inside `Civilian`.
MUST_CATCH: tuple[tuple[str, str], ...] = (
    ('guid', 'workspaceId: "550e8400-e29b-41d4-a716-446655440000"'),
    ('fabric-sql-endpoint', 'server=abc123xyz.datawarehouse.fabric.microsoft.com;'),
    ('pbi-dedicated', 'https://example-capacity.pbidedicated.windows.net/'),
    ('azure-openai-host', 'const host = "example-resource.openai.azure.com";'),
    ('key-vault-host', 'https://example-kv.vault.azure.net/secrets/x'),
    ('fabric-app-host', 'https://example-app.webapp.fabricapps.net/'),
    ('local-user-path', r'const p = "C:\Users\someone\repos\thing";'),
    ('corporate-upn', 'owner: someone@microsoft.com'),
    ('bearer-or-key', 'token = "ghp_' + 'A' * 36 + '"'),
    ('inline-credential', 'client_secret=abcdefghijklmnopqrst'),
    ('third-party-name', 'plays a lot like Civilization does'),
)

MUST_IGNORE: tuple[tuple[str, str], ...] = (
    # The exact false positives that produced D377 and the first bad scan.
    ('third-party-name', 'if (isCivilian(unit.typeId)) return fail("Civilians cannot attack");'),
    ('third-party-name', 'const amplitude = 0.5; // fbm2 octave gain'),
    ('third-party-name', 'would move a unit in the old world and then have'),
    ('guid', 'const UNSEEN = "#2b3642"; // fog colour'),
    ('guid', 'version 1.2.3-alpha-4 released'),
    ('local-user-path', 'see app/src/three/fog.ts for the layers'),
    ('corporate-upn', 'contact the maintainer through the repository'),
)


def self_test() -> int:
    by_name = {r.name: r for r in RULES}
    bad = 0

    for name, sample in MUST_CATCH:
        rule = by_name[name]
        if not rule.pattern.search(sample):
            print(f'FAIL  [{name}] did not catch: {sample}')
            bad += 1

    for name, sample in MUST_IGNORE:
        rule = by_name[name]
        m = rule.pattern.search(sample)
        if m:
            print(f'FAIL  [{name}] false positive on {m.group(0)!r} in: {sample}')
            bad += 1

    covered = {n for n, _ in MUST_CATCH}
    for rule in RULES:
        if rule.name not in covered:
            print(f'FAIL  [{rule.name}] has no sample it must catch')
            bad += 1

    total = len(MUST_CATCH) + len(MUST_IGNORE) + len(RULES)
    if bad:
        print(f'\nself-test: {bad} of {total} checks failed')
        return 1
    print(f'self-test: {len(MUST_CATCH)} caught, {len(MUST_IGNORE)} correctly ignored, '
          f'{len(RULES)} rules covered')
    return 0


def applies(rule: Rule, rel: str) -> bool:
    if rule.name == 'third-party-name':
        return rel in MARKETING_SURFACE
    # The checker states every shape it looks for, so it matches itself.
    return rel != 'tools/verify_publishable.py'


def allowed(rule: Rule, rel: str, text: str) -> bool:
    return any(path == rel and quoted in text for path, quoted in rule.allow)


def main() -> int:
    failures: list[str] = []
    warnings: list[str] = []
    scanned = 0

    # The scan is only worth reading if the rules demonstrably work.
    if self_test() != 0:
        return 1

    for rel in tracked_files():
        rel = rel.strip()
        if not rel:
            continue
        path = REPO / rel
        if not path.exists() or path.suffix.lower() in SKIP_SUFFIXES:
            continue
        try:
            content = path.read_text(encoding='utf-8')
        except (UnicodeDecodeError, OSError):
            continue
        scanned += 1

        for n, line in enumerate(content.splitlines(), 1):
            for rule in RULES:
                if not applies(rule, rel):
                    continue
                for m in rule.pattern.finditer(line):
                    if allowed(rule, rel, m.group(0)):
                        continue
                    report = (
                        f'  {rel}:{n}\n'
                        f'      [{rule.name}] {m.group(0)[:90]}\n'
                        f'      {rule.why}'
                    )
                    (failures if rule.fatal else warnings).append(report)

    print(f'verify_publishable: {scanned} tracked text files scanned')

    if warnings:
        print(f'\n{len(warnings)} warning(s):\n')
        print('\n'.join(warnings))

    if failures:
        print(f'\n{len(failures)} finding(s) that must not be published:\n')
        print('\n'.join(failures))
        print(
            '\nFix, or add an allowlist entry to the rule that quotes the exact\n'
            'offending text, so the exception is readable rather than a path.'
        )
        return 1

    print('\nNo publishable-surface findings.')
    print(
        'NOTE: this proves the absence of these SHAPES, nothing more. It cannot\n'
        '      know that a name is a product, that a number is a secret, or that\n'
        '      a sentence should not be said out loud.'
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
