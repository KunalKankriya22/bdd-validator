---
name: validate-screen
description: Validate screen from URL or component path against comprehensive quality checklist (10 sections covering chapter, dates, LOV, filters, pagination, errors, UI/UX, accessibility)
---

# Screen Validation Skill

Performs comprehensive validation of Angular screens against project quality standards.

## Purpose

Systematically validate screens to ensure:
- Consistent validation patterns across the application
- Proper chapter handling and filtering
- Correct date validations (effective/termination dates)
- Active records in dropdowns/LOVs
- Working filters with chips display
- Proper pagination implementation
- User-friendly error messages (no error codes)
- Good UI/UX patterns
- Accessible and responsive design

## Execution Steps

### 1. Identify Target Screen

Accept one of three inputs:
- **URL** (e.g., `http://localhost:4200/login` or `/donor-functions/donor-list`)
- **Component path** (e.g., `src/app/modules/donor-functions/donor-list/donor-list.component.ts`)
- **Component name** (e.g., `donor-list` - will search for it)

**If URL provided:**

1. Extract route path from URL:
   ```
   http://localhost:4200/donor-functions/donor-list → /donor-functions/donor-list
   http://localhost:4200/login → /login
   ```

2. Search for route configuration:
   ```bash
   # Find routing modules
   glob "src/app/**/*-routing.module.ts"
   
   # Search for the route path
   grep -r "path: 'donor-functions/donor-list'" src/app/ --include="*-routing.module.ts"
   grep -r "path: 'login'" src/app/ --include="*-routing.module.ts"
   ```

3. Extract component name from route:
   ```typescript
   // Found in routing file:
   { path: 'donor-list', component: DonorListComponent }
   → Component: DonorListComponent
   ```

4. Find component file:
   ```bash
   glob "src/app/**/donor-list.component.ts"
   ```

**If component path provided:**
- Use directly

**If component name provided:**
- Search: `glob "src/app/**/*[name]*.component.ts"`

### 2. Load Required Files

```bash
# Component files
read [component].component.ts
read [component].component.html
read [component].component.scss (if needed)

# Related service
glob "src/app/**/services/*[feature]*.service.ts"

# Related models/interfaces
glob "src/app/**/models/*[feature]*.interface.ts"
```

### 3. Validate Against Checklist

For each section below, provide:
- ✅ PASS / ❌ FAIL / ⚠️ PARTIAL / ❓ CANNOT_VERIFY
- Line numbers where issues found
- Specific recommendations

---

## Section 1: Chapter Validation

**Check:**

1. **Chapter Scope Determination**
   - Search for chapter-related properties/inputs
   - Check if component handles single vs. multiple chapters
   - Look for: `selectedChapter`, `chapterFilter`, `chapterId`

2. **Chapter Filter Implementation**
   - Verify filter exists in template (dropdown/selector)
   - Check filter binding: `[(ngModel)]`, `[formControl]`
   - Verify filter triggers data reload

3. **Data Scoping**
   - Check API calls include chapter parameter
   - Verify: `params: { chapterId: ... }`
   - Look for chapter filtering in service methods

4. **Chapter Switching**
   - Check for `ngOnChanges` or reactive subscription
   - Verify data reloads on chapter change
   - Look for: `.pipe(switchMap(chapter => ...))` pattern

5. **Business Rules**
   - Search for chapter-specific validation logic
   - Check for conditional rules based on chapter

**Report Format:**
```markdown
### 1. Chapter Validation

✅ **Chapter Scope**: Single chapter mode (line 45)
⚠️ **Chapter Filter**: Filter exists but no visual indication (line 123)
   - Recommendation: Add label "Chapter:" before dropdown
❌ **Data Scoping**: API call missing chapter parameter (line 234)
   - Fix: Add `chapterId: this.selectedChapter` to params
✅ **Chapter Switching**: Properly implemented with switchMap (line 89)
❓ **Business Rules**: Cannot verify - no chapter-specific rules found
```

---

## Section 2: Effective Date & Termination Date Validations

**Check:**

1. **Effective Date >= System Date**
   - Search for: `effectiveDate`, `startDate`
   - Look for validator: `Validators.min()`, custom validator
   - Check: `new Date()` comparison
   - Line reference example: `effectiveDate: ['', [DateValidators.notPastDate]]`

2. **Termination Date >= Effective Date**
   - Search for: `terminationDate`, `endDate`
   - Look for cross-field validation
   - Check: `this.form.get('terminationDate')?.value >= this.form.get('effectiveDate')?.value`

