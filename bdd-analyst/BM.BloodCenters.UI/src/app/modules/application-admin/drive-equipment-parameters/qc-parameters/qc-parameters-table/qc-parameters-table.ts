import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { QcParametersModel, QcParametersFilterParams } from '../../models/drive-equipment-parameters.model';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { AddEditQcParameters } from '../add-edit-qc-parameters/add-edit-qc-parameters';
import { QcParametersFilterPanel } from '../qc-parameters-filter-panel/qc-parameters-filter-panel';
import { HeaderService } from '@shared/services/header.service';

/**
 * QC Parameters Table Component
 * Displays QC parameters with filtering and CRUD operations
 */
@Component({
  selector: 'app-qc-parameters-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatPaginatorModule,
    OverlayModule,
    NgxMatSelectSearchModule,
    SearchBar,
    FilterChips,
    DataTable,
    AddEditQcParameters
  ],
  templateUrl: './qc-parameters-table.html',
  styleUrls: ['./qc-parameters-table.scss']
})
export class QcParametersTable implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef;
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef;
  @ViewChild('filterAnchor', { read: ElementRef }) filterAnchor!: ElementRef;

  private readonly driveEquipmentService = inject(DriveEquipmentParametersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly overlay = inject(Overlay);
  private readonly headerService = inject(HeaderService);

  private dataSource = signal<QcParametersModel[]>([]);
  private isLoading = signal<boolean>(false);
  private equipmentSupplyOptions = signal<Array<{ code: string; description: string }>>([]);
  private hasRetrievedSignal = signal<boolean>(false);
  private expandedRows = signal<Set<number>>(new Set());
  private appliedFilters = signal<QcParametersFilterParams>({});

  data = computed(() => this.dataSource());
  loading = computed(() => this.isLoading());
  equipmentSupplyList = computed(() => this.equipmentSupplyOptions());
  filterChips = computed(() => this.buildFilterChips());

  // Type options
  typeOptions = signal<string[]>(['EQUIP', 'SUPLY']);

  // Search control for Type searchable dropdown
  readonly typeSearchCtrl = new FormControl('');
  private readonly typeSearch = signal('');

  filteredTypeOptions = computed(() => {
    const search = this.typeSearch().toLowerCase();
    const items = this.typeOptions();
    if (!search) return items;
    return items.filter(t => t.toLowerCase().includes(search));
  });

  // Search control for Equipment Supply searchable dropdown
  readonly equipmentSupplySearchCtrl = new FormControl('');
  private readonly equipmentSupplySearch = signal('');

  filteredEquipmentSupplyList = computed(() => {
    const search = this.equipmentSupplySearch().toLowerCase();
    const items = this.equipmentSupplyOptions();
    if (!search) return items;
    return items.filter(c => c.code?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
  });
  expandedRowsSet = computed(() => this.expandedRows());
  hasRetrieved = computed(() => this.hasRetrievedSignal());

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: QcParametersModel | Partial<QcParametersModel> | null = null;

  // Type/Equipment Supply controls
  selectedType: string = '';
  selectedEquipmentSupply: string = '';

  // Validation errors
  typeError: string = '';
  equipmentSupplyError: string = '';

  // Overlay reference for filter panel
  overlayRef: any = null;

  private destroy$ = new Subject<void>();

  // Search configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by QC Parameter Code',
    minLength: 1,
    ariaLabel: 'Search QC parameters',
    searchOnEnterOnly: true
  };

  // Table configuration
  tableConfig: DataTableConfig<QcParametersModel> = {
    columns: [
      { key: 'sortSequence', header: 'Sort Sequence', sortable: true, width: '120px' },
      { key: 'qcParameterCode', header: 'QC Parameter Code', width: '150px' },
      { key: 'qcCheckCode', header: 'QC Check Code', width: '120px' },
      { key: 'dataType', header: 'Data Type', width: '100px' },
      { key: 'qcTargetValue', header: 'QC Target Value', width: '130px' },
      { key: 'childSequence', header: 'Child Sequence', width: '120px' },
      { key: 'rangeFlag', header: 'Range Flag', width: '100px' },
      { key: 'rangeDetailsValue', header: 'Range Details Value (+/-)', width: '180px' },
      { key: 'scanRequest', header: 'Scan Request', width: '110px' },
      { key: 'scanWhat', header: 'Scan What?', width: '100px' },
      { key: 'equipmentType', header: 'Equipment Type', width: '130px' },
      { key: 'effectiveDate', header: 'Effective Date', width: '120px', valueFormatter: (v) => this.formatDate(v) },
      { key: 'terminationDate', header: 'Termination Date', width: '130px', valueFormatter: (v) => this.formatDate(v) },
      { key: 'modificationDate', header: 'Modification Date', width: '140px', valueFormatter: (v) => this.formatDate(v) }
    ],
    rowActions: [{ icon: 'edit', iconSvg: 'assets/images/icons/edit.svg', label: 'Edit', action: 'edit' }],
    pagination: { pageSize: 25, pageIndex: 0, totalRecords: 0, pageSizeOptions: [10, 25, 50, 100] },
    sortConfig: { column: 'sortSequence', direction: 'default' },
    stickyHeader: true,
    enableSelection: false
  };

  private requestState: QcParametersFilterParams = {};

  constructor() {
    // Update empty message dynamically based on whether data has been retrieved
    effect(() => {
      this.tableConfig.emptyMessage = this.hasRetrievedSignal()
        ? 'No records found'
        : 'Select Type and Equipment Supply Code, then click RETRIEVE to load data';
    });
  }

  ngOnInit(): void {
    // Setup search subscriptions
    this.typeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.typeSearch.set(v || ''));
    this.equipmentSupplySearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.equipmentSupplySearch.set(v || ''));

    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Reset search when dropdown closes so all items show on next open */
  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  onTypeChange(type: string): void {
    this.selectedType = type;
    this.selectedEquipmentSupply = '';
    this.equipmentSupplyOptions.set([]);
    this.hasRetrievedSignal.set(false);
    this.dataSource.set([]);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = 0;
    }

    // Clear error when type is selected
    if (type) {
      this.typeError = '';
    }

    // Load equipment supply options based on selected type
    if (type) {
      this.driveEquipmentService.getEquipmentSupplyCodes(type).subscribe({
        next: (options) => {
          this.equipmentSupplyOptions.set(options);
        },
        error: () => {
          this.snackBar.open('Failed to load equipment supply options', 'DISMISS', { duration: 5000 });
        }
      });
    }
  }

  onEquipmentSupplyChange(value: string): void {
    this.selectedEquipmentSupply = value;
    if (value) {
      this.equipmentSupplyError = '';
    }
  }

  /**
   * Validates Type field and shows error if empty
   */
  validateType(): void {
    if (!this.selectedType) {
      this.typeError = 'Type is required';
    } else {
      this.typeError = '';
    }
  }

  /**
   * Validates Equipment Supply field and shows error if empty
   */
  validateEquipmentSupply(): void {
    if (!this.selectedEquipmentSupply) {
      this.equipmentSupplyError = 'Search is required';
    } else {
      this.equipmentSupplyError = '';
    }
  }

  loadData(): void {
    if (!this.hasRetrievedSignal()) return;

    this.isLoading.set(true);
    this.expandedRows.set(new Set()); // Clear expanded rows when loading new data
    const take = this.tableConfig.pagination?.pageSize || 25;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    this.driveEquipmentService.getQcParameters(take, skip, this.requestState).subscribe({
      next: (response) => {
        this.dataSource.set(response.data);
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.totalRecords = response.totalRecords;
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        // Handle 404 "No records found" as empty data, not an error
        if (error?.status === 404 || error?.statusCode === 404 ||
            error?.message?.toLowerCase().includes('no') && error?.message?.toLowerCase().includes('records found')) {
          this.dataSource.set([]);
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
          this.isLoading.set(false);
        } else {
          this.snackBar.open('Failed to load QC parameters', 'DISMISS', { duration: 5000 });
          this.isLoading.set(false);
        }
      }
    });
  }


  onRetrieve(): void {
    // Validate and show error messages
    let hasError = false;
    if (!this.selectedType) {
      this.typeError = 'Type is required';
      hasError = true;
    } else {
      this.typeError = '';
    }

    if (!this.selectedEquipmentSupply) {
      this.equipmentSupplyError = 'Search is required';
      hasError = true;
    } else {
      this.equipmentSupplyError = '';
    }

    if (hasError) {
      return;
    }

    this.requestState.deviceType = this.selectedType;
    this.requestState.equipmentSupply = this.selectedEquipmentSupply || undefined;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.hasRetrievedSignal.set(true);
    this.loadData();
  }

  onTableSearch(keyword: string): void {
    this.requestState.searchKeyword = keyword || undefined;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.loadData();
  }

  onPageChange(event: TablePageEvent | PageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onMatPaginatorChange(event: PageEvent): void {
    this.onPageChange(event as any);
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.requestState.sort = event.direction === 'default' ? undefined : event.direction;
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<QcParametersModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  openAddDialog(): void {
    this.sidePanelMode = 'add';
    // Pass selected type and equipment supply to pre-fill the form
    this.sidePanelData = {
      deviceType: this.selectedType,
      equipmentSupply: this.selectedEquipmentSupply,
      existingRecords: this.dataSource()
    } as any;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    this.loadData();
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  editRecord(record: QcParametersModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  toggleRow(index: number): void {
    const expanded = new Set(this.expandedRows());
    if (expanded.has(index)) {
      expanded.delete(index);
    } else {
      expanded.add(index);
    }
    this.expandedRows.set(expanded);
  }

  isRowExpanded(index: number): boolean {
    return this.expandedRows().has(index);
  }

  /**
   * Checks if a row is currently being edited
   * Uses composite key comparison to handle data reload (new object instances)
   */
  isRowHighlighted(row: QcParametersModel): boolean {
    if (this.sidePanelMode !== 'edit' || !this.sidePanelData) return false;
    const editData = this.sidePanelData as QcParametersModel;
    return editData.sortSequence === row.sortSequence &&
           editData.qcParameterCode === row.qcParameterCode;
  }

  /**
   * Opens the filter panel
   */
  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      return;
    }

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.filterAnchor)
      .withPositions([{
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 0
      }]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: '320px'
    });

    const portal = new ComponentPortal(QcParametersFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters();
    componentRef.instance.tableData = this.data();

    componentRef.instance.apply.subscribe((filters: QcParametersFilterParams) => {
      this.applyFilters(filters);
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });

    componentRef.instance.close.subscribe(() => {
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });

    this.overlayRef.backdropClick().subscribe(() => {
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });
  }

  /**
   * Applies filters from the filter panel
   */
  applyFilters(filters: QcParametersFilterParams): void {
    this.appliedFilters.set(filters);

    // Merge filters with existing request state
    this.requestState = {
      deviceType: this.requestState.deviceType,
      equipmentSupply: this.requestState.equipmentSupply,
      searchKeyword: this.requestState.searchKeyword,
      sort: this.requestState.sort,
      ...filters
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Removes a single filter chip
   */
  onRemoveFilterChip(key: string): void {
    const filters = { ...this.appliedFilters() };
    delete (filters as any)[key];
    this.applyFilters(filters);
  }

  /**
   * Clears all filters
   */
  clearAllFilters(): void {
    this.appliedFilters.set({});

    // Remove filter properties from requestState
    this.requestState = {
      deviceType: this.requestState.deviceType,
      equipmentSupply: this.requestState.equipmentSupply,
      searchKeyword: this.requestState.searchKeyword,
      sort: this.requestState.sort
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  /**
   * Checks if there are active filters
   */
  hasActiveFilters(): boolean {
    const filters = this.appliedFilters();
    return Object.keys(filters).some(key =>
      (filters as any)[key] !== undefined && (filters as any)[key] !== ''
    );
  }

  /**
   * Builds filter chips from applied filters
   */
  private buildFilterChips(): FilterChip[] {
    const chips: FilterChip[] = [];
    const filters = this.appliedFilters();

    if (filters.equipmentSupply) {
      chips.push({
        key: 'equipmentSupply',
        label: `Equipment/Supply: ${filters.equipmentSupply}`,
        value: filters.equipmentSupply,
        removable: true
      });
    }

    if (filters.qcParameterCode) {
      chips.push({
        key: 'qcParameterCode',
        label: `QC Parameter Code: ${filters.qcParameterCode}`,
        value: filters.qcParameterCode,
        removable: true
      });
    }

    if (filters.qcCheckCode) {
      chips.push({
        key: 'qcCheckCode',
        label: `QC Check Code: ${filters.qcCheckCode}`,
        value: filters.qcCheckCode,
        removable: true
      });
    }

    if (filters.dataType) {
      chips.push({
        key: 'dataType',
        label: `Data Type: ${filters.dataType}`,
        value: filters.dataType,
        removable: true
      });
    }

    if (filters.effDateFrom) {
      chips.push({
        key: 'effDateFrom',
        label: `Effective Date ≥ ${this.formatDateForChip(filters.effDateFrom)}`,
        value: filters.effDateFrom,
        removable: true
      });
    }

    if (filters.effDateTo) {
      chips.push({
        key: 'effDateTo',
        label: `Effective Date ≤ ${this.formatDateForChip(filters.effDateTo)}`,
        value: filters.effDateTo,
        removable: true
      });
    }

    if (filters.termDateFrom) {
      chips.push({
        key: 'termDateFrom',
        label: `Termination Date ≥ ${this.formatDateForChip(filters.termDateFrom)}`,
        value: filters.termDateFrom,
        removable: true
      });
    }

    if (filters.termDateTo) {
      chips.push({
        key: 'termDateTo',
        label: `Termination Date ≤ ${this.formatDateForChip(filters.termDateTo)}`,
        value: filters.termDateTo,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Formats date for filter chip display
   */
  private formatDateForChip(value: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Subscribe to chapter changes from header
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Close side panel and filter overlay
        this.closeSidePanel();
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
        }

        // Clear type and equipment supply selections
        this.selectedType = '';
        this.selectedEquipmentSupply = '';
        this.equipmentSupplyOptions.set([]);

        // Clear validation errors
        this.typeError = '';
        this.equipmentSupplyError = '';

        // Clear table state
        this.dataSource.set([]);
        this.hasRetrievedSignal.set(false);
        this.expandedRows.set(new Set());

        // Reset pagination
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }

        // Clear filters
        this.appliedFilters.set({});

        // Clear request state
        this.requestState = {};
      });
  }
}
