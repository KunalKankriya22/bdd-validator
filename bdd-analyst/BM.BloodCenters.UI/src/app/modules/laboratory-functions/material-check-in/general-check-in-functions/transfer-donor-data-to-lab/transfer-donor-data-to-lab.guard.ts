import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { TransferDonorDataToLabComponent } from './transfer-donor-data-to-lab';

export const transferDonorDataToLabGuard: CanDeactivateFn<TransferDonorDataToLabComponent> = (component) => {
  const dialog = inject(MatDialog);

  if (component.canDeactivate()) return true;

  return dialog.open(ConfirmActionDialogComponent, {
    width: '400px',
    disableClose: true,
    data: {
      title: 'Transfer In Progress',
      message: 'Transfer is in progress. Are you sure you want to leave this page?',
      confirmText: 'LEAVE PAGE',
      cancelText: 'STAY',
    },
  }).afterClosed().pipe(
    tap((allowed: boolean) => {
      if (allowed) component.abortScan();
    }),
  );
};
