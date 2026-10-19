import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '../../../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '../../../../../shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '../../../../../shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '../../../../../shared/interfaces/data-table.interface';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { PageHeaderService } from '../../../../../shared/services/page-header.service';
import { HeaderService } from '../../../../../shared/services/header.service';
import { CryoResultsService } from './services/cryo-results.service';
import { CryoResultUnit, WorksheetIdItem } from './models/cryo-results.model';

@Component({
  selector: 'app-cryo-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './cryo-results.html',
  styleUrl: './cryo-results.scss',
})
export class CryoResultsComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `cryo-results-${CryoResultsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly service = inject(CryoResultsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  protected readonly worksheetIdControl = new FormControl<string>('', [Validators.required]);
  protected readonly worksheetSearchControl = new FormControl<string>('');

  protected readonly isLoading = signal<boolean>(false);
  protected readonly hasRetrieved = signal<boolean>(false);
  protected readonly worksheetLovItems = signal<WorksheetIdItem[]>([]);
  protected readonly filteredWorksheetLovItems = signal<WorksheetIdItem[]>([]);

  dataSource: CryoResultUnit[] = [];

  tableConfig: DataTableConfig<CryoResultUnit> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: true, width: '180px' },
      { key: 'collDate', header: 'Collection Date', sortable: false, width: '160px' },
      { key: 'actualProductCode', header: 'Product', sortable: false, width: '120px' },
      { key: 'productShortName', header: 'Description', sortable: false, width: '140px' },
      { key: 'thawMethod', header: 'Thaw', sortable: false, width: '80px' },
      { key: 'thawTemperature', header: 'Temperature', sortable: false, width: '120px' },
      { key: 'sepInd', header: 'Separation', sortable: false, width: '100px' },
      { key: 'freezeTime', header: 'Freeze Date and Time', sortable: false, width: '180px' },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'unitId',
      direction: 'default',
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No units found',
    emptySubMessage: '',
    loadingMessage: 'Loading units...',
  };

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
  }

  ngOnInit(): void {
    this.loadWorksheetIds();
    this.subscribeToChapterChanges();
    this.setupSearchControl();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearWorksheet();
        this.loadWorksheetIds();
      });
  }

  private setupSearchControl(): void {
    this.worksheetSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchText) => this.filterWorksheetOptions(searchText || ''));
  }

  private filterWorksheetOptions(searchText: string): void {
    const allWorksheets = this.worksheetLovItems();
    const filtered = !searchText
      ? [...allWorksheets]
      : allWorksheets.filter(worksheet =>
          worksheet.worksheetId.toLowerCase().includes(searchText.toLowerCase())
        );
    this.filteredWorksheetLovItems.set(filtered);
  }

  private loadWorksheetIds(): void {
    this.service
      .getWorksheetIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.worksheetLovItems.set(items);
          this.filteredWorksheetLovItems.set(items);
        },
        error: (error) => {
          if (error.status !== 404 && error.status !== 401) {
            this.snackbarService.showError(
              error?.error?.message || 'Failed to load worksheet IDs',
            );
          }
        },
      });
  }

  protected onRetrieveWorksheet(): void {
    const worksheetId = this.worksheetIdControl.value?.trim();
    if (!worksheetId) {
      this.worksheetIdControl.markAsTouched();
      return;
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.hasRetrieved.set(true);
    this.loadUnits();
  }

  loadUnits(): void {
    const worksheetId = this.worksheetIdControl.value?.trim();
    if (!worksheetId) return;

    this.isLoading.set(true);

    const skip = (this.tableConfig.pagination?.pageIndex || 0) *
                 (this.tableConfig.pagination?.pageSize || 10);
    const take = this.tableConfig.pagination?.pageSize || 10;

    const sortColumn = this.tableConfig.sortConfig?.column || null;
    const sortOrder = this.tableConfig.sortConfig?.direction === 'default'
      ? null : this.tableConfig.sortConfig?.direction || null;

    this.service
      .getUnitsAwaitingResults(worksheetId, take, skip, sortColumn, sortOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig = {
            ...this.tableConfig,
            columns: [
              {
                ...this.tableConfig.columns[0],
                header: response.totalRecords > 0
                  ? `Unit ID (${response.totalRecords})`
                  : 'Unit ID',
              },
              ...this.tableConfig.columns.slice(1),
            ],
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.totalRecords,
            },
          };
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
          const msg =
            error?.error?.message ||
            error?.error?.errorResponse?.Error ||
            'Failed to retrieve units';
          this.snackbarService.showError(msg);
        },
      });
  }

  protected onClearWorksheet(): void {
    this.worksheetIdControl.reset();
    this.worksheetSearchControl.reset();
    this.dataSource = [];
    this.hasRetrieved.set(false);
    this.tableConfig = {
      ...this.tableConfig,
      columns: [
        { ...this.tableConfig.columns[0], header: 'Unit ID' },
        ...this.tableConfig.columns.slice(1),
      ],
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: 0,
        pageIndex: 0,
      },
    };
  }

  protected onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadUnits();
  }

  protected onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.loadUnits();
  }
}
