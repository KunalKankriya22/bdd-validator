import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import moment from 'moment';
import { DonorInterdictionOverrideFilterValue, getInterTypeDisplay } from '../models/donor-interdiction-override.model';
import { DonorInterdictionOverrideService } from '../services/donor-interdiction-override.service';

@Component({
  selector: 'app-donor-interdiction-override-filter-panel',
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
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './donor-interdiction-override-filter-panel.html',
  styleUrls: ['./donor-interdiction-override-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonorInterdictionOverrideFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DonorInterdictionOverrideFilterValue | null = null;
  @Output() apply = new EventEmitter<DonorInterdictionOverrideFilterValue>();
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

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;
  effectiveDateRequired = false;
  terminationDateRequired = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private overrideService: DonorInterdictionOverrideService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.setupCueSearch();
    this.setupInterTypeSearch();

    this.filterForm = this.fb.group({
      donorDecisionCode: [this.currentFilters?.donorDecisionCode || null],
      interType: [this.currentFilters?.interType || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null, [dateFormatValidator()]]
    });

    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateEffectivePeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateTerminationPeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      });

    this.loadFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  validateEffectivePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectiveDatePeriod')?.value;
    this.effectivePeriodRequired = !!date && !period;
    this.effectiveDateRequired = !!period && !date;
  }

  validateTerminationPeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('terminationDatePeriod')?.value;
    this.terminationPeriodRequired = !!date && !period;
    this.terminationDateRequired = !!period && !date;
  }

  get isApplyDisabled(): boolean {
    // Check if there are validation errors
    if (this.effectivePeriodRequired || this.terminationPeriodRequired ||
        this.effectiveDateRequired || this.terminationDateRequired) {
      return true;
    }

    // Check for invalid date format errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    if (effectiveDateControl?.hasError('invalidDateFormat') ||
        effectiveDateControl?.hasError('matDatepickerParse') ||
        terminationDateControl?.hasError('invalidDateFormat') ||
        terminationDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    // Check if at least one field has a value
    const values = this.filterForm.value;
    const hasCue = values?.donorDecisionCode !== null && values?.donorDecisionCode !== undefined;
    const hasInterType = values?.interType !== null && values?.interType !== undefined;
    // Both period AND date must be filled for effective/termination dates
    const hasEffectiveDate = values?.effectiveDatePeriod && values?.effectiveDate;
    const hasTerminationDate = values?.terminationDatePeriod && values?.terminationDate;

    return !(hasCue || hasInterType || hasEffectiveDate || hasTerminationDate);
  }

  private setupCueSearch(): void {
    this.cueSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        if (search && search.length >= 1) {
          this.filteredCueOptions = this.allCueOptions.filter(o =>
            o.value.toLowerCase().includes(search.toLowerCase()) ||
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredCueOptions = [...this.allCueOptions];
        }
        this.cdr.markForCheck();
      });
  }

  private setupInterTypeSearch(): void {
    this.interTypeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        if (search && search.length >= 1) {
          this.filteredInterTypeOptions = this.allInterTypeOptions.filter(o =>
            o.value.toLowerCase().includes(search.toLowerCase()) ||
            o.display.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredInterTypeOptions = [...this.allInterTypeOptions];
        }
        this.cdr.markForCheck();
      });
  }

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.overrideService.getFilterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dropdowns) => {
          const rawCodes = dropdowns.donorDecisionCodes || [];
          this.allCueOptions = rawCodes.map((item) => ({
            value: item.code,
            display: item.description ? `${item.code} - ${item.description}` : item.code
          }));
          this.filteredCueOptions = [...this.allCueOptions];

          const rawTypes = dropdowns.interTypes || [];
          if (rawTypes.length > 0) {
            this.allInterTypeOptions = rawTypes.map((type) => ({
              value: type.code,
              display: getInterTypeDisplay(type.code)
            }));
          }
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

  onApply(): void {
    const formValue = this.filterForm.value;

    const donorDecisionCodeDisplay = formValue.donorDecisionCode
      ? this.allCueOptions.find(opt => opt.value === formValue.donorDecisionCode)?.display || null
      : null;

    const interTypeDisplay = formValue.interType
      ? this.allInterTypeOptions.find(opt => opt.value === formValue.interType)?.display || null
      : null;

    const filters: DonorInterdictionOverrideFilterValue = {
      donorDecisionCode: formValue.donorDecisionCode || null,
      donorDecisionCodeDisplay: donorDecisionCodeDisplay,
      interType: formValue.interType || null,
      interTypeDisplay: interTypeDisplay,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate ? this.convertToUTCDate(formValue.effectiveDate)?.toISOString() || null : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate ? this.convertToUTCDate(formValue.terminationDate)?.toISOString() || null : null
    };

    this.apply.emit(filters);
  }

  /**
   * Convert Moment date to UTC Date at midnight
   * This ensures the selected date is preserved regardless of timezone
   */
  private convertToUTCDate(date: moment.Moment | Date | null): Date | null {
    if (!date) return null;

    // Handle moment.Moment objects
    if (moment.isMoment(date)) {
      return new Date(Date.UTC(
        date.year(),
        date.month(),
        date.date(),
        0, 0, 0, 0
      ));
    }

    // Handle Date objects
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    ));
  }

  onClear(): void {
    this.filterForm.reset({
      donorDecisionCode: null,
      interType: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;

    this.cueSearchControl.setValue('', { emitEvent: false });
    this.filteredCueOptions = [...this.allCueOptions];
    this.interTypeSearchControl.setValue('', { emitEvent: false });
    this.filteredInterTypeOptions = [...this.allInterTypeOptions];
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    // Set invalidDateFormat error when input has text but control value is null (unparseable)
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  /**
   * Store raw input text when user types in termination date field
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    // Set invalidDateFormat error when input has text but control value is null (unparseable)
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }
}