3. **Date Format: Keyboard (MMDDYYYY)**
   - Check input mask or formatter
   - Look for: `DateFieldValidationUtility`
   - Verify: `mask="99/99/9999"` or custom formatter

4. **Date Format: Slash (MM/DD/YYYY)**
   - Check if slash input is parsed correctly
   - Look for moment parsing: `moment(value, ['MMDDYYYY', 'MM/DD/YYYY'])`

5. **Error Persistence on Blur**
   - Check template for `(blur)` handlers
   - Verify validation runs on blur: `updateOn: 'blur'`
   - Check error display: `*ngIf="field.touched && field.invalid"`

6. **Date Picker Works**
   - Search for: `<mat-datepicker>`, `<atlas-datepicker>`
   - Verify datepicker reference binding

7. **Display Format: DD-MMM-YYYY**
   - Check pipe usage: `| date:'dd-MMM-yyyy'`
   - Look for: `DateFieldValidationUtility.format()`

8. **Error Messages Clear**
   - Check error messages in template
   - Verify: No "Err:xxxxx" codes
   - Look for: `<mat-error>` blocks

**Report Format:**
```markdown
### 2. Effective Date & Termination Date Validations

✅ **Effective Date >= System**: Custom validator present (line 67)
❌ **Termination >= Effective**: Missing cross-field validation
   - Fix: Add validator comparing dates
⚠️ **Keyboard Format**: Partially implemented (line 145)
   - Recommendation: Use DateFieldValidationUtility.formatInput()
✅ **Slash Format**: Moment parsing handles both formats (line 156)
❌ **Error Persistence**: Validation runs on submit only (line 234)
   - Fix: Change to `updateOn: 'blur'`
✅ **Date Picker**: Atlas datepicker correctly bound (line 89)
❌ **Display Format**: Using MM/DD/YYYY instead of DD-MMM-YYYY (line 301)
   - Fix: Change pipe to `| date:'dd-MMM-yyyy'`
✅ **Error Messages**: No error codes found
```

---

## Section 3: Active Records for LOV/Dropdowns

**Check:**

1. **Active Records Only**
   - Search for dropdown data sources
   - Look for: `.filter(item => item.isActive)`
   - Check service methods for active flag filtering

2. **API Filtering**
   - Check API call parameters: `active: true`
   - Look for: `getActiveRecords()` methods

3. **Date Range Filtering**
   - Check for effective/termination date filtering
   - Look for: `new Date() between effectiveDate and terminationDate`

4. **Handle No Active Records**
   - Check for empty state handling
   - Look for: `*ngIf="options.length === 0"` message

**Report Format:**
```markdown
### 3. Active Records for LOV/Dropdowns

❌ **Active Filtering**: Dropdowns pull all records (line 123)
   - Fix: Add `.filter(item => item.isActive)` to dropdown data
⚠️ **API Filtering**: Some APIs filter, others don't
   - service.getDonorTypes() ✅ filters (service line 45)
   - service.getErrorCodes() ❌ missing filter (service line 89)
❌ **Date Range Filtering**: Not implemented
   - Fix: Filter by current date between effective/termination
❓ **No Records Handling**: Cannot verify - need to test empty state
```

---

## Section 4: Filters

**Check:**

1. **Toggle Button**
   - Search for filter toggle logic
   - Look for: `showFilters`, `filtersExpanded`, `(click)="toggleFilters()"`

2. **Filter Chips Display**
   - Search for chips component
   - Look for: `<mat-chip-list>`, `<atlas-chip>`
   - Verify chips show active filters

3. **Remove Individual Chip**
   - Check chip remove handler: `(removed)="removeFilter($event)"`
   - Verify data refreshes after removal

4. **Clear All**
   - Look for "Clear All" button
   - Check: `clearAllFilters()` method
   - Verify all filters reset

5. **Filter State Persistence**
   - Check if filters remain when toggling panel
   - Look for filter state storage

6. **Data Update on Filter Change**
   - Check for reactive pattern: `.pipe(debounceTime(300), switchMap(...))`
   - Verify subscription to filter changes

7. **Reset on Navigation**
   - Check `ngOnDestroy()` for cleanup
   - Look for route change handlers

8. **Filter Logic (AND/OR)**
   - Verify how multiple filters combine
   - Check backend API parameter structure

9. **Responsive Chips**
   - Check CSS for chip container
   - Look for: `flex-wrap`, `overflow` handling

