import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { DetachDonorFromDonationService } from '../services/detach-donor-from-donation.service';
import { BleedTimeDetailsDto } from '../models/detach-donor-from-donation.model';
import { DonationEntryDetailsService } from '@shared/services/donation-entry-details.service';
import { DonationDetails } from '@shared/models/donation-entry-details.model';

export interface BleedTimeDetailsDialogInput {
  unitId: string;
  collDate?: string;
}

@Component({
  selector: 'app-bleed-time-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './bleed-time-details.html',
  styleUrl: './bleed-time-details.scss',
})
export class BleedTimeDetailsComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<BleedTimeDetailsComponent>);
  private readonly data: BleedTimeDetailsDialogInput = inject(MAT_DIALOG_DATA);
  private readonly bleedService = inject(DetachDonorFromDonationService);
  private readonly entryDetailsService = inject(DonationEntryDetailsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  private static readonly MONTH_NAMES = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];

  loading = true;
  details: BleedTimeDetailsDto | null = null;
  donationDetails: DonationDetails = {};

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

  formatValue(value: string | number | null | undefined): string {
    if (value == null) return '--';
    const str = String(value).trim();
    return str || '--';
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
    const day = date.getDate().toString().padStart(2, '0');
    const month = BleedTimeDetailsComponent.MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private loadData(): void {
    this.loading = true;

    forkJoin({
      bleed: this.bleedService.getBleedTimeDetails(this.data.unitId),
      entry: this.entryDetailsService.getEntryDetails(this.data.unitId, this.data.collDate),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ bleed, entry }) => {
          this.details = bleed?.item ?? null;
          this.donationDetails = entry?.donationDetails ?? {};
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }
}
