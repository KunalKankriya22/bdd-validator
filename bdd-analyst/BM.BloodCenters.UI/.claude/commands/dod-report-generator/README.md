# dod-report-generator

Generates a **Gap Analysis PDF** and a **SDS `.docx`** for any Oracle Forms → Angular migration screen in one command.
Reads the Oracle FMB XML, the Angular component, and the .NET API once — then produces both documents automatically.

---

## Quick Start

```
/dod-report-generator <oracle-forms-input> <angular-component-name>
```

**Real examples used in this project:**

```
/dod-report-generator VDIHLAGR hla-matching-grades
/dod-report-generator VDIEPITO hla-cross-reactive-groups
/dod-report-generator MLT-11031 hla-matching-grades VDIHLAGR fmb
/dod-report-generator MLT-11030 hla-cross-reactive-groups VDIEPITO.xml
```

> The skill will ask for any missing input before it starts.

---

## Inputs Explained

### 1 — Oracle Forms Source (pick one format)

| Format | Example | When to Use |
|--------|---------|-------------|
| FMB XML file path | `/path/to/VDIHLAGR.xml` | You have the XML export from Oracle Forms Builder |
| Screen mnemonic | `VDIHLAGR` | Short all-caps code; the skill searches for the XML automatically |
| JIRA key | `MLT-11031` | Fetches the ticket for context (requires Atlassian login) |
| Pasted FMB text | paste block/trigger/LOV text | You only have extracted text, not the XML file |

**How to find the FMB XML file:**
The XML exports are stored in the API project. Search like this:
```bash
find "/path/to/BM.BloodCenters.API" -iname "*VDIHLAGR*"
# → .../Src/BM.BloodCenters.API/vdihlagr_fmb.xml
```
All known XML files follow the pattern `<mnemonic>_fmb.xml`.

### 2 — Angular Component Name

This is the **kebab-case folder name** under `src/app/modules/`.

**How to find it:**
```bash
find src/app/modules -type d -name "*hla*"
# → src/app/modules/donor-functions/recruitment/hla-matching-grades
#                                                 ^^^^^^^^^^^^^^^^^^^ this is the name
```

Use the **last folder segment**, all lowercase with hyphens:
- `hla-matching-grades`
- `hla-cross-reactive-groups`
- `maintain-donor-interdiction`
- `donor-demographics`

---

## What the Skill Does — Step by Step

### Phase 1 — Parse Oracle FMB XML

Reads the XML export and extracts:
- **Blocks** — base table, ORDER BY, WHERE clause, master/detail relationships
- **Items** — field name, data type, max length, required flag, LOV attached, default value, format mask, enabled/disabled state
- **LOVs** — record group SQL query, column mappings, active-record filters (`EFF_DATE`/`TERM_DATE`)
- **Triggers** — `WHEN-VALIDATE-ITEM`, `WHEN-VALIDATE-RECORD`, `WHEN-NEW-FORM-INSTANCE`, `PRE-QUERY`, `ON-INSERT`, `ON-DELETE`, `KEY-COMMIT`, etc.
- **Program Units** — PL/SQL procedures like duplicate checks, timezone conversions

### Phase 2 — Research Angular Component

Reads every relevant file in the Angular component folder:

| File | What Is Extracted |
|------|------------------|
| `define-<name>.ts` | Signals, table config, sort, search, filter, dialog calls |
| `define-<name>.html` | Table columns, buttons, filter panel wiring |
| `add-edit-<name>.ts` | Form controls, validators, date handling, save/update logic |
| `add-edit-<name>.html` | Field layout, error messages, button labels |
| `services/<name>.service.ts` | All API endpoints called |
| `models/<name>.model.ts` | Request/response interfaces, field types |
| `<name>-filter-panel.ts` | Filter fields, period selectors |

Also reads shared files:
- `ChapterAwareDateAdapter` — chapter timezone date handling
- `DateFieldValidationUtility` — shared date validators
- `api.constants.ts` — API endpoint URLs

### Phase 3 — Research .NET API

Reads the API counterpart files:

| File | What Is Extracted |
|------|------------------|
| `<Feature>Controller.cs` | HTTP routes, chapter local date usage, validation calls |
| `<Feature>Validation.cs` | All validation rules, error codes returned |
| `<Feature>Repository.cs` | SQL query execution |
| `QueryScripts/<Feature>/` | Actual SQL — SELECT, INSERT, UPDATE, duplicate check, dropdown queries |

### Phase 4 — Gap Analysis

Compares Oracle vs Angular/API across four categories:

