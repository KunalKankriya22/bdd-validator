---
name: gap-analysis
description: Analyze Oracle Forms FMB files against Angular UI + .NET API to find feature gaps — dropdowns, validations, timezone/chapter, master screen impacts
---

# Oracle Forms → Angular Gap Analysis Skill

Performs a systematic comparison between legacy Oracle Forms (FMB) features and the modernized Angular UI + .NET API implementation. Identifies gaps in dropdowns/LOVs, field validations, chapter/timezone handling, and master screen impacts.

## Purpose

When migrating from Oracle Forms to Angular, critical features can be missed. This skill:
- Parses FMB file analysis (XML export, text extraction, or user description)
- Maps each Oracle Forms feature to its Angular/API equivalent
- Identifies missing, partial, or incorrect implementations
- Outputs a structured gap report for JIRA ticket creation

## Input Formats

Accept any of these inputs:
1. **FMB XML export file path** — parsed for blocks, items, triggers, LOVs, record groups
2. **Text-based FMB analysis** — manually extracted feature list
3. **Screen mnemonic / form name** — user provides the Oracle Forms name (e.g., `QCHISDTL`, `DONMAST`)
4. **Pasted FMB content** — user pastes block/trigger/LOV definitions directly
5. **JIRA ticket reference** — fetch epic/story with Oracle Forms mapping from JIRA

If no FMB input is provided, ask:
```
Which Oracle Forms screen would you like to analyze?
Provide one of:
- FMB XML export file path
- Screen mnemonic (e.g., DONMAST, QCHISDTL)
- Pasted block/item/trigger definitions
- JIRA epic key with Oracle Forms mapping (e.g., MLT-12420)
```

## Execution Steps

### Step 1: Parse Oracle Forms Definition

Extract the following from the FMB source:

#### 1a. Data Blocks
- Block name, base table, query data source
- WHERE clause filters (especially chapter-based filtering)
- ORDER BY clauses
- Master-detail relationships between blocks

#### 1b. Items (Fields)
For each item in each block, extract:
- Item name, data type, max length
- Required flag (REQUIRED property)
- LOV attached (LOV_NAME property)
- Default value (DEFAULT_VALUE)
- Format mask (FORMAT_MASK)
- Enabled/disabled state
- Canvas/tab page placement
- Calculation formula if any

#### 1c. LOVs (List of Values)
For each LOV:
- LOV name
- Record group (query source)
- Column mappings (return values)
- Filter conditions (WHERE clause — especially active record filtering)
- Auto-display/auto-select settings

#### 1d. Record Groups
For each record group:
- Query SQL
- Tables referenced (especially `VALID_MASTER_CODES`, master tables)
- Filter conditions for active records
- Chapter/timezone references

#### 1e. Triggers
Key triggers to examine:
- `WHEN-VALIDATE-ITEM` — field-level validations
- `WHEN-VALIDATE-RECORD` — cross-field validations
- `WHEN-NEW-FORM-INSTANCE` — initialization logic
- `WHEN-NEW-RECORD-INSTANCE` — defaults on new record
- `WHEN-NEW-BLOCK-INSTANCE` — block-level initialization
- `PRE-QUERY` / `POST-QUERY` — data filtering/transformation
- `ON-INSERT` / `ON-UPDATE` / `ON-DELETE` — DML operations
- `KEY-COMMIT` — save logic
- `WHEN-LIST-CHANGED` — dropdown change handlers
- `WHEN-CHECKBOX-CHANGED` — toggle handlers

#### 1f. Program Units (PL/SQL)
- Reusable procedures/functions
- Calls to database packages (e.g., `UTIL.LIFETRACK_TIMEZONE_CONVERT`)
- Validation procedures
- Business rule implementations

### Step 2: Identify Angular Counterpart

For the Oracle Forms screen, find the corresponding Angular component:

```bash
# Search by form mnemonic in route configs and component names
grep -ri "[FORM_MNEMONIC]" src/app/ --include="*.ts"

# Search in JIRA ticket conventions — epic summaries contain form names
# e.g., "Mnemonic (Menu API name) - [code] and .fmb file name - [filename]"

# Search route registry
read src/app/core/constants/route-registry.ts
read src/app/core/constants/fcn-route-map.ts

# Find the component
glob "src/app/modules/**/*[screen-name]*.component.ts"
```

