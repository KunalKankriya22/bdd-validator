import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { OfflineProductShipmentApiService } from './services/offline-product-shipment-api.service';
import {
  ShipmentHeaderDto,
  BoxDataDto,
  ShipmentNumberLookupDto,
  ConsigneeLookupDto,
  ConsigneeDetailDto,
  CarrierLookupDto,
  BoxValidateRequestDto,
  PackListPrintConfirmationResult
} from './models/offline-product-shipment.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, SortConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { ViewProductsInBoxDialog } from './dialogs/view-products-in-box/view-products-in-box-dialog';
import { ViewConsigneesInZoneDialog } from './dialogs/view-consignees-in-zone/view-consignees-in-zone-dialog';
import { ShipmentChargesDialog } from './dialogs/shipment-charges/shipment-charges-dialog';
import { PackListPrintConfirmationDialog } from './dialogs/pack-list-print-confirmation/pack-list-print-confirmation-dialog';

@Component({
  selector: 'app-offline-product-shipment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [],
  templateUrl: './offline-product-shipment.html',
  styleUrl: './offline-product-shipment.scss'
})
export class OfflineProductShipment implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `offline-product-shipment-${OfflineProductShipment.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(OfflineProductShipmentApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly loginService = inject(LoginService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Page configuration
  protected headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: ''
  };

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
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  // Signal-based state
  protected readonly shipmentData = signal<ShipmentHeaderDto | null>(null);
  protected readonly sessionBoxes = signal<BoxDataDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly selectedBoxes = signal<BoxDataDto[]>([]);
  protected readonly selectedBoxId = signal<string | null>(null);
  protected readonly addingBox = signal<boolean>(false);
  protected _boxIdInput = '';
  get boxIdInput(): string { return this._boxIdInput; }
  set boxIdInput(val: string) { this._boxIdInput = val; this.boxInputFilter.set(val); }
  protected currentZone = '';
  protected readonly availableBoxes = signal<BoxDataDto[]>([]);
  protected readonly boxInputFilter = signal('');
  protected readonly filteredBoxes = computed(() => {
    const s = this.boxInputFilter().toLowerCase();
    return !s ? this.availableBoxes() : this.availableBoxes().filter(b => b.boxId.toLowerCase().includes(s));
  });

  // Lookup data
  protected readonly shipmentNumbers = signal<ShipmentNumberLookupDto[]>([]);
  protected readonly consignees = signal<ConsigneeLookupDto[]>([]);
  protected readonly carriers = signal<CarrierLookupDto[]>([]);

  // Search controls for searchable dropdowns
  protected shipmentSearchCtrl = new FormControl('');
  protected consigneeSearchCtrl = new FormControl('');
  protected carrierSearchCtrl = new FormControl('');

  // Filtered signals
  private shipmentSearchText = signal('');
  private consigneeSearchText = signal('');
  private carrierSearchText = signal('');

  protected readonly filteredShipments = computed(() => {
    const s = this.shipmentSearchText().toLowerCase();
    return !s ? this.shipmentNumbers() : this.shipmentNumbers().filter(x => x.shipmentNo.toLowerCase().includes(s));
  });
  protected readonly filteredConsignees = computed(() => {
    const s = this.consigneeSearchText().toLowerCase();
    return !s ? this.consignees() : this.consignees().filter(x => (x.consigneeId + ' ' + (x.name || '')).toLowerCase().includes(s));
  });
  protected readonly filteredCarriers = computed(() => {
    const s = this.carrierSearchText().toLowerCase();
    return !s ? this.carriers() : this.carriers().filter(x => (x.code + ' ' + (x.codeDesc || '')).toLowerCase().includes(s));
  });

  // Computed values
  protected readonly isEmpty = computed(() => this.sessionBoxes().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasSelectedConsignee = computed(() => !!this.form.get('consigneeId')?.value);
  protected readonly hasData = computed(() => this.shipmentData() !== null || this.hasSelectedConsignee());

  // Form
  form!: FormGroup;

  // Data table configuration for Box List
  protected boxListTableConfig = computed<DataTableConfig<BoxDataDto>>(() => ({
    columns: [
      {
        key: 'boxId',
        header: `Box ID (${this.sessionBoxes().length})`,
        sortable: true,
        width: '25%'
      },
      {
        key: 'boxType',
        header: 'Type',
        sortable: false,
        width: '25%'
      },
      {
        key: 'packedBy',
        header: 'Packed By',
        sortable: false,
        width: '25%'
      },
      {
        key: 'packedDate',
        header: 'Packed Date',
        sortable: false,
        width: '25%',
        valueFormatter: (value: any) => value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : ''
      }
    ],
    sortConfig: this.boxSort(),
    showPagination: false,
    enableSelection: false,
    showTableOnEmpty: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Enter details to begin.'
  }));

  protected readonly boxSort = signal<SortConfig>({ column: 'boxId', direction: 'default' });
  protected readonly showBoxTable = signal(false);

  protected readonly sortedSessionBoxes = computed(() => {
    const boxes = this.sessionBoxes();
    const sort = this.boxSort();
    if (sort.direction === 'default' || !sort.column) return boxes;

    return [...boxes].sort((a, b) => {
      const aVal = (a as any)[sort.column];
      const bVal = (b as any)[sort.column];
      const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      return sort.direction === 'A' ? cmp : -cmp;
    });
  });

  protected currentPage = signal(0);
  protected pageSize = signal(25);
  protected totalRecords = signal(0);

  ngOnInit(): void {
    this.initForm();
    this.loadLookupData();

    // Subscribe to chapter changes
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.onClearAll();
      this.loadLookupData();
    });

    // Subscribe to search control changes
    this.shipmentSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.shipmentSearchText.set(v || ''));
    this.consigneeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.consigneeSearchText.set(v || ''));
    this.carrierSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.carrierSearchText.set(v || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the form with all fields
   */
  private initForm(): void {
    this.form = this.fb.group({
      shipmentNo: [''],
      actualShipmentDate: ['', [Validators.required, Validators.pattern(/^\d{2}-[A-Za-z]{3}-\d{4}\s([01]\d|2[0-3]):[0-5]\d$/)]],
      consigneeId: ['', [Validators.required]],
      consigneeName: [{ value: '', disabled: true }],
      addressLine1: [{ value: '', disabled: true }],
      addressLine2: [{ value: '', disabled: true }],
      addressLine3: [{ value: '', disabled: true }],
      city: [{ value: '', disabled: true }],
      state: [{ value: '', disabled: true }],
      postalZip: [{ value: '', disabled: true }],
      country: [{ value: '', disabled: true }],
      carrier: ['', [Validators.required]],
      carrierDesc: [{ value: '', disabled: true }],
      trackNumber: ['', [Validators.required, Validators.maxLength(15)]],
      flightNo: ['', [Validators.maxLength(6)]]
    });

    // Auto-retrieve shipment data when shipment number is selected (matches legacy LOV behavior)
    this.form.get('shipmentNo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(shipmentNo => {
        if (shipmentNo) {
          this.onRetrieve();
        }
      });

    // Watch for consignee selection changes
    this.form.get('consigneeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(consigneeId => {
        if (consigneeId) {
          this.onConsigneeChange(consigneeId);
        } else {
          this.clearAddressFields();
        }
      });

    // Watch for carrier selection changes
    this.form.get('carrier')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(carrierCode => {
        if (carrierCode) {
          this.onCarrierChange(carrierCode);
        } else {
          this.form.patchValue({ carrierDesc: '' });
        }
      });
  }

  /**
   * Load lookup data for dropdowns
   */
  private loadLookupData(): void {
    this.apiService.searchShipmentNumbers('').pipe(takeUntil(this.destroy$))
      .subscribe({ next: (data) => this.shipmentNumbers.set(data), error: () => {} });
    this.apiService.getConsignees().pipe(takeUntil(this.destroy$))
      .subscribe({ next: (data) => this.consignees.set(data), error: () => {} });
    this.apiService.getCarriers().pipe(takeUntil(this.destroy$))
      .subscribe({ next: (data) => this.carriers.set(data), error: () => {} });
  }

  /**
   * Handle consignee selection change - populate address fields
   */
  private onConsigneeChange(consigneeId: string): void {
    this.apiService.getConsigneeById(consigneeId).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (consignee) => {
          this.form.patchValue({
            consigneeName: consignee.name,
            addressLine1: consignee.address1,
            addressLine2: consignee.address2,
            addressLine3: consignee.address3,
            city: consignee.city,
            state: consignee.state,
            postalZip: consignee.zip,
            country: consignee.country
          });
          this.currentZone = consignee.zone || '';
          this.loadAvailableBoxes(consigneeId);
        },
        error: () => { this.snackbarService.showError('Failed to load consignee details'); this.clearAddressFields(); }
      });
  }

  /**
   * Handle carrier selection change - populate carrier description
   */
  private onCarrierChange(carrierCode: string): void {
    const found = this.carriers().find(c => c.code === carrierCode);
    if (found) {
      this.form.patchValue({ carrierDesc: found.codeDesc || '' });
    }
  }

  /**
   * Clear address fields when consignee is deselected
   */
  private clearAddressFields(): void {
    this.form.patchValue({
      consigneeName: '',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      city: '',
      state: '',
      postalZip: '',
      country: ''
    });
  }

  /**
   * Get form controls for easy access in template
   */
  get f() {
    return this.form.controls;
  }

  /**
   * RETRIEVE button - load shipment data by Shipment Number
   */
  onRetrieve(): void {
    const shipmentNo = this.form.get('shipmentNo')?.value;

    if (!shipmentNo) {
      this.snackbarService.showError('Please select a Shipment Number');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.apiService.getShipmentHeader(shipmentNo).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipment) => {
          this.shipmentData.set(shipment);
          this.populateFormFromShipment(shipment);
          this.loadAvailableBoxes(shipment.consigneeId || '');
          this.loading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to retrieve shipment data');
          this.loading.set(false);
        }
      });
  }

  /**
   * Populate form with retrieved shipment data
   */
  private populateFormFromShipment(shipment: ShipmentHeaderDto): void {
    if (shipment.consigneeId) {
      const exists = this.consignees().some(c => c.consigneeId === shipment.consigneeId);
      if (!exists) {
        this.consignees.update(list => [...list, {
          consigneeId: shipment.consigneeId!,
          name: shipment.consigneeName,
          zone: shipment.zone
        }]);
      }
    }

    const formattedDate = shipment.shipmentDate
      ? this.chapterTimezoneService.convertGmtToLocal(moment.utc(shipment.shipmentDate)).format('DD-MMM-YYYY HH:mm').toUpperCase()
      : '';
    this.form.patchValue({
      actualShipmentDate: formattedDate,
      consigneeId: shipment.consigneeId,
      consigneeName: shipment.consigneeName,
      addressLine1: shipment.address1,
      addressLine2: shipment.address2,
      addressLine3: shipment.address3,
      city: shipment.city,
      state: shipment.state,
      postalZip: shipment.zip,
      country: shipment.country,
      carrier: shipment.carrier,
      carrierDesc: shipment.carrierDesc,
      trackNumber: shipment.trackNo,
      flightNo: shipment.flightNo
    });
  }

  private loadAvailableBoxes(consigneeId: string): void {
    this.apiService.getAvailableBoxes(consigneeId).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxes) => this.availableBoxes.set(boxes),
        error: () => this.availableBoxes.set([])
      });
  }

  onBoxSelected(boxId: string): void {
    if (!boxId) return;
    this.addBoxToTable(boxId);
    this.boxIdInput = '';
  }

  onBoxManualEntry(): void {
    const boxId = this.boxIdInput?.trim();
    if (!boxId) return;
    this.addBoxToTable(boxId);
    this.boxIdInput = '';
  }

  private addBoxToTable(boxId: string): void {
    const alreadyInList = this.sessionBoxes().some(b => b.boxId === boxId);
    if (alreadyInList) return;

    if (this.form.invalid) {
      this.snackbarService.showError('Please fill in all required fields before scanning');
      return;
    }

    this.addingBox.set(true);
    const box = this.availableBoxes().find(b => b.boxId === boxId);

    if (box) {
      this.commitBox(boxId, box);
    } else {
      const consigneeId = this.form.get('consigneeId')?.value || '';
      const shipmentDate = this.getShipmentDateIso();
      this.apiService.validateBox({ boxId, consigneeId, shipmentDate } as BoxValidateRequestDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            if (result.isValid) {
              const newBox: BoxDataDto = {
                boxId,
                boxType: result.boxType || '',
                packedBy: result.packedBy || '',
                packedDate: result.packedDate
              };
              this.commitBox(boxId, newBox);
            } else {
              this.addingBox.set(false);
              this.snackbarService.showError(result.errorMessage || `Box ${boxId} validation failed`);
            }
          },
          error: () => {
            this.addingBox.set(false);
            this.snackbarService.showError(`Failed to validate box ${boxId}`);
          }
        });
    }
  }

  private commitBox(boxId: string, boxData: BoxDataDto): void {
    const currentShipmentNo = this.form.get('shipmentNo')?.value || 'new';
    const consigneeId = this.form.get('consigneeId')?.value || '';
    const shipmentDate = this.getShipmentDateIso();
    const carrier = this.form.get('carrier')?.value || '';
    const trackNo = this.form.get('trackNumber')?.value || '';
    const flightNo = this.form.get('flightNo')?.value || '';

    this.apiService.completeBoxEntry(currentShipmentNo, {
      consigneeId, shipmentDate, carrier, trackNo, flightNo, boxId
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.sessionBoxes.update(list => [...list, boxData]);
        this.availableBoxes.update(boxes => boxes.filter(b => b.boxId !== boxId));

        if (response.shipmentNo && currentShipmentNo === 'new') {
          this.form.patchValue({ shipmentNo: response.shipmentNo });
          this.shipmentData.set({
            shipmentNo: response.shipmentNo,
            consigneeId,
            shipmentDate
          } as ShipmentHeaderDto);
        }

        this.addingBox.set(false);
        this.refreshBoxTable();
        this.snackbarService.showSuccess(`Box ${boxId} added to shipment`);
      },
      error: (err) => {
        this.addingBox.set(false);
        const msg = err?.error?.message || `Failed to commit box ${boxId}`;
        this.snackbarService.showError(msg);
      }
    });
  }

  /**
   * CLEAR ALL button - reset form and data
   */
  onClearAll(): void {
    this.form.reset();
    this.sessionBoxes.set([]);
    this.availableBoxes.set([]);
    this.shipmentData.set(null);
    this.submitted.set(false);
    this.error.set(null);
    this.selectedBoxId.set(null);
  }

  /**
   * VIEW PRODUCTS IN BOX button
   */
  onViewProductsInBox(): void {
    const shipmentNo = this.form.get('shipmentNo')?.value;

    if (!shipmentNo) {
      this.snackbarService.showError('Please retrieve a shipment first');
      return;
    }

    this.dialog.open(ViewProductsInBoxDialog, {
      width: '50vw',
      height: '100vh',
      position: { right: '0', top: '0' },
      panelClass: 'right-side-panel',
      data: { shipmentNo: shipmentNo || '' },
      disableClose: false
    });
  }

  /**
   * VIEW CONSIGNEES IN THE SAME ZONE button
   */
  onViewConsigneesInZone(): void {
    const consigneeId = this.form.get('consigneeId')?.value;

    if (!consigneeId) {
      this.snackbarService.showError('Please select a Consignee ID');
      return;
    }

    this.dialog.open(ViewConsigneesInZoneDialog, {
      width: '50vw',
      height: '100vh',
      position: { right: '0', top: '0' },
      panelClass: 'right-side-panel',
      data: { consigneeId, zone: this.currentZone },
      disableClose: false
    });
  }

  onCompleteBoxEntry(): void {
    const shipmentNo = this.form.get('shipmentNo')?.value;
    if (!shipmentNo || !this.shipmentData()) {
      this.snackbarService.showError('No active shipment to finalize');
      return;
    }

    const printDialogRef = this.dialog.open(PackListPrintConfirmationDialog, {
      width: '500px',
      disableClose: true,
      data: { shipmentNo }
    });

    printDialogRef.afterClosed().subscribe((result: PackListPrintConfirmationResult) => {
      if (!result) return;

      if (result.print && result.printerId) {
        const chargesDialogRef = this.dialog.open(ShipmentChargesDialog, {
          width: '50vw',
          height: '100vh',
          position: { right: '0', top: '0' },
          panelClass: 'right-side-panel',
          data: {
            shipmentNo,
            orderNo: '',
            boxCount: this.sessionBoxes().length,
            finalizeOnSave: true,
            printerId: result.printerId
          },
          disableClose: false
        });

        chargesDialogRef.afterClosed().subscribe(chargesResult => {
          if (chargesResult?.finalized) {
            this.snackbarService.showSuccess(`Shipment Number ${shipmentNo} pack list has been printed.`);
            this.onClearAll();
            this.loadLookupData();
          }
        });
      } else {
        this.snackbarService.showSuccess('Shipment remains open.');
        this.onClearAll();
        this.loadLookupData();
      }
    });
  }

  /**
   * Open Shipment Charges dialog
   */
  onOpenShipmentCharges(): void {
    const shipmentNo = this.form.get('shipmentNo')?.value;
    const orderNo = ''; // TODO: Determine where orderNo comes from

    if (!shipmentNo) {
      this.snackbarService.showError('Please select or enter a shipment number');
      return;
    }

    const dialogRef = this.dialog.open(ShipmentChargesDialog, {
      width: '1000px',
      maxHeight: '700px',
      data: { shipmentNo, orderNo, boxCount: this.sessionBoxes().length },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.saved) {
        // Refresh data if charges were saved
        this.onRetrieve();
      }
    });
  }

  /**
   * Handle table row selection
   */
  onRowSelect(row: BoxDataDto): void {
    this.selectedBoxId.set(row.boxId);
  }

  onSelectionChange(selected: BoxDataDto[]): void {
    this.selectedBoxes.set(selected);
  }

  /**
   * Handle table page change
   */
  onPageChange(event: TablePageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onBoxSortChange(event: TableSortEvent): void {
    this.boxSort.set({ column: event.column, direction: event.direction });
  }

  private refreshBoxTable(): void {
    this.showBoxTable.set(false);
    this.cdr.detectChanges();
    this.showBoxTable.set(true);
  }

  protected onShipmentDateBlur(): void {
    const control = this.form.get('actualShipmentDate');
    if (!control) return;
    control.markAsTouched();

    const raw = control.value?.trim();
    if (!raw) return;

    const errors = { ...control.errors };
    delete errors['futureDateTime'];
    control.setErrors(Object.keys(errors).length ? errors : null);

    if (control.hasError('pattern')) return;

    const parsed = moment(raw, 'DD-MMM-YYYY HH:mm', true);
    if (!parsed.isValid()) return;

    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
    if (parsed.isSameOrAfter(chapterNow)) {
      control.setErrors({ ...control.errors, futureDateTime: true });
    }
  }

  private getShipmentDateIso(): string {
    const raw = this.form.get('actualShipmentDate')?.value?.trim();
    const parsed = moment(raw, 'DD-MMM-YYYY HH:mm', true);
    return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm:ss') : '';
  }

  formatDate(value: string | Date | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }
}
