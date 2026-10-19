import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators/input.validators';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

import { AntigenTestService } from './services/antigen-test.service';
import {
  AntigenTestModel,
  AntigenTestParamsDto,
  AntigenTestFilterValue,
  AntigenTestDto,
  UpdateAntigenTestDto,
  BulkUpsertRequestDto,
  BulkUpsertRecordDto
} from './models/antigen-test.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderService } from '@shared/services/page-header.service';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AntigenTestFilterChipsUtils } from './utils/filter-chips.utils';
import { AntigenTestFilterPanel } from './antigen-test-filter-panel/antigen-test-filter-panel';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface AntigenTestRow extends AntigenTestModel {
  isEditMode?: boolean;
  isNewRow?: boolean;
  form?: FormGroup;
  errors?: { [key: string]: string };
}

@Component({
  selector: 'app-antigen-tests',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatTableModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    }
  ],
  templateUrl: './antigen-tests.html',
  styleUrls: ['./antigen-tests.scss']
})
export class AntigenTestsComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 1,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  get displayedColumns(): string[] {
    if (this.isEditModeActive) {
      return ['code', 'description', 'price', 'effectiveDate', 'terminationDate', 'delete'];
    }
    return ['code', 'description', 'price', 'effectiveDate', 'terminationDate', 'modificationDate'];
  }

  appliedFilters: AntigenTestFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: AntigenTestRow[] = [];
  requestState: AntigenTestParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';
  ariaLiveMessage = '';

  // Edit Mode State
  isEditModeActive = false;
  showValidationError = false;
  isSaving = false;
  hasAnyDirtyForms = false;
  hasAnyInvalidForms = false;

  // Sorting
  sortColumn = 'code';
  sortDirection: 'A' | 'D' | 'default' = 'default';

  // Filter Panel State
  isFilterOpen = false;

  // Pagination
  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Minimum date for effective date picker (chapter's today)
  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  // Default title (fallback if API doesn't return it)
  private readonly defaultTitle = 'Antigen Tests';

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;


  constructor(
    private antigenTestService: AntigenTestService,
    private overlay: Overlay,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeConfigurations();

    // Watch for page header data from API and update header config dynamically
    // Use API values directly (including null/empty subtitle)
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null }
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || ''  // Use API subtitle directly, empty string if null
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  /**
   * Subscribe to chapter changes to reset UI state and reload data.
   * Called once in ngOnInit to ensure data consistency when user switches chapters.
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset search
        this.searchText = '';
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }

        // Reset filters
        this.appliedFilters = null;
        this.filterChips = [];

        // Reset request state to defaults
        this.requestState = {};

        // Reset pagination
        this.pageIndex = 0;
        this.pageSize = 25;

        // Reset sorting
        this.sortColumn = 'code';
        this.sortDirection = 'default';

        // Exit edit mode if active
        if (this.isEditModeActive) {
          this.isEditModeActive = false;
          this.showValidationError = false;
          this.hasAnyDirtyForms = false;
          this.hasAnyInvalidForms = false;
        }

        // Close filter overlay if open
        if (this.overlayRef) {
          this.overlayRef.detach();
        }

        // Reload data for new chapter
        this.loadData();
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: this.defaultTitle,
          link: null
        }
      ],
      title: this.defaultTitle,
      subtitle: '',  // Will be populated from API
      actions: []
    };

    this.searchConfig = {
      placeholder: 'Search by code or description',
      minLength: 1,
      ariaLabel: 'Search antigen tests by code or description',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.ariaLiveMessage = 'Loading antigen tests data';

    const params: AntigenTestParamsDto = {
      ...this.requestState,
      skip: this.pageIndex * this.pageSize,
      take: this.pageSize
    };

    this.antigenTestService
      .getAntigenTests(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: AntigenTestModel[]; totalRecords: number }) => {
          this.dataSource = response.data.map(item => ({
            ...item,
            isEditMode: false,
            isNewRow: false
          }));
          this.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.ariaLiveMessage = `Loaded ${response.data.length} antigen test records`;
        },
        error: (error: any) => {
          console.error('Error loading antigen tests data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'No antigen tests available to display';
          this.ariaLiveMessage = 'No data available';
        }
      });
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined) return '-';
    return `$${price.toFixed(2)}`;
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;
    this.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
    // If page size changed, reset to first page
    if (this.pageSize !== event.pageSize) {
      this.pageIndex = 0;
      this.pageSize = event.pageSize;
    } else {
      this.pageIndex = event.pageIndex;
    }
    this.loadData();
  }

  onSortChange(column: string): void {
    // Prevent sorting when in edit mode
    if (this.isEditModeActive) {
      return;
    }

    if (this.sortColumn === column) {
      // Toggle direction
      if (this.sortDirection === 'default') {
        this.sortDirection = 'A';
      } else if (this.sortDirection === 'A') {
        this.sortDirection = 'D';
      } else {
        this.sortDirection = 'default';
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'A';
    }

    // Send 'A' or 'D' directly to match the API parameter (backend knows to sort by code column)
    if (this.sortDirection === 'default') {
      this.requestState.sort = undefined;
    } else {
      this.requestState.sort = this.sortDirection;
    }

    this.pageIndex = 0;
    this.loadData();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column && this.sortDirection !== 'default') {
      switch (this.sortDirection) {
        case 'A':
          return 'arrow_upward';
        case 'D':
          return 'arrow_downward';
        default:
          return 'unfold_more';
      }
    }
    // Show unfold_more for sortable columns not currently sorted
    return 'unfold_more';
  }

  enableEditMode(): void {
    this.isEditModeActive = true;
    this.showValidationError = false; // Reset validation error when entering edit mode
    // Make all rows editable
    this.dataSource = this.dataSource.map(row => ({
      ...row,
      isEditMode: true,
      form: this.createRowForm(row),
      errors: {}
    }));

    // Check validation state after creating forms
    setTimeout(() => this.updateValidationErrorState(), 0);
  }

  addNewRow(): void {
    // Activate edit mode
    this.isEditModeActive = true;

    // Add a new row at the top
    const newRow: AntigenTestRow = {
      code: '',
      description: '',
      price: null,
      effectiveDate: null,
      terminationDate: null,
      isEditMode: true,
      isNewRow: true,
      form: this.createRowForm(null),
      errors: {}
    };

    this.dataSource = [newRow, ...this.dataSource];

    // Check validation state after adding new row
    setTimeout(() => this.updateValidationErrorState(), 0);
  }

  createRowForm(row: AntigenTestRow | null): FormGroup {
    const isAddMode = row === null || row.isNewRow;
    const isNewRow = row?.isNewRow ?? true;

    // Sanitize price value for existing rows to handle invalid database data
    let priceValue = row?.price ?? null;
    if (!isAddMode && priceValue !== null) {
      // Coerce invalid prices from database to valid range
      if (priceValue < 0) priceValue = 0;
      if (priceValue > 99999.99) priceValue = 99999.99;
    }

    // Store original termination date for validation
    const originalTerminationDate = row?.terminationDate;

    const form = this.fb.group({
      code: [
        { value: row?.code || '', disabled: row !== null && !row.isNewRow },
        [Validators.required, Validators.maxLength(4), codeFieldValidator()]
      ],
      description: [row?.description || '', [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      price: [priceValue, [Validators.min(0), Validators.max(99999.99)]],
      effectiveDate: [
        row?.effectiveDate ? moment(row.effectiveDate) : null,
        [Validators.required]
      ],
      terminationDate: [
        row?.terminationDate ? moment(row.terminationDate) : null
      ]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
      updateOn: 'change' // Validate on change, not on blur
    });

    // Setup date validators based on mode
    if (isAddMode) {
      DateFieldValidationUtility.setupAddModeValidators(form, this.headerService.chapterTimeZone());
    } else {
      DateFieldValidationUtility.setupEditModeValidators(form);
    }

    // For existing rows, mark form as pristine and untouched initially
    // This prevents validation errors from showing until user actually edits the row
    if (!isNewRow) {
      form.markAsPristine();
      form.markAsUntouched();
      Object.keys(form.controls).forEach(key => {
        const control = form.get(key);
        if (control) {
          control.markAsPristine();
          control.markAsUntouched();
        }
      });
    }

    // Setup date field listeners to revalidate when dates change
    form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Re-validate termination date and form when effective date changes
        form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
        form.updateValueAndValidity({ emitEvent: false });
        this.updateValidationErrorState();
        // Find the row and sync errors
        const row = this.dataSource.find(r => r.form === form);
        if (row) {
          this.syncDateErrorsToRow(row);
        }
      });

    form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Re-validate form when termination date changes
        form.updateValueAndValidity({ emitEvent: false });
        this.updateValidationErrorState();
        // Find the row and sync errors
        const row = this.dataSource.find(r => r.form === form);
        if (row) {
          this.syncDateErrorsToRow(row);
        }
      });

    // Listen to all field changes to update validation state
    form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateValidationErrorState();
      });

    return form;
  }

  /**
   * Update validation error state based on form validity
   */
  private updateValidationErrorState(): void {
    if (!this.isEditModeActive) {
      this.showValidationError = false;
      this.hasAnyDirtyForms = false;
      this.hasAnyInvalidForms = false;
      this.cdr.markForCheck();
      return;
    }

    // Check if any row has invalid fields that should show errors
    // For new rows: show error if touched
    // For existing rows: show error only if dirty (modified)
    const hasErrors = this.dataSource.some(row => {
      if (!row.form) return false;

      const hasInvalidFields = Object.keys(row.form.controls).some(key => {
        const control = row.form!.get(key);
        if (!control || !control.invalid) return false;

        // For new rows, show error if touched
        if (row.isNewRow) {
          return control.touched;
        }

        // For existing rows, only show error if the field has been modified (dirty)
        return control.dirty;
      });

      return hasInvalidFields;
    });

    this.showValidationError = hasErrors;

    // Check if any forms are dirty (modified)
    this.hasAnyDirtyForms = this.dataSource.some(row => row.form && row.form.dirty);

    // Check if any forms are invalid
    // For new rows: check if form is invalid
    // For existing rows: only check if modified fields are invalid (ignore invalid database data)
    this.hasAnyInvalidForms = this.dataSource.some(row => this.rowHasActionableErrors(row));

    // Trigger change detection to ensure button state updates in production builds
    this.cdr.markForCheck();
  }

  saveAll(): void {
    // Validate only new rows and edited existing rows
    // Skip existing rows that haven't been modified
    const invalidRows = this.dataSource.filter(row => this.rowHasActionableErrors(row));

    if (invalidRows.length > 0) {
      invalidRows.forEach(row => row.form?.markAllAsTouched());
      this.showValidationError = true;
      return;
    }

    this.showValidationError = false;

    // Collect new rows and dirty existing rows only
    const newRows = this.dataSource.filter(row => row.isNewRow && row.form);
    const editedRows = this.dataSource.filter(row => !row.isNewRow && row.form && row.form.dirty);

    const totalOperations = newRows.length + editedRows.length;

    if (totalOperations === 0) {
      this.cancelEdit();
      return;
    }

    // Start loading
    this.isSaving = true;

    // Build bulk upsert payload
    const records = [
      ...this.buildRecordsFromRows(newRows, true),   // addRecord: true for new rows
      ...this.buildRecordsFromRows(editedRows, false)  // addRecord: false for edited rows
    ];

    const payload: BulkUpsertRequestDto = { records };

    // Call bulk upsert API
    this.antigenTestService.bulkUpsertAntigenTests(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.message) {
            this.ariaLiveMessage = response.message;
            this.snackBar.open(response.message, 'DISMISS', {
              horizontalPosition: 'right',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
          }
          this.isSaving = false;
          this.isEditModeActive = false;
          this.showValidationError = false;
          this.hasAnyDirtyForms = false;
          this.hasAnyInvalidForms = false;
          this.searchText = '';
          if (this.searchBarComponent) {
            this.searchBarComponent.clearSearch();
          }
          this.requestState.searchKeyword = undefined;
          this.appliedFilters = null;
          this.filterChips = [];
          const { price, priceRange, effectiveDate, effectiveDatePeriod, terminationDate, terminationDatePeriod, ...rest } = this.requestState;
          this.requestState = rest;
          this.pageIndex = 0;
          this.loadData();
        },
        error: (error) => {
          // Error message is handled by auth interceptor
          this.isSaving = false;
          this.isEditModeActive = false;
          this.showValidationError = false;
          this.hasAnyDirtyForms = false;
          this.hasAnyInvalidForms = false;
          this.searchText = '';
          if (this.searchBarComponent) {
            this.searchBarComponent.clearSearch();
          }
          this.requestState.searchKeyword = undefined;
          this.appliedFilters = null;
          this.filterChips = [];
          const { price, priceRange, effectiveDate, effectiveDatePeriod, terminationDate, terminationDatePeriod, ...restState } = this.requestState;
          this.requestState = restState;
          this.pageIndex = 0;
          this.loadData();
        }
      });
  }

  /**
   * Build bulk upsert records from antigen test rows
   * @param rows - Array of antigen test rows to convert
   * @param isNewRecord - true for new rows (addRecord: true), false for edited rows (addRecord: false)
   * @returns Array of bulk upsert record DTOs
   */
  private buildRecordsFromRows(rows: AntigenTestRow[], isNewRecord: boolean): BulkUpsertRecordDto[] {
    return rows
      .filter(row => row.form)
      .map(row => {
        const formValue = row.form!.getRawValue();

        const record: BulkUpsertRecordDto = {
          addRecord: isNewRecord,
          code: formValue.code?.trim() || '',
          description: formValue.description || '',
          price: formValue.price !== null && formValue.price !== '' ? Number(formValue.price) : null,
          effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') : '',
          terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') : null
        };

        return record;
      });
  }

  cancelEdit(): void {
    this.isEditModeActive = false;
    this.showValidationError = false;
    this.hasAnyDirtyForms = false;
    this.hasAnyInvalidForms = false;

    // Clear search bar UI and reset search text
    this.searchText = '';
    if (this.searchBarComponent) {
      this.searchBarComponent.clearSearch();
    }

    // Clear search filter to reset the table
    this.requestState.searchKeyword = undefined;

    // Reset filters
    this.appliedFilters = null;
    this.filterChips = [];

    // Remove all filter parameters from request state
    const { price, priceRange, effectiveDate, effectiveDatePeriod, terminationDate, terminationDatePeriod, ...rest } = this.requestState;
    this.requestState = rest;

    // Reset pagination to first page
    this.pageIndex = 0;

    this.loadData();
  }

  deleteRow(index: number): void {
    this.dataSource = this.dataSource.filter((_, i) => i !== index);

    // Check if there are any rows left in edit mode
    const hasEditableRows = this.dataSource.some(row => row.isEditMode);
    if (!hasEditableRows) {
      this.isEditModeActive = false;
      this.showValidationError = false;
    } else {
      // Update validation error state after deleting a row
      this.updateValidationErrorState();
    }
  }

  onCodeInput(event: Event, row: AntigenTestRow): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Limit to 4 characters max (legacy system limit)
    if (inputValue.length > 4) {
      inputValue = inputValue.substring(0, 4);
      input.value = inputValue;
      row.form?.patchValue({ code: inputValue }, { emitEvent: false });
    }

    // Mark field as touched to trigger validation error banner
    row.form?.get('code')?.markAsTouched();
    this.updateValidationErrorState();
  }

  onFieldBlur(row: AntigenTestRow, fieldName: string): void {
    if (!row.form) {
      return;
    }

    const control = row.form.get(fieldName);
    if (control) {
      control.markAsTouched();
      this.updateValidationErrorState();
    }
  }

  onDescriptionInput(event: Event, row: AntigenTestRow): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Limit to 50 characters max (VARCHAR2(50))
    if (inputValue.length > 50) {
      inputValue = inputValue.substring(0, 50);
      input.value = inputValue;
      row.form?.patchValue({ description: inputValue }, { emitEvent: false });
    }

    // Mark field as touched to trigger validation error banner
    row.form?.get('description')?.markAsTouched();
    this.updateValidationErrorState();
  }

  onPriceInput(event: Event, row: AntigenTestRow): void {
    const input = event.target as HTMLInputElement;
    let inputValue = input.value;

    // Remove any non-numeric characters except decimal point
    inputValue = inputValue.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    let parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
      parts = inputValue.split('.');
    }

    // Limit to 5 digits before decimal and 2 digits after (NUMBER(7,2): total 7 digits, 2 after decimal)
    // Max value: 99999.99
    if (parts.length === 2) {
      const integerPart = parts[0].substring(0, 5);
      const decimalPart = parts[1].substring(0, 2);
      inputValue = integerPart + '.' + decimalPart;
    } else if (parts.length === 1) {
      inputValue = inputValue.substring(0, 5);
    }

    // Update the DOM input value
    input.value = inputValue;

    const control = row.form?.get('price');
    if (!control) return;

    // emitModelToViewChange: false prevents Angular from overwriting the
    // input value we just set (e.g. converting 100.0 → "100", eating the decimal)
    const opts = { emitEvent: false, emitModelToViewChange: false };

    if (inputValue === '' || inputValue === '.') {
      control.setValue(null, opts);
      return;
    }

    if (inputValue.endsWith('.')) {
      return;
    }

    const value = parseFloat(inputValue);

    if (isNaN(value)) {
      control.setValue(null, opts);
      return;
    }

    if (value < 0) {
      input.value = '0';
      control.setValue(0, opts);
    } else if (value > 99999.99) {
      input.value = '99999.99';
      control.setValue(99999.99, opts);
    } else {
      control.setValue(value, opts);
    }
  }

  /**
   * Validate date input as user types or pastes to prevent auto-correction
   */
  onDateInput(event: Event, row: AntigenTestRow, fieldName: 'effectiveDate' | 'terminationDate'): void {
    if (!row.form) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const inputValue = input.value;

    const control = row.form.get(fieldName);
    if (!control) {
      return;
    }

    // If empty, clear any parse errors (keep other validators like required)
    if (!inputValue || inputValue.trim() === '') {
      // Only clear the matDatepickerParse error, preserve other errors
      if (control.hasError('matDatepickerParse')) {
        const currentErrors = control.errors;
        if (currentErrors) {
          delete currentErrors['matDatepickerParse'];
          const remainingErrors = Object.keys(currentErrors).length > 0 ? currentErrors : null;
          control.setErrors(remainingErrors);
        }
      }
      this.updateValidationErrorState();
      return;
    }

    // Try to parse the date strictly with expected formats
    // This will catch invalid dates like "12-78-9087" where 78 is not a valid month
    const parsedDate = moment(inputValue, ['DD-MMM-YYYY', 'D-MMM-YYYY'], true);

    if (!parsedDate.isValid()) {
      // Invalid date format - set error immediately
      // This catches cases like:
      // - "12-78-9087" (78 is not a valid month abbreviation)
      // - "32-JAN-2025" (32 is not a valid day)
      // - Any other malformed date strings
      control.setErrors({ matDatepickerParse: true });
      control.markAsTouched();
      if (!row.errors) row.errors = {};
      row.errors[fieldName] = 'Invalid date format';
      this.updateValidationErrorState();
    } else {
      // Valid date format - clear parse error if it exists
      if (control.hasError('matDatepickerParse')) {
        const currentErrors = control.errors;
        if (currentErrors) {
          delete currentErrors['matDatepickerParse'];
          const remainingErrors = Object.keys(currentErrors).length > 0 ? currentErrors : null;
          control.setErrors(remainingErrors);
        }
      }
      if (row.errors && row.errors[fieldName]) {
        delete row.errors[fieldName];
      }
      this.syncDateErrorsToRow(row);
      this.updateValidationErrorState();
    }
  }

  /**
   * Handle date change when user selects from picker
   */
  onDateChange(_event: any, row: AntigenTestRow, fieldName: 'effectiveDate' | 'terminationDate'): void {
    if (!row.form) {
      return;
    }

    // When a valid date is selected from picker, clear any parse errors
    const control = row.form.get(fieldName);
    if (control && control.hasError('matDatepickerParse')) {
      const errors = control.errors;
      delete errors!['matDatepickerParse'];
      control.setErrors(Object.keys(errors!).length > 0 ? errors : null);
    }

    // Clear error in row.errors object
    if (row.errors && row.errors[fieldName]) {
      delete row.errors[fieldName];
    }

    // Re-validate the form
    row.form.updateValueAndValidity();

    // Sync any remaining errors to row.errors
    this.syncDateErrorsToRow(row);
    this.updateValidationErrorState();
  }

  /**
   * Validate date input on blur to check for invalid dates
   */
  onDateInputBlur(event: Event, row: AntigenTestRow, fieldName: 'effectiveDate' | 'terminationDate'): void {
    if (!row.form) {
      return;
    }

    const control = row.form.get(fieldName);
    if (!control) {
      return;
    }

    // Initialize errors object if not exists
    if (!row.errors) {
      row.errors = {};
    }

    // Get the actual input element value (what user typed)
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();

    // Always mark as touched on blur
    control.markAsTouched();

    // If input field is empty, clear any parse errors (but keep required error if field is required)
    if (!inputValue || inputValue === '') {
      control.setValue(null, { emitEvent: false });
      if (control.hasError('matDatepickerParse')) {
        const currentErrors = control.errors;
        if (currentErrors) {
          delete currentErrors['matDatepickerParse'];
          const remainingErrors = Object.keys(currentErrors).length > 0 ? currentErrors : null;
          control.setErrors(remainingErrors);
        }
      }
      // Update row.errors based on control validity
      if (control.invalid && control.hasError('required')) {
        row.errors[fieldName] = 'This field is required';
      } else if (row.errors[fieldName]) {
        delete row.errors[fieldName];
      }
      this.updateValidationErrorState();
      return;
    }

    // Validate the input value with strict parsing
    const parsedDate = moment(inputValue, ['DD-MMM-YYYY', 'D-MMM-YYYY'], true);

    if (!parsedDate.isValid()) {
      // Invalid date - clear the control value and set error
      // This catches cases like "22222-", "12-78-9087", "32-JAN-2025", etc.
      control.setValue(null, { emitEvent: false });
      control.setErrors({ matDatepickerParse: true });
      control.markAsTouched();
      row.errors[fieldName] = 'Invalid date format';
      this.updateValidationErrorState();
    } else {
      // Valid date - update control with parsed date and clear parse errors
      control.setValue(parsedDate, { emitEvent: false });
      if (control.hasError('matDatepickerParse')) {
        const currentErrors = control.errors;
        if (currentErrors) {
          delete currentErrors['matDatepickerParse'];
          const remainingErrors = Object.keys(currentErrors).length > 0 ? currentErrors : null;
          control.setErrors(remainingErrors);
        }
      }
      // Revalidate to check other validators (like date range, etc.)
      control.updateValueAndValidity({ emitEvent: false });

      // Update row.errors based on final control validity
      if (control.invalid) {
        const errorMessage = this.getErrorMessage(row.form, fieldName);
        if (errorMessage) {
          row.errors[fieldName] = errorMessage;
        }
      } else if (row.errors[fieldName]) {
        delete row.errors[fieldName];
      }
      this.updateValidationErrorState();
    }
  }

  private rowHasActionableErrors(row: AntigenTestRow): boolean {
    if (!row.form) return false;
    if (row.isNewRow) return row.form.invalid;
    if (!row.form.dirty) return false;
    return Object.keys(row.form.controls).some(key => {
      const control = row.form!.get(key);
      return control && control.dirty && control.invalid;
    });
  }

  getTerminationMinDate(row: AntigenTestRow): moment.Moment | null {
    if (!row.form) {
      return null;
    }

    // Use getRawValue() to get value even if control is disabled (Edit mode)
    const formValues = row.form.getRawValue();
    const effectiveDate = formValues.effectiveDate;

    if (!effectiveDate) {
      // If no effective date, return chapter's today
      return DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    }

    const effDate = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
    const effDay = moment(effDate).startOf('day');
    const today = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

    return effDay.isBefore(today) ? today : effDay;
  }

  /**
   * Sync form control errors to row.errors object for date fields
   * This enables the red border styling via [class.date-field-error]
   */
  syncDateErrorsToRow(row: AntigenTestRow): void {
    if (!row.form || !row.errors) {
      return;
    }

    // Sync effective date errors
    const effDateControl = row.form.get('effectiveDate');
    if (effDateControl && effDateControl.invalid && effDateControl.touched) {
      const errorMessage = this.getErrorMessage(row.form, 'effectiveDate');
      if (errorMessage) {
        row.errors['effectiveDate'] = errorMessage;
      }
    } else if (row.errors['effectiveDate']) {
      delete row.errors['effectiveDate'];
    }

    // Sync termination date errors
    const termDateControl = row.form.get('terminationDate');
    if (termDateControl && termDateControl.invalid && termDateControl.touched) {
      const errorMessage = this.getErrorMessage(row.form, 'terminationDate');
      if (errorMessage) {
        row.errors['terminationDate'] = errorMessage;
      }
    } else if (row.errors['terminationDate']) {
      delete row.errors['terminationDate'];
    }

    // Sync cross-field termination before effective error
    if (row.form.hasError('terminationBeforeEffective') && termDateControl?.touched) {
      row.errors['terminationDate'] = 'Termination Date cannot be before Effective Date';
    }
  }

  getErrorMessage(form: FormGroup | undefined, fieldName: string): string {
    if (!form) return '';

    const control = form.get(fieldName);
    if (!control || !control.touched) return '';

    // Handle Effective Date errors using DateFieldValidationUtility
    if (fieldName === 'effectiveDate') {
      return DateFieldValidationUtility.getStartDateCrossFieldError(
        control,
        'Effective Date',
        'Termination Date',
        form.errors
      );
    }

    // Handle Termination Date errors using DateFieldValidationUtility
    if (fieldName === 'terminationDate') {
      return DateFieldValidationUtility.getEndDateCrossFieldError(
        control,
        'Termination Date',
        'Effective Date',
        form.errors
      );
    }

    if (control.hasError('required')) {
      return 'This field is required and cannot be left blank';
    }

    if (control.hasError('whitespaceOnly')) {
      return 'This field cannot contain only spaces';
    }

    if (control.hasError('noAlphanumeric')) {
      return 'This field must contain at least one letter or number';
    }

    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      if (fieldName === 'code') {
        return 'Maximum 4 characters allowed';
      }
      return `Maximum ${maxLength} characters allowed`;
    }

    if (control.hasError('min')) {
      if (fieldName === 'price') {
        return 'Price must be 0 or greater';
      }
      return 'Value must be greater than or equal to minimum';
    }

    if (control.hasError('max')) {
      if (fieldName === 'price') {
        return 'Price must be 99999.99 or less';
      }
      return 'Value must be less than or equal to maximum';
    }

    return '';
  }

  /**
   * Get tooltip message for code field - shows error or helpful hint
   */
  getCodeTooltipMessage(row: AntigenTestRow): string {
    if (!row.form) return '';

    const codeControl = row.form.get('code');
    if (!codeControl) return '';

    // If field has been touched and has errors, show error message
    if (codeControl.touched && codeControl.invalid) {
      return this.getErrorMessage(row.form, 'code');
    }

    // If field is empty (null or empty string), show helpful hint
    const codeValue = codeControl.value;
    if (codeValue === null || codeValue === '' || codeValue === undefined) {
      return 'Maximum 4 characters allowed';
    }

    // No tooltip for valid, non-empty values
    return '';
  }

  /**
   * Get tooltip message for description field - shows error or helpful hint
   */
  getDescriptionTooltipMessage(row: AntigenTestRow): string {
    if (!row.form) return '';

    const descControl = row.form.get('description');
    if (!descControl) return '';

    // If field has been touched and has errors, show error message
    if (descControl.touched && descControl.invalid) {
      return this.getErrorMessage(row.form, 'description');
    }

    // If field is empty (null or empty string), show helpful hint
    const descValue = descControl.value;
    if (descValue === null || descValue === '' || descValue === undefined) {
      return 'Maximum 50 characters allowed';
    }

    // No tooltip for valid, non-empty values
    return '';
  }

  /**
   * Get tooltip message for price field - shows error or helpful hint
   */
  getPriceTooltipMessage(row: AntigenTestRow): string {
    if (!row.form) return '';

    const priceControl = row.form.get('price');
    if (!priceControl) return '';

    // If field has been touched and has errors, show error message
    if (priceControl.touched && priceControl.invalid) {
      return this.getErrorMessage(row.form, 'price');
    }

    // If field is empty (null or empty string), show helpful hint
    const priceValue = priceControl.value;
    if (priceValue === null || priceValue === '' || priceValue === undefined) {
      return 'Maximum 99999.99 allowed';
    }

    // No tooltip for valid, non-empty values
    return '';
  }

  /**
   * Get tooltip message for effective date field - shows error or helpful hint
   * Uses exact same validation logic as Return Reasons component
   */
  getEffectiveDateTooltipMessage(row: AntigenTestRow): string {
    if (!row.form) return '';

    const effDateControl = row.form.get('effectiveDate');
    if (!effDateControl) return '';

    // If field has been touched and has validation errors, show the exact error message
    if (effDateControl.touched && (effDateControl.invalid || row.form.hasError('dateRangeInvalid'))) {
      // Use the same validation logic as Return Reasons: DateFieldValidationUtility.getStartDateCrossFieldError
      if (effDateControl.hasError('matDatepickerParse')) {
        return 'Effective Date is invalid';
      }

      if (effDateControl.hasError('required')) {
        return 'Effective Date is required';
      }

      if (effDateControl.hasError('invalidDateFormat') || effDateControl.hasError('invalidDate')) {
        return 'Effective Date is invalid';
      }

      if (effDateControl.hasError('effectiveDatePast')) {
        return 'Effective Date cannot be past date';
      }

      if (row.form.hasError('dateRangeInvalid')) {
        return 'Effective Date must be less than or equal to Termination Date';
      }
    }

    // If field is empty (null or empty string), show helpful hint
    const effDateValue = effDateControl.value;
    if (effDateValue === null || effDateValue === '' || effDateValue === undefined) {
      return 'Required. Use format DD-MMM-YYYY (e.g., 12-MAR-2025)';
    }

    // No tooltip for valid, non-empty values
    return '';
  }

  /**
   * Get tooltip message for termination date field - shows error or helpful hint
   * Uses exact same validation logic as Return Reasons component
   */
  getTerminationDateTooltipMessage(row: AntigenTestRow): string {
    if (!row.form) return '';

    const termDateControl = row.form.get('terminationDate');
    if (!termDateControl) return '';

    // If field has been touched and has validation errors, show the exact error message
    if (termDateControl.touched && (termDateControl.invalid || row.form.hasError('terminationBeforeEffective'))) {
      // Use the same validation logic as Return Reasons: DateFieldValidationUtility.getEndDateCrossFieldError
      if (termDateControl.hasError('matDatepickerParse')) {
        return 'Termination Date is invalid';
      }

      if (termDateControl.hasError('required')) {
        return 'Termination Date is required';
      }

      if (termDateControl.hasError('invalidDateFormat') || termDateControl.hasError('invalidDate')) {
        return 'Termination Date is invalid';
      }

      if (termDateControl.hasError('terminationDatePast')) {
        return 'Termination Date cannot be past date';
      }

      if (termDateControl.hasError('matDatepickerMin')) {
        return 'Termination Date must be greater than or equal to Effective Date';
      }

      if (row.form.hasError('terminationBeforeEffective')) {
        return 'Termination Date must be greater than or equal to Effective Date';
      }
    }

    // If field is empty (null or empty string), show helpful hint
    const termDateValue = termDateControl.value;
    if (termDateValue === null || termDateValue === '' || termDateValue === undefined) {
      return 'Optional. Use format DD-MMM-YYYY (e.g., 12-MAR-2025)';
    }

    // No tooltip for valid, non-empty values
    return '';
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterOverlay();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 0
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(AntigenTestFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });
  }

  private closeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
  }

  applyFilters(filters: AntigenTestFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = AntigenTestFilterChipsUtils.convertFiltersToChips(filters);

    const newRequestState = this.mapFiltersToRequestParams(filters);

    // Remove old filter parameters and add new ones
    const { price, priceRange, effectiveDate, effectiveDatePeriod, terminationDate, terminationDatePeriod, ...rest } = this.requestState;
    this.requestState = { ...rest, ...newRequestState };

    this.pageIndex = 0;
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = AntigenTestFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = AntigenTestFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();
    this.pageIndex = 0;
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return AntigenTestFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  hasNewRows(): boolean {
    return this.dataSource.some(row => row.isNewRow === true);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Remove filter parameters
    const { price, priceRange, effectiveDate, effectiveDatePeriod, terminationDate, terminationDatePeriod, ...rest } = this.requestState;
    this.requestState = rest;

    this.pageIndex = 0;
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { price, priceRange, effectiveDate, effectiveDatePeriod, terminationDate, terminationDatePeriod, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    const newRequestState = this.mapFiltersToRequestParams(this.appliedFilters);

    // Remove old filter parameters and add new ones
    const { price, priceRange, effectiveDate, effectiveDatePeriod, terminationDate, terminationDatePeriod, ...rest } = this.requestState;
    this.requestState = { ...rest, ...newRequestState };
  }

  private mapFiltersToRequestParams(filters: AntigenTestFilterValue): AntigenTestParamsDto {
    const params: AntigenTestParamsDto = {};

    // Map price filters
    if (filters.priceRange && filters.price !== null && filters.price !== undefined) {
      params.price = filters.price;
      params.priceRange = filters.priceRange; // 'Over' or 'Under'
    }

    // Map effective date filters
    if (filters.effectiveDatePeriod && filters.effectiveDate) {
      params.effectiveDate = moment(filters.effectiveDate).toISOString();
      params.effectiveDatePeriod = filters.effectiveDatePeriod; // 'After' or 'Before'
    }

    // Map termination date filters
    if (filters.terminationDatePeriod && filters.terminationDate) {
      params.terminationDate = moment(filters.terminationDate).toISOString();
      params.terminationDatePeriod = filters.terminationDatePeriod; // 'After' or 'Before'
    }

    return params;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+C: Enable edit mode
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      if (!this.isEditModeActive) {
        this.enableEditMode();
      }
    }

    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeFilterOverlay();
    }
  }
}
