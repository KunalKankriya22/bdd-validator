import { Component, OnInit, OnDestroy, HostListener, ViewChild, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, merge, takeUntil, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { ExternalBcDataTranslateService } from './services/external-bc-data-translate.service';
import {
  ExternalBcDataTranslateModel,
  ExternalBcDataTranslateParamsDto,
  CodeDescriptionOption
} from './models/external-bc-data-translate.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
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
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ExternalBcDataTranslateFilterPanel, ExternalBcDataTranslateFilterFormValue } from './filter-panel/filter-panel';
import { ExternalBcDataTranslateFilterChipsUtils } from './utils/filter-chips.utils';
import { AddEditConversionCode } from './add-edit-conversion-code/add-edit-conversion-code';
import { NotificationService } from '@shared/services/notification.service';
import { EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES } from './constants/error-messages.constants';

@Component({
  selector: 'app-external-bc-data-translate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    OverlayModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    ExternalBcDataTranslateFilterPanel,
    AddEditConversionCode
  ],
  templateUrl: './external-bc-data-translate.html',
  styleUrls: ['./external-bc-data-translate.scss']
})
export class ExternalBcDataTranslateComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 1,
    ariaLabel: '',
    alwaysShowTooltip: true,
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<ExternalBcDataTranslateModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'sourceCodeType',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: ExternalBcDataTranslateFilterFormValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ExternalBcDataTranslateModel[] = [];
  requestState: ExternalBcDataTranslateParamsDto = {};

  isLoading = false;
  hasError = false;
  hasRetrieved = false;
  errorMessage = '';

  // Primary Search Controls
  sourceIdOptions: CodeDescriptionOption[] = [];
  targetIdOptions: CodeDescriptionOption[] = [];
  sourceCodeTypeOptions: CodeDescriptionOption[] = [];
  targetCodeTypeOptions: CodeDescriptionOption[] = [];
  sourceIdCtrl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  targetIdCtrl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });

  // Search controls for dropdowns
  sourceIdSearchCtrl = new FormControl('');
  targetIdSearchCtrl = new FormControl('');

  // Signals for filtered options
  sourceIdOptionsSignal = signal<CodeDescriptionOption[]>([]);
  targetIdOptionsSignal = signal<CodeDescriptionOption[]>([]);

  // Convert FormControl values to signals
  sourceIdSearchSignal = toSignal(this.sourceIdSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  targetIdSearchSignal = toSignal(this.targetIdSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredSourceIdOptions = computed(() => {
    const searchTerm = this.sourceIdSearchSignal()?.toLowerCase() || '';
    const options = this.sourceIdOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm)
    );
  });

  filteredTargetIdOptions = computed(() => {
    const searchTerm = this.targetIdSearchSignal()?.toLowerCase() || '';
    const options = this.targetIdOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm)
    );
  });

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ExternalBcDataTranslateModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private filterDropdownsRequest$ = new Subject<void>();

  constructor(
    private externalBcDataTranslateService: ExternalBcDataTranslateService,
    private notificationService: NotificationService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
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
          subtitle: pageData.subtitle || '',
          actions: [{
            label: 'ADD NEW CONVERSION CODE',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Create new conversion code',
            disabled: !this.hasRetrieved || !this.sourceIdCtrl.value || !this.targetIdCtrl.value,
            onClick: () => this.createRecord()
          }]
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.subscribeToChapterChanges();
    this.subscribeToAddButtonState();
  }

  ngOnDestroy(): void {
    this.filterDropdownsRequest$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter change events from HeaderService
   * When chapter changes, reset the page state and reload dropdowns
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleChapterChange();
      });
  }

  private subscribeToAddButtonState(): void {
    merge(
      this.sourceIdCtrl.valueChanges,
      this.targetIdCtrl.valueChanges
    ).pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasRetrieved = false;
        this.updateAddButtonState();
      });
  }

  private updateAddButtonState(): void {
    const disabled = !this.hasRetrieved || !this.sourceIdCtrl.value || !this.targetIdCtrl.value;
    if (this.headerConfig.actions?.length) {
      this.headerConfig.actions[0].disabled = disabled;
    }
  }

  /**
   * Handle chapter change event
   * Resets all filters, search, pagination, and reloads dropdowns
   * User must re-enter Target ID to retrieve data for new chapter
   */
  private handleChapterChange(): void {
    // Clear search
    delete this.requestState.searchKeyword;
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }

    // Clear filters
    this.appliedFilters = null;
    this.filterChips = [];
    delete this.requestState.sourceCodeType;
    delete this.requestState.targetCodeType;

    // Reset dropdowns to initial state
    this.sourceIdCtrl.reset();
    this.targetIdCtrl.reset();

    // Close side panel if open
    if (this.sidePanelOpen) {
      this.sidePanelOpen = false;
      this.sidePanelData = null;
    }

    // Close filter panel if open
    if (this.isFilterOpen) {
      this.isFilterOpen = false;
    }

    // Reset pagination
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }

    // Clear table data (user must re-enter Target ID to retrieve)
    this.dataSource = [];
    this.hasError = false;
    this.hasRetrieved = false;

    // Reload dropdowns for new chapter context
    this.loadDropdowns();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/'
        },
        {
          label: 'Application Administration',
          link: null
        },
        {
          label: 'External to Blood Center Data Translate',
          link: null
        }
      ],
      title: 'External to Blood Center Data Translate',
      subtitle: '',
      actions: [{
        label: 'ADD NEW CONVERSION CODE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new conversion code',
        disabled: true,
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Source Type',
      minLength: 1,
      ariaLabel: 'Search conversion codes by source type',
      alwaysShowTooltip: true,
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
        column: 'sourceCodeType',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No conversion codes available to display',
      loadingMessage: 'Loading conversion code data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ExternalBcDataTranslateModel>[] {
    return [
      {
        key: 'sourceCodeType',
        header: 'Source Type',
        sortable: true,
        width: '150px'
      },
      {
        key: 'sourceValue',
        header: 'Source Value',
        width: '150px'
      },
      {
        key: 'targetCodeType',
        header: 'Target Type',
        width: '150px'
      },
      {
        key: 'targetValue',
        header: 'Target Value',
        width: '150px'
      },
      {
        key: 'convProcCall',
        header: 'Procedure Count',
        width: '140px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<ExternalBcDataTranslateModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit conversion code',
        ariaLabel: 'Edit conversion code {{sourceType}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadDropdowns(): void {
    // Load Source ID and Target ID from main dropdowns endpoint (ALL valid values for main page)
    this.externalBcDataTranslateService
      .getDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Main page dropdowns - show ALL valid values from VALID_MASTER_CODES
          this.sourceIdOptions = response.sourceIds || [];
          this.targetIdOptions = response.targetIds || [];

          // Update signals for filtered dropdowns
          this.sourceIdOptionsSignal.set(this.sourceIdOptions);
          this.targetIdOptionsSignal.set(this.targetIdOptions);
        },
        error: (error) => {          
          this.notificationService.showError(EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.LOAD_DROPDOWNS_FAILED);
        }
      });
  }

  /**
   * Load filter panel dropdowns based on currently selected Source ID and Target ID
   * Only call this after Source ID and Target ID are selected to get relevant filter options
   */
  loadFilterDropdowns(): void {
    // Only load filter dropdowns if Target ID is selected
    if (!this.targetIdCtrl.value) {
      return;
    }

    const sourceId = this.sourceIdCtrl.value || 'ALL';

    // Cancel any prior in-flight request to prevent race condition
    this.filterDropdownsRequest$.next();

    this.externalBcDataTranslateService
      .getFilterDropdowns(sourceId, this.targetIdCtrl.value)
      .pipe(
        takeUntil(this.filterDropdownsRequest$),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          // Filter panel dropdowns - show only values with actual data for selected Source/Target IDs
          this.sourceCodeTypeOptions = response.sourceCodeTypes || [];
          this.targetCodeTypeOptions = response.targetCodeTypes || [];
        },
        error: (error) => {
          this.notificationService.showError(EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.LOAD_DROPDOWNS_FAILED);
        }
      });
  }

  loadData(): void {
    // Require targetId to be entered before fetching data
    if (!this.targetIdCtrl.value) {
      this.dataSource = [];
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.totalRecords = 0;
      }
      return;
    }

    // If no source ID is selected, default to "ALL"
    const sourceId = this.sourceIdCtrl.value || 'ALL';

    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.externalBcDataTranslateService
      .getExternalBcDataTranslate(take, skip, sourceId, this.targetIdCtrl.value, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: ExternalBcDataTranslateModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.LOAD_DATA_FAILED;
          this.notificationService.showError(EXTERNAL_BC_DATA_TRANSLATE_ERROR_MESSAGES.LOAD_DATA_FAILED);
        }
      });
  }

  onRetrieve(): void {
    this.sourceIdCtrl.markAsTouched();
    this.targetIdCtrl.markAsTouched();

    if (!this.sourceIdCtrl.value || !this.targetIdCtrl.value) {
      return;
    }

    // Close side panel if open - data context (source/target) may have changed
    if (this.sidePanelOpen) {
      this.sidePanelOpen = false;
      this.sidePanelData = null;
    }

    // Close filter panel if open
    if (this.isFilterOpen) {
      this.isFilterOpen = false;
    }

    // Clear filters
    this.appliedFilters = null;
    this.filterChips = [];
    delete this.requestState.sourceCodeType;
    delete this.requestState.targetCodeType;

    // Clear search when retrieving new data
    delete this.requestState.searchKeyword;
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Load filter dropdowns based on selected Source ID and Target ID
    this.loadFilterDropdowns();

    this.hasRetrieved = true;
    this.updateAddButtonState();

    this.loadData();
  }


  onSearch(searchText: string): void {
    // Server-side search - filters by Source Code Type
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

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else {
      this.requestState.sort = event.direction;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ExternalBcDataTranslateModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = { sourceId: this.sourceIdCtrl.value, targetId: this.targetIdCtrl.value } as ExternalBcDataTranslateModel;
    this.sidePanelOpen = true;
  }

  editRecord(record: ExternalBcDataTranslateModel): void {
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

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilter(): void {
    this.isFilterOpen = false;
  }

  applyFilters(filters: ExternalBcDataTranslateFilterFormValue): void {
    this.appliedFilters = filters;
    this.filterChips = ExternalBcDataTranslateFilterChipsUtils.convertFiltersToChips(filters);

    // Clear search when applying filters
    delete this.requestState.searchKeyword;
    if (this.searchBarComponent) {
      this.searchBarComponent.searchText = '';
    }

    // Update request state with filter values
    if (filters.sourceId) {
      this.requestState.sourceCodeType = filters.sourceId;
    } else {
      delete this.requestState.sourceCodeType;
    }

    if (filters.targetId) {
      this.requestState.targetCodeType = filters.targetId;
    } else {
      delete this.requestState.targetCodeType;
    }

    // Reset to first page when applying filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilter();
    this.loadData();
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = ExternalBcDataTranslateFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ExternalBcDataTranslateFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters
    );

    // Update request state
    switch (chipKey) {
      case 'sourceId':
        delete this.requestState.sourceCodeType;
        break;
      case 'targetId':
        delete this.requestState.targetCodeType;
        break;
    }

    // Reset to first page when removing filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Clear all filter-related request state
    delete this.requestState.sourceCodeType;
    delete this.requestState.targetCodeType;

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  get hasActiveFilters(): boolean {
    return ExternalBcDataTranslateFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+C: Create new record
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    // Alt+F: Toggle filter panel
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.toggleFilter();
    }

    // Escape: Close side panel or filter if open
    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        event.preventDefault();
        this.closeSidePanel();
      } else if (this.isFilterOpen) {
        event.preventDefault();
        this.closeFilter();
      }
    }
  }
}