import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, TemplateRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, delay } from 'rxjs';
import moment from 'moment';

import { ViewSystemParameterService } from '../services/view-system-parameter.service';
import {
  SystemParameterModel,
  SystemParameterParamsDto,
  SystemParameterFilterFormValue,
  ParameterOption
} from '../interfaces/view-system-parameter.interface';

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
import { FilterSystemParameter } from '../filter-system-parameter/filter-system-parameter';
import { AddEditSystemParameter } from '../add-edit-system-parameter/add-edit-system-parameter';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SystemParameterFilterChipsUtils } from '../utils/filter-chips.utils';
import { NotificationService } from '@shared/services/notification.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-view-system-parameter',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips
  ],
  templateUrl: './view-system-parameter.html',
  styleUrls: ['./view-system-parameter.scss']
})
export class ViewSystemParameter implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtnRef!: ElementRef;
  @ViewChild('chipsScroll') chipsScrollRef!: ElementRef;
  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;

  // Filter panel state
  isFilterOpen = false;

  // Chips scroll state
  showLeftArrow = false;
  showRightArrow = false;

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

  tableConfig: DataTableConfig<SystemParameterModel> = {
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
      column: 'parameterCode',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: SystemParameterFilterFormValue | null = null;
  filterChips: FilterChip[] = [];
  parameterOptions: ParameterOption[] = [];

  dataSource: SystemParameterModel[] = [];
  requestState: SystemParameterParamsDto = { sortOrder: 'ASC' };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  editingRow: SystemParameterModel | null = null;

  private overlayRef: OverlayRef | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private service: ViewSystemParameterService,
    private dialog: MatDialog,
    private overlay: Overlay,
    private notificationService: NotificationService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

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
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    const statusCol = this.tableConfig.columns.find(c => c.key === 'status');
    if (statusCol && this.statusCellTemplate) {
      statusCol.cellTemplate = this.statusCellTemplate;
    }

    this.loadData();
    this.loadParameterOptions();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayRef?.dispose();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD NEW PARAMETER',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new system parameter',
        onClick: () => this.openAddDialog()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Parameters or Description',
      minLength: 1,
      ariaLabel: 'Search by Parameters or Description',
      searchOnEnterOnly: true
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
        column: 'parameterCode',
        direction: 'A'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No system parameters available to display',
      loadingMessage: 'Loading system parameter data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<SystemParameterModel>[] {
    return [
      {
        key: 'parameterCode',
        header: 'Parameter',
        sortable: true,
        width: '140px'
      },
      {
        key: 'parameterType',
        header: 'Type',
        width: '80px'
      },
      {
        key: 'parameterValue',
        header: 'Value',
        width: '120px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '300px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'status',
        header: 'Status',
        width: '120px'
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getStatusClass(row: SystemParameterModel): string {
    if (!row.terminationDate) return 'active';
    const termDateStr = row.terminationDate.substring(0, 10);
    const chapterTimezone = this.headerService.getCurrentChapterTimezone();
    const chapterTodayStr = chapterTimezone
      ? moment().utcOffset(chapterTimezone).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');
    return termDateStr <= chapterTodayStr ? 'inactive' : 'active';
  }

  getStatusText(row: SystemParameterModel): string {
    return this.getStatusClass(row) === 'active' ? 'Active' : 'Inactive';
  }

  private getRowActions(): RowAction<SystemParameterModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit parameter',
        ariaLabel: 'Edit parameter {{parameterCode}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private loadParameterOptions(): void {
    this.service.getParameterLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.parameterOptions = options;
        },
        error: (error) => {
          console.error('Error loading parameter options:', error);
        }
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip = (this.tableConfig.pagination?.pageIndex || 0) * (this.tableConfig.pagination?.pageSize || 10);
    const take = this.tableConfig.pagination?.pageSize || 10;

    this.service
      .getSystemParameters(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading system parameters:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load system parameter data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;
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
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    const directionMap: Record<string, string> = { 'A': 'ASC', 'D': 'DESC' };
    this.requestState.sortOrder = event.direction === 'default' ? undefined : directionMap[event.direction];
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<SystemParameterModel>): void {
    if (event.action === 'edit') {
      this.openEditDialog(event.row);
    }
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditSystemParameter, {
      width: '660px',
      disableClose: true,
      autoFocus: false,
      position: { right: '0' },
      panelClass: 'system-parameter-drawer',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
        this.loadParameterOptions();
      }
    });
  }

  openEditDialog(record: SystemParameterModel): void {
    this.editingRow = record;

    const dialogRef = this.dialog.open(AddEditSystemParameter, {
      width: '660px',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
      position: { right: '0' },
      panelClass: 'system-parameter-drawer',
      data: { mode: 'edit', record }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.editingRow = null;
      if (result) {
        this.loadData();
        this.loadParameterOptions();
      }
    });
  }

  // --- Filter Panel ---

  toggleFilter(): void {
    if (this.overlayRef?.hasAttached()) {
      this.closeFilter();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtnRef)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: '320px'
    });

    const portal = new ComponentPortal(FilterSystemParameter);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.parameterOptions = this.parameterOptions;

    componentRef.instance.apply.subscribe((filters: SystemParameterFilterFormValue) => {
      this.applyFilters(filters);
      this.closeFilter();
    });

    componentRef.instance.close.subscribe(() => {
      this.closeFilter();
    });

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeFilter();
    });
  }

  closeFilter(): void {
    this.isFilterOpen = false;
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  applyFilters(filters: SystemParameterFilterFormValue): void {
    this.appliedFilters = filters;
    this.filterChips = SystemParameterFilterChipsUtils.convertFiltersToChips(filters);
    this.updateChipsScrollArrows();

    // Map filter values to request params
    this.requestState.parameterFilter = filters.parameter || undefined;

    if (filters.effectivePeriod === 'After' && filters.effectiveDate) {
      this.requestState.effectiveDateFrom = filters.effectiveDate;
      delete this.requestState.effectiveDateTo;
    } else if (filters.effectivePeriod === 'Before' && filters.effectiveDate) {
      this.requestState.effectiveDateTo = filters.effectiveDate;
      delete this.requestState.effectiveDateFrom;
    } else {
      delete this.requestState.effectiveDateFrom;
      delete this.requestState.effectiveDateTo;
    }

    if (filters.terminationPeriod === 'After' && filters.terminationDate) {
      this.requestState.terminationDateFrom = filters.terminationDate;
      delete this.requestState.terminationDateTo;
    } else if (filters.terminationPeriod === 'Before' && filters.terminationDate) {
      this.requestState.terminationDateTo = filters.terminationDate;
      delete this.requestState.terminationDateFrom;
    } else {
      delete this.requestState.terminationDateFrom;
      delete this.requestState.terminationDateTo;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = SystemParameterFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = SystemParameterFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    switch (chipKey) {
      case 'parameter':
        delete this.requestState.parameterFilter;
        break;
      case 'effectiveDate':
        delete this.requestState.effectiveDateFrom;
        delete this.requestState.effectiveDateTo;
        break;
      case 'terminationDate':
        delete this.requestState.terminationDateFrom;
        delete this.requestState.terminationDateTo;
        break;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    delete this.requestState.parameterFilter;
    delete this.requestState.effectiveDateFrom;
    delete this.requestState.effectiveDateTo;
    delete this.requestState.terminationDateFrom;
    delete this.requestState.terminationDateTo;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  get hasActiveFilters(): boolean {
    return SystemParameterFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  // --- Chips Scroll (copied from Valid ABO) ---

  scrollChips(direction: 'left' | 'right'): void {
    const el = this.chipsScrollRef?.nativeElement;
    if (!el) return;
    const scrollAmount = 150;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }

  onChipsScroll(): void {
    const el = this.chipsScrollRef?.nativeElement;
    if (!el) return;
    this.showLeftArrow = el.scrollLeft > 0;
    this.showRightArrow = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  }

  private updateChipsScrollArrows(): void {
    setTimeout(() => this.onChipsScroll(), 50);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.openAddDialog();
    }
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.toggleFilter();
    }
  }
}
