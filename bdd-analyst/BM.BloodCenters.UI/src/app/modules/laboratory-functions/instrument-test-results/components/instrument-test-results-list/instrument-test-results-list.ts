import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  effect,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import {
  ValidInstrumentTestScheduleFilter,
  InstrumentLookupDto,
  ValidInstrumentTestScheduleQueryDto,
  InstrumentTestDetailDto,
} from '../../models/instrument-test-results.model';
import { InstrumentTestResultFilterChipsUtils } from '../../utils/filter-chips.utils';
import { InstrumentTestResultsFilterComponent } from '../filter-panel/instrument-test-results-filter';
import { AddTestPanelComponent } from '../add-test-panel/add-test-panel';
import { EditTestPanelComponent } from '../edit-test-panel/edit-test-panel';

@Component({
  selector: 'app-instrument-test-results-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    SearchBar,
    AddTestPanelComponent,
    EditTestPanelComponent,
  ],
  templateUrl: './instrument-test-results-list.html',
  styleUrls: ['./instrument-test-results-list.scss'],
})
export class InstrumentTestResultsListComponent implements OnInit, OnDestroy {
  @ViewChild(DataTable) dataTableComponent!: DataTable<InstrumentTestDetailDto>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    actions: [],
  };

  tableConfig: DataTableConfig<InstrumentTestDetailDto> = {
    columns: [],
    rowActions: [],
    sortConfig: { column: 'testId', direction: 'A' },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No instrument tests found for this machine.',
    loadingMessage: 'Loading instrument tests...',
    showPagination: false,
  };

  dataSource: InstrumentTestDetailDto[] = [];
  requestState: ValidInstrumentTestScheduleQueryDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  machines: InstrumentLookupDto[] = [];
  machinesLoading = false;
  selectedMachineId: string | null = null;
  private readonly returnedMachineId: string | null;

  readonly selectPanelEmptyValue = '__SELECT_PANEL_EMPTY__';
  readonly machineSearchControl = new FormControl('');
  private readonly machineSearch = signal('');
  readonly filteredMachines = computed(() => {
    const search = this.machineSearch().toLowerCase().trim();
    if (!search) return this.machinesSignal();
    return this.machinesSignal().filter(
      (m) =>
        m.code.toLowerCase().includes(search) ||
        (m.codeDesc?.toLowerCase() ?? '').includes(search)
    );
  });
  private readonly machinesSignal = signal<InstrumentLookupDto[]>([]);

  machineTouched = false;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' | 'view' = 'add';
  sidePanelData: InstrumentTestDetailDto | null = null;

  private allData: InstrumentTestDetailDto[] = [];

  isFilterPanelOpen = false;
  currentFilters: ValidInstrumentTestScheduleFilter = {};
  filterChips: FilterChip[] = [];

  searchText = '';
  readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by test ID or description',
    minLength: 1,
    ariaLabel: 'Search instrument tests',
    searchOnEnterOnly: true,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private readonly apiService: InstrumentTestResultsApiService,
    private readonly pageHeaderService: PageHeaderService,
    private readonly headerService: HeaderService,
    private readonly chapterTimezoneService: ChapterTimezoneService,
    private readonly dialog: MatDialog,
    private readonly snackbarService: SnackbarService,
    private readonly router: Router,
  ) {
    this.returnedMachineId = this.router.getCurrentNavigation()?.extras?.state?.['machineId'] ?? null;
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadMachines();
    this.subscribeToChapterChanges();
    this.machineSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.machineSearch.set(v ?? ''));

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selectedMachineName(): string {
    return (
      this.machines.find((m) => m.code === this.selectedMachineId)?.codeDesc ||
      this.selectedMachineId ||
      ''
    );
  }

  /* ── Configuration ─────────────────────────────────────── */

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      actions: [],
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: { column: 'testId', direction: 'A' },
      stickyHeader: true,
      stickyActionsColumn: true,
      enableRowHighlight: false,
      emptyMessage: 'No instrument tests found for this machine.',
      loadingMessage: 'Loading instrument tests...',
      showPagination: false,
    };
  }

  private getTableColumns(): TableColumn<InstrumentTestDetailDto>[] {
    const fmtDate = (v: any) => this.formatDateWithTimezone(v);

    return [
      { key: 'testId',             header: 'Test ID',           sortable: true, width: '110px' },
      { key: 'testDesc',           header: 'Description',       width: '200px', valueFormatter: (v) => v ?? '-' },
      { key: 'machineTestId',      header: 'Instrument Test',   width: '160px', valueFormatter: (v) => v ?? '-' },
      { key: 'effDate',            header: 'Effective Date',    width: '130px', valueFormatter: fmtDate },
      { key: 'termDate',           header: 'Termination Date',  width: '130px', valueFormatter: fmtDate },
      { key: 'lastModifiedDate',   header: 'Modification Date', width: '130px', valueFormatter: fmtDate },
    ];
  }

  private getRowActions(): RowAction<InstrumentTestDetailDto>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        color: 'default',
        action: 'edit',
      },
      {
        icon: 'visibility',
        color: 'default',
        action: 'view',
      },
    ];
  }

  /* ── Machine Dropdown ──────────────────────────────────── */

  private loadMachines(): void {
    this.machinesLoading = true;
    const chapterId = this.headerService.getCurrentChapterId() || '';
    this.apiService
      .getInstruments(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (machines) => {
          this.machines = machines;
          this.machinesSignal.set(machines);
          this.machinesLoading = false;
          if (this.returnedMachineId) {
            const exists = machines.some(m => m.code === this.returnedMachineId);
            if (exists) {
              this.selectedMachineId = this.returnedMachineId;
              this.loadData();
            }
          }
        },
        error: () => {
          this.machines = [];
          this.machinesSignal.set([]);
          this.machinesLoading = false;
        },
      });
  }

  onMachineOpenedChange(opened: boolean): void {
    if (!opened) {
      this.machineTouched = true;
    }
  }

  onMachineChange(machineId: string): void {
    this.machineTouched = true;
    this.selectedMachineId = machineId;
    this.requestState = {};
    this.resetSortToDefault();
    this.resetPagination();
    this.closeSidePanel();
    this.loadData();
  }

  clearMachineSelection(): void {
    this.selectedMachineId = null;
    this.allData = [];
    this.dataSource = [];
    this.requestState = {};
    this.currentFilters      = {};
    this.filterChips         = [];
    this.isFilterPanelOpen   = false;
    this.machineSearchControl.setValue('', { emitEvent: false });
    this.machineSearch.set('');
    this.searchText = '';
    this.closeSidePanel();
  }

  onSearch(text: string): void {
    this.requestState.searchKeyword = text || null;
    this.resetPagination();
    this.applyClientSideProcessing();
  }

  /* ── Filter Dialog ─────────────────────────────────────── */

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect   = button.getBoundingClientRect();

    const dialogWidth = 400;
    const spacing     = 8;
    const left        = Math.min(rect.left, window.innerWidth - dialogWidth - spacing);

    this.isFilterPanelOpen = true;

    const dialogRef = this.dialog.open(InstrumentTestResultsFilterComponent, {
      width:          `${dialogWidth}px`,
      maxWidth:       '90vw',
      panelClass:     'error-filter-dialog',
      backdropClass:  'transparent-backdrop',
      hasBackdrop:    true,
      data:           this.currentFilters,
      position: {
        top:  `${rect.bottom + spacing}px`,
        left: `${left}px`,
      },
    });

    dialogRef.afterClosed().subscribe((filters: ValidInstrumentTestScheduleFilter) => {
      this.isFilterPanelOpen = false;
      button.blur();
      if (filters) {
        this.currentFilters = filters;
        this.filterChips    = InstrumentTestResultFilterChipsUtils.convertFiltersToChips(filters);
        this.syncRequestStateFromFilters();
        this.resetPagination();
        this.applyClientSideProcessing();
      }
    });
  }

  /* ── Data Loading ──────────────────────────────────────── */

  loadData(): void {
    if (!this.selectedMachineId) return;

    this.isLoading = true;
    this.hasError = false;

    const chapterId = this.headerService.getCurrentChapterId() || '';

    this.apiService
      .getAllInstrumentTests(this.selectedMachineId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allData = response.data ?? [];
          this.isLoading = false;
          this.applyClientSideProcessing();
        },
        error: (err) => {
          this.hasError = true;
          this.errorMessage =
            err?.error?.message ?? 'Failed to load instrument tests. Please try again.';
          this.allData = [];
          this.dataSource = [];
          this.isLoading = false;
        },
      });
  }

  private applyClientSideProcessing(): void {
    let filtered = [...this.allData];

    // Date filters
    if (this.currentFilters.effectiveDate) {
      const filterDate = new Date(this.currentFilters.effectiveDate).getTime();
      const period = this.currentFilters.effectiveDatePeriod;
      filtered = filtered.filter((r) => {
        if (!r.effDate) return false;
        const d = new Date(r.effDate).getTime();
        return period === 'BEFORE' ? d <= filterDate : d >= filterDate;
      });
    }
    if (this.currentFilters.terminationDate) {
      const filterDate = new Date(this.currentFilters.terminationDate).getTime();
      const period = this.currentFilters.terminationDatePeriod;
      filtered = filtered.filter((r) => {
        if (!r.termDate) return false;
        const d = new Date(r.termDate).getTime();
        return period === 'BEFORE' ? d <= filterDate : d >= filterDate;
      });
    }

    // Search
    const keyword = this.requestState.searchKeyword?.toLowerCase().trim();
    if (keyword) {
      filtered = filtered.filter(
        (r) =>
          r.testId?.toLowerCase().includes(keyword) ||
          r.testDesc?.toLowerCase().includes(keyword) ||
          r.machineTestId?.toLowerCase().includes(keyword)
      );
    }

    // Sort
    const sortCol = this.tableConfig.sortConfig?.column as keyof InstrumentTestDetailDto;
    const sortDir = this.tableConfig.sortConfig?.direction;
    if (sortCol) {
      filtered.sort((a, b) => {
        const aVal = a[sortCol] ?? '';
        const bVal = b[sortCol] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' });
        return sortDir === 'D' ? -cmp : cmp;
      });
    }

    this.dataSource = filtered;
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;
    this.closeSidePanel();
    this.applyClientSideProcessing();
  }

  onRowAction(event: TableRowActionEvent<InstrumentTestDetailDto>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
      case 'view':
        this.viewRecord(event.row);
        break;
    }
  }

  /* ── Side Panel ────────────────────────────────────────── */

  createRecord(): void {
    if (!this.selectedMachineId) return;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: InstrumentTestDetailDto): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  viewRecord(record: InstrumentTestDetailDto): void {
    this.router.navigate(
      [
        '/laboratory-functions/testing-modules/testing-administration/instrument-results',
        record.machineId,
        record.testId,
      ],
      {
        state: {
          testDescription: record.testDesc,
          machineName: this.selectedMachineName,
        },
      }
    );
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  get showControls(): boolean {
    return !!this.selectedMachineId && !this.hasError;
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(key: string): void {
    this.currentFilters = InstrumentTestResultFilterChipsUtils.removeFilterByChipKey(this.currentFilters, key);
    this.filterChips    = InstrumentTestResultFilterChipsUtils.convertFiltersToChips(this.currentFilters);
    this.syncRequestStateFromFilters();
    this.resetPagination();
    this.applyClientSideProcessing();
  }

  clearAllFilters(): void {
    this.currentFilters = {};
    this.filterChips    = [];
    this.syncRequestStateFromFilters();
    this.resetPagination();
    this.applyClientSideProcessing();
  }

  private syncRequestStateFromFilters(): void {
    this.requestState.effectiveDate         = this.currentFilters.effectiveDate   ? this.toDateString(this.currentFilters.effectiveDate)   : null;
    this.requestState.effectiveDatePeriod   = this.currentFilters.effectiveDatePeriod   ?? null;
    this.requestState.terminationDate       = this.currentFilters.terminationDate ? this.toDateString(this.currentFilters.terminationDate) : null;
    this.requestState.terminationDatePeriod = this.currentFilters.terminationDatePeriod ?? null;
  }

  private toDateString(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /* ── Helpers ───────────────────────────────────────────── */

  private resetSortToDefault(): void {
    this.tableConfig.sortConfig = { column: 'testId', direction: 'A' };
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
        this.selectedMachineId = null;
        this.machines = [];
        this.machinesSignal.set([]);
        this.machineSearchControl.setValue('', { emitEvent: false });
        this.machineSearch.set('');
        this.searchText = '';
        this.allData = [];
        this.dataSource = [];
        this.requestState = {};
        this.currentFilters    = {};
        this.filterChips       = [];
        this.isFilterPanelOpen = false;
        this.closeSidePanel();
        this.loadMachines();
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
