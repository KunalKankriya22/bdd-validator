import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';

import { FreezeStartTimeService } from './freeze-start-time.service';
import {
  FreezeEntry,
  ProductLookup,
  AliquotLookup,
  ValidateUnitResponse,
  RecordFreezeRequest,
  FreezeErrorCode,
  QueryFreezeHistoryRequest,
} from './freeze-start-time.model';
import moment from 'moment';

@Component({
  selector: 'app-freeze-start-time',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
  ],
  templateUrl: './freeze-start-time.html',
  styleUrls: ['./freeze-start-time.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FreezeStartTimeComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `freeze-start-time-${FreezeStartTimeComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly freezeService = inject(FreezeStartTimeService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly pageHeaderService = inject(PageHeaderService);

  // Use signal for reactive header config
  readonly headerConfig = signal<PageHeaderConfig>({
    breadcrumbs: [{ label: 'Home', link: '/home' }],
  });

  constructor() {
    // Update breadcrumbs reactively when menu data loads
    effect(() => {
      const data = this.pageHeaderService.pageHeaderData();
      if (data) {
        this.headerConfig.set({
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: data.title, link: null },
          ],
          // Don't set title/subtitle - let PageHeaderWithBreadcrumb component
          // get them from pageHeaderService automatically
        });
      }
    });
  }

  // Signals
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly freezeEntries = signal<FreezeEntry[]>([]);
  readonly validatedUnitId = signal<string>('');
  readonly collectionDate = signal<string | null>(null);
  readonly products = signal<ProductLookup[]>([]);
  readonly isHistoryMode = signal<boolean>(false);
  readonly isLoadingHistory = signal<boolean>(false);
  readonly selectedProduct = signal<ProductLookup | null>(null);
  readonly duplicateError = signal<boolean>(false);
  readonly unitValidationData = signal<ValidateUnitResponse | null>(null);
  // GAP FIX: Add aliquot support instead of hardcoding '00'
  readonly aliquots = signal<AliquotLookup[]>([]);
  readonly selectedAliquot = signal<string | null>(null);
  readonly showAliquotDropdown = signal<boolean>(false);
  readonly isLoadingAliquots = signal<boolean>(false);
  readonly sortDirection = signal<'A' | 'D' | 'default'>('default');
  readonly statusMessage = signal<string>('');  // For screen reader announcements

  // Computed: Product Code error ID (only when error exists)
  readonly productCodeErrorId = computed(() => {
    if (this.duplicateError()) {
      return this.errorId('productCode-duplicate');
    }
    if (this.f['productCode']?.invalid && this.f['productCode']?.touched) {
      return this.errorId('productCode');
    }
    return undefined;
  });

  // Tooltip truncation tracking
  isProductTruncated = false;

  readonly hasResults = computed(() => this.freezeEntries().length > 0);

  // Computed display value for selected product (code + description)
  readonly selectedProductDisplay = computed(() => {
    const product = this.selectedProduct();
    if (!product) return '';
    return product.productDesc ? `${product.productCode} - ${product.productDesc}` : product.productCode;
  });

  // Computed sorted entries based on sort direction
  readonly sortedEntries = computed(() => {
    const entries = [...this.freezeEntries()];
    const direction = this.sortDirection();

    if (direction === 'default') {
      return entries; // Original order (newest first)
    }

    return entries.sort((a, b) => {
      const comparison = a.unitId.localeCompare(b.unitId);
      return direction === 'A' ? comparison : -comparison;
    });
  });

  readonly paginatedEntries = computed(() => {
    const entries = this.sortedEntries();
    const page = this.tableConfig.pagination;
    if (!page) return entries;
    const start = page.pageIndex * page.pageSize;
    return entries.slice(start, start + page.pageSize);
  });

  // Computed: Dynamic Unit ID header with count
  readonly unitIdHeader = computed(() => {
    const count = this.freezeEntries().length;
    return count > 0 ? `Unit ID (${count})` : 'Unit ID';
  });

  // Table configuration
  tableConfig: DataTableConfig<FreezeEntry> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        minWidth: '150px',
        sortable: true,
        valueFormatter: (value: any) => this.formatUnitId(value),
      },
      {
        key: 'collDate',
        header: 'Collection Date',
        width: '200px',
      },
      {
        key: 'productCode',
        header: 'Product Code',
        width: '200px',
      },
      {
        key: 'productDesc',
        header: 'Product Description',
        minWidth: '200px',
      },
      {
        key: 'freezeStart',
        header: 'Freeze Start',
        minWidth: '180px',
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
      column: 'unitId',
      direction: 'default',
    },
    showPagination: true,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin.',
    noDataIcon: 'search',
    enableRowHighlight: false,
  };

  // Computed: Show pagination when there are entries
  readonly showPaginationComputed = computed(() => {
    return this.freezeEntries().length > 0;
  });

  // Computed: Table status announcement for screen readers
  readonly tableAnnouncementMessage = computed(() => {
    const count = this.paginatedEntries().length;
    const total = this.freezeEntries().length;
    const page = (this.tableConfig.pagination?.pageIndex ?? 0) + 1;
    return count > 0
      ? `Showing ${count} of ${total} entries on page ${page}`
      : '';
  });

  freezeForm!: FormGroup;

  private readonly destroy$ = new Subject<void>();
  private savedCount = 0;

  ngOnInit(): void {
    this.initFreezeForm();
    this.subscribeToChapterChanges();
    this.subscribeToUnitIdChanges();
    // Initialize table config with current header
    this.updateTableConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFreezeForm(): void {
    this.freezeForm = this.fb.group({
      productCode: ['', [Validators.required]],
      aliquot: [''],  // Optional initially, validation happens in template conditionally
    });

    // Watch for product code changes
    this.freezeForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((productCode) => {
        if (productCode) {
          this.onProductCodeChange(productCode);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
      });
  }

  /**
   * Subscribe to Unit ID field changes to detect when it becomes empty
   * This handles manual deletion in addition to the (cleared) event
   */
  private subscribeToUnitIdChanges(): void {
    // Use afterViewInit to ensure the ViewChild is available
    setTimeout(() => {
      if (this.unitIdField) {
        this.unitIdField.unitIdControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((value) => {
            // If Unit ID becomes empty and we have validation data, clear all fields
            if (!value && this.unitValidationData()) {
              this.onUnitIdCleared();
            }
          });
      }
    });
  }

  /**
   * Step 1: Format validation passed (donor-lib)
   * Now run freeze-specific validation (FROZP eligibility, collection date)
   */
  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    this.duplicateError.set(false);
    this.isLoading.set(true);
    this.cdr.markForCheck();

    // Use manualUnitId (includes check digit) for duplicate check and storage
    const unitIdWithCheckDigit = event.data.manualUnitId;

    // Check if Unit ID already exists in the table
    const isDuplicateInTable = this.freezeEntries().some(
      entry => entry.unitId === unitIdWithCheckDigit
    );

    if (isDuplicateInTable) {
      this.isLoading.set(false);
      this.duplicateError.set(true);
      this.cdr.markForCheck();
      event.reject('This Unit ID has already scanned');
      return;
    }

    const chapterId = this.headerService.getCurrentChapterId() || '';

    // Call freeze-start-time validation endpoint using parsedUnitId (without check digit)
    this.freezeService
      .validateUnit({
        unitId: event.data.parsedUnitId,
        chapterId,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Freeze validation passed
          this.unitValidationData.set(response);
          // Store the full Unit ID with check digit
          this.validatedUnitId.set(unitIdWithCheckDigit);
          this.collectionDate.set(response.collDate);
          this.isLoading.set(false);
          this.cdr.markForCheck();

          // Load products immediately after validation
          this.loadProducts(response);

          // Confirm validation to unit-id-field
          event.confirm();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.cdr.markForCheck();

          // Reject validation - error message from global error handler
          event.reject(error.error?.message || 'Validation failed');
        },
      });
  }

  /**
   * Step 2: Both validations passed (format + freeze-specific)
   * This fires AFTER event.confirm() is called in onUnitPostValidate
   */
  onUnitValidated(data: UnitValidationResponse): void {
    // Field is now fully validated and marked valid
    console.log('Unit validation complete:', data.parsedUnitId);

    // Format the Unit ID display in the input field
    setTimeout(() => {
      if (this.unitIdField && data.manualUnitId) {
        const formattedUnitId = this.formatUnitId(data.manualUnitId);
        this.unitIdField.unitIdControl.setValue(formattedUnitId, { emitEvent: false });
      }
    }, 100);
  }

  /**
   * Handle Unit ID field cleared event
   * Automatically clear Collection Date and related fields
   */
  onUnitIdCleared(): void {
    this.validatedUnitId.set('');
    this.collectionDate.set(null);
    this.products.set([]);
    this.selectedProduct.set(null);
    this.unitValidationData.set(null);
    this.duplicateError.set(false);
    this.aliquots.set([]);
    this.selectedAliquot.set(null);
    this.showAliquotDropdown.set(false);
    this.isLoadingAliquots.set(false);
    this.isProductTruncated = false;
    this.freezeForm.reset();
    this.cdr.markForCheck();
  }

  /**
   * Check if product dropdown text is truncated
   */
  checkProductTruncation(el: HTMLElement): void {
    this.isProductTruncated = el.scrollWidth > el.clientWidth;
  }

  /**
   * Load eligible FROZP products for the validated unit
   */
  private loadProducts(validationData: ValidateUnitResponse): void {
    // GAP FIX: Use code scheme from validation response instead of hardcoding
    const codeScheme = validationData.codeScheme || 'I';

    this.freezeService
      .lookupProducts({
        unitId: validationData.unitId,
        collDate: validationData.collDate,
        chapterId: validationData.chapterId,
        codeScheme,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products.set(products);

          // Show snackbar if no eligible products found
          if (!products || products.length === 0) {
            this.snackbarService.showError('No eligible products found');
          }

          this.cdr.markForCheck();
        },
        error: () => {
          // Global error handler manages error display
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Handle product code selection change
   * GAP FIX: Check for duplicate freeze entry before loading aliquots
   */
  private onProductCodeChange(productCode: string): void {
    const product = this.products().find((p) => p.productCode === productCode);
    if (!product) return;

    this.selectedProduct.set(product);

    // Check for duplicate freeze entry (Oracle Forms PRODUCT_CODE.VALIDATE_FIELD behavior)
    const unitData = this.unitValidationData();
    if (!unitData) return;

    const chapterId = this.headerService.getCurrentChapterId() || '';

    this.freezeService
      .checkDuplicate({
        unitId: unitData.unitId,
        collDate: unitData.collDate,
        productCode: product.productCode,
        chapterId,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.isDuplicate) {
            // Error 0375 - already scanned (global error handler will show snackbar)
            this.duplicateError.set(true);
            this.freezeForm.patchValue({ productCode: '' });
            this.selectedProduct.set(null);
            this.cdr.markForCheck();
          } else {
            // No duplicate - proceed to load aliquots
            this.duplicateError.set(false);
            this.loadAliquots(product);
          }
        },
        error: () => {
          // Global error handler will show error
          // Still proceed to load aliquots
          this.loadAliquots(product);
        },
      });
  }

  /**
   * GAP FIX: Load available aliquots for the selected product
   * If single aliquot, auto-select and record. If multiple, show dropdown.
   */
  private loadAliquots(product: ProductLookup): void {
    const unitData = this.unitValidationData();
    if (!unitData) return;

    this.isLoadingAliquots.set(true);
    this.showAliquotDropdown.set(false);
    this.cdr.markForCheck();

    this.freezeService
      .lookupAliquots({
        unitId: unitData.unitId,
        collDate: unitData.collDate,
        productCode: product.productCode,
        chapterId: unitData.chapterId,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (aliquots) => {
          this.aliquots.set(aliquots);
          this.isLoadingAliquots.set(false);

          if (aliquots.length === 0) {
            // No aliquots available - show error
            this.snackbarService.showError('No available aliquots for this product');
            this.cdr.markForCheck();
          } else if (aliquots.length === 1) {
            // Single aliquot - auto-select and record
            this.selectedAliquot.set(aliquots[0].componentPrefix);
            this.recordFreezeEntry();
          } else {
            // Multiple aliquots - show dropdown for user selection
            this.showAliquotDropdown.set(true);
            this.cdr.markForCheck();
          }
        },
        error: () => {
          // Global error handler manages error display
          this.isLoadingAliquots.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * GAP FIX: Handle aliquot selection from dropdown
   */
  onAliquotChange(aliquot: string): void {
    this.selectedAliquot.set(aliquot);
    this.recordFreezeEntry();
  }

  /**
   * Record freeze entry
   * GAP FIX: Use selected aliquot instead of hardcoded '00'
   */
  private recordFreezeEntry(): void {
    const unitData = this.unitValidationData();
    const product = this.selectedProduct();
    const aliquot = this.selectedAliquot();

    // GAP FIX: Require aliquot to be selected
    if (!unitData || !product || !aliquot) {
      return;
    }

    this.isSaving.set(true);
    this.duplicateError.set(false);
    this.showAliquotDropdown.set(false); // Hide dropdown while saving
    this.cdr.markForCheck();

    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
    const freezeStartDateTime = chapterNow.format('MM-DD-YYYY HH:mm');
    const request: RecordFreezeRequest = {
      unitId: unitData.unitId,
      collDate: unitData.collDate,
      productCode: product.productCode,
      aliquot: aliquot,
      chapterId: this.headerService.getCurrentChapterId() || '',
      freezeStartDateTime: freezeStartDateTime,
      insertUser: this.loginService.getStoredUsername() || '',
      programId: 'CPIFRZA',
    };

    this.freezeService
      .recordFreeze(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const newEntry: FreezeEntry = {
            unitId: this.validatedUnitId(),
            collDate: this.formatDate(response.collDate),
            productCode: response.productCode,
            productDesc: product.productDesc,
            freezeStart: chapterNow.format('DD-MMM-YYYY HH:mm').toUpperCase(),
          };

          this.freezeEntries.update((entries) => [newEntry, ...entries]);
          this.savedCount++;
          this.isHistoryMode.set(false); // Switch to data entry mode

          // Set initial sort to ascending after first record is added
          if (this.freezeEntries().length === 1) {
            this.sortDirection.set('A');
            this.tableConfig.sortConfig = {
              column: 'unitId',
              direction: 'A',
            };
          }

          this.updateTableConfig();

          // Show success snackbar with entry count
          const entryCount = this.freezeEntries().length;
          const message = `${entryCount} ${entryCount === 1 ? 'Entry' : 'Entries'} saved`;
          this.statusMessage.set(message);  // Announce to screen readers
          this.snackbarService.showSuccess(message);

          // GAP FIX: Check for CMTI interdiction and show warning dialog
          if (response.cmtiGenerated && response.warningMessage && response.errorCode) {
            // Show CMTI warning dialog with error code 9789
            this.showCmtiWarningDialog(response.warningMessage, response.errorCode);
          }

          // Clear form for next entry
          this.clearFormFields();
          this.isSaving.set(false);
          this.cdr.markForCheck();

          // Focus back on unit ID field (handled by dialog if CMTI warning shown)
          if (!response.cmtiGenerated) {
            setTimeout(() => {
              this.unitIdField?.focus();
            }, 100);
          }
        },
        error: (error) => {
          this.handleRecordError(error);
          this.isSaving.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Handle validation errors
   * Global error handler manages error display
   */
  private handleValidationError(error: any): void {
    // Global error interceptor handles error display
    const errorCode = error.error?.errorCode;

    if (errorCode === FreezeErrorCode.UNIT_NOT_FOUND) {
      this.unitIdField?.setError('Unit not found');
    }
  }

  /**
   * Handle record errors
   * Global error handler manages error display
   */
  private handleRecordError(error: any): void {
    // Global error interceptor handles error display
    const errorCode = error.error?.errorCode;

    if (errorCode === FreezeErrorCode.DUPLICATE_FREEZE_ENTRY) {
      this.duplicateError.set(true);
      this.unitIdField?.setError('This Unit ID has already been scanned');
    }
  }

  /**
   * Clear form fields after successful save
   */
  private clearFormFields(): void {
    // Clear all signals first
    this.validatedUnitId.set('');
    this.collectionDate.set(null);
    this.products.set([]);
    this.selectedProduct.set(null);
    this.unitValidationData.set(null);
    this.duplicateError.set(false);
    this.aliquots.set([]);
    this.selectedAliquot.set(null);
    this.showAliquotDropdown.set(false);
    this.isLoadingAliquots.set(false);

    // Reset form completely - this clears values and validation state
    this.freezeForm.reset({
      productCode: '',
      aliquot: ''
    }, { emitEvent: false });

    // Explicitly mark all controls as pristine and untouched
    Object.keys(this.freezeForm.controls).forEach(key => {
      const control = this.freezeForm.get(key);
      if (control) {
        control.markAsPristine();
        control.markAsUntouched();
        control.updateValueAndValidity({ emitEvent: false });
      }
    });

    // Clear the Unit ID field (which handles its own validation state)
    this.unitIdField?.clear();
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.clearFormFields();
    this.freezeEntries.set([]);
    this.savedCount = 0;
    this.isHistoryMode.set(false);
    this.sortDirection.set('default');
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.direction = 'default';
    }
    this.updateTableConfig();
  }

  /**
   * Load freeze history records from database
   */
  loadHistory(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    if (!chapterId) {
      this.snackbarService.showError('Chapter ID is required');
      return;
    }

    this.isLoadingHistory.set(true);
    this.isHistoryMode.set(true);
    this.cdr.markForCheck();

    const request: QueryFreezeHistoryRequest = {
      chapterId,
      pageNumber: 1,
      pageSize: 25,
      sortColumn: 'processdats',
      sortDirection: 'D',
    };

    this.freezeService
      .queryHistory(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Convert history records to FreezeEntry format
          // GAP FIX: Convert processDats from GMT to chapter timezone for display
          const entries: FreezeEntry[] = response.records.map((record) => ({
            unitId: record.unitId,
            collDate: this.formatDate(record.collDate),
            productCode: record.productCode,
            productDesc: record.productDesc,
            freezeStart: this.chapterTimezoneService
              .convertGmtToLocal(moment(record.processDats))
              .format('DD-MMM-YYYY HH:mm')
              .toUpperCase(),
          }));

          this.freezeEntries.set(entries);

          // Update table config with total records
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
            this.tableConfig.pagination.pageIndex = 0;
            this.tableConfig = { ...this.tableConfig };
          }

          this.isLoadingHistory.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          // Global error handler will show error
          this.isLoadingHistory.set(false);
          this.isHistoryMode.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Handle pagination events
   */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle sort events
   * Cycles through: default → ascending → descending → default
   */
  onSortChange(event: TableSortEvent): void {
    if (event.column === 'unitId') {
      const currentDirection = this.sortDirection();
      let newDirection: 'A' | 'D' | 'default';

      // Custom cycle: default → A → D → default
      if (currentDirection === 'default') {
        newDirection = 'A';
      } else if (currentDirection === 'A') {
        newDirection = 'D';
      } else {
        // D → default (override data-table's D → A behavior)
        newDirection = 'default';
      }

      this.sortDirection.set(newDirection);

      // Update table config
      if (this.tableConfig.sortConfig) {
        this.tableConfig.sortConfig.direction = newDirection;
        this.tableConfig = { ...this.tableConfig };
      }

      // Reset to first page when sorting changes
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }

      this.cdr.markForCheck();
    }
  }

  /**
   * Update table configuration with new data
   */
  private updateTableConfig(): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = this.freezeEntries().length;
    }
    // Update Unit ID column header with count
    const unitIdColumn = this.tableConfig.columns.find(col => col.key === 'unitId');
    if (unitIdColumn) {
      unitIdColumn.header = this.unitIdHeader();
    }
    // Show/hide pagination based on mode
    this.tableConfig.showPagination = this.showPaginationComputed();
    this.tableConfig = { ...this.tableConfig };
  }

  /**
   * Format Unit ID for display with hyphens
   * Example: W454508230031-I becomes W4545-08-230031-I
   * Example: W035208020015-6 becomes W0352-08-020015-6
   */
  formatUnitId(unitId: string): string {
    if (!unitId) return unitId;

    // Pattern: DIN format with check digit (letter or digit)
    // Examples: W454508230031-I, W035208020015-6
    // Format as: W4545-08-230031-I or W0352-08-020015-6
    const dinPattern = /^([A-Z]\d{4})(\d{2})(\d{6})(-[A-Z0-9])$/;
    const dinMatch = unitId.match(dinPattern);
    if (dinMatch) {
      return `${dinMatch[1]}-${dinMatch[2]}-${dinMatch[3]}${dinMatch[4]}`;
    }

    // Pattern: ISBT format without check digit (e.g., W035208013001)
    // Format as: W0352-08-013001
    const isbtPattern = /^([A-Z]\d{4})(\d{2})(\d{6})$/;
    const isbtMatch = unitId.match(isbtPattern);
    if (isbtMatch) {
      return `${isbtMatch[1]}-${isbtMatch[2]}-${isbtMatch[3]}`;
    }

    // If no pattern matches, return as-is
    return unitId;
  }

  /**
   * Format date to DD-MMM-YYYY
   */
  formatDate(date: string): string {
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }

  /**
   * Format date/time to DD-MMM-YYYY HH:mm
   */
  private formatDateTime(dateTime: string): string {
    const m = moment(dateTime);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : dateTime;
  }

  /**
   * Get form controls for easier access in template
   */
  get f() {
    return this.freezeForm.controls;
  }

  formatCurrentTime(): string {
    const now = this.chapterTimezoneService.getChapterLocalDateTime();
    return now.format('DD-MMM-YYYY HH:mm').toUpperCase();
  }

  /**
   * Show CMTI (Component Manufacturing Time Interdiction) warning dialog
   * Displays when time limit for freeze processing is exceeded
   */
  private showCmtiWarningDialog(warningMessage: string, errorCode: string): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      disableClose: false,
      role: 'alertdialog',  // Accessible role for warning dialogs
      data: {
        title: 'CMTI Interdiction Warning',
        message: warningMessage,
        detail: `Error Code: ${errorCode}\n\nThe freeze entry has been saved, but a CMTI (Component Manufacturing Time Interdiction) has been assigned to this component due to exceeding the time limit.`,
        confirmText: 'OK',
        cancelText: undefined, // Hide cancel button - this is informational only
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // User acknowledged the warning, no action needed
        // Focus returns to unit ID field after dialog closes
        setTimeout(() => {
          this.unitIdField?.focus();
        }, 100);
      });
  }
}
