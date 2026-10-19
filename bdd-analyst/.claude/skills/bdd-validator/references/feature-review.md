---
name: bdd-validator
description: BDD Validator — Review and correct an existing Gherkin feature file section-by-section using the Angular UI repo, FMB file, and live Oracle database — then produce a corrected feature file and comparison report.
menu-code: bdd-validator
---

# BDD Validator

Review an existing Gherkin BDD feature file against three sources of truth — the Angular UI source code, the legacy Oracle Forms FMB file, and the live Oracle database — and produce a corrected feature file with a comparison report.

---

## Fixed Paths (never ask the user for these)

| Resource | Path |
|---|---|
| **Angular UI repo** | `D:\Gap Analysis\BM.BloodCenters.UI` |
| **Feature files folder** | `D:\bdd-analyst\1-Ready For Review Nitor` |
| **FMB XML folder** | `D:\bdd-analyst\knowledge\oracle-app\BC_Releases\2026_R1\Lab_Dist\forms_xml\` |
| **FMB binary folder** | `D:\bdd-analyst\knowledge\oracle-app\BC_Releases\2026_R1\Lab_Dist\forms\` |
| **DB tools** | `D:\bdd-analyst\db-tools\` |
| **DB properties** | `D:\bdd-analyst\db-tools\db.properties` |

These are hardcoded — **never ask the user to provide them again**.

## Prerequisites

The only things the user needs to provide:

1. **MLT number** — e.g. `MLT-17603` — Eleanor will find the feature file automatically
2. **DB tunnel running** — SSH tunnel must be active on `localhost:15210` pointing to Oracle `QASDB`
   - If not running, ask the user to open a terminal and run:
     ```
     ssh -N -L 15210:localhost:1521 <user>@<host>
     ```
   - DB connection reads from `D:\bdd-analyst\db-tools\db.properties`

> **Feature file and FMB are both auto-detected** — do NOT ask the user to provide either. See sections below.

---

## Auto-Detect Feature File from MLT Number

When the user provides an MLT number (e.g. `MLT-17603`):

1. Search `D:\bdd-analyst\1-Ready For Review Nitor` for any `.feature` file whose name contains the MLT number (case-insensitive)
   ```
   glob pattern: *MLT-17603*.feature  or  *mlt-17603*.feature
   ```
2. If **one match** → use it, confirm: `"Found feature file: <filename>"`
3. If **multiple matches** → list them and ask the user to pick one
4. If **no match** → tell the user no `.feature` file was found in Downloads for that MLT number and ask them to check the filename

---

## Auto-Detect FMB from Feature File Metadata

Every WellSky feature file contains a header comment block with an `Executable Name` field, for example:

```
# Executable Name : CPICOMPD - Delete Component
```

**Steps to auto-detect the FMB:**

1. Read the first 15 lines of the feature file
2. Find the line containing `Executable Name`
3. Extract the program code — everything before the first ` - ` (space-dash-space) separator, trimmed and lowercased
   - Example: `CPICOMPD - Delete Component` → program code = `cpicompd`
4. Look for the FMB in this priority order:

   **Primary (XML — preferred, easier to parse):**
   ```
   D:\bdd-analyst\knowledge\oracle-app\BC_Releases\2026_R1\Lab_Dist\forms_xml\<code>_fmb.xml
   ```

   **Fallback (binary FMB):**
   ```
   D:\bdd-analyst\knowledge\oracle-app\BC_Releases\2026_R1\Lab_Dist\forms\<code>.fmb
   ```

5. If found → confirm to the user: `"Found FMB: <path>"` and proceed automatically
6. If NOT found → tell the user which path was checked and ask them to provide the FMB path manually

**Example auto-detection for `CPICOMPD`:**
```
Executable Name : CPICOMPD - Delete Component
→ code: cpicompd
→ XML : D:\bdd-analyst\knowledge\oracle-app\BC_Releases\2026_R1\Lab_Dist\forms_xml\cpicompd_fmb.xml  ✓ use this
→ FMB : D:\bdd-analyst\knowledge\oracle-app\BC_Releases\2026_R1\Lab_Dist\forms\cpicompd.fmb          (fallback)
```

**Parsing preference:** Always prefer the XML version (`forms_xml/`) over the binary FMB when both exist — XML is structured and faster to parse for triggers, blocks, and SQL fragments.

---

## Review Process

### Phase 0 — Live App Check via Playwright (Navigation Path + Breadcrumb)

> **HEADLESS ONLY.** Use Playwright MCP tools. Never launch a visible browser.
> **Always close the browser at the end of this phase** using `browser_close`.
> No human input needed — credentials are fixed above.

This phase runs **before** the section-by-section review and checks two things from the live app:

#### Step 0.1 — Login
1. Navigate to `https://bmbcsqaapprl01.wellsky.net/`
2. Fill Username → `NITOR1`
3. Fill Password → `nitor1`
4. Click the LOGIN button
5. Wait for the home page to load

