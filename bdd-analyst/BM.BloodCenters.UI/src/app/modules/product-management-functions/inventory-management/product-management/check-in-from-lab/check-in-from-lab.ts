import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  effect,
  inject,
  Injector,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subject, map, of, takeUntil, EMPTY, throwError } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';
import { ScanSelectFieldComponent, ScanSelectOption } from '@shared/components/scan-select-field';
import { SCAN_PATTERNS, matchesScanPattern, ScanPattern } from '@shared/utils/scan-pattern.util';

import { HeaderService } from '@shared/services/header.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { CheckInFromLabService } from './check-in-from-lab.service';
import {
  InventoryClassDto,
  StorageDeviceDto,
  StorageRackDto,
  StorageTrayDto,
  UnitProductDto,
  UnitAliquotDto,
  AboTypeDto,
} from './check-in-from-lab.model';

export const ERROR_CODES = {
  ALREADY_CHECKED_IN: '5322',
  SHIPPED_NOT_RETURNED: '6301',
  QUARANTINED: '3728',
  DISCARDED: '6300',
  COMPONENT_INTERDICTED: '3721',
  UNIT_INTERDICTED: '3722',
  INVENTORY_CLASS_MISMATCH: '0347',
  BIO_HOLD_NFT: '5325',
  FUTURE_DATE: '0503',
  EXCEEDS_MAX_DAYS: '5500',
} as const;

const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.ALREADY_CHECKED_IN]: 'Product already checked in.',
  [ERROR_CODES.SHIPPED_NOT_RETURNED]: 'Product has been shipped and not returned.',
  [ERROR_CODES.QUARANTINED]: 'Product is on quarantine.',
  [ERROR_CODES.DISCARDED]: 'Product has been discarded.',
  [ERROR_CODES.COMPONENT_INTERDICTED]: 'Component has interdictions.',
  [ERROR_CODES.UNIT_INTERDICTED]: 'Unit has interdictions.',
  [ERROR_CODES.INVENTORY_CLASS_MISMATCH]: 'Inventory class does not match computed class.',
  [ERROR_CODES.BIO_HOLD_NFT]: 'Product is BIO, HOLD, or NFT and cannot be checked in.',
  [ERROR_CODES.FUTURE_DATE]: 'Date cannot be in the future.',
  [ERROR_CODES.EXCEEDS_MAX_DAYS]: 'Date exceeds maximum allowed days for check-in.',
};

export interface CheckInRecord {
  unitId: string;
  collectionDate: string;
  productCode: string;
  aboRh: string;
  expirationDate: string;
  warehouseId: string;
  device: string;
  rack: string;
  tray: string;
}

