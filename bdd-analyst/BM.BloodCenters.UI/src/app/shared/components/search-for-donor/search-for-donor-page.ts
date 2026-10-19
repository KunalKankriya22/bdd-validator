import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { SearchForDonorDialog } from "./search-for-donor";
import { SearchForDonorDialogResult } from "./search-for-donor.model";
import { DonorStateService } from '../../../modules/donor-functions/shared/services/donor-state.service';

@Component({
  selector: 'app-search-for-donor-page',
  standalone: true,
  template: '',
})
export class SearchForDonorPage implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly donorStateService = inject(DonorStateService);
  private returnUrl: string = '/';

  ngOnInit(): void {
    // Get returnUrl from query params if provided
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';
      this.openSearchForDonor();
    });
  }

  private openSearchForDonor(): void {
    const dialogRef = this.dialog.open(SearchForDonorDialog, {
      width: '1400px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'search-for-donor-panel',
      data: {}
    });

    dialogRef.afterClosed().subscribe((result: SearchForDonorDialogResult) => {
      if (result && result.action === 'select') {
        // User selected a donor - save to state service and navigate
        const donor = result.donor;
        const donorName = `${donor.lastName}, ${donor.firstName}${donor.middleName ? ' ' + donor.middleName : ''}`;

        this.donorStateService.setSelectedDonor({
          donorId: donor.donorId,
          donorName,
          timestamp: Date.now(),
        });

        // Navigate to returnUrl with donorId as query param
        this.router.navigate([this.returnUrl], {
          queryParams: { donorId: donor.donorId }
        });
      } else {
        // User cancelled - navigate back to returnUrl without donorId
        this.router.navigate([this.returnUrl]);
      }
    });
  }
}
