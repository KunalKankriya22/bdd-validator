import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';
import { InterdictionFilters } from '../models/maintain-donor-interdiction.models';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import moment from 'moment';

@Component({
  selector: 'app-interdiction-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatMomentDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './interdiction-filter-panel.html',
  styleUrls: ['./interdiction-filter-panel.scss']
})
export class InterdictionFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: InterdictionFilters = { showTerminated: false };
  @Input() userIdOptions: string[] = [];
  @Input() originatedOptions: string[] = [];
  @Input() groupModeOptions: string[] = [];
  @Input() groupIdOptions: string[] = [];
  @Output() apply = new EventEmitter<InterdictionFilters>();
  @Output() close = new EventEmitter<void>();
  @ViewChild('effectiveDateInput') effectiveDateInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInputRef!: ElementRef<HTMLInputElement>;

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.effectiveDateInputRef?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.terminationDateInputRef?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  filterForm!: FormGroup;
  private destroy$ = new Subject<void>();

  showEffectiveDatePeriodError = false;
  showTerminationDatePeriodError = false;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Moment>
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      showTerminated: [this.currentFilters?.showTerminated || false],
      userId: [this.currentFilters?.userId || ''],
      originated: [this.currentFilters?.originated || ''],
      groupMode: [this.currentFilters?.groupMode || ''],
      groupId: [this.currentFilters?.groupId || ''],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });

    // Clear error flags when effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEffectiveDatePeriodError = false;
      });

    // Clear error flags when effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEffectiveDatePeriodError = false;
      });

    // Clear error flags when termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTerminationDatePeriodError = false;
      });

    // Clear error flags when termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTerminationDatePeriodError = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('invalidDateFormat')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effectiveDateInputRef)) return 'Effective Date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (control.hasError('invalidDateFormat')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.terminationDateInputRef)) return 'Termination Date is invalid';
    return '';
  }

  get isApplyDisabled(): boolean {
    // Check if form has validation errors
    if (this.filterForm.invalid) {
      return true;
    }

    // Check if date fields have invalid text input
    if (this.getEffectiveDateError() || this.getTerminationDateError()) {
      return true;
    }

    // Check if there are period validation errors
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      return true;
    }

    // Check if at least one field has a value
    const v = this.filterForm.value;
    const hasAnyValue = v.showTerminated ||
                        v.userId ||
                        v.originated ||
                        v.groupMode ||
                        v.groupId ||
                        v.effectiveDate ||
                        v.terminationDate;

    return !hasAnyValue;
  }

  applyFilter(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    const v = this.filterForm.value;

    // Check for period validation errors
    this.showEffectiveDatePeriodError = !!(v.effectiveDate && !v.effectiveDatePeriod);
    this.showTerminationDatePeriodError = !!(v.terminationDate && !v.terminationDatePeriod);

    // If there are validation errors, stop here
    if (this.filterForm.invalid || this.showEffectiveDatePeriodError || this.showTerminationDatePeriodError) {
      this.cdr.markForCheck();
      return;
    }

    const formatDate = (d: any): string => {
      if (!d) return '';

      // Handle Moment objects (from ChapterAwareDateAdapter)
      if (moment.isMoment(d)) {
        return d.format('YYYY-MM-DD');
      }

      // Handle Date objects (fallback)
      if (d instanceof Date && !isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      return '';
    };

    const filters: InterdictionFilters = {
      showTerminated: v.showTerminated || false
    };
    if (v.userId) filters.userId = v.userId;
    if (v.originated) filters.originated = v.originated;
    if (v.groupMode) filters.groupMode = v.groupMode;
    if (v.groupId) filters.groupId = v.groupId;

    // Add date filters
    if (v.effectiveDate && v.effectiveDatePeriod) {
      const formattedDate = formatDate(v.effectiveDate);
      if (formattedDate) {
        filters.effectiveDate = formattedDate;
        filters.effectiveDatePeriod = v.effectiveDatePeriod;
      }
    }
    if (v.terminationDate && v.terminationDatePeriod) {
      const formattedDate = formatDate(v.terminationDate);
      if (formattedDate) {
        filters.terminationDate = formattedDate;
        filters.terminationDatePeriod = v.terminationDatePeriod;
      }
    }

    this.apply.emit(filters);
  }

  clearAll(): void {
    this.filterForm.reset({
      showTerminated: false,
      userId: '',
      originated: '',
      groupMode: '',
      groupId: '',
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.showEffectiveDatePeriodError = false;
    this.showTerminationDatePeriodError = false;
  }

  closePanel(): void {
    this.close.emit();
  }
}
