import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { PatientFilterValue } from '../models/patient-filter.model';
import moment, { Moment } from 'moment';

export interface PeriodFilterOption {
  value: 'BEFORE' | 'AFTER';
  label: string;
}

export const PERIOD_FILTER_OPTIONS: PeriodFilterOption[] = [
  { value: 'AFTER', label: 'After' },
  { value: 'BEFORE', label: 'Before' }
];

export interface StatusOption {
  value: string;
  label: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Closed', label: 'Closed' }
];

/**
 * Patient Filter Panel Component
 * Dropdown filter panel for filtering patient list
 */
@Component({
  selector: 'app-patient-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatMomentDateModule
  ],
  templateUrl: './patient-filter-panel.html',
  styleUrls: ['./patient-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class PatientFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: PatientFilterValue | null = null;
  @Output() apply = new EventEmitter<PatientFilterValue>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('surgDateNativeInput') surgDateNativeInput?: ElementRef;
  @ViewChild('neededByNativeInput') neededByNativeInput?: ElementRef;

  filterForm!: FormGroup;
  periodOptions: PeriodFilterOption[] = PERIOD_FILTER_OPTIONS;
  statusOptions: StatusOption[] = STATUS_OPTIONS;
  private destroy$ = new Subject<void>();

  surgDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.surgDateNativeInput);
    }
  };

  neededByErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.neededByNativeInput);
    }
  };

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.setupValueChangeListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const surgeryDate = this.currentFilters?.surgeryDate
      ? moment.isMoment(this.currentFilters.surgeryDate)
        ? this.currentFilters.surgeryDate
        : moment(this.currentFilters.surgeryDate)
      : null;

    const neededBy = this.currentFilters?.neededBy
      ? moment.isMoment(this.currentFilters.neededBy)
        ? this.currentFilters.neededBy
        : moment(this.currentFilters.neededBy)
      : null;

    this.filterForm = this.fb.group({
      status: [this.currentFilters?.status || null],
      surgeryDatePeriod: [this.currentFilters?.surgeryDatePeriod || null],
      surgeryDate: [surgeryDate],
      neededByPeriod: [this.currentFilters?.neededByPeriod || null],
      neededBy: [neededBy]
    });
  }

  private setupValueChangeListeners(): void {
    this.filterForm.get('surgeryDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('surgeryDate');
        const periodControl = this.filterForm.get('surgeryDatePeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateSurgeryDatePeriod();
      });

    this.filterForm.get('surgeryDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('surgeryDate');
        const periodControl = this.filterForm.get('surgeryDatePeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateSurgeryDatePeriod();
      });

    this.filterForm.get('surgeryDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateSurgeryDatePeriod());

    this.filterForm.get('neededBy')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('neededBy');
        const periodControl = this.filterForm.get('neededByPeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateNeededByPeriod();
      });

    this.filterForm.get('neededBy')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('neededBy');
        const periodControl = this.filterForm.get('neededByPeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateNeededByPeriod();
      });

    this.filterForm.get('neededByPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateNeededByPeriod());
  }

  private validateSurgeryDatePeriod(): void {
    const surgDateControl = this.filterForm.get('surgeryDate');
    const surgDate = surgDateControl?.value;
    const surgDatePeriod = this.filterForm.get('surgeryDatePeriod')?.value;
    const surgDatePeriodControl = this.filterForm.get('surgeryDatePeriod');

    const hasValidDate = surgDate && !surgDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !surgDatePeriod) {
      surgDatePeriodControl?.setErrors({ required: true });
      surgDatePeriodControl?.markAsTouched();
    } else {
      surgDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateNeededByPeriod(): void {
    const neededByControl = this.filterForm.get('neededBy');
    const neededBy = neededByControl?.value;
    const neededByPeriod = this.filterForm.get('neededByPeriod')?.value;
    const neededByPeriodControl = this.filterForm.get('neededByPeriod');

    const hasValidDate = neededBy && !neededByControl?.hasError('matDatepickerParse');

    if (hasValidDate && !neededByPeriod) {
      neededByPeriodControl?.setErrors({ required: true });
      neededByPeriodControl?.markAsTouched();
    } else {
      neededByPeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getSurgeryDateError(): string {
    const control = this.filterForm?.get('surgeryDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Surgery Date is invalid';
    if (!control.value && this.getNativeInputText(this.surgDateNativeInput)) return 'Surgery Date is invalid';
    return '';
  }

  getNeededByError(): string {
    const control = this.filterForm?.get('neededBy');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Needed By is invalid';
    if (!control.value && this.getNativeInputText(this.neededByNativeInput)) return 'Needed By is invalid';
    return '';
  }

  get isApplyDisabled(): boolean {
    const values = this.filterForm?.value;
    const hasAnyValue = values?.status ||
                        values?.surgeryDatePeriod || values?.surgeryDate ||
                        values?.neededByPeriod || values?.neededBy;

    if (!hasAnyValue) {
      return true;
    }

    const surgDateControl = this.filterForm.get('surgeryDate');
    const neededByControl = this.filterForm.get('neededBy');
    const surgPeriodControl = this.filterForm.get('surgeryDatePeriod');
    const neededByPeriodControl = this.filterForm.get('neededByPeriod');

    const hasDateErrors = (surgDateControl?.invalid ?? false) || (neededByControl?.invalid ?? false);
    const hasPeriodErrors = (surgPeriodControl?.invalid ?? false) || (neededByPeriodControl?.invalid ?? false);

    return hasDateErrors || hasPeriodErrors;
  }

  onApply(): void {
    this.validateSurgeryDatePeriod();
    this.validateNeededByPeriod();

    const surgDateControl = this.filterForm.get('surgeryDate');
    const neededByControl = this.filterForm.get('neededBy');
    const surgPeriodControl = this.filterForm.get('surgeryDatePeriod');
    const neededByPeriodControl = this.filterForm.get('neededByPeriod');

    if (surgDateControl?.errors ||
        neededByControl?.errors ||
        surgPeriodControl?.errors ||
        neededByPeriodControl?.errors) {
      surgDateControl?.markAsTouched();
      neededByControl?.markAsTouched();
      surgPeriodControl?.markAsTouched();
      neededByPeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: PatientFilterValue = {
      status: formValue.status || null,
      shipTo: null,
      surgeryDate: formValue.surgeryDate
        ? this.formatDateForApi(formValue.surgeryDate)
        : null,
      surgeryDatePeriod: formValue.surgeryDate ? formValue.surgeryDatePeriod : null,
      neededBy: formValue.neededBy
        ? this.formatDateForApi(formValue.neededBy)
        : null,
      neededByPeriod: formValue.neededBy ? formValue.neededByPeriod : null
    };

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.filterForm.get('surgeryDatePeriod')?.setErrors(null);
    this.filterForm.get('neededByPeriod')?.setErrors(null);
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  private formatDateForApi(date: Moment | Date | null): string | null {
    if (!date) return null;

    // Handle Moment objects
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }

    // Handle Date objects
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
