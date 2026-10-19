---
name: fix-ado-tests
description: Fix failing test cases from an ADO build. Authenticates with ADO, fetches test failures, analyzes root causes, applies fixes, and generates a report. Usage - /fix-ado-tests <ado-build-url> <pat-token>
arguments: [build-url, pat]
argument-hint: [ado-build-url] [pat-token]
allowed-tools: Bash(curl *) Bash(git *)
disable-model-invocation: true
---

# Fix ADO Test Failures

Automated workflow to diagnose and fix test failures from an Azure DevOps build.

## Phase 1: Parse Input & Authenticate

### Extract Build ID

Parse `$build-url` to extract the `buildId` query parameter.

```
Example URL: https://dev.azure.com/mediwareis/BloodCenters/_build/results?buildId=2231923&view=logs
Extract: buildId = 2231923
```

Use these constants (project-specific):
- **ADO Org**: `mediwareis`
- **ADO Project**: `BloodCenters`
- **Base API URL**: `https://dev.azure.com/mediwareis/BloodCenters/_apis`

### Authenticate

If `$pat` is provided, use it. Otherwise, ask the user:

> I need an Azure DevOps Personal Access Token (PAT) with **Test Management (Read)** and **Build (Read)** permissions. Please provide your PAT token.

Create the auth header by base64-encoding `:$pat`:

```bash
AUTH=$(echo -n ":$pat" | base64)
# Use: -H "Authorization: Basic $AUTH"
```

Test authentication:

```bash
curl -s -H "Authorization: Basic $AUTH" \
  "https://dev.azure.com/mediwareis/BloodCenters/_apis/build/builds/$BUILD_ID?api-version=7.0" \
  | head -c 200
```

If authentication fails (401/403), ask the user to verify their PAT.

---

## Phase 2: Pull Latest Code

Sync the local repo with origin/Dev:

```bash
# Stash any local changes
git stash --include-untracked -m "fix-ado-tests: auto-stash before pull"

# Fetch and pull latest
git fetch origin Dev
git pull origin Dev

# Report current state
echo "HEAD: $(git log -1 --oneline)"
```

If there are merge conflicts, stop and ask the user to resolve them manually.

---

## Phase 3: Fetch Test Failures from ADO

### Step 3a: Get Test Runs for the Build

```bash
curl -s -H "Authorization: Basic $AUTH" \
  "$BASE_API/test/runs?buildUri=vstfs:///Build/Build/$BUILD_ID&api-version=7.0"
```

If this returns an empty `value` array, try the date-range fallback:

```bash
# Get build info to find the date
BUILD_INFO=$(curl -s -H "Authorization: Basic $AUTH" \
  "$BASE_API/build/builds/$BUILD_ID?api-version=7.0")

# Extract startTime, use it for date range query
curl -s -H "Authorization: Basic $AUTH" \
  "$BASE_API/test/runs?minLastUpdatedDate=$YESTERDAY&maxLastUpdatedDate=$TODAY&api-version=7.0"
```

Collect all test run IDs from the response.

### Step 3b: Get Failed Test Results

For each test run, fetch failed results:

```bash
curl -s -H "Authorization: Basic $AUTH" \
  "$BASE_API/test/runs/$RUN_ID/results?outcomes=Failed&api-version=7.0"
```

For each failed result, extract:
- `testCaseTitle` — the test name (e.g., "should call addFacilityIdentifier when form is valid")
- `errorMessage` — the assertion error or exception
- `stackTrace` — full stack trace with file paths and line numbers
- `automatedTestName` — fully qualified test name with spec file path

### Step 3c: Map Failures to Files

Parse `automatedTestName` to extract the spec file path. The format is typically:
```
ComponentName > describe block > test name
```

Search for the spec file using the component name:
```bash
# Example: find spec file for AddEditProcedureGroupComponent
find src -name "*procedure-group*.spec.ts" -type f
```

Create a structured list of failures grouped by file.

---

