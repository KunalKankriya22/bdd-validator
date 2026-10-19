import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';

import { InstrumentUploadLogQueryService } from './instrument-upload-log-query.service';
import {
  InstrumentUploadLogRecord,
  InstrumentUploadLogQueryParams
} from './instrument-upload-log-query.model';

@Component({
  selector: 'app-instrument-upload-log-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './instrument-upload-log-query.html',
  styleUrls: ['./instrument-upload-log-query.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentUploadLogQueryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly apiService = inject(InstrumentUploadLogQueryService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loggingService = inject(LoggingService);

  headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      return {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
      };
    }
    return {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: '',
    };
  });

  searchForm!: FormGroup;
  dataSource: InstrumentUploadLogRecord[] = [];
  isLoading = false;
  hasSearched = false;

  batchIds: string[] = [];
  testIds: string[] = [];
  machineIds: string[] = [];
  isLoadingFilters = false;

  batchIdSearchControl = new FormControl('');
  testIdSearchControl = new FormControl('');
  machineSearchControl = new FormControl('');

  filteredBatchIds: string[] = [];
  filteredTestIds: string[] = [];
  filteredMachineIds: string[] = [];

  enterDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const today = this.chapterTimezoneService.getChapterLocalDate();
    return !moment(date).startOf('day').isAfter(today);
  };

  enterDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEnterDateError()
  );

  tableConfig: DataTableConfig<InstrumentUploadLogRecord> = {
    columns: [
      { key: 'machineId', header: 'Machine Code', sortable: false, width: '140px' },
      { key: 'tbId', header: 'Batch ID', sortable: true, width: '120px' },
      { key: 'testId', header: 'Test ID', sortable: false, width: '100px' },
      { key: 'stationNo', header: 'Station', sortable: false, width: '100px', valueFormatter: (v) => v || '-' },
      { key: 'okCount', header: 'Number of Tested Blood Samples', sortable: false, width: '240px', valueFormatter: (v) => v !== null ? v : '-' },
      { key: 'voidCount', header: 'Void', sortable: false, width: '100px', valueFormatter: (v) => v !== null ? v : '-' },
      { key: 'reconcileUserId', header: 'User ID', sortable: false, width: '120px', valueFormatter: (v) => v || '-' },
      {
        key: 'statusDats',
        header: 'Status Date and Time',
        sortable: false,
        width: '200px',
        valueFormatter: (v: string) => {
          if (!v) return '-';
          const m = moment.utc(v);
          if (!m.isValid()) return v;
          return m.utcOffset(this.headerService.chapterTimeZone()).format('DD-MMM-YYYY HH:mm').toUpperCase();
        }
      },
      { key: 'statusDesc', header: 'Status', sortable: false, width: '150px', valueFormatter: (v) => v || '-' },
    ],
    pagination: {
      pageSize: 25,
      totalRecords: 0,
      pageIndex: 0,
      pageSizeOptions: [10, 25, 50, 100],
    },
    sortConfig: { column: 'tbId', direction: 'default' },
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'No instrument upload logs found for the selected criteria',
    noDataIcon: 'edit',
    enableRowHighlight: false,
    showActionsAsMenu: false,
    stickyHeader: true,
  };

  private requestState: InstrumentUploadLogQueryParams = {
    readDate: '',
    tbId: null,
    testId: null,
    machineId: null,
    sortColumn: 'TbId',
    sortOrder: 'ASC',
    take: 25,
    skip: 0,
  };

  get isRetrieveDisabled(): boolean {
    return !this.searchForm?.get('enterDate')?.value || this.isLoading;
  }

  get isClearAllDisabled(): boolean {
    return !this.hasSearched && !this.searchForm?.get('enterDate')?.value;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
    this.subscribeToChapterChanges();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      enterDate: [null, Validators.required],
      batchId: [''],
      testId: [''],
      machine: ['']
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const enterDateControl = this.searchForm.get('enterDate');
        if (enterDateControl) {
          enterDateControl.updateValueAndValidity();
        }
      });
  }

  private setupSearchFilters(): void {
    this.batchIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterBatchIds();
      });

    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTestIds();
      });

    this.machineSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterMachineIds();
      });
  }

  private filterBatchIds(): void {
    const search = this.batchIdSearchControl.value?.toLowerCase()?.trim() || '';
    if (!search) {
      this.filteredBatchIds = this.batchIds;
    } else {
      this.filteredBatchIds = this.batchIds.filter(id => id.toLowerCase().includes(search));
    }
    this.cdr.markForCheck();
  }

  private filterTestIds(): void {
    const search = this.testIdSearchControl.value?.toLowerCase()?.trim() || '';
    if (!search) {
      this.filteredTestIds = this.testIds;
    } else {
      this.filteredTestIds = this.testIds.filter(id => id.toLowerCase().includes(search));
    }
    this.cdr.markForCheck();
  }

  private filterMachineIds(): void {
    const search = this.machineSearchControl.value?.toLowerCase()?.trim() || '';
    if (!search) {
      this.filteredMachineIds = this.machineIds;
    } else {
      this.filteredMachineIds = this.machineIds.filter(id => id.toLowerCase().includes(search));
    }
    this.cdr.markForCheck();
  }

  getEnterDateError(): string {
    const control = this.searchForm.get('enterDate');
    if (!control) return '';

    if (control.hasError('required') && control.touched) {
      return 'Enter Date is required';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'Invalid date format';
    }

    const value = control.value;
    if (value) {
      const selectedDate = moment(value).startOf('day');
      const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
      const today = chapterDate && chapterDate.isValid()
        ? chapterDate.clone().startOf('day')
        : moment().startOf('day');

      if (selectedDate.isAfter(today, 'day')) {
        return 'Enter Date cannot be in the future';
      }
    }

    return '';
  }

  private setupFormSubscriptions(): void {
    this.searchForm.get('enterDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((date) => {
        if (date) {
          this.searchForm.patchValue({
            batchId: '',
            testId: '',
            machine: ''
          }, { emitEvent: false });
          this.loadFilterOptions();
        }
      });

    this.searchForm.get('batchId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchForm.patchValue({
          testId: '',
          machine: ''
        }, { emitEvent: false });
        this.loadFilterOptions();
      });

    this.searchForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchForm.patchValue({
          machine: ''
        }, { emitEvent: false });
        this.loadFilterOptions();
      });
  }

  private loadFilterOptions(): void {
    const enterDate = this.searchForm.get('enterDate')?.value;
    if (!enterDate) {
      this.batchIds = [];
      this.testIds = [];
      this.machineIds = [];
      this.filteredBatchIds = [];
      this.filteredTestIds = [];
      this.filteredMachineIds = [];
      this.cdr.markForCheck();
      return;
    }

    this.isLoadingFilters = true;
    // DON'T clear arrays here - keep old values visible until new ones arrive

    const readDate = this.formatDateForApi(enterDate);
    const batchId = this.searchForm.get('batchId')?.value || null;
    const testId = this.searchForm.get('testId')?.value || null;

    this.apiService.getFilterOptions(readDate, batchId, testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.batchIds = response.data.availableTbIds || [];
            this.testIds = response.data.availableTestIds || [];
            this.machineIds = response.data.availableMachineIds || [];

            this.filteredBatchIds = response.data.availableTbIds || [];
            this.filteredTestIds = response.data.availableTestIds || [];
            this.filteredMachineIds = response.data.availableMachineIds || [];

            this.batchIdSearchControl.setValue('', { emitEvent: false });
            this.testIdSearchControl.setValue('', { emitEvent: false });
            this.machineSearchControl.setValue('', { emitEvent: false });
          }
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loggingService.error('Failed to load filter options', error);
          this.snackbarService.showError('Failed to load filter options');
          // Only clear on error
          this.batchIds = [];
          this.testIds = [];
          this.machineIds = [];
          this.filteredBatchIds = [];
          this.filteredTestIds = [];
          this.filteredMachineIds = [];
          this.isLoadingFilters = false;
          this.cdr.markForCheck();
        }
      });
  }

  onRetrieve(): void {
    const enterDate = this.searchForm.get('enterDate')?.value;
    if (!enterDate) {
      this.snackbarService.showError('Enter Date is required');
      return;
    }

    this.hasSearched = true;
    this.isLoading = true;

    this.requestState = {
      readDate: this.formatDateForApi(enterDate),
      tbId: this.searchForm.get('batchId')?.value || null,
      testId: this.searchForm.get('testId')?.value || null,
      machineId: this.searchForm.get('machine')?.value || null,
      sortColumn: this.mapColumnToApiField(this.tableConfig.sortConfig?.column || 'TbId'),
      sortOrder: this.tableConfig.sortConfig?.direction === 'A' ? 'ASC' : 'DESC',
      take: this.tableConfig.pagination?.pageSize || 10,
      skip: (this.tableConfig.pagination?.pageIndex || 0) * (this.tableConfig.pagination?.pageSize || 10),
    };

    this.apiService.getInstrumentUploadLogs(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource = response.data || [];
            if (this.tableConfig.pagination) {
              this.tableConfig.pagination.totalRecords = response.totalCount || 0;
            }
          } else {
            this.snackbarService.showError(response.message || 'Failed to retrieve data');
            this.dataSource = [];
            if (this.tableConfig.pagination) {
              this.tableConfig.pagination.totalRecords = 0;
            }
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loggingService.error('Failed to retrieve instrument upload logs', error);
          const errorMessage = error?.error?.message || error?.message || 'Failed to retrieve data';
          this.snackbarService.showError(errorMessage);
          this.dataSource = [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onClearAll(): void {
    this.searchForm.reset({
      enterDate: null,
      batchId: '',
      testId: '',
      machine: ''
    });

    this.dataSource = [];
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }
    this.hasSearched = false;
    this.batchIds = [];
    this.testIds = [];
    this.machineIds = [];
    this.filteredBatchIds = [];
    this.filteredTestIds = [];
    this.filteredMachineIds = [];

    this.batchIdSearchControl.setValue('', { emitEvent: false });
    this.testIdSearchControl.setValue('', { emitEvent: false });
    this.machineSearchControl.setValue('', { emitEvent: false });

    this.cdr.markForCheck();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.requestState.take = event.pageSize;
    this.requestState.skip = event.pageIndex * event.pageSize;
    this.onRetrieve();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    this.requestState.sortColumn = this.mapColumnToApiField(event.column);
    this.requestState.sortOrder = event.direction === 'A' ? 'ASC' : 'DESC';

    // Reset to first page when sorting
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.requestState.skip = 0;

    this.onRetrieve();
  }

  private mapColumnToApiField(column: string): string {
    const mapping: Record<string, string> = {
      'machineId': 'MachineId',
      'tbId': 'TbId',
      'testId': 'TestId',
      'statusDats': 'StatusDats'
    };
    return mapping[column] || column;
  }

  private formatDateForApi(date: moment.Moment | Date | null): string {
    if (!date) return '';
    const m = moment(date);
    return m.format('YYYY-MM-DD');
  }
}
