import {
  Component, OnInit, OnDestroy, inject,
  signal, computed, effect, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin, of, map } from 'rxjs';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ScanSelectFieldComponent } from '@shared/components/scan-select-field';
import type { ScanSelectOption } from '@shared/components/scan-select-field';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';

import { PackService, LookupOption } from './services/pack.service';
import {
  OrderSearchDto, OrderDetailDto, OrderItemDto, PickSlipDto,
  ActiveBoxDto, BoxTypeDto, PackedProductDto, PackStatusItemDto,
  PackProductRequestDto, QuarantineProductRequestDto, CreateBoxRequestDto, PACK_FIELD_LENGTHS,
  PackStatusDialogData, ViewBoxContentsDialogData
} from './models/pack.models';

import {
  CreateNewBoxDialogComponent,
  CreateNewBoxDialogData,
  CreateNewBoxDialogResult
} from '../../../../distribution/offline-product-packing/create-new-box-dialog/create-new-box-dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { PackStatusDialogComponent } from './dialogs/pack-status/pack-status-dialog';
import { ViewBoxContentsDialogComponent } from './dialogs/view-box-contents/view-box-contents-dialog';

@Component({
  selector: 'app-pack',
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
    MatDatepickerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    MatAutocompleteModule,
    DataTable,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
    ConfirmActionDialogComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './pack.component.html',
  styleUrl: './pack.component.scss'
})
export class PackComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `pack-${PackComponent.nextId++}`;
  protected readonly elementId = (n: string) => `${this.componentId}-${n}`;

  private readonly fb = inject(FormBuilder);
  private readonly packService = inject(PackService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly snackbar = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  readonly FIELD_LENGTHS = PACK_FIELD_LENGTHS;

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;
  @ViewChild('aboRhField') aboRhField?: ScanSelectFieldComponent;

  // ── Page header ─────────────────────────────────────────────────────────────

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }, { label: 'Pack Product' }],
    title: 'Pack Product',
    subtitle: 'Inspecting the finished item, placing it in suitable packaging, labeling it correctly, and preparing it for shipment while meeting quality and safety standards.'
  };

  // ── Search controls for ngx-mat-select-search ────────────────────────────────

  readonly orderSearchControl = new FormControl('');
  readonly boxIdSearchControl = new FormControl('');
  readonly typeSearchControl = new FormControl('');

  readonly filteredBoxes = signal<ActiveBoxDto[]>([]);
  readonly filteredBoxTypes = signal<BoxTypeDto[]>([]);

  // ── Signals ──────────────────────────────────────────────────────────────────

  readonly loading = signal(false);
  readonly orderLoading = signal(false);
  readonly packingLoading = signal(false);
  readonly packStatusLoading = signal(false);
  readonly boxContentsLoading = signal(false);

  readonly allOrders = signal<OrderSearchDto[]>([]);
  readonly filteredOrders = signal<OrderSearchDto[]>([]);

  readonly orderDetails = signal<OrderDetailDto | null>(null);
  readonly orderItems = signal<OrderItemDto[]>([]);
  readonly pickSlips = signal<PickSlipDto[]>([]);
  readonly activeBoxes = signal<ActiveBoxDto[]>([]);
  readonly boxTypes = signal<BoxTypeDto[]>([]);
  readonly packedProducts = signal<PackedProductDto[]>([]);

  readonly currentPickSlipId = signal<string | null>(null);
  readonly currentBoxId = signal<string | null>(null);
  readonly currentBoxType = signal<string | null>(null);
  readonly currentBoxTypeDesc = signal<string | null>(null);

  // Stores the exact expiry datetime loaded from DB (for validation reference only)
  allowedExpiryMoment: ReturnType<typeof moment> | null = null;

  // Error signals for expiry time field — same pattern as check-in-details
  readonly expiryTimeError = signal<string>('');

  // Cascade lookup options (Unit → Product Code → Aliquot → Blood Type)
  readonly productCodeOptions = signal<LookupOption[]>([]);
  readonly aliquotOptions = signal<LookupOption[]>([]);
  readonly bloodTypeOptions = signal<LookupOption[]>([]);

  // Code scheme from unit validation — 'I' = ISBT Code128, 'C' = Codabar
  readonly codeScheme = signal<'I' | 'C'>('I');

  // True while validateExpiryScan API call is in-flight
  readonly expiryProcessing = signal(false);

  // ABO/Rh options converted from LookupOption[] to ScanSelectOption[] for ScanSelectFieldComponent
  readonly aboRhSelectOptions = computed<ScanSelectOption[]>(() =>
    this.bloodTypeOptions().map(o => ({ code: o.value, description: o.label ?? '' }))
  );

  // parseFn for ScanSelectFieldComponent — auto-detects scheme from scan format.
  // ISBT ABO scan:    =% + 2-char code + 2 padding = 6 chars  (e.g. =%9500)
  // Codabar ABO scan: D  + 2-char code + 0B        = 5 chars  (e.g. D950B)
  // Manual entry:     raw code (≤5 chars) — uses unit's codeScheme for DB lookup
  readonly parseAboRh = (scan: string) => {
    const scheme =
      (scan.startsWith('=%') && scan.length === 6) ? 'I' :
      (/^D[A-Za-z0-9]{2}0B$/i.test(scan)) ? 'C' :
      this.codeScheme();
    return this.labelScanService.validateAboScan(scan, scheme).pipe(
      map(res => {
        if (res.success && res.item) {
          return {
            code: res.item.aboCode!,
            description: res.item.aboShortName ?? res.item.aboLabel ?? '',
          } as ScanSelectOption;
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid ABO/Rh scan');
      })
    );
  };

  // ── Computed ─────────────────────────────────────────────────────────────────

  readonly hasOrderData = computed(() => !!this.orderDetails());
  readonly isEmpty = computed(() => !this.hasOrderData());

  // ── Forms ────────────────────────────────────────────────────────────────────

  headerForm!: FormGroup;
  packForm!: FormGroup;

  // ── Table configs ─────────────────────────────────────────────────────────────

  readonly orderItemsTableConfig = computed<DataTableConfig<OrderItemDto>>(() => ({
    columns: [
      { key: 'itemNo', header: `Items (${this.orderItems().length})`, width: '80px' },
      { key: 'productType', header: 'Product Type' },
      { key: 'productDescription', header: 'Description' },
      { key: 'aboRhDescription', header: 'Ordered ABO/Rh' },
      { key: 'remainingQty', header: 'Ordered Quantity' },
      { key: 'itemStatusDescription', header: 'Ordered Status' },
      { key: 'attributes', header: 'Ordered Attributes' },
    ],
    showPagination: false,
    showTableOnEmpty: true,
    emptyMessage: 'No order items',
    stickyHeader: true,
  }));

  readonly packedProductsTableConfig: DataTableConfig<PackedProductDto> = {
    columns: [
      { key: 'unitId', header: 'Unit ID' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'aboRhDescription', header: 'Ordered ABO/Rh' },
      { key: 'expDate', header: 'Expiry Date and Time', valueFormatter: (v) => this.formatDateTime(v as string) },
      { key: 'boxId', header: 'Box ID' },
      { key: 'insertUser', header: 'Where Product Packed' },
    ],
    showPagination: false,
    showTableOnEmpty: true,
    emptyMessage: 'No products packed yet',
    stickyHeader: true,
  };

  // ── Init ──────────────────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          title: pageData.title || this.headerConfig.title,
          subtitle: pageData.subtitle || this.headerConfig.subtitle,
          breadcrumbs: [{ label: 'Home', link: '/home' }, { label: pageData.title || 'Pack Product' }]
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.setupOrderSearch();
    this.setupBoxSearch();
    this.setupBoxTypeSearch();
    this.loadBoxTypes();
    this.loadOrders();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadBoxTypes();
        this.loadOrders();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.headerForm = this.fb.group({
      orderNo: [''],
    });

    this.packForm = this.fb.group({
      itemNo: [''],
      unitId: [''],
      productCode: ['', Validators.required],
      aliquot: [''],
      aboRh: ['', Validators.required],
      expirationDate: ['', [Validators.required]],
      qualityCheck: [''],
    });

  }

  // ── Data loading ──────────────────────────────────────────────────────────────

  private loadOrders(): void {
    this.packService.getAllOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const orders = res.data ?? [];
          this.allOrders.set(orders);
          this.filteredOrders.set(orders);
        },
        error: () => {
          this.allOrders.set([]);
          this.filteredOrders.set([]);
        }
      });
  }

  private loadBoxTypes(): void {
    this.packService.getBoxTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.boxTypes.set(res.data ?? []);
          this.filteredBoxTypes.set(res.data ?? []);
        },
        error: () => { this.boxTypes.set([]); this.filteredBoxTypes.set([]); }
      });
  }

  private loadActiveBoxes(): void {
    this.packService.getActiveBoxes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.activeBoxes.set(res.data ?? []);
          this.filteredBoxes.set(res.data ?? []);
        },
        error: () => { this.activeBoxes.set([]); this.filteredBoxes.set([]); }
      });
  }

  private loadPickSlips(orderNo: string): void {
    this.packService.getPickSlipsForOrder(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const slips = res.data ?? [];
          this.pickSlips.set(slips);
          if (slips.length > 0) {
            this.currentPickSlipId.set(slips[0].pickSlipId);
            this.loadPackedProducts(slips[0].pickSlipId);
          }
        },
        error: () => this.pickSlips.set([])
      });
  }

  private loadPackedProducts(pickSlipId: string): void {
    // Load products across ALL pick slips for this order so the bottom table
    // always shows every packed product regardless of which box they belong to.
    const allSlipIds = this.pickSlips().map(s => s.pickSlipId);
    // Always include the current pick slip ID in case it isn't in pickSlips() yet
    if (!allSlipIds.includes(pickSlipId)) {
      allSlipIds.unshift(pickSlipId);
    }
    const requests = allSlipIds.map(id => this.packService.getPackedProducts(id));
    if (!requests.length) {
      this.packedProducts.set([]);
      return;
    }
    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          const all: PackedProductDto[] = [];
          for (const res of results) {
            if (res.data) all.push(...res.data);
          }
          this.packedProducts.set(all);
        },
        error: () => {}
      });
  }

  // ── Order search autocomplete ─────────────────────────────────────────────────

  private setupOrderSearch(): void {
    this.orderSearchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase().trim();
        if (!t) {
          this.filteredOrders.set(this.allOrders());
          return;
        }
        this.filteredOrders.set(
          this.allOrders().filter(o =>
            o.orderNo.toLowerCase().includes(t) ||
            (o.consigneeName ?? '').toLowerCase().includes(t)
          )
        );
      });
  }

  private setupBoxSearch(): void {
    this.boxIdSearchControl.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase().trim();
        this.filteredBoxes.set(
          !t ? this.activeBoxes() : this.activeBoxes().filter(b => b.boxId.toLowerCase().includes(t))
        );
      });
  }

  private setupBoxTypeSearch(): void {
    this.typeSearchControl.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase().trim();
        this.filteredBoxTypes.set(
          !t ? this.boxTypes() : this.boxTypes().filter(bt =>
            bt.code.toLowerCase().includes(t) ||
            (bt.description ?? '').toLowerCase().includes(t)
          )
        );
      });
  }

  // ── Order selection ───────────────────────────────────────────────────────────

  onOrderSelected(orderNo: string): void {
    if (!orderNo) { this.clearAll(); return; }

    this.orderLoading.set(true);
    this.clearOrderData();

    this.packService.getOrderDetails(orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.orderDetails.set(res.data);
            this.orderItems.set(res.data.items ?? []);
            if (res.data.items?.length) {
              // Auto-select first packable item — skip cancelled (CA) items
              const firstPackable = res.data.items.find(
                i => i.itemStatus && !['CA', 'PK', 'SH'].includes(i.itemStatus)
              ) ?? res.data.items[0];
              this.packForm.patchValue({ itemNo: firstPackable.itemNo });
            }
            this.loadPickSlips(orderNo);
            this.loadActiveBoxes();
          } else {
            this.snackbar.showError('Order not found');
          }
          this.orderLoading.set(false);
        },
        error: (err) => {
          this.snackbar.showError(err?.error?.message ?? 'Failed to load order');
          this.orderLoading.set(false);
        }
      });
  }

  // ── Box selection ─────────────────────────────────────────────────────────────

  onBoxSelected(boxId: string): void {
    this.currentBoxId.set(boxId || null);
    const box = this.activeBoxes().find(b => b.boxId === boxId);
    this.currentBoxType.set(box?.boxType ?? null);
    this.currentBoxTypeDesc.set(box?.boxTypeDescription ?? null);
  }

  // Called by <app-unit-id-field> (validated) output — unit ID is confirmed valid
  onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;

    this.codeScheme.set(data.codeScheme ?? 'I');
    this.packForm.patchValue({ unitId });
    this.productCodeOptions.set([]);
    this.aliquotOptions.set([]);
    this.bloodTypeOptions.set([]);
    this.aboRhField?.clear();
    this.packForm.patchValue({ productCode: '', aliquot: '', aboRh: '' });

    this.packService.getProductCodes(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.productCodeOptions.set(data ?? []);
          // Client requirement: do NOT auto-populate product code, ABORh, expiry or QC
          // after unit ID scan — user must scan or enter each field manually.
        },
        error: () => {
          this.productCodeOptions.set([]);
          this.snackbar.showError('Failed to load product codes for this unit.');
        }
      });
  }

  // Called when unit-id-field is cleared
  onUnitCleared(): void {
    this.codeScheme.set('I');
    this.allowedExpiryMoment = null;
    this.aboRhField?.clear();
    this.packForm.patchValue({ unitId: '', productCode: '', aliquot: '', aboRh: '', expirationDate: '' });
    this.packForm.get('productCode')?.markAsUntouched();
    this.packForm.get('aliquot')?.markAsUntouched();
    this.packForm.get('aboRh')?.markAsUntouched();
    this.packForm.get('expirationDate')?.markAsUntouched();
    this.productCodeOptions.set([]);
    this.aliquotOptions.set([]);
    this.bloodTypeOptions.set([]);
  }

  // When Product Code changes → load aliquots, clear downstream
  onProductCodeChange(productCode: string, autoSelected = false): void {
    const unitId = this.packForm.get('unitId')?.value?.trim();
    this.aliquotOptions.set([]);
    this.bloodTypeOptions.set([]);
    this.aboRhField?.clear();
    this.packForm.patchValue({ aliquot: '', aboRh: '' });
    this.packForm.get('aliquot')?.markAsUntouched();
    this.packForm.get('aboRh')?.markAsUntouched();

    if (!unitId || !productCode) return;

    this.packService.getAliquots(unitId, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.aliquotOptions.set(data ?? []);
          if (!data || data.length === 0) {
            // Default to '00' — FMB uses NVL(:Aliquot, '00')
            this.packForm.patchValue({ aliquot: '00' });
            this.onAliquotChange('00');
          } else {
            // Always auto-select first aliquot — field is hidden from UI
            const aliquot = data[0].value;
            this.packForm.patchValue({ aliquot });
            this.onAliquotChange(aliquot);
          }
        },
        error: () => {
          this.aliquotOptions.set([]);
          this.snackbar.showError('Failed to load aliquots for this unit.');
        }
      });
  }

  // When Aliquot changes (background) → load blood types + cache expiry for validation only
  onAliquotChange(aliquot: string, autoSelected = false): void {
    const unitId = this.packForm.get('unitId')?.value?.trim();
    const productCode = this.packForm.get('productCode')?.value?.trim();
    this.bloodTypeOptions.set([]);
    this.packForm.patchValue({ aboRh: '' });

    if (!unitId || !productCode || !aliquot) return;

    forkJoin({
      bloodTypes: this.packService.getBloodTypes(unitId, productCode),
      expiry: this.packService.getUnitExpiry(unitId, productCode, aliquot)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ bloodTypes, expiry }) => {
          // Load blood type options — user must scan or select, do NOT auto-select
          this.bloodTypeOptions.set(bloodTypes ?? []);
          if (!bloodTypes || bloodTypes.length === 0) {
            this.snackbar.showError(`No ABO/Rh types found for unit ${unitId}.`);
          }

          // Cache allowed expiry moment for calendar filtering + validation ONLY
          // Do NOT auto-fill the expiry field — user must scan or enter it
          if (expiry.success && expiry.data) {
            const m = moment(expiry.data, 'DD-MMM-YYYY HH:mm', true);
            if (m.isValid()) {
              this.allowedExpiryMoment = m;
            }
          }
        },
        error: () => {
          this.bloodTypeOptions.set([]);
          this.snackbar.showError('Failed to load product details for this unit.');
        }
      });
  }

  // ── Expiry date + time handlers ───────────────────────────────────────────────

  // Parses HHMM or HH:MM → returns "HH:MM" or null — same logic as check-in-details
  private parseTimeInput(raw: string): string | null {
    const s = raw.trim();
    let h: number, m: number;
    if (/^\d{4}$/.test(s)) {
      h = parseInt(s.slice(0, 2), 10);
      m = parseInt(s.slice(2, 4), 10);
    } else if (/^\d{1,2}:\d{2}$/.test(s)) {
      [h, m] = s.split(':').map(Number);
    } else {
      return null;
    }
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Expiry field blur — detects ISBT barcode scans first, falls back to manual date parsing.
  // Scan prefixes (from sbclib/ISBT 128 spec):
  //   &> = Julian with time (YYYDDDHH24MI, 12 chars total)
  //   &< = Julian with time alternate encoding
  //   => = date-only (YYMMDD, 8 chars total)
  onExpirationDateBlur(): void {
    const ctrl = this.packForm.get('expirationDate');
    const raw = ((ctrl?.value ?? '') as string).trim();
    ctrl?.markAsTouched();
    if (!raw) return;

    // ── Scan path ──
    // ISBT:    &> (Julian+time, 12 chars), &< (Julian alternate), => (date-only)
    // Codabar: A + MMDDYY + C/CC  (7–8 chars, e.g. A051612C)
    const isIsbtScan = raw.startsWith('&>') || raw.startsWith('&<') || raw.startsWith('=>');
    const isCodabarScan = /^A\d{4,6}C{1,2}$/i.test(raw);
    if (isIsbtScan || isCodabarScan) {
      // Always derive scheme from scan format — don't rely on unit's codeScheme
      const scanScheme: 'I' | 'C' = isIsbtScan ? 'I' : 'C';
      this.expiryProcessing.set(true);
      ctrl?.setErrors(null);
      this.labelScanService.validateExpiryScan(raw, scanScheme)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.expiryProcessing.set(false);
            if (res.success && res.item?.expiryDisplay) {
              ctrl?.setValue(res.item.expiryDisplay, { emitEvent: false });
              ctrl?.setErrors(null);
              this.validateExpiryAgainstDb(res.item.expiryDisplay);
            } else {
              ctrl?.setErrors({ scanInvalid: true });
            }
          },
          error: () => {
            this.expiryProcessing.set(false);
            ctrl?.setErrors({ scanInvalid: true });
          },
        });
      return;
    }

    // ── Manual date path ──
    const spaceIdx = raw.lastIndexOf(' ');
    const datePart = spaceIdx > 0 ? raw.substring(0, spaceIdx).trim() : raw;
    const timePart = spaceIdx > 0 ? raw.substring(spaceIdx + 1).trim() : '';

    const parsed = moment(datePart, [
      'DD-MMM-YYYY', 'DD/MMM/YYYY', 'DD.MMM.YYYY', 'YYYY-MMM-DD',
      'DD-MM-YYYY',  'DD/MM/YYYY',  'DD.MM.YYYY',
      'YYYY-MM-DD',  'YYYY/MM/DD',
      'DDMMYYYY',    'YYYYMMDD'
    ], false);
    if (!parsed.isValid()) {
      ctrl?.setErrors({ invalidFormat: true });
      return;
    }

    let normalizedTime = '00:00';
    if (timePart) {
      const t = this.parseTimeInput(timePart);
      if (!t) {
        ctrl?.setErrors({ invalidTime: true });
        return;
      }
      normalizedTime = t;
    }

    const normalised = `${parsed.format('DD-MMM-YYYY').toUpperCase()} ${normalizedTime}`;
    ctrl?.setValue(normalised, { emitEvent: false });
    ctrl?.setErrors(null);
    this.validateExpiryAgainstDb(normalised);
  }

  private validateExpiryAgainstDb(normalised: string): void {
    const ctrl = this.packForm.get('expirationDate');
    const unitId = this.packForm.get('unitId')?.value?.trim();
    const productCode = this.packForm.get('productCode')?.value?.trim();
    const aliquot = this.packForm.get('aliquot')?.value?.trim() || '00';
    if (!unitId || !productCode) return;

    this.packService.validateExpiry({ unitId, productCode, aliquot, expiryDate: normalised })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success) {
            ctrl?.setErrors({ expiryDbMismatch: true });
          } else {
            ctrl?.setErrors(null);
          }
        },
        error: () => {},
      });
  }

  getExpirationDateError(): string {
    const ctrl = this.packForm.get('expirationDate');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required')) return 'Expiration date & time is required';
    if (ctrl.hasError('scanInvalid')) return 'Could not parse scanned expiry — check barcode and retry';
    if (ctrl.hasError('invalidFormat')) return 'Invalid date — use DD-MMM-YYYY HH:mm, DD-MM-YYYY HH:mm, or DDMMYYYY HH:mm';
    if (ctrl.hasError('invalidTime')) return 'Invalid time — use HH:mm or HHMM (e.g. 2359)';
    if (ctrl.hasError('expiryDbMismatch')) return 'Does not match product record (Error 0308)';
    return '';
  }

  // ── Pack form field error helpers ─────────────────────────────────────────────

  isFieldInvalid(name: string): boolean {
    const ctrl = this.packForm.get(name);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  getFieldError(name: string): string {
    const ctrl = this.packForm.get(name);
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required')) return `${name === 'productCode' ? 'Product Code' : name === 'aboRh' ? 'ABO/Rh' : name} is required`;
    return '';
  }

  // Called by ScanSelectFieldComponent when a valid option is selected or scan is parsed
  onAboRhChanged(option: ScanSelectOption | null): void {
    this.packForm.patchValue({ aboRh: option?.code ?? '' });
    this.packForm.get('aboRh')?.setErrors(null);
    this.packForm.get('aboRh')?.markAsTouched();
  }

  // Called when the ABO/Rh scan-select field is cleared
  onAboRhCleared(): void {
    this.packForm.patchValue({ aboRh: '' });
    this.packForm.get('aboRh')?.markAsUntouched();
  }

  // ── Pack form validity check ───────────────────────────────────────────────────

  isPackFormValid(): boolean {
    // Unit ID must be validated by the shared component
    if (!this.unitIdField?.isValid) return false;
    // Product Code and ABO/Rh must be selected
    if (!this.packForm.get('productCode')?.value) return false;
    if (!this.packForm.get('aboRh')?.value) return false;
    return true;
  }

  onTypeSelected(code: string): void {
    this.currentBoxType.set(code || null);
    const bt = this.boxTypes().find(b => b.code === code);
    this.currentBoxTypeDesc.set(bt?.description ?? null);
  }

  // Intercept Tab on QC field — prevent focus escaping to footer links (bug #6)
  onQcTab(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.onPackProduct();
  }

  // ── Pack product ──────────────────────────────────────────────────────────────

  onPackProduct(): void {
    const pickSlipId = this.currentPickSlipId();
    const boxId = this.currentBoxId();
    const orderNo = this.headerForm.get('orderNo')?.value;

    if (!orderNo) { this.snackbar.showError('Please select an order'); return; }

    // Mark all fields touched to show field-level errors
    this.packForm.markAllAsTouched();

    if (!this.unitIdField?.isValid) { this.snackbar.showError('Please enter a valid Unit ID'); return; }

    const v = this.packForm.getRawValue();
    if (!v.productCode?.trim()) { this.snackbar.showError('Product Code is required'); return; }
    if (!v.aboRh?.trim()) { this.snackbar.showError('ABO/Rh is required'); return; }
    if (!v.qualityCheck?.trim()) { this.snackbar.showError('Quality Check is required'); return; }

    // Validate expiry date+time combined field
    const expCtrl = this.packForm.get('expirationDate');
    if (!v.expirationDate?.trim()) { this.snackbar.showError('Expiration date & time is required'); return; }
    if (expCtrl?.invalid) { this.snackbar.showError(this.getExpirationDateError() || 'Expiration date is invalid'); return; }

    // No box selected — FMB: gen_box_id when box_id is null (auto-create on first pack)
    if (!boxId) {
      const boxType = this.currentBoxType() ?? this.boxTypes()[0]?.code;
      if (!boxType) {
        this.snackbar.showError('Please select a Box Type before packing');
        return;
      }
      this.packingLoading.set(true);
      this.packService.createBox({ boxType })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.snackbar.showSuccess(`Box ${res.data} created`);
              this.currentBoxId.set(res.data);
              this.currentBoxType.set(boxType);
              this.packingLoading.set(false);
              this.loadActiveBoxes();
              // Re-run with the new box ID
              this.onPackProduct();
            } else {
              this.packingLoading.set(false);
              this.snackbar.showError(res.message ?? 'Failed to create box');
            }
          },
          error: (err) => {
            this.packingLoading.set(false);
            this.snackbar.showError(err?.error?.message ?? 'Failed to create box');
          }
        });
      return;
    }

    // Check box is still open
    const selectedBox = this.activeBoxes().find(b => b.boxId === boxId);
    if (selectedBox?.boxStatus === 'CL') {
      this.snackbar.showError(`Box ${boxId} is already closed. Please select an open box or create a new one.`);
      return;
    }

    // Parse combined expiry field — by blur-time it's already normalised to "DD-MMM-YYYY HH:mm"
    const expMoment = moment((v.expirationDate as string)?.trim(), 'DD-MMM-YYYY HH:mm', true);
    const expDate = expMoment.isValid() ? expMoment.format('YYYY-MM-DDTHH:mm:ss') : null;

    const unitId = v.unitId.trim().toUpperCase();
    const productCode = v.productCode.trim().toUpperCase();
    const aliquot = v.aliquot?.trim() || null;

    // QC='N' path — FMB: show_error_dist('3101') + hold_product() quarantine flow
    if (v.qualityCheck === 'N') {
      const ref = this.dialog.open(ConfirmActionDialogComponent, {
        data: {
          title: 'Place product on quarantine?',
          message: `Unit ${unitId} failed visual QC. Do you want to quarantine this product?`,
          confirmText: 'YES',
          cancelText: 'NO'
        }
      });
      ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        const qRequest: QuarantineProductRequestDto = {
          orderNo,
          pickSlipId: pickSlipId ?? undefined,
          unitId,
          productCode,
          aliquot,
          reason: 'VSUAL'
        };
        this.packingLoading.set(true);
        this.packService.quarantineProduct(qRequest)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.packingLoading.set(false);
              if (res.success) {
                this.snackbar.showSuccess(`Product ${unitId} placed on quarantine`);
                this.clearPackForm();
              } else {
                this.snackbar.showError(res.message ?? 'Failed to quarantine product');
              }
            },
            error: (err) => {
              this.packingLoading.set(false);
              this.snackbar.showError(err?.error?.message || 'Failed to quarantine product');
            }
          });
      });
      return;
    }

    const request: PackProductRequestDto = {
      orderNo,
      pickSlipId: pickSlipId ?? undefined,
      boxId,
      itemNo: v.itemNo ? Number(v.itemNo) : 1,
      unitId,
      productCode,
      aliquot,
      bloodType: v.aboRh?.trim() || null,
      expDate,
      qcCheck: 'Y',
    };

    this.packingLoading.set(true);
    this.packService.packProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.packingLoading.set(false);
          if (res.success) {
            this.snackbar.showSuccess('Product packed successfully');
            this.clearPackForm();
            // Refresh pick slips — BE may have auto-created one
            const resolvedPickSlipId = (res as any).pickSlipId ?? pickSlipId;
            if (resolvedPickSlipId) {
              this.currentPickSlipId.set(resolvedPickSlipId);
              this.loadPackedProducts(resolvedPickSlipId);
              if (!this.pickSlips().some(s => s.pickSlipId === resolvedPickSlipId)) {
                this.loadPickSlips(orderNo);
              }
            } else {
              this.loadPickSlips(orderNo);
            }
            // Refresh box ID display (box auto-created or updated)
            this.loadActiveBoxes();
            // Return focus to Unit ID so next scan is ready immediately
            setTimeout(() => this.unitIdField?.focus(), 50);
          } else {
            this.snackbar.showError(res.message ?? 'Failed to pack product');
          }
        },
        error: (err) => {
          this.packingLoading.set(false);
          const msg = err?.error?.message || err?.message || 'Failed to pack product';
          this.snackbar.showError(msg);
        }
      });
  }

  // ── Create new box ────────────────────────────────────────────────────────────

  onCloseCurrentBox(): void {
    const boxId = this.currentBoxId();
    if (!boxId) return;
    this.loading.set(true);
    this.packService.closeBox(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbar.showSuccess(`Box ${boxId} closed successfully`);
          this.currentBoxId.set(null);
          this.loading.set(false);
        },
        error: () => {
          this.snackbar.showError('Failed to close box');
          this.loading.set(false);
        }
      });
  }

  onCreateNewBox(): void {
    if (!this.hasOrderData()) {
      this.snackbar.showError('Please select an order first');
      return;
    }

    const dialogData: CreateNewBoxDialogData = {
      currentBoxId: this.currentBoxId(),
      hasPackedProducts: this.packedProducts().length > 0,
    };

    const ref = this.dialog.open(CreateNewBoxDialogComponent, {
      width: '500px',
      disableClose: true,
      data: dialogData,
    });

    ref.afterClosed().subscribe((result: CreateNewBoxDialogResult | null) => {
      if (!result) return;

      // Close current box first if requested
      const doCreate = () => this.createNewBox();

      if (result.closeCurrentBox && this.currentBoxId()) {
        this.loading.set(true);
        this.packService.closeBox(this.currentBoxId()!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackbar.showSuccess('Current box closed');
              this.loading.set(false);
              doCreate();
            },
            error: () => {
              this.snackbar.showError('Failed to close current box');
              this.loading.set(false);
            }
          });
      } else {
        doCreate();
      }
    });
  }

  private createNewBox(): void {
    const boxType = this.currentBoxType() ?? this.boxTypes()[0]?.code;
    if (!boxType) {
      this.snackbar.showError('No box type available — please select a box type first');
      return;
    }

    const request: CreateBoxRequestDto = { boxType };
    this.loading.set(true);

    this.packService.createBox(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.snackbar.showSuccess(`Box ${res.data} created`);
            this.loadActiveBoxes();
            // Auto-select the new box
            setTimeout(() => {
              const newBox = this.activeBoxes().find(b => b.boxId === res.data);
              if (newBox) {
                this.currentBoxId.set(newBox.boxId);
                this.currentBoxType.set(newBox.boxType ?? null);
                this.currentBoxTypeDesc.set(newBox.boxTypeDescription ?? null);
              }
            }, 500);
          } else {
            this.snackbar.showError(res.message ?? 'Failed to create box');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.snackbar.showError(err?.error?.message ?? 'Failed to create box');
          this.loading.set(false);
        }
      });
  }

  // ── Pack Status dialog ────────────────────────────────────────────────────────

  onPackStatus(): void {
    if (this.packStatusLoading()) return;
    const currentPickSlipId = this.currentPickSlipId();
    if (!currentPickSlipId) { this.snackbar.showError('No pick slip selected'); return; }

    // Fetch pack status across ALL pick slips for this order so the dialog
    // shows every packed and allocated product regardless of which pick slip they belong to.
    const allSlipIds = this.pickSlips().map(s => s.pickSlipId);
    if (!allSlipIds.includes(currentPickSlipId)) {
      allSlipIds.unshift(currentPickSlipId);
    }

    this.packStatusLoading.set(true);
    const requests = allSlipIds.map(id => this.packService.getPackStatus(id));
    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.packStatusLoading.set(false);
          const allItems: PackStatusItemDto[] = [];
          for (const res of results) {
            if (res.success && res.data) allItems.push(...res.data);
          }
          const packed = allItems.filter(p => p.productStatus === 'PK');
          const allocated = allItems.filter(p => p.productStatus === 'AL');
          const data: PackStatusDialogData = { packedProducts: packed, allocatedProducts: allocated };
          this.dialog.open(PackStatusDialogComponent, { width: '900px', data });
        },
        error: () => {
          this.packStatusLoading.set(false);
          this.snackbar.showError('Failed to load pack status');
        }
      });
  }

  // ── Box Contents dialog ───────────────────────────────────────────────────────

  onViewBoxContents(): void {
    if (this.boxContentsLoading()) return;
    const boxId = this.currentBoxId();
    if (!boxId) { this.snackbar.showError('No box selected'); return; }

    this.boxContentsLoading.set(true);
    this.packService.getBoxContents(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.boxContentsLoading.set(false);
          if (res.success) {
            const data: ViewBoxContentsDialogData = { boxId, products: res.data?.products ?? [] };
            this.dialog.open(ViewBoxContentsDialogComponent, { width: '800px', data });
          } else {
            this.snackbar.showError(res.message ?? 'Failed to load box contents');
          }
        },
        error: () => {
          this.boxContentsLoading.set(false);
          this.snackbar.showError('Failed to load box contents');
        }
      });
  }

  // ── Unpack ────────────────────────────────────────────────────────────────────

  onUnpackProduct(product: PackedProductDto): void {
    const pickSlipId = product.pickSlipId ?? this.currentPickSlipId();
    if (!pickSlipId) return;

    this.packService.unpackProduct({ pickSlipId, unitId: product.unitId, productCode: product.productCode })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.snackbar.showSuccess('Product unpacked');
            this.loadPackedProducts(pickSlipId);
          } else {
            this.snackbar.showError(res.message ?? 'Failed to unpack');
          }
        },
        error: () => this.snackbar.showError('Failed to unpack product')
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private clearPackForm(): void {
    this.allowedExpiryMoment = null;
    this.expiryTimeError.set('');
    this.codeScheme.set('I');
    this.unitIdField?.clear();
    this.aboRhField?.clear();
    this.packForm.patchValue({ unitId: '', productCode: '', aliquot: '', aboRh: '', expirationDate: '', qualityCheck: 'Y' });
    this.packForm.markAsUntouched();
    this.productCodeOptions.set([]);
    this.aliquotOptions.set([]);
    this.bloodTypeOptions.set([]);
  }

  private clearOrderData(): void {
    this.orderDetails.set(null);
    this.orderItems.set([]);
    this.pickSlips.set([]);
    this.packedProducts.set([]);
    this.currentPickSlipId.set(null);
  }

  private clearAll(): void {
    this.headerForm.patchValue({ orderNo: '' });
    this.orderSearchControl.reset('');
    this.boxIdSearchControl.reset('');
    this.typeSearchControl.reset('');
    this.clearOrderData();
    this.currentBoxId.set(null);
    this.currentBoxType.set(null);
    this.currentBoxTypeDesc.set(null);
    this.activeBoxes.set([]);
    this.filteredBoxes.set([]);
    this.clearPackForm();
    this.error.set(null);
    this.loadOrders();
  }

  readonly error = signal<string | null>(null);

  // ── Format helpers ─────────────────────────────────────────────────────────────

  formatDate(v: string | null | undefined): string {
    if (!v) return '';
    const m = moment(v);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  formatDateTime(v: string | null | undefined): string {
    if (!v) return '';
    const m = moment(v);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '';
  }
}
