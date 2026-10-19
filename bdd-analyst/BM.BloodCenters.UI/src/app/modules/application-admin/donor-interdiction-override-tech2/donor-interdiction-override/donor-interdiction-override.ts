import { Component, OnDestroy, OnInit, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { PageHeaderWithBreadcrumb } from '../../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { SearchBar, SearchBarConfig } from '../../../../shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '../../../../shared/components/filter-chips/filter-chips';
import { DataTableConfig, TableColumn, TableSortEvent } from '../../../../shared/interfaces/data-table.interface';
import { PageHeaderConfig } from '../../../../shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DonorInterdictionOverrideService } from '../services/donor-interdiction-override.service';
import { LoginService } from '@shared/services/login.service';
import {
  DonorInterdictionOverrideModel,
  DonorInterdictionOverrideFilterValue,
  DonorInterdictionOverrideParamsDto
} from '../models/donor-interdiction-override.model';
import { DonorInterdictionOverrideFilterPanel } from '../donor-interdiction-override-filter-panel/donor-interdiction-override-filter-panel';
import { FilterChipsUtils } from '../utils/filter-chips.utils';
import { getInterTypeDisplay } from '../../donor-interdiction-override/models/donor-interdiction-override.model';
import moment from 'moment';

@Component({
  selector: 'app-donor-interdiction-override',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatTableModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    DonorInterdictionOverrideFilterPanel
  ],
  templateUrl: './donor-interdiction-override.html',
  styleUrls: ['./donor-interdiction-override.scss']
})
export class DonorInterdictionOverride implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction or Description',
    debounceTime: 600,
    minLength: 0,
    searchOnEnterOnly: true
  };

  isFilterPanelOpen = false;

  tableConfig: DataTableConfig<DonorInterdictionOverrideModel> = {
    columns: this.getTableColumns(),
    stickyHeader: true
  };

  appliedFilters: DonorInterdictionOverrideFilterValue | null = null;
  filterChips: FilterChip[] = [];
  dataSource: DonorInterdictionOverrideModel[] = [];
  selectedRows: Set<number> = new Set();
  displayedColumns: string[] = [];
  currentSortColumn: string = '';
  currentSortDirection: 'A' | 'D' | 'default' = 'default';
  requestState: DonorInterdictionOverrideParamsDto = {
    sortOrder: undefined
  };

  // Filter options
  uniqueCueOptions: Array<{ code: string; display: string }> = [];
  uniqueTypeOptions: Array<{ code: string; display: string }> = [];

  isLoading = false;
  isVerifying = false;
  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private donorInterdictionOverrideService: DonorInterdictionOverrideService,
    private loginService: LoginService,
    private overlay: Overlay,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            {
              label: 'Home',
              link: '/home'
            },
            {
              label: pageData.title,
              link: null
            }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.displayedColumns = ['select', ...this.tableConfig.columns.map(col => col.key)];
    this.loadInitialData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedRows.clear();
        this.loadInitialData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private getTableColumns(): TableColumn<DonorInterdictionOverrideModel>[] {
    return [
      {
        key: 'donorDecisionCode',
        header: 'Cue',
        sortable: true,
        width: '180px'
      },
      {
        key: 'productType',
        header: 'Inventory Product Type',
        sortable: false,
        width: '150px'
      },
      {
        key: 'prodTypeDesc',
        header: 'Inventory Product Type Description',
        sortable: false,
        width: '220px'
      },
      {
        key: 'attribGroup',
        header: 'Attribute Group',
        sortable: false,
        width: '140px'
      },
      {
        key: 'attribCode',
        header: 'Attribute Code',
        sortable: false,
        width: '130px'
      },
      {
        key: 'interCode',
        header: 'Donor Interdiction',
        sortable: false,
        width: '170px'
      },
      {
        key: 'interDescription',
        header: 'Donor Interdiction Description',
        sortable: false,
        width: '250px'
      },
      {
        key: 'interType',
        header: 'Type',
        sortable: false,
        width: '80px'
      },
      {
        key: 'overrideDesc',
        header: 'Override Description',
        sortable: false,
        width: '200px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '140px',
        type: 'date'
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '140px',
        type: 'date'
      }
    ];
  }

  private getApiFilters(): Partial<DonorInterdictionOverrideParamsDto> {
    if (!this.appliedFilters) return {};
    const { donorDecisionCodeDisplay, interTypeDisplay, ...apiFilters } = this.appliedFilters;
    return apiFilters;
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.dataSource = [];

    const params: DonorInterdictionOverrideParamsDto = {
      sortOrder: this.requestState.sortOrder,
      ...this.getApiFilters()
    };

    this.donorInterdictionOverrideService
      .getDonorInterdictionOverrides(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.isLoading = false;
          this.extractUniqueFilterValues(response.data);
        },
        error: () => {
          this.snackBar.open('Error loading data', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.uniqueCueOptions = [];
          this.uniqueTypeOptions = [];
          this.isLoading = false;
        }
      });
  }

  private extractUniqueFilterValues(data: DonorInterdictionOverrideModel[]): void {
    const cueMap = new Map<string, string>();
    data.forEach(item => {
      if (item.donorDecisionCode) {
        const displayValue = item.decisionDesc
          ? `${item.donorDecisionCode} - ${item.decisionDesc}`.trim()
          : item.donorDecisionCode;
        cueMap.set(item.donorDecisionCode, displayValue);
      }
    });
    this.uniqueCueOptions = Array.from(cueMap.entries())
      .map(([code, display]) => ({ code, display }))
      .sort((a, b) => a.display.localeCompare(b.display));

    const typeSet = new Set<string>();
    data.forEach(item => {
      if (item.interType) {
        typeSet.add(item.interType);
      }
    });
    this.uniqueTypeOptions = Array.from(typeSet)
      .map(code => ({ code, display: getInterTypeDisplay(code) }))
      .sort((a, b) => a.display.localeCompare(b.display));
  }

  loadTableData(): void {
    this.isLoading = true;
    this.dataSource = [];

    const params: DonorInterdictionOverrideParamsDto = {
      sortOrder: this.requestState.sortOrder,
      sortColumn: this.requestState.sortColumn,
      searchText: this.requestState.searchText,
      ...this.getApiFilters()
    };

    this.donorInterdictionOverrideService
      .getDonorInterdictionOverrides(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.isLoading = false;
        },
        error: () => {
          this.snackBar.open('Error loading data', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.isLoading = false;
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState = {
      searchText: searchText || undefined,
      sortOrder: this.requestState.sortOrder,
      sortColumn: this.requestState.sortColumn
    };
    this.loadTableData();
  }


  onSortClick(columnKey: string): void {
    if (this.currentSortColumn === columnKey) {
      // Cycle through A -> D -> default
      if (this.currentSortDirection === 'A') {
        this.currentSortDirection = 'D';
      } else if (this.currentSortDirection === 'D') {
        this.currentSortDirection = 'default';
        this.currentSortColumn = '';
      } else {
        this.currentSortDirection = 'A';
      }
    } else {
      this.currentSortColumn = columnKey;
      this.currentSortDirection = 'A';
    }

    if (this.currentSortDirection === 'default') {
      this.requestState = {
        ...this.requestState,
        sortOrder: undefined,
        sortColumn: undefined
      };
    } else {
      this.requestState = {
        ...this.requestState,
        sortOrder: this.currentSortDirection,
        sortColumn: columnKey
      };
    }

    this.loadTableData();
  }

  getSortDirection(columnKey: string): 'A' | 'D' | 'default' {
    if (this.currentSortColumn === columnKey) {
      return this.currentSortDirection;
    }
    return 'default';
  }

  getSortIcon(columnKey: string): string {
    if (this.currentSortColumn !== columnKey) {
      return 'unfold_more';
    }
    if (this.currentSortDirection === 'default') {
      return 'unfold_more';
    }
    return this.currentSortDirection === 'A' ? 'arrow_upward' : 'arrow_downward';
  }

  onSortChange(event: TableSortEvent): void {
    if (event.direction === 'default') {
      this.requestState = {
        ...this.requestState,
        sortOrder: undefined,
        sortColumn: undefined
      };
    } else {
      this.requestState = {
        ...this.requestState,
        sortOrder: event.direction,
        sortColumn: event.column
      };
    }
    this.loadTableData();
  }

  get canVerify(): boolean {
    return this.selectedRows.size > 0;
  }

  isRowSelected(row: DonorInterdictionOverrideModel): boolean {
    return this.selectedRows.has(row.audit_Key);
  }

  toggleRowSelection(row: DonorInterdictionOverrideModel): void {
    if (this.selectedRows.has(row.audit_Key)) {
      this.selectedRows.delete(row.audit_Key);
    } else {
      this.selectedRows.add(row.audit_Key);
    }
  }

  toggleAllRows(): void {
    if (this.allRowsSelected()) {
      this.dataSource.forEach(row => this.selectedRows.delete(row.audit_Key));
    } else {
      this.dataSource.forEach(row => this.selectedRows.add(row.audit_Key));
    }
  }

  allRowsSelected(): boolean {
    return this.dataSource.length > 0 && this.dataSource.every(row => this.selectedRows.has(row.audit_Key));
  }

  someRowsSelected(): boolean {
    const currentPageSelectedCount = this.dataSource.filter(row => this.selectedRows.has(row.audit_Key)).length;
    return currentPageSelectedCount > 0 && currentPageSelectedCount < this.dataSource.length;
  }

  onVerify(): void {
    if (!this.canVerify) return;

    const auditKeys = Array.from(this.selectedRows);
    const currentUserId = this.loginService.getStoredUsername();
    this.isVerifying = true;

    this.donorInterdictionOverrideService
      .verifyInterdictions({ auditKeys, userId: currentUserId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isVerifying = false;
          if (response.success) {
            this.snackBar.open(
              'Donor Interdiction Verified Successfully.',
              'DISMISS',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              }
            );
            this.selectedRows.clear();
            this.loadTableData();
          } else {
            const errorMessage = response.errors.join(', ');
            this.snackBar.open(
              errorMessage || 'Failed to verify interdiction.',
              'DISMISS',
              {
                duration: 8000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        },
        error: () => {
          this.isVerifying = false;
        }
      });
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterPanelOpen = false;
      return;
    }

    if (!this.filterBtn) {
      console.error('filterBtn is not defined');
      return;
    }

    this.isFilterPanelOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 8
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'filter-panel-overlay'
    });

    const portal = new ComponentPortal(DonorInterdictionOverrideFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.cueOptions = this.uniqueCueOptions;
    componentRef.instance.typeOptions = this.uniqueTypeOptions;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterPanelOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterPanelOpen = false;
        }
      });

    this.overlayRef.backdropClick().subscribe(() => {
      if (this.overlayRef) {
        this.overlayRef.dispose();
        this.overlayRef = null;
        this.isFilterPanelOpen = false;
      }
    });
  }

  applyFilters(filters: DonorInterdictionOverrideFilterValue): void {
    this.appliedFilters = FilterChipsUtils.hasActiveFilters(filters) ? filters : null;
    this.buildFilterChips();

    this.requestState = {
      sortOrder: this.requestState.sortOrder,
      sortColumn: this.requestState.sortColumn,
      searchText: this.requestState.searchText
    };

    this.loadTableData();
  }

  buildFilterChips(): void {
    if (!this.appliedFilters) {
      this.filterChips = [];
      return;
    }

    this.filterChips = FilterChipsUtils.convertFiltersToChips(
      this.appliedFilters,
      (date: string) => this.formatDate(date)
    );
  }

  removeFilter(key: string): void {
    if (!this.appliedFilters) return;

    this.appliedFilters = FilterChipsUtils.removeFilterByChipKey(this.appliedFilters, key);

    if (!FilterChipsUtils.hasActiveFilters(this.appliedFilters)) {
      this.appliedFilters = null;
    }

    this.buildFilterChips();
    this.loadTableData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.buildFilterChips();
    this.requestState = {
      sortOrder: this.requestState.sortOrder,
      sortColumn: this.requestState.sortColumn,
      searchText: this.requestState.searchText
    };
    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(chipKey: string): void {
    this.removeFilter(chipKey);
  }

  private formatDate(dateString: string): string {
    return moment(dateString).format('DD-MMM-YYYY').replace(/-([a-z]+)-/i, (_, m) => `-${m.toUpperCase()}-`);
  }

  getCellValueForTooltip(code: string, description: string): string {
    if (!code) return '';
    return description ? `${code} ${description}` : code;
  }

  showTooltipIfOverflowing(element: HTMLElement, tooltip: any): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }
}
