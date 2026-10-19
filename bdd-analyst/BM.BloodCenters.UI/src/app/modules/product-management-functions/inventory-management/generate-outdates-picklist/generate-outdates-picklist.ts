import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { LoginService } from '@shared/services/login.service';
import { ROUTES } from '@core/constants/route.constants';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';

import { GenerateOutdatesPicklistService } from './services/generate-outdates-picklist.service';
import {
  OutdatesSummaryItem,
  OutdatesDetailItem,
  InventoryClassOption,
  OutdatesSearchRequest,
  OutdatesDetailRequest,
  CommitOutdatesRequest,
  CommitOutdatesResponse
} from './models/generate-outdates-picklist.model';

import moment, { Moment } from 'moment';

@Component({
  selector: 'app-generate-outdates-picklist',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './generate-outdates-picklist.html',
  styleUrls: ['./generate-outdates-picklist.scss']
})
export class GenerateOutdatesPicklist implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `generate-outdates-picklist-${GenerateOutdatesPicklist.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(GenerateOutdatesPicklistService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly loginService = inject(LoginService);
  private readonly destroy$ = new Subject<void>();

  searchForm!: FormGroup;

  protected readonly summaryData = signal<OutdatesSummaryItem[]>([]);
  protected readonly detailData = signal<OutdatesDetailItem[]>([]);
  protected readonly totalOutdates = signal<number>(0);

  protected readonly loading = signal<boolean>(false);
  protected readonly loadingDetails = signal<boolean>(false);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly selectedSummaryRow = signal<OutdatesSummaryItem | null>(null);
  protected readonly isPrinting = signal<boolean>(false);
  protected readonly hasCommitted = signal<boolean>(false);
  protected readonly committedPickSlipId = signal<string | null>(null);

  protected readonly inventoryClasses = signal<InventoryClassOption[]>([]);

  // Detail table pagination
  protected readonly detailTotalRecords = signal<number>(0);
  protected detailPageIndex = 0;
  protected detailPageSize = 25;

  // Detail table sorting (empty string = no active sort, backend uses default order)
  protected detailSortColumn = '';
  protected detailSortOrder: 'ASC' | 'DESC' = 'ASC';

  // Summary table sorting
  protected summarySortColumn: string | null = null;
  protected summarySortOrder: 'ASC' | 'DESC' = 'ASC';
  private lastSummaryRequestBase: { outdateAsOf: string; inventoryClass?: string } | null = null;

  protected readonly maxDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate && chapterDate.isValid() ? chapterDate.clone() : moment();
  });

  protected readonly showSplitView = computed(() => this.hasSearched() && this.summaryData().length > 0);
  protected readonly canPrint = computed(() =>
    this.summaryData().length > 0 && !this.isPrinting() && !this.hasCommitted()
  );


  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: ROUTES.HOME }],
    title: '',
    subtitle: ''
  };

  summaryTableConfig: DataTableConfig<OutdatesSummaryItem> = {
    columns: [
      { key: 'productType', header: 'Product', sortable: true },
      { key: 'bloodTypeDescription', header: 'ABORh', sortable: false },
      { key: 'quantity', header: 'Qty', sortable: false, type: 'number' }
    ],
    showPagination: false,
    stickyHeader: true,
    enableRowHighlight: true,
    emptyMessage: 'No summary data',
    noDataIcon: 'search'
  };

  detailTableConfig: DataTableConfig<OutdatesDetailItem> = {
    columns: [
      {
        key: 'unitId', header: 'Unit ID', sortable: true,
        valueFormatter: (value: string, row: OutdatesDetailItem) =>
          row.chkDigit ? `${value}-${row.chkDigit}` : value
      },
      { key: 'productCode', header: 'Product Code', sortable: false },
{
        key: 'expirationDate', header: 'Expiration Date', sortable: false,
        valueFormatter: (value: string) => this.formatDateTime(value)
      },
      { key: 'locationId', header: 'Location', sortable: false },
      { key: 'inventoryClass', header: 'Inventory Class', sortable: false }
    ],
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    emptyMessage: 'Select a product row to view unit details',
    noDataIcon: 'table_rows'
  };

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.GenerateOutdatesPicklist].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);
        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadInventoryClasses();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    const initialDate = chapterDate?.isValid() ? chapterDate.clone() : null;
    this.searchForm = this.fb.group({
      outdateAsOf: [initialDate, [Validators.required]],
      inventoryClass: ['']
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadInventoryClasses();
      });
  }

  private loadInventoryClasses(): void {
    this.service.getInventoryClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.data || response.item || [];
          this.inventoryClasses.set(Array.isArray(data) ? data : []);
        },
        error: () => {
          this.inventoryClasses.set([]);
        }
      });
  }

  onSearch(): void {
    const outdateControl = this.searchForm.get('outdateAsOf');
    if (outdateControl?.hasError('matDatepickerParse') || outdateControl?.hasError('matDatepickerMax')) {
      this.searchForm.markAllAsTouched();
      return;
    }

    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const outdateValue = this.searchForm.get('outdateAsOf')?.value;
    const outdateMoment = moment.isMoment(outdateValue) ? outdateValue.clone() : moment(outdateValue);
    const chapterNow = this.chapterTimezoneService.chapterLocalDate();
    if (chapterNow?.isValid()) {
      outdateMoment.hours(chapterNow.hours()).minutes(chapterNow.minutes()).seconds(0).milliseconds(0);
    }

    // Reset summary sort to default state on each new search
    this.summarySortColumn = null;
    this.summarySortOrder = 'ASC';
    this.summaryTableConfig = { ...this.summaryTableConfig, sortConfig: undefined };

    this.loading.set(true);
    this.selectedSummaryRow.set(null);
    this.detailData.set([]);
    this.detailTotalRecords.set(0);

    this.lastSummaryRequestBase = {
      outdateAsOf: outdateMoment.format('YYYY-MM-DDTHH:mm:ss'),
      inventoryClass: this.searchForm.get('inventoryClass')?.value || undefined
    };

    this.loadSummary();
  }

  private loadSummary(): void {
    if (!this.lastSummaryRequestBase) return;

    const request: OutdatesSearchRequest = {
      ...this.lastSummaryRequestBase,
      sortColumn: this.summarySortColumn ?? undefined,
      sortOrder: this.summarySortColumn ? this.summarySortOrder : undefined
    };

    this.service.getSummary(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          const items = response.data || response.item || [];
          this.summaryData.set(Array.isArray(items) ? items : []);
          this.totalOutdates.set(response.totalCount ?? 0);
          this.hasSearched.set(true);

          if ((response.data ?? response.item ?? []).length === 0) {
            this.snackBar.open('No units are out of date', 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.hasSearched.set(true);
          this.summaryData.set([]);
          this.totalOutdates.set(0);
          const msg = error.error?.message || 'Failed to search outdated products';
          this.snackBar.open(msg, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onSummaryRowClick(row: OutdatesSummaryItem): void {
    this.selectedSummaryRow.set(row);
    this.detailPageIndex = 0;
    this.detailPageSize = this.detailTableConfig.pagination?.pageSize ?? 25;
    // Reset detail sort to default on each row selection
    this.detailSortColumn = '';
    this.detailSortOrder = 'ASC';
    this.detailTableConfig = {
      ...this.detailTableConfig,
      sortConfig: undefined,
      pagination: {
        ...this.detailTableConfig.pagination!,
        pageIndex: 0,
        totalRecords: row.quantity
      }
    };
    this.loadDetails(row);
  }

  private loadDetails(summaryRow: OutdatesSummaryItem): void {
    this.loadingDetails.set(true);

    const outdateValue = this.searchForm.get('outdateAsOf')?.value;
    const outdateMoment = moment.isMoment(outdateValue) ? outdateValue.clone() : moment(outdateValue);
    const chapterNow = this.chapterTimezoneService.chapterLocalDate();
    if (chapterNow?.isValid()) {
      outdateMoment.hours(chapterNow.hours()).minutes(chapterNow.minutes()).seconds(0).milliseconds(0);
    }

    const request: OutdatesDetailRequest = {
      outdateAsOf: outdateMoment.format('YYYY-MM-DDTHH:mm:ss'),
      productType: summaryRow.productType,
      bloodType: summaryRow.bloodType,
      inventoryClass: this.searchForm.get('inventoryClass')?.value || undefined,
      sortColumn: this.detailSortColumn || undefined,
      sortOrder: this.detailSortColumn ? this.detailSortOrder : undefined
    };

    this.service.getDetails(request, this.detailPageSize, this.detailPageIndex * this.detailPageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingDetails.set(false);
          const items = response.data || response.item || [];
          this.detailData.set(Array.isArray(items) ? items : []);
        },
        error: () => {
          this.loadingDetails.set(false);
          this.detailData.set([]);
          this.snackBar.open('Failed to load detail data', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onClearAll(): void {
    this.summaryData.set([]);
    this.detailData.set([]);
    this.totalOutdates.set(0);
    this.detailTotalRecords.set(0);
    this.selectedSummaryRow.set(null);
    this.hasSearched.set(false);
    this.loading.set(false);
    this.loadingDetails.set(false);
    this.hasCommitted.set(false);
    this.committedPickSlipId.set(null);
    this.lastSummaryRequestBase = null;
    // Reset summary sort
    this.summarySortColumn = null;
    this.summarySortOrder = 'ASC';
    this.summaryTableConfig = { ...this.summaryTableConfig, sortConfig: undefined };
    // Reset detail sort
    this.detailPageIndex = 0;
    this.detailSortColumn = '';
    this.detailSortOrder = 'ASC';
    this.detailTableConfig = {
      ...this.detailTableConfig,
      sortConfig: undefined,
      pagination: {
        ...this.detailTableConfig.pagination!,
        pageIndex: 0,
        totalRecords: 0
      }
    };
    // Re-fill date with current chapter local date
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    const resetDate = chapterDate?.isValid() ? chapterDate.clone() : null;
    this.searchForm.reset({ outdateAsOf: resetDate, inventoryClass: '' });
  }

  onPrintPickSlip(): void {
    const outdateValue = this.searchForm.get('outdateAsOf')?.value;
    if (!outdateValue) return;

    this.isPrinting.set(true);
    const outdateMoment = moment.isMoment(outdateValue) ? outdateValue.clone() : moment(outdateValue);
    const chapterNow = this.chapterTimezoneService.chapterLocalDate();
    if (chapterNow?.isValid()) {
      outdateMoment.hours(chapterNow.hours()).minutes(chapterNow.minutes()).seconds(0).milliseconds(0);
    }

    const request: CommitOutdatesRequest = {
      outdateAsOf: outdateMoment.format('YYYY-MM-DDTHH:mm:ss'),
      inventoryClass: this.searchForm.get('inventoryClass')?.value || undefined
    };

    this.service.commitOutdates(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.data || response.item;
          if (data?.pickSlipId) {
            this.committedPickSlipId.set(data.pickSlipId);
            this.hasCommitted.set(true);
          }
          if (data && data.reportStatus === 'QUEUED' && data.reportParmId) {
            this.snackBar.open(
              `Pick slip ${data.pickSlipId} created — Generating report...`,
              'DISMISS',
              { duration: 10000, horizontalPosition: 'end', verticalPosition: 'top' }
            );
            this.pollAndOpenReport(data);
          } else {
            this.isPrinting.set(false);
            if (data) {
              const reportMsg = data.reportStatus === 'FAILED'
                ? ` — Report failed: ${data.reportMessage || 'Unknown error'}`
                : '';
              this.snackBar.open(
                `Pick slip ${data.pickSlipId} created — ${data.productCount} product(s) committed (Order: ${data.orderNo})${reportMsg}`,
                'DISMISS',
                { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' }
              );
            } else {
              this.snackBar.open('Outdates committed successfully', 'DISMISS', {
                duration: 3000, horizontalPosition: 'end', verticalPosition: 'top'
              });
            }
          }
        },
        error: (error) => {
          this.isPrinting.set(false);
          const msg = error.error?.message || 'Failed to commit outdated products';
          this.snackBar.open(msg, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onSummarySortChange(event: TableSortEvent): void {
    this.summaryTableConfig = {
      ...this.summaryTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    if (event.direction === 'default') {
      this.summarySortColumn = null;
      this.summarySortOrder = 'ASC';
    } else {
      this.summarySortColumn = event.column;
      this.summarySortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    }
    this.loading.set(true);
    this.loadSummary();
  }

  onDetailPageChange(event: TablePageEvent): void {
    this.detailPageIndex = event.pageIndex;
    this.detailPageSize = event.pageSize;
    if (this.detailTableConfig.pagination) {
      this.detailTableConfig.pagination.pageIndex = event.pageIndex;
      this.detailTableConfig.pagination.pageSize = event.pageSize;
    }
    const selectedRow = this.selectedSummaryRow();
    if (selectedRow) {
      this.loadDetails(selectedRow);
    }
  }

  onDetailSortChange(event: TableSortEvent): void {
    if (event.direction === 'default') {
      this.detailSortColumn = '';
      this.detailSortOrder = 'ASC';
    } else {
      this.detailSortColumn = event.column;
      this.detailSortOrder = event.direction === 'D' ? 'DESC' : 'ASC';
    }
    this.detailTableConfig = {
      ...this.detailTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
      pagination: {
        ...this.detailTableConfig.pagination!,
        pageIndex: 0
      }
    };
    this.detailPageIndex = 0;
    const selectedRow = this.selectedSummaryRow();
    if (selectedRow) {
      this.loadDetails(selectedRow);
    }
  }

  private pollAndOpenReport(data: CommitOutdatesResponse): void {
    const reportName = 'SCROUTDT';
    this.service.pollReportUntilComplete(reportName, data.reportParmId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statusResponse) => {
          const status = statusResponse?.item?.statusCode;
          if (status === 'C') {
            const userName = this.loginService.getStoredUsername();
            this.service.getReportUrl(data.reportParmId!, reportName, userName)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (urlResponse) => {
                  this.isPrinting.set(false);
                  const report = urlResponse?.item || (urlResponse as any)?.Item;
                  const fileName = report?.fileName || report?.FileName ||
                                   report?.outputFile || report?.OutputFile;
                  if (fileName) {
                    window.open(`/reports/${fileName}`, '_blank');
                    this.snackBar.open(
                      `Pick slip ${data.pickSlipId} — Report ready`,
                      'DISMISS',
                      { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' }
                    );
                  } else {
                    this.snackBar.open(
                      `Pick slip ${data.pickSlipId} created — Report completed but output file not available`,
                      'DISMISS',
                      { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' }
                    );
                  }
                },
                error: () => {
                  this.isPrinting.set(false);
                  this.snackBar.open(
                    `Pick slip ${data.pickSlipId} created — Report completed but failed to get URL`,
                    'DISMISS',
                    { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' }
                  );
                }
              });
          } else {
            this.isPrinting.set(false);
            this.snackBar.open(
              `Pick slip ${data.pickSlipId} created — Report processing timed out. Check Report Actions.`,
              'DISMISS',
              { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' }
            );
          }
        },
        error: () => {
          this.isPrinting.set(false);
          this.snackBar.open(
            `Pick slip ${data.pickSlipId} created — Could not check report status`,
            'DISMISS',
            { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' }
          );
        }
      });
  }

  private formatDateTime(value: string): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }
}
