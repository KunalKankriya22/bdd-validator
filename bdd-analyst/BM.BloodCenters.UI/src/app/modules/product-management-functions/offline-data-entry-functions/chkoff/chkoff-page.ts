import { Component, OnDestroy, signal, computed, effect, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import moment from 'moment';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Shared Components
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';

// Interfaces
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';

// Feature
import { ChkOffForm, CheckInSuccessEvent } from './chkoff-form/chkoff-form';
import { ActiveProductDto } from './models/chkoff.model';

@Component({
  selector: 'app-chkoff-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    ChkOffForm
  ],
  templateUrl: './chkoff-page.html',
  styleUrl: './chkoff-page.scss'
})
export class ChkOffPage implements OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `chkoff-page-${ChkOffPage.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly products = signal<ActiveProductDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly showTable = signal(true);

  private readonly sortConfig = signal<{ column: string; direction: 'A' | 'D' | 'default' } | undefined>(undefined);

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    actions: []
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  private readonly staticColumns = [
    {
      key: 'collDate',
      header: 'Collection Date',
      sortable: false,
      valueFormatter: (value: any) => value ? moment(value).format('DD-MMM-YYYY').toUpperCase() : '-'
    },
    { key: 'productCode', header: 'Product', sortable: false },
    {
      key: 'bloodType',
      header: 'ABORh',
      sortable: false,
      valueFormatter: (_value: any, row: any) => row?.bloodTypeDescription || row?.bloodType || '-'
    },
    {
      key: 'expDate',
      header: 'Expiration Date',
      sortable: false,
      width: '175px',
      valueFormatter: (value: any) => value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : '-'
    },
    { key: 'warehouseId', header: 'Warehouse ID', sortable: false, maxWidth: '100px' },
    { key: 'deviceNumber', header: 'Device Number', sortable: false },
    { key: 'rackNumber', header: 'Rack Number', sortable: false },
    { key: 'trayId', header: 'Tray Number', sortable: false }
  ];

  protected readonly tableConfig = computed<DataTableConfig<ActiveProductDto>>(() => {
    const count = this.products().length;
    return {
      columns: [
        {
          key: 'displayUnitId',
          header: count > 0 ? `Unit ID (${count})` : 'Unit ID',
          sortable: true,
          valueFormatter: (value: any, row: any) => value || row?.unitId || '-'
        },
        ...this.staticColumns
      ],
      showPagination: false,
      sortConfig: this.sortConfig(),
      noDataIcon: 'search',
      emptyMessage: 'No Results to Display',
      emptySubMessage: 'Enter details to begin.'
    };
  });

  ngOnDestroy(): void {}

  onCheckInSuccess(event: CheckInSuccessEvent): void {
    const row: ActiveProductDto = {
      unitId: event.unitId,
      displayUnitId: event.displayUnitId ?? event.unitId,
      collDate: event.collDate,
      productCode: event.productCode,
      aliquot: '00',
      bloodType: event.bloodType,
      bloodTypeDescription: event.bloodTypeDescription ?? null,
      expDate: event.expirationDate,
      warehouseId: event.warehouseId || null,
      warehouseDescription: null,
      deviceNumber: event.deviceNumber || null,
      rackNumber: event.rackNumber || null,
      trayId: event.trayId || null,
      inventoryClass: event.inventoryClass,
      insertDate: new Date().toISOString()
    };

    this.products.update(list => [row, ...list]);
    this.refreshTable();
    this.snackbarService.showSuccess('Entry saved');
  }

  onSortChange(event: TableSortEvent): void {
    if (event.column === 'displayUnitId') {
      this.products.update(list => {
        const sorted = [...list];
        const getValue = (item: ActiveProductDto) => item.displayUnitId || item.unitId;
        if (event.direction === 'A') {
          sorted.sort((a, b) => getValue(a).localeCompare(getValue(b)));
        } else if (event.direction === 'D') {
          sorted.sort((a, b) => getValue(b).localeCompare(getValue(a)));
        }
        return sorted;
      });
      this.sortConfig.set({ column: event.column, direction: event.direction });
    }
  }

  onProductsCleared(): void {
    this.products.set([]);
    this.refreshTable();
  }

  private refreshTable(): void {
    this.showTable.set(false);
    this.cdr.detectChanges();
    this.showTable.set(true);
  }
}
