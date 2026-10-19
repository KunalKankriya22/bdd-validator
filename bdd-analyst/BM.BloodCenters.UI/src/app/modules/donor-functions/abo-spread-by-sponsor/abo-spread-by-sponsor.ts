import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { AboSpreadBySponsorDialogComponent } from '@shared/components/abo-spread-by-sponsor-dialog/abo-spread-by-sponsor-dialog';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-abo-spread-by-sponsor',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './abo-spread-by-sponsor.html',
  styleUrls: ['./abo-spread-by-sponsor.scss'],
})
export class AboSpreadBySponsorComponent {
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Functions', link: null },
      { label: 'ABO Breakdown by Sponsor', link: null },
    ],
    title: 'ABO Breakdown by Sponsor',
    subtitle: 'View ABO blood type distribution by sponsor across recent drives.',
    actions: [
      {
        label: 'VIEW POPUP',
        icon: 'open_in_new',
        color: 'accent',
        ariaLabel: 'Open ABO Spread by Sponsor popup',
        onClick: () => this.openAboSpreadDialog(),
      },
    ],
  };

  openAboSpreadDialog(): void {
    this.dialog.open(AboSpreadBySponsorDialogComponent, {
      width: '960px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: {
        sponsorId: '',
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
