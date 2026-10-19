import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-remove-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="confirm-dialog">
      <h2 id="confirm-title" mat-dialog-title>Are you sure you want to remove selected attributes?</h2>
      <mat-dialog-content>
        <p id="confirm-desc">This action cannot be undone. The attribute will be permanently removed,
        and the termination date will be set to system date.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">CANCEL</button>
        <button mat-raised-button (click)="onConfirm()" class="remove-btn">REMOVE</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { padding: 8px; }
    h2 { font-size: 18px; font-weight: 600; color: rgba(0,0,0,0.87); margin: 0 0 8px; }
    p { font-size: 14px; color: rgba(0,0,0,0.6); line-height: 1.5; margin: 0; }
    .cancel-btn { color: rgba(0,0,0,0.87); border-color: rgba(0,0,0,0.38); margin-right: 8px; }
    .remove-btn { background-color: #228189; color: #ffffff; }
    .remove-btn:hover { background-color: #1b6b72; }
  `]
})
export class RemoveConfirmationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RemoveConfirmationDialogComponent>);

  onCancel(): void { this.dialogRef.close(false); }
  onConfirm(): void { this.dialogRef.close(true); }
}
