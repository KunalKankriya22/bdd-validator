import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { PageHeaderService } from '../../../shared/services/page-header.service';
import { HeaderService } from '../../../shared/services/header.service';
import { InstrumentErrorLogQueryService } from './services/instrument-error-log-query.service';
import { InstrumentErrorLogRecord, InstrumentErrorLogSearchRequest } from './models/instrument-error-log-query.model';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import moment from 'moment';

@Component({
  selector: 'app-instrument-error-log-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './instrument-error-log-query.html',
  styleUrl: './instrument-error-log-query.scss',
})
export class InstrumentErrorLogQuery implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly errorLogService = inject(InstrumentErrorLogQueryService);

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
  dataSource: InstrumentErrorLogRecord[] = [];
  isLoading = false;
  hasSearched = false;

  expandedRows = signal<Set<string>>(new Set());

  tableConfig: DataTableConfig<InstrumentErrorLogRecord> = {
    caption: 'Instrument Error Log Results',
    rowLabelKey: 'moduleName',
    columns: [
      { key: 'moduleName', header: 'Module' },
      { key: 'insertDats', header: 'Error Date Time',
        valueFormatter: (v: string) => {
          if (!v) return '-';
          const m = moment(v, ['MM-DD-YYYY HH:mm:ss', 'YYYY-MM-DDTHH:mm:ss', moment.ISO_8601]);
          return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : v;
        }
      },
      { key: 'userId', header: 'User' },
      { key: 'statementId', header: 'Statement Number' },
      { key: 'errorKey', header: 'Error Key', valueFormatter: (v: string) => v || '-' },
    ],
    pagination: {
      pageSize: 25,
      totalRecords: 0,
      pageIndex: 0,
      pageSizeOptions: [10, 25, 50, 100],
    },
    sortConfig: { column: 'moduleName', direction: 'A' },
    emptyMessage: 'No Error Logs Available To Display',
    noDataIcon: 'search',
    enableRowHighlight: false,
    showActionsAsMenu: false,
  };

  private requestState: InstrumentErrorLogSearchRequest = {
    startDate: '',
    endDate: '',
    sortColumn: 'ModuleName',
    sortOrder: 'ASC',
  };

  private take = 25;
  private skip = 0;
  private lastChangedDateField: 'start' | 'end' | null = null;

  startDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const today = this.chapterTimezoneService.getChapterLocalDate();
    return !moment(date).startOf('day').isAfter(today);
  };

  endDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const startDate = this.searchForm?.get('startDate')?.value;
    if (startDate) {
      return !moment(date).startOf('day').isBefore(moment(startDate).startOf('day'));
    }
    return true;
  };

  startDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getStartDateError()
  );
  endDateErrorMatcher: ErrorStateMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEndDateError()
  );

  isRetrieved = false;

  get isRetrieveDisabled(): boolean {
    return this.isLoading || !this.searchForm.valid || this.isRetrieved;
  }

  get isClearAllDisabled(): boolean {
    return !this.searchForm.dirty &&
           !this.searchForm.get('startDate')?.value &&
           !this.searchForm.get('endDate')?.value &&
           !this.searchForm.get('moduleName')?.value &&
           !this.hasSearched;
  }

  ngOnInit(): void {
    this.initSearchForm();
    this.setupDateValidationListeners();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null],
      moduleName: [''],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('startDate', 'endDate')]
    });
  }

  private setupDateValidationListeners(): void {
    this.searchForm.get('startDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'start';
        this.isRetrieved = false;
        this.searchForm.get('endDate')?.updateValueAndValidity({ emitEvent: false });
        this.searchForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.searchForm.get('endDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'end';
        this.isRetrieved = false;
        this.searchForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.searchForm.get('moduleName')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isRetrieved = false;
      });
  }

  getStartDateError(): string {
    const c = this.searchForm.get('startDate');
    if (!c || !(c.touched || c.dirty)) return '';
    if (c.hasError('matDatepickerFilter')) return 'Start Date cannot be a Future date';
    const formErrors = this.lastChangedDateField === 'start' ? this.searchForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(c, 'Start Date', 'End Date', formErrors);
  }

  getEndDateError(): string {
    const c = this.searchForm.get('endDate');
    if (!c || !(c.touched || c.dirty)) return '';
    if (c.hasError('matDatepickerFilter') && this.lastChangedDateField === 'end') return 'End Date cannot be before Start Date';
    const formErrors = this.lastChangedDateField === 'end' ? this.searchForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(c, 'End Date', 'Start Date', formErrors);
  }

  onStartDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.searchForm.get('startDate')
    );
  }

  onEndDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.searchForm.get('endDate')
    );
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;
    if (!this.searchForm.get('endDate')?.value) {
      const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();
      this.searchForm.get('endDate')?.setValue(chapterLocalDate, { emitEvent: false });
    }
    this.skip = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadData();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchForm.reset(undefined, { emitEvent: false });
        this.hasSearched = false;
        this.isRetrieved = false;
        this.lastChangedDateField = null;
        this.dataSource = [];
        this.tableConfig.pagination!.totalRecords = 0;
        this.tableConfig.pagination!.pageIndex = 0;
        this.skip = 0;
        this.expandedRows.set(new Set());

      });
  }

  loadData(): void {
    const startDate = this.searchForm.get('startDate')?.value;
    const endDate = this.searchForm.get('endDate')?.value;

    if (!startDate || !endDate) return;

    this.requestState.startDate = DateFieldValidationUtility.serializeDateForApi(startDate) || '';
    this.requestState.endDate = DateFieldValidationUtility.serializeDateForApi(endDate) || '';

    const moduleName = this.searchForm.get('moduleName')?.value?.trim();
    this.requestState.moduleName = moduleName ? moduleName.toUpperCase() : undefined;

    this.isLoading = true;
    this.hasSearched = true;
    this.isRetrieved = true;
    this.expandedRows.set(new Set());

    this.errorLogService
      .queryErrorLogs(this.take, this.skip, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.dataSource = response.data.map((row, i) => ({
            ...row,
            expandKey: `${this.skip + i}`,
          }));
          this.tableConfig.pagination!.totalRecords = response.total;
        },
        error: () => {
          this.isLoading = false;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        },
      });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.take = event.pageSize;
    this.skip = event.pageIndex * event.pageSize;
    this.loadData();
  }

  onSortChange(event: { column: string; direction: 'A' | 'D' | 'default' }): void {
    this.requestState.sortColumn = event.column;
    this.requestState.sortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    this.tableConfig.sortConfig = {
      column: event.column,
      direction: event.direction,
    };
    this.loadData();
  }

  onRowExpandToggle(row: InstrumentErrorLogRecord): void {
    const expanded = new Set(this.expandedRows());
    const key = row.expandKey;
    if (expanded.has(key)) {
      expanded.delete(key);
    } else {
      expanded.add(key);
    }
    this.expandedRows.set(expanded);
  }

  onExpandAllToggle(expandAll: boolean): void {
    if (expandAll) {
      this.expandedRows.set(new Set(this.dataSource.map(row => row.expandKey)));
    } else {
      this.expandedRows.set(new Set());
    }
  }

  onClearAll(): void {
    this.searchForm.reset(undefined, { emitEvent: false });
    this.hasSearched = false;
    this.isRetrieved = false;
    this.dataSource = [];
    this.tableConfig.pagination!.totalRecords = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.skip = 0;
    this.expandedRows.set(new Set());
  }

  onModuleNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.searchForm.get('moduleName')?.setValue(input.value, { emitEvent: true });
  }

}
