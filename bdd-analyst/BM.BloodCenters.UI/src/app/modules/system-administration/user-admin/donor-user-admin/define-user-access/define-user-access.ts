import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UserAccessService } from '../services/user-access.service';
import { UserAccessClassDialogService } from '../services/user-access-class-dialog.service';
import {
  UserAccessClassRow,
  DefineUserAccessListDto,
  UserAccessInfo,
  UserDropdownOption
} from '../models/user-access.model';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AttachedUsersListDialogComponent } from '../attached-users-list-dialog/attached-users-list-dialog.component';
import { OverlappingInterdictionsDialogComponent } from '../overlapping-interdictions-dialog/overlapping-interdictions-dialog.component';
import { formatTableDate, formatTableValue } from '../utils/table-display.util';
import { ViewAssociatedInterdictionComponent } from '../../../view-associated-interdiction/view-associated-interdiction';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-define-user-access',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    RouterModule,
    PageHeaderWithBreadcrumb,
    MatButtonModule,
    ViewAssociatedInterdictionComponent
  ],
  templateUrl: './define-user-access.html',
  styleUrl: './define-user-access.scss',
})
export class DefineUserAccess implements OnInit, OnDestroy {

  constructor(
    private userAccessService: UserAccessService,
    private accessClassDialogService: UserAccessClassDialogService,
    private headerService: HeaderService
  ) {}

  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  /** Page header configuration */
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'User Access Management', link: null }
    ]
  };

  /** User dropdown */
  userSearchControl = new FormControl('');
  userOptions: UserDropdownOption[] = [];
  filteredUserOptions: UserDropdownOption[] = [];

  /** Search state */
  userId = '';
  displayUserId = '';  // Uppercase userId for display, set only after successful search
  hasSearched = false;

  /** User info after retrieval */
  userInfo: UserAccessInfo | null = null;

  /** Data state */
  isLoading = false;
  hasError = false;
  errorMessage = '';

  /** Table data */
  accessClasses: UserAccessClassRow[] = [];
  private originalAccessClasses: UserAccessClassRow[] = [];

  /** Pagination */
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  /** Sorting */
  sortColumn: 'accessClass' | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  /** Row selection */
  selectedRow: UserAccessClassRow | null = null;
  private menuActionTriggered = false;

  /** Side panel state for associated interdictions */
  isPanelOpen = false;
  selectedAccessClass = '';
  selectedAccessClassDescription = '';

  ngOnInit(): void {
    this.loadUsersDropdown();
    this.setupUserSearch();
    this.subscribeToChapterChanges();
  }

  /**
   * Subscribe to chapter change events from header
   * When chapter changes, reload users dropdown and refresh grid if a search was performed
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear previous search state since chapter context has changed
        this.clearUserSearch();

        // Close side panel if open
        this.isPanelOpen = false;
        this.selectedAccessClass = '';
        this.selectedAccessClassDescription = '';

        // Reload users dropdown for the new chapter
        this.loadUsersDropdown();
      });
  }

  private loadUsersDropdown(): void {
    this.userAccessService
      .getUsersDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.userOptions = users;
          this.filteredUserOptions = users;
        },
        error: () => {
          this.userOptions = [];
          this.filteredUserOptions = [];
        }
      });
  }

  private setupUserSearch(): void {
    this.userSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const term = (searchTerm || '').toLowerCase();
        this.filteredUserOptions = this.userOptions.filter((user) =>
          user.userId.toLowerCase().includes(term) ||
          user.userName.toLowerCase().includes(term)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Check if retrieve button should be disabled */
  get isRetrieveDisabled(): boolean {
    return !this.userId || this.userId.trim().length === 0;
  }

  /** Get paginated access classes (show all if 50 or fewer rows) */
  get pagedAccessClasses(): UserAccessClassRow[] {
    // If 50 or fewer rows, show all (no pagination)
    if (this.accessClasses.length <= 50) {
      return this.accessClasses;
    }
    // Otherwise, paginate
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    return this.accessClasses.slice(start, end);
  }

  get startRow(): number {
    return this.accessClasses.length === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get endRow(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.accessClasses.length);
  }

  /** Handle retrieve action */
  onRetrieve(): void {
    const trimmedUserId = this.userId.trim();
    if (!trimmedUserId) {
      return;
    }

    this.hasSearched = true;
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.selectedRow = null;

    this.userAccessService
      .getUserAccessClasses(trimmedUserId.toUpperCase())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.handleResponse(response);
        },
        error: (err) => {
          this.isLoading = false;
          this.hasError = true;
          this.errorMessage = 'An error occurred while retrieving user data. Please try again.';
          this.userInfo = null;
          this.accessClasses = [];
          console.error('API Error:', err);
        }
      });
  }

  /** Handle API response */
  private handleResponse(response: DefineUserAccessListDto[]): void {
    this.displayUserId = this.userId.toUpperCase();

    if (!response || response.length === 0) {
      // Set userInfo from dropdown selection so buttons remain enabled
      const selectedUser = this.userOptions.find(
        u => u.userId.toUpperCase() === this.displayUserId
      );
      this.userInfo = {
        userId: this.displayUserId,
        userName: selectedUser?.userName || '',
        department: ''
      };
      this.accessClasses = [];
      return;
    }

    // Extract user info from first record
    const first = response[0];
    this.userInfo = {
      userId: this.displayUserId,  // Use uppercase displayUserId for consistent display
      userName: first.userName,
      department: first.department || ''
    };

    // Map access classes to table rows
    this.originalAccessClasses = response.map(item => this.mapToAccessClassRow(item));
    this.accessClasses = [...this.originalAccessClasses];
    this.sortColumn = null;
    this.sortDirection = null;
    this.pageIndex = 0;
  }

  /** Map API response to table row */
  private mapToAccessClassRow(item: DefineUserAccessListDto): UserAccessClassRow {
    return {
      accessClass: item.accessClass,
      description: item.description,
      level: item.level,
      effectiveDate: item.effectiveDate,
      terminationDate: item.terminationDate
    };
  }

  /** Clear search and reset state */
  clearUserSearch(): void {
    this.userId = '';
    this.displayUserId = '';
    this.hasSearched = false;
    this.userInfo = null;
    this.accessClasses = [];
    this.hasError = false;
    this.errorMessage = '';
  }

  /** Handle overlapping interdictions button click */
  onOverlappingInterdictions(): void {
    this.dialog.open(OverlappingInterdictionsDialogComponent, {
      width: '800px',
      height: '100vh',
      position: { top: '0', right: '0' },
      panelClass: 'overlapping-interdictions-dialog',
      data: { userId: this.userId }
    });
  }

  /** Handle assign access class button click */
  onAssignAccessClass(): void {
    if (!this.userInfo) {
      return;
    }

    this.accessClassDialogService
      .openAssignAccessClassDialog(this.userInfo)
      .pipe(takeUntil(this.destroy$))
      .subscribe((success: boolean) => {
        if (success) {
          this.onRetrieve();
        }
      });
  }

  /** Handle edit action for a row */
  onEditRow(row: UserAccessClassRow): void {
    if (!this.userInfo) {
      return;
    }

    this.selectedRow = row;

    this.accessClassDialogService
      .openEditAccessClassDialog(this.userInfo, row)
      .pipe(takeUntil(this.destroy$))
      .subscribe((success: boolean) => {
        this.selectedRow = null;
        if (success) {
          this.onRetrieve();
        }
      });
  }

  /** Handle view attached users action */
  onViewAttachedUsers(row: UserAccessClassRow): void {
    this.menuActionTriggered = true;
    this.selectedRow = row;

    const dialogRef = this.dialog.open(AttachedUsersListDialogComponent, {
      width: '800px',
      height: '100vh',
      position: {
        top: '0',
        right: '0'
      },
      panelClass: 'right-side-dialog',
      data: {
        accessClass: row.accessClass,
        description: row.description
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedRow = null;
      });
  }

  /** Handle view associated interdictions action */
  onViewAssociatedInterdictions(row: UserAccessClassRow): void {
    this.menuActionTriggered = true;
    this.selectedRow = row;
    this.selectedAccessClass = row.accessClass;
    this.selectedAccessClassDescription = row.description;
    this.isPanelOpen = true;
  }

  /** Close associated interdictions panel */
  closeInterdictionPanel(): void {
    this.isPanelOpen = false;
    this.selectedRow = null;
  }

  /** Handle menu closed — clear highlight only if no action was triggered */
  onMenuClosed(): void {
    if (!this.menuActionTriggered) {
      this.selectedRow = null;
    }
    this.menuActionTriggered = false;
  }

  /** Sort by column */
  onSort(column: 'accessClass'): void {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = null;
        this.sortColumn = null;
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySorting();
  }

  private applySorting(): void {
    if (!this.sortColumn || !this.sortDirection) {
      this.accessClasses = [...this.originalAccessClasses];
      this.pageIndex = 0;
      return;
    }

    this.accessClasses = [...this.originalAccessClasses];
    this.accessClasses.sort((a, b) => {
      const aValue = a.accessClass || '';
      const bValue = b.accessClass || '';

      const comparison = aValue.localeCompare(bValue);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    this.pageIndex = 0;
  }

  /** Pagination methods */
  nextPage(): void {
    if ((this.pageIndex + 1) * this.pageSize < this.accessClasses.length) {
      this.pageIndex++;
    }
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
    }
  }

  goToFirst(): void {
    this.pageIndex = 0;
  }

  goToLast(): void {
    this.pageIndex = Math.floor((this.accessClasses.length - 1) / this.pageSize);
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
  }

  /** Format date for table display */
  formatTableDate(date: string | Date | null | undefined): string {
    return formatTableDate(date);
  }

  /** Format value for table display */
  formatTableValue(value: any): string {
    return formatTableValue(value);
  }
}
