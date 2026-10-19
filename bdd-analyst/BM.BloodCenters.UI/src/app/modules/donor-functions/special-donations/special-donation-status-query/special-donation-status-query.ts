import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DataTable } from '@shared/components/data-table/data-table';
import type { DataTableConfig, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import moment, { Moment } from 'moment';
import { Observable, Subject, takeUntil } from 'rxjs';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ROUTES } from '@core/constants/route.constants';
import { SpecialDonationStatusService } from './services/special-donation-status.service';
import type {
  SpecialUnitDto,
  ShipLocationLookupDto,
  PatientLookupDto,
  UnitIdLookupDto,
  SurgIdLookupDto,
  SpecialDonationStatusQueryDto,
  SpecialDonationStatusResponseDto,
} from './models/special-donation-status.models';

@Component({
  selector: 'app-special-donation-status-query',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataTable,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatTabsModule,
    MatCardModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './special-donation-status-query.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./special-donation-status-query.scss'],
})
export class SpecialDonationStatusQueryComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `special-donation-status-query-${SpecialDonationStatusQueryComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly specialDonationService = inject(SpecialDonationStatusService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('fromDateInput') fromDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput?: ElementRef<HTMLInputElement>;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [],
  };

  // Reactive breadcrumb update
  private readonly breadcrumbEffect = effect(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    const title = pageData?.title || 'Special Donation Status Query';
    const subtitle = pageData?.subtitle || '';

    this.headerConfig = {
      ...this.headerConfig,
      breadcrumbs: [
        { label: 'Home', link: ROUTES.HOME },
        { label: title, link: null },
      ],
      title: title,
      subtitle: subtitle,
    };
  });

  // State signals
  protected readonly isLoading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly showFilters = signal<boolean>(false);
  protected readonly specialUnits = signal<SpecialUnitDto[]>([]);
  protected readonly expandedRows = signal<Set<string>>(new Set());
  protected readonly selectedTabIndex = signal<Map<string, number>>(new Map());

  // Lookup data
  protected readonly shipLocations = signal<ShipLocationLookupDto[]>([]);
  protected readonly patients = signal<PatientLookupDto[]>([]);
  protected readonly unitIds = signal<UnitIdLookupDto[]>([]);
  protected readonly surgeryIds = signal<SurgIdLookupDto[]>([]);

  // Search controls for dropdowns
  protected readonly shipLocationSearchControl = new FormControl('');
  protected readonly patientSearchControl = new FormControl('');
  protected readonly unitIdSearchControl = new FormControl('');
  protected readonly surgeryIdSearchControl = new FormControl('');

  // Date form controls with cross-field range validator
  protected readonly fromDateControl = new FormControl<Moment | null>(null);
  protected readonly toDateControl = new FormControl<Moment | null>(null);
  protected readonly needByDateControl = new FormControl<Moment | null>(null);

  protected readonly dateFilterForm = new FormGroup(
    {
      fromDate: this.fromDateControl,
      toDate: this.toDateControl,
      needBy: this.needByDateControl,
    },
    { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('fromDate', 'toDate')] }
  );

  // Max date for "Need By" field only (chapter's current date)
  protected readonly maxDate = computed<Moment>(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    if (chapterDate && chapterDate.isValid()) {
      return chapterDate.clone().startOf('day');
    }
    return moment().startOf('day');
  });

  private lastChangedDate: 'from' | 'to' | 'needBy' | null = null;

  protected readonly fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getFromDateError()
  );
  protected readonly toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getToDateError()
  );
  protected readonly needByErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getNeedByDateError()
  );

  // Filtered options for searchable dropdowns
  protected readonly filteredShipLocations = signal<ShipLocationLookupDto[]>([]);
  protected readonly filteredPatients = signal<PatientLookupDto[]>([]);
  protected readonly filteredUnitIds = signal<UnitIdLookupDto[]>([]);
  protected readonly filteredSurgeryIds = signal<SurgIdLookupDto[]>([]);

  // Pagination
  protected readonly pageSize = signal<number>(25);
  protected readonly pageIndex = signal<number>(0);
  protected readonly pageSizeOptions = [10, 25, 50, 100];
  protected readonly totalRecords = computed(() => this.specialUnits().length);

  // Computed property for legacy template compatibility (includes pagination)
  protected readonly donations = computed(() => {
    const units = this.specialUnits();
    if (!Array.isArray(units)) {
      return [];
    }
    return units.map((unit) => ({
      id: unit.unitId,
      sequence: unit.sequence,
      shipLocation: unit.shipDesc || unit.shipId || '',
      patient: unit.patientName || '',
      patientId: unit.patId,
      unitId: unit.displayUnitId,
      collectionDate: unit.collDate ? moment(unit.collDate).format('DD-MMM-YYYY').toUpperCase() : '',
      donationType: unit.donationType || '',
      surgeryId: unit.surgId || '',
      surgeryDate: unit.surgDate ? moment(unit.surgDate, ['MM-DD-YYYY', 'YYYY-MM-DD', moment.ISO_8601]).format('DD-MMM-YYYY').toUpperCase() : '',
      surgeryDay: this.getFullDayName(unit.surgDay || ''),
      dateNeeded: unit.dateNeededBy ? moment(unit.dateNeededBy).format('DD-MMM-YYYY').toUpperCase() : '',
      components: Array.isArray(unit.shippedProducts) ? unit.shippedProducts.map(prod => ({
        type: prod.productType || prod.productCode,
        product: prod.productType || '',
        shipDate: prod.shippedDate ? moment(prod.shippedDate).format('DD-MMM-YYYY').toUpperCase() : '',
        unitId: prod.displayUnitId || prod.unitId,
        productCode: prod.productCode,
        shippedDate: prod.shippedDate ? moment(prod.shippedDate).format('DD-MMM-YYYY').toUpperCase() : '',
      })) : [],
    }));
  });

  // Paginated donations for template (rowNumber = sequential display index)
  protected readonly paginatedDonations = computed(() => {
    const allDonations = this.donations();
    if (!Array.isArray(allDonations)) return [];
    const start = this.pageIndex() * this.pageSize();
    return allDonations.slice(start, start + this.pageSize()).map((d, i) => ({
      ...d,
      rowNumber: start + i + 1,
    }));
  });

  readonly mainTableConfig = computed<DataTableConfig>(() => {
    const filterDesc = this.getActiveFiltersDescription();
    const caption = filterDesc
      ? `Special Donation Status Search Results - ${filterDesc}`
      : 'Special Donation Status Search Results';

    return {
      caption,
      columns: [
        { key: 'rowNumber', header: `Sequence (${this.totalRecords()})` },
        { key: 'shipLocation', header: 'Ship Location' },
        { key: 'patient', header: 'Patient' },
        { key: 'unitId', header: 'Unit ID', sortable: true },
        { key: 'collectionDate', header: 'Collection Date' },
        { key: 'donationType', header: 'Donation Type' },
      ],
      pagination: {
        totalRecords: this.totalRecords(),
        pageSize: this.pageSize(),
        pageIndex: this.pageIndex(),
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true,
      },
      sortConfig: {
        column: this.sortColumn() === 'UnitId' ? 'unitId' : '',
        direction: this.sortDirection() === 'ASC' ? 'A' : 'D',
      },
      enableRowHighlight: false,
      hideExpandAllInHeader: true,
    };
  });

  // Filter state - using regular properties for ngModel binding
  // Gap Analysis Fix #10: Set default option to 'All Units'
  protected filterCriteria = {
    fromDate: '',
    toDate: '',
    shipLocation: '',
    patientId: '',
    details: '',
    option: 'All Units' as '' | 'All Units' | 'Shipped' | 'Not Shipped',
    unitId: '',
    surgeryId: '',
    needBy: '',
  };

  // Sort state
  protected readonly sortColumn = signal<string>('CollDate');
  protected readonly sortDirection = signal<'ASC' | 'DESC'>('DESC');


  // Tab 1 "Components Made" label — directed donor data
  readonly componentsRequestedTableConfig: DataTableConfig = {
    columns: [
      { key: 'type', header: 'Type' },
      { key: 'product', header: 'Product' },
      { key: 'shipDate', header: 'Ship Date' },
    ],
    showPagination: false,
    emptyMessage: '-',
    showTableOnEmpty: true,
    enableRowHighlight: false,
  };

  // Tab 2 "Components Requested" label — shipped products
  readonly componentsMadeTableConfig: DataTableConfig = {
    columns: [
      { key: 'type', header: 'Components Made' },
      { key: 'unitId', header: 'Unit ID' },
      { key: 'productCode', header: 'Product Code' },
      { key: 'shipDate', header: 'Shipped Date' },
    ],
    showPagination: false,
    emptyMessage: '-',
    showTableOnEmpty: true,
    enableRowHighlight: false,
  };

  /**
   * Get components requested for a specific row
   */
  protected getComponentsRequested(donationId: string): Array<{type: string; product: string; shipDate: string}> {
    const unit = this.specialUnits().find(u => u.unitId === donationId);

    if (!unit?.directedDonor) {
      return [];
    }

    const directedDonor = unit.directedDonor;
    const components: Array<{type: string; product: string; shipDate: string}> = [];

    if (directedDonor.prodType1) {
      components.push({
        type: directedDonor.prodType1,
        product: directedDonor.prodType1,
        shipDate: '-'
      });
    }
    if (directedDonor.prodType2) {
      components.push({
        type: directedDonor.prodType2,
        product: directedDonor.prodType2,
        shipDate: '-'
      });
    }
    if (directedDonor.prodType3) {
      components.push({
        type: directedDonor.prodType3,
        product: directedDonor.prodType3,
        shipDate: '-'
      });
    }

    return components;
  }

  ngOnInit(): void {
    this.loadInitialLookupData();
    this.setupSearchFilters();
    this.setupDateValidation();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadLookupData();
      });
  }

  /**
   * Setup search filters for all dropdowns
   */
  private setupSearchFilters(): void {
    // Ship Location search
    this.shipLocationSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterShipLocations(searchTerm || '');
      });

    // Patient search
    this.patientSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterPatients(searchTerm || '');
      });

    // Unit ID search
    this.unitIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterUnitIds(searchTerm || '');
      });

    // Surgery ID search
    this.surgeryIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterSurgeryIds(searchTerm || '');
      });
  }

  private setupDateValidation(): void {
    this.fromDateControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastChangedDate = 'from';
      this.cdr.markForCheck();
    });

    this.toDateControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastChangedDate = 'to';
      this.cdr.markForCheck();
    });

    this.needByDateControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastChangedDate = 'needBy';
      this.cdr.markForCheck();
    });
  }

  protected onFromDateInput(event: Event): void {
    this.lastChangedDate = 'from';
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.fromDateControl
    );
    this.cdr.markForCheck();
  }

  protected onToDateInput(event: Event): void {
    this.lastChangedDate = 'to';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.toDateControl
    );
    this.cdr.markForCheck();
  }

  protected onNeedByDateInput(event: Event): void {
    this.lastChangedDate = 'needBy';
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.needByDateControl
    );
    this.cdr.markForCheck();
  }

  protected onFromDateBlur(): void {
    setTimeout(() => {
      const control = this.fromDateControl;
      const inputElement = this.fromDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      control.markAsTouched();

      if (inputValue && !control.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = moment(inputValue, formats, true);
        if (parsed && parsed.isValid()) {
          control.setValue(parsed);
          if (inputElement) {
            inputElement.value = parsed.format('DD-MMM-YYYY').toUpperCase();
          }
        } else {
          control.setErrors({ ...control.errors, invalidDate: true });
        }
      }

      this.cdr.markForCheck();
    }, 0);
  }

  protected onToDateBlur(): void {
    setTimeout(() => {
      const control = this.toDateControl;
      const inputElement = this.toDateInput?.nativeElement;
      const inputValue = inputElement?.value?.trim() || '';

      control.markAsTouched();

      if (inputValue && !control.value) {
        const formats = Array.isArray(DD_MON_YYYY_FORMATS.parse.dateInput)
          ? DD_MON_YYYY_FORMATS.parse.dateInput
          : [DD_MON_YYYY_FORMATS.parse.dateInput];

        const parsed = moment(inputValue, formats, true);
        if (parsed && parsed.isValid()) {
          control.setValue(parsed);
          if (inputElement) {
            inputElement.value = parsed.format('DD-MMM-YYYY').toUpperCase();
          }
        } else {
          control.setErrors({ ...control.errors, invalidDate: true });
        }
      }

      this.cdr.markForCheck();
    }, 0);
  }

  protected getFromDateError(): string {
    const control = this.fromDateControl;
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'From Date is invalid';
    if (control.hasError('invalidDate')) return 'From Date is invalid';
    if (this.lastChangedDate === 'from' && this.dateFilterForm.errors?.['dateRangeInvalid']) {
      return 'From Date must be less than or equal to To Date';
    }
    return '';
  }

  protected getToDateError(): string {
    const control = this.toDateControl;
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'To Date is invalid';
    if (control.hasError('invalidDate')) return 'To Date is invalid';
    if (this.lastChangedDate === 'to') {
      if (control.hasError('matDatepickerMin')) return 'To Date must be on or after From Date';
      if (this.dateFilterForm.errors?.['dateRangeInvalid']) return 'To Date must be on or after From Date';
    }
    return '';
  }

  protected getNeedByDateError(): string {
    const control = this.needByDateControl;
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Need By date is invalid';
    if (control.hasError('invalidDate')) return 'Need By date is invalid';
    if (control.hasError('matDatepickerMax')) return 'Need By date cannot be a future date';
    return '';
  }

  /**
   * Filter ship locations based on search term
   */
  private filterShipLocations(searchTerm: string): void {
    const filtered = this.shipLocations().filter((location) =>
      location.displayValue.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.filteredShipLocations.set(filtered);
  }

  /**
   * Filter patients based on search term
   */
  private filterPatients(searchTerm: string): void {
    const filtered = this.patients().filter((patient) =>
      patient.displayValue.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.filteredPatients.set(filtered);
  }

  /**
   * Filter unit IDs based on search term
   */
  private filterUnitIds(searchTerm: string): void {
    const filtered = this.unitIds().filter((unit) =>
      unit.displayValue.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.filteredUnitIds.set(filtered);
  }

  /**
   * Filter surgery IDs based on search term
   */
  private filterSurgeryIds(searchTerm: string): void {
    const filtered = this.surgeryIds().filter((surgery) =>
      surgery.displayValue.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.filteredSurgeryIds.set(filtered);
  }

  /**
   * Load initial lookup data on component initialization
   * Only loads ship locations - other lookups are loaded when needed or on date range changes
   */
  private loadInitialLookupData(): void {
    // Load ship locations (always available, no filters needed)
    this.specialDonationService.getShipLocationsLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          const data = Array.isArray(locations) ? locations : [];
          this.shipLocations.set(data);
          this.filteredShipLocations.set(data);
        },
        error: (error) => {
          this.shipLocations.set([]);
          this.filteredShipLocations.set([]);
        },
      });
  }

  /**
   * Load all lookup data for filter dropdowns
   * Gap Analysis Fix #7: Cascading LOV - accept filter context
   */
  protected loadLookupData(): void {
    const fromDate = this.fromDateControl.value;
    const toDate = this.toDateControl.value;
    const fromDateStr = fromDate && fromDate.isValid() ? fromDate.format('YYYY-MM-DD') : undefined;
    const toDateStr = toDate && toDate.isValid() ? toDate.format('YYYY-MM-DD') : undefined;
    const patId = this.filterCriteria.patientId || undefined;

    // Load ship locations
    this.specialDonationService.getShipLocationsLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          const data = Array.isArray(locations) ? locations : [];
          this.shipLocations.set(data);
          this.filteredShipLocations.set(data);
        },
        error: (error) => {
          this.shipLocations.set([]);
          this.filteredShipLocations.set([]);
        },
      });

    // Gap Analysis Fix #2: Load patients with date filtering
    this.specialDonationService.getPatientsLookup(fromDateStr, toDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patientsData) => {
          const data = Array.isArray(patientsData) ? patientsData : [];
          this.patients.set(data);
          this.filteredPatients.set(data);
        },
        error: (error) => {
          this.patients.set([]);
          this.filteredPatients.set([]);
        },
      });

    // Gap Analysis Fix #3: Load unit IDs with date and patient filtering
    this.specialDonationService.getUnitIdsLookup(fromDateStr, toDateStr, patId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          const data = Array.isArray(units) ? units : [];
          this.unitIds.set(data);
          this.filteredUnitIds.set(data);
        },
        error: (error) => {
          this.unitIds.set([]);
          this.filteredUnitIds.set([]);
        },
      });

    // Gap Analysis Fix #4: Load surgery IDs with patient filtering
    this.specialDonationService.getSurgIdsLookup(patId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (surgIds) => {
          const data = Array.isArray(surgIds) ? surgIds : [];
          this.surgeryIds.set(data);
          this.filteredSurgeryIds.set(data);
        },
        error: (error) => {
          this.surgeryIds.set([]);
          this.filteredSurgeryIds.set([]);
        },
      });
  }

  private readonly dayNameMap: Record<string, string> = {
    SUN: 'SUNDAY', MON: 'MONDAY', TUE: 'TUESDAY', WED: 'WEDNESDAY',
    THU: 'THURSDAY', FRI: 'FRIDAY', SAT: 'SATURDAY',
  };

  private getFullDayName(abbr: string): string {
    const full = this.dayNameMap[abbr.toUpperCase()];
    if (!full) return abbr;
    return full.charAt(0) + full.slice(1).toLowerCase();
  }

  protected getSelectedPatientName(): string {
    if (!this.filterCriteria.patientId) return '-';
    const patient = this.patients().find(p => p.patId === this.filterCriteria.patientId);
    return patient?.patientName || '-';
  }

  protected toggleFilters(): void {
    this.showFilters.update((current) => !current);
  }

  /**
   * Retrieve special donation status based on filter criteria
   */
  protected onRetrieve(): void {
    this.dateFilterForm.markAllAsTouched();
    if (this.dateFilterForm.invalid) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    this.buildAndExecuteQuery()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SpecialDonationStatusResponseDto) => {
          const units = response?.specialUnits;
          this.specialUnits.set(Array.isArray(units) ? units : []);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(error.error?.message || 'Failed to retrieve special donation status');
          this.specialUnits.set([]);
        },
      });
  }

  /**
   * Build query DTO and execute API call
   */
  private buildAndExecuteQuery(): Observable<SpecialDonationStatusResponseDto> {
    const fromDate = this.fromDateControl.value as Moment | null;
    const toDate = this.toDateControl.value as Moment | null;
    const needBy = this.needByDateControl.value as Moment | null;

    const query: SpecialDonationStatusQueryDto = {
      fromDate: fromDate ? fromDate.format('YYYY-MM-DD') : undefined,
      toDate: toDate ? toDate.format('YYYY-MM-DD') : undefined,
      shipId: this.filterCriteria.shipLocation || undefined,
      patId: this.filterCriteria.patientId || undefined,
      shipStatus: this.mapOptionToShipStatus(this.filterCriteria.option),
      unitId: this.filterCriteria.unitId || undefined,
      surgId: this.filterCriteria.surgeryId || undefined,
      dateNeededBy: needBy ? needBy.format('YYYY-MM-DD') : undefined,
      sortColumn: this.sortColumn(),
      sortDirection: this.sortDirection(),
    };

    return this.specialDonationService.querySpecialDonationStatus(query);
  }

  /**
   * Map UI option to API ship status
   */
  private mapOptionToShipStatus(option: string): 'A' | 'S' | 'N' {
    switch (option) {
      case 'Shipped':
        return 'S';
      case 'Not Shipped':
        return 'N';
      case 'All Units':
      default:
        return 'A';
    }
  }

  protected onClearAll(): void {
    // Gap Analysis Fix #10: Reset to default option 'All Units'
    this.filterCriteria = {
      fromDate: '',
      toDate: '',
      shipLocation: '',
      patientId: '',
      details: '',
      option: 'All Units',
      unitId: '',
      surgeryId: '',
      needBy: '',
    };
    this.dateFilterForm.reset();
    this.lastChangedDate = null;
    this.clearData();
  }

  protected onRowExpand(row: any): void {
    const id: string = row.id;
    const current = this.expandedRows();
    if (current.has(id)) {
      this.expandedRows.set(new Set<string>());
    } else {
      this.expandedRows.set(new Set<string>([id]));
      // Focus management: After expansion, announce to screen readers
      setTimeout(() => {
        const detailsRegion = document.querySelector(`[aria-label*="Component details for unit ${row.unitId}"]`);
        if (detailsRegion instanceof HTMLElement) {
          detailsRegion.focus();
        }
      }, 100);
    }
  }

  protected isDonationExpanded(donationId: string): boolean {
    return this.expandedRows().has(donationId);
  }

  protected onMainSortChange(event: TableSortEvent): void {
    if (event.column === 'unitId') {
      this.sortColumn.set('UnitId');
      this.sortDirection.set(event.direction === 'A' ? 'ASC' : 'DESC');
    } else {
      this.sortColumn.set('CollDate');
      this.sortDirection.set('DESC');
    }
    if (this.specialUnits().length > 0) {
      this.onRetrieve();
    }
  }

  protected setSelectedTabIndex(donationId: string, tabIndex: number): void {
    this.selectedTabIndex.update((tabs: Map<string, number>) => {
      const newTabs = new Map(tabs);
      newTabs.set(donationId, tabIndex);
      return newTabs;
    });
  }

  protected getSelectedTabIndex(donationId: string): number {
    return this.selectedTabIndex().get(donationId) || 0;
  }

  protected onMainPageChange(event: TablePageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  /**
   * Check if CLEAR ALL button should be disabled
   * Disabled when loading or when no filters are applied and no results are displayed
   */
  protected isClearAllDisabled(): boolean {
    if (this.isLoading()) return true;

    const hasFilters =
      this.fromDateControl.value !== null ||
      this.toDateControl.value !== null ||
      this.needByDateControl.value !== null ||
      this.filterCriteria.shipLocation !== '' ||
      this.filterCriteria.patientId !== '' ||
      (this.filterCriteria.option !== '' && this.filterCriteria.option !== 'All Units') ||
      this.filterCriteria.unitId !== '' ||
      this.filterCriteria.surgeryId !== '';

    return !hasFilters;
  }

  /**
   * Check if RETRIEVE button should be disabled
   * Disabled when loading, form is invalid, or no filters are applied
   */
  protected isRetrieveDisabled(): boolean {
    if (this.isLoading()) return true;
    if (this.dateFilterForm.invalid) return true;

    const hasFilters =
      this.fromDateControl.value !== null ||
      this.toDateControl.value !== null ||
      this.needByDateControl.value !== null ||
      this.filterCriteria.shipLocation !== '' ||
      this.filterCriteria.patientId !== '' ||
      this.filterCriteria.unitId !== '' ||
      this.filterCriteria.surgeryId !== '';

    return !hasFilters;
  }

  /**
   * Get error message for RETRIEVE button
   */
  protected getRetrieveErrorMessage(): string {
    return '';
  }

  private clearData(): void {
    this.specialUnits.set([]);
    this.expandedRows.set(new Set<string>());
    this.selectedTabIndex.set(new Map<string, number>());
    this.pageIndex.set(0);
    this.hasError.set(false);
    this.errorMessage.set('');
  }

  /**
   * Gap Analysis Fix #7: Cascading LOV - when patient selection changes, reload Unit IDs and Surgery IDs filtered by selected patient
   */
  protected onPatientSelectionChange(): void {
    const patId = this.filterCriteria.patientId || undefined;
    const fromDate = this.fromDateControl.value;
    const toDate = this.toDateControl.value;
    const fromDateStr = fromDate && fromDate.isValid() ? fromDate.format('YYYY-MM-DD') : undefined;
    const toDateStr = toDate && toDate.isValid() ? toDate.format('YYYY-MM-DD') : undefined;

    // Clear dependent dropdowns
    this.filterCriteria.unitId = '';
    this.filterCriteria.surgeryId = '';

    // Reload Unit IDs with patient filter
    this.specialDonationService.getUnitIdsLookup(fromDateStr, toDateStr, patId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          const data = Array.isArray(units) ? units : [];
          this.unitIds.set(data);
          this.filteredUnitIds.set(data);
        },
        error: (error) => {
          this.unitIds.set([]);
          this.filteredUnitIds.set([]);
        },
      });

    // Reload Surgery IDs with patient filter
    this.specialDonationService.getSurgIdsLookup(patId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (surgIds) => {
          const data = Array.isArray(surgIds) ? surgIds : [];
          this.surgeryIds.set(data);
          this.filteredSurgeryIds.set(data);
        },
        error: (error) => {
          this.surgeryIds.set([]);
          this.filteredSurgeryIds.set([]);
        },
      });
  }

  /**
   * Gap Analysis Fix #7: Cascading LOV - when date range changes, reload Patients and Unit IDs filtered by date
   */
  protected onDateRangeChange(): void {
    const fromDate = this.fromDateControl.value;
    const toDate = this.toDateControl.value;
    const fromDateStr = fromDate && fromDate.isValid() ? fromDate.format('YYYY-MM-DD') : undefined;
    const toDateStr = toDate && toDate.isValid() ? toDate.format('YYYY-MM-DD') : undefined;
    const patId = this.filterCriteria.patientId || undefined;

    // Reload Patients with date filter
    this.specialDonationService.getPatientsLookup(fromDateStr, toDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patientsData) => {
          const data = Array.isArray(patientsData) ? patientsData : [];
          this.patients.set(data);
          this.filteredPatients.set(data);
        },
        error: (error) => {
          this.patients.set([]);
          this.filteredPatients.set([]);
        },
      });

    // Reload Unit IDs with date and patient filter
    this.specialDonationService.getUnitIdsLookup(fromDateStr, toDateStr, patId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          const data = Array.isArray(units) ? units : [];
          this.unitIds.set(data);
          this.filteredUnitIds.set(data);
        },
        error: (error) => {
          this.unitIds.set([]);
          this.filteredUnitIds.set([]);
        },
      });
  }

  /**
   * Gap Analysis Fix #6: Unit ID format validator
   * Validates that Unit ID follows expected format (alphanumeric, specific length if required)
   */
  protected validateUnitIdFormat(): boolean {
    const unitId = this.filterCriteria.unitId.trim();
    if (!unitId) return true; // Empty is valid (optional field)

    // Oracle Forms allows alphanumeric unit IDs (letters, numbers, no special chars)
    // Adjust regex pattern based on actual business rules
    const unitIdPattern = /^[A-Z0-9]{1,15}$/i;
    return unitIdPattern.test(unitId);
  }

  /**
   * Gap Analysis Fix #6: Get Unit ID format error message
   */
  protected getUnitIdFormatError(): string {
    const unitId = this.filterCriteria.unitId.trim();
    if (!unitId) return '';

    if (!this.validateUnitIdFormat()) {
      return 'Unit ID must be alphanumeric (letters and numbers only, max 15 characters)';
    }
    return '';
  }

  /**
   * Get a description of active filters for accessible table caption
   */
  private getActiveFiltersDescription(): string {
    const filters: string[] = [];

    if (this.fromDateControl.value && this.toDateControl.value) {
      filters.push(`Date range: ${this.fromDateControl.value.format('DD-MMM-YYYY')} to ${this.toDateControl.value.format('DD-MMM-YYYY')}`);
    } else if (this.fromDateControl.value) {
      filters.push(`From: ${this.fromDateControl.value.format('DD-MMM-YYYY')}`);
    } else if (this.toDateControl.value) {
      filters.push(`To: ${this.toDateControl.value.format('DD-MMM-YYYY')}`);
    }

    if (this.filterCriteria.shipLocation) {
      const location = this.shipLocations().find(l => l.shipId === this.filterCriteria.shipLocation);
      if (location) filters.push(`Ship Location: ${location.displayValue}`);
    }

    if (this.filterCriteria.patientId) {
      const patient = this.patients().find(p => p.patId === this.filterCriteria.patientId);
      if (patient) filters.push(`Patient: ${patient.patientName}`);
    }

    if (this.filterCriteria.option && this.filterCriteria.option !== 'All Units') {
      filters.push(`Status: ${this.filterCriteria.option}`);
    }

    if (this.filterCriteria.unitId) {
      filters.push(`Unit ID: ${this.filterCriteria.unitId}`);
    }

    if (this.filterCriteria.surgeryId) {
      filters.push(`Surgery ID: ${this.filterCriteria.surgeryId}`);
    }

    if (this.needByDateControl.value) {
      filters.push(`Need By: ${this.needByDateControl.value.format('DD-MMM-YYYY')}`);
    }

    return filters.length > 0 ? filters.join(', ') : '';
  }
}
