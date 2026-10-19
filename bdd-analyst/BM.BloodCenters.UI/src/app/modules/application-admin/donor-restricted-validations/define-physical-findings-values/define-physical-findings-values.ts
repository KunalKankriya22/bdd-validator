import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectorRef, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { DefinePhysicalFindingsValuesService } from './services/define-physical-findings-values.service';
import {
  DefinePhysicalFindingsValuesModel,
  DefinePhysicalFindingsValuesParamsDto
} from './models/define-physical-findings-values.model';

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
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DefinePhysicalFindingsValuesFilterPanel } from './define-physical-findings-values-filter-panel/define-physical-findings-values-filter-panel';
import {
  DefinePhysicalFindingsValuesFilterFormValue,
  DefinePhysicalFindingsValuesFilterChipsUtils
} from './utils/filter-chips.utils';
import { AddEditPhysicalRule } from './add-edit-physical-rule/add-edit-physical-rule';

@Component({
  selector: 'app-define-physical-findings-values',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    OverlayModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    DefinePhysicalFindingsValuesFilterPanel,
    AddEditPhysicalRule
  ],
  templateUrl: './define-physical-findings-values.html',
  styleUrls: ['./define-physical-findings-values.scss']
})
export class DefinePhysicalFindingsValuesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(DataTable) dataTableComponent!: DataTable<DefinePhysicalFindingsValuesModel>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 2,
    ariaLabel: '',
    searchOnEnterOnly: true
  };

  // Top filter form
  topFilterForm!: FormGroup;
  private readonly donationTypesSignal = signal<any[]>([]);
  private readonly procedureCodesSignal = signal<any[]>([]);

  // Search controls for ngx-mat-select-search
  readonly donationTypeSearchControl = new FormControl('');
  readonly procedureCodeSearchControl = new FormControl('');

  // Search signals for reactivity
  private readonly donationTypeSearch = signal('');
  private readonly procedureCodeSearch = signal('');

  // Filtered options as computed signals
  readonly filteredDonationTypes = computed(() => {
    const items = this.donationTypesSignal();
    const search = this.donationTypeSearch().toLowerCase();
    if (!search) return items;
    return items.filter(item => {
      const key = (item.key || '').toString().toLowerCase();
      const value = (item.value || '').toString().toLowerCase();
      return key.includes(search) || value.includes(search);
    });
  });

  readonly filteredProcedureCodes = computed(() => {
    const items = this.procedureCodesSignal();
    const search = this.procedureCodeSearch().toLowerCase();
    if (!search) return items;
    return items.filter(item => {
      const key = (item.key || '').toString().toLowerCase();
      const value = (item.value || '').toString().toLowerCase();
      return key.includes(search) || value.includes(search);
    });
  });

  // Compare function for mat-select with object values
  compareLookupItems = (a: any, b: any): boolean => {
    if (!a || !b) return false;
    return a.key === b.key;
  };

  // All lookups data (loaded once and passed to child components)
  lookupsData: any = null;
  filterLookupsData: any = null;

  tableConfig: DataTableConfig<DefinePhysicalFindingsValuesModel> = {
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
      column: 'physicalCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DefinePhysicalFindingsValuesFilterFormValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DefinePhysicalFindingsValuesModel[] = [];
  requestState: DefinePhysicalFindingsValuesParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';
  searchText = '';  // Store current search text

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DefinePhysicalFindingsValuesModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  // Track whether user has clicked Retrieve at least once
  hasRetrievedData = false;

  private destroy$ = new Subject<void>();

  // Pagination constants
  private static readonly PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
  private static readonly DEFAULT_PAGE_SIZE = 25;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private definePhysicalFindingsValuesService: DefinePhysicalFindingsValuesService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

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
          subtitle: pageData.subtitle,
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    this.topFilterForm = this.fb.group({
      donationType: [null],
      procedureCode: [null]
    });

    // Setup search subscriptions for dropdowns
    this.setupSearchSubscriptions();

    // Load dropdown data for filters
    this.loadFilterDropdowns();

    // Don't load data initially - user must select filters and click RETRIEVE
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
        this.topFilterForm.reset();
        this.dataSource = [];
        this.requestState = {};
        this.appliedFilters = null;
        this.filterChips = [];
        this.hasRetrievedData = false;
        this.filterLookupsData = null;
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }
        this.loadFilterDropdowns();
      });
  }

  private loadFilterDropdowns(): void {
    this.definePhysicalFindingsValuesService.getLookups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lookups) => {
          this.lookupsData = lookups;
          this.filterLookupsData = lookups;
          this.donationTypesSignal.set(lookups?.donationTypes || lookups?.DonationTypes || []);
          this.procedureCodesSignal.set(lookups?.procedureCodes || lookups?.ProcedureCodes || []);
        },
        error: (err) => {
          console.error('Failed to load physical findings lookups:', err);
        }
      });
  }

  private setupSearchSubscriptions(): void {
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.donationTypeSearch.set(value || ''));

    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.procedureCodeSearch.set(value || ''));
  }

  /** Reset search when dropdown closes so all items show on next open */
  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private initializeConfigurations(): void {
    const pageData = this.pageHeaderService.pageHeaderData();
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: pageData?.title || '',
          link: null
        }
      ],
      title: pageData?.title || '',
      subtitle: pageData?.subtitle || '',
      actions: []
    };

    this.searchConfig = {
      placeholder: 'Search by Physical Code and Data Type',
      minLength: 2,
      ariaLabel: 'Search physical findings values by physical code or data type',
      searchOnEnterOnly: true  // Press Enter to search
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: DefinePhysicalFindingsValuesComponent.DEFAULT_PAGE_SIZE,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [...DefinePhysicalFindingsValuesComponent.PAGE_SIZE_OPTIONS],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'physicalCode',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      noDataIcon: 'edit',
      emptyMessage: 'No Physical Finding Rules Selected',
      emptySubMessage: 'Select a donor type or procedure code, then click Retrieve to view or add validation rules.',
      loadingMessage: 'Loading physical findings values data...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<DefinePhysicalFindingsValuesModel>[] {
    return [
      {
        key: 'physicalCode',
        header: 'Physical Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'dataType',
        header: 'Data Type',
        width: '110px',
        valueFormatter: (value) => {
          const dataTypeMap: { [key: string]: string } = {
            'N': 'Numeric',
            'C': 'Character',
            'D': 'Decimal'
          };
          return dataTypeMap[value] || value;
        }
      },
      {
        key: 'minimumValue',
        header: 'Minimum Value',
        width: '130px'
      },
      {
        key: 'maximumValue',
        header: 'Maximum Value',
        width: '140px'
      },
      {
        key: 'operator',
        header: 'Operator',
        width: '110px'
      },
      {
        key: 'gender',
        header: 'Sex',
        width: '80px',
        valueFormatter: (value) => {
          const genderMap: { [key: string]: string } = {
            'M': 'Male',
            'F': 'Female',
            'A': 'All'
          };
          return genderMap[value] || value;
        }
      },
      {
        key: 'fromAge',
        header: 'From Age',
        width: '100px'
      },
      {
        key: 'toAge',
        header: 'To Age',
        width: '90px'
      },
      {
        key: 'interdiction',
        header: 'Interdiction',
        width: '120px'
      },
      {
        key: 'equipmentType',
        header: 'Equipment Type',
        width: '140px'
      },
      {
        key: 'commentsRequired',
        header: 'Comments Required',
        width: '160px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'manualAuditRequired',
        header: 'Manual Audit Required',
        width: '180px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        width: '140px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        width: '150px',
        valueFormatter: (value) => this.formatDate(value)
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

  private getRowActions(): RowAction<DefinePhysicalFindingsValuesModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit physical rule',
        ariaLabel: 'Edit physical rule for {{physicalCode}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  get isRetrieveEnabled(): boolean {
    const formValue = this.topFilterForm?.value;
    const donationType = formValue?.donationType;
    const procedureCode = formValue?.procedureCode;
    return !!(donationType && typeof donationType === 'object' &&
             procedureCode && typeof procedureCode === 'object');
  }

  onRetrieve(): void {
    const formValue = this.topFilterForm.value;
    this.requestState.donationType = formValue.donationType?.key || undefined;
    this.requestState.procedureCode = formValue.procedureCode?.key || undefined;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.hasRetrievedData = true;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || DefinePhysicalFindingsValuesComponent.DEFAULT_PAGE_SIZE);

    const take = this.tableConfig.pagination?.pageSize || DefinePhysicalFindingsValuesComponent.DEFAULT_PAGE_SIZE;

    this.definePhysicalFindingsValuesService
      .getDefinePhysicalFindingsValues(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
          this.isLoading = false;
          this.updateEmptyMessage();
          if (this.hasRetrievedData) {
            this.updateFilterLookupsFromData(response.data);
          }
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load physical findings values data. Please try again.';
        }
      });
  }

  private updateFilterLookupsFromData(data: DefinePhysicalFindingsValuesModel[]): void {
    const toItems = (values: string[]) => values.map(v => ({ key: v, value: v }));

    const equipTypes    = [...new Set(data.map(r => r.equipmentType).filter(Boolean))];
    const interCodes    = [...new Set(data.map(r => r.interdiction).filter(Boolean))];
    const operators     = [...new Set(data.map(r => r.operator).filter(Boolean))];
    const auditFlags    = [...new Set(data.map(r => r.manualAuditRequired).filter(Boolean))];
    const genders       = [...new Set(data.map(r => r.gender).filter(Boolean))];
    const dataTypes     = [...new Set(data.map(r => r.dataType).filter(Boolean))];
    const physicalCodes = [...new Set(data.map(r => r.physicalCode).filter(Boolean))];

    this.filterLookupsData = {
      equipmentTypes:   toItems(equipTypes),
      interdictionCodes: interCodes.map(v => ({ key: v, value: v })),
      operators:        toItems(operators),
      manualAuditFlags: auditFlags.map(v => ({ key: v, value: v === 'Y' ? 'Yes' : 'No' })),
      genders:          genders.map(v => ({ key: v, value: v === 'M' ? 'Male' : v === 'F' ? 'Female' : v === 'A' ? 'All' : v })),
      dataTypes:        dataTypes.map(v => ({ key: v, value: v === 'N' ? 'Numeric' : v === 'C' ? 'Character' : v === 'D' ? 'Decimal' : v })),
      physicalCodes:    toItems(physicalCodes),
    };
  }

  onSearch(searchText: string): void {
    const trimmed = searchText?.trim() || '';

    // Only allow search with 2+ characters, or empty to clear
    if (trimmed.length > 0 && trimmed.length < 2) {
      this.snackBar.open('Please enter at least 2 characters to search.', 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    this.searchText = trimmed;
    this.requestState.searchKeyword = trimmed || undefined;

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

    if (event.direction === 'D') {
      this.requestState.sort = 'D';
    } else if (event.direction === 'A') {
      this.requestState.sort = 'A';
    } else {
      this.requestState.sort = undefined;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DefinePhysicalFindingsValuesModel>): void {

    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }
    
    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = (this.requestState.donationType || this.requestState.procedureCode)
      ? ({
          donationType: this.requestState.donationType,
          procedureCode: this.requestState.procedureCode
        } as DefinePhysicalFindingsValuesModel)
      : null;
    this.sidePanelOpen = true;
  }

  editRecord(record: DefinePhysicalFindingsValuesModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
    this.cdr.detectChanges();
    if (this.isFilterOpen) {
      // Move focus into the first interactive element in the filter panel
      setTimeout(() => {
        const panel = document.querySelector<HTMLElement>(
          '.filter-panel button, .filter-panel [role="combobox"], .filter-panel input, .filter-panel mat-select'
        );
        panel?.focus();
      }, 150);
    } else {
      // Return focus to the filter button when closing
      this.filterBtn?.nativeElement?.focus();
    }
  }

  closeFilter(): void {
    this.isFilterOpen = false;
    this.filterBtn?.nativeElement?.focus();
  }

  applyFilters(filters: DefinePhysicalFindingsValuesFilterFormValue): void {
    this.appliedFilters = filters;
    this.filterChips = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(filters);

    // Update request state with filter values
    if (filters.operator) {
      this.requestState.operator = filters.operator;
    } else {
      delete this.requestState.operator;
    }

    if (filters.interdiction) {
      this.requestState.interdiction = filters.interdiction;
    } else {
      delete this.requestState.interdiction;
    }

    if (filters.manualAuditFindingsFlag) {
      this.requestState.manualAuditFindingsFlag = filters.manualAuditFindingsFlag;
    } else {
      delete this.requestState.manualAuditFindingsFlag;
    }

    if (filters.equipmentType) {
      this.requestState.equipmentType = filters.equipmentType;
    } else {
      delete this.requestState.equipmentType;
    }

    // Handle effective date with period
    if (filters.effectiveDate && filters.periodType) {
      this.requestState.effectiveDate = this.toISOStringWithoutTimezone(filters.effectiveDate);
      this.requestState.effectivePeriod = filters.periodType;
    } else {
      delete this.requestState.effectiveDate;
      delete this.requestState.effectivePeriod;
    }

    // Handle termination date with period
    if (filters.terminationDate && filters.terminationPeriodType) {
      this.requestState.terminationDate = this.toISOStringWithoutTimezone(filters.terminationDate);
      this.requestState.terminationPeriod = filters.terminationPeriodType;
    } else {
      delete this.requestState.terminationDate;
      delete this.requestState.terminationPeriod;
    }

    // Reset to first page when applying filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilter();
    this.loadData();
  }

  /**
   * Convert Date to ISO string without timezone shift
   * Preserves the local date by using UTC at noon
   */
  private toISOStringWithoutTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
  }

  removeFilterChip(chipKey: string): void {
    this.appliedFilters = DefinePhysicalFindingsValuesFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DefinePhysicalFindingsValuesFilterChipsUtils.convertFiltersToChips(
      this.appliedFilters
    );

    // Update request state
    switch (chipKey) {
      case 'operator':
        delete this.requestState.operator;
        break;
      case 'interdiction':
        delete this.requestState.interdiction;
        break;
      case 'manualAuditFindingsFlag':
        delete this.requestState.manualAuditFindingsFlag;
        break;
      case 'equipmentType':
        delete this.requestState.equipmentType;
        break;
      case 'effectiveDate':
        delete this.requestState.effectiveDate;
        delete this.requestState.effectivePeriod;
        break;
      case 'terminationDate':
        delete this.requestState.terminationDate;
        delete this.requestState.terminationPeriod;
        break;
    }

    // Reset to first page when removing filters
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Clear all filter-related request state
    delete this.requestState.operator;
    delete this.requestState.interdiction;
    delete this.requestState.manualAuditFindingsFlag;
    delete this.requestState.equipmentType;
    delete this.requestState.effectiveDate;
    delete this.requestState.effectivePeriod;
    delete this.requestState.terminationDate;
    delete this.requestState.terminationPeriod;

    // Reset to first page
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  private updateEmptyMessage(): void {
    if (this.dataSource.length === 0 && this.hasRetrievedData) {
      this.tableConfig.emptyMessage = 'No Physical Finding Rules to display';
      this.tableConfig.emptySubMessage = undefined;
      this.tableConfig.noDataIcon = 'inbox';
    }
  }

  get hasActiveFilters(): boolean {
    return DefinePhysicalFindingsValuesFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+N: Create new record
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this.createRecord();
    }

    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.searchBarComponent?.focus();
    }

    // Alt+F: Toggle filter panel
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.toggleFilter();
    }

    // Escape: Close side panel or filter if open
    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        event.preventDefault();
        this.closeSidePanel();
      } else if (this.isFilterOpen) {
        event.preventDefault();
        this.closeFilter();
      }
    }
  }
}

