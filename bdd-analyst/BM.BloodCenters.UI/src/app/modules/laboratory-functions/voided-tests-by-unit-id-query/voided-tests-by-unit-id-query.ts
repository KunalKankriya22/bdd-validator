import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { PageHeaderService } from '../../../shared/services/page-header.service';
import { HeaderService } from '../../../shared/services/header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

import {
  UnitIdFieldWithLovComponent,
  UnitIdPostValidateEvent,
  UnitIdLovSelectedEvent,
} from './unit-id-field-with-lov/unit-id-field-with-lov.component';
import { UnitValidationResponse } from './unit-id-field-with-lov/unit-id-field-with-lov.model';
import { VoidedTestsByUnitIdQueryService } from './services/voided-tests-by-unit-id-query.service';
import {
  VoidedTestListDto,
  VoidedTestSearchDto,
  VoidedUnitLovDto,
} from './models/voided-tests-by-unit-id-query.model';

@Component({
  selector: 'app-voided-tests-by-unit-id-query',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldWithLovComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './voided-tests-by-unit-id-query.html',
  styleUrl: './voided-tests-by-unit-id-query.scss',
})
export class VoidedTestsByUnitIdQueryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('unitIdField') unitIdField!: UnitIdFieldWithLovComponent;

  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly voidedTestsService = inject(VoidedTestsByUnitIdQueryService);
  private readonly destroy$ = new Subject<void>();

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

  dataSource: VoidedTestListDto[] = [];
  isLoading = false;
  hasSearched = false;
  hasError = false;
  collectionDate = '';
  currentUnitId = '';

  lovItems = signal<VoidedUnitLovDto[]>([]);

  private take = 25;
  private skip = 0;

  requestState: VoidedTestSearchDto = {
    unitId: '',
  };

  tableConfig: DataTableConfig<VoidedTestListDto> = {
    columns: [
      { key: 'tbId', header: 'Test Batch ID' },
      { key: 'testId', header: 'Test ID' },
      { key: 'testSeqNo', header: 'Result SQ' },
      { key: 'resultStatus', header: 'Test Result Status' },
      {
        key: 'resultDateTime',
        header: 'Test Result Date and Time',
        valueFormatter: (v: string | null) => {
          if (!v) return '-';
          const m = moment(v, ['MM-DD-YYYY HH:mm', 'MM-DD-YYYY HH:mm:ss', moment.ISO_8601]);
          return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : v;
        },
      },
      { key: 'voidReasonCode', header: 'Void Reason' },
      {
        key: 'voidDateTime',
        header: 'Void Date and Time',
        valueFormatter: (v: string | null) => {
          if (!v) return '-';
          const m = moment(v, ['MM-DD-YYYY HH:mm', 'MM-DD-YYYY HH:mm:ss', moment.ISO_8601]);
          return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : v;
        },
      },
      { key: 'voidUserId', header: 'Void User' },
    ],
    pagination: {
      pageSize: 25,
      totalRecords: 0,
      pageIndex: 0,
      pageSizeOptions: [10, 25, 50, 100],
    },
    emptyMessage: 'No voided tests found for this unit.',
    noDataIcon: 'search',
    enableRowHighlight: false,
    showActionsAsMenu: false,
  };

  ngOnInit(): void {
    this.loadVoidedUnitsLov();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.unitIdField?.focus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;

    this.voidedTestsService
      .verifyUnit(parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const item = response.item;
          if (item && item.isValid) {
            this.collectionDate = item.collectionDate || '';
            event.confirm();
          } else {
            this.collectionDate = '';
            const errorMsg = item?.error?.message || response.message || 'Unit verification failed';
            event.reject(errorMsg);
          }
        },
        error: () => {
          this.collectionDate = '';
          event.reject('Unit verification failed');
        },
      });
  }

  onValidated(_event: UnitValidationResponse): void {
    this.currentUnitId = _event.parsedUnitId;
    this.requestState.unitId = this.currentUnitId;
    this.hasSearched = true;
    this.skip = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadTableData();
  }

  onUnitIdCleared(): void {
    this.collectionDate = '';
    this.currentUnitId = '';
    this.hasSearched = false;
    this.hasError = false;
    this.dataSource = [];
    this.requestState = { unitId: '' };
    this.tableConfig.pagination!.totalRecords = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.skip = 0;
  }

  onLovSelected(event: UnitIdLovSelectedEvent): void {
    const item = event.item;
    event.setDisplayValue(item.displayUnitId || item.unitId);

    this.collectionDate = item.collDate || '';
    this.currentUnitId = item.unitId;
    this.requestState.unitId = item.unitId;
    this.hasSearched = true;
    this.skip = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.loadTableData();
  }

  onClear(): void {
    this.unitIdField?.clear();
    this.collectionDate = '';
    this.currentUnitId = '';
    this.hasSearched = false;
    this.hasError = false;
    this.dataSource = [];
    this.requestState = { unitId: '' };
    this.tableConfig.pagination!.totalRecords = 0;
    this.tableConfig.pagination!.pageIndex = 0;
    this.skip = 0;
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.tableConfig.pagination!.pageIndex = event.pageIndex;
    this.tableConfig.pagination!.pageSize = event.pageSize;
    this.take = event.pageSize;
    this.skip = event.pageIndex * event.pageSize;
    this.loadTableData();
  }

  get isClearDisabled(): boolean {
    return !this.hasSearched && !this.collectionDate && !this.currentUnitId;
  }

  private loadTableData(): void {
    if (!this.requestState.unitId) return;

    this.isLoading = true;
    this.hasError = false;

    this.voidedTestsService
      .getVoidedTests(this.take, this.skip, this.requestState)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.tableConfig.pagination!.totalRecords = response.total;
        },
        error: () => {
          this.hasError = true;
          this.dataSource = [];
          this.tableConfig.pagination!.totalRecords = 0;
        },
      });
  }

  private loadVoidedUnitsLov(): void {
    this.voidedTestsService
      .getVoidedUnitsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => this.lovItems.set(items),
        error: () => this.lovItems.set([]),
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.lovItems.set([]);
        this.loadVoidedUnitsLov();
      });
  }
}
