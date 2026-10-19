import { Component, OnInit, OnDestroy, effect, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ApiLogQueryService } from './services/api-log-query.service';
import {
  SourceIdOption,
  DataSourceOption,
  ApiLogRecord,
  ApiLogQueryFilterRequest
} from './models/api-log-query.model';

/**
 * Factory function to create a chapter-aware no future date validator.
 * Validates that a date is not in the future based on chapter's local date.
 */
function noFutureDateValidatorFactory(chapterTimezoneService: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const selectedDate = moment(value).startOf('day');
    // Get the chapter's local date from the signal (reactive)
    const chapterDate = chapterTimezoneService.chapterLocalDate();
    const today = chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');

    if (selectedDate.isAfter(today, 'day')) {
      return { futureDate: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-api-log-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    NgxMatSelectSearchModule
  ],
  templateUrl: './api-log-query.html',
  styleUrls: ['./api-log-query.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class ApiLogQuery implements OnInit, OnDestroy {
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<ApiLogRecord> = {
    columns: [
      {
        key: 'insertDate',
        header: 'Insertion Date',
        sortable: true,
        type: 'text',
        width: '200px',
        valueFormatter: (value) => this.formatDateTime(value)
      },
      {
        key: 'logText',
        header: 'Log Text',
        sortable: false,
        type: 'text'
      }
    ],
    sortConfig: {
      column: '',
      direction: 'default'
    },
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No records found. Please adjust your search criteria and try again.'
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by log text',
    minLength: 3,
    ariaLabel: 'Search by log text',
    debounceTime: 500,
    searchOnEnterOnly: true
  };

  filterForm!: FormGroup;

  /**
   * Maximum allowed date for date pickers based on chapter's local date.
   * Reactively updates when chapter local date changes
   */
  maxToDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
  });

  sourceIds = signal<SourceIdOption[]>([]);
  dataSources = signal<DataSourceOption[]>([]);
  dataSource: ApiLogRecord[] = [];
  filteredDataSource: ApiLogRecord[] = [];
  searchText = '';
  hasSearched = false;

  // Search controls for dropdowns
  sourceIdSearchControl = new FormControl('');
  dataSourceSearchControl = new FormControl('');

  // Signals for search terms
  private sourceIdSearchTerm = signal('');
  private dataSourceSearchTerm = signal('');

  // Filtered dropdown options
  filteredSourceIds = computed(() => {
    const search = this.sourceIdSearchTerm().toLowerCase();
    const sources = this.sourceIds();
    if (!search) return sources;
    return sources.filter(s =>
      s.sourceId.toLowerCase().includes(search) ||
      s.description.toLowerCase().includes(search)
    );
  });

  filteredDataSources = computed(() => {
    const search = this.dataSourceSearchTerm().toLowerCase();
    const sources = this.dataSources();
    if (!search) return sources;
    return sources.filter(d =>
      d.dataSourceName.toLowerCase().includes(search)
    );
  });

  isLoadingDropdowns = false;
  isLoadingLogs = false;
  isExporting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiLogQueryService: ApiLogQueryService,
    private snackbarService: SnackbarService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeForm();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.subscribeToChapterChanges();

    // Setup dropdown search
    this.sourceIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.sourceIdSearchTerm.set(v ?? ''));

    this.dataSourceSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.dataSourceSearchTerm.set(v ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Date filter for datepicker - disables dates after the chapter date
   * @param date - The date to check
   * @returns true if the date is valid (enabled), false if disabled
   */
  dateFilter = (date: moment.Moment | null): boolean => {
    if (!date) {
      return true;
    }

    const maxDate = this.maxToDate();
    if (!maxDate) {
      return true;
    }

    // Convert the date to start of day for proper comparison
    const inputDate = moment(date).startOf('day');
    const maxDateStartOfDay = moment(maxDate).startOf('day');

    // Only allow dates up to and including the chapter date
    // Disable dates after the chapter date
    return inputDate.isSameOrBefore(maxDateStartOfDay, 'day');
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload dropdowns when chapter changes
        this.loadDropdowns();

        // Reset form and data
        this.filterForm.reset({
          sourceId: '',
          dataSourceName: '',
          fromDate: null,
          toDate: null
        });

        // Clear all validation errors and touched states
        this.filterForm.markAsPristine();
        this.filterForm.markAsUntouched();
        Object.keys(this.filterForm.controls).forEach(key => {
          this.filterForm.get(key)?.setErrors(null);
          this.filterForm.get(key)?.markAsUntouched();
          this.filterForm.get(key)?.markAsPristine();
        });

        this.dataSource = [];
        this.filteredDataSource = [];
        this.searchText = '';
        this.hasSearched = false;
      });
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      sourceId: ['', Validators.required],
      dataSourceName: [''],
      fromDate: [null, [noFutureDateValidatorFactory(this.chapterTimezoneService)]],
      toDate: [null, [noFutureDateValidatorFactory(this.chapterTimezoneService)]]
    }, {
      validators: DateFieldValidationUtility.crossFieldDateRangeValidator('fromDate', 'toDate')
    });
  }


  private loadDropdowns(): void {
    this.isLoadingDropdowns = true;

    forkJoin({
      sourceIds: this.apiLogQueryService.getSourceIds(),
      dataSources: this.apiLogQueryService.getDataSources()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.sourceIds.set(result.sourceIds);
          this.dataSources.set(result.dataSources);
          this.isLoadingDropdowns = false;
        },
        error: (error) => {
          console.error('Error loading dropdowns:', error);
          this.isLoadingDropdowns = false;
          // Error handling is now done by HTTP interceptor
        }
      });
  }

  get isSearchDisabled(): boolean {
    const formValue = this.filterForm.value;
    return this.isLoadingLogs ||
           !formValue.sourceId ||
           this.filterForm.invalid;
  }

  get isClearAllDisabled(): boolean {
    const formValue = this.filterForm.value;
    // Enable CLEAR ALL only when at least one field has data
    return !formValue.sourceId &&
           !formValue.dataSourceName &&
           !formValue.fromDate &&
           !formValue.toDate;
  }

  onSearch(): void {
    this.hasSearched = true;
    this.loadApiLogs();
  }

  onClearAll(): void {
    // Reset the form to initial state
    this.filterForm.reset({
      sourceId: '',
      dataSourceName: '',
      fromDate: null,
      toDate: null
    });

    // Reset search controls
    this.sourceIdSearchControl.reset('');
    this.dataSourceSearchControl.reset('');

    // Clear data and search state
    this.dataSource = [];
    this.filteredDataSource = [];
    this.searchText = '';
    this.hasSearched = false;
  }

  onExport(): void {
    this.isExporting = true;

    const formValue = this.filterForm.value;
    const filters: ApiLogQueryFilterRequest = {
      sourceId: formValue.sourceId || undefined,
      dataSourceName: formValue.dataSourceName || undefined,
      fromDate: formValue.fromDate ? this.formatDate(formValue.fromDate) : undefined,
      toDate: formValue.toDate ? this.formatDate(formValue.toDate) : undefined,
      searchItem: this.searchText?.trim() || undefined
    };

    // Remove undefined fields
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof ApiLogQueryFilterRequest] === undefined) {
        delete filters[key as keyof ApiLogQueryFilterRequest];
      }
    });

    this.apiLogQueryService.exportApiLogs(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadCsvFile(blob);
          this.isExporting = false;
          this.showSuccess('Logs exported successfully');
        },
        error: (error) => {
          console.error('Error exporting API logs:', error);
          this.isExporting = false;
          // Error handling is now done by HTTP interceptor
        }
      });
  }

  private downloadCsvFile(blob: Blob): void {
    const filename = this.generateCsvFilename();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private generateCsvFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `ApiLogs_${year}${month}${day}_${hours}${minutes}${seconds}.csv`;
  }

  onReset(): void {
    this.filterForm.reset({
      sourceId: '',
      dataSourceName: '',
      fromDate: null,
      toDate: null
    });
    this.dataSource = [];
    this.filteredDataSource = [];
    this.searchText = '';
    this.hasSearched = false;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = 0;
      this.tableConfig.pagination.pageIndex = 0;
    }
  }

  onPageChange(event: TablePageEvent): void {
    // Pagination removed - this method is no longer used
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Perform client-side sorting on already loaded data
    this.sortData();
  }

  private sortData(): void {
    if (!this.dataSource || this.dataSource.length === 0) {
      return;
    }

    const sortColumn = this.tableConfig.sortConfig?.column;
    const sortDirection = this.tableConfig.sortConfig?.direction;

    // If no sorting or default, reset to original order
    if (!sortColumn || sortDirection === 'default') {
      this.filteredDataSource = [...this.dataSource];
      return;
    }

    // Sort the data
    const sortedData = [...this.dataSource].sort((a, b) => {
      const aValue = a[sortColumn as keyof ApiLogRecord];
      const bValue = b[sortColumn as keyof ApiLogRecord];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      // Apply direction (A = ascending, D = descending)
      return sortDirection === 'A' ? comparison : -comparison;
    });

    this.filteredDataSource = sortedData;
  }

  onSearchChange(searchText: string): void {
    this.searchText = searchText;

    // Auto-search when cleared (searchText is empty)
    if (searchText.trim() === '' && this.hasSearched) {
      this.loadApiLogs();
      return;
    }

    // Only trigger API call if data has been loaded and search meets minimum length
    if (!this.isSearchDisabled && searchText.trim().length >= 3) {
      this.loadApiLogs();
    }
  }

  private loadApiLogs(): void {
    this.isLoadingLogs = true;

    const formValue = this.filterForm.value;
    const take = 1000; // Retrieve up to 1000 records
    const skip = 0;

    const sortColumn = this.tableConfig.sortConfig?.column || undefined;
    const sortDirection = this.tableConfig.sortConfig?.direction !== 'default'
      ? this.tableConfig.sortConfig?.direction
      : undefined;

    const filters: ApiLogQueryFilterRequest = {
      sourceId: formValue.sourceId || undefined,
      dataSourceName: formValue.dataSourceName || undefined,
      fromDate: formValue.fromDate ? this.formatDate(formValue.fromDate) : undefined,
      toDate: formValue.toDate ? this.formatDate(formValue.toDate) : undefined,
      searchItem: this.searchText?.trim() || undefined,
      sortColumn: sortColumn,
      sortDirection: sortDirection
    };

    // Remove undefined fields
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof ApiLogQueryFilterRequest] === undefined) {
        delete filters[key as keyof ApiLogQueryFilterRequest];
      }
    });

    this.apiLogQueryService.queryApiLogs(take, skip, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.filteredDataSource = response.data;
          this.isLoadingLogs = false;
        },
        error: (error) => {
          console.error('Error loading API logs:', error);
          this.isLoadingLogs = false;
          // Error handling is now done by HTTP interceptor
        }
      });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    // Handle both moment objects and Date objects
    if (date._isAMomentObject) {
      return date.format('YYYY-MM-DD');
    }
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  private showSuccess(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = moment(dateString);
      if (!date.isValid()) return dateString;
      // Format as DD-MMM-YYYY (e.g., 28-MAY-2026)
      return date.format('DD-MMM-YYYY').toUpperCase();
    } catch {
      return dateString;
    }
  }

  /**
   * Validates date input on typing.
   * Shows errors immediately as the user types invalid dates.
   * @param controlName - The form control name ('fromDate' or 'toDate')
   * @param inputElement - The native input element reference
   */
  onDateInput(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();

    // Mark as touched immediately to show errors while typing
    control?.markAsTouched();

    // If input has text but control value is null, parsing failed (invalid date)
    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
    }
  }

  /**
   * Validates date input on blur.
   * Handles auto-formatting for DDMMYY format (e.g., 211126 -> 21-NOV-2026).
   * Sets invalidDateFormat error if input has text but control value is null (parse failed).
   * @param controlName - The form control name ('fromDate' or 'toDate')
   * @param inputElement - The native input element reference
   */
  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();

    // Handle DDMMYY format (6 digits) - auto-format to DD-MON-YYYY
    const ddmmyyPattern = /^(\d{2})(\d{2})(\d{2})$/;
    const match = inputValue?.match(ddmmyyPattern);

    if (match) {
      const [, day, month, year] = match;
      const fullYear = `20${year}`; // Assume 20xx for 2-digit years
      const parsedDate = moment(`${day}-${month}-${fullYear}`, 'DD-MM-YYYY', true);

      if (parsedDate.isValid()) {
        control?.setValue(parsedDate);
        control?.markAsTouched();
        return;
      }
    }

    // If input has text but control value is null, parsing failed (invalid date)
    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  /**
   * Get error message for source ID field
   */
  getSourceIdError(): string {
    const control = this.filterForm.get('sourceId');

    // Show required error only after field is touched
    if (control?.touched && control?.hasError('required') && (control.value === null || control.value === '' || control.value === undefined)) {
      return 'Source ID is required';
    }

    return '';
  }

  /**
   * Get error message for from date field
   */
  getFromDateError(): string {
    const control = this.filterForm.get('fromDate');

    // Check for future date error first
    if (control?.hasError('futureDate')) {
      return 'Future dates are not allowed';
    }

    // Check for invalid date format errors - show immediately when control has errors
    if (control?.hasError('invalidDateFormat') ||
        control?.hasError('invalidDate') ||
        control?.hasError('matDatepickerParse')) {
      return 'From Date is invalid';
    }

    return '';
  }

  /**
   * Get error message for to date field
   */
  getToDateError(): string {
    const control = this.filterForm.get('toDate');

    // Check for future date error first
    if (control?.hasError('futureDate')) {
      return 'Future dates are not allowed';
    }

    // Check for invalid date format errors - show immediately when control has errors
    if (control?.hasError('invalidDateFormat') ||
        control?.hasError('invalidDate') ||
        control?.hasError('matDatepickerParse')) {
      return 'To Date is invalid';
    }

    // Check form-level date range error (show immediately when both dates have values)
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    if (fromDate && toDate && this.filterForm.errors?.['dateRangeInvalid']) {
      return 'To Date cannot be before From Date';
    }

    return '';
  }
}
