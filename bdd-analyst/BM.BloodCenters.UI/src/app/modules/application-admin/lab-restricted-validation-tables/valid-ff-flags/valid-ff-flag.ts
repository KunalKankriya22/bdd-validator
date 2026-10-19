import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ViewChild,
  ElementRef,
  NgZone,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, Subscription } from 'rxjs';

import { ValidFfFlagService } from './services/valid-ff-flag.service';
import {
  ValidFfFlagModel,
  ValidFfFlagParamsDto,
  ValidFfFlagFilterValue
} from './models/valid-ff-flag.model';

import { DataTable } from '@shared/components/data-table/data-table';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidFfFlagFilterChipsUtils } from './utils/filter-chips.utils';
import { ValidFfFlagFilterPanel } from './valid-ff-flag-filter-panel/valid-ff-flag-filter-panel';
import { AddEditValidFfFlag } from './add-edit-valid-ff-flag/add-edit-valid-ff-flag';

@Component({
  selector: 'app-valid-ff-flag',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditValidFfFlag
  ],
  templateUrl: './valid-ff-flag.html',
  styleUrls: ['./valid-ff-flag.scss']
})
export class ValidFfFlagComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<ValidFfFlagModel>;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('tableWrapper', { read: ElementRef }) tableWrapper!: ElementRef<HTMLElement>;
  @ViewChild('ariaLiveAnnouncer', { read: ElementRef }) ariaLiveAnnouncer!: ElementRef<HTMLElement>;

  private sidePanelTriggerElement: HTMLElement | null = null;

  headerConfig!: PageHeaderConfig;
  searchConfig!: SearchBarConfig;
  tableConfig!: DataTableConfig<ValidFfFlagModel>;

  appliedFilters: ValidFfFlagFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ValidFfFlagModel[] = [];
  requestState: ValidFfFlagParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' | 'view' = 'add';
  sidePanelData: ValidFfFlagModel | null = null;

  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private filterSubscriptions: Subscription[] = [];
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private validFfFlagService: ValidFfFlagService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private ngZone: NgZone
  ) {
    this.initializeConfigurations();

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
    this.subscribeToChapterChanges();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.setupHorizontalScrollDetection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.filterSubscriptions.forEach(sub => sub.unsubscribe());
    this.overlayRef?.dispose();
    this.resizeObserver?.disconnect();
  }

  /* -------------------------------- CHAPTER CHANGE -------------------------------- */

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.clearAllFilters();
        this.searchText = '';
        this.searchBarComponent?.clearSearch();
        this.requestState = {};
        this.tableConfig.sortConfig = { column: 'chapterID', direction: 'default' };
        this.dataSource = [];
        this.hasError = false;
        this.errorMessage = '';
        this.loadData();
      });
  }

  /* -------------------------------- CONFIG -------------------------------- */

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW FF FLAG VALUE',
          icon: 'add',
          color: 'accent',
          ariaLabel: 'Add new FF flag value record',
          onClick: () => this.createRecord()
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by Chapter ID, Collection Facility ID, Source Type or FF Flag Value',
      minLength: 1,
      ariaLabel: 'Search valid FF flag values',
      searchOnEnterOnly: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'chapterID',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No valid FF flag records available to display',
      noDataIcon: 'edit',
      loadingMessage: 'Loading valid FF flag data...',
      showPagination: false,
      enableRowHighlight: false
    };
  }

  private getTableColumns(): TableColumn<ValidFfFlagModel>[] {
    return [
      { key: 'chapterID', header: 'Chapter ID', sortable: true, width: '140px' },
      { key: 'collectionFacilityId', header: 'Collection Facility ID', width: '200px' },
      { key: 'sourceType', header: 'Source Type', width: '140px' },
      { key: 'ffFlagValue', header: 'FF Flag Value', width: '140px' },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '160px',
        valueFormatter: (v) => this.formatDate(v)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '160px',
        valueFormatter: (v) => this.formatDate(v)
      },
      {
        key: 'modificationDate',
        header: 'Modification Date',
        width: '160px',
        valueFormatter: (v) => this.formatDate(v)
      }
    ];
  }

  private getRowActions(): RowAction<ValidFfFlagModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit valid FF flag',
        ariaLabel: 'Edit valid FF flag',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  /* -------------------------------- LIVE REGION -------------------------------- */

  private announce(message: string): void {
    if (this.ariaLiveAnnouncer?.nativeElement) {
      this.ariaLiveAnnouncer.nativeElement.textContent = '';
      setTimeout(() => {
        this.ariaLiveAnnouncer.nativeElement.textContent = message;
      }, 50);
    }
  }

  /* -------------------------------- LOAD DATA -------------------------------- */

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.announce('Loading valid FF flag data...');

    this.validFfFlagService
      .getValidFfFlags(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dataSource = res.data;
          this.isLoading = false;
          this.announce(`Loaded ${res.data.length} valid FF flag records.`);
          setTimeout(() => this.checkHorizontalScroll());
        },
        error: (err) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage =
            err?.error?.message ||
            'Failed to load valid FF flag data.';
          this.announce('Error loading valid FF flag data. Please retry.');
        }
      });
  }

  /* -------------------------------- EVENTS -------------------------------- */

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'A') {
      this.requestState.sort = 'A';
    } else if (event.direction === 'D') {
      this.requestState.sort = 'D';
    } else {
      this.requestState.sort = undefined;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ValidFfFlagModel>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }
    if (event.action === 'edit') {
      this.editRecord(event.row);
    } else if (event.action === 'view') {
      this.viewRecord(event.row);
    }
  }

  /* -------------------------------- FILTERS -------------------------------- */

  applyFilters(filters: ValidFfFlagFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips =
      ValidFfFlagFilterChipsUtils.convertFiltersToChips(filters);
    this.announce('Filters applied. Loading filtered results.');

    this.requestState = {
      ...this.requestState,
      collectionFacilityId: filters.collectionFacilityId || undefined,
      sourceType: filters.sourceType || undefined,
      ffFlagValue: filters.ffFlagValue || undefined,
      effectiveDatePeriod: filters.effectivePeriod || undefined,
      effectiveDate: filters.effectiveDate || undefined,
      terminationDatePeriod: filters.terminationPeriod || undefined,
      terminationDate: filters.terminationDate || undefined
    };

    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const {
      collectionFacilityId,
      sourceType,
      ffFlagValue,
      effectiveDatePeriod,
      effectiveDate,
      terminationDatePeriod,
      terminationDate,
      ...rest
    } = this.requestState;

    this.requestState = rest;
    this.loadData();
  }

  /* -------------------------------- SIDE PANEL -------------------------------- */

  createRecord(): void {
    this.sidePanelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    setTimeout(() => {
      const panel = document.querySelector('.side-panel-wrapper') as HTMLElement;
      const firstFocusable = panel?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 100);
  }

  editRecord(record: ValidFfFlagModel): void {
    this.sidePanelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
    setTimeout(() => {
      const panel = document.querySelector('.side-panel-wrapper') as HTMLElement;
      const firstFocusable = panel?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 100);
  }

  viewRecord(record: ValidFfFlagModel): void {
    this.sidePanelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'view';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
    setTimeout(() => {
      const panel = document.querySelector('.side-panel-wrapper') as HTMLElement;
      const firstFocusable = panel?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 100);
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    setTimeout(() => {
      this.sidePanelTriggerElement?.focus();
      this.sidePanelTriggerElement = null;
    }, 50);
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  /* -------------------------------- FILTER PANEL -------------------------------- */

  openFilter(): void {
    if (this.isFilterOpen) return;

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

    const filterPortal = new ComponentPortal(ValidFfFlagFilterPanel);
    const filterComponentRef = this.overlayRef.attach(filterPortal);

    filterComponentRef.instance.currentFilters = this.appliedFilters;

    this.filterSubscriptions = [
      filterComponentRef.instance.apply.subscribe((filters: ValidFfFlagFilterValue) => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      }),
      filterComponentRef.instance.close.subscribe(() => {
        this.closeFilterPanel();
      }),
      this.overlayRef.backdropClick().subscribe(() => {
        this.closeFilterPanel();
      })
    ];

    this.isFilterOpen = true;
  }

  private closeFilterPanel(): void {
    this.filterSubscriptions.forEach(sub => sub.unsubscribe());
    this.filterSubscriptions = [];
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isFilterOpen = false;
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters =
      ValidFfFlagFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);

    if (updatedFilters === null) {
      this.clearAllFilters();
    } else {
      this.applyFilters(updatedFilters);
    }
  }

  /* -------------------------------- SCROLL DETECTION -------------------------------- */

  private setupHorizontalScrollDetection(): void {
    if (!this.tableWrapper) return;

    const el = this.tableWrapper.nativeElement;

    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.checkHorizontalScroll());
      this.resizeObserver.observe(el);

      const scrollWrapper = el.querySelector('.data-table-scroll-wrapper');
      if (scrollWrapper) {
        this.resizeObserver.observe(scrollWrapper);
      }
    });

    this.checkHorizontalScroll();
  }

  private checkHorizontalScroll(): void {
    if (!this.tableWrapper) return;

    const el = this.tableWrapper.nativeElement;
    const scrollWrapper = el.querySelector('.data-table-scroll-wrapper');
    const target = scrollWrapper || el;
    const hasScroll = target.scrollWidth > target.clientWidth;

    el.classList.toggle('has-horizontal-scroll', hasScroll);
  }

  /* -------------------------------- UTILITIES -------------------------------- */

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}-${d
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase()}-${d.getFullYear()}`;
  }

  /* -------------------------------- KEYBOARD SHORTCUTS -------------------------------- */

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkHorizontalScroll();
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
