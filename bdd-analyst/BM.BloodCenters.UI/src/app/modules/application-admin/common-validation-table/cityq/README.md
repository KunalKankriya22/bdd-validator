# City, State, and Zip Query (CITYQ)

**JIRA Ticket**: MLT-11889
**Mnemonic**: CITYQ
**Oracle Forms**: VDQCITST (Query), VDWNWZIP (Add/Update)
**Module**: Application Administration > Common Validation Table

## Overview

The City, State, and Zip Query feature provides a comprehensive interface for searching, viewing, and managing valid city, state, ZIP code, and county records in the Blood Centers system.

## Features

### 1. Query and Search
- **Filter Panel**: Filter by City, Zip Code, County, State
- **Global Search**: Search across all fields
- **Data Table**: Sortable columns with pagination
- **Filter Chips**: Visual display of active filters with remove capability

### 2. Add/Edit Functionality
- Create new ZIP records via "ADD NEW ZIP" button
- Edit existing records via row edit action
- Form validation based on API business rules

### 3. Data Display
- City, Zip Code, State, County, Used Flag columns
- Pagination with configurable page sizes (10, 25, 50, 100)
- Default page size: 10 rows

## File Structure

```
cityq/
├── city-state-zip-query.ts                    # Main component
├── city-state-zip-query.html                  # Main template
├── city-state-zip-query.scss                  # Main styles
├── city-state-zip-query.spec.ts               # Main component tests
├── models/
│   └── city-state-zip-query.model.ts          # TypeScript interfaces/DTOs
├── services/
│   ├── city-state-zip-query.service.ts        # API service
│   └── city-state-zip-query.service.spec.ts   # Service tests
├── utils/
│   └── filter-chips.utils.ts                  # Filter chip utilities
├── city-state-zip-filter-panel/
│   ├── city-state-zip-filter-panel.ts         # Filter panel component
│   ├── city-state-zip-filter-panel.html       # Filter panel template
│   └── city-state-zip-filter-panel.scss       # Filter panel styles
└── dialogs/
    └── add-edit-zip/
        ├── add-edit-zip-dialog.ts             # Add/Edit dialog component
        ├── add-edit-zip-dialog.html           # Dialog template
        └── add-edit-zip-dialog.scss           # Dialog styles
```

## API Endpoints

Base URL: `/api/v1/valid-city-state`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/{take}/{skip}` | Query with filters, sorting, pagination |
| GET | `/{uspsId}` | Get by ID |
| POST | `/` | Create record |
| PUT | `/{uspsId}` | Update record |
| GET | `/states` | Get states LOV |
| GET | `/cities?state={state}` | Get cities LOV |
| GET | `/counties?state={state}` | Get counties LOV |

## Data Model

### ValidCityStateDto (Response)
- `uspsId` (number) - Unique identifier
- `city` (string, max 40) - City name
- `state` (string, max 2) - State code
- `zip` (string, max 5) - Zip code
- `county` (string, max 40) - County name
- `placeName` (string, max 40) - USPS place name
- `uspsType` (string, max 2) - USPS type code
- `commonlyUsedFlag` (string, 1 char) - 'Y' or 'N'
- `effDate` (DateTime) - Effective date
- `termDate` (DateTime) - Termination date
- `programId`, `insertDate`, `insertUser` - Audit fields

### CreateValidCityStateDto / UpdateValidCityStateDto (Request)
All fields same as response, formatted for API submission

## Validation Rules

### Required Fields
- State (2 chars, uppercase, valid state code)
- City (max 40 chars, not empty)
- Zip (5 digits, > 0, left-padded with zeros)
- Effective Date (not in past for create mode)

### Optional Fields
- County (max 40 chars)
- Place Name (max 40 chars)
- USPS Type (max 2 chars)
- Commonly Used Flag ('Y' or 'N' only)
- Termination Date (must be >= Effective Date, not in past)

### Field-Level Validators
- `effectiveDateNotPastValidator()` - Prevents past dates for Effective Date (create only)
- `terminationDateNotPastValidator()` - Prevents past dates for Termination Date
- `terminationAfterEffectiveValidator()` - Ensures Termination Date >= Effective Date

## Date Handling

### Display Format: DD-MON-YYYY
All dates display in DD-MON-YYYY format (e.g., 12-MAR-2026):
- Table columns: Use `| date:'dd-MMM-yyyy'` pipe
- Datepicker: Configure `DD_MON_YYYY_FORMATS` provider

### API Format: YYYY-MM-DD
Dates sent to API use YYYY-MM-DD format via `moment().format('YYYY-MM-DD')`

### Date Restrictions
- **Effective Date**: `[min]="today"` in create mode (allows past dates in edit mode)
- **Termination Date**: `[min]="form.get('effectiveDate')?.value"` (dynamic based on Effective Date)

## Routing Configuration

### Route Key
`CityStateZipQuery: 'CITY_STATE_ZIP_QUERY'` in `route-keys.ts`

### Route Registry
```typescript
[RouteKey.CityStateZipQuery]: {
  path: '/application-administration/common-validation-table/cityq',
  loadComponent: () => import('...').then(m => m.CityStateZipQueryComponent)
}
```

### FCN Mnemonic Mapping
`'CITYQ': RouteKey.CityStateZipQuery` in `fcn-route-map.ts`

### Module Route
Added to `application-admin.routes.ts` under common-validation-table

## Database Configuration

### Menu Entry Required
Add to Oracle database `UTIL.FCN_MENU_ITEMS` with mnemonic `CITYQ`:

```sql
INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID, FCN_ID, DESCRIP, SEQUENCE, MNEMONIC, REMARKS
)
SELECT
  [parent_menu_id],
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'City, State, and Zip Query',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = [parent_menu_id]),
  'CITYQ',
  'Search, view, and manage city, state, ZIP code, and county records'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'CITYQ');
