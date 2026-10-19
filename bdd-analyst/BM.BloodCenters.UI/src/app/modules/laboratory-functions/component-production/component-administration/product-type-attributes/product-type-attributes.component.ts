import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { ProductAttributeService } from './services/product-attribute.service';
import {
  ProductAttribute,
  ProductAttributeParamsDto,
  ProductAttributeFilterValue
} from './models/product-attribute.model';

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
import { ProductAttributeFilterPanel } from './filter-panel/filter-panel.component';
import { AddEditProductAttribute, ProductAttributeFormData } from './add-edit-product-attribute/add-edit-product-attribute.component';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

/**
 * Product Type Attributes (ISBT/Codabar) Main Component
 * JIRA: MLT-14237
 * Route: /laboratory-functions/component-production-modules/component-administration/product-type-attributes-(isbt/codabar)
 */
@Component({
  selector: 'app-product-type-attributes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditProductAttribute
  ],
  templateUrl: './product-type-attributes.component.html',
  styleUrls: ['./product-type-attributes.component.scss']
})
export class ProductTypeAttributesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  // Validation constants
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

  tableConfig: DataTableConfig<ProductAttribute> = {
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
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: ProductAttributeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ProductAttribute[] = [];
  requestState: ProductAttributeParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ProductAttribute | null = null;

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  currentYear: number = new Date().getFullYear();

  constructor(
    private productAttributeService: ProductAttributeService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
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
          subtitle: pageData.subtitle || 'Create and manage customer profiles for billing and packlist use.',
          actions: [{
            label: 'ADD NEW PRODUCT TYPE ATTRIBUTE',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Add new product type attribute',
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
      placeholder: 'Search by Product Type, Attribute Group, or Attribute Code',
      minLength: this.VALIDATION.LIMITS.SEARCH_MIN_LENGTH,
      ariaLabel: 'Search product attributes by product type, attribute group, or attribute code',
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
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Product Type Attributes available to display',
      loadingMessage: 'Loading product type attributes data...',
      showPagination: true,
      sortConfig: {
        column: '',
        direction: 'default'
      }
    };
  }

  private getTableColumns(): TableColumn<ProductAttribute>[] {
    return [
      {
        key: 'productType',
        header: 'Lab Product Type',
        width: '120px',
        sortable: true
      },
      {
        key: 'attribGroup',
        header: 'Attribute Group',
        width: '130px',
        sortable: true
      },
      {
        key: 'attribCode',
        header: 'Attribute Code',
        width: '120px',
        sortable: true
      },
      {
        key: 'attribCodeDesc',
        header: 'Description',
        width: '200px',
        truncate: true,
        truncateLength: this.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
      },
      {
        key: 'labelFlag',
        header: 'Required for Labeling',
        width: '100px',
        valueFormatter: (value) => value === 'Y' ? 'Y' : 'N'
      },
      {
        key: 'lifeSpanInd',
        header: 'Life Span Indicator',
        width: '100px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'lifeSpan',
        header: 'Life Span',
        width: '100px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'newProductType',
        header: 'New Lab Product Type',
        width: '130px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '130px',
        sortable: true,
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
        header: 'Last Modified',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<ProductAttribute>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit product attribute',
        ariaLabel: 'Edit product attribute',
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

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.productAttributeService
      .getProductAttributes(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data || [];
          this.tableConfig.pagination!.totalRecords = response.total || 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading product attributes data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'No Product Type Attributes available to display';
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
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    // Map column names to API format
    const columnMap: { [key: string]: string } = {
      'productType': 'ProductType',
      'attribGroup': 'AttribGroup',
      'attribCode': 'AttribCode',
      'effDate': 'EffDate'
    };

    if (event.direction === 'default') {
      // Clear sorting
      this.requestState.sortColumn = undefined;
      this.requestState.sortOrder = undefined;
    } else {
      // Apply sorting
      this.requestState.sortColumn = columnMap[event.column] || event.column;
      this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    // Reset to first page when sorting changes
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<ProductAttribute>): void {
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

  editRecord(record: ProductAttribute): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(data?: ProductAttributeFormData): void {
    if (this.sidePanelMode === 'edit' && this.sidePanelData && data) {
      const rowIndex = this.dataSource.findIndex(
        item =>
          item.productType === this.sidePanelData!.productType &&
          item.attribGroup === this.sidePanelData!.attribGroup &&
          item.attribCode === this.sidePanelData!.attribCode
      );

      if (rowIndex !== -1) {
        const chapterDate = this.chapterTimezoneService.getChapterLocalDate().toDate();

        const updatedRow: ProductAttribute = {
          ...this.dataSource[rowIndex],
          labelFlag: data.labelFlag,
          lifeSpanInd: data.lifeSpanInd,
          lifeSpan: data.lifeSpan,
          effDate: data.effDate,
          termDate: data.termDate,
          newProductType: data.newProductType,
          lastModifiedDate: chapterDate
        };

        this.dataSource[rowIndex] = updatedRow;
        this.dataSource = [...this.dataSource];
        this.cdr.detectChanges();
      } else {
        this.loadTableData();
      }
    } else {
      this.loadTableData();
    }
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
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 56
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    this.isFilterOpen = true;

    const portal = new ComponentPortal(ProductAttributeFilterPanel);
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

  applyFilters(filters: ProductAttributeFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = FilterChipsUtils.convertFiltersToChips(filters);

    const effDateStr = filters.effDate && typeof filters.effDate === 'object' && filters.effDate.isValid?.()
      ? filters.effDate.format('YYYY-MM-DD') : (filters.effDate || undefined);
    const termDateStr = filters.termDate && typeof filters.termDate === 'object' && filters.termDate.isValid?.()
      ? filters.termDate.format('YYYY-MM-DD') : (filters.termDate || undefined);

    this.requestState = {
      ...this.requestState,
      productType: filters.productType || undefined,
      attribGroup: filters.attribGroup || undefined,
      attribCode: filters.attribCode || undefined,
      labelFlag: filters.labelFlag || undefined,
      lifeSpanInd: filters.lifeSpanInd || undefined,
      effDatePeriod: filters.effDatePeriod || undefined,
      effDate: effDateStr,
      termDatePeriod: filters.termDatePeriod || undefined,
      termDate: termDateStr,
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

    const { productType, attribGroup, attribCode, labelFlag, lifeSpanInd,
            effDate, effDatePeriod, termDate, termDatePeriod, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { productType, attribGroup, attribCode, labelFlag, lifeSpanInd,
              effDate, effDatePeriod, termDate, termDatePeriod, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    const effDateStr = this.appliedFilters.effDate && typeof this.appliedFilters.effDate === 'object' && this.appliedFilters.effDate.isValid?.()
      ? this.appliedFilters.effDate.format('YYYY-MM-DD') : (this.appliedFilters.effDate || undefined);
    const termDateStr = this.appliedFilters.termDate && typeof this.appliedFilters.termDate === 'object' && this.appliedFilters.termDate.isValid?.()
      ? this.appliedFilters.termDate.format('YYYY-MM-DD') : (this.appliedFilters.termDate || undefined);

    this.requestState = {
      ...this.requestState,
      productType: this.appliedFilters.productType || undefined,
      attribGroup: this.appliedFilters.attribGroup || undefined,
      attribCode: this.appliedFilters.attribCode || undefined,
      labelFlag: this.appliedFilters.labelFlag || undefined,
      lifeSpanInd: this.appliedFilters.lifeSpanInd || undefined,
      effDatePeriod: this.appliedFilters.effDatePeriod || undefined,
      effDate: effDateStr,
      termDatePeriod: this.appliedFilters.termDatePeriod || undefined,
      termDate: termDateStr
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.clearAllFilters();
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
    // Alt+C: Create new record
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
