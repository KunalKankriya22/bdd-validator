import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, startWith, map, debounceTime } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Shared Components
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  UnitIdFieldComponent,
  UnitIdPostValidateEvent,
  UnitValidationResponse as SharedUnitValidationResponse
} from '@shared/components/unit-id-field';

// Interfaces
import { PageHeaderConfig, BreadcrumbItem } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';

// Services and Models
import { RejectInventoryProductsService } from './services/reject-inventory-products.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  RejectedInventoryItem,
  RejectionCodeItem,
  ProductCodeItem,
  RejectInventoryFilterCriteria,
  RejectInventoryRequest,
  UnitValidationResponse
} from './models/reject-inventory-products.model';

@Component({
  selector: 'app-reject-inventory-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent
  ],
  templateUrl: './reject-inventory-products.html',
  styleUrls: ['./reject-inventory-products.scss']
})
export class RejectInventoryProducts implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `reject-inventory-products-${RejectInventoryProducts.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Shared Unit ID field reference
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RejectInventoryProductsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly inventoryData = signal<RejectedInventoryItem[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalRecords = signal<number>(0);
  protected readonly submitted = signal<boolean>(false);
  protected readonly rejectionCodes = signal<RejectionCodeItem[]>([]);
  protected readonly productCodes = signal<ProductCodeItem[]>([]);
  protected readonly isLoadingProductCodes = signal<boolean>(false);
  protected readonly isLoadingRejectionCodes = signal<boolean>(false);
  protected readonly isRejecting = signal<boolean>(false);

  // Unit ID state from shared component
  private readonly displayUnitId = signal<string>('');
  private readonly storedCodeScheme = signal<string>('I');
  private readonly storedParsedUnitId = signal<string>('');
  private readonly unitCollDate = signal<string>('');

  // Search controls for dropdowns
  productCodeSearchControl = new FormControl('');
  rejectionCodeSearchControl = new FormControl('');

  // Filtered options for searchable dropdowns
  protected readonly filteredProductCodes = signal<ProductCodeItem[]>([]);
  protected readonly filteredRejectionCodes = signal<RejectionCodeItem[]>([]);

  // Dropdown value signals for display
  private readonly productCodeValue = signal<string | null>(null);
  private readonly rejectionCodeValue = signal<string | null>(null);

  // Tooltip truncation
  isProductTruncated = false;
  isRejectionTruncated = false;

  // Computed values
  protected readonly isEmpty = computed(() => this.inventoryData().length === 0 && !this.loading());
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasSearched = computed(() => this.submitted());

  // Computed display values
  protected readonly selectedProductDisplay = computed(() => {
    const value = this.productCodeValue();
    if (!value) return '';
    const product = this.productCodes().find(p => (p.code || p.productCode) === value);
    if (!product) return value;
    const code = product.code || product.productCode;
    const desc = product.description || product.productDesc;
    return desc ? `${code} - ${desc}` : code;
  });

  protected readonly selectedRejectionDisplay = computed(() => {
    const value = this.rejectionCodeValue();
    if (!value) return '';
    const code = this.rejectionCodes().find(c => c.code === value);
    if (!code) return value;
    return code.description ? `${code.code} - ${code.description}` : code.code;
  });

  // Form
  filterForm!: FormGroup;

  // Page Header Configuration
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  constructor() {
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

  // Data Table Configuration
  tableConfig: DataTableConfig<RejectedInventoryItem> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'productCode', header: 'Product Code', sortable: false },
      { key: 'rejectionCode', header: 'Rejection Code', sortable: false },
      { key: 'rejectionReason', header: 'Rejection Reason', sortable: false },
      { key: 'aboRh', header: 'ABORh', sortable: false },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        sortable: false,
        type: 'date',
        valueFormatter: (value: string) => {
          if (!value) return '-';
          const date = new Date(value);
          const day = String(date.getDate()).padStart(2, '0');
          const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
          const month = months[date.getMonth()];
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${day}-${month}-${year} ${hours}:${minutes}`;
        }
      },
      { key: 'location', header: 'Location', sortable: false }
    ],
    showPagination: false,
    stickyHeader: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin',
    noDataIcon: 'search'
  };

  ngOnInit(): void {
    this.initForm();
    this.loadLookupData();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize filter form with validation
   */
  private initForm(): void {
    this.filterForm = this.fb.group({
      productCode: ['', [Validators.maxLength(8)]],
      rejectionCode: ['']
    });

    // Subscribe to value changes for display signals
    this.filterForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.productCodeValue.set(val));

    this.filterForm.get('rejectionCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.rejectionCodeValue.set(val));
  }


  /**
   * Load lookup data (rejection codes only - product codes loaded after unit validation)
   */
  private loadLookupData(): void {
    // Load rejection codes
    this.isLoadingRejectionCodes.set(true);
    this.service.getRejectionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const codes = response.item || response.data || [];
          // Map the response to ensure we have the expected structure
          const mappedCodes = codes.map((code: any) => ({
            code: code.code,
            description: code.codeDesc || code.description || ''
          }));
          this.rejectionCodes.set(mappedCodes);
          this.filteredRejectionCodes.set(mappedCodes);
          this.isLoadingRejectionCodes.set(false);
        },
        error: (err) => {
          this.showError('Failed to load rejection codes');
          console.error('Error loading rejection codes:', err);
          this.isLoadingRejectionCodes.set(false);
        }
      });
  }

  /**
   * Load product codes for the validated unit
   */
  private loadProductCodesForUnit(): void {
    const parsedUnitId = this.storedParsedUnitId();
    const collDate = this.unitCollDate();
    if (!parsedUnitId || !collDate) {
      console.warn('Cannot load product codes: unit validation data missing');
      return;
    }

    this.isLoadingProductCodes.set(true);
    this.service.getProductCodes(parsedUnitId, collDate, this.storedCodeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const codes = response.item || response.data || [];
          const mappedCodes = codes.map((code: any) => ({
            code: code.productCode || code.code,
            description: code.productDesc || code.description || '',
            productCode: code.productCode || code.code,
            productDesc: code.productDesc || code.description || ''
          }));
          this.productCodes.set(mappedCodes);
          this.filteredProductCodes.set(mappedCodes);
          this.isLoadingProductCodes.set(false);

          if (mappedCodes.length === 0) {
            this.showError('No available products for this unit');
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.error?.errorResponse?.error || 'Failed to load product codes';
          this.showError(errorMessage);
          console.error('Error loading product codes:', err);
          this.isLoadingProductCodes.set(false);
          this.productCodes.set([]);
          this.filteredProductCodes.set([]);
        }
      });
  }

  /**
   * Setup search filters for dropdowns
   */
  private setupSearchFilters(): void {
    // Product code search filter with scan auto-select
    this.productCodeSearchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(search => {
        const searchTerm = (search || '').toLowerCase();
        const filtered = this.productCodes().filter(product => {
          const code = (product.code || product.productCode || '').toLowerCase();
          const desc = (product.description || product.productDesc || '').toLowerCase();
          return code.includes(searchTerm) || desc.includes(searchTerm);
        });
        this.filteredProductCodes.set(filtered);

        // Scan auto-select: if search matches a single product code exactly
        if (search && (search.length === 5 || search.length === 8)) {
          const exactMatch = this.productCodes().find(pc =>
            (pc.code || '').toUpperCase() === search.toUpperCase() ||
            (pc.productCode || '').toUpperCase() === search.toUpperCase()
          );
          if (exactMatch) {
            const code = exactMatch.code || exactMatch.productCode;
            this.filterForm.patchValue({ productCode: code });
            this.productCodeSearchControl.setValue('');
          }
        }
      });

    // Rejection code search filter
    this.rejectionCodeSearchControl.valueChanges
      .pipe(
        startWith(''),
        map(search => search?.toLowerCase() || ''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const filtered = this.rejectionCodes().filter(code =>
          code.code.toLowerCase().includes(searchTerm) ||
          (code.description && code.description.toLowerCase().includes(searchTerm))
        );
        this.filteredRejectionCodes.set(filtered);
      });

  }

  /**
   * Get form controls
   */
  get f() {
    return this.filterForm.controls;
  }




  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    this.displayUnitId.set(event.data.manualUnitId);
    this.storedCodeScheme.set(event.data.codeScheme);
    this.storedParsedUnitId.set(event.data.parsedUnitId);

    this.service.validateUnit({ unitId: event.data.parsedUnitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && (response.item || response.data)) {
            const validationData = (response.item || response.data) as UnitValidationResponse;
            this.unitCollDate.set(validationData.collDate);
            this.loadProductCodesForUnit();
            event.confirm();
          } else {
            event.reject(response.message ?? 'Unit validation failed');
            this.resetUnitState();
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.error?.errorResponse?.error || 'Failed to validate unit';
          event.reject(errorMessage);
          this.resetUnitState();
        }
      });
  }

  onUnitValidated(_data: SharedUnitValidationResponse): void {}

  onUnitCleared(): void {
    this.resetUnitState();
  }

  private resetUnitState(): void {
    this.displayUnitId.set('');
    this.storedCodeScheme.set('I');
    this.storedParsedUnitId.set('');
    this.unitCollDate.set('');
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.filterForm.patchValue({ productCode: '', rejectionCode: '' });
    this.isProductTruncated = false;
    this.isRejectionTruncated = false;
  }

  /**
   * Check if product dropdown text is truncated
   */
  checkProductTruncation(el: HTMLElement): void {
    this.isProductTruncated = el.scrollWidth > el.clientWidth;
  }

  /**
   * Check if rejection dropdown text is truncated
   */
  checkRejectionTruncation(el: HTMLElement): void {
    this.isRejectionTruncated = el.scrollWidth > el.clientWidth;
  }

  /**
   * Handle dropdown opened event (clear search on open)
   */
  onDropdownOpened(isOpen: boolean): void {
    if (isOpen) {
      this.productCodeSearchControl.setValue('');
      this.rejectionCodeSearchControl.setValue('');
    }
  }

  /**
   * Handle rejection code selection
   */
  onRejectionCodeSelected(event: MatSelectChange): void {
    // No auto-submit - user must click REJECT button
  }

  /**
   * Check if REJECT button should be enabled
   */
  isRejectEnabled(): boolean {
    const hasValidUnit = this.unitIdField?.isValid ?? false;
    const hasProductCode = !!this.f['productCode'].value;
    const hasRejectionCode = !!this.f['rejectionCode'].value;
    return hasValidUnit && hasProductCode && hasRejectionCode && !this.isRejecting();
  }

  /**
   * Check if CLEAR button should be enabled
   */
  isClearEnabled(): boolean {
    const hasUnitValue = !!(this.unitIdField?.unitIdControl.value?.trim());
    const hasProductCode = !!this.f['productCode'].value;
    const hasRejectionCode = !!this.f['rejectionCode'].value;
    return hasUnitValue || hasProductCode || hasRejectionCode;
  }

  /**
   * Handle REJECT button click
   */
  onRejectClick(): void {
    if (!this.isRejectEnabled()) {
      return;
    }
    this.rejectProduct();
  }

  /**
   * Handle CLEAR button click
   */
  onClearClick(): void {
    if (!this.isClearEnabled()) {
      return;
    }
    this.clearAllFields();
  }

  /**
   * Clear all fields in the form
   */
  private clearAllFields(): void {
    // Clear the unit ID field using the shared component's clear method
    this.unitIdField?.clear();

    // Reset form state
    this.resetUnitState();
  }

  /**
   * Reject product and add to table
   */
  private rejectProduct(): void {
    const productCode = this.f['productCode'].value;
    const rejectionCode = this.f['rejectionCode'].value;

    const request: RejectInventoryRequest = {
      unitId: this.storedParsedUnitId(),
      productCode: productCode,
      rejectCode: rejectionCode,
      codeScheme: this.storedCodeScheme()
    };

    this.isRejecting.set(true);
    this.service.rejectInventoryProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && (response.item || response.data)) {
            const rejectedItem = response.item || response.data;
            this.showSuccess(response.message || 'Product rejected successfully');

            const currentData = this.inventoryData();
            const newData = [this.mapToRejectedInventoryItem(rejectedItem), ...currentData];
            this.inventoryData.set(newData);
            this.totalRecords.set(newData.length);

            this.unitIdField?.clear();
            this.resetUnitState();
          } else {
            this.showError(response.message || 'Failed to reject product');
          }
          this.isRejecting.set(false);
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Failed to reject product';
          this.showError(errorMessage);
          this.isRejecting.set(false);
        }
      });
  }

  /**
   * Map API response to RejectedInventoryItem
   */
  private mapToRejectedInventoryItem(item: any): RejectedInventoryItem {
    return {
      unitId: this.displayUnitId() || item.unitId || '',
      productCode: item.productCode || '',
      rejectionCode: item.rejectCode || item.rejectionCode || '',
      rejectionReason: this.rejectionCodes().find(r => r.code === (item.rejectCode || item.rejectionCode))?.description || '',
      collDate: item.collDate || '',
      bloodType: item.bloodType || '',
      aboRh: item.aboDesc || item.aboRh || item.bloodType || '',
      expirationDate: item.expirationDate || item.expDate || '',
      location: item.locationId || item.location || '',
      locationId: item.locationId || ''
    };
  }

  /**
   * Show error message in snackbar (top right corner)
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Show success message in snackbar (top right corner)
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
