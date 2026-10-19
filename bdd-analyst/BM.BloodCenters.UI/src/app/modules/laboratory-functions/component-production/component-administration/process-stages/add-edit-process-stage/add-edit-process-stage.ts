import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, finalize } from 'rxjs';

import { ProcessStagesService } from '../services/process-stages.service';
import {
  ProcessStageDto,
  DropdownDto,
  CreateProcessStageRequestDto,
  UpdateProcessStageRequestDto,
} from '../models/process-stages.model';

@Component({
  selector: 'app-add-edit-process-stage',
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
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
  ],
  templateUrl: './add-edit-process-stage.html',
  styleUrls: ['./add-edit-process-stage.scss'],
})
export class AddEditProcessStage implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: ProcessStageDto | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'add' | 'edit'>();

  @ViewChild('effDateInput', { read: ElementRef }) effDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('termDateInput', { read: ElementRef }) termDateInput!: ElementRef<HTMLInputElement>;

  form: FormGroup;
  panelTitle = '';
  lastModifiedDisplay = '';

  minDate: Moment = DateFieldValidationUtility.getMinDate();
  terminationMinDate: Moment = this.minDate.clone();

  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTermDateError());

  editModeValues = {
    processCode: '',
    stageCode: '',
    stageSequence: null as number | null,
    effDate: '',
    termDate: '',
  };

  processCodes: DropdownDto[] = [];
  stageCodes: DropdownDto[] = [];
  processDescription = '-';
  stageDescription = '-';

  processSearchControl = new FormControl('');
  filteredProcessCodes: DropdownDto[] = [];
  stageSearchControl = new FormControl('');
  filteredStageCodes: DropdownDto[] = [];

  isLoadingProcessCodes = false;
  isLoadingStageCodes = false;
  isSaving = false;

  private originalTerminationDate: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private processStagesService: ProcessStagesService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    effect(() => {
      const chapterTimezone = this.headerService.chapterTimeZone();
      this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);
      this.updateTerminationMinDate();
    });

    this.form = this.fb.group({
      processCode: ['', [Validators.required, Validators.maxLength(5)]],
      stageCode: ['', [Validators.required, Validators.maxLength(5)]],
      stageSequence: [null],
      effectiveDate: [null, [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator()]],
      terminationDate: [null],
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  ngOnInit(): void {
    this.setupPanel();
    this.loadProcessCodes();
    this.loadStageCodes();
    this.setupProcessCodeListener();
    this.setupStageCodeListener();
    this.setupProcessSearch();
    this.setupStageSearch();
    this.setupEffDateListener();
    this.setupDateInputValidation();
    this.setupStageSequenceListener();

    if (this.mode === 'add') {
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
    }
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
      this.panelTitle = 'Add New Process Stage';
      this.lastModifiedDisplay = '';
    } else {
      this.panelTitle = 'Edit Process Stage';
      this.populateFormForEdit();
    }
  }

  private resetFormForAddMode(): void {
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    this.processDescription = '-';
    this.stageDescription = '-';
    this.lastModifiedDisplay = '';
    this.originalTerminationDate = null;

    this.form.get('processCode')?.enable();
    this.form.get('stageCode')?.enable();

    DateFieldValidationUtility.setupAddModeValidators(this.form, this.chapterOffset);
  }

  private populateFormForEdit(): void {
    if (!this.data) return;

    this.editModeValues = {
      processCode: this.data.processCode,
      stageCode: this.data.stageCode,
      stageSequence: this.data.stageSequence,
      effDate: this.data.effDate
        ? DateFieldValidationUtility.formatDateForUI(moment(this.data.effDate))?.toUpperCase() || ''
        : '',
      termDate: this.data.termDate
        ? DateFieldValidationUtility.formatDateForUI(moment(this.data.termDate))?.toUpperCase() || ''
        : '',
    };

    if (this.data.insertDate) {
      this.lastModifiedDisplay = DateFieldValidationUtility.formatDateTimeForUI(this.data.insertDate)
        ? 'Last Modified: ' + DateFieldValidationUtility.formatDateTimeForUI(this.data.insertDate) + ' PST'
        : '';
    }

    this.originalTerminationDate = this.data.termDate
      ? moment(this.data.termDate).format('YYYY-MM-DD')
      : null;

    this.form.get('processCode')?.disable();
    this.form.get('stageCode')?.disable();

    this.form.patchValue({
      processCode: this.data.processCode,
      stageCode: this.data.stageCode,
      stageSequence: this.data.stageSequence,
      effectiveDate: this.data.effDate ? moment(this.data.effDate) : null,
      terminationDate: this.data.termDate ? moment(this.data.termDate) : null,
    });

    DateFieldValidationUtility.setupEditModeValidators(this.form, this.chapterOffset);

    const termControl = this.form.get('terminationDate');
    if (termControl) {
      termControl.clearValidators();
      termControl.setValidators([
        DateFieldValidationUtility.editModeTerminationDateValidator(this.originalTerminationDate, this.chapterOffset),
      ]);
      termControl.updateValueAndValidity();
    }

    this.updateTerminationMinDate();
  }

  private loadProcessCodes(): void {
    this.isLoadingProcessCodes = true;
    this.processStagesService.getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.processCodes = response.data || [];
          this.filteredProcessCodes = this.processCodes;
          this.isLoadingProcessCodes = false;
          this.updateProcessDescription();
        },
        error: () => {
          this.isLoadingProcessCodes = false;
        },
      });
  }

  private loadStageCodes(): void {
    this.isLoadingStageCodes = true;
    this.processStagesService.getStageCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stageCodes = response.data || [];
          this.filteredStageCodes = this.stageCodes;
          this.isLoadingStageCodes = false;
          this.updateStageDescription();
        },
        error: () => {
          this.isLoadingStageCodes = false;
        },
      });
  }

  private setupProcessCodeListener(): void {
    this.form.get('processCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateProcessDescription());
  }

  private setupStageCodeListener(): void {
    this.form.get('stageCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateStageDescription());
  }

  private updateProcessDescription(): void {
    const code = this.form.getRawValue().processCode;
    if (code) {
      const process = this.processCodes.find((p) => p.code === code);
      this.processDescription = process?.description || '-';
    } else {
      this.processDescription = '-';
    }
  }

  private updateStageDescription(): void {
    const code = this.form.getRawValue().stageCode;
    if (code) {
      const stage = this.stageCodes.find((s) => s.code === code);
      this.stageDescription = stage?.description || '-';
    } else {
      this.stageDescription = '-';
    }
  }

  private setupStageSequenceListener(): void {
    this.form.get('stageSequence')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('stageSequence')?.markAsTouched();
      });
  }

  private setupEffDateListener(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateDateInput('effectiveDate', this.effDateInput);
        this.updateTerminationMinDate();
        this.form.get('terminationDate')?.updateValueAndValidity({ emitEvent: false });
      });
  }

  private updateTerminationMinDate(): void {
    const effValue = this.form?.get('effectiveDate')?.value;
    if (effValue && moment.isMoment(effValue) && effValue.isValid()) {
      this.terminationMinDate = effValue.isAfter(this.minDate)
        ? effValue.clone()
        : this.minDate.clone();
    } else {
      this.terminationMinDate = this.minDate.clone();
    }
  }

  private setupProcessSearch(): void {
    this.processSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        if (!search) {
          this.filteredProcessCodes = this.processCodes;
          return;
        }
        const lower = search.toLowerCase();
        this.filteredProcessCodes = this.processCodes.filter(
          (p) =>
            p.code.toLowerCase().includes(lower) ||
            (p.description || '').toLowerCase().includes(lower)
        );
      });
  }

  private setupStageSearch(): void {
    this.stageSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        if (!search) {
          this.filteredStageCodes = this.stageCodes;
          return;
        }
        const lower = search.toLowerCase();
        this.filteredStageCodes = this.stageCodes.filter(
          (s) =>
            s.code.toLowerCase().includes(lower) ||
            (s.description || '').toLowerCase().includes(lower)
        );
      });
  }

  onProcessDropdownClosed(): void {
    this.processSearchControl.setValue('');
    this.filteredProcessCodes = this.processCodes;
  }

  onStageDropdownClosed(): void {
    this.stageSearchControl.setValue('');
    this.filteredStageCodes = this.stageCodes;
  }

  private setupDateInputValidation(): void {
    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDateInput('terminationDate', this.termDateInput));
  }

  private validateDateInput(controlName: string, inputRef: ElementRef<HTMLInputElement>): void {
    const control = this.form.get(controlName);
    const inputValue = inputRef?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  onEffDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('effectiveDate');
      control?.markAsTouched();
      this.validateDateInput('effectiveDate', this.effDateInput);
    }, 0);
  }

  onTermDateBlur(): void {
    setTimeout(() => {
      const control = this.form.get('terminationDate');
      control?.markAsTouched();
      this.validateDateInput('terminationDate', this.termDateInput);
    }, 0);
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    if (this.mode === 'add') {
      const dto: CreateProcessStageRequestDto = {
        processCode: formValue.processCode,
        stageCode: formValue.stageCode,
        stageSequence: formValue.stageSequence,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      };

      this.processStagesService.createProcessStage(dto)
        .pipe(takeUntil(this.destroy$), finalize(() => (this.isSaving = false)))
        .subscribe({
          next: (response) => {
            this.snackBar.open(response.message || 'All changes are saved.', 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
            });
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Failed to create process stage. Please try again.';
            this.snackBar.open(errorMessage, 'DISMISS', {
              duration: 8000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            });
          },
        });
    } else {
      const dto: UpdateProcessStageRequestDto = {
        stageSequence: formValue.stageSequence,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      };

      this.processStagesService.updateProcessStage(
        formValue.processCode,
        formValue.stageCode,
        dto
      )
        .pipe(takeUntil(this.destroy$), finalize(() => (this.isSaving = false)))
        .subscribe({
          next: (response) => {
            this.snackBar.open(response.message || 'All changes are saved.', 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar'],
            });
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Failed to update process stage. Please try again.';
            this.snackBar.open(errorMessage, 'DISMISS', {
              duration: 8000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            });
          },
        });
    }
  }

  onAddAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving = true;

    const dto: CreateProcessStageRequestDto = {
      processCode: formValue.processCode,
      stageCode: formValue.stageCode,
      stageSequence: formValue.stageSequence,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
    };

    this.processStagesService.createProcessStage(dto)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'All changes are saved.', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
          this.saveSuccess.emit();
          this.resetFormForAddMode();
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Failed to create process stage. Please try again.';
          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 8000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  getEffDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateErrorMessage(
      this.form.get('effectiveDate'),
      this.form.errors
    );
  }

  getTermDateError(): string {
    return DateFieldValidationUtility.getTerminationDateErrorMessage(
      this.form.get('terminationDate'),
      this.form.errors
    );
  }

  getProcessCodeError(): string {
    const control = this.form.get('processCode');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Process Code is required';
    if (control.hasError('maxlength')) return 'Process Code cannot exceed 5 characters';
    return '';
  }

  getStageCodeError(): string {
    const control = this.form.get('stageCode');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Stage Code is required';
    if (control.hasError('maxlength')) return 'Stage Code cannot exceed 5 characters';
    return '';
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
