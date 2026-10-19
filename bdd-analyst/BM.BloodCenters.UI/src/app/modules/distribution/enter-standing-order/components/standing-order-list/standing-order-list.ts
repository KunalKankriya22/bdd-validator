import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  StandingOrderListDto,
  StandingOrderQueryDto,
  LovOption,
  ContractOption,
  getWeekDayDisplay,
  getTimeDisplay,
  getYesNoDisplay
} from '../../models/standing-order.model';
import { StandingOrderService } from '../../services/standing-order.service';
import { StandingOrderStateService } from '../../services/standing-order-state.service';
import { StandingOrderSidePanelComponent } from '../standing-order-side-panel/standing-order-side-panel';

@Component({
  selector: 'app-standing-order-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    StandingOrderSidePanelComponent
  ],
  templateUrl: './standing-order-list.html',
  styleUrl: './standing-order-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandingOrderListComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `standing-order-list-${StandingOrderListComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly standingOrderService = inject(StandingOrderService);
  private readonly stateService = inject(StandingOrderStateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // State signals
  protected readonly loading = signal(false);
  protected readonly totalCount = signal(0);
  protected readonly dataSource = signal<StandingOrderListDto[]>([]);

  // Dropdown data
  protected readonly customerTypes = signal<LovOption[]>([]);
  protected readonly contracts = signal<ContractOption[]>([]);
  protected readonly consignees = signal<LovOption[]>([]);

  // Search controls for ngx-mat-select-search
  customerTypeSearchCtrl = new FormControl('');
  contractSearchCtrl = new FormControl('');
  consigneeSearchCtrl = new FormControl('');
  private customerTypeSearch = signal('');
  private contractSearch = signal('');
  private consigneeSearch = signal('');

  readonly filteredCustomerTypes = computed(() => {
    const s = this.customerTypeSearch().toLowerCase();
    return !s ? this.customerTypes() : this.customerTypes().filter(o =>
      o.code.toLowerCase().includes(s) || o.description.toLowerCase().includes(s));
  });
  readonly filteredContracts = computed(() => {
    const s = this.contractSearch().toLowerCase();
    return !s ? this.contracts() : this.contracts().filter(o =>
      o.code.toLowerCase().includes(s) || o.description.toLowerCase().includes(s));
  });
  readonly filteredConsignees = computed(() => {
    const s = this.consigneeSearch().toLowerCase();
    return !s ? this.consignees() : this.consignees().filter(o =>
      o.code.toLowerCase().includes(s));
  });

  // Track filter readiness for ADD button reactivity
  private readonly filtersReady = signal(false);

  // Side panel state
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: StandingOrderListDto | null = null;

  // Pagination & sorting
  private currentPageIndex = 0;
  private currentPageSize = 25;
  private sortColumn = '';
  private sortDirection = 'ASC';

  // Filter form
  filterForm!: FormGroup;

  // Page header config
  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || 'Enter Standing Order', link: null }
      ],
      title: pageData?.title || 'Enter Standing Order',
      subtitle: pageData?.subtitle || '',
      actions: [{
        label: 'ADD NEW DAY',
        icon: 'add',
        color: 'primary',
        onClick: () => this.openAddPanel(),
        disabled: !this.filtersReady(),
      }],
    };
  });

  // Data table config
  tableConfig: DataTableConfig<StandingOrderListDto> = {
    columns: [
      { key: 'weekDayDisplay', header: 'Day of the week', sortable: false,width: '150px' },
      { key: 'confirmation', header: 'Confirmation', sortable: false,width: '120px' },
      { key: 'timeRequired', header: 'Time Required', sortable: false,width: '130px' },
      { key: 'effectiveDate', header: 'Effective Date', sortable: false,width: '140px' },
      {
        key: 'terminationDate', header: 'Termination Date', sortable: false,width: '150px',
        valueFormatter: (value) => value || '--',
      },
      {
        key: 'modificationDate', header: 'Modification Date', sortable: false,width: '180px',
        valueFormatter: (value) => value || '--',
      },
    ],
    rowActions: [
      { icon: 'edit', action: 'edit', ariaLabel: 'Edit standing order' },
      { icon: 'visibility', action: 'view', ariaLabel: 'View items' },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: { column: '', direction: 'default' },
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Scan or enter a Unit ID to begin,',
    noDataIcon: 'search',
    loadingMessage: 'Loading standing orders...',
    showPagination: true,
  };

  ngOnInit(): void {
    this.initFilterForm();
    this.loadCustomerTypes();
    this.setupSearchControls();
    this.subscribeToChapterChanges();
    this.restoreState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      customerType: [null],
      contractId: [null],
      consigneeId: [null]
    });

    this.filterForm.get('customerType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.patchValue({ contractId: null, consigneeId: null });
        this.contracts.set([]);
        this.consignees.set([]);
        this.loadContracts();
      });

    this.filterForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.patchValue({ consigneeId: null });
        this.consignees.set([]);
        this.filtersReady.set(false);
        this.loadConsignees();
      });

    this.filterForm.get('consigneeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.filtersReady.set(!!this.filterForm.get('contractId')?.value && !!val);
      });
  }

  private setupSearchControls(): void {
    this.customerTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.customerTypeSearch.set(v || ''));
    this.contractSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.contractSearch.set(v || ''));
    this.consigneeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.consigneeSearch.set(v || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dataSource.set([]);
        this.totalCount.set(0);
        this.currentPageIndex = 0;
        this.filterForm.reset();
        this.contracts.set([]);
        this.consignees.set([]);
        this.closeSidePanel();
        this.loadCustomerTypes();
      });
  }

  private loadCustomerTypes(): void {
    this.standingOrderService.getCustomerTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.customerTypes.set(data),
        error: () => this.snackbarService.showError('Failed to load customer types')
      });
  }

  private loadContracts(): void {
    const customerType = this.filterForm.get('customerType')?.value;
    if (!customerType) { this.contracts.set([]); return; }

    this.standingOrderService.getCustomers(customerType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.contracts.set(data),
        error: () => this.snackbarService.showError('Failed to load contracts')
      });
  }

  private loadConsignees(): void {
    const contractId = this.filterForm.get('contractId')?.value;
    if (!contractId) { this.consignees.set([]); return; }

    const contract = this.contracts().find(c => c.code === contractId);
    const customerId = contract?.customerId;
    if (!customerId) { this.consignees.set([]); return; }

    this.standingOrderService.getConsignees(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.consignees.set(data),
        error: () => this.snackbarService.showError('Failed to load consignees')
      });
  }

  get contractNameDisplay(): string {
    const contractId = this.filterForm.get('contractId')?.value;
    if (!contractId) return '--';
    const contract = this.contracts().find(c => c.code === contractId);
    return contract?.description || '--';
  }

  // --- Data Loading ---

  onRetrieve(): void {
    const filters = this.filterForm.value;
    if (!filters.contractId || !filters.consigneeId) {
      this.snackbarService.showError('Please select Contract ID and Consignee');
      return;
    }
    this.currentPageIndex = 0;
    this.loadData();
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.dataSource.set([]);
    this.totalCount.set(0);
    this.filtersReady.set(false);
    this.currentPageIndex = 0;
    this.closeSidePanel();
  }

  private loadData(): void {
    const filters = this.filterForm.value;
    if (!filters.contractId || !filters.consigneeId) return;

    this.loading.set(true);

    const queryDto: StandingOrderQueryDto = {
      contractId: filters.contractId,
      consigneeId: filters.consigneeId,
      sortColumn: this.sortColumn || 'WeekDay',
      sortOrder: this.sortDirection
    };

    const take = this.currentPageSize;
    const skip = this.currentPageIndex * this.currentPageSize;

    this.standingOrderService.getStandingOrders(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.dataSource.set(result.data);
          this.totalCount.set(result.totalRecords);
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: result.totalRecords,
              pageIndex: this.currentPageIndex,
              pageSize: this.currentPageSize
            }
          };
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
          this.snackbarService.showError('Failed to load standing orders. Please try again.');
        }
      });
  }

  // --- Table Events ---

  onPageChange(event: TablePageEvent): void {
    this.currentPageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (event.direction === 'default') {
      this.sortColumn = '';
      this.sortDirection = 'ASC';
    } else {
      this.sortColumn = event.column;
      this.sortDirection = event.direction === 'A' ? 'ASC' : 'DESC';
    }
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<StandingOrderListDto>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    } else if (event.action === 'view') {
      this.onViewItems(event.row);
    }
  }

  // --- Side Panel ---

  openAddPanel(): void {
    const filters = this.filterForm.value;
    if (!filters.contractId || !filters.consigneeId) {
      this.snackbarService.showError('Please select Contract ID and Consignee first');
      return;
    }
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    setTimeout(() => {
      const heading = document.querySelector<HTMLElement>('.side-panel-container h2');
      heading?.focus();
    }, 50);
  }

  openEditPanel(order: StandingOrderListDto): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = order;
    this.sidePanelOpen = true;
    setTimeout(() => {
      const heading = document.querySelector<HTMLElement>('.side-panel-container h2');
      heading?.focus();
    }, 50);
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(message: string): void {
    this.closeSidePanel();
    this.snackbarService.showSuccess(message);
    this.loadData();
  }

  onSaveAndAddAnother(message: string): void {
    this.snackbarService.showSuccess(message);
    this.loadData();
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
  }

  // --- Navigation ---

  onViewItems(order: StandingOrderListDto): void {
    this.stateService.save({
      customerType: this.filterForm.get('customerType')?.value,
      contractId: this.filterForm.get('contractId')?.value,
      consigneeId: this.filterForm.get('consigneeId')?.value,
      contracts: this.contracts(),
      consignees: this.consignees(),
    });

    this.router.navigate([
      '/distribution/enter-standing-order/items',
      order.contractId,
      order.consigneeId,
      order.weekDay
    ], {
      state: {
        weekDay: order.weekDayDisplay,
        timeRequired: order.timeRequired,
        customerId: this.contracts().find(c => c.code === order.contractId)?.customerId || ''
      }
    });
  }

  private restoreState(): void {
    const saved = this.stateService.restore();
    if (!saved) return;

    this.contracts.set(saved.contracts);
    this.consignees.set(saved.consignees);

    this.filterForm.patchValue({
      customerType: saved.customerType,
      contractId: saved.contractId,
      consigneeId: saved.consigneeId
    }, { emitEvent: false });

    this.filtersReady.set(!!saved.contractId && !!saved.consigneeId);

    if (saved.contractId && saved.consigneeId) {
      this.loadData();
    }
  }
}
