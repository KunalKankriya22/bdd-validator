import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { AutoDirProductsApiService } from '../services/auto-dir-products-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import {
  AutoDirProductsFilterForm,
  SORT_ORDER_OPTIONS
} from '../models/auto-dir-products.model';

/**
 * Filter Panel Component for Auto/Dir Products Query
 * Provides search filters with validation
 */
@Component({
  selector: 'app-auto-dir-products-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatIconModule,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './auto-dir-products-filter-panel.html',
  styleUrl: './auto-dir-products-filter-panel.scss'
})
export class AutoDirProductsFilterPanelComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `auto-dir-products-filter-panel-${AutoDirProductsFilterPanelComponent.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AutoDirProductsApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  @Input() loading = false;
  @Input() initialExpanded = true;

  private _pendingFilters: AutoDirProductsFilterForm | null = null;

  @Input() set initialFilters(filters: AutoDirProductsFilterForm | null) {
    if (filters) {
      if (this.filterForm) {
        // Form is ready, restore immediately
        this.restoreFilters(filters);
      } else {
        // Form not ready yet, save for ngOnInit
        this._pendingFilters = filters;
      }
    }
  }

  @Output() search = new EventEmitter<AutoDirProductsFilterForm>();
  @Output() clear = new EventEmitter<void>();

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  filterForm!: FormGroup;
  sortOrderOptions = SORT_ORDER_OPTIONS;

  // Dropdown options
  hospitalOptions: Array<{value: string; label: string}> = [];
  patientOptions: Array<{value: string; label: string}> = [];

  // Filtered dropdown options (for search)
  filteredHospitalOptions: Array<{value: string; label: string}> = [];
  filteredPatientOptions: Array<{value: string; label: string}> = [];

  // Search controls
  hospitalSearchControl = new FormControl('');
  patientSearchControl = new FormControl('');

  // Loading states for dropdowns
  lookupsLoading = false;

  // Store validated unit ID
  private validatedUnitId: string | null = null;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  ngOnInit(): void {
    this.initForm();
    this.loadLookups();
    this.setupSearchControls();
    this.watchUnitIdFieldChanges();

    // Restore pending filters if they were set before form initialization
    if (this._pendingFilters) {
      // Use setTimeout to ensure lookups are loaded first
      setTimeout(() => {
        if (this._pendingFilters) {
          this.restoreFilters(this._pendingFilters);
          this._pendingFilters = null;
        }
      }, 100);
    }
  }

  /**
   * Watch for manual changes to Unit ID field and clear validated value
   */
  private watchUnitIdFieldChanges(): void {
    // Wait for ViewChild to be initialized
    setTimeout(() => {
      if (this.unitIdField && this.unitIdField.unitIdControl) {
        this.unitIdField.unitIdControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((value) => {
            // If user manually clears or changes the field, clear the validated unit
            if (!value || value.trim() === '') {
              this.validatedUnitId = null;
            }
          });
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
      needByDate: [null],
      surgeryDate: [null],
      hospitalId: [''],
      patientId: [''],
      orderBy: ['UNIT']
    });

    // Add cross-field validation
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDateRanges();
      });
  }

  /**
   * Validate date ranges and set errors
   */
  private validateDateRanges(): void {
    const fromDate = this.filterForm.get('fromDate');
    const toDate = this.filterForm.get('toDate');
    const needByDate = this.filterForm.get('needByDate');
    const surgeryDate = this.filterForm.get('surgeryDate');

    // Clear previous errors
    toDate?.setErrors(null);
    surgeryDate?.setErrors(null);

    // Validate toDate >= fromDate
    if (fromDate?.value && toDate?.value) {
      const from = moment(fromDate.value);
      const to = moment(toDate.value);
      if (to.isBefore(from, 'day')) {
        toDate?.setErrors({ dateRange: 'To Date cannot be before From Date' });
      }
    }

    // Validate surgeryDate >= needByDate
    if (needByDate?.value && surgeryDate?.value) {
      const needBy = moment(needByDate.value);
      const surgery = moment(surgeryDate.value);
      if (surgery.isBefore(needBy, 'day')) {
        surgeryDate?.setErrors({ dateRange: 'Surgery Date cannot be before Need By Date' });
      }
    }
  }

  /**
   * Get error message for To Date field
   */
  getToDateError(): string | null {
    const control = this.filterForm.get('toDate');
    if (control?.errors && control.touched) {
      if (control.errors['dateRange']) {
        return control.errors['dateRange'];
      }
    }
    return null;
  }

  /**
   * Get error message for Surgery Date field
   */
  getSurgeryDateError(): string | null {
    const control = this.filterForm.get('surgeryDate');
    if (control?.errors && control.touched) {
      if (control.errors['dateRange']) {
        return control.errors['dateRange'];
      }
    }
    return null;
  }

  /**
   * Load hospital and patient lookups from API
   */
  private loadLookups(): void {
    this.lookupsLoading = true;

    forkJoin({
      hospitals: this.apiService.getHospitals(),
      patients: this.apiService.getPatients()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Map hospital data
          this.hospitalOptions = response.hospitals.map(h => ({
            value: h.hospitalId,
            label: `${h.hospitalId} - ${h.hospitalName}`
          }));

          // Map patient data
          this.patientOptions = response.patients.map(p => ({
            value: p.patientId,
            label: `${p.patientId} - ${p.patientName}`
          }));

          // Initialize filtered lists
          this.filteredHospitalOptions = [...this.hospitalOptions];
          this.filteredPatientOptions = [...this.patientOptions];

          this.lookupsLoading = false;
        },
        error: (error) => {
          console.error('Error loading lookups:', error);
          // Set empty arrays on error so dropdowns still work
          this.hospitalOptions = [];
          this.patientOptions = [];
          this.filteredHospitalOptions = [];
          this.filteredPatientOptions = [];
          this.lookupsLoading = false;
        }
      });
  }

  /**
   * Setup search controls for dropdowns
   */
  private setupSearchControls(): void {
    // Hospital search
    this.hospitalSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredHospitalOptions = this.hospitalOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });

    // Patient search
    this.patientSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredPatientOptions = this.patientOptions.filter(option =>
          option.label.toLowerCase().includes(term)
        );
      });
  }

  /**
   * Handle Unit ID validation
   */
  onUnitIdValidated(response: UnitValidationResponse): void {
    this.validatedUnitId = response.parsedUnitId;
  }

  /**
   * Handle Unit ID cleared
   */
  onUnitIdCleared(): void {
    this.validatedUnitId = null;
  }

  /**
   * Check if Unit ID field is actually empty
   * Used to prevent auto-population
   */
  private isUnitIdFieldEmpty(): boolean {
    if (!this.unitIdField) {
      return true;
    }

    const fieldValue = this.unitIdField.unitIdControl?.value;
    return !fieldValue || fieldValue.trim() === '';
  }

  /**
   * Check if Unit ID field has an error or is validating
   */
  get hasUnitIdError(): boolean {
    if (!this.unitIdField) return false;

    // Block if validation is in progress
    if (this.unitIdField.validationState === 'validating') return true;

    // Check if the control has validation errors (serverError or mismatch)
    const control = this.unitIdField.unitIdControl;
    return control.hasError('serverError') || control.hasError('mismatch');
  }

  get f() {
    return this.filterForm.controls;
  }

  /**
   * Validate form before submission
   * Business Rules:
   * 1. At least one search criterion required
   * 2. toDate >= fromDate
   * 3. surgeryDate >= needByDate
   */
  private validateForm(): string | null {
    const formValue = this.filterForm.value;

    // Check if at least one criterion is provided
    const hasCriteria = !!(
      this.validatedUnitId ||
      formValue.fromDate ||
      formValue.toDate ||
      formValue.needByDate ||
      formValue.surgeryDate ||
      formValue.hospitalId ||
      formValue.patientId
    );

    if (!hasCriteria) {
      return '0080 - At least one search criterion is required';
    }

    // Validate date range: toDate >= fromDate
    if (formValue.fromDate && formValue.toDate) {
      const from = moment(formValue.fromDate);
      const to = moment(formValue.toDate);
      if (to.isBefore(from, 'day')) {
        return '7023 - To Date cannot be before From Date';
      }
    }

    // Validate surgery date: surgeryDate >= needByDate
    if (formValue.needByDate && formValue.surgeryDate) {
      const needBy = moment(formValue.needByDate);
      const surgery = moment(formValue.surgeryDate);
      if (surgery.isBefore(needBy, 'day')) {
        return '2319 - Surgery Date cannot be before Need By Date';
      }
    }

    return null;
  }

  onSearch(): void {
    if (this.filterForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    // CRITICAL FIX: Clear validatedUnitId if field is manually cleared
    if (this.isUnitIdFieldEmpty()) {
      this.validatedUnitId = null;
    }

    const validationError = this.validateForm();
    if (validationError) {
      this.snackbarService.showError(validationError);
      return;
    }

    const formValue = this.filterForm.value;

    // Combine form values with validated unit ID
    const searchData: AutoDirProductsFilterForm = {
      unitId: this.validatedUnitId || undefined,
      ...formValue
    };

    this.search.emit(searchData);
  }

  onClear(): void {
    this.filterForm.reset({
      orderBy: 'UNIT' // Reset to default sort order
    });

    // Clear the Unit ID field component (this will trigger onUnitIdCleared via the cleared event)
    if (this.unitIdField) {
      this.unitIdField.clear();
    }

    this.clear.emit();
  }

  private markFormAsTouched(): void {
    Object.keys(this.filterForm.controls).forEach(key => {
      this.filterForm.controls[key].markAsTouched();
    });
  }

  /**
   * Check if form has any active filters
   */
  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      this.validatedUnitId ||
      formValue.fromDate ||
      formValue.toDate ||
      formValue.needByDate ||
      formValue.surgeryDate ||
      formValue.hospitalId ||
      formValue.patientId
    );
  }

  /**
   * Restore filter values from saved state
   */
  private restoreFilters(filters: AutoDirProductsFilterForm): void {
    // Restore form values first (these don't depend on ViewChild)
    this.filterForm.patchValue({
      fromDate: filters.fromDate || null,
      toDate: filters.toDate || null,
      needByDate: filters.needByDate || null,
      surgeryDate: filters.surgeryDate || null,
      hospitalId: filters.hospitalId || '',
      patientId: filters.patientId || '',
      orderBy: filters.orderBy || 'UNIT'
    }, { emitEvent: false });

    // Restore validated unit ID with delay to ensure ViewChild is ready
    if (filters.unitId) {
      this.validatedUnitId = filters.unitId;

      // Wait for ViewChild to be initialized
      setTimeout(() => {
        if (this.unitIdField) {
          this.unitIdField.unitIdControl.setValue(filters.unitId!);

          // Mark as valid without re-validation since it was previously validated
          this.unitIdField['validationState'] = 'valid';
          this.unitIdField['_parsedUnitData'] = {
            parsedUnitId: filters.unitId!,
            checkDigit: null,
            codeScheme: 'C',
            manualUnitId: filters.unitId!,
            codabarUnitScheme: null,
            entryMode: 'M',
            barcodeType: 'CODABAR',
            chapterScheme: 'C'
          };
        }
      }, 200);
    }
  }
}
