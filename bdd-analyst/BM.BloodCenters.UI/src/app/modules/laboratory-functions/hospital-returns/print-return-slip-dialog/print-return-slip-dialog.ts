import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

export interface PrintReturnSlipDialogData {
  printers: { printerId: string; printerDescription?: string }[];
  defaultPrinterId?: string;
}

@Component({
  selector: 'app-print-return-slip-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <div class="print-slip-dialog">
      <div class="dialog-header">
        <div class="dialog-title-group">
          <h1 mat-dialog-title class="dialog-title">Print Return Slip</h1>
          <p class="dialog-subtitle">Do you want the return slip to be printed</p>
        </div>
        <button class="close-btn" (click)="onCancel()" aria-label="Close">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <hr class="dialog-divider" aria-hidden="true" />
      <mat-dialog-content class="dialog-body">
        <mat-form-field appearance="fill" class="printer-field">
          <mat-label>Return Slip Printer ID</mat-label>
          <mat-select [formControl]="printerIdControl">
            @for (printer of data.printers; track printer.printerId) {
              <mat-option [value]="printer.printerId">
                {{ printer.printerDescription ? printer.printerId + ' - ' + printer.printerDescription : printer.printerId }}
              </mat-option>
            }
            @if (data.printers.length === 0) {
              <mat-option disabled>No printers available</mat-option>
            }
          </mat-select>
          @if (printerIdControl.hasError('required') && printerIdControl.touched) {
            <mat-error>Printer ID is required</mat-error>
          }
        </mat-form-field>

        <div class="close-section">
          <mat-checkbox [(ngModel)]="closeAndPrint" color="primary">
            <span class="checkbox-label">Close Return Slip and Print</span>
          </mat-checkbox>
          <p class="checkbox-hint">
            If checked no more items can be returned on the current slip
          </p>
        </div>
      </mat-dialog-content>

      <hr class="dialog-divider" aria-hidden="true" />
      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button class="btn-cancel" (click)="onCancel()">CANCEL</button>
        <button mat-flat-button class="btn-print-slip"
                [disabled]="printerIdControl.invalid || !closeAndPrint"
                (click)="onPrint()">
          PRINT RETURN SLIP
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .print-slip-dialog {
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

    .dialog-divider {
      border: none;
      border-top: 1px solid #E0E0E0;
      margin: 0;
    }

    .dialog-body {
      padding: 16px 36px 16px;
    }

    .printer-field {
      width: 100%;
    }

    .close-section {
      margin-top: 8px;
      margin-bottom: 14px;
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

    /* Checkbox: 16×16, teal when checked, gray border when unchecked */
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

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding: 16px 16px 16px;
    }

    .btn-cancel {
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      color: #228189;
    }

    .btn-print-slip {
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
      }
    }
  `],
})
export class PrintReturnSlipDialogComponent implements OnInit {
  printerIdControl = new FormControl('', Validators.required);
  closeAndPrint = true;

  constructor(
    public dialogRef: MatDialogRef<PrintReturnSlipDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintReturnSlipDialogData,
  ) {}

  ngOnInit(): void {
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onPrint(): void {
    if (this.printerIdControl.invalid) {
      this.printerIdControl.markAsTouched();
      return;
    }
    this.dialogRef.close({
      printerId: this.printerIdControl.value,
      closeAndPrint: this.closeAndPrint,
    });
  }
}
