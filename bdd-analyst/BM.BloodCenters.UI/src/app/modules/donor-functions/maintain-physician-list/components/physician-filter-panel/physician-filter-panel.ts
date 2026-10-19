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
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import moment from 'moment';

import { PhysicianFilterValue } from '../../models/physician-filter.model';

@Component({
  selector: 'app-physician-filter-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule
  ],
  templateUrl: './physician-filter-panel.html',
  styleUrls: ['./physician-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class PhysicianFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: PhysicianFilterValue | null = null;
  @Input() title: string = 'Filters';
  @Output() apply = new EventEmitter<PhysicianFilterValue>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  private static nextId = 0;
  protected readonly componentId = `physician-filter-panel-${PhysicianFilterPanel.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  filterForm!: FormGroup;
  private destroy$ = new Subject<void>();

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

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

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.setupValueChangeListeners();
  }

  private initializeForm(): void {
    // moment(..., 'YYYY-MM-DD') prevents UTC-midnight off-by-one in US timezones
    const effectiveDate = this.currentFilters?.effectiveDate
      ? moment(this.currentFilters.effectiveDate, 'YYYY-MM-DD')
      : null;

    const terminationDate = this.currentFilters?.terminationDate
      ? moment(this.currentFilters.terminationDate, 'YYYY-MM-DD')
      : null;

    this.filterForm = this.fb.group({
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [effectiveDate],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [terminationDate]
    });
  }

  private setupValueChangeListeners(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.effectivePeriodRequired = false;
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.effectivePeriodRequired = false;
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.terminationPeriodRequired = false;
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.terminationPeriodRequired = false;
      });
  }

  get effDatePeriodRequired(): boolean {
    const date = this.filterForm?.get('effectiveDate')?.value;
    const period = this.filterForm?.get('effectiveDatePeriod')?.value;
    return !!date && !period;
  }

  get termDatePeriodRequired(): boolean {
    const date = this.filterForm?.get('terminationDate')?.value;
    const period = this.filterForm?.get('terminationDatePeriod')?.value;
    return !!date && !period;
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid) {
      return true;
    }

    if (this.getEffectiveDateError() || this.getTerminationDateError()) {
      return true;
    }

    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      return true;
    }

    const formValue = this.filterForm.value;
    const hasAnyValue = formValue.effectiveDate || formValue.terminationDate;

    return !hasAnyValue;
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control) return '';
    if (!(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effDateNativeInput)) {
      return 'Effective Date is invalid';
    }
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control) return '';
    if (!(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) {
      return 'Termination Date is invalid';
    }
    return '';
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    const formValue = this.filterForm.value;

    this.effectivePeriodRequired = !!(formValue.effectiveDate && !formValue.effectiveDatePeriod);
    this.terminationPeriodRequired = !!(formValue.terminationDate && !formValue.terminationDatePeriod);

    if (this.filterForm.invalid || this.effectivePeriodRequired || this.terminationPeriodRequired) {
      this.cdr.markForCheck();
      return;
    }

    const filters: PhysicianFilterValue = {
      effectiveDate: formValue.effectiveDate
        ? this.formatDateForApi(formValue.effectiveDate)
        : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      terminationDate: formValue.terminationDate
        ? this.formatDateForApi(formValue.terminationDate)
        : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null
    };

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  private formatDateForApi(date: moment.Moment | null): string | null {
    return moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
