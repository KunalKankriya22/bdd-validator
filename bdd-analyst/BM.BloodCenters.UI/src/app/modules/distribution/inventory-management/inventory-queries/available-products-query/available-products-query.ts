import { Component, OnDestroy, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTES } from '@core/constants/route.constants';
import {
  AvailableProduct,
  AvailableProductsQueryRequest,
  AvailableProductsQueryService,
  LookupItem,
  ProductAntigen,
} from './services/available-products-query.service';

const VALIDATION_ERROR_MAP: Record<string, string> = {
  '0350': 'warehouseId',
  '5307': 'inventoryClass',
  '0322': 'productType',
  '0309': 'productCode',
  '0300': 'bloodType',
  '0301': 'attributeGroup',
  '0305': 'attributeCode',
};

const VALIDATION_ERROR_MESSAGES: Record<string, string> = {
  '0350': 'Invalid warehouse ID (error 0350)',
  '5307': 'Invalid inventory class (error 5307)',
  '0322': 'Invalid product type (error 0322)',
  '0309': 'Invalid product code (error 0309)',
  '0300': 'Invalid blood type (error 0300)',
  '0301': 'Invalid attribute group (error 0301)',
  '0305': 'Invalid attribute code (error 0305)',
};

@Component({
  selector: 'app-available-products-query',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './available-products-query.html',
  styleUrl: './available-products-query.scss',
})
export class AvailableProductsQuery implements OnInit, OnDestroy {
  filterForm: FormGroup;

  // Page header configuration (dynamic from menu)
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  // Inject services
  private menuService = inject(MenuService);

  // Dropdown options signals
  warehouseOptions = signal<LookupItem[]>([]);
  inventoryClassOptions = signal<LookupItem[]>([]);
  productTypeOptions = signal<LookupItem[]>([]);
  productCodeOptions = signal<LookupItem[]>([]);
  bloodTypeOptions = signal<LookupItem[]>([]);
  attributeGroupOptions = signal<LookupItem[]>([]);
  attributeCodeOptions = signal<LookupItem[]>([]);

  // Loading states
  isLoadingLookups = false;
  isLoadingProductCodes = false;
  isLoadingAttributeCodes = false;

  // Search controls for dropdowns
  warehouseSearchCtrl = new FormControl('');
  inventoryClassSearchCtrl = new FormControl('');
  productTypeSearchCtrl = new FormControl('');
  productCodeSearchCtrl = new FormControl('');
  bloodTypeSearchCtrl = new FormControl('');
  attributeGroupSearchCtrl = new FormControl('');
  attributeCodeSearchCtrl = new FormControl('');

  // Search text signals
  warehouseSearch = signal('');
  inventoryClassSearch = signal('');
  productTypeSearch = signal('');
  productCodeSearch = signal('');
  bloodTypeSearch = signal('');
  attributeGroupSearch = signal('');
  attributeCodeSearch = signal('');

  // Filtered options
  filteredWarehouses = computed(() => this.filterOptions(this.warehouseOptions(), this.warehouseSearch()));
  filteredInventoryClasses = computed(() => this.filterOptions(this.inventoryClassOptions(), this.inventoryClassSearch()));
  filteredProductTypes = computed(() => this.filterOptions(this.productTypeOptions(), this.productTypeSearch()));
  filteredProductCodes = computed(() => this.filterOptions(this.productCodeOptions(), this.productCodeSearch()));
  filteredBloodTypes = computed(() => this.filterOptions(this.bloodTypeOptions(), this.bloodTypeSearch()));
  filteredAttributeGroups = computed(() => this.filterOptions(this.attributeGroupOptions(), this.attributeGroupSearch()));
  filteredAttributeCodes = computed(() => this.filterOptions(this.attributeCodeOptions(), this.attributeCodeSearch()));

  // Results
  products: AvailableProduct[] = [];
  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  isLoading = false;
  hasSearched = false;
  sortDirection = 'A';
  currentSortColumn = '';
  currentSortDirection: SortDirection = '';

  // Selected product detail
  selectedProduct: AvailableProduct | null = null;
  antigens: ProductAntigen[] = [];
  isLoadingAntigens = false;

