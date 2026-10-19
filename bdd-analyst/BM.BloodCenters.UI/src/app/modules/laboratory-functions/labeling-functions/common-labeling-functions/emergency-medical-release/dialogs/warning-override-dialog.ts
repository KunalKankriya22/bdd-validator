import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface WarningOverrideDialogData {
  title: string;
  warnings: { code: string; message: string }[];
  allowOverride: boolean;
}

export interface WarningOverrideDialogResult {
  override: boolean;
}

@Component({
  selector: 'app-emr-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="warning-dialog" role="dialog">
      <div class="dialog-content">
        <div class="warning-header">
          <mat-icon class="warning-icon" aria-hidden="true">warning</mat-icon>
          <h2 class="dialog-title">{{ data.title }}</h2>
        </div>

        <div class="warning-message" role="alert">
          <p><strong>WARNING:</strong> The following warnings were found:</p>

          <div class="warning-list">
            @for (warning of data.warnings; track warning.code) {
              <div class="warning-item">
                <span class="warning-code">[{{ warning.code }}]</span>
                <span class="warning-text">{{ warning.message }}</span>
              </div>
            }
          </div>

          @if (data.allowOverride) {
            <p class="override-question">Do you want to override these warnings and proceed?</p>
          } @else {
            <p class="no-override-text">These warnings must be resolved before proceeding.</p>
          }
        </div>

        <div class="dialog-actions" role="group">
          <button type="button" mat-button (click)="onCancel()" cdkFocusInitial class="cancel-button">
            {{ data.allowOverride ? 'CANCEL' : 'CLOSE' }}
          </button>
          @if (data.allowOverride) {
            <button type="button" mat-raised-button color="warn" (click)="onProceed()" class="override-button">
              OK & PROCEED
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .warning-dialog {
      padding: 24px;
      min-width: 480px;
      max-width: 600px;
    }
    .dialog-content { display: flex; flex-direction: column; gap: 20px; }
    .warning-header { display: flex; align-items: center; gap: 12px; }
    .warning-icon { color: #FFA726; font-size: 32px; width: 32px; height: 32px; }
    .dialog-title { margin: 0; font-size: 18px; font-weight: 500; color: rgba(0,0,0,0.87); }
    .warning-message {
      background: #FFF3E0; border-left: 4px solid #FFA726;
      padding: 16px; border-radius: 4px;
    }
    .warning-message p { margin: 0 0 12px; font-size: 14px; line-height: 1.5; color: rgba(0,0,0,0.87); }
    .warning-message p:last-child { margin-bottom: 0; }
    .warning-message strong { color: #E65100; font-weight: 600; }
    .warning-list { margin: 12px 0; display: flex; flex-direction: column; gap: 8px; }
    .warning-item { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; }
    .warning-code { font-size: 12px; font-weight: 600; color: #E65100; font-family: monospace; }
    .warning-text { font-size: 14px; color: rgba(0,0,0,0.87); line-height: 1.4; }
    .override-question { margin-top: 12px; font-weight: 500; }
    .no-override-text { margin-top: 12px; font-weight: 500; color: #E65100; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; }
    .dialog-actions button { min-width: 120px; }
    .cancel-button { color: rgba(0,0,0,0.87); }
    .override-button { background-color: #009688; color: white; }
    .override-button:hover { background-color: #00796B; }
  `],
})
export class WarningOverrideDialogComponent {
  readonly data = inject<WarningOverrideDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<WarningOverrideDialogComponent>);

  onProceed(): void {
    this.dialogRef.close({ override: true } as WarningOverrideDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ override: false } as WarningOverrideDialogResult);
  }
}
