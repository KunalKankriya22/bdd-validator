import { Component, Inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CommLetterView, PreviewLetterResponse } from '../models/communication-letter.model';
import { CommunicationLettersService } from '../services/communication-letters.service';

export interface PreviewCommLetterData {
  letter: CommLetterView;
}

@Component({
  selector: 'app-preview-comm-letter',
  standalone: true,
  templateUrl: './preview-letter.html',
  styleUrls: ['./preview-letter.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class PreviewCommLetter implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  loading = signal(false);
  submitted = signal(false);
  error = signal<string | null>(null);
  previewResult = signal<PreviewLetterResponse | null>(null);

  constructor(
    private dialogRef: MatDialogRef<PreviewCommLetter>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewCommLetterData,
    private letterService: CommunicationLettersService,
  ) {}

  ngOnInit(): void {
    this.submitPreview();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitPreview(): void {
    this.loading.set(true);
    this.error.set(null);

    this.letterService.previewLetter(this.data.letter.letterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.previewResult.set(result);
          this.submitted.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to submit preview report.');
          this.loading.set(false);
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
