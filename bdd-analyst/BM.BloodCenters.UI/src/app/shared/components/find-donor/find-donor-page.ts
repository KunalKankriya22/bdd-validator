import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { FindDonorDialog } from './find-donor';
import { FindDonorDialogResult } from './find-donor.model';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { RouteKey } from '../../../core/constants/route-keys';
import { AddDonorNavigationState } from '../../../modules/donor-functions/donor-profile/donor-profile-general-functions/add-donor/models/add-donor.model';

@Component({
  selector: 'app-find-donor-page',
  standalone: true,
  template: '',
})
export class FindDonorPage {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private donorMode: 'add' | 'modify' = 'add';
  private programName: string | undefined;

  constructor() {
    this.donorMode = (this.route.snapshot.data['donorMode'] as 'add' | 'modify') || 'add';
    this.programName = this.route.snapshot.data['programName'] as string | undefined;
    this.openFindDonor();
  }

  private openFindDonor(): void {
    const dialogRef = this.dialog.open(FindDonorDialog, {
      width: '1184px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      data: { mode: this.donorMode, programName: this.programName }
    });

    dialogRef.afterClosed().subscribe((result: FindDonorDialogResult) => {
      if (result?.action === 'new') {
        const criteria = result.searchCriteria;
        const state: AddDonorNavigationState = {
          mode: 'add',
          searchCriteria: criteria ? {
            ...criteria,
            dob: criteria.dob ? String(criteria.dob) : undefined,
          } : undefined,
        };
        this.router.navigate(
          [ROUTE_REGISTRY[RouteKey.AddDonorForm].path],
          { state: JSON.parse(JSON.stringify(state)) },
        );
      } else if (result?.action === 'select') {
        const state: AddDonorNavigationState = {
          mode: 'modify',
          donorId: result.donor.donorId,
        };
        this.router.navigate(
          [ROUTE_REGISTRY[RouteKey.AddDonorForm].path],
          { state },
        );
      } else {
        this.router.navigate(['/home']);
      }
    });
  }
}
