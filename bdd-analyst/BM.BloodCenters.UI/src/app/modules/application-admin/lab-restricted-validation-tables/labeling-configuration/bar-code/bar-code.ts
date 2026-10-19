import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { BarCodeService } from './services/bar-code.service';
import {
  BarCodeModel,
  BarCodeListRequestDto,
  BarCodeFilterValue
} from './models/bar-code.model';

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
import { BarCodeFilterChipsUtils } from './utils/filter-chips.utils';
import { BarCodeFilterPanel } from './bar-code-filter-panel/bar-code-filter-panel';
import { AddEditBarCode } from './add-edit-bar-code/add-edit-bar-code';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { LabelingFilterDataService } from '../services/labeling-filter-data.service';

@Component({
  selector: 'app-bar-code',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditBarCode
  ],
  templateUrl: './bar-code.html',
  styleUrls: ['./bar-code.scss']
})
export class BarCodeComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(AddEditBarCode) addEditPanelRef!: AddEditBarCode;

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<BarCodeModel> = {
    columns: [],
    rowActions: [],
    sortConfig: {
      column: 'barcodeValue',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: false
  };

  appliedFilters: BarCodeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: BarCodeModel[] = [];
  requestState: BarCodeListRequestDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: BarCodeModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private _panelTriggerElement: HTMLElement | null = null;

  constructor(
    private barCodeService: BarCodeService,
    private router: Router,
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
        this.requestState = {};
        this.filterDataService.clearData('bar-code');
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
      placeholder: 'Search by Bar Code or Description',
      minLength: 3,
      ariaLabel: 'Search barcode configurations',
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      sortConfig: {
        column: 'barcodeValue',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No barcode configurations to view',
      loadingMessage: 'Loading barcode configuration data...',
      showPagination: false
    };
  }

  private getTableColumns(): TableColumn<BarCodeModel>[] {
    return [
      {
        key: 'barcodeValue',
        header: 'Bar Code',
        sortable: true,
        width: '150px'
      },
      {
        key: 'barcodeDesc',
        header: 'Bar Code Desc',
        width: '200px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'testId',
        header: 'Test ID',
        width: '150px'
      },
      {
        key: 'resultCode',
        header: 'Result',
        width: '150px',
        valueFormatter: (value) => this.formatResultCode(value)
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

  private formatResultCode(code: string | null | undefined): string {
    if (!code) return '-';
    switch (code.toUpperCase()) {
      case 'N': return 'Negative';
      case 'P': return 'Positive';
      default: return code;
    }
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

  private getRowActions(): RowAction<BarCodeModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit barcode config',
        ariaLabel: 'Edit barcode {{barcodeValue}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.barCodeService
      .getBarCodes(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: BarCodeModel[]; totalRecords: number }) => {
          if (this.filterDataService.getData('bar-code').length === 0) {
            this.filterDataService.setData('bar-code', response.data);
          }
          this.dataSource = response.data;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading barcode configuration data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load barcode configuration data. Please try again.';
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
      this.requestState.searchKeyword = undefined;
      this.loadData();
    }
  }

  /**
   * Handles Enter key press on the search bar.
   * searchKeyword applies OR logic across barcodeValue, testId, resultCode on the backend.
   * Note: barcodeDesc (description) is NOT currently included in backend search.
   * Only triggers if input has 3 or more characters.
   */
  onEnterSearch(): void {
    const text = this.searchBarComponent?.searchText?.trim() || '';
    if (text.length >= 3) {
      this.requestState.searchKeyword = text;
      this.loadData();
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;
    this.sortDataSource();
  }

  private sortDataSource(): void {
    const col = this.tableConfig.sortConfig?.column;
    const dir = this.tableConfig.sortConfig?.direction;
    if (!col || dir === 'default') return;

    this.dataSource = [...this.dataSource].sort((a, b) => {
      const valA = (a as any)[col];
      const valB = (b as any)[col];

      // Handle nulls — push them to the end regardless of direction
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let comparison: number;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB), undefined, { sensitivity: 'base' });
      }

      return dir === 'D' ? -comparison : comparison;
    });
  }

  onRowAction(event: TableRowActionEvent<BarCodeModel>): void {
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

  editRecord(record: BarCodeModel): void {
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
    this.filterDataService.clearData('bar-code');
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

    const portal = new ComponentPortal(BarCodeFilterPanel);
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

  applyFilters(filters: BarCodeFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = BarCodeFilterChipsUtils.convertFiltersToChips(filters);

    const effDateISO = DateFieldValidationUtility.serializeDateForApi(filters.effectiveDate);
    const termDateISO = DateFieldValidationUtility.serializeDateForApi(filters.terminationDate);

    this.requestState = {
      ...this.requestState,
      testId: filters.testId || undefined,
      resultCode: filters.resultCode || undefined,
      effDateAfter: filters.effectiveDatePeriod === 'after' && effDateISO ? effDateISO : undefined,
      effDateBefore: filters.effectiveDatePeriod === 'before' && effDateISO ? effDateISO : undefined,
      termDateAfter: filters.terminationDatePeriod === 'after' && termDateISO ? termDateISO : undefined,
      termDateBefore: filters.terminationDatePeriod === 'before' && termDateISO ? termDateISO : undefined,
    };

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = BarCodeFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = BarCodeFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return BarCodeFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { testId, resultCode, effDateAfter, effDateBefore, termDateAfter, termDateBefore, ...rest } = this.requestState;
    this.requestState = rest;

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { testId, resultCode, effDateAfter, effDateBefore, termDateAfter, termDateBefore, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    const effDateISO = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.effectiveDate);
    const termDateISO = DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.terminationDate);

    this.requestState = {
      ...this.requestState,
      testId: this.appliedFilters.testId || undefined,
      resultCode: this.appliedFilters.resultCode || undefined,
      effDateAfter: this.appliedFilters.effectiveDatePeriod === 'after' && effDateISO ? effDateISO : undefined,
      effDateBefore: this.appliedFilters.effectiveDatePeriod === 'before' && effDateISO ? effDateISO : undefined,
      termDateAfter: this.appliedFilters.terminationDatePeriod === 'after' && termDateISO ? termDateISO : undefined,
      termDateBefore: this.appliedFilters.terminationDatePeriod === 'before' && termDateISO ? termDateISO : undefined,
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
      this.closeFilterOverlay();
    }

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
