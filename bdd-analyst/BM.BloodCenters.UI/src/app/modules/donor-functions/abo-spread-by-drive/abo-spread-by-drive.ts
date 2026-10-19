import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { AboSpreadByDriveDialogComponent } from '@shared/components/abo-spread-by-drive-dialog/abo-spread-by-drive-dialog';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-abo-spread-by-drive',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './abo-spread-by-drive.html',
  styleUrls: ['./abo-spread-by-drive.scss'],
})
export class AboSpreadByDriveComponent {
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Functions', link: null },
      { label: 'ABO Breakdown by Drive', link: null },
    ],
    title: 'ABO Breakdown by Drive',
    subtitle: 'View ABO blood type distribution by drive and procedure code.',
    actions: [
      {
        label: 'VIEW POPUP',
        icon: 'open_in_new',
        color: 'accent',
        ariaLabel: 'Open ABO Spread by Drive popup',
        onClick: () => this.openAboSpreadDialog(),
      },
    ],
  };

  openAboSpreadDialog(): void {
    this.dialog.open(AboSpreadByDriveDialogComponent, {
      width: '960px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        driveId: '',
        chapterId: this.headerService.chapterId(),
      },
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });
  }
}
