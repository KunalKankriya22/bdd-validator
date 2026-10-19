import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { AttributeExpirationDateOverrideApiService } from './services/attribute-expiration-date-override-api.service';
import { LoggingService } from '@shared/services/logging.service';
import {
  AttributeExpirationDateOverrideModel,
  AttributeExpirationDateOverrideQueryParamsDto,
  AttributeExpirationDateOverrideFilterValue,
  AttributeExpirationDateOverrideFormValue,
  AttributeExpirationDateOverrideCreateDto,
  AttributeExpirationDateOverrideUpdateDto,
  LookUp,
  LookUpWithDescription
} from './models/attribute-expiration-date-override.model';

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
import { AttributeExpirationDateOverrideFilterChipsUtils } from './utils/filter-chips.utils';
import { AttributeExpirationDateOverrideFilterPanel } from './attribute-expiration-date-override-filter-panel/attribute-expiration-date-override-filter-panel';
import { AddEditAttributeExpirationDateOverrideComponent } from './add-edit-attribute-expiration-date-override/add-edit-attribute-expiration-date-override';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-attribute-expiration-date-override',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditAttributeExpirationDateOverrideComponent
  ],
  templateUrl: './attribute-expiration-date-override.component.html',
  styleUrls: ['./attribute-expiration-date-override.component.scss']
})
export class AttributeExpirationDateOverrideComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(DataTable) dataTableComponent!: DataTable<AttributeExpirationDateOverrideModel>;
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('sideDrawer') sideDrawerComponent?: AddEditAttributeExpirationDateOverrideComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Attribute Expiration Date Override', link: null }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 3,
    ariaLabel: ''
  };

  tableConfig: DataTableConfig<AttributeExpirationDateOverrideModel> = {
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
      column: 'attributeCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: AttributeExpirationDateOverrideFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: AttributeExpirationDateOverrideModel[] = [];
  requestState: AttributeExpirationDateOverrideQueryParamsDto = {};

  // Filter dropdown options (DISTINCT values from existing data)
  filterOverrideAttributes: LookUp[] = [];

  // Add/Edit dropdown options (all active master data)
  attributeCodeOptions: LookUpWithDescription[] = [];
  overrideAttributeOptions: LookUpWithDescription[] = [];

  isLoading = false;
  hasError = false;
  errorMessage = '';

  isFilterOpen = false;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AttributeExpirationDateOverrideModel | null = null;

  private destroy$ = new Subject<void>();
  private overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private service: AttributeExpirationDateOverrideApiService,
    private overlay: Overlay,
    private loggingService: LoggingService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    // Update page header config when menu data is loaded
    effect(() => {
      const pageHeaderData = this.pageHeaderService.pageHeaderData();
      if (pageHeaderData) {
        this.headerConfig = {
          ...this.headerConfig,
          title: pageHeaderData.title || 'Attribute Expiration Date Override: ISBT',
          subtitle: pageHeaderData.subtitle || 'Manage valid ISBT attribute mappings used for product configuration and processing.'
        };
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
        this.closeSideDrawer();
        this.closeOverlay();
        this.loadLookupOptions();
        this.loadData();
      });
  }

  private loadLookupOptions(): void {
    this.loadFilterDropdown();

    // Load add/edit dropdown values (for add/edit dialogs - all active master data)
    this.service.getAddDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.attributeCodeOptions = response.attributeCodes;
          this.overrideAttributeOptions = response.overrideAttributes;
        },
        error: (error) => {
          this.loggingService.error('Error loading add/edit dropdown options', error);
          this.snackBar.open('Failed to load form options', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        }
      });
  }

  private loadFilterDropdown(): void {
    const queryDto: AttributeExpirationDateOverrideQueryParamsDto = {
      searchKeyword: this.requestState.searchKeyword || undefined,
      effDate: this.requestState.effDate || undefined,
      effDatePeriod: this.requestState.effDatePeriod || undefined,
      termDate: this.requestState.termDate || undefined,
      termDatePeriod: this.requestState.termDatePeriod || undefined
    };

    this.service.getFilterDropdown(queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.filterOverrideAttributes = response.overrideAttributes;
        },
        error: (error) => {
          this.loggingService.error('Error loading filter dropdown options', error);
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
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Attribute Expiration Date Override', link: null }
      ],
      title: '',  // Will be set dynamically from API
      subtitle: '',  // Will be set dynamically from API
      actions: [
        {
          label: 'ADD NEW OVERRIDE ATTRIBUTE',
          icon: 'add',
          onClick: () => this.openAddDrawer(),
          color: 'primary',
          matButton: 'raised'
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by Attribute Description',
      minLength: 1,
      ariaLabel: 'Search by Attribute Description',
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
        column: 'attributeCode',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      enableRowHighlight: false,
      emptyMessage: 'No attribute expiration date overrides available to display',
      loadingMessage: 'Loading attribute expiration date overrides...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<AttributeExpirationDateOverrideModel>[] {
    return [
      {
        key: 'attributeCode',
        header: 'Attribute Code',
        sortable: true,
        width: '140px'
      },
      {
        key: 'attributeDescription',
        header: 'Description',
        width: '200px'
      },
      {
        key: 'overrideAttribute',
        header: 'Override Attribute',
        width: '160px'
      },
      {
        key: 'overrideDescription',
        header: 'Description',
        width: '200px'
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
      },
      {
        key: 'lastModifiedDate',
        header: 'Last Modified',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<AttributeExpirationDateOverrideModel>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit attribute override',
        ariaLabel: 'Edit attribute override',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | string | null | undefined): string {
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
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    // Build query DTO from request state
    const queryDto: AttributeExpirationDateOverrideQueryParamsDto = {
      overrideAttribute: this.requestState.overrideAttribute || undefined,
      searchKeyword: this.requestState.searchKeyword || undefined,
      effDate: this.requestState.effDate || undefined,
      effDatePeriod: this.requestState.effDatePeriod || undefined,
      termDate: this.requestState.termDate || undefined,
      termDatePeriod: this.requestState.termDatePeriod || undefined,
      sortColumn: this.requestState.sortColumn || undefined,
      sortOrder: this.requestState.sortOrder || undefined
    };

    this.service
      .getAttributeExpirationDateOverrides(take, skip, queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalCount;
          this.isLoading = false;
          this.loadFilterDropdown();
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading attribute expiration date overrides', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.closeSideDrawer();
    this.requestState.searchKeyword = searchText || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    this.closeSideDrawer();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.closeSideDrawer();
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.sortColumn = event.column;
    this.requestState.sortOrder =
      event.direction === 'default' ? undefined : (event.direction === 'A' ? 'ASC' : 'DESC');

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<AttributeExpirationDateOverrideModel>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    switch (event.action) {
      case 'edit':
        this.openEditDrawer(event.row);
        break;
    }
  }

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

    const portal = new ComponentPortal(AttributeExpirationDateOverrideFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.overrideAttributeOptions = this.filterOverrideAttributes;

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

  applyFilters(filters: AttributeExpirationDateOverrideFilterValue): void {
    this.closeSideDrawer();
    this.appliedFilters = filters;
    this.filterChips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      overrideAttribute: filters.overrideAttribute || undefined,
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
    this.closeSideDrawer();
    this.appliedFilters = AttributeExpirationDateOverrideFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = AttributeExpirationDateOverrideFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return AttributeExpirationDateOverrideFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.closeSideDrawer();
    this.appliedFilters = null;
    this.filterChips = [];

    const { overrideAttribute, searchKeyword, effDate, effDatePeriod, termDate, termDatePeriod, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      const { overrideAttribute, searchKeyword, effDate, effDatePeriod, termDate, termDatePeriod, ...rest } = this.requestState;
      this.requestState = rest;
      return;
    }

    this.requestState = {
      ...this.requestState,
      overrideAttribute: this.appliedFilters.overrideAttribute || undefined,
      searchKeyword: this.appliedFilters.searchKeyword || undefined,
      effDate: this.appliedFilters.effDate || undefined,
      effDatePeriod: this.appliedFilters.effDatePeriod || undefined,
      termDate: this.appliedFilters.termDate || undefined,
      termDatePeriod: this.appliedFilters.termDatePeriod || undefined
    };
  }

  openAddDrawer(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    this.cdr.detectChanges();
  }

  openEditDrawer(row: AttributeExpirationDateOverrideModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = row;
    this.sidePanelOpen = true;
    this.cdr.detectChanges();
  }

  closeSideDrawer(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.cdr.detectChanges();
  }

  onSave(formValue: AttributeExpirationDateOverrideFormValue): void {
    if (this.sidePanelMode === 'add') {
      const payload: AttributeExpirationDateOverrideCreateDto = {
        attributeCode: formValue.attributeCode!,
        overrideAttribute: formValue.overrideAttribute!,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) ?? undefined,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined
      };

      this.service.createAttributeExpirationDateOverride(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSnackbar(`Attribute Override ${payload.attributeCode} has been added.`);
            this.closeSideDrawer();
            this.loadData();
          },
          error: (error) => this.handleSaveError(error)
        });
    } else {
      const payload: AttributeExpirationDateOverrideUpdateDto = {
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) ?? undefined,
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined
      };

      this.service.updateAttributeExpirationDateOverride(
        this.sidePanelData!.attributeCode,
        this.sidePanelData!.overrideAttribute,
        payload
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSnackbar(`Attribute Override ${this.sidePanelData!.attributeCode} has been updated.`);
            this.closeSideDrawer();
            this.loadData();
          },
          error: (error) => this.handleSaveError(error)
        });
    }
  }

  onSaveAndCreateAnother(formValue: AttributeExpirationDateOverrideFormValue): void {
    const payload: AttributeExpirationDateOverrideCreateDto = {
      attributeCode: formValue.attributeCode!,
      overrideAttribute: formValue.overrideAttribute!,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) ?? undefined,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? undefined
    };

    this.service.createAttributeExpirationDateOverride(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar(`Attribute Override ${payload.attributeCode} has been added.`);
          this.loadData();
          this.sideDrawerComponent?.form.reset();
          this.sideDrawerComponent!.isSubmitting = false;
          this.sidePanelMode = 'add';
          this.sidePanelData = null;
          this.cdr.detectChanges();
        },
        error: (error) => this.handleSaveError(error)
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

  private handleSaveError(_error: unknown): void {
    if (this.sideDrawerComponent) {
      this.sideDrawerComponent.isSubmitting = false;
      this.sideDrawerComponent.cdr.markForCheck();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c' && !this.sidePanelOpen) {
      event.preventDefault();
      this.openAddDrawer();
    }

    if (event.altKey && event.key.toLowerCase() === 'f' && !this.overlayRef) {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        this.closeSideDrawer();
      } else if (this.overlayRef) {
        this.closeOverlay();
      }
    }
  }
}
