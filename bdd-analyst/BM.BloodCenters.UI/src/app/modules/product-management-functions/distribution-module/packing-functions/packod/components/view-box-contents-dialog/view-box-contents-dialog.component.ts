import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { DiscardProductDto } from '../../models/packod.model';

@Component({
  selector: 'app-packod-view-box-contents-panel',
  standalone: true,
  imports: [
    CommonModule,
    SidePanelBase,
    DataTable,
  ],
  template: `
    <app-side-panel-base
      [title]="'Box Contents — ' + boxId"
      [width]="'754px'"
      [footerButtons]="footerButtons"
      (closePanel)="onClose()"
      (buttonClick)="onClose()">

      <ng-container panelContent>
        <app-data-table
          [config]="tableConfig()"
          [data]="sortedContents()"
          [loading]="false"
          (sortChange)="onSortChange($event)" />
      </ng-container>
    </app-side-panel-base>
  `,
})
export class PackodViewBoxContentsDialogComponent {
  @Input() boxId: string = '';
  @Input() contents: DiscardProductDto[] = [];
  @Output() panelClosed = new EventEmitter<void>();

  protected readonly sortColumn = signal<string>('');
  protected readonly sortDirection = signal<string>('ASC');

  readonly footerButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' }
  ];

  readonly tableConfig = computed<DataTableConfig<DiscardProductDto>>(() => ({
    columns: [
      {
        key: 'unitId',
        header: `Unit ID (${this.contents.length})`,
        sortable: true,
        valueFormatter: (_v: any, row: DiscardProductDto) =>
          row.chkDigit ? `${row.unitId} (${row.chkDigit})` : row.unitId,
      },
      { key: 'productType', header: 'Product Type' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'aboDesc', header: 'ABORh', valueFormatter: (_v: any, row: DiscardProductDto) => row.aboDesc || row.bloodType || '-' },
      { key: 'expDate', header: 'Expiration Date', type: 'date' as const },
      { key: 'collDate', header: 'Collection Date', type: 'date' as const },
    ],
    stickyHeader: true,
    emptyMessage: 'No products in this box',
    showPagination: false,
  }));

  readonly sortedContents = computed(() => {
    const data = [...this.contents];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (col === 'unitId') {
      data.sort((a, b) => {
        const cmp = (a.unitId ?? '').localeCompare(b.unitId ?? '');
        return dir === 'DESC' ? -cmp : cmp;
      });
    }
    return data;
  });

  onSortChange(event: TableSortEvent): void {
    if (event.direction === 'default') {
      this.sortColumn.set('');
      this.sortDirection.set('ASC');
    } else {
      this.sortColumn.set(event.column);
      this.sortDirection.set(event.direction === 'A' ? 'ASC' : 'DESC');
    }
  }

  onClose(): void {
    this.panelClosed.emit();
  }
}
