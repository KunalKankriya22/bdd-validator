import { Component, Inject, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OcqService } from '../services/ocq.service';
import { OrderItemDetailDto } from '../models/ocq.model';
import { SnackbarService } from '@shared/services/snackbar.service';

/**
 * Dialog data interface
 */
export interface AttributesAntigensDialogData {
  orderNo: string;
  itemNo: number;
  orderStatus: string;
  orderStatusDesc: string;
}

/**
 * Attributes & Antigens Dialog Component
 * JIRA: MLT-14025
 * Displays detailed attributes and antigens for an order item
 */
@Component({
  selector: 'app-attributes-antigens-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './attributes-antigens-dialog.html',
  styleUrls: ['./attributes-antigens-dialog.scss'],
})
export class AttributesAntigensDialog implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `attr-antigen-dialog-${AttributesAntigensDialog.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  // Dependencies
  private readonly ocqService = inject(OcqService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialogRef = inject(MatDialogRef<AttributesAntigensDialog>);
  private readonly destroy$ = new Subject<void>();

  // Dialog data
  protected readonly data: AttributesAntigensDialogData = inject(MAT_DIALOG_DATA);

  // Signal-based state
  protected readonly itemDetail = signal<OrderItemDetailDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadItemDetail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load order item detail with attributes and antigens
   */
  protected loadItemDetail(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ocqService
      .getOrderItemDetail(this.data.orderNo, this.data.itemNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.itemDetail.set(detail);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.getErrorMessage(err));
          this.loading.set(false);
          this.snackbarService.showError(this.getErrorMessage(err));
        },
      });
  }

  /**
   * Close the dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Get status badge color class
   */
  getStatusColorClass(status: string): string {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus.includes('order')) return 'status-ordered';
    if (normalizedStatus.includes('cancel')) return 'status-canceled';
    if (normalizedStatus.includes('close')) return 'status-closed';
    return 'status-default';
  }

  /**
   * Extract error message from error response
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.errorResponse?.error) {
      return error.error.errorResponse.error;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    return 'Failed to load order item details';
  }
}
