import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { RecoveredPlasmaTestService } from './services/recovered-plasma-test.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import {
  RecoveredPlasmaTestModel,
  RecoveredPlasmaTestListBody,
  RecoveredPlasmaTestFilterValue
} from './models/recovered-plasma-test.model';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { RecoveredPlasmaTestFilterChipsUtils } from './utils/filter-chips.utils';
import { RecoveredPlasmaTestFilterPanel } from './recovered-plasma-test-filter-panel/recovered-plasma-test-filter-panel';
import { AddEditRecoveredPlasmaTest } from './add-edit-recovered-plasma-test/add-edit-recovered-plasma-test';

@Component({
  selector: 'app-recovered-plasma-test',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditRecoveredPlasmaTest
  ],
  templateUrl: './recovered-plasma-test.html',
  styleUrls: ['./recovered-plasma-test.scss']
})
export class RecoveredPlasmaTestComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(AddEditRecoveredPlasmaTest) addEditPanelRef!: AddEditRecoveredPlasmaTest;

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<RecoveredPlasmaTestModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'testId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: false
  };

  appliedFilters: RecoveredPlasmaTestFilterValue | null = null;
  filterChips: FilterChip[] = [];

  /** Full dataset from API */
  private allData: RecoveredPlasmaTestModel[] = [];
  dataSource: RecoveredPlasmaTestModel[] = [];
  requestBody: RecoveredPlasmaTestListBody = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: RecoveredPlasmaTestModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private _panelTriggerElement: HTMLElement | null = null;

  constructor(
    private plasmaTestService: RecoveredPlasmaTestService,
    private overlay: Overlay,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.appliedFilters = null;
        this.filterChips = [];
        this.searchText = '';
        this.requestBody = {};
        if (this.searchBarComponent) {
          this.searchBarComponent.clearSearch();
        }
        if (this.tableConfig.sortConfig) {
          this.tableConfig.sortConfig.direction = 'default';
        }
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
        this.loadData();
      });
  }

  private initializeConfigurations(): void {
    this.searchConfig = {
      placeholder: 'Search by Test ID',
      minLength: 2,
      ariaLabel: 'Search recovered plasma tests',
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'testId',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Recovered plasma test records found.',
      loadingMessage: 'Loading recovered plasma test data...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<RecoveredPlasmaTestModel>[] {
    return [
      {
        key: 'testId',
        header: 'Test ID',
        sortable: true,
        width: '250px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '200px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '200px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private formatDate(date: string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<RecoveredPlasmaTestModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit plasma test',
        ariaLabel: 'Edit plasma test {{testId}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.plasmaTestService
      .getPlasmaTests(this.requestBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allData = response.data;
          this.dataSource = response.data;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading recovered plasma test data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load recovered plasma test data. Please try again.';
        }
      });
  }

  /**
   * Handles (search) event from SearchBar.
   * Only acts when the input is cleared to empty (reload default data).
   */
  onSearchEvent(searchText: string): void {
    const trimmed = (searchText || '').trim();
    if (trimmed === '') {
      this.requestBody.searchKeyword = undefined;
      this.loadData();
    }
  }

  /**
   * Handles Enter key press on the search bar.
   * Only triggers if input has 2 or more characters.
   */
  onEnterSearch(): void {
    const text = this.searchBarComponent?.searchText?.trim() || '';
    if (text.length >= 2) {
      this.requestBody.searchKeyword = text;
      this.loadData();
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'default') {
      this.requestBody.sort = undefined;
    } else {
      this.requestBody.sort = event.direction === 'D' ? 'D' : 'A';
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<RecoveredPlasmaTestModel>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this._panelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    setTimeout(() => this.addEditPanelRef?.focus(), 100);
  }

  editRecord(record: RecoveredPlasmaTestModel): void {
    this._panelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
    setTimeout(() => this.addEditPanelRef?.focus(), 100);
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    setTimeout(() => this._panelTriggerElement?.focus(), 50);
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterOverlay();
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

    const portal = new ComponentPortal(RecoveredPlasmaTestFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterOverlay();
      });
  }

  private closeFilterOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
  }

  applyFilters(filters: RecoveredPlasmaTestFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = RecoveredPlasmaTestFilterChipsUtils.convertFiltersToChips(filters);

    // Convert period + date to effDateAfter/effDateBefore/termDateAfter/termDateBefore
    const effDateISO = this.formatFilterDateISO(filters.effectiveDate);
    const termDateISO = this.formatFilterDateISO(filters.terminationDate);

    this.requestBody = {
      ...this.requestBody,
      effDateAfter: filters.effectiveDatePeriod === 'after' && effDateISO ? effDateISO : undefined,
      effDateBefore: filters.effectiveDatePeriod === 'before' && effDateISO ? effDateISO : undefined,
      termDateAfter: filters.terminationDatePeriod === 'after' && termDateISO ? termDateISO : undefined,
      termDateBefore: filters.terminationDatePeriod === 'before' && termDateISO ? termDateISO : undefined,
    };

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = RecoveredPlasmaTestFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = RecoveredPlasmaTestFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestBodyFromFilters();

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return RecoveredPlasmaTestFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    this.requestBody = {
      searchKeyword: this.requestBody.searchKeyword,
      sort: this.requestBody.sort
    };

    this.loadData();
  }

  private updateRequestBodyFromFilters(): void {
    if (!this.appliedFilters) {
      this.requestBody = {
        searchKeyword: this.requestBody.searchKeyword,
        sort: this.requestBody.sort
      };
      return;
    }

    const effDateISO = this.formatFilterDateISO(this.appliedFilters.effectiveDate);
    const termDateISO = this.formatFilterDateISO(this.appliedFilters.terminationDate);

    this.requestBody = {
      ...this.requestBody,
      effDateAfter: this.appliedFilters.effectiveDatePeriod === 'after' && effDateISO ? effDateISO : undefined,
      effDateBefore: this.appliedFilters.effectiveDatePeriod === 'before' && effDateISO ? effDateISO : undefined,
      termDateAfter: this.appliedFilters.terminationDatePeriod === 'after' && termDateISO ? termDateISO : undefined,
      termDateBefore: this.appliedFilters.terminationDatePeriod === 'before' && termDateISO ? termDateISO : undefined,
    };
  }

  /** Format date to YYYY-MM-DD for API body */
  private formatFilterDateISO(date: any): string | undefined {
    return DateFieldValidationUtility.serializeDateForApi(date) || undefined;
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
      this.closeFilterOverlay();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
