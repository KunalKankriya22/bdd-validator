import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import { TemporaryDriveService } from './services/temporary-drive.service';
import { TemporaryDrive } from './models/temporary-drive.model';
import { CreateEditDriveComponent } from './create-edit-drive/create-edit-drive';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { TemporaryDriveFilterDialog } from './dialogs/temporary-drive-filter-dialog';
import { TemporaryDriveFilterValue } from './models/temporary-drive-filter.model';
import { TemporaryDriveFilterChipsUtils } from './utils/filter-chips.utils';

@Component({
  selector: 'app-create-drive-from-temporary-drive',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatPaginatorModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    CreateEditDriveComponent,
    FilterChips
  ],
  templateUrl: './create-drive-from-temporary-drive.html',
  styleUrls: ['./create-drive-from-temporary-drive.scss']
})
export class CreateDriveFromTemporaryDriveComponent implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  // Search configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Drive ID or Sponsor Name',
    minLength: 1,
    ariaLabel: 'Search temporary drives',
    debounceTime: 300,
    searchOnEnterOnly: false
  };

  temporaryDrives: TemporaryDrive[] = [];
  filteredDrives: TemporaryDrive[] = [];
  expandedRows: Set<number> = new Set();
  allRowsExpanded = false;
  showForm = false;
  selectedDrive: TemporaryDrive | null = null;

  // Sort configuration
  sortDirection: 'asc' | 'desc' = 'asc';

  currentChapterId = '';
  isLoading = false;

  // Pagination state
  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Filter state
  currentFilters: TemporaryDriveFilterValue | null = null;
  filterChips: FilterChip[] = [];
  sponsorNameMap: Map<string, string> = new Map();  // For chip display

  // Breadcrumb state
  isEditingDrive = false;
  selectedDriveId: string | null = null;

  private destroy$ = new Subject<void>();

  /**
   * Extract error message from backend response
   * Handles error codes like 11147 and custom error messages
   */
  private getErrorMessage(error: any, fallbackMessage: string): string {
    return error?.error?.message || error?.error?.Message || error?.message || fallbackMessage;
  }

  constructor(
    private temporaryDriveService: TemporaryDriveService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private headerService: HeaderService
  ) {
    this.initializeHeaderConfig();

    effect(() => {
      this.currentChapterId = this.headerService.chapterId();
      if (this.currentChapterId) {
        this.loadTemporaryDrives();
      }
    });
  }

  ngOnInit(): void {
    // No setup needed since we're using app-search-bar component
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Create Drive from Temporary Drive', link: null }
      ],
      title: 'Create Drive from Temporary Drive',
      subtitle: 'Create a Drive from a Temporary Drive Template.',
      actions: []
    };
  }

  /**
   * Update breadcrumbs dynamically based on view state
   * @param mode - 'list' for table view, 'edit' for form view
   * @param driveId - Drive ID for edit mode breadcrumb
   */
  private updateBreadcrumbs(mode: 'list' | 'edit', driveId?: string): void {
    if (mode === 'edit' && driveId) {
      this.headerConfig = {
        ...this.headerConfig,
        title: `Edit Drive ${driveId}`,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: 'Create Drive from Temporary Drive', link: null },
          { label: `Edit Drive ${driveId}`, link: null }
        ]
      };
    } else {
      // Reset to list view breadcrumbs
      this.initializeHeaderConfig();
    }
  }

  onSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredDrives = [...this.temporaryDrives];
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredDrives = this.temporaryDrives.filter(drive =>
      drive.temporaryDriveId.toLowerCase().includes(term) ||
      drive.sponsorName.toLowerCase().includes(term)
    );
  }

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    const dialogWidth = 380;
    const spacing = 8;

    const left = Math.min(
      rect.left,
      window.innerWidth - dialogWidth - spacing
    );

    const dialogRef = this.dialog.open(TemporaryDriveFilterDialog, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      data: {
        currentFilters: this.currentFilters,
        chapterId: this.currentChapterId
      },
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: TemporaryDriveFilterValue | null) => {
        if (filters !== undefined) {  // undefined means canceled
          this.applyFilters(filters);
        }
      });
  }

  applyFilters(filters: TemporaryDriveFilterValue | null): void {
    this.currentFilters = filters;

    // Update filter chips
    const sponsorName = filters?.sponsorId
      ? this.sponsorNameMap.get(filters.sponsorId) || filters.sponsorId
      : undefined;

    this.filterChips = TemporaryDriveFilterChipsUtils.convertFiltersToChips(filters, sponsorName);

    // Reset to first page when filters change
    this.pageIndex = 0;

    // Reload data with new filters
    this.loadTemporaryDrives();
  }

  onRemoveFilterChip(chipKey: string): void {
    const updatedFilters = TemporaryDriveFilterChipsUtils.removeFilterByChipKey(
      this.currentFilters,
      chipKey
    );
    this.applyFilters(updatedFilters);
  }

  clearAllFilters(): void {
    this.applyFilters(null);
  }

  private buildSponsorNameMap(drives: TemporaryDrive[]): void {
    drives.forEach(drive => {
      if (drive.sponsorId && drive.sponsorName) {
        this.sponsorNameMap.set(drive.sponsorId, drive.sponsorName);
      }
    });
  }

  loadTemporaryDrives(): void {
    this.isLoading = true;

    const skip = this.pageIndex * this.pageSize;
    const take = this.pageSize;

    this.temporaryDriveService.getTemporaryDrives(take, skip, this.currentChapterId, this.currentFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.temporaryDrives = response.data;
          this.filteredDrives = [...response.data];
          this.totalRecords = response.totalRecords;
          this.isLoading = false;

          // Build sponsor name map for filter chips
          this.buildSponsorNameMap(response.data);
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(this.getErrorMessage(error, 'Failed to load temporary drives'), 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadTemporaryDrives();
  }

  toggleRow(index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
    this.updateAllRowsExpandedState();
  }

  isRowExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  toggleAllRows(): void {
    if (this.allRowsExpanded) {
      this.expandedRows.clear();
    } else {
      this.filteredDrives.forEach((_, index) => {
        this.expandedRows.add(index);
      });
    }
    this.allRowsExpanded = !this.allRowsExpanded;
  }

  private updateAllRowsExpandedState(): void {
    this.allRowsExpanded = this.expandedRows.size === this.filteredDrives.length && this.filteredDrives.length > 0;
  }

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';

    this.filteredDrives.sort((a, b) => {
      const valueA = new Date(a.driveDate).getTime();
      const valueB = new Date(b.driveDate).getTime();

      if (this.sortDirection === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month.toUpperCase()}-${year}`;
  }

  onCreateDrive(drive: TemporaryDrive): void {
    // Load full temp drive details from backend
    this.isLoading = true;
    this.isEditingDrive = true;
    this.selectedDriveId = drive.temporaryDriveId;

    this.temporaryDriveService.getTemporaryDriveById(drive.temporaryDriveId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fullDrive) => {
          this.selectedDrive = fullDrive || drive;
          this.showForm = true;
          this.isLoading = false;

          // Update breadcrumbs to show edit mode
          this.updateBreadcrumbs('edit', drive.temporaryDriveId);
        },
        error: (error) => {
          // If API fails, use the drive from the list
          this.selectedDrive = drive;
          this.showForm = true;
          this.isLoading = false;

          // Update breadcrumbs to show edit mode
          this.updateBreadcrumbs('edit', drive.temporaryDriveId);

          const errorMsg = this.getErrorMessage(error, 'Could not load full drive details');
          this.snackBar.open(`${errorMsg}, using cached data`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['warning-snackbar']
          });
        }
      });
  }

  onCloseForm(): void {
    this.showForm = false;
    this.selectedDrive = null;
    this.isEditingDrive = false;
    this.selectedDriveId = null;

    // Reset breadcrumbs to list view
    this.updateBreadcrumbs('list');
  }

  onSaveSuccess(): void {
    this.showForm = false;
    this.selectedDrive = null;
    this.isEditingDrive = false;
    this.selectedDriveId = null;

    // Reset breadcrumbs to list view
    this.updateBreadcrumbs('list');

    this.loadTemporaryDrives();
  }
}
