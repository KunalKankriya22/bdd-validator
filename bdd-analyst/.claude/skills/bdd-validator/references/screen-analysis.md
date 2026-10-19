---
name: screen-analysis
description: Produce comprehensive analysis document for a legacy Oracle Forms screen by cross-referencing FMB, Figma, DB schema, and user guides.
menu-code: screen-analysis
---

**Language:** Use {communication_language} for all output.

# Screen Analysis

Produce a comprehensive analysis document for a legacy Oracle Forms screen, cross-referencing all available sources against the modern Figma redesign.

## Inputs

The user provides a screen mnemonic (e.g., `cpisep`). If the input doesn't match an exact mnemonic, use `uv run scripts/list-screens.py {project-root} --search "{input}"` to find candidates and confirm with the user.

Gather all sources:

1. **Parallel script execution — batch these independent calls:**
   - Run `uv run scripts/resolve-screen.py {project-root} {mnemonic}` to get the manifest of all related files
   - Run `uv run scripts/extract-fmb-deps.py {project-root}/screens/{mnemonic}/{mnemonic}_fmb.xml` to get Oracle packages, procedures, triggers, LOV queries, inherited blocks, and navigation calls

2. **After manifest completes:** Run `uv run scripts/lookup-tables.py {project-root} {table1} {table2} ...` with the table names from the manifest to get full column definitions, types, lengths, nullability, constraints, and indexes.

3. **Read all source files:** Read the FMB analysis MD, existing screen analysis MD (if any), legacy screenshot, all Figma screenshots, and the obsidian vault screen entry.

## Data Availability Check

Before starting analysis, check the manifest from resolve-screen.py and report availability:

| Missing Data | Impact | Behavior |
|---|---|---|
| FMB XML | Cannot map legacy fields | HALT — ask user to locate FMB or confirm screen is new (no legacy equivalent) |
| Figma screenshots | Cannot analyze modern UI | PROCEED — generate "Legacy Analysis Only" document, note "Figma mockup not available — Gap Analysis deferred" |
| Table DDLs (partial) | Cannot validate subset of fields | PROCEED — flag missing tables in Schema Validation with severity WARNING |
| Vault entry | Cannot identify module/submodule | PROCEED — use FMB metadata for screen title, note "Module metadata unavailable" |
| Screen folder missing | No working folder exists | PROCEED — create folder, pull FMB from oracle-app if available |

Tell the user upfront:
> **Data availability:** FMB {status}, Figma {status}, DB tables {found}/{total} found{, missing: list}
> {Any warnings about proceeding with partial data.}

**Composite Readiness:** If fewer than 2 of the 3 primary sources (FMB XML, Figma screenshots, DB tables) are available, warn the user before proceeding:
> **Low data coverage:** Only {count}/3 primary sources available. The analysis will have significant gaps. Proceed anyway, or gather more data first?

## Error Handling

- If `resolve-screen.py` returns exit code 1 (no data found): inform the user that the mnemonic is not recognized, suggest running `uv run scripts/list-screens.py {project-root} --search "{mnemonic}"` to find similar screens.
- If `extract-fmb-deps.py` fails (exit code 2): note that FMB XML parsing failed, proceed with FMB analysis MD as primary legacy source if available.
- If `lookup-tables.py` reports tables in `not_found`: list the missing tables in the Executive Summary and flag affected field mappings as "DB schema unavailable — verify manually."

## Output Document

Generate `{agent.screens_base_path}/{mnemonic}/{agent.screen_analysis_filename}` with these sections:

### 1. Executive Summary
- Screen name, module, sub-module, title
- Key stats: UI field count, DB tables referenced, discrepancies found, gaps found
- One-paragraph description of what this screen does in the business process

### 2. UI Field-to-Database Mapping

A table mapping every visible field in the Figma mockup to its database backing:

| # | UI Field (Figma) | FMB Item | DB Table | DB Column | DB Type | Length | Nullable | Constraints | Notes |
|---|---|---|---|---|---|---|---|---|---|

For each mapping:
- Trace the Figma field label → FMB block.item → database table.column
- Include the actual DB data type and length from devdb-docs
- Flag where Figma field expectations don't match DB constraints (e.g., text field showing 50 chars but DB column is VARCHAR2(10))
- Mark control-only fields (no DB backing) explicitly

### 3. Schema Validation

For every mapped DB column, validate:
- **Type compatibility:** Does the Figma input type match the DB column type? (e.g., date picker for DATE columns, number input for NUMBER columns)
- **Length constraints:** Does the Figma field allow more input than the DB column can store?
- **Nullability:** Are required fields in Figma actually NOT NULL in the DB (and vice versa)?
- **LOV/Dropdown values:** Do dropdown options in Figma match the validation table contents?

Present findings as a discrepancy table with severity:

| Severity | When to Use | Example |
|---|---|---|
| **Critical** | Will cause data loss, runtime errors, or DB constraint violations | Figma allows 200 chars but DB column is VARCHAR2(50); Figma shows optional but DB is NOT NULL |
| **Warning** | May cause user confusion or business logic errors but won't break technically | Dropdown in Figma shows 8 options but validation table has 12; field label mismatch |
| **Info** | Cosmetic or low-impact, possibly intentional design choice | Legacy shows all-caps but Figma uses sentence case; column order differs |

### 4. Discrepancies

