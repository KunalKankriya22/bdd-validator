import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SnackbarService } from '@shared/services/snackbar.service';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import jsPDF from 'jspdf';
import { DonorCommunication, LetterDetails } from '../../../../models/notification-log.interface';
import { NotificationLogService } from '../../../../services/notification-log.service';

export interface LetterDialogData {
  communication: DonorCommunication;
  donorId: string;
}

@Component({
  selector: 'app-letter-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './letter-dialog.html',
  styleUrls: ['./letter-dialog.scss'],
})
export class LetterDialogComponent implements OnInit, OnDestroy {
  private notificationLogService = inject(NotificationLogService);
  private snackbarService = inject(SnackbarService);
  private destroy$ = new Subject<void>();

  // Converted to signals for consistency
  loading = signal(false);
  reprinting = signal(false);
  showModifiedBanner = signal(false);
  letterDetails = signal<LetterDetails | null>(null);
  noLetterFound = signal(false);

  constructor(
    public dialogRef: MatDialogRef<LetterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LetterDialogData
  ) {}

  ngOnInit(): void {
    this.loadLetterDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLetterDetails(): void {
    const letterId = this.data.communication.letterId;
    if (!letterId) {
      console.error('No letter ID provided');
      return;
    }

    this.loading.set(true);

    this.notificationLogService.getLetterDetails(this.data.donorId, letterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.letterDetails.set(details);
          this.showModifiedBanner.set(details?.modifyIndicator === 'Y');
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load letter details:', error);

          // Check if error response indicates no letter found (404)
          if (error?.status === 404 || error?.error?.statusCode === 404 ||
              error?.error?.message?.includes('No letter found')) {
            this.noLetterFound.set(true);
          }

          this.loading.set(false);
        }
      });
  }

  dismissBanner(): void {
    this.showModifiedBanner.set(false);
  }

  /**
   * Reprint the currently displayed notification letter
   *
   * Flow:
   * 1. Validates letter ID and content exist
   * 2. Calls backend API (POST /api/v1/donors/notification-logs/{donorId}/letter/{letterSeqNo}/reprint)
   * 3. Backend updates LAST_REPRINTED_BY and LAST_REPRINTED_ON in DONOR_LETTERS table
   * 4. Receives updated LetterDetails with new reprint metadata (timezone-converted dates)
   * 5. Updates UI with new metadata (reprintBy, reprintName, reprintOn)
   * 6. Generates PDF using jsPDF and opens in new tab
   * 7. Shows success snackbar
   *
   * Backend API Response:
   * - 200: Returns updated NotificationLogsLetterModel with reprintBy, reprintName, reprintOn
   * - 404: Letter not found (interceptor handles error display)
   * - 500: Server error (interceptor handles error display)
   */
  onReprint(): void {
    if (this.reprinting()) return; // Prevent double-click

    const letterId = this.data.communication.letterId;
    if (!letterId) {
      console.error('No letter ID available for reprint');
      this.snackbarService.showError('Cannot reprint: Letter ID not found.');
      return;
    }

    const currentDetails = this.letterDetails();
    if (!currentDetails?.letterText) {
      console.error('No letter text available for reprint');
      this.snackbarService.showError('Cannot reprint: Letter content not found.');
      return;
    }

    this.reprinting.set(true);

    // Call backend reprint API (empty POST - auth from headers)
    this.notificationLogService.reprintLetter(this.data.donorId, letterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedDetails) => {
          if (updatedDetails) {
            // Update UI with new reprint metadata from backend
            // (reprintBy, reprintName, reprintOn are updated by backend)
            this.letterDetails.set(updatedDetails);
            this.showModifiedBanner.set(updatedDetails.modifyIndicator === 'Y');

            // Generate PDF from letter text and open in new tab
            this.generatePdf(updatedDetails.letterText);

            // Show success notification (matches backend message)
            this.snackbarService.showSuccess('Letter reprinted successfully.');
          }
          this.reprinting.set(false);
        },
        error: (error) => {
          console.error('Reprint failed:', error);
          // Fallback error message (backend interceptor handles specific error display)
          this.snackbarService.showError('Failed to reprint letter. Please try again.');
          this.reprinting.set(false);
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const momentDate = moment(dateStr);
    return DateFieldValidationUtility.formatDateTimeForUI(momentDate);
  }

  formatName(name: string | undefined): string {
    if (!name || name.trim() === ',') return '-';
    return name;
  }

  get dialogTitle(): string {
    // letterId from API is already formatted (e.g., "LSQ0545603")
    const letterId = this.data.communication.letterId || 'Unknown';
    return `Display Notification Letter - ${letterId}`;
  }

  /**
   * Generate PDF from letter text and open in new browser tab
   *
   * Replicates Oracle Forms behavior (run_letter_report) using client-side PDF generation.
   * Pattern copied from send-letter-dialog.ts for consistency.
   *
   * PDF Settings:
   * - Format: US Letter (portrait)
   * - Font: Courier 10pt (monospace for letter formatting)
   * - Margins: 15mm
   * - Line height: 5mm
   * - Auto text wrapping for long lines (prevents text overflow)
   * - Auto page breaks when content exceeds page height
   *
   * @param text - Letter text content (newline-separated)
   */
  private generatePdf(text: string): void {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      pdf.setFont('courier');
      pdf.setFontSize(10);

      const lines = text.split('\n');
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const lineHeight = 5;
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2); // Available width for text
      let yPosition = margin;

      lines.forEach((line) => {
        // Split long lines with automatic wrapping
        const wrappedLines = pdf.splitTextToSize(line, maxWidth);

        wrappedLines.forEach((wrappedLine: string) => {
          // Check if we need a new page
          if (yPosition + lineHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(wrappedLine, margin, yPosition);
          yPosition += lineHeight;
        });
      });

      // Open PDF in new tab (browser handles print dialog if user wants to print)
      const blobUrl = pdf.output('bloburl');
      window.open(blobUrl.toString(), '_blank');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      this.snackbarService.showError('Failed to generate PDF.');
    }
  }
}
