import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { RegisteredDonationsQueryService } from '../services/registered-donations-query.service';
import {
  PhlebotomyDetailsDto,
  PhlebotomyDetailsDialogData,
} from '../models/registered-donations-query.model';

@Component({
  selector: 'app-phlebotomy-details-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './phlebotomy-details-dialog.html',
  styleUrl: './phlebotomy-details-dialog.scss',
})
export class PhlebotomyDetailsDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<PhlebotomyDetailsDialogComponent>);
  readonly data: PhlebotomyDetailsDialogData = inject(MAT_DIALOG_DATA);
  private readonly service = inject(RegisteredDonationsQueryService);
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly details = signal<PhlebotomyDetailsDto | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onRetry(): void {
    this.loadData();
  }

  formatTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatValue(value: string | number | null | undefined): string {
    if (value == null) return '--';
    const str = String(value).trim();
    return str || '--';
  }

  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getPhlebotomyDetails(this.data.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.details.set(result);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to load phlebotomy details');
          this.loading.set(false);
        },
      });
  }
}
