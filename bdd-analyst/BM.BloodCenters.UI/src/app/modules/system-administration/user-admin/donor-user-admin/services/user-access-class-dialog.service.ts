import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AssignEditUserAccessClassComponent
} from '../define-user-access/assign-edit-user-access-class/assign-edit-user-access-class';
import {
  UserAccessInfo,
  UserAccessClassRow,
  AssignEditAccessClassDialogData,
  AssignEditAccessClassDialogResult
} from '../models/user-access.model';

@Injectable({
  providedIn: 'root'
})
export class UserAccessClassDialogService {

  constructor(private dialog: MatDialog) { }

  /**
   * Open dialog for assigning a new access class to a user
   * Saves to backend when user clicks CREATE AND ASSIGN
   */
  openAssignAccessClassDialog(userInfo: UserAccessInfo): Observable<boolean> {
    const dialogData: AssignEditAccessClassDialogData = {
      mode: 'assign',
      user: {
        userId: userInfo.userId,
        userName: userInfo.userName,
        department: userInfo.department
      }
    };

    const dialogRef = this.dialog.open(AssignEditUserAccessClassComponent, {
      width: '754px',
      maxWidth: '100vw',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      data: dialogData
    });

    return dialogRef.afterClosed().pipe(
      map((result: AssignEditAccessClassDialogResult) => result?.success === true)
    );
  }

  /**
   * Open dialog for editing an existing access class assignment
   * Saves to backend when user clicks SAVE
   */
  openEditAccessClassDialog(
    userInfo: UserAccessInfo,
    accessClassRow: UserAccessClassRow
  ): Observable<boolean> {
    const dialogData: AssignEditAccessClassDialogData = {
      mode: 'edit',
      user: {
        userId: userInfo.userId,
        userName: userInfo.userName,
        department: userInfo.department
      },
      accessClassData: {
        accessClass: accessClassRow.accessClass,
        description: accessClassRow.description,
        level: accessClassRow.level,
        effectiveDate: accessClassRow.effectiveDate,
        terminationDate: accessClassRow.terminationDate
      }
    };

    const dialogRef = this.dialog.open(AssignEditUserAccessClassComponent, {
      width: '754px',
      maxWidth: '100vw',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      data: dialogData
    });

    return dialogRef.afterClosed().pipe(
      map((result: AssignEditAccessClassDialogResult) => result?.success === true)
    );
  }
}
