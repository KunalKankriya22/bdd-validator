import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import {
  PhysicalEquipmentCreateDto,
  PhysicalEquipmentUpdateDto,
  PhysicalCodeOption,
  EquipmentTypeOption
} from '../../models/drive-equipment-parameters.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

@Component({
  selector: 'app-add-edit-physical-equipment',
  standalone: true,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-physical-equipment.html',
  styleUrls: ['./add-edit-physical-equipment.scss']
})
export class AddEditPhysicalEquipment implements OnInit, OnDestroy {
  @Input() mode!: 'add' | 'edit';
  @Input() data: any;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() refreshData = new EventEmitter<void>();

  form!: FormGroup;

  minDate: moment.Moment;
  minTermDate: moment.Moment;
  chapterToday: moment.Moment;

  editModeValues = {
    effectiveDate: '',
    terminationDate: null as string | null
  };

  private originalValues = {
    physicalCode: '',
    equipmentType: '',
    effectiveDate: '',
    terminationDate: null as string | null,
    auditKey: 0
  };

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  readonly physicalCodeSearchCtrl = new FormControl('');
  readonly equipmentTypeSearchCtrl = new FormControl('');

  private readonly physicalCodeSearch = signal('');
  private readonly equipmentTypeSearch = signal('');

  private isSubmitting = signal<boolean>(false);
  private physicalCodeOptions = signal<PhysicalCodeOption[]>([]);
  private equipmentTypeOptions = signal<EquipmentTypeOption[]>([]);

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  private destroy$ = new Subject<void>();
  private modeSignal = signal<'add' | 'edit'>('add');

  submitting = computed(() => this.isSubmitting());
  title = computed(() => this.modeSignal() === 'add' ? 'Add New Physical Equipment' : 'Edit Physical Equipment');

  get isSaveDisabled(): boolean {
    return this.form.invalid || this.form.pristine || this.submitting();
  }

  filteredPhysicalCodes = computed(() => {
    const search = this.physicalCodeSearch().toLowerCase();
    const items = this.physicalCodeOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });

  filteredEquipmentTypes = computed(() => {
    const search = this.equipmentTypeSearch().toLowerCase();
    const items = this.equipmentTypeOptions();
    if (!search) return items;
    return items.filter(t => t.code?.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));
  });

  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  private getChapterMinDate(): moment.Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  constructor(
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private driveEquipmentService: DriveEquipmentParametersService
  ) {
    this.minDate = this.getChapterMinDate();
    this.minTermDate = this.getChapterMinDate();
    this.chapterToday = this.getChapterMinDate();

    effect(() => {
      this.minDate = this.getChapterMinDate();
      this.chapterToday = this.getChapterMinDate();
    });
  }

  ngOnInit(): void {
    if (!this.mode) {
      this.mode = this.data?.mode || 'add';
    }
    this.modeSignal.set(this.mode);
    const record = this.data?.record || {};

    if (this.mode === 'edit' && record) {
      this.originalValues = {
        physicalCode: record.physicalCode || '',
        equipmentType: record.equipmentType || '',
        effectiveDate: record.effectiveDate || '',
        terminationDate: record.terminationDate || null,
        auditKey: record.auditKey || 0
      };

      this.editModeValues.terminationDate = record.terminationDate
        ? moment(record.terminationDate).format('YYYY-MM-DD')
        : null;

      if (record.effectiveDate) {
        const eff = moment(record.effectiveDate);
        if (record.terminationDate) {
          const existingTermDate = moment(record.terminationDate);
          this.minTermDate = existingTermDate.isBefore(eff) ? existingTermDate : eff;
        } else {
          this.minTermDate = eff;
        }
      }
    }

    this.form = this.fb.group({
      physicalCode: [
        { value: record.physicalCode || '', disabled: this.mode === 'edit' },
        [Validators.required]
      ],
      physicalCodeDescription: [
        { value: record.physicalCodeDescription || '', disabled: true }
      ],
      equipmentType: [
        record.equipmentType || '',
        [Validators.required]
      ],
      equipmentTypeDescription: [
        { value: record.equipmentTypeDescription || '', disabled: true }
      ],
      effectiveDate: [
        record.effectiveDate ? moment(record.effectiveDate) : null
      ],
      terminationDate: [
        record.terminationDate ? moment(record.terminationDate) : null
      ]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });

    if (this.mode === 'edit') {
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

      const termControl = this.form.get('terminationDate');
      if (termControl) {
        termControl.addValidators(
          DateFieldValidationUtility.editModeTerminationDateValidator(
            this.editModeValues.terminationDate,
            this.chapterOffset
          )
        );
        termControl.updateValueAndValidity({ emitEvent: false });
      }

      this.editModeValues.effectiveDate = DateFieldValidationUtility.formatDateForUI(record.effectiveDate)?.toUpperCase() || '';
      this.chapterToday = this.getChapterMinDate();
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }

    this.loadDropdownOptions();
    this.setupSearchSubscriptions();
    this.setupDateFieldTracking();

    this.form.get('physicalCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(code => {
      const selected = this.physicalCodeOptions().find(c => c.code === code);
      this.form.patchValue({ physicalCodeDescription: selected?.description || '' });
    });

    this.form.get('equipmentType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(type => {
      const selected = this.equipmentTypeOptions().find(t => t.code === type);
      this.form.patchValue({ equipmentTypeDescription: selected?.description || '' });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDateFieldTracking(): void {
    this.form.get('effectiveDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => { this.lastChangedDateField = 'effective'; }, 0);
    });
    this.form.get('terminationDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => { this.lastChangedDateField = 'termination'; }, 0);
    });
  }

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const chapterToday = DateFieldValidationUtility.getMinDate(this.chapterOffset).startOf('day');

    if (this.mode === 'edit' && this.editModeValues.terminationDate) {
      const originalTermDate = moment(this.editModeValues.terminationDate).startOf('day');
      if (checkDate.isSame(originalTermDate)) return true;
    }

    if (checkDate.isBefore(chapterToday)) return false;

    const effectiveDate = this.form?.getRawValue().effectiveDate;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }

    return true;
  };

  private setupSearchSubscriptions(): void {
    this.physicalCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.physicalCodeSearch.set(v || ''));
    this.equipmentTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.equipmentTypeSearch.set(v || ''));
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) searchCtrl.setValue('');
  }

  loadDropdownOptions(): void {
    this.driveEquipmentService.getPhysicalCodes().subscribe({
      next: (codes) => {
        this.physicalCodeOptions.set(codes);
        if (this.mode === 'edit') {
          const record = this.data?.record || {};
          if (record.physicalCode) {
            const selected = codes.find(c => c.code === record.physicalCode);
            if (selected) {
              this.form.patchValue({ physicalCodeDescription: selected.description || '' });
            }
          }
        }
      },
      error: () => {}
    });

    this.driveEquipmentService.getEquipmentTypesForPhysical().subscribe({
      next: (types) => {
        this.equipmentTypeOptions.set(types);
        if (this.mode === 'edit') {
          const record = this.data?.record || {};
          if (record.equipmentType) {
            const selected = types.find(t => t.code === record.equipmentType);
            if (selected) {
              this.form.patchValue({ equipmentTypeDescription: selected.description || '' });
            }
          }
        }
      },
      error: () => {}
    });
  }

  getTerminationDateMin(): moment.Moment | null {
    const effValue = this.form.get('effectiveDate')?.value;
    if (effValue && moment.isMoment(effValue) && effValue.isValid()) {
      return effValue.isAfter(this.minDate) ? effValue : this.minDate;
    }
    return this.minDate;
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    if (formErrors?.['dateRangeInvalid']) {
      return 'Effective Date must be less than or equal to Termination Date';
    }
    return DateFieldValidationUtility.getStartDateCrossFieldError(control, 'Effective Date', 'Termination Date', null);
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('terminationDatePast')) {
      return 'Termination Date cannot be past';
    }
    const formErrors = this.lastChangedDateField === 'termination' ? (this.form.errors || {}) : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(control, 'Termination Date', 'Effective Date', formErrors);
  }

  get editEffectiveDateDisplay(): string {
    const date = this.form.get('effectiveDate')?.value;
    if (!date) return '-';
    return DateFieldValidationUtility.formatDateForUI(date)?.toUpperCase() || '-';
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (!this.form.valid) {
      if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
        this.lastChangedDateField = 'termination';
      }
      this.snackBar.open('Please correct the highlighted errors before saving.', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const operation$ = this.mode === 'add'
      ? this.driveEquipmentService.createPhysicalEquipment({
          physicalCode: raw.physicalCode,
          equipType: raw.equipmentType,
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as PhysicalEquipmentCreateDto)
      : this.driveEquipmentService.updatePhysicalEquipment({
          physicalCode: this.originalValues.physicalCode,
          equipType: raw.equipmentType,
          auditKey: this.originalValues.auditKey,
          terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
        } as PhysicalEquipmentUpdateDto);

    operation$.subscribe({
      next: () => {
        const message = this.mode === 'add'
          ? `Physical equipment "${raw.physicalCode}" added successfully.`
          : `Physical equipment "${this.originalValues.physicalCode}" updated successfully.`;

        this.snackBar.open(message, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        this.saveSuccess.emit();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        const message = error?.status === 409
          ? `A record with Physical Code "${raw.physicalCode}" and Equipment Type "${raw.equipmentType}" already exists.`
          : this.mode === 'add'
            ? 'Failed to create physical equipment record.'
            : 'Failed to update physical equipment record.';

        this.snackBar.open(message, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (!this.form.valid) {
      this.snackBar.open('Please correct the highlighted errors before saving.', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const payload: PhysicalEquipmentCreateDto = {
      physicalCode: raw.physicalCode,
      equipType: raw.equipmentType,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
    };

    this.driveEquipmentService.createPhysicalEquipment(payload).subscribe({
      next: () => {
        this.snackBar.open(`Physical equipment "${raw.physicalCode}" added successfully.`, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        this.form.reset({
          physicalCode: '',
          physicalCodeDescription: '',
          equipmentType: '',
          equipmentTypeDescription: '',
          effectiveDate: null,
          terminationDate: null
        }, { emitEvent: false });

        Object.keys(this.form.controls).forEach(key => {
          const control = this.form.get(key);
          control?.setErrors(null);
          control?.markAsUntouched();
          control?.markAsPristine();
        });

        this.form.setErrors(null);
        this.form.markAsUntouched();
        this.form.markAsPristine();
        this.lastChangedDateField = null;
        this.isSubmitting.set(false);

        this.refreshData.emit();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        const message = error?.status === 409
          ? `A record with Physical Code "${raw.physicalCode}" and Equipment Type "${raw.equipmentType}" already exists.`
          : 'Failed to create physical equipment record.';

        this.snackBar.open(message, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCancel(): void {
    this.closePanel.emit();
  }
}
