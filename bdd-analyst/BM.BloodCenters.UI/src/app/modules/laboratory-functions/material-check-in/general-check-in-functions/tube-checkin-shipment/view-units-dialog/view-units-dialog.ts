import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SamplePackTubeDto } from '../models/tube-checkin-shipment.model';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
} from '@shared/interfaces/data-table.interface';

export interface ViewUnitsDialogData {
  boxId: string;
  tubes: SamplePackTubeDto[];
  unitCount: number;
  tubeCount: number;
}

export interface ModalTableRow {
  redTop: string;
  purpleTop1: string;
  purpleTop2: string;
}

@Component({
  selector: 'app-view-units-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './view-units-dialog.html',
  styleUrls: ['./view-units-dialog.scss'],
})
export class ViewUnitsDialogComponent {
  tableConfig: DataTableConfig<ModalTableRow>;
  tableData: ModalTableRow[] = [];

  constructor(
    public dialogRef: MatDialogRef<ViewUnitsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewUnitsDialogData
  ) {
    this.tableConfig = this.getTableConfig();
    this.tableData = this.buildTableData();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Calculate check digit for a unit ID using ISBT MOD-37 algorithm
   * This matches the algorithm used in the main table for consistency
   */
  private calculateCheckDigit(unitId: string): string {
    if (!unitId || unitId.length === 0) return '';

    const MOD37_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';

    let si = 0;
    for (const c of unitId) {
      let a: number;
      if (c >= '0' && c <= '9') {
        a = c.charCodeAt(0) - 48;
      } else if (c === '*') {
        a = 36;
      } else {
        a = c.toUpperCase().charCodeAt(0) - 55;
      }
      si = ((si + a) * 2) % 37;
    }
    const checkValue = (38 - si) % 37;
    return MOD37_ALPHABET[checkValue];
  }

  /**
   * Format unit ID with check digit (e.g., "9132008" -> "9132008-4")
   */
  private formatUnitIdWithCheckDigit(unitId: string): string {
    if (!unitId) return '';
    const checkDigit = this.calculateCheckDigit(unitId);
    return checkDigit ? `${unitId}-${checkDigit}` : unitId;
  }

  /**
   * Build table configuration for data-table component
   */
  private getTableConfig(): DataTableConfig<ModalTableRow> {
    const columns: TableColumn<ModalTableRow>[] = [
      {
        key: 'redTop',
        header: 'Red Top',
        sortable: false,
        width: '33.33%',
      },
      {
        key: 'purpleTop1',
        header: 'Purple Top 1',
        sortable: false,
        width: '33.33%',
      },
      {
        key: 'purpleTop2',
        header: 'Purple Top 2',
        sortable: false,
        width: '33.33%',
      },
    ];

    return {
      columns,
      showPagination: false,
      emptyMessage: 'No units in this box',
      noDataIcon: 'inbox',
      stickyHeader: false,
    };
  }

  /**
   * Build table data from tube data
   * Each row represents ONE unique unit ID with its tube types indicated in respective columns
   * This matches the main table's one-row-per-unit layout
   */
  private buildTableData(): ModalTableRow[] {
    // Each tube entry represents one unique unit ID with flags for which tube types exist
    // Build one row per unit, showing the unit ID in columns based on which flags are 'Y'
    return this.data.tubes.map(tube => {
      const formattedId = this.formatUnitIdWithCheckDigit(tube.unitId);
      return {
        redTop: tube.redTubeFlag === 'Y' ? formattedId : '-',
        purpleTop1: tube.purpleTubeFlag === 'Y' ? formattedId : '-',
        purpleTop2: tube.purpleTube2Flag === 'Y' ? formattedId : '-',
      };
    });
  }
}
