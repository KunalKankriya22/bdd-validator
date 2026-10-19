import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  ViewChild, ElementRef, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Subject, take, takeUntil } from 'rxjs';

import { UnitIdFieldService } from '@shared/components/unit-id-field/unit-id-field.service';
import { UnitIdDoubleEntryHelper } from '@shared/components/unit-id-field/unit-id-double-entry.helper';
import { UnitIdFormatUtility } from '@shared/components/unit-id-field/unit-id-format.utility';
import { UppercaseInputDirective } from '@shared/directives/uppercase-input.directive';
import { ScanPattern, matchesScanPattern, SCAN_PATTERNS } from '@shared/utils/scan-pattern.util';
import { UnitValidationResponse, LovItem } from './unit-id-field-with-lov.model';

export interface UnitIdPostValidateEvent {
  data: UnitValidationResponse;
  confirm: () => void;
  reject: (errorMessage: string) => void;
}

export interface UnitIdLovSelectedEvent {
  item: LovItem;
  setDisplayValue: (displayUnitId: string) => void;
  reject: (errorMessage: string) => void;
}

@Component({
  selector: 'app-unit-id-field-with-lov',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatAutocompleteModule,
    UppercaseInputDirective,
  ],
  templateUrl: './unit-id-field-with-lov.component.html',
  styleUrl: './unit-id-field-with-lov.component.scss',
})
export class UnitIdFieldWithLovComponent implements OnInit, OnDestroy {
  @Input() validateFfValue = 'N';
  @Input() label = 'Unit ID';
  @Input() placeholder = '';
  @Input() required = true;
  @Input() hintDefault = 'Scan or type';
  @Input() hintValid: string | null = null;
  @Input() requirePostValidation = false;
  @Input() skipDoubleEntry = false;
  @Input() allowDeferralId = false;
  @Input() showBarcodeIcon = false;
  @Input() scanPatterns: ScanPattern[] = SCAN_PATTERNS.UNIT_ID;

  @Input() set lovItems(items: LovItem[]) {
    this._lovItems.set(items);
  }
  @Input() showLov = false;

  @Output() validated = new EventEmitter<UnitValidationResponse>();
  @Output() cleared = new EventEmitter<void>();
  @Output() postValidate = new EventEmitter<UnitIdPostValidateEvent>();
  @Output() emptyEnter = new EventEmitter<void>();
  @Output() lovSelected = new EventEmitter<UnitIdLovSelectedEvent>();

  @ViewChild('unitIdInput') unitIdInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;

  readonly unitIdControl = new FormControl('');
  readonly doubleEntry = new UnitIdDoubleEntryHelper<UnitValidationResponse>();

  validationState: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';
  validationError: string | null = null;
  confirmationHint: string | null = null;
  isLovFromSelection = false;
  lovPanelEnabled = false;

  private _lovItems = signal<LovItem[]>([]);

  filteredLovItems = computed(() => {
    const q = this._lovFilter().toUpperCase();
    const items = this._lovItems();
    if (!q) return items;
    return items.filter(i =>
      (i.displayUnitId || i.unitId).toUpperCase().includes(q) ||
      i.unitId.toUpperCase().includes(q)
    );
  });

  lovItemsList = computed(() => this._lovItems());

  private _lovFilter = signal('');
  private _parsedUnitData: UnitValidationResponse | null = null;
  private rawUnitId: string | null = null;
  private destroy$ = new Subject<void>();
  private unitIdFieldService = inject(UnitIdFieldService);
  private lovOptionJustSelected = false;

