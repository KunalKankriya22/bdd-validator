---
name: dod-report-generator
description: Run Oracle Forms gap analysis, generate a WellSky SDS .docx, AND print a JIRA-ready UI+API test coverage summary — all in one command.
---

# Oracle Forms → Gap Analysis + SDS Document Generator

Performs a systematic Oracle Forms vs Angular gap analysis **and** generates a WellSky Software Design Specification (SDS) `.docx` document in a single command. The Angular component is researched once and the findings power both outputs.

## Inputs

| Input | Required | Accepted Formats |
|-------|----------|-----------------|
| Oracle Forms source | Yes — **any one** of the 4 formats | 1. FMB XML export file path · 2. Screen mnemonic (e.g. `DONMAST`) · 3. Pasted block/trigger/LOV definitions · 4. JIRA epic key (e.g. `MLT-12420`) |
| Angular component name | **Mandatory** | Component folder or selector name (e.g. `maintain-donor-interdiction`, `donor-demographics`) — required for SDS generation |

## Usage

```
/dod-report-generator <oracle-forms-input> <angular-component-name>
```

**Examples:**
```
/dod-report-generator DONMAST donor-demographics
/dod-report-generator /path/to/QCHISDTL.xml query-collection-history
/dod-report-generator MLT-12420 maintain-donor-interdiction
```

## Argument Parsing

When the skill is invoked, parse the ARGUMENTS value immediately before doing anything else.

Split ARGUMENTS by whitespace to extract the two positional values:

