# Figma to Code Guidelines

## Design System Mapping

### Component Library Priority
1. **@wellsky/atlas-ui** (Primary) - Custom enterprise components
2. **Angular Material** (Secondary) - Standard Material Design components
3. **Custom components** (Last resort) - Only when reusable component doesn't exist

## Figma → Angular Component Mapping

### Common UI Elements

| Figma Component | Angular Implementation | Notes |
|----------------|------------------------|-------|
| Button (Primary) | `<button mat-raised-button color="primary">` | Material button |
| Button (Secondary) | `<button mat-stroked-button>` | Outlined button |
| Button (Text) | `<button mat-button>` | Flat button |
| Icon Button | `<button mat-icon-button>` | Circular icon button |
| Text Input | `<mat-form-field><input matInput></mat-form-field>` | With floating label |
| Select Dropdown | `<mat-select>` | Material select |
| Checkbox | `<mat-checkbox>` | Material checkbox |
| Radio Button | `<mat-radio-button>` | Material radio |
| Date Picker | `<mat-datepicker>` | Material datepicker |
| Toggle Switch | `<mat-slide-toggle>` | Material toggle |
| Table | `<mat-table>` or `<app-data-table>` | Use shared data table component |
| Dialog/Modal | `MatDialog.open()` | Material dialog service |
| Snackbar/Toast | `NotificationService` | Use shared notification service |
| Tab Group | `<mat-tab-group>` | Material tabs |
| Accordion | `<mat-accordion>` | Material expansion panels |
| Card | `<mat-card>` | Material card |
| Progress Bar | `<mat-progress-bar>` | Material progress |
| Spinner | `<app-loading-spinner>` | Shared component |

### Layout Components

| Figma Layout | Angular Implementation | Notes |
|-------------|------------------------|-------|
| Page Header | `<app-page-header-with-breadcrumb>` | Shared component |
| Main Navigation | `<app-left-sidenav>` | Shared sidenav component |
| Header | `<app-header>` | Shared header component |
| Footer | `<app-footer>` | Shared footer component |
| Search Bar | `<app-search-bar>` | Shared search component |
| Filter Panel | Extend `FilterPanelBaseComponent` | Base class for consistency |

## Spacing & Layout

### Material Design Spacing Scale
Use multiples of 8px (Material Design standard):
- **4px** (`2` units) - Extra tight
- **8px** (`1` unit) - Tight
- **16px** (`2` units) - Normal
- **24px** (`3` units) - Medium
- **32px** (`4` units) - Loose
- **48px** (`6` units) - Extra loose

### SCSS Variables
```scss
// Use these spacing variables
$spacing-xs: 4px;   // 0.5 units
$spacing-sm: 8px;   // 1 unit
$spacing-md: 16px;  // 2 units
$spacing-lg: 24px;  // 3 units
$spacing-xl: 32px;  // 4 units
$spacing-xxl: 48px; // 6 units
```

### Flexbox Layouts
```scss
// Row layout with gap
.container {
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
}

// Column layout
.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Responsive grid
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}
```

## Typography

### Material Typography Levels
```html
<!-- Display (largest) -->
<h1 class="mat-display-4">Display 4</h1>
<h1 class="mat-display-3">Display 3</h1>
<h1 class="mat-display-2">Display 2</h1>
<h1 class="mat-display-1">Display 1</h1>

<!-- Headlines -->
<h1 class="mat-h1">Headline 1</h1>
<h2 class="mat-h2">Headline 2</h2>
<h3 class="mat-h3">Headline 3</h3>
<h4 class="mat-h4">Headline 4</h4>

<!-- Body text -->
<p class="mat-body-1">Body 1 (default)</p>
<p class="mat-body-2">Body 2 (bold)</p>

<!-- Small text -->
<span class="mat-small">Small text</span>
<span class="mat-caption">Caption text</span>
```

### Font Weights
- **Regular**: 400 (body text)
- **Medium**: 500 (subheadings)
- **Semi-bold**: 600 (emphasis)
- **Bold**: 700 (headings)

## Color System

### Theme Colors
```scss
// Material theme colors
.primary { color: var(--mat-primary); }
.accent { color: var(--mat-accent); }
.warn { color: var(--mat-warn); }

// Semantic colors
.success { color: #4caf50; }
.error { color: #f44336; }
.warning { color: #ff9800; }
.info { color: #2196f3; }
```

### Color Usage
- **Primary**: Main actions, important elements
- **Accent**: Secondary actions, highlights
- **Warn**: Destructive actions, errors
- **Success**: Confirmations, positive states
- **Warning**: Cautions, attention needed
- **Info**: Informational messages

