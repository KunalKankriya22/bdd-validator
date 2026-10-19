import { Component, inject, OnInit, HostListener, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { ViewInstitutionService } from '../service/view-institution.service';
import { InstitutionService } from '../service/institution.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ChapterFilterPanel, ChapterFilterValue } from '../chapter-filter-panel/chapter-filter-panel';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ChapterFilterChipsUtils } from '../utils/chapter-filter-chips.utils';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { UppercaseDatePipe } from '@shared/pipes/uppercase-date.pipe';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { FocusMonitor } from '@angular/cdk/a11y';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

export interface ChapterModel {
  chapterId: string;
  chapterName: string;
  chapterShortName?: string;
  addressId?: number;
  printHdr?: string;
  testChapterInd?: string;
  instId?: string;
  effDate: string | Date;
  lastModifiedDate?: string | Date;
  termDate?: string | Date;
  auditKey?: number;
  programId?: string;
  timeZone?: string;
  insertDate?: string | Date;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isInternational?: string;
  status?: 'Active' | 'Inactive';
}

// Custom Paginator Intl to change "items per page" to "Rows per page"
export function getChapterPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-view-institution',
  standalone: true,
  templateUrl: './view-institution.html',
  styleUrls: ['./view-institution.scss'],
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    SearchBar,
    DataTable,
    FilterChips,
    UppercaseDatePipe
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: getChapterPaginatorIntl }
  ]
})
export class ViewInstitution implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtnRef!: ElementRef<HTMLElement>;

  private router = inject(Router);
  private viewInstitutionService = inject(ViewInstitutionService);
  private institutionService = inject(InstitutionService);
  private sanitizer = inject(DomSanitizer);
  private overlay = inject(Overlay);
  private focusMonitor = inject(FocusMonitor);

  institution: any[] = [];
  logoUrl: SafeUrl | string = 'assets/DefaultImageInstitution.png';

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Chapter ID, Name etc.',
    minLength: 0,
    debounceTime: 1000,
    ariaLabel: 'Search chapters',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<ChapterModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [5, 10, 25, 50],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'chapterId',
      direction: 'D'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: 'No chapters available to display',
    loadingMessage: 'Loading chapters...',
    showPagination: true
  };

  dataSource: ChapterModel[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  appliedFilters: ChapterFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor() {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.loadInstitutionAndChapters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private initializeConfigurations(): void {
    this.searchConfig = {
      placeholder: 'Search by chapter ID, Name etc.',
      minLength: 0,
      debounceTime: 1000,
      ariaLabel: 'Search chapters',
      searchOnEnterOnly: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [5, 10, 25, 50],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'chapterId',
        direction: 'D'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      actionsColumnHeader: 'Action',
      emptyMessage: 'No chapters available to display',
      loadingMessage: 'Loading chapters...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<ChapterModel>[] {
    return [
      {
        key: 'chapterId',
        header: 'Chapter ID',
        sortable: true,
        width: '200px'
      },
      {
        key: 'chapterName',
        header: 'Chapter Name',
        width: '250px'
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
      },
      {
        key: 'status',
        header: 'Status',
        width: '120px'
      }
    ];
  }

  private getRowActions(): RowAction<ChapterModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit chapter',
        ariaLabel: 'Edit chapter {{chapterId}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private computeChapterStatus(chapter: ChapterModel): 'Active' | 'Inactive' {
    if (!chapter.termDate) return 'Active';
    const termDate = new Date(chapter.termDate);
    return termDate >= new Date() ? 'Active' : 'Inactive';
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  goToCreateChapter() {
    this.router.navigate(['application-administration/create-chapter']);
  }

  goToEditInstitution() {
    this.router.navigate(['application-administration/common-validation/edit']);
  }

  /* =========================================================
     DATA LOAD
  ========================================================= */
  loadInstitutionAndChapters(): void {
    this.viewInstitutionService.getInstitutions().subscribe({
      next: (insData) => {
        this.institution = insData;
        // Always load the standardized institution logo (inst_logo.png)
        if (insData && insData.length > 0) {
          // Use cache busting to always get the latest logo
          this.loadLogo('inst_logo.png', true);
        }
      },
      error: (err) => console.error('Failed to load institution', err),
    });

    this.loadChaptersData();
  }

  loadChaptersData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.viewInstitutionService.getChapters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chaptersData: ChapterModel[]) => {
          // Ensure we have an array
          const chapters = Array.isArray(chaptersData) ? chaptersData : [];
          this.dataSource = this.applyFiltersAndSearch(chapters);
          const sort = this.tableConfig.sortConfig;
          if (sort && sort.direction !== 'default') {
            this.sortDataSource(sort.column, sort.direction);
          }
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = this.dataSource.length;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load chapters', err);
          this.hasError = true;
          this.errorMessage = 'Failed to load chapters. Please try again.';
          this.dataSource = [];
          this.isLoading = false;
        }
      });
  }

  /* =========================================================
     LOGO DOWNLOAD
  ========================================================= */
  private loadLogo(fileName: string = 'inst_logo.png', cacheBust: boolean = false): void {
    if (!fileName) return;

    this.institutionService.downloadLogo(fileName, cacheBust).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.logoUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error('Failed to load logo', err);
        this.logoUrl = 'assets/DefaultImageInstitution.png';
      }
    });
  }

  /* =========================================================
     SEARCH
  ========================================================= */
  onSearchEvent(searchText: string): void {
    const trimmed = (searchText || '').trim();

    this.searchText = trimmed.toLowerCase();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadChaptersData();
  }

  private applyFiltersAndSearch(chapters: ChapterModel[]): ChapterModel[] {
    // Ensure we have a valid array
    if (!Array.isArray(chapters)) {
      console.warn('applyFiltersAndSearch received non-array:', chapters);
      return [];
    }

    let filtered = chapters.map(chapter => ({
      ...chapter,
      status: this.computeChapterStatus(chapter) as 'Active' | 'Inactive'
    }));

    // Apply search filter
    if (this.searchText) {
      filtered = filtered.filter((chapter) =>
        (chapter.chapterId || '').toLowerCase().includes(this.searchText) ||
        (chapter.chapterName || '').toLowerCase().includes(this.searchText)
      );
    }

    // Apply filter panel filters
    if (this.appliedFilters) {
      filtered = this.applyAdvancedFilters(filtered);
    }

    return filtered;
  }

  private applyAdvancedFilters<T extends ChapterModel>(chapters: T[]): T[] {
    if (!this.appliedFilters) {
      return chapters;
    }

    return chapters.filter(chapter => {
      // Effective Date filter
      if (this.appliedFilters!.effectivePeriod && this.appliedFilters!.effectiveDate) {
        const effDate = moment(chapter.effDate);
        const filterDate = moment(this.appliedFilters!.effectiveDate);

        if (this.appliedFilters!.effectivePeriod === 'AFTER') {
          if (effDate.isBefore(filterDate, 'day')) return false;
        } else if (this.appliedFilters!.effectivePeriod === 'BEFORE') {
          if (effDate.isAfter(filterDate, 'day')) return false;
        }
      }

      // Termination Date filter
      if (this.appliedFilters!.terminationPeriod && this.appliedFilters!.terminationDate) {
        if (!chapter.termDate) return false; // No termination date

        const termDate = moment(chapter.termDate);
        const filterDate = moment(this.appliedFilters!.terminationDate);

        if (this.appliedFilters!.terminationPeriod === 'AFTER') {
          if (termDate.isBefore(filterDate, 'day')) return false;
        } else if (this.appliedFilters!.terminationPeriod === 'BEFORE') {
          if (termDate.isAfter(filterDate, 'day')) return false;
        }
      }

      return true;
    });
  }

  /* =========================================================
     TABLE EVENTS
  ========================================================= */
  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    // No need to reload data - DataTable handles client-side pagination
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;
    this.sortDataSource(event.column, event.direction as 'A' | 'D');
  }

  private sortDataSource(column: string, direction: 'A' | 'D'): void {
    this.dataSource = [...this.dataSource].sort((a, b) => {
      const aVal = (a as any)[column];
      const bVal = (b as any)[column];

      if (aVal < bVal) return direction === 'A' ? -1 : 1;
      if (aVal > bVal) return direction === 'A' ? 1 : -1;
      return 0;
    });
  }

  onRowAction(event: TableRowActionEvent<ChapterModel>): void {
    switch (event.action) {
      case 'edit':
        this.router.navigate(['/application-administration/edit-chapter', event.row.chapterId]);
        break;
    }
  }

  /* =========================================================
     FILTER PANEL
  ========================================================= */
  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtnRef)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: '320px'
    });

    const portal = new ComponentPortal(ChapterFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  private closeFilterPanel(): void {
    this.isFilterOpen = false;
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.focusMonitor.focusVia(this.filterBtnRef, 'program');
    this.focusMonitor.stopMonitoring(this.filterBtnRef);
  }

  applyFilters(filters: ChapterFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = ChapterFilterChipsUtils.convertFiltersToChips(filters);

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadChaptersData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ChapterFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = ChapterFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadChaptersData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadChaptersData();
  }

  hasActiveFilters(): boolean {
    return ChapterFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  /**
   * Combine address lines with comma separation
   */
  getFullAddress(inst: any): string {
    const addressParts = [inst.addR_1, inst.addR_2, inst.addR_3].filter(part => part && part.trim());
    const address = addressParts.join(', ');
    return address || '-';
  }
}
