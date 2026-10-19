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
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { QcDependencyModel, QcDependencyFilterParams } from '../../models/drive-equipment-parameters.model';
import { AddEditQcDependency } from '../add-edit-qc-dependency/add-edit-qc-dependency';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { QcDependencyFilterPanel } from '../qc-dependency-filter-panel/qc-dependency-filter-panel';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-qc-dependency-table',
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
    DataTable,
    FilterChips,
    AddEditQcDependency
  ],
  templateUrl: './qc-dependency-table.html',
  styleUrls: ['./qc-dependency-table.scss']
})
export class QcDependencyTable implements OnInit, OnDestroy {
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef;
  @ViewChild('filterAnchor', { read: ElementRef }) filterAnchor!: ElementRef;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef;

  private readonly driveEquipmentService = inject(DriveEquipmentParametersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly overlay = inject(Overlay);
  private readonly headerService = inject(HeaderService);

  // State signals
  private dataSource = signal<QcDependencyModel[]>([]);
  private isLoading = signal<boolean>(false);
  private appliedFilters = signal<QcDependencyFilterParams>({});
  private equipmentSupplyOptions = signal<Array<{ code: string; description: string }>>([]);

  // Side panel signals
  private panelOpen = signal<boolean>(false);
  private panelMode = signal<'add' | 'edit'>('add');
  private panelData = signal<any>(null);

  sidePanelOpen = computed(() => this.panelOpen());
  sidePanelMode = computed(() => this.panelMode());
  sidePanelData = computed(() => this.panelData());

  selectedType = signal<string>('');
  selectedEquipmentSupply = signal<string>('');
  searchKeyword = signal<string>('');
  typeOptions = signal<string[]>(['EQUIP', 'SUPLY']);
  equipmentSupplyList = computed(() => this.equipmentSupplyOptions());

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

  // Validation state
  typeError = signal<string>('');
  equipmentSupplyError = signal<string>('');

  data = computed(() => this.dataSource());
  loading = computed(() => this.isLoading());
  filterChips = computed(() => this.buildFilterChips());
  isDataLoaded = computed(() => this.selectedType() !== '' && this.searchKeyword() !== '');

  private destroy$ = new Subject<void>();
  overlayRef: any = null;

  constructor() {
    // Update empty message dynamically based on whether data has been retrieved
    effect(() => {
      this.tableConfig.emptyMessage = this.isDataLoaded()
        ? 'No records found'
        : 'Select Type and Equipment Supply Code, then click RETRIEVE to load data';
    });
  }

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Source Param Code',
    minLength: 1,
    ariaLabel: 'Search QC dependencies',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<QcDependencyModel> = {
    columns: [
      { key: 'sourceParamCode', header: 'Source Param Code', sortable: true, width: '140px' },
      { key: 'sourceParamDescription', header: 'Source Param Code Description', sortable: false, width: '220px' },
      { key: 'dependentCode', header: 'Dependent Param Code', sortable: false, width: '160px' },
      { key: 'dependentDescription', header: 'Dependent Param Code Description', sortable: false, width: '220px' },
      { key: 'effectiveDate', header: 'Effective Date', sortable: false, width: '120px', valueFormatter: (v) => this.formatDate(v) },
      { key: 'terminationDate', header: 'Termination Date', sortable: false, width: '130px', valueFormatter: (v) => this.formatDate(v) },
      { key: 'modificationDate', header: 'Modification Date', sortable: false, width: '140px', valueFormatter: (v) => this.formatDate(v) }
    ],
    rowActions: [{ icon: 'edit', iconSvg: 'assets/images/icons/edit.svg', label: 'Edit', action: 'edit' }],
    pagination: { pageSize: 25, pageIndex: 0, totalRecords: 0, pageSizeOptions: [10, 25, 50, 100] },
    sortConfig: { column: 'sourceParamCode', direction: 'default' },
    stickyHeader: true,
    enableSelection: false
  };

  private requestState: QcDependencyFilterParams = {};

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
    this.selectedType.set(type);
    this.selectedEquipmentSupply.set('');
    this.equipmentSupplyOptions.set([]);
    this.searchKeyword.set('');
    this.dataSource.set([]);
    if (this.tableConfig.pagination) this.tableConfig.pagination.totalRecords = 0;

    // Clear errors when type is selected
    if (type) {
      this.typeError.set('');
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
    this.selectedEquipmentSupply.set(value);
    if (value) {
      this.equipmentSupplyError.set('');
    }
  }

  validateType(): void {
    if (!this.selectedType()) {
      this.typeError.set('Type is required');
    } else {
      this.typeError.set('');
    }
  }

  validateEquipmentSupply(): void {
    if (!this.selectedEquipmentSupply()) {
      this.equipmentSupplyError.set('Search is required');
    } else {
      this.equipmentSupplyError.set('');
    }
  }

  onRetrieve(): void {
    const type = this.selectedType();
    const equipmentSupply = this.selectedEquipmentSupply();

    // Validate and show error messages
    let hasError = false;
    if (!type) {
      this.typeError.set('Type is required');
      hasError = true;
    } else {
      this.typeError.set('');
    }

    if (!equipmentSupply) {
      this.equipmentSupplyError.set('Search is required');
      hasError = true;
    } else {
      this.equipmentSupplyError.set('');
    }

    if (hasError) {
      return;
    }

    this.searchKeyword.set(equipmentSupply);
    this.requestState.deviceType = type;
    this.requestState.equipmentSupplyCode = equipmentSupply;
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onTableSearch(keyword: string): void {
    this.requestState.searchKeyword = keyword || undefined;
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  loadData(): void {
    if (!this.selectedType() || !this.searchKeyword()) return;

    this.isLoading.set(true);
    const take = this.tableConfig.pagination?.pageSize || 10;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    this.driveEquipmentService.getQcDependencies(take, skip, this.requestState).subscribe({
      next: (response) => {
        this.dataSource.set(response.data);
        if (this.tableConfig.pagination) this.tableConfig.pagination.totalRecords = response.totalRecords;
        this.isLoading.set(false);
      },
      error: (error) => {
        // Handle 404 "No records found" as empty data, not an error
        if (error?.status === 404 || error?.statusCode === 404 ||
            error?.message?.toLowerCase().includes('no') && error?.message?.toLowerCase().includes('records found')) {
          this.dataSource.set([]);
          if (this.tableConfig.pagination) this.tableConfig.pagination.totalRecords = 0;
          this.isLoading.set(false);
        } else {
          this.snackBar.open('Failed to load QC dependencies', 'DISMISS', { duration: 5000 });
          this.isLoading.set(false);
        }
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

  onMatPaginatorChange(event: PageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.requestState.sort = event.direction === 'default' ? undefined : event.direction;
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<QcDependencyModel>): void {
    if (event.action === 'edit') this.editRecord(event.row);
  }

  /**
   * Opens the Add New QC Dependency side panel
   */
  addRecord(): void {
    const deviceType = this.selectedType() || 'EQUIP';
    const equipmentSupplyCode = this.selectedEquipmentSupply() || '';

    this.panelMode.set('add');
    this.panelData.set({
      mode: 'add',
      deviceType: deviceType,
      equipmentSupplyCode: equipmentSupplyCode,
      existingRecords: this.dataSource()
    } as any);
    this.panelOpen.set(true);
  }

  /**
   * Opens the Edit QC Dependency side panel
   */
  editRecord(record: QcDependencyModel): void {
    this.panelMode.set('edit');
    this.panelData.set({ mode: 'edit', record });
    this.panelOpen.set(true);
  }

  /**
   * Closes the side panel
   */
  closeSidePanel(): void {
    this.panelOpen.set(false);
    this.panelData.set(null);
  }

  /**
   * Handles successful save from side panel
   */
  onSaveSuccess(): void {
    this.loadData();
  }

  /**
   * Checks if a row is currently being edited
   * Uses auditKey comparison to handle data reload (new object instances)
   */
  isRowHighlighted(row: QcDependencyModel): boolean {
    const panelData = this.panelData();
    if (panelData?.mode !== 'edit') return false;
    return panelData.record?.auditKey !== undefined &&
           panelData.record.auditKey === row.auditKey;
  }

  openFilter(): void {
    if (this.overlayRef) { this.overlayRef.dispose(); this.overlayRef = null; return; }

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.filterAnchor)
      .withPositions([{ originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 0 }]);

    this.overlayRef = this.overlay.create({
      positionStrategy, hasBackdrop: true, backdropClass: 'cdk-overlay-transparent-backdrop', width: '320px'
    });

    const componentRef = this.overlayRef.attach(new ComponentPortal(QcDependencyFilterPanel));
    componentRef.instance.currentFilters = this.appliedFilters();
    componentRef.instance.tableData = this.data();
    componentRef.instance.apply.subscribe((filters: QcDependencyFilterParams) => {
      this.applyFilters(filters);
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });
    componentRef.instance.close.subscribe(() => { this.overlayRef?.dispose(); this.overlayRef = null; });
    this.overlayRef.backdropClick().subscribe(() => { this.overlayRef?.dispose(); this.overlayRef = null; });
  }

  applyFilters(filters: QcDependencyFilterParams): void {
    this.appliedFilters.set({
      ...filters,
      deviceType: this.selectedType(),
      equipmentSupplyCode: this.searchKeyword()
    });
    this.requestState = {
      ...this.requestState,
      ...filters,
      deviceType: this.selectedType(),
      equipmentSupplyCode: this.searchKeyword()
    };
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onRemoveFilterChip(key: string): void {
    const filters = { ...this.appliedFilters() };
    delete (filters as any)[key];
    this.applyFilters(filters);
  }

  clearAllFilters(): void {
    this.appliedFilters.set({
      deviceType: this.selectedType(),
      equipmentSupplyCode: this.searchKeyword()
    });
    this.requestState = {
      deviceType: this.selectedType(),
      equipmentSupplyCode: this.searchKeyword()
    };
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  hasActiveFilters(): boolean {
    const f = this.appliedFilters();
    return !!(f.sourceParamCode || f.dependentCode || f.effDateFrom || f.effDateTo || f.termDateFrom || f.termDateTo);
  }

  private buildFilterChips(): FilterChip[] {
    const chips: FilterChip[] = [];
    const f = this.appliedFilters();
    if (f.sourceParamCode) chips.push({ key: 'sourceParamCode', label: `Source Param Code: ${f.sourceParamCode}`, value: f.sourceParamCode, removable: true });
    if (f.dependentCode) chips.push({ key: 'dependentCode', label: `Dependent Param Code: ${f.dependentCode}`, value: f.dependentCode, removable: true });
    if (f.effDateFrom) chips.push({ key: 'effDateFrom', label: `Effective Date ≥ ${this.formatDateForChip(f.effDateFrom)}`, value: f.effDateFrom, removable: true });
    if (f.effDateTo) chips.push({ key: 'effDateTo', label: `Effective Date ≤ ${this.formatDateForChip(f.effDateTo)}`, value: f.effDateTo, removable: true });
    if (f.termDateFrom) chips.push({ key: 'termDateFrom', label: `Termination Date ≥ ${this.formatDateForChip(f.termDateFrom)}`, value: f.termDateFrom, removable: true });
    if (f.termDateTo) chips.push({ key: 'termDateTo', label: `Termination Date ≤ ${this.formatDateForChip(f.termDateTo)}`, value: f.termDateTo, removable: true });
    return chips;
  }

  private formatDateForChip(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
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
        this.selectedType.set('');
        this.selectedEquipmentSupply.set('');
        this.equipmentSupplyOptions.set([]);

        // Clear validation errors
        this.typeError.set('');
        this.equipmentSupplyError.set('');

        // Clear table data
        this.dataSource.set([]);
        this.searchKeyword.set('');

        // Reset pagination
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }

        // Clear request state
        this.requestState = {};
      });
  }
}
