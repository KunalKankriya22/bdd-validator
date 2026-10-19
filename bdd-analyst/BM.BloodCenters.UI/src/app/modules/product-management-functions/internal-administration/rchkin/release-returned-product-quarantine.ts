import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { Validators } from '@angular/forms';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { RouterLink } from '@angular/router';

// Shared components
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';

// Interfaces
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';

// Services
import { ReleaseReturnedProductQuarantineService } from './services/release-returned-product-quarantine.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderService } from '@shared/services/page-header.service';

// Models
import {
  ReturnAdviceHeaderDto,
  ReturnItemRow,
  RejectCodeDto,
  ProcessReturnItemsRequestDto,
  ProcessReturnItemRequestDto,
  DeviceOption,
  RackOption,
  TrayOption,
  ERROR_CODES
} from './models/release-returned-product-quarantine.model';

/**
 * Release Returned Product Quarantine Component
 * Mnemonic: RCHKIN
 *
 * Purpose: Process returned products from quarantine by either restocking to active inventory
 * or discarding with reject reason
 */
@Component({
  selector: 'app-release-returned-product-quarantine',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    NgxMatSelectSearchModule,
    RouterLink,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './release-returned-product-quarantine.html',
  styleUrls: ['./release-returned-product-quarantine.scss']
})
export class ReleaseReturnedProductQuarantine implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `release-returned-product-quarantine-${ReleaseReturnedProductQuarantine.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(ReleaseReturnedProductQuarantineService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly pageHeaderService = inject(PageHeaderService);

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly returnAdviceHeader = signal<ReturnAdviceHeaderDto | null>(null);
  protected readonly returnItems = signal<ReturnItemRow[]>([]);
  protected readonly rejectCodes = signal<RejectCodeDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly retrieving = signal<boolean>(false);
  protected readonly processing = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalRecords = signal<number>(0);
  protected readonly currentPage = signal<number>(0);
  protected readonly pageSize = signal<number>(10);

  // Storage dropdown options per row
  protected readonly deviceOptionsMap = signal<Map<string, DeviceOption[]>>(new Map());
  protected readonly rackOptionsMap = signal<Map<string, RackOption[]>>(new Map());
  protected readonly trayOptionsMap = signal<Map<string, TrayOption[]>>(new Map());

  // Return advice dropdown options
  protected readonly returnAdvices = signal<{ returnAdviceId: string; customerName?: string; unmovedItemCount: number }[]>([]);

  // Form controls
  returnIdControl = new FormControl<string>('', [Validators.required]);
  returnIdSearchCtrl = new FormControl<string>('');

  // Signal for return ID search term (to make computed reactive)
  private readonly returnIdSearchTerm = signal<string>('');
  // Signal for reject code search term (to make computed reactive)
  private readonly rejectCodeSearchTerm = signal<string>('');

  // Search controls for searchable dropdowns
  rejectCodeSearchCtrl = new FormControl<string>('');
  deviceSearchCtrl = new FormControl<string>('');
  rackSearchCtrl = new FormControl<string>('');
  traySearchCtrl = new FormControl<string>('');

  // Filtered reject codes based on search
  protected readonly filteredRejectCodes = computed(() => {
    const searchTerm = this.rejectCodeSearchTerm().toLowerCase();
    const codes = this.rejectCodes();
    if (!searchTerm) return codes;
    return codes.filter(
      code => code.code.toLowerCase().includes(searchTerm) ||
              code.description.toLowerCase().includes(searchTerm)
    );
  });

  // Filtered return advices based on search
  protected readonly filteredReturnAdvices = computed(() => {
    const searchTerm = this.returnIdSearchTerm().toLowerCase();
    const advices = this.returnAdvices();
    if (!searchTerm) return advices;
    return advices.filter(
      advice => advice.returnAdviceId.toLowerCase().includes(searchTerm) ||
                (advice.customerName?.toLowerCase().includes(searchTerm) ?? false)
    );
  });

  // Computed values
  protected readonly isEmpty = computed(() => this.returnItems().length === 0 && !this.loading());
  protected readonly hasData = computed(() => this.returnItems().length > 0);
  protected readonly hasReturnAdvice = computed(() => this.returnAdviceHeader() !== null);
  // Trigger signal to force canSave re-evaluation
  private readonly selectionVersion = signal<number>(0);

  protected readonly canSave = computed(() => {
    const items = this.returnItems();
    const _version = this.selectionVersion();

    if (items.length === 0) return false;

    const itemsWithSelection = items.filter(item => item.selectRestock !== null);
    if (itemsWithSelection.length === 0) return false;

    // Cross-field validation per FMB VALIDATE_RECORD rules
    return itemsWithSelection.every(item => {
      if (item.selectRestock === 'N') {
        return !!item.selectedRejectCode;
      }
      if (item.selectRestock === 'Y') {
        return !!item.selectedDeviceNumber;
      }
      return false;
    });
  });

  /**
   * Trigger canSave re-evaluation
   */
  private updateSelectionState(): void {
    this.selectionVersion.update(v => v + 1);
  }

  /**
   * Handle select dropdown open/close to clear search
   */
  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  // Table columns
  displayedColumns: string[] = [
    'selectRestock',
    'unitId',
    'productCode',
    'aboRh',
    'warehouseId',
    'deviceNumber',
    'rackNumber',
    'trayNumber',
    'rejectionCode',
    'expirationDate'
  ];

  // Dropdown options
  protected readonly restockOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  // Page Header Configuration - initialized empty, will be set from menu
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
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadRejectCodes();
    this.loadReturnAdvices();
    this.subscribeToChapterChanges();

    // Subscribe to return ID search control to update signal
    this.returnIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.returnIdSearchTerm.set(value || '');
      });

    // Subscribe to reject code search control to update signal
    this.rejectCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.rejectCodeSearchTerm.set(value || '');
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset form and state
        this.returnIdControl.reset();
        this.returnAdviceHeader.set(null);
        this.returnItems.set([]);
        this.error.set(null);
        this.currentPage.set(0);
        this.totalRecords.set(0);
        this.deviceOptionsMap.set(new Map());
        this.rackOptionsMap.set(new Map());
        this.trayOptionsMap.set(new Map());

        // Reload data for new chapter
        this.loadRejectCodes();
        this.loadReturnAdvices();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load rejection codes for discard dropdown
   */
  private loadRejectCodes(): void {
    this.loading.set(true);
    this.service.getRejectCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.rejectCodes.set(codes);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load rejection codes');
          this.loading.set(false);
          this.snackbarService.showError('Failed to load rejection codes');
        }
      });
  }

  /**
   * Load return advices for dropdown
   */
  private loadReturnAdvices(): void {
    const warehouseId = this.headerService.getCurrentWarehouseId() || '';
    this.service.searchReturnAdvices('', warehouseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (advices) => {
          this.returnAdvices.set(advices);
        },
        error: (err) => {
          console.error('Failed to load return advices:', err);
        }
      });
  }

  /**
   * RETRIEVE button handler
   * Fetches return advice header and return items
   */
  onRetrieve(): void {
    this.returnIdControl.markAsTouched();

    if (this.returnIdControl.invalid) {
      return;
    }

    const returnId = this.returnIdControl.value?.trim();
    if (!returnId) {
      return;
    }

    this.retrieving.set(true);
    this.error.set(null);

    const warehouseId = this.headerService.getCurrentWarehouseId() || '';

    // Fetch return advice header
    this.service.getReturnAdviceHeader(returnId, warehouseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (header) => {
          this.returnAdviceHeader.set(header);
          this.loadReturnItems(returnId);
        },
        error: (err) => {
          this.retrieving.set(false);
          const errorMessage = this.getErrorMessage(err);
          this.error.set(errorMessage);
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * Load return items for the selected return advice
   */
  private loadReturnItems(returnAdviceId: string): void {
    const warehouseId = this.headerService.getCurrentWarehouseId() || '';
    this.service.getReturnItems(returnAdviceId, warehouseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Map to ReturnItemRow with UI-specific fields
          const rows: ReturnItemRow[] = result.items.map(item => ({
            ...item,
            bloodTypeCode: item.bloodType, // Alias for API calls
            selectRestock: null,
            selectedWarehouseId: null,
            selectedDeviceType: null,
            selectedDeviceNumber: null,
            selectedRackNumber: null,
            selectedShelfNumber: null,
            selectedTrayId: null,
            selectedRejectCode: null,
            isValidForRestock: false,
            validationError: null,
            isProcessing: false
          }));

          this.returnItems.set(rows);
          this.totalRecords.set(result.totalCount);
          this.retrieving.set(false);
        },
        error: (err) => {
          this.retrieving.set(false);
          const errorMessage = this.getErrorMessage(err);
          this.error.set(errorMessage);
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * CLEAR button handler
   * Resets form to initial state
   */
  onClear(): void {
    this.returnIdControl.reset();
    this.returnAdviceHeader.set(null);
    this.returnItems.set([]);
    this.error.set(null);
    this.currentPage.set(0);
    this.totalRecords.set(0);
  }

  /**
   * Handle restock selection change for a row
   */
  onRestockChange(row: ReturnItemRow, value: 'Y' | 'N'): void {
    row.selectRestock = value;

    // Reset conditional fields when selection changes
    if (value === 'Y') {
      row.selectedRejectCode = null;
      // Set warehouse from user context
      row.selectedWarehouseId = this.headerService.getCurrentWarehouseId() || '';
      // Load devices for this row's product type
      this.loadDevicesForRow(row);
    } else {
      row.selectedWarehouseId = null;
      row.selectedDeviceType = null;
      row.selectedDeviceNumber = null;
      row.selectedRackNumber = null;
      row.selectedShelfNumber = null;
      row.selectedTrayId = null;
    }
    this.updateSelectionState();
  }

  /**
   * Handle reject code selection change for a row
   */
  onRejectCodeChange(row: ReturnItemRow, code: string): void {
    row.selectedRejectCode = code;
    this.updateSelectionState();
  }

  /**
   * Load storage devices for a row based on product type
   */
  private loadDevicesForRow(row: ReturnItemRow): void {
    const productType = row.productType || '';
    if (!productType) return;

    const rowKey = this.getRowKey(row);
    this.service.getDevices(productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (devices) => {
          const map = new Map(this.deviceOptionsMap());
          map.set(rowKey, devices);
          this.deviceOptionsMap.set(map);
        },
        error: (err) => {
          console.error('Error loading devices:', err);
        }
      });
  }

  /**
   * Handle device selection change for a row
   */
  onDeviceChange(row: ReturnItemRow, deviceNumber: string): void {
    row.selectedDeviceNumber = deviceNumber;
    row.selectedRackNumber = null;
    row.selectedTrayId = null;

    // Find selected device to get deviceType
    const rowKey = this.getRowKey(row);
    const devices = this.deviceOptionsMap().get(rowKey) || [];
    const selectedDevice = devices.find(d => d.deviceNumber === deviceNumber);
    if (selectedDevice) {
      row.selectedDeviceType = selectedDevice.deviceType;
      this.loadRacksForRow(row);
    }
    this.updateSelectionState();
  }

  /**
   * Load storage racks for a row
   */
  private loadRacksForRow(row: ReturnItemRow): void {
    const deviceType = row.selectedDeviceType || '';
    const deviceNumber = row.selectedDeviceNumber || '';
    const productType = row.productType || '';
    const bloodType = row.bloodTypeCode || '';
    const storageClass = row.inventoryClass || '';

    if (!deviceType || !deviceNumber) return;

    const rowKey = this.getRowKey(row);
    this.service.getRacks(deviceType, deviceNumber, productType, bloodType, storageClass)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (racks) => {
          const map = new Map(this.rackOptionsMap());
          map.set(rowKey, racks);
          this.rackOptionsMap.set(map);
        },
        error: (err) => {
          console.error('Error loading racks:', err);
        }
      });
  }

  /**
   * Handle rack selection change for a row
   */
  onRackChange(row: ReturnItemRow, rackNumber: string): void {
    row.selectedRackNumber = rackNumber;
    row.selectedTrayId = null;
    this.loadTraysForRow(row);
    this.updateSelectionState();
  }

  /**
   * Load storage trays for a row
   */
  private loadTraysForRow(row: ReturnItemRow): void {
    const deviceType = row.selectedDeviceType || '';
    const deviceNumber = row.selectedDeviceNumber || '';
    const rackNumber = row.selectedRackNumber || '';
    const productType = row.productType || '';
    const bloodType = row.bloodTypeCode || '';
    const storageClass = row.inventoryClass || '';

    if (!deviceType || !deviceNumber || !rackNumber) return;

    const rowKey = this.getRowKey(row);
    this.service.getTrays(deviceType, deviceNumber, rackNumber, productType, bloodType, storageClass)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (trays) => {
          const map = new Map(this.trayOptionsMap());
          map.set(rowKey, trays);
          this.trayOptionsMap.set(map);
        },
        error: (err) => {
          console.error('Error loading trays:', err);
        }
      });
  }

  /**
   * Get unique key for a row
   */
  private getRowKey(row: ReturnItemRow): string {
    return `${row.unitId}-${row.productCode}-${row.aliquot}`;
  }

  /**
   * Get devices for a specific row (filtered by search)
   */
  getDevicesForRow(row: ReturnItemRow): DeviceOption[] {
    const devices = this.deviceOptionsMap().get(this.getRowKey(row)) || [];
    const searchTerm = this.deviceSearchCtrl.value?.toLowerCase() || '';
    if (!searchTerm) return devices;
    return devices.filter(
      d => d.deviceNumber.toLowerCase().includes(searchTerm) ||
           d.description?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get racks for a specific row (filtered by search)
   */
  getRacksForRow(row: ReturnItemRow): RackOption[] {
    const racks = this.rackOptionsMap().get(this.getRowKey(row)) || [];
    const searchTerm = this.rackSearchCtrl.value?.toLowerCase() || '';
    if (!searchTerm) return racks;
    return racks.filter(
      r => r.rackNumber.toLowerCase().includes(searchTerm) ||
           r.description?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get trays for a specific row (filtered by search)
   */
  getTraysForRow(row: ReturnItemRow): TrayOption[] {
    const trays = this.trayOptionsMap().get(this.getRowKey(row)) || [];
    const searchTerm = this.traySearchCtrl.value?.toLowerCase() || '';
    if (!searchTerm) return trays;
    return trays.filter(
      t => t.trayNumber.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Handle tray selection change for a row
   */
  onTrayChange(row: ReturnItemRow, trayNumber: string): void {
    const trays = this.getTraysForRow(row);
    const selectedTray = trays.find(t => t.trayNumber === trayNumber);

    if (selectedTray?.isFull === 'Y') {
      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        data: {
          title: 'Tray Full',
          message: 'Tray is full. Use the same tray?',
          confirmText: 'Yes',
          cancelText: 'No'
        } as ConfirmActionDialogData,
        width: '400px',
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          row.selectedTrayId = trayNumber;
          row.selectedShelfNumber = selectedTray.shelfNumber;
        } else {
          row.selectedTrayId = null;
          row.selectedShelfNumber = null;
        }
        this.updateSelectionState();
      });
    } else {
      row.selectedTrayId = trayNumber;
      if (selectedTray) {
        row.selectedShelfNumber = selectedTray.shelfNumber;
      }
      this.updateSelectionState();
    }
  }

  /**
   * Check if a column should be visible based on restock selection
   */
  isColumnVisible(column: string, row: ReturnItemRow): boolean {
    const restockColumns = ['warehouseId', 'deviceNumber', 'rackNumber', 'trayNumber'];
    const discardColumns = ['rejectionCode'];

    if (restockColumns.includes(column)) {
      return row.selectRestock === 'Y';
    }

    if (discardColumns.includes(column)) {
      return row.selectRestock === 'N';
    }

    return true; // Always show other columns
  }

  /**
   * SAVE button handler
   * Process return items (restock or discard)
   */
  onSave(): void {
    const items = this.returnItems();
    if (items.length === 0) {
      this.snackbarService.showError('No items to process');
      return;
    }

    // Validate that all items have restock selection
    const invalidItems = items.filter(item => !item.selectRestock);
    if (invalidItems.length > 0) {
      this.snackbarService.showError('Please select Restock option for all items');
      return;
    }

    // Build request payload
    const returnAdviceId = this.returnIdControl.value?.trim() || '';
    const requestItems: ProcessReturnItemRequestDto[] = items.map(item => {
      const baseItem: ProcessReturnItemRequestDto = {
        unitId: item.unitId,
        collDate: item.collDate,
        productCode: item.productCode,
        aliquot: item.aliquot,
        returnAdviceId: item.returnAdviceId,
        restockFlag: item.selectRestock!
      };

      if (item.selectRestock === 'Y') {
        return {
          ...baseItem,
          warehouseId: item.selectedWarehouseId || '',
          deviceType: item.selectedDeviceType || '',
          deviceNumber: item.selectedDeviceNumber || '',
          rackNumber: item.selectedRackNumber || '',
          shelfNumber: item.selectedShelfNumber || undefined,
          trayId: item.selectedTrayId || undefined
        };
      } else {
        return {
          ...baseItem,
          rejectCode: item.selectedRejectCode || ''
        };
      }
    });

    const request: ProcessReturnItemsRequestDto = {
      returnAdviceId,
      items: requestItems
    };

    this.processing.set(true);

    this.service.processReturnItems(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.processing.set(false);

          if (result.failedCount === 0) {
            this.snackbarService.showSuccess(
              `All items processed successfully. Restocked: ${result.restockedCount}, Discarded: ${result.discardedCount}`
            );
            // Refresh the list to show updated status
            const warehouseId = this.headerService.getCurrentWarehouseId();
            if (warehouseId && returnAdviceId) {
              this.loadReturnItems(returnAdviceId);
            }
          } else {
            this.snackbarService.showError(
              `Some items failed to process. Successful: ${result.totalProcessed - result.failedCount}, Failed: ${result.failedCount}`
            );
          }
        },
        error: (err) => {
          this.processing.set(false);
          const errorMessage = this.getErrorMessage(err);
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * CANCEL button handler
   * Clears form (same as CLEAR)
   */
  onCancel(): void {
    this.onClear();
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);

    const returnId = this.returnIdControl.value?.trim();
    const warehouseId = this.headerService.getCurrentWarehouseId();

    if (returnId && warehouseId) {
      this.loadReturnItems(returnId);
    }
  }

  /**
   * Extract error message from API error response
   * Includes error code in the message for visibility
   */
  private getErrorMessage(error: any): string {
    const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
    let errorMessage = '';

    if (error?.error?.errorResponse?.error) {
      errorMessage = error.error.errorResponse.error;
    } else if (errorCode && ERROR_CODES[errorCode]) {
      errorMessage = ERROR_CODES[errorCode];
    } else if (error?.error?.failedItems?.[0]?.errorMessage) {
      errorMessage = error.error.failedItems[0].errorMessage;
    } else if (error?.message) {
      errorMessage = error.message;
    } else {
      errorMessage = 'An unexpected error occurred';
    }

    // Include error code in message if available
    if (errorCode) {
      return `Error ${errorCode}: ${errorMessage}`;
    }
    return errorMessage;
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Format date with time for display (DD-MMM-YYYY HH:mm)
   */
  formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  /**
   * Get return reason display text
   * Shows returnReasonCode + description from first item, or '-' if not available
   */
  getReturnReasonDisplay(): string {
    const items = this.returnItems();
    if (items.length > 0 && items[0].returnReasonCode) {
      const desc = items[0].returnReasonDescription || '';
      return `${items[0].returnReasonCode}${desc ? ' - ' + desc : ''}`;
    }
    return '-';
  }
}
