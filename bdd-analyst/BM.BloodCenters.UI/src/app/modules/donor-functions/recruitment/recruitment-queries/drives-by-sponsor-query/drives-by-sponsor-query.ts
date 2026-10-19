import { Component, OnInit, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject, takeUntil, debounceTime, finalize } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableRowActionEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UppercaseMomentDateAdapter, DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { DrivesBySponsorQueryService } from './services/drives-by-sponsor-query.service';
import {
  SponsorLookup,
  SponsorDetails,
  SponsorDrive,
  SponsorDriveTotals,
  DRIVE_STATUS_OPTIONS
} from './models/drives-by-sponsor-query.model';
import { SponsorInstructionsDialog } from './sponsor-instructions-dialog/sponsor-instructions-dialog.component';
import { AboSpreadBySponsorDialogComponent } from '@shared/components/abo-spread-by-sponsor-dialog/abo-spread-by-sponsor-dialog';

@Component({
  selector: 'app-drives-by-sponsor-query',
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
    MatCardModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './drives-by-sponsor-query.html',
  styleUrl: './drives-by-sponsor-query.scss'
})
export class DrivesBySponsorQuery implements OnInit, OnDestroy {
  private readonly service = inject(DrivesBySponsorQueryService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private destroy$ = new Subject<void>();

  // Fallback values
  private readonly DEFAULT_TITLE = 'Drives by Sponsor Query';
  private readonly DEFAULT_SUBTITLE = 'Access a consolidated view of drive activity associated with a selected sponsor.';

  // Page Header
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Drives by Sponsor Query', link: null }
    ],
    title: this.DEFAULT_TITLE,
    subtitle: this.DEFAULT_SUBTITLE,
    actions: []
  };

  // Form with date range validation
  filterForm = new FormGroup({
    sponsorId: new FormControl<string>('', [Validators.required]),
    sponsorName: new FormControl<string>({ value: '', disabled: true }),
    status: new FormControl<string>('CNFRM'), // Default to Confirmed
    fromDate: new FormControl<Date | null>(null),
    toDate: new FormControl<Date | null>(null)
  }, {
    validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')]
  });
  sponsorSearchControl = new FormControl('');

  // Data
  sponsors = signal<SponsorLookup[]>([]);
  filteredSponsors = signal<SponsorLookup[]>([]);
  sponsorDetails = signal<SponsorDetails | null>(null);
  dataSource = signal<SponsorDrive[]>([]);
  totals = signal<SponsorDriveTotals | null>(null);

  // Options
  driveStatusOptions = DRIVE_STATUS_OPTIONS;

  // State
  isLoading = signal<boolean>(false);
  isLoadingSponsors = signal<boolean>(false);
  hasSearched = signal<boolean>(false);

  // Data Table Configuration
  tableConfig: DataTableConfig<SponsorDrive> = {
    columns: [
      {
        key: 'driveId',
        header: 'Drive ID',
        sortable: true,
        width: '10%'
      },
      {
        key: 'driveDate',
        header: 'Date',
        sortable: false,
        width: '10%',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'locationDescription',
        header: 'Location',
        sortable: false,
        width: '20%',
        truncate: true
      },
      {
        key: 'driveType',
        header: 'Type',
        sortable: false,
        width: '8%',
        cellClass: 'text-center',
        valueFormatter: (value) => this.formatDriveType(value)
      },
      {
        key: 'projectedShow',
        header: 'Projected Show',
        sortable: false,
        width: '12%',
        type: 'number',
        cellClass: 'text-center'
      },
      {
        key: 'projectedDraw',
        header: 'Projected Draw',
        sortable: false,
        width: '12%',
        type: 'number',
        cellClass: 'text-center'
      },
      {
        key: 'actualCredits',
        header: 'Actual Credit',
        sortable: false,
        width: '10%',
        type: 'number',
        cellClass: 'text-center'
      },
      {
        key: 'actualDraw',
        header: 'Actual Draw',
        sortable: false,
        width: '10%',
        type: 'number',
        cellClass: 'text-center'
      },
      {
        key: 'deferralCount',
        header: 'Actual Deferral',
        sortable: false,
        width: '10%',
        type: 'number',
        cellClass: 'text-center'
      },
      {
        key: 'deferralPercentage',
        header: 'Percentage of Deferrals',
        sortable: false,
        width: '12%',
        type: 'number',
        cellClass: 'text-center',
        valueFormatter: (value) => this.formatPercentage(value)
      }
    ],
    rowActions: [
      {
        icon: 'info',
        label: 'Show Instructions',
        ariaLabel: 'View drive instructions',
        action: 'show-instructions'
      },
      {
        icon: 'visibility',
        label: 'Drive Details',
        ariaLabel: 'View drive details',
        action: 'drive-details'
      },
      {
        icon: 'biotech',
        label: 'ABO Spread',
        ariaLabel: 'View ABO spread',
        action: 'abo-spread'
      },
      {
        icon: 'checklist',
        label: 'Drive Checklist',
        ariaLabel: 'View drive checklist',
        action: 'drive-checklist'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'driveId',
      direction: 'default'
    },
    stickyHeader: true,
    emptyMessage: 'No Sponsor Selected',
    emptySubMessage: 'Please select a sponsor ID to view associated drive records.',
    loadingMessage: 'Loading sponsor drives...',
    showPagination: true,
    showActionsAsMenu: true,
    stickyActionsColumn: true
  };

  // Expose Math for template
  Math = Math;

  constructor() {
    // Reload on chapter change
    effect(() => {
      const chapterId = this.headerService.chapterId();
      if (chapterId) {
        this.loadSponsors();
      }
    });
  }

  ngOnInit(): void {
    this.loadPageHeaderFromMenu();
    this.setupSponsorSearch();
    this.loadSponsors();
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

  private loadSponsors(): void {
    this.isLoadingSponsors.set(true);
    this.service.getSponsorsLookup()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingSponsors.set(false))
      )
      .subscribe({
        next: (sponsors) => {
          this.sponsors.set(sponsors);
          this.filteredSponsors.set(sponsors);
        },
        error: (err) => {
          console.error('Error loading sponsors:', err);
        }
      });
  }

  private setupSponsorSearch(): void {
    this.sponsorSearchControl.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(search => {
      const searchLower = (search || '').toLowerCase();
      this.filteredSponsors.set(
        this.sponsors().filter(s =>
          s.description.toLowerCase().includes(searchLower) ||
          s.code.toLowerCase().includes(searchLower)
        )
      );
    });
  }

  onSponsorChange(sponsorId: string): void {
    if (sponsorId) {
      const selectedSponsor = this.sponsors().find(s => s.code === sponsorId);
      if (selectedSponsor) {
        // Extract only the name part after " - " from description
        const namePart = selectedSponsor.description.includes(' - ')
          ? selectedSponsor.description.split(' - ')[1]
          : selectedSponsor.description;

        this.filterForm.patchValue({
          sponsorName: namePart
        }, { emitEvent: false });
      }
    } else {
      this.filterForm.patchValue({
        sponsorName: ''
      }, { emitEvent: false });
    }
  }

  /**
   * Handle sponsor dropdown opened/closed to mark as touched
   */
  onSponsorOpenedChange(): void {
    // Mark as touched when dropdown is interacted with (opened or closed)
    this.filterForm.get('sponsorId')?.markAsTouched();
  }

  onRetrieve(): void {
    // Mark all fields as touched to show validation errors
    this.filterForm.get('sponsorId')?.markAsTouched();
    this.filterForm.get('fromDate')?.markAsTouched();
    this.filterForm.get('toDate')?.markAsTouched();

    const sponsorId = this.filterForm.value.sponsorId;
    if (!sponsorId) {
      return;
    }

    // Check for date validation errors before proceeding
    if (this.filterForm.invalid) {
      return;
    }

    // Reset pagination
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0
      }
    };

    // Fetch sponsor details
    this.service.getSponsorDetails(sponsorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.sponsorDetails.set(details);
        },
        error: (error) => {
          console.error('Error loading sponsor details:', error);
          this.sponsorDetails.set(null);
        }
      });

    this.loadData();
  }

  private loadData(): void {
    const formValue = this.filterForm.value;
    const pagination = this.tableConfig.pagination!;
    const sortConfig = this.tableConfig.sortConfig;

    // Convert sort direction to API format: 'A', 'D', or null
    let sort: 'A' | 'D' | null = null;
    if (sortConfig && sortConfig.column === 'driveId' && sortConfig.direction !== 'default') {
      sort = sortConfig.direction as 'A' | 'D';
    }

    this.isLoading.set(true);
    this.hasSearched.set(true);

    this.service.searchSponsorDrives(
      pagination.pageSize,
      pagination.pageIndex * pagination.pageSize,
      {
        sponsorId: formValue.sponsorId || '',
        status: formValue.status || 'CNFRM',
        fromDate: DateFieldValidationUtility.serializeDateForApi(formValue.fromDate) ?? undefined,
        toDate: DateFieldValidationUtility.serializeDateForApi(formValue.toDate) ?? undefined,
        sort: sort
      }
    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (result) => {
        this.dataSource.set(result.drives);
        this.totals.set(result.totals);

        // Update pagination and empty message based on results
        this.tableConfig = {
          ...this.tableConfig,
          pagination: {
            ...this.tableConfig.pagination!,
            totalRecords: result.total
          },
          emptyMessage: result.drives.length === 0 ? 'No Drives Found' : 'No Sponsor Selected',
          emptySubMessage: result.drives.length === 0
            ? 'No drive records found for the selected sponsor and filters.'
            : 'Please select a sponsor ID to view associated drive records.'
        };
      },
      error: (err) => {
        console.error('Error loading sponsor drives:', err);
        // authInterceptor already showed error snackbar, clear data
        this.dataSource.set([]);
        this.totals.set(null);
        // Update pagination to reflect no results
        this.tableConfig = {
          ...this.tableConfig,
          pagination: {
            ...this.tableConfig.pagination!,
            totalRecords: 0
          }
        };
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
    // Reset to first page when sorting changes
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: {
        column: event.column,
        direction: event.direction
      },
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: 0
      }
    };
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<SponsorDrive>): void {
    switch (event.action) {
      case 'show-instructions':
        this.onShowInstructions();
        break;
      case 'drive-details':
        this.onShowDetails(event.row);
        break;
      case 'abo-spread':
        this.openAboSpread();
        break;
      case 'drive-checklist':
        // TODO: Implement drive checklist
        console.log('Drive Checklist for:', event.row.driveId);
        break;
    }
  }

  private onShowInstructions(): void {
    const sponsorId = this.filterForm.value.sponsorId;
    if (!sponsorId) {
      return;
    }

    this.service.getSponsorInstructions(sponsorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (instructions) => {
          // Check if instructions array is empty
          if (!instructions || instructions.length === 0) {
            this.snackbarService.showError('Error 11262: No sponsor preferences found');
            return;
          }

          this.dialog.open(SponsorInstructionsDialog, {
            width: '50vw',
            height: '100vh',
            maxWidth: '90vw',
            disableClose: false,
            panelClass: 'right-side-dialog',
            position: { right: '0', top: '0' },
            data: {
              sponsorId,
              instructions
            }
          });
        },
        error: (error) => {
          console.error('Error loading sponsor instructions:', error);
          // Check if error message contains 11262
          const errorMessage = error?.error?.message || error?.message || '';
          if (errorMessage.includes('11262')) {
            this.snackbarService.showError('Error 11262: No sponsor preferences found');
          } else {
            this.snackbarService.showError('Error loading sponsor instructions');
          }
        }
      });
  }

  private onShowDetails(drive: SponsorDrive): void {
    // TODO: Implement drive details dialog
    console.log('Show Details for:', drive.driveId);
  }

  private openAboSpread(): void {
    const sponsorId = this.filterForm.value.sponsorId || '';
    this.dialog.open(AboSpreadBySponsorDialogComponent, {
      width: '960px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        sponsorId,
        chapterId: this.headerService.chapterId(),
      },
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }

  /**
   * Validates date input on blur and handles shorthand date entry.
   * Supports DDMMYY format (e.g., "301126" -> "30-NOV-2026").
   * Sets invalidDateFormat error if input has text but control value is null (parse failed).
   */
  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();

    // Auto-format shorthand date entry (DDMMYY format - 6 digits)
    if (inputValue && /^\d{6}$/.test(inputValue)) {
      const day = inputValue.substring(0, 2);
      const month = inputValue.substring(2, 4);
      const year = '20' + inputValue.substring(4, 6); // Assume 20xx century

      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthIndex = parseInt(month, 10) - 1;

      if (monthIndex >= 0 && monthIndex < 12) {
        const formattedDate = `${day}-${monthNames[monthIndex]}-${year}`;
        const parsedDate = moment(formattedDate, 'DD-MMM-YYYY', true);

        if (parsedDate.isValid()) {
          control?.setValue(parsedDate.toDate());
          inputElement.value = formattedDate;
          return;
        }
      }
    }

    // If input has text but control value is null, parsing failed (invalid date)
    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  /**
   * Get error message for Sponsor ID field.
   */
  getSponsorIdError(): string {
    const control = this.filterForm.get('sponsorId');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Sponsor ID is required';
    }

    return '';
  }

  /**
   * Get error message for From Date field.
   */
  getFromDateError(): string {
    const control = this.filterForm.get('fromDate');

    if (control?.hasError('invalidDateFormat') ||
        control?.hasError('invalidDate') ||
        control?.hasError('matDatepickerParse')) {
      return 'From Date is invalid';
    }

    return '';
  }

  /**
   * Get error message for To Date field.
   */
  getToDateError(): string {
    const control = this.filterForm.get('toDate');

    // Check control-level errors first
    if (control?.hasError('invalidDateFormat') ||
        control?.hasError('invalidDate') ||
        control?.hasError('matDatepickerParse')) {
      return 'To Date is invalid';
    }

    // Check form-level date range error
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    if (fromDate && toDate && this.filterForm.errors?.['dateRangeInvalid']) {
      return "To Date cannot be before From Date";
    }

    return '';
  }

  get isRetrieveDisabled(): boolean {
    return this.isLoading() ||
           !this.filterForm.value.sponsorId ||
           this.filterForm.invalid;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  }

  formatDriveType(value: string): string {
    if (!value) return '';
    const typeMap: Record<string, string> = {
      'F': 'Fixed',
      'C': 'Community',
      'I': 'Inactive'
    };
    return typeMap[value.toUpperCase()] || value;
  }

  formatPercentage(value: number): string {
    if (value === null || value === undefined) return '0';
    return value.toString();
  }

  formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    // Return original if not 10 digits
    return phone;
  }
}
