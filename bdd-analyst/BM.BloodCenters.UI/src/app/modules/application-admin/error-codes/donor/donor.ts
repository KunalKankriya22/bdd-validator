import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { ErrorCodesFilterComponent } from '../error-code-filter/error-code-filter';
import { ErrorCode, ErrorCodeCreateRequest, getErrorTypeDisplayName } from '../models/error-code.model';
import { ErrorCodeDialogService } from '../services/error-code-dialog.service';
import { ErrorCodeFacadeService } from '../services/error-code-facade.service';
import { ErrorCodeFilterChipsUtils } from '../utils/error-code-filter-chips.utils';

@Component({
  selector: 'app-donor',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    DataTable,
    SearchBar,
    FilterChips
  ],
  templateUrl: './donor.html',
  styleUrl: '../error-codes.scss',
})
export class Donor implements OnInit, OnDestroy {
  dataSource: ErrorCode[] = [];
  filterChips: FilterChip[] = [];
  isFilterOpen = false;
  selectedRow: ErrorCode | null = null;

  // Search configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Code or Description',
    ariaLabel: 'Search error codes',
    debounceTime: 300,
    minLength: 1,
    searchOnEnterOnly: true,
  };

  // Table configuration
  tableConfig: DataTableConfig<ErrorCode> = {
    columns: [
      {
        key: 'errorCode',
        header: 'Code',
        sortable: true,
        width: '15%'
      },
      {
        key: 'errorType',
        header: 'Type',
        width: '20%',
        valueFormatter: (value: string) => getErrorTypeDisplayName(value as any)
      },
      {
        key: 'error',
        header: 'Description',
        width: '45%',
        truncate: true,
        truncateLength: 70
      },
      {
        key: 'auditFlag',
        header: 'Audit',
        width: '15%',
        valueFormatter: (value: string) => value === 'Y' ? 'Yes' : 'No'
      }
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit',
        ariaLabel: 'Edit error code',
        action: 'edit'
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
      column: 'errorCode',
      direction: 'default'
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No records found'
  };

  // Use getters to avoid initialization issues
  get loading$() { return this.facade.loading$; }

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private errorCodeDialogService: ErrorCodeDialogService,
    private facade: ErrorCodeFacadeService,
    private headerService: HeaderService
  ) {
    // React to error codes changes
    effect(() => {
      const codes = this.facade.errorCodes$();
      this.dataSource = codes;
    });

    // Sync pagination with state
    effect(() => {
      const pagination = this.facade.pagination$();
      const total = this.facade.totalRecords$();

      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination!,
          pageSize: pagination.take,
          pageIndex: Math.floor(pagination.skip / Math.max(pagination.take, 1)),
          totalRecords: total
        }
      };
    });

    // Sync sort with state
    effect(() => {
      const sort = this.facade.sort$();

      this.tableConfig = {
        ...this.tableConfig,
        sortConfig: {
          column: 'errorCode',
          direction: (sort as 'A' | 'D' | null) || 'default'
        }
      };
    });

    // Update filter chips when filters change
    effect(() => {
      const filters = this.facade.currentFilters$();
      this.filterChips = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);
    });
  }

  ngOnInit(): void {
    // Don't load here - parent component's changeTab() already loads data
    // This prevents duplicate API calls on tab switch
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
  }

  onSearch(keyword: string): void {
    this.facade.search(keyword);
  }

  onPageChange(event: TablePageEvent): void {
    this.facade.changePagination({
      take: event.pageSize,
      skip: event.pageIndex * event.pageSize
    });
  }

  onSortChange(event: TableSortEvent): void {
    const sortDirection = event.direction === 'default' ? null : event.direction;
    this.facade.changeSort(sortDirection);
  }

  onRowAction(event: TableRowActionEvent<ErrorCode>): void {
    if (event.action === 'edit') {
      this.openEditCodeDialog(event.row);
    }
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(chipKey: string): void {
    const currentFilters = this.facade.currentFilters$();
    const updatedFilters = ErrorCodeFilterChipsUtils.removeFilterByChipKey(currentFilters, chipKey);

    if (updatedFilters) {
      this.facade.applyFilters(updatedFilters);
    } else {
      this.clearAllFilters();
    }
  }

  clearAllFilters(): void {
    this.facade.applyFilters({
      codeFrom: '',
      codeTo: '',
      errorType: null,
      auditFlag: null,
      showEmpty: false
    });
  }

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    const dialogWidth = 320;
    const spacing = 8;

    const left = Math.min(
      rect.left,
      window.innerWidth - dialogWidth - spacing
    );

    this.isFilterOpen = true;

    const dialogRef = this.dialog.open(ErrorCodesFilterComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'error-filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      ariaLabel: 'Filter donor error codes',
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`
      },
      data: {
        tabType: 'DONOR'
      }
    });

    // Pass current filters to the dialog
    const instance = dialogRef.componentInstance;
    instance.codeFrom = this.facade.currentFilters$().codeFrom || '';
    instance.codeTo = this.facade.currentFilters$().codeTo || '';
    instance.selectedType = this.facade.currentFilters$().errorType || null;
    instance.selectedAudit = this.facade.currentFilters$().auditFlag || null;
    instance.showEmpty = this.facade.currentFilters$().showEmpty || false;

    dialogRef.afterClosed().subscribe(filters => {
      this.isFilterOpen = false;
      (button as HTMLElement).blur();
      if (filters) {
        this.facade.applyFilters(filters);
      }
    });
  }

  private openEditCodeDialog(element: ErrorCode): void {
    this.selectedRow = element;
    this.errorCodeDialogService.openEditCodeDialog(element).subscribe(() => {
      this.selectedRow = null;
      (document.activeElement as HTMLElement)?.blur();
    });
  }
}