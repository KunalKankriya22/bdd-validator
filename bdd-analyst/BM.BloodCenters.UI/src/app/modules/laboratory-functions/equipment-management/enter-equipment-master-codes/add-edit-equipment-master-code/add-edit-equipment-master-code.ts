import { Component, EventEmitter, Input, OnChanges, OnInit, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '../../../../../shared/date/date-formats';
import { ChapterAwareDateAdapter } from '../../../../../shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { EquipmentMasterCodeService } from '../services/equipment-master-code.service';
import {
  CreateEquipmentMasterCodeRequest,
  UpdateEquipmentMasterCodeRequest,
} from '../models/equipment-master-code.model';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HttpErrorResponse } from '@angular/common/http';

export interface EquipmentMasterCodeDialogData {
  mode: 'add' | 'edit';
  codeType?: string;
  code?: string;
  description?: string;
  effectiveDate?: string | null;
  terminationDate?: string | null;
  userGroup?: string | null;
  modifiedBy?: string | null;
  modificationDate?: string | null;
}

export interface EquipmentMasterCodeResult {
  code: string;
  description: string;
  effectiveDate: string;
  terminationDate: string | null;
  userGroup: string | null;
}

export interface UserGroupOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-add-edit-equipment-master-code',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './add-edit-equipment-master-code.html',
  styleUrls: ['./add-edit-equipment-master-code.scss'],
})
export class AddEditEquipmentMasterCodeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: EquipmentMasterCodeDialogData | null = null;
  @Input() userGroupOptions: UserGroupOption[] = [];

  filteredUserGroupOptions: UserGroupOption[] = [];
  userGroupSearchCtrl = new FormControl('');

  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<EquipmentMasterCodeResult>();
  @Output() saveAndAddAnotherSuccess = new EventEmitter<EquipmentMasterCodeResult>();

  form!: FormGroup;
  minDate!: moment.Moment;
  isSaving = false;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError(),
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError(),
  );

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private equipmentMasterCodeService: EquipmentMasterCodeService,
  ) {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add New Master Code' : 'Edit Record';
  }

  get lastModifiedDisplay(): string {
    if (this.mode === 'edit' && this.data?.modificationDate) {
      return `Last Modified: ${this.data.modificationDate}`;
    }
    return `Last Modified: Today`;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.filteredUserGroupOptions = [...this.userGroupOptions];
    this.userGroupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const search = (term ?? '').toLowerCase();
        this.filteredUserGroupOptions = this.userGroupOptions.filter(o =>
          o.value.toLowerCase().includes(search) || o.label.toLowerCase().includes(search),
        );
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userGroupOptions']) {
      this.filteredUserGroupOptions = [...this.userGroupOptions];
      this.userGroupSearchCtrl.setValue('', { emitEvent: false });
    }
    if ((changes['mode'] || changes['data']) && !changes['mode']?.firstChange) {
      this.initializeForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.lastChangedDateField = null;
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

    this.form = this.fb.group(
      {
        code: [
          '',
          this.mode === 'add'
            ? [Validators.required, requiredTrimmedValidator(), trimmedMaxLengthValidator(5)]
            : [],
        ],
        description: ['', [Validators.required, requiredTrimmedValidator(), trimmedMaxLengthValidator(50)]],
        effectiveDate: [null, [Validators.required]],
        terminationDate: [null],
        userGroup: [null, [Validators.required]],
      },
      {
        validators: [
          DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        ],
      },
    );

    if (this.mode === 'edit' && this.data) {
      this.form.patchValue({
        code: this.data.code || '',
        description: this.data.description || '',
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate, 'DD-MMM-YYYY') : null,
        terminationDate: this.data.terminationDate
          ? moment(this.data.terminationDate, 'DD-MMM-YYYY')
          : null,
        userGroup: this.data.userGroup || null,
      });
      this.form.get('code')?.disable();
      this.form.markAsPristine();
      this.form.markAsUntouched();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  resetForm(): void {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.lastChangedDateField = null;
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onClearAll(): void {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.lastChangedDateField = null;
    if (this.mode === 'edit') {
      if (this.data?.effectiveDate) {
        this.form.get('effectiveDate')?.setValue(
          moment(this.data.effectiveDate, 'DD-MMM-YYYY'),
          { emitEvent: false },
        );
      }
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.headerService.chapterTimeZone());
    }
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) return;
    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    this.isSaving = true;

    if (this.mode === 'add') {
      const request = this.buildCreateRequest();
      this.equipmentMasterCodeService
        .create(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.saveSuccess.emit(this.buildResult());
          },
          error: (err: HttpErrorResponse) => {
            this.isSaving = false;
            const msg = err.error?.message || 'Failed to save. Please try again.';
            this.snackbarService.showError(msg);
          },
        });
    } else {
      const codeType = this.data?.codeType || '';
      const code = this.data?.code || '';
      const request = this.buildUpdateRequest();
      this.equipmentMasterCodeService
        .update(codeType, code, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.saveSuccess.emit(this.buildResult());
          },
          error: (err: HttpErrorResponse) => {
            this.isSaving = false;
            const msg = err.error?.message || 'Failed to save. Please try again.';
            this.snackbarService.showError(msg);
          },
        });
    }
  }

  onSaveAndAddAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) return;
    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    this.isSaving = true;
    const request = this.buildCreateRequest();

    this.equipmentMasterCodeService
      .create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.saveAndAddAnotherSuccess.emit(this.buildResult());
          this.resetForm();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving = false;
          const msg = err.error?.message || 'Failed to save. Please try again.';
          this.snackbarService.showError(msg);
        },
      });
  }

  private buildCreateRequest(): CreateEquipmentMasterCodeRequest {
    const raw = this.form.getRawValue();
    return {
      codeType: this.data?.codeType || '',
      code: (raw.code as string).trim(),
      codeDesc: (raw.description as string).trim(),
      effDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate),
      termDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate),
      restrictEdit: raw.userGroup || null,
    };
  }

  private buildUpdateRequest(): UpdateEquipmentMasterCodeRequest {
    const raw = this.form.getRawValue();
    return {
      codeDesc: (raw.description as string).trim(),
      effDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate),
      termDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate),
      restrictEdit: raw.userGroup || null,
    };
  }

  private buildResult(): EquipmentMasterCodeResult {
    const raw = this.form.getRawValue();
    return {
      code: raw.code || '',
      description: raw.description,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate),
      userGroup: raw.userGroup || null,
    };
  }

  isFormValid(): boolean {
    if (this.mode === 'edit' && !this.form.dirty) return false;
    return this.form.valid && !this.hasDateValidationError();
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  getEffectiveDateMin(): moment.Moment | null {
    return this.mode === 'add' ? this.minDate : null;
  }

  getTerminationDateMin(): moment.Moment | null {
    return this.form.get('effectiveDate')?.value || this.minDate;
  }

  getCodeError(): string {
    const ctrl = this.form.get('code');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required') || ctrl.hasError('whitespaceOnly')) return 'Code is required';
    if (ctrl.hasError('trimmedMaxLength')) return 'Code cannot exceed 5 characters';
    return '';
  }

  getDescriptionError(): string {
    const ctrl = this.form.get('description');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required') || ctrl.hasError('whitespaceOnly')) return 'Description is required';
    if (ctrl.hasError('trimmedMaxLength')) return 'Description cannot exceed 50 characters';
    return '';
  }

  getUserGroupError(): string {
    const ctrl = this.form.get('userGroup');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required')) return 'User Group is required';
    return '';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      formErrors,
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      formErrors,
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effectiveDate'),
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('terminationDate'),
      this.mode === 'edit',
    );
  }

  get descriptionRemainingChars(): number {
    return 50 - (this.form.get('description')?.value?.length || 0);
  }
}