### Text Colors
```scss
.text-primary { color: rgba(0, 0, 0, 0.87); }    // High emphasis
.text-secondary { color: rgba(0, 0, 0, 0.60); }  // Medium emphasis
.text-disabled { color: rgba(0, 0, 0, 0.38); }   // Disabled
.text-hint { color: rgba(0, 0, 0, 0.38); }       // Hints
```

## Form Components

### Form Field Structure
```html
<mat-form-field appearance="outline">
  <mat-label>First Name</mat-label>
  <input matInput [formControl]="firstNameControl">
  <mat-error *ngIf="firstNameControl.hasError('required')">
    First name is required
  </mat-error>
</mat-form-field>
```

### Form Layout Patterns

#### Two-column form
```html
<form [formGroup]="form">
  <div class="form-row">
    <mat-form-field class="form-field-half">
      <mat-label>First Name</mat-label>
      <input matInput formControlName="firstName">
    </mat-form-field>
    
    <mat-form-field class="form-field-half">
      <mat-label>Last Name</mat-label>
      <input matInput formControlName="lastName">
    </mat-form-field>
  </div>
</form>
```

```scss
.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-field-half {
  flex: 1;
}

.form-field-full {
  width: 100%;
}
```

## Table Design

### Basic Table
```html
<app-data-table 
  [columns]="columns" 
  [data]="data"
  [sortable]="true"
  [filterable]="true"
  [paginated]="true">
</app-data-table>
```

### Column Configuration
```typescript
columns = [
  { key: 'userId', label: 'User ID', sortable: true, width: '100px' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', sortable: false, width: '80px' },
  { key: 'actions', label: 'Actions', sortable: false, width: '120px' }
];
```

## Dialog/Modal Design

### Standard Dialog Structure
```typescript
const dialogRef = this.dialog.open(UserFormDialogComponent, {
  width: '600px',
  maxHeight: '90vh',
  data: { userId: '123' },
  disableClose: false,
  autoFocus: true
});

dialogRef.afterClosed().subscribe(result => {
  if (result) {
    // Handle result
  }
});
```

### Dialog Content Layout
```html
<h2 mat-dialog-title>{{ title }}</h2>

<mat-dialog-content>
  <!-- Dialog body content -->
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="onCancel()">Cancel</button>
  <button mat-raised-button color="primary" (click)="onSave()">Save</button>
</mat-dialog-actions>
```

## Icons

### Material Icons
```html
<!-- Using mat-icon -->
<mat-icon>home</mat-icon>
<mat-icon>search</mat-icon>
<mat-icon>delete</mat-icon>

<!-- With color -->
<mat-icon color="primary">add</mat-icon>
<mat-icon color="warn">delete</mat-icon>

<!-- Different sizes -->
<mat-icon class="icon-sm">info</mat-icon>  <!-- 18px -->
<mat-icon>info</mat-icon>                  <!-- 24px default -->
<mat-icon class="icon-lg">info</mat-icon>  <!-- 36px -->
```

### Icon Sizing
```scss
.icon-sm { font-size: 18px; width: 18px; height: 18px; }
.icon-md { font-size: 24px; width: 24px; height: 24px; }
.icon-lg { font-size: 36px; width: 36px; height: 36px; }
```

## Responsive Design

### Breakpoints
```scss
// Material Design breakpoints
$breakpoint-xs: 0;      // Phone (portrait)
$breakpoint-sm: 600px;  // Phone (landscape)
$breakpoint-md: 960px;  // Tablet
$breakpoint-lg: 1280px; // Desktop
$breakpoint-xl: 1920px; // Large desktop

// Usage
@media (max-width: 959px) {
  // Tablet and below
}

@media (min-width: 960px) {
  // Desktop and above
}
```

### Responsive Patterns
```scss
// Stack on mobile, row on desktop
.container {
  display: flex;
  flex-direction: column;
  
  @media (min-width: 960px) {
    flex-direction: row;
  }
}

// Hide on mobile
.desktop-only {
  display: none;
  
  @media (min-width: 960px) {
    display: block;
  }
}
```

## Accessibility (A11y)

