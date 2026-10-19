import { Component, OnInit, OnDestroy, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ReleaseStandingOrdersBatchApiService } from './services/release-standing-orders-batch-api.service';
import {
  ReleaseStandingOrdersBatchRequestDto,
  ReleaseStandingOrdersBatchResponseDto,
  GeneratedOrderDto,
  FailedOrderDto,
  ORDER_STATUS_MAP,
  WEEK_DAY_MAP,
} from './models/release-standing-orders-batch.model';

@Component({
  selector: 'app-release-standing-orders-batch',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './release-standing-orders-batch.html',
  styleUrl: './release-standing-orders-batch.scss',
})
export class ReleaseStandingOrdersBatchComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `release-standing-orders-batch-${ReleaseStandingOrdersBatchComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  isLoading = signal<boolean>(false);
  batchResult = signal<ReleaseStandingOrdersBatchResponseDto | null>(null);
  error = signal<string | null>(null);
  liveRegionMessage = signal<string>('');

  hasBatchResult = computed(() => this.batchResult() !== null);

  generatedOrdersCount = computed(() => this.batchResult()?.generatedOrders?.length || 0);

  failedOrdersCount = computed(() => this.batchResult()?.failedOrders?.length || 0);

  processedCount = computed(() => this.batchResult()?.processedCount || 0);

  weekDay = computed(() => this.batchResult()?.weekDay || '');

  weekDayDisplay = computed(() => {
    const day = this.weekDay();
    return WEEK_DAY_MAP[day] || day;
  });

  processedAt = computed(() => this.batchResult()?.processedAt || '');

  hasGeneratedOrders = computed(() => this.generatedOrdersCount() > 0);
  hasFailedOrders = computed(() => this.failedOrdersCount() > 0);

  showEmptyState = computed(() => this.hasBatchResult() && this.batchResult()?.processedCount === 0);

  private destroy$ = new Subject<void>();

  constructor(
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private apiService: ReleaseStandingOrdersBatchApiService,
    private dialog: MatDialog,
    private chapterTimezoneService: ChapterTimezoneService
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle,
        };
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearResults();
    });
  }

  onProcessBatch(): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Release All Standby Orders',
      message: 'Are you sure you want to release all standby orders?',
      detail: 'This will process and allocate all pending standby orders in the batch.',
      confirmText: 'YES, RELEASE ALL ORDERS',
      cancelText: 'NO, GO BACK',
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '450px',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
      if (confirmed) {
        this.executeBatch();
      }
    });
  }

  private executeBatch(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const request: ReleaseStandingOrdersBatchRequestDto = {
      includeReports: true,
      previewOnly: false,
    };

    this.apiService
      .processBatch(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading.set(false);
          this.batchResult.set(result);

          if (result.processedCount === 0) {
            const msg = 'No standing orders found for today';
            this.liveRegionMessage.set(msg);
            this.snackbarService.showError(msg);
          } else if (result.failedOrders.length > 0) {
            const message = `Released ${result.processedCount} standing order${result.processedCount !== 1 ? 's' : ''}, ${result.failedOrders.length} failed`;
            this.liveRegionMessage.set(message);
            this.snackbarService.showSuccess(message);
          } else {
            const message = `Successfully released ${result.processedCount} standing order${result.processedCount !== 1 ? 's' : ''}`;
            this.liveRegionMessage.set(message);
            this.snackbarService.showSuccess(message);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMessage = HttpErrorHandler.extractErrorMessage(err, 'Failed to process standing orders');
          this.error.set(errorMessage);
          this.liveRegionMessage.set(`Error: ${errorMessage}`);
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  clearResults(): void {
    this.batchResult.set(null);
    this.error.set(null);
  }

  getOrderStatusDisplay(status: string): string {
    return ORDER_STATUS_MAP[status] || status;
  }

  formatDateTime(dateTime: string | null | undefined): string {
    if (!dateTime) return '-';
    const utc = moment.utc(dateTime);
    if (!utc.isValid()) return '-';
    const local = this.chapterTimezoneService.convertGmtToLocal(utc);
    return local.format('DD-MMM-YYYY HH:mm:ss').toUpperCase();
  }

  trackByOrderNo(_index: number, item: GeneratedOrderDto): string {
    return item.orderNo;
  }

  trackByContractId(_index: number, item: FailedOrderDto): string {
    return `${item.contractId}-${item.customerId}-${item.consigneeId}`;
  }
}
