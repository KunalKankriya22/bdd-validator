import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from '@core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  InterdictionPlacementFilterState,
  ProductCodeLookup,
  ActionCodeLookup,
} from '../configure-interdiction-placement.model';

@Component({
  selector: 'app-interdiction-placement-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './interdiction-placement-filter.component.html',
  styleUrl: './interdiction-placement-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterdictionPlacementFilterComponent implements OnInit, OnDestroy {
  @Input() currentFilters: InterdictionPlacementFilterState | null = null;
  @Input() otherProductCodes: ProductCodeLookup[] = [];
  @Input() actionCodes: ActionCodeLookup[] = [];
  readonly optionsLoading = signal(false);
  @Output() apply = new EventEmitter<InterdictionPlacementFilterState>();
  @Output() close = new EventEmitter<void>();

  readonly currentProductOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' },
  ];

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Search controls for searchable dropdowns
  otherProductSearchCtrl = new FormControl('');
  rejectCodeSearchCtrl = new FormControl('');

  private otherProductSearch = signal('');
  private rejectCodeSearch = signal('');

  readonly filteredOtherProducts = computed(() => {
    const search = this.otherProductSearch().toLowerCase();
    if (!search) return this.otherProductCodes;
    return this.otherProductCodes.filter(o => o.productCode.toLowerCase().includes(search) || o.productDesc.toLowerCase().includes(search));
  });

  readonly filteredRejectCodes = computed(() => {
    const search = this.rejectCodeSearch().toLowerCase();
    if (!search) return this.actionCodes;
    return this.actionCodes.filter(o => o.code.toLowerCase().includes(search) || o.codeDesc.toLowerCase().includes(search));
  });

  // Date validation state
  effectivePeriodRequired = false;
  terminationPeriodRequired = false;
  private effectiveDateRawInput = '';
  private terminationDateRawInput = '';

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

  filterForm!: FormGroup;
  private appliedFilterSnapshot: string = '';

  ngOnInit(): void {
    const filters = this.currentFilters;
    this.filterForm = this.fb.group({
      currentProduct: [filters?.currentProduct || ''],
      otherProduct: [filters?.otherProduct || ''],
      rejectCode: [filters?.rejectCode || ''],
      effectivePeriod: [filters?.effectivePeriod || null],
      effectiveDate: [filters?.effectiveDate ? moment(filters.effectiveDate) : null, [dateFormatValidator()]],
      terminationPeriod: [filters?.terminationPeriod || null],
      terminationDate: [filters?.terminationDate ? moment(filters.terminationDate) : null, [dateFormatValidator()]],
    });

    this.appliedFilterSnapshot = this.serializeFormValue();
    this.setupSearchSubscriptions();
    this.setupDateValidation();
  }

  private serializeFormValue(): string {
    const v = this.filterForm.value;
    return JSON.stringify({
      currentProduct: v.currentProduct || '',
      otherProduct: v.otherProduct || '',
      rejectCode: v.rejectCode || '',
      effectivePeriod: v.effectivePeriod || null,
      effectiveDate: v.effectiveDate ? v.effectiveDate.format('YYYY-MM-DD') : null,
      terminationPeriod: v.terminationPeriod || null,
      terminationDate: v.terminationDate ? v.terminationDate.format('YYYY-MM-DD') : null,
    });
  }

  get hasChanges(): boolean {
    return this.serializeFormValue() !== this.appliedFilterSnapshot;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscriptions(): void {
    this.otherProductSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.otherProductSearch.set(v || ''));
    this.rejectCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.rejectCodeSearch.set(v || ''));
  }

  private setupDateValidation(): void {
    this.filterForm.get('effectiveDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const dateControl = this.filterForm.get('effectiveDate');
      const hasValidDate = dateControl?.value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');
      if (hasValidDate) this.filterForm.get('effectivePeriod')?.markAsTouched();
      setTimeout(() => this.validateEffectivePeriod(), 0);
    });

    this.filterForm.get('effectivePeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateEffectivePeriod();
    });

    this.filterForm.get('terminationDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const dateControl = this.filterForm.get('terminationDate');
      const hasValidDate = dateControl?.value && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');
      if (hasValidDate) this.filterForm.get('terminationPeriod')?.markAsTouched();
      setTimeout(() => this.validateTerminationPeriod(), 0);
    });

    this.filterForm.get('terminationPeriod')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateTerminationPeriod();
    });

    this.validateEffectivePeriod();
    this.validateTerminationPeriod();
  }

  private validateEffectivePeriod(): void {
    const dateControl = this.filterForm.get('effectiveDate');
    const effectiveDate = dateControl?.value;
    const effectivePeriod = this.filterForm.get('effectivePeriod')?.value;
    const hasValidDate = effectiveDate && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');
    this.effectivePeriodRequired = !!(hasValidDate && !effectivePeriod);
  }

  private validateTerminationPeriod(): void {
    const dateControl = this.filterForm.get('terminationDate');
    const terminationDate = dateControl?.value;
    const terminationPeriod = this.filterForm.get('terminationPeriod')?.value;
    const hasValidDate = terminationDate && !dateControl?.hasError('invalidDateFormat') && !dateControl?.hasError('matDatepickerParse');
    this.terminationPeriodRequired = !!(hasValidDate && !terminationPeriod);
  }

  // Date input/blur handlers
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.effectiveDateRawInput = input.value;
    const control = this.filterForm.get('effectiveDate');
    if (control && !control.touched) control.markAsTouched();
  }

  onEffectiveDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('effectiveDate');
      if (!control?.value && this.effectiveDateRawInput && !input.value) {
        input.value = this.effectiveDateRawInput;
      }
    }, 0);
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminationDateRawInput = input.value;
    const control = this.filterForm.get('terminationDate');
    if (control && !control.touched) control.markAsTouched();
  }

  onTerminationDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.filterForm.get('terminationDate');
      if (!control?.value && this.terminationDateRawInput && !input.value) {
        input.value = this.terminationDateRawInput;
      }
    }, 0);
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getEffectiveDateError(): string {
    const control = this.filterForm?.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('invalidDateFormat')) return 'Effective Date is invalid';
    if (!control.value && this.getNativeInputText(this.effDateNativeInput)) return 'Effective Date is invalid';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterForm?.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Termination Date is invalid';
    if (control.hasError('invalidDateFormat')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination Date is invalid';
    return '';
  }

  get isClearAllDisabled(): boolean {
    const v = this.filterForm.value;
    return !(v.currentProduct || v.otherProduct || v.rejectCode ||
             v.effectiveDate || v.terminationDate ||
             v.effectivePeriod || v.terminationPeriod);
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid) return true;
    if (this.getEffectiveDateError() || this.getTerminationDateError()) return true;
    if (this.effectivePeriodRequired || this.terminationPeriodRequired) return true;
    return !this.hasChanges;
  }

  protected onApply(): void {
    this.validateEffectivePeriod();
    this.validateTerminationPeriod();
    if (this.effectivePeriodRequired || this.terminationPeriodRequired || this.filterForm.invalid) return;

    const v = this.filterForm.value;
    const filters: InterdictionPlacementFilterState = {};

    if (v.currentProduct) filters.currentProduct = v.currentProduct;
    if (v.otherProduct) filters.otherProduct = v.otherProduct;
    if (v.rejectCode) filters.rejectCode = v.rejectCode;
    if (v.effectivePeriod) filters.effectivePeriod = v.effectivePeriod;
    if (v.effectiveDate) filters.effectiveDate = DateFieldValidationUtility.serializeDateForApi(v.effectiveDate) || undefined;
    if (v.terminationPeriod) filters.terminationPeriod = v.terminationPeriod;
    if (v.terminationDate) filters.terminationDate = DateFieldValidationUtility.serializeDateForApi(v.terminationDate) || undefined;

    this.otherProductSearchCtrl.setValue('', { emitEvent: false });
    this.rejectCodeSearchCtrl.setValue('', { emitEvent: false });
    this.appliedFilterSnapshot = this.serializeFormValue();
    this.apply.emit(filters);
  }

  protected onClearAll(): void {
    this.filterForm.reset({
      currentProduct: '',
      otherProduct: '',
      rejectCode: '',
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null,
    });
    this.effectiveDateRawInput = '';
    this.terminationDateRawInput = '';
    this.effectivePeriodRequired = false;
    this.terminationPeriodRequired = false;
    this.otherProductSearchCtrl.setValue('', { emitEvent: false });
    this.rejectCodeSearchCtrl.setValue('', { emitEvent: false });
  }

  protected onClose(): void {
    this.close.emit();
  }
}
