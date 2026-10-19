import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  effect,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil, switchMap, of, distinctUntilChanged, catchError } from 'rxjs';
import moment, { Moment } from 'moment';

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';

import { TransferDonorDataToLabApiService } from './services/transfer-donor-data-to-lab-api.service';
import {
  CHECK_IN_TYPE_OPTIONS,
  CheckInType,
  BatchOption,
  DriveOption,
  ShipperOption,
  RetrievedUnit,
  DonationDetails,
  ValidateHeaderRequest,
  ValidateTransferResponse,
  TransferRequest,
  TransferWarning,
} from './models/transfer-donor-data-to-lab.model';

const FALLBACK_TITLE    = 'Transfer Donor Data to Lab';
const FALLBACK_SUBTITLE = 'Register collected units and transfer donor data into the lab for testing and processing.';

const VALIDATION_WARNING_CODES   = new Set(['SLOW_BLEED', 'SLOW_BLEED_WARNING', 'BLEED_TIME_SLOW']);
const VALIDATION_MAX_BLEED_CODES = new Set(['MAX_BLEED', 'MAX_BLEED_TIME', 'BLEED_TIME_EXCEEDED', 'MAXIMUM_BLEED', 'BLEED_TIME_MAX']);

@Component({
  selector: 'app-transfer-donor-data-to-lab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './transfer-donor-data-to-lab.html',
  styleUrls: ['./transfer-donor-data-to-lab.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class TransferDonorDataToLabComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `transfer-donor-data-to-lab-${TransferDonorDataToLabComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId  = (name: string) => `${this.componentId}-${name}-error`;

  @ViewChild('scanInput') scanInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('collectionDateInput') collectionDateInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('unitIdField') unitIdFieldRef!: UnitIdFieldComponent;

  private readonly snackBar           = inject(MatSnackBar);
  private readonly pageHeaderService  = inject(PageHeaderService);
  private readonly headerService      = inject(HeaderService);
  private readonly apiService         = inject(TransferDonorDataToLabApiService);
  private readonly destroy$           = new Subject<void>();

  // ─── Header — populated dynamically from PageHeaderService (menu config) ──
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: FALLBACK_TITLE,
    subtitle: FALLBACK_SUBTITLE,
  };

  private readonly _headerEffect = effect(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      this.headerConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title:    pageData.title,
        subtitle: pageData.subtitle || FALLBACK_SUBTITLE,
      };
    }
  });

  // ─── Check-In Type options (hardcoded — no API call needed) ─────────────────
  readonly checkInTypeOptions = CHECK_IN_TYPE_OPTIONS;

  // today in chapter timezone — kept in sync with the chapterTimeZone signal
  maxDate: Moment = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  private readonly _maxDateEffect = effect(() => {
    this.maxDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  });

  // ─── Filter form ─────────────────────────────────────────────────────────────
  filterForm = new FormGroup({
    checkInType:    new FormControl<CheckInType | null>(null, [Validators.required]),
    batchId:        new FormControl<string | null>({ value: null, disabled: true }),
    minTemp:        new FormControl<string>({ value: '', disabled: true }),
    maxTemp:        new FormControl<string>({ value: '', disabled: true }),
    collectionDate: new FormControl<Moment | null>({ value: null, disabled: true }),
    driveId:        new FormControl<string | null>({ value: null, disabled: true }),
    shipperNumber:  new FormControl<string>({ value: '', disabled: true }),
  });

  batchSearchControl   = new FormControl<string>('');
  driveSearchControl   = new FormControl<string>('');
  shipperSearchControl = new FormControl<string>('');
  checkInTypeSearch    = new FormControl<string>('');
  unitScanControl      = new FormControl<string>('');

  // ─── State signals ────────────────────────────────────────────────────────────
  panelsVisible     = signal(false);
  isLoading         = signal(false);
  isScanning        = signal(false);
  checkInTypeSignal = signal<CheckInType | null>(null);
  private readonly checkInTypeSearchValue = signal<string>('');
  private readonly batchSearchValue       = signal<string>('');
  private readonly driveSearchValue       = signal<string>('');
  private readonly shipperSearchValue     = signal<string>('');

  batchOptions   = signal<BatchOption[]>([]);
  driveOptions   = signal<DriveOption[]>([]);
  shipperOptions = signal<ShipperOption[]>([]);

  retrievedUnits   = signal<RetrievedUnit[]>([]);
  hasRetrievedData = signal(false);

  donationDetails       = signal<DonationDetails | null>(null);
  scanValidationError   = signal<string | null>(null);  // generic error — tooltip only
  scanMaxBleedError     = signal<string | null>(null);  // max-bleed — tooltip + panel header
  scanValidationWarning = signal<string | null>(null);
  activeWarningUnitId   = signal<string | null>(null);

  validatedScanUnit = signal<UnitValidationResponse | null>(null);

  // ─── Computed ─────────────────────────────────────────────────────────────────
  filteredBatchOptions = computed(() => {
    const search = this.batchSearchValue().toLowerCase().trim();
    const all    = this.batchOptions();
    if (!search) return all;
    return all.filter(b =>
      b.batchId.toLowerCase().includes(search) ||
      String(b.unitCount || '').includes(search)
    );
  });

  filteredDriveOptions = computed(() => {
    const search = this.driveSearchValue().toLowerCase().trim();
    const all    = this.driveOptions();
    if (!search) return all;
    return all.filter(d =>
      d.driveId.toLowerCase().includes(search)   ||
      d.siteName.toLowerCase().includes(search)  ||
      d.groupSiteId.toLowerCase().includes(search)
    );
  });

  filteredShipperOptions = computed(() => {
    const search = this.shipperSearchValue().toLowerCase().trim();
    const all    = this.shipperOptions();
    if (!search) return all;
    return all.filter(s => s.shipperNo.toLowerCase().includes(search));
  });

  filteredCheckInTypeOptions = computed(() => {
    const search = this.checkInTypeSearchValue().toLowerCase().trim();
    if (!search) return this.checkInTypeOptions;
    return this.checkInTypeOptions.filter(o =>
      o.label.toLowerCase().includes(search)
    );
  });

  readonly showNoBatchesFound      = computed(() => this.batchSearchValue().length   > 0 && this.filteredBatchOptions().length   === 0);
  readonly showNoDrivesFound       = computed(() => this.driveSearchValue().length   > 0 && this.filteredDriveOptions().length   === 0);
  readonly showNoShippersFound     = computed(() => this.shipperSearchValue().length > 0 && this.filteredShipperOptions().length === 0);
  readonly showNoTypesFound        = computed(() => this.checkInTypeSearchValue().length > 0 && this.filteredCheckInTypeOptions().length === 0);
  readonly showEmptyPlaceholder    = computed(() => this.panelsVisible() === false);
  readonly isBatchEnabled          = computed(() => this.isBatchDisabled() === false);
  readonly hasDonationDetails      = computed(() => this.donationDetails() !== null);
  readonly hasScanError            = computed(() =>
    this.scanValidationError() !== null || this.scanMaxBleedError() !== null || this.scanValidationWarning() !== null
  );

  // Batch ID always visible; disabled only when type = 'T' (Tubes Only)
  showBatchField  = computed(() => true);
  isBatchDisabled = computed(() => this.checkInTypeSignal() === 'T');

  batchLabelMarker = computed(() => {
    return '';
  });

  // Collection Date is required for all check-in types
  isCollectionDateRequired = computed(() => this.checkInTypeSignal() !== null);

  // Left-panel header status — ERROR only for max-bleed codes, WARNING for slow-bleed codes
  panelStatus = computed<'ERROR' | 'WARNING' | null>(() => {
    if (this.scanMaxBleedError())     return 'ERROR';
    if (this.scanValidationWarning()) return 'WARNING';
    return null;
  });

  get unitCount(): number { return this.retrievedUnits().length; }

  private _aborting = false;

  canDeactivate(): boolean {
    const fieldValidating = this.unitIdFieldRef?.validationState === 'validating';
    return !this.isLoading() && !this.isScanning() && !fieldValidating;
  }

  // Called by the route guard when the user confirms leaving.
  // Prevents any in-flight UnitIdField validation response from starting a new scan chain.
  abortScan(): void {
    this._aborting = true;
    this.unitIdFieldRef?.clear();
    this.isScanning.set(false);
    this.scanValidationError.set(null);
    this.scanMaxBleedError.set(null);
    this.scanValidationWarning.set(null);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.canDeactivate()) {
      event.preventDefault();
    }
  }

  isRetrieveDisabled(): boolean {
    return this.isLoading();
  }

  hasFieldError(name: string): boolean {
    const ctrl = this.filterForm.get(name);
    return ctrl?.invalid === true && ctrl?.touched === true;
  }

  // Returns just the label for display in the closed mat-select trigger
  getSelectedCheckInLabel(): string {
    const val = this.filterForm.get('checkInType')?.value;
    return this.checkInTypeOptions.find(o => o.value === val)?.label ?? '';
  }

  getSelectedDriveLabel(): string {
    const driveId = this.filterForm.get('driveId')?.value;
    if (!driveId) return '';
    const drive = this.driveOptions().find(d => d.driveId === driveId);
    if (!drive) return driveId;
    return `${drive.driveId} - ${drive.siteName} - ${drive.groupSiteId}`;
  }

  getCollectionDateError(): string {
    const ctrl = this.filterForm.get('collectionDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse')) return 'Collection Date is invalid';
    if (ctrl.hasError('required'))           return 'Collection Date is required';
    if (ctrl.hasError('invalidDate'))        return 'Collection Date is invalid';
    if (ctrl.hasError('futureDate') || ctrl.hasError('matDatepickerMax')) return 'Collection Date cannot be a future date';
    return '';
  }

  onMinTempBlur(): void {
    const minVal  = this.filterForm.get('minTemp')?.value;
    const maxCtrl = this.filterForm.get('maxTemp');
    if (minVal && !maxCtrl?.value) {
      maxCtrl?.setValue('37.5');
    }
    this.validateTempRange();
  }

  onMaxTempBlur(): void {
    this.validateTempRange();
  }

  private validateTempRange(): void {
    const minCtrl = this.filterForm.get('minTemp');
    const maxCtrl = this.filterForm.get('maxTemp');
    const minVal = minCtrl?.value ? parseFloat(minCtrl.value) : null;
    const maxVal = maxCtrl?.value ? parseFloat(maxCtrl.value) : null;

    if (minVal != null && maxVal != null && minVal > maxVal) {
      minCtrl?.setErrors({ ...minCtrl.errors, tempRange: true });
    } else if (minCtrl?.hasError('tempRange')) {
      const { tempRange, ...rest } = minCtrl.errors || {};
      minCtrl?.setErrors(Object.keys(rest).length ? rest : null);
    }
  }

  onDriveSelected(driveId: string | null): void {
    this.filterForm.patchValue({ shipperNumber: '' }, { emitEvent: false });
    this.shipperOptions.set([]);
    this.shipperSearchControl.setValue('');

    if (!driveId) return;

    const checkinType = this.filterForm.get('checkInType')?.value;
    if (!checkinType) return;

    this.apiService.getShippers(driveId, checkinType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  shippers => this.shipperOptions.set(shippers),
        error: () => this.showError('Failed to load shippers.'),
      });
  }

  onCollectionDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const ctrl = this.filterForm.get('collectionDate');
    DateFieldValidationUtility.handleStartDateInput(inputValue, ctrl);

    if (inputValue?.trim() && ctrl) {
      const parsed = moment(inputValue.trim(), ['DD-MMM-YYYY', 'D-MMM-YYYY'], true);
      if (parsed.isValid()) {
        if (parsed.isAfter(this.maxDate, 'day')) {
          ctrl.setErrors({ ...ctrl.errors, futureDate: true });
        } else {
          // Clear stale futureDate error when the user corrects the date
          const { futureDate, ...remaining } = ctrl.errors ?? {};
          ctrl.setErrors(Object.keys(remaining).length ? remaining : null);
        }
      }
    }
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadBatches();
    this.subscribeToChapterChanges();
    this.subscribeToCollectionDateChanges();
    this.filterForm.patchValue({ collectionDate: this.maxDate.clone() });
    this.checkInTypeSearch.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.checkInTypeSearchValue.set(v ?? ''));

    this.batchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.batchSearchValue.set(v ?? ''));

    this.driveSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.driveSearchValue.set(v ?? ''));

    this.shipperSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.shipperSearchValue.set(v ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        // Compute today directly from the current timezone signal — don't read this.maxDate,
        // which _maxDateEffect updates asynchronously and may be stale at this point.
        const freshMaxDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
        this.filterForm.patchValue({ collectionDate: freshMaxDate.clone() }, { emitEvent: false });
        this.loadBatches();
      });
  }

  private subscribeToCollectionDateChanges(): void {
    this.filterForm.get('collectionDate')!.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(value => this.onCollectionDateChange(value));
  }

  // ─── Step 1: load batch dropdown on page load ─────────────────────────────
  private loadBatches(): void {
    this.apiService.getBatches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  batches => this.batchOptions.set(batches),
        error: () => this.showError('Failed to load batches.'),
      });
  }

  // ─── Load drives when Collection Date changes ────────────────────────────
  private onCollectionDateChange(value: Moment | null): void {
    this.driveOptions.set([]);
    this.filterForm.patchValue({ driveId: null }, { emitEvent: false });
    this.driveSearchControl.setValue('');
    this.shipperOptions.set([]);
    this.shipperSearchControl.setValue('');

    if (!value || !moment.isMoment(value) || !value.isValid()) {
      return;
    }

    const collectionDate = value.format('YYYY-MM-DD');

    this.apiService.getDrives(collectionDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: drives => {
          this.driveOptions.set(drives);
          this.filterForm.patchValue({ driveId: null }, { emitEvent: false });
          this.driveSearchControl.setValue('');
        },
        error: () => this.showError('Failed to load drives.'),
      });
  }

  // ─── Step 2: Check-In Type change — reset & enable fields based on type ──────
  onCheckInTypeChange(type: CheckInType): void {
    this.checkInTypeSignal.set(type);
    this.filterForm.patchValue({ batchId: null, driveId: null, shipperNumber: '', minTemp: '', maxTemp: '' });
    this.batchSearchControl.setValue('');
    this.driveSearchControl.setValue('');
    this.shipperSearchControl.setValue('');
    this.shipperOptions.set([]);

    const batchCtrl    = this.filterForm.get('batchId');
    const driveCtrl    = this.filterForm.get('driveId');
    const collDateCtrl = this.filterForm.get('collectionDate');
    const minTempCtrl  = this.filterForm.get('minTemp');
    const maxTempCtrl  = this.filterForm.get('maxTemp');
    const shipperCtrl  = this.filterForm.get('shipperNumber');

    // Collection Date — enable and default to today in the chapter's timezone if not set
    collDateCtrl?.enable();
    if (!collDateCtrl?.value) {
      collDateCtrl?.setValue(this.maxDate.clone(), { emitEvent: false });
    }
    collDateCtrl?.setValidators([Validators.required, DateFieldValidationUtility.validDateValidator()]);
    driveCtrl?.enable();
    driveCtrl?.setValidators([Validators.required]);
    shipperCtrl?.enable();

    if (type === 'T') {
      batchCtrl?.clearValidators();
      batchCtrl?.disable();
      minTempCtrl?.disable();
      maxTempCtrl?.disable();
      setTimeout(() => this.collectionDateInputRef?.nativeElement?.focus(), 50);
    } else if (type === 'U') {
      // U: batch optional (auto-created if empty); temps editable, locked after batch selected
      batchCtrl?.clearValidators();
      batchCtrl?.enable();
      minTempCtrl?.enable();
      maxTempCtrl?.enable();
    } else {
      // B: batch optional (auto-created if empty); temps editable same as U
      batchCtrl?.clearValidators();
      batchCtrl?.enable();
      minTempCtrl?.enable();
      maxTempCtrl?.enable();
    }

    batchCtrl?.updateValueAndValidity();
    driveCtrl?.updateValueAndValidity();
    collDateCtrl?.updateValueAndValidity();
    this.resetResults();
  }

  // ─── Step 3: Batch selected — auto-fill temps; temps stay enabled for U/B ────
  onBatchSelected(batchId: string | null): void {
    const type        = this.checkInTypeSignal();
    const minTempCtrl = this.filterForm.get('minTemp');
    const maxTempCtrl = this.filterForm.get('maxTemp');

    if (!batchId) {
      this.filterForm.patchValue({ minTemp: '', maxTemp: '' });
      if (type === 'U' || type === 'B') {
        minTempCtrl?.enable();
        maxTempCtrl?.enable();
      }
      return;
    }

    const batch = this.batchOptions().find(b => b.batchId === batchId);
    if (batch) {
      this.filterForm.patchValue({
        minTemp: batch.minTemp != null ? String(batch.minTemp) : '',
        maxTemp: batch.maxTemp != null ? String(batch.maxTemp) : '',
      });
    }

    if (type === 'U') {
      // U: lock temps after batch selected (read-only)
      minTempCtrl?.disable();
      maxTempCtrl?.disable();
    } else if (type === 'B') {
      // B: enable temps when batch selected
      minTempCtrl?.enable();
      maxTempCtrl?.enable();
    }
  }

  // ─── Step 4: RETRIEVE ────────────────────────────────────────────────────────
  onRetrieve(): void {
    const checkInType = this.filterForm.get('checkInType')?.value;
    if (!checkInType) {
      this.filterForm.get('checkInType')?.markAsTouched();
      return;
    }

    const collDate = this.filterForm.get('collectionDate')?.value;
    if (!collDate) {
      this.filterForm.get('collectionDate')?.markAsTouched();
      this.showError('Collection Date is required.');
      return;
    }

    const batchId = this.filterForm.get('batchId')?.value || '';
    const driveId = this.filterForm.get('driveId')?.value || '';

    if (!driveId) {
      this.filterForm.get('driveId')?.markAsTouched();
      return;
    }

    const shipperNumber = this.filterForm.get('shipperNumber')?.value?.trim() || '';
    if (checkInType !== 'T' && !shipperNumber) {
      this.filterForm.get('shipperNumber')?.markAsTouched();
      return;
    }

    this.validateTempRange();
    if (this.filterForm.get('minTemp')?.hasError('tempRange')) {
      this.showError('Min Temperature must not be greater than Max Temperature (Error 0110).');
      return;
    }

    this.isLoading.set(true);
    this.resetResults();

    const collectionDateStr = moment(collDate).format('YYYY-MM-DD');
    const selectedDrive     = this.driveOptions().find(d => d.driveId === driveId);

    const headerRequest: ValidateHeaderRequest = {
      checkinType:   checkInType,
      driveId,
      groupSiteId:   selectedDrive?.groupSiteId ?? '',
      collectionDate: collectionDateStr,
      batchId:       batchId || null,
      shipperId:     shipperNumber || null,
      minTemp:       this.filterForm.get('minTemp')?.value ? parseFloat(this.filterForm.get('minTemp')?.value ?? '') : null,
      maxTemp:       this.filterForm.get('maxTemp')?.value ? parseFloat(this.filterForm.get('maxTemp')?.value ?? '') : null,
    };

    this.apiService.validateHeader(headerRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: headerResult => {
          if (headerResult.success !== true) {
            this.isLoading.set(false);
            this.showError(headerResult.message || 'Header validation failed.');
            return;
          }
          // Error code "0033" = non-blocking date age warning — show and continue
          if (headerResult.errorCode === '0033') {
            this.showWarning(headerResult.message || 'Collection date exceeds configured time limit.');
          }
          // Proceed with RETRIEVE
          this.apiService.getUnits({
            collectionDate: collectionDateStr,
            batchId:        batchId || undefined,
            driveId:        driveId || undefined,
            shipperNumber:  shipperNumber || undefined,
          })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: response => {
                this.isLoading.set(false);
                this.hasRetrievedData.set(true);
                this.panelsVisible.set(true);
                this.retrievedUnits.set(
                  (response.data || []).map(u => ({ ...u, uiStatus: 'PENDING' as const }))
                );
                this.focusScanInput();
              },
              error: () => {
                this.isLoading.set(false);
                this.hasRetrievedData.set(true);
              },
            });
        },
        error: () => {
          this.isLoading.set(false);
          this.showError('Failed to validate header fields.');
        },
      });
  }

  // ─── Unit ID field validation (app-unit-id-field) ────────────────────────────
  onScanUnitIdValidated(data: UnitValidationResponse): void {
    if (this._aborting) return;
    this.validatedScanUnit.set(data);
    if (!this.validateHeaderFields()) {
      this.unitIdFieldRef?.clear();
      return;
    }
    this.processUnit(data.parsedUnitId);
  }

  private validateHeaderFields(): boolean {
    const missing: string[] = [];

    if (!this.filterForm.get('checkInType')?.value) {
      this.filterForm.get('checkInType')?.markAsTouched();
      missing.push('Check-In Type');
    }
    if (!this.filterForm.get('collectionDate')?.value) {
      this.filterForm.get('collectionDate')?.markAsTouched();
      missing.push('Collection Date');
    }
    if (!this.filterForm.get('driveId')?.value) {
      this.filterForm.get('driveId')?.markAsTouched();
      missing.push('Drive ID');
    }
    if (this.checkInTypeSignal() !== 'T' && !this.filterForm.get('shipperNumber')?.value?.trim()) {
      this.filterForm.get('shipperNumber')?.markAsTouched();
      missing.push('Shipper Number');
    }

    if (missing.length > 0) {
      this.scanValidationError.set('Enter values for all mandatory header fields.');
      return false;
    }

    return true;
  }

  onUnitRowClick(unit: RetrievedUnit): void {
    const collDateVal = this.filterForm.get('collectionDate')?.value;
    if (!collDateVal) return;
    const collectionDate = moment(collDateVal).format('YYYY-MM-DD');

    this.scanValidationError.set(null);
    this.scanMaxBleedError.set(null);
    this.scanValidationWarning.set(null);
    this.donationDetails.set(null);

    this.apiService.getDonationDetails(unit.unitId, collectionDate)
      .pipe(takeUntil(this.destroy$), catchError(() => of(null)))
      .subscribe(details => {
        if (details) this.donationDetails.set(details);
      });
  }

  toggleWarningPanel(unitId: string, event: Event): void {
    event.stopPropagation();
    this.activeWarningUnitId.update(current => current === unitId ? null : unitId);
  }

  closeWarningPanel(event: Event): void {
    event.stopPropagation();
    this.activeWarningUnitId.set(null);
  }

  private processUnit(unitId: string, existingUnit?: RetrievedUnit): void {
    unitId = unitId.trim();
    if (!unitId) return;

    const collDateVal    = this.filterForm.get('collectionDate')?.value;
    const collectionDate = moment(collDateVal).format('YYYY-MM-DD');

    this.scanValidationError.set(null);
    this.scanMaxBleedError.set(null);
    this.scanValidationWarning.set(null);
    this.donationDetails.set(null);
    this.isScanning.set(true);

    const unitFromList  = this.retrievedUnits().find(u => u.unitId === unitId);
    const checkInType   = (this.filterForm.get('checkInType')?.value || 'B') as CheckInType;
    const batchId       = this.filterForm.get('batchId')?.value || null;
    const resolvedDrive = this.filterForm.get('driveId')?.value || unitFromList?.driveId || '';
    const selectedDrive = this.driveOptions().find(d => d.driveId === resolvedDrive);
    const minTempStr    = this.filterForm.get('minTemp')?.value;
    const maxTempStr    = this.filterForm.get('maxTemp')?.value;
    const request: TransferRequest = {
      unitId,
      collectionDate,
      driveId:            resolvedDrive,
      groupSiteId:        selectedDrive?.groupSiteId ?? '',
      checkinType:        checkInType,
      batchId,
      shipperId:          this.filterForm.get('shipperNumber')?.value || null,
      materialShipmentId: null,
      contractId:         this.batchOptions().find(b => b.batchId === batchId)?.contractId ?? null,
      minTemp:            minTempStr ? parseFloat(minTempStr) : null,
      maxTemp:            maxTempStr ? parseFloat(maxTempStr) : null,
      donorDecisionScan:  null,
    };

    this.apiService.validateTransfer(request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          const body = err?.error as ValidateTransferResponse | undefined;
          if (body) return of(body);
          return of({ isValid: false, errorMessage: 'Validation request failed.', warnings: [] } as ValidateTransferResponse);
        }),
        switchMap(valRes => {
          if (valRes.donationDetails) this.donationDetails.set(valRes.donationDetails);

          if (!valRes.isValid) {
            const isWarning  = !!valRes.errorCode && VALIDATION_WARNING_CODES.has(valRes.errorCode);
            const isMaxBleed = !!valRes.errorCode && VALIDATION_MAX_BLEED_CODES.has(valRes.errorCode);
            if (isWarning) {
              this.scanValidationWarning.set(valRes.errorMessage || 'Review before continuing.');
            } else if (isMaxBleed) {
              this.scanMaxBleedError.set(valRes.errorMessage || 'Bleed time exceeded maximum allowed limit.');
            } else {
              this.scanValidationError.set(valRes.errorMessage || 'Unit validation failed.');
              this.isScanning.set(false);
              return of(null);
            }
          }

          if (this.scanMaxBleedError()) {
            this.isScanning.set(false);
            return of(null);
          }

          return this.apiService.transfer(request)
            .pipe(takeUntil(this.destroy$), catchError(transferErr => {
              this.handleTransferError(transferErr);
              return of(null);
            }));
        })
      )
      .subscribe({
        next: response => {
          this.isScanning.set(false);
          if (!response) return;

          if (response.success) {
            const unitResult = response.data?.[0];
            const uiUpdate = {
              uiStatus:        'TRANSFERRED' as const,
              uiWarnings:      unitResult?.warningsGenerated    || [],
              uiInterdictions: unitResult?.interdictionsApplied || [],
            };
            if (unitFromList) {
              this.retrievedUnits.update(units =>
                units.map(u => u.unitId !== unitId ? u : { ...u, ...uiUpdate })
              );
            } else {
              this.retrievedUnits.update(units => [{
                unitId, collectionDate,
                donationType:  this.donationDetails()?.donationType  || '',
                procedureCode: this.donationDetails()?.procedureCode || '',
                donorId: '', driveId: resolvedDrive,
                ...uiUpdate,
              }, ...units]);
            }
            if (unitResult?.generatedBatchId) {
              const genId = unitResult.generatedBatchId;
              this.filterForm.patchValue({ batchId: genId }, { emitEvent: false });
              if (!this.batchOptions().some(b => b.batchId === genId)) {
                const minRaw = this.filterForm.get('minTemp')?.value;
                const maxRaw = this.filterForm.get('maxTemp')?.value;
                this.batchOptions.update(opts => [{
                  batchId:      genId,
                  receivedDate: '',
                  minTemp:      minRaw ? parseFloat(minRaw) : 0,
                  maxTemp:      maxRaw ? parseFloat(maxRaw) : 0,
                  unitCount:    0,
                }, ...opts]);
              }
            }

            this.showSuccess(response.message || `Unit ${unitId} transferred successfully`);
            this.unitIdFieldRef?.clear();
          } else {
            this.scanValidationError.set(response?.message || 'Transfer failed.');
          }
        },
        error: () => {
          this.isScanning.set(false);
        },
      });
  }

  // ─── CLEAR ALL ────────────────────────────────────────────────────────────────
  clearAll(): void {
    this.filterForm.reset({
      checkInType: null, batchId: null,
      minTemp: '', maxTemp: '',
      collectionDate: null, driveId: null, shipperNumber: '',
    });
    this.checkInTypeSignal.set(null);
    this.panelsVisible.set(false);

    // Re-disable all fields — only enabled once a Check-In Type is selected
    ['batchId', 'minTemp', 'maxTemp', 'collectionDate', 'driveId', 'shipperNumber'].forEach(f => {
      const ctrl = this.filterForm.get(f);
      ctrl?.clearValidators();
      ctrl?.disable();
      ctrl?.updateValueAndValidity();
    });

    this.batchSearchControl.setValue('');
    this.driveSearchControl.setValue('');
    this.shipperSearchControl.setValue('');
    this.checkInTypeSearch.setValue('');
    this.driveOptions.set([]);
    this.shipperOptions.set([]);
    this.resetResults();
  }

  private resetResults(): void {
    this.retrievedUnits.set([]);
    this.donationDetails.set(null);
    this.hasRetrievedData.set(false);
    this.scanValidationError.set(null);
    this.scanMaxBleedError.set(null);
    this.scanValidationWarning.set(null);
    this.validatedScanUnit.set(null);
    this.unitScanControl.setValue('');
    this.unitIdFieldRef?.clear();
  }

  private focusScanInput(): void {
    setTimeout(() => this.scanInputRef?.nativeElement?.focus(), 100);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  unitRowClass(unit: RetrievedUnit): string {
    if (unit.uiStatus === 'TRANSFERRED') return 'unit-row--transferred';
    if (unit.uiStatus === 'SCANNED')     return 'unit-row--scanned';
    if (unit.uiStatus === 'ERROR')       return 'unit-row--error';
    return '';
  }

  formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '—';
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const m = moment.utc(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm') : '—';
  }

  // ─── Shipper Number Tab → reveal panels ──────────────────────────────────────
  onShipperTab(event: KeyboardEvent, select: MatSelect): void {
    this.panelsVisible.set(true);
    this.onSelectSearchKeydown(event, select);
  }

  onShipperTriggerTab(): void {
    this.panelsVisible.set(true);
  }

  // ─── Search dropdown keyboard fix ────────────────────────────────────────────
  // Prevents mat-select's native typeahead from auto-selecting an option while
  // the user types in ngx-mat-select-search, and closes the panel on Tab so
  // focus moves to the next form field instead of staying inside the overlay.
  onSelectSearchKeydown(event: KeyboardEvent, select: MatSelect): void {
    if (event.key === 'Tab') {
      // Stop the browser from moving focus into overlay options while the panel closes.
      event.preventDefault();
      event.stopPropagation();
      select.close();

      // After the overlay is removed, Angular Material restores focus to the select's
      // trigger. Use document.activeElement (now the trigger) to find the next field.
      setTimeout(() => {
        const focusables = Array.from(
          document.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), ' +
            'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.closest('.cdk-overlay-container'));
        const idx = focusables.indexOf(document.activeElement as HTMLElement);
        const target = focusables[event.shiftKey ? idx - 1 : idx + 1];
        target?.focus();
      }, 0);
      return;
    }
    if (event.key.length === 1) {
      event.stopPropagation();
    }
  }

  // ─── Transfer Error Handler ──────────────────────────────────────────────────
  private handleTransferError(err: any): void {
    const body = err?.error;
    const msg = body?.message || body?.errorMessage || 'Transfer failed.';
    this.scanValidationError.set(msg);
    this.showError(msg);
    this.isScanning.set(false);
  }

  // ─── Snackbars ────────────────────────────────────────────────────────────────
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000, horizontalPosition: 'end', verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 7000, horizontalPosition: 'end', verticalPosition: 'top',
      panelClass: ['warning-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000, horizontalPosition: 'end', verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
