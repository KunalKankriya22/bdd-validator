import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, FormGroupDirective, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment, { Moment } from 'moment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { DonorCommunicationQueryService } from './services/donor-communication-query.service';
import {
  CommunicationRecord,
  DonorCommunicationQueryRequest,
  ActionCodeOption,
  DropdownItem,
} from './models/donor-communication-query.model';
import { EditCommunicationDialog } from './dialogs/edit-communication-dialog';
import { DonorCommunicationsComponent } from '@shared/components/donor-communications/donor-communications';
import { DonorAttributesComponent } from '../donor-profile/donor-profile-maintenance/donor-attributes/donor-attributes.component';
import { DonorInterdictionsContentComponent } from '../donor-profile/donor-interdictions/donor-interdictions-content.component';
import { DonationDetailsDialogComponent } from '../donor-profile/donation-details/donation-details-dialog/donation-details-dialog';
import { DonorDemographicsComponent } from '../donor-demographics/donor-demographics';
import { DonorEligibilityPanel } from '../donor-eligibility/donor-eligibility-panel';
import { DonorEligibilityInput } from '../donor-eligibility/models/donor-eligibility.model';

/**
 * Donor Communication Query Component
 * JIRA: MLT-10996
 * Mnemonic: DCQDCOMM / DCOMQ
 * Path: Donor Functions => Donor Communication => Donor Communication Functions => Donor Communication Query
 */
