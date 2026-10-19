import { Component, Input, Output, EventEmitter, OnChanges, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UppercaseDatePipe } from '@shared/pipes/uppercase-date.pipe';

import {
  EquipmentStatusItem,
  ConfigurableDetailDto,
} from '../models/status-and-history-query.model';
import { EquipmentStatusQueryApiService } from '../services/equipment-status-query-api.service';

@Component({
  selector: 'app-equipment-details-view',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatTooltipModule, PageHeaderWithBreadcrumb, DataTable, UppercaseDatePipe],
  templateUrl: './equipment-details-view.html',
  styleUrls: ['./equipment-details-view.scss'],
})
export class EquipmentDetailsView implements OnChanges {
  @Input() row!: EquipmentStatusItem;
  @Output() goBack = new EventEmitter<void>();

  private readonly apiService = inject(EquipmentStatusQueryApiService);
  private readonly pageHeaderService = inject(PageHeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
    showBackButton: true,
    onBackClick: () => this.goBack.emit(),
  };

  configTableConfig: DataTableConfig<ConfigurableDetailDto> = {
    columns: [
      { key: 'sequence', header: 'Sequence', sortable: false, width: '160px' },
      { key: 'description', header: 'Configurable Equipment Details', sortable: false },
      { key: 'value', header: 'Value', sortable: false, width: '200px' },
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No data available.',
    noDataIcon: 'search',
    enableRowHighlight: false,
  };

  details: EquipmentStatusItem | null = null;
  configurableDetails: ConfigurableDetailDto[] = [];
  isLoading = false;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
        };
      }
    });
  }

  ngOnChanges(): void {
    if (this.row) {
      this.loadDetails(this.row);
    }
  }

  private loadDetails(row: EquipmentStatusItem): void {
    this.isLoading = true;
    this.configurableDetails = [];
    this.headerConfig = {
      ...this.headerConfig,
      title: `${row.equipId} - ${row.equipType}`,
    };

    forkJoin({
      equipment: this.apiService.getEquipmentById(row.equipType, row.equipId, row.equipReference),
      parmValues: this.apiService.getEquipmentParmValues(row.equipType, row.equipId, row.equipReference),
    }).subscribe({
      next: ({ equipment, parmValues }) => {
        this.details = equipment.data?.[0] ?? row;
        this.configurableDetails = (parmValues.data ?? []).map((item, index) => ({
          ...item,
          sequence: index + 1,
        }));
        this.isLoading = false;
      },
      error: () => {
        this.details = row;
        this.configurableDetails = [];
        this.isLoading = false;
      },
    });
  }
}
