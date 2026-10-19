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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { UppercaseDatePipe } from '@shared/pipes/uppercase-date.pipe';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import {
  PlateControlsQueryService,
  PlateControlDto,
  TestIdDto,
  TestBatchIdDto,
} from './plate-controls-query.service';

const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

function getPlateControlsPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Rows per page:';
  return intl;
}

@Component({
  selector: 'app-plate-controls-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule,
    UppercaseDatePipe,
  ],
  templateUrl: './plate-controls-query.html',
  styleUrls: ['./plate-controls-query.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MatPaginatorIntl, useFactory: getPlateControlsPaginatorIntl }],
})
export class PlateControlsQueryComponent implements OnInit, OnDestroy {
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly service = inject(PlateControlsQueryService);
  private readonly cdr = inject(ChangeDetectorRef);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  filterForm = new FormGroup({
    testId: new FormControl<string | null>(null, Validators.required),
    testBatchId: new FormControl<string | null>(null),
  });

  private testIdOptionsSrc = signal<TestIdDto[]>([]);
  private batchIdOptionsSrc = signal<TestBatchIdDto[]>([]);

  get testIdOptions(): TestIdDto[] { return this.testIdOptionsSrc(); }
  get batchIdOptions(): TestBatchIdDto[] { return this.batchIdOptionsSrc(); }

  testIdSearchCtrl = new FormControl('');
  batchIdSearchCtrl = new FormControl('');

  private testIdSearchTerm = signal('');
  private batchIdSearchTerm = signal('');

  readonly filteredTestIds = computed(() => {
    const search = this.testIdSearchTerm().toLowerCase();
    const opts = this.testIdOptionsSrc();
    if (!search) return opts;
    return opts.filter(o =>
      o.testId.toLowerCase().includes(search) ||
      (o.testDesc ?? '').toLowerCase().includes(search)
    );
  });

  readonly filteredBatchIds = computed(() => {
    const search = this.batchIdSearchTerm().toLowerCase();
    const opts = this.batchIdOptionsSrc();
    if (!search) return opts;
    return opts.filter(o =>
      o.tbId.toLowerCase().includes(search) ||
      (o.testDesc ?? '').toLowerCase().includes(search)
    );
  });

  isLoading = false;
  hasRetrieved = false;

  pagedData: PlateControlDto[] = [];
  pageSizeOptions = PAGE_SIZES;
  pageSize = DEFAULT_PAGE_SIZE;
  pageIndex = 0;
  totalCount = 0;

  sortColumn = 'tbId';
  sortDir: 'asc' | 'desc' | 'default' = 'desc';
  sortAnnouncement = '';

  getSortIcon(column: string): string {
    if (this.sortColumn !== column || this.sortDir === 'default') return 'unfold_more';
    return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn === column && this.sortDir !== 'default';
  }

  get isClearDisabled(): boolean {
    const { testId, testBatchId } = this.filterForm.value;
    return !testId && !testBatchId && !this.hasRetrieved;
  }

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
    this.subscribeToTestIdChanges();
    this.subscribeToTestBatchIdChanges();
    this.subscribeToChapterChanges();
    this.testIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.testIdSearchTerm.set(v ?? ''));
    this.batchIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.batchIdSearchTerm.set(v ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTestIds(): void {
    this.service.getTestIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.testIdOptionsSrc.set(res.data ?? []);
          this.cdr.markForCheck();
        },
      });
  }

  private subscribeToTestIdChanges(): void {
    this.filterForm.get('testId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((testId: string | null) => {
        this.batchIdOptionsSrc.set([]);
        this.batchIdSearchCtrl.setValue('', { emitEvent: false });
        this.batchIdSearchTerm.set('');
        this.filterForm.get('testBatchId')!.setValue(null, { emitEvent: false });
        if (testId) {
          this.loadBatchIds(testId);
          this.pageIndex = 0;
          this.fetchPage();
        } else {
          this.pagedData = [];
          this.totalCount = 0;
          this.hasRetrieved = false;
        }
        this.cdr.markForCheck();
      });
  }

  private subscribeToTestBatchIdChanges(): void {
    this.filterForm.get('testBatchId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.filterForm.get('testId')!.value) {
          this.pageIndex = 0;
          this.fetchPage();
        }
      });
  }

  private loadBatchIds(testId: string): void {
    this.service.getTestBatchIds(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.batchIdOptionsSrc.set(res.data ?? []);
          this.cdr.markForCheck();
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadTestIds();
      });
  }

  toggleSort(column: string): void {
    if (!this.hasRetrieved) return;
    if (this.sortColumn !== column) {
      this.sortColumn = column;
      this.sortDir = 'desc';
    } else {
      if (this.sortDir === 'default') this.sortDir = 'desc';
      else if (this.sortDir === 'desc') this.sortDir = 'asc';
      else this.sortDir = 'default';
    }
    this.sortAnnouncement = this.sortDir === 'default'
      ? 'Sort cleared'
      : `Table sorted by Test Batch ID, ${this.sortDir === 'asc' ? 'ascending' : 'descending'}`;
    this.pageIndex = 0;
    this.fetchPage();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.fetchPage();
  }

  private fetchPage(): void {
    const testId = this.filterForm.get('testId')!.value;
    if (!testId) return;

    const tbId = this.filterForm.get('testBatchId')!.value || null;

    this.isLoading = true;
    this.hasRetrieved = true;
    this.cdr.markForCheck();

    this.service.query({
      testId,
      tbId,
      take: this.pageSize,
      skip: this.pageIndex * this.pageSize,
      sortColumn: 'TbId',
      sortOrder: this.sortDir === 'asc' ? 'ASC' : 'DESC',
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.pagedData = res.data ?? [];
          this.totalCount = res.total ?? 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.pagedData = [];
          this.totalCount = 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  clearAll(): void {
    this.filterForm.reset();
    this.testIdSearchCtrl.setValue('', { emitEvent: false });
    this.batchIdSearchCtrl.setValue('', { emitEvent: false });
    this.testIdSearchTerm.set('');
    this.batchIdSearchTerm.set('');
    this.batchIdOptionsSrc.set([]);
    this.pagedData = [];
    this.totalCount = 0;
    this.pageIndex = 0;
    this.sortColumn = 'tbId';
    this.sortDir = 'desc';
    this.hasRetrieved = false;
    this.cdr.markForCheck();
  }
}
