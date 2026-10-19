import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { SiteCollectionStatisticsDialog } from './site-collection-statistics-dialog';

@Component({
  selector: 'app-site-collection-statistics-page',
  standalone: true,
  template: '',
})
export class SiteCollectionStatisticsPage {
  private readonly dialog = inject(MatDialog);
  private readonly location = inject(Location);

  constructor() {
    this.openDialog();
  }

  private openDialog(): void {
    const dialogRef = this.dialog.open(SiteCollectionStatisticsDialog, {
      width: '1400px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'collection-statistics-panel',
      data: null,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.location.back();
    });
  }
}
