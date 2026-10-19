import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ViewNotificationLetterDialog } from './view-notification-letter-dialog';
import { ViewNotificationLetterDialogData } from './view-notification-letter-dialog.model';

@Component({
  selector: 'app-view-notification-letter-test-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatDialogModule],
  template: `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2>View Notification Letter - Test Page</h2>
      <div style="display: flex; gap: 12px; align-items: center; margin-top: 16px;">
        <input
          type="text"
          placeholder="Enter Donor ID"
          #donorInput
          value="DN00002315"
          style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; width: 200px;" />
        <button mat-raised-button color="primary" (click)="openDialog(donorInput.value)">
          Open Dialog
        </button>
      </div>
    </div>
  `,
})
export class ViewNotificationLetterTestPage {
  private readonly dialog = inject(MatDialog);

  openDialog(donorId: string): void {
    if (!donorId?.trim()) return;

    const dialogData: ViewNotificationLetterDialogData = {
      donorId: donorId.trim(),
    };

    this.dialog.open(ViewNotificationLetterDialog, {
      width: '948px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: dialogData,
      disableClose: false,
    });
  }
}
