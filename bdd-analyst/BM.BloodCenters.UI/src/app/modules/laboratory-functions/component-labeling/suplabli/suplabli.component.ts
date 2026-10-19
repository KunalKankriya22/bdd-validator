import { Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable, Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ScanSelectFieldComponent, ScanSelectOption } from '@shared/components/scan-select-field';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { SuplabliApiService } from './services/suplabli-api.service';
import {
  AbandonedLabelRequest,
  BloodTypeDisplay,
  ChapterConfigResponse,
  ComponentDto,
  ConfirmVerificationRequest,
  LovOption,
  PrinterConfigResponse,
  ProcessLabelRequest,
  ProcessLabelResponse,
  ValidateUnitResponse,
} from './models/suplabli.model';
import {
  ExpiredProductWarningDialogComponent,
  WarningOverrideDialogData,
  WarningOverrideDialogResult,
  WarningDto,
} from './components/expired-product-warning-dialog/expired-product-warning-dialog.component';

type ScreenPhase = 'init' | 'ready' | 'unit-validated' | 'labeled' | 'verifying';

@Component({
  selector: 'app-suplabli',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    ScanSelectFieldComponent,
  ],
  templateUrl: './suplabli.component.html',
  styleUrls: ['./suplabli.component.scss'],
})
export class SuplabliComponent implements OnInit, OnDestroy {
  @ViewChild('primaryUnitIdField') unitIdField!: UnitIdFieldComponent;
  @ViewChild('verifyUnitIdField') verifyUnitIdField!: UnitIdFieldComponent;
  @ViewChild('row1ProductCodeField') row1ProductCodeField!: ScanSelectFieldComponent;
  @ViewChild('aboField') aboField!: ScanSelectFieldComponent;
  @ViewChild('productCodeField') productCodeField!: ScanSelectFieldComponent;
  @ViewChild('specialTestField') specialTestField!: ScanSelectFieldComponent;
  @ViewChild('scanUnitAboInput') scanUnitAboInput!: ElementRef<HTMLInputElement>;
  @ViewChild('scanProdExpInput') scanProdExpInput!: ElementRef<HTMLInputElement>;
  @ViewChild('scanCollDateInput') scanCollDateInput!: ElementRef<HTMLInputElement>;

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(SuplabliApiService);
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private clearing = false;

  phase = signal<ScreenPhase>('init');
  loading = signal(false);

  printerConfig = signal<PrinterConfigResponse | null>(null);
  chapterConfig = signal<ChapterConfigResponse | null>(null);
  unitData = signal<ValidateUnitResponse | null>(null);
  phase1ParsedUnitId = signal<string>('');
  verifyParsedUnitId = signal<string>('');
  labelResult = signal<ProcessLabelResponse | null>(null);
  selectedComponent = signal<ComponentDto | null>(null);
  processLabelOverrides = signal<string[]>([]);
  aboLovOptions = signal<ScanSelectOption[]>([]);
  specialTestLovOptions = signal<ScanSelectOption[]>([]);
  scannedAboDescription = signal<string>('');
  doLabelCalled = signal(false);
  isSecondScan = signal(false);
  firstScanCompleted = signal(false);

  private static readonly LABEL_DISPLAY_MAP: Record<string, string> = {
    Mq: 'HOLD',
    Mb: 'BIO',
    Md: 'DISC',
    Mf: 'MFG',
  };

  bloodTypeDisplay = computed<BloodTypeDisplay | null>(() => {
    const result = this.labelResult();
    if (!result) return null;

    const useSecond = this.isSecondScan() && result.secondLabelDecision;
    const decision = useSecond ? result.secondLabelDecision! : result.labelDecision;
    const decisionDisplay = useSecond
      ? (result.secondLabelDecisionDisplay || result.secondLabelDecision!)
      : result.labelDecisionDisplay;

    const mapped = SuplabliComponent.LABEL_DISPLAY_MAP[decision];
    const isSpecialCode = !!mapped;
    const isDirectedBio = result.identifierCode === 'DB';
    const showIntendedUse = !isSpecialCode || isDirectedBio;
    return {
      labelDecision: decision,
      labelDecisionDisplay: mapped || decisionDisplay,
      rhDisplay: isSpecialCode ? '' : (useSecond ? (result.secondRhDisplay || result.rhDisplay) : result.rhDisplay),
      intendedUse: showIntendedUse ? (useSecond ? (result.secondIntendedUse || result.intendedUse) : result.intendedUse) : '',
    };
  });

