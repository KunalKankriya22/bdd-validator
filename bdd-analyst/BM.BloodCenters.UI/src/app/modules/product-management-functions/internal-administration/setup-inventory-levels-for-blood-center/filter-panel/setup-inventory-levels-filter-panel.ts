import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, inject, ChangeDetectorRef, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { A11yModule } from '@angular/cdk/a11y';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { HeaderService } from '@shared/services/header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import {
  FilterValue,
  InventoryTypeLOV,
  ProductTypeLOV,
  BloodTypeLOV,
  AttributeCodeLOV,
  SetInventoryLevelDisplay
} from '../models/setup-inventory-levels.model';

@Component({
  selector: 'app-setup-inventory-levels-filter-panel',
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
    MatMomentDateModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './setup-inventory-levels-filter-panel.html',
  styleUrls: ['./setup-inventory-levels-filter-panel.scss']
})
export class SetupInventoryLevelsFilterPanel implements OnInit, OnDestroy, OnChanges {
  @Input() currentFilters: FilterValue | null = null;
  @Input() tableData: SetInventoryLevelDisplay[] = [];
  @Output() apply = new EventEmitter<FilterValue>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  private fb = inject(FormBuilder);
  private headerService = inject(HeaderService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;
  effectivePeriodRequired = false;
  terminationPeriodRequired = false;

  // LOV Data
  productTypes: ProductTypeLOV[] = [];
  bloodTypes: BloodTypeLOV[] = [];
  attributeCodes: AttributeCodeLOV[] = [];

  // Search controls for dropdowns
  productTypeSearchControl = new FormControl<string>('');
  aborhSearchControl = new FormControl<string>('');
  attributeSearchControl = new FormControl<string>('');

  // Filtered options for dropdowns
  filteredProductTypes: ProductTypeLOV[] = [];
  filteredBloodTypes: BloodTypeLOV[] = [];
  filteredAttributeCodes: AttributeCodeLOV[] = [];

  // Date configuration
  minDate: Moment;
  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  datePeriodOptions = [
    { value: 'After', label: 'After' },
    { value: 'Before', label: 'Before' }
  ];

  // Custom error matchers
  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effDateNativeInput);
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.termDateNativeInput);
    }
  };

  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `filter-panel-${SetupInventoryLevelsFilterPanel.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  constructor() {
    this.minDate = this.getChapterMinDate();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.extractDataFromTable();
    this.setupSearchFilters();
    this.setupDateValidationListeners();

    if (this.currentFilters) {
      this.populateForm(this.currentFilters);
    }
  }

  private setupDateValidationListeners(): void {
    // Clear error flags when effective date changes
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.effectivePeriodRequired = false;
      });

    // Clear error flags when effective date period changes
    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.effectivePeriodRequired = false;
      });

    // Clear error flags when termination date changes
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.terminationPeriodRequired = false;
      });

    // Clear error flags when termination date period changes
    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.terminationPeriodRequired = false;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableData'] && !changes['tableData'].firstChange) {
      this.extractDataFromTable();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      productType: [null],
      aborh: [null],
      attribute: [null],
      effectiveDatePeriod: [null],
      effectiveDate: [null],
      terminationDatePeriod: [null],
      terminationDate: [null]
    });
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private extractDataFromTable(): void {
    if (!this.tableData || this.tableData.length === 0) {
      this.productTypes = [];
      this.filteredProductTypes = [];
      this.bloodTypes = [];
      this.filteredBloodTypes = [];
      this.attributeCodes = [];
      this.filteredAttributeCodes = [];
      return;
    }

    // Extract unique Product Types
    const productTypeMap = new Map<string, ProductTypeLOV>();
    this.tableData.forEach(row => {
      if (row.productType) {
        productTypeMap.set(row.productType, {
          productType: row.productType,
          productTypeDesc: row.productTypeDesc || row.productType
        });
      }
    });
    this.productTypes = Array.from(productTypeMap.values()).sort((a, b) =>
      a.productType.localeCompare(b.productType)
    );
    this.filteredProductTypes = this.productTypes;

    // Extract unique Blood Types
    const bloodTypeMap = new Map<string, BloodTypeLOV>();
    this.tableData.forEach(row => {
      if (row.bloodType) {
        bloodTypeMap.set(row.bloodType, {
          aboCode: row.bloodType,
          aboDesc: row.bloodTypeDesc || row.bloodType
        });
      }
    });
    this.bloodTypes = Array.from(bloodTypeMap.values()).sort((a, b) =>
      a.aboCode.localeCompare(b.aboCode)
    );
    this.filteredBloodTypes = this.bloodTypes;

    // Extract unique Attribute Codes (show only attribCode as displayed in table)
    const attributeMap = new Map<string, AttributeCodeLOV>();
    this.tableData.forEach(row => {
      if (row.attribCode) {
        attributeMap.set(row.attribCode, {
          attribCode: row.attribCode,
          attribDesc: row.attribCode
        });
      }
    });
    this.attributeCodes = Array.from(attributeMap.values()).sort((a, b) =>
      a.attribCode.localeCompare(b.attribCode)
    );
    this.filteredAttributeCodes = this.attributeCodes;
  }

  private setupSearchFilters(): void {
    // Product Type search
    this.productTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredProductTypes = this.productTypes.filter((type) =>
          type.productType.toLowerCase().includes(term) ||
          type.productTypeDesc.toLowerCase().includes(term)
        );
      });

    // Blood Type search
    this.aborhSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredBloodTypes = this.bloodTypes.filter((type) =>
          type.aboCode.toLowerCase().includes(term) ||
          type.aboDesc.toLowerCase().includes(term)
        );
      });

    // Attribute search
    this.attributeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredAttributeCodes = this.attributeCodes.filter((attr) =>
          attr.attribCode.toLowerCase().includes(term) ||
          attr.attribDesc.toLowerCase().includes(term)
        );
      });
  }

  private populateForm(filters: FilterValue): void {
    const formValue: any = {};

    if (filters.productType) {
      formValue.productType = filters.productType;
    }

    if (filters.aborh) {
      formValue.aborh = filters.aborh;
    }

    if (filters.attribute) {
      formValue.attribute = filters.attribute;
    }

    if (filters.effectiveDatePeriod) {
      formValue.effectiveDatePeriod = filters.effectiveDatePeriod;
    }

    if (filters.effectiveDate) {
      formValue.effectiveDate = moment(filters.effectiveDate);
    }

    if (filters.terminationDatePeriod) {
      formValue.terminationDatePeriod = filters.terminationDatePeriod;
    }

    if (filters.terminationDate) {
      formValue.terminationDate = moment(filters.terminationDate);
    }

    this.filterForm.patchValue(formValue);
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

    // Check if at least one field has a value
    const formValue = this.filterForm.value;
    const hasAnyValue = formValue.productType ||
                        formValue.aborh ||
                        formValue.attribute ||
                        formValue.effectiveDate ||
                        formValue.terminationDate;

    return !hasAnyValue;
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effDateNativeInput)) return 'Effective Date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination Date is invalid';
    return '';
  }

  onApply(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.markAllAsTouched();

    const formValue = this.filterForm.value;

    // Check for period validation errors
    this.effectivePeriodRequired = !!(formValue.effectiveDate && !formValue.effectiveDatePeriod);
    this.terminationPeriodRequired = !!(formValue.terminationDate && !formValue.terminationDatePeriod);

    // If there are validation errors, stop here
    if (this.filterForm.invalid || this.effectivePeriodRequired || this.terminationPeriodRequired) {
      this.cdr.markForCheck();
      return;
    }

    const filters: FilterValue = {};

    if (formValue.productType) {
      filters.productType = formValue.productType;
    }

    if (formValue.aborh) {
      filters.aborh = formValue.aborh;
    }

    if (formValue.attribute) {
      filters.attribute = formValue.attribute;
    }

    if (formValue.effectiveDatePeriod && formValue.effectiveDate) {
      filters.effectiveDatePeriod = formValue.effectiveDatePeriod;
      filters.effectiveDate = DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate);
    }

    if (formValue.terminationDatePeriod && formValue.terminationDate) {
      filters.terminationDatePeriod = formValue.terminationDatePeriod;
      filters.terminationDate = DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate);
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
  }

  onClose(): void {
    this.close.emit();
  }
}
