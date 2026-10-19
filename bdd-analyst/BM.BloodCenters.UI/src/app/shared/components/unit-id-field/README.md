# Unit ID Field — Shared Component

## What Is This?

A drop-in Angular standalone component that handles **everything** about unit ID entry:
- Calls the BE validation API (`POST /api/v1/donor-lib/validate-unit`)
- Detects ISBT vs Codabar, scan vs manual — all done by BE
- Shows appropriate hints ("Validating...", "Valid ISBT unit", "Re-enter to confirm")
- Shows error messages from BE ("Invalid Collection ID", "Invalid Unit ID", etc.)
- Handles Codabar manual double-entry (no check digit → user must type twice)
- Formats ISBT unit IDs with spaces for readability ("W8052 26 123456 -B")
- Reverts to raw input on focus, re-validates on blur
- Blurs field on Enter key press

You don't write any validation logic. You drop the component in and wire 3 things.

---

## Quick Start — Minimum Integration

### 1. Import the component

```typescript
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
```

Add to your component's `imports` array:

```typescript
@Component({
  standalone: true,
  imports: [
    // ... other imports
    UnitIdFieldComponent
  ]
})
```

### 2. Add to your template

```html
<app-unit-id-field
  [validateFfValue]="'DONOR'"
  (validated)="onUnitValidated($event)"
  (cleared)="onUnitCleared()"
  class="your-width-class"
/>
```

### 3. Handle in your component

```typescript
@ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

onUnitValidated(data: UnitValidationResponse): void {
  // Unit is valid. data contains parsedUnitId, checkDigit, etc.
}

onUnitCleared(): void {
  // Unit field was reset/cleared
}

onSave(): void {
  if (!this.unitIdField.isValid) return;

  const unitIdForApi = this.unitIdField.parsedUnitId;  // ← use this for your save API
  // ... call your save endpoint with unitIdForApi
}

onClearAll(): void {
  this.unitIdField.clear();  // ← programmatic reset
  // ... clear your other form fields
}
```

### 4. Save button disabled state

```html
<button [disabled]="!unitIdField?.isValid || yourForm.invalid">SAVE</button>
```

That's it. All validation, hints, errors, double-entry, formatting — handled.

---

## What Is `validateFfValue`?

This is a **screen-specific** value. In legacy Oracle Forms, each FMB screen set `GLOBAL.validate_ff_value` before calling the shared library `validate_unit_id_coexist`. The shared library itself defaults to `'N'` (donorlib.pld L3616: `default_value('N','GLOBAL.validate_ff_value')`). Screens that wanted FF validation explicitly set it to `'DONOR'`.

**How to decide:** Check the legacy FMB screen you're modernizing. Look for:
```
:GLOBAL.validate_ff_value := 'DONOR'
```
If found → use `'DONOR'`. If not found → use `'N'` (the library default).

| Value | FF Check | Legacy FMB Screens |
|-------|----------|-------------------|
| `'DONOR'` | ON — validates FF against `VALID_FF_VALUES` | 22 screens: DRIREGIS, DRUREGIS, DRUAUDIT, DNWDFIND, DRIVISNU, DSGTUMGR, MCISRCEN, MCIFORM4, LAICDISB, SDILUNIT, and 12 others |
| `'N'` | OFF — skips FF | 140+ screens: FRIDONOR, LTICHKIN, PTICHKIN, CPICHECK, CPICOMP, IMCHKIN, all CPI/LTI/IMI screens, all query screens, libraries (SBCLIB, SRVLIB) |

**Note:** `validateFfValue` controls the Facility Flag (FF) check only. `'DONOR'` enables FF validation against the `VALID_FF_VALUES` table. `'N'` skips it entirely.

**Rule of thumb:**
- Processing donor blood units with strict validation → `'DONOR'`
- Query/search/lookup/audit screens → `'N'`
- Unsure → check the legacy FMB or default to `'N'` (matches legacy library default)

---

## What Is `parsedUnitId`?

The BE returns several fields. Here's what each means and when to use it:

| Field | Example | What It Is | When To Use |
|-------|---------|------------|-------------|
| `parsedUnitId` | `"W805226123456"` (ISBT, 13ch) or `"KJ12345"` (Codabar, 7ch) | The canonical unit ID for DB lookup | **Always use this for your save/process API call** |
| `manualUnitId` | `"W805226123456-B"` (ISBT) or `"KJ12345"` (Codabar) | What the user would type manually = display format | Shown in the field automatically by the component |
| `checkDigit` | `"-B"` (ISBT) or `null` (Codabar) | The check digit character | Rarely needed — component handles display |
| `entryMode` | `"S"` or `"M"` | Scan or Manual — detected by BE | Component uses internally for double-entry |
| `barcodeType` | `"CODE128"` or `"CODABAR"` | Which barcode format | Component uses internally for formatting |

