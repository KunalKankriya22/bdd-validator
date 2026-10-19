import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { DetachDonorFromDonationService } from './services/detach-donor-from-donation.service';
import { BleedTimeDetailsComponent } from './bleed-time-details/bleed-time-details';
import { DonationWithDonorDto } from './models/detach-donor-from-donation.model';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

@Component({
  selector: 'app-detach-donor-from-donation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSelectModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent
  ],
  templateUrl: './detach-donor-from-donation.html',
  styleUrl: './detach-donor-from-donation.scss'
})
export class DetachDonorFromDonationComponent implements OnInit, OnDestroy {
  @ViewChild('searchUnitId') unitIdField!: UnitIdFieldComponent;
  @ViewChild('verifyUnitId') verifyUnitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DetachDonorFromDonationService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  private static readonly MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  private static readonly GENDER_MAP: Record<string, string> = { M: 'Male', F: 'Female' };

  private static readonly ERROR_CODE_MAP: Record<string, string> = {
    '0080': 'Unit ID is required.',
    '1230': 'Unit ID not found in donations.',
    '4014': 'Entry check validation failed.',
    '11107': 'Invalid double stick value.',
    '16015': 'Confirmation Unit ID does not match the original.',
    '16016': 'Invalid lookup person.',
    '16017': 'Invalid screener.',
    '16018': 'Invalid physical person.',
    '16058': 'Invalid phlebotomist.',
    '16109': 'Insert user not found.',
    '16110': 'Donor successfully detached from donation.',
    '16112': 'Error removing interdiction.',
    '16113': 'Error placing NODON interdiction.',
    '16206': 'Invalid ISBT-128 prefix.',
    '16211': 'Invalid ISBT-128 numeric portion.',
    '17003': 'No donor attached to this donation.'
  };

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Detach Donor from Donation', link: null }
    ],
    title: 'Detach Donor from Donation',
    subtitle: 'Remove the association between a donor and a donation.'
  };

  // Signals
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly donationData = signal<DonationWithDonorDto | null>(null);
  protected readonly availableDonations = signal<DonationWithDonorDto[]>([]);

  // Computed
  protected readonly isDataLoaded = computed(() => this.donationData() !== null);
  protected readonly donorId = computed(() => this.donationData()?.donorId ?? '--');
  protected readonly enteredBy = computed(() => this.donationData()?.enteredBy ?? '--');

  protected readonly formattedDob = computed(() => {
    const dob = this.donationData()?.dob ?? '';
    return this.formatDateString(dob);
  });

  protected readonly formattedGender = computed(() => {
    const gender = this.donationData()?.sex ?? '';
    return DetachDonorFromDonationComponent.GENDER_MAP[gender.toUpperCase()] ?? gender;
  });

  // Forms
  searchForm!: FormGroup;
  private validatedUnitId: string | null = null;
  private verifiedUnitId: string | null = null;
  private validatedCodeScheme: string = 'I';

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || 'Detach Donor from Donation', link: null }
          ],
          title: pageData.title || 'Detach Donor from Donation',
          subtitle: pageData.subtitle || 'Remove the association between a donor and a donation.'
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
      collectionDate: [null, Validators.required]
    });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.validatedUnitId = this.unitIdField.parsedUnitId;
    this.validatedCodeScheme = data.codeScheme;
    if (!this.validatedUnitId) return;

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    this.service.getDonationsByUnitId(this.validatedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.length > 0) {
            this.availableDonations.set(response.data);
            const donation = response.data[0];
            this.donationData.set(donation);
            this.searchForm.get('collectionDate')?.setValue(donation.collDate);
            this.validateDonationData(this.validatedUnitId!, donation.collDate);
          } else {
            this.availableDonations.set([]);
            this.donationData.set(null);
            this.snackbar.showError(this.formatErrorMessage(response.errorCode || response.statusCode, response.message, 'No donation found for the entered Unit ID.'));
            this.loading.set(false);
          }
        },
        error: (err) => {
          this.availableDonations.set([]);
          this.donationData.set(null);
          this.snackbar.showError(this.formatErrorMessage(err?.error?.errorCode || err?.error?.statusCode || err?.status, err?.error?.message || err?.message, 'Failed to fetch donation details.'));
          this.loading.set(false);
        }
      });
  }

  onUnitCleared(): void {
    this.validatedUnitId = null;
  }

  onVerifyUnitValidated(data: UnitValidationResponse): void {
    this.verifiedUnitId = this.verifyUnitIdField.parsedUnitId;
  }

  onVerifyUnitCleared(): void {
    this.verifiedUnitId = null;
  }

  onCollectionDateChange(collDate: string): void {
    const donation = this.availableDonations().find(d => d.collDate === collDate);
    if (!donation) return;

    this.donationData.set(donation);
    this.loading.set(true);
    this.validateDonationData(this.validatedUnitId!, collDate);
  }

  private validateDonationData(unitId: string, collDate: string): void {
    const formattedDate = moment(collDate).format('YYYY-MM-DD');

    this.service.validateDonation(unitId, formattedDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (!response.success) {
            this.donationData.set(null);
            this.snackbar.showError(this.formatErrorMessage(response.errorCode || response.statusCode, response.message, 'Validation failed for this donation.'));
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.donationData.set(null);
          this.snackbar.showError(this.formatErrorMessage(err?.error?.errorCode || err?.error?.statusCode || err?.status, err?.error?.message || err?.message, 'Validation failed for this donation.'));
        }
      });
  }

  onDetachDonor(): void {
    if (!this.verifyUnitIdField?.isValid || !this.verifiedUnitId) {
      this.snackbar.showError('Please enter and validate the confirmation Unit ID.');
      this.verifyUnitIdField?.focus();
      return;
    }

    if (this.verifiedUnitId !== this.validatedUnitId) {
      this.snackbar.showError('Unit ID does not match initial entry.');
      this.verifyUnitIdField?.focus();
      return;
    }

    this.showDetachConfirmation();
  }

  private showDetachConfirmation(): void {
    const donorIdValue = this.donationData()?.donorId;
    const dialogData: ConfirmActionDialogData = {
      title: 'Confirm Donor Detachment',
      message: `You are about to remove the association between donor '${donorIdValue}' and this donation. Do you want to proceed?`,
      confirmText: 'YES, DETACH DONOR',
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
    const unitId = this.validatedUnitId!;
    const collDateRaw = this.searchForm.get('collectionDate')?.value as string;
    const collDate = collDateRaw ? moment(collDateRaw).format('YYYY-MM-DD') : '';
    const chapterId = this.headerService.getCurrentChapterId() || '';

    this.loading.set(true);
    this.error.set(null);

    this.service.detachDonor({
      unitId,
      firstUnitId: unitId,
      secondUnitId: this.verifiedUnitId || '',
      collDate,
      entryCheck: 'YES',
      chapterId,
      codeScheme: this.validatedCodeScheme
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const code = (response.errorCode || response.statusCode)?.toString();
          if (response.success || code === '16110') {
            this.snackbar.showSuccess('Donor ID, interdictions and audit record removed for the donation.');
            this.resetForm();
          } else {
            this.snackbar.showError(this.formatErrorMessage(code, response.message, 'Failed to detach donor from donation.'));
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.snackbar.showError(this.formatErrorMessage(err?.error?.errorCode || err?.error?.statusCode || err?.status, err?.error?.message || err?.message, 'Failed to detach donor from donation.'));
          this.loading.set(false);
        }
      });
  }

  openEntryDetails(): void {
    if (!this.validatedUnitId) return;
    const unitId = this.validatedUnitId;

    const collDateRaw = this.searchForm.get('collectionDate')?.value as string;
    const collDate = collDateRaw ? moment(collDateRaw).format('YYYY-MM-DD') : undefined;

    this.dialog.open(BleedTimeDetailsComponent, {
      width: '1077px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: { unitId, collDate },
      panelClass: 'find-donor-panel',
      position: { bottom: '0px', right: '0px' },
      hasBackdrop: true,
    });
  }

  openAlternateAddress(): void {
    const donorId = this.donationData()?.donorId;
    if (!donorId) return;

    const dialogData: AlternateDemographicsDialogData = {
      donorId: String(donorId),
      readOnly: false,
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
    this.searchForm.reset({ collectionDate: null });
    this.unitIdField?.clear();
    this.verifyUnitIdField?.clear();
    this.verifiedUnitId = null;
    this.validatedUnitId = null;
    this.validatedCodeScheme = 'I';
    this.availableDonations.set([]);
    this.donationData.set(null);
    this.hasSearched.set(false);
    this.error.set(null);
    this.loading.set(false);
  }

  private formatErrorMessage(code: string | number | undefined, serverMessage: string | undefined, fallback: string): string {
    const errorCode = code?.toString();
    if (errorCode && DetachDonorFromDonationComponent.ERROR_CODE_MAP[errorCode]) {
      return `Error ${errorCode}: ${DetachDonorFromDonationComponent.ERROR_CODE_MAP[errorCode]}`;
    }
    const numCode = Number(errorCode);
    if (errorCode && numCode > 599) {
      return `Error ${errorCode}: ${serverMessage || fallback}`;
    }
    return serverMessage || fallback;
  }

  formatCollDate(dateStr: string): string {
    return this.formatDateString(dateStr);
  }

  private formatDateString(dateStr: string): string {
    if (!dateStr) return '--';
    const m = moment(dateStr);
    if (!m.isValid()) return dateStr;
    const day = m.format('DD');
    const monthIndex = m.month();
    const year = m.format('YYYY');
    return `${day}-${DetachDonorFromDonationComponent.MONTH_NAMES[monthIndex]}-${year}`;
  }

}
