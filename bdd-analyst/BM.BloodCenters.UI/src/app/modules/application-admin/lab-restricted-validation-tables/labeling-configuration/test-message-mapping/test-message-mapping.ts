import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { TestMessageMappingService } from './services/test-message-mapping.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  TestMessageMappingModel,
  TestMessageMappingListBody,
  TestMessageMappingFilterValue
} from './models/test-message-mapping.model';

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
import { TestMessageMappingFilterChipsUtils } from './utils/filter-chips.utils';
import { TestMessageMappingFilterPanel } from './test-message-mapping-filter-panel/test-message-mapping-filter-panel';
import { AddEditTestMessageMapping } from './add-edit-test-message-mapping/add-edit-test-message-mapping';
import { LabelingFilterDataService } from '../services/labeling-filter-data.service';

@Component({
  selector: 'app-test-message-mapping',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditTestMessageMapping
  ],
  templateUrl: './test-message-mapping.html',
  styleUrls: ['./test-message-mapping.scss']
})
export class TestMessageMappingComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(AddEditTestMessageMapping) addEditPanelRef!: AddEditTestMessageMapping;

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<TestMessageMappingModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'ltTestId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: false
  };

  appliedFilters: TestMessageMappingFilterValue | null = null;
  filterChips: FilterChip[] = [];

  /** Full dataset from API */
  private allData: TestMessageMappingModel[] = [];
  dataSource: TestMessageMappingModel[] = [];
  requestBody: TestMessageMappingListBody = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: TestMessageMappingModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private _panelTriggerElement: HTMLElement | null = null;

  constructor(
    private mappingService: TestMessageMappingService,
    private overlay: Overlay,
    private headerService: HeaderService,
    private filterDataService: LabelingFilterDataService
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
      placeholder: 'Search by AP Test ID or Message Type',
      minLength: 2,
      ariaLabel: 'Search test message mappings',
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'ltTestId',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Test message mapping records found.',
      loadingMessage: 'Loading test message mapping data...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<TestMessageMappingModel>[] {
    return [
      {
        key: 'ltTestId',
        header: 'AP Test ID',
        sortable: true,
        width: '150px'
      },
      {
        key: 'resultCode',
        header: 'Result',
        width: '120px'
      },
      {
        key: 'displyTestId',
        header: 'Label Test ID',
        width: '150px'
      },
      {
        key: 'antibodyFlag',
        header: 'Antibody Flag',
        width: '120px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'messageDesc',
        header: 'Message Type',
        width: '200px'
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

  private formatDate(date: string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<TestMessageMappingModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit test message',
        ariaLabel: 'Edit test message {{ltTestId}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.mappingService
      .getTestMessageMappings(this.requestBody)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allData = response.data;
          if (this.filterDataService.getData('test-message-mapping').length === 0) {
            this.filterDataService.setData('test-message-mapping', response.data);
          }
          this.dataSource = this.allData;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading test message mapping data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load test message mapping data. Please try again.';
        }
      });
  }

  onSearchEvent(searchText: string): void {
    const trimmed = (searchText || '').trim();
    if (trimmed === '') {
      this.requestBody.searchKeyword = undefined;
      this.loadData();
    }
  }

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

  onRowAction(event: TableRowActionEvent<TestMessageMappingModel>): void {
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

  editRecord(record: TestMessageMappingModel): void {
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
    this.filterDataService.clearData('test-message-mapping');
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

    const portal = new ComponentPortal(TestMessageMappingFilterPanel);
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

  applyFilters(filters: TestMessageMappingFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = TestMessageMappingFilterChipsUtils.convertFiltersToChips(filters);

    // Convert period + date to effDateAfter/effDateBefore/termDateAfter/termDateBefore
    const effDateISO = DateFieldValidationUtility.serializeDateForApi(filters.effectiveDate);
    const termDateISO = DateFieldValidationUtility.serializeDateForApi(filters.terminationDate);

    this.requestBody = {
      ...this.requestBody,
      resultCode: filters.resultCode || undefined,
      antibodyFlag: filters.antibodyFlag || undefined,
      effDateAfter: filters.effectiveDatePeriod === 'after' && effDateISO ? effDateISO : undefined,
      effDateBefore: filters.effectiveDatePeriod === 'before' && effDateISO ? effDateISO : undefined,
      termDateAfter: filters.terminationDatePeriod === 'after' && termDateISO ? termDateISO : undefined,
      termDateBefore: filters.terminationDatePeriod === 'before' && termDateISO ? termDateISO : undefined,
    };

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = TestMessageMappingFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = TestMessageMappingFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestBodyFromFilters();

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return TestMessageMappingFilterChipsUtils.hasActiveFilters(this.appliedFilters);
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

    const effDateISO = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.effectiveDate);
    const termDateISO = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.terminationDate);

    this.requestBody = {
      ...this.requestBody,
      resultCode: this.appliedFilters.resultCode || undefined,
      antibodyFlag: this.appliedFilters.antibodyFlag || undefined,
      effDateAfter: this.appliedFilters.effectiveDatePeriod === 'after' && effDateISO ? effDateISO : undefined,
      effDateBefore: this.appliedFilters.effectiveDatePeriod === 'before' && effDateISO ? effDateISO : undefined,
      termDateAfter: this.appliedFilters.terminationDatePeriod === 'after' && termDateISO ? termDateISO : undefined,
      termDateBefore: this.appliedFilters.terminationDatePeriod === 'before' && termDateISO ? termDateISO : undefined,
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

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
      this.closeFilterOverlay();
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
