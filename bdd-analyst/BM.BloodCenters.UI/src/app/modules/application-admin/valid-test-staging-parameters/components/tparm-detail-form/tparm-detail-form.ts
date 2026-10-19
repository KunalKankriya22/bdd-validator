import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { requiredTrimmedValidator, trimmedMaxLengthValidator } from '@shared/validators';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import {
  ValidTestParmDto,
  CreateValidTestParmRequestDto,
  UpdateValidTestParmRequestDto,
  DatatypeLookup,
  VoidCodeLookup,
  RelatedCodeLookup,
  FormMode,
  RunFlagEnum,
  DatatypeEnum
} from '../../models/tparm.model';
import { TparmApiService } from '../../services/tparm-api.service';

@Component({
  selector: 'app-tparm-detail-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './tparm-detail-form.html',
  styleUrls: ['./tparm-detail-form.scss']
})
export class TparmDetailFormComponent implements OnInit, OnChanges, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `tparm-detail-${TparmDetailFormComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(TparmApiService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();
  private readonly formReset$ = new Subject<void>();

  // Inputs/Outputs
  @Input() mode: FormMode = FormMode.ADD;
  @Input() parameter: ValidTestParmDto | null = null;
  @Output() save = new EventEmitter<CreateValidTestParmRequestDto | UpdateValidTestParmRequestDto>();
  @Output() cancel = new EventEmitter<void>();
  @Output() addAndCreateAnother = new EventEmitter<CreateValidTestParmRequestDto>();

  // Signal-based state
  protected readonly saving = signal<boolean>(false);
  protected readonly datatypes = signal<DatatypeLookup[]>([]);
  protected readonly voidCodes = signal<VoidCodeLookup[]>([]);
  protected readonly relatedCodes = signal<RelatedCodeLookup[]>([]);
  protected readonly loadingRelatedCodes = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  // Form
  form!: FormGroup;

  // Datatype search
  readonly datatypeSearchControl = new FormControl('');
  private readonly datatypeSearch = signal('');
  readonly filteredDatatypes = computed(() => {
    const search = this.datatypeSearch().toLowerCase();
    const options = this.datatypes();
    if (!search) return options;
    return options.filter(o =>
      o.typeCode.toLowerCase().includes(search) ||
      o.description.toLowerCase().includes(search)
    );
  });

  // Related Code search
  readonly relatedCodeSearchControl = new FormControl('');
  private readonly relatedCodeSearch = signal('');
  readonly filteredRelatedCodes = computed(() => {
    const search = this.relatedCodeSearch().toLowerCase();
    const options = this.relatedCodes();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) ||
      o.codeDesc.toLowerCase().includes(search)
    );
  });

  // Void Code search
  readonly voidCodeSearchControl = new FormControl('');
  private readonly voidCodeSearch = signal('');
  readonly filteredVoidCodes = computed(() => {
    const search = this.voidCodeSearch().toLowerCase();
    const options = this.voidCodes();
    if (!search) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(search) ||
      o.codeDesc.toLowerCase().includes(search)
    );
  });

  // Constants
  protected readonly CODE_MAX_LENGTH = 5;
  protected readonly DESCRIPTION_MAX_LENGTH = 50;
  protected readonly runFlagOptions = [
    { value: RunFlagEnum.YES, label: 'Yes' },
    { value: RunFlagEnum.NO, label: 'No' }
  ];

  get isEditMode(): boolean { return this.mode === FormMode.EDIT; }
  get isAddMode(): boolean { return this.mode === FormMode.ADD; }
  get formTitle(): string { return this.isEditMode ? 'Parameter Settings' : 'Add New Parameter'; }
  get lastModified(): string | null {
    if (!this.parameter?.lastModifiedDate) return null;
    return moment(this.parameter.lastModifiedDate).format('DD-MMM-YYYY, HH:mm z');
  }

  // Enums for template
  protected readonly FormMode = FormMode;

  formatEffDate(): string {
    if (!this.parameter?.effDate) return '-';
    return moment(this.parameter.effDate).format('DD-MMM-YYYY').toUpperCase();
  }

  // Date restrictions
  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  // Date validation trackers
  protected lastChangedDateField: 'effective' | 'termination' | null = null;
  protected effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  protected termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Termination date filter - must be after effective date
  protected terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.minDate.clone().startOf('day');
    if (checkDate.isBefore(today)) return false;
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  private initialized = false;

  ngOnInit(): void {
    this.initializeForm();
    this.loadLookups();
    this.setupDatatypeChangeListener();
    this.setupDateValidationListeners();
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (changes['mode'] || changes['parameter']) {
      this.formReset$.next();
      this.submitted.set(false);
      this.lastChangedDateField = null;
      this.initializeForm();
      this.setupDatatypeChangeListener();
      this.setupDateValidationListeners();
      this.datatypeSearchControl.setValue('');
      this.relatedCodeSearchControl.setValue('');
      this.voidCodeSearchControl.setValue('');

      const newDatatype = this.parameter?.datatype;
      const prevParam = changes['parameter']?.previousValue as ValidTestParmDto | null;
      if (newDatatype && newDatatype !== prevParam?.datatype) {
        if (this.needsRelatedCodes(newDatatype)) {
          this.loadRelatedCodes(newDatatype);
        } else {
          this.relatedCodes.set([]);
        }
      } else if (!newDatatype) {
        this.relatedCodes.set([]);
      }
    }
  }

  ngOnDestroy(): void {
    this.formReset$.next();
    this.formReset$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      parmCode: [
        { value: '', disabled: this.isEditMode },
        [
          requiredTrimmedValidator(),
          trimmedMaxLengthValidator(this.CODE_MAX_LENGTH),
          Validators.pattern(/^[A-Z0-9]+$/)
        ]
      ],
      description: [
        '',
        [
          requiredTrimmedValidator(),
          trimmedMaxLengthValidator(this.DESCRIPTION_MAX_LENGTH)
        ]
      ],
      datatype: [null, [Validators.required]],
      relatedCode: [null],
      voidCode: [null],
      runFlag: [null],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    // Setup mode-specific validators
    if (this.isEditMode) {
      // Effective date stays editable in edit mode (past-date validation skipped per API contract)
      const effDateControl = this.form.get('effectiveDate');
      if (effDateControl) {
        effDateControl.clearValidators();
        effDateControl.setValidators([
          Validators.required,
          DateFieldValidationUtility.validDateValidator()
        ]);
        effDateControl.enable();
        effDateControl.updateValueAndValidity();
      }

      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    // Populate form in edit mode
    if (this.isEditMode && this.parameter) {
      this.form.patchValue({
        parmCode: this.parameter.parmCode || '',
        description: this.parameter.description || '',
        datatype: this.parameter.datatype || null,
        relatedCode: this.parameter.relatedCode || null,
        voidCode: this.parameter.voidCode || null,
        runFlag: this.parameter.runFlag || RunFlagEnum.YES,
        effectiveDate: this.parameter.effDate ? moment(this.parameter.effDate) : null,
        terminationDate: this.parameter.termDate ? moment(this.parameter.termDate) : null
      });

      this.updateRelatedCodeValidators(this.parameter.datatype);
    }

    this.form.markAsPristine();
  }

  private loadLookups(): void {
    this.apiService.getDatatypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.datatypes.set(data),
        error: (err) => console.error('Failed to load datatypes:', err)
      });

    this.apiService.getVoidCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.voidCodes.set(data),
        error: (err) => console.error('Failed to load void codes:', err)
      });

    // Load related codes if datatype is already selected (edit mode) — only DEVICE/REAGENT have related codes
    if (this.isEditMode && this.needsRelatedCodes(this.parameter?.datatype ?? null)) {
      this.loadRelatedCodes(this.parameter!.datatype);
    }
  }

  private setupDatatypeChangeListener(): void {
    this.form.get('datatype')?.valueChanges
      .pipe(takeUntil(this.formReset$))
      .subscribe((datatype: string | null) => {
        this.form.patchValue({ relatedCode: null }, { emitEvent: false });
        this.relatedCodes.set([]);

        this.updateRelatedCodeValidators(datatype);

        if (datatype) {
          this.loadRelatedCodes(datatype);
        }
      });

    this.datatypeSearchControl.valueChanges
      .pipe(takeUntil(this.formReset$))
      .subscribe(value => this.datatypeSearch.set(value || ''));

    this.relatedCodeSearchControl.valueChanges
      .pipe(takeUntil(this.formReset$))
      .subscribe(value => this.relatedCodeSearch.set(value || ''));

    this.voidCodeSearchControl.valueChanges
      .pipe(takeUntil(this.formReset$))
      .subscribe(value => this.voidCodeSearch.set(value || ''));
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

  private loadRelatedCodes(datatype: string): void {
    this.loadingRelatedCodes.set(true);
    const excludeCode = this.isEditMode ? this.parameter?.parmCode : undefined;
    this.apiService.getRelatedCodes(datatype, excludeCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.relatedCodes.set(data);
          this.loadingRelatedCodes.set(false);
        },
        error: (err) => {
          console.error('Failed to load related codes:', err);
          this.loadingRelatedCodes.set(false);
        }
      });
  }

  private needsRelatedCodes(datatype: string | null): boolean {
    return datatype === DatatypeEnum.DEVICE || datatype === DatatypeEnum.REAGENT;
  }

  private updateRelatedCodeValidators(datatype: string | null): void {
    const relatedCodeControl = this.form.get('relatedCode');
    if (!relatedCodeControl) return;

    if (datatype === DatatypeEnum.DEVICE || datatype === DatatypeEnum.REAGENT) {
      relatedCodeControl.setValidators([Validators.required]);
    } else {
      relatedCodeControl.clearValidators();
    }
    relatedCodeControl.updateValueAndValidity();
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.formReset$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.form.get('terminationDate')?.updateValueAndValidity();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.formReset$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
      });
  }

  onSave(): void {
    this.submitted.set(true);

    if (this.isAddMode) {
      this.form.markAllAsTouched();
      DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');
    }

    if (this.form.invalid) {
      // Focus first invalid field
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.isAddMode) {
      const createRequest: CreateValidTestParmRequestDto = {
        parmCode: formValue.parmCode.trim().toUpperCase(),
        description: formValue.description.trim(),
        datatype: formValue.datatype,
        relatedCode: formValue.relatedCode || null,
        voidCode: formValue.voidCode || null,
        runFlag: formValue.runFlag,
        effDate: formValue.effectiveDate ?
          DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) : undefined
      };
      this.save.emit(createRequest);
    } else {
      const updateRequest: UpdateValidTestParmRequestDto = {
        description: formValue.description.trim(),
        datatype: formValue.datatype,
        relatedCode: formValue.relatedCode || null,
        voidCode: formValue.voidCode || null,
        runFlag: formValue.runFlag,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate)!,
        termDate: formValue.terminationDate ?
          DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) : null
      };
      this.save.emit(updateRequest);
    }
  }

  onAddAndCreateAnother(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const formValue = this.form.getRawValue();
    const createRequest: CreateValidTestParmRequestDto = {
      parmCode: formValue.parmCode.trim().toUpperCase(),
      description: formValue.description.trim(),
      datatype: formValue.datatype,
      relatedCode: formValue.relatedCode || null,
      voidCode: formValue.voidCode || null,
      runFlag: formValue.runFlag,
      effDate: formValue.effectiveDate ?
        DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) : undefined
    };

    this.addAndCreateAnother.emit(createRequest);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onClearAll(): void {
    if (this.isEditMode && this.parameter) {
      this.form.patchValue({
        description: this.parameter.description || '',
        datatype: this.parameter.datatype || null,
        relatedCode: this.parameter.relatedCode || null,
        voidCode: this.parameter.voidCode || null,
        runFlag: this.parameter.runFlag || RunFlagEnum.YES,
        effectiveDate: this.parameter.effDate ? moment(this.parameter.effDate) : null,
        terminationDate: this.parameter.termDate ? moment(this.parameter.termDate) : null
      });
      this.submitted.set(false);
      this.form.markAsPristine();
    }
  }

  get f() {
    return this.form.controls;
  }

  get codeCharsRemaining(): number {
    const value = this.f['parmCode'].value || '';
    return this.CODE_MAX_LENGTH - value.length;
  }

  get descCharsRemaining(): number {
    const value = this.f['description'].value || '';
    return this.DESCRIPTION_MAX_LENGTH - value.length;
  }

  // Error message methods
  getCodeError(): string {
    const control = this.f['parmCode'];
    if (!control || (!control.touched && !this.submitted())) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return 'Parameter Code is required';
    }
    if (control.hasError('trimmedMaxLength')) {
      return `Code cannot exceed ${this.CODE_MAX_LENGTH} characters`;
    }
    if (control.hasError('pattern')) {
      return 'Code must be uppercase alphanumeric only';
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.f['description'];
    if (!control || (!control.touched && !this.submitted())) return '';

    if (control.hasError('required') || control.hasError('whitespaceOnly')) {
      return 'Description is required';
    }
    if (control.hasError('trimmedMaxLength')) {
      return `Description cannot exceed ${this.DESCRIPTION_MAX_LENGTH} characters`;
    }
    return '';
  }

  getDatatypeError(): string {
    const control = this.f['datatype'];
    if (!control || (!control.touched && !this.submitted())) return '';

    if (control.hasError('required')) {
      return 'Datatype is required';
    }
    return '';
  }

  getRelatedCodeError(): string {
    const control = this.f['relatedCode'];
    if (!control || (!control.touched && !this.submitted())) return '';

    if (control.hasError('required')) {
      return 'Related Code is required for this datatype';
    }
    return '';
  }

  isRelatedCodeRequired(): boolean {
    const datatype = this.f['datatype']?.value;
    return datatype === DatatypeEnum.DEVICE || datatype === DatatypeEnum.REAGENT;
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('terminationDate'),
      this.isEditMode
    );
  }
}
