import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { dateFormatValidator } from '@core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import {
  InstrumentTestDetailDto,
  UpdateInstrumentTestRequestDto,
} from '../../models/instrument-test-results.model';

@Component({
  selector: 'app-edit-test-panel',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatMomentDateModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './edit-test-panel.html',
  styleUrls: ['./edit-test-panel.scss'],
})
export class EditTestPanelComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `edit-test-panel-${EditTestPanelComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId   = (name: string) => `${this.componentId}-${name}-error`;

  @Input({ required: true }) testData!: InstrumentTestDetailDto;
  @Input({ required: true }) machineName!: string;

  @Output() saveSuccess = new EventEmitter<void>();
  @Output() closePanel  = new EventEmitter<void>();

  private readonly apiService             = inject(InstrumentTestResultsApiService);
  private readonly headerService          = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly snackbarService        = inject(SnackbarService);
  private readonly fb                     = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  saving          = signal(false);
  submitted       = signal(false);
  minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  effDateMin = this.minDate;

  effDateErrorMatcher  = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private originalEffDate: string | null = null;

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    if (checkDate.isBefore(this.minDate.clone().startOf('day'))) return false;
    const eff = this.form?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  form!: FormGroup;

  get lastModifiedDisplay(): string {
    const raw = this.testData.lastModifiedDate;
    if (!raw) return '';
    const m = moment.utc(raw);
    if (!m.isValid()) return '';
    const local = this.chapterTimezoneService.convertGmtToLocal(m);
    const now = this.chapterTimezoneService.getChapterLocalDate();
    const dateStr = local.isSame(now, 'day')
      ? 'Today'
      : local.format('DD-MMM-YYYY').toUpperCase();
    const tz = this.headerService.chapterTimeZone() || '';
    return `Last Modified: ${dateStr}, ${local.format('HH:mm')} ${tz}`.trim();
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const td = this.testData;
    const toMoment = (v: string | null | undefined) => (v ? moment(v) : null);

    this.originalEffDate = td.effDate
      ? moment(td.effDate).format('YYYY-MM-DD')
      : null;

    const origMoment = td.effDate ? moment(td.effDate).startOf('day') : null;
    if (origMoment && origMoment.isBefore(this.minDate, 'day')) {
      this.effDateMin = origMoment;
    }

    this.form = this.fb.group(
      {
        machineTestId: [td.machineTestId || '', [Validators.required, Validators.maxLength(50)]],
        effDate: [toMoment(td.effDate), [
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          this.editModeEffectiveDateValidator(),
        ]],
        termDate: [toMoment(td.termDate)],
      },
      {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')],
      }
    );

    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      false
    );
  }

  get f() { return this.form.controls; }

  get hasDirtyInvalidControls(): boolean {
    for (const key of Object.keys(this.form.controls)) {
      const control = this.form.get(key);
      if (control?.dirty && control?.invalid) return true;
    }
    if (this.form.errors && (this.form.get('effDate')?.dirty || this.form.get('termDate')?.dirty)) {
      return true;
    }
    return false;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) return;

    this.saving.set(true);

    const fv = this.form.getRawValue();
    const td = this.testData;

    const dto: UpdateInstrumentTestRequestDto = {
      machineTestId: fv.machineTestId?.trim() || null,
      termDate:      fv.termDate ? moment(fv.termDate).format('YYYY-MM-DD') : null,
    };

    this.apiService
      .updateInstrumentTest(td.chapterId, td.machineId, td.testId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbarService.showSuccess('Instrument test updated successfully.');
          this.saveSuccess.emit();
          this.closePanel.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.handleApiError(err);
        },
      });
  }

  private handleApiError(err: any): void {
    const code    = err?.error?.errorCode || err?.error?.errorResponse?.errorCode;
    const message = err?.error?.errorResponse?.error || err?.error?.message;
    const errorMap: Record<string, string> = {
      '3115': 'Termination date cannot be in the past.',
      '5002': 'Effective date is required.',
      '5003': 'Effective date cannot be in the past.',
      '5004': 'Termination date must be on or after effective date.',
      '5429': 'Record not found. It may have been deleted.',
    };
    const errorMessage = errorMap[code] ?? message ?? 'Failed to update instrument test. Please try again.';
    const displayMessage = code ? `Error ${code}: ${errorMessage}` : errorMessage;
    this.snackbarService.showError(displayMessage);
  }

  private editModeEffectiveDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selected = moment(control.value);
      if (!selected.isValid()) return null;

      const selectedStr = selected.format('YYYY-MM-DD');
      if (this.originalEffDate && selectedStr === this.originalEffDate) return null;

      const today = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
      if (selected.isBefore(today, 'day')) {
        return { effectiveDatePast: true };
      }
      return null;
    };
  }

  onClearAll(): void {
    const td = this.testData;
    this.form.reset({
      machineTestId: td.machineTestId || '',
      effDate:       td.effDate ? moment(td.effDate) : null,
      termDate:      td.termDate ? moment(td.termDate) : null,
    });
    this.submitted.set(false);
    this.lastChangedDateField = null;
  }

  onCancel(): void {
    this.closePanel.emit();
  }
}
