import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { PathogenReductionManagerService } from '../services/pathogen-reduction-manager.service';
import { PathogenReductionQueryStatusDto } from '../models/pathogen-reduction.model';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface QueryStatusItem {
  unitId: string;
  cadProduct: string;
  setType: string;
  cadStartTime: string;
  cadTime: number;
  status: 'ready-almost-overdue' | 'ready-acceptable' | 'not-ready' | 'discard-exceeded';
  statusLabel: string;
  priority: number;
}

@Component({
  selector: 'app-query-status-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  providers: [DatePipe],
  templateUrl: './query-status-panel.component.html',
  styleUrl: './query-status-panel.component.scss'
})
export class QueryStatusPanelComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<QueryStatusPanelComponent>);
  private readonly prService = inject(PathogenReductionManagerService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly datePipe = inject(DatePipe);
  private readonly destroy$ = new Subject<void>();

  selectedItem: QueryStatusItem | null = null;
  queryItems: QueryStatusItem[] = [];
  loading = signal<boolean>(false);

  // Sort state
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  ngOnInit(): void {
    this.loadQueryStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load query status data from API
   */
  loadQueryStatus(): void {
    this.loading.set(true);

    this.prService
      .getQueryStatus()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (data: PathogenReductionQueryStatusDto[]) => {
          this.queryItems = this.mapToQueryStatusItems(data);
          // Default sort by priority (ascending)
          this.sortItems('priority', 'asc');
        },
        error: (error) => {
          this.snackbarService.showError(
            'Failed to load query status data. Please try again.'
          );
          this.queryItems = [];
        }
      });
  }

  /**
   * Map API DTO to UI model
   */
  private mapToQueryStatusItems(
    data: PathogenReductionQueryStatusDto[]
  ): QueryStatusItem[] {
    return data.map((item) => ({
      unitId: item.unitId,
      cadProduct: item.cadProductCode,
      setType: item.volumeTypeSet,
      cadStartTime: this.formatDateTime(item.cadStartTime),
      cadTime: Math.round(item.cadTimeElapsed), // Round to nearest hour
      status: this.getStatusFromPriority(item.priority),
      statusLabel: item.statusDescription,
      priority: item.priority
    }));
  }

  /**
   * Format ISO datetime to display format (DD-MMM-YYYY HH:mm)
   */
  private formatDateTime(isoDate: string): string {
    try {
      const date = new Date(isoDate);
      return this.datePipe.transform(date, 'dd-MMM-yyyy HH:mm') || isoDate;
    } catch {
      return isoDate;
    }
  }

  /**
   * Map priority to status enum
   */
  private getStatusFromPriority(
    priority: number
  ): 'ready-almost-overdue' | 'ready-acceptable' | 'not-ready' | 'discard-exceeded' {
    switch (priority) {
      case 1:
        return 'ready-almost-overdue';
      case 2:
        return 'ready-acceptable';
      case 3:
        return 'not-ready';
      case 4:
        return 'discard-exceeded';
      default:
        return 'not-ready';
    }
  }

  /**
   * Toggle sort direction for a column
   */
  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = null;
        this.sortColumn = null;
        // Reset to default sort (priority asc)
        this.sortItems('priority', 'asc');
        return;
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.sortColumn && this.sortDirection) {
      this.sortItems(this.sortColumn, this.sortDirection);
    }
  }

  /**
   * Sort items by column and direction
   */
  private sortItems(column: string, direction: 'asc' | 'desc'): void {
    this.queryItems.sort((a, b) => {
      const aVal = (a as any)[column];
      const bVal = (b as any)[column];

      if (aVal === bVal) return 0;

      const comparison = aVal < bVal ? -1 : 1;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Get sort icon for column header
   */
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'unfold_more'; // Default icon
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  onClose(): void {
    this.dialogRef.close(null);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSelect(): void {
    if (this.selectedItem) {
      this.dialogRef.close(this.selectedItem);
    }
  }
}
