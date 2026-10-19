import { Component, inject, signal, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ReportActionFilterValue } from '../models/report-action.model';
import { ReportActionService } from '../services/report-action.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// Custom DateAdapter to use chapter timezone for "today"
class ChapterTimezoneCustomDateAdapter extends CustomDateAdapter {
  private chapterMinDate: Date | null = null;

  setChapterMinDate(date: Date): void {
    this.chapterMinDate = date;
  }

  override today(): Date {
    // Return chapter timezone's current date instead of browser's local date
    return this.chapterMinDate ? new Date(this.chapterMinDate) : new Date();
  }

  override format(date: Date, displayFormat: Object): string {
    // Get the default formatted date from parent
    const formatted = super.format(date, displayFormat);
    // Convert month abbreviation to uppercase (e.g., "Apr" -> "APR")
    return formatted.toUpperCase();
  }
}

/**
 * Report Action Filter Panel Component
 * Overlay panel for filtering report actions
 * Uses chapter timezone for date picker "today" highlighting
 * Displays dates in DD-MMM-YYYY format
 */
@Component({
  selector: 'app-report-action-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterTimezoneCustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './report-action-filter-panel.component.html',
  styleUrls: ['./report-action-filter-panel.component.scss']
})
export class ReportActionFilterPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly dateAdapter = inject(DateAdapter);
  private readonly reportActionService = inject(ReportActionService);

  // Signal for current filter values
  currentFilters = signal<ReportActionFilterValue>({});

  // Signal for supervisor mode - controls whether user filter is shown
  isSupervisorMode = signal<boolean>(false);

  // Signal for available user names in dropdown
  availableUserNames = signal<string[]>([]);
  filteredUserNames = signal<string[]>([]);

  // Search control for user dropdown
  readonly userSearchControl = new FormControl('');

  // Output events
  apply = output<ReportActionFilterValue>();
  cancel = output<void>();

  // Form
  filterForm: FormGroup;

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  constructor() {
    // Get chapter timezone and set minDate based on chapter date
    const chapterTimezone = this.headerService.chapterTimeZone();
    const minDateMoment = DateFieldValidationUtility.getMinDate(chapterTimezone);
    const minDate = minDateMoment.toDate();

    // Set chapter timezone's current date as "today" for the datepicker
    if (this.dateAdapter instanceof ChapterTimezoneCustomDateAdapter) {
      this.dateAdapter.setChapterMinDate(minDate);
    }

    // Initialize form with empty values - will be populated in ngOnInit
    this.filterForm = this.fb.group({
      userName: [''],
      generatedPeriodType: [null],
      generatedDate: [null, [dateFormatValidator()]]
    });

    // Set custom validator for period
    this.filterForm.get('generatedPeriodType')?.setValidators(this.periodRequiredValidator.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    // Populate form with current filter values
    this.populateFormWithCurrentFilters();
    this.loadUsers();
    this.setupPeriodValidation();
    this.setupUserSearch();
  }

  /**
   * Populate form with current filter values
   */
  private populateFormWithCurrentFilters(): void {
    const filters = this.currentFilters();
    this.filterForm.patchValue({
      userName: filters.userName || '',
      generatedPeriodType: filters.generatedPeriodType || null,
      generatedDate: filters.generatedDate || null
    }, { emitEvent: false });
  }

  /**
   * Custom validator for period field
   */
  private periodRequiredValidator(control: AbstractControl): ValidationErrors | null {
    const generatedDate = this.filterForm?.get('generatedDate')?.value;
    if (generatedDate && !control.value) {
      return { periodRequired: true };
    }
    return null;
  }

  /**
   * Setup validation for period when date is selected
   */
  private setupPeriodValidation(): void {
    this.filterForm.get('generatedDate')?.valueChanges.subscribe(() => {
      const periodControl = this.filterForm.get('generatedPeriodType');
      periodControl?.updateValueAndValidity();
      // Mark as touched to show error immediately
      if (this.filterForm.get('generatedDate')?.value && !periodControl?.value) {
        periodControl?.markAsTouched();
      }
    });
  }

  private setupUserSearch(): void {
    this.userSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(search => {
        const users = this.availableUserNames();
        if (search && search.length >= 1) {
          const lower = search.toLowerCase();
          this.filteredUserNames.set(users.filter(user =>
            user.toLowerCase().includes(lower)
          ));
        } else {
          this.filteredUserNames.set([...users]);
        }
      });
  }

  private loadUsers(): void {
    if (this.isSupervisorMode()) {
      this.reportActionService.getDistinctUsernames().subscribe({
        next: (users) => {
          this.availableUserNames.set(users);
          this.filteredUserNames.set([...users]);
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.availableUserNames.set([]);
          this.filteredUserNames.set([]);
        }
      });
    }
  }

  /**
   * Apply filters
   */
  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: ReportActionFilterValue = {
      // Only include userName filter in supervisor mode
      userName: this.isSupervisorMode() && formValue.userName ? formValue.userName : undefined,
      generatedPeriodType: formValue.generatedDate ? formValue.generatedPeriodType : undefined,
      generatedDate: formValue.generatedDate || undefined
    };

    this.apply.emit(filters);
  }

  /**
   * Cancel and close panel
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Clear all filters in the form only (does NOT apply or clear chips outside)
   * User must click APPLY to actually clear the filters
   */
  onClear(): void {
    this.filterForm.reset({
      userName: '',
      generatedPeriodType: null,
      generatedDate: null
    });
    this.userSearchControl.reset();
    this.filteredUserNames.set([...this.availableUserNames()]);
  }

  /**
   * Check if any filter is applied
   * Note: Period alone without date doesn't count as a valid filter
   */
  get hasFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      formValue.userName ||
      formValue.generatedDate
    );
  }

  /**
   * Check if apply button should be disabled
   * Disabled when:
   * - No filters are selected (userName or generatedDate)
   * - Form is invalid (e.g., date format errors)
   * - Period is selected but Date is not selected (incomplete filter)
   */
  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check for date format validation errors
    const generatedDateControl = this.filterForm.get('generatedDate');
    const hasDateFormatErrors = !!(
      generatedDateControl?.hasError('invalidDateFormat') ||
      generatedDateControl?.hasError('matDatepickerParse') ||
      generatedDateControl?.hasError('invalidDate')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    // Check if period is selected but date is not (incomplete filter)
    const periodSelectedButNoDate = formValue.generatedPeriodType !== null && !formValue.generatedDate;

    if (periodSelectedButNoDate) {
      return true;
    }

    // Disable if no filters are applied
    return !this.hasFilters;
  }

  /**
   * Check if clear button should be disabled
   */
  get isClearDisabled(): boolean {
    return !this.hasFilters;
  }

  /**
   * Get error message for Generated Date field
   */
  getGeneratedDateError(): string {
    const control = this.filterForm.get('generatedDate');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('invalidDateFormat') ||
        control.hasError('invalidDate') ||
        control.hasError('matDatepickerParse')) {
      return 'Date is invalid';
    }

    return '';
  }

  /**
   * Handle input on Generated Date field
   */
  onGeneratedDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('generatedDate');

    control?.markAsDirty();
    control?.markAsTouched();

    DateFieldValidationUtility.handleEndDateInput(
      inputValue,
      control,
      false // Not in edit mode
    );
  }

  /**
   * Handle blur on Generated Date field
   */
  onGeneratedDateBlur(): void {
    const control = this.filterForm.get('generatedDate');

    if (control?.value || control?.dirty) {
      control?.markAsTouched();
    }
  }
}
