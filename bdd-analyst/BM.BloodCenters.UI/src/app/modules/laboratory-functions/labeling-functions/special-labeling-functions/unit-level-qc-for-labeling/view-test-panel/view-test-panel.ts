import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

export interface ViewTestRow {
  testId: string;
  ts: number | string;
  result: number | string;
  tbId: string;
  absorbance: string;
  ratio: string;
}

@Component({
  selector: 'app-view-test-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    DataTable,
  ],
  templateUrl: './view-test-panel.html',
  styleUrls: ['./view-test-panel.scss'],
})
export class ViewTestPanel {
  readonly unitId = input<string>('');
  readonly scheduledTests = input<ViewTestRow[]>([]);
  readonly unscheduledTests = input<ViewTestRow[]>([]);
  readonly closePanel = output<void>();

  scheduledTableConfig: DataTableConfig<ViewTestRow> = {
    columns: [
      { key: 'testId', header: 'Test ID', sortable: false, type: 'text', minWidth: '120px' },
      { key: 'ts', header: 'TS', sortable: false, type: 'text', minWidth: '60px' },
      { key: 'result', header: 'Result', sortable: false, type: 'text', minWidth: '80px' },
      { key: 'tbId', header: 'TB ID', sortable: false, type: 'text', minWidth: '140px' },
      { key: 'absorbance', header: 'Absorbance', sortable: false, type: 'text', minWidth: '120px' },
      { key: 'ratio', header: 'Ratio', sortable: false, type: 'text', minWidth: '80px' },
    ],
    stickyHeader: true,
    enableRowHighlight: false,
    showPagination: false,
  };

  unscheduledTableConfig: DataTableConfig<ViewTestRow> = {
    columns: [
      { key: 'testId', header: 'Test ID', sortable: false, type: 'text', minWidth: '120px' },
      { key: 'ts', header: 'TS', sortable: false, type: 'text', minWidth: '60px' },
      { key: 'result', header: 'Result', sortable: false, type: 'text', minWidth: '80px' },
      { key: 'tbId', header: 'TB ID', sortable: false, type: 'text', minWidth: '140px' },
      { key: 'absorbance', header: 'Absorbance', sortable: false, type: 'text', minWidth: '120px' },
      { key: 'ratio', header: 'Ratio', sortable: false, type: 'text', minWidth: '80px' },
    ],
    stickyHeader: true,
    enableRowHighlight: false,
    showPagination: false,
  };

  onClose(): void {
    this.closePanel.emit();
  }
}
