import { Component, OnInit, OnDestroy, signal, computed, effect, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { formatTableDate } from '@shared/utils/date-format.util';

import { StandingOrdersQueryApiService } from './services/standing-orders-query-api.service';
import {
  StandingOrderDto,
  StandingOrderItemDto,
  WeekDayLookup,
  CustomerTypeLookup,
  CustomerLookup,
} from './models/standing-orders-query.model';

interface DetailRow {
  itemNo: number;
  weekDay: string;
  weekDayFull: string;
  productType: string;
  productName: string;
  aboRh: string;
  tier: number | null;
  qty: number;
  minQty: number | null;
  effDate: string;
  termDate: string | null;
  attributeGroup: string;
  attributeCode: string;
  attributeDescription: string;
}

@Component({
  selector: 'app-standing-orders-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './standing-orders-query.html',
  styleUrl: './standing-orders-query.scss',
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      },
    },
  ],
})
export class StandingOrdersQueryComponent implements OnInit, OnDestroy {
  @ViewChild('detailPage', { read: ElementRef }) private detailPageRef?: ElementRef<HTMLElement>;
  @ViewChild('masterPage', { read: ElementRef }) private masterPageRef?: ElementRef<HTMLElement>;

  private readonly apiService = inject(StandingOrdersQueryApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  detailHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    showBackButton: true,
    onBackClick: () => this.onBackToMaster(),
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
          subtitle: pageData.subtitle || 'Search and view standing orders.',
        };
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    weekDay: [''],
    customerType: [''],
    customerId: [''],
  });

  // Dropdown options
  weekDayOptions = signal<WeekDayLookup[]>([]);
  customerTypeOptions = signal<CustomerTypeLookup[]>([]);
  customerOptions = signal<CustomerLookup[]>([]);

  // Search controls for searchable dropdowns
  weekDaySearchCtrl = new FormControl('');
  customerTypeSearchCtrl = new FormControl('');
  customerSearchCtrl = new FormControl('');

  weekDaySearch = signal('');
  customerTypeSearch = signal('');
  customerSearch = signal('');

  filteredWeekDays = computed(() => this.filterWeekDayOptions(this.weekDayOptions(), this.weekDaySearch()));
  filteredCustomerTypes = computed(() => this.filterCustomerTypeOptions(this.customerTypeOptions(), this.customerTypeSearch()));
  filteredCustomers = computed(() => this.filterCustomerOptions(this.customerOptions(), this.customerSearch()));

  // Customer name display
  customerName = signal('--');

  // Loading states
  isLoadingWeekDays = false;
  isLoadingCustomerTypes = false;
  isLoadingCustomers = false;
  isLoading = false;
  isLoadingDetail = false;
  hasSearched = false;

  // Master grid
  orders: StandingOrderDto[] = [];
  paginatedOrders: StandingOrderDto[] = [];
  pageSize = 10;
  pageIndex = 0;
  masterColumns: string[] = [
    'customerName',
    'weekDayFull',
    'contractId',
    'consigneeId',
    'effDate',
    'termDate',
    'actions',
  ];

  // Detail view
  showDetail = false;
  selectedOrder: StandingOrderDto | null = null;
  detailItems: StandingOrderItemDto[] = [];
  detailRows: DetailRow[] = [];
  detailColumns: string[] = [
    'itemNo',
    'weekDayFull',
    'productType',
    'productName',
    'aboRh',
    'tier',
    'qty',
    'minQty',
    'effDate',
    'termDate',
    'attributeGroup',
    'attributeCode',
    'attributeDescription',
  ];

  ngOnInit(): void {
    this.loadWeekDays();
    this.loadCustomerTypes();
    this.loadCustomers();

    this.weekDaySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.weekDaySearch.set(v || ''));

    this.customerTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.customerTypeSearch.set(v || ''));

    this.customerSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.customerSearch.set(v || ''));

    this.filterForm.get('customerType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((customerType: string) => {
        this.filterForm.patchValue({ customerId: '' });
        this.customerSearchCtrl.setValue('');
        this.customerName.set('--');
        this.loadCustomers(customerType || undefined);
      });

    this.filterForm.get('customerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((customerId: string) => {
        if (customerId) {
          const selected = this.customerOptions().find(c => c.customerId === customerId);
          this.customerName.set(selected?.customerName ?? '--');
        } else {
          this.customerName.set('--');
        }
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadWeekDays();
        this.loadCustomerTypes();
        this.loadCustomers();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetrieve(): void {
    const { weekDay, customerType, customerId } = this.filterForm.value;
    const request: Record<string, string> = {};
    if (weekDay) request['weekDay'] = weekDay;
    if (customerType) request['customerType'] = customerType;
    if (customerId) request['customerId'] = customerId;

    this.isLoading = true;
    this.hasSearched = true;

    this.apiService.searchOrders(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.pageIndex = 0;
          if (response.success) {
            this.orders = response.data ?? [];
          } else {
            this.orders = [];
            this.snackbarService.showError(response.message ?? 'Failed to retrieve data.');
          }
          this.applyPagination();
        },
        error: (error) => {
          this.isLoading = false;
          this.orders = [];
          this.paginatedOrders = [];
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while searching standing orders.'),
          );
        },
      });
  }

  onClear(): void {
    this.filterForm.reset({ weekDay: '', customerType: '', customerId: '' });
    this.weekDaySearchCtrl.setValue('');
    this.customerTypeSearchCtrl.setValue('');
    this.customerSearchCtrl.setValue('');
    this.customerName.set('--');
    this.orders = [];
    this.paginatedOrders = [];
    this.pageIndex = 0;
    this.hasSearched = false;
    this.showDetail = false;
    this.selectedOrder = null;
    this.detailItems = [];
    this.detailRows = [];
  }

  hasAnyFieldValue(): boolean {
    const values = this.filterForm.value;
    return !!(values.weekDay || values.customerType || values.customerId);
  }

  onViewDetail(order: StandingOrderDto): void {
    this.selectedOrder = order;
    this.isLoadingDetail = true;
    this.showDetail = true;
    setTimeout(() => this.detailPageRef?.nativeElement?.focus());

    this.detailHeaderConfig = {
      ...this.detailHeaderConfig,
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Standing Orders Query', link: null },
      ],
      title: order.weekDayFull,
      onBackClick: () => this.onBackToMaster(),
    };

    this.apiService.getOrderItems(order.contractId, order.consigneeId, order.weekDay)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingDetail = false;
          if (response.success) {
            this.detailItems = response.data ?? [];
            this.detailRows = this.flattenToRows(this.detailItems);
          } else {
            this.detailItems = [];
            this.detailRows = [];
            this.snackbarService.showError(response.message ?? 'Failed to retrieve order items.');
          }
        },
        error: (error) => {
          this.isLoadingDetail = false;
          this.detailItems = [];
          this.detailRows = [];
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving order items.'),
          );
        },
      });
  }

  onBackToMaster(): void {
    this.showDetail = false;
    this.selectedOrder = null;
    this.detailItems = [];
    this.detailRows = [];
    setTimeout(() => this.masterPageRef?.nativeElement?.focus());
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.applyPagination();
  }

  private applyPagination(): void {
    const start = this.pageIndex * this.pageSize;
    this.paginatedOrders = this.orders.slice(start, start + this.pageSize);
  }

  formatDate(isoDate: string | null | undefined): string {
    return formatTableDate(isoDate);
  }

  private flattenToRows(items: StandingOrderItemDto[]): DetailRow[] {
    const rows: DetailRow[] = [];
    for (const item of items) {
      const base = {
        itemNo: item.itemNo,
        weekDay: item.weekDay,
        weekDayFull: item.weekDayFull,
        productType: item.productType,
        productName: item.productName,
        aboRh: item.aboRh,
        tier: item.tier,
        qty: item.qty,
        minQty: item.minQty,
        effDate: item.effDate,
        termDate: item.termDate,
      };
      if (item.attributes.length === 0) {
        rows.push({ ...base, attributeGroup: '', attributeCode: '', attributeDescription: '' });
      } else {
        for (const attr of item.attributes) {
          rows.push({
            ...base,
            attributeGroup: attr.attributeGroup,
            attributeCode: attr.attributeCode,
            attributeDescription: attr.attributeDescription,
          });
        }
      }
    }
    return rows;
  }

  private loadWeekDays(): void {
    this.isLoadingWeekDays = true;
    this.apiService.getWeekDays()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingWeekDays = false;
          if (response.success) {
            this.weekDayOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingWeekDays = false;
        },
      });
  }

  private loadCustomerTypes(): void {
    this.isLoadingCustomerTypes = true;
    this.apiService.getCustomerTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingCustomerTypes = false;
          if (response.success) {
            this.customerTypeOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingCustomerTypes = false;
        },
      });
  }

  private loadCustomers(customerType?: string): void {
    this.isLoadingCustomers = true;
    this.apiService.getCustomers(customerType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingCustomers = false;
          if (response.success) {
            this.customerOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingCustomers = false;
        },
      });
  }

  private filterWeekDayOptions(options: WeekDayLookup[], search: string): WeekDayLookup[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.code?.toLowerCase().includes(q) ||
      o.name?.toLowerCase().includes(q),
    );
  }

  private filterCustomerTypeOptions(options: CustomerTypeLookup[], search: string): CustomerTypeLookup[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.code?.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q),
    );
  }

  private filterCustomerOptions(options: CustomerLookup[], search: string): CustomerLookup[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.customerId?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q),
    );
  }
}
