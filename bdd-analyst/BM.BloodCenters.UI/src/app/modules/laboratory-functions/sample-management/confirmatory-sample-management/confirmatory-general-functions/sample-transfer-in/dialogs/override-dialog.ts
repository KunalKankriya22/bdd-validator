import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { SampleTransferInApiService } from '../services/sample-transfer-in-api.service';
import { CannedCommentsDialogComponent, CannedCommentsDialogData, CannedCommentsDialogResult } from './canned-comments-dialog';
import { SampleWarningDialogComponent, SampleWarningDialogData } from './sample-warning-dialog';

export interface OverrideDialogData {
  extUnitId: string;
  reasonCodes: Array<{ code: string; codeDesc: string }>;
  holdCodes: Array<{ code: string; codeDesc: string }>;
  commentCodes: Array<{ code: string; codeDesc: string }>;
}

export interface OverrideDialogResult {
  userId: string;
  password: string;
  reasonCode: string;
  holdCode: string;
  comments: string;
}

@Component({
  selector: 'app-override-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './override-dialog.html',
  styles: [
    `
      .override-dialog-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background: #ffffff;
        animation: slideInFromRight 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
      }

      @keyframes slideInFromRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.87);
          padding: 0;
        }

        .close-button {
          flex-shrink: 0;
        }
      }

      mat-dialog-content {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
      }

      .form-row {
        margin-bottom: 8px;
      }

      .form-row-two {
        display: flex;
        gap: 16px;
      }

      .form-field-half {
        flex: 1;
        min-width: 0;
      }

      .form-field-full {
        width: 100%;
      }

      .form-row-code {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .form-field-code {
        flex: 0 0 40%;
        min-width: 0;
      }

      .code-desc {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        padding-top: 8px;

        &__label {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 4px;
        }

        &__value {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.87);
          line-height: 1.4;
        }
      }

      .required-marker {
        color: #f44336;
      }

      .master-code-row {
        display: flex;
        justify-content: flex-start;
        margin-top: 4px;
        margin-bottom: 8px;
      }

      .master-code-btn {
        color: #228189 !important;
        border-color: #228189 !important;
        font-weight: 500;
        font-size: 13px;
      }

      mat-dialog-actions {
        padding: 8px 24px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
        min-height: unset;
      }

      .dialog-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        justify-content: flex-end;
      }

      .exit-btn {
        color: rgba(0, 0, 0, 0.87);
        min-width: 80px;
      }

      .save-btn {
        min-width: 100px;
      }

      ::ng-deep .override-dialog-container {
        .mat-mdc-form-field-subscript-wrapper {
          height: 20px;
        }

        .mat-mdc-text-field-wrapper {
          background-color: #ffffff;
        }

        .mat-mdc-form-field {
          width: 100%;
        }
      }
    `,
  ],
})
export class OverrideDialogComponent implements OnInit {
  readonly data = inject<OverrideDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<OverrideDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SampleTransferInApiService);
  private selectedCommentCodes: string[] = [];

  form!: FormGroup;
  selectedReasonDesc = '';
  selectedHoldDesc = '';
  isValidating = signal(false);
  validationError = signal('');

  ngOnInit(): void {
    this.form = this.fb.group({
      userId: ['', [Validators.required]],
      password: ['', [Validators.required]],
      reasonCode: ['', [Validators.required]],
      holdCode: [''],
      comments: ['', [Validators.required]],
    });
  }

  onReasonCodeChange(code: string): void {
    const match = this.data.reasonCodes.find(rc => rc.code === code);
    this.selectedReasonDesc = match?.codeDesc ?? '';
  }

  onHoldCodeChange(code: string): void {
    const match = this.data.holdCodes.find(hc => hc.code === code);
    this.selectedHoldDesc = match?.codeDesc ?? '';
  }

  onSelectFromMasterCode(): void {
    const currentComments = (this.form.get('comments')?.value || '').trim();
    const ref = this.dialog.open(CannedCommentsDialogComponent, {
      width: '520px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'side-panel-right',
      disableClose: false,
      data: {
        items: this.data.commentCodes || [],
        previouslySelected: this.selectedCommentCodes,
      } as CannedCommentsDialogData,
    });
    ref.afterClosed().subscribe((result: CannedCommentsDialogResult | null) => {
      if (result) {
        this.form.get('comments')?.setValue(result.selectedDescriptions);
      }
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userId = this.form.get('userId')!.value;
    const password = this.form.get('password')!.value;

    this.isValidating.set(true);
    this.validationError.set('');

    this.api.validateOverrideUser(userId, password).pipe(
      catchError((err: HttpErrorResponse) => {
        this.isValidating.set(false);
        if (err.status === 401) {
          this.showPermissionErrorDialog(err);
        } else {
          const msg = err?.error?.message || 'Override user validation failed.';
          this.validationError.set(msg);
        }
        return of(null);
      }),
    ).subscribe(response => {
      this.isValidating.set(false);
      if (!response) return;

      if (response.success) {
        const result: OverrideDialogResult = {
          userId,
          password,
          reasonCode: this.form.get('reasonCode')!.value,
          holdCode: this.form.get('holdCode')!.value ?? '',
          comments: this.form.get('comments')!.value,
        };
        this.dialogRef.close(result);
      } else {
        this.validationError.set(response.message || 'Override user validation failed.');
      }
    });
  }

  onExit(): void {
    this.dialogRef.close(null);
  }

  private showPermissionErrorDialog(err: HttpErrorResponse): void {
    const errorData = err.error;
    let message = 'User does not have permission for Authorization';
    if (errorData?.errorResponse?.error) {
      const code = errorData.errorResponse.errorCode || '';
      message = code ? `${code}: ${errorData.errorResponse.error}` : errorData.errorResponse.error;
    } else if (errorData?.message) {
      const code = errorData.errorCode || '';
      message = code ? `${code}: ${errorData.message}` : errorData.message;
    }

    const ref = this.dialog.open(SampleWarningDialogComponent, {
      width: '450px',
      disableClose: true,
      data: { type: 'error', message } as SampleWarningDialogData,
    });

    ref.afterClosed().subscribe((continueOverride: boolean) => {
      if (!continueOverride) {
        this.dialogRef.close(null);
      }
    });
  }
}