Load the full component set:
```bash
read [component].component.ts
read [component].component.html
read [component].component.scss
glob "src/app/modules/**/[feature]/services/*.service.ts"
glob "src/app/modules/**/[feature]/models/*.ts"
glob "src/app/modules/**/[feature]/validators/*.ts"
```

### Step 3: Identify API Counterpart

Find corresponding API controller and services:

```bash
# In D:\Wellsky\BM.BloodCenters.API
grep -ri "[feature-name]" --include="*Controller.cs" D:/Wellsky/BM.BloodCenters.API/
grep -ri "[table-name]" --include="*.cs" D:/Wellsky/BM.BloodCenters.API/

# Load controller, service, repository, validation
read [Feature]Controller.cs
read [Feature]Service.cs
read [Feature]Repository.cs
read [Feature]Validation.cs
```

### Step 4: Perform Gap Analysis

Compare Oracle Forms features against Angular + API across these categories:

---

#### Category A: Dropdown / LOV Analysis

For each LOV in the Oracle Form:

1. **LOV Exists in Angular?**
   - Find the `<mat-select>` or autocomplete in the HTML template
   - Check if the same data source is used
   - Map Oracle Record Group query → Angular service method → API endpoint

2. **Active Record Filtering**
   - Oracle Forms LOV query: check for `EFF_DATE <= SYSDATE AND (TERM_DATE IS NULL OR TERM_DATE > SYSDATE)`
   - Angular: check for active filtering in service or component
   - API: check repository SQL for date-based filtering using `CHAPTER_LOCAL_DATE`

3. **Master Screen Impact**
   - Identify if LOV queries `VALID_MASTER_CODES` table
   - Check `CODE_TYPE` value used
   - Verify Angular uses `ValidMasterCodesService.getByCodeType()` with same code type
   - Check if master screen changes (add/edit/delete in admin) reflect in this LOV

4. **LOV Column Mapping**
   - Oracle LOV returns multiple columns → verify Angular dropdown displays correct columns
   - Check return value matches (code vs description vs ID)

5. **Auto-populate / Cascading**
   - Check if LOV selection auto-fills other fields (Oracle WHEN-LIST-CHANGED trigger)
   - Verify Angular has `(selectionChange)` handler doing same

6. **Default Selection**
   - Oracle DEFAULT_VALUE → Angular form default
   - Check WHEN-NEW-RECORD-INSTANCE for dynamic defaults

**Report each LOV gap as:**
```
| Issue | LOV [name] - [specific gap] |
| Severity | Critical / High / Medium / Low |
| Area | Dropdown/LOV |
| Current Behavior | [What Angular currently does] |
| Expected Behavior | [What Oracle Forms does that should be replicated] |
| Root Cause | [Why the gap exists — missing service, wrong query, etc.] |
| Suggested Fix | [Specific code change needed] |
```

---

#### Category B: Chapter / Timezone Analysis

1. **Chapter-Based Data Filtering**
   - Oracle PRE-QUERY: check for `:PARAMETER.CHAPTER_ID` in WHERE clause
   - Angular: verify API calls include `X-ChapterId` header
   - API: check controller uses `IUserContextService` to extract chapter

2. **Chapter Local Date Usage**
   - Oracle: `UTIL.LIFETRACK_TIMEZONE_CONVERT.get_local_time(:CHAPTER_ID, SYSDATE)`
   - API: `SharedServices.GetChapterLocalDateAsync(chapterId)`
   - Angular: `ChapterTimezoneService.getChapterLocalDate()`

3. **Date Display in Chapter Timezone**
   - Oracle FORMAT_MASK on date items
   - Angular: check date pipes, `convertUTCToTimezone()` usage
   - Verify dates shown in chapter's local timezone, not UTC or browser timezone

4. **Effective/Termination Date Filtering with Chapter Date**
   - Oracle: date comparisons use chapter local date
   - API: repository queries pass `chapterLocalDate` parameter
   - Angular: verify date comparisons use chapter-aware dates

