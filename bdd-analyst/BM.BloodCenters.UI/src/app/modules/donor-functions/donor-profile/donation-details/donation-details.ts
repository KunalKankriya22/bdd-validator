import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DonationDetailsDialogComponent } from './donation-details-dialog/donation-details-dialog';

@Component({
  selector: 'app-donation-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './donation-details.html',
  styleUrls: ['./donation-details.scss'],
})
export class DonationDetailsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Functions', link: null },
      { label: 'Donation Details', link: null },
    ],
    title: 'Donation Details',
    subtitle: 'View donation history and details for a donor.',
  };

  searchForm: FormGroup = this.fb.group({
    donorId: ['', Validators.required],
  });

  get f() {
    return this.searchForm.controls;
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const donorId = params['donorId'];
      if (donorId) {
        this.searchForm.patchValue({ donorId });
        this.openDonationDetailsDialog();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDonationDetailsDialog(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const donorId = this.searchForm.get('donorId')?.value as string;

    this.dialog.open(DonationDetailsDialogComponent, {
      width: '1400px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { donorId },
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.action === 'consents') {
          this.router.navigate(
            ['/donor-functions/registration/consent-history'],
            { state: { donorId: result.donorId, unitId: result.unitId, collectionDate: result.collectionDate } }
          );
        }
      });
  }
}
