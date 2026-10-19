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
  ElementRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { LabelingInterdictionOverrideFilterValue } from '../models/labeling-interdiction-override-query.model';
import { LabelingInterdictionOverrideQueryService } from '../services/labeling-interdiction-override-query.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import moment, { Moment } from 'moment';

@Component({
  selector: 'app-labeling-interdiction-override-filter-panel',
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
    NgxMatSelectSearchModule
  ],
  templateUrl: './labeling-interdiction-override-filter-panel.html',
  styleUrls: ['./labeling-interdiction-override-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class LabelingInterdictionOverrideFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: LabelingInterdictionOverrideFilterValue | null = null;
  @Output() apply = new EventEmitter<LabelingInterdictionOverrideFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  cueOptions: { value: string; display: string }[] = [];
  interTypeOptions: { value: string; display: string }[] = [];
  periodOptions: { value: string; display: string }[] = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];

  // Search controls for dropdowns
  cueSearchCtrl = new FormControl('');
  interTypeSearchCtrl = new FormControl('');

  // Filtered options using signals
  filteredCueOptions = signal<{ value: string; display: string }[]>([]);
  filteredInterTypeOptions = signal<{ value: string; display: string }[]>([]);

  isLoadingFilters = false;
  showEffectiveDatePeriodError = false;
  showTerminationDatePeriodError = false;

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

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: LabelingInterdictionOverrideQueryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Parse dates to Date objects if they exist (matching Valid ABO pattern)
    const parseDate = (dateValue: string | Date | null | undefined): Date | null => {
      if (!dateValue) return null;
      if (dateValue instanceof Date) return dateValue;
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? null : d;
    };

    this.filterForm = this.fb.group({
      donorDecisionCode: [this.currentFilters?.cue || null],
      interType: [this.currentFilters?.type || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [parseDate(this.currentFilters?.effectiveDate)],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [parseDate(this.currentFilters?.terminationDate)]
    });

    // Clear error flags when effective date changes (matching Valid ABO pattern)
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEffectiveDatePeriodError = false;
      });

    // Clear error flags when effective date period changes (matching Valid ABO pattern)
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEffectiveDatePeriodError = false;
      });

    // Clear error flags when termination date changes (matching Valid ABO pattern)
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTerminationDatePeriodError = false;
      });

    // Clear error flags when termination date period changes (matching Valid ABO pattern)
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTerminationDatePeriodError = false;
      });

    this.setupSearchFilters();
    this.loadFilterOptions();
  }

  /**
   * Setup search filtering for all dropdowns
   */
  private setupSearchFilters(): void {
    // Filter Cue options
    this.cueSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterCues();
      });

    // Filter Type options
    this.interTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterInterTypes();
      });
  }

  private filterCues(): void {
    const search = this.cueSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredCueOptions.set(this.cueOptions);
      return;
    }

    const filtered = this.cueOptions.filter(option =>
      option.value.toLowerCase().includes(search) ||
      option.display.toLowerCase().includes(search)
    );
    this.filteredCueOptions.set(filtered);
  }

  private filterInterTypes(): void {
    const search = this.interTypeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredInterTypeOptions.set(this.interTypeOptions);
      return;
    }

    const filtered = this.interTypeOptions.filter(option =>
      option.value.toLowerCase().includes(search) ||
      option.display.toLowerCase().includes(search)
    );
    this.filteredInterTypeOptions.set(filtered);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.service.getFilterDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (filterData) => {
          // Cue: code - description from actual data table
          const rawCues = filterData.cueOptions || [];
          this.cueOptions = rawCues.map((item) => ({
            value: item.value,
            display: item.key ? `${item.value} - ${item.key}` : item.value
          }));

          // Type: code - description from actual data table
          const rawTypes = filterData.typeOptions || [];
          this.interTypeOptions = rawTypes.map((item) => ({
            value: item.value,
            display: item.key ? `${item.value} - ${item.key}` : item.value
          }));

          // Initialize filtered options
          this.filteredCueOptions.set(this.cueOptions);
          this.filteredInterTypeOptions.set(this.interTypeOptions);

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cueOptions = [];
          this.interTypeOptions = [];
          this.filteredCueOptions.set([]);
          this.filteredInterTypeOptions.set([]);
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  onApply(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    const formValue = this.filterForm.value;

    // Check for period validation errors
    this.showEffectiveDatePeriodError = !!(formValue.effectiveDate && !formValue.effectiveDatePeriod);
    this.showTerminationDatePeriodError = !!(formValue.terminationDate && !formValue.terminationDatePeriod);

    // If there are validation errors, stop here
    if (this.filterForm.invalid || this.showEffectiveDatePeriodError || this.showTerminationDatePeriodError) {
      this.cdr.markForCheck();
      return;
    }

    const selectedCue = this.cueOptions.find(o => o.value === formValue.donorDecisionCode);
    const selectedType = this.interTypeOptions.find(o => o.value === formValue.interType);

    const filters: LabelingInterdictionOverrideFilterValue = {
      cue: formValue.donorDecisionCode || null,
      cueDisplay: selectedCue?.display || null,
      type: formValue.interType || null,
      typeDisplay: selectedType?.display || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.showEffectiveDatePeriodError = false;
    this.showTerminationDatePeriodError = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
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
    const formValue = this.filterForm.value;
    const hasAnyValue = formValue.donorDecisionCode ||
                        formValue.interType ||
                        formValue.effectiveDate ||
                        formValue.terminationDate;

    return !hasAnyValue;
  }
}
