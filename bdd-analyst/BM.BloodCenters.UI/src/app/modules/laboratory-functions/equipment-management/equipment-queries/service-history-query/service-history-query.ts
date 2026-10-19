import { Component, OnInit, OnDestroy, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { ServiceHistoryDetailsDialogComponent } from './service-history-details-dialog/service-history-details-dialog';

import { ServiceHistoryQueryService } from './services/service-history-query.service';
import {
  ServiceHistoryModel,
  ServiceHistoryParamsDto,
  EquipmentTypeLookup,
  EquipmentIdLookup,
  EquipmentReferenceLookup
} from './models/service-history-query.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { SmartDropdownComponent, DropdownItem } from '@shared/components/smart-dropdown/smart-dropdown';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

@Component({
  selector: 'app-service-history-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SmartDropdownComponent
  ],
  templateUrl: './service-history-query.html',
  styleUrls: ['./service-history-query.scss'],
  providers: [
    ServiceHistoryQueryService,
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } }
  ]
})
export class ServiceHistoryQueryComponent implements OnInit, OnDestroy {
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<ServiceHistoryModel> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'serviceStart',
      direction: 'D'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No Results to Display\nScan or enter a Unit ID to begin.',
    noDataIcon: 'search',
    loadingMessage: 'Loading service history data...',
    showPagination: false
  };

  // Signals for reactive state
  equipmentTypes = signal<EquipmentTypeLookup[]>([]);
  equipmentIds = signal<EquipmentIdLookup[]>([]);
  equipmentReferences = signal<EquipmentReferenceLookup[]>([]);

  selectedEquipmentType = signal<string | null>(null);
  selectedEquipmentId = signal<string | null>(null);

  // Date filter form with validation
  dateFilterForm!: FormGroup;

  // Error state matchers for date fields
  startDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getStartDateError()
  );
  endDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEndDateError()
  );

  dataSource = signal<ServiceHistoryModel[]>([]);
  isLoading = signal(false);
  error = signal(false);
  hasRetrieved = signal(false);
  statusMessage = signal('');

  private destroy$ = new Subject<void>();

  // Computed values for dropdowns
  equipmentTypesForDropdown = computed<DropdownItem[]>(() =>
    this.equipmentTypes().map(type => ({
      code: type.equipType || '',
      description: `${type.equipType} - ${type.equipTypeDescription || ''}`
    }))
  );

  equipmentIdsForDropdown = computed<DropdownItem[]>(() =>
    this.equipmentIds().map(id => ({
      code: id.equipId || '',
      description: id.equipId || ''
    }))
  );

  equipmentTypeDescription = computed(() => {
    const typeCode = this.selectedEquipmentType();
    if (!typeCode) return '';
    const type = this.equipmentTypes().find(t => t.equipType === typeCode);
    return type?.equipTypeDescription || '';
  });

  equipmentReference = computed(() => {
    const refs = this.equipmentReferences();
    if (refs.length === 1 && refs[0].equipReference) {
      return refs[0].equipReference;
    }
    return '';
  });

  hasData = computed(() => this.dataSource().length > 0);

  constructor(
    private serviceHistoryQueryService: ServiceHistoryQueryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private fb: FormBuilder
  ) {
    this.initializeConfigurations();
    this.initializeDateFilterForm();

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadEquipmentTypes();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.pageHeaderConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: []
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'serviceStart',
        direction: 'D'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Results to Display\nScan or enter a Unit ID to begin.',
      noDataIcon: 'search',
      loadingMessage: 'Loading service history data...',
      showPagination: false
    };
  }

  private initializeDateFilterForm(): void {
    // Initialize form with cross-field validation for date range
    this.dateFilterForm = this.fb.group({
      startDate: [null],
      endDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('startDate', 'endDate')]
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAllFilters();
        this.loadEquipmentTypes();
      });
  }

  private loadEquipmentTypes(): void {
    this.serviceHistoryQueryService
      .getEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.equipmentTypes.set(types);
        },
        error: (error) => {
          console.error('Error loading equipment types:', error);
        }
      });
  }

  onEquipmentTypeChange(typeCode: string | string[] | null): void {
    const code = Array.isArray(typeCode) ? typeCode[0] : typeCode;
    this.selectedEquipmentType.set(code);

    // Clear dependent fields
    this.selectedEquipmentId.set(null);
    this.equipmentIds.set([]);
    this.equipmentReferences.set([]);

    // Load equipment IDs if type is selected
    if (code) {
      this.loadEquipmentIds(code);
    }
  }

  private loadEquipmentIds(equipmentType: string): void {
    this.serviceHistoryQueryService
      .getEquipmentIds(equipmentType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ids) => {
          this.equipmentIds.set(ids);
        },
        error: (error) => {
          console.error('Error loading equipment IDs:', error);
        }
      });
  }

  onEquipmentIdChange(idCode: string | string[] | null): void {
    const code = Array.isArray(idCode) ? idCode[0] : idCode;
    this.selectedEquipmentId.set(code);

    // Clear equipment reference
    this.equipmentReferences.set([]);

    // Load equipment references if ID is selected
    const typeCode = this.selectedEquipmentType();
    if (typeCode && code) {
      this.loadEquipmentReferences(typeCode, code);
    }
  }

  private loadEquipmentReferences(equipmentType: string, equipmentId: string): void {
    this.serviceHistoryQueryService
      .getEquipmentReferences(equipmentType, equipmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (references) => {
          this.equipmentReferences.set(references);
        },
        error: (error) => {
          console.error('Error loading equipment references:', error);
        }
      });
  }

  /**
   * Handle keyboard input for Start Date field
   * Uses DateFieldValidationUtility for consistent validation behavior
   */
  onStartDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(
      inputValue,
      this.dateFilterForm.get('startDate')
    );
  }

  /**
   * Handle blur event for Start Date field
   */
  onStartDateBlur(): void {
    const control = this.dateFilterForm.get('startDate');
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  /**
   * Handle keyboard input for End Date field
   * Uses DateFieldValidationUtility for consistent validation behavior
   */
  onEndDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(
      inputValue,
      this.dateFilterForm.get('endDate'),
      false // not edit mode
    );
  }

  /**
   * Handle blur event for End Date field
   */
  onEndDateBlur(): void {
    const control = this.dateFilterForm.get('endDate');
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  /**
   * Handle date change event for Start Date (when date is selected from picker or parsed)
   */
  onStartDateChange(): void {
    const control = this.dateFilterForm.get('startDate');
    if (control) {
      control.updateValueAndValidity();
    }
  }

  /**
   * Handle date change event for End Date (when date is selected from picker or parsed)
   */
  onEndDateChange(): void {
    const control = this.dateFilterForm.get('endDate');
    if (control) {
      control.updateValueAndValidity();
    }
  }

  /**
   * Get error message for Start Date field
   */
  getStartDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.dateFilterForm.get('startDate'),
      'Start Date',
      'End Date',
      this.dateFilterForm.errors
    );
  }

  /**
   * Get error message for End Date field
   */
  getEndDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.dateFilterForm.get('endDate'),
      'End Date',
      'Start Date',
      this.dateFilterForm.errors
    );
  }

  hasActiveFilters(): boolean {
    const startDate = this.dateFilterForm.get('startDate')?.value;
    const endDate = this.dateFilterForm.get('endDate')?.value;

    return !!(
      this.selectedEquipmentType() ||
      this.selectedEquipmentId() ||
      startDate ||
      endDate
    );
  }

  onRetrieveClick(): void {
    // Mark form as touched to show validation errors
    this.dateFilterForm.markAllAsTouched();

    // Check if form is invalid (date range error)
    if (this.dateFilterForm.invalid) {
      return;
    }

    this.hasRetrieved.set(true);
    this.loadData();
  }

  clearAllFilters(): void {
    this.selectedEquipmentType.set(null);
    this.selectedEquipmentId.set(null);
    this.equipmentIds.set([]);
    this.equipmentReferences.set([]);

    // Reset date filter form
    this.dateFilterForm.reset({
      startDate: null,
      endDate: null
    });

    this.hasRetrieved.set(false);

    // Reset pagination
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    // Clear data
    this.dataSource.set([]);
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = 0;
    }
  }


  loadData(): void {
    this.isLoading.set(true);
    this.error.set(false);
    this.statusMessage.set('Loading service history data...');

    // Get dates from form
    const startDate = this.dateFilterForm.get('startDate')?.value;
    const endDate = this.dateFilterForm.get('endDate')?.value;

    // Convert dates to chapter GMT timezone for API
    const startDateGmt = startDate ? this.chapterTimezoneService.convertLocalToGmt(moment(startDate)).toISOString() : undefined;
    const endDateGmt = endDate ? this.chapterTimezoneService.convertLocalToGmt(moment(endDate)).toISOString() : undefined;

    const params: ServiceHistoryParamsDto = {
      equipmentType: this.selectedEquipmentType() || undefined,
      equipmentId: this.selectedEquipmentId() || undefined,
      equipmentReference: this.equipmentReference() || undefined,
      startDate: startDateGmt,
      endDate: endDateGmt,
    };

    this.serviceHistoryQueryService
      .getServiceHistory(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const records = response.data || [];
            this.dataSource.set(records);
            if (this.tableConfig.pagination) {
              this.tableConfig.pagination.totalRecords = response.total || 0;
            }
            this.statusMessage.set(
              records.length > 0
                ? `${records.length} service history record${records.length === 1 ? '' : 's'} found.`
                : 'No service history records found for the selected filters.'
            );
          } else {
            console.error('Service history query failed:', response.message);
            this.dataSource.set([]);
            this.error.set(true);
            this.statusMessage.set('Unable to load data. Please try again.');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading service history:', error);

          // Handle 404 with error code 1369 - no data found
          if (error.status === 404 && error.error?.errorCode === '1369') {
            this.snackBar.open(
              `Error Code 1369: No service history records found`,
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
            this.dataSource.set([]);
            this.error.set(false);
            this.statusMessage.set('No service history records found.');
          } else {
            // Handle other errors
            const errorMessage = error.error?.message || error.message || 'An error occurred while loading service history';
            const errorCode = error.error?.errorCode || error.status;

            this.snackBar.open(
              errorCode ? `Error Code ${errorCode}: ${errorMessage}` : errorMessage,
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
            this.dataSource.set([]);
            this.error.set(true);
            this.statusMessage.set('Unable to load data. Please try again.');
          }

          this.isLoading.set(false);
        }
      });
  }

  private getTableColumns(): TableColumn<ServiceHistoryModel>[] {
    return [
      {
        key: 'equipType',
        header: 'Equipment Type',
        sortable: false,
        width: '120px'
      },
      {
        key: 'equipId',
        header: 'Equipment ID',
        sortable: false,
        width: '100px'
      },
      {
        key: 'equipReference',
        header: 'Reference',
        sortable: false,
        width: '110px'
      },
      {
        key: 'equipStatus',
        header: 'Status',
        sortable: false,
        width: '90px'
      },
      {
        key: 'serviceDescription',
        header: 'Service Reason',
        sortable: false,
        width: '200px'
      },
      {
        key: 'serviceStart',
        header: 'Start Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => this.formatDateTime(value)
      },
      {
        key: 'serviceEnd',
        header: 'End Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => this.formatDateTime(value)
      },
      {
        key: 'downtimeFlag',
        header: 'Scheduled',
        sortable: false,
        width: '120px'
      }
    ];
  }

  private formatDateTime(dateTime: Date | string | null | undefined): string {
    if (!dateTime) return '-';

    const d = new Date(dateTime);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private getRowActions(): RowAction<ServiceHistoryModel>[] {
    return [
      {
        icon: 'visibility',
        label: 'View service event details',
        ariaLabel: 'View details for equipment {{equipReference}}',
        action: 'view'
      }
    ];
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

  onRowAction(event: TableRowActionEvent<ServiceHistoryModel>): void {
    if (event.action === 'view') {
      this.viewDetails(event.row);
    }
  }

  viewDetails(record: ServiceHistoryModel): void {
    this.dialog.open(ServiceHistoryDetailsDialogComponent, {
      width: '900px',
      maxWidth: '90vw',
      height: '100vh',
      position: {
        right: '0',
        top: '64px'
      },
      panelClass: 'right-side-dialog',
      data: record,
      autoFocus: 'dialog',
      restoreFocus: true,
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      disableClose: false
    });
  }
}
