import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import {
  AttributesAntigensDialogData,
  ItemAntigenDto,
  ItemAttributeDto,
} from '../../models/enter-order-charges.model';

@Component({
  selector: 'app-attributes-antigens-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DataTable],
  templateUrl: './attributes-antigens-dialog.html',
  styleUrls: ['./attributes-antigens-dialog.scss'],
})
export class AttributesAntigensDialogComponent {
  readonly data = inject<AttributesAntigensDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AttributesAntigensDialogComponent>);

  antigensTableConfig: DataTableConfig<ItemAntigenDto> = {
    columns: [
      { key: 'itemNo', header: 'Item' },
      { key: 'antigen', header: 'Antigen' },
      { key: 'result', header: 'Result' },
      {
        key: 'unitPrice',
        header: 'Unit Price ($)',
        valueFormatter: (val: number) => val != null ? `$${val.toFixed(2)}` : '$0.00',
      },
    ],
    showPagination: false,
    showTableOnEmpty: true,
    emptyMessage: 'No antigens found.',
    caption: 'Item antigens',
  };

  attributesTableConfig: DataTableConfig<ItemAttributeDto> = {
    columns: [
      { key: 'itemNo', header: 'Item' },
      { key: 'group', header: 'Group' },
      { key: 'code', header: 'Code' },
      {
        key: 'unitPrice',
        header: 'Unit Price ($)',
        valueFormatter: (val: number) => val != null ? `$${val.toFixed(2)}` : '$0.00',
      },
    ],
    showPagination: false,
    showTableOnEmpty: true,
    emptyMessage: 'No attributes found.',
    caption: 'Item attributes',
  };

  onGoBack(): void {
    this.dialogRef.close();
  }
}
