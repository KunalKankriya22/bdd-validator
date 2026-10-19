import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackbarService } from '@shared/services/snackbar.service';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { ValidCatalogNumbersService } from './services/valid-catalog-numbers.service';
import {
  ValidCatalogDto,
  ValidCatalogQueryParams,
  ValidCatalogFilterValue,
  CreateValidCatalogDto,
  UpdateValidCatalogDto,
  CatalogNumberDropdownDto,
  ManufacturerDropdownDto,
  AnticoagulantDropdownDto,
  AdditiveDropdownDto,
} from './models/valid-catalog-numbers.model';
import { CatalogFilterPanel } from './catalog-filter-panel/catalog-filter-panel';
import { AddEditCatalogComponent } from './add-edit-catalog/add-edit-catalog';
import { CatalogFilterChipsUtils } from './utils/filter-chips.utils';
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
  selector: 'app-valid-catalog-numbers',
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
    CatalogFilterPanel,
    AddEditCatalogComponent,
  ],
  templateUrl: './valid-catalog-numbers.html',
  styleUrls: ['./valid-catalog-numbers.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidCatalogNumbersComponent implements OnInit, OnDestroy {
  private readonly catalogService = inject(ValidCatalogNumbersService);
  private readonly overlay = inject(Overlay);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;
  @ViewChild('sideDrawer') sideDrawerComponent?: AddEditCatalogComponent;

  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by Catalog, Manufacturer or Manufacturer Description',
    ariaLabel: 'Search by Catalog, Manufacturer or Manufacturer Description',
    minLength: 2,
    searchOnEnterOnly: true,
  };

  dataTableConfig: DataTableConfig<ValidCatalogDto> = {
    columns: [
      { key: 'manufacturerCode', header: 'Manufacturer', width: '120px' },
      { key: 'manufacturer', header: 'Manufacturer Description', width: '200px' },
      { key: 'catalogNumber', header: 'Catalog', width: '110px' },
      { key: 'totalBagsInSet', header: 'No. of Bags', width: '100px' },
      { key: 'numberOfProds', header: 'No. of Products', width: '120px' },
      { key: 'bagVolume', header: 'Bag Volume', width: '100px' },
      { key: 'anticoagulant', header: 'Anticoagulant', width: '120px' },
      { key: 'additiveSolution', header: 'Additive Solution', width: '140px' },
      { key: 'instSpecificCode', header: 'Ins', width: '80px' },
      { key: 'effDate', header: 'Effective Date', width: '120px' },
      { key: 'termDate', header: 'Termination Date', width: '140px' },
    ],
    rowActions: [
      {
        icon: 'visibility',
        iconSvg: 'assets/images/icons/eye.svg',
        label: 'View catalog containers',
        ariaLabel: 'View catalog containers',
        color: 'default',
        action: 'view',
      },
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit catalog record',
        ariaLabel: 'Edit catalog record',
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
    emptyMessage: 'No catalog numbers available to display',
    loadingMessage: 'Loading catalog numbers...',
    noDataIcon: 'edit',
  };

  dataSource: ValidCatalogDto[] = [];
  isLoading = false;
  searchKeyword = '';

  filterOverlayRef: OverlayRef | null = null;
  appliedFilters: ValidCatalogFilterValue | null = null;
  filterChips: FilterChip[] = [];

  catalogNumbers: CatalogNumberDropdownDto[] = [];
  manufacturers: ManufacturerDropdownDto[] = [];
  filterManufacturers: ManufacturerDropdownDto[] = [];
  anticoagulants: AnticoagulantDropdownDto[] = [];
  additives: AdditiveDropdownDto[] = [];

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ValidCatalogDto | null = null;
  editingRow: ValidCatalogDto | null = null;

  ngOnInit(): void {
    this.loadData();
    this.loadDropdowns();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchKeyword = '';
        this.appliedFilters = null;
        this.filterChips = [];
        this.closeSideDrawer();
        this.closeFilterPanel();
        this.dataSource = [];
        if (this.dataTableConfig.pagination) {
          this.dataTableConfig.pagination.pageIndex = 0;
          this.dataTableConfig.pagination.totalRecords = 0;
        }
        if (this.dataTableConfig.sortConfig) {
          this.dataTableConfig.sortConfig.column = 'catalogNumber';
          this.dataTableConfig.sortConfig.direction = 'default';
        }
        this.loadData();
        this.loadDropdowns();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private loadDropdowns(): void {
    this.catalogService
      .getFilterCatalogNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.catalogNumbers = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.catalogNumbers = [];
          this.snackbarService.showError('Failed to load catalog number options');
        },
      });

    this.catalogService
      .getManufacturers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.manufacturers = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.manufacturers = [];
          this.snackbarService.showError('Failed to load manufacturers');
        },
      });

    this.catalogService
      .getFilterManufacturers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.filterManufacturers = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.filterManufacturers = [];
          this.snackbarService.showError('Failed to load manufacturer filter options');
        },
      });

    this.catalogService
      .getAnticoagulants()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.anticoagulants = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.anticoagulants = [];
          this.snackbarService.showError('Failed to load anticoagulant options');
        },
      });

    this.catalogService
      .getAdditives()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.additives = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.additives = [];
          this.snackbarService.showError('Failed to load additive solution options');
        },
      });
  }

  loadData(): void {
    this.isLoading = true;

    const pageSize = this.dataTableConfig.pagination?.pageSize ?? 25;
    const pageIndex = this.dataTableConfig.pagination?.pageIndex ?? 0;
    const take = pageSize;
    const skip = pageIndex * pageSize;

    const sortDir = this.dataTableConfig.sortConfig?.direction;
    const sortColumnMap: Record<string, string> = {
      manufacturerCode: 'MANUFACTURER_CODE',
      manufacturer: 'MANUFACTURER',
      catalogNumber: 'CATALOG_NUMBER',
    };
    const sortColumn = this.dataTableConfig.sortConfig?.column
      ? sortColumnMap[this.dataTableConfig.sortConfig.column] || this.dataTableConfig.sortConfig.column
      : undefined;

    const params: ValidCatalogQueryParams = {
      searchKeyword: this.searchKeyword || undefined,
      sortColumn: sortDir && sortDir !== 'default' ? sortColumn : undefined,
      sortOrder: sortDir === 'A' ? 'ASC' : sortDir === 'D' ? 'DESC' : undefined,
    };

    if (this.appliedFilters) {
      if (this.appliedFilters.catalogNumber) {
        params.catalogNumber = this.appliedFilters.catalogNumber;
      }
      if (this.appliedFilters.manufacturerCode) {
        params.manufacturerCode = this.appliedFilters.manufacturerCode;
      }
      if (this.appliedFilters.manufacturer) {
        params.manufacturer = this.appliedFilters.manufacturer;
      }
      if (this.appliedFilters.showTerminated !== undefined && this.appliedFilters.showTerminated !== null) {
        params.showTerminated = this.appliedFilters.showTerminated ? 'Y' : 'N';
      }
      if (this.appliedFilters.effDate) {
        params.effDate = this.appliedFilters.effDate;
      }
      if (this.appliedFilters.effDatePeriod) {
        params.effDatePeriod = this.appliedFilters.effDatePeriod;
      }
      if (this.appliedFilters.termDate) {
        params.termDate = this.appliedFilters.termDate;
      }
      if (this.appliedFilters.termDatePeriod) {
        params.termDatePeriod = this.appliedFilters.termDatePeriod;
      }
    }

    this.catalogService
      .getValidCatalogs(take, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = (response.items || []).map((item) => ({
            ...item,
            effDate: this.formatDateForDisplay(item.effDate),
            termDate: this.formatDateForDisplay(item.termDate),
          }));
          if (this.dataTableConfig.pagination) {
            this.dataTableConfig.pagination.totalRecords = response.totalRecords || 0;
          }
          this.dataTableConfig = { ...this.dataTableConfig };
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.dataSource = [];
          if (this.dataTableConfig.pagination) {
            this.dataTableConfig.pagination.totalRecords = 0;
          }
          this.isLoading = false;
          this.snackbarService.showError('Failed to load catalog numbers');
          this.cdr.markForCheck();
        },
      });
  }

  private formatDateForDisplay(date: string | null): string | null {
    if (!date) return null;
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }

  onSearch(keyword: string): void {
    const trimmed = keyword?.trim() || '';
    if (trimmed.length > 0 && trimmed.length < 2) {
      return;
    }
    this.searchKeyword = trimmed;
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = event.pageIndex;
      this.dataTableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.dataTableConfig.sortConfig) {
      this.dataTableConfig.sortConfig.column = event.column;
      this.dataTableConfig.sortConfig.direction = event.direction;
    }
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<ValidCatalogDto>): void {
    if (event.action === 'edit') {
      this.openEditDrawer(event.row);
    } else if (event.action === 'view') {
      this.navigateToView(event.row);
    }
  }

  navigateToView(catalog: ValidCatalogDto): void {
    if (!catalog.catalogNumber || !catalog.manufacturerCode) {
      this.snackbarService.showError('Cannot view catalog details: Missing catalog number or manufacturer code');
      return;
    }

    this.router.navigate([
      '/laboratory-functions/component-production/catalog-view',
      catalog.catalogNumber,
      catalog.manufacturerCode,
    ]);
  }

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
      panelClass: 'filter-panel-overlay',
    });

    const filterPortal = new ComponentPortal(CatalogFilterPanel);
    const componentRef = this.filterOverlayRef.attach(filterPortal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.catalogNumbers = this.catalogNumbers;
    componentRef.instance.manufacturers = this.filterManufacturers;

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

  applyFilters(filters: ValidCatalogFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = CatalogFilterChipsUtils.convertFiltersToChips(filters);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = CatalogFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = CatalogFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  openAddDrawer(): void {
    this.closeFilterPanel();
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.editingRow = null;
    this.sidePanelOpen = true;
    this.cdr.markForCheck();
  }

  openEditDrawer(data: ValidCatalogDto): void {
    this.closeFilterPanel();
    this.sidePanelMode = 'edit';
    this.sidePanelData = data;
    this.editingRow = data;
    this.sidePanelOpen = true;
    this.cdr.markForCheck();
  }

  closeSideDrawer(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.editingRow = null;
    this.cdr.markForCheck();
  }

  onSave(data: CreateValidCatalogDto | UpdateValidCatalogDto): void {
    if (this.sidePanelMode === 'add') {
      const catalogNumber = (data as CreateValidCatalogDto).catalogNumber;
      this.catalogService
        .createValidCatalog(data as CreateValidCatalogDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            // Check if API returned success: false in response body
            if (response && typeof response === 'object' && 'success' in response && response.success === false) {
              this.handleSaveError({ error: response as any });
              return;
            }
            this.showSnackbar(`Catalog ${catalogNumber} has been added.`);
            this.closeSideDrawer();
            this.loadData();
            this.loadDropdowns();
          },
          error: (error) => this.handleSaveError(error),
        });
    } else {
      const catalogNumber = this.sidePanelData!.catalogNumber;
      this.catalogService
        .updateValidCatalog(
          this.sidePanelData!.catalogNumber,
          data as UpdateValidCatalogDto,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            // Check if API returned success: false in response body
            if (response && typeof response === 'object' && 'success' in response && response.success === false) {
              this.handleSaveError({ error: response as any });
              return;
            }
            this.showSnackbar(`Catalog ${catalogNumber} has been updated.`);
            this.closeSideDrawer();
            this.loadData();
            this.loadDropdowns();
          },
          error: (error) => this.handleSaveError(error),
        });
    }
  }

  onSaveAndCreateAnother(data: CreateValidCatalogDto): void {
    this.catalogService
      .createValidCatalog(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Check if API returned success: false in response body
          if (response && typeof response === 'object' && 'success' in response && response.success === false) {
            this.handleSaveError({ error: response as any });
            return;
          }
          this.showSnackbar(`Catalog ${data.catalogNumber} has been added.`);
          this.loadData();
          this.loadDropdowns();
          this.sideDrawerComponent?.resetForm();
          this.sidePanelMode = 'add';
          this.sidePanelData = null;
          this.cdr.markForCheck();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  private showSnackbar(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  private handleSaveError(error: { status?: number; error?: { errorCode?: string; errorResponse?: { error?: string }; message?: string; error?: string } }): void {
    let errorMessage = 'An error occurred while saving. Please try again.';
    let errorCode = '';

    if (error.error?.errorCode) {
      errorCode = error.error.errorCode;
    }

    if (error.error?.errorResponse?.error) {
      errorMessage = error.error.errorResponse.error;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 404) {
      errorMessage = 'The catalog record was not found. It may have been deleted.';
    }

    errorMessage = errorMessage.replace(/^Error:\s*/i, '');
    const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : `Error: ${errorMessage}`;

    this.snackbarService.showError(displayMessage);

    if (this.sideDrawerComponent) {
      this.sideDrawerComponent.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c' && !this.sidePanelOpen) {
      event.preventDefault();
      this.openAddDrawer();
    }

    if (event.altKey && event.key.toLowerCase() === 'f' && !this.filterOverlayRef) {
      event.preventDefault();
      this.openFilterPanel();
    }

    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        this.closeSideDrawer();
      } else if (this.filterOverlayRef) {
        this.closeFilterPanel();
      }
    }
  }
}
