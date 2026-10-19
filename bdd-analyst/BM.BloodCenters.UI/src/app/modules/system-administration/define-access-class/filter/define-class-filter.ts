import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DefineAccessClassService, CodeFilterDropdownItem } from '../services/define-access-class.service';
import { Subject } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

/* Filter model specific to Define Access Class */
export interface DefineClassFilter {
  type: string | null;
  code: string | null;
  effectiveDatePeriod: 'AFTER' | 'BEFORE' | null;
  effectiveDate: Date | null;
  terminationDatePeriod: 'AFTER' | 'BEFORE' | null;
  terminationDate: Date | null;
  status: 'Active' | 'Inactive' | null;
}

@Component({
  selector: 'app-define-class-filter',
  standalone: true,
  templateUrl: './define-class-filter.html',
  styleUrls: ['./define-class-filter.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefineClassFilterComponent implements OnInit, OnDestroy {
  @Input() currentFilters: DefineClassFilter | null = null;
  @Input() classname: string = '';
  @Output() apply = new EventEmitter<DefineClassFilter>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  typeOptions: { type: string; description: string }[] = [];
  filteredTypeOptions: { type: string; description: string }[] = [];
  typeSearchControl = new FormControl('');
  codeOptions: CodeFilterDropdownItem[] = [];
  filteredCodeOptions: CodeFilterDropdownItem[] = [];
  codeSearchControl = new FormControl('');
  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private defineAccessClassService: DefineAccessClassService,
    private cdr: ChangeDetectorRef,
  ) {
    this.filterForm = this.fb.group({
      type: [null],
      code: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null, [dateFormatValidator()]],
      terminationDatePeriod: [null],
      terminationDate: [null, [dateFormatValidator()]],
      status: [null]
    });
  }

  ngOnInit(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }

    this.loadTypes();

    if (this.currentFilters?.type) {
      this.loadCodeFilterDropdown(this.currentFilters.type);
    }

    this.filterForm.get('type')?.valueChanges
      .pipe(
        skip(this.currentFilters?.type ? 1 : 0),
        takeUntil(this.destroy$)
      )
      .subscribe((type) => {
        this.onTypeChange(type);
      });

    this.setupDropdownSearch();
    this.setupValidators();
  }

  private setupDropdownSearch(): void {
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredTypeOptions = this.typeOptions.filter((t) =>
          t.type.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
        );
        this.cdr.markForCheck();
      });

    this.codeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredCodeOptions = this.codeOptions.filter((c) =>
          c.code.toLowerCase().includes(search) ||
          (c.description || '').toLowerCase().includes(search)
        );
        this.cdr.markForCheck();
      });
  }

  private setupValidators(): void {
    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Mark field as touched when user types to show validation errors
        const control = this.filterForm.get('effectiveDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => this.validateEffectivePeriod(), 0);
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => this.validateEffectivePeriod(), 0);
      });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Mark field as touched when user types to show validation errors
        const control = this.filterForm.get('terminationDate');
        if (control && !control.touched) {
          control.markAsTouched();
        }
        setTimeout(() => this.validateTerminationPeriod(), 0);
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => this.validateTerminationPeriod(), 0);
      });
  }

  private validateEffectivePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectiveDatePeriod')?.value;
    this.effectivePeriodRequired = !!date && !period;
  }

  private validateTerminationPeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('terminationDatePeriod')?.value;
    this.terminationPeriodRequired = !!date && !period;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTypes(): void {
    this.defineAccessClassService.getTypesFilterDropdown(this.classname)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.typeOptions = types;
          this.filteredTypeOptions = types;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading types:', error);
        }
      });
  }

  onTypeChange(type: string | null): void {
    this.filterForm.patchValue({ code: null });
    this.codeSearchControl.setValue('');
    this.loadCodeFilterDropdown(type || undefined);
  }

  private loadCodeFilterDropdown(accessCodeType?: string): void {
    this.defineAccessClassService.getCodeFilterDropdown(this.classname, accessCodeType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.codeOptions = codes;
          this.filteredCodeOptions = codes;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading code filter dropdown:', error);
          this.codeOptions = [];
          this.filteredCodeOptions = [];
        }
      });
  }

  onApply(): void {
    this.apply.emit(this.filterForm.value);
  }

  onClear(): void {
    this.filterForm.reset({
      type: null,
      code: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null,
      status: null
    });
    this.codeOptions = [];
    this.filteredCodeOptions = [];
    this.filteredTypeOptions = [...this.typeOptions];
    this.typeSearchControl.setValue('');
    this.codeSearchControl.setValue('');
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check for date format validation errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const hasDateFormatErrors = !!(
      effectiveDateControl?.hasError('invalidDateFormat') ||
      effectiveDateControl?.hasError('matDatepickerParse') ||
      terminationDateControl?.hasError('invalidDateFormat') ||
      terminationDateControl?.hasError('matDatepickerParse')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    // Period selected but no date entered
    const effectiveDateIncomplete = formValue.effectiveDatePeriod !== null && !formValue.effectiveDate;
    const terminationDateIncomplete = formValue.terminationDatePeriod !== null && !formValue.terminationDate;

    // Date entered but no period selected
    const hasValidationErrors = this.effectivePeriodRequired || this.terminationPeriodRequired;

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.type !== null && formValue.type !== '') ||
      (formValue.code !== null && formValue.code !== '') ||
      formValue.effectiveDate !== null ||
      formValue.terminationDate !== null ||
      (formValue.status !== null && formValue.status !== '');

    return !hasAnyValue || effectiveDateIncomplete || terminationDateIncomplete || hasValidationErrors;
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    this.validateDateInput('effectiveDate', input.value);
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
    this.validateDateInput('terminationDate', input.value);
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  private validateDateInput(controlName: string, rawValue: string): void {
    const control = this.filterForm.get(controlName);
    if (!control) return;
    control.markAsTouched();
    if (rawValue && rawValue.trim() && !control.value) {
      control.setErrors({ invalidDateFormat: true });
    }
    this.cdr.markForCheck();
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }
}
