import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, take, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { AssignInterdictionClassService } from '../services/assign-interdiction-class.service';
import { AssignInterdictionClassFilterValue } from '../models/assign-interdiction-class.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-assign-interdiction-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    TranslateModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './assign-interdiction-filter-panel.html',
  styleUrls: ['./assign-interdiction-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
})
export class AssignInterdictionFilterPanel implements OnInit, OnDestroy {
  @ViewChild('effectiveDateInput') effectiveDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInput?: ElementRef<HTMLInputElement>;

  @Input() currentFilters: AssignInterdictionClassFilterValue | null = null;

  @Output() apply = new EventEmitter<AssignInterdictionClassFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AssignInterdictionClassService);
  private readonly cdr = inject(ChangeDetectorRef);

  filterForm!: FormGroup;

  interdictionCodeOptions: string[] = [];
  typeOptions: { value: string; display: string }[] = [];
  classOptions: string[] = [];
  periodOptions: string[] = ['AFTER', 'BEFORE'];

  // Search controls for dropdowns
  interdictionCodeSearchCtrl = new FormControl('');
  typeSearchCtrl = new FormControl('');
  classSearchCtrl = new FormControl('');

  // Filtered options using signals
  filteredInterdictionCodeOptions = signal<string[]>([]);
  filteredTypeOptions = signal<{ value: string; display: string }[]>([]);
  filteredClassOptions = signal<string[]>([]);

  isLoadingFilters = false;

  private destroy$ = new Subject<void>();
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';
  private initialFilterValues: AssignInterdictionClassFilterValue | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilters();

    if (this.currentFilters) {
      this.populateFormWithCurrentFilters();
      // Store initial values to track changes
      this.initialFilterValues = { ...this.currentFilters };
    } else {
      this.initialFilterValues = null;
    }

    this.setupValidation();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    // Watch all form changes to update Apply button state
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Watch form status changes (valid/invalid) to update Apply button state
    this.filterForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
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

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.effectiveDateRawInput = inputValue;

    const control = this.filterForm.get('effectiveDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control) return;

      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.effectiveDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.effectiveDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    this.terminationDateRawInput = inputValue;

    const control = this.filterForm.get('terminationDate');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();

    setTimeout(() => {
      if (inputValue && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control) return;

      control.markAsTouched();

      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && typeof controlValue === 'object' && controlValue.isValid && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.terminationDateRawInput = formattedDate;
        control.setErrors(null);
      } else if (inputValue && !controlValue) {
        input.value = this.terminationDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      } else if (!inputValue) {
        control.setErrors(null);
      }
    }, 0);
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
    const formValue = this.filterForm?.value;
    return !!(formValue?.effectiveDate && !formValue?.effectiveDatePeriod);
  }

  get termDatePeriodRequired(): boolean {
    const formValue = this.filterForm?.value;
    return !!(formValue?.terminationDate && !formValue?.terminationDatePeriod);
  }

  get isApplyDisabled(): boolean {
    // Check if form is invalid (any validation errors)
    if (this.filterForm?.invalid) {
      return true;
    }

    // Check if period validation fails
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      return true;
    }

    // Check if form has date errors
    if (this.hasDateErrors()) {
      return true;
    }

    // Check if there are any error messages showing
    if (this.getEffectiveDateError() || this.getTerminationDateError() ||
        this.getEffectiveDatePeriodError() || this.getTerminationDatePeriodError()) {
      return true;
    }

    // Check if any field has a value
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return true;
    }

    const hasAnyValue =
      formValue.interdictionCode !== null ||
      formValue.type !== null ||
      formValue.class !== null ||
      formValue.effectiveDatePeriod ||
      formValue.effectiveDate ||
      formValue.terminationDatePeriod ||
      formValue.terminationDate;

    if (!hasAnyValue) {
      return true;
    }

    // Check if form values have changed from initial values
    if (!this.hasFormChanged()) {
      return true;
    }

    return false;
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      interdictionCode: [null],
      type: [null],
      class: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null],
      terminationDatePeriod: [null],
      terminationDate: [null]
    });
  }

  private loadFilters(): void {
    this.isLoadingFilters = true;

    this.service.getAssignInterdictionClassFilters()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const filterData = response.data?.[0];

          if (filterData) {
            this.interdictionCodeOptions = filterData.interdictionCode || [];
            const typeMap: Record<string, string> = { 'I': 'Initial', 'H': 'Hold', 'B': 'Bio', 'N': 'NFT' };
            this.typeOptions = (filterData.type || []).map((t: string) => ({
              value: t,
              display: typeMap[t] || t
            }));
            this.classOptions = filterData.class || [];

            // Initialize filtered options
            this.filteredInterdictionCodeOptions.set(this.interdictionCodeOptions);
            this.filteredTypeOptions.set(this.typeOptions);
            this.filteredClassOptions.set(this.classOptions);
          }

          this.isLoadingFilters = false;

          if (this.currentFilters) {
            this.populateFormWithCurrentFilters();
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading filter options:', error);
          this.isLoadingFilters = false;

          this.interdictionCodeOptions = [];
          this.typeOptions = [] as { value: string; display: string }[];
          this.classOptions = [];

          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Setup search filtering for all dropdowns
   */
  private setupSearchFilters(): void {
    // Filter Interdiction Code options
    this.interdictionCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterInterdictionCodes();
      });

    // Filter Type options
    this.typeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTypes();
      });

    // Filter Class options
    this.classSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterClasses();
      });
  }

  private filterInterdictionCodes(): void {
    const search = this.interdictionCodeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredInterdictionCodeOptions.set(this.interdictionCodeOptions);
      return;
    }

    const filtered = this.interdictionCodeOptions.filter(option =>
      option.toLowerCase().includes(search)
    );
    this.filteredInterdictionCodeOptions.set(filtered);
  }

  private filterTypes(): void {
    const search = this.typeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredTypeOptions.set(this.typeOptions);
      return;
    }

    const filtered = this.typeOptions.filter(option =>
      option.display.toLowerCase().includes(search) ||
      option.value.toLowerCase().includes(search)
    );
    this.filteredTypeOptions.set(filtered);
  }

  private filterClasses(): void {
    const search = this.classSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredClassOptions.set(this.classOptions);
      return;
    }

    const filtered = this.classOptions.filter(option =>
      option.toLowerCase().includes(search)
    );
    this.filteredClassOptions.set(filtered);
  }

  private populateFormWithCurrentFilters(): void {
    if (!this.currentFilters) return;

    const effectiveDate = this.currentFilters.effectiveDate
      ? moment.isMoment(this.currentFilters.effectiveDate)
        ? this.currentFilters.effectiveDate
        : moment(this.currentFilters.effectiveDate)
      : null;

    const terminationDate = this.currentFilters.terminationDate
      ? moment.isMoment(this.currentFilters.terminationDate)
        ? this.currentFilters.terminationDate
        : moment(this.currentFilters.terminationDate)
      : null;

    this.filterForm.patchValue({
      interdictionCode: this.currentFilters.interdictionCode,
      type: this.currentFilters.type,
      class: this.currentFilters.class,
      effectiveDatePeriod: this.currentFilters.effectiveDatePeriod,
      effectiveDate: effectiveDate,
      terminationDatePeriod: this.currentFilters.terminationDatePeriod,
      terminationDate: terminationDate
    });

    this.cdr.markForCheck();
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    if (this.hasDateErrors() || this.effDatePeriodRequired || this.termDatePeriodRequired) {
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const updatedFilters: AssignInterdictionClassFilterValue = {
      interdictionCode: formValue.interdictionCode || null,
      type: formValue.type || null,
      class: formValue.class || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate ? this.formatDateOnly(formValue.effectiveDate) : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate ? this.formatDateOnly(formValue.terminationDate) : null
    };

    this.apply.emit(updatedFilters);
  }

  /**
   * Format date to YYYY-MM-DDTHH:mm:ss format to match backend expectation
   */
  private formatDateOnly(date: Moment | Date | null): string | null {
    if (!date) return null;

    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD') + 'T00:00:00';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  onClear(): void {
    this.filterForm.reset({
      interdictionCode: null,
      type: null,
      class: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  getEffectiveDateError(): string {
    const control = this.filterForm.get('effectiveDate');
    if (!control) return '';

    if (control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    if (!(control.touched || control.dirty)) {
      return '';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm.get('terminationDate');
    if (!control) return '';

    if (control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    if (!(control.touched || control.dirty)) {
      return '';
    }

    return '';
  }

  private hasDateErrors(): boolean {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDateHasFormatError = effectiveDateControl?.hasError('invalidDate') ||
                                        effectiveDateControl?.hasError('matDatepickerParse');
    const terminationDateHasFormatError = terminationDateControl?.hasError('invalidDate') ||
                                          terminationDateControl?.hasError('matDatepickerParse');

    return effectiveDateHasFormatError || terminationDateHasFormatError || false;
  }

  private hasFormChanged(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) {
      return false;
    }

    // If no initial values were set, consider it changed if there are values
    if (!this.initialFilterValues) {
      return true;
    }

    // Compare each field
    const currentEffectiveDate = formValue.effectiveDate ? this.formatDateOnly(formValue.effectiveDate) : null;
    const currentTerminationDate = formValue.terminationDate ? this.formatDateOnly(formValue.terminationDate) : null;

    const isChanged =
      formValue.interdictionCode !== this.initialFilterValues.interdictionCode ||
      formValue.type !== this.initialFilterValues.type ||
      formValue.class !== this.initialFilterValues.class ||
      formValue.effectiveDatePeriod !== this.initialFilterValues.effectiveDatePeriod ||
      currentEffectiveDate !== this.initialFilterValues.effectiveDate ||
      formValue.terminationDatePeriod !== this.initialFilterValues.terminationDatePeriod ||
      currentTerminationDate !== this.initialFilterValues.terminationDate;

    return isChanged;
  }
}