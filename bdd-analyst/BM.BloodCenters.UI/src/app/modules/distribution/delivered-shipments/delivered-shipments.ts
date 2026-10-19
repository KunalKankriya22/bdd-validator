import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DeliveredShipmentsService } from './services/delivered-shipments.service';
import {
  DeliveredShipmentDto,
  ShipmentProductDto,
  ShipmentNumberOption,
  BoxIdOption,
} from './models/delivered-shipments.model';
import { ViewAdditionalShipmentDetailsComponent } from './dialogs/view-additional-shipment-details/view-additional-shipment-details';

/**
 * Delivered Shipments Component
 * Allows users to query and view delivered shipment information
 * including boxes and products shipped.
 *
 * JIRA Ticket: MLT-13998
 */
@Component({
  selector: 'app-delivered-shipments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    ViewAdditionalShipmentDetailsComponent,
    DataTable,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './delivered-shipments.html',
  styleUrl: './delivered-shipments.scss',
})
export class DeliveredShipmentsComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `delivered-shipments-${DeliveredShipmentsComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly deliveredShipmentsService = inject(DeliveredShipmentsService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  // Searchable dropdowns
  protected readonly shipmentSearchCtrl = new FormControl('');
  private readonly shipmentSearchText = signal('');
  protected readonly filteredShipmentNumbers = computed(() => {
    const search = this.shipmentSearchText().toLowerCase();
    const all = this.shipmentNumbers();
    if (!search) return all;
    return all.filter(
      (o) =>
        o.shipmentNo.toLowerCase().includes(search) ||
        (o.consigneeName && o.consigneeName.toLowerCase().includes(search))
    );
  });

  protected readonly boxSearchCtrl = new FormControl('');
  private readonly boxSearchText = signal('');
  protected readonly filteredBoxIds = computed(() => {
    const search = this.boxSearchText().toLowerCase();
    const all = this.boxIds();
    if (!search) return all;
    return all.filter((o) => o.boxId.toLowerCase().includes(search));
  });

  // Signal-based state
  protected readonly shipmentNumbers = signal<ShipmentNumberOption[]>([]);
  protected readonly boxIds = signal<BoxIdOption[]>([]);
  protected readonly selectedShipment = signal<DeliveredShipmentDto | null>(null);
  protected readonly products = signal<ShipmentProductDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingShipments = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  private readonly selectedShipmentNo = signal<string | null>(null);
  protected readonly sidePanelOpen = signal<boolean>(false);
  private readonly sortDirection = signal<'A' | 'D' | 'default'>('default');
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(25);

  // Computed values
  protected readonly hasProducts = computed(() => this.products().length > 0);

  protected readonly paginatedProducts = computed(() => {
    const all = this.products();
    const start = this.pageIndex() * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });
  protected readonly isRetrieveDisabled = computed(() => !this.selectedShipmentNo() || this.loading());
  protected readonly uniquePickSlipIds = computed(() => {
    const shipment = this.selectedShipment();
    if (!shipment || !shipment.products) return [];

    const pickSlipIds = Array.from(new Set(shipment.products.map((p) => p.pickSlipId)));
    return pickSlipIds;
  });

  // Form
  form!: FormGroup;

  // Table configuration
  protected readonly tableConfig = computed<DataTableConfig<ShipmentProductDto>>(() => {
    const count = this.products().length;
    return {
      columns: [
        {
          key: 'boxId',
          header: `Box ID (${count})`,
          sortable: true,
          width: '120px',
        },
        {
          key: 'unitId',
          header: 'Unit ID',
          sortable: false,
          width: '150px',
        },
        {
          key: 'collDate',
          header: 'Collected Date',
          sortable: false,
          width: '140px',
          valueFormatter: (value: string) => this.formatDate(value),
        },
        {
          key: 'productCode',
          header: 'Product',
          sortable: false,
          width: '120px',
        },
        {
          key: 'productDesc',
          header: 'Product Description',
          sortable: false,
          width: 'auto',
        },
        {
          key: 'bloodTypeDesc',
          header: 'ABORh',
          sortable: false,
          width: '100px',
        },
      ],
      showPagination: true,
      pagination: {
        pageSize: this.pageSize(),
        pageIndex: this.pageIndex(),
        totalRecords: this.products().length,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      stickyHeader: true,
      emptyMessage: 'No products found',
      emptySubMessage: 'No products are available for this shipment',
      sortConfig: {
        column: 'boxId',
        direction: this.sortDirection(),
      },
    };
  });

  // Page header configuration
  protected pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Delivered Shipments', link: null },
    ],
    title: 'Delivered Shipments',
    subtitle: 'Review information about a particular shipment that has been delivered.',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadShipmentNumbers();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      shipmentNo: [null],
      boxId: [''],
    });
  }

  private setupFormListeners(): void {
    this.form
      .get('shipmentNo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((shipmentNo) => {
        this.selectedShipmentNo.set(shipmentNo || null);
        this.products.set([]);
        if (shipmentNo) {
          this.loadShipmentHeader(shipmentNo);
          this.loadBoxIds(shipmentNo);
        } else {
          this.selectedShipment.set(null);
          this.boxIds.set([]);
          this.form.get('boxId')?.setValue('');
        }
      });

    this.shipmentSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.shipmentSearchText.set(v || ''));

    this.boxSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.boxSearchText.set(v || ''));
  }

  private loadShipmentNumbers(): void {
    this.loadingShipments.set(true);
    this.deliveredShipmentsService
      .getShipmentNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipmentNumbers) => {
          this.shipmentNumbers.set(shipmentNumbers);
          this.loadingShipments.set(false);
        },
        error: (error) => {
          console.error('Error loading shipment numbers:', error);
          this.snackbarService.showError('Failed to load shipment numbers. Please try again.');
          this.loadingShipments.set(false);
        },
      });
  }

  private loadShipmentHeader(shipmentNo: string): void {
    this.deliveredShipmentsService
      .getShipmentHeader(shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipment) => {
          this.selectedShipment.set(shipment);
        },
        error: (error) => {
          console.error('Error loading shipment header:', error);
          this.selectedShipment.set(null);
        },
      });
  }

  private loadBoxIds(shipmentNo: string): void {
    this.deliveredShipmentsService
      .getBoxIdsByShipment(shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxIds) => {
          this.boxIds.set(boxIds);
          this.form.get('boxId')?.setValue('');
        },
        error: (error) => {
          console.error('Error loading box IDs:', error);
          this.boxIds.set([]);
        },
      });
  }

  protected onRetrieve(): void {
    const shipmentNo = this.form.get('shipmentNo')?.value;
    const boxId = this.form.get('boxId')?.value || undefined;

    if (!shipmentNo) {
      this.snackbarService.showError('Please select a Shipment Number.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.pageIndex.set(0);

    this.deliveredShipmentsService
      .getShipmentByNumber(shipmentNo, boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipment) => {
          this.loading.set(false);
          if (shipment) {
            this.selectedShipment.set(shipment);
            this.products.set(shipment.products || []);

            if ((shipment.products || []).length === 0) {
              this.snackbarService.showInfo('No products found for this shipment.');
            }
          } else {
            this.products.set([]);
            this.snackbarService.showError('Shipment not found or not delivered.');
          }
        },
        error: (error) => {
          console.error('Error retrieving shipment:', error);
          this.products.set([]);
          this.loading.set(false);

          const errorMessage = error?.error?.message || 'Failed to retrieve shipment. Please try again.';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  protected onClearAll(): void {
    this.form.reset();
    this.selectedShipment.set(null);
    this.products.set([]);
    this.boxIds.set([]);
    this.error.set(null);
    this.pageIndex.set(0);
  }

  protected onViewAdditionalDetails(): void {
    if (!this.selectedShipment()) {
      this.snackbarService.showError('No shipment data available.');
      return;
    }
    this.sidePanelOpen.set(true);
  }

  protected closeSidePanel(): void {
    this.sidePanelOpen.set(false);
  }

  protected onPageChange(event: TablePageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected onSortChange(event: TableSortEvent): void {
    this.sortDirection.set(event.direction);
    this.pageIndex.set(0);
    const current = [...this.products()];
    if (event.direction === 'default') {
      this.products.set(current);
      return;
    }
    current.sort((a, b) => {
      const valA = (a.boxId || '').toLowerCase();
      const valB = (b.boxId || '').toLowerCase();
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    });
    this.products.set(current);
  }

  protected onViewBoxDetails(): void {
    const boxId = this.form.get('boxId')?.value;
    if (!boxId) {
      this.snackbarService.showError('Please select a specific Box ID.');
      return;
    }
    this.router.navigate(['/distribution/box-details', boxId]);
  }

  /**
   * Format date to DD-MMM-YYYY format
   */
  protected formatDate(value: string | null): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  /**
   * Format date with time to DD-MMM-YYYY HH:mm format
   */
  protected formatDateTime(value: string | null): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }

  /**
   * Get accessor for form controls
   */
  get f() {
    return this.form.controls;
  }
}
