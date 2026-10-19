import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, signal, computed, inject } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { DriveProfileFilterParams, DriveProfileModel } from '../../models/drive-equipment-parameters.model';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

/**
 * Filter option interface for dropdown items
 */
interface FilterOption {
  code: string;
  description: string;
}

/**
 * Drive Profile Filter Panel Component
 * CDK overlay panel for filtering drive profile records
 */
@Component({
  selector: 'app-drive-profile-filter-panel',
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
  templateUrl: './drive-profile-filter-panel.html',
  styleUrls: ['./drive-profile-filter-panel.scss']
})
export class DriveProfileFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DriveProfileFilterParams = {};
  @Output() apply = new EventEmitter<DriveProfileFilterParams>();
  @Output() close = new EventEmitter<void>();

  // Private backing field for tableData
  private _tableData: DriveProfileModel[] = [];

  // Input setter that stores table data for later merging with API options
  @Input()
  set tableData(value: DriveProfileModel[]) {
    this._tableData = value;
    // Options are loaded from API in ngOnInit() to get ALL types (not just paginated)
    // After API loads, this table data will be merged to include newly added types
  }

  get tableData(): DriveProfileModel[] {
    return this._tableData;
  }

  private readonly fb = inject(FormBuilder);
  private readonly driveEquipmentService = inject(DriveEquipmentParametersService);

  form!: FormGroup;

  // Dropdown options
  private driveProfileTypeOptions = signal<FilterOption[]>([]);
  private codeOptions = signal<FilterOption[]>([]);

  periodOptions: string[] = ['After', 'Before'];

  // Search controls for ngx-mat-select-search
  readonly driveProfileTypeSearchCtrl = new FormControl('');
  readonly codeSearchCtrl = new FormControl('');

  // Search signals
  private readonly driveProfileTypeSearch = signal('');
  private readonly codeSearch = signal('');

  // Filtered dropdown options (searchable)
  filteredDriveProfileTypes = computed(() => {
    const search = this.driveProfileTypeSearch().toLowerCase();
    const items = this.driveProfileTypeOptions();
    if (!search) return items;
    return items.filter(t => t.code?.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));
  });

  filteredCodes = computed(() => {
    const search = this.codeSearch().toLowerCase();
    const items = this.codeOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });

  private destroy$ = new Subject<void>();

  // Store raw input text to preserve invalid dates
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  ngOnInit(): void {
    this.form = this.fb.group({
      driveProfileType: [this.currentFilters.driveProfileType || null],
      code: [this.currentFilters.code || null],
      effDatePeriod: [this.determinePeriod(this.currentFilters.effDateFrom, this.currentFilters.effDateTo)],
      effDate: [this.determineDate(this.currentFilters.effDateFrom, this.currentFilters.effDateTo), [dateFormatValidator()]],
      termDatePeriod: [this.determinePeriod(this.currentFilters.termDateFrom, this.currentFilters.termDateTo)],
      termDate: [this.determineDate(this.currentFilters.termDateFrom, this.currentFilters.termDateTo), [dateFormatValidator()]]
    }, {
      validators: [
        this.dateAndPeriodValidator('effDate', 'effDatePeriod'),
        this.dateAndPeriodValidator('termDate', 'termDatePeriod')
      ]
    });

    // Always load options from API to get ALL Drive Profile Types (not just paginated)
    // After API loads, table data will be merged to include newly added types
    this.loadFilterOptions();

    // Setup search subscriptions
    this.driveProfileTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.driveProfileTypeSearch.set(v || ''));
    this.codeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.codeSearch.set(v || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Reset search when dropdown closes so all items show on next open */
  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
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
   * Extract unique Drive Profile Types from table data
   */
  private extractDriveProfileTypes(tableData: DriveProfileModel[]): FilterOption[] {
    const uniqueTypes = new Map<string, FilterOption>();

    tableData.forEach(row => {
      if (row.driveProfileType && !uniqueTypes.has(row.driveProfileType)) {
        uniqueTypes.set(row.driveProfileType, {
          code: row.driveProfileType,
          description: row.driveProfileTypeDescription || row.driveProfileType
        });
      }
    });

    return Array.from(uniqueTypes.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }

  /**
   * Extract unique Codes from table data
   */
  private extractCodes(tableData: DriveProfileModel[]): FilterOption[] {
    const uniqueCodes = new Map<string, FilterOption>();

    tableData.forEach(row => {
      if (row.code && !uniqueCodes.has(row.code)) {
        uniqueCodes.set(row.code, {
          code: row.code,
          description: row.codeDescription || row.code
        });
      }
    });

    return Array.from(uniqueCodes.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }

  /**
   * Merges types/codes from table data into existing API-loaded options
   * This ensures newly added types appear in the dropdown immediately
   */
  private mergeTableDataIntoOptions(tableData: DriveProfileModel[]): void {
    // Extract types and codes from current page
    const tableTypes = this.extractDriveProfileTypes(tableData);
    const tableCodes = this.extractCodes(tableData);

    // Merge with existing API options (union)
    const mergedTypes = this.mergeOptions(this.driveProfileTypeOptions(), tableTypes);
    const mergedCodes = this.mergeOptions(this.codeOptions(), tableCodes);

    this.driveProfileTypeOptions.set(mergedTypes);
    this.codeOptions.set(mergedCodes);
  }

  /**
   * Merges two option arrays, avoiding duplicates
   */
  private mergeOptions(apiOptions: FilterOption[], tableOptions: FilterOption[]): FilterOption[] {
    const merged = new Map<string, FilterOption>();

    // Add API options first (primary source)
    apiOptions.forEach(option => {
      merged.set(option.code, option);
    });

    // Add table options (only if not already present)
    tableOptions.forEach(option => {
      if (!merged.has(option.code)) {
        merged.set(option.code, option);
      }
    });

    return Array.from(merged.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }

  /**
   * Loads filter dropdown options from API
   */
  loadFilterOptions(): void {
    // Load drive profile types
    this.driveEquipmentService.getDriveProfileTypes().subscribe({
      next: (types) => {
        this.driveProfileTypeOptions.set(types);
        // After API loads, merge in any new types from table data
        if (this.tableData && this.tableData.length > 0) {
          this.mergeTableDataIntoOptions(this.tableData);
        }
      },
      error: () => {
        // Silently fail - fall back to table data only
        if (this.tableData && this.tableData.length > 0) {
          this.driveProfileTypeOptions.set(this.extractDriveProfileTypes(this.tableData));
          this.codeOptions.set(this.extractCodes(this.tableData));
        }
      }
    });

    // Load codes
    this.driveEquipmentService.getCodes().subscribe({
      next: (codes) => {
        this.codeOptions.set(codes);
        // After API loads, merge in any new codes from table data
        if (this.tableData && this.tableData.length > 0) {
          this.mergeTableDataIntoOptions(this.tableData);
        }
      },
      error: () => {
        // Silently fail - fall back to table data only
        if (this.tableData && this.tableData.length > 0) {
          this.codeOptions.set(this.extractCodes(this.tableData));
        }
      }
    });
  }

  /**
   * Applies the selected filters
   */
  onApply(): void {
    const raw = this.form.value;
    const filters: DriveProfileFilterParams = {};

    if (raw.driveProfileType && raw.driveProfileType !== '') {
      filters.driveProfileType = raw.driveProfileType;
    }

    if (raw.code && raw.code !== '') {
      filters.code = raw.code;
    }

    // Handle Effective Date with Period - only send one based on period selection
    if (raw.effDate && raw.effDatePeriod) {
      if (raw.effDatePeriod === 'After') {
        filters.effDateFrom = DateFieldValidationUtility.serializeDateForApi(raw.effDate) || undefined;
        // Don't send effDateTo
      } else if (raw.effDatePeriod === 'Before') {
        filters.effDateTo = DateFieldValidationUtility.serializeDateForApi(raw.effDate) || undefined;
        // Don't send effDateFrom
      }
    }

    // Handle Termination Date with Period - only send one based on period selection
    if (raw.termDate && raw.termDatePeriod) {
      if (raw.termDatePeriod === 'After') {
        filters.termDateFrom = DateFieldValidationUtility.serializeDateForApi(raw.termDate) || undefined;
        // Don't send termDateTo
      } else if (raw.termDatePeriod === 'Before') {
        filters.termDateTo = DateFieldValidationUtility.serializeDateForApi(raw.termDate) || undefined;
        // Don't send termDateFrom
      }
    }

    this.apply.emit(filters);
  }

  /**
   * Clears all filter fields
   */
  onClearAll(): void {
    this.form.reset({
      driveProfileType: null,
      code: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
  }

  /**
   * Closes the filter panel
   */
  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.form.value;

    // Check for date format validation errors
    const effDateControl = this.form.get('effDate');
    const termDateControl = this.form.get('termDate');
    const hasDateFormatErrors = !!(
      effDateControl?.hasError('invalidDateFormat') ||
      effDateControl?.hasError('matDatepickerParse') ||
      termDateControl?.hasError('invalidDateFormat') ||
      termDateControl?.hasError('matDatepickerParse')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.driveProfileType !== null && formValue.driveProfileType !== '') ||
      (formValue.code !== null && formValue.code !== '') ||
      formValue.effDate !== null ||
      formValue.termDate !== null;

    return !hasAnyValue;
  }

  /**
   * Checks if any filter has been selected and form is valid
   */
  hasFiltersSelected(): boolean {
    const raw = this.form.value;
    const hasSelection = !!(
      (raw.driveProfileType && raw.driveProfileType !== '') ||
      (raw.code && raw.code !== '') ||
      (raw.effDate && raw.effDatePeriod) ||
      (raw.termDate && raw.termDatePeriod)
    );
    return hasSelection && this.form.valid;
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
   * Checks if effective date has validation error
   */
  hasEffDateError(): boolean {
    const date = this.form.get('effDate')?.value;
    const period = this.form.get('effDatePeriod')?.value;
    // Show error if date has value but period is not selected
    if (date && !period) {
      return true;
    }
    return this.form.hasError('effDatePeriodRequired');
  }

  /**
   * Gets error message for effective date period
   */
  getEffDateError(): string {
    const date = this.form.get('effDate')?.value;
    const period = this.form.get('effDatePeriod')?.value;

    // Show error when date is selected without period
    if (date && !period) {
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
    const date = this.form.get('termDate')?.value;
    const period = this.form.get('termDatePeriod')?.value;
    // Show error if date has value but period is not selected
    if (date && !period) {
      return true;
    }
    return this.form.hasError('termDatePeriodRequired');
  }

  /**
   * Gets error message for termination date period
   */
  getTermDateError(): string {
    const date = this.form.get('termDate')?.value;
    const period = this.form.get('termDatePeriod')?.value;

    // Show error when date is selected without period
    if (date && !period) {
      return 'Period is required';
    }

    if (this.form.hasError('termDatePeriodRequired')) {
      return 'Period is required';
    }
    return '';
  }

  /**
   * Formats date for API (date only, no timestamp)
   */
  private formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.form.get('effDate');
      // If control has no value but we have raw input, restore it
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
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.form.get('termDate');
      // If control has no value but we have raw input, restore it
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }
}
