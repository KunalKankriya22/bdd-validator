import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { UnitIdFieldService } from './unit-id-field.service';
import { UnitValidationResponse } from './unit-id-field.model';
import { UnitIdDoubleEntryHelper } from './unit-id-double-entry.helper';
import { UnitIdFormatUtility } from './unit-id-format.utility';
import { ScanPattern, matchesScanPattern } from '@shared/utils/scan-pattern.util';
import { UppercaseInputDirective } from '@shared/directives/uppercase-input.directive';

export interface UnitIdPostValidateEvent {
  data: UnitValidationResponse;
  confirm: () => void;
  reject: (errorMessage: string) => void;
}

@Component({
  selector: 'app-unit-id-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    UppercaseInputDirective
  ],
  templateUrl: './unit-id-field.component.html',
  styleUrl: './unit-id-field.component.scss'
})
export class UnitIdFieldComponent implements OnInit, OnChanges, OnDestroy {
  @Input() validateFfValue = 'N';
  @Input() ariaDescribedBy: string | null = null;
  @Input() label = 'Unit ID';
  @Input() placeholder = '';
  @Input() required = true;
  @Input() disabled = false;
  @Input() hintDefault = 'Scan or type';
  @Input() hintValid: string | null = null;
  @Input() requirePostValidation = false;
  @Input() skipDoubleEntry = false;
  @Input() allowDeferralId = false;
  @Input() showBarcodeIcon = false;
  @Input() scanPatterns: ScanPattern[] = [];
  @Input() reactive = false;

  @Output() validated = new EventEmitter<UnitValidationResponse>();
  @Output() cleared = new EventEmitter<void>();
  @Output() postValidate = new EventEmitter<UnitIdPostValidateEvent>();
  @Output() emptyEnter = new EventEmitter<void>();
  @Output() emptyBlur = new EventEmitter<void>();
  @Output() emptyTab = new EventEmitter<void>();

  @ViewChild('unitIdInput') unitIdInput!: ElementRef<HTMLInputElement>;

  readonly unitIdControl = new FormControl('');
  readonly doubleEntry = new UnitIdDoubleEntryHelper<UnitValidationResponse>();

  validationState: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';
  validationError: string | null = null;
  confirmationHint: string | null = null;

  private _parsedUnitData: UnitValidationResponse | null = null;
  private rawUnitId: string | null = null;
  private destroy$ = new Subject<void>();
  private unitIdFieldService = inject(UnitIdFieldService);

  ngOnInit(): void {
    if (this.required) {
      this.unitIdControl.addValidators(Validators.required);
      this.unitIdControl.updateValueAndValidity();
    }

    if (this.disabled) {
      this.unitIdControl.disable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      if (this.disabled) {
        this.unitIdControl.disable({ emitEvent: false });
      } else {
        this.unitIdControl.enable({ emitEvent: false });
      }
    }
  }