**For your save API:** Always pass `this.unitIdField.parsedUnitId`. Never pass the display value from the field.

---

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `validateFfValue` | `string` | `'N'` | Screen-specific: `'DONOR'` or `'N'` (see above). Defaults to `'N'` matching legacy library default. Screens that want FF checks must explicitly pass `'DONOR'`. |
| `label` | `string` | `'Unit ID'` | The mat-label text inside the field |
| `placeholder` | `string` | `''` | Placeholder text |
| `required` | `boolean` | `true` | Whether the field is required |
| `hintDefault` | `string` | `'Scan or type'` | Hint text when field is idle |
| `hintValid` | `string \| null` | `null` | Hint text when valid. `null` = auto ("Valid ISBT/Codabar unit"), `''` = no hint, `'custom text'` = show that |
| `requirePostValidation` | `boolean` | `false` | When `true`, the component always waits for `confirm()`/`reject()` via `postValidate` before marking valid — even if `postValidate.observed` returns `false`. Use this when the component is rendered inside a data table cell template or `*ngTemplateOutlet`, where Angular's output subscription detection may not work reliably. See [Data Table Usage](#data-table-usage) below. |

## Outputs

| Output | Type | When It Fires |
|--------|------|---------------|
| `validated` | `UnitValidationResponse` | Validation succeeds (including after double-entry confirmation and postValidate confirm) |
| `cleared` | `void` | Field is programmatically cleared via `clear()` |
| `postValidate` | `UnitIdPostValidateEvent` | After BE format validation passes, BEFORE marking valid. See below. |

### `postValidate` — Chaining a Second Validation

Some screens need to run a **second API call** after the unit ID format is validated — for example, checking if the unit is eligible for processing, not already interfaced, etc.

If `(postValidate)` is bound, the component stays in `"Validating..."` state after BE returns success. It waits for the parent to call `confirm()` or `reject()`.

If `(postValidate)` is NOT bound, the component marks valid immediately (default behavior).

```html
<app-unit-id-field
  [validateFfValue]="'DONOR'"
  (postValidate)="onPostValidate($event)"
  (validated)="onUnitValidated($event)"
/>
```

```typescript
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field';

onPostValidate(event: UnitIdPostValidateEvent): void {
  // event.data = UnitValidationResponse from BE (format is valid)
  // Now run your screen-specific check:
  this.apiService.verifyUnit(event.data.parsedUnitId).subscribe({
    next: (result) => {
      if (result.eligible) {
        event.confirm();   // → component marks valid, shows green hint, emits (validated)
      } else {
        event.reject('Unit already interfaced');  // → component shows this as error
      }
    },
    error: () => event.reject('Verification failed')
  });
}
```

**What the user sees:**
```
Without postValidate:  "Validating..." → "Valid ISBT unit"
With postValidate:     "Validating..." → (parent checks) → "Valid ISBT unit" OR error
No flash of green-then-red. Clean UX.
```

## Public Methods & Properties

| Member | Type | Description |
|--------|------|-------------|
| `clear()` | method | Programmatic reset — call from your CLEAR ALL button |
| `isValid` | `boolean` | Whether the field currently holds a validated unit ID |
| `parsedUnitId` | `string \| null` | The canonical unit ID for DB lookup |
| `parsedUnitData` | `UnitValidationResponse \| null` | Full validation response (all fields) |
| `validationState` | `string` | Current state: `'idle'`, `'validating'`, `'valid'`, `'invalid'` |

---

## Full Example — Screen With Unit ID

```typescript
@Component({
  selector: 'app-my-screen',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    UnitIdFieldComponent
  ],
  template: `
    <div class="form-wrapper">
      <app-unit-id-field
        [validateFfValue]="'DONOR'"
        [placeholder]="'Scan or type unit ID'"
        (validated)="onUnitValidated($event)"
        class="unit-field"
      />

      <!-- Your other form fields -->
      <mat-form-field>
        <mat-label>Some other field</mat-label>
        <input matInput formControlName="otherField" />
      </mat-form-field>

      <button mat-raised-button
        [disabled]="!unitIdField?.isValid"
        (click)="onSave()">
        SAVE
      </button>

      <button mat-button (click)="onClear()">CLEAR</button>
    </div>
  `,
  styles: [`
    .unit-field {
      width: 300px;
    }
  `]
})
export class MyScreenComponent {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  onUnitValidated(data: UnitValidationResponse): void {
    console.log('Valid unit:', data.parsedUnitId, data.barcodeType);
  }

  onSave(): void {
    const unitId = this.unitIdField.parsedUnitId!;
    // call your save API with unitId
  }

  onClear(): void {
    this.unitIdField.clear();
  }
}
```

