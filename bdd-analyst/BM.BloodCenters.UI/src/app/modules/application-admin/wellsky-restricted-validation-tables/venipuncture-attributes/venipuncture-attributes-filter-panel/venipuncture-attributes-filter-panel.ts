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
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import { VenipunctureAttributesFilterValue } from '../models/venipuncture-attributes.model';
import { VenipunctureAttributesService } from '../services/venipuncture-attributes.service';

@Component({
  selector: 'app-venipuncture-attributes-filter-panel',
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
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './venipuncture-attributes-filter-panel.html',
  styleUrls: ['./venipuncture-attributes-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class VenipunctureAttributesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: VenipunctureAttributesFilterValue | null = null;
  @Output() apply = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  filterForm!: FormGroup;
  private destroy$ = new Subject<void>();

  codeOptions: string[] = [];
  filteredCodeOptions: string[] = [];
  codeSearchControl = new FormControl<string>('');

  isLoadingFilters = false;
  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

  /**
   * Sentinel values for disabled mat-option rows in the panel (loading / empty).
   * Not valid codes; options are disabled so they never become the control value.
   */
  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  // Custom error matchers
  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effDateNativeInput);
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.termDateNativeInput);
    }
  };

  constructor(
    private fb: FormBuilder,
    private venipunctureAttributesService: VenipunctureAttributesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      code: [this.currentFilters?.code || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [
        this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null
      ],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [
        this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null
      ]
    });

    // Clear error flags when effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.effectivePeriodRequired = false;
      });

    // Clear error flags when effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.effectivePeriodRequired = false;
      });

    // Clear error flags when termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.terminationPeriodRequired = false;
      });

    // Clear error flags when termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.terminationPeriodRequired = false;
      });

    // Setup code dropdown search
    this.codeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredCodeOptions = this.codeOptions.filter((code) =>
          code.toLowerCase().includes(term)
        );
      });

    this.loadFilterOptions();
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
    const hasAnyValue = formValue.code ||
                        formValue.effectiveDate ||
                        formValue.terminationDate;

    return !hasAnyValue;
  }

  /**
   * Load filter options from backend API
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;
    this.codeOptions = [];
    this.filteredCodeOptions = [];

    this.venipunctureAttributesService.getVenipunctureAttributesFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Filter API Response:', response);

          // Handle different response structures: response.item, response.data[0], or response directly
          let filterData = null;

          if (response.item) {
            filterData = response.item;
          } else if (response.data && response.data.length > 0) {
            filterData = response.data[0];
          } else if (response && (response as any).group) {
            // Response might be the filter model directly
            filterData = response as any;
          }

          if (filterData) {
            console.log('Filter Data:', filterData);

            this.codeOptions = filterData.code || [];
            this.filteredCodeOptions = [...this.codeOptions];
            this.codeSearchControl.setValue('', { emitEvent: false });

            console.log('Code Options:', this.codeOptions);
          } else {
            console.warn('No filter data found in response');
          }

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading filter options:', error);
          console.error('Error details:', error.error);
          // Fallback to empty arrays on error
          this.codeOptions = [];
          this.filteredCodeOptions = [];
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effDateNativeInput)) return 'Effective Date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination Date is invalid';
    return '';
  }

  onApply(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    const formValue = this.filterForm.value;

    // Check for period validation errors
    this.effectivePeriodRequired = !!(formValue.effectiveDate && !formValue.effectiveDatePeriod);
    this.terminationPeriodRequired = !!(formValue.terminationDate && !formValue.terminationDatePeriod);

    // If there are validation errors, stop here
    if (this.filterForm.invalid || this.effectivePeriodRequired || this.terminationPeriodRequired) {
      this.cdr.markForCheck();
      return;
    }

    // Format dates before emitting
    const filters: VenipunctureAttributesFilterValue = {
      code: formValue.code || null,
      effectiveDate: formValue.effectiveDate
        ? this.formatDateForApi(formValue.effectiveDate)
        : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      terminationDate: formValue.terminationDate
        ? this.formatDateForApi(formValue.terminationDate)
        : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.codeSearchControl.setValue('', { emitEvent: false });
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Format date to YYYY-MM-DD format for API
   * @param date - Date object
   * @returns Formatted date string
   */
  private formatDateForApi(date: Date | null): string | null {
    if (!date) return null;

    // Ensure we have a valid Date object
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) {
      console.error('Invalid date in formatDateForApi:', date);
      return null;
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
