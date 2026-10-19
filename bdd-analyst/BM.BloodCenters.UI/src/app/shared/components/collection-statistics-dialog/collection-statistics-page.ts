import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CollectionStatistics } from '../../../modules/donor-functions/collection-statistics/collection-statistics';

@Component({
  selector: 'app-collection-statistics-page',
  standalone: true,
  template: '',
})
export class CollectionStatisticsPage {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  constructor() {
    this.openDialog();
  }

  private openDialog(): void {
    const dialogRef = this.dialog.open(CollectionStatistics, {
      width: '1440px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'collection-statistics-panel',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/home']);
    });
  }
}
