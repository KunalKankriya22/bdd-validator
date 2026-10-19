import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  ErrorType,
  AuditFlag,
  TabType,
  ErrorCodeCreateRequest
} from '../models/error-code.model';
import { ErrorCodeFacadeService } from '../services/error-code-facade.service';
import { finalize } from 'rxjs';

export interface CodeDialogData {
  mode: 'add' | 'edit';
  tabType?: TabType;
  errorCode?: string;
  errorType?: ErrorType;
  error?: string;
  auditFlag?: AuditFlag;
}

interface TypeOption {
  value: ErrorType;
  label: string;
}

@Component({
  selector: 'app-add-new-code-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './addNewcode.html',
  styleUrls: ['./addNewcode.scss']
})
export class AddNewCode implements OnInit, OnDestroy {
  dialogTitle: string;
  dialogSubtitle = '';
  errorCode: string = '';
  selectedErrorType: ErrorType | null = null;
  description: string = '';
  enableForAudit: boolean = false;

  // Validation state
  errorCodeTouched: boolean = false;
  errorTypeTouched: boolean = false;
  descriptionTouched: boolean = false;

  // Code existence validation (disabled - backend will handle)
  codeExistsError: boolean = false;
  isCheckingCode: boolean = false;

  // Saving state
  isSaving: boolean = false;

  // Original values snapshot for change detection in edit mode
  private originalErrorType: ErrorType | null = null;
  private originalDescription: string = '';
  private originalEnableForAudit: boolean = false;

  errorCodeErrorMatcher: ErrorStateMatcher = {
    isErrorState: () => this.hasErrorCodeError
  };

  errorTypeErrorMatcher: ErrorStateMatcher = {
    isErrorState: () => this.hasErrorTypeError
  };

  descriptionErrorMatcher: ErrorStateMatcher = {
    isErrorState: () => this.hasDescriptionError
  };

  errorTypeSearchControl = new FormControl('');
  filteredTypeOptions: TypeOption[] = [];

  private destroy$ = new Subject<void>();

  typeOptions: TypeOption[] = [
    { value: ErrorType.SHOW_MESSAGE_ONLY, label: 'Show Message Only' },
    { value: ErrorType.SHOW_MESSAGE_AND_STOP, label: 'Show Message and Stop' },
    { value: ErrorType.SHOW_WARNING_ONLY, label: 'Show Warning Only' },
    { value: ErrorType.SHOW_WARNING_AND_STOP, label: 'Show Warning and Stop' },
    { value: ErrorType.SHOW_ERROR_ONLY, label: 'Show Error Only' },
    { value: ErrorType.SHOW_ERROR_AND_STOP, label: 'Show Error and Stop' }
  ];

  constructor(
    public dialogRef: MatDialogRef<AddNewCode>,
    @Inject(MAT_DIALOG_DATA) public data: CodeDialogData,
    private facade: ErrorCodeFacadeService
  ) {
    this.dialogTitle = data.mode === 'add' ? 'Add New Code' : 'Edit Code';
    this.dialogSubtitle = data.mode === 'add'
      ? 'Add the code details below and click add to apply changes.'
      : 'Update the code details below and click save to apply changes.';

    // Populate fields if editing
    if (data.mode === 'edit') {
      this.errorCode = data.errorCode || '';
      this.selectedErrorType = data.errorType || null;
      this.description = data.error || '';
      this.enableForAudit = data.auditFlag === AuditFlag.YES;

      // Snapshot originals for change detection
      this.originalErrorType = this.selectedErrorType;
      this.originalDescription = this.description;
      this.originalEnableForAudit = this.enableForAudit;
    }
  }

  ngOnInit(): void {
    this.filteredTypeOptions = [...this.typeOptions];
    this.errorTypeSearchControl.valueChanges
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

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Mark all fields as touched for validation display
    this.errorCodeTouched = true;
    this.errorTypeTouched = true;
    this.descriptionTouched = true;

    // Validate all required fields
    if (!this.isFormValid()) {
      return;
    }

    const request: ErrorCodeCreateRequest = {
      errorCode: this.errorCode.trim(),
      errorType: this.selectedErrorType!,
      error: this.description.trim(),
      auditFlag: this.enableForAudit ? AuditFlag.YES : AuditFlag.NO
    };

    this.isSaving = true;

    if (this.data.mode === 'add') {
      this.facade.createErrorCode(request)
        .pipe(finalize(() => this.isSaving = false))
        .subscribe({
          next: () => {
            this.dialogRef.close(true); // Close with success indicator
          },
          error: (error) => {
            console.error('Failed to create error code:', error);
            // Dialog stays open on error
          }
        });
    } else {
      this.facade.updateErrorCode(this.data.errorCode!, request)
        .pipe(finalize(() => this.isSaving = false))
        .subscribe({
          next: () => {
            this.dialogRef.close(true); // Close with success indicator
          },
          error: (error) => {
            console.error('Failed to update error code:', error);
            // Dialog stays open on error
          }
        });
    }
  }

