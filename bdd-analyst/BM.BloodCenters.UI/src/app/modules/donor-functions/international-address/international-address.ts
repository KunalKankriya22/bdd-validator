import { Component, inject, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { InternationalAddressDialogData } from '@shared/models/international-address.model';

@Component({
  selector: 'app-international-address',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './international-address.html',
  styleUrl: './international-address.scss',
})
export class InternationalAddressComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  searchForm: FormGroup = this.fb.group({
    sponsorId: ['', Validators.required],
  });

  get f() {
    return this.searchForm.controls;
  }

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onViewInternationalAddress(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const sponsorId = this.searchForm.get('sponsorId')?.value as string;

    const dialogData: InternationalAddressDialogData = {
      existingAddress: null,
      targetTable: 'SPONSOR_CONTACT',
      recordKeyValues: [sponsorId],
      chapterId: this.headerService.getCurrentChapterId(),
      existingAddressId: null,
    };

    this.dialog.open(InternationalAddressDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: dialogData,
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
