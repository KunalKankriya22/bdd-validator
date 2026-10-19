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

import { PrdtyatService } from './services/prdtyat.service';
import {
  ProductTypeAttribute,
  ProductTypeAttributeParamsDto,
  ProductTypeAttributeFilterValue,
  ProductTypeAttributeFormData
} from './models/product-type-attribute.model';

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
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FilterChipsUtils } from './utils/filter-chips.utils';
import { PrdtyatFilterComponent } from './components/prdtyat-filter/prdtyat-filter.component';
import { PrdtyatDrawerComponent } from './components/prdtyat-drawer/prdtyat-drawer.component';
import { PRDTYAT_VALIDATION, PRDTYAT_TABLE_CONFIG } from './constants/prdtyat.constants';

/**
 * Default Product Code Attributes (ISBT) Main Component
 * JIRA: MLT-12768
 * Mnemonic: PRDTYAT
 * Route: /laboratory-functions/component-production-modules/component-administration/prdtyat
 */
@Component({
  selector: 'app-prdtyat',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    PrdtyatDrawerComponent
  ],
  templateUrl: './prdtyat.component.html',
  styleUrls: ['./prdtyat.component.scss']
})
export class PrdtyatComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

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

  tableConfig: DataTableConfig<ProductTypeAttribute> = {
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

  appliedFilters: ProductTypeAttributeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ProductTypeAttribute[] = [];
  requestState: ProductTypeAttributeParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ProductTypeAttribute | null = null;

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private prdtyatService: PrdtyatService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
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
            label: 'ADD NEW PRODUCT CODE ATTRIBUTE',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Add new product code attribute',
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
      placeholder: 'Search by Product Type or Attribute Code',
      minLength: PRDTYAT_VALIDATION.LIMITS.SEARCH_MIN_LENGTH,
      ariaLabel: 'Search product type attributes by product type or attribute code',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Product Code Attributes available to display',
      loadingMessage: 'Loading product code attributes data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ProductTypeAttribute>[] {
    return [
      {
        key: 'anticoagulantCode',
        header: 'Anticoagulant Code',
        width: '130px'
      },
      {
        key: 'volume',
        header: 'Bag Volume',
        width: '110px',
        valueFormatter: (value) => value != null ? String(value) : '---'
      },
      {
        key: 'productType',
        header: 'Product Type',
        width: '120px'
      },
      {
        key: 'attributeGroup',
        header: 'Attribute Group',
        width: '130px'
      },
      {
        key: 'attributeGroupDesc',
        header: 'Description (Attribute Group)',
        width: '200px',
        truncate: true,
        truncateLength: PRDTYAT_VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
      },
      {
        key: 'attributeCode',
        header: 'Attribute Code',
        width: '130px'
      },
      {
        key: 'attributeCodeDesc',
        header: 'Description (Attribute Code)',
        width: '200px',
        truncate: true,
        truncateLength: PRDTYAT_VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
      },
      {
        key: 'productClass',
        header: 'Product Class',
        width: '120px'
      },
      {
        key: 'modifierCode',
        header: 'Modifier Code',
        width: '120px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<ProductTypeAttribute>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit product code attribute',
        ariaLabel: 'Edit product code attribute',
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

  /**
   * Announce messages to screen readers via ARIA live region
   */
  private announceToScreenReader(message: string): void {
    const announcer = document.getElementById('aria-live-announcer');
    if (announcer) {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.prdtyatService
      .getProductTypeAttributes(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data || [];
          this.tableConfig.pagination!.totalRecords = response.total || 0;
          this.isLoading = false;
          this.announceToScreenReader(`Loaded ${this.dataSource.length} of ${response.total} product code attributes.`);
        },
        error: (error) => {
          console.error('Error loading product type attributes data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'No Product Code Attributes available to display';
          this.announceToScreenReader('Error loading product code attributes.');
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

  onRowAction(event: TableRowActionEvent<ProductTypeAttribute>): void {
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

  editRecord(record: ProductTypeAttribute): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(data?: ProductTypeAttributeFormData): void {
    // Reload table data after save
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

    const portal = new ComponentPortal(PrdtyatFilterComponent);
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

  applyFilters(filters: ProductTypeAttributeFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = FilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      anticoagulantCode: filters.anticoagulantCode || undefined,
      productType: filters.productType || undefined,
      attribute: filters.attribute || undefined,
      effectiveDateFrom: filters.effectiveDateFrom || undefined,
      effectiveDateTo: filters.effectiveDateTo || undefined,
      terminationDateFrom: filters.terminationDateFrom || undefined,
      terminationDateTo: filters.terminationDateTo || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    const activeFilterCount = this.filterChips.length;
    this.announceToScreenReader(`Filters applied. ${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}.`);
    this.loadTableData();
  }

  onRemoveFilterChip(chipKey: string): void {
    const chip = this.filterChips.find(c => c.key === chipKey);
    this.appliedFilters = FilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = FilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (chip) {
      this.announceToScreenReader(`Filter removed: ${chip.label}`);
    }
    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return FilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { anticoagulantCode, productType, attribute, effectiveDateFrom, effectiveDateTo, terminationDateFrom, terminationDateTo, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.announceToScreenReader('All filters cleared.');
    this.loadTableData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { anticoagulantCode, productType, attribute, effectiveDateFrom, effectiveDateTo, terminationDateFrom, terminationDateTo, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      anticoagulantCode: this.appliedFilters.anticoagulantCode || undefined,
      productType: this.appliedFilters.productType || undefined,
      attribute: this.appliedFilters.attribute || undefined,
      effectiveDateFrom: this.appliedFilters.effectiveDateFrom || undefined,
      effectiveDateTo: this.appliedFilters.effectiveDateTo || undefined,
      terminationDateFrom: this.appliedFilters.terminationDateFrom || undefined,
      terminationDateTo: this.appliedFilters.terminationDateTo || undefined
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
