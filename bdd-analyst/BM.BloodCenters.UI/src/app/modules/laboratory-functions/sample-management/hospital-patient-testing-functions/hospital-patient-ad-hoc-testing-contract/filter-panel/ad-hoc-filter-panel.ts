import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import {
  ContractLookup,
  DropdownOption,
  ContractFilterModel
} from '../models/hospital-patient-ad-hoc-testing-contract.model';

@Component({
  selector: 'app-ad-hoc-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    FilterPanelBase,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE]
    }
  ],
  templateUrl: './ad-hoc-filter-panel.html',
  styleUrls: ['./ad-hoc-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdHocFilterPanelComponent implements OnInit, OnDestroy {
  @Input() contracts: ContractLookup[] = [];
  @Input() contractTypes: DropdownOption[] = [];
  @Input() currentFilters: ContractFilterModel | null = null;

  @Output() apply = new EventEmitter<ContractFilterModel>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  filterForm!: FormGroup;

  // Search controls for searchable dropdowns
  contractSearchCtrl = new FormControl<string>('');
  contractTypeSearchCtrl = new FormControl<string>('');
  effPeriodSearchCtrl = new FormControl<string>('');
  termPeriodSearchCtrl = new FormControl<string>('');

  // Filtered options
  filteredContracts: ContractLookup[] = [];
  filteredContractTypes: DropdownOption[] = [];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      contractId: [this.currentFilters?.contractId || null],
      contractType: [this.currentFilters?.contractType || null],
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.getInitialEffDate()],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.getInitialTermDate()]
    });

    this.filteredContracts = [...this.contracts];
    this.filteredContractTypes = [...this.contractTypes];

    this.setupValidation();
    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getInitialEffDate(): any {
    if (this.currentFilters?.effDate) {
      return this.currentFilters.effDate;
    }
    return null;
  }

  private getInitialTermDate(): any {
    if (this.currentFilters?.termDate) {
      return this.currentFilters.termDate;
    }
    return null;
  }

  private setupValidation(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriodRequired('effDatePeriod', 'effDate');
        this.cdr.markForCheck();
      });

    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriodRequired('effDatePeriod', 'effDate');
        this.cdr.markForCheck();
      });

    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriodRequired('termDatePeriod', 'termDate');
        this.cdr.markForCheck();
      });

    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriodRequired('termDatePeriod', 'termDate');
        this.cdr.markForCheck();
      });
  }

  private validatePeriodRequired(periodKey: string, dateKey: string): void {
    const dateValue = this.filterForm.get(dateKey)?.value;
    const periodValue = this.filterForm.get(periodKey)?.value;
    const periodControl = this.filterForm.get(periodKey);

    if (dateValue && !periodValue) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
  }

  private setupSearchControls(): void {
    this.contractSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const search = (searchTerm || '').toLowerCase();
        this.filteredContracts = this.contracts.filter(c =>
          `${c.contractId} - ${c.description}`.toLowerCase().includes(search)
        );
        this.cdr.markForCheck();
      });

    this.contractTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const search = (searchTerm || '').toLowerCase();
        this.filteredContractTypes = this.contractTypes.filter(t =>
          t.code.toLowerCase().includes(search) || t.description.toLowerCase().includes(search)
        );
        this.cdr.markForCheck();
      });
  }

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  get isApplyDisabled(): boolean {
    const v = this.filterForm.value;
    const hasAnyValue = !!(v.contractId || v.contractType || v.effDate || v.termDate);
    return !hasAnyValue || this.hasValidationErrors;
  }

  get hasValidationErrors(): boolean {
    return !!(
      this.filterForm.get('effDatePeriod')?.invalid ||
      this.filterForm.get('termDatePeriod')?.invalid
    );
  }

  getEffPeriodError(): string {
    const dateControl = this.filterForm.get('effDate');
    const periodControl = this.filterForm.get('effDatePeriod');
    if (dateControl?.value && periodControl?.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  getTermPeriodError(): string {
    const dateControl = this.filterForm.get('termDate');
    const periodControl = this.filterForm.get('termDatePeriod');
    if (dateControl?.value && periodControl?.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  onApply(): void {
    if (this.isApplyDisabled) return;

    const v = this.filterForm.value;
    const filters: ContractFilterModel = {
      contractId: v.contractId || null,
      contractType: v.contractType || null,
      effDatePeriod: v.effDatePeriod || 'After',
      effDate: v.effDate ? (moment.isMoment(v.effDate) ? v.effDate : moment(v.effDate)) : null,
      termDatePeriod: v.termDatePeriod || 'After',
      termDate: v.termDate ? (moment.isMoment(v.termDate) ? v.termDate : moment(v.termDate)) : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      contractId: null,
      contractType: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
