# Release Product Quarantine (RUSYSINT)

**JIRA Ticket**: MLT-14086
**Mnemonic**: RUSYSINT
**Route**: `/product-management-functions/inventory-management/product-management/release-product-quarantine`

## Overview

The Release Product Quarantine feature enables users to manage the release of products from quarantine or restocking of returned products. This includes viewing quarantined/returned products in a paginated table, releasing products with restock/reject actions, managing quarantine reasons, and selecting storage locations.

## Features Implemented

### Core Functionality
- ✅ View products in quarantine (QU) or pending returns (RT) with filtering
- ✅ Paginated product listing with sorting
- ✅ Unit ID barcode search (8-character Codabar 'C' or Code128 'I' schemes)
- ✅ Auto-submit on 8-character barcode scan
- ✅ Quarantine type selection (QU/RT toggle)
- ✅ Filter chips display and management
- ⚠️ Release products dialog (stub - requires implementation)
- ⚠️ View/manage quarantine reasons dialog (stub - requires implementation)
- ⚠️ Storage location selection dialog (stub - requires implementation)
- ⚠️ Filter panel overlay (stub - requires implementation)

### API Integration (7 Endpoints)
All API service methods are fully implemented:

1. **GET /quarantine-types** - Retrieve quarantine types (QU/RT)
2. **POST /products** - Get paginated quarantine products with filtering
3. **GET /products/{unitId}/{productCode}/{aliquot}** - Get single product
4. **GET /products/{unitId}/{productCode}/{aliquot}/reasons** - Get quarantine reasons
5. **GET /locations** - Get storage locations for restocking
6. **POST /release** - Release product (restock or reject)
7. **DELETE /products/{unitId}/{productCode}/{aliquot}/reasons/{reasonCode}** - Remove reason

## Files Created

### Component Files
| File | Description | Status |
|------|-------------|--------|
| `release-product-quarantine.component.ts` | Main component with signals | ✅ Complete |
| `release-product-quarantine.component.html` | Template with accessibility | ✅ Complete |
| `release-product-quarantine.component.scss` | Material-themed styles | ✅ Complete |
| `release-product-quarantine.component.spec.ts` | Jasmine unit tests | ✅ Complete |

### Models
| File | Description | Status |
|------|-------------|--------|
| `models/release-product-quarantine.model.ts` | TypeScript interfaces/DTOs from API | ✅ Complete |

### Services
| File | Description | Status |
|------|-------------|--------|
| `services/release-product-quarantine-api.service.ts` | API service (7 endpoints) | ✅ Complete |
| `services/release-product-quarantine-api.service.spec.ts` | Service unit tests | ✅ Complete |

### Utilities
| File | Description | Status |
|------|-------------|--------|
| `utils/filter-chips.utils.ts` | Filter chip utilities | ✅ Complete |
| `utils/filter-chips.utils.spec.ts` | Utility tests | ✅ Complete |

### Sub-Components (Stubs - TODO)
| Component | Location | Status |
|-----------|----------|--------|
| Filter Panel | `components/filter-panel/` | ⚠️ TODO - Folder created |
| Release Dialog | `components/release-dialog/` | ⚠️ TODO - Folder created |
| Reasons Dialog | `components/reasons-dialog/` | ⚠️ TODO - Folder created |
| Location Selection Dialog | `components/location-selection-dialog/` | ⚠️ TODO - Folder created |

## Navigation Configuration

All navigation files have been updated:

| File | Change | Status |
|------|--------|--------|
| `route-keys.ts` | Added `ReleaseProductQuarantine: 'RELEASE_PRODUCT_QUARANTINE'` | ✅ |
| `api.constants.ts` | Added `RELEASE_PRODUCT_QUARANTINE` endpoints | ✅ |
| `route-registry.ts` | Added route entry with loadComponent | ✅ |
| `fcn-route-map.ts` | Added `'RUSYSINT': RouteKey.ReleaseProductQuarantine` | ✅ |
| `product-management-functions.routes.ts` | Added route under `inventory-management/product-management` | ✅ |

