import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, EMPTY, startWith } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { InterimResultsQueryApiService } from './services/interim-results-query-api.service';
import {
  InterimContractOption,
  InterimTestOption,
  InterimCodeOption,
  InterimBatchOption,
  InterimResultRecord,
  InterimResultDisplay,
  InterimResultsQueryRequest
} from './models/interim-results-query.model';

@Component({
  selector: 'app-interim-results-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  templateUrl: './interim-results-query.html',
  styleUrl: './interim-results-query.scss'
})
export class InterimResultsQuery implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `interim-results-query-${InterimResultsQuery.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(InterimResultsQueryApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  private readonly defaultTitle = 'Interim Results Query';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: 'Interim Results Query',
    subtitle: 'Description goes here',
    actions: []
  };

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Dropdown data
  protected readonly contracts = signal<InterimContractOption[]>([]);
  protected readonly contractsLoading = signal<boolean>(false);
  protected readonly contractDescription = signal<string>('');
  protected readonly selectedContractId = signal<string>('');

  protected readonly tests = signal<InterimTestOption[]>([]);
  protected readonly testsLoading = signal<boolean>(false);

  protected readonly interimCodes = signal<InterimCodeOption[]>([]);
  protected readonly interimCodesLoading = signal<boolean>(false);
  protected readonly selectedInterimCode = signal<string>('');

  protected readonly batches = signal<InterimBatchOption[]>([]);
  protected readonly batchesLoading = signal<boolean>(false);

  // Search controls for searchable dropdowns
  contractSearchCtrl = new FormControl('');
  contractSearchSignal = toSignal(this.contractSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  testSearchCtrl = new FormControl('');
  testSearchSignal = toSignal(this.testSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  interimSearchCtrl = new FormControl('');
  interimSearchSignal = toSignal(this.interimSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  batchSearchCtrl = new FormControl('');
  batchSearchSignal = toSignal(this.batchSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  // Filtered dropdown options
  filteredContracts = computed(() => {
    const searchTerm = this.contractSearchSignal()?.toLowerCase() || '';
    const options = this.contracts();
    if (!searchTerm) return options;
    return options.filter(o =>
      o.contractId.toLowerCase().includes(searchTerm) ||
      o.company.toLowerCase().includes(searchTerm)
    );
  });

  filteredTests = computed(() => {
    const searchTerm = this.testSearchSignal()?.toLowerCase() || '';
    const options = this.tests();
    if (!searchTerm) return options;
    return options.filter(o =>
      o.testId.toLowerCase().includes(searchTerm) ||
      o.testDescription.toLowerCase().includes(searchTerm)
    );
  });

  filteredInterimCodes = computed(() => {
    const searchTerm = this.interimSearchSignal()?.toLowerCase() || '';
    const options = this.interimCodes();
    if (!searchTerm) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(searchTerm) ||
      o.codeDescription.toLowerCase().includes(searchTerm)
    );
  });

  selectedContractTooltip = computed(() => {
    const id = this.selectedContractId();
    if (!id) return '';
    const match = this.contracts().find(c => c.contractId === id);
    return match ? `${match.contractId} - ${match.company}` : '';
  });

  selectedInterimCodeTooltip = computed(() => {
    const code = this.selectedInterimCode();
    if (!code) return '';
    const match = this.interimCodes().find(c => c.code === code);
    return match ? `${match.code} - ${match.codeDescription}` : '';
  });

  filteredBatches = computed(() => {
    const searchTerm = this.batchSearchSignal()?.toLowerCase() || '';
    const options = this.batches();
    if (!searchTerm) return options;
    return options.filter(o => o.batchId.toLowerCase().includes(searchTerm));
  });

  // Results data
  protected readonly allResults = signal<InterimResultRecord[]>([]);
  protected readonly unitCount = signal<number>(0);

  protected readonly displayResults = computed<InterimResultDisplay[]>(() => {
    return this.allResults().map(r => ({
      ...r,
      unitIdDisplay: r.checkDigit ? `${r.unitId}-${r.checkDigit}` : r.unitId,
      extractedFlagDisplay: r.extractFlag === 'Y' || r.extractFlag === 'Yes' ? 'Yes' : r.extractFlag === 'N' || r.extractFlag === 'No' ? 'No' : r.extractFlag || '-',
      firstExtractDateFormatted: this.formatDate(r.firstExtractDate),
      lastExtractDateFormatted: this.formatDate(r.lastExtractDate)
    }));
  });

  protected readonly resultCount = computed(() => this.displayResults().length);

  protected readonly showEmptyState = computed(() => !this.hasSearched() && !this.loading());
  protected readonly showNoResults = computed(() => this.hasSearched() && this.allResults().length === 0 && !this.loading());

  searchForm!: FormGroup;

  // Data table config
  tableConfig!: DataTableConfig<InterimResultDisplay>;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null }
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || ''
        };
      }
    });

    effect(() => {
      const count = this.resultCount();
      if (this.tableConfig) {
        this.updateUnitIdColumnHeader(count);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.initTableConfig();
    this.loadContracts();
    this.loadInterimCodes();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      contractId: ['', [Validators.required, Validators.maxLength(9)]],
      testId: [''],
      interimCode: [''],
      batchId: ['', [Validators.required, Validators.maxLength(14)]]
    });
  }

  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'unitIdDisplay', header: 'Unit ID', sortable: false, width: '170px' },
        { key: 'testId', header: 'Test ID', sortable: false, width: '80px' },
        { key: 'testSeqNo', header: 'Test Sequence', sortable: false, width: '100px' },
        { key: 'extractedFlagDisplay', header: 'Extracted Flag', sortable: false, width: '110px' },
        { key: 'firstExtractDateFormatted', header: 'First Extract Date', sortable: false, width: '140px' },
        { key: 'lastExtractDateFormatted', header: 'Last Extract Date', sortable: false, width: '140px' },
        { key: 'resultCode', header: 'Interim Result Code', sortable: false, width: '130px' },
        { key: 'resultDescription', header: 'Description', sortable: false }
      ],
      enableRowHighlight: true,
      showPagination: false,
      emptyMessage: 'No results found',
      showTableOnEmpty: true
    };
  }

  private updateUnitIdColumnHeader(count: number): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableConfig.columns.map(col =>
        col.key === 'unitIdDisplay'
          ? { ...col, header: count > 0 ? `Unit ID (${count})` : 'Unit ID' }
          : col
      )
    };
  }

  private loadContracts(): void {
    this.contractsLoading.set(true);
    this.apiService.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.contracts.set(data);
          this.contractsLoading.set(false);
        },
        error: () => {
          this.contractsLoading.set(false);
          this.snackbarService.showError('Failed to load contracts');
        }
      });
  }

  private loadInterimCodes(): void {
    this.interimCodesLoading.set(true);
    this.apiService.getInterimCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.interimCodes.set(data);
          this.interimCodesLoading.set(false);
        },
        error: () => {
          this.interimCodesLoading.set(false);
          this.snackbarService.showError('Failed to load interim codes');
        }
      });
  }

  private loadTestsForContract(contractId: string): void {
    this.testsLoading.set(true);
    this.tests.set([]);
    this.apiService.getTestsForContract(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tests.set(data);
          this.testsLoading.set(false);
        },
        error: () => {
          this.testsLoading.set(false);
          this.snackbarService.showError('Failed to load tests');
        }
      });
  }

  private loadBatches(): void {
    const contractId = this.searchForm.get('contractId')?.value;
    if (!contractId) return;

    const testId = this.searchForm.get('testId')?.value || null;
    const interimCode = this.searchForm.get('interimCode')?.value || null;

    this.batchesLoading.set(true);
    this.batches.set([]);
    this.apiService.getBatchesForContract(contractId, testId, interimCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.batches.set(data);
          this.batchesLoading.set(false);
        },
        error: () => {
          this.batchesLoading.set(false);
          this.snackbarService.showError('Failed to load batches');
        }
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleChapterChange());
  }

  private handleChapterChange(): void {
    this.onClearAll();
    this.loadContracts();
    this.loadInterimCodes();
  }

  get f() {
    return this.searchForm.controls;
  }

  isFormEmpty(): boolean {
    const values = this.searchForm.value;
    return !values.contractId && !values.testId && !values.interimCode && !values.batchId;
  }

  onFieldBlur(fieldName: string): void {
    const control = this.searchForm.get(fieldName);
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  onContractSelected(contractId: string): void {
    const contract = this.contracts().find(c => c.contractId === contractId);
    this.contractDescription.set(contract ? `${contract.company} (${contract.centerId})` : '');
    this.selectedContractId.set(contractId || '');

    // Reset dependent fields
    this.searchForm.patchValue({ testId: '', batchId: '' });
    this.tests.set([]);
    this.batches.set([]);
    this.testSearchCtrl.setValue('');
    this.batchSearchCtrl.setValue('');

    if (contractId) {
      this.loadTestsForContract(contractId);
      this.loadBatches();
    }
  }

  onTestIdChanged(): void {
    this.searchForm.patchValue({ batchId: '' });
    this.batchSearchCtrl.setValue('');
    this.loadBatches();
  }

  onInterimCodeChanged(): void {
    this.selectedInterimCode.set(this.searchForm.get('interimCode')?.value || '');
    this.searchForm.patchValue({ batchId: '' });
    this.batchSearchCtrl.setValue('');
    this.loadBatches();
  }

  onRetrieve(): void {
    this.submitted.set(true);
    this.searchForm.markAllAsTouched();

    if (this.searchForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) (firstInvalid as HTMLElement).focus();
      return;
    }

    const formValue = this.searchForm.value;
    const request: InterimResultsQueryRequest = {
      contractId: formValue.contractId,
      testId: formValue.testId || null,
      interimCode: formValue.interimCode || null,
      batchId: formValue.batchId,
      take: 100,
      skip: 0
    };

    this.loading.set(true);
    this.error.set(null);

    this.apiService.queryResults(request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.loading.set(false);
          const errorMessage = err.error?.errorResponse?.error || err.error?.message || 'Failed to retrieve results';
          this.error.set(errorMessage);
          this.snackbarService.showError(errorMessage);
          return EMPTY;
        })
      )
      .subscribe(response => {
        this.allResults.set(response.data || []);
        this.unitCount.set(response.total || 0);
        this.hasSearched.set(true);
        this.loading.set(false);
      });
  }

  onClearAll(): void {
    this.searchForm.reset();
    this.searchForm.markAsPristine();
    this.searchForm.markAsUntouched();
    Object.keys(this.searchForm.controls).forEach(key => {
      this.searchForm.get(key)?.setErrors(null);
    });
    this.contractDescription.set('');
    this.contractSearchCtrl.setValue('');
    this.testSearchCtrl.setValue('');
    this.interimSearchCtrl.setValue('');
    this.batchSearchCtrl.setValue('');
    this.selectedInterimCode.set('');
    this.selectedContractId.set('');
    this.submitted.set(false);
    this.hasSearched.set(false);
    this.error.set(null);
    this.allResults.set([]);
    this.unitCount.set(0);
    this.tests.set([]);
    this.batches.set([]);
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }
}