  isFormValid(): boolean {
    return this.isErrorCodeValid() &&
           this.isErrorTypeValid() &&
           this.isDescriptionValid();
  }

  hasChanges(): boolean {
    return this.selectedErrorType !== this.originalErrorType ||
           this.description.trim() !== this.originalDescription.trim() ||
           this.enableForAudit !== this.originalEnableForAudit;
  }

  isErrorCodeValid(): boolean {
    const trimmed = this.errorCode.trim();

    // Must not be empty
    if (trimmed.length === 0) return false;

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

  //Validate error type: mandatory
  isErrorTypeValid(): boolean {
    return this.selectedErrorType !== null && this.selectedErrorType !== undefined;
  }

  //Validate description: mandatory, max 70 characters
  isDescriptionValid(): boolean {
    const trimmed = this.description.trim();
    return trimmed.length > 0 && trimmed.length <= 70;
  }

  // Error message getters for display
  getErrorCodeError(): string {
    if (!this.errorCodeTouched) return '';

    const trimmed = this.errorCode.trim();

    if (trimmed.length === 0) {
      return 'Code is required';
    }

    if (!/^\d+$/.test(trimmed)) {
      return 'Error code must be numeric';
    }

    const numValue = parseInt(trimmed, 10);

    // Donor tab: 5 digits (00000-99999)
    if (this.isDonorTab()) {
      if (numValue < 0 || numValue > 99999) {
        return 'Error code must be between 00000 and 99999';
      }
    } else {
      // Lab and Distribution tabs: 4 digits (0000-9999)
      if (numValue < 0 || numValue > 9999) {
        return 'Error code must be between 0000 and 9999';
      }
    }

    return '';
  }

  getErrorTypeError(): string {
    if (!this.errorTypeTouched) return '';

    if (this.selectedErrorType === null || this.selectedErrorType === undefined) {
      return 'Type is required';
    }

    return '';
  }

  getDescriptionError(): string {
    if (!this.descriptionTouched) return '';

    const trimmed = this.description.trim();

    if (trimmed.length === 0) {
      return 'Description is required';
    }

    if (trimmed.length > 70) {
      return 'Description must be 70 characters or less';
    }

    return '';
  }

  // Mark field as touched on blur
  onErrorCodeBlur(): void {
    this.errorCodeTouched = true;
  }

  onErrorTypeChange(): void {
    this.errorTypeTouched = true;
  }

  onErrorTypeOpenedChange(opened: boolean): void {
    if (!opened) {
      this.errorTypeTouched = true;
    }
  }

  onErrorTypeBlur(): void {
    this.errorTypeTouched = true;
  }

  onDescriptionBlur(): void {
    this.descriptionTouched = true;
  }

  onDescriptionInput(): void {
    this.descriptionTouched = true;
  }

  onErrorCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\D/g, '');
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
    this.errorCode = sanitized;
    if (sanitized.length > 0) {
      this.errorCodeTouched = true;
    }
  }

  onErrorCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const sanitized = pasted.replace(/\D/g, '');
    const maxLen = this.isDonorTab() ? 5 : 4;
    this.errorCode = sanitized.slice(0, maxLen);
  }

  // Format error code to minimum 4 digits on blur
  formatErrorCode(): void {
    const trimmed = this.errorCode.trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      const numValue = parseInt(trimmed, 10);
      if (numValue >= 0 && numValue <= 99999) {
        // Pad to minimum 4 digits (e.g., 25 → 0025, 12345 → 12345)
        this.errorCode = numValue.toString().padStart(4, '0');
      }
    }
  }

  // Helper method to check if error code field should show error state
  get hasErrorCodeError(): boolean {
    return this.errorCodeTouched && !this.isErrorCodeValid();
  }

  // Helper method to check if error type field should show error state
  get hasErrorTypeError(): boolean {
    return this.errorTypeTouched && !this.isErrorTypeValid();
  }

  // Helper method to check if description field should show error state
  get hasDescriptionError(): boolean {
    return this.descriptionTouched && !this.isDescriptionValid();
  }

  isDonorTab(): boolean {
    return this.data.tabType === TabType.DONOR;
  }

  isLabTab(): boolean {
    return this.data.tabType === TabType.LAB;
  }

  isDistributionTab(): boolean {
    return this.data.tabType === TabType.DISTRIBUTION;
  }
}
