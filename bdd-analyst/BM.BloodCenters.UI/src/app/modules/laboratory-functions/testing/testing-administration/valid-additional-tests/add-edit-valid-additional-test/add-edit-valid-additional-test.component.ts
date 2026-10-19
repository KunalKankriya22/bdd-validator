import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import {
  ValidAdditionalTestDto,
  ValidAdditionalTestFormValue,
  ValidTestDropdownDto,
} from '../models/valid-additional-tests.model';

@Component({
  selector: 'app-add-edit-valid-additional-test',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-valid-additional-test.component.html',
  styleUrls: ['./add-edit-valid-additional-test.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditValidAdditionalTestComponent implements OnInit, OnChanges, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `add-edit-valid-additional-test-${AddEditValidAdditionalTestComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidAdditionalTestDto | null = null;
  @Input() testOptions: ValidTestDropdownDto[] = [];

  @Output() save = new EventEmitter<ValidAdditionalTestFormValue>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  minDate: Moment;
  terminationMinDate: Moment;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupModeValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['mode']) && this.form) {
      this.reinitializeForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getChapterMinDate(): Moment {
    return moment().startOf('day');
  }

  private setupModeValidators(): void {
    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
  }

  private reinitializeForm(): void {
    this.isSubmitting = false;
    this.errorMessage = null;

    this.form.get('testId')?.enable();
    this.form.get('testDesc')?.enable();

    this.form.reset({
      testId: this.data?.testId || null,
      testDesc: this.data?.testDesc || null,
      effDate: this.data?.effDate ? moment(this.data.effDate) : null,
      termDate: this.data?.termDate ? moment(this.data.termDate) : null,
    });

    if (this.mode === 'edit') {
      this.form.get('testId')?.disable();
      this.form.get('testDesc')?.disable();
    }

    this.form.clearValidators();
    this.form.addValidators(DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'));

    const effControl = this.form.get('effDate');
    if (effControl) {
      effControl.clearValidators();
      effControl.addValidators(Validators.required);
    }

    const termControl = this.form.get('termDate');
    if (termControl) {
      termControl.clearValidators();
    }

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    this.updateTerminationMinDate();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      testId: [
        this.data?.testId || null,
        [Validators.required, Validators.maxLength(10)]
      ],
      testDesc: [
        { value: this.data?.testDesc || null, disabled: true }
      ],
      effDate: [
        this.data?.effDate ? moment(this.data.effDate) : null,
        [Validators.required]
      ],
      termDate: [
        this.data?.termDate ? moment(this.data.termDate) : null
      ],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    if (this.mode === 'edit') {
      this.form.get('testId')?.disable();
      this.form.get('testDesc')?.disable();
    }
  }

  private setupDateValidationListeners(): void {
    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.form.get('termDate')?.updateValueAndValidity();
      });
  }

  private updateTerminationMinDate(): void {
    const effDate = this.form.get('effDate')?.value;
    if (effDate && moment.isMoment(effDate)) {
      this.terminationMinDate = moment.max(this.minDate, effDate);
    } else {
      this.terminationMinDate = this.minDate;
    }
    this.cdr.markForCheck();
  }

  onTestIdChange(testId: string | null): void {
    if (!testId) {
      this.form.patchValue({ testDesc: null });
      return;
    }

    const selectedTest = this.testOptions.find(t => t.testId === testId);
    if (selectedTest) {
      this.form.patchValue({ testDesc: selectedTest.testDesc });
    }
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effDate');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Effective Date is required';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Effective Date cannot be earlier than today';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('termDate');
    if (!control) return '';

    const hasInteracted = this.mode === 'edit' ? control.dirty : (control.touched || control.dirty);
    if (!hasInteracted) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    if (control.hasError('terminationBeforeEffective')) {
      return 'Termination Date must be on or after Effective Date';
    }

    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      const termControl = this.form.get('termDate');
      const wasTermDateInteracted = termControl?.touched || termControl?.dirty;

      this.form.markAllAsTouched();

      if (this.mode === 'edit' && !wasTermDateInteracted) {
        termControl?.markAsUntouched();
      }

      this.cdr.markForCheck();
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formValue: ValidAdditionalTestFormValue = {
      testId: this.form.get('testId')?.value,
      testDesc: this.form.get('testDesc')?.value,
      effDate: this.form.get('effDate')?.value,
      termDate: this.form.get('termDate')?.value,
    };

    this.save.emit(formValue);
  }

  onCancel(): void {
    this.close.emit();
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  get titleText(): string {
    return this.mode === 'add' ? 'Add Valid Additional Test' : 'Edit Valid Additional Test';
  }
}
