import { Component, OnInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject, takeUntil, debounceTime, finalize } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { UppercaseMomentDateAdapter, DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { ParentSponsorQueryService } from './services/parent-sponsor-query.service';
import {
  ParentSponsorLookup,
  ParentSponsorInfo,
  ConstituentSponsor,
  ConstituentSponsorStatistics,
  ConstituentSponsorTotals,
  MonthFilter,
  ShowDriveDataOption,
  MONTH_OPTIONS,
  SHOW_DRIVE_DATA_OPTIONS
} from './models/parent-sponsor-query.model';

@Component({
  selector: 'app-parent-sponsor-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './parent-sponsor-query.html',
  styleUrl: './parent-sponsor-query.scss'
})
export class ParentSponsorQueryComponent implements OnInit, OnDestroy {
  private readonly service = inject(ParentSponsorQueryService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);
  private destroy$ = new Subject<void>();

  // Fallback values from Figma
  private readonly DEFAULT_TITLE = 'Parent Sponsor Query';
  private readonly DEFAULT_SUBTITLE = 'View Parent Sponsor Query Details.';

  // Page Header - initialized with defaults, updated from API in ngOnInit
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Parent Sponsor Query', link: null }
    ],
    title: this.DEFAULT_TITLE,
    subtitle: this.DEFAULT_SUBTITLE,
    actions: []
  };

  // Form with date range validation
  // Note: UppercaseMomentDateAdapter handles date format validation internally
  filterForm = new FormGroup({
    parentSponsorId: new FormControl<string>(''),
    showDriveData: new FormControl<ShowDriveDataOption | null>(null),
    month: new FormControl<MonthFilter | null>(null),
    fromDate: new FormControl<Date | null>(null),
    toDate: new FormControl<Date | null>(null)
  }, {
    validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')]
  });
  sponsorSearchControl = new FormControl('');

  // Data
  parentSponsors: ParentSponsorLookup[] = [];
  filteredParentSponsors: ParentSponsorLookup[] = [];
  parentSponsorInfo: ParentSponsorInfo | null = null;
  dataSource: (ConstituentSponsor | ConstituentSponsorStatistics)[] = [];

  // Options
  monthOptions = MONTH_OPTIONS;
  showDriveDataOptions = SHOW_DRIVE_DATA_OPTIONS;

  // State
  isLoading = false;
  hasSearched = false;
  hasError = false;
  errorMessage = '';

  // Totals for footer (from Backend - ALL records)
  totals: ConstituentSponsorTotals | null = null;

  // Data Table Configuration
  tableConfig: DataTableConfig = {
    columns: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: undefined,
    stickyHeader: true,
    emptyMessage: 'No constituent sponsors found for this parent sponsor.',
    loadingMessage: 'Loading constituent sponsors...',
    showPagination: true
  };

  // Expose Math for template
  Math = Math;

  constructor() {
    // Reload on chapter change
    effect(() => {
      const chapterId = this.headerService.chapterId();
      if (chapterId) {
        this.loadParentSponsors();
      }
    });
  }

  ngOnInit(): void {
    this.loadPageHeaderFromMenu();
    this.setupSponsorSearch();
    this.setupMonthChange();
    this.initializeTableColumns();
    // Note: loadParentSponsors() is called via effect() when chapterId changes
  }

  private loadPageHeaderFromMenu(): void {
    const currentPath = this.router.url.split('?')[0];
    const menuItem = this.menuService.findMenuItemByPath(currentPath);

    const title = menuItem?.label || this.DEFAULT_TITLE;
    const subtitle = menuItem?.remarks || this.DEFAULT_SUBTITLE;

    this.headerConfig = {
      ...this.headerConfig,
      title,
      subtitle,
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null }
      ]
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadParentSponsors(): void {
    this.service.getParentSponsorsLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sponsors) => {
          this.parentSponsors = sponsors;
          this.filteredParentSponsors = sponsors;
        },
        error: (err) => {
          console.error('Error loading parent sponsors:', err);
        }
      });
  }

  private setupSponsorSearch(): void {
    this.sponsorSearchControl.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(search => {
      this.filteredParentSponsors = this.parentSponsors.filter(s =>
        s.sponsorName.toLowerCase().includes((search || '').toLowerCase()) ||
        s.sponsorId.toLowerCase().includes((search || '').toLowerCase())
      );
    });
  }

  private setupMonthChange(): void {
    this.filterForm.get('month')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(month => {
      if (month !== null && month !== undefined && month !== MonthFilter.None) {
        const { fromDate, toDate } = this.calculateDateRange(month);
        this.filterForm.patchValue({ fromDate, toDate }, { emitEvent: false });
      }
    });
  }

  private calculateDateRange(month: MonthFilter): { fromDate: Date | null; toDate: Date | null } {
    const year = new Date().getFullYear();

    if (month === MonthFilter.Yearly) {
      return { fromDate: new Date(year, 0, 1), toDate: new Date(year, 11, 31) };
    }

    if (month >= MonthFilter.January && month <= MonthFilter.December) {
      const monthIndex = month - 1; // January = 1, so index = 0
      return {
        fromDate: new Date(year, monthIndex, 1),
        toDate: new Date(year, monthIndex + 1, 0) // Last day of month
      };
    }

    return { fromDate: null, toDate: null };
  }

  private initializeTableColumns(): void {
    this.updateTableColumns();
  }

  private updateTableColumns(): void {
    const isDetailed = this.filterForm.value.showDriveData === ShowDriveDataOption.Yes;

    const simpleColumns: TableColumn[] = [
      {
        key: 'constituentSponsor',
        header: 'Constituent Sponsors',
        sortable: true,
        width: '40%'
      },
      {
        key: 'sponsorId',
        header: 'Sponsor ID',
        sortable: false,
        width: '30%'
      },
      {
        key: 'recruiter',
        header: 'Recruiter',
        sortable: false,
        width: '30%',
        valueFormatter: (value: any) => value || '-'
      }
    ];

    const detailedColumns: TableColumn[] = [
      {
        key: 'constituentSponsor',
        header: 'Constituent Sponsors',
        sortable: true,
        width: '18%'
      },
      {
        key: 'sponsorId',
        header: 'Sponsor ID',
        sortable: false,
        width: '12%'
      },
      {
        key: 'recruiter',
        header: 'Recruiter',
        sortable: false,
        width: '12%',
        valueFormatter: (value: any) => value || '-'
      },
      {
        key: 'donorBase',
        header: 'Donor Base',
        sortable: false,
        width: '10%',
        valueFormatter: (value: any) => value !== null && value !== undefined ? value.toLocaleString() : '-'
      },
      {
        key: 'drives',
        header: 'Drives',
        sortable: false,
        width: '8%',
        valueFormatter: (value: any) => this.formatNumber(value)
      },
      {
        key: 'historicalPenetration',
        header: 'Historical Penetration %',
        sortable: false,
        width: '14%',
        valueFormatter: (value: any) => this.formatNumber(value)
      },
      {
        key: 'actualDraw',
        header: 'Actual Draw',
        sortable: false,
        width: '10%',
        valueFormatter: (value: any) => this.formatNumber(value)
      },
      {
        key: 'historicalProjDeferrals',
        header: 'Historical Projected Deferrals %',
        sortable: false,
        width: '16%',
        valueFormatter: (value: any) => this.formatNumber(value)
      }
    ];

    this.tableConfig = {
      ...this.tableConfig,
      columns: isDetailed ? detailedColumns : simpleColumns
    };
  }

  onParentSponsorChange(sponsorId: string): void {
    if (sponsorId) {
      this.service.getParentSponsorInfo(sponsorId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (info) => {
          this.parentSponsorInfo = info;
        },
        error: (err) => {
          console.error('Error loading parent sponsor info:', err);
          this.parentSponsorInfo = null;
        }
      });
    } else {
      this.parentSponsorInfo = null;
    }
  }

  onRetrieve(): void {
    const parentSponsorId = this.filterForm.value.parentSponsorId;
    if (!parentSponsorId) {
      return;
    }

    // Mark date fields as touched to show validation errors
    this.filterForm.get('fromDate')?.markAsTouched();
    this.filterForm.get('toDate')?.markAsTouched();

    // Check for date validation errors before proceeding
    if (this.filterForm.invalid) {
      return;
    }

    // Update columns based on showDriveData selection
    this.updateTableColumns();

    // Reset pagination
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0
      }
    };

    this.loadData();
  }

  private loadData(): void {
    const formValue = this.filterForm.value;
    const pagination = this.tableConfig.pagination!;

    this.isLoading = true;
    this.hasSearched = true;
    this.hasError = false;

    // Note: month is not sent to API - it's a UI-only field that calculates fromDate/toDate
    // This matches the original Oracle Forms behavior
    this.service.getConstituentSponsors(
      pagination.pageSize,
      pagination.pageIndex * pagination.pageSize,
      {
        parentSponsorId: formValue.parentSponsorId || '',
        showDriveData: formValue.showDriveData ?? ShowDriveDataOption.No,
        fromDate: DateFieldValidationUtility.serializeDateForApi(formValue.fromDate) ?? undefined,
        toDate: DateFieldValidationUtility.serializeDateForApi(formValue.toDate) ?? undefined,
        sortDirection: this.tableConfig.sortConfig?.direction === 'A' ? 'ASC' :
                       this.tableConfig.sortConfig?.direction === 'D' ? 'DESC' : undefined
      }
    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (result) => {
        this.dataSource = result.data;
        this.totals = result.totals || null;

        // Update pagination with total records
        this.tableConfig = {
          ...this.tableConfig,
          pagination: {
            ...this.tableConfig.pagination!,
            totalRecords: result.total
          }
        };
      },
      error: (err) => {
        this.hasError = true;
        this.errorMessage = err.error?.message || 'Error loading constituent sponsors';
        this.dataSource = [];
        this.totals = null;
      }
    });
  }

  onPageChange(event: TablePageEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize
      }
    };
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction
      }
    };

    if (this.hasSearched) {
      this.loadData();
    }
  }

  get isDetailedMode(): boolean {
    return this.filterForm.value.showDriveData === ShowDriveDataOption.Yes;
  }

  /**
   * Validates date input on blur.
   * Sets invalidDateFormat error if input has text but control value is null (parse failed).
   * @param controlName - The form control name ('fromDate' or 'toDate')
   * @param inputElement - The native input element reference
   */
  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();

    // If input has text but control value is null, parsing failed (invalid date)
    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  /**
   * Get error message for From Date field.
   * Handles invalid date format errors (e.g., 29-FEB-2026).
   */
  getFromDateError(): string {
    const control = this.filterForm.get('fromDate');

    // Check control-level errors - show immediately when control has errors
    if (control?.hasError('invalidDateFormat') ||
        control?.hasError('invalidDate') ||
        control?.hasError('matDatepickerParse')) {
      return 'From Date is invalid';
    }

    return '';
  }

  /**
   * Get error message for To Date field.
   * Handles invalid date format and date range errors.
   */
  getToDateError(): string {
    const control = this.filterForm.get('toDate');

    // Check control-level errors first - show immediately when control has errors
    if (control?.hasError('invalidDateFormat') ||
        control?.hasError('invalidDate') ||
        control?.hasError('matDatepickerParse')) {
      return 'To Date is invalid';
    }

    // Check form-level date range error (show immediately when both dates have values)
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    if (fromDate && toDate && this.filterForm.errors?.['dateRangeInvalid']) {
      return "'To Date' must be greater or equal to 'From Date'";
    }

    return '';
  }

  formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString();
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0';
    return value.toString();
  }
}
