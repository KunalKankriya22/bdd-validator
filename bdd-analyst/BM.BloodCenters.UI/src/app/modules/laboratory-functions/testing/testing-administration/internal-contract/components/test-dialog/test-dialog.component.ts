import { Component, OnInit, OnDestroy, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { ContractTest, ValidTest } from '../../internal-contract.models';
import { stopLabelFlagValidator, duplicateTestIdValidator } from '../../validators/internal-contract.validators';
import { STOP_LABEL_FLAG_OPTIONS } from '../../constants/internal-contract-error-codes';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

export interface TestDialogData {
  test?: ContractTest;
  mode: 'create' | 'edit';
  validTests: ValidTest[];
  existingTestIds: string[];
}

@Component({
  selector: 'app-test-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './test-dialog.component.html',
  styleUrl: './test-dialog.component.scss'
})
export class TestDialogComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `test-dialog-${TestDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TestDialogComponent>);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  stopLabelOptions = STOP_LABEL_FLAG_OPTIONS;
  validTests: ValidTest[] = [];
  filteredTests = signal<ValidTest[]>([]);
  testSearchControl = new FormControl('');
  isEditMode = false;

  readonly today: moment.Moment;

  minDate!: moment.Moment;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  // Signal for selected test description
  readonly selectedTestDescription = signal<string>('');

  constructor(@Inject(MAT_DIALOG_DATA) public data: TestDialogData) {
    this.isEditMode = data.mode === 'edit';
    this.validTests = data.validTests;
    this.filteredTests.set(data.validTests);
    this.today = this.chapterTimezoneService.isChapterLocalDateAvailable()
      ? this.chapterTimezoneService.getChapterLocalDate()
      : moment().startOf('day');
  }

  ngOnInit(): void {
    this.initForm();
    this.setupTestSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupTestSearch(): void {
    this.testSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        const filtered = this.validTests.filter(test =>
          test.testId.toLowerCase().includes(term) ||
          test.testDescription.toLowerCase().includes(term) ||
          (test.testGroup && test.testGroup.toLowerCase().includes(term))
        );
        // Maintain sort order by TEST_GROUP and TEST_ID (already sorted from backend)
        this.filteredTests.set(filtered);
      });
  }

  private initForm(): void {
    const test = this.data.test;
    const chapterOffset = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterOffset);

    // Set initial test description if editing
    if (test?.testId) {
      const validTest = this.validTests.find(t => t.testId === test.testId);
      if (validTest) {
        this.selectedTestDescription.set(validTest.testDescription);
      }
    }

    this.form = this.fb.group({
      testId: [
        { value: test?.testId || '', disabled: this.isEditMode },
        [
          Validators.required,
          duplicateTestIdValidator(
            this.data.existingTestIds,
            this.isEditMode ? test?.testId : undefined
          )
        ]
      ],
      stopLabelFlag: [test?.stopLabelFlag || 'N', [Validators.required, stopLabelFlagValidator()]],
      effDate: [
        { value: test?.effDate ? moment(test.effDate) : null, disabled: this.isEditMode },
        [Validators.required]
      ],
      termDate: [test?.termDate ? moment(test.termDate) : null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    if (this.isEditMode) {
      DateFieldValidationUtility.setupEditModeValidators(this.form, chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, chapterOffset);
    }

    // Track which date field was last changed
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  get f() {
    return this.form.controls;
  }

  /**
   * Update test description when test is selected
   */
  onTestChange(): void {
    const testId = this.form.get('testId')?.value;
    const validTest = this.validTests.find(t => t.testId === testId);
    if (validTest) {
      this.selectedTestDescription.set(validTest.testDescription);
    } else {
      this.selectedTestDescription.set('');
    }
  }

  /**
   * Re-validate termination date when effective date changes
   */
  onEffectiveDateChange(): void {
    this.form.get('termDate')?.updateValueAndValidity();
    this.form.get('effDate')?.markAsTouched();
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
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('termDate'), this.isEditMode
    );
  }

  onSave(): void {
    const test = this.validateAndBuildTest();
    if (test) {
      this.dialogRef.close(test);
    }
  }

  onSaveAndAddAnother(): void {
    const test = this.validateAndBuildTest();
    if (test) {
      this.dialogRef.close({ test, addAnother: true });
    }
  }

  private validateAndBuildTest(): ContractTest | null {
    this.form.markAllAsTouched();

    if (!this.lastChangedDateField && this.form.errors?.['dateRangeInvalid']) {
      this.lastChangedDateField = 'termination';
    }

    const termCtrl = this.form.get('termDate');
    if (termCtrl && !termCtrl.value && !termCtrl.hasError('invalidDate') && !termCtrl.hasError('matDatepickerParse')) {
      DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    }

    if (this.form.invalid) {
      // Focus first invalid field
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return null;
    }

    const formValue = this.form.getRawValue(); // getRawValue to include disabled fields
    return {
      testId: formValue.testId,
      stopLabelFlag: formValue.stopLabelFlag,
      effDate: formValue.effDate ? moment(formValue.effDate).format('YYYY-MM-DD') : '',
      termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null,
      testDescription: this.selectedTestDescription()
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onClearAll(): void {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.form.reset({
        stopLabelFlag: 'N',
        effDate: null,
        termDate: null
      });
      this.selectedTestDescription.set('');
    }
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  formatDateTime(dateTime: string | null | undefined): string {
    if (!dateTime) return '-';
    const m = moment(dateTime);
    return m.isValid() ? m.format('DD-MMM-YYYY, HH:mm') + ' PST' : '-';
  }
}
