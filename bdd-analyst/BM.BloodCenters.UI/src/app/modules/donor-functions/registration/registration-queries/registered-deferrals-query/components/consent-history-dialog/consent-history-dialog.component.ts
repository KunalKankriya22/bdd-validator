import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DataTable } from 'src/app/shared/components/data-table/data-table';
import { DataTableConfig } from 'src/app/shared/interfaces/data-table.interface';
import { ConsentHistoryDto, ConsentHistoryQueryDto } from 'src/app/modules/donor-functions/registered-donations-query/consent-history/models/consent-history.model';
import { ConsentHistoryService } from 'src/app/modules/donor-functions/registered-donations-query/consent-history/services/consent-history.service';

export interface ConsentHistoryDialogData {
  donorId: string;
  deferralId?: string;
}

@Component({
  selector: 'app-consent-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './consent-history-dialog.component.html',
  styleUrls: ['./consent-history-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsentHistoryDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ConsentHistoryDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly data = inject<ConsentHistoryDialogData>(MAT_DIALOG_DATA);
  private readonly consentHistoryService = inject(ConsentHistoryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly donorId = this.data.donorId;
  readonly deferralId = this.data.deferralId;

  // State signals
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly consentRecords = signal<ConsentHistoryDto[]>([]);

  // Computed
  readonly hasData = computed(() => this.consentRecords().length > 0);

  // Table configuration
  readonly tableConfig: DataTableConfig<ConsentHistoryDto> = {
    columns: [
      { key: 'chapterId', header: 'Chp', width: '80px' },
      { key: 'unitId', header: 'Unit ID', width: '120px' },
      { key: 'deferralId', header: 'Deferrals ID', width: '150px' },
      { key: 'collDate', header: 'Collection Date', width: '140px' },
      { key: 'letterCode', header: 'Letter Code', width: '120px' },
      { key: 'signatureDate', header: 'Signature Date', width: '140px' },
      { key: 'witness', header: 'Witness', width: '150px' },
      { key: 'status', header: 'Status', width: '100px' }
    ],
    rowActions: [
      {
        icon: 'visibility',
        action: 'viewDetail',
        ariaLabel: 'View consent detail'
      }
    ],
    showPagination: true,
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100]
    },
    stickyHeader: true
  };

  ngOnInit(): void {
    this.loadConsentHistory();
  }

  loadConsentHistory(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const query: ConsentHistoryQueryDto = {
      donorId: this.donorId,
      deferralId: this.deferralId
    };

    this.consentHistoryService
      .queryConsentHistory(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.data && response.data.length >= 0) {
            this.consentRecords.set(response.data);
          } else {
            this.error.set(response.message || 'Failed to load consent history');
            this.consentRecords.set([]);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set('An error occurred while loading consent history');
          this.consentRecords.set([]);
        }
      });
  }

  retryLoad(): void {
    this.loadConsentHistory();
  }

  onRowAction(event: { action: string; row: ConsentHistoryDto }): void {
    if (event.action === 'viewDetail') {
      this.openConsentDetail(event.row);
    }
  }

  private async openConsentDetail(consent: ConsentHistoryDto): Promise<void> {
    try {
      const { ConsentDetailDialogComponent } = await import(
        'src/app/modules/donor-functions/registered-donations-query/consent-history/components/consent-detail-dialog/consent-detail-dialog.component'
      );

      this.dialog.open(ConsentDetailDialogComponent, {
        panelClass: 'consent-detail-right-dialog',
        width: '800px',
        maxWidth: '100vw',
        height: '100vh',
        position: { right: '0' },
        data: {
          donorId: consent.donorId,
          transactionId: consent.transactionId,
          letterId: consent.letterId
        },
        disableClose: true,
        autoFocus: false
      });
    } catch (err) {
      this.error.set('Failed to load consent detail component');
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
