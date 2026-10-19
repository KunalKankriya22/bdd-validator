import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Injector,
  effect,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import {
  AttributeServiceCodeModel,
  AttributeServiceCodeQueryDto,
  AttributeGroupDropdownDto
} from './models/attribute-service-code.model';

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

import { EditAttributeServiceCodeComponent } from './edit-attribute-service-code/edit-attribute-service-code';
import {
  AttributeServiceCodeFilterDialog,
  AttributeServiceCodeFilterValue
} from './filter-dialog/attribute-service-code-filter-dialog';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AttributeServiceCodeFilterChipsUtils } from './utils/filter-chips.utils';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '../../../../core/constants/route-registry';
import { RouteKey } from '../../../../core/constants/route-keys';
import { AttributeServiceCodeApiService } from './services/attribute-service-code-api.service';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

@Component({
  selector: 'app-ltrcnfws',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    EditAttributeServiceCodeComponent,
    FilterChips
  ],
  templateUrl: './ltrcnfws.component.html',
  styleUrls: ['./ltrcnfws.component.scss']
})
export class LtrcnfwsComponent implements OnInit, OnDestroy {
  @ViewChild(EditAttributeServiceCodeComponent) sideDrawer!: EditAttributeServiceCodeComponent;
  @ViewChild(DataTable) dataTableComponent!: DataTable<AttributeServiceCodeModel>;
  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly apiService = inject(AttributeServiceCodeApiService);
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private readonly dialog = inject(MatDialog);

  private overlayRef: OverlayRef | null = null;
  isFilterOpen = false;

