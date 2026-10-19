import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import {
  UnitIdFieldComponent,
  UnitValidationResponse as SharedUnitValidationResponse,
  UnitIdPostValidateEvent
} from '@shared/components/unit-id-field';

import { CheckinDiscardProductsService } from './services/checkin-discard-products.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import {
  CheckedInProduct,
  ProductCodeItem,
  AboTypeItem,
  WarehouseItem,
  DeviceItem,
  RackItem,
  TrayItem,
  DiscardUnitVerifyResponse,
  CheckinProductRequest
} from './models/checkin-discard-products.model';
import { CheckinExpiredWarningDialog } from './checkin-expired-warning-dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

interface ValidatedUnitData {
  unitId: string;
  collDate: string;
}

@Component({
  selector: 'app-checkin-discard-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent
  ],
  templateUrl: './checkin-discard-products.html',
  styleUrls: ['./checkin-discard-products.scss']
})
export class CheckinDiscardProducts implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `checkin-discard-products-${CheckinDiscardProducts.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CheckinDiscardProductsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);

  private destroy$ = new Subject<void>();

  // Data signals
  protected readonly inventoryData = signal<CheckedInProduct[]>([]);
  protected readonly validatedUnit = signal<ValidatedUnitData | null>(null);
  protected readonly productCodes = signal<ProductCodeItem[]>([]);
  protected readonly aboTypes = signal<AboTypeItem[]>([]);
  protected readonly resolvedAliquot = signal<string | null>(null);
  protected readonly aliquotOptions = signal<string[] | null>(null);
  protected readonly warehouses = signal<WarehouseItem[]>([]);
  protected readonly devices = signal<DeviceItem[]>([]);
  protected readonly racks = signal<RackItem[]>([]);
  protected readonly trays = signal<TrayItem[]>([]);

  // Loading signals
  protected readonly isLoadingProductCodes = signal<boolean>(false);
  protected readonly isLoadingAboTypes = signal<boolean>(false);
  protected readonly isLoadingLocation = signal<boolean>(false);
  protected readonly isCheckingIn = signal<boolean>(false);

  // Context signals
  protected readonly storageClass = signal<string>('');
  protected readonly inventoryClass = signal<string>('');
  protected readonly currentProductType = signal<string>('');
  protected readonly currentDeviceType = signal<string>('');
  protected readonly isPoolProduct = signal<boolean>(false);

  private selectedShelfNumber = '';

  // Search controls
  productCodeSearchControl = new FormControl('');
  aboSearchControl = new FormControl('');
  warehouseSearchControl = new FormControl('');

  // Filtered options
  protected readonly filteredProductCodes = signal<ProductCodeItem[]>([]);
  protected readonly filteredAboTypes = signal<AboTypeItem[]>([]);
  protected readonly filteredWarehouses = signal<WarehouseItem[]>([]);

  // Computed
  protected readonly isEmpty = computed(() => this.inventoryData().length === 0 && !this.isCheckingIn());

  filterForm!: FormGroup;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'Move products from discard to available inventory'
        };
      }
    });
  }

  tableConfig: DataTableConfig<CheckedInProduct> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true },
      {
        key: 'collDate',
        header: 'Collection Date',
        sortable: false,
        type: 'date',
        valueFormatter: (value: string) => {
          if (!value) return '-';
          const date = new Date(value);
          return date.toLocaleDateString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric'
          }).toUpperCase().replace(/,/g, '-').replace(/ /g, '-');
        }
      },
      { key: 'productCode', header: 'Product Code', sortable: false },
      { key: 'aboRh', header: 'ABORh', sortable: false },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        sortable: false,
        type: 'date',
        valueFormatter: (value: string) => {
          if (!value) return '-';
          const date = new Date(value);
          const datePart = date.toLocaleDateString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric'
          }).toUpperCase().replace(/,/g, '-').replace(/ /g, '-');
          const timePart = date.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
          });
          return `${datePart} ${timePart}`;
        }
      },
      { key: 'warehouseId', header: 'Warehouse ID', sortable: false },
      { key: 'deviceNumber', header: 'Device Number', sortable: false },
      { key: 'rackNumber', header: 'Rack Number', sortable: false },
      { key: 'trayNumber', header: 'Tray Number', sortable: false }
    ],
    showPagination: false,
    stickyHeader: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin',
    noDataIcon: 'search'
  };

  ngOnInit(): void {
    this.initForm();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      productCode: [''],
      aboRh: [''],
      warehouseId: [''],
      deviceNumber: [''],
      rackNumber: [''],
      trayNumber: ['']
    });
  }

  private setupSearchFilters(): void {
    this.productCodeSearchControl.valueChanges
      .pipe(startWith(''), map(s => s?.toLowerCase() || ''), takeUntil(this.destroy$))
      .subscribe(term => {
        this.filteredProductCodes.set(
          this.productCodes().filter(p =>
            p.productCode.toLowerCase().includes(term) ||
            p.productType.toLowerCase().includes(term)
          )
        );
      });

    this.aboSearchControl.valueChanges
      .pipe(startWith(''), map(s => s?.toLowerCase() || ''), takeUntil(this.destroy$))
      .subscribe(term => {
        this.filteredAboTypes.set(
          this.aboTypes().filter(a =>
            a.aboDesc.toLowerCase().includes(term) ||
            a.bloodType.toLowerCase().includes(term)
          )
        );
      });

    this.warehouseSearchControl.valueChanges
      .pipe(startWith(''), map(s => s?.toLowerCase() || ''), takeUntil(this.destroy$))
      .subscribe(term => {
        this.filteredWarehouses.set(
          this.warehouses().filter(w =>
            w.warehouseId.toLowerCase().includes(term) ||
            w.description.toLowerCase().includes(term)
          )
        );
      });
  }

  get f() {
    return this.filterForm.controls;
  }

  // --- Unit ID field handlers (shared component) ---

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;
    this.service.verifyDiscardUnit(parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && (response.item || response.data)) {
            const data = (response.item || response.data) as DiscardUnitVerifyResponse;
            this.validatedUnit.set({ unitId: data.unitId, collDate: data.collDate });
            event.confirm();
          } else {
            event.reject(response.message || 'Invalid unit for this function');
          }
        },
        error: (err) => {
          const msg = err.error?.message || err.error?.errorResponse?.error || 'Invalid unit for this function';
          event.reject(msg);
        }
      });
  }

  onUnitValidated(_data: SharedUnitValidationResponse): void {
    this.loadProductCodes();
  }

  onUnitCleared(): void {
    this.validatedUnit.set(null);
    this.resetProductFields();
  }

  private loadProductCodes(): void {
    const unit = this.validatedUnit();
    if (!unit) return;

    this.isLoadingProductCodes.set(true);
    this.service.getProductCodes(unit.unitId, unit.collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const codes = response.item || response.data || [];
          this.productCodes.set(codes as ProductCodeItem[]);
          this.filteredProductCodes.set(codes as ProductCodeItem[]);
          this.isLoadingProductCodes.set(false);
          if ((codes as ProductCodeItem[]).length === 0) {
            this.showError('No available products for this unit');
          }
        },
        error: (err) => {
          this.showError(err.error?.message || 'Failed to load product codes');
          this.isLoadingProductCodes.set(false);
          this.productCodes.set([]);
          this.filteredProductCodes.set([]);
        }
      });
  }

  onProductCodeSelected(): void {
    const productCode = this.f['productCode'].value;
    const unit = this.validatedUnit();
    if (!productCode || !unit) return;

    const selectedProduct = this.productCodes().find(p => p.productCode === productCode);
    if (selectedProduct) {
      this.currentProductType.set(selectedProduct.productType);
    }

    this.filterForm.patchValue({ aboRh: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' });
    this.aboTypes.set([]);
    this.filteredAboTypes.set([]);
    this.resetLocationFields();
    this.loadAboTypes();
  }

  private loadAboTypes(): void {
    const unit = this.validatedUnit();
    const productCode = this.f['productCode'].value;
    if (!unit || !productCode) return;

    this.isLoadingAboTypes.set(true);
    this.service.getAboTypes(unit.unitId, unit.collDate, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.item || response.data;
          if (data) {
            const aboData = data as any;
            this.resolvedAliquot.set(aboData.aliquot || null);
            this.aliquotOptions.set(aboData.aliquotOptions || null);
            const types = aboData.aboTypes || [];
            this.aboTypes.set(types);
            this.filteredAboTypes.set(types);

            if (aboData.isPool) {
              this.isPoolProduct.set(true);
              this.filterForm.patchValue({ aboRh: 'PO' });
              this.loadLocationDefaults();
            } else if (types.length === 1) {
              this.filterForm.patchValue({ aboRh: types[0].bloodType });
              this.onAboSelected();
            }
          }
          this.isLoadingAboTypes.set(false);
        },
        error: (err) => {
          this.showError(err.error?.message || 'Failed to load ABO types');
          this.isLoadingAboTypes.set(false);
        }
      });
  }

  onAboSelected(): void {
    const bloodType = this.f['aboRh'].value;
    if (!bloodType) return;
    this.loadLocationDefaults();
  }

  private loadLocationDefaults(): void {
    const unit = this.validatedUnit();
    const productCode = this.f['productCode'].value;
    const bloodType = this.f['aboRh'].value;
    const aliquot = this.resolvedAliquot() || '';
    if (!unit || !productCode || !bloodType) return;

    this.isLoadingLocation.set(true);
    this.service.getLocationDefaults(
      this.currentProductType(), bloodType, unit.unitId,
      unit.collDate, productCode, aliquot
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.item || response.data;
          if (data) {
            const loc = data as any;
            this.storageClass.set(loc.storageClass || '');
            this.inventoryClass.set(loc.inventoryClass || '');
            this.warehouses.set(loc.warehouses || []);
            this.filteredWarehouses.set(loc.warehouses || []);
            this.devices.set(loc.devices || []);
            this.racks.set(loc.racks || []);
            this.currentDeviceType.set(loc.defaultDeviceType || '');

            const noLocationDevice = (loc.devices || []).find((d: any) => d.deviceType === 'N');
            if (noLocationDevice) {
              this.filterForm.patchValue({ warehouseId: loc.defaultWarehouseId || '' });
              this.isLoadingLocation.set(false);
              this.handleNoLocationDevice();
              return;
            }

            this.filterForm.patchValue({
              warehouseId: loc.defaultWarehouseId || '',
              deviceNumber: loc.defaultDeviceNumber || '',
              rackNumber: loc.defaultRackNumber || ''
            });

            if (loc.devices?.length === 0) {
              this.showError('Error 0359: No product storage found for this warehouse and product type');
            } else if (loc.defaultWarehouseId && loc.defaultDeviceNumber && loc.defaultRackNumber) {
              this.loadTrays(loc.defaultWarehouseId, loc.defaultDeviceType || '', loc.defaultDeviceNumber, loc.defaultRackNumber);
            }
          }
          this.isLoadingLocation.set(false);
        },
        error: (err) => {
          this.showError(err.error?.message || 'Failed to load location defaults');
          this.isLoadingLocation.set(false);
        }
      });
  }

  onWarehouseChanged(): void {
    const warehouseId = this.f['warehouseId'].value;
    if (!warehouseId) return;

    this.filterForm.patchValue({ deviceNumber: '', rackNumber: '', trayNumber: '' });
    this.racks.set([]);
    this.trays.set([]);
    this.service.getDevices(warehouseId, this.currentProductType())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = (response.item || response.data || []) as DeviceItem[];
          this.devices.set(data);

          const noLocationDevice = data.find(d => d.deviceType === 'N');
          if (noLocationDevice) {
            this.handleNoLocationDevice();
            return;
          }

          if (data.length === 0) {
            this.showError('Error 0359: No product storage found for this warehouse and product type');
          } else if (data.length === 1) {
            this.filterForm.patchValue({ deviceNumber: data[0].deviceNumber });
            this.currentDeviceType.set(data[0].deviceType);
            this.onDeviceChanged();
          }
        },
        error: () => this.showError('Failed to load devices')
      });
  }

  onDeviceChanged(): void {
    const warehouseId = this.f['warehouseId'].value;
    const deviceNumber = this.f['deviceNumber'].value;
    const bloodType = this.f['aboRh'].value;
    if (!warehouseId || !deviceNumber) return;

    const selectedDevice = this.devices().find(d => d.deviceNumber === deviceNumber);
    if (selectedDevice) {
      this.currentDeviceType.set(selectedDevice.deviceType);
    }

    this.filterForm.patchValue({ rackNumber: '', trayNumber: '' });
    this.trays.set([]);
    this.service.getRacks(
      warehouseId, this.currentDeviceType(), deviceNumber,
      this.storageClass(), this.currentProductType(), bloodType
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.item || response.data || [];
          this.racks.set(data as RackItem[]);
        },
        error: () => this.showError('Failed to load racks')
      });
  }

  onRackChanged(): void {
    const warehouseId = this.f['warehouseId'].value;
    const deviceNumber = this.f['deviceNumber'].value;
    const rackNumber = this.f['rackNumber'].value;
    if (!warehouseId || !deviceNumber || !rackNumber) return;

    this.filterForm.patchValue({ trayNumber: '' });
    this.loadTrays(warehouseId, this.currentDeviceType(), deviceNumber, rackNumber);
  }

  private loadTrays(warehouseId: string, deviceType: string, deviceNumber: string, rackNumber: string): void {
    this.trays.set([]);
    this.service.getTrays(warehouseId, deviceType, deviceNumber, rackNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.item || response.data || [];
          this.trays.set(data as TrayItem[]);
        },
        error: () => this.showError('Failed to load trays')
      });
  }

  onTrayChanged(): void {
    const trayNumber = this.f['trayNumber'].value;
    if (!trayNumber) return;

    const selectedTray = this.trays().find(t => t.trayNumber === trayNumber);
    this.selectedShelfNumber = selectedTray?.shelfNumber || '';

    if (this.canCheckin()) {
      this.performCheckin(false);
    }
  }

  private handleNoLocationDevice(): void {
    this.filterForm.patchValue({
      warehouseId: '',
      deviceNumber: '',
      rackNumber: '',
      trayNumber: ''
    });
    this.devices.set([]);
    this.racks.set([]);
    this.trays.set([]);
    this.currentDeviceType.set('N');
    this.performCheckinNoLocation();
  }

  private performCheckinNoLocation(): void {
    const unit = this.validatedUnit();
    if (!unit) return;

    const request: CheckinProductRequest = {
      unitId: unit.unitId,
      collDate: unit.collDate,
      productCode: this.f['productCode'].value,
      aliquot: this.resolvedAliquot() || '',
      bloodType: this.f['aboRh'].value,
      warehouseId: '',
      deviceNumber: '',
      deviceType: 'N',
      rackNumber: '',
      shelfNumber: '',
      trayNumber: '',
      forceExpired: false,
      forceOverCapacity: false
    };

    this.isCheckingIn.set(true);
    this.service.checkinProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && (response.item || response.data)) {
            const item = (response.item || response.data) as CheckedInProduct;
            this.inventoryData.set([item, ...this.inventoryData()]);
            this.showSuccess(response.message || 'Product checked in successfully (no location)');
            this.clearForm();
          } else {
            this.showError(response.message || 'Failed to check in product');
          }
          this.isCheckingIn.set(false);
        },
        error: (err) => {
          const errorCode = err.error?.errorCode || err.error?.errorResponse?.errorCode;
          if (errorCode === '5106' || err.error?.errorResponse?.isWarning) {
            this.isCheckingIn.set(false);
            this.showExpiredWarningForNoLocation();
          } else {
            this.showError(HttpErrorHandler.extractErrorMessage(err, 'Failed to check in product'));
            this.isCheckingIn.set(false);
          }
        }
      });
  }

  private showExpiredWarningForNoLocation(): void {
    const dialogRef = this.dialog.open(CheckinExpiredWarningDialog, {
      width: '480px',
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          const unit = this.validatedUnit();
          if (!unit) return;
          const request: CheckinProductRequest = {
            unitId: unit.unitId,
            collDate: unit.collDate,
            productCode: this.f['productCode'].value,
            aliquot: this.resolvedAliquot() || '',
            bloodType: this.f['aboRh'].value,
            warehouseId: '',
            deviceNumber: '',
            deviceType: 'N',
            rackNumber: '',
            shelfNumber: '',
            trayNumber: '',
            forceExpired: true,
            forceOverCapacity: false
          };
          this.isCheckingIn.set(true);
          this.service.checkinProduct(request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (response) => {
                if (response.success && (response.item || response.data)) {
                  const item = (response.item || response.data) as CheckedInProduct;
                  this.inventoryData.set([item, ...this.inventoryData()]);
                  this.showSuccess(response.message || 'Product checked in successfully (no location)');
                  this.clearForm();
                } else {
                  this.showError(response.message || 'Failed to check in product');
                }
                this.isCheckingIn.set(false);
              },
              error: (err) => {
                this.showError(HttpErrorHandler.extractErrorMessage(err, 'Failed to check in product'));
                this.isCheckingIn.set(false);
              }
            });
        }
      });
  }

  private canCheckin(): boolean {
    const unit = this.validatedUnit();
    return !!(
      unit &&
      this.f['productCode'].value &&
      this.f['aboRh'].value &&
      this.f['warehouseId'].value &&
      this.f['trayNumber'].value &&
      !this.isCheckingIn()
    );
  }

  private performCheckin(forceExpired: boolean, forceOverCapacity = false): void {
    const unit = this.validatedUnit();
    if (!unit) return;

    const request: CheckinProductRequest = {
      unitId: unit.unitId,
      collDate: unit.collDate,
      productCode: this.f['productCode'].value,
      aliquot: this.resolvedAliquot() || '',
      bloodType: this.f['aboRh'].value,
      warehouseId: this.f['warehouseId'].value,
      deviceNumber: this.f['deviceNumber'].value || '',
      deviceType: this.currentDeviceType(),
      rackNumber: this.f['rackNumber'].value || '',
      shelfNumber: this.selectedShelfNumber,
      trayNumber: this.f['trayNumber'].value,
      forceExpired,
      forceOverCapacity
    };

    this.isCheckingIn.set(true);
    this.service.checkinProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && (response.item || response.data)) {
            const item = (response.item || response.data) as CheckedInProduct;
            this.inventoryData.set([item, ...this.inventoryData()]);
            this.showSuccess(response.message || 'Product checked in successfully');
            this.clearForm();
          } else {
            this.showError(response.message || 'Failed to check in product');
          }
          this.isCheckingIn.set(false);
        },
        error: (err) => {
          const errorCode = err.error?.errorCode || err.error?.errorResponse?.errorCode;
          if (errorCode === '5106' || err.error?.errorResponse?.isWarning) {
            this.isCheckingIn.set(false);
            this.showExpiredWarning();
          } else if (errorCode === 'TRAY_FULL') {
            this.isCheckingIn.set(false);
            this.showTrayFullWarning();
          } else {
            this.showError(HttpErrorHandler.extractErrorMessage(err, 'Failed to check in product'));
            this.isCheckingIn.set(false);
          }
        }
      });
  }

  private showExpiredWarning(): void {
    const dialogRef = this.dialog.open(CheckinExpiredWarningDialog, {
      width: '480px',
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.performCheckin(true);
        }
      });
  }

  private showTrayFullWarning(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '480px',
      disableClose: true,
      data: {
        title: 'Warning: Tray is full',
        message: 'Tray is at capacity. Do you want to continue?',
        confirmText: 'YES CONTINUE',
        cancelText: 'NO'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.performCheckin(false, true);
        }
      });
  }

  clearForm(): void {
    this.filterForm.reset();
    this.unitIdField?.clear();
    this.validatedUnit.set(null);
    this.selectedShelfNumber = '';
    this.resetProductFields();
  }

  private resetProductFields(): void {
    this.filterForm.patchValue({ productCode: '', aboRh: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' });
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.aboTypes.set([]);
    this.filteredAboTypes.set([]);
    this.resolvedAliquot.set(null);
    this.aliquotOptions.set(null);
    this.isPoolProduct.set(false);
    this.resetLocationFields();
  }

  private resetLocationFields(): void {
    this.warehouses.set([]);
    this.filteredWarehouses.set([]);
    this.devices.set([]);
    this.racks.set([]);
    this.trays.set([]);
    this.storageClass.set('');
    this.inventoryClass.set('');
    this.currentDeviceType.set('');
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };

    const data = [...this.inventoryData()];
    if (event.direction === 'default') {
      return;
    }

    data.sort((a, b) => {
      const valA = (a as any)[event.column] ?? '';
      const valB = (b as any)[event.column] ?? '';
      const cmp = String(valA).localeCompare(String(valB));
      return event.direction === 'A' ? cmp : -cmp;
    });
    this.inventoryData.set(data);
  }

  onDropdownOpened(isOpen: boolean): void {
    if (isOpen) {
      this.productCodeSearchControl.setValue('');
      this.aboSearchControl.setValue('');
      this.warehouseSearchControl.setValue('');
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
      politeness: 'assertive'
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

}
