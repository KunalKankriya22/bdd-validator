import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators, ValidationErrors, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

import { StrongReactivityService } from './services/strong-reactivity.service';
import {
  StrongReactivityModel,
  StrongReactivityParamsDto,
  StrongReactivityFilterValue,
  StrongReactivityEditRow,
  BOUND_OPTIONS,
  EpitopeDropdownItem
} from './models/strong-reactivity.model';
import { StrongReactivityFilterPanel } from './filter-panel/strong-reactivity-filter-panel';
import { buildStrongReactivityFilterChips } from './utils/filter-chips.utils';

@Component({
  selector: 'app-associate-strong-reactivity',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    OverlayModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    DataTable,
    StrongReactivityFilterPanel
  ],
  providers: [
    StrongReactivityService,
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './associate-strong-reactivity.component.html',
  styleUrls: ['./associate-strong-reactivity.component.scss']
})
export class AssociateStrongReactivityComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('trigger', { read: CdkOverlayOrigin }) trigger!: CdkOverlayOrigin;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 2,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  // Table configuration
  tableConfig: DataTableConfig<StrongReactivityModel> = {
    columns: [],
    sortConfig: {
      column: 'epitopeId1',
      direction: 'default'
    },
    stickyHeader: true,
    emptyMessage: 'No Strong Reactivity Records Available To Display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading data...',
    showPagination: false
  };

  // Data
  dataSource: StrongReactivityEditRow[] = [];
  originalData: StrongReactivityModel[] = [];
  requestState: StrongReactivityParamsDto = {};

  // UI State
  isLoading = false;
  hasError = false;
  searchText = '';
  isEditMode = false;

  // Filter state
  appliedFilters: StrongReactivityFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  // Dropdown options
  boundOptions = BOUND_OPTIONS;
  epitopeOptions: EpitopeDropdownItem[] = [];

  // Searchable dropdown controls and filtered options
  epitopeId1SearchControl = new FormControl('');
  epitopeId2SearchControl = new FormControl('');
  boundSearchControl = new FormControl('');

  filteredEpitopeId1Options: EpitopeDropdownItem[] = [];
  filteredEpitopeId2Options: EpitopeDropdownItem[] = [];
  filteredBoundOptions = [...BOUND_OPTIONS];

  // Edit mode sorting state
  editModeSortColumn: string | null = null;
  editModeSortDirection: 'asc' | 'desc' = 'asc';

  private destroy$ = new Subject<void>();

  /**
   * Get minimum date (today's chapter local date) dynamically
   */
  get effectiveDateMinDate(): moment.Moment {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor(
    private strongReactivityService: StrongReactivityService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
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

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
    this.setupSearchFilters();
  }

  private setupSearchFilters(): void {
    // Filter Epitope ID 1 dropdown
    this.epitopeId1SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredEpitopeId1Options = this.epitopeOptions.filter(epitope =>
          epitope.epitopeId.toLowerCase().includes(term) ||
          (epitope.locus && epitope.locus.toLowerCase().includes(term))
        );
      });

    // Filter Epitope ID 2 dropdown
    this.epitopeId2SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredEpitopeId2Options = this.epitopeOptions.filter(epitope =>
          epitope.epitopeId.toLowerCase().includes(term) ||
          (epitope.locus && epitope.locus.toLowerCase().includes(term))
        );
      });

    // Filter Bond dropdown
    this.boundSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredBoundOptions = BOUND_OPTIONS.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appliedFilters = null;
        this.filterChips = [];
        this.isFilterOpen = false;
        this.searchText = '';
        this.requestState = {};
        this.isEditMode = false;

        if (this.searchBarComponent) {
          this.searchBarComponent.searchText = '';
        }

        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.pageHeaderConfig = {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: 'Associate Strong Reactivity',
      subtitle: 'Test result indicates high signal strength and confirmed reactivity.',
      actions: []
    };

    this.searchConfig = {
      placeholder: 'Search by Antigen 1 and 2',
      minLength: 1,
      ariaLabel: 'Search strong reactivity by Antigen 1 and 2',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true,
      tooltip: 'Search by Antigen 1 and 2',
      tooltipClass: 'search-antigen-tooltip'
    };

    this.tableConfig.columns = this.getTableColumns();
  }

  private getTableColumns(): TableColumn<StrongReactivityModel>[] {
    // Column widths matching Figma design
    return [
      {
        key: 'epitopeId1',
        header: 'Antigen ID 1',
        sortable: true,
        width: '100px',
        minWidth: '100px',
        maxWidth: '100px'
      },
      {
        key: 'epitopeId2',
        header: 'Antigen ID 2',
        sortable: false,
        width: '100px',
        minWidth: '100px',
        maxWidth: '100px'
      },
      {
        key: 'bound',
        header: 'Bond',
        sortable: false,
        width: '80px',
        minWidth: '80px',
        maxWidth: '80px',
        valueFormatter: (value) => {
          if (value === 'S') return 'Strong';
          if (value === 'C') return 'Cross';
          return value || '-';
        }
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '130px',
        minWidth: '130px',
        maxWidth: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '130px',
        minWidth: '130px',
        maxWidth: '130px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  loadEpitopeOptions(): void {
    this.strongReactivityService
      .getEpitopesDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (epitopes) => {
          this.epitopeOptions = epitopes || [];
          // Initialize filtered arrays
          this.filteredEpitopeId1Options = [...this.epitopeOptions];
          this.filteredEpitopeId2Options = [...this.epitopeOptions];
        },
        error: (error) => {
          this.epitopeOptions = [];
          this.filteredEpitopeId1Options = [];
          this.filteredEpitopeId2Options = [];
        }
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.strongReactivityService
      .getStrongReactivities(100, 0, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.originalData = response.data || [];
          // Map API field names to frontend field names and store original epitope IDs for updates
          // Keep epitopeIds as-is from API since we don't have locus information to build composite keys
          this.dataSource = (response.data || []).map((item: any) => {
            const row: StrongReactivityEditRow = {
              epitopeId1: item.epitopeId1,  // Keep as plain ID from API
              epitopeId2: item.epitopeId2,  // Keep as plain ID from API
              bound: item.bond || item.bound, // API returns 'bond', we use 'bound'
              effectiveDate: item.effDate || item.effectiveDate, // API returns 'effDate', we use 'effectiveDate'
              terminationDate: item.termDate || item.terminationDate, // API returns 'termDate', we use 'terminationDate'
              insertDate: item.insertDate,
              insertUser: item.insertUser,
              programId: item.programId,
              chapterId: item.chapterId,
              auditKey: item.auditKey,
              _originalEpitopeId1: item.epitopeId1, // Store original API value for updates
              _originalEpitopeId2: item.epitopeId2  // Store original API value for updates
            };

            // Create FormGroup for all fields (existing row, so isNew = false)
            row._formGroup = this.createRowFormGroup(row, false);

            return row;
          });
          this.isLoading = false;
        },
        error: (error) => {
          this.hasError = true;
          this.isLoading = false;
          this.dataSource = [];
        }
      });
  }

  onSearch(searchKeyword: string): void {
    this.searchText = searchKeyword;

    if (searchKeyword && searchKeyword.trim()) {
      // API expects 'searchKeyword' not 'searchText'
      (this.requestState as any).searchKeyword = searchKeyword.trim();
    } else {
      // Clear search if empty
      delete (this.requestState as any).searchKeyword;
    }

    delete (this.requestState as any).searchText; // Remove old parameter name if it exists

    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Map sort direction to API format (A -> ASC, D -> DESC)
    if (event.direction === 'A' || event.direction === 'D') {
      (this.requestState as any).sortDirection = event.direction === 'A' ? 'ASC' : 'DESC';
      (this.requestState as any).sortColumn = event.column;
    } else {
      // Default sort - remove sorting from request
      delete (this.requestState as any).sortDirection;
      delete (this.requestState as any).sortColumn;
    }

    this.loadData();
  }

  toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilterPanel(): void {
    this.isFilterOpen = false;
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  applyFilters(filters: StrongReactivityFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = this.convertFiltersToChips(filters);

    // Clear previous filter parameters
    delete (this.requestState as any).bond;
    delete (this.requestState as any).effDate;
    delete (this.requestState as any).effDatePeriod;
    delete (this.requestState as any).termDate;
    delete (this.requestState as any).termDatePeriod;

    // Map frontend field names to API field names
    if (filters.bound) {
      (this.requestState as any).bond = filters.bound;
    }

    // Effective date filter with period
    if (filters.effectiveDate && filters.effectivePeriod) {
      const formattedDate = this.formatDateForAPI(filters.effectiveDate);
      (this.requestState as any).effDate = formattedDate;
      (this.requestState as any).effDatePeriod = filters.effectivePeriod;
    }

    // Termination date filter with period
    if (filters.terminationDate && filters.terminationPeriod) {
      const formattedDate = this.formatDateForAPI(filters.terminationDate);
      (this.requestState as any).termDate = formattedDate;
      (this.requestState as any).termDatePeriod = filters.terminationPeriod;
    }

    this.closeFilterPanel();
    this.loadData();
  }

  removeFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    const updatedFilters = { ...this.appliedFilters };

    if (chipKey === 'bound') updatedFilters.bound = null;
    if (chipKey === 'effectiveDate') {
      updatedFilters.effectiveDate = null;
      updatedFilters.effectivePeriod = null;
    }
    if (chipKey === 'terminationDate') {
      updatedFilters.terminationDate = null;
      updatedFilters.terminationPeriod = null;
    }

    const hasAnyFilter = Object.values(updatedFilters).some(v => v !== null);

    if (hasAnyFilter) {
      this.applyFilters(updatedFilters);
    } else {
      this.clearAllFilters();
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Preserve search text and sorting, clear filters
    const searchKeyword = (this.requestState as any).searchKeyword;
    const sortColumn = (this.requestState as any).sortColumn;
    const sortDirection = (this.requestState as any).sortDirection;

    this.requestState = {};

    if (searchKeyword) {
      (this.requestState as any).searchKeyword = searchKeyword;
    }
    if (sortColumn) {
      (this.requestState as any).sortColumn = sortColumn;
    }
    if (sortDirection) {
      (this.requestState as any).sortDirection = sortDirection;
    }
    this.loadData();
  }

  private convertFiltersToChips(filters: StrongReactivityFilterValue): FilterChip[] {
    return buildStrongReactivityFilterChips(filters);
  }

  enterEditMode(): void {
    // Load epitope options if not already loaded
    if (this.epitopeOptions.length === 0) {
      this.loadEpitopeOptions();
    }

    // Create FormGroups for all existing rows that don't have one
    this.dataSource.forEach((row) => {
      if (!row._formGroup) {
        row._formGroup = this.createRowFormGroup(row, false);
      }
    });

    setTimeout(() => {
      this.isEditMode = true;
    });
  }

  cancelEdit(): void {
    setTimeout(() => {
      this.isEditMode = false;
      // Restore original data with field mapping and original IDs
      this.dataSource = this.originalData.map((item: any) => ({
        epitopeId1: item.epitopeId1,
        epitopeId2: item.epitopeId2,
        bound: item.bond || item.bound,
        effectiveDate: item.effDate || item.effectiveDate,
        terminationDate: item.termDate || item.terminationDate,
        insertDate: item.insertDate,
        insertUser: item.insertUser,
        programId: item.programId,
        chapterId: item.chapterId,
        auditKey: item.auditKey,
        _originalEpitopeId1: item.epitopeId1,
        _originalEpitopeId2: item.epitopeId2
      }));
    });
  }

  saveChanges(): void {
    if (!this.validateAllRows()) {
      this.snackBar.open('Please fix validation errors before saving', 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Only save NEW rows or MODIFIED rows (like Oracle Forms behavior)
    const rowsToSave = this.dataSource.filter(row => {
      // Check if row has any data (check both model and FormGroup)
      const hasData = row.epitopeId1 || row.epitopeId2 || row.bound || row.effectiveDate || row.terminationDate ||
                      row._formGroup?.get('epitopeId1')?.value || row._formGroup?.get('epitopeId2')?.value ||
                      row._formGroup?.get('bound')?.value || row._formGroup?.get('effDate')?.value ||
                      row._formGroup?.get('termDate')?.value;

      // Include new rows with any data
      if (row._isNew && hasData) {
        return true;
      }

      // Include modified existing rows
      if (!row._isNew && row._isModified) {
        return true;
      }

      return false;
    });

    if (rowsToSave.length === 0) {
      this.snackBar.open('No changes to save', 'DISMISS', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      setTimeout(() => {
        this.isEditMode = false;
      });
      return;
    }

    // Determine if we're creating new records, updating existing, or both
    const hasNewRows = rowsToSave.some(row => row._isNew);
    const hasModifiedRows = rowsToSave.some(row => !row._isNew && row._isModified);

    this.isLoading = true;

    this.strongReactivityService
      .batchUpdate(rowsToSave)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Handle success=false responses from backend
          if (response?.success === false) {
            const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
            const errorMessage = response?.error || response?.errorResponse?.error || response?.message || 'Failed to save changes. Please try again.';
            const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;

            this.snackBar.open(displayMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
            return;
          }

          setTimeout(() => {
            this.isEditMode = false;
          });
          this.loadData();

          // Show appropriate success message
          let successMessage = '';
          if (hasNewRows && hasModifiedRows) {
            successMessage = 'Reactivity Code created and updated successfully.';
          } else if (hasNewRows) {
            successMessage = 'Reactivity Code created successfully.';
          } else {
            successMessage = 'Reactivity Code updated successfully.';
          }

          this.snackBar.open(successMessage, 'DISMISS', {
            duration: 8000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.isLoading = false;

          // Extract error message from backend response (matching Define HLA Antigens pattern)
          const errorResponse = error?.error?.errorResponse || error?.error;
          const errorCode = errorResponse?.errorCode;
          const errorMessage = errorResponse?.error || error?.message || 'Failed to save changes. Please try again.';

          const displayMessage = errorCode
            ? `Error ${errorCode}: ${errorMessage}`
            : errorMessage;

          this.snackBar.open(displayMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  addNewRow(): void {
    const newRow: StrongReactivityEditRow = {
      epitopeId1: null,
      epitopeId2: null,
      bound: null,
      effectiveDate: null,
      terminationDate: null,
      _isNew: true
    };

    // Create FormGroup for all fields
    newRow._formGroup = this.createRowFormGroup(newRow, true);

    this.dataSource.push(newRow);

    // Scroll to bottom to show the new row
    setTimeout(() => {
      if (this.tableCard?.nativeElement) {
        const tableWrapper = this.tableCard.nativeElement.querySelector('.associate-strong-reactivity__table-wrapper');
        if (tableWrapper) {
          tableWrapper.scrollTo({
            top: tableWrapper.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  }

  deleteRow(index: number): void {
    this.dataSource.splice(index, 1);
  }

  markRowAsModified(row: StrongReactivityEditRow, index?: number): void {
    // Don't mark new rows as modified (they're already marked as new)
    if (!row._isNew) {
      row._isModified = true;
    }
  }

  /**
   * Handle epitope ID change and validate immediately
   */
  onEpitopeIdChange(row: StrongReactivityEditRow, index: number): void {
    // Mark row as modified
    this.markRowAsModified(row, index);
    // FormGroup validators will handle epitope ID validation automatically
  }

  /**
   * Get minimum effective date for a specific row
   * For new rows: today (no past dates)
   * For existing rows: null (allow all dates including past)
   */
  getEffectiveDateMin(index: number): moment.Moment | null {
    const row = this.dataSource[index];
    if (!row) {
      return this.effectiveDateMinDate.clone();
    }

    // If it's a new row, use today as minimum (no past dates)
    if (row._isNew) {
      return this.effectiveDateMinDate.clone();
    }

    // If it's an existing row, allow all dates (no minimum)
    return null;
  }

  /**
   * Get minimum termination date for a specific row
   * Returns effective date value from FormControl (termination must be >= effective)
   */
  getTerminationDateMin(index: number): moment.Moment | null {
    const row = this.dataSource[index];
    if (!row?._formGroup) {
      return null;
    }

    const effDateValue = row._formGroup.get('effDate')?.value;
    if (effDateValue) {
      // Return the effective date as minimum - termination must be on or after effective date
      return moment(effDateValue).startOf('day');
    }

    return null;
  }

  /**
   * Handle effective date change
   */
  onEffectiveDateChange(row: StrongReactivityEditRow, index: number): void {
    this.markRowAsModified(row);
  }

  /**
   * Handle termination date change
   */
  onTerminationDateChange(row: StrongReactivityEditRow, index: number): void {
    this.markRowAsModified(row);
  }



  /**
   * Create FormGroup for all fields using shared DateFieldValidationUtility
   * Matches pattern from Define HLA Antigens
   */
  private createRowFormGroup(row: StrongReactivityEditRow, isNew: boolean): FormGroup {
    // For effective date: only validate past dates for NEW rows
    const effDateValidators = [Validators.required];
    if (isNew) {
      // For new rows, add past date validator
      effDateValidators.push(DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset));
    }
    // For existing rows, allow all dates (no past date validator)

    const form = new FormGroup({
      epitopeId1: new FormControl(row.epitopeId1 || null, [Validators.required]),
      epitopeId2: new FormControl(row.epitopeId2 || null, [Validators.required]),
      bound: new FormControl(row.bound || null, [Validators.required]),
      effDate: new FormControl(row.effectiveDate || null, effDateValidators),
      termDate: new FormControl(row.terminationDate || null)
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'),
        this.epitopeIdsDifferentValidator()
      ]
    });

    // Note: We don't use setupAddModeValidators/setupEditModeValidators here because:
    // 1. They disable the Effective Date field for existing rows, but this screen requires it to be editable
    // 2. The validators are already set in FormControl creation above
    // 3. Cross-field date validation is handled by crossFieldDateRangeValidator in form validators
    // The shared DateFieldValidationUtility is used for error message formatting only

    // Subscribe to value changes to sync with model and mark as modified
    form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((values) => {
      // Sync FormControl values back to row model (for API submission)
      row.epitopeId1 = values.epitopeId1;
      row.epitopeId2 = values.epitopeId2;
      row.bound = values.bound;
      row.effectiveDate = values.effDate;
      row.terminationDate = values.termDate;

      // Mark row as modified when any value changes
      this.markRowAsModified(row);
    });

    // Subscribe to effective date changes to re-validate termination date
    form.get('effDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // Trigger cross-field validation by updating the form's validators
      form.updateValueAndValidity({ emitEvent: false });
      // Also trigger termination date validation
      form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
    });

    return form;
  }

  /**
   * Validator to ensure epitopeId1 and epitopeId2 are different
   */
  private epitopeIdsDifferentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const epitopeId1 = control.get('epitopeId1')?.value;
      const epitopeId2 = control.get('epitopeId2')?.value;

      if (epitopeId1 && epitopeId2 && epitopeId1 === epitopeId2) {
        return { epitopeIdsDifferent: true };
      }

      return null;
    };
  }

  /**
   * Get effective date error message using shared utility
   * Uses custom labels to match Define HLA Antigens pattern
   */
  getEffectiveDateError(index: number): string {
    const row = this.dataSource[index];
    if (!row?._formGroup) return '';

    return DateFieldValidationUtility.getStartDateCrossFieldError(
      row._formGroup.get('effDate'),
      'Effective Date',
      'Termination Date',
      row._formGroup.errors
    );
  }

  /**
   * Get termination date error message using shared utility
   * Uses custom labels to match Define HLA Antigens pattern
   */
  getTerminationDateError(index: number): string {
    const row = this.dataSource[index];
    if (!row?._formGroup) return '';

    return DateFieldValidationUtility.getEndDateCrossFieldError(
      row._formGroup.get('termDate'),
      'Termination Date',
      'Effective Date',
      row._formGroup.errors
    );
  }

  /**
   * Handle effective date input for validation
   * Uses shared utility to trigger parse errors
   */
  onEffectiveDateInput(event: Event, index: number): void {
    const row = this.dataSource[index];
    if (row?._formGroup) {
      DateFieldValidationUtility.handleStartDateInput(
        (event.target as HTMLInputElement).value,
        row._formGroup.get('effDate')
      );
    }
  }

  /**
   * Handle termination date input for validation
   * Uses shared utility to trigger parse errors
   */
  onTerminationDateInput(event: Event, index: number): void {
    const row = this.dataSource[index];
    if (row?._formGroup) {
      const isNewRow = row._isNew || false;
      DateFieldValidationUtility.handleEndDateInput(
        (event.target as HTMLInputElement).value,
        row._formGroup.get('termDate'),
        !isNewRow // isEditMode = !isNewRow
      );
    }
  }

  /**
   * Get field error message for required fields
   */
  getFieldError(index: number, fieldName: string, displayName: string): string {
    const row = this.dataSource[index];
    if (!row?._formGroup) return '';

    const control = row._formGroup.get(fieldName);
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('required')) {
      return `${displayName} is required`;
    }

    // Check for epitope validation (both IDs must be different)
    if (fieldName === 'epitopeId2' && row._formGroup.hasError('epitopeIdsDifferent')) {
      return 'Antigen ID 1 and Antigen ID 2 must be different';
    }

    return '';
  }

  sortEditModeTable(column: string): void {
    // Toggle sort direction if clicking the same column
    if (this.editModeSortColumn === column) {
      this.editModeSortDirection = this.editModeSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.editModeSortColumn = column;
      this.editModeSortDirection = 'asc';
    }

    // Sort the dataSource array
    this.dataSource.sort((a, b) => {
      const aValue = a[column as keyof StrongReactivityEditRow];
      const bValue = b[column as keyof StrongReactivityEditRow];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Convert to strings for comparison (epitopeId1 and epitopeId2 are strings)
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      const comparison = aStr.localeCompare(bStr, undefined, { numeric: true });
      return this.editModeSortDirection === 'asc' ? comparison : -comparison;
    });

  }

  private validateAllRows(): boolean {
    let isValid = true;

    this.dataSource.forEach((row, index) => {
      // Skip completely empty rows (check FormGroup values)
      if (row._formGroup) {
        const values = row._formGroup.value;
        const isEmptyRow = !values.epitopeId1 && !values.epitopeId2 && !values.bound && !values.effDate && !values.termDate;
        if (isEmptyRow) {
          return;
        }
      }

      // Only validate NEW rows or MODIFIED rows (not all rows)
      // This ensures we only check validation for rows that were actually changed
      const shouldValidate = row._isNew || row._isModified;
      if (!shouldValidate) {
        return;
      }

      // Validate using FormGroup (includes all field and date validation)
      if (row._formGroup) {
        // Mark all controls as touched to trigger validation display
        row._formGroup.markAllAsTouched();

        // Check if form is invalid
        if (row._formGroup.invalid) {
          isValid = false;
          // Errors will be displayed via getEffectiveDateError(), getTerminationDateError(), and getFieldError()
        }
      }
    });

    // Force change detection to update the UI with error messages
    this.cdr.detectChanges();

    return isValid;
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private formatDateForAPI(date: Date | null): string {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Get chapter's local date
   * Handles priority: API chapter date > timezone offset > system date
   */
  private getChapterToday(): moment.Moment {
    // Try API-based chapter local date first
    if (this.chapterTimezoneService && this.chapterTimezoneService.isChapterLocalDateAvailable()) {
      return this.chapterTimezoneService.getChapterLocalDate().clone().startOf('day');
    }

    // Fallback to timezone offset calculation
    const offset = this.chapterOffset;
    if (offset && offset !== 'UTC' && offset !== '') {
      try {
        const chapterToday = moment().utcOffset(offset).startOf('day');
        return moment(chapterToday.format('YYYY-MM-DD')).startOf('day');
      } catch (e) {
        // Fallback if calculation fails
      }
    }

    // Final fallback to system date
    return moment().startOf('day');
  }

  /**
   * Date filter for Effective Date picker
   * Allows dates up to and including today's chapter date
   */
  effectiveDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    try {
      const checkDate = moment(date).startOf('day');
      const today = this.getChapterToday();

      // Allow dates on or before today
      return checkDate.isSameOrBefore(today, 'day');
    } catch (e) {
      return true; // Allow date selection on error
    }
  }

  /**
   * Date filter for Termination Date picker
   * Blocks past dates and ensures >= effective date
   */
  /**
   * Get full epitope identifier including locus (e.g., "1|C" or "1|DR")
   * Used for validation to distinguish between antigens with same ID but different locus
   */
  /**
   * Get composite key from epitope object for dropdown value binding
   * Returns "epitopeId|locus" format to uniquely identify antigens
   */
  trackByIndex(index: number): number {
    return index;
  }

  formatDateForInput(date: Date | string | null | undefined): string {
    if (!date) return '';
    return this.formatDate(date);
  }
}
