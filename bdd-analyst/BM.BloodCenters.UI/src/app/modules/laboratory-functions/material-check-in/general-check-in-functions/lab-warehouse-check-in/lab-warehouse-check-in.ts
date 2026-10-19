import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  effect,
  signal,
  computed,
} from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { Observable, Subject, map, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DonorLibLabelScanService, LabelScanApiResponse, ProductScanResult } from '@shared/services/donor-lib-label-scan.service';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { ScanSelectFieldComponent, ScanSelectOption } from '@shared/components/scan-select-field';
import { SCAN_PATTERNS } from '@shared/utils/scan-pattern.util';
import { WarningOverrideDialogComponent, WarningOverrideDialogData, WarningOverrideDialogResult } from './dialogs/warning-override-dialog';
import { LabWarehouseCheckInApiService } from './services/lab-warehouse-check-in-api.service';
import {
  CheckinHistoryItemDto,
  ValidateCheckinUnitResponseDto,
  ValidateCheckinProductResponseDto,
  ValidateCheckinProductRequestDto,
  CheckinRequestDto,
  WarningDto,
  ProductInfoDto,
} from './models/lab-warehouse-check-in.model';

/**
 * Lab Warehouse Check-In Component
 * Auto-save flow: scan unit → validate → if has components, select product → auto-save
 * No RETRIEVE or CHECK IN buttons - saves automatically after validation
 */
@Component({
  selector: 'app-lab-warehouse-check-in',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
  ],
  templateUrl: './lab-warehouse-check-in.html',
  styleUrls: ['./lab-warehouse-check-in.scss'],
})
export class LabWarehouseCheckInComponent implements OnInit, OnDestroy {
  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField!: ScanSelectFieldComponent;
  @ViewChild('temperatureInput') temperatureInput!: ElementRef<HTMLInputElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  filterForm = new FormGroup({
    temperature: new FormControl<string | null>(null, [Validators.required]),
  });

  // Scan pattern configuration
  readonly SCAN_PATTERNS_UNIT_ID = SCAN_PATTERNS.UNIT_ID;
  readonly SCAN_PATTERNS_PRODUCT = SCAN_PATTERNS.PRODUCT;

  // State signals
  isLoading = signal(false);
  collectionDate = signal<Date | string | null>(null);
  warehouseLocation = signal<string>('');
  currentUnitId = signal<string | null>(null);
  currentDisplayUnitId = signal<string | null>(null);

  // Unit validation state
  unitValidation = signal<ValidateCheckinUnitResponseDto | null>(null);
  productOptions = signal<ProductInfoDto[]>([]);

  // Selected product (stored when user selects/scans)
  selectedProduct = signal<ProductInfoDto | null>(null);

  // Product validation state
  productValidation = signal<ValidateCheckinProductResponseDto | null>(null);

  // Override tracking
  pendingUnitValidateEvent: UnitIdPostValidateEvent | null = null;
  unitOverrides = signal<string[]>([]);
  productOverrides = signal<string[]>([]);

  // Session check-in history (local memory — matches legacy FMB non-DB control block)
  sessionCheckins = signal<CheckinHistoryItemDto[]>([]);

  // Computed: disable product code until unit has components
  productCodeDisabled = computed(() => {
    const validation = this.unitValidation();
    return !validation?.hasComponents || this.productOptions().length === 0;
  });

  // Computed: map ProductInfoDto[] to ScanSelectOption[] for scan-select-field
  productCodeScanOptions = computed(() =>
    this.productOptions().map(p => ({ code: p.productCode, description: p.productDesc || '' }))
  );

