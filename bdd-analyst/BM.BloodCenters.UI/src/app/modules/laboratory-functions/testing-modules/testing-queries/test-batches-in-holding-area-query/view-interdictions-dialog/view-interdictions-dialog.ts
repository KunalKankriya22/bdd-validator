import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import moment from 'moment';

import { ViewInterdictionModel } from '../test-batches-in-holding-area-query.model';

@Component({
  selector: 'app-view-interdictions-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <div class="panel-container" role="dialog" aria-modal="true" aria-labelledby="view-interdictions-title">
      <div class="panel-header">
        <h2 id="view-interdictions-title">View Interdictions</h2>
        <button mat-icon-button (click)="onClose()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="panel-body">
        @if (interdictions.length === 0) {
          <div class="empty-message">No interdictions found for this test batch</div>
        } @else {
          <table mat-table [dataSource]="interdictions" class="interdictions-table">
            <ng-container matColumnDef="unitId">
              <th mat-header-cell *matHeaderCellDef>Unit ID</th>
              <td mat-cell *matCellDef="let row">{{ row.unitId }}</td>
            </ng-container>

            <ng-container matColumnDef="collDate">
              <th mat-header-cell *matHeaderCellDef>Collection Date</th>
              <td mat-cell *matCellDef="let row">{{ formatDate(row.collDate) }}</td>
            </ng-container>

            <ng-container matColumnDef="interCode">
              <th mat-header-cell *matHeaderCellDef>Inter Code</th>
              <td mat-cell *matCellDef="let row">{{ row.interCode }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        }
      </div>

      <div class="panel-footer">
        <button mat-stroked-button class="close-btn" (click)="onClose()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .panel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #ffffff;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-family: Roboto, sans-serif;
        font-weight: 500;
        font-size: 18px;
        color: #1a1a1a;
      }

      button {
        color: #666;
      }
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .empty-message {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      font-family: Roboto, sans-serif;
      font-size: 14px;
      color: #8D9BA3;
    }

    .interdictions-table {
      width: 100%;

      ::ng-deep th.mat-mdc-header-cell {
        font-family: Roboto, sans-serif;
        font-weight: 500;
        font-size: 14px;
        color: #3D5463;
        background: #F5F5F5;
        border-bottom: 1px solid #e0e0e0;
        padding: 12px 16px;
      }

      ::ng-deep td.mat-mdc-cell {
        font-family: Roboto, sans-serif;
        font-size: 14px;
        color: #1D1B20;
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
      }
    }

    .panel-footer {
      display: flex;
      justify-content: flex-end;
      padding: 12px 24px;
      border-top: 1px solid #e0e0e0;
      flex-shrink: 0;

      .close-btn {
        color: #228189;
        border-color: #228189;
      }
    }
  `],
})
export class ViewInterdictionsPanel {
  @Input() interdictions: ViewInterdictionModel[] = [];
  @Output() closePanel = new EventEmitter<void>();

  displayedColumns = ['unitId', 'collDate', 'interCode'];

  formatDate(date: string | null): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
