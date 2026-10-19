import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '../../../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '../../../../../shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig } from '../../../../../shared/interfaces/data-table.interface';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { MenuService } from '../../../../../shared/services/menu.service';
import { HeaderService } from '../../../../../shared/services/header.service';
import { DeleteCryoUnitsService } from './services/delete-cryo-units.service';
import { CryoWorksheetUnit, CryoWorksheetLovDto } from './models/delete-cryo-units.model';
import { SearchBar, SearchBarConfig } from '../../../../../shared/components/search-bar/search-bar';
import { DataTable } from '../../../../../shared/components/data-table/data-table';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '../../../../../shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ROUTE_REGISTRY } from '../../../../../core/constants/route-registry';
import { RouteKey } from '../../../../../core/constants/route-keys';

/**
 * Delete Units from CRYO Worksheet Component (DELCRYO)
 *
 * Purpose: Delete units from a CRYO worksheet that were entered into the system
 *
 * Features:
 * - Search by CRYO Worksheet ID
 * - Display units in worksheet with checkboxes
 * - Multi-select deletion with confirmation
 * - Search/filter by Unit ID
 * - Custom pagination support
 */
@Component({
  selector: 'app-delete-units-from-cryo-worksheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
  ],
  templateUrl: './delete-units-from-cryo-worksheet.html',
  styleUrl: './delete-units-from-cryo-worksheet.scss',
})
export class DeleteUnitsFromCryoWorksheetComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `delete-cryo-worksheet-${DeleteUnitsFromCryoWorksheetComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  // Dependency injection
  private readonly snackbarService = inject(SnackbarService);
  private readonly menuService = inject(MenuService);
  private readonly headerService = inject(HeaderService);
  private readonly service = inject(DeleteCryoUnitsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // ViewChild reference to DataTable for direct access to clear selections
  @ViewChild(DataTable) private dataTable?: DataTable<CryoWorksheetUnit>;

  // Form controls
  protected readonly worksheetIdControl = new FormControl<string>('', [Validators.required]);

  // Search bar configuration
  protected readonly searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by unit ID',
    minLength: 0, // Search immediately as user types
    ariaLabel: 'Search units by unit ID',
    debounceTime: 300,
    searchOnEnterOnly: false,
  };

  // Signals for state management
  protected readonly isLoading = signal<boolean>(false);
  protected readonly hasRetrieved = signal<boolean>(false); // Track if user has clicked retrieve at least once
  protected readonly worksheetLovItems = signal<CryoWorksheetLovDto[]>([]); // Available worksheet LOV items
  protected readonly worksheetUnits = signal<CryoWorksheetUnit[]>([]);
  protected readonly searchText = signal<string>('');
  protected readonly filteredUnits = computed(() => {
    const units = this.worksheetUnits();
    const searchTerm = this.searchText().toLowerCase();

    if (!searchTerm) {
      return units;
    }

    return units.filter(unit =>
      unit.unitId.toLowerCase().includes(searchTerm)
    );
  });

  // Selected units (from DataTable selectionChange event)
  protected readonly selectedUnits = signal<CryoWorksheetUnit[]>([]);

  // External selection control (to clear checkboxes)
  protected readonly externalSelectedIds = signal<Set<string>>(new Set());

  // Selection state (computed from selectedUnits)
  protected readonly selectedCount = computed(() => this.selectedUnits().length);
  protected readonly hasSelection = computed(() => this.selectedCount() > 0);

  // Table configuration (matches Figma design - only 3 columns)
  protected tableConfig: DataTableConfig<CryoWorksheetUnit> = {
    caption: 'CRYO worksheet units',
    columns: [
      {
        key: 'sequence',
        header: 'Sequence (0)',
        sortable: true,
        width: '120px'
      },
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: false,
        width: '200px'
      },
      {
        key: 'collectionDate',
        header: 'Collection Date',
        sortable: false,
        width: '180px'
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'sequence',
      direction: 'A',
    },
    stickyHeader: true,
    enableSelection: true,
    selectionKey: 'unitId',
    showPagination: true,
    emptyMessage: 'No units found',
    loadingMessage: 'Loading worksheet units...',
  };

  // Page header configuration (title and subtitle from mnemonic)
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  constructor() {
    // Update page header config when menu data is loaded
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.DeleteUnitsFromCryoWorksheet].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    // Load available worksheet IDs on component initialization
    // Note: API requires authentication - worksheet LOV will load after user authenticates
    this.loadWorksheetIds();
    this.subscribeToChapterChanges();
  }

  /**
   * Load available CRYO worksheet IDs (last 21 days with un-thawed units)
   */
  private loadWorksheetIds(): void {
    this.service.getWorksheets(100, 0) // Load up to 100 worksheets
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.worksheetLovItems.set(response.data);
        },
        error: (error) => {
          // Don't show error on initial load - API might not be ready or endpoint not implemented yet
          console.warn('Failed to load worksheet IDs:', error);

          // Optionally show error message based on status
          if (error.status === 404) {
            console.info('Backend API endpoint not yet implemented - using empty worksheet list');
          } else if (error.status === 401) {
            console.info('Authentication required - worksheet list will load after login');
          } else {
            this.snackbarService.showError(
              error?.error?.message || 'Failed to load worksheet IDs'
            );
          }
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Handle chapter change - reload worksheet LOV and clear form
        this.onClearWorksheet();
        this.loadWorksheetIds();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle worksheet ID retrieval
   */
  protected onRetrieveWorksheet(): void {
    const worksheetId = this.worksheetIdControl.value?.trim();

    if (!worksheetId) {
      this.worksheetIdControl.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.hasRetrieved.set(true); // Mark that retrieve has been clicked
    this.selectedUnits.set([]);
    this.externalSelectedIds.set(new Set()); // Clear checkboxes

    // Fetch all units for the worksheet (using high take value for full dataset)
    this.service.getWorksheetUnits(worksheetId, 1000, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.worksheetUnits.set(units);
          this.updateTablePagination();
          this.isLoading.set(false);
          this.cdr.detectChanges();

          if (units.length === 0) {
            this.snackbarService.showInfo('No un-thawed units found in this worksheet');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.handleApiError(error, 'Failed to retrieve worksheet units');
        },
      });
  }

  /**
   * Clear worksheet and reset form
   */
  protected onClearWorksheet(): void {
    this.worksheetIdControl.reset();
    this.searchText.set('');
    this.worksheetUnits.set([]);
    this.selectedUnits.set([]);
    this.externalSelectedIds.set(new Set()); // Clear checkboxes
    this.hasRetrieved.set(false); // Reset to show initial empty state
    this.updateTablePagination();
  }

  /**
   * Handle search event from search bar
   */
  protected onSearch(searchTerm: string): void {
    this.searchText.set(searchTerm);
    this.updateTablePagination();
  }

  /**
   * Handle selection change from DataTable
   */
  protected onSelectionChange(units: CryoWorksheetUnit[]): void {
    this.selectedUnits.set(units);
    const selectedIds = new Set(units.map(u => u.unitId));
    this.externalSelectedIds.set(selectedIds);
  }

  /**
   * Handle sort change from DataTable
   */
  protected onSortChange(event: { column: string; direction: 'A' | 'D' | 'default' }): void {
    // Update tableConfig with new sort settings
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction,
      },
    };

    // Sort the worksheetUnits array
    const units = [...this.worksheetUnits()];

    if (event.direction === 'default') {
      // No sorting - use original order (by sequence number)
      units.sort((a, b) => a.sequence - b.sequence);
    } else {
      const sortKey = event.column as keyof CryoWorksheetUnit;
      units.sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        // Handle different data types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return event.direction === 'A' ? aValue - bValue : bValue - aValue;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return event.direction === 'A' ? comparison : -comparison;
        }

        return 0;
      });
    }

    this.worksheetUnits.set(units);
  }

  /**
   * Clear all selections
   */
  protected clearAllSelections(): void {
    // Clear selected units
    this.selectedUnits.set([]);

    // CRITICAL: Directly reset DataTable's internal selection state
    if (this.dataTable) {
      // Clear DataTable's internal flags and selectedIds
      this.dataTable['selectedIds'].clear();
      this.dataTable['selectedRows'] = [];
      this.dataTable['isAllSelected'] = false;
      this.dataTable['isAllPagesSelected'] = false;
    }

    // Update external selection IDs to empty Set
    this.externalSelectedIds.set(new Set<string>());

    // Force change detection to update UI
    this.cdr.detectChanges();
  }

  /**
   * Update table pagination totalRecords
   */
  private updateTablePagination(): void {
    const unitCount = this.worksheetUnits().length;

    this.tableConfig = {
      ...this.tableConfig,
      columns: [
        {
          ...this.tableConfig.columns[0],
          header: `Sequence (${unitCount})`,
        },
        ...this.tableConfig.columns.slice(1),
      ],
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: this.filteredUnits().length,
        pageIndex: 0, // Reset to first page
      },
    };
  }

  /**
   * Delete selected units (with confirmation dialog)
   */
  protected onDeleteSelected(): void {
    const selectedIds = this.selectedUnits().map(unit => unit.unitId);
    const worksheetId = this.worksheetIdControl.value?.trim();

    if (!worksheetId) {
      this.snackbarService.showError('No worksheet ID specified');
      return;
    }

    if (selectedIds.length === 0) {
      this.snackbarService.showError('Please select at least one unit to delete');
      return;
    }

    // Show confirmation dialog before destructive operation
    const dialogData: ConfirmActionDialogData = {
      title: 'Delete Units from CRYO Worksheet',
      message: `You are about to permanently delete ${selectedIds.length} unit(s) from worksheet ${worksheetId}.`,
      detail: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.performDelete(worksheetId, selectedIds);
      }
    });
  }

  /**
   * Perform the actual delete operation
   */
  private performDelete(worksheetId: string, unitIds: string[]): void {
    this.isLoading.set(true);

    this.service.deleteUnits({ cryoWorksheetId: worksheetId, unitIds })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Success if success=true OR errorCode='8010' (TRANSACTION COMMITTED)
          if (response.success || response.errorCode === '8010') {
            this.snackbarService.showSuccess(
              `${unitIds.length} unit(s) deleted successfully from worksheet ${worksheetId}`
            );

            this.onClearWorksheet();
            this.loadWorksheetIds();
            this.isLoading.set(false);

            setTimeout(() => {
              const selectEl = document.querySelector('.filter-field--worksheet-id .mat-mdc-select') as HTMLElement;
              selectEl?.focus();
            }, 0);
          } else {
            // API returned error in 200 response
            this.snackbarService.showError(response.message || 'Delete operation failed');
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.handleApiError(error, 'Failed to delete units');
        },
      });
  }

  /**
   * Handle API errors with specific error code mapping
   */
  private handleApiError(error: any, defaultMessage: string): void {
    const errorCode = error?.error?.errorCode;
    const errorMessage = error?.error?.message;

    if (error.status === 400) {
      // Validation errors
      switch (errorCode) {
        case '0054':
          this.snackbarService.showError(
            'Invalid worksheet ID or all units already thawed'
          );
          break;
        case '8013':
          this.snackbarService.showError('No units selected for deletion');
          break;
        default:
          this.snackbarService.showError(errorMessage || defaultMessage);
      }
    } else if (error.status === 500) {
      // Server errors
      if (errorCode === '0230') {
        this.snackbarService.showError(
          'Failed to commit changes - transaction rolled back. Please try again.'
        );
      } else {
        this.snackbarService.showError(errorMessage || 'An unexpected server error occurred');
      }
    } else {
      // Network or unknown errors
      this.snackbarService.showError(errorMessage || defaultMessage);
    }
  }
}
