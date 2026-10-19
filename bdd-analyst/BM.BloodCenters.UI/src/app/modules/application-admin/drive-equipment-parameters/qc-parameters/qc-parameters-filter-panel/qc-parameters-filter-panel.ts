import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { QcParametersFilterParams, QcParametersModel } from '../../models/drive-equipment-parameters.model';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { Subject, takeUntil } from 'rxjs';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

/**
 * Filter option interface for dropdown items
 */
interface FilterOption {
  code: string;
  description: string;
}

@Component({
  selector: 'app-qc-parameters-filter-panel',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
    MatButtonModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './qc-parameters-filter-panel.html',
  styleUrls: ['./qc-parameters-filter-panel.scss']
})
export class QcParametersFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: QcParametersFilterParams = {};
  @Output() apply = new EventEmitter<QcParametersFilterParams>();
  @Output() close = new EventEmitter<void>();

  // Private backing field for tableData
  private _tableData: QcParametersModel[] = [];

  // Input setter that triggers options update when data is assigned
  @Input()
  set tableData(value: QcParametersModel[]) {
    this._tableData = value;
    // Extract unique values from table data for dropdown options
    this.qcCheckCodeOptions.set(value?.length ? this.extractQcCheckCodes(value) : []);
    this.dataTypeOptions = value?.length ? this.extractDataTypes(value) : [];
  }

  get tableData(): QcParametersModel[] {
    return this._tableData;
  }

  private readonly fb = inject(FormBuilder);
  private readonly driveEquipmentService = inject(DriveEquipmentParametersService);
  private readonly cdr = inject(ChangeDetectorRef);

  form!: FormGroup;

  private qcCheckCodeOptions = signal<FilterOption[]>([]);
  dataTypeOptions: string[] = [];
  periodOptions: string[] = ['After', 'Before'];

  // Search controls for ngx-mat-select-search
  readonly qcCheckCodeSearchCtrl = new FormControl('');

  // Search signals
  private readonly qcCheckCodeSearch = signal('');

  // Filtered dropdown options (searchable)
  filteredQcCheckCodes = computed(() => {
    const search = this.qcCheckCodeSearch().toLowerCase();
    const items = this.qcCheckCodeOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });

  // Track if date fields have been touched
  effDateTouched = false;
  termDateTouched = false;

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.form = this.fb.group({
      qcCheckCode: [this.currentFilters.qcCheckCode || null],
      dataType: [this.currentFilters.dataType || null],
      effDatePeriod: [this.determinePeriod(this.currentFilters.effDateFrom, this.currentFilters.effDateTo)],
      effDate: [this.determineDate(this.currentFilters.effDateFrom, this.currentFilters.effDateTo)],
      termDatePeriod: [this.determinePeriod(this.currentFilters.termDateFrom, this.currentFilters.termDateTo)],
      termDate: [this.determineDate(this.currentFilters.termDateFrom, this.currentFilters.termDateTo)]
    }, {
      validators: [
        this.dateAndPeriodValidator('effDate', 'effDatePeriod'),
        this.dateAndPeriodValidator('termDate', 'termDatePeriod')
      ]
    });

    // Reset touched flags when period is selected
    this.form.get('effDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.effDateTouched = false;
    });

    this.form.get('termDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.termDateTouched = false;
    });

    // Setup search subscriptions
    this.qcCheckCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.qcCheckCodeSearch.set(v || ''));
  }

  /** Reset search when dropdown closes so all items show on next open */
  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Determines period based on which date value exists
   */
  private determinePeriod(fromDate?: string, toDate?: string): string | null {
    if (fromDate) return 'After';
    if (toDate) return 'Before';
    return null;
  }

  /**
   * Determines date value from either from or to date
   */
  private determineDate(fromDate?: string, toDate?: string): Date | null {
    if (fromDate) return new Date(fromDate);
    if (toDate) return new Date(toDate);
    return null;
  }

  /**
   * Custom validator to ensure period is selected when date is selected
   */
  private dateAndPeriodValidator(dateField: string, periodField: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      const date = control.get(dateField)?.value;
      const period = control.get(periodField)?.value;

      // Date selected but no period - show error
      if (date && !period) {
        const errorKey = `${dateField}PeriodRequired`;
        return { [errorKey]: true };
      }

      // Period selected but no date - valid (no error)
      // Both empty - valid
      // Both selected - valid
      return null;
    };
  }

  /**
   * Handle effective date field opened
   */
  onEffDateOpened(): void {
    this.effDateTouched = true;
  }

  /**
   * Handle termination date field opened
   */
  onTermDateOpened(): void {
    this.termDateTouched = true;
  }

  /**
   * Store raw input text when user types in effective date field
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    // Set invalidDateFormat error when input has text but control value is null (unparseable)
    setTimeout(() => {
      const control = this.form.get('effDate');
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
      const control = this.form.get('effDate');
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
      const control = this.form.get('termDate');
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
      const control = this.form.get('termDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  /**
   * Checks if effective date has validation error
   */
  hasEffDateError(): boolean {
    const period = this.form.get('effDatePeriod')?.value;
    // Show error if date field was touched but period is not selected
    if (this.effDateTouched && !period) {
      return true;
    }
    return this.form.hasError('effDatePeriodRequired');
  }

  /**
   * Gets error message for effective date period
   */
  getEffDateError(): string {
    const period = this.form.get('effDatePeriod')?.value;

    // Show error when date field is touched without period
    if (this.effDateTouched && !period) {
      return 'Period is required';
    }

    if (this.form.hasError('effDatePeriodRequired')) {
      return 'Period is required';
    }
    return '';
  }

  /**
   * Checks if termination date has validation error
   */
  hasTermDateError(): boolean {
    const period = this.form.get('termDatePeriod')?.value;
    // Show error if date field was touched but period is not selected
    if (this.termDateTouched && !period) {
      return true;
    }
    return this.form.hasError('termDatePeriodRequired');
  }

  /**
   * Gets error message for termination date period
   */
  getTermDateError(): string {
    const period = this.form.get('termDatePeriod')?.value;

    // Show error when date field is touched without period
    if (this.termDateTouched && !period) {
      return 'Period is required';
    }

    if (this.form.hasError('termDatePeriodRequired')) {
      return 'Period is required';
    }
    return '';
  }

  /**
   * Checks if any filter has been selected and form is valid
   */
  hasFiltersSelected(): boolean {
    const raw = this.form.value;
    const hasSelection = !!(
      raw.qcCheckCode ||
      raw.dataType ||
      (raw.effDate && raw.effDatePeriod) ||
      (raw.termDate && raw.termDatePeriod)
    );
    return hasSelection && this.form.valid;
  }

  /**
   * Extract unique QC Check Codes from table data
   */
  private extractQcCheckCodes(tableData: QcParametersModel[]): FilterOption[] {
    const uniqueCodes = new Map<string, FilterOption>();

    tableData.forEach(row => {
      if (row.qcCheckCode && !uniqueCodes.has(row.qcCheckCode)) {
        uniqueCodes.set(row.qcCheckCode, {
          code: row.qcCheckCode,
          description: row.qcCheckDescription || row.qcCheckCode
        });
      }
    });

    return Array.from(uniqueCodes.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }

  /**
   * Extract unique Data Types from table data
   */
  private extractDataTypes(tableData: QcParametersModel[]): string[] {
    const uniqueTypes = new Set<string>();

    tableData.forEach(row => {
      if (row.dataType) {
        uniqueTypes.add(row.dataType);
      }
    });

    return Array.from(uniqueTypes).sort((a, b) => a.localeCompare(b));
  }

  onApply(): void {
    const raw = this.form.value;
    const filters: QcParametersFilterParams = {};

    if (raw.qcCheckCode) filters.qcCheckCode = raw.qcCheckCode;
    if (raw.dataType) filters.dataType = raw.dataType;

    // Handle Effective Date with Period - only send one based on period selection
    if (raw.effDate && raw.effDatePeriod) {
      if (raw.effDatePeriod === 'After') {
        filters.effDateFrom = DateFieldValidationUtility.serializeDateForApi(raw.effDate) || undefined;
      } else if (raw.effDatePeriod === 'Before') {
        filters.effDateTo = DateFieldValidationUtility.serializeDateForApi(raw.effDate) || undefined;
      }
    }

    // Handle Termination Date with Period - only send one based on period selection
    if (raw.termDate && raw.termDatePeriod) {
      if (raw.termDatePeriod === 'After') {
        filters.termDateFrom = DateFieldValidationUtility.serializeDateForApi(raw.termDate) || undefined;
      } else if (raw.termDatePeriod === 'Before') {
        filters.termDateTo = DateFieldValidationUtility.serializeDateForApi(raw.termDate) || undefined;
      }
    }

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.form.reset({
      qcCheckCode: null,
      dataType: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
    this.effDateTouched = false;
    this.termDateTouched = false;
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
