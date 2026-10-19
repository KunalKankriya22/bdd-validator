import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

export interface FixedProfileUnitInBatch {
  sequence: string | number;
  unitId: string;
  red1: string;
  red2: string;
  purple1: string;
  purple2: string;
}

/**
 * Fixed Profile Units in Batch Component (Local to Fixed Profile Tube Check-In)
 * Displays units in batch with custom column configuration
 */
@Component({
  selector: 'app-fixed-profile-units-in-batch',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    DataTable
  ],
  template: `
    <div class="units-in-batch-panel">
      <div class="panel-header">
        <h2 id="units-in-batch-dialog-title">View Units in Batch</h2>
        <button mat-icon-button (click)="onClose()" aria-label="Close panel">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="panel-content">
        <app-data-table
          [config]="tableConfig"
          [data]="units()">
        </app-data-table>
      </div>

      <div class="panel-footer">
        <button mat-stroked-button (click)="onClose()">CLOSE</button>
      </div>
    </div>
  `,
  styles: [`
    .units-in-batch-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
    }

    .panel-footer {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class FixedProfileUnitsInBatchComponent {
  @Input() set unitsData(value: FixedProfileUnitInBatch[]) {
    this.units.set(value || []);
  }

  @Output() closePanel = new EventEmitter<void>();

  units = signal<FixedProfileUnitInBatch[]>([]);

  tableConfig: DataTableConfig<FixedProfileUnitInBatch> = {
    columns: [
      {
        key: 'sequence',
        header: 'Sequence',
        sortable: false,
        width: '100px'
      },
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: false,
        width: '200px'
      },
      {
        key: 'red1',
        header: 'Red 1',
        sortable: false,
        width: '120px'
      },
      {
        key: 'red2',
        header: 'Red 2',
        sortable: false,
        width: '120px'
      },
      {
        key: 'purple1',
        header: 'Purple 1',
        sortable: false,
        width: '120px'
      },
      {
        key: 'purple2',
        header: 'Purple 2',
        sortable: false,
        width: '120px'
      }
    ],
    showPagination: false,
    noDataIcon: 'inbox',
    emptyMessage: 'No units in this batch',
    loadingMessage: 'Loading units...',
    showTableOnEmpty: true
  };

  onClose(): void {
    this.closePanel.emit();
  }
}
