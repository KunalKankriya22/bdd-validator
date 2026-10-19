import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

import { ValidDonationTypeProcedureCodeService } from './services/valid-donation-type-procedure-code.service';
import {
  ValidDonationTypeProcedureCodeModel,
  ValidDonationTypeProcedureCodeParamsDto,
  DonationTypeProcedureCodeFilterValue
} from './models/valid-donation-type-procedure-code.model';

import { PageHeaderWithBreadcrumb } from '../../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '../../../../shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '../../../../shared/components/search-bar/search-bar';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '../../../../shared/interfaces/data-table.interface';

import { FilterChips, FilterChip } from '../../../../shared/components/filter-chips/filter-chips';
import { convertFiltersToChips, removeFilterByChipKey, hasActiveFilters as hasFilters } from './utils/filter-chips.utils';
import { DonationTypeProcedureFilterPanel } from './donation-type-procedure-filter-panel/donation-type-procedure-filter-panel';
import { AddEditDonationTypeProcedureCodePanel } from './add-edit-donation-type-procedure-code-panel/add-edit-donation-type-procedure-code-panel';

@Component({
  selector: 'app-valid-donation-type-procedure-code',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditDonationTypeProcedureCodePanel
  ],
  templateUrl: './valid-donation-type-procedure-code.html',
  styleUrls: ['./valid-donation-type-procedure-code.scss']
})
export class ValidDonationTypeProcedureCodeComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<ValidDonationTypeProcedureCodeModel>;
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
    minLength: 2,
    searchOnEnterOnly: true,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<ValidDonationTypeProcedureCodeModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'donationType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DonationTypeProcedureCodeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ValidDonationTypeProcedureCodeModel[] = [];
  requestState: ValidDonationTypeProcedureCodeParamsDto = { sort: 'A' };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ValidDonationTypeProcedureCodeModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();
  private pageHeaderService = inject(PageHeaderService);

  constructor(
    private validDonationTypeProcedureCodeService: ValidDonationTypeProcedureCodeService,
    private router: Router,
    private overlay: Overlay,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    // Bind title and subtitle from API via PageHeaderService
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
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
          subtitle: pageData.subtitle ? pageData.subtitle : ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    // Dispose overlay if it exists
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: '',
          link: null
        }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD NEW ATTRIBUTE MAPPING',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new attribute mapping',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Donation Type, Procedure Code, Attribute Group and Attribute Code',
      minLength: 2,
      searchOnEnterOnly: true,
      ariaLabel: 'Search attribute mappings'
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
      sortConfig: {
        column: 'DonationType',
        direction: 'A'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No attribute mappings available to display',
      loadingMessage: 'Loading attribute mapping data...',
      enableRowHighlight: true,
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ValidDonationTypeProcedureCodeModel>[] {
    return [
      {
        key: 'DonationType',
        header: 'Donation Type',
        sortable: true,
        width: '130px'
      },
      {
        key: 'ProcedureCode',
        header: 'Procedure Code',
        sortable: false,
        width: '140px'
      },
      {
        key: 'AttribGroup',
        header: 'Attribute Group',
        sortable: false,
        width: '140px'
      },
      {
        key: 'AttribCode',
        header: 'Attribute Code',
        sortable: false,
        width: '140px'
      },
      {
        key: 'EffDate',
        header: 'Effective Date',
        sortable: false,
        width: '140px',
        valueFormatter: (_value, row) => this.formatDate(row.EffDate)
      },
      {
        key: 'TermDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        valueFormatter: (_value, row) => this.formatDate(row.TermDate)
      },
      {
        key: 'LastModifiedDate',
        header: 'Modification Date',
        sortable: false,
        width: '160px',
        valueFormatter: (_value, row) => this.formatChapterDate(row.LastModifiedDate)
      }
    ];
  }

  private getRowActions(): RowAction<ValidDonationTypeProcedureCodeModel>[] {
    return [
      {
        action: 'edit',
        label: 'Edit',
        icon: 'edit',
        ariaLabel: 'Edit attribute mapping',
        visible: () => true
      }
    ];
  }

  // =========================
  // DATA LOADING
  // =========================

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const pageNumber = this.tableConfig.pagination!.pageIndex + 1;
    const pageSize = this.tableConfig.pagination!.pageSize;

    this.validDonationTypeProcedureCodeService
      .getValidDonationTypeProcedureCodes(pageNumber, pageSize, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data || [];
          this.tableConfig.pagination!.totalRecords = response.totalRecords || 0;
          this.isLoading = false;
        },
        error: (error) => {
          this.hasError = true;
          this.errorMessage = error.error?.message || 'Failed to load attribute mappings';
          this.isLoading = false;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        }
      });
  }

  // =========================
  // SEARCH
  // =========================

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.requestState.searchKeyword = searchText || null;
    this.tableConfig.pagination!.pageIndex = 0;
    this.hasError = false;
    this.loadData();
  }

  // =========================
  // PAGINATION
  // =========================

  onPageChange(event: TablePageEvent): void {
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.loadData();
  }

  // =========================
  // SORTING
  // =========================

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      const newDirection = event.direction === 'A' ? 'A' : 'D';
      this.tableConfig.sortConfig.direction = newDirection;
      this.requestState.sort = newDirection;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  // =========================
  // ROW ACTIONS
  // =========================

  onRowAction(event: TableRowActionEvent<ValidDonationTypeProcedureCodeModel>): void {
    // Highlight the row when action is clicked
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    if (event.action === 'edit') {
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = event.row;
      }
      this.editRecord(event.row);
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: ValidDonationTypeProcedureCodeModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  // =========================
  // SIDE PANEL
  // =========================

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  onModeChange(mode: 'add' | 'edit'): void {
    this.sidePanelMode = mode;
    if (mode === 'add') {
      this.sidePanelData = null;
    }
  }

  // =========================
  // FILTER
  // =========================

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

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
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(DonationTypeProcedureFilterPanel);
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

  applyFilters(filters: DonationTypeProcedureCodeFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = convertFiltersToChips(filters);

    this.requestState.donationType = filters.donationType;
    this.requestState.procedureCode = filters.procedureCode;
    this.requestState.attributeGroup = filters.attributeGroup;
    this.requestState.period = filters.period;
    this.requestState.effectiveDate = filters.effectiveDate
      ? this.formatDateForApi(filters.effectiveDate)
      : null;
    this.requestState.terminationDate = filters.terminationDate
      ? this.formatDateForApi(filters.terminationDate)
      : null;
    this.requestState.terminationPeriod = filters.terminationPeriod;

    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return hasFilters(this.appliedFilters);
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters = removeFilterByChipKey(this.appliedFilters, chipKey);
    if (updatedFilters) {
      this.applyFilters(updatedFilters);
    } else {
      this.clearAllFilters();
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.requestState.donationType = null;
    this.requestState.procedureCode = null;
    this.requestState.attributeGroup = null;
    this.requestState.period = null;
    this.requestState.effectiveDate = null;
    this.requestState.terminationDate = null;
    this.requestState.terminationPeriod = null;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  // =========================
  // UTILITIES
  // =========================

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  private formatChapterDate(date: string | null | undefined): string {
    if (!date) return '-';
    const offset = this.headerService.chapterTimeZone();
    const m = offset ? moment.utc(date).utcOffset(offset) : moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }
}
