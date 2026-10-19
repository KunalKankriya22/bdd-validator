import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { dateFormatValidator } from '@core/utils/date-adapter.util';

import { ShipmentsByShipDateService } from './services/shipments-by-ship-date.service';
import {
  ShipmentDto,
  ShipmentQueryDto,
  FilterState,
  LookupOption,
} from './models/shipments-by-ship-date.model';
import { ViewBoxDetailsDialog } from './dialogs/view-box-details/view-box-details';
import { ViewOrderDetailsDialog } from './dialogs/view-order-details/view-order-details';
import { ViewShippedProductDetailsDialog } from './dialogs/view-shipped-product-details/view-shipped-product-details';
import { ViewDeliveryNotesDialog } from './dialogs/view-delivery-notes/view-delivery-notes';
import { ShipDocumentsDialog } from './dialogs/ship-documents/ship-documents';
import { ShipmentsByShipDateFilterPanel } from './shipments-by-ship-date-filter-panel';

@Component({
  selector: 'app-shipments-by-ship-date',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
    MatDatepickerModule,
    MatSelectModule,
    MatDialogModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './shipments-by-ship-date.html',
  styleUrl: './shipments-by-ship-date.scss',
})
export class ShipmentsByShipDateComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `shipments-by-ship-date-${ShipmentsByShipDateComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ShipmentsByShipDateService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly destroy$ = new Subject<void>();

  private overlayRef: OverlayRef | null = null;

  protected readonly shipments = signal<ShipmentDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly totalCount = signal<number>(0);
  protected readonly selectedShipment = signal<ShipmentDto | null>(null);
  protected readonly searchKeyword = signal<string>('');
  protected isFilterOpen = false;
  protected filterChips: FilterChip[] = [];

  private statusOptions: LookupOption[] = [];
  private typeOptions: LookupOption[] = [];
  private currentPageIndex = 0;
  private currentPageSize = 25;
  private currentSortColumn = 'ShipmentNo';
  private currentSortDirection: 'ASC' | 'DESC' = 'DESC';
  private appliedFilters: FilterState = {
    status: null,
    shipmentType: null,
    dateReceived: null,
  };

  protected form!: FormGroup;

  protected get minToDate(): Moment | null {
    return this.form?.get('fromDate')?.value || null;
  }

  protected fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getFromDateError()
  );
  protected toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getToDateError()
  );

  protected readonly hasShipments = computed(() => this.shipments().length > 0);
  protected isRetrieveDisabled(): boolean {
    if (!this.form) return true;
    const fromDate = this.form.get('fromDate')?.value;
    const toDate = this.form.get('toDate')?.value;
    const shipmentNo = this.form.get('shipmentNo')?.value?.trim();
    const hasOtherField = !!toDate || !!shipmentNo;
    return !fromDate || !hasOtherField || this.loading() || this.form.invalid;
  }
  protected readonly hasSelectedShipment = computed(() => this.selectedShipment() !== null);

  protected readonly filteredShipments = computed(() => {
    const keyword = this.searchKeyword().toLowerCase();
    const all = this.shipments();
    if (!keyword) return all;
    return all.filter((s) => s.shipmentNo?.toLowerCase().includes(keyword));
  });

  protected tableConfig: DataTableConfig<ShipmentDto> = {
    columns: [
      { key: 'shipmentNo', header: 'Shipment Number', sortable: true, width: '180px' },
      {
        key: 'shipmentDate',
        header: 'Shipment Date',
        sortable: false,
        width: '140px',
        valueFormatter: (value: string) => this.formatDate(value),
      },
      { key: 'consigneeId', header: 'Consignee ID', sortable: false, width: '130px' },
      { key: 'consigneeName', header: 'Consignee Name', sortable: false, width: '160px' },
      { key: 'statusDesc', header: 'Status', sortable: false, width: '110px' },
      { key: 'typeDesc', header: 'Type', sortable: false, width: '100px' },
      {
        key: 'receiptDate',
        header: 'Date Received',
        sortable: false,
        width: '140px',
        valueFormatter: (value: string) => this.formatDate(value),
      },
      {
        key: 'temperature',
        header: 'Temperature (C)',
        sortable: false,
        width: '140px',
        valueFormatter: (value: number | null) => (value != null ? String(value) : ''),
      },
      { key: 'carrierDesc', header: 'Carrier', sortable: false, width: '120px' },
      { key: 'flightNo', header: 'Flight Number', sortable: false, width: '130px' },
      { key: 'trackNo', header: 'Track Number', sortable: false, width: '140px' },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
    },
    showPagination: true,
    stickyHeader: true,
    emptyMessage: 'No shipments found',
    emptySubMessage: 'No shipments match the search criteria',
    sortConfig: {
      column: 'shipmentNo',
      direction: 'D',
    },
    enableRowHighlight: true,
  };

  protected headerConfig: PageHeaderConfig = {
    title: 'Shipments by Ship Date',
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Shipments by Ship Date', link: null },
    ],
  };

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
          subtitle: pageData.subtitle || this.headerConfig.subtitle,
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.subscribeToChapterChanges();
    this.loadFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayRef?.dispose();
  }

  private initForm(): void {
    this.form = this.fb.group({
      fromDate: [null, [Validators.required, dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      toDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      shipmentNo: [''],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('fromDate', 'toDate')],
    });

    this.form.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('toDate')?.updateValueAndValidity();
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
      });
  }

  protected onRetrieve(): void {
    const fromDate = this.form.get('fromDate')?.value;
    if (!fromDate) {
      this.form.get('fromDate')?.markAsTouched();
      return;
    }

    this.currentPageIndex = 0;
    this.selectedShipment.set(null);
    this.searchShipments();
  }

  protected onClearAll(): void {
    this.form.reset();
    this.shipments.set([]);
    this.totalCount.set(0);
    this.hasSearched.set(false);
    this.selectedShipment.set(null);
    this.searchKeyword.set('');
    this.currentPageIndex = 0;
    this.appliedFilters = { status: null, shipmentType: null, dateReceived: null };
    this.filterChips = [];
    this.closeFilterPanel();
  }

  protected onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchKeyword.set(value);
  }

  protected onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('fromDate')
    );
  }

  protected onFromDateChange(): void {
    this.form.get('fromDate')?.markAsTouched();
    this.form.get('fromDate')?.markAsDirty();
    this.form.get('toDate')?.markAsTouched();
    this.form.get('toDate')?.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }

  protected onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('toDate')
    );
  }

  protected onToDateChange(): void {
    this.form.get('toDate')?.markAsTouched();
    this.form.get('toDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  protected getFromDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('fromDate'), 'From Date', 'To Date', null
    );
  }

  protected getToDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('toDate'), 'To Date', 'From Date', this.form.errors
    );
  }

  protected onSortChange(event: TableSortEvent): void {
    this.currentSortColumn = this.mapKeyToSortColumn(event.column);
    this.currentSortDirection = event.direction === 'A' ? 'ASC' : 'DESC';
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.currentPageIndex = 0;
    this.searchShipments();
  }

  protected onPageChange(event: TablePageEvent): void {
    this.currentPageIndex = event.pageIndex;
    this.currentPageSize = event.pageSize;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.searchShipments();
  }

  protected onRowClick(row: ShipmentDto): void {
    this.selectedShipment.set(row);
  }

  protected toggleFilter(): void {
    if (this.isFilterOpen) {
      this.closeFilterPanel();
    } else {
      this.openFilterPanel();
    }
  }

  private openFilterPanel(): void {
    if (!this.tableCard) return;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: 0, offsetY: 56 },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const portal = new ComponentPortal(ShipmentsByShipDateFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = { ...this.appliedFilters };

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: FilterState) => {
        this.appliedFilters = filters;
        this.updateFilterChips();
        this.currentPageIndex = 0;
        this.searchShipments();
        this.closeFilterPanel();
      });

    componentRef.instance.clear
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.appliedFilters = { status: null, shipmentType: null, dateReceived: null };
        this.filterChips = [];
        this.currentPageIndex = 0;
        this.searchShipments();
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeFilterPanel();
    });

    this.isFilterOpen = true;
  }

  private closeFilterPanel(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isFilterOpen = false;
  }

  protected onShipDocuments(): void {
    const shipment = this.selectedShipment();
    if (!shipment) {
      this.snackbarService.showError('Please select a shipment first.');
      return;
    }
    this.dialog.open(ShipDocumentsDialog, {
      width: '1000px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      hasBackdrop: false,
      data: { shipmentNo: shipment.shipmentNo },
      autoFocus: false,
    });
  }

  protected onViewBoxDetails(): void {
    const shipment = this.selectedShipment();
    if (!shipment) {
      this.snackbarService.showError('Please select a shipment first.');
      return;
    }
    this.dialog.open(ViewBoxDetailsDialog, {
      width: '1000px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      hasBackdrop: false,
      data: { shipmentNo: shipment.shipmentNo },
      autoFocus: false,
    });
  }

  protected onViewOrderDetails(): void {
    const shipment = this.selectedShipment();
    if (!shipment) {
      this.snackbarService.showError('Please select a shipment first.');
      return;
    }
    this.dialog.open(ViewOrderDetailsDialog, {
      width: '1000px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      hasBackdrop: false,
      data: { shipmentNo: shipment.shipmentNo },
      autoFocus: false,
    });
  }

  protected onViewShippedProductDetails(): void {
    const shipment = this.selectedShipment();
    if (!shipment) {
      this.snackbarService.showError('Please select a shipment first.');
      return;
    }
    this.dialog.open(ViewShippedProductDetailsDialog, {
      width: '1000px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      hasBackdrop: false,
      data: { shipmentNo: shipment.shipmentNo },
      autoFocus: false,
    });
  }

  protected onViewDeliveryNotes(): void {
    const shipment = this.selectedShipment();
    if (!shipment) {
      this.snackbarService.showError('Please select a shipment first.');
      return;
    }
    if (!shipment.noteId) {
      this.snackbarService.showInfo('No delivery notes available for this shipment.');
      return;
    }
    this.dialog.open(ViewDeliveryNotesDialog, {
      width: '1000px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      hasBackdrop: false,
      data: { noteId: shipment.noteId },
      autoFocus: false,
    });
  }

  private loadFilterOptions(): void {
    this.apiService.getFilterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.statusOptions = options.statuses;
          this.typeOptions = options.types;
        },
      });
  }

  private updateFilterChips(): void {
    const chips: FilterChip[] = [];
    if (this.appliedFilters.status) {
      const desc = this.statusOptions.find(o => o.code === this.appliedFilters.status)?.description || this.appliedFilters.status;
      chips.push({ key: 'status', label: `Status: ${desc}`, value: this.appliedFilters.status });
    }
    if (this.appliedFilters.shipmentType) {
      const desc = this.typeOptions.find(o => o.code === this.appliedFilters.shipmentType)?.description || this.appliedFilters.shipmentType;
      chips.push({ key: 'shipmentType', label: `Type: ${desc}`, value: this.appliedFilters.shipmentType });
    }
    if (this.appliedFilters.dateReceived) {
      const formatted = moment(this.appliedFilters.dateReceived).format('DD-MMM-YYYY').toUpperCase();
      chips.push({ key: 'dateReceived', label: `Date Received: ${formatted}`, value: this.appliedFilters.dateReceived });
    }
    this.filterChips = chips;
  }

  protected removeFilterChip(key: string): void {
    this.appliedFilters = { ...this.appliedFilters, [key]: null };
    this.updateFilterChips();
    this.currentPageIndex = 0;
    this.searchShipments();
  }

  protected clearFilters(): void {
    this.appliedFilters = { status: null, shipmentType: null, dateReceived: null };
    this.filterChips = [];
    this.currentPageIndex = 0;
    this.searchShipments();
  }

  private searchShipments(): void {
    const fromDate = this.form.get('fromDate')?.value;
    if (!fromDate) return;

    this.loading.set(true);
    this.hasSearched.set(true);

    const fromMoment = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
    const toDate = this.form.get('toDate')?.value;
    const toMoment = toDate ? (moment.isMoment(toDate) ? toDate : moment(toDate)) : null;

    const query: ShipmentQueryDto = {
      startDate: fromMoment.format('YYYY-MM-DD'),
      endDate: toMoment ? toMoment.format('YYYY-MM-DD') : undefined,
      shipmentNo: this.form.get('shipmentNo')?.value || undefined,
      status: this.appliedFilters.status || undefined,
      shipmentType: this.appliedFilters.shipmentType || undefined,
      dateReceived: this.appliedFilters.dateReceived || undefined,
      sortColumn: this.currentSortColumn,
      sortOrder: this.currentSortDirection,
    };

    const skip = this.currentPageIndex * this.currentPageSize;

    this.apiService
      .searchShipments(query, this.currentPageSize, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.shipments.set(result.data);
          this.totalCount.set(result.totalCount);
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = result.totalCount;
          }
          this.loading.set(false);
          if (result.data.length === 0) {
            this.snackbarService.showInfo('No shipments found for the specified criteria.');
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.shipments.set([]);
          this.totalCount.set(0);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to retrieve shipments.')
          );
        },
      });
  }

  protected formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  private mapKeyToSortColumn(key: string): string {
    const map: Record<string, string> = {
      shipmentNo: 'ShipmentNo',
      shipmentDate: 'ShipDate',
      consigneeId: 'CustomerNo',
      consigneeName: 'CustomerName',
      statusDesc: 'Status',
      receiptDate: 'DateReceived',
    };
    return map[key] || 'ShipmentNo';
  }
}
