import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SponsorInstruction } from '../models/drives-by-sponsor-query.model';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

export interface SponsorInstructionsDialogData {
  sponsorId: string;
  instructions: SponsorInstruction[];
}

@Component({
  selector: 'app-sponsor-instructions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DataTable
  ],
  templateUrl: './sponsor-instructions-dialog.component.html',
  styleUrl: './sponsor-instructions-dialog.component.scss'
})
export class SponsorInstructionsDialog {
  dialogRef = inject(MatDialogRef<SponsorInstructionsDialog>);
  data: SponsorInstructionsDialogData = inject(MAT_DIALOG_DATA);

  instructions = signal<SponsorInstruction[]>(this.data.instructions || []);

  // Data Table Configuration
  tableConfig: DataTableConfig<SponsorInstruction> = {
    columns: [
      {
        key: 'instruction',
        header: 'Specific Instruction',
        sortable: false,
        width: '40%'
      },
      {
        key: 'values',
        header: 'Values',
        sortable: false,
        width: '20%',
        valueFormatter: (value) => value || ''
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '20%',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '20%',
        valueFormatter: (value) => this.formatDate(value)
      }
    ],
    rowActions: [],
    pagination: undefined,
    sortConfig: undefined,
    stickyHeader: false,
    emptyMessage: 'No instructions found',
    emptySubMessage: '',
    loadingMessage: '',
    showPagination: false,
    showActionsAsMenu: false
  };

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString || '';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
