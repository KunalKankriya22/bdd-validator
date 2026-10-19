import { Injectable, inject } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UnsavedChangesDialogComponent } from '../unsaved-changes-dialog/unsaved-changes-dialog.component';

export interface CanComponentDeactivate {
  hasUnsavedChangesCheck(): boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  private dialog = inject(MatDialog);

  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | boolean {
    if (component.hasUnsavedChangesCheck && component.hasUnsavedChangesCheck()) {
      const dialogRef = this.dialog.open(UnsavedChangesDialogComponent, {
        width: '464px',
        height: '192px',
        disableClose: true,
        backdropClass: 'unsaved-changes-backdrop',
        panelClass: 'unsaved-changes-dialog'
      });

      return dialogRef.afterClosed();
    }

    return true;
  }
}
