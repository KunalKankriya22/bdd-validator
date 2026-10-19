import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-checkin-expired-warning-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Warning: Product is expired</h2>
    <mat-dialog-content>
      <p><strong>Error 5106:</strong> The selected Product is expired. Do you want to continue?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNo()" class="dialog-btn">No</button>
      <button mat-raised-button color="primary" (click)="onYes()" class="dialog-btn">Yes Continue</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { font-weight: 600; }
    p { color: rgba(0, 0, 0, 0.7); margin: 8px 0; }
    mat-dialog-actions { padding: 16px 24px; }
    .dialog-btn { text-transform: uppercase; }
  `]
})
export class CheckinExpiredWarningDialog {
  constructor(private dialogRef: MatDialogRef<CheckinExpiredWarningDialog>) {}

  onNo(): void {
    this.dialogRef.close(false);
  }

  onYes(): void {
    this.dialogRef.close(true);
  }
}
