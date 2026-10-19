import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorType, AuditFlag, ErrorCodeFilter } from '../models/error-code.model';

interface TypeOption {
  value: ErrorType | null;
  label: string;
}

interface AuditOption {
  value: AuditFlag | null;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-error-codes-filter',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './error-code-filter.html',
  styleUrl: './error-code-filter.scss',
})
export class ErrorCodesFilterComponent implements OnInit, OnDestroy {
  codeFrom: string = '';
  codeTo: string = '';
  selectedType: ErrorType | null = null;
  selectedAudit: AuditFlag | null = null;
  showEmpty: boolean = false;

  // Validation state
  codeFromTouched: boolean = false;
  codeToTouched: boolean = false;

  typeSearchControl = new FormControl('');
  filteredTypeOptions: TypeOption[] = [];

  private destroy$ = new Subject<void>();

  typeOptions: TypeOption[] = [
    { value: ErrorType.SHOW_MESSAGE_ONLY, label: 'Show Message Only' },
    { value: ErrorType.SHOW_MESSAGE_AND_STOP, label: 'Show Message and Stop' },
    { value: ErrorType.SHOW_WARNING_ONLY, label: 'Show Warning Only' },
    { value: ErrorType.SHOW_WARNING_AND_STOP, label: 'Show Warning and Stop' },
    { value: ErrorType.SHOW_ERROR_ONLY, label: 'Show Error Only' },
    { value: ErrorType.SHOW_ERROR_AND_STOP, label: 'Show Error and Stop' },
  ];

  auditOptions: AuditOption[] = [
    { value: AuditFlag.YES, label: 'Yes' },
    { value: AuditFlag.NO, label: 'No' },
  ];

