import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable, Subject, takeUntil } from 'rxjs';

import { ScanSelectOption } from './scan-select-field.model';
import { ScanPattern, matchesScanPattern } from '@shared/utils/scan-pattern.util';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-scan-select-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
  ],
  templateUrl: './scan-select-field.component.html',
  styleUrl: './scan-select-field.component.scss',
})
export class ScanSelectFieldComponent implements OnInit, OnChanges, OnDestroy {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() showBarcodeIcon = false;
  @Input() showDropdown = true;
  @Input() uppercase: boolean | null = null;
  @Input() scanPatterns: ScanPattern[] = [];
  @Input() options: ScanSelectOption[] = [];
  @Input() parseFn?: (value: string) => Observable<ScanSelectOption | null>;

  @Output() valueChanged = new EventEmitter<ScanSelectOption | null>();
  @Output() cleared = new EventEmitter<void>();

  @ViewChild('fieldInput') fieldInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;

  readonly inputControl = new FormControl('');

  filteredOptions: ScanSelectOption[] = [];
  validationState: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';
  validationError: string | null = null;

  private readonly snackbarService = inject(SnackbarService);
  private _currentValue: ScanSelectOption | null = null;
  private optionJustSelected = false;
  private destroy$ = new Subject<void>();

  constructor() {
    this.inputControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        if (this.optionJustSelected) return;
        if (this.validationState !== 'idle' && this.validationState !== 'validating') {
          this.resetState();
        }
        const val = typeof term === 'string' ? term : '';
        this.filterOptions(val);
        if (this.scanPatterns.length && matchesScanPattern(val, this.scanPatterns)) {
          setTimeout(() => this.fieldInput?.nativeElement?.blur());
        }
      });
  }

  ngOnInit(): void {
    if (this.required) {
      this.inputControl.addValidators(Validators.required);
      this.inputControl.updateValueAndValidity();
    }
    if (this.disabled) {
      this.inputControl.disable();
    }
    this.filteredOptions = [...this.options];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      if (this.disabled) {
        this.inputControl.disable({ emitEvent: false });
      } else {
        this.inputControl.enable({ emitEvent: false });
      }
    }
    if (changes['options']) {
      this.filteredOptions = [...this.options];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Public API ---

  get isValid(): boolean {
    return this.validationState === 'valid';
  }

  get currentValue(): ScanSelectOption | null {
    return this._currentValue;
  }

  clear(): void {
    this.inputControl.setValue('', { emitEvent: false });
    this.inputControl.markAsUntouched();
    this.inputControl.markAsPristine();
    this.inputControl.setErrors(null);
    this.resetState();
    this.cleared.emit();
  }

  setValue(code: string, description?: string): void {
    this._currentValue = { code, description: description ?? '' };
    this.inputControl.setValue(code, { emitEvent: false });
    this.validationState = 'valid';
    this.validationError = null;
    this.inputControl.setErrors(null);
  }

  setError(message: string): void {
    this.validationState = 'invalid';
    this.validationError = message;
    this.inputControl.setErrors({ serverError: true });
    this.inputControl.markAsTouched();
  }

  focus(): void {
    setTimeout(() => {
      this.fieldInput?.nativeElement?.focus();
      this.autoTrigger?.closePanel();
    });
  }

  blur(): void {
    this.autoTrigger?.closePanel();
    this.fieldInput?.nativeElement?.blur();
  }

  // --- Event handlers ---

  displayFn = (value: ScanSelectOption | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.code;
  };

  onOptionSelected(option: ScanSelectOption): void {
    this.optionJustSelected = true;
    this._currentValue = option;
    this.validationState = 'valid';
    this.validationError = null;
    this.inputControl.setErrors(null);
    this.autoTrigger?.closePanel();
    this.fieldInput?.nativeElement?.blur();
    this.valueChanged.emit(option);
  }

  onBlur(): void {
    if (this.optionJustSelected) {
      this.optionJustSelected = false;
      return;
    }

    const rawValue = (typeof this.inputControl.value === 'string'
      ? this.inputControl.value
      : ''
    ).trim();

    if (!rawValue) {
      this.inputControl.markAsTouched();
      this.inputControl.updateValueAndValidity();
      return;
    }

    if (this.validationState === 'validating') return;
    if (this.validationState === 'valid' && this._currentValue?.code === rawValue) return;

    const exactMatch = this.options.find(
      (opt) => opt.code.toLowerCase() === rawValue.toLowerCase(),
    );
    if (exactMatch) {
      this._currentValue = exactMatch;
      this.validationState = 'valid';
      this.inputControl.setValue(exactMatch.code, { emitEvent: false });
      this.inputControl.setErrors(null);
      this.valueChanged.emit(exactMatch);
      return;
    }

    if (!this.parseFn) {
      if (this.options.length > 0) {
        this.markInvalid('Please select a valid option or scan a barcode');
      }
      return;
    }

    this.validationState = 'validating';
    this.validationError = null;

    this.parseFn(rawValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result) {
            this._currentValue = result;
            this.validationState = 'valid';
            this.inputControl.setValue(result.code, { emitEvent: false });
            this.inputControl.setErrors(null);
            this.valueChanged.emit(result);
          } else {
            this.markInvalid('Invalid scan value');
            this.snackbarService.showError('Invalid scan value');
          }
        },
        error: (err) => {
          const body = err?.error;
          const errorCode = body?.errorResponse?.errorCode || body?.errorCode || '';
          const errorMsg = body?.errorResponse?.error || body?.message || err?.message || 'Validation failed';
          const display = errorCode ? `${errorCode}: ${errorMsg}` : errorMsg;
          this.markInvalid(errorMsg);
          this.snackbarService.showError(display);
        },
      });
  }

  onEnter(): void {
    this.fieldInput?.nativeElement?.blur();
  }

  togglePanel(): void {
    if (!this.autoTrigger) return;
    if (this.autoTrigger.panelOpen) {
      this.autoTrigger.closePanel();
    } else {
      this.filteredOptions = [...this.options];
      this.autoTrigger.autocompleteDisabled = false;
      this.fieldInput?.nativeElement?.focus();
      this.autoTrigger.openPanel();
      const sub = this.autoTrigger.panelClosingActions
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.autoTrigger.autocompleteDisabled = true;
          sub.unsubscribe();
        });
    }
  }

  // --- Internal ---

  private filterOptions(term: string): void {
    const search = term.toLowerCase();
    if (!search) {
      this.filteredOptions = [...this.options];
    } else {
      this.filteredOptions = this.options.filter(
        (opt) =>
          opt.code.toLowerCase().includes(search) ||
          opt.description.toLowerCase().includes(search),
      );
    }
  }

  private markInvalid(errorMessage: string): void {
    this.validationState = 'invalid';
    this.validationError = errorMessage;
    this.inputControl.setErrors({ serverError: true });
  }

  private resetState(): void {
    this.validationState = 'idle';
    this._currentValue = null;
    this.validationError = null;
  }
}
