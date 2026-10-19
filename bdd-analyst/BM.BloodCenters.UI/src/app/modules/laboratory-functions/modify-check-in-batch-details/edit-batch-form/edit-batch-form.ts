import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { TemperatureSuffixDirective } from '@shared/directives/temperature-suffix.directive';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { formatTableDate } from '@shared/utils/date-format.util';
import { CheckInBatchDto, ProductTypeOption } from '../models/modify-check-in-batch.model';

function batchFormValidator(originalQcDate: Moment | null): (group: AbstractControl) => ValidationErrors | null {
  return (group: AbstractControl): ValidationErrors | null => {
    const minTemp = group.get('minTemp');
    const maxTemp = group.get('maxTemp');
    const shippedDate = group.get('shippedDate');
    const receivedDate = group.get('receivedDate');
    const qcDate = group.get('qcDate');
    const batchDateStr = group.get('batchDate')?.value;

    const batchDateMoment = batchDateStr ? moment(batchDateStr) : null;

    // Min Temp <= Max Temp
    if (minTemp && maxTemp) {
      const minVal = minTemp.value;
      const maxVal = maxTemp.value;

      const minErrors = { ...(minTemp.errors || {}) };
      const maxErrors = { ...(maxTemp.errors || {}) };

      if (minVal != null && maxVal != null && minVal > maxVal) {
        minTemp.setErrors({ ...minErrors, minExceedsMax: true });
        maxTemp.setErrors({ ...maxErrors, minExceedsMax: true });
      } else {
        delete minErrors['minExceedsMax'];
        minTemp.setErrors(Object.keys(minErrors).length ? minErrors : null);
        delete maxErrors['minExceedsMax'];
        maxTemp.setErrors(Object.keys(maxErrors).length ? maxErrors : null);
      }
    }

    // Shipped Date <= Batch Date (only validate when dirty)
    if (shippedDate && shippedDate.dirty && batchDateMoment?.isValid()) {
      const currentErrors = { ...(shippedDate.errors || {}) };
      if (shippedDate.value && moment.isMoment(shippedDate.value) &&
          shippedDate.value.clone().startOf('day').isAfter(batchDateMoment.clone().startOf('day'))) {
        shippedDate.setErrors({ ...currentErrors, shippedAfterBatch: true });
      } else {
        delete currentErrors['shippedAfterBatch'];
        shippedDate.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
      }
    }

    // Received Date validations (only validate when dirty)
    if (receivedDate && (receivedDate.dirty || shippedDate?.dirty)) {
      const currentErrors = { ...(receivedDate.errors || {}) };

      // Received Date <= Batch Date
      if (receivedDate.dirty && batchDateMoment?.isValid() && receivedDate.value && moment.isMoment(receivedDate.value) &&
          receivedDate.value.clone().startOf('day').isAfter(batchDateMoment.clone().startOf('day'))) {
        currentErrors['receivedAfterBatch'] = true;
      } else {
        delete currentErrors['receivedAfterBatch'];
      }

      // Received Date >= Shipped Date
      if ((receivedDate.dirty || shippedDate?.dirty) &&
          shippedDate?.value && moment.isMoment(shippedDate.value) &&
          receivedDate.value && moment.isMoment(receivedDate.value) &&
          receivedDate.value.clone().startOf('day').isBefore(shippedDate.value.clone().startOf('day'))) {
        currentErrors['receivedBeforeShipped'] = true;
      } else {
        delete currentErrors['receivedBeforeShipped'];
      }

      receivedDate.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
    }

    // QC Date >= Original QC Date (only validate when dirty)
    if (qcDate && qcDate.dirty && originalQcDate?.isValid()) {
      const currentErrors = { ...(qcDate.errors || {}) };
      if (qcDate.value && moment.isMoment(qcDate.value) &&
          qcDate.value.clone().startOf('day').isBefore(originalQcDate.clone().startOf('day'))) {
        qcDate.setErrors({ ...currentErrors, qcBeforeOriginal: true });
      } else {
        delete currentErrors['qcBeforeOriginal'];
        qcDate.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
      }
    }

    return null;
  };
}

