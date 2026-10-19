import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SpecialOrderAllocationService } from '../services/special-order-allocation.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatchingProductsStateService } from '../services/matching-products-state.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import {
  MatchingProductsDialogData,
  MatchingProductRow,
  MatchingCriteria,
  MatchingProductsQueryApiDto,
  AllocateUnitsRequestApiDto,
  OrderItemAntigenDto,
  OrderItemAttributeDto,
  AntigenAttributeRow,
  UnitAntigenAttributeDto
} from '../models/special-order-allocation.model';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-matching-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    DataTable,
    PageHeaderWithBreadcrumb,
    LoadingSpinnerComponent
  ],
  templateUrl: './matching-products.html',
  styleUrl: './matching-products.scss'
})
export class MatchingProducts implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `matching-products-${MatchingProducts.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly router = inject(Router);
  private readonly stateService = inject(MatchingProductsStateService);
  private readonly service = inject(SpecialOrderAllocationService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);

  private destroy$ = new Subject<void>();

  protected data!: MatchingProductsDialogData;

  protected readonly matchingProducts = signal<MatchingProductRow[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly allocating = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  private antigens: OrderItemAntigenDto[] = [];
  private attributes: OrderItemAttributeDto[] = [];

  protected readonly criteria = signal<MatchingCriteria>({
    abo: false,
    product: false,
    source: false,
    ignoreClass: false
  });

  protected readonly selectedProducts = signal<MatchingProductRow[]>([]);
  protected readonly selectedProduct = signal<MatchingProductRow | null>(null);
  protected readonly antigenAttributeRows = signal<AntigenAttributeRow[]>([]);
  protected readonly detailLoading = signal<boolean>(false);
  protected readonly hasSelection = computed(() => this.selectedProducts().length > 0);

  inventoryTableConfig: DataTableConfig<MatchingProductRow> = {
    columns: [
      { key: 'unitId', header: 'Unit ID' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'aboRh', header: 'ABORh' },
      { key: 'expirationDate', header: 'Expiration Date' },
      { key: 'warehouse', header: 'W' }
    ],
    enableSelection: true,
    selectionKey: 'unitId',
    stickyHeader: true,
    showTableOnEmpty: true,
    emptyMessage: 'No matching products found',
    noDataIcon: 'inventory_2'
  };

  antigenAttributeTableConfig: DataTableConfig<AntigenAttributeRow> = {
    columns: [
      { key: 'antigen', header: 'Antigen' },
      { key: 'result', header: 'Result' },
      { key: 'confirmed', header: 'Confirmed' },
      { key: 'attributesGroup', header: 'Attributes Group' },
      { key: 'attributesCode', header: 'Attributes Code' }
    ],
    stickyHeader: true,
    showTableOnEmpty: true
  };

  pageHeaderConfig!: PageHeaderConfig;

  ngOnInit(): void {
    const inputData = this.stateService.restoreInputData();
    if (!inputData) {
      this.router.navigate([ROUTE_REGISTRY[RouteKey.SpecialOrderAllocation].path]);
      return;
    }
    this.data = inputData;
    this.initPageHeaderConfig();
    this.subscribeToChapterChanges();
    this.loadAntigenAndAttributeDataThenProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initPageHeaderConfig(): void {
    const subtitle = `Item: ${this.data.itemNo}  |  Product: ${this.data.productDescription}  |  ABORh: ${this.data.aboRh}  |  Need: ${this.data.need}  |  Found: ${this.data.found || this.matchingProducts().length}  |  Allocat: ${this.data.allocat}`;
    this.pageHeaderConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Special Order Allocation', link: ROUTE_REGISTRY[RouteKey.SpecialOrderAllocation].path },
        { label: 'Matching Products Found', link: '' }
      ],
      title: 'Matching Products Found',
      subtitle,
      showBackButton: true,
      onBackClick: () => this.navigateBack()
    };
  }

  private loadAntigenAndAttributeDataThenProducts(): void {
    this.loading.set(true);
    forkJoin({
      antigens: this.service.getOrderItemAntigens(this.data.orderNo, this.data.itemNo),
      attributes: this.service.getOrderItemAttributes(this.data.orderNo, this.data.itemNo)
    }).subscribe({
      next: (result) => {
        this.antigens = result.antigens;
        this.attributes = result.attributes;
        this.data.antCount = this.antigens.length;
        this.data.attCount = this.attributes.length;
        this.loadMatchingProducts();
      },
      error: () => {
        this.loadMatchingProducts();
      }
    });
  }

  private loadMatchingProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedProducts.set([]);

    const crit = this.criteria();
    const query: MatchingProductsQueryApiDto = {
      orderNo: this.data.orderNo,
      itemNo: this.data.itemNo,
      productCode: crit.product ? this.data.productCode : null,
      productType: this.data.productType,
      bloodType: this.data.bloodType,
      orderType: this.data.orderType,
      subProduct: crit.product,
      subAbo: crit.abo,
      source: crit.source,
      ignoreClass: crit.ignoreClass,
      attCount: this.data.attCount,
      antCount: this.data.antCount
    };

    this.service.getMatchingProducts(query)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const rows: MatchingProductRow[] = response.data.map(p => {
              const aboStr = p.abo || '';
              const rhStr = p.rh || '';
              return {
                selected: false,
                unitId: p.unitId,
                productCode: p.productCode,
                aboRh: `${aboStr} ${rhStr}`.trim() || '--',
                expirationDate: p.expirationDate || '--',
                warehouse: p.warehouse || '',
                collectionDate: p.collectionDate || '',
                abo: p.abo,
                rh: p.rh
              };
            });
            this.matchingProducts.set(rows);
          } else {
            this.matchingProducts.set([]);
          }
          this.loading.set(false);
          this.initPageHeaderConfig();

          const currentProducts = this.matchingProducts();
          if (currentProducts.length > 0) {
            this.onRowClick(currentProducts[0]);
          }

          if (currentProducts.length === 0) {
            this.showOutOfStockDialog();
          }
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load matching products');
          this.loading.set(false);
        }
      });
  }

  onCriteriaChange(criterion: keyof MatchingCriteria, checked: boolean): void {
    const current = this.criteria();
    this.criteria.set({ ...current, [criterion]: checked });
    this.loadMatchingProducts();
  }

  onSelectionChange(selected: MatchingProductRow[]): void {
    this.selectedProducts.set(selected);
  }

  onRowClick(product: MatchingProductRow): void {
    this.selectedProduct.set(product);
    this.detailLoading.set(true);
    this.antigenAttributeRows.set([]);

    this.service.getUnitAntigensAndAttributes(
      product.unitId,
      product.collectionDate,
      product.productCode
    ).subscribe({
      next: (data) => {
        const rows = this.zipAntigenAttributeRows(data);
        this.antigenAttributeRows.set(rows);
        this.detailLoading.set(false);
      },
      error: () => {
        this.antigenAttributeRows.set([]);
        this.detailLoading.set(false);
      }
    });
  }

  private zipAntigenAttributeRows(data: UnitAntigenAttributeDto): AntigenAttributeRow[] {
    const antigens = data.antigens || [];
    const attributes = data.attributes || [];
    const maxLen = Math.max(antigens.length, attributes.length);
    const rows: AntigenAttributeRow[] = [];

    for (let i = 0; i < maxLen; i++) {
      rows.push({
        antigen: i < antigens.length ? (antigens[i].testId || '--') : '--',
        result: i < antigens.length ? (antigens[i].testResult || '--') : '--',
        confirmed: i < antigens.length ? (antigens[i].confirmStatus || '--') : '--',
        attributesGroup: i < attributes.length ? (attributes[i].attribGroup || '--') : '--',
        attributesCode: i < attributes.length ? (attributes[i].attribCode || '--') : '--'
      });
    }

    return rows;
  }

  onAllocate(): void {
    const selectedUnits = this.selectedProducts();
    if (selectedUnits.length === 0) return;

    this.allocating.set(true);
    this.error.set(null);

    const request: AllocateUnitsRequestApiDto = {
      orderNo: this.data.orderNo,
      itemNo: this.data.itemNo,
      pickSlipId: this.data.pickSlipId || null,
      customerId: this.data.customerId,
      productType: this.data.productType,
      bloodType: this.data.bloodType,
      tier: this.data.tier,
      unitPrice: this.data.unitPrice,
      unitIds: selectedUnits.map(u => u.unitId),
      source: this.criteria().source
    };

    this.service.allocateUnits(request)
      .subscribe({
        next: (response) => {
          this.allocating.set(false);
          if (response.success) {
            const count = selectedUnits.length;
            const responseData = (response as any).item || response.data?.[0];
            const createdPickSlipId = responseData?.pickSlipId || null;

            if (responseData?.inventoryWarning?.belowMinimal) {
              const w = responseData.inventoryWarning;
              this.snackbarService.showInfo(
                `Warning: Inventory for ${w.productType} ${w.bloodType} is below minimal level (${w.available} available, ${w.minimal} minimal).`
              );
            }

            this.snackbarService.showSuccess(
              `${count} selected special order${count > 1 ? 's' : ''} has been allocated successfully.`
            );
            this.stateService.setResult({ allocated: true, count, pickSlipId: createdPickSlipId });
            this.navigateBack();
          } else {
            this.error.set(response.message || 'Allocation failed');
          }
        },
        error: (err) => {
          this.allocating.set(false);
          this.error.set(err.message || 'Failed to allocate units');
        }
      });
  }

  private showOutOfStockDialog(): void {
    const outOfStockDialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: {
        title: 'Item Out of Stock',
        message: "We couldn't find available products to fulfill this item. Would you like to place it on Back Order?",
        confirmText: 'YES, PLACE BACK ORDER',
        cancelText: 'NO, CANCEL'
      }
    });

    outOfStockDialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.service.placeBackOrder(this.data.orderNo, this.data.itemNo)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.snackbarService.showSuccess('Back order placed successfully.');
              } else {
                this.snackbarService.showError(response.message || 'Failed to place back order.');
              }
              this.stateService.setResult({ allocated: false, backOrdered: true });
              this.navigateBack();
            },
            error: () => {
              this.snackbarService.showError('Failed to place back order.');
              this.stateService.setResult({ allocated: false, backOrdered: false });
              this.navigateBack();
            }
          });
      }
    });
  }

  onCancel(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    this.router.navigate([ROUTE_REGISTRY[RouteKey.SpecialOrderAllocation].path]);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.stateService.clear();
        this.navigateBack();
      });
  }
}
