import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddEditCodeType, CodeTypeDialogData } from '../add-edit-code-type/add-edit-code-type';
import { MasterCodeDetail } from '../../services/distribution-master-codes.service';

@Injectable({
  providedIn: 'root'
})
export class CodeTypeDialogService {

  constructor(private dialog: MatDialog) {}

  openAddCodeDialog(codeType: string, codeTypeDescription: string): MatDialogRef<AddEditCodeType> {
    return this.dialog.open(AddEditCodeType, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      ariaLabel: 'Add New Code',
      data: {
        mode: 'add',
        codeType: codeType,
        codeTypeDescription: codeTypeDescription
      } as CodeTypeDialogData
    });
  }

  openEditCodeDialog(code: MasterCodeDetail, codeTypeDescription: string): MatDialogRef<AddEditCodeType> {
    return this.dialog.open(AddEditCodeType, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      ariaLabel: 'Edit Code',
      data: {
        mode: 'edit',
        codeType: code.codeType,
        codeTypeDescription: codeTypeDescription,
        code: code.code,
        description: code.description,
        effectiveDate: code.effDate,
        termDate: code.termDate,
        modificationDate: code.lastModifiedDate,
        numericalValue: code.numericalValue,
        sequence1: code.sequence1,
        sequence2: code.sequence2,
        sequence3: code.sequence3,
        codeBehavior: code.changeControlFlag
      } as CodeTypeDialogData
    });
  }
}