  // Note: Filter values are set directly by the parent component after dialog.open()
  // See donor.ts, lab.ts, distribution.ts openFilter() methods
  constructor(
    private dialogRef: MatDialogRef<ErrorCodesFilterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tabType?: string }
  ) {}

  ngOnInit(): void {
    this.filteredTypeOptions = [...this.typeOptions];
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const term = (searchTerm || '').toLowerCase();
        this.filteredTypeOptions = this.typeOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  apply(): void {
    // Mark fields as touched for validation display
    this.codeFromTouched = true;
    this.codeToTouched = true;

    // Only apply if form is valid
    if (!this.isFormValid()) {
      return;
    }

    const filters: ErrorCodeFilter = {
      codeFrom: this.codeFrom,
      codeTo: this.codeTo,
      errorType: this.selectedType,
      auditFlag: this.selectedAudit,
      showEmpty: this.showEmpty,
    };

    this.dialogRef.close(filters);
  }

  clearAll(): void {
    this.codeFrom = '';
    this.codeTo = '';
    this.selectedType = null;
    this.selectedAudit = null;
    this.showEmpty = false;
    this.typeSearchControl.setValue('');

    // Reset validation state
    this.codeFromTouched = false;
    this.codeToTouched = false;
  }

  close(): void {
    this.dialogRef.close();
  }

  isDonorTab(): boolean {
    return this.data?.tabType === 'DONOR';
  }

  isLabTab(): boolean {
    return this.data?.tabType === 'LAB';
  }

  isDistributionTab(): boolean {
    return this.data?.tabType === 'DISTRIBUTION';
  }

  // ===== VALIDATION METHODS =====

  isFormValid(): boolean {
    // If both fields are empty, form is valid (no filter applied)
    if (this.codeFrom.trim() === '' && this.codeTo.trim() === '') {
      return true;
    }

    // If only one field is filled, both must be valid
    if (this.codeFrom.trim() !== '' || this.codeTo.trim() !== '') {
      return this.isCodeFromValid() && this.isCodeToValid() && this.isRangeValid();
    }

    return true;
  }

  isCodeFromValid(): boolean {
    const trimmed = this.codeFrom.trim();

    // Empty is valid (no filter)
    if (trimmed.length === 0) return true;

    // Must be numeric only
    if (!/^\d+$/.test(trimmed)) return false;

    const numValue = parseInt(trimmed, 10);

    // Donor tab: 5 digits (0-99999)
    if (this.isDonorTab()) {
      return numValue >= 0 && numValue <= 99999;
    }

    // Lab and Distribution tabs: 4 digits (0-9999)
    return numValue >= 0 && numValue <= 9999;
  }

  isCodeToValid(): boolean {
    const trimmed = this.codeTo.trim();

    // Empty is valid (no filter)
    if (trimmed.length === 0) return true;

    // Must be numeric only
    if (!/^\d+$/.test(trimmed)) return false;

    const numValue = parseInt(trimmed, 10);

    // Donor tab: 5 digits (0-99999)
    if (this.isDonorTab()) {
      return numValue >= 0 && numValue <= 99999;
    }

    // Lab and Distribution tabs: 4 digits (0-9999)
    return numValue >= 0 && numValue <= 9999;
  }

  isRangeValid(): boolean {
    const fromTrimmed = this.codeFrom.trim();
    const toTrimmed = this.codeTo.trim();

    // If either is empty, range validation doesn't apply
    if (fromTrimmed === '' || toTrimmed === '') return true;

    // Both must be valid numbers first
    if (!this.isCodeFromValid() || !this.isCodeToValid()) return true;

    const fromValue = parseInt(fromTrimmed, 10);
    const toValue = parseInt(toTrimmed, 10);

    // Code From must be <= Code To
    return fromValue <= toValue;
  }

  // ===== ERROR MESSAGE GETTERS =====

  getCodeFromError(): string {
    if (!this.codeFromTouched) return '';

    const trimmed = this.codeFrom.trim();

    // Empty is allowed (no error)
    if (trimmed.length === 0) return '';

    if (!/^\d+$/.test(trimmed)) {
      return 'Code must be numeric only';
    }

    const numValue = parseInt(trimmed, 10);

    // Donor tab: 5 digits (00000-99999)
    if (this.isDonorTab()) {
      if (numValue < 0 || numValue > 99999) {
        return 'Code must be between 00000 and 99999';
      }
    } else {
      // Lab and Distribution tabs: 4 digits (0000-9999)
      if (numValue < 0 || numValue > 9999) {
        return 'Code must be between 0000 and 9999';
      }
    }

    // Check range validation
    if (!this.isRangeValid()) {
      return 'Code From must be ≤ Code To';
    }

    return '';
  }

  getCodeToError(): string {
    if (!this.codeToTouched) return '';

    const trimmed = this.codeTo.trim();

    // Empty is allowed (no error)
    if (trimmed.length === 0) return '';

    if (!/^\d+$/.test(trimmed)) {
      return 'Code must be numeric only';
    }

    const numValue = parseInt(trimmed, 10);

    // Donor tab: 5 digits (00000-99999)
    if (this.isDonorTab()) {
      if (numValue < 0 || numValue > 99999) {
        return 'Code must be between 00000 and 99999';
      }
    } else {
      // Lab and Distribution tabs: 4 digits (0000-9999)
      if (numValue < 0 || numValue > 9999) {
        return 'Code must be between 0000 and 9999';
      }
    }

    // Check range validation
    if (!this.isRangeValid()) {
      return 'Code To must be ≥ Code From';
    }

    return '';
  }

  // ===== EVENT HANDLERS =====

  onCodeFromInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove all non-numeric characters (spaces, special chars, alphabets)
    const numericOnly = value.replace(/[^\d]/g, '');

    // Update the model value with cleaned input
    if (value !== numericOnly) {
      this.codeFrom = numericOnly;
      // Update input element value to reflect the change
      input.value = numericOnly;
    }

    this.codeFromTouched = true;
  }

  onCodeFromBlur(): void {
    this.codeFromTouched = true;
    this.formatCodeFrom();
  }

  onCodeToInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove all non-numeric characters (spaces, special chars, alphabets)
    const numericOnly = value.replace(/[^\d]/g, '');

    // Update the model value with cleaned input
    if (value !== numericOnly) {
      this.codeTo = numericOnly;
      // Update input element value to reflect the change
      input.value = numericOnly;
    }

    this.codeToTouched = true;
  }

  onCodeToBlur(): void {
    this.codeToTouched = true;
    this.formatCodeTo();
  }

  // Format code to 4 digits minimum on blur
  formatCodeFrom(): void {
    const trimmed = this.codeFrom.trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      const numValue = parseInt(trimmed, 10);
      if (numValue >= 0 && numValue <= 99999) {
        this.codeFrom = numValue.toString().padStart(4, '0');
      }
    }
  }

  formatCodeTo(): void {
    const trimmed = this.codeTo.trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      const numValue = parseInt(trimmed, 10);
      if (numValue >= 0 && numValue <= 99999) {
        this.codeTo = numValue.toString().padStart(4, '0');
      }
    }
  }

  // ===== HELPER PROPERTIES FOR TEMPLATE =====

  get hasCodeFromError(): boolean {
    const trimmedFrom = this.codeFrom.trim();
    return this.codeFromTouched && trimmedFrom !== '' &&
           (!this.isCodeFromValid() || !this.isRangeValid());
  }

  get hasCodeToError(): boolean {
    const trimmedTo = this.codeTo.trim();
    return this.codeToTouched && trimmedTo !== '' &&
           (!this.isCodeToValid() || !this.isRangeValid());
  }

  get isApplyDisabled(): boolean {
    // Check if form has validation errors
    if (!this.isFormValid()) {
      return true;
    }

    // Check if at least one field has a value
    const hasAnyValue = this.codeFrom.trim() !== '' ||
                        this.codeTo.trim() !== '' ||
                        this.selectedType !== null ||
                        this.selectedAudit !== null ||
                        this.showEmpty === true;

    return !hasAnyValue;
  }
}
