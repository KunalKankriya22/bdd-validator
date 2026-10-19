import { Component, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectorRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import {
  CryoMethodModel,
  CryoMethodFormValue,
  CryoMethodQueryParamsDto,
  CreateCryoMethodRequestDto,
  UpdateCryoMethodRequestDto
} from './models/cryo-methods.model';
import { CryoMethodsService } from './services/cryo-methods.service';
import { SnackbarService } from '@shared/services/snackbar.service';

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

import { AddEditCryoMethodComponent } from './add-edit-cryo-method/add-edit-cryo-method';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ROUTE_REGISTRY } from '../../../../../core/constants/route-registry';
import { RouteKey } from '../../../../../core/constants/route-keys';

@Component({
  selector: 'app-cryo-methods',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    AddEditCryoMethodComponent
  ],
  templateUrl: './cryo-methods.component.html',
  styleUrls: ['./cryo-methods.component.scss']
})
export class CryoMethodsComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild(AddEditCryoMethodComponent) sideDrawer!: AddEditCryoMethodComponent;
  @ViewChild(DataTable) dataTableComponent!: DataTable<CryoMethodModel>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly cryoMethodsService = inject(CryoMethodsService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);

  private destroy$ = new Subject<void>();

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

  tableConfig: DataTableConfig<CryoMethodModel> = {
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
      column: 'thawMethod',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  dataSource: CryoMethodModel[] = [];
  requestState: CryoMethodQueryParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: CryoMethodModel | null = null;

  constructor() {
    this.initializeConfigurations();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.CryoMethods].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

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
    this.loadData();
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
        this.closeSidePanel();
        this.loadData();
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW CRYO METHOD',
          icon: 'add',
          onClick: () => this.openAddDrawer(),
          color: 'primary',
          matButton: 'raised'
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by Thaw Method',
      minLength: 3,
      ariaLabel: 'Search cryo methods',
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
        column: 'thawMethod',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No CRYO methods available to display',
      loadingMessage: 'Loading CRYO methods...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<CryoMethodModel>[] {
    return [
      {
        key: 'thawMethod',
        header: 'Thaw Method',
        width: '120px',
        sortable: true
      },
      {
        key: 'methodDesc',
        header: 'Description',
        width: '160px'
      },
      {
        key: 'minTemp',
        header: 'Thaw Temp Minimum',
        width: '140px',
        valueFormatter: (value) => this.formatDecimal(value)
      },
      {
        key: 'maxTemp',
        header: 'Thaw Temp Maximum',
        width: '140px',
        valueFormatter: (value) => this.formatDecimal(value)
      },
      {
        key: 'minWsFreezeTime',
        header: 'Minimum Processing Time',
        width: '160px',
        valueFormatter: (value) => this.formatDecimal(value)
      },
      {
        key: 'maxWsFreezeTime',
        header: 'Maximum Processing Time',
        width: '160px',
        valueFormatter: (value) => this.formatDecimal(value)
      },
      {
        key: 'minSepFreezeTime',
        header: 'Minimum Separation to Freeze Time',
        width: '200px',
        valueFormatter: (value) => this.formatDecimal(value)
      },
      {
        key: 'maxSepFreezeTime',
        header: 'Maximum Separation to Freeze Time',
        width: '200px',
        valueFormatter: (value) => this.formatDecimal(value)
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
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<CryoMethodModel>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit cryo method',
        ariaLabel: 'Edit cryo method',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '–';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatDecimal(value: number | null | undefined): string {
    if (value == null) return '–';
    return value.toFixed(2);
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip = this.tableConfig.pagination!.pageIndex * this.tableConfig.pagination!.pageSize;
    const take = this.tableConfig.pagination!.pageSize;

    this.cryoMethodsService
      .getCryoMethods(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = [...response.data];
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.hasError = true;
          this.isLoading = false;

          this.snackbarService.showError(
            this.formatApiError(error.error?.errorResponse, error.error?.message || error.message || 'Failed to load cryo methods')
          );

          this.cdr.detectChanges();
        }
      });
  }

  onSearch(searchText: string): void {
    // Set search keyword in request state (undefined clears the search)
    this.requestState.thawMethod = searchText || undefined;

    // Reset to first page when searching
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Call API with new search parameters
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }

    // Call API with new pagination parameters
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    // Map UI column names to API field names
    const columnMap: { [key: string]: string } = {
      'thawMethod': 'ThawMethod'
    };

    // Handle sort direction
    if (event.direction === 'default') {
      // Clear sorting when returning to default
      this.requestState.sortColumn = undefined;
      this.requestState.sortOrder = undefined;
    } else {
      // Map column name and set sort order
      this.requestState.sortColumn = columnMap[event.column] || event.column;
      this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    // Update UI sort config
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Reset to first page when sorting
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Call API with new sort parameters
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<CryoMethodModel>): void {
    if (event.action === 'edit') {
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = event.row;
      }
      this.openEditDrawer(event.row);
    }
  }

  openAddDrawer(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    this.cdr.detectChanges();
  }

  openEditDrawer(row: CryoMethodModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = row;
    }
    this.cdr.detectChanges();
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    this.cdr.detectChanges();
  }

  onSidePanelSave(formValue: CryoMethodFormValue): void {
    if (this.sidePanelMode === 'add') {
      this.createCryoMethod(formValue);
    } else {
      this.updateCryoMethod(formValue);
    }
  }

  onSidePanelSaveAndCreateAnother(formValue: CryoMethodFormValue): void {
    this.createCryoMethod(formValue, true);
  }

  private createCryoMethod(formValue: CryoMethodFormValue, createAnother: boolean = false): void {
    const dto: CreateCryoMethodRequestDto = {
      thawMethod: formValue.thawMethod!,
      methodDesc: formValue.methodDesc!,
      minTemp: formValue.minTemp!,
      maxTemp: formValue.maxTemp!,
      minWsFreezeTime: formValue.minWsFreezeTime!,
      maxWsFreezeTime: formValue.maxWsFreezeTime!,
      minSepFreezeTime: formValue.minSepFreezeTime!,
      maxSepFreezeTime: formValue.maxSepFreezeTime!,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate!) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
    };

    this.cryoMethodsService.createCryoMethod(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.showSuccess(response.message || 'Cryo method created successfully');
            this.loadData();
            if (createAnother) {
              if (this.sideDrawer) {
                this.sideDrawer.form.reset();
                this.sideDrawer.isSubmitting = false;
              }
            } else {
              this.closeSidePanel();
            }
          } else {
            this.snackbarService.showError(
              this.formatApiError(response.errorResponse, response.message || 'Failed to create cryo method')
            );
            if (this.sideDrawer) {
              this.sideDrawer.isSubmitting = false;
            }
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            this.formatApiError(error.error?.errorResponse, error.error?.message || error.message || 'Failed to create cryo method')
          );
          if (this.sideDrawer) {
            this.sideDrawer.isSubmitting = false;
          }
        }
      });
  }

  private updateCryoMethod(formValue: CryoMethodFormValue): void {
    if (!this.sidePanelData) {
      return;
    }

    const dto: UpdateCryoMethodRequestDto = {
      methodDesc: formValue.methodDesc!,
      minTemp: formValue.minTemp!,
      maxTemp: formValue.maxTemp!,
      minWsFreezeTime: formValue.minWsFreezeTime!,
      maxWsFreezeTime: formValue.maxWsFreezeTime!,
      minSepFreezeTime: formValue.minSepFreezeTime!,
      maxSepFreezeTime: formValue.maxSepFreezeTime!,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate!) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate)
    };

    const thawMethod = this.sidePanelData.thawMethod;

    this.cryoMethodsService.updateCryoMethod(thawMethod, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.showSuccess(response.message || 'Cryo method updated successfully');
            this.closeSidePanel();
            this.loadData();
          } else {
            this.snackbarService.showError(
              this.formatApiError(response.errorResponse, response.message || 'Failed to update cryo method')
            );
            if (this.sideDrawer) {
              this.sideDrawer.isSubmitting = false;
            }
          }
        },
        error: (error) => {
          this.snackbarService.showError(
            this.formatApiError(error.error?.errorResponse, error.error?.message || error.message || 'Failed to update cryo method')
          );
          if (this.sideDrawer) {
            this.sideDrawer.isSubmitting = false;
          }
        }
      });
  }

  private formatApiError(
    errorResponse: { errorCode?: string; error?: string } | undefined,
    fallbackMessage: string
  ): string {
    if (errorResponse) {
      const code = errorResponse.errorCode?.trim();
      const msg = (errorResponse.error || '').replace(/^Error:\s*/i, '');
      return code ? `${code}: ${msg}` : msg;
    }
    return fallbackMessage;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        this.closeSidePanel();
      }
    }
  }
}
