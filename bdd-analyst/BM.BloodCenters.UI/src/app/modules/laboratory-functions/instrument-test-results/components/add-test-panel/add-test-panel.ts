import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
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

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import {
  CreateInstrumentTestRequestDto,
  TestDropdownDto,
} from '../../models/instrument-test-results.model';

@Component({
  selector: 'app-add-test-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
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
  templateUrl: './add-test-panel.html',
  styleUrls: ['./add-test-panel.scss'],
})
export class AddTestPanelComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `add-test-panel-${AddTestPanelComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId  = (name: string) => `${this.componentId}-${name}-error`;

  @Input({ required: true }) machineId!: string;
  @Input({ required: true }) machineName!: string;

  @Output() saveSuccess = new EventEmitter<void>();
  @Output() closePanel  = new EventEmitter<void>();

  private readonly apiService      = inject(InstrumentTestResultsApiService);
  private readonly headerService   = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly fb              = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  loading  = signal(false);
  saving   = signal(false);
  submitted = signal(false);

  validTests = signal<TestDropdownDto[]>([]);

  readonly testIdSearchControl = new FormControl('');

  private readonly testIdSearch = signal('');

  readonly filteredTests = computed(() => {
    const s = this.testIdSearch().toLowerCase().trim();
    if (!s) return this.validTests();
    return this.validTests().filter(t =>
      t.testId.toLowerCase().includes(s) || t.testDesc.toLowerCase().includes(s)
    );
  });

  get selectedTestDescription(): string {
    const testId = this.form?.get('testId')?.value;
    if (!testId) return '';
    return this.validTests().find(t => t.testId === testId)?.testDesc ?? '';
  }

  minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  effDateErrorMatcher  = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private lastChangedDateField: 'effective' | 'termination' | null = null;

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

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testIdSearch.set(v ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group(
      {
        testId:        ['', [Validators.required]],
        machineTestId: ['', [Validators.required, Validators.maxLength(50)]],
        effDate:       [null, [Validators.required]],
        termDate:      [null],
      },
      {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')],
      }
    );

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });

  }

  private loadDropdowns(): void {
    this.loading.set(true);
    const chapterId = this.headerService.getCurrentChapterId() || '';
    this.apiService
      .getValidTests(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => { this.validTests.set(tests); this.loading.set(false); },
        error: () => { this.loading.set(false); },
      });
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
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

  onSubmit(createAnother: boolean = false): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) return;

    this.saving.set(true);

    const fv = this.form.value;
    const chapterId = this.headerService.getCurrentChapterId() || '';

    const dto: CreateInstrumentTestRequestDto = {
      machineId:     this.machineId,
      chapterId,
      testId:        fv.testId,
      machineTestId: fv.machineTestId?.trim() || null,
      effDate:       DateFieldValidationUtility.serializeDateForApi(fv.effDate) ?? '',
      termDate:      DateFieldValidationUtility.serializeDateForApi(fv.termDate),
    };

    this.apiService
      .createInstrumentTest(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbarService.showSuccess('Instrument test added successfully.');
          this.saveSuccess.emit();
          if (createAnother) {
            this.resetForm();
          } else {
            this.closePanel.emit();
          }
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
      '5002': 'Effective date is required.',
      '5003': 'Effective date cannot be in the past.',
      '5004': 'Termination date must be on or after effective date.',
      '5010': 'Test ID does not exist or is not currently active.',
      '5028': 'This test is already assigned to this machine.',
    };
    const errorMessage = errorMap[code] ?? message ?? 'Failed to add instrument test. Please try again.';
    const displayMessage = code ? `Error ${code}: ${errorMessage}` : errorMessage;
    this.snackbarService.showError(displayMessage);
  }

  private resetForm(): void {
    this.form.reset({ testId: '', machineTestId: '', effDate: null, termDate: null });
    this.submitted.set(false);
    this.lastChangedDateField = null;
    this.testIdSearchControl.setValue('', { emitEvent: false });
    this.testIdSearch.set('');
  }

  onCancel(): void {
    this.closePanel.emit();
  }
}
