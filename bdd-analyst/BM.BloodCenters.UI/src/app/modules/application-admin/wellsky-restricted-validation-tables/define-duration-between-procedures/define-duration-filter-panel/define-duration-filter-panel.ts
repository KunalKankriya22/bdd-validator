import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

import { DefineDurationBetweenProceduresFilterValue } from '../models/define-duration-between-procedures.model';
import { DefineDurationBetweenProceduresService } from '../services/define-duration-between-procedures.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

@Component({
  selector: 'app-define-duration-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatCheckboxModule
  ],
  templateUrl: './define-duration-filter-panel.html',
  styleUrls: ['./define-duration-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class DefineDurationFilterPanel implements OnInit {
  @Input() currentFilters: DefineDurationBetweenProceduresFilterValue | null = null;
  @Output() apply = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  currDonationTypeOptions: string[] = [];
  procedureCodeOptions: string[] = [];

  isLoadingFilters = false;
  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

  constructor(
    private fb: FormBuilder,
    private defineDurationService: DefineDurationBetweenProceduresService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      currDonationType: [this.currentFilters?.currDonationType || null],
      procedureCode: [this.currentFilters?.procedureCode || null],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });

    // Setup validation listeners
    this.filterForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      setTimeout(() => this.validateEffectiveDatePeriod(), 0);
    });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges.subscribe(() => {
      this.validateEffectiveDatePeriod();
    });

    this.filterForm.get('terminationDate')?.valueChanges.subscribe(() => {
      setTimeout(() => this.validateTerminationDatePeriod(), 0);
    });

    this.filterForm.get('terminationDatePeriod')?.valueChanges.subscribe(() => {
      this.validateTerminationDatePeriod();
    });

    // Initial validation check in case filters were pre-populated
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    this.loadFilterOptions();
  }

  get isApplyDisabled(): boolean {
    // Check if there are validation errors
    if (this.effectivePeriodRequired || this.terminationPeriodRequired) {
      return true;
    }

    const values = this.filterForm.value;
    const currDonationType = values?.currDonationType;
    const procedureCode = values?.procedureCode;

    // Check if dates are selected with proper period
    const hasEffectiveDate = values?.effectiveDatePeriod && values?.effectiveDate;
    const hasTerminationDate = values?.terminationDatePeriod && values?.terminationDate;

    // Check if dropdown values are selected
    const hasCurrDonationType = currDonationType !== null && currDonationType !== undefined && currDonationType !== '';
    const hasProcedureCode = procedureCode !== null && procedureCode !== undefined && procedureCode !== '';

    // If nothing is selected, disable
    if (!hasCurrDonationType && !hasProcedureCode && !hasEffectiveDate && !hasTerminationDate) {
      return true;
    }

    // Otherwise enable (any specific value selected, or dates selected)
    return false;
  }

  private validateEffectiveDatePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const effectiveDatePeriod = this.filterForm.get('effectiveDatePeriod')?.value;
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate && !effectiveDatePeriod) {
      this.effectivePeriodRequired = true;
      effectiveDatePeriodControl?.setErrors({ required: true });
      effectiveDatePeriodControl?.markAsTouched();
    } else {
      this.effectivePeriodRequired = false;
      effectiveDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationDatePeriod = this.filterForm.get('terminationDatePeriod')?.value;
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    if (terminationDate && !terminationDatePeriod) {
      this.terminationPeriodRequired = true;
      terminationDatePeriodControl?.setErrors({ required: true });
      terminationDatePeriodControl?.markAsTouched();
    } else {
      this.terminationPeriodRequired = false;
      terminationDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  /**
   * Load filter options from backend API
   */
  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    this.defineDurationService.getDefineDurationFilters().subscribe({
      next: (response) => {
        console.log('Filter API Response:', response);

        let filterData = null;

        if (response.item) {
          filterData = response.item;
        } else if (response.data && response.data.length > 0) {
          filterData = response.data[0];
        } else if (response && (response as any).currDonationType) {
          filterData = response as any;
        }

        if (filterData) {
          console.log('Filter Data:', filterData);

          this.currDonationTypeOptions = filterData.currDonationType || [];
          this.procedureCodeOptions = filterData.procedureCode || [];

          console.log('Current Donation Type Options:', this.currDonationTypeOptions);
          console.log('Procedure Code Options:', this.procedureCodeOptions);
        } else {
          console.warn('No filter data found in response');
        }

        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading filter options:', error);
        console.error('Error details:', error.error);
        this.currDonationTypeOptions = [];
        this.procedureCodeOptions = [];
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      }
    });
  }

  onApply(): void {
    // Validate before applying
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    // Don't apply if there are validation errors
    const effectiveDatePeriodControl = this.filterForm.get('effectiveDatePeriod');
    const terminationDatePeriodControl = this.filterForm.get('terminationDatePeriod');

    if (effectiveDatePeriodControl?.errors || terminationDatePeriodControl?.errors) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: DefineDurationBetweenProceduresFilterValue = {
      currDonationType: formValue.currDonationType || null,
      procedureCode: formValue.procedureCode || null,
      effectiveDate: formValue.effectiveDate ? (formValue.effectiveDate instanceof Date ? formValue.effectiveDate : formValue.effectiveDate.toDate()) : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      terminationDate: formValue.terminationDate ? (formValue.terminationDate instanceof Date ? formValue.terminationDate : formValue.terminationDate.toDate()) : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null,
      activeOnly: true
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      currDonationType: null,
      procedureCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
