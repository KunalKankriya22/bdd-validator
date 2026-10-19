import { Component, OnDestroy, OnInit, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { PageHeaderWithBreadcrumb } from '../../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { SearchBar, SearchBarConfig } from '../../../../shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '../../../../shared/components/filter-chips/filter-chips';
import { DataTableConfig, TableColumn, TableSortEvent } from '../../../../shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '../../../../shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { LabInterdictionOverrideService } from '../services/lab-interdiction-override.service';
import { LoginService } from '@shared/services/login.service';
import {
  LabInterdictionOverrideModel,
  LabInterdictionOverrideFilterValue,
  LabInterdictionOverrideParamsDto
} from '../models/lab-interdiction-override.model';
import { LabInterdictionOverrideFilterPanel } from '../lab-interdiction-override-filter-panel/lab-interdiction-override-filter-panel';
import { FilterChipsUtils } from '../utils/filter-chips.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';

export function getLabInterdictionOverridePaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-lab-interdiction-override',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    LabInterdictionOverrideFilterPanel
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getLabInterdictionOverridePaginatorIntl }
  ],
  templateUrl: './lab-interdiction-override.html',
  styleUrls: ['./lab-interdiction-override.scss']
})
export class LabInterdictionOverride implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction or Description',
    minLength: 2
  };

  isFilterPanelOpen = false;

  tableConfig: DataTableConfig<LabInterdictionOverrideModel> = {
    columns: this.getTableColumns(),
    stickyHeader: true
  };

  appliedFilters: LabInterdictionOverrideFilterValue | null = null;
  filterChips: FilterChip[] = [];
  dataSource: LabInterdictionOverrideModel[] = [];
  selectedRows: Set<number> = new Set();
  displayedColumns: string[] = [];
  currentSortColumn: string = 'donorDecisionCode';
  currentSortDirection: 'A' | 'D' | 'default' = 'A';
  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];
  requestState: LabInterdictionOverrideParamsDto = {
    skip: 0,
    take: 25,
    sortOrder: 'A',
    sortColumn: 'donorDecisionCode'
  };

  isLoading = false;
  isVerifying = false;
  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private labInterdictionOverrideService: LabInterdictionOverrideService,
    private loginService: LoginService,
    private overlay: Overlay,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            {
              label: 'Home',
              link: '/home'
            },
            {
              label: pageData.title,
              link: null
            }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.displayedColumns = ['select', ...this.tableConfig.columns.map(col => col.key)];
    this.loadTableData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private getTableColumns(): TableColumn<LabInterdictionOverrideModel>[] {
    return [
      {
        key: 'donorDecisionCode',
        header: 'Cue',
        sortable: true,
        width: '220px',
        valueFormatter: (_value, row) => {
          const code = row?.donorDecisionCode || '';
          const desc = row?.decisionDesc || '';
          return desc ? `${code} - ${desc}` : code;
        }
      },
      {
        key: 'productType',
        header: 'Lab Product Type',
        sortable: false,
        width: '130px'
      },
      {
        key: 'prodTypeDesc',
        header: 'Lab Product Type Description',
        sortable: false,
        width: '200px'
      },
      {
        key: 'interCode',
        header: 'Interdiction',
        sortable: false,
        width: '120px'
      },
      {
        key: 'interDescription',
        header: 'Interdiction Description',
        sortable: false,
        width: '200px'
      },
      {
        key: 'interType',
        header: 'Type',
        sortable: false,
        width: '120px'
      },
      {
        key: 'overrideDesc',
        header: 'Description',
        sortable: false,
        width: '200px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(String(value))) : '-'
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value ? DateFieldValidationUtility.formatDateForUI(moment(String(value))) : '-'
      }
    ];
  }

  loadTableData(): void {
    this.isLoading = true;

    const params: LabInterdictionOverrideParamsDto = {
      ...this.requestState,
      ...this.appliedFilters
    };

    this.labInterdictionOverrideService
      .getLabInterdictionOverrides(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalRecords = response.totalRecords;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.requestState = {
      ...this.requestState,
      skip: event.pageIndex * event.pageSize,
      take: event.pageSize
    };
    this.loadTableData();
  }

  onSearch(searchText: string): void {
    const trimmed = (searchText || '').trim();
    if (trimmed === '') {
      this.requestState = {
        ...this.requestState,
        searchText: undefined,
        skip: 0
      };
      this.pageIndex = 0;
      this.loadTableData();
    }
  }

  onEnterSearch(): void {
    const text = this.searchBarComponent?.searchText?.trim() || '';
    if (text.length >= 2) {
      this.requestState = {
        ...this.requestState,
        searchText: text,
        skip: 0
      };
      this.pageIndex = 0;
      this.loadTableData();
    }
  }

  onSortClick(columnKey: string): void {
    if (this.currentSortColumn === columnKey && this.currentSortDirection === 'A') {
      this.currentSortDirection = 'D';
    } else {
      this.currentSortColumn = columnKey;
      this.currentSortDirection = 'A';
    }

    this.requestState = {
      ...this.requestState,
      sortOrder: this.currentSortDirection,
      sortColumn: this.currentSortColumn
    };

    this.loadTableData();
  }

  getSortDirection(columnKey: string): 'A' | 'D' | 'default' {
    if (this.currentSortColumn === columnKey) {
      return this.currentSortDirection;
    }
    return 'default';
  }

  getSortIcon(columnKey: string): string {
    if (this.currentSortColumn !== columnKey) {
      return 'unfold_more';
    }
    return this.currentSortDirection === 'A' ? 'arrow_upward' : 'arrow_downward';
  }

  onSortChange(event: TableSortEvent): void {
    if (event.direction === 'default') {
      this.requestState = {
        ...this.requestState,
        sortOrder: undefined,
        sortColumn: undefined
      };
    } else {
      this.requestState = {
        ...this.requestState,
        sortOrder: event.direction,
        sortColumn: event.column
      };
    }
    this.loadTableData();
  }

  get canVerify(): boolean {
    return this.selectedRows.size > 0;
  }

  isRowSelected(row: LabInterdictionOverrideModel): boolean {
    return this.selectedRows.has(row.auditKey);
  }

  toggleRowSelection(row: LabInterdictionOverrideModel): void {
    if (this.selectedRows.has(row.auditKey)) {
      this.selectedRows.delete(row.auditKey);
    } else {
      this.selectedRows.add(row.auditKey);
    }
  }

  toggleAllRows(): void {
    if (this.allRowsSelected()) {
      this.selectedRows.clear();
    } else {
      this.dataSource.forEach(row => this.selectedRows.add(row.auditKey));
    }
  }

  allRowsSelected(): boolean {
    return this.dataSource.length > 0 && this.dataSource.every(row => this.selectedRows.has(row.auditKey));
  }

  someRowsSelected(): boolean {
    return this.selectedRows.size > 0 && !this.allRowsSelected();
  }

  onVerify(): void {
    if (!this.canVerify) return;

    const auditKeys = Array.from(this.selectedRows);
    this.isVerifying = true;

    this.labInterdictionOverrideService
      .verifyInterdictions({ auditKeys })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isVerifying = false;
          if (response.success) {
            this.snackBar.open(
              'Lab Interdiction Verified Successfully.',
              'DISMISS',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              }
            );
            this.selectedRows.clear();
            this.loadTableData();
          } else {
            const errorMessage = response.errors.join(', ');
            this.snackBar.open(
              errorMessage || 'Failed to verify interdiction.',
              'DISMISS',
              {
                duration: 8000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        },
        error: (err) => {
          this.isVerifying = false;
          const body = err?.error;
          const errorMessage =
            body?.errorResponse?.error ||
            body?.errors?.join(', ') ||
            body?.message ||
            'Failed to verify interdiction.';
          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 8000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterPanelOpen = false;
      return;
    }

    if (!this.filterBtn) {
      return;
    }

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

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(LabInterdictionOverrideFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    this.isFilterPanelOpen = true;
    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterPanelOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterPanelOpen = false;
        }
      });

    this.overlayRef.backdropClick().subscribe(() => {
      if (this.overlayRef) {
        this.overlayRef.dispose();
        this.overlayRef = null;
        this.isFilterPanelOpen = false;
      }
    });
  }

  applyFilters(filters: LabInterdictionOverrideFilterValue): void {
    this.appliedFilters = FilterChipsUtils.hasActiveFilters(filters) ? filters : null;
    this.buildFilterChips();

    this.requestState = {
      ...this.requestState,
      skip: 0
    };
    this.pageIndex = 0;

    this.loadTableData();
  }

  buildFilterChips(): void {
    if (!this.appliedFilters) {
      this.filterChips = [];
      return;
    }

    this.filterChips = FilterChipsUtils.convertFiltersToChips(
      this.appliedFilters,
      (date: string) => DateFieldValidationUtility.formatDateForUI(moment(date))
    );
  }

  removeFilter(key: string): void {
    if (!this.appliedFilters) return;

    this.appliedFilters = FilterChipsUtils.removeFilterByChipKey(this.appliedFilters, key);

    if (!FilterChipsUtils.hasActiveFilters(this.appliedFilters)) {
      this.appliedFilters = null;
    }

    this.buildFilterChips();
    this.requestState.skip = 0;
    this.pageIndex = 0;
    this.loadTableData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.buildFilterChips();
    this.requestState = {
      skip: 0,
      take: this.requestState.take || 25,
      sortOrder: this.requestState.sortOrder
    };
    this.pageIndex = 0;
    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(chipKey: string): void {
    this.removeFilter(chipKey);
  }

}
