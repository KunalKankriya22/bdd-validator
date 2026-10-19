import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { VerifyComponentSuitabilityApiService } from './services/verify-component-suitability-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
} from '@shared/interfaces/data-table.interface';

import {
  ProcessCodeDto,
  ProductTypeDto,
  ProductCodeDto,
  EligibleProductDto,
  ComponentDetailDto,
  ScannedComponentModel,
  AssignSpecialProcessRequestDto,
} from './models/verify-component-suitability.model';

/**
 * Verify Component Suitability Component
 * Record the time a unit is placed in the freezer during real-time separation
 *
 * JIRA: MLT-13129
 * Mnemonic: SUIT
 */
@Component({
  selector: 'app-verify-component-suitability',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './verify-component-suitability.html',
  styleUrl: './verify-component-suitability.scss',
})
export class VerifyComponentSuitability implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `verify-component-suitability-${VerifyComponentSuitability.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(VerifyComponentSuitabilityApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loggingService = inject(LoggingService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackBar = inject(MatSnackBar);

  // Signal-based state
  readonly processCodes = signal<ProcessCodeDto[]>([]);
  readonly productTypes = signal<ProductTypeDto[]>([]);
  readonly productCodes = signal<ProductCodeDto[]>([]);
  readonly eligibleProducts = signal<EligibleProductDto[]>([]);
  readonly scannedComponents = signal<ScannedComponentModel[]>([]);
  readonly selectedProcessCode = signal<string | null>(null);
  readonly selectedProductType = signal<string | null>(null);
  readonly selectedProductCode = signal<string | null>(null);
  readonly validatedUnitId = signal<string | null>(null);
  readonly loading = signal<boolean>(false);
  readonly loadingProcessCodes = signal<boolean>(false);
  readonly loadingProductTypes = signal<boolean>(false);
  readonly loadingProductCodes = signal<boolean>(false);
  readonly loadingEligibleProducts = signal<boolean>(false);
  readonly validatingProduct = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly productError = signal<string | null>(null);
  readonly submitted = signal<boolean>(false);
  readonly validatedComponent = signal<ComponentDetailDto | null>(null);
  readonly statusAnnouncement = signal<string>('');

  // Computed values
  readonly processCodeDescription = computed(() => {
    const selected = this.selectedProcessCode();
    if (!selected) return '';
    const processCode = this.processCodes().find((pc) => pc.code === selected);
    return processCode?.description || '';
  });

  readonly selectedProcessProductType = signal<string | null>(null);

  readonly processProductTypeDescription = computed(() => {
    const selected = this.selectedProcessProductType();
    if (!selected) return '';
    const productType = this.productTypes().find((pt) => pt.productType === selected);
    return productType?.description || '';
  });

  readonly productTypeDescription = computed(() => {
    const selected = this.selectedProductType();
    if (!selected) return '';
    const productType = this.productTypes().find((pt) => pt.productType === selected);
    return productType?.description || '';
  });

  readonly productCodeDescription = computed(() => {
    const selected = this.selectedProductCode();
    if (!selected) return '';
    const product = this.eligibleProducts().find((p) => p.productCode === selected);
    return product?.description || '';
  });

  readonly hasProcessCodeSelected = computed(() => !!this.selectedProcessCode());
  readonly hasScannedComponents = computed(() => this.scannedComponents().length > 0);
  readonly pendingComponents = computed(() =>
    this.scannedComponents().filter((c) => c.status === 'pending')
  );
  readonly hasPendingComponents = computed(() => this.pendingComponents().length > 0);

  // Forms
  processForm!: FormGroup;
  unitForm!: FormGroup;
  filterForm!: FormGroup;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: 'Verify Component Suitability',
    subtitle: 'Record the time a unit is placed in the freezer during real-time separation.',
    actions: [],
  };

  // Data table configuration
  tableConfig: DataTableConfig<ScannedComponentModel> = {
    columns: [],
      pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    emptyMessage: 'No Results to Display - Scan or enter a Unit ID to begin',
    loadingMessage: 'Loading...',
    showPagination: true,
  };

  private validatedCount = 0;
  private validationSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeForms();
    this.initializeTableConfig();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || this.headerConfig.subtitle || '',
        };
      }
    });

    let prevHasProcessCode = false;
    effect(() => {
      const hasCode = this.hasProcessCodeSelected();
      if (hasCode && !prevHasProcessCode) {
        setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus(), 100);
      }
      prevHasProcessCode = hasCode;
    });
  }

  ngOnInit(): void {
    this.loadProcessCodes();
    this.loadProductTypes();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.dismissValidationSnackbar();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.processForm = this.fb.group({
      productType: [''],
      processCode: ['', [Validators.required]],
    });

    this.unitForm = this.fb.group({
      productCode: ['', [Validators.required]],
    });

    this.filterForm = this.fb.group({
      productType: [''],
      productCode: [''],
    });
  }

  private initializeTableConfig(): void {
    const columns: TableColumn<ScannedComponentModel>[] = [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: false,
        width: '219px',
      },
      {
        key: 'productCode',
        header: 'Product Code',
        sortable: false,
        width: '200px',
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        width: '219px',
      },
      {
        key: 'aboRh',
        header: 'ABORh',
        sortable: false,
        width: '194px',
      },
      {
        key: 'expiryDate',
        header: 'Expiration Date',
        sortable: false,
        width: '225px',
        valueFormatter: (value: string, row: ScannedComponentModel) => this.formatDateTime(row.expiryDate),
      },
    ];

    this.tableConfig = {
      ...this.tableConfig,
      columns,
    };
  }

  private setupFormListeners(): void {
    this.processForm
      .get('productType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((productType) => {
        this.selectedProcessProductType.set(productType);
        this.processForm.patchValue({ processCode: '' }, { emitEvent: false });
        this.selectedProcessCode.set(null);
        this.productCodes.set([]);
        this.unitIdField?.clear();
        this.validatedUnitId.set(null);
        this.unitForm.reset();
        this.productError.set(null);
        this.eligibleProducts.set([]);
        if (productType) {
          this.loadProductCodes(productType);
        }
      });

    this.processForm
      .get('processCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((processCode) => {
        this.selectedProcessCode.set(processCode);
        this.unitIdField?.clear();
        this.validatedUnitId.set(null);
        this.unitForm.reset();
        this.productError.set(null);
        this.eligibleProducts.set([]);
      });

    // Filter form listeners for product type/code filtering
    this.filterForm
      .get('productType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((productType) => {
        this.selectedProductType.set(productType);
        this.filterForm.patchValue({ productCode: '' }, { emitEvent: false });
      });

    this.filterForm
      .get('productCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((productCode) => {
        this.selectedProductCode.set(productCode);
      });
  }

  private loadProcessCodes(): void {
    this.loadingProcessCodes.set(true);
    this.apiService.getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.processCodes.set(data);
          this.loadingProcessCodes.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load process codes', error);
          this.snackbarService.showError('Failed to load process codes');
          this.loadingProcessCodes.set(false);
        },
      });
  }

  private loadProductTypes(): void {
    this.loadingProductTypes.set(true);
    this.apiService.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.productTypes.set(data);
          this.loadingProductTypes.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load product types', error);
          this.loadingProductTypes.set(false);
        },
      });
  }

  private loadProductCodes(productType: string): void {
    this.loadingProductCodes.set(true);
    this.apiService.getProductCodes(productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.productCodes.set(data);
          this.loadingProductCodes.set(false);
        },
        error: (error) => {
          this.loggingService.error('Failed to load product codes', error);
          this.snackbarService.showError('Failed to load product codes');
          this.loadingProductCodes.set(false);
        },
      });
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    const processCode = this.processForm.get('processCode')?.value;

    const alreadyScanned = this.scannedComponents().some((c) => c.unitId === unitId);
    if (alreadyScanned) {
      event.reject('This unit already scanned');
      return;
    }

    this.loadingEligibleProducts.set(true);
    this.apiService.validateUnit({ unitId, processCode })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data.isEligible) {
            event.confirm();
          } else {
            this.loadingEligibleProducts.set(false);
            event.reject(response.data.errorMessage || 'Unit is not eligible');
          }
        },
        error: (error) => {
          this.loadingEligibleProducts.set(false);
          const errorMessage = error?.error?.message || error?.error?.errorResponse?.error || error?.message || 'Unit validation failed';
          event.reject(errorMessage);
        },
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.validatedUnitId.set(data.parsedUnitId);
    const processCode = this.processForm.get('processCode')?.value;
    this.loadEligibleProducts(data.parsedUnitId, processCode);
  }

  onUnitCleared(): void {
    this.validatedUnitId.set(null);
    this.eligibleProducts.set([]);
    this.productError.set(null);
    this.unitForm.reset();
  }

  private loadEligibleProducts(unitId: string, processCode: string): void {
    this.loadingEligibleProducts.set(true);
    this.apiService.getEligibleProducts(unitId, processCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.eligibleProducts.set(data);
          this.loadingEligibleProducts.set(false);

          if (data.length === 0) {
            this.snackbarService.showError('No eligible products found for this unit');
            this.statusAnnouncement.set('No eligible products found for this unit');
          } else {
            this.statusAnnouncement.set(`${data.length} eligible product${data.length === 1 ? '' : 's'} found`);
          }
        },
        error: (error) => {
          this.loggingService.error('Failed to load eligible products', error);
          this.snackbarService.showError('Failed to load eligible products');
          this.loadingEligibleProducts.set(false);
          this.eligibleProducts.set([]);
        },
      });
  }

  onProductCodeChange(): void {
    const unitId = this.validatedUnitId();
    const productCode = this.unitForm.get('productCode')?.value;
    const processCode = this.processForm.get('processCode')?.value;

    if (!unitId || !productCode || !processCode) {
      return;
    }

    this.validateProduct(unitId, productCode, processCode);
  }

  private validateProduct(unitId: string, productCode: string, processCode: string): void {
    this.productError.set(null);
    this.validatingProduct.set(true);

    this.apiService.validateProduct(unitId, productCode, processCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.validatedComponent.set(response.data);
          this.addScannedComponent(response.data);
          this.validatingProduct.set(false);
          this.statusAnnouncement.set(`Component ${response.data.unitId} validated and added to table`);
          this.showValidationSnackbar();
          this.unitIdField?.clear();
          this.validatedUnitId.set(null);
          this.validatedComponent.set(null);
          this.unitForm.reset();
          this.unitForm.markAsPristine();
          this.unitForm.markAsUntouched();
          this.productError.set(null);
          this.eligibleProducts.set([]);
          setTimeout(() => this.unitIdField?.unitIdInput?.nativeElement?.focus(), 100);
        },
        error: (error) => {
          const errorMessage = error?.error?.message || error?.error?.errorResponse?.error || 'Product validation failed';
          this.productError.set(errorMessage);
          this.validatingProduct.set(false);
        },
      });
  }

  private addScannedComponent(data: any): void {
    const newComponent: ScannedComponentModel = {
      unitId: data.unitId,
      productCode: data.productCode,
      description: data.productDescription,
      aboRh: data.aboRh || '-',
      expiryDate: data.expiryDate,
      componentPrefix: data.componentPrefix,
      processCode: this.processForm.get('processCode')?.value,
      status: 'pending',
    };

    const isDuplicate = this.scannedComponents().some((c) => c.unitId === newComponent.unitId);
    if (isDuplicate) {
      this.productError.set('This unit already scanned');
      return;
    }

    this.scannedComponents.update((components) => [...components, newComponent]);
    this.updateTableData();
  }

  private updateTableData(): void {
    const components = this.scannedComponents();
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: components.length,
      },
    };
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    };
  }

  onSave(): void {
    const pendingComponents = this.pendingComponents();

    if (pendingComponents.length === 0) {
      this.snackbarService.showError('No components to save');
      return;
    }

    this.saving.set(true);

    const requests: AssignSpecialProcessRequestDto[] = pendingComponents.map((component) => ({
      processCode: component.processCode,
      unitId: component.unitId,
      productCode: component.productCode,
      componentPrefix: component.componentPrefix || undefined,
    }));

    this.apiService.assignBatch(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          const successCount = results.filter((r) => r.success).length;
          const failedCount = results.filter((r) => !r.success).length;

          // Update component statuses
          this.scannedComponents.update((components) =>
            components.map((component) => {
              const result = results.find(
                (r) =>
                  r.request.unitId === component.unitId &&
                  r.request.productCode === component.productCode
              );
              if (result) {
                return {
                  ...component,
                  status: result.success ? 'saved' : 'error',
                  errorMessage: result.error,
                };
              }
              return component;
            })
          );

          this.saving.set(false);

          if (successCount > 0) {
            this.snackbarService.showSuccess(`${successCount} Entries saved`);
          }

          if (failedCount > 0) {
            this.snackbarService.showError(`${failedCount} Entries failed to save`);
          }

          const allWarnings = results
            .filter((r) => r.success && r.data?.warnings?.length)
            .flatMap((r) => r.data!.warnings);
          if (allWarnings.length > 0) {
            const warningMessages = allWarnings.map((w) => w.message).join('; ');
            this.snackbarService.showInfo(warningMessages);
          }

          this.updateTableData();
        },
        error: (error) => {
          this.loggingService.error('Failed to save components', error);
          this.snackbarService.showError('Failed to save components');
          this.saving.set(false);
        },
      });
  }

  onReset(): void {
    this.dismissValidationSnackbar();
    this.processForm.reset();
    this.unitIdField?.clear();
    this.validatedUnitId.set(null);
    this.unitForm.reset();
    this.filterForm.reset();
    this.scannedComponents.set([]);
    this.eligibleProducts.set([]);
    this.productCodes.set([]);
    this.selectedProcessCode.set(null);
    this.selectedProcessProductType.set(null);
    this.selectedProductType.set(null);
    this.selectedProductCode.set(null);
    this.productError.set(null);
    this.validatedComponent.set(null);
    this.submitted.set(false);
    this.updateTableData();
  }

  private showValidationSnackbar(): void {
    this.validatedCount++;
    const message = `${this.validatedCount} ${this.validatedCount === 1 ? 'Entry' : 'Entries'} validated`;
    this.validationSnackBarRef = this.snackBar.open(message, 'DISMISS', {
      duration: 0,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
    this.validationSnackBarRef.onAction().subscribe(() => {
      this.validatedCount = 0;
      this.validationSnackBarRef = null;
    });
  }

  private dismissValidationSnackbar(): void {
    if (this.validationSnackBarRef) {
      this.validationSnackBarRef.dismiss();
      this.validationSnackBarRef = null;
      this.validatedCount = 0;
    }
  }

  protected formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : dateString;
  }

  get pf() {
    return this.processForm.controls;
  }

  get uf() {
    return this.unitForm.controls;
  }

  get ff() {
    return this.filterForm.controls;
  }

  // Expose scannedComponents for template
  get dataSource(): ScannedComponentModel[] {
    return this.scannedComponents();
  }

  // Filter eligible products based on filter form
  get filteredEligibleProducts(): EligibleProductDto[] {
    const products = this.eligibleProducts();
    const selectedType = this.selectedProductType();
    const selectedCode = this.selectedProductCode();

    if (!selectedType && !selectedCode) {
      return products;
    }

    // Note: Filtering by product type requires additional data from API
    // For now, return all products as the API doesn't provide product type in eligible products
    return products;
  }
}