**Report Format:**
```markdown
### 4. Filters

✅ **Toggle Button**: Properly implemented (line 234)
❌ **Filter Chips**: Chips not displayed in template
   - Fix: Add chip display component in controls area
❌ **Remove Chip**: No individual remove functionality
   - Fix: Add (removed) handler to chips
⚠️ **Clear All**: Button exists but doesn't reset pagination (line 456)
   - Fix: Call `resetPagination()` in `clearAllFilters()`
✅ **State Persistence**: Filters stored in component property
✅ **Data Update**: Uses debounceTime + switchMap (line 123)
❓ **Navigation Reset**: Cannot verify without checking routing
✅ **AND/OR Logic**: Multiple filters combined with AND
❌ **Responsive**: Chips may overflow on mobile
   - Fix: Add `flex-wrap: wrap` to chip container
```

---

## Section 5: Pagination

**Check:**

1. **Default Page Size = 25**
   - Search for: `pageSize`, `itemsPerPage`
   - Verify default: `pageSize = 25`

2. **Page Size Options: 25, 50, 100**
   - Look for: `pageSizeOptions`, `[25, 50, 100]`

3. **Navigation (Prev/Next)**
   - Check paginator component: `<mat-paginator>`, `<atlas-paginator>`
   - Verify binding: `(page)="onPageChange($event)"`

4. **Total Record Count**
   - Check if total count is displayed
   - Look for: `[length]="totalRecords"`

5. **Persist During Filters**
   - Check if pagination state maintained when filters change
   - OR check if reset to page 1 (preferred)

6. **Reset on Filter Change**
   - Look for: `this.pageIndex = 0` in filter handler

7. **Handle Edge Cases**
   - Check for empty state: `totalRecords === 0`
   - Check for single page: `totalRecords <= pageSize`

**Report Format:**
```markdown
### 5. Pagination

❌ **Default Page Size**: Set to 10 instead of 25 (line 67)
   - Fix: Change to `pageSize = 25`
✅ **Page Size Options**: Correctly set [25, 50, 100] (line 68)
✅ **Navigation**: Mat-paginator properly bound (line 456)
⚠️ **Total Count**: Displayed but not updated after delete (line 234)
   - Fix: Refresh count after delete operation
❌ **Reset on Filter**: Pagination NOT reset when filters change (line 345)
   - Fix: Add `this.pageIndex = 0` to filter change handler
✅ **Edge Cases**: Empty state handled correctly (line 123)
```

---

## Section 6: Error Messages

**Check:**

1. **No Error Codes**
   - Grep for error code patterns: `Err:`, `Error:`, `ERR-`
   - Search template and TypeScript files
   - Command: `grep -r "Err:" [component-dir]`

2. **User-Friendly Messages**
   - Review all error message strings
   - Check for technical jargon
   - Verify messages explain WHAT and HOW to fix

3. **Correct Location**
   - Check template: errors below fields
   - Look for: `<mat-error>` inside `<mat-form-field>`

4. **Required Field Messages**
   - Check consistency: "This field is required" vs variations
   - Verify all required fields have message

5. **Format Validation Messages**
   - Check date format errors are descriptive
   - Example: "Date must be in MM/DD/YYYY format"

6. **Business Rule Messages**
   - Check constraint messages explain the rule
   - Example: "Termination date must be after effective date"

7. **Error Styling**
   - Verify red color applied: `color: red`, Material error classes
   - Check for: `.mat-form-field-invalid`

**Report Format:**
```markdown
### 6. Error Messages

❌ **Error Codes Present**: Found 3 instances
   - Line 234: "Err:16206: Invalid date format"
   - Line 456: "Err:12011: Required field"
   - Line 567: "Error:404: Record not found"
   - Fix: Remove error codes, use plain messages
⚠️ **User-Friendly**: Some messages use technical terms
   - Line 345: "FK constraint violation" → "This record is in use"
✅ **Correct Location**: Errors properly placed below fields
❌ **Required Field Consistency**: Mixed messages
   - Some say "Required", others "This field is required"
   - Fix: Standardize to "This field is required"
✅ **Format Messages**: Date validation messages are clear
✅ **Business Rules**: Constraint messages explain rules well
✅ **Error Styling**: Material error classes applied correctly
```

---

## Section 7: General UI/UX

**Check:**

1. **Drawer/Dialog Opens**
   - Look for: `<mat-drawer>`, `<mat-dialog>`, component overlay
   - Check open trigger: `(click)="openDrawer()"`

2. **Positioned Below Header**
   - Check CSS: `top`, `margin-top`, `position`
   - Verify no `position: fixed` overlapping header

3. **Close Button Works**
   - Look for close button/icon in template
   - Check handler: `(click)="close()"`, `mat-dialog-close`

4. **Form Validation Prevents Submit**
   - Check submit button: `[disabled]="form.invalid"`
   - Look for: `if (this.form.invalid) return;`

