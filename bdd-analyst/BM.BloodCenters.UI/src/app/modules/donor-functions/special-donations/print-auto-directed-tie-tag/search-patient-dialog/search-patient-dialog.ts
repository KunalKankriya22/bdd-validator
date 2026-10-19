import { Component, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';

import { DataTable } from '@shared/components/data-table/data-table';
import type { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import type { PatientSearchResultDto } from '../models/print-auto-directed-tie-tag.models';

export interface SearchPatientDialogData {
  patients: PatientSearchResultDto[];
}

interface PatientRow extends PatientSearchResultDto {
  rowId: string;
}

@Component({
  selector: 'app-search-patient-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './search-patient-dialog.html',
  styleUrls: ['./search-patient-dialog.scss'],
})
export class SearchPatientDialogComponent {
  @ViewChild(DataTable) dataTable?: DataTable<PatientRow>;

  patients: PatientRow[];
  selectedPatient: PatientRow | null = null;

  dataTableConfig: DataTableConfig<PatientRow> = {
    columns: [
      { key: 'patientId', header: 'Patient ID', sortable: true },
      { key: 'lastName', header: 'Last Name' },
      { key: 'firstName', header: 'First Name' },
      {
        key: 'dateOfBirth',
        header: 'Date of Birth',
        valueFormatter: (value: string) => this.formatDate(value),
      },
      { key: 'surgeryId', header: 'Surgery ID' },
      {
        key: 'surgeryDate',
        header: 'Surgery Date',
        valueFormatter: (value: string) => this.formatDate(value),
      },
    ],
    stickyHeader: true,
    enableSelection: true,
    selectionPosition: 'first',
    selectionKey: 'rowId' as keyof PatientRow,
    showPagination: false,
    enableRowHighlight: false,
    emptyMessage: 'No patient records found',
  };

  constructor(
    private dialogRef: MatDialogRef<SearchPatientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SearchPatientDialogData,
  ) {
    this.patients = data.patients.map((p, i) => ({
      ...p,
      rowId: `${p.patientId}_${p.surgeryId || ''}_${i}`,
    }));
  }

  get isSelectDisabled(): boolean {
    return !this.selectedPatient;
  }

  onSelectionChange(selected: PatientRow[]): void {
    if (selected.length === 0) {
      this.selectedPatient = null;
      return;
    }
    const latest = selected[selected.length - 1];
    this.selectedPatient = latest;

    if (this.dataTable) {
      this.dataTable.selectedIds.clear();
      this.dataTable.selectedIds.add(latest.rowId);
      this.dataTable.selectedRows = [latest];
      this.dataTable.isAllSelected = false;
      this.dataTable.isAllPagesSelected = false;
    }
  }

  onSortChange(event: TableSortEvent): void {
    const currentSort = this.dataTableConfig.sortConfig;
    let direction: 'A' | 'D' | 'default';

    if (!currentSort || currentSort.column !== event.column || currentSort.direction === 'default') {
      direction = 'A';
    } else if (currentSort.direction === 'A') {
      direction = 'D';
    } else {
      direction = 'default';
    }

    this.dataTableConfig = {
      ...this.dataTableConfig,
      sortConfig: { column: event.column, direction },
    };

    if (direction === 'default') {
      this.patients = this.data.patients.map((p, i) => ({
        ...p,
        rowId: `${p.patientId}_${p.surgeryId || ''}_${i}`,
      }));
      return;
    }

    this.patients = [...this.patients].sort((a, b) => {
      const valA = ((a as any)[event.column] || '').toString().toLowerCase();
      const valB = ((b as any)[event.column] || '').toString().toLowerCase();
      const cmp = valA.localeCompare(valB);
      return direction === 'A' ? cmp : -cmp;
    });
  }

  onSelect(): void {
    this.dialogRef.close(this.selectedPatient);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '--';
  }
}
