import { Component, Inject, inject, signal, TemplateRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { TestBatchHoldingTest } from '../../verify-control-values-for-test-batch.model';
import { VerifyControlValuesForTestBatchService } from '../../verify-control-values-for-test-batch.service';

export interface ViewUnitsDialogData {
  tbId: string;
  testId: string;
  batchId?: string; // Batch ID for dialog title
}

/**
 * View Units in Batch Dialog
 * Displays all units (holding tests) for the selected test batch using shared DataTable
 */
@Component({
  selector: 'app-view-units-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DataTable,
  ],
  templateUrl: './view-units-dialog.html',
  styleUrls: ['./view-units-dialog.scss'],
})
export class ViewUnitsDialogComponent implements OnInit {
  protected readonly dialogRef = inject(MatDialogRef<ViewUnitsDialogComponent>);
  private readonly service = inject(VerifyControlValuesForTestBatchService);

  protected readonly units = signal<TestBatchHoldingTest[]>([]);
  protected readonly totalCount = signal<number>(0);
  protected readonly batchId = signal<string>('');
  protected readonly loading = signal<boolean>(false);

  private tbId = '';
  private testId = '';

  @ViewChild('sequenceTemplate', { static: true }) sequenceTemplate!: TemplateRef<any>;
  @ViewChild('unitIdTemplate', { static: true }) unitIdTemplate!: TemplateRef<any>;
  @ViewChild('resultTemplate', { static: true }) resultTemplate!: TemplateRef<any>;

  protected tableConfig!: DataTableConfig<TestBatchHoldingTest>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ViewUnitsDialogData) {
    this.tbId = data.tbId;
    this.testId = data.testId;
    this.batchId.set(data.batchId || '');
  }

  ngOnInit(): void {
    // Initialize table config with templates (static: true means they're available here)
    this.tableConfig = {
      columns: [
        { key: 'sequence', header: 'Sequence', sortable: true, type: 'custom', cellTemplate: this.sequenceTemplate },
        { key: 'unitId', header: 'Unit ID', sortable: false, type: 'custom', cellTemplate: this.unitIdTemplate, width: '280px' },
        { key: 'testId', header: 'Test', sortable: false },
        { key: 'result', header: 'Result', sortable: false, type: 'custom', cellTemplate: this.resultTemplate },
        { key: 'absorbance', header: 'Absorbance', sortable: false, valueFormatter: (value) => value || '-' },
        { key: 'ratio', header: 'Ratio', sortable: false, valueFormatter: (value) => value || '-' },
      ],
      pagination: undefined, // No pagination - show all units
      enableSelection: false,
      enableRowHighlight: false,
      stickyHeader: true,
      sortConfig: {
        column: '',
        direction: 'default'
      }
    };

    // Load initial data
    this.loadUnits();
  }

  private async loadUnits(sortColumn?: string, sortDirection?: string): Promise<void> {
    try {
      this.loading.set(true);
      const result = await this.service.getHoldingTests(
        this.tbId,
        this.testId,
        100,
        0,
        sortColumn,
        sortDirection
      );
      this.units.set(result.data);
      this.totalCount.set(result.totalCount);
    } catch (error) {
      console.error('Error loading units:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSortChange(event: TableSortEvent): void {
    // Update table config sortConfig
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Map sort direction to API format (A -> ASC, D -> DESC, default -> no sort)
    let sortColumn: string | undefined;
    let sortDirection: string | undefined;

    if (event.direction === 'A' || event.direction === 'D') {
      sortColumn = event.column;
      sortDirection = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    this.loadUnits(sortColumn, sortDirection);
  }

  close(): void {
    this.dialogRef.close();
  }

  /**
   * Get result value from row data
   * Backend returns 'resultStatus1', frontend may have 'result'
   */
  protected getResultValue(row: TestBatchHoldingTest): string | undefined {
    return row.result || row.resultStatus1 || row.resultStatus;
  }

  /**
   * Get full unit ID with check digit for tooltip
   */
  protected getFullUnitId(row: TestBatchHoldingTest): string {
    const checkDigit = row.chkDigit || row.checkDigit;
    return checkDigit ? `${row.unitId}-${checkDigit}` : row.unitId;
  }

  /**
   * Format result value for display
   * Converts abbreviated codes to full descriptions
   */
  protected formatResult(result: string | undefined): string {
    if (!result) return '-';

    // Map abbreviated codes to full descriptions
    const resultMap: Record<string, string> = {
      'NR': 'Negative/Non-Reactive',
      'R': 'Reactive',
      'P': 'Positive',
      'N': 'Negative'
    };

    return resultMap[result.toUpperCase()] || result;
  }

  /**
   * Get row index for sequence display
   */
  protected getRowIndex(row: TestBatchHoldingTest): number {
    const index = this.units().indexOf(row);
    return index >= 0 ? index + 1 : 0;
  }
}
