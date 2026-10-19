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
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ConfigureInterdictionPlacementService } from '../configure-interdiction-placement.service';
import {
  InterdictionPlacement,
  CreateInterdictionPlacementRequest,
  UpdateInterdictionPlacementRequest,
  ActionFunctionNameLookup,
  ActionCodeLookup,
  ProductCodeLookup,
  InterdictionCodeLookup,
  ProductTypeLookup,
} from '../configure-interdiction-placement.model';

@Component({
  selector: 'app-interdiction-placement-side-panel',
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
  templateUrl: './interdiction-placement-side-panel.component.html',
  styleUrl: './interdiction-placement-side-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterdictionPlacementSidePanelComponent implements OnInit, OnDestroy, OnChanges {
  private static nextId = 0;
  protected readonly componentId = `interdiction-panel-${InterdictionPlacementSidePanelComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() record: InterdictionPlacement | null = null;
  @Input() selectedFunction: string = '';
  @Input() lookupsLoading: boolean = false;
  @Input() actionFunctionNamesLookup: ActionFunctionNameLookup[] = [];
  @Input() actionCodesLookup: ActionCodeLookup[] = [];
  @Input() productCodesLookup: ProductCodeLookup[] = [];
  @Input() interdictionCodesLookup: InterdictionCodeLookup[] = [];
  @Input() productTypesLookup: ProductTypeLookup[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<string>();
  @Output() saveAndCreateAnother = new EventEmitter<string>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ConfigureInterdictionPlacementService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  protected readonly loading = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  protected readonly actionFunctionNames = signal<ActionFunctionNameLookup[]>([]);
  protected readonly actionCodes = signal<ActionCodeLookup[]>([]);
  protected readonly productCodes = signal<ProductCodeLookup[]>([]);
  protected readonly interdictionCodes = signal<InterdictionCodeLookup[]>([]);
  protected readonly productTypes = signal<ProductTypeLookup[]>([]);

  protected readonly yesNullOptions = [
    { value: 'Y', label: 'Yes' },
    { value: '', label: 'No' }
  ];

  // Search controls for searchable dropdowns
  functionNameSearchCtrl = new FormControl('');
  productCodeSearchCtrl = new FormControl('');
  otherProductSearchCtrl = new FormControl('');
  productTypeSearchCtrl = new FormControl('');
  interCodeSearchCtrl = new FormControl('');
  actionCodeSearchCtrl = new FormControl('');

  private functionNameSearch = signal('');
  private productCodeSearch = signal('');
  private otherProductSearch = signal('');
  private productTypeSearch = signal('');
  private interCodeSearch = signal('');
  private actionCodeSearch = signal('');

  readonly filteredFunctionNames = computed(() => {
    const search = this.functionNameSearch().toLowerCase();
    const options = this.actionFunctionNames();
    if (!search) return options;
    return options.filter(o => o.code.toLowerCase().includes(search));
  });

  readonly filteredProductCodes = computed(() => {
    const search = this.productCodeSearch().toLowerCase();
    const options = this.productCodes();
    if (!search) return options;
    return options.filter(o => o.productCode.toLowerCase().includes(search) || o.productDesc.toLowerCase().includes(search));
  });

  readonly filteredOtherProductCodes = computed(() => {
    const search = this.otherProductSearch().toLowerCase();
    const options = this.productCodes();
    if (!search) return options;
    return options.filter(o => o.productCode.toLowerCase().includes(search) || o.productDesc.toLowerCase().includes(search));
  });

  readonly filteredProductTypes = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const options = this.productTypes();
    if (!search) return options;
    return options.filter(o => o.productType.toLowerCase().includes(search));
  });

  readonly filteredInterdictionCodes = computed(() => {
    const search = this.interCodeSearch().toLowerCase();
    const options = this.interdictionCodes();
    if (!search) return options;
    return options.filter(o => o.interCode.toLowerCase().includes(search) || o.interDesc.toLowerCase().includes(search));
  });

  readonly filteredActionCodes = computed(() => {
    const search = this.actionCodeSearch().toLowerCase();
    const options = this.actionCodes();
    if (!search) return options;
    return options.filter(o => o.code.toLowerCase().includes(search) || o.codeDesc.toLowerCase().includes(search));
  });

  minDate!: Moment;
  private originalTerminationDate: string | null = null;
  private termDateRawInput = '';

  private readonly termDateInputValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && this.termDateRawInput.trim()) {
      return { invalidDate: true };
    }
    return null;
  };
  effDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  form!: FormGroup;

  get f() {
    return this.form.controls;
  }

  get panelTitle(): string {
    return this.mode === 'add' ? 'Add New Interdiction Placement' : 'Edit Interdiction Placement';
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.populateLookups();
    this.initForm();
    this.setupConditionalLogic();
    this.setupSearchControls();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['actionFunctionNamesLookup'] || changes['actionCodesLookup'] ||
        changes['productCodesLookup'] || changes['interdictionCodesLookup'] ||
        changes['productTypesLookup']) {
      this.populateLookups();
    }
    if ((changes['mode'] || changes['record'] || changes['selectedFunction']) && this.form) {
      this.resetForm();
    }
  }

  private populateLookups(): void {
    this.actionFunctionNames.set(this.actionFunctionNamesLookup || []);
    this.actionCodes.set(this.actionCodesLookup || []);
    this.productCodes.set(this.productCodesLookup || []);
    this.interdictionCodes.set(this.interdictionCodesLookup || []);
    this.productTypes.set(this.productTypesLookup || []);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const record = this.record;

    this.form = this.fb.group({
      actionFunctionName: [
        { value: record?.actionFunctionName || this.selectedFunction || '', disabled: true },
        [Validators.required],
      ],
      actionProductCode: [
        { value: record?.actionProductCode || '', disabled: this.isEditMode },
        [Validators.required],
      ],
      actionCode: [{ value: record?.actionCode || null, disabled: true }],
      interOnCurrentProd: [record?.interOnCurrentProd || ''],
      interOnOtherProds: [record?.interOnOtherProds ? record.interOnOtherProds.split(',') : []],
      interOnOtherProdTypes: [record?.interOnOtherProdTypes ? record.interOnOtherProdTypes.split(',') : []],
      interOnUnitLevel: [record?.interOnUnitLevel || ''],
      interAllProdButCurr: [record?.interAllProdButCurr || ''],
      interCode: [record?.interCode || null, [Validators.required]],
      effDate: [
        record?.effDate ? moment(record.effDate) : (this.mode === 'add' ? this.minDate.clone() : null),
        [Validators.required],
      ],
      termDate: [record?.termDate ? moment(record.termDate) : null],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      this.originalTerminationDate = record?.termDate
        ? moment(record.termDate).format('YYYY-MM-DD')
        : null;
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      this.applyEditModeTerminationValidator();
    }
    this.addTermDateInputValidator();
  }

  private addTermDateInputValidator(): void {
    this.form.get('termDate')?.addValidators(this.termDateInputValidator);
  }

  private applyEditModeTerminationValidator(): void {
    const termDateControl = this.form.get('termDate');
    if (termDateControl) {
      const currentValidators = termDateControl.validator ? [termDateControl.validator] : [];
      termDateControl.setValidators([
        ...currentValidators,
        DateFieldValidationUtility.editModeTerminationDateValidator(
          this.originalTerminationDate,
          this.headerService.chapterTimeZone()
        )
      ]);
      termDateControl.updateValueAndValidity();
    }
  }

  private setupConditionalLogic(): void {
    this.form.get('actionFunctionName')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const actionCodeControl = this.form.get('actionCode');
        if (value === 'CPIREJ') {
          actionCodeControl?.enable();
        } else {
          actionCodeControl?.setValue(null);
          actionCodeControl?.disable();
        }
      });

    const initialFn = this.form.get('actionFunctionName')?.value;
    if (initialFn === 'CPIREJ') {
      this.form.get('actionCode')?.enable();
    }
  }

  private setupSearchControls(): void {
    this.functionNameSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.functionNameSearch.set(v || ''));
    this.productCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.productCodeSearch.set(v || ''));
    this.otherProductSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.otherProductSearch.set(v || ''));
    this.productTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.productTypeSearch.set(v || ''));
    this.interCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.interCodeSearch.set(v || ''));
    this.actionCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.actionCodeSearch.set(v || ''));
  }

  private resetSearchControls(): void {
    this.functionNameSearchCtrl.setValue('', { emitEvent: false });
    this.productCodeSearchCtrl.setValue('', { emitEvent: false });
    this.otherProductSearchCtrl.setValue('', { emitEvent: false });
    this.productTypeSearchCtrl.setValue('', { emitEvent: false });
    this.interCodeSearchCtrl.setValue('', { emitEvent: false });
    this.actionCodeSearchCtrl.setValue('', { emitEvent: false });
  }

  private resetForm(): void {
    this.submitted.set(false);
    this.termDateRawInput = '';
    this.resetSearchControls();
    const record = this.record;

    this.form.patchValue({
      actionFunctionName: record?.actionFunctionName || this.selectedFunction || '',
      actionProductCode: record?.actionProductCode || '',
      actionCode: record?.actionCode || null,
      interOnCurrentProd: record?.interOnCurrentProd || '',
      interOnOtherProds: record?.interOnOtherProds ? record.interOnOtherProds.split(',') : [],
      interOnOtherProdTypes: record?.interOnOtherProdTypes ? record.interOnOtherProdTypes.split(',') : [],
      interOnUnitLevel: record?.interOnUnitLevel || '',
      interAllProdButCurr: record?.interAllProdButCurr || '',
      interCode: record?.interCode || null,
      effDate: record?.effDate ? moment(record.effDate) : (this.mode === 'add' ? this.minDate.clone() : null),
      termDate: record?.termDate ? moment(record.termDate) : null,
    });

    this.form.get('actionFunctionName')?.disable();
    if (this.isEditMode) {
      this.form.get('actionProductCode')?.disable();
    } else {
      this.form.get('actionProductCode')?.enable();
    }

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      this.originalTerminationDate = record?.termDate
        ? moment(record.termDate).format('YYYY-MM-DD')
        : null;
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      this.applyEditModeTerminationValidator();
    }
    this.addTermDateInputValidator();

    const fn = this.form.get('actionFunctionName')?.value;
    if (fn === 'CPIREJ') {
      this.form.get('actionCode')?.enable();
    } else {
      this.form.get('actionCode')?.disable();
    }
  }

  // Date validation error messages
  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effDate'), 'Effective Date', 'Termination Date', this.form.errors
    );
  }

  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('termDate'), 'Termination Date', 'Effective Date', this.form.errors
    );
  }

  // Date input handlers for manual text entry
  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    this.termDateRawInput = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(
      this.termDateRawInput, this.form.get('termDate'), this.isEditMode
    );
  }

  getEffectiveDateMin(): Moment | null {
    return this.mode === 'add' ? this.minDate : null;
  }

  getTerminationDateMin(): Moment | null {
    const effValue = this.form.get('effDate')?.value;
    if (effValue && moment.isMoment(effValue) && effValue.isValid()) {
      return effValue.isAfter(this.minDate) ? effValue : this.minDate;
    }
    return this.minDate;
  }

  protected onSave(createAnother = false): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.submitted.set(true);

    if (this.form.invalid) {
      return;
    }

    if (this.form.hasError('dateRangeInvalid')) {
      this.form.get('termDate')?.markAsTouched();
      return;
    }

    this.loading.set(true);

    if (this.mode === 'add') {
      this.createRecord(createAnother);
    } else {
      this.updateRecord();
    }
  }

  private createRecord(createAnother: boolean): void {
    const formValue = this.form.getRawValue();

    const request: CreateInterdictionPlacementRequest = {
      actionFunctionName: formValue.actionFunctionName,
      actionType: 'REJECT',
      actionProductCode: formValue.actionProductCode,
      actionCode: formValue.actionCode || null,
      interOnCurrentProd: formValue.interOnCurrentProd || null,
      interOnOtherProds: formValue.interOnOtherProds?.length ? formValue.interOnOtherProds.join(',') : null,
      interOnOtherProdTypes: formValue.interOnOtherProdTypes?.length ? formValue.interOnOtherProdTypes.join(',') : null,
      interOnUnitLevel: formValue.interOnUnitLevel || null,
      interAllProdButCurr: formValue.interAllProdButCurr || null,
      interCode: formValue.interCode || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate),
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
    };

    this.service.create(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
          const msg = response?.message || 'Record created successfully';
          if (createAnother) {
            this.form.reset({
              actionFunctionName: this.selectedFunction || '',
              effDate: this.minDate.clone(),
            });
            this.submitted.set(false);
            this.termDateRawInput = '';
            this.resetSearchControls();
            DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
            this.addTermDateInputValidator();
            const fn = this.form.get('actionFunctionName')?.value;
            if (fn === 'CPIREJ') {
              this.form.get('actionCode')?.enable();
            } else {
              this.form.get('actionCode')?.disable();
            }
            this.saveAndCreateAnother.emit(msg);
          } else {
            this.saveSuccess.emit(msg);
          }
        },
        error: (err) => {
          console.error('Error creating record:', err);
          this.loading.set(false);
          this.snackbarService.showError(err.error?.message || 'Failed to create interdiction placement');
        },
      });
  }

  private updateRecord(): void {
    const formValue = this.form.getRawValue();
    const record = this.record!;

    const request: UpdateInterdictionPlacementRequest = {
      actionCode: formValue.actionCode || null,
      interOnCurrentProd: formValue.interOnCurrentProd || null,
      interOnOtherProds: formValue.interOnOtherProds?.length ? formValue.interOnOtherProds.join(',') : null,
      interOnOtherProdTypes: formValue.interOnOtherProdTypes?.length ? formValue.interOnOtherProdTypes.join(',') : null,
      interOnUnitLevel: formValue.interOnUnitLevel || null,
      interAllProdButCurr: formValue.interAllProdButCurr || null,
      interCode: formValue.interCode || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate),
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
    };

    this.service.update(
      record.chapterId,
      record.actionFunctionName,
      record.actionType,
      record.actionCode,
      record.actionProductCode,
      request
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
          this.saveSuccess.emit(response?.message || 'Record updated successfully');
        },
        error: (err) => {
          console.error('Error updating record:', err);
          this.loading.set(false);
          this.snackbarService.showError(err.error?.message || 'Failed to update interdiction placement');
        },
      });
  }

  protected onCancel(): void {
    this.closePanel.emit();
  }
}
