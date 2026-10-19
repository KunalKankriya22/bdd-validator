import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  effect,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import {
  UnscheduledTestQueryService,
  UnscheduledTestResultDto,
  TestIdOption,
} from './unscheduled-test-query.service';
import {
  UnscheduledTestQueryFilterPanel,
  UnscheduledTestFilterValue,
} from './unscheduled-test-query-filter-panel/unscheduled-test-query-filter-panel';

function noFutureDateValidatorFactory(chapterTimezoneService: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const selectedDate = moment(value).startOf('day');
    const chapterDate = chapterTimezoneService.chapterLocalDate();
    const today = chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
    return selectedDate.isAfter(today, 'day') ? { futureDate: true } : null;
  };
}
const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_FILTERS: UnscheduledTestFilterValue = {
  reactive: null,
  ntsFlag: null,
  showCancel: null,
};

function getUnscheduledTestPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Rows per page:';
  return intl;
}

@Component({
  selector: 'app-unscheduled-test-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    FilterChips,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './unscheduled-test-query.html',
  styleUrls: ['./unscheduled-test-query.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MatPaginatorIntl, useFactory: getUnscheduledTestPaginatorIntl },
  ],
})
export class UnscheduledTestQueryComponent implements OnInit, OnDestroy {
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly service = inject(UnscheduledTestQueryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly overlay = inject(Overlay);
  private readonly snackBar = inject(MatSnackBar);

  maxToDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    return chapterDate && chapterDate.isValid()
      ? chapterDate.clone().startOf('day')
      : moment().startOf('day');
  });

  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  filterForm = new FormGroup(
    {
      testId: new FormControl<string | null>('ALL'),
      fromDate: new FormControl<moment.Moment | null>(null, [noFutureDateValidatorFactory(this.chapterTimezoneService)]),
      toDate: new FormControl<moment.Moment | null>(null),
    },
    { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('fromDate', 'toDate')] },
  );

  private lastChangedDateField: 'from' | 'to' | null = null;

  fromDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getFromDateError());
  toDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getToDateError());

  // Test ID dropdown
  private testIdOptionsSrc = signal<TestIdOption[]>([]);
  private selectedTestIdSig = signal<string | null>('ALL');
  private testIdSearchText = signal<string>('');
  isLoadingTestIds = false;

  testIdSearchCtrl = new FormControl<string>('', { nonNullable: true });

  readonly testIdOptions = computed(() => this.testIdOptionsSrc());

  readonly filteredTestIds = computed(() => {
    const q = this.testIdSearchText().toLowerCase();
    const items = this.testIdOptionsSrc();
    if (!q) return items;
    return items.filter(
      (o) => o.testId === 'ALL' ||
             o.testId.toLowerCase().includes(q) ||
             o.testDescription.toLowerCase().includes(q),
    );
  });

  // Selected test ID description — uses both signals so computed re-evaluates on either change
  readonly selectedDescription = computed(() => {
    const selected = this.selectedTestIdSig();
    if (!selected) return '-';
    if (selected === 'ALL') return 'All Unscheduled Pending Tests';
    return this.testIdOptionsSrc().find((o) => o.testId === selected)?.testDescription ?? '-';
  });

  // Unit ID
  unitIdVisible = true;
  validatedUnitId: string | null = null;

  // Filter panel
  private overlayRef: OverlayRef | null = null;
  isFilterOpen = false;
  appliedFilters = signal<UnscheduledTestFilterValue>({ ...DEFAULT_FILTERS });

  readonly filterChips = computed<FilterChip[]>(() => {
    const f = this.appliedFilters();
    const chips: FilterChip[] = [];
    if (f.reactive === 'Y') {
      chips.push({ key: 'reactive', label: 'Reactive: Reactive Only', value: f.reactive });
    }
    if (f.ntsFlag === 'Y') {
      chips.push({ key: 'ntsFlag', label: 'Ignore NT: Yes', value: f.ntsFlag });
    }
    if (f.showCancel === 'Y') {
      chips.push({ key: 'showCancel', label: 'Show Cancel: Cancelled Only', value: f.showCancel });
    }
    return chips;
  });

  // Table state
  isLoading = false;
  hasRetrieved = false;
  pagedData: UnscheduledTestResultDto[] = [];
  pageSizeOptions = PAGE_SIZES;
  pageSize = DEFAULT_PAGE_SIZE;
  pageIndex = 0;
  totalCount = 0;

  private destroy$ = new Subject<void>();

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
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.loadTestIds();
    this.subscribeToChapterChanges();
    this.filterForm.get('testId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.selectedTestIdSig.set(v ?? null));
    this.testIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.testIdSearchText.set(v ?? ''));
    this.filterForm.get('fromDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((fromVal) => {
        this.lastChangedDateField = 'from';
        const toCtrl = this.filterForm.get('toDate');
        if (fromVal && moment.isMoment(fromVal) && fromVal.isValid() && !toCtrl?.value) {
          toCtrl?.setValue(fromVal.clone(), { emitEvent: false });
          toCtrl?.markAsTouched();
          this.filterForm.updateValueAndValidity();
          this.cdr.markForCheck();
        }
      });
    this.filterForm.get('toDate')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (!prev && !curr) return true;
          if (!prev || !curr) return false;
          return moment(prev).format('YYYY-MM-DD') === moment(curr).format('YYYY-MM-DD');
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(() => { this.lastChangedDateField = 'to'; });
  }

  ngOnDestroy(): void {
    this.closeFilterPanel();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Computed helpers ───────────────────────────────────────────────

  get isRetrieveDisabled(): boolean {
    return this.filterForm.invalid || this.isLoading;
  }

  get isClearDisabled(): boolean {
    const { testId, fromDate, toDate } = this.filterForm.value;
    const hasFormValues = (!!testId && testId !== 'ALL') || !!fromDate || !!toDate || !!this.validatedUnitId;
    const hasFilters = this.filterChips().length > 0;
    return !hasFormValues && !hasFilters && !this.hasRetrieved;
  }

  // ─── Data loading ───────────────────────────────────────────────────

  private loadTestIds(): void {
    this.isLoadingTestIds = true;
    this.cdr.markForCheck();
    this.service.getTestIds().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.testIdOptionsSrc.set([
          { testId: 'ALL', testDescription: 'All Unscheduled Pending Tests' },
          ...(res.data ?? []),
        ]);
        this.isLoadingTestIds = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingTestIds = false;
        this.snackBar.open('Failed to load Test IDs. Please refresh and try again.', 'Close', {
          horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadTestIds();
    });
  }

  // ─── Retrieve / page ───────────────────────────────────────────────

  retrieve(): void {
    if (this.isRetrieveDisabled) return;
    this.filterForm.markAllAsTouched();
    this.cdr.markForCheck();
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
    this.hasRetrieved = true;
    this.cdr.markForCheck();

    const f = this.filterForm.value;
    const filters = this.appliedFilters();

    // Map 'Y' → 'Y', null/anything else → null
    const toFlag = (val: string | null): string | null => (val === 'Y' ? 'Y' : null);

    this.service
      .search({
        testId: f.testId ?? null,
        unitId: this.validatedUnitId || null,
        fromCollDate: DateFieldValidationUtility.serializeDateForApi(f.fromDate) ?? null,
        toCollDate: DateFieldValidationUtility.serializeDateForApi(f.toDate) ?? null,
        reactive: toFlag(filters.reactive),
        ntsFlag: toFlag(filters.ntsFlag),
        showCancel: toFlag(filters.showCancel),
        take: this.pageSize,
        skip: this.pageIndex * this.pageSize,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.pagedData = res.data ?? [];
          this.totalCount = res.total ?? 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'An error occurred while loading results.';
          this.snackBar.open(msg, 'Close', {
            horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], duration: 5000,
          });
          this.pagedData = [];
          this.totalCount = 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  clearAll(): void {
    this.filterForm.reset({ testId: 'ALL', fromDate: null, toDate: null });
    this.filterForm.markAsUntouched();
    this.filterForm.markAsPristine();
    this.selectedTestIdSig.set('ALL');
    this.testIdSearchCtrl.reset('');
    this.testIdSearchText.set('');
    this.lastChangedDateField = null;
    this.resetUnitId();
    this.appliedFilters.set({ ...DEFAULT_FILTERS });
    this.pagedData = [];
    this.totalCount = 0;
    this.pageIndex = 0;
    this.hasRetrieved = false;
    this.cdr.markForCheck();
  }

  // ─── Unit ID ───────────────────────────────────────────────────────

  onUnitValidated(response: UnitValidationResponse): void {
    this.validatedUnitId = response.parsedUnitId ?? null;
  }

  onUnitCleared(): void {
    this.validatedUnitId = null;
  }

  private resetUnitId(): void {
    this.unitIdVisible = false;
    this.validatedUnitId = null;
    // Recreate the component on next tick
    setTimeout(() => {
      this.unitIdVisible = true;
      this.cdr.markForCheck();
    }, 0);
  }

  // ─── Date input handlers ───────────────────────────────────────────

  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('fromDate'),
    );
  }

  onFromDateChange(): void {
    this.filterForm.get('fromDate')?.markAsTouched();
    this.filterForm.get('fromDate')?.markAsDirty();
    this.filterForm.updateValueAndValidity();
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('toDate'),
      false,
    );
  }

  onToDateChange(): void {
    this.filterForm.get('toDate')?.markAsTouched();
    this.filterForm.get('toDate')?.markAsDirty();
    this.filterForm.updateValueAndValidity();
  }

  onDatePickerClosed(): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  getFromDateError(): string {
    const control = this.filterForm.get('fromDate');
    if (control?.hasError('futureDate')) return 'From Date cannot be a future date';
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      control,
      'From Date',
      'To Date',
      this.filterForm.errors,
    );
  }

  getToDateError(): string {
    const control = this.filterForm.get('toDate');
    if (control?.hasError('futureDate')) return 'To Date cannot be a future date';
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      control,
      'To Date',
      'From Date',
      this.filterForm.errors,
    );
  }

  // ─── Filter panel (CDK overlay) ────────────────────────────────────

  openFilterPanel(): void {
    if (this.overlayRef) {
      this.closeFilterPanel();
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.filterBtn)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4,
        },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const portal = new ComponentPortal(UnscheduledTestQueryFilterPanel);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.instance.currentFilters = this.appliedFilters();

    componentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      this.onApplyFilters(filters);
    });

    componentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    this.overlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    this.isFilterOpen = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      const panelEl = componentRef.location.nativeElement as HTMLElement;
      const firstFocusable = panelEl.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
    });
  }

  private closeFilterPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isFilterOpen = false;
    this.cdr.markForCheck();
    this.filterBtn?.nativeElement?.focus();
  }

  private onApplyFilters(filters: UnscheduledTestFilterValue): void {
    this.appliedFilters.set({ ...filters });
    this.closeFilterPanel();
    setTimeout(() => this.cdr.markForCheck(), 20);
    if (this.hasRetrieved) {
      this.pageIndex = 0;
      this.fetchPage();
    }
  }

  // ─── Filter chip removal ───────────────────────────────────────────

  onRemoveChip(key: string): void {
    const current = { ...this.appliedFilters() };
    if (key === 'reactive') current.reactive = null;
    if (key === 'ntsFlag') current.ntsFlag = null;
    if (key === 'showCancel') current.showCancel = null;
    this.appliedFilters.set(current);
    setTimeout(() => this.cdr.markForCheck(), 20);
    if (this.hasRetrieved) {
      this.pageIndex = 0;
      this.fetchPage();
    }
  }

  onClearAllChips(): void {
    this.appliedFilters.set({ ...DEFAULT_FILTERS });
    if (this.hasRetrieved) {
      this.pageIndex = 0;
      this.fetchPage();
    }
  }

  // ─── Seq# helper ──────────────────────────────────────────────────

  getSeqNo(index: number): number {
    return this.pageIndex * this.pageSize + index + 1;
  }
}
