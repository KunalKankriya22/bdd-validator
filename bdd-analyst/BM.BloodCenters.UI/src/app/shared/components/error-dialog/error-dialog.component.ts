import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ErrorDialogData {
  message: string;
  title?: string;
}

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="error-dialog">
      <h2 class="error-dialog__title">{{ data.title || 'Error' }}</h2>
      <div class="error-dialog__message">
        {{ data.message }}
      </div>
      <div class="error-dialog__actions">
        <button
          mat-stroked-button
          class="error-dialog__close-btn"
          (click)="onClose()">
          CLOSE
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-dialog {
      padding: 24px;
      min-width: 400px;
      max-width: 600px;

      &__title {
        margin: 0 0 16px 0;
        font-family: 'Roboto', sans-serif;
        font-size: 20px;
        font-weight: 500;
        color: #000000;
        letter-spacing: 0.15px;
      }

      &__message {
        margin: 0 0 24px 0;
        font-family: 'Roboto', sans-serif;
        font-size: 16px;
        font-weight: 400;
        line-height: 1.5;
        color: #000000DE;
        white-space: pre-wrap;
      }

      &__actions {
        display: flex;
        justify-content: flex-end;
      }

      &__close-btn {
        color: #228189;
        border-color: #228189;
        font-weight: 500;
        font-size: 14px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        padding: 0 16px;
        height: 36px;

        &:hover {
          background-color: rgba(34, 129, 137, 0.04);
        }
      }
    }
  `],
})
export class ErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
