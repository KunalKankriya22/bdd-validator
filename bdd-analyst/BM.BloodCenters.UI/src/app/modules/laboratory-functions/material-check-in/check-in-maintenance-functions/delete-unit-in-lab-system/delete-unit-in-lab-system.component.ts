import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// Shared Components
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

// Services & Models
import { DeleteUnitService } from './services/delete-unit.service';
import { ValidateUnitResponse, UnitReference } from './models/delete-unit.model';
import { DeleteUnitConfirmDialogComponent, DeleteConfirmDialogData } from './delete-unit-confirm-dialog.component';

@Component({
  selector: 'app-delete-unit-in-lab-system',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    UnitIdFieldComponent
  ],
  templateUrl: './delete-unit-in-lab-system.component.html',
  styleUrl: './delete-unit-in-lab-system.component.scss'
})
export class DeleteUnitInLabSystemComponent implements OnInit, OnDestroy {
  // ViewChild for shared component
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Dependency injection
  private readonly deleteUnitService = inject(DeleteUnitService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Unit ID label
  unitIdLabel = 'Unit ID';

  constructor() {
    // Load dynamic page header from menu API
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  // Signals for state
  readonly loading = signal<boolean>(false);
  readonly searching = signal<boolean>(false);
  readonly deleting = signal<boolean>(false);
  readonly unitFound = signal<boolean>(false);
  readonly unitData = signal<ValidateUnitResponse | null>(null);
  readonly tableData = signal<UnitReference[]>([]);
  readonly tableSearchText = signal<string>('');

  // Table search configuration
  tableSearchConfig: SearchBarConfig = {
    placeholder: 'Search',
    minLength: 1,
    ariaLabel: 'Search tables',
    searchOnEnterOnly: true,
    debounceTime: 300
  };

  // Computed
  readonly canDelete = computed(() => {
    const data = this.unitData();
    return this.unitFound() && !this.loading() && !this.deleting() &&
           data?.item?.canDelete === true;
  });

  // Filtered table data based on search
  readonly filteredTableData = computed(() => {
    const data = this.tableData();
    const searchText = this.tableSearchText().toLowerCase().trim();

    if (!searchText) {
      return data;
    }

    return data.filter(item =>
      item.tableName.toLowerCase().includes(searchText)
    );
  });

  // Data table columns - show all tables
  columns: TableColumn[] = [
    {
      key: 'tableName',
      header: 'Table Name',
      sortable: false,
      width: '50%'
    },
    {
      key: 'hasRecords',
      header: 'Unit Exists',
      sortable: false,
      width: '50%',
      valueFormatter: (value: boolean) => value ? 'Yes' : '--'
    }
  ];

  // Data table configuration
  tableConfig: DataTableConfig = {
    columns: this.columns,
    showPagination: false,
    emptyMessage: 'No data available to display ',
    noDataIcon: 'edit',
    stickyHeader: true
  };

  // Cleanup
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    // No form initialization needed - using shared component
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle unit validation from shared component
   * Automatically triggers search when unit is validated
   */
  onUnitValidated(_data: UnitValidationResponse): void {
    // Unit validated - trigger search automatically
    this.onSearch();
  }

  /**
   * Handle unit cleared event from shared component
   */
  onUnitCleared(): void {
    this.unitFound.set(false);
    this.unitData.set(null);
    this.tableData.set([]);
    this.tableSearchText.set('');
  }

  /**
   * Search for unit by ID
   * Called when user enters Unit ID in shared component
   */
  onSearch(): void {
    if (!this.unitIdField?.isValid) {
      return;
    }

    let unitId = this.unitIdField.parsedUnitId;
    if (!unitId) {
      return;
    }

    // If Unit ID is 13 characters, append check digit '-*' to make it 15 characters
    // This handles scanned barcodes that don't include the check digit
    if (unitId.length === 13) {
      unitId = unitId + '-*';
    }

    this.searching.set(true);
    this.unitFound.set(false);
    this.unitData.set(null);
    this.tableData.set([]);

    const request = { unitId };

    this.deleteUnitService.validateUnit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item?.unitExists) {
            this.unitData.set(response);
            // Show all tables (not filtered)
            this.tableData.set(response.item.unitReferences);
            this.unitFound.set(true);
          } else {
            this.showError({ error: { message: response.message || 'Unit not found in any tables' } }, 'Unit validation failed');
          }
          this.searching.set(false);
        },
        error: (err) => {
          this.searching.set(false);
          this.showError(err, 'Unit not found. Please verify the Unit ID.');
        }
      });
  }

  /**
   * Delete unit from all tables
   */
  onDelete(): void {
    const unit = this.unitData();
    if (!unit?.item?.unitId) return;

    // Show confirmation dialog
    this.showConfirmationDialog(unit.item.unitId);
  }

  /**
   * Show confirmation dialog before deleting unit
   */
  private showConfirmationDialog(unitId: string): void {
    const unit = this.unitData();
    const actualUnitId = unit?.item?.unitId || unitId;

    const dialogRef = this.dialog.open<DeleteUnitConfirmDialogComponent, DeleteConfirmDialogData, boolean>(
      DeleteUnitConfirmDialogComponent,
      {
        width: '490px',
        maxWidth: '90vw',
        hasBackdrop: true,
        disableClose: true,
        panelClass: 'delete-unit-confirm-dialog',
        data: { unitId: actualUnitId }
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.performDelete(actualUnitId);
      }
    });
  }

  /**
   * Perform the actual unit deletion
   */
  private performDelete(unitId: string): void {
    this.deleting.set(true);

    // If Unit ID is 13 characters, append check digit '-*' to make it 15 characters
    let finalUnitId = unitId;
    if (unitId.length === 13) {
      finalUnitId = unitId + '-*';
    }

    const request = {
      unitId: finalUnitId,
      confirmed: true
    };

    this.deleteUnitService.deleteUnit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Check for API-level failure even with 200 status
          if (response?.success === false) {
            const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
            const errorMessage = response?.error || response?.errorResponse?.error || response?.message || 'Failed to delete unit';
            const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
            this.snackBar.open(displayMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            this.deleting.set(false);
            return;
          }

          // Success - show success message and reset form
          this.showSuccess('Unit deleted in lab system successfully.');
          this.deleting.set(false);
          this.resetForm();
        },
        error: (err) => {
          this.deleting.set(false);
          this.showError(err, 'Failed to delete unit');
        }
      });
  }

  /**
   * Reset form to initial state
   */
  onReset(): void {
    this.resetForm();
  }

  /**
   * Handle table search
   */
  onTableSearch(searchText: string): void {
    this.tableSearchText.set(searchText);
  }

  /**
   * Focus on search input for new search
   */
  focusSearch(): void {
    this.resetForm();
  }

  /**
   * Navigate back
   */
  onCancel(): void {
    this.router.navigate(['/laboratory-functions']);
  }

  /**
   * Reset all forms and state
   */
  private resetForm(): void {
    this.unitIdField?.clear();
    this.unitFound.set(false);
    this.unitData.set(null);
    this.tableData.set([]);
    this.tableSearchText.set('');
    this.searching.set(false);
    this.deleting.set(false);
  }

  /**
   * Show success message in top right corner
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 8000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message in top right corner
   */
  private showError(error: any, defaultMessage: string = 'An error occurred'): void {
    const errorMessage = this.extractErrorMessage(error, defaultMessage);
    this.snackBar.open(errorMessage, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Extract error message from error response
   */
  private extractErrorMessage(error: any, defaultMessage: string): string {
    if (error?.error?.error?.errorCode && error?.error?.error?.errorDescription) {
      return `Error: ${error.error.error.errorCode} : ${error.error.error.errorDescription}`;
    }

    if (error?.error?.errorResponse?.errorCode && error?.error?.errorResponse?.error) {
      return `Error: ${error.error.errorResponse.errorCode} : ${error.error.errorResponse.error}`;
    }

    if (error?.error?.errorCode && error?.error?.message) {
      return `Error: ${error.error.errorCode} : ${error.error.message}`;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    return defaultMessage;
  }
}
