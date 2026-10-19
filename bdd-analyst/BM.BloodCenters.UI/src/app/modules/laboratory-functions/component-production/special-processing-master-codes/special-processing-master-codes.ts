import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import moment from 'moment';
import { SpecialProcessingMasterCodesService } from './services/special-processing-master-codes.service';
import {
  SPMasterCodeDto,
  SPGroupedCodeTypeDto,
  SPMasterCodeQueryParams,
  SpecialProcessingFilterValue,
  CreateSPMasterCodeRequest,
  UpdateSPMasterCodeRequest,
} from './models/special-processing-master-codes.model';
import { SpecialProcessingFilterPanel } from './special-processing-filter-panel/special-processing-filter-panel';
import { AddEditSpecialProcessingComponent } from './add-edit-special-processing/add-edit-special-processing';
import { SpecialProcessingFilterChipsUtils } from './utils/filter-chips.utils';
import { FilterChip, FilterChips } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-special-processing-master-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    OverlayModule,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditSpecialProcessingComponent,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './special-processing-master-codes.html',
  styleUrls: ['./special-processing-master-codes.scss'],
})
export class SpecialProcessingMasterCodesComponent implements OnInit, OnDestroy {
  private readonly service = inject(SpecialProcessingMasterCodesService);
  private readonly overlay = inject(Overlay);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;
  @ViewChild('sideDrawer') sideDrawerComponent?: AddEditSpecialProcessingComponent;

  currentView: 'master' | 'detail' = 'master';
  selectedCodeType: string = '';
  selectedCodeTypeDesc: string = '';

  pageHeaderConfig: PageHeaderConfig = this.getMasterPageHeaderConfig();

  // Master view config
  masterSearchConfig: SearchBarConfig = {
    placeholder: 'Search by code type or description',
    ariaLabel: 'Search by code type or description',
    minLength: 3,
    searchOnEnterOnly: true,
    alwaysShowTooltip: false,
  };

  masterTableConfig: DataTableConfig<SPGroupedCodeTypeDto> = {
    columns: [
      { key: 'codeType', header: 'Code Type', sortable: true, width: '140px' },
      { key: 'codeTypeDesc', header: 'Description', sortable: false, width: '300px' },
      { key: 'effDate', header: 'Effective Date', width: '150px' },
      { key: 'termDate', header: 'Termination Date', width: '160px' },
      { key: 'lastModifiedDate', header: 'Modification Date', width: '160px' },
    ],
    rowActions: [
      {
        icon: 'visibility',
        label: 'View',
        ariaLabel: 'View code type details',
        action: 'view',
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'codeType',
      direction: 'default',
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    showPagination: true,
    emptyMessage: 'No special processing code types available to display',
    loadingMessage: 'Loading special processing code types...',
  };

  masterDataSource: SPGroupedCodeTypeDto[] = [];
  masterIsLoading = false;
  masterSearchKeyword = '';
  masterFilterOverlayRef: OverlayRef | null = null;
  masterAppliedFilters: SpecialProcessingFilterValue | null = null;
  masterFilterChips: FilterChip[] = [];

  // Detail view config
  detailSearchConfig: SearchBarConfig = {
    placeholder: 'Search by code or description',
    ariaLabel: 'Search by code or description',
    minLength: 2,
    searchOnEnterOnly: true,
    alwaysShowTooltip: false,
  };

  detailTableConfig: DataTableConfig<SPMasterCodeDto> = {
    columns: [
      { key: 'code', header: 'Code', sortable: true, width: '140px' },
      { key: 'codeDesc', header: 'Description', sortable: false, width: '300px' },
      { key: 'effDate', header: 'Effective Date', width: '150px' },
      { key: 'termDate', header: 'Termination Date', width: '160px' },
      { key: 'lastModifiedDate', header: 'Modification Date', width: '160px' },
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit',
        ariaLabel: 'Edit code',
        action: 'edit',
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'code',
      direction: 'default',
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    showPagination: true,
    emptyMessage: 'No codes available to display',
    loadingMessage: 'Loading codes...',
  };

  detailDataSource: SPMasterCodeDto[] = [];
  detailIsLoading = false;
  detailSearchKeyword = '';
  detailFilterOverlayRef: OverlayRef | null = null;
  detailAppliedFilters: SpecialProcessingFilterValue | null = null;
  detailFilterChips: FilterChip[] = [];

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: SPMasterCodeDto | null = null;
  statusMessage = '';

  ngOnInit(): void {
    this.loadMasterData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetToMasterView();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private getMasterPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || 'Special Processing Master codes';
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null },
      ],
    };
  }

