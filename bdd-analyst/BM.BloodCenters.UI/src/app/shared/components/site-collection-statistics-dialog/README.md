# Site Collection Statistics Dialog (DRWSSTAT)

**JIRA Ticket**: MLT-10976
**API Documentation**: `site-collection-statistics-api-documentation.md`
**Component Type**: Dialog (Modal)
**Mnemonic**: DRWSSTAT

## Overview

The Site Collection Statistics dialog provides comprehensive statistics for blood donation collection sites with date range filtering. It features a two-tab interface with master-detail layout for viewing site statistics, donation breakdowns, and unit-level details with venipuncture attributes.

## Features

- **Date Range Filtering**: Filter statistics by start/end date with optional site selection
- **Two-Tab Interface**:
  - **General Tab**: Master-detail layout showing site statistics and donation breakdown
  - **Units Tab**: Unit-level details with venipuncture attributes (01-08)
- **Interactive Tables**: Clickable rows with selection highlighting
- **Real-time Breakdown**: Click site row to view donation type/procedure breakdown
- **Accessibility**: WCAG 2.1 Level AA compliant with unique IDs and ARIA attributes
- **Responsive Design**: Adapts to different screen sizes

## Files

| File | Description |
|------|-------------|
| `site-collection-statistics-dialog.ts` | Main dialog component (TypeScript) |
| `site-collection-statistics-dialog.html` | Template with filters, tabs, and tables |
| `site-collection-statistics-dialog.scss` | Styles with Material theme |
| `site-collection-statistics-dialog.spec.ts` | Comprehensive unit tests |
| `site-collection-statistics-page.ts` | Example test page component |
| `index.ts` | Barrel export |
| `README.md` | This documentation |

## Related Files

| File | Location | Purpose |
|------|----------|---------|
| `site-collection-statistics.model.ts` | `src/app/shared/models/` | TypeScript interfaces and DTOs |
| `site-collection-statistics.service.ts` | `src/app/shared/services/` | API service with 5 endpoints |
| `site-collection-statistics.service.spec.ts` | `src/app/shared/services/` | Service unit tests |
| `api.constants.ts` | `src/app/core/constants/` | API endpoint constants |

## Usage

### Opening the Dialog

```typescript
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SiteCollectionStatisticsDialog } from '@shared/components/site-collection-statistics-dialog';
import { SiteCollectionStatisticsDialogData } from '@shared/models/site-collection-statistics.model';

export class YourComponent {
  private readonly dialog = inject(MatDialog);

  openSiteCollectionStatistics(): void {
    const dialogRef = this.dialog.open(SiteCollectionStatisticsDialog, {
      width: '95vw',
      maxWidth: '1600px',
      height: '90vh',
      disableClose: false,
      data: null, // Or provide initial filters
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed', result);
    });
  }
}
```

### With Pre-filled Data

```typescript
openWithFilters(): void {
  const dialogRef = this.dialog.open(SiteCollectionStatisticsDialog, {
    width: '95vw',
    maxWidth: '1600px',
    height: '90vh',
    data: {
      siteId: 'SITE001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    } as SiteCollectionStatisticsDialogData,
  });
}
```

## API Integration

