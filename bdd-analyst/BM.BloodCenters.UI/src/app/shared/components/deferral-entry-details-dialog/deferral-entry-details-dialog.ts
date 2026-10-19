import { Component, ElementRef, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, map } from 'rxjs';

import { DeferralEntryDetailsService } from '@shared/services/deferral-entry-details.service';
import {
  DeferralEntryDetailsDialogData,
  DeferralEntryDetailsDto,
  DonorInformationDto,
  AddressDto,
  PhoneDto,
  EmployerDto,
} from '@shared/models/deferral-entry-details.model';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';

/**
 * Deferral Entry Details Dialog Component (DRWDEFRL)
 * Read-only dialog displaying comprehensive deferral entry and donor information
 *
 * Opens from: Donation entry screens, deferral lists, donor profile
 * Data Source: API /api/deferral-entry-details/{donorId}/{driveDate}
 * Features:
 * - Display donor demographics (name, DOB, contact info)
 * - Display deferral information (type, reason, dates)
 * - Open alternate demographics dialog
 */
@Component({
  selector: 'app-deferral-entry-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: './deferral-entry-details-dialog.html',
  styleUrls: ['./deferral-entry-details-dialog.scss'],
})
export class DeferralEntryDetailsDialogComponent implements OnInit, OnDestroy {
  private readonly service = inject(DeferralEntryDetailsService);
  private readonly altDialog = inject(MatDialog);
  private readonly elRef = inject(ElementRef);
  private destroy$ = new Subject<void>();

  loading = false;

  // Main deferral entry data
  deferralEntry: DeferralEntryDetailsDto = {} as DeferralEntryDetailsDto;

  // Convenience accessors for template
  get donorInfo(): DonorInformationDto {
    return this.deferralEntry?.donorInfo || {};
  }

  get address(): AddressDto {
    return this.donorInfo?.address || {};
  }

  get homePhone(): PhoneDto {
    return this.donorInfo?.homePhone || {};
  }

  get dayPhone(): PhoneDto {
    return this.donorInfo?.dayPhone || {};
  }

  get mobilePhone(): PhoneDto {
    return this.donorInfo?.mobilePhone || {};
  }

  get employer(): EmployerDto {
    return this.donorInfo?.employer || {};
  }

  constructor(
    public dialogRef: MatDialogRef<DeferralEntryDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeferralEntryDetailsDialogData
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Close the dialog
   */
  onBack(): void {
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close('closeAll');
  }

  /**
   * Format a value for display (handles null/empty values)
   */
  formatValue(value: string | number | null | undefined): string {
    if (value == null) return '---';
    const str = String(value).trim();
    return str || '---';
  }

  /**
   * Format phone number for display
   * @param areaCode - Phone area code
   * @param phone - Phone number
   * @param ext - Extension (optional)
   * @returns Formatted phone string like "(555) 123-4567" or "(555) 123-4567 ext 101"
   */
  formatPhone(areaCode?: string, phone?: string, ext?: string): string {
    if (!areaCode || !phone) return '---';
    let formatted = `(${areaCode}) ${phone}`;
    if (ext) formatted += ` ext ${ext}`;
    return formatted;
  }

  /**
   * Format phone using PhoneDto object
   */
  formatPhoneDto(phoneDto?: PhoneDto | null): string {
    if (!phoneDto) return '---';
    // Use formattedPhone if available, otherwise format manually
    if (phoneDto.formattedPhone) return phoneDto.formattedPhone;
    return this.formatPhone(phoneDto.areaCode || undefined, phoneDto.phoneNo || undefined, phoneDto.extension || undefined);
  }

  /**
   * Format date to DD-MON-YYYY format (e.g., 12-MAR-2026)
   * @param dateStr - ISO date string
   * @returns Formatted date string
   */
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '---';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  openAlternateDemographics(): void {
    const donorId = this.deferralEntry.donorId;
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

  isPreferredPhone(phoneType: 'home' | 'day' | 'mobile'): boolean {
    const flag = this.donorInfo?.preferredContactFlag;
    if (!flag) return false;
    const upper = flag.toUpperCase();
    if (phoneType === 'home') return upper === 'H';
    if (phoneType === 'day') return upper === 'D' || upper === 'W';
    if (phoneType === 'mobile') return upper === 'M' || upper === 'C';
    return false;
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

  /**
   * Load deferral entry details from API
   */
  private loadData(): void {
    if (!this.data.donorId) {
      this.loading = false;
      return;
    }

    this.loading = true;

    const source$ = this.data.driveDate
      ? this.service
          .getByCompositeKey(this.data.donorId, this.data.driveDate)
          .pipe(map((entry) => entry || ({} as DeferralEntryDetailsDto)))
      : this.service
          .getByDonorId(this.data.donorId, 10, 0)
          .pipe(map((response) => response.data[0] || ({} as DeferralEntryDetailsDto)));

    source$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (entry) => {
        this.deferralEntry = entry;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading deferral entry details:', error);
        this.loading = false;
      },
    });
  }
}