@Component({
  selector: 'app-edit-batch-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    TemperatureSuffixDirective,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] }
  ],
  templateUrl: './edit-batch-form.html',
  styleUrls: ['./edit-batch-form.scss'],
})
export class EditBatchFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  private readonly destroy$ = new Subject<void>();

  @Input() batch!: CheckInBatchDto;
  @Input() productTypeOptions: ProductTypeOption[] = [];

  @Output() save = new EventEmitter<CheckInBatchDto>();
  @Output() cancel = new EventEmitter<void>();


  editForm!: FormGroup;
  qcTimeControl = new FormControl<string | null>(null);
  productTypeFilterCtrl = new FormControl('');
  filteredProductTypeOptions: ProductTypeOption[] = [];
  isCBBatch = false;
  isQcDateDisabled = false;
  private originalQcDate: Moment | null = null;
  private shippedDateRawInput = '';
  private receivedDateRawInput = '';
  private qcDateRawInput = '';

  minTempErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control || !control.invalid) return false;
      const otherControl = this.editForm?.get('maxTemp');
      return !!(control.touched || control.dirty || otherControl?.touched || otherControl?.dirty);
    }
  };

  maxTempErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control || !control.invalid) return false;
      const otherControl = this.editForm?.get('minTemp');
      return !!(control.touched || control.dirty || otherControl?.touched || otherControl?.dirty);
    }
  };

  shippedDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getShippedDateError()
  );

  receivedDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getReceivedDateError()
  );

  qcDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getQcDateError()
  );

  ngOnInit(): void {
    this.filteredProductTypeOptions = [...this.productTypeOptions];
    this.productTypeFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredProductTypeOptions = [...this.productTypeOptions];
        } else {
          const s = search.toLowerCase();
          this.filteredProductTypeOptions = this.productTypeOptions.filter(
            o => o.productType.toLowerCase().includes(s)
          );
        }
      });
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.isCBBatch = this.batch.batchId?.substring(7, 9) === 'CB';
    this.isQcDateDisabled = !this.batch.qcDate;

    const shippedDateValue = this.parseDateFromBatch(this.batch.shippedDate);
    const receivedDateValue = this.parseDateFromBatch(this.batch.receivedDate);
    // GET API already returns qcDate in chapter local time (via Oracle get_local_time),
    // so no additional timezone conversion is needed here.
    this.originalQcDate = this.parseDateFromBatch(this.batch.qcDate);
    const qcDateValue = this.parseDateFromBatch(this.batch.qcDate);
    const qcTimeValue = this.parseTimeFromBatch(this.batch.qcDate);
    this.qcTimeControl.setValue(qcTimeValue);
    if (this.isQcDateDisabled) {
      this.qcTimeControl.disable();
    }

    this.editForm = this.fb.group({
      contractId: [{ value: this.batch.contractId, disabled: true }],
      company: [{ value: this.batch.company, disabled: true }],
      minTemp: [this.batch.minTemp, [Validators.required]],
      maxTemp: [this.batch.maxTemp, [Validators.required]],
      productType: this.isCBBatch
        ? [{ value: this.extractProductTypeCode(this.batch.productType), disabled: true }]
        : [this.extractProductTypeCode(this.batch.productType)],
      cartonCount: [{ value: this.batch.cartonCount, disabled: true }],
      numberOfUnits: [{ value: this.batch.numberOfUnits, disabled: true }],
      batchDate: [{ value: this.batch.batchDate, disabled: true }],
      shippedDate: this.isCBBatch
        ? [{ value: shippedDateValue, disabled: true }]
        : [shippedDateValue, [DateFieldValidationUtility.validDateValidator()]],
      receivedDate: this.isCBBatch
        ? [{ value: receivedDateValue, disabled: true }]
        : [receivedDateValue, [DateFieldValidationUtility.validDateValidator()]],
      qcDate: this.isQcDateDisabled
        ? [{ value: null, disabled: true }]
        : [qcDateValue, [DateFieldValidationUtility.validDateValidator()]],
      checkinUserId: [{ value: this.batch.checkinUserId, disabled: true }],
      userName: [{ value: this.batch.userName, disabled: true }],
    }, {
      validators: [batchFormValidator(this.originalQcDate)]
    });
  }

  private extractProductTypeCode(productType: string | null | undefined): string | null {
    if (!productType || productType === '-' || productType === '- -') return null;
    const parts = productType.split(' - ');
    const code = parts[0].trim();
    return code || null;
  }

  private parseDateFromBatch(dateValue: string | null | undefined): Moment | null {
    if (!dateValue) return null;
    const m = moment(dateValue);
    return m.isValid() ? m : null;
  }

  private parseTimeFromBatch(dateValue: string | null | undefined): string | null {
    if (!dateValue) return null;
    const m = moment(dateValue);
    if (!m.isValid()) return null;
    const hours = m.hours();
    const minutes = m.minutes();
    if (hours === 0 && minutes === 0) return null;
    return m.format('HH:mm');
  }

  onClearAll(): void {
    const patchValues: Record<string, unknown> = {
      minTemp: null,
      maxTemp: null,
    };

    if (!this.isCBBatch) {
      patchValues['productType'] = null;
      patchValues['shippedDate'] = null;
      patchValues['receivedDate'] = null;
    }

    if (!this.isQcDateDisabled) {
      patchValues['qcDate'] = null;
      this.qcTimeControl.setValue(null);
    }

    this.editForm.patchValue(patchValues);
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
  }

  isFormDirty(): boolean {
    return this.editForm.dirty || this.qcTimeControl.dirty;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.getRawValue();

    const updatedBatch: CheckInBatchDto = {
      ...this.batch,
      minTemp: formValue.minTemp,
      maxTemp: formValue.maxTemp,
      productType: formValue.productType,
      shippedDate: this.formatDateForApi(formValue.shippedDate),
      receivedDate: this.formatDateForApi(formValue.receivedDate),
      qcDate: this.formatDateTimeForApi(formValue.qcDate, this.qcTimeControl.value),
    };

    this.save.emit(updatedBatch);
  }

  private formatDateForApi(date: unknown): string {
    if (!date) return '';
    const m = moment(date);
    if (!m.isValid()) return '';
    return m.format('YYYY-MM-DD');
  }

  private formatDateTimeForApi(date: unknown, time: string | null): string {
    if (!date) return '';
    const m = moment(date);
    if (!m.isValid()) return '';
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      m.set({ hour: hours, minute: minutes, second: 0 });
      return m.format('YYYY-MM-DDTHH:mm:ss');
    }
    return m.format('YYYY-MM-DD');
  }

  formatDateDisplay(date: string | null): string {
    return formatTableDate(date);
  }

  getMinTemperatureError(): string {
    const control = this.editForm.get('minTemp');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('minExceedsMax')) return 'Min Temperature cannot exceed Max Temperature';
    if (control.hasError('required')) return 'Min Temperature is required';
    return '';
  }

  getMaxTemperatureError(): string {
    const control = this.editForm.get('maxTemp');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('minExceedsMax')) return 'Min Temperature cannot exceed Max Temperature';
    if (control.hasError('required')) return 'Max Temperature is required';
    return '';
  }

  getShippedDateError(): string {
    const control = this.editForm.get('shippedDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('shippedAfterBatch')) return 'Shipped Date cannot be after Batch Date';
    return DateFieldValidationUtility.getDateErrorMessage(control, null, 'Shipped Date');
  }

  getReceivedDateError(): string {
    const control = this.editForm.get('receivedDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('receivedAfterBatch')) return 'Received Date cannot be after Batch Date';
    if (control.hasError('receivedBeforeShipped')) return 'Received Date cannot be before Shipped Date';
    return DateFieldValidationUtility.getDateErrorMessage(control, null, 'Received Date');
  }

  getQcDateError(): string {
    const control = this.editForm.get('qcDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('qcBeforeOriginal')) return 'QC Date cannot be earlier than original QC Date';
    return DateFieldValidationUtility.getDateErrorMessage(control, null, 'QC Date');
  }

  // --- Date input/blur handlers for typed date validation ---

  onShippedDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.shippedDateRawInput = input.value.trim();
    const control = this.editForm.get('shippedDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    setTimeout(() => {
      if (this.shippedDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onShippedDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.editForm.get('shippedDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && moment.isMoment(controlValue) && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.shippedDateRawInput = formattedDate;
      } else if (inputValue && !controlValue) {
        input.value = this.shippedDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      }
    }, 0);
  }

  onReceivedDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.receivedDateRawInput = input.value.trim();
    const control = this.editForm.get('receivedDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    setTimeout(() => {
      if (this.receivedDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onReceivedDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.editForm.get('receivedDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && moment.isMoment(controlValue) && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.receivedDateRawInput = formattedDate;
      } else if (inputValue && !controlValue) {
        input.value = this.receivedDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      }
    }, 0);
  }

  onQcDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.qcDateRawInput = input.value.trim();
    const control = this.editForm.get('qcDate');
    if (!control) return;
    control.markAsDirty();
    control.markAsTouched();
    setTimeout(() => {
      if (this.qcDateRawInput && !control.value) {
        control.setErrors({ ...control.errors, invalidDate: true });
      }
    }, 0);
  }

  onQcDateBlur(input: HTMLInputElement): void {
    setTimeout(() => {
      const control = this.editForm.get('qcDate');
      if (!control) return;
      control.markAsTouched();
      const controlValue = control.value;
      const inputValue = input.value.trim();

      if (controlValue && moment.isMoment(controlValue) && controlValue.isValid()) {
        const formattedDate = DateFieldValidationUtility.formatDateForUI(controlValue);
        input.value = formattedDate;
        this.qcDateRawInput = formattedDate;
      } else if (inputValue && !controlValue) {
        input.value = this.qcDateRawInput;
        if (!control.hasError('invalidDate')) {
          control.setErrors({ invalidDate: true });
        }
      }
    }, 0);
  }
}
