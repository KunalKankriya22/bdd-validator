import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import { PhysicalFindingsTemplateService } from '../services/physical-findings-template.service';
import {
  PhysicalFindingsTemplateFilterValue,
  DropdownOption
} from '../models/physical-findings-template.model';

@Component({
  selector: 'app-physical-findings-template-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './physical-findings-template-filter-panel.html',
  styleUrls: ['./physical-findings-template-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhysicalFindingsTemplateFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: PhysicalFindingsTemplateFilterValue | null = null;
  @Output() apply = new EventEmitter<PhysicalFindingsTemplateFilterValue>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  filterForm: FormGroup;

  donationTypeOptions: DropdownOption[] = [];
  filteredDonationTypeOptions: DropdownOption[] = [];
  donationTypeSearchControl = new FormControl('');

  procedureCodeOptions: DropdownOption[] = [];
  filteredProcedureCodeOptions: DropdownOption[] = [];
  procedureCodeSearchControl = new FormControl('');

  periodOptions: { value: string; display: string }[] = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' }
  ];

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private templateService: PhysicalFindingsTemplateService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      showInactive: [false],
      donationType: [null],
      procedureCode: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null],
      terminationDatePeriod: [null],
      terminationDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.populateFromCurrentFilters();
    this.setupShowInactiveListener();
    this.setupDatePeriodValidation();
    this.setupDropdownSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDropdowns(): void {
    const showInactive = this.filterForm.get('showInactive')?.value ?? false;
    this.templateService.getDonationTypes(showInactive, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.donationTypeOptions = (response.data || []).map(item => ({
            key: `${item.code} - ${item.description}`,
            value: item.code
          }));
          this.filteredDonationTypeOptions = [...this.donationTypeOptions];
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Error loading donation types:', error);
        }
      });

    this.templateService.getAllProcedureCodes(showInactive, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.procedureCodeOptions = (response.data || []).map(item => ({
            key: item.description,
            value: item.code
          }));
          this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Error loading procedure codes:', error);
        }
      });
  }

  private setupShowInactiveListener(): void {
    this.filterForm.get('showInactive')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.patchValue({ donationType: null, procedureCode: null }, { emitEvent: false });
        this.loadDropdowns();
      });
  }

  private populateFromCurrentFilters(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue({
        showInactive: this.currentFilters.showInactive ?? false,
        donationType: this.currentFilters.donationType,
        procedureCode: this.currentFilters.procedureCode,
        effectiveDatePeriod: this.currentFilters.effectiveDatePeriod,
        effectiveDate: this.currentFilters.effectiveDate
          ? moment(this.currentFilters.effectiveDate as string)
          : null,
        terminationDatePeriod: this.currentFilters.terminationDatePeriod,
        terminationDate: this.currentFilters.terminationDate
          ? moment(this.currentFilters.terminationDate as string)
          : null
      });
    }
  }

  private setupDatePeriodValidation(): void {
    // Validate effective date period when date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      });

    // Clear error when period is selected
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      });

    // Validate termination date period when date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      });

    // Clear error when period is selected
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      });
  }

  validateEffectivePeriod(): void {
    const date = this.filterForm.get('effectiveDate')?.value;
    const period = this.filterForm.get('effectiveDatePeriod')?.value;
    this.effectivePeriodRequired = !!date && !period;
  }

  validateTerminationPeriod(): void {
    const date = this.filterForm.get('terminationDate')?.value;
    const period = this.filterForm.get('terminationDatePeriod')?.value;
    this.terminationPeriodRequired = !!date && !period;
  }

  private setupDropdownSearch(): void {
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm || '').toLowerCase();
        this.filteredDonationTypeOptions = this.donationTypeOptions.filter(option =>
          option.value.toLowerCase().includes(term) ||
          option.key.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm || '').toLowerCase();
        this.filteredProcedureCodeOptions = this.procedureCodeOptions.filter(option =>
          option.value.toLowerCase().includes(term) ||
          option.key.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  onDonationTypeDropdownOpened(opened: boolean): void {
    if (opened) {
      this.donationTypeSearchControl.setValue('');
      this.filteredDonationTypeOptions = [...this.donationTypeOptions];
    }
  }

  onProcedureCodeDropdownOpened(opened: boolean): void {
    if (opened) {
      this.procedureCodeSearchControl.setValue('');
      this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];
    }
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: PhysicalFindingsTemplateFilterValue = {
      showInactive: formValue.showInactive ?? false,
      donationType: formValue.donationType || null,
      procedureCode: formValue.procedureCode || null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      effectiveDate: formValue.effectiveDate || null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  get isApplyDisabled(): boolean {
    // Check if there are validation errors
    if (this.effectivePeriodRequired || this.terminationPeriodRequired) {
      return true;
    }

    const { showInactive, donationType, procedureCode, effectiveDatePeriod, effectiveDate, terminationDatePeriod, terminationDate } = this.filterForm.value;
    const hasEffectiveDate = effectiveDatePeriod || effectiveDate;
    const hasTerminationDate = terminationDatePeriod || terminationDate;
    return !showInactive && !donationType && !procedureCode && !hasEffectiveDate && !hasTerminationDate;
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.loadDropdowns();
  }

  onClose(): void {
    this.close.emit();
  }
}
