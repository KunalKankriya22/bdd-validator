import { Component, OnInit, OnDestroy, ViewChild, ElementRef, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, finalize, debounceTime, switchMap } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy,
  OverlayModule
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { SpecialDriveService } from './services/special-drive.service';
import { SpecialDrive, SpecialDriveDto, SpecialDriveSearchRequest } from './models/special-drive.model';
import { AddEditSpecialDriveComponent } from './add-edit-special-drive/add-edit-special-drive';
import { CancelDriveDialogComponent } from './cancel-drive-dialog/cancel-drive-dialog';
import { SpecialDriveFilterPanel, SpecialDriveFilterValue } from './special-drive-filter-panel/special-drive-filter-panel';
import { SpecialDriveFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-create-or-modify-special-drive',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    AddEditSpecialDriveComponent
  ],
  templateUrl: './create-or-modify-special-drive.html',
  styleUrls: ['./create-or-modify-special-drive.scss']
})
export class CreateOrModifySpecialDriveComponent implements OnInit, OnDestroy {
  @ViewChild('tableCard', { read: ElementRef }) tableCard!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Drive ID or Sponsor Name',
    minLength: 3,
    ariaLabel: 'Search by Drive ID or Sponsor Name',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  // Data
  dataSource: SpecialDriveDto[] = [];
  expandedRows: Set<number> = new Set();
  allRowsExpanded = false;

  // Pagination
  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // State
  isLoading = false;
  hasError = false;
  errorMessage = '';
  currentChapterId = '';
  isFilterOpen = false;
  searchText = '';

  // Filter State
  appliedFilters: SpecialDriveFilterValue | null = null;
  filterChips: FilterChip[] = [];

  // Sorting
  sortDirection: 'asc' | 'desc' = 'desc';
  sortColumn = 'driveDate';
  sortActive = true;

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' | 'duplicate' = 'add';
  sidePanelData: SpecialDriveDto | null = null;

  // Action Menu State
  showActionMenu = false;
  activeActionRowIndex: number | null = null;
  actionMenuPosition = { top: '0px', left: '0px' };

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private overlayDestroy$ = new Subject<void>();