5. **Timezone on Save**
   - Oracle ON-INSERT/ON-UPDATE: check if dates converted to GMT before save
   - API: verify `SharedServices.GetGmtDateAsync()` called before database write
   - Angular: verify dates sent in correct format

---

#### Category C: Field Validations

For each field with validation in Oracle Forms:

1. **Required Field Validation**
   - Oracle REQUIRED property = TRUE
   - Angular: `Validators.required` or `requiredTrimmedValidator()` in form builder
   - Check both are consistent

2. **Max Length Validation**
   - Oracle MAX_LENGTH property
   - Angular: `Validators.maxLength(n)` or `trimmedMaxLengthValidator(n)`
   - Verify same lengths

3. **Data Type Validation**
   - Oracle data type (NUMBER, DATE, VARCHAR2)
   - Angular: appropriate validator (`numericFieldValidator`, date validators, etc.)

4. **Format Mask Validation**
   - Oracle FORMAT_MASK
   - Angular: pattern validators, input masks, or custom validators

5. **WHEN-VALIDATE-ITEM Triggers**
   - Extract each validation from Oracle trigger PL/SQL
   - Map to Angular validator (shared validators in `shared/validators/input.validators.ts` or module-specific validators)
   - Check for missing validations

6. **Cross-Field Validations (WHEN-VALIDATE-RECORD)**
   - Oracle: record-level validations comparing multiple fields
   - Angular: form-level validators or custom cross-field validators
   - Common: effective date < termination date, conditional required fields

7. **Database-Level Validations**
   - Oracle: calls to PL/SQL packages for uniqueness, referential integrity
   - API: `ValidationBase` subclass checks (duplicate detection, FK validation)
   - Angular: async validators or server-side validation response handling

8. **Validation Error Messages**
   - Oracle: `MESSAGE()` or `RAISE FORM_TRIGGER_FAILURE` with error text
   - API: `ErrorStore.json` error codes
   - Angular: `<mat-error>` messages in template
   - Check messages match or are user-friendly equivalents

---

#### Category D: Business Logic & Behavior

1. **Calculated Fields**
   - Oracle: formula items or POST-CHANGE triggers
   - Angular: computed signals or valueChanges subscriptions

2. **Conditional Enable/Disable**
   - Oracle: SET_ITEM_PROPERTY('ITEM', ENABLED, PROPERTY_FALSE)
   - Angular: `[disabled]` binding or `control.disable()`

3. **Conditional Visibility**
   - Oracle: SET_ITEM_PROPERTY('ITEM', VISIBLE, PROPERTY_FALSE)
   - Angular: `*ngIf` or `[hidden]`

4. **Master-Detail Relationships**
   - Oracle: block coordination with master-detail links
   - Angular: parent component passing data to child, or tab-based navigation

5. **Record Navigation**
   - Oracle: EXECUTE_QUERY, NEXT_RECORD, PREVIOUS_RECORD
   - Angular: pagination, table navigation

6. **Commit/Save Logic**
   - Oracle KEY-COMMIT trigger: validation sequence, save order
   - Angular: form submit handler, API call sequence

---

### Step 5: Generate Gap Report

## Output Format

```markdown
# Gap Analysis Report: [Oracle Form Name] → [Angular Component]

**Oracle Form**: [form_name.fmb]
**Angular Component**: [component path]
**API Controller**: [controller path]
**Analysis Date**: [date]
**Analyzed By**: Claude Code Gap Analysis

---

## Executive Summary

- **Total Gaps Found**: X
- **Critical**: X | **High**: X | **Medium**: X | **Low**: X
- **Categories**: Dropdown/LOV: X | Timezone/Chapter: X | Validations: X | Business Logic: X

---

## Gap Details

### Critical Issues

| # | Issue | Severity | Area | Current Behavior | Expected Behavior | Root Cause | Suggested Fix |
|---|-------|----------|------|-----------------|-------------------|------------|---------------|
| 1 | [issue] | Critical | [area] | [current] | [expected] | [cause] | [fix] |

### High Severity Issues

| # | Issue | Severity | Area | Current Behavior | Expected Behavior | Root Cause | Suggested Fix |
|---|-------|----------|------|-----------------|-------------------|------------|---------------|
| 1 | [issue] | High | [area] | [current] | [expected] | [cause] | [fix] |

### Medium Severity Issues

| # | Issue | Severity | Area | Current Behavior | Expected Behavior | Root Cause | Suggested Fix |
|---|-------|----------|------|-----------------|-------------------|------------|---------------|
| 1 | [issue] | Medium | [area] | [current] | [expected] | [cause] | [fix] |

### Low Severity Issues

| # | Issue | Severity | Area | Current Behavior | Expected Behavior | Root Cause | Suggested Fix |
|---|-------|----------|------|-----------------|-------------------|------------|---------------|
| 1 | [issue] | Low | [area] | [current] | [expected] | [cause] | [fix] |
```

