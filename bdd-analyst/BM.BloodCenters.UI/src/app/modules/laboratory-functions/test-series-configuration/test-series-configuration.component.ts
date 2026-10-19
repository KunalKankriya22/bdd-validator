import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { concat, forkJoin, Observable, Subject } from 'rxjs';
import { takeUntil, toArray } from 'rxjs/operators';
import moment from 'moment';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import { TestSeriesConfigApiService } from './services/test-series-configuration-api.service';
import {
  TestSeriesConfigDto,
  TestSeriesConfigGridRow,
  TestSeriesDropdownItem,
  ValidTestItem,
  CreateTestSeriesConfigDto,
  UpdateTestSeriesConfigDto,
  TestSeriesConfigCompositeKey,
  ResultCodeOption,
  NotationCodeOption,
} from './models/test-series-configuration.model';

@Component({
  selector: 'app-test-series-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './test-series-configuration.component.html',
  styleUrl: './test-series-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestSeriesConfigurationComponent implements OnInit, AfterViewInit, OnDestroy {
  private static nextId = 0;
  @ViewChild('resultCodeTpl') resultCodeTpl!: TemplateRef<unknown>;
  protected readonly componentId = `test-series-config-${TestSeriesConfigurationComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(TestSeriesConfigApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  private readonly allData = signal<TestSeriesConfigGridRow[]>([]);
  protected readonly data = signal<TestSeriesConfigGridRow[]>([]);
  protected readonly editableData = signal<TestSeriesConfigGridRow[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly isEditMode = signal<boolean>(false);
  protected readonly testSeriesOptions = signal<TestSeriesDropdownItem[]>([]);
  protected readonly testIdOptions = signal<ValidTestItem[]>([]);
  protected readonly scheduleTestOptions = signal<ValidTestItem[]>([]);
  private rowResultCodesMap = new WeakMap<FormGroup, ResultCodeOption[]>();
  private resultCodeCacheVersion = signal(0);
  protected readonly notationCodeOptions = signal<NotationCodeOption[]>([]);

  protected readonly isSeriesMode = signal<boolean>(false);
  protected readonly minDate = computed(() => DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()));

  protected readonly totalRecords = signal<number>(0);
  protected readonly hasRetrieved = signal<boolean>(false);
  private currentPageIndex = 0;
  private sortColumn = '';
  private sortDirection: 'ASC' | 'DESC' = 'ASC';

  protected readonly hasData = computed(() => this.data().length > 0);

  private readonly filterTestSeriesId = signal<string | null>(null);
  private readonly filterTestId = signal<string | null>(null);

  protected readonly canRetrieve = computed(() => !!(this.filterTestSeriesId() || this.filterTestId()));
  protected readonly canClearFilters = computed(() => !!(this.filterTestSeriesId() || this.filterTestId()));

  protected readonly editDirtyCount = signal(0);
  protected readonly canSave = computed(() => this.editDirtyCount() > 0 && !this.loading());

  // Searchable dropdown controls — filter area
  protected readonly testSeriesSearchCtrl = new FormControl('');
  protected readonly testIdSearchCtrl = new FormControl('');
  private readonly testSeriesSearchText = signal('');
  private readonly testIdSearchText = signal('');

  protected readonly filteredTestSeries = computed(() => {
    const s = this.testSeriesSearchText().toLowerCase();
    const options = this.testSeriesOptions();
    return !s ? options : options.filter(o => o.testSeriesId.toLowerCase().includes(s) || o.description.toLowerCase().includes(s));
  });

  protected readonly filteredTestIds = computed(() => {
    const s = this.testIdSearchText().toLowerCase();
    const options = this.testIdOptions();
    return !s ? options : options.filter(o => o.testId.toLowerCase().includes(s) || o.testDesc.toLowerCase().includes(s));
  });

  // Searchable dropdown controls — edit grid
  protected readonly editTestIdSearchCtrl = new FormControl('');
  protected readonly editResultCodeSearchCtrl = new FormControl('');
  protected readonly editScheduleSearchCtrl = new FormControl('');
  protected readonly editCancelSearchCtrl = new FormControl('');
  protected readonly editNotationSearchCtrl = new FormControl('');
  private readonly editTestIdSearchText = signal('');
  private readonly editResultCodeSearchText = signal('');
  private readonly editScheduleSearchText = signal('');
  private readonly editCancelSearchText = signal('');
  private readonly editNotationSearchText = signal('');

  protected readonly filteredEditTestIds = computed(() => {
    const s = this.editTestIdSearchText().toLowerCase();
    const options = this.testIdOptions();
    return !s ? options : options.filter(o => o.testId.toLowerCase().includes(s) || o.testDesc.toLowerCase().includes(s));
  });

  protected getResultCodesForRow(form: FormGroup): ResultCodeOption[] {
    this.resultCodeCacheVersion();
    return this.rowResultCodesMap.get(form) || [];
  }

  protected getFilteredResultCodesForRow(form: FormGroup): ResultCodeOption[] {
    const options = this.getResultCodesForRow(form);
    const s = this.editResultCodeSearchText().toLowerCase();
    return !s ? options : options.filter(o => o.resultCode.toLowerCase().includes(s));
  }

  protected readonly filteredEditScheduleTests = computed(() => {
    const s = this.editScheduleSearchText().toLowerCase();
    const options = this.scheduleTestOptions();
    return !s ? options : options.filter(o => o.testId.toLowerCase().includes(s) || o.testDesc.toLowerCase().includes(s));
  });

  protected readonly filteredEditCancelTests = computed(() => {
    const s = this.editCancelSearchText().toLowerCase();
    const options = this.scheduleTestOptions();
    return !s ? options : options.filter(o => o.testId.toLowerCase().includes(s) || o.testDesc.toLowerCase().includes(s));
  });

  protected readonly filteredEditNotationCodes = computed(() => {
    const s = this.editNotationSearchText().toLowerCase();
    const options = this.notationCodeOptions();
    return !s ? options : options.filter(o => o.notationCode.toLowerCase().includes(s));
  });

  filterForm!: FormGroup;
  rowForms: Map<number, FormGroup> = new Map();
  private originalFormValues: Map<number, Record<string, unknown>> = new Map();
  filterChips: FilterChip[] = [];

  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || 'Test Series Configuration', link: null },
      ],
      title: pageData?.title || 'Test Series Configuration',
      subtitle: pageData?.subtitle || 'Configure the ordering, canceling, and placing of notations based on test series or test ID.',
    };
  });

  tableConfig: DataTableConfig<TestSeriesConfigGridRow> = {
    columns: [
      { key: 'testSeriesId', header: 'Series ID', width: '110px' },
      { key: 'levelCode', header: 'Level', width: '80px' },
      { key: 'setNo', header: 'Set', width: '70px' },
      { key: 'testId', header: 'Test ID', width: '100px' },
      { key: 'resultCode', header: 'Result Code', width: '180px' },
      { key: 'scheduleTest', header: 'Schedule Test', width: '130px' },
      { key: 'cancelTest', header: 'Cancel Test', width: '120px' },
      { key: 'anotationCode', header: 'Notation Code', width: '120px' },
      {
        key: 'finalFlag', header: 'Final Result', width: '110px',
        valueFormatter: (value) => value === 'Y' ? 'Yes' : 'No',
      },
      {
        key: 'effDate', header: 'Effective Date', width: '130px',
        valueFormatter: (value) => this.formatDate(value),
      },
      {
        key: 'termDate', header: 'Termination Date', width: '150px',
        valueFormatter: (value) => this.formatDate(value),
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: { column: '', direction: 'default' },
    stickyHeader: true,
    emptyMessage: 'No test series configurations found',
    loadingMessage: 'Loading test series configurations...',
    showPagination: true,
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search Configurations',
    minLength: 1,
    ariaLabel: 'Search test series configurations',
  };

  displayedColumnsEditMode: string[] = [
    'seriesId', 'level', 'set', 'testId', 'resultCode',
    'scheduleTest', 'cancelTest', 'notationCode', 'finalResult',
    'effectiveDate', 'terminationDate', 'actions',
  ];

  ngOnInit(): void {
    this.initFilterForm();
    this.loadDropdownOptions();

    this.testSeriesSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testSeriesSearchText.set(v || ''));
    this.testIdSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testIdSearchText.set(v || ''));

    // Edit grid search controls
    this.editTestIdSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.editTestIdSearchText.set(v || ''));
    this.editResultCodeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.editResultCodeSearchText.set(v || ''));
    this.editScheduleSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.editScheduleSearchText.set(v || ''));
    this.editCancelSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.editCancelSearchText.set(v || ''));
    this.editNotationSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.editNotationSearchText.set(v || ''));

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadDropdownOptions();
      });
  }

  ngAfterViewInit(): void {
    const resultCodeCol = this.tableConfig.columns.find(c => c.key === 'resultCode');
    if (resultCodeCol) {
      resultCodeCol.cellTemplate = this.resultCodeTpl;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      testSeriesId: [null],
      testId: [null],
    });

    this.filterForm.get('testSeriesId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.filterTestSeriesId.set(value);
        if (value) {
          this.filterForm.get('testId')?.setValue(null, { emitEvent: false });
          this.filterForm.get('testId')?.disable({ emitEvent: false });
          this.filterTestId.set(null);
          this.isSeriesMode.set(true);
        } else if (!this.filterForm.get('testId')?.value) {
          this.filterForm.get('testId')?.enable({ emitEvent: false });
          this.isSeriesMode.set(false);
        }
      });

    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.filterTestId.set(value);
        if (value) {
          this.filterForm.get('testSeriesId')?.setValue(null, { emitEvent: false });
          this.filterForm.get('testSeriesId')?.disable({ emitEvent: false });
          this.filterTestSeriesId.set(null);
          this.isSeriesMode.set(false);
        } else if (!this.filterForm.get('testSeriesId')?.value) {
          this.filterForm.get('testSeriesId')?.enable({ emitEvent: false });
        }
      });
  }

  private loadDropdownOptions(): void {
    this.apiService
      .getTestSeriesDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.testSeriesOptions.set(options),
        error: (err) => console.error('Error loading test series dropdown:', err),
      });

    this.apiService
      .getValidTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.testIdOptions.set(options),
        error: (err) => console.error('Error loading test IDs:', err),
      });

    // Load schedule/cancel test options with both CNFRM and SUPP groups
    forkJoin([
      this.apiService.getValidTests('CNFRM'),
      this.apiService.getValidTests('SUPP'),
    ]).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([cnfrm, supp]) => this.scheduleTestOptions.set([...cnfrm, ...supp]),
        error: (err) => console.error('Error loading schedule test options:', err),
      });

    this.apiService
      .getNotationCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => this.notationCodeOptions.set(options),
        error: (err) => console.error('Error loading notation codes:', err),
      });

  }

  private loadResultCodesForRow(testId: string, form: FormGroup): void {
    this.apiService
      .getResultCodes(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.rowResultCodesMap.set(form, options);
          this.resultCodeCacheVersion.update(v => v + 1);
        },
        error: (err) => console.error('Error loading result codes:', err),
      });
  }

  protected getTestSeriesDescription(): string {
    const selectedId = this.filterForm.get('testSeriesId')?.value;
    if (!selectedId) return '';
    const option = this.testSeriesOptions().find(opt => opt.testSeriesId === selectedId);
    return option?.description || '';
  }

  protected getTestIdDescription(): string {
    const selectedId = this.filterForm.get('testId')?.value;
    if (!selectedId) return '';
    const option = this.testIdOptions().find(opt => opt.testId === selectedId);
    return option?.testDesc || '';
  }

  onRetrieve(): void {
    const testSeriesId = this.filterForm.get('testSeriesId')?.value;
    const testId = this.filterForm.get('testId')?.value;

    if (!testSeriesId && !testId) {
      this.snackbarService.showError('Either Test Series ID or Test ID must be entered');
      return;
    }

    this.currentPageIndex = 0;
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.buildFilterChips();
    this.loadData();
  }

  private loadData(): void {
    const testSeriesId = this.filterForm.get('testSeriesId')?.value;
    const testId = this.filterForm.get('testId')?.value;

    this.loading.set(true);

    const take = this.tableConfig.pagination?.pageSize || 25;
    const skip = this.currentPageIndex * take;

    this.apiService
      .getAll(take, skip, {
        testSeriesId: testSeriesId || null,
        testId: testId || null,
        includeInactive: false,
        sortColumn: this.sortColumn || null,
        sortOrder: this.sortDirection || null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const gridRows: TestSeriesConfigGridRow[] = response.items.map((item) => ({
            ...item,
            resultCodes: item.resultCode ? item.resultCode.split(',') : [],
            scheduleTests: item.scheduleTest ? item.scheduleTest.split(',') : [],
            cancelTests: item.cancelTest ? item.cancelTest.split(',') : [],
          }));

          this.allData.set(gridRows);
          this.data.set(gridRows);
          this.totalRecords.set(response.totalRecords);
          if (this.tableConfig.pagination) {
            this.tableConfig.pagination.totalRecords = response.totalRecords;
          }
          this.hasRetrieved.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackbarService.showError('Failed to load test series configurations');
        },
      });
  }

  private buildFilterChips(): void {
    const chips: FilterChip[] = [];
    const testSeriesId = this.filterForm.get('testSeriesId')?.value;
    const testId = this.filterForm.get('testId')?.value;

    if (testSeriesId) {
      chips.push({ key: 'testSeriesId', label: `Test Series: ${testSeriesId}`, value: testSeriesId });
    }
    if (testId) {
      chips.push({ key: 'testId', label: `Test ID: ${testId}`, value: testId });
    }
    this.filterChips = chips;
  }

  protected onRemoveFilterChip(key: string): void {
    if (key === 'testSeriesId') {
      this.filterForm.get('testSeriesId')?.setValue(null);
      this.filterForm.get('testId')?.enable({ emitEvent: false });
    } else if (key === 'testId') {
      this.filterForm.get('testId')?.setValue(null);
      this.filterForm.get('testSeriesId')?.enable({ emitEvent: false });
    }
    this.isSeriesMode.set(false);
    this.hasRetrieved.set(false);
    this.filterChips = [];
    this.data.set([]);
    this.totalRecords.set(0);
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.filterForm.get('testSeriesId')?.enable({ emitEvent: false });
    this.filterForm.get('testId')?.enable({ emitEvent: false });
    this.filterTestSeriesId.set(null);
    this.filterTestId.set(null);
    this.isSeriesMode.set(false);
    this.data.set([]);
    this.totalRecords.set(0);
    this.currentPageIndex = 0;
    this.isEditMode.set(false);
    this.hasRetrieved.set(false);
    this.filterChips = [];
    this.editableData.set([]);
    this.rowForms.clear();
    this.originalFormValues.clear();
  }

  protected onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageSize = event.pageSize;
      this.tableConfig.pagination.pageIndex = event.pageIndex;
    }
    this.currentPageIndex = event.pageIndex;
    this.loadData();
  }

  protected onSortChange(event: TableSortEvent): void {
    if (event.direction !== 'default') {
      this.sortColumn = event.column;
      this.sortDirection = event.direction === 'A' ? 'ASC' : 'DESC';
    } else {
      this.sortColumn = '';
      this.sortDirection = 'ASC';
    }
    this.tableConfig.sortConfig = { column: event.column, direction: event.direction };
    this.loadData();
  }

  protected onSearch(searchValue: string): void {
    if (!searchValue) {
      this.data.set(this.allData());
      return;
    }
    const searchLower = searchValue.toLowerCase();
    const filtered = this.allData().filter(row =>
      (row.testSeriesId?.toLowerCase().includes(searchLower)) ||
      (row.testId?.toLowerCase().includes(searchLower)) ||
      (row.resultCode?.toLowerCase().includes(searchLower)) ||
      (row.anotationCode?.toLowerCase().includes(searchLower)) ||
      (row.scheduleTest?.toLowerCase().includes(searchLower)) ||
      (row.cancelTest?.toLowerCase().includes(searchLower))
    );
    this.data.set(filtered);
  }

  onToggleEditMode(): void {
    if (this.isEditMode()) {
      this.isEditMode.set(false);
      this.editableData.set([]);
      this.rowForms.clear();
      this.originalFormValues.clear();
      this.editDirtyCount.set(0);
    } else {
      this.isEditMode.set(true);
      const editableCopy = this.data().map((row) => ({ ...row }));
      this.editableData.set(editableCopy);

      editableCopy.forEach((row, index) => {
        const form = this.createRowForm(row);
        this.rowForms.set(index, form);
        this.originalFormValues.set(index, form.getRawValue());
      });
    }
  }

  private static scheduleAndCancelOverlapValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) return null;
      const schedule: string = control.get('scheduleTest')?.value || '';
      const cancel: string = control.get('cancelTest')?.value || '';
      if (!schedule || !cancel) return null;
      return schedule === cancel ? { testOverlap: true } : null;
    };
  }

  private createRowForm(row: TestSeriesConfigGridRow): FormGroup {
    const seriesMode = this.isSeriesMode();
    const isTestMode = !seriesMode && !!this.filterForm.get('testId')?.value;
    const form = this.fb.group({
      testSeriesId: [{ value: row.testSeriesId, disabled: true }],
      levelCode: [{ value: row.levelCode, disabled: !seriesMode }, seriesMode ? [Validators.required, Validators.min(1), Validators.max(99)] : []],
      setNo: [{ value: row.setNo, disabled: !seriesMode }, seriesMode ? [Validators.required, Validators.min(1)] : []],
      testId: [{ value: row.testId, disabled: isTestMode }, isTestMode ? [] : [Validators.required]],
      resultCode: [row.resultCodes || [], [Validators.required]],
      scheduleTest: [row.scheduleTest || null],
      cancelTest: [row.cancelTest || null],
      anotationCode: [row.anotationCode],
      finalFlag: [row.finalFlag],
      effectiveDate: [row.effDate ? moment(row.effDate) : null, [Validators.required]],
      terminationDate: [row.termDate ? moment(row.termDate) : null],
    }, {
      validators: [
        DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate'),
        TestSeriesConfigurationComponent.scheduleAndCancelOverlapValidator(),
      ]
    });

    const chapterTz = this.headerService.chapterTimeZone();
    if (row.isNew) {
      DateFieldValidationUtility.setupAddModeValidators(form, chapterTz);
    } else {
      DateFieldValidationUtility.setupEditModeValidators(form, chapterTz);
      const termCtrl = form.get('terminationDate');
      if (termCtrl) {
        termCtrl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(chapterTz));
        termCtrl.updateValueAndValidity();
      }
    }

    if (row.testId) {
      this.loadResultCodesForRow(row.testId, form);
    }

    form.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((testId: string | null) => {
        form.get('resultCode')?.setValue([]);
        if (testId) {
          this.loadResultCodesForRow(testId, form);
        } else {
          this.rowResultCodesMap.delete(form);
          this.resultCodeCacheVersion.update(v => v + 1);
        }
      });

    if (row.isNew) {
      this.editDirtyCount.update(c => c + 1);
    } else {
      form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.updateDirtyCount();
      });
    }

    return form;
  }

  onAddNewRow(): void {
    const testSeriesId = this.filterForm.get('testSeriesId')?.value;
    const testId = this.filterForm.get('testId')?.value;

    const newRow: TestSeriesConfigGridRow = {
      testSeriesId: testSeriesId || null,
      levelCode: null,
      setNo: null,
      testId: (!testSeriesId && testId) ? testId : null,
      resultCode: null,
      scheduleTest: null,
      cancelTest: null,
      anotationCode: null,
      finalFlag: null,
      effDate: DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()).format('YYYY-MM-DD'),
      termDate: null,
      insertDate: '',
      insertUser: '',
      isNew: true,
      isEditing: true,
      resultCodes: [],
      scheduleTests: [],
      cancelTests: [],
    };

    this.editableData.set([newRow, ...this.editableData()]);

    const updatedRowForms = new Map<number, FormGroup>();
    updatedRowForms.set(0, this.createRowForm(newRow));
    for (const [oldIndex, form] of this.rowForms) {
      updatedRowForms.set(oldIndex + 1, form);
    }
    this.rowForms = updatedRowForms;

    const updatedOriginalValues = new Map<number, Record<string, unknown>>();
    for (const [oldIndex, values] of this.originalFormValues) {
      updatedOriginalValues.set(oldIndex + 1, values);
    }
    this.originalFormValues = updatedOriginalValues;
  }

  onDeleteRow(index: number): void {
    const row = this.editableData()[index];

    if (row.isNew) {
      this.editableData.set(this.editableData().filter((_, i) => i !== index));
      this.rebuildMapsAfterDelete(index);
      this.updateDirtyCount();
    } else {
      const params: TestSeriesConfigCompositeKey = {
        testSeriesId: row.testSeriesId,
        levelCode: row.levelCode,
        setNo: row.setNo,
        testId: row.testId,
      };

      this.loading.set(true);
      this.apiService
        .delete(params)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackbarService.showSuccess('Record deleted successfully');
            this.editableData.set(this.editableData().filter((_, i) => i !== index));
            this.rebuildMapsAfterDelete(index);
            this.updateDirtyCount();
            this.loading.set(false);
          },
          error: (err) => {
            this.snackbarService.showError(err.error?.message || 'Failed to delete record');
            this.loading.set(false);
          },
        });
    }
  }

  private rebuildMapsAfterDelete(deletedIndex: number): void {
    const newRowForms = new Map<number, FormGroup>();
    const newOriginalValues = new Map<number, Record<string, unknown>>();

    for (const [key, form] of this.rowForms) {
      if (key === deletedIndex) continue;
      const newKey = key > deletedIndex ? key - 1 : key;
      newRowForms.set(newKey, form);
    }

    for (const [key, values] of this.originalFormValues) {
      if (key === deletedIndex) continue;
      const newKey = key > deletedIndex ? key - 1 : key;
      newOriginalValues.set(newKey, values);
    }

    this.rowForms = newRowForms;
    this.originalFormValues = newOriginalValues;
  }

  onSave(): void {
    this.rowForms.forEach((form) => {
      DateFieldValidationUtility.clearOptionalDateErrors(form, 'terminationDate');
    });

    let hasErrors = false;
    this.rowForms.forEach((form) => {
      if (form.invalid) {
        Object.keys(form.controls).forEach((key) => {
          form.get(key)?.markAsTouched();
        });
        hasErrors = true;
      }
    });

    if (hasErrors) {
      this.snackbarService.showError('Please correct validation errors before saving');
      return;
    }

    this.loading.set(true);

    const ops: Observable<unknown>[] = [];
    let hasNewRecords = false;

    this.editableData().forEach((row, index) => {
      const form = this.rowForms.get(index);
      if (!form) return;

      if (!row.isNew && !form.dirty && !this.hasRowChanged(index, form)) return;

      const formValue = form.getRawValue();

      const dto: CreateTestSeriesConfigDto | UpdateTestSeriesConfigDto = {
        testSeriesId: row.testSeriesId,
        levelCode: formValue.levelCode,
        setNo: formValue.setNo,
        testId: formValue.testId,
        resultCode: formValue.resultCode?.length ? formValue.resultCode.join(',') : null,
        scheduleTest: formValue.scheduleTest || null,
        cancelTest: formValue.cancelTest || null,
        anotationCode: formValue.anotationCode,
        finalFlag: formValue.finalFlag,
        effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        termDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      };

      if (row.isNew) {
        hasNewRecords = true;
        ops.push(this.apiService.create(dto));
      } else {
        const params: TestSeriesConfigCompositeKey = {
          testSeriesId: row.testSeriesId,
          levelCode: row.levelCode,
          setNo: row.setNo,
          testId: row.testId,
        };
        ops.push(this.apiService.update(params, dto));
      }
    });

    if (ops.length === 0) {
      this.isEditMode.set(false);
      this.editableData.set([]);
      this.rowForms.clear();
      this.originalFormValues.clear();
      this.loadData();
      this.loading.set(false);
      return;
    }

    concat(...ops)
      .pipe(toArray(), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const msg = hasNewRecords
            ? 'Test Series Configuration added successfully'
            : 'Test Series Configuration saved successfully';
          this.snackbarService.showSuccess(msg);
          this.isEditMode.set(false);
          this.editableData.set([]);
          this.rowForms.clear();
          this.loadData();
          this.loading.set(false);
        },
        error: (err) => {
          this.snackbarService.showError(err.error?.message || 'Failed to save changes');
          this.loading.set(false);
        },
      });
  }

  onCancel(): void {
    this.isEditMode.set(false);
    this.editableData.set([]);
    this.rowForms.clear();
    this.originalFormValues.clear();
    this.editDirtyCount.set(0);
  }

  private updateDirtyCount(): void {
    let count = 0;
    this.editableData().forEach((row, index) => {
      if (row.isNew) {
        count++;
      } else {
        const form = this.rowForms.get(index);
        if (form && this.hasRowChanged(index, form)) {
          count++;
        }
      }
    });
    this.editDirtyCount.set(count);
  }

  private hasRowChanged(index: number, form: FormGroup): boolean {
    const original = this.originalFormValues.get(index);
    if (!original) return true;
    const current = form.getRawValue();
    return Object.keys(current).some(key => {
      const orig = original[key];
      const curr = current[key];
      if (Array.isArray(orig) && Array.isArray(curr)) {
        return orig.length !== curr.length || orig.some((v: unknown, i: number) => v !== curr[i]);
      }
      if (moment.isMoment(orig) && moment.isMoment(curr)) {
        return !orig.isSame(curr);
      }
      return orig !== curr;
    });
  }

  protected removeResultCode(rowIndex: number, code: string): void {
    const ctrl = this.getRowControl(rowIndex, 'resultCode');
    const current: string[] = ctrl.value || [];
    ctrl.setValue(current.filter(c => c !== code));
    ctrl.markAsDirty();
  }

  protected getRowControl(index: number, fieldName: string): FormControl {
    return this.rowForms.get(index)?.get(fieldName) as FormControl;
  }

  protected getRowEffectiveDateError(index: number): string {
    const form = this.rowForms.get(index);
    if (!form) return '';
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      form.get('effectiveDate'), 'Effective Date', 'Termination Date', null
    );
  }

  protected getRowTerminationDateError(index: number): string {
    const form = this.rowForms.get(index);
    if (!form) return '';
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      form.get('terminationDate'), 'Termination Date', 'Effective Date', form.errors
    );
  }

  protected formatDate(dateStr: string | null | Date): string {
    if (!dateStr) return '-';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  protected getTerminationDateMin(): moment.Moment {
    return this.minDate();
  }

  protected readonly yesNullOptions = [
    { value: 'Y', label: 'Yes' },
    { value: null, label: 'No' },
  ];
}
