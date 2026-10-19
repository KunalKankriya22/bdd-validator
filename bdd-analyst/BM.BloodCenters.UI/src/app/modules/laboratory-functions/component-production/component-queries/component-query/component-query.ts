import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit, AfterViewInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, switchMap, of, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { formatTableDate } from '@shared/utils/date-format.util';

import { ComponentQueryApiService } from './services/component-query-api.service';
import {
  ComponentQueryDto,
  ConvertedProductDto,
  ComponentAttributeDto,
  ComponentInterdictionDto,
} from './models/component-query.model';

@Component({
  selector: 'app-component-query',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    UnitIdFieldComponent,
  ],
  templateUrl: './component-query.html',
  styleUrl: './component-query.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentQueryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('expandTemplate', { static: false }) expandTemplate!: TemplateRef<{ $implicit: ComponentQueryDto }>;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly apiService = inject(ComponentQueryApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  private currentUnitId = '';
  private componentsSortOrder = 'ASC';
  private convertedSortOrder = 'ASC';
  private attrSortOrder = 'ASC';
  private interSortOrder = 'ASC';

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Component Query', link: null },
    ],
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search',
    minLength: 1,
    ariaLabel: 'Search components',
    alwaysShowTooltip: false,
    searchOnEnterOnly: false,
  };

  readonly isLoading = signal(false);
  readonly hasResults = signal(false);
  readonly isTabLoading = signal(false);

  readonly collectionDateDisplay = signal('');
  readonly totalBagsDisplay = signal<number | null>(null);

  selectedTabIndex = 0;

  components = signal<ComponentQueryDto[]>([]);
  convertedComponents = signal<ConvertedProductDto[]>([]);
  attributes = signal<ComponentAttributeDto[]>([]);
  interdictions = signal<ComponentInterdictionDto[]>([]);
  attrProductCode = signal('');
  attrDescription = signal('');

  expandedRows = new Set<string>();
  expandRowKey = 'uniqueRowId';
  convertedExpandedRows = new Set<string>();

  private readonly componentColumns: TableColumn<ComponentQueryDto>[] = [
    { key: 'productCode', header: 'Product Type', sortable: true, width: '120px', minWidth: '120px' },
    { key: 'aboDescription', header: 'System Label', sortable: false, width: '180px', minWidth: '140px', truncate: true },
    { key: 'expiryDate', header: 'Expiration Date', sortable: false, width: '180px', minWidth: '150px', valueFormatter: (v) => this.formatDateTimeValue(v) },
    { key: 'relabelProductCode', header: 'Defined Component', sortable: false, width: '140px', minWidth: '120px', truncate: true },
    { key: 'bagId', header: 'Catalog Number', sortable: false, width: '140px', minWidth: '120px' },
    { key: 'bagsUsed', header: 'Bags', sortable: false, width: '60px', minWidth: '50px' },
    { key: 'pooledComponentId', header: 'Pool ID', sortable: false, width: '70px', minWidth: '60px', truncate: true },
    { key: 'labelDate', header: 'Label Date', sortable: false, width: '180px', minWidth: '150px', valueFormatter: (v) => this.formatDateTimeValue(v) },
    { key: 'voidReasonCode', header: 'Void', sortable: false, width: '76px', minWidth: '60px', truncate: true },
  ];

  componentsTableConfig: DataTableConfig<ComponentQueryDto> = {
    columns: this.componentColumns,
    showPagination: true,
    pagination: { pageSize: 10, pageIndex: 0, totalRecords: 0, pageSizeOptions: [10, 25, 50, 100] },
    sortConfig: { column: 'productCode', direction: 'default' },
    stickyHeader: true,
    hideExpandAllInHeader: true,
  };

  convertedComponentsTableConfig: DataTableConfig<ConvertedProductDto> = {
    columns: this.componentColumns as TableColumn<ConvertedProductDto>[],
    showPagination: true,
    pagination: { pageSize: 10, pageIndex: 0, totalRecords: 0, pageSizeOptions: [10, 25, 50, 100] },
    sortConfig: { column: 'productCode', direction: 'default' },
    stickyHeader: true,
    hideExpandAllInHeader: true,
  };

  attributesTableConfig: DataTableConfig<ComponentAttributeDto> = {
    columns: [
      { key: 'productCode', header: 'Product Code', sortable: true },
      { key: 'attribGroup', header: 'Attribute Group', sortable: false },
      { key: 'attribGroupDescription', header: 'Description', sortable: false, truncate: true },
      { key: 'attribCode', header: 'Attribute Code', sortable: false },
      { key: 'attribCodeDescription', header: 'Description', sortable: false, truncate: true },
    ],
    sortConfig: { column: 'productCode', direction: 'default' },
    showPagination: false,
    stickyHeader: true,
  };

  interdictionsTableConfig: DataTableConfig<ComponentInterdictionDto> = {
    columns: [
      { key: 'productCode', header: 'Product Code', sortable: true },
      { key: 'interCode', header: 'Interdiction Code', sortable: false },
      { key: 'interDescription', header: 'Description', sortable: false, truncate: true },
      { key: 'interTypeDescription', header: 'Interdiction Type', sortable: false, truncate: true },
    ],
    sortConfig: { column: 'productCode', direction: 'default' },
    showPagination: false,
    stickyHeader: true,
  };

  ngOnInit(): void {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    if (menuItem?.label) {
      this.pageHeaderConfig = {
        ...this.pageHeaderConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: menuItem.label, link: null },
        ],
      };
    }

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearResults();
        this.unitIdField?.clear();
      });
  }

  ngAfterViewInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const unitId = params['unitId'];
      if (unitId && this.unitIdField) {
        this.unitIdField.setValue(unitId);
        this.currentUnitId = unitId;
        this.loadSummary(unitId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;

    this.currentUnitId = unitId;
    this.loadSummary(unitId);
  }

  private loadSummary(unitId: string): void {
    this.isLoading.set(true);

    this.apiService.getSummary(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);

          if (response.success && response.data && response.data.length > 0) {
            const summary = response.data[0];
            this.collectionDateDisplay.set(summary.collDate || '');
            this.totalBagsDisplay.set(summary.totalComponentBags ?? null);

            // Summary returns all records (no pagination) per API doc section 4.1
            const comps = (summary.mainComponents || []).map((c, i) => ({
              ...c,
              uniqueRowId: `comp_${c.productCode}_${i}`,
            }));
            this.components.set(comps);
            this.componentsTableConfig = {
              ...this.componentsTableConfig,
              pagination: { ...this.componentsTableConfig.pagination!, totalRecords: comps.length },
            };

            const convComps = (summary.convertedProducts || []).map((c, i) => ({
              ...c,
              uniqueRowId: `conv_${c.productCode}_${i}`,
            }));
            this.convertedComponents.set(convComps);
            this.convertedComponentsTableConfig = {
              ...this.convertedComponentsTableConfig,
              pagination: { ...this.convertedComponentsTableConfig.pagination!, totalRecords: convComps.length },
            };

            if (comps.length > 0) {
              this.attrProductCode.set(comps[0].productCode || '');
              this.attrDescription.set(comps[0].productDescription || '');
            }

            this.expandedRows = new Set<string>();
            this.convertedExpandedRows = new Set<string>();
            this.hasResults.set(true);
            this.selectedTabIndex = 0;
          }
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onTabChange(): void {
    if (this.selectedTabIndex === 2 && this.currentUnitId && this.attrProductCode()) {
      this.loadAttributesAndInterdictions(this.currentUnitId, this.attrProductCode());
    }
  }

  onComponentsPageChange(event: TablePageEvent): void {
    if (!this.currentUnitId) return;
    this.loadComponents(event.pageSize, event.pageIndex * event.pageSize, event.pageIndex, event.pageSize);
  }

  onComponentsSortChange(event: TableSortEvent): void {
    if (!this.currentUnitId) return;
    this.componentsSortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    this.componentsTableConfig = {
      ...this.componentsTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    const pageSize = this.componentsTableConfig.pagination?.pageSize || 10;
    this.loadComponents(pageSize, 0, 0, pageSize);
  }

  onConvertedPageChange(event: TablePageEvent): void {
    if (!this.currentUnitId) return;
    this.loadConverted(event.pageSize, event.pageIndex * event.pageSize, event.pageIndex, event.pageSize);
  }

  onConvertedSortChange(event: TableSortEvent): void {
    if (!this.currentUnitId) return;
    this.convertedSortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    this.convertedComponentsTableConfig = {
      ...this.convertedComponentsTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    const pageSize = this.convertedComponentsTableConfig.pagination?.pageSize || 10;
    this.loadConverted(pageSize, 0, 0, pageSize);
  }

  private loadComponents(take: number, skip: number, pageIndex: number, pageSize: number): void {
    this.isTabLoading.set(true);
    this.apiService.getComponents(this.currentUnitId, take, skip, this.componentsSortOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isTabLoading.set(false);
          if (response.success && response.data) {
            const comps = response.data.map((c, i) => ({ ...c, uniqueRowId: `comp_${c.productCode}_${skip + i}` }));
            this.components.set(comps);
            this.componentsTableConfig = {
              ...this.componentsTableConfig,
              pagination: { ...this.componentsTableConfig.pagination!, totalRecords: response.total, pageIndex, pageSize },
            };
            this.expandedRows = new Set<string>();
          }
        },
        error: () => this.isTabLoading.set(false),
      });
  }

  private loadConverted(take: number, skip: number, pageIndex: number, pageSize: number): void {
    this.isTabLoading.set(true);
    this.apiService.getConverted(this.currentUnitId, take, skip, this.convertedSortOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isTabLoading.set(false);
          if (response.success && response.data) {
            const comps = response.data.map((c, i) => ({ ...c, uniqueRowId: `conv_${c.productCode}_${skip + i}` }));
            this.convertedComponents.set(comps);
            this.convertedComponentsTableConfig = {
              ...this.convertedComponentsTableConfig,
              pagination: { ...this.convertedComponentsTableConfig.pagination!, totalRecords: response.total, pageIndex, pageSize },
            };
            this.convertedExpandedRows = new Set<string>();
          }
        },
        error: () => this.isTabLoading.set(false),
      });
  }

  onAttributesSortChange(event: TableSortEvent): void {
    this.attrSortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    this.attributesTableConfig = {
      ...this.attributesTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    if (this.currentUnitId && this.attrProductCode()) {
      this.loadAttributesAndInterdictions(this.currentUnitId, this.attrProductCode());
    }
  }

  onInterdictionsSortChange(event: TableSortEvent): void {
    this.interSortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    this.interdictionsTableConfig = {
      ...this.interdictionsTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    if (this.currentUnitId && this.attrProductCode()) {
      this.loadAttributesAndInterdictions(this.currentUnitId, this.attrProductCode());
    }
  }

  private loadAttributesAndInterdictions(unitId: string, productCode: string): void {
    if (!productCode) {
      this.attributes.set([]);
      this.interdictions.set([]);
      return;
    }

    if (productCode === 'NONE') {
      this.attributes.set([]);
      this.interdictions.set([]);
      this.snackbarService.showError('Error 0153: This is a discarded bag');
      return;
    }

    this.isTabLoading.set(true);

    this.apiService.getAttributes(unitId, productCode, this.attrSortOrder)
      .pipe(
        switchMap((attrsResponse) => {
          if (!attrsResponse.success && attrsResponse.errorCode === '0153') {
            this.snackbarService.showError(`Error 0153: ${attrsResponse.message}`);
            return of({ attrs: { success: false, data: null, total: 0 } as any, inters: { success: false, data: null, total: 0 } as any });
          }
          return this.apiService.getInterdictions(unitId, productCode, this.interSortOrder).pipe(
            switchMap((intersResponse) => of({ attrs: attrsResponse, inters: intersResponse }))
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: ({ attrs, inters }) => {
          this.isTabLoading.set(false);
          this.attributes.set(attrs.success && attrs.data ? attrs.data : []);
          this.interdictions.set(inters.success && inters.data ? inters.data : []);
        },
        error: (error) => {
          this.isTabLoading.set(false);
          this.attributes.set([]);
          this.interdictions.set([]);
          const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
          if (errorCode === '0153') {
            this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'This is a discarded bag'));
          } else if (errorCode !== '0068') {
            this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'Failed to load attributes/interdictions'));
          }
        },
      });
  }

  onUnitCleared(): void {
    this.clearResults();
  }

  onSearch(searchText: string): void {
    // TODO: Wire up client-side filtering when filter panel is implemented
  }

  private clearResults(): void {
    this.currentUnitId = '';
    this.collectionDateDisplay.set('');
    this.totalBagsDisplay.set(null);
    this.components.set([]);
    this.convertedComponents.set([]);
    this.attributes.set([]);
    this.interdictions.set([]);
    this.attrProductCode.set('');
    this.attrDescription.set('');
    this.expandedRows = new Set<string>();
    this.convertedExpandedRows = new Set<string>();
    this.selectedTabIndex = 0;
    this.hasResults.set(false);
  }

  onRowExpandToggle(row: ComponentQueryDto): void {
    const key = row.uniqueRowId;
    if (!key) return;
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
    this.expandedRows = new Set(this.expandedRows);
  }

  onConvertedRowExpandToggle(row: ConvertedProductDto): void {
    const key = row.uniqueRowId;
    if (!key) return;
    if (this.convertedExpandedRows.has(key)) {
      this.convertedExpandedRows.delete(key);
    } else {
      this.convertedExpandedRows.add(key);
    }
    this.convertedExpandedRows = new Set(this.convertedExpandedRows);
  }

  formatDateTimeValue(dateString: string): string {
    if (!dateString) return '-';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '-';
  }

  formatDateValue(dateString: string): string {
    return formatTableDate(dateString);
  }
}