@Component({
  selector: 'app-check-in-from-lab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
  ],
  providers: [],
  templateUrl: './check-in-from-lab.html',
  styleUrls: ['./check-in-from-lab.scss'],
})
export class CheckInFromLabComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('productCodeField') productCodeField!: ScanSelectFieldComponent;
  @ViewChild('aboRhField') aboRhField!: ScanSelectFieldComponent;

  private readonly checkInService = inject(CheckInFromLabService);
  private readonly headerService = inject(HeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private readonly unitCodeScheme = signal<string>('I');
  protected readonly SCAN_PATTERNS = SCAN_PATTERNS;

  readonly parseProductCode = (value: string): Observable<ScanSelectOption | null> => {
    const trimmed = value?.trim()?.toUpperCase();
    if (!trimmed) return of(null);

    if (this.hasScanPrefix(trimmed, SCAN_PATTERNS.PRODUCT) && !matchesScanPattern(trimmed, SCAN_PATTERNS.PRODUCT)) {
      return throwError(() => new Error('Invalid scan length'));
    }

    let stripped = trimmed;
    for (const p of SCAN_PATTERNS.PRODUCT) {
      if (trimmed.startsWith(p.prefix.toUpperCase())) {
        stripped = trimmed.substring(p.prefix.length);
        break;
      }
    }

    const match = this.productCodeOptions().find(
      (o) => o.code.toUpperCase() === stripped || o.code.toUpperCase() === trimmed,
    );
    if (match) return of(match);

    return this.labelScanService.validateProductScan(value, this.unitCodeScheme()).pipe(
      map((res) => {
        if (res.success && res.item) {
          const optMatch = this.productCodeOptions().find(
            (o) => o.code.toUpperCase() === (res.item!.productCode || '').toUpperCase(),
          );
          return optMatch ?? { code: res.item.productCode!, description: res.item.productDescription ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid product code');
      }),
    );
  };

  readonly parseAboRh = (value: string): Observable<ScanSelectOption | null> => {
    const trimmed = value?.trim()?.toUpperCase();
    if (!trimmed) return of(null);

    if (this.hasScanPrefix(trimmed, SCAN_PATTERNS.ABO) && !matchesScanPattern(trimmed, SCAN_PATTERNS.ABO)) {
      return throwError(() => new Error('Invalid scan length'));
    }

    let stripped = trimmed;
    for (const p of SCAN_PATTERNS.ABO) {
      if (trimmed.startsWith(p.prefix.toUpperCase())) {
        stripped = trimmed.substring(p.prefix.length);
        break;
      }
    }

    const match = this.aboTypeOptions().find(
      (o) => o.code.toUpperCase() === stripped || o.code.toUpperCase() === trimmed,
    );
    if (match) return of(match);

    return this.labelScanService.validateAboScan(value, this.unitCodeScheme()).pipe(
      map((res) => {
        if (res.success && res.item) {
          const optMatch = this.aboTypeOptions().find(
            (o) => o.code.toUpperCase() === (res.item!.aboCode || '').toUpperCase(),
          );
          return optMatch ?? { code: res.item.aboCode!, description: res.item.aboShortName ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid ABO code');
      }),
    );
  };

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  filterForm = new FormGroup({
    inventoryClassCode: new FormControl<string | null>(null, Validators.required),
    receivedDate: new FormControl<string>(''),
  });

  entryForm = new FormGroup({
    aliquot: new FormControl<string | null>(null),
    expirationDate: new FormControl<string>(''),
    device: new FormControl<string | null>(null),
    rack: new FormControl<string | null>(null),
    tray: new FormControl<string | null>(null),
  });

  selectedProductCode = signal<string | null>(null);
  selectedAboRh = signal<string | null>(null);

  // ─── UI state ────────────────────────────────────────────────────────────
  expirationDateValidating = signal(false);
  isSaving = signal(false);
  showEntryRow = signal(false);
  isLoadingClasses = signal(false);
  isLoadingDevices = signal(false);
  isLoadingRacks = signal(false);
  isLoadingTrays = signal(false);

  // ─── Display / read-only signals ─────────────────────────────────────────
  inventoryClassDescription = signal<string>('-');
  collectionDate = signal<string>('');

  // ─── Warehouse from global header context ────────────────────────────────
  warehouseId = computed(() => this.headerService.warehouseId());

  // ─── Hidden / computed state from API ────────────────────────────────────
  private unitCollDate = signal<string>('');
  private osokFlag = signal<string>('N');
  private importFlag = signal<string>('N');
  private invProductType = signal<string>('');
  private isPoolProduct = signal<boolean>(false);
  private locationId = signal<string>('');
  private checkedInCount = signal<number>(0);

  // ─── Dropdown options from API ────────────────────────────────────────────
  inventoryClasses = signal<InventoryClassDto[]>([]);
  devices = signal<StorageDeviceDto[]>([]);
  racks = signal<StorageRackDto[]>([]);
  trays = signal<StorageTrayDto[]>([]);
  unitProducts = signal<UnitProductDto[]>([]);
  aliquotOptions = signal<UnitAliquotDto[]>([]);
  aboTypes = signal<AboTypeDto[]>([]);

  showAliquotField = computed(() => this.aliquotOptions().length > 1);

  productCodeOptions = computed<ScanSelectOption[]>(() =>
    this.unitProducts().map((p) => ({ code: p.productCode, description: p.productCode }))
  );

  aboTypeOptions = computed<ScanSelectOption[]>(() =>
    this.aboTypes().map((a) => ({ code: a.aboCode, description: a.aboDescription ?? a.aboCode }))
  );

  selectedDeviceTooltip = computed(() => {
    const id = this.entryForm.get('device')?.value;
    const d = this.devices().find((x) => x.deviceId === id);
    return d ? `${d.deviceId}${d.deviceName ? ' - ' + d.deviceName : ''}` : '';
  });

  selectedRackTooltip = computed(() => {
    const id = this.entryForm.get('rack')?.value;
    const r = this.racks().find((x) => x.rackId === id);
    return r ? `${r.rackId}${r.rackName ? ' - ' + r.rackName : ''}` : '';
  });

  selectedTrayTooltip = computed(() => {
    const id = this.entryForm.get('tray')?.value;
    const t = this.trays().find((x) => x.trayId === id);
    return t ? `${t.trayId}${t.trayName ? ' - ' + t.trayName : ''}` : '';
  });

  // ─── Grid (server-backed via LIST endpoint) ──────────────────────────────
  gridData = signal<CheckInRecord[]>([]);
  gridTotal = signal<number>(0);
  gridPageSize = signal<number>(25);
  gridPageIndex = signal<number>(0);
  sortDir = signal<'asc' | 'desc' | null>(null);
  isLoadingGrid = signal(false);

  pagedData = computed(() => {
    const start = this.gridPageIndex() * this.gridPageSize();
    return this.gridData().slice(start, start + this.gridPageSize());
  });

  private destroy$ = new Subject<void>();

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
          subtitle: pageData.subtitle || '',
        };
      }
    });

    effect(() => {
      const ld = this.chapterTimezoneService.chapterLocalDate();
      if (ld && ld.isValid()) {
        this.filterForm.patchValue(
          { receivedDate: ld.format('MM-DD-YY HH:mm') },
          { emitEvent: false }
        );
      }
    });

  }

  ngOnInit(): void {
    this.loadInventoryClasses();
    const wId = this.headerService.warehouseId();
    if (wId) {
      this.loadDevices(wId);
    }
    this.setupFormSubscriptions();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadInventoryClasses();
        const wId = this.headerService.warehouseId();
        if (wId) {
          this.loadDevices(wId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Setup ───────────────────────────────────────────────────────────────

  private setupFormSubscriptions(): void {
    // Inventory class change → show/hide entry row, reset grid
    this.filterForm
      .get('inventoryClassCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        const found = this.inventoryClasses().find((c) => c.code === code);
        this.inventoryClassDescription.set(found?.description ?? '-');
        if (code) {
          this.showEntryRow.set(true);
          this.checkedInCount.set(0);
          this.gridData.set([]);
          this.gridTotal.set(0);
          this.gridPageIndex.set(0);
          afterNextRender(() => { this.unitIdField?.unitIdInput?.nativeElement?.focus(); }, { injector: this.injector });
        } else {
          this.showEntryRow.set(false);
          this.gridData.set([]);
          this.gridTotal.set(0);
          this.gridPageIndex.set(0);
        }
      });

    // Aliquot change → validate component, load ABO types
    this.entryForm
      .get('aliquot')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((aliquot) => {
        this.aboTypes.set([]);
        this.selectedAboRh.set(null);
        this.aboRhField?.clear();
        if (aliquot) {
          this.runInterdictionCheck(aliquot);
        }
      });

    // Device change → load racks (warehouse from read-only signal)
    this.entryForm
      .get('device')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((dId) => {
        this.racks.set([]);
        this.trays.set([]);
        this.entryForm.patchValue({ rack: null, tray: null }, { emitEvent: false });
        this.locationId.set('');
        const wId = this.warehouseId();
        if (dId && wId) {
          this.loadRacksWithBaseAbo(wId, dId);
        }
      });

    // Rack change → load trays
    this.entryForm
      .get('rack')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((rId) => {
        this.trays.set([]);
        this.entryForm.patchValue({ tray: null }, { emitEvent: false });
        this.locationId.set('');
        const wId = this.warehouseId();
        const dId = this.entryForm.get('device')?.value;
        if (rId && wId && dId) {
          this.loadTrays(wId, dId, rId);
        }
      });
  }

  // ─── Grid data from server ─────────────────────────────────────────────────

  loadGridData(): void {
    const inventoryClass = this.filterForm.get('inventoryClassCode')?.value;
    if (!inventoryClass) return;

    this.isLoadingGrid.set(true);
    const skip = this.gridPageIndex() * this.gridPageSize();
    const query: any = {
      inventoryClass,
      sortColumn: this.sortDir() ? 'unitId' : null,
      sortOrder: this.sortDir() ?? null,
    };

    this.checkInService
      .getList(this.gridPageSize(), skip, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.gridData.set(
            res.data.map((r) => ({
              unitId: r.unitId,
              collectionDate: r.collDate,
              productCode: r.productCode,
              aboRh: r.bloodType,
              expirationDate: r.expDate || '-',
              warehouseId: r.locationId?.substring(0, 1) ?? '-',
              device: r.locationId?.substring(1, 3) ?? '-',
              rack: r.locationId?.substring(5, 7) ?? '-',
              tray: r.locationId?.substring(9) ?? '-',
            }))
          );
          this.gridTotal.set(res.total);
          this.isLoadingGrid.set(false);
        },
        error: () => this.isLoadingGrid.set(false),
      });
  }

  // ─── Load on init ─────────────────────────────────────────────────────────

  private loadInventoryClasses(): void {
    this.isLoadingClasses.set(true);
    this.checkInService
      .getInventoryClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.inventoryClasses.set(data); this.isLoadingClasses.set(false); },
        error: () => this.isLoadingClasses.set(false),
      });
  }

  // ─── Unit ID → auto-populate all fields ──────────────────────────────────

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    this.checkInService
      .validateUnit({ unitId: event.data.parsedUnitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data) {
            event.reject(res.message ?? 'Unit ID not found.');
            return;
          }
          const unit = res.data;
          this.unitCollDate.set(unit.collDate);
          this.osokFlag.set(unit.osokFlag ?? 'N');
          this.importFlag.set(unit.importFlag ?? 'N');
          this.collectionDate.set(
            moment(unit.collDate).isValid()
              ? moment(unit.collDate).format('DD-MMM-YYYY').toUpperCase()
              : unit.collDate
          );

          // Reset entry fields (keep location intact for rapid scan)
          this.unitProducts.set([]);
          this.aliquotOptions.set([]);
          this.aboTypes.set([]);
          this.isPoolProduct.set(false);
          this.selectedProductCode.set(null);
          this.selectedAboRh.set(null);
          this.productCodeField?.clear();
          this.aboRhField?.clear();
          this.entryForm.patchValue(
            { aliquot: null, expirationDate: '' },
            { emitEvent: false }
          );

          // Load products dropdown options without auto-selecting
          this.checkInService
            .getProducts(unit.unitId, unit.collDate)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (products) => {
                this.unitProducts.set(products);
              },
            });

          this.unitCodeScheme.set(event.data.codeScheme ?? 'I');
          event.confirm();
        },
        error: () => event.reject('Failed to validate unit. Please try again.'),
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {}

  onUnitCleared(): void {
    this.collectionDate.set('');
    this.unitCollDate.set('');
    this.osokFlag.set('N');
    this.importFlag.set('N');
    this.unitProducts.set([]);
    this.aliquotOptions.set([]);
    this.aboTypes.set([]);
    this.isPoolProduct.set(false);
    this.locationId.set('');
    this.selectedProductCode.set(null);
    this.selectedAboRh.set(null);
    this.productCodeField?.clear();
    this.aboRhField?.clear();
    this.entryForm.reset();
  }

  // ─── Product Code scan-select handlers ────────────────────────────────────

  onProductCodeChanged(option: ScanSelectOption | null): void {
    const code = option?.code ?? null;
    this.resetAfterProductCode();
    this.selectedProductCode.set(code);
    if (code && this.unitCollDate()) {
      this.validateProduct(code);
    }
  }

  onProductCodeCleared(): void {
    this.resetAfterProductCode();
    this.selectedProductCode.set(null);
  }

  // ─── ABORh scan-select handlers ───────────────────────────────────────────

  onAboRhChanged(option: ScanSelectOption | null): void {
    const bloodType = option?.code ?? null;
    this.selectedAboRh.set(bloodType);
    if (bloodType && !this.isPoolProduct()) {
      this.validateAbo(bloodType);
    }
  }

  onAboRhCleared(): void {
    this.selectedAboRh.set(null);
  }

  // ─── Product code → auto-populate expiry + ABO types ────────────────────

  private resetAfterProductCode(): void {
    this.aliquotOptions.set([]);
    this.aboTypes.set([]);
    this.isPoolProduct.set(false);
    this.selectedAboRh.set(null);
    this.aboRhField?.clear();
    this.entryForm.patchValue(
      { aliquot: null, expirationDate: '' },
      { emitEvent: false }
    );
  }

  private validateProduct(productCode: string): void {
    const scheme = this.unitCodeScheme();
    const codeLen = productCode.length;
    if (scheme === 'I' && codeLen !== 8) {
      this.showError('Invalid product code length for Code 128 scheme (expected 8 characters).');
      this.selectedProductCode.set(null);
      this.productCodeField?.clear();
      return;
    }
    if (scheme === 'C' && codeLen !== 5) {
      this.showError('Invalid product code length for Codabar scheme (expected 5 characters).');
      this.selectedProductCode.set(null);
      this.productCodeField?.clear();
      return;
    }

    const unitId = this.unitIdField?.parsedUnitId ?? '';
    const collDate = this.unitCollDate();

    this.checkInService
      .validateProduct({ unitId, productCode, collDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.showError(res.message ?? 'Product validation failed.');
            this.selectedProductCode.set(null);
            this.productCodeField?.clear();
            return;
          }
          const p = res.data;
          this.invProductType.set(p.invProductType ?? '');
          this.isPoolProduct.set(p.isPoolProduct);

          if (p.isLicensed != null && p.isLicensed !== 'Y') {
            this.showToast('Warning: Product is not licensed for this chapter.');
          }

          // Gap 1 fix: Load aliquots after product validation
          this.checkInService
            .getAliquots(unitId, productCode, collDate)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (aliquots) => {
                this.aliquotOptions.set(aliquots);
                if (aliquots.length === 1) {
                  this.entryForm.patchValue({ aliquot: aliquots[0].aliquot });
                } else if (this.unitCodeScheme() === 'I' && productCode.length === 8) {
                  // Gap 6 fix: Code128 auto-extract aliquot from last 2 chars
                  const derivedAliquot = productCode.substring(6, 8);
                  this.entryForm.patchValue({ aliquot: derivedAliquot }, { emitEvent: true });
                }
              },
            });

          if (p.isPoolProduct) {
            this.aboTypes.set([{ aboCode: 'PO', aboDescription: 'POOL' }]);
            return;
          }

          this.checkInService
            .getAboTypes({ unitId, productCode, collDate })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (types) => {
                this.aboTypes.set(types);
              },
            });
        },
        error: () => this.showError('Failed to validate product code.'),
      });
  }

  // ─── Aliquot → interdiction check → ABO types ────────────────────────────

  private runInterdictionCheck(aliquot: string): void {
    const unitId = this.unitIdField?.parsedUnitId ?? '';
    const productCode = this.selectedProductCode() ?? '';
    const collDate = this.unitCollDate();

    this.checkInService
      .validateComponent({ unitId, productCode, aliquot, collDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data?.isCleared) {
            this.showError(res.message ?? 'Component has interdictions and cannot be checked in.');
            this.entryForm.patchValue({ aliquot: null }, { emitEvent: false });
            this.selectedAboRh.set(null);
            this.aboRhField?.clear();
            return;
          }

          if (this.isPoolProduct()) {
            return; // ABO already set to 'PO'
          }

          this.checkInService
            .getAboTypes({ unitId, productCode, collDate })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (types) => {
                this.aboTypes.set(types);
              },
            });
        },
        error: () => this.showError('Failed to check component interdictions.'),
      });
  }

  // ─── ABO validation ───────────────────────────────────────────────────────

  private validateAbo(bloodType: string): void {
    const unitId = this.unitIdField?.parsedUnitId ?? '';
    const productCode = this.selectedProductCode() ?? '';
    const aliquot = this.entryForm.get('aliquot')?.value ?? '';
    const collDate = this.unitCollDate();

    this.checkInService
      .validateAbo({ unitId, productCode, aliquot, bloodType, collDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data?.isValid) {
            this.showError(res.message ?? 'Invalid blood type.');
            this.selectedAboRh.set(null);
            this.aboRhField?.clear();
          }
        },
        error: () => {},
      });
  }

  // ─── Storage location cascades ────────────────────────────────────────────

  private loadDevices(warehouseId: string): void {
    this.isLoadingDevices.set(true);
    this.checkInService
      .getDevices(warehouseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.devices.set(data);
          this.isLoadingDevices.set(false);
        },
        error: () => this.isLoadingDevices.set(false),
      });
  }

  private loadRacksWithBaseAbo(warehouseId: string, deviceId: string): void {
    const bloodType = this.selectedAboRh() ?? '';
    const storageClass = this.filterForm.get('inventoryClassCode')?.value ?? '';
    const productType = this.invProductType();

    if (bloodType) {
      this.checkInService
        .getBaseAboValue(bloodType)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (bao) =>
            this.loadRacks(warehouseId, deviceId, storageClass, productType, bao?.baseAboValue ?? bloodType),
          error: () => this.loadRacks(warehouseId, deviceId, storageClass, productType, bloodType),
        });
    } else {
      this.loadRacks(warehouseId, deviceId, storageClass, productType, '');
    }
  }

  private loadRacks(
    warehouseId: string,
    deviceId: string,
    storageClass: string,
    productType: string,
    bloodType: string
  ): void {
    this.isLoadingRacks.set(true);
    this.checkInService
      .getRacks(warehouseId, deviceId, storageClass, productType, bloodType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.racks.set(data);
          this.isLoadingRacks.set(false);
        },
        error: () => this.isLoadingRacks.set(false),
      });
  }

  private loadTrays(warehouseId: string, deviceId: string, rackId: string): void {
    this.isLoadingTrays.set(true);
    const storageClass = this.filterForm.get('inventoryClassCode')?.value ?? '';
    const productType = this.invProductType();
    const bloodType = this.selectedAboRh() ?? '';
    this.checkInService
      .getTrays(warehouseId, deviceId, rackId, storageClass, productType, bloodType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.trays.set(data);
          this.isLoadingTrays.set(false);
        },
        error: () => this.isLoadingTrays.set(false),
      });
  }

  // ─── Tray tab-out → validate location → check-in ────────────────────────

  onTrayTabOut(): void {
    if (this.isSaving()) return;
    const tray = this.entryForm.get('tray')?.value;
    if (!tray) return;

    const wId = this.warehouseId();
    const dId = this.entryForm.get('device')?.value ?? '';
    const rId = this.entryForm.get('rack')?.value ?? '';
    const bloodType = this.selectedAboRh() ?? '';

    if (wId) {
      this.isSaving.set(true);
      this.checkInService
        .validateLocation({ warehouseId: wId, deviceId: dId, rackId: rId, trayId: tray, bloodType })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (!res.success || !res.data?.isValid) {
              this.isSaving.set(false);
              this.showError(this.mapApiError(res) ?? 'Invalid storage location.');
              return;
            }
            this.locationId.set(res.data.locationId ?? '');
            if (res.data.availableCapacity != null && res.data.availableCapacity <= 0) {
              this.isSaving.set(false);
              this.showTrayFullConfirmation();
              return;
            }
            this.submitCheckIn();
          },
          error: (err) => {
            this.isSaving.set(false);
            this.showError(err?.error?.message ?? 'Failed to validate location.');
          },
        });
    } else {
      this.isSaving.set(true);
      this.submitCheckIn();
    }
  }

  // ─── Submit check-in → append to session table ───────────────────────────

  private submitCheckIn(): void {
    const unitId = this.unitIdField?.parsedUnitId ?? '';
    if (!unitId || !this.unitIdField?.isValid) {
      this.isSaving.set(false);
      return;
    }

    const productCode = this.selectedProductCode() ?? '';
    const aliquot = this.entryForm.get('aliquot')?.value ?? '';
    const bloodType = this.selectedAboRh() ?? '';
    const productType = this.invProductType() ?? '';
    const inventoryClass = this.filterForm.get('inventoryClassCode')?.value ?? '';
    const wId = this.warehouseId();

    if (!productCode || !bloodType) {
      this.isSaving.set(false);
      this.showError('Product code and blood type are required.');
      return;
    }

    const expDate = this.entryForm.get('expirationDate')?.value?.trim() || null;

    const rcvValue = this.filterForm.get('receivedDate')?.value?.trim();
    const receiveDate = rcvValue
      ? moment(rcvValue, 'MM-DD-YY HH:mm').isValid()
        ? moment(rcvValue, 'MM-DD-YY HH:mm').toISOString()
        : this.chapterTimezoneService.getChapterLocalDate().toISOString()
      : this.chapterTimezoneService.getChapterLocalDate().toISOString();

    // Save location for rapid scan (preserve after check-in)
    const savedDId = this.entryForm.get('device')?.value ?? '';
    const savedRId = this.entryForm.get('rack')?.value ?? '';
    const savedTId = this.entryForm.get('tray')?.value ?? '';
    const savedDevices = this.devices();
    const savedRacks = this.racks();
    const savedTrays = this.trays();
    const savedLocationId = this.locationId();

    this.checkInService
      .checkIn({
        unitId,
        productCode,
        aliquot,
        bloodType,
        productType: productType || null,
        expDate,
        inventoryClass,
        locationId: this.locationId() || null,
        warehouseId: wId || null,
        osokFlag: this.osokFlag() || null,
        importFlag: this.importFlag() || null,
        receiveDate,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (!res.success) {
            this.showError(this.mapApiError(res) ?? 'Failed to check in product.');
            return;
          }
          this.checkedInCount.update((n) => n + 1);
          this.showToast(`${this.checkedInCount()} Entries transferred.`);

          const newRow: CheckInRecord = {
            unitId,
            collectionDate: this.collectionDate() || '-',
            productCode,
            aboRh: bloodType,
            expirationDate: this.entryForm.get('expirationDate')?.value?.trim() || '-',
            warehouseId: wId || '-',
            device: this.entryForm.get('device')?.value || '-',
            rack: this.entryForm.get('rack')?.value || '-',
            tray: this.entryForm.get('tray')?.value || '-',
          };
          this.gridData.update((rows) => [newRow, ...rows]);
          this.gridTotal.update((n) => n + 1);
          this.gridPageIndex.set(0);

          // Clear unit/product/ABO/expiry; restore location for rapid scan
          this.clearUnitFields();
          this.devices.set(savedDevices);
          this.racks.set(savedRacks);
          this.trays.set(savedTrays);
          this.locationId.set(savedLocationId);
          this.entryForm.patchValue(
            { device: savedDId, rack: savedRId, tray: savedTId },
            { emitEvent: false }
          );
        },
        error: (err) => {
          this.isSaving.set(false);
          this.showError(err?.error?.message ?? 'Failed to check in product.');
        },
      });
  }

  // ─── Clear helpers ────────────────────────────────────────────────────────

  clearAll(): void {
    this.filterForm.reset();
    this.inventoryClassDescription.set('-');
    this.showEntryRow.set(false);
    this.gridData.set([]);
    this.gridTotal.set(0);
    this.gridPageIndex.set(0);
    this.checkedInCount.set(0);
    this.invProductType.set('');
    this.unitCodeScheme.set('I');
    this.clearAllFields();
  }

  clearEntryRow(): void {
    this.clearAllFields();
  }

  private clearUnitFields(): void {
    this.unitIdField?.clear();
    this.collectionDate.set('');
    this.unitCollDate.set('');
    this.osokFlag.set('N');
    this.importFlag.set('N');
    this.unitProducts.set([]);
    this.aliquotOptions.set([]);
    this.aboTypes.set([]);
    this.isPoolProduct.set(false);
    this.locationId.set('');
    this.selectedProductCode.set(null);
    this.selectedAboRh.set(null);
    this.productCodeField?.clear();
    this.aboRhField?.clear();
    this.entryForm.patchValue(
      { aliquot: null, expirationDate: '' },
      { emitEvent: false }
    );
    afterNextRender(() => { this.unitIdField?.unitIdInput?.nativeElement?.focus(); }, { injector: this.injector });
  }

  private clearAllFields(): void {
    this.unitIdField?.clear();
    this.collectionDate.set('');
    this.unitCollDate.set('');
    this.osokFlag.set('N');
    this.importFlag.set('N');
    this.unitProducts.set([]);
    this.aliquotOptions.set([]);
    this.aboTypes.set([]);
    this.isPoolProduct.set(false);
    this.locationId.set('');
    this.selectedProductCode.set(null);
    this.selectedAboRh.set(null);
    this.productCodeField?.clear();
    this.aboRhField?.clear();
    this.racks.set([]);
    this.trays.set([]);
    this.entryForm.reset();
    afterNextRender(() => { this.unitIdField?.unitIdInput?.nativeElement?.focus(); }, { injector: this.injector });
  }

  // ─── Expiration date helpers ──────────────────────────────────────────────

  onExpirationDateBlur(): void {
    const value = this.entryForm.get('expirationDate')?.value?.trim();
    if (!value) return;

    this.expirationDateValidating.set(true);
    this.labelScanService.validateExpiryScan(value, this.unitCodeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.item) {
            const formatted = this.formatExpiryDisplay(res.item.expiryDate);
            this.entryForm.patchValue({ expirationDate: formatted }, { emitEvent: false });
            this.crossCheckExpiry(res.item.expiryDate);
          } else {
            this.expirationDateValidating.set(false);
            this.showError(res.errorResponse?.error || 'Invalid expiry date');
            this.entryForm.patchValue({ expirationDate: '' }, { emitEvent: false });
          }
        },
        error: () => {
          this.expirationDateValidating.set(false);
          this.showError('Invalid expiry date');
          this.entryForm.patchValue({ expirationDate: '' }, { emitEvent: false });
        },
      });
  }

  private crossCheckExpiry(parsedExpDate: string | null): void {
    const unitId = this.unitIdField?.parsedUnitId ?? '';
    const productCode = this.selectedProductCode() ?? '';
    const collDate = this.unitCollDate();

    if (!unitId || !productCode || !parsedExpDate) {
      this.expirationDateValidating.set(false);
      return;
    }

    this.checkInService
      .validateExpiry({ unitId, productCode, collDate, expDate: parsedExpDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.expirationDateValidating.set(false);
          if (!res.success || !res.data?.isValid) {
            this.showError(res.message ?? 'Expiry date does not match component expiry.');
            this.entryForm.patchValue({ expirationDate: '' }, { emitEvent: false });
          }
        },
        error: () => {
          this.expirationDateValidating.set(false);
          this.showError('Failed to validate expiry date.');
          this.entryForm.patchValue({ expirationDate: '' }, { emitEvent: false });
        },
      });
  }

  private formatExpiryDisplay(value: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const hours = d.getHours();
    const minutes = d.getMinutes();
    if (hours === 0 && minutes === 0) {
      return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    }
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()} ${hh}:${mm}`;
  }

  // ─── Sorting ──────────────────────────────────────────────────────────────

  toggleSortUnitId(): void {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    this.gridPageIndex.set(0);
    const dir = this.sortDir();
    this.gridData.update((rows) => {
      const sorted = [...rows];
      sorted.sort((a, b) => {
        const cmp = a.unitId.localeCompare(b.unitId);
        return dir === 'asc' ? cmp : -cmp;
      });
      return sorted;
    });
  }

  // ─── Pagination ───────────────────────────────────────────────────────────

  onPageChange(event: PageEvent): void {
    this.gridPageSize.set(event.pageSize);
    this.gridPageIndex.set(event.pageIndex);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 10000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private showToast(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private hasScanPrefix(value: string, patterns: ScanPattern[]): boolean {
    return patterns.some((p) => value.startsWith(p.prefix.toUpperCase()));
  }

  // ─── Enter key triggers check-in from any field in the entry row ──────
  onEntryEnterKey(event: Event): void {
    event.preventDefault();
    if (!this.selectedProductCode() || !this.selectedAboRh() || this.isSaving()) return;
    this.onCheckInClick();
  }

  // ─── Check-in handler ──────────────────────────────────────────────────
  onCheckInClick(): void {
    if (this.isSaving()) return;

    const tray = this.entryForm.get('tray')?.value;
    if (tray) {
      this.onTrayTabOut();
    } else {
      this.isSaving.set(true);
      this.submitCheckIn();
    }
  }

  // ─── Gap 2+4: Received date validation ────────────────────────────────
  onReceivedDateBlur(): void {
    const value = this.filterForm.get('receivedDate')?.value?.trim();
    if (!value) return;

    this.checkInService
      .validateReceiveDate({ receiveDate: value })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data?.isValid) {
            this.showError(this.mapApiError(res) ?? 'Invalid receive date.');
            const ld = this.chapterTimezoneService.chapterLocalDate();
            if (ld && ld.isValid()) {
              this.filterForm.patchValue(
                { receivedDate: ld.format('MM-DD-YY HH:mm') },
                { emitEvent: false }
              );
            }
          }
        },
        error: () => {
          this.showError('Failed to validate receive date.');
        },
      });
  }

  // ─── Gap 3: Tray-full confirmation dialog ─────────────────────────────
  private showTrayFullConfirmation(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Tray Full',
        message: 'Tray is full. Use the same tray?',
        confirmText: 'YES',
        cancelText: 'NO',
      } as ConfirmActionDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isSaving.set(true);
          this.submitCheckIn();
        }
      });
  }

  // ─── Gap 7+8: Error code mapper ────────────────────────────────────────
  mapApiError(res: any): string {
    const errorCode =
      res?.errorCode ??
      res?.errorResponse?.errorCode ??
      res?.data?.errorCode ??
      null;
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode];
    }
    return res?.message ?? '';
  }

  // ─── Gap 11: Unit inquiry navigation ───────────────────────────────────
  viewUnitDetails(): void {
    const unitId = this.unitIdField?.parsedUnitId;
    if (unitId) {
      this.router.navigate(['/product-management-functions/inventory-management/product-management/product-current-status'], {
        queryParams: { unitId },
      });
    }
  }

  viewInventoryHistory(): void {
    const unitId = this.unitIdField?.parsedUnitId;
    if (unitId) {
      this.router.navigate(['/product-management-functions/inventory-management/product-management/product-status-inquiry'], {
        queryParams: { unitId },
      });
    }
  }
}
