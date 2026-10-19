import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

export interface SpOpenOrderItem {
  orderNumber: string;
  item: number;
  productType: string;
  abORh: string;
  quantityRequired: number;
  quantityAl: number;
  date: string;
  hours: number;
  attribute: string;
  antigenId: string;
}

export interface SpOpenOrdersDialogData {
  customerId: string;
  orders: SpOpenOrderItem[];
}

@Component({
  selector: 'app-sp-open-orders-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './sp-open-orders-dialog.html',
  styleUrls: ['./sp-open-orders-dialog.scss']
})
export class SpOpenOrdersDialogComponent {
  readonly data = inject<SpOpenOrdersDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SpOpenOrdersDialogComponent>);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  /** Gap #10: Convert GMT date to chapter-local time and format for display */
  formatDate(dateStr: string): string {
    if (!dateStr) return '--';
    const gmtMoment = moment.utc(dateStr);
    if (!gmtMoment.isValid()) return dateStr;
    const localMoment = this.chapterTimezoneService.convertGmtToLocal(gmtMoment);
    return localMoment.format('D-MMM-YYYY, hh:mm A').toUpperCase();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