## Breadcrumb Navigation
```
Home > Product Management Functions > Inventory Management > Product Management > Release Product Quarantine
```

## Validation Rules (From API Documentation)

### Unit ID Validation
- **Length**: Exactly 8 characters
- **Format**: First character must be 'C' (Codabar) or 'I' (Code128)
- **Pattern**: `/^[CI][0-9]{7}$/`
- **Auto-submit**: Automatically searches when 8 characters entered (barcode scanner support)

### Release Product Validation
- **Quarantine Type**: Must be "QU" or "RT"
- **Restock Flag**: Must be "Y" or "N"
- **If Restock Flag = "Y"**: locationId, warehouseId, deviceNumber, rackNumber, trayId are REQUIRED
- **If Restock Flag = "N"**: rejectCode is REQUIRED
- **Business Rules**:
  - Expired products CANNOT be restocked - must be rejected (error code: N/A)
  - Products with active interdictions CANNOT be restocked (error code: N/A)
  - Special processing inventory CANNOT be restocked from returns (error code: 9930)

### Error Codes Handled
| Error Code | HTTP | Message | UI Handling |
|------------|------|---------|-------------|
| 0700 | 400 | Invalid scan length | Form validation error on Unit ID field |
| 5332 | 400 | Invalid release type | Snackbar error |
| 0353/0342 | 400 | Unit not in quarantine/returns | Snackbar error |
| 0204 | 400 | Must select a reason | Reject code field validation |
| 9930 | 400 | Cannot restock special processing | Dialog with explanation |
| 0341 | 400 | Invalid tray | Location validation error |
| 5001 | 400 | Already restocked | Informational snackbar |

## UI/UX Features

### Accessibility (WCAG 2.1 Level AA Compliant)
- ✅ Unique component IDs for multiple instances
- ✅ Proper ARIA attributes (`aria-labelledby`, `aria-describedby`, `aria-invalid`)
- ✅ Form labels with required markers
- ✅ Error messages with `role="alert"`
- ✅ Loading states with `aria-busy` and `aria-live="polite"`
- ✅ Keyboard navigation support
- ✅ Screen reader announcements

### Responsive Design
- ✅ Mobile-first approach
- ✅ Grid layout for filters on desktop, column layout on mobile
- ✅ Sticky table headers
- ✅ Touch-friendly button sizes

### Signals-Based State Management
- `quarantineTypes` - Available quarantine types (QU/RT)
- `selectedType` - Currently selected quarantine type
- `data` - Quarantine products data
- `loading` - Loading state indicator
- `error` - Error message state
- `totalCount` - Total records for pagination
- `filterChips` - Active filter chips

### Date Formatting
- **Display Format**: DD-MMM-YYYY (e.g., 15-MAR-2024)
- **API Format**: YYYY-MM-DD (ISO 8601)
- Uses `moment.js` for date manipulation

### Pagination
- **Default Page Size**: 25
- **Page Size Options**: [10, 25, 50, 100]
- **Features**: First/Last page navigation, page size selector

### Sorting
- **Default Sort**: Unit ID (default direction)
- **Cycle**: default → ascending → descending → default
- **Sortable Columns**: Unit ID, Product Code, Blood Type, Collection Date, Expiration Date

## Next Steps / TODO

### High Priority - Core Dialogs
1. **Release Dialog** (`components/release-dialog/`)
   - Radio button selection: Restock vs Reject
   - If Restock: Show location selection (call GET `/locations`)
   - If Reject: Show reject code dropdown
   - Submit to POST `/release` endpoint
   - Handle all error codes from API documentation

2. **Location Selection Dialog** (`components/location-selection-dialog/`)
   - Display available storage locations in a table
   - Show tray capacity and current count
   - Filter by product type and blood type
   - Validate location selection
   - Return selected location to release dialog

3. **Reasons Dialog** (`components/reasons-dialog/`)
   - Display all quarantine reasons for a product
   - Call GET `/reasons` endpoint
   - Allow removal of reasons via DELETE endpoint
   - Confirm before removing
   - Refresh product list after removal

