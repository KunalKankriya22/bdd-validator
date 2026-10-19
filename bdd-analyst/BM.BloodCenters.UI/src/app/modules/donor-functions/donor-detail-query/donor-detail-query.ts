import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil, filter } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DonorDetailQueryService } from './services/donor-detail-query.service';
import {
  DonorDetail,
  DonorEligibility,
  DonorAttribute,
  QuickLink,
} from './models/donor-detail-query.model';
import { DocumentsDialog, DocumentsDialogData } from './documents-dialog/documents-dialog';
import { DonorStateService } from '../shared/services/donor-state.service';
import { SearchForDonorDialog } from '@shared/components/search-for-donor/search-for-donor';
import { SearchForDonorDialogResult } from '@shared/components/search-for-donor/search-for-donor.model';
import { HeaderService } from '@shared/services/header.service';
import { DonorWithinTestDialogComponent } from '../donor-within-test/donor-within-test-dialog.component';
import { DonorDemographicsComponent } from '../donor-demographics/donor-demographics';
import { DonorDemographicsDialogData } from '../donor-demographics/models/donor-demographics.model';
import { DonorAttributesComponent } from '../donor-profile/donor-profile-maintenance/donor-attributes/donor-attributes.component';
import { DonorInterdictionsContentComponent } from '../donor-profile/donor-interdictions/donor-interdictions-content.component';
import { DonorCommunicationsComponent } from '@shared/components/donor-communications/donor-communications';
import { ViewLettersDialogComponent } from '@shared/components/donor-communications/dialogs/view-letters/view-letters';
import { NotificationLogDialogComponent, NotificationLogDialogData } from '@shared/components/notification-log-dialog/notification-log-dialog';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ViewNotificationLetterDialog } from '@shared/components/view-notification-letter-dialog/view-notification-letter-dialog';
import { ViewNotificationLetterDialogData } from '@shared/components/view-notification-letter-dialog/view-notification-letter-dialog.model';
import { DonorNotesDialog, DonorNotesDialogData } from './donor-notes-dialog/donor-notes-dialog';
import { DonorLettersDialog, DonorLettersDialogData } from './donor-letters-dialog/donor-letters-dialog';
import { CumulativeLogsDialog, CumulativeLogsDialogData } from './cumulative-logs-dialog/cumulative-logs-dialog';
import { YtdLossDialog } from './ytd-loss-dialog/ytd-loss-dialog';
import { YtdLossDialogData } from './models/donor-detail-query.model';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { DonationDetailsDialogComponent } from '../donor-profile/donation-details/donation-details-dialog/donation-details-dialog';
import { DonationDetailsData } from '../donor-profile/donation-details/models/donation-details.model';
import { DonorHistoryPanelComponent } from './donor-history-panel/donor-history-panel';
import { DonorHistoryPanelData } from './donor-history-panel/donor-history-panel.model';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';

/**
 * Internal dialog component for displaying donor interdictions with header
 * This provides the header wrapper matching the pattern from multiple-donors-query
 */
@Component({
  selector: 'app-donor-interdictions-dialog-internal',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    DonorInterdictionsContentComponent
  ],
  template: `
    <div class="side-panel-container">
      <div class="side-panel-header">
        <h2 class="side-panel-title" mat-dialog-title>Donor Interdictions</h2>
        <button
          type="button"
          mat-icon-button
          class="side-panel-close"
          aria-label="Close panel"
          (click)="onClose()">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>
      <div class="side-panel-content-wrapper">
        <app-donor-interdictions-content
          [donorId]="donorId"
          (closePanel)="onClose()">
        </app-donor-interdictions-content>
      </div>
      <div class="side-panel-footer">
        <button mat-flat-button class="close-btn" type="button" (click)="onClose()">CLOSE</button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }

    .side-panel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .side-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .side-panel-title {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .side-panel-close mat-icon {
      color: rgba(0, 0, 0, 0.54);
    }

    .side-panel-close:hover mat-icon {
      color: rgba(0, 0, 0, 0.87);
    }

    .side-panel-content-wrapper {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .side-panel-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 14px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      background: #ffffff;
      flex-shrink: 0;
    }

    .close-btn {
      background-color: #228189 !important;
      color: #fff !important;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.4px;
      border-radius: 4px;
      min-width: 72px;
      height: 36px;
    }
  `]
})
class DonorInterdictionsDialogInternal {
  donorId: string = '';
  private dialogRef = inject(MatDialogRef<DonorInterdictionsDialogInternal>);

