import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent, SortConfig } from '@shared/interfaces/data-table.interface';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { PackInvRejectsApiService } from '../services/pack-inv-rejects-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import { DiscardProductDto } from '../models/pack-inv-rejects.model';

@Component({
  selector: 'app-view-box-contents-panel',
  standalone: true,
  imports: [
    CommonModule,
    SidePanelBase,
    DataTable,
  ],
  template: `
    <app-side-panel-base
      [title]="'View Box Contents — ' + boxId"
      [width]="'754px'"
      [footerButtons]="footerButtons"
      (closePanel)="onClose()"
      (buttonClick)="onClose()">

      <ng-container panelContent>
        <app-data-table
          [config]="tableConfig()"
          [data]="sortedProducts()"
          [loading]="loading()"
          (sortChange)="onSortChange($event)" />
      </ng-container>
    </app-side-panel-base>
  `,
})
export class ViewBoxContentsDialogComponent implements OnChanges, OnDestroy {
  @Input() boxId: string = '';
  @Output() panelClosed = new EventEmitter<void>();

  private readonly apiService = inject(PackInvRejectsApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  protected readonly products = signal<DiscardProductDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly sortConfig = signal<SortConfig>({ column: 'unitId', direction: 'A' });

  readonly footerButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' },
  ];

  readonly tableConfig = computed<DataTableConfig<DiscardProductDto>>(() => ({
    columns: [
      {
        key: 'unitId',
        header: `Unit ID (${this.products().length})`,
        sortable: true,
      },
      {
        key: 'expDate',
        header: 'Expiration Date',
        valueFormatter: (_v: any, row: DiscardProductDto) => {
          if (!row.expDate) return '-';
          const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
          const d = convertUTCToTimezone(row.expDate, timezone);
          if (isNaN(d.getTime())) return row.expDate;
          const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          return `${dd}-${months[d.getMonth()]}-${d.getFullYear()} ${hh}:${mm}`;
        },
      },
      {
        key: 'productType',
        header: 'Product Type',
        valueFormatter: (_v: any, row: DiscardProductDto) => row.productDesc || row.productType || '-',
      },
      { key: 'productCode', header: 'Product Code' },
      {
        key: 'aboDesc',
        header: 'ABORh',
        valueFormatter: (_v: any, row: DiscardProductDto) => row.aboDesc || row.bloodType || '-',
      },
    ],
    stickyHeader: true,
    showPagination: false,
    emptyMessage: 'No products found in this box',
    sortConfig: this.sortConfig(),
  }));

  readonly sortedProducts = computed(() => {
    const data = [...this.products()];
    const dir = this.sortConfig().direction;
    data.sort((a, b) => {
      const cmp = (a.unitId ?? '').localeCompare(b.unitId ?? '');
      return dir === 'D' ? -cmp : cmp;
    });
    return data;
  });

  ngOnChanges(): void {
    if (this.boxId) {
      this.loadBoxContents();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBoxContents(): void {
    this.loading.set(true);
    this.products.set([]);
    this.apiService.getBoxContents(this.boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.products.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load box contents');
          this.loading.set(false);
        },
      });
  }

  onSortChange(event: TableSortEvent): void {
    this.sortConfig.set({ column: event.column, direction: event.direction });
  }

  onClose(): void {
    this.panelClosed.emit();
  }
}