---

## Styling & Layout

The component renders a `<mat-form-field>` with `appearance="fill"`. It does **not** set its own width — the parent controls that.

### Setting width

```html
<!-- Via CSS class -->
<app-unit-id-field class="my-field-width" />
```

```scss
.my-field-width {
  width: 300px;
}
```

### Parent CSS overriding component styles

The component uses `::ng-deep` for Material overrides (hint color, error color, input font). If your parent screen also uses `::ng-deep` on similar selectors, the parent's styles may override the component's.

**Common conflicts:**
- `.mat-mdc-form-field-hint` color — component sets gray (`#666`) and green (`.confirmation-hint`)
- `.mat-mdc-form-field-error` color — component sets red (`#b02828`)
- `.mat-mdc-form-field-infix` padding — component sets `24px` top, `8px` bottom

**To avoid conflicts:** Scope your parent's `::ng-deep` to exclude `app-unit-id-field`:

```scss
// Parent SCSS — won't affect the unit ID component
:host ::ng-deep .my-other-field {
  .mat-mdc-form-field-hint { color: blue; }
}
```

Or let the component's styles win — they're designed for this specific field.

---

## Reference Screens

### Simple — Manual Donor Interface

`/apis-integration/lab-api-interfaces/manual-donor-interface` — single unit ID field, no chained validation.

```html
<app-unit-id-field
  [validateFfValue]="'DONOR'"
  [required]="true"
  [placeholder]="'W123418051501'"
  (validated)="onUnitValidated($event)"
  (cleared)="onUnitCleared()"
  class="field-width"
/>
```

```typescript
@ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

onSave(): void {
  if (!this.unitIdField.isValid) return;
  this.apiService.submitManualDonorInterface(
    this.unitIdField.parsedUnitId!,   // ← parsedUnitId for save API
    formValue.donorVerified,
    formValue.hasAssertion,
    formValue.priorTestResult?.code ?? ''
  );
}

onClearAll(): void {
  this.unitIdField.clear();           // ← programmatic reset
  this.donorForm.reset({ ... });
}
```

### With Chained Validation — Lab Interface Results

`/laboratory-functions/.../lab-interface-results` — multiple unit ID fields inside a data table, with a second API call (verify-unit) chained after format validation.

```html
<!-- Inside data table cell template -->
<ng-template #unitIdCellTemplate let-row>
  <app-unit-id-field
    [validateFfValue]="'DONOR'"
    [hintValid]="'Verified'"
    [requirePostValidation]="true"
    (postValidate)="onUnitPostValidate($event, row)"
    (validated)="onUnitValidated($event, row)"
    (cleared)="onUnitCleared(row)"
  />
</ng-template>
```

```typescript
onUnitPostValidate(event: UnitIdPostValidateEvent, entry: UnitEntry): void {
  // Chain verify-unit API after format validation
  this.service.verifyUnit(event.data.parsedUnitId!, this.selectedType!).subscribe({
    next: (result) => {
      const data = result.item;
      if (!data?.isValid) {
        event.reject(data?.error?.message || 'Verification failed');
      } else if (data.alreadyInterfaced) {
        // Show dialog, then confirm/reject based on user choice
      } else {
        entry.collectionDate = data.collectionDate;
        event.confirm();  // → shows "Verified" (from hintValid)
      }
    },
    error: () => event.reject('Error verifying unit')
  });
}
```

