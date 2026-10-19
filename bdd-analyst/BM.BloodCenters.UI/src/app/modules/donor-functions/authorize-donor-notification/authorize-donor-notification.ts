import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef, ElementRef, NgZone, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';

import { AuthorizeDonorNotificationService } from './services/authorize-donor-notification.service';
import {
  SearchType,
  SearchTypeOption,
  DonorNotificationSearchResult,
  DonorNotificationRowAction,
  AuthorizeDonorDetailsDto,
  LovCodeDto,
  MarkNoLetterRequestDto,
  ApproveNoLetterRequestDto
} from './models/authorize-donor-notification.model';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { NotificationLogDialogComponent } from '@shared/components/notification-log-dialog/notification-log-dialog';
import { AuthorizeNotificationLetterDialog } from '@shared/components/authorize-notification-letter-dialog/authorize-notification-letter-dialog';
import { DonorDemographicsComponent } from '../donor-demographics/donor-demographics';
import { DonorInterdictionsContentComponent } from '../donor-profile/donor-interdictions/donor-interdictions-content.component';
import { DonorAttributesComponent } from '../donor-profile/donor-profile-maintenance/donor-attributes/donor-attributes.component';
import { DonorWithinTestDialogComponent } from '../donor-within-test/donor-within-test-dialog.component';

