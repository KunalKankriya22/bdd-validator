import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { ValidCatalogFilterValue, CatalogNumberDropdownDto, ManufacturerDropdownDto } from '../models/valid-catalog-numbers.model';

@Component({
  selector: 'app-catalog-filter-panel',
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
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './catalog-filter-panel.html',
  styleUrls: ['./catalog-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogFilterPanel implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: ValidCatalogFilterValue | null = null;
  @Input() catalogNumbers: CatalogNumberDropdownDto[] = [];
  @Input() manufacturers: ManufacturerDropdownDto[] = [];
  @Output() apply = new EventEmitter<ValidCatalogFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  catalogNumberSearchCtrl = new FormControl('');
  filteredCatalogNumbers: CatalogNumberDropdownDto[] = [];

  manufacturerSearchCtrl = new FormControl('');
  filteredManufacturers: ManufacturerDropdownDto[] = [];

  showTerminatedOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ];

  periodOptions = [
    { value: 'after', display: 'After' },
    { value: 'before', display: 'Before' },
  ];

  effectivePeriodRequired = false;
  terminationPeriodRequired = false;
  effectiveDateRequired = false;
  terminationDateRequired = false;

  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

  ngOnInit(): void {
    const manufacturerValue = this.currentFilters?.manufacturerCode || this.currentFilters?.manufacturer || null;

    this.filterForm = this.fb.group({
      catalogNumber: [this.currentFilters?.catalogNumber || null],
      manufacturerCode: [manufacturerValue],
      showTerminated: [this.currentFilters?.showTerminated ?? null],
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.currentFilters?.effDate ? new Date(this.currentFilters.effDate) : null, [dateFormatValidator()]],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.currentFilters?.termDate ? new Date(this.currentFilters.termDate) : null, [dateFormatValidator()]],
    });

    this.filteredCatalogNumbers = this.catalogNumbers;
    this.filteredManufacturers = this.manufacturers;
    this.setupSearchFilters();

    this.filterForm.get('effDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const control = this.filterForm.get('effDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateEffectivePeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('termDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const control = this.filterForm.get('termDate');
      if (control && !control.touched) {
        control.markAsTouched();
      }
      setTimeout(() => {
        this.validateTerminationPeriod();
        this.cdr.markForCheck();
      }, 0);
    });

    this.filterForm.get('effDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateEffectivePeriod();
      this.cdr.markForCheck();
    });

    this.filterForm.get('termDatePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateTerminationPeriod();
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['catalogNumbers']) {
      this.filteredCatalogNumbers = this.catalogNumbers;
    }
    if (changes['manufacturers']) {
      this.filteredManufacturers = this.manufacturers;
    }
  }

  private setupSearchFilters(): void {
    this.catalogNumberSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search || '').toLowerCase();
        this.filteredCatalogNumbers = this.catalogNumbers.filter((c) =>
          (c.code && c.code.toLowerCase().includes(term)) ||
          (c.description && c.description.toLowerCase().includes(term))
        );
        this.cdr.markForCheck();
      });

    this.manufacturerSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search || '').toLowerCase();
        this.filteredManufacturers = this.manufacturers.filter((m) =>
          (m.code && m.code.toLowerCase().includes(term)) ||
          (m.description && m.description.toLowerCase().includes(term))
        );
        this.cdr.markForCheck();
      });
  }

  validateEffectivePeriod(): void {
    const date = this.filterForm.get('effDate')?.value;
    const period = this.filterForm.get('effDatePeriod')?.value;
    this.effectivePeriodRequired = !!date && !period;
    this.effectiveDateRequired = !!period && !date;
  }

  validateTerminationPeriod(): void {
    const date = this.filterForm.get('termDate')?.value;
    const period = this.filterForm.get('termDatePeriod')?.value;
    this.terminationPeriodRequired = !!date && !period;
    this.terminationDateRequired = !!period && !date;
  }

  get isApplyDisabled(): boolean {
    if (this.effectivePeriodRequired || this.terminationPeriodRequired ||
        this.effectiveDateRequired || this.terminationDateRequired) {
      return true;
    }

    const effDateControl = this.filterForm.get('effDate');
    const termDateControl = this.filterForm.get('termDate');
    if (effDateControl?.hasError('invalidDateFormat') ||
        effDateControl?.hasError('matDatepickerParse') ||
        termDateControl?.hasError('invalidDateFormat') ||
        termDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    const values = this.filterForm.value;
    const hasCatalogNumber = values?.catalogNumber;
    const hasManufacturerCode = values?.manufacturerCode;
    const hasShowTerminated = values?.showTerminated !== null && values?.showTerminated !== undefined;
    const hasEffDate = values?.effDatePeriod && values?.effDate;
    const hasTermDate = values?.termDatePeriod && values?.termDate;

    return !(hasCatalogNumber || hasManufacturerCode || hasShowTerminated || hasEffDate || hasTermDate);
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('termDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  private convertToUTCDate(date: moment.Moment | Date | null): Date | null {
    if (!date) return null;
    if (moment.isMoment(date)) {
      return new Date(Date.UTC(date.year(), date.month(), date.date(), 0, 0, 0, 0));
    }
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    // Determine if selected manufacturer has code or just description
    let manufacturerCode: string | undefined = undefined;
    let manufacturer: string | undefined = undefined;

    if (formValue.manufacturerCode) {
      const selectedMfr = this.manufacturers.find(m =>
        (m.code && m.code.trim() && m.code === formValue.manufacturerCode) ||
        m.description === formValue.manufacturerCode
      );

      if (selectedMfr) {
        if (selectedMfr.code && selectedMfr.code.trim()) {
          manufacturerCode = selectedMfr.code;
        } else {
          manufacturer = selectedMfr.description;
        }
      }
    }

    const filters: ValidCatalogFilterValue = {
      catalogNumber: formValue.catalogNumber || undefined,
      manufacturerCode: manufacturerCode,
      manufacturer: manufacturer,
      showTerminated: formValue.showTerminated !== null && formValue.showTerminated !== undefined ? formValue.showTerminated : undefined,
      effDatePeriod: formValue.effDatePeriod || undefined,
      effDate: formValue.effDate ? this.convertToUTCDate(formValue.effDate)?.toISOString() || undefined : undefined,
      termDatePeriod: formValue.termDatePeriod || undefined,
      termDate: formValue.termDate ? this.convertToUTCDate(formValue.termDate)?.toISOString() || undefined : undefined,
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      catalogNumber: null,
      manufacturerCode: null,
      showTerminated: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.effectiveDateRequired = false;
    this.terminationDateRequired = false;
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
