import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  signal,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { HHResponseGroupsService } from './services/hh-response-groups.service';
import {
  HHResponseGroupModel,
  HHResponseParamsDto,
  HHQuestionModel
} from './models/hh-response-groups.model';

import { HeaderService } from '@shared/services/header.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { HHResponseFilterChipsUtils } from './utils/filter-chips.utils';
import { HHResponseFilterPanel } from './hh-response-filter-panel/hh-response-filter-panel';
import { AddEditHHResponseGroup } from './add-edit-hh-response-group/add-edit-hh-response-group';
import { MenuService } from '@shared/services/menu.service';
import { RouteKey } from '../../../../../core/constants/route-keys';
import { ROUTE_REGISTRY } from '../../../../../core/constants/route-registry';
import { ROUTES } from '../../../../../core/constants/route.constants';

/**
 * Define HH Response Groups Component
 * Manages health history response groups for narrowing questionnaire answer selections
 */
@Component({
  selector: 'app-define-hh-response-groups',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    HHResponseFilterPanel,
    AddEditHHResponseGroup
  ],
  templateUrl: './define-hh-response-groups.html',
  styleUrls: ['./define-hh-response-groups.scss']
})
export class DefineHHResponseGroups implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  // Page Configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  sidebarSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Question or Code',
    minLength: 2,
    ariaLabel: 'Search questions by question text or code',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<HHResponseGroupModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 50,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [50],
      showFirstLastButtons: false
    },
    sortConfig: {
      column: 'groupCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: false // Hide pagination controls for infinite scroll
  };

  selectedQuestionFromSidebar: string | null = null;
  selectedQuestionResponseCode: string | null = null;

  // Data & State
  dataSource: HHResponseGroupModel[] = [];
  requestState: HHResponseParamsDto = {};
  isLoading = false;

  // Infinite Scroll State
  isLoadingMore = false;
  hasMoreData = true;
  totalRecords = 0;
  readonly BATCH_SIZE = 50;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: HHResponseGroupModel | null = null;
  sidePanelQuestionCode: string | null = null;
  sidePanelResponseCode: string | null = null;

  // Card Response Code filter (independent from sidebar filter)
  cardResponseCode: string | null = null;

  // Sidebar (Question List)
  sidebarOpen = true;
  questionsList = signal<HHQuestionModel[]>([]);
  questionSearchText = '';
  appliedQuestionSearchText = '';

  // Sidebar Filter
  sidebarFilterOpen = false;
  sidebarFilterResponseCode: string | null = null;
  sidebarFilterChips: FilterChip[] = [];

  // Chapter ID from user context
  currentChapterId: string = '';

  private destroy$ = new Subject<void>();
  private menuService = inject(MenuService);

  constructor(
    private hhResponseService: HHResponseGroupsService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    // Reactively update chapterId when HeaderService signal changes
    effect(() => {
      this.currentChapterId = this.headerService.chapterId();
    });

    // Reactively update header config from menu-items API
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.DefineHHResponseGroups].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadQuestionsList();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes from header and reset component state
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear state
        this.requestState = {};

        // Clear data
        this.dataSource = [];
        this.hasMoreData = true;
        this.totalRecords = 0;

        // Close panels
        this.closeSidePanel();

        // Clear sidebar state
        this.selectedQuestionFromSidebar = null;
        this.selectedQuestionResponseCode = null;
        this.cardResponseCode = null;
        this.questionSearchText = '';
        this.appliedQuestionSearchText = '';
        this.sidebarFilterResponseCode = null;
        this.sidebarFilterChips = [];
        this.sidebarFilterOpen = false;
        this.questionsList.set([]);

        // Reload questions for new chapter
        this.loadQuestionsList();
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: 'Define HH Response Groups',
          link: null
        }
      ],
      title: 'Define HH Response Groups',
      subtitle: 'Define groups of health history responses to narrow questionnaire answer selections.',
      actions: [] // Removed - button moved to action bar below filters
    };

    this.searchConfig = {
      placeholder: 'Search by Group or Description',
      minLength: 2,
      ariaLabel: 'Search response groups by group code or description',
      searchOnEnterOnly: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 50,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [50],
        showFirstLastButtons: false
      },
      sortConfig: {
        column: 'groupCode',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No records found.',
      loadingMessage: 'Loading response groups...',
      showPagination: false // Hide pagination for infinite scroll
    };
  }

  private getTableColumns(): TableColumn<HHResponseGroupModel>[] {
    return [
      {
        key: 'groupCode',
        header: 'Group',
        sortable: true,
        width: '150px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '350px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => value ? this.formatDate(value) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<HHResponseGroupModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit response group',
        ariaLabel: 'Edit response group {{groupCode}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private loadQuestionsList(responseCode?: string): void {
    this.hhResponseService.getQuestionsList(responseCode || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          // Ensure it's always an array
          const questionsArray = Array.isArray(questions) ? questions : [];
          this.questionsList.set(questionsArray);
        },
        error: (error) => {
          // Set empty array on error
          this.questionsList.set([]);
        }
      });
  }

  loadData(showLoading: boolean = true, appendMode: boolean = false): void {
    // Prevent duplicate requests
    if (this.isLoading || this.isLoadingMore) {
      return;
    }

    // If appending and no more data, don't make request
    if (appendMode && !this.hasMoreData) {
      return;
    }

    if (showLoading) {
      if (appendMode) {
        this.isLoadingMore = true;
      } else {
        this.isLoading = true;
      }
    }

    const skip = appendMode ? this.dataSource.length : 0;
    const take = this.BATCH_SIZE;

    this.hhResponseService
      .getResponseGroups(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Ensure dataSource is always an array
          const dataArray = Array.isArray(response?.data) ? response.data : [];

          if (appendMode) {
            this.dataSource = [...this.dataSource, ...dataArray];
          } else {
            this.dataSource = dataArray;
          }

          this.totalRecords = response?.totalRecords || 0;
          this.hasMoreData = this.dataSource.length < this.totalRecords;
          this.updatePagination({ totalRecords: this.totalRecords });

          this.isLoading = false;
          this.isLoadingMore = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.isLoadingMore = false;

          if (!appendMode) {
            this.dataSource = [];
            this.updatePagination({ totalRecords: 0 });
          }

          // Handle 400 Bad Request - display backend validation errors
          if (error.status === 400 && error.error) {
            const errorResponse = error.error;
            let displayMessage = '';

            // Check if multiple field errors are returned in 'errors' array
            if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
              // Format: Multiple validation errors with field-specific error codes
              const errorMessages = errorResponse.errors.map((err: any) => {
                if (err.errorCode && err.message) {
                  return `[${err.errorCode}] ${err.message}`;
                } else if (typeof err === 'string') {
                  // Handle simple string format: "FieldName: Message"
                  return err;
                }
                return err.message || JSON.stringify(err);
              });

              // Show all errors or just first one
              if (errorMessages.length === 1) {
                displayMessage = errorMessages[0];
              } else {
                displayMessage = errorMessages[0]; // Show first error for retrieve operation
              }
            }
            // Check for single error with errorCode and message
            else if (errorResponse.errorCode && errorResponse.message) {
              displayMessage = `Error ${errorResponse.errorCode}: ${errorResponse.message}`;
            }
            // Fallback to just message
            else if (errorResponse.message) {
              displayMessage = errorResponse.message;
            }
            // Last resort
            else {
              displayMessage = 'Validation error occurred';
            }

            this.snackBar.open(displayMessage, 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        }
      });
  }

  /**
   * Reset infinite scroll state for fresh load
   */
  private resetInfiniteScroll(): void {
    this.dataSource = [];
    this.hasMoreData = true;
    this.totalRecords = 0;
    this.updatePagination({ pageIndex: 0 });
  }

  /**
   * Load more data when scrolling (infinite scroll)
   */
  loadMoreData(): void {
    if (!this.hasMoreData || this.isLoadingMore || this.isLoading) {
      return;
    }

    this.loadData(true, true); // appendMode = true
  }

  /**
   * Handle scroll event on table to trigger infinite scroll
   */
  onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // Calculate how close to bottom (trigger when 80% scrolled)
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage > 0.8 && this.hasMoreData && !this.isLoadingMore) {
      this.loadMoreData();
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.requestState.sort = undefined;
    } else if (event.direction === 'A') {
      this.requestState.sort = 'A';
    } else if (event.direction === 'D') {
      this.requestState.sort = 'D';
    }

    this.resetInfiniteScroll();
    this.loadData(); // Show loading indicator when sorting
  }

  onRowAction(event: TableRowActionEvent<HHResponseGroupModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelQuestionCode = this.selectedQuestionFromSidebar;
    this.sidePanelResponseCode = this.cardResponseCode;
    this.sidePanelOpen = true;
  }

  editRecord(record: HHResponseGroupModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelQuestionCode = null;
    this.sidePanelResponseCode = null;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.sidePanelQuestionCode = null;
    this.sidePanelResponseCode = null;
  }

  onSaveSuccess(event: { response: any; keepOpen: boolean }): void {
    const message = event.response?.message || 'Response group saved successfully';

    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });

    // Close side panel only if keepOpen is false
    if (!event.keepOpen) {
      this.closeSidePanel();
    }

    // Reset infinite scroll and reload data
    this.resetInfiniteScroll();
    this.loadData();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onQuestionClick(question: HHQuestionModel): void {
    this.selectedQuestionFromSidebar = question.questionCode;
    this.selectedQuestionResponseCode = null;
    this.loadGroupsIfReady();
  }

  onQuestionSearchEnter(): void {
    if (this.questionSearchText.length >= 2) {
      this.appliedQuestionSearchText = this.questionSearchText;
    } else if (this.questionSearchText.length === 0) {
      this.appliedQuestionSearchText = '';
    }
  }

  onSidebarSearch(searchText: string): void {
    this.questionSearchText = searchText;
    this.appliedQuestionSearchText = searchText;
  }

  getFilteredQuestions(): HHQuestionModel[] {
    const questions = this.questionsList();
    if (!this.appliedQuestionSearchText) {
      return questions;
    }

    const searchLower = this.appliedQuestionSearchText.toLowerCase();
    return questions.filter(q =>
      q.questionCode.toLowerCase().includes(searchLower) ||
      q.questionText.toLowerCase().includes(searchLower)
    );
  }

  onCardResponseCodeChange(value: string | null): void {
    this.cardResponseCode = value;

    if (this.selectedQuestionFromSidebar) {
      this.loadGroupsIfReady();
    }
  }

  toggleSidebarFilter(): void {
    this.sidebarFilterOpen = !this.sidebarFilterOpen;
  }

  onSidebarFilterApply(filter: any): void {
    this.sidebarFilterResponseCode = filter.responseCode || null;
    this.sidebarFilterOpen = false;
    // Clear current question selection, search, and groups
    this.selectedQuestionFromSidebar = null;
    this.selectedQuestionResponseCode = null;
    this.questionSearchText = '';
    this.appliedQuestionSearchText = '';
    this.dataSource = [];

    // Clear questionCode and responseCode from requestState
    const { questionCode, responseCode, ...rest } = this.requestState;
    this.requestState = rest;

    // Update sidebar filter chips
    this.updateSidebarFilterChips();

    if (this.sidebarFilterResponseCode) {
      this.loadQuestionsList(this.sidebarFilterResponseCode);
    } else {
      this.loadQuestionsList();
    }
  }

  onRemoveSidebarFilterChip(chipKey: string): void {
    if (chipKey === 'sidebarResponseCode') {
      this.sidebarFilterResponseCode = null;
      this.sidebarFilterChips = [];
      this.selectedQuestionFromSidebar = null;
      this.selectedQuestionResponseCode = null;
      this.dataSource = [];

      const { questionCode, responseCode, ...rest } = this.requestState;
      this.requestState = rest;

      this.loadQuestionsList();
    }
  }

  onClearSidebarFilters(): void {
    this.sidebarFilterResponseCode = null;
    this.sidebarFilterChips = [];
    this.selectedQuestionFromSidebar = null;
    this.dataSource = [];

    const { questionCode, responseCode, ...rest } = this.requestState;
    this.requestState = rest;

    this.loadQuestionsList();
  }

  private getResponseCodeLabel(code: string): string {
    const labels: Record<string, string> = { Y: 'Yes', N: 'No', U: 'Unknown' };
    return labels[code] || code;
  }

  private updateSidebarFilterChips(): void {
    if (this.sidebarFilterResponseCode) {
      this.sidebarFilterChips = [{
        key: 'sidebarResponseCode',
        label: `Response Code: ${this.getResponseCodeLabel(this.sidebarFilterResponseCode)}`,
        value: this.sidebarFilterResponseCode
      }];
    } else {
      this.sidebarFilterChips = [];
    }
  }

  private loadGroupsIfReady(): void {
    const questionCode = this.selectedQuestionFromSidebar;

    if (questionCode) {
      this.requestState = {
        ...this.requestState,
        questionCode,
        responseCode: this.cardResponseCode || undefined
      };
      this.resetInfiniteScroll();
      this.loadData();
    }
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';

    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Update pagination config immutably to trigger change detection
   */
  private updatePagination(updates: Partial<{ pageIndex: number; pageSize: number; totalRecords: number }>): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        ...updates
      }
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+C: Create new record (only when prerequisites are met)
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      if (this.selectedQuestionFromSidebar && this.cardResponseCode) {
        this.createRecord();
      }
    }

    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
