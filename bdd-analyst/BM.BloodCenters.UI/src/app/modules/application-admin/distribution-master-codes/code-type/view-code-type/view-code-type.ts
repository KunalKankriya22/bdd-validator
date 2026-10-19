import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { FilterDistributionMasterCodesComponent } from '../../filter-distribution-master-codes/filter-distribution-master-codes';
import { CodeTypeFilter, MasterCodeFilter, DistributionMasterCodesService, MasterCodeDetail } from '../../services/distribution-master-codes.service';
import { CodeTypeDialogService } from '../services/code-type-dialog.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DistributionMasterFilterChipsUtils } from '../../utils/distribution-master-filter-chips.utils';
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
  selector: 'app-view-code-type',
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
    FilterChips
  ],
  templateUrl: './view-code-type.html',
  styleUrl: './view-code-type.scss',
})
export class ViewCodeType implements OnInit, OnDestroy {
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

  tableConfig: DataTableConfig<MasterCodeDetail> = {
    columns: [],
    rowActions: [],
    showPagination: true
  };

  dataSource: MasterCodeDetail[] = [];
  requestState: CodeTypeFilter = {};
  isLoading = false;
  hasError = false;
  errorMessage = '';

  codeParam = '';
  codeTypeDescription = '';
  codeTypeStatus = '';

