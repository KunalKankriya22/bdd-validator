import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  effect,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Router } from '@angular/router';
import { EMPTY, Subject, takeUntil, switchMap, map } from 'rxjs';
import moment from 'moment';

import {
  HospitalReturnItemDto,
  HospitalReturnItemQueryDto,
  DropdownOption,
  ReturnCodeOption,
  ScanProductResult,
  EvaluateReturnResult,
} from './models/hospital-return-item.model';
import { HospitalReturnItemApiService } from './services/hospital-return-item-api.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { AddEditHospitalReturnItemDialogComponent } from './add-edit-hospital-return-item-dialog/add-edit-hospital-return-item-dialog';
import { CustomerMismatchDialogComponent, CustomerMismatchDialogData } from './customer-mismatch-dialog/customer-mismatch-dialog';
import { PrintReturnSlipDialogComponent, PrintReturnSlipDialogData } from './print-return-slip-dialog/print-return-slip-dialog';
import { VisualCheckDialogComponent } from './visual-check-dialog/visual-check-dialog';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';

/**
 * Hospital Returns Component (IMIRETN)
 * Manages hospital return items with full CRUD operations
 * JIRA: MLT-14068
 */
@Component({
  selector: 'app-hospital-returns',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
  ],
  templateUrl: './hospital-returns.html',
  styleUrls: ['./hospital-returns.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalReturnsComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `hospital-returns-${HospitalReturnsComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Page header configuration — title & subtitle resolved from menu API via PageHeaderService
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
  };

  // Filter form — at least one of returnId or customerId must be set
  filterForm = new FormGroup(
    {
      returnId: new FormControl<string | null>(null),
      customerId: new FormControl<string | null>(null),
      by: new FormControl<string | null>({ value: null, disabled: true }),
    },
    {
      validators: (group) =>
        group.get('returnId')?.value || group.get('customerId')?.value
          ? null
          : { atLeastOneRequired: true },
    },
  );

  // Dropdown options (placeholder — will be loaded from API)
  returnIdOptions = signal<DropdownOption[]>([]);
  customerIdOptions = signal<DropdownOption[]>([]);
  byOptions = signal<DropdownOption[]>([]);

  // Search controls for filterable dropdowns (matches Donor Communication Query)
  protected readonly returnIdSearchControl = new FormControl('');
  protected readonly customerIdSearchControl = new FormControl('');
  protected readonly bySearchControl = new FormControl('');
  protected readonly returnIdSearch = signal('');
  protected readonly customerIdSearch = signal('');
  protected readonly bySearch = signal('');

  // Track selected values for custom trigger displays
  private readonly returnIdValue = signal<string | null>(null);
  private readonly customerIdValue = signal<string | null>(null);
  private readonly byValue = signal<string | null>(null);

  // Filtered dropdown options (computed)
  protected readonly filteredReturnIds = computed(() => {
    const search = this.returnIdSearch().toLowerCase();
    const options = this.returnIdOptions();
    if (!search) return options;
    return options.filter((o) =>
      o.value.toLowerCase().includes(search) ||
      o.label.toLowerCase().includes(search),
    );
  });

  protected readonly filteredCustomerIds = computed(() => {
    const search = this.customerIdSearch().toLowerCase();
    const options = this.customerIdOptions();
    if (!search) return options;
    return options.filter((o) =>
      o.value.toLowerCase().includes(search) ||
      o.label.toLowerCase().includes(search),
    );
  });

  protected readonly filteredByOptions = computed(() => {
    const search = this.bySearch().toLowerCase();
    const options = this.byOptions();
    if (!search) return options;
    return options.filter((o) =>
      o.value.toLowerCase().includes(search) ||
      o.label.toLowerCase().includes(search),
    );
  });

  // Custom display for selected values (used in mat-select-trigger)
  protected readonly selectedReturnIdDisplay = computed(() => {
    const selected = this.returnIdValue();
    if (!selected) return '';
    const opt = this.returnIdOptions().find((o) => o.value === selected);
    return opt ? opt.label : selected;
  });

  protected readonly selectedCustomerIdDisplay = computed(() => {
    const selected = this.customerIdValue();
    if (!selected) return '';
    const opt = this.customerIdOptions().find((o) => o.value === selected);
    return opt ? opt.label : selected;
  });

  protected readonly selectedByDisplay = computed(() => {
    const selected = this.byValue();
    if (!selected) return '';
    const opt = this.byOptions().find((o) => o.value === selected);
    return opt ? opt.label : selected;
  });

  // Detail card visibility — shown after RETRIEVE is clicked
  protected readonly hasSearched = signal<boolean>(false);

  // Shared Unit ID field component
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Detail card form
  detailForm = new FormGroup({
    productCode: new FormControl<string | null>(null, Validators.required),
    aboRh: new FormControl<string | null>(null, Validators.required),
    expDate: new FormControl<string | null>(null),
    returnCode: new FormControl<string | null>(null, Validators.required),
    returnReason: new FormControl<string | null>({ value: null, disabled: true }),
  });

  expirationDateDisplay = signal<string>('');
  aliquotDisplay = signal<string>('-');
  orderDateDisplay = signal<string>('-');
  isManualExpiry = signal<boolean>(false);

  protected readonly remainingLifeDisplay = computed(() => {
    const scan = this.scanResult();
    if (!scan?.expDate) return '';
    const exp = moment(scan.expDate);
    if (!exp.isValid()) return '';
    const now = moment();
    const diffDays = exp.diff(now, 'days');
    const diffHours = exp.diff(now, 'hours');
    if (diffHours < 0) return 'Expired';
    if (diffDays === 0) return `${diffHours}h remaining`;
    return `${diffDays}d remaining`;
  });

  readonly detailFieldErrorMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      return !!(control && control.invalid && this.unitIdValidated());
    },
  };

  // Detail card dropdown options
  productCodeOptions = signal<DropdownOption[]>([]);
  aboRhOptions = signal<DropdownOption[]>([]);
  returnCodeOptions = signal<ReturnCodeOption[]>([]);

  // Detail card search controls
  protected readonly productCodeSearchControl = new FormControl('');
  protected readonly aboRhSearchControl = new FormControl('');
  protected readonly returnCodeSearchControl = new FormControl('');
  protected readonly returnCodeSearch = signal('');

  // Detail card value tracking
  private readonly productCodeValue = signal<string | null>(null);
  private readonly aboRhValue = signal<string | null>(null);
  private readonly returnCodeValue = signal<string | null>(null);

  // Autocomplete filter signals (driven by form control input)
  protected readonly productCodeFilter = signal('');
  protected readonly aboRhFilter = signal('');

  // Detail card filtered dropdowns
  protected readonly filteredProductCodes = computed(() => {
    const search = this.productCodeFilter().toLowerCase();
    const options = this.productCodeOptions();
    if (!search) return options;
    return options.filter((o) =>
      o.value.toLowerCase().includes(search) ||
      o.label.toLowerCase().includes(search),
    );
  });

  protected readonly filteredAboRhOptions = computed(() => {
    const search = this.aboRhFilter().toLowerCase();
    const options = this.aboRhOptions();
    if (!search) return options;
    return options.filter((o) =>
      o.value.toLowerCase().includes(search) ||
      o.label.toLowerCase().includes(search),
    );
  });

  protected readonly filteredReturnCodes = computed(() => {
    const search = this.returnCodeSearch().toLowerCase();
    const options = this.returnCodeOptions();
    if (!search) return options;
    return options.filter((o) =>
      o.value.toLowerCase().includes(search) ||
      o.label.toLowerCase().includes(search),
    );
  });

  // Detail card display computeds
  protected readonly selectedProductCodeDisplay = computed(() => {
    const selected = this.productCodeValue();
    if (!selected) return '';
    const opt = this.productCodeOptions().find((o) => o.value === selected);
    return opt ? opt.label : selected;
  });

  protected readonly selectedAboRhDisplay = computed(() => {
    const selected = this.aboRhValue();
    if (!selected) return '';
    const opt = this.aboRhOptions().find((o) => o.value === selected);
    return opt ? opt.label : selected;
  });

  protected readonly selectedReturnCodeDisplay = computed(() => {
    const selected = this.returnCodeValue();
    if (!selected) return '';
    const opt = this.returnCodeOptions().find((o) => o.value === selected);
    return opt ? opt.label : selected;
  });

  // Autocomplete display functions
  displayProductCode = (value: string): string => {
    if (!value) return '';
    const opt = this.productCodeOptions().find((o) => o.value === value);
    return opt ? opt.label : value;
  };

  displayAboRh = (value: string): string => {
    if (!value) return '';
    const opt = this.aboRhOptions().find((o) => o.value === value);
    return opt ? opt.label : value;
  };

  // Detail card truncation detection
  protected isProductCodeTruncated = false;
  protected isAboRhTruncated = false;
  protected isReturnCodeTruncated = false;

  // Return reason auto-populated on Return Code selection
  returnReason = signal<string>('-');

  // Scan/Evaluate/Commit flow state
  scanResult = signal<ScanProductResult | null>(null);
  evaluateResult = signal<EvaluateReturnResult | null>(null);
  isScanning = signal<boolean>(false);
  private unitValidationData = signal<UnitValidationResponse | null>(null);

  // Dropdown tooltip truncation detection
  protected isReturnIdTruncated = false;
  protected isCustomerIdTruncated = false;
  protected isByTruncated = false;

  // Customer name auto-populated on Customer ID selection
  customerName = signal<string>('-');

  // Form dirty tracking for Clear All button
  formDirty = signal<boolean>(false);

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Shared data-table configuration
  protected tableDataSource: HospitalReturnItemDto[] = [];
  protected isTableLoading = false;
  protected unitIdValidated = signal<boolean>(false);

  private lastQueryDto: HospitalReturnItemQueryDto = {};
  private currentSortColumn = 'unitId';
  private currentSortOrder: 'ASC' | 'DESC' = 'ASC';

  tableConfig: DataTableConfig<HospitalReturnItemDto> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true, type: 'text', minWidth: '160px', valueFormatter: (_v: string | null, row: HospitalReturnItemDto) => `${row.unitId}${row.checkDigit || ''}` },
      { key: 'productCode', header: 'Product Code', sortable: false, type: 'text', minWidth: '120px', valueFormatter: (v: string | null) => v || '--' },
      { key: 'aliquot', header: 'Aliquot', sortable: false, type: 'text', minWidth: '70px', valueFormatter: (v: string | null) => v || '--' },
      { key: 'aboRh', header: 'ABO/Rh', sortable: false, type: 'text', minWidth: '80px', valueFormatter: (v: string | null) => v || '--' },
      { key: 'expDate', header: 'Expiration Date', sortable: false, type: 'text', minWidth: '160px', valueFormatter: (v: string | null) => v ? this.formatDate(v) : '--' },
      { key: 'returnReasonCode', header: 'Return Code', sortable: false, type: 'text', minWidth: '120px', valueFormatter: (v: string | null) => v || '--' },
      { key: 'returnReasonDescription', header: 'Reason Code', sortable: false, type: 'text', minWidth: '140px', valueFormatter: (v: string | null) => v || '--' },
      { key: 'locationId', header: 'Location ID', sortable: false, type: 'text', minWidth: '130px', valueFormatter: (v: string | null) => v || '--' },
    ],
    stickyHeader: true,
    sortConfig: { column: 'unitId', direction: 'A' },
    noDataIcon: 'search',
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    showPagination: false,
    enableRowHighlight: false,
  };

  // Lifecycle management
  private destroy$ = new Subject<void>();

  get isRetrieveDisabled(): boolean {
    return this.loading() || this.filterForm.invalid;
  }


  constructor(
    private apiService: HospitalReturnItemApiService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {
    // Update breadcrumb from page header service (title & subtitle auto-resolve in header component)
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
        };
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.subscribeToFormChanges();
    this.setupSearchControls();
    this.loadDropdowns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes from header
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadDropdowns();
    });
  }

  private subscribeToFormChanges(): void {
    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.formDirty.set(this.filterForm.dirty);
    });
  }

  private setupSearchControls(): void {
    this.returnIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.returnIdSearch.set(value || ''));

    this.customerIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.customerIdSearch.set(value || ''));

    this.bySearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.bySearch.set(value || ''));

    this.filterForm.get('returnId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.returnIdValue.set(val));

    this.filterForm.get('customerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.customerIdValue.set(val));

    this.filterForm.get('by')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.byValue.set(val));

    this.productCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.productCodeFilter.set(value || ''));

    this.aboRhSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.aboRhFilter.set(value || ''));

    this.returnCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.returnCodeSearch.set(value || ''));

    this.detailForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.productCodeValue.set(val);
      });

    this.detailForm.get('aboRh')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.aboRhValue.set(val);
      });

    this.detailForm.get('returnCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.returnCodeValue.set(val);
        this.onReturnCodeChange(val);
      });
  }

  private loadDropdowns(): void {
    this.apiService.getReturnIds().pipe(takeUntil(this.destroy$)).subscribe((options) => {
      this.returnIdOptions.set(options);
      this.cdr.markForCheck();
    });

    this.apiService.getCustomerIds().pipe(takeUntil(this.destroy$)).subscribe((options) => {
      this.customerIdOptions.set(options);
      this.cdr.markForCheck();
    });

    this.apiService.getReturnCodes().pipe(takeUntil(this.destroy$)).subscribe((options) => {
      this.returnCodeOptions.set(options);
      this.cdr.markForCheck();
    });
  }

  onReturnIdChange(event: MatSelectChange): void {
    if (!event.value) return;

    this.apiService.getReturnAdviceDetails(event.value).pipe(
      takeUntil(this.destroy$),
      switchMap((advice) => {
        if (!advice) return EMPTY;

        const customerIdControl = this.filterForm.get('customerId');
        const byControl = this.filterForm.get('by');
        const resolvedCustomerId = advice.customerId || advice.consigneeId;

        if (!resolvedCustomerId) return EMPTY;

        customerIdControl?.setValue(resolvedCustomerId, { emitEvent: false });
        this.customerIdValue.set(resolvedCustomerId);

        if (advice.customerName) {
          this.customerName.set(advice.customerName);
        } else {
          const opt = this.customerIdOptions().find((o) => o.value === resolvedCustomerId);
          this.customerName.set(opt?.label.includes(' - ')
            ? opt.label.split(' - ').slice(1).join(' - ')
            : (opt?.label ?? '-'));
        }

        this.byOptions.set([]);
        byControl?.reset(null, { emitEvent: false });
        byControl?.disable({ emitEvent: false });

        return this.apiService.getContacts(resolvedCustomerId).pipe(
          map((contacts) => ({ advice, contacts, byControl })),
        );
      }),
    ).subscribe(({ advice, contacts, byControl }) => {
      this.byOptions.set(contacts);
      byControl?.enable({ emitEvent: false });

      if (advice.returnedBy) {
        const match = contacts.find((c) => c.value === advice.returnedBy);
        if (match) {
          byControl?.setValue(match.value, { emitEvent: false });
          this.byValue.set(match.value);
        }
      }

      this.hasSearched.set(true);
      this.retrieve();
      this.cdr.markForCheck();
    });
  }

  onCustomerIdChange(event: MatSelectChange): void {
    const byControl = this.filterForm.get('by');
    if (event.value) {
      const opt = this.customerIdOptions().find((o) => o.value === event.value);
      if (opt && opt.label.includes(' - ')) {
        this.customerName.set(opt.label.split(' - ').slice(1).join(' - '));
      } else {
        this.customerName.set(opt ? opt.label : '-');
      }

      this.byOptions.set([]);
      byControl?.reset();
      byControl?.disable({ emitEvent: false });

      this.apiService.getContacts(event.value).pipe(takeUntil(this.destroy$)).subscribe((options) => {
        this.byOptions.set(options);
        byControl?.enable({ emitEvent: false });
        this.cdr.markForCheck();
      });
    } else {
      this.customerName.set('-');
      this.byOptions.set([]);
      byControl?.reset();
      byControl?.disable({ emitEvent: false });
    }
  }

  onByChange(event: MatSelectChange): void {
    this.byValue.set(event.value ?? null);
  }

  onRetrieveClick(): void {
    this.hasSearched.set(true);
    this.retrieve();
  }

  retrieve(focusUnitId = false): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.unitIdValidated.set(false);
    this.tableDataSource = [];

    // Clear detail card fields so stale data from a previous Return ID does not persist
    this.detailForm.reset();
    this.unitIdField?.clear();
    this.scanResult.set(null);
    this.evaluateResult.set(null);
    this.productCodeOptions.set([]);
    this.aboRhOptions.set([]);
    this.productCodeValue.set(null);
    this.aboRhValue.set(null);
    this.returnCodeValue.set(null);
    this.productCodeSearchControl.setValue('');
    this.aboRhSearchControl.setValue('');
    this.returnCodeSearchControl.setValue('');
    this.returnReason.set('-');
    this.expirationDateDisplay.set('');
    this.aliquotDisplay.set('-');
    this.orderDateDisplay.set('-');
    this.isManualExpiry.set(false);

    this.cdr.markForCheck();

    const returnId = this.filterForm.get('returnId')?.value ?? undefined;
    this.lastQueryDto = {
      returnAdviceId: returnId,
      customerId: returnId ? undefined : (this.filterForm.get('customerId')?.value ?? undefined),
      sortColumn: this.currentSortColumn,
      sortOrder: this.currentSortOrder,
    };
    if (returnId) {
      this.isTableLoading = true;
      this.cdr.markForCheck();
      this.apiService
        .getAll(this.lastQueryDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isTableLoading = false;
            this.tableDataSource = response.data || [];
            this.cdr.markForCheck();
            if (focusUnitId) {
              setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus());
            }
          },
          error: () => {
            this.isTableLoading = false;
            this.tableDataSource = [];
            this.cdr.markForCheck();
          },
        });
    } else {
      this.tableDataSource = [];
      this.cdr.markForCheck();
      if (focusUnitId) {
        setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus());
      }
    }
  }

  clearAll(): void {
    this.hasSearched.set(false);
    this.filterForm.reset();
    this.customerName.set('-');
    this.error.set(null);
    this.formDirty.set(false);
    this.returnIdValue.set(null);
    this.customerIdValue.set(null);
    this.byValue.set(null);
    this.byOptions.set([]);
    this.filterForm.get('by')?.disable({ emitEvent: false });
    this.returnIdSearchControl.setValue('');
    this.customerIdSearchControl.setValue('');
    this.bySearchControl.setValue('');
    this.isReturnIdTruncated = false;
    this.isCustomerIdTruncated = false;
    this.isByTruncated = false;
    this.detailForm.reset();
    this.unitIdField?.clear();
    this.returnReason.set('-');
    this.expirationDateDisplay.set('');
    this.aliquotDisplay.set('-');
    this.orderDateDisplay.set('-');
    this.isManualExpiry.set(false);
    this.scanResult.set(null);
    this.evaluateResult.set(null);
    this.unitValidationData.set(null);
    this.productCodeValue.set(null);
    this.aboRhValue.set(null);
    this.returnCodeValue.set(null);
    this.productCodeSearchControl.setValue('');
    this.aboRhSearchControl.setValue('');
    this.returnCodeSearchControl.setValue('');
    this.isProductCodeTruncated = false;
    this.isAboRhTruncated = false;
    this.isReturnCodeTruncated = false;
    this.unitIdValidated.set(false);
    this.tableDataSource = [];
    this.cdr.markForCheck();
  }

  protected checkReturnIdTruncation(el: HTMLElement): void {
    this.isReturnIdTruncated = el.scrollWidth > el.clientWidth;
  }

  protected checkCustomerIdTruncation(el: HTMLElement): void {
    this.isCustomerIdTruncated = el.scrollWidth > el.clientWidth;
  }

  protected checkByTruncation(el: HTMLElement): void {
    this.isByTruncated = el.scrollWidth > el.clientWidth;
  }

  protected checkProductCodeTruncation(el: HTMLElement): void {
    this.isProductCodeTruncated = el.scrollWidth > el.clientWidth;
  }

  protected checkAboRhTruncation(el: HTMLElement): void {
    this.isAboRhTruncated = el.scrollWidth > el.clientWidth;
  }

  protected checkReturnCodeTruncation(el: HTMLElement): void {
    this.isReturnCodeTruncated = el.scrollWidth > el.clientWidth;
  }

  protected onDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.isReturnIdTruncated = false;
      this.isCustomerIdTruncated = false;
      this.isByTruncated = false;
      this.isProductCodeTruncated = false;
      this.isAboRhTruncated = false;
      this.isReturnCodeTruncated = false;
    }
  }

  onUnitValidated(data: UnitValidationResponse): void {
    const returnAdviceId = this.filterForm.get('returnId')?.value;
    this.proceedWithScan(data, returnAdviceId ?? undefined);
  }

  private proceedWithScan(data: UnitValidationResponse, returnAdviceId: string | undefined): void {
    this.unitValidationData.set(data);
    this.scanResult.set(null);
    this.evaluateResult.set(null);
    this.productCodeOptions.set([]);
    this.aboRhOptions.set([]);
    this.expirationDateDisplay.set('');

    this.apiService.getProductCodes(data.parsedUnitId, data.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.productCodeOptions.set(options);
        const scan = this.scanResult();
        if (scan?.productCode) {
          this.detailForm.patchValue({ productCode: scan.productCode }, { emitEvent: false });
          this.productCodeValue.set(scan.productCode);
        }
        this.cdr.markForCheck();
      });

    this.isScanning.set(true);

    this.apiService
      .scanProduct({ scannedUnitId: data.parsedUnitId, returnAdviceId, customerId: this.filterForm.get('customerId')?.value ?? undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isScanning.set(false);
          if (response.success && response.data?.length > 0) {
            const scan = response.data[0];

            if (scan.customerMismatch) {
              this.openCustomerMismatchDialog(scan);
            } else {
              this.applyScanResult(scan);
            }
          } else {
            this.showError(response.message);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isScanning.set(false);
          const errResp = err?.error?.errorResponse;
          const msg = (errResp?.errorCode && errResp?.error)
            ? `Error ${errResp.errorCode}: ${errResp.error}`
            : err?.error?.errors?.[0] ?? err?.error?.message;
          this.showError(msg);
          this.cdr.markForCheck();
        },
      });

    if (returnAdviceId) {
      this.apiService
        .getByReturnAdviceId(returnAdviceId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.tableDataSource = response.data || [];
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.tableDataSource = [];
            const msg = err?.error?.errors?.[0] ?? err?.error?.message;
            this.showError(msg);
            this.cdr.markForCheck();
          },
        });
    }
  }

  private openCustomerMismatchDialog(scan: ScanProductResult): void {
    const dialogRef = this.dialog.open(CustomerMismatchDialogComponent, {
      disableClose: true,
      width: '508px',
      autoFocus: false,
      data: {
        returnedFromId: scan.returnAdviceCustomerId || '',
        returnedFromName: scan.returnAdviceCustomerName || '',
        shippedToId: scan.customerId || '',
        shippedToName: scan.customerName || '',
      } as CustomerMismatchDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result?.proceed) {
          this.applyScanResult(scan);
        } else {
          this.resetDetailEntry();
        }
      });
  }

  private applyScanResult(scan: ScanProductResult): void {
    this.unitIdValidated.set(true);
    this.scanResult.set(scan);
    this.aliquotDisplay.set(scan.aliquot || '-');
    this.orderDateDisplay.set(scan.orderDate ? this.formatDate(scan.orderDate) : '-');
    this.expirationDateDisplay.set(scan.expDate ? this.formatDate(scan.expDate) : '');

    if (scan.expDate) {
      this.isManualExpiry.set(false);
      this.detailForm.patchValue({ expDate: scan.expDate }, { emitEvent: false });
    } else {
      this.isManualExpiry.set(true);
      this.detailForm.patchValue({ expDate: null }, { emitEvent: false });
    }

    // Product codes are loaded in onUnitValidated in parallel with this scan.
    // Pre-select product code if options are already loaded; otherwise the
    // getProductCodes callback will check scanResult() and pre-select when it completes.
    if (scan.productCode && this.productCodeOptions().length > 0) {
      this.detailForm.patchValue({ productCode: scan.productCode }, { emitEvent: false });
      this.productCodeValue.set(scan.productCode);
    }

    if (scan.productCode) {
      this.apiService.getAboRhOptions(scan.unitId, scan.productCode, scan.aliquot, scan.codeScheme, scan.collDate, scan.shipmentNo)
        .pipe(takeUntil(this.destroy$))
        .subscribe((options) => {
          this.aboRhOptions.set(options);
          if (scan.bloodType) {
            this.detailForm.patchValue({ aboRh: scan.bloodType }, { emitEvent: false });
            this.aboRhValue.set(scan.bloodType);
          }
          this.cdr.markForCheck();
        });
    }
  }

  onProductCodeSelected(value: string): void {
    if (!value) return;

    // Use scan result when available; fall back to unit validation data if scan is still in-flight.
    const scan = this.scanResult();
    const unitData = this.unitValidationData();
    const unitId = scan?.unitId ?? unitData?.parsedUnitId;
    const codeScheme = scan?.codeScheme ?? unitData?.codeScheme;
    if (!unitId) return;

    this.aboRhOptions.set([]);
    this.detailForm.patchValue({ aboRh: null }, { emitEvent: false });
    this.aboRhValue.set(null);
    this.evaluateResult.set(null);

    this.apiService
      .getAboRhOptions(unitId, value, scan?.aliquot, codeScheme, scan?.collDate, scan?.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.aboRhOptions.set(options);
        if (options.length === 1) {
          this.detailForm.patchValue({ aboRh: options[0].value }, { emitEvent: false });
          this.aboRhValue.set(options[0].value);
        }
        this.cdr.markForCheck();
      });
  }

  onUnitCleared(): void {
    this.unitIdValidated.set(false);
    this.unitValidationData.set(null);
    this.scanResult.set(null);
    this.evaluateResult.set(null);
    this.productCodeOptions.set([]);
    this.aboRhOptions.set([]);
    this.detailForm.reset();
    this.productCodeValue.set(null);
    this.aboRhValue.set(null);
    this.returnCodeValue.set(null);
    this.returnReason.set('-');
    this.expirationDateDisplay.set('');
    this.aliquotDisplay.set('-');
    this.orderDateDisplay.set('-');
    this.isManualExpiry.set(false);
    this.cdr.markForCheck();
  }

  private resetDetailEntry(): void {
    this.unitIdValidated.set(false);
    this.unitValidationData.set(null);
    this.scanResult.set(null);
    this.evaluateResult.set(null);
    this.productCodeOptions.set([]);
    this.aboRhOptions.set([]);
    this.detailForm.reset();
    this.productCodeValue.set(null);
    this.aboRhValue.set(null);
    this.returnCodeValue.set(null);
    this.returnReason.set('-');
    this.expirationDateDisplay.set('');
    this.aliquotDisplay.set('-');
    this.orderDateDisplay.set('-');
    this.isManualExpiry.set(false);
    this.unitIdField?.clear();
    this.cdr.markForCheck();
    setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus());
  }

  onTableSortChange(event: TableSortEvent): void {
    const direction = event.direction === 'A' ? 'A' : event.direction === 'D' ? 'D' : 'default';
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction },
    };
    this.currentSortColumn = event.column;
    this.currentSortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    this.lastQueryDto = { ...this.lastQueryDto, sortColumn: this.currentSortColumn, sortOrder: this.currentSortOrder };
    this.retrieve();
  }

  private onReturnCodeChange(returnCode: string | null): void {
    if (returnCode) {
      const opt = this.returnCodeOptions().find((o) => o.value === returnCode);
      if (opt && opt.label.includes(' - ')) {
        this.returnReason.set(opt.label.split(' - ').slice(1).join(' - '));
      } else {
        this.returnReason.set(opt ? opt.label : '-');
      }

      const scan = this.scanResult();
      if (scan) {
        const returnAdviceId = this.filterForm.get('returnId')?.value;
        const selectedProductCode = this.detailForm.get('productCode')?.value || scan.productCode;
        const selectedBloodType = this.detailForm.get('aboRh')?.value || scan.bloodType;
        this.evaluateResult.set(null);
        this.apiService
          .evaluateReturn({
            unitId: scan.unitId,
            returnAdviceId: returnAdviceId ?? undefined,
            returnReasonCode: returnCode,
            productCode: selectedProductCode,
            aliquot: scan.aliquot,
            collDate: scan.collDate,
            expDate: scan.expDate,
            bloodType: selectedBloodType,
            customerId: scan.customerId,
            customerType: scan.customerType,
            inventoryClass: scan.inventoryClass,
            returnedFromCustomerId: scan.returnAdviceCustomerId,
            returnedFromCustomerType: scan.returnAdviceCustomerType,
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success && response.data?.length > 0) {
                const evaluation = response.data[0];
                this.evaluateResult.set(evaluation);
                this.showEvaluateSnackbar(evaluation);
                this.addReturnItem();
              }
              this.cdr.markForCheck();
            },
            error: (err) => {
              this.showError(err?.error?.message);
              this.cdr.markForCheck();
            },
          });
      }
    } else {
      this.returnReason.set('-');
      this.evaluateResult.set(null);
    }
  }

  addReturnItem(): void {
    const scan = this.scanResult();
    const evalResult = this.evaluateResult();
    const returnCode = this.detailForm.get('returnCode')?.value;

    if (!scan || !evalResult || !returnCode) return;

    const dialogRef = this.dialog.open(VisualCheckDialogComponent, {
      disableClose: true,
      width: '420px',
      autoFocus: false,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result?.checked) {
          this.commitReturnItem(scan, evalResult, returnCode);
        } else {
          this.showInfo('Return cancelled — unit was not visually checked');
        }
      });
  }

  private commitReturnItem(scan: ScanProductResult, evalResult: EvaluateReturnResult, returnCode: string): void {
    const returnAdviceId = this.filterForm.get('returnId')?.value;
    const customerId = this.filterForm.get('customerId')?.value;
    const selectedProductCode = this.detailForm.get('productCode')?.value || scan.productCode;
    const selectedBloodType = this.detailForm.get('aboRh')?.value || scan.bloodType;
    const expDateOverride = this.detailForm.get('expDate')?.value;

    this.loading.set(true);
    this.apiService
      .commitReturn({
        unitId: scan.unitId,
        returnAdviceId: returnAdviceId || undefined,
        productCode: selectedProductCode,
        aliquot: scan.aliquot,
        collDate: scan.collDate,
        expDate: expDateOverride || scan.expDate,
        bloodType: selectedBloodType,
        customerId: customerId || scan.customerId,
        checkDigit: scan.checkDigit,
        codeScheme: scan.codeScheme,
        returnReasonCode: returnCode,
        creditDecision: evalResult.creditDecision,
        routingDecision: evalResult.routingDecision,
        locationId: evalResult.locationId,
        moveDate: evalResult.moveDate,
        visuallyChecked: true,
        shipmentNo: scan.shipmentNo,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.showSuccess(response.message);

            // If BE auto-created a new Return Advice, populate the dropdown
            const newAdviceId = response.returnAdviceId;
            const effectiveId = newAdviceId || returnAdviceId;
            if (newAdviceId && !returnAdviceId) {
              this.returnIdOptions.update((opts) => [...opts, { value: newAdviceId, label: newAdviceId }]);
              this.cdr.detectChanges();
              this.filterForm.get('returnId')?.setValue(newAdviceId, { emitEvent: false });
              this.returnIdValue.set(newAdviceId);
            }

            this.scanResult.set(null);
            this.evaluateResult.set(null);
            this.productCodeOptions.set([]);
            this.aboRhOptions.set([]);
            this.detailForm.reset();
            this.productCodeValue.set(null);
            this.aboRhValue.set(null);
            this.returnCodeValue.set(null);
            this.returnReason.set('-');
            this.expirationDateDisplay.set('');
            this.aliquotDisplay.set('-');
            this.isManualExpiry.set(false);
            this.unitIdValidated.set(false);
            this.unitIdField?.clear();
            setTimeout(() => {
              this.unitIdField?.unitIdInput?.nativeElement?.focus();
              this.detailForm.markAsUntouched();
              this.detailForm.markAsPristine();
              this.cdr.markForCheck();
            });

            if (effectiveId) {
              this.apiService
                .getByReturnAdviceId(effectiveId)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (res) => {
                    this.tableDataSource = res.data || [];
                    this.cdr.markForCheck();
                  },
                  error: () => {
                    this.cdr.markForCheck();
                  },
                });
            }
          } else {
            this.showError(response.message);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(err?.error?.message);
          this.cdr.markForCheck();
        },
      });
  }

  onPrint(): void {
    const returnAdviceId = this.filterForm.get('returnId')?.value;
    if (!returnAdviceId) return;

    this.apiService.getPrinters()
      .pipe(takeUntil(this.destroy$))
      .subscribe((printers) => {
        const dialogRef = this.dialog.open(PrintReturnSlipDialogComponent, {
          disableClose: true,
          width: '508px',
          autoFocus: false,
          data: {
            printers,
            defaultPrinterId: printers.length > 0 ? printers[0].printerId : undefined,
          } as PrintReturnSlipDialogData,
        });

        dialogRef.afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((result) => {
            if (result?.closeAndPrint && result?.printerId) {
              this.loading.set(true);
              this.apiService.closeReturnAdvice(returnAdviceId, {
                printerId: result.printerId,
                printPickSlip: true,
              })
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response) => {
                  this.loading.set(false);
                  if (response.success) {
                    this.showSuccess(response.message);
                    this.loadDropdowns();
                    this.clearAll();
                  } else {
                    this.showError(response.message);
                  }
                  this.cdr.markForCheck();
                },
                error: (err) => {
                  this.loading.set(false);
                  this.showError(err?.error?.message);
                  this.cdr.markForCheck();
                },
              });
            }
          });
      });
  }

  protected routingLabel(routing: string): string {
    const map: Record<string, string> = { QU: 'Quarantine', RE: 'Return to Inventory', DI: 'Discard' };
    return map[routing] ?? routing;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : dateString;
  }

  private showEvaluateSnackbar(evaluation: EvaluateReturnResult): void {
    const parts: string[] = [];

    if (evaluation.isExpired) parts.push('Unit is expired');
    if (evaluation.isBiohazard) parts.push('Biohazard unit — handle with care');
    evaluation.warnings.forEach((w) => parts.push(w));

    const creditLabel = evaluation.creditDecision === 'CR' ? 'Credit' : 'No Credit';
    parts.push(`Credit: ${creditLabel}`);
    parts.push(`Routing: ${this.routingLabel(evaluation.routingDecision)}`);
    parts.push(`Location: ${evaluation.locationId}`);
    if (evaluation.moveDate) parts.push(`Move Date: ${this.formatDate(evaluation.moveDate)}`);

    const message = parts.join(' | ');
    const hasAlert = evaluation.isExpired || evaluation.isBiohazard || evaluation.warnings.length > 0;
    hasAlert ? this.showError(message) : this.showInfo(message);
  }

  private showSuccess(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  private showInfo(message: string): void {
    this.snackbarService.showInfo(message);
  }

  private showError(message: string): void {
    this.snackbarService.showError(message);
  }

  viewProductHistory(row: HospitalReturnItemDto): void {
    this.router.navigate(
      ['/product-management-functions/inventory-management/inventory-queries/unit-and-product-history'],
      {
        queryParams: {
          unitId: row.unitId,
          from: 'Hospital Returns',
          fromPath: '/laboratory-functions/hospital-returns',
        },
      },
    );
  }

  protected getSelectedReturnCodeOption(): ReturnCodeOption | null {
    const val = this.detailForm.get('returnCode')?.value;
    if (!val) return null;
    return this.returnCodeOptions().find((o) => o.value === val) ?? null;
  }
}
