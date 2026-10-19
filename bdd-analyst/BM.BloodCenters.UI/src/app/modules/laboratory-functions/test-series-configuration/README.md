# Test Series/Test Configuration Component

## Overview

The Test Series Configuration component allows users to configure the ordering, canceling, and placing of notations based on test series or test ID for laboratory functions.

## Features

- **Dual Filter Mode**: Filter by Test Series ID OR Test ID (mutually exclusive)
- **Inline Editable Grid**: View and edit configurations directly in the table
- **Multi-Select Chips**: Result codes displayed and edited as chips
- **Date Validation**: Effective Date and Termination Date validation with DD-MMM-YYYY format
- **Pagination**: Configurable page sizes (10, 25, 50, 100) with default of 25
- **Add/Edit/Delete Operations**: Full CRUD functionality with soft delete
- **Accessibility**: WCAG 2.1 Level AA compliant with unique IDs, ARIA labels, and keyboard navigation
- **Responsive Design**: Mobile-friendly layout

## File Structure

```
test-series-configuration/
├── models/
│   └── test-series-configuration.model.ts   # TypeScript interfaces and DTOs
├── services/
│   ├── test-series-configuration-api.service.ts       # API service
│   └── test-series-configuration-api.service.spec.ts  # Service unit tests
├── test-series-configuration.component.ts     # Main component
├── test-series-configuration.component.html   # Template
├── test-series-configuration.component.scss   # Styles
├── test-series-configuration.component.spec.ts # Component unit tests
└── README.md                                   # This file
```

## API Endpoints