## Phase 4: Root Cause Analysis

Categorize each failure into one of these known patterns:

### Category 1: Hardcoded Past Dates (MOST COMMON)

**Symptoms:**
- Error contains "Expected spy ... to have been called" or "Expected true to be true"
- Stack trace shows `onSave()` returned early at `if (this.form.invalid) return;`
- Test sets `effectiveDate` or `terminationDate` to a hardcoded date string like `'2026-06-01'`
- The `effectiveDateNotPastValidator` or `terminationDateNotPastValidator` rejects the date

**How to confirm:**
1. Read the spec file and find the failing test
2. Check if it sets a date using `moment('YYYY-MM-DD')` or `new Date('YYYY-MM-DD')`
3. Check if that date is today or in the past
4. Check if the component uses `effectiveDateNotPastValidator` or `DateFieldValidationUtility.setupAddModeValidators()`

### Category 2: Cross-Field Date Validation Mismatch

**Symptoms:**
- Error contains "Expected '...' to contain 'Termination Date must be greater than'" but got "Termination Date cannot be past date"
- OR "Expected '...' to contain 'Effective Date must be less than'" but got "Effective Date cannot be in the past"
- Test is checking the date range error message but the past-date error fires first

**How to confirm:**
1. Test sets BOTH effective and termination dates
2. One or both dates are in the past
3. The test expects a range validation error message but gets a past-date error message
4. The error message priority in `DateFieldValidationUtility` puts past-date errors before range errors

### Category 3: TypeError on `.args[0]` or `.calls.mostRecent()`

**Symptoms:**
- `TypeError: Cannot read properties of undefined (reading 'args')`
- `TypeError: Cannot read properties of undefined (reading '0')`
- Happens on a line like `service.createXxx.calls.mostRecent().args[0]`

**How to confirm:**
- Same root cause as Category 1 — form invalid → `onSave()` returns early → service spy never called → `.calls.mostRecent()` is undefined

### Category 4: Import Errors

**Symptoms:**
- `Error: Cannot find module '...'`
- `Error: ... is not a known element`
- Module or component import path is wrong

### Category 5: API Contract Changes

**Symptoms:**
- `Expected object to equal/contain { ... }` with different property names or structure
- Test mocks return data in old format that component no longer expects

### Category 6: Other

Anything not matching the above patterns — investigate individually.

---

## Phase 5: Apply Fixes

### Fix for Category 1 & 3: Hardcoded Past Dates

For each affected spec file:

1. **Read the file** to understand context
2. **Identify the date pattern used**:
   - `moment('YYYY-MM-DD')` → replace with `moment().add(10, 'days')`
   - `new Date('YYYY-MM-DD')` → replace with `new Date(moment().add(10, 'days').format('YYYY-MM-DD'))`
   - `moment.utc('YYYY-MM-DD')` → replace with `moment.utc(moment().add(10, 'days').format('YYYY-MM-DD'))`
   - `effDate: 'YYYY-MM-DD'` (string) → replace with `effDate: moment().add(10, 'days').format('YYYY-MM-DD')`

3. **Decide replace scope**:
   - If ALL occurrences of the date in the file are for add-mode form values, use `replace_all`
   - If some occurrences are in edit-mode mock data (where `effectiveDate` field is disabled), do targeted edits using surrounding context to make the match unique
   - Edit-mode mock data typically uses `effDate:` (model property) not `effectiveDate:` (form field)

4. **Check for missing moment import**: If the file doesn't already `import moment from 'moment'`, add it at the top

5. **Fix assertions that reference the date string**: If `toHaveBeenCalledWith` or `toContain` checks the hardcoded date string, update to use `moment().add(10, 'days').format('YYYY-MM-DD')`

### Fix for Category 2: Cross-Field Date Validation