---

## Severity Definitions

| Severity | Definition | Examples |
|----------|-----------|----------|
| **Critical** | Data integrity risk, patient safety impact, or complete feature missing | Missing validation allowing invalid data save; timezone not applied causing wrong dates; LOV showing terminated/inactive records |
| **High** | Functional gap that affects user workflow or data quality | Missing cross-field validation; dropdown not filtered by chapter; cascading field update missing |
| **Medium** | Partial implementation or inconsistency that doesn't block workflow | Different max length than Oracle; missing format mask; default value not set |
| **Low** | Minor cosmetic or non-functional difference | Display format difference; field ordering; label text mismatch |

## Area Classifications

| Area | What It Covers |
|------|---------------|
| **Dropdown/LOV** | All dropdowns, autocompletes, list-of-values — data source, filtering, cascading, defaults |
| **Dropdown/LOV - Master Impact** | Dropdown sourced from master/admin screen — changes in master must reflect here |
| **Chapter/Timezone** | Chapter-based filtering, timezone conversion, chapter local date usage |
| **Field Validation** | Required, max length, format, data type, custom validations |
| **Cross-Field Validation** | Validations comparing multiple fields (date ranges, conditional required) |
| **Business Logic** | Calculated fields, conditional enable/disable, visibility rules, save logic |
| **Data Filtering** | Query filters, WHERE clause conditions, active record filtering |
| **Error Handling** | Error messages, error codes, user-friendly messaging |

---

## Reference: Key Project Paths

### Angular UI (D:\Wellsky\BM.BloodCenters.UI)
- Shared validators: `src/app/shared/validators/input.validators.ts`
- Chapter timezone service: `src/app/shared/services/chapter-timezone.service.ts`
- Master codes service: `src/app/shared/services/valid-master-codes.service.ts`
- Timezone utilities: `src/app/shared/date/timezone.util.ts`
- API constants: `src/app/core/constants/api.constants.ts`
- Validation constants: `src/app/core/constants/validation.constants.ts`
- Feature modules: `src/app/modules/[module-name]/`

### API (D:\Wellsky\BM.BloodCenters.API)
- Validation base: `Shared/Validation/ValidationBase.cs`
- Error store: `Shared/ErrorCode/ErrorStore.json`
- Shared services: `Shared/Services/SharedServices.cs`
- User context: `Shared/Services/UserContextService.cs`
- Feature modules: `Modules/[ModuleName]/`

### Oracle Forms Common Tables
- `DONSYS.VALID_MASTER_CODES` — master lookup table (CODE_TYPE + CODE + DESCRIPTION)
- `UTIL.VALID_ERRORS` — error message catalog
- `UTIL.LIFETRACK_TIMEZONE_CONVERT` — timezone conversion package

---

## Example Gap Entries

### Example 1: Missing Active Record Filter on Dropdown
```
| Issue | Product Code LOV shows terminated records |
| Severity | Critical |
| Area | Dropdown/LOV |
| Current Behavior | Angular dropdown loads all product codes from API without date filtering |
| Expected Behavior | Only show product codes where EFF_DATE <= chapter_local_date AND (TERM_DATE IS NULL OR TERM_DATE > chapter_local_date), matching Oracle Forms LOV_PRODUCT_CODE record group |
| Root Cause | API endpoint GET /api/v1/lookups/by-code-type/PRDCD does not filter by effective/termination dates |
| Suggested Fix | 1. API: Add chapterLocalDate parameter to repository query WHERE clause. 2. Angular: Ensure ChapterTimezoneService provides chapter date to the lookup call |
```

