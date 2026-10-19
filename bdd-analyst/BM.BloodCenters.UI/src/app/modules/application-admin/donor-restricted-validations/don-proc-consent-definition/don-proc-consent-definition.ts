import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { DonProcConsentDefinitionService } from './services/don-proc-consent-definition.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  DonProcConsentDefinitionModel,
  DonProcConsentDefinitionParamsDto,
  DonProcConsentDefinitionFilterValue
} from './models/don-proc-consent-definition.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonProcConsentDefinitionFilterChipsUtils } from './utils/filter-chips.utils';
import { ConsentDefinitionFilterPanel } from './consent-definition-filter-panel/consent-definition-filter-panel';
import { AddEditConsentMapping } from './add-edit-consent-mapping/add-edit-consent-mapping';

@Component({
  selector: 'app-don-proc-consent-definition',
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
    AddEditConsentMapping
  ],
  templateUrl: './don-proc-consent-definition.html',
  styleUrls: ['./don-proc-consent-definition.scss']
})
export class DonProcConsentDefinitionComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(DataTable) dataTableComponent!: DataTable<DonProcConsentDefinitionModel>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<DonProcConsentDefinitionModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 10,
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

  appliedFilters: DonProcConsentDefinitionFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DonProcConsentDefinitionModel[] = [];
  requestState: DonProcConsentDefinitionParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DonProcConsentDefinitionModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private consentDefinitionService: DonProcConsentDefinitionService,
    private router: Router,
    private overlay: Overlay,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response and load data when chapter ID is available
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle
        };
      }

      // Load data when chapter ID becomes available
      const chapterId = this.headerService.getCurrentChapterId();
      if (chapterId) {
        this.loadData();
      }
    });
  }

  ngOnInit(): void {
    // Data loading is triggered by effect when chapter ID becomes available
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: 'Consent Mapping',
          link: null
        }
      ],
      title: 'Consent Mapping',
      actions: [{
        label: 'ADD NEW CONSENT MAPPING',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new consent mapping',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Donation Type, Procedure Code or Consent Code',
      minLength: 2,
      searchOnEnterOnly: true,
      ariaLabel: 'Search consent mappings by donation type, procedure code or consent code',
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 10,
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
      emptyMessage: 'No consent mappings available to display',
      loadingMessage: 'Loading consent mapping data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DonProcConsentDefinitionModel>[] {
    return [
      {
        key: 'donationType',
        header: 'Donation Type',
        sortable: true,
        width: '105px'
      },
      {
        key: 'procedureCode',
        header: 'Procedure Code',
        width: '120px'
      },
      {
        key: 'consentCode',
        header: 'Consent Code',
        width: '115px'
      },
      {
        key: 'consentDescription',
        header: 'Consent Description',
        width: '450px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<DonProcConsentDefinitionModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit consent mapping',
        ariaLabel: 'Edit consent mapping for {{donationType}} {{procedureCode}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    // Get current chapter ID from header service
    const chapterId = this.headerService.getCurrentChapterId();

    // Include ChapterId in request parameters
    const params: DonProcConsentDefinitionParamsDto = {
      ...this.requestState,
      ChapterId: chapterId
    };

    this.consentDefinitionService
      .getConsentDefinitions(take, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DonProcConsentDefinitionModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'No Consent Mapping data found';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.SearchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.Sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DonProcConsentDefinitionModel>): void {

    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

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
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
  }

  editRecord(record: DonProcConsentDefinitionModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

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

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

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

    const portal = new ComponentPortal(ConsentDefinitionFilterPanel);
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

  applyFilters(filters: DonProcConsentDefinitionFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(
      filters,
      (date: string) => this.formatDate(date)
    );

    this.requestState = {
      ...this.requestState,
      DonationType: filters.donationType || undefined,
      ProcedureCode: filters.procedureCode || undefined,
      ConsentCode: filters.consentCode || undefined,
      EffectiveDatePeriod: filters.effectiveDatePeriod || undefined,
      EffectiveDate: filters.effectiveDate || undefined,
      TerminationDatePeriod: filters.terminationDatePeriod || undefined,
      TerminationDate: filters.terminationDate || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DonProcConsentDefinitionFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DonProcConsentDefinitionFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters,
      (date: string) => this.formatDate(date)
    );

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DonProcConsentDefinitionFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Remove filter parameters
    const { DonationType, ProcedureCode, ConsentCode, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      // Remove filter parameters
      const { DonationType, ProcedureCode, ConsentCode, EffectiveDatePeriod, EffectiveDate, TerminationDatePeriod, TerminationDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    // Map filter values to backend parameter names
    this.requestState = {
      ...this.requestState,
      DonationType: this.appliedFilters.donationType || undefined,
      ProcedureCode: this.appliedFilters.procedureCode || undefined,
      ConsentCode: this.appliedFilters.consentCode || undefined,
      EffectiveDatePeriod: this.appliedFilters.effectiveDatePeriod || undefined,
      EffectiveDate: this.appliedFilters.effectiveDate || undefined,
      TerminationDatePeriod: this.appliedFilters.terminationDatePeriod || undefined,
      TerminationDate: this.appliedFilters.terminationDate || undefined
    };
  }

  getCompactFilterTooltip(): string {
    if (!this.filterChips || this.filterChips.length === 0) {
      return '';
    }
    return this.filterChips.map(chip => `${chip.label}`).join('\n');
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+C: Create new record
    if (event.altKey && event.key.toLowerCase() === 'c' && !this.sidePanelOpen) {
      event.preventDefault();
      this.createRecord();
    }

    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's' && !this.sidePanelOpen) {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f' && !this.sidePanelOpen) {
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
