import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SnackbarService } from '../../../../../../shared/services/snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE
} from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '../../../../../../shared/date/chapter-aware-date-adapter';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS } from '../../../../../../shared/date/date-formats';
import { UserAccessService } from '../../services/user-access.service';
import { LoginService } from '../../../../../../shared/services/login.service';
import { HeaderService } from '../../../../../../shared/services/header.service';
import {
  AccessClassDropdownDto,
  AssignEditAccessClassDialogData,
  AssignEditAccessClassDialogResult
} from '../../models/user-access.model';
import { DateFieldValidationUtility } from '../../../../../../shared/components/DateFieldUtility';

@Component({
  selector: 'app-assign-edit-user-access-class',
  standalone: true,
  templateUrl: './assign-edit-user-access-class.html',
  styleUrls: ['./assign-edit-user-access-class.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ]
})
export class AssignEditUserAccessClassComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isLoadingAccessClasses = false;

  dialogTitle = 'Assign Access Class';

  userId = '';
  userName = '';
  userDepartment = '';
  userDisplay = '';

  editAccessClass = '';
  editDescription = '';

  accessClasses: AccessClassDropdownDto[] = [];
  filteredAccessClassesForSelect: AccessClassDropdownDto[] = [];
  accessClassSearchControl = new FormControl('');
  accessLevels: number[] = [];
  accessLevelLimit = 0;

  // Search control and filtered options for Access Level
  accessLevelSearchControl = new FormControl('');
  filteredAccessLevels: number[] = [];

  minDate = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: UserAccessService,
    private loginService: LoginService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private dialogRef: MatDialogRef<AssignEditUserAccessClassComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: AssignEditAccessClassDialogData
  ) {}

  ngOnInit(): void {
    this.initializeFromDialogData();
    this.createForm();
    this.loadAccessLevelLimit();
    this.loadAccessClasses();
    this.setupAccessClassSelectSearch();
    this.setupAccessLevelSearch();

    if (this.isEditMode) {
      this.populateFormForEdit();
    }
  }

  onAccessClassDropdownOpened(opened: boolean): void {
    if (opened) {
      this.accessClassSearchControl.setValue('');
      this.filteredAccessClassesForSelect = [...this.accessClasses];
    }
  }

  private setupAccessClassSelectSearch(): void {
    this.accessClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredAccessClassesForSelect = this.accessClasses.filter(ac =>
          ac.code.toLowerCase().includes(term) ||
          ac.description?.toLowerCase().includes(term)
        );
      });
  }

  private loadAccessLevelLimit(): void {
    this.service.getAccessLevelLimit()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (limit: number) => {
          this.accessLevelLimit = limit;
          this.generateAccessLevels();
        },
        error: (error: any) => {
          console.error('Failed to load access level limit:', error);
          this.accessLevelLimit = 0;
          this.generateAccessLevels();
        }
      });
  }

  private generateAccessLevels(): void {
    this.accessLevels = [];
    // Generate 1 to accessLevelLimit (inclusive)
    for (let i = 1; i <= this.accessLevelLimit; i++) {
      this.accessLevels.push(i);
    }
    this.filteredAccessLevels = [...this.accessLevels];
  }

  private setupAccessLevelSearch(): void {
    this.accessLevelSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredAccessLevels = this.accessLevels.filter(level =>
          level.toString().includes(term)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFromDialogData(): void {
    if (!this.dialogData || !this.dialogData.user) {
      this.dialogRef.close();
      return;
    }

    this.isEditMode = this.dialogData.mode === 'edit';
    this.userId = this.dialogData.user.userId;
    this.userName = this.dialogData.user.userName;
    this.userDepartment = this.dialogData.user.department;
    this.userDisplay = `${this.userId} - ${this.userName}`;

    if (this.isEditMode && this.dialogData.accessClassData) {
      this.editAccessClass = this.dialogData.accessClassData.accessClass;
      this.editDescription = this.dialogData.accessClassData.description;
      this.dialogTitle = `Edit Class ${this.editAccessClass}`;
    } else {
      this.dialogTitle = 'Assign Access Class';
    }
  }

  /** Format effective date for display in edit mode */
  get editEffectiveDateDisplay(): string {
    const data = this.dialogData?.accessClassData;
    if (!data?.effectiveDate) return '-';
    return moment(data.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
  }

  private createForm(): void {
    if (this.isEditMode) {
      this.form = this.fb.group({
        accessLevel: [null, Validators.required],
        effectiveDate: [null, Validators.required],
        terminationDate: [null]
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
      });
      // Disable effective date in edit mode
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    } else {
      this.form = this.fb.group({
        accessClass: [null, Validators.required],
        accessLevel: [null, Validators.required],
        effectiveDate: [null, [Validators.required]],
        terminationDate: [null]
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
      });
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    }

    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  private loadAccessClasses(): void {
    if (this.isEditMode) {
      return;
    }

    this.isLoadingAccessClasses = true;

    this.service.getActiveAccessClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingAccessClasses = false;
          if (response.success && response.data) {
            this.accessClasses = response.data;
            this.filteredAccessClassesForSelect = [...this.accessClasses];
          } else {
            console.error('Failed to load access classes:', response);
          }
        },
        error: () => {
          this.isLoadingAccessClasses = false;
        }
      });
  }

  private populateFormForEdit(): void {
    if (!this.dialogData.accessClassData) {
      return;
    }

    const data = this.dialogData.accessClassData;

    this.form.patchValue({
      accessLevel: data.level,
      effectiveDate: data.effectiveDate ? moment(data.effectiveDate) : null,
      terminationDate: data.terminationDate ? moment(data.terminationDate) : null
    });

    this.form.markAsPristine();

    // Disable effective date in edit mode
    this.form.get('effectiveDate')?.disable({ emitEvent: false });
  }

  get isFormValid(): boolean {
    if (this.isEditMode && !this.form.dirty) {
      return false;
    }
    return this.form.valid && !this.hasDateValidationError();
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  getAccessClassError(): string {
    const control = this.form.get('accessClass');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'Access Class is required';
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

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.isEditMode
    );
  }

  onSaveAndAssign(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.getRawValue();

    const payload = {
      userId: this.userId?.toUpperCase(),
      accessClass: formValue.accessClass,
      interLevel: formValue.accessLevel,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.assignAccessClass(
      payload,
      this.loginService.getStoredUsername(),
      this.headerService.getCurrentChapterId()
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.snackbarService.showSuccess(response.message);
            const result: AssignEditAccessClassDialogResult = { success: true };
            this.dialogRef.close(result);
          } else {
            this.snackbarService.showSuccess(response.message);
          }
        },
        error: (error: any) => {
          this.isSubmitting = false;
        }
      });
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.getRawValue();

    const payload = {
      interLevel: formValue.accessLevel,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate)
    };

    this.service.updateAccessClass(this.userId?.toUpperCase(), this.editAccessClass, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.snackbarService.showSuccess(response.message);
            const result: AssignEditAccessClassDialogResult = { success: true };
            this.dialogRef.close(result);
          } else {
            this.snackbarService.showSuccess(response.message);
          }
        },
        error: (error: any) => {
          this.isSubmitting = false;
        }
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
