import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { DonorGradingMatrixService } from './services/donor-grading-matrix.service';
import {
  DonorGradingMatrix,
  DonorGradingMatrixFilter,
  DonorGradingMatrixFilterValue,
  MATCH_LABELS,
  GENDER_LABELS
} from './models/donor-grading-matrix.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
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

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonorGradingMatrixFilterChipsUtils } from './utils/filter-chips.utils';
import { GradingMatrixFilterPanel } from './grading-matrix-filter-panel/grading-matrix-filter-panel';
import { AddEditGradingMatrix } from './add-edit-grading-matrix/add-edit-grading-matrix';

@Component({
  selector: 'app-donor-grading-matrix',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    AddEditGradingMatrix
  ],
  templateUrl: './donor-grading-matrix.html',
  styleUrls: ['./donor-grading-matrix.scss']
})
export class DonorGradingMatrixComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('ariaLiveAnnouncer', { read: ElementRef }) ariaLiveAnnouncer!: ElementRef<HTMLElement>;

  private sidePanelTriggerElement: HTMLElement | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<DonorGradingMatrix> = {
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
      column: 'dgmId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DonorGradingMatrixFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DonorGradingMatrix[] = [];
  requestState: DonorGradingMatrixFilter = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DonorGradingMatrix | null = null;

  // Filter Panel State
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private donorGradingMatrixService: DonorGradingMatrixService,
    private router: Router,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService
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
    this.loadData();
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
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [{
        label: 'ADD DONOR GRADING MATRIX',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Create new donor grading matrix record',
        onClick: () => this.createRecord()
      }]
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'dgmId',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No donor grading matrix records available to display',
      loadingMessage: 'Loading donor grading matrix data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DonorGradingMatrix>[] {
    return [
      {
        key: 'dgmId',
        header: 'DGM ID',
        sortable: true,
        width: '100px'
      },
      {
        key: 'lastnameMatch',
        header: 'Last Name',
        width: '150px',
        valueFormatter: (value) => MATCH_LABELS[value] || value || '-'
      },
      {
        key: 'firstnameMatch',
        header: 'First Name',
        width: '150px',
        valueFormatter: (value) => MATCH_LABELS[value] || value || '-'
      },
      {
        key: 'dobMatch',
        header: 'DOB',
        width: '150px',
        valueFormatter: (value) => MATCH_LABELS[value] || value || '-'
      },
      {
        key: 'genderMatch',
        header: 'Gender',
        width: '150px',
        valueFormatter: (value) => GENDER_LABELS[value] || value || '-'
      },
      {
        key: 'grade',
        header: 'Grade',
        width: '100px'
      }
    ];
  }

  private getRowActions(): RowAction<DonorGradingMatrix>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit grading matrix record',
        ariaLabel: 'Edit grading matrix record {{dgmId}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private announce(message: string): void {
    if (this.ariaLiveAnnouncer?.nativeElement) {
      this.ariaLiveAnnouncer.nativeElement.textContent = '';
      setTimeout(() => {
        this.ariaLiveAnnouncer.nativeElement.textContent = message;
      }, 50);
    }
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.announce('Loading donor grading matrix data...');

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    this.donorGradingMatrixService
      .getDonorGradingMatrix(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DonorGradingMatrix[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.announce(`Loaded ${response.totalRecords} donor grading matrix records.`);
        },
        error: (error: any) => {
          console.error('Error loading donor grading matrix data:', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load donor grading matrix data. Please try again.';
          this.announce('Error loading donor grading matrix data. Please retry.');
        }
      });
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    const directionMap: Record<string, string> = { 'A': '_asc', 'D': '_desc' };

    this.requestState.sort =
      event.direction === 'default' ? undefined : `${event.column}${directionMap[event.direction]}`;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DonorGradingMatrix>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

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

  editRecord(record: DonorGradingMatrix): void {
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

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    setTimeout(() => {
      this.sidePanelTriggerElement?.focus();
      this.sidePanelTriggerElement = null;
    }, 50);
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

    const portal = new ComponentPortal(GradingMatrixFilterPanel);
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

  applyFilters(filters: DonorGradingMatrixFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = DonorGradingMatrixFilterChipsUtils.convertFiltersToChips(filters);
    this.announce('Filters applied. Loading filtered results.');

    this.requestState = {
      ...this.requestState,
      lastnameMatch: filters.lastnameMatch || undefined,
      firstnameMatch: filters.firstnameMatch || undefined,
      dobMatch: filters.dobMatch || undefined,
      genderMatch: filters.genderMatch || undefined,
      grade: filters.grade ?? undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DonorGradingMatrixFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DonorGradingMatrixFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DonorGradingMatrixFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { lastnameMatch, firstnameMatch, dobMatch, genderMatch, grade, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { lastnameMatch, firstnameMatch, dobMatch, genderMatch, grade, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      lastnameMatch: this.appliedFilters.lastnameMatch || undefined,
      firstnameMatch: this.appliedFilters.firstnameMatch || undefined,
      dobMatch: this.appliedFilters.dobMatch || undefined,
      genderMatch: this.appliedFilters.genderMatch || undefined,
      grade: this.appliedFilters.grade ?? undefined
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }

    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }
}
