import { Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { UppercaseDatePipe } from '@shared/pipes/uppercase-date.pipe';
import { UnitIdFormatUtility } from '@shared/components/unit-id-field/unit-id-format.utility';
import { DonationDetailsApiService } from '../../donor-profile/donation-details/services/donation-details-api.service';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import {
  DonorHistoryPanelData,
  DonorHistoryRecord,
} from './donor-history-panel.model';

@Component({
  selector: 'app-donor-history-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    SidePanelBase,
    UppercaseDatePipe,
  ],
  templateUrl: './donor-history-panel.html',
  styleUrls: ['./donor-history-panel.scss'],
})
export class DonorHistoryPanelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly datePipe = new UppercaseDatePipe();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly donations = signal<DonorHistoryRecord[]>([]);
  readonly selectedRow = signal<DonorHistoryRecord | null>(null);

  readonly donorName = signal('');
  readonly donorDob = signal('');
  readonly donorSex = signal('');
  readonly donorAbo = signal('');
  readonly eligibleOn = signal('');
  readonly eligibleFor = signal('');
  readonly lifetimeDonations = signal(0);
  readonly printerId = signal('');

  displayedColumns: string[] = ['collDate', 'unitId', 'cholLevel', 'bp'];

  footerButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' },
    { label: 'PRINT CARD', action: 'printCard', variant: 'primary' },
  ];

  constructor(
    public dialogRef: MatDialogRef<DonorHistoryPanelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DonorHistoryPanelData,
    private readonly donationService: DonationDetailsApiService,
    private readonly donorDetailService: DonorDetailQueryService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrinterIdChange(value: string): void {
    this.printerId.set(value);
  }

  onButtonClick(action: string): void {
    if (action === 'close') {
      this.dialogRef.close();
      return;
    }
    if (action === 'printCard') {
      window.print();
    }
  }

  onRowClick(row: DonorHistoryRecord): void {
    this.selectedRow.set(row);
  }

  isSelectedRow(row: DonorHistoryRecord): boolean {
    const selected = this.selectedRow();
    return selected !== null &&
      selected.unitId === row.unitId &&
      selected.collDate === row.collDate;
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      donorHeader: this.donationService.getDonorHeader(this.data.donorId),
      donations: this.donationService.getDonationDetails(this.data.donorId, 1000, 0, {}),
      donorDetail: this.donorDetailService.getDonorDetail(this.data.donorId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ donorHeader, donations, donorDetail }) => {
          if (donorHeader?.success && donorHeader.data?.length) {
            const info = donorHeader.data[0];
            this.donorName.set((info.name ?? '').trim());
            this.donorDob.set(
              this.datePipe.transform(info.dateOfBirth, 'dd-MMM-yyyy') ?? ''
            );
            this.donorSex.set(this.mapSex(info.sex));
            this.donorAbo.set(info.abo ?? '');
          }

          if (donorDetail) {
            const stats = donorDetail.donor?.statistics;
            if (stats) {
              this.lifetimeDonations.set(stats.lifeDonations ?? 0);
            }

            const eligibility = donorDetail.eligibility;
            if (eligibility?.length) {
              const eligible = eligibility.find(e => e.status === 'Yes');
              if (eligible) {
                this.eligibleOn.set(
                  this.datePipe.transform(eligible.eligibilityDate, 'dd-MMM-yyyy') ?? ''
                );
                this.eligibleFor.set(eligible.proc ?? '');
              } else {
                const first = eligibility[0];
                this.eligibleOn.set(
                  this.datePipe.transform(first.eligibilityDate, 'dd-MMM-yyyy') ?? ''
                );
                this.eligibleFor.set(first.proc ?? '');
              }
            }

            this.printerId.set(donorDetail.donor?.address?.line1 ?? '');
          }

          if (donations?.success && donations.data) {
            const records: DonorHistoryRecord[] = donations.data.map((d: any) => ({
              collDate: this.datePipe.transform(d.collDate, 'dd-MMM-yyyy') || '-',
              unitId: d.displayUnitId || this.formatUnitId(d.unitId),
              cholLevel: d.physicalFindings?.find((pf: any) => pf.physicalCode === 'CHOL')?.physicalValue || '-',
              bp: d.physicalFindings?.find((pf: any) => pf.physicalCode === 'BP')?.physicalValue || '-',
            }));
            this.donations.set(records);

            if (records.length > 0) {
              this.selectedRow.set(records[0]);
            }
          }

          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load donor history. Please try again.');
          this.loading.set(false);
        },
      });
  }

  private mapSex(code: string | null | undefined): string {
    if (!code) return '';
    const map: Record<string, string> = { M: 'Male', F: 'Female', U: 'Unknown' };
    return map[code.toUpperCase()] || code;
  }

  private formatUnitId(unitId: string | null | undefined): string {
    if (!unitId) return '-';
    let id = unitId;
    if (id.length === 13) {
      const checkDigit = UnitIdFormatUtility.calculateISBTCheckDigit(id);
      id = id + checkDigit;
    }
    return UnitIdFormatUtility.formatCode128(id);
  }
}
