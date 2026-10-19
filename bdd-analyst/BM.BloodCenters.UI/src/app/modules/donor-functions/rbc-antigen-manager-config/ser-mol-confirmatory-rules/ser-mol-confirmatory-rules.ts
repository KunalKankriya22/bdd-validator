import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import moment from 'moment';

import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';

import { AntigenConfigRulesService } from './services/antigen-config-rules.service';
import {
  AntigenConfigRule,
  AntigenConfigRulesSearchRequest,
  TestIdOption,
  TEST_TYPE_DISPLAY,
  LIC_APPROVE_FLAG_DISPLAY,
} from './models/antigen-config-rules.model';
import { AddEditRuleComponent } from './add-edit-rule/add-edit-rule';

@Component({
  selector: 'app-ser-mol-confirmatory-rules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    DataTable,
    SearchBar,
    AddEditRuleComponent,
  ],
  templateUrl: './ser-mol-confirmatory-rules.html',
  styleUrls: ['./ser-mol-confirmatory-rules.scss'],
})
export class SerMolConfirmatoryRulesComponent implements OnInit, OnDestroy {
  @ViewChild('expandTemplate') expandTemplate!: TemplateRef<any>;

  private readonly destroy$ = new Subject<void>();

  showTerminated = false;
  selectedAntigenGroup: string | null = null;
  selectedAntigenCode: string | null = null;

  // #2: track search text for server-side filtering
  private searchText = '';

  antigenGroups: string[] = [];
  allFilterOptions: { antigenGroup: string; antigenCode: string }[] = [];

  dataSource: AntigenConfigRule[] = [];
  expandedRows = new Set<any>();
  expandRowKey = 'primaryRuleId';

  isLoading = false;
  hasRetrieved = false;
  hasError = false;
  errorMessage = '';

  serTestIds: TestIdOption[] = [];
  molTestIds: TestIdOption[] = [];
  labelingAntigens: string[] = [];

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AntigenConfigRule | null = null;

