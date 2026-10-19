import { Component, ElementRef, OnInit, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Observable, Subject, map, of, takeUntil } from 'rxjs';
import { PageHeaderWithBreadcrumb } from '../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '../../../shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '../../../shared/services/header.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { SCAN_PATTERNS, matchesScanPattern } from '@shared/utils/scan-pattern.util';
import { UnitIdFieldComponent, UnitIdPostValidateEvent, UnitValidationResponse } from '../../../shared/components/unit-id-field';
import { ScanSelectFieldComponent } from '../../../shared/components/scan-select-field/scan-select-field.component';
import { ScanSelectOption } from '../../../shared/components/scan-select-field/scan-select-field.model';
import { DonorLibLabelScanService } from '../../../shared/services/donor-lib-label-scan.service';
import { ReprintLabelsService } from './services/reprint-labels.service';
import {
  ScreenPhase,
  LabelTypeOption,
  ProcessLabelResponse,
  UnitComponent,
  WarningDto,
} from './models/reprint-labels.model';

interface WarningOverrideDialogData {
  title: string;
  warnings: WarningDto[];
  allowOverride: boolean;
}

interface WarningOverrideDialogResult {
  override: boolean;
  codes: string[];
}

@Component({
  selector: 'app-reprint-labels',
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
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
  ],
  templateUrl: './reprint-labels.component.html',
  styleUrls: ['./reprint-labels.component.scss'],
})
export class ReprintLabelsComponent implements OnInit, OnDestroy {
  private readonly service = inject(ReprintLabelsService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  protected readonly SCAN_PATTERNS = SCAN_PATTERNS;

  // Page header (static — matches ABO Labeling pattern)
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Reprint labels', link: null },
    ],
  };

  // Phase state machine
  phase = signal<ScreenPhase>('ready');
  loading = signal(false);
  currentPrinterName = signal<string>('Not configured');
  verifyFieldsDisabled = signal(true);

  // Label type LOV
  labelTypeOptions = signal<LabelTypeOption[]>([]);
  labelTypeControl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  labelTypeDescription = signal('');

  // Unit data (Phase 1)
  unitData = signal<{ unitId: string; parsedUnitId: string; collDate: string; donorDecisionCode: string | null; systemLabelDecision: string | null; contractId: string | null; codeScheme: string | null } | null>(null);
  unitCodeScheme = signal<string>('I');

  get codeScheme(): string {
    return this.unitCodeScheme();
  }

  // Product code options (shared by Phase 1 and Phase 2)
  productCodeOptions = signal<ScanSelectOption[]>([]);
  row1ProductCodeDisabled = computed(() => this.unitData() === null);

  // Verification LOVs (Phase 2)
  aboLovOptions = signal<ScanSelectOption[]>([]);
  specialTestLovOptions = signal<ScanSelectOption[]>([]);

  // --- Label-type conditional visibility (FMB navigation rules) ---

  // PPD skips combined Unit/ABO scan — goes directly to Unit ID
  readonly showScanUnitAbo = computed(() => {
    const lt = this.labelTypeControl.value;
    return lt !== 'PPD';
  });

  // PPD skips ABO verification entirely
  readonly showAboField = computed(() => {
    const lt = this.labelTypeControl.value;
    return lt !== 'PPD';
  });

  // Mf/49 labels show Collection Date; others show Expiry Date
  readonly isMfProduct = computed(() => {
    const label = this.labelResult()?.label;
    return label === 'Mf' || label === '49';
  });

  // Special testing: required only when specialTestingCode exists AND not PCA
  readonly showSpecialTesting = computed(() => {
    const result = this.labelResult();
    if (!result) return false;
    return result.requiresSpecialTesting && this.labelTypeControl.value !== 'PCA';
  });

  // PPD: after product code match → done (no expiry, no ABO, no sp test)
  readonly showDateField = computed(() => {
    const lt = this.labelTypeControl.value;
    if (lt === 'PPD') return false;
    const result = this.labelResult();
    if (!result) return true;
    // OFF/PAD/PFF with reject_reason → skip date
    if (['OFF', 'PAD', 'PFF'].includes(lt) && result.rejectReasonCode) return false;
    // No expiry and not Mf → skip
    if (!result.expiryDate && !this.isMfProduct()) return false;
    return true;
  });

  // Label result (from process-label)
  labelResult = signal<ProcessLabelResponse | null>(null);
  processLabelOverrides = signal<string[]>([]);

  selectedProductDescription = signal<string>('');
  scannedAboDescription = signal<string>('');
  verifyParsedUnitId = signal<string>('');

  // Field processing tracker
  fieldProcessing: Record<string, boolean> = {};

  get isAnyFieldProcessing(): boolean {
    return Object.values(this.fieldProcessing).some(v => v);
  }

  // Verification form — all controls start disabled, enabled when phase='labeled'
  verificationForm = new FormGroup({
    scanUnitAbo: new FormControl({ value: '', disabled: true }),
    scanUnitId: new FormControl({ value: '', disabled: true }),
    scanAbo: new FormControl({ value: '', disabled: true }),
    scanProdExp: new FormControl({ value: '', disabled: true }),
    scanProductCode: new FormControl({ value: '', disabled: true }),
    scanExpDate: new FormControl({ value: '', disabled: true }),
    scanCollDate: new FormControl({ value: '', disabled: true }),
    scanSpecialTest: new FormControl({ value: '', disabled: true }),
  });

  // ViewChild refs
  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;
  @ViewChild('verifyUnitIdField') verifyUnitIdField!: UnitIdFieldComponent;
  @ViewChild('row1ProductCodeField') row1ProductCodeField!: ScanSelectFieldComponent;
  @ViewChild('aboField') aboField!: ScanSelectFieldComponent;
  @ViewChild('specialTestField') specialTestField!: ScanSelectFieldComponent;
  @ViewChild('scanUnitAboInput') scanUnitAboInput!: ElementRef<HTMLInputElement>;
  @ViewChild('scanProdExpInput') scanProdExpInput!: ElementRef<HTMLInputElement>;

  // --- Parse functions for ScanSelectFieldComponent ---

  readonly parseRow1ProductCode = (value: string): Observable<ScanSelectOption | null> => {
    const trimmed = value?.trim()?.toUpperCase();
    if (!trimmed) return of(null);
    const match = this.productCodeOptions().find(
      o => o.code.toUpperCase() === trimmed || o.code.toUpperCase().startsWith(trimmed),
    );
    if (match) return of(match);
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
        if (res.success && res.item) {
          return { code: res.item.aboCode!, description: res.item.aboShortName ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid ABO code');
      }),
    );
  };

  readonly parseSpTest = (value: string): Observable<ScanSelectOption | null> => {
    return this.labelScanService.validateSpTestScan(value).pipe(
      map((res) => {
        if (res.success && res.item) {
          return { code: res.item.spTestCode!, description: res.item.description ?? '' };
        }
        throw new Error(res.errorResponse?.error || res.message || 'Invalid SP test code');
      }),
    );
  };

  ngOnInit(): void {
    this.loadPrinterFromStorage();
    this.loadLabelTypes();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.clearAll());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Label Type ---
  onLabelTypeChange(): void {
    const selected = this.labelTypeControl.value;
    const option = this.labelTypeOptions().find(o => o.code === selected);
    this.labelTypeDescription.set(option?.description ?? '');
    this.clearUnitAndBelow();
  }

  // --- Unit ID scan (Action 2) ---
  onUnitPostValidate(event: any): void {
    const parsedUnitId = event?.data?.parsedUnitId;
    if (!parsedUnitId) return;
    if (event.data.codeScheme) this.unitCodeScheme.set(event.data.codeScheme);

    const labelType = this.labelTypeControl.value;
    if (!labelType) {
      event.reject('Select a label type first');
      return;
    }

    this.loading.set(true);
    const detectedScheme = event.data.codeScheme || undefined;
    this.service.validateUnit({ unitId: parsedUnitId, labelType, codeScheme: detectedScheme })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (!response.success || !response.item) {
            event.reject(response.errorResponse?.error || response.message || 'Unit validation failed');
            return;
          }

          event.confirm();
          const unit = response.item;
          this.unitData.set({
            unitId: unit.unitId,
            parsedUnitId: parsedUnitId,
            collDate: unit.collDate ?? '',
            donorDecisionCode: unit.donorDecisionCode,
            systemLabelDecision: unit.systemLabelDecision,
            contractId: unit.contractId,
            codeScheme: unit.codeScheme,
          });
          this.phase.set('unit-validated');
          this.loadProductCodeOptions(unit.unitId, labelType);
          this.row1ProductCodeField?.focus();
        },
        error: () => {
          this.loading.set(false);
          event.reject('Unit validation failed');
        },
      });
  }

  // --- Product Code selection (Action 3 — triggers process-label) ---
  onRow1ProductCodeChanged(option: ScanSelectOption | null): void {
    if (!option?.code) return;
    this.selectedProductDescription.set(option.description ?? '');
    this.proceedToProcessLabel(option.code);
  }

  // --- Printer stub ---
  onChangePrinter(): void {
    this.router.navigate(
      ['/laboratory-functions/labeling-functions/common-labeling-functions/change-label-printer'],
      { queryParams: { returnUrl: '/laboratory-functions/reprint-labels' } },
    );
  }

  onClearAll(): void {
    this.clearAll();
    this.loadPrinterFromStorage();
    this.loadLabelTypes();
  }

  // --- Verification scan blur handlers (ABO labeling pattern) ---

  onAutoScan(event: Event, patterns: typeof SCAN_PATTERNS[keyof typeof SCAN_PATTERNS]): void {
    const value = (event.target as HTMLInputElement).value;
    if (matchesScanPattern(value, patterns)) {
      (event.target as HTMLInputElement).blur();
    }
  }

  onScanUnitAboBlur(): void {
    const scanValue = this.verificationForm.get('scanUnitAbo')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanUnitAbo');
    this.fieldProcessing['scanUnitAbo'] = true;

    this.labelScanService.validateUnitAboScan(scanValue, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanUnitAbo'] = false;
          if (res.success && res.item) {
            const parsedUnitId = res.item.parsedUnitId || '';
            const parsedAbo = res.item.aboCode || '';
            const displayUnitId = res.item.manualUnitId || parsedUnitId;
            this.verifyParsedUnitId.set(parsedUnitId);

            this.verificationForm.patchValue({
              scanUnitAbo: '',
              scanUnitId: displayUnitId,
              scanAbo: parsedAbo,
            });
            this.verifyUnitIdField?.setValue(displayUnitId);
            this.aboField?.setValue(parsedAbo);
            this.scannedAboDescription.set(res.item.aboDescription || '');
            this.clearFieldError('scanUnitAbo');
            this.clearFieldError('scanUnitId');
            this.clearFieldError('scanAbo');

            const expectedUnitId = (this.unitData()?.parsedUnitId || '').toUpperCase();
            const scannedUnitId = parsedUnitId.toUpperCase();
            if (scannedUnitId && expectedUnitId && scannedUnitId !== expectedUnitId) {
              this.showScanError('1508', 'This unit ID must be same as the original unit ID', 'scanUnitId');
              return;
            }

            this.tryAutoVerify();
          } else {
            this.showScanError(
              res.errorResponse?.errorCode || '6040',
              res.errorResponse?.error || res.message || 'Invalid Unit+ABO scan',
              'scanUnitAbo',
            );
          }
        },
        error: () => {
          this.fieldProcessing['scanUnitAbo'] = false;
        },
      });
  }

  onVerifyUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;
    const expectedUnitId = (this.unitData()?.parsedUnitId || '').toUpperCase();
    const scannedUnitId = (parsedUnitId || '').toUpperCase();

    if (scannedUnitId && expectedUnitId && scannedUnitId !== expectedUnitId) {
      event.reject('This unit ID must be same as the original unit ID (Error 1508)');
      return;
    }

    event.confirm();
    this.verifyParsedUnitId.set(parsedUnitId || '');
    this.verificationForm.patchValue({ scanUnitId: parsedUnitId }, { emitEvent: false });
    this.clearFieldError('scanUnitId');
  }

  onVerifyUnitValidated(_data: UnitValidationResponse): void {
    this.tryAutoVerify();
  }

  onVerifyUnitCleared(): void {
    this.verifyParsedUnitId.set('');
    this.verificationForm.patchValue({ scanUnitId: '' }, { emitEvent: false });
    this.clearFieldError('scanUnitId');
  }

  onAboFieldChanged(option: ScanSelectOption | null): void {
    if (option) {
      this.verificationForm.patchValue({ scanAbo: option.code }, { emitEvent: false });
      this.scannedAboDescription.set(option.description);
      this.clearFieldError('scanAbo');
      this.tryAutoVerify();
    }
  }

  onScanProdExpBlur(): void {
    const scanValue = this.verificationForm.get('scanProdExp')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanProdExp');
    this.fieldProcessing['scanProdExp'] = true;

    this.labelScanService.validateProductExpiryScan(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanProdExp'] = false;
          if (res.success && res.item) {
            const parsedProduct = res.item.productCode || '';
            const parsedExpiry = this.formatDateDisplay(res.item.expiryDate);

            this.verificationForm.patchValue({
              scanProdExp: '',
              scanProductCode: parsedProduct,
              scanExpDate: parsedExpiry,
            });
            this.clearFieldError('scanProdExp');
            this.clearFieldError('scanProductCode');
            this.clearFieldError('scanExpDate');

            const expectedProduct = this.labelResult()?.productCode?.toUpperCase();
            if (parsedProduct && expectedProduct && parsedProduct.toUpperCase() !== expectedProduct) {
              this.showScanError('9728', 'Product verification failed, mismatch in product codes', 'scanProductCode');
              return;
            }

            this.tryAutoVerify();
          } else {
            this.showScanError(
              res.errorResponse?.errorCode || '9710',
              res.errorResponse?.error || res.message || 'Invalid Product+Expiry scan',
              'scanProdExp',
            );
          }
        },
        error: () => {
          this.fieldProcessing['scanProdExp'] = false;
        },
      });
  }

  onScanProductCodeBlur(): void {
    const scanValue = this.verificationForm.get('scanProductCode')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanProductCode');
    this.fieldProcessing['scanProductCode'] = true;

    this.labelScanService.validateProductScan(scanValue, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanProductCode'] = false;
          if (res.success && res.item) {
            const parsedProduct = res.item.productCode || scanValue;
            this.verificationForm.patchValue({ scanProductCode: parsedProduct });
            this.clearFieldError('scanProductCode');

            const expectedProduct = this.labelResult()?.productCode?.toUpperCase();
            if (parsedProduct && expectedProduct && parsedProduct.toUpperCase() !== expectedProduct) {
              this.showScanError('9728', 'Product verification failed, mismatch in product codes', 'scanProductCode');
              return;
            }

            this.tryAutoVerify();
          } else {
            this.showScanError(res.errorResponse?.errorCode || '6035', res.errorResponse?.error || res.message || 'Invalid product code', 'scanProductCode');
          }
        },
        error: () => {
          this.fieldProcessing['scanProductCode'] = false;
        },
      });
  }

  onScanExpDateBlur(): void {
    const scanValue = this.verificationForm.get('scanExpDate')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanExpDate');
    this.fieldProcessing['scanExpDate'] = true;

    this.labelScanService.validateExpiryScan(scanValue, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanExpDate'] = false;
          if (res.success && res.item?.expiryDate) {
            const parsedExpiry = this.formatDateDisplay(res.item.expiryDate);
            this.verificationForm.patchValue({ scanExpDate: parsedExpiry }, { emitEvent: false });
            this.clearFieldError('scanExpDate');
            this.tryAutoVerify();
          } else {
            this.showScanError(
              res.errorResponse?.errorCode || '6030',
              res.errorResponse?.error || res.message || 'Invalid expiry date',
              'scanExpDate',
            );
          }
        },
        error: () => {
          this.fieldProcessing['scanExpDate'] = false;
        },
      });
  }

  onSpecialTestFieldChanged(option: ScanSelectOption | null): void {
    if (option) {
      this.verificationForm.patchValue({ scanSpecialTest: option.code }, { emitEvent: false });
      this.clearFieldError('scanSpecialTest');
      this.tryAutoVerify();
    }
  }

  // --- Private methods ---

  private loadPrinterFromStorage(): void {
    try {
      const raw = sessionStorage.getItem('labelPrinterContext');
      if (raw) {
        const ctx = JSON.parse(raw);
        this.currentPrinterName.set(ctx.labelPrinterCode || 'Not configured');
      }
    } catch {
      this.currentPrinterName.set('Not configured');
    }
  }

  private loadLabelTypes(): void {
    this.service.getLabelTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.labelTypeOptions.set(response.data);
          }
        },
      });
  }

  private loadProductCodeOptions(unitId: string, labelType: string): void {
    this.service.getComponents(unitId, labelType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const options: ScanSelectOption[] = response.data.map(c => ({
              code: c.productCode,
              description: c.productDescription ?? '',
            }));
            this.productCodeOptions.set(options);
          }
        },
      });
  }

  private enableVerificationFields(): void {
    this.verifyFieldsDisabled.set(false);
    const lt = this.labelTypeControl.value;
    const result = this.labelResult();
    const isMf = result?.label === 'Mf' || result?.label === '49';
    const hasReject = !!(result?.rejectReasonCode);

    // Enable all first
    Object.keys(this.verificationForm.controls).forEach(key => {
      this.verificationForm.get(key)?.enable({ emitEvent: false });
    });

    // FMB: SET_ITEM_PROPERTY — disable per label type (direct checks, no computed signals)
    //
    // FMB ABO.KEY-NEXT-ITEM routing determines which verify fields are used:
    //   PAD/OFF/PFF + no reject + not Mf → s_product_expdate (combined scan)
    //   PAD/OFF/PFF + reject OR Mf       → s_product_code1   (individual scan)
    //   PCA/PPD                          → s_product_code1   (individual scan)

    const needsDate = lt !== 'PPD'
      && !(['OFF', 'PAD', 'PFF'].includes(lt) && hasReject && !isMf)
      && (!!result?.expiryDate || isMf);

    // Combined product+expiry scan: only when expiry date verification is needed (not coll date, not skipped)
    const needsCombinedScan = needsDate && !isMf;

    // PPD: s_unit_abo_scan NAVIGABLE=FALSE
    if (lt === 'PPD') {
      this.verificationForm.get('scanUnitAbo')?.disable({ emitEvent: false });
    }

    // PPD: ABO not navigated to
    if (lt === 'PPD') {
      this.verificationForm.get('scanAbo')?.disable({ emitEvent: false });
    }

    // Combined scan only for PAD/OFF/PFF without reject and not Mf
    if (!needsCombinedScan) {
      this.verificationForm.get('scanProdExp')?.disable({ emitEvent: false });
    }

    // Date fields
    if (!needsDate) {
      this.verificationForm.get('scanExpDate')?.disable({ emitEvent: false });
      this.verificationForm.get('scanCollDate')?.disable({ emitEvent: false });
    }

    // FMB: special testing only reachable AFTER date verification.
    if (lt === 'PPD' || lt === 'PCA' || !result?.requiresSpecialTesting || !needsDate) {
      this.verificationForm.get('scanSpecialTest')?.disable({ emitEvent: false });
    }
  }

  private disableVerificationFields(): void {
    this.verifyFieldsDisabled.set(true);
    Object.keys(this.verificationForm.controls).forEach(key => {
      this.verificationForm.get(key)?.disable({ emitEvent: false });
    });
  }

  private loadVerificationLovs(): void {
    const result = this.labelResult();
    if (!result) return;

    const productCode = result.productCode ?? '';
    const codeScheme = result.codeScheme ?? 'I';
    const productType = result.productType ?? '';

    // ABO LOV — FMB: CTRL_BLK_2_ABO_LOV2 from VALID_ABO_VALUES
    if (productCode && codeScheme) {
      this.service.getAboLov(productCode, codeScheme)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.aboLovOptions.set(
                response.data.map(i => ({ code: i.code, description: i.description }))
              );
            }
          },
        });
    }

    // Special Testing LOV — FMB: SCAN_SP_TEST from LBL_PRODUCT_TYPE_CONFIG + MASTER_CODES
    if (productType && result.requiresSpecialTesting) {
      this.service.getSpecialTestLov(productType)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.specialTestLovOptions.set(
                response.data.map(i => ({ code: i.code, description: i.description }))
              );
            }
          },
        });
    }
  }

  private proceedToProcessLabel(productCode: string): void {
    const unit = this.unitData();
    if (!unit) return;

    this.loading.set(true);
    this.callProcessLabel(unit.unitId, this.labelTypeControl.value, productCode);
  }

  private callProcessLabel(unitId: string, labelType: string, productCode: string): void {
    const request = {
      unitId,
      labelType,
      productCode,
      overrides: this.processLabelOverrides().length > 0 ? this.processLabelOverrides() : null,
    };

    this.service.processLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (!response.success) return;
          if (!response.item) return;

          const result = response.item;

          if (result.status === 'WARNING' && result.warnings?.length) {
            this.row1ProductCodeField?.blur();
            this.showWarningDialog('Validation Warning', result.warnings, (override, codes) => {
              this.row1ProductCodeField?.blur();
              if (override) {
                this.processLabelOverrides.set([
                  ...new Set([...this.processLabelOverrides(), ...codes]),
                ]);
                this.loading.set(true);
                this.callProcessLabel(unitId, labelType, productCode);
              }
            });
            return;
          }

          this.labelResult.set(result);
          this.processLabelOverrides.set([]);
          this.phase.set('labeled');
          this.row1ProductCodeField?.blur();
          this.enableVerificationFields();
          this.loadVerificationLovs();
          this.snackbarService.showSuccess(response.message || 'Label printed successfully');
          setTimeout(() => this.scanUnitAboInput?.nativeElement?.focus());
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private tryAutoVerify(): void {
    if (this.isAnyFieldProcessing) return;

    const formValue = this.verificationForm.getRawValue();
    const unitId = formValue.scanUnitId?.trim();
    const abo = this.aboField?.currentValue?.code || formValue.scanAbo?.trim();
    const productCode = formValue.scanProductCode?.trim();
    const expDate = formValue.scanExpDate?.trim();
    const collDate = formValue.scanCollDate?.trim();
    const spTest = this.specialTestField?.currentValue?.code || formValue.scanSpecialTest?.trim();

    const result = this.labelResult();
    if (!result) return;

    // FMB exact field requirements per label type:
    // PPD: unitId + productCode → DONE
    // PCA: unitId + abo + productCode + (spTest if required) → DONE
    // PAD/OFF/PFF (no reject, not Mf): unitId + abo + productCode + expDate + (spTest if required)
    // PAD/OFF/PFF (reject, not Mf): unitId + abo + productCode → DONE
    // PAD/OFF/PFF (Mf/49): unitId + abo + productCode + collDate + (spTest if required)

    const lt = this.labelTypeControl.value;
    const isMf = result.label === 'Mf' || result.label === '49';
    const hasReject = !!result.rejectReasonCode;
    const needsAbo = lt !== 'PPD';
    const needsDate = lt !== 'PPD'
      && !(['OFF', 'PAD', 'PFF'].includes(lt) && hasReject && !isMf)
      && (!!result.expiryDate || isMf);
    const needsSpTest = result.requiresSpecialTesting && lt !== 'PCA' && lt !== 'PPD' && needsDate;

    if (!unitId) return;
    if (needsAbo && !abo) return;
    if (!productCode) return;
    if (needsDate) {
      if (isMf && !collDate) return;
      if (!isMf && !expDate) return;
    }
    if (needsSpTest && !spTest) return;

    this.doVerification(unitId, abo ?? '', productCode, expDate || collDate, spTest);
  }

  private doVerification(
    unitId: string,
    abo: string,
    productCode: string,
    expDate: string | undefined,
    spTest: string | undefined,
  ): void {
    const result = this.labelResult();
    if (!result) return;

    const expectedExpFormatted = this.formatDateDisplay(result.expiryDate);
    const expectedCollFormatted = this.formatDateDisplay(this.unitData()?.collDate ?? null);
    const scannedExpFormatted = this.formatDateDisplay(expDate ?? null);
    const scannedCollFormatted = this.formatDateDisplay(
      this.verificationForm.getRawValue().scanCollDate ?? null);

    const request = {
      unitId: this.unitData()?.unitId ?? '',
      productCode: result.productCode ?? '',
      labelType: this.labelTypeControl.value,
      expectedLabel: result.label,
      expectedExpiryDate: expectedExpFormatted,
      expectedCollDate: expectedCollFormatted,
      expectedSpecialTestingCode: result.specialTestingCode,
      identifierCode: result.identifierCode,
      codeScheme: result.codeScheme,
      scannedUnitId: this.verifyParsedUnitId() || unitId || null,
      scannedAbo: abo ?? null,
      scannedProductCode: productCode ?? null,
      scannedExpirationDate: scannedExpFormatted,
      scannedCollectionDate: scannedCollFormatted,
      scannedSpecialTestingCode: spTest ?? null,
    };

    this.service.verifyLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item?.verificationComplete) {
            this.snackbarService.showSuccess('Label verified successfully');
            this.clearForNextUnit();
          } else if (response.item?.mismatchField && response.item?.mismatchErrorCode) {
            this.showScanError(
              response.item.mismatchErrorCode,
              `Verification failed: ${response.item.mismatchField} mismatch`,
              this.mapMismatchFieldToControl(response.item.mismatchField),
            );
          }
        },
      });
  }

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
    if (control?.hasError('scanError')) {
      control.setErrors(null);
    }
  }

  private formatDateDisplay(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value.toUpperCase();
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

  private mapMismatchFieldToControl(field: string): string | undefined {
    const map: Record<string, string> = {
      unitId: 'scanUnitId',
      abo: 'scanAbo',
      productCode: 'scanProductCode',
      date: 'scanExpDate',
      specialTesting: 'scanSpecialTest',
    };
    return map[field];
  }

  private showWarningDialog(
    title: string,
    warnings: WarningDto[],
    callback: (override: boolean, codes: string[]) => void,
  ): void {
    import(
      '../component-labeling/abo-labeling-isbt/components/expired-product-warning-dialog/expired-product-warning-dialog.component'
    ).then(m => {
      const dialogData: WarningOverrideDialogData = {
        title,
        warnings,
        allowOverride: true,
      };

      const dialogRef = this.dialog.open(m.ExpiredProductWarningDialogComponent, {
        width: '560px',
        disableClose: true,
        data: dialogData,
      });

      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((result: WarningOverrideDialogResult | null) => {
          if (result) {
            callback(result.override, result.codes);
          } else {
            callback(false, []);
          }
        });
    });
  }

  private clearAll(): void {
    this.labelTypeControl.reset();
    this.labelTypeDescription.set('');
    this.clearUnitAndBelow();
    this.loadLabelTypes();
  }

  private clearUnitAndBelow(): void {
    this.unitData.set(null);
    this.productCodeOptions.set([]);
    this.aboLovOptions.set([]);
    this.specialTestLovOptions.set([]);
    this.labelResult.set(null);
    this.processLabelOverrides.set([]);
    this.selectedProductDescription.set('');
    this.scannedAboDescription.set('');
    this.verifyParsedUnitId.set('');
    this.fieldProcessing = {};
    this.verificationForm.reset();
    this.disableVerificationFields();
    this.phase.set('ready');
    if (this.unitIdField) this.unitIdField.clear();
    if (this.verifyUnitIdField) this.verifyUnitIdField.clear();
    if (this.row1ProductCodeField) this.row1ProductCodeField.clear();
    if (this.aboField) this.aboField.clear();
    if (this.specialTestField) this.specialTestField.clear();
  }

  private clearForNextUnit(): void {
    this.unitData.set(null);
    this.productCodeOptions.set([]);
    this.aboLovOptions.set([]);
    this.specialTestLovOptions.set([]);
    this.labelResult.set(null);
    this.processLabelOverrides.set([]);
    this.selectedProductDescription.set('');
    this.scannedAboDescription.set('');
    this.verifyParsedUnitId.set('');
    this.fieldProcessing = {};
    this.verificationForm.reset();
    this.disableVerificationFields();
    this.phase.set('ready');
    if (this.unitIdField) {
      this.unitIdField.clear();
      this.unitIdField.focus();
    }
    if (this.verifyUnitIdField) this.verifyUnitIdField.clear();
    if (this.row1ProductCodeField) this.row1ProductCodeField.clear();
    if (this.aboField) this.aboField.clear();
    if (this.specialTestField) this.specialTestField.clear();
  }
}
