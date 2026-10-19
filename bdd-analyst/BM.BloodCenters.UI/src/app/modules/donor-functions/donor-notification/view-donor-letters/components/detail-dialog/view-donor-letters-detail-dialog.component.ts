import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { ViewDonorLettersService } from '../../services/view-donor-letters.service';
import {
  DonorLetterDetailDto,
  ViewDonorLettersDetailDialogData,
} from '../../models/view-donor-letters.model';

@Component({
  selector: 'app-view-donor-letters-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './view-donor-letters-detail-dialog.component.html',
  styleUrls: ['./view-donor-letters-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDonorLettersDetailDialogComponent implements OnInit, OnDestroy {
  private readonly service = inject(ViewDonorLettersService);
  private readonly dialogRef = inject(MatDialogRef<ViewDonorLettersDetailDialogComponent>);
  private destroy$ = new Subject<void>();

  letterDetail = signal<DonorLetterDetailDto | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ViewDonorLettersDetailDialogData
  ) {}

  ngOnInit(): void {
    this.loadLetterDetail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLetterDetail(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .getDonorLetterDetail(this.data.donorId, this.data.letterSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.letterDetail.set(detail);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load letter details');
          this.loading.set(false);
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onRetry(): void {
    this.loadLetterDetail();
  }
}