  filterChips: FilterChip[] = [];
  appliedFilters: MasterCodeFilter | null = null;
  isFilterPanelOpen = false;
  showLeftArrow = false;
  showRightArrow = false;
  editingRow: MasterCodeDetail | null = null;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private distributionMasterCodesService: DistributionMasterCodesService,
    private codeTypeDialogService: CodeTypeDialogService,
    private snackBar: MatSnackBar,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['code']) {
        this.codeParam = params['code'];
        this.updateHeaderConfig();
        this.loadData();
      }
    });

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.codeTypeDescription = navigation.extras.state['codeTypeDescription'] || '';
      this.codeTypeStatus = navigation.extras.state['codeTypeStatus'] || '';
    } else if (history?.state) {
      this.codeTypeDescription = history.state.codeTypeDescription || '';
      this.codeTypeStatus = history.state.codeTypeStatus || '';
    }

    this.updateHeaderConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayRef?.dispose();
  }

  private initializeConfigurations(): void {
    this.searchConfig = {
      placeholder: 'Search by code or description',
      minLength: 2,
      ariaLabel: 'Search by code or description',
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
      showTableOnEmpty: true,
      noDataIcon: 'edit',
      emptyMessage: 'No Codes Added Yet',
      emptySubMessage: 'Click on the "New Code" button above to create a new one.',
      loadingMessage: 'Loading codes...',
      showPagination: true
    };
  }

  private updateHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Distribution Master Codes', link: '/application-administration/distribution-restricted/distribution-master-codes' },
        { label: this.codeParam || 'Code', link: null }
      ],
      title: this.codeTypeDescription || 'Description',
      subtitle: `${this.codeParam} | ${this.codeTypeStatus ? this.codeTypeStatus.charAt(0).toUpperCase() + this.codeTypeStatus.slice(1) : ''}`,
      showBackButton: true,
      onBackClick: () => this.onBack(),
      actions: [
        {
          label: 'ADD NEW CODE',
          icon: 'add',
          onClick: () => this.onAddNew()
        }
      ]
    };
  }

  private getTableColumns(): TableColumn<MasterCodeDetail>[] {
    return [
      {
        key: 'code',
        header: 'Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '250px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
{
        key: 'numericalValue',
        header: 'Numerical Value',
        width: '120px'
      },
      {
        key: 'sequence1',
        header: 'Sequence 1',
        width: '100px'
      },
      {
        key: 'sequence2',
        header: 'Sequence 2',
        width: '100px'
      },
      {
        key: 'sequence3',
        header: 'Sequence 3',
        width: '100px'
      },
      {
        key: 'lastModifiedDate',
        header: 'Modification Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<MasterCodeDetail>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit',
        ariaLabel: 'Edit {{code}}',
        color: 'default',
        action: 'edit',
        visible: (row: MasterCodeDetail) => row.changeControlFlag === 'D'
      }
    ];
  }

  loadData(): void {
    if (!this.codeParam) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    const skip = (this.tableConfig.pagination?.pageIndex || 0) * (this.tableConfig.pagination?.pageSize || 10);
    const take = this.tableConfig.pagination?.pageSize || 10;

    this.distributionMasterCodesService.getDistributionMasterCodesByType(this.codeParam, take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.total;
          }
          this.isLoading = false;

          // Show contextual empty message
          const hasFiltersOrSearch = this.hasActiveFilters() || !!this.requestState.searchKeyword;
          if (hasFiltersOrSearch) {
            this.tableConfig.emptyMessage = 'No codes found';
            this.tableConfig.emptySubMessage = undefined;
            this.tableConfig.noDataIcon = 'inbox';
          } else {
            this.tableConfig.emptyMessage = 'No Codes Added Yet';
            this.tableConfig.emptySubMessage = 'Click on the "Add New Code" button above to create a new one.';
            this.tableConfig.noDataIcon = 'edit';
          }
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load codes. Please try again.';
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

  onRowAction(event: TableRowActionEvent<MasterCodeDetail>): void {
    if (event.action === 'edit') {
      this.onEdit(event.row);
    }
  }

  onAddNew(): void {
    const dialogRef = this.codeTypeDialogService.openAddCodeDialog(this.codeParam, this.codeTypeDescription);

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        const newCode = {
          codeType: result.codeType,
          code: result.code,
          description: result.description,
          effectiveDate: result.effectiveDate,
          terminationDate: result.termDate || null,
          sequence1: result.sequence1 || 0,
          sequence2: result.sequence2 || 0,
          sequence3: result.sequence3 || 0,
          numericalValue: result.numericalValue || 0,
          changeControlFlag: result.codeBehavior || 'D'
        };

        this.distributionMasterCodesService.createCode(newCode).subscribe({
          next: () => {
            dialogRef.close();
            this.snackBar.open(`New code ${result.code} has been added to ${this.codeParam} successfully.`, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadData();
          },
          error: (error) => {
            dialogRef.componentInstance.isSaving = false;
            const body = error?.error;
            const errorCode = body?.errorCode || body?.errorResponse?.errorCode || '';
            const errorText = body?.error || body?.errorResponse?.error || body?.message || 'Failed to add code. Please try again.';
            const errorMsg = errorCode ? `Error ${errorCode}: ${errorText}` : errorText;
            this.snackBar.open(errorMsg, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
      });
  }

  onEdit(row: MasterCodeDetail): void {
    this.editingRow = row;
    const dialogRef = this.codeTypeDialogService.openEditCodeDialog(row, this.codeTypeDescription);

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.editingRow = null;
        (document.activeElement as HTMLElement)?.blur();
        this.editingRow = null;
      });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        const updateData = {
          codeType: result.codeType,
          code: result.code,
          description: result.description,
          effectiveDate: result.effectiveDate,
          terminationDate: result.termDate || null,
          sequence1: result.sequence1 || 0,
          sequence2: result.sequence2 || 0,
          sequence3: result.sequence3 || 0,
          NumericValue: result.numericalValue || 0
        };

        this.distributionMasterCodesService.updateCode(row.codeType, row.code, updateData).subscribe({
          next: () => {
            dialogRef.close();
            this.snackBar.open(`Code ${row.code} has been updated successfully.`, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadData();
          },
          error: (error) => {
            dialogRef.componentInstance.isSaving = false;
            const body = error?.error;
            const errorCode = body?.errorCode || body?.errorResponse?.errorCode || '';
            const errorText = body?.error || body?.errorResponse?.error || body?.message || 'Failed to update code. Please try again.';
            const errorMsg = errorCode ? `Error ${errorCode}: ${errorText}` : errorText;
            this.snackBar.open(errorMsg, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
      });
  }

  onBack(): void {
    this.router.navigate(['/application-administration/distribution-restricted/distribution-master-codes']);
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
      .subscribe((filters: any) => {
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
    delete this.requestState.searchKeyword;
    delete this.requestState.sort;

    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = '';
      this.tableConfig.sortConfig.direction = 'default';
    }

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
