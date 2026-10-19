import { Component, Inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '@shared/services/snackbar.service';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';
import { signal, computed } from '@angular/core';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { LabTestsApiService } from '../services/lab-tests-api.service';
import { DropdownOptions, DefineTestsLabCreateDto, DefineTestsLabUpdateDto } from '../models/lab-tests.model';

// Time format validator (HH:mm)
export const timeFormatValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null; // empty is valid (not required for termination time)
  }

  // HH:mm format (00:00 to 23:59)
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/;

  return regex.test(value) ? null : { invalidTimeFormat: true };
};

// Alphanumeric only validator (letters and numbers only, no special characters)
export const alphanumericOnlyValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null; // empty is valid (use required validator separately)
  }

  // Only allow letters and numbers (a-z, A-Z, 0-9)
  const regex = /^[a-zA-Z0-9]*$/;

  return regex.test(value) ? null : { invalidCharacters: true };
};

// ISBT DateTime format validator (DD-MMM-YYYY HH:mm)
export const isbtDateTimeFormatValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null; // empty is valid (use required validator separately)
  }

  // ISBT format: DD-MMM-YYYY HH:mm (e.g., 02-FEB-2025 05:30)
  // Accepts both with comma (DD-MMM-YYYY, HH:mm) or space only (DD-MMM-YYYY HH:mm)
  const regex = /^(0[1-9]|[12][0-9]|3[01])-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4},?\s([01]\d|2[0-3]):[0-5]\d$/i;

  return regex.test(value) ? null : { invalidIsbtFormat: true };
};

