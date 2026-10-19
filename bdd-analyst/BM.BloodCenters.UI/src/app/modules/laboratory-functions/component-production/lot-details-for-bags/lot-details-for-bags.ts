import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectorRef,
  ElementRef,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { LotDetailsForBagsService } from './services/lot-details-for-bags.service';
import {
  ValidLotDto,
  ValidLotQueryParams,
  ValidLotFilterValue,
  CreateValidLotDto,
  UpdateValidLotDto,
  CatalogDropdownDto,
  MasterCodeDropdownDto,
} from './models/lot-details-for-bags.model';
import { LotFilterPanel } from './lot-filter-panel/lot-filter-panel';
import { AddEditLotComponent } from './add-edit-lot/add-edit-lot';
import { CmcDialogComponent } from './cmc-dialog/cmc-dialog';
import { LotFilterChipsUtils } from './utils/filter-chips.utils';
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
  selector: 'app-lot-details-for-bags',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    OverlayModule,
    SearchBar,
    DataTable,
    FilterChips,
    LotFilterPanel,
    AddEditLotComponent,
    MatSnackBarModule,
  ],
  templateUrl: './lot-details-for-bags.html',
  styleUrls: ['./lot-details-for-bags.scss'],
})
export class LotDetailsForBagsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly lotService = inject(LotDetailsForBagsService);
  private readonly overlay = inject(Overlay);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;
  @ViewChild('cmcCellTemplate', { static: false }) cmcCellTemplate!: TemplateRef<unknown>;
  @ViewChild('sideDrawer') sideDrawerComponent?: AddEditLotComponent;

  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by Lot Number, Catalog and Vendor Name',
    ariaLabel: 'Search by Lot Number, Catalog and Vendor Name',
    minLength: 2,
    searchOnEnterOnly: true,
  };

  dataTableConfig: DataTableConfig<ValidLotDto> = {
    columns: [
      { key: 'lotNumber', header: 'LOT Number', width: '120px' },
      { key: 'catalogNumber', header: 'Catalog', width: '110px' },
      { key: 'vendorName', header: 'Vendor Name', width: '130px' },
      { key: 'dateReceived', header: 'Received Date', width: '120px' },
      { key: 'numberOfUnits', header: 'Units', width: '70px' },
      { key: 'numberOfCartons', header: 'Cartons', width: '70px' },
      { key: 'spFlag', header: 'Component Manufacturing Control', width: '280px' },
      { key: 'volumeTypeSet', header: 'Type Set', width: '90px' },
      { key: 'supplyCode', header: 'Supply Code', width: '100px' },
      { key: 'effDate', header: 'Effective Date', width: '120px' },
      { key: 'termDate', header: 'Termination Date', width: '140px' },
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit',
        ariaLabel: 'Edit lot record',
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
      column: 'lotNumber',
      direction: 'default',
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showPagination: true,
    emptyMessage: 'No lot details available to display',
    loadingMessage: 'Loading lot details...',
  };

  dataSource: ValidLotDto[] = [];
  isLoading = false;
  searchKeyword = '';

  filterOverlayRef: OverlayRef | null = null;
  appliedFilters: ValidLotFilterValue | null = null;
  filterChips: FilterChip[] = [];

  catalogs: CatalogDropdownDto[] = [];
  cmcCodes: MasterCodeDropdownDto[] = [];
  volumeTypeSets: MasterCodeDropdownDto[] = [];
  supplyCodes: MasterCodeDropdownDto[] = [];

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ValidLotDto | null = null;
  editingRow: ValidLotDto | null = null;
  isLoadingDropdowns = false;

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
          this.dataTableConfig.sortConfig.column = 'lotNumber';
          this.dataTableConfig.sortConfig.direction = 'default';
        }
        this.loadData();
        this.loadDropdowns();
      });
  }

  ngAfterViewInit(): void {
    const cmcColumn = this.dataTableConfig.columns.find((c) => c.key === 'spFlag');
    if (cmcColumn && this.cmcCellTemplate) {
      cmcColumn.cellTemplate = this.cmcCellTemplate;
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private loadDropdowns(): void {
    this.lotService
      .getCatalogs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.catalogs = data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.catalogs = [];
        },
      });

    this.lotService
      .getCmcCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.cmcCodes = data;
        },
        error: () => {
          this.cmcCodes = [];
        },
      });

    this.lotService
      .getVolumeTypeSets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.volumeTypeSets = data;
        },
        error: () => {
          this.volumeTypeSets = [];
        },
      });

    this.lotService
      .getSupplyCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.supplyCodes = data;
        },
        error: () => {
          this.supplyCodes = [];
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
      lotNumber: 'LOT_NUMBER',
      catalogNumber: 'CATALOG_NUMBER',
      vendorName: 'VENDOR_NAME',
      dateReceived: 'DATE_RECEIVED',
      numberOfUnits: 'NUMBER_OF_UNITS',
      numberOfCartons: 'NUMBER_OF_CARTONS',
      volumeTypeSet: 'VOLUME_TYPE_SET',
      supplyCode: 'SUPPLY_CODE',
      effDate: 'EFF_DATE',
      termDate: 'TERM_DATE',
    };
    const sortColumn = this.dataTableConfig.sortConfig?.column
      ? sortColumnMap[this.dataTableConfig.sortConfig.column] || this.dataTableConfig.sortConfig.column
      : undefined;

    const params: ValidLotQueryParams = {
      searchKeyword: this.searchKeyword || undefined,
      sortColumn: sortDir && sortDir !== 'default' ? sortColumn : undefined,
      sortOrder: sortDir === 'A' ? 'ASC' : sortDir === 'D' ? 'DESC' : undefined,
    };

    if (this.appliedFilters) {
      if (this.appliedFilters.catalogNumber) {
        params.catalogNumber = this.appliedFilters.catalogNumber;
      }
      if (this.appliedFilters.showExpired !== undefined && this.appliedFilters.showExpired !== null) {
        params.showExpired = this.appliedFilters.showExpired;
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

    this.lotService
      .getValidLots(take, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = (response.items || []).map((item) => ({
            ...item,
            dateReceived: this.formatDateForDisplay(item.dateReceived),
            effDate: this.formatDateForDisplay(item.effDate),
            termDate: this.formatDateForDisplay(item.termDate),
          }));
          if (this.dataTableConfig.pagination) {
            this.dataTableConfig.pagination.totalRecords = response.totalRecords || 0;
          }
          this.dataTableConfig = { ...this.dataTableConfig };
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.dataSource = [];
          if (this.dataTableConfig.pagination) {
            this.dataTableConfig.pagination.totalRecords = 0;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
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

  onRowAction(event: TableRowActionEvent<ValidLotDto>): void {
    if (event.action === 'edit') {
      this.openEditDrawer(event.row);
    }
  }

  getSpFlagChips(spFlag: string | null): string[] {
    if (!spFlag) return [];
    return spFlag
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  openCmcDialog(row: ValidLotDto): void {
    const cmcCodes = this.getSpFlagChips(row.spFlag);
    const cmcCodesWithDescriptions = cmcCodes.map((code) => {
      const cmcCode = this.cmcCodes.find((c) => c.code === code);
      return {
        code: code,
        description: cmcCode?.description || '',
      };
    });

    this.dialog.open(CmcDialogComponent, {
      width: '500px',
      data: {
        title: 'View Component Manufacturing Control',
        cmcCodes: cmcCodesWithDescriptions,
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
      panelClass: 'filter-panel-overlay',
    });

    const filterPortal = new ComponentPortal(LotFilterPanel);
    const componentRef = this.filterOverlayRef.attach(filterPortal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.catalogs = this.catalogs;

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

  applyFilters(filters: ValidLotFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = LotFilterChipsUtils.convertFiltersToChips(filters);
    if (this.dataTableConfig.pagination) {
      this.dataTableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = LotFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = LotFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
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

  // Side panel
  openAddDrawer(): void {
    if (this.sidePanelOpen) {
      return;
    }
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.editingRow = null;
    this.sidePanelOpen = true;
    this.loadDropdownsForPanel();

    // Focus first interactive element in drawer after animation
    setTimeout(() => {
      const firstInput = document.querySelector('.side-panel input, .side-panel button') as HTMLElement;
      firstInput?.focus();
    }, 100);
  }

  openEditDrawer(data: ValidLotDto): void {
    if (this.sidePanelOpen) {
      return;
    }
    this.sidePanelMode = 'edit';
    this.sidePanelData = data;
    this.editingRow = data;
    this.sidePanelOpen = true;
    this.loadDropdownsForPanel();

    // Focus first interactive element in drawer after animation
    setTimeout(() => {
      const firstInput = document.querySelector('.side-panel input, .side-panel button') as HTMLElement;
      firstInput?.focus();
    }, 100);
  }

  private loadDropdownsForPanel(): void {
    this.isLoadingDropdowns = true;
    this.cdr.detectChanges();

    forkJoin({
      catalogs: this.lotService.getCatalogs(),
      cmcCodes: this.lotService.getCmcCodes(),
      volumeTypeSets: this.lotService.getVolumeTypeSets(),
      supplyCodes: this.lotService.getSupplyCodes(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.catalogs = data.catalogs;
          this.cmcCodes = data.cmcCodes;
          this.volumeTypeSets = data.volumeTypeSets;
          this.supplyCodes = data.supplyCodes;
          this.isLoadingDropdowns = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.catalogs = [];
          this.cmcCodes = [];
          this.volumeTypeSets = [];
          this.supplyCodes = [];
          this.isLoadingDropdowns = false;
          this.cdr.detectChanges();
        },
      });
  }

  closeSideDrawer(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.editingRow = null;
    this.isLoadingDropdowns = false;

    // Return focus to the button that opened the drawer
    setTimeout(() => {
      const addButton = document.querySelector('.add-btn') as HTMLElement;
      addButton?.focus();
    }, 100);

    this.cdr.detectChanges();
  }

  onSave(data: CreateValidLotDto | UpdateValidLotDto): void {
    if (this.sidePanelMode === 'add') {
      const lotNumber = (data as CreateValidLotDto).lotNumber;
      this.lotService
        .createValidLot(data as CreateValidLotDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            // Check if API returned success: false in response body
            if (response && typeof response === 'object' && 'success' in response && response.success === false) {
              this.handleSaveError({ error: response as any });
              return;
            }
            this.showSnackbar(`Lot ${lotNumber} has been added.`);
            this.closeSideDrawer();
            this.loadData();
          },
          error: (error) => this.handleSaveError(error),
        });
    } else {
      const lotNumber = this.sidePanelData!.lotNumber;
      this.lotService
        .updateValidLot(
          this.sidePanelData!.lotNumber,
          this.sidePanelData!.catalogNumber,
          data as UpdateValidLotDto,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            // Check if API returned success: false in response body
            if (response && typeof response === 'object' && 'success' in response && response.success === false) {
              this.handleSaveError({ error: response as any });
              return;
            }
            this.showSnackbar(`Lot ${lotNumber} has been updated.`);
            this.closeSideDrawer();
            this.loadData();
          },
          error: (error) => this.handleSaveError(error),
        });
    }
  }

  onSaveAndCreateAnother(data: CreateValidLotDto): void {
    this.lotService
      .createValidLot(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Check if API returned success: false in response body
          if (response && typeof response === 'object' && 'success' in response && response.success === false) {
            this.handleSaveError({ error: response as any });
            return;
          }
          this.showSnackbar(`Lot ${data.lotNumber} has been added.`);
          this.loadData();
          this.sideDrawerComponent?.resetForm();
          this.sidePanelMode = 'add';
          this.sidePanelData = null;
          this.cdr.detectChanges();
        },
        error: (error) => this.handleSaveError(error),
      });
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
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
      errorMessage = 'The lot record was not found. It may have been deleted.';
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
