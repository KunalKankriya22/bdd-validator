import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { MobilePcLaptopRegisterService } from './services/mobile-pc-laptop-register.service';
import {
  MobilePcLaptopRegisterModel,
  MobilePcLaptopRegisterParamsDto,
  MobilePcLaptopRegisterFilterValue,
  ChapterLookup
} from './models/mobile-pc-laptop-register.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { MobilePcLaptopRegisterFilterChipsUtils } from './utils/filter-chips.utils';
import { MobilePcLaptopRegisterFilterPanel } from './mobile-pc-laptop-register-filter-panel/mobile-pc-laptop-register-filter-panel';
import { AddEditMobilePcLaptopRegister } from './add-edit-mobile-pc-laptop-register/add-edit-mobile-pc-laptop-register';

/**
 * Custom MatPaginatorIntl to change "Items per page" to "Rows per page"
 */
export function getMobilePcLaptopPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-mobile-pc-laptop-register',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    AddEditMobilePcLaptopRegister
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getMobilePcLaptopPaginatorIntl }
  ],
  templateUrl: './mobile-pc-laptop-register.html',
  styleUrls: ['./mobile-pc-laptop-register.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class MobilePcLaptopRegisterComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

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

  // Table configuration
  displayedColumns: string[] = [
    'expand',
    'chapter',
    'laptopId',
    'temporaryId',
    'currentSequence',
    'auditIncrement',
    'refreshDate',
    'location',
    'actions'
  ];

  // Pagination
  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Sort
  sortColumn = 'chapter';
  sortDirection: 'A' | 'D' | 'default' = 'default';

  appliedFilters: MobilePcLaptopRegisterFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: MobilePcLaptopRegisterModel[] = [];
  expandedRows = new Set<MobilePcLaptopRegisterModel>();
  allExpanded = false;
  requestState: MobilePcLaptopRegisterParamsDto = {};

  isLoading = false;
  searchText = '';

  // Chapters lookup (pre-loaded for side panel)
  chapters: ChapterLookup[] = [];

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: MobilePcLaptopRegisterModel | null = null;

  // Track selected/edited row
  selectedRowId: string | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private mobilePcLaptopRegisterService: MobilePcLaptopRegisterService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    // Update header config from menu-items API response
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
    this.loadChapters();
    this.loadData();
  }

  private loadChapters(): void {
    this.mobilePcLaptopRegisterService.getChapters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chapters) => {
          this.chapters = chapters;
        },
        error: (_error: unknown) => {
          // Error snackbar handled globally in service
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: 'Mobile PC Laptop Register',
          link: null
        }
      ],
      title: 'Mobile PC Laptop Register',
      subtitle: 'Manage mobile laptops and audit settings for reliable tracking and traceability.',
      actions: [{
        label: 'REGISTER NEW DEVICES',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Register new devices',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by Mobile Server ID, Temp ID or Location',
      minLength: 2,
      ariaLabel: 'Search by mobile server ID, temporary ID or location',
      searchOnEnterOnly: true
    };
  }

  // Expandable row methods
  toggleRow(row: MobilePcLaptopRegisterModel): void {
    if (this.expandedRows.has(row)) {
      this.expandedRows.delete(row);
    } else {
      this.expandedRows.add(row);
    }
    this.updateAllExpandedState();
  }

  isExpanded(row: MobilePcLaptopRegisterModel): boolean {
    return this.expandedRows.has(row);
  }

  toggleExpandAll(): void {
    if (this.allExpanded) {
      this.expandedRows.clear();
      this.allExpanded = false;
    } else {
      this.dataSource.forEach(row => this.expandedRows.add(row));
      this.allExpanded = true;
    }
  }

  private updateAllExpandedState(): void {
    this.allExpanded = this.dataSource.length > 0 && this.expandedRows.size === this.dataSource.length;
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  loadData(expandRowId?: string | null): void {
    this.isLoading = true;

    const skip = this.pageIndex * this.pageSize;
    const take = this.pageSize;

    this.mobilePcLaptopRegisterService
      .getMobilePcLaptopRegister(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: MobilePcLaptopRegisterModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.expandedRows.clear();
          this.allExpanded = false;

          // Restore expanded + selected state for the edited row
          if (expandRowId) {
            const editedRow = this.dataSource.find(r => r.laptopId === expandRowId);
            if (editedRow) {
              this.expandedRows.add(editedRow);
              this.selectedRowId = editedRow.laptopId ?? null;
              this.updateAllExpandedState();
            }
          }
        },
        error: (error: any) => {
          // Handle 404 as empty result (no data found), not as an error
          if (error.status === 404) {
            this.dataSource = [];
            this.totalRecords = 0;
            this.expandedRows.clear();
            this.allExpanded = false;
          }
          // Non-404 errors: snackbar is shown by the service
          this.isLoading = false;
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;
    this.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSort(column: string): void {
    if (this.sortDirection === undefined) {
      this.sortDirection = 'D';
    } else if (this.sortDirection === 'D') {
      this.sortDirection = 'A';
    } else {
      this.sortDirection = 'D';
    }
    this.sortColumn = column;
    this.pageIndex = 0;

    this.requestState.sort = this.sortDirection || undefined;
    this.loadData();
  }

  getSortIcon(): string {
    if (this.sortDirection === 'A') {
      return 'arrow_upward';
    } else if (this.sortDirection === 'D') {
      return 'arrow_downward';
    }
    return 'unfold_more';
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    this.selectedRowId = null;
  }

  editRecord(record: MobilePcLaptopRegisterModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
    this.selectedRowId = record.laptopId ?? null;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.selectedRowId = null;
  }

  onSaveSuccess(): void {
    // Store the ID to restore expanded + selected state after reload
    const editedRowId = this.selectedRowId;
    this.loadData(editedRowId);
  }

  isSelectedRow(row: MobilePcLaptopRegisterModel): boolean {
    return this.selectedRowId !== null && row.laptopId === this.selectedRowId;
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

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

    const portal = new ComponentPortal(MobilePcLaptopRegisterFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: MobilePcLaptopRegisterFilterValue) => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: MobilePcLaptopRegisterFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = MobilePcLaptopRegisterFilterChipsUtils.convertFiltersToChips(filters);

    // Map filter values to backend parameter names
    this.requestState = {
      ...this.requestState,
      chapterId: filters.chapter || undefined,
      refreshDatePeriod: filters.period || undefined,
      refreshDate: filters.refreshDate ? this.formatDateForApi(filters.refreshDate) : undefined
    };

    this.pageIndex = 0;
    this.loadData();
  }

  private formatDateForApi(date: Date): string {
    const d = new Date(date);
    return d.toISOString();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = MobilePcLaptopRegisterFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = MobilePcLaptopRegisterFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    this.pageIndex = 0;
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return MobilePcLaptopRegisterFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { chapterId, refreshDatePeriod, refreshDate, ...rest } = this.requestState;
    this.requestState = rest;

    this.pageIndex = 0;
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { chapterId, refreshDatePeriod, refreshDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      chapterId: this.appliedFilters.chapter || undefined,
      refreshDatePeriod: this.appliedFilters.period || undefined,
      refreshDate: this.appliedFilters.refreshDate ? this.formatDateForApi(this.appliedFilters.refreshDate) : undefined
    };
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

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
