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
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of, catchError } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Moment } from 'moment';

import { DonProcConsentDefinitionFilterValue } from '../models/don-proc-consent-definition.model';
import { DonProcConsentDefinitionService } from '../services/don-proc-consent-definition.service';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@Component({
  selector: 'app-consent-definition-filter-panel',
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
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './consent-definition-filter-panel.html',
  styleUrls: ['./consent-definition-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class ConsentDefinitionFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DonProcConsentDefinitionFilterValue | null = null;
  @Output() apply = new EventEmitter<DonProcConsentDefinitionFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  donationTypeOptions: { code: string; description: string }[] = [];
  procedureCodeOptions: { code: string; description: string }[] = [];
  consentCodeOptions: { code: string; description: string }[] = [];
  periodOptions: string[] = ['After', 'Before'];

  isLoadingFilters = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  donationTypeSearchControl = new FormControl('');
procedureCodeSearchControl = new FormControl('');
consentCodeSearchControl = new FormControl('');

// Filtered arrays
filteredDonationTypeOptions: { code: string; description: string }[] = [];
filteredProcedureCodeOptions: { code: string; description: string }[] = [];
filteredConsentCodeOptions: { code: string; description: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private consentDefinitionService: DonProcConsentDefinitionService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) { }

  ngOnInit(): void {
    // Initialize form with current filters if they exist
    this.filterForm = this.fb.group({
      donationType: [this.currentFilters?.donationType || null],
      procedureCode: [this.currentFilters?.procedureCode || null],
      consentCode: [this.currentFilters?.consentCode || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate ? new Date(this.currentFilters.effectiveDate) : null, [dateFormatValidator()]],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate ? new Date(this.currentFilters.terminationDate) : null, [dateFormatValidator()]]
    });

    this.setupValidation();
    this.loadFilterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // Watch for any form changes to trigger change detection
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Watch for effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('effectiveDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
        }
      });

    // Watch for termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const periodControl = this.filterForm.get('terminationDatePeriod');
        if (value && periodControl) {
          periodControl.markAsTouched();
          periodControl.updateValueAndValidity({ emitEvent: false });
        }
      });

    // Set validators
    this.filterForm.get('effectiveDatePeriod')?.setValidators([this.effectiveDatePeriodValidator.bind(this)]);
    this.filterForm.get('terminationDatePeriod')?.setValidators([this.terminationDatePeriodValidator.bind(this)]);
  }

  private effectiveDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    if (effectiveDate && !control.value) {
      return { required: true };
    }
    return null;
  }

  private terminationDatePeriodValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.filterForm) return null;
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    if (terminationDate && !control.value) {
      return { required: true };
    }
    return null;
  }

  /**
   * Type guard to check whether a value matches the expected filter data structure.
   */
  private isFilterData(
    value: unknown
  ): value is { donationType?: string[]; procedureCode?: string[]; consentCode?: string[] } {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const obj = value as { [key: string]: unknown };

    const isOptionalStringArray = (prop: string): boolean => {
      if (!(prop in obj) || obj[prop] === undefined || obj[prop] === null) {
        return true;
      }
      if (!Array.isArray(obj[prop])) {
        return false;
      }
      return (obj[prop] as unknown[]).every(item => typeof item === 'string');
    };

    return (
      isOptionalStringArray('donationType') &&
      isOptionalStringArray('procedureCode') &&
      isOptionalStringArray('consentCode')
    );
  }

  /**
   * Load filter options from backend API.
   * Fetches filter codes and descriptions in parallel so dropdowns
   * are ready with "code - description" as soon as both calls resolve.
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    const chapterId = this.headerService.getCurrentChapterId();

    forkJoin({
      filters: this.consentDefinitionService.getConsentDefinitionFilters(chapterId).pipe(
        catchError(() => of(null))
      ),
      createData: this.consentDefinitionService.getCreateData(chapterId || undefined).pipe(
        catchError(() => of({ data: null }))
      )
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ filters, createData }) => {
        // Extract filter codes
        let filterData: { donationType?: string[]; procedureCode?: string[]; consentCode?: string[] } | null = null;

        if (filters && typeof filters === 'object') {
          const respObj = filters as { item?: unknown; data?: unknown };

          if (this.isFilterData(respObj.item)) {
            filterData = respObj.item;
          } else if (Array.isArray(respObj.data) && respObj.data.length > 0 && this.isFilterData(respObj.data[0])) {
            filterData = respObj.data[0];
          }
        }

        if (!filterData && this.isFilterData(filters)) {
          filterData = filters;
        }

        // Build description maps from createData
        const createDataObj = (createData as { data?: { donationTypes?: { donationType: string; description: string }[]; consentCodes?: { consentCode: string; consentDescription: string }[] } })?.data;
        const donationTypeDescMap = new Map<string, string>();
        if (Array.isArray(createDataObj?.donationTypes)) {
          createDataObj.donationTypes.forEach(dt => {
            donationTypeDescMap.set(dt.donationType, dt.description || '');
          });
        }

        const consentCodeDescMap = new Map<string, string>();
        if (Array.isArray(createDataObj?.consentCodes)) {
          createDataObj.consentCodes.forEach(cc => {
            consentCodeDescMap.set(cc.consentCode, cc.consentDescription || '');
          });
        }

        if (filterData) {
          this.donationTypeOptions = (filterData.donationType || []).map(code => ({
            code,
            description: donationTypeDescMap.get(code) || ''
          }));
          this.procedureCodeOptions = (filterData.procedureCode || []).map(code => ({ code, description: '' }));
          this.consentCodeOptions = (filterData.consentCode || []).map(code => ({
            code,
            description: consentCodeDescMap.get(code) || ''
          }));
        } else {
          this.donationTypeOptions = [];
          this.procedureCodeOptions = [];
          this.consentCodeOptions = [];
        }

        this.setupDropdownSearch();
        this.isLoadingFilters = false;
        this.cdr.markForCheck();

        // Load procedure code descriptions in background
        this.loadProcedureDescriptions(chapterId, filterData?.donationType || []);
      });
  }

  private loadProcedureDescriptions(chapterId: string, donationTypes: string[]): void {
    if (donationTypes.length === 0) return;

    const procCalls = donationTypes.map(dt =>
      this.consentDefinitionService.getProcedureCodesByDonationType(dt, chapterId || undefined).pipe(
        catchError(() => of({ data: [] }))
      )
    );

    forkJoin(procCalls)
      .pipe(takeUntil(this.destroy$))
      .subscribe((procResponses: unknown[]) => {
        const procDescMap = new Map<string, string>();
        procResponses.forEach((resp: unknown) => {
          const respData = (resp as { data?: { procedureCode: string; description?: string }[] })?.data;
          if (Array.isArray(respData)) {
            respData.forEach(p => {
              if (p.procedureCode && !procDescMap.has(p.procedureCode)) {
                procDescMap.set(p.procedureCode, p.description || '');
              }
            });
          }
        });

        this.procedureCodeOptions = this.procedureCodeOptions.map(opt => ({
          ...opt,
          description: procDescMap.get(opt.code) || ''
        }));

        const procSearch = (this.procedureCodeSearchControl.value || '').toLowerCase();
        this.filteredProcedureCodeOptions = !procSearch
          ? [...this.procedureCodeOptions]
          : this.procedureCodeOptions.filter(o =>
              o.code.toLowerCase().includes(procSearch) ||
              o.description.toLowerCase().includes(procSearch));

        this.cdr.markForCheck();
      });
  }

  onApply(): void {
    this.filterForm.markAllAsTouched();

    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: DonProcConsentDefinitionFilterValue = {
      donationType: formValue.donationType || null,
      procedureCode: formValue.procedureCode || null,
      consentCode: formValue.consentCode || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: this.convertToUTCDate(formValue.effectiveDate)?.toISOString() || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: this.convertToUTCDate(formValue.terminationDate)?.toISOString() || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      donationType: null,
      procedureCode: null,
      consentCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });

    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';

    // Clear validation state
    Object.keys(this.filterForm.controls).forEach(key => {
      const control = this.filterForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
      control?.updateValueAndValidity();
    });

    // Force change detection after form is fully reset
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  onClose(): void {
    this.close.emit();
  }

  get effectiveDatePeriodControl() {
    return this.filterForm?.get('effectiveDatePeriod');
  }

  get terminationDatePeriodControl() {
    return this.filterForm?.get('terminationDatePeriod');
  }

  getEffectiveDatePeriodError(): string {
    const dateControl = this.filterForm.get('effectiveDate');
    const periodControl = this.effectiveDatePeriodControl;
    // Show error if date has value but period is not selected
    if (dateControl?.value && periodControl && periodControl.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  getTerminationDatePeriodError(): string {
    const dateControl = this.filterForm.get('terminationDate');
    const periodControl = this.terminationDatePeriodControl;
    // Show error if date has value but period is not selected
    if (dateControl?.value && periodControl && periodControl.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  get isApplyDisabled(): boolean {
    // Check for date format validation errors
    const effDateControl = this.filterForm.get('effectiveDate');
    const termDateControl = this.filterForm.get('terminationDate');
    const hasDateFormatErrors = !!(
      effDateControl?.hasError('invalidDateFormat') ||
      effDateControl?.hasError('matDatepickerParse') ||
      termDateControl?.hasError('invalidDateFormat') ||
      termDateControl?.hasError('matDatepickerParse')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    // Check for validation errors
    if (this.filterForm.invalid) {
      return true;
    }

    // Check if at least one field has a value
    const values = this.filterForm?.value;
    const hasDonationType = values?.donationType && values.donationType !== null;
    const hasProcedureCode = values?.procedureCode && values.procedureCode !== null;
    const hasConsentCode = values?.consentCode && values.consentCode !== null;
    const hasEffectiveDate = values?.effectiveDate;
    const hasTerminationDate = values?.terminationDate;

    return !(hasDonationType || hasProcedureCode || hasConsentCode || hasEffectiveDate || hasTerminationDate);
  }

  /**
   * Convert Date or Moment to UTC Date at midnight
   * This ensures the selected date is preserved regardless of timezone
   */
  private convertToUTCDate(date: Date | Moment | null): Date | null {
    if (!date) return null;

    // Convert Moment to Date if needed
    const dateObj: Date = date instanceof Date ? date : (date as Moment).toDate();

    // Handle Date objects
    return new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      0, 0, 0, 0
    ));
  }

  private setupDropdownSearch(): void {
  this.filteredDonationTypeOptions = [...this.donationTypeOptions];
  this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];
  this.filteredConsentCodeOptions = [...this.consentCodeOptions];

  this.donationTypeSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      this.filteredDonationTypeOptions = !search
        ? [...this.donationTypeOptions]
        : this.donationTypeOptions.filter(o =>
            o.code.toLowerCase().includes(search.toLowerCase()) ||
            o.description.toLowerCase().includes(search.toLowerCase()));
      this.cdr.markForCheck();
    });

  this.procedureCodeSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      this.filteredProcedureCodeOptions = !search
        ? [...this.procedureCodeOptions]
        : this.procedureCodeOptions.filter(o =>
            o.code.toLowerCase().includes(search.toLowerCase()) ||
            o.description.toLowerCase().includes(search.toLowerCase()));
      this.cdr.markForCheck();
    });

  this.consentCodeSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      this.filteredConsentCodeOptions = !search
        ? [...this.consentCodeOptions]
        : this.consentCodeOptions.filter(o =>
            o.code.toLowerCase().includes(search.toLowerCase()) ||
            o.description.toLowerCase().includes(search.toLowerCase()));
      this.cdr.markForCheck();
    });
}

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
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
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      // If control has no value but we have raw input, restore it
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
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
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      // If control has no value but we have raw input, restore it
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  onDonationTypeDropdownClosed(): void {
  this.donationTypeSearchControl.setValue('');
  this.filteredDonationTypeOptions = [...this.donationTypeOptions];
}

onProcedureCodeDropdownClosed(): void {
  this.procedureCodeSearchControl.setValue('');
  this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];
}

onConsentCodeDropdownClosed(): void {
  this.consentCodeSearchControl.setValue('');
  this.filteredConsentCodeOptions = [...this.consentCodeOptions];
}

}