The dialog integrates with 5 API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/site-collection-statistics` | GET | Main statistics with totals |
| `/api/site-collection-statistics/donation-breakdown` | GET | Donation breakdown by type/procedure |
| `/api/site-collection-statistics/unit-details` | GET | Unit details with venipuncture attributes |
| `/api/site-collection-statistics/goals` | GET | Goal comparison (future use) |
| `/api/site-collection-statistics/sites` | GET | Sites dropdown (LOV) |

## Data Flow

1. **Initialization**:
   - Load sites dropdown from `/sites` endpoint
   - Initialize form with optional dialog data

2. **Retrieve Statistics**:
   - User fills From Date and To Date (required)
   - Optionally selects Site ID
   - Click RETRIEVE to fetch statistics from `/api/site-collection-statistics`
   - Display site statistics table with totals row

3. **View Breakdown**:
   - Click site statistics row
   - Fetch donation breakdown from `/donation-breakdown`
   - Display breakdown in right panel

4. **Show Units**:
   - Select site row, click SHOW UNITS button
   - Switch to Units tab
   - Fetch unit details from `/unit-details`
   - Display units table with venipuncture attributes

## UI Components

### Filter Section

- **Site ID**: Dropdown (optional, defaults to "All Sites")
- **Name**: Read-only field (auto-populated from Site ID)
- **From Date**: Required datepicker (DD-MMM-YYYY format)
- **To Date**: Required datepicker (DD-MMM-YYYY format)
- **RETRIEVE**: Primary button to fetch data
- **CLEAR ALL**: Button to reset filters and data

### General Tab

**Two-Panel Layout** (60% left, 40% right):

**Left Panel - Site Statistics Table**:
- Columns: Site ID, Name, Collection Date, Actual Draw, Actual Deferral
- Total row showing sums
- Clickable rows with selection highlighting
- Max height: 400px with vertical scroll

**Right Panel - Donation Breakdown Table**:
- Header: "Site ID: {selectedSiteId}"
- Columns: Donation Type, Procedure Code, Count
- Populated when site row is selected

### Units Tab

**Full-Width Table**:
- Columns: Unit ID, Collection Date, Donation Type, Procedure Type, 01-08 (venipuncture attributes)
- Max height: 500px with horizontal/vertical scroll
- Venipuncture attributes show "5" for "Y", empty for null

### Footer Actions

- **CLOSE**: Close dialog
- **CLEAR**: Clear selection and breakdown data
- **SHOW UNITS**: Navigate to Units tab (disabled if no row selected)

## Venipuncture Attributes

The Units tab displays 8 venipuncture attribute columns:

| Code | Attribute | Description |
|------|-----------|-------------|
| 01 | difficultStick | Difficult stick encountered |
| 02 | doubleStick | Double stick required |
| 03 | od | OD (Overdraw/Other Difficulty) |
| 04 | qns | QNS (Quantity Not Sufficient) |
| 05 | nb | NB (No Bleed) |
| 06 | nuc | NUC (Not Used/Collected) |
| 07 | rbcsNotReturned | RBCs not returned |
| 08 | qnsLessThan175 | QNS less than 175ml |

## Validation

- **Required Fields**: From Date, To Date (marked with red asterisk)
- **Date Range**: To Date cannot be before From Date
- **Site ID**: Must exist in database if provided (validated by API)

## Error Handling

Error codes from API documentation:

| Code | Message | Trigger |
|------|---------|---------|
| 0080 | Field must be entered | Missing required field |
| 7023 | End date cannot be before start date | Date validation |
| 7029 | Start date cannot be after end date | Date validation |
| 9188 | No records found | Empty result set |
| 11273 | Site ID not found | Invalid site ID |

Errors are displayed via SnackbarService in the top-right corner.

## Accessibility

- **Unique IDs**: Static counter pattern ensures unique IDs across instances
- **ARIA Attributes**:
  - `aria-labelledby` on dialog container
  - `aria-required` on required fields
  - `aria-invalid` on invalid fields
  - `aria-describedby` linking errors to fields
  - `role="alert"` on error messages
  - `role="status"` on loading states
- **Keyboard Navigation**: Full keyboard support via DialogTabs component
- **Screen Reader Support**: Labels, hints, and announcements
- **Focus Management**: First invalid field receives focus on validation error

## Testing

### Unit Tests

Run tests with:
```bash
ng test --include=**/site-collection-statistics*.spec.ts
```

Test coverage includes:
- Initialization and form setup
- Form validation
- Data retrieval and error handling
- Row selection and breakdown loading
- Tab navigation
- Loading states
- Accessibility features
- Unique ID generation
- Helper functions

### Manual Testing Checklist

- [ ] Dialog opens with correct dimensions
- [ ] Sites dropdown loads
- [ ] Date pickers show DD-MMM-YYYY format
- [ ] Required field validation works
- [ ] RETRIEVE fetches data with correct date range
- [ ] Site row selection highlights correctly
- [ ] Donation breakdown loads on row click
- [ ] SHOW UNITS switches to Units tab
- [ ] Units table displays venipuncture attributes
- [ ] CLEAR ALL resets form and data
- [ ] CLEAR clears selection only
- [ ] CLOSE closes dialog
- [ ] Error messages display in top-right snackbar
- [ ] Tables scroll correctly
- [ ] Totals row shows correct sums
- [ ] Responsive layout works on smaller screens

## Performance Considerations

- **No Pagination**: Data is filtered by date range, so result sets should be manageable
- **Table Scrolling**: Max heights (400px, 500px) prevent DOM overload
- **Lazy Loading**: Breakdown and units only load when requested
- **Signal-based State**: Efficient reactivity with Angular signals
- **Destroy Pattern**: Proper cleanup with `takeUntil(this.destroy$)`

## Browser Compatibility

Tested on:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## Future Enhancements

- [ ] Export to Excel/CSV functionality
- [ ] Print view
- [ ] Goals comparison integration (API endpoint exists)
- [ ] Date range presets (This Month, Last Month, etc.)
- [ ] Pagination if large datasets become an issue
- [ ] Column sorting
- [ ] Advanced filtering on Units tab

## Troubleshooting

### Dialog doesn't open
- Check MatDialog is imported in component
- Verify dialog component is imported correctly

### Sites dropdown empty
- Check API endpoint `/api/site-collection-statistics/sites`
- Verify user has chapter context

### No data retrieved
- Check date range validity
- Verify API endpoint `/api/site-collection-statistics` is accessible
- Check network tab for errors

### Breakdown doesn't load
- Ensure row is selected (highlighted)
- Check API endpoint `/api/site-collection-statistics/donation-breakdown`

### Units tab empty
- Click SHOW UNITS button after selecting a row
- Check API endpoint `/api/site-collection-statistics/unit-details`

## Contact

For questions or issues, refer to:
- **JIRA Ticket**: MLT-10976
- **API Documentation**: `site-collection-statistics-api-documentation.md`
- **Figma Designs**: MLT-10976 folder

---

**Last Updated**: 2026-05-27
**Component Version**: 1.0.0
