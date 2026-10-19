import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { ValidAttributesMatrixService } from '../services/valid-attributes-matrix.service';
import {
  ValidAttributesMatrix,
  AttributeGroupDropdown,
  AttributeCodeDropdown,
  ModifierCodeDropdown,
  CreateValidAttributesMatrixDto,
  UpdateValidAttributesMatrixDto,
} from '../models/valid-attributes-matrix.model';

@Component({
  selector: 'app-add-edit-valid-attributes-matrix',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-valid-attributes-matrix.component.html',
  styleUrls: ['./add-edit-valid-attributes-matrix.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditValidAttributesMatrixComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly validAttributesMatrixService = inject(ValidAttributesMatrixService);
  private readonly snackbarService = inject(SnackbarService);
  readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ValidAttributesMatrix | null = null;

  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  @ViewChild('closePanelBtn', { read: ElementRef }) closePanelBtn?: ElementRef<HTMLElement>;
  @ViewChild('effDateInput', { read: ElementRef }) effDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('termDateInput', { read: ElementRef }) termDateInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  attributeGroupOptions: AttributeGroupDropdown[] = [];
  attributeCodeOptions: AttributeCodeDropdown[] = [];
  allAttributeCodeOptions: AttributeCodeDropdown[] = [];
  modifierCodeOptions: ModifierCodeDropdown[] = [];
  isLoadingAttributeCodes = false;

  filteredAttributeGroups: AttributeGroupDropdown[] = [];
  filteredAttributeCodes: AttributeCodeDropdown[] = [];
  filteredAllAttributeCodes: AttributeCodeDropdown[] = [];
  filteredDeletedAttributeCodes: AttributeCodeDropdown[] = [];
  filteredModifierCodes: ModifierCodeDropdown[] = [];
  filteredAddModifierCodes: ModifierCodeDropdown[] = [];

  attribGroupSearchCtrl = new FormControl('');
  attribCodeSearchCtrl = new FormControl('');
  deleteModifierSearchCtrl = new FormControl('');
  deletedCodeSearchCtrl = new FormControl('');
  addModifierSearchCtrl = new FormControl('');
  associatedCodeSearchCtrl = new FormControl('');

  minDate: Moment = DateFieldValidationUtility.getMinDate();
  private originalEffDate: string | null = null;
  private originalTermDate: string | null = null;
  effDateEdited = false;
  termDateEdited = false;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  constructor() {
    effect(() => {
      const chapterTimezone = this.headerService.chapterTimeZone();
      this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
    });
  }

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );

  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const eff = this.form?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }
    return true;
  };

  get effMinDate(): Moment | null {
    if (this.mode === 'add') return this.minDate;
    return this.effDateEdited ? this.minDate : null;
  }

  get termMinDate(): Moment | null {
    if (this.mode === 'add') return this.minDate;
    return null;
  }

  get dialogTitle(): string {
    return this.mode === 'add' ? 'Add Attribute' : 'Edit Attribute';
  }

  get isFormValid(): boolean {
    return this.form.valid && !this.isSubmitting;
  }

  get lastModifiedDisplay(): string {
    if (!this.data?.lastModifiedDate) return '';
    const formatted = DateFieldValidationUtility.formatDateTimeForUI(this.data.lastModifiedDate);
    if (!formatted) return '';
    const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
    let timezoneAbbr = timezone;
    try {
      timezoneAbbr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
        .formatToParts(new Date(this.data.lastModifiedDate))
        .find(p => p.type === 'timeZoneName')?.value || timezone;
    } catch { /* fall back to raw timezone string */ }
    return `Last Modified: ${formatted} ${timezoneAbbr}`;
  }

  get groupDescription(): string {
    if (this.mode === 'edit') return this.data?.attribAddedGroupDesc || '-';
    const groupCode = this.form?.get('attribAddedGroup')?.value;
    if (!groupCode) return '-';
    return this.attributeGroupOptions.find(g => g.code === groupCode)?.codeDesc || '-';
  }

  get codeDescription(): string {
    if (this.mode === 'edit') return this.data?.attribAddedCodeDesc || '-';
    const code = this.form?.get('attribAddedCode')?.value;
    if (!code) return '-';
    return this.attributeCodeOptions.find(c => c.attribCode === code)?.attribDesc || '-';
  }

  ngOnInit(): void {
    this.loadDropdownData();
    this.initializeForm();
    this.setupSearchListeners();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.closePanelBtn?.nativeElement?.focus(), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['data']) && this.form) {
      this.initializeForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      attribAddedGroup: [this.data?.attribAddedGroup || null, [Validators.required, Validators.maxLength(5)]],
      attribAddedCode: [this.data?.attribAddedCode || null, [Validators.required, Validators.maxLength(10)]],
      deleteModifierCode: [this.data?.deleteModifierCode || null],
      attribDeletedCode: [this.data?.attribDeletedCode || null],
      addModifierCode: [this.data?.addModifierCode || null],
      associatedAttribCode: [this.data?.associatedAttribCode || null],
      effDate: [this.data?.effDate ? moment(this.data.effDate) : null, [Validators.required]],
      termDate: [this.data?.termDate ? moment(this.data.termDate) : null],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });

    this.form.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.lastChangedDateField = 'effective';
        if (this.mode === 'edit') {
          const newVal = val ? moment(val).format('YYYY-MM-DD') : null;
          this.effDateEdited = newVal !== this.originalEffDate;
        }
        this.form.get('termDate')?.updateValueAndValidity({ emitEvent: false });
        this.form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.form.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.lastChangedDateField = 'termination';
        if (this.mode === 'edit') {
          const newVal = val ? moment(val).format('YYYY-MM-DD') : null;
          this.termDateEdited = newVal !== this.originalTermDate;
        }
        this.form.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });

    this.form.get('attribAddedGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(group => {
        if (group) {
          this.loadAttributeCodes(group);
          this.form.patchValue({ attribAddedCode: null });
        } else {
          this.attributeCodeOptions = [];
          this.filteredAttributeCodes = [];
        }
        this.cdr.markForCheck();
      });

    this.form.get('attribAddedCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.rebuildDeletedCodeOptions();
        this.rebuildAssociatedCodeOptions();
        this.cdr.markForCheck();
      });

    this.form.get('attribDeletedCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.rebuildAssociatedCodeOptions();
        this.cdr.markForCheck();
      });

    if (this.mode === 'edit') {
      this.form.get('attribAddedGroup')?.disable();
      this.form.get('attribAddedCode')?.disable();

      if (this.data?.associatedAttribCode) {
        this.form.get('associatedAttribCode')?.disable();
      }

      this.originalEffDate = this.data?.effDate ? moment(this.data.effDate).format('YYYY-MM-DD') : null;
      this.originalTermDate = this.data?.termDate ? moment(this.data.termDate).format('YYYY-MM-DD') : null;
      this.effDateEdited = false;
      this.termDateEdited = false;

      if (this.data?.attribAddedGroup) {
        this.loadAttributeCodes(this.data.attribAddedGroup);
      }

      this.rebuildDeletedCodeOptions();
      this.rebuildAssociatedCodeOptions();
    } else {
      this.originalEffDate = null;
      this.originalTermDate = null;
      this.effDateEdited = false;
      this.termDateEdited = false;
    }

    this.errorMessage = null;
    this.isSubmitting = false;
    this.lastChangedDateField = null;
  }

  // ── Date input handlers (DOB pattern from multiple-donors-query) ──

  onEffDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effDate')
    );
  }

  onTermDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('termDate'), this.mode === 'edit'
    );
  }

  onEffDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('effDate');
      control?.markAsTouched();
      control?.updateValueAndValidity();
      this.form.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    }, 0);
  }

  onTermDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('termDate');
      control?.markAsTouched();
      control?.updateValueAndValidity();
      this.form.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    }, 0);
  }

  // ── Date error messages ──

  getEffectiveDateError(): string {
    const control = this.form?.get('effDate');
    if (!control) return '';

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Effective Date is invalid';
    }

    const inputValue = this.effDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'Effective Date is invalid';
    }

    if (control.hasError('required') && (control.touched || control.dirty)) {
      return 'Effective Date is required';
    }

    if (control.hasError('matDatepickerMin') && (this.mode === 'add' || this.effDateEdited)) {
      return 'Effective Date cannot be past date';
    }

    if (this.lastChangedDateField === 'effective' && this.form?.hasError('dateRangeInvalid')) {
      return 'Effective Date must be less than or equal to Termination Date';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.form?.get('termDate');
    if (!control) return '';

    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return 'Termination Date is invalid';
    }

    const inputValue = this.termDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'Termination Date is invalid';
    }

    if (!(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerMin') && this.mode === 'add') {
      return 'Termination Date cannot be past date';
    }

    if (this.lastChangedDateField === 'termination' && this.form?.hasError('dateRangeInvalid')) {
      return 'Termination Date must be greater than or equal to Effective Date';
    }

    return '';
  }

  // ── Derived option lists (FMB LOV exclusion logic) ──

  private trimValue(val: string | null | undefined): string | null {
    return val ? val.trim() : null;
  }

  private getAddedCodeValue(): string | null {
    const formVal = this.form?.get('attribAddedCode')?.value;
    if (formVal) return this.trimValue(formVal);
    return this.mode === 'edit' ? this.trimValue(this.data?.attribAddedCode) : null;
  }

  private getDeletedCodeBaseList(): AttributeCodeDropdown[] {
    const addedCode = this.getAddedCodeValue();
    const associatedCode = this.mode === 'edit'
      ? this.trimValue(this.form?.get('associatedAttribCode')?.value) || this.trimValue(this.data?.associatedAttribCode)
      : this.trimValue(this.form?.get('associatedAttribCode')?.value);
    return (this.allAttributeCodeOptions || []).filter(c => {
      const code = this.trimValue(c.attribCode);
      return code !== addedCode && code !== associatedCode;
    });
  }

  private getAssociatedCodeBaseList(): AttributeCodeDropdown[] {
    const addedCode = this.getAddedCodeValue();
    const deletedCode = this.trimValue(this.form?.get('attribDeletedCode')?.value);
    return (this.allAttributeCodeOptions || []).filter(c => {
      const code = this.trimValue(c.attribCode);
      return code !== addedCode && code !== deletedCode;
    });
  }

  private rebuildDeletedCodeOptions(): void {
    this.filteredDeletedAttributeCodes = this.getDeletedCodeBaseList();
  }

  private rebuildAssociatedCodeOptions(): void {
    this.filteredAllAttributeCodes = this.getAssociatedCodeBaseList();
  }

  // ── Search setup ──

  private setupSearchListeners(): void {
    this.attribGroupSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.filteredAttributeGroups = this.filterGroups(this.attributeGroupOptions, s);
    });
    this.attribCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.filteredAttributeCodes = this.filterAttrCodes(this.attributeCodeOptions, s);
    });
    this.deleteModifierSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.filteredModifierCodes = this.filterModCodes(this.modifierCodeOptions, s);
    });
    this.deletedCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.filteredDeletedAttributeCodes = this.filterAttrCodes(this.getDeletedCodeBaseList(), s);
    });
    this.addModifierSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.filteredAddModifierCodes = this.filterModCodes(this.modifierCodeOptions, s);
    });
    this.associatedCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.filteredAllAttributeCodes = this.filterAttrCodes(this.getAssociatedCodeBaseList(), s);
    });
  }

  private filterGroups(list: AttributeGroupDropdown[], search: string | null): AttributeGroupDropdown[] {
    if (!search) return list || [];
    const lower = search.toLowerCase();
    return (list || []).filter(o =>
      (o.code || '').toLowerCase().includes(lower) || (o.codeDesc || '').toLowerCase().includes(lower)
    );
  }

  private filterAttrCodes(list: AttributeCodeDropdown[], search: string | null): AttributeCodeDropdown[] {
    if (!search) return list || [];
    const lower = search.toLowerCase();
    return (list || []).filter(o =>
      (o.attribCode || '').toLowerCase().includes(lower) || (o.attribDesc || '').toLowerCase().includes(lower)
    );
  }

  private filterModCodes(list: ModifierCodeDropdown[], search: string | null): ModifierCodeDropdown[] {
    if (!search) return list || [];
    const lower = search.toLowerCase();
    return (list || []).filter(o =>
      (o.code || '').toLowerCase().includes(lower) || (o.description || '').toLowerCase().includes(lower)
    );
  }

  onDropdownClosed(searchCtrl: FormControl, source: 'group' | 'code' | 'delMod' | 'delCode' | 'addMod' | 'assocCode'): void {
    searchCtrl.setValue('');
    switch (source) {
      case 'group': this.filteredAttributeGroups = this.attributeGroupOptions || []; break;
      case 'code': this.filteredAttributeCodes = this.attributeCodeOptions || []; break;
      case 'delMod': this.filteredModifierCodes = this.modifierCodeOptions || []; break;
      case 'delCode': this.filteredDeletedAttributeCodes = this.getDeletedCodeBaseList(); break;
      case 'addMod': this.filteredAddModifierCodes = this.modifierCodeOptions || []; break;
      case 'assocCode': this.filteredAllAttributeCodes = this.getAssociatedCodeBaseList(); break;
    }
  }

  // ── Load data ──

  private loadDropdownData(): void {
    this.loadAttributeGroups();
    this.loadModifierCodes();
    this.loadAllAttributeCodes();
  }

  private loadAttributeGroups(): void {
    this.validAttributesMatrixService.getAttributeGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroupOptions = groups || [];
          this.filteredAttributeGroups = this.attributeGroupOptions;
          this.cdr.markForCheck();
        },
        error: () => this.snackbarService.showError('Failed to load attribute groups.')
      });
  }

  private loadAttributeCodes(attribGroup: string): void {
    this.isLoadingAttributeCodes = true;
    this.validAttributesMatrixService.getAttributeCodes(attribGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.attributeCodeOptions = codes || [];
          this.filteredAttributeCodes = this.attributeCodeOptions;
          this.isLoadingAttributeCodes = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackbarService.showError('Failed to load attribute codes.');
          this.isLoadingAttributeCodes = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadAllAttributeCodes(): void {
    this.validAttributesMatrixService.getAttributeCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.allAttributeCodeOptions = codes || [];
          this.rebuildDeletedCodeOptions();
          this.rebuildAssociatedCodeOptions();
          this.cdr.markForCheck();
        },
        error: () => {}
      });
  }

  private loadModifierCodes(): void {
    this.validAttributesMatrixService.getModifierCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.modifierCodeOptions = codes || [];
          this.filteredModifierCodes = this.modifierCodeOptions;
          this.filteredAddModifierCodes = this.modifierCodeOptions;
          this.cdr.markForCheck();
        },
        error: () => this.snackbarService.showError('Failed to load modifier codes.')
      });
  }

  // ── Save ──

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;
    const formValue = this.form.getRawValue();
    this.mode === 'add' ? this.createRecord(formValue) : this.updateRecord(formValue);
  }

  private createRecord(fv: any): void {
    const dto: CreateValidAttributesMatrixDto = {
      attribAddedGroup: fv.attribAddedGroup,
      attribAddedCode: fv.attribAddedCode,
      attribDeletedGroup: null,
      attribDeletedCode: fv.attribDeletedCode || null,
      deleteModifierCode: fv.deleteModifierCode || null,
      addModifierCode: fv.addModifierCode || null,
      associatedAttribGroup: null,
      associatedAttribCode: fv.associatedAttribCode || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(fv.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(fv.termDate),
    };
    this.validAttributesMatrixService.createValidAttributesMatrix(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.isSubmitting = false; this.snackbarService.showSuccess('Attribute matrix entry created successfully.'); this.saveSuccess.emit(); this.closePanel.emit(); },
        error: (e) => { this.errorMessage = e?.error?.message || 'Failed to create attribute matrix entry.'; this.snackbarService.showError(this.errorMessage!); this.isSubmitting = false; this.cdr.markForCheck(); }
      });
  }

  private updateRecord(fv: any): void {
    if (!this.data) return;
    const dto: UpdateValidAttributesMatrixDto = {
      attribDeletedCode: fv.attribDeletedCode || null,
      deleteModifierCode: fv.deleteModifierCode || null,
      addModifierCode: fv.addModifierCode || null,
      associatedAttribCode: fv.associatedAttribCode || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(fv.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(fv.termDate),
    };
    this.validAttributesMatrixService.updateValidAttributesMatrix(
      this.data.attribAddedGroup, this.data.attribAddedCode, dto,
      this.data.attribDeletedCode,
      this.data.associatedAttribCode
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.isSubmitting = false; this.snackbarService.showSuccess('Attribute matrix entry updated successfully.'); this.saveSuccess.emit(); this.closePanel.emit(); },
        error: (e) => { this.errorMessage = e?.error?.message || 'Failed to update attribute matrix entry.'; this.snackbarService.showError(this.errorMessage!); this.isSubmitting = false; this.cdr.markForCheck(); }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');

    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;
    const fv = this.form.getRawValue();
    const dto: CreateValidAttributesMatrixDto = {
      attribAddedGroup: fv.attribAddedGroup,
      attribAddedCode: fv.attribAddedCode,
      attribDeletedGroup: null,
      attribDeletedCode: fv.attribDeletedCode || null,
      deleteModifierCode: fv.deleteModifierCode || null,
      addModifierCode: fv.addModifierCode || null,
      associatedAttribGroup: null,
      associatedAttribCode: fv.associatedAttribCode || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(fv.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(fv.termDate),
    };
    this.validAttributesMatrixService.createValidAttributesMatrix(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.isSubmitting = false; this.snackbarService.showSuccess('Attribute matrix entry created successfully.'); this.saveSuccess.emit(); this.resetForm(); },
        error: (e) => { this.errorMessage = e?.error?.message || 'Failed to create attribute matrix entry.'; this.snackbarService.showError(this.errorMessage!); this.isSubmitting = false; this.cdr.markForCheck(); }
      });
  }

  private resetForm(): void {
    this.form.reset();
    this.attributeCodeOptions = [];
    this.filteredAttributeCodes = [];
    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  formatDateForDisplay(date: Date | string | null): string {
    if (!date) return '-';
    const d = moment(date);
    return d.isValid() ? d.format('DD-MMM-YYYY').toUpperCase() : '-';
  }
}