| Position | Maps To | How to Identify |
|----------|---------|-----------------|
| First token | Oracle Forms source | A file path (contains `/` or `\` or `.xml`), an all-caps mnemonic (e.g. `DONMAST`), a JIRA key (matches `[A-Z]+-\d+`), or a short mnemonic word |
| Last token | Angular component name | Lowercase kebab-case string (e.g. `maintain-donor-interdiction`, `donor-demographics`) — always the **last** token in ARGUMENTS |

**Parsing rules:**
- If ARGUMENTS contains **two or more tokens**: first token = Oracle Forms source, last token = Angular component name
- If ARGUMENTS contains **one token**:
  - If it is kebab-case lowercase → treat as Angular component name only; Oracle Forms source is missing
  - Otherwise → treat as Oracle Forms source only; Angular component name is missing
- If ARGUMENTS is **empty**: both inputs are missing

Apply the missing-input prompts (see Input Validation) for whichever inputs could not be parsed from ARGUMENTS.

## Input Validation

On invocation, verify both inputs are present before proceeding.

### Oracle Forms source (any one of 4 formats)

If the Oracle Forms source is **not provided**, display this prompt and wait for the user's response:

```
Which Oracle Forms screen would you like to analyze?
Provide one of:
- FMB XML export file path (e.g., D:/Wellsky/forms/DONMAST.xml)
- Screen mnemonic (e.g., DONMAST, QCHISDTL)
- Pasted block/item/trigger/LOV definitions
- JIRA epic key with Oracle Forms mapping (e.g., MLT-12420)
```

Accept whichever format the user provides:
1. **FMB XML export file path** — read and parse the XML for blocks, items, triggers, LOVs, record groups
2. **Text-based FMB analysis** — manually extracted feature list pasted by the user
3. **Screen mnemonic / form name** — use as a search key to find Angular counterpart and infer Oracle Forms structure
4. **Pasted FMB content** — block/trigger/LOV definitions pasted directly into chat
5. **JIRA ticket reference** — fetch epic/story with Oracle Forms mapping (requires JIRA authentication)

### Angular component name (mandatory)

If the Angular component name is **not provided**, stop and ask:

```
What is the Angular component name for this screen?
(e.g., maintain-donor-interdiction, donor-demographics, query-collection-history)
This is required to generate the SDS document.
```

Do not proceed until both inputs are provided.

---

## Execution Workflow

### Phase 1 — Parse Oracle Forms Definition

Extract from the FMB source (XML export, pasted text, or description):

#### 1a. Data Blocks
- Block name, base table, query data source
- WHERE clause filters (especially `:PARAMETER.CHAPTER_ID` chapter filtering)
- ORDER BY clauses
- Master-detail block relationships

#### 1b. Items (Fields)
For each block item:
- Item name, data type, max length
- Required flag (`REQUIRED` property)
- LOV attached (`LOV_NAME`)
- Default value (`DEFAULT_VALUE`)
- Format mask (`FORMAT_MASK`)
- Enabled/disabled/visible state
- Canvas/tab page placement
- Calculation formula

#### 1c. LOVs (List of Values)
For each LOV:
- LOV name and record group query SQL
- Column mappings (return values to block items)
- WHERE clause — especially active record filters (`EFF_DATE <= SYSDATE AND (TERM_DATE IS NULL OR TERM_DATE > SYSDATE)`)
- Tables referenced (especially `DONSYS.VALID_MASTER_CODES`)
- Auto-display / auto-select settings

#### 1d. Triggers
Key triggers to capture:
- `WHEN-VALIDATE-ITEM` — field-level validations
- `WHEN-VALIDATE-RECORD` — cross-field validations
- `WHEN-NEW-FORM-INSTANCE` / `WHEN-NEW-RECORD-INSTANCE` — initialization & defaults
- `PRE-QUERY` / `POST-QUERY` — data filtering / transformation
- `ON-INSERT` / `ON-UPDATE` / `ON-DELETE` — DML and save logic
- `KEY-COMMIT` — save sequence
- `WHEN-LIST-CHANGED` — dropdown cascading
- `WHEN-CHECKBOX-CHANGED` — toggle handlers

#### 1e. Program Units (PL/SQL)
- Calls to `UTIL.LIFETRACK_TIMEZONE_CONVERT` (timezone handling)
- Validation procedures
- Business rule implementations

---

### Phase 2 — Research Angular Component (Shared)

> **This phase feeds BOTH the gap analysis and the SDS. Do it thoroughly — read every relevant file.**

Locate the component using the provided name:

```bash
find src/app/modules -type d -name "*<component-name>*"
find src/app/modules -name "*<component-name>*.component.ts"
```

Read all of the following (wherever they exist):

**Component files:**
- `<component>.component.ts` — signals, form setup, actions, lifecycle
- `<component>.component.html` — template, fields, buttons, table columns
- `<component>.component.scss` — layout (for GUI section)

**Supporting files:**
- `services/<feature>.service.ts` — all API calls and their endpoints
- `models/<feature>.models.ts` — interfaces, request/response shapes
- `dialogs/*.ts` — any add/edit/view/confirm dialog components
- `validators/*.ts` — custom validators
- `*-filter-panel.ts` / `*-filter-panel.html` — filter panel if present

**Shared references:**
- `src/app/core/constants/api.constants.ts` — API endpoint definitions for this feature
- `src/app/shared/validators/input.validators.ts` — shared validators in use
- `src/app/shared/services/chapter-timezone.service.ts` — timezone usage
- Route registry entry for this component

**API counterpart (if accessible at D:\Wellsky\BM.BloodCenters.API):**
- `[Feature]Controller.cs`
- `[Feature]Service.cs`
- `[Feature]Repository.cs`
- `[Feature]Validation.cs`

Capture and organize:
- All fields (name, type, required, max length, default, read-only/editable)
- All dropdowns (data source, filtering, cascading behavior)
- All buttons and their actions
- All validations (field-level and cross-field)
- All API endpoints called
- Date/timezone handling patterns
- Business logic (auto-calculations, conditional enable/disable/visibility)
- Error messages shown to user

---

### Phase 3 — Gap Analysis

Compare Oracle Forms features against the Angular + API implementation across four categories.

#### Category A: Dropdown / LOV

For each Oracle LOV:
1. Does an equivalent dropdown exist in Angular?
2. Is the data source the same (same table, same CODE_TYPE)?
3. **Active record filtering** — does the Angular/API filter by `EFF_DATE`/`TERM_DATE` using `CHAPTER_LOCAL_DATE`?
4. **Master screen impact** — if LOV sources `VALID_MASTER_CODES`, does Angular use `ValidMasterCodesService`? Will new codes added in the admin screen appear here?
5. **Column mapping** — does the dropdown return the right value (code vs description)?
6. **Cascading / auto-populate** — does Oracle `WHEN-LIST-CHANGED` have an Angular equivalent `(selectionChange)` handler?
7. **Default selection** — Oracle `DEFAULT_VALUE` or `WHEN-NEW-RECORD-INSTANCE` defaults matched?

#### Category B: Chapter / Timezone

1. **Chapter-based query filter** — does the API include chapter filtering? Does Angular send `X-ChapterId` header?
2. **Chapter local date** — does Oracle use `UTIL.LIFETRACK_TIMEZONE_CONVERT.get_local_time`? Does the API use `SharedServices.GetChapterLocalDateAsync`? Does Angular use `ChapterTimezoneService.getChapterLocalDate()`?
3. **Date display** — are dates shown in chapter timezone or raw UTC?
4. **Date filtering** — are `EFF_DATE`/`TERM_DATE` comparisons done against chapter local date (not SYSDATE/server time)?
5. **Save timezone** — does Oracle convert to GMT on save? Does the API call `SharedServices.GetGmtDateAsync()`?

#### Category C: Field Validations

For each validated field:
1. **Required** — Oracle `REQUIRED=TRUE` → Angular `Validators.required`?
2. **Max length** — Oracle `MAX_LENGTH` → Angular `Validators.maxLength(n)`? Same value?
3. **Data type** — Oracle type (NUMBER, DATE, VARCHAR2) → Angular type validator?
4. **Format mask** — Oracle `FORMAT_MASK` → Angular pattern/custom validator?
5. **WHEN-VALIDATE-ITEM** — each PL/SQL validation mapped to an Angular validator?
6. **Cross-field (WHEN-VALIDATE-RECORD)** — form-level validators for multi-field rules (date range, conditional required)?
7. **DB-level validation** — API `ValidationBase` checks match Oracle package calls?
8. **Error messages** — user-facing text matches Oracle `MESSAGE()` intent?

#### Category D: Business Logic & Behavior

1. **Calculated fields** — Oracle formula items / POST-CHANGE → Angular computed signals / `valueChanges`?
2. **Conditional enable/disable** — `SET_ITEM_PROPERTY(ENABLED)` → Angular `[disabled]` / `control.disable()`?
3. **Conditional visibility** — `SET_ITEM_PROPERTY(VISIBLE)` → Angular `*ngIf`?
4. **Master-detail** — Oracle block coordination → Angular parent/child data passing?
5. **Save sequence** — Oracle `KEY-COMMIT` validation order → Angular form submit sequence?

---

### Phase 4 — Generate Gap Report

Generate the gap report as a **PDF file** at `docs/gap-analysis/<component-name>-gap-report.pdf` using a Python script with `reportlab`.

Do NOT write a markdown file. Use `reportlab` to produce a properly formatted PDF with:
- Title block: Oracle Form, Angular Component, API Controller, Analysis Date
- Summary table with counts (Critical / High / Medium / Low / Total)
- One section per severity level — each as a styled table with columns: # | Issue | Area | Current | Expected | Suggested Fix
- A final compact section listing verified-implemented features

**Cell content rules — KEEP IT LEAN:**
- Every cell must be a short phrase (≤ 10 words). No full sentences, no paragraphs.
- "Current" and "Expected": one brief clause each (e.g. `"Only Validators.required on form control"`)
- "Suggested Fix": one imperative sentence, ≤ 12 words
- Root Cause column is **omitted** from the PDF (keep it in the data dict only)
- Verified items: one line each, ≤ 12 words

**GAP_DATA dict structure — 5-tuple per item (no Root Cause in tuple):**

```python
GAP_DATA = {
    "oracle_form":  "FORMNAME",
    "component":    "angular-component-name",
    "controller":   "ControllerName · /api/v1/endpoint",
    "date":         "YYYY-MM-DD",
    # Each item: (Issue, Area, Current, Expected, Suggested Fix)
    "high": [
        ("Short issue title",
         "Area label",
         "Current brief clause",
         "Expected brief clause",
         "Imperative fix sentence"),
    ],
    "medium": [...],
    "low": [...],
    "verified": [
        "Short verified statement ≤ 12 words",
        ...
    ],
}
```

**PDF style rules:**
- Page size: A4, margins 2cm all sides
- Title: Helvetica-Bold 14pt
- Section headings: Helvetica-Bold 11pt, colored — High: orange (#E67E22), Medium: blue (#2980B9), Low: grey (#7F8C8D), Summary/Verified: dark grey (#2C3E50)
- Table header row: Helvetica-Bold 8pt, white text on section color
- Table body rows: Helvetica 8pt, alternating white / #F2F2F2
- All table borders: 0.5pt #CCCCCC lines
- Gap table: **6 fixed-width columns** `[0.5, 3.8, 2.4, 3.4, 3.4, 3.5] cm` = 17 cm total
- Verified table: 2 columns `[0.7, 16.3] cm`

**CRITICAL — use `Paragraph` objects in every table cell, never plain strings.**

`WORDWRAP` in `TableStyle` only works when cells contain `Paragraph` objects. Plain strings do **not** wrap — they overflow and overwrite adjacent columns. Always wrap cell text with `Paragraph(text, style)`.

**Correct reportlab pattern (copy exactly):**

```python
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle

# Define paragraph styles for cells
cell_s = ParagraphStyle("cell", fontName="Helvetica",      fontSize=8, leading=10, wordWrap="LTR")
hdr_s  = ParagraphStyle("hdr",  fontName="Helvetica-Bold", fontSize=8, leading=10,
                         textColor=colors.white, wordWrap="LTR")
num_s  = ParagraphStyle("num",  fontName="Helvetica",      fontSize=8, leading=10,
                         alignment=1, wordWrap="LTR")

def P(text, style=None): return Paragraph(str(text), style or cell_s)
def H(text):             return Paragraph(str(text), hdr_s)

# Fixed column widths — MUST total 17 cm (A4 minus 2cm margins each side)
GAP_WIDTHS = [0.5*cm, 3.8*cm, 2.4*cm, 3.4*cm, 3.4*cm, 3.5*cm]

def gap_table(items, hdr_color):
    rows = []
    for i, it in enumerate(items):
        rows.append([
            P(str(i+1), num_s),
            P(it[0]),   # Issue
            P(it[1]),   # Area
            P(it[2]),   # Current
            P(it[3]),   # Expected
            P(it[4]),   # Suggested Fix
        ])
    data = [[H("#"), H("Issue"), H("Area"), H("Current"), H("Expected"), H("Suggested Fix")]] + rows
    ts = TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), hdr_color),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.white, colors.HexColor("#F2F2F2")]),
        ("GRID",          (0,0),(-1,-1), 0.5, colors.HexColor("#CCCCCC")),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
        ("LEFTPADDING",   (0,0),(-1,-1), 4),
        ("RIGHTPADDING",  (0,0),(-1,-1), 4),
    ])
    return Table(data, colWidths=GAP_WIDTHS, style=ts, repeatRows=1)

# Verified table — also use Paragraph cells
def verified_table(items):
    rows = [[P(str(i+1), num_s), P(v)] for i, v in enumerate(items)]
    vt = Table(rows, colWidths=[0.7*cm, 16.3*cm])
    vt.setStyle(TableStyle([
        ("ROWBACKGROUNDS",(0,0),(-1,-1), [colors.white, colors.HexColor("#F2F2F2")]),
        ("GRID",          (0,0),(-1,-1), 0.5, colors.HexColor("#CCCCCC")),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
        ("LEFTPADDING",   (0,0),(-1,-1), 4),
        ("RIGHTPADDING",  (0,0),(-1,-1), 4),
    ]))
    return vt
```

Write the PDF generation into `docs/SDS/_generate_sds.py` as a `generate_gap_pdf()` function (no arguments — reads from the module-level `GAP_DATA` dict) called at the end of `main()`. Execute the script — it must produce both the SDS `.docx` AND the gap report `.pdf` in one run.

**Severity definitions:**

| Severity | Definition |
|----------|-----------|
| **Critical** | Data integrity risk, patient safety impact, or complete feature missing |
| **High** | Functional gap that affects user workflow or data quality |
| **Medium** | Partial implementation or inconsistency that doesn't block workflow |
| **Low** | Minor cosmetic or non-functional difference |

**Area labels:** `Dropdown/LOV` · `Dropdown/LOV - Master Impact` · `Chapter/Timezone` · `Field Validation` · `Cross-Field Validation` · `Business Logic` · `Data Filtering` · `Error Handling`

---

### Phase 5 — Generate SDS Document

Using the research from Phase 2 (and noting any gaps from Phase 3 in the Additional Information section), generate the SDS `.docx`.

#### 5a. Prepare Content for All 13 Sections

Organize everything from Phase 2 into:

1. **Product/Functionality** — 1-2 paragraphs describing the feature
2. **Scope** — bullet list of all capabilities
3. **Graphical User Interface** — screen layout, all panels/dialogs, states (empty, loading, error, data)
4. **Fields** — table: `Field Name | Type | Size | Entry | List Value | Base Table` (table name only — no column name suffix)
5. **Command Buttons** — table: `Button Name | Functionality`
6. **Database Table Used** — table: `Library | Type | Description` (API endpoints — write endpoint strings as-is, no extra padding spaces for column alignment; keep Description values short: one brief clause per row, e.g. `"Paginated retrieval (questionCode required)"` not `"Paginated retrieval of response groups (questionCode required)"` — omit redundant words)
7. **Output Tables** — table: `Field Name | Data Type | Length` (response model fields — 3 columns, no Description column)
8. **Internal Database Definitions** — table: `Field | Data Type | Length | Displayed | Enterable` (request/internal model fields)
9. **Exceptions and Error Messages** — two sub-sections labeled exactly as shown:
   - Sub-label `"Exceptions Captured:"` → table: `Exception Code | Description` (HTTP status codes — short descriptions only, e.g. `"Validation failed"` not `"Validation failed — error code and message returned in response body"`)
   - Sub-label `"Error Codes / User Messages:"` → table: `Error Code | Description` (Oracle error codes — concise user-facing phrasing; **do not** add implementation detail clauses in parentheses such as `"(uses chapter local date)"` or `"(active records only)"`. List only the required fields the user sees, no extra ones. Use `>=` style for comparisons, e.g. `"Termination date must be >= Effective date"`.)
10. **Business Components and Functions** — one dense summary paragraph per component/service (not bullet lists). Format: `ComponentName (filename.ts): sentence describing its role and key responsibilities.` Cover: main component, add/edit component, filter panel, service, API controller, service layer, repository.
11. **Security Resources** — table: `Program Name | Resource Name | Resource ID | Description`
12. **Limitations/Constraints** — clean bullet list of known constraints and unsupported scenarios only. Do NOT include gap-fix audit notes (e.g. "FIXED — gap HIGH-001") — those belong in the gap report PDF, not the SDS.
13. **Additional Information** — date formatting, timezone behavior

**Communication/Messaging section — keep heading, erase placeholder only:**
- **Do NOT delete the heading** — the "Communication/Messaging" heading must remain in the document.
- **Clear only the red italic placeholder text** — call `clear_section_placeholder(doc, "Communication/Messaging")` which removes the instruction text inside the section while leaving the heading intact and the section body empty.
- Do NOT write "Not applicable" or any other content in this section body.

Use "Not applicable" for any other section that genuinely has no content.

#### 5b. Write and Execute Python Script

Write the generation script to `docs/SDS/_generate_sds.py`.

**Template path:** `docs/SDS/_templates/Software Design Specifications (SDS).docx`
**Output path:** `docs/SDS/<Feature Name> (SDS).docx`

The script MUST:
- Open the template (never build from scratch)
- Fix title table: replace "Software Requirements Specification (SRS)" → "Software Design Specifications (SDS)"
- Fill Version History table (Table 2) — version number as integer string `"1"` (never `"1.0"`), date in `MM/DD/YYYY` format (e.g. `"07/15/2026"`), columns in order: Version | Description | Author | Date
- **Communication/Messaging** — call `clear_section_placeholder(doc, "Communication/Messaging")` to erase the red italic placeholder text while keeping the section heading in the document
- For each of the 13 sections: find the Heading 1 paragraph, find the red placeholder paragraph after it, replace placeholder text, insert additional paragraphs and tables as needed
- Use `Normal Table` style for all tables (not `Table Grid` — it may not exist in the template)
- Set all table borders via XML (`w:tblBorders`, single, sz=4)
- Save to output path

**Critical formatting rules:**

| Element | Font | Size | Style |
|---------|------|------|-------|
| Body text | Arial | 10pt | Normal |
| Table headers | Arial | 12pt (default) | Bold |
| Table data cells | Arial | 10pt | Normal |
| Bullet items | Arial | 10pt | `"- item text"` prefix, NO Word list styles |

**Script helper pattern (use consistently):**

```python
from docx import Document
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
# IMPORTANT: alias docx Paragraph to avoid shadowing reportlab's Paragraph at module level
from docx.text.paragraph import Paragraph as DocxParagraph
import os

def set_run_font(run, size_pt=10, bold=None, font_name="Arial"):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    if bold is not None:
        run.font.bold = bold

def set_table_borders(table, color="000000"):
    tbl = table._tbl
    tbl_pr = tbl.find(qn('w:tblPr'))
    if tbl_pr is None:
        tbl_pr = OxmlElement('w:tblPr')
        tbl.insert(0, tbl_pr)
    borders = OxmlElement('w:tblBorders')
    for bname in ['top','left','bottom','right','insideH','insideV']:
        b = OxmlElement(f'w:{bname}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), '4')
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), color)
        borders.append(b)
    existing = tbl_pr.find(qn('w:tblBorders'))
    if existing is not None:
        tbl_pr.remove(existing)
    tbl_pr.append(borders)

def clear_paragraph(para):
    para.clear()

def replace_para_text(para, text, size_pt=10, bold=False):
    clear_paragraph(para)
    run = para.add_run(text)
    set_run_font(run, size_pt=size_pt, bold=bold)

def add_para_after(ref_para, text="", size_pt=10, bold=False):
    new_p = OxmlElement('w:p')
    ref_para._element.addnext(new_p)
    p = DocxParagraph(new_p, ref_para._element.getparent())
    if text:
        run = p.add_run(text)
        set_run_font(run, size_pt=size_pt, bold=bold)
    return p

def insert_table_after(ref_para, doc, cols, headers, data_rows):
    table = doc.add_table(rows=1, cols=cols)
    table.style = 'Normal Table'
    set_table_borders(table)
    hdr = table.rows[0]
    for i, h in enumerate(headers):
        hdr.cells[i].text = ""
        run = hdr.cells[i].paragraphs[0].add_run(h)
        run.font.bold = True
        run.font.name = "Arial"
    for row_data in data_rows:
        row = table.add_row()
        for i, val in enumerate(row_data):
            row.cells[i].text = ""
            run = row.cells[i].paragraphs[0].add_run(str(val) if val else "")
            set_run_font(run, size_pt=10)
    ref_para._element.addnext(table._tbl)
    return table

def find_heading(doc, text_fragment):
    for para in doc.paragraphs:
        if para.style.name.startswith('Heading') and text_fragment.lower() in para.text.lower():
            return para
    return None

def find_placeholder_after(heading_para):
    parent = heading_para._element.getparent()
    children = list(parent)
    idx = children.index(heading_para._element)
    for child in children[idx+1:]:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'p':
            return DocxParagraph(child, parent)
        if tag == 'tbl':
            break
    return None

def _is_heading_element(el):
    """Check if an XML paragraph element has a heading style via XML (avoids .style crash on raw elements)."""
    pPr = el.find(qn('w:pPr'))
    if pPr is not None:
        pStyle = pPr.find(qn('w:pStyle'))
        if pStyle is not None:
            val = pStyle.get(qn('w:val'), '')
            if val.startswith('Heading'):
                return True
    return False

def remove_section(doc, heading_text):
    """Remove a Heading paragraph and all body content up to the next Heading or end of document."""
    heading = find_heading(doc, heading_text)
    if not heading:
        return
    parent = heading._element.getparent()
    children = list(parent)
    idx = children.index(heading._element)
    to_remove = [heading._element]
    for child in children[idx+1:]:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'p':
            if _is_heading_element(child):
                break
            to_remove.append(child)
        elif tag == 'tbl':
            to_remove.append(child)
        else:
            break
    for el in to_remove:
        parent.remove(el)

def write_section(doc, heading_text, lines):
    heading = find_heading(doc, heading_text)
    if not heading:
        return None
    placeholder = find_placeholder_after(heading)
    if not placeholder:
        return heading
    if lines:
        replace_para_text(placeholder, lines[0])
        prev = placeholder
        for line in lines[1:]:
            prev = add_para_after(prev, line)
    return heading

def clear_section_placeholder(doc, heading_text):
    """Keep the section heading; erase only the red italic placeholder paragraph after it."""
    heading = find_heading(doc, heading_text)
    if not heading:
        return
    placeholder = find_placeholder_after(heading)
    if placeholder:
        clear_paragraph(placeholder)
```

After writing the script, execute it:
```bash
python3 docs/SDS/_generate_sds.py
```

Verify the output file exists and report its path and size.

---

### Phase 6 — Test Coverage Summary

Using the Angular component name already identified in Phase 2, run UI and API tests and print a JIRA-ready summary.

#### 6a — Get Release Version

```bash
git tag --sort=-version:refname | head -1
```

Strip the `release/` prefix (e.g. `release/2026-R16.75` → `2026-R16.75`). If no tags exist, ask the user.

#### 6b — Run UI Tests (Angular / Jest)

Locate all spec files under the component folder and run with coverage:

```bash
npx jest "<spec-file-pattern>" --coverage \
  --collectCoverageFrom="src/app/modules/.../<component-folder>/**/*.ts" \
  --coveragePathIgnorePatterns="\.spec\.ts$|\.model\.ts$" \
  --coverageReporters=text --verbose 2>&1
```

Parse Jest output for: total, passed, failed, skipped, time (`Time: 3.1 s` → `~3 seconds`), success rate.

**Coverage** — extract from the `All files` row of the Jest coverage table:
- `% Stmts`, `% Branch`, `% Funcs`, `% Lines`
- `UI Overall = (% Stmts + % Branch + % Funcs + % Lines) / 4` — round to 2 decimal places

If the spec file does not exist, note "No UI test file found" and show `N/A` for coverage.

#### 6c — Run API Tests (.NET / xUnit)

Locate the API test project directory:

```bash
find "$(dirname "$(git rev-parse --show-toplevel)")" -maxdepth 6 -type d -name "*.API.Tests" 2>/dev/null | head -1
```

Find related backend test files and run with coverlet:

```bash
dotnet test --filter "FullyQualifiedName~<ClassName>" --no-build --verbosity quiet \
  /p:CollectCoverage=true /p:CoverletOutputFormat=json /p:CoverletOutput=/tmp/bm-dod-coverage \
  '/p:Include=[BM.BloodCenters.API]*<PascalKeyword>*' 2>&1
```

If `--no-build` fails, retry without it.

**If the API test project directory is not found** (the `find` command returns nothing), stop and ask the user:

```
The API test project directory could not be located automatically.
Please provide the path or repository link to the API project:
(e.g., /Users/you/WellSky/BM.BloodCenters.API  or  https://github.com/org/BM.BloodCenters.API)
```

Wait for the user's response, then:
- If a **local path** is provided: re-run the `find` command starting from that path, then proceed with `dotnet test`.
- If a **Git URL** is provided: inform the user that cloning is required and ask them to clone the repo locally and re-run, or skip API tests for now.
- If the user says **skip**: note "Backend not accessible — skipped" in the JIRA summary block and set API coverage to `N/A`.

Parse dotnet output for: total, passed, failed, skipped, time (`Time Elapsed: 00:00:08` → `~8 seconds`), success rate.

**Coverage** — extract from the coverlet summary table (`Line`, `Branch`, `Method` columns):
- `API Overall = (Line% + Branch% + Method%) / 3` — round to 2 decimal places

#### 6d — Print the JIRA Summary

Print this block directly to the terminal (do not write to any file):

```
========================================
UI TEST SUMMARY  (Angular / Jest)
========================================
Release Version:          <version>
Total Test Cases Written: <total>
Tests Passed:             <passed> ✓
Tests Failed:             <failed>
Tests Skipped:            <skipped>
Test Success Rate:        <rate>%
Test Execution Time:      ~<time>
Unit Test Coverage:       <overall>%

========================================
API TEST SUMMARY  (.NET / xUnit)
========================================
Release Version:          <version>
Total Test Cases Written: <total>
Tests Passed:             <passed> ✓
Tests Failed:             <failed>
Tests Skipped:            <skipped>
Test Success Rate:        <rate>%
Test Execution Time:      ~<time>
Unit Test Coverage:       <overall>%
```

If failed > 0 for either block, append: `⚠️  <N> test(s) failed — resolve before merging.`
If Unit Test Coverage is below 85% for either block, append: `⚠️  Coverage below 85% threshold — add more tests.`

---

### Phase 7 — Report Outputs

After all phases are complete, report:

```
Gap Analysis + SDS + Test Coverage complete.

Oracle Form:  [form name / mnemonic]
Component:    [Angular component path]

Outputs:
  Gap Report: docs/gap-analysis/<component>-gap-report.pdf
              X gaps — Y Critical, Z High, W Medium, V Low

  SDS Doc:    docs/SDS/<Feature Name> (SDS).docx
              Size: X KB

  Test Summary: printed above — copy directly into your JIRA ticket

Next steps:
  - Open the SDS in Microsoft Word to verify formatting
  - Use /fda-510k-ticket to create JIRA tickets from critical/high gaps
  - Review gap report with the team before closing the sprint
```

---

## Output Locations

| Output | Path |
|--------|------|
| Gap Report | `docs/gap-analysis/<component-name>-gap-report.pdf` |
| SDS Document | `docs/SDS/<Feature Name> (SDS).docx` |
| SDS Script | `docs/SDS/_generate_sds.py` (kept for re-runs) |

The `docs/gap-analysis/` directory is created automatically if it doesn't exist.

---

## Key Project Reference Paths

### Angular UI
- Shared validators: `src/app/shared/validators/input.validators.ts`
- Chapter timezone: `src/app/shared/services/chapter-timezone.service.ts`
- Master codes service: `src/app/shared/services/valid-master-codes.service.ts`
- API constants: `src/app/core/constants/api.constants.ts`
- Feature modules: `src/app/modules/[module-name]/`

### API (D:\Wellsky\BM.BloodCenters.API)
- Validation base: `Shared/Validation/ValidationBase.cs`
- Error store: `Shared/ErrorCode/ErrorStore.json`
- Shared services: `Shared/Services/SharedServices.cs`
- User context: `Shared/Services/UserContextService.cs`

### Oracle Forms Common Tables
- `DONSYS.VALID_MASTER_CODES` — master lookup (CODE_TYPE + CODE + DESCRIPTION)
- `UTIL.LIFETRACK_TIMEZONE_CONVERT` — timezone conversion package
- `UTIL.VALID_ERRORS` — error message catalog

### SDS Template
- Template: `docs/SDS/_templates/Software Design Specifications (SDS).docx`
- Spec reference: `docs/SDS/SDS_DOCUMENT_SPEC.md`

---

## Notes

- **FMB binary files**: This skill works with XML exports, text extractions, or manual descriptions — not raw `.fmb` binaries. Guide the user to export as XML from Oracle Forms Builder if needed.
- **Angular component name is mandatory**: Without it the SDS cannot be generated. Ask before proceeding.
- **Research Phase 2 is shared**: Do not read files twice. Everything gathered for gap analysis is reused for SDS content.
- **Gap findings inform SDS**: Do not include gap analysis notes ("FIXED — gap X", "HIGH-001", etc.) inside the SDS. The gap report PDF is the right place for those. The SDS Limitations section must contain only clean constraint bullets.
- **Business Components format**: Write one dense summary paragraph per component — not bullet sub-lists. Pattern: `ComponentName (filename.ts): role and responsibilities in one or two sentences.`
- **Communication/Messaging heading is kept**: Call `clear_section_placeholder(doc, "Communication/Messaging")` — this erases only the red italic placeholder text. The heading itself stays in the document. Do NOT call `remove_section()` on this section.
- **Output Tables uses 3 columns**: `Field Name | Data Type | Length` — no Description column. This matches the `generate-sds` skill output exactly.
- **Exceptions sub-labels must be exact**: Use `"Exceptions Captured:"` as the label before the HTTP status table, and `"Error Codes / User Messages:"` before the Oracle error code table.
- **Table style**: Use `Normal Table` (not `Table Grid`) — the WellSky template only defines `Normal Table`. Apply borders manually via `set_table_borders()`.
- **No paragraph style assignment on raw OxmlElement paragraphs**: When inserting paragraphs via `OxmlElement('w:p')` and wrapping with `DocxParagraph()`, do NOT call `.style = ...` — this causes an `AttributeError`. Instead build run formatting via XML or use `add_para_after()` which avoids style assignment.
- **Never import `from docx.text.paragraph import Paragraph` at module level**: Both reportlab and python-docx have a class named `Paragraph`. A bare module-level import of docx's `Paragraph` silently overwrites reportlab's, causing `AttributeError: 'Paragraph' object has no attribute 'wrap'` (or `getKeepWithNext`) at runtime. Always alias it: `from docx.text.paragraph import Paragraph as DocxParagraph`.
- **Version History format**: Version number is always `"1"` (integer string, never `"1.0"`). Date is always `MM/DD/YYYY` (e.g. `"07/15/2026"`). Column order in the row: Version | Description | Author | Date.
- **Fields Base Table column**: Write the table name only (e.g. `VALID_HH_RES_GROUPS`). Do NOT append the column name with a dot separator (e.g. do NOT write `VALID_HH_RES_GROUPS.GROUP_CODE`).
- **API endpoint descriptions**: Keep them short — one brief clause per row. Omit redundant words. Do not repeat the method name or the entity name when context is already clear from the endpoint path.
- **Error descriptions are user-facing only**: Write what the user sees. Do not add implementation detail in parentheses (e.g. do NOT add `"(uses chapter local date)"`, `"(active records only)"`, `"returned in response body"`). List only the fields that are actually required by the screen — do not add fields that are set by the system or handled elsewhere.
- **JIRA tickets**: After gap analysis, use `/fda-510k-ticket` to create JIRA tickets for critical and high severity gaps.
