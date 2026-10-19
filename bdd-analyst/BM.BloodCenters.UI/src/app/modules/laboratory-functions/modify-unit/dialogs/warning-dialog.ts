import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface WarningDialogData {
  code: string;
  message: string;
}

export interface WarningDialogResult {
  override: boolean;
}

@Component({
  selector: 'app-modify-unit-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="warning-dialog">
      <h2 class="dialog-title" id="warning-dialog-title">Warning</h2>
      <div class="dialog-body">
        <p class="dialog-message" id="warning-dialog-desc">{{ displayMessage }}</p>
      </div>
      <div class="dialog-actions" role="group" aria-label="Dialog actions">
        <button type="button" mat-button (click)="onNo()" cdkFocusInitial class="no-button">No</button>
        <button type="button" mat-raised-button color="primary" (click)="onYes()" class="yes-button">Yes</button>
      </div>
    </div>
  `,
  styles: [`
    .warning-dialog {
      padding: 24px;

      .dialog-title {
        margin: 0 0 16px;
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
          min-width: 80px;
        }
      }
    }
  `],
})
export class ModifyUnitWarningDialogComponent {
  readonly data = inject<WarningDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ModifyUnitWarningDialogComponent>);

  get displayMessage(): string {
    return `Warn: ${this.data.code}: ${this.data.message}. Do you want to continue?`;
  }

  onYes(): void {
    this.dialogRef.close({ override: true } as WarningDialogResult);
  }

  onNo(): void {
    this.dialogRef.close({ override: false } as WarningDialogResult);
  }
}
