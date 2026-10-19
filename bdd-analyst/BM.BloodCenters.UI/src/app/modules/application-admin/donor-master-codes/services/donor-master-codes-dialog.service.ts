import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AddUpdateDonorMasterCodes, MasterCodeDialogData, CodeDialogResult } from '../add-update-donor-master-codes/add-update-donor-master-codes';
import { MasterCode } from './donor-master-codes.service';

@Injectable({
  providedIn: 'root'
})
export class DonorMasterCodesDialogService {

  constructor(private dialog: MatDialog) {}

  /**
   * Open dialog for adding a new master code
   */
  openAddCodeDialog(): Observable<CodeDialogResult> {
    const dialogRef = this.dialog.open(AddUpdateDonorMasterCodes, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        mode: 'add'
      } as MasterCodeDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '0' },
      hasBackdrop: true
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: CodeDialogResult) => {
        if (result) {
          observer.next(result);
        }
        observer.complete();
      });
    });
  }

  /**
   * Open dialog for editing an existing master code
   */
  openEditCodeDialog(masterCode: MasterCode): Observable<CodeDialogResult> {
    const dialogRef = this.dialog.open(AddUpdateDonorMasterCodes, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        mode: 'edit',
        codeType: masterCode.codeType,
        code: masterCode.code,
        description: masterCode.description,
        effDate: masterCode.effDate,
        termDate: masterCode.termDate,
        status: masterCode.status
      } as MasterCodeDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '0' },
      hasBackdrop: true
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: CodeDialogResult) => {
        if (result) {
          observer.next(result);
        }
        observer.complete();
      });
    });
  }
}
