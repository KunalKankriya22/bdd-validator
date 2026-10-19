# Multiple Observation Test Types by Manufacturer

**JIRA Ticket**: MLT-13349
**Mnemonic**: MOTTMFG
**Legacy Form**: VTSTYPES
**Module**: Laboratory Functions > Testing Modules > Multiple Observation Testing

## Overview

This Angular standalone component provides a master-detail interface for managing manufacturer-specific requirements for recording test results. The component follows Blood Center UI patterns with accessibility (WCAG 2.1 Level AA) and Angular 20+ best practices.

## Features

- **Master-Detail Layout**: Left panel for test selection, right panel for editable test type grid
- **Inline Editing**: All rows editable simultaneously in a data table
- **Pagination**: Configurable page sizes (10, 25, 50)
- **Real-time Validation**: Client-side and server-side error handling
- **Date Formatting**: DD-MMM-YYYY display format with manual entry support
- **Accessibility**: Full WCAG 2.1 Level AA compliance with ARIA attributes

## Component Structure

```
multiple-observation-test-types-by-mfg/
├── models/
│   └── test-types.model.ts              # TypeScript interfaces matching API DTOs
├── services/
│   ├── test-types-api.service.ts        # API service with all endpoints
│   └── test-types-api.service.spec.ts   # Service unit tests
├── validators/
│   └── test-type.validators.ts          # Custom form validators
├── components/
│   ├── test-list-panel.ts               # Left panel: test list
│   ├── test-list-panel.html
│   ├── test-list-panel.scss
│   ├── test-list-panel.spec.ts
│   ├── test-types-grid.ts               # Right panel: editable grid
│   ├── test-types-grid.html
│   ├── test-types-grid.scss
│   └── test-types-grid.spec.ts
├── multiple-observation-test-types-by-mfg.component.ts    # Main component
├── multiple-observation-test-types-by-mfg.component.html
├── multiple-observation-test-types-by-mfg.component.scss
├── multiple-observation-test-types-by-mfg.component.spec.ts
└── README.md
```

## API Integration

**Base URL**: `/api/v1/test-types`

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/test-types/{testId}` | Get all test types for a test ID |
| GET | `/api/v1/test-types/{testId}/{testType}` | Get specific test type |
| POST | `/api/v1/test-types` | Create new test type |
| PUT | `/api/v1/test-types/{testId}/{testType}` | Update test type |
| DELETE | `/api/v1/test-types/{testId}/{testType}` | Soft delete test type |
| GET | `/api/v1/test-types/lookup/tests` | Get tests for dropdown |
| GET | `/api/v1/test-types/lookup/test-description/{testId}` | Get test description |
| GET | `/api/v1/test-types/lookup/control-values/{testId}` | Get control values |

### DTOs

**MultipleObservationTestTypeDto** (Response):
- testId: string(6)
- testType: string(8)
- testTypeDesc: string(30)
- defaultControlValue: string(30) | null
- resUpdate: string(1) | null  // Y/N
- othBnd: string(1) | null      // Y/N
- fullTechTwo: string(1) | null // Y/N
- effDate: DateTime (required)
- termDate: DateTime | null
- lastModifiedDate: DateTime

**CreateMultipleObservationTestTypeDto** (Request):
- All fields from response except lastModifiedDate
- testId and testType are required for creation
- Dates in YYYY-MM-DD format

**UpdateMultipleObservationTestTypeDto** (Request):
- Same as Create but without testId and testType (in URL)

## Validation Rules

### Field Validations
| Field | Validation | Error Code |
|-------|------------|------------|
| testTypeDesc | Required, max 30 chars | 0080 |
| testType | Required, max 8 chars | - |
| effDate | Required, not in past (CREATE only) | 5002, 1809 |
| termDate | Optional, >= effDate, not in past | 5004, 3115 |
| resUpdate/othBnd/fullTechTwo | Must be Y or N | 0319 |
| defaultControlValue | Must be valid for testId | 5003 |

### Custom Validators
- `yesNoValidator()`: Validates Y/N fields
- `effectiveDateNotInPastValidator()`: Effective date >= today
- `terminationDateNotInPastValidator()`: Termination date >= today
- `terminationAfterEffectiveValidator()`: Termination >= Effective
- `testTypeDescriptionValidator()`: Description required
- `effectiveDateRequiredValidator()`: Effective date required

## Routing Configuration

**Route Path**: `/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-types-by-mfg`

**Route Key**: `RouteKey.MultipleObservationTestTypesByMfg`

**Mnemonic**: `MOTTMFG` (maps to route key in `fcn-route-map.ts`)

### Files Updated
1. `route-keys.ts`: Added `MultipleObservationTestTypesByMfg`
2. `route-registry.ts`: Added route entry with lazy loading
3. `fcn-route-map.ts`: Added `MOTTMFG` mnemonic mapping
4. `laboratory-functions.routes.ts`: Added route to testing-modules section

## Usage

### Component Inputs
```typescript
// No direct inputs - component is standalone routable
```

### Navigation
```typescript
// Via router
this.router.navigate(['/laboratory-functions/testing-modules/multiple-observation-testing/multiple-observation-test-types-by-mfg']);

