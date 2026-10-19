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
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ConsentHistoryService } from '../../services/consent-history.service';
import {
  ConsentHistoryDetailDto,
  ConsentDetailDialogData,
} from '../../models/consent-history.model';

@Component({
  selector: 'app-consent-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './consent-detail-dialog.component.html',
  styleUrls: ['./consent-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentDetailDialogComponent implements OnInit, OnDestroy {
  private readonly service = inject(ConsentHistoryService);
  private readonly dialogRef = inject(MatDialogRef<ConsentDetailDialogComponent>);
  private readonly sanitizer = inject(DomSanitizer);
  private destroy$ = new Subject<void>();
  private donorRawUrl: string | null = null;
  private witnessRawUrl: string | null = null;

  consentDetail = signal<ConsentHistoryDetailDto | null>(null);
  donorSignatureUrl = signal<SafeUrl | null>(null);
  witnessSignatureUrl = signal<SafeUrl | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConsentDetailDialogData
  ) {}

  ngOnInit(): void {
    this.loadConsentDetail();
  }

  ngOnDestroy(): void {
    this.revokeObjectUrls();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConsentDetail(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .getConsentDetail(this.data.donorId, this.data.transactionId, this.data.letterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.consentDetail.set(detail);
          this.loading.set(false);
          this.loadSignatures();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load consent details');
          this.loading.set(false);
        },
      });
  }

  private loadSignatures(): void {
    this.loadSignature('donor');
    this.loadSignature('witness');
  }

  private loadSignature(type: 'donor' | 'witness'): void {
    this.service
      .getSignature(this.data.donorId, this.data.transactionId, this.data.letterId, type)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          if (blob && blob.size > 0) {
            const rawUrl = URL.createObjectURL(blob);
            const safeUrl = this.sanitizer.bypassSecurityTrustUrl(rawUrl);
            if (type === 'donor') {
              this.donorRawUrl = rawUrl;
              this.donorSignatureUrl.set(safeUrl);
            } else {
              this.witnessRawUrl = rawUrl;
              this.witnessSignatureUrl.set(safeUrl);
            }
          }
        },
        error: () => {
          // Signature not found is not a critical error
        },
      });
  }

  private revokeObjectUrls(): void {
    if (this.donorRawUrl) {
      URL.revokeObjectURL(this.donorRawUrl);
      this.donorRawUrl = null;
    }
    if (this.witnessRawUrl) {
      URL.revokeObjectURL(this.witnessRawUrl);
      this.witnessRawUrl = null;
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onRetry(): void {
    this.revokeObjectUrls();
    this.donorSignatureUrl.set(null);
    this.witnessSignatureUrl.set(null);
    this.loadConsentDetail();
  }
}
