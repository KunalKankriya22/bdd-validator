import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddUpdateDistributionMasterCodes, DistributionMasterCodeDialogData } from '../add-update-distribution-master-codes/add-update-distribution-master-codes';
import { MasterCodeListItem } from './distribution-master-codes.service';

@Injectable({
  providedIn: 'root'
})
export class DistributionMasterCodesDialogService {

  constructor(private dialog: MatDialog) {}

  openAddDialog(): MatDialogRef<AddUpdateDistributionMasterCodes> {
    return this.dialog.open(AddUpdateDistributionMasterCodes, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      ariaLabel: 'Add New Code Type',
      data: { mode: 'add' } as DistributionMasterCodeDialogData
    });
  }

  openEditDialog(row: MasterCodeListItem): MatDialogRef<AddUpdateDistributionMasterCodes> {
    return this.dialog.open(AddUpdateDistributionMasterCodes, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      ariaLabel: 'Edit Code Type',
      data: {
        mode: 'edit',
        codeType: row.codeType,
        description: row.description,
        effDate: row.effDate ?? undefined,
        termDate: row.termDate,
        lastModifiedDate: row.lastModifiedDate,
        numericalValue: row.numericalValue ?? undefined,
      } as DistributionMasterCodeDialogData
    });
  }
}