// Via mnemonic (from menu)
// User selects "Multiple Observation Test Types by M..." from navigation
// Mnemonic MOTTMFG automatically routes to the component
```

## State Management

The component uses Angular Signals for reactive state:

```typescript
selectedTest: signal<TestLookupDto | null>
testTypes: signal<MultipleObservationTestTypeDto[]>
controlValues: signal<DefaultControlValueLookupDto[]>
loading: signal<boolean>
saving: signal<boolean>
error: signal<string | null>
```

### Computed Signals
```typescript
selectedTestId: computed(() => selectedTest()?.testId)
selectedTestDesc: computed(() => selectedTest()?.testDesc)
hasSelection: computed(() => selectedTest() !== null)
```

## Accessibility Features

### WCAG 2.1 Level AA Compliance
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: ARIA labels, roles, and live regions
- **Focus Management**: Proper focus order and visible focus indicators
- **Error Announcements**: role="alert" for error messages
- **Loading States**: aria-busy and aria-live for state changes
- **Unique IDs**: All elements have unique IDs for ARIA relationships

### Accessibility Attributes
```html
<!-- Example from test list panel -->
<mat-selection-list
  [id]="elementId('test-list')"
  [attr.aria-label]="'Test selection list, ' + filteredTests().length + ' tests'"
  role="listbox">
  <mat-list-option
    [attr.aria-selected]="isSelected(test)"
    role="option">
  </mat-list-option>
</mat-selection-list>

<!-- Example from editable grid -->
<input
  matInput
  [id]="elementId('testType-' + i)"
  [attr.aria-invalid]="control?.invalid && control?.touched"
  [attr.aria-describedby]="control?.invalid ? errorId(i, 'testType') : null">
```

## Testing

### Unit Tests
- **Main Component**: 100% coverage with 16 test suites
- **Test List Panel**: 100% coverage with 12 test suites
- **Test Types Grid**: 100% coverage with 15 test suites
- **API Service**: 100% coverage with 10 test suites

### Running Tests
```bash
# Run all tests for this feature
ng test --include='**/multiple-observation-test-types-by-mfg/**/*.spec.ts'

# Run with code coverage
ng test --code-coverage --include='**/multiple-observation-test-types-by-mfg/**/*.spec.ts'
```

## Date Handling

**Display Format**: DD-MMM-YYYY (e.g., 15-JUN-2026)
**API Format**: YYYY-MM-DD (e.g., 2026-06-15)

```typescript
// Date formatting
import moment from 'moment';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

// Display
formatDate(value: string): string {
  const m = moment(value);
  return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
}

// To API
serializeForApi(date: Date): string {
  return moment(date).format('YYYY-MM-DD');
}
```

## Error Handling

### API Error Codes
| Code | Message | Handling |
|------|---------|----------|
| 0080 | Test Type Description must be entered | Client validation + API error display |
| 0319 | Value must be Y or N | Client validation + API error display |
| 1017 | Test type already exists | API error display |
| 1227 | Invalid TEST_ID | API error display |
| 1809 | Effective date cannot be in the past | Client validation (CREATE only) |
| 3115 | Termination date has passed | Client validation |
| 5002 | Effective Date must be entered | Client validation |
| 5003 | Invalid Default Control Value | API error display |
| 5004 | Termination Date must be >= Effective Date | Client validation |

### Error Display
```typescript
// Snackbar for save errors (top-right corner)
this.snackbarService.showError('Failed to save. Please try again.');

// Inline errors for form validation
<mat-error>Effective Date must be entered</mat-error>
```

## Known Issues & Limitations

1. **Browser Support**: Requires modern browsers with ES2020+ support
2. **Date Input**: Manual entry requires correct format (DD-MMM-YYYY)
3. **Pagination**: Maximum 50 items per page
4. **Control Values**: Loaded per test, not cached globally

## Future Enhancements

1. **Bulk Operations**: Add/delete multiple rows at once
2. **Export**: Export grid data to Excel/CSV
3. **Import**: Bulk import test types from file
4. **History**: View change history for test types
5. **Advanced Search**: Filter by multiple criteria in test list

## Developer Notes

### Adding New Validation
```typescript
// In validators/test-type.validators.ts
export function myCustomValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Validation logic
    return null;
  };
}
```

### Adding New API Endpoint
```typescript
// In services/test-types-api.service.ts
myNewEndpoint(param: string): Observable<ResponseType> {
  const url = `${this.baseUrl}${API.TEST_TYPES.MY_ENDPOINT(param)}`;
  return this.http.get<ApiResponse<ResponseType>>(url)
    .pipe(map(response => response.data || defaultValue));
}
```

## Support

For questions or issues:
- **JIRA**: Create ticket in MLT project
- **Team**: Blood Centers UI Development Team
- **Documentation**: See API documentation at vtstypes-api-documentation.md

---

**Generated**: 2026-06-02
**Version**: 1.0.0
**Angular Version**: 20.2.14
**Angular Material Version**: 20.2.14
