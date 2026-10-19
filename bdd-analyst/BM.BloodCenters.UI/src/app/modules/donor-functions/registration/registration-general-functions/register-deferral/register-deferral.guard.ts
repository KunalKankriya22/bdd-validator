import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { RegisterDeferralComponent } from './register-deferral';

export const registerDeferralGuard: CanDeactivateFn<RegisterDeferralComponent> = (component) => {
  if (component.canDeactivate()) return true;

  const dialog = inject(MatDialog);
  return dialog.open(ConfirmActionDialogComponent, {
    width: '400px',
    disableClose: true,
    data: {
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      confirmText: 'YES, LEAVE',
      cancelText: 'STAY'
    }
  }).afterClosed();
};
