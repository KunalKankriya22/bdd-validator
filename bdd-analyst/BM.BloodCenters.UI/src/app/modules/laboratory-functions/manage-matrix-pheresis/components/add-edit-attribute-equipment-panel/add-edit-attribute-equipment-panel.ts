/**
 * Add/Edit Panel Component for Procedure Attribute/Equipment Matrix
 * JIRA: MLT-12856
 * Oracle Forms: VATTREQU.fmb
 * Pattern: Follows add-edit-max-donations.ts
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
  ProcedureAttributeEquipment,
  CreateProcedureAttributeEquipmentDto,
  UpdateProcedureAttributeEquipmentDto,
  AttributeGroupDropdown,
  AttributeCodeDropdown,
  EquipmentTypeDropdown,
  ParameterCodeDropdown
} from '../../models/matrix-pheresis.model';

@Component({
  selector: 'app-add-edit-attribute-equipment-panel',
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
  templateUrl: './add-edit-attribute-equipment-panel.html',
  styleUrls: ['./add-edit-attribute-equipment-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class AddEditAttributeEquipmentPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ProcedureAttributeEquipment | null = null;
  @Input() selectedAttributeGroup: string = ''; // The attribute group selected in the filter
  @Input() equipmentTypes: EquipmentTypeDropdown[] = [];
  @Input() parameterCodes: ParameterCodeDropdown[] = [];
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
  isLoadingAttributeCodes = signal<boolean>(false);

  // Attribute codes for selected attribute group
  attributeCodes = signal<AttributeCodeDropdown[]>([]);

  // Search controls for dropdowns
  attributeCodeSearchControl = new FormControl('');
  equipmentTypeSearchControl = new FormControl('');
  parameterCodeSearchControl = new FormControl('');

  // Filtered lists
  filteredAttributeCodes = signal<AttributeCodeDropdown[]>([]);
  filteredEquipmentTypes = signal<EquipmentTypeDropdown[]>([]);
  filteredParameterCodes = signal<ParameterCodeDropdown[]>([]);

  // Selected descriptions for display (Add mode)
  selectedAttributeCodeDescription = signal<string>('');
  selectedEquipmentTypeDescription = signal<string>('');
  selectedParameterCodeDescription = signal<string>('');

  // Date validation properties (from DateFieldValidationUtility pattern)
  minDate: Moment;
  terminationMinDate: Moment;
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  // Error matchers
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  // Edit mode read-only values
  editModeValues = {
    attributeCode: '',
    attributeCodeDesc: '',
    equipmentType: '',
    equipmentTypeDesc: '',
    parameterCode: '',
    parameterCodeDesc: '',
    effectiveDate: ''
  };

  // Last modified date for edit mode
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
    if (changes['parameterCodes'] && !changes['parameterCodes'].firstChange) {
      this.filteredParameterCodes.set(this.parameterCodes);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form with validators
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      attributeCode: ['', Validators.required],
      equipmentType: ['', Validators.required],
      parameterCode: ['', Validators.required],
      effDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      termDate: [null]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')] });
  }

  /**
   * Setup search filters for dropdowns
   */
  private setupSearchFilters(): void {
    // Attribute code search filter
    this.attributeCodeSearchControl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredAttributeCodes.set(this.attributeCodes());
        } else {
          const filtered = this.attributeCodes().filter(c =>
            c.attributeCode.toLowerCase().includes(search) ||
            c.description.toLowerCase().includes(search)
          );
          this.filteredAttributeCodes.set(filtered);
        }
      });

    // Equipment type search filter
    this.equipmentTypeSearchControl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredEquipmentTypes.set(this.equipmentTypes);
        } else {
          const filtered = this.equipmentTypes.filter(e =>
            e.equipmentType.toLowerCase().includes(search) ||
            e.description.toLowerCase().includes(search)
          );
          this.filteredEquipmentTypes.set(filtered);
        }
      });

    // Parameter code search filter
    this.parameterCodeSearchControl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredParameterCodes.set(this.parameterCodes);
        } else {
          const filtered = this.parameterCodes.filter(p =>
            p.parameterCode.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search)
          );
          this.filteredParameterCodes.set(filtered);
        }
      });
  }

  /**
   * Setup form based on mode (add/edit)
   */
  private setupFormBasedOnMode(): void {
    if (this.mode === 'add') {
      this.setupAddMode();
    } else {
      this.setupEditMode();
    }
  }

  /**
   * Setup ADD mode
   */
  private setupAddMode(): void {
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    this.form.reset();
    this.selectedAttributeCodeDescription.set('');
    this.selectedEquipmentTypeDescription.set('');
    this.selectedParameterCodeDescription.set('');

    // Initialize filtered lists from inputs
    this.filteredEquipmentTypes.set(this.equipmentTypes);
    this.filteredParameterCodes.set(this.parameterCodes);

    // Load attribute codes for the selected attribute group
    if (this.selectedAttributeGroup) {
      this.loadAttributeCodes(this.selectedAttributeGroup);
    }
  }

  /**
   * Setup EDIT mode
   */
  private setupEditMode(): void {
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    // Remove past-date validator for effective date in edit mode
    const effDateControl = this.form.get('effDate');
    if (effDateControl) {
      effDateControl.clearValidators();
      effDateControl.setValidators([Validators.required]);
      effDateControl.updateValueAndValidity();
    }

    // Initialize filtered lists from inputs
    this.filteredEquipmentTypes.set(this.equipmentTypes);
    this.filteredParameterCodes.set(this.parameterCodes);

    this.lastModifiedDate.set('');

    if (this.data) {
      // Load attribute codes for the selected attribute group
      if (this.selectedAttributeGroup) {
        this.loadAttributeCodes(this.selectedAttributeGroup);
      }

      // Set last modified date with timestamp
      const lastModified = this.data.lastModifiedDate;
      if (lastModified) {
        this.lastModifiedDate.set(this.formatDateWithTimestamp(lastModified));
      }

      // Get values from data - use mapped frontend-friendly names
      const attributeCode = this.data.attributeCode || this.data.attribCode;
      const equipmentType = this.data.equipmentType || this.data.equipType;
      const parameterCode = this.data.parameterCode || this.data.parmCode;

      // Set all form fields (all editable in edit mode)
      const effDate = this.data.effDate ? moment(this.data.effDate) : null;
      const termDate = this.data.termDate ? moment(this.data.termDate) : null;

      this.form.patchValue({
        attributeCode: attributeCode,
        equipmentType: equipmentType,
        parameterCode: parameterCode,
        effDate: effDate,
        termDate: termDate
      });

      // Set selected descriptions for display
      this.selectedAttributeCodeDescription.set(this.data.attributeDesc || this.data.attribCodeDesc || '');
      this.selectedEquipmentTypeDescription.set(this.data.equipmentDesc || this.data.equipDesc || '');
      this.selectedParameterCodeDescription.set(this.data.parameterDesc || this.data.parmDesc || '');

      // Set min dates
      if (this.data.effDate) {
        const effMoment = moment(this.data.effDate);
        this.terminationMinDate = effMoment.isAfter(this.minDate) ? effMoment : this.minDate.clone();
      }
    }
  }


  /**
   * Load attribute codes for selected attribute group
   */
  private loadAttributeCodes(attributeGroup: string): void {
    this.isLoadingAttributeCodes.set(true);
    this.service.getAttributeCodes(attributeGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.attributeCodes.set(codes);
          this.filteredAttributeCodes.set(codes); // Also set filtered list
          this.isLoadingAttributeCodes.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingAttributeCodes.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Get chapter-aware min date
   */
  private getChapterMinDate(): Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  /**
   * Update termination min date based on effective date
   */
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

  /**
   * Setup date validation listeners
   */
  private setupDateValidationListeners(): void {
    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

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

  /**
   * Update attribute code description
   */
  updateAttributeCodeDescription(): void {
    const attributeCode = this.form.get('attributeCode')?.value;
    if (attributeCode) {
      const selected = this.attributeCodes().find(c => c.attributeCode === attributeCode);
      this.selectedAttributeCodeDescription.set(selected?.description || '');
    } else {
      this.selectedAttributeCodeDescription.set('');
    }
  }

  /**
   * Update equipment type description
   */
  updateEquipmentTypeDescription(): void {
    const equipmentType = this.form.get('equipmentType')?.value;
    if (equipmentType) {
      const selected = this.equipmentTypes.find(e => e.equipmentType === equipmentType);
      this.selectedEquipmentTypeDescription.set(selected?.description || '');
    } else {
      this.selectedEquipmentTypeDescription.set('');
    }
  }

  /**
   * Update parameter code description
   */
  updateParameterCodeDescription(): void {
    const parameterCode = this.form.get('parameterCode')?.value;
    if (parameterCode) {
      const selected = this.parameterCodes.find(p => p.parameterCode === parameterCode);
      this.selectedParameterCodeDescription.set(selected?.description || '');
    } else {
      this.selectedParameterCodeDescription.set('');
    }
  }

  /**
   * Date input handlers
   */
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

  /**
   * Get error messages for dates
   */
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

  /**
   * Submit form (Save)
   */
  onSubmit(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      return;
    }

    if (this.mode === 'add') {
      this.createRecord();
    } else {
      this.updateRecord();
    }
  }

  /**
   * Submit and create another
   */
  onSubmitAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'termDate');
    this.cdr.markForCheck();

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      return;
    }

    this.createRecord(true);
  }

  /**
   * Create new record
   */
  private createRecord(createAnother = false): void {
    this.isSaving.set(true);

    const formValue = this.form.value;
    const payload: CreateProcedureAttributeEquipmentDto = {
      attribGroup: this.selectedAttributeGroup, // Use the attribute group from filter
      attribCode: formValue.attributeCode,
      equipType: formValue.equipmentType,
      parmCode: formValue.parameterCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate)!,
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined : undefined
    };

    this.service.createAttributeEquipment(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          this.handleSuccess('Record created successfully');

          if (createAnother) {
            this.form.reset();
            this.selectedAttributeCodeDescription.set('');
            this.selectedEquipmentTypeDescription.set('');
            this.selectedParameterCodeDescription.set('');
            this.lastChangedDateField = null;
            if (this.selectedAttributeGroup) {
              this.loadAttributeCodes(this.selectedAttributeGroup);
            }
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

  /**
   * Update existing record
   */
  private updateRecord(): void {
    if (!this.data) return;

    this.isSaving.set(true);

    const formValue = this.form.value;

    // Get original composite key values to identify the record
    const originalAttribCode = this.data.attribCode;
    const originalEquipType = this.data.equipType;
    const originalParmCode = this.data.parmCode;
    const originalEffDate = typeof this.data.effDate === 'string'
      ? this.data.effDate
      : new Date(this.data.effDate).toISOString();

    // Send all editable fields in the payload
    const payload: UpdateProcedureAttributeEquipmentDto = {
      attribCode: formValue.attributeCode,
      equipType: formValue.equipmentType,
      parmCode: formValue.parameterCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate)!,
      termDate: formValue.termDate ? DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined : undefined
    };

    this.service.updateAttributeEquipment(
      this.data.attribGroup,  // Original attribute group (not editable, from filter context)
      originalAttribCode,
      originalEquipType,
      originalParmCode,
      originalEffDate,
      payload
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          this.handleSuccess('Record updated successfully');
          this.saveSuccess.emit();
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
  }

  /**
   * Close panel
   */
  onCancel(): void {
    this.closePanel.emit();
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(dateString?: string | Date): string {
    if (!dateString) return '--';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return typeof dateString === 'string' ? dateString : '--';

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Format date for display - handles Moment objects from form controls (DD-MMM-YYYY)
   */
  formatDateForDisplay(value: any): string {
    if (!value) return '-';

    // Handle Moment objects
    if (moment.isMoment(value)) {
      if (!value.isValid()) return '-';
      return value.format('DD-MMM-YYYY');
    }

    // Handle Date objects
    if (value instanceof Date) {
      return this.formatDate(value);
    }

    // Handle string dates
    if (typeof value === 'string') {
      return this.formatDate(value);
    }

    return '-';
  }

  formatDateWithTimestamp(dateString?: string | Date): string {
    if (!dateString) return '';
    let dateToParse = dateString;
    if (typeof dateToParse === 'string' && !dateToParse.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateToParse)) {
      dateToParse += this.chapterOffset || '+00:00';
    }
    const date = dateToParse instanceof Date ? dateToParse : new Date(dateToParse);
    if (isNaN(date.getTime())) return typeof dateString === 'string' ? dateString : '';

    const timeZone = this.chapterOffset || '+00:00';
    if (!TIMEZONE_OFFSET_REGEX.test(timeZone)) return '';

    const match = timeZone.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) return '';

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

  /**
   * Show success snackbar
   */
  private handleSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
