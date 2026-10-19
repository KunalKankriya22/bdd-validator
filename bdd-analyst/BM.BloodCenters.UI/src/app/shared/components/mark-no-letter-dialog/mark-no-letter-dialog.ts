import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface MarkNoLetterDialogData {
  donor: { donorId: string; donorName: string; interCode?: string; unitId?: string };
  mode: 'USER' | 'SUPER';
  existingUserComment?: string;
}

export interface MarkNoLetterDialogResult {
  action: 'save' | 'reject' | 'cancel';
  userComment?: string;
  supervisorComment?: string;
}

@Component({
  selector: 'app-mark-no-letter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './mark-no-letter-dialog.html',
  styleUrls: ['./mark-no-letter-dialog.scss']
})
export class MarkNoLetterDialog implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `mark-no-letter-dialog-${MarkNoLetterDialog.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;
  protected readonly hintId = (name: string) => `${this.componentId}-${name}-hint`;

  form!: FormGroup;
  readonly userCommentMaxLength = 120;
  readonly supervisorCommentMaxLength = 100;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MarkNoLetterDialog>,
    @Inject(MAT_DIALOG_DATA) public data: MarkNoLetterDialogData
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    const isUser = this.data.mode === 'USER';

    this.form = this.fb.group({
      userReasons: [
        {
          value: isUser ? '' : (this.data.existingUserComment || ''),
          disabled: !isUser
        },
        isUser ? [Validators.maxLength(this.userCommentMaxLength)] : []
      ],
      supervisorComments: [
        { value: '', disabled: isUser },
        !isUser ? [Validators.maxLength(this.supervisorCommentMaxLength)] : []
      ]
    });
  }

  get f() {
    return this.form.controls;
  }

  get userReasonsRemainingChars(): number {
    const currentLength = this.form.get('userReasons')?.value?.length || 0;
    return this.userCommentMaxLength - currentLength;
  }

  get supervisorCommentsRemainingChars(): number {
    const currentLength = this.form.get('supervisorComments')?.value?.length || 0;
    return this.supervisorCommentMaxLength - currentLength;
  }

  get isUserMode(): boolean {
    return this.data.mode === 'USER';
  }

  get isSupervisorMode(): boolean {
    return this.data.mode === 'SUPER';
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' } as MarkNoLetterDialogResult);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    const result: MarkNoLetterDialogResult = {
      action: 'save',
      userComment: this.isUserMode ? this.form.get('userReasons')?.value : undefined,
      supervisorComment: this.isSupervisorMode ? this.form.get('supervisorComments')?.value : undefined
    };

    this.dialogRef.close(result);
  }

  onReject(): void {
    this.dialogRef.close({ action: 'reject' } as MarkNoLetterDialogResult);
  }

  getAriaDescribedBy(fieldName: string): string {
    const control = this.form.get(fieldName);
    const ids: string[] = [];

    if (control?.invalid && control?.touched) {
      ids.push(this.errorId(fieldName));
    }

    ids.push(this.hintId(fieldName));

    return ids.join(' ');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