  constructor(
    private driveService: SpecialDriveService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService,
    private chapterTimezoneService: ChapterTimezoneService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private overlay: Overlay
  ) {
    this.initializeConfigurations();

    // Reactively update currentChapterId whenever chapter changes
    effect(() => {
      this.currentChapterId = this.headerService.chapterId();
    });

    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            {
              label: 'Home',
              link: '/home'
            },
            {
              label: pageData.title,
              link: null
            }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: [{
            label: 'ADD NEW SPECIAL DRIVE',
            icon: 'add',
            color: 'accent',
            ariaLabel: 'Add new special drive',
            onClick: () => this.createDrive()
          }]
        };
      }
    });
  }

  ngOnInit(): void {
    // Setup debounced search/filter operations with switchMap to prevent race conditions
    this.searchSubject$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          this.isLoading = true;
          this.hasError = false;

          const skip = this.pageIndex * this.pageSize;
          const searchRequest = this.buildSearchRequest();

          return this.driveService.searchDrives(this.pageSize, skip, searchRequest)
            .pipe(
              finalize(() => (this.isLoading = false))
            );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalRecords = response.total;
        },
        error: (error) => {
          console.error('Error loading drives:', error);
          this.hasError = true;
          this.errorMessage = 'Failed to load drive data. Please try again.';
          this.snackBar.open('Error loading drives', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });

    // Initial data load
    this.loadData();

    // Subscribe to chapter changes
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset search
        this.searchText = '';

        // Reset filters
        this.appliedFilters = null;
        this.filterChips = [];

        // Close filter overlay if open
        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }

        // Close side panel if open
        this.sidePanelOpen = false;
        this.sidePanelMode = 'add';
        this.sidePanelData = null;

        // Reset pagination and reload table
        this.pageIndex = 0;
        this.loadData();
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        {
          label: 'Home',
          link: '/home'
        },
        {
          label: 'Create or Modify Special Drive',
          link: null
        }
      ],
      actions: [{
        label: 'ADD NEW SPECIAL DRIVE',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new special drive',
        onClick: () => this.createDrive()
      }]
    };
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const skip = this.pageIndex * this.pageSize;
    const searchRequest = this.buildSearchRequest();

    this.driveService.searchDrives(this.pageSize, skip, searchRequest)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalRecords = response.total;
        },
        error: (error) => {
          console.error('Error loading drives:', error);
          this.hasError = true;
          this.errorMessage = 'Failed to load drive data. Please try again.';
          this.snackBar.open('Error loading drives', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private buildSearchRequest(): SpecialDriveSearchRequest {
    // Note: chapterId is sent via X-ChapterId header (authInterceptor) and backend overwrites body value
    // So we don't include it in the request body - backend ignores it anyway
    const request: SpecialDriveSearchRequest = {
      searchText: this.searchText || undefined,
      sortColumn: 'DRIVE_DATE',
      sortOrder: this.sortDirection === 'asc' ? 'ASC' : 'DESC'
    };

    // Apply filters if they exist
    if (this.appliedFilters) {
      if (this.appliedFilters.driveId) {
        request.driveId = this.appliedFilters.driveId;
      }
      if (this.appliedFilters.sponsorId) {
        request.sponsorId = this.appliedFilters.sponsorId;
      }
      if (this.appliedFilters.driveType) {
        request.driveType = this.appliedFilters.driveType;
      }
      if (this.appliedFilters.category) {
        request.driveCategory = this.appliedFilters.category;
      }
      if (this.appliedFilters.driveDate) {
        const date = new Date(this.appliedFilters.driveDate);
        // Use local date values to avoid timezone conversion issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        // From: start of day (00:00:00)
        request.driveDateFrom = `${year}-${month}-${day}T00:00:00`;
        // To: end of day (23:59:59) to include all drives on this date
        request.driveDateTo = `${year}-${month}-${day}T23:59:59`;
      }
    }

    if (!this.appliedFilters?.driveDate) {
      request.futureOnly = true;
    }

    return request;
  }

  getDayOfWeek(drive: SpecialDriveDto): string {
    if (!drive.driveDate) return '';
    return moment(drive.driveDate).format('ddd').toUpperCase();
  }

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.searchSubject$.next();
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.pageIndex = 0; // Reset to first page on search
    this.searchSubject$.next();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  openFilter(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      return;
    }

    this.isFilterOpen = true;

    // Reset the subject for a fresh overlay lifecycle
    this.overlayDestroy$ = new Subject<void>();

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.tableCard)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 56
        }
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new ComponentPortal(SpecialDriveFilterPanel);
    const componentRef = this.overlayRef.attach(portal);

    componentRef.instance.currentFilters = this.appliedFilters;

    componentRef.instance.apply
      .pipe(takeUntil(this.overlayDestroy$))
      .subscribe(filters => {
        this.applyFilters(filters);
        this.closeFilter();
      });

    componentRef.instance.close
      .pipe(takeUntil(this.overlayDestroy$))
      .subscribe(() => {
        this.closeFilter();
      });

    this.overlayRef.backdropClick()
      .pipe(takeUntil(this.overlayDestroy$))
      .subscribe(() => {
        this.closeFilter();
      });
  }

  private closeFilter(): void {
    this.overlayDestroy$.next();
    this.overlayDestroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.isFilterOpen = false;
      if (this.filterBtn?.nativeElement) {
        this.filterBtn.nativeElement.blur();
      }
    }
  }

  applyFilters(filters: SpecialDriveFilterValue): void {
    this.appliedFilters = filters;
    this.filterChips = SpecialDriveFilterChipsUtils.convertFiltersToChips(filters);

    // Reset to first page when applying filters
    this.pageIndex = 0;
    this.searchSubject$.next();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = SpecialDriveFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );

    this.filterChips = SpecialDriveFilterChipsUtils.convertFiltersToChips(this.appliedFilters);

    this.pageIndex = 0;
    this.searchSubject$.next();
  }

  hasActiveFilters(): boolean {
    return SpecialDriveFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    // Clear search text
    this.searchText = '';

    // Clear filter state
    this.appliedFilters = null;
    this.filterChips = [];

    // Reset pagination
    this.pageIndex = 0;

    // Reload data with cleared state
    this.searchSubject$.next();
  }

  // Expandable row methods
  toggleRow(index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  isRowExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  toggleAllRows(): void {
    if (this.allRowsExpanded) {
      this.expandedRows.clear();
    } else {
      this.dataSource.forEach((_, index) => {
        this.expandedRows.add(index);
      });
    }
    this.allRowsExpanded = !this.allRowsExpanded;
  }

  // Expanded row data helpers
  getPrimaryFlag(drive: SpecialDriveDto): string {
    if (!drive.sponsors || drive.sponsors.length === 0) return 'No';
    return drive.sponsors.some(s => s.primaryFlag === 'Y') ? 'Yes' : 'No';
  }

  getFormattedTime(drive: SpecialDriveDto): string {
    if (!drive.scheduleStartTime || !drive.scheduleEndTime) {
      return 'N/A';
    }

    try {
      // Time-only strings (HH:MM or HH:MM:SS) are already chapter-local — no conversion needed.
      // Full datetime strings (ISO 8601) are assumed UTC and converted to chapter local time.
      const toChapterLocal = (timeStr: string): moment.Moment => {
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr.trim())) {
          return moment(timeStr.trim(), ['HH:mm', 'HH:mm:ss']);
        }
        return this.chapterTimezoneService.convertGmtToLocal(moment.utc(timeStr));
      };

      const fmt = (m: moment.Moment): string => {
        const h24 = m.hours();
        const h12 = h24 % 12 || 12;
        const min = m.minutes().toString().padStart(2, '0');
        const ampm = h24 >= 12 ? 'PM' : 'AM';
        return `${h12.toString().padStart(2, '0')}:${min} ${ampm}`;
      };

      return `${fmt(toChapterLocal(drive.scheduleStartTime))} - ${fmt(toChapterLocal(drive.scheduleEndTime))}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  }

  getStaffRequired(drive: SpecialDriveDto): number {
    if (!drive.resources || drive.resources.length === 0) {
      return 0;
    }
    // Sum all resource requirements
    return drive.resources.reduce((sum, resource) => sum + (resource.numberRequired || 0), 0);
  }

  getVanCount(drive: SpecialDriveDto): string {
    if (!drive.resources || drive.resources.length === 0) {
      return 'No';
    }
    // Look for VAN resource (resource code might be 'VAN', 'VANS', or similar)
    const vanResource = drive.resources.find(r =>
      r.resourceCode?.toUpperCase().includes('VAN')
    );
    return vanResource && vanResource.numberRequired > 0 ? 'Yes' : 'No';
  }

  getCoachCount(drive: SpecialDriveDto): string {
    if (!drive.resources || drive.resources.length === 0) {
      return 'No';
    }
    // Look for COACH resource (resource code might be 'COACH', 'COACHES', or similar)
    const coachResource = drive.resources.find(r =>
      r.resourceCode?.toUpperCase().includes('COACH')
    );
    return coachResource && coachResource.numberRequired > 0 ? 'Yes' : 'No';
  }

  // CRUD operations
  createDrive(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editDrive(drive: SpecialDriveDto): void {
    this.sidePanelMode = 'edit';
    this.isLoading = true;

    // Load full drive with all child data (sponsors, resources, notes)
    this.driveService.getDriveById(drive.driveId, drive.chapterId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (fullDrive) => {
          this.sidePanelData = fullDrive;
          this.sidePanelOpen = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error) => {
          console.error('Error loading drive details:', error);
          const errorMessage = this.extractErrorMessage(
            error,
            'Failed to load drive details. Please try again.'
          );

          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;

    // Reset search and filter state when closing side panel
    this.searchText = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    this.searchSubject$.next();
  }

  onSaveSuccess(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;

    // Reset search and filter state when closing side panel after save
    this.searchText = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;

    this.loadData();
  }

  // Action Menu Methods
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showActionMenu) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!target.closest('.action-btn') && !target.closest('.action-menu')) {
      this.closeActionMenu();
    }
  }

  toggleActionMenu(index: number, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.activeActionRowIndex === index && this.showActionMenu) {
      this.closeActionMenu();
      return;
    }

    this.activeActionRowIndex = index;
    this.showActionMenu = true;

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const menuWidth = 250;
    const menuHeight = 200;

    // Position menu aligned to right edge, directly below the button
    let leftPos = rect.right + window.scrollX - menuWidth;

    // Position menu below the button with 4px gap
    let topPos = rect.bottom + window.scrollY + 4;

    // If menu would go off-screen at bottom, show it above the button
    if (topPos + menuHeight > window.scrollY + window.innerHeight) {
      topPos = rect.top + window.scrollY - menuHeight - 4;
    }

    // Ensure menu doesn't go off-screen to the left
    if (leftPos < window.scrollX) {
      leftPos = window.scrollX + 8;
    }

    this.actionMenuPosition = {
      top: `${Math.max(0, topPos)}px`,
      left: `${Math.max(0, leftPos)}px`
    };
  }

  closeActionMenu(): void {
    this.showActionMenu = false;
    this.activeActionRowIndex = null;
  }

  onRowAction(action: string, drive: SpecialDriveDto): void {
    this.closeActionMenu();

    switch (action) {
      case 'edit':
        this.editDrive(drive);
        break;
      case 'duplicate':
        this.duplicateDrive(drive);
        break;
      case 'cancel':
        this.cancelDrive(drive);
        break;
    }
  }

  duplicateDrive(drive: SpecialDriveDto): void {
    this.sidePanelMode = 'duplicate';
    this.isLoading = true;

    // Load full drive with all child data (sponsors, resources, notes) for duplication
    this.driveService.getDriveById(drive.driveId, drive.chapterId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (fullDrive) => {
          this.sidePanelData = fullDrive;
          this.sidePanelOpen = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error) => {
          console.error('Error loading drive details for duplication:', error);
          const errorMessage = this.extractErrorMessage(
            error,
            'Failed to load drive details. Please try again.'
          );

          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  cancelDrive(drive: SpecialDriveDto): void {
    const dialogRef = this.dialog.open(CancelDriveDialogComponent, {
      width: '560px',
      data: {
        driveId: drive.driveId,
        driveDate: drive.driveDate ? String(drive.driveDate) : undefined,
        sponsorName: drive.sponsorName || undefined
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
      if (result) {
        const cancelReasonCode = result.cancelCode || undefined;
        const cancelReason = result.comments || undefined;

        this.driveService.cancelDrive(drive.driveId, cancelReasonCode, cancelReason)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.snackBar.open(
                response.message || 'Drive cancelled successfully',
                'Close',
                {
                  duration: 3000,
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['success-snackbar']
                }
              );
              this.loadData();
            },
            error: (error) => {
              console.error('Error cancelling drive:', error);
              const errorMessage = this.extractErrorMessage(error, 'Error cancelling drive');

              this.snackBar.open(errorMessage, 'DISMISS', {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              });
            }
          });
      }
    });
  }

  /**
   * Extracts user-friendly error message from HTTP error responses.
   * Handles multiple error response formats from the API.
   *
   * @param error - Error object from HTTP response
   * @param defaultMessage - Fallback if no error details found
   * @returns Formatted error message string
   */
  private extractErrorMessage(error: unknown, defaultMessage: string): string {
    if (!error || typeof error !== 'object') {
      return defaultMessage;
    }

    const err = error as {
      error?: {
        errorResponse?: {
          error?: string;
          errorCode?: string;
        };
        error?: string;
        message?: string;
      };
      message?: string;
    };

    // Priority 1: Error with code (format: "Error {code}: {message}")
    if (err.error?.errorResponse?.error && err.error?.errorResponse?.errorCode) {
      return `Error ${err.error.errorResponse.errorCode}: ${err.error.errorResponse.error}`;
    }

    // Priority 2: Error response without code
    if (err.error?.errorResponse?.error) {
      return err.error.errorResponse.error;
    }

    // Priority 3: Error object error property
    if (err.error?.error) {
      return err.error.error;
    }

    // Priority 4: Error object message
    if (err.error?.message) {
      return err.error.message;
    }

    // Priority 5: Top-level message
    if (err.message) {
      return err.message;
    }

    return defaultMessage;
  }
}
