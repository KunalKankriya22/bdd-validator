import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, Optional, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { AssignUserInterdictionClassService } from '../services/assign-user-interdiction-class.service';
import moment from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AssignUserInterdictionClassDto, AssignUserInterdictionClassModel, UserOption, InterdictionClassOption } from '../models/assign-user-interdiction-class.model';

export interface AddEditUserInterdictionClassDialogData {
  mode: 'add' | 'edit';
  data: AssignUserInterdictionClassModel | null;
}

export interface UserInterdictionClassFormData {
  userId: string;
  userName: string;
  interdictionClass: string;
  description: string;
  effectiveDate: Date;
  terminationDate?: Date | null;
}

@Component({
  selector: 'app-add-edit-user-interdiction-class',
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
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-user-interdiction-class.html',
  styleUrls: ['./add-edit-user-interdiction-class.scss']
})
export class AddEditUserInterdictionClass implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: AssignUserInterdictionClassModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<UserInterdictionClassFormData>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  form: FormGroup;
  panelTitle: string = '';
  lastUpdated: string = '';

  editModeValues: {
    userId: string;
    userName: string;
    interClass: string;
    interClassDesc: string;
    effectiveDate: string;
  } = {
      userId: '',
      userName: '',
      interClass: '',
      interClassDesc: '',
      effectiveDate: ''
    };

  userOptions: UserOption[] = [];
  interdictionClassOptions: InterdictionClassOption[] = [];

  userSearchControl = new FormControl('');
  filteredUserOptions: UserOption[] = [];

  interdictionClassSearchControl = new FormControl('');
  filteredInterdictionClassOptions: InterdictionClassOption[] = [];

  loadingUsers = false;
  loadingInterdictionClasses = false;
  isSaving = false;
  savingAction: 'add' | 'addAnother' | null = null;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  minDate = DateFieldValidationUtility.getMinDate();

  private initialFormValues: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private assignUserInterdictionClassService: AssignUserInterdictionClassService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef,
    @Optional() private dialogRef: MatDialogRef<AddEditUserInterdictionClass>,
    @Optional() @Inject(MAT_DIALOG_DATA) dialogData: AddEditUserInterdictionClassDialogData
  ) {
    if (dialogData) {
      this.mode = dialogData.mode;
      this.data = dialogData.data;
    }
    this.minDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    this.form = this.fb.group({
      user: ['', [Validators.required]],
      interdictionClass: ['', [Validators.required]],
      description: [{ value: '', disabled: true }],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
      modificationDate: [{ value: null, disabled: true }]
    }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')] });
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadDataFromAPI();
    this.setupDateValidationListeners();
    this.setupInterdictionClassChangeListener();
    this.setupSearchFunctionality();
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
      this.panelTitle = 'Assign User Interdiction Class';
      this.lastUpdated = '';
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    } else {
      this.panelTitle = 'Edit User Interdiction Class';

      const dateToDisplay = this.data?.lastModifiedDate || new Date();
      this.lastUpdated = `Last Updated: ${this.formatDateTime(dateToDisplay)}`;
      this.populateFormForEdit();
      DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);
      // Re-enable effective date — FMB allows editing it (UpdateAllowed=true)
      this.form.get('effectiveDate')?.enable();
    }
  }

  private resetFormForAddMode(): void {
    this.editModeValues = {
      userId: '',
      userName: '',
      interClass: '',
      interClassDesc: '',
      effectiveDate: ''
    };

    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.form.get('user')?.enable();
    this.form.get('description')?.disable();

  }

  private populateFormForEdit(): void {
    if (this.data) {

      this.editModeValues = {
        userId: this.data.userId || '',
        userName: this.data.userName || '',
        interClass: this.data.interClass || '',
        interClassDesc: this.data.interClassDesc || '',
        effectiveDate: this.data.effectiveDate
          ? DateFieldValidationUtility.formatDateForUI(moment(this.data.effectiveDate))?.toUpperCase() || ''
          : ''
      };

      this.form.get('user')?.disable();

      const userDisplay = `${this.data.userId} - ${this.data.userName}`;

      this.form.patchValue({
        user: userDisplay,
        interdictionClass: this.data.interClass || '',
        description: this.data.interClassDesc || '',
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate) : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate) : null,
        modificationDate: this.data.lastModifiedDate ? moment(this.data.lastModifiedDate) : null
      });

      this.initialFormValues = {
        effectiveDate: this.data.effectiveDate ? moment(this.data.effectiveDate).valueOf() : null,
        terminationDate: this.data.terminationDate ? moment(this.data.terminationDate).valueOf() : null
      };
    }
  }

  private loadDataFromAPI(): void {
    this.loadingUsers = true;
    this.loadingInterdictionClasses = true;


    this.assignUserInterdictionClassService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.userOptions = users;
          this.filteredUserOptions = [...users];
          this.loadingUsers = false;
      
        },
        error: (err) => {
          console.error('Error loading users:', err);
          this.loadingUsers = false;
      
        }
      });

    this.assignUserInterdictionClassService.getInterdictionClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classes) => {
          this.interdictionClassOptions = classes;
          this.filteredInterdictionClassOptions = [...classes];
          this.loadingInterdictionClasses = false;
      
        },
        error: (err) => {
          console.error('Error loading interdiction classes:', err);
          this.loadingInterdictionClasses = false;
      
        }
      });
  }

  private setupSearchFunctionality(): void {
    this.userSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredUserOptions = this.userOptions.filter(user =>
          user.userId.toLowerCase().includes(term) ||
          user.userName.toLowerCase().includes(term)
        );
    
      });

    this.interdictionClassSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredInterdictionClassOptions = this.interdictionClassOptions.filter(option =>
          option.code.toLowerCase().includes(term) ||
          (option.description && option.description.toLowerCase().includes(term))
        );
    
      });
  }

  private setupInterdictionClassChangeListener(): void {
    this.form.get('interdictionClass')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedClass => {
        if (selectedClass) {
          this.fetchInterdictionClassDescription(selectedClass);
        } else {
          this.form.patchValue({ description: '' });
        }
      });
  }

  private fetchInterdictionClassDescription(classCode: string): void {
    const selectedClass = this.interdictionClassOptions.find(c => c.code === classCode);
    if (selectedClass) {
      this.form.patchValue({ description: selectedClass.description || '' });
    } else {
      this.assignUserInterdictionClassService.getInterdictionClassByCode(classCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.form.patchValue({ description: response.description || '' });
          },
          error: (err) => {
            console.error('Error fetching interdiction class description:', err);
            this.form.patchValue({ description: '' });
          }
        });
    }
  }

  private setupDateValidationListeners(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.cdr.detectChanges();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.cdr.detectChanges();
      });
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.closePanel.emit();
    }
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

    const formValue = this.form.getRawValue();
    let userId = '';
    let userName = '';

    if (this.mode === 'add') {
      userId = formValue.user || '';
      const selectedUser = this.userOptions.find(u => u.userId === userId);
      userName = selectedUser ? selectedUser.userName : '';
    } else {
      userId = this.editModeValues.userId;
      userName = this.editModeValues.userName;
    }

    const dto: AssignUserInterdictionClassDto = {
      userId: userId,
      interClass: formValue.interdictionClass || '',
      effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') + 'T00:00:00' : null,
      terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') + 'T00:00:00' : null
    };

    this.isSaving = true;
    this.savingAction = 'add';

    const apiCall = this.mode === 'add'
      ? this.assignUserInterdictionClassService.addUserInterdictionClass(dto)
      : this.assignUserInterdictionClassService.updateUserInterdictionClass(
          userId,
          formValue.interdictionClass || '',
          {
            effectiveDate: dto.effectiveDate,
            terminationDate: dto.terminationDate
          }
        );

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.savingAction = null;
        })
      )
      .subscribe({
        next: () => {
          const message = this.mode === 'add'
            ? `User interdiction class has been assigned successfully.`
            : `User interdiction class has been updated successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: UserInterdictionClassFormData = {
            userId: userId,
            userName: userName,
            interdictionClass: formValue.interdictionClass || '',
            description: formValue.description || '',
            effectiveDate: formValue.effectiveDate?.toDate() || new Date(),
            terminationDate: formValue.terminationDate?.toDate() || null
          };

          this.saveSuccess.emit(result);
          if (this.dialogRef) {
            this.dialogRef.close({ success: true });
          } else {
            this.closePanel.emit();
          }
        },
        error: (error) => {
          console.error('Error saving user interdiction class:', error);
        }
      });
  }

  onSaveAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.hasDateValidationError()) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    let userId = '';
    let userName = '';

    if (this.mode === 'add') {
      userId = formValue.user || '';
      const selectedUser = this.userOptions.find(u => u.userId === userId);
      userName = selectedUser ? selectedUser.userName : '';
    } else {
      userId = this.editModeValues.userId;
      userName = this.editModeValues.userName;
    }

    const dto: AssignUserInterdictionClassDto = {
      userId: userId,
      interClass: formValue.interdictionClass || '',
      effectiveDate: formValue.effectiveDate ? moment(formValue.effectiveDate).format('YYYY-MM-DD') + 'T00:00:00' : null,
      terminationDate: formValue.terminationDate ? moment(formValue.terminationDate).format('YYYY-MM-DD') + 'T00:00:00' : null
    };

    this.isSaving = true;
    this.savingAction = 'addAnother';

    const apiCall = this.mode === 'add'
      ? this.assignUserInterdictionClassService.addUserInterdictionClass(dto)
      : this.assignUserInterdictionClassService.updateUserInterdictionClass(
          userId,
          formValue.interdictionClass || '',
          {
            effectiveDate: dto.effectiveDate,
            terminationDate: dto.terminationDate
          }
        );

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.savingAction = null;
        })
      )
      .subscribe({
        next: () => {
          const message = this.mode === 'add'
            ? `User interdiction class has been assigned successfully.`
            : `User interdiction class has been updated successfully.`;

          this.snackBar.open(message, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const result: UserInterdictionClassFormData = {
            userId: userId,
            userName: userName,
            interdictionClass: formValue.interdictionClass || '',
            description: formValue.description || '',
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
          console.error('Error saving user interdiction class:', error);
        }
      });
  }

  private hasDateValidationError(): boolean {
    return this.form.hasError('dateRangeInvalid') || false;
  }

  get userControl() {
    return this.form.get('user');
  }

  get interdictionClassControl() {
    return this.form.get('interdictionClass');
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  get effectiveDateControl() {
    return this.form.get('effectiveDate');
  }

  get terminationDateControl() {
    return this.form.get('terminationDate');
  }

  getUserError(): string {
    const control = this.userControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'User is required';
    }
    return '';
  }

  getInterdictionClassError(): string {
    const control = this.interdictionClassControl;
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Interdiction Class is required';
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

  get terminationMinDate() {
    const effectiveDate = this.form.get('effectiveDate')?.value;
    if (!effectiveDate) return this.minDate;
    const effMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
    return effMoment.isAfter(this.minDate) ? effMoment : this.minDate;
  }

  formatDate(date: Date | null): string {
    if (!date) return '-';
    return moment(date).format('DD-MMM-YYYY');
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '';
    const momentDate = moment(date);
    const isToday = momentDate.isSame(moment(), 'day');

    if (isToday) {
      return momentDate.format('[Today], hh:mm A [PST]');
    } else {
      return momentDate.format('DD-MMM-YYYY, hh:mm A [PST]');
    }
  }

  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true;
    }

    const currentEffectiveDate = this.form.get('effectiveDate')?.value;
    const currentEffectiveDateValue = currentEffectiveDate && moment.isMoment(currentEffectiveDate)
      ? currentEffectiveDate.valueOf()
      : null;

    const currentTerminationDate = this.form.get('terminationDate')?.value;
    const currentTerminationDateValue = currentTerminationDate && moment.isMoment(currentTerminationDate)
      ? currentTerminationDate.valueOf()
      : null;

    return currentEffectiveDateValue !== this.initialFormValues.effectiveDate ||
      currentTerminationDateValue !== this.initialFormValues.terminationDate;
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return this.form.valid && this.hasFormChanged() && !this.hasDateValidationError();
    }
    return this.form.valid && !this.hasDateValidationError();
  }
}