5. **Success Snackbar**
   - Search for: `NotificationService`, `MatSnackBar`
   - Look for success message after save

6. **Error Snackbar**
   - Check error handling in subscribe error callback
   - Look for: `showError()`, `openSnackBar('error')`

7. **Loading States**
   - Search for: `isLoading`, `loading$`, `<mat-spinner>`
   - Check if shown during API calls

8. **Table Columns**
   - Review column widths in template
   - Check alignment: `text-align: left/right/center`

9. **Responsive Behavior**
   - Check for media queries in SCSS
   - Look for: `@media`, responsive classes

10. **Search Functionality**
    - Look for search input: `<input type="search">`
    - Check debounce: `.pipe(debounceTime(300))`

**Report Format:**
```markdown
### 7. General UI/UX

✅ **Drawer Opens**: Mat-drawer properly configured (line 234)
❌ **Positioned Below Header**: Uses position: fixed, may overlap (line 45 SCSS)
   - Fix: Change to `position: absolute` or add `top: 64px`
✅ **Close Button**: Working with mat-dialog-close (line 456)
⚠️ **Validation Prevents Submit**: Button disabled but no form.invalid check in method
   - Recommendation: Add guard in onSubmit() method
✅ **Success Snackbar**: Shows after successful save (line 345)
✅ **Error Snackbar**: Shows in error callback (line 367)
❌ **Loading States**: No loading spinner shown during API call
   - Fix: Add isLoading flag and spinner component
⚠️ **Table Columns**: Some columns too narrow for content
   - Recommendation: Increase width of "Description" column
❓ **Responsive**: No media queries found - test manually
✅ **Search**: Properly debounced (line 123)
```

---

## Section 8: Data Table

**Check:**

1. **Sticky Headers**
   - Look for: `.mat-header-row { position: sticky; }`
   - Check: `sticky: true` in column definitions

2. **Sticky Actions Column**
   - Look for: `.actions-column { position: sticky; right: 0; }`
   - Check z-index for proper layering

3. **Sorting**
   - Look for: `matSort`, `mat-sort-header`
   - Check binding: `(matSortChange)="sortData($event)"`

4. **Row Selection**
   - If applicable: `<mat-checkbox>` in rows
   - Check selection model: `SelectionModel`

5. **Edit Opens Drawer**
   - Check edit button: `(click)="edit(row)"`
   - Verify correct data passed to drawer/dialog

6. **Delete with Confirmation**
   - Look for confirmation dialog before delete
   - Check: `openConfirmDialog()`, `MatDialog`

7. **Empty State**
   - Look for: `*ngIf="data.length === 0"` with message
   - Check message is helpful

8. **Loading State**
   - Look for: `<mat-spinner>` or skeleton loader
   - Check: `*ngIf="isLoading"`

**Report Format:**
```markdown
### 8. Data Table

✅ **Sticky Headers**: Properly configured (line 234 SCSS)
❌ **Sticky Actions**: Not sticky, scrolls with table
   - Fix: Add sticky positioning to actions column
✅ **Sorting**: MatSort properly bound (line 123)
❓ **Row Selection**: Not applicable for this screen
✅ **Edit Opens Drawer**: Correctly passes row data (line 345)
⚠️ **Delete Confirmation**: Dialog shown but unclear message
   - Recommendation: Add record details to confirmation
✅ **Empty State**: "No records found" message shown (line 456)
✅ **Loading State**: Spinner shown during fetch (line 89)
```

---

## Section 9: Form Validation (Add/Edit)

**Check:**

1. **Required Fields Marked**
   - Look for: `<span class="required">*</span>` or Material required indicator
   - Check: `Validators.required`

2. **Required Validation on Blur**
   - Check: `updateOn: 'blur'` in FormControl
   - OR check template: `(blur)="validate()"`

3. **Prevents Form Submission**
   - Check: `if (this.form.invalid) return;` in onSubmit
   - Check: `[disabled]="form.invalid"` on button

4. **Field-Level Validation**
   - Check individual field validators: `Validators.email`, `Validators.maxLength`
   - Look for custom validators

5. **Form-Level Validation**
   - Check: `this.form.setErrors()` for cross-field validation
   - Look for custom form validators

6. **Duplicate Record Validation**
   - If applicable: check for uniqueness validation
   - Look for API call: `checkDuplicate()`

7. **Max Length Validation**
   - Check: `Validators.maxLength(n)` on text fields
   - Check template: `maxlength` attribute

8. **Special Character Validation**
   - If applicable: check for pattern validators
   - Look for: `Validators.pattern()`

