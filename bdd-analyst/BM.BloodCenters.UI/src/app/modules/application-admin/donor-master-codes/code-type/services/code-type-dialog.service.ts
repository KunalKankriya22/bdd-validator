import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AddUpdateCodeType, CodeTypeDialogData, CodeTypeDialogResult } from '../add-update-code-type/add-update-code-type';
import { CodeType, MasterCode } from '../../services/donor-master-codes.service';

@Injectable({
  providedIn: 'root'
})
export class CodeTypeDialogService {

  constructor(private dialog: MatDialog) {}

  /**
   * Open dialog for adding a new code type
   */
  openAddCodeTypeDialog(): Observable<CodeTypeDialogResult> {
    const dialogRef = this.dialog.open(AddUpdateCodeType, {
      width: '50vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        mode: 'add'
      } as CodeTypeDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '0' },
      hasBackdrop: true
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: CodeTypeDialogResult) => {
        if (result) {
          observer.next(result);
        }
        observer.complete();
      });
    });
  }

  /**
   * Open dialog for editing an existing code type
   */
  openEditCodeTypeDialog(codeType: CodeType): Observable<CodeTypeDialogResult> {
    const dialogRef = this.dialog.open(AddUpdateCodeType, {
      width: '50vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        mode: 'edit',
        codeType: codeType.codeType,
        code: codeType.code,
        description: codeType.description,
        effectiveDate: codeType.effDate,
        termDate: codeType.termDate,
        status: codeType.status,
        numberalValue: codeType.numberalValue,
        sequence1: codeType.sequence1,
        sequence2: codeType.sequence2,
        sequence3: codeType.sequence3
      } as CodeTypeDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '0' },
      hasBackdrop: true
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: CodeTypeDialogResult) => {
        if (result) {
          observer.next(result);
        }
        observer.complete();
      });
    });
  }
}
