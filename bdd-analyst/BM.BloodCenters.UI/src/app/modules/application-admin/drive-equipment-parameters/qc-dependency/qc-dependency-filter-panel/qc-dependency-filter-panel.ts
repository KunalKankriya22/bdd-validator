import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, inject, signal, computed } from '@angular/core';
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
import { QcDependencyFilterParams, QcDependencyModel } from '../../models/drive-equipment-parameters.model';
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
  selector: 'app-qc-dependency-filter-panel',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatDatepickerModule, MatMomentDateModule, MatInputModule, MatButtonModule, NgxMatSelectSearchModule],
  templateUrl: './qc-dependency-filter-panel.html',
  styleUrls: ['./qc-dependency-filter-panel.scss']
})
export class QcDependencyFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: QcDependencyFilterParams = {};
  @Output() apply = new EventEmitter<QcDependencyFilterParams>();
  @Output() close = new EventEmitter<void>();

  // Private backing field for tableData
  private _tableData: QcDependencyModel[] = [];

  // Input setter that triggers options update when data is assigned
  @Input()
  set tableData(value: QcDependencyModel[]) {
    this._tableData = value;
    // Extract unique values from table data for dropdown options
    this.sourceParamOptions.set(value?.length ? this.extractSourceParamCodes(value) : []);
    this.dependentCodeOptions.set(value?.length ? this.extractDependentCodes(value) : []);
  }

  get tableData(): QcDependencyModel[] {
    return this._tableData;
  }

  private readonly fb = inject(FormBuilder);
  private readonly driveEquipmentService = inject(DriveEquipmentParametersService);

  form!: FormGroup;
  periodOptions: string[] = ['After', 'Before'];

  // Dropdown options
  private sourceParamOptions = signal<FilterOption[]>([]);
  private dependentCodeOptions = signal<FilterOption[]>([]);

  // Search controls for ngx-mat-select-search
  readonly sourceParamSearchCtrl = new FormControl('');
  readonly dependentCodeSearchCtrl = new FormControl('');

  // Search signals
  private readonly sourceParamSearch = signal('');
  private readonly dependentCodeSearch = signal('');

  // Filtered dropdown options (searchable)
  filteredSourceParamList = computed(() => {
    const search = this.sourceParamSearch().toLowerCase();
    const items = this.sourceParamOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });

  filteredDependentCodeList = computed(() => {
    const search = this.dependentCodeSearch().toLowerCase();
    const items = this.dependentCodeOptions();
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
      sourceParamCode: [this.currentFilters.sourceParamCode || ''],
      dependentCode: [this.currentFilters.dependentCode || ''],
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
    this.sourceParamSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.sourceParamSearch.set(v || ''));
    this.dependentCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.dependentCodeSearch.set(v || ''));
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
   * Extract unique Source Param Codes from table data
   */
  private extractSourceParamCodes(tableData: QcDependencyModel[]): FilterOption[] {
    const uniqueCodes = new Map<string, FilterOption>();

    tableData.forEach(row => {
      if (row.sourceParamCode && !uniqueCodes.has(row.sourceParamCode)) {
        uniqueCodes.set(row.sourceParamCode, {
          code: row.sourceParamCode,
          description: row.sourceParamDescription || row.sourceParamCode
        });
      }
    });

    return Array.from(uniqueCodes.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }

  /**
   * Extract unique Dependent Codes from table data
   */
  private extractDependentCodes(tableData: QcDependencyModel[]): FilterOption[] {
    const uniqueCodes = new Map<string, FilterOption>();

    tableData.forEach(row => {
      if (row.dependentCode && !uniqueCodes.has(row.dependentCode)) {
        uniqueCodes.set(row.dependentCode, {
          code: row.dependentCode,
          description: row.dependentDescription || row.dependentCode
        });
      }
    });

    return Array.from(uniqueCodes.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }

  private determinePeriod(fromDate?: string, toDate?: string): string | null {
    if (fromDate) return 'After';
    if (toDate) return 'Before';
    return null;
  }

  private determineDate(fromDate?: string, toDate?: string): Date | null {
    if (fromDate) return new Date(fromDate);
    if (toDate) return new Date(toDate);
    return null;
  }

  private dateAndPeriodValidator(dateField: string, periodField: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      const date = control.get(dateField)?.value;
      const period = control.get(periodField)?.value;

      if (date && !period) {
        const errorKey = `${dateField}PeriodRequired`;
        return { [errorKey]: true };
      }

      return null;
    };
  }

  onEffDateOpened(): void {
    this.effDateTouched = true;
  }

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

  hasEffDateError(): boolean {
    const period = this.form.get('effDatePeriod')?.value;
    if (this.effDateTouched && !period) {
      return true;
    }
    return this.form.hasError('effDatePeriodRequired');
  }

  getEffDateError(): string {
    const period = this.form.get('effDatePeriod')?.value;

    if (this.effDateTouched && !period) {
      return 'Period is required';
    }

    if (this.form.hasError('effDatePeriodRequired')) {
      return 'Period is required';
    }
    return '';
  }

  hasTermDateError(): boolean {
    const period = this.form.get('termDatePeriod')?.value;
    if (this.termDateTouched && !period) {
      return true;
    }
    return this.form.hasError('termDatePeriodRequired');
  }

  getTermDateError(): string {
    const period = this.form.get('termDatePeriod')?.value;

    if (this.termDateTouched && !period) {
      return 'Period is required';
    }

    if (this.form.hasError('termDatePeriodRequired')) {
      return 'Period is required';
    }
    return '';
  }

  hasFiltersSelected(): boolean {
    const raw = this.form.value;
    const hasSelection = !!(
      raw.sourceParamCode ||
      raw.dependentCode ||
      (raw.effDate && raw.effDatePeriod) ||
      (raw.termDate && raw.termDatePeriod)
    );
    return hasSelection && this.form.valid;
  }

  onApply(): void {
    const raw = this.form.value;
    const filters: QcDependencyFilterParams = {};

    if (raw.sourceParamCode) filters.sourceParamCode = raw.sourceParamCode;
    if (raw.dependentCode) filters.dependentCode = raw.dependentCode;

    if (raw.effDate && raw.effDatePeriod) {
      if (raw.effDatePeriod === 'After') {
        filters.effDateFrom = DateFieldValidationUtility.serializeDateForApi(raw.effDate) || undefined;
      } else if (raw.effDatePeriod === 'Before') {
        filters.effDateTo = DateFieldValidationUtility.serializeDateForApi(raw.effDate) || undefined;
      }
    }

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
      sourceParamCode: '',
      dependentCode: '',
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
    this.effDateTouched = false;
    this.termDateTouched = false;
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
  }

  onClose(): void {
    this.close.emit();
  }
}
