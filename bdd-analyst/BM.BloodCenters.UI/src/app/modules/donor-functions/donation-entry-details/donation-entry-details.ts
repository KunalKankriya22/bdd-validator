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
import { DonationEntryDetailsDialogComponent } from '@shared/components/donation-entry-details-dialog/donation-entry-details-dialog';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { RouteKey } from '../../../core/constants/route-keys';

@Component({
  selector: 'app-donation-entry-details',
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
  templateUrl: './donation-entry-details.html',
  styleUrls: ['./donation-entry-details.scss'],
})
export class DonationEntryDetailsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly menuService = inject(MenuService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donation Entry Details', link: null },
    ],
  };

  searchForm: FormGroup = this.fb.group({
    unitId: ['', Validators.required],
    collDate: [null],
  });

  get f() {
    return this.searchForm.controls;
  }

  ngOnInit(): void {
    const isChildRoute = this.route.parent?.routeConfig?.path?.includes('donations-on-hold') || false;
    const menuItem = this.menuService.findMenuItemByPath(ROUTE_REGISTRY[RouteKey.DonationEntryDetails].path);
    if (menuItem) {
      this.headerConfig = {
        ...this.headerConfig,
        title: menuItem.label,
        subtitle: menuItem.remarks?.trim() || menuItem.subtitle?.trim(),
      };
    }
    if (isChildRoute) {
      const parentMenuItem = this.menuService.findMenuItemByPath(ROUTE_REGISTRY[RouteKey.DonationsOnHoldQuery].path);
      this.headerConfig = {
        ...this.headerConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: parentMenuItem?.label || 'Donations on Hold Query', link: ROUTE_REGISTRY[RouteKey.DonationsOnHoldQuery].path },
          { label: this.headerConfig.title || 'Donation Entry Details' },
        ],
      };
    }

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const unitId = params['unitId'];
      const collDate = params['collDate'];

      if (unitId) {
        // Populate form and auto-open dialog
        this.searchForm.patchValue({
          unitId,
          collDate: collDate ? moment(collDate) : null
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

    const unitId = this.searchForm.get('unitId')?.value as string;
    const collDateValue = this.searchForm.get('collDate')?.value;
    const collDate = collDateValue ? moment(collDateValue).format('YYYY-MM-DD') : undefined;

    this.dialog.open(DonationEntryDetailsDialogComponent, {
      width: '1000px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { unitId, collDate },
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