#### Step 0.2 — Find the screen in the menu
- Extract the **screen name** from the feature file's Feature title or Background `And the "<Screen Name>" page is displayed` line
- Find the combobox with aria label `"Search navigation menu"` in the left sidenav
- Type the screen name into it
- Read the search result's full aria label — it gives the complete menu path:
  ```
  "Navigate to <Level 1>, <Level 2>, ..., <Screen Name>"
  ```
- Convert commas to `>` → e.g. `Lab > Testing Modules > Results Observations Query`
- **Compare with the Background step** `And the user has navigated to "<path>"` → record ✅ PASS or ❌ FAIL with correct path

#### Step 0.3 — Read the breadcrumb
- Click the search result to navigate to the screen
- Take a snapshot
- Read the breadcrumb element shown at the top of the page (e.g. `Home > Results Observations Query`)
- **Compare with any breadcrumb assertion** in the feature file → record ✅ PASS or ❌ FAIL with correct breadcrumb

#### Step 0.4 — Close the browser
- Call `browser_close` immediately after recording both results
- Never leave the browser open

#### Output of Phase 0
Report findings before starting Phase 1:
```
## Phase 0 — Live App Check
Navigation path : ✅ PASS  /  ❌ FAIL → correct path: "<actual path>"
Breadcrumb      : ✅ PASS  /  ❌ FAIL → correct breadcrumb: "<actual breadcrumb>"
```

---

### Phase 1 — Parse Sources

**Paths used (all hardcoded — never ask user):**
- Angular UI: `D:\Gap Analysis\BM.BloodCenters.UI`
- FMB XML: `D:\bdd-analyst\knowledge\oracle-app\BC_Releases\2026_R1\Lab_Dist\forms_xml\<code>_fmb.xml`
- DB runner: `java -cp "D:\bdd-analyst\db-tools;D:\bdd-analyst\db-tools\ojdbc11.jar" OracleQuery`

Run in parallel:

**A. FMB XML parsing (preferred) or binary extraction (fallback)**
For XML files, parse with Python's `xml.etree.ElementTree` or regex on the XML text:
- Extract `<Trigger Name="..." TriggerText="..."/>` for all trigger logic
- Extract `<Block Name="...">` and `<Item Name="...">` for screen structure
- Extract `show_error('NNNN')` calls from TriggerText for error code lookup
- Extract SQL fragments from TriggerText for DB operation understanding

For binary FMB fallback, extract readable strings:
```python
import re
with open(fmb_path, 'rb') as f:
    data = f.read()
strings = [s.decode('ascii', errors='replace') for s in re.findall(rb'[ -~]{6,}', data)]
```
Categorise into: blocks/items, triggers, SQL fragments, error codes (`show_error('NNNN')`), form actions (`go_block`, `go_item`, `clear_record`, `delete_record`, `call_form`).

**B. Angular UI analysis**
Base path: `D:\Gap Analysis\BM.BloodCenters.UI\src\`
Search for the Angular component folder matching the screen's function name — look under `app\features\` and `app\modules\laboratory-functions\`. Read:
- `component.html` — exact field labels, button labels, visible elements, `mat-label` text
- `component.ts` — signals, computed properties, validation logic, dialog triggers, success/error messages
- `service.ts` — API call signatures (what params are passed, what's returned)
- `error-codes.constants.ts` — exact frontend error code mapping
- Shared dialog components referenced (e.g., `delete-confirmation-with-notes-dialog`)

**C. DB query for error messages**
```sql
SELECT ERROR_CODE, ERROR_TYPE, ERROR
FROM SBCSYS.VALID_ERRORS_LAB
WHERE ERROR_CODE IN (<codes from FMB show_error calls>)
ORDER BY ERROR_CODE
```
Run via: `java -cp "D:\bdd-analyst\db-tools;D:\bdd-analyst\db-tools\ojdbc11.jar" OracleQuery`

**D. DB query for valid test data**
Pull real unit IDs, product codes, and relevant records for the screen's chapter/status filters to validate scenario examples.

Also query for **Validation Outline population**: when the feature file contains a `Scenario Outline` for field validation with weak or placeholder examples (only empty-field rows, or values like `ZZTEST-*`), replace them with real DB values covering:
- A valid value that exists in the DB and is accepted
- A value one character over the field's max length (to test truncation/rejection)
- A whitespace-only entry (if the field requires non-blank input)
- A special-character entry (if the field restricts to alphanumeric)

Use the Angular `component.ts` `Validators` and `maxLength` settings to determine the boundary, and the live DB to source real accepted values.

---

### Phase 2 — Count and List Sections

Read the feature file and identify all sections (marked with `# ====` comment blocks). Present to the user:
```
Found N sections, M total scenarios (X Scenario + Y Scenario Outline):
  1. Section Name          — N scenarios
  2. Section Name          — N scenarios
  ...
```
Ask: "Which section do you want to start with, or shall I go in order?"

