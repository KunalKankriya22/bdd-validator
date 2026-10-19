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

import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override-query.model';
import { LookupDto } from '../services/valid-donor-override-api.service';

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
  @Input() cueOptions: LookupDto[] = [];
  @Input() typeOptions: LookupDto[] = [];
  @Output() apply = new EventEmitter<DonorInterdictionOverrideFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Search controls for Cue and Type
  allCueOptions: LookupDto[] = [];
  filteredCueOptions: LookupDto[] = [];
  cueSearchControl = new FormControl('');

  allTypeOptions: LookupDto[] = [];
  filteredTypeOptions: LookupDto[] = [];
  typeSearchControl = new FormControl('');

  periodOptions: string[] = ['After', 'Before'];

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize search options
    this.allCueOptions = [...this.cueOptions];
    this.filteredCueOptions = [...this.cueOptions];
    this.allTypeOptions = [...this.typeOptions];
    this.filteredTypeOptions = [...this.typeOptions];

    // Setup search functionality
    this.setupCueSearch();
    this.setupTypeSearch();

    this.filterForm = this.fb.group({
      cue: [this.currentFilters?.cue ?? null],
      type: [this.currentFilters?.type ?? null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod ?? null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null,
        [dateFormatValidator()]
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod ?? null],
      terminationDate: [
        this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null,
        [dateFormatValidator()]
      ]
    });

    // Add immediate validation on date changes
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      // Mark field as touched when user types to show validation errors
      const control = this.filterForm.get('effectiveDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      // Mark field as touched when user types to show validation errors
      const control = this.filterForm.get('terminationDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    // Clear errors when period is selected
    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectivePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationPeriod();
      this.cdr.markForCheck();
    });
  }

  /**
   * Setup Cue search
   */
  private setupCueSearch(): void {
    this.cueSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        if (search && search.length >= 1) {
          this.filteredCueOptions = this.allCueOptions.filter(o =>
            o.code.toLowerCase().includes(search.toLowerCase()) ||
            o.description.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredCueOptions = [...this.allCueOptions];
        }
        this.cdr.markForCheck();
      });
  }

  /**
   * Setup Type search
   */
  private setupTypeSearch(): void {
    this.typeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        if (search && search.length >= 1) {
          this.filteredTypeOptions = this.allTypeOptions.filter(o =>
            o.code.toLowerCase().includes(search.toLowerCase()) ||
            o.description.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.filteredTypeOptions = [...this.allTypeOptions];
        }
        this.cdr.markForCheck();
      });
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
    const hasCue = values?.cue !== null && values?.cue !== undefined;
    const hasType = values?.type !== null && values?.type !== undefined;
    // For date fields, both period AND date must be present
    const hasEffectiveDate = values?.effectiveDatePeriod && values?.effectiveDate;
    const hasTerminationDate = values?.terminationDatePeriod && values?.terminationDate;

    return !(hasCue || hasType || hasEffectiveDate || hasTerminationDate);
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: DonorInterdictionOverrideFilterValue = {
      cue: formValue.cue || null,
      type: formValue.type || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      cue: null,
      type: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });

    // Clear raw input storage
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;

    // Reset search controls and options
    this.cueSearchControl.setValue('', { emitEvent: false });
    this.filteredCueOptions = [...this.allCueOptions];
    this.typeSearchControl.setValue('', { emitEvent: false });
    this.filteredTypeOptions = [...this.allTypeOptions];

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
