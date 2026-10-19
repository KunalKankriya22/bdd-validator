import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface SampleWarningDialogData {
  type: 'warning' | 'error';
  message: string;
}

@Component({
  selector: 'app-sample-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './sample-warning-dialog.html',
  styles: [
    `
      .sample-warning-dialog {
        padding: 24px;
        box-sizing: border-box;
        overflow: hidden;

        .dialog-title {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.87);
        }

        .dialog-body {
          margin-bottom: 24px;

          .dialog-message {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            color: rgba(0, 0, 0, 0.87);
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
        }

        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;

          .no-button {
            color: rgba(0, 0, 0, 0.87);
            min-width: 80px;
          }

          .yes-button {
            background-color: #009688;
            color: white;
            min-width: 80px;

            &:hover {
              background-color: #00796b;
            }
          }
        }
      }
    `,
  ],
})
export class SampleWarningDialogComponent {
  readonly data = inject<SampleWarningDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SampleWarningDialogComponent>);

  get isWarning(): boolean {
    return this.data.type === 'warning';
  }

  get dialogTitle(): string {
    return this.isWarning ? 'Warning' : 'Error';
  }

  get displayMessage(): string {
    const prefix = this.isWarning ? 'Warn' : 'Error';
    const msg = this.data.message || '';
    const raw = msg.replace(/^Error\s+/i, '').replace(/^Warn:?\s*/i, '');
    return `${prefix}: ${raw} Do you want to continue?`;
  }

  onYes(): void {
    this.dialogRef.close(true);
  }

  onNo(): void {
    this.dialogRef.close(false);
  }
}