type CheckSection = 'demographics' | 'interdictions' | 'attributes' | 'test-results';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableRowActionEvent,
  TableSortEvent,
  RowAction
} from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { MarkNoLetterDialog, MarkNoLetterDialogData, MarkNoLetterDialogResult } from '@shared/components/mark-no-letter-dialog/mark-no-letter-dialog';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { UnitIdFieldComponent, UnitValidationResponse, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';

@Component({
  selector: 'app-authorize-donor-notification',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatButtonModule,
    A11yModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule,
    DonorDemographicsComponent,
    DonorInterdictionsContentComponent,
    DonorAttributesComponent,
    DonorWithinTestDialogComponent
  ],
  templateUrl: './authorize-donor-notification.html',
  styleUrls: ['./authorize-donor-notification.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class AuthorizeDonorNotificationComponent implements OnInit, OnDestroy, AfterViewInit {
  private static nextId = 0;
  protected readonly componentId = `authorize-donor-notification-${AuthorizeDonorNotificationComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild('otherInterdictionsTpl', { static: true }) otherInterdictionsTpl!: TemplateRef<any>;
  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  tableConfig: DataTableConfig<DonorNotificationSearchResult> = {
    columns: [],
    rowActions: [],
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No Results to Display',
    noDataIcon: 'search',
    emptySubMessage: 'Please enter search criteria to view results',
    loadingMessage: 'Loading donors...',
    showPagination: true
  };

  searchForm!: FormGroup;
  dataSource: DonorNotificationSearchResult[] = [];
  isLoading = false;
  hasSearched = false;
  private lastChangedDateField: 'start' | 'end' | null = null;

  startDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getStartDateError()
  );
  endDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEndDateError()
  );

  today: moment.Moment = DateFieldValidationUtility.getMinDate('');

  searchTypeOptions: SearchTypeOption[] = [
    { value: 'Pending', label: 'All Pending Donors', requiresCode: false },
    { value: 'InterCD', label: 'By Interdiction Code', requiresCode: true, codePlaceholder: 'Interdiction Code', codeDescriptionLabel: 'Description' },
    { value: 'LetterID', label: 'By Letter ID', requiresCode: true, codePlaceholder: 'Letter ID', codeDescriptionLabel: 'Description' },
    { value: 'DonorID', label: 'By Donor ID', requiresCode: true, codePlaceholder: 'Donor ID', codeDescriptionLabel: 'Donor Name' },
    { value: 'UnitID', label: 'By Donation/Unit ID', requiresCode: true, codePlaceholder: 'Unit ID', codeDescriptionLabel: '' },
    { value: 'Reinst', label: 'Donor Reinstatement', requiresCode: true, codePlaceholder: 'Interdiction Code', codeDescriptionLabel: 'Description' },
    { value: 'Auth', label: 'Letters for Authorization', requiresCode: false },
    { value: 'All', label: 'All Donors', requiresCode: false }
  ];

  codeDescription = '';
  codeValidated = false;
  codeValidating = false;
  lastValidatedCode = '';

  searchTypeSearchControl = new FormControl('');
  searchTypeSearch = signal('');
  readonly filteredSearchTypeOptions = computed(() => {
    const search = this.searchTypeSearch().toLowerCase();
    if (!search) return this.searchTypeOptions;
    return this.searchTypeOptions.filter(opt =>
      opt.label.toLowerCase().includes(search) ||
      opt.value.toLowerCase().includes(search)
    );
  });

  lovCodes = signal<LovCodeDto[]>([]);
  lovSearch = signal('');
  lovSearchControl = new FormControl('');
  isLoadingLov = false;
  readonly filteredLovCodes = computed(() => {
    const search = this.lovSearch().toLowerCase();
    const codes = this.lovCodes();
    if (!search) return codes;
    return codes.filter(c =>
      c.code.toLowerCase().includes(search) ||
      c.description.toLowerCase().includes(search)
    );
  });

  get hasLov(): boolean {
    const searchType = this.searchForm?.get('searchType')?.value;
    return ['InterCD', 'LetterID', 'Reinst'].includes(searchType);
  }

  expandedRows = new Set<string>();
  selectedDonor: DonorNotificationSearchResult | null = null;
  currentSortColumn: string | null = 'DonorName';
  currentSortOrder: string | null = 'ASC';
  donorDetailsCache = new Map<string, AuthorizeDonorDetailsDto>();
  donorDetailsLoading = new Set<string>();
  private lovLimit = 15;

  sidePanelOpen = signal(false);
  sidePanelWidth = signal('70vw');
  currentCheckDonorId = signal('');
  currentCheckDonorName = signal('');
  currentSection = signal<CheckSection | null>(null);

  hasHorizontalOverflow = false;
  private resizeObserver?: ResizeObserver;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private ngZone: NgZone,
    private authorizeDonorNotificationService: AuthorizeDonorNotificationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.initializeForm();
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });

    effect(() => {
      this.today = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    });
  }

  ngOnInit(): void {
    this.subscribeToSearchTypeChanges();
    this.subscribeToChapterChanges();
    this.setupDateValidationListeners();
    this.searchTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.searchTypeSearch.set(value || ''));
    this.lovSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.lovSearch.set(value || ''));
    this.authorizeDonorNotificationService.getLovLimit()
      .pipe(takeUntil(this.destroy$))
      .subscribe(limit => this.lovLimit = limit);

    const otherInterCol = this.tableConfig.columns.find(c => c.key === 'otherInterdictionCount');
    if (otherInterCol) {
      otherInterCol.cellTemplate = this.otherInterdictionsTpl;
      this.tableConfig = { ...this.tableConfig };
    }
  }

  ngAfterViewInit(): void {
    this.setupOverflowDetection();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupOverflowDetection(): void {
    const wrapper = this.el.nativeElement.querySelector('.data-table-scroll-wrapper');
    if (!wrapper) return;

    this.resizeObserver = new ResizeObserver(() => {
      const overflowing = wrapper.scrollWidth > wrapper.clientWidth;
      if (overflowing !== this.hasHorizontalOverflow) {
        this.ngZone.run(() => this.hasHorizontalOverflow = overflowing);
      }
    });
    this.resizeObserver.observe(wrapper);
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      searchType: ['Auth', Validators.required],
      code: [''],
      startDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator(), this.noFutureDateValidator()]],
      endDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator(), this.noFutureDateValidator()]],
      includeNotified: [{ value: false, disabled: true }],
      exclusive: [{ value: false, disabled: true }]
    }, {
      validators: [DateFieldValidationUtility.fromToDateRangeValidator('startDate', 'endDate')]
    });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: '',
      actions: []
    };

    this.tableConfig = {
      columns: this.getTableColumns(),
      rowActions: this.getRowActions(),
      showActionsAsMenu: true,
      sortConfig: {
        column: 'donorName',
        direction: 'A'
      },
      pagination: {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
        showFirstLastButtons: true
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No Results to Display',
      noDataIcon: 'search',
      emptySubMessage: 'Please enter search criteria to view results',
      loadingMessage: 'Loading donors...',
      showPagination: true,
      enableRowHighlight: false
    };
  }

  private getTableColumns(): TableColumn<DonorNotificationSearchResult>[] {
    return [
      {
        key: 'donorName',
        header: 'Name',
        sortable: true,
        width: '200px',
        minWidth: '200px'
      },
      {
        key: 'lastDonationType',
        header: 'Donation Type',
        sortable: false,
        width: '120px'
      },
      {
        key: 'lastProcCode',
        header: 'Procedure Code',
        sortable: false,
        width: '130px'
      },
      {
        key: 'lastUnitId',
        header: 'Unit ID',
        sortable: false,
        width: '150px'
      },
      {
        key: 'lastDonationDate',
        header: 'Collection Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string | number | boolean | null | undefined) => this.formatDate(value as string)
      },
      {
        key: 'interCode',
        header: 'Interdiction Code',
        sortable: false,
        width: '150px'
      },
      {
        key: 'interEffDate',
        header: 'Effective Date',
        sortable: false,
        width: '150px',
        valueFormatter: (value: string | number | boolean | null | undefined) => this.formatDate(value as string)
      },
      {
        key: 'otherInterdictionCount',
        header: 'Other Interdictions',
        sortable: false,
        width: '150px',
        cellClass: 'text-center'
      },
      {
        key: 'letterId',
        header: 'Letter ID',
        sortable: false,
        width: '120px',
        valueFormatter: (value: string | number | boolean | null | undefined) => (value != null ? String(value) : '-'),
        headerClass: 'letter-id-separator',
        cellClass: 'letter-id-separator'
      }
    ];
  }

  private getRowActions(): RowAction<DonorNotificationSearchResult>[] {
    return [
      {
        label: 'Auth Letter',
        icon: 'check_circle',
        action: 'authorize-letter',
        disabled: (row: DonorNotificationSearchResult) =>
          row.notificationStatus !== 'AUTHZ' && row.notificationStatus !== 'AUTCM'
      },
      {
        label: 'Mark No Letter',
        icon: 'cancel',
        action: 'mark-no-letter',
        disabled: (row: DonorNotificationSearchResult) =>
          row.notificationStatus !== 'AUTNO'
      },
      {
        label: 'Communication Log',
        icon: 'message',
        action: 'communication-log'
      },
      {
        label: 'Interdictions',
        icon: 'block',
        action: 'interdictions'
      },
      {
        label: 'Test Results',
        icon: 'science',
        action: 'test-results'
      },
      {
        label: 'Attributes',
        icon: 'category',
        action: 'attributes'
      },
      {
        label: 'Demographics',
        icon: 'person',
        action: 'demographics'
      }
    ];
  }

  private subscribeToSearchTypeChanges(): void {
    this.searchForm.get('searchType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchType: SearchType) => {
        const selectedOption = this.searchTypeOptions.find(opt => opt.value === searchType);
        const codeControl = this.searchForm.get('code');

        this.codeDescription = '';
        this.codeValidated = false;
        this.lastValidatedCode = '';
        this.lovCodes.set([]);
        this.lovSearch.set('');
        this.lovSearchControl.setValue('');
        this.unitIdField?.clear();

        if (['InterCD', 'LetterID', 'Reinst'].includes(searchType)) {
          this.loadLovCodes(searchType);
        }

        if (searchType === 'UnitID') {
          codeControl?.clearValidators();
          codeControl?.setValue(null);
          codeControl?.disable();
        } else if (selectedOption?.requiresCode) {
          const validators = [Validators.required];
          if (searchType === 'DonorID') {
            validators.push(Validators.maxLength(10));
          }
          codeControl?.setValidators(validators);
          codeControl?.setValue(null);
          codeControl?.enable();
          codeControl?.markAsUntouched();
        } else {
          codeControl?.clearValidators();
          codeControl?.setValue(null);
          codeControl?.disable();
        }
        codeControl?.updateValueAndValidity();

        const startDateControl = this.searchForm.get('startDate');
        const endDateControl = this.searchForm.get('endDate');
        if (searchType === 'DonorID' || searchType === 'UnitID') {
          startDateControl?.setValue(null);
          endDateControl?.setValue(null);
          startDateControl?.disable();
          endDateControl?.disable();
        } else {
          startDateControl?.enable();
          endDateControl?.enable();
        }

        const includeNotifiedControl = this.searchForm.get('includeNotified');
        if (['InterCD', 'LetterID', 'DonorID'].includes(searchType)) {
          includeNotifiedControl?.enable();
        } else {
          includeNotifiedControl?.setValue(false);
          includeNotifiedControl?.disable();
        }

        const exclusiveControl = this.searchForm.get('exclusive');
        if (searchType === 'Reinst') {
          exclusiveControl?.enable();
        } else {
          exclusiveControl?.setValue(false);
          exclusiveControl?.disable();
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearResults();
        this.searchForm.reset({
          searchType: 'Pending',
          code: '',
          startDate: null,
          endDate: null,
          includeNotified: false,
          exclusive: false
        });
      });
  }

  get selectedSearchOption(): SearchTypeOption | undefined {
    const searchType = this.searchForm.get('searchType')?.value;
    return this.searchTypeOptions.find(opt => opt.value === searchType);
  }

  get f() {
    return this.searchForm.controls;
  }

  get isRetrieveDisabled(): boolean {
    if (this.isLoading || this.codeValidating) return true;
    if (this.searchForm.invalid) return true;
    if (this.hasDateErrors('startDate') || this.hasDateErrors('endDate')) return true;
    const searchType = this.searchForm.get('searchType')?.value;
    if (searchType === 'UnitID') {
      return !this.unitIdField?.isValid;
    }
    if (this.selectedSearchOption?.requiresCode) {
      return !this.codeValidated;
    }
    return false;
  }

  private hasDateErrors(controlName: string): boolean {
    const ctrl = this.searchForm.get(controlName);
    if (!ctrl) return false;
    return ctrl.hasError('matDatepickerParse') || ctrl.hasError('invalidDateFormat')
      || ctrl.hasError('invalidDate') || ctrl.hasError('matDatepickerMax')
      || ctrl.hasError('matDatepickerMin');
  }

  private setupDateValidationListeners(): void {
    const startDateCtrl = this.searchForm.get('startDate');
    const endDateCtrl = this.searchForm.get('endDate');

    startDateCtrl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'start';
        this.updateDateRequiredValidators();
        this.searchForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    endDateCtrl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'end';
        this.updateDateRequiredValidators();
        this.searchForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
  }

  private updateDateRequiredValidators(): void {
    const startDateCtrl = this.searchForm.get('startDate');
    const endDateCtrl = this.searchForm.get('endDate');
    const baseValidators = [dateFormatValidator(), DateFieldValidationUtility.validDateValidator(), this.noFutureDateValidator()];

    if (endDateCtrl?.value) {
      startDateCtrl?.setValidators([Validators.required, ...baseValidators]);
    } else {
      startDateCtrl?.setValidators(baseValidators);
    }

    if (startDateCtrl?.value) {
      endDateCtrl?.setValidators([Validators.required, ...baseValidators]);
    } else {
      endDateCtrl?.setValidators(baseValidators);
    }

    const otherCtrl = this.lastChangedDateField === 'start' ? endDateCtrl : startDateCtrl;
    const changedCtrl = this.lastChangedDateField === 'start' ? startDateCtrl : endDateCtrl;

    changedCtrl?.updateValueAndValidity({ onlySelf: true, emitEvent: false });

    const hadInvalidDate = otherCtrl?.hasError('invalidDate') || otherCtrl?.hasError('matDatepickerParse');
    const prevErrors = otherCtrl?.errors ? { ...otherCtrl.errors } : null;
    otherCtrl?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    if (hadInvalidDate && prevErrors) {
      otherCtrl?.setErrors({ ...otherCtrl.errors, ...prevErrors });
    }
  }

  onStartDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.searchForm.get('startDate')
    );
  }

  onEndDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.searchForm.get('endDate')
    );
  }

  private noFutureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selectedDate = moment.isMoment(control.value) ? control.value : moment(control.value);
      if (!selectedDate.isValid()) return null;
      if (selectedDate.format('YYYY-MM-DD') > this.today.format('YYYY-MM-DD')) {
        return { matDatepickerMax: { max: this.today, actual: selectedDate } };
      }
      return null;
    };
  }

  getStartDateError(): string {
    const ctrl = this.searchForm.get('startDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('required')) return 'Effective Date From is required';
    if (ctrl.hasError('matDatepickerParse')) return 'Effective Date From is invalid';
    if (ctrl.hasError('invalidDateFormat') || ctrl.hasError('invalidDate')) return 'Effective Date From is invalid';
    if (ctrl.hasError('matDatepickerMax')) return 'Effective Date From cannot be a future date';
    if (this.lastChangedDateField === 'start' && this.searchForm.errors?.['dateRangeInvalid']) {
      return 'Effective Date From must be less than or equal to Effective Date To';
    }
    return '';
  }

  getEndDateError(): string {
    const ctrl = this.searchForm.get('endDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('required')) return 'Effective Date To is required';
    if (ctrl.hasError('matDatepickerParse')) return 'Effective Date To is invalid';
    if (ctrl.hasError('invalidDateFormat') || ctrl.hasError('invalidDate')) return 'Effective Date To is invalid';
    if (ctrl.hasError('matDatepickerMax')) return 'Effective Date To cannot be a future date';
    if (ctrl.hasError('matDatepickerMin')) return 'Effective Date To must be greater than or equal to Effective Date From';
    if (this.lastChangedDateField === 'end' && this.searchForm.errors?.['dateRangeInvalid']) {
      return 'Effective Date To must be greater than or equal to Effective Date From';
    }
    return '';
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    this.authorizeDonorNotificationService.checkUnitExists(event.data.parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          if (exists) {
            event.confirm();
          } else {
            event.reject('Unit ID not found in donations');
          }
        },
        error: () => event.reject('Failed to verify unit')
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.codeValidated = true;
    this.lastValidatedCode = data.parsedUnitId;
  }

  onUnitCleared(): void {
    this.codeValidated = false;
    this.lastValidatedCode = '';
  }

  onCodeBlur(): void {
    const rawCode = this.searchForm.get('code')?.value?.trim();
    const searchType = this.searchForm.get('searchType')?.value;

    if (!rawCode || !searchType) {
      this.codeDescription = '';
      this.codeValidated = false;
      return;
    }

    if (rawCode === this.lastValidatedCode) return;

    if (searchType === 'UnitID') {
      this.codeValidated = true;
      this.lastValidatedCode = rawCode;
      return;
    }

    let code = rawCode;
    if (searchType === 'DonorID') {
      code = 'DN' + rawCode.replace(/\D/g, '').padStart(8, '0');
    }

    this.codeValidating = true;
    this.codeDescription = '';
    this.codeValidated = false;

    this.authorizeDonorNotificationService.getCodeDescription(searchType, code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (description) => {
          this.codeValidating = false;
          this.codeDescription = description;
          this.codeValidated = true;
          this.lastValidatedCode = rawCode;
        },
        error: (err) => {
          this.codeValidating = false;
          this.codeDescription = '';
          this.codeValidated = false;
          const msg = err?.error?.message || err?.error?.errorResponse?.error || 'Invalid code. No matching record found.';
          this.showError(msg);
        }
      });
  }

  private loadLovCodes(searchType: string): void {
    this.isLoadingLov = true;
    this.authorizeDonorNotificationService.getLovCodes(searchType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.lovCodes.set(codes);
          this.isLoadingLov = false;
        },
        error: () => {
          this.lovCodes.set([]);
          this.isLoadingLov = false;
        }
      });
  }

  onLovCodeSelected(code: string): void {
    const selected = this.lovCodes().find(c => c.code === code);
    if (selected) {
      this.codeDescription = selected.description;
      this.codeValidated = true;
      this.lastValidatedCode = code;
    }
  }

  onRetrieve(): void {
    if (this.searchForm.invalid) {
      this.markFormGroupTouched(this.searchForm);
      this.showError('Please fill in all required fields');
      return;
    }

    if (this.hasDateErrors('startDate') || this.hasDateErrors('endDate')) {
      this.markFormGroupTouched(this.searchForm);
      return;
    }

    const searchType = this.searchForm.get('searchType')?.value;
    const startDateCtrl = this.searchForm.get('startDate');
    const endDateCtrl = this.searchForm.get('endDate');

    if (searchType !== 'DonorID' && searchType !== 'UnitID'
        && !startDateCtrl?.value && !endDateCtrl?.value) {
      const end = this.today.clone();
      const start = this.today.clone().subtract(this.lovLimit, 'days');
      startDateCtrl?.setValue(start);
      endDateCtrl?.setValue(end);
    }

    if (this.searchForm.errors?.['dateRangeInvalid']) {
      this.markFormGroupTouched(this.searchForm);
      return;
    }

    this.loadData(0, this.tableConfig.pagination!.pageSize);
  }

  private loadData(skip: number, take: number): void {
    const formValue = this.searchForm.getRawValue();

    let code = formValue.searchType === 'UnitID'
      ? (this.unitIdField?.parsedUnitId || null)
      : (formValue.code || null);

    if (formValue.searchType === 'DonorID' && code) {
      code = 'DN' + code.replace(/\D/g, '').padStart(8, '0');
    }

    const searchRequest = {
      searchType: formValue.searchType,
      code: code,
      startDate: formValue.startDate ? moment(formValue.startDate).format('YYYY-MM-DD') : null,
      endDate: formValue.endDate ? moment(formValue.endDate).format('YYYY-MM-DD') : null,
      includeNotified: (formValue.includeNotified ? 'Y' : 'N') as 'Y' | 'N',
      exclusive: (formValue.exclusive ? 'Y' : 'N') as 'Y' | 'N',
      notificationStatus: null,
      sortColumn: this.currentSortColumn,
      sortOrder: this.currentSortOrder
    };

    this.isLoading = true;
    this.donorDetailsCache.clear();
    this.expandedRows = new Set();
    this.selectedDonor = null;

    this.authorizeDonorNotificationService.searchDonors(take, skip, searchRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data.map((row, i) => ({
            ...row,
            _rowKey: `${row.donorId}_${row.interCode}_${row.unitId || ''}_${i}`
          }));
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalRecords: response.total
            }
          };
          this.hasSearched = true;
          this.isLoading = false;
        },
        error: (error) => {
          this.showError(error.error?.errorResponse?.error || 'Failed to load donor notifications');
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: TablePageEvent): void {
    const skip = event.pageIndex * event.pageSize;
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize
      }
    };
    this.loadData(skip, event.pageSize);
  }

  onSortChange(event: TableSortEvent): void {
    const sortColumnMap: Record<string, string> = {
      donorName: 'DonorName',
      interCode: 'InterCode',
      interEffDate: 'InterEffDate'
    };
    this.currentSortColumn = event.direction === 'default' ? null : (sortColumnMap[event.column] || null);
    this.currentSortOrder = event.direction === 'A' ? 'ASC' : event.direction === 'D' ? 'DESC' : null;
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    this.loadData(0, this.tableConfig.pagination!.pageSize);
  }

  onRowAction(event: TableRowActionEvent<DonorNotificationSearchResult>): void {
    const action = event.action as DonorNotificationRowAction;
    const donor = event.row;

    switch (action) {
      case 'authorize-letter':
        this.authorizeLetter(donor);
        break;
      case 'mark-no-letter':
        this.markNoLetter(donor);
        break;
      case 'communication-log':
        this.viewCommunicationLog(donor);
        break;
      case 'interdictions':
        this.viewInterdictions(donor);
        break;
      case 'test-results':
        this.viewTestResults(donor);
        break;
      case 'attributes':
        this.viewAttributes(donor);
        break;
      case 'demographics':
        this.viewDemographics(donor);
        break;
    }
  }

  onRowClick(_row: DonorNotificationSearchResult): void {
  }

  onRowExpandToggle(row: DonorNotificationSearchResult): void {
    const key = (row as any)._rowKey;
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
      if (!this.donorDetailsCache.has(row.donorId) && !this.donorDetailsLoading.has(row.donorId)) {
        this.loadDonorDetails(row.donorId);
      }
    }
    this.expandedRows = new Set(this.expandedRows);
  }

  onExpandAllToggle(expand: boolean): void {
    if (expand) {
      const newExpanded = new Set<string>();
      for (const row of this.dataSource) {
        const key = (row as any)._rowKey;
        newExpanded.add(key);
        if (!this.donorDetailsCache.has(row.donorId) && !this.donorDetailsLoading.has(row.donorId)) {
          this.loadDonorDetails(row.donorId);
        }
      }
      this.expandedRows = newExpanded;
    } else {
      this.expandedRows = new Set();
    }
  }

  private loadDonorDetails(donorId: string): void {
    this.donorDetailsLoading.add(donorId);
    this.authorizeDonorNotificationService.getDonorDetails(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.donorDetailsCache.set(donorId, details);
          this.donorDetailsLoading.delete(donorId);
        },
        error: () => {
          this.donorDetailsLoading.delete(donorId);
        }
      });
  }

  getDonorDetails(donorId: string): AuthorizeDonorDetailsDto | undefined {
    return this.donorDetailsCache.get(donorId);
  }

  isDonorDetailsLoading(donorId: string): boolean {
    return this.donorDetailsLoading.has(donorId);
  }

  private authorizeLetter(donor: DonorNotificationSearchResult): void {
    const dialogRef = this.dialog.open(AuthorizeNotificationLetterDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'authorize-notification-letter-panel',
      data: {
        donorId: donor.donorId,
        letterSeqNo: donor.letterSeqNo,
        donationType: donor.lastDonationType,
        procedureCode: donor.lastProcCode,
        interCode: donor.interCode,
        unitId: donor.unitId,
        lastDonationDate: donor.lastDonationDate,
        mode: 'SUPER' as const
      },
      disableClose: true,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshCurrentPage());
  }

  private markNoLetter(donor: DonorNotificationSearchResult): void {
    const mode = donor.notificationStatus === 'AUTNO' ? 'SUPER' : 'USER';

    if (mode === 'SUPER') {
      this.authorizeDonorNotificationService.getDonorCommunications(donor.donorId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (comms) => {
            const noLetterComm = comms.find(c => c.comCode === 'NOLET');
            const existingComment = noLetterComm?.comDesc
              ? noLetterComm.comDesc.substring(0, Math.min(noLetterComm.comDesc.indexOf('*'), 120)).trimEnd()
              : '';
            this.openMarkNoLetterDialog(donor, mode, existingComment);
          },
          error: () => this.openMarkNoLetterDialog(donor, mode, '')
        });
    } else {
      this.openMarkNoLetterDialog(donor, mode);
    }
  }

  private openMarkNoLetterDialog(donor: DonorNotificationSearchResult, mode: 'USER' | 'SUPER', existingUserComment?: string): void {
    const dialogData: MarkNoLetterDialogData = {
      donor: {
        donorId: donor.donorId,
        donorName: donor.donorName,
        interCode: donor.interCode ?? undefined,
        unitId: donor.unitId ?? undefined
      },
      mode: mode,
      existingUserComment: existingUserComment
    };

    const dialogRef = this.dialog.open(MarkNoLetterDialog, {
      width: '600px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: MarkNoLetterDialogResult) => {
        if (result?.action === 'save') {
          this.proceedWithSave(donor, result, mode);
        } else if (result?.action === 'reject') {
          this.handleMarkNoLetterReject(donor);
        }
      });
  }

  private proceedWithSave(donor: DonorNotificationSearchResult, result: MarkNoLetterDialogResult, mode: 'USER' | 'SUPER'): void {
    if (donor.unitId && donor.otherInterdictionCount > 0) {
      const confirmRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '450px',
        data: {
          title: 'Multiple Interdictions Alert',
          message: 'Multiple interdictions exist for this donation. Do you want to continue?',
          confirmText: 'Yes',
          cancelText: 'No'
        } as ConfirmActionDialogData
      });
      confirmRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((confirmed) => {
          if (confirmed) {
            this.executeSave(donor, result, mode);
          }
        });
    } else {
      this.executeSave(donor, result, mode);
    }
  }

  private executeSave(donor: DonorNotificationSearchResult, result: MarkNoLetterDialogResult, mode: 'USER' | 'SUPER'): void {
    if (mode === 'SUPER') {
      this.handleApproveNoLetter(donor, result);
    } else {
      this.handleMarkNoLetterSave(donor, result);
    }
  }

  private handleMarkNoLetterSave(donor: DonorNotificationSearchResult, result: MarkNoLetterDialogResult): void {
    const payload: MarkNoLetterRequestDto = {
      donorId: donor.donorId,
      interCode: donor.interCode ?? '',
      unitId: donor.unitId || null,
      userComment: result.userComment || '',
      mode: 'USER' as const
    };

    this.authorizeDonorNotificationService.markNoLetter(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || 'Marked for no letter successfully. Awaiting supervisor approval.');
          this.refreshCurrentPage();
        },
        error: (error) => {
          this.showError(error.error?.errorResponse?.error || 'Failed to mark no letter');
        }
      });
  }

  private handleApproveNoLetter(donor: DonorNotificationSearchResult, result: MarkNoLetterDialogResult): void {
    const payload: ApproveNoLetterRequestDto = {
      donorId: donor.donorId,
      interCode: donor.interCode ?? '',
      unitId: donor.unitId || null,
      supervisorComment: result.supervisorComment || ''
    };

    this.authorizeDonorNotificationService.approveNoLetter(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || 'No letter approved by supervisor.');
          this.refreshCurrentPage();
        },
        error: (error) => {
          this.showError(error.error?.errorResponse?.error || 'Failed to approve no letter');
        }
      });
  }

  private handleMarkNoLetterReject(donor: DonorNotificationSearchResult): void {
    this.authorizeDonorNotificationService.rejectNoLetter(donor.donorId, donor.interCode ?? '', donor.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || 'No-letter status rejected. Record returned to pending.');
          this.refreshCurrentPage();
        },
        error: (error) => {
          this.showError(error.error?.errorResponse?.error || 'Failed to reject no letter');
        }
      });
  }

  private viewCommunicationLog(donor: DonorNotificationSearchResult): void {
    this.dialog.open(NotificationLogDialogComponent, {
      width: '960px',
      height: 'calc(100vh - 64px)',
      maxWidth: '960px',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'notification-log-dialog-panel',
      data: { donorId: donor.donorId },
      autoFocus: false,
      disableClose: true,
    });
  }

  private viewInterdictions(donor: DonorNotificationSearchResult): void {
    this.openSidePanel(donor, 'interdictions');
  }

  private viewTestResults(donor: DonorNotificationSearchResult): void {
    this.openSidePanel(donor, 'test-results');
  }

  private viewAttributes(donor: DonorNotificationSearchResult): void {
    this.openSidePanel(donor, 'attributes');
  }

  private viewDemographics(donor: DonorNotificationSearchResult): void {
    this.openSidePanel(donor, 'demographics');
  }

  private openSidePanel(donor: DonorNotificationSearchResult, section: CheckSection): void {
    this.currentCheckDonorId.set(donor.donorId);
    this.currentCheckDonorName.set(donor.donorName);
    this.currentSection.set(section);
    this.sidePanelOpen.set(true);
  }

  onPanelClose(): void {
    this.sidePanelOpen.set(false);
    this.sidePanelWidth.set('70vw');
    this.currentCheckDonorId.set('');
    this.currentCheckDonorName.set('');
    this.currentSection.set(null);
  }

  onPanelWidthChange(width: string): void {
    this.sidePanelWidth.set(width);
  }

  private refreshCurrentPage(): void {
    const pageIndex = this.tableConfig.pagination!.pageIndex;
    const pageSize = this.tableConfig.pagination!.pageSize;
    const skip = pageIndex * pageSize;
    this.loadData(skip, pageSize);
  }

  onClearAll(): void {
    this.searchForm.reset({
      searchType: 'Auth',
      code: '',
      startDate: null,
      endDate: null,
      includeNotified: false,
      exclusive: false
    });
    this.codeDescription = '';
    this.codeValidated = false;
    this.lastValidatedCode = '';
    this.unitIdField?.clear();
    this.clearResults();
  }

  private clearResults(): void {
    this.dataSource = [];
    this.tableConfig = {
      ...this.tableConfig,
      pagination: {
        ...this.tableConfig.pagination!,
        totalRecords: 0,
        pageIndex: 0
      }
    };
    this.hasSearched = false;
    this.selectedDonor = null;
    this.donorDetailsCache.clear();
    this.expandedRows = new Set();
  }

  formatDate(value: string): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }
}
