import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { DetachDonorFromDeferralService } from './services/detach-donor-from-deferral.service';
import { DeferralWithDonorDto } from './models/detach-donor-from-deferral.model';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { normalizeDeferralId } from '@shared/utils/deferral-id.util';

@Component({
  selector: 'app-detach-donor-from-deferral',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
    MatDialogModule,
    MatSelectModule,
    PageHeaderWithBreadcrumb,
    A11yModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './detach-donor-from-deferral.html',
  styleUrl: './detach-donor-from-deferral.scss'
})
export class DetachDonorFromDeferralComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DetachDonorFromDeferralService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbar = inject(SnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroy$ = new Subject<void>();

  private static readonly MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  private static readonly GENDER_MAP: Record<string, string> = { M: 'Male', F: 'Female' };

  private static readonly ERROR_CODE_MAP: Record<string, string> = {
    '16060': 'Invalid deferral ID.',
    '16145': 'No donor attached to this deferral.',
    '4014': 'Confirmation required.',
    '16102': 'Confirmation deferral ID does not match.',
    '16158': 'Donor detached successfully.',
    '16112': 'Failed to remove interdictions.',
    '16113': 'Failed to place NODON interdiction.'
  };

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Detach Donor from Deferral', link: null }
    ]
  };

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly deferralData = signal<DeferralWithDonorDto | null>(null);
  protected readonly availableDeferrals = signal<DeferralWithDonorDto[]>([]);

  protected readonly isDataLoaded = computed(() => this.deferralData() !== null);
  protected readonly donorId = computed(() => this.deferralData()?.donorId ?? '--');
  protected readonly enteredBy = computed(() => this.deferralData()?.enteredBy ?? '--');

  protected readonly formattedDob = computed(() => {
    const dob = this.deferralData()?.dateOfBirth ?? '';
    return this.formatDateString(dob);
  });

  protected readonly formattedGender = computed(() => {
    const gender = this.deferralData()?.gender ?? '';
    return DetachDonorFromDeferralComponent.GENDER_MAP[gender.toUpperCase()] ?? gender;
  });

  protected readonly formattedAbo = computed(() => {
    const abo = this.deferralData()?.aboDescription;
    return abo || 'NO ABO';
  });

  searchForm!: FormGroup;
  verifyDeferralIdControl = new FormControl('', Validators.required);

  // Double-entry state machine for search field (like Update Deferral)
  deferralIdDoubleEntry: 'idle' | 'pending' | 'confirmed' = 'idle';
  private pendingDeferralId: string | null = null;
  private confirmedDeferralId: string | null = null;

  // Double-entry state machine for verify field (like Update Deferral)
  verifyDeferralIdDoubleEntry: 'idle' | 'pending' = 'idle';
  private pendingVerifyDeferralId: string | null = null;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || 'Detach Donor from Deferral', link: null }
          ],
          title: pageData.title || 'Detach Donor from Deferral',
          subtitle: pageData.subtitle || 'Remove the association between a donor and a deferral.',
          actions: this.headerConfig.actions
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.resetForm());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.searchForm = this.fb.group({
      deferralId: ['', Validators.required],
      collectionDate: [null]
    });
  }

  private clearDeferralData(): void {
    this.deferralData.set(null);
    this.availableDeferrals.set([]);
    this.verifyDeferralIdControl.reset();
    this.searchForm.get('collectionDate')?.reset();
    this.error.set(null);
    this.deferralIdDoubleEntry = 'idle';
    this.pendingDeferralId = null;
    this.confirmedDeferralId = null;
    this.verifyDeferralIdDoubleEntry = 'idle';
    this.pendingVerifyDeferralId = null;
  }

  onDeferralIdEntered(): void {
    if (this.loading()) return;
    const ctrl = this.searchForm.get('deferralId');
    const deferralId = ctrl?.value?.trim();
    if (!deferralId) return;
    if (ctrl?.invalid) return;

    const normalizedId = normalizeDeferralId(deferralId);
    if (!normalizedId) {
      ctrl?.setErrors({ serverError: 'Invalid Deferral ID' });
      ctrl?.markAsTouched();
      return;
    }

    // If already confirmed and same ID, allow reload
    if (normalizedId === this.confirmedDeferralId && this.deferralIdDoubleEntry === 'confirmed') {
      this.onSearch();
      return;
    }

    // If different from confirmed, reset and start new double-entry
    if (this.deferralIdDoubleEntry === 'confirmed' && normalizedId !== this.confirmedDeferralId) {
      this.clearDeferralData();
      // Fall through to start new double-entry
    }

    // FIRST ENTRY - Store and clear field
    if (this.deferralIdDoubleEntry === 'idle') {
      this.pendingDeferralId = normalizedId;
      this.deferralIdDoubleEntry = 'pending';
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.markAsUntouched();
      this.cdr.markForCheck();
      return;
    }

    // SECOND ENTRY - Validate match
    if (this.deferralIdDoubleEntry === 'pending') {
      if (normalizedId === this.pendingDeferralId) {
        // ✅ MATCH - Proceed with search
        this.deferralIdDoubleEntry = 'confirmed';
        this.confirmedDeferralId = normalizedId;
        ctrl?.setValue(normalizedId, { emitEvent: false });
        this.onSearch();
      } else {
        // ❌ MISMATCH - Reset and show error
        this.deferralIdDoubleEntry = 'idle';
        this.pendingDeferralId = null;
        const msg = 'Deferral ID did not match. Please try again.';
        ctrl?.setValue('', { emitEvent: false });
        ctrl?.setErrors({ serverError: msg });
        ctrl?.markAsTouched();
      }
      this.cdr.markForCheck();
    }
  }

  onDeferralIdBlur(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    // Don't trigger if clicking on collection date dropdown or other fields
    if (relatedTarget?.tagName === 'MAT-SELECT' || relatedTarget?.tagName === 'BUTTON') return;
    this.onDeferralIdEntered();
  }

  onDeferralIdEnter(event: Event): void {
    event.preventDefault();
    this.searchForm.get('deferralId')?.markAsTouched();
    this.onDeferralIdEntered();
  }

  onDeferralIdTab(event: Event): void {
    const ctrl = this.searchForm.get('deferralId');
    const value = ctrl?.value?.trim();

    if (value) {
      event.preventDefault();
      this.onDeferralIdEntered();
      return;
    }

    // Keep focus in field if pending or invalid
    if (this.deferralIdDoubleEntry === 'pending' || ctrl?.invalid || !value) {
      event.preventDefault();
      document.getElementById('deferralIdInput')?.focus();
    }
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    const deferralId = this.searchForm.get('deferralId')?.value as string;

    this.service.getDeferralDetails(deferralId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.liveAnnouncer.announce('Loading complete', 'polite');
          if (response.success && response.data?.length > 0) {
            this.availableDeferrals.set(response.data);
            const deferral = response.data[0];
            this.deferralData.set(deferral);
            this.searchForm.get('collectionDate')?.setValue(deferral.transactionId);
          } else {
            this.availableDeferrals.set([]);
            this.deferralData.set(null);
            this.snackbar.showError(this.formatErrorMessage(response.errorCode || response.statusCode, response.message, 'No deferral found for the entered Deferral ID.'));
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.liveAnnouncer.announce('Loading complete', 'polite');
          this.availableDeferrals.set([]);
          this.deferralData.set(null);
          this.snackbar.showError(this.formatErrorMessage(err?.error?.errorCode || err?.error?.statusCode || err?.status, err?.error?.message || err?.message, 'Failed to fetch deferral details.'));
        }
      });
  }

  onCollectionDateChange(transactionId: string): void {
    const deferral = this.availableDeferrals().find(d => d.transactionId === transactionId);
    if (!deferral) return;
    this.deferralData.set(deferral);
  }

  formatCollDate(dateStr: string): string {
    return this.formatDateString(dateStr);
  }

  onVerifyDeferralIdEntered(): void {
    if (this.loading()) return;
    const ctrl = this.verifyDeferralIdControl;
    const deferralId = ctrl?.value?.trim();
    if (!deferralId) return;
    if (ctrl?.invalid) return;

    const normalizedId = normalizeDeferralId(deferralId);
    if (!normalizedId) {
      ctrl?.setErrors({ serverError: 'Invalid Deferral ID' });
      ctrl?.markAsTouched();
      return;
    }

    // FIRST ENTRY - Store and clear field
    if (this.verifyDeferralIdDoubleEntry === 'idle') {
      this.pendingVerifyDeferralId = normalizedId;
      this.verifyDeferralIdDoubleEntry = 'pending';
      ctrl?.setValue('', { emitEvent: false });
      ctrl?.markAsUntouched();
      this.cdr.markForCheck();
      return;
    }

    // SECOND ENTRY - Validate match
    if (this.verifyDeferralIdDoubleEntry === 'pending') {
      if (normalizedId === this.pendingVerifyDeferralId) {
        // ✅ MATCH - Now validate against confirmed deferral ID
        if (normalizedId === this.confirmedDeferralId) {
          this.verifyDeferralIdDoubleEntry = 'idle';
          this.pendingVerifyDeferralId = null;
          ctrl?.setValue(normalizedId, { emitEvent: false });
          ctrl?.setErrors(null);
        } else {
          // Mismatch with search field deferral ID
          this.verifyDeferralIdDoubleEntry = 'idle';
          this.pendingVerifyDeferralId = null;
          const msg = 'Deferral ID does not match the initial entry.';
          ctrl?.setValue('', { emitEvent: false });
          ctrl?.setErrors({ serverError: msg });
          ctrl?.markAsTouched();
        }
      } else {
        // ❌ MISMATCH - Double entry didn't match
        this.verifyDeferralIdDoubleEntry = 'idle';
        this.pendingVerifyDeferralId = null;
        const msg = 'Deferral ID did not match. Please try again.';
        ctrl?.setValue('', { emitEvent: false });
        ctrl?.setErrors({ serverError: msg });
        ctrl?.markAsTouched();
      }
      this.cdr.markForCheck();
    }
  }

  onVerifyDeferralIdBlur(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement;
    // Don't trigger if clicking the detach button
    if (relatedTarget?.classList.contains('detach-btn')) return;
    this.onVerifyDeferralIdEntered();
  }

  onVerifyDeferralIdEnter(event: Event): void {
    event.preventDefault();
    this.verifyDeferralIdControl.markAsTouched();
    this.onVerifyDeferralIdEntered();
  }

  onVerifyDeferralIdTab(event: Event): void {
    const ctrl = this.verifyDeferralIdControl;
    const value = ctrl?.value?.trim();

    if (value) {
      event.preventDefault();
      this.onVerifyDeferralIdEntered();
      return;
    }

    // Keep focus in field if pending or invalid
    if (this.verifyDeferralIdDoubleEntry === 'pending' || ctrl?.invalid || !value) {
      event.preventDefault();
      document.getElementById('verifyDeferralIdInput')?.focus();
    }
  }

  onDetachDeferral(): void {
    const deferralId = this.confirmedDeferralId;
    const verifyValue = this.verifyDeferralIdControl.value?.trim();

    if (!deferralId) {
      this.snackbar.showError('Please enter and confirm Deferral ID in search field first.');
      return;
    }

    if (!verifyValue) {
      this.verifyDeferralIdControl.markAsTouched();
      this.snackbar.showError('Please re-enter and confirm Deferral ID in the verification field.');
      return;
    }

    // Verify field must also be confirmed (double-entry completed)
    if (verifyValue !== deferralId) {
      this.snackbar.showError('Deferral ID does not match initial entry.');
      this.verifyDeferralIdControl.setErrors({ mismatch: true });
      return;
    }

    this.showDetachConfirmation();
  }

  private showDetachConfirmation(): void {
    const donorIdValue = this.deferralData()?.donorId;
    const dialogData: ConfirmActionDialogData = {
      title: 'Confirm Deferral Detachment',
      message: `You are about to remove the association between donor '${donorIdValue}' and a deferral. Do you want to proceed?`,
      confirmText: 'YES, DETACH DEFERRAL',
      cancelText: 'CANCEL'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performDetach();
        }
      });
  }

  private performDetach(): void {
    const deferralId = this.confirmedDeferralId!;

    this.loading.set(true);
    this.error.set(null);

    this.service.executeDeferralDetach({
      deferralId,
      confirmationDeferralId: deferralId
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const code = (response.errorCode || response.statusCode)?.toString();
          if (response.success || code === '16158') {
            this.snackbar.showSuccess('Donor successfully detached from deferral.');
            this.resetForm();
            setTimeout(() => document.getElementById('deferralIdInput')?.focus(), 50);
          } else {
            this.snackbar.showError(this.formatErrorMessage(code, response.message, 'Failed to detach donor from deferral.'));
          }
          this.loading.set(false);
          this.liveAnnouncer.announce('Detach operation complete', 'polite');
        },
        error: (err) => {
          this.snackbar.showError(this.formatErrorMessage(err?.error?.errorCode || err?.error?.statusCode || err?.status, err?.error?.message || err?.message, 'Failed to detach donor from deferral.'));
          this.loading.set(false);
          this.liveAnnouncer.announce('Detach operation complete', 'polite');
        }
      });
  }

  openEntryDetails(): void {
    // TODO: Will be implemented with a dedicated entry details window
  }

  openAlternateAddress(): void {
    const donorId = this.deferralData()?.donorId;
    if (!donorId) return;

    const dialogData: AlternateDemographicsDialogData = {
      donorId: String(donorId),
      readOnly: true,
    };

    this.dialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
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

  resetForm(): void {
    this.searchForm.reset({ deferralId: '', collectionDate: null });
    this.verifyDeferralIdControl.reset();
    this.availableDeferrals.set([]);
    this.deferralData.set(null);
    this.hasSearched.set(false);
    this.error.set(null);
    this.loading.set(false);
    this.deferralIdDoubleEntry = 'idle';
    this.pendingDeferralId = null;
    this.confirmedDeferralId = null;
    this.verifyDeferralIdDoubleEntry = 'idle';
    this.pendingVerifyDeferralId = null;
  }

  /** WCAG 3.3.1: Focus the first invalid form control so keyboard/screen-reader users land on the error. */
  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.searchForm.controls)
      .find(key => this.searchForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) {
        el.focus();
        return;
      }
    }
    if (this.verifyDeferralIdControl.invalid) {
      document.getElementById('verifyDeferralIdInput')?.focus();
    }
  }

  private formatErrorMessage(code: string | number | undefined, serverMessage: string | undefined, fallback: string): string {
    const errorCode = code?.toString();
    if (errorCode && DetachDonorFromDeferralComponent.ERROR_CODE_MAP[errorCode]) {
      return `Error ${errorCode}: ${DetachDonorFromDeferralComponent.ERROR_CODE_MAP[errorCode]}`;
    }
    const numCode = Number(errorCode);
    if (errorCode && numCode > 599) {
      return `Error ${errorCode}: ${serverMessage || fallback}`;
    }
    return serverMessage || fallback;
  }

  private formatDateString(dateStr: string): string {
    if (!dateStr) return '--';
    const m = moment(dateStr);
    if (!m.isValid()) return dateStr;
    const day = m.format('DD');
    const monthIndex = m.month();
    const year = m.format('YYYY');
    return `${day}-${DetachDonorFromDeferralComponent.MONTH_NAMES[monthIndex]}-${year}`;
  }

  get f() {
    return this.searchForm.controls;
  }
}