---

### Phase 3 — Section-by-Section Review

For each section, cross-reference every scenario step against all three sources:

#### Per-scenario checks

| Check | Source | What to verify |
|---|---|---|
| Field names / labels | Angular HTML | Exact `mat-label` or `field-label` text — not FMB item names |
| Button labels | Angular HTML | Exact button text (e.g., DELETE vs SAVE, ACCEPT vs CONFIRM) |
| Error message text | `VALID_ERRORS_LAB` DB table | Exact `ERROR` column value — never paraphrase |
| Validation logic | Angular TS | `Validators.*`, `FormControl`, signal conditions |
| Dialog content | Shared dialog component | Title, message, button labels, `disableClose` setting |
| Character counter format | Dialog template | `length/max` (chars used) vs "remaining" — confirm format |
| Button existence | Angular HTML + TS | Confirm buttons actually rendered in template |
| Fields in component | Angular component model | Check `component.model.ts` for actual properties |
| API params | Service `.ts` | Confirm what params the API actually receives |
| DB test data | Live DB query | Validate that example values exist and have correct status |
| `see` vs `observe` in validation steps | Feature file text | Scan entire file — `Then User should see validation message` must be `Then User should observe "<Description>"` |
| **"on screen" suffix in Scenario titles** | Feature file text | Scan all `Scenario:` and `Scenario Outline:` title lines — remove trailing ` on [Screen Name] screen/grid/filter/modal/pagination` from the title itself (not just from steps) |
| **Scenario Outline parameter not referenced in steps** | Feature file text | Every `<column>` in an Examples table must appear as `<column>` in at least one step line. If the step says "with invalid Unit ID" but never uses `<unitId>`, add `"<unitId>"` to the step text |
| **Null/empty Examples rows** | Feature file text | Replace bare empty cells `|  |` with explicit `| " " |` (single whitespace in quotes) so test runners treat it as deliberate blank input |
| **Dropdown search — error message during typing** | Angular HTML | Typing in a dropdown search field (`ngx-mat-select-search`) never fires a validation error. The search only filters options. Any step saying "Then an error message is displayed" for a search action must be REMOVED or changed to "Then no matching options are displayed" |
| **Scenario with no Given or When (FDA audit)** | Feature file text | Scenarios consisting only of `Then` steps are invalid — the auditor cannot identify what state was set up or what action was taken. Add at least one `Given` (state setup) or `When` (action) to every scenario |
| **Placeholder test data in Examples** | Live DB query | Unit IDs, product codes, and other identifiers in Examples tables must be real values from the QA database. Replace invented values (e.g., `W1234-18-031302-Z`, `INVALIDUNIT123`) with actual DB-sourced records |

#### Decision rules

