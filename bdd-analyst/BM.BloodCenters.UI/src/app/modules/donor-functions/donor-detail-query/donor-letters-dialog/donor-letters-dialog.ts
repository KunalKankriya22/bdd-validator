import { Component, inject, OnInit, OnDestroy, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import { DonorLetter } from '../models/donor-detail-query.model';

export interface DonorLettersDialogData {
  donorId: string;
  donorName?: string;
}

@Component({
  selector: 'app-donor-letters-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable,
  ],
  template: `
    <div class="side-panel-container">
      <div class="side-panel-header">
        <h2 class="side-panel-title" mat-dialog-title>Donor Letters</h2>
        <button type="button" mat-icon-button class="side-panel-close"
                aria-label="Close panel" (click)="onClose()">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>
      <div class="side-panel-content">
        @if (loading()) {
          <div class="state-container" role="status" aria-live="polite">
            <mat-spinner diameter="40" [attr.aria-label]="'Loading letters'"></mat-spinner>
            <p class="state-text">Loading letters...</p>
          </div>
        } @else if (error()) {
          <div class="state-container" role="alert">
            <mat-icon color="warn" aria-hidden="true">error</mat-icon>
            <p class="state-text">{{ error() }}</p>
            <button mat-raised-button color="primary" type="button" (click)="loadLetters()">RETRY</button>
          </div>
        } @else if (hasLetters()) {
          <app-data-table [data]="letters()" [config]="tableConfig"
                          aria-label="Donor letters table" />
        } @else {
          <div class="state-container">
            <mat-icon class="empty-icon" aria-hidden="true">description</mat-icon>
            <p class="state-text">No letters found for this donor.</p>
          </div>
        }
      </div>
      <div class="side-panel-footer">
        <button mat-flat-button class="close-btn" type="button" (click)="onClose()">CLOSE</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .side-panel-container { display: flex; flex-direction: column; height: 100%; background: white; }
    .side-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 24px; border-bottom: 1px solid rgba(0,0,0,0.12);
      .side-panel-title { margin: 0; font-size: 20px; font-weight: 500; }
    }
    .side-panel-close mat-icon { color: rgba(0,0,0,0.54); }
    .side-panel-close:hover mat-icon { color: rgba(0,0,0,0.87); }
    .side-panel-content { flex: 1; overflow-y: auto; padding: 24px; }
    .side-panel-footer {
      display: flex; justify-content: flex-end; align-items: center;
      padding: 14px 24px; border-top: 1px solid rgba(0,0,0,0.12);
      background: #ffffff; flex-shrink: 0;
    }
    .close-btn {
      background-color: #228189 !important; color: #fff !important;
      font-size: 13px; font-weight: 600; letter-spacing: 0.4px;
      border-radius: 4px; min-width: 72px; height: 36px;
    }
    .state-container {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 60px 40px; text-align: center;
      mat-icon {
        font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px;
        &.empty-icon { color: #bdbdbd; }
      }
      .state-text { margin: 8px 0 16px; font-size: 14px; color: rgba(0,0,0,0.54); }
    }
  `],
})
export class DonorLettersDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<DonorLettersDialog>);
  private readonly donorService = inject(DonorDetailQueryService);
  private readonly destroy$ = new Subject<void>();

  readonly letters = signal<DonorLetter[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasLetters = computed(() => this.letters().length > 0);

  tableConfig: DataTableConfig<DonorLetter> = {
    columns: [
      { key: 'letterCode', header: 'Letter Code', width: '110px', sortable: false },
      { key: 'letterTitle', header: 'Letter Title', sortable: false },
      { key: 'documentType', header: 'Document Type', width: '120px', sortable: false },
      {
        key: 'generateDate', header: 'Generate Date', width: '120px', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '-',
      },
      { key: 'authorizedBy', header: 'Authorized By', width: '120px', sortable: false },
    ],
    stickyHeader: true,
    showTableOnEmpty: false,
    emptyMessage: 'No letters found',
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: DonorLettersDialogData) {}

  ngOnInit(): void {
    this.loadLetters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLetters(): void {
    if (!this.data?.donorId) {
      this.error.set('Donor ID is required');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.donorService.getDonorLetters(this.data.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.letters.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load letters. Please try again.');
          this.loading.set(false);
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
