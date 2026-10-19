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

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy,
  OverlayModule
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { SpecialDriveService } from './services/special-drive.service';
import { SpecialDriveDto, SpecialDriveSearchRequest } from './models/special-drive.model';
import { CancelDriveService } from './services/cancel-drive.service';
import { AddEditSpecialDriveComponent } from './add-edit-special-drive/add-edit-special-drive';
import { CancelDriveDialogComponent } from './cancel-drive-dialog/cancel-drive-dialog';
import { SpecialDriveFilterPanel, SpecialDriveFilterValue } from './special-drive-filter-panel/special-drive-filter-panel';
import { SpecialDriveFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-manage-special-drive',
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
  templateUrl: './manage-special-drive.html',
  styleUrls: ['./manage-special-drive.scss']
})
export class ManageSpecialDriveComponent implements OnInit, OnDestroy {
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

  dataSource: SpecialDriveDto[] = [];
  expandedRows: Set<number> = new Set();
  allRowsExpanded = false;

  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  pageSizeOptions = [10, 25, 50, 100];

  isLoading = false;
  hasError = false;
  errorMessage = '';
  currentChapterId = '';
  isFilterOpen = false;
  searchText = '';

  appliedFilters: SpecialDriveFilterValue | null = null;
  filterChips: FilterChip[] = [];

  sortDirection: 'asc' | 'desc' = 'desc';
  sortColumn = 'driveDate';
  sortActive = true;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' | 'duplicate' = 'add';
  sidePanelData: SpecialDriveDto | null = null;

  showActionMenu = false;
  activeActionRowIndex: number | null = null;
  actionMenuPosition = { top: '0px', left: '0px' };

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private overlayDestroy$ = new Subject<void>();

