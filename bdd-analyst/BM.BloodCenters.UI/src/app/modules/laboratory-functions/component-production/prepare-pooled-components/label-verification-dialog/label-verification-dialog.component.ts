import { Component, EventEmitter, inject, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { ValidAbo } from '../models/prepare-pooled-components.model';

export interface LabelVerificationDialogData {
  poolId: string;
  productCode: string;
  pooledAboRh: string;
  expectedAboLabel: string;
  expiryDate: string;
  isIsbt: boolean;
  hasCmvNegative: boolean;
  aboOptions: ValidAbo[];
}

@Component({
  selector: 'app-label-verification-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTooltipModule,
  ],
  templateUrl: './label-verification-dialog.component.html',
  styleUrls: ['./label-verification-dialog.component.scss'],
})
export class LabelVerificationDialogComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `label-verification-${LabelVerificationDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogData = inject<LabelVerificationDialogData>(MAT_DIALOG_DATA, { optional: true });
  private readonly dialogRef = inject<MatDialogRef<LabelVerificationDialogComponent>>(MatDialogRef, { optional: true });
  private readonly labelScanService = inject(DonorLibLabelScanService);
  private readonly destroy$ = new Subject<void>();

  @Input() poolId = '';
  @Input() productCode = '';
  @Input() pooledAboRh = '';
  @Input() expectedAboLabel = '';
  @Input() expiryDate = '';
  @Input() isIsbt = false;
  @Input() hasCmvNegative = false;
  @Input() aboOptions: ValidAbo[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() verified = new EventEmitter<{
    scannedUnitId: string;
    scannedAbo: string;
    scannedProductCode: string;
    scannedExpiryDate?: string;
    scannedSpTest?: string;
  }>();

  form!: FormGroup;
  verificationError = '';

  fieldErrors: Record<string, string> = {};
  fieldProcessing: Record<string, boolean> = {};
  filteredAboOptions: ValidAbo[] = [];
  private aboOptionJustSelected = false;

  get showSpTest(): boolean {
    return this.isIsbt && this.hasCmvNegative;
  }

  get isAnyFieldProcessing(): boolean {
    return Object.values(this.fieldProcessing).some(v => v);
  }

  private get codeScheme(): string {
    return this.isIsbt ? 'I' : 'C';
  }

  ngOnInit(): void {
    if (this.dialogData) {
      this.poolId = this.dialogData.poolId;
      this.productCode = this.dialogData.productCode;
      this.pooledAboRh = this.dialogData.pooledAboRh;
      this.expectedAboLabel = this.dialogData.expectedAboLabel;
      this.expiryDate = this.dialogData.expiryDate;
      this.isIsbt = this.dialogData.isIsbt;
      this.hasCmvNegative = this.dialogData.hasCmvNegative;
      this.aboOptions = this.dialogData.aboOptions;
    }
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      scanUnitAbo: [''],
      scanUnitId: [''],
      scanAbo: [''],
      description: [{ value: '', disabled: true }],
      scanProductCodeExpiry: [''],
      scanProductCode: [''],
      scanExpirationDate: [''],
      scanSpTest: [''],
    });

    this.filteredAboOptions = [...this.aboOptions];

    this.form.get('scanAbo')?.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredAboOptions = this.aboOptions.filter(
          (a) => (a.label || '').toLowerCase().includes(search) || a.code.toLowerCase().includes(search),
        );
      });
  }

  private setFieldError(controlName: string, message: string): void {
    this.fieldErrors[controlName] = message;
    const control = this.form.get(controlName);
    if (control) {
      control.setErrors({ serverError: true });
      control.markAsTouched();
    }
  }

  private clearFieldError(controlName: string): void {
    this.fieldErrors[controlName] = '';
    const control = this.form.get(controlName);
    if (control) {
      control.setErrors(null);
    }
  }

  onUnitAboScanBlur(): void {
    const scanValue = this.form.get('scanUnitAbo')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanUnitAbo');
    this.fieldProcessing['scanUnitAbo'] = true;

    this.labelScanService.validateUnitAboScan(scanValue, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanUnitAbo'] = false;
          if (res.success && res.item) {
            const aboCode = res.item.aboCode || '';
            const abo = this.aboOptions.find((a) => a.label === aboCode);
            this.form.patchValue({
              scanUnitAbo: '',
              scanUnitId: res.item.manualUnitId || res.item.parsedUnitId || '',
              scanAbo: aboCode,
              description: res.item.aboDescription || abo?.description || '',
            });
            this.tryAutoVerify();
          } else {
            this.setFieldError('scanUnitAbo', res.errorResponse?.error || res.message || 'Invalid Unit+ABO scan.');
          }
        },
        error: (err) => {
          this.fieldProcessing['scanUnitAbo'] = false;
          const body = err?.error;
          this.setFieldError('scanUnitAbo', body?.errorResponse?.error || body?.message || 'Failed to validate Unit+ABO scan.');
        },
      });
  }

  onProductExpdateScanBlur(): void {
    const scanValue = this.form.get('scanProductCodeExpiry')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanProductCodeExpiry');
    this.fieldProcessing['scanProductCodeExpiry'] = true;

    this.labelScanService.validateProductExpdateScan(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanProductCodeExpiry'] = false;
          if (res.success && res.item) {
            this.form.patchValue({
              scanProductCodeExpiry: '',
              scanProductCode: res.item.productCode || '',
            });
            if (res.item.expiryDate) {
              const expMoment = moment(res.item.expiryDate);
              if (expMoment.isValid()) {
                this.form.patchValue({
                  scanExpirationDate: expMoment.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`),
                });
              }
            }
            this.tryAutoVerify();
          } else {
            this.setFieldError('scanProductCodeExpiry', res.errorResponse?.error || res.message || 'Invalid Product+Expiry scan.');
          }
        },
        error: (err) => {
          this.fieldProcessing['scanProductCodeExpiry'] = false;
          const body = err?.error;
          this.setFieldError('scanProductCodeExpiry', body?.errorResponse?.error || body?.message || 'Failed to validate Product+Expiry scan.');
        },
      });
  }

  onAboScanBlur(): void {
    if (this.aboOptionJustSelected) {
      this.aboOptionJustSelected = false;
      return;
    }

    const scanValue = this.form.get('scanAbo')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanAbo');
    this.fieldProcessing['scanAbo'] = true;

    this.labelScanService.validateAboScan(scanValue, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanAbo'] = false;
          if (res.success && res.item) {
            const aboCode = res.item.aboCode || scanValue;
            const abo = this.aboOptions.find((a) => a.label === aboCode);
            this.form.patchValue({
              scanAbo: aboCode,
              description: res.item.aboShortName || abo?.description || '',
            }, { emitEvent: false });
            this.tryAutoVerify();
          } else {
            this.setFieldError('scanAbo', res.errorResponse?.error || res.message || 'Invalid ABO code.');
          }
        },
        error: (err) => {
          this.fieldProcessing['scanAbo'] = false;
          const body = err?.error;
          this.setFieldError('scanAbo', body?.errorResponse?.error || body?.message || 'Failed to validate ABO code.');
        },
      });
  }

  onAboOptionSelected(label: string): void {
    this.aboOptionJustSelected = true;
    const abo = this.aboOptions.find((a) => a.label === label);
    this.clearFieldError('scanAbo');
    this.form.patchValue({
      scanAbo: label,
      description: abo?.description || '',
    }, { emitEvent: false });
    this.tryAutoVerify();
  }

  private stripCheckDigit(value: string): string {
    if (!value) return '';
    const dashIndex = value.lastIndexOf('-');
    return dashIndex > 0 ? value.substring(0, dashIndex) : value;
  }

  private extractAboLabel(value: string): string {
    if (!value) return '';
    const dashIndex = value.indexOf(' - ');
    return dashIndex > 0 ? value.substring(0, dashIndex).trim() : value.trim();
  }

  private parseDateTimeString(value: string): moment.Moment | null {
    if (!value) return null;
    const parsed = moment(value, 'DD-MMM-YYYY HH:mm', true);
    return parsed.isValid() ? parsed : null;
  }

  onUnitIdBlur(): void {
    const scanValue = this.form.get('scanUnitId')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanUnitId');
    this.fieldProcessing['scanUnitId'] = true;

    this.labelScanService.validateUnitScan(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanUnitId'] = false;
          if (res.success && res.item) {
            this.form.patchValue({
              scanUnitId: res.item.manualUnitId || res.item.parsedUnitId || scanValue,
            }, { emitEvent: false });
            this.tryAutoVerify();
          } else {
            this.setFieldError('scanUnitId', res.errorResponse?.error || res.message || 'Invalid Unit ID.');
          }
        },
        error: (err) => {
          this.fieldProcessing['scanUnitId'] = false;
          const body = err?.error;
          this.setFieldError('scanUnitId', body?.errorResponse?.error || body?.message || 'Failed to validate Unit ID.');
        },
      });
  }

  onExpiryDateScanBlur(): void {
    const scanValue = this.form.get('scanExpirationDate')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanExpirationDate');

    const regex = /^(\d{2})-([A-Za-z]{3})-(\d{4})\s(\d{2}):(\d{2})$/;
    const match = scanValue.match(regex);
    if (!match) {
      if (scanValue.startsWith('&>') || scanValue.startsWith('=>') || /^\d{6,}$/.test(scanValue)) {
        this.fieldProcessing['scanExpirationDate'] = true;
        this.labelScanService.validateExpdateScan(scanValue, this.codeScheme)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.fieldProcessing['scanExpirationDate'] = false;
              if (res.success && res.item?.expiryDate) {
                const expMoment = moment(res.item.expiryDate);
                if (expMoment.isValid()) {
                  this.form.patchValue({
                    scanExpirationDate: expMoment.format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m) => `-${m.toUpperCase()}-`),
                  }, { emitEvent: false });
                }
                this.tryAutoVerify();
              } else {
                this.setFieldError('scanExpirationDate', res.errorResponse?.error || res.message || 'Invalid expiry date.');
              }
            },
            error: (err) => {
              this.fieldProcessing['scanExpirationDate'] = false;
              const body = err?.error;
              this.setFieldError('scanExpirationDate', body?.errorResponse?.error || body?.message || 'Failed to validate expiry date.');
            },
          });
        return;
      }

      this.form.get('scanExpirationDate')?.setErrors({ invalidFormat: true });
      this.form.get('scanExpirationDate')?.markAsTouched();
      return;
    }

    const parsed = this.parseDateTimeString(scanValue);
    if (!parsed) {
      this.form.get('scanExpirationDate')?.setErrors({ invalidDateTime: true });
      this.form.get('scanExpirationDate')?.markAsTouched();
    } else {
      this.tryAutoVerify();
    }
  }

  onProductScanBlur(): void {
    const scanValue = this.form.get('scanProductCode')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanProductCode');
    this.fieldProcessing['scanProductCode'] = true;

    this.labelScanService.validateProductScan(scanValue, this.codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanProductCode'] = false;
          if (res.success && res.item) {
            this.form.patchValue({
              scanProductCode: res.item.productCode || scanValue,
            });
            this.tryAutoVerify();
          } else {
            this.setFieldError('scanProductCode', res.errorResponse?.error || res.message || 'Invalid product code.');
          }
        },
        error: (err) => {
          this.fieldProcessing['scanProductCode'] = false;
          const body = err?.error;
          this.setFieldError('scanProductCode', body?.errorResponse?.error || body?.message || 'Failed to validate product code.');
        },
      });
  }

  onSpTestScanBlur(): void {
    const scanValue = this.form.get('scanSpTest')?.value?.trim();
    if (!scanValue) return;

    this.clearFieldError('scanSpTest');
    this.fieldProcessing['scanSpTest'] = true;

    this.labelScanService.validateSpTestScan(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.fieldProcessing['scanSpTest'] = false;
          if (res.success && res.item) {
            this.form.patchValue({
              scanSpTest: res.item.spTestCode || scanValue,
            });
            this.tryAutoVerify();
          } else {
            this.setFieldError('scanSpTest', res.errorResponse?.error || res.message || 'Invalid SP test code.');
          }
        },
        error: (err) => {
          this.fieldProcessing['scanSpTest'] = false;
          const body = err?.error;
          this.setFieldError('scanSpTest', body?.errorResponse?.error || body?.message || 'Failed to validate SP test code.');
        },
      });
  }

  private tryAutoVerify(): void {
    if (this.isAnyFieldProcessing) return;

    const formValue = this.form.getRawValue();
    const unitId = formValue.scanUnitId?.trim();
    const abo = this.extractAboLabel(formValue.scanAbo?.trim());
    const productCode = formValue.scanProductCode?.trim();
    const spTest = formValue.scanSpTest?.trim();

    if (!unitId || !abo || !productCode) return;
    if (this.showSpTest && !spTest) return;
    if (this.expiryDate && !formValue.scanExpirationDate?.trim()) return;

    const hasErrors = Object.keys(this.form.controls).some(key => {
      const control = this.form.get(key);
      return control && control.errors !== null;
    });
    if (hasErrors) return;

    this.onVerify();
  }

  onVerify(): void {
    const formValue = this.form.getRawValue();
    const scannedUnitId = formValue.scanUnitId?.trim();
    const scannedAbo = this.extractAboLabel(formValue.scanAbo?.trim());
    const scannedProductCode = formValue.scanProductCode?.trim();
    const scannedSpTest = formValue.scanSpTest?.trim();

    if (!scannedUnitId || !scannedAbo || !scannedProductCode) {
      this.verificationError = 'All verification fields are required.';
      return;
    }

    if (this.showSpTest && !scannedSpTest) {
      this.verificationError = 'SP Test is required for ISBT CMV Negative pools.';
      return;
    }

    const normalizedScannedUnit = this.stripCheckDigit(scannedUnitId).toUpperCase();
    const normalizedPoolId = this.stripCheckDigit(this.poolId.trim()).toUpperCase();
    if (normalizedScannedUnit !== normalizedPoolId) {
      this.verificationError = 'Unit ID does not match Pool ID (Error 1508).';
      return;
    }

    if (this.expectedAboLabel && this.expectedAboLabel.toUpperCase() !== 'ALL') {
      if (scannedAbo.toUpperCase() !== this.expectedAboLabel.toUpperCase()) {
        this.verificationError = `ABO does not match. Expected: ${this.expectedAboLabel} (Error 1509).`;
        return;
      }
    }

    if (scannedProductCode.toUpperCase() !== this.productCode.trim().toUpperCase()) {
      this.verificationError = 'Product Code does not match (Error 9728).';
      return;
    }

    if (this.expiryDate) {
      const scannedExpStr = formValue.scanExpirationDate?.trim();
      if (!scannedExpStr) {
        this.verificationError = 'Expiration Date is required for label verification.';
        return;
      }

      const scannedExp = this.parseDateTimeString(scannedExpStr);
      if (!scannedExp) {
        this.verificationError = 'Invalid expiration date format. Use DD-MMM-YYYY HH:mm.';
        return;
      }

      const expectedExp = moment(this.expiryDate);
      if (expectedExp.isValid() && !scannedExp.isSame(expectedExp, 'day')) {
        this.verificationError = 'Expiration Date does not match the pool expiry (Error 1170).';
        return;
      }
    }

    this.verificationError = '';
    const scannedExpStr = formValue.scanExpirationDate?.trim();
    const scannedExpiryDate = scannedExpStr
      ? this.parseDateTimeString(scannedExpStr)?.format('YYYY-MM-DDTHH:mm') || scannedExpStr
      : undefined;

    const result = {
      scannedUnitId,
      scannedAbo,
      scannedProductCode,
      scannedExpiryDate,
      scannedSpTest: scannedSpTest || undefined,
    };

    if (this.dialogRef) {
      this.dialogRef.close(result);
    } else {
      this.verified.emit(result);
    }
  }

  onClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close(null);
    } else {
      this.close.emit();
    }
  }
}
