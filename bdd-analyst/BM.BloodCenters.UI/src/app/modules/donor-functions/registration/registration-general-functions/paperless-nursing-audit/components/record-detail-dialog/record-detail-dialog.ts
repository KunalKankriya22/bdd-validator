import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NursingAuditRecordDto } from '../../models/paperless-nursing-audit.model';
import moment from 'moment';

@Component({
  selector: 'app-record-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './record-detail-dialog.html',
  styleUrls: ['./record-detail-dialog.scss'],
})
export class RecordDetailDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<RecordDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NursingAuditRecordDto,
  ) {}

  formatDate(isoDate: string | null | undefined): string {
    if (!isoDate) return '-';
    const m = moment(isoDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
