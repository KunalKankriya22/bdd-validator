import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export interface BoxDialogData {
  title: string;
  boxId: string;
}

export interface BoxDialogResult {
  confirmed: boolean;
  closeCurrent: boolean;
  allProperlyPacked: boolean;
}

@Component({
  selector: 'app-packod-box-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <div class="dialog-field">
        <label class="dialog-label" id="close-box-label">Close Current Box?</label>
        <mat-radio-group [ngModel]="closeCurrentValue" (ngModelChange)="onCloseCurrentChange($event)"
          aria-labelledby="close-box-label">
          <mat-radio-button [value]="true">Yes</mat-radio-button>
          <mat-radio-button [value]="false">No</mat-radio-button>
        </mat-radio-group>
      </div>

      <div class="dialog-field">
        <label class="dialog-label" id="all-packed-label">All products properly packed?</label>
        <mat-radio-group [ngModel]="allPackedValue" (ngModelChange)="onAllPackedChange($event)"
          aria-labelledby="all-packed-label">
          <mat-radio-button [value]="true">Yes</mat-radio-button>
          <mat-radio-button [value]="false">No</mat-radio-button>
        </mat-radio-group>
      </div>

      @if (showWarning) {
        <div class="warning-banner" role="alert">
          <mat-icon class="warning-icon">warning</mat-icon>
          <span>Current box cannot be closed if it is not packed properly.</span>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="onCancel()">CANCEL</button>
      <button mat-flat-button color="primary"
        [disabled]="!canConfirm"
        (click)="onConfirm()">
        {{ data.title === 'Close Box' ? 'CLOSE' : 'CREATE NEW' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-dialog-content {
      overflow: hidden;
      max-height: none;
      padding: 20px 24px 8px;
    }
    :host ::ng-deep .mat-mdc-dialog-title {
      padding: 20px 24px 0;
    }
    :host ::ng-deep .mat-mdc-dialog-actions {
      padding: 8px 24px 20px;
    }
    .dialog-field {
      margin-bottom: 20px;
    }
    .dialog-label {
      display: block;
      margin-bottom: 10px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }
    mat-radio-button {
      margin-right: 16px;
    }
    .warning-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fdecea;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      color: #721c24;
      margin-top: 8px;
    }
    .warning-icon {
      color: #dc3545;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `],
})
export class PackodBoxDialogComponent {
  closeCurrentValue: boolean | null = null;
  allPackedValue: boolean | null = null;
  showWarning = false;
  canConfirm = false;

  constructor(
    public dialogRef: MatDialogRef<PackodBoxDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BoxDialogData
  ) {}

  onCloseCurrentChange(value: boolean): void {
    this.closeCurrentValue = value;
    this.updateState();
  }

  onAllPackedChange(value: boolean): void {
    this.allPackedValue = value;
    this.updateState();
  }

  private updateState(): void {
    this.showWarning = this.closeCurrentValue === true && this.allPackedValue === false;
    this.canConfirm = this.closeCurrentValue !== null &&
      !(this.closeCurrentValue === true && this.allPackedValue !== true);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    this.dialogRef.close({
      confirmed: true,
      closeCurrent: this.closeCurrentValue === true,
      allProperlyPacked: this.allPackedValue === true,
    } as BoxDialogResult);
  }
}
