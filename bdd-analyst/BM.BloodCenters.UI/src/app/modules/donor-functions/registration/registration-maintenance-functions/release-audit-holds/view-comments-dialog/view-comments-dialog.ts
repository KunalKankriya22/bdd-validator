import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { AuditHoldRecord, GetHoldCommentsRequest } from '../models/release-audit-holds.model';
import { ReleaseAuditHoldsService } from '../services/release-audit-holds.service';

export interface ViewCommentsDialogData {
  record: AuditHoldRecord;
}

@Component({
  selector: 'app-view-comments-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './view-comments-dialog.html',
  styleUrls: ['./view-comments-dialog.scss']
})
export class ViewCommentsDialog implements OnInit, OnDestroy {
  comments = '';
  isLoading = false;
  hasError = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();
  private releaseAuditHoldsService = inject(ReleaseAuditHoldsService);

  constructor(
    public dialogRef: MatDialogRef<ViewCommentsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ViewCommentsDialogData
  ) {}

  ngOnInit(): void {
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadComments(): void {
    const record = this.data.record;

    const request: GetHoldCommentsRequest = {
      transactionId: record.transactionId,
      interCode: record.hold,
      donorId: record.donorId,
      originatedFrom: record.origin,
      reasonCode: record.reason,
      groupId: record.groupId,
      groupMode: record.groupMode
    };

    this.isLoading = true;
    this.hasError = false;

    this.releaseAuditHoldsService
      .getHoldComments(record.unitId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          const commentsData = response.data?.[0]?.comments ?? response.item?.comments;
          this.comments = commentsData || 'No comments available.';
        },
        error: (err) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage =
            err?.error?.message ||
            err?.message ||
            'Failed to load comments.';
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
