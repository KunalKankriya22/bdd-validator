import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal,
  computed,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import {
  TparmFilterState,
  DateFilterOperator,
  DatatypeLookup,
  VoidCodeLookup,
  RelatedCodeLookup
} from '../../models/tparm.model';
import { TparmApiService } from '../../services/tparm-api.service';

export interface PeriodFilterOption {
  value: string;
  label: string;
}

export const PERIOD_FILTER_OPTIONS: PeriodFilterOption[] = [
  { value: DateFilterOperator.AFTER, label: 'After' },
  { value: DateFilterOperator.BEFORE, label: 'Before' }
];

@Component({
  selector: 'app-tparm-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './tparm-filter-panel.html',
  styleUrls: ['./tparm-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TparmFilterPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(TparmApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: TparmFilterState | null = null;
  @Output() apply = new EventEmitter<TparmFilterState>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  // Lookup data signals
  protected readonly datatypes = signal<DatatypeLookup[]>([]);
  protected readonly voidCodes = signal<VoidCodeLookup[]>([]);
  protected readonly relatedCodes = signal<RelatedCodeLookup[]>([]);
  protected readonly loadingDatatypes = signal<boolean>(false);
  protected readonly loadingVoidCodes = signal<boolean>(false);
  protected readonly loadingRelatedCodes = signal<boolean>(false);

  // Search controls for ngx-mat-select-search
  readonly datatypeSearchControl = new FormControl('');
  readonly relatedCodeSearchControl = new FormControl('');
  readonly voidCodeSearchControl = new FormControl('');

  // Search text signals
  private readonly datatypeSearch = signal('');
  private readonly relatedCodeSearch = signal('');
  private readonly voidCodeSearch = signal('');

  // Computed filtered options
  readonly filteredDatatypes = computed(() => {
    const search = this.datatypeSearch().toLowerCase();
    const options = this.datatypes();
    if (!search) return options;
    return options.filter(o => o.typeCode.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search));
  });

  readonly filteredRelatedCodes = computed(() => {
    const search = this.relatedCodeSearch().toLowerCase();
    const options = this.relatedCodes();
    if (!search) return options;
    return options.filter(o => o.code.toLowerCase().includes(search) ||
      o.codeDesc.toLowerCase().includes(search));
  });

  readonly filteredVoidCodes = computed(() => {
    const search = this.voidCodeSearch().toLowerCase();
    const options = this.voidCodes();
    if (!search) return options;
    return options.filter(o => o.code.toLowerCase().includes(search) ||
      o.codeDesc.toLowerCase().includes(search));
  });

  filterForm!: FormGroup;
  periodOptions: PeriodFilterOption[] = PERIOD_FILTER_OPTIONS;

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

  ngOnInit(): void {
    this.initializeForm();
    this.loadLookups();
    this.setupValueChangeListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const effDateValue = this.currentFilters?.effDateValue
      ? moment(this.currentFilters.effDateValue)
      : null;
    const termDateValue = this.currentFilters?.termDateValue
      ? moment(this.currentFilters.termDateValue)
      : null;

    this.filterForm = this.fb.group({
      datatype: [this.currentFilters?.datatype || null],
      relatedCode: [this.currentFilters?.relatedCode || null],
      voidCode: [this.currentFilters?.voidCode || null],
      effDateOperator: [this.currentFilters?.effDateOperator || null],
      effDateValue: [effDateValue],
      termDateOperator: [this.currentFilters?.termDateOperator || null],
      termDateValue: [termDateValue]
    });

    if (this.currentFilters?.datatype) {
      this.loadRelatedCodes(this.currentFilters.datatype);
    }
  }

  private loadLookups(): void {
    this.loadingDatatypes.set(true);
    this.apiService.getDatatypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.datatypes.set(data); this.loadingDatatypes.set(false); },
        error: () => this.loadingDatatypes.set(false)
      });

    this.loadingVoidCodes.set(true);
    this.apiService.getVoidCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.voidCodes.set(data); this.loadingVoidCodes.set(false); },
        error: () => this.loadingVoidCodes.set(false)
      });
  }

  private setupValueChangeListeners(): void {
    // Datatype changes -> reload related codes
    this.filterForm.get('datatype')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((datatype: string | null) => {
        this.filterForm.patchValue({ relatedCode: null }, { emitEvent: false });
        this.relatedCodes.set([]);
        this.relatedCodeSearchControl.setValue('');
        if (datatype) {
          this.loadRelatedCodes(datatype);
        }
      });

    // Effective Date validations
    this.filterForm.get('effDateValue')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('effDateValue');
        const periodControl = this.filterForm.get('effDateOperator');
        if (control && !control.touched) control.markAsTouched();
        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateEffDatePeriod();
      });

    this.filterForm.get('effDateValue')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('effDateValue');
        const periodControl = this.filterForm.get('effDateOperator');
        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateEffDatePeriod();
      });

    this.filterForm.get('effDateOperator')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateEffDatePeriod());

    // Termination Date validations
    this.filterForm.get('termDateValue')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        const control = this.filterForm.get('termDateValue');
        const periodControl = this.filterForm.get('termDateOperator');
        if (control && !control.touched) control.markAsTouched();
        const hasValidDate = date && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateTermDatePeriod();
      });

    this.filterForm.get('termDateValue')?.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.filterForm.get('termDateValue');
        const periodControl = this.filterForm.get('termDateOperator');
        const hasValidDate = control?.value && !control?.hasError('matDatepickerParse');
        if (hasValidDate && periodControl) periodControl.markAsTouched();
        this.validateTermDatePeriod();
      });

    this.filterForm.get('termDateOperator')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateTermDatePeriod());

    // Search control listeners
    this.datatypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.datatypeSearch.set(value || ''));

    this.relatedCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.relatedCodeSearch.set(value || ''));

    this.voidCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.voidCodeSearch.set(value || ''));
  }

  private validateEffDatePeriod(): void {
    const dateControl = this.filterForm.get('effDateValue');
    const date = dateControl?.value;
    const periodControl = this.filterForm.get('effDateOperator');
    const period = periodControl?.value;

    const hasValidDate = date && !dateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !period) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private validateTermDatePeriod(): void {
    const dateControl = this.filterForm.get('termDateValue');
    const date = dateControl?.value;
    const periodControl = this.filterForm.get('termDateOperator');
    const period = periodControl?.value;

    const hasValidDate = date && !dateControl?.hasError('matDatepickerParse');

    if (hasValidDate && !period) {
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();
    } else {
      periodControl?.setErrors(null);
    }
    this.cdr.markForCheck();
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  private loadRelatedCodes(datatype: string): void {
    this.loadingRelatedCodes.set(true);
    this.apiService.getRelatedCodes(datatype)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.relatedCodes.set(data); this.loadingRelatedCodes.set(false); },
        error: () => this.loadingRelatedCodes.set(false)
      });
  }

  getEffDateError(): string {
    const control = this.filterForm?.get('effDateValue');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effDateNativeInput)) return 'Effective Date is invalid';
    return '';
  }

  getTermDateError(): string {
    const control = this.filterForm?.get('termDateValue');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination Date is invalid';
    return '';
  }

  get isApplyDisabled(): boolean {
    const values = this.filterForm?.value;
    const hasAnyValue = values?.datatype ||
                        values?.relatedCode ||
                        values?.voidCode ||
                        values?.effDateOperator || values?.effDateValue ||
                        values?.termDateOperator || values?.termDateValue;

    if (!hasAnyValue) return true;

    const effDateControl = this.filterForm.get('effDateValue');
    const termDateControl = this.filterForm.get('termDateValue');
    const effPeriodControl = this.filterForm.get('effDateOperator');
    const termPeriodControl = this.filterForm.get('termDateOperator');

    const hasDateErrors = (effDateControl?.invalid ?? false) || (termDateControl?.invalid ?? false);
    const hasPeriodErrors = (effPeriodControl?.invalid ?? false) || (termPeriodControl?.invalid ?? false);

    return hasDateErrors || hasPeriodErrors;
  }

  onApply(): void {
    this.validateEffDatePeriod();
    this.validateTermDatePeriod();

    const effDateControl = this.filterForm.get('effDateValue');
    const termDateControl = this.filterForm.get('termDateValue');
    const effPeriodControl = this.filterForm.get('effDateOperator');
    const termPeriodControl = this.filterForm.get('termDateOperator');

    if (effDateControl?.errors ||
        termDateControl?.errors ||
        effPeriodControl?.errors ||
        termPeriodControl?.errors) {
      effDateControl?.markAsTouched();
      termDateControl?.markAsTouched();
      effPeriodControl?.markAsTouched();
      termPeriodControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const formValue = this.filterForm.value;

    const filters: TparmFilterState = {
      datatype: formValue.datatype || null,
      relatedCode: formValue.relatedCode || null,
      voidCode: formValue.voidCode || null,
      effDateOperator: formValue.effDateValue ? formValue.effDateOperator : null,
      effDateValue: formValue.effDateValue ? formValue.effDateValue.toDate() : null,
      termDateOperator: formValue.termDateValue ? formValue.termDateOperator : null,
      termDateValue: formValue.termDateValue ? formValue.termDateValue.toDate() : null
    };

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.filterForm.get('effDateOperator')?.setErrors(null);
    this.filterForm.get('termDateOperator')?.setErrors(null);
    this.relatedCodes.set([]);

    this.datatypeSearchControl.setValue('');
    this.relatedCodeSearchControl.setValue('');
    this.voidCodeSearchControl.setValue('');

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

  onDatatypeDropdownClosed(): void {
    this.datatypeSearchControl.setValue('');
  }

  onRelatedCodeDropdownClosed(): void {
    this.relatedCodeSearchControl.setValue('');
  }

  onVoidCodeDropdownClosed(): void {
    this.voidCodeSearchControl.setValue('');
  }
}
