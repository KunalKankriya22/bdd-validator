import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, forkJoin, map, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ScanSelectFieldComponent, ScanSelectOption } from '@shared/components/scan-select-field';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { SCAN_PATTERNS, matchesScanPattern, ScanPattern } from '@shared/utils/scan-pattern.util';

import { LabelPrinterContext } from '../change-label-printer/change-label-printer.model';
import { EmergencyMedicalReleaseApiService } from './services/emergency-medical-release-api.service';
import {
  ComponentDetailsDto,
  AboValueDto,
  OverrideCodeDto,
  EmergencyProductDto,
  EmergencyReleaseRequestDto,
  EmergencyReleaseResponseDto,
  ProcessEmergencyLabelRequestDto,
  ProcessEmergencyLabelResponseDto,
  TestWarningDto,
} from './models/emergency-medical-release.model';

const LABEL_PRINTER_STORAGE_KEY = 'labelPrinterContext';
const CHANGE_PRINTER_URL = '/laboratory-functions/labeling-functions/common-labeling-functions/change-label-printer';
const SELF_URL = '/laboratory-functions/labeling-functions/common-labeling-functions/emergency-medical-release';

@Component({
  selector: 'app-emergency-medical-release',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './emergency-medical-release.html',
  styleUrls: ['./emergency-medical-release.scss'],
})
export class EmergencyMedicalReleaseComponent implements OnInit, OnDestroy, AfterViewInit {
  private static nextId = 0;
  protected readonly componentId = `emergency-medical-release-${EmergencyMedicalReleaseComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('verifyUnitIdField') verifyUnitIdField!: UnitIdFieldComponent;
  @ViewChild('row1ProductCodeField') row1ProductCodeField!: ScanSelectFieldComponent;
  @ViewChild('emergencyLabelField') emergencyLabelField!: ScanSelectFieldComponent;
  @ViewChild('overrideCodeField') overrideCodeField!: ScanSelectFieldComponent;
  @ViewChild('scanUnitAboInput') scanUnitAboInput!: ElementRef<HTMLInputElement>;
  @ViewChild('scanProdExpInput') scanProdExpInput!: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly apiService = inject(EmergencyMedicalReleaseApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();
  protected readonly SCAN_PATTERNS = SCAN_PATTERNS;

  // Phase signal
  phase = signal<'init' | 'ready' | 'unit-validated' | 'labeled'>('init');

  // State signals
  protected readonly componentLoading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly componentData = signal<ComponentDetailsDto | null>(null);
  protected readonly releaseResponse = signal<EmergencyReleaseResponseDto | null>(null);
  protected readonly currentLabelPrinter = signal<string>('');
  protected readonly overrideNote = signal<string>('');
  protected readonly submitted = signal<boolean>(false);
  protected readonly warnings = signal<TestWarningDto[]>([]);
  protected readonly saveCompleted = signal<boolean>(false);

  // Comments side panel
  protected readonly showCommentsPanel = signal<boolean>(false);

  // Warning override dialog (inline overlay, same pattern as change-label-printer)
  showWarningDialog = signal<boolean>(false);
  warningDialogTitle = signal<string>('');
  warningDialogWarnings = signal<{ code: string; message: string }[]>([]);
  private warningDialogCallback: (() => void) | null = null;
  protected readonly panelNote = signal<string>('');
  protected readonly panelNoteLength = computed(() => this.panelNote().length);

  // LOV signals
  protected readonly aboValues = signal<AboValueDto[]>([]);
  protected readonly overrideCodes = signal<OverrideCodeDto[]>([]);
  protected readonly products = signal<EmergencyProductDto[]>([]);
  protected readonly componentPrefixes = signal<string[]>([]);

  // Computed values
  protected readonly hasWarnings = computed(() => this.warnings().length > 0);

  // Scan-select-field option computeds
  productCodeOptions = computed<ScanSelectOption[]>(() =>
    this.products().map(p => ({ code: p.productCode, description: p.productDesc })),
  );

  aboLovOptions = computed<ScanSelectOption[]>(() =>
    this.aboValues().map(a => ({ code: a.aboLabel, description: a.aboShortName })),
  );

  overrideCodeOptions = computed<ScanSelectOption[]>(() =>
    this.overrideCodes().map(o => ({ code: o.overrideCode, description: o.description })),
  );

  // Phase-driven disabled computeds
  row1ProductCodeDisabled = computed(() => this.phase() === 'init' || this.phase() === 'ready');
  row2Disabled = computed(() => this.phase() !== 'labeled');
  row4OverrideDisabled = computed(() => this.phase() !== 'labeled');

  // Save enabled only after all fields verified + matched
  saveEnabled = computed(() => this.verified() && !this.saving() && !this.saveCompleted());

  // Process label response (from /process-label call)
  processLabelResult = signal<ProcessEmergencyLabelResponseDto | null>(null);
  labelProcessed = signal<boolean>(false);
  verified = signal<boolean>(false);
  verifiedUnitId = signal<string>('');

  // Display signals for template
  selectedEmergencyLabel = signal<string>('');
  scannedAboDescription = signal<string>('');
  selectedProductDescription = signal<string>('');
  verifyProductDescription = signal<string>('');
  selectedOverrideDescription = signal<string>('');

  // Scan field processing state
  protected fieldProcessing: Record<string, boolean> = {};
  protected fieldErrors: Record<string, string> = {};

  // Truncation detection
  protected isDescTruncated: Record<string, boolean> = {};

  // Parsed unit ID from Row 1 for cross-field validation
  private phase1ParsedUnitId = '';
  private lastSaveRequest: EmergencyReleaseRequestDto | null = null;

  // Unit validation data
  private unitValidationData: UnitValidationResponse | null = null;
  private codeScheme: string = 'I';

  // Verification form
  verificationForm!: FormGroup;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
  };

  // ── Parse callbacks for scan-select-fields ──

  readonly parseProductCode = (value: string): Observable<ScanSelectOption | null> => {
    return this.labelScanService.validateProductScan(value, this.codeScheme).pipe(
      map((res) => {
        if (res.success && res.item) {
          return { code: res.item.productCode!, description: res.item.productDescription ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid product code');
      }),
    );
  };

  readonly parseAbo = (value: string): Observable<ScanSelectOption | null> => {
    return this.labelScanService.validateAboScan(value, this.codeScheme).pipe(
      map((res) => {
        if (res.success && res.item && res.item.aboCode) {
          return { code: res.item.aboCode, description: res.item.aboShortName ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid ABO code');
      }),
    );
  };

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
        };
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.initVerificationForm();

    const printer = this.loadPrinterContextFromStorage();
    if (!printer?.labelPrinterCode) {
      this.router.navigate([CHANGE_PRINTER_URL], {
        queryParams: { returnUrl: SELF_URL },
      });
      return;
    }
    this.currentLabelPrinter.set(printer.labelPrinterCode);
    this.phase.set('ready');

    this.subscribeToChapterChanges();
    this.loadLovs();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.unitIdField?.focus());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initVerificationForm(): void {
    this.verificationForm = this.fb.group({
      scanUnitAbo: [{ value: '', disabled: true }],
      scanProdExp: [{ value: '', disabled: true }],
      scanProductCode: [{ value: '', disabled: true }],
      scanExpDate: [{ value: '', disabled: true }],
    });
  }

  private enableVerificationFields(): void {
    Object.keys(this.verificationForm.controls).forEach((key) => {
      this.verificationForm.get(key)?.enable();
    });
  }

  private disableVerificationFields(): void {
    Object.keys(this.verificationForm.controls).forEach((key) => {
      this.verificationForm.get(key)?.disable();
    });
  }

  private resetVerificationState(): void {
    this.verificationForm?.reset();
    this.disableVerificationFields();
    this.phase.set('unit-validated');
    this.processLabelResult.set(null);
    this.labelProcessed.set(false);
    this.verified.set(false);
    this.verifiedUnitId.set('');
    this.selectedEmergencyLabel.set('');
    this.scannedAboDescription.set('');
    this.verifyProductDescription.set('');
    this.selectedOverrideDescription.set('');
    this.overrideNote.set('');
    this.warnings.set([]);
    this.lastSaveRequest = null;
    this.saveCompleted.set(false);
    this.emergencyLabelField?.clear();
    this.overrideCodeField?.clear();
    if (this.verifyUnitIdField) {
      this.verifyUnitIdField.clear();
    }
    this.cdr.markForCheck();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadLovs();
        this.reloadLabelPrinter();
      });
  }

  // ── Label Printer ──

  private loadPrinterContextFromStorage(): LabelPrinterContext | null {
    try {
      const raw = sessionStorage.getItem(LABEL_PRINTER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private reloadLabelPrinter(): void {
    const printer = this.loadPrinterContextFromStorage();
    if (!printer?.labelPrinterCode) {
      this.router.navigate([CHANGE_PRINTER_URL], {
        queryParams: { returnUrl: SELF_URL },
      });
      return;
    }
    this.currentLabelPrinter.set(printer.labelPrinterCode);
  }

  // ── LOV Loading ──

  private loadLovs(): void {
    forkJoin({
      aboValues: this.apiService.getAboValues(this.codeScheme),
      overrideCodes: this.apiService.getOverrideCodes(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.aboValues.success) {
            this.aboValues.set(
              Array.isArray(result.aboValues.data)
                ? result.aboValues.data
                : [],
            );
          }
          if (result.overrideCodes.success) {
            this.overrideCodes.set(
              Array.isArray(result.overrideCodes.data)
                ? result.overrideCodes.data
                : [],
            );
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.showError(err);
        },
      });
  }

  private loadProducts(unitId: string): void {
    this.apiService
      .getProducts(unitId, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const list = Array.isArray(response.data) ? response.data : [];
            this.products.set(list);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.showError(err);
        },
      });
  }

  private loadComponentPrefixes(
    unitId: string,
    productCode: string,
  ): void {
    this.apiService
      .getComponentPrefixes(unitId, productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const prefixes = Array.isArray(response.data)
              ? response.data
              : [];
            this.componentPrefixes.set(prefixes);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.showError(err);
        },
      });
  }

  // ── Auto-scan (blur on barcode pattern match) ──

  onAutoScan(event: Event, patterns: ScanPattern[]): void {
    const value = (event.target as HTMLInputElement).value;
    if (matchesScanPattern(value, patterns)) {
      (event.target as HTMLInputElement).blur();
    }
  }

  // ── Row 1: Primary Unit ID ──

  onUnitValidated(event: UnitValidationResponse): void {
    // Reset everything below unit level
    this.row1ProductCodeField?.clear();
    this.selectedProductDescription.set('');
    this.products.set([]);
    this.componentPrefixes.set([]);
    this.resetVerificationState();

    this.unitValidationData = event;
    this.codeScheme = event.codeScheme;
    this.phase1ParsedUnitId = event.parsedUnitId;
    this.componentLoading.set(true);

    this.apiService
      .getComponent(event.parsedUnitId, event.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.componentLoading.set(false);
          if (response.success && response.data) {
            this.componentData.set(response.data);
            this.loadProducts(event.parsedUnitId);
            this.loadLovs();
            this.phase.set('unit-validated');
            setTimeout(() => this.row1ProductCodeField?.focus());

            // Check warehouse mismatch (FMB error 0241 — fires at unit/product level)
            const componentWarehouse = response.data.warehouseId;
            const userWarehouse = this.headerService.warehouseId();
            if (componentWarehouse && userWarehouse
                && componentWarehouse.toUpperCase() !== userWarehouse.toUpperCase()) {
              this.openWarningOverlay(
                'Warehouse Mismatch',
                [{ code: '0241', message: 'Unit/Component not located in the current warehouse' }],
                () => { /* user acknowledged — proceed normally */ },
              );
            }
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.componentLoading.set(false);
          this.showError(err);
          this.cdr.markForCheck();
        },
      });
  }

  onUnitCleared(): void {
    this.unitValidationData = null;
    this.phase1ParsedUnitId = '';
    this.componentData.set(null);
    this.releaseResponse.set(null);
    this.products.set([]);
    this.componentPrefixes.set([]);
    this.warnings.set([]);
    this.overrideNote.set('');
    this.saveCompleted.set(false);
    this.submitted.set(false);
    this.fieldErrors = {};
    this.fieldProcessing = {};
    this.phase.set('init');
    this.verificationForm?.reset();
    this.disableVerificationFields();
    this.row1ProductCodeField?.clear();
    this.emergencyLabelField?.clear();
    this.overrideCodeField?.clear();
    if (this.verifyUnitIdField) {
      this.verifyUnitIdField.clear();
    }
    this.cdr.markForCheck();
  }

  // ── Row 1: Product Code (scan-select-field) ──

  onRow1ProductCodeChanged(option: ScanSelectOption | null): void {
    if (!option) return;

    // Reset verification state when product changes
    this.resetVerificationState();
    this.selectedProductDescription.set(option.description);

    if (this.unitValidationData) {
      this.loadComponentPrefixes(this.unitValidationData.parsedUnitId, option.code);
    }

    this.callProcessLabel(option.code);
  }

  private callProcessLabel(productCode: string, overrides: string[] = []): void {
    if (!this.unitValidationData) return;

    this.componentLoading.set(true);
    this.cdr.markForCheck();

    const comp = this.componentData();
    const request: ProcessEmergencyLabelRequestDto = {
      unitId: this.unitValidationData.parsedUnitId,
      productCode,
      componentPrefix: this.componentPrefixes().length === 1
        ? this.componentPrefixes()[0]
        : comp?.componentPrefix || null,
      codeScheme: this.codeScheme,
      printerCode: this.currentLabelPrinter() || null,
      overrides,
    };

    this.apiService
      .processLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.componentLoading.set(false);
          if (response.success && response.data) {

            // KB pattern: check for WARNING status before proceeding
            if (response.data.status === 'WARNING' && response.data.validationWarnings?.length) {
              this.openWarningOverlay(
                'Validation Warning',
                response.data.validationWarnings,
                () => {
                  const overrideCodes = response.data!.validationWarnings.map(w => w.code);
                  this.callProcessLabel(productCode, overrideCodes);
                },
              );
              return;
            }

            this.processLabelResult.set(response.data);
            this.labelProcessed.set(true);

            // Enrich componentData with process-label results
            const current = this.componentData();
            if (current) {
              this.componentData.set({
                ...current,
                testedAboFromUtrs: response.data.testedAbo ?? current.testedAboFromUtrs,
                testedAboDescription: response.data.testedAboDescription ?? current.testedAboDescription,
                calculatedExpiryDate: response.data.calculatedExpiryDate ?? current.calculatedExpiryDate,
                bagCode: response.data.bagCode ?? current.bagCode,
                isReagentDonation: response.data.isReagentDonation,
              });
            }

            if (response.data.warnings?.length) {
              this.warnings.set(response.data.warnings);
            }

            this.snackbarService.showSuccess(response.message);

            // Use setTimeout to ensure change detection picks up phase change
            // for child components (app-unit-id-field, app-scan-select-field)
            // that rely on ngOnChanges for [disabled] input binding
            setTimeout(() => {
              this.phase.set('labeled');
              this.enableVerificationFields();
              this.cdr.markForCheck();
              setTimeout(() => this.scanUnitAboInput?.nativeElement?.focus());
            });
          } else {
            this.snackbarService.showError(response.message);
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.componentLoading.set(false);
          this.showError(err);
          this.cdr.markForCheck();
        },
      });
  }

  // ── Row 2: Composite Scan Unit ABO ──

  onScanUnitAboBlur(): void {
    const scanValue = this.verificationForm.get('scanUnitAbo')?.value?.trim();
    if (!scanValue) return;

    this.fieldProcessing['scanUnitAbo'] = true;
    this.clearFieldError('scanUnitAbo');
    this.cdr.markForCheck();

    this.labelScanService
      .validateUnitAboScan(scanValue, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanUnitAbo'] = false;
          if (res.success && res.item) {
            const parsedUnitId = res.item.parsedUnitId || '';
            const parsedAbo = res.item.aboCode || '';
            const displayUnitId = res.item.manualUnitId || parsedUnitId;

            if (this.phase1ParsedUnitId && parsedUnitId.toUpperCase() !== this.phase1ParsedUnitId.toUpperCase()) {
              this.showScanError('1508', 'This unit ID must be same as the original unit ID', 'scanUnitAbo');
              this.cdr.markForCheck();
              return;
            }

            this.verificationForm.patchValue({ scanUnitAbo: '' }, { emitEvent: false });
            this.verifiedUnitId.set(parsedUnitId);
            if (this.verifyUnitIdField) {
              this.verifyUnitIdField.setValue(displayUnitId);
            }

            // Set emergency label via ViewChild + validate against tested ABO
            if (parsedAbo) {
              const aboDescription = res.item.aboDescription || '';
              const testedAbo = this.processLabelResult()?.testedAbo;
              if (this.codeScheme === 'I' && testedAbo) {
                const selectedRow = this.aboValues().find(a => a.aboLabel === parsedAbo);
                if (!selectedRow || selectedRow.testedAboCode !== testedAbo) {
                  this.snackbarService.showError('1140: Invalid blood type — does not match tested ABO');
                  this.verificationForm.patchValue({ scanUnitAbo: '' }, { emitEvent: false });
                  this.cdr.markForCheck();
                  return;
                }
              }
              this.emergencyLabelField?.setValue(parsedAbo, aboDescription);
              this.selectedEmergencyLabel.set(parsedAbo);
              this.scannedAboDescription.set(aboDescription);
            }

            this.clearFieldError('scanUnitAbo');
            this.tryAutoVerify();
            setTimeout(() => this.scanProdExpInput?.nativeElement?.focus());
          } else {
            this.showScanError(
              res.errorResponse?.errorCode || res.errorCode || '6040',
              res.errorResponse?.error || res.message,
              'scanUnitAbo',
            );
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.fieldProcessing['scanUnitAbo'] = false;
          this.showScanError('6040', err?.error?.message || 'Invalid scan', 'scanUnitAbo');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Row 2: Verify Unit ID field ──

  onVerifyUnitValidated(event: UnitValidationResponse): void {
    if (this.phase1ParsedUnitId && event.parsedUnitId.toUpperCase() !== this.phase1ParsedUnitId.toUpperCase()) {
      if (this.verifyUnitIdField) {
        this.verifyUnitIdField.clear();
      }
      this.snackbarService.showError('1508: Unit ID must match the original unit ID');
      return;
    }
    this.verifiedUnitId.set(event.parsedUnitId);
    this.tryAutoVerify();
    setTimeout(() => this.emergencyLabelField?.focus());
    this.cdr.markForCheck();
  }

  onVerifyUnitCleared(): void {
    this.verifiedUnitId.set('');
    this.cdr.markForCheck();
  }

  // ── Row 3: Emergency Label (scan-select-field) ──

  onEmergencyLabelChanged(option: ScanSelectOption | null): void {
    if (!option) {
      this.selectedEmergencyLabel.set('');
      this.scannedAboDescription.set('');
      return;
    }

    // FMB validation: selected emergency ABO must correspond to the unit's tested ABO
    // valid_abo_values: abo_label (user selects) maps to tested_abo_code (must match unit)
    if (this.codeScheme === 'I') {
      const testedAbo = this.processLabelResult()?.testedAbo;
      if (testedAbo) {
        const selectedRow = this.aboValues().find(a => a.aboLabel === option.code);
        if (!selectedRow || selectedRow.testedAboCode !== testedAbo) {
          this.emergencyLabelField?.clear();
          this.selectedEmergencyLabel.set('');
          this.scannedAboDescription.set('');
          this.snackbarService.showError('1140: Invalid blood type — does not match tested ABO');
          return;
        }
      }
    }

    this.selectedEmergencyLabel.set(option.code);
    this.scannedAboDescription.set(option.description);
    this.tryAutoVerify();
    setTimeout(() => this.scanProdExpInput?.nativeElement?.focus());
    this.cdr.markForCheck();
  }

  onEmergencyLabelCleared(): void {
    this.selectedEmergencyLabel.set('');
    this.scannedAboDescription.set('');
    this.cdr.markForCheck();
  }

  // ── Row 4: Composite Scan Product/Expiry ──

  onScanProdExpBlur(): void {
    const scanValue = this.verificationForm.get('scanProdExp')?.value?.trim();
    if (!scanValue) return;

    this.fieldProcessing['scanProdExp'] = true;
    this.clearFieldError('scanProdExp');
    this.cdr.markForCheck();

    this.labelScanService
      .validateProductExpiryScan(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanProdExp'] = false;
          if (res.success && res.item) {
            const parsedProduct = res.item.productCode || '';
            const parsedExpiry = res.item.expiryDisplay || this.formatExpiryDisplay(res.item.expiryDate);

            const expectedProduct = this.row1ProductCodeField?.currentValue?.code?.toUpperCase() ||
              this.componentData()?.productCode?.toUpperCase();
            if (expectedProduct && parsedProduct.toUpperCase() !== expectedProduct) {
              this.showScanError('9728', 'Product verification failed, mismatch in product codes', 'scanProdExp');
              this.cdr.markForCheck();
              return;
            }

            this.verificationForm.patchValue({
              scanProdExp: '',
              scanProductCode: parsedProduct,
              scanExpDate: parsedExpiry,
            });
            this.verifyProductDescription.set(res.item.productDescription || '');
            this.clearFieldError('scanProdExp');
            this.clearFieldError('scanProductCode');
            this.clearFieldError('scanExpDate');
            this.tryAutoVerify();
            setTimeout(() => this.overrideCodeField?.focus());
          } else {
            this.showScanError(
              res.errorResponse?.errorCode || res.errorCode || '9710',
              res.errorResponse?.error || res.message,
              'scanProdExp',
            );
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.fieldProcessing['scanProdExp'] = false;
          this.showScanError('9710', err?.error?.message || 'Invalid scan', 'scanProdExp');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Row 4: Override Code (scan-select-field) ──

  onOverrideCodeChanged(option: ScanSelectOption | null): void {
    if (!option) {
      this.selectedOverrideDescription.set('');
      return;
    }
    this.selectedOverrideDescription.set(option.description);
    this.openCommentsPanel();
    this.tryAutoVerify();
    this.cdr.markForCheck();
  }

  onOverrideCodeCleared(): void {
    this.selectedOverrideDescription.set('');
    this.cdr.markForCheck();
  }

  // ── Truncation detection ──

  checkTruncation(el: HTMLElement, key: string): void {
    this.isDescTruncated[key] = el.scrollWidth > el.clientWidth;
  }

  onClearAll(): void {
    this.clearAll();
  }

  onScanProductCodeBlur(): void {
    const value = this.verificationForm.get('scanProductCode')?.value?.trim();
    if (!value) return;

    this.fieldProcessing['scanProductCode'] = true;
    this.clearFieldError('scanProductCode');
    this.cdr.markForCheck();

    this.labelScanService.validateProductScan(value, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanProductCode'] = false;
          if (res.success && res.item) {
            this.verificationForm.patchValue({ scanProductCode: res.item.productCode }, { emitEvent: false });
            this.verifyProductDescription.set(res.item.productDescription || '');
            this.tryAutoVerify();
            const expInput = document.querySelector('input[formcontrolname="scanExpDate"]') as HTMLInputElement;
            setTimeout(() => expInput?.focus());
          } else {
            this.showScanError(res.errorResponse?.errorCode || '6035', res.errorResponse?.error || 'Invalid product code', 'scanProductCode');
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.fieldProcessing['scanProductCode'] = false;
          this.showScanError('6035', 'Invalid product code', 'scanProductCode');
          this.cdr.markForCheck();
        },
      });
  }

  onScanExpDateBlur(): void {
    const value = this.verificationForm.get('scanExpDate')?.value?.trim();
    if (!value) return;

    this.fieldProcessing['scanExpDate'] = true;
    this.clearFieldError('scanExpDate');
    this.cdr.markForCheck();

    this.labelScanService.validateExpiryScan(value, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanExpDate'] = false;
          if (res.success && res.item) {
            this.verificationForm.patchValue({ scanExpDate: this.formatExpiryDisplay(res.item.expiryDate) }, { emitEvent: false });
            this.tryAutoVerify();
            setTimeout(() => this.overrideCodeField?.focus());
          } else {
            this.showScanError(res.errorResponse?.errorCode || '6030', res.errorResponse?.error || 'Invalid expiry date', 'scanExpDate');
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.fieldProcessing['scanExpDate'] = false;
          this.showScanError('6030', 'Invalid expiry date', 'scanExpDate');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Auto-verification ──

  private tryAutoVerify(): void {
    if (Object.values(this.fieldProcessing).some(v => v)) return;

    // Check: verifyUnitId populated
    const verifyUnitId = this.verifiedUnitId();
    if (!verifyUnitId) return;

    // Check: emergencyLabel selected
    const emergencyLabel = this.emergencyLabelField?.currentValue;
    if (!emergencyLabel) return;

    // Check: scanProductCode populated
    const scanProductCode = this.verificationForm.get('scanProductCode')?.value?.trim();
    if (!scanProductCode) return;

    // Check: scanExpDate populated
    const scanExpDate = this.verificationForm.get('scanExpDate')?.value?.trim();
    if (!scanExpDate) return;

    // Check: overrideCode selected
    const overrideCode = this.overrideCodeField?.currentValue;
    if (!overrideCode) return;

    // Check: note entered
    if (!this.overrideNote()) return;

    this.doVerificationComparison();
  }

  private doVerificationComparison(): void {
    const formValue = this.verificationForm.getRawValue();

    // Compare scanned unit ID vs expected (error 1508)
    const verifyUnitId = this.verifiedUnitId();
    const scannedUnitId = (typeof verifyUnitId === 'object' && verifyUnitId !== null)
      ? (verifyUnitId as any).parsedUnitId || ''
      : '';
    const expectedUnitId = this.phase1ParsedUnitId.toUpperCase();
    if (scannedUnitId && expectedUnitId && scannedUnitId.toUpperCase() !== expectedUnitId) {
      this.showScanError('1508', 'This unit ID must be same as the original unit ID');
      return;
    }

    // Compare scanned product code vs expected (error 9728)
    const scannedProduct = formValue.scanProductCode?.trim().toUpperCase();
    const expectedProduct = (this.row1ProductCodeField?.currentValue?.code ||
      this.componentData()?.productCode)?.toUpperCase();
    if (scannedProduct && expectedProduct && scannedProduct !== expectedProduct) {
      this.showScanError('9728', 'Product verification failed, mismatch in product codes', 'scanProductCode');
      return;
    }

    // Compare scanned expiry vs expected (error 1170)
    const scannedExp = formValue.scanExpDate?.trim().toUpperCase();
    const expectedExp = this.formatExpiryDisplay(this.componentData()?.calculatedExpiryDate || '')?.toUpperCase();
    if (scannedExp && expectedExp && scannedExp !== expectedExp) {
      this.showScanError('1170', 'Invalid expiration date', 'scanExpDate');
      return;
    }

    // All match — enable SAVE button
    this.verified.set(true);
    this.cdr.markForCheck();
  }

  // ── Scan error helpers ──

  private showScanError(errorCode: string, message: string, controlName?: string): void {
    this.snackbarService.showError(`${errorCode}: ${message}`);
    if (controlName) {
      const control = this.verificationForm.get(controlName);
      control?.setValue('');
      control?.setErrors({ scanError: true });
      control?.markAsTouched();
    }
  }

  private clearFieldError(controlName: string): void {
    const control = this.verificationForm.get(controlName);
    if (control?.errors) {
      control.setErrors(null);
    }
    delete this.fieldErrors[controlName];
  }

  // ── Comments Side Panel ──

  protected openCommentsPanel(): void {
    this.panelNote.set(this.overrideNote());
    this.showCommentsPanel.set(true);
  }

  protected onCloseCommentsPanel(): void {
    this.showCommentsPanel.set(false);
  }

  protected onSaveCommentsPanel(): void {
    this.overrideNote.set(this.panelNote());
    this.showCommentsPanel.set(false);
    this.tryAutoVerify();
  }

  protected onPanelNoteInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.panelNote.set(value);
  }

  // ── Reprint ──

  onReprint(): void {
    if (!this.labelProcessed()) {
      this.snackbarService.showError('No label has been processed yet');
      return;
    }
    if (this.saveCompleted()) {
      this.snackbarService.showError('5308: Re-Printing Labels not allowed after verification');
      return;
    }
    const productCode = this.row1ProductCodeField?.currentValue?.code;
    if (!productCode) {
      this.snackbarService.showError('Product code is required for reprint');
      return;
    }
    this.callProcessLabel(productCode);
  }

  // ── Save ──

  onSave(): void {
    this.submitted.set(true);

    if (!this.unitValidationData || !this.componentData()) {
      if (this.unitIdField) {
        this.snackbarService.showError('Unit ID is required');
      }
      return;
    }

    // Note required check
    if (!this.overrideNote()) {
      this.snackbarService.showError('A note is required for emergency release.');
      this.openCommentsPanel();
      return;
    }

    const formValue = this.verificationForm.getRawValue();
    const comp = this.componentData()!;

    const selectedProductCode = this.row1ProductCodeField?.currentValue?.code || comp.productCode;
    const selectedAbo = this.emergencyLabelField?.currentValue?.code || '';
    const selectedOverrideCode = this.overrideCodeField?.currentValue?.code || '';

    if (!selectedAbo) {
      return;
    }

    if (!selectedOverrideCode) {
      return;
    }

    this.saving.set(true);

    const request: EmergencyReleaseRequestDto = {
      unitId: this.unitValidationData.parsedUnitId,
      productCode: selectedProductCode,
      componentPrefix: this.componentPrefixes().length === 1
        ? this.componentPrefixes()[0]
        : comp.componentPrefix,
      abo: selectedAbo,
      overrideCode: selectedOverrideCode,
      note: this.overrideNote() || null,
      codeScheme: this.codeScheme,
      actualExpiryDate: this.processLabelResult()?.calculatedExpiryDate || comp.calculatedExpiryDate || null,
      bleedStartTime: null,
      expiryDate128: null,
      verifyUnitId: this.unitValidationData.parsedUnitId,
      verifyProductCode: formValue.scanProductCode || selectedProductCode,
      verifyExpiryDate: this.processLabelResult()?.calculatedExpiryDate || null,
    };

    this.lastSaveRequest = request;

    this.apiService
      .processRelease(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success && response.data) {
            this.releaseResponse.set(response.data);
            this.saveCompleted.set(true);
            this.snackbarService.showSuccess(response.message);

            if (response.data.warnings && response.data.warnings.length > 0) {
              this.warnings.set(response.data.warnings);
            }
          } else {
            this.snackbarService.showError(response.message);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.saving.set(false);
          this.showError(err);
          this.cdr.markForCheck();
        },
      });
  }

  // ── Formatting helpers ──

  formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  formatDateTime(value: string | null): string {
    if (!value) return '';
    const gmt = moment.utc(value);
    if (!gmt.isValid()) return value;
    const local = this.chapterTimezoneService.convertGmtToLocal(gmt);
    return local.format('DD-MMM-YYYY HH:mm').toUpperCase();
  }

  // FMB: BLEED_START_TIME displayed as DD-MON-YYYY HH24:MI
  // BE already converts GMT → local via GetLocalDateAsync, so just format here
  formatBleedStartTime(value: string | null): string {
    if (!value) return '--';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${mon}-${year} ${hh}:${mm}`;
  }

  private formatExpiryDisplay(value: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    if (hours === 0 && minutes === 0) {
      return `${day}-${mon}-${year}`;
    }
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${day}-${mon}-${year} ${hh}:${mm}`;
  }

  // ── Clear ──

  private clearAll(): void {
    this.componentData.set(null);
    this.releaseResponse.set(null);
    this.products.set([]);
    this.componentPrefixes.set([]);
    // Log abandoned if label was printed but not confirmed
    if (this.labelProcessed() && !this.saveCompleted() && this.unitValidationData) {
      this.apiService
        .logAbandoned({
          unitId: this.unitValidationData.parsedUnitId,
          collDate: this.componentData()?.collDate || null,
          productCode: this.row1ProductCodeField?.currentValue?.code || null,
          componentPrefix: this.componentData()?.componentPrefix || null,
          errorCode: 'USER_ABANDONED',
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }

    this.aboValues.set([]);
    this.overrideCodes.set([]);
    this.warnings.set([]);
    this.overrideNote.set('');
    this.saveCompleted.set(false);
    this.submitted.set(false);
    this.unitValidationData = null;
    this.phase1ParsedUnitId = '';
    this.fieldErrors = {};
    this.fieldProcessing = {};
    this.isDescTruncated = {};
    this.lastSaveRequest = null;
    this.processLabelResult.set(null);
    this.labelProcessed.set(false);
    this.verified.set(false);
    this.verifiedUnitId.set('');
    this.phase.set('init');
    this.selectedEmergencyLabel.set('');
    this.scannedAboDescription.set('');
    this.selectedProductDescription.set('');
    this.verifyProductDescription.set('');
    this.selectedOverrideDescription.set('');
    this.verificationForm?.reset();
    this.disableVerificationFields();
    this.row1ProductCodeField?.clear();
    this.emergencyLabelField?.clear();
    this.overrideCodeField?.clear();
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
    if (this.verifyUnitIdField) {
      this.verifyUnitIdField.clear();
    }
    this.cdr.markForCheck();
  }

  private openWarningOverlay(
    title: string,
    warnings: { code: string; message: string }[],
    onProceed: () => void,
  ): void {
    this.warningDialogTitle.set(title);
    this.warningDialogWarnings.set(warnings);
    this.warningDialogCallback = onProceed;
    this.showWarningDialog.set(true);
    this.cdr.markForCheck();
  }

  onWarningProceed(): void {
    this.showWarningDialog.set(false);
    if (this.warningDialogCallback) {
      this.warningDialogCallback();
      this.warningDialogCallback = null;
    }
  }

  onWarningCancel(): void {
    this.showWarningDialog.set(false);
    this.warningDialogCallback = null;
  }

  private showError(err: any): void {
    const errResp = err?.error?.errorResponse;
    const msg =
      errResp?.errorCode && errResp?.error
        ? `Error ${errResp.errorCode}: ${errResp.error}`
        : err?.error?.message;
    this.snackbarService.showError(msg);
  }
}