  row1ProductCodeDisabled = computed(() => {
    return this.phase() === 'init' || this.phase() === 'ready';
  });

  row1ProductCodeOptions = signal<ScanSelectOption[]>([]);

  isMfOrRplFlow = computed(() => {
    const result = this.labelResult();
    if (!result) return false;
    return result.labelDecision === 'Mf' ||
      result.productType === 'RPL' ||
      result.productType === 'RPFF';
  });

  isVerificationStarted = computed(() => {
    if (!this.verificationForm) return false;
    const raw = this.verificationForm.getRawValue();
    return !!(raw.scanUnitId?.trim() || raw.scanAbo?.trim() || raw.scanProductCode?.trim());
  });

  reprintDisabled = computed(() => {
    return this.phase() !== 'labeled' || this.loading() || this.isVerificationStarted();
  });

  verificationForm!: FormGroup;
  fieldErrors: Record<string, string> = {};
  fieldProcessing: Record<string, boolean> = {};

  get isAnyFieldProcessing(): boolean {
    return Object.values(this.fieldProcessing).some((v) => v);
  }

  private get codeScheme(): string {
    return this.chapterConfig()?.unitScheme === 'C' ? 'C' : 'I';
  }

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'ABO Labeling - ISBT - Super', link: null },
    ],
  };

  ngOnInit(): void {
    this.initVerificationForm();
    this.subscribeToChapterChanges();
    this.initScreen();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initVerificationForm(): void {
    this.verificationForm = this.fb.group({
      scanUnitAbo: [{ value: '', disabled: true }],
      scanUnitId: [{ value: '', disabled: true }],
      scanAbo: [{ value: '', disabled: true }],
      scanProdExp: [{ value: '', disabled: true }],
      scanProductCode: [{ value: '', disabled: true }],
      scanExpDate: [{ value: '', disabled: true }],
      scanCollDate: [{ value: '', disabled: true }],
      colldate: [{ value: '', disabled: true }],
      scanSpecialTest: [{ value: '', disabled: true }],
    });
  }

  private enableVerificationFields(): void {
    Object.keys(this.verificationForm.controls).forEach((key) => {
      this.verificationForm.get(key)?.enable();
    });
    if (!this.labelResult()?.specialTestingCode) {
      this.verificationForm.get('scanSpecialTest')?.disable();
    }
    if (this.isMfOrRplFlow()) {
      this.verificationForm.get('scanExpDate')?.disable();
      this.verificationForm.get('scanProdExp')?.disable();
    } else {
      this.verificationForm.get('scanCollDate')?.disable();
      this.verificationForm.get('colldate')?.disable();
    }
  }

  private disableVerificationFields(): void {
    Object.keys(this.verificationForm.controls).forEach((key) => {
      this.verificationForm.get(key)?.disable();
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.initScreen();
      });
  }

  private initScreen(): void {
    this.phase.set('init');
    this.loading.set(true);

    this.service.getPrinterConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success || !response.item?.configured) {
            this.loading.set(false);
            this.snackbarService.showError('No label printer configured. Please set up a printer first.');
            return;
          }
          this.printerConfig.set(response.item);
          this.loadChapterConfig();
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private loadChapterConfig(): void {
    this.service.validateAccess()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success && response.item) {
            this.chapterConfig.set(response.item);
            this.phase.set('ready');
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private loadLovData(): void {
    this.service.getLovAboValues('I')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.item) {
            this.aboLovOptions.set(res.item.map((o: LovOption) => ({ code: o.code, description: o.description })));
          }
        },
        error: () => this.snackbarService.showError('Failed to load ABO values'),
      });

    if (this.labelResult()?.specialTestingCode) {
      this.service.getLovSpecialTestCodes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.success && res.item) {
              this.specialTestLovOptions.set(res.item.map((o: LovOption) => ({ code: o.code, description: o.description })));
            }
          },
          error: () => this.snackbarService.showError('Failed to load special test codes'),
        });
    }
  }

  // ─── Phase 1: Unit Scan ───

  private unitValidating = false;

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    if (this.unitValidating) return;
    this.unitValidating = true;

    this.service.validateUnit({ unitId: event.data.parsedUnitId!, isAntigenMode: false })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success || !response.item) {
            this.unitValidating = false;
            event.reject(response.errorResponse?.message || response.message || 'Unit validation failed');
            return;
          }

          const unitData = response.item;
          if (!unitData.components.length) {
            this.unitValidating = false;
            event.reject('No labelable component found');
            return;
          }

          this.unitValidating = false;
          this.phase1ParsedUnitId.set(event.data.parsedUnitId || '');
          this.unitData.set(unitData);
          this.row1ProductCodeOptions.set(
            unitData.components.map((comp: ComponentDto) => ({
              code: comp.productCode,
              description: comp.productDescription ?? '',
            })),
          );
          event.confirm();
          this.phase.set('unit-validated');
        },
        error: () => {
          this.unitValidating = false;
          event.reject('Unit validation failed');
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {}

  onUnitCleared(): void {
    this.clearAll();
    if (this.printerConfig() && this.chapterConfig()) {
      this.phase.set('ready');
    }
  }

  // ─── Phase 2: Verify Unit ID (shared component) ───

  onVerifyUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId || '';
    const manualUnitId = event.data.manualUnitId || parsedUnitId;
    this.verifyParsedUnitId.set(parsedUnitId);

    this.verificationForm.patchValue({ scanUnitId: manualUnitId }, { emitEvent: false });
    this.clearFieldError('scanUnitId');

    const expectedUnitId = this.phase1ParsedUnitId().toUpperCase();
    const scannedUnitId = parsedUnitId.toUpperCase();
    if (scannedUnitId && expectedUnitId && scannedUnitId !== expectedUnitId) {
      event.reject('Unit ID does not match (Error 1508).');
      this.showScanError('1508', 'This unit ID must be same as the original unit ID');
      return;
    }

    event.confirm();
  }

  onVerifyUnitValidated(_data: UnitValidationResponse): void {
    this.tryAutoVerify();
  }

  onVerifyUnitCleared(): void {
    this.verificationForm.patchValue({ scanUnitId: '' }, { emitEvent: false });
    this.clearFieldError('scanUnitId');
  }

  // ─── Scan-Select Fields (ABO, Product Code, Special Testing) ───

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

  onAboFieldChanged(option: ScanSelectOption | null): void {
    this.verificationForm.patchValue({ scanAbo: option?.code ?? '' }, { emitEvent: false });
    this.clearFieldError('scanAbo');
    this.scannedAboDescription.set(option?.description ?? '');
    if (option) {
      const expectedAbo = this.labelResult()?.labelDecision?.toUpperCase();
      if (expectedAbo && option.code.toUpperCase() !== expectedAbo) {
        this.showScanError('1509', 'ABO label must be same as system label decision', 'scanAbo');
        this.aboField?.setError(`ABO does not match. Expected: ${this.labelResult()?.labelDecision}`);
        this.scannedAboDescription.set('');
        return;
      }
    }
    this.tryAutoVerify();
  }

  onAboFieldCleared(): void {
    this.verificationForm.patchValue({ scanAbo: '' }, { emitEvent: false });
    this.clearFieldError('scanAbo');
    this.scannedAboDescription.set('');
  }

  onProductCodeFieldChanged(option: ScanSelectOption | null): void {
    this.verificationForm.patchValue({ scanProductCode: option?.code ?? '' }, { emitEvent: false });
    this.clearFieldError('scanProductCode');
    if (option) {
      const expectedProduct = this.selectedComponent()?.productCode?.toUpperCase();
      if (expectedProduct && option.code.toUpperCase() !== expectedProduct) {
        this.showScanError('9728', 'Product verification failed, mismatch in product codes', 'scanProductCode');
        this.productCodeField?.setError('Product Code does not match');
        return;
      }
    }
    this.tryAutoVerify();
  }

  onProductCodeFieldCleared(): void {
    this.verificationForm.patchValue({ scanProductCode: '' }, { emitEvent: false });
    this.clearFieldError('scanProductCode');
  }

  onSpecialTestFieldChanged(option: ScanSelectOption | null): void {
    this.verificationForm.patchValue({ scanSpecialTest: option?.code ?? '' }, { emitEvent: false });
    this.clearFieldError('scanSpecialTest');
    if (option) {
      const expectedSpTest = this.labelResult()?.specialTestingCode?.toUpperCase();
      if (expectedSpTest && option.code.toUpperCase() !== expectedSpTest) {
        this.showScanError('4300', 'Special Testing code does not match', 'scanSpecialTest');
        this.specialTestField?.setError('Special Testing code does not match');
        return;
      }
    }
    this.tryAutoVerify();
  }

  onSpecialTestFieldCleared(): void {
    this.verificationForm.patchValue({ scanSpecialTest: '' }, { emitEvent: false });
    this.clearFieldError('scanSpecialTest');
  }

  onProductCodeChange(component: ComponentDto): void {
    this.selectedComponent.set(component);
    this.proceedToProcessLabel();
  }

  onRow1ProductCodeChanged(option: ScanSelectOption | null): void {
    if (!option) return;
    const match = this.unitData()?.components.find(
      (c) => c.productCode.toUpperCase() === option.code.toUpperCase(),
    );
    if (match) {
      this.selectedComponent.set(match);
      this.proceedToProcessLabel();
    }
  }

  private processingLabel = false;

  private proceedToProcessLabel(): void {
    const unit = this.unitData();
    const component = this.selectedComponent();
    if (!unit || !component) return;
    if (this.processingLabel) return;

    this.processingLabel = true;
    this.loading.set(true);
    this.callProcessLabel();
  }

  private callProcessLabel(): void {
    const unit = this.unitData()!;
    const component = this.selectedComponent()!;

    const request: ProcessLabelRequest = {
      unitId: unit.unitId,
      collDate: unit.collDate,
      productCode: component.productCode,
      componentPrefix: component.componentPrefix,
      antigenSelections: null,
      overrides: this.processLabelOverrides().length > 0 ? this.processLabelOverrides() : null,
    };

    this.service.processLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (!response.success || !response.item) return;

          const result = response.item;
          if (result.isWarning && result.warningCode) {
            const warnings: WarningDto[] = [{ code: result.warningCode, message: result.warningMessage || 'Warning' }];
            this.showWarningDialog('Label Processing Warning', warnings, (override, codes) => {
              if (override) {
                this.processLabelOverrides.set([...new Set([...this.processLabelOverrides(), ...codes])]);
                this.loading.set(true);
                this.callProcessLabel();
              } else {
                this.processingLabel = false;
              }
            });
            return;
          }

          if (result.productType?.startsWith('DU')) {
            this.processingLabel = false;
            this.snackbarService.showError('1527: This product type cannot be labeled through this screen.');
            return;
          }

          this.processingLabel = false;
          this.doLabelCalled.set(true);
          this.labelResult.set(result);
          this.phase.set('labeled');
          this.enableVerificationFields();
          this.loadLovData();
          setTimeout(() => this.scanUnitAboInput?.nativeElement?.focus());
        },
        error: () => {
          this.processingLabel = false;
          this.loading.set(false);
        },
      });
  }

  private showWarningDialog(
    title: string,
    warnings: WarningDto[],
    callback: (override: boolean, codes: string[]) => void,
  ): void {
    const dialogData: WarningOverrideDialogData = {
      title,
      warnings,
      allowOverride: true,
    };

    const dialogRef = this.dialog.open(ExpiredProductWarningDialogComponent, {
      width: '560px',
      disableClose: true,
      restoreFocus: false,
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
  }

  // ─── Reprint ───

  onReprint(): void {
    const unit = this.unitData();
    const component = this.selectedComponent();
    const result = this.labelResult();
    if (!unit || !component || !result) return;

    if (this.isVerificationStarted()) {
      this.snackbarService.showError('5308: Cannot reprint while verification is in progress.');
      return;
    }

    this.loading.set(true);
    this.service.reprint({
      unitId: unit.unitId,
      collDate: unit.collDate,
      productCode: component.productCode,
      componentPrefix: component.componentPrefix,
      labelDecision: result.labelDecision,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.snackbarService.showSuccess('Label reprinted successfully.');
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  // ─── Phase 2: Verification (using shared DonorLibLabelScanService) ───

  private showScanError(errorCode: string, message: string, controlName?: string): void {
    this.snackbarService.showError(`${errorCode}: ${message}`);
    if (controlName) {
      this.fieldErrors[controlName] = message;
      const control = this.verificationForm.get(controlName);
      control?.setErrors({ scanError: true });
      control?.markAsTouched();
    }
  }

  private focusNextScanField(): void {
    setTimeout(() => {
      if (this.isMfOrRplFlow()) {
        this.scanCollDateInput?.nativeElement?.focus();
      } else {
        this.scanProdExpInput?.nativeElement?.focus();
      }
    });
  }

  private clearFieldError(controlName: string): void {
    this.fieldErrors[controlName] = '';
    const control = this.verificationForm.get(controlName);
    if (control) {
      control.setErrors(null);
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
            this.verifyParsedUnitId.set(parsedUnitId);

            const displayUnitId = res.item.manualUnitId || parsedUnitId;
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

            const expectedUnitId = this.phase1ParsedUnitId().toUpperCase();
            const scannedUnitId = parsedUnitId.toUpperCase();
            if (scannedUnitId && expectedUnitId && scannedUnitId !== expectedUnitId) {
              this.showScanError('1508', 'This unit ID must be same as the original unit ID', 'scanUnitId');
              return;
            }

            const expectedAbo = this.labelResult()?.labelDecision?.toUpperCase();
            if (parsedAbo && expectedAbo && parsedAbo.toUpperCase() !== expectedAbo) {
              this.showScanError('1509', 'ABO label must be same as system label decision', 'scanAbo');
              return;
            }

            this.focusNextScanField();
            this.tryAutoVerify();
          } else {
            this.showScanError(res.errorResponse?.errorCode || '6040', res.errorResponse?.error || res.message || 'Invalid Unit+ABO scan', 'scanUnitAbo');
          }
        },
        error: () => {
          this.fieldProcessing['scanUnitAbo'] = false;
        },
      });
  }

  onScanUnitIdBlur(): void {
    const scanValue = this.verificationForm.get('scanUnitId')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanUnitId');
    this.fieldProcessing['scanUnitId'] = true;

    this.labelScanService.validateUnitScan(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanUnitId'] = false;
          if (res.success && res.item) {
            const parsedUnitId = res.item.parsedUnitId || scanValue;
            this.verifyParsedUnitId.set(res.item.parsedUnitId || '');
            this.verificationForm.patchValue({
              scanUnitId: res.item.manualUnitId || parsedUnitId,
            }, { emitEvent: false });
            this.clearFieldError('scanUnitId');

            const expectedUnitId = this.phase1ParsedUnitId().toUpperCase();
            const scannedUnitId = parsedUnitId.toUpperCase();
            if (scannedUnitId && expectedUnitId && scannedUnitId !== expectedUnitId) {
              this.showScanError('1508', 'This unit ID must be same as the original unit ID', 'scanUnitId');
              return;
            }

            this.tryAutoVerify();
          } else {
            this.showScanError(res.errorResponse?.errorCode || '1230', res.errorResponse?.error || res.message || 'Invalid Unit ID', 'scanUnitId');
          }
        },
        error: () => {
          this.fieldProcessing['scanUnitId'] = false;
        },
      });
  }

  onScanAboBlur(): void {
    const scanValue = this.verificationForm.get('scanAbo')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanAbo');
    this.fieldProcessing['scanAbo'] = true;

    this.labelScanService.validateAboScan(scanValue, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanAbo'] = false;
          if (res.success && res.item) {
            const parsedAbo = res.item.aboCode || scanValue;
            this.verificationForm.patchValue({ scanAbo: parsedAbo }, { emitEvent: false });
            this.scannedAboDescription.set(res.item.aboShortName || '');
            this.clearFieldError('scanAbo');

            const expectedAbo = this.labelResult()?.labelDecision?.toUpperCase();
            if (parsedAbo && expectedAbo && parsedAbo.toUpperCase() !== expectedAbo) {
              this.showScanError('1509', 'ABO label must be same as system label decision', 'scanAbo');
              return;
            }

            this.tryAutoVerify();
          } else {
            this.showScanError(res.errorResponse?.errorCode || '6010', res.errorResponse?.error || res.message || 'Invalid ABO code', 'scanAbo');
          }
        },
        error: () => {
          this.fieldProcessing['scanAbo'] = false;
        },
      });
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
            const parsedExpiry = this.formatExpiryDisplay(res.item.expiryDate);

            this.verificationForm.patchValue({
              scanProdExp: '',
              scanProductCode: parsedProduct,
              scanExpDate: parsedExpiry,
            });
            this.productCodeField?.setValue(parsedProduct);
            this.clearFieldError('scanProdExp');
            this.clearFieldError('scanProductCode');
            this.clearFieldError('scanExpDate');

            const expectedProduct = (this.labelResult()?.labelProductCode ?? this.selectedComponent()?.productCode)?.toUpperCase();
            if (parsedProduct && expectedProduct && parsedProduct.toUpperCase() !== expectedProduct) {
              this.showScanError('9728', 'Product verification failed, mismatch in product codes', 'scanProductCode');
              return;
            }

            this.tryAutoVerify();
          } else {
            this.showScanError(res.errorResponse?.errorCode || '9710', res.errorResponse?.error || res.message || 'Invalid Product+Expiry scan', 'scanProdExp');
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

            const expectedProduct = (this.labelResult()?.labelProductCode ?? this.selectedComponent()?.productCode)?.toUpperCase();
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
            const parsedExpiry = this.formatExpiryDisplay(res.item.expiryDate);
            this.verificationForm.patchValue({ scanExpDate: parsedExpiry }, { emitEvent: false });
            this.clearFieldError('scanExpDate');
            this.tryAutoVerify();
          } else {
            const code = res.errorResponse?.errorCode || '6030';
            const msg = res.errorResponse?.error || res.message || 'Invalid expiry date';
            this.snackbarService.showError(`${code}: ${msg}`);
            this.fieldErrors['scanExpDate'] = msg;
            const control = this.verificationForm.get('scanExpDate');
            control?.setErrors({ scanError: true });
            control?.markAsTouched();
          }
        },
        error: () => {
          this.fieldProcessing['scanExpDate'] = false;
        },
      });
  }

  onScanCollDateBlur(): void {
    const scanValue = this.verificationForm.get('scanCollDate')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanCollDate');
    this.fieldProcessing['scanCollDate'] = true;

    this.labelScanService.validateExpiryScan(scanValue, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanCollDate'] = false;
          if (res.success && res.item?.expiryDate) {
            const parsedCollDate = this.formatCollDateDisplay(res.item.expiryDate);
            this.verificationForm.patchValue({
              scanCollDate: '',
              colldate: parsedCollDate,
            });
            this.clearFieldError('scanCollDate');
            this.clearFieldError('colldate');
            this.tryAutoVerify();
          } else {
            this.showScanError(
              res.errorResponse?.errorCode || '1210',
              res.errorResponse?.error || res.message || 'Invalid collection date scan',
              'scanCollDate',
            );
          }
        },
        error: () => {
          this.fieldProcessing['scanCollDate'] = false;
        },
      });
  }

  onCollDateBlur(): void {
    const scanValue = this.verificationForm.get('colldate')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('colldate');

    const expectedCollDate = this.formatCollDateDisplay(this.unitData()?.collDate || '');
    if (scanValue.toUpperCase() !== expectedCollDate.toUpperCase()) {
      this.showScanError('1145', 'Collection date does not match', 'colldate');
      return;
    }
    this.tryAutoVerify();
  }

  onScanSpecialTestBlur(): void {
    const scanValue = this.verificationForm.get('scanSpecialTest')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanSpecialTest');
    this.fieldProcessing['scanSpecialTest'] = true;

    this.labelScanService.validateSpTestScan(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanSpecialTest'] = false;
          if (res.success && res.item) {
            const parsedSpTest = res.item.spTestCode || scanValue;
            this.verificationForm.patchValue({ scanSpecialTest: parsedSpTest });
            this.clearFieldError('scanSpecialTest');

            const expectedSpTest = this.labelResult()?.specialTestingCode?.toUpperCase();
            if (parsedSpTest && expectedSpTest && parsedSpTest.toUpperCase() !== expectedSpTest) {
              this.showScanError('4300', 'Invalid Special Testing Code', 'scanSpecialTest');
              return;
            }

            this.tryAutoVerify();
          } else {
            this.showScanError(res.errorResponse?.errorCode || '4327', res.errorResponse?.error || res.message || 'Invalid SP test code', 'scanSpecialTest');
          }
        },
        error: () => {
          this.fieldProcessing['scanSpecialTest'] = false;
        },
      });
  }

  private tryAutoVerify(): void {
    if (this.isAnyFieldProcessing) return;

    const formValue = this.verificationForm.getRawValue();
    const unitId = formValue.scanUnitId?.trim();
    const abo = formValue.scanAbo?.trim();
    const productCode = formValue.scanProductCode?.trim();
    const expDate = formValue.scanExpDate?.trim();
    const colldate = formValue.colldate?.trim();
    const spTest = formValue.scanSpecialTest?.trim();

    if (!unitId || !abo || !productCode) return;

    const result = this.labelResult();
    if (!result) return;

    if (this.isMfOrRplFlow()) {
      if (!colldate) return;
    } else {
      if (result.expiryDate && !expDate) return;
    }
    if (result.specialTestingCode && !spTest) return;

    this.doVerificationComparison();
  }

  private stripCheckDigit(value: string): string {
    if (!value) return '';
    const dashIndex = value.lastIndexOf('-');
    return dashIndex > 0 ? value.substring(0, dashIndex) : value;
  }

  private doVerificationComparison(): void {
    const formValue = this.verificationForm.getRawValue();
    const result = this.labelResult();
    const unit = this.unitData();
    if (!result || !unit) return;

    const scannedUnitId = (this.verifyParsedUnitId() || formValue.scanUnitId?.trim() || '').toUpperCase();
    const expectedUnitId = this.phase1ParsedUnitId().toUpperCase();
    if (scannedUnitId !== expectedUnitId) {
      this.showScanError('1508', 'This unit ID must be same as the original unit ID', 'scanUnitId');
      return;
    }

    const scannedAbo = formValue.scanAbo?.trim().toUpperCase();
    const expectedAbo = result.labelDecision?.toUpperCase();
    if (scannedAbo !== expectedAbo) {
      this.showScanError('1509', 'ABO label must be same as system label decision', 'scanAbo');
      return;
    }

    const scannedProduct = formValue.scanProductCode?.trim().toUpperCase();
    const expectedProduct = (result.labelProductCode ?? this.selectedComponent()?.productCode)?.toUpperCase();
    if (scannedProduct !== expectedProduct) {
      this.showScanError('9728', 'Product verification failed, mismatch in product codes', 'scanProductCode');
      return;
    }

    if (this.isMfOrRplFlow()) {
      const scannedCollDate = formValue.colldate?.trim();
      if (!scannedCollDate) {
        this.showScanError('1145', 'Collection date does not match', 'colldate');
        return;
      }
      const expectedCollDate = this.formatCollDateDisplay(unit.collDate || '');
      if (scannedCollDate.toUpperCase() !== expectedCollDate.toUpperCase()) {
        this.showScanError('1145', 'Collection date does not match', 'colldate');
        return;
      }
    } else if (result.expiryDate) {
      const scannedExp = formValue.scanExpDate?.trim();
      if (!scannedExp) {
        this.showScanError('1170', 'Invalid expiration date', 'scanExpDate');
        return;
      }
      if (!this.expiryDatesMatch(scannedExp, result.expiryDate)) {
        this.showScanError('1170', 'Invalid expiration date', 'scanExpDate');
        return;
      }
    }

    if (result.specialTestingCode) {
      const scannedSpTest = formValue.scanSpecialTest?.trim().toUpperCase();
      const expectedSpTest = result.specialTestingCode.toUpperCase();
      if (scannedSpTest !== expectedSpTest) {
        this.showScanError('4300', 'Invalid Special Testing Code', 'scanSpecialTest');
        return;
      }
    }

    if (result.doubleScanReqd && !this.isSecondScan()) {
      this.firstScanCompleted.set(true);
      this.isSecondScan.set(true);
      this.snackbarService.showSuccess('First label verified. Scan SECOND label now.');
      this.resetVerificationFields();
      return;
    }

    this.confirmVerification();
  }

  private confirmVerification(): void {
    const unit = this.unitData();
    const component = this.selectedComponent();
    const result = this.labelResult();
    if (!unit || !component || !result) return;

    this.loading.set(true);
    const request: ConfirmVerificationRequest = {
      unitId: unit.unitId,
      collDate: unit.collDate,
      productCode: component.productCode,
      componentPrefix: component.componentPrefix,
      labelDecision: result.labelDecision,
      expiryDate: result.expiryDate,
      identifierCode: result.identifierCode,
      testedAboCode: result.testedAboCode ?? null,
      isMfgProduct: result.labelDecision === 'Mf',
    };

    this.service.confirmVerification(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.snackbarService.showSuccess('8010: Transaction committed.');
            this.doLabelCalled.set(false);
            this.clearAll();
            this.phase.set('ready');
            setTimeout(() => this.unitIdField?.focus());
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  // ─── Clear ───

  clearAll(): void {
    if (this.clearing) return;
    this.clearing = true;

    if (this.doLabelCalled() && this.phase() !== 'init') {
      const unit = this.unitData();
      const component = this.selectedComponent();
      if (unit && component) {
        this.service.logAbandonedLabel({
          unitId: unit.unitId,
          collDate: unit.collDate,
          productCode: component.productCode,
          componentPrefix: component.componentPrefix,
          errorCode: '1506',
        }).pipe(takeUntil(this.destroy$)).subscribe();
      }
    }

    this.unitData.set(null);
    this.phase1ParsedUnitId.set('');
    this.verifyParsedUnitId.set('');
    this.labelResult.set(null);
    this.selectedComponent.set(null);
    this.processLabelOverrides.set([]);
    this.row1ProductCodeOptions.set([]);
    this.scannedAboDescription.set('');
    this.doLabelCalled.set(false);
    this.isSecondScan.set(false);
    this.firstScanCompleted.set(false);
    this.unitValidating = false;
    this.processingLabel = false;
    this.fieldErrors = {};
    this.fieldProcessing = {};
    this.verificationForm?.reset();
    this.disableVerificationFields();
    this.unitIdField?.clear();
    this.verifyUnitIdField?.clear();
    this.row1ProductCodeField?.clear();
    this.aboField?.clear();
    this.productCodeField?.clear();
    this.specialTestField?.clear();

    this.clearing = false;
  }

  private resetVerificationFields(): void {
    this.verificationForm.reset();
    this.verifyUnitIdField?.clear();
    this.aboField?.clear();
    this.productCodeField?.clear();
    this.specialTestField?.clear();
    this.fieldErrors = {};
    this.fieldProcessing = {};
    this.scannedAboDescription.set('');
    this.verifyParsedUnitId.set('');
    this.enableVerificationFields();
  }

  private expiryDatesMatch(scannedDisplay: string, expectedIso: string): boolean {
    const expected = this.formatExpiryDisplay(expectedIso)?.toUpperCase();
    const scanned = scannedDisplay.toUpperCase();
    if (scanned === expected) return true;
    if (!this.hasTimeComponent(expectedIso)) {
      const stripTime = (s: string) => s.replace(/\s+\d{2}:\d{2}$/, '');
      return stripTime(scanned) === stripTime(expected);
    }
    return false;
  }

  private hasTimeComponent(value: string): boolean {
    if (!value) return false;
    const stripped = value.replace(/[Z]$/i, '').replace(/[+-]\d{2}:\d{2}$/, '');
    if (!stripped.includes('T')) return false;
    const timePart = stripped.split('T')[1];
    if (!timePart) return false;
    const [hh, mm] = timePart.split(':').map(Number);
    return !!(hh || mm);
  }

  private parseLocalDate(value: string): Date {
    const stripped = value.replace(/[Z]$/i, '').replace(/[+-]\d{2}:\d{2}$/, '');
    const [datePart, timePart] = stripped.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    if (timePart) {
      const [hh, mm] = timePart.split(':').map(Number);
      return new Date(y, m - 1, d, hh || 0, mm || 0);
    }
    return new Date(y, m - 1, d);
  }

  private formatExpiryDisplay(value: string | null): string {
    if (!value) return '';
    const d = this.parseLocalDate(value);
    if (isNaN(d.getTime())) return value;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    const dateStr = `${day}-${mon}-${year}`;
    if (this.hasTimeComponent(value)) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${dateStr} ${hh}:${mm}`;
    }
    return dateStr;
  }

  private formatCollDateDisplay(value: string | null): string {
    if (!value) return '';
    const d = this.parseLocalDate(value);
    if (isNaN(d.getTime())) return value;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    const dateStr = `${day}-${mon}-${year}`;
    if (this.hasTimeComponent(value)) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${dateStr} ${hh}:${mm}`;
    }
    return dateStr;
  }
}
