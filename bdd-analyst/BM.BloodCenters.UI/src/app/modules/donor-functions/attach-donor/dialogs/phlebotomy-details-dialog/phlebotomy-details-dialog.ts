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
import { Subject, takeUntil, forkJoin, of, catchError } from 'rxjs';

import { RegisteredDonationsQueryService } from '../../../registered-donations-query/services/registered-donations-query.service';
import { PhlebotomyDetailsDto } from '../../../registered-donations-query/models/registered-donations-query.model';
import { DonationEntryDetailsService } from '@shared/services/donation-entry-details.service';
import { DonationDetails } from '@shared/models/donation-entry-details.model';

export interface PhlebotomyDetailsDialogInput {
  transactionId: string;
  unitId: string;
  collDate?: string;
}

@Component({
  selector: 'app-attach-donor-phlebotomy-details-dialog',
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
export class AttachDonorPhlebotomyDetailsDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<AttachDonorPhlebotomyDetailsDialogComponent>);
  readonly data: PhlebotomyDetailsDialogInput = inject(MAT_DIALOG_DATA);
  private readonly phlebService = inject(RegisteredDonationsQueryService);
  private readonly entryDetailsService = inject(DonationEntryDetailsService);
  private readonly destroy$ = new Subject<void>();

  private static readonly MONTH_NAMES = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly phlebDetails = signal<PhlebotomyDetailsDto | null>(null);
  readonly donationDetails = signal<DonationDetails>({});

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
    const day = date.getDate().toString().padStart(2, '0');
    const month = AttachDonorPhlebotomyDetailsDialogComponent.MONTH_NAMES[date.getMonth()];
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

    forkJoin({
      phleb: this.phlebService.getPhlebotomyDetails(this.data.transactionId).pipe(
        catchError(() => of(null))
      ),
      entry: this.data.unitId
        ? this.entryDetailsService.getEntryDetails(this.data.unitId, this.data.collDate).pipe(
            catchError(() => of(null))
          )
        : of(null),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ phleb, entry }) => {
          this.phlebDetails.set(phleb ?? this.emptyPhlebDetails());
          this.donationDetails.set(entry?.donationDetails ?? {});
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load phlebotomy details');
          this.loading.set(false);
        },
      });
  }

  private emptyPhlebDetails(): PhlebotomyDetailsDto {
    return {
      armUsed: null, collDate: null, doubleStickId: null, driveId: null,
      l1BleedStart: null, l1BleedEnd: null, l2BleedStart: null, l2BleedEnd: null,
      r1BleedStart: null, r1BleedEnd: null, r2BleedStart: null, r2BleedEnd: null,
      phleb1Id: null, phleb2Id: null, phleb3Id: null, phleb4Id: null,
      phlebEnd1Id: null, phlebEnd2Id: null, phlebEnd3Id: null, phlebEnd4Id: null,
      otherStartTime: null, otherEndTime: null, otherStartPhleb: null, otherEndPhleb: null,
      driveStartTime: null, rbcLoss: null, plasmaLoss: null,
    };
  }
}