  constructor() {
    this.unitIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (this.doubleEntry.isPending) return;
        if (this.validationState !== 'idle' && this.validationState !== 'validating') {
          const wasValid = this.validationState === 'valid';
          this.resetState();
          if (wasValid) {
            this._parsedUnitData = null;
            this.cleared.emit();
          }
        }
        const v = typeof val === 'string' ? val : '';
        if (this.scanPatterns.length && matchesScanPattern(v, this.scanPatterns)) {
          setTimeout(() => this.unitIdInput?.nativeElement?.blur());
          return;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Public API for parent components ---

  get isValid(): boolean {
    return this.validationState === 'valid';
  }

  get parsedUnitId(): string | null {
    return this._parsedUnitData?.parsedUnitId ?? null;
  }

  get parsedUnitData(): UnitValidationResponse | null {
    return this._parsedUnitData;
  }

  get validHintText(): string {
    if (this.hintValid !== null) return this.hintValid;
    if (!this._parsedUnitData) return '';
    return `Valid ${this._parsedUnitData.barcodeType === 'CODE128' ? 'ISBT' : 'Codabar'} unit`;
  }

  clear(): void {
    this.unitIdControl.setValue('', { emitEvent: false });
    this.unitIdControl.markAsUntouched();
    this.unitIdControl.markAsPristine();
    this.unitIdControl.setErrors(null);
    this.resetState();
    this.cleared.emit();
  }

  focus(): void {
    setTimeout(() => {
      this.unitIdInput?.nativeElement?.focus();
    });
  }

  setError(errorMessage: string): void {
    this.markInvalid(errorMessage);
  }

  setValue(displayValue: string): void {
    this.unitIdControl.setValue(displayValue, { emitEvent: false });
    this.rawUnitId = displayValue;
    this.validationState = 'idle';
    this.validationError = null;
    this.unitIdControl.setErrors(null);
  }

  prefill(dbValue: string): void {
    if (!dbValue?.trim()) return;
    const val = dbValue.trim();

    let input: string;
    if (val.length === 13) {
      input = '=' + val + '00';
    } else if (val.length === 7 || val.length === 10) {
      input = val;
    } else {
      this.setValue(val);
      return;
    }

    this.validationState = 'validating';
    this.validationError = null;
    this.unitIdFieldService.validateUnitId(input, this.validateFfValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            this.markValid(input, response.item);
          } else {
            this.setValue(val);
          }
        },
        error: () => {
          this.setValue(val);
        }
      });
  }

  // --- Event handlers ---

  onFocus(): void {
    if (this.doubleEntry.isPending) return;
    if (this.validationState === 'invalid') return;

    if (this.rawUnitId) {
      this.unitIdControl.setValue(this.rawUnitId, { emitEvent: false });
    }
    this.resetState();
    this.unitIdControl.setErrors(null);
  }

  onBlur(): void {
    const unitId = this.unitIdControl.value?.trimEnd() ?? '';
    if (!unitId) {
      if (!this.unitIdControl.hasError('mismatch')) {
        this.resetState();
      }
      this.unitIdControl.markAsTouched();
      this.unitIdControl.updateValueAndValidity();
      // Emit emptyBlur event for parent to handle (e.g., auto-commit on last field)
      this.emptyBlur.emit();
      return;
    }

    // Prevent validation of incomplete scanner input
    // ISBT format: "=" (1) + unit ID (13-15) = minimum 14 characters
    // Codabar format: minimum 13 characters (without "=" prefix)
    // If input is just scanner prefix "=" or very short, it's incomplete
    if (unitId.length < 2 || (unitId.startsWith('=') && unitId.length < 14)) {
      // Input is incomplete (likely mid-scan), don't validate yet
      // Mark as touched so required error shows if user manually entered incomplete ID
      this.unitIdControl.markAsTouched();
      return;
    }

    // Prevent re-validation if already validating
    if (this.validationState === 'validating') {
      return;
    }

    // Prevent re-validation loop when already invalid (e.g., after post-validation rejection)
    if (this.validationState === 'invalid') {
      return;
    }

    // Prevent re-validation if already valid with same value
    if (this.validationState === 'valid' && this.rawUnitId === unitId) {
      return;
    }

    if (this.doubleEntry.isPending) {
      this.handleDoubleEntryVerify(unitId);
      return;
    }

    this.validationState = 'validating';
    this.validationError = null;
    this.unitIdFieldService.validateUnitId(unitId, this.validateFfValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            const data = response.item;

            if (data.barcodeType === 'CODABAR' && data.entryMode === 'M' && !this.skipDoubleEntry) {
              this.doubleEntry.start(unitId, data);
              this.validationState = 'idle';
              this.unitIdControl.setValue('', { emitEvent: false });
              this.unitIdControl.setErrors(null);
              this.unitIdControl.markAsUntouched();
              this.unitIdControl.markAsPristine();
              return;
            }

            this.handleFormatValid(unitId, data);
          } else {
            if (this.allowDeferralId && unitId.trim()) {
              const raw = unitId.trim();
              const syntheticData: UnitValidationResponse = {
                parsedUnitId: raw,
                checkDigit: null,
                codeScheme: 'C',
                manualUnitId: raw,
                codabarUnitScheme: null,
                entryMode: 'M',
                barcodeType: 'CODABAR',
                chapterScheme: 'C'
              };
              this.handleFormatValid(unitId, syntheticData);
              return;
            }
            this.markInvalid(response.message ?? 'Unit ID validation failed');
          }
        },
        error: (error) => {
          if (this.allowDeferralId && unitId.trim()) {
            const raw = unitId.trim();
            const syntheticData: UnitValidationResponse = {
              parsedUnitId: raw,
              checkDigit: null,
              codeScheme: 'C',
              manualUnitId: raw,
              codabarUnitScheme: null,
              entryMode: 'M',
              barcodeType: 'CODABAR',
              chapterScheme: 'C'
            };
            this.handleFormatValid(unitId, syntheticData);
            return;
          }
          const body = error?.error;
          this.markInvalid(body?.errorResponse?.error || body?.message || 'Unit ID validation failed');
        }
      });
  }

  onEnter(): void {
    // If field is empty, emit emptyEnter event for parent to handle
    const value = this.unitIdControl.value?.trim();
    if (!value) {
      this.emptyEnter.emit();
    }
    this.unitIdInput?.nativeElement?.blur();
  }

  onEscape(): void {
    this.unitIdInput?.nativeElement?.blur();
  }

  onTab(): void {
    // If field is empty, emit emptyTab event for parent to handle (e.g., auto-commit)
    const value = this.unitIdControl.value?.trim();
    if (!value) {
      this.emptyTab.emit();
    }
  }

  // --- Internal ---

  private handleFormatValid(rawInput: string, data: UnitValidationResponse): void {
    if (this.postValidate.observed || this.requirePostValidation) {
      // Parent wants to run additional validation before confirming.
      // Stay in 'validating' state — user sees "Validating..." until parent confirms/rejects.
      this.postValidate.emit({
        data,
        confirm: () => this.markValid(rawInput, data),
        reject: (errorMessage: string) => this.markInvalid(errorMessage)
      });
    } else {
      this.markValid(rawInput, data);
    }
  }

  private markValid(rawInput: string, data: UnitValidationResponse): void {
    this.validationState = 'valid';
    this._parsedUnitData = data;
    this.validationError = null;
    this.unitIdControl.setErrors(null);

    if (data.manualUnitId) {
      this.rawUnitId = rawInput;
      const displayValue = data.barcodeType === 'CODE128'
        ? UnitIdFormatUtility.formatCode128(data.manualUnitId)
        : data.manualUnitId;
      this.unitIdControl.setValue(displayValue, { emitEvent: false });
    }

    this.validated.emit(data);
  }

  private markInvalid(errorMessage: string): void {
    this.validationState = 'invalid';
    this.validationError = errorMessage;
    this.unitIdControl.setErrors({ serverError: true });
    this.focus();
  }

  private handleDoubleEntryVerify(unitId: string): void {
    const verification = this.doubleEntry.verify(unitId);
    if (verification.result === 'confirmed') {
      const data = verification.data;
      this.validationState = 'validating';
      this.confirmationHint = null;
      if (data.manualUnitId) {
        this.rawUnitId = unitId;
        this.unitIdControl.setValue(data.manualUnitId, { emitEvent: false });
      }
      this.handleFormatValid(unitId, data);
    } else {
      this.validationState = 'invalid';
      this.validationError = 'Unit ID did not match. Please try again.';
      this.confirmationHint = null;
      this._parsedUnitData = null;
      this.unitIdControl.setValue('', { emitEvent: false });
      this.unitIdControl.setErrors({ mismatch: true });
      this.unitIdControl.markAsTouched();
    }
  }

  private resetState(): void {
    this.validationState = 'idle';
    this._parsedUnitData = null;
    this.validationError = null;
    this.confirmationHint = null;
    this.rawUnitId = null;
    this.doubleEntry.reset();
  }
}
