# Eleanor — Modernization Analyst Agent

A Claude Code skill that provides a seasoned modernization analyst bridging legacy Oracle Forms applications to modern .NET 8 / Angular stacks. Eleanor cross-references FMB code, Figma mockups, database schemas, and user guides to surface gaps, mismatches, and hidden dependencies during migration.

## Capabilities

- **Screen Analysis** — Comprehensive analysis of legacy Oracle Forms screens cross-referenced against Figma mockups, DB schemas, and user guides
- **Knowledge Q&A** — Answer technical questions by searching and synthesizing the knowledge base
- **BDD Generation** — Generate Gherkin BDD feature files for modern Angular from legacy context
- **Batch Analysis** — Analyze multiple screens in one session with prioritized summary reports

## Installation

1. Extract the zip into your project's `.claude/skills/` directory:

   ```bash
   unzip agent-eleanor.zip -d /path/to/your-project/.claude/skills/
   ```

2. Verify the structure:

   ```
   your-project/
   └── .claude/
       └── skills/
           └── agent-eleanor/
               ├── SKILL.md
               ├── customize.toml
               ├── references/
               └── scripts/
   ```

3. The skill self-registers with Claude Code automatically — no manual registration needed.

## Prerequisites

### Python

- Python 3.10 or higher
- [uv](https://docs.astral.sh/uv/) installed (lightweight Python script runner)
- All scripts use Python stdlib only — no pip dependencies required

### Knowledge Base

Eleanor's scripts read directly from a `knowledge/` directory at your project root. The expected layout:

```
your-project/
└── knowledge/
    ├── .sage-index/
    │   └── vault.index.json         # Pre-built vault index (screen definitions)
    ├── obsidian-vault/
    │   └── *.md                     # Screen definition files (906 screens)
    ├── devdb-docs/
    │   └── schemas/
    │       └── {schema-name}/
    │           └── Tables/*.md      # Table DDL definitions (1,096+ tables)
    ├── oracle-app/
    │   ├── *.fmb / *_fmb.xml       # Oracle Forms binaries/XML
    │   └── SQL scripts, packages
    └── *.pdf                        # WellSky User Guides
```

### Bash Permissions

Add these to your `.claude/settings.local.json` (or approve when prompted):

```json
{
  "permissions": {
    "allow": [
      "Bash(python3 *)",
      "Bash(uv run *)"
    ]
  }
}
```

## Usage

In Claude Code, activate Eleanor by saying:

- "Talk to Eleanor"
- "Ask the modernization analyst about..."
- "Analyze screen DONR01"
- "Generate BDD for screen DONR01"

### Screen Working Folders

Eleanor reads from and writes to per-screen working folders:

```
your-project/
└── screens/
    └── {MNEMONIC}/
        ├── {MNEMONIC}_fmb.xml              # FMB XML for the screen
        ├── {MNEMONIC}-fmb-analysis.md       # FMB dependency analysis
        ├── {MNEMONIC}-screen-analysis.md    # Full screen analysis output
        ├── legacy.png                       # Legacy screenshot
        └── *.png / *.jpg                    # Figma mockup screenshots
```

## Customization

Edit `customize.toml` to override default paths:

| Setting | Default | Purpose |
|---------|---------|---------|
| `knowledge_base_path` | `{project-root}/knowledge` | Where the knowledge base lives |
| `screens_base_path` | `{project-root}/screens` | Where screen working folders are |
| `screen_analysis_filename` | `{mnemonic}-screen-analysis.md` | Output filename for analyses |
| `bdd_feature_filename` | `{mnemonic}.feature` | Output filename for BDD features |
| `batch_summary_filename` | `_batch-summary.md` | Batch analysis summary filename |

For team-wide overrides, create `{project-root}/_bmad/custom/agent-eleanor.toml`.
For personal overrides, create `{project-root}/_bmad/custom/agent-eleanor.user.toml`.

## Scripts

All scripts output JSON to stdout and accept `{project-root}` as the first argument:

| Script | Purpose |
|--------|---------|
| `resolve-screen.py` | Resolve all files related to a screen mnemonic |
| `extract-fmb-deps.py` | Parse FMB XML for packages, triggers, LOVs, table refs |
| `list-screens.py` | List/search/filter screens from vault index |
| `lookup-tables.py` | Look up database table definitions from devdb-docs |
| `search-knowledge.py` | Full-text search across the knowledge base |

### Running Tests

```bash
cd .claude/skills/agent-eleanor/scripts
uv run pytest tests/
```

## Contents

```
agent-eleanor/
├── README.md                  # This file
├── SKILL.md                   # Skill definition (identity, capabilities, modes)
├── customize.toml             # Configurable paths and settings
├── references/
│   ├── screen-analysis.md     # Screen analysis capability guide
│   ├── knowledge-qa.md        # Knowledge Q&A capability guide
│   ├── bdd-generation.md      # BDD/Gherkin generation guide
│   └── batch-analysis.md      # Batch multi-screen analysis guide
└── scripts/
    ├── resolve-screen.py
    ├── extract-fmb-deps.py
    ├── list-screens.py
    ├── lookup-tables.py
    ├── search-knowledge.py
    └── tests/
        ├── __init__.py
        ├── conftest.py
        ├── helpers.py
        ├── test_resolve_screen.py
        ├── test_extract_fmb_deps.py
        ├── test_list_screens.py
        ├── test_lookup_tables.py
        └── test_search_knowledge.py
```
