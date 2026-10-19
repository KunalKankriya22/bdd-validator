import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, Input, Output, EventEmitter, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import moment from 'moment';

import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { AuditFilterCriteria } from '../../models/donor-profile-audit-query.model';

export interface FilterDialogData {
  currentFilters: AuditFilterCriteria;
  insertedUsers: string[];
}

export interface FilterPanelData {
  currentFilters: AuditFilterCriteria;
  insertedUsers: string[];
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.scss']
})
export class FilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  @Optional() private readonly dialogRef = inject(MatDialogRef<FilterPanel>, { optional: true});
  @Optional() private readonly dialogData = inject<FilterDialogData>(MAT_DIALOG_DATA, { optional: true });

  // Input/Output for CDK Overlay mode
  @Input() currentFilters: AuditFilterCriteria = {};
  @Input() insertedUsers: string[] = [];
  @Output() apply = new EventEmitter<AuditFilterCriteria>();
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  @ViewChild('fromDateInput', { read: ElementRef }) fromDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput', { read: ElementRef }) toDateInput!: ElementRef<HTMLInputElement>;

  filterForm!: FormGroup;

  insertedUserOptions = signal<Array<{ value: string; label: string }>>([]);

  fromDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      // Check for form-level errors
      if (control.parent?.hasError('fromDateAfterToDate') || control.parent?.hasError('toDateRequiresFromDate')) {
        return true;
      }
      const inputValue = this.fromDateInput?.nativeElement?.value;
      return !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  toDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      // Check for form-level errors
      if (control.parent?.hasError('fromDateAfterToDate') || control.parent?.hasError('toDateRequiresFromDate')) {
        return true;
      }
      const inputValue = this.toDateInput?.nativeElement?.value;
      return !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    // Support both Dialog mode and Input mode
    const filters = this.dialogData?.currentFilters || this.currentFilters;
    const users = this.dialogData?.insertedUsers || this.insertedUsers;

    if (filters) {
      this.filterForm.patchValue({
        insertedUser: filters.insertedUser || '',
        fromDate: filters.fromDate || null,
        toDate: filters.toDate || null
      });
    }

    this.updateInsertedUserOptions(users);
    this.setupDateValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      insertedUser: [''],
      fromDate: [null, [DateFieldValidationUtility.validDateValidator(), this.notFutureDateValidator.bind(this)]],
      toDate: [null, [DateFieldValidationUtility.validDateValidator(), this.notFutureDateValidator.bind(this)]]
    }, {
      validators: [this.fromDateToDateValidator.bind(this), this.toDateRequiresFromDateValidator.bind(this)]
    });
  }

  // Validator: Date cannot be in the future (uses chapter local date from backend)
  private notFutureDateValidator(control: FormControl): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const selectedDate = value;
    if (!selectedDate || !selectedDate.isValid || !selectedDate.isValid()) return null;

    // Get today's date in the chapter's timezone from the backend
    // The backend calculates the exact current date/time in the chapter's timezone
    const today = this.chapterTimezoneService.getChapterLocalDate();

    // Compare just the date part (YYYY-MM-DD)
    const selected = selectedDate.clone().startOf('day');

    if (selected.isAfter(today)) {
      return { futureDate: true };
    }

    return null;
  }

  // Validator: From Date must be <= To Date
  private fromDateToDateValidator(formGroup: FormGroup): { [key: string]: any } | null {
    const fromDate = formGroup.get('fromDate')?.value;
    const toDate = formGroup.get('toDate')?.value;

    if (!fromDate || !toDate) return null;
    if (!fromDate.isValid || !fromDate.isValid() || !toDate.isValid || !toDate.isValid()) return null;

    // Compare just the date parts
    const from = fromDate.clone().startOf('day');
    const to = toDate.clone().startOf('day');

    if (from.isAfter(to)) {
      return { fromDateAfterToDate: true };
    }

    return null;
  }

  // Validator: From Date is required when To Date is entered
  private toDateRequiresFromDateValidator(formGroup: FormGroup): { [key: string]: any } | null {
    const fromDate = formGroup.get('fromDate')?.value;
    const toDate = formGroup.get('toDate')?.value;

    if (toDate && !fromDate) {
      return { toDateRequiresFromDate: true };
    }

    return null;
  }

  private setupDateValidation(): void {
    this.filterForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDateInput('fromDate', this.fromDateInput);
        // Trigger validation on toDate when fromDate changes (for form-level validators)
        this.filterForm.get('toDate')?.updateValueAndValidity({ emitEvent: false });
      });

    this.filterForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDateInput('toDate', this.toDateInput);
        // Trigger validation on fromDate when toDate changes (for form-level validators)
        this.filterForm.get('fromDate')?.updateValueAndValidity({ emitEvent: false });
      });
  }

  private updateInsertedUserOptions(users: string[]): void {
    const options = [
      { value: '', label: 'All' },
      ...users.map(user => ({ value: user, label: user }))
    ];
    this.insertedUserOptions.set(options);
  }

  onFromDateBlur(): void {
    setTimeout(() => {
      const control = this.filterForm.get('fromDate');
      control?.markAsTouched();
      this.validateDateInput('fromDate', this.fromDateInput);
      control?.updateValueAndValidity();

      // Show snackbar error on blur if invalid
      if (control?.invalid && !control?.hasError('matDatepickerParse')) {
        const error = this.getFromDateError();
        if (error) {
          this.snackbarService.showError(error);
        }
      }
    }, 0);
  }

  onToDateBlur(): void {
    setTimeout(() => {
      const control = this.filterForm.get('toDate');
      control?.markAsTouched();
      this.validateDateInput('toDate', this.toDateInput);
      control?.updateValueAndValidity();

      // Show snackbar error on blur if invalid
      if (control?.invalid && !control?.hasError('matDatepickerParse')) {
        const error = this.getToDateError();
        if (error) {
          this.snackbarService.showError(error);
        }
      }
    }, 0);
  }

  getFromDateError(): string {
    const control = this.filterForm.get('fromDate');
    if (!control || !(control.touched || control.dirty)) return '';

    // Check field-level errors FIRST (highest priority)
    if (control.hasError('futureDate')) {
      return 'From Date cannot be greater than current date';
    }

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'From Date is invalid';
    }

    const inputValue = this.fromDateInput?.nativeElement?.value;
    if (!control.value && inputValue && inputValue.trim().length > 0) {
      return 'From Date is invalid';
    }

    // Then check form-level errors
    if (this.filterForm.hasError('fromDateAfterToDate')) {
      return 'From Date cannot be greater than To Date';
    }
    if (this.filterForm.hasError('toDateRequiresFromDate')) {
      return 'From Date is required when To Date is entered';
    }

    return '';
  }

  getToDateError(): string {
    const control = this.filterForm.get('toDate');
    if (!control || !(control.touched || control.dirty)) return '';

    // Check field-level errors FIRST (highest priority)
    if (control.hasError('futureDate')) {
      return 'To Date cannot be greater than current date';
    }

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'To Date is invalid';
    }

    const inputValue = this.toDateInput?.nativeElement?.value;
    if (!control.value && inputValue && inputValue.trim().length > 0) {
      return 'To Date is invalid';
    }

    // Then check form-level errors
    if (this.filterForm.hasError('toDateRequiresFromDate')) {
      return 'From Date is required when To Date is entered';
    }
    if (this.filterForm.hasError('fromDateAfterToDate')) {
      return 'To Date cannot be less than From Date';
    }

    return '';
  }

  private validateDateInput(controlName: string, inputRef: ElementRef<HTMLInputElement>): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputRef?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  onApply(): void {
    // Mark all fields as touched AND dirty to show validation errors
    Object.keys(this.filterForm.controls).forEach(key => {
      const control = this.filterForm.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
    });

    // Force re-validation
    this.filterForm.updateValueAndValidity();

    // Check for any validation errors
    if (this.filterForm.invalid || this.getFromDateError() || this.getToDateError()) {
      this.focusFirstInvalidField();
      return;
    }

    const form = this.filterForm.getRawValue();

    const filters: AuditFilterCriteria = {};

    if (form.insertedUser?.trim()) {
      filters.insertedUser = form.insertedUser.trim();
    }
    if (form.fromDate) {
      filters.fromDate = DateFieldValidationUtility.serializeDateForApi(form.fromDate) || undefined;
    }
    if (form.toDate) {
      filters.toDate = DateFieldValidationUtility.serializeDateForApi(form.toDate) || undefined;
    }

    // Support both Dialog mode and Overlay mode
    if (this.dialogRef) {
      this.dialogRef.close(filters);
    } else {
      this.apply.emit(filters);
    }
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.filterForm.controls)
      .find(key => this.filterForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onClearAll(): void {
    this.filterForm.reset({
      insertedUser: '',
      fromDate: null,
      toDate: null
    });
  }

  onClose(): void {
    // Support both Dialog mode and Overlay mode
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.close.emit();
    }
  }

  get f() {
    return this.filterForm.controls;
  }
}
