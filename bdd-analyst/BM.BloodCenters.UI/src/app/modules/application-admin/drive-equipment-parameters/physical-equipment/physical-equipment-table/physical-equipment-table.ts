import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { PhysicalEquipmentModel, PhysicalEquipmentFilterParams } from '../../models/drive-equipment-parameters.model';
import { PhysicalEquipmentFilterPanel } from '../physical-equipment-filter-panel/physical-equipment-filter-panel';
import { AddEditPhysicalEquipment } from '../add-edit-physical-equipment/add-edit-physical-equipment';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-physical-equipment-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    OverlayModule,
    DataTable,
    SearchBar,
    FilterChips,
    AddEditPhysicalEquipment
  ],
  templateUrl: './physical-equipment-table.html',
  styleUrls: ['./physical-equipment-table.scss']
})
export class PhysicalEquipmentTable implements OnInit, OnDestroy {
  @ViewChild('filterButton', { read: ElementRef }) filterButton!: ElementRef;
  @ViewChild('filterAnchor', { read: ElementRef }) filterAnchor!: ElementRef;
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef;

  private readonly driveEquipmentService = inject(DriveEquipmentParametersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly overlay = inject(Overlay);
  private readonly headerService = inject(HeaderService);

  private destroy$ = new Subject<void>();

  private dataSource = signal<PhysicalEquipmentModel[]>([]);
  private isLoading = signal<boolean>(false);
  private appliedFilters = signal<PhysicalEquipmentFilterParams>({});

  // Side panel signals
  private panelOpen = signal<boolean>(false);
  private panelMode = signal<'add' | 'edit'>('add');
  private panelData = signal<any>(null);

  sidePanelOpen = computed(() => this.panelOpen());
  sidePanelMode = computed(() => this.panelMode());
  sidePanelData = computed(() => this.panelData());

  highlightedRecord = computed(() => {
    const data = this.panelData();
    return data?.record || null;
  });

  data = computed(() => this.dataSource());
  loading = computed(() => this.isLoading());
  filterChips = computed(() => this.buildFilterChips());

  overlayRef: any = null;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Physical Code or Equipment Type',
    minLength: 2,
    ariaLabel: 'Search physical equipment',
    searchOnEnterOnly: true
  };

