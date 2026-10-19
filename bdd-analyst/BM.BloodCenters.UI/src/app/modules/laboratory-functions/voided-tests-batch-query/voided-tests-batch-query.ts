import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { PageHeaderService } from '../../../shared/services/page-header.service';
import { HeaderService } from '../../../shared/services/header.service';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { VoidedTestsBatchQueryService } from './services/voided-tests-batch-query.service';
import {
  BatchIdLookupDto,
  TestIdLookupDto,
  VoidedTestResultDto,
} from './models/voided-tests-batch-query.model';

@Component({
  selector: 'app-voided-tests-batch-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './voided-tests-batch-query.html',
  styleUrl: './voided-tests-batch-query.scss',
})
export class VoidedTestsBatchQueryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly service = inject(VoidedTestsBatchQueryService);

  @ViewChild('batchIdSelect') batchIdSelect?: MatSelect;
  @ViewChild('testIdSelect') testIdSelect?: MatSelect;

  headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      return {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
      };
    }
    return {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: '',
    };
  });

  tbIdControl = new FormControl<BatchIdLookupDto | null>(null, Validators.required);
  testIdControl = new FormControl<TestIdLookupDto | null>({ value: null, disabled: true }, Validators.required);

  batchSearchControl = new FormControl('');
  testSearchControl = new FormControl('');

  allBatchIds = signal<BatchIdLookupDto[]>([]);
  allTestIds = signal<TestIdLookupDto[]>([]);

  filteredBatchIds = computed(() => {
    const q = (this.batchSearchControl.value || '').toLowerCase();
    const all = this.allBatchIds();
    return q ? all.filter(o => o.tbId?.toLowerCase().includes(q)) : all;
  });

  filteredTestIds = computed(() => {
    const q = (this.testSearchControl.value || '').toLowerCase();
    const all = this.allTestIds();
    return q ? all.filter(o => o.testId?.toLowerCase().includes(q)) : all;
  });

  isLoadingBatchIds = false;
  isLoadingTestIds = false;
  isLoading = false;
  hasSearched = false;
  hasError = false;

  dataSource: VoidedTestResultDto[] = [];

  tableConfig: DataTableConfig<VoidedTestResultDto> = {
    columns: [
      { key: 'displayUnitId', header: 'Unit ID' },
      { key: 'resultStatus', header: 'Result' },
      { key: 'resultDats', header: 'Result Date and Time' },
      { key: 'voidReasonCode', header: 'Void Reason' },
      { key: 'voidDats', header: 'Void Date and Time' },
      { key: 'voidUserId', header: 'Voided By' },
    ],
    emptyMessage: 'No Voided Tests Available To Display',
    noDataIcon: 'search',
    enableRowHighlight: false,
    showActionsAsMenu: false,
  };

  readonly selectPanelLoadingValue = '__loading__';
  readonly selectPanelEmptyValue = '__empty__';

  compareBatchId = (a: BatchIdLookupDto, b: BatchIdLookupDto): boolean =>
    !!a && !!b && a.tbId === b.tbId;

  compareTestId = (a: TestIdLookupDto, b: TestIdLookupDto): boolean =>
    !!a && !!b && a.testId === b.testId;

  get isRetrieveDisabled(): boolean {
    return this.isLoading || !this.tbIdControl.valid || !this.testIdControl.valid;
  }

  get isClearAllDisabled(): boolean {
    return !this.tbIdControl.value && !this.testIdControl.value && !this.hasSearched;
  }

  constructor() {
    effect(() => {
      this.filteredBatchIds();
      this.filteredTestIds();
      setTimeout(() => {
        [this.batchIdSelect, this.testIdSelect].forEach(s => {
          if (s?.panelOpen) {
            (s as any)._keyManager?.setActiveItem(1);
          }
        });
      });
    });
  }

  ngOnInit(): void {
    this.loadBatchIds();
    this.setupCascadingDropdown();
    this.setupSearchControls();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelectOpened(opened: boolean, select: MatSelect): void {
    if (opened) {
      select._keyManager?.setActiveItem(-1);
    }
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;

    const tbId = this.tbIdControl.value!.tbId;
    const testId = this.testIdControl.value!.testId;

    this.isLoading = true;
    this.hasSearched = true;
    this.hasError = false;

    this.service
      .search({ tbId, testId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.isLoading = false;
          this.dataSource = data;
        },
        error: () => {
          this.isLoading = false;
          this.dataSource = [];
        },
      });
  }

  onClearAll(): void {
    this.tbIdControl.reset(null, { emitEvent: false });
    this.testIdControl.reset(null, { emitEvent: false });
    this.testIdControl.disable({ emitEvent: false });
    this.batchSearchControl.reset('', { emitEvent: false });
    this.testSearchControl.reset('', { emitEvent: false });
    this.allTestIds.set([]);
    this.hasSearched = false;
    this.hasError = false;
    this.dataSource = [];
  }

  private loadBatchIds(): void {
    this.isLoadingBatchIds = true;
    this.service
      .getBatchIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allBatchIds.set(data);
          this.isLoadingBatchIds = false;
        },
        error: () => {
          this.allBatchIds.set([]);
          this.isLoadingBatchIds = false;
        },
      });
  }

  private loadTestIds(tbId: string): void {
    this.isLoadingTestIds = true;
    this.service
      .getTestIds(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allTestIds.set(data);
          this.isLoadingTestIds = false;
        },
        error: () => {
          this.allTestIds.set([]);
          this.isLoadingTestIds = false;
        },
      });
  }

  private setupCascadingDropdown(): void {
    this.tbIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selected) => {
        this.testIdControl.setValue(null, { emitEvent: false });
        this.testSearchControl.setValue('', { emitEvent: false });
        this.allTestIds.set([]);

        if (selected) {
          this.testIdControl.enable({ emitEvent: false });
          this.loadTestIds(selected.tbId);
        } else {
          this.testIdControl.disable({ emitEvent: false });
        }
      });
  }

  private setupSearchControls(): void {
    this.batchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allBatchIds.update(v => [...v]));

    this.testSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.allTestIds.update(v => [...v]));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.tbIdControl.reset(null, { emitEvent: false });
        this.testIdControl.reset(null, { emitEvent: false });
        this.testIdControl.disable({ emitEvent: false });
        this.batchSearchControl.reset('', { emitEvent: false });
        this.testSearchControl.reset('', { emitEvent: false });
        this.allBatchIds.set([]);
        this.allTestIds.set([]);
        this.hasSearched = false;
        this.hasError = false;
        this.dataSource = [];
        this.loadBatchIds();
      });
  }
}
