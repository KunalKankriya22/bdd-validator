import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AuthorizeNotificationLetterDialog } from './authorize-notification-letter-dialog';
import { AuthorizeNotificationLetterResult, NotificationLetterMode } from './authorize-notification-letter-dialog.model';

@Component({
  selector: 'app-authorize-notification-letter-dialog-page',
  standalone: true,
  template: '',
})
export class AuthorizeNotificationLetterDialogPage {
  private readonly dialog = inject(MatDialog);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.openAuthorizeNotificationLetter();
  }

  private openAuthorizeNotificationLetter(): void {
    // Get donorId from query params (letterSeqNo is optional)
    const queryParams = this.route.snapshot.queryParams;
    const donorId = queryParams['donorId'] || '';
    const letterSeqNo = queryParams['letterSeqNo'];
    const mode = (queryParams['mode'] as NotificationLetterMode) || 'USER';

    const dialogRef = this.dialog.open(AuthorizeNotificationLetterDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'authorize-notification-letter-panel',
      data: {
        donorId,
        letterSeqNo,
        mode
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(() => {
      // Go back to previous page instead of navigating to root
      // This keeps the user on their current page/context
      this.location.back();
    });
  }
}
