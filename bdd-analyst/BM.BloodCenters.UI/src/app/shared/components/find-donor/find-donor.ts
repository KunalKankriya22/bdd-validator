import { Component, Inject, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import moment from 'moment';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { FindDonorService } from './find-donor.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import {
  FindDonorDialogData,
  FindDonorDialogResult,
  FindDonorResult,
  FindDonorSearchCriteria,
  AlternateIdType,
  DonorLookupResponse,
  FindDonorConfig
} from './find-donor.model';

@Component({
  selector: 'app-find-donor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './find-donor.html',
  styleUrls: ['./find-donor.scss']
})
export class FindDonorDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly findDonorService = inject(FindDonorService);
  private readonly confirmDialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  maxDob = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  private readonly destroy$ = new Subject<void>();
  private readonly lookupCancel$ = new Subject<void>();

  searchForm!: FormGroup;
  results: FindDonorResult[] = [];
  selectedDonor: FindDonorResult | null = null;
  loading = false;
  isLookingUpDonorId = false;
  hasSearched = false;
  private searchedCriteria: Record<string, string> = {};

  private isAllowed(flag: string): boolean {
    return flag === 'Y' || flag === 'O';
  }

  get canCreateNew(): boolean {
    if (!this.hasSearched) return false;
    if (this.searchForm?.invalid) return false;
    const f = this.searchForm?.value;
    const fields = this.config.fields;
    if (!fields || Object.keys(fields).length === 0) {
      return !!(f?.lastName && f?.firstName && f?.dob && f?.sex);
    }
    if (fields['LAST_NAME']?.required && !f?.lastName) return false;
    if (fields['DATE_OF_BIRTH']?.required && !f?.dob) return false;
    if (fields['GENDER']?.required && !f?.sex) return false;
    if (fields['FIRST_NAME']?.required && !f?.firstName) return false;
    return !!(f?.lastName || f?.firstName || f?.dob || f?.sex);
  }

  get isNewDisabled(): boolean {
    if (!this.isAllowed(this.config.allowNew)) return true;
    if (!this.canCreateNew) return true;
    if (this.results.length === 0) return false;
    const selectL = this.config.selectAllowedLevels ?? 5;
    if (this.results.length === 1) {
      const grade = this.results[0]?.grade ?? 0;
      if (grade <= selectL) {
        return this.config.allowNew !== 'Y';
      }
      const newL = this.config.newAllowedLevel ?? 1;
      return !(this.isAllowed(this.config.allowNew) && grade >= newL);
    }
    const newL = this.config.newAllowedLevel ?? 1;
    const allAboveThreshold = this.results.every(r => (r.grade ?? 0) >= newL);
    return !(this.isAllowed(this.config.allowNew) && allAboveThreshold);
  }

  get isSelectDisabled(): boolean {
    if (!this.isAllowed(this.config.allowSelect)) return true;
    if (!this.selectedDonor) return true;
    const selectL = this.config.selectAllowedLevels ?? 5;
    const selectedGrade = this.selectedDonor.grade ?? 999;
    if (selectedGrade > selectL) return true;
    const selectML = this.config.selectAllowedMultilevel;
    if (this.results.length > 1 && (!selectML || selectML === 1)) return true;
    return false;
  }

  get isHoldDisabled(): boolean {
    if (!this.isAllowed(this.config.allowHold)) return true;
    if (!this.hasSearched) return true;
    if (this.results.length === 0) return true;
    const selectL = this.config.selectAllowedLevels ?? 5;
    if (this.results.length === 1) {
      const grade = this.results[0]?.grade ?? 0;
      return grade <= selectL;
    }
    return false;
  }

  alternateIdTypes: AlternateIdType[] = [];
  config: FindDonorConfig = {
    confirmatoryField: 'N',
    firstNameVisible: true,
    donorIdEnabled: false,
    donorIdDoubleEntry: false,
    allowNew: 'N',
    allowSelect: 'N',
    allowHold: 'N',
    selectAllowedLevels: 5,
    newAllowedLevel: 1,
    selectAllowedMultilevel: 0,
    gradingLevel: 5,
    altIdMode: 'A',
    fields: {}
  };
  private doubleEntryValues: Record<string, string | null> = {};
  doubleEntryState: Record<string, 'idle' | 'pending' | 'mismatch'> = {};
  private confirmatoryLookupData: { lastName?: string; dob?: string; firstName?: string } | null = null;
  private donorLookupPopulatedFields = new Set<string>();

  private backgroundUnitId: string | null = null;

  // Search control for searchable Type dropdown
  readonly typeSearchControl = new FormControl('');

  // Signals for search filtering
  private readonly typeSearch = signal('');
  private readonly alternateIdTypesSignal = signal<AlternateIdType[]>([]);

  readonly filteredAlternateIdTypes = computed(() => {
    const search = this.typeSearch().toLowerCase();
    const types = this.alternateIdTypesSignal();
    if (!search) return types;
    return types.filter(t => t.code.toLowerCase().includes(search));
  });

  sexOptions = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' }
  ];

  displayedColumns: string[] = [
    'grade',
    'donorId',
    'lastName',
    'firstName',
    'middleName',
    'dob',
    'sex',
    'aboRh',
    'alternateId'
  ];

  constructor(
    public dialogRef: MatDialogRef<FindDonorDialog>,
    @Inject(MAT_DIALOG_DATA) public data: FindDonorDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAlternateIdTypes();
    this.loadConfig();

    // Subscribe to search control changes
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.typeSearch.set(value || ''));

    if (this.data?.prefilledCriteria) {
      this.searchForm.patchValue(this.data.prefilledCriteria);
    }

    if (this.data?.searchOnOpen) {
      if (this.data.searchOnOpen.unitId) {
        this.backgroundUnitId = this.data.searchOnOpen.unitId;
      }
      this.searchForm.patchValue(this.data.searchOnOpen);
      this.searchWithCriteria(this.data.searchOnOpen);
    }
  }

  ngOnDestroy(): void {
    this.lookupCancel$.next();
    this.lookupCancel$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      scanId: ['', [FindDonorDialog.scanIdLengthValidator]],
      donorId: [''],
      alternateIdType: [''],
      alternateId: [''],
      lastName: ['', [Validators.pattern(/^[a-zA-Z\s'\-]*$/)]],
      dob: [''],
      sex: [''],
      firstName: ['']
    }, { validators: FindDonorDialog.nameFieldRequiredValidator });
  }

  static scanIdLengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;
    if (value.length !== 13) return { scanIdLength: true };
    return null;
  }

  static nameFieldRequiredValidator(group: AbstractControl): ValidationErrors | null {
    const lastName = group.get('lastName')?.value;
    const firstName = group.get('firstName')?.value;
    const dob = group.get('dob')?.value;
    const sex = group.get('sex')?.value;
    const scanId = group.get('scanId')?.value;
    const donorId = group.get('donorId')?.value;

    if (scanId || donorId) return null;

    if (!lastName && !firstName && !dob && !sex) {
      return { nameFieldRequired: true };
    }

    return null;
  }

  validateDob(): void {
    const dob = this.searchForm.get('dob');
    if (!dob?.value) return;
    const dobMoment = moment(dob.value);
    if (dobMoment.isValid() && dobMoment.isAfter(this.maxDob)) {
      dob.setErrors({ ...dob.errors, futureDob: true });
    } else if (dob.hasError('futureDob')) {
      const { futureDob, ...remaining } = dob.errors || {};
      dob.setErrors(Object.keys(remaining).length ? remaining : null);
    }
  }

  onDobInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    const dob = this.searchForm.get('dob');
    if (!dob) return;
    if (!input?.trim()) {
      dob.setValue(null, { emitEvent: false });
      dob.setErrors(null);
    } else if (!dob.value) {
      dob.markAsTouched();
      dob.setErrors({ invalidDate: true });
    }
  }

  isFieldRequired(fieldKey: string): boolean {
    return !!this.config.fields?.[fieldKey]?.required;
  }

  private loadConfig(): void {
    this.findDonorService.getConfig(this.data?.programName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cfg) => {
          this.config = cfg;
          if (!cfg.firstNameVisible) {
            this.searchForm.get('firstName')?.disable();
          }
          if (!cfg.donorIdEnabled) {
            this.searchForm.get('donorId')?.disable();
          }
          if (cfg.altIdMode !== 'A') {
            this.searchForm.get('alternateIdType')?.disable();
            this.searchForm.get('alternateId')?.disable();
          }
          this.applyRequiredValidators(cfg);
        },
        error: () => {}
      });
  }

  private applyRequiredValidators(cfg: FindDonorConfig): void {
    if (!cfg.fields) return;
    const fieldMap: Record<string, string> = {
      'LAST_NAME': 'lastName',
      'DATE_OF_BIRTH': 'dob',
      'GENDER': 'sex',
      'FIRST_NAME': 'firstName'
    };
    for (const [key, controlName] of Object.entries(fieldMap)) {
      const ctrl = this.searchForm.get(controlName);
      if (!ctrl) continue;
      if (cfg.fields[key]?.required) {
        const existing = controlName === 'lastName'
          ? [Validators.required, Validators.pattern(/^[a-zA-Z\s'\-]*$/)]
          : [Validators.required];
        ctrl.setValidators(existing);
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private loadAlternateIdTypes(): void {
    this.findDonorService.getAlternateIdTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.alternateIdTypes = types;
          this.alternateIdTypesSignal.set(types);
        },
        error: () => this.snackbarService.showError('Failed to load ID types')
      });
  }

  onUppercaseInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      const selStart = input.selectionStart;
      const selEnd = input.selectionEnd;
      input.value = upper;
      input.setSelectionRange(selStart, selEnd);
      this.searchForm.get(controlName)?.setValue(upper, { emitEvent: false });
    }
  }

  private readonly fieldKeyMap: Record<string, string> = {
    lastName: 'LAST_NAME',
    dob: 'DATE_OF_BIRTH',
    sex: 'GENDER',
    firstName: 'FIRST_NAME',
    alternateId: 'ALT_ID',
    alternateIdType: 'ALT_ID_TYPE',
    donorId: 'D_DONOR_ID'
  };

  private isDoubleEntryRequired(fieldName: string): boolean {
    if (fieldName === 'donorId') return !!this.config.donorIdDoubleEntry;
    const fieldKey = this.fieldKeyMap[fieldName] ?? fieldName;
    return !!this.config.fields?.[fieldKey]?.doubleEntry;
  }

  checkDoubleEntry(fieldName: string, value: string): 'confirmed' | 'mismatch' | 'waiting' {
    if (!this.isDoubleEntryRequired(fieldName)) return 'confirmed';
    if (this.doubleEntryValues[fieldName] === undefined || this.doubleEntryValues[fieldName] === null) {
      this.doubleEntryValues[fieldName] = value;
      return 'waiting';
    }
    if (this.doubleEntryValues[fieldName] !== value) {
      this.doubleEntryValues[fieldName] = null;
      return 'mismatch';
    }
    this.doubleEntryValues[fieldName] = null;
    return 'confirmed';
  }

  onFieldDoubleEntryBlur(fieldName: string): void {
    if (this.donorLookupPopulatedFields.size > 0) return;
    const value = this.searchForm.get(fieldName)?.value?.trim?.() ?? this.searchForm.get(fieldName)?.value;
    if (!value) {
      this.doubleEntryState[fieldName] = 'idle';
      return;
    }
    const ctrl = this.searchForm.get(fieldName);
    const result = this.checkDoubleEntry(fieldName, String(value));
    if (result === 'waiting') {
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.markAsUntouched();
      this.doubleEntryState[fieldName] = 'pending';
    } else if (result === 'mismatch') {
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.markAsTouched();
      this.doubleEntryState[fieldName] = 'mismatch';
    } else {
      this.doubleEntryState[fieldName] = 'idle';
    }
  }

  onDonorIdBlur(): void {
    const donorId = this.searchForm.get('donorId')?.value?.trim();
    if (!donorId) return;
    this.backgroundUnitId = null;

    const donorIdCtrl = this.searchForm.get('donorId');
    const deResult = this.checkDoubleEntry('donorId', donorId);
    if (deResult === 'waiting') {
      donorIdCtrl?.setValue('', { emitEvent: false });
      donorIdCtrl?.markAsUntouched();
      this.doubleEntryState['donorId'] = 'pending';
      return;
    }
    if (deResult === 'mismatch') {
      donorIdCtrl?.setValue('', { emitEvent: false });
      donorIdCtrl?.setErrors({ doubleEntryMismatch: true });
      donorIdCtrl?.markAsTouched();
      this.doubleEntryState['donorId'] = 'mismatch';
      return;
    }

    this.doubleEntryState['donorId'] = 'idle';
    this.lookupCancel$.next();
    this.isLookingUpDonorId = true;
    this.findDonorService.lookupDonorId(donorId)
      .pipe(takeUntil(this.destroy$), takeUntil(this.lookupCancel$))
      .subscribe({
        next: (response: DonorLookupResponse) => {
          this.isLookingUpDonorId = false;
          if (response.success && response.item) {
            this.searchForm.patchValue({
              lastName: response.item.lastName,
              firstName: response.item.firstName,
              dob: response.item.dateOfBirth ? moment(response.item.dateOfBirth) : null,
              sex: response.item.gender,
              alternateId: response.item.alternateId || '',
              alternateIdType: response.item.alternateIdType || ''
            });
            this.donorLookupPopulatedFields = new Set(['lastName', 'firstName', 'dob', 'sex']);
            if (this.config.fields?.['D_DONOR_ID']?.protectedEntry && this.config.confirmatoryField && this.config.confirmatoryField !== 'N') {
              this.confirmatoryLookupData = {
                lastName: response.item.lastName,
                dob: response.item.dateOfBirth,
                firstName: response.item.firstName
              };
              if (this.config.confirmatoryField === 'L') {
                this.searchForm.get('lastName')?.setValue('');
                this.snackbarService.showInfo('Please confirm Last Name');
              } else if (this.config.confirmatoryField === 'F') {
                this.searchForm.get('firstName')?.setValue('');
                this.snackbarService.showInfo('Please confirm First Name');
              } else {
                this.searchForm.get('dob')?.setValue(null);
                this.snackbarService.showInfo('Please confirm Date of Birth');
              }
            }
          }
        },
        error: (err) => {
          this.isLookingUpDonorId = false;
          const status = err?.status ?? err?.error?.statusCode;
          const errorCode = err?.error?.errorCode;
          if (status === 404 && errorCode === '16066') {
            this.snackbarService.showError('Donor does not exist');
            this.searchForm.patchValue({ lastName: '', firstName: '', dob: null, sex: '' });
          }
        }
      });
  }

  onConfirmatoryFieldBlur(field: 'lastName' | 'dob' | 'firstName'): void {
    if (!this.confirmatoryLookupData) return;

    if (field === 'lastName' && this.config.confirmatoryField === 'L') {
      const entered = this.searchForm.get('lastName')?.value?.trim()?.toUpperCase();
      const expected = this.confirmatoryLookupData.lastName?.trim()?.toUpperCase();
      if (entered && expected && entered !== expected) {
        this.snackbarService.showError('Last name does not match donor record');
        this.searchForm.get('lastName')?.setValue('');
        return;
      }
      this.confirmatoryLookupData = null;
      this.onSearch();
    } else if (field === 'dob' && this.config.confirmatoryField === 'D') {
      const enteredDob = this.searchForm.get('dob')?.value;
      if (enteredDob && this.confirmatoryLookupData.dob) {
        const enteredStr = this.formatDobForApi(enteredDob);
        const expectedMoment = moment(this.confirmatoryLookupData.dob);
        const expectedStr = expectedMoment.isValid() ? expectedMoment.format('MM/DD/YYYY') : '';
        if (enteredStr && expectedStr && enteredStr !== expectedStr) {
          this.snackbarService.showError('Date of birth does not match donor record');
          this.searchForm.get('dob')?.setValue(null);
          return;
        }
      }
      this.confirmatoryLookupData = null;
      this.onSearch();
    } else if (field === 'firstName' && this.config.confirmatoryField === 'F') {
      const entered = this.searchForm.get('firstName')?.value?.trim()?.toUpperCase();
      const expected = this.confirmatoryLookupData.firstName?.trim()?.toUpperCase();
      if (entered && expected && entered !== expected) {
        this.snackbarService.showError('First name does not match donor record');
        this.searchForm.get('firstName')?.setValue('');
        return;
      }
      this.confirmatoryLookupData = null;
      this.onSearch();
    }
  }

  hasAnySearchCriteria(): boolean {
    const values = this.searchForm.value;
    return Object.keys(values).some(key => {
      const v = values[key];
      return v !== '' && v !== null && v !== undefined;
    });
  }

  private searchWithCriteria(criteria: FindDonorSearchCriteria): void {
    this.loading = true;
    this.hasSearched = true;
    this.selectedDonor = null;

    const payload: Record<string, string | undefined> = {};
    if (criteria.unitId) payload['unitId'] = criteria.unitId;
    if (criteria.scanId) payload['scanId'] = criteria.scanId;
    if (criteria.donorId) payload['donorId'] = criteria.donorId;
    if (criteria.lastName) payload['lastName'] = criteria.lastName;
    if (criteria.firstName) payload['firstName'] = criteria.firstName;
    if (criteria.dob) payload['dob'] = criteria.dob;
    if (criteria.sex) payload['sex'] = criteria.sex;
    if (criteria.alternateId) payload['alternateId'] = criteria.alternateId;
    if (criteria.alternateIdType) payload['alternateIdType'] = criteria.alternateIdType;
    if (this.data?.programName) payload['programName'] = this.data.programName;

    this.searchedCriteria = { ...payload } as Record<string, string>;

    this.findDonorService.searchDonors(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.results = response.data;
          this.autoSelectSingleGoodGrade();
          this.loading = false;
        },
        error: () => {
          this.results = [];
          this.loading = false;
        }
      });
  }

  onSearch(): void {
    if (!this.hasAnySearchCriteria()) {
      return;
    }
    this.searchForm.markAllAsTouched();
    if (this.searchForm.invalid) {
      return;
    }

    this.loading = true;
    this.hasSearched = true;
    this.selectedDonor = null;

    const formValue = this.searchForm.value;
    const criteria: Record<string, string | undefined> = {};

    if (formValue.scanId) criteria['scanId'] = formValue.scanId;
    if (formValue.donorId) criteria['donorId'] = formValue.donorId;
    if (formValue.lastName) criteria['lastName'] = formValue.lastName;
    if (formValue.firstName) criteria['firstName'] = formValue.firstName;
    if (formValue.dob) criteria['dob'] = this.formatDobForApi(formValue.dob);
    if (formValue.sex) criteria['sex'] = formValue.sex;
    if (formValue.alternateId) criteria['alternateId'] = formValue.alternateId;
    if (formValue.alternateIdType) criteria['alternateIdType'] = formValue.alternateIdType;
    if (this.backgroundUnitId) criteria['unitId'] = this.backgroundUnitId;
    if (this.data?.programName) criteria['programName'] = this.data.programName;

    this.searchedCriteria = { ...criteria } as Record<string, string>;

    this.findDonorService.searchDonors(criteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.results = response.data;
          this.autoSelectSingleGoodGrade();
          this.loading = false;
        },
        error: () => {
          this.results = [];
          this.loading = false;
        }
      });
  }

  isMismatch(row: FindDonorResult, field: 'lastName' | 'firstName' | 'dob' | 'sex'): boolean {
    const searchValue = this.searchedCriteria[field]?.trim();
    if (!searchValue) return false;

    if (field === 'dob') {
      if (!row.dob) return true;
      const rowDob = new Date(row.dob);
      const searchParts = searchValue.replace(/\//g, '');
      const len = searchParts.length;
      if (len === 8) {
        const searchDob = this.parseDobString(searchValue);
        return searchDob?.toDateString() !== rowDob.toDateString();
      }
      return true;
    }

    if (field === 'sex') {
      return searchValue.toUpperCase() !== (row.sex || '').toUpperCase();
    }

    const resultValue = row[field] || '';
    return searchValue.toUpperCase() !== resultValue.toUpperCase();
  }

  isNameMismatch(row: FindDonorResult, field: 'lastName' | 'firstName'): boolean {
    return this.isMismatch(row, field);
  }

  private parseDobString(dob: string): Date | null {
    const cleaned = dob.replace(/\//g, '');
    if (cleaned.length === 8) {
      const m = parseInt(cleaned.substring(0, 2), 10) - 1;
      const d = parseInt(cleaned.substring(2, 4), 10);
      const y = parseInt(cleaned.substring(4, 8), 10);
      return new Date(y, m, d);
    }
    const parsed = new Date(dob);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  onRowSelect(donor: FindDonorResult): void {
    this.selectedDonor = donor;
  }

  private autoSelectSingleGoodGrade(): void {
    if (this.results.length === 1 && this.results[0].grade === 1) {
      this.selectedDonor = this.results[0];
    }
  }

  isRowSelected(donor: FindDonorResult): boolean {
    return this.selectedDonor?.donorId === donor.donorId;
  }

  getFullAddress(donor: FindDonorResult): string {
    return donor.address || '-';
  }

  getPhoneNumber(donor: FindDonorResult): string {
    return donor.phone || '-';
  }

  onSelect(): void {
    if (!this.selectedDonor) return;
    this.dialogRef.close({
      action: 'select',
      donor: this.selectedDonor,
      searchCriteria: this.searchForm.value
    } as FindDonorDialogResult);
  }

  onNew(): void {
    const ref = this.confirmDialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Create New Donor',
        message: 'Create new donor?',
        confirmText: 'YES',
        cancelText: 'NO',
      },
    });

    ref.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          const formValue = this.searchForm.value;
          this.dialogRef.close({
            action: 'new',
            searchCriteria: formValue,
            newData: {
              lastName: formValue.lastName || undefined,
              firstName: formValue.firstName || undefined,
              sex: formValue.sex || undefined,
              dob: formValue.dob ? this.formatDobForApi(formValue.dob) : undefined,
            },
          } as FindDonorDialogResult);
        }
      });
  }

  onHold(): void {
    this.dialogRef.close({
      action: 'hold',
      donor: this.selectedDonor ?? undefined,
      searchCriteria: this.searchForm.value,
    } as FindDonorDialogResult);
  }

  onClear(): void {
    this.lookupCancel$.next();
    this.isLookingUpDonorId = false;
    this.doubleEntryValues = {};
    this.doubleEntryState = {};
    this.confirmatoryLookupData = null;
    this.donorLookupPopulatedFields.clear();
    this.searchForm.reset({
      scanId: '',
      donorId: '',
      alternateIdType: '',
      alternateId: '',
      lastName: '',
      dob: null,
      sex: '',
      firstName: ''
    });
    this.typeSearchControl.setValue('');
    this.results = [];
    this.selectedDonor = null;
    this.hasSearched = false;
    this.searchedCriteria = {};
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' } as FindDonorDialogResult);
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr || '-';
    }
  }

  private formatDobForApi(date: string | Date | { toDate: () => Date }): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }
    if ('toDate' in date) {
      const d = date.toDate();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    }
    return '';
  }
}