@Component({
  selector: 'app-donor-communication-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    DonorCommunicationsComponent,
    DonorInterdictionsContentComponent,
    DonorDemographicsComponent,
    DonorAttributesComponent,
    DonorEligibilityPanel,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './donor-communication-query.html',
  styleUrls: ['./donor-communication-query.scss'],
})
export class DonorCommunicationQuery implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `donor-comm-query-${DonorCommunicationQuery.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Communication Query', link: null },
    ],
    title: 'Donor Communication Query',
  };

  // Dependencies
  private readonly fb = inject(FormBuilder);
  private readonly commService = inject(DonorCommunicationQueryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly communications = signal<CommunicationRecord[]>([]);
  protected readonly totalRecords = signal<number>(0);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionCodes = signal<ActionCodeOption[]>([]);
  protected readonly communicationTypes = signal<any[]>([]);
  protected readonly allCommunicationCodes = signal<any[]>([]);
  protected readonly communicationCodes = signal<any[]>([]);
  protected readonly users = signal<any[]>([]);
  protected readonly pageSize = signal<number>(25);
  protected readonly pageIndex = signal<number>(0);
  protected readonly sortColumn = signal<string>('insertDate');
  protected readonly sortOrder = signal<'ASC' | 'DESC'>('DESC');
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly formDirty = signal<boolean>(false);
  protected readonly minToDate = signal<Moment | null>(null);

  // Side panel state
  protected readonly sidePanelOpen = signal<boolean>(false);
  protected readonly sidePanelWidth = signal<string>('70vw');
  protected readonly sidePanelRow = signal<CommunicationRecord | null>(null);
  protected readonly currentSection = signal<'communicationLog' | 'interdictions' | 'demographics' | 'attributes' | null>(null);

  // Row expansion - using a custom Set to track expanded rows by composite key
  protected readonly expandedRows = new Set<string>();

  // Computed values
  protected readonly isEmpty = computed(() => this.communications().length === 0 && !this.hasSearched());
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasResults = computed(() => this.hasSearched() && this.communications().length > 0);
  protected readonly tableData = computed(() => {
    // Add unique row index to each row for expansion tracking
    // This ensures each row is uniquely identifiable even if data is duplicated
    return this.communications().map((comm, index) => ({
      ...comm,
      _expandKey: `${this.pageIndex()}_${index}_${comm.donorId}_${comm.comType}_${comm.comCode}_${comm.insertDate}`
    }));
  });

  // Form
  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;
  searchForm!: FormGroup;

  // Search controls for dropdowns
  protected readonly commTypeSearchControl = new FormControl('');
  protected readonly commCodeSearchControl = new FormControl('');
  protected readonly userSearchControl = new FormControl('');
  protected readonly commTypeSearch = signal('');
  protected readonly commCodeSearch = signal('');
  protected readonly userSearch = signal('');

  // Track selected values for custom displays
  private readonly userIdValue = signal<string | null>(null);
  private readonly commTypeValue = signal<string | null>(null);
  private readonly commCodeValue = signal<string | null>(null);

  // Filtered dropdown options
  protected readonly filteredCommTypes = computed(() => {
    const search = this.commTypeSearch().toLowerCase();
    const options = this.communicationTypes();
    if (!search) return options;
    return options.filter((o: any) =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  protected readonly filteredCommCodes = computed(() => {
    const search = this.commCodeSearch().toLowerCase();
    const selectedType = this.commTypeValue();
    let options = this.communicationCodes();
    if (selectedType) {
      options = options.filter((o: any) => o.commType === selectedType);
    }
    if (!search) return options;
    return options.filter((o: any) =>
      (o.commType || '').toLowerCase().includes(search) ||
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  protected readonly filteredUsers = computed(() => {
    const search = this.userSearch().toLowerCase();
    const options = this.users();
    if (!search) return options;
    return options.filter((o: any) =>
      (o.userId || '').toLowerCase().includes(search) ||
      (o.userName || '').toLowerCase().includes(search)
    );
  });

  // Custom display for selected values
  protected readonly selectedCommTypeDisplay = computed(() => {
    const selectedCode = this.commTypeValue();
    if (!selectedCode) return '';
    const type = this.communicationTypes().find((t: any) => t.code === selectedCode);
    if (!type) return selectedCode;
    return type.description ? `${type.code} - ${type.description}` : type.code;
  });

  protected readonly selectedCommCodeDisplay = computed(() => {
    const selectedCode = this.commCodeValue();
    if (!selectedCode) return '';
    const code = this.allCommunicationCodes().find((c: any) => c.code === selectedCode);
    if (!code) return selectedCode;
    const base = `${code.commType} - ${code.code}`;
    return code.description ? `${base} - ${code.description}` : base;
  });

  protected readonly selectedUserDisplay = computed(() => {
    const selectedId = this.userIdValue();
    if (!selectedId) return '';
    const user = this.users().find((u: any) => u.userId === selectedId);
    if (!user) return selectedId;
    return user.userName ? `${user.userId} - ${user.userName}` : user.userId;
  });

  // Dropdown tooltip truncation
  protected isUserTruncated = false;
  protected isCommTypeTruncated = false;
  protected isCommCodeTruncated = false;
  protected isLoadingUsers = false;

  // Table configuration
  tableConfig: DataTableConfig<CommunicationRecord> = {
    columns: [
      {
        key: 'donorId',
        header: 'Donor ID',
        sortable: true,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'comType',
        header: 'Communication\nType',
        sortable: false,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'comCode',
        header: 'Communication\nCode',
        sortable: false,
        type: 'text',
        minWidth: '140px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'insertUser',
        header: 'User ID',
        sortable: false,
        type: 'text',
        minWidth: '110px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'comDate',
        header: 'Communication Date',
        sortable: false,
        type: 'text',
        minWidth: '200px',
        valueFormatter: (value: string | null) => value ? moment(value, 'MM-DD-YYYY').format('DD-MMM-YYYY').toUpperCase() : '–'
      },
      {
        key: 'actionCode',
        header: 'Action Code',
        sortable: false,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value: string | null) => value || '–'
      },
      {
        key: 'targetDate',
        header: 'Target Date',
        sortable: false,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value: string | null) => value ? moment(value, 'MM-DD-YYYY').format('DD-MMM-YYYY').toUpperCase() : '–'
      },
      {
        key: 'actionDate',
        header: 'Action Date',
        sortable: false,
        type: 'text',
        minWidth: '130px',
        valueFormatter: (value: string | null) => value ? moment(value, 'MM-DD-YYYY').format('DD-MMM-YYYY').toUpperCase() : '–'
      },
      {
        key: 'comDesc',
        header: 'Comments',
        sortable: false,
        type: 'text',
        minWidth: '200px',
        valueFormatter: (value: string | null) => value || '–'
      }
    ],
    rowActions: [
      { label: 'Edit Donor Communication', action: 'edit' },
      { label: 'Communication Log', action: 'communicationLog' },
      { label: 'Attributes', action: 'attributes' },
      { label: 'Interdictions', action: 'interdictions' },
      { label: 'Donations', action: 'donations' },
      { label: 'Eligibility', action: 'eligibility' },
      { label: 'Demographics', action: 'demographics' }
    ],
    showActionsAsMenu: true,
    enableRowHighlight: false,
    stickyHeader: true,
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50]
    },
    sortConfig: {
      column: 'insertDate',
      direction: 'D'
    },
    emptyMessage: 'No communications found',
    loadingMessage: 'Loading communications...'
  };

  ngOnInit(): void {
    this.initForm();
    this.loadActionCodes();
    this.loadCommunicationDropdowns();
    this.loadUsers();
    this.setupFormListeners();
    this.setupSearchControls();
    this.setupDateValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize search form without default dates
   */
  private initForm(): void {
    this.searchForm = this.fb.group(
      {
        fromDate: [null, [Validators.required]],
        toDate: [null, [Validators.required]],
        user: [null],
        commType: [null],
        commCode: [null],
        donorId: [null],
        pendingActionsOnly: [false], // Future scope - backend support not yet implemented
      },
      {
        validators: [this.dateRangeValidator()],
      },
    );
  }

  /**
   * Get day of week from date (e.g., "Mon", "Tue")
   */
  protected getDayOfWeek(dateControl: any): string {
    if (!dateControl?.value) return '';
    const m = moment.isMoment(dateControl.value) ? dateControl.value : moment(dateControl.value);
    return m.isValid() ? m.format('dddd') : '';
  }

  /**
   * Custom validator to ensure To Date >= From Date
   */
  private dateRangeValidator() {
    return (formGroup: FormGroup) => {
      const fromDate = formGroup.get('fromDate')?.value;
      const toDate = formGroup.get('toDate')?.value;

      if (!fromDate || !toDate) {
        return null;
      }

      const from = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const to = moment.isMoment(toDate) ? toDate : moment(toDate);

      if (to.isBefore(from, 'day')) {
        return { dateRangeInvalid: true };
      }

      return null;
    };
  }

  get f() {
    return this.searchForm.controls;
  }

  /**
   * Load action codes for dropdown and edit dialog
   */
  private loadActionCodes(): void {
    this.commService.getActionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.actionCodes.set(codes);
        },
        error: (error) => {
          console.error('Failed to load action codes:', error);
          this.actionCodes.set([]);
        }
      });
  }

  /**
   * Load both communication types and codes using combined API endpoint
   */
  private loadCommunicationDropdowns(): void {
    this.commService.getCommunicationDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Map DropdownItem to CommunicationTypeOption format
          const types = response.communicationType.map((item: DropdownItem) => ({
            code: item.key,
            description: item.description
          }));

          // Map DropdownItem to CommunicationCodeOption format
          // item.value is "comm_type|comm_code" — extract comm_type for filtering
          // item.description is "TYPE - desc" — strip the type prefix
          const codes = response.communicationCode.map((item: DropdownItem) => {
            const commType = item.value?.split('|')[0] || '';
            const desc = item.description?.includes(' - ')
              ? item.description.substring(item.description.indexOf(' - ') + 3)
              : item.description;
            return { code: item.key, commType, description: desc };
          });

          this.communicationTypes.set(types);
          this.allCommunicationCodes.set(codes);
          this.communicationCodes.set(codes);
        },
        error: (error) => {
          console.error('Failed to load communication dropdowns:', error);
          this.communicationTypes.set([]);
          this.communicationCodes.set([]);
        }
      });
  }

  private loadUsers(): void {
    // Load users for the last 90 days by default (matching backend default)
    this.commService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users.set(users);
        },
        error: (error) => {
          console.error('Failed to load users:', error);
          this.users.set([]);
        }
      });
  }

  /**
   * Set up form listeners for cascading dropdowns
   */
  private setupFormListeners(): void {
    // Listen to communication type changes — filter communication codes
    this.searchForm.get('commType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedType) => {
        this.searchForm.patchValue({ commCode: null }, { emitEvent: false });
        this.commCodeValue.set(null);
        this.commCodeSearchControl.setValue('');
        if (selectedType) {
          this.communicationCodes.set(
            this.allCommunicationCodes().filter((c: any) => c.commType === selectedType)
          );
        } else {
          this.communicationCodes.set(this.allCommunicationCodes());
        }
      });

    // Track form dirty state for button enabling
    this.searchForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formDirty.set(this.searchForm.dirty);
      });
  }

  /**
   * Set up search controls for filterable dropdowns
   */
  private setupSearchControls(): void {
    this.commTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.commTypeSearch.set(value || ''));

    this.commCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.commCodeSearch.set(value || ''));

    this.userSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.userSearch.set(value || ''));

    // Track selected values for custom displays
    this.searchForm.get('user')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.userIdValue.set(val));

    this.searchForm.get('commType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.commTypeValue.set(val));

    this.searchForm.get('commCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.commCodeValue.set(val));
  }

  /**
   * Set up date validation listeners
   */
  private setupDateValidation(): void {
    this.searchForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.validateDates();
        // Set minimum date for To Date field
        if (value && moment.isMoment(value)) {
          this.minToDate.set(value);
        } else if (value) {
          this.minToDate.set(moment(value));
        } else {
          this.minToDate.set(null);
        }
      });

    this.searchForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDates());
  }

  /**
   * Execute search query
   */
  onSearch(): void {
    if (this.searchForm.invalid) {
      this.markFormGroupTouched(this.searchForm);
      this.focusFirstInvalidField();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    const formValue = this.searchForm.value;

    const request: DonorCommunicationQueryRequest = {
      fromDate: this.convertToISOString(formValue.fromDate, false),
      toDate: this.convertToISOString(formValue.toDate, true),
      userId: formValue.user || undefined,
      commType: formValue.commType || undefined,
      commCode: formValue.commCode || undefined,
      donorId: formValue.donorId || undefined,
      pendingActionsOnly: formValue.pendingActionsOnly || undefined,
      sortColumn: this.sortColumn(),
      sortOrder: this.sortOrder(),
    };

    const take = this.pageSize();
    const skip = this.pageIndex() * this.pageSize();

    this.commService.query(request, take, skip)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.communications.set(response.data);
          this.totalRecords.set(response.total);
          this.loading.set(false);

          // Update table pagination config
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.total,
              pageSize: this.pageSize(),
              pageIndex: this.pageIndex()
            }
          };
        },
        error: (error) => {
          this.error.set(this.getErrorMessage(error));
          this.loading.set(false);
          this.showError(this.getErrorMessage(error));
        }
      });
  }

  /**
   * Convert Moment to ISO string for API
   */
  private convertToISOString(date: Moment | string, endOfDay: boolean = false): string {
    const m = moment.isMoment(date) ? date : moment(date);
    if (endOfDay) {
      return m.endOf('day').toISOString();
    }
    return m.startOf('day').toISOString();
  }

  /**
   * Clear search form and results
   */
  onClear(): void {
    this.formDirective?.resetForm();

    this.searchForm.reset({
      fromDate: null,
      toDate: null,
      user: null,
      commType: null,
      commCode: null,
      donorId: null,
      pendingActionsOnly: false,
    });

    this.communications.set([]);
    this.totalRecords.set(0);
    this.pageIndex.set(0);
    this.error.set(null);
    this.hasSearched.set(false);
    this.formDirty.set(false);
    this.minToDate.set(null);
    this.userIdValue.set(null);
    this.commTypeValue.set(null);
    this.commCodeValue.set(null);
    this.userSearchControl.setValue('');
    this.commTypeSearchControl.setValue('');
    this.commCodeSearchControl.setValue('');
    this.isUserTruncated = false;
    this.isCommTypeTruncated = false;
    this.isCommCodeTruncated = false;
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: TablePageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);

    // Clear expanded rows when page changes
    this.expandedRows.clear();

    // Update table config
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageSize: event.pageSize,
        pageIndex: event.pageIndex
      }
    };

    this.onSearch();
  }

  /**
   * Handle sort change
   */
  onSortChange(event: TableSortEvent): void {
    if (event.column && event.direction) {
      this.sortColumn.set(event.column);
      this.sortOrder.set(event.direction === 'A' ? 'ASC' : 'DESC');
      this.pageIndex.set(0); // Reset to first page

      // Update table config
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

      this.onSearch();
    }
  }

  /**
   * Handle row action events
   */
  onRowAction(event: TableRowActionEvent<CommunicationRecord>): void {
    switch (event.action) {
      case 'edit':
        this.onEdit(event.row);
        break;
      case 'communicationLog':
        this.onCommunicationLog(event.row);
        break;
      case 'attributes':
        this.onAttributes(event.row);
        break;
      case 'interdictions':
        this.onInterdictions(event.row);
        break;
      case 'donations':
        this.onDonations(event.row);
        break;
      case 'eligibility':
        this.onEligibility(event.row);
        break;
      case 'demographics':
        this.onDemographics(event.row);
        break;
    }
  }

  /**
   * Handle row expansion toggle
   * Each row is uniquely identified by a composite key (page + index + data) to support duplicate data
   */
  onRowExpandToggle(row: any): void {
    const expandKey = row._expandKey || `${row.donorId}|${row.comType}|${row.comCode}|${row.insertUser}|${row.insertDate}`;
    if (this.expandedRows.has(expandKey)) {
      this.expandedRows.delete(expandKey);
    } else {
      this.expandedRows.add(expandKey);
    }
  }

  /**
   * Handle expand all toggle
   */
  onExpandAllToggle(shouldExpand: boolean): void {
    if (shouldExpand) {
      // Expand all rows on current page using their composite keys
      this.tableData().forEach((row) => {
        this.expandedRows.add(row._expandKey);
      });
    } else {
      // Collapse all rows
      this.expandedRows.clear();
    }
  }

  /**
   * Open edit dialog for communication record
   */
  onEdit(communication: CommunicationRecord): void {
    const dialogRef = this.dialog.open(EditCommunicationDialog, {
      width: '450px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { top: '64px', right: '0', bottom: '0' },
      data: {
        communication,
        actionCodes: this.actionCodes(),
      },
      panelClass: 'side-panel-dialog',
      disableClose: false,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.handleUpdateCommunication(communication, result);
        }
      });
  }

  /**
   * Handle communication update after dialog closes
   */
  private handleUpdateCommunication(
    communication: CommunicationRecord,
    formValue: any
  ): void {
    this.loading.set(true);

    // CRITICAL: Use GMT date for API URL (composite key matching)
    // Do not use insertDate (local time) - it won't match the database
    const compositeId = {
      donorId: communication.donorId,
      comType: communication.comType,
      comCode: communication.comCode,
      insertUser: communication.insertUser,
      insertDate: communication.insertDateGmt, // Use GMT date for API URL
    };

    const updateRequest = {
      actionCode: formValue.actionCode ? formValue.actionCode.trim() : null,
      targetDate: formValue.targetDate ? this.convertMomentToUTC(formValue.targetDate) : null,
      actionDate: formValue.actionDate ? this.convertMomentToUTC(formValue.actionDate) : null,
      comDesc: formValue.comDesc ? formValue.comDesc.trim() : null,
    };

    this.commService.update(compositeId, updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Donor communication updated successfully');
          this.onSearch(); // Refresh the table
          this.loading.set(false);
        },
        error: (error) => {
          this.showError(this.getErrorMessage(error));
          this.loading.set(false);
        }
      });
  }

  onCommunicationLog(communication: CommunicationRecord): void {
    this.openSidePanel(communication, 'communicationLog');
  }

  private openSidePanel(communication: CommunicationRecord, section: 'communicationLog' | 'interdictions' | 'demographics' | 'attributes'): void {
    this.sidePanelRow.set(communication);
    this.currentSection.set(section);
    this.sidePanelWidth.set('70vw');
    this.sidePanelOpen.set(true);
  }

  onPanelClose(): void {
    this.sidePanelOpen.set(false);
    this.sidePanelWidth.set('70vw');
    this.sidePanelRow.set(null);
    this.currentSection.set(null);
  }

  onPanelWidthChange(width: string): void {
    this.sidePanelWidth.set(width);
  }

  onAttributes(communication: CommunicationRecord): void {
    this.openSidePanel(communication, 'attributes');
  }

  onInterdictions(communication: CommunicationRecord): void {
    this.openSidePanel(communication, 'interdictions');
  }

  /**
   * Open Donations dialog
   */
  onDonations(communication: CommunicationRecord): void {
    this.dialog.open(DonationDetailsDialogComponent, {
      width: '1400px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { donorId: communication.donorId },
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }

  onEligibility(communication: CommunicationRecord): void {
    const donorInput: DonorEligibilityInput = {
      donorId: communication.donorId,
      donorName: communication.name,
      dateOfBirth: communication.dob,
      sex: communication.sex,
      bloodType: communication.abo,
    };
    this.dialog.open(DonorEligibilityPanel, {
      width: '1100px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: donorInput,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  onDemographics(communication: CommunicationRecord): void {
    this.openSidePanel(communication, 'demographics');
  }

  /**
   * Convert Moment object to ISO string for backend
   * Backend expects format: YYYY-MM-DDTHH:mm:ss (without milliseconds and Z)
   */
  private convertMomentToUTC(m: Moment): string {
    // Set to start of day to ensure we have midnight in local timezone
    const startOfDay = m.clone().startOf('day');
    // Format as YYYY-MM-DDTHH:mm:ss without timezone indicator
    return startOfDay.format('YYYY-MM-DDTHH:mm:ss');
  }


  /**
   * Format date for display
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  /**
   * Format sex code to full text
   */
  formatSex(sexCode: string | undefined): string {
    if (!sexCode) return '–';
    const code = sexCode.trim().toUpperCase();
    switch (code) {
      case 'F':
        return 'Female';
      case 'M':
        return 'Male';
      default:
        return sexCode;
    }
  }

  /**
   * Extract error message from error response
   */
  private getErrorMessage(error: any): string {
    // Handle error code 0080
    if (error?.error?.errorResponse?.errorCode === '0080') {
      return 'From Date and To Date are required';
    }

    // Handle error code 7023
    if (error?.error?.errorResponse?.errorCode === '7023') {
      return 'To date cannot be less than from date';
    }

    // Handle error code 18017
    if (error?.error?.errorResponse?.errorCode === '18017') {
      return 'Invalid action code';
    }

    if (error?.error?.errorResponse?.error) {
      return error.error.errorResponse.error;
    }

    if (error?.message) {
      return error.message;
    }

    return 'An error occurred while retrieving communications';
  }

  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Focus the first invalid field for accessibility (WCAG 3.3.1)
   */
  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.searchForm.controls)
      .find(key => this.searchForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  /**
   * Show error message via snackbar
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * Show success message via snackbar
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  /**
   * Show info message via snackbar
   */
  private showInfo(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar'],
    });
  }

  /**
   * Handle from date input for validation
   */
  protected onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('fromDate')
    );
    this.validateDates();
  }

  /**
   * Handle to date input for validation
   */
  protected onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.searchForm.get('toDate')
    );
    this.validateDates();
  }

  /**
   * Handle from date blur event
   */
  protected onFromDateBlur(): void {
    const control = this.searchForm.get('fromDate');
    if (control) {
      control.markAsTouched();
      this.validateDates();
    }
  }

  /**
   * Handle to date blur event
   */
  protected onToDateBlur(): void {
    const control = this.searchForm.get('toDate');
    if (control) {
      control.markAsTouched();
      this.validateDates();
    }
  }

  /**
   * Validate date fields
   */
  private validateDates(): void {
    const fromControl = this.searchForm.get('fromDate');
    const toControl = this.searchForm.get('toDate');

    this.clearCustomDateErrors(fromControl);
    this.clearCustomDateErrors(toControl);

    // If there's a parse error, don't proceed with further validation
    if (fromControl?.hasError('matDatepickerParse') || toControl?.hasError('matDatepickerParse')) {
      return;
    }

    const from = fromControl?.value;
    const to = toControl?.value;

    // Both dates are required
    if (!from || !to) {
      return;
    }

    // Check if toDate is before fromDate
    if (from && to) {
      const fromStr = moment.isMoment(from) ? from.format('YYYY-MM-DD') : moment(from).format('YYYY-MM-DD');
      const toStr = moment.isMoment(to) ? to.format('YYYY-MM-DD') : moment(to).format('YYYY-MM-DD');
      if (toStr < fromStr) {
        this.addDateError(toControl, 'toBeforeFrom');
      }
    }
  }

  /**
   * Clear custom date errors
   */
  private clearCustomDateErrors(control: AbstractControl | null): void {
    if (!control?.errors) return;
    const errors = { ...control.errors };
    delete errors['toBeforeFrom'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  /**
   * Add date error to control
   */
  private addDateError(control: AbstractControl | null, errorKey: string): void {
    if (!control) return;
    control.setErrors({ ...control.errors, [errorKey]: true });
    control.markAsTouched();
  }

  /**
   * Check if user dropdown text is truncated for tooltip
   */
  protected checkUserTruncation(el: HTMLElement): void {
    this.isUserTruncated = el.scrollWidth > el.clientWidth;
  }

  /**
   * Check if communication type dropdown text is truncated for tooltip
   */
  protected checkCommTypeTruncation(el: HTMLElement): void {
    this.isCommTypeTruncated = el.scrollWidth > el.clientWidth;
  }

  /**
   * Check if communication code dropdown text is truncated for tooltip
   */
  protected checkCommCodeTruncation(el: HTMLElement): void {
    this.isCommCodeTruncated = el.scrollWidth > el.clientWidth;
  }

  /**
   * Handle dropdown opened event
   */
  protected onDropdownOpened(opened: boolean): void {
    // Reset truncation flag when dropdown closes
    if (!opened) {
      this.isUserTruncated = false;
      this.isCommTypeTruncated = false;
      this.isCommCodeTruncated = false;
    }
  }
}
