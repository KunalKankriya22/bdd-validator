import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  effect,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';

import { ShipProductsService } from './services/ship-products.service';
import { ShipmentDto, BoxDto, LovOption, ShipmentChargesDialogData, PendingShipmentData, PackedBoxLookupDto, CreateShipmentDto } from './models/ship-products.model';


import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

import { AddEditShipmentDialog } from './dialogs/add-edit-shipment/add-edit-shipment';
import { ViewShippedBoxesDialog } from './dialogs/view-shipped-boxes/view-shipped-boxes';
import { ViewConsigneesSameZoneDialog } from './dialogs/view-consignees-same-zone/view-consignees-same-zone';
import { PackListPrintDialog } from './dialogs/pack-list-print/pack-list-print';
import { ShipmentChargesDialog } from './dialogs/shipment-charges/shipment-charges';

@Component({
  selector: 'app-ship-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  templateUrl: './ship-products.html',
  styleUrls: ['./ship-products.scss']
})
export class ShipProductsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly shipProductsService = inject(ShipProductsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  headerConfig!: PageHeaderConfig;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle
        };
      }
    });
  }

  protected readonly shipmentData = signal<ShipmentDto | null>(null);
  protected readonly pendingShipmentData = signal<PendingShipmentData | null>(null);
  protected readonly boxesData = signal<BoxDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadingBoxes = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly addingBox = signal(false);

  protected readonly shipmentOptions = signal<LovOption[]>([]);
  protected readonly consigneeOptions = signal<LovOption[]>([]);
  protected readonly carrierOptions = signal<LovOption[]>([]);
  protected readonly packedBoxOptions = signal<PackedBoxLookupDto[]>([]);
  protected readonly loadingPackedBoxes = signal(false);
  private readonly boxIdSearchText = signal('');

  readonly filteredPackedBoxes = computed(() => {
    const search = this.boxIdSearchText().toUpperCase();
    const boxes = this.packedBoxOptions();
    if (!search) return boxes;
    return boxes.filter(b =>
      b.boxId.toUpperCase().includes(search) ||
      (b.orderNo?.toUpperCase().includes(search) ?? false)
    );
  });

  protected readonly hasShipmentData = computed(() => this.shipmentData() !== null || this.pendingShipmentData() !== null);
  protected readonly canCompleteEntry = computed(() => {
    const shipment = this.shipmentData();
    return shipment !== null && shipment.shipmentStatus === 'OP' && this.boxesData().length > 0;
  });

  protected readonly activeConsigneeId = computed(() => {
    return this.shipmentData()?.consigneeId || this.pendingShipmentData()?.consigneeId || null;
  });

  protected readonly shipmentStatusLabel = computed(() => {
    const status = this.shipmentData()?.shipmentStatus;
    switch (status) {
      case 'OP': return 'Open';
      case 'CL': return 'Closed';
      case 'IN': return 'Invoiced';
      default: return status || '—';
    }
  });

  shipmentSearchCtrl = new FormControl('');
  private shipmentSearchText = signal('');
  readonly filteredShipments = computed(() => {
    const s = this.shipmentSearchText().toLowerCase();
    return !s ? this.shipmentOptions() : this.shipmentOptions().filter(o =>
      o.value.toLowerCase().includes(s) || (o.label?.toLowerCase().includes(s) ?? false) ||
      (o.description?.toLowerCase().includes(s) ?? false)
    );
  });

  consigneeSearchCtrl = new FormControl('');
  private consigneeSearchText = signal('');
  readonly filteredConsignees = computed(() => {
    const s = this.consigneeSearchText().toLowerCase();
    return !s ? this.consigneeOptions() : this.consigneeOptions().filter(o =>
      o.value.toLowerCase().includes(s) || (o.label?.toLowerCase().includes(s) ?? false) ||
      (o.description?.toLowerCase().includes(s) ?? false)
    );
  });

  carrierSearchCtrl = new FormControl('');
  private carrierSearchText = signal('');
  readonly filteredCarriers = computed(() => {
    const s = this.carrierSearchText().toLowerCase();
    return !s ? this.carrierOptions() : this.carrierOptions().filter(o =>
      o.value.toLowerCase().includes(s) || (o.description?.toLowerCase().includes(s) ?? false)
    );
  });

  readonly boxTableConfig = computed<DataTableConfig<BoxDto>>(() => ({
    columns: [
      { key: 'boxId', header: 'Box ID' },
      { key: 'boxType', header: 'Box Type' },
      { key: 'packedBy', header: 'Packed By', valueFormatter: (_: any, row: BoxDto) => row.packedByName || row.packedBy },
      { key: 'packedDate', header: 'Packed Date', valueFormatter: (val: any) => this.formatChapterDateTime(val) }
    ],
    stickyHeader: true,
    emptyMessage: 'No boxes found for this shipment',
    showPagination: true,
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: this.boxesData().length,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    enableRowHighlight: true,
    rowActions: [
      { action: 'delete', icon: 'delete', ariaLabel: 'Remove box from shipment', color: 'warn' }
    ]
  }));

  searchForm!: FormGroup;
  boxIdInput = '';

  ngOnInit(): void {
    this.initializeConfig();
    this.initSearchForm();
    this.loadDropdownOptions();
    this.setupSearchSubscriptions();
    this.subscribeToChapterChanges();
  }

  private initializeConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      actions: [
        {
          label: 'ADD NEW SHIPMENT',
          icon: 'add',
          color: 'primary',
          matButton: 'raised',
          onClick: () => this.onAddNewShipment()
        }
      ]
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      shipmentNo: [''],
      consigneeId: [''],
      carrier: ['']
    });

    this.searchForm.get('shipmentNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(shipmentNo => {
        if (shipmentNo) this.loadShipmentByNumber(shipmentNo);
      });

    this.searchForm.get('consigneeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(consigneeId => {
        if (consigneeId) this.searchByConsignee(consigneeId);
      });
  }

  private setupSearchSubscriptions(): void {
    this.shipmentSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.shipmentSearchText.set(v || ''));

    this.consigneeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.consigneeSearchText.set(v || ''));

    this.carrierSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.carrierSearchText.set(v || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onCancel();
        this.loadDropdownOptions();
      });
  }

  private loadDropdownOptions(): void {
    this.shipProductsService.getShipmentNumberOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.shipmentOptions.set(options),
        error: () => this.snackbarService.showError('Failed to load shipment options')
      });

    this.shipProductsService.getConsigneeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.consigneeOptions.set(options),
        error: () => this.snackbarService.showError('Failed to load consignee options')
      });

    this.shipProductsService.getCarrierOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.carrierOptions.set(options),
        error: () => this.snackbarService.showError('Failed to load carrier options')
      });
  }

  private loadShipmentByNumber(shipmentNo: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.shipProductsService.getShipmentByNumber(shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const shipment = response.data[0];
            this.shipmentData.set(shipment);
            this.pendingShipmentData.set(null);
            this.boxesData.set([]);
            this.searchForm.patchValue({ consigneeId: shipment.consigneeId }, { emitEvent: false });
            this.loadBoxesForShipment(shipment.shipmentNo);
            this.loadPackedBoxes(shipment.consigneeId);
          } else {
            this.error.set('Shipment not found');
            this.shipmentData.set(null);
            this.boxesData.set([]);
            this.packedBoxOptions.set([]);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load shipment');
          this.loading.set(false);
          this.shipmentData.set(null);
          this.boxesData.set([]);
          this.packedBoxOptions.set([]);
        }
      });
  }

  private searchByConsignee(consigneeId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.loadPackedBoxes(consigneeId);

    this.shipProductsService.getAllShipments(50, 0, { consigneeId, shipmentStatus: 'OP' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const shipment = response.data[0];
            this.shipmentData.set(shipment);
            this.pendingShipmentData.set(null);
            this.boxesData.set([]);
            this.searchForm.patchValue({ shipmentNo: shipment.shipmentNo }, { emitEvent: false });
            this.loadBoxesForShipment(shipment.shipmentNo);
          } else {
            this.error.set('No open shipments found for this consignee');
            this.shipmentData.set(null);
            this.boxesData.set([]);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to search shipments');
          this.loading.set(false);
          this.shipmentData.set(null);
          this.boxesData.set([]);
          this.packedBoxOptions.set([]);
        }
      });
  }

  private loadPackedBoxes(consigneeId: string): void {
    this.loadingPackedBoxes.set(true);
    this.shipProductsService.getPackedBoxesForConsignee(consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxes) => {
          this.packedBoxOptions.set(boxes);
          this.loadingPackedBoxes.set(false);
        },
        error: () => {
          this.packedBoxOptions.set([]);
          this.loadingPackedBoxes.set(false);
        }
      });
  }

  private loadBoxesForShipment(shipmentNo: string): void {
    this.loadingBoxes.set(true);

    this.shipProductsService.getShipmentBoxes(shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxes) => {
          this.boxesData.set(boxes);
          this.loadingBoxes.set(false);
        },
        error: () => {
          this.boxesData.set([]);
          this.loadingBoxes.set(false);
        }
      });
  }

  onAddBox(): void {
    const boxId = this.boxIdInput?.trim();
    if (!boxId) return;

    const pending = this.pendingShipmentData();
    const shipment = this.shipmentData();

    if (pending) {
      this.addingBox.set(true);
      const dto: CreateShipmentDto = {
        consigneeId: pending.consigneeId,
        carrier: pending.carrier,
        trackNo: pending.trackNo,
        flightNo: pending.flightNo,
        shipmentType: 'RE',
        shipmentStatus: 'OP'
      };

      this.shipProductsService.createShipment(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const shipmentNo = response.data?.[0]?.shipmentNo;
            if (!shipmentNo) {
              this.snackbarService.showError('Failed to create shipment');
              this.addingBox.set(false);
              return;
            }

            this.pendingShipmentData.set(null);
            this.searchForm.patchValue({ shipmentNo }, { emitEvent: false });
            this.loadShipmentByNumber(shipmentNo);
            this.addBoxToExistingShipment(shipmentNo, boxId);
          },
          error: (err) => {
            this.snackbarService.showError(err.error?.message || 'Failed to create shipment');
            this.addingBox.set(false);
          }
        });
    } else if (shipment) {
      this.addingBox.set(true);
      this.addBoxToExistingShipment(shipment.shipmentNo, boxId);
    }
  }

  private addBoxToExistingShipment(shipmentNo: string, boxId: string): void {
    this.shipProductsService.addBoxToShipment(shipmentNo, boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.showSuccess('Box added to shipment');
            this.boxIdInput = '';
            this.loadBoxesForShipment(shipmentNo);
            const consigneeId = this.activeConsigneeId();
            if (consigneeId) this.loadPackedBoxes(consigneeId);
          } else {
            this.snackbarService.showError(response.message || 'Failed to add box');
          }
          this.addingBox.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(err.error?.message || 'Failed to add box. Box must be closed and not in another shipment.');
          this.addingBox.set(false);
        }
      });
  }

  onBoxRowAction(event: TableRowActionEvent<BoxDto>): void {
    const shipment = this.shipmentData();
    if (!shipment) return;

    this.shipProductsService.removeBoxFromShipment(shipment.shipmentNo, event.row.boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Box removed from shipment');
          this.loadBoxesForShipment(shipment.shipmentNo);
          this.loadPackedBoxes(shipment.consigneeId);
        },
        error: () => this.snackbarService.showError('Failed to remove box')
      });
  }

  onAddNewShipment(): void {
    const dialogRef = this.dialog.open(AddEditShipmentDialog, {
      width: '600px',
      data: { mode: 'add' },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.pendingData) {
        const pending: PendingShipmentData = {
          consigneeId: result.pendingData.consigneeId,
          consigneeName: result.consigneeInfo?.description || result.consigneeInfo?.label || '',
          address1: result.consigneeInfo?.address1 || '',
          city: result.consigneeInfo?.city || '',
          state: result.consigneeInfo?.state || '',
          country: result.consigneeInfo?.country || '',
          carrier: result.pendingData.carrier,
          carrierDescription: result.carrierInfo?.description || '',
          trackNo: result.pendingData.trackNo,
          flightNo: result.pendingData.flightNo
        };
        this.pendingShipmentData.set(pending);
        this.shipmentData.set(null);
        this.boxesData.set([]);
        this.error.set(null);
        this.loadPackedBoxes(pending.consigneeId);
        this.snackbarService.showSuccess('Shipment details saved. Add a box to create the shipment.');
      } else if (result?.shipmentNo) {
        this.searchForm.patchValue({ shipmentNo: result.shipmentNo });
      }
    });
  }

  onViewShippedBoxes(): void {
    const shipment = this.shipmentData();
    if (!shipment) {
      this.snackbarService.showError('Please select a shipment first');
      return;
    }
    this.dialog.open(ViewShippedBoxesDialog, {
      width: '50vw',
      height: '100vh',
      position: { right: '0', top: '0' },
      panelClass: 'right-side-panel',
      ariaLabel: 'View Shipped Boxes',
      data: { shipmentNo: shipment.shipmentNo }
    });
  }

  onViewConsigneesInSameZone(): void {
    const shipment = this.shipmentData();
    if (!shipment) {
      this.snackbarService.showError('Please select a shipment first');
      return;
    }
    this.dialog.open(ViewConsigneesSameZoneDialog, {
      width: '50vw',
      height: '100vh',
      position: { right: '0', top: '0' },
      panelClass: 'right-side-panel',
      ariaLabel: 'View Consignees in Same Zone',
      data: { consigneeId: shipment.consigneeId }
    });
  }

  onCompleteBoxEntry(): void {
    const shipment = this.shipmentData();
    if (!shipment || shipment.shipmentStatus !== 'OP') {
      this.snackbarService.showError('Only open shipments can be completed');
      return;
    }

    const dialogRef = this.dialog.open(PackListPrintDialog, {
      width: '500px', data: { shipmentNo: shipment.shipmentNo }, disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        const chargesRef = this.onOpenShipmentCharges(shipment, true, result.packListPrinterId);
        chargesRef.afterClosed().subscribe(chargesResult => {
          if (chargesResult) {
            this.onCancel();
          }
        });
      }
    });
  }

  private onOpenShipmentCharges(shipment: ShipmentDto, finalizeOnSave = false, packListPrinterId?: string): MatDialogRef<ShipmentChargesDialog> {
    const data: ShipmentChargesDialogData = {
      shipmentNo: shipment.shipmentNo,
      consigneeId: shipment.consigneeId,
      consigneeName: shipment.consigneeName || '',
      finalizeOnSave,
      boxCount: this.boxesData().length,
      packListPrinterId: packListPrinterId || null,
    };

    return this.dialog.open(ShipmentChargesDialog, {
      width: '754px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      disableClose: finalizeOnSave,
      autoFocus: 'first-tabbable',
      hasBackdrop: false,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data,
    });
  }

  protected formatChapterDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const m = moment.utc(dateStr);
    if (!m.isValid()) return dateStr;
    const local = this.chapterTimezoneService.convertGmtToLocal(m);
    return local.format('MM/DD/YY HH:mm');
  }

  onEditShipment(): void {
    const shipment = this.shipmentData();
    if (!shipment || shipment.shipmentStatus !== 'OP') return;

    const dialogRef = this.dialog.open(AddEditShipmentDialog, {
      width: '600px',
      data: { mode: 'edit', shipmentNo: shipment.shipmentNo },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadShipmentByNumber(shipment.shipmentNo);
      }
    });
  }

  onCancel(): void {
    this.searchForm.reset();
    this.shipmentData.set(null);
    this.pendingShipmentData.set(null);
    this.boxesData.set([]);
    this.packedBoxOptions.set([]);
    this.boxIdInput = '';
    this.error.set(null);
  }

  hasAnyFieldValue(): boolean {
    const formValues = this.searchForm.value;
    return !!(formValues.shipmentNo || formValues.consigneeId || formValues.carrier)
      || this.hasShipmentData();
  }

  onBoxIdInputChange(value: string): void {
    this.boxIdInput = value;
    this.boxIdSearchText.set(value || '');
  }

  onClear(): void {
    this.onCancel();
    this.shipmentSearchCtrl.setValue('');
    this.consigneeSearchCtrl.setValue('');
    this.carrierSearchCtrl.setValue('');
  }

  get f() { return this.searchForm.controls; }
}
