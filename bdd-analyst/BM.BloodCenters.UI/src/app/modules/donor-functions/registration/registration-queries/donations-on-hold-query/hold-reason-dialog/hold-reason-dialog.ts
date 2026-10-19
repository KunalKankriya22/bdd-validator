import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment from 'moment';

import { DonationsOnHoldQueryService } from '../services/donations-on-hold-query.service';
import {
  DonationHoldDetail,
  DonorHoldDetail,
  HoldReasonDialogData,
} from '../models/donations-on-hold-query.model';

@Component({
  selector: 'app-hold-reason-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './hold-reason-dialog.html',
  styleUrls: ['./hold-reason-dialog.scss'],
})
export class HoldReasonDialogComponent implements OnInit, OnDestroy {
  donationHolds: DonationHoldDetail[] = [];
  donorHolds: DonorHoldDetail[] = [];

  donationHoldColumns: string[] = ['interType', 'holdCode', 'description', 'createdDate', 'terminationDate', 'comments'];
  donorHoldColumns: string[] = ['interType', 'holdCode', 'description', 'createdDate', 'effectiveDate', 'terminationDate'];

  isLoadingDonationHolds = false;
  isLoadingDonorHolds = false;

  donationHoldFilter: 'A' | 'L' = 'A';
  donorHoldFilter: 'A' | 'L' = 'A';

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<HoldReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HoldReasonDialogData,
    private service: DonationsOnHoldQueryService,
  ) {}

  ngOnInit(): void {
    this.loadDonationHolds();
    if (this.data.donorId) {
      this.loadDonorHolds();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDonationHoldFilterChange(value: 'A' | 'L'): void {
    this.donationHoldFilter = value;
    this.loadDonationHolds();
  }

  onDonorHoldFilterChange(value: 'A' | 'L'): void {
    this.donorHoldFilter = value;
    this.loadDonorHolds();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY, hh:mm A').toUpperCase() : dateString;
  }

  formatCollDate(): string {
    return this.formatDate(this.data.collDate);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  private loadDonationHolds(): void {
    this.isLoadingDonationHolds = true;
    const activeOnly = this.donationHoldFilter === 'A';

    this.service
      .getDonationHolds(this.data.transactionId, activeOnly)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingDonationHolds = false;
        }),
      )
      .subscribe({
        next: (holds) => {
          this.donationHolds = holds;
        },
        error: () => {
          this.donationHolds = [];
        },
      });
  }

  private loadDonorHolds(): void {
    this.isLoadingDonorHolds = true;
    const activeOnly = this.donorHoldFilter === 'A';

    this.service
      .getDonorHolds(this.data.transactionId, this.data.donorId, activeOnly)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingDonorHolds = false;
        }),
      )
      .subscribe({
        next: (holds) => {
          this.donorHolds = holds;
        },
        error: () => {
          this.donorHolds = [];
        },
      });
  }
}
