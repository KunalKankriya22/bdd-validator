import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { DriveStatisticsDialogComponent } from '@shared/components/drive-statistics-dialog/drive-statistics-dialog';

@Component({
  selector: 'app-drive-statistics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './drive-statistics.html',
  styleUrls: ['./drive-statistics.scss'],
})
export class DriveStatisticsComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();
  private dialogRef: MatDialogRef<DriveStatisticsDialogComponent> | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Drive Management', link: null },
      { label: 'Drive Statistics', link: null },
    ],
    title: 'Drive Statistics',
    subtitle: 'View drive statistics including donations, venipunctures, deferrals, unit details, and donor information.',
  };

  searchForm: FormGroup = this.fb.group({
    driveId: ['', Validators.required],
  });

  get f() {
    return this.searchForm.controls;
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.searchForm.controls)
      .find(key => this.searchForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) {
        el.focus();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDriveStatisticsDialog(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.dialogRef?.close();

    const driveId = this.searchForm.get('driveId')?.value as string;
    const chapterId = this.headerService.getCurrentChapterId();

    this.dialogRef = this.dialog.open(DriveStatisticsDialogComponent, {
      width: '960px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { driveId, chapterId },
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });

    this.dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.dialogRef = null);
  }
}
