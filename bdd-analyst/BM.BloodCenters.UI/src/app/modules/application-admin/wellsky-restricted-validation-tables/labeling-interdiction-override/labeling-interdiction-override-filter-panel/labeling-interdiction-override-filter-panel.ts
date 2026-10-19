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
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { ErrorStateMatcher, MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  LabelingInterdictionOverrideFilterValue
} from '../models/labeling-interdiction-override.model';
import { LabelingInterdictionOverrideService } from '../services/labeling-interdiction-override.service';

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
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class LabelingInterdictionOverrideFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: LabelingInterdictionOverrideFilterValue | null = null;
  @Output() apply = new EventEmitter<LabelingInterdictionOverrideFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  allCueOptions: { value: string; display: string }[] = [];
  filteredCueOptions: { value: string; display: string }[] = [];
  cueSearchControl = new FormControl('');

  allInterTypeOptions: { value: string; display: string }[] = [];
  filteredInterTypeOptions: { value: string; display: string }[] = [];
  interTypeSearchControl = new FormControl('');

  periodOptions: { value: string; display: string }[] = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
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
    private overrideService: LabelingInterdictionOverrideService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupSearchControls();
    this.loadFilterOptions();
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      donorDecisionCode: [this.currentFilters?.donorDecisionCode || null],
      interType: [this.currentFilters?.interType || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate
          ? new Date(String(this.currentFilters.effectiveDate))
          : null
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate
          ? new Date(String(this.currentFilters.terminationDate))
          : null
      ]
    });

    // Effective date validation listeners
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectiveDatePeriod');

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
        const periodControl = this.filterForm.get('effectiveDatePeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffectiveDatePeriod());

    // Termination date validation listeners
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationDatePeriod');

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
        const periodControl = this.filterForm.get('terminationDatePeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTerminationDatePeriod());
  }

  private setupSearchControls(): void {
    this.cueSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        const previousLength = this.filteredCueOptions.length;

        if (search && search.length >= 1) {
          this.filteredCueOptions = this.allCueOptions.filter(o =>
            o.value.toLowerCase().includes(search.toLowerCase()) ||
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredCueOptions = [...this.allCueOptions];
        }

        if (this.filteredCueOptions.length !== previousLength) {
          this.cdr.markForCheck();
        }
      });

    this.interTypeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        const previousLength = this.filteredInterTypeOptions.length;

        if (search && search.length >= 1) {
          this.filteredInterTypeOptions = this.allInterTypeOptions.filter(o =>
            o.value.toLowerCase().includes(search.toLowerCase()) ||
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredInterTypeOptions = [...this.allInterTypeOptions];
        }

        if (this.filteredInterTypeOptions.length !== previousLength) {
          this.cdr.markForCheck();
        }
      });
  }

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.overrideService.getFilterDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dropdowns) => {
          const rawCues = dropdowns.cueOptions || [];
          this.allCueOptions = rawCues.map((item) => ({
            value: item.value,
            display: item.key ? `${item.value} - ${item.key}` : item.value
          }));
          this.filteredCueOptions = [...this.allCueOptions];

          const rawTypes = dropdowns.typeOptions || [];
          this.allInterTypeOptions = rawTypes.map((item) => ({
            value: item.value,
            display: item.key ? `${item.value} - ${item.key}` : item.value
          }));
          this.filteredInterTypeOptions = [...this.allInterTypeOptions];

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.allCueOptions = [];
          this.filteredCueOptions = [];
          this.allInterTypeOptions = [];
          this.filteredInterTypeOptions = [];
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  /* ------------------------------ VALIDATION ------------------------------ */

  private validateEffectiveDatePeriod(): void {
    const effDateControl = this.filterForm.get('effectiveDate');
    const effDate = effDateControl?.value;
    const effDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const effDatePeriodControl = this.filterForm.get('effectiveDatePeriod');

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
    const termDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const termDatePeriodControl = this.filterForm.get('terminationDatePeriod');

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

  /* ------------------------------ ACTIONS ------------------------------ */

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectiveDatePeriod');
    const termPeriodControl = this.filterForm.get('terminationDatePeriod');

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
    const selectedCue = this.allCueOptions.find(o => o.value === formValue.donorDecisionCode);
    const selectedType = this.allInterTypeOptions.find(o => o.value === formValue.interType);

    const filters: LabelingInterdictionOverrideFilterValue = {
      donorDecisionCode: formValue.donorDecisionCode || null,
      donorDecisionCodeDisplay: selectedCue?.display || null,
      interType: formValue.interType || null,
      interTypeDisplay: selectedType?.display || null,
      effectiveDatePeriod: formValue.effectiveDate ? formValue.effectiveDatePeriod : null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDate ? formValue.terminationDatePeriod : null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset();

    this.cueSearchControl.setValue('', { emitEvent: false });
    this.filteredCueOptions = [...this.allCueOptions];
    this.interTypeSearchControl.setValue('', { emitEvent: false });
    this.filteredInterTypeOptions = [...this.allInterTypeOptions];

    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const values = this.filterForm?.value;
    const hasAnyValue = values?.donorDecisionCode ||
                        values?.interType ||
                        values?.effectiveDatePeriod || values?.effectiveDate ||
                        values?.terminationDatePeriod || values?.terminationDate;

    if (!hasAnyValue) {
      return true;
    }

    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const effPeriodControl = this.filterForm.get('effectiveDatePeriod');
    const termPeriodControl = this.filterForm.get('terminationDatePeriod');

    const hasDateErrors = (effDateControl?.invalid ?? false) || (termDateControl?.invalid ?? false);
    const hasPeriodErrors = (effPeriodControl?.invalid ?? false) || (termPeriodControl?.invalid ?? false);

    return hasDateErrors || hasPeriodErrors;
  }
}
