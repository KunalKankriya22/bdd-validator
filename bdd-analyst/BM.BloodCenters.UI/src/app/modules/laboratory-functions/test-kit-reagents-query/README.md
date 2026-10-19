# Test Kit Reagents Query

**Module**: Laboratory Functions
**Mnemonic**: REAGQ
**JIRA Ticket**: MLT-12563
**Generated**: 2026-05-27

## Overview

The **Test Kit Reagents Query** module provides a read-only interface for querying test kits, reagents, and batches used in laboratory testing. This is a migration from the Oracle Forms application (TEQREAG) to the Angular-based BM.BloodCenters.UI application.

### Key Features

- **Test Kit Search**: Query test kits by Test ID with optional date range and kit ID filters
- **Reagent Details**: View detailed reagent information (type, description, lot number) for each test kit
- **Batch Details**: View batch information (batch ID, first/last unit IDs) for units tested with specific kits
- **Date Range Filtering**: Filter test kits by creation date range
- **Pagination**: Support for paginated results with configurable page sizes (10, 25, 50, 100)
- **Accessibility**: WCAG 2.1 Level AA compliant with full keyboard navigation and ARIA attributes

## Architecture

### Component Structure

```
test-kit-reagents-query/
├── dialogs/
│   ├── reagents-dialog/
│   │   ├── reagents-dialog.ts              # Reagents modal component
│   │   ├── reagents-dialog.html            # Reagents template
│   │   └── reagents-dialog.scss            # Reagents styles
│   └── batch-details-dialog/
│       ├── batch-details-dialog.ts         # Batch details modal component
│       ├── batch-details-dialog.html       # Batch details template
│       └── batch-details-dialog.scss       # Batch details styles
├── models/
│   └── test-kit-reagents-query.model.ts   # TypeScript interfaces and DTOs
├── services/
│   ├── test-kit-reagents-query-api.service.ts       # API service
│   └── test-kit-reagents-query-api.service.spec.ts  # API service tests
├── test-kit-reagents-query.component.ts    # Main component
├── test-kit-reagents-query.component.html  # Main template
├── test-kit-reagents-query.component.scss  # Main styles
├── test-kit-reagents-query.component.spec.ts  # Component tests
└── README.md                               # This file
```

### Database Tables

The API queries the following Oracle database tables:

- `LBTESTS.TEST_KITS` - Test kit records
- `LBTESTS.USABLE_REAGENTS` - Usable reagents (virtual kits)
- `LBTESTS.TEST_KIT_REAGENTS` - Reagent details for kits
- `LBTESTS.TEST_BATCH_HDR` - Batch header information
- `LBTESTS.TESTS` - Valid test IDs (for validation)

## API Integration

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/test-kit-reagents-query` | GET | Get test kits with filters |
| `/api/test-kit-reagents-query/{testKitId}/reagents` | GET | Get reagent details |
| `/api/test-kit-reagents-query/{testKitId}/batches` | GET | Get batch details |

### Request/Response Models

#### Test Kit Query Parameters

```typescript
interface TestKitReagentQueryParams {
  testId: string;           // Required, max 10 chars
  fromDate?: string;        // Optional, ISO 8601 format
  toDate?: string;          // Optional, ISO 8601 format
  testKitId?: string;       // Optional
}
```

#### Test Kit Result DTO

```typescript
interface TestKitReagentResultDto {
  testKitId: string;
  insertDate: string;        // ISO 8601, displayed as DD-MMM-YYYY
  qcExpiryDate: string | null;
  apprLicFlag: string;       // 'Y' or 'N'
  isQcIncomplete: boolean;
}
```

#### Reagent Detail DTO

```typescript
interface ReagentDetailDto {
  reagentType: string;              // 'C' (Control), 'R' (Reagent), 'S' (Substrate)
  reagentTypeDescription: string;
  reagentCode: string;
  reagentDescription: string;
  lotNumber: string | null;
  expiryDate: string | null;
}
```

#### Batch Detail DTO

```typescript
interface BatchDetailDto {
  tbId: string;
  firstUnitId: string;
  lastUnitId: string;
  batchDate: string | null;
}
```

### Error Codes

| Error Code | Message | Trigger Condition |
|------------|---------|-------------------|
| 1227 | "Test ID not found in the system" | Test ID doesn't exist in TESTS table |
| 7022 | "From date cannot be in the future" | fromDate > chapter local date |
| 7022 | "To date cannot be in the future" | toDate > chapter local date |
| 7023 | "To date must be greater than or equal to from date" | toDate < fromDate |

## User Workflow

### 1. Search for Test Kits

1. User enters Test ID (required field, max 10 characters)
2. Test ID Description is auto-populated (read-only, currently not implemented - TODO)
3. User optionally clicks "FILTER" to expand filter panel
4. User optionally sets:
   - From Date (cannot be in future)
   - To Date (cannot be in future, must be >= From Date)
   - Test Kit ID (specific kit filter)
5. User clicks "SEARCH" or presses Enter
6. System displays results in paginated table

### 2. View Reagent Details

1. User clicks "SEE REAGENTS" button for a test kit
2. System opens Reagents Dialog showing:
   - Reagent type (C - Control, R - Reagent, S - Substrate)
   - Reagent description
   - Kit lot number
   - Lot number
3. User clicks "Close" to dismiss dialog

### 3. View Batch Details

1. User clicks "BATCH DETAILS" button for a test kit
2. System opens Batch Details Dialog showing:
   - Test Kit ID (in header)
   - Batch ID
   - First Unit ID
   - Last Unit ID
3. User clicks "Close" to dismiss dialog

### 4. Clear Filters

1. User clicks "CLEAR" button
2. System resets all filters and clears results

## Validation Rules

### Field Validation

| Field | Validation | Error Message |
|-------|------------|---------------|
| Test ID | Required | "Test ID is required" |
| Test ID | Max 10 characters | "Test ID cannot exceed 10 characters" |
| Test ID | Must exist in LBTESTS.TESTS | "Test ID not found in the system" (Error 1227) |
| From Date | Cannot be in future | "From date cannot be in the future" (Error 7022) |
| To Date | Cannot be in future | "To date cannot be in the future" (Error 7022) |
| To Date | Must be >= From Date | "To date must be greater than or equal to from date" (Error 7023) |

### Date Formatting

- **Display Format**: DD-MMM-YYYY (e.g., 15-JUN-2024)
- **API Format**: YYYY-MM-DD (ISO 8601)
- **User Input**: Supports multiple formats via Angular Material datepicker

## Accessibility Features

### WCAG 2.1 Level AA Compliance

✅ **Keyboard Navigation**
- All interactive elements are keyboard accessible
- Tab order follows visual layout
- Escape key closes dialogs

✅ **Screen Reader Support**
- Proper ARIA attributes on all elements
- aria-labelledby for form fields and sections
- aria-describedby for error messages
- aria-invalid on invalid fields
- role="alert" for error containers
- role="status" for loading and empty states

✅ **Focus Management**
- Focus moves to first invalid field on form submission
- Modal dialogs trap focus
- Focus restored after dialog close

✅ **Unique IDs**
- Static counter pattern ensures unique IDs across multiple component instances
- Prevents ID collisions in ARIA references

✅ **Color Contrast**
- All text meets WCAG AA contrast ratios
- Error states use sufficient color contrast

## Testing

### Unit Tests Coverage

✅ **API Service Tests** (`test-kit-reagents-query-api.service.spec.ts`)
- Test kit fetching with various filters
- Reagent details retrieval
- Batch details retrieval
- Error handling for all endpoints
- Empty result handling

✅ **Component Tests** (`test-kit-reagents-query.component.spec.ts`)
- Form initialization and validation
- Search functionality
- Filter panel toggle
- Clear functionality
- Dialog interactions (Reagents and Batch Details)
- Date formatting
- Pagination
- Loading states
- Error states
- Empty states
- Accessibility attributes
- Unique ID generation

### Running Tests

```bash
# Run all tests
ng test

