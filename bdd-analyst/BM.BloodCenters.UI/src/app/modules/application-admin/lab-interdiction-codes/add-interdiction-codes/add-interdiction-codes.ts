import { Component, EventEmitter, Input, OnInit, Output, OnChanges, OnDestroy, SimpleChanges, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import moment from 'moment';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { AddInterdictionCodeService } from '../services/add-interdiction-codes.service';
import { AddInterdictionCodeModel, EditInterdictionCodeModel } from '../models/view-interdiction-codes.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-add-new-code-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './add-interdiction-codes.html',
  styleUrls: ['./add-interdiction-codes.scss']
})
export class AddInterdictionCodes implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() rowData: any = null;
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  @ViewChild('effDateNativeInput') effDateNativeInput?: ElementRef;
  @ViewChild('termDateNativeInput') termDateNativeInput?: ElementRef;

  termDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      const hasTypedText = !!this.getNativeInputText(this.termDateNativeInput);
      return !control.value && hasTypedText;
    }
  };

  scope: 'donor' | 'lab' = 'lab';
  action: 'add' | 'edit' = 'add';
  form!: FormGroup;
  isSaving = false;

  // Type options
  private allTypeOptions: string[] = ['NFT', 'INITIAL', 'BIO', 'HOLD'];
  readonly typeOptions = signal<string[]>([]);
  readonly typeSearchControl = new FormControl('');

  // Type mapping
  private reverseTypeMap: Record<string, string> = {
    INITIAL: 'I',
    HOLD: 'H',
    BIO: 'B',
    NFT: 'N'
  };

  // Edit mode values for display
  editModeValues = {
    code: '',
    effectiveDate: ''
  };

  lastUpdated: string = '';

  /**
   * Termination date filter: must be >= chapter's today AND >= effective date.
   * Replaces [min] binding — gives full control over what dates are disabled.
   */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const today = moment(chapterToday.format('YYYY-MM-DD')).startOf('day');

    if (checkDate.isBefore(today)) {
      return false;
    }

    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  private destroy$ = new Subject<void>();
  private formSub$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private manageService: AddInterdictionCodeService,
    private snackBar: MatSnackBar,
    private router: Router,
    private headerService: HeaderService
  ) {}

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupTypeSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['rowData']) {
      this.initializeForm();
    }
  }

  ngOnDestroy(): void {
    this.formSub$.next();
    this.formSub$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupTypeSearch(): void {
    this.typeOptions.set(this.allTypeOptions);

    this.typeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.typeOptions.set(this.filterTypeOptions(search));
      });
  }

  private filterTypeOptions(search: string | null): string[] {
    if (!search || search.length === 0) {
      return this.allTypeOptions;
    }
    const searchLower = search.toLowerCase();
    return this.allTypeOptions.filter(opt => opt.toLowerCase().includes(searchLower));
  }

  private initializeForm(): void {
    this.formSub$.next();
    this.action = this.mode === 'edit' ? 'edit' : 'add';

    this.form = this.fb.group({
      code: [{ value: '', disabled: this.action === 'edit' }, [Validators.required, Validators.maxLength(4)]],
      type: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(50)]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null],
      interdictionEnabled: [true]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });

    if (this.action === 'add') {
      this.setupAddModeValidators();
    } else {
      this.setupEditModeValidators();
    }

    // Re-validate termination date when effective date changes (for date range validation)
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.formSub$), takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('terminationDate')?.updateValueAndValidity();
      });

    if (this.action === 'edit' && this.rowData) {
      this.populateFormForEdit(this.rowData);
    }
  }

  private setupAddModeValidators(): void {
    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
  }

  /**
   * Edit mode: effective date disabled (read-only card in UI).
   * Termination date validates not-in-past per API requirement.
   */
  private setupEditModeValidators(): void {
    const effDateCtrl = this.form.get('effectiveDate');
    const termDateCtrl = this.form.get('terminationDate');

    if (effDateCtrl) {
      effDateCtrl.disable({ emitEvent: false });
    }

    if (termDateCtrl) {
      termDateCtrl.setValidators([
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)
      ]);
      termDateCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private populateFormForEdit(row: any): void {
    const mappedType = Object.keys(this.reverseTypeMap)
      .find(key => this.reverseTypeMap[key] === row.interType) ?? '';

    const effDate = row.effDate ? moment(row.effDate) : null;
    const termDate = row.termDate ? moment(row.termDate) : null;

    this.form.patchValue({
      code: row.interCode ?? '',
      type: mappedType,
      description: row.interDesc ?? '',
      effectiveDate: effDate,
      terminationDate: termDate,
      interdictionEnabled: row.systemInterFlag === 'Y'
    });

    this.editModeValues.code = row.interCode ?? '';
    this.editModeValues.effectiveDate = this.formatDateForDisplay(row.effDate);
    this.lastUpdated = row.lastModifiedDate
      ? `Last Updated: ${this.formatDateTime(row.lastModifiedDate)}`
      : '';
  }

  formatDateTime(date: string | null | undefined): string {
    if (!date) return '';
    const momentDate = moment(date);
    if (!momentDate.isValid()) return '';
    const chapterToday = moment().utcOffset(this.chapterOffset).startOf('day');
    const isToday = momentDate.isSame(chapterToday, 'day');
    return isToday
      ? momentDate.format('[Today], HH:mm')
      : momentDate.format('DD-MMM-YYYY, HH:mm');
  }

  private formatDateForDisplay(date: Date | string | null | undefined): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '';
  }

  /* ================= ERROR GETTERS ================= */

  getEffectiveDateError(): string {
    const control = this.form.get('effectiveDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Effective Date is invalid';
    if (control.hasError('required')) {
      const hasText = this.getNativeInputText(this.effDateNativeInput);
      if (hasText) return 'Effective Date is invalid';
      return 'Effective Date is required';
    }
    if (control.hasError('effectiveDatePast')) return 'Effective Date cannot be in the past';
    if (control.hasError('matDatepickerMin')) return 'Effective Date cannot be in the past';
    return '';
  }

  getTerminationDateError(): string {
    const control = this.form.get('terminationDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate')) return 'Termination Date is invalid';
    if (!control.value && this.getNativeInputText(this.termDateNativeInput)) return 'Termination Date is invalid';
    if (control.hasError('terminationDatePast')) return 'Termination Date cannot be in the past';
    if (control.hasError('dateRangeInvalid') || this.form.errors?.['dateRangeInvalid']) return 'Termination Date must be on or after Effective Date';
    return '';
  }

  preventSpaceInput(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
    }
  }

  preventLeadingAndMultipleSpaces(event: KeyboardEvent, controlName: string): void {
    if (event.key === ' ' || event.code === 'Space') {
      const control = this.form.get(controlName);
      const currentValue = control?.value || '';

      if (currentValue.length === 0) {
        event.preventDefault();
        return;
      }

      if (currentValue.endsWith(' ')) {
        event.preventDefault();
        return;
      }
    }
  }

  trimTrailingSpaces(controlName: string): void {
    const control = this.form.get(controlName);
    const value = control?.value;

    if (typeof value === 'string') {
      const trimmed = value.trimEnd();
      if (trimmed !== value) {
        control?.setValue(trimmed);
      }
    }
  }

  onEffDateInput(): void {
    this.form.get('effectiveDate')?.markAsTouched();
  }

  onTermDateInput(): void {
    this.form.get('terminationDate')?.markAsTouched();
  }

  onCancel(): void {
    this.closeDrawer.emit();
  }

  goAddDonor(): void {
    this.router.navigate(
      ['/application-administration/donor-restricted/donor-interdiction-codes'],
      {
        state: { openMode: 'add' }
      }
    );
  }

  get isSystemControlled(): boolean {
    return this.rowData?.changeControlFlag === 'S';
  }

  isFormValid(): boolean {
    return this.form.valid;
  }

  get hasVisibleDateError(): boolean {
    return !!this.getTerminationDateError() || !!this.getEffectiveDateError();
  }

  get hasVisibleFormErrors(): boolean {
    return Object.values(this.form.controls).some(
      ctrl => (ctrl.touched || ctrl.dirty) && ctrl.invalid
    );
  }

  get isSubmitDisabled(): boolean {
    if (this.isSaving) {
      return true;
    }

    if (this.action === 'add') {
      // In add mode, button is disabled if form is invalid
      return !this.form.valid;
    }

    // In edit mode, button is disabled if form has errors or is pristine (unchanged)
    return this.hasVisibleDateError || this.hasVisibleFormErrors || this.form.pristine;
  }

  onSaveOrEdit(action: 'add' | 'edit'): void {
    this.form.markAllAsTouched();

    if (this.hasVisibleDateError || this.hasVisibleFormErrors) {
      return;
    }

    this.isSaving = true;

    if (action === 'edit') {
      this.callEditApi();
    } else {
      this.callAddApi();
    }
  }

  private callAddApi(): void {
    const formValue = this.form.getRawValue();

    const payload: AddInterdictionCodeModel = {
      interCode: formValue.code,
      interType: this.reverseTypeMap[formValue.type],
      interDesc: formValue.description,
      systemInterCode: formValue.code,
      systemInterFlag: formValue.interdictionEnabled ? 'Y' : 'N',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) ?? '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) ?? undefined,
      programId: 'VINTER',
      changeControlFlag: 'D'
    };

    this.manageService.addInterdictionCode(payload).subscribe({
      next: res => this.handleSuccess(res, 'added'),
      error: err => this.handleError(err)
    });
  }

  private callEditApi(): void {
    const formValue = this.form.getRawValue();

    const payload: EditInterdictionCodeModel = {
      interDesc: formValue.description,
      systemInterFlag: formValue.interdictionEnabled ? 'Y' : 'N',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      changeControlFlag: 'D',
      interType: this.reverseTypeMap[formValue.type],
      systemInterCode: formValue.code,
      programId: 'VINTER',
      interCode: formValue.code
    };

    this.manageService.updateInterdictionCode(formValue.code, payload).subscribe({
      next: res => this.handleSuccess(res, 'updated'),
      error: err => this.handleError(err)
    });
  }

  private handleSuccess(res: any, action: 'added' | 'updated'): void {
    this.isSaving = false;
    this.snackBar.open(
      `Interdiction Code ${res.interCode} ${action} successfully!`,
      'DISMISS',
      {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['custom-snackbar-success']
      }
    );
    this.saved.emit(res);
  }

  private handleError(err: any): void {
    this.isSaving = false;
    console.error('API Error:', err);
  }
}
