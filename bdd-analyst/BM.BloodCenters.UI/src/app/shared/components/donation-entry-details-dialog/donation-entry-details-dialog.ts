import { Component, ElementRef, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { DonationEntryDetailsService } from '@shared/services/donation-entry-details.service';
import {
  DonationEntryDetailsData,
  DonationEntryDetailsWithDonor,
  DonationDetails,
  DonorInfo,
} from '@shared/models/donation-entry-details.model';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';
import { HeaderService } from '@shared/services/header.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';

@Component({
  selector: 'app-donation-entry-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './donation-entry-details-dialog.html',
  styleUrls: ['./donation-entry-details-dialog.scss'],
})
export class DonationEntryDetailsDialogComponent implements OnInit, OnDestroy {
  private readonly entryDetailsService = inject(DonationEntryDetailsService);
  private readonly altDialog = inject(MatDialog);
  private readonly elRef = inject(ElementRef);
  private readonly headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  loading = false;

  donationDetails: DonationDetails = {};
  donorInfo: DonorInfo = {};

  constructor(
    public dialogRef: MatDialogRef<DonationEntryDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DonationEntryDetailsData,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBack(): void {
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close('closeAll');
  }

  openAlternateDemographics(): void {
    const donorId = this.donorInfo.donorId;
    if (!donorId) return;

    this.toggleDialogVisibility(false);

    const dialogData: AlternateDemographicsDialogData = {
      donorId: String(donorId),
      readOnly: false,
    };

    this.altDialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: dialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === 'closeAll') {
          this.dialogRef.close();
        } else {
          this.toggleDialogVisibility(true);
        }
      });
  }

  private toggleDialogVisibility(visible: boolean): void {
    const overlayPane = this.elRef.nativeElement.closest('.cdk-overlay-pane');
    const wrapper = overlayPane?.closest('.cdk-global-overlay-wrapper');
    const backdrop = wrapper?.previousElementSibling;

    const display = visible ? '' : 'none';
    if (wrapper) wrapper.style.display = display;
    if (backdrop?.classList.contains('cdk-overlay-backdrop')) {
      backdrop.style.display = display;
    }
  }

  formatValue(value: string | number | null | undefined): string {
    if (value == null) return '---';
    const str = String(value).trim();
    return str || '---';
  }

  formatPhone(areaCode?: string, phone?: string, ext?: string): string {
    if (!areaCode || !phone) return '---';
    let formatted = `(${areaCode}) ${phone}`;
    if (ext) formatted += ` ext ${ext}`;
    return formatted;
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '---';
    const timezone = this.headerService.getCurrentChapterTimezone() || 'UTC';
    const date = convertUTCToTimezone(dateStr, timezone);
    if (isNaN(date.getTime())) return '---';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  private loadData(): void {
    this.loading = true;
    this.entryDetailsService
      .getEntryDetails(this.data.unitId, this.data.collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.donationDetails = data?.donationDetails || {};
          this.donorInfo = data?.donorInfo || {};
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