  tableConfig: DataTableConfig<PhysicalEquipmentModel> = {
    columns: [
      { key: 'physicalCode', header: 'Physical Code', sortable: true, width: '120px' },
      { key: 'physicalCodeDescription', header: 'Physical Code Description', width: '200px' },
      { key: 'equipmentType', header: 'Equipment Type', width: '130px' },
      { key: 'equipmentTypeDescription', header: 'Equipment Type Description', width: '280px' },
      { key: 'effectiveDate', header: 'Effective Date', width: '120px', valueFormatter: (v) => this.formatDate(v) },
      { key: 'terminationDate', header: 'Termination Date', width: '130px', valueFormatter: (v) => this.formatDate(v) }
    ],
    rowActions: [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit',
        action: 'edit'
      }
    ],
    pagination: { pageSize: 25, pageIndex: 0, totalRecords: 0, pageSizeOptions: [10, 25, 50, 100] },
    sortConfig: { column: 'physicalCode', direction: 'default' },
    stickyHeader: true,
    enableSelection: false
  };

  private requestState: PhysicalEquipmentFilterParams = {};

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading.set(true);
    const take = this.tableConfig.pagination?.pageSize || 10;
    const skip = (this.tableConfig.pagination?.pageIndex || 0) * take;

    this.driveEquipmentService.getPhysicalEquipment(take, skip, this.requestState).subscribe({
      next: (response) => {
        this.dataSource.set(response.data || []);
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.totalRecords = response.totalRecords || 0;
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.dataSource.set([]);
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.totalRecords = 0;
        }
        this.isLoading.set(false);
      }
    });
  }

  onSearch(keyword: string): void {
    this.requestState.searchKeyword = keyword || undefined;
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
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
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.requestState.sort = event.direction === 'default' ? undefined : event.direction as string;
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<PhysicalEquipmentModel>): void {
    if (event.action === 'edit') {
      this.editRecord(event.row);
    }
  }

  addRecord(): void {
    this.panelMode.set('add');
    this.panelData.set({ mode: 'add' });
    this.panelOpen.set(true);
  }

  editRecord(record: PhysicalEquipmentModel): void {
    this.panelMode.set('edit');
    this.panelData.set({ mode: 'edit', record });
    this.panelOpen.set(true);
  }

  closeSidePanel(): void {
    this.panelOpen.set(false);
    this.panelData.set(null);
  }

  onSaveSuccess(): void {
    this.closeSidePanel();
    if (this.panelMode() === 'add') {
      this.resetSortAndPagination();
    }
    this.loadData();
  }

  onRefreshData(): void {
    this.resetSortAndPagination();
    this.loadData();
  }

  private resetSortAndPagination(): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = 'physicalCode';
      this.tableConfig.sortConfig.direction = 'default';
    }
    this.requestState.sort = undefined;
  }

  openFilter(): void {
    if (this.overlayRef) { this.overlayRef.dispose(); this.overlayRef = null; return; }

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.filterAnchor)
      .withPositions([{ originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 0 }]);

    this.overlayRef = this.overlay.create({
      positionStrategy, hasBackdrop: true, backdropClass: 'cdk-overlay-transparent-backdrop', width: '320px'
    });

    const componentRef = this.overlayRef.attach(new ComponentPortal(PhysicalEquipmentFilterPanel));
    componentRef.instance.currentFilters = this.appliedFilters();
    componentRef.instance.apply.subscribe((filters: PhysicalEquipmentFilterParams) => {
      this.applyFilters(filters);
      this.overlayRef?.dispose();
      this.overlayRef = null;
    });
    componentRef.instance.close.subscribe(() => { this.overlayRef?.dispose(); this.overlayRef = null; });
    this.overlayRef.backdropClick().subscribe(() => { this.overlayRef?.dispose(); this.overlayRef = null; });
  }

  applyFilters(filters: PhysicalEquipmentFilterParams): void {
    this.appliedFilters.set(filters);
    this.requestState = { ...this.requestState, ...filters };
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onRemoveFilterChip(key: string): void {
    const filters = { ...this.appliedFilters() };
    delete (filters as any)[key];
    this.applyFilters(filters);
  }

  clearAllFilters(): void {
    this.appliedFilters.set({});
    this.requestState = { searchKeyword: this.requestState.searchKeyword, sort: this.requestState.sort };
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  hasActiveFilters(): boolean {
    const f = this.appliedFilters();
    return !!(f.effDateFrom || f.effDateTo || f.termDateFrom || f.termDateTo);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeSidePanel();
        this.dataSource.set([]);
        if (this.tableConfig.pagination) {
          this.tableConfig.pagination.pageIndex = 0;
          this.tableConfig.pagination.totalRecords = 0;
        }
        this.loadData();
      });
  }

  private buildFilterChips(): FilterChip[] {
    const chips: FilterChip[] = [];
    const f = this.appliedFilters();
    if (f.effDateFrom) chips.push({ key: 'effDateFrom', label: `Effective Date ≥ ${this.formatDate(f.effDateFrom)}`, value: f.effDateFrom, removable: true });
    if (f.effDateTo) chips.push({ key: 'effDateTo', label: `Effective Date ≤ ${this.formatDate(f.effDateTo)}`, value: f.effDateTo, removable: true });
    if (f.termDateFrom) chips.push({ key: 'termDateFrom', label: `Termination Date ≥ ${this.formatDate(f.termDateFrom)}`, value: f.termDateFrom, removable: true });
    if (f.termDateTo) chips.push({ key: 'termDateTo', label: `Termination Date ≤ ${this.formatDate(f.termDateTo)}`, value: f.termDateTo, removable: true });
    return chips;
  }

  private formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }
}
