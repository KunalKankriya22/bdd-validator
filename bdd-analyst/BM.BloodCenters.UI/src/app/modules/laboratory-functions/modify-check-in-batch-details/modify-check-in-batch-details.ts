import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectorRef,
  ElementRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Overlay, OverlayRef, OverlayModule, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChip, FilterChips } from '@shared/components/filter-chips/filter-chips';
import { formatTableDate } from '@shared/utils/date-format.util';

import { ModifyCheckInBatchApiService } from './services/modify-check-in-batch-api.service';
import { EditBatchFormComponent } from './edit-batch-form/edit-batch-form';
import { BatchCommentsPanelComponent } from './batch-comments-panel/batch-comments-panel';
import {
  CheckInBatchDto,
  CheckInBatchQueryParams,
  CheckInBatchFilterValue,
  ProductTypeOption,
  CheckInUserOption,
} from './models/modify-check-in-batch.model';
import { CheckInBatchFilterPanel } from './filter-panel/check-in-batch-filter-panel';
import { CheckInBatchFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-modify-check-in-batch-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    OverlayModule,
    SearchBar,
    DataTable,
    FilterChips,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    EditBatchFormComponent,
    BatchCommentsPanelComponent,
  ],
  templateUrl: './modify-check-in-batch-details.html',
  styleUrls: ['./modify-check-in-batch-details.scss'],
})
export class ModifyCheckInBatchDetailsComponent implements OnInit, OnDestroy {
  private readonly service = inject(ModifyCheckInBatchApiService);
  private readonly overlay = inject(Overlay);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by batch ID',
    ariaLabel: 'Search by batch ID',
    minLength: 1,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true,
  };

  tableConfig: DataTableConfig<CheckInBatchDto> = {
    columns: [
      { key: 'batchId', header: 'Batch ID', sortable: true, width: '160px' },
      { key: 'contractId', header: 'Contract', width: '140px' },
      { key: 'company', header: 'Description', width: '220px' },
      {
        key: 'minTemp',
        header: 'Minimum Temperature',
        width: '140px',
        valueFormatter: (value) => value != null ? `${value} C` : ''
      },
      {
        key: 'maxTemp',
        header: 'Maximum Temperature',
        width: '140px',
        valueFormatter: (value) => value != null ? `${value} C` : ''
      },
      {
        key: 'productType',
        header: 'Product Type',
        width: '200px',
        valueFormatter: (value) => {
          if (!value || value === '-' || value === '- -') return '-';
          const trimmed = value.replace(/\s*-\s*$/, '').trim();
          return trimmed || '-';
        }
      },
      { key: 'cartonCount', header: 'Carton Count', width: '120px' },
      { key: 'numberOfUnits', header: 'No. of Units', width: '120px' },
      {
        key: 'shippedDate',
        header: 'Shipped Date',
        width: '130px',
        valueFormatter: (value) => formatTableDate(value)
      },
      {
        key: 'receivedDate',
        header: 'Received Date',
        width: '130px',
        valueFormatter: (value) => formatTableDate(value)
      },
      {
        key: 'qcDate',
        header: 'QC Date',
        width: '130px',
        valueFormatter: (value) => formatTableDate(value)
      },
      {
        key: 'batchDate',
        header: 'Batch Date',
        width: '140px',
        valueFormatter: (value) => formatTableDate(value)
      },
      { key: 'checkinUserId', header: 'Check-In User Id', width: '140px' },
      { key: 'userName', header: 'User Name', width: '160px' },
    ],
    rowActions: [
      {
        iconSvg: 'assets/images/icons/message.svg',
        label: 'Comments',
        ariaLabel: 'View/add comments',
        action: 'comment',
        visible: (row: CheckInBatchDto) => String(row.hasComments).toLowerCase() === 'true',
      },
      {
        iconSvg: 'assets/images/icons/message-outline.svg',
        label: 'Comments',
        ariaLabel: 'View/add comments',
        action: 'comment',
        visible: (row: CheckInBatchDto) => String(row.hasComments).toLowerCase() !== 'true',
      },
      {
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit',
        ariaLabel: 'Edit batch details',
        action: 'edit',
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'batchId',
      direction: 'default',
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showPagination: true,
    noDataIcon: 'inbox',
    emptyMessage: 'No check-in batches available to display',
    loadingMessage: 'Loading check-in batches...',
  };

  dataSource: CheckInBatchDto[] = [];
  isLoading = false;
  hasError = false;
  searchKeyword = '';
  filterOverlayRef: OverlayRef | null = null;
  appliedFilters: CheckInBatchFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  private overlayClose$ = new Subject<void>();

  productTypeOptions: ProductTypeOption[] = [];
  filterProductTypeOptions: ProductTypeOption[] = [];
  checkInUserOptions: CheckInUserOption[] = [];

  editPanelOpen = false;
  commentsPanelOpen = false;
  selectedBatch: CheckInBatchDto | null = null;

  ngOnInit(): void {
    this.loadProductTypes();
    this.loadFilterProductTypes();
    this.loadCheckinUsers();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetFilters();
        this.loadProductTypes();
        this.loadFilterProductTypes();
        this.loadCheckinUsers();
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.next();
    this.overlayClose$.complete();
    this.closeFilterPanel();
  }

  private loadProductTypes(): void {
    this.service
      .getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.productTypeOptions = options;
        },
        error: () => {
          this.productTypeOptions = [];
        },
      });
  }

  private loadFilterProductTypes(): void {
    this.service
      .getProductTypeFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.filterProductTypeOptions = options;
        },
        error: () => {
          this.filterProductTypeOptions = [];
        },
      });
  }

  private loadCheckinUsers(): void {
    this.service
      .getCheckinUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.checkInUserOptions = options;
        },
        error: () => {
          this.checkInUserOptions = [];
        },
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const pageSize = this.tableConfig.pagination?.pageSize ?? 25;
    const pageIndex = this.tableConfig.pagination?.pageIndex ?? 0;

    const sortDir = this.tableConfig.sortConfig?.direction;
    const sortColumn = this.tableConfig.sortConfig?.column;

    const params: CheckInBatchQueryParams = {
      batchId: this.searchKeyword || undefined,
      sortColumn: sortDir && sortDir !== 'default' ? sortColumn : undefined,
      sortOrder: sortDir === 'A' ? 'ASC' : sortDir === 'D' ? 'DESC' : undefined,
      productType: this.appliedFilters?.productType,
      checkinUserId: this.appliedFilters?.checkinUserId,
      shippedDatePeriod: this.appliedFilters?.shippedDatePeriod,
      shippedDate: this.appliedFilters?.shippedDate
        ? (DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.shippedDate) ?? undefined)
        : undefined,
      receivedDatePeriod: this.appliedFilters?.receivedDatePeriod,
      receivedDate: this.appliedFilters?.receivedDate
        ? (DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.receivedDate) ?? undefined)
        : undefined,
      qcDatePeriod: this.appliedFilters?.qcDatePeriod,
      qcDate: this.appliedFilters?.qcDate
        ? (DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.qcDate) ?? undefined)
        : undefined,
      batchDatePeriod: this.appliedFilters?.batchDatePeriod,
      batchDate: this.appliedFilters?.batchDate
        ? (DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.batchDate) ?? undefined)
        : undefined,
    };

    this.service
      .getCheckInBatches(pageSize, pageIndex * pageSize, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data || [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total || 0;
          }
          this.tableConfig = { ...this.tableConfig };
          this.isLoading = false;
          this.hasError = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.dataSource = [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
          this.hasError = true;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSearch(keyword: string): void {
    const trimmed = keyword?.trim() || '';
    this.searchKeyword = trimmed;
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
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
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<CheckInBatchDto>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    } else if (event.action === 'comment') {
      this.openCommentsPanel(event.row);
    }
  }

  // ===================== FILTER PANEL =====================

  openFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.closeFilterPanel();
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

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'filter-overlay-panel'
    });

    const filterPortal = new ComponentPortal(CheckInBatchFilterPanel);
    const componentRef = this.filterOverlayRef.attach(filterPortal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.productTypeOptions = this.filterProductTypeOptions;
    componentRef.instance.checkInUserOptions = this.checkInUserOptions;

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

    this.filterOverlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  closeFilterPanel(): void {
    this.overlayClose$.next();
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
    this.isFilterOpen = false;
  }

  get isFilterActive(): boolean {
    return this.isFilterOpen || this.hasActiveFilters();
  }

  hasActiveFilters(): boolean {
    return CheckInBatchFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  applyFilters(filters: CheckInBatchFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = CheckInBatchFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = CheckInBatchFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  private resetFilters(): void {
    this.searchKeyword = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.closeFilterPanel();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
  }

  // ===================== EDIT PANEL =====================

  openEditPanel(batch: CheckInBatchDto): void {
    this.closeFilterPanel();
    this.commentsPanelOpen = false;
    this.selectedBatch = batch;
    this.editPanelOpen = true;
    this.cdr.detectChanges();
  }

  closeEditPanel(): void {
    this.editPanelOpen = false;
    this.selectedBatch = null;
    this.cdr.detectChanges();
  }

  onSaveBatch(updatedBatch: CheckInBatchDto): void {
    this.service
      .updateCheckInBatch(updatedBatch.batchId, {
        minTemp: updatedBatch.minTemp!,
        maxTemp: updatedBatch.maxTemp!,
        productType: updatedBatch.productType!,
        shippedDate: updatedBatch.shippedDate!,
        receivedDate: updatedBatch.receivedDate!,
        qcDate: updatedBatch.qcDate!,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Batch updated successfully');
          this.closeEditPanel();
          this.loadData();
        },
        error: () => {
          this.showSnackbar('Failed to update batch');
        },
      });
  }

  // ===================== COMMENTS PANEL =====================

  openCommentsPanel(batch: CheckInBatchDto): void {
    this.closeFilterPanel();
    this.editPanelOpen = false;
    this.selectedBatch = batch;
    this.commentsPanelOpen = true;
    this.cdr.detectChanges();
  }

  closeCommentsPanel(): void {
    this.commentsPanelOpen = false;
    this.selectedBatch = null;
    this.cdr.detectChanges();
  }

  // ===================== UTILITIES =====================

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilterPanel();
    }

    if (event.key === 'Escape') {
      if (this.editPanelOpen) {
        this.closeEditPanel();
      } else if (this.commentsPanelOpen) {
        this.closeCommentsPanel();
      } else if (this.isFilterOpen) {
        this.closeFilterPanel();
      }
    }
  }
}
