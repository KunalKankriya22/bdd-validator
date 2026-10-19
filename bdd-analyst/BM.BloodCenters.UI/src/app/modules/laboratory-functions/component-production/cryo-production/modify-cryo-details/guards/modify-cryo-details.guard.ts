import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ModifyCryoDetailsComponent } from '../modify-cryo-details.component';

export const modifyCryoDetailsGuard: CanDeactivateFn<ModifyCryoDetailsComponent> = (component) => {
  if (component.canDeactivate()) return true;

  const dialog = inject(MatDialog);

  return dialog.open(ConfirmActionDialogComponent, {
    width: '400px',
    disableClose: true,
    data: {
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave this page?',
      confirmText: 'LEAVE PAGE',
      cancelText: 'STAY',
    },
  }).afterClosed();
};
