# Confirmatory Release Test Results (CNRQC)

**JIRA Ticket**: MLT-12726
**Mnemonic**: CNRQC
**Route**: `/laboratory-functions/cnrqc`

## Overview

This feature provides a comprehensive QC workflow for managing confirmatory test results for blood units. It implements a session-based locking mechanism to prevent concurrent access and supports two filter modes:

1. **All Results Mode**: Filter by test series and test ID
2. **Contract/Batch Mode**: Filter by contract and batch ID

## Architecture

### Component Structure

```
cnrqc/
├── confirmatory-release-test-results.ts          # Main component
├── confirmatory-release-test-results.html        # Template
├── confirmatory-release-test-results.scss        # Styles
├── confirmatory-release-test-results.spec.ts     # Component tests
├── components/
│   └── legend-dialog/
│       ├── legend-dialog.ts                      # Legend dialog component
│       ├── legend-dialog.html                    # Dialog template
│       └── legend-dialog.scss                    # Dialog styles
├── services/
│   ├── confirmatory-qc.service.ts                # API service
│   └── confirmatory-qc.service.spec.ts           # Service tests
└── models/
    ├── qc-query-request.model.ts                 # Query request DTO
    ├── qc-query-response.model.ts                # Query response DTO
    ├── qc-unit-list-item.model.ts                # Unit list item DTO
    ├── qc-unit-detail.model.ts                   # Unit detail DTO
    ├── qc-save-request.model.ts                  # Save request DTO
    └── dropdown-options.model.ts                 # Dropdown DTOs
```

## Features

### Dual Filter Modes

- **All Results Mode**: Query by test series and test ID
- **Contract/Batch Mode**: Query by contract and batch (with "In Use" indicator)

### Session Management

- Creates a session ID on query
- Acquires database lock to prevent concurrent access
- Auto-clears session on component destroy
- Manual session clear via CLEAR ALL button

### Unit Management

- Displays units in a table with color-coded collection dates
- Inline QC flag dropdowns (Yes/No) per unit
- Warning icons for units with issues
- Click-to-select unit rows to view details

### Collection Date Color Coding

| Color  | Days | CSS Class              |
|--------|------|------------------------|
| WHITE  | 0-2  | collection-date-white  |
| YELLOW | 3-4  | collection-date-yellow |
| GREEN  | 5    | collection-date-green  |
| RED    | 6-7  | collection-date-red    |
| BLUE   | 8+   | collection-date-blue   |

### Unit Detail Panel

- Auto-loads on unit selection
- Displays batch ID, profile set, chapter, test series, and test ID
- Shows test results table with reactive tests highlighted in red
- Unit navigation (Previous/Next arrows)
- HOLDS QUERY and SAMPLES QUERY buttons (placeholders)

### QC Operations

- **RECONCILE ALL UNITS**: Auto-sets QC=Yes if reason='OK', QC=No otherwise
- **SAVE**: Commits QC flags to database and releases session lock
- **LEGEND**: Opens dialog showing collection day color codes

### Summary Stats

Footer displays:
- Total Units
- Skipped
- No Result
- SQC

## API Integration