Conflicts found across the three sources (Figma, FMB legacy, DB schema):

| # | Field/Area | Figma Says | Legacy (FMB) Says | DB Says | Severity | Recommendation |
|---|---|---|---|---|---|---|

Flag anything where sources disagree — different field labels, different validation rules, different data types, missing fields.

### 5. Figma vs Legacy Gap Analysis

Two sub-sections:

**Present in Legacy, Missing from Figma:**
- Fields, buttons, menu items, or functionality that exist in the FMB form but have no corresponding element in the Figma mockup
- For each gap, note whether it seems intentional (simplification) or an oversight

**Present in Figma, Not in Legacy:**
- New fields or UI elements in Figma that don't exist in the legacy form
- Flag whether these require new DB columns or API endpoints

### 6. User Workflows

Document every path an **end user** can take through this screen, written from the operator's perspective — what they see, what they click, what feedback they get. Do NOT reference code, triggers, blocks, or PL/SQL. Derive workflows from two sources:

- **Legacy behavior:** Read the FMB analysis for the functional flow, then translate triggers and blocks into user-visible actions (e.g., "WHEN-VALIDATE-ITEM on UNIT_ID checks UNITS table" becomes "User enters Unit ID and presses Enter — system validates the unit exists and shows collection date")
- **User guides:** Search the PDF user guides via `uv run scripts/search-knowledge.py {project-root} "{screen title}"` for procedural documentation. The WellSky User Guide often contains step-by-step instructions for each screen that describe the business process, not the code.

**Primary Flow:** The main happy-path workflow from the user's perspective, step by step. Describe what the user sees on screen, what they enter/select, and what feedback the system provides.

**Alternate Flows:** Every branch a user might take:
- Searching for existing records vs. creating new ones
- Selecting different options that change what fields appear or are required
- Using toolbar actions (save, delete, query, print, etc.)
- Navigating to related screens and returning
- Using barcode scanner vs. manual keyboard entry (where applicable)

**Error Scenarios:** What the user experiences when:
- They enter invalid data (what message do they see? where does the cursor go?)
- Required information is missing
- A record already exists
- The operation cannot be completed (e.g., no bags available, unit not found)

Describe errors from the user's perspective: "System displays an error message indicating the unit was not found for this chapter" — not "show_error('0063') fires."

**Conditional Behavior:** Fields or sections that appear/disappear or become editable/read-only based on user actions or data state.

**Business Context:** Where does this screen fit in the larger workflow? What does the user do before coming here? What do they do after? Reference related screens by name, not mnemonic.

### 7. External Dependencies

- **Oracle Packages:** Package.procedure calls with brief description of what they do
- **Database Triggers:** Triggers on referenced tables (from devdb-docs) that fire on insert/update/delete
- **LOV Queries:** Record group queries used for dropdowns
- **Called Screens:** Other forms this screen navigates to (and what parameters are passed)
- **Calling Screens:** Forms that open this screen
- **Shared Libraries:** Inherited blocks and property classes from parent modules (e.g., sbclib.fmb)

### 8. Timezone Considerations

Flag any date/time fields or operations that use `lifetrack_timezone_convert` or similar timezone-aware functions. Note which fields need timezone handling in the modern implementation.

## Headless Mode

If `{headless_mode}=true`:
- Skip mnemonic confirmation — use the provided mnemonic literally
- Auto-proceed through Data Availability Check — proceed unless FMB XML is missing AND no FMB analysis MD exists, then halt with `status: "blocked"`
- Skip the soft gate ("Anything else about this screen?")
- Skip the What's Next suggestions
- On completion, output:

```json
{
  "status": "complete",
  "capability": "screen-analysis",
  "mnemonic": "{mnemonic}",
  "output_file": "{path-to-analysis-md}",
  "summary": {
    "ui_fields_mapped": 0,
    "db_tables_referenced": 0,
    "discrepancies": { "critical": 0, "warning": 0, "info": 0 },
    "gaps": { "legacy_missing_from_figma": 0, "figma_missing_from_legacy": 0 }
  },
  "data_availability": { "fmb": true, "figma": true, "db_tables_found": 0, "db_tables_total": 0 },
  "assumptions": [],
  "open_questions": []
}
```

If halted due to missing FMB:

```json
{
  "status": "blocked",
  "capability": "screen-analysis",
  "mnemonic": "{mnemonic}",
  "reason": "No FMB XML or FMB analysis MD found for this screen",
  "assumptions": [],
  "open_questions": ["Locate FMB file or confirm this is a new screen with no legacy equivalent"]
}
```

## Progression

- **Hard gate:** Data Availability Check must complete and user must acknowledge any missing data before analysis begins.
- **Soft gate before finalizing:** "Anything else about this screen I should know before I finalize the analysis?"

## What's Next

After writing the analysis document, suggest:
> Analysis complete: `{output-path}`
>
> **Next steps:**
> - **Generate BDD scenarios** for this screen — say "generate BDD for {mnemonic}"
> - **Analyze a related screen** — I can find screens in the same module
> - **Ask questions** about anything in this analysis

## What Success Looks Like

- Every visible Figma field has a mapping row — none are silently skipped
- Every DB column type and length is verified against devdb-docs, not assumed
- Discrepancies have clear severity and actionable recommendations
- Workflows cover edge cases, not just the happy path
- The document is self-contained — a developer can implement the modern screen from this document alone