function parseIsbtDateTime(value: string): Date | null {
  if (!value) return null;
  const normalized = value.replace(',', '').replace(/\s+/g, ' ').trim();
  const formats = ['DD-MMM-YYYY HH:mm', 'DD-MMM-YYYY HHmm', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm'];
  for (const fmt of formats) {
    const parsed = moment(normalized, fmt, true);
    if (parsed.isValid()) return parsed.toDate();
  }
  const loose = moment(normalized);
  return loose.isValid() ? loose.toDate() : null;
}

export const effBeforeTermDateTimeValidator: ValidatorFn = (
  formGroup: AbstractControl
): ValidationErrors | null => {
  const effControl = formGroup.get('effDateTime');
  const termControl = formGroup.get('termDateTime');
  const effValue = effControl?.value;
  const termValue = termControl?.value;
  if (!effValue || !termValue) {
    if (termControl?.hasError('effDateTimeAfterTerm')) {
      const errors = { ...termControl.errors };
      delete errors['effDateTimeAfterTerm'];
      termControl.setErrors(Object.keys(errors).length ? errors : null);
    }
    return null;
  }
  const effDate = parseIsbtDateTime(effValue);
  const termDate = parseIsbtDateTime(termValue);
  if (!effDate || !termDate) return null;
  if (effDate > termDate) {
    termControl?.setErrors({ ...termControl?.errors, effDateTimeAfterTerm: true });
    return { effDateTimeAfterTerm: true };
  } else {
    if (termControl?.hasError('effDateTimeAfterTerm')) {
      const errors = { ...termControl.errors };
      delete errors['effDateTimeAfterTerm'];
      termControl.setErrors(Object.keys(errors).length ? errors : null);
    }
    return null;
  }
};

export interface TestDialogData {
  mode: 'add' | 'edit';
  testId?: string;
  description?: string;
  shortId?: string;
  group?: string;
  antigenTest?: string;
  autoSchedule?: string;
  editResults?: string;
  discrepancyCheck?: string;
  noOfResults?: number | string;
  fullResult?: string;
  effDateTime?: Date | string | null;
  termDateTime?: Date | string | null;
}

export interface TestDialogResult {
  success: boolean;
}

@Component({
  selector: 'app-add-edit-test',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-test.html',
  styleUrls: ['./add-edit-test.scss']
})
export class AddEditTestComponent implements OnInit, OnDestroy {
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.dialogRef.close();
  }

  dialogTitle: string;
  mode: 'add' | 'edit' = 'add';
  form: FormGroup;
  isSaving = false;


  // Dropdown options from API
  dropdownOptions: DropdownOptions = {
    group: [],
    antigenTest: [],
    autoSchedule: [],
    editResults: [],
    discrepancyCheck: [],
    noOfResults: [],
    fullResult: []
  };
  isLoadingDropdowns = true;

  // Search control for Group dropdown
  readonly groupSearchControl = new FormControl('');
  private readonly groupSearch = signal('');
  private readonly groupOptionsSignal = signal<{ value: string; display: string }[]>([]);

  // Filtered group options based on search
  readonly filteredGroupOptions = computed(() => {
    const search = this.groupSearch().toLowerCase();
    const options = this.groupOptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.display.toLowerCase().includes(search));
  });

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: LabTestsApiService,
    private snackbarService: SnackbarService,
    public dialogRef: MatDialogRef<AddEditTestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TestDialogData
  ) {
    this.mode = data.mode;
    this.dialogTitle = data.mode === 'add' ? 'Add New Test' : 'Edit Test';

    this.form = this.fb.group({
      testId: ['', [Validators.required, Validators.maxLength(10)]],
      description: ['', [Validators.required, Validators.maxLength(50)]],
      shortId: ['', [Validators.required, Validators.maxLength(6), alphanumericOnlyValidator]],
      group: [null],
      antigenTest: [null],
      autoSchedule: [null, [Validators.required]],
      editResults: [null, [Validators.required]],
      discrepancyCheck: [null, [Validators.required]],
      noOfResults: [null, [Validators.required]],
      fullResult: [null, [Validators.required]],
      effDateTime: ['', [Validators.required, isbtDateTimeFormatValidator]],
      termDateTime: ['', [isbtDateTimeFormatValidator]]
    }, { validators: [effBeforeTermDateTimeValidator] });

    if (data.mode === 'edit') {
      const effDateMoment = data.effDateTime ? moment(data.effDateTime) : null;
      const termDateMoment = data.termDateTime ? moment(data.termDateTime) : null;

      this.form.patchValue({
        testId: data.testId || '',
        description: data.description || '',
        shortId: data.shortId || '',
        group: data.group || null,
        antigenTest: this.ynToBool(data.antigenTest),
        autoSchedule: this.ynToBool(data.autoSchedule),
        editResults: this.ynToBool(data.editResults),
        discrepancyCheck: this.ynToBool(data.discrepancyCheck),
        noOfResults: data.noOfResults != null ? Number(data.noOfResults) : null,
        fullResult: this.ynToBool(data.fullResult),
        effDateTime: effDateMoment ? effDateMoment.format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
        termDateTime: termDateMoment ? termDateMoment.format('DD-MMM-YYYY HH:mm').toUpperCase() : null
      });
      this.form.get('testId')?.disable();
      this.form.get('effDateTime')?.disable();
    }
  }

  ngOnInit(): void {
    this.form.markAsPristine();
    this.loadDropdowns();

    this.form.get('effDateTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.form.updateValueAndValidity({ emitEvent: false }));

    this.form.get('termDateTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.form.updateValueAndValidity({ emitEvent: false }));

    // Subscribe to group search control
    this.groupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.groupSearch.set(value || ''));

    // Auto-convert to uppercase as user types (add mode only)
    if (this.mode === 'add') {
      this.form.get('effDateTime')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value: string) => {
          if (value && value !== value.toUpperCase()) {
            this.form.get('effDateTime')?.setValue(value.toUpperCase(), { emitEvent: false });
          }
        });

      this.form.get('termDateTime')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((value: string) => {
          if (value && value !== value.toUpperCase()) {
            this.form.get('termDateTime')?.setValue(value.toUpperCase(), { emitEvent: false });
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDropdowns(): void {
    this.isLoadingDropdowns = true;

    forkJoin({
      testGroups: this.service.getTestGroups(),
      otherDropdowns: this.service.getDropdowns()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingDropdowns = false)
      )
      .subscribe({
        next: ({ testGroups, otherDropdowns }) => {
          this.dropdownOptions = {
            ...otherDropdowns,
            group: testGroups
          };
          // Update signal for filtered options
          this.groupOptionsSignal.set(testGroups);
        },
        error: () => {
          this.snackbarService.showError('Failed to load dropdown options. Some fields may not be available.');
        }
      });
  }

  private ynToBool(value: string | undefined): boolean | null {
    if (value === 'Y') return true;
    if (value === 'N') return false;
    return null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    if (this.mode === 'add') {
      const createDto: DefineTestsLabCreateDto = {
        TestId: formValue.testId?.trim() || '',
        Description: formValue.description?.trim() || '',
        ShortId: formValue.shortId?.trim() || '',
        Group: formValue.group || undefined,
        AntigenTest: formValue.antigenTest,
        AutoSchedule: formValue.autoSchedule,
        EditResults: formValue.editResults,
        DiscrepancyCheck: formValue.discrepancyCheck,
        NoOfResults: formValue.noOfResults,
        FullResult: formValue.fullResult,
        EffectiveDate: this.convertIsbtToApiFormat(formValue.effDateTime),
        TerminationDate: formValue.termDateTime ? this.convertIsbtToApiFormat(formValue.termDateTime) : null
      };

      this.service.createTest(createDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || response?.Message || response?.data?.message || response?.data?.Message || 'Test created successfully';
            this.snackbarService.showSuccess(message);
            this.dialogRef.close({ success: true } as TestDialogResult);
          },
          error: () => {
            // Error snackbar handled by global HTTP interceptor
          }
        });
    } else {
      const testId = formValue.testId;
      const updateDto: DefineTestsLabUpdateDto = {
        Description: formValue.description?.trim() || '',
        ShortId: formValue.shortId?.trim() || '',
        Group: formValue.group || undefined,
        AntigenTest: formValue.antigenTest,
        AutoSchedule: formValue.autoSchedule,
        EditResults: formValue.editResults,
        DiscrepancyCheck: formValue.discrepancyCheck,
        NoOfResults: formValue.noOfResults,
        FullResult: formValue.fullResult,
        EffectiveDate: this.convertIsbtToApiFormat(formValue.effDateTime),
        TerminationDate: formValue.termDateTime ? this.convertIsbtToApiFormat(formValue.termDateTime) : null
      };

      this.service.updateTest(testId, updateDto)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSaving = false)
        )
        .subscribe({
          next: (response) => {
            const message = response?.message || response?.Message || response?.data?.message || response?.data?.Message || 'Test updated successfully';
            this.snackbarService.showSuccess(message);
            this.dialogRef.close({ success: true } as TestDialogResult);
          },
          error: () => {
            // Error snackbar handled by global HTTP interceptor
          }
        });
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched) return '';

    const fieldLabels: { [key: string]: string } = {
      'testId': 'Test ID',
      'description': 'Description',
      'shortId': 'Short ID',
      'autoSchedule': 'Auto Schedule',
      'editResults': 'Edit Results',
      'discrepancyCheck': 'Discrepancy Check',
      'noOfResults': 'No. of Results',
      'fullResult': 'Full Result',
      'effDateTime': 'Effective Date & Time',
      'termDateTime': 'Termination Date & Time'
    };

    const label = fieldLabels[fieldName] || 'This field';

    if (control.hasError('required')) {
      return `${label} is required`;
    }

    if (control.hasError('invalidCharacters')) {
      return 'Only alphanumeric characters are allowed.';
    }

    if (control.hasError('invalidIsbtFormat')) {
      return 'Date must be in format DD-MMM-YYYY HH:mm (e.g., 02-FEB-2025 05:30)';
    }

    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `Maximum ${maxLength} characters allowed.`;
    }

    return '';
  }

  // Convert ISBT format (DD-MMM-YYYY HH:mm) to API format (YYYY-MM-DD HH:mm:ss)
  private convertIsbtToApiFormat(isbtDateTime: string): string {
    if (!isbtDateTime) return '';

    // Support both formats: "02-FEB-2025, 10:30" or "02-FEB-2025 10:30"
    let datePart: string;
    let timePart: string;

    if (isbtDateTime.includes(', ')) {
      [datePart, timePart] = isbtDateTime.split(', ');
    } else {
      const parts = isbtDateTime.split(' ');
      datePart = parts[0];
      timePart = parts[1];
    }

    const [day, mon, year] = datePart.split('-');
    const [hour, minute] = timePart.split(':');

    const monthMap: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };

    const monthIndex = monthMap[mon.toUpperCase()];

    return moment()
      .year(Number(year))
      .month(monthIndex)
      .date(Number(day))
      .hour(Number(hour))
      .minute(Number(minute))
      .second(0)
      .format('YYYY-MM-DD HH:mm:ss');
  }

  allowOnlyAlphanumeric(event: KeyboardEvent): void {
    // Allow control keys (Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End)
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }
    // Block if not alphanumeric (a-z, A-Z, 0-9)
    if (!/^[a-zA-Z0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  allowAlphanumericWithSpaces(event: KeyboardEvent): void {
    // Allow control keys (Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End)
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }
    // Block if not alphanumeric or space (a-z, A-Z, 0-9, space)
    if (!/^[a-zA-Z0-9 ]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onAlphanumericPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';

    // Check if pasted text contains only alphanumeric characters
    if (!/^[a-zA-Z0-9]*$/.test(pastedText)) {
      event.preventDefault();
      // Optionally show a message or just prevent paste
    }
  }

  onAlphanumericWithSpacesPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';

    // Check if pasted text contains only alphanumeric characters and spaces
    if (!/^[a-zA-Z0-9 ]*$/.test(pastedText)) {
      event.preventDefault();
      // Optionally show a message or just prevent paste
    }
  }

  // Prevent comma from being entered in datetime fields
  preventComma(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);

    // Block comma character
    if (char === ',') {
      event.preventDefault();
    }
  }

  // Get character count for Description field
  getDescriptionCharCount(): string {
    const control = this.form.get('description');
    if (!control) return '';

    const currentLength = control.value?.length || 0;
    const maxLength = 50;

    return `characters remaining: ${maxLength - currentLength}/${maxLength}`;
  }

  // Check if Description has value to show character counter
  showDescriptionCounter(): boolean {
    const control = this.form.get('description');
    return !!(control?.value && control.value.length > 0);
  }

}