**Report Format:**
```markdown
### 9. Form Validation (Add/Edit)

✅ **Required Fields Marked**: All required fields have red asterisk
❌ **Validation on Blur**: Validation only runs on submit (line 234)
   - Fix: Change FormGroup config to `updateOn: 'blur'`
✅ **Prevents Submission**: Guard in onSubmit method (line 345)
✅ **Field-Level Validation**: Email, max length validators present
⚠️ **Form-Level Validation**: Cross-field validation exists but error not displayed
   - Fix: Add error display for form-level errors
❓ **Duplicate Validation**: Not applicable for this form
✅ **Max Length**: All text fields have maxLength validator
❌ **Special Characters**: Name field allows special chars that shouldn't be allowed
   - Fix: Add pattern validator for alphanumeric only
```

---

## Section 10: Accessibility

**Check:**

1. **Proper Labels**
   - Check: `<label for="fieldId">` or Material labels
   - Verify all form fields have labels

2. **Error Association**
   - Check: `aria-describedby` linking errors to fields
   - Material automatically handles this

3. **Logical Tab Order**
   - Check template order matches visual order
   - Check for: `tabindex` overrides

4. **Visible Focus States**
   - Check: `:focus` styles in SCSS
   - Material provides default focus

5. **Screen Reader Text**
   - Look for: `aria-label`, `sr-only` classes
   - Check icon buttons have accessible names

**Report Format:**
```markdown
### 10. Accessibility

✅ **Proper Labels**: All fields have labels via Material
✅ **Error Association**: Material handles aria-describedby
⚠️ **Tab Order**: Visual order doesn't match DOM order (line 234)
   - Recommendation: Reorder template to match visual layout
✅ **Focus States**: Material focus styles applied
❌ **Screen Reader Text**: Icon buttons missing aria-labels (lines 123, 145, 167)
   - Fix: Add aria-label to all icon buttons
```

---

## Final Output Format

```markdown
# Screen Validation Report: [Component Name]

**Component**: [path]
**Validated**: [timestamp]

## Summary

- ✅ **Passed**: X checks
- ⚠️ **Partial**: Y checks (needs improvement)
- ❌ **Failed**: Z checks (must fix)
- ❓ **Cannot Verify**: W checks (needs manual testing)

## Critical Issues (Must Fix)

1. [Issue from checklist with line number and fix]
2. [Issue from checklist with line number and fix]

## Improvements Recommended

1. [Recommendation with line number]
2. [Recommendation with line number]

## Detailed Results

[All 10 sections with detailed findings]

## Next Steps

1. Fix all ❌ Failed checks
2. Address ⚠️ Partial checks  
3. Manually test ❓ Cannot Verify items
4. Re-run `/validate-screen` after fixes
```

---

## Notes

- **URL mapping**: If route not found in routing modules, ask user for component name
- **Lazy-loaded routes**: Check both main routing and module-specific routing files
- **Route parameters**: Handle dynamic routes (e.g., `/donor/:id` from `/donor/123`)
- If component not found, help user search for it
- If related files missing, note in report
- Focus on most critical issues first
- Provide specific line numbers and fixes
- Reference CLAUDE.md and `.claude/coding-standards.md` patterns
- If manual testing needed, clearly state it
- Keep report concise but actionable

**Common URL patterns in this project:**
- `/login` → LoginComponent
- `/donor-functions/donor-list` → DonorListComponent
- `/laboratory-functions/*` → Lab module components
- `/system-administration/*` → System admin components

---

## Example Usage

**Option 1: Provide URL**
```
User: /validate-screen
Claude: Which screen would you like to validate? (URL, component path, or component name)
User: http://localhost:4200/donor-functions/donor-list
Claude: Found route /donor-functions/donor-list → DonorListComponent
       Loading src/app/modules/donor-functions/donor-list/donor-list.component.ts
       [performs validation, outputs detailed report]
```

**Option 2: Provide Component Name**
```
User: /validate-screen
Claude: Which screen would you like to validate? (URL, component path, or component name)
User: donor-list
Claude: Found: src/app/modules/donor-functions/donor-list/donor-list.component.ts
       [performs validation, outputs detailed report]
```

**Option 3: Provide Full Path**
```
User: /validate-screen
Claude: Which screen would you like to validate? (URL, component path, or component name)
User: src/app/modules/donor-functions/donor-list/donor-list.component.ts
Claude: [performs validation, outputs detailed report]
```

**Quick Usage (provide screen directly)**
```
User: /validate-screen http://localhost:4200/login
Claude: [finds LoginComponent, performs validation, outputs report]
```