COMMIT;
```

## Accessibility

### WCAG 2.1 Level AA Compliance
- **Unique IDs**: All form fields have unique IDs via static counter pattern
- **ARIA Attributes**: `aria-labelledby`, `aria-describedby`, `aria-invalid`
- **Keyboard Navigation**: Full keyboard support with Alt+S (search), Alt+F (filter), Escape (close)
- **Screen Reader Support**: Loading states with `aria-busy`, errors with `role="alert"`
- **Focus Management**: Auto-focus on first invalid field on form submit

## Error Handling

### Snackbar Notifications (Top-Right)
- **Success**: Auto-dismiss after 8s, dark gray background (#2f2f2f)
- **Error**: Manual dismiss, red background (#d32f2f)
- Uses `SnackbarService` with `showSuccess()` and `showError()` methods

### Inline Errors
- Display below form fields via `mat-error`
- Linked to field via `aria-describedby`

### Server Errors
- Extracted from API response: `error.error.errorResponse.error`
- Displayed at top of dialog with error icon

## Testing

### Unit Tests Included
- **Service Tests**: All API endpoints, error handling
- **Component Tests**: Initialization, pagination, sorting, search, filters, dialogs, accessibility

### Run Tests
```bash
ng test --include=**/cityq/**/*.spec.ts
```

## UI Components Reused

- `PageHeaderWithBreadcrumb` - Page header with "ADD NEW ZIP" button
- `SearchBar` - Global search input
- `DataTable` - Listing with pagination and sorting
- `FilterChips` - Active filter display
- `FilterPanelBase` - Filter panel structure (via CDK Overlay)
- `SnackbarService` - Success/error notifications

## Shared Validators

- `effectiveDateNotPastValidator()` - From `@shared/validators/date.validators.ts`
- `terminationDateNotPastValidator()` - From `@shared/validators/date.validators.ts`
- `terminationAfterEffectiveValidator()` - From `@shared/validators/date.validators.ts`

## Design Compliance

### Figma Screenshots
Two Figma screenshots provided showing:
1. Filtered view with applied filters (City: DAL, Zip: 04210, County: Bristol, State: MA)
2. Unfiltered view showing city name variations

### UI Fidelity
All UI elements match Figma designs exactly:
- Field placement and order preserved
- Layout and grid structure unchanged
- Spacing, padding, margins match design
- Colors and typography from Material theme
- No visual deviations from design specifications

## Additional Notes

- **Standalone Component**: Angular 20+ standalone architecture
- **Signal-Based State**: Uses Angular signals for reactive state management
- **TypeScript Strict Mode**: All types defined, no `any` types
- **Destroy Pattern**: Proper cleanup with `takeUntil(this.destroy$)`
- **Mobile Responsive**: Adapts for mobile with single-column filter layout

## Future Enhancements

- Bulk import/export functionality
- Advanced filtering options
- Audit trail display
- Print/export capabilities