### Required Attributes
```html
<!-- Form labels -->
<mat-label>User Name</mat-label>

<!-- ARIA labels for icon buttons -->
<button mat-icon-button aria-label="Delete user">
  <mat-icon>delete</mat-icon>
</button>

<!-- Alt text for images -->
<img src="logo.png" alt="Company Logo">

<!-- Focus management -->
<button [disabled]="loading">Submit</button>
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order should be logical
- Enter/Space should activate buttons
- Escape should close dialogs

### Color Contrast
- Text: Minimum 4.5:1 contrast ratio
- Large text (18pt+): Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

## Animation & Transitions

### Material Animations
```typescript
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
```

### Standard Durations
- **Fast**: 100-200ms (hover effects)
- **Normal**: 200-300ms (most transitions)
- **Slow**: 300-500ms (complex animations)

## Component State Indicators

### Loading States
```html
<app-loading-spinner *ngIf="loading"></app-loading-spinner>

<div *ngIf="!loading">
  <!-- Content -->
</div>
```

### Empty States
```html
<div *ngIf="!loading && data.length === 0" class="empty-state">
  <mat-icon>inbox</mat-icon>
  <p>No data available</p>
</div>
```

### Error States
```html
<div *ngIf="error" class="error-state">
  <mat-icon color="warn">error</mat-icon>
  <p>{{ error }}</p>
  <button mat-button (click)="retry()">Retry</button>
</div>
```

## Design-to-Code Workflow

### Step 1: Analyze Figma Design
- [ ] Identify reusable components
- [ ] Note spacing and layout
- [ ] Check for responsive behavior
- [ ] Review interaction states (hover, active, disabled)

### Step 2: Check for Existing Components
- [ ] Search in `@wellsky/atlas-ui`
- [ ] Search in `src/app/shared/components/`
- [ ] Check Material Design catalog

### Step 3: Implement
- [ ] Use existing components when possible
- [ ] Create custom component only if needed
- [ ] Follow naming conventions
- [ ] Match spacing from design system
- [ ] Implement all states (loading, error, empty)

### Step 4: Verify
- [ ] Visual match to Figma design
- [ ] Responsive behavior
- [ ] Accessibility requirements met
- [ ] Cross-browser compatibility
- [ ] Performance acceptable

## Common Figma → Code Patterns

### Page Header
```html
<app-page-header-with-breadcrumb
  [title]="'Manage Users'"
  [breadcrumbs]="breadcrumbs">
  <button mat-raised-button color="primary" (click)="onAddUser()">
    <mat-icon>add</mat-icon>
    Add User
  </button>
</app-page-header-with-breadcrumb>
```

### Filter Panel with Results
```html
<div class="page-container">
  <app-filter-panel 
    [form]="filterForm"
    (apply)="onApplyFilters($event)">
  </app-filter-panel>
  
  <app-filter-chips
    [filters]="activeFilters"
    (removeFilter)="onRemoveFilter($event)">
  </app-filter-chips>
  
  <app-data-table
    [columns]="columns"
    [data]="filteredData">
  </app-data-table>
</div>
```

### Form Dialog
```html
<h2 mat-dialog-title>{{ isEdit ? 'Edit User' : 'Add User' }}</h2>

<mat-dialog-content>
  <form [formGroup]="form">
    <mat-form-field appearance="outline" class="form-field-full">
      <mat-label>First Name</mat-label>
      <input matInput formControlName="firstName">
      <mat-error>First name is required</mat-error>
    </mat-form-field>
    
    <mat-form-field appearance="outline" class="form-field-full">
      <mat-label>Email</mat-label>
      <input matInput type="email" formControlName="email">
      <mat-error>Valid email is required</mat-error>
    </mat-form-field>
  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Cancel</button>
  <button mat-raised-button color="primary" 
          [disabled]="form.invalid" 
          (click)="onSave()">
    Save
  </button>
</mat-dialog-actions>
```

## Design Token Reference

When available, prefer design tokens over hardcoded values:
```scss
// ✅ CORRECT - Use design tokens
.component {
  padding: var(--spacing-md);
  color: var(--text-primary);
  border-radius: var(--border-radius-sm);
}

// ❌ WRONG - Hardcoded values
.component {
  padding: 16px;
  color: #000000;
  border-radius: 4px;
}
```

## UX Consistency Rules

### Feedback on User Actions
- Show loading state during async operations
- Display success message after successful action
- Show error message with actionable guidance
- Disable buttons during processing to prevent double-clicks

### Confirmation for Destructive Actions
Always confirm:
- Delete operations
- Data loss scenarios
- Irreversible changes

### Form Validation
- Validate on blur or submit (not on every keystroke)
- Show errors only after user interaction
- Provide clear, actionable error messages
- Highlight invalid fields visually

### Navigation
- Breadcrumbs for hierarchical navigation
- Back button where expected
- Confirm before navigating away from dirty forms
- Preserve filter/search state when returning to list views
