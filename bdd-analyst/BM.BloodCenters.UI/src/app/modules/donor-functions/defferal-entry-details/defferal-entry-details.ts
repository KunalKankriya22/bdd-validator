import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DeferralEntryDetailsDialogComponent } from '@shared/components/deferral-entry-details-dialog/deferral-entry-details-dialog';

@Component({
  selector: 'app-defferal-entry-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './defferal-entry-details.html',
  styleUrls: ['./defferal-entry-details.scss'],
})
export class DefferalEntryDetailsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Functions', link: null },
      { label: 'Deferral Entry Details', link: null },
    ],
    title: 'Deferral Entry Details',
    subtitle: 'View deferral entry details including donor demographics, address, and donation attributes.',
  };

  searchForm: FormGroup = this.fb.group({
    donorId: ['', Validators.required],
    driveDate: [null],
  });

  get f() {
    return this.searchForm.controls;
  }

  ngOnInit(): void {
    // Read query parameters from route and auto-open dialog if provided
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const donorId = params['donorId'];
      const driveDate = params['driveDate'];

      if (donorId) {
        // Populate form and auto-open dialog
        this.searchForm.patchValue({
          donorId,
          driveDate: driveDate ? moment(driveDate) : null
        });
        this.openEntryDetailsDialog();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.searchForm.controls)
      .find(key => this.searchForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  openEntryDetailsDialog(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    const donorId = this.searchForm.get('donorId')?.value as string;
    const driveDateValue = this.searchForm.get('driveDate')?.value;
    const driveDate = driveDateValue ? moment(driveDateValue).format('YYYY-MM-DD') : '';

    this.dialog.open(DeferralEntryDetailsDialogComponent, {
      width: '1200px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { donorId, driveDate },
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