# Run specific test file
ng test --include=**/test-kit-reagents-query.component.spec.ts

# Run with coverage
ng test --code-coverage
```

## Configuration

### Route Configuration

**Route Key**: `TEST_KIT_REAGENTS_QUERY`
**Path**: `/laboratory-functions/test-kit-reagents-query`
**Mnemonic**: `REAGQ`

### API Constants

```typescript
TEST_KIT_REAGENTS_QUERY: {
  GET_TEST_KITS: '/api/test-kit-reagents-query',
  GET_REAGENTS: (testKitId: string) => `/api/test-kit-reagents-query/${encodeURIComponent(testKitId)}/reagents`,
  GET_BATCHES: (testKitId: string) => `/api/test-kit-reagents-query/${encodeURIComponent(testKitId)}/batches`,
}
```

### Navigation Configuration

To enable navigation search, add the following to Oracle database:

```sql
-- Add Test Kit Reagents Query to navigation menu
-- Mnemonic: REAGQ

INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID, FCN_ID, DESCRIP, SEQUENCE, MNEMONIC, REMARKS
)
SELECT
  {parent_menu_id},
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'Test Kit Reagents Query',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = {parent_menu_id}),
  'REAGQ',
  'Query test kits, reagents, and batches for laboratory testing'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'REAGQ');

COMMIT;
```

## Future Enhancements

### TODO Items

1. **Test ID Dropdown**
   - Currently uses text input
   - Need endpoint to fetch valid Test IDs for dropdown: `GET /api/test-kit-reagents-query/test-ids`
   - Auto-populate Test ID Description on selection

2. **Export Functionality**
   - Export test kits to CSV/Excel
   - Export reagent details for a kit
   - Export batch details for a kit

3. **Advanced Filtering**
   - Filter by Appr/Lic Flag
   - Filter by QC status (complete/incomplete)
   - Filter by expiry date range

4. **Sorting**
   - Server-side sorting on all table columns
   - Client-side sorting for small datasets

5. **Server-Side Pagination**
   - Currently using client-side pagination
   - Implement server-side pagination for large datasets

## Troubleshooting

### Common Issues

**Issue**: "Test ID not found in the system" error
**Solution**: Verify Test ID exists in LBTESTS.TESTS table with valid effective/termination dates

**Issue**: Date validation errors
**Solution**: Ensure dates are not in the future and toDate >= fromDate

**Issue**: Empty results
**Solution**: Verify filter criteria, check date ranges, ensure test kits exist for the specified test ID

**Issue**: Dialog not opening
**Solution**: Check console for errors, verify MatDialog is provided in component

## References

- **API Documentation**: `test-kit-reagent-query-api-documentation.md`
- **JIRA Ticket**: MLT-12563
- **Figma Design**: See screenshots in `figma_screens/MLT-12563/`
- **Oracle Forms**: TEQREAG
- **Database Tables**: LBTESTS schema

## Changelog

### 2026-05-27 - Initial Implementation
- Created main component with search and filter functionality
- Implemented Reagents Dialog for viewing reagent details
- Implemented Batch Details Dialog for viewing batch information
- Added API service with full error handling
- Created comprehensive unit tests
- Added route configuration and mnemonic mapping
- Full WCAG 2.1 Level AA accessibility compliance
