import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { InterdictionCode, CreateInterdictionsRequest } from '../models/unit-interdiction.model';
import { UnitInterdictionService } from '../services/unit-interdiction.service';

export interface AddEditInterdictionDialogData {
  mode: 'add';
  transactionId: string;
  currentUserId: string;
  interdictionCodes: InterdictionCode[];
}

export interface AddInterdictionResult {
  success: boolean;
  code?: string;
}

@Component({
  selector: 'app-add-edit-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-edit-interdiction.html',
  styleUrls: ['./add-edit-interdiction.scss']
})
export class AddEditInterdictionComponent implements OnInit, OnDestroy {
  @ViewChild('terminationDateInput', { read: ElementRef }) terminationDateInput!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private service = inject(UnitInterdictionService);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<AddEditInterdictionComponent>);
  readonly data = inject<AddEditInterdictionDialogData>(MAT_DIALOG_DATA);
  private dateAdapter = inject(DateAdapter);
  private destroy$ = new Subject<void>();

  interdictionForm!: FormGroup;
  interdictionCodes: InterdictionCode[] = [];
  filteredInterdictionCodes: InterdictionCode[] = [];
  codeSearchControl = new FormControl('');
  selectedCodeDescription = '';
  selectedCodeType = '';
  today!: Date;
  minDate = DateFieldValidationUtility.getMinDate();
  isSaving = false;
  hasCreatedRecords = false;

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      return (control.touched || control.dirty) && !!this.getTerminationDateError();
    }
  };

  get dialogTitle(): string {
    return 'Add New Interdiction';
  }

  ngOnInit(): void {
    // Get chapter local date as today
    this.today = this.chapterTimezoneService.getChapterLocalDate().toDate();

    this.initializeForm();
    this.setupCodeSearch();

    // Use preloaded codes from dialog data
    this.interdictionCodes = this.data.interdictionCodes || [];
    this.filteredInterdictionCodes = this.interdictionCodes;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.interdictionForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(5)]],
      terminationDate: [null],
      comments: ['', Validators.maxLength(240)]
    });

    this.interdictionForm.get('code')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => {
        this.onCodeChange(code);
      });
  }


  private setupCodeSearch(): void {
    this.codeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterCodes();
      });
  }

  private filterCodes(): void {
    const searchTerm = (this.codeSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredInterdictionCodes = this.interdictionCodes;
    } else {
      this.filteredInterdictionCodes = this.interdictionCodes.filter(code =>
        code.code.toLowerCase().includes(searchTerm) ||
        code.description.toLowerCase().includes(searchTerm)
      );
    }
  }

  private onCodeChange(code: string): void {
    const selectedCode = this.interdictionCodes.find(c => c.code === code);
    if (selectedCode) {
      this.selectedCodeDescription = selectedCode.description;
      this.selectedCodeType = selectedCode.type;
    } else {
      this.selectedCodeDescription = '';
      this.selectedCodeType = '';
    }
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.interdictionForm.controls)
      .find(key => this.interdictionForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onSave(createAnother = false): void {
    this.interdictionForm.markAllAsTouched();

    if (this.interdictionForm.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.interdictionForm.value;
    this.isSaving = true;

    const request: CreateInterdictionsRequest = {
      transactionId: this.data.transactionId,
      interdictions: [{
        interCode: formValue.code,
        termDate: formValue.terminationDate
          ? this.formatDateForApi(formValue.terminationDate)
          : null,
        comments: formValue.comments || undefined
      }]
    };

    this.service.createInterdictions(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          this.hasCreatedRecords = true;

          this.snackBar.open(`New Interdiction ${formValue.code} added successfully.`, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          if (createAnother) {
            // Reset form and keep dialog open
            this.interdictionForm.reset();
            this.selectedCodeDescription = '';
            this.selectedCodeType = '';
          } else {
            // Close dialog with success result
            this.dialogRef.close({ success: true, code: formValue.code });
          }
        },
        error: (error) => {
          // Handle errors (including success: false responses with error codes)
          // HTTP errors wrap the response in error.error
          const errorBody = error?.error || error;
          let errorMessage = errorBody?.message || errorBody?.error || error?.message || 'Failed to add interdiction';

          // Append error code to message if it exists
          const errorCode = errorBody?.errorCode || error?.errorCode;
          if (errorCode) {
            errorMessage = `Error ${errorCode}: ${errorMessage}`;
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onCancel(): void {
    // If any records were created during this session, return success to trigger parent refresh
    if (this.hasCreatedRecords) {
      this.dialogRef.close({ success: true });
    } else {
      this.dialogRef.close();
    }
  }

  onTerminationDateInput(): void {
    const control = this.interdictionForm.get('terminationDate');
    const inputElement = this.terminationDateInput?.nativeElement;
    const inputValue = inputElement?.value?.trim() || '';

    if (!control) return;

    // Mark as touched and dirty to show errors immediately
    control.markAsTouched();
    control.markAsDirty();

    if (!inputValue) {
      // Clear errors if input is empty
      if (control.hasError('pastDate') || control.hasError('invalidDate')) {
        control.setErrors(null);
      }
      return;
    }

    // Try to parse the input
    const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
      ? DD_MON_YYYY_FORMATS.parse.dateInput
      : [DD_MON_YYYY_FORMATS.parse.dateInput];

    const parsed = this.dateAdapter.parse(inputValue, formats);

    if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
      const chapterToday = this.chapterTimezoneService.getChapterLocalDate().startOf('day');
      if (parsed.isBefore(chapterToday)) {
        control.setErrors({ pastDate: true });
      } else {
        // Clear past date error if date is valid and not in the past
        if (control.hasError('pastDate')) {
          control.setErrors(null);
        }
      }
    }
  }

  onTerminationDateChange(event: any): void {
    const control = this.interdictionForm.get('terminationDate');
    if (!control) return;

    const selectedDate = event.value;
    if (selectedDate && moment.isMoment(selectedDate)) {
      const chapterToday = this.chapterTimezoneService.getChapterLocalDate().startOf('day');
      if (selectedDate.isBefore(chapterToday)) {
        control.setErrors({ pastDate: true });
      }
    }
  }

  onTerminationDateBlur(): void {
    // Trigger validation after blur to ensure Material datepicker has parsed the input
    setTimeout(() => {
      const control = this.interdictionForm.get('terminationDate');
      const inputElement = this.terminationDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      // Mark as touched to ensure error state is displayed
      control?.markAsTouched();

      const chapterToday = this.chapterTimezoneService.getChapterLocalDate().startOf('day');

      // If there's input text but no parsed value, try to manually parse it
      if (inputValue && !control?.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = this.dateAdapter.parse(inputValue, formats);

        if (parsed && moment.isMoment(parsed) && parsed.isValid()) {
          // Check if the date is in the past using chapter local date
          if (parsed.isBefore(chapterToday)) {
            control?.setErrors({ pastDate: true });
          } else {
            // Successfully parsed and valid future date - set the value
            control?.setValue(parsed);
          }
        } else {
          // Invalid date input - set custom error
          control?.setErrors({ invalidDate: true });
        }
      } else if (control?.value) {
        // If there's already a value, check if it's in the past using chapter local date
        const dateValue = moment.isMoment(control.value) ? control.value : moment(control.value);
        if (dateValue.isValid() && dateValue.isBefore(chapterToday)) {
          control?.setErrors({ pastDate: true });
        }
      }
    }, 100);
  }

  getTerminationDateError(): string {
    const control = this.interdictionForm.get('terminationDate');
    if (!control) return '';

    // Check for past date error
    if (control.hasError('pastDate')) {
      return 'Termination Date cannot be in the past';
    }

    // Check for custom invalid date error
    if (control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    // Check for parse errors
    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    // Check if the native input has text but control value is null (unparseable input)
    const inputElement = this.terminationDateInput?.nativeElement;
    const hasInputValue = inputElement && inputElement.value && inputElement.value.trim() !== '';
    if (hasInputValue && !control.value) {
      return 'Termination Date is invalid';
    }

    return '';
  }

  private formatDateForApi(date: Date | moment.Moment): string {
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
