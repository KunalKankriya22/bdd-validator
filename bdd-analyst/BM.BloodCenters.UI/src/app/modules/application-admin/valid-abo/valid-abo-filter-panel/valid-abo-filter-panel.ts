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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import moment from 'moment';

import { ValidAboService } from '../services/valid-abo.service';
import { ValidAboFilterValue } from '../models/valid-abo.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-valid-abo-filter-panel',
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
    MatProgressSpinnerModule,
    TranslateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './valid-abo-filter-panel.html',
  styleUrls: ['./valid-abo-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidAboFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ValidAboFilterValue | null = null;
  @Output() apply = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  @ViewChild('effectiveDateInput') effectiveDateInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput') terminationDateInputRef!: ElementRef<HTMLInputElement>;

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.effectiveDateInputRef?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.terminationDateInputRef?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  filterForm!: FormGroup;
  private destroy$ = new Subject<void>();

  intendedUseOptions: string[] = []; // Loaded from LOV API
  filteredIntendedUseOptions: string[] = [];
  intendedUseSearchControl = new FormControl<string>('');

  // FE enums — match FMB validation
  unitSchemeOptions: string[] = ['ISBT128', 'Codabar'];
  filteredUnitSchemeOptions: string[] = [];
  unitSchemeSearchControl = new FormControl<string>('');

  transfusionStatusOptions: string[] = ['Transfusable', 'Not Transfusable', 'Biohazard', 'Manufacturing', 'HOLD'];
  filteredTransfusionStatusOptions: string[] = [];
  transfusionStatusSearchControl = new FormControl<string>('');

  periodOptions: string[] = ['Before', 'After'];

  isLoadingFilters = false;
  showEffectiveDatePeriodError = false;
  showTerminationDatePeriodError = false;

  // Sentinel values for disabled mat-option rows
  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  constructor(
    private fb: FormBuilder,
    private service: ValidAboService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Initialize filtered arrays for FE enums
    this.filteredUnitSchemeOptions = [...this.unitSchemeOptions];
    this.filteredTransfusionStatusOptions = [...this.transfusionStatusOptions];

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
      intendedUse: [this.currentFilters?.intendedUse || null],
      unitScheme: [this.currentFilters?.unitScheme || null],
      transfusionStatus: [this.currentFilters?.transfusionStatus || null],
      effectiveDatePeriod: [effectiveDatePeriod],
      effectiveDate: [parseDate(effectiveDateStr)],
      terminationDatePeriod: [terminationDatePeriod],
      terminationDate: [parseDate(terminationDateStr)]
    });

    // Setup search for Intended Use dropdown
    this.intendedUseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredIntendedUseOptions = this.intendedUseOptions.filter((option) =>
          option.toLowerCase().includes(term)
        );
      });

    // Setup search for Unit Scheme dropdown
    this.unitSchemeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredUnitSchemeOptions = this.unitSchemeOptions.filter((option) =>
          option.toLowerCase().includes(term)
        );
      });

    // Setup search for Transfusion Status dropdown
    this.transfusionStatusSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredTransfusionStatusOptions = this.transfusionStatusOptions.filter((option) =>
          option.toLowerCase().includes(term)
        );
      });

    // Clear error flags when effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEffectiveDatePeriodError = false;
      });

    // Clear error flags when effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showEffectiveDatePeriodError = false;
      });

    // Clear error flags when termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTerminationDatePeriodError = false;
      });

    // Clear error flags when termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTerminationDatePeriodError = false;
      });

    this.loadFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('invalidDateFormat')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effectiveDateInputRef)) return 'Effective Date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (control.hasError('invalidDateFormat')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.terminationDateInputRef)) return 'Termination Date is invalid';
    return '';
  }

  private loadFilters(): void {
    this.isLoadingFilters = true;
    this.intendedUseOptions = [];
    this.filteredIntendedUseOptions = [];

    this.service.getValidAboFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          // Only Intended Use comes from LOV API — Unit Scheme and Transfusion Status are FE enums
          const data = response.Data?.[0] || response.Data || response.Item || response;
          this.intendedUseOptions = data?.intendedUse ?? [];
          this.filteredIntendedUseOptions = [...this.intendedUseOptions];
          this.intendedUseSearchControl.setValue('', { emitEvent: false });

          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.intendedUseOptions = [];
          this.filteredIntendedUseOptions = [];
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  onApply(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    const formValue = this.filterForm.value;

    // Check for period validation errors
    this.showEffectiveDatePeriodError = !!(formValue.effectiveDate && !formValue.effectiveDatePeriod);
    this.showTerminationDatePeriodError = !!(formValue.terminationDate && !formValue.terminationDatePeriod);

    // If there are validation errors, stop here
    if (this.filterForm.invalid || this.showEffectiveDatePeriodError || this.showTerminationDatePeriodError) {
      this.cdr.markForCheck();
      return;
    }

    const effectiveDatePeriod = formValue.effectiveDatePeriod;
    const effectiveDate = formValue.effectiveDate;
    const terminationDatePeriod = formValue.terminationDatePeriod;
    const terminationDate = formValue.terminationDate;

    const formatDate = (d: any): string => {
      if (!d) return '';

      // Handle Moment objects (from ChapterAwareDateAdapter)
      if (moment.isMoment(d)) {
        return d.format('YYYY-MM-DD');
      }

      // Handle Date objects (fallback)
      if (d instanceof Date && !isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      return '';
    };

    const filters: ValidAboFilterValue = {
      intendedUse: formValue.intendedUse || null,
      unitScheme: formValue.unitScheme || null,
      transfusionStatus: formValue.transfusionStatus || null,
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

    // Check if period is selected without a corresponding date
    const formValue_ = this.filterForm.value;
    if (formValue_.effectiveDatePeriod && !formValue_.effectiveDate) {
      return true;
    }
    if (formValue_.terminationDatePeriod && !formValue_.terminationDate) {
      return true;
    }

    // Check if at least one field has a value
    const formValue = this.filterForm.value;
    const hasAnyValue = formValue.intendedUse ||
                        formValue.unitScheme ||
                        formValue.transfusionStatus ||
                        formValue.effectiveDate ||
                        formValue.terminationDate;

    return !hasAnyValue;
  }

  onClear(): void {
    this.filterForm.reset();
    this.showEffectiveDatePeriodError = false;
    this.showTerminationDatePeriodError = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
