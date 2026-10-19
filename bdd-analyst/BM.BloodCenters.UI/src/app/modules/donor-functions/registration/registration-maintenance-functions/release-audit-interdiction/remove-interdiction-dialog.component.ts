import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Interdiction, RemovalReason } from './release-audit-interdiction.models';
import { ReleaseAuditInterdictionService } from './release-audit-interdiction.service';

export interface RemoveInterdictionDialogData {
  interdiction: Interdiction;
  reasonRequired: boolean;
}

@Component({
  selector: 'app-remove-interdiction-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Remove Interdiction</h2>
    <mat-dialog-content>
      <div class="info-row">
        <span class="label">Code:</span>
        <span class="value">{{ data.interdiction.interCode }}</span>
      </div>
      <div class="info-row">
        <span class="label">Description:</span>
        <span class="value">{{ data.interdiction.originated || '' }} {{ data.interdiction.reason || '' }}</span>
      </div>
      @if (data.interdiction.terminationDate && isPermanent()) {
        <div class="info-row permanent">
          <span class="label">Term:</span>
          <span class="value permanent-text">Indefinite</span>
        </div>
      }

      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Reason</mat-label>
          <mat-select formControlName="reasonCode">
            @for (reason of removalReasons(); track reason.code) {
              <mat-option [value]="reason.code">{{ reason.code }} - {{ reason.description }}</mat-option>
            }
          </mat-select>
          @if (form.get('reasonCode')?.hasError('required') && form.get('reasonCode')?.touched) {
            <mat-error>Reason is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Termination Date</mat-label>
          <input matInput type="date" formControlName="termDate">
          @if (form.get('termDate')?.hasError('required') && form.get('termDate')?.touched) {
            <mat-error>Termination date is required</mat-error>
          }
        </mat-form-field>
      </form>

      @if (loadingReasons()) {
        <div class="loading-reasons">
          <mat-spinner diameter="24"></mat-spinner>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()" type="button">CLOSE</button>
      <button mat-raised-button color="primary" (click)="onRemove()" type="button"
              [disabled]="form.invalid || loadingReasons()">REMOVE</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      margin: 0 0 12px 0;
      padding: 0 0 0 20px;
      font-size: 18px;
      font-weight: 600;
      color: #000000;
    }
    mat-dialog-content { padding: 0; margin: 0; }
    .info-row {
      display: flex;
      gap: 8px;
      padding: 4px 0;
      font-size: 14px;
    }
    .label { font-weight: 500; color: rgba(0,0,0,0.6); }
    .value { color: rgba(0,0,0,0.87); }
    .permanent-text { color: red; font-weight: 600; }
    .form-fields { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
    .full-width { width: 100%; }
    .loading-reasons { display: flex; justify-content: center; padding: 8px; }
    mat-dialog-actions { padding: 8px 0 0 0; margin: 0; gap: 12px; }
    button { min-width: 90px; height: 36px; font-size: 13px; font-weight: 500; }
  `]
})
export class RemoveInterdictionDialogComponent implements OnInit {
  readonly data = inject<RemoveInterdictionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RemoveInterdictionDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ReleaseAuditInterdictionService);

  readonly removalReasons = signal<RemovalReason[]>([]);
  readonly loadingReasons = signal<boolean>(false);
  form!: FormGroup;

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      reasonCode: ['', this.data.reasonRequired ? [Validators.required] : []],
      termDate: [today, [Validators.required]]
    });
    this.loadReasons();
  }

  isPermanent(): boolean {
    return this.data.interdiction.isPermanentDeferral;
  }

  private loadReasons(): void {
    this.loadingReasons.set(true);
    this.service.getRemovalReasons().subscribe({
      next: (reasons) => {
        this.removalReasons.set(reasons);
        this.loadingReasons.set(false);
      },
      error: () => {
        this.loadingReasons.set(false);
      }
    });
  }

  onRemove(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({
      confirmed: true,
      reasonCode: this.form.get('reasonCode')?.value || null,
      termDate: this.form.get('termDate')?.value
    });
  }

  onClose(): void {
    this.dialogRef.close(null);
  }
}
