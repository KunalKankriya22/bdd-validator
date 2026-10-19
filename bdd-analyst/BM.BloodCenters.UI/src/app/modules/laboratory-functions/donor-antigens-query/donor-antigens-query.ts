import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { A11yModule } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { DonorAntigensApiService } from './services/donor-antigens-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  DonorInfo,
  RbcAntigen,
  HlaAntigens,
  DonorAntigensData
} from './models/donor-antigens.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DonorInterdictionsContentComponent } from '../../donor-functions/donor-profile/donor-interdictions/donor-interdictions-content.component';
import { SearchForDonorDialog } from '@shared/components/search-for-donor/search-for-donor';
import { SearchForDonorDialogResult } from '@shared/components/search-for-donor/search-for-donor.model';

@Component({
  selector: 'app-donor-antigens-query',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    A11yModule,
    PageHeaderWithBreadcrumb,
    DonorInterdictionsContentComponent
  ],
  templateUrl: './donor-antigens-query.html',
  styleUrl: './donor-antigens-query.scss'
})
export class DonorAntigensQuery implements OnInit, OnDestroy {

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(DonorAntigensApiService);
  private dialog = inject(MatDialog);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private pageHeaderService = inject(PageHeaderService);
  private destroy$ = new Subject<void>();

  // Header configuration - dynamically populated from menu API
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  constructor() {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        // Get navigation state from window.history.state
        const state = window.history.state;

        // Short breadcrumb pattern (matching other screens in the app)
        let breadcrumbs: Array<{ label: string; link: string | null }>;

        // If navigated from Donor Detail Query, show custom breadcrumb
        if (state?.['fromDonorDetailQuery']) {
          breadcrumbs = [
            { label: 'Home', link: '/home' },
            { label: 'Donor Detail Query', link: '/donor-functions/donor-profile/donor-detail-query' },
            { label: pageData.title, link: null }
          ];
        } else {
          // Default: Home → Current Page (standard pattern)
          breadcrumbs = [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ];
        }

        this.headerConfig = {
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: []
        };
      }
    });
  }

  // Signal-based state
  protected readonly donorId = signal<string | null>(null);
  protected readonly donorInfo = signal<DonorInfo | null>(null);
  protected readonly hlaAntigens = signal<HlaAntigens | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly rbcAntigens = signal<RbcAntigen[]>([]);

  // Side panel state
  protected readonly isInterdictionsPanelOpen = signal<boolean>(false);
  protected readonly interdictionsPanelDonorId = signal<string | null>(null);

  // RBC Antigens data source with sorting
  rbcAntigensDataSource = new MatTableDataSource<RbcAntigen>([]);

  // Computed values
  protected readonly hasData = computed(() => this.donorInfo() !== null);
  protected readonly isEmpty = computed(() => !this.loading() && !this.hasData() && !this.error());
  protected readonly hasRbcAntigens = computed(() => this.rbcAntigens().length > 0);
  protected readonly hasHlaAntigens = computed(() => {
    const hla = this.hlaAntigens();
    if (!hla) return false;
    return Object.values(hla).some(value => value !== null);
  });

  // Table columns for RBC antigens
  rbcColumns = ['antigen', 'result'];

  // Sort state
  private sortDirection: 'asc' | 'desc' | '' = '';

  ngOnInit(): void {
    // Get donor ID from URL query parameter (e.g., ?donorId=DN00754816)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params['donorId'];
        if (id) {
          this.donorId.set(id);
          this.loadDonorAntigens(id);
        } else {
          // No donorId provided - clear all data and open Search for Donor dialog
          this.clearAllData();
          this.openSearchForDonor();
        }
      });
  }

  /**
   * Open Donor Search dialog to select a donor (initial load without donorId)
   */
  private openSearchForDonor(): void {
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

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: SearchForDonorDialogResult) => {
        if (result?.action === 'select' && result.donor) {
          // Update URL with selected donor ID
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { donorId: result.donor.donorId },
            queryParamsHandling: 'merge'
          });
        } else {
          // User cancelled - navigate back
          this.router.navigate(['/home']);
        }
      });
  }

  /**
   * Open Donor Search dialog from search button (when donor data already loaded)
   */
  openSearchForDonorDialog(): void {
    const dialogRef = this.dialog.open(SearchForDonorDialog, {
      width: '1150px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-dialog',
      hasBackdrop: true,
      autoFocus: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: SearchForDonorDialogResult) => {
        if (result?.action === 'select' && result.donor) {
          // Update URL with selected donor ID to load new donor's data
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { donorId: result.donor.donorId },
            queryParamsHandling: 'merge'
          });
        }
        // If user cancels, keep current donor data (don't navigate away)
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDonorAntigens(donorId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getDonorAntigens(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DonorAntigensData) => {
          this.donorInfo.set(data.donorInfo);
          this.rbcAntigens.set(data.rbcAntigens);
          this.rbcAntigensDataSource.data = data.rbcAntigens;
          this.hlaAntigens.set(data.hlaAntigens);
          this.loading.set(false);
        },
        error: (err) => {
          this.loggingService.error('Error loading donor antigens', err);
          const errorMessage = err.status === 404
            ? 'Donor not found. Please verify the donor ID.'
            : 'Failed to load donor antigens. Please try again.';
          this.error.set(errorMessage);
          this.loading.set(false);
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onRetry(): void {
    const id = this.donorId();
    if (id) {
      this.loadDonorAntigens(id);
    }
  }

  private clearAllData(): void {
    this.donorId.set(null);
    this.donorInfo.set(null);
    this.rbcAntigens.set([]);
    this.rbcAntigensDataSource.data = [];
    this.hlaAntigens.set(null);
    this.error.set(null);
  }

  onClearSearch(): void {
    this.clearAllData();
    // Navigate to current route without query params (preserves HLA/RBC vs Donor Profile path)
    const currentPath = this.router.url.split('?')[0];
    this.router.navigate([currentPath]);
  }

  openDonorInterdictionsPanel(): void {
    const id = this.donorId();

    if (!id) {
      return;
    }

    this.interdictionsPanelDonorId.set(id);
    this.isInterdictionsPanelOpen.set(true);
  }

  closeDonorInterdictionsPanel(): void {
    this.isInterdictionsPanelOpen.set(false);
    this.interdictionsPanelDonorId.set(null);
  }

  getResultAriaLabel(testId: string, isPositive: boolean): string {
    return `${testId}: ${isPositive ? 'Positive' : 'Negative'}`;
  }

  getHlaValue(value: string | null | undefined): string {
    return value || '-';
  }

  formatDateOfBirth(dob: string): string {
    if (!dob) return '';
    const date = new Date(dob);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  trackByTestId(_index: number, item: RbcAntigen): string {
    return item.testId;
  }

  /**
   * Handle sort change for Antigen column
   */
  onSortChange(): void {
    // Toggle sort direction: '' -> 'desc' -> 'asc' -> 'desc'
    if (this.sortDirection === '') {
      this.sortDirection = 'desc';
    } else if (this.sortDirection === 'desc') {
      this.sortDirection = 'asc';
    } else {
      this.sortDirection = 'desc';
    }

    // Sort the data
    this.sortData();
  }

  /**
   * Sort the RBC antigens data
   */
  private sortData(): void {
    if (this.sortDirection === '') {
      return;
    }

    const data = this.rbcAntigensDataSource.data.slice();
    data.sort((a, b) => {
      const aValue = a.testId.toLowerCase();
      const bValue = b.testId.toLowerCase();

      if (this.sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    this.rbcAntigensDataSource.data = data;
  }

  /**
   * Get sort icon based on current sort state
   */
  getSortIcon(): string {
    if (this.sortDirection === 'asc') {
      return 'arrow_upward';
    } else if (this.sortDirection === 'desc') {
      return 'arrow_downward';
    } else {
      return 'unfold_more'; // Default neutral icon
    }
  }

  /**
   * Check if column is currently sorted
   */
  isSorted(): boolean {
    return this.sortDirection !== '';
  }

  /**
   * Get aria label for sort button
   */
  getSortAriaLabel(): string {
    if (this.sortDirection === '') {
      return 'Antigen: Not sorted, click to sort descending';
    } else if (this.sortDirection === 'desc') {
      return 'Antigen: Sorted descending, click to sort ascending';
    } else {
      return 'Antigen: Sorted ascending, click to sort descending';
    }
  }
}
