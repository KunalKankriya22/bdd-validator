import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { DrivesService } from './services/drives.service';
import {
  DrivesModel,
  DrivesParamsDto,
  DrivesFilterValue,
  ChapterLookup
} from './models/drives.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  RowAction,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DrivesFilterChipsUtils } from './utils/filter-chips.utils';
import { DrivesFilterPanel } from './drives-filter-panel/drives-filter-panel';
import { AddEditDriveRecord } from './add-edit-drive-record/add-edit-drive-record';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { formatTableDate } from '@shared/utils/date-format.util';

/**
 * Custom MatPaginatorIntl to change "Items per page" to "Rows per page"
 */
export function getDrivesPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-drives',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    AddEditDriveRecord,
    SearchBar,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MatPaginatorIntl, useFactory: getDrivesPaginatorIntl }
  ],
  templateUrl: './drives.html',
  styleUrls: ['./drives.scss']
})
export class DrivesComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild('fromDateInput') fromDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild(DataTable) dataTableComponent!: DataTable<DrivesModel>;

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
      const inputValue = this.toDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    actions: []
    // Do NOT set subtitle here - let it be undefined so page-header component uses the service
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Type, Drive, Site ID, or Description',
    minLength: 2,
    ariaLabel: 'Search drives by Type, Drive, Site ID, or Description',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  searchForm: FormGroup;

  tableConfig: DataTableConfig<DrivesModel> = {
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
      column: 'type',
      direction: 'default'
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: '',
    loadingMessage: '',
    showPagination: true
  };

  appliedFilters: DrivesFilterValue | null = null;
  filterChips: FilterChip[] = [];

  dataSource: DrivesModel[] = [];
  originalDataSource: DrivesModel[] = []; // Stores unfiltered data from Retrieve for type dropdown
  requestState: DrivesParamsDto = {};
  shouldStoreOriginalData = false; // Flag to store data on next loadData call (from Retrieve)

  isLoading = false;
  hasError = false;
  errorMessage = '';
  hasSearched = false;
  isRetrieveDisabled = true;

  chapterOptions: ChapterLookup[] = [];
  selectedChapter: ChapterLookup | null = null;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: DrivesModel | null = null;

  // Filter Panel State
  isFilterOpen = false;

  // Date validation
  minToDate: Date | null = null;
  private lastChangedDateField: 'fromDate' | 'toDate' | null = null;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;

  chapterSearchControl = new FormControl('');
  filteredChapterOptions: ChapterLookup[] = [];

  constructor(
    private drivesService: DrivesService,
    private router: Router,
    private overlay: Overlay,
    private fb: FormBuilder,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.searchForm = this.fb.group({
      chapterId: ['', [Validators.required]],
      fromDate: [null, [Validators.required]],
      toDate: [null, [Validators.required]]
    });

    this.initializeConfigurations();
    this.setupDateValidation();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title
          // Do NOT set subtitle - let page-header component fetch it from the service
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadChapterOptions();
    this.setupRetrieveButtonState();
    this.setupChapterSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private setupDateValidation(): void {
    const fromDateControl = this.searchForm.get('fromDate');
    const toDateControl = this.searchForm.get('toDate');

    // Add validator to fromDate that checks if it's after toDate
    fromDateControl?.addValidators((control) => {
      const fromDate = control.value;
      const toDate = toDateControl?.value;

      if (!fromDate || !toDate) return null;

      const fromMoment = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const toMoment = moment.isMoment(toDate) ? toDate : moment(toDate);

      const fromDay = fromMoment.clone().startOf('day');
      const toDay = toMoment.clone().startOf('day');

      if (fromDay.isAfter(toDay)) {
        return { dateAfter: true };
      }

      return null;
    });

    // Add validator to toDate that checks if it's before fromDate
    toDateControl?.addValidators((control) => {
      const fromDate = fromDateControl?.value;
      const toDate = control.value;

      if (!fromDate || !toDate) return null;

      const fromMoment = moment.isMoment(fromDate) ? fromDate : moment(fromDate);
      const toMoment = moment.isMoment(toDate) ? toDate : moment(toDate);

      const fromDay = fromMoment.clone().startOf('day');
      const toDay = toMoment.clone().startOf('day');

      if (toDay.isBefore(fromDay)) {
        return { dateBefore: true };
      }

      return null;
    });

    // Watch fromDate changes
    fromDateControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((fromDate) => {
        // Update minimum date for toDate picker
        if (fromDate) {
          this.minToDate = fromDate instanceof Date ? fromDate : (fromDate.toDate ? fromDate.toDate() : new Date(fromDate));
        } else {
          this.minToDate = null;
        }

        // Revalidate toDate
        toDateControl?.updateValueAndValidity({ emitEvent: false });

        // Track which field was last changed (deferred to avoid ExpressionChangedAfterItHasBeenCheckedError)
        setTimeout(() => {
          this.lastChangedDateField = 'fromDate';
        }, 0);
      });

    // Watch toDate changes
    toDateControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Revalidate fromDate
        fromDateControl?.updateValueAndValidity({ emitEvent: false });

        // Track which field was last changed (deferred to avoid ExpressionChangedAfterItHasBeenCheckedError)
        setTimeout(() => {
          this.lastChangedDateField = 'toDate';
        }, 0);
      });
  }

  private setupRetrieveButtonState(): void {
    // Watch form value changes to enable/disable retrieve button
    this.searchForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((formValue) => {
        // Enable button if at least one field has a value
        this.isRetrieveDisabled = this.searchForm.invalid;
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      // Do NOT set subtitle here - let page-header component use the service
      actions: [{
        label: 'ADD DRIVE RECORD',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new drive record',
        onClick: () => this.createRecord()
      }]
    };

    // Title will be set by the effect from pageHeaderService
    // Subtitle will be automatically fetched by page-header component from pageHeaderService

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
        column: 'type',
        direction: 'default'
      },
      stickyHeader: true,
      stickyActionsColumn: true,
      emptyMessage: 'No drives available to display',
      loadingMessage: 'Loading drives data...',
      showPagination: true
    };
  }

  private loadChapterOptions(): void {
    this.drivesService.getChapterLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.chapterOptions = response.data || [];
          this.filteredChapterOptions = this.chapterOptions;
        },
        error: () => {
          // Error handling can be added here if needed
        }
      });
  }

  private getTableColumns(): TableColumn<DrivesModel>[] {
    return [
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        width: '200px'
      },
      {
        key: 'drive',
        header: 'Drive',
        width: '100px'
      },
      {
        key: 'siteID',
        header: 'Site ID',
        width: '100px'
      },
      {
        key: 'description',
        header: 'Description',
        width: '300px'
      },
      {
        key: 'os',
        header: 'OS',
        width: '80px'
      },
      {
        key: 'scheduledDate',
        header: 'Scheduled Date',
        width: '150px',
        valueFormatter: (value) => formatTableDate(value)
      }
    ];
  }


  private getRowActions(): RowAction<DrivesModel>[] {
    return [
      {
        icon: 'edit',
        iconSvg: 'assets/images/icons/edit.svg',
        label: 'Edit drive record',
        ariaLabel: 'Edit drive record {{drive}}',
        color: 'default',
        action: 'edit'
      }
    ];
  }

  onRetrieve(): void {
    this.searchForm.markAllAsTouched();

    if (this.searchForm.invalid) {
      return;
    }

    const formValue = this.searchForm.value;

    // Update request state with search parameters
    this.requestState.chapterId = formValue.chapterId;
    this.requestState.fromDate = formValue.fromDate ? this.formatDateForApi(formValue.fromDate) : null;
    this.requestState.toDate = formValue.toDate ? this.formatDateForApi(formValue.toDate) : null;

    // Update selected chapter for display
    this.selectedChapter = this.chapterOptions.find(c => c.chapterId === formValue.chapterId) || null;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.hasSearched = true;
    this.shouldStoreOriginalData = true; // Store data from this Retrieve for type dropdown
    this.loadData();
  }

  loadData(): void {
    if (!this.hasSearched) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    const pageNumber = (this.tableConfig.pagination?.pageIndex || 0) + 1; // Convert to 1-indexed
    const pageSize = this.tableConfig.pagination?.pageSize || 10;

    this.drivesService
      .getDrives(pageNumber, pageSize, this.requestState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: DrivesModel[]; totalRecords: number }) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.totalRecords;

          // Store original data from Retrieve (for type dropdown)
          if (this.shouldStoreOriginalData) {
            this.originalDataSource = response.data;
            this.shouldStoreOriginalData = false;
          }

          this.isLoading = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
          this.errorMessage = 'Failed to load drives data. Please try again.';
        }
      });
  }

  onSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || null;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

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
    this.tableConfig.sortConfig!.column = event.column;
    this.tableConfig.sortConfig!.direction = event.direction;

    this.requestState.Sort =
      event.direction === 'default' ? undefined : event.direction;

    this.loadData();
  }

  onRowAction(event: TableRowActionEvent<DrivesModel>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }

    switch (event.action) {
      case 'edit':
        this.editRecord(event.row);
        break;
    }
  }

  createRecord(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  editRecord(record: DrivesModel): void {
    this.sidePanelMode = 'edit';
    this.sidePanelData = record;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    // Only update original data if NO filters applied
    this.shouldStoreOriginalData = !this.hasActiveFilters();

    this.loadData();
  }

  onModeChange(newMode: 'add' | 'edit'): void {
    this.sidePanelMode = newMode;
    if (newMode === 'add') {
      this.sidePanelData = null;
    }
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
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

    const portal = new ComponentPortal(DrivesFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;
    componentRef.instance.selectedChapterId = this.selectedChapter?.chapterId || null;
    componentRef.instance.fromDate = this.requestState.fromDate || null;
    componentRef.instance.toDate = this.requestState.toDate || null;

    componentRef.instance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    componentRef.instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }
      });
  }

  applyFilters(filters: DrivesFilterValue): void {
    this.appliedFilters = filters;

    this.filterChips = DrivesFilterChipsUtils.convertFiltersToChips(filters);

    // Update request state with filter values
    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = DrivesFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = DrivesFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.updateRequestStateFromFilters();

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }

    this.loadData();
  }

  hasActiveFilters(): boolean {
    return DrivesFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];

    // Clear filter values from request state
    this.requestState.type = null;
    this.requestState.driveId = null;
    this.requestState.siteId = null;
    this.requestState.scheduleDate = null;
    this.requestState.schedulePeriod = null;

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.shouldStoreOriginalData = true;
    this.loadData();
  }

  private updateRequestStateFromFilters(): void {
    if (!this.appliedFilters) {
      this.requestState.type = null;
      this.requestState.driveId = null;
      this.requestState.siteId = null;
      this.requestState.scheduleDate = null;
      this.requestState.schedulePeriod = null;
      return;
    }

    // Extract type value (e.g., "F" from "F - Fixed site drives")
    let typeValue = this.appliedFilters.type;
    if (typeValue) {
      const match = typeValue.match(/^([FIC])/);
      typeValue = match ? match[1] : typeValue;
    }

    this.requestState.type = typeValue || null;
    this.requestState.driveId = this.appliedFilters.drive || null;
    this.requestState.siteId = this.appliedFilters.siteId || null;
    this.requestState.scheduleDate = this.appliedFilters.scheduledDate
      ? this.formatDateForApi(this.appliedFilters.scheduledDate)
      : null;
    this.requestState.schedulePeriod = this.appliedFilters.period || null;
  }

  /**
   * Format date for API (dd-MMM-yyyy format with title case month)
   */
  private formatDateForApi(date: any): string {
    if (!date) return '';
    const m = moment(date);
    if (!m.isValid()) return '';

    // Format as DD-Mon-YYYY (e.g., "28-Feb-2026")
    const day = m.format('DD');
    const month = m.format('MMM'); // Get month abbreviation
    const year = m.format('YYYY');

    // Ensure month is in title case (first letter uppercase, rest lowercase)
    const monthTitleCase = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();

    return `${day}-${monthTitleCase}-${year}`;
  }

  getChapterIdError(): string {
    const control = this.searchForm.get('chapterId');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Please select a Chapter';
    }
    return '';
  }

  private setupChapterSearch(): void {
  this.chapterSearchControl.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(search => {
      if (!search) {
        this.filteredChapterOptions = this.chapterOptions;
        return;
      }
      const lowerSearch = search.toLowerCase();
      this.filteredChapterOptions = this.chapterOptions.filter(chapter =>
        chapter.chapterId.toLowerCase().includes(lowerSearch) ||
        chapter.chapterName.toLowerCase().includes(lowerSearch)
      );
    });
}

