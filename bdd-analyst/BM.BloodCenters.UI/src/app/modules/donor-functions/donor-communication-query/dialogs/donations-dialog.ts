import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { CommunicationRecord } from '../models/donor-communication-query.model';

export interface DonationsDialogData {
  communication: CommunicationRecord;
}

/**
 * @deprecated This dialog is no longer used. The DonationDetailsDialogComponent is opened directly
 * from the parent component's onDonations() method. This file is kept for backward compatibility.
 */
@Component({
  selector: 'app-donations-dialog',
  standalone: true,
  imports: [
    CommonModule,
    SidePanelBase,
  ],
  templateUrl: './donations-dialog.html',
  styleUrls: ['./donations-dialog.scss'],
})
export class DonationsDialog {
  private readonly dialogRef = inject(MatDialogRef<DonationsDialog>);
  private readonly data = inject<DonationsDialogData>(MAT_DIALOG_DATA);

  protected readonly communication = this.data.communication;

  protected readonly footerButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'text' },
  ];

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '–';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  onFooterButtonClick(action: string): void {
    if (action === 'close') {
      this.onClose();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
