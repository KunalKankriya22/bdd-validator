import { Component, OnInit, OnDestroy, AfterViewInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { DrawQueryService } from './services/draw-query.service';
import { ROUTES } from '../../../../../core/constants/route.constants';
import {
  DriveProjectionSummary,
  DriveProjectionRequest,
  DonationType
} from './models/draw-query.model';
import { DrawDetailsDialog, DrawDetailsDialogData } from './components/draw-details-dialog/draw-details-dialog';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DrawQueryFooter, DrawQueryFooterData } from './components/draw-query-footer/draw-query-footer';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { CollectionStatistics } from '../../../collection-statistics/collection-statistics';
import { SiteCollectionStatisticsDialog } from '@shared/components/site-collection-statistics-dialog/site-collection-statistics-dialog';
import { SiteCollectionStatisticsDialogData } from '@shared/models/site-collection-statistics.model';

@Component({
  selector: 'app-draw-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    DrawQueryFooter
  ],
  templateUrl: './draw-query.html',
  styleUrls: ['./draw-query.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
})
export class DrawQuery implements OnInit, OnDestroy, AfterViewInit {
  private fb = inject(FormBuilder);
  private drawQueryService = inject(DrawQueryService);
  private pageHeaderService = inject(PageHeaderService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private chapterTimezoneService = inject(ChapterTimezoneService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<DriveProjectionSummary> = {
    columns: [
      {
        key: 'driveDate',
        header: 'Date',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'driveDay',
        header: 'Day of week',
        sortable: false,
        type: 'text',
        width: '120px',
        valueFormatter: (value) => this.getFullDayName(value)
      },
      {
        key: 'goal',
        header: 'Goal',
        sortable: false,
        type: 'number',
        width: '80px',
        cellClass: 'text-center'
      },
      {
        key: 'numberOfDrives',
        header: 'Number of Drives',
        sortable: false,
        type: 'number',
        width: '120px',
        cellClass: 'text-center'
      },
      {
        key: 'projectedShow',
        header: 'Projected Show',
        sortable: false,
        type: 'number',
        width: '120px',
        cellClass: 'text-center'
      },
      {
        key: 'projectedDraw',
        header: 'Projected Draw',
        sortable: false,
        type: 'number',
        width: '120px',
        cellClass: 'text-center'
      },
      {
        key: 'projectedDeferral',
        header: 'Projected Deferral',
        sortable: false,
        type: 'number',
        width: '140px',
        cellClass: 'text-center'
      },
      {
        key: 'deferralPercent',
        header: 'Projected Deferrals %',
        sortable: false,
        type: 'number',
        width: '100px',
        cellClass: 'text-center',
        valueFormatter: (value) => this.formatPercent(value)
      },
      {
        key: 'actualDraw',
        header: 'Actual Draw',
        sortable: false,
        type: 'number',
        width: '100px',
        cellClass: 'text-center'
      },
      {
        key: 'actualDeferral',
        header: 'Actual Deferrals',
        sortable: false,
        type: 'number',
        width: '120px',
        cellClass: 'text-center'
      },
      {
        key: 'actualDeferralPercent',
        header: 'Actual Deferrals %',
        sortable: false,
        type: 'number',
        width: '140px',
        cellClass: 'text-center',
        valueFormatter: (value) => this.formatPercent(value)
      },
      {
        key: 'prelab',
        header: 'Processed in Lab',
        sortable: false,
        type: 'number',
        width: '140px',
        cellClass: 'text-center'
      },
      {
        key: 'rnft',
        header: 'Not for Transfusion',
        sortable: false,
        type: 'number',
        width: '160px',
        cellClass: 'text-center'
      },
      {
        key: 'veni03',
        header: '03',
        sortable: false,
        type: 'number',
        width: '80px',
        cellClass: 'text-center'
      },
      {
        key: 'veni04',
        header: '04',
        sortable: false,
        type: 'number',
        width: '80px',
        cellClass: 'text-center'
      },
      {
        key: 'veni05',
        header: '05',
        sortable: false,
        type: 'number',
        width: '80px',
        cellClass: 'text-center'
      },
      {
        key: 'veni06',
        header: '06',
        sortable: false,
        type: 'number',
        width: '80px',
        cellClass: 'text-center'
      },
      {
        key: 'veni07',
        header: '07',
        sortable: false,
        type: 'number',
        width: '80px',
        cellClass: 'text-center'
      },
      {
        key: 'veniTotal',
        header: 'Total',
        sortable: false,
        type: 'number',
        width: '80px',
        cellClass: 'text-center'
      }
    ],
    rowActions: [
      {
        icon: 'event',
        label: 'Display Drives',
        ariaLabel: 'Display drives',
        action: 'display-drives'
      },
      {
        icon: 'analytics',
        label: 'Site Statistics',
        ariaLabel: 'View site statistics',
        action: 'site-statistics'
      },
      {
        icon: 'bar_chart',
        label: 'Collection Statistics',
        ariaLabel: 'View collection statistics',
        action: 'collection-statistics'
      }
    ],
    columnGroups: [
      {
        label: 'Venipuncture Code',
        startColumn: 'veni03',
        endColumn: 'veniTotal'
      }
    ],
    sortConfig: {
      column: '',
      direction: 'default'
    },
    stickyHeader: true,
    showActionsAsMenu: true,
    stickyActionsColumn: true,
    showPagination: false,
    emptyMessage: 'No Drive Selected',
    emptySubMessage: 'Please select a drive type to view draw query records',
  };

  filterForm!: FormGroup;
  donationTypes: DonationType[] = [];
  filteredDonationTypes: DonationType[] = [];
  donationTypeSearchControl = new FormControl<string>('');

  dataSource: DriveProjectionSummary[] = [];
  footerData: DrawQueryFooterData | null = null;
  errorMessage: string | null = null;

  isLoadingDropdowns = false;
  isLoadingData = false;
  filtersLocked = false;

  private destroy$ = new Subject<void>();

  // Drive type options (hardcoded based on common values)
  driveTypes = [
    { code: 'FIX', description: 'Fixed Drives' },
    { code: 'MOB', description: 'Mobile Drives' },
    { code: 'BOTH', description: 'All Drives' }
  ];
  filteredDriveTypes = [...this.driveTypes];
  driveTypeSearchControl = new FormControl<string>('');

  constructor() {
    this.initializeForm();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: ROUTES.HOME },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.setupSearchControls();
    this.subscribeToChapterChanges();
    this.checkAndReopenDialog();
    this.initializeFromDate();
  }

  /**
   * Subscribe to chapter change events from header
   * When chapter changes, clear all data and reset forms
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear all data and reset to initial state
        this.onClearAll();
      });
  }

  private setupSearchControls(): void {
    // Drive Type search
    this.driveTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredDriveTypes = this.driveTypes.filter((type) =>
          type.description.toLowerCase().includes(term) ||
          type.code.toLowerCase().includes(term)
        );
      });

    // Donation Type search
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredDonationTypes = this.donationTypes.filter((type) =>
          type.code.toLowerCase().includes(term)
        );
      });
  }

  ngAfterViewInit(): void {
    // No longer needed - footer scroll sync removed
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      driveType: ['BOTH', [Validators.required]],
      donationType: [''],
      fromDate: [null, [
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]],
      toDate: [null, [
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]]
    }, {
      validators: DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')
    });

    // Auto-populate To Date when From Date changes (From Date + 6 days)
    this.filterForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(fromDate => {
        const fromDateControl = this.filterForm.get('fromDate');
        if (fromDate && moment.isMoment(fromDate) && fromDate.isValid() && !fromDateControl?.hasError('matDatepickerParse')) {
          const toDate = fromDate.clone().add(6, 'days');
          this.filterForm.get('toDate')?.setValue(toDate, { emitEvent: false });
        } else {
          this.filterForm.get('toDate')?.setValue(null, { emitEvent: false });
        }
      });
  }


  private loadDropdowns(): void {
    this.isLoadingDropdowns = true;

    this.drawQueryService.getDonationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donationTypes) => {
          this.donationTypes = donationTypes;
          this.filteredDonationTypes = [...donationTypes];
          this.donationTypeSearchControl.setValue('', { emitEvent: false });
          this.isLoadingDropdowns = false;
        },
        error: (error) => {
          console.error('Error loading dropdowns:', error);
          this.isLoadingDropdowns = false;
        }
      });
  }

  get isRetrieveDisabled(): boolean {
    return this.isLoadingData ||
           !this.filterForm.value.fromDate ||
           !this.filterForm.value.toDate ||
           this.filterForm.invalid;
  }

  get isClearAllDisabled(): boolean {
    return (!this.filtersLocked && this.filterForm.pristine) || this.isLoadingData;
  }

  get selectedDriveTypeDescription(): string {
    const selectedCode = this.filterForm.get('driveType')?.value;
    const selectedType = this.driveTypes.find(type => type.code === selectedCode);
    return selectedType?.description || 'All Drives';
  }

  onRetrieve(): void {
    if (this.filterForm.invalid) {
      return;
    }

    this.loadDriveProjections();
  }

  onClearAll(): void {
    this.filterForm.enable({ emitEvent: false });
    this.filtersLocked = false;
    this.filterForm.reset({
      driveType: 'BOTH',
      donationType: '',
      fromDate: null,
      toDate: null
    });
    this.dataSource = [];
    this.footerData = null;
    this.errorMessage = null;
    this.driveTypeSearchControl.setValue('', { emitEvent: false });
    this.donationTypeSearchControl.setValue('', { emitEvent: false });
    this.initializeFromDate();
  }

  private initializeFromDate(): void {
    if (this.chapterTimezoneService.isChapterLocalDateAvailable()) {
      const today = this.chapterTimezoneService.getChapterLocalDate();
      this.filterForm.get('fromDate')?.setValue(today);
      // toDate is auto-populated via fromDate valueChanges subscription (fromDate + 6 days)
      this.filterForm.markAsPristine();
    }
  }

  onRowAction(event: TableRowActionEvent<DriveProjectionSummary>): void {
    switch (event.action) {
      case 'display-drives':
        this.onDisplayDrives(event.row);
        break;
      case 'site-statistics':
        this.onSiteStatistics(event.row);
        break;
      case 'collection-statistics':
        this.onCollectionStatistics(event.row);
        break;
    }
  }

  private checkAndReopenDialog(): void {
    const shouldRestore = sessionStorage.getItem('shouldRestoreDrawQuery');
    const storedDialogData = sessionStorage.getItem('drawDetailsDialogData');
    const storedFormData = sessionStorage.getItem('drawQueryFormData');
    const storedTableData = sessionStorage.getItem('drawQueryTableData');

    if (shouldRestore === 'true') {
      try {
        // Restore form data
        if (storedFormData) {
          const formData = JSON.parse(storedFormData);
          this.filterForm.patchValue({
            driveType: formData.driveType,
            donationType: formData.donationType,
            fromDate: formData.fromDate ? new Date(formData.fromDate) : null,
            toDate: formData.toDate ? new Date(formData.toDate) : null
          });
          // Mark form as dirty to enable Clear All button after restoration
          this.filterForm.markAsDirty();
        }

        // Restore table data
        if (storedTableData) {
          const tableData = JSON.parse(storedTableData);
          this.dataSource = tableData.dataSource || [];
          this.footerData = tableData.footerData || null;
        }

        // Reopen the dialog if dialog data exists
        if (storedDialogData) {
          const dialogData: DrawDetailsDialogData = JSON.parse(storedDialogData);

          // Use setTimeout to ensure the component is fully initialized
          setTimeout(() => {
            this.dialog.open(DrawDetailsDialog, {
              width: '85vw',
              height: '100vh',
              maxHeight: '100vh',
              position: { right: '0', top: '0' },
              data: dialogData,
              panelClass: 'draw-details-dialog-container',
              disableClose: true
            });
          }, 0);
        }

        // Clear all stored data
        sessionStorage.removeItem('shouldRestoreDrawQuery');
        sessionStorage.removeItem('drawDetailsDialogData');
        sessionStorage.removeItem('drawQueryFormData');
        sessionStorage.removeItem('drawQueryTableData');
      } catch (error) {
        console.error('Error restoring draw query state:', error);
        // Clear all on error
        sessionStorage.removeItem('shouldRestoreDrawQuery');
        sessionStorage.removeItem('drawDetailsDialogData');
        sessionStorage.removeItem('drawQueryFormData');
        sessionStorage.removeItem('drawQueryTableData');
      }
    }
  }

  private onDisplayDrives(row: DriveProjectionSummary): void {
    const driveType = this.filterForm.get('driveType')?.value || '';
    const dialogData: DrawDetailsDialogData = {
      driveDate: row.driveDate,
      driveDay: row.driveDay,
      numberOfDrives: row.numberOfDrives,
      driveType: driveType
    };

    // Store current form and table data in case user navigates to drive details query
    const formData = {
      driveType: this.filterForm.value.driveType,
      donationType: this.filterForm.value.donationType,
      fromDate: this.filterForm.value.fromDate?.toISOString(),
      toDate: this.filterForm.value.toDate?.toISOString()
    };
    const tableData = {
      dataSource: this.dataSource,
      footerData: this.footerData
    };
    sessionStorage.setItem('drawQueryFormData', JSON.stringify(formData));
    sessionStorage.setItem('drawQueryTableData', JSON.stringify(tableData));

    this.dialog.open(DrawDetailsDialog, {
      width: '85vw',
      height: '100vh',
      maxHeight: '100vh',
      position: { right: '0', top: '0' },
      data: dialogData,
      panelClass: 'draw-details-dialog-container',
      disableClose: true
    });
  }

  private onSiteStatistics(row: DriveProjectionSummary): void {
    const data: SiteCollectionStatisticsDialogData = {
      startDate: row.driveDate,
      endDate: row.driveDate
    };
    this.dialog.open(SiteCollectionStatisticsDialog, {
      width: '1400px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'collection-statistics-panel',
      data
    });
  }

  private onCollectionStatistics(_row: DriveProjectionSummary): void {
    this.dialog.open(CollectionStatistics, {
      width: '1440px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'collection-statistics-panel'
    });
  }

  private loadDriveProjections(): void {
    this.isLoadingData = true;
    this.errorMessage = null;

    const formValue = this.filterForm.getRawValue();
    const userId = this.headerService.headerConfig().user?.id || '';
    const chapterId = this.headerService.chapterId() || '';

    const request: DriveProjectionRequest = {
      fromDate: this.formatDateForApi(formValue.fromDate),
      toDate: this.formatDateForApi(formValue.toDate),
      loggedInUserName: userId,
      chapterId: chapterId
    };

    // Add optional filters only if they have values
    if (formValue.driveType) {
      request.driveType = formValue.driveType;
    }

    if (formValue.donationType) {
      request.donationType = formValue.donationType;
    }

    this.drawQueryService.getDriveProjections(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dataSource = data;
          this.calculateFooterTotals(data);
          this.isLoadingData = false;
          this.filterForm.disable({ emitEvent: false });
          this.filtersLocked = true;
        },
        error: (error) => {
          console.error('Error loading drive projections:', error);
          this.dataSource = [];
          this.footerData = null;
          this.isLoadingData = false;

          // Extract error message from API response
          if (error?.error?.errorResponse?.error) {
            this.errorMessage = error.error.errorResponse.error;
          } else if (error?.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error?.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'An error occurred while loading data';
          }
        }
      });
  }

  private calculateFooterTotals(data: DriveProjectionSummary[]): void {
    if (!data || data.length === 0) {
      this.footerData = null;
      return;
    }

    const totProjectedShow   = data.reduce((sum, row) => sum + (row.projectedShow || 0), 0);
    const totProjectedDraw   = data.reduce((sum, row) => sum + (row.projectedDraw || 0), 0);
    const totActualDraw      = data.reduce((sum, row) => sum + (row.actualDraw || 0), 0);
    const totActualDeferral  = data.reduce((sum, row) => sum + (row.actualDeferral || 0), 0);

    // Match Oracle: PERCENT_DFRL = 100*(SUM_P_SHOW - SUM_P_DRAW)/SUM_P_SHOW
    const deferralPct = totProjectedShow > 0
      ? 100 * (totProjectedShow - totProjectedDraw) / totProjectedShow
      : 0;
    // Match Oracle: ACT_DFRL_PERCENT = 100*(SUM_ACTL_DFRL/(SUM_ACTL_DFRL + SUM_ACTL_DRAW))
    const actualDeferralPct = (totActualDraw + totActualDeferral) > 0
      ? 100 * totActualDeferral / (totActualDraw + totActualDeferral)
      : 0;

    this.footerData = {
      recordCount: data.length,
      goal: data.reduce((sum, row) => sum + (row.goal || 0), 0),
      numberOfDrives: data.reduce((sum, row) => sum + (row.numberOfDrives || 0), 0),
      projectedShow: totProjectedShow,
      projectedDraw: totProjectedDraw,
      projectedDeferral: data.reduce((sum, row) => sum + (row.projectedDeferral || 0), 0),
      deferralPercent: this.formatPercent(deferralPct),
      actualDraw: totActualDraw,
      actualDeferral: totActualDeferral,
      actualDeferralPercent: this.formatPercent(actualDeferralPct),
      prelab: data.reduce((sum, row) => sum + (row.prelab || 0), 0),
      rnft: data.reduce((sum, row) => sum + (row.rnft || 0), 0),
      veni03: data.reduce((sum, row) => sum + (row.veni03 || 0), 0),
      veni04: data.reduce((sum, row) => sum + (row.veni04 || 0), 0),
      veni05: data.reduce((sum, row) => sum + (row.veni05 || 0), 0),
      veni06: data.reduce((sum, row) => sum + (row.veni06 || 0), 0),
      veni07: data.reduce((sum, row) => sum + (row.veni07 || 0), 0),
      veniTotal: data.reduce((sum, row) => sum + (row.veniTotal || 0), 0)
    };
  }

  private formatDateForApi(date: any): string {
    if (!date) return '';
    // Handle both moment objects and Date objects
    if (date._isAMomentObject) {
      return date.format('YYYY-MM-DD');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const m = moment(datePart, 'YYYY-MM-DD', true);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  formatPercent(value: number): string {
    if (value === null || value === undefined) return '0.00';
    return value.toFixed(2);
  }

  private getFullDayName(shortDay: string): string {
    if (!shortDay) return '';
    const dayMap: { [key: string]: string } = {
      'Mon': 'Monday',
      'Tue': 'Tuesday',
      'Wed': 'Wednesday',
      'Thu': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday',
      'Sun': 'Sunday'
    };
    return dayMap[shortDay] || shortDay;
  }

  /**
   * Handle input for From Date field
   */
  onFromDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(inputValue, this.filterForm.get('fromDate'));
  }

