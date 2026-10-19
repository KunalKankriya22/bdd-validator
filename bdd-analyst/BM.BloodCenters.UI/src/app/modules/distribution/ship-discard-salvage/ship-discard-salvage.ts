import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Shared components
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

// Services
import { ShipDiscardSalvageApiService } from './services/ship-discard-salvage-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';

// Models
import {
  ShipDiscardSalvageShipment,
  ShipDiscardSalvageBox,
  CreateShipDiscardSalvageShipmentRequestDto,
  AddBoxToShipmentRequestDto,
  ConsigneeLookup,
  CarrierLookup,
  ShipmentChargesDialogData,
  ERROR_MESSAGES,
} from './models/ship-discard-salvage.model';

interface DisplayInfo {
  shipmentNo: string;
  consigneeId: string;
  description: string;
  address: string;
  state: string;
  country: string;
}

// Dialogs
import { ShipmentChargesDialogComponent } from './dialogs/shipment-charges-dialog/shipment-charges-dialog';
import { ViewConsigneesDialogComponent } from './dialogs/view-consignees-dialog/view-consignees-dialog';
import { ViewShippedBoxesDialogComponent } from './dialogs/view-shipped-boxes-dialog/view-shipped-boxes-dialog';
import { PrintConfirmationDialogComponent, PrintConfirmationResult } from './dialogs/print-confirmation-dialog/print-confirmation-dialog';

