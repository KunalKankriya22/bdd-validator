import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-manual-unit-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Manual Entry of Unit ID</h2>
    <mat-dialog-content>
      <form [formGroup]="entryForm" class="manual-entry-form">
        <mat-form-field appearance="fill">
          <mat-label>Collection ID</mat-label>
          <input matInput formControlName="collId" maxlength="5" placeholder="e.g. W0001">
          @if (entryForm.get('collId')?.hasError('required') && entryForm.get('collId')?.touched) {
            <mat-error>Collection ID is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Collection Year</mat-label>
          <input matInput formControlName="collYear" maxlength="2" placeholder="e.g. 26">
          @if (entryForm.get('collYear')?.hasError('required') && entryForm.get('collYear')?.touched) {
            <mat-error>Collection Year is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Unit Serial No</mat-label>
          <input matInput formControlName="unitSerialNo" maxlength="6" placeholder="e.g. 000001">
          @if (entryForm.get('unitSerialNo')?.hasError('required') && entryForm.get('unitSerialNo')?.touched) {
            <mat-error>Unit Serial No is required</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="entryForm.invalid">OK</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .manual-entry-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 300px;
    }
    mat-form-field {
      width: 100%;
    }
  `]
})
export class ManualUnitEntryDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ManualUnitEntryDialogComponent>);

  entryForm: FormGroup = this.fb.group({
    collId: ['', [Validators.required, Validators.maxLength(5)]],
    collYear: ['', [Validators.required, Validators.maxLength(2)]],
    unitSerialNo: ['', [Validators.required, Validators.maxLength(6)]]
  });

  onSubmit(): void {
    if (this.entryForm.invalid) {
      this.entryForm.markAllAsTouched();
      return;
    }

    const { collId, collYear, unitSerialNo } = this.entryForm.value;
    const unitId = `${collId}${collYear}${unitSerialNo}`;
    this.dialogRef.close(unitId);
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }
}
