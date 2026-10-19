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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ErrorStateMatcher, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AccessManagementFilterValue } from '../models/access-management.model';
import { AccessManagementService } from '../services/access-management.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface FilterData {
  chapterIds?: string[];
  alertRequiredOptions?: string[];
}

interface FilterOptionsResponse {
  item?: FilterData;
  data?: FilterData[];
  chapterIds?: string[];
  alertRequiredOptions?: string[];
}

@Component({
  selector: 'app-access-management-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
    MatFormFieldModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './access-management-filter-panel.html',
  styleUrls: ['./access-management-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessManagementFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: AccessManagementFilterValue | null = null;
  @Output() apply = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  allChapterIdOptions: string[] = [];
  chapterIdOptions: string[] = [];
  chapterIdSearchControl = new FormControl('');

  alertRequiredOptions: string[] = [];

  isLoadingFilters = false;

  /** Sentinel values for disabled mat-option rows in the panel (loading / empty). */
  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

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
    private accessManagementService: AccessManagementService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Setup search functionality
    this.setupChapterIdSearch();

    // Determine period values from current filters
    const effectiveDatePeriod = this.currentFilters?.effectiveDateFrom
      ? 'After'
      : this.currentFilters?.effectiveDateTo
        ? 'Before'
        : null;

    const terminationDatePeriod = this.currentFilters?.terminationDateFrom
      ? 'After'
      : this.currentFilters?.terminationDateTo
        ? 'Before'
        : null;

    // Determine which date value to use based on the period
    const effectiveDateStr = this.currentFilters?.effectiveDateFrom
      || this.currentFilters?.effectiveDateTo
      || null;

    const terminationDateStr = this.currentFilters?.terminationDateFrom
      || this.currentFilters?.terminationDateTo
      || null;

    // Parse dates to Date objects if they exist
    const parseDate = (dateStr: string | null): Date | null => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    this.filterForm = this.fb.group({
      chapterId: [this.currentFilters?.chapterId || null],
      alertRequired: [this.currentFilters?.alertRequired || null],
      effectiveDatePeriod: [effectiveDatePeriod],
      effectiveDate: [parseDate(effectiveDateStr)],
      terminationDatePeriod: [terminationDatePeriod],
      terminationDate: [parseDate(terminationDateStr)]
    });

    // Setup validation listeners for effective date
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effectiveDate');
        const periodControl = this.filterForm.get('effectiveDatePeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        // Mark period as touched when a valid date is selected
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

        // Mark period as touched when date becomes valid
        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
      });

    // Setup validation listeners for termination date
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('terminationDate');
        const periodControl = this.filterForm.get('terminationDatePeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        // Mark period as touched when a valid date is selected
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

        // Mark period as touched when date becomes valid
        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
      });

    this.loadFilterOptions();
  }

  /**
   * Setup Chapter ID search
   */
  private setupChapterIdSearch(): void {
    this.chapterIdSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        if (search && search.length >= 1) {
          this.chapterIdOptions = this.allChapterIdOptions.filter(o =>
            o.toLowerCase().includes(search.toLowerCase())
          );
        } else {
          this.chapterIdOptions = [...this.allChapterIdOptions];
        }
        this.cdr.markForCheck();
      });
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const effectiveDate = effectiveDateControl?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = effectiveDate && !effectiveDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !effectiveDatePeriod) {
      effectiveDatePeriodControl?.setErrors({ required: true });
      effectiveDatePeriodControl?.markAsTouched();
    } else {
      effectiveDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const terminationDateControl = this.filterForm.get('terminationDate');
    const terminationDate = terminationDateControl?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    // Only require period if date is valid (no date validation errors)
    const hasValidDate = terminationDate && !terminationDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !terminationDatePeriod) {
      terminationDatePeriodControl?.setErrors({ required: true });
      terminationDatePeriodControl?.markAsTouched();
    } else {
      terminationDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }


  /**
   * Load filter options from service
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.accessManagementService.getAccessManagementFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: FilterOptionsResponse) => {
          let filterData: FilterData | null = null;

          if (response.item) {
            filterData = response.item;
          } else if (response.data && response.data.length > 0) {
            filterData = response.data[0];
          } else if (response.chapterIds || response.alertRequiredOptions) {
            filterData = {
              chapterIds: response.chapterIds,
              alertRequiredOptions: response.alertRequiredOptions
            };
          }

          if (filterData) {
            this.allChapterIdOptions = filterData.chapterIds || [];

            // Re-apply current search filter if one exists
            const currentSearch = this.chapterIdSearchControl.value;
            if (currentSearch && currentSearch.length >= 1) {
              this.chapterIdOptions = this.allChapterIdOptions.filter(o =>
                o.toLowerCase().includes(currentSearch.toLowerCase())
              );
            } else {
              this.chapterIdOptions = [...this.allChapterIdOptions];
            }

            this.alertRequiredOptions = filterData.alertRequiredOptions || [];
          }

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
      error: (error) => {
        console.error('Error loading filter options:', error);
        this.allChapterIdOptions = [];
        this.chapterIdOptions = [];
        this.alertRequiredOptions = [];
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      }
    });
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    // Prevent apply if any validation errors exist
    if (effectiveDateControl?.errors ||
        terminationDateControl?.errors ||
        effectiveDatePeriodControl?.errors ||
        terminationDatePeriodControl?.errors) {
      // Mark all controls as touched to show all errors
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.markAsTouched();
      effectiveDatePeriodControl?.markAsTouched();
      terminationDatePeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const effectiveDatePeriod = this.filterForm.value.effectiveDatePeriod;
    const effectiveDate = this.filterForm.value.effectiveDate;
    const terminationDatePeriod = this.filterForm.value.terminationDatePeriod;
    const terminationDate = this.filterForm.value.terminationDate;

    const formatDate = (d: any): string => {
      if (!d) return '';

      // If it's already a string in YYYY-MM-DD format, return it
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return d;
      }

      // Try to convert to Date if it has date-like methods
      let dateObj: Date;
      if (d instanceof Date) {
        dateObj = d;
      } else if (d && typeof d.toDate === 'function') {
        // Moment object or similar
        dateObj = d.toDate();
      } else if (d && typeof d === 'object') {
        // Try to create Date from object
        dateObj = new Date(d);
      } else {
        return '';
      }

      // Validate the date
      if (isNaN(dateObj.getTime())) {
        return '';
      }

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const filters: AccessManagementFilterValue = {
      chapterId: this.filterForm.value.chapterId || null,
      alertRequired: this.filterForm.value.alertRequired || null,
      effectiveDateFrom: effectiveDatePeriod === 'After' && effectiveDate
        ? formatDate(effectiveDate)
        : null,
      effectiveDateTo: effectiveDatePeriod === 'Before' && effectiveDate
        ? formatDate(effectiveDate)
        : null,
      terminationDateFrom: terminationDatePeriod === 'After' && terminationDate
        ? formatDate(terminationDate)
        : null,
      terminationDateTo: terminationDatePeriod === 'Before' && terminationDate
        ? formatDate(terminationDate)
        : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      chapterId: null,
      alertRequired: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });

    this.filterForm.get('effectiveDatePeriod')?.setErrors(null);
    this.filterForm.get('terminationDatePeriod')?.setErrors(null);

    // Reset search control and options
    this.chapterIdSearchControl.setValue('', { emitEvent: false });
    this.chapterIdOptions = [...this.allChapterIdOptions];

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    // Check if at least one field has a value
    const values = this.filterForm?.value;
    const hasChapterId = values?.chapterId && values.chapterId !== null;
    const hasAlertRequired = values?.alertRequired && values.alertRequired !== null;
    const hasEffectiveDate = values?.effectiveDatePeriod || values?.effectiveDate;
    const hasTerminationDate = values?.terminationDatePeriod || values?.terminationDate;

    const hasAnyValue = hasChapterId || hasAlertRequired || hasEffectiveDate || hasTerminationDate;

    // Disable if no values OR if form has validation errors
    if (!hasAnyValue) {
      return true;
    }

    // Check for validation errors
    const effectiveDateControl = this.filterForm.get('effectiveDate');
    const terminationDateControl = this.filterForm.get('terminationDate');
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    const hasDateErrors = (effectiveDateControl?.invalid ?? false) || (terminationDateControl?.invalid ?? false);
    const hasPeriodErrors = (effectiveDatePeriodControl?.invalid ?? false) || (terminationDatePeriodControl?.invalid ?? false);

    return hasDateErrors || hasPeriodErrors;
  }

  get effDatePeriodRequired(): boolean {
    const c = this.filterForm?.get('effectiveDate');
    return !!c?.value && !c?.hasError('matDatepickerParse') && !this.filterForm?.get('effectiveDatePeriod')?.value;
  }

  get termDatePeriodRequired(): boolean {
    const c = this.filterForm?.get('terminationDate');
    return !!c?.value && !c?.hasError('matDatepickerParse') && !this.filterForm?.get('terminationDatePeriod')?.value;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
