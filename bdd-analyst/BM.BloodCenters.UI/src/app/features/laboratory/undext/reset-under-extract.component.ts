import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ResetUnderExtractService } from './services/reset-under-extract.service';
import {
  ResetUnderExtractDto,
  ResetUnderExtractRequestDto,
} from './models/reset-under-extract.model';

@Component({
  selector: 'app-reset-under-extract',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './reset-under-extract.component.html',
  styleUrls: ['./reset-under-extract.component.scss'],
})
export class ResetUnderExtractComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `reset-under-extract-${ResetUnderExtractComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly router = inject(Router);
  private readonly snackbarService = inject(SnackbarService);
  private readonly resetUnderExtractService = inject(ResetUnderExtractService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);

  readonly data = signal<ResetUnderExtractDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly resetting = signal<boolean>(false);
  readonly selectedRows = signal<ResetUnderExtractDto[]>([]);
  readonly externalSelectedIds = signal<Set<string>>(new Set());

  readonly isEmpty = computed(() => this.data().length === 0);
  readonly isReady = computed(() => !this.loading() && !this.error());

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  tableConfig: DataTableConfig<ResetUnderExtractDto> = {
    columns: [
      { key: 'resultParmId', header: 'Parm ID', sortable: false },
      { key: 'batchId', header: 'Batch ID', sortable: false },
      {
        key: 'insertDate',
        header: 'Insert Date',
        sortable: false,
        valueFormatter: (value: string | null, _row: ResetUnderExtractDto) => {
          if (!value) return '';
          const m = moment(value);
          return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
        },
      },
    ],
    enableSelection: true,
    selectionPosition: 'first',
    selectionKey: 'rowId',
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No records found eligible for reset',
    showTableOnEmpty: true,
  };

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
      }
    });
  }

  get isResetDisabled(): boolean {
    return this.selectedRows().length === 0 || this.resetting();
  }

  ngOnInit(): void {
    this.loadEligibleRecords();

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadEligibleRecords());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEligibleRecords(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedRows.set([]);
    this.externalSelectedIds.set(new Set());

    this.resetUnderExtractService
      .getEligibleRecords()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.data.set(
            response.data.map((item: ResetUnderExtractDto, index: number) => ({
              ...item,
              rowId: `${index}`,
            }))
          );
          this.loading.set(false);

          if (response.data.length === 0) {
            this.snackbarService.showInfo('No records found eligible for reset');
          }
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load eligible records');
          this.loading.set(false);
          this.snackbarService.showError(
            err.error?.message || 'Failed to load eligible records'
          );
        },
      });
  }

  onSelectionChange(rows: ResetUnderExtractDto[]): void {
    this.selectedRows.set(rows);
  }

  onCancel(): void {
    this.router.navigate(['/home']);
  }

  onReset(): void {
    if (this.isResetDisabled) return;

    const selected = this.selectedRows();

    const request: ResetUnderExtractRequestDto = {
      items: selected.map((item) => ({
        resultParmId: item.resultParmId,
        batchId: item.batchId,
      })),
    };

    this.resetting.set(true);

    this.resetUnderExtractService
      .resetFlags(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.resetting.set(false);

          if (response.success) {
            const successCount = response.data.successCount;
            this.snackbarService.showSuccess(
              `${successCount} Under Extract flag reset successfully`
            );
            this.loadEligibleRecords();
          } else {
            this.snackbarService.showError(
              response.message || 'Failed to reset records'
            );
          }
        },
        error: (err) => {
          this.resetting.set(false);
          this.snackbarService.showError(
            err.error?.message || 'Failed to reset records'
          );
        },
      });
  }

  onRetry(): void {
    this.loadEligibleRecords();
  }
}
