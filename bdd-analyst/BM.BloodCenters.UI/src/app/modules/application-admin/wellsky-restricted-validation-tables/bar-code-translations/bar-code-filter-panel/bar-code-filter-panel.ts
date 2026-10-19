import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ErrorStateMatcher, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { Subject, takeUntil } from 'rxjs';
import { Moment } from 'moment';

import { BarCodeTranslationFilterValue } from '../models/bar-code-translations.model';
import { BarCodeTranslationsService } from '../services/bar-code-translations.service';

@Component({
  selector: 'app-bar-code-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './bar-code-filter-panel.html',
  styleUrls: ['./bar-code-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarCodeFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: BarCodeTranslationFilterValue | null = null;
  @Output() apply = new EventEmitter<BarCodeTranslationFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  periodOptions: { value: 'BEFORE' | 'AFTER'; label: string }[] = [
    { value: 'BEFORE', label: 'Before' },
    { value: 'AFTER', label: 'After' }
  ];

  isLoadingMachineCodes = true;
  isLoadingEyeReadCodes = true;

  readonly selectPanelLoadingValue = '__FILTER_PANEL_LOADING__';
  readonly selectPanelEmptyValue = '__FILTER_PANEL_EMPTY__';

  @ViewChild('effectiveDateNativeInput') effectiveDateNativeInput?: ElementRef;
  @ViewChild('terminationDateNativeInput') terminationDateNativeInput?: ElementRef;

  effDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.effectiveDateNativeInput);
    }
  };

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      return !control.value && !!this.getNativeInputText(this.terminationDateNativeInput);
    }
  };

  // Searchable dropdown controls
  readonly machineCodeSearchControl = new FormControl('');
  readonly eyeReadSearchControl = new FormControl('');

  // Signals for search text
  readonly machineCodeSearch = signal('');
  readonly eyeReadSearch = signal('');

  // Options from API
  readonly machineCodeOptions = signal<string[]>([]);
  readonly eyeReadOptions = signal<string[]>([]);

  // Filtered options based on search
  readonly filteredMachineCodes = computed(() => {
    const search = this.machineCodeSearch().toLowerCase();
    const options = this.machineCodeOptions();
    if (!search) return options;
    return options.filter(code => code.toLowerCase().includes(search));
  });

  readonly filteredEyeReadCodes = computed(() => {
    const search = this.eyeReadSearch().toLowerCase();
    const options = this.eyeReadOptions();
    if (!search) return options;
    return options.filter(code => code.toLowerCase().includes(search));
  });

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private barCodeService: BarCodeTranslationsService,
    private cdr: ChangeDetectorRef
  ) {
    this.machineCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.machineCodeSearch.set(value || '');
      });
    this.eyeReadSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.eyeReadSearch.set(value || '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      machineCode: [this.currentFilters?.machineCode || null],
      eyeReadTrns: [this.currentFilters?.eyeReadTrns || null],
      effDate: [
        this.currentFilters?.effDate
          ? new Date(this.currentFilters.effDate)
          : null
      ],
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      termDate: [
        this.currentFilters?.termDate
          ? new Date(this.currentFilters.termDate)
          : null
      ],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null]
    });

    // Effective date validation listeners
    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effDate');
        const periodControl = this.filterForm.get('effDatePeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effDate');
        const periodControl = this.filterForm.get('effDatePeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateEffectiveDatePeriod();
      });

    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffectiveDatePeriod();
      });

    // Termination date validation listeners
    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('termDate');
        const periodControl = this.filterForm.get('termDatePeriod');

        if (control && !control.touched) {
          control.markAsTouched();
        }

        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('termDate')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('termDate');
        const periodControl = this.filterForm.get('termDatePeriod');

        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) {
          periodControl.markAsTouched();
        }

        this.validateTerminationDatePeriod();
      });

    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTerminationDatePeriod();
      });

    this.loadDropdownOptions();
  }

  private loadDropdownOptions(): void {
    this.isLoadingMachineCodes = true;
    this.isLoadingEyeReadCodes = true;

    this.barCodeService.getUsedMachineCodes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (codes) => {
        this.machineCodeOptions.set(codes);
        this.isLoadingMachineCodes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.machineCodeOptions.set([]);
        this.isLoadingMachineCodes = false;
        this.cdr.markForCheck();
      }
    });

    this.barCodeService.getEyeReadTranslations().pipe(takeUntil(this.destroy$)).subscribe({
      next: (codes) => {
        this.eyeReadOptions.set(codes);
        this.isLoadingEyeReadCodes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.eyeReadOptions.set([]);
        this.isLoadingEyeReadCodes = false;
        this.cdr.markForCheck();
      }
    });
  }

  private validateEffectiveDatePeriod(): void {
    const effDateControl = this.filterForm.get('effDate');
    const effDate = effDateControl?.value;
    const effDatePeriod = this.filterForm.get('effDatePeriod')?.value;
    const effDatePeriodControl = this.filterForm.get('effDatePeriod');

    const hasValidDate = effDate && !effDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !effDatePeriod) {
      effDatePeriodControl?.setErrors({ required: true });
      effDatePeriodControl?.markAsTouched();
    } else {
      effDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTerminationDatePeriod(): void {
    const termDateControl = this.filterForm.get('termDate');
    const termDate = termDateControl?.value;
    const termDatePeriod = this.filterForm.get('termDatePeriod')?.value;
    const termDatePeriodControl = this.filterForm.get('termDatePeriod');

    const hasValidDate = termDate && !termDateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !termDatePeriod) {
      termDatePeriodControl?.setErrors({ required: true });
      termDatePeriodControl?.markAsTouched();
    } else {
      termDatePeriodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  get isApplyDisabled(): boolean {
    const values = this.filterForm?.value;
    const hasAnyValue = values?.machineCode ||
                        values?.eyeReadTrns ||
                        values?.effDatePeriod || values?.effDate ||
                        values?.termDatePeriod || values?.termDate;

    if (!hasAnyValue) {
      return true;
    }

    const effDateControl = this.filterForm.get('effDate');
    const termDateControl = this.filterForm.get('termDate');
    const effDatePeriodControl = this.filterForm.get('effDatePeriod');
    const termDatePeriodControl = this.filterForm.get('termDatePeriod');

    const hasDateErrors = (effDateControl?.invalid ?? false) || (termDateControl?.invalid ?? false);
    const hasPeriodErrors = (effDatePeriodControl?.invalid ?? false) || (termDatePeriodControl?.invalid ?? false);

    return hasDateErrors || hasPeriodErrors;
  }

  onApply(): void {
    this.validateEffectiveDatePeriod();
    this.validateTerminationDatePeriod();

    const effDateControl = this.filterForm.get('effDate');
    const termDateControl = this.filterForm.get('termDate');
    const effDatePeriodControl = this.filterForm.get('effDatePeriod');
    const termDatePeriodControl = this.filterForm.get('termDatePeriod');

    if (effDateControl?.errors ||
        termDateControl?.errors ||
        effDatePeriodControl?.errors ||
        termDatePeriodControl?.errors) {
      effDateControl?.markAsTouched();
      termDateControl?.markAsTouched();
      effDatePeriodControl?.markAsTouched();
      termDatePeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: BarCodeTranslationFilterValue = {
      machineCode: formValue.machineCode || null,
      eyeReadTrns: formValue.eyeReadTrns || null,
      effDate: formValue.effDate
        ? this.formatDateForApi(formValue.effDate)
        : null,
      effDatePeriod: formValue.effDatePeriod || null,
      termDate: formValue.termDate
        ? this.formatDateForApi(formValue.termDate)
        : null,
      termDatePeriod: formValue.termDatePeriod || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.machineCodeSearchControl.reset('');
    this.eyeReadSearchControl.reset('');
    this.machineCodeSearch.set('');
    this.eyeReadSearch.set('');

    this.filterForm.get('effDatePeriod')?.setErrors(null);
    this.filterForm.get('termDatePeriod')?.setErrors(null);
  }

  private formatDateForApi(date: Date | string | Moment | null | undefined): string {
    if (!date) return '';

    if (typeof date === 'string') {
      return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
    }

    const dateObj: Date = date instanceof Date ? date : date.toDate();

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective date is invalid';
    if (!control.value && this.getNativeInputText(this.effectiveDateNativeInput)) return 'Effective date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination date is invalid';
    if (!control.value && this.getNativeInputText(this.terminationDateNativeInput)) return 'Termination date is invalid';
    return '';
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  onClose(): void {
    this.close.emit();
  }
}
