import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  inject,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OverlayModule } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { ValidReagentCodeService } from './services/valid-reagent-code.service';
import {
  ValidReagentCode,
  ValidReagentCodeQueryDto,
  ValidReagentCodeFilterValue,
  ValidTestLov
} from './models/valid-reagent-code.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { AddEditValidReagentCodeDialog } from './add-edit-valid-reagent-code-dialog/add-edit-valid-reagent-code-dialog';
import { ValidReagentCodeFilterPanel } from './filter-panel/valid-reagent-code-filter-panel';
import { ValidReagentCodeFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-valid-reagent-codes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    OverlayModule,
    A11yModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditValidReagentCodeDialog,
    ValidReagentCodeFilterPanel
  ],
  templateUrl: './valid-reagent-codes.html',
  styleUrls: ['./valid-reagent-codes.scss']
})
export class ValidReagentCodesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable;
  @ViewChild(AddEditValidReagentCodeDialog) dialogComponent!: AddEditValidReagentCodeDialog;

  private service = inject(ValidReagentCodeService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private pageHeaderService = inject(PageHeaderService);

  constructor() {
    // Update header config dynamically from menu-items API response
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
  private destroy$ = new Subject<void>();

  // Filter form for Test ID selection
  filterForm!: FormGroup;

  // Test ID options loaded from API
  validTests: ValidTestLov[] = [];
  filteredTests: ValidTestLov[] = [];
  isLoadingTests = signal<boolean>(false);

  // Test ID search control
  testIdSearchControl = new FormControl('');

  // Component state
  dataSource: ValidReagentCode[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  hasLoadedData = false;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ValidReagentCode | null = null;
  private sidePanelTriggerElement: HTMLElement | null = null;

  // Filter panel state
  isFilterOpen = false;
  appliedFilters: ValidReagentCodeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Current test context (required for querying)
  currentTestId: string | null = null;
  currentTestDesc: string | null = null;
  selectedTestDesc: string | null = null;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []  // Will be updated dynamically
  };

  // Search configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by reagent code or name',
    minLength: 1,
    ariaLabel: 'Search valid reagent codes by code or name',
    searchOnEnterOnly: true,
    debounceTime: 300
  };

  // Data table configuration
  tableConfig: DataTableConfig<ValidReagentCode> = {
    columns: [
      {
        key: 'reagentType',
        header: 'R Type',
        sortable: false,
        width: '100px'
      },
      {
        key: 'controlFlag',
        header: 'Control Indicator',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string | null) => value || ''
      },
      {
        key: 'reagentCode',
        header: 'Reagent Code',
        sortable: false,
        width: '130px'
      },
      {
        key: 'reagentName',
        header: 'Reagent Name',
        sortable: false,
        width: '200px'
      },
      {
        key: 'masterLotRequired',
        header: 'Kit',
        sortable: false,
        width: '80px',
        valueFormatter: (value: string) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '140px',
        valueFormatter: (value: string) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string | null) => value ? this.formatDate(value) : ''
      },
      {
        key: 'preparationFlag',
        header: 'Prep',
        sortable: false,
        width: '80px'
      },
      {
        key: 'prequalificationFlag',
        header: 'Qual',
        sortable: false,
        width: '80px',
        valueFormatter: (value: string) => value === 'Y' ? 'Yes' : 'No'
      }
    ],
    rowActions: [
      {
        action: 'edit',
        icon: 'edit',
        label: 'Edit',
        color: 'primary',
        ariaLabel: 'Edit reagent code'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'reagentCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No Results to Display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading valid reagent codes...',
    showPagination: true
  };

  // Current query parameters
  currentQuery: ValidReagentCodeQueryDto = {
    ShowTerm: 'N',
    SortColumn: null,
    SortOrder: null,
    Take: 25,
    Skip: 0
  };

  get canAddNew(): boolean {
    return !!this.currentTestId && !this.sidePanelOpen;
  }

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadTestIds();
    this.setupFormSubscriptions();
    this.setupTestIdSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize filter form
   */
  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      testId: [null]
    });
  }

  /**
   * Load Test IDs from API
   */
  private loadTestIds(): void {
    this.isLoadingTests.set(true);
    this.service.getValidTestsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.validTests = tests;
          this.filteredTests = tests;
          this.isLoadingTests.set(false);
        },
        error: (error) => {
          console.error('Error loading test IDs:', error);
          this.isLoadingTests.set(false);
          this.snackBar.open('Failed to load test IDs', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * Setup test ID search filtering
   */
  private setupTestIdSearch(): void {
    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTestIdOptions();
      });
  }

  /**
   * Filter test ID options based on search text
   */
  private filterTestIdOptions(): void {
    const searchTerm = (this.testIdSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredTests = this.validTests;
    } else {
      this.filteredTests = this.validTests.filter(test =>
        test.testId.toLowerCase().includes(searchTerm) ||
        test.testDesc.toLowerCase().includes(searchTerm)
      );
    }
  }

  /**
   * Setup form subscriptions
   */
  private setupFormSubscriptions(): void {
    // Watch for Test ID changes
    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testId => {
        if (testId) {
          const selectedTest = this.validTests.find(t => t.testId === testId);
          this.selectedTestDesc = selectedTest?.testDesc || null;
          this.currentTestId = testId;
          this.currentTestDesc = this.selectedTestDesc;

          // Update query and load data
          this.currentQuery.TestId = testId;
          this.tableConfig.pagination!.pageIndex = 0;
          this.hasLoadedData = true;
          this.updateHeaderActions();
          this.loadData();
        } else {
          this.selectedTestDesc = null;
          this.currentTestId = null;
          this.currentTestDesc = null;
          this.hasLoadedData = false;
          this.dataSource = [];
          this.updateHeaderActions();
        }
      });
  }

  /**
   * Clear all filters and reset form
   */
  onClearAll(): void {
    this.filterForm.reset();
    this.selectedTestDesc = null;
    this.currentTestId = null;
    this.currentTestDesc = null;
    this.dataSource = [];
    this.sidePanelOpen = false;
    this.hasLoadedData = false;
    this.hasError = false;
    this.appliedFilters = null;
    this.filterChips = [];
    this.updateHeaderActions();
  }

  /**
   * Toggle filter panel
   */
  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  /**
   * Apply filters from filter panel
   */
  onApplyFilters(filters: ValidReagentCodeFilterValue): void {
    // Preserve Test ID from main form (filter panel doesn't include it)
    this.appliedFilters = {
      ...filters,
      testId: this.currentTestId,
      testDesc: this.currentTestDesc
    };

    // Update current query with filter values (keep current Test ID)
    this.currentQuery = {
      ...this.currentQuery,
      TestId: this.currentTestId,
      ShowTerm: filters.showTerminated || 'N',
      ReagentType: filters.reagentType,
      ControlFlag: filters.controlFlag,
      EffectiveDatePeriod: filters.effectiveDatePeriod,
      EffectiveDateAfter: filters.effectiveDateAfter,
      TerminationDatePeriod: filters.terminationDatePeriod,
      TerminationDateAfter: filters.terminationDateAfter
    };

    // Generate filter chips using utility
    this.filterChips = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    // Update header actions based on test ID
    this.updateHeaderActions();

    // Reset pagination and load data
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  /**
   * Update header actions based on current state
   */
  private updateHeaderActions(): void {
    this.headerConfig = {
      ...this.headerConfig,
      actions: this.currentTestId ? [
        {
          label: 'ADD NEW CODE',
          icon: 'add',
          color: 'primary',
          onClick: () => this.openAddDialog()
        }
      ] : []
    };
  }

  /**
   * Remove a specific filter chip
   */
  onRemoveFilterChip(chipKey: string): void {
    // Cannot remove Test ID (it's required)
    if (chipKey === 'testId') {
      return;
    }

    this.appliedFilters = ValidReagentCodeFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    // Update query and reload
    if (this.appliedFilters) {
      this.currentQuery = {
        ...this.currentQuery,
        ShowTerm: this.appliedFilters.showTerminated || 'N',
        ReagentType: this.appliedFilters.reagentType,
        ControlFlag: this.appliedFilters.controlFlag,
        EffectiveDatePeriod: this.appliedFilters.effectiveDatePeriod,
        EffectiveDateAfter: this.appliedFilters.effectiveDateAfter,
        TerminationDatePeriod: this.appliedFilters.terminationDatePeriod,
        TerminationDateAfter: this.appliedFilters.terminationDateAfter
      };
    }
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  /**
   * Clear all filters (except Test ID)
   */
  onClearAllFilters(): void {
    if (!this.appliedFilters) return;

    // Keep Test ID but reset other filters
    this.appliedFilters = {
      testId: this.appliedFilters.testId,
      testDesc: this.appliedFilters.testDesc,
      showTerminated: null,
      reagentType: null,
      controlFlag: null,
      effectiveDatePeriod: null,
      effectiveDateAfter: null,
      effectiveDateBefore: null,
      terminationDatePeriod: null,
      terminationDateAfter: null,
      terminationDateBefore: null
    };

    this.filterChips = ValidReagentCodeFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.currentQuery = {
      ...this.currentQuery,
      TestId: this.appliedFilters.testId,
      ShowTerm: 'N',
      ReagentType: null,
      ControlFlag: null,
      EffectiveDatePeriod: null,
      EffectiveDateAfter: null,
      TerminationDatePeriod: null,
      TerminationDateAfter: null
    };
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  /**
   * Handle search event
   */
  onSearch(searchTerm: string): void {
    this.currentQuery = {
      ...this.currentQuery,
      SearchKeyword: searchTerm || null
    };

    // Reset pagination
    this.tableConfig.pagination!.pageIndex = 0;

    this.loadData();
  }

  /**
   * Handle page change event
   */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
      this.currentQuery.Take = event.pageSize;
      this.currentQuery.Skip = event.pageIndex * event.pageSize;
    }
    this.loadData();
  }

  /**
   * Handle sort change event
   */
  onSortChange(event: TableSortEvent): void {
    // Update table config for UI state
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Map frontend column names to backend PascalCase column names
    const columnMap: Record<string, string> = {
      'reagentType': 'ReagentType',
      'controlFlag': 'ControlFlag',
      'reagentCode': 'ReagentCode',
      'reagentName': 'ReagentName',
      'effDate': 'EffDate',
      'termDate': 'TermDate'
    };

    // Set query parameters for backend
    if (event.direction === 'default') {
      this.currentQuery.SortColumn = null;
      this.currentQuery.SortOrder = null;
    } else {
      this.currentQuery.SortColumn = columnMap[event.column] || event.column;
      this.currentQuery.SortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    // Reset to first page when sorting changes
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  /**
   * Handle row action (edit)
   */
  onRowAction(event: TableRowActionEvent<ValidReagentCode>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    if (event.action === 'edit') {
      this.openEditDialog(event.row);
    }
  }

  /**
   * Load data from API
   */
  loadData(): void {
    if (!this.currentTestId) {
      // Test ID is required - cannot load data
      this.dataSource = [];
      this.tableConfig.pagination!.totalRecords = 0;
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.service
      .getAll(this.currentQuery)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load valid reagent codes. Please try again.';
          this.showErrorMessage(this.errorMessage);
        }
      });
  }

  /**
   * Open add dialog
   */
  openAddDialog(): void {
    if (!this.currentTestId) {
      this.showErrorMessage('Please select a Test ID from filters first.');
      return;
    }

    this.sidePanelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  /**
   * Open edit dialog
   */
  openEditDialog(data: ValidReagentCode): void {
    this.sidePanelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = data;
    this.sidePanelOpen = true;
  }

  /**
   * Close side panel
   */
  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.sidePanelTriggerElement) {
      setTimeout(() => this.sidePanelTriggerElement?.focus());
      this.sidePanelTriggerElement = null;
    }
  }

  /**
   * Handle save success from dialog
   * @param addAnother - true if "Save and Add Another" was clicked, false for regular save
   */
  onSaveSuccess(addAnother: boolean = false): void {
    // Reload data to show the newly added/updated record
    this.loadData();

    if (addAnother) {
      // Keep the panel open in 'add' mode for adding another record
      // The form has already been reset by the dialog component
      this.sidePanelMode = 'add';
      this.sidePanelData = null;
      // Panel stays open
    } else {
      // Regular save - close the panel
      this.closeSidePanel();
    }
  }

  /**
   * Handle mode change from dialog
   */
  onModeChange(mode: 'add' | 'edit'): void {
    this.sidePanelMode = mode;
  }

  /**
   * Format date to DD-MON-YYYY
   */
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
