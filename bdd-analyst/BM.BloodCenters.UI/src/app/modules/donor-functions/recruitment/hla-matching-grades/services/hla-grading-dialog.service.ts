import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AddEditHlaGrade } from '../add-edit-hla-grade/add-edit-hla-grade';
import {
  HlaGradingModel,
  DropdownOption,
  HlaGradingDialogData,
  HlaGradingDialogResult
} from '../models/hla-grading.model';

@Injectable({
  providedIn: 'root'
})
export class HlaGradingDialogService {

  constructor(private dialog: MatDialog) {}

  openAddDialog(
    gradeOptions: DropdownOption[],
    hlaCodeOptions: DropdownOption[],
    nextGradeId: number
  ): Observable<boolean> {
    const dialogData: HlaGradingDialogData = {
      mode: 'add',
      gradeOptions,
      hlaCodeOptions,
      nextGradeId
    };

    const dialogRef = this.dialog.open(AddEditHlaGrade, {
      width: '710px',
      maxWidth: '100vw',
      height: '100vh',
      disableClose: true,
      ariaLabelledBy: 'hla-grade-dialog-title',
      autoFocus: 'dialog',
      position: { right: '0', top: '0' },
      panelClass: 'right-side-drawer',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: dialogData
    });

    return dialogRef.afterClosed().pipe(
      map((result: HlaGradingDialogResult) => result?.success === true)
    );
  }

  openEditDialog(
    record: HlaGradingModel,
    gradeOptions: DropdownOption[],
    hlaCodeOptions: DropdownOption[]
  ): Observable<boolean> {
    const dialogData: HlaGradingDialogData = {
      mode: 'edit',
      record,
      gradeOptions,
      hlaCodeOptions,
      nextGradeId: record.gradeId
    };

    const dialogRef = this.dialog.open(AddEditHlaGrade, {
      width: '710px',
      maxWidth: '100vw',
      height: '100vh',
      disableClose: true,
      ariaLabelledBy: 'hla-grade-dialog-title',
      autoFocus: 'dialog',
      position: { right: '0', top: '0' },
      panelClass: 'right-side-drawer',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: dialogData
    });

    return dialogRef.afterClosed().pipe(
      map((result: HlaGradingDialogResult) => result?.success === true)
    );
  }
}
