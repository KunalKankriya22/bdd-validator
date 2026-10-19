import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy
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
import { Subject, forkJoin, takeUntil, ReplaySubject } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { ValidReagentCodeFilterValue, ValidTestLov, ReagentTypeLov, ControlFlagLov } from '../models/valid-reagent-code.model';
import { ValidReagentCodeService } from '../services/valid-reagent-code.service';

@Component({
  selector: 'app-valid-reagent-code-filter-panel',
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
  templateUrl: './valid-reagent-code-filter-panel.html',
  styleUrls: ['./valid-reagent-code-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidReagentCodeFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ValidReagentCodeFilterValue | null = null;
  @Input() testId: string | null = null;
  @Input() testDesc: string | null = null;
  @Output() apply = new EventEmitter<ValidReagentCodeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  reagentTypes: ReagentTypeLov[] = [];
  controlFlags: ControlFlagLov[] = [];
  isLoadingDropdowns = false;

  // Search filter controls
  reagentTypeFilterCtrl = new FormControl('');
  controlFlagFilterCtrl = new FormControl('');

  // Filtered lists
  filteredReagentTypes = new ReplaySubject<ReagentTypeLov[]>(1);
  filteredControlFlags = new ReplaySubject<ControlFlagLov[]>(1);

  // Validation flags for period/date combinations
  effPeriodRequired = false;
  termPeriodRequired = false;

  // Store raw input text to preserve invalid dates
  private effDateRawInput = '';
  private termDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: ValidReagentCodeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadAllDropdowns();
    this.setupFormListeners();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      showTerminated: [this.currentFilters?.showTerminated || null],
      reagentType: [this.currentFilters?.reagentType || null],
      controlFlag: [{ value: this.currentFilters?.controlFlag || null, disabled: true }],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDateAfter: [
        this.currentFilters?.effectiveDateAfter ? new Date(this.currentFilters.effectiveDateAfter) : null,
        [dateFormatValidator()]
      ],
      effectiveDateBefore: [
        this.currentFilters?.effectiveDateBefore ? new Date(this.currentFilters.effectiveDateBefore) : null,
        [dateFormatValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDateAfter: [
        this.currentFilters?.terminationDateAfter ? new Date(this.currentFilters.terminationDateAfter) : null,
        [dateFormatValidator()]
      ],
      terminationDateBefore: [
        this.currentFilters?.terminationDateBefore ? new Date(this.currentFilters.terminationDateBefore) : null,
        [dateFormatValidator()]
      ]
    });
  }

  private loadAllDropdowns(): void {
    this.isLoadingDropdowns = true;

    forkJoin({
      reagentTypes: this.service.getReagentTypesLov(),
      controlFlags: this.service.getControlFlagsLov()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.reagentTypes = result.reagentTypes;
          this.controlFlags = result.controlFlags;

          // Initialize filtered lists
          this.filteredReagentTypes.next(this.reagentTypes.slice());
          this.filteredControlFlags.next(this.controlFlags.slice());

          // Setup search filtering
          this.setupSearchFilters();

          this.isLoadingDropdowns = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading dropdown options:', error);
          this.isLoadingDropdowns = false;
          this.cdr.markForCheck();
        }
      });
  }

  private setupSearchFilters(): void {
    // R Type search filter
    this.reagentTypeFilterCtrl.valueChanges
      .pipe(
        startWith(''),
        map(search => this.filterReagentTypes(search || '')),
        takeUntil(this.destroy$)
      )
      .subscribe(filtered => {
        this.filteredReagentTypes.next(filtered);
      });

    // Control Flag search filter
    this.controlFlagFilterCtrl.valueChanges
      .pipe(
        startWith(''),
        map(search => this.filterControlFlags(search || '')),
        takeUntil(this.destroy$)
      )
      .subscribe(filtered => {
        this.filteredControlFlags.next(filtered);
      });
  }

  private filterReagentTypes(search: string): ReagentTypeLov[] {
    if (!search) {
      return this.reagentTypes.slice();
    }
    const searchLower = search.toLowerCase();
    return this.reagentTypes.filter(type =>
      type.code.toLowerCase().includes(searchLower) ||
      type.description.toLowerCase().includes(searchLower)
    );
  }

  private filterControlFlags(search: string): ControlFlagLov[] {
    if (!search) {
      return this.controlFlags.slice();
    }
    const searchLower = search.toLowerCase();
    return this.controlFlags.filter(flag =>
      flag.code.toLowerCase().includes(searchLower) ||
      flag.description.toLowerCase().includes(searchLower)
    );
  }

  private setupFormListeners(): void {
    // Enable/disable Control Flag based on Reagent Type
    this.filterForm.get('reagentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((reagentType) => {
        const controlFlagControl = this.filterForm.get('controlFlag');
        if (reagentType === 'C') {
          controlFlagControl?.enable();
        } else {
          controlFlagControl?.setValue(null);
          controlFlagControl?.disable();
        }
        this.cdr.markForCheck();
      });

    // Setup date validation
    this.filterForm.get('effectiveDateAfter')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effectiveDateAfter');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateEffPeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('terminationDateAfter')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('terminationDateAfter');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => {
          this.validateTermPeriod();
          this.cdr.markForCheck();
        }, 0);
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffPeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTermPeriod();
        this.cdr.markForCheck();
      });
  }

  validateEffPeriod(): void {
    this.effPeriodRequired = this.validatePeriodControl('effectiveDateAfter', 'effectiveDatePeriod');
  }

  validateTermPeriod(): void {
    this.termPeriodRequired = this.validatePeriodControl('terminationDateAfter', 'terminationDatePeriod');
  }

  private validatePeriodControl(dateControlName: string, periodControlName: string): boolean {
    const date = this.filterForm.get(dateControlName)?.value;
    const period = this.filterForm.get(periodControlName)?.value;
    const control = this.filterForm.get(periodControlName);
    if (date && !period) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
      return true;
    } else {
      control?.setErrors(null);
      return false;
    }
  }

  getEffectiveDatePeriodError(): string {
    const control = this.filterForm.get('effectiveDatePeriod');
    if (control?.touched && control?.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const control = this.filterForm.get('terminationDatePeriod');
    if (control?.touched && control?.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  get isApplyDisabled(): boolean {
    if (this.effPeriodRequired || this.termPeriodRequired) {
      return true;
    }

    if (this.hasDateErrors('effectiveDateAfter') || this.hasDateErrors('terminationDateAfter')) {
      return true;
    }

    const formValue = this.filterForm.value;

    // Check for period without date - should disable APPLY
    const hasEffPeriodWithoutDate = formValue.effectiveDatePeriod && !formValue.effectiveDateAfter;
    const hasTermPeriodWithoutDate = formValue.terminationDatePeriod && !formValue.terminationDateAfter;

    if (hasEffPeriodWithoutDate || hasTermPeriodWithoutDate) {
      return true;
    }

    // Check if at least one filter field has a complete value
    const hasAnyFilter =
      formValue.showTerminated ||
      formValue.reagentType ||
      formValue.controlFlag ||
      (formValue.effectiveDateAfter && formValue.effectiveDatePeriod) ||
      (formValue.terminationDateAfter && formValue.terminationDatePeriod);

    return !hasAnyFilter;
  }

  private hasDateErrors(controlName: string): boolean {
    const control = this.filterForm.get(controlName);
    return control?.hasError('invalidDateFormat') ||
           control?.hasError('matDatepickerParse') ||
           control?.hasError('invalidDate') ||
           false;
  }

  onApply(): void {
    const formValue = this.filterForm.getRawValue();
    const filters: ValidReagentCodeFilterValue = {
      testId: null,
      testDesc: null,
      showTerminated: formValue.showTerminated,
      reagentType: formValue.reagentType,
      controlFlag: formValue.controlFlag,
      effectiveDatePeriod: formValue.effectiveDatePeriod,
      effectiveDateAfter: formValue.effectiveDateAfter
        ? DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDateAfter)
        : null,
      terminationDatePeriod: formValue.terminationDatePeriod,
      terminationDateAfter: formValue.terminationDateAfter
        ? DateFieldValidationUtility.serializeDateForApi(formValue.terminationDateAfter)
        : null
    };

    this.apply.emit(filters);
    this.close.emit();
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
      showTerminated: null,
      reagentType: null,
      controlFlag: null,
      effectiveDatePeriod: null,
      effectiveDateAfter: null,
      effectiveDateBefore: null,
      terminationDatePeriod: null,
      terminationDateAfter: null,
      terminationDateBefore: null
    });

    // Reset raw inputs and validation flags
    this.effDateRawInput = '';
    this.termDateRawInput = '';
    this.effPeriodRequired = false;
    this.termPeriodRequired = false;

    // Clear all control errors
    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);

    this.cdr.markForCheck();
  }

  getReagentTypeDisplay(code: string): string {
    const type = this.reagentTypes.find(t => t.code === code);
    return type ? `${type.code} - ${type.description}` : code;
  }

  getControlFlagDisplay(code: string): string {
    const flag = this.controlFlags.find(f => f.code === code);
    return flag ? `${flag.code} - ${flag.description}` : code;
  }

  onEffDateInput(event: Event): void {
    this.handleDateInput(event, 'effectiveDateAfter', 'effDateRawInput');
  }

  onEffDateBlur(input: HTMLInputElement): void {
    this.handleDateBlur(input, 'effectiveDateAfter', this.effDateRawInput);
  }

  onTermDateInput(event: Event): void {
    this.handleDateInput(event, 'terminationDateAfter', 'termDateRawInput');
  }

  onTermDateBlur(input: HTMLInputElement): void {
    this.handleDateBlur(input, 'terminationDateAfter', this.termDateRawInput);
  }

  private handleDateInput(event: Event, controlName: string, rawInputProp: 'effDateRawInput' | 'termDateRawInput'): void {
    const input = event.target as HTMLInputElement;
    this[rawInputProp] = input.value;
    const control = this.filterForm.get(controlName);
    if (input.value?.trim()) {
      control?.markAsTouched();
      control?.markAsDirty();
      if (!control?.value) {
        control?.setErrors({ invalidDate: true });
      }
    }
  }

  private handleDateBlur(input: HTMLInputElement, controlName: string, rawInput: string): void {
    setTimeout(() => {
      const control = this.filterForm.get(controlName);
      if (!control?.value && rawInput && !input.value) {
        input.value = rawInput;
      }
    }, 0);
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

export type { ValidReagentCodeFilterValue };
