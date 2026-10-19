import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  effect,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
  TablePageEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChip, FilterChips } from '@shared/components/filter-chips/filter-chips';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ApiService } from '@shared/services/api.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { API } from '@core/constants/api.constants';

import { ValidRemoteTestingLabsApiService } from './services/valid-remote-testing-labs-api.service';
import {
  ValidRemoteTestingLabDto,
  ValidRemoteTestingLabQueryDto,
  ValidRemoteTestingLabFilterValue,
} from './models/valid-remote-testing-labs.model';
import { ValidRemoteTestingLabsFilterPanel } from './valid-remote-testing-labs-filter-panel/valid-remote-testing-labs-filter-panel';
import { ValidRemoteTestingLabsFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-valid-remote-testing-labs',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
  ],
  templateUrl: './valid-remote-testing-labs.component.html',
  styleUrls: ['./valid-remote-testing-labs.component.scss'],
})
export class ValidRemoteTestingLabsComponent implements OnInit, OnDestroy {
  private readonly service = inject(ValidRemoteTestingLabsApiService);
  private readonly apiService = inject(ApiService);
  private readonly overlay = inject(Overlay);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    actions: [
      {
        label: 'ADD NEW FACILITY',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new facility',
        onClick: () => this.openAddDialog(),
      },
    ],
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Test Lab ID and Name',
    minLength: 3,
    ariaLabel: 'Search by Test Lab ID and Name',
    searchOnEnterOnly: true,
  };

  tableConfig: DataTableConfig<ValidRemoteTestingLabDto> = {
    columns: this.getTableColumns(),
    rowActions: this.getRowActions(),
    sortConfig: {
      column: 'testingLabId',
      direction: 'default',  // Start with default (no sorting applied)
    },
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No testing facilities available to display',
    noDataIcon: 'edit',
    showTableOnEmpty: true,
  };

  dataSource: ValidRemoteTestingLabDto[] = [];
  searchText = '';


  isLoading = false;
  hasError = false;
  errorMessage = '';

  isFilterPanelOpen = false;
  filterOverlayRef: OverlayRef | null = null;
  appliedFilters: ValidRemoteTestingLabFilterValue | null = null;
  filterChips: FilterChip[] = [];
  private overlayClose$ = new Subject<void>();

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath =
          ROUTE_REGISTRY[RouteKey.ValidRemoteTestingLabs]?.path;
        if (basePath) {
          const menuItem = this.menuService.findMenuItemByPath(basePath);
          if (menuItem) {
            this.headerConfig = {
              ...this.headerConfig,
              breadcrumbs: [
                { label: 'Home', link: '/home' },
                { label: menuItem.label, link: null },
              ],
              title: menuItem.label,
              subtitle:
                menuItem.remarks ||
                menuItem.subtitle ||
                'Define and maintain testing facilities where samples may be sent.',
            };
          }
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadTableData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private getTableColumns(): TableColumn<ValidRemoteTestingLabDto>[] {
    return [
      {
        key: 'testingLabId',
        header: 'Test Lab ID',
        sortable: true,
        width: '120px',
      },
      {
        key: 'chapterId',
        header: 'Chapter ID',
        sortable: false,
        width: '100px',
      },
      {
        key: 'testingLabName',
        header: 'Name',
        sortable: false,
        width: '380px',
      },
      {
        key: 'contractId',
        header: 'Contract Code',
        sortable: false,
        width: '120px',
      },
      {
        key: 'cliaNumber',
        header: 'CLIA Number',
        sortable: false,
        width: '120px',
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '130px',
        valueFormatter: (value: string) => this.formatDate(value),
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '130px',
        valueFormatter: (value: string) => this.formatDate(value),
      },
    ];
  }

  private getRowActions(): RowAction<ValidRemoteTestingLabDto>[] {
    return [
      {
        icon: 'edit',
        label: '',
        ariaLabel: 'Edit facility {{testingLabId}}',
        action: 'edit',
      },
    ];
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTableData();
      });
  }


  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const queryDto: ValidRemoteTestingLabQueryDto = {};

    if (this.searchText) {
      queryDto.searchKeyword = this.searchText;
    }

    if (this.appliedFilters) {
      if (this.appliedFilters.effectiveDatePeriod && this.appliedFilters.effectiveDate) {
        if (this.appliedFilters.effectiveDatePeriod.toUpperCase() === 'AFTER') {
          queryDto.effDateFrom = this.appliedFilters.effectiveDate;
        } else {
          queryDto.effDateTo = this.appliedFilters.effectiveDate;
        }
      }
      if (this.appliedFilters.terminationDatePeriod && this.appliedFilters.terminationDate) {
        if (this.appliedFilters.terminationDatePeriod.toUpperCase() === 'AFTER') {
          queryDto.termDateFrom = this.appliedFilters.terminationDate;
        } else {
          queryDto.termDateTo = this.appliedFilters.terminationDate;
        }
      }
    }

    // Handle sorting: 'default' means use backend's default sort (no sortColumn/sortOrder sent)
    const sortDirection = this.tableConfig.sortConfig?.direction || 'default';
    if (sortDirection !== 'default') {
      queryDto.sortColumn = this.tableConfig.sortConfig?.column || 'testingLabId';
      queryDto.sortOrder = sortDirection;
    }

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);
    const take = this.tableConfig.pagination?.pageSize || 25;

    this.service
      .getAll(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalCount;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.updateEmptyMessage();
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
    if (!this.tableConfig.sortConfig) return;

    // Implement custom sort cycle: default → A → D → default → A → D → ...
    let newDirection: 'A' | 'D' | 'default';

    if (this.tableConfig.sortConfig.column !== event.column) {
      // Different column clicked - start with ascending
      newDirection = 'A';
    } else {
      // Same column - cycle through: A → D → default → A
      switch (this.tableConfig.sortConfig.direction) {
        case 'default':
          newDirection = 'A';
          break;
        case 'A':
          newDirection = 'D';
          break;
        case 'D':
          newDirection = 'default';
          break;
        default:
          newDirection = 'A';
      }
    }

    this.tableConfig.sortConfig.column = event.column;
    this.tableConfig.sortConfig.direction = newDirection;
    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<ValidRemoteTestingLabDto>): void {
    if (event.action === 'edit') {
      this.router.navigate([
        '/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs/edit',
        event.row.testingLabId
      ]);
    }
  }

  openFilterPanel(): void {
    if (this.isFilterPanelOpen || !this.filterButtonRef) return;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterButtonRef)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 4,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetX: 0,
          offsetY: -4,
        },
      ])
      .withFlexibleDimensions(true)
      .withPush(true);

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: 350,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const filterPortal = new ComponentPortal(
      ValidRemoteTestingLabsFilterPanel
    );
    const componentRef = this.filterOverlayRef.attach(filterPortal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe((filters) => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.filterOverlayRef
      .backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.isFilterPanelOpen = true;
  }

  private closeFilterPanel(): void {
    this.overlayClose$.next();
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
    this.isFilterPanelOpen = false;
    if (this.filterButtonRef?.nativeElement) {
      this.filterButtonRef.nativeElement.blur();
    }
  }

  applyFilters(filters: ValidRemoteTestingLabFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips =
      ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(filters);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.updateEmptyMessage();
    this.loadTableData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters =
      ValidRemoteTestingLabsFilterChipsUtils.removeFilterByChipKey(
        this.appliedFilters,
        chipKey
      );
    this.filterChips =
      ValidRemoteTestingLabsFilterChipsUtils.convertFiltersToChips(
        this.appliedFilters
      );
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.updateEmptyMessage();
    this.loadTableData();
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.updateEmptyMessage();
    this.loadTableData();
  }

  openAddDialog(): void {
    this.router.navigate([
      '/laboratory-functions/testing-modules/testing-administration/valid-remote-testing-labs/add'
    ]);
  }


  private formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  private updateEmptyMessage(): void {
    // Always use the edit icon regardless of search/filter state
    this.tableConfig.noDataIcon = 'edit';
  }
}
