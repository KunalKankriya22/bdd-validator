import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { MessageDialogData } from '../../interfaces/auth.interface';

@Component({
  selector: 'app-message-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './message-dialog.html',
  styleUrls: ['./message-dialog.scss'],
})
export class MessageDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MessageDialogData,
    private dialogRef: MatDialogRef<MessageDialog>
  ) {}

  onAction(action: string): void {
    this.dialogRef.close(action);
  }

  get iconName(): string {
    switch (this.data.icon) {
      case 'error':
        return 'error_outline';
      case 'warning':
        return 'warning_amber';
      case 'success':
        return 'check_circle_outline';
      default:
        return 'info_outline';
    }
  }
}
