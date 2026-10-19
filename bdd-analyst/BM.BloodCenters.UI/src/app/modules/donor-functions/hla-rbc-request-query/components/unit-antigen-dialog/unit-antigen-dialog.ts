import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatchedUnit } from '../../models/hla-rbc-request-query.model';

@Component({
  selector: 'app-unit-antigen-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './unit-antigen-dialog.html',
  styleUrls: ['./unit-antigen-dialog.scss']
})
export class UnitAntigenDialog {
  private dialogRef = inject(MatDialogRef<UnitAntigenDialog>);
  unit = inject<MatchedUnit>(MAT_DIALOG_DATA);

  get formattedCollectionDate(): string {
    return this.formatDate(this.unit.collectionDate);
  }

  private formatDate(value: any): string {
    if (!value) return '-';

    // Handle string format: "DD-MM-YYYY" or "MM-DD-YYYY"
    if (typeof value === 'string' && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        // Assuming format is DD-MM-YYYY based on API
        const day = parts[0].padStart(2, '0');
        const monthIndex = parseInt(parts[1], 10) - 1;
        const year = parts[2];

        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${day}-${monthNames[monthIndex]}-${year}`;
        }
      }
    }

    // Fallback to Date parsing
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
