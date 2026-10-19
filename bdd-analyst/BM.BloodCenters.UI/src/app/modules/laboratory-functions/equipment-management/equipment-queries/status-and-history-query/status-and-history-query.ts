import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import {
  DataTableConfig,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { formatTableDate } from '@shared/utils/date-format.util';

import {
  EquipmentStatusItem,
  EquipmentStatusQueryDto,
  EquipmentLookupDto,
  EquipmentIdLookupDto,
} from './models/status-and-history-query.model';
import { EquipmentStatusQueryApiService } from './services/equipment-status-query-api.service';
import { EquipmentStatisticsPanel } from './equipment-statistics-panel/equipment-statistics-panel';
import { EquipmentDetailsView } from './equipment-details-view/equipment-details-view';

@Component({
  selector: 'app-status-and-history-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    DataTable,
    PageHeaderWithBreadcrumb,
    EquipmentStatisticsPanel,
    EquipmentDetailsView,
  ],
  templateUrl: './status-and-history-query.html',
  styleUrls: ['./status-and-history-query.scss'],
})
export class StatusAndHistoryQueryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly apiService = inject(EquipmentStatusQueryApiService);

  @ViewChild('equipTypeSelect') equipTypeSelect?: MatSelect;
  @ViewChild('equipIdSelect') equipIdSelect?: MatSelect;
  @ViewChild('statusSelect') statusSelect?: MatSelect;

  // ── Page header ──────────────────────────────────────────────────────────────

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: 'Status and History Query',
    subtitle: 'View equipment status and history, filtered by type, machine ID, reference number, or status code.',
  };

  // ── State ────────────────────────────────────────────────────────────────────

  isLoading = false;
  hasSearched = false;
  hasError = false;
  isRetrieved = false;
  isDirtyAfterRetrieve = false;
  dataSource: EquipmentStatusItem[] = [];

  isStatsPanelOpen = false;
  statsPanelRow: EquipmentStatusItem | null = null;

  isDetailsViewOpen = false;
  detailsRow: EquipmentStatusItem | null = null;

  // ── Form controls ────────────────────────────────────────────────────────────

  equipmentTypeControl = new FormControl<string | null>(null);
  equipmentIdControl = new FormControl<string | null>({ value: null, disabled: true });
  statusControl = new FormControl<string | null>(null);

  // ── Dropdown search controls ─────────────────────────────────────────────────

  equipTypeSearchCtrl = new FormControl('');
  equipIdSearchCtrl = new FormControl('');
  statusSearchCtrl = new FormControl('');

  // ── Dropdown loading flags ────────────────────────────────────────────────────

  isLoadingEquipTypes = false;
  isLoadingEquipIds = false;
  isLoadingStatuses = false;

  // ── Dropdown data (signals) ───────────────────────────────────────────────────

  allEquipTypes = signal<EquipmentLookupDto[]>([]);
  allEquipIds = signal<EquipmentIdLookupDto[]>([]);
  allStatuses = signal<EquipmentLookupDto[]>([]);

  equipmentDescription = '';
  equipmentReferenceNo = '';

  filteredEquipTypes = computed(() => {
    const q = (this.equipTypeSearchCtrl.value || '').toLowerCase();
    const items = this.allEquipTypes();
    return q
      ? items.filter(
          (o) =>
            o.code?.toLowerCase().includes(q) ||
            o.description?.toLowerCase().includes(q),
        )
      : items;
  });

  filteredEquipIds = computed(() => {
    const q = (this.equipIdSearchCtrl.value || '').toLowerCase();
    const items = this.allEquipIds();
    return q
      ? items.filter(
          (o) =>
            o.code?.toLowerCase().includes(q) ||
            o.reference?.toLowerCase().includes(q),
        )
      : items;
  });

  filteredStatuses = computed(() => {
    const q = (this.statusSearchCtrl.value || '').toLowerCase();
    const items = this.allStatuses();
    return q
      ? items.filter(
          (o) =>
            o.code?.toLowerCase().includes(q) ||
            o.description?.toLowerCase().includes(q),
        )
      : items;
  });

  // ── Request state ─────────────────────────────────────────────────────────────

  requestState: EquipmentStatusQueryDto = {
    sortColumn: null,
    sortOrder: null,
  };

  // ── Table config ──────────────────────────────────────────────────────────────

  tableConfig: DataTableConfig<EquipmentStatusItem> = {
    columns: [
      { key: 'equipType', header: 'Equipment Type', sortable: false },
      { key: 'equipId', header: 'Equipment ID', sortable: false },
      { key: 'equipReference', header: 'Reference', sortable: false },
      { key: 'serialNumber', header: 'Serial No.', sortable: false },
      { key: 'location', header: 'Location', sortable: false },
      {
        key: 'statusDescription',
        header: 'Status',
        sortable: false,
        valueFormatter: (v: string | null) => v || '',
      },
      {
        key: 'firstProductionDate',
        header: 'Production Date In',
        sortable: false,
        valueFormatter: (v: string | null) => formatTableDate(v),
      },
      {
        key: 'lastProductionDate',
        header: 'Production Date Out',
        sortable: false,
        valueFormatter: (v: string | null) => formatTableDate(v),
      },
    ],
    rowActions: [
      { label: 'Equipment Details', action: 'details' },
      { label: 'Equipment Statistics', action: 'statistics' },
    ],
    showActionsAsMenu: true,
    sortConfig: { column: '', direction: 'A' },
    emptyMessage: 'No equipment records found for the selected criteria.',
    noDataIcon: 'search',
    enableRowHighlight: false,
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'View equipment status and history, filtered by type, machine ID, reference number, or status code.',
        };
      }
    });

    effect(() => {
      this.filteredEquipTypes();
      this.filteredEquipIds();
      this.filteredStatuses();
      requestAnimationFrame(() => {
        [
          this.equipTypeSelect,
          this.equipIdSelect,
          this.statusSelect,
        ].forEach((s) => this.resetSelectActiveItem(s, 1));
      });
    });
  }

  ngOnInit(): void {
    this.loadEquipmentTypes();
    this.loadStatuses();
    this.setupSearchControlListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.altKey && event.key === 's') {
      event.preventDefault();
      if (!this.isRetrieveDisabled) this.onRetrieve();
    }
  }

  // ── Dropdown search listeners ──────────────────────────────────────────────────

  private setupSearchControlListeners(): void {
    this.equipTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allEquipTypes.update((v) => [...v]));

    this.equipIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allEquipIds.update((v) => [...v]));

    this.statusSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allStatuses.update((v) => [...v]));
  }

  // ── RETRIEVE / CLEAR ALL ──────────────────────────────────────────────────────

  get isRetrieveDisabled(): boolean {
    const hasFilters = !!this.equipmentTypeControl.value || !!this.statusControl.value;
    return this.isLoading || !hasFilters || (this.isRetrieved && !this.isDirtyAfterRetrieve);
  }

  get isClearAllDisabled(): boolean {
    return (
      !this.equipmentTypeControl.value &&
      !this.equipmentIdControl.value &&
      !this.equipmentReferenceNo &&
      !this.statusControl.value &&
      !this.isRetrieved
    );
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;

    this.isRetrieved = true;
    this.isDirtyAfterRetrieve = false;
    this.hasSearched = true;
    this.requestState = {
      ...this.requestState,
      equipmentType: this.equipmentTypeControl.value || undefined,
      equipmentId: this.equipmentIdControl.value || undefined,
      reference: this.equipmentReferenceNo || undefined,
      status: this.statusControl.value || undefined,
    };
    this.loadTableData();
  }

  onClearAll(): void {
    this.equipmentTypeControl.setValue(null, { emitEvent: false });
    this.equipmentIdControl.setValue(null, { emitEvent: false });
    this.statusControl.setValue(null, { emitEvent: false });

    this.equipmentDescription = '';
    this.equipmentReferenceNo = '';
    this.allEquipIds.set([]);
    this.equipmentIdControl.disable({ emitEvent: false });

    this.isRetrieved = false;
    this.isDirtyAfterRetrieve = false;
    this.hasSearched = false;
    this.hasError = false;
    this.dataSource = [];
    this.requestState = { sortColumn: null, sortOrder: null };
  }

  // ── Cascading dropdowns ────────────────────────────────────────────────────────

  onEquipmentTypeChange(value: string | null): void {
    this.markDirty();
    this.equipmentIdControl.setValue(null, { emitEvent: false });
    this.equipmentReferenceNo = '';
    this.allEquipIds.set([]);

    if (value) {
      const selected = this.allEquipTypes().find((t) => t.code === value);
      this.equipmentDescription = selected?.description || '';
      this.equipmentIdControl.enable({ emitEvent: false });
      this.loadEquipmentIds(value);
    } else {
      this.equipmentDescription = '';
      this.equipmentIdControl.disable({ emitEvent: false });
    }
  }

  onEquipmentIdChange(value: string | null): void {
    this.markDirty();
    this.equipmentReferenceNo = '';

    if (value) {
      const match = this.allEquipIds().find((r) => r.code === value);
      this.equipmentReferenceNo = match?.reference ?? '';
    }
  }

  onStatusChange(_value: string | null): void {
    this.markDirty();
  }

  private markDirty(): void {
    if (this.isRetrieved) this.isDirtyAfterRetrieve = true;
  }

  // ── API data loading ──────────────────────────────────────────────────────────

  private loadEquipmentTypes(): void {
    this.isLoadingEquipTypes = true;
    this.apiService.getEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.allEquipTypes.set(res.data ?? []);
          this.isLoadingEquipTypes = false;
        },
        error: () => {
          this.allEquipTypes.set([]);
          this.isLoadingEquipTypes = false;
        },
      });
  }

  private loadEquipmentIds(equipmentType: string): void {
    this.isLoadingEquipIds = true;
    this.apiService.getEquipmentIds(equipmentType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.allEquipIds.set(res.data ?? []);
          this.isLoadingEquipIds = false;
        },
        error: () => {
          this.allEquipIds.set([]);
          this.isLoadingEquipIds = false;
        },
      });
  }

  private loadStatuses(): void {
    this.isLoadingStatuses = true;
    this.apiService.getEquipmentStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.allStatuses.set(res.data ?? []);
          this.isLoadingStatuses = false;
        },
        error: () => {
          this.allStatuses.set([]);
          this.isLoadingStatuses = false;
        },
      });
  }

  loadTableData(): void {
    if (!this.hasSearched) return;
    this.isLoading = true;
    this.hasError = false;

    this.apiService.getEquipmentList(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dataSource = res.data ?? [];
          this.isLoading = false;
        },
        error: () => {
          this.dataSource = [];
          this.hasError = true;
          this.isLoading = false;
        },
      });
  }

  // ── Table events ───────────────────────────────────────────────────────────────

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig = { column: event.column, direction: event.direction };
    this.requestState.sortColumn = event.direction === 'default' ? null : event.column;
    this.requestState.sortOrder =
      event.direction === 'default' ? null : event.direction === 'D' ? 'DESC' : 'ASC';
    this.loadTableData();
  }

  onRowAction(event: TableRowActionEvent<EquipmentStatusItem>): void {
    switch (event.action) {
      case 'details':
        this.openEquipmentDetails(event.row);
        break;
      case 'statistics':
        this.openEquipmentStatistics(event.row);
        break;
    }
  }

  openEquipmentDetails(row: EquipmentStatusItem): void {
    this.detailsRow = row;
    this.isDetailsViewOpen = true;
    this.isStatsPanelOpen = false;
  }

  closeDetailsView(): void {
    this.isDetailsViewOpen = false;
    this.detailsRow = null;
  }

  openEquipmentStatistics(row: EquipmentStatusItem): void {
    this.statsPanelRow = row;
    this.isStatsPanelOpen = true;
  }

  closeStatisticsPanel(): void {
    this.isStatsPanelOpen = false;
    this.statsPanelRow = null;
  }

  // ── Select helpers ─────────────────────────────────────────────────────────────

  onSelectOpened(opened: boolean, selectRef?: MatSelect): void {
    if (opened && selectRef) {
      this.resetSelectActiveItem(selectRef, -1);
    }
  }

  private resetSelectActiveItem(select: MatSelect | undefined, index: number): void {
    if (!select?.panelOpen) return;
    try {
      (select as unknown as { _keyManager?: { setActiveItem(i: number): void } })
        ._keyManager?.setActiveItem(index);
    } catch {
      // CDK internal API changed — dropdown still works
    }
  }
}
