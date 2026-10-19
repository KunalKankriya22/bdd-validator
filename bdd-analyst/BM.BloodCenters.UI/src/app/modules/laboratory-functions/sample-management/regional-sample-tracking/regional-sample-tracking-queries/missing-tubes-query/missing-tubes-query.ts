import { Component, OnInit, AfterViewInit, OnDestroy, signal, computed, effect, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableColumn,
} from '@shared/interfaces/data-table.interface';

import { MissingTubesQueryApiService } from './services/missing-tubes-query-api.service';
import {
  ContractOption,
  BatchOption,
  MissingReasonCode,
  MissingTubeUnit,
} from './models/missing-tubes-query.model';

@Component({
  selector: 'app-missing-tubes-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './missing-tubes-query.html',
  styleUrl: './missing-tubes-query.scss',
})
export class MissingTubesQueryComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly apiService = inject(MissingTubesQueryApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('tubeFlagCell') tubeFlagCellTemplate!: TemplateRef<any>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  filterForm: FormGroup = this.fb.group({
    contractId: ['', Validators.required],
    batchId: ['', Validators.required],
  });

  // Dropdown options
  contractOptions = signal<ContractOption[]>([]);
  batchOptions = signal<BatchOption[]>([]);
  missingReasons = signal<MissingReasonCode[]>([]);

  // Search controls for searchable dropdowns
  contractSearchCtrl = new FormControl('');
  batchSearchCtrl = new FormControl('');

  // Search text signals
  contractSearch = signal('');
  batchSearch = signal('');

  // Filtered dropdown options
  filteredContracts = computed(() => this.filterContractOptions(this.contractOptions(), this.contractSearch()));
  filteredBatches = computed(() => this.filterBatchOptions(this.batchOptions(), this.batchSearch()));

  // Display fields from main query response
  description = signal('-');
  unitsInBatch = signal('-');
  unitsMissingTubes = signal('-');

  // Loading states
  isLoadingContracts = false;
  isLoadingBatches = false;
  isLoading = false;
  hasSearched = false;

  // Results
  units: MissingTubeUnit[] = [];
  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  sortColumn = 'UnitId';
  sortOrder = 'ASC';

  // Data table configuration
  tableConfig: DataTableConfig<MissingTubeUnit> = {
    columns: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'unitId',
      direction: 'A',
    },
    stickyHeader: true,
    emptyMessage: 'No Units Found',
    emptySubMessage: 'No units with missing tubes match the specified criteria.',
    noDataIcon: 'search_off',
    caption: 'Missing tubes query results',
    rowLabelKey: 'unitId',
  };

  ngOnInit(): void {
    this.loadContracts();
    this.loadMissingReasons();

    this.contractSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.contractSearch.set(v || ''));

    this.batchSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.batchSearch.set(v || ''));

    this.filterForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractId: string) => {
        this.filterForm.patchValue({ batchId: '' });
        this.batchOptions.set([]);
        this.batchSearchCtrl.setValue('');
        this.resetResultFields();

        if (contractId) {
          const selected = this.contractOptions().find(c => c.contractId === contractId);
          this.description.set(selected?.company ?? '-');
          this.loadBatches(contractId);
        }
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadContracts();
        this.loadMissingReasons();
      });
  }

  private initializeTableColumns(): void {
    this.tableConfig.columns = [
      {
        key: 'unitId',
        header: `Unit ID`,
        sortable: true,
      },
      {
        key: 'receivedDate',
        header: 'Received Date',
        sortable: false,
      },
      {
        key: 'redTubeFlag',
        header: 'Red 1',
        sortable: false,
        cellTemplate: this.tubeFlagCellTemplate,
      },
      {
        key: 'redTube2Flag',
        header: 'Red 2',
        sortable: false,
        cellTemplate: this.tubeFlagCellTemplate,
      },
      {
        key: 'purpleTubeFlag',
        header: 'Purple 1',
        sortable: false,
        cellTemplate: this.tubeFlagCellTemplate,
      },
      {
        key: 'serumPlasmaInd',
        header: 'Purple 2',
        sortable: false,
        cellTemplate: this.tubeFlagCellTemplate,
      },
    ];
  }

  ngAfterViewInit(): void {
    this.initializeTableColumns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetrieve(): void {
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid) return;
    this.pageIndex = 0;
    this.executeQuery();
  }

  onClear(): void {
    this.filterForm.reset({ contractId: '', batchId: '' });
    this.contractSearchCtrl.setValue('');
    this.batchSearchCtrl.setValue('');
    this.resetResultFields();
    this.units = [];
    this.totalRecords = 0;
    this.pageIndex = 0;
    this.hasSearched = false;
  }

  onPageChange(event: TablePageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    };
    this.executeQuery();
  }

  onSortChange(event: TableSortEvent): void {
    if (!event.column || event.direction === 'default') {
      this.sortColumn = 'UnitId';
      this.sortOrder = 'ASC';
    } else {
      this.sortColumn = this.mapSortColumn(event.column);
      this.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }
    this.pageIndex = 0;
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: {
        column: event.direction === 'default' ? 'unitId' : event.column,
        direction: event.direction === 'default' ? 'A' : event.direction,
      },
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0,
      },
    };
    this.executeQuery();
  }

  hasAnyFieldValue(): boolean {
    const values = this.filterForm.value;
    return !!(values.contractId || values.batchId);
  }

  formatTubeFlag(value: string | null | undefined): string {
    if (!value || value === 'N') return '*';
    if (value === 'Y') return 'Yes';
    if (value === '*') return '*';
    return value;
  }

  isMissing(value: string | null | undefined): boolean {
    return !value || value !== 'Y';
  }

  getTubeFlagTooltip(value: string | null | undefined): string {
    if (!value || value === 'Y' || value === 'N' || value === '*') return '';
    const reason = this.missingReasons().find(r => r.code === value);
    return reason?.description ?? '';
  }

  private loadContracts(): void {
    this.isLoadingContracts = true;
    this.apiService.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingContracts = false;
          if (response.success) {
            this.contractOptions.set(response.data ?? []);
          }
        },
        error: () => {
          this.isLoadingContracts = false;
        },
      });
  }

  private loadBatches(contractId: string): void {
    this.isLoadingBatches = true;
    this.apiService.getBatches(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingBatches = false;
          if (response.success) {
            this.batchOptions.set(response.data ?? []);
          } else if (response.errorCode || response.errorResponse) {
            this.snackbarService.showError(
              response.errorResponse?.error ?? response.message ?? 'Failed to load batches.',
            );
          }
        },
        error: (error) => {
          this.isLoadingBatches = false;
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while loading batches.'),
          );
        },
      });
  }

  private loadMissingReasons(): void {
    this.apiService.getMissingReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.missingReasons.set(response.data ?? []);
          }
        },
        error: () => {
          // non-critical — tooltips just won't show
        },
      });
  }

  private executeQuery(): void {
    const contractId = this.filterForm.get('contractId')?.value;
    const batchId = this.filterForm.get('batchId')?.value;

    this.isLoading = true;
    this.hasSearched = true;

    const skip = this.pageIndex * this.pageSize;

    this.apiService.query(contractId || '', batchId || '', this.pageSize, skip, this.sortColumn, this.sortOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            const data = response.data;
            this.units = data.units ?? [];
            this.totalRecords = data.totalCount ?? 0;

            const updatedColumns = this.tableConfig.columns.map(col =>
              col.key === 'unitId' ? { ...col, header: `Unit ID (${this.totalRecords})` } : col,
            );

            this.tableConfig = {
              ...this.tableConfig,
              columns: updatedColumns,
              pagination: {
                ...this.tableConfig.pagination!,
                totalRecords: this.totalRecords,
              },
            };

            this.unitsInBatch.set(String(data.totalUnitsInBatch ?? '-'));
            this.unitsMissingTubes.set(String(data.unitsWithMissingTubes ?? '-'));
            if (data.companyName) {
              this.description.set(data.companyName);
            }
          } else {
            this.units = [];
            this.totalRecords = 0;
            this.tableConfig = {
              ...this.tableConfig,
              pagination: {
                ...this.tableConfig.pagination!,
                totalRecords: 0,
              },
            };
            this.snackbarService.showError(
              response.errorResponse?.error ?? response.message ?? 'Failed to retrieve data.',
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.units = [];
          this.totalRecords = 0;
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: 0,
            },
          };
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving units.'),
          );
        },
      });
  }

  private resetResultFields(): void {
    this.description.set('-');
    this.unitsInBatch.set('-');
    this.unitsMissingTubes.set('-');
  }

  private mapSortColumn(columnKey: string): string {
    if (columnKey === 'unitId') return 'UnitId';
    return 'UnitId';
  }

  private filterContractOptions(options: ContractOption[], search: string): ContractOption[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.contractId?.toLowerCase().includes(q) ||
      o.company?.toLowerCase().includes(q),
    );
  }

  private filterBatchOptions(options: BatchOption[], search: string): BatchOption[] {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.batchId?.toLowerCase().includes(q));
  }
}
