import { Component, inject, OnInit, OnDestroy, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import { CentralNote } from '../models/donor-detail-query.model';

export interface DonorNotesDialogData {
  donorId: string;
  donorName?: string;
}

@Component({
  selector: 'app-donor-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title" mat-dialog-title>Donor Notes</h2>
        <button type="button" mat-icon-button class="panel-close-x" aria-label="Close panel" (click)="onClose()">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <div class="panel-body">
        @if (loading()) {
          <div class="state-container" role="status" aria-live="polite" aria-busy="true">
            <mat-spinner diameter="40" [attr.aria-label]="'Loading notes'"></mat-spinner>
            <p class="state-text">Loading notes...</p>
          </div>
        } @else if (error()) {
          <div class="state-container" role="alert" aria-live="assertive">
            <mat-icon color="warn" aria-hidden="true">error</mat-icon>
            <p class="state-text">{{ error() }}</p>
            <button mat-stroked-button color="primary" type="button" (click)="loadNotes()">RETRY</button>
          </div>
        } @else if (hasNotes()) {
          @for (note of notes(); track note.noteSequence) {
            <div class="note-card">
              <div class="card-header">
                <span class="card-donor">{{ data.donorId }} - {{ data.donorName }}</span>
                <span class="card-meta">{{ note.noteSequence }}.0 | {{ note.noteId }} |{{ formatDate(note.insertDate) }}</span>
              </div>
              <div class="card-note-box">
                <span class="note-label">Notes</span>
                <p class="note-text">{{ note.note }}</p>
              </div>
            </div>
          }
        } @else {
          <div class="state-container">
            <mat-icon class="empty-icon" aria-hidden="true">notes</mat-icon>
            <p class="state-text">No notes found for this donor.</p>
          </div>
        }
      </div>

      <div class="panel-footer">
        <button mat-flat-button class="close-btn" type="button" (click)="onClose()">CLOSE</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f9fafb;
    }

    /* ── Header ── */
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 24px 20px;
    }

    .panel-title {
      margin: 0;
      font-family: 'Roboto', sans-serif;
      font-size: 20px;
      font-weight: 400;
      color: #1a1a1a;
      letter-spacing: -0.2px;
    }

    .panel-close-x {
      color: rgba(0, 0, 0, 0.54);
      flex-shrink: 0;
      &:hover { color: rgba(0, 0, 0, 0.87); }
    }

    /* ── Scrollable body ── */
    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 3px; }
    }

    /* ── Note card ── */
    .note-card {
      border: 1px solid #e2e5e9;
      border-radius: 8px;
      background: #ffffff;
      padding: 18px 20px;
    }

    .card-header {
      margin-bottom: 14px;
    }

    .card-donor {
      display: block;
      font-family: 'Roboto', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.4;
    }

    .card-meta {
      display: block;
      font-family: 'Roboto', sans-serif;
      font-size: 13px;
      font-weight: 400;
      color: #4d7573;
      margin-top: 3px;
    }

    /* ── Inner notes box ── */
    .card-note-box {
      background: #F7F7F7;
      border: 1px solid #e2e5e9;
      border-radius: 6px;
      padding: 14px 16px;
    }

    .note-label {
      display: block;
      font-family: 'Roboto', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: #595959;
      margin-bottom: 6px;
    }

    .note-text {
      margin: 0;
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
      color: #3a3a3a;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* ── Footer ── */
    .panel-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 14px 20px;
      border-top: 1px solid #e2e5e9;
      background: #ffffff;
    }

    .close-btn {
      background-color: #228189 !important;
      color: #fff !important;
      font-family: 'Roboto', sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.4px;
      border-radius: 4px;
      min-width: 72px;
      height: 36px;
    }

    /* ── State containers (loading / error / empty) ── */
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 32px;
      text-align: center;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;

        &.empty-icon { color: #bdbdbd; }
      }

      .state-text {
        margin: 8px 0 16px;
        font-family: 'Roboto', sans-serif;
        font-size: 14px;
        color: #757575;
      }
    }
  `],
})
export class DonorNotesDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<DonorNotesDialog>);
  private readonly donorService = inject(DonorDetailQueryService);
  private readonly destroy$ = new Subject<void>();

  readonly notes = signal<CentralNote[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasNotes = computed(() => this.notes().length > 0);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DonorNotesDialogData) {}

  ngOnInit(): void {
    this.loadNotes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotes(): void {
    if (!this.data?.donorId) {
      this.error.set('Donor ID is required');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.donorService.getCentralNotes(this.data.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notes.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load notes. Please try again.');
          this.loading.set(false);
        },
      });
  }

  formatDate(date: string): string {
    return this.donorService.formatDate(date);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
