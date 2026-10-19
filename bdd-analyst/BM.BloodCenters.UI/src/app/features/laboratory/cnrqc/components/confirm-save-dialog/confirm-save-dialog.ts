import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-save-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirm Save</h2>
    <mat-dialog-content>
      <p>There are units which are not reconciled!</p>
      <p>Please confirm your acceptance.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true" cdkFocusInitial>
        Confirm
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmSaveDialogComponent {}
