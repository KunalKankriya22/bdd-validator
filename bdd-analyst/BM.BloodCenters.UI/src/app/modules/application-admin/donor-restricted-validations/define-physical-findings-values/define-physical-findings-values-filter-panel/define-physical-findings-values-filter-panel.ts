import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { Subject, takeUntil } from 'rxjs';

import { DefinePhysicalFindingsValuesFilterFormValue } from '../utils/filter-chips.utils';
import { LookupItem, PhysicalFindingsLookups } from '../models/define-physical-findings-values.model';

@Component({
  selector: 'app-define-physical-findings-values-filter-panel',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './define-physical-findings-values-filter-panel.html',
  styleUrls: ['./define-physical-findings-values-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefinePhysicalFindingsValuesFilterPanel implements OnInit, OnChanges, OnDestroy {
  @Input() currentFilters: DefinePhysicalFindingsValuesFilterFormValue | null = null;
  @Input() lookups: PhysicalFindingsLookups | null = null;
  @Output() apply = new EventEmitter<DefinePhysicalFindingsValuesFilterFormValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Dynamic dropdown options (signals for reactivity)
  private readonly operatorsSignal = signal<LookupItem[]>([]);
  private readonly interdictionsSignal = signal<LookupItem[]>([]);
  private readonly equipmentTypesSignal = signal<LookupItem[]>([]);
  private readonly manualAuditFlagsSignal = signal<LookupItem[]>([]);

  readonly operatorSearchCtrl = new FormControl('');
  readonly interdictionSearchCtrl = new FormControl('');
  readonly equipmentTypeSearchCtrl = new FormControl('');
  readonly manualAuditSearchCtrl = new FormControl('');

  private readonly operatorSearch = signal('');
  private readonly interdictionSearch = signal('');
  private readonly equipmentTypeSearch = signal('');
  private readonly manualAuditSearch = signal('');

  readonly filteredOperators = computed(() => this.filterItems(this.operatorsSignal(), this.operatorSearch()));
  readonly filteredInterdictions = computed(() => this.filterItems(this.interdictionsSignal(), this.interdictionSearch()));
  readonly filteredEquipmentTypes = computed(() => this.filterItems(this.equipmentTypesSignal(), this.equipmentTypeSearch()));
  readonly filteredManualAuditFlags = computed(() => this.filterItems(this.manualAuditFlagsSignal(), this.manualAuditSearch()));

  // Display function for mat-select-trigger
  displayFilterItem = (item: LookupItem | string | null): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.value || item.key || '';
  };

  // Compare function for mat-select
  compareLookupItems = (a: LookupItem | null, b: LookupItem | null): boolean => {
    if (!a || !b) return false;
    return a.key === b.key;
  };

  private destroy$ = new Subject<void>();

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;
  effectiveDateRequired = false;
  terminationDateRequired = false;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Populate dropdowns from lookups
    this.populateDropdownsFromLookups();

    // Find matching objects for current filter values
    const operators = this.operatorsSignal();
    const interdictions = this.interdictionsSignal();
    const equipmentTypes = this.equipmentTypesSignal();
    const operatorObj = this.findLookupItem(operators, this.currentFilters?.operator);
    const interdictionObj = this.findLookupItem(interdictions, this.currentFilters?.interdiction);
    const equipmentTypeObj = this.findLookupItem(equipmentTypes, this.currentFilters?.equipmentType);

    this.filterForm = this.fb.group({
      operator: [operatorObj],
      interdiction: [interdictionObj],
      manualAuditFindingsFlag: [this.currentFilters?.manualAuditFindingsFlag || null],
      equipmentType: [equipmentTypeObj],
      periodType: [this.currentFilters?.periodType || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationPeriodType: [this.currentFilters?.terminationPeriodType || null],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });

    // Setup search subscriptions
    this.setupSearchSubscriptions();

    // Setup validation listeners
    this.filterForm.get('effectiveDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validatePeriodType();
    });

    this.filterForm.get('periodType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validatePeriodType();
    });

    this.filterForm.get('terminationDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateTerminationPeriodType();
    });

    this.filterForm.get('terminationPeriodType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateTerminationPeriodType();
    });

    // Initial validation check in case filters were pre-populated
    this.validatePeriodType();
    this.validateTerminationPeriodType();
  }

  private populateDropdownsFromLookups(): void {
    if (!this.lookups) return;

    this.operatorsSignal.set(this.lookups.operators || []);
    this.interdictionsSignal.set(this.lookups.interdictionCodes || []);
    this.equipmentTypesSignal.set(this.lookups.equipmentTypes || []);
    this.manualAuditFlagsSignal.set(this.lookups.manualAuditFlags || []);

    this.cdr.markForCheck();
  }

  private findLookupItem(items: LookupItem[], key: string | null | undefined): LookupItem | null {
    if (key === null || key === undefined) return null;
    return items.find(item => item.key === key) || null;
  }

  private setupSearchSubscriptions(): void {
    this.operatorSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.operatorSearch.set(v || ''));
    this.interdictionSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.interdictionSearch.set(v || ''));
    this.equipmentTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.equipmentTypeSearch.set(v || ''));
    this.manualAuditSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.manualAuditSearch.set(v || ''));
  }

  private filterItems(items: LookupItem[], search: string): LookupItem[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item => {
      const key = (item.key || '').toString().toLowerCase();
      const value = (item.value || '').toString().toLowerCase();
      return key.includes(lower) || value.includes(lower);
    });
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private validatePeriodType(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const periodType = this.filterForm.get('periodType')?.value;
    this.effectivePeriodRequired = !!effectiveDate && !periodType;
    this.effectiveDateRequired = !!periodType && !effectiveDate;
    const periodTypeControl = this.filterForm.get('periodType');
    if (this.effectivePeriodRequired) {
      periodTypeControl?.setValidators([Validators.required]);
    } else {
      periodTypeControl?.clearValidators();
    }
    periodTypeControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  private validateTerminationPeriodType(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const terminationPeriodType = this.filterForm.get('terminationPeriodType')?.value;
    this.terminationPeriodRequired = !!terminationDate && !terminationPeriodType;
    this.terminationDateRequired = !!terminationPeriodType && !terminationDate;
    const terminationPeriodTypeControl = this.filterForm.get('terminationPeriodType');
    if (this.terminationPeriodRequired) {
      terminationPeriodTypeControl?.setValidators([Validators.required]);
    } else {
      terminationPeriodTypeControl?.clearValidators();
    }
    terminationPeriodTypeControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  /** Validate date input while typing - uses DateFieldValidationUtility pattern */
  onDateInput(event: Event, controlName: string): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get(controlName);
    if (!control) return;

    control.markAsTouched();
    control.markAsDirty();

    if (!inputValue?.trim()) {
      control.setErrors(null);
    } else if (!control.value) {
      // Has text but datepicker couldn't parse it
      control.setErrors({ invalidDate: true });
    }

    this.cdr.markForCheck();
  }

  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('effectiveDate'), null, 'Effective Date'
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('terminationDate'), null, 'Termination Date'
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lookups'] && !changes['lookups'].firstChange) {
      this.populateDropdownsFromLookups();
    }
  }

  onApply(): void {
    // Validate before applying
    this.validatePeriodType();
    this.validateTerminationPeriodType();

    // Don't apply if there are validation errors
    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: DefinePhysicalFindingsValuesFilterFormValue = {
      operator: formValue.operator?.key || null,
      interdiction: formValue.interdiction?.key || null,
      manualAuditFindingsFlag: formValue.manualAuditFindingsFlag,
      equipmentType: formValue.equipmentType?.key || null,
      periodType: formValue.periodType,
      effectiveDate: formValue.effectiveDate ? (formValue.effectiveDate instanceof Date ? formValue.effectiveDate : formValue.effectiveDate.toDate()) : null,
      terminationPeriodType: formValue.terminationPeriodType,
      terminationDate: formValue.terminationDate ? (formValue.terminationDate instanceof Date ? formValue.terminationDate : formValue.terminationDate.toDate()) : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      operator: null,
      interdiction: null,
      manualAuditFindingsFlag: null,
      equipmentType: null,
      periodType: null,
      effectiveDate: null,
      terminationPeriodType: null,
      terminationDate: null
    });
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Extract keys from autocomplete objects
    const operatorKey = typeof formValue.operator === 'object' ? formValue.operator?.key : formValue.operator;
    const interdictionKey = typeof formValue.interdiction === 'object' ? formValue.interdiction?.key : formValue.interdiction;
    const equipmentTypeKey = typeof formValue.equipmentType === 'object' ? formValue.equipmentType?.key : formValue.equipmentType;

    // Check if at least one field has a value
    if (this.filterForm.invalid) {
    return true;
  }

  // If period is selected, a date must also be present
  const effPeriodWithoutDate = formValue.periodType && !formValue.effectiveDate;
  const termPeriodWithoutDate = formValue.terminationPeriodType && !formValue.terminationDate;

  if (effPeriodWithoutDate || termPeriodWithoutDate) {
    return true;
  }

  // Check if at least one meaningful field has a value
  // Period types alone do NOT count — a date must accompany them
  const hasAnyValue =
    (operatorKey !== null && operatorKey !== undefined && operatorKey !== '') ||
    (interdictionKey !== null && interdictionKey !== undefined && interdictionKey !== '') ||
    (formValue.manualAuditFindingsFlag !== null && formValue.manualAuditFindingsFlag !== '') ||
    (equipmentTypeKey !== null && equipmentTypeKey !== undefined && equipmentTypeKey !== '') ||
    formValue.effectiveDate !== null ||
    formValue.terminationDate !== null;  // ← periodType and terminationPeriodType removed

  return !hasAnyValue;
}
}

