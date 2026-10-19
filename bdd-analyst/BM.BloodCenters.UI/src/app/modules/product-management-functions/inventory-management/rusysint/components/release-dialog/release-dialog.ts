import { Component, Inject, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { ReleaseProductQuarantineApiService } from '../../services/release-product-quarantine-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import {
  QuarantineProduct,
  StorageLocation,
  ReleaseProductRequestDto,
  RejectCodeLOV
} from '../../models/release-product-quarantine.model';
import { LocationSelectionDialog, LocationSelectionDialogData } from '../location-selection-dialog/location-selection-dialog';

/**
 * Dialog data interface for Release Product dialog
 */
export interface ReleaseDialogData {
  product: QuarantineProduct;
  quarantineType: string; // "QU" or "RT"
}

/**
 * Release Product Dialog Component
 * Allows users to release/restock/reject quarantined or returned products
 */
@Component({
  selector: 'app-release-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatRadioModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './release-dialog.html',
  styleUrls: ['./release-dialog.scss']
})
export class ReleaseDialog implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `release-dialog-${ReleaseDialog.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private fb = inject(FormBuilder);
  private apiService = inject(ReleaseProductQuarantineApiService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private matDialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  submitted = signal<boolean>(false);
  processing = signal<boolean>(false);
  selectedLocation: StorageLocation | null = null;

  // Reject codes - TODO: Fetch from API or use LAB_MASTER_CODES
  rejectCodes: RejectCodeLOV[] = [
    { rejectCode: 'EXPIRED', rejectDesc: 'Product Expired' },
    { rejectCode: 'DAMAGED', rejectDesc: 'Product Damaged' },
    { rejectCode: 'CONTAMINATED', rejectDesc: 'Possible Contamination' },
    { rejectCode: 'QC_FAIL', rejectDesc: 'Quality Control Failed' },
    { rejectCode: 'OTHER', rejectDesc: 'Other Reason' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ReleaseDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ReleaseDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      releaseAction: ['restock', [Validators.required]], // 'restock' or 'reject'
      locationId: [null],
      rejectCode: [null]
    });

    // Watch for release action changes to update validators
    this.form.get('releaseAction')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((action) => {
        this.updateValidators(action);
      });
  }

  private updateValidators(action: string): void {
    const locationControl = this.form.get('locationId');
    const rejectCodeControl = this.form.get('rejectCode');

    if (action === 'restock') {
      locationControl?.setValidators([Validators.required]);
      rejectCodeControl?.clearValidators();
      this.selectedLocation = null;
    } else {
      locationControl?.clearValidators();
      rejectCodeControl?.setValidators([Validators.required]);
      this.selectedLocation = null;
    }

    locationControl?.updateValueAndValidity();
    rejectCodeControl?.updateValueAndValidity();
  }

  get f() {
    return this.form.controls;
  }

  get isRestock(): boolean {
    return this.f['releaseAction'].value === 'restock';
  }

  get isReject(): boolean {
    return this.f['releaseAction'].value === 'reject';
  }

  get isExpired(): boolean {
    if (!this.data.product.expDate) return false;
    const expDate = moment(this.data.product.expDate);
    return expDate.isBefore(moment(), 'day');
  }

  get canRestock(): boolean {
    // Business rule: Cannot restock expired products
    if (this.isExpired) {
      return false;
    }
    // TODO: Add check for active interdictions
    return true;
  }

  formatDate(value: string | null): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  onSelectLocation(): void {
    const dialogData: LocationSelectionDialogData = {
      warehouseId: this.headerService.getCurrentWarehouseId() || '',
      productType: this.data.product.productCode,
      bloodType: this.data.product.bloodType
    };

    const dialogRef = this.matDialog.open(LocationSelectionDialog, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: StorageLocation | null) => {
        if (result) {
          this.selectedLocation = result;
          this.form.patchValue({ locationId: result.locationId });
        }
      });
  }

  onClearLocation(): void {
    this.selectedLocation = null;
    this.form.patchValue({ locationId: null });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onRelease(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    // Validate restock eligibility
    if (this.isRestock && !this.canRestock) {
      this.snackbarService.showError('This product cannot be restocked. Please select Reject.');
      return;
    }

    this.processing.set(true);

    const request: ReleaseProductRequestDto = {
      quarantineType: this.data.quarantineType,
      unitId: this.data.product.unitId,
      productCode: this.data.product.productCode,
      aliquot: this.data.product.aliquot,
      restockFlag: this.isRestock ? 'Y' : 'N'
    };

    if (this.isRestock && this.selectedLocation) {
      request.locationId = this.selectedLocation.locationId;
      request.warehouseId = this.selectedLocation.warehouseId;
      request.deviceNumber = this.selectedLocation.deviceNumber;
      request.rackNumber = this.selectedLocation.rackNumber;
      request.trayId = this.selectedLocation.trayId;
    } else if (this.isReject) {
      request.rejectCode = this.f['rejectCode'].value;
    }

    this.apiService.releaseProduct(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.processing.set(false);
          const action = this.isRestock ? 'restocked' : 'rejected';
          this.snackbarService.showSuccess(`Product ${response.unitId} ${action} successfully`);
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.processing.set(false);
          this.handleError(error);
        }
      });
  }

  private handleError(error: any): void {
    const errorCode = error?.error?.errorCode;
    const message = error?.error?.message;

    switch (errorCode) {
      case '0700':
        this.snackbarService.showError('Invalid scan length');
        break;
      case '5332':
        this.snackbarService.showError('Invalid release type');
        break;
      case '0353':
      case '0342':
        this.snackbarService.showError(message || 'Unit not in quarantine/returns');
        break;
      case '0204':
        this.snackbarService.showError('Must select a reject reason');
        break;
      case '9930':
        this.snackbarService.showError('Special processing inventory cannot be restocked from returns');
        break;
      case '0341':
        this.snackbarService.showError('Invalid storage location selected');
        break;
      case '5001':
        this.snackbarService.showError('Product has already been restocked');
        break;
      default:
        this.snackbarService.showError(message || 'Failed to release product. Please try again.');
    }
  }

  formatRejectCode(code: RejectCodeLOV): string {
    return code.rejectDesc
      ? `${code.rejectCode} - ${code.rejectDesc}`
      : code.rejectCode;
  }
}
