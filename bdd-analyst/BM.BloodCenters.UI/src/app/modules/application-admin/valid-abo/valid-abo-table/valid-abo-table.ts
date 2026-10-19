import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { ValidAboService } from '../services/valid-abo.service';
import {
  ValidAboModel,
  ValidAboParamsDto,
  ValidAboFilterValue
} from '../models/valid-abo.model';
import { VALIDATION_VALID_ABO } from 'src/app/core/constants/validation.constants';

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

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ValidAboFilterPanel } from '../valid-abo-filter-panel/valid-abo-filter-panel';
import { AddEditValidAbo } from '../add-edit-valid-abo/add-edit-valid-abo';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidAboFilterChipsUtils } from '../utils/valid-abo-filter-chips.utils';

@Component({
  selector: 'app-valid-abo-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditValidAbo
  ],
  templateUrl: './valid-abo-table.html',
  styleUrls: ['./valid-abo-table.scss']
})
export class ValidAboTable implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(DataTable) dataTableComponent!: DataTable<ValidAboModel>;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  readonly VALIDATION = VALIDATION_VALID_ABO.VALID_ABO_TABLE;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 1,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<ValidAboModel> = {
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
      column: 'code',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: ValidAboFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: ValidAboModel[] = [];
  requestState: ValidAboParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';
  isFilterOpen = false;
  sidePanelOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private validAboService: ValidAboService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private dialog: MatDialog,
    private headerService: HeaderService
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
    this.loadValidAboData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  /**
   * Subscribe to chapter change events from header
   * Empty subscription as this screen only contains tables
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Empty subscription - no dropdown data to reload
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD NEW RECORD',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new Valid ABO record',
        onClick: () => this.createRecord()
      }]
    };

    this.searchConfig = {
      placeholder: 'Search by code, description, or mnemonics',
      minLength: 1,
      ariaLabel: 'Search by code, description, or mnemonics',
      searchOnEnterOnly: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: this.VALIDATION.LIMITS.DEFAULT_PAGE_SIZE,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'code',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Valid ABO records available to display',
      loadingMessage: 'Loading Valid ABO data...',
      showPagination: true,
      enableRowHighlight: false
    };
  }

  private getTableColumns(): TableColumn<ValidAboModel>[] {
    return [
      {
        key: 'code',
        header: 'Code',
        sortable: true,
        width: '80px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '150px'
      },
      {
        key: 'intendedUse',
        header: 'Intended Use',
        width: '140px'
      },
      {
        key: 'unitScheme',
        header: 'Unit Scheme',
        width: '120px'
      },
      {
        key: 'group',
        header: 'Group',
        width: '80px',
        valueFormatter: (value) => value !== null && value !== undefined ? value.toString() : '-'
      },
      {
        key: 'transfusionStatus',
        header: 'Transfusion Status',
        width: '160px'
      },
      {
        key: 'aboGroupOnly',
        header: 'ABO Group Only',
        width: '130px',
        valueFormatter: (value) => value === true ? 'Yes' : value === false ? 'No' : '-'
      },
      {
        key: 'sequence',
        header: 'Sequence',
        width: '100px',
        valueFormatter: (value) => value !== null && value !== undefined ? value.toString() : '-'
      },
      {
        key: 'mnemonic1',
        header: 'Mnemonic 1',
        width: '120px'
      },
      {
        key: 'mnemonic2',
        header: 'Mnemonic 2',
        width: '120px'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '130px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => value ? this.formatDateDisplay(new Date(value)) : '-'
      }
    ];
  }

  private getRowActions(): RowAction<ValidAboModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit Valid ABO',
        ariaLabel: 'Edit Valid ABO {{code}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  loadValidAboData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 10;

    this.validAboService
      .getValidAbo(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;

          const hasFiltersOrSearch = this.hasActiveFilters() || !!this.requestState.searchKeyword;
          if (hasFiltersOrSearch) {
            this.tableConfig.emptyMessage = 'No Valid ABO records found';
          } else {
            this.tableConfig.emptyMessage = 'No Valid ABO records available to display';
          }
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load Valid ABO data. Please try again later.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.requestState.searchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadValidAboData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadValidAboData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    const directionMap: Record<string, string> = { 'A': 'asc', 'D': 'desc' };
    this.requestState.sort =
      event.direction === 'default' ? undefined : `${event.column}:${directionMap[event.direction]}`;

    this.loadValidAboData();
  }

  onRowAction(event: TableRowActionEvent<ValidAboModel>): void {
    // Highlight the row when action is clicked
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    if (event.action === 'edit') {
      this.editValidAbo(event.row);
    }
  }

  createRecord(): void {
    this.sidePanelOpen = true;
    this.dialog.open(AddEditValidAbo, {
      panelClass: 'add-edit-valid-abo-right-dialog',
      backdropClass: 'cdk-overlay-dark-backdrop',
      width: '742px',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      position: {
        right: '0',
        top: '0'
      },
      autoFocus: false,
      disableClose: true,
      data: {
        mode: 'add',
        data: null
      }
    }).afterClosed().subscribe(result => {
      this.sidePanelOpen = false;
      // Clear row selection when closing the dialog
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = null;
      }
      if (result) {
        this.loadValidAboData();
      }
    });
  }

  editValidAbo(record: ValidAboModel): void {
    this.sidePanelOpen = true;
    this.dialog.open(AddEditValidAbo, {
      panelClass: 'add-edit-valid-abo-right-dialog',
      backdropClass: 'cdk-overlay-dark-backdrop',
      width: '742px',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      position: {
        right: '0',
        top: '0'
      },
      autoFocus: false,
      disableClose: true,
      data: {
        mode: 'edit',
        data: record
      }
    }).afterClosed().subscribe(result => {
      this.sidePanelOpen = false;
      // Clear row selection when closing the dialog
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = null;
      }
      if (result) {
        this.loadValidAboData();
      }
    });
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
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
        .withPush(true)
        .withViewportMargin(16)
        .withFlexibleDimensions(false)
        .withGrowAfterOpen(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: '320px',
      minWidth: '320px',
      maxWidth: '320px'
    });

    const portal = new ComponentPortal(ValidAboFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
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

  applyFilters(filters: ValidAboFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = ValidAboFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      intendedUse: filters.intendedUse || undefined,
      unitScheme: filters.unitScheme || undefined,
      transfusionStatus: filters.transfusionStatus || undefined,
      ...this.mapDateFilters(filters)
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadValidAboData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = ValidAboFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = ValidAboFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadValidAboData();
  }

  hasActiveFilters(): boolean {
    return ValidAboFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { intendedUse, unitScheme, transfusionStatus, effectivePeriod, effectiveDate, terminationPeriod, terminationDate, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadValidAboData();
  }

  /**
   * Maps FE filter values (effectiveDateFrom/To) to BE format (effectivePeriod + effectiveDate)
   */
  private mapDateFilters(filters: ValidAboFilterValue): Partial<ValidAboParamsDto> {
    const result: Partial<ValidAboParamsDto> = {};

    if (filters.effectiveDateFrom) {
      result.effectivePeriod = 'AFTER';
      result.effectiveDate = filters.effectiveDateFrom;
    } else if (filters.effectiveDateTo) {
      result.effectivePeriod = 'BEFORE';
      result.effectiveDate = filters.effectiveDateTo;
    }

    if (filters.terminationDateFrom) {
      result.terminationPeriod = 'AFTER';
      result.terminationDate = filters.terminationDateFrom;
    } else if (filters.terminationDateTo) {
      result.terminationPeriod = 'BEFORE';
      result.terminationDate = filters.terminationDateTo;
    }

    return result;
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { intendedUse, unitScheme, transfusionStatus, effectivePeriod, effectiveDate, terminationPeriod, terminationDate, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      intendedUse: this.appliedFilters.intendedUse || undefined,
      unitScheme: this.appliedFilters.unitScheme || undefined,
      transfusionStatus: this.appliedFilters.transfusionStatus || undefined,
      ...this.mapDateFilters(this.appliedFilters)
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
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private formatDateDisplay(date: Date): string {
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
