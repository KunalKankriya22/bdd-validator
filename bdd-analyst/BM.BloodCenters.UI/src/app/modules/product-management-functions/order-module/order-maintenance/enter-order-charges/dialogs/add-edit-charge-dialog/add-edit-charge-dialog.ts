import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { AddEditChargeDialogData, ServiceCodeDto } from '../../models/enter-order-charges.model';
import { EnterOrderChargesApiService } from '../../services/enter-order-charges-api.service';

@Component({
  selector: 'app-add-edit-charge-dialog',
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
    NgxMatSelectSearchModule,
  ],
  templateUrl: './add-edit-charge-dialog.html',
  styleUrls: ['./add-edit-charge-dialog.scss'],
})
export class AddEditChargeDialogComponent implements OnInit, OnDestroy {
  readonly data = inject<AddEditChargeDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AddEditChargeDialogComponent>);
  private readonly apiService = inject(EnterOrderChargesApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly fb = inject(FormBuilder);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  serviceCodeSearchCtrl = new FormControl('');
  serviceCodeSearch = signal('');
  filteredServiceCodes = computed(() => {
    const search = this.serviceCodeSearch().toLowerCase();
    if (!search) return this.data.serviceCodes;
    return this.data.serviceCodes.filter(sc =>
      sc.code.toLowerCase().includes(search) || sc.description.toLowerCase().includes(search),
    );
  });
  crDbSearchCtrl = new FormControl('');
  crDbSearch = signal('');
  filteredCrDbIndicators = computed(() => {
    const search = this.crDbSearch().toLowerCase();
    if (!search) return this.data.crDbIndicators;
    return this.data.crDbIndicators.filter(i =>
      i.code.toLowerCase().includes(search) || i.description.toLowerCase().includes(search),
    );
  });
  serviceDescription = signal('');
  selectedServiceCode = signal<ServiceCodeDto | null>(null);
  amountEditable = signal(true);
  errorMessage = signal('');
  isSaving = false;
  private initialFormValues: { serviceCode: string; creditDebit: string; quantity: number; amount: number } | null = null;

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get panelTitle(): string {
    return this.isEditMode ? 'Edit Order Charges' : 'Add New Charges';
  }

  get lastModifiedDisplay(): string {
    if (!this.isEditMode || !this.data.charge?.lastModified) return '';
    return `Last Modified: ${this.data.charge.lastModified}`;
  }

  get isFormValid(): boolean {
    if (this.isEditMode) {
      return this.form.valid && this.hasFormChanged();
    }
    return this.form.valid;
  }

  private hasFormChanged(): boolean {
    if (!this.initialFormValues) return true;
    const current = this.form.getRawValue();
    return current.serviceCode !== this.initialFormValues.serviceCode ||
           current.creditDebit !== this.initialFormValues.creditDebit ||
           current.quantity !== this.initialFormValues.quantity ||
           current.amount !== this.initialFormValues.amount;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      serviceCode: [this.data.charge?.serviceCode ?? '', Validators.required],
      creditDebit: [this.data.charge?.creditDebit ?? '', Validators.required],
      quantity: [this.data.charge?.quantity ?? 1, [Validators.required, Validators.min(1), Validators.max(99999)]],
      amount: [this.data.charge?.amount ?? '', [Validators.required, Validators.min(0), Validators.max(99999999.99)]],
    });

    if (this.isEditMode && this.data.charge) {
      this.serviceDescription.set(this.data.charge.serviceDescription);
      const match = this.data.serviceCodes.find(s => s.code === this.data.charge!.serviceCode);
      this.selectedServiceCode.set(match ?? null);
      const editable = this.data.charge.isAmountEditable ?? match?.isAmountEditable ?? true;
      this.amountEditable.set(editable);
      this.updateAmountFieldState(editable);

      this.initialFormValues = {
        serviceCode: this.data.charge.serviceCode,
        creditDebit: this.data.charge.creditDebit ?? '',
        quantity: this.data.charge.quantity,
        amount: this.data.charge.amount,
      };
    }

    this.serviceCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.serviceCodeSearch.set(val || ''));

    this.crDbSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.crDbSearch.set(val || ''));

    this.form.get('serviceCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        const match = this.data.serviceCodes.find(s => s.code === code);
        this.selectedServiceCode.set(match ?? null);
        this.serviceDescription.set(match?.description ?? '');
        const editable = match?.isAmountEditable ?? true;
        this.amountEditable.set(editable);
        this.updateAmountFieldState(editable);
        this.recalculateAmount();
      });

    this.form.get('quantity')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recalculateAmount();
      });
  }

  private recalculateAmount(): void {
    const unitCharge = this.selectedServiceCode()?.defaultAmount ?? 0;
    const quantity = this.form.get('quantity')?.value ?? 1;
    const calculatedAmount = quantity * unitCharge;
    this.form.get('amount')?.setValue(calculatedAmount, { emitEvent: false });
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.form.controls)
      .find(key => this.form.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      el?.focus();
    }
  }

  private updateAmountFieldState(editable: boolean): void {
    const amountCtrl = this.form.get('amount');
    if (editable) {
      amountCtrl?.enable({ emitEvent: false });
    } else {
      amountCtrl?.disable({ emitEvent: false });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.isFormValid || this.isSaving) {
      this.form.markAllAsTouched();
      this.liveAnnouncer.announce('Form has validation errors. Please correct the errors and try again.', 'assertive');
      this.focusFirstInvalidField();
      return;
    }

    this.isSaving = true;
    const formValue = this.form.getRawValue();
    const crDbCode = this.data.crDbIndicators.find(
      i => i.description === formValue.creditDebit,
    )?.code || formValue.creditDebit;

    const request = {
      serviceCode: formValue.serviceCode,
      creditDebit: crDbCode,
      quantity: formValue.quantity,
      amount: formValue.amount,
      ...(this.isEditMode && this.data.charge
        ? { rowId: this.data.charge.orderChargeRowId }
        : {}),
    };

    const obs = this.isEditMode
      ? this.apiService.updateCharge(request)
      : this.apiService.addCharge(this.data.orderNo, request);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.snackbarService.showSuccess(
            this.isEditMode ? 'Charge updated successfully.' : 'Charge added successfully.',
          );
          this.dialogRef.close(true);
        } else {
          const msg = response.errorResponse?.error || response.message || 'Failed to save charge.';
          this.snackbarService.showError(msg);
        }
      },
      error: (error) => {
        this.isSaving = false;
        this.snackbarService.showError(
          HttpErrorHandler.extractErrorMessage(error, 'Failed to save charge.'),
        );
      },
    });
  }
}
