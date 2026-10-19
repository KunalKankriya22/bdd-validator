import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  effect
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { ValidAttributesMatrixService } from './services/valid-attributes-matrix.service';
import {
  ValidAttributesMatrix,
  ValidAttributesMatrixParamsDto,
  ValidAttributesMatrixFilterValue,
  AttributeCodeDropdown,
  ModifierCodeDropdown
} from './models/valid-attributes-matrix.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableRowActionEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidAttributesMatrixFilterChipsUtils } from './utils/filter-chips.utils';
import { ValidAttributesMatrixFilterPanel } from './valid-attributes-matrix-filter-panel/valid-attributes-matrix-filter-panel';
import { AddEditValidAttributesMatrixComponent } from './add-edit-valid-attributes-matrix/add-edit-valid-attributes-matrix.component';

@Component({
  selector: 'app-valid-attributes-matrix',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    AddEditValidAttributesMatrixComponent
  ],
  templateUrl: './valid-attributes-matrix.component.html',
  styleUrls: ['./valid-attributes-matrix.component.scss']
})
export class ValidAttributesMatrixComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  readonly VALIDATION = {
    LIMITS: {
      SEARCH_MIN_LENGTH: 2,
      DEFAULT_PAGE_SIZE: 25,
      DESCRIPTION_TRUNCATE_LENGTH: 50
    }
  };

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

  tableConfig: DataTableConfig<ValidAttributesMatrix> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  dataSource: ValidAttributesMatrix[] = [];
  requestState: ValidAttributesMatrixParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ValidAttributesMatrix | null = null;

  // Filter State
  isFilterOpen = false;
  appliedFilters: ValidAttributesMatrixFilterValue | null = null;
  filterChips: FilterChip[] = [];
  attributeCodeOptions: AttributeCodeDropdown[] = [];
  deletedAttributeCodeOptions: AttributeCodeDropdown[] = [];
  associatedAttributeCodeOptions: AttributeCodeDropdown[] = [];
  modifierCodeOptions: ModifierCodeDropdown[] = [];

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private validAttributesMatrixService: ValidAttributesMatrixService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private overlay: Overlay
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'Manage valid attributes matrix entries for ISBT components.',
          actions: [{
            label: 'ADD NEW ATTRIBUTE MATRIX',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Add new attribute matrix entry',
            onClick: () => this.createRecord()
          }]
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadTableData();
    this.loadFilterDropdownOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayRef?.dispose();
  }

  private initializeConfigurations(): void {
    this.searchConfig = {
      placeholder: 'Search by Attribute Code',
      minLength: this.VALIDATION.LIMITS.SEARCH_MIN_LENGTH,
      ariaLabel: 'Search valid attributes matrix by attribute group or attribute code',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: this.VALIDATION.LIMITS.DEFAULT_PAGE_SIZE,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Valid Attributes Matrix entries available to display',
      loadingMessage: 'Loading valid attributes matrix data...',
      showPagination: true,
      sortConfig: {
        column: '',
        direction: 'D'
      },
      noDataIcon: 'search',
    };
  }

  private getTableColumns(): TableColumn<ValidAttributesMatrix>[] {
    return [
      {
        key: 'attribAddedGroup',
        header: 'Attribute Group',
        width: '120px'
      },
      {
        key: 'attribAddedGroupDesc',
        header: 'Description',
        width: '160px',
        truncate: true,
        truncateLength: this.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
      },
      {
        key: 'attribAddedCode',
        header: 'Attribute Code',
        width: '120px',
        sortable: true
      },
      {
        key: 'attribAddedCodeDesc',
        header: 'Description',
        width: '160px',
        truncate: true,
        truncateLength: this.VALIDATION.LIMITS.DESCRIPTION_TRUNCATE_LENGTH
      },
      {
        key: 'deleteModifierCode',
        header: 'Deleted Modifier',
        width: '120px'
      },
      {
        key: 'attribDeletedCode',
        header: 'Deleted Attribute Code',
        width: '150px'
      },
      {
        key: 'addModifierCode',
        header: 'Added Modifier',
        width: '120px'
      },
      {
        key: 'associatedAttribCode',
        header: 'Added Attribute Code',
        width: '150px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'lastModifiedDate',
        header: 'Last Modified',
        width: '130px',
        valueFormatter: (value) => this.formatDate(value)
      }
    ];
  }

  private getRowActions(): RowAction<ValidAttributesMatrix>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit attribute matrix entry',
        ariaLabel: 'Edit attribute matrix entry',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  private formatDate(date: Date | string | null): string {
    if (!date) return '-';
    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const parts = String(date).split('T')[0].split('-');
    if (parts.length < 3) return '-';
    const [year, month, day] = parts;
    const monthName = MONTHS[parseInt(month, 10) - 1];
    return monthName ? `${day}-${monthName}-${year}` : '-';
  }

  loadTableData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);
    const take = this.tableConfig.pagination?.pageSize || 10;

    this.validAttributesMatrixService
      .getValidAttributesMatrix(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.dataSource = response.data || [];
          this.tableConfig.pagination!.totalRecords = response.total || 0;
          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'No Valid Attributes Matrix entries available to display';
        }
      });
  }

  onSearch(searchText: string): void {
    this.closeSidePanel();
    this.searchText = searchText || '';
    this.requestState.searchKeyword = searchText || undefined;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadTableData();
    this.loadFilterDropdownOptions();
  }

  onPageChange(event: TablePageEvent): void {
    this.closeSidePanel();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadTableData();
  }

  onSortChange(event: TableSortEvent): void {
    this.closeSidePanel();
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    const columnMap: { [key: string]: string } = {
      'attribAddedCode': 'AttribAddedCode'
    };

    if (event.direction === 'default') {
      this.requestState.sortColumn = undefined;
      this.requestState.sortOrder = undefined;
    } else {
      this.requestState.sortColumn = columnMap[event.column] || event.column;
      this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadTableData();
  }

  /* -------------------------------- FILTERS -------------------------------- */

  private loadFilterDropdownOptions(): void {
    const searchParam = this.searchText || undefined;

    this.validAttributesMatrixService
      .getAttributeCodes(undefined, searchParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => this.attributeCodeOptions = options);

    this.validAttributesMatrixService
      .getDeletedAttributeCodes(undefined, searchParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => this.deletedAttributeCodeOptions = options);

    this.validAttributesMatrixService
      .getAssociatedAttributeCodes(undefined, searchParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => this.associatedAttributeCodeOptions = options);

    this.validAttributesMatrixService
      .getModifierCodes(searchParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => this.modifierCodeOptions = options);
  }

  openFilter(): void {
    if (this.isFilterOpen) return;
    if (!this.filterBtn) return;

    const filterBtnElement = this.filterBtn.nativeElement;
    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(filterBtnElement)
      .withPositions([{
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 4
      }]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const filterPortal = new ComponentPortal(ValidAttributesMatrixFilterPanel);
    const filterComponentRef = this.overlayRef.attach(filterPortal);

    filterComponentRef.instance.currentFilters = this.appliedFilters;
    filterComponentRef.instance.attributeCodeOptions = this.attributeCodeOptions;
    filterComponentRef.instance.deletedAttributeCodeOptions = this.deletedAttributeCodeOptions;
    filterComponentRef.instance.associatedAttributeCodeOptions = this.associatedAttributeCodeOptions;
    filterComponentRef.instance.modifierCodeOptions = this.modifierCodeOptions;

    filterComponentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters: ValidAttributesMatrixFilterValue) => {
      this.applyFilters(filters);
      this.closeFilterPanel();
    });

    filterComponentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    this.overlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    this.isFilterOpen = true;
  }

  private closeFilterPanel(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isFilterOpen = false;
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.blur();
    }
  }

  applyFilters(filters: ValidAttributesMatrixFilterValue): void {
    this.closeSidePanel();
    this.appliedFilters = filters;
    this.filterChips = ValidAttributesMatrixFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      associatedAttribCode: filters.associatedAttribCode,
      modifierCode: filters.deleteModifierCode,
      attribDeletedCode: filters.attribDeletedCode
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadTableData();
  }

  clearAllFilters(): void {
    this.closeSidePanel();
    this.appliedFilters = null;
    this.filterChips = [];

    const { associatedAttribCode, modifierCode, attribDeletedCode, ...rest } = this.requestState;
    this.requestState = rest;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadTableData();
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters = ValidAttributesMatrixFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    if (updatedFilters === null) {
      this.clearAllFilters();
    } else {
      this.applyFilters(updatedFilters);
    }
  }

  /* -------------------------------- ROW ACTIONS -------------------------------- */

  onRowAction(event: TableRowActionEvent<ValidAttributesMatrix>): void {
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: ValidAttributesMatrix): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadTableData();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.closeFilterPanel();
        this.appliedFilters = null;
        this.filterChips = [];
        this.requestState = {};
        this.loadTableData();
        this.loadFilterDropdownOptions();
      });
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
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
      if (this.overlayRef) {
        event.preventDefault();
        this.closeFilterPanel();
      } else if (this.sidePanelOpen) {
        event.preventDefault();
        this.closeSidePanel();
      }
    }
  }
}
