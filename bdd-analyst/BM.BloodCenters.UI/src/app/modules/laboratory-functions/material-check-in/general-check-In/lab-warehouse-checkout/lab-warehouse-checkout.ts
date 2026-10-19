import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { ChangeChapterWarehouseService } from '../../../../system-administration/change-chapter/services/change-chapter-warehouse.service';
import { LabWarehouseCheckoutApiService } from './services/lab-warehouse-checkout-api.service';
import { CloseBatchDialogComponent } from './close-batch-dialog/close-batch-dialog';
import {
  BatchIdLovDto,
  CreateLabWarehouseCheckoutDto,
  LabWarehouseCheckoutQueryDto,
  LabWarehouseCheckoutUnit,
  ValidProductDto,
  WarehouseLookupDto,
  ValidateUnitResponseDto,
  ValidateProductRequestDto,
  ValidateProductResponseDto,
  WarningDto
} from './models/lab-warehouse-checkout.model';
import { WarningOverrideDialogComponent, WarningOverrideDialogData, WarningOverrideDialogResult } from './dialogs/warning-override-dialog';

@Component({
  selector: 'app-lab-warehouse-checkout',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    DataTable,
    MatIconModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent
  ],
  templateUrl: './lab-warehouse-checkout.html',
  styleUrls: ['./lab-warehouse-checkout.scss']
})
export class LabWarehouseCheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiService = inject(LabWarehouseCheckoutApiService);
  private changeChapterService = inject(ChangeChapterWarehouseService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  filterForm!: FormGroup;
  unitEntryForm!: FormGroup;

  // Search FormControls for ngx-mat-select-search
  batchSearchControl = new FormControl<string>('');
  warehouseSearchControl = new FormControl<string>('');
  productSearchControl = new FormControl<string>('');

  // LOV signals
  warehouses = signal<WarehouseLookupDto[]>([]);
  filteredWarehouses = signal<WarehouseLookupDto[]>([]);
  batchIdLov = signal<BatchIdLovDto[]>([]);
  filteredBatchIds = signal<BatchIdLovDto[]>([]);

  // Batch info display signals (auto-populated on batch selection)
  batchDate = signal<string>('');
  batchCreatedBy = signal<string>('');

  // State signals
  units = signal<LabWarehouseCheckoutUnit[]>([]);

  // Table config
  unitsTableConfig!: DataTableConfig<LabWarehouseCheckoutUnit>;
  unitsPageSize = 25;
  unitsPageIndex = 0;
  unitsTotalRecords = 0;
  productOptions = signal<ValidProductDto[]>([]);
  filteredProductOptions = signal<ValidProductDto[]>([]);
  isLoading = signal(false);
  isRetrieving = signal(false);
  isAddingUnit = signal(false);
  isClosingBatch = signal(false);
  batchRetrieved = signal(false);
  currentUnitId = signal<string | null>(null);
  collectionDate = signal<string | null>(null);

  // FMB: product_no flag — true when unit has no components (whole-unit checkout)
  isWholeUnit = signal(false);
  selectedProduct = signal<ValidProductDto | null>(null);

  // Override tracking
  pendingUnitValidateEvent: UnitIdPostValidateEvent | null = null;
  unitOverrides = signal<string[]>([]);
  productOverrides = signal<string[]>([]);

  // Validation state
  unitValidation = signal<ValidateUnitResponseDto | null>(null);
  productValidation = signal<ValidateProductResponseDto | null>(null);

  // Computed signals
  showProductDropdown = computed(() => !this.isWholeUnit() && this.productOptions().length > 0);
  hasUnits = computed(() => this.units().length > 0);
  isExistingBatch = computed(() => !!this.filterForm?.get('batchId')?.value);

  get isRetrieveDisabled(): boolean {
    if (!this.filterForm) return true;
    return (
      this.filterForm.get('sendToWarehouse')?.invalid !== false ||
      this.filterForm.get('checkoutTemp')?.invalid !== false ||
      this.isRetrieving()
    );
  }

  get isClearAllDisabled(): boolean {
    if (!this.filterForm) return true;
    const { batchId, sendToWarehouse, checkoutTemp, remarks } = this.filterForm.getRawValue();
    return !(batchId || sendToWarehouse || (checkoutTemp !== null && checkoutTemp !== '') || remarks);
  }

  // Warehouse location display
  warehouseLocation = signal<string>('');
  sendToWarehouseLabel = signal<string | null>(null);

  constructor() {
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
      }
    });

    effect(() => {
      const warehouseId = this.headerService.warehouseId();
      const warehouseName = this.headerService.warehouseName();
      if (warehouseId && warehouseName) {
        this.warehouseLocation.set(`${warehouseId} - ${warehouseName}`);
      }
    });
  }

  ngOnInit(): void {
    this.buildUnitsTableConfig();
    this.initializeForms();
    this.setupSearchFilters();
    this.subscribeToSendToWarehouse();
    this.subscribeToChapterChange();
    this.loadWarehouses();
    this.loadBatchIdLov();
  }

  private subscribeToSendToWarehouse(): void {
    this.filterForm.get('sendToWarehouse')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(warehouseId => {
        if (!warehouseId) {
          this.sendToWarehouseLabel.set(null);
          return;
        }
        const warehouse = this.warehouses().find(w => w.warehouseId === warehouseId);
        this.sendToWarehouseLabel.set(
          warehouse ? `${warehouse.warehouseId} - ${warehouse.warehouseName}` : warehouseId
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      batchId: [''],
      sendToWarehouse: ['', Validators.required],
      checkoutTemp: [null, [Validators.required, Validators.pattern(/^-?\d{1,3}(\.\d{1,2})?$/)]],
      remarks: ['']
    });

    this.unitEntryForm = this.fb.group({
      productCode: [{ value: '', disabled: true }]
    });
  }

  // ── Search filters ────────────────────────────────────────────────────────────

  private setupSearchFilters(): void {
    this.batchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredBatchIds.set(
          t
            ? this.batchIdLov().filter(b =>
                b.batchId.toLowerCase().includes(t) ||
                b.batchName?.toLowerCase().includes(t)
              )
            : this.batchIdLov()
        );
      });

    this.warehouseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredWarehouses.set(
          t
            ? this.warehouses().filter(w =>
                w.warehouseId.toLowerCase().includes(t) ||
                w.warehouseName?.toLowerCase().includes(t)
              )
            : this.warehouses()
        );
      });

    this.productSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const t = (term || '').toLowerCase().trim();
        this.filteredProductOptions.set(
          t
            ? this.productOptions().filter(p =>
                p.productCode.toLowerCase().includes(t) ||
                p.productDescription?.toLowerCase().includes(t)
              )
            : this.productOptions()
        );
      });
  }

  // ── Batch ID selected (existing batch) ───────────────────────────────────────
  // FMB CTRL_BLK_1.BATCH_ID VALIDATE_FIELD: populates to_warehouse, checkout_temp,
  // batch_name, created_on, created_by from LAB_WH_TRANS_HDR + VSERV_MASTER.

  onBatchIdSelected(batchId: string): void {
    const batch = this.batchIdLov().find(b => b.batchId === batchId);
    if (!batch) return;

    this.filterForm.patchValue({
      sendToWarehouse: batch.toWarehouse,
      checkoutTemp: batch.checkoutTemp,
      remarks: batch.batchName || ''
    });
    this.batchDate.set(batch.createDate ? this.formatDate(batch.createDate) : '');
    this.batchCreatedBy.set(batch.createUser || '');
  }

  // ── LOV loaders ───────────────────────────────────────────────────────────────

  private loadBatchIdLov(): void {
    this.apiService.getBatchIdLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => {
          this.batchIdLov.set(batches);
          this.filteredBatchIds.set(batches);
        },
        error: () => {
          // Auth interceptor handles error display
        }
      });
  }

  private loadWarehouses(): void {
    const chapterId = this.headerService.chapterId();
    const currentWarehouseId = this.headerService.warehouseId();

    this.changeChapterService.getWarehousesByChapter(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (warehouses) => {
          const filtered = warehouses
            .filter(w => w.warehouseId !== currentWarehouseId)
            .map(w => ({ warehouseId: w.warehouseId, warehouseName: w.warehouseName }));
          this.warehouses.set(filtered);
          this.filteredWarehouses.set(filtered);
        },
        error: () => {
          // Auth interceptor handles error display
        }
      });
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────────

  private subscribeToChapterChange(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadWarehouses();
        this.loadBatchIdLov();
      });
  }

  // ── Unit ID field ─────────────────────────────────────────────────────────────
  // FMB LAB_WH_TRANS_DTL.UNIT_ID VALIDATE_FIELD:
  //   - If unit has no components (product_code != 'NONE'): product_no = 'Y' → whole-unit
  //   - If unit has components: product_no = 'N' → component-level, show product LOV

  onPostValidate(event: UnitIdPostValidateEvent): void {
    // Prevent duplicate calls if already validating
    if (this.isLoading()) {
      return;
    }

    this.pendingUnitValidateEvent = event;
    const unitId = event.data.parsedUnitId;
    this.currentUnitId.set(unitId);

    // Reset product selection
    const productControl = this.unitEntryForm.get('productCode');
    productControl?.setValue(null);
    productControl?.clearValidators();
    productControl?.disable();
    productControl?.markAsUntouched();
    productControl?.updateValueAndValidity();
    this.productOptions.set([]);
    this.filteredProductOptions.set([]);
    this.productSearchControl.setValue('', { emitEvent: false });
    this.selectedProduct.set(null);

    this.isLoading.set(true);

    const request = {
      unitId,
      overrides: this.unitOverrides(),
    };

    this.apiService.validateUnit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.handleUnitValidationResponse(response, event);
        },
        error: (error) => {
          this.isLoading.set(false);
          // Auth interceptor handles error display
          const message = error?.error?.message || error?.message || 'Unit validation failed';
          event.reject(message);
        },
      });
  }

  /**
   * Handle unit validation response
   */
  private handleUnitValidationResponse(response: ValidateUnitResponseDto, event: UnitIdPostValidateEvent): void {
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
          // Retry with overrides
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
    this.collectionDate.set(
      response.collDate ? this.formatDate(response.collDate) : null
    );

    // Scenario 2: Unit has components but no valid products available → ERROR 0244
    if (response.hasComponents && response.products.length === 0) {
      event.reject('All components already in transit or not in this warehouse');
      return;
    }

    // Scenario 3: Unit has components and products available → show dropdown
    if (response.hasComponents && response.products.length > 0) {
      this.productOptions.set(response.products);
      this.filteredProductOptions.set(response.products);
      this.isWholeUnit.set(false);
      const productControl = this.unitEntryForm.get('productCode');
      productControl?.setValidators([Validators.required]);
      productControl?.enable();
      productControl?.markAsUntouched();
      productControl?.updateValueAndValidity();
    } else {
      // Scenario 1: Unit has no components (hasComponents = false) → whole-unit checkout
      this.isWholeUnit.set(true);
      this.productOptions.set([]);
      this.filteredProductOptions.set([]);
      const productControl = this.unitEntryForm.get('productCode');
      productControl?.clearValidators();
      productControl?.disable();
      productControl?.updateValueAndValidity();
      // Auto-add unit immediately (no product selection needed)
      this.onAddUnit();
    }
  }

  // Product code selected → validate product before adding
  onProductSelected(product: ValidProductDto | null): void {
    if (!product?.productCode || !this.currentUnitId()) return;

    // Store selected product for use in onAddUnit()
    this.selectedProduct.set(product);

    // Get collDate from unit validation response
    const unitValidationResponse = this.unitValidation();
    const collDate = unitValidationResponse?.collDate
      ? this.formatCollDateForApi(unitValidationResponse.collDate)
      : '';

    const request: ValidateProductRequestDto = {
      unitId: this.currentUnitId() || '',
      productCode: product.productCode,
      collDate,
      overrides: this.productOverrides(),
    };

    this.isLoading.set(true);

    this.apiService.validateProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleProductValidationResponse(response, product),
        error: () => {
          this.isLoading.set(false);
          // Auth interceptor handles error display
        },
      });
  }

  /**
   * Handle product validation response
   */
  private handleProductValidationResponse(response: ValidateProductResponseDto, product: ValidProductDto): void {
    this.isLoading.set(false);

    if (response.status === 'ERROR') {
      // Error is already shown by auth interceptor
      return;
    }

    if (response.status === 'WARNING') {
      this.showWarningDialog('Product Validation Warnings', response.warnings, (override, codes) => {
        if (override) {
          this.productOverrides.set([...new Set([...this.productOverrides(), ...codes])]);
          this.onProductSelected(product);
        } else {
          this.selectedProduct.set(null);
          this.unitEntryForm.get('productCode')?.reset();
        }
      });
      return;
    }

    // Status === 'OK' - store validation and proceed to add unit
    this.productValidation.set(response);
    this.unitEntryForm.get('productCode')?.setValue(product.productCode);
    this.onAddUnit();
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

  // ── RETRIEVE ──────────────────────────────────────────────────────────────────

  onRetrieve(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) {
      return;
    }
    this.isRetrieving.set(true);
    this.loadUnitsForBatch(batchId);
  }

  private loadUnitsForBatch(batchId: string): void {
    const query: LabWarehouseCheckoutQueryDto = { batchId };

    this.apiService.getCheckoutRecords(1000, 0, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.length) {
            this.units.set(response.data.map((item, index) => ({
              sequence: index + 1,
              unitId: item.unitId,
              collectionDate: item.collectionDate ? this.formatDate(item.collectionDate) : '',
              productCode: item.productCode,
              productDescription: item.productDescription || '',
              aliquot: '',
              batchId: item.batchId
            })));
          } else {
            this.units.set([]);
            if (response.success) this.showInfo('No units found for this batch');
          }
          this.unitsPageIndex = 0;
          this.unitsTotalRecords = this.units().length;
          this.updateUnitsTableConfig();
          this.batchRetrieved.set(true);
          this.isRetrieving.set(false);
        },
        error: () => {
          this.units.set([]);
          this.isRetrieving.set(false);
          // Auth interceptor handles error display
        }
      });
  }

  // ── ADD UNIT ──────────────────────────────────────────────────────────────────
  // FMB DO_SAVE: batch must already be OPEN (batches created separately).

  onAddUnit(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) {
      return;
    }

    const unitId = this.currentUnitId();
    if (!unitId) {
      return;
    }

    if (!this.isWholeUnit() && !this.unitEntryForm.get('productCode')?.value) {
      return;
    }

    const createDto: CreateLabWarehouseCheckoutDto = {
      batchId,
      unitId,
      productCode: this.isWholeUnit()
        ? undefined
        : this.selectedProduct()?.productCode
    };

    this.isAddingUnit.set(true);

    this.apiService.createCheckout(createDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Unit added to batch successfully');
            this.resetUnitEntry();
            this.loadUnitsForBatch(batchId);
          }
          this.isAddingUnit.set(false);
        },
        error: () => {
          this.isAddingUnit.set(false);
          // Auth interceptor handles error display
        }
      });
  }

  private resetUnitEntry(): void {
    this.unitIdField?.clear();
    this.currentUnitId.set(null);
    this.collectionDate.set(null);
    this.isWholeUnit.set(false);
    this.unitEntryForm.reset();
    const productControl = this.unitEntryForm.get('productCode');
    productControl?.clearValidators();
    productControl?.disable();
    productControl?.markAsUntouched();
    productControl?.updateValueAndValidity();
    this.productOptions.set([]);
    this.filteredProductOptions.set([]);
    this.productSearchControl.setValue('', { emitEvent: false });
    this.selectedProduct.set(null);
    this.unitValidation.set(null);
    this.productValidation.set(null);
    this.unitOverrides.set([]);
    this.productOverrides.set([]);
    this.pendingUnitValidateEvent = null;
  }

  // ── CLOSE BATCH ───────────────────────────────────────────────────────────────
  // FMB KEY-COMMIT: update LAB_WH_TRANS_HDR set batch_status = 'CLOSE' + GEN_CHKOUT_SLIP (CPRCKOSL).

  onCloseBatch(): void {
    const batchId = this.filterForm.get('batchId')?.value;
    if (!batchId) {
      return;
    }
    if (!this.hasUnits()) {
      return;
    }

    const dialogRef = this.dialog.open(CloseBatchDialogComponent, {
      width: '480px',
      data: {
        title: 'Are you sure you want to close the batch?',
        message: 'Closing the batch will print a transfer slip. Cancel will keep the batch open and allow you to continue adding units.',
        confirmText: 'CLOSE BATCH',
        cancelText: 'CANCEL'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) this.executeBatchClose(batchId);
      });
  }

  private executeBatchClose(batchId: string): void {
    this.isClosingBatch.set(true);
    this.apiService.closeBatch(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(`Batch ${batchId} closed. Checkout slip has been generated.`);
            this.clearAll();
          }
          this.isClosingBatch.set(false);
        },
        error: () => {
          this.isClosingBatch.set(false);
          // Auth interceptor handles error display
        }
      });
  }

  // ── DELETE UNIT ───────────────────────────────────────────────────────────────

  onDeleteUnit(unit: LabWarehouseCheckoutUnit): void {
    const dialogRef = this.dialog.open(CloseBatchDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Delete',
        message: `Remove unit ${unit.unitId} from batch?`,
        confirmText: 'DELETE',
        cancelText: 'CANCEL'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) this.deleteUnit(unit);
      });
  }

  private deleteUnit(unit: LabWarehouseCheckoutUnit): void {
    this.isLoading.set(true);
    this.apiService.deleteCheckout(unit.batchId, unit.unitId, unit.productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Unit removed from batch');
            this.loadUnitsForBatch(unit.batchId);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          // Auth interceptor handles error display
        }
      });
  }

  // ── CLEAR ALL ─────────────────────────────────────────────────────────────────

  clearAll(): void {
    this.filterForm.reset();
    this.batchSearchControl.setValue('');
    this.warehouseSearchControl.setValue('');
    this.batchDate.set('');
    this.batchCreatedBy.set('');
    this.sendToWarehouseLabel.set(null);
    this.resetUnitEntry();
    this.units.set([]);
    this.batchRetrieved.set(false);
    this.filteredBatchIds.set(this.batchIdLov());
    this.filteredWarehouses.set(this.warehouses());
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  }

  private formatCollDateForApi(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (!field) return '';
    if (field.hasError('required')) return `${this.getFieldLabel(fieldName)} is required`;
    if (field.hasError('pattern')) return `${this.getFieldLabel(fieldName)} is not a valid number (e.g. 4.00)`;
    if (field.hasError('maxlength')) return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors?.['maxlength'].requiredLength} characters`;
    return '';
  }

  private buildUnitsTableConfig(): void {
    this.unitsTableConfig = {
      columns: [
        { key: 'sequence', header: 'Sequence', sortable: true, minWidth: '100px' },
        { key: 'unitId', header: 'Unit ID', sortable: false, minWidth: '140px' },
        { key: 'collectionDate', header: 'Collection Date', sortable: false, minWidth: '140px' },
        { key: 'productCode', header: 'Product Code', sortable: false, minWidth: '130px' },
        { key: 'productDescription', header: 'Product Description', sortable: false, minWidth: '180px' },
      ],
      sortConfig: { column: 'sequence', direction: 'D' },
      pagination: {
        pageSize: this.unitsPageSize,
        pageIndex: this.unitsPageIndex,
        totalRecords: this.unitsTotalRecords,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      stickyHeader: true,
      emptyMessage: 'No units have been added to this batch yet.',
      emptySubMessage: 'Scan or type a Unit ID above to add units.',
      noDataIcon: 'search',
      enableRowHighlight: true,
    };
  }

  private updateUnitsTableConfig(): void {
    this.unitsTableConfig = {
      ...this.unitsTableConfig,
      pagination: {
        ...this.unitsTableConfig.pagination!,
        totalRecords: this.unitsTotalRecords,
        pageIndex: this.unitsPageIndex,
        pageSize: this.unitsPageSize,
      },
    };
  }

  onUnitsPageChange(event: TablePageEvent): void {
    this.unitsPageIndex = event.pageIndex;
    this.unitsPageSize = event.pageSize;
    this.updateUnitsTableConfig();
  }

  onUnitsSortChange(event: TableSortEvent): void {
    if (event.direction !== 'default') {
      const sorted = [...this.units()].sort((a, b) => {
        const aVal = a[event.column as keyof LabWarehouseCheckoutUnit] ?? '';
        const bVal = b[event.column as keyof LabWarehouseCheckoutUnit] ?? '';
        if (aVal === bVal) return 0;
        const cmp = aVal < bVal ? -1 : 1;
        return event.direction === 'A' ? cmp : -cmp;
      });
      this.units.set(sorted);
    }
    this.unitsTableConfig = {
      ...this.unitsTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      batchId: 'Batch ID',
      sendToWarehouse: 'Send to Warehouse',
      checkoutTemp: 'Temperature',
      unitId: 'Unit ID',
      productCode: 'Product Code',
      aliquot: 'Aliquot'
    };
    return labels[fieldName] || fieldName;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }
}