| Situation | Action |
|---|---|
| Step matches all sources | ✅ KEEP |
| Step is slightly wrong (wording, punctuation) | ⚠️ REWORD — use exact text from source |
| Feature not in Angular HTML/TS | ❌ REMOVE or flag as `@legacy-only` |
| **Timezone scenario** — even if no timezone code found in Angular | ✅ **ALWAYS KEEP** — timezone behavior may be backend-driven or future requirement |
| Navigation path in Background differs from Phase 0 live app | ❌ REPLACE with exact path from live app menu |
| Breadcrumb assertion differs from Phase 0 live app | ❌ REPLACE with exact breadcrumb from live page |
| Error message text differs from DB | ❌ REPLACE with exact DB text |
| Button doesn't exist in HTML | ❌ REMOVE or rewrite |
| Dialog behavior contradicts code (`disableClose`, flow order) | ❌ REWRITE to match code |
| DB test data in examples doesn't exist | ❌ REPLACE with real DB values |
| **Validation Outline examples are weak** (only empty row, or placeholder values like `ZZTEST-*`) | ➕ POPULATE with real DB values — valid input, max-length+1 boundary, whitespace, special chars (see Phase 1D) |
| **"No results" scenario asserts UI-state** (e.g., "grid search field remains displayed") instead of the visible message | ⚠️ REWORD — assert the empty-state message text (e.g., `"No Results to Display"`) which is more meaningful and reliably testable |
| Step contains `User should see validation message` | ❌ REPLACE — change `see` to `observe`: `Then User should see validation message "<Description>"` → `Then User should observe "<Description>"`. Search the entire file for this pattern and replace every occurrence. |
| **Title/Subtitle section missing** from feature file | ➕ ADD the standard navigation scenario and page header scenario (see template below) |
| **Breadcrumbs section missing** from feature file | ➕ ADD both standard breadcrumb scenarios using the exact breadcrumb from Phase 0 live app (see template below) |
| **Scenario title has "on [Screen] screen/grid/filter/modal" suffix** | ❌ REMOVE from the `Scenario:` / `Scenario Outline:` title line — e.g., `Scenario: Filter by Unit ID on Void Test Batch grid` → `Scenario: Filter by Unit ID` |
| **Scenario Outline: Examples column not referenced in any step** | ❌ REWRITE the step to include `"<columnName>"` — e.g., `When User enters "<unitId>" in the Unit ID field` |
| **Empty Examples cell** `\|  \|` | ❌ REPLACE with `\| " " \|` (explicit whitespace) |
| **Dropdown search step claims error message fires** | ❌ REMOVE error claim — rewrite as `Then no matching options are displayed` or `Then "No results found" message appears` |
| **Scenario has only `Then` steps (no Given or When)** | ❌ ADD a `Given` (state) or `When` (action) — FDA audit requires the auditor to identify setup or trigger without relying on background knowledge |
| **Examples table contains invented/placeholder test data** | ❌ REPLACE with real DB-sourced values queried in Phase 1D |

#### Mandatory sections — add if missing

Every reviewed feature file MUST contain a **Title and Subtitle** section and a **Breadcrumbs** section. If either is absent, add them using these exact templates, substituting `[Screen Name]` and `[Breadcrumb Path]` from the live app (Phase 0):

```gherkin
  # ============================================================
  # Title and Subtitle
  # ============================================================

  Scenario: Navigate to [Screen Name] screen
    When the user navigates to [Screen Name]
    Then the [Screen Name] screen is displayed

  Scenario: Verify [Screen Name] page header
    Given the user is on the [Screen Name] screen
    Then the title text matches the Display name configured in the Maintain Menu Items screen
    And the subtitle text matches the Remarks field value configured in the Maintain Menu Items screen

  # ============================================================
  # Breadcrumbs
  # ============================================================

  Scenario: Breadcrumbs display correctly
    Then breadcrumbs display correctly showing: [Breadcrumb Path]
    And breadcrumb links are clickable

  Scenario: Breadcrumb Home link navigates to Home screen
    When the user clicks Home in the breadcrumb
    Then the user is navigated back to the Home screen
    And the Home screen displays successfully
```

The `[Breadcrumb Path]` value is read from the live app in Phase 0 Step 0.3 (e.g., `Home > Check in Batch Query with Unit Data`).

#### Systematic fixes — apply to the entire file before section review

Run all of the following as automated sweeps across the whole feature file before beginning any section-by-section review. These are non-negotiable — every reviewed file must pass all six checks.

**Fix 1 — "on screen" suffix in Scenario titles**
Scan every line starting with `Scenario:` or `Scenario Outline:`. If the title ends with ` on [Any Text] screen`, ` on [Any Text] grid`, ` on [Any Text] filter`, ` on [Any Text] modal`, or ` on [Any Text] pagination`, strip that trailing phrase.
```
# BEFORE:
Scenario: Filter by Unit ID on Void Test Batch grid
Scenario Outline: Verify that validation is applied for Unit ID on Enter Note for Special Processing screen

# AFTER:
Scenario: Filter by Unit ID
Scenario Outline: Verify that validation is applied for Unit ID
```

**Fix 2 — "on screen" suffix in step lines (@Functional-Manual only)**
Already applied in earlier reviews. Confirm no step lines in `@Functional-Manual` scenarios still carry the suffix. Keep suffix on `@Functional-Automation` steps.

**Fix 3 — `see` → `observe` in validation Outlines**
Replace every `Then User should see validation message "<Description>"` with `Then User should observe "<Description>"` throughout the file.

