import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Overlay, OverlayRef, OverlayModule, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChip, FilterChips } from '@shared/components/filter-chips/filter-chips';

import { ModifyCheckInBatchApiService } from './services/modify-check-in-batch-api.service';
import { EditBatchFormComponent } from './edit-batch-form/edit-batch-form';
import {
  CheckInBatchDto,
  CheckInBatchQueryParams,
  CheckInBatchFilterValue,
  ProductTypeOption,
  CheckInUserOption,
} from './models/modify-check-in-batch.model';
import { CheckInBatchFilterPanel } from './filter-panel/check-in-batch-filter-panel';
import { CheckInBatchFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-modify-check-in-batch-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    OverlayModule,
    SearchBar,
    DataTable,
    FilterChips,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    EditBatchFormComponent,
  ],
  templateUrl: './modify-check-in-batch-details.html',
  styleUrls: ['./modify-check-in-batch-details.scss'],
})
export class ModifyCheckInBatchDetailsComponent implements OnInit, OnDestroy {
  private readonly service = inject(ModifyCheckInBatchApiService);
  private readonly overlay = inject(Overlay);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;

  pageHeaderConfig: PageHeaderConfig = this.getPageHeaderConfig();

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by batch ID',
    ariaLabel: 'Search by batch ID',
    minLength: 1,
    searchOnEnterOnly: true,
    alwaysShowTooltip: false,
  };

  tableConfig: DataTableConfig<CheckInBatchDto> = {
    columns: [
      { key: 'batchId', header: 'Batch ID', sortable: true, width: '160px' },
      { key: 'contract', header: 'Contract', width: '140px' },
      { key: 'description', header: 'Description', width: '220px' },
      {
        key: 'minTemperature',
        header: 'Min Temperature',
        width: '140px',
        valueFormatter: (value) => value ? `${value}°C` : ''
      },
      {
        key: 'maxTemperature',
        header: 'Max Temperature',
        width: '140px',
        valueFormatter: (value) => value ? `${value}°C` : ''
      },
      { key: 'productType', header: 'Product Type', width: '200px' },
      { key: 'cartonCount', header: 'Carton Count', width: '120px' },
      { key: 'numberOfUnits', header: 'No. of Units', width: '120px' },
      {
        key: 'batchDate',
        header: 'Batch Date',
        width: '140px',
        valueFormatter: (value) => this.formatDateForDisplay(value)
      },
      {
        key: 'shippedDate',
        header: 'Shipped Date',
        width: '130px',
        valueFormatter: (value) => this.formatDateForDisplay(value)
      },
      {
        key: 'receivedDate',
        header: 'Received Date',
        width: '130px',
        valueFormatter: (value) => this.formatDateForDisplay(value)
      },
      {
        key: 'qcDate',
        header: 'QC Date',
        width: '130px',
        valueFormatter: (value) => this.formatDateForDisplay(value)
      },
      { key: 'checkInUserId', header: 'Check-In User Id', width: '140px' },
      { key: 'userName', header: 'User Name', width: '160px' },
    ],
    rowActions: [
      {
        icon: 'comment',
        label: 'Comments',
        ariaLabel: 'View/add comments',
        action: 'comment',
      },
      {
        icon: 'edit',
        label: 'Edit',
        ariaLabel: 'Edit batch details',
        action: 'edit',
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
      column: 'batchId',
      direction: 'default',
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    showPagination: true,
    emptyMessage: 'No check-in batches available to display',
    loadingMessage: 'Loading check-in batches...',
  };

  dataSource: CheckInBatchDto[] = [];
  isLoading = false;
  searchKeyword = '';
  filterOverlayRef: OverlayRef | null = null;
  appliedFilters: CheckInBatchFilterValue | null = null;
  filterChips: FilterChip[] = [];
  isFilterOpen = false;

  private overlayClose$ = new Subject<void>();

  productTypeOptions: ProductTypeOption[] = [];
  checkInUserOptions: CheckInUserOption[] = [];

  editPanelOpen = false;
  commentsPanelOpen = false;
  selectedBatch: CheckInBatchDto | null = null;

  ngOnInit(): void {
    console.log('[ModifyCheckInBatchDetails] Component initialized');

    // TODO: Uncomment when API is ready
    // this.loadDropdownOptions();
    // this.loadData();

    // TEMPORARY: Use mock data until API is implemented
    this.loadMockData();

    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetFilters();
        // TODO: Uncomment when API is ready
        // this.loadDropdownOptions();
        // this.loadData();
        this.loadMockData(); // TEMPORARY: Using mock data
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayClose$.next();
    this.overlayClose$.complete();
    this.closeFilterPanel();
  }

  private getPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || 'Modify Check-In Batch Details';
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null },
      ],
      subtitle: 'Update batch-level information captured during bag check-in and imported blood product check-in.',
    };
  }

  private loadDropdownOptions(): void {
    this.service
      .getDropdownOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productTypeOptions = response.productTypes;
          this.checkInUserOptions = response.checkInUsers;
        },
        error: (error) => {
          console.warn('[ModifyCheckInBatchDetails] Failed to load dropdown options (API not implemented yet):', error);
          // Set empty arrays so component still works
          this.productTypeOptions = [];
          this.checkInUserOptions = [];
        },
      });
  }

  // ===================== MOCK DATA (Temporary until API is ready) =====================

  private loadMockData(): void {
    console.log('[ModifyCheckInBatchDetails] Loading mock data...');

    // Mock dropdown options
    this.productTypeOptions = [
      { code: 'FFP', description: 'FFP - Fresh Frozen Pathogen' },
      { code: 'RBC', description: 'RBC - Red Blood Cells' },
      { code: 'PLT', description: 'PLT - Platelets' },
      { code: 'ADT', description: 'ADT - Autologous Donation Type' },
    ];

    this.checkInUserOptions = [
      { userId: 'CELIHUN', userName: 'MARINE HUNTER' },
      { userId: 'JLEE', userName: 'JOHN LEE' },
      { userId: 'MDAVIS', userName: 'MARY DAVIS' },
    ];

    // Mock batch data (matching Figma screenshots)
    this.dataSource = [
      {
        batchId: '111619-CB9006',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 25,
        maxTemperature: 25,
        productType: 'FFP - Fresh Frozen Pathogen',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'CELIHUN',
        userName: 'MARINE HUNTER',
      },
      {
        batchId: '111619-CB9007',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 15,
        maxTemperature: 15,
        productType: 'RBC - Red Blood Cells',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'CELIHUN',
        userName: 'MARINE HUNTER',
      },
      {
        batchId: '111619-CB9008',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 23,
        maxTemperature: 23,
        productType: 'FFP - Fresh Frozen Pathogen',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'JLEE',
        userName: 'JOHN LEE',
      },
      {
        batchId: '111619-CB9009',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 34,
        maxTemperature: 34,
        productType: 'RBC - Red Blood Cells',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'CELIHUN',
        userName: 'MARINE HUNTER',
      },
      {
        batchId: '111619-CB9010',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 33,
        maxTemperature: 33,
        productType: 'RBC - Red Blood Cells',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'MDAVIS',
        userName: 'MARY DAVIS',
      },
      {
        batchId: '111619-CB9011',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 22,
        maxTemperature: 22,
        productType: 'FFP - Fresh Frozen Pathogen',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'CELIHUN',
        userName: 'MARINE HUNTER',
      },
      {
        batchId: '111619-CB9012',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 25,
        maxTemperature: 25,
        productType: 'FFP - Fresh Frozen Pathogen',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'CELIHUN',
        userName: 'MARINE HUNTER',
      },
      {
        batchId: '111619-CB9013',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 25,
        maxTemperature: 25,
        productType: 'FFP - Fresh Frozen Pathogen',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'JLEE',
        userName: 'JOHN LEE',
      },
      {
        batchId: '111619-CB9014',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 25,
        maxTemperature: 25,
        productType: 'FFP - Fresh Frozen Pathogen',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'CELIHUN',
        userName: 'MARINE HUNTER',
      },
      {
        batchId: '111619-CB9015',
        contract: 'INTERNAL',
        description: 'Brooke Army Hospital',
        minTemperature: 25,
        maxTemperature: 25,
        productType: 'FFP - Fresh Frozen Pathogen',
        cartonCount: 1,
        numberOfUnits: 1,
        shippedDate: '2025-12-10',
        receivedDate: '2025-12-10',
        qcDate: '2025-12-10',
        batchDate: '2025-01-11',
        checkInUserId: 'MDAVIS',
        userName: 'MARY DAVIS',
      },
    ];

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = this.dataSource.length;
    }

    this.isLoading = false;
    this.cdr.detectChanges();
    console.log('[ModifyCheckInBatchDetails] Mock data loaded:', this.dataSource.length, 'records');
  }

  // ===================== DATA LOADING (Will use when API is ready) =====================

  loadData(): void {
    this.isLoading = true;

    const pageSize = this.tableConfig.pagination?.pageSize ?? 25;
    const pageIndex = this.tableConfig.pagination?.pageIndex ?? 0;

    const sortDir = this.tableConfig.sortConfig?.direction;
    const sortColumn = this.tableConfig.sortConfig?.column;

    const params: CheckInBatchQueryParams = {
      searchKeyword: this.searchKeyword || undefined,
      sortColumn: sortDir && sortDir !== 'default' ? sortColumn : undefined,
      sortOrder: sortDir === 'A' ? 'ASC' : sortDir === 'D' ? 'DESC' : undefined,
      productType: this.appliedFilters?.productType,
      checkInUserId: this.appliedFilters?.checkInUserId,
      shippedDatePeriod: this.appliedFilters?.shippedDatePeriod,
      shippedDate: this.appliedFilters?.shippedDate
        ? (DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.shippedDate) ?? undefined)
        : undefined,
      receivedDatePeriod: this.appliedFilters?.receivedDatePeriod,
      receivedDate: this.appliedFilters?.receivedDate
        ? (DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.receivedDate) ?? undefined)
        : undefined,
      qcDatePeriod: this.appliedFilters?.qcDatePeriod,
      qcDate: this.appliedFilters?.qcDate
        ? (DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.qcDate) ?? undefined)
        : undefined,
      batchDatePeriod: this.appliedFilters?.batchDatePeriod,
      batchDate: this.appliedFilters?.batchDate
        ? (DateFieldValidationUtility.serializeDateForApi(this.appliedFilters.batchDate) ?? undefined)
        : undefined,
    };

    this.service
      .getCheckInBatches(pageSize, pageIndex * pageSize, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.items || [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords || 0;
          }
          this.tableConfig = { ...this.tableConfig };
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.warn('[ModifyCheckInBatchDetails] Failed to load data (API not implemented yet):', error);
          this.dataSource = [];
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = 0;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSearch(keyword: string): void {
    const trimmed = keyword?.trim() || '';
    this.searchKeyword = trimmed;
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<CheckInBatchDto>): void {
    if (event.action === 'edit') {
      this.openEditPanel(event.row);
    } else if (event.action === 'comment') {
      this.openCommentsPanel(event.row);
    }
  }

  // ===================== FILTER PANEL =====================

  openFilterPanel(): void {
    if (this.filterOverlayRef) {
      this.closeFilterPanel();
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

    this.filterOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'filter-overlay-panel'
    });

    const filterPortal = new ComponentPortal(CheckInBatchFilterPanel);
    const componentRef = this.filterOverlayRef.attach(filterPortal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.productTypeOptions = this.productTypeOptions;
    componentRef.instance.checkInUserOptions = this.checkInUserOptions;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayClose$))
      .subscribe((filters) => {
        this.applyFilters(filters);
        this.closeFilterPanel();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeFilterPanel();
      });

    this.filterOverlayRef.backdropClick()
      .pipe(takeUntil(this.overlayClose$))
      .subscribe(() => {
        this.closeFilterPanel();
      });
  }

  closeFilterPanel(): void {
    this.overlayClose$.next();
    if (this.filterOverlayRef) {
      this.filterOverlayRef.dispose();
      this.filterOverlayRef = null;
    }
    this.isFilterOpen = false;
  }

  get isFilterActive(): boolean {
    return this.isFilterOpen || this.hasActiveFilters();
  }

  hasActiveFilters(): boolean {
    return CheckInBatchFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  applyFilters(filters: CheckInBatchFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = CheckInBatchFilterChipsUtils.convertFiltersToChips(filters);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = CheckInBatchFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = CheckInBatchFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  onClearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    if (this.tableConfig.pagination) this.tableConfig.pagination.pageIndex = 0;
    this.loadData();
  }

  private resetFilters(): void {
    this.searchKeyword = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.closeFilterPanel();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
  }

  // ===================== EDIT PANEL =====================

  openEditPanel(batch: CheckInBatchDto): void {
    this.selectedBatch = batch;
    this.editPanelOpen = true;
    this.cdr.detectChanges();
  }

  closeEditPanel(): void {
    this.editPanelOpen = false;
    this.selectedBatch = null;
    this.cdr.detectChanges();
  }

  onSaveBatch(updatedBatch: CheckInBatchDto): void {
    this.service
      .updateCheckInBatch(updatedBatch.batchId, {
        minTemp: updatedBatch.minTemperature,
        maxTemp: updatedBatch.maxTemperature,
        productType: updatedBatch.productType,
        shippedDate: updatedBatch.shippedDate,
        receivedDate: updatedBatch.receivedDate,
        qcDate: updatedBatch.qcDate,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Batch updated successfully');
          this.closeEditPanel();
          this.loadData();
        },
        error: () => {
          this.showSnackbar('Failed to update batch');
        },
      });
  }


  // ===================== COMMENTS PANEL =====================

  openCommentsPanel(batch: CheckInBatchDto): void {
    this.selectedBatch = batch;
    this.commentsPanelOpen = true;
    this.cdr.detectChanges();
  }

  closeCommentsPanel(): void {
    this.commentsPanelOpen = false;
    this.selectedBatch = null;
    this.cdr.detectChanges();
  }

  // ===================== UTILITIES =====================

  private formatDateForDisplay(date: string | null): string {
    if (!date) return '';
    const m = moment(date, 'YYYY-MM-DD');
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'f' && !this.isFilterActive) {
      event.preventDefault();
      this.openFilterPanel();
    }

    if (event.key === 'Escape') {
      if (this.editPanelOpen) {
        this.closeEditPanel();
      } else if (this.commentsPanelOpen) {
        this.closeCommentsPanel();
      } else if (this.isFilterActive) {
        this.closeFilterPanel();
      }
    }
  }
}
