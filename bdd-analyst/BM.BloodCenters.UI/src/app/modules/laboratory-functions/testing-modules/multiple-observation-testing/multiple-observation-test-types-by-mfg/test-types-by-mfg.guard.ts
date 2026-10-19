import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { MultipleObservationTestTypesByMfgComponent } from './multiple-observation-test-types-by-mfg.component';

export const testTypesByMfgGuard: CanDeactivateFn<MultipleObservationTestTypesByMfgComponent> = (component) => {
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
