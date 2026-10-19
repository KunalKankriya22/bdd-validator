import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DonationDeferralAuditDrawerComponent } from './donation-deferral-audit-drawer';

@Component({
  selector: 'app-donation-deferral-audit-drawer-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './donation-deferral-audit-drawer-page.html',
  styleUrls: ['./donation-deferral-audit-drawer-page.scss'],
})
export class DonationDeferralAuditDrawerPageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Functions', link: null },
      { label: 'Registration', link: null },
      { label: 'Donation/Deferral Audit Details', link: null },
    ],
    title: 'Donation/Deferral Audit Details',
    subtitle: 'View comprehensive audit details for donation/deferral transactions.',
  };

  searchForm: FormGroup = this.fb.group({
    transactionId: ['', Validators.required],
  });

  get f() {
    return this.searchForm.controls;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Focus the first invalid control so keyboard/screen-reader users land on the error (WCAG 3.3.1). */
  private focusFirstInvalidField(form: FormGroup): void {
    const firstInvalidKey = Object.keys(form.controls)
      .find(key => form.controls[key].invalid);
    if (firstInvalidKey) {
      const el = document.querySelector(
        `[formControlName="${firstInvalidKey}"]`
      ) as HTMLElement;
      if (el) el.focus();
    }
  }

  openDrawer(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.focusFirstInvalidField(this.searchForm);
      return;
    }

    const transactionId = this.searchForm.get('transactionId')?.value as string;

    this.dialog.open(DonationDeferralAuditDrawerComponent, {
      width: '1000px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { transactionId },
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
}
