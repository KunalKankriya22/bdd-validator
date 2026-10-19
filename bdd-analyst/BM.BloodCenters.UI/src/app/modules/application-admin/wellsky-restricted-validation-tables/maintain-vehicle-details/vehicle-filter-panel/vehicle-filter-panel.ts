import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  inject,
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
import { Subject, takeUntil } from 'rxjs';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import {
  VehicleDetailsFilterValue,
  DatePeriod
} from '../models/vehicle-details.model';
import { VehicleDetailsService } from '../services/vehicle-details.service';

@Component({
  selector: 'app-vehicle-filter-panel',
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
  templateUrl: './vehicle-filter-panel.html',
  styleUrls: ['./vehicle-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehicleFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: VehicleDetailsFilterValue | null = null;
  @Output() apply = new EventEmitter<VehicleDetailsFilterValue>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  vehicleTypeOptions: { value: string; label: string }[] = [];

  // Vehicle ID options as signal for reactivity
  vehicleIdOptions = signal<{ value: string; label: string }[]>([]);

  // Search form control for Vehicle ID dropdown
  readonly vehicleIdSearchControl = new FormControl('');

  // Search signal for reactivity
  readonly vehicleIdSearch = signal('');

  // Filtered Vehicle IDs based on search
  readonly filteredVehicleIds = computed(() => {
    const search = this.vehicleIdSearch().toLowerCase();
    const options = this.vehicleIdOptions();
    if (!search) return options;
    return options.filter(opt =>
      opt.value.toLowerCase().includes(search) ||
      opt.label.toLowerCase().includes(search)
    );
  });

  periodOptions: { value: DatePeriod; label: string }[] = [
    { value: 'Before', label: 'Before' },
    { value: 'After', label: 'After' }
  ];

  formInteracted = false;
  private destroy$ = new Subject<void>();
  private vehicleDetailsService = inject(VehicleDetailsService);

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to search control changes and update signal
    this.vehicleIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.vehicleIdSearch.set(value || '');
      });
  }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      vehicleId: [null],
      vehicleType: [this.currentFilters?.vehicleType || null],
      showTerminated: [this.currentFilters?.showTerminated || false],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || null],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationDatePeriod: [this.currentFilters?.terminationDatePeriod || null],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });

    this.setupValidation();
    this.loadFilterDropdowns();
  }

  private loadFilterDropdowns(): void {
    const showTerminated = this.filterForm.get('showTerminated')?.value ?? false;

    this.vehicleDetailsService.getVehicleIds(showTerminated)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ids) => {
          this.vehicleIdOptions.set(ids);
          if (this.currentFilters?.vehicleId) {
            this.filterForm.get('vehicleId')?.setValue(this.currentFilters.vehicleId, { emitEvent: false });
          }
          this.cdr.markForCheck();
        }
      });

    this.vehicleDetailsService.getVehicleTypes(showTerminated)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.vehicleTypeOptions = types;
          this.cdr.markForCheck();
        }
      });
  }

  onShowTerminatedChange(): void {
    this.loadFilterDropdowns();
  }

  private setupValidation(): void {
    // Watch effective date changes — dynamically require period when date is set
    this.filterForm.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectivePeriod();
      });

    this.filterForm.get('effectiveDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectivePeriod();
      });

    // Watch termination date changes — dynamically require period when date is set
    this.filterForm.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationPeriod();
      });

    this.filterForm.get('terminationDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    // Track user interaction — delay subscription to skip initial form setup emissions
    setTimeout(() => {
      this.filterForm.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.formInteracted = true;
          this.cdr.markForCheck();
        });
    });
  }

  private validateEffectivePeriod(): void {
    const effectiveDate = this.filterForm.get('effectiveDate')?.value;
    const periodControl = this.filterForm.get('effectiveDatePeriod');

    if (effectiveDate) {
      periodControl?.setValidators([Validators.required]);
      periodControl?.markAsTouched();
    } else {
      periodControl?.clearValidators();
    }
    periodControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  private validateTerminationPeriod(): void {
    const terminationDate = this.filterForm.get('terminationDate')?.value;
    const periodControl = this.filterForm.get('terminationDatePeriod');

    if (terminationDate) {
      periodControl?.setValidators([Validators.required]);
      periodControl?.markAsTouched();
    } else {
      periodControl?.clearValidators();
    }
    periodControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Validate date input while typing — uses DateFieldValidationUtility pattern */
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

  onApply(): void {
    // Validate before applying
    this.validateEffectivePeriod();
    this.validateTerminationPeriod();

    // Don't apply if there are validation errors
    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    const filterValue: VehicleDetailsFilterValue = {
      vehicleId: formValue.vehicleId || null,
      vehicleType: formValue.vehicleType || null,
      showTerminated: formValue.showTerminated || false,
      effectiveDate: formValue.effectiveDate
        ? new Date(formValue.effectiveDate).toISOString()
        : null,
      effectiveDatePeriod: formValue.effectiveDatePeriod || null,
      terminationDate: formValue.terminationDate
        ? new Date(formValue.terminationDate).toISOString()
        : null,
      terminationDatePeriod: formValue.terminationDatePeriod || null
    };

    this.apply.emit(filterValue);
  }

  onClearAll(): void {
    this.filterForm.reset({
      vehicleId: null,
      vehicleType: null,
      showTerminated: false,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
    // Clear search field
    this.vehicleIdSearchControl.setValue('');
    // Reset interaction flag so Apply is grayed out
    this.formInteracted = false;
    // Emit to parent to clear filter chips and reset applied filters
    this.clearAll.emit();
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
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

  get isApplyDisabled(): boolean {
  const formValue = this.filterForm.value;

  // Check for date format validation errors
  const effectiveDateControl = this.filterForm.get('effectiveDate');
  const terminationDateControl = this.filterForm.get('terminationDate');
  const hasDateFormatErrors = !!(
    effectiveDateControl?.hasError('invalidDateFormat') ||
    effectiveDateControl?.hasError('matDatepickerParse') ||
    terminationDateControl?.hasError('invalidDateFormat') ||
    terminationDateControl?.hasError('matDatepickerParse')
  );

  if (hasDateFormatErrors) return true;

  // Check if at least one field has a value
  // Period + Date must both be present together (same as Drives logic)
  const hasAnyValue =
    formValue.vehicleId !== null ||
    formValue.vehicleType !== null ||
    formValue.showTerminated === true ||
    (formValue.effectiveDatePeriod !== null && formValue.effectiveDate !== null) ||
    (formValue.terminationDatePeriod !== null && formValue.terminationDate !== null);

  // Disable if no values selected OR if there are validation errors
  return !hasAnyValue || this.filterForm.invalid;
}
}
