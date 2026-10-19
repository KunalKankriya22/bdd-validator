import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DonProcConsentDefinitionService } from '../services/don-proc-consent-definition.service';
import { HeaderService } from '@shared/services/header.service';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize, forkJoin, distinctUntilChanged } from 'rxjs';
import {
  DonProcConsentDefinitionModel,
  DonProcConsentDefinitionDto,
  UpdateDonProcConsentDefinitionDto
} from '../models/don-proc-consent-definition.model';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

export interface ConsentMappingFormData {
  donationType: string;
  procedureCode: string;
  consentCode: string;
  consentDescription?: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-consent-mapping',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule 
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-consent-mapping.html',
  styleUrls: ['./add-edit-consent-mapping.scss']
})
export class AddEditConsentMapping implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: DonProcConsentDefinitionModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<ConsentMappingFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    donationType: string;
    procedureCode: string;
    consentCode: string;
    consentDescription: string;
    effectiveDate: string;
    terminationDate: string;
  } = {
      donationType: '',
      procedureCode: '',
      consentCode: '',
      consentDescription: '',
      effectiveDate: '',
      terminationDate: ''
    };

  donationTypeOptions: { code: string; description: string }[] = [];
  procedureCodeOptions: { code: string; description: string }[] = [];
  consentCodeOptions: string[] = [];

  donationTypeSearchControl = new FormControl('');
  procedureCodeSearchControl = new FormControl('');
  consentCodeSearchControl = new FormControl('');

  filteredDonationTypeOptions: { code: string; description: string }[] = [];
  filteredProcedureCodeOptions: { code: string; description: string }[] = [];
  filteredConsentCodeOptions: string[] = [];

  // Store full consent code objects for description lookup
  private consentCodeData: { consentCode: string; consentDescription: string; versionNo: string }[] = [];

  isLoadingOptions = false;
  isSavingPrimary = false;
  isSavingSecondary = false;

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Store original values for edit mode (needed for update API)
  private originalValues: {
    donationType: string;
    procedureCode: string;
    consentCode: string;
    effectiveDate: string;
  } = {
      donationType: '',
      procedureCode: '',
      consentCode: '',
      effectiveDate: ''
    };

  // Minimum date for pickers (chapter's local date)
  // Now computed dynamically as getters to handle chapter changes
  private _minTermDateOverride: moment.Moment | null = null;

  // Track if edit form is being initialized
  private isInitializingEditForm = false;

  private destroy$ = new Subject<void>();

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  /**
   * Get minimum date for effective date picker (today in chapter timezone).
   * Computed dynamically to handle chapter changes.
   */
  get minDate(): moment.Moment {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  /**
   * Get minimum date for termination date picker.
   * Returns max(effectiveDate, today) if override is set, otherwise today.
   * Computed dynamically to handle chapter changes.
   */
  private get minTermDate(): moment.Moment {
    if (this._minTermDateOverride) {
      return this._minTermDateOverride;
    }
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  constructor(
    private fb: FormBuilder,
    private consentDefinitionService: DonProcConsentDefinitionService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      donationType: ['', [Validators.required]],
      procedureCode: ['', [Validators.required]],
      consentCode: ['', [Validators.required]],
      consentDescription: [''],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')
      ]
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadDropdownOptions();
    this.setupDonationTypeListener();
    this.setupConsentCodeListener();
    this.setupTerminationDateMinListener();
  }

  /**
   * Load dropdown options from API
   */
  private loadDropdownOptions(): void {
    this.isLoadingOptions = true;

    const chapterId = this.headerService.getCurrentChapterId();
    this.consentDefinitionService.getCreateData(chapterId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Extract data from response
          let createData = (response as any).data;

          if (createData) {
            if (Array.isArray(createData.donationTypes)) {
              this.donationTypeOptions = createData.donationTypes.map((dt: any) => ({
                code: dt.donationType,
                description: dt.description || ''
              }));
            } else {
              this.donationTypeOptions = [];
            }

            // Map consent codes to extract just the consentCode codes
            if (Array.isArray(createData.consentCodes)) {
              // Store full consent code data for description lookup
              this.consentCodeData = createData.consentCodes;
              // Extract just the codes for dropdown
              this.consentCodeOptions = createData.consentCodes.map((cc: any) => cc.consentCode);
            } else {
              this.consentCodeData = [];
              this.consentCodeOptions = [];
            }
          } else {
            this.donationTypeOptions = [];
            this.consentCodeData = [];
            this.consentCodeOptions = [];
            

          }
          this.ensureEditValuesInOptions();
          this.setupDropdownSearch();
          this.isLoadingOptions = false;
        },
        error: () => {
          this.donationTypeOptions = [];
          this.consentCodeData = [];
          this.consentCodeOptions = [];
          this.ensureEditValuesInOptions();
          this.isLoadingOptions = false;
        }
      });
  }

  private ensureEditValuesInOptions(): void {
    if (this.mode !== 'edit' || !this.data) return;

    if (this.data.donationType && !this.donationTypeOptions.some(o => o.code === this.data!.donationType)) {
      this.donationTypeOptions.unshift({ code: this.data.donationType, description: this.data.donationType });
    }

    if (this.data.consentCode && !this.consentCodeOptions.includes(this.data.consentCode)) {
      this.consentCodeOptions.unshift(this.data.consentCode);
    }

    this.filteredDonationTypeOptions = [...this.donationTypeOptions];
    this.filteredConsentCodeOptions = [...this.consentCodeOptions];
  }

  /**
   * Setup listener for donation type changes to load procedure codes
   */
  private setupDonationTypeListener(): void {
    this.form.get('donationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((donationType: string) => {
        if (donationType) {
          this.loadProcedureCodes(donationType);
        } else {
          // Clear procedure codes if donation type is cleared
          this.procedureCodeOptions = [];
          this.form.get('procedureCode')?.setValue(null);
        }
      });
  }

  /**
   * Setup listener for consent code changes to auto-populate description
   */
  private setupConsentCodeListener(): void {
    this.form.get('consentCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((consentCode: string) => {
        if (consentCode) {
          // Find the matching consent code object
          const consentData = this.consentCodeData.find(cc => cc.consentCode === consentCode);
          if (consentData) {
            // Auto-populate the consent description
            this.form.get('consentDescription')?.setValue(consentData.consentDescription);
          }
        } else {
          // Clear description if consent code is cleared
          this.form.get('consentDescription')?.setValue('');
        }
      });
  }

  /**
   * Setup listener for effective date changes to update minimum termination date.
   * Ensures termination date is always >= max(effectiveDate, today).
   */
  private setupTerminationDateMinListener(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.lastChangedDateField = 'effective';
        const utcToday = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        if (value && moment.isMoment(value) && value.isValid()) {
          this._minTermDateOverride = value.isAfter(utcToday) ? value.clone() : utcToday;
        } else {
          this._minTermDateOverride = null;
        }
        this.form.get('terminationDate')?.updateValueAndValidity();
      });

    this.form.get('terminationDate')?.valueChanges
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
   * Check if form values differ from original values
   */
  private checkIfFormHasChanges(): boolean {
    if (this.mode !== 'edit' || !this.data) {
      return false;
    }

    const currentValues = this.form.getRawValue();

    // Compare each field with original values
    const donationTypeChanged = currentValues.donationType !== this.originalValues.donationType;
    const procedureCodeChanged = currentValues.procedureCode !== this.originalValues.procedureCode;
    const consentCodeChanged = currentValues.consentCode !== this.originalValues.consentCode;

    // Compare dates by converting to ISO strings using consistent formatting
    const currentEffectiveDate = this.formatDateForAPI(currentValues.effectiveDate);
    const effectiveDateChanged = currentEffectiveDate !== this.originalValues.effectiveDate;

    // Use formatDateForAPI for consistent date comparison (midnight UTC)
    const originalTerminationDate = this.data.terminationDate
      ? this.formatDateForAPI(moment(this.data.terminationDate))
      : null;
    const currentTerminationDate = this.formatDateForAPI(currentValues.terminationDate);
    const terminationDateChanged = currentTerminationDate !== originalTerminationDate;

    return donationTypeChanged || procedureCodeChanged || consentCodeChanged ||
           effectiveDateChanged || terminationDateChanged;
  }

  /**
   * Load procedure codes for selected donation type
   */
  private loadProcedureCodes(donationType: string): void {
    this.isLoadingOptions = true;

    const chapterId = this.headerService.getCurrentChapterId();
    this.consentDefinitionService.getProcedureCodesByDonationType(donationType, chapterId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Extract data from response
          const procedureData = (response as any).data;

          if (Array.isArray(procedureData)) {
            const seen = new Set<string>();
            this.procedureCodeOptions = procedureData
              .filter((p: any) => {
                if (seen.has(p.procedureCode)) return false;
                seen.add(p.procedureCode);
                return true;
              })
              .map((p: any) => ({ code: p.procedureCode, description: p.description || '' }));
          } else {
            this.procedureCodeOptions = [];
          }

          this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];
        this.procedureCodeSearchControl.setValue('');

          // Clear procedure code selection when donation type changes
          // (unless we're in edit mode and the procedure code is already set)
          if (this.mode === 'add') {
            this.form.get('procedureCode')?.setValue(null);
          }

          this.isLoadingOptions = false;
        },
        error: () => {
          this.procedureCodeOptions = [];
          this.filteredProcedureCodeOptions = [];
          this.procedureCodeSearchControl.setValue('');
          this.isLoadingOptions = false;
        }
      });
  }

  private setupDropdownSearch(): void {
  this.filteredDonationTypeOptions = [...this.donationTypeOptions];
  this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];
  this.filteredConsentCodeOptions = [...this.consentCodeOptions];

  this.donationTypeSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      this.filteredDonationTypeOptions = !search
        ? [...this.donationTypeOptions]
        : this.donationTypeOptions.filter(o =>
            o.code.toLowerCase().includes(search.toLowerCase()) ||
            o.description.toLowerCase().includes(search.toLowerCase()));
    });

  this.procedureCodeSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      this.filteredProcedureCodeOptions = !search
        ? [...this.procedureCodeOptions]
        : this.procedureCodeOptions.filter(o =>
            o.code.toLowerCase().includes(search.toLowerCase()) ||
            o.description.toLowerCase().includes(search.toLowerCase()));
    });

  this.consentCodeSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      this.filteredConsentCodeOptions = !search
        ? [...this.consentCodeOptions]
        : this.consentCodeOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()));
    });
}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['data']) {
      if (!changes['mode']?.firstChange && !changes['data']?.firstChange) {
        this.setupPanel();

        if (this.mode === 'add') {
          this.resetFormForAddMode();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPanel(): void {
    if (this.mode === 'add') {
      this.panelTitle = 'Add New Consent Mapping';
      this.lastUpdated = '';
      this.isInitializingEditForm = false;
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      this.panelTitle = 'Edit Consent Mapping';
      this.lastUpdated = `Last Updated: ${this.formatDateTime(new Date())}`;
      this.populateFormForEdit();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
      // Re-enable effective date after setupEditModeValidators disables it —
      // Figma spec requires effective date to be editable in edit mode for consent mappings
      this.form.get('effectiveDate')?.enable();
      this.form.get('effectiveDate')?.setValidators([Validators.required]);
      this.form.get('effectiveDate')?.updateValueAndValidity();
    }
  }

  private resetFormForAddMode(): void {
    this.isInitializingEditForm = false;
    this.lastChangedDateField = null;

    this.editModeValues = {
      donationType: '',
      procedureCode: '',
      consentCode: '',
      consentDescription: '',
      effectiveDate: '',
      terminationDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('donationType')?.enable();
    this.form.get('procedureCode')?.enable();
    this.form.get('consentCode')?.enable();
    this.form.get('effectiveDate')?.enable();

    // Restore required validators for add mode
    this.form.get('donationType')?.setValidators([Validators.required]);
    this.form.get('procedureCode')?.setValidators([Validators.required]);
    this.form.get('consentCode')?.setValidators([Validators.required]);
    this.form.get('effectiveDate')?.setValidators([Validators.required]);
    this.form.get('consentDescription')?.clearValidators();

    // Update validity
    this.form.get('donationType')?.updateValueAndValidity();
    this.form.get('procedureCode')?.updateValueAndValidity();
    this.form.get('consentCode')?.updateValueAndValidity();
    this.form.get('consentDescription')?.updateValueAndValidity();
    this.form.get('effectiveDate')?.updateValueAndValidity();
  }

  private populateFormForEdit(): void {
    if (this.data) {
      this.isInitializingEditForm = true;

      const donationType = this.data.donationType || '';
      const procedureCode = this.data.procedureCode || '';
      const consentCode = this.data.consentCode || '';
      const consentDescription = this.data.consentDescription || '';

      // Store original values for update API
      // Use formatDateForAPI to ensure consistent date formatting
      const effectiveDateMoment = this.data.effectiveDate ? moment(this.data.effectiveDate) : null;

      this.originalValues = {
        donationType: donationType,
        procedureCode: procedureCode,
        consentCode: consentCode,
        effectiveDate: this.formatDateForAPI(effectiveDateMoment) || new Date().toISOString()
      };

      this.editModeValues = {
        donationType,
        procedureCode,
        consentCode,
        consentDescription,
        effectiveDate: this.data.effectiveDate ? this.formatDateForDisplay(this.data.effectiveDate) : '',
        terminationDate: this.data.terminationDate ? this.formatDateForDisplay(this.data.terminationDate) : ''
      };

      this.form.get('donationType')?.enable();
      this.form.get('procedureCode')?.enable();
      this.form.get('effectiveDate')?.enable();
      this.form.get('consentCode')?.disable();

      // Set validators for all required fields
      this.form.get('donationType')?.setValidators([Validators.required]);
      this.form.get('procedureCode')?.setValidators([Validators.required]);
      this.form.get('consentCode')?.setValidators([Validators.required]);
      this.form.get('effectiveDate')?.setValidators([Validators.required]);
      this.form.get('consentDescription')?.clearValidators();

      // Update validity
      this.form.get('donationType')?.updateValueAndValidity();
      this.form.get('procedureCode')?.updateValueAndValidity();
      this.form.get('consentCode')?.updateValueAndValidity();
      this.form.get('effectiveDate')?.updateValueAndValidity();
      this.form.get('consentDescription')?.updateValueAndValidity();

      // Set form values first (except procedureCode which needs options loaded first)
      // Use emitEvent: false to prevent triggering change detection during initial setup
      this.form.patchValue({
        donationType,
        consentCode,
        consentDescription,
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null
      }, { emitEvent: false });

      // Load procedure codes for the selected donation type in edit mode
      // Then set the procedureCode value after options are loaded
      if (donationType) {
        this.loadProcedureCodesForEdit(donationType, procedureCode);
      }

      // Set minTermDate for edit mode: max(effDate, utcToday)
      if (this.data.effectiveDate) {
        const utcToday = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        const eff = moment(this.data.effectiveDate);
        this._minTermDateOverride = eff.isAfter(utcToday) ? eff : utcToday;
      }
    }
  }

  /**
   * Load procedure codes for edit mode and set the current value
   */
  private loadProcedureCodesForEdit(donationType: string, procedureCode: string): void {
    this.isLoadingOptions = true;

    const chapterId = this.headerService.getCurrentChapterId();
    this.consentDefinitionService.getProcedureCodesByDonationType(donationType, chapterId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Extract data from response
          const procedureData = (response as any).data;

          if (Array.isArray(procedureData)) {
            const seen = new Set<string>();
            this.procedureCodeOptions = procedureData
              .filter((p: any) => {
                if (seen.has(p.procedureCode)) return false;
                seen.add(p.procedureCode);
                return true;
              })
              .map((p: any) => ({ code: p.procedureCode, description: p.description || '' }));
          } else {
            this.procedureCodeOptions = [];
          }

          if (procedureCode && !this.procedureCodeOptions.some(o => o.code === procedureCode)) {
            this.procedureCodeOptions.unshift({ code: procedureCode, description: procedureCode });
          }

          this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];
          this.procedureCodeSearchControl.setValue('');

          this.form.patchValue({
            procedureCode: procedureCode
          }, { emitEvent: false });

          this.isLoadingOptions = false;
          this.isInitializingEditForm = false;
        },
        error: () => {
          this.procedureCodeOptions = [];
          this.isLoadingOptions = false;
          this.isInitializingEditForm = false;
        }
      });
  }

  /**
   * Format date for API submission with ISO timestamp
   * Returns ISO date string with timezone (e.g., "2026-03-17T00:00:00.000Z")
   * Returns null if momentDate is null/undefined
   * Converts to UTC preserving the local date value (no timezone shift)
   */
  private formatDateForAPI(momentDate: any): string | null {
    if (!momentDate) {
      return null;
    }

    // Extract date components and create UTC date at midnight
    const year = momentDate.year();
    const month = momentDate.month();
    const day = momentDate.date();

    const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return utcDate.toISOString();
  }

  private formatDateForDisplay(date: Date | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSavingPrimary = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: DonProcConsentDefinitionDto = {
        donationType: formValue.donationType?.trim() || '',
        procedureCode: formValue.procedureCode?.trim() || '',
        consentCode: formValue.consentCode?.trim() || '',
        effectiveDate: this.formatDateForAPI(formValue.effectiveDate),
        terminationDate: this.formatDateForAPI(formValue.terminationDate),
        chapterId: this.headerService.getCurrentChapterId()
      };
      apiCall = this.consentDefinitionService.addConsentDefinition(addPayload);
    } else {
      const updatePayload: UpdateDonProcConsentDefinitionDto = {
        // Current values (to identify the record)
        currentDonationType: this.originalValues.donationType,
        currentProcedureCode: this.originalValues.procedureCode,
        currentConsentCode: this.originalValues.consentCode,
        currentEffectiveDate: this.originalValues.effectiveDate,

        // New values (all fields)
        donationType: formValue.donationType?.trim() || '',
        procedureCode: formValue.procedureCode?.trim() || '',
        effectiveDate: this.formatDateForAPI(formValue.effectiveDate),
        terminationDate: this.formatDateForAPI(formValue.terminationDate),
        chapterId: this.headerService.getCurrentChapterId(),
        consentCode: formValue.consentCode?.trim() || '',
        consentDescription: formValue.consentDescription?.trim() || ''
      };
      apiCall = this.consentDefinitionService.updateConsentDefinition(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSavingPrimary = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || (this.mode === 'add'
            ? 'Consent Mapping added successfully'
            : 'Consent Mapping updated successfully');

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: ConsentMappingFormData = {
            donationType: formValue.donationType?.trim() || '',
            procedureCode: formValue.procedureCode?.trim() || '',
            consentCode: formValue.consentCode?.trim() || '',
            consentDescription: formValue.consentDescription?.trim() || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);
          this.closePanel.emit();
        },
        error: (error) => {
          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This consent mapping already exists';
            } else if (error.status === 404) {
              errorMessage = 'Consent mapping not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.errors?.['dateRangeInvalid'] && !this.lastChangedDateField) {
      this.lastChangedDateField = 'effective';
    }

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    this.isSavingSecondary = true;

    let apiCall;

    if (this.mode === 'add') {
      const addPayload: DonProcConsentDefinitionDto = {
        donationType: formValue.donationType?.trim() || '',
        procedureCode: formValue.procedureCode?.trim() || '',
        consentCode: formValue.consentCode?.trim() || '',
        effectiveDate: this.formatDateForAPI(formValue.effectiveDate),
        terminationDate: this.formatDateForAPI(formValue.terminationDate),
        chapterId: this.headerService.getCurrentChapterId()
      };
      apiCall = this.consentDefinitionService.addConsentDefinition(addPayload);
    } else {
      const updatePayload: UpdateDonProcConsentDefinitionDto = {
        // Current values (to identify the record)
        currentDonationType: this.originalValues.donationType,
        currentProcedureCode: this.originalValues.procedureCode,
        currentConsentCode: this.originalValues.consentCode,
        currentEffectiveDate: this.originalValues.effectiveDate,

        // New values (all fields)
        donationType: formValue.donationType?.trim() || '',
        procedureCode: formValue.procedureCode?.trim() || '',
        effectiveDate: this.formatDateForAPI(formValue.effectiveDate),
        terminationDate: this.formatDateForAPI(formValue.terminationDate),
        chapterId: this.headerService.getCurrentChapterId(),
        consentCode: formValue.consentCode?.trim() || '',
        consentDescription: formValue.consentDescription?.trim() || ''
      };
      apiCall = this.consentDefinitionService.updateConsentDefinition(updatePayload);
    }

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSavingSecondary = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Operation completed successfully';

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: ConsentMappingFormData = {
            donationType: formValue.donationType?.trim() || '',
            procedureCode: formValue.procedureCode?.trim() || '',
            consentCode: formValue.consentCode?.trim() || '',
            consentDescription: formValue.consentDescription?.trim() || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);

          if (this.mode === 'edit') {
            this.mode = 'add';
            this.modeChange.emit('add');
            this.resetFormForAddMode();
            this.setupPanel();
          } else {
            this.resetFormForAddMode();
          }
        },
        error: (error) => {
          let errorMessage = error.error?.message;

          if (!errorMessage) {
            if (error.status === 409) {
              errorMessage = 'This consent mapping already exists';
            } else if (error.status === 404) {
              errorMessage = 'Consent mapping not found';
            } else {
              errorMessage = 'An error occurred while saving';
            }
          }

        }
      });
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], HH:mm [PST]');
    } else {
      return momentDate.format('DD-MMM-YYYY, HH:mm [PST]');
    }
  }

  get donationTypeControl() {
    return this.form.get('donationType');
  }

  get procedureCodeControl() {
    return this.form.get('procedureCode');
  }

  get consentCodeControl() {
    return this.form.get('consentCode');
  }

  get consentDescriptionControl() {
    return this.form.get('consentDescription');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getDonationTypeError(): string {
    const control = this.donationTypeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Donation Type is required';
    }
    return '';
  }

  getProcedureCodeError(): string {
    const control = this.procedureCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Procedure Code is required';
    }
    return '';
  }

  getConsentCodeError(): string {
    const control = this.consentCodeControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Consent Code is required';
    }
    return '';
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

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      const hasFieldErrors =
        !!this.form.get('donationType')?.errors ||
        !!this.form.get('procedureCode')?.errors;
      const hasDateErrors = this.getTerminationDateError() !== '';
      return !hasFieldErrors && !hasDateErrors;
    }
    return this.form.valid;
  }

  get hasFormChanges(): boolean {
    if (this.isInitializingEditForm) {
      return false;
    }
    return this.form.dirty || this.checkIfFormHasChanges();
  }

  /**
   * Get minimum date for Termination Date picker.
   * Returns max(effectiveDate, today) to prevent past dates.
   */
  get minTerminationDate() {
    return this.minTermDate;
  }

  getConsentDescription(): string {
    return this.form.get('consentDescription')?.value || '';
  }

  getConsentDescriptionForCode(code: string): string {
    const match = this.consentCodeData.find(cc => cc.consentCode === code);
    return match?.consentDescription || '';
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onEffectiveDateChange(): void {
    this.form.get('effectiveDate')?.markAsTouched();
    this.form.get('effectiveDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  onTerminationDateChange(): void {
    this.form.get('terminationDate')?.markAsTouched();
    this.form.get('terminationDate')?.markAsDirty();
    this.form.updateValueAndValidity();
  }
}