**Fix 4 — Scenario Outline parameter placeholders**
Inspect every `Scenario Outline`. For each column in the Examples table, verify that column name appears as `<columnName>` in at least one step. If a column is never referenced (e.g., `unitId` column exists but the step just says "with invalid Unit ID"), rewrite the step to include `"<unitId>"`:
```
# BEFORE (unitId column exists but never used in step):
When User enters unit details on "..." page with invalid Unit ID

# AFTER:
When User enters "<unitId>" in the Unit ID field
```

**Fix 5 — Empty Examples cells → explicit whitespace**
Replace every bare empty cell `|  |` or `| |` in an Examples table with `| " " |` so the intent of a blank input is unambiguous to the test runner.

**Fix 6 — Scenarios with only Then steps (FDA audit requirement)**
Scan every `Scenario:` block. If it contains no `Given` or `When` step, add one. Use:
- `Given the user is on the [Screen Name] screen` — for state-setup (layout/display scenarios)
- `When the user navigates to [Screen Name]` — for navigation scenarios
```
# BEFORE (invalid — no Given or When):
Scenario: Breadcrumbs display correctly
  Then breadcrumbs display correctly showing: Home > Void Test Batch

# AFTER (valid):
Scenario: Breadcrumbs display correctly
  Given the user is on the Void Test Batch screen
  Then breadcrumbs display correctly showing: Home > Void Test Batch
```

#### Output per section
Present findings as a table:
```
| Scenario | Status | Issue | Fix Applied |
|---|---|---|---|
| Scenario title | ✅/⚠️/❌ | What's wrong | What was changed |
```

Then apply all corrections to the working feature file immediately.

---

### Phase 4 — Update Feature File

After each section review, update the feature file:
- Apply all scenario corrections
- Do NOT add `[REVIEWED ✓]` or any review status markers to section comments — keep section headers clean
- Do NOT remove timezone scenarios — keep them even if no code evidence found
- Write to `D:\bdd-analyst\<original-filename>-Reviewed.feature`

---

### Phase 5 — Comparison Report (if manual review provided)

If the user provides a manually reviewed version of the same feature file, generate a comparison:

```
| Category          | Count | Percentage |
|---|---|---|
| Fully Agree       |  N    |  XX.X%     |
| Partially Agree   |  N    |  XX.X%     |
| Conflict          |  N    |  XX.X%     |
| Overall Success   |  N    |  XX.X%     |
```

Plus section-wise breakdown and list of remaining conflicts.

---

## DB Query Runner

All DB queries run via the pre-built Java tool:
```bash
echo "<SQL QUERY>" | java \
  -cp "D:\bdd-analyst\db-tools;D:\bdd-analyst\db-tools\ojdbc11.jar" \
  OracleQuery
```
Credentials are read from `D:\bdd-analyst\db-tools\db.properties`.
Timeout: 30 seconds. If the tunnel is not running, the query will fail — prompt the user to start it.

> ⚠️ **STRICT RULE — READ-ONLY DATABASE ACCESS ONLY**
> The DB connection is for **querying only**. Under no circumstances should any `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, `DROP`, `CREATE`, or any other data-manipulation or DDL statement be executed.
> Only `SELECT` statements are permitted.
> This rule applies always — even if asked by the user. The QA database must never be modified through this tool.

---

## Critical Rules

1. **Never remove timezone scenarios** — even when no timezone conversion code is found in the Angular component or FMB. Timezone behavior may be handled by the backend API, be a future requirement, or be tested at the system level. Always keep them.

2. **Error messages must match DB exactly** — copy from `VALID_ERRORS_LAB.ERROR` column. Never paraphrase, shorten, or invent error message text.

3. **Button/field existence must be confirmed in HTML** — do not assume a button or field exists because the FMB had it. If it's not in the Angular `component.html`, it doesn't exist in the modern UI.

4. **Dialog `disableClose: true` means no X button** — when a dialog is opened with `disableClose: true`, the X button and ESC key do NOT close it. Scenarios claiming the X button closes the dialog must be removed.

5. **API params are ground truth for what data is sent** — check the service `.ts` method signature. If a field (e.g., `programId`, `componentPrefix`) is not in the request model, it is not sent.

6. **Test data must come from the live DB** — example values in `Scenario Outline` tables should be real values that exist in the QA database for the relevant chapter/status.

---

## Output Files

| File | Location |
|---|---|
| Corrected feature file | `D:\bdd-analyst\<filename>-Reviewed.feature` |
| Comparison report (if applicable) | Console output |
