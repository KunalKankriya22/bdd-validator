import { Component, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Input, OnInit, OnDestroy, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { OverrideRuleFilterValue, InterdictionCode } from '../models/override-rules.model';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-override-rules-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './override-rules-filter-panel.html',
  styleUrls: ['./override-rules-filter-panel.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverrideRulesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: OverrideRuleFilterValue | null = null;
  @Input() interdictionOptions: InterdictionCode[] = [];
  @Input() maxHeight: number | null = null;
  @Output() apply = new EventEmitter<OverrideRuleFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private destroy$ = new Subject<void>();
  private savedInputValue: { [key: string]: string } = {};

  filterForm!: FormGroup;
  get minDate(): moment.Moment {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  overrideFlagOptions: Array<{ value: string, label: string }> = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  periodOptions: { value: string; display: string }[] = [
    { value: 'AFTER', display: 'After' },
    { value: 'BEFORE', display: 'Before' }
  ];

  // Search control for interdiction dropdown
  readonly interdictionSearchControl = new FormControl('');
  private readonly interdictionSearch = signal('');

  readonly filteredInterdictionOptions = computed(() => {
    const search = this.interdictionSearch().toLowerCase();
    if (!search) return this.interdictionOptions;
    return this.interdictionOptions.filter(opt =>
      opt.interCode.toLowerCase().includes(search) ||
      (opt.interDesc && opt.interDesc.toLowerCase().includes(search))
    );
  });

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {

    this.interdictionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.interdictionSearch.set(value || ''));

    this.initializeForm();

    if (this.currentFilters) {
      this.filterForm.patchValue({
        overrideFlag: this.currentFilters.overrideFlag || null,
        interdictionCode: this.currentFilters.interdictionCode || null,
        effectiveDatePeriod: this.currentFilters.effectiveDatePeriod || null,
        effectiveDate: this.currentFilters.effectiveDate ? new Date(this.currentFilters.effectiveDate as string) : null,
        terminationDatePeriod: this.currentFilters.terminationDatePeriod || null,
        terminationDate: this.currentFilters.terminationDate ? new Date(this.currentFilters.terminationDate as string) : null
      });
    }

    this.setupValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      overrideFlag: [null],
      interdictionCode: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null, [dateFormatValidator()]],
      terminationDatePeriod: [null],
      terminationDate: [null, [dateFormatValidator()]]
    });
  }

  private setupValidation(): void {
    // Watch effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });

    // Watch termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
        this.cdr.markForCheck();
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const control = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && !effectiveDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const control = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  onDateInputChange(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value || '';

    this.savedInputValue[controlName] = inputValue;
    this.validateDate(inputValue, controlName);
  }

  onDateChange(event: any, controlName: string): void {
    // If a date was selected from the datepicker calendar (event.value exists),
    // accept it and update the saved value
    if (event.value) {
      const formatted = moment(event.value).format('DD-MMM-YYYY').toUpperCase();
      this.savedInputValue[controlName] = formatted;
      const control = this.filterForm.get(controlName);
      if (control) {
        control.setErrors(null);
        this.cdr.markForCheck();
      }
      return;
    }

    // Manual input: restore saved value and validate
    const input = event.target as HTMLInputElement;
    const savedValue = this.savedInputValue[controlName] || '';
    if (savedValue) {
      input.value = savedValue;
      this.validateDate(savedValue, controlName);
    }
  }

  onDateBlur(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const savedValue = this.savedInputValue[controlName] || '';

    if (!savedValue) {
      return;
    }

    const parsedDate = moment(
      savedValue.trim(),
      this.dateParseFormats,
      true
    );

    if (parsedDate.isValid()) {
      // Auto-convert to DD-MON-YYYY format
      const formatted = parsedDate.format('DD-MMM-YYYY').toUpperCase();
      input.value = formatted;
      this.savedInputValue[controlName] = formatted;
      const control = this.filterForm.get(controlName);
      if (control) {
        control.setValue(parsedDate, { emitEvent: true });
        control.setErrors(null);
        this.cdr.markForCheck();
      }
    } else {
      input.value = savedValue;
      this.validateDate(savedValue, controlName);
    }
  }

  private readonly dateParseFormats = ['DD-MMM-YYYY', 'D-MMM-YYYY', 'MM/DD/YYYY', 'M/DD/YYYY', 'MM-DD-YYYY', 'M-DD-YYYY', 'DD/MM/YYYY', 'D/MM/YYYY', 'DD-MM-YYYY', 'D-MM-YYYY'];

  private parseDate(inputValue: string): moment.Moment | null {
    const trimmed = inputValue.trim();

    // Handle digit-only inputs manually
    if (/^\d{7,8}$/.test(trimmed)) {
      const tryDate = (d: number, m: number, y: number): moment.Moment | null => {
        if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
        const date = moment(`${d}-${m}-${y}`, 'D-M-YYYY', true);
        return date.isValid() ? date : null;
      };
      if (trimmed.length === 8) {
        // MMDDYYYY only (month-first)
        return tryDate(+trimmed.substring(2, 4), +trimmed.substring(0, 2), +trimmed.substring(4, 8));
      } else {
        // MDDYYYY only (M=1, DD=2, YYYY=4)
        return tryDate(+trimmed.substring(1, 3), +trimmed.substring(0, 1), +trimmed.substring(3, 7));
      }
    }

    const parsedDate = moment(trimmed, this.dateParseFormats, true);
    if (!parsedDate.isValid()) return null;
    const year = parsedDate.year();
    if (year < 1900 || year > 2100) return null;
    return parsedDate;
  }

  private validateDate(inputValue: string, controlName: string): void {
    const control = this.filterForm.get(controlName);
    if (!inputValue) return;

    const parsedDate = this.parseDate(inputValue);

    if (!parsedDate) {
      if (control) {
        control.setErrors({ invalidDate: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    } else {
      if (control) {
        control.setErrors(null);
        this.cdr.markForCheck();
      }
    }
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  get effDatePeriodRequired(): boolean {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    return !!effectiveDate && !effectiveDatePeriod;
  }

  get termDatePeriodRequired(): boolean {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    return !!terminationDate && !terminationDatePeriod;
  }

  get effectiveDatePeriodError(): string {
    return this.getEffectiveDatePeriodError();
  }

  hasDateErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDateHasError = effectiveDateControl?.hasError('invalidDate') ||
                                  effectiveDateControl?.hasError('invalidDateFormat') ||
                                  effectiveDateControl?.hasError('matDatepickerParse');
    const terminationDateHasError = terminationDateControl?.hasError('invalidDate') ||
                                    terminationDateControl?.hasError('invalidDateFormat') ||
                                    terminationDateControl?.hasError('matDatepickerParse');

    return !!effectiveDateHasError || !!terminationDateHasError;
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    if (this.hasValidationErrors) {
      return true;
    }

    // Period without a date is not a meaningful filter
    const effectiveDateIncomplete = formValue.effectiveDatePeriod !== null && !formValue.effectiveDate;
    const terminationDateIncomplete = formValue.terminationDatePeriod !== null && !formValue.terminationDate;
    if (effectiveDateIncomplete || terminationDateIncomplete) {
      return true;
    }

    // At least one meaningful value must be selected (period alone does not count)
    const hasAnyValue =
      formValue.overrideFlag !== null ||
      formValue.interdictionCode !== null ||
      formValue.effectiveDate !== null ||
      formValue.terminationDate !== null;

    return !hasAnyValue;
  }

  get hasValidationErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDateHasError = effectiveDateControl?.hasError('invalidDate') ||
                                  effectiveDateControl?.hasError('invalidDateFormat') ||
                                  effectiveDateControl?.hasError('matDatepickerParse');
    const terminationDateHasError = terminationDateControl?.hasError('invalidDate') ||
                                    terminationDateControl?.hasError('invalidDateFormat') ||
                                    terminationDateControl?.hasError('matDatepickerParse');

    return this.filterForm.get('effectiveDatePeriod')?.invalid ||
           this.filterForm.get('terminationDatePeriod')?.invalid ||
           effectiveDateHasError ||
           terminationDateHasError ||
           false;
  }

  private formatDateForApi(date: moment.Moment | Date | string): string {
    const m = moment.isMoment(date) ? date : moment(date);
    return m.format('YYYY-MM-DD');
  }

  onApply(): void {
    // Trigger validation
    this.filterForm.markAllAsTouched();

    const formValue = this.filterForm.value;

    // Check if form has any values
    const hasAnyValue =
      formValue.overrideFlag !== null ||
      formValue.interdictionCode !== null ||
      formValue.effectiveDatePeriod !== null ||
      formValue.effectiveDate !== null ||
      formValue.terminationDatePeriod !== null ||
      formValue.terminationDate !== null;

    // Only validate if form has values (allow empty form to clear filters)
    if (hasAnyValue && this.hasValidationErrors) {
      return;
    }

    const filters: OverrideRuleFilterValue = {
      overrideFlag: formValue.overrideFlag || null,
      interdictionCode: formValue.interdictionCode || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate
        ? this.formatDateForApi(formValue.effectiveDate)
        : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate
        ? this.formatDateForApi(formValue.terminationDate)
        : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      overrideFlag: null,
      interdictionCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.savedInputValue = {};
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
