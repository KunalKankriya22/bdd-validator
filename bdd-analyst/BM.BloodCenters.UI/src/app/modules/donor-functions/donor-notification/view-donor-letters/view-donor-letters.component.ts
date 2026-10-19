import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  effect,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { ViewDonorLettersService } from './services/view-donor-letters.service';
import {
  ViewDonorLettersDetailDialogComponent,
} from './components/detail-dialog/view-donor-letters-detail-dialog.component';
import {
  DonorLetterDto,
  DonorLetterDetailDto,
  LetterCodeLookupDto,
  DonorLookupDto,
  ViewDonorLettersDetailDialogData,
} from './models/view-donor-letters.model';

@Component({
  selector: 'app-view-donor-letters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    },
  ],
  templateUrl: './view-donor-letters.component.html',
  styleUrls: ['./view-donor-letters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ViewDonorLettersComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('paginatorWrapper') paginatorWrapper!: ElementRef;
  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;
  private destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(ViewDonorLettersService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  filterForm!: FormGroup;

  readonly codeOptions = signal<LetterCodeLookupDto[]>([]);
  readonly donorOptions = signal<DonorLookupDto[]>([]);
  isLoadingCodes = false;
  isLoadingDonors = false;

  readonly codeSearchControl = new FormControl('');
  readonly donorSearchControl = new FormControl('');
  private readonly codeSearch = signal('');
  private readonly donorSearch = signal('');
  private readonly letterCodeValue = signal<string | null>(null);
  private readonly donorIdValue = signal<string | null>(null);

  readonly filteredCodes = computed(() => {
    const search = this.codeSearch().toLowerCase();
    const options = this.codeOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.letterCode || '').toLowerCase().includes(search) ||
      (o.title || '').toLowerCase().includes(search)
    );
  });

  readonly filteredDonors = computed(() => {
    const search = this.donorSearch().toLowerCase();
    const options = this.donorOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.donorId || '').toLowerCase().includes(search) ||
      (o.name || '').toLowerCase().includes(search)
    );
  });

  readonly selectedCodeDisplay = computed(() => {
    const selectedCode = this.letterCodeValue();
    if (!selectedCode) return '';
    const code = this.codeOptions().find(c => c.letterCode === selectedCode);
    if (!code) return selectedCode;
    return code.title ? `${code.letterCode} - ${code.title}` : code.letterCode;
  });

  readonly selectedDonorDisplay = computed(() => {
    const selectedId = this.donorIdValue();
    if (!selectedId) return '';
    const donor = this.donorOptions().find(d => d.donorId === selectedId);
    if (!donor) return selectedId;
    return donor.name ? `${donor.donorId} - ${donor.name}` : donor.donorId;
  });

  isCodeTruncated = false;
  isDonorTruncated = false;

  dataSource: DonorLetterDto[] = [];
  isLoading = false;
  hasRetrievedData = false;

  displayedColumns: string[] = [
    'expand',
    'donorName',
    'letterCode',
    'generatedByName',
    'generateDate',
    'authorizedByName',
    'authorizeDate',
    'reprintedByName',
    'lastReprintedOn',
    'actions',
  ];

  expandedRows = new Set<string>();
  detailCache = new Map<string, DonorLetterDetailDto>();
  loadingDetails = new Set<string>();
  activeRow: DonorLetterDto | null = null;

  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  sortColumn = '';
  sortDirection: 'A' | 'D' | 'default' = 'default';

  constructor() {
    this.codeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.codeSearch.set(value || ''));

    this.donorSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.donorSearch.set(value || ''));

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
    this.initForm();
    this.loadLetterCodes();
    this.setupDonorLoadOnDateChange();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.removePaginatorTooltips();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private removePaginatorTooltips(): void {
    setTimeout(() => {
      const paginatorEl = this.paginatorWrapper?.nativeElement;
      if (paginatorEl) {
        const buttons = paginatorEl.querySelectorAll('.mat-mdc-paginator-navigation-first, .mat-mdc-paginator-navigation-previous, .mat-mdc-paginator-navigation-next, .mat-mdc-paginator-navigation-last');
        buttons.forEach((btn: Element) => {
          btn.removeAttribute('matTooltip');
          btn.removeAttribute('ng-reflect-message');
          btn.removeAttribute('aria-describedby');
        });
      }
    });
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      fromDate: [null, [Validators.required]],
      toDate: [null, [Validators.required]],
      letterCode: [null],
      donorId: [null],
    });

    this.filterForm.get('letterCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.letterCodeValue.set(val));

    this.filterForm.get('donorId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.donorIdValue.set(val));
  }

  private loadLetterCodes(): void {
    this.isLoadingCodes = true;
    this.service
      .getLetterCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.codeOptions.set(codes);
          this.isLoadingCodes = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.codeOptions.set([]);
          this.isLoadingCodes = false;
          this.cdr.markForCheck();
        },
      });
  }

  private setupDonorLoadOnDateChange(): void {
    const fromDate$ = this.filterForm.get('fromDate')!.valueChanges;
    const toDate$ = this.filterForm.get('toDate')!.valueChanges;

    combineLatest([fromDate$, toDate$])
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(([from, to]) => {
        this.filterForm.patchValue({ donorId: null }, { emitEvent: false });
        this.donorIdValue.set(null);
        this.donorOptions.set([]);
        this.donorSearchControl.setValue('');
        if (from && to) {
          this.loadDonors();
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadLetterCodes();
      });
  }

  private loadDonors(): void {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;

    if (!fromDate || !toDate) {
      this.donorOptions.set([]);
      return;
    }

    this.isLoadingDonors = true;
    this.cdr.markForCheck();

    this.service
      .getDonors({
        fromDate: moment(fromDate).format('YYYY-MM-DD'),
        toDate: moment(toDate).format('YYYY-MM-DD'),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donors) => {
          this.donorOptions.set(donors);
          this.isLoadingDonors = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.donorOptions.set([]);
          this.isLoadingDonors = false;
          this.cdr.markForCheck();
        },
      });
  }

  get isRetrieveDisabled(): boolean {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;
    const hasErrors = !!this.filterForm.get('fromDate')?.errors || !!this.filterForm.get('toDate')?.errors;
    return !fromDate || !toDate || hasErrors || this.isLoading;
  }

  get isClearAllDisabled(): boolean {
    const formValue = this.filterForm.value;
    const hasValues = formValue.fromDate || formValue.toDate || formValue.letterCode || formValue.donorId;
    return !hasValues && !this.hasRetrievedData;
  }

  onClearAll(): void {
    this.formDirective.resetForm({
      fromDate: null,
      toDate: null,
      letterCode: null,
      donorId: null,
    });
    this.letterCodeValue.set(null);
    this.donorIdValue.set(null);
    this.donorOptions.set([]);
    this.codeSearchControl.setValue('');
    this.donorSearchControl.setValue('');
    this.isCodeTruncated = false;
    this.isDonorTruncated = false;
    this.dataSource = [];
    this.totalRecords = 0;
    this.hasRetrievedData = false;
    this.expandedRows.clear();
    this.detailCache.clear();
    this.loadingDetails.clear();
    this.pageIndex = 0;
    this.sortColumn = '';
    this.sortDirection = 'default';
    this.cdr.markForCheck();
  }

  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('fromDate')
    );
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.filterForm.get('toDate')
    );
  }

  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputElement.value?.trim();
    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  getFromDateError(): string {
    const control = this.filterForm.get('fromDate');
    if (control?.hasError('fromAfterTo') && (control.touched || control.dirty)) {
      return 'From Date cannot be after To Date';
    }
    return DateFieldValidationUtility.getDateErrorMessage(
      control, this.filterForm.errors, 'From Date');
  }

  getToDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.filterForm.get('toDate'), this.filterForm.errors, 'To Date');
  }

  onDateChange(): void {
    this.clearCustomDateErrors();
    this.validateDates();
    this.cdr.markForCheck();
  }

  private validateDates(): void {
    const fromControl = this.filterForm.get('fromDate');
    const toControl = this.filterForm.get('toDate');
    if (!fromControl || !toControl) return;

    if (fromControl.hasError('matDatepickerParse') || toControl.hasError('matDatepickerParse')) {
      return;
    }

    const fromDate = fromControl.value;
    const toDate = toControl.value;

    if (!fromDate || !toDate) return;

    const fromStr = DateFieldValidationUtility.serializeDateForApi(fromDate);
    const toStr = DateFieldValidationUtility.serializeDateForApi(toDate);
    if (fromStr && toStr && fromStr > toStr) {
      this.addDateError(fromControl, 'fromAfterTo');
    }
  }

  private clearCustomDateErrors(): void {
    const fromControl = this.filterForm.get('fromDate');
    const toControl = this.filterForm.get('toDate');
    [fromControl, toControl].forEach(control => {
      if (control?.errors) {
        const { fromAfterTo, ...otherErrors } = control.errors;
        control.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      }
    });
  }

  private addDateError(control: AbstractControl, errorKey: string): void {
    control.setErrors({ ...control.errors, [errorKey]: true });
    control.markAsTouched();
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;

    this.isLoading = true;
    this.pageIndex = 0;
    this.expandedRows.clear();
    this.detailCache.clear();
    this.loadingDetails.clear();
    this.cdr.markForCheck();

    this.fetchData();
  }

  private fetchData(): void {
    const formValue = this.filterForm.value;
    const sortOrder = this.sortDirection === 'A' ? 'ASC' : this.sortDirection === 'D' ? 'DESC' : undefined;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.service
      .queryDonorLetters({
        fromDate: moment(formValue.fromDate).format('YYYY-MM-DD'),
        toDate: moment(formValue.toDate).format('YYYY-MM-DD'),
        letterCode: formValue.letterCode || undefined,
        donorId: formValue.donorId || undefined,
        sortColumn: this.sortColumn || undefined,
        sortOrder,
        take: this.pageSize,
        skip: this.pageIndex * this.pageSize,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalRecords = response.total;
          this.hasRetrievedData = true;
          this.isLoading = false;
          this.cdr.markForCheck();
          this.removePaginatorTooltips();
        },
        error: () => {
          this.dataSource = [];
          this.totalRecords = 0;
          this.hasRetrievedData = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // Expand/Collapse
  getRowKey(row: DonorLetterDto): string {
    return `${row.donorId}_${row.letterSeqNo}`;
  }

  isExpanded(row: DonorLetterDto): boolean {
    return this.expandedRows.has(this.getRowKey(row));
  }

  toggleRow(row: DonorLetterDto, event?: Event): void {
    event?.stopPropagation();
    const key = this.getRowKey(row);
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
      this.loadDetailIfNeeded(row);
    }
  }

  private loadDetailIfNeeded(row: DonorLetterDto): void {
    const key = this.getRowKey(row);
    if (this.detailCache.has(key) || this.loadingDetails.has(key)) return;

    this.loadingDetails.add(key);
    this.cdr.markForCheck();

    this.service
      .getDonorLetterDetail(row.donorId, row.letterSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          if (detail) {
            this.detailCache.set(key, detail);
          }
          this.loadingDetails.delete(key);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingDetails.delete(key);
          this.cdr.markForCheck();
        },
      });
  }

  getRowDetail(row: DonorLetterDto): DonorLetterDetailDto | undefined {
    return this.detailCache.get(this.getRowKey(row));
  }

  isDetailLoading(row: DonorLetterDto): boolean {
    return this.loadingDetails.has(this.getRowKey(row));
  }

  toggleAllRows(): void {
    if (this.areAllExpanded()) {
      this.expandedRows.clear();
    } else {
      this.dataSource.forEach((row) => {
        this.expandedRows.add(this.getRowKey(row));
        this.loadDetailIfNeeded(row);
      });
    }
  }

  areAllExpanded(): boolean {
    return this.dataSource.length > 0 && this.expandedRows.size === this.dataSource.length;
  }

  // Sorting
  onSort(column: string): void {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'default') {
        this.sortDirection = 'A';
      } else if (this.sortDirection === 'A') {
        this.sortDirection = 'D';
      } else {
        this.sortDirection = 'default';
        this.sortColumn = '';
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'A';
    }
    this.pageIndex = 0;
    this.fetchData();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column || this.sortDirection === 'default') return 'unfold_more';
    return this.sortDirection === 'A' ? 'arrow_upward' : 'arrow_downward';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn === column && this.sortDirection !== 'default';
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.expandedRows.clear();
    this.fetchData();
  }

  // Detail Dialog
  onViewDetail(row: DonorLetterDto, event?: Event): void {
    event?.stopPropagation();
    this.activeRow = row;
    this.cdr.markForCheck();

    const dialogData: ViewDonorLettersDetailDialogData = {
      donorId: row.donorId,
      letterSeqNo: row.letterSeqNo,
    };

    const dialogRef = this.dialog.open(ViewDonorLettersDetailDialogComponent, {
      panelClass: 'donor-letter-detail-right-dialog',
      width: '948px',
      maxWidth: '100vw',
      height: '100vh',
      position: { right: '0' },
      data: dialogData,
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.activeRow = null;
      this.cdr.markForCheck();
    });
  }

  // Dropdown truncation
  checkCodeTruncation(el: HTMLElement): void {
    this.isCodeTruncated = el.scrollWidth > el.clientWidth;
  }

  checkDonorTruncation(el: HTMLElement): void {
    this.isDonorTruncated = el.scrollWidth > el.clientWidth;
  }

  // Utility
  formatDate(value: string | null | undefined): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '--';
  }

  formatPhone(value: string | null | undefined): string {
    if (!value) return '--';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return value;
  }
}
