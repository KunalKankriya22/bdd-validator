import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import moment from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerProfileApiService } from '../services/customer-profile-api.service';
import { CustomerProfileListStateService, CustomerProfileListSavedState } from '../services/customer-profile-list-state.service';
import {
  CustomerProfileDto,
  CustomerProfileQueryDto
} from '../models/customer-profile.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { CustomerProfileFilterPanelComponent } from '../customer-profile-filter-panel/customer-profile-filter-panel';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

export interface CustomerProfileFilterValue {
  customerType?: string;
  effDateAfter?: string;
  effDateBefore?: string;
  termDateAfter?: string;
  termDateBefore?: string;
}

@Component({
  selector: 'app-customer-profile-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    SearchBar,
    LoadingSpinnerComponent
  ],
  templateUrl: './customer-profile-list.html',
  styleUrls: ['./customer-profile-list.scss']
})
export class CustomerProfileListComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly apiService = inject(CustomerProfileApiService);
  private readonly overlay = inject(Overlay);
  private readonly listStateService = inject(CustomerProfileListStateService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Manage Customer Details', link: '' },
    ],
    actions: [{
      label: 'ADD NEW CUSTOMER',
      icon: 'add',
      color: 'accent',
      ariaLabel: 'Add new customer',
      onClick: () => this.openAddCustomer()
    }]
  };

  showTerminatedControl = new FormControl('N');
  hasSearched = signal<boolean>(false);

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Customer ID or Name',
    minLength: 2,
    ariaLabel: 'Search by Customer ID or Name',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  tableConfig: DataTableConfig<CustomerProfileDto> = {
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
      column: 'customerId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: 'No Results to Display',
    loadingMessage: 'Loading customer profiles...',
    showPagination: true
  };

  dataSource = signal<CustomerProfileDto[]>([]);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  appliedFilters: CustomerProfileFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;
  private overlayRef: OverlayRef | null = null;

  private pageSize = 10;
  private pageIndex = 0;
  private sortColumn = 'customerId';
  private sortOrder = 'ASC';
  private searchKeyword = '';
  searchTextValue = '';

  private isRestoring = false;

  ngOnInit(): void {
    const restored = this.listStateService.restore();
    if (restored) {
      this.restoreState(restored);
    } else {
      this.hasSearched.set(true);
      this.loadCustomerProfiles();
    }
    this.subscribeToChapterChanges();
    this.setupShowTerminatedListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private getTableColumns(): TableColumn<CustomerProfileDto>[] {
    return [
      {
        key: 'customerId',
        header: 'Customer ID',
        sortable: true,
        width: '140px',
        cellClass: 'font-medium'
      },
      {
        key: 'name',
        header: 'Name',
        sortable: false,
        width: 'auto',
        cellClass: 'text-truncate'
      },
      {
        key: 'customerType',
        header: 'Type',
        sortable: false,
        width: '160px',
        valueFormatter: (_value: any, row: any) =>
          row.customerTypeDescription
            ? `${row.customerType} - ${row.customerTypeDescription}`
            : row.customerType
      },
      {
        key: 'city',
        header: 'City',
        sortable: false,
        width: '150px'
      },
      {
        key: 'consigneeCount',
        header: 'Consignees',
        sortable: false,
        width: '110px',
        valueFormatter: (_value, row) => String(row.consigneeCount ?? 0)
      },
      {
        key: 'contactCount',
        header: 'Contacts',
        sortable: false,
        width: '100px',
        valueFormatter: (_value, row) => String(row.contactCount ?? 0)
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '140px',
        valueFormatter: (_value, row) => this.formatDate(row.effDate)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        valueFormatter: (_value, row) => row.termDate ? this.formatDate(row.termDate) : ''
      }
    ];
  }

  private getRowActions(): RowAction<CustomerProfileDto>[] {
    return [
      {
        icon: 'visibility',
        label: 'View Details',
        ariaLabel: 'View customer profile details',
        action: 'view'
      }
    ];
  }

  onSearch(searchTerm: string): void {
    this.searchKeyword = searchTerm || '';
    this.searchTextValue = this.searchKeyword;
    if (this.hasSearched()) {
      this.pageIndex = 0;
      this.tableConfig.pagination!.pageIndex = 0;
      this.loadCustomerProfiles();
    }
  }

  private setupShowTerminatedListener(): void {
    this.showTerminatedControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (this.isRestoring) return;
        if (value) {
          this.hasSearched.set(true);
          this.pageIndex = 0;
          this.tableConfig.pagination!.pageIndex = 0;
          this.clearFilters();
          this.searchKeyword = '';
          this.searchTextValue = '';
          this.loadCustomerProfiles();
        }
      });
  }

  clearShowTerminated(): void {
    this.showTerminatedControl.setValue('');
    this.hasSearched.set(false);
    this.dataSource.set([]);
    this.hasError.set(false);
    this.appliedFilters = null;
    this.filterChips = [];
    this.searchKeyword = '';
    this.searchTextValue = '';
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.listStateService.clear();
        this.clearShowTerminated();
      });
  }

  private showErrorAndAutoDismiss(message: string): void {
    this.snackbarService.showError(message);
    setTimeout(() => this.snackBar.dismiss(), 5000);
  }

  private loadCustomerProfiles(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const query: CustomerProfileQueryDto = {
      searchKeyword: this.searchKeyword || undefined,
      includeTerminated: this.showTerminatedControl.value === 'Y',
      sortColumn: this.sortColumn.charAt(0).toUpperCase() + this.sortColumn.slice(1),
      sortOrder: this.sortOrder,
      ...this.appliedFilters
    };

    this.apiService.getCustomerProfiles(this.pageSize, this.pageIndex * this.pageSize, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.set(response.data || []);
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalCount || response.total || 0;
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.hasError.set(true);
          this.errorMessage.set(error?.error?.message || 'Failed to load customer profiles');
          this.showErrorAndAutoDismiss(this.errorMessage());
          this.isLoading.set(false);
        }
      });
  }

  onPageChange(event: TablePageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadCustomerProfiles();
  }

  onSortChange(event: TableSortEvent): void {
    this.sortColumn = event.column;
    this.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    this.loadCustomerProfiles();
  }

  onRowAction(event: TableRowActionEvent<CustomerProfileDto>): void {
    if (event.action === 'view') {
      this.viewCustomerProfile(event.row);
    }
  }

  openAddCustomer(): void {
    this.saveState();
    this.router.navigate([ROUTE_REGISTRY[RouteKey.AddCustomerProfile].path]);
  }

  private viewCustomerProfile(customer: CustomerProfileDto): void {
    this.saveState();
    const basePath = ROUTE_REGISTRY[RouteKey.CustomerProfileDetails].path.replace('/:customerId', '');
    this.router.navigate([basePath, customer.customerId]);
  }

  private saveState(): void {
    this.listStateService.save({
      showTerminated: this.showTerminatedControl.value || '',
      dataSource: this.dataSource(),
      totalRecords: this.tableConfig.pagination?.totalRecords || 0,
      searchKeyword: this.searchKeyword,
      pageSize: this.pageSize,
      pageIndex: this.pageIndex,
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder,
      appliedFilters: this.appliedFilters,
      filterChips: [...this.filterChips],
      hasSearched: this.hasSearched(),
    });
  }

  private restoreState(state: CustomerProfileListSavedState): void {
    this.isRestoring = true;
    this.showTerminatedControl.setValue(state.showTerminated, { emitEvent: false });
    this.hasSearched.set(state.hasSearched);
    this.searchKeyword = state.searchKeyword;
    this.searchTextValue = state.searchKeyword;
    this.pageSize = state.pageSize;
    this.pageIndex = state.pageIndex;
    this.sortColumn = state.sortColumn;
    this.sortOrder = state.sortOrder;
    this.appliedFilters = state.appliedFilters;
    this.filterChips = state.filterChips;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageSize = state.pageSize;
      this.tableConfig.pagination.pageIndex = state.pageIndex;
      this.tableConfig.pagination.totalRecords = state.totalRecords;
    }
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: state.sortColumn, direction: state.sortOrder === 'ASC' ? 'A' : 'D' },
    };
    this.isRestoring = false;
    if (state.hasSearched) {
      this.loadCustomerProfiles();
    }
  }

  openFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
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

    const portal = new ComponentPortal(CustomerProfileFilterPanelComponent);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: CustomerProfileFilterValue) => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  applyFilters(filters: CustomerProfileFilterValue): void {
    this.appliedFilters = filters;
    this.pageIndex = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.updateFilterChips();
    this.loadCustomerProfiles();
  }

  clearFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadCustomerProfiles();
  }

  removeFilterChip(key: string): void {
    if (!this.appliedFilters) return;

    const updatedFilters = { ...this.appliedFilters };
    delete (updatedFilters as Record<string, unknown>)[key];

    if (Object.keys(updatedFilters).length === 0) {
      this.clearFilters();
    } else {
      this.applyFilters(updatedFilters);
    }
  }

  private updateFilterChips(): void {
    this.filterChips = [];
    if (!this.appliedFilters) return;

    if (this.appliedFilters.customerType) {
      this.filterChips.push({
        key: 'customerType',
        label: `Type: ${this.appliedFilters.customerType}`,
        value: this.appliedFilters.customerType
      });
    }

    if (this.appliedFilters.effDateAfter) {
      this.filterChips.push({
        key: 'effDateAfter',
        label: `Effective Date ≥ ${this.formatDate(this.appliedFilters.effDateAfter)}`,
        value: this.appliedFilters.effDateAfter
      });
    }

    if (this.appliedFilters.effDateBefore) {
      this.filterChips.push({
        key: 'effDateBefore',
        label: `Effective Date ≤ ${this.formatDate(this.appliedFilters.effDateBefore)}`,
        value: this.appliedFilters.effDateBefore
      });
    }

    if (this.appliedFilters.termDateBefore) {
      this.filterChips.push({
        key: 'termDateBefore',
        label: `Termination Date ≤ ${this.formatDate(this.appliedFilters.termDateBefore)}`,
        value: this.appliedFilters.termDateBefore
      });
    }

    if (this.appliedFilters.termDateAfter) {
      this.filterChips.push({
        key: 'termDateAfter',
        label: `Termination Date ≥ ${this.formatDate(this.appliedFilters.termDateAfter)}`,
        value: this.appliedFilters.termDateAfter
      });
    }
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  retryLoad(): void {
    this.loadCustomerProfiles();
  }
}
