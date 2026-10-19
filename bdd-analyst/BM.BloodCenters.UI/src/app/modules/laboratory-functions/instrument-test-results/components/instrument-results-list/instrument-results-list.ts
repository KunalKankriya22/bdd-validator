import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import {
  InstrumentResultDto,
  InstrumentResultQueryDto,
  InstrumentResultFilter,
} from '../../models/instrument-test-results.model';
import { InstrumentTestResultFilterChipsUtils } from '../../utils/filter-chips.utils';
import { InstrumentResultsFilterComponent } from '../instrument-results-filter/instrument-results-filter';
import { AddResultPanelComponent } from '../add-result-panel/add-result-panel';
import { EditResultPanelComponent } from '../edit-result-panel/edit-result-panel';

@Component({
  selector: 'app-instrument-results-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    SearchBar,
    AddResultPanelComponent,
    EditResultPanelComponent,
  ],
  templateUrl: './instrument-results-list.html',
  styleUrls: ['./instrument-results-list.scss'],
})
export class InstrumentResultsListComponent implements OnInit, OnDestroy {
  @ViewChild(DataTable) dataTableComponent!: DataTable<InstrumentResultDto>;

  machineId = '';
  testId = '';
  testDescription = '';
  machineName = '';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    actions: [],
  };

  tableConfig: DataTableConfig<InstrumentResultDto> = {
    columns: [],
    rowActions: [],
    sortConfig: { column: 'resultStatus', direction: 'A' },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No instrument tests found for this machine.',
    loadingMessage: 'Loading instrument tests...',
    showPagination: false,
  };

  dataSource: InstrumentResultDto[] = [];
  requestState: InstrumentResultQueryDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: InstrumentResultDto | null = null;

  isFilterPanelOpen = false;
  currentFilters: InstrumentResultFilter = {};
  filterChips: FilterChip[] = [];

  searchText = '';
  readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by result code or description',
    minLength: 1,
    ariaLabel: 'Search instrument results',
    searchOnEnterOnly: true,
  };

  private readonly apiService = inject(InstrumentTestResultsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Read navigation state passed from parent via router.navigate(..., { state: {...} })
    if (history?.state) {
      this.testDescription = history.state['testDescription'] || '';
      this.machineName = history.state['machineName'] || '';
    }

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.machineId = params['machineId'] ?? '';
      this.testId = params['testId'] ?? '';
      this.initializeConfigurations();
      this.loadData();
    });

    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    const title = this.testDescription || this.testId;
    const subtitle = this.machineName
      ? `${this.machineId} | ${this.machineName}`
      : this.machineId;

    this.headerConfig = {
      title,
      subtitle,
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        {
          label: 'Instrument Tests and Results',
          link: '/laboratory-functions/testing-modules/testing-administration/instrument-test-results',
        },
        { label: title, link: null },
      ],
      showBackButton: true,
      onBackClick: () => this.onBack(),
      actions: [],
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: { column: 'resultStatus', direction: 'A' },
      stickyHeader: true,
      stickyActionsColumn: true,
      enableRowHighlight: true,
      emptyMessage: 'No instrument tests found for this machine.',
      loadingMessage: 'Loading instrument tests...',
      showPagination: false,
    };
  }

  private getTableColumns(): TableColumn<InstrumentResultDto>[] {
    const fmtDate = (v: string | null | undefined) => this.formatDateWithTimezone(v);

    return [
      { key: 'resultStatus',        header: 'Result',              sortable: true,  width: '130px' },
      { key: 'resultDesc',          header: 'Description',         width: '200px', valueFormatter: (v) => v ?? '-' },
      { key: 'machineResultStatus', header: 'Instrument Result',   width: '180px', valueFormatter: (v) => v ?? '-' },
      { key: 'effDate',             header: 'Effective Date',      width: '140px', valueFormatter: fmtDate },
      { key: 'termDate',            header: 'Termination Date',    width: '150px', valueFormatter: fmtDate },
      { key: 'lastModifiedDate',    header: 'Modification Date',   width: '155px', valueFormatter: fmtDate },
    ];
  }

  private getRowActions(): RowAction<InstrumentResultDto>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        color: 'default',
        action: 'edit',
      },
    ];
  }

  onSearch(text: string): void {
    this.requestState.searchKeyword = text || null;
    this.resetPagination();
    this.loadData();
  }

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const dialogWidth = 360;
    const spacing = 8;
    const left = Math.min(rect.left, window.innerWidth - dialogWidth - spacing);

    this.isFilterPanelOpen = true;

    const dialogRef = this.dialog.open(InstrumentResultsFilterComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'error-filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      data: this.currentFilters,
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`,
      },
    });

    dialogRef.afterClosed().subscribe((filters: InstrumentResultFilter) => {
      this.isFilterPanelOpen = false;
      button.blur();
      if (filters) {
        this.currentFilters = filters;
        this.filterChips = InstrumentTestResultFilterChipsUtils.convertResultFiltersToChips(filters);
        this.applyFiltersToRequestState(filters);
        this.resetPagination();
        this.loadData();
      }
    });
  }

  onRemoveFilterChip(key: string): void {
    this.currentFilters = InstrumentTestResultFilterChipsUtils.removeResultFilterByChipKey(this.currentFilters, key);
    this.filterChips = InstrumentTestResultFilterChipsUtils.convertResultFiltersToChips(this.currentFilters);
    this.applyFiltersToRequestState(this.currentFilters);
    this.resetPagination();
    this.loadData();
  }

  clearAllFilters(): void {
    this.currentFilters = {};
    this.filterChips = [];
    this.requestState.effectiveDate = null;
    this.requestState.effectiveDatePeriod = null;
    this.requestState.terminationDate = null;
    this.requestState.terminationDatePeriod = null;
    this.resetPagination();
    this.loadData();
  }

  private applyFiltersToRequestState(filters: InstrumentResultFilter): void {
    this.requestState.effectiveDate        = filters.effectiveDate
      ? this.toIsoDateString(filters.effectiveDate) : null;
    this.requestState.effectiveDatePeriod  = filters.effectiveDatePeriod ?? null;
    this.requestState.terminationDate      = filters.terminationDate
      ? this.toIsoDateString(filters.terminationDate) : null;
    this.requestState.terminationDatePeriod = filters.terminationDatePeriod ?? null;
  }

  private toIsoDateString(date: Date | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  onBack(): void {
    this.router.navigate(
      ['/laboratory-functions/testing-modules/testing-administration/instrument-test-results'],
      { state: { machineId: this.machineId, testId: this.testId } }
    );
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const take = 10000;
    const skip = 0;

    const rawDir = this.tableConfig.sortConfig?.direction;
    const sortDir: 'ASC' | 'DESC' =
      rawDir && rawDir !== 'default' ? (rawDir === 'A' ? 'ASC' : 'DESC') : 'ASC';

    const query: InstrumentResultQueryDto = {
      chapterId: this.headerService.getCurrentChapterId() || null,
      machineId: this.machineId || null,
      testId: this.testId || null,
      searchKeyword: this.requestState.searchKeyword ?? null,
      sortColumn: this.tableConfig.sortConfig?.column ?? null,
      sortOrder: sortDir,
      effectiveDate:         this.requestState.effectiveDate ?? null,
      effectiveDatePeriod:   this.requestState.effectiveDatePeriod ?? null,
      terminationDate:       this.requestState.terminationDate ?? null,
      terminationDatePeriod: this.requestState.terminationDatePeriod ?? null,
    };

    this.apiService
      .getInstrumentResults(take, skip, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data ?? [];
          this.isLoading = false;
        },
        error: (err) => {
          this.hasError = true;
          this.errorMessage = err?.error?.message ?? 'Failed to load instrument test results. Please try again.';
          this.dataSource = [];
          this.isLoading = false;
        },
      });
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;
    this.closeSidePanel();
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<InstrumentResultDto>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: InstrumentResultDto): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  private resetPagination(): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.requestState = {};
        this.currentFilters = {};
        this.searchText = '';
        this.resetPagination();
        this.closeSidePanel();
        this.loadData();
      });
  }

  private formatDateWithTimezone(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const m = moment.utc(dateStr);
    if (!m.isValid()) return '';
    const localM = this.chapterTimezoneService.convertGmtToLocal(m);
    const day = String(localM.date()).padStart(2, '0');
    const monthStr = localM.format('MMM').toUpperCase();
    return `${day}-${monthStr}-${localM.year()}`;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
