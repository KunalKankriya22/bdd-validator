import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { OrderHistorySingleOrderApiService } from './services/order-history-single-order-api.service';
import {
  OrderSearchResultDto,
  OrderHistoryDto,
  OrderItemDto,
  OrderNoteDto,
} from './models/order-history-single-order.model';

import { OrderedAttributesAntigensDialogComponent } from './dialogs/ordered-attributes-antigens-dialog/ordered-attributes-antigens-dialog';
import { ShippedProductsDialogComponent } from './dialogs/shipped-products-dialog/shipped-products-dialog';
import { ShippedAttributesAntigensDialogComponent } from './dialogs/shipped-attributes-antigens-dialog/shipped-attributes-antigens-dialog';

@Component({
  selector: 'app-order-history-single-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './order-history-single-order.html',
  styleUrl: './order-history-single-order.scss',
})
export class OrderHistorySingleOrderComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(OrderHistorySingleOrderApiService);
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
      const hasOrder = !!this.orderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'Track the complete fulfillment life cycle and audit trail for an individual order.',
          actions: [
            {
              label: 'ORDERED ATTRIBUTES/ANTIGENS',
              variant: 'outlined',
              matButton: 'stroked',
              ariaLabel: 'View ordered attributes and antigens',
              disabled: !hasOrder,
              onClick: () => this.openOrderedAttributesAntigens(),
            },
            {
              label: 'SHIPPED PRODUCTS',
              variant: 'outlined',
              matButton: 'stroked',
              ariaLabel: 'View shipped products',
              disabled: !hasOrder,
              onClick: () => this.openShippedProducts(),
            },
            {
              label: 'SHIPPED ATTRIBUTES/ANTIGENS',
              variant: 'outlined',
              matButton: 'stroked',
              ariaLabel: 'View shipped attributes and antigens',
              disabled: !hasOrder,
              onClick: () => this.openShippedAttributesAntigens(),
            },
          ],
        };
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    orderNo: [''],
    by: [''],
  });

  orderNoSearchCtrl = new FormControl('');

  orderNoOptions = signal<OrderSearchResultDto[]>([]);
  orderNoSearch = signal('');
  isLoadingOrders = false;

  filteredOrderNos = computed(() => {
    const options = this.orderNoOptions();
    const search = this.orderNoSearch();
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.orderNo?.toLowerCase().includes(q) ||
      o.customerId?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q),
    );
  });

  isLoading = false;
  hasSearched = false;

  orderData = signal<OrderHistoryDto | null>(null);
  selectedItem = signal<OrderItemDto | null>(null);
  itemNotes = signal<OrderNoteDto[]>([]);
  isLoadingNotes = false;
  showingOrderNotes = signal(false);
  notesPanelVisible = signal(false);

  ngOnInit(): void {
    this.loadOrders();

    this.orderNoSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.orderNoSearch.set(v || ''));

    this.filterForm.get('orderNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((orderNo: string) => {
        this.clearResults();
        if (orderNo) {
          this.onRetrieve(orderNo);
        }
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadOrders();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetrieve(orderNo: string): void {
    this.isLoading = true;
    this.hasSearched = true;
    this.selectedItem.set(null);
    this.itemNotes.set([]);

    this.apiService.getOrderHistory(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.item) {
            this.orderData.set(response.item);
            if (response.item.orderedBy) {
              this.filterForm.patchValue({ by: response.item.orderedBy }, { emitEvent: false });
            }
            if (response.item.items?.length > 0) {
              this.selectItem(response.item.items[0]);
            }
          } else {
            this.orderData.set(null);
            const errorMsg = response.errorResponse?.error || response.message || 'Failed to retrieve order history.';
            this.snackbarService.showError(errorMsg);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.orderData.set(null);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving order history.'),
          );
        },
      });
  }

  onSelectOpenedChange(isOpen: boolean): void {
    if (!isOpen) {
      this.orderNoSearchCtrl.setValue('');
    }
  }

  onClear(): void {
    this.filterForm.reset({ orderNo: '', by: '' });
    this.orderNoSearchCtrl.setValue('');
    this.orderNoSearch.set('');
    this.clearResults();
  }

  hasAnyFieldValue(): boolean {
    const values = this.filterForm.value;
    return !!(values.orderNo || values.by);
  }

  selectItem(item: OrderItemDto): void {
    this.selectedItem.set(item);
    this.showingOrderNotes.set(false);
    if (item.hasNotes) {
      this.loadItemNotes(item.itemNo);
      this.notesPanelVisible.set(true);
    } else {
      this.itemNotes.set([]);
      this.notesPanelVisible.set(false);
    }
  }

  showOrderNotes(): void {
    if (this.showingOrderNotes() && this.notesPanelVisible()) {
      this.notesPanelVisible.set(false);
      this.showingOrderNotes.set(false);
    } else {
      this.showingOrderNotes.set(true);
      this.notesPanelVisible.set(true);
    }
  }

  displayValue(value: string | number | null | undefined): string {
    if (value == null || value === '') return '--';
    return String(value);
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '--';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = date.getDate();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year}, ${hours}:${minutes}`;
  }

  openOrderedAttributesAntigens(): void {
    const data = this.orderData();
    const item = this.selectedItem();
    if (!data || !item) return;

    this.apiService.getOrderedAttributesAntigens(data.orderNo, item.itemNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            this.dialog.open(OrderedAttributesAntigensDialogComponent, {
              position: { right: '0' },
              width: '750px',
              height: '100vh',
              panelClass: 'right-panel-dialog',
              data: {
                itemNo: response.item.itemNo,
                attributes: response.item.attributes ?? [],
                antigens: response.item.antigens ?? [],
              },
            });
          } else {
            const msg = response.errorResponse?.error || response.message || 'No data found.';
            this.snackbarService.showError(msg);
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load ordered attributes & antigens.'),
          );
        },
      });
  }

  openShippedProducts(): void {
    const data = this.orderData();
    if (!data) return;

    this.apiService.getShippedProducts(data.orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            this.dialog.open(ShippedProductsDialogComponent, {
              position: { right: '0' },
              width: '850px',
              height: '100vh',
              panelClass: 'right-panel-dialog',
              data: { records: response.item.products ?? [] },
            });
          } else {
            const msg = response.errorResponse?.error || response.message || 'No data found.';
            this.snackbarService.showError(msg);
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load shipped products.'),
          );
        },
      });
  }

  openShippedAttributesAntigens(): void {
    const data = this.orderData();
    if (!data) return;

    this.apiService.getShippedAttributesAntigens(data.orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            this.dialog.open(ShippedAttributesAntigensDialogComponent, {
              position: { right: '0' },
              width: '950px',
              height: '100vh',
              panelClass: 'right-panel-dialog',
              data: {
                antigens: response.item.antigens ?? [],
                attributes: response.item.attributes ?? [],
              },
            });
          } else {
            const msg = response.errorResponse?.error || response.message || 'No data found.';
            this.snackbarService.showError(msg);
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load shipped attributes & antigens.'),
          );
        },
      });
  }

  private loadOrders(): void {
    this.isLoadingOrders = true;
    this.apiService.searchOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingOrders = false;
          if (response.success) {
            const orders = Array.isArray(response.item) ? response.item : [];
            this.orderNoOptions.set(orders);
          }
        },
        error: () => {
          this.isLoadingOrders = false;
        },
      });
  }

  private clearResults(): void {
    this.orderData.set(null);
    this.selectedItem.set(null);
    this.itemNotes.set([]);
    this.showingOrderNotes.set(false);
    this.notesPanelVisible.set(false);
    this.hasSearched = false;
  }

  private loadItemNotes(itemNo: number): void {
    const data = this.orderData();
    if (!data) return;

    this.isLoadingNotes = true;
    this.apiService.getItemNotes(data.orderNo, itemNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingNotes = false;
          if (response.success) {
            const notes = Array.isArray(response.item) ? response.item : [];
            this.itemNotes.set(notes);
          } else {
            this.itemNotes.set([]);
          }
        },
        error: () => {
          this.isLoadingNotes = false;
          this.itemNotes.set([]);
        },
      });
  }
}