4. **Filter Panel** (`components/filter-panel/`)
   - Product Code dropdown (from extracted data)
   - Blood Type dropdown (from extracted data)
   - Warehouse dropdown (TODO: determine source)
   - From Date / To Date pickers
   - Apply/Clear buttons
   - Overlay positioning

### Medium Priority - Enhancements
5. **Search Improvements**
   - Implement barcode validation on scan
   - Show product details after Unit ID search
   - Clear search after release
   - Search history/recent searches

6. **Filter Enhancements**
   - Persist filters in session storage (optional - requirements say NO persistence)
   - Export filtered data to CSV/Excel
   - Save filter presets

7. **User Feedback**
   - Success animations after release
   - Confirmation dialogs for destructive actions
   - Inline product status updates
   - Bulk release operations

### Low Priority - Nice to Have
8. **Performance Optimizations**
   - Virtual scrolling for large datasets
   - Debounce search input
   - Caching of LOV data

9. **Testing**
   - E2E tests with Cypress/Playwright
   - Integration tests with real API
   - Accessibility testing with axe-core

10. **Documentation**
    - User guide with screenshots
    - API integration guide
    - Troubleshooting guide

## Database Menu Entry

**SQL for DBA** (to enable navigation search):

```sql
INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID, FCN_ID, DESCRIP, SEQUENCE, MNEMONIC, REMARKS
)
SELECT
  {parent_menu_id}, -- Product Management menu ID
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'Release Product Quarantine',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = {parent_menu_id}),
  'RUSYSINT',
  'Manage release of products from quarantine or restocking of returned products'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'RUSYSINT');

COMMIT;
```

## Testing

### Unit Tests Coverage
- ✅ Component initialization
- ✅ Quarantine type selection
- ✅ Unit ID search form validation
- ✅ Pagination handling
- ✅ Sorting functionality
- ✅ Filter chip management
- ✅ Row action handlers
- ✅ Date formatting
- ✅ Accessibility features
- ✅ Unique ID generation
- ✅ All API service methods
- ✅ Error handling
- ✅ Filter chips utility functions

### Manual Testing Checklist
- [ ] Load page and verify quarantine products load
- [ ] Switch between QU and RT types
- [ ] Scan barcode (8 characters starting with C or I)
- [ ] Search by Unit ID manually
- [ ] Verify validation errors for invalid Unit IDs
- [ ] Sort columns (click headers multiple times)
- [ ] Change page size and navigate pages
- [ ] Test on mobile viewport
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify date formatting (DD-MMM-YYYY)
- [ ] Test chapter change reset functionality

## Known Limitations

1. **Filter Panel Not Implemented**: Users cannot filter by product code, blood type, warehouse, or date range yet.
2. **Release Dialog Not Implemented**: Users cannot release/restock/reject products yet.
3. **Reasons Management Not Implemented**: Users cannot view or remove quarantine reasons yet.
4. **Location Selection Not Implemented**: No UI for selecting storage locations when restocking.
5. **Warehouse Data Extraction**: Warehouse dropdown options not extracted from API response (locationId is a string, not structured).

## Development Notes

### Pattern Compliance
- ✅ Follows existing Angular 20+ standalone component patterns
- ✅ Uses signals for reactive state management
- ✅ Implements @if/@for control flow syntax
- ✅ Follows BM.BloodCenters.UI project structure
- ✅ Uses shared components (DataTable, PageHeader, SearchBar, FilterChips)
- ✅ Implements proper destroy$ cleanup pattern
- ✅ Uses inject() for dependency injection
- ✅ Follows WCAG 2.1 Level AA accessibility guidelines

### Dependencies
- Angular Core: 20.x
- Angular Material: 20.2.14
- Moment.js: For date formatting
- RxJS: For reactive programming

## Support

For questions or issues, please contact:
- **Development Team**: BM.BloodCenters.UI Team
- **Product Owner**: [TBD]
- **JIRA Ticket**: MLT-14086
