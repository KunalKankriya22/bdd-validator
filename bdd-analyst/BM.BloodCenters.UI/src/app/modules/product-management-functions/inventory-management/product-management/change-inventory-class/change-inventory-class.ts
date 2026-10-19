import { Component, OnInit, OnDestroy, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, SortConfig } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { ChangeInventoryClassService } from './services/change-inventory-class.service';
import {
  ChangeInventoryClassProductDto,
  ChangeInventoryClassEntry,
  WarehouseDto,
  DeviceDto,
  RackDto,
  TrayDto,
  InventoryClassDto,
} from './models/change-inventory-class.model';

@Component({
  selector: 'app-change-inventory-class',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './change-inventory-class.html',
  styleUrls: ['./change-inventory-class.scss'],
})
export class ChangeInventoryClassComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `change-inventory-class-${ChangeInventoryClassComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly service = inject(ChangeInventoryClassService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();
  private readonly dialog = inject(MatDialog);

  protected readonly entries = signal<ChangeInventoryClassEntry[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly gridPageSize = signal<number>(25);
  protected readonly gridPageIndex = signal<number>(0);
  protected readonly currentSort = signal<SortConfig>({ column: '', direction: 'default' });
  protected readonly sortedEntries = computed(() => {
    const data = [...this.entries()];
    const sort = this.currentSort();
    if (!sort.column || sort.direction === 'default') return data;
    return data.sort((a, b) => {
      const valA = ((a as any)[sort.column] || '').toString().toLowerCase();
      const valB = ((b as any)[sort.column] || '').toString().toLowerCase();
      const cmp = valA.localeCompare(valB);
      return sort.direction === 'A' ? cmp : -cmp;
    });
  });
  protected readonly pagedData = computed(() => {
    const start = this.gridPageIndex() * this.gridPageSize();
    return this.sortedEntries().slice(start, start + this.gridPageSize());
  });

  protected inventoryClasses = signal<InventoryClassDto[]>([]);
  protected warehouses = signal<WarehouseDto[]>([]);
  protected devices = signal<DeviceDto[]>([]);
  protected racks = signal<RackDto[]>([]);
  protected trays = signal<TrayDto[]>([]);

  protected filteredProducts = signal<ChangeInventoryClassProductDto[]>([]);
  protected filteredInventoryClasses = signal<InventoryClassDto[]>([]);
  protected filteredWarehouses = signal<WarehouseDto[]>([]);
  protected filteredDevices = signal<DeviceDto[]>([]);
  protected filteredRacks = signal<RackDto[]>([]);
  protected filteredTrays = signal<TrayDto[]>([]);

  protected productSearchCtrl = new FormControl('');
  protected newClassSearchCtrl = new FormControl('');
  protected warehouseSearchCtrl = new FormControl('');
  protected deviceSearchCtrl = new FormControl('');
  protected rackSearchCtrl = new FormControl('');
  protected traySearchCtrl = new FormControl('');

  protected products = signal<ChangeInventoryClassProductDto[]>([]);
  protected selectedProduct: ChangeInventoryClassProductDto | null = null;
  protected selectedProductKey = '';
  protected productCode = '';
  protected productType = '';
  protected aboRh = '--';
  protected expirationDateTime = '--';
  protected currentClass = '--';
  protected newClass = '';
  protected warehouseId = '';
  protected deviceNo = '';
  protected deviceType = '';
  protected rackNo = '';
  protected trayNo = '';
  protected unitScannedWarning = '';
  protected parsedUnitId = '';
  protected codeScheme: string = 'I';
  protected collectionDate = '--';
  protected locationRequired = true;

  protected readonly pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Change Inventory Class', link: null },
    ],
  };

  protected tableConfig: DataTableConfig<ChangeInventoryClassEntry> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true },
      { key: 'product', header: 'Product' },
      { key: 'aboRh', header: 'ABORh' },
      { key: 'expirationDate', header: 'Expiration Date' },
      { key: 'collectionDate', header: 'Collection Date' },
      { key: 'currentClass', header: 'Current Class' },
      { key: 'newClass', header: 'New Class' },
      { key: 'warehouseId', header: 'Warehouse ID' },
      { key: 'deviceNo', header: 'Device No.' },
      { key: 'rackNo', header: 'Rack No.' },
      { key: 'trayNo', header: 'Tray No.' },
    ],
    showPagination: true,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin.',
    noDataIcon: 'search',
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
    },
  };

  ngOnInit(): void {
    this.updateTableHeader();
    this.loadInventoryClasses();
    this.loadWarehouses();
    this.subscribeToChapterChanges();
    this.subscribeToSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitPostValidate(event: any): void {
    this.unitScannedWarning = '';
    const unitId = event.data?.parsedUnitId;
    if (!unitId) {
      event.reject?.('Invalid unit ID');
      return;
    }

    const alreadyScanned = this.entries().some(
      (e) => e.unitId.toUpperCase() === unitId.toUpperCase(),
    );

    this.loading.set(true);
    this.service
      .getProducts(unitId, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productList: ChangeInventoryClassProductDto[]) => {
          if (!productList || productList.length === 0) {
            this.loading.set(false);
            event.reject?.('No available products found');
            return;
          }

          this.parsedUnitId = unitId;
          this.codeScheme = event.data?.codeScheme || 'I';
          this.products.set(productList);
          this.filteredProducts.set(productList);

          if (alreadyScanned) {
            this.unitScannedWarning = 'This Unit ID has been scanned';
          }

          this.loading.set(false);
          event.confirm?.();
        },
        error: (err: any) => {
          const errorMessage =
            err.error?.message || 'Failed to fetch product details';
          this.loading.set(false);
          event.reject?.(errorMessage);
        },
      });
  }

  onUnitValidated(_event: any): void {
    // Unit validated — focus moves to product/New Class dropdown
  }

  protected onProductChange(): void {
    const product = this.products().find(
      (p) => `${p.productCode}:${p.aliquot}` === this.selectedProductKey,
    );
    if (product) {
      this.selectProduct(product);
    }
  }

  private selectProduct(product: ChangeInventoryClassProductDto): void {
    this.selectedProduct = product;
    this.selectedProductKey = `${product.productCode}:${product.aliquot}`;
    this.productCode = product.productCode || '';
    this.productType = product.productType || '';
    this.aboRh = product.bloodTypeDesc || product.bloodType || '--';
    this.expirationDateTime = product.expDate
      ? this.formatDate(product.expDate)
      : '--';
    this.currentClass = product.currentInvClass || '--';
    this.locationRequired = product.locationRequired !== false;
    this.collectionDate = product.collDate ? this.formatDate(product.collDate) : '--';

    if (product.productCode && product.aliquot && product.collDate) {
      this.service
        .preCheckInterdiction(
          this.parsedUnitId,
          product.productCode,
          product.aliquot,
          product.collDate,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {},
          error: (err: any) => {
            const errorMessage = this.extractErrorMessage(err.error, 'Product has an interdiction');
            this.showError(errorMessage);
          },
        });
    }

    if (product.warehouseId) {
      this.warehouseId = product.warehouseId;
      this.onWarehouseChange();
    }
  }

  hasChanges(): boolean {
    return !!(
      this.parsedUnitId ||
      this.productCode ||
      this.newClass ||
      this.warehouseId ||
      this.deviceNo ||
      this.rackNo ||
      this.trayNo
    );
  }

  onClear(): void {
    this.resetEntryFields();
    this.unitIdField?.clear();
  }

  onUnitFieldFocus(): void {
    this.unitScannedWarning = '';
  }

  onUnitCleared(): void {
    this.resetEntryFields();
  }

  onNewClassChange(): void {
    if (this.newClass && this.currentClass !== '--' &&
        this.newClass.toUpperCase() === this.currentClass.toUpperCase()) {
      this.showError('New inventory class cannot be the same as the current class.');
      this.newClass = '';
      return;
    }
    if (this.warehouseId && this.deviceNo && this.deviceType) {
      this.rackNo = '';
      this.trayNo = '';
      this.racks.set([]);
      this.trays.set([]);
      this.filteredRacks.set([]);
      this.filteredTrays.set([]);
      this.rackSearchCtrl.setValue('', { emitEvent: false });
      this.traySearchCtrl.setValue('', { emitEvent: false });

      this.service
        .getRacks(
          this.warehouseId,
          this.deviceType,
          this.deviceNo,
          this.newClass || undefined,
          this.productType || undefined,
          this.selectedProduct?.bloodType || undefined,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.racks.set(data);
            this.filteredRacks.set(data);
          },
          error: () => {
            this.racks.set([]);
            this.filteredRacks.set([]);
          },
        });
    }
  }

  onRackChange(): void {
    this.trayNo = '';
    this.trays.set([]);
    this.filteredTrays.set([]);
    this.traySearchCtrl.setValue('', { emitEvent: false });

    if (this.warehouseId && this.deviceType && this.deviceNo && this.rackNo) {
      this.service
        .getTrays(
          this.warehouseId,
          this.deviceType,
          this.deviceNo,
          this.rackNo,
          this.productType || undefined,
          this.selectedProduct?.bloodType || undefined,
          this.codeScheme || undefined,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.trays.set(data);
            this.filteredTrays.set(data);
            if (data.length === 1) {
              this.trayNo = data[0].trayId;
              this.onTrayNoEnter();
            }
          },
          error: () => {
            this.trays.set([]);
            this.filteredTrays.set([]);
          },
        });
    }
  }

  onTrayNoEnter(): void {
    if (!this.loading() && this.canSave()) {
      this.showVerificationDialog();
    }
  }

  private canSave(): boolean {
    if (!this.parsedUnitId || !this.newClass || !this.selectedProduct) return false;
    if (!this.locationRequired) return true;
    return !!(this.warehouseId && this.deviceNo && this.rackNo && this.trayNo);
  }

  onWarehouseChange(): void {
    this.deviceNo = '';
    this.deviceType = '';
    this.rackNo = '';
    this.devices.set([]);
    this.racks.set([]);
    this.filteredDevices.set([]);
    this.filteredRacks.set([]);
    this.deviceSearchCtrl.setValue('', { emitEvent: false });
    this.rackSearchCtrl.setValue('', { emitEvent: false });

    if (this.warehouseId) {
      this.service
        .getDevices(this.warehouseId, this.productType || undefined)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.devices.set(data);
            this.filteredDevices.set(data);
            if (data.length === 1) {
              this.deviceNo = data[0].deviceId;
              this.deviceType = data[0].deviceType || '';
              this.onDeviceChange();
            }
          },
          error: () => {
            this.devices.set([]);
            this.filteredDevices.set([]);
          },
        });
    }
  }

  onDeviceChange(): void {
    this.rackNo = '';
    this.trayNo = '';
    this.racks.set([]);
    this.trays.set([]);
    this.filteredRacks.set([]);
    this.filteredTrays.set([]);
    this.rackSearchCtrl.setValue('', { emitEvent: false });
    this.traySearchCtrl.setValue('', { emitEvent: false });

    const selectedDevice = this.devices().find((d) => d.deviceId === this.deviceNo);
    if (selectedDevice) {
      this.deviceType = selectedDevice.deviceType || '';
    }

    if (this.warehouseId && this.deviceNo) {
      this.service
        .getRacks(
          this.warehouseId,
          this.deviceType,
          this.deviceNo,
          this.newClass || undefined,
          this.productType || undefined,
          this.selectedProduct?.bloodType || undefined,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.racks.set(data);
            this.filteredRacks.set(data);
            if (data.length === 1) {
              this.rackNo = data[0].rackId;
              this.onRackChange();
            }
          },
          error: () => {
            this.racks.set([]);
            this.filteredRacks.set([]);
          },
        });
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetEntryFields();
        this.entries.set([]);
        this.updateTableHeader();
        this.unitIdField?.clear();
        this.devices.set([]);
        this.racks.set([]);
        this.loadInventoryClasses();
        this.loadWarehouses();
      });
  }

  private loadInventoryClasses(): void {
    this.service
      .getInventoryClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const allowed = data.filter(cls => ['AD', 'RE', 'SP'].includes(cls.code?.toUpperCase()));
          this.inventoryClasses.set(allowed);
          this.filteredInventoryClasses.set(allowed);
        },
        error: () => {
          this.inventoryClasses.set([]);
          this.filteredInventoryClasses.set([]);
        },
      });
  }

  private loadWarehouses(): void {
    this.service
      .getWarehouses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.warehouses.set(data);
          this.filteredWarehouses.set(data);
          const userWarehouse = this.headerService.warehouseId?.() || '';
          if (userWarehouse && data.some(wh => wh.warehouseId === userWarehouse)) {
            this.warehouseId = userWarehouse;
            this.onWarehouseChange();
          }
        },
        error: () => {
          this.warehouses.set([]);
          this.filteredWarehouses.set([]);
        },
      });
  }

  private saveEntry(): void {
    if (!this.parsedUnitId || !this.newClass) return;

    const savedLocation = {
      warehouseId: this.warehouseId,
      deviceNo: this.deviceNo,
      deviceType: this.deviceType,
      rackNo: this.rackNo,
      trayNo: this.trayNo,
      devices: this.devices(),
      racks: this.racks(),
      trays: this.trays(),
      filteredDevices: this.filteredDevices(),
      filteredRacks: this.filteredRacks(),
      filteredTrays: this.filteredTrays(),
    };

    this.loading.set(true);
    this.service
      .changeInventoryClass(this.parsedUnitId, {
        newClass: this.newClass,
        newLocation: this.trayNo || null,
        productCode: this.selectedProduct?.productCode || null,
        aliquot: this.selectedProduct?.aliquot ?? null,
        collDate: this.selectedProduct?.collDate || null,
        codeScheme: this.codeScheme,
        warehouseId: this.warehouseId || null,
        deviceType: this.deviceType || null,
        deviceNumber: this.deviceNo || null,
        rackNumber: this.rackNo || null,
        trayNumber: this.trayNo || null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isWarning) {
            this.loading.set(false);
            this.showTrayFullConfirmation(response.message || 'Tray is full. Do you want to continue?');
            return;
          }
          if (response.success) {
            const entry: ChangeInventoryClassEntry = {
              unitId: this.parsedUnitId,
              product: this.productCode,
              aboRh: this.aboRh,
              expirationDate: this.expirationDateTime,
              collectionDate: this.collectionDate,
              currentClass: this.currentClass,
              newClass: this.newClass,
              warehouseId: this.warehouseId,
              deviceNo: this.deviceNo,
              rackNo: this.rackNo,
              trayNo: this.trayNo,
            };

            this.entries.update((current) => [entry, ...current]);
            this.updateTableHeader();
            this.showSuccess(`${this.entries().length} Entries saved`);
            this.resetEntryFields();
            this.unitIdField?.clear();
            this.warehouseId = savedLocation.warehouseId;
            this.deviceNo = savedLocation.deviceNo;
            this.deviceType = savedLocation.deviceType;
            this.rackNo = savedLocation.rackNo;
            this.trayNo = savedLocation.trayNo;
            this.devices.set(savedLocation.devices);
            this.racks.set(savedLocation.racks);
            this.trays.set(savedLocation.trays);
            this.filteredDevices.set(savedLocation.filteredDevices);
            this.filteredRacks.set(savedLocation.filteredRacks);
            this.filteredTrays.set(savedLocation.filteredTrays);
          } else {
            this.showError(this.extractErrorMessage(response, 'Failed to change inventory class'));
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          this.showError(this.extractErrorMessage(err.error, 'An error occurred while changing inventory class'));
          this.loading.set(false);
        },
      });
  }

  private resetEntryFields(): void {
    this.parsedUnitId = '';
    this.codeScheme = 'I';
    this.selectedProduct = null;
    this.products.set([]);
    this.filteredProducts.set([]);
    this.selectedProductKey = '';
    this.productCode = '';
    this.productType = '';
    this.aboRh = '--';
    this.expirationDateTime = '--';
    this.currentClass = '--';
    this.newClass = '';
    this.warehouseId = '';
    this.deviceNo = '';
    this.deviceType = '';
    this.rackNo = '';
    this.trayNo = '';
    this.unitScannedWarning = '';
    this.collectionDate = '--';
    this.locationRequired = true;
    this.devices.set([]);
    this.racks.set([]);
    this.trays.set([]);
    this.filteredDevices.set([]);
    this.filteredRacks.set([]);
    this.filteredTrays.set([]);

    this.productSearchCtrl.setValue('', { emitEvent: false });
    this.newClassSearchCtrl.setValue('', { emitEvent: false });
    this.warehouseSearchCtrl.setValue('', { emitEvent: false });
    this.deviceSearchCtrl.setValue('', { emitEvent: false });
    this.rackSearchCtrl.setValue('', { emitEvent: false });
    this.traySearchCtrl.setValue('', { emitEvent: false });
  }

  onPageChange(event: TablePageEvent): void {
    this.gridPageSize.set(event.pageSize);
    this.gridPageIndex.set(event.pageIndex);
  }

  onSortChange(event: TableSortEvent): void {
    this.currentSort.set({ column: event.column, direction: event.direction });
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.gridPageIndex.set(0);
    this.updateTableHeader();
  }

  private updateTableHeader(): void {
    const count = this.entries().length;
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableConfig.columns.map((col: any) =>
        col.key === 'unitId'
          ? { ...col, header: count > 0 ? `Unit ID (${count})` : 'Unit ID' }
          : col,
      ),
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: count,
        pageSize: this.gridPageSize(),
        pageIndex: this.gridPageIndex(),
      },
    };
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    try {
      const timezone = this.headerService.chapterTimeZone?.() || 'America/New_York';
      const parts = new Intl.DateTimeFormat('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: timezone,
      }).formatToParts(date);
      const day = parts.find(p => p.type === 'day')?.value;
      const month = parts.find(p => p.type === 'month')?.value?.toUpperCase();
      const year = parts.find(p => p.type === 'year')?.value;
      const hour = parts.find(p => p.type === 'hour')?.value;
      const minute = parts.find(p => p.type === 'minute')?.value;
      return `${day}-${month}-${year}, ${hour}:${minute}`;
    } catch {
      const day = date.getDate();
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}-${year}, ${hours}:${minutes}`;
    }
  }

  private subscribeToSearchFilters(): void {
    this.productSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredProducts.set(
          this.products().filter((p) =>
            (p.productCode || '').toLowerCase().includes(search),
          ),
        );
      });

    this.newClassSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredInventoryClasses.set(
          this.inventoryClasses().filter((cls) =>
            (cls.code || '').toLowerCase().includes(search) ||
            (cls.description || '').toLowerCase().includes(search),
          ),
        );
      });

    this.warehouseSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredWarehouses.set(
          this.warehouses().filter((wh) =>
            (wh.warehouseId || '').toLowerCase().includes(search),
          ),
        );
      });

    this.deviceSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredDevices.set(
          this.devices().filter((dev) =>
            (dev.deviceId || '').toLowerCase().includes(search),
          ),
        );
      });

    this.rackSearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredRacks.set(
          this.racks().filter((rack) =>
            (rack.rackId || '').toLowerCase().includes(search) ||
            (rack.rackName || '').toLowerCase().includes(search),
          ),
        );
      });

    this.traySearchCtrl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredTrays.set(
          this.trays().filter((tray) =>
            (tray.trayId || '').toLowerCase().includes(search) ||
            (tray.trayName || '').toLowerCase().includes(search),
          ),
        );
      });
  }

  private showVerificationDialog(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '450px',
      disableClose: true,
      data: {
        title: 'Verify Product Details',
        message: `Please confirm the following details are correct:`,
        detail: `ABORh: ${this.aboRh}\nExpiration Date: ${this.expirationDateTime}\nCollection Date: ${this.collectionDate}`,
        confirmText: 'CONFIRM',
        cancelText: 'CANCEL',
      } as ConfirmActionDialogData,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
      if (confirmed) {
        this.saveEntry();
      }
    });
  }

  private showTrayFullConfirmation(message: string): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Tray Full',
        message: message,
        confirmText: 'YES',
        cancelText: 'NO',
      } as ConfirmActionDialogData,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
      if (confirmed) {
        this.saveEntryForced();
      }
    });
  }

  private saveEntryForced(): void {
    if (!this.parsedUnitId || !this.newClass) return;

    const savedLocation = {
      warehouseId: this.warehouseId,
      deviceNo: this.deviceNo,
      deviceType: this.deviceType,
      rackNo: this.rackNo,
      trayNo: this.trayNo,
      devices: this.devices(),
      racks: this.racks(),
      trays: this.trays(),
      filteredDevices: this.filteredDevices(),
      filteredRacks: this.filteredRacks(),
      filteredTrays: this.filteredTrays(),
    };

    this.loading.set(true);
    this.service
      .changeInventoryClass(this.parsedUnitId, {
        newClass: this.newClass,
        newLocation: this.trayNo || null,
        productCode: this.selectedProduct?.productCode || null,
        aliquot: this.selectedProduct?.aliquot ?? null,
        collDate: this.selectedProduct?.collDate || null,
        codeScheme: this.codeScheme,
        warehouseId: this.warehouseId || null,
        deviceType: this.deviceType || null,
        deviceNumber: this.deviceNo || null,
        rackNumber: this.rackNo || null,
        trayNumber: this.trayNo || null,
        forceOverrideTrayFull: true,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const entry: ChangeInventoryClassEntry = {
              unitId: this.parsedUnitId,
              product: this.productCode,
              aboRh: this.aboRh,
              expirationDate: this.expirationDateTime,
              collectionDate: this.collectionDate,
              currentClass: this.currentClass,
              newClass: this.newClass,
              warehouseId: this.warehouseId,
              deviceNo: this.deviceNo,
              rackNo: this.rackNo,
              trayNo: this.trayNo,
            };
            this.entries.update((current) => [entry, ...current]);
            this.updateTableHeader();
            this.showSuccess(`${this.entries().length} Entries saved`);
            this.resetEntryFields();
            this.unitIdField?.clear();
            this.warehouseId = savedLocation.warehouseId;
            this.deviceNo = savedLocation.deviceNo;
            this.deviceType = savedLocation.deviceType;
            this.rackNo = savedLocation.rackNo;
            this.trayNo = savedLocation.trayNo;
            this.devices.set(savedLocation.devices);
            this.racks.set(savedLocation.racks);
            this.trays.set(savedLocation.trays);
            this.filteredDevices.set(savedLocation.filteredDevices);
            this.filteredRacks.set(savedLocation.filteredRacks);
            this.filteredTrays.set(savedLocation.filteredTrays);
          } else {
            this.showError(this.extractErrorMessage(response, 'Failed to change inventory class'));
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          this.showError(this.extractErrorMessage(err.error, 'An error occurred while changing inventory class'));
          this.loading.set(false);
        },
      });
  }

  private extractErrorMessage(err: any, defaultMessage: string): string {
    if (err?.errorResponse?.errorCode && err?.errorResponse?.error) {
      return `Error ${err.errorResponse.errorCode}: ${err.errorResponse.error}`;
    }
    if (err?.errorCode && err?.message) {
      return `Error ${err.errorCode}: ${err.message}`;
    }
    if (err?.message) {
      return err.message;
    }
    return defaultMessage;
  }

  private showSuccess(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  private showError(message: string): void {
    this.snackbarService.showError(message);
  }
}
