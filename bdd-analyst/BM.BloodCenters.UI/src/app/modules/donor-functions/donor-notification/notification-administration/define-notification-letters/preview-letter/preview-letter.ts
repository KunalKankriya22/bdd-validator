import { Component, Inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotificationLettersService } from '../services/notification-letters.service';
import { PreviewLetterResponse } from '../models/notification-letter.model';

export interface PreviewLetterData {
  letterId: string;
}

@Component({
  selector: 'app-preview-letter',
  standalone: true,
  templateUrl: './preview-letter.html',
  styleUrls: ['./preview-letter.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class PreviewLetter implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  loading = signal(false);
  submitted = signal(false);
  error = signal<string | null>(null);
  previewResult = signal<PreviewLetterResponse | null>(null);

  constructor(
    private dialogRef: MatDialogRef<PreviewLetter>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewLetterData,
    private service: NotificationLettersService
  ) {}

  ngOnInit(): void {
    this.submitPreview();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitPreview(): void {
    if (!this.data.letterId) {
      this.error.set('Letter ID is required to preview.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.submitted.set(false);

    this.service.submitPreviewReport(this.data.letterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.previewResult.set(result);
          this.submitted.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || err?.message || 'Failed to submit preview report.');
          this.loading.set(false);
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
