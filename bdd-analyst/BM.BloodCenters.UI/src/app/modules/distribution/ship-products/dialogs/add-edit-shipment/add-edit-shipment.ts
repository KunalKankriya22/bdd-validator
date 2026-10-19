import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { ShipProductsService } from '../../services/ship-products.service';
import {
  CreateShipmentDto,
  UpdateShipmentDto,
  LovOption,
  SHIPMENT_FIELD_LENGTHS
} from '../../models/ship-products.model';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface AddEditShipmentDialogData {
  mode: 'add' | 'edit';
  shipmentNo?: string;
}

/**
 * Add/Edit Shipment Dialog
 * Create new shipment or edit existing shipment carrier/tracking information
 */
@Component({
  selector: 'app-add-edit-shipment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-shipment.html',
  styleUrls: ['./add-edit-shipment.scss']
})
export class AddEditShipmentDialog implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `add-edit-shipment-${AddEditShipmentDialog.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly shipProductsService = inject(ShipProductsService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialogRef = inject(MatDialogRef<AddEditShipmentDialog>);

  protected readonly consigneeOptions = signal<LovOption[]>([]);
  protected readonly carrierOptions = signal<LovOption[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingOptions = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  shipmentForm!: FormGroup;
  readonly fieldLengths = SHIPMENT_FIELD_LENGTHS;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddEditShipmentDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownOptions();

    if (this.data.mode === 'edit' && this.data.shipmentNo) {
      this.loadShipmentData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const isEditMode = this.data.mode === 'edit';

    this.shipmentForm = this.fb.group({
      consigneeId: [
        { value: '', disabled: isEditMode },
        [Validators.required, Validators.maxLength(this.fieldLengths.CONSIGNEE_ID)]
      ],
      carrier: ['', [Validators.required, Validators.maxLength(this.fieldLengths.CARRIER)]],
      trackNo: [
        '',
        [Validators.required, Validators.maxLength(this.fieldLengths.TRACK_NO)]
      ],
      flightNo: ['', Validators.maxLength(this.fieldLengths.FLIGHT_NO)]
    });
  }

  private loadDropdownOptions(): void {
    this.loadingOptions.set(true);

    // Load consignees
    this.shipProductsService.getConsigneeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.consigneeOptions.set(options),
        error: (err) => console.error('Failed to load consignee options', err)
      });

    // Load carriers
    this.shipProductsService.getCarrierOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.carrierOptions.set(options);
          this.loadingOptions.set(false);
        },
        error: (err) => {
          console.error('Failed to load carrier options', err);
          this.loadingOptions.set(false);
        }
      });
  }

  private loadShipmentData(): void {
    if (!this.data.shipmentNo) return;

    this.loading.set(true);

    this.shipProductsService.getShipmentByNumber(this.data.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            const shipment = response.data[0];
            this.shipmentForm.patchValue({
              consigneeId: shipment.consigneeId,
              carrier: shipment.carrier,
              trackNo: shipment.trackNo,
              flightNo: shipment.flightNo
            });
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(
            err.error?.message || 'Failed to load shipment data'
          );
          this.loading.set(false);
        }
      });
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.shipmentForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    if (this.data.mode === 'add') {
      this.createShipment();
    } else {
      this.updateShipment();
    }
  }

  private createShipment(): void {
    const formValue = this.shipmentForm.getRawValue();
    const consigneeOption = this.consigneeOptions().find(o => o.value === formValue.consigneeId);
    const carrierOption = this.carrierOptions().find(o => o.value === formValue.carrier);

    this.dialogRef.close({
      pendingData: {
        consigneeId: formValue.consigneeId,
        carrier: formValue.carrier || null,
        trackNo: (formValue.trackNo || '').toUpperCase(),
        flightNo: (formValue.flightNo || '').toUpperCase() || null
      },
      consigneeInfo: consigneeOption,
      carrierInfo: carrierOption
    });
  }

  private updateShipment(): void {
    if (!this.data.shipmentNo) return;

    this.loading.set(true);

    const formValue = this.shipmentForm.getRawValue();
    const dto: UpdateShipmentDto = {
      carrier: formValue.carrier || null,
      trackNo: (formValue.trackNo || '').toUpperCase(),
      flightNo: (formValue.flightNo || '').toUpperCase() || null
    };

    this.shipProductsService.updateShipment(this.data.shipmentNo, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.dialogRef.close({ success: true, shipmentNo: this.data.shipmentNo });
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(
            err.error?.message || 'Failed to update shipment'
          );
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  get f() {
    return this.shipmentForm.controls;
  }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edit Shipment' : 'Add New Shipment';
  }
}
