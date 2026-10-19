import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-cancellation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirm-cancellation-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .dialog-message {
      color: #37474f;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    .cancel-btn {
      color: #228189;
    }

    .confirm-btn {
      background-color: #228189;
      color: #ffffff;
    }
  `]
})
export class ConfirmCancellationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmCancellationDialogComponent>);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
