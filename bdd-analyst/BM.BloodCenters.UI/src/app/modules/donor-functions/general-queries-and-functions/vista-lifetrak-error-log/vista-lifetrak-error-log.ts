import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { VistaLifeTrakErrorLogService } from './vista-lifetrak-error-log.service';
import { VistaLifeTrakErrorLogDto } from './vista-lifetrak-error-log.model';

const PAGE_SIZES = [10, 25, 50, 100];

@Component({
  selector: 'app-vista-lifetrak-error-log',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      },
    },
  ],
  templateUrl: './vista-lifetrak-error-log.html',
  styleUrls: ['./vista-lifetrak-error-log.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VistaLifeTrakErrorLogComponent implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  filterForm: FormGroup = new FormGroup(
    {
      fromDate: new FormControl<Moment | null>(null, Validators.required),
      toDate: new FormControl<Moment | null>(null),
    },
    { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('fromDate', 'toDate')] }
  );

  /** Chapter date used as max for From Date and as startAt for both pickers */
  get chapterDate(): Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  get maxDate(): Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  isLoading = false;
  hasRetrieved = false;
  hasError = false;

  statusAnnouncement = '';
  pagedData: VistaLifeTrakErrorLogDto[] = [];

  pageSizeOptions = PAGE_SIZES;
  pageSize = 25;
  pageIndex = 0;
  totalCount = 0;

  private lastChangedDate: 'from' | 'to' | null = null;
  private destroy$ = new Subject<void>();

  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getFromDateError()
  );
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getToDateError()
  );

  get isRetrieveDisabled(): boolean {
    return this.filterForm.invalid || this.isLoading;
  }

  constructor(
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private vistaService: VistaLifeTrakErrorLogService,
    private chapterTimezoneService: ChapterTimezoneService,
    private cdr: ChangeDetectorRef,
  ) {
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

  ngOnInit(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.cdr.markForCheck();
    });

    this.filterForm.get('fromDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val: Moment | null) => {
      this.lastChangedDate = 'from';
      // Only auto-fill To Date when From Date is picked from the calendar and To Date is empty.
      // Do NOT clear To Date on null — typing emits null for every unparseable keystroke,
      // which would wipe an existing To Date and then re-apply From Date once it parses.
      const toDateCtrl = this.filterForm.get('toDate')!;
      if (val && !toDateCtrl.value) {
        toDateCtrl.setValue(val, { emitEvent: false });
        toDateCtrl.markAsTouched();
      }
      this.cdr.markForCheck();
    });

    this.filterForm.get('toDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastChangedDate = 'to';
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFromDateInput(event: Event): void {
    this.lastChangedDate = 'from';
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('fromDate')
    );
    this.cdr.markForCheck();
  }

  onToDateInput(event: Event): void {
    this.lastChangedDate = 'to';
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('toDate')
    );
    this.cdr.markForCheck();
  }

  getFromDateError(): string {
    const formErrors = this.lastChangedDate === 'from' ? this.filterForm.errors : null;
    const control = this.filterForm.get('fromDate');
    const crossFieldError = DateFieldValidationUtility.getStartDateCrossFieldError(
      control, 'From Date', 'To Date', formErrors
    );
    if (crossFieldError) return crossFieldError;
    if (control?.hasError('matDatepickerMax')) return 'From Date cannot be a future date';
    return '';
  }

  getToDateError(): string {
    // Pass a non-null object (even when form has no group errors) so the utility
    // doesn't suppress matDatepickerMin when toDate was the last changed field.
    const formErrors = this.lastChangedDate === 'to' ? (this.filterForm.errors ?? {}) : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.filterForm.get('toDate'), 'To Date', 'From Date', formErrors
    );
  }

  retrieve(): void {
    if (this.isRetrieveDisabled) return;
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid) return;

    this.pageIndex = 0;
    this.fetchPage();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.fetchPage();
  }

  private fetchPage(): void {
    this.isLoading = true;
    this.hasError = false;
    this.hasRetrieved = true;
    this.cdr.markForCheck();

    const { fromDate, toDate } = this.filterForm.value;
    const query = {
      fromDate: fromDate ? (fromDate as Moment).format('YYYY-MM-DD') : null,
      toDate: toDate ? (toDate as Moment).format('YYYY-MM-DD') : null,
    };

    this.vistaService
      .getErrorLogs(this.pageSize, this.pageIndex * this.pageSize, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.pagedData = res.data;
          this.totalCount = res.total;
          this.isLoading = false;
          this.statusAnnouncement = res.total > 0
            ? `${res.total} error log entries loaded`
            : 'No records found';
          this.cdr.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.hasError = true;
          this.pagedData = [];
          this.totalCount = 0;
          const apiErr = err?.error;
          const errorCode = apiErr?.errorResponse?.errorCode?.trim() || apiErr?.errorCode?.trim();
          const errorMsg = apiErr?.errorResponse?.error || apiErr?.message || 'Failed to retrieve error logs. Please try again.';
          const message = errorCode ? `Error ${errorCode}: ${errorMsg}` : errorMsg;
          this.snackbarService.showError(message);
          this.statusAnnouncement = 'Unable to load error log';
          this.cdr.markForCheck();
        },
      });
  }

  clearAll(): void {
    this.filterForm.reset();
    this.lastChangedDate = null;
    this.pagedData = [];
    this.totalCount = 0;
    this.pageIndex = 0;
    this.hasRetrieved = false;
    this.hasError = false;
    this.statusAnnouncement = '';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    return moment(value).format('D-MMM-YYYY HH:mm').toUpperCase();
  }
}
