import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface EmployerIntlAddressDialogData {
  intlCity: string;
  intlState: string;
  intlPostalCode: string;
  intlCountryName: string;
}

@Component({
  selector: 'app-employer-intl-address-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="side-panel-wrapper">
      <div class="panel-header">
        <h2 class="panel-title">Employer International Address</h2>
        <button mat-icon-button class="panel-close-btn" (click)="onClose()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="panel-body">
        <div class="fields-grid">
          <div class="field-item field-item--full">
            <div class="readonly-field">
              <span class="readonly-field__label">Intl City</span>
              <div class="readonly-field__value">{{ data.intlCity || '—' }}</div>
            </div>
          </div>
          <div class="field-item">
            <div class="readonly-field">
              <span class="readonly-field__label">Intl State</span>
              <div class="readonly-field__value">{{ data.intlState || '—' }}</div>
            </div>
          </div>
          <div class="field-item">
            <div class="readonly-field">
              <span class="readonly-field__label">Intl Postal Code</span>
              <div class="readonly-field__value">{{ data.intlPostalCode || '—' }}</div>
            </div>
          </div>
          <div class="field-item field-item--full">
            <div class="readonly-field">
              <span class="readonly-field__label">Intl Country</span>
              <div class="readonly-field__value">{{ data.intlCountryName || '—' }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="panel-footer">
        <div class="footer-actions">
          <button mat-flat-button class="primary-btn" (click)="onClose()">CLOSE</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./employer-intl-address-dialog.scss'],
})
export class EmployerIntlAddressDialog {
  private readonly dialogRef = inject(MatDialogRef<EmployerIntlAddressDialog>);
  readonly data = inject<EmployerIntlAddressDialogData>(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}
