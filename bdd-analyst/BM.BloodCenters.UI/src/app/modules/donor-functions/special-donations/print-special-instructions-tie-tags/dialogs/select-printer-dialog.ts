import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { PrinterDto } from '../models/print-special-instructions.models';

export interface SelectPrinterDialogData {
  printers: PrinterDto[];
  numberOfLabels: number;
  selectedCount: number;
}

export interface SelectPrinterDialogResult {
  printerId: string;
  numberOfLabels: number;
}

@Component({
  selector: 'app-select-printer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="dialog-title">Select Label (Tietag) Printer</h2>
    <mat-dialog-content class="dialog-content">
      <p class="dialog-subtitle">Choose a printer to print the tie tag</p>
      @if (data.selectedCount > 1) {
        <p class="dialog-multi-note">Applies to all {{ data.selectedCount }} selected tie tags</p>
      }
      <mat-form-field appearance="fill" class="printer-field">
        <mat-label>Printer</mat-label>
        <mat-select [(ngModel)]="selectedPrinterId" aria-label="Select printer">
          @for (printer of data.printers; track printer.code) {
            <mat-option [value]="printer.code">{{ getDisplayValue(printer) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="fill" class="labels-field">
        <mat-label>Number of Labels</mat-label>
        <input matInput type="number" [formControl]="numberOfLabelsControl" aria-label="Number of labels">
        @if (numberOfLabelsControl.invalid && numberOfLabelsControl.touched) {
          <mat-error>
            @if (numberOfLabelsControl.hasError('max')) {
              Number of labels cannot exceed 999
            } @else {
              Number of labels must be a whole number between 1 and 999
            }
          </mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions class="dialog-actions">
      <button mat-button class="btn-cancel" (click)="onCancel()" aria-label="Cancel">CANCEL</button>
      <button
        mat-flat-button
        class="btn-print"
        [disabled]="!selectedPrinterId || numberOfLabelsControl.invalid"
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
      font-size: 14px;
      color: #666;
      margin: 0 0 16px 0;
    }

    .dialog-multi-note {
      font-family: Roboto, sans-serif;
      font-size: 13px;
      color: #228189;
      margin: -8px 0 12px 0;
    }

    .printer-field {
      width: 100%;
    }

    .labels-field {
      width: 100%;
      margin-top: 8px;
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

  selectedPrinterId = this.data.printers[0]?.code ?? '';
  readonly numberOfLabelsControl = new FormControl(this.data.numberOfLabels, [
    Validators.required,
    Validators.min(1),
    Validators.max(999),
    Validators.pattern(/^\d+$/),
  ]);

  getDisplayValue(printer: PrinterDto): string {
    if (printer.description) {
      return `${printer.code} - ${printer.description}`;
    }
    return printer.code;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    this.numberOfLabelsControl.markAsTouched();
    if (this.selectedPrinterId && this.numberOfLabelsControl.valid) {
      this.dialogRef.close({
        printerId: this.selectedPrinterId,
        numberOfLabels: this.numberOfLabelsControl.value!,
      } as SelectPrinterDialogResult);
    }
  }
}
