import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { formatTableDate } from '@shared/utils/date-format.util';

import {
  FilterCriteria,
  SHOW_TERMINATED_OPTIONS,
  ContractDto,
  ContractQueryDto
} from './models/regional-testing-contract.model';
import { FiltersDialogComponent } from './components/filters-dialog/filters-dialog';
import { RegionalTestingContractApiService } from './services/regional-testing-contract-api.service';

interface ContractTableRow {
  contractId: string;
  facilityName: string;
  clientChapter: string;
  effectiveDate: string;
  terminationDate: string;
}

@Component({
  selector: 'app-enter-regional-testing-contract',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar
  ],
  templateUrl: './rgcon.html',
  styleUrl: './rgcon.scss'
})
export class EnterRegionalTestingContractComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  private readonly menuService = inject(MenuService);
  private readonly headerService = inject(HeaderService);
  private readonly overlay = inject(Overlay);
  private readonly router = inject(Router);
  private readonly apiService = inject(RegionalTestingContractApiService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'ADD NEW CONTRACT ID',
        icon: 'add',
        matButton: 'raised',
        color: 'primary',
        onClick: this.openContractDetailsPage.bind(this)
      }
    ]
  };

  showTerminatedCtrl = new FormControl<string>('No'); // Default to "No" - show non-terminated contracts
  protected readonly showTerminatedOptions = SHOW_TERMINATED_OPTIONS;

  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by contract ID or facility name',
    minLength: 0,
    ariaLabel: 'Search contracts',
    debounceTime: 300,
    searchOnEnterOnly: true
  };
  searchTextValue = '';

  tableConfig: DataTableConfig<ContractTableRow> = {
    columns: this.getTableColumns(),
    rowActions: [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit',
        action: 'edit',
        ariaLabel: 'Edit contract'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'contractId',
      direction: 'A'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showPagination: true,
    emptyMessage: 'No contracts found',
    loadingMessage: 'Loading contracts...'
  };

  dataSource = signal<ContractTableRow[]>([]);
  isLoading = signal<boolean>(false);

  isFilterOpen = false;
  private overlayRef: OverlayRef | null = null;
  protected filterCriteria = signal<FilterCriteria | null>(null);
  private searchTerm = '';
  private sortColumn = 'contractId';
  private sortDirection: 'A' | 'D' | 'default' = 'A';

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.EnterRegionalTestingContract].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || 'Create and modify a contract and associate single/multiple testing profiles',
            actions: [
              {
                label: 'ADD NEW CONTRACT ID',
                icon: 'add',
                matButton: 'raised',
                color: 'primary',
                onClick: this.openContractDetailsPage.bind(this)
              }
            ]
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.subscribeToShowTerminatedChanges();
    this.loadContracts(); // Load with default "No" selection
  }

  private loadContracts(): void {
    this.applyFiltersAndPaginate();
  }

  private subscribeToShowTerminatedChanges(): void {
    this.showTerminatedCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.loadContracts();
      });
  }

  ngOnDestroy(): void {
    this.closeFilterPanel();
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasActiveFilters(): boolean {
    return this.filterCriteria() !== null;
  }

  onFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top'
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(FiltersDialogComponent);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.filterCriteria();

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((criteria: FilterCriteria) => {
        this.filterCriteria.set(criteria);
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.loadContracts();
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());
  }

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  onClear(): void {
    this.showTerminatedCtrl.setValue('No'); // Reset to default "No"
    this.filterCriteria.set(null);
    this.searchTextValue = '';
    this.searchTerm = '';
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.closeFilterPanel();
    this.loadContracts();
  }

  removeFilter(filterKey: 'clientChapter' | 'effectiveDate' | 'terminationDate'): void {
    const current = this.filterCriteria();
    if (!current) return;

    const updated: FilterCriteria = { ...current };

    if (filterKey === 'clientChapter') {
      delete updated.clientChapter;
    } else if (filterKey === 'effectiveDate') {
      delete updated.effectiveDate;
      delete updated.effectiveDatePeriod;
    } else if (filterKey === 'terminationDate') {
      delete updated.terminationDate;
      delete updated.terminationDatePeriod;
    }

    // If no filters remain, clear all
    if (!updated.clientChapter && !updated.effectiveDate && !updated.terminationDate) {
      this.filterCriteria.set(null);
    } else {
      this.filterCriteria.set(updated);
    }

    // Reset pagination and reload
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadContracts();
  }

  formatFilterDate(date: Date | undefined | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  openContractDetailsPage(contractId?: string): void {
    if (contractId) {
      this.router.navigate(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract/edit', contractId]);
    } else {
      this.router.navigate(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract/add']);
    }
  }

  onSearch(searchText: string): void {
    this.searchTextValue = searchText;
    this.searchTerm = searchText.trim().toLowerCase();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadContracts();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      // Create new tableConfig object to ensure change detection
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination,
          pageIndex: event.pageIndex,
          pageSize: event.pageSize
        }
      };
    }
    this.loadContracts();
  }

  onSortChange(event: TableSortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
    this.loadContracts();
  }

  onRowAction(event: TableRowActionEvent<ContractTableRow>): void {
    if (event.action === 'edit') {
      this.openContractDetailsPage(event.row.contractId);
    }
  }

  private applyFiltersAndPaginate(): void {
    this.isLoading.set(true);

    const pageSize = this.tableConfig.pagination?.pageSize || 25;
    const pageIndex = this.tableConfig.pagination?.pageIndex || 0;

    // Build query DTO based on current filters
    const query: ContractQueryDto = {
      showTerminated: this.showTerminatedCtrl.value === 'Yes',
      searchKeyword: this.searchTerm || undefined,
      sortColumn: this.sortColumn && this.sortDirection !== 'default'
        ? this.mapSortColumnToApi(this.sortColumn)
        : undefined,
      sortOrder: this.sortDirection !== 'default'
        ? (this.sortDirection === 'A' ? 'ASC' : 'DESC')
        : undefined
    };

    // Add filter criteria if present
    const criteria = this.filterCriteria();
    if (criteria) {
      if (criteria.clientChapter) {
        query.chapterId = criteria.clientChapter; // Filter by chapter ID
      }
      if (criteria.effectiveDate) {
        const dateStr = this.formatDateForApi(criteria.effectiveDate);
        if (criteria.effectiveDatePeriod === 'After') {
          query.effDateFrom = dateStr;
        } else if (criteria.effectiveDatePeriod === 'Before') {
          query.effDateTo = dateStr;
        }
      }
    }

    // Call API with pagination
    const skip = pageIndex * pageSize;
    this.apiService.getAllContracts(pageSize, skip, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Map API response to table rows
          const tableRows: ContractTableRow[] = response.data.map(contract => ({
            contractId: contract.contractId,
            facilityName: contract.customerName,
            clientChapter: this.extractClientChapters(contract),
            effectiveDate: contract.effDate,
            terminationDate: contract.termDate || ''
          }));

          this.dataSource.set(tableRows);

          // Update table config with new pagination data
          // Create a completely new object to trigger change detection
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              pageSize: pageSize,
              pageIndex: pageIndex,
              totalRecords: response.total,
              pageSizeOptions: [10, 25, 50, 100],
              showFirstLastButtons: true
            },
            sortConfig: {
              column: this.sortColumn,
              direction: this.sortDirection
            }
          };

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading contracts:', error);
          this.dataSource.set([]);
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: 0,
              pageIndex: pageIndex,
              pageSize: pageSize
            }
          };
          this.isLoading.set(false);
          // TODO: Add error notification to user
        }
      });
  }

  /**
   * Extract client chapters from contract (could be from chapters array or chapterId)
   */
  private extractClientChapters(contract: ContractDto): string {
    if (contract.chapters && contract.chapters.length > 0) {
      return contract.chapters.map(c => c.chapterId).join(', ');
    }
    return contract.chapterId || '';
  }

  /**
   * Map UI sort column names to API column names
   */
  private mapSortColumnToApi(column: string): string {
    const columnMap: Record<string, string> = {
      'contractId': 'CONTRACT_ID',
      'facilityName': 'CUSTOMER_NAME',
      'clientChapter': 'CHAPTER_ID',
      'effectiveDate': 'EFF_DATE',
      'terminationDate': 'TERM_DATE'
    };
    return columnMap[column] || column.toUpperCase();
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear(); // This will reset to "No" and reload data
      });
  }

  private getTableColumns(): TableColumn<ContractTableRow>[] {
    return [
      {
        key: 'contractId',
        header: 'Contract ID',
        sortable: true,
        width: '160px'
      },
      {
        key: 'facilityName',
        header: 'Facility Name',
        sortable: false
      },
      {
        key: 'clientChapter',
        header: 'Client Chapter',
        sortable: false,
        width: '150px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '160px',
        valueFormatter: (value: string) => formatTableDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '170px',
        valueFormatter: (value: string) => formatTableDate(value)
      }
    ];
  }
}
