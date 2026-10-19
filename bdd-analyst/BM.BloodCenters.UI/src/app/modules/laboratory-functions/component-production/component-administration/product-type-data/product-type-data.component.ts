import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { ProductTypeService } from './services/product-type.service';
import {
  ProductType,
  ProductTypeQueryDto,
  ProductTypeFilterValue
} from './models/product-type.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableRowActionEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FilterChipsUtils } from './utils/filter-chips.utils';
import { ProductTypeFilterPanel } from './filter-panel/filter-panel.component';
import { AddEditProductType, ProductTypeFormData } from './add-edit-product-type/add-edit-product-type.component';

@Component({
  selector: 'app-product-type-data',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditProductType
  ],
  templateUrl: './product-type-data.component.html',
  styleUrls: ['./product-type-data.component.scss']
})
export class ProductTypeDataComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  readonly VALIDATION = {
    LIMITS: {
      SEARCH_MIN_LENGTH: 2,
      DEFAULT_PAGE_SIZE: 25,
      DESCRIPTION_TRUNCATE_LENGTH: 50
    }
  };

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<ProductType> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: ProductTypeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ProductType[] = [];
  requestState: ProductTypeQueryDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ProductType | null = null;

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private productTypeService: ProductTypeService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            {
              label: 'Home',
              link: '/home'
            },
            {
              label: pageData.title,
              link: null
            }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'Manage product types and classification details.',
          actions: [{
            label: 'ADD NEW PRODUCT TYPE',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Add new product type',
            onClick: () => this.createRecord()
          }]
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadTableData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.searchConfig = {
      placeholder: 'Search by product type or description',
      minLength: this.VALIDATION.LIMITS.SEARCH_MIN_LENGTH,
      ariaLabel: 'Search product types by code, description, or class',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: this.VALIDATION.LIMITS.DEFAULT_PAGE_SIZE,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: '',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No records found',
      loadingMessage: 'Loading product types data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ProductType>[] {
    return [
      {
        key: 'productTypeCode',
        header: 'Product Type',
        width: '110px',
        sortable: true
      },
      {
        key: 'productTypeDesc',
        header: 'Product Description',
        width: '180px',
        truncate: true,
        truncateLength: this.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
      },
      {
        key: 'productClass',
        header: 'Class',
        width: '100px',
        sortable: false
      },
      {
        key: 'productGroupName',
        header: 'Class Description',
        width: '180px',
        truncate: true,
        truncateLength: this.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
      },
      {
        key: 'aboOnly',
        header: 'ABO Only',
        width: '90px',
        valueFormatter: (value) => this.formatYesNo(value)
      },
      {
        key: 'attribFlag',
        header: 'Accepted in Definition',
        headerTooltip: 'Attribute accepted during component definition',
        width: '130px',
        valueFormatter: (value) => this.formatYesNo(value)
      },
      {
        key: 'weightRequired',
        header: 'Weight Required',
        width: '110px',
        valueFormatter: (value) => this.formatYesNo(value)
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '130px',
        sortable: false,
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'lastModifiedDate',
        header: 'Modification Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<ProductType>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit product type',
        ariaLabel: 'Edit product type',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | string | null): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private serializeDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }

  private formatYesNo(value: string | null | undefined): string {
    if (value === 'Y') return 'Yes';
    if (value === 'N') return 'No';
    return '–';
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.productTypeService
      .getProductTypes(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data || [];
          this.tableConfig.pagination!.totalRecords = response.total || 0;

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading product types data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'No records found';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadTableData();
  }

  onSortChange(event: TableSortEvent): void {
    const columnMap: { [key: string]: string } = {
      'productTypeCode': 'ProductTypeCode',
      'productClass': 'ProductClass',
      'effDate': 'EffDate'
    };

    if (event.direction === 'default') {
      this.requestState.sortColumn = undefined;
      this.requestState.sortOrder = undefined;
    } else {
      this.requestState.sortColumn = columnMap[event.column] || event.column;
      this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<ProductType>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: ProductType): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadTableData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    this.isFilterOpen = true;

    const portal = new ComponentPortal(ProductTypeFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: ProductTypeFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = FilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      productTypeCode: undefined,
      productClass: filters.productClass || undefined,
      aboOnly: filters.aboOnly || undefined,
      attribFlag: filters.attribFlag || undefined,
      weightRequired: filters.weightRequired || undefined,
      effDateFrom:
        filters.effDatePeriod === 'After' && filters.effDate
          ? this.serializeDate(filters.effDate)
          : undefined,
      effDateTo:
        filters.effDatePeriod === 'Before' && filters.effDate
          ? this.serializeDate(filters.effDate)
          : undefined,
      termDateFrom:
        filters.termDatePeriod === 'After' && filters.termDate
          ? this.serializeDate(filters.termDate)
          : undefined,
      termDateTo:
        filters.termDatePeriod === 'Before' && filters.termDate
          ? this.serializeDate(filters.termDate)
          : undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = FilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = FilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return FilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { productClass, aboOnly, attribFlag, weightRequired, effDateFrom, effDateTo, termDateFrom, termDateTo, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { productClass, aboOnly, attribFlag, weightRequired, effDateFrom, effDateTo, termDateFrom, termDateTo, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      productClass: this.appliedFilters.productClass || undefined,
      aboOnly: this.appliedFilters.aboOnly || undefined,
      attribFlag: this.appliedFilters.attribFlag || undefined,
      weightRequired: this.appliedFilters.weightRequired || undefined,
      effDateFrom:
        this.appliedFilters.effDatePeriod === 'After' && this.appliedFilters.effDate
          ? this.serializeDate(this.appliedFilters.effDate)
          : undefined,
      effDateTo:
        this.appliedFilters.effDatePeriod === 'Before' && this.appliedFilters.effDate
          ? this.serializeDate(this.appliedFilters.effDate)
          : undefined,
      termDateFrom:
        this.appliedFilters.termDatePeriod === 'After' && this.appliedFilters.termDate
          ? this.serializeDate(this.appliedFilters.termDate)
          : undefined,
      termDateTo:
        this.appliedFilters.termDatePeriod === 'Before' && this.appliedFilters.termDate
          ? this.serializeDate(this.appliedFilters.termDate)
          : undefined
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload data when chapter changes
      });
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
