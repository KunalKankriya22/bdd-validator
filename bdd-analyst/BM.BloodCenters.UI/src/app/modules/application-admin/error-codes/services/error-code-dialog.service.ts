import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AddNewCode } from '../addNewcode/addNewcode';
import { ErrorCode, ErrorType, AuditFlag, TabType } from '../models/error-code.model';

export interface CodeDialogResult {
  errorCode: string;
  errorType: ErrorType;
  error: string;
  auditFlag: AuditFlag;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorCodeDialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Opens the edit code dialog with the provided error code data
   */
  openEditCodeDialog(element: ErrorCode): Observable<CodeDialogResult | undefined> {
    const dialogRef: MatDialogRef<AddNewCode, CodeDialogResult> = this.dialog.open(AddNewCode, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        mode: 'edit',
        errorCode: element.errorCode,
        errorType: element.errorType,
        error: element.error,
        auditFlag: element.auditFlag
      },
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true
    });

    return dialogRef.afterClosed();
  }

  /**
   * Opens the add new code dialog
   */
  openNewCodeDialog(tabType: TabType): Observable<CodeDialogResult | undefined> {
    const dialogRef: MatDialogRef<AddNewCode, CodeDialogResult> = this.dialog.open(AddNewCode, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { mode: 'add', tabType },
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      disableClose: false,
      hasBackdrop: true
    });

    return dialogRef.afterClosed();
  }
}