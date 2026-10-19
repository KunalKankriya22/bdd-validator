import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { ErrorStateMatcher, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

export interface QuestionFilterValue {
  sex: string | null;
  responseType: string | null;
  effDatePeriod: string | null;
  effDate: any | null;
  termDatePeriod: string | null;
  termDate: any | null;
}

@Component({
  selector: 'app-question-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './question-filter-panel.html',
  styleUrls: ['./question-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: QuestionFilterValue | null = null;
  @Input() responseTypeOptions: string[] = [];
  @Output() apply = new EventEmitter<QuestionFilterValue>();
  @Output() clearAll = new EventEmitter<QuestionFilterValue>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  filterForm!: FormGroup;
  hasChanges = false;
  hasActiveFilters = false;
  periodOptions = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];
  responseTypeLabels: Record<string, string> = { S: 'Single', M: 'Multiple', C: 'Comment', R: 'Ranking' };

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effDateNativeInput);
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.termDateNativeInput);
    }
  };

  private appliedFilterSnapshot!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      sex: [this.currentFilters?.sex || null],
      responseType: [this.currentFilters?.responseType || null],
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.currentFilters?.effDate || null],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.currentFilters?.termDate || null]
    });

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasActiveFilters = this.checkHasActiveFilters();

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasChanges = this.normalizeFormValue(this.filterForm.value) !== this.appliedFilterSnapshot;
        this.hasActiveFilters = this.checkHasActiveFilters();
        this.cdr.markForCheck();
      });

    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('effDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('effDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('termDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('termDatePeriod')?.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.filterForm.get('effDatePeriod')?.setValidators([this.effDatePeriodValidator.bind(this)]);
    this.filterForm.get('termDatePeriod')?.setValidators([this.termDatePeriodValidator.bind(this)]);
  }

  private normalizeFormValue(formValue: any): string {
    return JSON.stringify({
      sex: formValue.sex || null,
      responseType: formValue.responseType || null,
      effDatePeriod: formValue.effDatePeriod || null,
      effDate: formValue.effDate ? String(formValue.effDate) : null,
      termDatePeriod: formValue.termDatePeriod || null,
      termDate: formValue.termDate ? String(formValue.termDate) : null
    });
  }

  private checkHasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      formValue.sex ||
      formValue.responseType ||
      formValue.effDatePeriod ||
      formValue.effDate ||
      formValue.termDatePeriod ||
      formValue.termDate
    );
  }

  private effDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;
    const effDate = this.filterForm.get('effDate')?.value;
    if (effDate && !control.value) return { required: true };
    return null;
  }

  private termDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;
    const termDate = this.filterForm.get('termDate')?.value;
    if (termDate && !control.value) return { required: true };
    return null;
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid) return;

    const formValue = this.filterForm.value;
    const effDatePeriod = formValue.effDate ? (formValue.effDatePeriod || null) : null;
    const termDatePeriod = formValue.termDate ? (formValue.termDatePeriod || null) : null;

    const filters: QuestionFilterValue = {
      sex: formValue.sex || null,
      responseType: formValue.responseType || null,
      effDatePeriod,
      effDate: formValue.effDate || null,
      termDatePeriod,
      termDate: formValue.termDate || null
    };

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      sex: null,
      responseType: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
    // Re-validate period controls — during reset(), effDatePeriod resets before effDate,
    // so the validator sees stale effDate and incorrectly marks the form invalid
    this.filterForm.get('effDatePeriod')?.updateValueAndValidity({ emitEvent: false });
    this.filterForm.get('termDatePeriod')?.updateValueAndValidity({ emitEvent: false });

    // Apply cleared filters to reload questions
    const clearedFilters: QuestionFilterValue = {
      sex: null,
      responseType: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    };

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.hasActiveFilters = false;
    this.cdr.markForCheck();

    this.clearAll.emit(clearedFilters);
  }

  onClose(): void {
    this.close.emit();
  }

  get effDatePeriodRequired(): boolean {
    const c = this.filterForm?.get('effDate');
    return !!c?.value && !c?.hasError('matDatepickerParse') && !this.filterForm?.get('effDatePeriod')?.value;
  }

  get termDatePeriodRequired(): boolean {
    const c = this.filterForm?.get('termDate');
    return !!c?.value && !c?.hasError('matDatepickerParse') && !this.filterForm?.get('termDatePeriod')?.value;
  }

  getEffDatePeriodError(): string {
    const control = this.filterForm.get('effDatePeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getTermDatePeriodError(): string {
    const control = this.filterForm.get('termDatePeriod');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Period is required';
    return '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective date is invalid';
    if (!control.value && this.getNativeInputText(this.effDateNativeInput)) return 'Effective date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination date is invalid';
    return '';
  }

  onDateBlur(event: Event, controlName: 'effDate' | 'termDate'): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value?.trim() ?? '';
    if (!inputValue) return;

    // Try to parse and auto-format shorthand date entry
    const parsedDate = this.parseShorthandDate(inputValue);
    if (parsedDate && parsedDate.isValid()) {
      const control = this.filterForm.get(controlName);
      if (control) {
        control.setValue(parsedDate);
      }
    }
  }

  onDateKeyDown(event: KeyboardEvent, controlName: 'effDate' | 'termDate'): void {
    if (event.key === 'Enter') {
      const input = event.target as HTMLInputElement;
      const inputValue = input.value?.trim() ?? '';
      if (!inputValue) return;

      const parsedDate = this.parseShorthandDate(inputValue);
      if (parsedDate && parsedDate.isValid()) {
        const control = this.filterForm.get(controlName);
        if (control) {
          control.setValue(parsedDate);
        }
      }
    }
  }

  /**
   * Parse shorthand date entry (DDMMYY format) like "200426" to moment date
   */
  private parseShorthandDate(input: string): moment.Moment | null {
    if (!input) return null;

    const trimmed = input.trim();

    // Check if it's a 6-digit shorthand format (DDMMYY)
    if (/^\d{6}$/.test(trimmed)) {
      const day = parseInt(trimmed.substring(0, 2), 10);
      const month = parseInt(trimmed.substring(2, 4), 10);
      const yearTwoDigit = parseInt(trimmed.substring(4, 6), 10);
      const year = yearTwoDigit < 50 ? 2000 + yearTwoDigit : 1900 + yearTwoDigit;

      if (month < 1 || month > 12) return null;

      const date = moment([year, month - 1, day]).startOf('day');
      if (!date.isValid() || date.date() !== day || date.month() !== month - 1 || date.year() !== year) {
        return null;
      }
      return date;
    }

    // Try parsing other common formats
    const parsedDate = moment(trimmed, [
      'DD-MMM-YYYY', 'D-MMM-YYYY', 'DD/MMM/YYYY', 'D/MMM/YYYY',
      'DD-MM-YYYY', 'D-M-YYYY', 'DD/MM/YYYY', 'D/M/YYYY',
      'YYYY-MM-DD', 'YYYY/MM/DD'
    ], true);

    return parsedDate.isValid() ? parsedDate.startOf('day') : null;
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }
}
