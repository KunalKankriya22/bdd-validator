import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, startWith, map } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

import { ProductCurrentStatusService } from './product-current-status.service';
import {
  ProductCurrentStatusSummaryDto,
  ActiveProductDto,
  ShippedProductDto,
  DiscardedProductDto,
  UnitAntigenDto,
  UnitAttributeDto,
  ProductCodeLovDto,
  MergedAttributeAntigenRow,
} from './product-current-status.model';

@Component({
  selector: 'app-product-current-status',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    LoadingSpinnerComponent,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
  ],
  templateUrl: './product-current-status.html',
  styleUrls: ['./product-current-status.scss'],
})
export class ProductCurrentStatusComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `product-current-status-${ProductCurrentStatusComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly productStatusService = inject(ProductCurrentStatusService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  searchForm = new FormGroup({
    productCode: new FormControl<string>('', [Validators.required]),
  });

  // Product code search control for dropdown filter
  productCodeSearchCtrl = new FormControl('');

  // UI state
  loading = signal(false);
  error = signal<string | null>(null);
  summaryData = signal<ProductCurrentStatusSummaryDto | null>(null);
  unitValidated = signal(false);
  parsedUnitId = signal<string | null>(null);
  codeScheme = signal<'I' | 'C'>('I');

  // Product code LOV
  productCodes = signal<ProductCodeLovDto[]>([]);
  filteredProductCodes = signal<ProductCodeLovDto[]>([]);
  isLoadingProductCodes = signal(false);
  selectedProductCode = signal<string>('');

  // Computed values
  currentProduct = computed<ActiveProductDto | ShippedProductDto | null>(() => {
    const summary = this.summaryData();
    if (!summary) return null;
    if (summary.activeProducts.length > 0) return summary.activeProducts[0];
    if (summary.shippedProducts.length > 0) return summary.shippedProducts[0];
    return null;
  });

  isShipped = computed(() => {
    const summary = this.summaryData();
    if (!summary) return false;
    return summary.shippedProducts.length > 0 && summary.activeProducts.length === 0;
  });

  isDiscarded = computed(() => {
    const summary = this.summaryData();
    if (!summary) return false;
    return (
      summary.discardedProducts.length > 0 &&
      summary.activeProducts.length === 0 &&
      summary.shippedProducts.length === 0
    );
  });

  unitAntigens = computed<UnitAntigenDto[]>(() => {
    const summary = this.summaryData();
    return summary?.unitAntigens ?? [];
  });

  unitAttributes = computed<UnitAttributeDto[]>(() => {
    const summary = this.summaryData();
    return summary?.unitAttributes ?? [];
  });

  mergedTableRows = computed<MergedAttributeAntigenRow[]>(() => {
    const attributes = this.unitAttributes();
    const antigens = this.unitAntigens();
    const maxLen = Math.max(attributes.length, antigens.length);
    const rows: MergedAttributeAntigenRow[] = [];
    for (let i = 0; i < maxLen; i++) {
      const attr = attributes[i];
      const ag = antigens[i];
      rows.push({
        attribute: attr ? `${attr.attribGroup} - ${attr.attribCode}` : '-',
        antigen: ag ? `${ag.testId} - ${ag.testResult ?? ''}`.replace(/ - $/, '') : '-',
        agConfirmed: ag ? (ag.confirmFlag === 'Y' ? 'Yes' : ag.confirmFlag === 'N' ? 'No' : '-') : '-',
      });
    }
    return rows;
  });

  hasResults = computed(() => {
    const summary = this.summaryData();
    if (!summary) return false;
    return (
      summary.activeProducts.length > 0 ||
      summary.shippedProducts.length > 0 ||
      summary.discardedProducts.length > 0
    );
  });

  selectedProductDisplay = computed(() => {
    const value = this.selectedProductCode();
    if (!value) return '';
    const product = this.productCodes().find(p => p.productCode === value);
    if (!product) return value;
    return product.productShortName
      ? `${product.productCode} - ${product.productShortName}`
      : product.productCode;
  });

  // Merged attribute + antigen table config
  antigenTableConfig: DataTableConfig<MergedAttributeAntigenRow> = {
    columns: [
      {
        key: 'attribute',
        header: 'Attribute',
        type: 'text',
      },
      {
        key: 'antigen',
        header: 'Antigen',
        type: 'text',
      },
      {
        key: 'agConfirmed',
        header: 'Ag Confirmed',
        type: 'text',
      },
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No attribute or antigen data available',
  };

  private destroy$ = new Subject<void>();

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
          subtitle: pageData.subtitle || 'Review information about a specific product.',
        };
      }
    });
  }

  ngOnInit(): void {
    this.productCodeSearchCtrl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProductCodes.set(this.filterProductCodes(search));
      });

    this.searchForm.get('productCode')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.selectedProductCode.set(value ?? '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Unit ID post-validate: load product codes LOV
  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    this.codeScheme.set(event.data.codeScheme);

    this.isLoadingProductCodes.set(true);
    this.productStatusService
      .getProductCodeLov(unitId, this.codeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodes.set(codes);
          this.filteredProductCodes.set(codes);
          this.isLoadingProductCodes.set(false);

          if (codes.length === 0) {
            event.reject('No products found for this Unit ID.');
            return;
          }

          event.confirm();
          this.unitValidated.set(true);
          this.parsedUnitId.set(unitId);

          // Auto-select if only one product code
          if (codes.length === 1) {
            this.searchForm.get('productCode')?.setValue(codes[0].productCode);
          }
        },
        error: (err) => {
          this.isLoadingProductCodes.set(false);
          const msg = err?.error?.message || 'Failed to load product codes.';
          event.reject(msg);
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {
    // Unit validated and product codes loaded via postValidate
  }

  onUnitCleared(): void {
    this.resetDependentFields();
  }

  // Retrieve product status summary
  onRetrieve(): void {
    const unitId = this.parsedUnitId();
    const productCode = this.searchForm.get('productCode')?.value?.toUpperCase() ?? '';

    if (!unitId || !productCode) {
      this.showError('Unit ID and Product Code are required.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.productStatusService
      .getSummary({ unitId, productCode, codeScheme: this.codeScheme() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.summaryData.set(data);
          this.loading.set(false);

          if (!this.hasResults()) {
            this.showInfo('No products found for the specified criteria.');
          }
        },
        error: (err) => {
          this.loading.set(false);
          const errorMessage = err?.error?.message || err?.message || 'Failed to retrieve product status.';
          this.error.set(errorMessage);
          this.showError(errorMessage);
        },
      });
  }

  onClearAll(): void {
    this.unitIdField?.clear();
    this.searchForm.reset();
    this.resetDependentFields();
  }

  private resetDependentFields(): void {
    this.summaryData.set(null);
    this.error.set(null);
    this.unitValidated.set(false);
    this.parsedUnitId.set(null);
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.searchForm.get('productCode')?.setValue('');
  }

  private filterProductCodes(search: string | null): ProductCodeLovDto[] {
    const all = this.productCodes();
    if (!search) return all;
    const lower = search.toLowerCase();
    return all.filter(
      (pc) =>
        pc.productCode.toLowerCase().includes(lower) ||
        pc.productShortName?.toLowerCase().includes(lower)
    );
  }

  get f() {
    return this.searchForm.controls;
  }

  getActiveProduct(): ActiveProductDto | null {
    const summary = this.summaryData();
    if (!summary || summary.activeProducts.length === 0) return null;
    return summary.activeProducts[0];
  }

  getShippedProduct(): ShippedProductDto | null {
    const summary = this.summaryData();
    if (!summary || summary.shippedProducts.length === 0) return null;
    return summary.shippedProducts[0];
  }

  getDiscardedProduct(): DiscardedProductDto | null {
    const summary = this.summaryData();
    if (!summary || summary.discardedProducts.length === 0) return null;
    return summary.discardedProducts[0];
  }

  formatDate(value: string | undefined | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatDateTime(value: string | undefined | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year}  ${hours}:${minutes}`;
  }

  displayValue(value: any): string {
    return value ?? '-';
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 6000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
