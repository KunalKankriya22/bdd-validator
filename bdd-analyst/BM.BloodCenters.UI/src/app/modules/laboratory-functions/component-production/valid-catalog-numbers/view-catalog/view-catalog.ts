import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { HeaderService } from '@shared/services/header.service';
import { ROUTES } from '@core/constants/route.constants';

import { ContainerService } from '../services/container.service';
import {
  ContainerDto,
  ContainerQueryParams,
  ContainerFilterValue,
  CreateContainerDto,
  UpdateContainerDto,
  ProductTypeDropdownDto,
  ContainerIdDropdownDto,
} from '../models/container.model';
import { ContainerFilterPanel } from './container-filter-panel/container-filter-panel';
import { AddEditContainerComponent } from './add-edit-container/add-edit-container';

@Component({
  selector: 'app-view-catalog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    FilterChips,
    SearchBar,
    DataTable,
    ContainerFilterPanel,
    AddEditContainerComponent,
  ],
  templateUrl: './view-catalog.html',
  styleUrls: ['./view-catalog.scss'],
})
export class ViewCatalogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly containerService = inject(ContainerService);
  private readonly headerService = inject(HeaderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly overlay = inject(Overlay);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;
  @ViewChild('sideDrawer') sideDrawerComponent?: AddEditContainerComponent;

  catalogNumber = '';
  manufacturer = '';

  filterOverlayRef: OverlayRef | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME },
      { label: 'Component Product Management', link: '/laboratory-functions/component-production/valid-catalog-numbers' },
      { label: '', link: null },
    ],
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Catalog',
    minLength: 2,
    ariaLabel: 'Search by Catalog',
    searchOnEnterOnly: true,
  };

  dataTableConfig: DataTableConfig<ContainerDto> = {
    columns: [
      { key: 'containerId', header: 'Container ID', width: '120px' },
      { key: 'catalogNumber', header: 'Catalog', width: '150px' },
      { key: 'inlineFilterFlag', header: 'ILF Flag', width: '100px' },
      { key: 'productType', header: 'Product Type', width: '150px' },
      { key: 'subProdTypes', header: 'Other Product Types', width: '180px' },
      { key: 'effDate', header: 'Effective Date', width: '140px' },
      { key: 'termDate', header: 'Termination Date', width: '140px' },
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit container',
        ariaLabel: 'Edit container',
        color: 'default',
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
    stickyHeader: true,
    stickyActionsColumn: true,
    showPagination: true,
    emptyMessage: 'No containers found',
    noDataIcon: 'edit',
    loadingMessage: 'Loading containers...',
  };

  dataSource: ContainerDto[] = [];
  isLoading = false;
  searchTerm = '';
  filterChips: FilterChip[] = [];
  currentFilters: ContainerFilterValue = {};

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ContainerDto | null = null;
  editingRow: ContainerDto | null = null;

  productTypes: ProductTypeDropdownDto[] = [];
  containerIds: ContainerIdDropdownDto[] = [];
  filterCatalogNumbers: ContainerIdDropdownDto[] = [];

  get isControlsDisabled(): boolean {
    return this.isLoading;
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.catalogNumber = params['catalogNumber'] || '';
      this.manufacturer = params['manufacturer'] || '';

      if (this.headerConfig.breadcrumbs[2]) {
        this.headerConfig.breadcrumbs[2].label = this.catalogNumber;
      }

      this.loadData();
      this.loadDropdownData();
    });

    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear all filters and search
        this.searchTerm = '';
        this.currentFilters = {};
        this.filterChips = [];
        this.dataTableConfig.pagination!.pageIndex = 0;

        // Reload dropdown data for new chapter
        this.loadDropdownData();

        // Reload table data
        this.loadData();
      });
  }

  loadData(): void {
    if (!this.catalogNumber) {
      return;
    }

    this.isLoading = true;

    const skip = this.dataTableConfig.pagination!.pageIndex * this.dataTableConfig.pagination!.pageSize;
    const take = this.dataTableConfig.pagination!.pageSize;

    const params: ContainerQueryParams = {
      searchKeyword: this.searchTerm || undefined,
      catalogNumber: this.currentFilters.catalogNumber || undefined,
      productType: this.currentFilters.productType || undefined,
      showTerminated: this.currentFilters.showTerminated !== undefined ? (this.currentFilters.showTerminated ? 'Y' : 'N') : undefined,
    };

    this.containerService
      .getContainers(this.catalogNumber, take, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = (response.items || []).map((item) => ({
            ...item,
            effDate: this.formatDate(item.effDate),
            termDate: this.formatDate(item.termDate),
            inlineFilterFlag: item.inlineFilterFlag === 'Y' ? 'Yes' : 'No',
            subProdTypes: item.subProdTypes || '-',
          }));
          this.dataTableConfig.pagination!.totalRecords = response.totalRecords || 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.dataSource = [];
          this.dataTableConfig.pagination!.totalRecords = 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private formatDate(date: string | null): string | null {
    if (!date) return null;
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }

  onSearch(searchKeyword: string): void {
    const trimmed = searchKeyword?.trim() || '';
    if (trimmed.length > 0 && trimmed.length < 2) {
      return;
    }
    this.searchTerm = trimmed;
    this.dataTableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.dataTableConfig.pagination!.pageIndex = event.pageIndex;
    this.dataTableConfig.pagination!.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    // Implement sorting if needed
  }

  onRowAction(event: TableRowActionEvent<ContainerDto>): void {
    if (event.action === 'edit') {
      this.sidePanelMode = 'edit';
      this.sidePanelData = event.row;
      this.editingRow = event.row;
      this.sidePanelOpen = true;
      this.cdr.detectChanges();
    }
  }

  openAddDrawer(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.editingRow = null;
    this.sidePanelOpen = true;
    this.cdr.detectChanges();
  }

  private loadDropdownData(): void {
    this.loadProductTypes();
    this.loadContainerIds();
    this.loadFilterCatalogNumbers();
  }

  closeSideDrawer(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.editingRow = null;
    this.cdr.detectChanges();
  }

  private loadProductTypes(): void {
    this.containerService
      .getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.productTypes = data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.productTypes = [];
        },
      });
  }

  private loadContainerIds(): void {
    this.containerService
      .getContainerIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.containerIds = data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.containerIds = [];
        },
      });
  }

  private loadFilterCatalogNumbers(): void {
    this.containerService
      .getFilterCatalogNumbers(this.catalogNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.filterCatalogNumbers = data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.filterCatalogNumbers = [];
        },
      });
  }

  // Filter panel
  openFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
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

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const filterPortal = new ComponentPortal(ContainerFilterPanel);
    const componentRef = this.filterOverlayRef.attach(filterPortal);

    componentRef.instance.currentFilters = this.currentFilters;
    componentRef.instance.baseCatalogNo = this.catalogNumber;

    componentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      this.applyFilters(filters);
      this.closeFilterPanel();
    });

    componentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    this.filterOverlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });
  }

  closeFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
  }

  applyFilters(filters: ContainerFilterValue): void {
    this.currentFilters = filters;
    this.filterChips = this.convertFiltersToChips(filters);
    this.dataTableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  private convertFiltersToChips(filters: ContainerFilterValue): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.catalogNumber) {
      chips.push({
        key: 'catalogNumber',
        label: `Catalog No: ${filters.catalogNumber}`,
        value: filters.catalogNumber,
      });
    }

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType,
      });
    }

    if (filters.showTerminated !== undefined && filters.showTerminated !== null) {
      chips.push({
        key: 'showTerminated',
        label: `Show Terminated: ${filters.showTerminated ? 'Yes' : 'No'}`,
        value: filters.showTerminated,
      });
    }

    return chips;
  }

  removeFilterChip(chipKey: string): void {
    if (chipKey === 'catalogNumber') {
      this.currentFilters.catalogNumber = undefined;
    } else if (chipKey === 'productType') {
      this.currentFilters.productType = undefined;
    } else if (chipKey === 'showTerminated') {
      this.currentFilters.showTerminated = undefined;
    }

    this.filterChips = this.convertFiltersToChips(this.currentFilters);
    this.dataTableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  clearAllFiltersChips(): void {
    this.currentFilters = {};
    this.filterChips = [];
    this.dataTableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  // Container save handlers
  onSave(data: CreateContainerDto | UpdateContainerDto): void {
    if (this.sidePanelMode === 'add') {
      const containerId = (data as CreateContainerDto).containerId;
      this.containerService
        .createContainer(data as CreateContainerDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            // Check if API returned success: false in response body
            if (response && typeof response === 'object' && 'success' in response && response.success === false) {
              this.handleSaveError({ error: response as any });
              return;
            }
            this.showSnackbar(`Container ${containerId} has been added.`);
            this.closeSideDrawer();
            this.loadData();
          },
          error: (error) => this.handleSaveError(error),
        });
    } else {
      const catalogNumber = this.sidePanelData!.catalogNumber;
      this.containerService
        .updateContainer(catalogNumber, data as UpdateContainerDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            // Check if API returned success: false in response body
            if (response && typeof response === 'object' && 'success' in response && response.success === false) {
              this.handleSaveError({ error: response as any });
              return;
            }
            this.showSnackbar(`Container ${catalogNumber} has been updated.`);
            this.closeSideDrawer();
            this.loadData();
          },
          error: (error) => this.handleSaveError(error),
        });
    }
  }

  onSaveAndCreateAnother(data: CreateContainerDto): void {
    this.containerService
      .createContainer(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Check if API returned success: false in response body
          if (response && typeof response === 'object' && 'success' in response && response.success === false) {
            this.handleSaveError({ error: response as any });
            return;
          }
          this.showSnackbar(`Container ${data.containerId} has been added.`);
          this.loadData();
          this.sideDrawerComponent?.resetForm();
          this.sidePanelMode = 'add';
          this.sidePanelData = null;
          this.cdr.detectChanges();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  private handleSaveError(error: { status?: number; error?: { errorCode?: string; errorResponse?: { error?: string }; message?: string; error?: string } }): void {
    let errorMessage = 'An error occurred while saving. Please try again.';
    let errorCode = '';

    // Extract error code
    if (error.error?.errorCode) {
      errorCode = error.error.errorCode;
    }

    // Extract error message
    if (error.error?.errorResponse?.error) {
      errorMessage = error.error.errorResponse.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.status === 404) {
      errorMessage = 'The container record was not found. It may have been deleted.';
    }

    // Strip "Error: " prefix if present, then add it back for consistency
    errorMessage = errorMessage.replace(/^Error:\s*/i, '');
    const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : `Error: ${errorMessage}`;

    // Show error in snackbar
    this.snackBar.open(displayMessage, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['catalog-error-snackbar'],
    });

    // Reset submitting state in the side drawer
    if (this.sideDrawerComponent) {
      this.sideDrawerComponent.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  goBack(): void {
    this.location.back();
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }
}
