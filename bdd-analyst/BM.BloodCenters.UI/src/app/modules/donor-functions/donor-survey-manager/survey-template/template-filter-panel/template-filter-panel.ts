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
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { ErrorStateMatcher, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { SurveyTemplateFilterValue } from '../models/survey-template.model';
import { Subject, takeUntil } from 'rxjs';

/**
 * TemplateFilterPanel
 * Filter panel for Survey Template and Link Template — same date/period rules as
 * Create and Maintain Territories (territory-filter-panel).
 */
@Component({
  selector: 'app-template-filter-panel',
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
  templateUrl: './template-filter-panel.html',
  styleUrls: ['./template-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: SurveyTemplateFilterValue | null = null;
  @Input() showStatus = true;
  @Output() apply = new EventEmitter<SurveyTemplateFilterValue>();
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
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.currentFilters?.effDate || null],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.currentFilters?.termDate || null],
      status: [this.currentFilters?.status || null]
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
      effDatePeriod: formValue.effDatePeriod || null,
      effDate: formValue.effDate ? String(formValue.effDate) : null,
      termDatePeriod: formValue.termDatePeriod || null,
      termDate: formValue.termDate ? String(formValue.termDate) : null,
      status: formValue.status || null
    });
  }

  private checkHasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      formValue.effDatePeriod ||
      formValue.effDate ||
      formValue.termDatePeriod ||
      formValue.termDate ||
      formValue.status
    );
  }

  private effDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const effDate = this.filterForm.get('effDate')?.value;
    const effDatePeriod = control.value;

    if (effDate && !effDatePeriod) {
      return { required: true };
    }

    return null;
  }

  private termDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;

    const termDate = this.filterForm.get('termDate')?.value;
    const termDatePeriod = control.value;

    if (termDate && !termDatePeriod) {
      return { required: true };
    }

    return null;
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    const effDatePeriod = formValue.effDate ? (formValue.effDatePeriod || null) : null;
    const termDatePeriod = formValue.termDate ? (formValue.termDatePeriod || null) : null;

    const filters: SurveyTemplateFilterValue = {
      effDatePeriod: effDatePeriod,
      effDate: formValue.effDate || null,
      termDatePeriod: termDatePeriod,
      termDate: formValue.termDate || null,
      status: formValue.status || null
    };

    this.appliedFilterSnapshot = this.normalizeFormValue(this.filterForm.value);
    this.hasChanges = false;
    this.cdr.markForCheck();

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: null
    });
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

  getEffDateError(): string {
    const control = this.filterForm?.get('effDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective date is invalid';
    if (!control.value && this.getNativeInputText(this.effDateNativeInput)) return 'Effective date is invalid';
    return '';
  }

  getTermDateError(): string {
    const control = this.filterForm?.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination date is invalid';
    return '';
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }
}
