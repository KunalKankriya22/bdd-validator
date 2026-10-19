import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef, TemplateRef, ChangeDetectorRef, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ActivatedRoute } from '@angular/router';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableRowActionEvent,
  TableSortEvent,
  TablePageEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { MenuAccessFilterPanel } from '../menu-access-filter-panel/menu-access-filter-panel';
import { AccessClassesFilterPanel } from '../access-classes-filter-panel/access-classes-filter-panel';

import { MenuAccessFilterValue, AccessClassesFilterValue } from '../models/user-access-filters.model';
import { MenuAccessFilterChipsUtils } from '../utils/menu-access-filter-chips.utils';
import { AccessClassesFilterChipsUtils } from '../utils/access-classes-filter-chips.utils';

import { UserAccessService } from '../services/user-access.service';
import { ActiveUser, MenuItemsFilterRequest, AccessClassesFilterRequest } from '../models/user-access-api.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

interface MenuAccessRow {
  menuTitle: string;
  program: string;
  effectiveDate: string;
  terminationDate: string;
  modificationDate: string;
  otherUsers: number;
  mnemonic?: string; // Menu item mnemonic for API calls
}

interface AccessClassRow {
  class: string;
  description: string;
  accessLevel: string;
  usersInClass: number;
  effectiveDate: string;
  terminationDate: string;
  modificationDate: string;
}

interface OtherUser {
  userId: string;
  userName: string;
  groupId: string;
  groupDescription: string;
  accessLevel: string;
  effectiveDate: string;
  terminationDate?: string;
}

interface ClassInterdiction {
  type: string;
  code: string;
  description: string;
  accessLevel: string;
  effectiveDate: string;
}