  private static nextId = 0;
  protected readonly componentId = `ltrcnfws-${LtrcnfwsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  // Form controls
  attributeGroupControl = new FormControl<string>('');
  attributeGroupSearchControl = new FormControl<string>('');
  searchText = '';

  // Search bar configuration
  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by attribute code or attribute description',
    minLength: 1,
    ariaLabel: 'Search by attribute code or attribute description',
    searchOnEnterOnly: true
  };

  // Dropdown options
  attributeGroupOptions: AttributeGroupDropdownDto[] = [];
  filteredAttributeGroups: AttributeGroupDropdownDto[] = [];

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: 'Enter Attribute Service Codes',
    subtitle: 'View and update Attribute service codes.',
    actions: []
  };

  // Data table configuration
  tableConfig: DataTableConfig<AttributeServiceCodeModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'attribCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No attribute service codes found.',
    loadingMessage: 'Loading attribute service codes...',
    showPagination: true
  };

  dataSource: AttributeServiceCodeModel[] = [];
  requestState: AttributeServiceCodeQueryDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  sidePanelOpen = false;
  sidePanelData: AttributeServiceCodeModel | null = null;
  currentFilters: AttributeServiceCodeFilterValue | null = null;
  filterChips: FilterChip[] = [];

  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeConfigurations();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.EnterAttributeServiceCodes]?.path || '/product-management-functions/customer-&-internal-administration/internal-administration/ltrcnfws';
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label || 'Enter Attribute Service Codes',
            subtitle: menuItem.remarks || menuItem.subtitle || 'View and update Attribute service codes.'
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadAttributeGroups();
    this.setupAttributeGroupSearchListener();
  }

  ngOnDestroy(): void {
    this.disposeOverlay();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.tableConfig.columns = this.getTableColumns();
    this.tableConfig.rowActions = this.getRowActions();
  }

  private getTableColumns(): TableColumn<AttributeServiceCodeModel>[] {
    return [
      {
        key: 'attribCode',
        header: 'Code',
        sortable: false,
        width: '100px'
      },
      {
        key: 'attribDesc',
        header: 'Description',
        sortable: false,
        width: '250px'
      },
      {
        key: 'attribCustom',
        header: 'Special Order',
        sortable: false,
        width: '120px',
        valueFormatter: (value: any) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'normalStockFlag',
        header: 'Normal Stock Status',
        sortable: false,
        width: '150px',
        valueFormatter: (value: any) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'price',
        header: 'Price',
        sortable: false,
        width: '120px',
        valueFormatter: (value: any) =>
          value !== null && value !== undefined ? Number(value).toFixed(2) : ''
      },
      {
        key: 'serviceCode',
        header: 'Service Code',
        sortable: false,
        width: '130px',
        valueFormatter: (value: any) => value || ''
      },
      {
        key: 'creditFlag',
        header: 'Credit Allowed',
        sortable: false,
        width: '130px',
        valueFormatter: (value: any) => value === 'Y' ? 'Yes' : 'No'
      }
    ];
  }

  private getRowActions(): RowAction<AttributeServiceCodeModel>[] {
    return [
      {
        label: 'Edit',
        icon: 'edit',
        ariaLabel: 'Edit attribute service code',
        action: 'edit'
      },
      {
        label: 'Delete',
        icon: 'delete',
        ariaLabel: 'Delete attribute service code',
        action: 'delete'
      }
    ];
  }

  private loadAttributeGroups(): void {
    this.apiService
      .getAttributeGroupsDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroupOptions = groups;
          this.filteredAttributeGroups = groups;
        },
        error: () => {
          this.showError('Failed to load attribute groups');
        }
      });
  }

  private setupAttributeGroupSearchListener(): void {
    this.attributeGroupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterAttributeGroups(searchTerm || '');
      });
  }

  private filterAttributeGroups(searchTerm: string): void {
    const search = searchTerm.toLowerCase();
    this.filteredAttributeGroups = this.attributeGroupOptions.filter(
      (group) =>
        group.code.toLowerCase().includes(search) ||
        group.description.toLowerCase().includes(search)
    );
  }

  onAttributeGroupChange(): void {
    this.requestState.attributeGroup = this.attributeGroupControl.value || null;
    this.searchText = '';
    this.requestState.searchKeyword = null;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || null;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  loadData(): void {
    const pagination = this.tableConfig.pagination!;
    const take = pagination.pageSize;
    const skip = pagination.pageIndex * pagination.pageSize;

    const queryParams: AttributeServiceCodeQueryDto = {
      attributeGroup: this.requestState.attributeGroup,
      searchKeyword: this.requestState.searchKeyword,
      sortColumn: this.requestState.sortColumn,
      sortOrder: this.requestState.sortOrder,
      filterPrice: this.requestState.filterPrice,
      filterServiceCode: this.requestState.filterServiceCode
    };

    this.isLoading = true;
    this.hasError = false;

    this.apiService
      .getAttributeServiceCodes(take, skip, queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.totalCount
            }
          };
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = error?.error?.message || 'Failed to load data';
          this.showError(this.errorMessage);
        }
      });
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.requestState.sortColumn = event.column;
    this.requestState.sortOrder = event.direction.toUpperCase();
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<AttributeServiceCodeModel>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  confirmDelete(row: AttributeServiceCodeModel): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        title: 'Warning',
        message: `Are you sure you want to delete attribute code "${row.attribCode}" from group "${row.attribGroup}"?`,
        detail: 'This action cannot be undone.',
        confirmText: 'YES',
        cancelText: 'NO',
      } as ConfirmActionDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed === true) {
          this.performDelete(row);
        }
      });
  }

  private performDelete(row: AttributeServiceCodeModel): void {
    this.isLoading = true;
    this.apiService
      .deleteAttributeServiceCode(row.attribGroup, row.attribCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open(
            `Attribute code ${row.attribCode} has been deleted.`,
            'DISMISS',
            { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] }
          );
          this.loadData();
        },
        error: (error) => {
          this.isLoading = false;
          const message = error?.error?.message || 'Failed to delete attribute service code';
          this.showError(message);
        }
      });
  }

  openEditPanel(row: AttributeServiceCodeModel): void {
    this.sidePanelData = row;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaved(): void {
    this.loadData();
  }

  openFilterDialog(): void {
    const attributeGroup = this.attributeGroupControl.value;
    if (!attributeGroup) return;

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    forkJoin({
      prices: this.apiService.getFilterPrices(attributeGroup),
      serviceCodes: this.apiService.getFilterServiceCodes(attributeGroup)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ prices, serviceCodes }) => {
          this.createFilterOverlay(prices, serviceCodes);
        },
        error: () => {
          this.showError('Failed to load filter options');
        }
      });
  }

  private createFilterOverlay(prices: string[], serviceCodes: string[]): void {
    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterButtonRef)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 4
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'filter-overlay-panel',
      width: '336px'
    });

    const portal = new ComponentPortal(AttributeServiceCodeFilterDialog, null, this.injector);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.currentFilters;
    componentRef.instance.attributeGroups = this.attributeGroupOptions;
    componentRef.instance.priceOptions = prices;
    componentRef.instance.serviceCodeOptions = serviceCodes;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: AttributeServiceCodeFilterValue) => {
        this.applyFilters(result);
        this.disposeOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.disposeOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.disposeOverlay();
      });
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
  }

  applyFilters(filters: AttributeServiceCodeFilterValue): void {
    this.currentFilters = filters;

    if (filters.attributeGroup) {
      this.attributeGroupControl.setValue(filters.attributeGroup, { emitEvent: false });
      this.requestState.attributeGroup = filters.attributeGroup;
    }

    this.requestState.filterPrice = filters.price || null;
    this.requestState.filterServiceCode = filters.serviceCode || null;

    this.filterChips = AttributeServiceCodeFilterChipsUtils.toFilterChips(filters);

    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    if (!this.currentFilters) return;

    const updatedFilters = AttributeServiceCodeFilterChipsUtils.removeFilter(
      this.currentFilters,
      chipKey
    );
    this.applyFilters(updatedFilters);
  }

  clearAllFilters(): void {
    const clearedFilters = AttributeServiceCodeFilterChipsUtils.clearAll();
    this.applyFilters(clearedFilters);
  }

  hasActiveFilters(): boolean {
    return AttributeServiceCodeFilterChipsUtils.hasActiveFilters(this.currentFilters);
  }

  clearFilters(): void {
    this.attributeGroupControl.setValue('');
    this.searchText = '';
    this.requestState = {};
    this.currentFilters = null;
    this.filterChips = [];
    this.dataSource = [];
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: 0,
        pageIndex: 0
      }
    };
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