  onClose(): void {
    this.dialogRef.close();
  }
}

/**
 * Donor Detail Query Component (SDONQ)
 * MLT-10898: Main component for viewing donor details, eligibility, and attributes
 */
@Component({
  selector: 'app-donor-detail-query',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    DataTable,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './donor-detail-query.html',
  styleUrl: './donor-detail-query.scss',
})
export class DonorDetailQuery implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly donorService = inject(DonorDetailQueryService);
  private readonly donorStateService = inject(DonorStateService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  readonly donorData = signal<DonorDetail | null>(null);
  readonly eligibilityData = signal<DonorEligibility[]>([]);
  readonly attributesData = signal<DonorAttribute[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly hasDonor = computed(() => this.donorData() !== null);
  readonly hasEligibility = computed(() => this.eligibilityData().length > 0);
  readonly hasAttributes = computed(() => this.attributesData().length > 0);

  // Page header configuration
  // Title will come from menu items API via PageHeaderService
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Detail Query', link: null },
    ],
    actions: [],
  };

  // Quick Links configuration
  readonly quickLinks = computed<QuickLink[]>(() => {
    const hasDocuments = this.donorData()?.hasDocuments || false;

    return [
      { label: 'DEMOGRAPHICS', icon: 'person', route:  'demographics', enabled: true },
      { label: 'TEST RESULTS', icon: 'science', route: 'test-results', enabled: true },
      { label: 'BLOOD LOSS', icon: 'history', route: 'cumulative-logs', enabled: true },
      { label: 'DONATIONS', icon: 'volunteer_activism',route: 'donations', enabled: true },
      { label: 'DONOR INTERDICTIONS', icon: 'block',route: 'donor-interdictions', enabled: true },
      { label: 'DONOR ATTRIBUTES', icon: 'label', route: 'donor-attributes', enabled: true },
      { label: 'DONOR ANTIGENS', icon: 'biotech', route: '/donor-functions/donor-profile/donor-profile-queries/donor-antigens-query', enabled: true },
      { label: 'MERGED DONORS', icon: 'merge', route: 'merged-donors', enabled: true },
      { label: 'DONOR COMMUNICATION', icon: 'chat', route: 'donor-communications', enabled: true },
      { label: 'COMMUNICATION LETTERS', icon: 'mail', route: 'communication-letters', enabled: true },
      { label: 'DONOR NOTIFICATION', icon: 'notifications', route: 'notification-log', enabled: true },
      { label: 'NOTIFICATION LETTERS', icon: 'email', route: 'notification-letters', enabled: true },
      { label: 'ALTERNATE ADDRESS', icon: 'home', route: 'alternate-address', enabled: true},
      { label: 'CONSENTS', icon: 'assignment', route: 'consents', enabled: true },
      { label: 'DOCUMENTS', icon: 'description', route: 'documents', enabled: hasDocuments },
      { label: 'DONOR LETTERS', icon: 'description', route: 'donor-letters', enabled: true },
      { label: 'DONOR NOTES', icon: 'notes', route: 'donor-notes', enabled: true },
    ];
  });

  // Eligibility table configuration
  eligibilityTableConfig: DataTableConfig<DonorEligibility> = {
    columns: [
      {
        key: 'proc',
        header: 'Proc',
      },
      {
        key: 'status',
        header: 'Status',
      },
      {
        key: 'eligibilityDate',
        header: 'Eligibility Date',
        valueFormatter: (value: string) => this.donorService.formatDate(value),
      },
      {
        key: 'reason',
        header: 'Reason',
        sortable: false,
      },
    ],
    showTableOnEmpty: false,
    noDataIcon: 'edit',
    emptyMessage: 'No eligibility records available',
    emptySubMessage: 'Eligibility information will appear here when available',
  };

  // Attributes table configuration
  attributesTableConfig: DataTableConfig<DonorAttribute> = {
    columns: [
      {
        key: 'code',
        header: 'Code',
        sortable: false,
      },
      {
        key: 'type',
        header: 'Type',
        sortable: false,
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
      },
    ],
    showTableOnEmpty: false,
    noDataIcon: 'edit',
    emptyMessage: 'No attributes available',
    emptySubMessage: 'Donor attributes will appear here when assigned',
  };

  ngOnInit(): void {
    // Subscribe to chapter changes
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload donor data if a donor is currently selected
        const donorId = this.donorData()?.donorId;
        if (donorId) {
          this.loadDonorDetail(donorId);
        }
      });

    // Priority 1: Check query params (from direct navigation or search return)
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        filter((params: Params) => !!params['donorId'])
      )
      .subscribe((params: Params) => {
        const donorId = params['donorId'];
        // Save to state service for persistence
        this.donorStateService.setSelectedDonor({
          donorId,
          timestamp: Date.now(),
        });
        this.loadDonorDetail(donorId);
      });

    // Priority 2: Check if we already have query params
    const initialDonorId = this.route.snapshot.queryParams['donorId'];
    if (initialDonorId) {
      // Already handled by subscription above
      return;
    }

    // Priority 3: Check navigation state for return from sub-pages (Consents sends reopenDonorId)
    const navState = window.history.state;
    const returnDonorId = navState?.donorId || navState?.reopenDonorId;
    if (returnDonorId) {
      this.loadDonorDetail(returnDonorId);
      return;
    }

    // Priority 4: No donor context — start fresh with search dialog
    this.donorStateService.clearSelectedDonor();
    this.openSearchDialog();
  }

  /**
   * Open Search For Donor dialog for donor selection
   */
  private openSearchDialog(): void {
    const dialogRef = this.dialog.open(SearchForDonorDialog, {
      width: '1150px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-dialog',
      hasBackdrop: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: SearchForDonorDialogResult) => {
      if (result?.action === 'select' && result.donor) {
        // User selected a donor - save to state and load details
        const donorName = `${result.donor.lastName}, ${result.donor.firstName}${result.donor.middleName ? ' ' + result.donor.middleName : ''}`;
        this.donorStateService.setSelectedDonor({
          donorId: result.donor.donorId,
          donorName,
          timestamp: Date.now(),
        });
        this.loadDonorDetail(result.donor.donorId);
      }
      // If cancelled (result.action === 'cancel'), component stays in empty state
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Change donor (button click) - opens search dialog
   */
  onChangeDonor(): void {
    // Clear current donor state when user explicitly changes
    this.donorStateService.clearSelectedDonor();
    this.donorData.set(null);
    this.eligibilityData.set([]);
    this.attributesData.set([]);
    this.openSearchDialog();
  }

  /**
   * Load donor detail information
   */
  private loadDonorDetail(donorId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.donorService
      .getDonorDetail(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.donorData.set(response.donor);
          this.eligibilityData.set(response.eligibility);
          this.attributesData.set(response.attributes);
          this.loading.set(false);

          // Update state service with full donor name for better context
          const donorName = `${response.donor.lastName}, ${response.donor.firstName}`;
          this.donorStateService.setSelectedDonor({
            donorId: response.donor.donorId,
            donorName,
            timestamp: Date.now(),
          });
        },
        error: (err) => {
          console.error('Failed to load donor details:', err);
          this.error.set(err.message || 'Failed to load donor details. Please search for a different donor.');
          this.loading.set(false);
          // Clear state on error so we don't retry the same invalid donor
          this.donorStateService.clearSelectedDonor();
          // Clear donor data
          this.donorData.set(null);
          this.eligibilityData.set([]);
          this.attributesData.set([]);
          // Don't auto-open dialog - let user click "Search for Donor" button in error state
        },
      });
  }

  /**
   * Handle quick link click
   * Navigates to the target page with donor context preserved
   */
  onQuickLinkClick(link: QuickLink): void {
    if (!this.hasDonor()) {
      return;
    }

    const donorId = this.donorData()!.donorId;

    if (link.route === 'documents') {
      this.navigateToDocumentLibrary();
    } else if (link.route === 'demographics') {
      this.openDemographicsDialog();
    } else if (link.route === 'test-results') {
      this.openTestResultsDialog();
    } else if (link.route === 'donor-attributes') {
      this.openDonorAttributesDialog();
    } else if (link.route === 'donor-interdictions') {
      this.openDonorInterdictionsDialog();
    } else if (link.route === 'donor-communications') {
      this.openDonorCommunicationsDialog();
    } else if (link.route === 'communication-letters') {
      this.openCommunicationLettersDialog();
    } else if (link.route === 'notification-log') {
      this.openNotificationLogDialog();
    } else if (link.route === 'notification-letters') {
      this.openNotificationLettersDialog();
    } else if (link.route === 'donor-notes') {
      this.openDonorNotesDialog();
    } else if (link.route === 'cumulative-logs') {
      this.openCumulativeLogsDialog();
    } else if (link.route === 'merged-donors') {
      this.openMergedDonorsDialog();
    } else if (link.route === 'consents') {
      this.openConsentsDialog();
    } else if (link.route === 'donations') {
      this.openDonationsDialog();
    } else if (link.route === 'alternate-address') {
      this.openAlternateAddressDialog();
    } else if (link.route === 'donor-letters') {
      this.openDonorLettersDialog();
    } else if (link.route !== '#') {
      // Navigate to the route with donor ID as query param and state flag
      // State flag tells destination page to show "Donor Detail Query" in breadcrumb
      this.router.navigate([link.route], {
        queryParams: { donorId },
        state: { fromDonorDetailQuery: true }
      });
    }
  }

  /**
   * Open Documents dialog
   */
  private navigateToDocumentLibrary(): void {
    const donor = this.donorData();
    if (!donor) {
      return;
    }

    const donorName = `${donor.lastName}, ${donor.firstName}${donor.middleName ? ' ' + donor.middleName : ''}`;
    const docLibPath = ROUTE_REGISTRY[RouteKey.DonorDocumentLibrary]?.path;
    if (docLibPath) {
      this.router.navigate([docLibPath], {
        queryParams: {
          donorId: donor.donorId,
          donorName: donorName,
        },
      });
    }
  }

  /**
   * Open Demographics dialog
   */
  private openDemographicsDialog(): void {
    const donor = this.donorData();
    if (!donor) {
      return;
    }

    const dialogData: DonorDemographicsDialogData = {
      donorId: donor.donorId,
      readOnly: false,
    };

    const dialogRef = this.dialog.open(DonorDemographicsComponent, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: dialogData,
    });

    // Reload donor data when dialog closes
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          // Result is true when data was saved, reload donor details
          this.loadDonorDetail(donor.donorId);
        }
      });
  }

  /**
   * Open Test Results dialog
   */
  private openTestResultsDialog(): void {
    const donor = this.donorData();
    if (!donor) {
      return;
    }

    const donorName = `${donor.lastName}, ${donor.firstName}${donor.middleName ? ' ' + donor.middleName : ''}`;

    const dialogRef = this.dialog.open(DonorWithinTestDialogComponent, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        donorId: donor.donorId,
        donorName: donorName,
        dob: this.formatDate(donor.dateOfBirth),
        sex: donor.sex || '',
        abo: donor.aboRh || '',
        accessLevel: ''
      }
    });

    const componentInstance = dialogRef.componentInstance;

    // Subscribe to close event
    componentInstance.closePanel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        dialogRef.close();
      });

    // Reload donor data when dialog closes
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload donor details to reflect any potential changes
        this.loadDonorDetail(donor.donorId);
      });
  }

  /**
   * Open Donor Attributes dialog
   */
  private openDonorAttributesDialog(): void {
    const donor = this.donorData();
    if (!donor) {
      return;
    }

    const donorName = `${donor.lastName}, ${donor.firstName}${donor.middleName ? ' ' + donor.middleName : ''}`;

    const dialogRef = this.dialog.open(DonorAttributesComponent, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });

    // Set component inputs manually since this component uses @Input decorators
    const componentInstance = dialogRef.componentInstance;
    componentInstance.inputDonorId = donor.donorId;
    componentInstance.inputDonorName = donorName;
    componentInstance.inputDob = this.formatDate(donor.dateOfBirth);
    componentInstance.inputSex = donor.sex || '';
    componentInstance.inputAbo = donor.aboRh || '';

    // Subscribe to close event
    componentInstance.closePanelEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        dialogRef.close();
      });

    // Reload donor data when dialog closes
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload donor details to reflect any potential changes
        this.loadDonorDetail(donor.donorId);
      });
  }

  /**
   * Open Donor Interdictions dialog
   */
  private openDonorInterdictionsDialog(): void {
    const donor = this.donorData();
    if (!donor) {
      return;
    }

    const dialogRef = this.dialog.open(DonorInterdictionsDialogInternal, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });

    // Set component input
    const componentInstance = dialogRef.componentInstance;
    componentInstance.donorId = donor.donorId;

    // Reload donor data when dialog closes
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload donor details to reflect any potential changes
        this.loadDonorDetail(donor.donorId);
      });
  }

  private openDonorCommunicationsDialog(): void {
    const donor = this.donorData();
    if (!donor) {
      return;
    }

    const donorName = `${donor.lastName}, ${donor.firstName}${donor.middleName ? ' ' + donor.middleName : ''}`;

    const dialogRef = this.dialog.open(DonorCommunicationsComponent, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });

    const componentInstance = dialogRef.componentInstance;
    componentInstance.donorId = donor.donorId;
    componentInstance.donorName = donorName;
    componentInstance.dob = this.formatDate(donor.dateOfBirth);
    componentInstance.sex = donor.sex || '';
    componentInstance.abo = donor.aboRh || '';

    componentInstance.closePanel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        dialogRef.close();
      });
  }

  /**
   * Open Communication Letters dialog
   */
  private openCommunicationLettersDialog(): void {
    const donor = this.donorData();
    if (!donor) {
      return;
    }

    this.dialog.open(ViewLettersDialogComponent, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        donorId: donor.donorId,
      },
    });
  }

  /**
   * Open Notification Log dialog
   */
  private openNotificationLogDialog(): void {
    const donor = this.donorData();
    if (!donor) {
      return;
    }

    const dialogData: NotificationLogDialogData = {
      donorId: donor.donorId,
    };

    this.dialog.open(NotificationLogDialogComponent, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: dialogData,
    });
  }

  /**
   * Open Notification Letters dialog
   * Fetches the most recent notification letter and displays it
   */
  private openNotificationLettersDialog(): void {
    const donor = this.donorData();
    if (!donor) {
      return;
    }

    const dialogData: ViewNotificationLetterDialogData = {
      donorId: donor.donorId,
    };

    this.dialog.open(ViewNotificationLetterDialog, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: dialogData,
    });
  }

  /**
   * Format date to DD-MMM-YYYY
   */
  formatDate(date: string | null | undefined): string {
    if (!date) {
      return '-';
    }
    return this.donorService.formatDate(date);
  }

  /**
   * Get full phone number display
   */
  getPhoneDisplay(donor: DonorDetail): string {
    const phones: string[] = [];
    if (donor.phoneHome) phones.push(`Home: ${donor.phoneHome}`);
    if (donor.phoneMobile) phones.push(`Mobile: ${donor.phoneMobile}`);
    if (donor.phoneWork) phones.push(`Work: ${donor.phoneWork}`);
    return phones.join(' | ') || 'No phone numbers on file';
  }

  /**
   * Get full address display
   */
  getAddressDisplay(donor: DonorDetail): string {
    if (!donor.address) {
      return '-';
    }

    const addressParts = [
      donor.address.line1,
      donor.address.line2,
      `${donor.address.city}, ${donor.address.state} ${donor.address.zipCode}`,
    ].filter(Boolean);

    return addressParts.length > 0 ? addressParts.join(', ') : '-';
  }

  private openDonorNotesDialog(): void {
    const donor = this.donorData();
    if (!donor) return;

    this.dialog.open(DonorNotesDialog, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        donorId: donor.donorId,
        donorName: `${donor.lastName}, ${donor.firstName}${donor.middleName ? ' ' + donor.middleName : ''}`,
      } as DonorNotesDialogData,
    });
  }

  private openCumulativeLogsDialog(): void {
    const donor = this.donorData();
    if (!donor) return;

    this.dialog.open(CumulativeLogsDialog, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { donorId: donor.donorId } as CumulativeLogsDialogData,
    });
  }

  private openMergedDonorsDialog(): void {
    const donor = this.donorData();
    if (!donor) return;

    this.router.navigate(
      [ROUTE_REGISTRY[RouteKey.MergedDonorsPage].path],
      { queryParams: { donorId: donor.donorId } }
    );
  }

  private openConsentsDialog(): void {
    const donor = this.donorData();
    if (!donor) return;

    this.router.navigate(
      [ROUTE_REGISTRY[RouteKey.ConsentHistory].path],
      { state: { donorId: donor.donorId, fromDonorDetailQuery: true } }
    );
  }

  private openDonationsDialog(): void {
    const donor = this.donorData();
    if (!donor) return;

    this.dialog.open(DonorHistoryPanelComponent, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { donorId: donor.donorId } as DonorHistoryPanelData,
    });
  }

  private openAlternateAddressDialog(): void {
    const donor = this.donorData();
    if (!donor) return;

    const dialogData: AlternateDemographicsDialogData = {
      donorId: donor.donorId,
      readOnly: false,
    };

    const dialogRef = this.dialog.open(AlternateDemographicsDialogComponent, {
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
      autoFocus: false,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result && result !== 'closeAll') {
          this.loadDonorDetail(donor.donorId);
        }
      });
  }

  private openDonorLettersDialog(): void {
    const donor = this.donorData();
    if (!donor) return;

    this.dialog.open(DonorLettersDialog, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: {
        donorId: donor.donorId,
        donorName: `${donor.lastName}, ${donor.firstName}${donor.middleName ? ' ' + donor.middleName : ''}`,
      } as DonorLettersDialogData,
    });
  }

  /**
   * Convert sex code to full form
   */
  getSexDisplay(sexCode: string | null | undefined): string {
    if (!sexCode) return '-';

    const sexMap: { [key: string]: string } = {
      'M': 'Male',
      'F': 'Female',
      'U': 'Unknown',
      'O': 'Other',
    };

    return sexMap[sexCode.toUpperCase()] || sexCode;
  }

  /**
   * Display value or '-' if blank/null/undefined
   */
  displayValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }

  onYtdLoss(): void {
    const donor = this.donorData();
    if (!donor) return;

    this.donorService.getYtdLoss(donor.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loss) => {
          const data: YtdLossDialogData = {
            rbcLoss: loss.rbcLoss,
            plasmaLoss: loss.plasmaLoss,
          };
          this.dialog.open(YtdLossDialog, {
            width: '420px',
            disableClose: true,
            hasBackdrop: true,
            backdropClass: 'code-dialog-backdrop',
            data,
          });
        },
      });
  }
}
