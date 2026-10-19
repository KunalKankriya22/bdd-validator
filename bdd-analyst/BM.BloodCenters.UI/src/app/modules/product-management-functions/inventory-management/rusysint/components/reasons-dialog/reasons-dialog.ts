import { Component, Inject, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { ReleaseProductQuarantineApiService } from '../../services/release-product-quarantine-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { QuarantineProduct, QuarantineReason } from '../../models/release-product-quarantine.model';

/**
 * Dialog data interface for Reasons Dialog
 */
export interface ReasonsDialogData {
  product: QuarantineProduct;
}

/**
 * Quarantine Reasons Dialog Component
 * Displays and manages quarantine reasons for a product
 */
@Component({
  selector: 'app-reasons-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './reasons-dialog.html',
  styleUrls: ['./reasons-dialog.scss']
})
export class ReasonsDialog implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `reasons-dialog-${ReasonsDialog.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private apiService = inject(ReleaseProductQuarantineApiService);
  private snackbarService = inject(SnackbarService);
  private matDialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly reasons = signal<QuarantineReason[]>([]);
  readonly removingReasonCode = signal<string | null>(null);

  displayedColumns: string[] = ['reasonCode', 'reasonDesc', 'createdDate', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<ReasonsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ReasonsDialogData
  ) {}

  ngOnInit(): void {
    this.loadReasons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadReasons(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .getQuarantineReasons(
        this.data.product.unitId,
        this.data.product.productCode,
        this.data.product.aliquot
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.reasons.set(reasons);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set('Failed to load quarantine reasons. Please try again.');
          this.snackbarService.showError('Failed to load quarantine reasons');
        }
      });
  }

  formatDate(value: string): string {
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }

  onRemoveReason(reason: QuarantineReason): void {
    const dialogRef = this.matDialog.open(MessageDialog, {
      width: '500px',
      data: {
        title: 'Confirm Remove Reason',
        message: `Are you sure you want to remove the quarantine reason "${reason.reasonCode} - ${reason.reasonDesc || 'No description'}"?`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        type: 'warning'
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.removeReason(reason);
        }
      });
  }

  private removeReason(reason: QuarantineReason): void {
    this.removingReasonCode.set(reason.reasonCode);

    this.apiService
      .removeQuarantineReason(
        reason.unitId,
        reason.productCode,
        reason.aliquot,
        reason.reasonCode
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          this.removingReasonCode.set(null);
          if (success) {
            this.snackbarService.showSuccess(
              `Quarantine reason ${reason.reasonCode} removed successfully`
            );
            this.loadReasons(); // Reload reasons after removal
          } else {
            this.snackbarService.showError('Failed to remove quarantine reason');
          }
        },
        error: (error) => {
          this.removingReasonCode.set(null);
          this.snackbarService.showError('Failed to remove quarantine reason');
        }
      });
  }

  onRetry(): void {
    this.loadReasons();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  get hasReasons(): boolean {
    return this.reasons().length > 0;
  }

  isRemoving(reasonCode: string): boolean {
    return this.removingReasonCode() === reasonCode;
  }
}
