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
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
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
  InstrumentResultDto,
  UpdateInstrumentResultDto,
} from '../../models/instrument-test-results.model';

@Component({
  selector: 'app-edit-result-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatMomentDateModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './edit-result-panel.html',
  styleUrls: ['./edit-result-panel.scss'],
})
export class EditResultPanelComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `edit-result-panel-${EditResultPanelComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  @Input({ required: true }) resultData!: InstrumentResultDto;

  @Output() saveSuccess = new EventEmitter<void>();
  @Output() closePanel = new EventEmitter<void>();

  private readonly apiService = inject(InstrumentTestResultsApiService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  saving = signal(false);
  submitted = signal(false);

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
    const raw = this.resultData.lastModifiedDate;
    if (!raw) return '';
    const m = moment.utc(raw);
    if (!m.isValid()) return '';
    const local = this.chapterTimezoneService.convertGmtToLocal(m);
    const now = this.chapterTimezoneService.getChapterLocalDate();
    const dateStr = local.isSame(now, 'day')
      ? 'Today'
      : local.format('DD-MMM-YYYY').toUpperCase();
    return `Last Modified: ${dateStr}, ${local.format('HH:mm')} ${this.headerService.chapterTimeZone() || ''}`.trim();
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const rd = this.resultData;
    const toMoment = (v: string | null | undefined) => (v ? moment(v) : null);

    this.originalEffDate = rd.effDate
      ? moment(rd.effDate).format('YYYY-MM-DD')
      : null;

    const origMoment = rd.effDate ? moment(rd.effDate).startOf('day') : null;
    if (origMoment && origMoment.isBefore(this.minDate, 'day')) {
      this.effDateMin = origMoment;
    }

    this.form = this.fb.group(
      {
        machineResultStatus: [rd.machineResultStatus || '', [Validators.required, Validators.maxLength(12)]],
        effDate: [toMoment(rd.effDate), [
          Validators.required,
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          this.editModeEffectiveDateValidator(),
        ]],
        termDate: [toMoment(rd.termDate)],
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
      true
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
    const rd = this.resultData;

    const dto: UpdateInstrumentResultDto = {
      machineResultStatus: fv.machineResultStatus?.trim() ?? '',
      effDate: DateFieldValidationUtility.serializeDateForApi(fv.effDate) ?? '',
      termDate: DateFieldValidationUtility.serializeDateForApi(fv.termDate),
    };

    this.apiService
      .updateInstrumentResult(rd.chapterId, rd.machineId, rd.testId, rd.resultStatus, dto)
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
    const code = err?.error?.errorCode || err?.error?.errorResponse?.errorCode;
    const message = err?.error?.errorResponse?.error || err?.error?.message;
    const errorMap: Record<string, string> = {
      '5002': 'Effective date is required.',
      '5003': 'Effective date cannot be in the past.',
      '5004': 'Termination date must be on or after effective date.',
      '5010': 'Test ID does not exist or is not currently active.',
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
    const rd = this.resultData;
    this.form.reset({
      machineResultStatus: rd.machineResultStatus || '',
      effDate: rd.effDate ? moment(rd.effDate) : null,
      termDate: rd.termDate ? moment(rd.termDate) : null,
    });
    this.submitted.set(false);
    this.lastChangedDateField = null;
  }

  onCancel(): void {
    this.closePanel.emit();
  }
}
