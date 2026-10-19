import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { Facility, UnitTransferToTransfusionService } from './unit-transfer-to-transfusion.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

type ProcessStatus = 'idle' | 'running' | 'complete';

@Component({
  selector: 'app-transfer-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">Transfer process</h2>
    <mat-dialog-content class="dialog-content">
      <p>Extracting file for transfusion system.<br />Do you wish to continue?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button class="abort-btn" (click)="onAbort()">NO, ABORT</button>
      <button mat-raised-button class="continue-btn" (click)="onContinue()">YES, CONTINUE</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
    .dialog-title {
      font-family: Roboto;
      font-size: 18px;
      font-weight: 500;
      color: #1a1a1a;
      margin: 0;
      padding: 24px 24px 8px;
    }
    .dialog-content {
      padding: 8px 24px 16px;
      p {
        font-family: Roboto;
        font-size: 14px;
        font-weight: 400;
        color: #444;
        line-height: 22px;
        margin: 0;
      }
    }
    .dialog-actions {
      padding: 8px 24px 24px;
      gap: 8px;
    }
    .abort-btn {
      font-family: Roboto;
      font-weight: 500;
      font-size: 14px;
      color: #228189 !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    .abort-btn:focus-visible {
      outline: 2px solid #228189;
      outline-offset: 2px;
    }
    .continue-btn {
      background-color: #228189 !important;
      color: white !important;
      font-family: Roboto;
      font-weight: 500;
      font-size: 14px;
      border-radius: 4px;
      padding: 0 20px;
      height: 40px;
    }
    .continue-btn:focus-visible {
      outline: 2px solid #1a6970;
      outline-offset: 2px;
    }
  `,
  ],
})
export class TransferConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<TransferConfirmDialogComponent>);

  onAbort(): void {
    this.dialogRef.close(false);
  }

  onContinue(): void {
    this.dialogRef.close(true);
  }
}

@Component({
  selector: 'app-unit-transfer-to-transfusion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './unit-transfer-to-transfusion.html',
  styleUrls: ['./unit-transfer-to-transfusion.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitTransferToTransfusionComponent implements OnInit, OnDestroy {
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly transferService = inject(UnitTransferToTransfusionService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  receivingFacilities = signal<Facility[]>([]);
  facilitiesLoading = signal(false);

  facilityControl = new FormControl<string | null>(null, Validators.required);
  facilitySearchCtrl = new FormControl<string>('');

  private readonly facilitySearch = signal('');

  readonly filteredFacilities = computed(() => {
    const search = this.facilitySearch().toLowerCase();
    const facilities = this.receivingFacilities();
    if (!search) return facilities;
    return facilities.filter(f =>
      f.code.toLowerCase().includes(search) ||
      f.description.toLowerCase().includes(search)
    );
  });

  processStatus = signal<ProcessStatus>('idle');
  processStartTime = signal<string>('--:--');
  processEndTime = signal<string>('--:--');

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

  ngOnInit(): void {
    this.loadFacilities();
    this.facilitySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.facilitySearch.set(value || ''));
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetForm();
        this.loadFacilities();
      });
  }

  private loadFacilities(): void {
    this.facilitiesLoading.set(true);
    this.facilityControl.disable();
    this.transferService.getFacilities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facilities: Facility[]) => {
          this.receivingFacilities.set(facilities);
          this.facilitiesLoading.set(false);
          this.facilityControl.enable();
        },
        error: () => {
          this.facilitiesLoading.set(false);
          this.facilityControl.enable();
          this.snackBar.open('Failed to load facilities.', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFacilityChange(facilityId: string | null): void {
    if (!facilityId || this.processStatus() === 'running') return;
    this.openConfirmDialog();
  }

  private openConfirmDialog(): void {
    const dialogRef = this.dialog.open(TransferConfirmDialogComponent, {
      width: '420px',
      disableClose: true,
      ariaLabel: 'Transfer process confirmation',
      panelClass: 'transfer-confirm-dialog',
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.startTransfer();
      } else {
        this.resetForm();
      }
    });
  }

  private formatTime(iso: string): string {
    const m = moment(iso);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : moment().format('DD-MMM-YYYY HH:mm').toUpperCase();
  }

  private startTransfer(): void {
    const facilityId = this.facilityControl.value!;
    this.processStatus.set('running');
    this.facilityControl.disable();
    this.processStartTime.set('--:--');
    this.processEndTime.set('--:--');

    this.transferService.executeTransfer(facilityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const result = response.data?.[0];
          this.processStartTime.set(result?.processStartTime ? this.formatTime(result.processStartTime) : moment().format('DD-MMM-YYYY HH:mm').toUpperCase());
          this.processEndTime.set(result?.processEndTime ? this.formatTime(result.processEndTime) : moment().format('DD-MMM-YYYY HH:mm').toUpperCase());
          this.processStatus.set('complete');
          this.facilityControl.enable();
        },
        error: () => {
          this.processStatus.set('idle');
          this.processStartTime.set('--:--');
          this.processEndTime.set('--:--');
          this.facilityControl.enable();
          this.facilityControl.setValue(null, { emitEvent: false });
          this.snackBar.open('Transfer failed. Please try again.', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  onTransferOk(): void {
    this.snackBar.open('Transfer complete.', 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
    this.resetForm();
  }

  clearForm(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.facilityControl.enable();
    this.facilityControl.reset(null);
    this.facilityControl.markAsUntouched();
    this.facilityControl.markAsPristine();
    this.facilitySearchCtrl.setValue('', { emitEvent: false });
    this.facilitySearch.set('');
    this.processStatus.set('idle');
    this.processStartTime.set('--:--');
    this.processEndTime.set('--:--');
  }
}
