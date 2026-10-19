import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
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
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { TemperatureSuffixDirective } from '@shared/directives/temperature-suffix.directive';
import { CheckInBatchDto, ProductTypeOption } from '../models/modify-check-in-batch.model';

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
    NgxMatSelectSearchModule,
    TemperatureSuffixDirective,
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

  @ViewChild('shippedDateInput') shippedDateInput!: ElementRef<HTMLInputElement>;

  readonly productTypeSearchCtrl = new FormControl('');
  filteredProductTypeOptions: ProductTypeOption[] = [];
  @ViewChild('receivedDateInput') receivedDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('qcDateInput') qcDateInput!: ElementRef<HTMLInputElement>;

  editForm!: FormGroup;

  shippedDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.shippedDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  receivedDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.receivedDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  qcDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.qcDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  ngOnInit(): void {
    this.initializeForm();
    this.setupProductTypeSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.editForm = this.fb.group({
      contract: [{ value: this.batch.contract, disabled: true }],
      description: [{ value: this.batch.description, disabled: true }],
      minTemperature: [this.batch.minTemperature, [Validators.required]],
      maxTemperature: [this.batch.maxTemperature, [Validators.required]],
      productType: [this.batch.productType, [Validators.required]],
      cartonCount: [{ value: this.batch.cartonCount, disabled: true }],
      numberOfUnits: [{ value: this.batch.numberOfUnits, disabled: true }],
      batchDate: [{ value: this.batch.batchDate, disabled: true }],
      shippedDate: [this.parseDateFromBatch(this.batch.shippedDate), [Validators.required]],
      receivedDate: [this.parseDateFromBatch(this.batch.receivedDate), [Validators.required]],
      qcDate: [this.parseDateFromBatch(this.batch.qcDate), [Validators.required]],
      checkInUserId: [{ value: this.batch.checkInUserId, disabled: true }],
      userName: [{ value: this.batch.userName, disabled: true }],
    });
  }

  private setupProductTypeSearch(): void {
    this.filteredProductTypeOptions = [...this.productTypeOptions];

    this.productTypeSearchCtrl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(q => {
        const s = (q || '').toLowerCase();
        this.filteredProductTypeOptions = s
          ? this.productTypeOptions.filter(
              t => t.code.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)
            )
          : [...this.productTypeOptions];
      });
  }

  onProductTypeDropdownOpenChange(opened: boolean): void {
    if (opened) {
      this.filteredProductTypeOptions = [...this.productTypeOptions];
    } else {
      this.productTypeSearchCtrl.setValue('', { emitEvent: false });
    }
  }

  private parseDateFromBatch(dateValue: string | null | undefined): Moment | null {
    if (!dateValue) return null;
    const m = moment(dateValue, 'YYYY-MM-DD');
    return m.isValid() ? m : null;
  }

  onClearAll(): void {
    this.editForm.patchValue({
      minTemperature: null,
      maxTemperature: null,
      productType: null,
      shippedDate: null,
      receivedDate: null,
      qcDate: null,
    });
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
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
      minTemperature: formValue.minTemperature,
      maxTemperature: formValue.maxTemperature,
      productType: formValue.productType,
      shippedDate: this.formatDateForApi(formValue.shippedDate),
      receivedDate: this.formatDateForApi(formValue.receivedDate),
      qcDate: this.formatDateForApi(formValue.qcDate),
    };

    this.save.emit(updatedBatch);
  }

  private formatDateForApi(date: any): string {
    if (!date) return '';
    const m = moment(date);
    if (!m.isValid()) return '';
    return m.format('YYYY-MM-DD');
  }

  getErrorMessage(controlName: string): string {
    const control = this.editForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    return '';
  }

  formatDateDisplay(date: string | null): string {
    if (!date) return '';
    const m = moment(date, 'YYYY-MM-DD');
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  getShippedDateError(): string {
    const control = this.editForm.get('shippedDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Enter correct Shipped Date';
    }
    if (control.hasError('required')) {
      const inputValue = this.shippedDateInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'Enter correct Shipped Date';
      }
      return 'Shipped Date is required';
    }
    return '';
  }

  getReceivedDateError(): string {
    const control = this.editForm.get('receivedDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Enter correct Received Date';
    }
    if (control.hasError('required')) {
      const inputValue = this.receivedDateInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'Enter correct Received Date';
      }
      return 'Received Date is required';
    }
    return '';
  }

  getQcDateError(): string {
    const control = this.editForm.get('qcDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'Enter correct QC Date';
    }
    if (control.hasError('required')) {
      const inputValue = this.qcDateInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'Enter correct QC Date';
      }
      return 'QC Date is required';
    }
    return '';
  }
}
