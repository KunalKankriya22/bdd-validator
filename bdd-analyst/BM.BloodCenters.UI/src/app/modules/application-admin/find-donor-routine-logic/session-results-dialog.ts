import { Component, inject, OnInit, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SessionResult, DonorSearchResult } from './models/donor-routine-logic.model';
import { DonorRoutineLogicService } from './services/donor-routine-logic.service';

export interface SessionResultsDialogData {
  sessionResult: SessionResult;
  donor: DonorSearchResult | null;
}

@Component({
  selector: 'app-session-results-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './session-results-dialog.html',
  styleUrl: './session-results-dialog.scss',
  encapsulation: ViewEncapsulation.None
})
export class SessionResultsDialog implements OnInit {
  protected readonly dialogRef = inject(MatDialogRef<SessionResultsDialog>);
  protected readonly data = inject<SessionResultsDialogData>(MAT_DIALOG_DATA);
  private readonly donorRoutineLogicService = inject(DonorRoutineLogicService);

  // Signal-based state
  protected readonly sessionResults = signal<SessionResult[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly donorIdSortDirection = signal<'default' | 'asc' | 'desc'>('default');

  protected readonly sortedSessionResults = computed(() => {
    const data = [...this.sessionResults()];
    const dir = this.donorIdSortDirection();
    if (dir === 'default') {
      return data;
    }
    return data.sort((a, b) => {
      const aVal = (a.donorId ?? '').toLowerCase();
      const bVal = (b.donorId ?? '').toLowerCase();
      return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  });

  ngOnInit(): void {
    this.loadSessionResults();
  }

  private loadSessionResults(): void {
    this.loading.set(true);
    this.error.set(null);

    const sessionId = this.data.sessionResult.sessionId;

    this.donorRoutineLogicService.getSessionResultsBySessionId(sessionId).subscribe({
      next: (results) => {
        this.sessionResults.set(results);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load session results');
        this.loading.set(false);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  toggleDonorIdSort(): void {
    const current = this.donorIdSortDirection();
    if (current === 'default') {
      this.donorIdSortDirection.set('asc');
    } else if (current === 'asc') {
      this.donorIdSortDirection.set('desc');
    } else {
      this.donorIdSortDirection.set('default');
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