  constructor(
    private driveService: SpecialDriveService,
    private cancelDriveService: CancelDriveService,
    private headerService: HeaderService,
    private pageHeaderService: PageHeaderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private overlay: Overlay
  ) {
    this.initializeConfigurations();

    effect(() => {
      this.currentChapterId = this.headerService.chapterId();
    });

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
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
    this.searchSubject$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          this.isLoading = true;
          this.hasError = false;

          const skip = this.pageIndex * this.pageSize;
          const searchRequest = this.buildSearchRequest();

          return this.driveService.searchDrives(this.pageSize, skip, searchRequest)
            .pipe(finalize(() => (this.isLoading = false)));
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

    this.loadData();
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
        this.searchText = '';
        this.appliedFilters = null;
        this.filterChips = [];

        if (this.overlayRef) {
          this.overlayRef.dispose();
          this.overlayRef = null;
          this.isFilterOpen = false;
        }

        this.sidePanelOpen = false;
        this.sidePanelMode = 'add';
        this.sidePanelData = null;
        this.pageIndex = 0;
        this.loadData();
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Manage Special Drive', link: null }
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
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
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
    const request: SpecialDriveSearchRequest = {
      searchText: this.searchText || undefined,
      sortColumn: 'DRIVE_DATE',
      sortOrder: this.sortDirection === 'asc' ? 'ASC' : 'DESC'
    };

    if (this.appliedFilters) {
      if (this.appliedFilters.driveId) request.driveId = this.appliedFilters.driveId;
      if (this.appliedFilters.sponsorId) request.sponsorId = this.appliedFilters.sponsorId;
      if (this.appliedFilters.driveType) request.driveType = this.appliedFilters.driveType;
      if (this.appliedFilters.category) request.driveCategory = this.appliedFilters.category;
      if (this.appliedFilters.driveDate) {
        const date = new Date(this.appliedFilters.driveDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        request.driveDateFrom = `${year}-${month}-${day}T00:00:00`;
        request.driveDateTo = `${year}-${month}-${day}T23:59:59`;
      }
    }

    return request;
  }

  get totalProjectedShow(): number {
    return this.dataSource.reduce((sum, d) => sum + (d.sponsors?.[0]?.projectedShow || 0), 0);
  }

  get totalProjectedDraw(): number {
    return this.dataSource.reduce((sum, d) => sum + (d.sponsors?.[0]?.projectedDraw || 0), 0);
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CNFRM': return 'status-badge--confirmed';
      case 'CANCL': return 'status-badge--cancelled';
      case 'HOLD': return 'status-badge--hold';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CNFRM': return 'Confirmed';
      case 'CANCL': return 'Cancelled';
      case 'HOLD': return 'Hold';
      default: return status || '';
    }
  }

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.searchSubject$.next();
  }

  onSearch(searchText: string): void {
    this.searchText = searchText;
    this.pageIndex = 0;
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
    this.pageIndex = 0;
    this.searchSubject$.next();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = SpecialDriveFilterChipsUtils.removeFilterByChipKey(this.appliedFilters, chipKey);
    this.filterChips = SpecialDriveFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.pageIndex = 0;
    this.searchSubject$.next();
  }

  hasActiveFilters(): boolean {
    return SpecialDriveFilterChipsUtils.hasActiveFilters(this.appliedFilters);
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    this.searchSubject$.next();
  }

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

  getPrimaryFlag(drive: SpecialDriveDto): string {
    return (drive.sponsors && drive.sponsors.length > 0) ? 'Yes' : 'No';
  }

  getFormattedTime(drive: SpecialDriveDto): string {
    if (!drive.scheduleStartTime || !drive.scheduleEndTime) return 'N/A';

    try {
      const startTime = new Date(drive.scheduleStartTime);
      const endTime = new Date(drive.scheduleEndTime);

      const formatTime = (date: Date): string => {
        const hours24 = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const hours12 = hours24 % 12 || 12;
        const ampm = hours24 >= 12 ? 'PM' : 'AM';
        return `${hours12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      };

      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  }

  getStaffRequired(drive: SpecialDriveDto): number {
    if (!drive.resources || drive.resources.length === 0) return 0;
    return drive.resources.reduce((sum, resource) => sum + (resource.numberRequired || 0), 0);
  }

  getVanCount(drive: SpecialDriveDto): string {
    if (!drive.resources || drive.resources.length === 0) return 'No';
    const vanResource = drive.resources.find(r => r.resourceCode?.toUpperCase().includes('VAN'));
    return vanResource && vanResource.numberRequired > 0 ? 'Yes' : 'No';
  }

  getCoachCount(drive: SpecialDriveDto): string {
    if (!drive.resources || drive.resources.length === 0) return 'No';
    const coachResource = drive.resources.find(r => r.resourceCode?.toUpperCase().includes('COACH'));
    return coachResource && coachResource.numberRequired > 0 ? 'Yes' : 'No';
  }

  createDrive(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editDrive(drive: SpecialDriveDto): void {
    this.sidePanelMode = 'edit';
    this.isLoading = true;

    this.driveService.getDriveById(drive.driveId, drive.chapterId)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (fullDrive) => {
          this.sidePanelData = fullDrive;
          this.sidePanelOpen = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error) => {
          console.error('Error loading drive details:', error);
          this.snackBar.open(
            this.extractErrorMessage(error, 'Failed to load drive details. Please try again.'),
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] }
          );
        }
      });
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.searchText = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    this.searchSubject$.next();
  }

  onSaveSuccess(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
    this.searchText = '';
    this.appliedFilters = null;
    this.filterChips = [];
    this.pageIndex = 0;
    this.loadData();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showActionMenu) return;
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

    let leftPos = rect.right + window.scrollX - menuWidth;
    let topPos = rect.bottom + window.scrollY + 4;

    if (topPos + menuHeight > window.scrollY + window.innerHeight) {
      topPos = rect.top + window.scrollY - menuHeight - 4;
    }

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
      case 'edit': this.editDrive(drive); break;
      case 'duplicate': this.duplicateDrive(drive); break;
      case 'cancel': this.cancelDrive(drive); break;
    }
  }

  duplicateDrive(drive: SpecialDriveDto): void {
    this.sidePanelMode = 'duplicate';
    this.isLoading = true;

    this.driveService.getDriveById(drive.driveId, drive.chapterId)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (fullDrive) => {
          this.sidePanelData = fullDrive;
          this.sidePanelOpen = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error) => {
          console.error('Error loading drive details for duplication:', error);
          this.snackBar.open(
            this.extractErrorMessage(error, 'Failed to load drive details. Please try again.'),
            'DISMISS',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] }
          );
        }
      });
  }

  cancelDrive(drive: SpecialDriveDto): void {
    const dialogRef = this.dialog.open(CancelDriveDialogComponent, {
      width: '560px',
      data: { driveId: drive.driveId }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          const cancelReasonCode = result.cancelCode || '';
          const cancelReason = result.comments || '';

          this.cancelDriveService.cancelDrive(drive.driveId, {
            cancelReasonCode,
            cancelReason,
            confirmCancellation: true
          })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.snackBar.open(
                  'Drive cancelled successfully',
                  'Close',
                  { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] }
                );
                this.loadData();
              },
              error: (error) => {
                console.error('Error cancelling drive:', error);
                this.snackBar.open(
                  this.extractErrorMessage(error, 'Error cancelling drive'),
                  'DISMISS',
                  { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] }
                );
              }
            });
        }
      });
  }

  private extractErrorMessage(error: unknown, defaultMessage: string): string {
    if (!error || typeof error !== 'object') return defaultMessage;

    const err = error as {
      error?: {
        errorResponse?: { error?: string; errorCode?: string };
        error?: string;
        message?: string;
      };
      message?: string;
    };

    if (err.error?.errorResponse?.error && err.error?.errorResponse?.errorCode) {
      return `Error ${err.error.errorResponse.errorCode}: ${err.error.errorResponse.error}`;
    }
    if (err.error?.errorResponse?.error) return err.error.errorResponse.error;
    if (err.error?.error) return err.error.error;
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;

    return defaultMessage;
  }
}
