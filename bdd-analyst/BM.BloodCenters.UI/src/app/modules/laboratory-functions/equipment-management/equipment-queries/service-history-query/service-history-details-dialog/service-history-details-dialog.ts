import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ServiceHistoryModel } from '../models/service-history-query.model';

@Component({
  selector: 'app-service-history-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './service-history-details-dialog.html',
  styleUrls: ['./service-history-details-dialog.scss']
})
export class ServiceHistoryDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ServiceHistoryDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ServiceHistoryModel
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  formatDateTime(dateTime: Date | string | null | undefined): string {
    if (!dateTime) return '-';

    const d = new Date(dateTime);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }
}
