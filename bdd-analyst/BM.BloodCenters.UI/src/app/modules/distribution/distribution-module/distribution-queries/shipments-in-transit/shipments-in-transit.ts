import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { ShipmentsInTransitApiService } from './services/shipments-in-transit-api.service';
import {
  ShipmentLookupDto,
  BoxLookupDto,
  ShipmentHeaderDto,
  ShipmentProductDto,
  ShipmentProductDisplay,
} from './models/shipments-in-transit.model';

@Component({
  selector: 'app-shipments-in-transit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './shipments-in-transit.html',
  styleUrl: './shipments-in-transit.scss',
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
export class ShipmentsInTransitComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ShipmentsInTransitApiService);
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

  private readonly defaultTitle = 'Shipments in Transit';
  private readonly defaultSubtitle = 'Review information about a particular shipment that has not yet been delivered:';

  constructor() {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.defaultTitle, link: null },
      ],
      title: this.defaultTitle,
      subtitle: this.defaultSubtitle,
    };

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || this.defaultSubtitle,
        };
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    shipmentNo: ['', Validators.required],
    boxId: [''],
  });

  // Shipment Number dropdown
  shipmentOptions = signal<ShipmentLookupDto[]>([]);
  shipmentSearchCtrl = new FormControl('');
  shipmentSearchTerm = signal('');

  filteredShipments = computed(() => {
    const options = this.shipmentOptions();
    const search = this.shipmentSearchTerm();
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.shipmentNo?.toLowerCase().includes(q) ||
      o.consigneeName?.toLowerCase().includes(q),
    );
  });

  // Box ID dropdown
  boxOptions = signal<BoxLookupDto[]>([]);
  boxSearchCtrl = new FormControl('');
  boxSearchTerm = signal('');

  filteredBoxes = computed(() => {
    const options = this.boxOptions();
    const search = this.boxSearchTerm();
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.boxId?.toLowerCase().includes(q));
  });

  // Shipment header data
  shipmentHeader = signal<ShipmentHeaderDto | null>(null);

  // Products table
  products = signal<ShipmentProductDisplay[]>([]);
  totalRecords = signal(0);
  pageSize = signal(25);
  pageIndex = signal(0);

  displayedColumns: string[] = [
    'unitId',
    'productCode',
    'productDescription',
    'aboRh',
    'expirationDate',
  ];

  currentSort: Sort = { active: 'unitId', direction: 'desc' };

  // UI states
  isLoading = false;
  isLoadingHeader = false;
  isLoadingShipments = false;
  isLoadingBoxes = false;
  hasSearched = false;
  isRetrieveDisabled = true;

  ngOnInit(): void {
    this.loadShipments();

    this.shipmentSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.shipmentSearchTerm.set(v || ''));

    this.boxSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.boxSearchTerm.set(v || ''));

    this.filterForm.get('shipmentNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((shipmentNo: string) => {
        this.filterForm.patchValue({ boxId: '' }, { emitEvent: false });
        this.boxSearchCtrl.setValue('');
        this.clearResults();
        this.shipmentHeader.set(null);
        this.isRetrieveDisabled = true;
        if (shipmentNo) {
          this.loadBoxes(shipmentNo);
          this.loadShipmentHeader(shipmentNo);
        } else {
          this.boxOptions.set([]);
        }
      });

    this.filterForm.get('boxId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.shipmentHeader()) {
          this.isRetrieveDisabled = false;
        }
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadShipments();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetrieve(): void {
    const shipmentNo = this.filterForm.get('shipmentNo')?.value;
    if (!shipmentNo) return;

    this.isLoading = true;
    this.hasSearched = true;

    const boxId = this.filterForm.get('boxId')?.value;
    const sortOrder: 'ASC' | 'DESC' = this.currentSort.direction === 'desc' ? 'DESC' : 'ASC';
    const request = {
      ShipmentNo: shipmentNo,
      ...(boxId ? { BoxId: boxId } : {}),
      pageNumber: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      sortOrder,
    };

    this.apiService.search(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          const success = response.success ?? response.Success;
          if (success) {
            const data = response.item ?? response.Item ?? response.data?.[0] ?? response.Data?.[0] ?? null;
            const products = data?.products ?? data?.Products ?? [];
            const totalCount = data?.totalProductCount ?? data?.TotalProductCount ?? products.length;
            this.totalRecords.set(totalCount);
            if (products.length > 0) {
              const enriched = this.enrichProducts(products);
              this.products.set(enriched);
            } else {
              this.products.set([]);
            }
            this.isRetrieveDisabled = true;
          } else {
            this.products.set([]);
            this.totalRecords.set(0);
            const errorMsg = response.errorResponse?.error || response.ErrorResponse?.Error || response.message || 'Failed to retrieve shipment data.';
            this.snackbarService.showError(errorMsg);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.products.set([]);
          this.totalRecords.set(0);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving shipment data.'),
          );
        },
      });
  }

  onClear(): void {
    this.filterForm.reset({ shipmentNo: '', boxId: '' });
    this.shipmentSearchCtrl.setValue('');
    this.boxSearchCtrl.setValue('');
    this.boxOptions.set([]);
    this.shipmentHeader.set(null);
    this.isRetrieveDisabled = true;
    this.clearResults();
  }

  onSortChange(sort: Sort): void {
    this.currentSort = sort;
    this.pageIndex.set(0);
    this.onRetrieve();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.onRetrieve();
  }

  onShipmentDropdownClosed(opened: boolean): void {
    if (!opened) {
      this.filterForm.get('shipmentNo')?.markAsTouched();
    }
  }

  displayValue(value: string | number | null | undefined): string {
    if (value == null || value === '') return '-';
    return String(value);
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    try {
      return moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase();
    } catch {
      return value;
    }
  }

  hasAnyFieldValue(): boolean {
    const values = this.filterForm.value;
    return !!(values.shipmentNo || values.boxId);
  }

  private loadShipments(): void {
    this.isLoadingShipments = true;
    this.apiService.getShipmentLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingShipments = false;
          if (response.success) {
            this.shipmentOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingShipments = false;
        },
      });
  }

  private loadShipmentHeader(shipmentNo: string): void {
    this.isLoadingHeader = true;
    this.apiService.search({ ShipmentNo: shipmentNo })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isLoadingHeader = false;
          const success = response.success ?? response.Success;
          if (success) {
            const raw = response.item ?? response.Item ?? response.data?.[0] ?? response.Data?.[0] ?? null;
            const header = this.normalizeHeader(raw);
            this.shipmentHeader.set(header);
            if (header?.defaultBoxId) {
              this.filterForm.patchValue({ boxId: header.defaultBoxId }, { emitEvent: false });
            }
            this.isRetrieveDisabled = false;
          } else {
            this.shipmentHeader.set(null);
            const errorMsg = response.errorResponse?.error || response.ErrorResponse?.Error || response.message || 'Failed to retrieve shipment data.';
            this.snackbarService.showError(errorMsg);
          }
        },
        error: (error) => {
          this.isLoadingHeader = false;
          this.shipmentHeader.set(null);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving shipment data.'),
          );
        },
      });
  }

  private loadBoxes(shipmentNo: string): void {
    this.isLoadingBoxes = true;
    this.apiService.getBoxLookup(shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingBoxes = false;
          if (response.success) {
            this.boxOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingBoxes = false;
        },
      });
  }

  private normalizeHeader(raw: any): ShipmentHeaderDto | null {
    if (!raw) return null;
    return {
      shipmentNo: raw.shipmentNo ?? raw.ShipmentNo ?? '',
      shipmentDate: raw.shipmentDate ?? raw.ShipmentDate ?? '',
      carrierCode: raw.carrierCode ?? raw.CarrierCode ?? '',
      carrierName: raw.carrierName ?? raw.CarrierName ?? '',
      customerName: raw.customerName ?? raw.CustomerName ?? null,
      address: raw.address ?? raw.Address ?? null,
      city: raw.city ?? raw.City ?? null,
      state: raw.state ?? raw.State ?? null,
      zip: raw.zip ?? raw.Zip ?? null,
      country: raw.country ?? raw.Country ?? null,
      totalBoxes: raw.totalBoxes ?? raw.TotalBoxes ?? 0,
      defaultBoxId: raw.defaultBoxId ?? raw.DefaultBoxId ?? null,
      products: raw.products ?? raw.Products ?? [],
    };
  }

  private enrichProducts(products: any[]): ShipmentProductDisplay[] {
    return products.map(p => {
      const unitId = p.unitId ?? p.UnitId ?? '';
      const checkDigit = p.checkDigit ?? p.CheckDigit ?? null;
      const productCode = p.productCode ?? p.ProductCode ?? '';
      const productDescription = p.productDescription ?? p.ProductDescription ?? '';
      const aboRh = p.aboRh ?? p.AboRh ?? p.ABORh ?? '';
      const expirationDate = p.expirationDate ?? p.ExpirationDate ?? null;
      const aliquot = p.aliquot ?? p.Aliquot ?? null;
      return {
        unitId,
        checkDigit,
        productCode,
        productDescription,
        aliquot,
        aboRh,
        expirationDate,
        fullUnitId: checkDigit ? `${unitId}${checkDigit}` : unitId,
        formattedExpirationDate: this.formatDateTime(expirationDate),
      };
    });
  }

  private clearResults(): void {
    this.shipmentHeader.set(null);
    this.products.set([]);
    this.totalRecords.set(0);
    this.pageIndex.set(0);
    this.hasSearched = false;
  }
}