onChapterDropdownClosed(): void {
  this.chapterSearchControl.setValue('');
  this.filteredChapterOptions = this.chapterOptions;
}


  getFromDateError(): string {
    const control = this.searchForm.get('fromDate');
    if (!control || !(control.touched || control.dirty)) return '';

    // Check for invalid input first (user typed something but datepicker couldn't parse it)
    const inputValue = this.fromDateInput?.nativeElement?.value;
    if (control.hasError('required') && inputValue && inputValue.trim().length > 0) {
      return 'From Date is invalid';
    }

    if (control.hasError('required')) {
      return 'From Date is required';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'From Date is invalid';
    }

    // Only show cross-field validation error if fromDate was the last changed field
    if (control.hasError('dateAfter') && this.lastChangedDateField === 'fromDate') {
      return 'From Date must be before or equal to To Date';
    }

    return '';
  }

  getToDateError(): string {
    const control = this.searchForm.get('toDate');
    if (!control || !(control.touched || control.dirty)) return '';

    // Check for invalid input first (user typed something but datepicker couldn't parse it)
    const inputValue = this.toDateInput?.nativeElement?.value;
    if (control.hasError('required') && inputValue && inputValue.trim().length > 0) {
      return 'To Date is invalid';
    }

    if (control.hasError('required')) {
      return 'To Date is required';
    }

    if (control.hasError('matDatepickerParse')) {
      return 'To Date is invalid';
    }

    // Only show cross-field validation error if toDate was the last changed field
    if (control.hasError('dateBefore') && this.lastChangedDateField === 'toDate') {
      return 'To Date must be after From Date';
    }

    return '';
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+C: Create new record
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.createRecord();
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

    // Escape: Close side panel if open
    if (event.key === 'Escape' && this.sidePanelOpen) {
      event.preventDefault();
      this.closeSidePanel();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload chapter options and clear search when chapter changes
        this.loadChapterOptions();
        this.hasSearched = false;
        this.searchForm.reset();
      });
  }

}