  displayedColumns: string[] = [
    'unitId',
    'productCode',
    'bloodType',
    'expDate',
    'daysToExpiration',
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: AvailableProductsQueryService,
    private headerService: HeaderService,
  ) {
    this.filterForm = this.fb.group({
      warehouseId: ['', Validators.required],
      inventoryClass: ['', Validators.required],
      productType: ['', Validators.required],
      productCode: [''],
      bloodType: [''],
      attributeGroup: [''],
      attributeCode: [''],
    });

    // Setup search control subscriptions
    this.warehouseSearchCtrl.valueChanges.subscribe(v => this.warehouseSearch.set(v || ''));
    this.inventoryClassSearchCtrl.valueChanges.subscribe(v => this.inventoryClassSearch.set(v || ''));
    this.productTypeSearchCtrl.valueChanges.subscribe(v => this.productTypeSearch.set(v || ''));
    this.productCodeSearchCtrl.valueChanges.subscribe(v => this.productCodeSearch.set(v || ''));
    this.bloodTypeSearchCtrl.valueChanges.subscribe(v => this.bloodTypeSearch.set(v || ''));
    this.attributeGroupSearchCtrl.valueChanges.subscribe(v => this.attributeGroupSearch.set(v || ''));
    this.attributeCodeSearchCtrl.valueChanges.subscribe(v => this.attributeCodeSearch.set(v || ''));

    // Listen for Product Type changes to reload Product Codes
    this.filterForm.get('productType')?.valueChanges.subscribe((productType) => {
      this.filterForm.patchValue({ productCode: '' });
      this.productCodeOptions.set([]);
      this.productCodeSearchCtrl.setValue('');

      if (productType) {
        this.loadProductCodes(productType);
      }
    });

    // Listen for Attribute Group changes to reload Attribute Codes
    this.filterForm.get('attributeGroup')?.valueChanges.subscribe((attributeGroup) => {
      this.filterForm.patchValue({ attributeCode: '' });
      this.attributeCodeOptions.set([]);
      this.attributeCodeSearchCtrl.setValue('');

      if (attributeGroup) {
        this.loadAttributeCodes(attributeGroup);
      }
    });

    // Dynamic header from menu items
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.AvailableProductsQuery].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);
        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadLookups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private filterOptions(options: LookupItem[], search: string): LookupItem[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.code?.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q)
    );
  }

  private loadLookups(): void {
    this.isLoadingLookups = true;

    this.service.getLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingLookups = false;
          if (response.success && response.item) {
            const data = response.item;
            this.warehouseOptions.set(data.warehouses ?? []);
            this.inventoryClassOptions.set(data.inventoryClasses ?? []);
            this.productTypeOptions.set(data.productTypes ?? []);
            // Product codes are loaded separately when product type is selected
            this.bloodTypeOptions.set(data.bloodTypes ?? []);
            this.attributeGroupOptions.set(data.attributeGroups ?? []);
            // Attribute codes are loaded separately when attribute group is selected
          }
        },
        error: () => {
          this.isLoadingLookups = false;
        },
      });
  }

  private loadProductCodes(productType: string): void {
    this.isLoadingProductCodes = true;
    this.service.getProductCodes(productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingProductCodes = false;
          if (response.success) {
            this.productCodeOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingProductCodes = false;
        },
      });
  }

  private loadAttributeCodes(attributeGroup: string): void {
    this.isLoadingAttributeCodes = true;
    this.service.getAttributeCodes(attributeGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingAttributeCodes = false;
          if (response.success) {
            this.attributeCodeOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingAttributeCodes = false;
        },
      });
  }

  onSearch(): void {
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid) {
      this.focusFirstInvalidField();
      return;
    }
    this.pageIndex = 0;
    this.executeQuery();
  }

  private focusFirstInvalidField(): void {
    const firstInvalidKey = Object.keys(this.filterForm.controls)
      .find(key => this.filterForm.controls[key].invalid);
    if (!firstInvalidKey) return;
    // HTML lowercases attribute names; use lowercase selector to match rendered DOM.
    // mat-select renders a focusable trigger button — prefer that over the host element.
    const host = document.querySelector(`[formcontrolname="${firstInvalidKey}"]`);
    const focusTarget = (host?.querySelector('.mat-mdc-select-trigger') ?? host) as HTMLElement | null;
    if (focusTarget) setTimeout(() => focusTarget.focus(), 100);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.executeQuery();
  }

  onRowSelect(product: AvailableProduct): void {
    this.selectedProduct = product;
    this.loadAntigens(product.unitId);
  }

  onClear(): void {
    this.filterForm.reset({
      warehouseId: '',
      inventoryClass: '',
      productType: '',
      productCode: '',
      bloodType: '',
      attributeGroup: '',
      attributeCode: '',
    });
    this.products = [];
    this.totalRecords = 0;
    this.pageIndex = 0;
    this.hasSearched = false;
    this.selectedProduct = null;
    this.antigens = [];
    this.attributeCodeOptions.set([]);
  }

  isSelected(product: AvailableProduct): boolean {
    return this.selectedProduct?.unitId === product.unitId;
  }

  hasAnyFieldValue(): boolean {
    const values = this.filterForm.value;
    return !!(
      values.warehouseId ||
      values.inventoryClass ||
      values.productType ||
      values.productCode ||
      values.bloodType ||
      values.attributeGroup ||
      values.attributeCode
    );
  }

  onSortChange(sort: Sort): void {
    this.currentSortColumn = sort.active;
    this.currentSortDirection = sort.direction;
    this.sortDirection = sort.direction === 'desc' ? 'D' : 'A';
    this.pageIndex = 0;
    this.executeQuery();
  }

  getSortIcon(column: string): string {
    if (this.currentSortColumn !== column || !this.currentSortDirection) {
      return 'unfold_more';
    }
    return this.currentSortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward';
  }

  getFieldError(fieldName: string): string | null {
    const control = this.filterForm.get(fieldName);
    if (!control) return null;
    if (control.invalid && control.touched) {
      if (control.hasError('required')) return 'This field is required';
      if (control.hasError('serverError')) return control.getError('serverError') as string;
    }
    return null;
  }

  private clearServerErrors(): void {
    Object.keys(this.filterForm.controls).forEach(key => {
      const control = this.filterForm.get(key);
      if (control?.hasError('serverError')) {
        control.setErrors(null);
      }
    });
  }

  private executeQuery(): void {
    this.clearServerErrors();

    const v = this.filterForm.value as Record<string, string>;
    const request: AvailableProductsQueryRequest = {
      chapterId: this.headerService.getCurrentChapterId(),
      warehouseId: v['warehouseId'],
      inventoryClass: v['inventoryClass'],
      productType: v['productType'],
      sortDirection: this.sortDirection,
    };
    if (v['productCode']) request.productCode = v['productCode'];
    if (v['bloodType']) request.bloodType = v['bloodType'];
    if (v['attributeGroup']) request.attributeGroup = v['attributeGroup'];
    if (v['attributeCode']) request.attributeCode = v['attributeCode'];

    this.isLoading = true;
    this.hasSearched = true;
    this.selectedProduct = null;
    this.antigens = [];

    const skip = this.pageIndex * this.pageSize;

    this.service
      .queryProducts(request, this.pageSize, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.products = response.data ?? [];
            this.totalRecords = response.total ?? 0;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.applyServerValidationErrors(error);
        },
      });
  }

  private applyServerValidationErrors(error: {
    error?: { errors?: Array<{ errorCode: string }> };
  }): void {
    const errors = error?.error?.errors;
    if (!Array.isArray(errors)) return;
    errors.forEach((err) => {
      const fieldName = VALIDATION_ERROR_MAP[err.errorCode];
      if (!fieldName) return;
      const control = this.filterForm.get(fieldName);
      if (control) {
        control.setErrors({
          serverError: VALIDATION_ERROR_MESSAGES[err.errorCode] ?? 'Invalid value',
        });
        control.markAsTouched();
      }
    });
  }

  private loadAntigens(unitId: string): void {
    this.isLoadingAntigens = true;
    this.antigens = [];

    this.service
      .getProductAntigens(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingAntigens = false;
          if (response.success) {
            this.antigens = response.data ?? [];
          }
        },
        error: () => {
          this.isLoadingAntigens = false;
        },
      });
  }


}
