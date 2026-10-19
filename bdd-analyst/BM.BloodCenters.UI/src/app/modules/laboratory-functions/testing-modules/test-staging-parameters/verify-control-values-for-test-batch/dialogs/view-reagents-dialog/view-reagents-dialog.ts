import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { TestBatchReagent } from '../../verify-control-values-for-test-batch.model';
import { VerifyControlValuesForTestBatchService } from '../../verify-control-values-for-test-batch.service';

export interface ViewReagentsDialogData {
  tbId: string;
  testId: string;
  testKitId: string;
  kitId?: string; // Kit ID for dialog title
}

/**
 * View Reagents in Kit Dialog
 * Displays all reagents for the selected test kit using shared DataTable
 */
@Component({
  selector: 'app-view-reagents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './view-reagents-dialog.html',
  styleUrls: ['./view-reagents-dialog.scss'],
})
export class ViewReagentsDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<ViewReagentsDialogComponent>);
  private readonly service = inject(VerifyControlValuesForTestBatchService);

  protected readonly reagents = signal<TestBatchReagent[]>([]);
  protected readonly kitId = signal<string>('');
  protected readonly loading = signal<boolean>(false);

  private tbId = '';
  private testId = '';
  private testKitId = '';

  protected readonly tableConfig: DataTableConfig<TestBatchReagent> = {
    columns: [
      { key: 'reagentName', header: 'Reagent Name', sortable: true },
      { key: 'manufacturer', header: 'Manufacturer', sortable: false },
      {
        key: 'channel',
        header: 'Channel',
        sortable: false,
        valueFormatter: (value) => (value !== null && value !== undefined && value !== 0) ? value.toString() : '-'
      },
      {
        key: 'expiryDate',
        header: 'Expiration Date',
        sortable: false,
        width: '200px',
        valueFormatter: (value) => this.formatExpiryDate(value)
      },
      { key: 'lotNumber', header: 'Lot Number', sortable: false },
    ],
    pagination: undefined,
    enableSelection: false,
    enableRowHighlight: false,
    stickyHeader: true,
    sortConfig: {
      column: '',
      direction: 'default'
    }
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: ViewReagentsDialogData) {
    this.tbId = data.tbId;
    this.testId = data.testId;
    this.testKitId = data.testKitId;
    this.kitId.set(data.kitId || '');

    // Load initial data
    this.loadReagents();
  }

  private async loadReagents(sortColumn?: string, sortDirection?: string): Promise<void> {
    try {
      this.loading.set(true);
      const reagents = await this.service.getReagents(
        this.tbId,
        this.testId,
        this.testKitId,
        sortColumn,
        sortDirection
      );
      this.reagents.set(reagents);
    } catch (error) {
      console.error('Error loading reagents:', error);
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

    this.loadReagents(sortColumn, sortDirection);
  }

  close(): void {
    this.dialogRef.close();
  }

  private formatExpiryDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    const mon = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${mon}-${year} ${hours}:${minutes}`;
  }
}
