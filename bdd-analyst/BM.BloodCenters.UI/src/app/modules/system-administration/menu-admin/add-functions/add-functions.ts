import { Component, OnInit, inject, signal, ViewChild, ElementRef, OnDestroy, effect, TemplateRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { UI, UI_META } from '../../../../core/constants/ui.constants';
import { AddFunctionsService, AddFunction } from './services/add-functions.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { AddEditAddFunctions } from '../add-edit-add-functions/add-edit-add-functions';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AddFunctionsFilterPanel } from './add-functions-filter-panel/add-functions-filter-panel';
import { AddFunctionsFilterChipsUtils, AddFunctionsFilterValue } from './utils/add-functions-filter-chips.utils';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-add-functions',
  standalone: true,
  imports: [
    AddEditAddFunctions,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule,
    FilterChips,
    SearchBar,
    DataTable
  ],
  templateUrl: './add-functions.html',
  styleUrl: './add-functions.scss',
})
export class AddFunctionsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('iconCellTemplate', { static: false }) iconCellTemplate!: TemplateRef<any>;
  @ViewChild('parameterCellTemplate', { static: false }) parameterCellTemplate!: TemplateRef<any>;
  @ViewChild('functionTypeCellTemplate', { static: false }) functionTypeCellTemplate!: TemplateRef<any>;

  tableConfig: DataTableConfig<AddFunction> = {
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
      column: '',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    noDataIcon: 'edit',
    emptyMessage: 'No functions to view',
    emptySubMessage: 'Use the filter or search options to find functions, or check back later.',
    loadingMessage: 'Loading functions...',
    showPagination: true,
    enableRowHighlight: true
  };

  dataSource: AddFunction[] = [];
  searchTerm = '';
  isLoading = false;
  hasError = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  isFilterOpen = false;
  private previouslyFocusedElement: HTMLElement | null = null;

  appliedFilters: AddFunctionsFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Dialog State
  isDialogOpen = false;

  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private addFunctionsService = inject(AddFunctionsService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private overlay = inject(Overlay);
  private cdr = inject(ChangeDetectorRef);


  // Constants for template
  readonly UI = UI;
  readonly UI_META = UI_META;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Add Function', link: null }
    ],
    actions: [
      {
        label: 'ADD FUNCTION',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new function',
        onClick: () => this.onAddNew()
      }
    ]
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by executable name, scope, or remarks',
    minLength: 3,
    ariaLabel: 'Search functions by executable name, scope, or remarks',
    searchOnEnterOnly: true,
    debounceTime: 300
  };

  constructor() {
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

  private initializeConfigurations(): void {
    this.tableConfig = {
      columns: [], // Will be populated in ngAfterViewInit when templates are available
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: '',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      noDataIcon: 'edit',
      emptyMessage: 'No Functions Found',
      emptySubMessage: 'Try adjusting your search or filter criteria.',
      loadingMessage: 'Loading functions...',
      showPagination: true,
      enableRowHighlight: true
    };
  }

  private getTableColumns(): TableColumn<AddFunction>[] {
    return [
      {
        key: 'fcnIcon',
        header: 'Web Icon',
        width: '100px',
        cellTemplate: this.iconCellTemplate
      },
      {
        key: 'fcnUrl',
        header: 'Web URL',
        valueFormatter: (value) => value?.trim() || ''
      },
      {
        key: 'execName',
        header: 'Executable Name'
      },
      {
        key: 'fcnType',
        header: 'Function Type',
        width: '120px',
        cellTemplate: this.functionTypeCellTemplate
      },
      {
        key: 'fcnScope',
        header: 'Scope',
        valueFormatter: (value) => value?.trim() || ''
      },
      {
        key: 'p1Name',
        header: 'Parameter 1',
        width: '140px',
        cellTemplate: this.parameterCellTemplate
      },
      {
        key: 'p2Name',
        header: 'Parameter 2',
        width: '140px',
        cellTemplate: this.parameterCellTemplate
      },
      {
        key: 'p3Name',
        header: 'Parameter 3',
        width: '140px',
        cellTemplate: this.parameterCellTemplate
      },
      {
        key: 'remarks',
        header: 'Remarks',
        valueFormatter: (value) => value?.trim() || ''
      }
    ];
  }

  private getRowActions(): RowAction<AddFunction>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: '',
        ariaLabel: '',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  ngOnInit(): void {
    this.loadFunctions();
  }

  ngAfterViewInit(): void {
    // Update table columns with templates after view init
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.getTableColumns()
    };
    // Trigger change detection to apply the new columns with templates
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }


  loadFunctions(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    // Build filter object from current state
    const filter: any = {};

    if (this.searchTerm) {
      filter.searchKeyword = this.searchTerm;
    }
    if (this.appliedFilters?.functionType) {
      filter.functionType = this.appliedFilters.functionType;
    }
    if (this.appliedFilters?.scope) {
      filter.scope = this.appliedFilters.scope;
    }

    // Add sort parameters if sorting is active
    if (this.tableConfig.sortConfig?.direction !== 'default') {
      const sortColumnMapping: Record<string, string> = {
        'execName': 'ExecutableName'
      };
      filter.sortColumn = sortColumnMapping[this.tableConfig.sortConfig?.column || ''] || this.tableConfig.sortConfig?.column;
      filter.sortDirection = this.tableConfig.sortConfig?.direction || 'D';
    }

    // Call API service
    this.addFunctionsService.getAddFunctions(skip, take, filter).subscribe({
      next: (response) => {
        if (response.success) {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.total;
          console.log(response.data);
        } else {
          console.error('Failed to fetch add functions:', response.message);
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching add functions:', error);
        this.hasError = true;
        this.isLoading = false;
        this.errorMessage = 'Failed to load functions. Please try again later.';
      }
    });
  }

  onSearch(): void {
    // SearchBar component already handles trimming and min length validation
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadFunctions();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadFunctions();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;
    this.loadFunctions();
  }

  onRowAction(event: TableRowActionEvent<AddFunction>): void {
    switch (event.action) {
      case 'edit':
        this.onEdit(event.row);
        break;
    }
  }

  onAddNew(): void {
    this.isDialogOpen = true; // Track dialog state

    const dialogRef = this.dialog.open(AddEditAddFunctions, {
      width: '660px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      autoFocus: false,
      position: { right: '0', top: '0' },
      panelClass: 'add-functions-drawer',
      hasBackdrop: false, // Disable backdrop since we're using layout
      data: {
        mode: 'add'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isDialogOpen = false; // Reset dialog state
      if (result) {
        console.log('Added:', result);
        this.loadFunctions(); // refresh table
      }
    });
  }

  onEdit(row: AddFunction): void {
    this.isDialogOpen = true; // Track dialog state

    const dialogRef = this.dialog.open(AddEditAddFunctions, {
      width: '660px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
      autoFocus: false,
      position: { right: '0', top: '0' },
      panelClass: 'add-functions-drawer',
      hasBackdrop: false, // Disable backdrop since we're using layout
      data: {
        mode: 'edit',
        data: row
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isDialogOpen = false; // Reset dialog state
      if (result) {
        console.log('Updated:', result);
        this.loadFunctions();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/']);
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }

    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlay.position()
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

    this.isFilterOpen = true;

    const portal = new ComponentPortal(AddFunctionsFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    // Blur the filter button to remove focus/highlight instead of restoring focus
    if (this.previouslyFocusedElement) {
      (this.previouslyFocusedElement as HTMLElement).blur();
    }
    this.previouslyFocusedElement = null;
  }

  applyFilters(filters: AddFunctionsFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = AddFunctionsFilterChipsUtils.convertFiltersToChips(filters);

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadFunctions();
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadFunctions();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = AddFunctionsFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = AddFunctionsFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadFunctions();
  }

  hasActiveFilters(): boolean {
    return AddFunctionsFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }
}
