import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  TemplateRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, startWith } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { InterimResultApiService } from './services/interim-result-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { CancelConfirmDialogComponent } from './cancel-confirm-dialog/cancel-confirm-dialog.component';
import {
  ContractLookupDto,
  TestLookupDto,
  BatchLookupDto,
  InterimCodeLookupDto,
  UnitGridRowModel,
  QueryUnitsRequestDto,
  SaveInterimResultsRequestDto,
  InterimResultItemDto
} from './models/interim-result.model';

@Component({
  selector: 'app-enter-interim-result-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  templateUrl: './enter-interim-result-code.component.html',
  styleUrls: ['./enter-interim-result-code.component.scss']
})
export class EnterInterimResultCodeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(InterimResultApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('interimResultCellTemplate', { static: false })
  interimResultCellTemplate!: TemplateRef<any>;

  @ViewChild('descriptionCellTemplate', { static: false })
  descriptionCellTemplate!: TemplateRef<any>;

  @ViewChild('contractSelect') contractSelectRef!: MatSelect;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadingContracts = signal(false);
  protected readonly loadingTests = signal(false);
  protected readonly loadingBatches = signal(false);
  protected readonly loadingInterimCodes = signal(false);

  protected readonly contracts = signal<ContractLookupDto[]>([]);
  protected readonly tests = signal<TestLookupDto[]>([]);
  protected readonly batches = signal<BatchLookupDto[]>([]);
  protected readonly interimCodes = signal<InterimCodeLookupDto[]>([]);

  protected readonly units = signal<UnitGridRowModel[]>([]);
  protected readonly hasRetrievedData = signal(false);
  protected readonly selectedContractDescription = signal<string>('');

  protected readonly unitCount = computed(() => this.units().length);

  // Search controls for searchable dropdowns
  contractSearchCtrl = new FormControl('');
  contractSearchSignal = toSignal(this.contractSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  testSearchCtrl = new FormControl('');
  testSearchSignal = toSignal(this.testSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  interimSearchCtrl = new FormControl('');
  interimSearchSignal = toSignal(this.interimSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  batchSearchCtrl = new FormControl('');
  batchSearchSignal = toSignal(this.batchSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  gridInterimSearchCtrl = new FormControl('');
  gridInterimSearchSignal = toSignal(this.gridInterimSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  // Filtered dropdown options
  filteredContracts = computed(() => {
    const term = this.contractSearchSignal()?.toLowerCase() || '';
    const options = this.contracts();
    if (!term) return options;
    return options.filter(o =>
      o.contractId.toLowerCase().includes(term) ||
      o.company.toLowerCase().includes(term)
    );
  });

  filteredTests = computed(() => {
    const term = this.testSearchSignal()?.toLowerCase() || '';
    const options = this.tests();
    if (!term) return options;
    return options.filter(o =>
      o.testId.toLowerCase().includes(term) ||
      o.testDescription.toLowerCase().includes(term)
    );
  });

  filteredInterimCodes = computed(() => {
    const term = this.interimSearchSignal()?.toLowerCase() || '';
    const options = this.interimCodes();
    if (!term) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(term) ||
      o.codeDescription.toLowerCase().includes(term)
    );
  });

  filteredBatches = computed(() => {
    const term = this.batchSearchSignal()?.toLowerCase() || '';
    const options = this.batches();
    if (!term) return options;
    return options.filter(o => o.batchId.toLowerCase().includes(term));
  });

  filteredGridInterimCodes = computed(() => {
    const term = this.gridInterimSearchSignal()?.toLowerCase() || '';
    const options = this.interimCodes();
    if (!term) return options;
    return options.filter(o =>
      o.code.toLowerCase().includes(term) ||
      o.codeDescription.toLowerCase().includes(term)
    );
  });

  // Tooltip signals — updated on selection change
  protected readonly selectedContractTooltip = signal('');
  protected readonly selectedInterimTooltip = signal('');


  form!: FormGroup;
  tableConfig!: DataTableConfig<UnitGridRowModel>;
  private originalUnits: UnitGridRowModel[] = [];

  get f() {
    return this.form.controls;
  }

  get isRetrieveDisabled(): boolean {
    return !this.f['contractId'].value || !this.f['batchId'].value || this.loading();
  }

  get isClearAllDisabled(): boolean {
    const v = this.form.getRawValue();
    const hasValues = v.contractId || v.testId || v.interim || v.batchId;
    return !hasValues && !this.hasRetrievedData();
  }

  get canCopyInterim(): boolean {
    return !!this.f['interim'].value && this.units().length > 0;
  }

  hasUnsavedChanges(): boolean {
    return this.units().some(u => u.isDirty);
  }

  get canSave(): boolean {
    return this.units().length > 0 &&
      this.units().some(u => u.resultCode && u.resultCode.trim() !== '') &&
      !this.saving();
  }

  constructor() {
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
    this.initForm();
    this.loadContracts();
    this.loadInterimCodes();
    this.setupFormListeners();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.initTableConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      contractId: [null, [Validators.required]],
      testId: [null],
      interim: [null],
      batchId: [null, [Validators.required]]
    });
  }

  private setupFormListeners(): void {
    this.form.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractId: string | null) => this.onContractChange(contractId));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadContracts();
        this.loadInterimCodes();
      });
  }

  private onContractChange(contractId: string | null): void {
    this.form.patchValue({ testId: null, batchId: null });
    this.testSearchCtrl.setValue('');
    this.batchSearchCtrl.setValue('');
    this.gridInterimSearchCtrl.setValue('');
    this.units.set([]);
    this.hasRetrievedData.set(false);
    this.selectedContractDescription.set('');
    this.tests.set([]);
    this.batches.set([]);

    if (!contractId) {
      this.selectedContractTooltip.set('');
      return;
    }

    const contract = this.contracts().find(c => c.contractId === contractId);
    if (contract) {
      this.selectedContractDescription.set(contract.company);
      this.selectedContractTooltip.set(`${contract.contractId} - ${contract.company}`);
      this.loadTests(contractId);
      this.loadBatches(contractId);
    }
  }

  onInterimFilterChanged(): void {
    const code = this.f['interim'].value;
    if (!code) {
      this.selectedInterimTooltip.set('');
      return;
    }
    const match = this.interimCodes().find(c => c.code === code);
    this.selectedInterimTooltip.set(match ? `${match.code} - ${match.codeDescription}` : '');
  }

  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'unitId',
          header: `Unit ID (${this.unitCount()})`,
          sortable: true,
          width: '200px',
          valueFormatter: (value: string, row: UnitGridRowModel) =>
            row.checkDigit ? `${value}-${row.checkDigit}` : value
        },
        { key: 'testId', header: 'Test ID', sortable: false, width: '168px' },
        { key: 'testSeqNo', header: 'Test Sequence', sortable: false, type: 'number', width: '168px' },
        {
          key: 'resultCode',
          header: 'Interim Result',
          sortable: false,
          width: '250px',
          cellTemplate: this.interimResultCellTemplate
        },
        {
          key: 'resultDescription',
          header: 'Description',
          sortable: false,
          cellTemplate: this.descriptionCellTemplate
        }
      ],
      stickyHeader: true,
      enableSelection: false,
      enableRowHighlight: false,
      emptyMessage: 'No units found for the selected criteria'
    };
  }

  private updateTableHeader(): void {
    if (!this.tableConfig) return;
    const cols = [...this.tableConfig.columns];
    cols[0] = { ...cols[0], header: `Unit ID (${this.unitCount()})` };
    this.tableConfig = { ...this.tableConfig, columns: cols };
  }

  // LOV Loading — errors handled by auth interceptor snackbar
  private loadContracts(): void {
    this.loadingContracts.set(true);
    this.apiService.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.contracts.set(data); this.loadingContracts.set(false); },
        error: () => { this.loadingContracts.set(false); }
      });
  }

  private loadTests(contractId: string): void {
    this.loadingTests.set(true);
    this.apiService.getTests(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.tests.set(data); this.loadingTests.set(false); },
        error: () => { this.loadingTests.set(false); }
      });
  }

  private loadBatches(contractId: string): void {
    this.loadingBatches.set(true);
    this.apiService.getBatches(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.batches.set(data); this.loadingBatches.set(false); },
        error: () => { this.loadingBatches.set(false); }
      });
  }

  private loadInterimCodes(): void {
    this.loadingInterimCodes.set(true);
    this.apiService.getInterimCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.interimCodes.set(data); this.loadingInterimCodes.set(false); },
        error: () => { this.loadingInterimCodes.set(false); }
      });
  }

  // User Actions
  onRetrieve(): void {
    const request: QueryUnitsRequestDto = {
      contractId: this.form.get('contractId')?.value,
      batchId: this.form.get('batchId')?.value,
      testId: this.form.get('testId')?.value || null,
      chapterId: this.headerService.getCurrentChapterId() || ''
    };

    this.loading.set(true);

    this.apiService.queryUnits(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const gridData: UnitGridRowModel[] = data.map(unit => ({
            ...unit,
            resultCode: unit.resultCode || '',
            resultDescription: unit.resultDescription || '',
            isDirty: false,
            originalResultCode: unit.resultCode || ''
          }));
          this.units.set(gridData);
          this.originalUnits = [...gridData];
          this.hasRetrievedData.set(true);
          this.loading.set(false);
          this.updateTableHeader();
        },
        error: (err) => {
          this.loading.set(false);
        }
      });
  }

  onCopyInterim(): void {
    const interimValue = this.form.get('interim')?.value;
    if (!interimValue || this.units().length === 0) return;

    const interimCode = this.interimCodes().find(c => c.code === interimValue);
    const description = interimCode?.codeDescription || '';

    this.units.set(this.units().map(unit => {
      if (!unit.resultCode || unit.resultCode.trim() === '') {
        return { ...unit, resultCode: interimValue, resultDescription: description, isDirty: true };
      }
      return unit;
    }));
  }

  onSave(): void {
    const results: InterimResultItemDto[] = this.units()
      .filter(u => u.resultCode && u.resultCode.trim() !== '')
      .map(u => ({
        unitId: u.unitId, testId: u.testId, testSeqNo: u.testSeqNo,
        collDate: u.collDate, resultCode: u.resultCode
      }));

    if (results.length === 0) return;

    const request: SaveInterimResultsRequestDto = {
      contractId: this.form.get('contractId')?.value,
      batchId: this.form.get('batchId')?.value,
      chapterId: this.headerService.getCurrentChapterId() || '',
      results
    };

    this.saving.set(true);
    this.apiService.saveInterimResults(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.snackbarService.showSuccess(response.message);
          this.units.set([]);
          this.hasRetrievedData.set(false);
          this.form.reset();
          this.contractSearchCtrl.setValue('');
          this.testSearchCtrl.setValue('');
          this.interimSearchCtrl.setValue('');
          this.batchSearchCtrl.setValue('');
          this.gridInterimSearchCtrl.setValue('');
          this.selectedContractDescription.set('');
          this.selectedContractTooltip.set('');
          this.selectedInterimTooltip.set('');
          this.tests.set([]);
          this.batches.set([]);
          this.updateTableHeader();
          setTimeout(() => {
            this.contractSelectRef?.focus();
          });
        },
        error: (err) => {
          this.saving.set(false);
        }
      });
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      const dialogRef = this.dialog.open(CancelConfirmDialogComponent, {
        width: '464px',
        disableClose: true,
        panelClass: 'cancel-confirm-dialog'
      });
      dialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(confirmed => { if (confirmed) this.clearGrid(); });
    } else {
      this.clearGrid();
    }
  }

  onClearAll(): void {
    this.form.reset();
    this.contractSearchCtrl.setValue('');
    this.testSearchCtrl.setValue('');
    this.interimSearchCtrl.setValue('');
    this.batchSearchCtrl.setValue('');
    this.gridInterimSearchCtrl.setValue('');

    this.units.set([]);
    this.originalUnits = [];
    this.hasRetrievedData.set(false);
    this.selectedContractDescription.set('');
    this.selectedContractTooltip.set('');
    this.selectedInterimTooltip.set('');
    this.tests.set([]);
    this.batches.set([]);
  }

  // Grid interim result change handler (mat-select based)
  onInterimResultChange(row: UnitGridRowModel, newValue: string): void {
    const interimCode = this.interimCodes().find(c => c.code === newValue);
    const description = interimCode?.codeDescription || '';
    const isDirty = newValue !== (row.originalResultCode || '');

    this.units.set(this.units().map(u =>
      (u.unitId === row.unitId && u.testId === row.testId && u.testSeqNo === row.testSeqNo)
        ? { ...u, resultCode: newValue, resultDescription: description, isDirty }
        : u
    ));
  }

  // Sort handler
  onSortChange(event: TableSortEvent): void {
    const { column, direction } = event;
    if (direction === 'default') {
      this.units.set([...this.originalUnits.map(orig => {
        const current = this.units().find(u =>
          u.unitId === orig.unitId && u.testId === orig.testId && u.testSeqNo === orig.testSeqNo
        );
        return current || orig;
      })]);
      this.tableConfig = { ...this.tableConfig, sortConfig: { column, direction } };
      return;
    }
    const sorted = [...this.units()].sort((a, b) => {
      const valA = (a as any)[column] ?? '';
      const valB = (b as any)[column] ?? '';
      const cmp = String(valA).localeCompare(String(valB));
      return direction === 'A' ? cmp : -cmp;
    });
    this.units.set(sorted);
    this.tableConfig = { ...this.tableConfig, sortConfig: { column, direction } };
  }

  private clearGrid(): void {
    this.units.set([]);
    this.hasRetrievedData.set(false);
    this.updateTableHeader();
  }
}
