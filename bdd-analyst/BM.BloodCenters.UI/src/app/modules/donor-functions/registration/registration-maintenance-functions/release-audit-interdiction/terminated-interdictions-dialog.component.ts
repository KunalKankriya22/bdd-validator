import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';
import { Interdiction } from './release-audit-interdiction.models';
import { ReleaseAuditInterdictionService } from './release-audit-interdiction.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

export interface TerminatedInterdictionsDialogData {
  transactionId: string;
}

@Component({
  selector: 'app-terminated-interdictions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    DataTable
  ],
  template: `
    <h2 mat-dialog-title>Terminated Interdictions</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else if (interdictions().length === 0) {
        <p class="empty-msg">No terminated interdictions found.</p>
      } @else {
        <app-data-table
          [config]="tableConfig"
          [data]="interdictions()"
          [loading]="loading()"
          (rowAction)="onRowAction($event)">
        </app-data-table>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()" type="button">CLOSE</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      margin: 0 0 12px 0;
      padding: 0 0 0 20px;
      font-size: 18px;
      font-weight: 600;
    }
    mat-dialog-content {
      min-height: 120px;
      max-height: 400px;
      overflow-y: auto;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 120px;
    }
    .empty-msg {
      text-align: center;
      color: rgba(0,0,0,0.6);
      padding: 24px 0;
    }
    mat-dialog-actions { padding: 8px 0 0 0; margin: 0; }
    button { min-width: 90px; }
  `]
})
export class TerminatedInterdictionsDialogComponent implements OnInit {
  readonly data = inject<TerminatedInterdictionsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TerminatedInterdictionsDialogComponent>);
  private readonly service = inject(ReleaseAuditInterdictionService);

  readonly loading = signal<boolean>(false);
  readonly interdictions = signal<Interdiction[]>([]);

  tableConfig: DataTableConfig<Interdiction> = {
    columns: [
      { key: 'interCode', header: 'Code' },
      { key: 'interType', header: 'Type' },
      { key: 'insertedUser', header: 'User ID' },
      { key: 'effectiveDate', header: 'Eff Date', valueFormatter: (v: string) => this.formatDate(v) },
      { key: 'releaseDate', header: 'Release Date', valueFormatter: (v: string) => v ? this.formatDate(v) : '' },
      { key: 'releasedUser', header: 'Release User' },
      { key: 'terminationDate', header: 'Term Date', valueFormatter: (v: string) => v ? this.formatDate(v) : '' },
      { key: 'originated', header: 'Originated' },
      { key: 'reason', header: 'Reason' },
      { key: 'groupMode', header: 'Grp Mode' },
      { key: 'groupId', header: 'Grp ID' },
      { key: 'interDescription', header: 'Description' }
    ],
    rowActions: [
      {
        action: 'release',
        label: 'RELEASE',
        icon: 'lock_open',
        color: 'primary',
        visible: (row: Interdiction) => row.canRelease
      }
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No terminated interdictions found.',
    enableRowHighlight: false
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.service.getTerminatedInterdictions(this.data.transactionId).subscribe({
      next: (items) => {
        this.interdictions.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onRowAction(event: TableRowActionEvent<Interdiction>): void {
    if (event.action === 'release') {
      this.dialogRef.close({ action: 'release', interdiction: event.row });
    }
  }

  onClose(): void {
    this.dialogRef.close(null);
  }

  formatDate(dateString: string): string {
    const m = moment(dateString, 'YYYY-MM-DD');
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }
}
