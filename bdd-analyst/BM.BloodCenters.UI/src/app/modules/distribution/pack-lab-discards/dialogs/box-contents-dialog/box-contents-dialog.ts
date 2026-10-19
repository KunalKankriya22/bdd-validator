import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { PackLabDiscardsService } from '../../services/pack-lab-discards.service';
import { BoxContent } from '../../models/pack-lab-discards.model';
import moment from 'moment';

export interface BoxContentsDialogData {
  boxId: string;
}

@Component({
  selector: 'app-box-contents-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, DataTable],
  templateUrl: './box-contents-dialog.html',
  styleUrl: './box-contents-dialog.scss'
})
export class BoxContentsDialogComponent implements OnInit {
  readonly data = inject<BoxContentsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<BoxContentsDialogComponent>);
  private readonly service = inject(PackLabDiscardsService);

  protected readonly loading = signal(true);
  protected readonly contents = signal<BoxContent[]>([]);
  private readonly currentSort = signal<TableSortEvent | null>(null);

  protected readonly sortedContents = computed(() => {
    const items = this.contents();
    const sort = this.currentSort();
    if (!sort || sort.direction === 'default') return items;
    return [...items].sort((a, b) => {
      const aVal = String(a.unitId ?? '');
      const bVal = String(b.unitId ?? '');
      return sort.direction === 'A' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  });

  readonly tableConfig = computed<DataTableConfig<BoxContent>>(() => ({
    caption: 'Box Contents',
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true },
      {
        key: 'collDate',
        header: 'Collection date',
        valueFormatter: (value: string | null) =>
          value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : '-',
      },
      { key: 'productType', header: 'Product Type' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'bloodType', header: 'System Label Decision' },
    ],
    sortConfig: this.currentSort()
      ? { column: this.currentSort()!.column, direction: this.currentSort()!.direction }
      : undefined,
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No products in this box.',
  }));

  ngOnInit(): void {
    this.service.getBoxContents(this.data.boxId).subscribe({
      next: (contents) => { this.contents.set(contents); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  protected onSortChange(event: TableSortEvent): void {
    this.currentSort.set(event);
  }

  protected onClose(): void {
    this.dialogRef.close();
  }
}
