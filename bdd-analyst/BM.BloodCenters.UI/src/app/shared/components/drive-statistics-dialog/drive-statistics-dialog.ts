import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Subject, takeUntil, finalize } from 'rxjs';
import { DriveStatisticsService } from '@shared/services/drive-statistics.service';
import {
  DriveStatisticsData,
  DriveStatisticsHeader,
  DonationRow,
  VenipunctureRow,
  DeferralRow,
  UnitDetailRow,
  DonorRow,
} from '@shared/models/drive-statistics.model';

@Component({
  selector: 'app-drive-statistics-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSortModule,
  ],
  templateUrl: './drive-statistics-dialog.html',
  styleUrls: ['./drive-statistics-dialog.scss'],
})
export class DriveStatisticsDialogComponent implements OnInit, OnDestroy {
  private readonly driveStatisticsService = inject(DriveStatisticsService);
  private destroy$ = new Subject<void>();

  loading = false;
  selectedTabIndex = 0;

  header: DriveStatisticsHeader = {
    driveId: '',
    chapterId: '',
    totalDonations: 0,
    driveDate: '',
    driveType: '',
    typeDescription: '',
    sponsorId: '',
    sponsorName: '',
    projectedShow: null,
    projectedDraw: null,
    projectedDeferralRate: null,
    actualDraw: 0,
    actualDeferral: 0,
    deferralRate: null,
  };

  donations: DonationRow[] = [];
  venipuncture: VenipunctureRow[] = [];
  deferralsAllogenic: DeferralRow[] = [];
  deferralsAutologousTherapeutic: DeferralRow[] = [];
  unitDetails: UnitDetailRow[] = [];
  donorsList: DonorRow[] = [];

  constructor(
    public dialogRef: MatDialogRef<DriveStatisticsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DriveStatisticsData,
  ) {}

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

  onDonorSort(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }

    this.donorsList = [...this.donorsList].sort((a, b) => {
      const valA = String(a[sort.active as keyof DonorRow] ?? '').toLowerCase();
      const valB = String(b[sort.active as keyof DonorRow] ?? '').toLowerCase();
      const comparison = valA.localeCompare(valB);
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  formatRate(value: number | null): string {
    if (value == null) {
      return '—';
    }
    return `${value}%`;
  }

  formatNullable(value: number | null): string {
    if (value == null) {
      return '—';
    }
    return value.toString();
  }

  private loadData(): void {
    this.loading = true;
    this.driveStatisticsService
      .getDriveStatistics(this.data.driveId, this.data.chapterId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false),
      )
      .subscribe({
        next: (item) => {
          this.header = item.header ?? this.header;
          this.donations = item.donations ?? [];
          this.venipuncture = item.venipuncture ?? [];
          this.deferralsAllogenic = item.deferrals?.allogenic ?? [];
          this.deferralsAutologousTherapeutic = item.deferrals?.autologousTherapeutic ?? [];
          this.unitDetails = item.unitDetails ?? [];
          this.donorsList = item.donorsList ?? [];
        },
        error: () => {},
      });
  }
}
