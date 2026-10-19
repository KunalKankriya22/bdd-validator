import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import {
  Overlay,
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LiveAnnouncer, A11yModule } from '@angular/cdk/a11y';

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
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import { HospitalPatientTestingContractService } from './services/hospital-patient-testing-contract.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { formatTableDate } from '@shared/utils/date-format.util';

import {
  TestingContractTableModel,
  ContractLookup,
  DropdownOption,
  ContractSearchCriteria,
  ContractFilterModel
} from './models/hospital-patient-testing-contract.model';

import { TestingContractFilterPanelComponent } from './filter-panel/testing-contract-filter-panel';
import { ContractDetailComponent } from './contract-detail/contract-detail';
import { AddNewContractWizardComponent } from './add-new-contract-wizard/add-new-contract-wizard';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { TestingContractFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-hospital-patient-testing-contract',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    ContractDetailComponent,
    AddNewContractWizardComponent,
    FilterChips,
    A11yModule
  ],
  templateUrl: './hospital-patient-testing-contract.html',
  styleUrls: ['./hospital-patient-testing-contract.scss']
})
export class HospitalPatientTestingContractComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  private readonly service = inject(HospitalPatientTestingContractService);
  private readonly loggingService = inject(LoggingService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly overlay = inject(Overlay);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroy$ = new Subject<void>();
  private lastFocusedElement: HTMLElement | null = null;
  private viewInitialized = false;

  // View management
  currentView = signal<'list' | 'detail' | 'wizard'>('list');
  selectedContract = signal<TestingContractTableModel | null>(null);

  // Page header
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Search bar form controls
  showTerminatedCtrl = new FormControl<string>('No');
  contractIdControl = new FormControl<string | null>(null);
  companyControl = new FormControl<string | null>(null);
  contractSearchCtrl = new FormControl<string>('');
  companySearchCtrl = new FormControl<string>('');

  // Derived read-only fields
  selectedContractDescription = '';
  selectedContractType = '';

  // Dropdown data
  contracts: ContractLookup[] = [];
  filteredContracts: ContractLookup[] = [];
  companies: DropdownOption[] = [];
  filteredCompanies: DropdownOption[] = [];
  customerTypes: DropdownOption[] = [];

  // Search bar config
  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search',
    minLength: 0,
    ariaLabel: 'Search testing contracts',
    debounceTime: 300,
    searchOnEnterOnly: true
  };
  searchTextValue = '';

  // Table configuration
  tableConfig: DataTableConfig<TestingContractTableModel> = {
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
      column: 'contractId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No contracts available to display',
    loadingMessage: 'Loading contracts...',
    showPagination: true
  };

  // Table data
  dataSource = signal<TestingContractTableModel[]>([]);
  isLoading = signal<boolean>(false);
  hasSearched = signal<boolean>(false);

  // Filter panel state
  isFilterOpen = false;
  appliedFilters: ContractFilterModel | null = null;
  filterChips: FilterChip[] = [];
  private overlayRef: OverlayRef | null = null;

  // Pagination/Sort state
  private pageSize = 25;
  private pageIndex = 0;
  private sortColumn = 'ContractId';
  private sortOrder: 'ASC' | 'DESC' = 'ASC';

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.HospitalPatientTestingContract].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: menuItem?.label || 'Hospital/Patient Testing Contract', link: null }
          ],
          title: menuItem?.label || 'Hospital/Patient Testing Contract',
          subtitle: menuItem?.remarks || menuItem?.subtitle || ''
        };
      }
    });

    effect(() => {
      const view = this.currentView();
      if (!this.viewInitialized) {
        this.viewInitialized = true;
        return;
      }
      const viewLabels: Record<string, string> = {
        'list': 'Contract list',
        'detail': 'Contract detail view',
        'wizard': 'Add new contract form'
      };
      this.liveAnnouncer.announce(viewLabels[view] ?? view, 'polite');
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.subscribeToChapterChanges();
    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private loadDropdowns(): void {
    const showTerminated = this.showTerminatedCtrl?.value === 'Yes';

    this.service.getActiveContracts(showTerminated)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts: ContractLookup[]) => {
          this.contracts = contracts;
          this.filteredContracts = contracts;
        },
        error: (error: Error) => {
          this.loggingService.error('Error loading contracts', error);
          this.snackbarService.showError('Failed to load contracts');
        }
      });

    this.service.getCompanies(showTerminated)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies: DropdownOption[]) => {
          this.companies = companies;
          this.filteredCompanies = [...companies];
        },
        error: (error: Error) => {
          this.loggingService.error('Error loading companies', error);
        }
      });

    this.service.getCustomerTypes(showTerminated)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types: DropdownOption[]) => {
          this.customerTypes = types;
        },
        error: (error: Error) => {
          this.loggingService.error('Error loading customer types', error);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.hasSearched.set(false);
        this.dataSource.set([]);
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.totalRecords = 0;
          this.tableConfig.pagination.pageIndex = 0;
        }
        this.loadDropdowns();
      });
  }

  private setupSearchControls(): void {
    this.contractSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredContracts = this.filterContractList(this.contracts, search);
      });

    this.companySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredCompanies = this.filterCompanyList(this.companies, search);
      });

    // Update read-only fields when contract ID changes
    this.contractIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractId) => {
        if (contractId) {
          const contract = this.contracts.find(c => c.contractId === contractId);
          this.selectedContractDescription = contract?.description || '';
          this.selectedContractType = contract?.contractType || 'TS';
        } else {
          this.selectedContractDescription = '';
          this.selectedContractType = 'TS';
        }
      });
  }

  private filterContractList(contracts: ContractLookup[], search: string | null): ContractLookup[] {
    if (!search) return contracts;
    const term = search.toLowerCase();
    return contracts.filter(c =>
      `${c.contractId} - ${c.description}`.toLowerCase().includes(term)
    );
  }

  private filterCompanyList(companies: DropdownOption[], search: string | null): DropdownOption[] {
    if (!search) return companies;
    const term = search.toLowerCase();
    return companies.filter(c =>
      c.description.toLowerCase().includes(term)
    );
  }

  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================

  private getTableColumns(): TableColumn<TestingContractTableModel>[] {
    return [
      {
        key: 'contractId',
        header: 'Contract ID',
        sortable: true,
        width: '150px'
      },
      {
        key: 'customerType',
        header: 'Customer Type',
        width: '120px'
      },
      {
        key: 'chapterId',
        header: 'Chapter ID',
        width: '100px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '300px'
      },
      {
        key: 'unitScheme',
        header: 'Unit Scheme',
        width: '180px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => formatTableDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '180px',
        valueFormatter: (value) => formatTableDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<TestingContractTableModel>[] {
    return [
      {
        icon: 'visibility',
        label: 'View contract details',
        ariaLabel: 'View contract details',
        action: 'view'
      }
    ];
  }

  // ============================================================================
  // SEARCH BAR ACTIONS
  // ============================================================================

  onRetrieve(): void {
    this.hasSearched.set(true);
    this.pageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onClearAll(): void {
    this.showTerminatedCtrl.setValue('No', { emitEvent: false });
    this.contractIdControl.setValue(null, { emitEvent: false });
    this.companyControl.setValue(null, { emitEvent: false });
    this.contractSearchCtrl.setValue('', { emitEvent: false });
    this.companySearchCtrl.setValue('', { emitEvent: false });
    this.selectedContractDescription = '';
    this.selectedContractType = 'TS';
    this.searchTextValue = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.closeFilterPanel();
  }

  onSearch(searchTerm: string): void {
    this.searchTextValue = searchTerm;
    if (this.hasSearched()) {
      this.pageIndex = 0;
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }
      this.loadData();
    }
  }

  // ============================================================================
  // FILTER PANEL
  // ============================================================================

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

    const portal = new ComponentPortal(TestingContractFilterPanelComponent);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.contracts = this.contracts;
    componentRef.instance.contractTypes = this.customerTypes;
    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: ContractFilterModel) => {
        this.onApplyFilter(filters);
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

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  onApplyFilter(filters: ContractFilterModel): void {
    this.appliedFilters = filters;
    this.filterChips = TestingContractFilterChipsUtils.convertFiltersToChips(
      filters,
      this.contracts,
      this.customerTypes
    );
    this.pageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return TestingContractFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = TestingContractFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = TestingContractFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters,
      this.contracts,
      this.customerTypes
    );
    this.pageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  // ============================================================================
  // VIEW SWITCHING
  // ============================================================================

  onAddNewContract(): void {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.currentView.set('wizard');
  }

  onViewContract(row: TestingContractTableModel): void {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.selectedContract.set(row);
    this.currentView.set('detail');
  }

  onBackToList(): void {
    this.currentView.set('list');
    this.selectedContract.set(null);
    if (this.hasSearched()) {
      this.loadData();
    }
    setTimeout(() => {
      this.lastFocusedElement?.focus();
      this.lastFocusedElement = null;
    }, 0);
  }

  onContractCreated(): void {
    this.snackbarService.showSuccess('Testing contract created successfully');
    this.currentView.set('list');
    this.onRetrieve();
  }

  onContractUpdated(): void {
    this.snackbarService.showSuccess('Testing contract updated successfully');
    // Reload the detail view with fresh data
    const current = this.selectedContract();
    if (current) {
      this.loadData();
    }
  }

  // ============================================================================
  // TABLE EVENTS
  // ============================================================================

  onPageChange(event: TablePageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.sortColumn = event.column.charAt(0).toUpperCase() + event.column.slice(1);
    this.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<TestingContractTableModel>): void {
    if (event.action === 'view') {
      this.onViewContract(event.row);
    }
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  private loadData(): void {
    this.isLoading.set(true);

    const criteria: ContractSearchCriteria = {
      showTerminated: this.showTerminatedCtrl.value === 'Yes',
      contractId: this.contractIdControl.value || null,
      company: this.companyControl.value || null,
      searchKeyword: this.searchTextValue || undefined,
      sortColumn: this.sortColumn,
      sortOrder: this.sortOrder
    };

    const take = this.pageSize;
    const skip = this.pageIndex * this.pageSize;

    this.service.searchContracts(take, skip, criteria, this.appliedFilters || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.set(response.data || []);
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total || 0;
          }
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading contracts', error);
          this.snackbarService.showError('Failed to load contracts. Please try again.');
          this.isLoading.set(false);
        }
      });
  }
}
