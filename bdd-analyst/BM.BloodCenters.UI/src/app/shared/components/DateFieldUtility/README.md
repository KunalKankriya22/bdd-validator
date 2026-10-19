# Date Field Facility

A shared, reusable validation utility for handling **Effective Date** and **Termination Date** validation logic across all components that use Add and Edit modals.

## 📋 Overview

This utility provides a centralized solution for date field validation with consistent behavior across the application. It handles all validation rules, error messages, and date picker configurations.

## 🎯 Features

- **Consistent Validation Rules**: Standardized validation across all components
- **Past Date Prevention**: Automatic disabling of past dates in Add mode
- **Date Range Validation**: Ensures Termination Date ≥ Effective Date
- **Edit Mode Support**: Special handling for existing records with past dates
- **Optional Termination Date**: Supports optional termination dates
- **Comprehensive Error Messages**: Clear, user-friendly validation messages
- **Type-Safe**: Full TypeScript support with proper types

## 📦 What's Included

```
date-field-facility/
├── date-field-validation.utility.ts  # Main utility class
├── index.ts                          # Barrel export
├── USAGE.md                          # Comprehensive usage guide
├── README.md                         # This file
└── date-field-validation.utility.spec.ts  # Unit tests
```

## 🚀 Quick Start

### 1. Import the Utility

```typescript
import { DateFieldValidationUtility } from '@shared/components/date-field-facility';
```

### 2. Set Up Form with Validators

```typescript
this.form = this.fb.group({
  effectiveDate: [null, [
    Validators.required,
    DateFieldValidationUtility.effectiveDateNotPastValidator()
  ]],
  terminationDate: [null]  // Optional
}, {
  validators: [DateFieldValidationUtility.dateRangeValidator()]
});
```

### 3. Configure Date Pickers in Template

```html
<!-- Effective Date -->
<input matInput
       [matDatepicker]="effectivePicker"
       formControlName="effectiveDate"
       [min]="mode === 'add' ? minDate : null">

<!-- Termination Date -->
<input matInput
       [matDatepicker]="terminationPicker"
       formControlName="terminationDate"
       [min]="form.get('effectiveDate')?.value">
```

### 4. Display Validation Errors

```typescript
getEffectiveDateError(): string {
  return DateFieldValidationUtility.getEffectiveDateErrorMessage(
    this.form.get('effectiveDate'),
    this.form.errors
  );
}
```

## 📖 Validation Rules

### Effective Date
- ✅ **Required** field
- ✅ **Add Mode**: Cannot be a past date (today or future only)
- ✅ **Edit Mode**: Past dates allowed for existing records
- ✅ Must be ≤ Termination Date (if Termination Date is provided)

### Termination Date
- ✅ **Optional** field (can be left blank)
- ✅ Must be ≥ Effective Date (if provided)
- ✅ Calendar disables dates before selected Effective Date

### Date Picker Behavior
- ✅ **Add Mode**: Past dates are disabled/grayed out in Effective Date picker
- ✅ **Edit Mode**: All dates are selectable in Effective Date picker
- ✅ **Both Modes**: Termination Date picker disables dates before Effective Date

## 🧪 Key Methods

| Method | Description |
|--------|-------------|
| `getMinDate()` | Returns today's date (for [min] attribute) |
| `effectiveDateNotPastValidator()` | Validator preventing past dates |
| `dateRangeValidator()` | Form-level validator for date range |
| `getEffectiveDateErrorMessage()` | Returns error message for Effective Date |
| `getTerminationDateErrorMessage()` | Returns error message for Termination Date |
| `setupAddModeValidators()` | Configures validators for Add mode |
| `setupEditModeValidators()` | Configures validators for Edit mode |
| `isValidDateRange()` | Checks if date range is valid |

## 📚 Documentation

For complete implementation examples, validation scenarios, testing checklist, and migration guide, see [USAGE.md](./USAGE.md).

## 🔍 Reference Implementation

See the **Box Capacity** component for a working example:
- Location: `src/app/modules/application-admin/distribution-restricted-validation-tables/box-capacity/add-edit-box-capacity/`
- This component uses all the patterns that this utility standardizes

## ✨ Benefits

1. **Consistency**: Same validation behavior across all components
2. **Maintainability**: Single source of truth for validation logic
3. **Reusability**: No need to duplicate validation code
4. **Type Safety**: Full TypeScript support prevents errors
5. **Testing**: Centralized testing of validation logic
6. **Documentation**: Comprehensive guide with examples

## 🎓 Usage Pattern

```typescript
// Component Setup
export class MyComponent {
  form: FormGroup;
  mode: 'add' | 'edit' = 'add';
  minDate = DateFieldValidationUtility.getMinDate();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  setupValidators() {
    if (this.mode === 'add') {
      this.form.get('effectiveDate')?.setValidators([
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator()
      ]);
    }
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateErrorMessage(
      this.form.get('effectiveDate'),
      this.form.errors
    );
  }
}
```

## 🧪 Testing

Run unit tests:
```bash
ng test --include='**/date-field-validation.utility.spec.ts'
```

See [USAGE.md](./USAGE.md) for a complete testing checklist.

## 🤝 Contributing

When adding new date validation features:
1. Update the utility class with new methods
2. Add JSDoc comments for documentation
3. Update USAGE.md with examples
4. Add unit tests
5. Update this README if needed

## 📄 License

Internal use only - Blood Center Management System

---

**Need Help?** See [USAGE.md](./USAGE.md) for detailed examples and guides.
