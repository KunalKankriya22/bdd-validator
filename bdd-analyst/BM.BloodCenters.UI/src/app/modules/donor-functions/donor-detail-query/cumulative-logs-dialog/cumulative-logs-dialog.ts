import { Component, inject, OnInit, OnDestroy, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import { CellLoss, InterdictionHold } from '../models/donor-detail-query.model';

export interface CumulativeLogsDialogData {
  donorId: string;
}

@Component({
  selector: 'app-cumulative-logs-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable,
  ],
  template: `
    <div class="side-panel-container">
      <div class="side-panel-header">
        <h2 class="side-panel-title" mat-dialog-title>Cumulative Logs</h2>
        <button type="button" mat-icon-button class="side-panel-close" aria-label="Close panel" (click)="onClose()">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <div class="side-panel-content">
        @if (loading()) {
          <div class="loading-container" role="status" aria-live="polite">
            <mat-spinner diameter="50" [attr.aria-label]="'Loading data'"></mat-spinner>
            <p class="loading-text">Loading data...</p>
          </div>
        } @else if (error()) {
          <div class="error-container" role="alert">
            <mat-icon color="warn" aria-hidden="true">error</mat-icon>
            <p class="error-text">{{ error() }}</p>
            <button mat-raised-button color="primary" type="button" (click)="loadData()">RETRY</button>
          </div>
        } @else {
          <!-- Cell Loss Section -->
          <section class="data-section">
            <h3 class="section-title">RBC / Plasma Loss</h3>
            @if (hasCellLoss()) {
              <app-data-table
                [data]="cellLoss()"
                [config]="cellLossTableConfig"
                aria-label="RBC Plasma loss table"
              />
            } @else {
              <p class="empty-section">No cell loss data available</p>
            }
          </section>

          <!-- Interdiction Holds Section -->
          <section class="data-section">
            <div class="section-header">
              <h3 class="section-title">Interdiction Holds</h3>
              <mat-button-toggle-group
                [value]="holdsFilter()"
                (change)="onHoldsFilterChange($event.value)"
                aria-label="Filter interdiction holds"
              >
                <mat-button-toggle value="active">Active Only</mat-button-toggle>
                <mat-button-toggle value="all">All</mat-button-toggle>
              </mat-button-toggle-group>
            </div>
            @if (holdsLoading()) {
              <div class="loading-container compact" role="status" aria-live="polite">
                <mat-spinner diameter="30" aria-hidden="true"></mat-spinner>
                <span class="cdk-visually-hidden">Loading interdiction holds...</span>
              </div>
            } @else if (hasHolds()) {
              <app-data-table
                [data]="holds()"
                [config]="holdsTableConfig"
                aria-label="Interdiction holds table"
              />
            } @else {
              <p class="empty-section">No interdiction holds found</p>
            }
          </section>
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
    .data-section { margin-bottom: 32px;
      .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .section-title { margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: rgba(0,0,0,0.87); }
      .section-header .section-title { margin-bottom: 0; }
    }
    .empty-section { color: rgba(0,0,0,0.6); font-style: italic; padding: 16px 0; }
    .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 40px; text-align: center;
      &.compact { padding: 24px; }
      .loading-text { margin-top: 16px; font-size: 16px; color: rgba(0,0,0,0.6); }
    }
    .error-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 40px; text-align: center;
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
      .error-text { margin: 8px 0 24px 0; font-size: 16px; color: rgba(0,0,0,0.87); }
    }
  `],
})
export class CumulativeLogsDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<CumulativeLogsDialog>);
  private readonly donorService = inject(DonorDetailQueryService);
  private readonly destroy$ = new Subject<void>();

  readonly cellLoss = signal<CellLoss[]>([]);
  readonly holds = signal<InterdictionHold[]>([]);
  readonly loading = signal(false);
  readonly holdsLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly holdsFilter = signal<'active' | 'all'>('active');
  readonly hasCellLoss = computed(() => this.cellLoss().length > 0);
  readonly hasHolds = computed(() => this.holds().length > 0);

  cellLossTableConfig: DataTableConfig<CellLoss> = {
    columns: [
      { key: 'cellType', header: 'Cell Type', width: '120px', sortable: false },
      { key: 'daysBetween', header: 'Days Between', width: '120px', sortable: false },
      { key: 'cumulativeLoss', header: 'Cumulative Loss', sortable: false },
    ],
    stickyHeader: true,
    showTableOnEmpty: false,
    emptyMessage: 'No cell loss data',
  };

  holdsTableConfig: DataTableConfig<InterdictionHold> = {
    columns: [
      { key: 'interType', header: 'Type', width: '80px', sortable: false },
      { key: 'interCode', header: 'Code', width: '80px', sortable: false },
      { key: 'description', header: 'Description', sortable: false },
      { key: 'originatedFrom', header: 'Source', width: '100px', sortable: false },
      { key: 'effDate', header: 'Eff Date', width: '110px', sortable: false,
        valueFormatter: (v: string) => this.donorService.formatDate(v) },
      { key: 'termDate', header: 'Term Date', width: '110px', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '-' },
    ],
    stickyHeader: true,
    showTableOnEmpty: false,
    emptyMessage: 'No interdiction holds found',
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: CumulativeLogsDialogData) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      cellLoss: this.donorService.getCellLoss(this.data.donorId),
      holds: this.donorService.getInterdictionHolds(this.data.donorId, this.holdsFilter()),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.cellLoss.set(result.cellLoss);
          this.holds.set(result.holds);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load data. Please try again.');
          this.loading.set(false);
        },
      });
  }

  onHoldsFilterChange(filter: 'active' | 'all'): void {
    this.holdsFilter.set(filter);
    this.holdsLoading.set(true);

    this.donorService.getInterdictionHolds(this.data.donorId, filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.holds.set(data);
          this.holdsLoading.set(false);
        },
        error: () => {
          this.holdsLoading.set(false);
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
