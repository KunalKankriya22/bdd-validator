import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';

import { DonorEligibilityPanel } from './donor-eligibility-panel';
import { DonorEligibilityInput, DonorBasicInfoResponse } from './models/donor-eligibility.model';
import { DonorEligibilityService } from './services/donor-eligibility.service';

@Component({
  selector: 'app-donor-eligibility-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './donor-eligibility-page.html',
  styleUrls: ['./donor-eligibility-page.scss']
})
export class DonorEligibilityPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly eligibilityService = inject(DonorEligibilityService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  isLoadingDonor = signal(false);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Functions', link: null },
      { label: 'Donor Eligibility', link: null }
    ],
    title: 'Donor Eligibility & Attributes',
    subtitle: 'Check donor eligibility for donation procedures'
  };

  searchForm: FormGroup = this.fb.group({
    donorId: ['', Validators.required]
  });

  get f() {
    return this.searchForm.controls;
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const donorId = params['donorId'];
      if (donorId) {
        this.searchForm.patchValue({ donorId });
        this.openEligibilityPanel();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isViewDisabled(): boolean {
    return !this.searchForm.get('donorId')?.value?.trim();
  }

  openEligibilityPanel(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const donorId = this.searchForm.get('donorId')?.value?.trim();
    if (!donorId) return;

    this.isLoadingDonor.set(true);

    this.eligibilityService.getDonorInfo(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info: DonorBasicInfoResponse) => {
          this.isLoadingDonor.set(false);
          const lastName = info.lastName || '';
          const firstName = info.firstName || '';
          const donorName = firstName ? `${lastName}, ${firstName}` : lastName;

          this.openPanel({
            donorId: info.donorId,
            donorName,
            dateOfBirth: info.dateOfBirth || '',
            sex: this.mapGender(info.gender),
            bloodType: info.bloodType || '',
            donorWeight: info.donorWeight
          });
        },
        error: (err) => {
          this.isLoadingDonor.set(false);
          this.snackbarService.showError(err?.message || 'Donor not found');
        }
      });
  }

  private openPanel(donorInput: DonorEligibilityInput): void {
    this.dialog.open(DonorEligibilityPanel, {
      width: '1100px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: donorInput,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop'
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.procedureCode) {
          this.snackbarService.showSuccess(
            `Selected: ${result.procedureCode} (${result.eligibilityStatus === 'Y' ? 'Eligible' : 'Override'})`
          );
        }
      });
  }

  private mapGender(value: string | null): string {
    if (!value) return '';
    const map: Record<string, string> = { M: 'Male', F: 'Female', U: 'Unknown' };
    return map[value.toUpperCase()] || value;
  }
}
