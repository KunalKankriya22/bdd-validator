import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Subject, takeUntil } from 'rxjs';

import { PrePrintedProductLabelsApiService } from './services/pre-printed-product-labels-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  PrePrintedProductLabelModel,
  PrePrintedProductLabelQueryParamsDto,
  PrePrintedProductLabelFilterValue,
  PrePrintedProductLabelFormValue,
  PrePrintedProductLabelCreateDto,
  PrePrintedProductLabelUpdateDto,
  LookUp,
  LookUpWithDescription
} from './models/pre-printed-product-labels.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PrePrintedProductLabelFilterChipsUtils } from './utils/filter-chips.utils';
import { PrePrintedProductLabelFilterPanel } from './pre-printed-product-label-filter-panel/pre-printed-product-label-filter-panel';
import { AddEditPrePrintedProductLabelComponent } from './add-edit-pre-printed-product-label/add-edit-pre-printed-product-label';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';

@Component({
  selector: 'app-pre-printed-product-labels',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditPrePrintedProductLabelComponent
  ],
  templateUrl: './pre-printed-product-labels.component.html',
  styleUrls: ['./pre-printed-product-labels.component.scss']
})
export class PrePrintedProductLabelsComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild(AddEditPrePrintedProductLabelComponent) addEditComponent!: AddEditPrePrintedProductLabelComponent;

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

  tableConfig: DataTableConfig<PrePrintedProductLabelModel> = {
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
      column: 'catalogNumber',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: PrePrintedProductLabelFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: PrePrintedProductLabelModel[] = [];
  requestState: PrePrintedProductLabelQueryParamsDto = {};

  // Add/Edit dropdown options (all active master data)
  catalogNumberOptions: LookUp[] = [];
  productTypeOptions: LookUpWithDescription[] = [];
  bagCodeOptions: LookUpWithDescription[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';

  isFilterOpen = false;

  // Side panel state
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: PrePrintedProductLabelModel | null = null;

  private destroy$ = new Subject<void>();
  private overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: PrePrintedProductLabelsApiService,
    private overlay: Overlay,
    private loggingService: LoggingService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService,
    private menuService: MenuService,
    private liveAnnouncer: LiveAnnouncer
  ) {
    this.initializeConfigurations();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.PrePrintedProductLabels]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadLookupOptions();
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadLookupOptions();
        this.loadData();
      });
  }

  private loadLookupOptions(): void {
    this.service.getAddDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.catalogNumberOptions = response.catalogNumbers;
          this.productTypeOptions = response.productTypes;
          this.bagCodeOptions = response.bagCodes;
        },
        error: (error) => {
          this.loggingService.error('Error loading add/edit dropdown options', error);
          this.snackbarService.showError('Failed to load form options');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private closeOverlay(): void {
    this.overlayClose$.next();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW PRE-PRINTED PRODUCT LABEL',
          icon: 'add',
          onClick: () => this.openAddPanel(),
          color: 'primary',
          matButton: 'raised'
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by Product Type',
      minLength: 3,
      ariaLabel: 'Search by Product Type',
      searchOnEnterOnly: true
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
        column: 'catalogNumber',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No pre-printed product labels available to display',
      loadingMessage: 'Loading pre-printed product labels...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<PrePrintedProductLabelModel>[] {
    return [
      {
        key: 'catalogNumber',
        header: 'Catalog Number',
        sortable: true,
        width: '160px'
      },
      {
        key: 'productType',
        header: 'Product Type',
        width: '140px'
      },
      {
        key: 'productTypeDesc',
        header: 'Description',
        width: '220px'
      },
      {
        key: 'bagCode',
        header: 'Bag Code',
        width: '120px'
      },
      {
        key: 'faceLabel',
        header: 'Face Label',
        width: '140px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<PrePrintedProductLabelModel>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit pre-printed product label',
        ariaLabel: 'Edit pre-printed product label',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 25);

    const take = this.tableConfig.pagination?.pageSize || 25;

    const queryDto: PrePrintedProductLabelQueryParamsDto = {
      catalogNumber: this.requestState.catalogNumber || undefined,
      productType: this.requestState.productType || undefined,
      bagCode: this.requestState.bagCode || undefined,
      faceLabel: this.requestState.faceLabel || undefined,
      searchKeyword: this.requestState.searchKeyword || undefined,
      effDate: this.requestState.effDate || undefined,
      effDatePeriod: this.requestState.effDatePeriod || undefined,
      termDate: this.requestState.termDate || undefined,
      termDatePeriod: this.requestState.termDatePeriod || undefined,
      sortColumn: this.requestState.sortColumn || undefined,
      sortOrder: this.requestState.sortOrder || undefined
    };

    this.service
      .getPrePrintedProductLabels(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalCount;
          this.isLoading = false;
          this.liveAnnouncer.announce(`Loaded ${response.totalCount} pre-printed product labels`);
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading pre-printed product labels', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
          this.liveAnnouncer.announce('Failed to load data');
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
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

    this.requestState.sortColumn = event.column;
    this.requestState.sortOrder =
      event.direction === 'default' ? undefined : (event.direction === 'A' ? 'ASC' : 'DESC');

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<PrePrintedProductLabelModel>): void {
    switch (event.action) {
      case 'edit':
        this.openEditPanel(event.row);
        break;
    }
  }

  // Side Panel Methods
  openAddPanel(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    this.focusSidePanel();
  }

  openEditPanel(row: PrePrintedProductLabelModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
    this.focusSidePanel();
  }

  private focusSidePanel(): void {
    setTimeout(() => {
      const panel = document.querySelector('.side-panel-container');
      const focusable = panel?.querySelector<HTMLElement>(
        'mat-select, input, button:not(.close-btn)'
      );
      focusable?.focus();
    });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onPanelSave(formValue: PrePrintedProductLabelFormValue): void {
    if (this.sidePanelMode === 'add') {
      this.handleCreate(formValue, false);
    } else {
      this.handleUpdate(formValue);
    }
  }

  onPanelSaveAndCreateAnother(formValue: PrePrintedProductLabelFormValue): void {
    this.handleCreate(formValue, true);
  }

  private handleCreate(formValue: PrePrintedProductLabelFormValue, createAnother: boolean): void {
    const payload: PrePrintedProductLabelCreateDto = {
      catalogNumber: formValue.catalogNumber!,
      productType: formValue.productType || '',
      bagCode: formValue.bagCode || '',
      faceLabel: formValue.faceLabel || '',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate)!,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined
    };

    this.service.createPrePrintedProductLabel(payload).subscribe({
      next: (response) => {
        this.snackbarService.showSuccess('Pre-Printed Product Label has been successfully added.');
        if (response?.error) {
          this.snackbarService.showInfo(response.error);
        }
        this.loadData();

        if (createAnother) {
          this.addEditComponent?.resetFormForCreateAnother();
        } else {
          this.closeSidePanel();
        }
      },
      error: (error) => {
        if (this.addEditComponent) {
          this.addEditComponent.isSubmitting = false;
          this.addEditComponent.errorMessage = this.extractErrorMessage(error, 'Failed to add pre-printed product label. Please try again.');
          this.addEditComponent.cdr.markForCheck();
        }
      }
    });
  }

  private handleUpdate(formValue: PrePrintedProductLabelFormValue): void {
    if (!this.sidePanelData) return;

    const payload: PrePrintedProductLabelUpdateDto = {
      bagCode: formValue.bagCode || '',
      faceLabel: formValue.faceLabel || '',
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate)!,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined
    };

    this.service.updatePrePrintedProductLabel(
      this.sidePanelData.catalogNumber,
      this.sidePanelData.productType,
      payload
    ).subscribe({
      next: (response) => {
        this.closeSidePanel();
        this.snackbarService.showSuccess('Pre-Printed Product Label has been successfully updated.');
        if (response?.error) {
          this.snackbarService.showInfo(response.error);
        }
        this.loadData();
      },
      error: (error) => {
        if (this.addEditComponent) {
          this.addEditComponent.isSubmitting = false;
          this.addEditComponent.errorMessage = this.extractErrorMessage(error, 'Failed to update pre-printed product label. Please try again.');
          this.addEditComponent.cdr.markForCheck();
        }
      }
    });
  }

  private extractErrorMessage(error: any, fallback: string): string {
    return error?.error?.errorResponse?.error
      || error?.error?.message
      || error?.message
      || fallback;
  }

  // Filter Methods
  openFilter(): void {
    if (this.overlayRef) {
      this.closeOverlay();
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

    const portal = new ComponentPortal(PrePrintedProductLabelFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });
  }

  applyFilters(filters: PrePrintedProductLabelFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      catalogNumber: filters.catalogNumber || undefined,
      productType: filters.productType || undefined,
      bagCode: filters.bagCode || undefined,
      faceLabel: filters.faceLabel || undefined,
      searchKeyword: filters.searchKeyword || undefined,
      effDate: filters.effDate || undefined,
      effDatePeriod: filters.effDatePeriod || undefined,
      termDate: filters.termDate || undefined,
      termDatePeriod: filters.termDatePeriod || undefined
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = PrePrintedProductLabelFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = PrePrintedProductLabelFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return PrePrintedProductLabelFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { catalogNumber, productType, bagCode, faceLabel, searchKeyword, effDate, effDatePeriod, termDate, termDatePeriod, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { catalogNumber, productType, bagCode, faceLabel, searchKeyword, effDate, effDatePeriod, termDate, termDatePeriod, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      catalogNumber: this.appliedFilters.catalogNumber || undefined,
      productType: this.appliedFilters.productType || undefined,
      bagCode: this.appliedFilters.bagCode || undefined,
      faceLabel: this.appliedFilters.faceLabel || undefined,
      searchKeyword: this.appliedFilters.searchKeyword || undefined,
      effDate: this.appliedFilters.effDate || undefined,
      effDatePeriod: this.appliedFilters.effDatePeriod || undefined,
      termDate: this.appliedFilters.termDate || undefined,
      termDatePeriod: this.appliedFilters.termDatePeriod || undefined
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.openAddPanel();
    }

    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.sidePanelOpen) {
        this.closeSidePanel();
      } else if (this.overlayRef) {
        this.closeOverlay();
      }
    }
  }
}
