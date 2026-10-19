import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ISBTUnitCheckDigitDialog } from './isbt-unit-check-digit';
import { ISBTUnitCheckDigitDialogResult } from './isbt-unit-check-digit.model';

@Component({
  selector: 'app-isbt-unit-check-digit-page',
  standalone: true,
  template: '',
})
export class ISBTUnitCheckDigitPage {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  constructor() {
    this.openISBTCheckDigit();
  }

  private openISBTCheckDigit(): void {
    const dialogRef = this.dialog.open(ISBTUnitCheckDigitDialog, {
      width: '800px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'isbt-check-digit-panel',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe((result: ISBTUnitCheckDigitDialogResult) => {
      this.router.navigate(['/home']);
    });
  }
}