  /**
   * Handle input for To Date field
   */
  onToDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(inputValue, this.filterForm.get('toDate'));
  }

  /**
   * Validates date input on blur.
   * Handles auto-formatting for DDMMYY format (e.g., 211126 -> 21-NOV-2026).
   * Sets invalidDateFormat error if input has text but control value is null (parse failed).
   * @param controlName - The form control name ('fromDate' or 'toDate')
   * @param inputElement - The native input element reference
   */
  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();

    // Handle DDMMYY format (6 digits) - auto-format to DD-MON-YYYY
    const ddmmyyPattern = /^(\d{2})(\d{2})(\d{2})$/;
    const match = inputValue?.match(ddmmyyPattern);

    if (match) {
      const [, day, month, year] = match;
      const fullYear = `20${year}`; // Assume 20xx for 2-digit years
      const parsedDate = moment(`${day}-${month}-${fullYear}`, 'DD-MM-YYYY', true);

      if (parsedDate.isValid()) {
        control?.setValue(parsedDate);
        control?.markAsTouched();
        return;
      }
    }

    // If input has text but control value is null, parsing failed (invalid date)
    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  /**
   * Get error message for from date field
   */
  getFromDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('fromDate'),
      this.filterForm.errors,
      'From Date'
    );
  }

  /**
   * Get error message for to date field
   */
  getToDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('toDate'),
      this.filterForm.errors,
      'To Date',
      'To Date must be on or after From Date'
    );
  }
}
