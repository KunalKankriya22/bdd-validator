import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { TransfusionStatusLogService } from './services/transfusion-status-log.service';
import { TransfusionJobDto, TransfusionUnitDto } from './models/transfusion-status-log.model';
import { ViewCommentDialog } from './view-comment-dialog/view-comment-dialog';

@Component({
  selector: 'app-wellsky-transfusion-status-log',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTabsModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    DataTable,
  ],
  templateUrl: './wellsky-transfusion-status-log.html',
  styleUrls: ['./wellsky-transfusion-status-log.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class WellskyTransfusionStatusLogComponent implements OnInit, OnDestroy {
  private readonly service = inject(TransfusionStatusLogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('fromDateNativeInput') fromDateNativeInput?: ElementRef;
  @ViewChild('toDateNativeInput') toDateNativeInput?: ElementRef;
  @ViewChild('okSort') set okSortSetter(sort: MatSort) { if (sort) this.okDataSource.sort = sort; }
  @ViewChild('errorSort') set errorSortSetter(sort: MatSort) { if (sort) this.errorDataSource.sort = sort; }

  filterForm!: FormGroup;
  data = signal<TransfusionJobDto[]>([]);
  total = signal(0);
  loading = signal(false);
  hasSearched = signal(false);
  currentSort = signal<{ column: string; direction: string }>({ column: 'jobId', direction: 'A' });

  sortedData = computed(() => {
    const records = [...this.data()];
    const sort = this.currentSort();
    if (!sort.column || sort.direction === 'default') return records;
    return records.sort((a, b) => {
      const valA = (a as any)[sort.column] ?? '';
      const valB = (b as any)[sort.column] ?? '';
      const cmp = typeof valA === 'number' ? valA - valB : String(valA).localeCompare(String(valB));
      return sort.direction === 'A' ? cmp : -cmp;
    });
  });

  // Side panel state
  unitsPanelOpen = signal(false);
  selectedJobId = signal<number | null>(null);
  okDataSource = new MatTableDataSource<TransfusionUnitDto>([]);
  errorDataSource = new MatTableDataSource<TransfusionUnitDto>([]);
  loadingOkUnits = signal(false);
  loadingErrorUnits = signal(false);
  unitColumns = ['unitId', 'antigenCode', 'resultCode', 'insertDate', 'cancelDate', 'testBatchId', 'actions'];

  tableConfig!: DataTableConfig<TransfusionJobDto>;

  private pageSize = 25;
  private pageIndex = 0;

  // Error state matchers — show form-level cross-field errors
  fromDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      if (!control.value && this.getNativeInputText(this.fromDateNativeInput)) return true;
      if (this.filterForm?.hasError('fromDateAfterToDate')) return true;
      return false;
    },
  };

  toDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control): boolean => {
      if (!control || !(control.dirty || control.touched)) return false;
      if (control.invalid) return true;
      if (!control.value && this.getNativeInputText(this.toDateNativeInput)) return true;
      if (this.filterForm?.hasError('fromDateAfterToDate')) return true;
      return false;
    },
  };

  ngOnInit(): void {
    this.initFilterForm();
    this.initTableConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Filter Form ──

  private initFilterForm(): void {
    this.filterForm = new FormGroup({
      fromDate: new FormControl(null),
      toDate: new FormControl(null),
    }, {
      validators: [this.fromDateToDateValidator.bind(this)],
    });

    this.filterForm.get('fromDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.filterForm.get('toDate')?.updateValueAndValidity({ emitEvent: false });
    });

    this.filterForm.get('toDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.filterForm.get('fromDate')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private fromDateToDateValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const from = control.get('fromDate')?.value;
    const to = control.get('toDate')?.value;
    if (!from || !to) return null;
    const fromMoment = moment.isMoment(from) ? from : moment(from);
    const toMoment = moment.isMoment(to) ? to : moment(to);
    if (fromMoment.isValid() && toMoment.isValid() && fromMoment.startOf('day').isAfter(toMoment.startOf('day'))) {
      return { fromDateAfterToDate: true };
    }
    return null;
  }

  getMaxDate(): moment.Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  // ── Input Handlers ──

  onFromDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const ctrl = this.filterForm.get('fromDate');
    if (!ctrl) return;
    ctrl.markAsTouched();
    ctrl.markAsDirty();
    if (inputValue?.trim() && !ctrl.value) {
      ctrl.setErrors({ ...(ctrl.errors || {}), invalidDate: true });
    } else if (!inputValue?.trim()) {
      ctrl.setErrors(null);
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  onToDateInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const ctrl = this.filterForm.get('toDate');
    if (!ctrl) return;
    ctrl.markAsTouched();
    ctrl.markAsDirty();
    if (inputValue?.trim() && !ctrl.value) {
      ctrl.setErrors({ ...(ctrl.errors || {}), invalidDate: true });
    } else if (!inputValue?.trim()) {
      ctrl.setErrors(null);
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  // ── Error Display ──

  private getNativeInputText(elRef?: ElementRef): string {
    return elRef?.nativeElement?.value?.trim() ?? '';
  }

  getFromDateError(): string {
    const ctrl = this.filterForm?.get('fromDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse')) return 'From Date is invalid';
    if (ctrl.hasError('invalidDate')) return 'From Date is invalid';
    if (!ctrl.value && this.getNativeInputText(this.fromDateNativeInput)) return 'From Date is invalid';
    if (ctrl.hasError('matDatepickerMax')) return 'From Date cannot be in the future';
    if (this.filterForm.hasError('fromDateAfterToDate')) return 'From Date cannot be greater than To Date';
    return '';
  }

  getToDateError(): string {
    const ctrl = this.filterForm?.get('toDate');
    if (!ctrl || !(ctrl.touched || ctrl.dirty)) return '';
    if (ctrl.hasError('matDatepickerParse')) return 'To Date is invalid';
    if (ctrl.hasError('invalidDate')) return 'To Date is invalid';
    if (!ctrl.value && this.getNativeInputText(this.toDateNativeInput)) return 'To Date is invalid';
    if (ctrl.hasError('matDatepickerMax')) return 'To Date cannot be in the future';
    if (this.filterForm.hasError('fromDateAfterToDate')) return 'To Date cannot be less than From Date';
    return '';
  }

  // ── Table Config ──

  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'jobId', header: 'Job Id', sortable: true },
        { key: 'jobDate', header: 'Day', sortable: false, valueFormatter: (_v, row) => this.formatDateTime(row.jobDate) },
        { key: 'tfFromDate', header: 'From Date', sortable: false, valueFormatter: (_v, row) => this.formatDate(row.tfFromDate) },
        { key: 'tfToDate', header: 'To Date', sortable: false, valueFormatter: (_v, row) => this.formatDate(row.tfToDate) },
        { key: 'extractStatus', header: 'Ext. Status', sortable: false },
        { key: 'tfAddRecordsCount', header: 'Add Cnt', sortable: false },
        { key: 'tfCancelRecordsCount', header: 'Cancel Cnt', sortable: false },
        { key: 'uploadStatus', header: 'Upload Status', sortable: false },
        { key: 'successCount', header: 'Success Cnt', sortable: false },
        { key: 'errorCount', header: 'Error Cnt', sortable: false },
        { key: 'untilDate', header: 'Last Read Date', sortable: false, valueFormatter: (_v, row) => this.formatDate(row.untilDate) },
      ],
      rowActions: [
        { icon: 'visibility', label: 'View', ariaLabel: 'View Units', action: 'view' },
      ],
      pagination: {
        pageSize: this.pageSize,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [10, 25, 50, 100],
      },
      sortConfig: { column: 'jobId', direction: 'A' },
      stickyHeader: true,
      showPagination: true,
      emptyMessage: 'No Results to Display',
      noDataIcon: 'search',
    };
  }

  // ── Actions ──

  onRetrieve(): void {
    if (this.isRetrieveDisabled()) return;
    this.pageIndex = 0;
    this.loadData();
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.data.set([]);
    this.total.set(0);
    this.hasSearched.set(false);
  }

  onRefresh(): void {
    this.loadData();
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(event: TableSortEvent): void {
    this.currentSort.set({ column: event.column, direction: event.direction });
  }

  onRowAction(event: TableRowActionEvent<TransfusionJobDto>): void {
    if (event.action === 'view') {
      this.onViewUnits(event.row);
    }
  }

  onViewUnits(job: TransfusionJobDto): void {
    this.selectedJobId.set(job.jobId);
    this.okDataSource.data = [];
    this.errorDataSource.data = [];
    this.loadingOkUnits.set(true);
    this.loadingErrorUnits.set(true);
    this.unitsPanelOpen.set(true);

    this.service.getOkUnits(job.jobId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.okDataSource.data = res.success ? res.data || [] : []; this.loadingOkUnits.set(false); },
      error: () => this.loadingOkUnits.set(false),
    });

    this.service.getErrorUnits(job.jobId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.errorDataSource.data = res.success ? res.data || [] : []; this.loadingErrorUnits.set(false); },
      error: () => this.loadingErrorUnits.set(false),
    });
  }

  closeUnitsPanel(): void {
    this.unitsPanelOpen.set(false);
    this.selectedJobId.set(null);
  }

  onViewComment(unit: TransfusionUnitDto): void {
    this.dialog.open(ViewCommentDialog, {
      width: '500px',
      data: { comment: unit.bcComments },
      autoFocus: false,
    });
  }

  isClearAllDisabled(): boolean {
    return !this.filterForm.get('fromDate')?.value
      && !this.filterForm.get('toDate')?.value
      && !this.hasSearched();
  }

  isRetrieveDisabled(): boolean {
    if (this.loading()) return true;
    const fromCtrl = this.filterForm?.get('fromDate');
    const toCtrl = this.filterForm?.get('toDate');
    if (fromCtrl?.invalid || toCtrl?.invalid) return true;
    if (this.filterForm?.hasError('fromDateAfterToDate')) return true;
    if (!fromCtrl?.value && this.getNativeInputText(this.fromDateNativeInput)) return true;
    if (!toCtrl?.value && this.getNativeInputText(this.toDateNativeInput)) return true;
    return false;
  }

  // ── Data Loading ──

  private loadData(): void {
    this.loading.set(true);
    this.hasSearched.set(true);

    const fromVal = this.filterForm.get('fromDate')?.value;
    const toVal = this.filterForm.get('toDate')?.value;

    // If no from date, BE defaults to SYSDATE-180. Show that in the picker.
    if (!fromVal) {
      const defaultFrom = moment().subtract(180, 'days').startOf('day');
      this.filterForm.get('fromDate')?.setValue(defaultFrom, { emitEvent: false });
    }
    // If no to date, BE uses no upper bound. Default to today for clarity.
    if (!toVal) {
      const defaultTo = this.chapterTimezoneService.getChapterLocalDate();
      this.filterForm.get('toDate')?.setValue(defaultTo, { emitEvent: false });
    }

    const finalFrom = this.filterForm.get('fromDate')?.value;
    const finalTo = this.filterForm.get('toDate')?.value;

    const params = {
      fromDate: finalFrom ? this.formatDateForApi(finalFrom) : undefined,
      toDate: finalTo ? this.formatDateForApi(finalTo) : undefined,
    };

    const skip = this.pageIndex * this.pageSize;

    this.service
      .searchJobs(this.pageSize, skip, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.data.set(res.data || []);
            this.total.set(res.total || 0);
          } else {
            this.snackbar.showError(res.message || 'Failed to retrieve jobs');
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  // ── Formatting ──

  private formatDateForApi(date: any): string {
    if (!date) return '';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.isValid() ? m.format('MM-DD-YYYY') : '';
  }

  formatDate(value: string | null): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  formatDateTime(value: string | null): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }
}