@Component({
  selector: 'app-user-access-menus-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
  ],
  templateUrl: './user-access-menus-interdiction.html',
  styleUrl: './user-access-menus-interdiction.scss',
})
export class UserAccessMenusInterdiction implements AfterViewInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('drawer') drawer!: MatDrawer;
  @ViewChild('otherUsersCell', { static: true }) otherUsersCell!: TemplateRef<any>;
  @ViewChild('usersInClassCell', { static: true }) usersInClassCell!: TemplateRef<any>;

  form: FormGroup;

  // User dropdown
  userOptions = signal<ActiveUser[]>([]);
  readonly userSearchControl = new FormControl('');
  private readonly userSearch = signal('');

  readonly filteredUserOptions = computed(() => {
    const search = this.userSearch().toLowerCase();
    const options = this.userOptions();
    if (!search) return options;
    return options.filter(user => {
      const fullName = (user.firstName + ' ' + user.lastName).toLowerCase();
      const displayText = (user.userId + ' ' + user.firstName + ' ' + user.lastName).toLowerCase();
      return user.userId.toLowerCase().includes(search) ||
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        fullName.includes(search) ||
        displayText.includes(search);
    });
  });

  // Drawer state
  drawerTitle = '';
  drawerContext = '';
  drawerSubtitle = '';
  drawerData: (OtherUser | ClassInterdiction)[] = [];
  drawerColumns: TableColumn<any>[] = [];
  drawerType: 'users' | 'menu-users' | 'interdictions' = 'users';

  /** HEADER CONFIG */
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'User Access Menus & Interdiction', link: null }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  /** SEARCH STATE */
  hasSearched = false;
  isSearchFocused = false;
  isUserInfoLoading = false;

  /** USER INFO */
  userName = '';
  userCode = '';
  userGroup = '';
  userGroupDescription = '';
  userLevel = '';
  effectiveDate = '';
  terminationDate = '';

  /** TABS */
  selectedTabIndex = 0;

  /** TABLE CONFIGS */
  menuAccessTableConfig: DataTableConfig<MenuAccessRow> = {
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
      column: 'menuTitle',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No menu access records found',
    loadingMessage: 'Loading menu access data...',
    showPagination: true,
    menuPanelClass: 'user-access-menu-panel'
  };

  accessClassesTableConfig: DataTableConfig<AccessClassRow> = {
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
      column: 'class',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showActionsAsMenu: true,
    emptyMessage: 'No access classes found',
    loadingMessage: 'Loading access classes data...',
    showPagination: true,
    menuPanelClass: 'user-access-menu-panel'
  };

  drawerTableConfig: DataTableConfig<any> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100, 1000],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'userId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: 'No records found',
    loadingMessage: 'Loading data...',
    showPagination: false
  };

  // Drawer context for API calls (store parameters needed to reload drawer data)
  drawerContext_mnemonic = '';
  drawerContext_userId = '';
  drawerContext_accessClass = '';
  drawerContext_description = '';
  isDrawerLoading = false;

  /** HIGHLIGHTED ROW STATE */
  highlightedMenuAccessRow: MenuAccessRow | null = null;
  highlightedAccessClassRow: AccessClassRow | null = null;

  /** DATA SOURCES */
  menuAccessData: MenuAccessRow[] = [];
  accessClassesData: AccessClassRow[] = [];

  /** FILTERED DATA FOR TABLE SEARCH */
  filteredMenuAccessData: MenuAccessRow[] = [];
  filteredAccessClassesData: AccessClassRow[] = [];

  /** TABLE SEARCH STATE */
  tableSearchText = '';
  // Separate search text for each tab to maintain state when switching
  menuAccessSearchText = '';
  accessClassesSearchText = '';

  // Separate loading flags for each tab to prevent race conditions
  isMenuAccessLoading = false;
  isAccessClassesLoading = false;

  // Filter Panel State
  private overlayRef: OverlayRef | null = null;
  private filterButtonElement: HTMLElement | null = null;
  isFilterOpen = false;

  // Applied filters for each tab
  menuAccessFilters: MenuAccessFilterValue | null = null;
  accessClassesFilters: AccessClassesFilterValue | null = null;

  // Filter chips for each tab
  menuAccessFilterChips: FilterChip[] = [];
  accessClassesFilterChips: FilterChip[] = [];

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private pageHeaderService = inject(PageHeaderService);

  constructor(
    private fb: FormBuilder,
    private overlay: Overlay,
    private userAccessService: UserAccessService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      userId: [null]
    });

    this.userSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.userSearch.set(value || ''));

    // Reactively update header config from menu-items API via PageHeaderService
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ]
        };
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeTableConfigs();
    this.cdr.detectChanges();
    this.setupDebouncedSearch();
    this.loadUsersDropdown();
    this.subscribeToChapterChanges();
    this.cdr.detectChanges();

    // Check for userId query parameter and auto-populate
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const userId = params['userId'];
        if (userId && !this.hasSearched) {
          this.form.patchValue({ userId: userId });
          this.cdr.detectChanges(); // Trigger change detection after form update
          // Trigger retrieve after a short delay to ensure view is ready
          setTimeout(() => {
            this.onRetrieve();
          }, 100);
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      });
  }

  private setupDebouncedSearch(): void {
    // Set up debounced search with 300ms delay to prevent multiple API calls
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchText) => {
        this.performSearch(searchText);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeTableConfigs(): void {
    // Menu Access Table Configuration
    this.menuAccessTableConfig = {
      ...this.menuAccessTableConfig,
      columns: this.getMenuAccessColumns(),
      rowActions: this.getMenuAccessRowActions()
    };

    // Access Classes Table Configuration
    this.accessClassesTableConfig = {
      ...this.accessClassesTableConfig,
      columns: this.getAccessClassesColumns(),
      rowActions: this.getAccessClassesRowActions()
    };

    // Drawer Table Configuration
    this.drawerColumns = this.getDrawerColumns();
  }

  private getDrawerColumns(): TableColumn<OtherUser>[] {
    return [
      {
        key: 'userId',
        header: 'User ID',
        sortable: true,
        width: '100px'
      },
      {
        key: 'userName',
        header: 'User Name',
        sortable: false,
        width: '110px'
      },
      {
        key: 'groupId',
        header: 'Group ID',
        sortable: false,
        width: '90px'
      },
      {
        key: 'groupDescription',
        header: 'Group Description',
        sortable: false,
        width: '180px'
      },
      {
        key: 'accessLevel',
        header: 'Access Level',
        sortable: false,
        width: '100px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '110px'
      }
    ];
  }

  private getAccessClassUsersDrawerColumns(): TableColumn<OtherUser>[] {
    return [
      ...this.getDrawerColumns(),
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '120px'
      }
    ];
  }

  private getInterdictionsDrawerColumns(): TableColumn<ClassInterdiction>[] {
    return [
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        width: '80px'
      },
      {
        key: 'code',
        header: 'Code',
        sortable: false,
        width: '100px'
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        width: '250px'
      },
      {
        key: 'accessLevel',
        header: 'Access Level',
        sortable: false,
        width: '100px'
      },
      {
        key: 'effectiveDate',
        header: 'Insert Date',
        sortable: false,
        width: '110px'
      }
    ];
  }

  private getMenuAccessColumns(): TableColumn<MenuAccessRow>[] {
    return [
      {
        key: 'menuTitle',
        header: 'Menu Title',
        sortable: true,
        width: '300px'
      },
      {
        key: 'program',
        header: 'Program',
        sortable: false,
        width: '150px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px'
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px'
      },
      {
        key: 'otherUsers',
        header: 'Other Users',
        sortable: false,
        width: '120px',
        cellTemplate: this.otherUsersCell
      }
    ];
  }

  private getMenuAccessRowActions(): RowAction<MenuAccessRow>[] {
    return [
      {
        icon: 'visibility',
        label: 'View other users',
        ariaLabel: 'View other users for {{menuTitle}}',
        color: 'default',
        action: 'view'
      }
    ];
  }

  private getAccessClassesColumns(): TableColumn<AccessClassRow>[] {
    return [
      {
        key: 'class',
        header: 'Class',
        sortable: true,
        width: '120px'
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        width: '300px'
      },
      {
        key: 'accessLevel',
        header: 'Access Level',
        sortable: false,
        width: '120px'
      },
      {
        key: 'usersInClass',
        header: 'Users in Class',
        sortable: false,
        width: '130px',
        cellTemplate: this.usersInClassCell
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px'
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        width: '150px'
      }
    ];
  }

  private getAccessClassesRowActions(): RowAction<AccessClassRow>[] {
    return [
      {
        label: 'View Attached Users List',
        ariaLabel: 'View attached users list for {{class}}',
        color: 'default',
        action: 'view-users'
      },
      {
        label: 'View Associated Interdictions',
        ariaLabel: 'View associated interdictions for {{class}}',
        color: 'default',
        action: 'view-interdictions'
      }
    ];
  }

  private loadUsersDropdown(): void {
    this.userAccessService.getActiveUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.userOptions.set(users);
          this.cdr.markForCheck();
        },
        error: () => {
          this.userOptions.set([]);
        }
      });
  }

  onRetrieve(): void {
    const userId = this.form.value.userId?.trim();
    if (!userId) return;

    this.hasSearched = true;
    this.isUserInfoLoading = true;

    // Reset tab state on new retrieve
    this.tableSearchText = '';
    this.menuAccessSearchText = '';
    this.accessClassesSearchText = '';
    this.menuAccessFilters = null;
    this.accessClassesFilters = null;
    this.menuAccessFilterChips = [];
    this.accessClassesFilterChips = [];
    this.selectedTabIndex = 0;

    // Reset pagination
    if (this.menuAccessTableConfig.pagination) {
      this.menuAccessTableConfig.pagination.pageIndex = 0;
    }
    if (this.accessClassesTableConfig.pagination) {
      this.accessClassesTableConfig.pagination.pageIndex = 0;
    }

    // Load menu access data (Menu Access tab)
    this.loadMenuAccessData(userId);

    // Load access classes data (Access Classes tab)
    this.loadAccessClassesData(userId);
  }

  /**
   * Build filter request parameters from filters, search, and sort
   */
  private buildMenuAccessFilterRequest(): MenuItemsFilterRequest {
    const filters: MenuItemsFilterRequest = {};

    // Add search keyword (always include, even if empty, to ensure API filtering works correctly)
    filters.searchKeyword = this.tableSearchText || '';

    // Add filters from filter panel
    if (this.menuAccessFilters) {
      if (this.menuAccessFilters.menuTitle) {
        filters.menuTitle = this.menuAccessFilters.menuTitle;
      }
      if (this.menuAccessFilters.program) {
        filters.program = this.menuAccessFilters.program;
      }
      if (this.menuAccessFilters.effectiveDate) {
        filters.effectiveDate = this.menuAccessFilters.effectiveDate as string;
        filters.effectiveDatePeriod = this.menuAccessFilters.effectiveDatePeriod === 'After' ? 'AFTER' : 'BEFORE';
      }
      if (this.menuAccessFilters.terminationDate) {
        filters.terminationDate = this.menuAccessFilters.terminationDate as string;
        filters.terminationDatePeriod = this.menuAccessFilters.terminationDatePeriod === 'After' ? 'AFTER' : 'BEFORE';
      }
    }

    // Add sort parameter
    if (this.menuAccessTableConfig.sortConfig && this.menuAccessTableConfig.sortConfig.direction !== 'default') {
      filters.sort = this.menuAccessTableConfig.sortConfig.direction;
    }

    return filters;
  }

  /**
   * Load menu access data from API with filters, search, and sorting
   */
  private loadMenuAccessData(userId: string): void {
    this.isMenuAccessLoading = true;

    // Calculate skip and take from pagination config
    const skip =
      (this.menuAccessTableConfig.pagination?.pageIndex || 0) *
      (this.menuAccessTableConfig.pagination?.pageSize || 25);
    const take = this.menuAccessTableConfig.pagination?.pageSize || 25;

    // Build filter parameters
    const filterRequest = this.buildMenuAccessFilterRequest();

    // Fetch user group details first
    this.userAccessService
      .getUserGroupDetails(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groupDetailsResponse) => {
          if (groupDetailsResponse.item) {
            const groupDetails = groupDetailsResponse.item;
            this.userCode = groupDetails.userId;
            this.userGroup = groupDetails.groupId;
            this.userGroupDescription = groupDetails.groupDescription;
            this.userLevel = groupDetails.accessLevel.toString();
            this.effectiveDate = this.userAccessService.formatDate(groupDetails.effectiveDate);
            this.terminationDate = groupDetails.terminationDate
              ? this.userAccessService.formatDate(groupDetails.terminationDate)
              : '';
          }
          this.isUserInfoLoading = false;
        },
        error: (error) => {
          console.error('Error loading user group details:', error);
          // Set default values if group details fail
          this.userCode = userId.toUpperCase();
          this.userName = userId;
          this.userGroup = '';
          this.userGroupDescription = '';
          this.userLevel = '';
          this.effectiveDate = '';
          this.terminationDate = '';
          this.isUserInfoLoading = false;
        }
      });

    // API call to get user access menu items with filters and pagination
    this.userAccessService
      .getUserMenuItems(userId, take, skip, filterRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update pagination total records
          if (this.menuAccessTableConfig.pagination) {
            this.menuAccessTableConfig.pagination.totalRecords = response.total || 0;
          }

          // Check if we have data
          if (!response.data || response.data.length === 0) {
            console.warn('No menu items found for user:', userId);

            // Clear only Menu Access tab data (don't touch other tabs' state to avoid race condition)
            this.menuAccessData = [];
            this.filteredMenuAccessData = [];

            this.isMenuAccessLoading = false;
            return;
          }

          // Set user name from first item
          this.userName = userId;

          // Map menu items from API
          this.menuAccessData = response.data.map(item => ({
            menuTitle: item.menuTitle,
            program: item.program,
            effectiveDate: this.userAccessService.formatDate(item.effectiveDate),
            terminationDate: this.userAccessService.formatDate(item.terminationDate),
            modificationDate: '-',
            otherUsers: item.otherUsers || 0,
            mnemonic: item.mnemonic // Store mnemonic for drawer API call
          }));

          // Update filtered data (server-side filtering, so just copy the data)
          this.filteredMenuAccessData = [...this.menuAccessData];

          this.isMenuAccessLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading user access data:', error);
          // Clear only Menu Access tab data on error (don't touch other tabs' state to avoid race condition)
          this.menuAccessData = [];
          this.filteredMenuAccessData = [];
          this.userName = 'Error loading data';
          this.isMenuAccessLoading = false;
          // TODO: Show error message to user
        }
      });
  }

  /**
   * Build filter request parameters for access classes from filters, search, and sort
   */
  private buildAccessClassesFilterRequest(): AccessClassesFilterRequest {
    const filters: AccessClassesFilterRequest = {};

    // Add search keyword (always include, even if empty, to ensure API filtering works correctly)
    filters.searchKeyword = this.tableSearchText || '';

    // Add filters from filter panel
    if (this.accessClassesFilters) {
      if (this.accessClassesFilters.class) {
        filters.class = this.accessClassesFilters.class;
      }
      if (this.accessClassesFilters.effectiveDate) {
        filters.effectiveDate = this.accessClassesFilters.effectiveDate as string;
        filters.effectiveDatePeriod = this.accessClassesFilters.effectiveDatePeriod === 'After' ? 'AFTER' : 'BEFORE';
      }
      if (this.accessClassesFilters.terminationDate) {
        filters.terminationDate = this.accessClassesFilters.terminationDate as string;
        filters.terminationDatePeriod = this.accessClassesFilters.terminationDatePeriod === 'After' ? 'AFTER' : 'BEFORE';
      }
    }

    // Add sort parameter (for class column sorting)
    if (this.accessClassesTableConfig.sortConfig && this.accessClassesTableConfig.sortConfig.direction !== 'default') {
      filters.sort = this.accessClassesTableConfig.sortConfig.direction;
    }

    return filters;
  }

  /**
   * Load access classes data from API with filters and sorting
   */
  private loadAccessClassesData(userId: string): void {
    this.isAccessClassesLoading = true;

    // Calculate skip and take from pagination config
    const skip =
      (this.accessClassesTableConfig.pagination?.pageIndex || 0) *
      (this.accessClassesTableConfig.pagination?.pageSize || 25);
    const take = this.accessClassesTableConfig.pagination?.pageSize || 25;

    // Build filter parameters
    const filterRequest = this.buildAccessClassesFilterRequest();

    // API call to get user access classes with filters and pagination
    this.userAccessService
      .getUserAccessClasses(userId, take, skip, filterRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update pagination total records
          if (this.accessClassesTableConfig.pagination) {
            this.accessClassesTableConfig.pagination.totalRecords = response.total || 0;
          }

          // Check if we have data
          if (!response.data || response.data.length === 0) {
            console.warn('No access classes found for user:', userId);
            this.accessClassesData = [];
            this.filteredAccessClassesData = [];
            this.isAccessClassesLoading = false;
            return;
          }

          // Map access classes from API
          this.accessClassesData = response.data.map(item => ({
            class: item.class,
            description: item.description,
            accessLevel: item.accessLevel.toString(),
            usersInClass: item.usersInClass,
            effectiveDate: this.userAccessService.formatDate(item.effectiveDate),
            terminationDate: this.userAccessService.formatDate(item.terminationDate),
            modificationDate: '-'  // Not in API response
          }));

          // Initialize filtered data
          this.filteredAccessClassesData = [...this.accessClassesData];
          this.isAccessClassesLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading access classes data:', error);
          // Clear data arrays on error
          this.accessClassesData = [];
          this.filteredAccessClassesData = [];
          this.isAccessClassesLoading = false;
        }
      });
  }

  onTableSearchEnter(): void {
    const text = this.tableSearchText.trim();
    if (text.length >= 2 || text.length === 0) {
      this.searchSubject$.next(text);
    }
  }

  onTableSearchInput(): void {
    // When search text is fully cleared, trigger reload to show unfiltered data
    if (this.tableSearchText.trim() === '') {
      this.searchSubject$.next('');
    }
  }

  clearTableSearch(): void {
    this.tableSearchText = '';
    this.searchSubject$.next('');
  }

  onTableSearch(searchText: string): void {
    // Emit the search text to the debounced subject instead of calling API directly
    this.searchSubject$.next(searchText.trim());
  }

  private performSearch(searchText: string): void {
    this.tableSearchText = searchText;

    // Store search text for the current tab
    if (this.selectedTabIndex === 0) {
      this.menuAccessSearchText = this.tableSearchText;
    } else if (this.selectedTabIndex === 1) {
      this.accessClassesSearchText = this.tableSearchText;
    }

    // For Menu Access tab, reload data from API with search parameter
    if (this.selectedTabIndex === 0 && this.hasSearched) {
      // Reset pagination to first page
      if (this.menuAccessTableConfig.pagination) {
        this.menuAccessTableConfig.pagination.pageIndex = 0;
      }

      const userId = this.form.value.userId?.trim();
      if (userId) {
        this.loadMenuAccessData(userId);
      }
    } else if (this.selectedTabIndex === 1 && this.hasSearched) {
      // Access Classes tab - reload data from API with search parameter
      // Reset pagination to first page
      if (this.accessClassesTableConfig.pagination) {
        this.accessClassesTableConfig.pagination.pageIndex = 0;
      }

      const userId = this.form.value.userId?.trim();
      if (userId) {
        this.loadAccessClassesData(userId);
      }
    }
  }

  onFilterClick(event: MouseEvent): void {
    this.openFilter(event.currentTarget as HTMLElement);
  }

  openFilter(buttonElement: HTMLElement): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      if (this.filterButtonElement) {
        this.filterButtonElement.blur();
        this.filterButtonElement = null;
      }
      return;
    }

    this.filterButtonElement = buttonElement;
    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(buttonElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: -16,
          offsetY: 8
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    // Determine which filter panel to show based on current tab
    let portal: ComponentPortal<any>;

    if (this.selectedTabIndex === 0) {
      portal = new ComponentPortal(MenuAccessFilterPanel);
      const componentRef = this.overlayRef.attach(portal);
      componentRef.instance.currentFilters = this.menuAccessFilters;

      componentRef.instance.apply
        .pipe(takeUntil(this.destroy$))
        .subscribe((filters: MenuAccessFilterValue) => this.applyMenuAccessFilters(filters));

      componentRef.instance.close
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.closeFilterPanel());

    } else if (this.selectedTabIndex === 1) {
      portal = new ComponentPortal(AccessClassesFilterPanel);
      const componentRef = this.overlayRef.attach(portal);
      componentRef.instance.currentFilters = this.accessClassesFilters;
      componentRef.instance.userId = this.form.value.userId?.trim() || null;

      componentRef.instance.apply
        .pipe(takeUntil(this.destroy$))
        .subscribe((filters: AccessClassesFilterValue) => this.applyAccessClassesFilters(filters));

      componentRef.instance.close
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.closeFilterPanel());
    }

    // Close panel when clicking outside
    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeFilterPanel());
  }

  closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      if (this.filterButtonElement) {
        this.filterButtonElement.blur();
        this.filterButtonElement = null;
      }
    }
  }

  applyMenuAccessFilters(filters: MenuAccessFilterValue): void {
    this.menuAccessFilters = filters;
    this.menuAccessFilterChips = MenuAccessFilterChipsUtils.convertFiltersToChips(filters);

    // Reset pagination to first page
    if (this.menuAccessTableConfig.pagination) {
      this.menuAccessTableConfig.pagination.pageIndex = 0;
    }

    // Reload data from API with new filters
    const userId = this.form.value.userId?.trim();
    if (userId && this.hasSearched) {
      this.loadMenuAccessData(userId);
    }

    this.closeFilterPanel();
  }

  applyAccessClassesFilters(filters: AccessClassesFilterValue): void {
    this.accessClassesFilters = filters;
    this.accessClassesFilterChips = AccessClassesFilterChipsUtils.convertFiltersToChips(filters);

    // Reset pagination to first page
    if (this.accessClassesTableConfig.pagination) {
      this.accessClassesTableConfig.pagination.pageIndex = 0;
    }

    // Reload data from API with new filters
    const userId = this.form.value.userId?.trim();
    if (userId && this.hasSearched) {
      this.loadAccessClassesData(userId);
    }

    this.closeFilterPanel();
  }

  applyFiltersToData(): void {
    // Apply filters based on current tab
    if (this.selectedTabIndex === 0) {
      this.filteredMenuAccessData = this.filterMenuAccessData(this.menuAccessData, this.menuAccessFilters);
    } else if (this.selectedTabIndex === 1) {
      this.filteredAccessClassesData = this.filterAccessClassesData(this.accessClassesData, this.accessClassesFilters);
    }

    // Reapply table search
    this.onTableSearch(this.tableSearchText);
  }

  filterMenuAccessData(data: MenuAccessRow[], filters: MenuAccessFilterValue | null): MenuAccessRow[] {
    if (!filters) return data;

    return data.filter(row => {
      if (filters.menuTitle && filters.menuTitle !== 'All' && row.menuTitle !== filters.menuTitle) return false;

      if (filters.program && filters.program !== 'All' && row.program !== filters.program) return false;

      if (filters.effectiveDate) {
        const rowDate = new Date(row.effectiveDate);
        const filterDate = new Date(filters.effectiveDate);
        if (filters.effectiveDatePeriod === 'After' && rowDate <= filterDate) return false;
        if (filters.effectiveDatePeriod === 'Before' && rowDate >= filterDate) return false;
      }

      if (filters.terminationDate) {
        const rowDate = new Date(row.terminationDate);
        const filterDate = new Date(filters.terminationDate);
        if (filters.terminationDatePeriod === 'After' && rowDate <= filterDate) return false;
        if (filters.terminationDatePeriod === 'Before' && rowDate >= filterDate) return false;
      }

      return true;
    });
  }

  filterAccessClassesData(data: AccessClassRow[], filters: AccessClassesFilterValue | null): AccessClassRow[] {
    if (!filters) return data;

    return data.filter(row => {
      if (filters.class && row.class !== filters.class) return false;

      if (filters.effectiveDate) {
        const rowDate = new Date(row.effectiveDate);
        const filterDate = new Date(filters.effectiveDate);
        if (filters.effectiveDatePeriod === 'After' && rowDate <= filterDate) return false;
        if (filters.effectiveDatePeriod === 'Before' && rowDate >= filterDate) return false;
      }

      if (filters.terminationDate) {
        const rowDate = new Date(row.terminationDate);
        const filterDate = new Date(filters.terminationDate);
        if (filters.terminationDatePeriod === 'After' && rowDate <= filterDate) return false;
        if (filters.terminationDatePeriod === 'Before' && rowDate >= filterDate) return false;
      }

      return true;
    });
  }

  onRemoveFilterChip(chipKey: string): void {
    if (this.selectedTabIndex === 0) {
      this.menuAccessFilters = MenuAccessFilterChipsUtils.removeFilterByChipKey(this.menuAccessFilters, chipKey);
      this.menuAccessFilterChips = MenuAccessFilterChipsUtils.convertFiltersToChips(this.menuAccessFilters);

      // Reset pagination to first page when filters change
      if (this.menuAccessTableConfig.pagination) {
        this.menuAccessTableConfig.pagination.pageIndex = 0;
      }

      // Reload data from API with updated filters
      const userId = this.form.value.userId?.trim();
      if (userId && this.hasSearched) {
        this.loadMenuAccessData(userId);
      }
    } else if (this.selectedTabIndex === 1) {
      this.accessClassesFilters = AccessClassesFilterChipsUtils.removeFilterByChipKey(this.accessClassesFilters, chipKey);
      this.accessClassesFilterChips = AccessClassesFilterChipsUtils.convertFiltersToChips(this.accessClassesFilters);

      // Reset pagination to first page when filters change
      if (this.accessClassesTableConfig.pagination) {
        this.accessClassesTableConfig.pagination.pageIndex = 0;
      }

      // Reload data from API with updated filters
      const userId = this.form.value.userId?.trim();
      if (userId && this.hasSearched) {
        this.loadAccessClassesData(userId);
      }
    }
  }

  clearAllFilters(): void {
    if (this.selectedTabIndex === 0) {
      this.menuAccessFilters = null;
      this.menuAccessFilterChips = [];

      // Reset pagination to first page when clearing filters
      if (this.menuAccessTableConfig.pagination) {
        this.menuAccessTableConfig.pagination.pageIndex = 0;
      }

      // Reload data from API without filters
      const userId = this.form.value.userId?.trim();
      if (userId && this.hasSearched) {
        this.loadMenuAccessData(userId);
      }
    } else if (this.selectedTabIndex === 1) {
      this.accessClassesFilters = null;
      this.accessClassesFilterChips = [];

      // Reset pagination to first page when clearing filters
      if (this.accessClassesTableConfig.pagination) {
        this.accessClassesTableConfig.pagination.pageIndex = 0;
      }

      // Reload data from API without filters
      const userId = this.form.value.userId?.trim();
      if (userId && this.hasSearched) {
        this.loadAccessClassesData(userId);
      }
    }
  }

  hasActiveFilters(): boolean {
    if (this.selectedTabIndex === 0) {
      return MenuAccessFilterChipsUtils.hasActiveFilters(this.menuAccessFilters);
    } else if (this.selectedTabIndex === 1) {
      return AccessClassesFilterChipsUtils.hasActiveFilters(this.accessClassesFilters);
    }
    return false;
  }

  getCurrentFilterChips(): FilterChip[] {
    if (this.selectedTabIndex === 0) {
      return this.menuAccessFilterChips;
    } else if (this.selectedTabIndex === 1) {
      return this.accessClassesFilterChips;
    }
    return [];
  }

  openDrawer(title: string, context: string, subtitle: string, data: OtherUser[]): void {
    this.drawerTitle = title;
    this.drawerContext = context;
    this.drawerSubtitle = subtitle;
    this.drawerData = data;
    this.drawerType = 'menu-users';
    this.drawerColumns = this.getDrawerColumns();
    this.drawer.open();
  }

  openDrawerForUsers(title: string, context: string, subtitle: string, data: OtherUser[]): void {
    this.drawerTitle = title;
    this.drawerContext = context;
    this.drawerSubtitle = subtitle;
    this.drawerData = data;
    this.drawerType = 'users';
    this.drawerColumns = this.getAccessClassUsersDrawerColumns();
    this.drawer.open();
  }

  openDrawerForInterdictions(title: string, context: string, subtitle: string, data: ClassInterdiction[]): void {
    this.drawerTitle = title;
    this.drawerContext = context;
    this.drawerSubtitle = subtitle;
    this.drawerData = data;
    this.drawerType = 'interdictions';
    this.drawerColumns = this.getInterdictionsDrawerColumns();
    this.drawer.open();
  }

  closeDrawer(): void {
    this.drawer.close();
    this.drawerTitle = '';
    this.drawerContext = '';
    this.drawerSubtitle = '';
    this.drawerData = [];
    this.highlightedMenuAccessRow = null;
    this.highlightedAccessClassRow = null;
  }

  onMenuAccessRowAction(event: TableRowActionEvent<MenuAccessRow>): void {
    if (event.action === 'view') {
      const userId = this.form.value.userId?.trim();
      const mnemonic = event.row.mnemonic;

      if (!userId || !mnemonic) {
        console.error('Missing userId or mnemonic for getMenuUsers API call');
        return;
      }

      // Highlight the selected row
      this.highlightedMenuAccessRow = event.row;

      // Store context for pagination reload
      this.drawerContext_mnemonic = mnemonic;
      this.drawerContext_userId = userId;
      this.drawerContext_description = event.row.menuTitle;

      // Reset pagination to first page
      if (this.drawerTableConfig.pagination) {
        this.drawerTableConfig.pagination.pageIndex = 0;
      }

      // Load menu users with pagination
      this.loadMenuUsersDrawer();
    }
  }

  private loadMenuUsersDrawer(): void {
    this.isDrawerLoading = true;

    // First, get the total count to fetch all records
    const initialSkip = 0;
    const initialTake = 1;

    this.userAccessService
      .getMenuUsers(this.drawerContext_mnemonic, this.drawerContext_userId, initialTake, initialSkip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const totalRecords = response.total || 0;

          if (totalRecords === 0) {
            this.openDrawer(
              'Other Users within Menu Access Level',
              `${this.drawerContext_mnemonic} | ${this.drawerContext_description}`,
              `Members & Access (0)`,
              []
            );
            this.isDrawerLoading = false;
            return;
          }

          // Fetch all records based on actual total
          this.userAccessService
            .getMenuUsers(this.drawerContext_mnemonic, this.drawerContext_userId, totalRecords, 0)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (fullResponse) => {
                const users: OtherUser[] = (fullResponse.data || []).map(user => ({
                  userId: user.userID,
                  userName: user.userName,
                  groupId: user.groupID,
                  groupDescription: user.groupDescription,
                  accessLevel: String(user.accessLevel),
                  effectiveDate: this.userAccessService.formatDate(user.effectiveDate)
                }));

                // Update pagination total records
                if (this.drawerTableConfig.pagination) {
                  this.drawerTableConfig.pagination.totalRecords = totalRecords;
                }

                this.openDrawer(
                  'Other Users within Menu Access Level',
                  `${this.drawerContext_mnemonic} | ${this.drawerContext_description}`,
                  `Members & Access (${totalRecords})`,
                  users
                );

                this.isDrawerLoading = false;
              },
              error: (error) => {
                console.error('Error loading all menu users:', error);
                this.isDrawerLoading = false;
                this.openDrawer(
                  'Other Users within Menu Access Level',
                  `${this.drawerContext_mnemonic} | ${this.drawerContext_description}`,
                  'Members & Access (0)',
                  []
                );
              }
            });
        },
        error: (error) => {
          console.error('Error loading menu users initial count:', error);
          this.isDrawerLoading = false;
          this.openDrawer(
            'Other Users within Menu Access Level',
            `${this.drawerContext_mnemonic} | ${this.drawerContext_description}`,
            'Members & Access (0)',
            []
          );
        }
      });
  }

  onAccessClassesRowAction(event: TableRowActionEvent<AccessClassRow>): void {
    if (event.action === 'view-users') {
      const userId = this.form.value.userId?.trim();
      const accessClass = event.row.class;

      if (!userId || !accessClass) {
        console.error('Missing userId or accessClass for getAccessClassUsers API call');
        return;
      }

      // Highlight the selected row
      this.highlightedAccessClassRow = event.row;

      // Store context for pagination reload
      this.drawerContext_userId = userId;
      this.drawerContext_accessClass = accessClass;
      this.drawerContext_description = event.row.description;

      // Reset pagination to first page
      if (this.drawerTableConfig.pagination) {
        this.drawerTableConfig.pagination.pageIndex = 0;
      }

      // Load access class users with pagination
      this.loadAccessClassUsersDrawer();
    } else if (event.action === 'view-interdictions') {
      const accessClass = event.row.class;

      if (!accessClass) {
        console.error('Missing accessClass for getAssociatedInterdictions API call');
        return;
      }

      // Highlight the selected row
      this.highlightedAccessClassRow = event.row;

      // Store context for pagination reload
      this.drawerContext_accessClass = accessClass;
      this.drawerContext_description = event.row.description;

      // Reset pagination to first page
      if (this.drawerTableConfig.pagination) {
        this.drawerTableConfig.pagination.pageIndex = 0;
      }

      // Load associated interdictions with pagination
      this.loadAssociatedInterdictionsDrawer();
    }
  }

  private loadAccessClassUsersDrawer(): void {
    this.isDrawerLoading = true;

    const skip = (this.drawerTableConfig.pagination?.pageIndex || 0) *
      (this.drawerTableConfig.pagination?.pageSize || 25);
    const take = this.drawerTableConfig.pagination?.pageSize || 25;

    this.userAccessService
      .getAccessClassUsers(this.drawerContext_userId, this.drawerContext_accessClass, take, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const users: OtherUser[] = (response.data || []).map(user => ({
            userId: user.userId,
            userName: user.userName,
            groupId: user.groupId || '-',
            groupDescription: user.groupDescription,
            accessLevel: String(user.accessLevel),
            effectiveDate: this.userAccessService.formatDate(user.effectiveDate),
            terminationDate: user.terminationDate ? this.userAccessService.formatDate(user.terminationDate) : '-'
          }));

          // Update pagination total records
          if (this.drawerTableConfig.pagination) {
            this.drawerTableConfig.pagination.totalRecords = response.total || 0;
          }

          this.openDrawerForUsers(
            'Other Users in Access Classes',
            `${this.drawerContext_accessClass} | ${this.drawerContext_description}`,
            `Members & Access (${response.total || 0})`,
            users
          );

          this.isDrawerLoading = false;
        },
        error: (error) => {
          console.error('Error loading access class users:', error);
          this.isDrawerLoading = false;
          // Show empty drawer or error message
          this.openDrawerForUsers(
            'Other Users in Access Classes',
            `${this.drawerContext_accessClass} | ${this.drawerContext_description}`,
            'Members & Access (0)',
            []
          );
        }
      });
  }

  private loadAssociatedInterdictionsDrawer(): void {
    this.isDrawerLoading = true;

    const skip = (this.drawerTableConfig.pagination?.pageIndex || 0) *
      (this.drawerTableConfig.pagination?.pageSize || 25);
    const take = this.drawerTableConfig.pagination?.pageSize || 25;

    this.userAccessService
      .getAssociatedInterdictions(this.drawerContext_accessClass, take, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const interdictions: ClassInterdiction[] = (response.data || []).map(item => ({
            type: item.type,
            code: item.code,
            description: item.description,
            accessLevel: String(item.accessLevel),
            effectiveDate: this.userAccessService.formatDate(item.insertDate)
          }));

          // Update pagination total records
          if (this.drawerTableConfig.pagination) {
            this.drawerTableConfig.pagination.totalRecords = response.total || 0;
          }

          this.openDrawerForInterdictions(
            'Associated Interdictions in Class',
            `${this.drawerContext_accessClass} | ${this.drawerContext_description}`,
            '',
            interdictions
          );

          this.isDrawerLoading = false;
        },
        error: (error) => {
          console.error('Error loading associated interdictions:', error);
          this.isDrawerLoading = false;
          // Show empty drawer or error message
          this.openDrawerForInterdictions(
            'Associated Interdictions in Class',
            `${this.drawerContext_accessClass} | ${this.drawerContext_description}`,
            '',
            []
          );
        }
      });
  }

  onMenuAccessSortChange(event: TableSortEvent): void {
    // Update sort config with new column and direction
    this.menuAccessTableConfig.sortConfig!.column = event.column;
    this.menuAccessTableConfig.sortConfig!.direction = event.direction;

    // Reload data from API with new sort
    const userId = this.form.value.userId?.trim();
    if (userId && this.hasSearched) {
      this.loadMenuAccessData(userId);
    }
  }

  onAccessClassesSortChange(event: TableSortEvent): void {
    // Update sort config with new column and direction
    this.accessClassesTableConfig.sortConfig!.column = event.column;
    this.accessClassesTableConfig.sortConfig!.direction = event.direction;

    // Reload data from API with new sort
    const userId = this.form.value.userId?.trim();
    if (userId && this.hasSearched) {
      this.loadAccessClassesData(userId);
    }
  }

  onMenuAccessPageChange(event: TablePageEvent): void {
    if (this.menuAccessTableConfig.pagination) {
      this.menuAccessTableConfig.pagination.pageIndex = event.pageIndex;
      this.menuAccessTableConfig.pagination.pageSize = event.pageSize;
    }

    const userId = this.form.value.userId?.trim();
    if (userId && this.hasSearched) {
      this.loadMenuAccessData(userId);
    }
  }

  onAccessClassesPageChange(event: TablePageEvent): void {
    if (this.accessClassesTableConfig.pagination) {
      this.accessClassesTableConfig.pagination.pageIndex = event.pageIndex;
      this.accessClassesTableConfig.pagination.pageSize = event.pageSize;
    }

    const userId = this.form.value.userId?.trim();
    if (userId && this.hasSearched) {
      this.loadAccessClassesData(userId);
    }
  }

  onDrawerPageChange(event: TablePageEvent): void {
    if (this.drawerTableConfig.pagination) {
      this.drawerTableConfig.pagination.pageIndex = event.pageIndex;
      this.drawerTableConfig.pagination.pageSize = event.pageSize;
    }

    // Reload drawer data based on drawer type
    if (this.drawerType === 'menu-users') {
      this.loadMenuUsersDrawer();
    } else if (this.drawerType === 'users') {
      this.loadAccessClassUsersDrawer();
    } else if (this.drawerType === 'interdictions') {
      this.loadAssociatedInterdictionsDrawer();
    }
  }

  onDrawerSortChange(event: TableSortEvent): void {
    if (this.drawerTableConfig.sortConfig) {
      this.drawerTableConfig.sortConfig.column = event.column;
      this.drawerTableConfig.sortConfig.direction = event.direction;
    }

    // Sort the drawer data locally
    this.sortDrawerData(event.column, event.direction);
  }

  private sortDrawerData(column: string, direction: 'A' | 'D' | 'default'): void {
    if (direction === 'default') {
      // Reload data to restore original order
      if (this.drawerType === 'menu-users') {
        this.loadMenuUsersDrawer();
      } else if (this.drawerType === 'users') {
        this.loadAccessClassUsersDrawer();
      } else if (this.drawerType === 'interdictions') {
        this.loadAssociatedInterdictionsDrawer();
      }
      return;
    }

    const multiplier = direction === 'A' ? 1 : -1;

    this.drawerData = [...this.drawerData].sort((a, b) => {
      const aValue = a[column as keyof typeof a];
      const bValue = b[column as keyof typeof b];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * multiplier;
      }

      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    });
  }

  onTabChange(index: number): void {
    // Close any open filter panel before switching tabs
    this.closeFilterPanel();

    // Update the selected tab index
    this.selectedTabIndex = index;

    // Clear search text for the destination tab
    this.tableSearchText = '';

    // Reset destination tab state and reload data
    if (this.hasSearched) {
      const userId = this.form.value.userId?.trim();
      if (userId) {
        if (index === 0) {
          this.menuAccessSearchText = '';
          this.menuAccessFilters = null;
          this.menuAccessFilterChips = [];
          if (this.menuAccessTableConfig.pagination) {
            this.menuAccessTableConfig.pagination.pageIndex = 0;
          }
          this.loadMenuAccessData(userId);
        } else if (index === 1) {
          this.accessClassesSearchText = '';
          this.accessClassesFilters = null;
          this.accessClassesFilterChips = [];
          if (this.accessClassesTableConfig.pagination) {
            this.accessClassesTableConfig.pagination.pageIndex = 0;
          }
          this.loadAccessClassesData(userId);
        }
      }
    }
  }

  /**
   * Safely convert date values to ISO string format
   * Handles Date objects, Moment objects, and strings
   */
  private convertDateToISO(dateValue: string | Date | null | undefined): string {
    if (!dateValue) {
      return '';
    }

    try {
      // Handle native Date objects
      if (dateValue instanceof Date) {
        if (isNaN(dateValue.getTime())) {
          console.warn('Invalid Date object provided');
          return '';
        }
        return dateValue.toISOString();
      }

      // Handle Moment or date-like objects with toISOString method
      if (typeof dateValue === 'object' && dateValue !== null && 'toISOString' in dateValue) {
        const isoString = (dateValue as { toISOString: () => string }).toISOString();
        return isoString;
      }

      // Handle string values
      if (typeof dateValue === 'string') {
        return this.userAccessService.formatDateForAPI(dateValue);
      }

      console.warn('Unsupported date type:', typeof dateValue);
      return '';
    } catch (error) {
      console.error('Error converting date to ISO string:', error);
      return '';
    }
  }

  clear(): void {
    this.form.reset({ userId: null });
    this.userSearchControl.setValue('');
    this.hasSearched = false;
    this.isUserInfoLoading = false;
    this.userName = '';
    this.userCode = '';
    this.userGroup = '';
    this.userGroupDescription = '';
    this.userLevel = '';
    this.effectiveDate = '';
    this.terminationDate = '';
    this.menuAccessData = [];
    this.accessClassesData = [];
    this.filteredMenuAccessData = [];
    this.filteredAccessClassesData = [];
    this.tableSearchText = '';
    this.menuAccessSearchText = '';
    this.accessClassesSearchText = '';
    this.selectedTabIndex = 0;

    // Clear all filters
    this.menuAccessFilters = null;
    this.accessClassesFilters = null;
    this.menuAccessFilterChips = [];
    this.accessClassesFilterChips = [];
  }
}
