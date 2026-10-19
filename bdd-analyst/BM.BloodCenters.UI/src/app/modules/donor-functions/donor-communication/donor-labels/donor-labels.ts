import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  effect,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { DonorLabelsService } from './services/donor-labels.service';
import {
  DonorLabelDto,
  SearchType,
  SearchTypeOption,
  PrinterOption,
  DonorLabelSearchRequest,
  UpdatePrintFlagsRequest,
  PrintFlagRecord,
  GenerateLabelsRequest,
  PrintLabelsRequest
} from './models/donor-labels.model';

/**
 * First Time and Gallon Donor Labels Component
 * Manages donor label generation and printing for first-time donors and gallon milestones
 */
@Component({
  selector: 'app-donor-labels',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './donor-labels.html',
  styleUrls: ['./donor-labels.scss']
})
export class DonorLabelsComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `donor-labels-${DonorLabelsComponent.nextId++}`;

  @ViewChild(DataTable) dataTableComponent!: DataTable<DonorLabelDto>;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DonorLabelsService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  // Search form
  searchForm!: FormGroup;

  // Signals for data
  readonly searchTypeOptions = signal<SearchTypeOption[]>([]);
  readonly printerOptions = signal<PrinterOption[]>([]);
  readonly searchResults = signal<DonorLabelDto[]>([]);
  readonly totalRecords = signal<number>(0);

  // Search form controls for searchable dropdowns
  readonly printerSearchControl = new FormControl('');

  // Signals for search values
  readonly printerSearch = signal('');

  // Filtered printer options based on search
  readonly filteredPrinterOptions = computed(() => {
    const search = this.printerSearch().toLowerCase();
    const options = this.printerOptions();

    if (!search) return options;
    return options.filter(option =>
      option.printerName?.toLowerCase().includes(search) ||
      option.printerDescription?.toLowerCase().includes(search)
    );
  });

  // Loading states
  readonly isLoadingDropdowns = signal<boolean>(false);
  readonly isLoadingData = signal<boolean>(false);
  readonly isProcessing = signal<boolean>(false);

  // UI state
  readonly hasSearched = signal<boolean>(false);
  readonly showEmptyState = computed(() => !this.hasSearched() && this.searchResults().length === 0);
  readonly hasResults = computed(() => this.searchResults().length > 0);
  readonly lastPrintFlagAction = signal<'Y' | 'N' | null>(null);

  // Check if any records have print flag = 'N' (needed for Generate Labels)
  readonly hasRecordsWithPrintFlagNo = computed(() => {
    return this.searchResults().some((label: any) => {
      const flag = label.printFlag || label.PrintFlag;
      return flag === 'N';
    });
  });

  // Store last search criteria for pagination
  private lastSearchRequest: DonorLabelSearchRequest | null = null;

  // Store original unsorted data
  private originalSearchResults: DonorLabelDto[] = [];

  // Data table configuration
  tableConfig: DataTableConfig<DonorLabelDto> = {
    showPagination: false,
    sortConfig: { column: 'rowIndex', direction: 'A' },
    columns: [
      {
        key: 'rowIndex',
        header: 'Sequence',
        sortable: true,
        type: 'number',
        minWidth: '100px',
        valueFormatter: (value: any, row: any) => {
          // Get the index from the row's rowIndex property
          return row?.rowIndex?.toString() || '--';
        }
      },
      {
        key: 'donorName',
        header: 'Donor Name',
        sortable: false,
        type: 'text',
        minWidth: '180px',
        valueFormatter: (value: any, row: any) => row?.donorName || row?.DonorName || '--'
      },
      {
        key: 'dateOfBirth',
        header: 'Date of Birth',
        sortable: false,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value: any, row: any) => {
          const dob = row?.dateOfBirth || row?.DateOfBirth;
          if (!dob) return '--';
          const formatted = DateFieldValidationUtility.formatDateForUI(new Date(dob));
          return formatted ? formatted.toUpperCase() : '--';
        }
      },
      {
        key: 'gender',
        header: 'Sex',
        sortable: false,
        type: 'text',
        minWidth: '80px',
        valueFormatter: (value: any, row: any) => {
          const gender = row?.gender || row?.Gender;
          if (gender === 'M') return 'Male';
          if (gender === 'F') return 'Female';
          return gender || '--';
        }
      },
      {
        key: 'totalDonations',
        header: 'Donation Credits',
        sortable: false,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (value: any, row: any) => {
          const total = row?.totalDonations ?? row?.TotalDonations;
          return total !== null && total !== undefined ? total.toString() : '--';
        }
      },
      {
        key: 'gallons',
        header: 'Gallons Donated',
        sortable: false,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (value: any, row: any) => {
          const gallons = row?.gallons ?? row?.Gallons;
          return gallons !== null && gallons !== undefined ? gallons.toString() : '--';
        }
      },
      {
        key: 'collectionDate',
        header: 'Collection Date',
        sortable: false,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (value: any, row: any) => {
          const collDate = row?.collectionDate || row?.CollectionDate;
          if (!collDate) return '--';
          const formatted = DateFieldValidationUtility.formatDateForUI(new Date(collDate));
          return formatted ? formatted.toUpperCase() : '--';
        }
      },
      {
        key: 'lastUnitId',
        header: 'Unit ID',
        sortable: false,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (value: any, row: any) => row?.lastUnitId || row?.LastUnitId || '--'
      },
      {
        key: 'insertDate',
        header: 'Insert Date',
        sortable: false,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value: any, row: any) => {
          const insDate = row?.insertDate || row?.InsertDate;
          if (!insDate) return '--';
          const formatted = DateFieldValidationUtility.formatDateForUI(new Date(insDate));
          return formatted ? formatted.toUpperCase() : '--';
        }
      },
      {
        key: 'printFlag',
        header: 'Print Flag',
        sortable: false,
        type: 'text',
        minWidth: '100px',
        valueFormatter: (value: any, row: any) => {
          const flag = row?.printFlag || row?.PrintFlag;
          if (flag === 'Y') return 'Yes';
          if (flag === 'N') return 'No';
          if (flag === 'P') return 'Pending';
          return '--';
        }
      }
    ],
    rowActions: [],
    showActionsAsMenu: false,
    enableRowHighlight: false,
    stickyHeader: true,
    emptyMessage: 'No donor label records found',
    loadingMessage: 'Loading donor labels...'
  };

  constructor() {
    this.initializeForm();

    // Subscribe to printer search control changes and update signal
    this.printerSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.printerSearch.set(value || '');
      });

    // Watch for page header changes
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

  ngOnInit(): void {
    this.loadDropdownValues();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the search form with validators
   */
  private initializeForm(): void {
    this.searchForm = this.fb.group({
      searchType: ['', Validators.required],
      printerName: ['', Validators.required],
      fromDate: [null, [Validators.required, this.conditionalDateValidator('toDate'), DateFieldValidationUtility.validDateValidator()]],
      toDate: [null, [Validators.required, this.conditionalDateValidator('fromDate'), DateFieldValidationUtility.validDateValidator()]],
      gallonNumber: [
        { value: null, disabled: true },
        [
          Validators.min(1),
          Validators.max(50),
          Validators.pattern(/^[0-9]+$/) // Error 12008: Only numeric values allowed
        ]
      ]
    }, {
      validators: [this.dateRangeValidator()]
    });

    // Enable/disable gallon number based on search type
    this.searchForm.get('searchType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchType: SearchType) => {
        const gallonControl = this.searchForm.get('gallonNumber');
        if (searchType === 'GallonDonors') {
          gallonControl?.enable();
        } else {
          gallonControl?.setValue(null);
          gallonControl?.disable();
        }
      });

    // Set up conditional date validation
    this.setupDateValidation();
  }

  /**
   * Conditional date validator - requires this field if the other date field has a value
   */
  private conditionalDateValidator(otherControlName: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) {
        return null;
      }
      const otherControl = control.parent.get(otherControlName);
      if (!otherControl) {
        return null;
      }

      const thisValue = control.value;
      const otherValue = otherControl.value;

      // If the other field has a value but this field is empty, mark as conditionally required
      if (otherValue && !thisValue) {
        return { conditionallyRequired: true };
      }

      return null;
    };
  }

  /**
   * Cross-field date range validator
   * Oracle Forms VALIDATE_DATES trigger: Error 11065 when START_DATE > END_DATE
   */
  private dateRangeValidator() {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const fromDate = formGroup.get('fromDate')?.value;
      const toDate = formGroup.get('toDate')?.value;

      if (!fromDate || !toDate) {
        return null;
      }

      const from = DateFieldValidationUtility.serializeDateForApi(fromDate);
      const to = DateFieldValidationUtility.serializeDateForApi(toDate);

      if (from && to && from > to) {
        // Set error on fromDate control (Error 11065)
        formGroup.get('fromDate')?.setErrors({ dateRangeInvalid: true });
        return { dateRangeInvalid: true };
      }

      // Clear dateRangeInvalid error if dates are valid
      const fromControl = formGroup.get('fromDate');
      if (fromControl?.hasError('dateRangeInvalid')) {
        const errors = { ...fromControl.errors };
        delete errors['dateRangeInvalid'];
        fromControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      return null;
    };
  }

  /**
   * Set up date validation for cross-field validation (from date before to date)
   */
  private setupDateValidation(): void {
    const fromDateControl = this.searchForm.get('fromDate');
    const toDateControl = this.searchForm.get('toDate');

    if (!fromDateControl || !toDateControl) return;

    // Listen to value changes to update validation
    fromDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        toDateControl.updateValueAndValidity({ emitEvent: false });
        this.validateDates();
      });

    toDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        fromDateControl.updateValueAndValidity({ emitEvent: false });
        this.validateDates();
      });
  }

  /**
   * Subscribe to chapter changes to reload data
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadDropdownValues();
      });
  }

  /**
   * Load dropdown values (search types and printers) from backend
   */
  private loadDropdownValues(): void {
    this.isLoadingDropdowns.set(true);

    this.service.getDropdownValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dropdownValues) => {
          console.log('Dropdown values received:', dropdownValues);
          this.searchTypeOptions.set(dropdownValues.searchTypes || []);
          this.printerOptions.set(dropdownValues.printers || []);
          this.isLoadingDropdowns.set(false);

          // Show success message if no values
          if (!dropdownValues.searchTypes?.length && !dropdownValues.printers?.length) {
            console.warn('No dropdown values returned from API');
          }
        },
        error: (error) => {
          console.error('Error loading dropdown values:', error);
          const errorMsg = error?.error?.message || error?.message || 'Failed to load dropdown values';
          this.showErrorToast(errorMsg);

          // Set default search types if API fails
          this.searchTypeOptions.set([
            { value: 'FirstTimeFixed', label: 'First Time Donors' },
            { value: 'GallonDonors', label: 'Gallon Donors' }
          ]);
          this.printerOptions.set([]);
          this.isLoadingDropdowns.set(false);
        }
      });
  }

  /**
   * Validate date range
   * GAP FIX #2: Convert user input dates to chapter timezone before validation
   * Oracle Forms VALIDATE_DATES uses Lifetrack_timezone_convert.get_local_time() for comparison
   */
  private validateDates(): void {
    const fromDate = this.searchForm.get('fromDate')?.value;
    const toDate = this.searchForm.get('toDate')?.value;

    if (!fromDate || !toDate) return;

    // Get chapter local date for comparison (Error 18014: Date cannot be in future)
    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();
    const today = chapterLocalDate.format('YYYY-MM-DD');

    // Serialize dates for comparison
    const fromStr = DateFieldValidationUtility.serializeDateForApi(fromDate);
    const toStr = DateFieldValidationUtility.serializeDateForApi(toDate);

    // Check if dates are in the future (compared against chapter local date)
    if (fromStr && fromStr > today) {
      this.searchForm.get('fromDate')?.setErrors({ futureDate: true });
    }

    if (toStr && toStr > today) {
      this.searchForm.get('toDate')?.setErrors({ futureDate: true });
    }
  }

  /**
   * Handle date input events
   */
  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('fromDate')
    );
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('toDate')
    );
  }

  /**
   * Prevent non-numeric characters and values > 50 in gallon number field
   */
  onGallonNumberKeyDown(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-', '.'].includes(event.key)) {
      event.preventDefault();
      return;
    }

    // Allow control keys (Backspace, Delete, Tab, Arrow keys, etc.)
    if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    // Block non-digit keys
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Preview what the value would be after this keystroke
    const input = event.target as HTMLInputElement;
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? input.value.length;
    const newValue = input.value.substring(0, selectionStart) + event.key + input.value.substring(selectionEnd);
    const numValue = parseInt(newValue, 10);

    if (numValue > 50) {
      event.preventDefault();
    }
  }

  /**
   * Handle gallon number input to enforce max value of 50
   * Per Oracle Forms GALLANS.WHEN-VALIDATE-ITEM: prevents values > 50 (Error 18004)
   */
  onGallonNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.searchForm.get('gallonNumber');

    if (input.value === '') {
      control?.setValue(null);
      return;
    }

    const value = parseInt(input.value, 10);

    if (isNaN(value)) {
      input.value = '';
      control?.setValue(null);
      return;
    }

    if (value > 50) {
      input.value = '50';
      control?.setValue(50);
      control?.markAsTouched();
      return;
    }

    if (value < 1) {
      input.value = '1';
      control?.setValue(1);
      control?.markAsTouched();
      return;
    }

    control?.setValue(value);
  }

  /**
   * Handle paste in gallon number field - clamp to valid range
   */
  onGallonNumberPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numValue = parseInt(pastedText, 10);
    const control = this.searchForm.get('gallonNumber');
    const input = event.target as HTMLInputElement;

    if (isNaN(numValue) || numValue < 1) {
      return;
    }

    const clamped = Math.min(numValue, 50);
    input.value = clamped.toString();
    control?.setValue(clamped);
  }

  /**
   * Handle gallon number blur event to show validation errors
   */
  onGallonNumberBlur(): void {
    const control = this.searchForm.get('gallonNumber');
    control?.markAsTouched();
  }

  /**
   * Execute search for donor labels
   */
  onRetrieve(resetPrintFlagAction: boolean = false): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.isLoadingData.set(true);
    this.hasSearched.set(true);

    // Reset print flag action only when explicitly requested (user manual search)
    if (resetPrintFlagAction) {
      this.lastPrintFlagAction.set(null);
    }

    const formValue = this.searchForm.getRawValue();

    const request: DonorLabelSearchRequest = {
      searchType: formValue.searchType,
      startDate: DateFieldValidationUtility.serializeDateForApi(formValue.fromDate)!,
      endDate: DateFieldValidationUtility.serializeDateForApi(formValue.toDate)!,
      gallonNumber: formValue.gallonNumber || null,
      printerName: formValue.printerName,
      take: 1000, // Get all records
      skip: 0
    };

    // Store for future reference
    this.lastSearchRequest = request;

    console.log('Search request:', request);

    this.service.searchDonorLabels(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Search response received:', response);
          console.log('Response data:', response.data);
          console.log('Total count:', response.totalCount);

          // Add row index to each record for sequence numbering
          const dataWithIndex = (response.data || []).map((item: any, index: number) => ({
            ...item,
            rowIndex: index + 1
          }));

          // Store original data and set initial sort to Sequence ascending
          this.originalSearchResults = [...dataWithIndex];
          this.searchResults.set(dataWithIndex);
          this.totalRecords.set(response.totalCount);
          this.tableConfig.sortConfig = { column: 'rowIndex', direction: 'A' };
          this.isLoadingData.set(false);

          console.log('Search results set to:', this.searchResults());
          console.log('Has results?', this.hasResults());
          console.log('Has records with Print Flag N?', this.hasRecordsWithPrintFlagNo());
        },
        error: (error) => {
          console.error('Search error:', error);
          this.showErrorToast(error?.error?.message || 'Failed to search donor labels');
          this.searchResults.set([]);
          this.totalRecords.set(0);
          this.isLoadingData.set(false);
        }
      });
  }

  /**
   * Clear form and results
   */
  onClear(): void {
    this.searchForm.reset();
    this.searchResults.set([]);
    this.originalSearchResults = [];
    this.totalRecords.set(0);
    this.hasSearched.set(false);
    this.lastSearchRequest = null;
    this.lastPrintFlagAction.set(null);
    this.tableConfig.sortConfig = { column: 'rowIndex', direction: 'A' };

    console.log('Search cleared');
  }

  /**
   * Handle table sort change
   * Implements three-state sorting: ascending -> descending -> neutral
   */
  onSortChange(event: TableSortEvent): void {
    console.log('Sort change:', event);

    let newDirection: 'A' | 'D' | 'default';

    // Determine the next sort direction based on current state
    if (!this.tableConfig.sortConfig || this.tableConfig.sortConfig.column !== event.column) {
      // New column clicked - start with ascending
      newDirection = 'A';
    } else {
      // Same column clicked - cycle through states
      if (this.tableConfig.sortConfig.direction === 'A') {
        newDirection = 'D';
      } else if (this.tableConfig.sortConfig.direction === 'D') {
        newDirection = 'default';
      } else {
        newDirection = 'A';
      }
    }

    // Update sort config
    this.tableConfig.sortConfig = {
      column: event.column,
      direction: newDirection
    };

    // Apply sorting
    this.applySorting(event.column, newDirection);
  }

  /**
   * Apply sorting to search results
   */
  private applySorting(columnKey: string, direction: 'A' | 'D' | 'default'): void {
    if (direction === 'default') {
      // Restore original order
      this.searchResults.set([...this.originalSearchResults]);
      console.log('Restored original order');
      return;
    }

    const sortedData = [...this.searchResults()].sort((a: any, b: any) => {
      const aValue = a[columnKey];
      const bValue = b[columnKey];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return direction === 'A' ? 1 : -1;
      if (bValue == null) return direction === 'A' ? -1 : 1;

      // Numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'A' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      const comparison = aStr.localeCompare(bStr);
      return direction === 'A' ? comparison : -comparison;
    });

    this.searchResults.set(sortedData);
    console.log(`Sorted by ${columnKey} (${direction === 'A' ? 'ascending' : 'descending'})`);
  }

  /**
   * Set all print flags to 'N'
   */
  onSetPrintFlagNo(): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Set the print flag "NO"',
      message: 'This action will update the print flag to "NO" for all records. Do you want to continue?',
      confirmText: 'YES',
      cancelText: 'NO, CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.updatePrintFlags('N');
        }
      });
  }

  /**
   * Set all print flags to 'Y'
   */
  onSetPrintFlagYes(): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Set the print flag "YES"',
      message: 'This action will update the print flag to "YES" for all records. Do you want to continue?',
      confirmText: 'YES',
      cancelText: 'NO, CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.updatePrintFlags('Y');
        }
      });
  }

  /**
   * Update print flags for all current results
   */
  private updatePrintFlags(printFlag: 'Y' | 'N'): void {
    const records: PrintFlagRecord[] = this.searchResults().map((label: any) => ({
      donorId: label.donorId || label.DonorId,
      collectionDate: DateFieldValidationUtility.serializeDateForApi(new Date(label.collectionDate || label.CollectionDate))!
    }));

    if (records.length === 0) {
      this.showErrorToast('No records to update');
      return;
    }

    const request: UpdatePrintFlagsRequest = {
      printFlag,
      records
    };

    this.isProcessing.set(true);

    this.service.updatePrintFlags(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const message = printFlag === 'N'
            ? 'All Flags are updated to No'
            : 'All Flags are updated to Yes';
          this.showSuccessToast(message);
          console.log(`Updated print flags to "${printFlag}" for ${response.updatedCount} record(s)`);
          console.log('Generate Labels will be:', printFlag === 'N' ? 'ENABLED' : 'DISABLED');
          // Track the last print flag action
          this.lastPrintFlagAction.set(printFlag);
          this.isProcessing.set(false);
          // Refresh the table
          this.onRetrieve();
        },
        error: (error) => {
          this.showErrorToast(error?.error?.message || 'Failed to update print flags');
          this.isProcessing.set(false);
        }
      });
  }

  /**
   * Generate labels (create communication records)
   */
  onGenerateLabels(): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Generate Labels',
      message: 'Do you want to create labels - This will create entry in Donor Communications.',
      confirmText: 'YES',
      cancelText: 'NO, CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.generateLabels();
        }
      });
  }

  /**
   * Execute label generation
   */
  private generateLabels(): void {
    const formValue = this.searchForm.getRawValue();
    const request: GenerateLabelsRequest = {
      searchType: formValue.searchType,
      startDate: DateFieldValidationUtility.serializeDateForApi(formValue.fromDate)!,
      endDate: DateFieldValidationUtility.serializeDateForApi(formValue.toDate)!,
      gallonNumber: formValue.gallonNumber || null
    };

    this.isProcessing.set(true);

    this.service.generateLabels(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessToast(`Generated labels for ${response.generatedCount} donor(s)`);
          this.isProcessing.set(false);
          // Refresh the table
          this.onRetrieve();
        },
        error: (error) => {
          this.showErrorToast(error?.error?.message || 'Failed to generate labels');
          this.isProcessing.set(false);
        }
      });
  }

  /**
   * Print labels (submit print job)
   */
  onPrintLabels(): void {
    const printerName = this.searchForm.get('printerName')?.value;
    const dialogData: ConfirmActionDialogData = {
      title: 'Print Labels',
      message: `Is printer ${printerName} loaded with labels?`,
      confirmText: 'YES',
      cancelText: 'NO, CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.printLabels();
        }
      });
  }

  /**
   * Execute print job submission
   */
  private printLabels(): void {
    const formValue = this.searchForm.getRawValue();
    const request: PrintLabelsRequest = {
      searchType: formValue.searchType,
      startDate: DateFieldValidationUtility.serializeDateForApi(formValue.fromDate)!,
      endDate: DateFieldValidationUtility.serializeDateForApi(formValue.toDate)!,
      gallonNumber: formValue.gallonNumber || null,
      printerName: formValue.printerName
    };

    this.isProcessing.set(true);

    this.service.printLabels(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const jobIdentifier = response.jobId || response.parmId;
          this.showSuccessToast(`Print job submitted successfully. Job ID: ${jobIdentifier}`);
          this.isProcessing.set(false);
          // Refresh the table
          this.onRetrieve();
        },
        error: (error) => {
          this.showErrorToast(error?.error?.message || 'Failed to submit print job');
          this.isProcessing.set(false);
        }
      });
  }

  /**
   * Show success toast notification (top-right)
   */
  private showSuccessToast(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error toast notification (top-right)
   */
  private showErrorToast(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Check if retrieve button should be disabled
   */
  get isRetrieveDisabled(): boolean {
    // Disable if loading or form is invalid
    return this.isLoadingData() || this.searchForm.invalid;
  }

  /**
   * Check if Clear All button should be disabled
   */
  get isClearDisabled(): boolean {
    return this.searchForm.pristine;
  }

  /**
   * Check if action buttons should be disabled
   */
  get areActionsDisabled(): boolean {
    return !this.hasResults() || this.isProcessing();
  }

  /**
   * Check if Generate Labels button should be disabled
   * Per Oracle Forms: enabled only when there are records with print flag = 'N'
   */
  get isGenerateLabelsDisabled(): boolean {
    return !this.hasResults() || this.isProcessing() || !this.hasRecordsWithPrintFlagNo();
  }

  /**
   * Check if Print Labels button should be disabled
   * Per Oracle Forms: disabled when records have print flag = 'N' (must generate first),
   * enabled when all records have been generated (all flags = 'Y' or 'P')
   */
  get isPrintLabelsDisabled(): boolean {
    return !this.hasResults() || this.isProcessing() || this.hasRecordsWithPrintFlagNo();
  }

  /**
   * Get form controls for template access
   */
  get f() {
    return this.searchForm.controls;
  }

  /**
   * Get max date constraint for From Date picker
   * From Date cannot be after To Date
   */
  get maxDateForFromDate(): Date | null {
    return this.searchForm?.get('toDate')?.value || null;
  }

  /**
   * Get min date constraint for To Date picker
   * To Date cannot be before From Date
   */
  get minDateForToDate(): Date | null {
    return this.searchForm?.get('fromDate')?.value || null;
  }
}