  private getDetailPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const parentTitle = menuItem?.label || 'Special Processing Master codes';
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: parentTitle, link: null },
        { label: this.selectedCodeType, link: null },
      ],
      title: this.selectedCodeTypeDesc || this.selectedCodeType,
      subtitle: this.selectedCodeType,
      showBackButton: true,
      onBackClick: () => this.navigateBackToMaster(),
      actions: [
        {
          label: 'ADD NEW CODE',
          icon: 'add',
          variant: 'filled',
          ariaLabel: 'Add new code',
          onClick: () => this.openAddDrawer(),
        },
      ],
    };
  }

  // ===================== MASTER VIEW =====================

  loadMasterData(): void {
    this.masterIsLoading = true;

    const pageSize = this.masterTableConfig.pagination?.pageSize ?? 10;
    const pageIndex = this.masterTableConfig.pagination?.pageIndex ?? 0;

    const sortDir = this.masterTableConfig.sortConfig?.direction;
    const sortColumn = this.masterTableConfig.sortConfig?.column;

    const params: SPMasterCodeQueryParams = {
      searchKeyword: this.masterSearchKeyword || undefined,
      sortColumn: sortDir && sortDir !== 'default' ? sortColumn : undefined,
      sortOrder: sortDir === 'A' ? 'ASC' : sortDir === 'D' ? 'DESC' : undefined,
      effDatePeriod: this.masterAppliedFilters?.effDatePeriod?.toUpperCase() as SPMasterCodeQueryParams['effDatePeriod'],
      effDate: this.masterAppliedFilters?.effDate,
      termDatePeriod: this.masterAppliedFilters?.termDatePeriod?.toUpperCase() as SPMasterCodeQueryParams['termDatePeriod'],
      termDate: this.masterAppliedFilters?.termDate,
    };

    this.service
      .getGroupedList(pageSize, pageIndex * pageSize, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.masterDataSource = (response.items || []).map((item) => ({
            ...item,
            effDate: this.formatDateForDisplay(item.effDate),
            termDate: this.formatDateForDisplay(item.termDate),
            lastModifiedDate: this.formatDateForDisplay(item.lastModifiedDate),
          }));
          if (this.masterTableConfig.pagination) {
            this.masterTableConfig.pagination.totalRecords = response.totalRecords || 0;
          }
          this.masterTableConfig = { ...this.masterTableConfig };
          this.masterIsLoading = false;
          this.cdr.detectChanges();
          const count = response.totalRecords || 0;
          this.announceStatus(`${count} code type${count !== 1 ? 's' : ''} loaded`);
        },
        error: () => {
          this.masterDataSource = [];
          if (this.masterTableConfig.pagination) {
            this.masterTableConfig.pagination.totalRecords = 0;
          }
          this.masterIsLoading = false;
          this.cdr.detectChanges();
          this.announceStatus('Failed to load code types');
        },
      });
  }

  onMasterSearch(keyword: string): void {
    const trimmed = keyword?.trim() || '';
    if (trimmed.length > 0 && trimmed.length < 3) return;
    this.masterSearchKeyword = trimmed;
    if (this.masterTableConfig.pagination) this.masterTableConfig.pagination.pageIndex = 0;
    this.loadMasterData();
  }

  onMasterPageChange(event: TablePageEvent): void {
    if (this.masterTableConfig.pagination) {
      this.masterTableConfig.pagination.pageIndex = event.pageIndex;
      this.masterTableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadMasterData();
  }

  onMasterSortChange(event: TableSortEvent): void {
    if (this.masterTableConfig.sortConfig) {
      this.masterTableConfig.sortConfig.column = event.column;
      this.masterTableConfig.sortConfig.direction = event.direction;
    }
    this.loadMasterData();
  }

  onMasterRowAction(event: TableRowActionEvent<SPGroupedCodeTypeDto>): void {
    if (event.action === 'view') {
      this.navigateToDetail(event.row);
    }
  }

  // ===================== DETAIL VIEW =====================

  navigateToDetail(row: SPGroupedCodeTypeDto): void {
    this.selectedCodeType = row.codeType;
    this.selectedCodeTypeDesc = row.codeTypeDesc;
    this.currentView = 'detail';
    this.pageHeaderConfig = this.getDetailPageHeaderConfig();
    this.detailSearchKeyword = '';
    this.detailAppliedFilters = null;
    this.detailFilterChips = [];
    if (this.detailTableConfig.pagination) {
      this.detailTableConfig.pagination.pageIndex = 0;
      this.detailTableConfig.pagination.totalRecords = 0;
    }
    if (this.detailTableConfig.sortConfig) {
      this.detailTableConfig.sortConfig.column = 'code';
      this.detailTableConfig.sortConfig.direction = 'default';
    }
    this.loadDetailData();
    this.cdr.detectChanges();
  }

  navigateBackToMaster(): void {
    this.closeSideDrawer();
    this.closeFilterPanel();
    this.resetToMasterView();
  }

  private resetToMasterView(): void {
    this.currentView = 'master';
    this.selectedCodeType = '';
    this.selectedCodeTypeDesc = '';
    this.pageHeaderConfig = this.getMasterPageHeaderConfig();
    this.masterSearchKeyword = '';
    this.masterAppliedFilters = null;
    this.masterFilterChips = [];
    this.detailDataSource = [];
    this.closeSideDrawer();
    this.closeFilterPanel();
    if (this.masterTableConfig.pagination) {
      this.masterTableConfig.pagination.pageIndex = 0;
    }
    if (this.masterTableConfig.sortConfig) {
      this.masterTableConfig.sortConfig.column = 'codeType';
      this.masterTableConfig.sortConfig.direction = 'default';
    }
    this.loadMasterData();
  }

  loadDetailData(): void {
    if (!this.selectedCodeType) return;
    this.detailIsLoading = true;

    const pageSize = this.detailTableConfig.pagination?.pageSize ?? 10;
    const pageIndex = this.detailTableConfig.pagination?.pageIndex ?? 0;

    const sortDir = this.detailTableConfig.sortConfig?.direction;
    const sortColumn = this.detailTableConfig.sortConfig?.column;

    const params: SPMasterCodeQueryParams = {
      codeType: this.selectedCodeType,
      searchKeyword: this.detailSearchKeyword || undefined,
      sortColumn: sortDir && sortDir !== 'default' ? sortColumn : undefined,
      sortOrder: sortDir === 'A' ? 'ASC' : sortDir === 'D' ? 'DESC' : undefined,
      effDatePeriod: this.detailAppliedFilters?.effDatePeriod?.toUpperCase() as SPMasterCodeQueryParams['effDatePeriod'],
      effDate: this.detailAppliedFilters?.effDate,
      termDatePeriod: this.detailAppliedFilters?.termDatePeriod?.toUpperCase() as SPMasterCodeQueryParams['termDatePeriod'],
      termDate: this.detailAppliedFilters?.termDate,
    };

    this.service
      .getList(pageSize, pageIndex * pageSize, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.detailDataSource = (response.items || []).map((item) => ({
            ...item,
            effDate: this.formatDateForDisplay(item.effDate),
            termDate: this.formatDateForDisplay(item.termDate),
            lastModifiedDate: this.formatDateForDisplay(item.lastModifiedDate),
          }));
          if (this.detailTableConfig.pagination) {
            this.detailTableConfig.pagination.totalRecords = response.totalRecords || 0;
          }
          this.detailTableConfig = { ...this.detailTableConfig };
          this.detailIsLoading = false;
          this.cdr.detectChanges();
          const count = response.totalRecords || 0;
          this.announceStatus(`${count} code${count !== 1 ? 's' : ''} loaded`);
        },
        error: () => {
          this.detailDataSource = [];
          if (this.detailTableConfig.pagination) {
            this.detailTableConfig.pagination.totalRecords = 0;
          }
          this.detailIsLoading = false;
          this.cdr.detectChanges();
          this.announceStatus('Failed to load codes');
        },
      });
  }

  onDetailSearch(keyword: string): void {
    const trimmed = keyword?.trim() || '';
    if (trimmed.length > 0 && trimmed.length < 2) return;
    this.detailSearchKeyword = trimmed;
    if (this.detailTableConfig.pagination) this.detailTableConfig.pagination.pageIndex = 0;
    this.loadDetailData();
  }

  onDetailPageChange(event: TablePageEvent): void {
    if (this.detailTableConfig.pagination) {
      this.detailTableConfig.pagination.pageIndex = event.pageIndex;
      this.detailTableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadDetailData();
  }

  onDetailSortChange(event: TableSortEvent): void {
    if (this.detailTableConfig.sortConfig) {
      this.detailTableConfig.sortConfig.column = event.column;
      this.detailTableConfig.sortConfig.direction = event.direction;
    }
    this.loadDetailData();
  }

  onDetailRowAction(event: TableRowActionEvent<SPMasterCodeDto>): void {
    if (event.action === 'edit') {
      this.openEditDrawer(event.row);
    }
  }

  // ===================== FILTER PANEL =====================

  openFilterPanel(): void {
    const overlayRef = this.currentView === 'master' ? this.masterFilterOverlayRef : this.detailFilterOverlayRef;
    if (overlayRef) {
      overlayRef.dispose();
      if (this.currentView === 'master') this.masterFilterOverlayRef = null;
      else this.detailFilterOverlayRef = null;
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterButtonRef)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
      ])
      .withPush(true);

    const newOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const filterPortal = new ComponentPortal(SpecialProcessingFilterPanel);
    const componentRef = newOverlayRef.attach(filterPortal);

    const currentFilters = this.currentView === 'master' ? this.masterAppliedFilters : this.detailAppliedFilters;
    componentRef.instance.currentFilters = currentFilters;

    componentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      this.applyFilters(filters);
      this.closeFilterPanel();
    });

    componentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    newOverlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    if (this.currentView === 'master') this.masterFilterOverlayRef = newOverlayRef;
    else this.detailFilterOverlayRef = newOverlayRef;
  }

  closeFilterPanel(): void {
    if (this.masterFilterOverlayRef) {
      this.masterFilterOverlayRef.dispose();
      this.masterFilterOverlayRef = null;
    }
    if (this.detailFilterOverlayRef) {
      this.detailFilterOverlayRef.dispose();
      this.detailFilterOverlayRef = null;
    }
  }

  get isFilterActive(): boolean {
    return this.currentView === 'master' ? !!this.masterFilterOverlayRef : !!this.detailFilterOverlayRef;
  }

  get activeFilterChips(): FilterChip[] {
    return this.currentView === 'master' ? this.masterFilterChips : this.detailFilterChips;
  }

  applyFilters(filters: SpecialProcessingFilterValue): void {
    if (this.currentView === 'master') {
      this.masterAppliedFilters = filters;
      this.masterFilterChips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(filters);
      if (this.masterTableConfig.pagination) this.masterTableConfig.pagination.pageIndex = 0;
      this.loadMasterData();
    } else {
      this.detailAppliedFilters = filters;
      this.detailFilterChips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(filters);
      if (this.detailTableConfig.pagination) this.detailTableConfig.pagination.pageIndex = 0;
      this.loadDetailData();
    }
  }

  onRemoveFilterChip(chipKey: string): void {
    if (this.currentView === 'master') {
      this.masterAppliedFilters = SpecialProcessingFilterChipsUtils.removeFilterByChipKey(this.masterAppliedFilters, chipKey);
      this.masterFilterChips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(this.masterAppliedFilters);
      if (this.masterTableConfig.pagination) this.masterTableConfig.pagination.pageIndex = 0;
      this.loadMasterData();
    } else {
      this.detailAppliedFilters = SpecialProcessingFilterChipsUtils.removeFilterByChipKey(this.detailAppliedFilters, chipKey);
      this.detailFilterChips = SpecialProcessingFilterChipsUtils.convertFiltersToChips(this.detailAppliedFilters);
      if (this.detailTableConfig.pagination) this.detailTableConfig.pagination.pageIndex = 0;
      this.loadDetailData();
    }
  }

  onClearAllFilters(): void {
    if (this.currentView === 'master') {
      this.masterAppliedFilters = null;
      this.masterFilterChips = [];
      if (this.masterTableConfig.pagination) this.masterTableConfig.pagination.pageIndex = 0;
      this.loadMasterData();
    } else {
      this.detailAppliedFilters = null;
      this.detailFilterChips = [];
      if (this.detailTableConfig.pagination) this.detailTableConfig.pagination.pageIndex = 0;
      this.loadDetailData();
    }
  }

  // ===================== SIDE PANEL =====================

  private sidePanelTriggerElement: HTMLElement | null = null;

  openAddDrawer(): void {
    this.sidePanelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    this.cdr.detectChanges();
    this.focusSidePanel();
  }

  openEditDrawer(data: SPMasterCodeDto): void {
    this.sidePanelTriggerElement = document.activeElement as HTMLElement;
    this.sidePanelMode = 'edit';
    this.sidePanelData = data;
    this.sidePanelOpen = true;
    this.cdr.detectChanges();
    this.focusSidePanel();
  }

  closeSideDrawer(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.cdr.detectChanges();
    if (this.sidePanelTriggerElement) {
      this.sidePanelTriggerElement.focus();
      this.sidePanelTriggerElement = null;
    }
  }

  private focusSidePanel(): void {
    setTimeout(() => {
      const panel = document.querySelector('.side-panel') as HTMLElement;
      const firstFocusable = panel?.querySelector(
        'button, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) as HTMLElement;
      firstFocusable?.focus();
    }, 100);
  }

  onSave(data: CreateSPMasterCodeRequest | UpdateSPMasterCodeRequest): void {
    if (!this.selectedCodeType) return;

    if (this.sidePanelMode === 'add') {
      const createData = data as CreateSPMasterCodeRequest;
      this.service
        .create(createData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSnackbar(`New code ${createData.code} has been added successfully.`);
            this.closeSideDrawer();
            this.loadDetailData();
          },
          error: (error) => this.handleSaveError(error),
        });
    } else {
      const code = this.sidePanelData!.code;
      this.service
        .update(this.selectedCodeType, code, data as UpdateSPMasterCodeRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSnackbar(`Code ${code} has been updated successfully.`);
            this.closeSideDrawer();
            this.loadDetailData();
          },
          error: (error) => this.handleSaveError(error),
        });
    }
  }

  onSaveAndCreateAnother(data: CreateSPMasterCodeRequest): void {
    if (!this.selectedCodeType) return;

    this.service
      .create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar(`New code ${data.code} has been added successfully.`);
          this.loadDetailData();
          this.sideDrawerComponent?.resetForm();
          this.sidePanelMode = 'add';
          this.sidePanelData = null;
          this.cdr.detectChanges();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  // ===================== UTILITIES =====================

  private announceStatus(message: string): void {
    this.statusMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.statusMessage = message;
      this.cdr.detectChanges();
    }, 100);
  }

  private formatDateForDisplay(date: string | null): string | null {
    if (!date) return null;
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private handleSaveError(error: { status?: number; error?: { errorCode?: string; errorResponse?: { errorCode?: string; error?: string }; message?: string; error?: string } }): void {
    let errorMessage = 'An error occurred while saving. Please try again.';

    if (error.error?.errorResponse?.error) {
      errorMessage = error.error.errorResponse.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 404) {
      errorMessage = 'SP Master Code not found';
    }

    this.sideDrawerComponent?.setErrorMessage(errorMessage);
    this.cdr.detectChanges();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c' && !this.sidePanelOpen && this.currentView === 'detail') {
      event.preventDefault();
      this.openAddDrawer();
    }

    if (event.altKey && event.key.toLowerCase() === 'f' && !this.isFilterActive) {
      event.preventDefault();
      this.openFilterPanel();
    }

    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        this.closeSideDrawer();
      } else if (this.isFilterActive) {
        this.closeFilterPanel();
      }
    }
  }
}
