import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

export interface CustomerMismatchDialogData {
  returnedFromId: string;
  returnedFromName: string;
  shippedToId: string;
  shippedToName: string;
}

@Component({
  selector: 'app-customer-mismatch-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
  ],
  template: `
    <div class="mismatch-dialog">
      <div class="dialog-header">
        <div class="dialog-title-group">
          <h1 mat-dialog-title class="dialog-title">Override Returned Customer</h1>
          <p class="dialog-subtitle">The shipped to and returned from customers are not the same</p>
        </div>
        <button class="close-btn" (click)="onCancel()" aria-label="Close">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <hr class="dialog-body-divider" aria-hidden="true" />
      <mat-dialog-content class="dialog-body">
        <div class="customer-info">
          <div class="customer-block">
            <span class="customer-label">Returned from</span>
            <span class="customer-value">{{ data.returnedFromId }} - {{ data.returnedFromName }}</span>
          </div>
          <div class="customer-block">
            <span class="customer-label">Shipped to</span>
            <span class="customer-value">{{ data.shippedToId }} - {{ data.shippedToName }}</span>
          </div>
        </div>

        <div class="return-anyway-section">
          <mat-checkbox [(ngModel)]="returnAnyway" color="primary">
            <span class="checkbox-label">Return anyway</span>
          </mat-checkbox>
          <p class="checkbox-hint">
            If this option is checked the shipped-to customer will be credited.<br />
            Uncheck to skip this unit.
          </p>
        </div>
      </mat-dialog-content>

      <hr class="dialog-footer-divider" aria-hidden="true" />
      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button class="btn-cancel" (click)="onCancel()">CANCEL</button>
        <button mat-flat-button class="btn-return" [disabled]="!returnAnyway" (click)="onReturn()">RETURN</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .mismatch-dialog {
      max-width: 100%;
    }

    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 16px 16px 16px;
      gap: 16px;
    }

    .dialog-title-group {
      flex: 1;
    }

    .dialog-title {
      font-family: Roboto, sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: #1D1B20;
      margin: 0 0 4px;
      line-height: 28px;
    }

    .dialog-subtitle {
      font-family: Roboto, sans-serif;
      font-size: 14px;
      font-weight: 400;
      color: #49454F;
      margin: 0;
      line-height: 20px;
    }

    .close-btn {
      color: #49454F;
      width: 24px;
      height: 24px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;

      .mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        color: #1D1B20;
      }
    }

    .dialog-body {
      padding: 0 36px;
    }

    .dialog-body-divider {
      border: none;
      border-top: 1px solid #E0E0E0;
      margin: 0;
    }

    .customer-info {
      background: none;
      padding: 16px 0 0;
      margin-bottom: 16px;
    }

    .customer-block {
      display: flex;
      flex-direction: column;
      gap: 2px;

      &:first-child {
        margin-bottom: 16px;
      }
    }

    .customer-label {
      font-family: Roboto, sans-serif;
      font-size: 12px;
      font-weight: 400;
      color: #49454F;
      line-height: 16px;
    }

    .customer-value {
      font-family: Roboto, sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: #1D1B20;
      line-height: 16px;
      letter-spacing: 0;
      margin-top: 8px;
    }

    .return-anyway-section {
      margin-bottom: 8px;
    }

    .checkbox-label {
      font-family: Roboto, sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: #1D1B20;
      line-height: 24px;
      letter-spacing: 0;
    }

    .checkbox-hint {
      font-family: Roboto, sans-serif;
      font-size: 12px;
      font-weight: 400;
      color: #3F4849;
      line-height: 120%;
      letter-spacing: 0;
      margin: 0 0 0 23px;
    }

    /* Checkbox: 16×16, teal when checked, aligned with label */
    ::ng-deep .mat-mdc-checkbox {
      --mdc-checkbox-state-layer-size: 24px;
    }

    ::ng-deep .mat-mdc-checkbox label {
      display: flex;
      align-items: center;
    }

    ::ng-deep .mdc-checkbox {
      padding: 0 !important;
      margin-right: 8px;
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
    }

    ::ng-deep .mdc-checkbox__background {
      width: 16px !important;
      height: 16px !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
    }

    ::ng-deep .mat-mdc-checkbox:not(.mat-mdc-checkbox-disabled) .mdc-checkbox__native-control:enabled:not(:checked) ~ .mdc-checkbox__background {
      border-color: #3F4849 !important;
    }

    ::ng-deep .mat-mdc-checkbox:not(.mat-mdc-checkbox-disabled) .mdc-checkbox__native-control:enabled:checked ~ .mdc-checkbox__background {
      background-color: #228189 !important;
      border-color: #228189 !important;
    }

    ::ng-deep .mat-mdc-checkbox:not(.mat-mdc-checkbox-disabled) .mdc-checkbox__native-control:enabled:checked ~ .mdc-checkbox__background .mdc-checkbox__checkmark {
      color: white !important;
    }

    ::ng-deep .mat-mdc-checkbox-touch-target {
      position: absolute;
    }

    ::ng-deep .mdc-checkbox__ripple,
    ::ng-deep .mat-mdc-checkbox-ripple {
      display: none;
    }

    .dialog-footer-divider {
      border: none;
      border-top: 1px solid #E0E0E0;
      margin: 24px 0 0;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding: 16px 24px 24px;
    }

    .btn-cancel {
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      color: #228189;
    }

    .btn-return {
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      background: #228189 !important;
      color: #FFFFFF !important;
      border-radius: 4px;
      padding: 0 24px;

      &:disabled {
        background: #E4E7E9 !important;
        color: #BBC3C8 !important;
        cursor: not-allowed;
      }
    }
  `],
})
export class CustomerMismatchDialogComponent {
  returnAnyway = true;

  constructor(
    public dialogRef: MatDialogRef<CustomerMismatchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomerMismatchDialogData,
  ) {}

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onReturn(): void {
    this.dialogRef.close({ proceed: this.returnAnyway });
  }
}
