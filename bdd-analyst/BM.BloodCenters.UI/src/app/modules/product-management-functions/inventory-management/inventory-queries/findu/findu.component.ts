import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TemplateRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import moment from 'moment';

import { FinduService } from './services/findu.service';
import { LoggingService } from '@shared/services/logging.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import {
  UnitProductDto,
  UnitProductQueryDto,
  StatusFilterValue,
  ProductTypeLookupDto,
  AttributeGroupLookupDto,
  AttributeLookupDto,
  BloodTypeLookupDto
} from './models/findu.models';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent
} from '@shared/interfaces/data-table.interface';

import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { FinduFilterChipsUtils } from './utils/filter-chips.utils';
import { FinduFilterPanelComponent } from './findu-filter-panel/findu-filter-panel.component';

@Component({
  selector: 'app-findu',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './findu.component.html',
  styleUrls: ['./findu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinduComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('statusCellTpl', { static: true }) statusCellTpl!: TemplateRef<any>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<UnitProductDto> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100, 250, 500],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'unitId',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Enter collection dates to begin.',
    noDataIcon: 'search',
    loadingMessage: 'Loading units and products data...',
    showPagination: true
  };

  // Inline criteria form
  criteriaForm!: FormGroup;
  today: Date = DateFieldValidationUtility.getChapterLocalDateForInsert();

  // Autocomplete display functions (bound for template use)
  displayAttributeCode = (value: AttributeLookupDto | string | null): string => {
    if (!value) return '';
    return typeof value === 'string' ? value : value.description || '';
  };

  displayBloodType = (value: string | null): string => {
    if (!value) return '';
    const match = this.bloodTypeOptions.find(o => o.aboCode === value);
    return match ? match.description : value;
  };

  // Lookup options
  productTypeOptions: ProductTypeLookupDto[] = [];
  filteredProductTypeOptions: ProductTypeLookupDto[] = [];
  attributeGroupOptions: AttributeGroupLookupDto[] = [];
  filteredAttributeGroupOptions: AttributeGroupLookupDto[] = [];
  attributeCodeOptions: AttributeLookupDto[] = [];
  filteredAttributeCodeOptions: AttributeLookupDto[] = [];
  bloodTypeOptions: BloodTypeLookupDto[] = [];
  filteredBloodTypeOptions: BloodTypeLookupDto[] = [];

  // Status filters from overlay panel
  appliedStatusFilters: StatusFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: UnitProductDto[] = [];
  requestState: UnitProductQueryDto = {
    fromDate: '',
    toDate: '',
    take: 10,
    skip: 0
  };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  isFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayClose$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private fb: FormBuilder,
    private service: FinduService,
    private overlay: Overlay,
    private loggingService: LoggingService,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.initializeConfigurations();
    this.initializeCriteriaForm();
  }

  ngOnInit(): void {
    this.loadLookupOptions();
    this.subscribeToChapterChanges();
    this.setupDropdownSearches();
  }

  ngAfterViewInit(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.getTableColumns()
    };
  }

  private initializeCriteriaForm(): void {
    this.criteriaForm = this.fb.group({
      fromDate: [null, [Validators.required, dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      toDate: [null, [Validators.required, dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      productType: [null],
      attributeGroup: [null],
      attributeCode: [null],
      bloodType: [null]
    }, {
      validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')]
    });
  }

  private setupDropdownSearches(): void {
    this.criteriaForm.get('productType')!.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((value: string | null) => {
        if (typeof value === 'string' && value.length >= 1) {
          this.filteredProductTypeOptions = this.productTypeOptions.filter(o =>
            o.productType.toLowerCase().includes(value.toLowerCase())
          );
        } else {
          this.filteredProductTypeOptions = [...this.productTypeOptions];
        }
      });

    this.criteriaForm.get('attributeGroup')!.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((value: string | null) => {
        this.criteriaForm.get('attributeCode')!.setValue(null, { emitEvent: false });
        if (typeof value === 'string' && value.length >= 1) {
          this.filteredAttributeGroupOptions = this.attributeGroupOptions.filter(o =>
            o.attributeGroup.toLowerCase().includes(value.toLowerCase())
          );
          const exactMatch = this.attributeGroupOptions.find(o =>
            o.attributeGroup.toLowerCase() === value.toLowerCase()
          );
          if (exactMatch) {
            this.loadAttributeCodesForGroup(exactMatch.attributeGroup);
          }
        } else {
          this.filteredAttributeGroupOptions = [...this.attributeGroupOptions];
          this.loadAttributeCodesForGroup(null);
        }
      });

    this.criteriaForm.get('attributeCode')!.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((value: AttributeLookupDto | string | null) => {
        const search = typeof value === 'string' ? value : '';
        if (search.length >= 1) {
          this.filteredAttributeCodeOptions = this.attributeCodeOptions
            .filter(o =>
              o.description.toLowerCase().includes(search.toLowerCase()) ||
              o.attributeCode.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => a.description.localeCompare(b.description));
        } else {
          this.filteredAttributeCodeOptions = [...this.attributeCodeOptions];
        }
      });

    this.criteriaForm.get('bloodType')!.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((value: string | null) => {
        if (typeof value === 'string' && value.length >= 1) {
          this.filteredBloodTypeOptions = this.bloodTypeOptions.filter(o =>
            o.aboCode.toLowerCase().includes(value.toLowerCase()) ||
            o.description.toLowerCase().includes(value.toLowerCase())
          );
        } else {
          this.filteredBloodTypeOptions = [...this.bloodTypeOptions];
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.today = DateFieldValidationUtility.getChapterLocalDateForInsert();
        this.onClearAll();
      });
  }

  private loadLookupOptions(): void {
    forkJoin({
      productTypes: this.service.getProductTypes(),
      attributeGroups: this.service.getAttributeGroups(),
      attributeCodes: this.service.getAttributes(null),
      bloodTypes: this.service.getBloodTypes()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productTypeOptions = response.productTypes.filter(o => o.productType?.trim());
          this.filteredProductTypeOptions = [...this.productTypeOptions];
          this.attributeGroupOptions = response.attributeGroups.filter(o => o.attributeGroup?.trim());
          this.filteredAttributeGroupOptions = [...this.attributeGroupOptions];
          this.attributeCodeOptions = response.attributeCodes
            .filter(o => o.attributeCode?.trim())
            .sort((a, b) => a.description.localeCompare(b.description));
          this.filteredAttributeCodeOptions = [...this.attributeCodeOptions];
          this.bloodTypeOptions = response.bloodTypes.filter(o => o.aboCode?.trim());
          this.filteredBloodTypeOptions = [...this.bloodTypeOptions];
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loggingService.error('Error loading lookup options', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private closeOverlay(): void {
    this.overlayClose$.next();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Find Units and Products', link: null }
      ],
      title: 'Find Units and Products',
      subtitle: 'View a list of products in inventory that meet the defined criteria.',
      actions: []
    };
  }

  private getTableColumns(): TableColumn<UnitProductDto>[] {
    const totalRecords = this.tableConfig.pagination?.totalRecords || 0;
    return [
      {
        key: 'unitId',
        header: totalRecords > 0 ? `Unit ID (${totalRecords})` : 'Unit ID',
        sortable: true,
        width: '180px'
      },
      {
        key: 'checkDigit',
        header: 'Chk',
        sortable: false,
        width: '80px'
      },
      {
        key: 'collectionDate',
        header: 'Collection Date',
        sortable: true,
        width: '150px',
        valueFormatter: (value) => this.formatDateOnly(value)
      },
      {
        key: 'productCode',
        header: 'Product',
        sortable: true,
        width: '120px'
      },
      {
        key: 'componentPrefix',
        header: 'Aq',
        sortable: false,
        width: '70px'
      },
      {
        key: 'aboRh',
        header: 'ABORh',
        sortable: false,
        width: '120px'
      },
      {
        key: 'expirationDate',
        header: 'Expiration Date',
        sortable: true,
        width: '170px',
        valueFormatter: (value) => this.formatDateTime(value)
      },
      {
        key: 'status',
        header: 'Status',
        sortable: false,
        width: '130px',
        cellTemplate: this.statusCellTpl
      }
    ];
  }

  private formatDateOnly(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  private formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '-';
  }

  onRowClick(row: UnitProductDto): void {
    const path = ROUTE_REGISTRY[RouteKey.UnitAndProductHistory].path;
    this.router.navigate([path], {
      queryParams: {
        unitId: row.unitId,
        from: 'Find Units and Products',
        fromPath: ROUTE_REGISTRY[RouteKey.FindUnitsAndProducts].path
      }
    });
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Available': 'available',
      'Packed': 'packed',
      'Allocated': 'allocated',
      'In Lab': 'in-lab'
    };
    return statusMap[status] || 'default';
  }

  compareAttributeCodes(a1: AttributeLookupDto, a2: AttributeLookupDto): boolean {
    return a1 && a2
      ? a1.attributeGroup === a2.attributeGroup && a1.attributeCode === a2.attributeCode
      : a1 === a2;
  }

  onProductTypeBlur(): void {
    const value = this.criteriaForm.get('productType')?.value;
    if (!value || typeof value !== 'string') return;
    const match = this.productTypeOptions.find(o =>
      o.productType.toLowerCase() === value.toLowerCase()
    );
    this.criteriaForm.get('productType')!.setValue(match ? match.productType : null, { emitEvent: false });
  }

  onAttributeGroupBlur(): void {
    const value = this.criteriaForm.get('attributeGroup')?.value;
    if (!value || typeof value !== 'string') return;
    const match = this.attributeGroupOptions.find(o =>
      o.attributeGroup.toLowerCase() === value.toLowerCase()
    );
    const resolved = match ? match.attributeGroup : null;
    this.criteriaForm.get('attributeGroup')!.setValue(resolved, { emitEvent: false });
    if (resolved) {
      this.loadAttributeCodesForGroup(resolved);
    }
  }

  onAttributeCodeBlur(): void {
    const value = this.criteriaForm.get('attributeCode')?.value;
    if (!value || typeof value === 'object') return;
    const search = String(value).toLowerCase();
    const match = this.attributeCodeOptions.find(o =>
      o.description.toLowerCase() === search || o.attributeCode.toLowerCase() === search
    );
    this.criteriaForm.get('attributeCode')!.setValue(match || null, { emitEvent: false });
  }

  onBloodTypeBlur(): void {
    const value = this.criteriaForm.get('bloodType')?.value;
    if (!value || typeof value !== 'string') return;
    const search = value.toLowerCase();
    const match = this.bloodTypeOptions.find(o =>
      o.aboCode.toLowerCase() === search || o.description.toLowerCase() === search
    );
    this.criteriaForm.get('bloodType')!.setValue(match ? match.aboCode : null, { emitEvent: false });
  }

  private loadAttributeCodesForGroup(group: string | null): void {
    this.service.getAttributes(group)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.attributeCodeOptions = codes
            .filter(o => o.attributeCode?.trim())
            .sort((a, b) => a.description.localeCompare(b.description));
          this.filteredAttributeCodeOptions = [...this.attributeCodeOptions];
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loggingService.error('Error loading attribute codes', error);
        }
      });
  }

  get isRetrieveDisabled(): boolean {
    const fromDate = this.criteriaForm.get('fromDate')?.value;
    const toDate = this.criteriaForm.get('toDate')?.value;

    if (!fromDate || !toDate) return true;

    if (moment(toDate).isBefore(moment(fromDate), 'day')) return true;

    const fromDateControl = this.criteriaForm.get('fromDate');
    const toDateControl = this.criteriaForm.get('toDate');
    if (fromDateControl?.hasError('matDatepickerParse') ||
        toDateControl?.hasError('matDatepickerParse')) {
      return true;
    }

    return false;
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;

    const formValue = this.criteriaForm.value;

    this.requestState = {
      fromDate: formValue.fromDate ? moment(formValue.fromDate).format('YYYY-MM-DD') : '',
      toDate: formValue.toDate ? moment(formValue.toDate).format('YYYY-MM-DD') : '',
      productType: formValue.productType || null,
      attributeGroup: formValue.attributeGroup || null,
      attributeCode: formValue.attributeCode?.attributeCode || null,
      bloodType: formValue.bloodType || null,
      expired: this.appliedStatusFilters?.expired || null,
      interdicted: this.appliedStatusFilters?.interdicted || null,
      available: this.appliedStatusFilters?.available || null,
      labeled: this.appliedStatusFilters?.labeled || null,
      rejected: this.appliedStatusFilters?.rejected || null,
      tested: this.appliedStatusFilters?.tested || null,
      shipped: this.appliedStatusFilters?.shipped || null,
      take: this.tableConfig.pagination?.pageSize || 10,
      skip: 0,
      sortColumn: this.requestState.sortColumn,
      sortOrder: this.requestState.sortOrder
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onClearAll(): void {
    this.criteriaForm.reset({
      fromDate: null,
      toDate: null,
      productType: null,
      attributeGroup: null,
      attributeCode: null,
      bloodType: null
    });

    this.filteredProductTypeOptions = [...this.productTypeOptions];
    this.filteredAttributeGroupOptions = [...this.attributeGroupOptions];
    this.filteredAttributeCodeOptions = [...this.attributeCodeOptions];
    this.filteredBloodTypeOptions = [...this.bloodTypeOptions];

    this.appliedStatusFilters = null;
    this.filterChips = [];

    this.requestState = {
      fromDate: '',
      toDate: '',
      take: this.tableConfig.pagination?.pageSize || 10,
      skip: 0
    };

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }

    this.dataSource = [];
    this.updateUnitIdHeader();
  }

  loadData(): void {
    if (!this.requestState.fromDate || !this.requestState.toDate) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    const skip =
      (this.tableConfig.pagination?.pageIndex || 0) *
      (this.tableConfig.pagination?.pageSize || 10);

    const take = this.tableConfig.pagination?.pageSize || 10;

    const queryDto: UnitProductQueryDto = {
      ...this.requestState,
      take,
      skip
    };

    this.service
      .searchUnits(queryDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.total;
          this.isLoading = false;
          this.updateUnitIdHeader();
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading find units and products data', error);
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load data. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  private updateUnitIdHeader(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.getTableColumns()
    };
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    const sortColumnMap: Record<string, string> = {
      'unitId': 'UnitId',
      'collectionDate': 'CollectionDate',
      'productCode': 'ProductCode',
      'expirationDate': 'ExpirationDate'
    };

    this.requestState.sortColumn = sortColumnMap[event.column] || undefined;
    this.requestState.sortOrder =
      event.direction === 'A' ? 'ASC' :
      event.direction === 'D' ? 'DESC' : undefined;

    this.loadData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.closeOverlay();
      return;
    }

    this.isFilterOpen = true;

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 56
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(FinduFilterPanelComponent);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedStatusFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(filters => {
        this.applyStatusFilters(filters);
        this.closeOverlay();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeOverlay();
      });
  }

  applyStatusFilters(filters: StatusFilterValue): void {
    this.appliedStatusFilters = filters;
    this.filterChips = FinduFilterChipsUtils.convertStatusFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      expired: filters.expired || null,
      interdicted: filters.interdicted || null,
      available: filters.available || null,
      labeled: filters.labeled || null,
      rejected: filters.rejected || null,
      tested: filters.tested || null,
      shipped: filters.shipped || null
    };

    if (this.requestState.fromDate && this.requestState.toDate) {
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }
      this.requestState.skip = 0;
      this.loadData();
    }
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedStatusFilters = FinduFilterChipsUtils.removeStatusFilterByChipKey(
      this.appliedStatusFilters,
      chipKey
    );

    this.filterChips = FinduFilterChipsUtils.convertStatusFiltersToChips(this.appliedStatusFilters);

    this.requestState = {
      ...this.requestState,
      expired: this.appliedStatusFilters?.expired || null,
      interdicted: this.appliedStatusFilters?.interdicted || null,
      available: this.appliedStatusFilters?.available || null,
      labeled: this.appliedStatusFilters?.labeled || null,
      rejected: this.appliedStatusFilters?.rejected || null,
      tested: this.appliedStatusFilters?.tested || null,
      shipped: this.appliedStatusFilters?.shipped || null
    };

    if (this.requestState.fromDate && this.requestState.toDate) {
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }
      this.requestState.skip = 0;
      this.loadData();
    }
  }

  hasActiveStatusFilters(): boolean {
    return FinduFilterChipsUtils.hasActiveStatusFilters(this.appliedStatusFilters);
  }

  clearStatusFilters(): void {
    this.appliedStatusFilters = null;
    this.filterChips = [];

    this.requestState = {
      ...this.requestState,
      expired: null,
      interdicted: null,
      available: null,
      labeled: null,
      rejected: null,
      tested: null,
      shipped: null
    };

    if (this.requestState.fromDate && this.requestState.toDate) {
      if (this.tableConfig.pagination) {
        this.tableConfig.pagination.pageIndex = 0;
      }
      this.requestState.skip = 0;
      this.loadData();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.closeOverlay();
    }
  }

  onFromDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(inputValue, this.criteriaForm.get('fromDate'));
  }

  onToDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(inputValue, this.criteriaForm.get('toDate'));
  }

  getFromDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.criteriaForm.get('fromDate'),
      this.criteriaForm.errors,
      'From Collection Date'
    );
  }

  getToDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.criteriaForm.get('toDate'),
      this.criteriaForm.errors,
      'To Collection Date',
      'To Collection Date must be on or after From Collection Date'
    );
  }
}
