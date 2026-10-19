import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

import {
  CreateAssociationRequest,
  InterdictionCodeOption,
  DonationTypeOption,
  LetterCodeOption
} from '../../models/associate-letter.model';

export interface LinkLetterDialogData {
  interdictionCodeOptions: InterdictionCodeOption[];
  donationTypeOptions: DonationTypeOption[];
  letterCodeOptions: LetterCodeOption[];
  onSaveCallback?: (request: CreateAssociationRequest) => void;
}

@Component({
  selector: 'app-link-letter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './link-letter-dialog.component.html',
  styleUrls: ['./link-letter-dialog.component.scss']
})
export class LinkLetterDialogComponent implements OnInit, OnDestroy {
  linkForm: FormGroup;
  interdictionCodeOptions: InterdictionCodeOption[] = [];
  donationTypeOptions: DonationTypeOption[] = [];
  letterCodeOptions: LetterCodeOption[] = [];

  // Descriptions
  interdictionDescription = '-';
  donationDescription = '-';

  // Date validation
  private destroy$ = new Subject<void>();
  minDate = DateFieldValidationUtility.getMinDate();
  private lastChangedDateField: 'effective' | 'termination' | null = null;
  effectiveDateError = '';
  terminationDateError = '';

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.effectiveDateError);
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.terminationDateError);

  /** Termination date filter: not before today and not before Effective Date */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.startOf('day');

    // Prevent dates before today
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Prevent dates before effective date
    const eff = this.linkForm?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<LinkLetterDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: LinkLetterDialogData
  ) {
    this.interdictionCodeOptions = data.interdictionCodeOptions;
    this.donationTypeOptions = data.donationTypeOptions;
    this.letterCodeOptions = data.letterCodeOptions;

    this.linkForm = this.fb.group({
      interdictionCode: ['', Validators.required],
      donationType: ['', Validators.required],
      letterId: ['', Validators.required],
      effectiveDate: [new Date(), Validators.required],
      terminationDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });

    // Watch for interdiction code changes
    this.linkForm.get('interdictionCode')?.valueChanges.subscribe(code => {
      const option = this.interdictionCodeOptions.find(o => o.code === code);
      this.interdictionDescription = option?.description || '-';
    });

    // Watch for donation type changes
    this.linkForm.get('donationType')?.valueChanges.subscribe(code => {
      const option = this.donationTypeOptions.find(o => o.code === code);
      this.donationDescription = option?.description || '-';
    });
  }

  ngOnInit(): void {
    this.setupFormData();
    this.setupFormSubscriptions();
    this.updateDateErrors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormData(): void {
    // Setup add mode validators for date fields
    DateFieldValidationUtility.setupAddModeValidators(this.linkForm);
  }

  private setupFormSubscriptions(): void {
    // Track which date field was last changed for cross-field error display
    this.linkForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
      });

    this.linkForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });

    // Update date errors when form validation state changes
    this.linkForm.statusChanges
      .pipe(debounceTime(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDateErrors();
      });
  }

  private updateDateErrors(): void {
    const effFormErrors = this.lastChangedDateField === 'effective' ? this.linkForm.errors : null;
    this.effectiveDateError = DateFieldValidationUtility.getStartDateCrossFieldError(
      this.linkForm.get('effectiveDate'), 'Effective date', 'Termination date', effFormErrors
    );

    const termFormErrors = this.lastChangedDateField === 'termination' ? this.linkForm.errors : null;
    this.terminationDateError = DateFieldValidationUtility.getEndDateCrossFieldError(
      this.linkForm.get('terminationDate'), 'Termination date', 'Effective date', termFormErrors
    );
  }

  onSave(createAnother: boolean = false): void {
    if (this.linkForm.valid) {
      const request: CreateAssociationRequest = {
        interdictionCode: this.linkForm.value.interdictionCode,
        donationType: this.linkForm.value.donationType,
        letterId: this.linkForm.value.letterId,
        effectiveDate: this.formatDate(this.linkForm.value.effectiveDate),
        terminationDate: this.linkForm.value.terminationDate
          ? this.formatDate(this.linkForm.value.terminationDate)
          : undefined
      };

      if (createAnother) {
        // Call the save callback from parent component
        if (this.data.onSaveCallback) {
          this.data.onSaveCallback(request);
        }

        // Show success message
        this.snackBar.open('Association created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });

        // Reset the form for the next entry - keep the dialog open
        this.linkForm.reset();
        this.linkForm.markAsUntouched();
        this.linkForm.markAsPristine();
      } else {
        // Regular save - close the dialog
        this.dialogRef.close(request);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
