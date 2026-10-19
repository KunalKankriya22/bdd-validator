import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { PerformVisualAuditComponent } from './perform-visual-audit';

export const performVisualAuditGuard: CanDeactivateFn<PerformVisualAuditComponent> = (component) => {
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