All endpoints are documented in: `C:\WellSky\BM.BloodCenters.API\thoughts\shared\research\api-docs\cfiresqc-api-documentation.md`

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/confirmatory-qc-units/query` | POST | Query QC units (creates session) |
| `/api/v1/confirmatory-qc-units/{sessionId}/units` | GET | Get units list |
| `/api/v1/confirmatory-qc-units/{sessionId}/unit/{unitId}` | GET | Get unit detail |
| `/api/v1/confirmatory-qc-units/{sessionId}/reconcile-all` | POST | Auto-reconcile all units |
| `/api/v1/confirmatory-qc-units/{sessionId}/save` | POST | Save QC flags |
| `/api/v1/confirmatory-qc-units/{sessionId}` | DELETE | Clear session |
| `/api/v1/confirmatory-qc-units/contracts` | GET | Get contracts dropdown |
| `/api/v1/confirmatory-qc-units/batches` | GET | Get batches dropdown |
| `/api/v1/confirmatory-qc-units/test-series` | GET | Get test series dropdown |
| `/api/v1/confirmatory-qc-units/tests` | GET | Get tests dropdown |

## State Management

The component uses Angular signals for reactive state:

- `filterMode`: Current filter mode ('allResults' | 'contract')
- `sessionId`: Active session ID
- `units`: Array of QC units for table
- `selectedUnit`: Currently selected unit
- `unitDetail`: Detail data for selected unit
- `currentUnitIndex`: Index for navigation
- `loading`: Loading state
- `error`: Error message
- `summaryStats`: Summary statistics
- `qcChanges`: Tracks QC flag changes (Map)

## Accessibility

- WCAG 2.1 Level AA compliant
- All form inputs have labels with required markers
- Error messages linked with aria-describedby
- Table has proper role attributes
- Dialog focus management
- Keyboard navigation support
- Screen reader announcements for loading/error states

## Testing

### Service Tests

- All API methods tested with mock HTTP responses
- Error handling verified
- Request/response mapping validated

### Component Tests

- Initialization and form setup
- Filter mode switching
- Query operations (success/error)
- Unit selection and navigation
- QC flag changes
- Reconcile and save operations
- Accessibility attributes
- Unique ID generation

## Navigation Configuration

### Route Keys

Added to `route-keys.ts`:
```typescript
ConfirmatoryReleaseTestResults: 'CONFIRMATORY_RELEASE_TEST_RESULTS'
```

### Route Registry

Added to `route-registry.ts`:
```typescript
[RouteKey.ConfirmatoryReleaseTestResults]: {
  path: '/laboratory-functions/cnrqc',
  loadComponent: () => import('...').then((m) => m.ConfirmatoryReleaseTestResultsComponent)
}
```

### FCN Route Map

Added to `fcn-route-map.ts`:
```typescript
'CNRQC': RouteKey.ConfirmatoryReleaseTestResults
```

### Laboratory Routes

Added to `laboratory-functions.routes.ts`:
```typescript
{
  path: confirmatoryReleaseTestResultsPath,
  loadComponent: ROUTE_REGISTRY[RouteKey.ConfirmatoryReleaseTestResults].loadComponent
}
```

## Database Configuration

To enable navigation search, add the following SQL to Oracle database:

```sql
-- Add CNRQC to navigation menu
-- Mnemonic: CNRQC

INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID, FCN_ID, DESCRIP, SEQUENCE, MNEMONIC, REMARKS
)
SELECT
  [parent_menu_id],
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'Confirmatory Release Test Results',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = [parent_menu_id]),
  'CNRQC',
  'Confirmatory Release Test Results - QC workflow for blood units'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'CNRQC');

COMMIT;
```

## User Workflow

1. User selects filter mode (All Results or Contract/Batch)
2. User fills filter criteria and clicks RETRIEVE
3. System queries units, creates session, locks data
4. Main table displays units with color-coded collection dates
5. User clicks unit row → detail panel loads
6. User can navigate between units with prev/next arrows
7. User sets QC flags (Yes/No) per unit via inline dropdowns
8. User clicks RECONCILE ALL UNITS → auto-sets QC based on reason
9. User clicks SAVE → commits QC flags to database
10. System shows success toast and releases session lock

## Error Handling

- **409 Conflict**: Another QC session in progress (error 1422)
- **404 Not Found**: No QC units found (error 1420)
- **400 Bad Request**: Invalid filter mode, QC flag, or validation failure
- **500 Internal Server Error**: Commit failed (error 0230)

All errors display via snackbar notification (top-right corner).

## Known Limitations

- HOLDS QUERY and SAMPLES QUERY buttons are placeholders (not implemented)
- Filter mode toggle is controlled programmatically (no UI toggle)
- Batch ID dropdown shows "In Use" indicator but doesn't prevent selection

## Future Enhancements

- Implement HOLDS QUERY navigation
- Implement SAMPLES QUERY navigation
- Add sorting to all table columns
- Add filtering within loaded units
- Export to CSV/Excel functionality
- Print functionality

---

**Generated**: 2026-05-30
**Developer**: Claude Code (Anthropic)
**Framework**: Angular 20+ (Standalone Components with Signals)