### Example 2: Missing Chapter Timezone on Date Display
```
| Issue | Collection date shown in UTC instead of chapter timezone |
| Severity | Critical |
| Area | Chapter/Timezone |
| Current Behavior | Date column in table displays raw UTC value from API response |
| Expected Behavior | Date should be converted to chapter's local timezone before display, matching Oracle Forms FORMAT_MASK with timezone-adjusted date |
| Root Cause | Component does not use convertUTCToTimezone() or ChapterTimezoneService for display dates |
| Suggested Fix | Apply timezone conversion pipe or use timezone.util.ts convertUTCToTimezone(date, chapterTimezone) before rendering in template |
```

### Example 3: Missing Cross-Field Validation
```
| Issue | Termination date allows value before effective date |
| Severity | High |
| Area | Cross-Field Validation |
| Current Behavior | Effective date and termination date validated independently — no cross-field check |
| Expected Behavior | Oracle Forms WHEN-VALIDATE-RECORD checks TERM_DATE >= EFF_DATE and raises FRM-40735 if violated |
| Root Cause | Angular form group has no cross-field validator; API ValidationBase.IsEffectiveDateBeforeTermDate() exists but frontend does not pre-validate |
| Suggested Fix | Add form-level validator: this.form.addValidators(termDateAfterEffDateValidator) and display error at form level |
```

### Example 4: Master Screen Impact on Dropdown
```
| Issue | Drive Type dropdown not reflecting new types added in System Administration |
| Severity | High |
| Area | Dropdown/LOV - Master Impact |
| Current Behavior | Drive Type dropdown uses cached values from ValidMasterCodesService; cache not invalidated when admin adds new drive type |
| Expected Behavior | Oracle Forms LOV re-queries VALID_MASTER_CODES on each LOV invocation; Angular should show newly added types without page reload |
| Root Cause | ValidMasterCodesService caches by CODE_TYPE in memory Map; no cache invalidation mechanism when master data changes |
| Suggested Fix | 1. Call ValidMasterCodesService.clearCache('DRVTY') on drawer/dialog open. 2. Or add a cache TTL to prevent stale data |
```

---

## Notes

- **FMB Binary Files**: Oracle Forms .fmb files are binary. This skill works with XML exports (File → Export → XML in Forms Builder), text extractions, or manual descriptions. If user only has .fmb binary, guide them to export as XML or describe the form features.
- **PLL Libraries**: Oracle Forms may reference shared PL/SQL libraries (.pll files). Ask user about shared library functions if triggers reference unknown procedures.
- **Object Libraries (.olb)**: Visual property classes may be inherited. These don't affect functional gaps but may explain visual differences.
- **Database Triggers**: Some validations may live in database triggers (not Forms triggers). Check API repository SQL scripts for table-level triggers.
- **Multi-Screen Forms**: Some .fmb files contain multiple canvases/windows. Treat each canvas as a separate Angular component for mapping purposes.
- When a gap is found, always check both the Angular component AND the API controller/validation — the fix may need to be applied at either or both layers.
- Cross-reference with existing `/validate-screen` checklist results if available.
- For JIRA ticket creation from gap results, use the `/fda-510k-ticket` command with the gap details.

## Example Usage

**Option 1: Provide FMB XML file**
```
User: /gap-analysis
Claude: Which Oracle Forms screen would you like to analyze?
User: Here's the XML export: D:/Wellsky/forms/QCHISDTL.xml
Claude: [parses XML, maps to Angular, generates gap report]
```

**Option 2: Provide screen mnemonic**
```
User: /gap-analysis DONMAST
Claude: Analyzing Oracle Forms DONMAST against Angular donor-master component...
       [searches codebase, generates gap report]
```

**Option 3: Paste FMB content**
```
User: /gap-analysis
Claude: Which Oracle Forms screen would you like to analyze?
User: [pastes block/item/trigger definitions]
Claude: [analyzes pasted content, generates gap report]
```

**Option 4: Reference JIRA epic**
```
User: /gap-analysis MLT-12420
Claude: Fetching epic MLT-12420 for Oracle Forms mapping...
       [reads epic, identifies form, generates gap report]
```
