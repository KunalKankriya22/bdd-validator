import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  effect,
  inject,
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DonationNotesDialog } from '@shared/components/donation-notes/donation-notes';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import {
  UnitIdFieldComponent,
  UnitIdFieldService,
  UnitValidationResponse,
} from '@shared/components/unit-id-field';
import { UnitIdFormatUtility } from '@shared/components/unit-id-field/unit-id-format.utility';
import { Time24hrDirective } from '@shared/directives/time-24hr.directive';
import { ReLabelCodabarIsbtService } from './re-label-codabar-isbt.service';
import {
  UnitValidationResult,
  ComponentItem,
  UnitAttribute,
  AboMapping,
  SpecialTestingCode,
  FacilityCode,
  CatalogNumber,
  LotNumber,
  AboValue,
  ProductCode,
  ProductCodeDropdownItem,
  ValidateIsbtDetailsRequest,
  VerifyLabelRequest,
  RelabelRequest,
  RelabelCommitRequest,
  RelabelPrintLabelRequest,
} from './re-label-codabar-isbt.model';

@Component({
  selector: 'app-re-label-codabar-isbt',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    Time24hrDirective,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './re-label-codabar-isbt.html',
  styleUrls: ['./re-label-codabar-isbt.scss'],
})
export class ReLabelCodabarIsbtComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly service = inject(ReLabelCodabarIsbtService);
  private readonly unitIdFieldService = inject(UnitIdFieldService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  // ── Page Header ───────────────────────────────────────────────────────────
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  // ── Codabar Unit state ────────────────────────────────────────────────────
  unitValidated = signal(false);
  productCodeSelected = signal(false);
  unitData = signal<UnitValidationResult | null>(null);

  collectionDateDisplay = computed(() => this.formatDate(this.unitData()?.collectionDate));
  // Writable: auto-filled from unit, user can scan/type to switch to a different component
  productCodeValue = signal<string>('');

  donorFullName = computed(() => {
    const d = this.unitData();
    if (!d) return '-';
    return [d.donorFirstName, d.donorLastName].filter(Boolean).join(' ') || '-';
  });

  components = signal<ComponentItem[]>([]);
  selectedComponentPrefix = signal<string>('');
  currentProductDescription = signal<string>('-');
  unitAttributes = signal<UnitAttribute[]>([]);
  lastValidatedProductCode = signal<string>('');

  // ── ISBT mapping state ────────────────────────────────────────────────────
  fullIsbtProductCode = signal<string>('');
  aboMappingData = signal<AboMapping | null>(null);

  aboLabel = computed(() => this.aboMappingData()?.aboLabel || '-');
  aboDescription = computed(() => this.aboMappingData()?.aboShortName || '-');
  testedAbo = computed(() => this.aboMappingData()?.testedAbo || '-');

  specialTestDescription = computed(() => {
    const code = this.isbtForm.get('specialTestingCode')?.value;
    if (!code) return '-';
    return this.specialTestingCodes().find(s => s.productCode === code)?.description || '-';
  });

  // ── Dropdown options ──────────────────────────────────────────────────────
  catalogNumbers = signal<CatalogNumber[]>([]);
  lotNumbers = signal<LotNumber[]>([]);
  specialTestingCodes = signal<SpecialTestingCode[]>([]);
  facilityCodes = signal<FacilityCode[]>([]);
  aboValues = signal<AboValue[]>([]);
  // All ISBT product codes from GET /product-codes (loaded on init)
  allProductCodes = signal<ProductCode[]>([]);
  // Unit-filtered product code dropdown (populated after unit scan)
  unitProductCodes = signal<ProductCodeDropdownItem[]>([]);
  userHasUpexpAccess = signal(false);

  // ISBT product codes for the ISBT form product-code dropdown
  activeProductCodes = computed(() => this.allProductCodes());

  // Populated only after a valid unit is scanned via /product-code-dropdown?unitId=...
  productCodeOptions = computed(() =>
    this.unitProductCodes().map(pc => ({ code: pc.productCode, description: pc.productDesc })),
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  isLoadingUnit = signal(false);
  isLoadingAttributes = signal(false);
  isSaving = signal(false);

  // ── ISBT Unit ID validation state ─────────────────────────────────────────
  isbtUnitIdState = signal<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  isbtUnitIdError = signal<string | null>(null);
  rawIsbtUnitId = signal('');
  parsedIsbtUnitId = signal('');

  // ── Dialog visibility ─────────────────────────────────────────────────────
  showLabelVerification = signal(false);

  // ── Label verification state (signals — no FormsModule dependency) ────────
  verificationScanUnitAbo = signal('');
  verificationUnitId = signal('');
  verificationAbo = signal('');
  verificationScanProductExp = signal('');
  verificationProductCode = signal('');
  verificationExpDate = signal<Moment | null>(null);
  verificationExpTime = signal('');
  verificationSpecialTesting = signal('');
  isVerifying = signal(false);

  verificationAboDesc = computed(() => {
    const ab = this.aboValues().find(a => a.aboLabel === this.verificationAbo());
    return ab?.aboShortName || this.aboMappingData()?.aboShortName || '-';
  });

  // ── Expiration Date validation ────────────────────────────────────────────
  get minDate(): Moment {
    return DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  readonly expDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getExpirationDateError(),
  );

  getExpirationDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.isbtForm.get('expirationDate'),
      'Expiration Date',
      '',
      null,
    );
  }

  onExpirationDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.isbtForm.get('expirationDate'),
    );
  }

  // ── ISBT Entry Form ───────────────────────────────────────────────────────
  isbtForm = new FormGroup({
    isbtUnitId: new FormControl<string>('', [Validators.required]),
    catalogNumber: new FormControl<string | null>(null),
    lotNumber: new FormControl<string | null>(null),
    isbtProductCode: new FormControl<string | null>(null),
    aboLabel: new FormControl<string | null>(null),
    expirationDate: new FormControl<Moment | null>(null, [
      Validators.required,
      dateFormatValidator(),
      DateFieldValidationUtility.validDateValidator(),
      DateFieldValidationUtility.effectiveDateNotPastValidator(),
    ]),
    expirationTime: new FormControl<string>('', [Validators.required]),
    specialTestingCode: new FormControl<string | null>(null),
    facilityCode: new FormControl<string | null>(null),
    confirmPrint: new FormControl<string | null>('N'),
  });


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
  }

  ngOnInit(): void {
    this.loadInitialDropdowns();
    this.checkUserAccess();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Init helpers ──────────────────────────────────────────────────────────

  private loadInitialDropdowns(): void {
    this.service.getCatalogNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => this.catalogNumbers.set(res.data ?? []), error: () => {} });

    this.service.getSpecialTestingCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => this.specialTestingCodes.set(res.data ?? []), error: () => {} });

    this.service.getAboValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => this.aboValues.set(res.data ?? []), error: () => {} });

    this.service.getProductCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => this.allProductCodes.set(res.data ?? []), error: () => {} });

    // Pre-load facility codes with backend default (INTERNAL) so dropdown is populated before unit scan
    this.service.getFacilityCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => this.facilityCodes.set(res.data ?? []), error: () => {} });
  }

  private checkUserAccess(): void {
    this.service.checkUserAccess('UPEXP')
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => this.userHasUpexpAccess.set(res.hasAccess), error: () => {} });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadInitialDropdowns();
      });
  }

  private loadLotNumbers(catalogNumber: string): void {
    this.service.getLotNumbers(catalogNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => this.lotNumbers.set(res.data ?? []), error: () => {} });
  }

  // ── Unit ID scan ──────────────────────────────────────────────────────────

  // UnitIdFieldComponent handles donor-lib validation (same as all screens).
  // (validated) fires once confirmed — we then call GET /relabel-codabar-isbt/unit/{unitId}.
  onUnitValidated(data: UnitValidationResponse): void {
    this.resetUnitState();
    const unitId = data.parsedUnitId;
    this.isLoadingUnit.set(true);

    this.service.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.isLoadingUnit.set(false);
          if (!res.success || !res.data?.length) {
            this.showError(res.message || 'Unit not found.');
            return;
          }
          const unit = res.data[0];
          if (!unit.isCodabarUnit) {
            this.showError('This unit is not a Codabar unit and cannot be relabeled.');
            return;
          }
          this.unitData.set(unit);
          this.unitValidated.set(true);
          this.currentProductDescription.set(unit.productDescription || '-');
          this.loadUnitRelatedData(unit);
        },
        error: err => {
          this.isLoadingUnit.set(false);
          this.showError(err?.error?.message || 'Failed to validate unit. Please try again.');
        },
      });
  }

  onUnitCleared(): void {
    this.resetUnitState();
  }

  private resetUnitState(): void {
    this.unitValidated.set(false);
    this.productCodeSelected.set(false);
    this.unitData.set(null);
    this.productCodeValue.set('');
    this.lastValidatedProductCode.set('');
    this.components.set([]);
    this.selectedComponentPrefix.set('');
    this.unitAttributes.set([]);
    this.aboMappingData.set(null);
    this.fullIsbtProductCode.set('');
    this.facilityCodes.set([]);
    this.lotNumbers.set([]);
    this.unitProductCodes.set([]);
    this.isbtUnitIdState.set('idle');
    this.isbtUnitIdError.set(null);
    this.rawIsbtUnitId.set('');
    this.parsedIsbtUnitId.set('');
    this.isbtForm.reset();
  }

  // ── Product Code selection handlers ──────────────────────────────────────

  onProductCodeEnter(): void {
    const code = this.productCodeValue().trim().toUpperCase();
    const unit = this.unitData();
    if (!code || !unit || code === this.lastValidatedProductCode()) return;
    this.lastValidatedProductCode.set(code);
    this.productCodeSelected.set(true);
    // Reset ISBT unit ID validation when product code changes
    this.isbtUnitIdState.set('idle');
    this.isbtUnitIdError.set(null);
    this.isbtForm.patchValue({ isbtUnitId: '' }, { emitEvent: false });

    // Reload components for the newly selected product code
    this.service.getComponents(unit.osUnitId || unit.unitId, unit.collectionDate, code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.components.set(res.data ?? []);
          if (res.data?.length) {
            this.selectedComponentPrefix.set(res.data[0].componentPrefix);
            this.currentProductDescription.set(res.data[0].productDescription || '-');
          }
        },
        error: () => {},
      });

    // Reload unit attributes for the newly selected product code (API #6)
    this.isLoadingAttributes.set(true);
    this.service.getUnitAttributes(unit.osUnitId || unit.unitId, code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.unitAttributes.set(res.data ?? []);
          this.isLoadingAttributes.set(false);
        },
        error: () => this.isLoadingAttributes.set(false),
      });

  }

  onProductCodeSelect(code: string): void {
    this.productCodeValue.set(code.toUpperCase());
    this.onProductCodeEnter();
  }

  // ── After unit validated: load all related data ───────────────────────────

  private loadUnitRelatedData(unit: UnitValidationResult): void {
    this.loadProductCodeDropdown(unit);
    this.loadAboMapping(unit);
    this.loadFacilityCodes(unit);
    this.loadIsbtProductCodeMapping(unit);
    this.prefillIsbtForm(unit);
  }

  private loadIsbtProductCodeMapping(unit: UnitValidationResult): void {
    if (!unit.productCode) return;
    this.service.getIsbtProductCodeMapping(unit.productCode, unit.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.success && res.data?.length) {
            const mapping = res.data[0];
            if (mapping.mappedProductCodes) {
              this.isbtForm.patchValue({ isbtProductCode: mapping.mappedProductCodes }, { emitEvent: false });
            }
            if (mapping.fullIsbtProductCode) {
              this.fullIsbtProductCode.set(mapping.fullIsbtProductCode);
            }
          }
        },
        error: () => {},
      });
  }

  onCatalogNumberChange(catalogNumber: string | null): void {
    this.lotNumbers.set([]);
    this.isbtForm.patchValue({ lotNumber: null }, { emitEvent: false });
    if (catalogNumber) {
      this.loadLotNumbers(catalogNumber);
    }
  }

  private loadAboMapping(unit: UnitValidationResult): void {
    if (!unit.systemLabelDecision) return;
    this.service.getAboMapping(unit.systemLabelDecision, unit.unitId, unit.collectionDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.success && res.data?.length) {
            this.aboMappingData.set(res.data[0]);
            this.isbtForm.patchValue({ aboLabel: res.data[0].aboLabel }, { emitEvent: false });
          }
        },
        error: () => {},
      });
  }

  private loadFacilityCodes(unit: UnitValidationResult): void {
    if (!unit.contractId) return;
    this.service.getFacilityCodes(unit.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => this.facilityCodes.set(res.data ?? []),
        error: () => {},
      });
  }

  private loadProductCodeDropdown(unit: UnitValidationResult): void {
    this.service.getProductCodeDropdown(unit.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => this.unitProductCodes.set(res.data ?? []),
        error: () => {},
      });
  }

  private prefillIsbtForm(unit: UnitValidationResult): void {
    const expDate = unit.expiryDate ? moment.utc(unit.expiryDate) : null;
    const expTime = expDate ? expDate.format('HH:mm') : '';

    this.isbtForm.patchValue({
      isbtUnitId: unit.firstIsbtUnitId || '',
      catalogNumber: unit.catalogNumber || null,
      lotNumber: unit.lotNumber || null,
      expirationDate: expDate,
      expirationTime: expTime,
    }, { emitEvent: false });

    const expDateControl = this.isbtForm.get('expirationDate');
    const expTimeControl = this.isbtForm.get('expirationTime');
    if (this.userHasUpexpAccess()) {
      expDateControl?.enable({ emitEvent: false });
      expTimeControl?.enable({ emitEvent: false });
    } else {
      expDateControl?.enable({ emitEvent: false });
      expTimeControl?.enable({ emitEvent: false });
    }

    if (unit.catalogNumber) {
      this.loadLotNumbers(unit.catalogNumber);
    }
  }

  // ── Component selection ───────────────────────────────────────────────────

  onAliquotChange(componentPrefix: string): void {
    this.selectedComponentPrefix.set(componentPrefix);
    const unit = this.unitData();
    if (!unit) return;
    this.service.validateComponent({
      unitId: unit.osUnitId || unit.unitId,
      collectionDate: unit.collectionDate,
      productCode: unit.productCode,
      componentPrefix,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => { if (!res.success) this.showError(res.message || 'Component validation failed.'); },
        error: () => this.showError('Component validation failed.'),
      });
  }

  // ── ISBT Unit ID field handlers ───────────────────────────────────────────

  onIsbtUnitIdChange(): void {
    if (this.isbtUnitIdState() !== 'idle') {
      this.isbtUnitIdState.set('idle');
      this.isbtUnitIdError.set(null);
      this.isbtForm.get('isbtUnitId')?.setErrors(null);
    }
  }

  onIsbtUnitIdBlur(): void {
    const value = this.isbtForm.get('isbtUnitId')?.value?.trim() ?? '';
    if (!value) {
      this.isbtUnitIdState.set('idle');
      this.isbtUnitIdError.set(null);
      return;
    }
    if (this.isbtUnitIdState() === 'valid') return;

    this.isbtUnitIdState.set('validating');
    this.isbtUnitIdError.set(null);

    this.unitIdFieldService.validateUnitId(value, 'N')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          // Only validate FORMAT (CODE128). A new ISBT unit won't be in the system yet,
          // so we intentionally ignore res.success and only check the parsed barcodeType.
          if (res.item?.barcodeType === 'CODE128') {
            this.isbtUnitIdState.set('valid');
            this.isbtUnitIdError.set(null);
            this.rawIsbtUnitId.set(res.item.manualUnitId);
            this.parsedIsbtUnitId.set(res.item.parsedUnitId);
            const formatted = UnitIdFormatUtility.formatCode128(res.item.manualUnitId);
            this.isbtForm.patchValue({ isbtUnitId: formatted }, { emitEvent: false });
            this.isbtForm.get('isbtUnitId')?.setErrors(null);
          } else if (res.item?.barcodeType === 'CODABAR') {
            this.isbtUnitIdState.set('invalid');
            this.isbtUnitIdError.set('Unit ID must be in ISBT 128 (CODE128) format, not Codabar.');
            this.isbtForm.get('isbtUnitId')?.setErrors({ isbtFormat: true });
            this.isbtForm.get('isbtUnitId')?.markAsTouched();
          } else {
            this.isbtUnitIdState.set('invalid');
            this.isbtUnitIdError.set(res.message || 'Invalid ISBT Unit ID format.');
            this.isbtForm.get('isbtUnitId')?.setErrors({ isbtFormat: true });
            this.isbtForm.get('isbtUnitId')?.markAsTouched();
          }
        },
        error: () => {
          this.isbtUnitIdState.set('invalid');
          this.isbtUnitIdError.set('ISBT Unit ID validation failed.');
          this.isbtForm.get('isbtUnitId')?.setErrors({ isbtFormat: true });
          this.isbtForm.get('isbtUnitId')?.markAsTouched();
        },
      });
  }

  // ── Confirm Print: validate → print → open verification ──────────────────

  onConfirmPrintChange(value: string): void {
    if (value === 'Y') {
      this.onConfirmPrint();
    }
  }

  private validateIsbtFields(): boolean {
    this.isbtForm.markAllAsTouched();
    const v = this.isbtForm.value;

    if (!v.isbtUnitId?.trim()) {
      this.showError('ISBT Unit ID is required.');
      return false;
    }
    if (this.isbtUnitIdState() !== 'valid') {
      this.showError('Please enter a valid ISBT Unit ID before proceeding.');
      return false;
    }
    const expDateCtrl = this.isbtForm.get('expirationDate');
    if (!expDateCtrl?.value) {
      this.showError('Expiration Date is required.');
      return false;
    }
    if (expDateCtrl.invalid) {
      this.showError(this.getExpirationDateError() || 'Expiration Date is invalid.');
      return false;
    }
    const expTimeCtrl = this.isbtForm.get('expirationTime');
    if (!expTimeCtrl?.value?.trim()) {
      this.showError('Expiration Time is required.');
      return false;
    }
    if (expTimeCtrl.hasError('invalidTime')) {
      this.showError('Expiration Time is invalid. Use HH:MM (24-hour format).');
      return false;
    }
    return true;
  }

  private onConfirmPrint(): void {
    if (!this.validateIsbtFields()) return;

    const v = this.isbtForm.value;
    const unit = this.unitData();
    if (!unit) return;

    const rawUnitId = this.rawIsbtUnitId();
    const request: ValidateIsbtDetailsRequest = {
      isbtUnitId: rawUnitId,
      catalogNumber: v.catalogNumber || unit.catalogNumber || '',
      lotNumber: v.lotNumber || unit.lotNumber || '',
      isbtProductCode: this.fullIsbtProductCode() || v.isbtProductCode || '',
      aboLabel: v.aboLabel || '',
      expirationDate: this.combineExpirationDateTime(),
      codabarExpirationDate: unit.expiryDate,
      specialTestingCode: v.specialTestingCode || undefined,
      facilityCode: v.facilityCode || undefined,
      contractId: unit.contractId,
      codabarProductCode: this.productCodeValue() || unit.productCode,
      codabarUnitId: unit.osUnitId || unit.unitId,
    };

    this.isSaving.set(true);
    this.service.validateIsbtDetails(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (!res.success) {
            this.isSaving.set(false);
            this.showError(res.message || 'ISBT details validation failed.');
            return;
          }
          this.printLabel(true);
        },
        error: err => {
          this.isSaving.set(false);
          this.showError(err?.error?.message || 'ISBT details validation failed.');
        },
      });
  }

  // ── Reprint: print label only (no verification, no commit) ─────────────

  onReprint(): void {
    if (!this.validateIsbtFields()) return;

    const unit = this.unitData();
    if (!unit) return;

    this.isSaving.set(true);
    this.printLabel(false);
  }

  private printLabel(openVerification: boolean): void {
    const unit = this.unitData();
    if (!unit) return;
    const v = this.isbtForm.value;

    const request: RelabelPrintLabelRequest = {
      codabarUnitId: unit.osUnitId || unit.unitId,
      unitId: this.rawIsbtUnitId(),
      productCode: v.isbtProductCode || '',
      abo: v.aboLabel || '',
      expirationDate: this.combineExpirationDateTime(),
      specialTestingCode: v.specialTestingCode || undefined,
      contractId: unit.contractId || undefined,
      facilityCode: v.facilityCode || undefined,
      labelType: 'PFF',
      overrides: null,
    };

    this.service.printLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          if (openVerification) {
            this.showToast('Printing label in the verification mode.');
            this.openLabelVerificationDialog();
          } else {
            this.showToast('(Re)Printing label in the non verification mode.');
          }
        },
        error: () => {
          this.isSaving.set(false);
          if (openVerification) {
            this.openLabelVerificationDialog();
          }
        },
      });
  }

  // ── Label Verification dialog ─────────────────────────────────────────────

  openLabelVerificationDialog(): void {
    this.verificationUnitId.set('');
    this.verificationAbo.set('');
    this.verificationProductCode.set('');
    this.verificationExpDate.set(null);
    this.verificationExpTime.set('');
    this.verificationSpecialTesting.set('');
    this.verificationScanUnitAbo.set('');
    this.verificationScanProductExp.set('');
    this.showLabelVerification.set(true);
  }

  closeLabelVerification(): void {
    this.showLabelVerification.set(false);
  }

  onScanUnitAbo(event: Event): void {
    this.verificationScanUnitAbo.set((event.target as HTMLInputElement).value);
  }

  onScanUnitAboEnter(): void {
    const scanned = this.verificationScanUnitAbo();
    if (!scanned) return;

    this.unitIdFieldService.validateUnitId(scanned, 'N')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.item) {
            this.verificationUnitId.set(res.item.parsedUnitId);
          } else {
            this.verificationUnitId.set(scanned);
          }
          this.verificationScanUnitAbo.set('');
        },
        error: () => {
          this.verificationUnitId.set(scanned);
          this.verificationScanUnitAbo.set('');
        },
      });
  }

  onScanProductExp(event: Event): void {
    this.verificationScanProductExp.set((event.target as HTMLInputElement).value);
  }

  onScanProductExpEnter(): void {
    const scanned = this.verificationScanProductExp();
    if (scanned) {
      this.verificationProductCode.set(scanned);
      this.verificationScanProductExp.set('');
    }
  }

  onVerificationUnitIdInput(event: Event): void {
    this.verificationUnitId.set((event.target as HTMLInputElement).value);
  }

  onVerificationUnitIdBlur(): void {
    const value = this.verificationUnitId()?.trim();
    if (!value) return;

    this.unitIdFieldService.validateUnitId(value, 'N')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.item) {
            this.verificationUnitId.set(res.item.parsedUnitId);
          }
        },
        error: () => {},
      });
  }

  onVerificationAboChange(value: string): void {
    this.verificationAbo.set(value);
  }

  onVerificationProductCodeInput(event: Event): void {
    this.verificationProductCode.set((event.target as HTMLInputElement).value);
  }

  onVerificationExpDateChange(value: Moment | null): void {
    this.verificationExpDate.set(value);
  }

  onVerificationExpTimeInput(event: Event): void {
    this.verificationExpTime.set((event.target as HTMLInputElement).value);
  }

  onVerificationSpecialTestInput(event: Event): void {
    this.verificationSpecialTesting.set((event.target as HTMLInputElement).value);
  }

  onVerificationExpTimeBlur(): void {
    if (!this.isbtForm.get('specialTestingCode')?.value) {
      this.checkAutoVerify();
    }
  }

  onVerificationSpecialTestBlur(): void {
    this.checkAutoVerify();
  }

  private checkAutoVerify(): void {
    if (!this.showLabelVerification() || this.isVerifying()) return;
    if (!this.verificationUnitId()) return;
    if (!this.verificationAbo()) return;
    if (!this.verificationProductCode()) return;
    if (!this.verificationExpDate()) return;
    if (!this.verificationExpTime()) return;

    const needsSpecialTest = !!this.isbtForm.get('specialTestingCode')?.value;
    if (needsSpecialTest && !this.verificationSpecialTesting()) return;

    this.onVerifyAndCommit();
  }

  private formatDateTimeWithTime(date: Moment | null, time: string): string {
    if (!date) return '';
    const [hours, minutes] = (time || '00:00').split(':').map(Number);
    return date.clone().hours(hours || 0).minutes(minutes || 0).seconds(0).format('YYYY-MM-DDTHH:mm:ss');
  }

  onVerifyAndCommit(): void {
    const unit = this.unitData();
    const v = this.isbtForm.value;
    if (!unit || !v.isbtUnitId) return;

    const verExpDate = this.verificationExpDate();
    const verExpTime = this.verificationExpTime();

    const verifyRequest: VerifyLabelRequest = {
      scannedIsbtUnitId: this.verificationUnitId(),
      expectedIsbtUnitId: this.parsedIsbtUnitId(),
      scannedProductCode: this.verificationProductCode(),
      expectedProductCode: this.fullIsbtProductCode() || v.isbtProductCode || '',
      scannedAbo: this.verificationAbo(),
      expectedAbo: v.aboLabel || '',
      scannedExpirationDate: this.formatDateTimeWithTime(verExpDate, verExpTime),
      expectedExpirationDate: this.combineExpirationDateTime(),
      scannedSpecialTestingCode: this.verificationSpecialTesting() || undefined,
      expectedSpecialTestingCode: v.specialTestingCode || undefined,
    };

    this.isVerifying.set(true);
    this.service.verifyLabel(verifyRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (!res.success) {
            this.isVerifying.set(false);
            this.showError(res.message || 'Label verification failed. Scanned values do not match.');
            return;
          }
          this.commitRelabel();
        },
        error: err => {
          this.isVerifying.set(false);
          this.showError(err?.error?.message || 'Label verification failed.');
        },
      });
  }

  private commitRelabel(): void {
    const unit = this.unitData();
    const v = this.isbtForm.value;
    if (!unit) return;

    const componentPrefix = this.selectedComponentPrefix() || unit.componentPrefix;

    const commitRequest: RelabelCommitRequest = {
      codabarUnitId: unit.osUnitId || unit.unitId,
      collectionDate: unit.collectionDate,
      productCode: this.productCodeValue() || unit.productCode,
      componentPrefix,
      isbtUnitId: this.parsedIsbtUnitId() || this.rawIsbtUnitId(),
      isbtProductCode: this.fullIsbtProductCode() || v.isbtProductCode || '',
      aboLabel: v.aboLabel || this.verificationAbo() || '',
      expirationDate: this.combineExpirationDateTime(),
      catalogNumber: v.catalogNumber || unit.catalogNumber || '',
      lotNumber: v.lotNumber || unit.lotNumber || '',
      specialTestingCode: v.specialTestingCode ?? null,
      facilityCode: v.facilityCode ?? null,
      licensureFlag: null,
      contractId: unit.contractId,
      expirationDateChangeOnly: false,
    };

    this.service.relabelCommit(commitRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: commitRes => {
          this.isVerifying.set(false);
          if (!commitRes.success) {
            this.showError(commitRes.message || 'Relabel commit failed.');
            return;
          }
          this.showToast('Unit relabeled from Codabar to ISBT successfully.');
          this.showLabelVerification.set(false);
          this.clearAll();
        },
        error: err => {
          this.isVerifying.set(false);
          this.showError(err?.error?.message || 'Relabel commit failed.');
        },
      });
  }

  clearAll(): void {
    this.unitIdField?.clear();
    this.onUnitCleared();
  }

  // ── Notes dialog ──────────────────────────────────────────────────────────

  openNotesDialog(): void {
    const unit = this.unitData();
    if (!unit) return;

    if (!unit.collectionDate) {
      this.showError('Collection Date is required to view notes');
      return;
    }

    const isbtUnitId = this.isbtForm.get('isbtUnitId')?.value?.trim();
    this.dialog.open(DonationNotesDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: false,
      data: {
        unitId: isbtUnitId || unit.unitId,
        collectionDate: unit.collectionDate,
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private combineExpirationDateTime(): string {
    const expDate = this.isbtForm.get('expirationDate')?.value as Moment | null;
    if (!expDate) return '';
    const time = this.isbtForm.get('expirationTime')?.value || '00:00';
    const [hours, minutes] = time.split(':').map(Number);
    return expDate.clone().hours(hours || 0).minutes(minutes || 0).seconds(0).format('YYYY-MM-DDTHH:mm:ss');
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const m = moment.utc(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const m = moment.utc(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '-';
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 6000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private showToast(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }
}
