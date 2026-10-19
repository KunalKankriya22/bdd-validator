import { Component, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MessageDialog } from '@shared/components/message-dialog/message-dialog';
import { MessageDialogData } from '@shared/interfaces/auth.interface';
import { HeaderService } from '@shared/services/header.service';

import { MergeDuplicateSponsorsService } from './services/merge-duplicate-sponsors.service';
import { DuplicateSponsorModel, SponsorLookupModel } from './models/merge-duplicate-sponsors.model';
import { ViewDrivesDialog, ViewDrivesDialogData } from './view-drives-dialog/view-drives-dialog';

@Component({
  selector: 'app-merge-duplicate-sponsors',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './merge-duplicate-sponsors.html',
  styleUrls: ['./merge-duplicate-sponsors.scss']
})
export class MergeDuplicateSponsorsComponent implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchControl = new FormControl('', Validators.required);
  readonly sponsorSearchControl = new FormControl('');
  readonly sponsorOptions = signal<SponsorLookupModel[]>([]);

  // Sponsor data
  sponsorFrom: DuplicateSponsorModel | null = null;
  sponsorInto: DuplicateSponsorModel | null = null;

  // UI state
  isLoading = false;
  hasSearched = false;

  // Chapter ID from user context
  currentChapterId: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private sponsorService: MergeDuplicateSponsorsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private headerService: HeaderService
  ) {
    this.initializeConfigurations();

    // Reactively update chapterId when HeaderService signal changes
    effect(() => {
      this.currentChapterId = this.headerService.chapterId();
    });
  }

  ngOnInit(): void {
    this.setupSponsorSearch();
  }

  private setupSponsorSearch(): void {
    this.sponsorSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(search => {
          if (!search || search.length < 2) {
            return of({ data: [] as SponsorLookupModel[], total: 0 });
          }
          return this.sponsorService.searchSponsorsLov(50, 0, {
            sponsorName: search,
            chapterId: this.currentChapterId
          }).pipe(
            catchError(() => of({ data: [] as SponsorLookupModel[], total: 0 }))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.sponsorOptions.set(result.data);
      });
  }

  onDropdownOpened(isOpen: boolean): void {
    if (isOpen && this.sponsorOptions().length === 0) {
      this.loadInitialSponsors();
    }
  }

  private loadInitialSponsors(): void {
    this.sponsorService.searchSponsorsLov(50, 0, {
      sponsorName: '',
      chapterId: this.currentChapterId
    })
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ data: [] as SponsorLookupModel[], total: 0 }))
      )
      .subscribe(result => {
        this.sponsorOptions.set(result.data);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: 'Merge Duplicate Sponsors',
          link: null
        }
      ],
      title: 'Merge Duplicate Sponsors',
      subtitle: 'Merge two duplicate sponsors into one sponsor.',
      actions: []
    };
  }

  onRetrieve(): void {
    if (this.searchControl.invalid || !this.searchControl.value?.trim()) {
      return;
    }

    this.isLoading = true;
    const searchTerm = this.searchControl.value.trim();

    this.sponsorService.retrieveSponsors({
      sponsorName: searchTerm,
      chapterId: this.currentChapterId
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sponsors) => {
          this.isLoading = false;
          this.hasSearched = true;

          if (sponsors && sponsors.length >= 2) {
            this.sponsorFrom = sponsors[0];
            this.sponsorInto = sponsors[1];
          } else if (sponsors && sponsors.length === 1) {
            this.sponsorFrom = null;
            this.sponsorInto = null;
            this.snackBar.open('Only one sponsor found. At least two sponsors are required for merging.', 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['info-snackbar']
            });
          } else {
            this.sponsorFrom = null;
            this.sponsorInto = null;
            this.snackBar.open('No sponsors found matching the search criteria.', 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['info-snackbar']
            });
          }
        },
        error: () => {
          this.isLoading = false;
          this.hasSearched = true;
          this.sponsorFrom = null;
          this.sponsorInto = null;
        }
      });
  }

  swapDirection(): void {
    if (this.sponsorFrom && this.sponsorInto) {
      const temp = this.sponsorFrom;
      this.sponsorFrom = this.sponsorInto;
      this.sponsorInto = temp;
    }
  }

  showDrives(sponsor: DuplicateSponsorModel): void {
    this.sponsorService.getSponsorDrives(sponsor.sponsorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (drives) => {
          const dialogData: ViewDrivesDialogData = {
            sponsorId: sponsor.sponsorId,
            sponsorName: sponsor.name,
            drives: drives
          };

          this.dialog.open(ViewDrivesDialog, {
            width: '50vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            data: dialogData,
            panelClass: 'view-drives-dialog-right',
            position: { right: '0', top: '0' },
            hasBackdrop: true
          });
        },
        error: () => {
          this.snackBar.open('Failed to load drives for this sponsor.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  mergeSponsors(): void {
    if (!this.sponsorFrom || !this.sponsorInto) {
      return;
    }

    const dialogData: MessageDialogData = {
      title: 'Are you sure you want to merge the duplicate sponsor?',
      message: 'This action cannot be undone. The source record will be permanently deleted.',
      primaryAction: { label: 'CONFIRM', action: 'confirm' },
      secondaryAction: { label: 'CANCEL', action: 'cancel' }
    };

    const dialogRef = this.dialog.open(MessageDialog, {
      width: '555px',
      panelClass: 'merge-confirmation-dialog',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === 'confirm') {
          this.performMerge();
        }
      });
  }

  private performMerge(): void {
    if (!this.sponsorFrom || !this.sponsorInto) {
      return;
    }

    this.isLoading = true;

    this.sponsorService.mergeSponsors({
      fromSponsorId: this.sponsorFrom.sponsorId,
      toSponsorId: this.sponsorInto.sponsorId
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (response?.success) {
            const mergeResult = response.item || response.data?.[0];
            this.snackBar.open(
              response.message || `Sponsor ${mergeResult?.fromSponsorId || this.sponsorFrom?.sponsorId} has been merged into ${mergeResult?.toSponsorId || this.sponsorInto?.sponsorId} successfully.`,
              'DISMISS',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              }
            );
            this.resetForm();
            setTimeout(() => window.location.reload(), 2000);
          } else {
            this.snackBar.open(
              response?.message || 'Merge operation failed. Please try again.',
              'DISMISS',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('An error occurred while merging sponsors.', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private resetForm(): void {
    this.searchControl.reset();
    this.sponsorFrom = null;
    this.sponsorInto = null;
    this.hasSearched = false;
  }

  get canMerge(): boolean {
    return !!(this.sponsorFrom && this.sponsorInto && !this.isLoading);
  }

  get emptyStateMessage(): string {
    if (!this.hasSearched) {
      return 'Use the search fields above to view the duplicate sponsors';
    }
    return 'No sponsors found matching the search criteria';
  }

  getContactName(sponsor: DuplicateSponsorModel): string {
    const parts = [sponsor.contactFirstName, sponsor.contactLastName].filter(Boolean);
    return parts.join(' ') || '';
  }

  getAddress(sponsor: DuplicateSponsorModel): string {
    if (sponsor.intlAddrFlag === 'Y') {
      const parts = [sponsor.intlAddress1, sponsor.intlAddress2, sponsor.intlAddress3].filter(Boolean);
      return parts.join(', ');
    }
    const parts = [sponsor.streetName, sponsor.address1].filter(Boolean);
    return parts.join(', ');
  }

  getUspsDisplay(sponsor: DuplicateSponsorModel): string {
    const parts = [sponsor.uspsId, sponsor.countryName].filter(Boolean);
    return parts.join(' / ');
  }
}
