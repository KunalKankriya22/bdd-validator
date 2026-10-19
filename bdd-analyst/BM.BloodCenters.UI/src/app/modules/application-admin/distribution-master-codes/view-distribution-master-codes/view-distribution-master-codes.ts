import moment from 'moment';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { FilterDistributionMasterCodesComponent } from '../filter-distribution-master-codes/filter-distribution-master-codes';
import {
  DistributionMasterCodesService,
  MasterCodeListItem,
  MasterCodeFilter,
} from '../services/distribution-master-codes.service';
import { DistributionMasterCodesDialogService } from '../services/distribution-master-codes-dialog.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DistributionMasterFilterChipsUtils } from '../utils/distribution-master-filter-chips.utils';
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

@Component({
  selector: 'app-view-distribution-master-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
  ],
  templateUrl: './view-distribution-master-codes.html',
  styleUrl: './view-distribution-master-codes.scss',
})
export class ViewDistributionMasterCodes implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
@ViewChild('chipsScroll') chipsScrollRef!: ElementRef;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<MasterCodeListItem> = {
    columns: [],
    rowActions: [],
    showPagination: true
  };

  dataSource: MasterCodeListItem[] = [];
  requestState: MasterCodeFilter = {};
  isLoading = false;
  hasError = false;
  errorMessage = '';

  filterChips: FilterChip[] = [];
  appliedFilters: MasterCodeFilter | null = null;
  isFilterPanelOpen = false;
  showLeftArrow = false;
  showRightArrow = false;
  editingRow: MasterCodeListItem | null = null;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;
  private chapterId$!: ReturnType<typeof toObservable<string>>;

  constructor(
    private router: Router,
    private distributionMasterCodesService: DistributionMasterCodesService,
    private distributionMasterCodesDialogService: DistributionMasterCodesDialogService,
    private overlay: Overlay,
    private headerService: HeaderService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.chapterId$ = toObservable(this.headerService.chapterId);
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.chapterId$.pipe(
      filter(id => !!id),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadData();
    });
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
        { label: 'Home', link: '/home' },
        { label: 'Distribution Master Codes', link: null }
      ],
      actions: [
        {
          label: 'ADD NEW CODE TYPE',
          icon: 'add',
          onClick: () => this.onAddNew()
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by code type or description',
      minLength: 2,
      ariaLabel: 'Search by code type or description',
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
        column: '',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No codes found',
      loadingMessage: 'Loading distribution master codes...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<MasterCodeListItem>[] {
    return [
      {
        key: 'codeType',
        header: 'Code Type',
        sortable: true,
        width: '140px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '300px',
        cellClass: 'preserve-whitespace'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'lastModifiedDate',
        header: 'Modification Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<MasterCodeListItem>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit',
        ariaLabel: 'Edit {{codeType}}',
        color: 'default',
        action: 'edit'
      },
      {
        icon: 'visibility',
        label: 'View Codes',
        ariaLabel: 'View codes for {{codeType}}',
        color: 'primary',
        action: 'navigate'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip = (this.tableConfig.pagination?.pageIndex || 0) * (this.tableConfig.pagination?.pageSize || 10);
    const take = this.tableConfig.pagination?.pageSize || 10;

    const chapterId = this.headerService.getCurrentChapterId();
    this.distributionMasterCodesService.getMasterCodes(chapterId, take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total;
          }
          this.isLoading = false;

          this.tableConfig.emptyMessage = 'No codes found';
          this.tableConfig.noDataIcon = 'inbox';
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load distribution master codes. Please try again.';
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
    this.requestState.sort = event.direction === 'default' ? undefined : event.direction;
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<MasterCodeListItem>): void {
    if (event.action === 'edit') {
      this.onEdit(event.row);
    } else if (event.action === 'navigate') {
      this.onNavigate(event.row);
    }
  }

  onAddNew(): void {
    (document.activeElement as HTMLElement)?.blur();
    const dialogRef = this.distributionMasterCodesDialogService.openAddDialog();
    dialogRef.componentInstance.saveSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (document.activeElement as HTMLElement)?.blur());
  }

  onEdit(row: MasterCodeListItem): void {
    (document.activeElement as HTMLElement)?.blur();
    this.editingRow = row;
    const dialogRef = this.distributionMasterCodesDialogService.openEditDialog(row);
    dialogRef.componentInstance.saveSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.editingRow = null;
        (document.activeElement as HTMLElement)?.blur();
      });
  }

  onNavigate(row: MasterCodeListItem): void {
    this.router.navigate(['/application-administration/distribution-restricted/code-type', row.codeType], {
      state: {
        codeTypeDescription: row.description,
        codeTypeStatus: this.getStatusClass(row.termDate),
        codeType: row.codeType
      }
    });
  }

  formatDate(date: Date | null): string {
    if (!date) return '-';
    const d = new Date(date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getStatusClass(termDate: Date | null): string {
    const status = termDate && moment(termDate).format('YYYY-MM-DD') < moment.utc().startOf('day').format('YYYY-MM-DD') ? 'inactive' : 'active';
    return status;
  }

  // --- Filter Panel ---

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }

    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
        .flexibleConnectedTo(this.filterBtn)
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
            offsetX: 0,
            offsetY: 8
          }
        ])
        .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      width: '500px',
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    this.isFilterPanelOpen = true;

    const portal = new ComponentPortal(FilterDistributionMasterCodesComponent);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters || {};

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
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

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterPanelOpen = false;

    // Blur the filter button to remove focus state
    if (this.filterBtn?.nativeElement) {
      (this.filterBtn.nativeElement as HTMLElement).blur();
    }

    this.previouslyFocusedElement = null;
    this.cdr.markForCheck();
  }

  private applyFilters(filters: MasterCodeFilter): void {
    this.appliedFilters = filters;
    this.filterChips = DistributionMasterFilterChipsUtils.convertFiltersToChips(filters);
    this.updateChipsScrollArrows();

    this.requestState.effectiveDate = filters.effectiveDate;
    this.requestState.terminationDate = filters.terminationDate;
    this.requestState.effectiveDatePeriod = filters.effectiveDatePeriod;
    this.requestState.terminationDatePeriod = filters.terminationDatePeriod;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  clearFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    delete this.requestState.effectiveDate;
    delete this.requestState.terminationDate;
    delete this.requestState.effectiveDatePeriod;
    delete this.requestState.terminationDatePeriod;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DistributionMasterFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters || {},
      chipKey
    );
    this.filterChips = DistributionMasterFilterChipsUtils.convertFiltersToChips(this.appliedFilters || {});

    this.requestState.effectiveDate = this.appliedFilters?.effectiveDate;
    this.requestState.terminationDate = this.appliedFilters?.terminationDate;
    this.requestState.effectiveDatePeriod = this.appliedFilters?.effectiveDatePeriod;
    this.requestState.terminationDatePeriod = this.appliedFilters?.terminationDatePeriod;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DistributionMasterFilterChipsUtils.hasActiveFilters(this.appliedFilters || {});
  }

  // --- Chips Scroll ---

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

  // --- Keyboard Shortcuts ---

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.onAddNew();
    }
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }
  }
}
