import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Interdiction } from './release-audit-interdiction.models';

export interface ReleaseInterdictionConfirmationDialogData {
  interdiction: Interdiction;
}

@Component({
  selector: 'app-release-interdiction-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Interdiction release alert</h2>
    <mat-dialog-content>
      <p>Do you really want to release the Interdiction? [{{ data.interdiction.interCode }}] {{ data.interdiction.originated || '' }} {{ data.interdiction.reason || '' }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNo()" type="button">NO, CANCEL</button>
      <button mat-raised-button color="primary" (click)="onYes()" type="button" cdkFocusInitial>YES</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      margin: 0 0 12px 0;
      padding: 0 0 0 20px;
      font-size: 18px;
      font-weight: 600;
      color: #000000;
    }

    mat-dialog-content {
      padding: 0 0 20px 0;
      margin: 0;
    }

    mat-dialog-content p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.87);
    }

    mat-dialog-actions {
      padding: 0;
      margin: 0;
      gap: 12px;
    }

    button {
      min-width: 110px;
      height: 36px;
      font-size: 13px;
      font-weight: 500;
      pointer-events: auto;
      cursor: pointer;
    }
  `]
})
export class ReleaseInterdictionConfirmationDialogComponent {
  readonly data = inject<ReleaseInterdictionConfirmationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ReleaseInterdictionConfirmationDialogComponent>);

  onYes(): void {
    this.dialogRef.close(true);
  }

  onNo(): void {
    this.dialogRef.close(false);
  }
}