  constructor() {
    this.unitIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (this.doubleEntry.isPending) return;
        if (this.lovOptionJustSelected) return;
        if (val != null && typeof val !== 'string') return;

        if (this.validationState !== 'idle' && this.validationState !== 'validating') {
          this.resetState();
          this.cleared.emit();
        }

        const term = typeof val === 'string' ? val : '';
        this._lovFilter.set(term);

        if (this.scanPatterns.length && matchesScanPattern(term, this.scanPatterns)) {
          setTimeout(() => this.unitIdInput?.nativeElement?.blur());
        }
      });
  }

  ngOnInit(): void {
    if (this.required) {
      this.unitIdControl.addValidators(Validators.required);
      this.unitIdControl.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
    this.isLovFromSelection = false;
    this.resetState();
    this.cleared.emit();
  }

  focus(): void {
    setTimeout(() => this.unitIdInput?.nativeElement?.focus());
  }

  setError(errorMessage: string): void {
    this.markInvalid(errorMessage);
  }

  // -- LOV panel (mat-autocomplete, disabled by default like scan-select-field) --

  displayFn = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const raw = value.displayUnitId || value.unitId || '';
    return UnitIdFormatUtility.formatCode128(raw);
  };

  togglePanel(): void {
    if (!this.autoTrigger) return;

    if (this.autoTrigger.panelOpen) {
      this.autoTrigger.closePanel();
      return;
    }

    this._lovFilter.set('');
    this.lovPanelEnabled = true;
    this.unitIdInput?.nativeElement?.focus();
    this.autoTrigger.openPanel();

    this.autoTrigger.panelClosingActions
      .pipe(take(1))
      .subscribe(() => {
        this.lovPanelEnabled = false;
      });
  }

  onLovOptionSelected(event: any): void {
    const item = event.option.value as LovItem;

    this.lovOptionJustSelected = true;
    this.isLovFromSelection = true;
    this.validationState = 'validating';
    this.validationError = null;
    this.unitIdControl.setValue(item.displayUnitId || item.unitId, { emitEvent: false });
    this.unitIdControl.markAsTouched();

    setTimeout(() => { this.lovOptionJustSelected = false; }, 100);

    this.lovSelected.emit({
      item,
      setDisplayValue: (displayUnitId: string) => {
        this.rawUnitId = displayUnitId;
        this.validationState = 'valid';
        this.validationError = null;
        this.unitIdControl.setErrors(null);
        const formatted = UnitIdFormatUtility.formatCode128(displayUnitId);
        setTimeout(() => {
          this.unitIdControl.setValue(formatted, { emitEvent: false });
          if (this.unitIdInput?.nativeElement) {
            this.unitIdInput.nativeElement.value = formatted;
          }
          this.unitIdInput?.nativeElement?.blur();
        });
      },
      reject: (errorMessage: string) => {
        this.isLovFromSelection = false;
        this.markInvalid(errorMessage);
      },
    });
  }

  // -- Input event handlers (same as shared unit-id-field) --

  onFocus(): void {
    if (this.doubleEntry.isPending) return;
    if (this.validationState === 'invalid') return;

    if (this.rawUnitId) {
      this.unitIdControl.setValue(this.rawUnitId, { emitEvent: false });
    }
    this.unitIdControl.setErrors(null);
  }

  onBlur(): void {
    if (this.lovOptionJustSelected) return;

    const unitId = this.unitIdControl.value?.trimEnd() ?? '';
    if (!unitId) {
      if (!this.unitIdControl.hasError('mismatch')) {
        this.resetState();
      }
      this.unitIdControl.markAsTouched();
      this.unitIdControl.updateValueAndValidity();
      return;
    }

    if (unitId.length < 2 || (unitId.startsWith('=') && unitId.length < 14)) {
      this.unitIdControl.markAsTouched();
      return;
    }

    if (this.validationState === 'validating') return;
    if (this.validationState === 'invalid') return;
    if (this.validationState === 'valid') {
      if (this.rawUnitId) {
        this.unitIdControl.setValue(
          UnitIdFormatUtility.formatCode128(this.rawUnitId),
          { emitEvent: false },
        );
      }
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
              this.handleFormatValid(unitId, this.buildSyntheticData(unitId));
              return;
            }
            this.markInvalid(response.message ?? 'Unit ID validation failed');
          }
        },
        error: (error) => {
          if (this.allowDeferralId && unitId.trim()) {
            this.handleFormatValid(unitId, this.buildSyntheticData(unitId));
            return;
          }
          const body = error?.error;
          this.markInvalid(body?.errorResponse?.error || body?.message || 'Unit ID validation failed');
        },
      });
  }

  onEnter(): void {
    const value = this.unitIdControl.value?.trim();
    if (!value) this.emptyEnter.emit();
    this.unitIdInput?.nativeElement?.blur();
  }

  onEscape(): void {
    this.unitIdInput?.nativeElement?.blur();
  }

  // -- Private helpers --

  private handleFormatValid(rawInput: string, data: UnitValidationResponse): void {
    if (this.postValidate.observed || this.requirePostValidation) {
      this.postValidate.emit({
        data,
        confirm: () => this.markValid(rawInput, data),
        reject: (errorMessage: string) => this.markInvalid(errorMessage),
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

  private buildSyntheticData(unitId: string): UnitValidationResponse {
    const raw = unitId.trim();
    return {
      parsedUnitId: raw, checkDigit: null, codeScheme: 'C',
      manualUnitId: raw, codabarUnitScheme: null,
      entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
    };
  }

  private resetState(): void {
    this.validationState = 'idle';
    this._parsedUnitData = null;
    this.validationError = null;
    this.confirmationHint = null;
    this.rawUnitId = null;
    this.isLovFromSelection = false;
    this.doubleEntry.reset();
    this._lovFilter.set('');
  }
}