  // parseFn: server-side barcode validation for scanned product codes
  readonly parseProductCode = (value: string): Observable<ScanSelectOption | null> => {
    return this.labelScanService.validateProductScan(value).pipe(
      map((res: LabelScanApiResponse<ProductScanResult>) => {
        if (res.success && res.item) {
          return { code: res.item.productCode!, description: res.item.productDescription ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid product code');
      }),
    );
  };

  // Table configuration
  tableConfig!: DataTableConfig<CheckinHistoryItemDto>;
  pageSize = 25;
  pageIndex = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private apiService: LabWarehouseCheckInApiService,
    private labelScanService: DonorLibLabelScanService
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
        // Removed cdr.markForCheck() - Angular's signal reactivity handles updates
      }
    });

    // Update warehouse from header service
    effect(() => {
      const warehouseId = this.headerService.warehouseId();
      const warehouseName = this.headerService.warehouseName();
      if (warehouseId && warehouseName) {
        this.warehouseLocation.set(`${warehouseId} - ${warehouseName}`);
      }
    });

  }

  ngOnInit(): void {
    this.buildTableConfig();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
    });
  }


  /**
   * PostValidate handler from unit-id-field
   * Called after shared unit validation passes
   */
  onPostValidate(event: UnitIdPostValidateEvent): void {
    // Prevent duplicate calls if already validating
    if (this.isLoading()) {
      return;
    }

    this.pendingUnitValidateEvent = event;
    this.currentUnitId.set(event.data.parsedUnitId);
    this.currentDisplayUnitId.set(event.data.manualUnitId || event.data.parsedUnitId);

    // Reset product code on every new unit scan
    this.productOptions.set([]);
    this.selectedProduct.set(null);
    this.productCodeField?.clear();

    this.isLoading.set(true);

    const request = {
      unitId: event.data.parsedUnitId,
      overrides: this.unitOverrides(),
    };

    this.apiService
      .validateUnit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.handleUnitValidationResponse(response, event);
        },
        error: (error) => {
          this.isLoading.set(false);
          const message = error?.error?.message || error?.message || 'Validation failed';
          event.reject(message);
        },
      });
  }

  /**
   * Handle unit validation response
   */
  private handleUnitValidationResponse(response: ValidateCheckinUnitResponseDto, event: UnitIdPostValidateEvent): void {
    // Check status field
    if (response.status === 'ERROR') {
      // Block - reject unit field
      const message = response.warnings?.[0]?.message || 'Unit validation failed';
      event.reject(message);
      return;
    }

    if (response.status === 'WARNING') {
      // Show warning dialog
      this.showWarningDialog('Unit Validation Warnings', response.warnings, (override, codes) => {
        if (override) {
          // Retry with overrides (use Set to avoid duplicates)
          const newOverrides = [...new Set([...this.unitOverrides(), ...codes])];
          this.unitOverrides.set(newOverrides);
          this.onPostValidate(event);
        } else {
          // User canceled
          event.reject('Validation canceled');
        }
      });
      return;
    }

    // Status === 'OK' - proceed
    event.confirm();
    this.unitValidation.set(response);
    this.collectionDate.set(response.collDate || null);

    if (response.hasComponents) {
      this.productOptions.set(response.products);
      // Auto-focus product code field for scan-driven workflow
      setTimeout(() => this.productCodeField?.focus(), 100);
    } else {
      // No components - auto-save immediately
      this.performCheckin();
    }
  }

  /**
   * Handle product code selection or scan from scan-select-field
   */
  onProductCodeChanged(option: ScanSelectOption | null): void {
    if (!option || !this.currentUnitId()) return;

    // Look up the matching ProductInfoDto from original options
    const product = this.productOptions().find(p => p.productCode === option.code);
    if (!product) {
      this.showError('Product code not found in available products for this unit.');
      return;
    }

    this.selectedProduct.set(product);

    const temperatureValue = this.filterForm.get('temperature')?.value;
    const validation = this.unitValidation();

    if (!validation) {
      this.showError('Missing validation data. Please scan unit ID again.');
      return;
    }

    if (!temperatureValue) {
      this.showError('Temperature is required. Please enter temperature.');
      return;
    }

    const temperature = parseFloat(temperatureValue);

    const request: ValidateCheckinProductRequestDto = {
      unitId: this.currentUnitId() || '',
      productCode: product.productCode,
      aliquot: product.aliquot,
      collDate: validation.collDate || new Date(),
      temperature,
      batchId: validation.batchId,
      overrides: this.productOverrides(),
    };

    this.isLoading.set(true);

    this.apiService
      .validateProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleProductValidationResponse(response, product),
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onProductCodeCleared(): void {
    this.selectedProduct.set(null);
    this.productValidation.set(null);
    this.productOverrides.set([]);
  }

  /**
   * Handle product validation response
   */
  private handleProductValidationResponse(response: ValidateCheckinProductResponseDto, product: ProductInfoDto): void {
    this.isLoading.set(false);

    if (response.status === 'WARNING') {
      this.showWarningDialog('Product Validation Warnings', response.warnings, (override, codes) => {
        if (override) {
          // Retry with overrides (use Set to avoid duplicates)
          this.productOverrides.set([...new Set([...this.productOverrides(), ...codes])]);
          this.onProductCodeChanged({ code: product.productCode, description: product.productDesc || '' });
        }
      });
      return;
    }

    // Status === 'OK' - store validation and auto-save
    this.productValidation.set(response);
    this.performCheckin();
  }

  /**
   * Perform check-in (auto-save)
   */
  private performCheckin(): void {
    const temperatureValue = this.filterForm.get('temperature')?.value;
    const validation = this.unitValidation();
    const productValidation = this.productValidation();

    if (!validation) return;

    // Get selected product from signal (stored when user selected from dropdown)
    const product = this.selectedProduct();

    // Convert temperature string to number
    const temperature = temperatureValue ? parseFloat(temperatureValue) : undefined;

    // Combine all overrides
    const allOverrides = [...this.unitOverrides(), ...this.productOverrides()];

    const request: CheckinRequestDto = {
      unitId: this.currentUnitId() || '',
      collDate: validation.collDate || new Date(),
      productCode: validation.hasComponents ? product?.productCode || undefined : undefined,
      aliquot: validation.hasComponents ? product?.aliquot || undefined : undefined,
      temperature,
      batchId: validation.batchId || undefined,
      hasComponents: validation.hasComponents,
      needsNitb: validation.needsNitb, // Source of truth from validate-unit
      needsCmtInterdiction: productValidation?.needsCmtInterdiction || false,
      otherAliquotsPending: productValidation?.otherAliquotsPending || false,
      confirmedOverrides: allOverrides,
    };

    this.isLoading.set(true);

    this.apiService
      .checkin(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);

          if (response.success) {
            let message = response.message || 'Check-in successful';
            if (response.batchReconciled) {
              message += ' Batch reconciled.';
            }
            this.showSuccess(message);

            // Add to session check-in history (local memory)
            this.sessionCheckins.update(items => [{
              sequence: items.length + 1,
              unitId: request.unitId,
              displayUnitId: this.currentDisplayUnitId() || request.unitId,
              collDate: request.collDate,
              productCode: request.productCode,
              productDesc: this.selectedProduct()?.productDesc,
            }, ...items]);
            this.updatePagination();

            // Clear entry fields (keep temperature)
            this.clearEntryFields();
          } else {
            this.showError(response.message || 'Check-in failed');
          }
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Clear entry fields after successful check-in (keep temperature)
   */
  private clearEntryFields(): void {
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
    this.productCodeField?.clear();
    this.currentUnitId.set(null);
    this.currentDisplayUnitId.set(null);
    this.collectionDate.set(null);
    this.unitValidation.set(null);
    this.selectedProduct.set(null);
    this.productValidation.set(null);
    this.productOptions.set([]);
    this.unitOverrides.set([]);
    this.productOverrides.set([]);
    this.pendingUnitValidateEvent = null;
  }

  /**
   * CLEAR button - clears ALL fields including temperature
   */
  clearAll(): void {
    this.filterForm.reset({ temperature: null });
    this.clearEntryFields();
    this.pageIndex = 0;
    this.sessionCheckins.set([]);
    this.updatePagination();
    setTimeout(() => this.temperatureInput?.nativeElement?.focus(), 100);
  }

  /**
   * Handle numeric-only input for temperature field
   */
  onlyNumbers(event: KeyboardEvent): boolean {
    if (event.altKey || event.metaKey) {
      return true;
    }

    const key = event.key;

    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.', '-', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key) ||
      (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(key.toLowerCase()))
    ) {
      return true;
    }

    if (!/^\d$/.test(key)) {
      event.preventDefault();
      return false;
    }

    return true;
  }

  /**
   * Format temperature to 2 decimal places on blur
   */
  formatTemperature(): void {
    const control = this.filterForm.get('temperature');
    const valueBefore = control?.value;

    if (valueBefore && valueBefore.trim() !== '') {
      const numValue = parseFloat(valueBefore);
      if (!isNaN(numValue)) {
        control?.setValue(numValue.toFixed(2), { emitEvent: false });
      }
    }

    if (this.unitValidation() && control?.value !== valueBefore) {
      this.clearEntryFields();
    }
  }

  /**
   * Show warning dialog
   */
  private showWarningDialog(
    title: string,
    warnings: WarningDto[],
    callback: (override: boolean, codes: string[]) => void
  ): void {
    const dialogData: WarningOverrideDialogData = {
      title,
      warnings,
      allowOverride: true,
    };

    const dialogRef = this.dialog.open(WarningOverrideDialogComponent, {
      width: '560px',
      disableClose: true,
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: WarningOverrideDialogResult) => {
        if (result) {
          callback(result.override, result.codes);
        } else {
          callback(false, []);
        }
      });
  }

  private buildTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'sequence', header: 'Sequence', sortable: true, minWidth: '120px' },
        { key: 'displayUnitId', header: 'Unit ID', sortable: false, minWidth: '200px' },
        {
          key: 'collDate',
          header: 'Collection Date',
          sortable: false,
          minWidth: '150px',
          valueFormatter: (v) => this.formatDate(v),
        },
        { key: 'productCode', header: 'Product Code', sortable: false, minWidth: '130px' },
        { key: 'productDesc', header: 'Product Description', sortable: false, minWidth: '200px' },
      ],
      sortConfig: { column: 'sequence', direction: 'A' },
      pagination: {
        pageSize: this.pageSize,
        pageIndex: this.pageIndex,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      stickyHeader: true,
      emptyMessage: 'No Check-In History',
      emptySubMessage: 'Check-in history for today will appear here',
      noDataIcon: 'history',
      enableRowHighlight: false,
      showPagination: true,
    };
  }

  private updatePagination(): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: this.sessionCheckins().length,
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
      },
    };
  }

  onPageChange(event: TablePageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  onSortChange(event: TableSortEvent): void {
    this.pageIndex = 0;
    const data = this.sessionCheckins().slice();

    if (!event.column || event.direction === 'default') {
      this.sessionCheckins.set(data);
    } else {
      const sorted = data.sort((a, b) => {
        const isAsc = event.direction === 'A';
        if (event.column === 'sequence') {
          return this.compare(a.sequence, b.sequence, isAsc);
        }
        return 0;
      });
      this.sessionCheckins.set(sorted);
    }

    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
      pagination: { ...this.tableConfig.pagination!, pageIndex: 0 },
    };
  }

  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  /**
   * TrackBy function for table rows
   */
  trackBySequence(_index: number, item: CheckinHistoryItemDto): number {
    return item.sequence;
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  private showSuccess(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  private showError(message: string): void {
    this.snackbarService.showError(message);
  }

  getTemperatureError(): string {
    const control = this.filterForm.get('temperature');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Temperature is required';
    return '';
  }

}
