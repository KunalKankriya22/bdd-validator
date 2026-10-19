import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DataTable } from '@shared/components/data-table/data-table';
import { LifeTrakApiLogService } from './services/life-trak-api-log.service';
import { ApiLogDto, SourceCodeDto } from './models/life-trak-api-log.model';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';

/**
 * LifeTrak API Log Information Query Component (APILOGL)
 *
 * Purpose: Search API logs by Source Application and Date Range
 *
 * Features:
 * - Search by Source Application ID (dropdown) - REQUIRED
 * - Optional filter by date range (From Date - To Date)
 * - Display logs in paginated table (Internal ID, External ID, Log Text, Insert Date)
 * - RETRIEVE and CLEAR ALL buttons
 *
 * Validation Rules:
 * - Source Application ID: Required (error 0080 if empty)
 * - From Date: Optional, cannot be in the future (chapter timezone)
 * - To Date: Optional, auto-fills to From Date if From Date is set and To Date is empty
 * - Date Range: To Date cannot be before From Date (error 2102)
 */
@Component({
  selector: 'app-life-trak-api-log-information-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './life-trak-api-log-information-query.html',
  styleUrl: './life-trak-api-log-information-query.scss',
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class LifeTrakApiLogInformationQueryComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `life-trak-api-log-${LifeTrakApiLogInformationQueryComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  // Dependency injection
  private readonly snackbarService = inject(SnackbarService);
  private readonly menuService = inject(MenuService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly service = inject(LifeTrakApiLogService);
  private readonly destroy$ = new Subject<void>();

  // Form controls
  protected readonly sourceApplicationIdControl = new FormControl<string>('', [Validators.required]);
  protected readonly sourceSearchControl = new FormControl<string>('');
  protected readonly fromDateControl = new FormControl<Moment | null>(null); // Optional
  protected readonly toDateControl = new FormControl<Moment | null>(null); // Optional

  // Signals for state management
  protected readonly isLoading = signal<boolean>(false);
  protected readonly hasRetrieved = signal<boolean>(false);
  protected readonly sourceApplications = signal<SourceCodeDto[]>([]);
  protected readonly apiLogs = signal<ApiLogDto[]>([]);
  protected readonly totalRecords = signal<number>(0);

  // Filtered source applications based on search
  protected readonly filteredSourceApplications = computed(() => {
    const search = this.sourceSearchControl.value?.toLowerCase() || '';
    const sources = this.sourceApplications();

    if (!search) {
      return sources;
    }

    return sources.filter(source =>
      source.code.toLowerCase().includes(search) ||
      source.codeDesc.toLowerCase().includes(search)
    );
  });

  // Check if retrieve button should be disabled

  // Current pagination state
  protected readonly currentPage = signal<number>(0);
  protected readonly pageSize = signal<number>(25);

  // Table configuration
  protected tableConfig: DataTableConfig<ApiLogDto> = {
    columns: [
      {
        key: 'internalId',
        header: 'Internal ID',
        sortable: false,
        width: '150px'
      },
      {
        key: 'externalId',
        header: 'External ID',
        sortable: false,
        width: '150px'
      },
      {
        key: 'logText',
        header: 'Log Text',
        sortable: false,
      },
      {
        key: 'insertDate',
        header: 'Insert Date',
        sortable: false,
        width: '200px',
        valueFormatter: (value: any) => {
          if (!value) return '-';

          const dateMoment = moment(value);
          if (!dateMoment.isValid() || dateMoment.year() <= 1) return '-';

          return dateMoment.format('DD-MMM-YYYY, HH:mm');
        }
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: '',
      direction: 'default',
    },
    stickyHeader: true,
    enableSelection: false,
    showPagination: true,
    emptyMessage: 'No Results to Display\nSelect a Source Application ID and click RETRIEVE to begin',
    loadingMessage: 'Loading API logs...',
  };

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  constructor() {
    // Update page header config when menu data is loaded
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.LifeTrakApiLogInformationQuery].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || 'Search API logs by Source Application and Date Range'
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadSourceApplications();
    this.subscribeToChapterChanges();
  }

  /**
   * Load source codes dropdown options
   */
  private loadSourceApplications(): void {
    this.service.getSourceCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sourceCodes) => {
          this.sourceApplications.set(sourceCodes);
        },
        error: (error) => {
          console.error('Failed to load source codes:', error);
          this.snackbarService.showError(
            error?.userMessage || 'Failed to load source applications. Please try again.'
          );
        },
      });
  }

  /**
   * Subscribe to chapter changes and reload data
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadSourceApplications();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Validate form before retrieve
   */
  private validateForm(): boolean {
    // Mark source application control as touched to show errors
    this.sourceApplicationIdControl.markAsTouched();

    // Check required field: Source Application ID
    if (!this.sourceApplicationIdControl.value?.trim()) {
      this.snackbarService.showError('Please select a Source Application ID');
      return false;
    }

    const fromDate = this.fromDateControl.value;
    const toDate = this.toDateControl.value;

    if (fromDate) {
      const fromMoment = moment(fromDate);
      const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
      const today = chapterDate && chapterDate.isValid()
        ? chapterDate.clone().startOf('day')
        : moment().startOf('day');

      if (fromMoment.isAfter(today, 'day')) {
        this.snackbarService.showError('From Date cannot be in the future');
        return false;
      }

      if (toDate) {
        const toMoment = moment(toDate);
        if (toMoment.isBefore(fromMoment, 'day')) {
          this.snackbarService.showError('To Date cannot be before From Date');
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Handle RETRIEVE button click
   */
  protected onRetrieve(): void {
    if (!this.validateForm()) {
      return;
    }

    // Auto-set toDate = fromDate if only fromDate is provided (FMB C_TO_DATE.WHEN-VALIDATE-ITEM behavior)
    if (this.fromDateControl.value && !this.toDateControl.value) {
      this.toDateControl.setValue(moment(this.fromDateControl.value));
    }

    // Reset to first page on new search
    this.currentPage.set(0);
    this.fetchApiLogs();
  }

  /**
   * Fetch API logs from backend
   */
  private fetchApiLogs(): void {
    const sourceId = this.sourceApplicationIdControl.value!.trim();

    // Dates are optional - convert to ISO 8601 if provided
    // Use moment().toISOString() for proper ISO 8601 format
    const fromDate = this.fromDateControl.value
      ? moment(this.fromDateControl.value).toISOString()
      : null;
    const toDate = this.toDateControl.value
      ? moment(this.toDateControl.value).toISOString()
      : null;

    this.isLoading.set(true);
    this.hasRetrieved.set(true);

    this.service.searchLogs({
      sourceId,
      fromDate,
      toDate,
      take: this.pageSize(),
      skip: this.currentPage() * this.pageSize(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.apiLogs.set(response.data);
            this.totalRecords.set(response.totalCount);
            this.updateTablePagination();

            if (response.data.length === 0) {
              this.snackbarService.showInfo(
                response.message || 'No API logs found for the selected criteria'
              );
            }
          } else {
            // Handle validation errors from backend
            this.snackbarService.showError(response.message || 'Invalid search criteria');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.handleApiError(error, 'Failed to retrieve API logs');
        },
      });
  }

  /**
   * Handle page change from DataTable
   */
  protected onPageChange(event: TablePageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetchApiLogs();
  }

  /**
   * Update table pagination
   */
  private updateTablePagination(): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: this.totalRecords(),
        pageIndex: this.currentPage(),
        pageSize: this.pageSize(),
      },
    };
  }

  /**
   * Handle CLEAR ALL button click
   */
  protected onClearAll(): void {
    this.sourceApplicationIdControl.reset();
    this.fromDateControl.reset();
    this.toDateControl.reset();
    this.apiLogs.set([]);
    this.totalRecords.set(0);
    this.hasRetrieved.set(false);
    this.currentPage.set(0);
    this.updateTablePagination();
  }

  /**
   * Handle API errors with specific error code mapping
   */
  private handleApiError(error: any, defaultMessage: string): void {
    // Use the userMessage from service's error handler, or extract from error object
    const errorMessage = error?.userMessage || error?.error?.message || error?.message;

    if (error.status === 400) {
      // Validation errors (e.g., missing source ID, invalid date range)
      this.snackbarService.showError(errorMessage || 'Invalid search criteria');
    } else if (error.status === 500) {
      // Server errors
      this.snackbarService.showError(errorMessage || 'An unexpected server error occurred');
    } else if (error.status === 0) {
      // Network errors
      this.snackbarService.showError('Unable to connect to server. Please check your network connection.');
    } else {
      this.snackbarService.showError(errorMessage || defaultMessage);
    }
  }

  /**
   * Handle From Date input - allows text entry and auto-conversion
   */
  protected onFromDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    if (!inputValue?.trim()) {
      // Clear the value if empty
      this.fromDateControl.setValue(null, { emitEvent: false });
      this.fromDateControl.setErrors(null);
      this.fromDateControl.markAsPristine();
      this.fromDateControl.markAsUntouched();
      this.fromDateControl.updateValueAndValidity();
    } else {
      // Mark as touched and dirty for validation
      this.fromDateControl.markAsTouched();
      this.fromDateControl.markAsDirty();

      // If input has text but control value is null, datepicker couldn't parse it
      if (!this.fromDateControl.value) {
        this.fromDateControl.setErrors({ invalidDate: true });
      }
    }
  }

  /**
   * Handle To Date input - allows text entry and auto-conversion
   */
  protected onToDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    if (!inputValue?.trim()) {
      // Clear the value if empty
      this.toDateControl.setValue(null, { emitEvent: false });
      this.toDateControl.setErrors(null);
      this.toDateControl.markAsPristine();
      this.toDateControl.markAsUntouched();
      this.toDateControl.updateValueAndValidity();
    } else {
      // Mark as touched and dirty for validation
      this.toDateControl.markAsTouched();
      this.toDateControl.markAsDirty();

      // If input has text but control value is null, datepicker couldn't parse it
      if (!this.toDateControl.value) {
        this.toDateControl.setErrors({ invalidDate: true });
      }
    }
  }
}
