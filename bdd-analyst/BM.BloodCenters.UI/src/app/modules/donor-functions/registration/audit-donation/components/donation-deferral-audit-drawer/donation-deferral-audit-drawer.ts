import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { DonationDeferralAuditService } from '../../services/donation-deferral-audit.service';
import {
  DonationDeferralAuditDto,
  DonationDeferralAuditDrawerData,
} from '../../models/donation-deferral-audit.model';
import { HeaderService } from '@shared/services/header.service';
import { convertUTCToTimezone } from '@shared/date/timezone.util';

@Component({
  selector: 'app-donation-deferral-audit-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './donation-deferral-audit-drawer.html',
  styleUrls: ['./donation-deferral-audit-drawer.scss'],
})
export class DonationDeferralAuditDrawerComponent implements OnInit, OnDestroy {
  private readonly auditService = inject(DonationDeferralAuditService);
  private readonly headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  loading = false;
  auditData: DonationDeferralAuditDto | null = null;
  errorMessage: string | null = null;

  selectedTabIndex = 0;
  selectedHealthHistoryIndex = 0;
  selectedPhysicalFindingIndex = 0;

  healthHistoryColumns: string[] = [
    'question',
    'response',
    'answer',
    'description',
    'startDate',
    'endDate',
    'interdictionCode',
    'incident',
    'deferredThroughDate',
  ];

  physicalFindingsColumns: string[] = [
    'physicalCode',
    'description',
    'value',
    'interdictionCode',
    'interdictionDescription',
  ];

  constructor(
    public dialogRef: MatDialogRef<DonationDeferralAuditDrawerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DonationDeferralAuditDrawerData,
  ) {}

  ngOnInit(): void {
    this.loadAuditDetails();
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

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  selectHealthHistoryRow(index: number): void {
    this.selectedHealthHistoryIndex = index;
  }

  selectPhysicalFindingRow(index: number): void {
    this.selectedPhysicalFindingIndex = index;
  }

  get selectedComment(): string {
    if (!this.auditData) return '';
    if (this.selectedTabIndex === 0) {
      const item = this.auditData.healthHistory?.[this.selectedHealthHistoryIndex];
      return item?.comments?.trim() || '';
    }
    const item = this.auditData.physicalFindings?.[this.selectedPhysicalFindingIndex];
    return item?.comments?.trim() || '';
  }

  formatValue(value: string | number | null | undefined): string {
    if (value == null) return '---';
    const str = String(value).trim();
    return str || '---';
  }

  formatDate(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '---';
    const chapterTz = this.headerService.chapterTimeZone();
    const date = chapterTz ? convertUTCToTimezone(dateStr as string, chapterTz) : new Date(dateStr as string);
    if (isNaN(date.getTime())) return '---';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  formatDateTime(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '---';
    const chapterTz = this.headerService.chapterTimeZone();
    const date = chapterTz ? convertUTCToTimezone(dateStr as string, chapterTz) : new Date(dateStr as string);
    if (isNaN(date.getTime())) return '---';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()} ${hours}:${minutes}`;
  }

  formatResponse(value: string | null | undefined): string {
    if (!value) return '---';
    const v = value.trim().toUpperCase();
    if (v === 'Y') return 'Yes';
    if (v === 'N') return 'No';
    return value.trim() || '---';
  }

  formatSignature(signatureFlag: string | null | undefined): string {
    if (!signatureFlag) return '---';
    const flag = signatureFlag.toUpperCase();
    return flag === 'Y' ? 'Yes' : flag === 'N' ? 'No' : flag;
  }

  get hasHealthHistory(): boolean {
    return (this.auditData?.healthHistory?.length ?? 0) > 0;
  }

  get hasPhysicalFindings(): boolean {
    return (this.auditData?.physicalFindings?.length ?? 0) > 0;
  }

  private loadAuditDetails(): void {
    if (!this.data?.transactionId) {
      this.errorMessage = 'Transaction ID is required';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.auditService
      .getAuditDetails(this.data.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.auditData = data;
          this.selectedHealthHistoryIndex = 0;
          this.selectedPhysicalFindingIndex = 0;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message ||
            'An error occurred while retrieving audit details. Please try again.';
          this.loading = false;
        },
      });
  }
}
