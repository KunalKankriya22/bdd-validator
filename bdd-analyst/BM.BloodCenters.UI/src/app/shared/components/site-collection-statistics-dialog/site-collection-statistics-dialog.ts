import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  Inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatTooltipModule, MatTooltip } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment, { Moment } from 'moment';

import { DialogTabs } from '@shared/components/dialog-tabs/dialog-tabs';
import { DialogTab } from '@shared/interfaces/dialog.interface';
import { SiteCollectionStatisticsService } from '@shared/services/site-collection-statistics.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DateRangePairErrorStateMatcher } from '@shared/error-state-matchers/date-range-pair-error-state.matcher';
import {
  SiteCollectionStatisticsDialogData,
  SiteStatisticsDto,
  DonationBreakdownDto,
  UnitDetailDto,
  SiteDropdownDto,
  VENIPUNCTURE_COLUMNS,
  VenipunctureColumn,
} from '@shared/models/site-collection-statistics.model';

@Component({
  selector: 'app-site-collection-statistics-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTableModule,
    NgxMatSelectSearchModule,
    MatTooltipModule,
    DialogTabs,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './site-collection-statistics-dialog.html',
  styleUrl: './site-collection-statistics-dialog.scss',
})
export class SiteCollectionStatisticsDialog implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `site-collection-statistics-${SiteCollectionStatisticsDialog.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly siteStatisticsService = inject(SiteCollectionStatisticsService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialogRef = inject(MatDialogRef<SiteCollectionStatisticsDialog>);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('siteSelect') siteSelect!: MatSelect;
  @ViewChild('fromDateInput') fromDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput!: ElementRef<HTMLInputElement>;

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingSites = signal<boolean>(false);
  protected readonly loadingBreakdown = signal<boolean>(false);
  protected readonly loadingUnits = signal<boolean>(false);

  protected readonly sites = signal<SiteDropdownDto[]>([]);
  protected readonly siteStatistics = signal<SiteStatisticsDto[]>([]);
  protected readonly donationBreakdown = signal<DonationBreakdownDto[]>([]);
  protected readonly unitDetails = signal<UnitDetailDto[]>([]);

  protected readonly selectedSiteRow = signal<SiteStatisticsDto | null>(null);
  protected readonly selectedBreakdownRow = signal<DonationBreakdownDto | null>(null);
  protected readonly activeTab = signal<string>('general');
  protected readonly showFullUnits = signal<boolean>(false);
  protected readonly siteSearchTerm = signal<string>('');
  protected readonly siteSearchCtrl = new FormControl<string>('');

  protected readonly totalActualDraws = signal<number>(0);
  protected readonly totalActualDeferrals = signal<number>(0);

  // Computed values
  protected readonly isEmpty = computed(() => this.siteStatistics().length === 0);
  protected readonly hasBreakdown = computed(() => this.donationBreakdown().length > 0);
  protected readonly hasUnits = computed(() => this.unitDetails().length > 0);
  protected readonly selectedSiteName = computed(() => {
    const row = this.selectedSiteRow();
    return row ? `${row.siteId}` : '';
  });
  protected readonly filteredSites = computed(() => {
    const term = this.siteSearchTerm().toLowerCase();
    if (!term) return this.sites();
    return this.sites().filter(s =>
      s.siteId.toLowerCase().includes(term) || s.locationName.toLowerCase().includes(term)
    );
  });

  // Form
  filterForm!: FormGroup;
  submitted = false;
  fromDateErrorMatcher!: DateRangePairErrorStateMatcher;
  toDateErrorMatcher!: DateRangePairErrorStateMatcher;
  protected readonly hasAnyFilterValue = signal<boolean>(false);
  private lastModifiedDateField = signal<'fromDate' | 'toDate' | null>(null);

  // Tab configuration
  tabs: DialogTab[] = [
    { id: 'general', label: 'General', ariaLabel: 'General statistics tab' },
    { id: 'units', label: 'Units', ariaLabel: 'Unit details tab' },
  ];

  // Table columns
  siteStatsColumns: string[] = ['siteId', 'locationName', 'collectionDate', 'actualDraws', 'actualDeferrals'];
  donationBreakdownColumns: string[] = ['donationType', 'procedureCode', 'count'];
  unitDetailsColumns: string[] = ['displayUnitId', 'collectionDate', 'donationType', 'procedureCode', ...VENIPUNCTURE_COLUMNS.map(c => c.key)];
  venipunctureColumns = VENIPUNCTURE_COLUMNS;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SiteCollectionStatisticsDialogData | null,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSites();
    this.siteSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val: string | null) => this.siteSearchTerm.set(val || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize filter form
   */
  private initForm(): void {
    this.filterForm = this.fb.group({
      siteId: [this.data?.siteId || ''],
      fromDate: [
        this.data?.startDate ? moment(this.data.startDate) : null,
        [Validators.required, dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]
      ],
      toDate: [
        this.data?.endDate ? moment(this.data.endDate) : null,
        [Validators.required, dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]
      ],
    }, {
      validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')],
    });

    this.fromDateErrorMatcher = new DateRangePairErrorStateMatcher(
      () => this.filterForm,
      () => this.lastModifiedDateField() === 'fromDate'
    );
    this.toDateErrorMatcher = new DateRangePairErrorStateMatcher(
      () => this.filterForm,
      () => this.lastModifiedDateField() !== 'fromDate'
    );

    this.filterForm.get('fromDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.lastModifiedDateField.set('fromDate'));

    this.filterForm.get('toDate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.lastModifiedDateField.set('toDate'));

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.hasAnyFilterValue.set(
          (val.siteId != null && val.siteId !== '') || val.fromDate != null || val.toDate != null
        );
      });
  }

  /**
   * Load sites dropdown
   */
  private loadSites(): void {
    this.loadingSites.set(true);
    this.siteStatisticsService.getSites()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingSites.set(false))
      )
      .subscribe({
        next: (data) => {
          this.sites.set(data);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load sites');
        },
      });
  }

  /**
   * Get form controls for easier template access
   */
  get f() {
    return this.filterForm.controls;
  }

  /**
   * Get selected site name from dropdown for the filter header
   */
  onSiteDropdownOpenedChange(opened: boolean): void {
    if (!opened) {
      this.siteSearchCtrl.setValue('');
    }
  }

  getFilterSiteName(): string {
    const siteId = this.filterForm.get('siteId')?.value;
    if (!siteId) {
      return this.submitted ? 'ALL SITES' : '';
    }
    const site = this.sites().find(s => s.siteId === siteId);
    return site?.locationName || '';
  }

  /**
   * Handle RETRIEVE button click
   */
  getFromDateError(): string {
    const control = this.filterForm.get('fromDate');
    if (!control || !(control.touched || control.dirty)) return '';

    const inputValue = this.fromDateInput?.nativeElement?.value;
    if (control.hasError('required') && inputValue && inputValue.trim().length > 0) {
      return 'From Date is invalid';
    }

    if (control.hasError('matDatepickerParse') ||
        control.hasError('invalidDateFormat') ||
        control.hasError('invalidDate')) {
      return 'From Date is invalid';
    }

    if (control.hasError('required')) {
      return 'From Date is required';
    }

    if (this.filterForm.errors?.['dateRangeInvalid'] && this.lastModifiedDateField() === 'fromDate') {
      return 'From Date cannot be after To Date';
    }

    return '';
  }

  getToDateError(): string {
    const control = this.filterForm.get('toDate');
    if (!control || !(control.touched || control.dirty)) return '';

    const inputValue = this.toDateInput?.nativeElement?.value;
    if (control.hasError('required') && inputValue && inputValue.trim().length > 0) {
      return 'To Date is invalid';
    }

    if (control.hasError('matDatepickerParse') ||
        control.hasError('invalidDateFormat') ||
        control.hasError('invalidDate')) {
      return 'To Date is invalid';
    }

    if (control.hasError('required')) {
      return 'To Date is required';
    }

    if (this.filterForm.errors?.['dateRangeInvalid'] && this.lastModifiedDateField() !== 'fromDate') {
      return 'To Date must be on or after From Date';
    }

    return '';
  }

  onRetrieve(): void {
    this.submitted = true;

    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const fromDate = this.filterForm.get('fromDate')?.value as Moment;
    const toDate = this.filterForm.get('toDate')?.value as Moment;
    const siteId = this.filterForm.get('siteId')?.value;

    this.loading.set(true);

    this.siteStatisticsService.getSiteStatistics({
      startDate: fromDate.format('YYYY-MM-DD'),
      endDate: toDate.format('YYYY-MM-DD'),
      siteId: siteId || undefined,
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.siteStatistics.set(response.data);
          this.totalActualDraws.set(response.totalActualDraws);
          this.totalActualDeferrals.set(response.totalActualDeferrals);

          if (response.data.length === 0) {
            this.snackbarService.showError('Err: 9188: No records found');
          }

          this.selectedSiteRow.set(null);
          this.selectedBreakdownRow.set(null);
          this.donationBreakdown.set([]);
          this.unitDetails.set([]);
        },
        error: (error) => {
          const errorMessage = error.error?.errorResponse?.error || 'Failed to retrieve data';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  /**
   * Handle CLEAR ALL button click
   */
  onClearAll(): void {
    this.filterForm.reset({
      siteId: '',
      fromDate: null,
      toDate: null,
    });
    this.submitted = false;
    this.lastModifiedDateField.set(null);
    this.siteStatistics.set([]);
    this.donationBreakdown.set([]);
    this.unitDetails.set([]);
    this.selectedSiteRow.set(null);
    this.selectedBreakdownRow.set(null);
    this.totalActualDraws.set(0);
    this.totalActualDeferrals.set(0);
    this.showFullUnits.set(false);
    this.activeTab.set('general');
    setTimeout(() => this.siteSelect?.focus());
  }

  /**
   * Handle site statistics row click
   */
  onSiteRowClick(row: SiteStatisticsDto): void {
    this.selectedSiteRow.set(row);
    this.selectedBreakdownRow.set(null);
    this.unitDetails.set([]);

    this.filterForm.get('siteId')?.setValue(row.siteId, { emitEvent: false });

    if (row.actualDraws === 0) {
      this.donationBreakdown.set([]);
      return;
    }
    this.loadDonationBreakdown(row.siteId, row.collectionDate);

    if (this.activeTab() === 'units') {
      this.loadUnitDetails(row.siteId, row.collectionDate);
    }
  }

  /**
   * Check if row is selected
   */
  isRowSelected(row: SiteStatisticsDto): boolean {
    return this.selectedSiteRow() === row;
  }

  /**
   * Load donation breakdown for selected site/date
   */
  private loadDonationBreakdown(siteId: string, collectionDate: string): void {
    this.loadingBreakdown.set(true);

    this.siteStatisticsService.getDonationBreakdown({
      siteId,
      collectionDate: moment(collectionDate).format('YYYY-MM-DD'),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingBreakdown.set(false))
      )
      .subscribe({
        next: (data) => {
          this.donationBreakdown.set(data);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load donation breakdown');
        },
      });
  }

  /**
   * Handle SHOW UNITS button click
   */
  onToggleUnits(): void {
    if (this.showFullUnits()) {
      this.showFullUnits.set(false);
      return;
    }
    const selected = this.selectedSiteRow();
    if (!selected) {
      this.snackbarService.showError('Please select a site row first');
      return;
    }
    this.showFullUnits.set(true);
    const breakdown = this.selectedBreakdownRow();
    this.loadUnitDetails(selected.siteId, selected.collectionDate, breakdown?.donationType, breakdown?.procedureCode);
  }

  onBreakdownRowClick(row: DonationBreakdownDto): void {
    this.selectedBreakdownRow.set(row);
  }

  /**
   * Load unit details for selected site/date
   */
  private loadUnitDetails(siteId: string, collectionDate: string, donationType?: string, procedureCode?: string): void {
    this.loadingUnits.set(true);

    this.siteStatisticsService.getUnitDetails({
      siteId,
      collectionDate: moment(collectionDate).format('YYYY-MM-DD'),
      donationType,
      procedureCode,
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingUnits.set(false))
      )
      .subscribe({
        next: (data) => {
          this.unitDetails.set(data);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load unit details');
        },
      });
  }

  /**
   * Handle tab change
   */
  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);

    if (tabId === 'units') {
      const selected = this.selectedSiteRow();
      if (selected && !this.hasUnits()) {
        const breakdown = this.selectedBreakdownRow();
        this.loadUnitDetails(selected.siteId, selected.collectionDate, breakdown?.donationType, breakdown?.procedureCode);
      }
    }
  }

  /**
   * Handle CLEAR button click
   */
  onClear(): void {
    this.onClearAll();
  }

  /**
   * Handle CLOSE button click
   */
  onClose(): void {
    this.dialogRef.close();
  }

  onDateInput(event: Event, controlName: string): void {
    const input = (event.target as HTMLInputElement).value;
    const control = this.filterForm.get(controlName);
    if (!control) return;
    if (!input?.trim()) {
      control.setValue(null);
      control.markAsTouched();
    }
  }

  formatDate(value: string | Date): string {
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  /**
   * Format venipuncture attribute value
   */
  formatVeniAttribute(value: string | null): string {
    return value === 'Y' ? 'Y' : '';
  }

  /**
   * Track by function for site statistics table
   */
  trackBySiteStats(index: number, item: SiteStatisticsDto): string {
    return `${item.siteId}-${item.collectionDate}`;
  }

  /**
   * Track by function for donation breakdown table
   */
  trackByBreakdown(index: number, item: DonationBreakdownDto): string {
    return `${item.donationType}-${item.procedureCode}`;
  }

  /**
   * Track by function for unit details table
   */
  trackByUnit(index: number, item: UnitDetailDto): string {
    return item.unitId || `deferral-${index}`;
  }

  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }
}
