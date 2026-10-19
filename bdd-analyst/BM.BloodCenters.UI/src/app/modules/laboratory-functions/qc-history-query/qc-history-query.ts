import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import moment from 'moment';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Moment } from 'moment';

import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { QcHistoryQueryService } from './services/qc-history-query.service';
import {
  QcHistoryDto,
  QcHistoryQueryDto,
  EquipmentTypeDropdownDto,
  EquipmentIdDropdownDto,
  EquipmentRefDropdownDto,
  QcStatusDropdownDto,
} from './models/qc-history-query.model';

@Component({
  selector: 'app-qc-history-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    DataTable,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
  ],
  templateUrl: './qc-history-query.html',
  styleUrls: ['./qc-history-query.scss'],
})
export class QcHistoryQueryComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly qcService = inject(QcHistoryQueryService);
  private readonly router = inject(Router);

  @ViewChild('equipTypeSelect') equipTypeSelect?: MatSelect;
  @ViewChild('equipIdSelect') equipIdSelect?: MatSelect;
  @ViewChild('equipRefSelect') equipRefSelect?: MatSelect;
  @ViewChild('qcStatusSelect') qcStatusSelect?: MatSelect;
  @ViewChild('viewActionTemplate', { static: true }) viewActionTemplate!: TemplateRef<unknown>;

  // Page header
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  // State
  isLoading = false;
  hasSearched = false;
  hasError = false;
  isRetrieved = false;
  dataSource: QcHistoryDto[] = [];

  // Search card form controls
  equipmentTypeControl = new FormControl<string | null>(null);
  equipmentIdControl = new FormControl<string | null>({ value: null, disabled: true });
  equipmentReferenceControl = new FormControl<string | null>({ value: null, disabled: true });
  qcStatusControl = new FormControl<string | null>(null);
  dateForm = new FormGroup({
    startDate: new FormControl<Moment | null>(null),
    endDate: new FormControl<Moment | null>(null),
  }, {
    validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('startDate', 'endDate')]
  });
  get startDateControl() { return this.dateForm.get('startDate') as FormControl<Moment | null>; }
  get endDateControl() { return this.dateForm.get('endDate') as FormControl<Moment | null>; }
  private lastChangedDateField: 'start' | 'end' | null = null;

  startDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getStartDateError()
  );
  endDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEndDateError()
  );

  // Dropdown search controls
  equipTypeSearchCtrl = new FormControl('');
  equipIdSearchCtrl = new FormControl('');
  equipRefSearchCtrl = new FormControl('');
  qcStatusSearchCtrl = new FormControl('');

  // Dropdown data
  isLoadingEquipTypes = false;
  isLoadingEquipIds = false;
  isLoadingEquipRefs = false;
  isLoadingQcStatuses = false;

  allEquipTypes = signal<EquipmentTypeDropdownDto[]>([]);
  allEquipIds = signal<EquipmentIdDropdownDto[]>([]);
  allEquipRefs = signal<EquipmentRefDropdownDto[]>([]);
  allQcStatuses = signal<QcStatusDropdownDto[]>([]);

  equipmentDescription = '';

  filteredEquipTypes = computed(() => {
    const q = (this.equipTypeSearchCtrl.value || '').toLowerCase();
    const items = this.allEquipTypes();
    return q
      ? items.filter(
          (o) =>
            o.equipType?.toLowerCase().includes(q) ||
            o.description?.toLowerCase().includes(q)
        )
      : items;
  });

  filteredEquipIds = computed(() => {
    const q = (this.equipIdSearchCtrl.value || '').toLowerCase();
    const items = this.allEquipIds();
    return q
      ? items.filter(
          (o) =>
            o.equipId?.toLowerCase().includes(q) ||
            o.equipReference?.toLowerCase().includes(q)
        )
      : items;
  });

  filteredEquipRefs = computed(() => {
    const q = (this.equipRefSearchCtrl.value || '').toLowerCase();
    const items = this.allEquipRefs();
    return q
      ? items.filter((o) => o.equipReference?.toLowerCase().includes(q))
      : items;
  });

  filteredQcStatuses = computed(() => {
    const q = (this.qcStatusSearchCtrl.value || '').toLowerCase();
    const items = this.allQcStatuses();
    return q
      ? items.filter(
          (o) =>
            o.code?.toLowerCase().includes(q) ||
            o.codeDesc?.toLowerCase().includes(q)
        )
      : items;
  });

  // Request state
  requestState: QcHistoryQueryDto = {
    sortColumn: null,
    sortOrder: null,
  };

  // Table config
  tableConfig: DataTableConfig<QcHistoryDto> = {
    columns: [
      { key: 'equipType', header: 'Equipment Type', sortable: false },
      { key: 'equipId', header: 'Equipment ID', sortable: false },
      { key: 'equipReference', header: 'Reference', sortable: false },
      {
        key: 'equipStatus',
        header: 'Status',
        sortable: false,
        valueFormatter: (v: string | null) => v || '',
      },
      { key: 'qcType', header: 'QC Type', sortable: false },
      {
        key: 'qcDate',
        header: 'QC Date',
        sortable: false,
        valueFormatter: (v: string | null) =>
          v ? DateFieldValidationUtility.formatDateTimeForUI(v) : '',
      },
      {
        key: 'qcTech1',
        header: 'QC Tech 1',
        sortable: false,
        valueFormatter: (v: string | null) => v || '',
      },
      {
        key: 'qcTech2',
        header: 'QC Tech 2',
        sortable: false,
        valueFormatter: (v: string | null) => v || '',
      },
      {
        key: 'qcStatusDesc',
        header: 'QC Status',
        sortable: false,
        valueFormatter: (v: string | null) => v || '',
      },
      { key: 'viewAction', header: '', width: '56px', sortable: false },
    ],
    pagination: {
      pageSize: 25,
      totalRecords: 0,
      pageIndex: 0,
      pageSizeOptions: [10, 25, 50, 100],
    },
    sortConfig: { column: '', direction: 'A' },
    emptyMessage: 'No QC history records found for the selected criteria.',
    noDataIcon: 'edit',
    showActionsAsMenu: false,
    enableRowHighlight: false,
  };

  // Date validation
  dateError = '';

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
          subtitle: pageData.subtitle || '',
        };
      }
    });

    // Reset active keyboard item when filtered dropdown options change (ngx-mat-select-search workaround)
    effect(() => {
      this.filteredEquipTypes();
      this.filteredEquipIds();
      this.filteredEquipRefs();
      this.filteredQcStatuses();
      requestAnimationFrame(() => {
        [
          this.equipTypeSelect,
          this.equipIdSelect,
          this.equipRefSelect,
          this.qcStatusSelect,
        ].forEach((s) => this.resetSelectActiveItem(s, 1));
      });
    });
  }

  ngOnInit(): void {
    this.restoreStateIfPresent();
    this.loadEquipmentTypes();
    this.loadQcStatuses();
    this.subscribeToChapterChanges();
    this.setupSearchControlListeners();
    this.subscribeDateChanges();
  }

  ngAfterViewInit(): void {
    const viewCol = this.tableConfig.columns.find(c => c.key === 'viewAction');
    if (viewCol) {
      viewCol.cellTemplate = this.viewActionTemplate;
    }
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

  // ── Dropdown search listeners ──

  private setupSearchControlListeners(): void {
    this.equipTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allEquipTypes.update((v) => [...v]));

    this.equipIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allEquipIds.update((v) => [...v]));

    this.equipRefSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allEquipRefs.update((v) => [...v]));

    this.qcStatusSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allQcStatuses.update((v) => [...v]));
  }

  // ── RETRIEVE / CLEAR ALL ──

  isDirtyAfterRetrieve = false;

  get isRetrieveDisabled(): boolean {
    return this.isLoading || (this.isRetrieved && !this.isDirtyAfterRetrieve);
  }

  get isClearAllDisabled(): boolean {
    return (
      !this.equipmentTypeControl.value &&
      !this.equipmentIdControl.value &&
      !this.equipmentReferenceControl.value &&
      !this.qcStatusControl.value &&
      !this.startDateControl.value &&
      !this.endDateControl.value &&
      !this.isRetrieved
    );
  }

  onViewQcDetails(row: QcHistoryDto): void {
    const restoreState = {
      equipmentType: this.equipmentTypeControl.value,
      equipmentId: this.equipmentIdControl.value,
      equipmentReference: this.equipmentReferenceControl.value,
      qcStatus: this.qcStatusControl.value,
      startDate: this.startDateControl.value?.toISOString() ?? null,
      endDate: this.endDateControl.value?.toISOString() ?? null,
      pageIndex: this.tableConfig.pagination!.pageIndex,
      pageSize: this.tableConfig.pagination!.pageSize,
      sortColumn: this.tableConfig.sortConfig?.column ?? '',
      sortDirection: this.tableConfig.sortConfig?.direction ?? 'A',
    };
    history.replaceState({ restoreState }, '');
    sessionStorage.setItem('qcHistoryQueryState', JSON.stringify(restoreState));

    this.router.navigate(
      ['/laboratory-functions/equipment-management/equipment-supervisory-functions/edit-reconcile-qc-details'],
      {
        queryParams: {
          equipType: row.equipType,
          equipId: row.equipId,
          equipRef: row.equipReference,
          qcRef: row.qcReference,
          from: 'qc-history-query',
        },
      }
    );
  }

  private restoreStateIfPresent(): void {
    let saved = (history.state as any)?.restoreState;
    if (!saved) {
      const stored = sessionStorage.getItem('qcHistoryQueryState');
      if (stored) {
        saved = JSON.parse(stored);
      }
    }
    if (!saved) return;
    sessionStorage.removeItem('qcHistoryQueryState');

    if (saved.equipmentType) {
      this.equipmentTypeControl.setValue(saved.equipmentType, { emitEvent: false });
      this.equipmentIdControl.enable({ emitEvent: false });
      this.loadEquipmentIds(saved.equipmentType);
    }
    if (saved.equipmentId) {
      this.equipmentIdControl.setValue(saved.equipmentId, { emitEvent: false });
      if (saved.equipmentType) {
        this.equipmentReferenceControl.enable({ emitEvent: false });
        this.loadEquipmentReferences(saved.equipmentType, saved.equipmentId);
      }
    }
    if (saved.equipmentReference) {
      this.equipmentReferenceControl.setValue(saved.equipmentReference, { emitEvent: false });
    }
    if (saved.qcStatus) {
      this.qcStatusControl.setValue(saved.qcStatus, { emitEvent: false });
    }
    if (saved.startDate) {
      const m = moment(saved.startDate);
      if (m.isValid()) this.startDateControl.setValue(m, { emitEvent: false });
    }
    if (saved.endDate) {
      const m = moment(saved.endDate);
      if (m.isValid()) this.endDateControl.setValue(m, { emitEvent: false });
    }

    this.tableConfig.pagination!.pageIndex = saved.pageIndex ?? 0;
    this.tableConfig.pagination!.pageSize = saved.pageSize ?? 25;
    this.tableConfig.sortConfig = {
      column: saved.sortColumn || '',
      direction: saved.sortDirection || 'A',
    };

    this.requestState = {
      equipmentType: saved.equipmentType || undefined,
      equipmentId: saved.equipmentId || undefined,
      equipmentReference: saved.equipmentReference || undefined,
      qcStatus: saved.qcStatus || undefined,
      startDate: saved.startDate
        ? DateFieldValidationUtility.serializeDateForApi(moment(saved.startDate))
        : undefined,
      endDate: saved.endDate
        ? DateFieldValidationUtility.serializeDateForApi(moment(saved.endDate))
        : undefined,
      sortColumn: saved.sortColumn || null,
      sortOrder: saved.sortDirection === 'D' ? 'DESC' : saved.sortDirection === 'A' ? 'ASC' : null,
    };

    this.isRetrieved = true;
    this.hasSearched = true;

    history.replaceState({}, '');
    this.loadTableData();
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;

    if (this.hasDateErrors) return;

    this.isRetrieved = true;
    this.isDirtyAfterRetrieve = false;
    this.hasSearched = true;
    this.requestState = {
      ...this.requestState,
      equipmentType: this.equipmentTypeControl.value || undefined,
      equipmentId: this.equipmentIdControl.value || undefined,
      equipmentReference: this.equipmentReferenceControl.value || undefined,
      qcStatus: this.qcStatusControl.value || undefined,
      startDate: this.startDateControl.value
        ? DateFieldValidationUtility.serializeDateForApi(
            this.startDateControl.value
          )
        : undefined,
      endDate: this.endDateControl.value
        ? DateFieldValidationUtility.serializeDateForApi(
            this.endDateControl.value
          )
        : undefined,
    };
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadTableData();
  }

  onClearAll(): void {
    this.equipmentTypeControl.setValue(null, { emitEvent: false });
    this.equipmentIdControl.setValue(null, { emitEvent: false });
    this.equipmentReferenceControl.setValue(null, { emitEvent: false });
    this.qcStatusControl.setValue(null, { emitEvent: false });
    this.dateForm.reset({ startDate: null, endDate: null }, { emitEvent: false });
    this.lastChangedDateField = null;

    this.equipmentDescription = '';
    this.allEquipIds.set([]);
    this.allEquipRefs.set([]);
    this.equipmentIdControl.disable({ emitEvent: false });
    this.equipmentReferenceControl.disable({ emitEvent: false });

    this.isRetrieved = false;
    this.isDirtyAfterRetrieve = false;
    this.hasSearched = false;
    this.hasError = false;
    this.dataSource = [];
    this.tableConfig.pagination!.totalRecords = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.requestState = { sortColumn: null, sortOrder: null };
  }

  // ── Cascading dropdowns ──

  private subscribeDateChanges(): void {
    this.startDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'start';
        this.dateForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        this.markDirty();
      });
    this.endDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'end';
        this.dateForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        this.markDirty();
      });
  }

  private markDirty(): void {
    if (this.isRetrieved) this.isDirtyAfterRetrieve = true;
  }

  onEquipmentTypeChange(value: string | null): void {
    this.markDirty();
    this.equipmentIdControl.setValue(null, { emitEvent: false });
    this.equipmentReferenceControl.setValue(null, { emitEvent: false });
    this.allEquipIds.set([]);
    this.allEquipRefs.set([]);

    if (value) {
      const selected = this.allEquipTypes().find(
        (t) => t.equipType === value
      );
      this.equipmentDescription = selected?.description || '';
      this.equipmentIdControl.enable({ emitEvent: false });
      this.equipmentReferenceControl.disable({ emitEvent: false });
      this.loadEquipmentIds(value);
    } else {
      this.equipmentDescription = '';
      this.equipmentIdControl.disable({ emitEvent: false });
      this.equipmentReferenceControl.disable({ emitEvent: false });
    }
  }

  onEquipmentIdChange(value: string | null): void {
    this.markDirty();
    this.equipmentReferenceControl.setValue(null, { emitEvent: false });
    this.allEquipRefs.set([]);

    if (value && this.equipmentTypeControl.value) {
      this.equipmentReferenceControl.enable({ emitEvent: false });
      const allIds = this.allEquipIds();
      const matchingRecords = allIds.filter((r) => r.equipId === value);

      if (matchingRecords.length === 1) {
        this.equipmentReferenceControl.setValue(
          matchingRecords[0].equipReference,
          { emitEvent: false }
        );
        this.allEquipRefs.set([
          {
            equipReference: matchingRecords[0].equipReference,
            serviceDates: matchingRecords[0].serviceDates,
          },
        ]);
      } else {
        this.loadEquipmentReferences(
          this.equipmentTypeControl.value,
          value
        );
      }
    } else {
      this.equipmentReferenceControl.disable({ emitEvent: false });
    }
  }

  onEquipmentReferenceChange(_value: string | null): void {
    this.markDirty();
  }

  onQcStatusChange(_value: string | null): void {
    this.markDirty();
  }

  // ── Date validation ──

  onStartDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.startDateControl
    );
  }

  onEndDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.endDateControl
    );
  }

  getStartDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.startDateControl, 'Start Date', 'End Date',
      this.lastChangedDateField === 'start' ? this.dateForm.errors : null
    );
  }

  getEndDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.endDateControl, 'End Date', 'Start Date',
      this.lastChangedDateField === 'end' ? this.dateForm.errors : null
    );
  }

  get hasDateErrors(): boolean {
    return this.getStartDateError() !== '' || this.getEndDateError() !== '';
  }

  // ── Data loading ──

  private loadEquipmentTypes(): void {
    this.isLoadingEquipTypes = true;
    this.qcService
      .getEquipmentTypes()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingEquipTypes = false))
      )
      .subscribe({
        next: (data) => {
          this.allEquipTypes.set(data);
          if (this.equipmentTypeControl.value) {
            const selected = data.find(t => t.equipType === this.equipmentTypeControl.value);
            if (selected) this.equipmentDescription = selected.description;
          }
        },
        error: () => this.allEquipTypes.set([]),
      });
  }

  private loadEquipmentIds(equipmentType: string): void {
    this.isLoadingEquipIds = true;
    this.qcService
      .getEquipmentIds(equipmentType)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingEquipIds = false))
      )
      .subscribe({
        next: (data) => this.allEquipIds.set(data),
        error: () => this.allEquipIds.set([]),
      });
  }

  private loadEquipmentReferences(
    equipmentType: string,
    equipmentId: string
  ): void {
    this.isLoadingEquipRefs = true;
    this.qcService
      .getEquipmentReferences(equipmentType, equipmentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingEquipRefs = false))
      )
      .subscribe({
        next: (data) => this.allEquipRefs.set(data),
        error: () => this.allEquipRefs.set([]),
      });
  }

  private loadQcStatuses(): void {
    this.isLoadingQcStatuses = true;
    this.qcService
      .getQcStatuses()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingQcStatuses = false))
      )
      .subscribe({
        next: (data) => this.allQcStatuses.set(data),
        error: () => this.allQcStatuses.set([]),
      });
  }

  loadTableData(): void {
    if (!this.hasSearched) return;

    this.isLoading = true;
    this.hasError = false;

    const take = this.tableConfig.pagination!.pageSize;
    const skip =
      this.tableConfig.pagination!.pageIndex *
      this.tableConfig.pagination!.pageSize;

    this.qcService
      .getList(take, skip, this.requestState)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;
        },
        error: () => {
          this.hasError = true;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        },
      });
  }

  // ── Table events ──

  onSortChange(event: TableSortEvent): void {
    const sortColumnMap: Record<string, string> = {
      equipType: 'EquipType',
      equipId: 'EquipId',
      equipReference: 'EquipReference',
      equipStatus: 'EquipStatus',
      qcType: 'QcType',
      qcDate: 'QcDate',
      qcTech1: 'QcTech1',
      qcTech2: 'QcTech2',
      qcStatusDesc: 'QcStatusDesc',
    };

    this.tableConfig.sortConfig = {
      column: event.column,
      direction: event.direction,
    };
    this.requestState.sortColumn =
      event.direction === 'default'
        ? null
        : sortColumnMap[event.column] || event.column;
    this.requestState.sortOrder =
      event.direction === 'default'
        ? null
        : event.direction === 'D'
          ? 'DESC'
          : 'ASC';
    this.loadTableData();
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.loadTableData();
  }

  // ── Chapter change ──

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.allEquipTypes.set([]);
        this.allQcStatuses.set([]);
        this.loadEquipmentTypes();
        this.loadQcStatuses();
      });
  }

  // ── Select opened handlers ──

  onSelectOpened(opened: boolean, selectRef?: MatSelect): void {
    if (opened && selectRef) {
      this.resetSelectActiveItem(selectRef, -1);
    }
  }

  // ngx-mat-select-search requires resetting the CDK ListKeyManager active item
  // when filtered options change. No public API exists for this — using internal
  // _keyManager is the documented workaround (see ngx-mat-select-search README).
  private resetSelectActiveItem(select: MatSelect | undefined, index: number): void {
    if (!select?.panelOpen) return;
    try {
      (select as unknown as { _keyManager?: { setActiveItem(i: number): void } })
        ._keyManager?.setActiveItem(index);
    } catch {
      // CDK internal API changed — dropdown still works, just loses keyboard highlight
    }
  }
}
