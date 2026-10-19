import { Component, OnInit, OnDestroy, ChangeDetectorRef, effect, ViewChild, ElementRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { LabBatchTransferService } from './services/lab-batch-transfer.service';

type TransferState = 'ready' | 'processing' | 'completed';

@Component({
  selector: 'app-lab-batch-transfer',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './lab-batch-transfer.html',
  styleUrls: ['./lab-batch-transfer.scss']
})
export class LabBatchTransferComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dialog: MatDialog;
  private readonly labBatchTransferService: LabBatchTransferService;
  private readonly headerService: HeaderService;
  private readonly pageHeaderService: PageHeaderService;
  private readonly snackbarService: SnackbarService;
  private readonly cdr: ChangeDetectorRef;

  private resetTimerId: ReturnType<typeof setTimeout> | null = null;

  headerConfig!: PageHeaderConfig;
  transferState: TransferState = 'ready';
  processStartTime: string | null = null;
  processEndTime: string | null = null;

  @ViewChild('transferButton', { read: ElementRef }) private transferButton!: ElementRef<HTMLButtonElement>;

  constructor(
    dialog: MatDialog,
    labBatchTransferService: LabBatchTransferService,
    headerService: HeaderService,
    pageHeaderService: PageHeaderService,
    snackbarService: SnackbarService,
    cdr: ChangeDetectorRef
  ) {
    this.dialog = dialog;
    this.labBatchTransferService = labBatchTransferService;
    this.headerService = headerService;
    this.pageHeaderService = pageHeaderService;
    this.snackbarService = snackbarService;
    this.cdr = cdr;

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
    this.initializeConfig();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.clearResetTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTransferClick(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      disableClose: true,
      panelClass: 'batch-transfer-dialog',
      data: {
        title: 'Start Batch Transfer',
        message: 'This action will transfer all eligible labeled products from Lab to Distribution. Do you want to continue?',
        confirmText: 'START TRANSFER',
        cancelText: 'CANCEL'
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result === true) {
        this.executeTransfer();
      }
    });
  }

  private executeTransfer(): void {
    this.transferState = 'processing';

    this.labBatchTransferService.executeBatchTransfer()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.processStartTime = this.formatDateTime(response.data.processStartTime);
            this.processEndTime = this.formatDateTime(response.data.processEndTime);
            this.transferState = 'completed';
            this.snackbarService.showSuccess('Batch transfer completed successfully');
            this.scheduleReset();
          }
        },
        error: () => {
          this.transferState = 'ready';
          this.snackbarService.showError('Batch transfer failed');
          this.scheduleReset();
        }
      });
  }

  private formatDateTime(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

  private initializeConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: 'Check-In from Lab - Batch Process',
      subtitle: ''
    };
  }

  private scheduleReset(): void {
    this.clearResetTimer();
    this.resetTimerId = setTimeout(() => {
      this.transferState = 'ready';
      this.processStartTime = null;
      this.processEndTime = null;
      this.cdr.detectChanges();
      this.transferButton?.nativeElement?.focus();
    }, 10000);
  }

  private clearResetTimer(): void {
    if (this.resetTimerId) {
      clearTimeout(this.resetTimerId);
      this.resetTimerId = null;
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearResetTimer();
        this.transferState = 'ready';
        this.processStartTime = null;
        this.processEndTime = null;
      });
  }
}
