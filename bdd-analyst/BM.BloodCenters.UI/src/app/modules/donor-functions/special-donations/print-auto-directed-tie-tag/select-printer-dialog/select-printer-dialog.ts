import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import type { PrinterDto } from '../models/print-auto-directed-tie-tag.models';

export interface SelectPrinterDialogData {
  printers: PrinterDto[];
}

export interface SelectPrinterDialogResult {
  printerCode: string;
}

@Component({
  selector: 'app-select-printer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="dialog-title">Select Printer</h2>
    <mat-dialog-content class="dialog-content">
      <p class="dialog-subtitle">Choose a printer to print the tie tag</p>
      <mat-form-field appearance="fill" class="printer-field">
        <mat-select [(ngModel)]="selectedPrinterCode" placeholder="Select a printer" aria-label="Select printer">
          @for (printer of data.printers; track printer.code) {
            <mat-option [value]="printer.code">
              {{ printer.code }}{{ printer.description ? ' - ' + printer.description : '' }}
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions class="dialog-actions">
      <button mat-button class="btn-cancel" (click)="onCancel()" aria-label="Cancel">CANCEL</button>
      <button
        mat-flat-button
        class="btn-print"
        [disabled]="!selectedPrinterCode"
        (click)="onPrint()"
        aria-label="Print">
        PRINT
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      font-family: Roboto, sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: #081620;
      padding: 20px 24px 8px;
      margin: 0;
    }

    .dialog-content {
      padding: 0 24px 16px !important;
    }

    .dialog-subtitle {
      font-family: Roboto, sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 21px;
      letter-spacing: 0px;
      color: #1D1B20;
      margin: 0 0 16px 0;
    }

    .printer-field {
      width: 100%;
    }

    .dialog-actions {
      padding: 8px 16px 16px !important;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-cancel {
      color: #228189;
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      border: 1px solid #228189;
      text-transform: uppercase;
    }

    .btn-print {
      background-color: #228189;
      color: #fff;
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      text-transform: uppercase;

      &:disabled {
        background-color: #bbb;
        color: #fff;
      }
    }
  `],
})
export class SelectPrinterDialogComponent {
  readonly dialogRef = inject(MatDialogRef<SelectPrinterDialogComponent>);
  readonly data: SelectPrinterDialogData = inject(MAT_DIALOG_DATA);

  selectedPrinterCode = '';

  onCancel(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    if (this.selectedPrinterCode) {
      this.dialogRef.close({ printerCode: this.selectedPrinterCode } as SelectPrinterDialogResult);
    }
  }
}
