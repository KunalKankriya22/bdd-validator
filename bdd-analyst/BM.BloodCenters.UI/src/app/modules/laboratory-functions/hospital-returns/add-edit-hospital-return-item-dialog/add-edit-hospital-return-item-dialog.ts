import {
  Component,
  Inject,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import {
  HospitalReturnItemDto,
  CreateHospitalReturnItemDto,
  UpdateHospitalReturnItemDto,
  CR_DB_OPTIONS,
} from '../models/hospital-return-item.model';
import { HospitalReturnItemApiService } from '../services/hospital-return-item-api.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

export interface AddEditHospitalReturnItemDialogData {
  mode: 'create' | 'edit' | 'delete';
  item?: HospitalReturnItemDto;
  message?: string;
}

/**
 * Add/Edit/Delete Hospital Return Item Dialog
 * Handles create, update, and delete operations
 * JIRA: MLT-14068
 */
@Component({
  selector: 'app-add-edit-hospital-return-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './add-edit-hospital-return-item-dialog.html',
  styleUrls: ['./add-edit-hospital-return-item-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditHospitalReturnItemDialogComponent implements OnDestroy {
  // Unique ID generation
  private static nextId = 0;
  protected readonly componentId = `hospital-return-dialog-${AddEditHospitalReturnItemDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Component state
  readonly loading = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Form
  form!: FormGroup;

  // Dialog mode
  readonly isCreateMode: boolean;
  readonly isEditMode: boolean;
  readonly isDeleteMode: boolean;

  // CR/DB options
  readonly crDbOptions = CR_DB_OPTIONS;

  // Lifecycle
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: HospitalReturnItemApiService,
    public dialogRef: MatDialogRef<AddEditHospitalReturnItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditHospitalReturnItemDialogData,
  ) {
    this.isCreateMode = data.mode === 'create';
    this.isEditMode = data.mode === 'edit';
    this.isDeleteMode = data.mode === 'delete';

    if (!this.isDeleteMode) {
      this.initForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form with validators
   */
  private initForm(): void {
    const item = this.data.item;

    this.form = this.fb.group({
      unitId: [
        { value: item?.unitId || '', disabled: this.isEditMode },
        [Validators.required, Validators.maxLength(15)],
      ],
      returnAdviceId: [
        { value: item?.returnAdviceId || '', disabled: this.isEditMode },
        [Validators.required, Validators.maxLength(13)],
      ],
      productCode: [item?.productCode || '', Validators.maxLength(8)],
      expDate: [item?.expDate ? moment(item.expDate) : null],
      returnReasonCode: [item?.returnReasonCode || '', Validators.maxLength(5)],
      locationId: [item?.locationId || '', Validators.maxLength(17)],
      collDate: [item?.collDate ? moment(item.collDate) : null],
      customerId: [item?.customerId || '', Validators.maxLength(10)],
      crDbInd: [item?.crDbInd || ''],
      moveDate: [item?.moveDate ? moment(item.moveDate) : null],
    });
  }

  /**
   * Get form controls
   */
  get f() {
    return this.form.controls;
  }

  /**
   * Get dialog title
   */
  get dialogTitle(): string {
    if (this.isCreateMode) return 'Add Hospital Return Item';
    if (this.isEditMode) return 'Edit Hospital Return Item';
    if (this.isDeleteMode) return 'Delete Confirmation';
    return '';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.isDeleteMode) {
      this.performDelete();
      return;
    }

    this.submitted.set(true);

    if (this.form.invalid) {
      // Focus on first invalid field
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    if (this.isCreateMode) {
      this.performCreate();
    } else if (this.isEditMode) {
      this.performUpdate();
    }
  }

  /**
   * Perform create operation
   */
  private performCreate(): void {
    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const dto: CreateHospitalReturnItemDto = {
      unitId: formValue.unitId,
      returnAdviceId: formValue.returnAdviceId,
      productCode: formValue.productCode || undefined,
      expDate: formValue.expDate ? moment(formValue.expDate).toISOString() : undefined,
      returnReasonCode: formValue.returnReasonCode || undefined,
      locationId: formValue.locationId || undefined,
      collDate: formValue.collDate
        ? moment(formValue.collDate).format('YYYY-MM-DD')
        : undefined,
      customerId: formValue.customerId || undefined,
      crDbInd: formValue.crDbInd || undefined,
      moveDate: formValue.moveDate
        ? moment(formValue.moveDate).format('YYYY-MM-DD')
        : undefined,
    };

    this.apiService
      .create(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(this.parseErrorMessage(err));
        },
      });
  }

  /**
   * Perform update operation
   */
  private performUpdate(): void {
    if (!this.data.item) return;

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const dto: UpdateHospitalReturnItemDto = {
      productCode: formValue.productCode || undefined,
      expDate: formValue.expDate ? moment(formValue.expDate).toISOString() : undefined,
      returnReasonCode: formValue.returnReasonCode || undefined,
      locationId: formValue.locationId || undefined,
      collDate: formValue.collDate
        ? moment(formValue.collDate).format('YYYY-MM-DD')
        : undefined,
      customerId: formValue.customerId || undefined,
      crDbInd: formValue.crDbInd || undefined,
      moveDate: formValue.moveDate
        ? moment(formValue.moveDate).format('YYYY-MM-DD')
        : undefined,
    };

    this.apiService
      .update(this.data.item.unitId, this.data.item.returnAdviceId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(this.parseErrorMessage(err));
        },
      });
  }

  /**
   * Perform delete operation
   */
  private performDelete(): void {
    // For delete mode, just close with confirmation
    // Actual deletion is handled by parent component
    this.dialogRef.close(true);
  }

  /**
   * Cancel dialog
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Parse error message from API response
   */
  private parseErrorMessage(err: any): string {
    if (err.error?.message) {
      return err.error.message;
    }
    if (err.error?.errorResponse?.error) {
      return err.error.errorResponse.error;
    }
    if (err.message) {
      return err.message;
    }
    return 'An unexpected error occurred';
  }
}