@Component({
  selector: 'app-ship-discard-salvage',
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
    MatAutocompleteModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './ship-discard-salvage.html',
  styleUrl: './ship-discard-salvage.scss',
})
export class ShipDiscardSalvageComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `ship-discard-salvage-${ShipDiscardSalvageComponent.nextId++}`;

  // ID generators
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ShipDiscardSalvageApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);

  // Cleanup
  private destroy$ = new Subject<void>();

  // Page header configuration
  headerConfig!: PageHeaderConfig;

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  // Data signals
  protected readonly shipments = signal<ShipDiscardSalvageShipment[]>([]);
  protected readonly selectedShipment = signal<ShipDiscardSalvageShipment | null>(null);
  protected readonly boxes = signal<ShipDiscardSalvageBox[]>([]);
  protected readonly availableBoxes = signal<ShipDiscardSalvageBox[]>([]);

  // Lookup data signals
  protected readonly carriers = signal<CarrierLookup[]>([]);
  protected readonly consignees = signal<ConsigneeLookup[]>([]);

  // Consignee info when entering by Consignee ID (before shipment exists)
  protected readonly selectedConsigneeInfo = signal<ConsigneeLookup | null>(null);

  // Searchable dropdown controls
  shipmentSearchCtrl = new FormControl('');
  consigneeSearchCtrl = new FormControl('');
  carrierSearchCtrl = new FormControl('');

  private shipmentSearchText = signal('');
  private consigneeSearchText = signal('');
  private carrierSearchText = signal('');

  readonly filteredShipments = computed(() => {
    const s = this.shipmentSearchText().toLowerCase();
    return !s ? this.shipments() : this.shipments().filter(sh =>
      sh.shipmentNo.toLowerCase().includes(s) || sh.consigneeName.toLowerCase().includes(s)
    );
  });

  readonly filteredConsignees = computed(() => {
    const s = this.consigneeSearchText().toLowerCase();
    return !s ? this.consignees() : this.consignees().filter(c =>
      c.consigneeId.toLowerCase().includes(s) || c.consigneeName.toLowerCase().includes(s)
    );
  });

  readonly filteredCarriers = computed(() => {
    const s = this.carrierSearchText().toLowerCase();
    return !s ? this.carriers() : this.carriers().filter(c =>
      c.carrierCode.toLowerCase().includes(s) || c.carrierName.toLowerCase().includes(s)
    );
  });

  // Computed values
  protected readonly hasShipment = computed(() => this.selectedShipment() !== null);
  protected readonly hasBoxes = computed(() => this.boxes().length > 0);
  protected readonly hasConsigneeSelected = signal<boolean>(false);
  protected readonly canCompleteBoxEntry = computed(() => this.hasShipment() && this.hasBoxes());

  protected readonly displayInfo = computed<DisplayInfo | null>(() => {
    const shipment = this.selectedShipment();
    if (shipment) {
      return {
        shipmentNo: shipment.shipmentNo,
        consigneeId: shipment.consigneeId,
        description: shipment.consigneeName,
        address: shipment.address1 || 'N/A',
        state: shipment.state || 'N/A',
        country: shipment.country || 'N/A',
      };
    }
    const consignee = this.selectedConsigneeInfo();
    if (consignee) {
      return {
        shipmentNo: '',
        consigneeId: consignee.consigneeId,
        description: consignee.consigneeName,
        address: consignee.address1 || 'N/A',
        state: consignee.state || 'N/A',
        country: consignee.country || 'N/A',
      };
    }
    return null;
  });

  protected readonly isEmpty = computed(() => !this.displayInfo() && !this.loading());

  // Forms
  searchForm!: FormGroup;
  shipmentForm!: FormGroup;
  boxForm!: FormGroup;

  // Data table configuration
  protected tableConfig: DataTableConfig<ShipDiscardSalvageBox> = {
    columns: [
      { key: 'boxId', header: 'Box ID' },
      { key: 'boxTypeDescription', header: 'Box Type' },
      { key: 'packedByUserName', header: 'Packed By' },
      { key: 'packedDate', header: 'Packed Date', valueFormatter: (value) => this.formatDateTime(value) },
    ],
    rowActions: [
      { icon: 'delete', action: 'delete', ariaLabel: 'Remove box from shipment', color: 'warn' }
    ],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    emptyMessage: 'No boxes added to shipment yet',
  };

  constructor() {
    this.headerConfig = {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: '',
    };

    effect(() => {
      const data = this.pageHeaderService.pageHeaderData();
      if (data) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: data.title, link: null },
          ],
          title: data.title,
          subtitle: data.subtitle,
        };
      }
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadOpenShipments();
    this.loadLookupData();
    this.setupFormSubscriptions();
    this.subscribeToChapterChanges();
    this.setupSearchControlSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize all forms
   */
  private initializeForms(): void {
    // Search form - Shipment Number OR Consignee ID
    this.searchForm = this.fb.group({
      shipmentNo: [''],
      consigneeId: [''],
    });

    // Shipment form - Carrier and tracking information
    this.shipmentForm = this.fb.group({
      carrier: ['', [Validators.required, Validators.maxLength(5)]],
      carrierName: [{ value: '', disabled: true }],  // Read-only, auto-filled
      trackingNo: ['', [Validators.required, Validators.maxLength(30)]],
      flightNo: ['', Validators.maxLength(6)],
    });

    // Box form - Add box to shipment (accepts 10-char manual or 14-char barcode scan)
    this.boxForm = this.fb.group({
      boxId: ['', [Validators.required, Validators.maxLength(14)]],
    });
  }

  /**
   * Setup form subscriptions for auto-fill and validation
   */
  private setupFormSubscriptions(): void {
    // When shipment number is selected, clear consignee ID
    this.searchForm.get('shipmentNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          this.searchForm.patchValue({ consigneeId: '' }, { emitEvent: false });
          this.onShipmentSelected(value);
        }
      });

    // When consignee ID is selected, clear shipment number
    this.searchForm.get('consigneeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          this.searchForm.patchValue({ shipmentNo: '' }, { emitEvent: false });
          this.onConsigneeSelected(value);
        }
      });

    // When carrier is selected, auto-fill carrier name
    this.shipmentForm.get('carrier')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((carrierCode) => {
        if (carrierCode) {
          const carrier = this.carriers().find(c => c.carrierCode === carrierCode);
          this.shipmentForm.patchValue({
            carrierName: carrier?.carrierName || ''
          }, { emitEvent: false });
        }
      });
  }

  /**
   * Subscribe to chapter changes to reload data when chapter/warehouse changes
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearShipmentData();
        this.loadOpenShipments();
        this.loadLookupData();
      });
  }

  /**
   * Handle barcode scan input: when a 14-char value is entered, auto-add the box
   */
  onBoxIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value?.trim();
    if (value && value.length === 14 && this.selectedShipment()) {
      this.onAddBox();
    }
  }

  /**
   * Setup search control subscriptions for searchable dropdowns
   */
  private setupSearchControlSubscriptions(): void {
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

  /**
   * Load open shipments for dropdown
   */
  private loadOpenShipments(): void {
    this.loading.set(true);
    this.apiService.getOpenShipments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipments) => {
          this.shipments.set(shipments);
          this.loading.set(false);
        },
        error: (error) => {
          this.handleError(error, 'Failed to load open shipments');
          this.loading.set(false);
        },
      });
  }

  /**
   * Load lookup data (carriers, consignees) from API
   */
  private loadLookupData(): void {
    this.apiService.getActiveCarriers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (carriers) => this.carriers.set(carriers),
        error: (error) => this.handleError(error, 'Failed to load carriers'),
      });

    this.apiService.getConsigneesWithBoxes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (consignees) => this.consignees.set(consignees),
        error: (error) => this.handleError(error, 'Failed to load consignees'),
      });
  }

  /**
   * Handle shipment selection from dropdown
   */
  private onShipmentSelected(shipmentNo: string): void {
    if (!shipmentNo) {
      this.clearShipmentData();
      return;
    }

    this.loading.set(true);
    this.apiService.getShipmentById(shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipment) => {
          if (shipment) {
            this.selectedShipment.set(shipment);
            this.searchForm.patchValue({ consigneeId: shipment.consigneeId }, { emitEvent: false });
            this.populateShipmentForm(shipment);
            this.loadBoxesForShipment(shipment);
          } else {
            this.snackbarService.showError('Shipment not found');
          }
          this.loading.set(false);
        },
        error: (error) => {
          this.handleError(error, 'Failed to load shipment');
          this.loading.set(false);
        },
      });
  }

  /**
   * Handle consignee selection (create new shipment)
   */
  private onConsigneeSelected(consigneeId: string): void {
    if (!consigneeId) {
      this.clearShipmentData();
      return;
    }

    // Clear existing shipment data and prepare for new shipment
    this.selectedShipment.set(null);
    this.boxes.set([]);
    this.shipmentForm.reset();
    this.hasConsigneeSelected.set(true);

    // Store selected consignee info for the info card display
    const consignee = this.consignees().find(c => c.consigneeId === consigneeId) || null;
    this.selectedConsigneeInfo.set(consignee);

    // Load available boxes for this consignee
    this.loadAvailableBoxesForConsignee(consigneeId);
  }

  /**
   * Populate shipment form with existing shipment data
   */
  private populateShipmentForm(shipment: ShipDiscardSalvageShipment): void {
    this.shipmentForm.patchValue({
      carrier: shipment.carrier,
      carrierName: shipment.carrierDescription,
      trackingNo: shipment.trackingNo,
      flightNo: shipment.flightNo,
    });
  }

  /**
   * Load boxes for existing shipment — fetch available boxes for the consignee
   */
  private loadBoxesForShipment(shipment: ShipDiscardSalvageShipment): void {
    this.boxes.set([]);
    this.loadAvailableBoxesForConsignee(shipment.consigneeId);
  }

  /**
   * Load available boxes for consignee (for autocomplete)
   */
  private loadAvailableBoxesForConsignee(consigneeId: string): void {
    this.loading.set(true);
    this.apiService.getBoxesForConsignee(consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxes) => {
          this.availableBoxes.set(boxes);
          this.loading.set(false);
        },
        error: (error) => {
          this.handleError(error, 'Failed to load boxes for consignee');
          this.loading.set(false);
        },
      });
  }

  /**
   * Create new shipment when consignee is selected
   */
  onCreateShipment(): void {
    this.submitted.set(true);

    if (this.shipmentForm.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const consigneeId = this.searchForm.get('consigneeId')?.value;
    if (!consigneeId) {
      this.snackbarService.showError('Please select a consignee');
      return;
    }

    const request: CreateShipDiscardSalvageShipmentRequestDto = {
      consigneeId,
      carrier: this.shipmentForm.get('carrier')?.value,
      trackingNo: this.shipmentForm.get('trackingNo')?.value,
      flightNo: this.shipmentForm.get('flightNo')?.value || undefined,
    };

    this.loading.set(true);
    this.apiService.createShipment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipment) => {
          this.selectedShipment.set(shipment);
          this.snackbarService.showSuccess('Shipment created successfully');
          this.loading.set(false);
          this.loadOpenShipments();  // Refresh shipment list
        },
        error: (error) => {
          this.handleError(error, 'Failed to create shipment');
          this.loading.set(false);
        },
      });
  }

  /**
   * Add box to shipment.
   * If no shipment exists yet (consignee-first flow), auto-creates the shipment first,
   * matching legacy DO_COMMIT behavior: shipment is generated on first box add.
   */
  onAddBox(): void {
    if (this.boxForm.invalid) {
      return;
    }

    const shipment = this.selectedShipment();
    if (shipment) {
      this.addBoxToExistingShipment(shipment.shipmentNo);
    } else if (this.selectedConsigneeInfo()) {
      this.createShipmentThenAddBox();
    } else {
      this.snackbarService.showError('Select a Shipment Number or Consignee ID first');
    }
  }

  private addBoxToExistingShipment(shipmentNo: string): void {
    const request: AddBoxToShipmentRequestDto = {
      boxId: this.boxForm.get('boxId')?.value,
    };

    this.loading.set(true);
    this.apiService.addBoxToShipment(shipmentNo, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (box) => {
          this.boxes.update(boxes => [...boxes, box]);
          this.boxForm.reset();
          this.snackbarService.showSuccess('Box added to shipment successfully');
          this.loading.set(false);
          this.selectedShipment.update(s => s ? { ...s, boxCount: s.boxCount + 1 } : null);
        },
        error: (error) => {
          this.handleError(error, 'Failed to add box to shipment');
          this.loading.set(false);
        },
      });
  }

  private createShipmentThenAddBox(): void {
    if (this.shipmentForm.get('carrier')?.invalid || this.shipmentForm.get('trackingNo')?.invalid) {
      this.submitted.set(true);
      this.snackbarService.showError('Carrier and Track No are required before adding a box');
      return;
    }

    const consigneeId = this.searchForm.get('consigneeId')?.value;
    const request: CreateShipDiscardSalvageShipmentRequestDto = {
      consigneeId,
      carrier: this.shipmentForm.get('carrier')?.value,
      trackingNo: this.shipmentForm.get('trackingNo')?.value,
      flightNo: this.shipmentForm.get('flightNo')?.value || undefined,
    };

    this.loading.set(true);
    this.apiService.createShipment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipment) => {
          this.selectedShipment.set(shipment);
          this.searchForm.patchValue({ shipmentNo: shipment.shipmentNo }, { emitEvent: false });
          this.loadOpenShipments();
          this.addBoxToExistingShipment(shipment.shipmentNo);
        },
        error: (error) => {
          this.handleError(error, 'Failed to create shipment');
          this.loading.set(false);
        },
      });
  }

  /**
   * Remove box from shipment
   */
  onRemoveBox(box: ShipDiscardSalvageBox): void {
    const shipment = this.selectedShipment();
    if (!shipment) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to remove box ${box.boxId} from this shipment?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.loading.set(true);
        this.apiService.removeBoxFromShipment(shipment.shipmentNo, box.boxId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Remove box from local list
              this.boxes.update(boxes => boxes.filter(b => b.boxId !== box.boxId));
              this.snackbarService.showSuccess('Box removed successfully');
              this.loading.set(false);

              // Update box count in shipment
              this.selectedShipment.update(s => s ? { ...s, boxCount: s.boxCount - 1 } : null);
            },
            error: (error) => {
              this.handleError(error, 'Failed to remove box');
              this.loading.set(false);
            },
          });
      }
    });
  }

  /**
   * Open Shipment Charges dialog.
   * Returns the MatDialogRef so callers can subscribe to afterClosed().
   */
  onOpenShipmentCharges(shipment?: ShipDiscardSalvageShipment | null, finalizeOnSave = false): MatDialogRef<ShipmentChargesDialogComponent> {
    const s = shipment || this.selectedShipment();
    const data: ShipmentChargesDialogData = {
      shipmentNo: s?.shipmentNo || '',
      consigneeId: s?.consigneeId || '',
      consigneeName: s?.consigneeName || '',
      finalizeOnSave,
      boxCount: this.boxes().length,
    };

    return this.dialog.open(ShipmentChargesDialogComponent, {
      width: '754px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      disableClose: finalizeOnSave,
      autoFocus: false,
      hasBackdrop: false,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data,
    });
  }

  /**
   * Open View Consignees in Same Zone dialog
   */
  onViewConsigneesInSameZone(): void {
    const shipment = this.selectedShipment();
    if (!shipment) {
      return;
    }

    this.dialog.open(ViewConsigneesDialogComponent, {
      width: '754px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      disableClose: false,
      autoFocus: false,
      hasBackdrop: false,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        shipmentNo: shipment.shipmentNo,
        consigneeId: shipment.consigneeId,
      },
    });
  }

  /**
   * Open View Shipped Boxes dialog
   */
  onViewShippedBoxes(): void {
    this.dialog.open(ViewShippedBoxesDialogComponent, {
      width: '754px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      disableClose: false,
      autoFocus: false,
      hasBackdrop: false,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        shipmentNo: this.selectedShipment()?.shipmentNo || '',
        boxes: this.boxes(),
      },
    });
  }

  /**
   * Complete box entry (finalize shipment)
   * Flow: Print confirmation → Charges dialog (with default charges) → Finalize on Save and Print
   */
  onCompleteBoxEntry(): void {
    const shipment = this.selectedShipment();
    if (!shipment) {
      return;
    }

    if (!this.hasBoxes()) {
      this.snackbarService.showError('Cannot complete shipment with no boxes');
      return;
    }

    const dialogRef = this.dialog.open(PrintConfirmationDialogComponent, {
      width: '450px',
      data: {
        shipmentNo: shipment.shipmentNo,
      },
    });

    dialogRef.afterClosed().subscribe((result: PrintConfirmationResult | undefined) => {
      if (!result) return;

      if (result.confirmed) {
        const chargesRef = this.onOpenShipmentCharges(shipment, true);
        chargesRef.afterClosed().subscribe(chargesResult => {
          if (chargesResult) {
            this.onCancel();
          }
        });
      }
    });
  }

  /**
   * Cancel and clear all forms
   */
  onCancel(): void {
    this.clearShipmentData();
    this.searchForm.reset();
    this.submitted.set(false);
  }

  /**
   * Clear shipment data
   */
  private clearShipmentData(): void {
    this.selectedShipment.set(null);
    this.selectedConsigneeInfo.set(null);
    this.boxes.set([]);
    this.availableBoxes.set([]);
    this.shipmentForm.reset();
    this.boxForm.reset();
    this.error.set(null);
    this.hasConsigneeSelected.set(false);
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageSize: event.pageSize,
        pageIndex: event.pageIndex,
      },
    };
  }

  /**
   * Handle row action from data table
   */
  onRowAction(event: TableRowActionEvent<ShipDiscardSalvageBox>): void {
    if (event.action === 'delete') {
      this.onRemoveBox(event.row);
    }
  }

  /**
   * Format date for display (DD-MMM-YYYY HH:mm)
   */
  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  /**
   * Handle errors from API calls
   */
  private handleError(error: any, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    // Check for specific error codes from API
    if (error?.error?.errorCode && ERROR_MESSAGES[error.error.errorCode]) {
      errorMessage = ERROR_MESSAGES[error.error.errorCode];
    } else if (error?.error?.errorResponse?.error) {
      errorMessage = error.error.errorResponse.error;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    this.error.set(errorMessage);
    this.snackbarService.showError(errorMessage);
  }

  /**
   * Focus first invalid form field for accessibility
   */
  private focusFirstInvalidField(): void {
    const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
    if (firstInvalid) {
      (firstInvalid as HTMLElement).focus();
    }
  }

  // Form getters for template
  get sf() {
    return this.searchForm.controls;
  }

  get f() {
    return this.shipmentForm.controls;
  }

  get bf() {
    return this.boxForm.controls;
  }
}
