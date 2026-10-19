import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NewZipCodeDialog } from './new-zip-code';
import { NewZipCodeDialogResult } from './new-zip-code.model';

@Component({
  selector: 'app-new-zip-code-page',
  standalone: true,
  template: '',
})
export class NewZipCodePage {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  constructor() {
    this.openNewZipCode();
  }

  private openNewZipCode(): void {
    const dialogRef = this.dialog.open(NewZipCodeDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'new-zip-code-panel',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result: NewZipCodeDialogResult) => {
      this.router.navigate(['/home']);
    });
  }
}
