import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ViewChild,
  ElementRef,
  TemplateRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { ReleaseAuditHoldsService } from './services/release-audit-holds.service';
import {
  AuditHoldRecord,
  AuditHoldsParamsDto,
  AuditHoldFilterValue,
  RemoveHoldWithOkRequest,
  RemoveHoldWithNftRequest,
  RemoveHoldRequest,
  GetHoldsRequest,
  DropdownOption
} from './models/release-audit-holds.model';


import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { AuditHoldFilterChipsUtils } from './utils/filter-chips.utils';
import { ReleaseAuditHoldsFilterPanel } from './release-audit-holds-filter-panel/release-audit-holds-filter-panel';
import { RemoveHoldPanel } from './remove-hold-panel/remove-hold-panel';
import { HoldDetailsPanelComponent } from '@shared/components/hold-details-panel/hold-details-panel';
import { ViewCommentsDialog } from './view-comments-dialog/view-comments-dialog';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-release-audit-holds',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatDialogModule,
    MatSidenavModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
    FilterChips,
    RemoveHoldPanel,
    HoldDetailsPanelComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] }
  ],
  templateUrl: './release-audit-holds.html',
  styleUrls: ['./release-audit-holds.scss']
})
export class ReleaseAuditHoldsComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('fromDateInput') fromDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild(DataTable) dataTableComponent!: DataTable<AuditHoldRecord>;
  @ViewChild('removedCellTemplate', { static: true }) removedCellTemplate!: TemplateRef<any>;

  // Error state matchers for date validation
  fromDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.fromDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  toDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      if ((control.touched || control.dirty) && this.searchForm?.hasError('dateRangeInvalid')) return true;
      const inputValue = this.toDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  headerConfig!: PageHeaderConfig;
  tableConfig!: DataTableConfig<AuditHoldRecord>;
  searchForm!: FormGroup;

  // Date validation
  minToDate: Date | null = null;

  // Search
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Donor ID or Name',
    minLength: 2,
    ariaLabel: 'Search by Donor ID or Name',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };
  searchTerm = '';

  appliedFilters: AuditHoldFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: AuditHoldRecord[] = [];
  requestState: AuditHoldsParamsDto = { sort: 'unitId:desc' };

  isLoading = false;
  hasError = false;
  errorMessage = '';
  hasSearched = false;

  isFilterOpen = false;

  // Dropdown options (refreshed with every grid load)
  donationTypeOptions: DropdownOption[] = [];
  donationProcedureOptions: DropdownOption[] = [];
  auditHoldTypeOptions: DropdownOption[] = [];

  // Side panel state
  activeSidePanel: 'remove-ok' | 'remove-nft' | 'hold-details' | null = null;
  selectedRecord: AuditHoldRecord | null = null;
  isSubmittingRemoveHold = false;
  private sidePanelTriggerElement: HTMLElement | null = null;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  constructor(
    private releaseAuditHoldsService: ReleaseAuditHoldsService,
    private overlay: Overlay,
    private pageHeaderService: PageHeaderService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackbarService: SnackbarService,
    private headerService: HeaderService
  ) {
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
  }

  ngOnInit(): void {
    this.initializeSearchForm();
    this.setupDateValidation();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    // Set the template for the removed column after view is initialized
    const removedColumn = this.tableConfig.columns.find(col => col.key === 'removed');
    if (removedColumn && this.removedCellTemplate) {
      removedColumn.cellTemplate = this.removedCellTemplate;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayRef?.dispose();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchTerm = '';
        this.appliedFilters = null;
        this.filterChips = [];
        this.dataSource = [];
        this.requestState = {};
        this.hasSearched = false;
        this.hasError = false;
        this.errorMessage = '';
        this.closeFilterPanel();
        this.closeSidePanel();
        this.searchForm?.reset();
        this.initializeSearchForm();
        this.setupDateValidation();
      });
  }

  /* -------------------------------- CONFIG -------------------------------- */

  private initializeConfigurations(): void {
    this.headerConfig = {
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
      showActionsAsMenu: true,
      sortConfig: {
        column: 'unitId',
        direction: 'D'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No audit holds available to display',
      noDataIcon: 'edit',
      loadingMessage: 'Loading audit holds...',
      showPagination: false
    };
  }

  private initializeSearchForm(): void {
    this.searchForm = this.fb.group({
      fromCollectionDate: [null, [
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]],
      toCollectionDate: [null, [
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator()
      ]],
      unitId: ['']
    });
  }

  private setupDateValidation(): void {
    this.searchForm.get('fromCollectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((fromDate) => {
        this.minToDate = fromDate ? moment(fromDate).toDate() : null;
        this.searchForm.get('toCollectionDate')?.updateValueAndValidity();
      });

    this.searchForm.addValidators(
      DateFieldValidationUtility.fromToDateRangeValidator('fromCollectionDate', 'toCollectionDate')
    );
  }

  private getTableColumns(): TableColumn<AuditHoldRecord>[] {
    return [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        width: '140px'
      },
      {
        key: 'collectionDate',
        header: 'Collection Date',
        width: '140px'
      },
      {
        key: 'name',
        header: 'Name',
        width: '150px'
      },
      {
        key: 'dateOfBirth',
        header: 'Date of Birth',
        width: '130px'
      },
      {
        key: 'sex',
        header: 'Sex',
        width: '80px'
      },
      {
        key: 'donorId',
        header: 'Donor ID',
        width: '130px'
      },
      {
        key: 'donationType',
        header: 'Donation Type',
        width: '130px'
      },
      {
        key: 'donationProcedure',
        header: 'Donation Procedure',
        width: '160px'
      },
      {
        key: 'hold',
        header: 'Hold',
        width: '100px'
      },
      {
        key: 'origin',
        header: 'Origin',
        width: '100px'
      },
      {
        key: 'reason',
        header: 'Reason',
        width: '100px'
      },
      {
        key: 'removed',
        header: 'Removed',
        width: '100px',
        cellClass: 'removed-cell'
      }
    ];
  }

  private getRowActions(): RowAction<AuditHoldRecord>[] {
    return [
      {
        icon: 'check_circle',
        label: 'Remove Hold With OK',
        ariaLabel: 'Remove hold with OK for {{unitId}}',
        color: 'default',
        action: 'remove-ok',
        visible: (row: AuditHoldRecord) => !row.removed
      },
      {
        icon: 'block',
        label: 'Remove Hold With NFT',
        ariaLabel: 'Remove hold with NFT for {{unitId}}',
        color: 'default',
        action: 'remove-nft',
        visible: (row: AuditHoldRecord) => !row.removed
      },
      {
        icon: 'list',
        label: 'Hold Details',
        ariaLabel: 'View hold details for {{unitId}}',
        color: 'default',
        action: 'hold-details'
      },
      {
        icon: 'comment',
        label: 'View Comments',
        ariaLabel: 'View comments for {{unitId}}',
        color: 'default',
        action: 'view-comments'
      }
    ];
  }

  /* -------------------------------- LOAD DATA -------------------------------- */

  onRetrieve(): void {
    if (!this.searchForm.valid) {
      return;
    }

    this.hasSearched = true;
    this.isLoading = true;
    this.hasError = false;

    const formValue = this.searchForm.getRawValue();

    this.requestState = {
      ...this.requestState,
      fromCollectionDate: DateFieldValidationUtility.serializeDateForApi(formValue.fromCollectionDate) || '',
      toCollectionDate: DateFieldValidationUtility.serializeDateForApi(formValue.toCollectionDate) || '',
      unitId: formValue.unitId || undefined
    };

    this.loadData();
  }

  private buildGetHoldsRequest(): GetHoldsRequest {
    return {
      startDate: this.requestState.fromCollectionDate || '',
      endDate: this.requestState.toCollectionDate || '',
      unitId: this.requestState.unitId,
      donationType: this.requestState.donationType,
      procedureCode: this.requestState.donationProcedure,
      auditHoldType: this.requestState.auditHoldType,
      collectionDate: this.requestState.collectionDate,
      searchText: this.requestState.searchKeyword,
      sortDirection: this.requestState.sort?.endsWith(':desc') ? 'DESC' : 'ASC'
    };
  }

  private loadData(): void {
    this.isLoading = true;
    this.hasError = false;

    const holdsRequest = this.buildGetHoldsRequest();

    this.releaseAuditHoldsService
      .getAuditHolds(this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dataSource = res.data;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage =
            err?.error?.message ||
            'Failed to load audit holds data.';
        }
      });

    this.loadDropdownOptions(holdsRequest);
  }

  private loadDropdownOptions(request: GetHoldsRequest): void {
    this.releaseAuditHoldsService
      .getDonationTypes(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => this.donationTypeOptions = options);

    this.releaseAuditHoldsService
      .getDonationProcedures(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => this.donationProcedureOptions = options);

    this.releaseAuditHoldsService
      .getAuditHoldTypes(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => this.auditHoldTypeOptions = options);
  }

  /* -------------------------------- EVENTS -------------------------------- */

  onSearch(searchTerm: string): void {
    const trimmedText = searchTerm?.trim() || '';
    if (!trimmedText) {
      this.onSearchCleared();
      return;
    }
    this.searchTerm = trimmedText;
    this.requestState.searchKeyword = trimmedText;

    if (this.hasSearched) {
      this.loadData();
    }
  }

  onSearchCleared(): void {
    this.searchTerm = '';
    this.requestState.searchKeyword = undefined;

    if (this.hasSearched) {
      this.loadData();
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    if (event.direction === 'A') {
      this.requestState.sort = `${event.column}:asc`;
    } else if (event.direction === 'D') {
      this.requestState.sort = `${event.column}:desc`;
    } else {
      this.requestState.sort = undefined;
    }

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<AuditHoldRecord>): void {
    this.sidePanelTriggerElement = document.activeElement as HTMLElement;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    switch (event.action) {
      case 'remove-ok':
        this.openRemoveHoldWithOkDialog(event.row);
        break;
      case 'remove-nft':
        this.openRemoveHoldWithNftDialog(event.row);
        break;
      case 'hold-details':
        this.openHoldDetailsDialog(event.row);
        break;
      case 'view-comments':
        this.openViewCommentsDialog(event.row);
        break;
    }
  }

  /* -------------------------------- FILTERS -------------------------------- */

  applyFilters(filters: AuditHoldFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = AuditHoldFilterChipsUtils.convertFiltersToChips(filters);

    this.requestState = {
      ...this.requestState,
      donationType: filters.donationType,
      donationProcedure: filters.donationProcedure,
      auditHoldType: filters.auditHoldType,
      collectionDate: filters.collectionDate
    };

    if (this.hasSearched) {
      this.loadData();
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    const { donationType, donationProcedure, auditHoldType, collectionDate, ...rest } =
      this.requestState;

    this.requestState = rest;

    if (this.hasSearched) {
      this.loadData();
    }
  }

  /* -------------------------------- FILTER PANEL -------------------------------- */

  openFilter(): void {
    if (this.isFilterOpen) return;

    if (!this.filterBtn) {
      return;
    }

    const filterBtnElement = this.filterBtn.nativeElement;
    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(filterBtnElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const filterPortal = new ComponentPortal(ReleaseAuditHoldsFilterPanel);
    const filterComponentRef = this.overlayRef.attach(filterPortal);

    filterComponentRef.instance.currentFilters = this.appliedFilters;
    filterComponentRef.instance.requestState = this.buildGetHoldsRequest();
    filterComponentRef.instance.donationTypeOptionsInput = this.donationTypeOptions;
    filterComponentRef.instance.donationProcedureOptionsInput = this.donationProcedureOptions;
    filterComponentRef.instance.auditHoldTypeOptionsInput = this.auditHoldTypeOptions;
    filterComponentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters: AuditHoldFilterValue) => {
      this.applyFilters(filters);
      this.closeFilterPanel();
    });

    filterComponentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    this.overlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    this.isFilterOpen = true;
  }

  private closeFilterPanel(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isFilterOpen = false;
    if (this.filterBtn?.nativeElement) {
      this.filterBtn.nativeElement.focus();
    }
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0;
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters = AuditHoldFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    if (updatedFilters === null) {
      this.clearAllFilters();
    } else {
      this.applyFilters(updatedFilters);
    }
  }

  /* -------------------------------- PANEL/DIALOG ACTIONS -------------------------------- */

  openRemoveHoldWithOkDialog(record: AuditHoldRecord): void {
    this.selectedRecord = record;
    this.activeSidePanel = 'remove-ok';
  }

  openRemoveHoldWithNftDialog(record: AuditHoldRecord): void {
    this.selectedRecord = record;
    this.activeSidePanel = 'remove-nft';
  }

  openHoldDetailsDialog(record: AuditHoldRecord): void {
    this.selectedRecord = record;
    this.activeSidePanel = 'hold-details';
  }

  openViewCommentsDialog(record: AuditHoldRecord): void {
    const dialogRef = this.dialog.open(ViewCommentsDialog, {
      width: '500px',
      data: { record },
      disableClose: true
    });

    // Clear row selection when dialog closes
    dialogRef.afterClosed().subscribe(() => {
      if (this.dataTableComponent) {
        this.dataTableComponent.activeRow = null;
      }
    });
  }

  closeSidePanel(): void {
    this.activeSidePanel = null;
    this.selectedRecord = null;
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = null;
    }
    if (this.sidePanelTriggerElement) {
      this.sidePanelTriggerElement.focus();
      this.sidePanelTriggerElement = null;
    }
  }

  onRemoveHoldSubmit(request: RemoveHoldWithOkRequest | RemoveHoldWithNftRequest): void {
    if (!this.selectedRecord) {
      return;
    }

    this.isSubmittingRemoveHold = true;

    const hasDeferral = request.deferDonor === 'T' || request.deferDonor === 'I';

    const removeRequest: RemoveHoldRequest = {
      interCode: request.code,
      transactionId: this.selectedRecord.transactionId,
      placeNft: this.activeSidePanel === 'remove-nft' ? 'Y' : 'N',
      reasonCode: this.selectedRecord.reason || null,
      termDate: DateFieldValidationUtility.serializeDateForApi(moment(request.terminationDate)) || null,
      deferDonor: request.deferDonor || null,
      effDate: hasDeferral ? DateFieldValidationUtility.serializeDateForApi(moment(request.effectiveDate)) || null : null,
      dateThrough: request.deferDonor === 'T' && request.deferThrough
        ? DateFieldValidationUtility.serializeDateForApi(moment(request.deferThrough)) || null : null,
      comments: hasDeferral ? request.comments || null : null,
      originatedFrom: this.selectedRecord.origin || null,
      groupMode: this.selectedRecord.groupMode || null,
      groupId: this.selectedRecord.groupId || null,
      donorId: this.selectedRecord.donorId || null,
      collDate: DateFieldValidationUtility.serializeDateForApi(moment(request.collectionDate, 'DD-MMM-YYYY')) || null,
      sourceCode: this.selectedRecord.sourceCode || null,
      removeReasonCode : request.reason
    };

    // Call the unified removeHold API method
    this.releaseAuditHoldsService
      .removeHold(request.unitId.trim(), removeRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmittingRemoveHold = false;
          this.snackbarService.showSuccess('Hold removed successfully');
          this.closeSidePanel();
          this.loadData();
        },
        error: (err) => {
          this.isSubmittingRemoveHold = false;

          // Extract error message from different error formats
          const errorMessage =
            err?.error?.message ||
            err?.message ||
            'Failed to remove hold. Please try again.';

          const errorCode = err?.error?.errorCode || '';
          const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
          this.snackbarService.showError(displayMessage);
        }
      });
  }

  /* -------------------------------- DATE INPUT HANDLING -------------------------------- */

  onDateInputBlur(controlName: string): void {
    const control = this.searchForm.get(controlName);
    if (!control) {
      return;
    }

    // If the control has a valid date value, trigger re-formatting
    if (control.value && control.valid) {
      const currentValue = control.value;
      // Force the input to update with formatted value
      control.setValue(currentValue, { emitEvent: false });
      control.updateValueAndValidity();
    }
  }

  /* -------------------------------- DATE ERROR MESSAGES -------------------------------- */

  getFromDateError(): string {
    const control = this.searchForm.get('fromCollectionDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'From Collection Date is invalid';
    }
    if (control.hasError('required')) {
      const inputValue = this.fromDateInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'From Collection Date is invalid';
      }
      return 'From Collection Date is required';
    }
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'From Collection Date is invalid';
    }
    return '';
  }

  getToDateError(): string {
    const control = this.searchForm.get('toCollectionDate');
    if (!control || !(control.touched || control.dirty)) return '';

    if (control.hasError('matDatepickerParse')) {
      return 'To Collection Date is invalid';
    }
    if (control.hasError('required')) {
      const inputValue = this.toDateInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'To Collection Date is invalid';
      }
      return 'To Collection Date is required';
    }
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) {
      return 'To Collection Date is invalid';
    }
    if (this.searchForm.hasError('dateRangeInvalid')) {
      return 'To Collection Date must be on or after From Collection Date';
    }
    return '';
  }

  /* -------------------------------- KEYBOARD SHORTCUTS -------------------------------- */

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+S: Focus search field
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      const searchInput = document.querySelector<HTMLInputElement>('.search-wrapper input');
      searchInput?.focus();
    }

    // Alt+F: Open filter
    if (event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.openFilter();
    }

    // Escape: Close filter panel if open
    if (event.key === 'Escape' && this.overlayRef) {
      event.preventDefault();
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
    }
  }
}
