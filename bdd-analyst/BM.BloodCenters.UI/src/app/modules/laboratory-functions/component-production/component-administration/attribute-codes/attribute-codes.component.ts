import { Component, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectorRef, effect, inject, signal, computed, TemplateRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import moment, { Moment } from 'moment';
import { AttributeCodeFilterChipsUtils, AttributeCodeFilterCriteria } from './utils/filter-chips.utils';

import { AttributeCodeModel, AttributeCodeFormValue, AttributeCodeQueryParamsDto, AttributeGroupDropdownItem } from './models/attribute-codes.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
  RowAction,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import { AddEditAttributeCodeComponent } from './add-edit-attribute-code/add-edit-attribute-code';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '../../../../../core/constants/route-registry';
import { RouteKey } from '../../../../../core/constants/route-keys';
import { AttributeCodesApiService } from './services/attribute-codes-api.service';

@Component({
  selector: 'app-attribute-codes',
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
    MatTooltipModule,
    MatDatepickerModule,
    OverlayModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterPanelBase,
    FilterChips,
    DataTable,
    AddEditAttributeCodeComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './attribute-codes.component.html',
  styleUrls: ['./attribute-codes.component.scss']
})
export class AttributeCodesComponent implements OnInit, OnDestroy {
  @ViewChild(AddEditAttributeCodeComponent) sideDrawer!: AddEditAttributeCodeComponent;
  @ViewChild(DataTable) dataTableComponent!: DataTable<AttributeCodeModel>;
  @ViewChild('expandTemplate', { static: false }) expandTemplate!: TemplateRef<any>;
  @ViewChild('filterTrigger', { read: CdkOverlayOrigin, static: false }) filterTrigger?: CdkOverlayOrigin;
  @ViewChild('effectiveDateInput', { read: ElementRef }) effectiveDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('terminationDateInput', { read: ElementRef }) terminationDateInput!: ElementRef<HTMLInputElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);

  // Form controls
  attributeGroupControl = new FormControl<string>('');
  attributeGroupSearchControl = new FormControl<string>('');
  descriptionControl = new FormControl<string>({ value: '', disabled: true });

  // Search controls
  searchText = '';
  searchBarConfig: SearchBarConfig = {
    placeholder: 'Search by attribute code and description',
    minLength: 2,
    ariaLabel: 'Search by attribute code and description',
    searchOnEnterOnly: true
  };

  // Filter controls
  filterPanelOpen = false;
  filterLabellingControl = new FormControl<string | null>(null);
  filterExclusivityControl = new FormControl<string | null>(null);
  filterEffectiveDatePeriodControl = new FormControl<string | null>(null);
  filterEffectiveDateControl = new FormControl<Moment | null>(null);
  filterTerminationDatePeriodControl = new FormControl<string | null>(null);
  filterTerminationDateControl = new FormControl<Moment | null>(null);

  // Applied filters for chips display
  appliedFilters: AttributeCodeFilterCriteria | null = null;
  filterChips = signal<FilterChip[]>([]);

  // Signal to track if any filter control has a value
  hasAnyFilterValue = signal<boolean>(false);

  // Computed signal to check if filters have been applied (for Clear All button)
  hasActiveFilters = computed(() => {
    return this.filterChips().length > 0;
  });

  // Error state matchers for date fields
  effectiveDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      // Show error immediately if control is invalid and has value (user has typed something)
      // Or if touched (user has blurred the field)
      return !!(control.invalid && (control.dirty || control.touched));
    }
  };

  terminationDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      // Show error immediately if control is invalid and has value (user has typed something)
      // Or if touched (user has blurred the field)
      return !!(control.invalid && (control.dirty || control.touched));
    }
  };

  // Dropdown options
  attributeGroupOptions: AttributeGroupDropdownItem[] = [];
  filteredAttributeGroups: AttributeGroupDropdownItem[] = [];

  // Expandable rows
  expandedRows = new Set<string>();
  expandRowKey = 'uniqueRowId';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<AttributeCodeModel> = {
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
      column: 'attributeCode',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  dataSource: AttributeCodeModel[] = [];
  requestState: AttributeCodeQueryParamsDto = {};

  isLoading = false;
  hasError = false;
  errorMessage = '';

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AttributeCodeModel | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private headerService: HeaderService,
    private menuService: MenuService,
    private apiService: AttributeCodesApiService
  ) {
    this.initializeConfigurations();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.AttributeCodes].path;
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
    this.loadAttributeGroups();
    this.subscribeToChapterChanges();
    this.setupAttributeGroupListener();
    this.setupSearchListener();
    this.setupFilterListeners();
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
        this.attributeGroupControl.setValue('');
        this.descriptionControl.setValue('');
        this.dataSource = [];
        this.tableConfig.pagination!.totalRecords = 0;
        this.loadAttributeGroups();
      });
  }

  private setupAttributeGroupListener(): void {
    this.attributeGroupControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((attribGroup) => {
        const selectedGroup = this.attributeGroupOptions.find(g => g.code === attribGroup);
        this.descriptionControl.setValue(selectedGroup?.description || '');

        // Update header actions based on selection
        this.updateHeaderActions(!!attribGroup);

        if (attribGroup) {
          this.requestState = {
            ...this.requestState,
            attribGroup
          };
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.pageIndex = 0;
          }
          this.loadData();
        } else {
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        }

        // Trigger change detection to avoid NG0100 error
        this.cdr.detectChanges();
      });
  }

  private updateHeaderActions(hasSelection: boolean): void {
    this.headerConfig = {
      ...this.headerConfig,
      actions: hasSelection ? [
        {
          label: 'ADD NEW ATTRIBUTE CODE',
          icon: 'add',
          onClick: () => this.openAddDrawer(),
          color: 'primary',
          matButton: 'raised'
        }
      ] : []
    };
  }

  private loadAttributeGroups(): void {
    this.apiService
      .getAttributeGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroupOptions = groups;
          this.filteredAttributeGroups = groups;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading attribute groups:', error);
          this.attributeGroupOptions = [];
          this.filteredAttributeGroups = [];
          this.cdr.detectChanges();
        }
      });
  }

  private setupSearchListener(): void {
    this.attributeGroupSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchText) => {
        this.filterAttributeGroups(searchText || '');
      });
  }

  private setupFilterListeners(): void {
    // Subscribe to all filter control value changes to update hasAnyFilterValue signal
    const updateFilterValue = () => {
      const hasValue = !!(
        this.filterLabellingControl.value ||
        this.filterExclusivityControl.value ||
        (this.filterEffectiveDatePeriodControl.value && this.filterEffectiveDateControl.value) ||
        (this.filterTerminationDatePeriodControl.value && this.filterTerminationDateControl.value)
      );
      this.hasAnyFilterValue.set(hasValue);
    };

    // Subscribe to each filter control
    this.filterLabellingControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(updateFilterValue);

    this.filterExclusivityControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(updateFilterValue);

    this.filterEffectiveDatePeriodControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(updateFilterValue);

    this.filterEffectiveDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(updateFilterValue);

    this.filterTerminationDatePeriodControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(updateFilterValue);

    this.filterTerminationDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(updateFilterValue);
  }

  private filterAttributeGroups(searchText: string): void {
    if (!searchText) {
      this.filteredAttributeGroups = this.attributeGroupOptions;
    } else {
      const term = searchText.toLowerCase();
      this.filteredAttributeGroups = this.attributeGroupOptions.filter(
        (group) =>
          group.code.toLowerCase().includes(term) ||
          group.description.toLowerCase().includes(term)
      );
    }
    this.cdr.detectChanges();
  }

  onDropdownOpened(isOpen: boolean): void {
    if (isOpen) {
      this.attributeGroupSearchControl.setValue('');
      this.filteredAttributeGroups = this.attributeGroupOptions;
    }
  }

  getSelectedGroupDisplay(): string {
    const selectedCode = this.attributeGroupControl.value;
    return selectedCode || '';
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: [] // Initially empty, will be shown when attribute group is selected
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 10,
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
      emptyMessage: 'No attribute codes available to display',
      loadingMessage: 'Loading attribute codes...',
      showPagination: true
    };
  }

  private getTableColumns(): TableColumn<AttributeCodeModel>[] {
    return [
      {
        key: 'attributeCode',
        header: 'Attribute Code',
        width: '90px',
        sortable: false,
        headerClass: 'attribute-code-header'
      },
      {
        key: 'description',
        header: 'Description',
        width: '300px'
      },
      {
        key: 'unitSchemeType',
        header: 'Unit Scheme',
        width: '100px',
        valueFormatter: (value) => value || '–'
      },
      {
        key: 'statusFlag',
        header: 'Attribute Status',
        width: '120px',
        valueFormatter: (value) => {
          if (value === 'O') return 'O';
          if (value === 'A') return 'A';
          return value || '–';
        }
      },
      {
        key: 'interCode',
        header: 'Interdiction Code',
        width: '110px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'stopLabelFlag',
        header: 'Labelling',
        width: '110px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'attributeCustom',
        header: 'Attribute',
        width: '110px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'showOnLabelFlag',
        header: 'Show for Labelling',
        width: '85px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'deleteAllowed',
        header: 'Allow Delete',
        width: '90px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      },
      {
        key: 'attributeType',
        header: 'Type',
        width: '100px',
        valueFormatter: (value) => value || '–'
      },
      {
        key: 'exclusivityFlag',
        header: 'Exclusivity Flag',
        width: '140px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No'
      }
    ];
  }

  private getRowActions(): RowAction<AttributeCodeModel>[] {
    return [
      {
        icon: 'edit',
        label: 'Edit attribute code',
        ariaLabel: 'Edit attribute code',
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

  formatExpandedDate(date: Date | string | null | undefined): string {
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

    const take = this.tableConfig.pagination?.pageSize || 25;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    this.apiService
      .getAttributeCodes(take, skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Add unique row ID to each item for expansion tracking
          this.dataSource = response.data.map(item => ({
            ...item,
            uniqueRowId: `${item.attributeGroup || ''}_${item.attributeCode || ''}_${item.unitSchemeType || ''}`
          }));
          this.tableConfig.pagination!.totalRecords = response.total;
          this.isLoading = false;
          this.hasError = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading attribute codes:', error);
          this.hasError = true;
          this.errorMessage = 'Failed to load attribute codes. Please try again.';
          this.isLoading = false;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
          this.cdr.detectChanges();
        }
      });
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

    this.requestState = {
      ...this.requestState,
      sortColumn: event.column,
      sortOrder: event.direction === 'A' ? 'asc' : event.direction === 'D' ? 'desc' : undefined
    };

    this.loadData();
  }

  onRowExpandToggle(row: AttributeCodeModel): void {
    const key = row.uniqueRowId;
    if (!key) return;

    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
    this.cdr.detectChanges();
  }

  onExpandAllToggle(expanded: boolean): void {
    if (expanded) {
      // Expand all rows on current page
      this.dataSource.forEach(row => {
        const key = row.uniqueRowId;
        if (key) {
          this.expandedRows.add(key);
        }
      });
    } else {
      // Collapse all rows
      this.expandedRows.clear();
    }
    this.cdr.detectChanges();
  }

  onRowAction(event: TableRowActionEvent<AttributeCodeModel>): void {
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

  openEditDrawer(row: AttributeCodeModel): void {
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

  onSidePanelSave(formValue: AttributeCodeFormValue): void {
    if (this.sideDrawer) {
      this.sideDrawer.isSubmitting = true;
    }

    const selectedAttributeGroup = this.attributeGroupControl.value;
    if (this.sidePanelMode === 'add' && !selectedAttributeGroup) {
      this.snackBar.open('Please select an attribute group', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      if (this.sideDrawer) {
        this.sideDrawer.isSubmitting = false;
      }
      return;
    }

    const saveOperation = this.sidePanelMode === 'add'
      ? this.apiService.createAttributeCode(selectedAttributeGroup!, formValue)
      : this.apiService.updateAttributeCode(
          this.sidePanelData!.attributeGroup,
          this.sidePanelData!.attributeCode,
          this.sidePanelData!.unitSchemeType, // Original unit scheme for URL (backend key)
          formValue
        );

    saveOperation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedData: AttributeCodeModel) => {
          // Show success message
          const successMessage = this.sidePanelMode === 'add'
            ? 'Attribute code created successfully'
            : 'Attribute code updated successfully';

          this.snackBar.open(successMessage, 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });

          // For edit mode: update the row immediately without reloading
          if (this.sidePanelMode === 'edit' && this.sidePanelData) {
            const rowIndex = this.dataSource.findIndex(
              item => item.uniqueRowId === this.sidePanelData!.uniqueRowId
            );

            if (rowIndex !== -1) {
              // Create updated row by merging: existing → backend response → form values
              // Backend only returns 4 fields (attribGroup, attribCode, unitSchemeType, attribDesc)
              // Form values should take final precedence for fields the user edited
              const updatedRow: AttributeCodeModel = {
                ...this.dataSource[rowIndex],           // Start with existing data
                ...savedData,                            // Apply backend response (4 fields)
                // Apply form values last so they take precedence
                unitSchemeType: formValue.unitScheme!,
                description: formValue.description!,
                attributeType: formValue.attributeType!,
                attributeLabel: formValue.attributeLabel || null,
                attributeAbbrev: formValue.attributeAbbrev || null,
                attributePosition: formValue.attributePosition || null,
                statusFlag: formValue.statusFlag!,
                normalStockFlag: formValue.normalStockFlag,
                assignAfterLabelFlag: formValue.assignAfterLabelFlag,
                interCode: formValue.interCode || null,
                stopLabelFlag: formValue.stopLabelFlag!,
                attributeCustom: formValue.attributeCustom!,
                showOnLabelFlag: formValue.showOnLabelFlag!,
                deleteAllowed: formValue.deleteAllowed!,
                exclusivityFlag: formValue.exclusivityFlag!,
                price: formValue.price,                  // Preserve null/undefined/0
                serviceCode: formValue.serviceCode || null,
                creditFlag: formValue.creditFlag!,
                effectiveDate: formValue.effectiveDate ? formValue.effectiveDate.format('YYYY-MM-DD') : null,
                terminationDate: formValue.terminationDate ? formValue.terminationDate.format('YYYY-MM-DD') : null
              };

              // Update the row in dataSource
              this.dataSource[rowIndex] = updatedRow;

              // Update the activeRow reference if this row is active/expanded
              if (this.dataTableComponent?.activeRow?.uniqueRowId === updatedRow.uniqueRowId) {
                this.dataTableComponent.activeRow = updatedRow;
              }

              // Update sidePanelData to the new saved data
              this.sidePanelData = updatedRow;

              // Trigger change detection
              this.dataSource = [...this.dataSource];
              this.cdr.detectChanges();

              // Reset form to pristine state after successful save
              if (this.sideDrawer) {
                this.sideDrawer.resetFormAfterSave();
              }
            } else {
              // Fallback: reload if row not found
              this.loadData();
            }
          } else {
            // For add mode: reload to get the new item with its server-generated ID
            this.loadData();
          }

          // Close panel after successful save
          this.closeSidePanel();
        },
        error: (error) => {
          console.error('[Component] Error saving attribute code:', error);

          // Extract error message and error code from backend response
          let errorMessage = error?.error?.message
                          || error?.error?.error
                          || error?.error?.title
                          || error?.message
                          || error?.statusText;

          // Extract error code (try both locations)
          let errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;

          // If error.error is a string, use it directly
          if (typeof error?.error === 'string') {
            errorMessage = error.error;
          }

          // WORKAROUND: Replace generic backend error messages with helpful user-facing messages
          if (errorMessage && typeof errorMessage === 'string') {
            // Generic "updating/creating valid attribute" error - usually means duplicate or validation constraint
            if (errorMessage.toLowerCase().includes('error occurred while updating valid attribute') ||
                errorMessage.toLowerCase().includes('error occurred while creating valid attribute') ||
                (errorMessage.toLowerCase().includes('error occurred while') && errorMessage.toLowerCase().includes('attribute'))) {
              errorMessage = 'Duplicate combination of attribute group and code';
              // Set error code 5105 (from FMB dupli_check procedure) if not already present
              if (!errorCode || !errorCode.trim()) {
                errorCode = '5105';
              }
            }
          }

          // Prepend error code if it exists
          if (errorCode && errorCode.trim()) {
            errorMessage = `Error ${errorCode}: ${errorMessage}`;
          }

          // Fallback to default message if no backend message found
          if (!errorMessage) {
            errorMessage = this.sidePanelMode === 'add'
              ? 'Failed to create attribute code'
              : 'Failed to update attribute code';
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });

          // Reset form state after error (update mode)
          if (this.sideDrawer) {
            this.sideDrawer.resetFormAfterError();
          }
        }
      });
  }

  onSidePanelSaveAndCreateAnother(formValue: AttributeCodeFormValue): void {
    if (this.sideDrawer) {
      this.sideDrawer.isSubmitting = true;
    }

    const selectedAttributeGroup = this.attributeGroupControl.value;
    if (!selectedAttributeGroup) {
      this.snackBar.open('Please select an attribute group', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      if (this.sideDrawer) {
        this.sideDrawer.isSubmitting = false;
      }
      return;
    }

    this.apiService
      .createAttributeCode(selectedAttributeGroup, formValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Show success message
          this.snackBar.open('Attribute code created successfully', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });

          this.loadData();
          if (this.sideDrawer) {
            this.sideDrawer.isSubmitting = false;
            // Re-initialize the form with default values instead of just resetting
            // This ensures all default values and validators are properly set up
            this.sideDrawer.initializeForm();
            this.sideDrawer.cdr.markForCheck();
          }
        },
        error: (error) => {
          console.error('Error saving attribute code:', error);

          // Extract error message and error code from backend response
          let errorMessage = error?.error?.message
                          || error?.error?.error
                          || error?.error?.title
                          || error?.message
                          || error?.statusText;

          // Extract error code (try both locations)
          let errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;

          // If error.error is a string, use it directly
          if (typeof error?.error === 'string') {
            errorMessage = error.error;
          }

          // WORKAROUND: Replace generic backend error messages with helpful user-facing messages
          if (errorMessage && typeof errorMessage === 'string') {
            // Generic "creating valid attribute" error - usually means duplicate or validation constraint
            if (errorMessage.toLowerCase().includes('error occurred while creating valid attribute') ||
                (errorMessage.toLowerCase().includes('error occurred while') && errorMessage.toLowerCase().includes('attribute'))) {
              errorMessage = 'Duplicate combination of attribute group and code';
              // Set error code 5105 (from FMB dupli_check procedure) if not already present
              if (!errorCode || !errorCode.trim()) {
                errorCode = '5105';
              }
            }
          }

          // Fallback to default message if no backend message found
          if (!errorMessage) {
            errorMessage = 'Failed to create attribute code';
          }

          // Prepend error code if it exists
          if (errorCode && errorCode.trim()) {
            errorMessage = `Error ${errorCode}: ${errorMessage}`;
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });

          // Reset form state after error (add mode)
          if (this.sideDrawer) {
            this.sideDrawer.resetFormAfterError();
          }
        }
      });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.sidePanelOpen) {
        this.closeSidePanel();
      } else if (this.filterPanelOpen) {
        this.closeFilterPanel();
      }
    }
  }

  // Search methods
  onSearch(searchText: string): void {
    this.searchText = searchText;
    const trimmedSearch = searchText.trim();

    if (trimmedSearch) {
      this.requestState = {
        ...this.requestState,
        searchKeyword: trimmedSearch
      };
    } else {
      // Remove search parameter if search text is empty
      const { searchKeyword, ...restState } = this.requestState;
      this.requestState = restState;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onSearchCleared(): void {
    this.searchText = '';
    const { searchKeyword, ...restState } = this.requestState;
    this.requestState = restState;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  // Filter panel methods
  toggleFilterPanel(): void {
    this.filterPanelOpen = !this.filterPanelOpen;
    this.cdr.detectChanges();
  }

  closeFilterPanel(): void {
    this.filterPanelOpen = false;
    this.cdr.detectChanges();
  }

  applyFilters(): void {
    // Build filter parameters for API
    const filters: any = {};

    // Build filter criteria for chips
    const chipFilters: AttributeCodeFilterCriteria = {};

    // Labelling filter - use stopLabelFlag as the parameter name
    if (this.filterLabellingControl.value) {
      filters.stopLabelFlag = this.filterLabellingControl.value === 'Yes' ? 'Y' : 'N';
      chipFilters.labelling = this.filterLabellingControl.value;
    }

    // Exclusivity flag filter
    if (this.filterExclusivityControl.value) {
      filters.exclusivityFlag = this.filterExclusivityControl.value === 'Yes' ? 'Y' : 'N';
      chipFilters.exclusivityFlag = this.filterExclusivityControl.value;
    }

    // Effective date filter - only add if BOTH period and date are selected
    if (this.filterEffectiveDatePeriodControl.value && this.filterEffectiveDateControl.value) {
      const effDate = this.filterEffectiveDateControl.value.format('YYYY-MM-DD');
      if (this.filterEffectiveDatePeriodControl.value === 'After') {
        filters.effectiveDateFrom = effDate;
      } else if (this.filterEffectiveDatePeriodControl.value === 'Before') {
        filters.effectiveDateTo = effDate;
      }
      chipFilters.effectiveDate = effDate;
      chipFilters.effectiveDatePeriod = this.filterEffectiveDatePeriodControl.value;
    }

    // Termination date filter - only add if BOTH period and date are selected
    if (this.filterTerminationDatePeriodControl.value && this.filterTerminationDateControl.value) {
      const termDate = this.filterTerminationDateControl.value.format('YYYY-MM-DD');
      if (this.filterTerminationDatePeriodControl.value === 'After') {
        filters.terminationDateFrom = termDate;
      } else if (this.filterTerminationDatePeriodControl.value === 'Before') {
        filters.terminationDateTo = termDate;
      }
      chipFilters.terminationDate = termDate;
      chipFilters.terminationDatePeriod = this.filterTerminationDatePeriodControl.value;
    }

    // Update applied filters and chips
    this.appliedFilters = Object.keys(chipFilters).length > 0 ? chipFilters : null;
    this.filterChips.set(AttributeCodeFilterChipsUtils.convertFiltersToChips(this.appliedFilters));

    // Update request state with filters
    this.requestState = {
      ...this.requestState,
      ...filters
    };

    // Reset pagination and reload
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.closeFilterPanel();
    this.loadData();
  }

  clearFilters(): void {
    // Reset all filter controls
    this.filterLabellingControl.setValue(null);
    this.filterExclusivityControl.setValue(null);
    this.filterEffectiveDatePeriodControl.setValue(null);
    this.filterEffectiveDateControl.setValue(null);
    this.filterTerminationDatePeriodControl.setValue(null);
    this.filterTerminationDateControl.setValue(null);

    // Clear applied filters and chips
    this.appliedFilters = null;
    this.filterChips.set([]);

    // Remove filter parameters from request state
    const {
      stopLabelFlag,
      exclusivityFlag,
      effectiveDateFrom,
      effectiveDateTo,
      terminationDateFrom,
      terminationDateTo,
      ...restState
    } = this.requestState;

    this.requestState = restState;

    // Reset pagination and reload
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  removeFilterChip(chipKey: string): void {
    // Update applied filters
    this.appliedFilters = AttributeCodeFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips.set(AttributeCodeFilterChipsUtils.convertFiltersToChips(this.appliedFilters));

    // Clear corresponding form controls and request state based on chip key
    switch (chipKey) {
      case 'labelling':
        this.filterLabellingControl.setValue(null);
        delete (this.requestState as any).stopLabelFlag;
        break;
      case 'exclusivityFlag':
        this.filterExclusivityControl.setValue(null);
        delete (this.requestState as any).exclusivityFlag;
        break;
      case 'effectiveDate':
        this.filterEffectiveDatePeriodControl.setValue(null);
        this.filterEffectiveDateControl.setValue(null);
        delete (this.requestState as any).effectiveDateFrom;
        delete (this.requestState as any).effectiveDateTo;
        break;
      case 'terminationDate':
        this.filterTerminationDatePeriodControl.setValue(null);
        this.filterTerminationDateControl.setValue(null);
        delete (this.requestState as any).terminationDateFrom;
        delete (this.requestState as any).terminationDateTo;
        break;
    }

    // Reset pagination and reload
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  clearAllFilterChips(): void {
    this.clearFilters();
  }

  getEffectiveDateError(): string {
    const control = this.filterEffectiveDateControl;
    if (!control) return '';

    // Check if the control has datepicker parse error or is invalid
    if (control.hasError('matDatepickerParse')) {
      return 'Invalid date format. Use DD-MON-YYYY (e.g., 01-JAN-2026)';
    }

    if (control.invalid && control.touched) {
      return 'Invalid date format. Use DD-MON-YYYY (e.g., 01-JAN-2026)';
    }

    return '';
  }

  getTerminationDateError(): string {
    const control = this.filterTerminationDateControl;
    if (!control) return '';

    // Check if the control has datepicker parse error or is invalid
    if (control.hasError('matDatepickerParse')) {
      return 'Invalid date format. Use DD-MON-YYYY (e.g., 01-JAN-2026)';
    }

    if (control.invalid && control.touched) {
      return 'Invalid date format. Use DD-MON-YYYY (e.g., 01-JAN-2026)';
    }

    return '';
  }

  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    setTimeout(() => {
      const control = this.filterEffectiveDateControl;
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onEffectiveDateBlur(): void {
    // Mark as touched to trigger validation display
    this.filterEffectiveDateControl.markAsTouched();
    this.filterEffectiveDateControl.updateValueAndValidity();
  }

  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    setTimeout(() => {
      const control = this.filterTerminationDateControl;
      if (control && !control.value && input.value.trim()) {
        control.setErrors({ invalidDateFormat: true });
        control.markAsTouched();
        this.cdr.markForCheck();
      }
    }, 0);
  }

  onTerminationDateBlur(): void {
    // Mark as touched to trigger validation display
    this.filterTerminationDateControl.markAsTouched();
    this.filterTerminationDateControl.updateValueAndValidity();
  }
}
