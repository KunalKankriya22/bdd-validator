import { Component, OnInit, OnDestroy, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, debounceTime, finalize } from 'rxjs';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { SupplierQueryService } from './services/supplier-query.service';
import {
  SupplierLookup,
  SupplierQueryResult,
  SupplierQuerySearchRequest
} from './models/supplier-query.model';

@Component({
  selector: 'app-supplier-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  templateUrl: './supplier-query.component.html',
  styleUrl: './supplier-query.component.scss',
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class SupplierQueryComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `supplier-query-${SupplierQueryComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly supplierQueryService = inject(SupplierQueryService);
  private readonly headerService = inject(HeaderService);

  // Lifecycle management
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly suppliers = signal<SupplierLookup[]>([]);
  protected readonly results = signal<SupplierQueryResult[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly loadingSuppliers = signal<boolean>(false);
  protected readonly selectedSupplierName = signal<string>('');
  protected readonly totalRecords = signal<number>(0);
  protected readonly hasSearched = signal<boolean>(false);

  // Search control for searchable Supplier dropdown
  readonly supplierSearchControl = new FormControl('');

  // Signals for supplier search filtering
  private readonly supplierSearch = signal('');

  // Computed values
  protected readonly tableData = computed(() => {
    return this.results().map((row, index) => ({
      ...row,
      _expandKey: `${this.currentPage()}_${index}_${row.testId}_${row.reagentCode}_${row.lotNumber}`
    }));
  });
  protected readonly hasResults = computed(() => this.results().length > 0);
  protected readonly isEmpty = computed(() => this.hasSearched() && !this.hasResults() && !this.loading());
  protected readonly filteredSuppliers = computed(() => {
    const search = this.supplierSearch().toLowerCase();
    const allSuppliers = this.suppliers();
    if (!search) return allSuppliers;
    return allSuppliers.filter(s =>
      s.supplierCode.toLowerCase().includes(search) ||
      s.supplierName.toLowerCase().includes(search)
    );
  });

  // Pagination state
  protected currentPage = signal<number>(0);
  protected pageSize = signal<number>(25);

  // Expandable Rows - single row at a time via Set with one entry max
  protected readonly expandedRows = new Set<string>();

  // Form
  filterForm!: FormGroup;

  // Date filters and error matchers
  receivedDateToFilterFn!: (date: moment.Moment | null) => boolean;
  minReceivedDateTo: moment.Moment | null = null;

  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getReceivedDateFromError());
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getReceivedDateToError());

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Supplier Query', link: '' }
    ],
    title: 'Supplier Query',
    subtitle: 'Define valid collection facility identification number for ISBT contracts.',
    actions: []
  };

  // Table configuration - only 4 main columns visible; rest shown in expand detail
  tableConfig: DataTableConfig<SupplierQueryResult> = {
    columns: [
      {
        key: 'testId',
        header: 'Test Code',
        type: 'text',
        width: '120px'
      },
      {
        key: 'testDesc',
        header: 'Test Description',
        type: 'text',
        width: '200px'
      },
      {
        key: 'reagentCode',
        header: 'Reagent Code',
        type: 'text',
        width: '150px'
      },
      {
        key: 'reagentName',
        header: 'Reagent Description',
        type: 'text',
        width: '200px'
      }
    ],
    pagination: {
      pageIndex: 0,
      pageSize: 25,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100]
    },
    showPagination: true,
    stickyHeader: true,
    hideExpandAllInHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Select a supplier and click RETRIEVE to begin.'
  };

  ngOnInit(): void {
    this.initForm();
    this.setupDateFilters();
    this.loadSuppliers();
    this.setupFormValueChanges();
    this.setupSupplierSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      supplierId: ['', [Validators.required, Validators.maxLength(5)]],
      supplierDescription: [{ value: '', disabled: true }],
      receivedDateFrom: [null, [DateFieldValidationUtility.validDateValidator()]],
      receivedDateTo: [null, [DateFieldValidationUtility.validDateValidator()]]
    }, {
      validators: [DateFieldValidationUtility.fromToDateRangeValidator('receivedDateFrom', 'receivedDateTo')]
    });
  }

  /**
   * Handle input event for Received Date From field
   */
  onReceivedDateFromInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('receivedDateFrom');
    if (!control) return;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      // If input has text but control value is null, datepicker couldn't parse it
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  /**
   * Handle input event for Received Date To field
   */
  onReceivedDateToInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('receivedDateTo');
    if (!control) return;

    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      // If input has text but control value is null, datepicker couldn't parse it
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  /**
   * Setup date filters for Received Date To picker
   * Disables dates before the selected From date
   */
  private setupDateFilters(): void {
    // Filter for Received Date To - must be on or after From date
    this.receivedDateToFilterFn = (date: moment.Moment | null): boolean => {
      if (!date) return true;

      const fromDate = this.filterForm?.get('receivedDateFrom')?.value;
      if (!fromDate) return true;

      const fromMoment = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const checkDate = moment(date).startOf('day');
      const fromDay = moment(fromMoment).startOf('day');

      return checkDate.isSameOrAfter(fromDay);
    };

    // Update min date for To field when From date changes
    this.filterForm.get('receivedDateFrom')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((fromDate) => {
        if (fromDate && moment.isMoment(fromDate)) {
          this.minReceivedDateTo = fromDate;
        } else {
          this.minReceivedDateTo = null;
        }
      });
  }

  /**
   * Get error message for Received Date From field
   */
  getReceivedDateFromError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('receivedDateFrom'),
      this.filterForm.errors,
      'Received Date From',
      'Received Date From must be on or before Received Date To'
    );
  }

  /**
   * Get error message for Received Date To field
   */
  getReceivedDateToError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('receivedDateTo'),
      this.filterForm.errors,
      'Received Date To',
      'Received Date To must be on or after Received Date From'
    );
  }

  private setupFormValueChanges(): void {
    // Auto-populate supplier name when supplier is selected
    // Gap Fix #5: Add auto-focus to date field after supplier selection
    this.filterForm.get('supplierId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(supplierCode => {
        if (supplierCode) {
          const supplier = this.suppliers().find(s => s.supplierCode === supplierCode);
          if (supplier) {
            this.filterForm.patchValue({ supplierDescription: supplier.supplierName }, { emitEvent: false });
            this.selectedSupplierName.set(supplier.supplierName);

            // Auto-focus on date field (matching Oracle Forms S_SUPPLIER_CODE VALIDATE_FIELD trigger)
            setTimeout(() => {
              const dateInput = document.getElementById(this.elementId('received-date-from'));
              if (dateInput) {
                dateInput.focus();
              }
            }, 100);
          }
        } else {
          this.filterForm.patchValue({ supplierDescription: '' }, { emitEvent: false });
          this.selectedSupplierName.set('');
        }
      });

    // Gap Fix #10: Auto-execute query when both dates are set and form is valid
    // Matching Oracle Forms S_DATE_END VALIDATE_FIELD auto-execute behavior
    this.filterForm.get('receivedDateTo')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500) // Debounce to avoid multiple triggers
      )
      .subscribe(() => {
        // Auto-execute only if supplier is selected and form is valid
        if (this.filterForm.valid && this.filterForm.get('supplierId')?.value) {
          this.onRetrieve();
        }
      });
  }

  private setupSupplierSearch(): void {
    // Update supplier search signal when search control value changes
    this.supplierSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.supplierSearch.set(value || '');
      });
  }

  /**
   * Subscribe to chapter changes from header
   * When chapter changes, reload suppliers and clear form
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadSuppliers();
      });
  }

  private loadSuppliers(): void {
    this.loadingSuppliers.set(true);
    this.supplierQueryService.getSuppliersLookup()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingSuppliers.set(false))
      )
      .subscribe((suppliers) => {
        this.suppliers.set(suppliers);
      });
  }

  get f() {
    return this.filterForm.controls;
  }

  hasAnyFilterValue(): boolean {
    const v = this.filterForm.getRawValue();
    return !!(v.supplierId || v.receivedDateFrom || v.receivedDateTo);
  }

  onRetrieve(): void {
    this.submitted.set(true);

    if (this.filterForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    // Reset pagination when performing new search
    this.currentPage.set(0);
    this.hasSearched.set(true);
    this.performSearch();
  }

  private performSearch(): void {
    this.performSearchWithAppend();
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.submitted.set(false);
    this.results.set([]);
    this.totalRecords.set(0);
    this.currentPage.set(0);
    this.selectedSupplierName.set('');
    this.supplierSearchControl.reset('');
    this.expandedRows.clear();
    this.hasSearched.set(false);
    this.updateTableConfig();
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.expandedRows.clear();
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageSize: event.pageSize,
        pageIndex: event.pageIndex
      }
    };
    this.performSearch();
  }

  private updateTableConfig(): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        pageIndex: this.currentPage(),
        pageSize: this.pageSize(),
        totalRecords: this.totalRecords(),
        pageSizeOptions: [10, 25, 50, 100]
      }
    };
  }

  onRowExpandToggle(row: SupplierQueryResult): void {
    const key = (row as any)._expandKey;
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.clear();
      this.expandedRows.add(key);
    }
  }

  /**
   * Format date for display
   * Gap Fix #8: Use MM-DD-YY format (matching Oracle Forms FORMAT_MASK)
   */
  protected formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('MM-DD-YY').toUpperCase() : '-';
  }

  private performSearchWithAppend(): void {
    const formValue = this.filterForm.getRawValue();

    const request: SupplierQuerySearchRequest = {
      supplierCode: formValue.supplierId,
      dateStart: formValue.receivedDateFrom
        ? moment(formValue.receivedDateFrom).format('YYYY-MM-DD')
        : undefined,
      dateEnd: formValue.receivedDateTo
        ? moment(formValue.receivedDateTo).format('YYYY-MM-DD')
        : undefined,
      take: this.pageSize(),
      skip: this.currentPage() * this.pageSize()
    };

    this.loading.set(true);
    this.expandedRows.clear();
    this.supplierQueryService.searchSupplierQuery(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe((response) => {
        this.results.set(response.data);
        this.totalRecords.set(response.total);
        this.updateTableConfig();
      });
  }

  /**
   * Gap Fix #11: Keyboard shortcut for previous block navigation
   * Ctrl+Up or Escape to clear form and return to criteria
   * Matching Oracle Forms KEY-PRVBLK trigger behavior
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Ctrl+Up to clear and return to criteria (matching Oracle Forms KEY-PRVBLK)
    if ((event.ctrlKey && event.key === 'ArrowUp') || event.key === 'Escape') {
      if (this.hasResults()) {
        event.preventDefault();
        this.onClearAll();
        // Focus on supplier dropdown
        setTimeout(() => {
          const supplierSelect = document.getElementById(this.elementId('supplier'));
          if (supplierSelect) {
            supplierSelect.focus();
          }
        }, 100);
      }
    }
  }
}
