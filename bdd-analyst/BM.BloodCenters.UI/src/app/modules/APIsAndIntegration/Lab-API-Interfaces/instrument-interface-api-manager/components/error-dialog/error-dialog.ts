import { Component, Inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatMomentDateModule, MomentDateAdapter } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { ErrorCode, MachineTestId } from '../../models/instrument-interface.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import moment, { Moment } from 'moment';

// Custom DateAdapter to use chapter timezone for "today"
class ChapterTimezoneDateAdapter extends MomentDateAdapter {
  private chapterMinDate: Moment | null = null;

  setChapterMinDate(date: Moment): void {
    this.chapterMinDate = date;
  }

  override today(): Moment {
    // Return chapter timezone's current date instead of browser's local date
    return this.chapterMinDate ? this.chapterMinDate.clone() : moment();
  }

  override format(date: Moment, displayFormat: string): string {
    const formatted = super.format(date, displayFormat);
    return formatted.toUpperCase();
  }
}

@Component({
  selector: 'app-error-dialog',
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
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterTimezoneDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './error-dialog.html',
  styleUrls: ['./error-dialog.scss'],
})
export class ErrorDialog implements OnDestroy {
  errorForm: FormGroup;
  mode: 'add' | 'edit';
  minDate!: Moment;

  // Minimum date for termination datepicker: max(effectiveDate, today)
  get terminationMinDate(): Moment {
    const effectiveDate = this.errorForm.get('effDate')?.value;
    if (effectiveDate) {
      const effMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
      return effMoment.isAfter(this.minDate) ? effMoment : this.minDate;
    }
    return this.minDate;
  }

  machineTestIds = signal<MachineTestId[]>([]);

  skipAbortOptions = signal<{ value: string; label: string }[]>([
    { value: 'S', label: 'Skip' },
    { value: 'A', label: 'Abort' }
  ]);

  // Search form controls for dropdowns
  readonly machineTestIdSearchControl = new FormControl('');

  // Convert search FormControl value to signal for reactivity
  readonly machineTestIdSearch = signal('');

  readonly filteredMachineTestIds = computed(() => {
    const search = this.machineTestIdSearch().toLowerCase();
    const options = this.machineTestIds();

    if (!search) return options;
    return options.filter(item => item.machineTestId.toLowerCase().includes(search));
  });

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      mode: 'add' | 'edit';
      errorCode?: ErrorCode;
      machineTestIds?: MachineTestId[];
      chapterId?: string;
      instrumentId?: string;
    },
    private dialogRef: MatDialogRef<ErrorDialog>,
    private fb: FormBuilder,
    private headerService: HeaderService,
    private dateAdapter: DateAdapter<Moment>
  ) {
    this.mode = data.mode;

    // Get chapter timezone and set minDate based on chapter date
    const chapterTimezone = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);

    // Set chapter timezone's current date as "today" for the datepicker
    if (this.dateAdapter instanceof ChapterTimezoneDateAdapter) {
      this.dateAdapter.setChapterMinDate(this.minDate);
    }

    // Set machine test IDs from parent or use empty array
    if (data.machineTestIds && data.machineTestIds.length > 0) {
      this.machineTestIds.set(data.machineTestIds);
    }

    const effDateValidators = this.mode === 'edit'
      ? [Validators.required, this.dirtyOnlyPastDateValidator('effectiveDatePast', chapterTimezone)]
      : [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(chapterTimezone)];

    const termDateValidators = this.mode === 'edit'
      ? [this.dirtyOnlyPastDateValidator('terminationDatePast', chapterTimezone)]
      : [DateFieldValidationUtility.terminationDateNotPastValidator(chapterTimezone)];

    this.errorForm = this.fb.group({
      machineTestId: [data.errorCode?.machineTestId || '', Validators.required],
      errorCode: [data.errorCode?.errorCode || '', [Validators.required, Validators.maxLength(10)]],
      errorDesc: [data.errorCode?.errorDesc || '', [Validators.required, Validators.maxLength(250)]],
      skipLevel: [data.errorCode?.skipLevel || '', Validators.required],
      effDate: [
        data.errorCode?.effDate ? moment(data.errorCode.effDate) : null,
        effDateValidators,
      ],
      termDate: [
        data.errorCode?.termDate ? moment(data.errorCode.termDate) : null,
        termDateValidators,
      ],
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    if (this.mode === 'edit') {
      this.errorForm.get('machineTestId')?.disable();
      this.errorForm.get('errorCode')?.disable();
    }

    // Subscribe to search control changes and update signals
    this.machineTestIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.machineTestIdSearch.set(value || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add New Error' : 'Edit Error';
  }

  get submitButtonText(): string {
    return this.mode === 'add' ? 'ADD' : 'SAVE';
  }

  onSubmit(): void {
    if (this.errorForm.invalid) {
      this.errorForm.markAllAsTouched();
      return;
    }

    // Use getRawValue() to include disabled fields in edit mode
    const formValue = this.errorForm.getRawValue();
    const result: ErrorCode = {
      ...this.data.errorCode,
      chapterId: this.data.chapterId,
      machineId: this.data.instrumentId,
      machineTestId: formValue.machineTestId,
      errorCode: formValue.errorCode,
      errorDesc: formValue.errorDesc,
      skipLevel: formValue.skipLevel,
      programId: 'IIAPIMGR',
      effDate: formValue.effDate && moment.isMoment(formValue.effDate)
        ? formValue.effDate.format('YYYY-MM-DD')
        : (formValue.effDate ? moment(formValue.effDate).format('YYYY-MM-DD') : ''),
      termDate: formValue.termDate && moment.isMoment(formValue.termDate)
        ? formValue.termDate.format('YYYY-MM-DD')
        : (formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : ''),
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateErrorMessage(
      this.errorForm.get('effDate'),
      this.errorForm.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getTerminationDateErrorMessage(
      this.errorForm.get('termDate'),
      this.errorForm.errors
    );
  }

  private dirtyOnlyPastDateValidator(errorKey: string, chapterTimezone?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.dirty) return null;

      const value = control.value;
      if (!value) return null;

      const selectedDate = moment.isMoment(value) ? value : moment(value);
      if (!selectedDate.isValid()) return null;

      const today = DateFieldValidationUtility.getMinDate(chapterTimezone);
      if (selectedDate.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
        return { [errorKey]: true };
      }

      return null;
    };
  }

}