| Category | What Is Checked |
|----------|----------------|
| **Dropdown / LOV** | Same data source? Active-record filtering? Sort order? Cascading? Default value? |
| **Chapter / Timezone** | Chapter local date used? Dates validated against server time or chapter time? |
| **Field Validations** | Required flags match? Max lengths match? Format masks match? Cross-field validators? |
| **Business Logic** | Auto-calculated fields? Conditional enable/disable? Sort columns? Delete? Save sequence? |

Each gap is classified:

| Severity | Meaning |
|----------|---------|
| **High** | Functional gap — affects workflow or data quality (e.g., delete missing) |
| **Medium** | Partial implementation — doesn't block workflow (e.g., missing maxLength) |
| **Low** | Minor difference — often Angular is stricter than Oracle (improvement) |
| **Verified** | Feature confirmed correctly implemented in Angular |

### Phase 5 — Generate Gap Report PDF

Produces `docs/gap-analysis/<component>-gap-report.pdf`:
- Title block: Oracle form, Angular component, API controller, analysis date
- Summary table: Critical / High / Medium / Low / Total counts
- One colour-coded table per severity level (columns: # | Issue | Area | Current | Expected | Suggested Fix)
- Final section listing all verified features

### Phase 6 — Generate SDS Word Document

Produces `docs/SDS/<Feature Name> (SDS).docx` using the WellSky template.

All 13 SDS sections are filled automatically:

| # | Section | Content |
|---|---------|---------|
| 1 | Product/Functionality | Feature description |
| 2 | Scope | Bullet list of all capabilities |
| 3 | Graphical User Interface | Screen layout, all panels, states (loading/error/empty/data) |
| 4 | Fields | Field name, type, size, entry method, list value, base table/column |
| 5 | Command Buttons | Button name and what it does |
| 6 | Database Tables Used | API endpoints with method and description |
| 7 | Output Tables | Response model fields with data type and description |
| 8 | Internal Database Definitions | DB columns — data type, length, displayed, enterable |
| 9 | Exceptions and Error Messages | HTTP status codes + user-facing error codes |
| 10 | Business Components and Functions | Angular components, services, API classes, key methods |
| 11 | Security Resources | Auth scheme (JWT MultiAuth); feature-level resource IDs if defined |
| 12 | Limitations/Constraints | Known gaps, unsupported scenarios, design decisions |
| 13 | Additional Information | Date format, timezone behaviour, Oracle form reference |

---

## Output Files

| File | Path |
|------|------|
| Gap Report PDF | `docs/gap-analysis/<component-name>-gap-report.pdf` |
| SDS Word Document | `docs/SDS/<Feature Name> (SDS).docx` |
| Generator Script | `docs/SDS/_generate_sds.py` |

The generator script is kept so you can re-run it without re-invoking the skill:
```bash
python3 docs/SDS/_generate_sds.py
```

---

## Prerequisites

**Python packages** (install once):
```bash
pip install reportlab python-docx
```

**SDS template** must exist at:
```
docs/SDS/_templates/Software Design Specifications (SDS).docx
```

**FMB XML files** are stored in the API project:
```
BM.BloodCenters.API/Src/BM.BloodCenters.API/<mnemonic>_fmb.xml
```

---

## After Running

1. **Review the PDF** — share with the team to agree on gap priority.
2. **Open the DOCX in Word** — verify table formatting and section content.
3. **Create JIRA tickets** — use `/fda-510k-ticket` for High/Critical gaps.
4. **Commit the files:**
   ```bash
   git add docs/
   git commit -m "Add gap analysis and SDS for <component-name>"
   ```

---

## Screens Done So Far

| Oracle Form | Angular Component | JIRA | SDS | Gap Report |
|-------------|-------------------|------|-----|------------|
| VDIEPITO | hla-cross-reactive-groups | MLT-11030 | ✅ | ✅ |
| VDIHLAGR | hla-matching-grades | MLT-11031 | ✅ | ✅ |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: reportlab` | Run `pip install reportlab python-docx` |
| PDF text overflows columns | All table cells must use `Paragraph` objects, not plain strings — see `SKILL.md` |
| SDS template not found | Check `docs/SDS/_templates/Software Design Specifications (SDS).docx` exists |
| FMB XML not found | Search: `find . -iname "*<MNEMONIC>*_fmb.xml"` |
| Angular component not found | Run: `find src/app/modules -type d -name "*<name>*"` |
| JIRA ticket fetch fails | Complete the Atlassian OAuth flow when prompted; the skill works without JIRA too |