Both dates must be future but in wrong order to trigger the range error:
- **"Later" date** (the one that should be first but isn't): `moment().add(100, 'days')`
- **"Earlier" date** (the one that should be after but is before): `moment().add(10, 'days')`

Example: Testing "Effective Date must be less than Termination Date":
```typescript
// Set termination BEFORE effective (both future)
terminationDate: moment().add(10, 'days').toDate()   // earlier future date
effectiveDate: moment().add(100, 'days').toDate()     // later future date
// Now: effective > termination → range error fires (not past-date error)
```

### Fix for Category 4: Import Errors

- Read the error message to identify the missing module/component
- Search the codebase for the correct import path
- Add or fix the import statement

### Fix for Category 5: API Contract Changes

- Read the component source to understand the current expected API shape
- Update the test mock data and assertions to match
- Keep existing test intent (what behavior is being tested)

### Fix for Category 6: Other

- Read the failing test and component source
- Investigate the root cause
- Apply a targeted fix
- If the fix is non-obvious, add a brief comment explaining why

---

## Phase 6: Generate Fix Report

Create a markdown report at `.claude/test-fix-reports/build-{buildId}-fixes.md`:

```markdown
# Test Fix Report: Build {buildId}

**Date**: {today}
**Branch**: Dev
**Build URL**: {build-url}
**Total Tests**: {count from ADO}
**Failures Fixed**: {count}

## Summary

| Root Cause | Count | Fix Applied |
|---|---|---|
| Hardcoded past dates | N | Replaced with dynamic future dates |
| Cross-field date mismatch | N | Used future dates in wrong order |
| TypeError (form invalid) | N | Same as hardcoded dates fix |
| Import errors | N | Fixed import paths |
| API contract changes | N | Updated mocks/assertions |
| Other | N | Individual fixes |

## Files Modified

| # | File | Failures Fixed | Root Cause |
|---|------|----------------|------------|
| 1 | `src/app/.../file.spec.ts` | N | Category |
| ... | | | |

## Detailed Changes

### 1. `file.spec.ts` (N failures)

**Root Cause**: [description]

**Changes**:
- Replaced `moment('YYYY-MM-DD')` with `moment().add(10, 'days')` (N occurrences)
- Added `import moment from 'moment'`
- Updated assertion at line N

### 2. ...

## Verification

Run the following to verify all fixes:
\`\`\`bash
npx ng test --no-watch --browsers=ChromeHeadless
\`\`\`

Expected: 0 failures.

To test specific files:
\`\`\`bash
npx ng test --no-watch --browsers=ChromeHeadless --include=src/app/path/to/file.spec.ts
\`\`\`
```

Create the report directory if it doesn't exist:
```bash
mkdir -p .claude/test-fix-reports
```

---

## Post-Fix Steps

After all fixes are applied and the report is generated:

1. **Show the user a summary**: Total failures fixed, files modified, root cause breakdown
2. **Remind about git**: The changes are unstaged. The user should review with `git diff --stat` and commit when ready
3. **Pop stash if applicable**: If changes were stashed in Phase 2, remind the user to `git stash pop` after committing the fixes
4. **Link the report**: Tell the user where the fix report is saved

---

## Error Handling

- **ADO API returns 401/403**: PAT is invalid or expired. Ask user for a new one.
- **ADO API returns empty test runs**: Try the date-range fallback. If still empty, the build may not have published test results.
- **Git pull has conflicts**: Stop and ask the user to resolve manually.
- **Spec file not found**: The test may be in a different location than expected. Search broadly with glob.
- **Unknown failure pattern**: Flag it for manual investigation. Don't skip it — list it in the report as "needs manual review".

---

## Example Usage

```
/fix-ado-tests https://dev.azure.com/mediwareis/BloodCenters/_build/results?buildId=2231923 9QYPkNP6Te3tcCBuixc7dxHiJGWjR47vio8vgL2E4oRgqbiVUI0oJQQJ99CFACAAAAAAilrDAAASAZDO4bTw
```

Or without PAT (will be prompted):
```
/fix-ado-tests https://dev.azure.com/mediwareis/BloodCenters/_build/results?buildId=2231923
```
