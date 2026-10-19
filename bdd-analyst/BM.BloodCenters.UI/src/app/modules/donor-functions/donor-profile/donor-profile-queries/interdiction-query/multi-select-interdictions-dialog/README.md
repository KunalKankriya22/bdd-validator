# Multi-Select Interdictions Dialog

A right-side panel component for querying and selecting multiple interdictions. Matches Figma design pixel-perfect.

## Overview

This component provides a filter-based query interface for selecting interdictions with:
- Filter section: Interdiction Type dropdown, Description field, AND/OR radio selection, RETRIEVE button
- Table section: Checkbox selection, sortable columns (Interdiction Code, Description, Effective Date, Termination Date)
- Footer: CLOSE and APPLY buttons

## Usage

### Opening the Dialog

```typescript
import { MatDialog } from '@angular/material/dialog';
import {
  MultiSelectInterdictionsDialogComponent,
  MultiSelectInterdictionsDialogData,
  MultiSelectInterdictionsDialogResult
} from './multi-select-interdictions-dialog/multi-select-interdictions-dialog.component';

// In your component
constructor(private dialog: MatDialog) {}

openMultiSelectDialog(): void {
  const dialogData: MultiSelectInterdictionsDialogData = {
    unitId: 'W12342402705-Q',  // The unit ID context
    mode: 'OR'                  // Default logical operation: 'AND' | 'OR'
  };

  // Track dialog state for layout management
  this.isDialogOpen = true;

  const dialogRef = this.dialog.open(MultiSelectInterdictionsDialogComponent, {
    width: '600px',                               // Fixed width (matches valid-facility-identifiers)
    height: '100vh',                              // Full height
    maxWidth: '100vw',                            // Full viewport width max
    maxHeight: '100vh',                           // Full viewport height max
    position: { right: '0', top: '0' },          // Right-side panel from top
    panelClass: 'multi-select-interdictions-drawer', // Custom styling
    hasBackdrop: false,                           // Use custom backdrop via layout
    disableClose: true,                           // Prevent accidental close
    autoFocus: false,                             // No auto-focus
    data: dialogData
  });

  dialogRef.afterClosed().subscribe((result: MultiSelectInterdictionsDialogResult) => {
    this.isDialogOpen = false;

    if (result && result.success) {
      console.log('Selected interdictions:', result.selectedInterdictions);
      console.log('Logical operation:', result.logicalOperation);

      // Process selected interdictions
      result.selectedInterdictions?.forEach(interdiction => {
        console.log(`Code: ${interdiction.interdictionCode}`);
        console.log(`Description: ${interdiction.description}`);
        console.log(`Effective: ${interdiction.effectiveDate}`);
        console.log(`Termination: ${interdiction.terminationDate}`);
      });
    }
  });
}
```

### Parent Component HTML & Styles

Add to your parent component's HTML (matches valid-facility-identifiers pattern):

```html
<!-- Layout Wrapper for Side Panel Management -->
<div class="layout-wrapper" [class.side-panel-active]="isDialogOpen">

  <!-- Backdrop Overlay -->
  <div class="drawer-backdrop" [class.active]="isDialogOpen"></div>

  <!-- Main Content Area -->
  <main class="main-content" [class.side-panel-active]="isDialogOpen">
    <!-- Your existing content here -->
  </main>

</div>
```

Add to your parent component's SCSS:

```scss
// Layout wrapper for side panel
.layout-wrapper {
  display: block;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

// Backdrop overlay
.drawer-backdrop {
  position: fixed;
  top: 64px; // Below header
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 999; // Below drawer (1000) but above content
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), visibility 0.3s;
  pointer-events: none;

  &.active {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

// Main content
.main-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}
```

Add to your parent component TypeScript:

```typescript
export class YourComponent {
  isDialogOpen = false;

  // ... rest of your component
}
```

## Component Interface

### Input Data (`MultiSelectInterdictionsDialogData`)

```typescript
interface MultiSelectInterdictionsDialogData {
  unitId: string;           // Unit ID context for the query
  mode: 'AND' | 'OR';       // Default logical operation
}
```

### Output Result (`MultiSelectInterdictionsDialogResult`)

```typescript
interface MultiSelectInterdictionsDialogResult {
  success: boolean;                            // True if APPLY clicked, false if CLOSE clicked
  selectedInterdictions?: SelectableInterdiction[];  // Selected rows (only if success=true)
  logicalOperation?: 'AND' | 'OR';             // User-selected operation (only if success=true)
}

interface SelectableInterdiction {
  selected: boolean;
  interdictionCode: string;
  description: string;
  effectiveDate: string;    // ISO format: YYYY-MM-DD
  terminationDate: string;  // ISO format: YYYY-MM-DD
}
```

## Features

### 1. Filter Section
- **Interdiction Type**: Dropdown populated from mock service (TODO: replace with real API)
- **Description**: Free text search field
- **Logical Operation**: AND/OR radio buttons (horizontal layout)
- **RETRIEVE Button**: Executes query based on filter criteria

### 2. Table Section
- **Checkbox Column**: Select/deselect individual rows or all rows
- **Sortable Columns**: Click header to sort by Interdiction Code
- **Date Format**: Displays as DD-MON-YYYY (uppercase), e.g., "11-JAN-2025"
- **Sticky Header**: Table header remains visible when scrolling

### 3. Selection Logic
- User can select multiple rows via checkboxes
- "Select All" checkbox in header
- Indeterminate state when some (but not all) rows selected
- APPLY button disabled when no selections made

### 4. Footer Actions
- **CLOSE**: Cancels and returns `{ success: false }`
- **APPLY**: Returns selected interdictions and logical operation

## Styling

The component matches the Figma design exactly:
- **Primary Color**: #228189 (teal)
- **Border Color**: #E4E7E9
- **Filter Background**: #F9FAFB
- **Required Marker**: #CB4E0D (orange/red)
- **Typography**: Roboto font family
- **Spacing**: Material Design spacing (16px, 20px, 24px)

## Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation supported (Tab, Enter, Space)
- ARIA labels on all interactive elements
- Focus management for checkbox selection
- Screen reader announcements for table actions

## API Integration (TODO)

Currently uses `InterdictionQueryMockService` for development. Replace with real service:

```typescript
// TODO: Replace in component constructor
constructor(
  private interdictionQueryService: InterdictionQueryService, // Real service
  // ...
) {}

// TODO: Replace in onRetrieve() method
this.interdictionQueryService
  .queryInterdictions({
    interdictionType: formValue.interdictionType,
    description: formValue.description
  })
  .subscribe({
    next: (results) => {
      // Map API results to SelectableInterdiction[]
      const mapped = results.map(r => ({
        selected: false,
        interdictionCode: r.code,
        description: r.description,
        effectiveDate: r.effectiveDate,
        terminationDate: r.terminationDate
      }));
      this.queryResults.set(mapped);
    },
    error: (error) => this.showErrorMessage('Failed to retrieve interdictions')
  });
```

## Testing

Run unit tests:
```bash
ng test --include='**/multi-select-interdictions-dialog.component.spec.ts'
```

All tests cover:
- Component initialization
- Form validation
- RETRIEVE functionality
- Row selection (individual and all)
- Sorting
- APPLY/CLOSE actions
- Error handling

## Related Components

- `query-interdictions-holds/components/multiple-interdiction-dialog` - Different module, different use case
- `interdiction-query.component.ts` - Parent component that opens this dialog
