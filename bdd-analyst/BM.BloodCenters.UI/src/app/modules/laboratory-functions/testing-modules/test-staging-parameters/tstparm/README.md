# Define Critical Controls for Test (TSTPARM)

## Overview

The **Define Critical Controls for Test** component allows users to configure test parameters by:

- Selecting a test and type
- Defining tech requirements (Tech 1, Tech 2)
- Assigning parameters with min/max values and effective/termination dates
- Searching and filtering available parameters
- Drag-and-drop reordering of assigned parameters

## Component Details

- **Mnemonic**: `TSTPARM`
- **Route**: `/laboratory-functions/testing-modules/test-staging-parameters`
- **Module**: Laboratory Functions > Testing Modules
- **JIRA**: MLT-13333

## Features

### Two-Panel Layout

1. **Left Panel (60%)**: Test configuration form with assigned parameters table
2. **Right Panel (40%)**: Available parameters list with search and filter

### Core Functionality

- **Test Selection**: Dropdown with auto-populated description
- **Type Selection**: Manual, Automated, etc.
- **Tech Required**: At least one of Tech 1 or Tech 2 must be selected
- **Parameter Assignment**: Add/remove parameters with + and - buttons
- **Drag-and-Drop**: Reorder assigned parameters by dragging
- **Inline Editing**: Edit Min, Max values directly in the table
- **Search**: Filter available parameters by code, description, or related code
- **Advanced Filters**: Dialog with datatype, related code, void code, and date filters
- **Date Validation**: Effective and termination dates with DD-MMM-YYYY format

## File Structure

```
tstparm/
├── components/
│   └── tstparm-filter-panel/
│       ├── tstparm-filter-panel.component.ts
│       ├── tstparm-filter-panel.component.html
│       ├── tstparm-filter-panel.component.scss
│       └── tstparm-filter-panel.component.spec.ts
├── models/
│   └── tstparm.model.ts
├── services/
│   ├── tstparm.service.ts
│   └── tstparm.service.spec.ts
├── tstparm.component.ts
├── tstparm.component.html
├── tstparm.component.scss
├── tstparm.component.spec.ts
├── DATABASE_MENU_ENTRY.sql
└── README.md
```

## API Endpoints (TODO)

The following API endpoints are referenced in `TstparmService` with TODO comments. These must be implemented by the backend team:

### Lookup Endpoints

```typescript
GET /api/v1/laboratory-functions/testing-modules/tests/lookup
// Returns: TestLookup[]

GET /api/v1/laboratory-functions/testing-modules/types/lookup
// Returns: TestTypeLookup[]
```

### Test Configuration Endpoints

```typescript
GET /api/v1/laboratory-functions/testing-modules/tests/{testId}
// Returns: { description: string }

GET /api/v1/laboratory-functions/testing-modules/test-staging-parameters/{testId}/{typeId}
// Returns: TestConfiguration
```

### Parameter Endpoints

```typescript
GET /api/v1/laboratory-functions/testing-modules/parameters/available
// Query params: datatype, relatedCode, voidCode, effectiveDatePeriod, effectiveDate, etc.
// Returns: Parameter[]

GET /api/v1/laboratory-functions/testing-modules/parameters/filters
// Returns: FilterOptions (datatypes, relatedCodes, voidCodes)
```

### Save Endpoint

```typescript
POST /api/v1/laboratory-functions/testing-modules/test-staging-parameters/save
// Body: SaveTestConfigurationRequest
// Returns: SaveTestConfigurationResponse
```

## Data Models

All TypeScript interfaces are defined in `models/tstparm.model.ts`:

- `TestLookup` - Test dropdown options
- `TestTypeLookup` - Type dropdown options
- `Parameter` - Available parameter structure
- `AssignedParameter` - Parameter assigned to a test with min/max/dates
- `TestConfiguration` - Complete test config with assigned parameters
- `FilterCriteria` - Filter panel options
- `SaveTestConfigurationRequest` - Save payload
- `SaveTestConfigurationResponse` - Save response