  tableConfig: DataTableConfig<AntigenConfigRule> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: { column: 'primaryRuleId', direction: 'default' },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No rules found for the selected criteria.',
    loadingMessage: 'Loading rules...',
    showPagination: true,
    hideExpandAllInHeader: false,
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Primary Rule ID',
    minLength: 1,
    ariaLabel: 'Search by Primary Rule ID',
    searchOnEnterOnly: true,
  };

  readonly testTypeDisplay = TEST_TYPE_DISPLAY;
  readonly licDisplay = LIC_APPROVE_FLAG_DISPLAY;

  constructor(
    private readonly service: AntigenConfigRulesService,
    private readonly snackBar: MatSnackBar,
    private readonly chapterTimezoneService: ChapterTimezoneService,
    private readonly headerService: HeaderService,
  ) {}

  ngOnInit(): void {
    this.initTableConfig();
    this.loadLookups();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedAntigenGroup = null;
        this.selectedAntigenCode = null;
        this.showTerminated = false;
        this.searchText = '';
        this.dataSource = [];
        this.expandedRows.clear();
        this.hasRetrieved = false;
        this.hasError = false;
        this.errorMessage = '';
        this.sidePanelOpen = false;
        this.sidePanelData = null;
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }
        this.loadLookups();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initTableConfig(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.buildColumns(),
      rowActions: this.buildRowActions(),
    };
  }

  private buildColumns(): TableColumn<AntigenConfigRule>[] {
    return [
      { key: 'primaryRuleId', header: 'Primary Rule ID', sortable: true, width: '160px' },
      // #10: add Labeling Antigen Code column
      { key: 'labelingAntigenCode', header: 'Labeling Antigen Code', width: '180px' },
      { key: 'noOfUnits', header: 'No of Units', width: '110px' },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (v) => this.formatDate(v),
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '155px',
        valueFormatter: (v) => this.formatDate(v),
      },
    ];
  }

  private buildRowActions(): RowAction<AntigenConfigRule>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit rule',
        ariaLabel: 'Edit rule',
        color: 'default',
        action: 'edit',
      },
    ];
  }

  private loadLookups(): void {
    forkJoin({
      groups: this.service.getAntigenGroups().pipe(catchError(() => of([]))),
      filterOptions: this.service.getFilterOptions().pipe(catchError(() => of([]))),
      serTestIds: this.service.getTestIds('SER').pipe(catchError(() => of([]))),
      molTestIds: this.service.getTestIds('MOL').pipe(catchError(() => of([]))),
      labelingAntigens: this.service.getLabelingAntigens().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ groups, filterOptions, serTestIds, molTestIds, labelingAntigens }) => {
        this.antigenGroups = groups;
        this.allFilterOptions = filterOptions;
        this.serTestIds = serTestIds;
        this.molTestIds = molTestIds;
        this.labelingAntigens = labelingAntigens;
      });
  }

  get filteredAntigenCodes(): string[] {
    if (!this.selectedAntigenGroup) return [];
    return this.allFilterOptions
      .filter(o => o.antigenGroup === this.selectedAntigenGroup)
      .map(o => o.antigenCode);
  }

  onAntigenGroupChange(): void {
    this.selectedAntigenCode = null;
  }

  get isRetrieveDisabled(): boolean {
    return !this.selectedAntigenGroup || !this.selectedAntigenCode;
  }

  get isClearAllDisabled(): boolean {
    return !this.selectedAntigenGroup && !this.selectedAntigenCode && !this.showTerminated;
  }

  clearAll(): void {
    this.selectedAntigenGroup = null;
    this.selectedAntigenCode = null;
    this.showTerminated = false;
    this.searchText = '';
    this.dataSource = [];
    this.expandedRows.clear();
    this.hasRetrieved = false;
    this.hasError = false;
    this.errorMessage = '';
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }
  }

  retrieve(): void {
    if (this.isRetrieveDisabled) return;
    this.isLoading = true;
    this.hasRetrieved = false;
    this.hasError = false;
    this.errorMessage = '';
    this.searchText = '';
    this.dataSource = [];
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.expandedRows.clear();
    this.loadData();
  }

  loadData(): void {
    const { pageIndex = 0, pageSize = 25 } = this.tableConfig.pagination || {};

    // #7: resolve chapter local date from service
    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate().format('YYYY-MM-DD');

    const { column: sortCol, direction: sortDir } = this.tableConfig.sortConfig || {};
    const isSortActive = sortDir && sortDir !== 'default';

    const request: AntigenConfigRulesSearchRequest = {
      antigenGroup: this.selectedAntigenGroup,
      antigenCode: this.selectedAntigenCode,
      showTerminated: this.showTerminated ? 'Y' : 'N',
      chapterLocalDate,
      searchText: this.searchText || null,
      sortColumn:    isSortActive ? sortCol : null,
      sortDirection: isSortActive ? (sortDir === 'A' ? 'ASC' : 'DESC') : null,
    };

    this.service
      .search(pageSize, pageIndex * pageSize, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ data, total }) => {
          this.dataSource = data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = total;
          }
          this.isLoading = false;
          this.hasRetrieved = true;
          this.hasError = false;
        },
        error: (err: any) => {
          this.isLoading = false;
          this.hasRetrieved = true;
          this.hasError = true;
          this.errorMessage = err?.error?.message || 'Failed to load rules. Please try again.';
        },
      });
  }

  onSearch(text: string): void {
    this.searchText = text.trim();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onRowExpandToggle(row: AntigenConfigRule): void {
    const key = row.primaryRuleId;
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
    this.expandedRows = new Set(this.expandedRows);
  }

  onRowAction(event: TableRowActionEvent<AntigenConfigRule>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    }
  }

  openAddPanel(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  private openEditPanel(rule: AntigenConfigRule): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = rule;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    const message = this.sidePanelMode === 'add'
      ? 'New Primary Rule and Details Added successfully.'
      : 'Primary Rule and Details Updated successfully.';
    this.showSuccess(message);
    this.loadData();
  }

  // #1: format date using chapter timezone instead of browser timezone
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const m = moment.utc(dateStr);
    if (!m.isValid()) return '-';
    const localM = this.chapterTimezoneService.convertGmtToLocal(m);
    const day = String(localM.date()).padStart(2, '0');
    const monthStr = localM.format('MMM').toUpperCase();
    return `${day}-${monthStr}-${localM.year()}`;
  }

  getTestTypeDisplay(type: string): string {
    return this.testTypeDisplay[type] ?? type;
  }

  getLicDisplay(flag: string): string {
    return this.licDisplay[flag] ?? flag;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      panelClass: ['snack-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 6000,
      panelClass: ['snack-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
