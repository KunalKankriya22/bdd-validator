import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { ReagentQueryService } from '../services/reagent-query.service';
import { PreparationDetailDto } from '../models/reagent-query.model';

export interface PreparationDetailsDialogData {
  reagentId: string;
}

@Component({
  selector: 'app-preparation-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './preparation-details-dialog.html',
  styleUrl: './preparation-details-dialog.scss'
})
export class PreparationDetailsDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `prep-details-dialog-${PreparationDetailsDialogComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly dialogRef = inject(MatDialogRef<PreparationDetailsDialogComponent>);
  private readonly data = inject<PreparationDetailsDialogData>(MAT_DIALOG_DATA);
  private readonly reagentQueryService = inject(ReagentQueryService);

  protected readonly details = signal<PreparationDetailDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly isEmpty = computed(() => this.details().length === 0 && !this.loading());
  protected readonly reagentId = computed(() => this.data.reagentId);

  protected tableConfig: DataTableConfig<PreparationDetailDto> = {
    columns: [
      {
        key: 'reagentId',
        header: 'Reagent ID',
        sortable: false,
        type: 'text',
        minWidth: '110px',
        valueFormatter: (v: string | null) => v || '–'
      },
      {
        key: 'reagentName',
        header: 'Reagent Name',
        sortable: false,
        type: 'text',
        minWidth: '150px',
        valueFormatter: (v: string | null) => v || '–'
      },
      {
        key: 'reagentType',
        header: 'Type',
        sortable: false,
        type: 'text',
        minWidth: '90px',
        valueFormatter: (v: string | null) => v || '–'
      },
      {
        key: 'expiryDate',
        header: 'Expiry Date',
        sortable: false,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (v: string | null) => v ? this.formatDateTime(v) : '–'
      },
      {
        key: 'lotNumber',
        header: 'Lot Number',
        sortable: false,
        type: 'text',
        minWidth: '120px',
        valueFormatter: (v: string | null) => v || '–'
      },
      {
        key: 'quantity',
        header: 'Quantity',
        sortable: false,
        type: 'text',
        minWidth: '80px',
        valueFormatter: (v: string | null) => v || '–'
      }
    ],
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: false,
    emptyMessage: 'No preparation details found for this reagent.',
    noDataIcon: 'info'
  };

  ngOnInit(): void {
    this.loadDetails();
  }

  private loadDetails(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reagentQueryService.getPreparationDetails(this.data.reagentId).subscribe({
      next: (details) => {
        this.details.set(details);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load preparation details. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private formatDateTime(value: string): string {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hh}:${mm}`;
    } catch {
      return value;
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