Key patterns:
- **`[requirePostValidation]="true"`** — required when inside data table (see [Data Table Usage](#data-table-usage))
- **`[hintValid]="'Verified'"`** — custom success hint replaces default "Valid ISBT unit"
- **`(postValidate)`** — chains second API call, field stays in "Validating..." until `confirm()`/`reject()`
- **`(validated)`** — fires only after `confirm()`, used to store parsedUnitId on the entry

---

## What Happens Inside (You Don't Need To Know This, But FYI)

```
User types/scans → blur fires → component calls BE API
  ↓
BE detects: ISBT scan? ISBT manual? Codabar scan? Codabar manual?
BE validates: collection center, year, serial, check digit, facility flag
BE returns: parsedUnitId, manualUnitId, checkDigit, entryMode, barcodeType
  ↓
Component handles response:
  ISBT (any):         Show manualUnitId with spaces → next step
  Codabar scan:       Show manualUnitId as-is → next step
  Codabar manual:     Start double-entry → clear field → "Re-enter to confirm"
                      On second entry match → next step
  Error:              Show error message below field
  ↓
Next step (depends on requirePostValidation):
  requirePostValidation=false (default):
    Mark valid immediately → emit (validated) → show hintValid
  requirePostValidation=true:
    Stay "Validating..." → emit (postValidate) → wait for confirm()/reject()
    confirm() → mark valid → emit (validated) → show hintValid
    reject(msg) → mark invalid → show error message
  ↓
User focuses field → reverts to raw input → resets state → next blur re-validates
User presses Enter → field blurs → same as above
User types after valid → state resets → hints clear → "Scan or type" returns
```

---

## Data Table Usage

When `<app-unit-id-field>` is rendered inside a **data table cell template** (`<ng-template>` via `*ngTemplateOutlet` or `createEmbeddedView`), Angular's `EventEmitter.observed` check may return `false` for `(postValidate)` — even though the binding is present in the template. This causes the component to skip the `postValidate` step and mark valid immediately.

**Fix:** Set `[requirePostValidation]="true"`. This bypasses the `.observed` check and always waits for `confirm()`/`reject()`.

```html
<!-- Inside a data table cell template -->
<ng-template #unitIdCellTemplate let-row>
  <app-unit-id-field
    [validateFfValue]="'DONOR'"
    [requirePostValidation]="true"
    (postValidate)="onPostValidate($event, row)"
    (validated)="onValidated($event, row)"
  />
</ng-template>
```

```typescript
onPostValidate(event: UnitIdPostValidateEvent, row: MyRowType): void {
  // Run your screen-specific check (e.g., verify-unit API)
  this.service.verifyUnit(event.data.parsedUnitId, this.selectedType).subscribe({
    next: (result) => {
      if (result.item?.isValid) {
        row.collectionDate = result.item.collectionDate;
        event.confirm();   // → component marks valid
      } else {
        event.reject(result.item?.error?.message || 'Verification failed');
      }
    },
    error: () => event.reject('Verification failed')
  });
}
```

**Why this happens:** Data tables render cell templates via `ViewContainerRef.createEmbeddedView()`. The output subscription is established by Angular's template engine, but `EventEmitter.observed` (which checks `Subject.observers.length`) may evaluate before the subscription is fully wired. The `requirePostValidation` input sidesteps this by not relying on runtime observer detection.

### CSS Fix for Error/Hint Text Wrapping in Data Tables

Material's `mat-mdc-form-field-bottom-align` class constrains the subscript area to a fixed height, causing long error messages to clip. Override this in the parent screen's SCSS:

```scss
// Scoped to your data table wrapper
.your-table-wrapper .unit-cell app-unit-id-field {
  .mat-mdc-form-field-subscript-wrapper {
    overflow: visible !important;
    position: relative !important;
  }

  .mat-mdc-form-field-subscript-wrapper.mat-mdc-form-field-bottom-align::before {
    display: none !important;
  }

  .mat-mdc-form-field-error-wrapper {
    position: relative !important;
  }

  .mat-mdc-form-field-error,
  .mat-mdc-form-field-hint {
    white-space: normal !important;
    word-wrap: break-word !important;
    overflow: visible !important;
    text-overflow: unset !important;
  }
}
```

### Cell Alignment in Data Tables

When the unit ID field is in one column and other columns (date, actions) are alongside, the other cells need top padding to align with the input text baseline:

```scss
.your-table-wrapper {
  td.mat-mdc-cell {
    vertical-align: top !important;
  }

  // Align date and action cells with the input text (~28px accounts for
  // mat-form-field's label + infix padding above the input line)
  td.mat-mdc-cell.cdk-column-collectionDate,
  td.mat-mdc-cell.cdk-column-actions {
    padding-top: 28px !important;
  }
}
```

---

## File Structure

```
shared/components/unit-id-field/
├── unit-id-field.component.ts        ← Component with all behavior
├── unit-id-field.component.html      ← Template (hints + errors + input)
├── unit-id-field.component.scss      ← Material form field styling
├── unit-id-field.service.ts          ← Shared API service (POST validate-unit)
├── unit-id-field.model.ts            ← UnitValidationResponse, UnitValidationApiResponse
├── unit-id-double-entry.helper.ts    ← Codabar manual double-entry state machine
├── unit-id-format.utility.ts         ← ISBT spacing formatter
├── index.ts                          ← Barrel export
└── README.md                         ← This file
```
