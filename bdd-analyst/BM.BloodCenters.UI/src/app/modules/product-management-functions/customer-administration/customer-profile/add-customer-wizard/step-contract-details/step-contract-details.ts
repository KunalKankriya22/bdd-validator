import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { Subject, takeUntil, switchMap } from 'rxjs';

import { AddCustomerWizardApiService } from '../add-customer-wizard-api.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

@Component({
  selector: 'app-step-contract-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './step-contract-details.html',
  styleUrls: ['./step-contract-details.scss']
})
export class StepContractDetailsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `contract-details-${StepContractDetailsComponent.nextId++}`;

  @Input() customerId: string = '';
  @Input() savedData: any = null;
  @Output() saveSuccess = new EventEmitter<any>();
  @Output() savingChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AddCustomerWizardApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  contractForm!: FormGroup;

  protected readonly saving = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  protected today!: Moment;
  protected minDate!: Moment;
  protected terminationMinDate!: Moment;

  protected get f() {
    return this.contractForm.controls;
  }

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.terminationMinDate = this.minDate;

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const tz = this.headerService.chapterTimeZone();
        this.minDate = DateFieldValidationUtility.getMinDate(tz);
        this.updateTerminationMinDate();
        this.contractForm.get('effDate')?.setValidators([
          Validators.required,
          DateFieldValidationUtility.effectiveDateNotPastValidator(tz)
        ]);
        this.contractForm.get('effDate')?.updateValueAndValidity();
        this.contractForm.get('termDate')?.setValidators([DateFieldValidationUtility.terminationDateNotPastValidator(tz)]);
        this.contractForm.get('termDate')?.updateValueAndValidity();
      });

    this.setupFormListeners();

    // Populate form with savedData if available
    if (this.savedData) {
      this.contractForm.patchValue({
        rotation: this.savedData.rotationFlag || this.savedData.rotation,
        hospitalLevel: this.savedData.hospitalLevel,
        poNumber: this.savedData.poNumber,
        creditLimit: this.savedData.creditLimit
      });
      // Handle dates with moment conversion
      if (this.savedData.startTerm) {
        this.contractForm.get('startTerm')?.setValue(moment(this.savedData.startTerm));
      }
      if (this.savedData.endTerm) {
        this.contractForm.get('endTerm')?.setValue(moment(this.savedData.endTerm));
      }
      if (this.savedData.effDate) {
        this.contractForm.get('effDate')?.setValue(moment(this.savedData.effDate));
      }
      if (this.savedData.termDate) {
        this.contractForm.get('termDate')?.setValue(moment(this.savedData.termDate));
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.contractForm = this.fb.group({
      rotation: ['Y'],
      hospitalLevel: ['', [Validators.maxLength(2)]],
      poNumber: ['', [Validators.maxLength(12)]],
      creditLimit: [null, [Validators.required, Validators.min(0), Validators.max(9999999.99)]],
      startTerm: [null],
      endTerm: [null],
      effDate: [null, [
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
      ]],
      termDate: [null, [DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())]]
    }, {
      validators: [DateFieldValidationUtility.dateRangeValidator()]
    });
  }

  private setupFormListeners(): void {
    // Re-validate termination date when effective date changes
    this.contractForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTerminationMinDate();
        this.contractForm.get('termDate')?.updateValueAndValidity();
      });

    // Validate end term when start term changes
    this.contractForm.get('startTerm')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.contractForm.get('endTerm')?.updateValueAndValidity();
      });
  }

  protected getEffectiveDateError(): string {
    return DateFieldValidationUtility.getEffectiveDateError(this.contractForm);
  }

  protected getTerminationDateError(): string {
    return DateFieldValidationUtility.getTerminationDateError(this.contractForm);
  }

  private updateTerminationMinDate(): void {
    const effectiveValue = this.contractForm?.get('effDate')?.value;
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

  protected onSubmit(): void {
    this.submitted.set(true);
    this.contractForm.markAllAsTouched();

    // If savedData exists and form is not dirty, just move to next step
    if (this.savedData && !this.contractForm.dirty) {
      this.saveSuccess.emit(this.savedData);
      return;
    }

    if (this.contractForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      this.showErrorAndAutoDismiss('Please correct the errors in the form');
      return;
    }

    this.saving.set(true); this.savingChange.emit(true);

    const formValue = this.contractForm.getRawValue();

    const payload = {
      rotationFlag: formValue.rotation === 'Y' ? 'Y' : 'N',
      hospitalLevel: formValue.hospitalLevel || null,
      poNumber: formValue.poNumber || null,
      creditLimit: formValue.creditLimit,
      startTerm: formValue.startTerm ? moment(formValue.startTerm).format('YYYY-MM-DD') : null,
      endTerm: formValue.endTerm ? moment(formValue.endTerm).format('YYYY-MM-DD') : null,
      effDate: formValue.effDate ? moment(formValue.effDate).format('YYYY-MM-DD') : '',
      termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null
    };

    // If savedData exists, update existing contract
    if (this.savedData) {
      const contractId = this.savedData.contractId;

      this.apiService.updateContract(this.customerId, contractId, payload)
        .pipe(
          switchMap(() => this.apiService.getContracts(this.customerId)),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (contracts) => {
            this.saving.set(false); this.savingChange.emit(false);
            this.snackbarService.showSuccess('Contract details updated successfully');
            this.saveSuccess.emit(contracts?.[0] || payload);
          },
          error: (err) => {
            this.saving.set(false); this.savingChange.emit(false);
            const errorMessage = err?.error?.errorResponse?.error || err?.error?.message || 'Failed to update contract details';
            this.showErrorAndAutoDismiss(errorMessage);
            console.error('Error updating contract details:', err);
          }
        });
      return;
    }

    // Create new contract
    this.apiService.createContract(this.customerId, payload)
      .pipe(
        switchMap(() => this.apiService.getContracts(this.customerId)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (contracts) => {
          this.saving.set(false); this.savingChange.emit(false);
          this.snackbarService.showSuccess('Contract details saved successfully');
          this.saveSuccess.emit(contracts?.[0] || payload);
        },
        error: (err) => {
          this.saving.set(false); this.savingChange.emit(false);
          const errorMessage = err?.error?.errorResponse?.error || err?.error?.message || 'Failed to save contract details';
          this.showErrorAndAutoDismiss(errorMessage);
          console.error('Error saving contract details:', err);
        }
      });
  }

  protected onEffectiveDateChange(): void {
    this.contractForm.get('termDate')?.updateValueAndValidity();
    this.contractForm.get('effDate')?.markAsTouched();
  }

  protected onTerminationDateChange(): void {
    this.contractForm.get('termDate')?.markAsTouched();
  }

  private showErrorAndAutoDismiss(message: string): void {
    this.snackbarService.showError(message);
    setTimeout(() => this.snackBar.dismiss(), 5000);
  }

  protected onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.contractForm.get('effDate')
    );
  }

  protected onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.contractForm.get('termDate')
    );
  }

  protected onStartTermChange(): void {
    this.contractForm.get('endTerm')?.updateValueAndValidity();
    this.contractForm.get('startTerm')?.markAsTouched();
  }

  protected onEndTermChange(): void {
    this.contractForm.get('endTerm')?.markAsTouched();
  }

  protected onStartTermInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.contractForm.get('startTerm')
    );
  }

  protected onEndTermInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.contractForm.get('endTerm')
    );
  }

  protected getStartTermError(): string {
    const control = this.contractForm.get('startTerm');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate') || control.hasError('invalidDateFormat')) {
      return 'Start Term is invalid';
    }
    return '';
  }

  protected getEndTermError(): string {
    const control = this.contractForm.get('endTerm');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse') || control.hasError('invalidDate') || control.hasError('invalidDateFormat')) {
      return 'End Term is invalid';
    }
    if (control.hasError('matDatepickerMin')) {
      return 'End Term must be on or after Start Term';
    }
    return '';
  }

  protected terminationDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const effectiveDate = this.contractForm?.get('effDate')?.value;

    if (effectiveDate) {
      const effDay = moment(effectiveDate).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  protected endTermDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const startTerm = this.contractForm?.get('startTerm')?.value;

    if (startTerm) {
      const startDay = moment(startTerm).startOf('day');
      if (checkDate.isBefore(startDay)) {
        return false;
      }
    }

    return true;
  };

  protected onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if ([46, 8, 9, 27, 13, 110, 190].indexOf(charCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (charCode === 65 && event.ctrlKey === true) ||
      (charCode === 67 && event.ctrlKey === true) ||
      (charCode === 86 && event.ctrlKey === true) ||
      (charCode === 88 && event.ctrlKey === true) ||
      // Allow: home, end, left, right
      (charCode >= 35 && charCode <= 39)) {
      return true;
    }
    // Ensure that it is a number and stop the keypress
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }
}
