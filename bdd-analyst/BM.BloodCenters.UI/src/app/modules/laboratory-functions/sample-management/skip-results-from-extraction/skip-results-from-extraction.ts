import {
  AfterViewInit,
  Component,
  OnInit,
  OnDestroy,
  TemplateRef,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';

import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SkipResultsFromExtractionApiService } from './services/skip-results-from-extraction-api.service';
import {
  ContractDto,
  OptionCodeDto,
  ReasonCodeDto,
  SkippedUnitDto,
  SkipResultsTableRow,
  TestBatchOption,
  UnitValidationResultDto,
  SkipUnitsRequestDto,
  ResetUnitsRequestDto,
} from './models/skip-results-from-extraction.model';

@Component({
  selector: 'app-skip-results-from-extraction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './skip-results-from-extraction.html',
  styleUrls: ['./skip-results-from-extraction.scss'],
})
export class SkipResultsFromExtractionComponent implements OnInit, AfterViewInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `skip-results-from-extraction-${SkipResultsFromExtractionComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly apiService = inject(SkipResultsFromExtractionApiService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('unitIdField') unitIdField?: UnitIdFieldComponent;
  @ViewChild('reasonCellTemplate') reasonCellTemplate!: TemplateRef<any>;

  private readonly defaultTitle = 'Skip Results from Extraction';
  private readonly defaultSubtitle = 'Record discarded empty bags and the reason for rejection';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: this.defaultTitle, link: null },
    ],
    title: this.defaultTitle,
    subtitle: this.defaultSubtitle,
    actions: [],
  };

  // Forms
  searchForm!: FormGroup;
  byBatchForm!: FormGroup;
  byUnitsForm!: FormGroup;
  resetForm!: FormGroup;

  // Signal-based state
  contracts = signal<ContractDto[]>([]);
  optionCodes = signal<OptionCodeDto[]>([]);
  reasonCodes = signal<ReasonCodeDto[]>([]);
  testBatches = signal<TestBatchOption[]>([]);
  tableData = signal<SkipResultsTableRow[]>([]);
  selectedContract = signal<ContractDto | null>(null);
  selectedTabIndex = signal<number>(0);
  selectedOptionCode = signal<string>('S');
  isLoadingContracts = signal<boolean>(false);
  isLoadingReasons = signal<boolean>(false);
  isLoadingBatches = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  validationResult = signal<UnitValidationResultDto | null>(null);
  resetSelectedRows = signal<SkipResultsTableRow[]>([]);

  // Search controls for dropdowns
  readonly contractSearchControl = new FormControl('');
  readonly testBatchSearchControl = new FormControl('');
  readonly byBatchReasonSearchControl = new FormControl('');
  readonly byUnitsReasonSearchControl = new FormControl('');
  readonly resetReasonSearchControl = new FormControl('');

  private readonly contractSearch = signal('');
  private readonly testBatchSearch = signal('');
  private readonly byBatchReasonSearch = signal('');
  private readonly byUnitsReasonSearch = signal('');
  private readonly resetReasonSearch = signal('');
  private readonly byBatchReasonCode = signal<string>('');
  private readonly byUnitsReasonCode = signal<string>('');
  private readonly resetReasonCode = signal<string>('');

  // Computed signals
  isResetMode = computed(() => this.selectedOptionCode() === 'R');

  filteredContracts = computed(() => {
    const search = this.contractSearch().toUpperCase();
    const items = this.contracts();
    if (!search) return items;
    return items.filter(
      (c) =>
        c.contractId.toUpperCase().includes(search) ||
        c.company.toUpperCase().includes(search)
    );
  });

  filteredTestBatches = computed(() => {
    const search = this.testBatchSearch().toUpperCase();
    const items = this.testBatches();
    if (!search) return items;
    return items.filter((b) => b.batchId.toUpperCase().includes(search));
  });

  filteredByBatchReasons = computed(() => {
    const search = this.byBatchReasonSearch().toUpperCase();
    const items = this.reasonCodes();
    if (!search) return items;
    return items.filter(
      (r) =>
        r.code.toUpperCase().includes(search) ||
        r.codeDesc.toUpperCase().includes(search)
    );
  });

  filteredByUnitsReasons = computed(() => {
    const search = this.byUnitsReasonSearch().toUpperCase();
    const items = this.reasonCodes();
    if (!search) return items;
    return items.filter(
      (r) =>
        r.code.toUpperCase().includes(search) ||
        r.codeDesc.toUpperCase().includes(search)
    );
  });

  filteredResetReasons = computed(() => {
    const search = this.resetReasonSearch().toUpperCase();
    const items = this.reasonCodes();
    if (!search) return items;
    return items.filter(
      (r) =>
        r.code.toUpperCase().includes(search) ||
        r.codeDesc.toUpperCase().includes(search)
    );
  });

  contractDescription = computed(() => {
    const selected = this.selectedContract();
    return selected ? selected.company : '---';
  });

  optionDescription = computed(() => {
    const code = this.selectedOptionCode();
    const option = this.optionCodes().find((o) => o.value === code);
    return option ? option.label : '---';
  });

  byBatchReasonDescription = computed(() => {
    const reasonCode = this.byBatchReasonCode();
    if (!reasonCode) return '---';
    const reason = this.reasonCodes().find((r) => r.code === reasonCode);
    return reason ? reason.codeDesc : '---';
  });

  byUnitsReasonDescription = computed(() => {
    const reasonCode = this.byUnitsReasonCode();
    if (!reasonCode) return '---';
    const reason = this.reasonCodes().find((r) => r.code === reasonCode);
    return reason ? reason.codeDesc : '---';
  });

  resetReasonDescription = computed(() => {
    const reasonCode = this.resetReasonCode();
    if (!reasonCode) return '---';
    const reason = this.reasonCodes().find((r) => r.code === reasonCode);
    return reason ? reason.codeDesc : '---';
  });

  tableDataCount = computed(() => this.tableData().length);

  private currentPageIndex = signal(0);
  private currentPageSize = signal(25);

  paginatedData = computed(() => {
    const data = this.tableData();
    const pageIndex = this.currentPageIndex();
    const pageSize = this.currentPageSize();
    const start = pageIndex * pageSize;
    return data.slice(start, start + pageSize);
  });

  readonly skipTableConfig: DataTableConfig<SkipResultsTableRow> = {
    columns: [
      { key: 'unitId', header: 'Unit ID (11)', sortable: true, width: '18%' },
      { key: 'outsideUnitId', header: 'Outside Unit ID', sortable: false, width: '18%' },
      { key: 'receivedDate', header: 'Received Date', sortable: false, width: '18%' },
      { key: 'reason', header: 'Reason', sortable: false, width: '15%' },
      { key: 'description', header: 'Description', sortable: false, width: '26%' },
    ],
    rowActions: [
      {
        icon: 'delete',
        label: 'Delete',
        ariaLabel: 'Delete unit from list',
        action: 'delete',
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    showPagination: true,
    enableSelection: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    loadingMessage: 'Processing...',
  };

  readonly resetTableConfig: DataTableConfig<SkipResultsTableRow> = {
    columns: [
      { key: 'unitId', header: 'Unit ID (11)', sortable: true, width: '18%' },
      { key: 'outsideUnitId', header: 'Outside Unit ID', sortable: false, width: '18%' },
      { key: 'receivedDate', header: 'Received Date', sortable: false, width: '18%' },
      { key: 'reason', header: 'Reason', sortable: false, width: '15%' },
      { key: 'description', header: 'Description', sortable: false, width: '26%' },
    ],
    rowActions: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    stickyHeader: true,
    showPagination: true,
    enableSelection: true,
    emptyMessage: 'No Skipped Units Found',
    emptySubMessage: 'No units are currently skipped for this contract',
    loadingMessage: 'Loading...',
  };

  get activeTableConfig(): DataTableConfig<SkipResultsTableRow> {
    return this.isResetMode() ? this.resetTableConfig : this.skipTableConfig;
  }

  constructor() {
    this.contractSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.contractSearch.set(value || '');
    });
    this.testBatchSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.testBatchSearch.set(value || '');
    });
    this.byBatchReasonSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.byBatchReasonSearch.set(value || '');
    });
    this.byUnitsReasonSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.byUnitsReasonSearch.set(value || '');
    });
    this.resetReasonSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.resetReasonSearch.set(value || '');
    });

    effect(() => {
      const count = this.tableData().length;
      this.skipTableConfig.pagination!.totalRecords = count;
      this.resetTableConfig.pagination!.totalRecords = count;
    });

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null },
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || this.defaultSubtitle,
        };
      }
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadContracts();
    this.loadOptionCodes();
    this.subscribeToChapterChanges();
    this.setupFormListeners();
  }

  ngAfterViewInit(): void {
    const reasonColumn = this.skipTableConfig.columns.find((c) => c.key === 'reason');
    if (reasonColumn) {
      reasonColumn.cellTemplate = this.reasonCellTemplate;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRowReasonChange(row: SkipResultsTableRow, reasonCode: string): void {
    const reasonObj = this.reasonCodes().find((r) => r.code === reasonCode);
    this.tableData.update((rows) =>
      rows.map((r) =>
        r.unitId === row.unitId
          ? { ...r, reason: reasonCode, description: reasonObj?.codeDesc || '' }
          : r
      )
    );
  }

  private initializeForms(): void {
    this.searchForm = this.fb.group({
      contractId: ['', Validators.required],
      optionCode: ['S', Validators.required],
    });

    this.byBatchForm = this.fb.group({
      testBatchId: [''],
      reason: ['', Validators.required],
    });

    this.byUnitsForm = this.fb.group({
      receivedDate: [{ value: '', disabled: true }],
      reason: ['', Validators.required],
    });

    this.resetForm = this.fb.group({
      reason: ['', Validators.required],
    });
  }

  private setupFormListeners(): void {
    // Contract change
    this.searchForm.get('contractId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((contractId) => {
      if (contractId) {
        const selected = this.contracts().find((c) => c.contractId === contractId);
        this.selectedContract.set(selected || null);
        this.tableData.set([]);
        this.resetSelectedRows.set([]);

        if (this.isResetMode()) {
          this.loadSkippedUnitsForReset(contractId);
        } else {
          this.loadBatches(contractId);
        }
      } else {
        this.selectedContract.set(null);
        this.testBatches.set([]);
        this.tableData.set([]);
      }
    });

    // Option code change
    this.searchForm.get('optionCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((optionCode) => {
      this.selectedOptionCode.set(optionCode || 'S');
      this.tableData.set([]);
      this.resetSelectedRows.set([]);
      this.byBatchForm.reset();
      this.byUnitsForm.reset();
      this.resetForm.reset();
      this.validationResult.set(null);

      if (optionCode) {
        this.loadReasonCodes(optionCode as 'S' | 'R');
        const contractId = this.searchForm.get('contractId')?.value;
        if (contractId) {
          if (optionCode === 'R') {
            this.loadSkippedUnitsForReset(contractId);
          } else {
            this.loadBatches(contractId);
          }
        }
      }
    });

    // Test Batch change
    this.byBatchForm.get('testBatchId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((batchId) => {
      if (batchId) {
        this.loadBatchUnits(batchId);
      } else {
        this.tableData.set([]);
      }
    });

    // Batch reason change — update description signal and propagate to all rows already in the table
    this.byBatchForm.get('reason')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((reasonCode) => {
      this.byBatchReasonCode.set(reasonCode || '');
      if (!this.tableData().length) return;
      const reasonObj = this.reasonCodes().find((r) => r.code === reasonCode);
      this.tableData.update((rows) =>
        rows.map((row) => ({
          ...row,
          reason: reasonCode || '',
          description: reasonObj?.codeDesc || '',
        }))
      );
    });

    // By Units reason change — update description signal
    this.byUnitsForm.get('reason')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((reasonCode) => {
      this.byUnitsReasonCode.set(reasonCode || '');
    });

    // Reset reason change — update description signal
    this.resetForm.get('reason')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((reasonCode) => {
      this.resetReasonCode.set(reasonCode || '');
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadContracts();
      this.loadOptionCodes();
    });
  }

  private loadContracts(): void {
    this.isLoadingContracts.set(true);
    this.apiService
      .getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contracts.set(contracts);
          this.isLoadingContracts.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load contracts. Please try again.');
          this.isLoadingContracts.set(false);
        },
      });
  }

  private loadOptionCodes(): void {
    this.apiService
      .getOptionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.optionCodes.set(codes);
          // Load reason codes for the default option code 'S'
          this.loadReasonCodes('S');
        },
        error: () => {
          this.snackbarService.showError('Failed to load option codes. Please try again.');
          // Fallback: load skip reason codes
          this.loadReasonCodes('S');
        },
      });
  }

  private loadReasonCodes(optionCode: 'S' | 'R'): void {
    this.isLoadingReasons.set(true);
    this.apiService
      .getReasonCodes(optionCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.reasonCodes.set(reasons);
          this.isLoadingReasons.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load reason codes. Please try again.');
          this.isLoadingReasons.set(false);
        },
      });
  }

  private loadBatches(contractId: string): void {
    this.isLoadingBatches.set(true);
    this.apiService
      .getBatches(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batches) => {
          this.testBatches.set(batches);
          this.isLoadingBatches.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load test batches. Please try again.');
          this.isLoadingBatches.set(false);
        },
      });
  }

  private loadBatchUnits(batchId: string): void {
    const contractId = this.searchForm.get('contractId')?.value;
    if (!contractId) return;

    this.isProcessing.set(true);
    const batchReason = this.byBatchForm.get('reason')?.value || '';
    const reasonObj = this.reasonCodes().find((r) => r.code === batchReason);

    this.apiService
      .getBatchUnits({ contractId, batchId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          const rows: SkipResultsTableRow[] = units.map((unit) => ({
            unitId: unit.unitId,
            outsideUnitId: unit.osUnitId,
            receivedDate: this.formatDate(unit.collDate),
            reason: batchReason,
            description: reasonObj?.codeDesc || '',
            collDateIso: unit.collDate,
          }));
          this.tableData.set(rows);
          this.isProcessing.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load batch units. Please try again.');
          this.isProcessing.set(false);
        },
      });
  }

  private loadSkippedUnitsForReset(contractId: string): void {
    this.isProcessing.set(true);
    this.apiService
      .getSkippedUnits({ contractId, batchId: null })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ data }) => {
          const rows: SkipResultsTableRow[] = data.map((unit) => this.mapSkippedUnitToTableRow(unit));
          this.tableData.set(rows);
          this.resetTableConfig.pagination!.totalRecords = rows.length;
          this.isProcessing.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load skipped units. Please try again.');
          this.isProcessing.set(false);
        },
      });
  }

  private mapSkippedUnitToTableRow(unit: SkippedUnitDto): SkipResultsTableRow {
    return {
      unitId: unit.unitId,
      outsideUnitId: unit.osUnitId,
      receivedDate: this.formatDate(unit.collDate),
      reason: unit.reasonCode,
      description: unit.reasonDescription,
      collDateIso: unit.collDate,
    };
  }

  onPostValidate(event: UnitIdPostValidateEvent): void {
    const contractId = this.searchForm.get('contractId')?.value;
    if (!contractId) {
      event.reject('Please select a contract first.');
      return;
    }
    if (this.isProcessing()) return;

    const parsedUnitId = event.data.parsedUnitId;

    const isDuplicate = this.tableData().some((row) => row.unitId === parsedUnitId);
    if (isDuplicate) {
      event.reject('This unit is already in the list.');
      return;
    }

    this.isProcessing.set(true);

    this.apiService
      .validateUnit({ contractId, unitId: parsedUnitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isProcessing.set(false);
          if (!result.isValid) {
            event.reject(result.errorMessage || 'Unit not found or not eligible for skip');
            this.validationResult.set(null);
          } else {
            event.confirm();
            this.validationResult.set(result);
            const receivedDate = result.collDate ? this.formatDate(result.collDate) : '';
            this.byUnitsForm.get('receivedDate')?.setValue(receivedDate);
          }
        },
        error: (error) => {
          this.isProcessing.set(false);
          const body = error?.error;
          const errorMessage =
            body?.errorResponse?.error || body?.message || error?.message || 'Failed to validate unit. Please try again.';
          event.reject(errorMessage);
          this.validationResult.set(null);
        },
      });
  }

  onAddUnitToTable(): void {
    const validation = this.validationResult();
    const reason = this.byUnitsForm.get('reason')?.value;

    if (!validation || !validation.isValid) {
      this.snackbarService.showError('Please scan a valid unit first.');
      return;
    }
    if (!reason) {
      this.byUnitsForm.get('reason')?.markAsTouched();
      this.snackbarService.showError('Please select a reason.');
      return;
    }

    const reasonObj = this.reasonCodes().find((r) => r.code === reason);
    const newRow: SkipResultsTableRow = {
      unitId: validation.unitId || '',
      outsideUnitId: validation.osUnitId || '',
      receivedDate: validation.collDate ? this.formatDate(validation.collDate) : '',
      reason,
      description: reasonObj?.codeDesc || '',
      collDateIso: validation.collDate || '',
    };

    this.tableData.update((data) => [...data, newRow]);
    this.byUnitsForm.get('receivedDate')?.setValue('');
    this.validationResult.set(null);
    this.unitIdField?.clear();
  }

  onRowAction(event: TableRowActionEvent<SkipResultsTableRow>): void {
    if (event.action === 'delete') {
      this.tableData.update((data) => data.filter((r) => r.unitId !== event.row.unitId));
    }
  }

  onSelectionChange(selectedRows: SkipResultsTableRow[]): void {
    this.resetSelectedRows.set(selectedRows);
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    this.skipTableConfig.pagination!.pageIndex = event.pageIndex;
    this.skipTableConfig.pagination!.pageSize = event.pageSize;
    this.resetTableConfig.pagination!.pageIndex = event.pageIndex;
    this.resetTableConfig.pagination!.pageSize = event.pageSize;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    if (index === 0) {
      const contractId = this.searchForm.get('contractId')?.value;
      if (contractId && !this.testBatches().length) {
        this.loadBatches(contractId);
      }
    }
  }

  clearSearchForm(): void {
    this.searchForm.reset({ optionCode: 'S' });
    this.selectedContract.set(null);
    this.selectedOptionCode.set('S');
    this.testBatches.set([]);
    this.tableData.set([]);
    this.resetSelectedRows.set([]);
    this.byBatchForm.reset();
    this.byUnitsForm.reset();
    this.resetForm.reset();
    this.validationResult.set(null);
  }

  clearByBatchForm(): void {
    this.byBatchForm.reset();
    this.tableData.set([]);
  }

  clearByUnitsForm(): void {
    this.byUnitsForm.reset();
    this.validationResult.set(null);
    this.unitIdField?.clear();
  }

  clearResetForm(): void {
    this.resetForm.reset();
    this.resetSelectedRows.set([]);
  }

  clearAll(): void {
    this.clearSearchForm();
  }

  onCancel(): void {
    this.clearAll();
  }

  onSave(): void {
    const contractId = this.searchForm.get('contractId')?.value;
    if (!contractId) {
      this.snackbarService.showError('Please select a contract.');
      return;
    }

    if (this.isResetMode()) {
      this.saveReset(contractId);
    } else {
      this.saveSkip(contractId);
    }
  }

  private saveSkip(contractId: string): void {
    const tableRows = this.tableData();
    if (tableRows.length === 0) {
      this.snackbarService.showError('Please add at least one unit to skip.');
      return;
    }

    const batchId = this.byBatchForm.get('testBatchId')?.value;
    const batchReason = this.byBatchForm.get('reason')?.value;

    if (batchId && !batchReason) {
      this.snackbarService.showError('Reason code is required when using batch mode.');
      return;
    }

    this.isProcessing.set(true);
    const request: SkipUnitsRequestDto = {
      contractId,
      batchId: batchId || undefined,
      reasonCode: batchReason || undefined,
      units: tableRows.map((row) => ({
        unitId: row.unitId,
        collDate: row.collDateIso || '',
        reasonCode: row.reason,
      })),
    };

    this.apiService
      .skipUnits(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isProcessing.set(false);
          if (response.success) {
            this.snackbarService.showSuccess('Transaction is successfully committed');
            this.clearAll();
          } else {
            this.snackbarService.showError(response.message || 'Failed to skip units');
          }
        },
        error: (error) => {
          this.isProcessing.set(false);
          const body = error?.error;
          const errorMessage =
            body?.errorResponse?.error || body?.message || error?.message || 'Failed to skip units. Please try again.';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  private saveReset(contractId: string): void {
    const selectedRows = this.resetSelectedRows();
    if (selectedRows.length === 0) {
      this.snackbarService.showError('Please select at least one unit to reset.');
      return;
    }

    const reasonCode = this.resetForm.get('reason')?.value;
    if (!reasonCode) {
      this.snackbarService.showError('Please select a reset reason.');
      return;
    }

    this.isProcessing.set(true);
    const request: ResetUnitsRequestDto = {
      contractId,
      reasonCode,
      units: selectedRows.map((row) => ({
        unitId: row.unitId,
        collDate: row.collDateIso || '',
      })),
    };

    this.apiService
      .resetUnits(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isProcessing.set(false);
          if (response.success) {
            this.snackbarService.showSuccess('Transaction is successfully committed');
            this.clearAll();
          } else {
            this.snackbarService.showError(response.message || 'Failed to reset units');
          }
        },
        error: (error) => {
          this.isProcessing.set(false);
          const body = error?.error;
          const errorMessage =
            body?.errorResponse?.error || body?.message || error?.message || 'Failed to reset units. Please try again.';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  private formatDate(value: string): string {
    if (!value) return '';
    // Datetime strings (contain 'T') are stored in GMT — convert to chapter local before formatting
    const parsed = value.includes('T')
      ? this.chapterTimezoneService.convertGmtToLocal(moment.utc(value))
      : moment(value, 'YYYY-MM-DD');
    return parsed.isValid() ? parsed.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  get s() { return this.searchForm.controls; }
  get b() { return this.byBatchForm.controls; }
  get u() { return this.byUnitsForm.controls; }
  get r() { return this.resetForm.controls; }
}
