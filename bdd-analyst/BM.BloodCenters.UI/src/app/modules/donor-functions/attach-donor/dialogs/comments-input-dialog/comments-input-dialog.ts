import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface CommentsInputDialogData {
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-comments-input-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <mat-form-field appearance="fill" class="full-width">
        <mat-label>{{ data.placeholder || 'Comments' }}</mat-label>
        <textarea matInput [formControl]="commentsCtrl" rows="3"
                  cdkFocusInitial></textarea>
        @if (commentsCtrl.hasError('required') && commentsCtrl.touched) {
          <mat-error>Comments are required</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="onCancel()">
        {{ data.cancelText || 'CANCEL' }}
      </button>
      <button mat-raised-button color="primary" type="button"
              [disabled]="commentsCtrl.invalid"
              (click)="onConfirm()">
        {{ data.confirmText || 'CONFIRM' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 350px; }
    p { margin: 0 0 16px; color: rgba(0,0,0,0.7); }
  `],
})
export class CommentsInputDialogComponent {
  readonly data = inject<CommentsInputDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CommentsInputDialogComponent>);

  readonly commentsCtrl = new FormControl('', [Validators.required]);

  onConfirm(): void {
    if (this.commentsCtrl.valid) {
      this.dialogRef.close(this.commentsCtrl.value?.trim());
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
