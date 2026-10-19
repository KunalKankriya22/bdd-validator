import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { RegisterSpecialDonationRequestService } from '../register-special-donation-request.service';
import { SpecialDonationFilterValue } from '../register-special-donation-request.models';
import moment, { Moment } from 'moment';

interface PeriodOption {
  value: 'before' | 'after';
  label: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'after', label: 'After' },
  { value: 'before', label: 'Before' }
];

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-special-donation-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    FilterPanelBase
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpecialDonationFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: SpecialDonationFilterValue | null = null;
  @Output() apply = new EventEmitter<SpecialDonationFilterValue>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('surgDateNativeInput') surgDateNativeInput?: ElementRef;
  @ViewChild('neededByNativeInput') neededByNativeInput?: ElementRef;

  filterForm!: FormGroup;
  periodOptions: PeriodOption[] = PERIOD_OPTIONS;
  shipToOptions: SelectOption[] = [];

  private destroy$ = new Subject<void>();

  readonly statusSearchControl = new FormControl('');
  readonly shipToSearchControl = new FormControl('');

  private readonly statusSearch = signal('');
  private readonly shipToSearch = signal('');
  private readonly statusOptionsSignal = signal<SelectOption[]>([]);
  private readonly shipToOptionsSignal = signal<SelectOption[]>([]);

  readonly filteredStatusOptions = computed(() => {
    const search = this.statusSearch().toLowerCase();
    const options = this.statusOptionsSignal();
    if (!search) return options;
    return options.filter(o => o.label.toLowerCase().includes(search));
  });

  readonly filteredShipToOptions = computed(() => {
    const search = this.shipToSearch().toLowerCase();
    const options = this.shipToOptionsSignal();
    if (!search) return options;
    return options.filter(o => o.label.toLowerCase().includes(search));
  });

  surgDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.surgDateNativeInput);
    }
  };

  neededByErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.neededByNativeInput);
    }
  };

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private service: RegisterSpecialDonationRequestService
  ) {}

  ngOnInit(): void {
    this.loadStatusOptions();
    this.loadShipLocations();
    this.initializeForm();
    this.setupValueChangeListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStatusOptions(): void {
    const allOption: SelectOption = { value: '', label: 'All' };
    this.service.getPatientStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const items = (Array.isArray(response) ? response : (response as any)?.data || []);
          const mapped: SelectOption[] = items.map((item: any) => ({
            value: item.code,
            label: item.description
          }));
          this.statusOptionsSignal.set([allOption, ...mapped]);
          this.cdr.markForCheck();
        },
        error: () => {
          this.statusOptionsSignal.set([
            allOption,
            { value: 'A', label: 'Active' },
            { value: 'I', label: 'Inactive' }
          ]);
          this.cdr.markForCheck();
        }
      });
  }

  private loadShipLocations(): void {
    this.service.getShipLocations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const locations = (response?.data || response || []).map((item: any) => ({
            value: item.shipId || item.code || item.value,
            label: item.shipLocnName || item.description || item.label
          }));
          this.shipToOptions = locations;
          this.shipToOptionsSignal.set(locations);
          this.cdr.markForCheck();
        },
        error: () => {
          this.shipToOptions = [];
          this.shipToOptionsSignal.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  private initializeForm(): void {
    const surgeryDate = this.currentFilters?.surgeryDate
      ? moment.isMoment(this.currentFilters.surgeryDate)
        ? this.currentFilters.surgeryDate
        : moment(this.currentFilters.surgeryDate)
      : null;

    const neededBy = this.currentFilters?.neededBy
      ? moment.isMoment(this.currentFilters.neededBy)
        ? this.currentFilters.neededBy
        : moment(this.currentFilters.neededBy)
      : null;

    this.filterForm = this.fb.group({
      status: [this.currentFilters?.status || null],
      shipTo: [this.currentFilters?.shipTo || null],
      surgeryDatePeriod: [this.currentFilters?.surgeryDatePeriod || null],
      surgeryDate: [surgeryDate],
      neededByPeriod: [this.currentFilters?.neededByPeriod || null],
      neededBy: [neededBy]
    });
  }

  private setupValueChangeListeners(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.filterForm.get('surgeryDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateSurgeryDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('surgeryDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateSurgeryDatePeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('neededBy')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateNeededByPeriod();
        this.cdr.markForCheck();
      });

    this.filterForm.get('neededByPeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateNeededByPeriod();
        this.cdr.markForCheck();
      });

    this.statusSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.statusSearch.set(value || ''));

    this.shipToSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.shipToSearch.set(value || ''));
  }

  private validateSurgeryDatePeriod(): void {
    const date = this.filterForm.get('surgeryDate')?.value;
    const period = this.filterForm.get('surgeryDatePeriod')?.value;
    const control = this.filterForm.get('surgeryDatePeriod');

    if (date && !period) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  private validateNeededByPeriod(): void {
    const date = this.filterForm.get('neededBy')?.value;
    const period = this.filterForm.get('neededByPeriod')?.value;
    const control = this.filterForm.get('neededByPeriod');

    if (date && !period) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  getSurgeryDatePeriodError(): string {
    const control = this.filterForm.get('surgeryDatePeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  getNeededByPeriodError(): string {
    const control = this.filterForm.get('neededByPeriod');
    if (control?.hasError('required') && control?.touched) {
      return 'Period is required';
    }
    return '';
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getSurgeryDateError(): string | null {
    const control = this.filterForm.get('surgeryDate');
    if (!control) return null;
    if (control.hasError('matDatepickerParse')) {
      return this.getNativeInputText(this.surgDateNativeInput) ? 'Invalid date format' : null;
    }
    if (control.hasError('matDatepickerMin')) return 'Date is too early';
    if (control.hasError('matDatepickerMax')) return 'Date is too late';
    return null;
  }

  getNeededByError(): string | null {
    const control = this.filterForm.get('neededBy');
    if (!control) return null;
    if (control.hasError('matDatepickerParse')) {
      return this.getNativeInputText(this.neededByNativeInput) ? 'Invalid date format' : null;
    }
    if (control.hasError('matDatepickerMin')) return 'Date is too early';
    if (control.hasError('matDatepickerMax')) return 'Date is too late';
    return null;
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid) return true;
    if (this.getSurgeryDateError() || this.getNeededByError()) return true;
    if (this.getSurgeryDatePeriodError() || this.getNeededByPeriodError()) return true;

    const f = this.filterForm.value;
    const surgDatePeriodRequired = !!f.surgeryDate && !f.surgeryDatePeriod;
    const neededByPeriodRequired = !!f.neededBy && !f.neededByPeriod;
    if (surgDatePeriodRequired || neededByPeriodRequired) return true;

    const hasAnyValue = f.status || f.shipTo || f.surgeryDate || f.neededBy;
    return !hasAnyValue;
  }

  onApply(): void {
    if (this.isApplyDisabled) return;

    const f = this.filterForm.value;
    const filters: SpecialDonationFilterValue = {
      status: f.status || null,
      shipTo: f.shipTo || null,
      surgeryDate: f.surgeryDate ? this.formatDateForApi(f.surgeryDate) : null,
      surgeryDatePeriod: f.surgeryDatePeriod || null,
      neededBy: f.neededBy ? this.formatDateForApi(f.neededBy) : null,
      neededByPeriod: f.neededByPeriod || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      status: null,
      shipTo: null,
      surgeryDatePeriod: null,
      surgeryDate: null,
      neededByPeriod: null,
      neededBy: null
    });

    this.statusSearchControl.setValue('');
    this.shipToSearchControl.setValue('');

    Object.keys(this.filterForm.controls).forEach(key => {
      const control = this.filterForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
      control?.updateValueAndValidity();
    });

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  onStatusDropdownClosed(): void {
    this.statusSearchControl.setValue('');
  }

  onShipToDropdownClosed(): void {
    this.shipToSearchControl.setValue('');
  }

  private formatDateForApi(date: Moment | Date | null): string | null {
    if (!date) return null;
    if (moment.isMoment(date)) return date.format('YYYY-MM-DD');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