## Development Notes

### Mock Data

The component currently uses **mock data** for development since API endpoints are not yet available. See the following methods in `tstparm.component.ts`:

- `loadLookupData()` - Mock tests and types
- `loadAssignedParameters()` - Mock assigned parameters
- `loadAvailableParameters()` - Mock available parameters
- `onSubmit()` - Mock save operation

**To connect to real APIs:**

1. Uncomment the service calls in these methods
2. Comment out or remove the `setTimeout()` mock data blocks
3. Verify API endpoint URLs with backend team
4. Update `api.constants.ts` with final endpoint paths

### Field Lengths

Text field maxlength restrictions are based on requirements:

- **Code**: 10 characters
- **Description**: 240 characters
- **Min/Max**: 0-99999 (numeric, no decimals)

### Date Handling

- **Display Format**: DD-MON-YYYY (e.g., 11-JAN-2025)
- **API Format**: YYYY-MM-DD (ISO 8601)
- **Validation**: Effective Date >= today (for new assignments)
- **Validation**: Termination Date >= Effective Date

### Unique IDs for Accessibility

The component uses a static counter pattern to ensure unique IDs across multiple instances:

```typescript
private static nextId = 0;
protected readonly componentId = `tstparm-${TstparmComponent.nextId++}`;
protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
```

This ensures proper ARIA attributes when multiple component instances exist.

## Navigation Configuration

### Route Configuration

Files updated for routing:

1. **route-keys.ts**: Added `TestStagingParameters: 'TEST_STAGING_PARAMETERS'`
2. **route-registry.ts**: Added route entry with path and loadComponent
3. **fcn-route-map.ts**: Added mnemonic mapping `'TSTPARM': RouteKey.TestStagingParameters`
4. **laboratory-functions.routes.ts**: Added route to module routes

### Database Menu Entry

Execute the SQL script in `DATABASE_MENU_ENTRY.sql` to add the menu item to `UTIL.FCN_MENU_ITEMS`:

- **Mnemonic**: `TSTPARM` (case-sensitive, must match exactly)
- **Display Label**: "Define Critical Controls for Test"
- **Parent Menu**: Laboratory Functions > Testing Modules (TODO: Update MENU_ID)

## Testing

### Running Tests

```bash
# Run all tests for the component
ng test --include='**/tstparm/**/*.spec.ts'

# Run specific test file
ng test --include='**/tstparm.component.spec.ts'
```

### Test Coverage

The component includes comprehensive unit tests covering:

- Component initialization
- Form validation
- Test ID selection and description population
- Parameter assignment (add/remove)
- Drag-and-drop reordering
- Search and filter functionality
- Inline field editing
- Form submission
- Accessibility (ARIA attributes, unique IDs)
- Numeric input validation
- Date formatting

## Accessibility Compliance

The component is **WCAG 2.1 Level AA compliant** with:

- Unique IDs for all form elements
- Proper ARIA attributes (aria-labelledby, aria-describedby, aria-invalid)
- Keyboard navigation support
- Screen reader announcements for loading/error states
- Drag-and-drop accessible with keyboard
- Semantic HTML structure

## Known Limitations

1. **API Endpoints Not Available**: Component uses mock data until backend APIs are implemented
2. **Database Menu Entry**: Must be added manually by DBA for navigation search to work
3. **Filter Options**: Currently hardcoded; will be loaded from API when available
4. **Date Picker Inline Editing**: Currently displays dates as read-only text; future enhancement could add inline datepickers

## Future Enhancements

- Inline date picker editing in the table
- Bulk parameter import/export
- Parameter validation rules (e.g., Max must be >= Min)
- Undo/redo for drag-drop operations
- Keyboard shortcuts for common actions
- Export configuration to CSV/Excel

## Support

For questions or issues:

- JIRA: MLT-13333
- Component Owner: Development Team
- Last Updated: 2025-05-30
