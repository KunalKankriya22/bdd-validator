import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorIntl, MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Router } from '@angular/router';
import { Subject, combineLatest, startWith, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { PaperlessNursingAuditService, PaperlessNursingAuditState } from './services/paperless-nursing-audit.service';
import {
  AuditOptionDto,
  NursingAuditRecordDto,
  AuditSummaryDto,
} from './models/paperless-nursing-audit.model';
import { IncludeExcludeInfoDialogComponent } from './components/include-exclude-info-dialog/include-exclude-info-dialog';
import { RecordDetailDialogComponent } from './components/record-detail-dialog/record-detail-dialog';

export function getNursingAuditPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-paperless-nursing-audit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterPanelBase,
    FilterChips,
    LoadingSpinnerComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MatPaginatorIntl, useFactory: getNursingAuditPaginatorIntl },
  ],
  templateUrl: './paperless-nursing-audit.html',
  styleUrls: ['./paperless-nursing-audit.scss'],
})
export class PaperlessNursingAuditComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auditService = inject(PaperlessNursingAuditService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('fromDateInput') fromDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput!: ElementRef<HTMLInputElement>;

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

  minToDate: Date | null = null;
  maxDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
    actions: [],
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Unit ID',
    minLength: 1,
    ariaLabel: 'Search by Unit ID',
    searchOnEnterOnly: false,
    debounceTime: 300,
  };

  idColumnLabel = 'Unit ID';

  filterForm!: FormGroup;
  auditOptions: AuditOptionDto[] = [];
  records: NursingAuditRecordDto[] = [];
  summary: AuditSummaryDto = { totalCount: 0, okCount: 0, holdCount: 0 };
  sessionId = '';
  driveIdOptions: string[] = [];
  filteredDriveIdOptions: string[] = [];
  driveIdSearchControl = new FormControl('');

  isLoading = false;
  isLoadingOptions = false;
  isLoadingDriveIds = false;
  hasData = false;
  filterPanelOpen = false;
  activeStatusFilter: string | null = null;
  searchText = '';
  filterStatusValue: string | null = null;

  readonly displayedColumns: string[] = [
    'includeExclude',
    'unitId',
    'collectionDate',
    'donorId',
    'driveId',
    'status',
    'reason',
    'actions',
  ];

  dataSource = new MatTableDataSource<NursingAuditRecordDto>([]);
  totalFilteredRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  readonly pageSizeOptions = [10, 25, 50, 100];
  currentSort: Sort = { active: '', direction: '' };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterChips: FilterChip[] = [];

  get isRetrieveDisabled(): boolean {
    return this.filterForm?.invalid || this.isLoading;
  }

  get isCommitDisabled(): boolean {
    return !this.hasData || this.isLoading;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadOptions();
    this.setupDriveIdLoading();
    this.setupDriveIdSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    if (this.hasData) {
      this.auditService.saveState({
        filterFormValues: this.filterForm.value,
        driveIdOptions: this.driveIdOptions,
        records: this.records,
        sessionId: this.sessionId,
        summary: this.summary,
        hasData: this.hasData,
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        searchText: this.searchText,
        activeStatusFilter: this.activeStatusFilter,
        filterStatusValue: this.filterStatusValue,
        filterChips: this.filterChips,
        currentSort: this.currentSort,
        idColumnLabel: this.idColumnLabel,
        searchConfig: this.searchConfig,
      });
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      idType: ['', Validators.required],
      driveId: [''],
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
    });
    this.setupDateValidation();
    this.setupIdTypeChangeListener();
  }

  private setupIdTypeChangeListener(): void {
    this.filterForm.get('idType')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((idType) => {
        this.idColumnLabel = idType?.toUpperCase() === 'DEFERRAL' ? 'Deferral ID' : 'Unit ID';
        this.searchConfig = {
          ...this.searchConfig,
          placeholder: `Search by ${this.idColumnLabel}`,
          ariaLabel: `Search by ${this.idColumnLabel}`,
        };
      });
  }

  private setupDateValidation(): void {
    this.filterForm.get('toDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const fromDateControl = this.filterForm.get('fromDate');
        fromDateControl?.updateValueAndValidity({ emitEvent: false });
      });

    this.filterForm.get('fromDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const toDateControl = this.filterForm.get('toDate');
        toDateControl?.updateValueAndValidity({ emitEvent: false });
      });

    this.filterForm.get('fromDate')?.addValidators((control) => {
      const toDateControl = this.filterForm.get('toDate');
      const fromDate = control.value;
      const toDate = toDateControl?.value;

      if (fromDate && toDate) {
        const fromDateValue = fromDate instanceof Date ? fromDate : (fromDate.toDate ? fromDate.toDate() : new Date(fromDate));
        const toDateValue = toDate instanceof Date ? toDate : (toDate.toDate ? toDate.toDate() : new Date(toDate));

        const from = new Date(fromDateValue.getFullYear(), fromDateValue.getMonth(), fromDateValue.getDate());
        const to = new Date(toDateValue.getFullYear(), toDateValue.getMonth(), toDateValue.getDate());

        if (from > to) {
          return { dateAfter: true };
        }
      }

      return null;
    });

    this.filterForm.get('toDate')?.addValidators((control) => {
      const fromDateControl = this.filterForm.get('fromDate');
      const toDate = control.value;
      const fromDate = fromDateControl?.value;

      if (toDate && fromDate) {
        const toDateValue = toDate instanceof Date ? toDate : (toDate.toDate ? toDate.toDate() : new Date(toDate));
        const fromDateValue = fromDate instanceof Date ? fromDate : (fromDate.toDate ? fromDate.toDate() : new Date(fromDate));

        const to = new Date(toDateValue.getFullYear(), toDateValue.getMonth(), toDateValue.getDate());
        const from = new Date(fromDateValue.getFullYear(), fromDateValue.getMonth(), fromDateValue.getDate());

        if (to < from) {
          return { dateBefore: true };
        }
      }

      return null;
    });
  }

  private setupDriveIdSearch(): void {
    this.driveIdSearchControl.valueChanges
      .pipe(
        startWith(''),
        map((search) => (search || '').toUpperCase()),
        takeUntil(this.destroy$),
      )
      .subscribe((searchTerm) => {
        this.filteredDriveIdOptions = this.driveIdOptions.filter((id) =>
          id.toUpperCase().includes(searchTerm),
        );
      });
  }

  private setupDriveIdLoading(): void {
    const idType$ = this.filterForm.get('idType')!.valueChanges;
    const fromDate$ = this.filterForm.get('fromDate')!.valueChanges;
    const toDate$ = this.filterForm.get('toDate')!.valueChanges;

    combineLatest([idType$, fromDate$, toDate$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([idType, fromDate, toDate]) => {
        if (idType && fromDate && toDate) {
          const fromMoment = moment(fromDate);
          const toMoment = moment(toDate);
          if (fromMoment.isValid() && toMoment.isValid() && fromMoment.isSameOrBefore(toMoment)) {
            this.loadDriveIds(idType, fromMoment.format('YYYY-MM-DDTHH:mm:ss'), toMoment.format('YYYY-MM-DDTHH:mm:ss'));
            return;
          }
        }
        this.driveIdOptions = [];
        this.filteredDriveIdOptions = [];
        this.driveIdSearchControl.setValue('');
        this.filterForm.get('driveId')?.reset('');
      });
  }

  private loadDriveIds(idType: string, fromDate: string, toDate: string): void {
    this.isLoadingDriveIds = true;
    const previousDriveId = this.filterForm.get('driveId')?.value;

    this.auditService
      .getDriveIds(idType, fromDate, toDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (driveIds) => {
          this.driveIdOptions = driveIds;
          this.filteredDriveIdOptions = driveIds;
          this.driveIdSearchControl.setValue('');
          if (previousDriveId && driveIds.includes(previousDriveId)) {
            this.filterForm.patchValue({ driveId: previousDriveId });
          } else {
            this.filterForm.patchValue({ driveId: '' });
          }
          this.isLoadingDriveIds = false;
        },
        error: () => {
          this.driveIdOptions = [];
          this.filteredDriveIdOptions = [];
          this.driveIdSearchControl.setValue('');
          this.filterForm.patchValue({ driveId: '' });
          this.isLoadingDriveIds = false;
        },
      });
  }

  private loadOptions(): void {
    this.isLoadingOptions = true;
    this.auditService
      .getOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.auditOptions = options;
          const savedState = this.auditService.getAndClearState();
          if (savedState) {
            this.restoreState(savedState);
          } else if (options.length > 0) {
            this.filterForm.patchValue({ idType: options[0].description });
          }
          this.isLoadingOptions = false;
        },
        error: () => {
          this.showError('Failed to load audit options.');
          this.isLoadingOptions = false;
        },
      });
  }

  private restoreState(state: PaperlessNursingAuditState): void {
    this.filterForm.patchValue(state.filterFormValues, { emitEvent: false });
    this.driveIdOptions = state.driveIdOptions;
    this.filteredDriveIdOptions = state.driveIdOptions;
    this.records = state.records;
    this.sessionId = state.sessionId;
    this.summary = state.summary;
    this.hasData = state.hasData;
    this.pageIndex = state.pageIndex;
    this.pageSize = state.pageSize;
    this.searchText = state.searchText;
    this.activeStatusFilter = state.activeStatusFilter;
    this.filterStatusValue = state.filterStatusValue;
    this.filterChips = state.filterChips;
    this.currentSort = state.currentSort;
    this.idColumnLabel = state.idColumnLabel;
    this.searchConfig = state.searchConfig;
    this.applyClientFilters();
  }

  onRetrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    const { idType, fromDate, toDate, driveId: selectedDriveId } = this.filterForm.value;

    const fromMoment = moment(fromDate);
    const toMoment = moment(toDate);

    this.isLoading = true;
    this.clearFilters();
    if (selectedDriveId) {
      this.filterForm.patchValue({ driveId: selectedDriveId });
    }

    this.auditService
      .startAudit({
        idType,
        fromDate: fromMoment.format('YYYY-MM-DDTHH:mm:ss'),
        toDate: toMoment.format('YYYY-MM-DDTHH:mm:ss'),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sessionId = response.sessionId;
          this.records = response.records;
          this.recalculateSummary();
          this.hasData = true;
          this.pageIndex = 0;
          this.applyClientFilters();
          this.isLoading = false;
        },
        error: (err) => {
          // Clear stale data so the table doesn't keep showing results from a previous retrieve
          this.records = [];
          this.sessionId = '';
          this.hasData = false;
          this.summary = { totalCount: 0, okCount: 0, holdCount: 0 };
          this.dataSource.data = [];
          this.totalFilteredRecords = 0;
          this.showError(this.formatApiError(err, 'Failed to retrieve audit records.'));
          this.isLoading = false;
        },
      });
  }

  onCommit(): void {
    if (!this.sessionId) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Commit Audit',
        message: 'Are you sure you want to commit this audit? This action cannot be undone.',
        confirmText: 'COMMIT',
        cancelText: 'CANCEL',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performCommit();
        }
      });
  }

  private performCommit(): void {
    this.isLoading = true;
    this.auditService
      .commitAudit(this.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.clearAll();
          this.snackBar.open('Audit completed successfully.', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
          this.isLoading = false;
        },
        error: (err) => {
          this.showError(this.formatApiError(err, 'Commit failed.'));
          this.isLoading = false;
        },
      });
  }

  onIncludeExcludeChange(record: NursingAuditRecordDto, value: string): void {
    const previousFlag = record.excludeFlag;
    const newFlag = value === 'exclude' ? 'X' : null;
    record.excludeFlag = newFlag;
    this.recalculateSummary();

    if (!record.idValue) return;

    this.auditService
      .updateExcludeFlags(this.sessionId, [{ idValue: record.idValue, excludeFlag: newFlag }])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          record.excludeFlag = previousFlag;
          this.recalculateSummary();
          this.showError(this.formatApiError(err, 'Failed to update exclude flag.'));
        },
      });
  }

  getIncludeExcludeValue(record: NursingAuditRecordDto): string {
    return record.excludeFlag === 'X' ? 'exclude' : 'include';
  }

  onToggleFilterPanel(): void {
    this.filterPanelOpen = !this.filterPanelOpen;
  }

  private updateFilterChips(): void {
    if (!this.activeStatusFilter) {
      this.filterChips = [];
    } else {
      this.filterChips = [
        {
          key: 'status',
          label: `Status: ${this.activeStatusFilter}`,
          value: this.activeStatusFilter,
          removable: true,
        },
      ];
    }
  }

  onFilterApply(): void {
    this.activeStatusFilter = this.filterStatusValue;
    this.filterPanelOpen = false;
    this.pageIndex = 0;
    this.updateFilterChips();
    this.applyClientFilters();
  }

  onFilterClear(): void {
    this.filterStatusValue = null;
    this.activeStatusFilter = null;
    this.filterPanelOpen = false;
    this.pageIndex = 0;
    this.updateFilterChips();
    this.applyClientFilters();
  }

  onFilterClose(): void {
    this.filterPanelOpen = false;
  }

  onRemoveChip(key: string): void {
    if (key === 'status') {
      this.activeStatusFilter = null;
      this.filterStatusValue = null;
      this.pageIndex = 0;
      this.updateFilterChips();
      this.applyClientFilters();
    }
  }

  onClearAllChips(): void {
    this.activeStatusFilter = null;
    this.filterStatusValue = null;
    this.pageIndex = 0;
    this.updateFilterChips();
    this.applyClientFilters();
  }

  onSearch(searchValue: string): void {
    this.searchText = searchValue?.trim() || '';
    this.pageIndex = 0;
    this.applyClientFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedRecords();
  }

  onSortChange(sort: Sort): void {
    this.currentSort = sort;
    this.pageIndex = 0;
    this.applyClientFilters();
  }

  onAuditDetail(record: NursingAuditRecordDto): void {
    const idType = this.filterForm.get('idType')?.value?.toUpperCase();
    const id = record.idValue;
    const returnUrl = '/donor-functions/registration/registration-general-functions/paperless-nursing-audit';
    const parentLabel = 'Paperless Nursing Audit';

    if (idType === 'DEFERRAL') {
      this.router.navigate(
        ['/donor-functions/registration/donation-deferral-audit-drawer'],
        { queryParams: { deferralId: id, returnUrl, parentLabel } }
      );
    } else {
      this.router.navigate(
        ['/donor-functions/registration/audit-donation'],
        { queryParams: { unitId: id, collectionDate: record.collDate, returnUrl, parentLabel } }
      );
    }
  }

  onViewDetails(record: NursingAuditRecordDto): void {
    this.dialog.open(RecordDetailDialogComponent, {
      width: '700px',
      data: record,
      autoFocus: false,
    });
  }

  onOpenInfoDialog(): void {
    this.dialog.open(IncludeExcludeInfoDialogComponent, {
      width: '500px',
      autoFocus: false,
    });
  }

  formatDate(isoDate: string | null | undefined): string {
    if (!isoDate) return '';
    const m = moment(isoDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  getFromDateError(): string {
    const control = this.filterForm?.get('fromDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'From Date is invalid';
    if (control.hasError('required')) {
      const inputValue = this.fromDateInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'From Date is invalid';
      }
      return 'From Collection Date is required';
    }
    if (control.hasError('dateAfter')) {
      return 'From date cannot be after To date';
    }
    if (control.hasError('matDatepickerMax')) return 'From Date cannot be a future date';
    return '';
  }

  getToDateError(): string {
    const control = this.filterForm?.get('toDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'To Date is invalid';
    if (control.hasError('required')) {
      const inputValue = this.toDateInput?.nativeElement?.value;
      if (inputValue && inputValue.trim().length > 0) {
        return 'To Date is invalid';
      }
      return 'To Collection Date is required';
    }
    if (control.hasError('dateBefore')) {
      return 'To date cannot be before From date';
    }
    if (control.hasError('matDatepickerMax')) return 'To Date cannot be a future date';
    return '';
  }

  private applyClientFilters(): void {
    let filtered = [...this.records];

    const selectedDriveId = this.filterForm?.get('driveId')?.value;
    if (selectedDriveId) {
      filtered = filtered.filter((r) => r.driveId === selectedDriveId);
    }

    if (this.activeStatusFilter) {
      filtered = filtered.filter((r) => r.status === this.activeStatusFilter);
    }

    if (this.searchText) {
      const search = this.searchText.toUpperCase();
      filtered = filtered.filter(
        (r) =>
          r.displayIdValue?.toUpperCase().includes(search) ||
          r.idValue?.toUpperCase().includes(search),
      );
    }

    if (this.currentSort.active && this.currentSort.direction) {
      filtered.sort((a, b) => {
        const valA = (a[this.currentSort.active as keyof NursingAuditRecordDto] as string) || '';
        const valB = (b[this.currentSort.active as keyof NursingAuditRecordDto] as string) || '';
        const compare = valA.localeCompare(valB);
        return this.currentSort.direction === 'asc' ? compare : -compare;
      });
    }

    this.totalFilteredRecords = filtered.length;
    this.updateDisplayedRecordsFromFiltered(filtered);
  }

  private updateDisplayedRecords(): void {
    this.applyClientFilters();
  }

  private updateDisplayedRecordsFromFiltered(filtered: NursingAuditRecordDto[]): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.dataSource.data = filtered.slice(start, end);
  }

  private recalculateSummary(): void {
    const included = this.records.filter((r) => r.excludeFlag !== 'X');
    this.summary = {
      totalCount: included.length,
      okCount: included.filter((r) => r.status === 'OK').length,
      holdCount: included.filter((r) => r.status !== 'OK').length,
    };
  }

  private clearFilters(): void {
    this.activeStatusFilter = null;
    this.filterStatusValue = null;
    this.searchText = '';
    this.filterPanelOpen = false;
    this.filterForm?.get('driveId')?.reset('');
    this.updateFilterChips();
  }

  private clearAll(): void {
    this.records = [];
    this.sessionId = '';
    this.driveIdOptions = [];
    this.filteredDriveIdOptions = [];
    this.driveIdSearchControl.setValue('');
    this.hasData = false;
    this.summary = { totalCount: 0, okCount: 0, holdCount: 0 };
    this.dataSource.data = [];
    this.totalFilteredRecords = 0;
    this.pageIndex = 0;
    this.clearFilters();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadOptions();
      });
  }

  private formatApiError(err: unknown, defaultMessage: string): string {
    const body = (err as { error?: { errorCode?: string; message?: string; errorResponse?: { errorCode?: string; error?: string } } })?.error;
    const code = body?.errorResponse?.errorCode || body?.errorCode;
    const msg = body?.errorResponse?.error || body?.message;
    if (code && msg) return `Error ${code}: ${msg}`;
    if (msg) return msg;
    return HttpErrorHandler.extractErrorMessage(err, defaultMessage);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
