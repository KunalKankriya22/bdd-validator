import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  StandingOrderItemListDto,
  StandingOrderItemQueryDto,
  LovOption,
  getWeekDayDisplay
} from '../../models/standing-order.model';
import { StandingOrderService } from '../../services/standing-order.service';
import { StandingOrderItemSidePanelComponent } from '../standing-order-item-side-panel/standing-order-item-side-panel';

@Component({
  selector: 'app-standing-order-item-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    StandingOrderItemSidePanelComponent
  ],
  templateUrl: './standing-order-item-list.html',
  styleUrl: './standing-order-item-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandingOrderItemListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('attributeChipTemplate') private attributeChipTemplate!: TemplateRef<any>;

  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly snackbarService = inject(SnackbarService);
  private readonly service = inject(StandingOrderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  protected readonly loading = signal(false);
  protected readonly dataSource = signal<StandingOrderItemListDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly productTypesLookup = signal<LovOption[]>([]);

  contractId = '';
  consigneeId = '';
  weekDay = '';
  weekDayDisplay = '';
  timeRequired = '';
  private customerId = '';

  // Side panel state
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: StandingOrderItemListDto | null = null;

  private currentPageIndex = 0;
  private currentPageSize = 25;
  private sortColumn = '';
  private sortDirection = 'ASC';

  protected readonly headerConfig = computed<PageHeaderConfig>(() => ({
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Enter Standing Order', link: '/distribution/enter-standing-order' },
      { label: `${this.weekDayDisplay} | ${this.timeRequired}`, link: null }
    ],
    title: `${this.weekDayDisplay} | ${this.timeRequired}`,
    subtitle: '',
    actions: [{
      label: 'ADD NEW PRODUCT',
      icon: 'add',
      color: 'primary',
      onClick: () => this.openAddPanel(),
    }],
    showBackButton: true,
    onBackClick: () => this.goBackToParent(),
  }));

  tableConfig: DataTableConfig<StandingOrderItemListDto> = {
    columns: [
      { key: 'itemNo', header: 'Item', sortable: false,width: '60px' },
      { key: 'weekDayDisplay', header: 'Day of the week', width: '130px' },
      { key: 'productType', header: 'Product Type', sortable: false,width: '110px' },
      { key: 'productName', header: 'Product Name', width: '150px' },
      { key: 'abOrh', header: 'ABORh', width: '80px' },
      { key: 'tier', header: 'Tier', width: '60px' },
      { key: 'quantity', header: 'Quantity', sortable: false,width: '80px' },
      {
        key: 'substitution', header: 'Substitution', width: '130px',
        valueFormatter: (value) => value || '--',
      },
      { key: 'minimumQuantity', header: 'Minimum Quantity', width: '130px' },
      {
        key: 'attributeDisplay', header: 'Attributes', width: '130px',
        valueFormatter: (value) => value || '--',
      },
      { key: 'effectiveDate', header: 'Effective Date', sortable: false,width: '130px' },
      {
        key: 'terminationDate', header: 'Termination Date', width: '140px',
        valueFormatter: (value) => value || '--',
      },
    ],
    rowActions: [
      { icon: 'edit', action: 'edit', ariaLabel: 'Edit product' },
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
    emptyMessage: 'No products found for this standing order',
    loadingMessage: 'Loading products...',
    showPagination: true,
  };

  ngOnInit(): void {
    this.contractId = this.route.snapshot.paramMap.get('contractId') || '';
    this.consigneeId = this.route.snapshot.paramMap.get('consigneeId') || '';
    this.weekDay = this.route.snapshot.paramMap.get('weekDay') || '';

    const state = this.location.getState() as any;
    this.weekDayDisplay = state?.weekDay || getWeekDayDisplay(this.weekDay);
    this.timeRequired = state?.timeRequired || '';
    this.customerId = state?.customerId || '';

    this.loadProductTypes(this.customerId, this.consigneeId);
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableConfig.columns.map(col =>
        col.key === 'attributeDisplay'
          ? { ...col, cellTemplate: this.attributeChipTemplate }
          : col
      )
    };
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBackToParent(): void {
    this.location.back();
  }

  private loadProductTypes(customerId: string, consigneeId: string): void {
    this.service.getProductTypes(customerId, consigneeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.productTypesLookup.set(data),
        error: () => this.snackbarService.showError('Failed to load product types')
      });
  }

  private loadData(): void {
    this.loading.set(true);

    const queryDto: StandingOrderItemQueryDto = {
      sortColumn: this.sortColumn || 'ItemNo',
      sortOrder: this.sortDirection
    };

    this.service.getStandingOrderItems(
      this.contractId, this.consigneeId, this.weekDay,
      this.currentPageSize, this.currentPageIndex * this.currentPageSize, queryDto
    ).pipe(takeUntil(this.destroy$))
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
          this.snackbarService.showError('Failed to load products');
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

  onRowAction(event: TableRowActionEvent<StandingOrderItemListDto>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    }
  }

  // --- Side Panel ---

  openAddPanel(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    setTimeout(() => {
      const heading = document.querySelector<HTMLElement>('.side-panel-container h2');
      heading?.focus();
    }, 50);
  }

  openEditPanel(item: StandingOrderItemListDto): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = item;
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
}
