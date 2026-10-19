import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { XmlErrorLogApiService } from './services/xml-error-log-api.service';
import {
  PlasmaFileTypeDto,
  XmlErrorLogEntryDto,
  SearchXmlErrorLogRequest,
  XmlErrorLogFilterValue,
} from './models/xml-error-log.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { FocusTrap, FocusTrapFactory, LiveAnnouncer } from '@angular/cdk/a11y';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { XmlErrorLogFilterPanel } from './xml-error-log-filter-panel/xml-error-log-filter-panel';

@Component({
  selector: 'app-xml-error-log-file',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
  ],
  templateUrl: './xml-error-log-file.html',
  styleUrls: ['./xml-error-log-file.scss'],
})
export class XmlErrorLogFileComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Plasma File Type',
    minLength: 1,
    ariaLabel: 'Search log entries by text',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true,
  };

  tableConfig: DataTableConfig<XmlErrorLogEntryDto> = {
    columns: [],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    emptyMessage: 'No log entries available to display',
    loadingMessage: 'Loading log entries...',
    showPagination: true,
  };

  plasmaFileTypes: PlasmaFileTypeDto[] = [];
  appliedFilters: XmlErrorLogFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: XmlErrorLogEntryDto[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private focusTrap: FocusTrap | null = null;
  private readonly apiService: XmlErrorLogApiService;
  private readonly snackbarService: SnackbarService;
  private readonly headerService: HeaderService;
  private readonly pageHeaderService: PageHeaderService;
  private readonly overlay: Overlay;
  private readonly focusTrapFactory: FocusTrapFactory;
  private readonly liveAnnouncer: LiveAnnouncer;

  constructor(
    apiService: XmlErrorLogApiService,
    snackbarService: SnackbarService,
    headerService: HeaderService,
    pageHeaderService: PageHeaderService,
    overlay: Overlay,
    focusTrapFactory: FocusTrapFactory,
    liveAnnouncer: LiveAnnouncer,
  ) {
    this.apiService = apiService;
    this.snackbarService = snackbarService;
    this.headerService = headerService;
    this.pageHeaderService = pageHeaderService;
    this.overlay = overlay;
    this.focusTrapFactory = focusTrapFactory;
    this.liveAnnouncer = liveAnnouncer;

    this.initializeTableColumns();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'Captures and stores errors encountered during the creation, validation, transmission, or processing of XML files.',
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadPlasmaFileTypes();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAllFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const pageNumber = (this.tableConfig.pagination?.pageIndex || 0) + 1;
    const pageSize = this.tableConfig.pagination?.pageSize || 10;

    const request: SearchXmlErrorLogRequest = {
      plasmaFileType: this.appliedFilters?.plasmaFileType || '',
      logDate: this.appliedFilters?.logDate || null,
      searchText: this.searchText || null,
      pageNumber,
      pageSize,
    };

    this.apiService.searchLogEntries(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.dataSource = response.data ?? [];
            this.tableConfig.pagination!.totalRecords = response.total ?? 0;
            const count = response.total ?? 0;
            this.liveAnnouncer.announce(
              count === 0 ? 'No log entries found.' : `${count} log entries loaded.`,
              'polite',
            );
          } else {
            this.dataSource = [];
            this.tableConfig.pagination!.totalRecords = 0;
            if (response.message) {
              this.snackbarService.showError(response.message);
            }
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.hasError = true;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
          const rawMessage = HttpErrorHandler.extractErrorMessage(
            error,
            'An error occurred while loading log entries.',
          );
          this.errorMessage = this.sanitizeErrorMessage(rawMessage);
          this.liveAnnouncer.announce(`Error loading log entries: ${this.errorMessage}`, 'assertive');
        },
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText || '';

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadTableData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      if (this.focusTrap) {
        this.focusTrap.destroy();
        this.focusTrap = null;
      }
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      this.filterBtn.nativeElement.focus();
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
          offsetY: 56,
        },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    this.isFilterOpen = true;

    const portal = new ComponentPortal(XmlErrorLogFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    const panelElement = componentRef.location.nativeElement as HTMLElement;
    this.focusTrap = this.focusTrapFactory.create(panelElement);
    this.focusTrap.focusInitialElementWhenReady();

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.plasmaFileTypes = this.plasmaFileTypes;

    const closePanel = () => {
      if (this.focusTrap) {
        this.focusTrap.destroy();
        this.focusTrap = null;
      }
      if (this.overlayRef) {
        this.overlayRef.dispose();
        this.overlayRef = null;
      }
      this.isFilterOpen = false;
      this.filterBtn.nativeElement.focus();
    };

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.applyFilters(filters);
        closePanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => closePanel());

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => closePanel());
  }

  applyFilters(filters: XmlErrorLogFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = this.convertFiltersToChips(filters);

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadTableData();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.appliedFilters) return;

    if (chipKey === 'plasmaFileType') {
      this.appliedFilters = { ...this.appliedFilters, plasmaFileType: null };
    } else if (chipKey === 'logDate') {
      this.appliedFilters = { ...this.appliedFilters, logDate: null };
    }

    const hasAnyValue = this.appliedFilters.plasmaFileType || this.appliedFilters.logDate;
    if (!hasAnyValue) {
      this.appliedFilters = null;
    }

    this.filterChips = this.appliedFilters
      ? this.convertFiltersToChips(this.appliedFilters)
      : [];

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    if (this.appliedFilters?.plasmaFileType) {
      this.loadTableData();
    } else {
      this.dataSource = [];
      this.tableConfig.pagination!.totalRecords = 0;
    }
  }

  hasActiveFilters(): boolean {
    if (!this.appliedFilters) return false;
    return !!(this.appliedFilters.plasmaFileType || this.appliedFilters.logDate);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.searchText = '';
    this.dataSource = [];
    this.tableConfig.pagination!.totalRecords = 0;

    if (this.searchBarComponent) {
      this.searchBarComponent.clearSearch();
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      if (this.focusTrap) {
        this.focusTrap.destroy();
        this.focusTrap = null;
      }
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      this.filterBtn.nativeElement.focus();
    }
  }

  private loadPlasmaFileTypes(): void {
    this.apiService.getPlasmaFileTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.plasmaFileTypes = response.data ?? [];
          }
        },
        error: () => {
          this.plasmaFileTypes = [];
        },
      });
  }

  private initializeTableColumns(): void {
    this.tableConfig.columns = [
      {
        key: 'logDescription',
        header: 'Log Details',
        sortable: false,
      },
    ];
  }

  private convertFiltersToChips(filters: XmlErrorLogFilterValue): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.plasmaFileType) {
      const fileType = this.plasmaFileTypes.find(t => t.code === filters.plasmaFileType);
      const displayValue = fileType?.description || filters.plasmaFileType;
      chips.push({
        key: 'plasmaFileType',
        label: `Plasma File Type: ${displayValue}`,
        value: filters.plasmaFileType,
      });
    }

    if (filters.logDate) {
      chips.push({
        key: 'logDate',
        label: `Date: ${this.formatDateDisplay(filters.logDate)}`,
        value: filters.logDate,
      });
    }

    return chips;
  }

  private sanitizeErrorMessage(message: string): string {
    return message.replace(/^error\s*:\s*/i, '').trim();
  }

  private formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
