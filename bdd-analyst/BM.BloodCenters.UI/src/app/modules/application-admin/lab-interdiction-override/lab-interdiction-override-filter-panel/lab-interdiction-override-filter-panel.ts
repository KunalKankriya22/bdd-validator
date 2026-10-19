import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  ViewChild,
  ElementRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ErrorStateMatcher, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';

import { LabInterdictionOverrideFilterValue, DropdownOption } from '../models/lab-interdiction-override.model';
import { LabInterdictionOverrideService } from '../services/lab-interdiction-override.service';

@Component({
  selector: 'app-lab-interdiction-override-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './lab-interdiction-override-filter-panel.html',
  styleUrls: ['./lab-interdiction-override-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabInterdictionOverrideFilterPanel implements OnInit, OnDestroy {

  @Input() currentFilters: LabInterdictionOverrideFilterValue | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<LabInterdictionOverrideFilterValue>();

  filterForm!: FormGroup;

  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  readonly cueOptions = signal<DropdownOption[]>([]);
  readonly typeOptions = signal<DropdownOption[]>([]);

  readonly cueSearchControl = new FormControl('');
  readonly typeSearchControl = new FormControl('');

  readonly cueSearch = signal('');
  readonly typeSearch = signal('');

  readonly filteredCueOptions = computed(() => {
    const search = this.cueSearch().toLowerCase();
    const options = this.cueOptions();
    if (!search) return options;
    return options.filter(o => o.value.toLowerCase().includes(search) || o.key.toLowerCase().includes(search));
  });

  readonly filteredTypeOptions = computed(() => {
    const search = this.typeSearch().toLowerCase();
    const options = this.typeOptions();
    if (!search) return options;
    return options.filter(o => o.value.toLowerCase().includes(search) || o.key.toLowerCase().includes(search));
  });

  periodOptions: { value: string; label: string }[] = [
    { value: 'After', label: 'After' },
    { value: 'Before', label: 'Before' }
  ];

  isLoadingFilters = false;

  @ViewChild('effectiveDateNativeInput') effectiveDateNativeInput?: ElementRef;
  @ViewChild('terminationDateNativeInput') terminationDateNativeInput?: ElementRef;

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effectiveDateNativeInput);
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.terminationDateNativeInput);
    }
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: LabInterdictionOverrideService,
    private cdr: ChangeDetectorRef
  ) {
    this.cueSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.cueSearch.set(value || ''));

    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.typeSearch.set(value || ''));
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      donorDecisionCode: [this.currentFilters?.donorDecisionCode ?? null],
      interType: [this.currentFilters?.interType ?? null],
      effectivePeriod: [this.currentFilters?.effectiveDatePeriod ?? null],
      effectiveDate: [
        this.currentFilters?.effectiveDate
          ? new Date(this.currentFilters.effectiveDate)
          : null
      ],
      terminationPeriod: [this.currentFilters?.terminationDatePeriod ?? null],
      terminationDate: [
        this.currentFilters?.terminationDate
          ? new Date(this.currentFilters.terminationDate)
          : null
      ]
    });

    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectivePeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectivePeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectivePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffectiveDatePeriod());

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationPeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationPeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTerminationDatePeriod());
  }

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.service
      .getFilterDropdownOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const filterData = response.data?.[0];

          if (filterData) {
            this.cueOptions.set(filterData.cueOptions ?? []);
            this.typeOptions.set(filterData.typeOptions ?? []);
          }

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cueOptions.set([]);
          this.typeOptions.set([]);

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effDateControl = this.filterForm.get('effectiveDate');
    const effDate = effDateControl?.value;
    const effDatePeriod = this.filterForm.get('effectivePeriod')?.value;
    const effDatePeriodControl = this.filterForm.get('effectivePeriod');

    const hasValidDate = effDate && !effDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !effDatePeriod) {
      effDatePeriodControl?.setErrors({ required: true });
      effDatePeriodControl?.markAsTouched();
    } else {
      effDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const termDateControl = this.filterForm.get('terminationDate');
    const termDate = termDateControl?.value;
    const termDatePeriod = this.filterForm.get('terminationPeriod')?.value;
    const termDatePeriodControl = this.filterForm.get('terminationPeriod');

    const hasValidDate = termDate && !termDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !termDatePeriod) {
      termDatePeriodControl?.setErrors({ required: true });
      termDatePeriodControl?.markAsTouched();
    } else {
      termDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective date is invalid';
    if (!control.value && this.getNativeInputText(this.effectiveDateNativeInput)) return 'Effective date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (!control.value && this.getNativeInputText(this.terminationDateNativeInput)) return 'Termination date is invalid';
    return '';
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectivePeriod');
    const termPeriodControl = this.filterForm.get('terminationPeriod');

    if (effDateControl?.errors ||
        termDateControl?.errors ||
        effPeriodControl?.errors ||
        termPeriodControl?.errors) {
      effDateControl?.markAsTouched();
      termDateControl?.markAsTouched();
      effPeriodControl?.markAsTouched();
      termPeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: LabInterdictionOverrideFilterValue = {
      donorDecisionCode: formValue.donorDecisionCode ?? null,
      donorDecisionCodeDisplay: this.getDisplayLabel(formValue.donorDecisionCode, this.cueOptions()),
      interType: formValue.interType ?? null,
      interTypeDisplay: this.getDisplayLabel(formValue.interType, this.typeOptions()),
      effectiveDatePeriod: formValue.effectiveDate ? formValue.effectivePeriod : null,
      effectiveDate: formValue.effectiveDate
        ? this.formatDateForApi(formValue.effectiveDate)
        : null,
      terminationDatePeriod: formValue.terminationDate ? formValue.terminationPeriod : null,
      terminationDate: formValue.terminationDate
        ? this.formatDateForApi(formValue.terminationDate)
        : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();

    this.cueSearchControl.reset('');
    this.typeSearchControl.reset('');
    this.cueSearch.set('');
    this.typeSearch.set('');

    this.filterForm.get('effectivePeriod')?.setErrors(null);
    this.filterForm.get('terminationPeriod')?.setErrors(null);
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    if (!this.filterForm?.dirty) {
      return true;
    }

    const values = this.filterForm?.value;
    const hasAnyValue = values?.donorDecisionCode ||
                        values?.interType ||
                        values?.effectivePeriod || values?.effectiveDate ||
                        values?.terminationPeriod || values?.terminationDate;

    if (!hasAnyValue) {
      return true;
    }

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectivePeriod');
    const termPeriodControl = this.filterForm.get('terminationPeriod');

    const hasDateErrors = (effDateControl?.invalid ?? false) || (termDateControl?.invalid ?? false);
    const hasPeriodErrors = (effPeriodControl?.invalid ?? false) || (termPeriodControl?.invalid ?? false);

    return hasDateErrors || hasPeriodErrors;
  }

  private getDisplayLabel(value: string | null, options: DropdownOption[]): string | null {
    if (!value) return null;
    const option = options.find(o => o.value === value);
    return option ? (option.key ? `${option.value} - ${option.key}` : option.value) : value;
  }

  private formatDateForApi(date: Date | string | Moment | null | undefined): string {
    if (!date) return '';

    if (typeof date === 'string') {
      return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
    }

    const dateObj: Date = date instanceof Date ? date : (date as Moment).toDate();

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
