import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips } from '@shared/components/filter-chips/filter-chips';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { HlaGradingService } from './services/hla-grading.service';
import { HlaGradingDialogService } from './services/hla-grading-dialog.service';
import { HlaGradingModel, DropdownOption, HlaGradingParamsDto, HlaGradingFilterValue } from './models/hla-grading.model';
import { HlaGradingFilterPanel } from './hla-grading-filter-panel/hla-grading-filter-panel';
import { HlaGradingFilterChipsUtils } from './utils/hla-grading-filter-chips.utils';

@Component({
  selector: 'app-define-hla-matching-grades',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    FilterChips,
    HlaGradingFilterPanel
  ],
  templateUrl: './define-hla-matching-grades.html',
  styleUrls: ['./define-hla-matching-grades.scss']
})
export class DefineHlaMatchingGrades implements OnInit, OnDestroy {
  @ViewChild('filterBtn') filterBtn!: ElementRef;
  @ViewChild(DataTable) dataTableComponent!: DataTable<HlaGradingModel>;

  private readonly service = inject(HlaGradingService);
  private readonly dialogService = inject(HlaGradingDialogService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [{
      label: 'ADD NEW GRADE',
      icon: 'add',
      color: 'accent',
      ariaLabel: 'Add new HLA matching grade',
      onClick: () => this.createRecord()
    }]
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Grade',
    minLength: 1,
    ariaLabel: 'Search by Grade',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<HlaGradingModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: { column: 'gradeId', direction: 'default' },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No HLA matching grades data found',
    noDataIcon: 'edit',
    loadingMessage: 'Loading HLA matching grades data...',
    showPagination: true,
    enableRowHighlight: false
  };

  dataSource: HlaGradingModel[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  isDialogOpen = false;

  // Filter state
  isFilterOpen = false;
  appliedFilters: HlaGradingFilterValue | null = null;
  filterChips: FilterChip[] = [];
  filterPanelPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top', offsetY: 56 }
  ];

  // Search state
  searchTerm = '';
  requestState: HlaGradingParamsDto = {
    sortColumn: 'grade_id',
    sortDirection: 'A'
  };

  // Dropdown data
  gradeOptions: DropdownOption[] = [];
  hlaCodeOptions: DropdownOption[] = [];

  private _maxGradeId = 0;

  get nextGradeId(): number {
    return this._maxGradeId + 1;
  }

  constructor() {
    this.initializeTableConfig();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadDropdownOptions();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      { key: 'gradeId', header: 'Grade ID', sortable: true, type: 'number', minWidth: '100px' },
      { key: 'grade', header: 'Grade', sortable: false, type: 'text', minWidth: '120px' },
      { key: 'a1', header: 'A1', sortable: false, type: 'text', minWidth: '160px' },
      { key: 'a2', header: 'A2', sortable: false, type: 'text', minWidth: '160px' },
      { key: 'b1', header: 'B1', sortable: false, type: 'text', minWidth: '140px' },
      { key: 'b2', header: 'B2', sortable: false, type: 'text', minWidth: '160px' },
      { key: 'gradeLevel', header: 'Grade Level', sortable: false, type: 'number', width: '80px', minWidth: '80px' },
      {
        key: 'effectiveDate', header: 'Effective Date', sortable: false, type: 'text', minWidth: '140px',
        valueFormatter: (value: string | null) => value ? DateFieldValidationUtility.formatDateForUI(new Date(value)) || '--' : '--'
      },
      {
        key: 'terminationDate', header: 'Termination Date', sortable: false, type: 'text', minWidth: '150px',
        valueFormatter: (value: string | null) => value ? DateFieldValidationUtility.formatDateForUI(new Date(value)) || '--' : '--'
      }
    ];

