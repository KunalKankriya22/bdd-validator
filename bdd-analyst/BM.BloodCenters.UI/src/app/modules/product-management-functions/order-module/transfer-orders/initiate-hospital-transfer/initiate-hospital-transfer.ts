import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, of, takeUntil, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConnectionPositionPair, OverlayModule } from '@angular/cdk/overlay';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { InitiateHospitalTransferApiService } from './services/initiate-hospital-transfer-api.service';
import {
  OrderSearchResultDto,
  OrderHeaderDto,
  OrderItemDto,
} from './models/initiate-hospital-transfer.model';
import { ViewAttributeAntigenDialogComponent } from './dialogs/view-attribute-antigen-dialog/view-attribute-antigen-dialog';
import { ProductsAvailableDialogComponent } from './dialogs/products-available-dialog/products-available-dialog';
import { SelectOrderDialogComponent } from './dialogs/select-order-dialog/select-order-dialog';
import { InitiateHospitalTransferFilterPanel, FilterOptions, FilterValues } from './initiate-hospital-transfer-filter-panel';

@Component({
  selector: 'app-initiate-hospital-transfer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    SearchBar,
    InitiateHospitalTransferFilterPanel,
  ],
  templateUrl: './initiate-hospital-transfer.html',
  styleUrl: './initiate-hospital-transfer.scss',
})
export class InitiateHospitalTransferComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(InitiateHospitalTransferApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'Review information about a particular shipment that has been delivered.',
        };
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    orderNo: ['', Validators.required],
    shipmentAge: ['', [Validators.required, Validators.min(0), Validators.max(99)]],
  });

  allOrderOptions: OrderSearchResultDto[] = [];
  selectedOrderDisplay = signal<string>('');

  isLoading = false;
  hasSearched = false;
  orderData = signal<OrderHeaderDto | null>(null);

  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;

  selectedItems: OrderItemDto[] = [];
  sortedItems: OrderItemDto[] = [];
  productSearchText = '';
  productSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Product or Description',
    minLength: 2,
    ariaLabel: 'Search order items by product or description',
    searchOnEnterOnly: true,
  };
  filteredItems = signal<OrderItemDto[]>([]);

  tableConfig: DataTableConfig<OrderItemDto> = {
    columns: [],
    enableSelection: true,
    selectionPosition: 'first',
    selectionKey: 'itemNo',
    isRowSelectable: (row) => !this.isItemDone(row),
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No Order Items Available To Display',
    noDataIcon: 'edit',
    caption: 'Order items',
    rowLabelKey: 'product',
  };

  filterOpen = signal(false);
  filterOverlayPositions: ConnectionPositionPair[] = [
    new ConnectionPositionPair(
      { originX: 'start', originY: 'bottom' },
      { overlayX: 'start', overlayY: 'top' }
    ),
  ];
  filterAboRh = signal<string>('');
  filterRequiredQty = signal<string>('');
  filterAllocatedQty = signal<string>('');
  filterRemainingQty = signal<string>('');

  filterChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    const aboRh = this.filterAboRh();
    if (aboRh) chips.push({ key: 'aboRh', label: `ABORh: ${aboRh}`, value: aboRh });
    const reqQty = this.filterRequiredQty();
    if (reqQty) chips.push({ key: 'requiredQuantity', label: `Req Qty: ${reqQty}`, value: reqQty });
    const allocQty = this.filterAllocatedQty();
    if (allocQty) chips.push({ key: 'allocatedQuantity', label: `Alloc Qty: ${allocQty}`, value: allocQty });
    const remQty = this.filterRemainingQty();
    if (remQty) chips.push({ key: 'remainingQuantity', label: `Rem Qty: ${remQty}`, value: remQty });
    return chips;
  });

  filterOptions = computed<FilterOptions>(() => {
    const items = this.orderData()?.items ?? [];
    const unique = (arr: (string | number | null | undefined)[]) =>
      [...new Set(arr.filter(v => v != null).map(v => String(v)))].sort();
    return {
      aboRhOptions: unique(items.map(i => i.aboRh)),
      requiredQtyOptions: unique(items.map(i => i.requiredQuantity)),
      allocatedQtyOptions: unique(items.map(i => i.allocatedQuantity)),
      remainingQtyOptions: unique(items.map(i => i.remainingQuantity)),
    };
  });

  ngOnInit(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: [
        { key: 'itemNo', header: 'Item', sortable: true, width: '80px' },
        { key: 'product', header: 'Product', width: '120px' },
        { key: 'description', header: 'Description' },
        { key: 'aboRh', header: 'ABORh', width: '100px', valueFormatter: (v) => this.displayValue(v) },
        { key: 'requiredQuantity', header: 'Required Quantity', width: '150px', type: 'number' },
        { key: 'allocatedQuantity', header: 'Allocated Quantity', width: '150px', type: 'number' },
        { key: 'remainingQuantity', header: 'Remaining Quantity', width: '160px', type: 'number' },
        { key: 'substitution', header: 'Substitution', width: '120px', valueFormatter: (v) => this.displayValue(v) },
        { key: 'status', header: 'Status', width: '100px', cellTemplate: this.statusCellTemplate },
      ],
    };

    this.loadOrders();

    this.filterForm.get('orderNo')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        switchMap(orderNo => orderNo
          ? this.apiService.getOrderDetails(orderNo)
          : of(null),
        ),
      )
      .subscribe({
        next: (response) => {
          if (!response) return;
          const orderItem = response.item ?? (response.data && response.data.length > 0 ? response.data[0] : null);
          if (response.success && orderItem) {
            this.sortedItems = [];
            this.filteredItems.set([]);
            this.selectedItems = [];
            this.orderData.set({ ...orderItem, items: [] });
            if (orderItem.shipmentAge != null) {
              this.filterForm.patchValue(
                { shipmentAge: orderItem.shipmentAge },
                { emitEvent: false },
              );
            }
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load order details.'),
          );
        },
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadOrders();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetrieve(): void {
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const orderNo = this.filterForm.get('orderNo')?.value;
    if (!orderNo) return;

    this.isLoading = true;
    this.hasSearched = true;
    this.selectedItems = [];

    this.apiService.getOrderDetails(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          const orderItem = response.item ?? (response.data && response.data.length > 0 ? response.data[0] : null);
          if (response.success && orderItem) {
            this.orderData.set(orderItem);
            if (orderItem.shipmentAge != null) {
              this.filterForm.patchValue(
                { shipmentAge: orderItem.shipmentAge },
                { emitEvent: false },
              );
            }
            this.sortedItems = [...(orderItem.items || [])];
            this.filteredItems.set(this.sortedItems);
          } else {
            this.orderData.set(null);
            this.sortedItems = [];
            this.filteredItems.set([]);
            const msg = response.errorResponse?.error || response.message || 'Failed to retrieve order details.';
            this.snackbarService.showError(msg);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.orderData.set(null);
          this.sortedItems = [];
          this.filteredItems.set([]);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving order details.'),
          );
        },
      });
  }



  onClearAll(): void {
    this.filterForm.reset({ orderNo: '', shipmentAge: '' });
    this.selectedOrderDisplay.set('');
    this.orderData.set(null);
    this.selectedItems = [];
    this.sortedItems = [];
    this.filteredItems.set([]);
    this.productSearchText = '';
    this.hasSearched = false;
    this.clearFilters();
  }

  onSortChange(event: TableSortEvent): void {
    const data = [...(this.orderData()?.items ?? [])];
    if (event.direction === 'default') {
      this.sortedItems = data;
    } else {
      const isAsc = event.direction === 'A';
      this.sortedItems = data.sort((a, b) => {
        const valA = (a as unknown as Record<string, unknown>)[event.column];
        const valB = (b as unknown as Record<string, unknown>)[event.column];
        if (valA == null && valB == null) return 0;
        if (valA == null) return isAsc ? -1 : 1;
        if (valB == null) return isAsc ? 1 : -1;
        return (valA < valB ? -1 : valA > valB ? 1 : 0) * (isAsc ? 1 : -1);
      });
    }
    this.applyFilters();
  }

  onSelectionChange(selected: OrderItemDto[]): void {
    this.selectedItems = selected;
  }

  isItemDone(item: OrderItemDto): boolean {
    return item.remainingQuantity === 0;
  }

  displayValue(value: string | number | null | undefined): string {
    if (value == null || value === '') return '-';
    return String(value);
  }

  hasAnyFieldValue(): boolean {
    const values = this.filterForm.value;
    return !!(values.orderNo || values.shipmentAge);
  }

  toggleFilter(): void {
    this.filterOpen.update(v => !v);
  }

  closeFilter(): void {
    this.filterOpen.set(false);
  }

  onApplyFilters(filters: FilterValues): void {
    this.filterAboRh.set(filters.aboRh || '');
    this.filterRequiredQty.set(filters.requiredQuantity || '');
    this.filterAllocatedQty.set(filters.allocatedQuantity || '');
    this.filterRemainingQty.set(filters.remainingQuantity || '');
    this.applyFilters();
    this.filterOpen.set(false);
  }

  onClearFilters(): void {
    this.clearFilters();
    this.applyFilters();
    this.filterOpen.set(false);
  }

  onRemoveFilterChip(key: string): void {
    switch (key) {
      case 'aboRh': this.filterAboRh.set(''); break;
      case 'requiredQuantity': this.filterRequiredQty.set(''); break;
      case 'allocatedQuantity': this.filterAllocatedQty.set(''); break;
      case 'remainingQuantity': this.filterRemainingQty.set(''); break;
    }
    this.applyFilters();
  }

  onProductSearch(text: string): void {
    this.productSearchText = text;
    this.applyFilters();
  }

  onProductSearchCleared(): void {
    this.productSearchText = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.filterChips().length > 0;
  }

  onViewAttributeAntigen(): void {
    const data = this.orderData();
    const selected = this.selectedItems;
    if (!data || selected.length === 0) return;

    const item = selected[0];
    this.apiService.getAttributesAntigens(data.orderNo, item.itemNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const attrItem = response.item ?? (response.data && response.data.length > 0 ? response.data[0] : null);
          if (response.success && attrItem) {
            this.dialog.open(ViewAttributeAntigenDialogComponent, {
              position: { right: '0', top: '0' },
              width: '750px',
              panelClass: 'right-panel-dialog',
              disableClose: true,
              autoFocus: 'first-tabbable',
              data: {
                orderNo: data.orderNo,
                itemNo: attrItem.itemNo,
                productType: `${item.product} - ${item.description}`,
                attributes: (attrItem.attributes ?? []).map((a: any) => ({
                  group: a.group ?? a.attribGroup,
                  attributeCode: a.attributeCode ?? a.attribCode,
                  attributeDescription: a.attributeDescription ?? a.attribDesc,
                })),
                antigens: (attrItem.antigens ?? []).map((a: any) => ({
                  antigenCode: a.antigenCode ?? a.antigenId,
                  antigenDescription: a.antigenDescription ?? a.antigenDesc,
                })),
              },
            });
          } else {
            const msg = response.errorResponse?.error || response.message || 'No data found.';
            this.snackbarService.showError(msg);
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load attributes & antigens.'),
          );
        },
      });
  }

  onFindProducts(): void {
    const data = this.orderData();
    const selected = this.selectedItems;
    if (!data || selected.length === 0) return;

    const item = selected[0];
    const shipmentAge = Number(this.filterForm.get('shipmentAge')?.value) || 0;
    this.apiService.findProducts(data.orderNo, item.itemNo, shipmentAge)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const rawProducts: any[] = response.item?.products
            ?? (response.data && response.data.length > 0 ? (Array.isArray(response.data[0]) ? response.data[0] : response.data) : []);
          const formatDate = (d: string | null | undefined): string => {
            if (!d) return '';
            const dt = new Date(d);
            const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
            return `${String(dt.getDate()).padStart(2,'0')}-${months[dt.getMonth()]}-${dt.getFullYear()}`;
          };
          const products = rawProducts.map((p: any) => ({
            fromHospital: p.fromHospital ?? p.shippedTo ?? '',
            unitId: p.unitId ?? '',
            productCode: p.productCode ?? '',
            productType: p.productType ?? '',
            aboRh: p.aboRh ?? p.aboDesc ?? p.bloodType ?? '',
            expirationDate: formatDate(p.expirationDate ?? p.expDate),
            transferSlipSelected: p.transferSlipSelected ?? '',
            contactPerson: p.contactPerson ?? '',
            phoneNumber: p.phoneNo ?? p.phoneNumber ?? '',
          }));
          if (response.success && products.length > 0) {
            const firstProduct = rawProducts[0];
            const header = response.item ?? {
              itemNo: item.itemNo,
              productType: `${item.product} - ${item.description}`,
              quantityNeed: item.remainingQuantity,
              hospitalName: firstProduct.hospitalName ?? '',
              contactPerson: firstProduct.contactPerson ?? '',
              phoneNumber: firstProduct.phoneNo ?? '',
              quantityAvailable: products.length,
              products,
            };
            if (!header.products) {
              header.products = products;
            }
            this.dialog.open(ProductsAvailableDialogComponent, {
              position: { right: '0', top: '0' },
              width: '950px',
              panelClass: 'right-panel-dialog',
              disableClose: true,
              autoFocus: 'first-tabbable',
              data: {
                orderNo: data.orderNo,
                header,
              },
            });
          } else {
            const msg = response.errorResponse?.error || response.message || 'No products available.';
            this.snackbarService.showError(msg);
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to find products.'),
          );
        },
      });
  }

  private orderDialogOpen = false;

  openSelectOrderDialog(): void {
    if (this.orderDialogOpen) return;
    this.orderDialogOpen = true;

    const dialogRef = this.dialog.open(SelectOrderDialogComponent, {
      position: { right: '0', top: '0' },
      width: '750px',
      panelClass: 'right-panel-dialog',
      disableClose: true,
      autoFocus: 'first-tabbable',
      data: {
        orders: this.allOrderOptions,
        selectedOrderNo: this.filterForm.get('orderNo')?.value || '',
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedOrder: OrderSearchResultDto | null) => {
        this.orderDialogOpen = false;
        if (selectedOrder) {
          this.filterForm.patchValue(
            { orderNo: selectedOrder.orderNo },
            { emitEvent: false },
          );
          this.selectedOrderDisplay.set(
            `${selectedOrder.orderNo} - ${selectedOrder.consigneeName || ''}`,
          );
        }
      });
  }

  private loadOrders(): void {
    this.apiService.getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const orders: OrderSearchResultDto[] = Array.isArray(response.data)
              ? response.data.flat()
              : Array.isArray(response.item)
                ? response.item
                : [];
            this.allOrderOptions = orders;
          }
        },
        error: () => {
          this.allOrderOptions = [];
        },
      });
  }

  private applyFilters(): void {
    let items = [...this.sortedItems];
    const search = (this.productSearchText || '').toLowerCase();

    if (search) {
      items = items.filter(i =>
        i.product?.toLowerCase().includes(search) ||
        i.description?.toLowerCase().includes(search),
      );
    }

    const aboRh = this.filterAboRh();
    if (aboRh) {
      items = items.filter(i => i.aboRh === aboRh);
    }

    const reqQty = this.filterRequiredQty();
    if (reqQty) {
      items = items.filter(i => String(i.requiredQuantity) === reqQty);
    }

    const allocQty = this.filterAllocatedQty();
    if (allocQty) {
      items = items.filter(i => String(i.allocatedQuantity) === allocQty);
    }

    const remQty = this.filterRemainingQty();
    if (remQty) {
      items = items.filter(i => String(i.remainingQuantity) === remQty);
    }

    this.filteredItems.set(items);
  }

  private focusFirstInvalidField(): void {
    const firstInvalid = Object.keys(this.filterForm.controls)
      .find(key => this.filterForm.controls[key].invalid);
    if (firstInvalid) {
      const el = document.querySelector(`[formControlName="${firstInvalid}"]`) as HTMLElement;
      el?.focus();
    }
  }

  private clearFilters(): void {
    this.filterAboRh.set('');
    this.filterRequiredQty.set('');
    this.filterAllocatedQty.set('');
    this.filterRemainingQty.set('');
  }

}
