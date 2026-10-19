import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import moment from 'moment';

import { SamplePackDto, SamplePackTubeDto } from '../models/tube-checkin-shipment.model';
import { TubeCheckinShipmentService } from '../services/tube-checkin-shipment.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface PrintPackListDialogData {
  boxId: string;
  box: SamplePackDto;
}

@Component({
  selector: 'app-print-pack-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="print-pack-list-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Print Pack List</h2>
        <button
          mat-icon-button
          class="close-button"
          (click)="onClose()"
          aria-label="Close dialog">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div *ngIf="isLoading" class="loading-container" role="status" aria-live="polite" aria-busy="true">
        <mat-spinner diameter="40" aria-label="Loading pack list"></mat-spinner>
        <p>Loading pack list...</p>
      </div>

      <div *ngIf="!isLoading" mat-dialog-content class="dialog-content">
        <p>Click the Print button below to print the pack list for Box ID: <strong>{{ data.box.boxId }}</strong></p>
        <p class="info-text">This will open a print preview with {{ tubes.length }} unit(s) and {{ totalTubeCount }} tube(s).</p>
      </div>

      <div *ngIf="!isLoading" mat-dialog-actions class="dialog-actions">
        <button type="button" mat-button (click)="onClose()">
          Cancel
        </button>
        <button type="button" mat-raised-button color="primary" (click)="onPrint()">
          <mat-icon aria-hidden="true">print</mat-icon>
          Print
        </button>
      </div>
    </div>
  `,
  styles: [`
    .print-pack-list-dialog {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      min-width: 500px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .dialog-header .close-button {
      margin-right: -12px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      gap: 16px;
    }

    .loading-container p {
      margin: 0;
      color: #666;
    }

    .dialog-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .dialog-content p {
      margin: 0 0 12px 0;
      font-size: 14px;
      line-height: 1.5;
    }

    .dialog-content .info-text {
      color: #666;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }

    .dialog-actions button mat-icon {
      margin-right: 4px;
    }
  `],
})
export class PrintPackListDialogComponent implements OnInit {
  private readonly tubeCheckinService = inject(TubeCheckinShipmentService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialogRef = inject(MatDialogRef<PrintPackListDialogComponent>);

  isLoading = true;
  tubes: SamplePackTubeDto[] = [];
  currentDate = new Date();

  constructor(@Inject(MAT_DIALOG_DATA) public data: PrintPackListDialogData) {}

  ngOnInit(): void {
    this.loadTubes();
  }

  private loadTubes(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    this.tubeCheckinService.getBoxUnits(this.data.boxId, chapterId).subscribe({
      next: (tubes) => {
        this.tubes = tubes;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackbarService.showError('Failed to load tubes for printing');
      },
    });
  }

  onPrint(): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.snackbarService.showError('Please allow popups to print');
      return;
    }

    const printContent = this.generatePrintHtml();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private formatDate(date: Date | string | null): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY') : '-';
  }

  private getExtractTypeLabel(extractType: string): string {
    const labels: Record<string, string> = {
      'V': 'Viral Marker',
      'N': 'NAT',
      'B': 'Both',
    };
    return labels[extractType] || extractType;
  }

  private getDonorTypeLabel(donorType: string): string {
    const labels: Record<string, string> = {
      'I': 'First Time',
      'R': 'Repeat',
      'O': 'Others',
    };
    return labels[donorType] || donorType;
  }

  get redTopCount(): number {
    return this.tubes.filter(t => t.redTubeFlag === 'Y').length;
  }

  get purpleTop1Count(): number {
    return this.tubes.filter(t => t.purpleTubeFlag === 'Y').length;
  }

  get purpleTop2Count(): number {
    return this.tubes.filter(t => t.purpleTube2Flag === 'Y').length;
  }

  get totalTubeCount(): number {
    return this.redTopCount + this.purpleTop1Count + this.purpleTop2Count;
  }

  get uniqueUnitCount(): number {
    return this.tubes.length;
  }

  private generatePrintHtml(): string {
    const box = this.data.box;
    const rows = this.tubes.map((tube, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="font-family: 'Courier New', monospace; font-weight: 500;">${tube.unitId}</td>
        <td style="text-align: center;">${tube.redTubeFlag === 'Y' ? 'R1' : '-'}</td>
        <td style="text-align: center;">${tube.purpleTubeFlag === 'Y' ? 'P1' : '-'}</td>
        <td style="text-align: center;">${tube.purpleTube2Flag === 'Y' ? 'P2' : '-'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tube Shipment Pack List - Box ${box.boxId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .header h1 {
              font-size: 22px;
              margin: 0 0 8px 0;
              font-weight: 600;
            }
            .header .print-date {
              font-size: 12px;
              color: #666;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              margin: 0 0 12px 0;
              padding-bottom: 8px;
              border-bottom: 1px solid #e0e0e0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .info-item {
              display: flex;
              gap: 8px;
            }
            .info-label {
              font-weight: 600;
              min-width: 120px;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            .summary-section {
              background: #f5f5f5;
              padding: 16px;
              border: 1px solid #333;
              margin-bottom: 25px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
            .summary-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              font-weight: 500;
            }
            .summary-value {
              font-size: 20px;
              font-weight: 600;
              color: #1976d2;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background: #f5f5f5;
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
              border-bottom: 2px solid #333;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #ddd;
            }
            .footer {
              margin-top: 60px;
              padding-top: 24px;
              border-top: 1px solid #333;
              page-break-inside: avoid;
            }
            .signature-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 24px;
              gap: 32px;
            }
            .signature-line span {
              flex: 1;
              font-size: 13px;
              color: #666;
              border-bottom: 1px solid #333;
              padding-bottom: 4px;
            }
            @media print {
              body {
                margin: 0;
                padding: 15px;
              }
              .section, .summary-section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tube Shipment Pack List</h1>
            <div class="print-date">Printed: ${this.formatDate(this.currentDate)}</div>
          </div>

          <div class="section">
            <h2 class="section-title">Box Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Box ID:</span>
                <span class="info-value">${box.boxId}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Collection Date:</span>
                <span class="info-value">${this.formatDate(box.collDate)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Extract Type:</span>
                <span class="info-value">${this.getExtractTypeLabel(box.extractType)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Donor Type:</span>
                <span class="info-value">${this.getDonorTypeLabel(box.donorType)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Destination:</span>
                <span class="info-value">${box.destinationCode}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">${box.status || 'Closed'}</span>
              </div>
            </div>
          </div>

          <div class="summary-section">
            <h2 class="section-title">Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Unique Units:</span>
                <span class="summary-value">${this.uniqueUnitCount}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Total Tubes:</span>
                <span class="summary-value">${this.totalTubeCount}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Red Top (R1):</span>
                <span class="summary-value">${this.redTopCount}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Purple Top 1 (P1):</span>
                <span class="summary-value">${this.purpleTop1Count}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Purple Top 2 (P2):</span>
                <span class="summary-value">${this.purpleTop2Count}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Tube Details</h2>
            ${this.tubes.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">#</th>
                    <th>Unit ID</th>
                    <th style="text-align: center;">Red Top (R1)</th>
                    <th style="text-align: center;">Purple Top 1 (P1)</th>
                    <th style="text-align: center;">Purple Top 2 (P2)</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            ` : '<p style="text-align: center; padding: 40px; color: #999; font-style: italic;">No tubes in this box.</p>'}
          </div>

          <div class="footer">
            <div class="signature-line">
              <span>Prepared by: _______________________________</span>
              <span>Date: _______________________________</span>
            </div>
            <div class="signature-line">
              <span>Verified by: _______________________________</span>
              <span>Date: _______________________________</span>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