    this.tableConfig.rowActions = [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit grade',
        ariaLabel: 'Edit grade',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchTerm = '';
        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = {};
        this.isFilterOpen = false;
        this.dataSource = [];
        this.tableConfig.pagination!.pageIndex = 0;

        this.loadDropdownOptions();
        this.loadData();
      });
  }

  private loadDropdownOptions(): void {
    this.service.getDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.gradeOptions = result.grades || [];
          this.hlaCodeOptions = result.hlaCodes || [];
        },
        error: () => {
          this.gradeOptions = [];
          this.hlaCodeOptions = [];
        }
      });
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);
    const take = this.tableConfig.pagination?.pageSize || 10;

    this.service.getHlaGradingRecords(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.total;
          // Load next grade ID from dedicated endpoint instead of using filtered results
          this.loadNextGradeId();
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = err?.error?.message || 'Failed to load HLA matching grades data.';
        }
      });
  }

  private loadNextGradeId(): void {
    this.service.getNextGradeId()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (nextId) => {
          this._maxGradeId = nextId - 1; // Store as max since component calculates next as max + 1
        },
        error: () => {
          // Silently fail - use existing value or default to 0
        }
      });
  }

  /* -------------------------------- EVENTS -------------------------------- */

  onSearch(searchTerm: string): void {
    const trimmedText = searchTerm?.trim() || '';
    this.searchTerm = trimmedText;
    this.requestState.searchKeyword = trimmedText || undefined;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onSearchCleared(): void {
    this.searchTerm = '';
    this.requestState.searchKeyword = undefined;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (event.column === 'gradeId') {
      this.requestState.sortColumn = 'grade_id';
      this.requestState.sortDirection = event.direction === 'D' ? 'D' : 'A';
      this.tableConfig = {
        ...this.tableConfig,
        sortConfig: { column: 'gradeId', direction: event.direction }
      };
      this.tableConfig.pagination!.pageIndex = 0;
      this.loadData();
    }
  }

  onRowAction(event: TableRowActionEvent<HlaGradingModel>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  /* -------------------------------- FILTER -------------------------------- */

  openFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilterPanel(): void {
    this.isFilterOpen = false;
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.focus();
    }
  }

  applyFilters(filters: HlaGradingFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = HlaGradingFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      effectiveDatePeriod: filters.effectivePeriod || undefined,
      effectiveDate: filters.effectiveDate || undefined,
      terminationDatePeriod: filters.terminationPeriod || undefined,
      terminationDate: filters.terminationDate || undefined
    };

    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = HlaGradingFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = HlaGradingFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { effectiveDatePeriod, effectiveDate, terminationDatePeriod, terminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (this.appliedFilters) {
      this.requestState = {
        ...this.requestState,
        effectiveDatePeriod: this.appliedFilters.effectivePeriod || undefined,
        effectiveDate: this.appliedFilters.effectiveDate || undefined,
        terminationDatePeriod: this.appliedFilters.terminationPeriod || undefined,
        terminationDate: this.appliedFilters.terminationDate || undefined
      };
    } else {
      const { effectiveDatePeriod, effectiveDate, terminationDatePeriod, terminationDate, ...rest } = this.requestState;
      this.requestState = rest;
    }
  }

  /* -------------------------------- DIALOG -------------------------------- */

  createRecord(): void {
    this.isDialogOpen = true;
    // Reload dropdowns before opening dialog to ensure latest master codes are shown
    this.service.getDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.gradeOptions = result.grades || [];
          this.hlaCodeOptions = result.hlaCodes || [];

          this.dialogService.openAddDialog(this.gradeOptions, this.hlaCodeOptions, this.nextGradeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe((success: boolean) => {
              if (success) {
                this.loadDropdownOptions();
                this.loadData();
              }
              this.isDialogOpen = false;
              if (this.dataTableComponent) {
                this.dataTableComponent.activeRow = null;
              }
            });
        },
        error: () => {
          // On error, use cached values
          this.dialogService.openAddDialog(this.gradeOptions, this.hlaCodeOptions, this.nextGradeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe((success: boolean) => {
              if (success) {
                this.loadDropdownOptions();
                this.loadData();
              }
              this.isDialogOpen = false;
              if (this.dataTableComponent) {
                this.dataTableComponent.activeRow = null;
              }
            });
        }
      });
  }

  editRecord(record: HlaGradingModel): void {
    this.isDialogOpen = true;
    // Reload dropdowns before opening dialog to ensure latest master codes are shown
    this.service.getDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.gradeOptions = result.grades || [];
          this.hlaCodeOptions = result.hlaCodes || [];

          this.dialogService.openEditDialog(record, this.gradeOptions, this.hlaCodeOptions)
            .pipe(takeUntil(this.destroy$))
            .subscribe((success: boolean) => {
              if (success) {
                this.loadDropdownOptions();
                this.loadData();
              }
              this.isDialogOpen = false;
              if (this.dataTableComponent) {
                this.dataTableComponent.activeRow = null;
              }
            });
        },
        error: () => {
          // On error, use cached values
          this.dialogService.openEditDialog(record, this.gradeOptions, this.hlaCodeOptions)
            .pipe(takeUntil(this.destroy$))
            .subscribe((success: boolean) => {
              if (success) {
                this.loadDropdownOptions();
                this.loadData();
              }
              this.isDialogOpen = false;
              if (this.dataTableComponent) {
                this.dataTableComponent.activeRow = null;
              }
            });
        }
      });
  }
}
