import { Component, OnInit, OnDestroy, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { ServiceHistoryDetailsDialogComponent } from '../service-history-query/service-history-details-dialog/service-history-details-dialog';

import { DowntimeHistoryQueryService } from './services/downtime-history-query.service';
import { DowntimeHistoryQueryServiceMock } from './services/downtime-history-query.service.mock';
import {
  DowntimeHistoryModel,
  DowntimeHistoryParamsDto,
  EquipmentTypeLookup,
  EquipmentIdLookup,
  EquipmentReferenceLookup
} from './models/downtime-history-query.model';

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
  selector: 'app-downtime-history-query',
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
  templateUrl: './downtime-history-query.html',
  styleUrls: ['./downtime-history-query.scss'],
  providers: [
    DowntimeHistoryQueryService,
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } }
  ]
})
export class DowntimeHistoryQueryComponent implements OnInit, OnDestroy {
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Left table: Equipment list
  equipmentTableConfig: DataTableConfig<any> = {
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
      column: 'equipReference',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No Results to Display',
    noDataIcon: 'search',
    loadingMessage: 'Loading equipment data...',
    showPagination: false
  };

  // Right table: Downtime details for selected equipment
  downtimeDetailsTableConfig: DataTableConfig<DowntimeHistoryModel> = {
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
      column: 'downtimeStart',
      direction: 'D'
    },
    stickyHeader: true,
    stickyActionsColumn: false,
    emptyMessage: 'No downtime records for this equipment',
    noDataIcon: 'search',
    loadingMessage: 'Loading downtime details...',
    showPagination: false
  };

  // Private mapping: formatted dropdown text → { equipType code, downtime description }
  private equipmentTypeDetailsMap = computed<Map<string, { typeCode: string, description: string }>>(() => {
    const data = this.allDowntimeData();
    const map = new Map<string, { typeCode: string, description: string }>();

    data
      .filter(item => item.equipType)
      .forEach(item => {
        // Formatted text for dropdown display (e.g., "CENT - Centrifuge Maintenance")
        const formattedText = item.downtimeDescription
          ? `${item.equipType} - ${item.downtimeDescription}`
          : item.equipType!;

        // Store mapping: formattedText → { typeCode, description }
        map.set(formattedText, {
          typeCode: item.equipType!,
          description: item.downtimeDescription || ''
        });
      });

    return map;
  });

  // Computed: Extract ALL equipment types from all data (including duplicates)
  // For smart-dropdown, we put the formatted text in the 'code' field since that's what displays
  equipmentTypes = computed<EquipmentTypeLookup[]>(() => {
    const data = this.allDowntimeData();

    // Code = formatted text shown in dropdown (e.g., "CENT - Centrifuge Maintenance")
    // Description = same as code (smart-dropdown displays 'code' field)
    return data
      .filter(item => item.equipType)
      .map(item => {
        const formattedText = item.downtimeDescription
          ? `${item.equipType} - ${item.downtimeDescription}`
          : item.equipType!;

        return {
          code: formattedText,
          description: formattedText
        };
      });
  });

  // Computed: Extract ALL equipment IDs for selected type (including duplicates)
  equipmentIds = computed<EquipmentIdLookup[]>(() => {
    const selectedTypeCode = this.selectedEquipmentTypeCode();
    if (!selectedTypeCode) return [];

    const data = this.allDowntimeData();

    // Return ALL IDs for selected type, including duplicates
    return data
      .filter(item => item.equipType === selectedTypeCode && item.equipId)
      .map(item => ({
        code: item.equipId!,
        description: `${item.equipId} - ${item.equipReference || ''}`
      }));
  });

  // Computed: Extract ALL equipment references for selected type and ID (including duplicates)
  equipmentReferences = computed<EquipmentReferenceLookup[]>(() => {
    const selectedTypeCode = this.selectedEquipmentTypeCode();
    const selectedId = this.selectedEquipmentId();
    if (!selectedTypeCode || !selectedId) return [];

    const data = this.allDowntimeData();

    // Return ALL references for selected type and ID, including duplicates
    return data
      .filter(item => item.equipType === selectedTypeCode && item.equipId === selectedId && item.equipReference)
      .map(item => ({
        code: item.equipReference!,
        description: item.equipReference!
      }));
  });

  // Stores the formatted dropdown text (e.g., "CENT - Centrifuge Maintenance")
  selectedEquipmentType = signal<string | null>(null);
  selectedEquipmentId = signal<string | null>(null);

  // Computed: Extract actual equipment type code from formatted dropdown text
  private selectedEquipmentTypeCode = computed<string | null>(() => {
    const formattedText = this.selectedEquipmentType();
    if (!formattedText) return null;

    const details = this.equipmentTypeDetailsMap().get(formattedText);
    return details?.typeCode || null;
  });

  // Date filter form with validation
  dateFilterForm!: FormGroup;

  // Error state matchers for date fields
  startDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getStartDateError()
  );
  endDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEndDateError()
  );

  dataSource = signal<DowntimeHistoryModel[]>([]);
  allDowntimeData = signal<DowntimeHistoryModel[]>([]); // Stores ALL data for dropdown population
  isLoading = signal(false);
  error = signal(false);
  hasRetrieved = signal(false);

  private destroy$ = new Subject<void>();

  // Computed: ALL equipment list from downtime data (including duplicates)
  // Each row represents a separate downtime event
  equipmentList = computed(() => {
    const data = this.dataSource();

    // Return ALL equipment entries, one per downtime event
    return data.map(item => ({
      eventReference: item.eventReference, // Keep event reference to identify specific event
      equipType: item.equipType,
      equipId: item.equipId,
      equipStatus: item.equipStatus,
      equipReference: item.equipReference
    }));
  });

  // Computed values for dropdowns
  equipmentTypesForDropdown = computed<DropdownItem[]>(() =>
    this.equipmentTypes().map(type => ({
      code: type.code || '',
      description: type.description || ''
    }))
  );

  equipmentIdsForDropdown = computed<DropdownItem[]>(() =>
    this.equipmentIds().map(id => ({
      code: id.code || '',
      description: id.description || ''
    }))
  );

  // Computed: Get description for selected equipment type
  // Shows only the downtime description (not the full "CODE - Description" format)
  equipmentTypeDescription = computed(() => {
    const formattedText = this.selectedEquipmentType();
    if (!formattedText) return '';

    // Look up description from the details map
    const detailsMap = this.equipmentTypeDetailsMap();
    const details = detailsMap.get(formattedText);
    return details?.description || '';
  });

  equipmentReference = computed(() => {
    const refs = this.equipmentReferences();
    if (refs.length === 1 && refs[0].code) {
      return refs[0].code;
    }
    return '';
  });

  hasData = computed(() => this.dataSource().length > 0);

  constructor(
    private downtimeHistoryQueryService: DowntimeHistoryQueryService,
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
    this.loadAllData();
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

    // Equipment table configuration (left side)
    this.equipmentTableConfig = {
      columns: this.getEquipmentTableColumns(),
      rowActions: this.getEquipmentRowActions(),
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'equipReference',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Results to Display',
      noDataIcon: 'search',
      loadingMessage: 'Loading equipment data...',
      showPagination: false
    };

    // Downtime details table configuration (right side)
    this.downtimeDetailsTableConfig = {
      columns: this.getDowntimeDetailsTableColumns(),
      rowActions: [],
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      sortConfig: {
        column: 'downtimeStart',
        direction: 'D'
      },
      stickyHeader: true,
      stickyActionsColumn: false,
      emptyMessage: 'No downtime records for this equipment',
      noDataIcon: 'search',
      loadingMessage: 'Loading downtime details...',
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
        this.loadAllData();
      });
  }

  /**
   * Load all downtime data on init to populate dropdowns
   * This calls the main query endpoint with empty body to get ALL events
   */
  private loadAllData(): void {
    this.isLoading.set(true);

    // Call main query with empty params to get ALL data
    const params: DowntimeHistoryParamsDto = {};
    const take = 100; // API maximum is 100 records per request
    const skip = 0;

    this.downtimeHistoryQueryService
      .getDowntimeHistory(params, take, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.allDowntimeData.set(response.data || []);
          } else {
            console.error('Error loading all data:', response.message);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading all data:', error);
          this.isLoading.set(false);
        }
      });
  }

  onEquipmentTypeChange(typeCode: string | string[] | null): void {
    const code = Array.isArray(typeCode) ? typeCode[0] : typeCode;
    this.selectedEquipmentType.set(code);

    // Clear dependent fields
    this.selectedEquipmentId.set(null);
    // Note: equipmentIds and equipmentReferences are now computed signals,
    // they will automatically update when selectedEquipmentType changes
  }

  onEquipmentIdChange(idCode: string | string[] | null): void {
    const code = Array.isArray(idCode) ? idCode[0] : idCode;
    this.selectedEquipmentId.set(code);
    // Note: equipmentReferences is now a computed signal,
    // it will automatically update when selectedEquipmentId changes
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
    // Note: equipmentIds and equipmentReferences are computed signals,
    // they will automatically clear when selectedEquipmentType/Id are set to null

    // Reset date filter form
    this.dateFilterForm.reset({
      startDate: null,
      endDate: null
    });

    this.hasRetrieved.set(false);

    // Reset pagination
    if (this.equipmentTableConfig.pagination) {
      this.equipmentTableConfig.pagination.pageIndex = 0;
    }

    // Clear data
    this.dataSource.set([]);
    if (this.equipmentTableConfig.pagination) {
      this.equipmentTableConfig.pagination.totalRecords = 0;
    }
  }


  loadData(): void {
    this.isLoading.set(true);
    this.error.set(false);

    // Get dates from form
    const startDate = this.dateFilterForm.get('startDate')?.value;
    const endDate = this.dateFilterForm.get('endDate')?.value;

    // Convert dates to YYYY-MM-DD format (date-only, no timezone conversion)
    const startDateGmt = startDate ? moment(startDate).format('YYYY-MM-DD') : null;
    const endDateGmt = endDate ? moment(endDate).format('YYYY-MM-DD') : null;

    const params: DowntimeHistoryParamsDto = {
      equipmentType: this.selectedEquipmentTypeCode() || null, // Use actual type code, not formatted text
      equipmentId: this.selectedEquipmentId() || null,
      equipmentReference: this.equipmentReference() || null,
      startDate: startDateGmt,
      endDate: endDateGmt,
    };

    // Pagination parameters for API
    const pageSize = this.downtimeDetailsTableConfig.pagination?.pageSize || 1000;
    const pageIndex = this.downtimeDetailsTableConfig.pagination?.pageIndex || 0;
    const take = pageSize;
    const skip = pageIndex * pageSize;

    this.downtimeHistoryQueryService
      .getDowntimeHistory(params, take, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.set(response.data || []);
            if (this.equipmentTableConfig.pagination) {
              this.equipmentTableConfig.pagination.totalRecords = response.total || 0;
            }
          } else {
            console.error('Downtime history query failed:', response.message);
            this.dataSource.set([]);
            this.error.set(true);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading downtime history:', error);

          // Handle 404 with error code 1368 - no data found
          if (error.status === 404 && error.error?.errorCode === '1368') {
            this.snackBar.open(
              `Error Code 1368: No downtime history records found`,
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
          } else {
            // Handle other errors
            const errorMessage = error.error?.message || error.message || 'An error occurred while loading downtime history';
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
          }

          this.isLoading.set(false);
        }
      });
  }

  // Equipment table columns (left side)
  private getEquipmentTableColumns(): TableColumn<any>[] {
    return [
      {
        key: 'equipType',
        header: 'Equipment Type',
        sortable: false,
        width: '150px'
      },
      {
        key: 'equipId',
        header: 'Equipment ID',
        sortable: false,
        width: '120px'
      },
      {
        key: 'equipStatus',
        header: 'Status',
        sortable: false,
        width: '100px'
      },
      {
        key: 'equipReference',
        header: 'Reference',
        sortable: false,
        width: '130px'
      }
    ];
  }

  // Downtime details table columns (right side)
  private getDowntimeDetailsTableColumns(): TableColumn<DowntimeHistoryModel>[] {
    return [
      {
        key: 'downtimeDescription',
        header: 'Downtime Reason',
        sortable: false,
        width: '200px'
      },
      {
        key: 'downtimeStart',
        header: 'Downtime Start',
        sortable: false,
        width: '180px',
        valueFormatter: (value) => this.formatDateTime(value)
      },
      {
        key: 'downtimeEnd',
        header: 'Downtime End',
        sortable: false,
        width: '180px',
        valueFormatter: (value) => this.formatDateTime(value)
      },
      {
        key: 'serviceTypeDescription',
        header: 'Service Type',
        sortable: false,
        width: '200px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'servicePerson',
        header: 'Service Person',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value || '-'
      },
      {
        key: 'downtimeFlag',
        header: 'Scheduled',
        sortable: false,
        width: '100px'
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

  // Equipment row actions (left table) - click to view details
  private getEquipmentRowActions(): RowAction<any>[] {
    return [
      {
        icon: 'visibility',
        label: 'View equipment details',
        ariaLabel: 'View equipment details for {{equipReference}}',
        action: 'view'
      }
    ];
  }

  // Handle equipment row action (open details dialog)
  onEquipmentRowAction(event: TableRowActionEvent<any>): void {
    if (event.action === 'view') {
      this.viewEquipmentDetails(event.row);
    }
  }

  // Open equipment details dialog
  viewEquipmentDetails(equipment: any): void {
    // Find the specific downtime event by eventReference
    const downtimeEvent = this.dataSource().find(item =>
      item.eventReference === equipment.eventReference
    );

    // If downtime event found, show its details
    if (downtimeEvent) {
      // Map downtime history fields to service history dialog fields
      const mappedData = {
        ...downtimeEvent,
        // Map serviceType to serviceCode for the dialog
        serviceCode: downtimeEvent.serviceType,
        serviceDescription: downtimeEvent.serviceTypeDescription
      };

      this.dialog.open(ServiceHistoryDetailsDialogComponent, {
        width: '900px',
        maxWidth: '90vw',
        height: '100vh',
        position: {
          right: '0',
          top: '64px'
        },
        panelClass: 'right-side-dialog',
        data: mappedData, // Show mapped downtime event details
        autoFocus: false,
        restoreFocus: true,
        hasBackdrop: true,
        backdropClass: 'dialog-backdrop',
        disableClose: true
      });
    }
  }
}
