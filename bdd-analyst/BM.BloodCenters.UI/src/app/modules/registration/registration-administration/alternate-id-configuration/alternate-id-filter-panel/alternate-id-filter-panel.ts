import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { Subject, takeUntil } from 'rxjs';
import {
  AlternateIdSearchParams,
  DropdownOption,
  ALTID_MATCH_TYPE_OPTIONS,
} from '../models/alternate-id.model';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-alternate-id-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './alternate-id-filter-panel.html',
  styleUrls: ['./alternate-id-filter-panel.scss'],
})
export class AlternateIdFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: AlternateIdSearchParams | null = null;
  @Input() keyGradeOptions: DropdownOption[] = [];
  @Input() altIdMatchOptions: DropdownOption[] = [];
  @Input() finalGradeOptions: DropdownOption[] = [];
  @Output() apply = new EventEmitter<AlternateIdSearchParams>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  periodOptions = [
    { value: 'After', label: 'After' },
    { value: 'Before', label: 'Before' },
  ];

  readonly keyGradeSearchCtrl = new FormControl('');
  readonly finalGradeSearchCtrl = new FormControl('');

  private readonly keyGradeSearch = signal('');
  private readonly finalGradeSearch = signal('');

  private readonly keyGradeOptionsSignal = signal<DropdownOption[]>([]);
  private readonly finalGradeOptionsSignal = signal<DropdownOption[]>([]);

  readonly filteredKeyGrades = computed(() =>
    this.filterDropdownItems(this.keyGradeOptionsSignal(), this.keyGradeSearch())
  );
  readonly filteredFinalGrades = computed(() =>
    this.filterDropdownItems(this.finalGradeOptionsSignal(), this.finalGradeSearch())
  );

  effDatePeriodRequired = false;
  termDatePeriodRequired = false;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.keyGradeOptionsSignal.set(this.keyGradeOptions);
    this.finalGradeOptionsSignal.set(this.finalGradeOptions);

    this.filterForm = this.fb.group({
      keyDataGrade: [this.currentFilters?.keyDataGrade || null],
      altidMatchType: [this.currentFilters?.altidMatchType || null],
      finalGrade: [this.currentFilters?.finalGrade || null],
      effDatePeriod: [this.currentFilters?.effDatePeriod || null],
      effDate: [this.currentFilters?.effDate || null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      termDatePeriod: [this.currentFilters?.termDatePeriod || null],
      termDate: [this.currentFilters?.termDate || null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
    });

    this.setupDatePeriodValidation();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDatePeriodValidation(): void {
    // Validate effective date period when date changes
    this.filterForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffDatePeriod();
      });

    // Clear error when period is selected
    this.filterForm.get('effDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateEffDatePeriod();
      });

    // Validate termination date period when date changes
    this.filterForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTermDatePeriod();
      });

    // Clear error when period is selected
    this.filterForm.get('termDatePeriod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateTermDatePeriod();
      });
  }

  validateEffDatePeriod(): void {
    const date = this.filterForm.get('effDate')?.value;
    const period = this.filterForm.get('effDatePeriod')?.value;
    this.effDatePeriodRequired = !!date && !period;
  }

  validateTermDatePeriod(): void {
    const date = this.filterForm.get('termDate')?.value;
    const period = this.filterForm.get('termDatePeriod')?.value;
    this.termDatePeriodRequired = !!date && !period;
  }

  get isApplyDisabled(): boolean {
    if (this.effDatePeriodRequired || this.termDatePeriodRequired) {
      return true;
    }

    if (this.getEffDateError() || this.getTermDateError()) {
      return true;
    }

    const formValue = this.filterForm.value;
    const hasFilters =
      formValue.keyDataGrade ||
      formValue.altidMatchType ||
      formValue.finalGrade ||
      formValue.effDate ||
      formValue.termDate;

    return !hasFilters;
  }

  applyFilter(): void {
    const formValue = this.filterForm.value;
    const params: AlternateIdSearchParams = {};

    if (formValue.keyDataGrade) {
      params.keyDataGrade = formValue.keyDataGrade;
    }

    if (formValue.altidMatchType) {
      params.altidMatchType = formValue.altidMatchType;
    }

    if (formValue.finalGrade) {
      params.finalGrade = formValue.finalGrade;
    }

    if (formValue.effDate) {
      params.effDate = formValue.effDate;
      params.effDatePeriod = formValue.effDatePeriod;
    }

    if (formValue.termDate) {
      params.termDate = formValue.termDate;
      params.termDatePeriod = formValue.termDatePeriod;
    }

    this.apply.emit(params);
  }

  clearAll(): void {
    this.filterForm.reset({
      keyDataGrade: null,
      altidMatchType: null,
      finalGrade: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
    });
    this.effDatePeriodRequired = false;
    this.termDatePeriodRequired = false;
  }

  getEffDateError(): string {
    const control = this.filterForm?.get('effDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Effective Date is invalid';
    }
    return '';
  }

  getTermDateError(): string {
    const control = this.filterForm?.get('termDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'Termination Date is invalid';
    }
    return '';
  }

  onEffDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('effDate');
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  onTermDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get('termDate');
    if (!control) return;
    if (!inputValue?.trim()) {
      control.setValue(null, { emitEvent: false });
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  closePanel(): void {
    this.close.emit();
  }

  get selectedKeyGradeDisplay(): string {
    const val = this.filterForm.get('keyDataGrade')?.value;
    if (!val) return '';
    const found = this.keyGradeOptions.find(o => o.value === val);
    return found ? found.label : val;
  }

  get selectedFinalGradeDisplay(): string {
    const val = this.filterForm.get('finalGrade')?.value;
    if (!val) return '';
    const found = this.finalGradeOptions.find(o => o.value === val);
    return found ? found.label : val;
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private setupSearchSubscriptions(): void {
    this.keyGradeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.keyGradeSearch.set(v || ''));
    this.finalGradeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.finalGradeSearch.set(v || ''));
  }

  private filterDropdownItems(items: DropdownOption[], search: string): DropdownOption[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item => {
      const label = (item.label || '').toLowerCase();
      const value = (item.value || '').toLowerCase();
      return label.includes(lower) || value.includes(lower);
    });
  }
}