All endpoints are defined in `src/app/core/constants/api.constants.ts` under `TEST_SERIES_CONFIG`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/test-series-config/{take}/{skip}` | POST | Get all with filters/pagination |
| `/test-series-config` | GET | Get by composite key |
| `/test-series-config` | POST | Create new configuration |
| `/test-series-config` | PUT | Update existing configuration |
| `/test-series-config` | DELETE | Soft delete (set TERM_DATE) |
| `/test-series-config/test-series-dropdown` | GET | Get test series dropdown |
| `/test-series-config/valid-tests` | GET | Get valid tests for dropdowns |

## Data Model

### TestSeriesConfigDto (Response)

| Field | Type | Description |
|-------|------|-------------|
| `testSeriesId` | string \| null | Test series identifier |
| `levelCode` | number \| null | Level code (1-99) |
| `setNo` | number \| null | Set number |
| `testId` | string \| null | Individual test identifier |
| `resultCode` | string \| null | Comma-separated result codes |
| `scheduleTest` | string \| null | Comma-separated test IDs to schedule (max 500 chars) |
| `cancelTest` | string \| null | Comma-separated test IDs to cancel (max 500 chars) |
| `anotationCode` | string \| null | Annotation code (max 10 chars) |
| `finalFlag` | string \| null | Final result flag (Y/N) |
| `effDate` | string | Effective date (ISO DateTime) |
| `termDate` | string \| null | Termination date (ISO DateTime) |
| `insertDate` | string | Created timestamp (readonly) |
| `insertUser` | string | Created by user (readonly) |

### Validation Rules

1. **Mutually Exclusive IDs**: Either `testSeriesId` OR `testId` must be provided, not both
2. **Level Code**: Required when `testSeriesId` is provided; range 1-99
3. **Effective Date**: Cannot be in the past (create only)
4. **Termination Date**: Must be >= Effective Date
5. **Result Code**: Max 10 characters (comma-separated multi-select)
6. **Schedule/Cancel Test**: Max 500 characters (comma-separated test IDs)
7. **Notation Code**: Max 10 characters

## Usage

### Routing

The component is accessible at:
```
/laboratory-functions/test-series-configuration
```

Route configuration:
- **Route Key**: `RouteKey.TestSeriesConfiguration`
- **Path**: `/laboratory-functions/test-series-configuration`
- **Lazy Loaded**: Yes (standalone component)

### Filter Section

1. Select **Test Series ID** OR **Test ID** (mutually exclusive)
2. Click **RETRIEVE** to load data
3. Click **CLEAR ALL** to reset filters and grid

### View Mode

- View all configurations in a paginated table
- Result codes displayed as chips
- Dates displayed in DD-MMM-YYYY format
- Click **ADD ROW / EDIT TABLE** to enter edit mode

### Edit Mode

1. Click **ADD ROW / EDIT TABLE** button
2. Table switches to inline editing mode:
   - All fields become editable (except Series ID)
   - Dropdowns for Level, Test ID, Result Code, Schedule/Cancel Test, Notation Code, Final Result
   - Datepickers for Effective Date and Termination Date
   - Delete icon (trash) for each row
3. Click **ADD NEW ROW** to insert a new configuration
4. Make changes inline in the table
5. Click **SAVE** to commit all changes (creates/updates multiple records)
6. Click **CANCEL** to discard changes and exit edit mode

### Accessibility Features

- **Unique IDs**: All form elements have unique IDs using static counter pattern
- **ARIA Labels**: All interactive elements have proper ARIA attributes
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape)
- **Screen Reader**: Loading states, error messages, and empty states are announced
- **Focus Management**: Focus moves to first invalid field on validation error
- **Required Fields**: Marked with red asterisk (*)
- **Error Messages**: Associated with fields via `aria-describedby`

## Testing

### Unit Tests

Run component tests:
```bash
ng test --include=**/test-series-configuration.component.spec.ts
```

Run service tests:
```bash
ng test --include=**/test-series-configuration-api.service.spec.ts
```

### Test Coverage

**Component Tests**:
- Initialization
- Filter form behavior (mutual exclusivity)
- Data loading
- Error handling
- Edit mode toggle
- Add/Delete row operations
- Form validation
- Save functionality
- Pagination
- Date formatting
- Accessibility attributes
- Computed values

**Service Tests**:
- GET all with pagination
- GET by composite key
- POST create
- PUT update
- DELETE soft delete
- Dropdown options retrieval

## Dependencies

**Angular Material**:
- `MatFormFieldModule`
- `MatSelectModule`
- `MatInputModule`
- `MatButtonModule`
- `MatIconModule`
- `MatProgressSpinnerModule`
- `MatTableModule`
- `MatPaginatorModule`
- `MatDatepickerModule`
- `MatChipsModule`
- `MatAutocompleteModule`
- `MatCheckboxModule`
- `MatTooltipModule`

**Shared Services**:
- `ApiService` - HTTP client wrapper
- `SnackbarService` - Top-right notifications

**Shared Validators**:
- `effectiveDateNotPastValidator()` - Validates effective date is not in past
- `terminationAfterEffectiveValidator()` - Validates termination date >= effective date
- `getEffectiveDateErrorMessage()` - Gets effective date error message
- `getTerminationDateErrorMessage()` - Gets termination date error message

**Date Formats**:
- `DD_MON_YYYY_FORMATS` - Date display format (DD-MMM-YYYY)
- `MomentDateAdapter` - Moment.js date adapter for Angular Material

## Error Codes

| Code | HTTP | Message | Trigger |
|------|------|---------|---------|
| 1402 | 400 | Either Test Series ID or Test ID must be entered | Both null or both populated |
| 1809 | 400 | Invalid Test Series ID entered | Test series not found |
| 1227 | 400 | Invalid Test ID entered | Test ID not found |
| 0425 | 400 | Invalid numeric value for Level Code | Level code not 1-99 |
| 5002 | 400 | Effective date required | EffDate is null |
| 5016 | 400 | Term date must be >= Eff date | Invalid date range |
| 5020 | 400 | Term date cannot be in past | TermDate < current date |
| 2050 | 409 | Duplicate record | Configuration already exists |
| 5170 | 400 | At least one test must be selected | Empty schedule/cancel list |

## Future Enhancements

1. **Export**: Export grid data to CSV/Excel
2. **Bulk Operations**: Bulk delete, bulk update
3. **Advanced Filters**: Filter by Level Code, Result Code, Date Range
4. **Search**: Client-side or server-side search within results
5. **Sorting**: Column sorting (currently sorts by default API order)
6. **History**: View audit trail of changes

## Developer Notes

### Signal-Based State Management

The component uses Angular signals for reactive state management:

```typescript
protected readonly data = signal<TestSeriesConfigGridRow[]>([]);
protected readonly loading = signal<boolean>(false);
protected readonly error = signal<string | null>(null);
protected readonly isEditMode = signal<boolean>(false);
```

Computed values are derived from signals:

```typescript
protected readonly isEmpty = computed(() => this.data().length === 0 && !this.loading());
protected readonly hasData = computed(() => this.data().length > 0);
```

### Form Management

- **Filter Form**: Simple form group for Test Series ID and Test ID
- **Row Forms**: Map of form groups (one per row) created in edit mode
- **Validation**: Uses Angular's built-in validators and custom date validators

### Date Handling

- **Display**: DD-MMM-YYYY format (e.g., 11-JAN-2025)
- **API**: YYYY-MM-DD format (e.g., 2025-01-11)
- **Moment.js**: Used for date parsing and formatting
- **Datepicker**: Configured with `DD_MON_YYYY_FORMATS` provider

### Inline Editing Implementation

The component maintains two data arrays:
1. `data` - Original data from API (view mode)
2. `editableData` - Editable copy with forms (edit mode)

Each row in edit mode has a corresponding `FormGroup` stored in `rowForms` Map.

### Performance Considerations

- **Lazy Loading**: Component is lazy loaded via route registry
- **Change Detection**: OnPush strategy could be added for performance
- **Pagination**: Server-side pagination reduces data transfer
- **Form Arrays**: Avoided in favor of Map for better performance with large datasets

## Support

For issues or questions, contact the Blood Center UI development team or refer to the main project documentation.
