/**
 * Add/Edit Panel Component for Equipment/Product cGMP Matrix
 * JIRA: MLT-12865
 * Pattern: Follows add-edit-attribute-equipment-panel
 */

import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, startWith } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { TIMEZONE_OFFSET_MAP, TIMEZONE_OFFSET_REGEX } from '@core/constants/timezone.constants';
import { MatrixPheresisService } from '../../services/matrix-pheresis.service';
import {
  EquipmentProductCgmpMatrix,
  CreateEquipmentCgmpMatrixDto,
  UpdateEquipmentCgmpMatrixDto,
  EquipmentTypeDropdownCgmp,
  ParameterCodeDropdownCgmp,
  ProcedureDropdown,
  ProductTypeDropdown
} from '../../models/matrix-pheresis.model';

@Component({
  selector: 'app-add-edit-equipment-cgmp-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './add-edit-equipment-cgmp-panel.html',
  styleUrls: ['./add-edit-equipment-cgmp-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class AddEditEquipmentCgmpPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: EquipmentProductCgmpMatrix | null = null;
  @Input() equipmentTypes: EquipmentTypeDropdownCgmp[] = [];
  @Input() procedures: ProcedureDropdown[] = [];
  @Input() productTypes: ProductTypeDropdown[] = [];
  @Input() parameterCodes: ParameterCodeDropdownCgmp[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() recordAdded = new EventEmitter<void>();

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MatrixPheresisService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  isSaving = signal<boolean>(false);

  // Search controls for dropdowns
  equipTypeSearchControl = new FormControl('');
  procSearchControl = new FormControl('');
  productCodeSearchControl = new FormControl('');
  parmCodeSearchControl = new FormControl('');

  // Filtered lists
  filteredEquipmentTypes = signal<EquipmentTypeDropdownCgmp[]>([]);
  filteredProcedures = signal<ProcedureDropdown[]>([]);
  filteredProductTypes = signal<ProductTypeDropdown[]>([]);
  filteredParameterCodes = signal<ParameterCodeDropdownCgmp[]>([]);

  // Selected descriptions
  selectedEquipTypeDescription = signal<string>('');
  selectedProcDescription = signal<string>('');
  selectedProductCodeDescription = signal<string>('');
  selectedParmCodeDescription = signal<string>('');

  // Date validation
  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  minMaxErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getMinMaxError()
  );

  lastModifiedDate = signal<string>('');

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  constructor() {
    this.minDate = this.getChapterMinDate();
    this.terminationMinDate = this.minDate;

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.updateTerminationMinDate();
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupDateValidationListeners();
    this.setupSearchFilters();
    this.setupFormBasedOnMode();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.setupFormBasedOnMode();
    }
    if (changes['data'] && !changes['data'].firstChange) {
      this.setupFormBasedOnMode();
    }
    if (changes['equipmentTypes'] && !changes['equipmentTypes'].firstChange) {
      this.filteredEquipmentTypes.set(this.equipmentTypes);
    }
    if (changes['procedures'] && !changes['procedures'].firstChange) {
      this.filteredProcedures.set(this.procedures);
    }
    if (changes['productTypes'] && !changes['productTypes'].firstChange) {
      this.filteredProductTypes.set(this.productTypes);
    }
    if (changes['parameterCodes'] && !changes['parameterCodes'].firstChange) {
      this.filteredParameterCodes.set(this.parameterCodes);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      equipType: ['', Validators.required],
      proc: ['', Validators.required],
      productCode: ['', Validators.required],
      parmCode: ['', Validators.required],
      acceptMin: [null],
      acceptMax: [null],
      effDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      termDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate'),
        this.minMaxValidator()
      ]
    });
  }

  private minMaxValidator() {
    return (form: FormGroup) => {
      const min = form.get('acceptMin')?.value;
      const max = form.get('acceptMax')?.value;
      if (min !== null && min !== '' && max !== null && max !== '' && Number(min) > Number(max)) {
        return { minMaxInvalid: true };
      }
      return null;
    };
  }

  private setupSearchFilters(): void {
    this.equipTypeSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(search => {
        const s = (search || '').toLowerCase();
        this.filteredEquipmentTypes.set(!s ? this.equipmentTypes :
          this.equipmentTypes.filter(e => e.code.toLowerCase().includes(s) || e.codeDesc.toLowerCase().includes(s)));
      });

    this.procSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(search => {
        const s = (search || '').toLowerCase();
        this.filteredProcedures.set(!s ? this.procedures :
          this.procedures.filter(p => p.code.toLowerCase().includes(s) || p.codeDesc.toLowerCase().includes(s)));
      });

    this.productCodeSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(search => {
        const s = (search || '').toLowerCase();
        this.filteredProductTypes.set(!s ? this.productTypes :
          this.productTypes.filter(p => p.productCode.toLowerCase().includes(s) || p.productDesc.toLowerCase().includes(s)));
      });

    this.parmCodeSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(search => {
        const s = (search || '').toLowerCase();
        this.filteredParameterCodes.set(!s ? this.parameterCodes :
          this.parameterCodes.filter(p => p.code.toLowerCase().includes(s) || p.codeDesc.toLowerCase().includes(s)));
      });
  }

  private setupFormBasedOnMode(): void {
    if (this.mode === 'add') {
      this.setupAddMode();
    } else {
      this.setupEditMode();
    }
  }

  private setupAddMode(): void {
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    this.form.reset();
    this.selectedEquipTypeDescription.set('');
    this.selectedProcDescription.set('');
    this.selectedProductCodeDescription.set('');
    this.selectedParmCodeDescription.set('');
    this.filteredEquipmentTypes.set(this.equipmentTypes);
    this.filteredProcedures.set(this.procedures);
    this.filteredProductTypes.set(this.productTypes);
    this.filteredParameterCodes.set(this.parameterCodes);
  }

  private setupEditMode(): void {
    DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
    this.filteredEquipmentTypes.set(this.equipmentTypes);
    this.filteredProcedures.set(this.procedures);
    this.filteredProductTypes.set(this.productTypes);
    this.filteredParameterCodes.set(this.parameterCodes);

    this.lastModifiedDate.set('');

    if (this.data) {
      if (this.data.lastModifyDate) {
        this.lastModifiedDate.set(this.formatDateWithTime(this.data.lastModifyDate));
      }

      this.form.patchValue({
        equipType: this.data.equipType,
        proc: this.data.proc,
        productCode: this.data.productCode,
        parmCode: this.data.parmCode,
        acceptMin: this.data.acceptMin,
        acceptMax: this.data.acceptMax,
        effDate: this.data.effDate ? moment(this.data.effDate) : null,
        termDate: this.data.termDate ? moment(this.data.termDate) : null
      });

      // Disable composite PK fields + effDate
      this.form.get('equipType')?.disable();
      this.form.get('proc')?.disable();
      this.form.get('productCode')?.disable();
      this.form.get('parmCode')?.disable();
      this.form.get('effDate')?.disable();

      // Set descriptions
      const equip = this.equipmentTypes.find(e => e.code === this.data!.equipType);
      this.selectedEquipTypeDescription.set(equip?.codeDesc || '');
      const proc = this.procedures.find(p => p.code === this.data!.proc);
      this.selectedProcDescription.set(proc?.codeDesc || '');
      const prod = this.productTypes.find(p => p.productCode === this.data!.productCode);
      this.selectedProductCodeDescription.set(prod?.productDesc || '');
      const parm = this.parameterCodes.find(p => p.code === this.data!.parmCode);
      this.selectedParmCodeDescription.set(parm?.codeDesc || '');

      if (this.data.effDate) {
        const effMoment = moment(this.data.effDate);
        this.terminationMinDate = effMoment.isAfter(this.minDate) ? effMoment : this.minDate.clone();
      }
    }
  }

  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.form?.get('effDate')?.value;
    let effectiveMoment: Moment | null = null;

    if (effectiveValue && moment.isMoment(effectiveValue) && effectiveValue.isValid()) {
      effectiveMoment = effectiveValue.clone();
    } else if (effectiveValue instanceof Date && !isNaN(effectiveValue.getTime())) {
      effectiveMoment = moment(effectiveValue);
    }

    if (effectiveMoment) {
      this.terminationMinDate = effectiveMoment.isAfter(this.minDate) ? effectiveMoment : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate;
    }
  }

  private setupDateValidationListeners(): void {
    this.form.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());

    this.form.get('effDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.updateTerminationMinDate();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  updateEquipTypeDescription(): void {
    const val = this.form.get('equipType')?.value;
    const selected = val ? this.equipmentTypes.find(e => e.code === val) : null;
    this.selectedEquipTypeDescription.set(selected?.codeDesc || '');
  }

  updateProcDescription(): void {
    const val = this.form.get('proc')?.value;
    const selected = val ? this.procedures.find(p => p.code === val) : null;
    this.selectedProcDescription.set(selected?.codeDesc || '');
  }

  updateProductCodeDescription(): void {
    const val = this.form.get('productCode')?.value;
    const selected = val ? this.productTypes.find(p => p.productCode === val) : null;
    this.selectedProductCodeDescription.set(selected?.productDesc || '');
  }

  updateParmCodeDescription(): void {
    const val = this.form.get('parmCode')?.value;
    const selected = val ? this.parameterCodes.find(p => p.code === val) : null;
    this.selectedParmCodeDescription.set(selected?.codeDesc || '');
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effDate')
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effDate')?.markAsTouched();
    this.form.get('effDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('termDate'),
      this.mode === 'edit'
    );
  }

  onTerminationDateChange(): void {
    this.form.get('termDate')?.markAsTouched();
    this.form.get('termDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  getMinMaxError(): string {
    if (this.form.errors?.['minMaxInvalid']) {
      return 'Minimum value cannot be greater than maximum value';
    }
    return '';
  }

  onMinMaxBlur(): void {
    this.form.get('acceptMin')?.markAsTouched();
    this.form.get('acceptMax')?.markAsTouched();
    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) return;

    if (this.mode === 'add') {
      this.createRecord();
    } else {
      this.updateRecord();
    }
  }

  onSubmitAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) return;

    this.createRecord(true);
  }

  private createRecord(createAnother = false): void {
    this.isSaving.set(true);
    const formValue = this.form.getRawValue();

    const payload: CreateEquipmentCgmpMatrixDto = {
      equipType: formValue.equipType,
      proc: formValue.proc,
      productCode: formValue.productCode,
      parmCode: formValue.parmCode,
      acceptMin: formValue.acceptMin != null && formValue.acceptMin !== '' ? Number(formValue.acceptMin) : undefined,
      acceptMax: formValue.acceptMax != null && formValue.acceptMax !== '' ? Number(formValue.acceptMax) : undefined,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate)!,
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined : undefined
    };

    this.service.createEquipmentCgmpMatrix(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.handleSuccess('Matrix record created successfully');
          if (createAnother) {
            this.form.reset();
            this.selectedEquipTypeDescription.set('');
            this.selectedProcDescription.set('');
            this.selectedProductCodeDescription.set('');
            this.selectedParmCodeDescription.set('');
            this.lastChangedDateField = null;
            this.recordAdded.emit();
          } else {
            this.saveSuccess.emit();
          }
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
  }

  private updateRecord(): void {
    if (!this.data) return;
    this.isSaving.set(true);
    const formValue = this.form.getRawValue();

    const payload: UpdateEquipmentCgmpMatrixDto = {
      acceptMin: formValue.acceptMin != null && formValue.acceptMin !== '' ? Number(formValue.acceptMin) : undefined,
      acceptMax: formValue.acceptMax != null && formValue.acceptMax !== '' ? Number(formValue.acceptMax) : undefined,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate)!,
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined : undefined
    };

    this.service.updateEquipmentCgmpMatrix(
      this.data.equipType, this.data.proc, this.data.productCode, this.data.parmCode, payload
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.handleSuccess('Matrix record updated successfully');
          this.saveSuccess.emit();
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  formatDateWithTime(dateString?: string): string {
    if (!dateString) return '--';
    let isoString = dateString;
    if (!isoString.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(isoString)) {
      isoString += this.chapterOffset || '+00:00';
    }
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return dateString;

    const timeZone = this.chapterOffset || '+00:00';
    if (!TIMEZONE_OFFSET_REGEX.test(timeZone)) return dateString;

    const match = timeZone.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) return dateString;

    const sign = match[1] === '+' ? 1 : -1;
    const hh = parseInt(match[2], 10);
    const mm = parseInt(match[3], 10);
    const local = new Date(date.getTime() + sign * (hh * 60 + mm) * 60000);

    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const day = String(local.getUTCDate()).padStart(2, '0');
    const month = MONTHS[local.getUTCMonth()];
    const year = local.getUTCFullYear();
    const hour = String(local.getUTCHours()).padStart(2, '0');
    const minute = String(local.getUTCMinutes()).padStart(2, '0');
    const displayLabel = TIMEZONE_OFFSET_MAP[timeZone]?.abbr ?? `GMT${timeZone}`;

    return `${day}-${month}-${year}, ${hour}:${minute} ${displayLabel}`;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatDateForDisplay(value: any): string {
    if (!value) return '-';
    if (moment.isMoment(value)) return value.isValid() ? value.format('DD-MMM-YYYY') : '-';
    if (value instanceof Date) return this.formatDate(value.toISOString());
    if (typeof value === 'string') return this.formatDate(value);
    return '-';
  }

  private handleSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

}
