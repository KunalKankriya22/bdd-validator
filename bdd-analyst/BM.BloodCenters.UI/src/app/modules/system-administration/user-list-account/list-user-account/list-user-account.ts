import { Component, OnInit, OnDestroy, HostListener, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import {
  UserAccount,
} from '@shared/interfaces/user-account.interface';
import { UserAccountService, GetUserAccountsRequest } from '../list-user-account.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MatDialog } from '@angular/material/dialog';
import { UserAccountFilterComponent, UserAccountFilter } from '../filter/user-account-filter/user-account-filter';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import moment from 'moment';
import { ResetPasswordPreviewComponent } from '../../../reset-password-preview/reset-password-preview';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { UserAccountFilterChipsUtils } from '../utils/filter-chips.utils';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

type UserRowAction =
  | 'edit'
  | 'view'
  | 'assignWarehouse'
  | 'assignInterdictions'
  | 'resetPassword'
  | 'lockAccount';

@Component({
  selector: 'app-list-user-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, PageHeaderWithBreadcrumb, MatMomentDateModule, FilterChips, MatSnackBarModule, SearchBar],
  templateUrl: './list-user-account.html',
  styleUrls: ['./list-user-account.scss'],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }],
})
export class ListUserAccountComponent implements OnInit, OnDestroy {
  private readonly headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: '',
    minLength: 2,
    ariaLabel: '',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  userAccounts: UserAccount[] = [];
  filteredAccounts: UserAccount[] = [];
  appliedFilters: UserAccountFilter | null = null;
  filterChips: FilterChip[] = [];

  searchQuery = '';
  isFilterOpen = false;
  isLoading = false;

  showActionMenu = false;
  activeActionUserId: string | null = null;

  private filterDialogRef: any = null;

  editForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userAccountService: UserAccountService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService
  ) {
    this.editForm = this.fb.group({
      userId: [{ value: '', disabled: true }],
      name: ['', [Validators.required, Validators.minLength(2)]],
      userClass: ['', Validators.required],
      labCode: ['', Validators.required],
      effectiveDate: ['', Validators.required],
      terminationDate: [''],
    });

    this.initializeConfigurations();

    // Update header from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'PASSWORD CONFIGURATION',
          ariaLabel: 'Configure password settings',
          onClick: () => this.goPasswordConfig()
        },
        {
          label: 'ADD NEW USER',
          icon: 'add',
          ariaLabel: 'Add new user account',
          onClick: () => this.addNewUser()
        }
      ]
    };

    this.searchConfig = {
      placeholder: 'Search by User ID, Name or User Class',
      minLength: 2,
      ariaLabel: 'Search by User ID, Name or User Class',
      searchOnEnterOnly: true,
      alwaysShowTooltip: true
    };
  }

  // -----------------------------
  // NAVIGATION
  // -----------------------------

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goSystemAdmin(): void {
    this.router.navigate(['/system-administration/menu-admin']);
  }

  goUserAdmin(): void {
    this.router.navigate(['/system-administration/manage-users']);
  }

  // -----------------------------
  // INIT
  // -----------------------------

  ngOnInit(): void {
    this.loadUserAccounts();
    this.subscribeToChapterChanges();
  }

  // -----------------------------
  // ACCOUNT STATUS HELPERS
  // -----------------------------

  isAccountLocked(user: UserAccount): boolean {
    return !user.isActive;
  }

  getAccountStatusText(user: UserAccount): string {
    return user.isActive ? 'Unlocked' : 'Locked';
  }

  getAccountStatusIconPath(user: UserAccount): string {
    return user.isActive
      ? '/images/account-user-list/lock-open.svg'
      : '/images/account-user-list/Vector.svg';
  }

  sortDirection: 'asc' | 'desc' = 'desc';

  toggleSort(column: 'userId'): void {
    if (column === 'userId' && !this.isLoading) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      this.loadUserAccounts();
    }
  }

  loadUserAccounts(): void {
    // Prevent multiple simultaneous API calls
    if (this.isLoading) {
      return;
    }

    const request = this.buildRequestPayload();
    this.isLoading = true;

    this.userAccountService.getUserAccounts(request).subscribe({
      next: (users) => {
        this.userAccounts = users;
        this.filteredAccounts = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user accounts:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load user accounts', 'DISMISS', {
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
      }
    });
  }

  // -----------------------------
  // SEARCH + FILTER
  // -----------------------------

  onSearch(searchText: string): void {
    if (this.isLoading) {
      return;
    }
    this.searchQuery = searchText;
    this.loadUserAccounts();
  }

  private buildRequestPayload(): GetUserAccountsRequest {
    const request: GetUserAccountsRequest = {
      searchKeyword: this.searchQuery?.trim() || null,
      sortDirection: this.sortDirection.toUpperCase(),
      accountStatus: null,
      effectiveDate: null,
      termDate: null,
      periodEffDate: null,
      periodTermDate: null
    };

    // Apply filter values if filters are active
    if (this.appliedFilters) {
      // Map account status filter value
      if (this.appliedFilters.accountStatus) {
        request.accountStatus = this.appliedFilters.accountStatus;
      }

      // Handle effective date filter
      if (this.appliedFilters.effectiveDate) {
        const effDate = moment(this.appliedFilters.effectiveDate).format('YYYY-MM-DD');
        request.effectiveDate = effDate;  // Send the actual date
        request.periodEffDate = this.appliedFilters.effectiveDatePeriod;  // Send "BEFORE" or "AFTER"
      }

      // Handle termination date filter
      if (this.appliedFilters.terminationDate) {
        const termDate = moment(this.appliedFilters.terminationDate).format('YYYY-MM-DD');
        request.termDate = termDate;  // Send the actual date
        request.periodTermDate = this.appliedFilters.terminationDatePeriod;  // Send "BEFORE" or "AFTER"
      }
    }

    return request;
  }

  editUser(userId: string): void {
    this.closeActionMenu();
    this.router.navigate(['/system-administration/manage-users/edit-user', userId]);
  }

  // -----------------------------
  // ACTION MENU
  // -----------------------------
  activeActionRowIndex: number | null = null;
  actionMenuPosition = { top: '0px', left: '0px' };

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showActionMenu) {
      return;
    }

    const target = event.target as HTMLElement;

    // Only close if clicking outside BOTH button and menu
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

    // Calculate position dynamically with viewport boundary checks
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const menuWidth = 260; // Width of action menu
    const menuHeight = 250; // Approximate height of action menu

    // Calculate preferred left position (to the left of button)
    let leftPos = rect.left + window.scrollX - menuWidth - 8;

    // Check if menu would go off-screen on the left
    if (leftPos < 0) {
      // Position to the right of the button instead
      leftPos = rect.right + window.scrollX + 8;
    }

    // Check if menu would go off-screen on the right
    if (leftPos + menuWidth > window.innerWidth) {
      // Align to right edge with some padding
      leftPos = window.innerWidth - menuWidth - 16;
    }

    // Calculate top position with boundary check
    let topPos = rect.top + window.scrollY;

    // Check if menu would go off-screen at the bottom
    if (topPos + menuHeight > window.scrollY + window.innerHeight) {
      // Position above the button
      topPos = rect.bottom + window.scrollY - menuHeight;
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

  onRowAction(action: UserRowAction, userId: string): void {
    console.log(action, userId);
    this.closeActionMenu();

    switch (action) {
      case 'edit':
        this.editUser(userId);
        break;
      case 'view':
        this.viewUserDetails(userId);
        break;
      case 'assignWarehouse':
        this.assignToWarehouse(userId);
        break;
      case 'assignInterdictions':
        this.assignInterdictions(userId);
        break;
      case 'resetPassword':
        const user = this.userAccounts.find(u => u.userId === userId);
        this.openResetPasswordDialog(userId, user?.email, user?.name);
        break;
      case 'lockAccount':
        this.toggleAccountLock(userId);
        break;
    }
  }

  viewUserDetails(_userId: string): void {
    this.router.navigate(['/unauthorized']);
  }

  assignToWarehouse(userId: string): void {
    this.router.navigate(['/system-administration/user-admin/user-warehouse'], {
      queryParams: { userId }
    });
  }

  assignInterdictions(userId: string): void {
    this.router.navigate(['/system-administration/user-admin/donor-user-admin/user-access-menus-interdiction'], {
      queryParams: { userId }
    });
  }

  toggleAccountLock(userId: string): void {
    const user = this.userAccounts.find(u => u.userId === userId);
    if (!user) {
      return;
    }

    // Toggle the lock status (if currently active/unlocked, then lock it, otherwise unlock it)
    const shouldLock = user.isActive ?? false;
    const action = shouldLock ? 'locked' : 'unlocked';

    this.userAccountService.toggleAccountLock(userId, shouldLock).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(`User account ${action} successfully`, 'DISMISS', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
          // Reload the user accounts to get the updated status
          this.loadUserAccounts();
        }
      },
      error: (error) => {
        console.error(`Error ${action.replace('ed', 'ing')} user account:`, error);

        // Extract error message from API response
        const errorResponseError = error?.error?.errorResponse?.error || '';
        const errorCode = error?.error?.errorCode || '';
        const errorField = error?.error?.error || '';
        const errorMsg = error?.error?.message || '';

        let errorMessage = `Failed to ${action.replace('ed', '')} user account`;

        // Check for errorResponse.error first (from standardized API response)
        if (errorResponseError) {
          errorMessage = errorResponseError;
        }
        // Check for errorCode field
        else if (errorCode) {
          errorMessage = errorCode;
        }
        // Check error field
        else if (errorField && typeof errorField === 'string') {
          errorMessage = errorField;
        }
        // Check message field
        else if (errorMsg && errorMsg.trim() !== '') {
          errorMessage = errorMsg;
        }

        this.snackBar.open(errorMessage, 'DISMISS', {
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
      }
    });
  }

  openResetPasswordDialog(userId: string, email?: string, userFullName?: string): void {
    const dialogRef = this.dialog.open(ResetPasswordPreviewComponent, {
      width: '600px',
      panelClass: 'reset-password-dialog',
      autoFocus: false,
      disableClose: false,
      data: { userId, email, userFullName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Password reset completed for:', userId);
      }
    });
  }

  // -----------------------------
  // BUTTON ACTIONS
  // -----------------------------

  addNewUser(): void {
    // Close filter dialog if open
    if (this.filterDialogRef) {
      this.filterDialogRef.close();
      this.filterDialogRef = null;
    }
    this.router.navigate(['/system-administration/manage-users/add-user']);
  }

  goPasswordConfig(): void {
    // Close filter dialog if open
    if (this.filterDialogRef) {
      this.filterDialogRef.close();
      this.filterDialogRef = null;
    }
    this.router.navigate(['/system-administration/password-configuration']);
  }

  openFilter(event: MouseEvent): void {
    if (this.isLoading) {
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    this.isFilterOpen = true;

    this.filterDialogRef = this.dialog.open(UserAccountFilterComponent, {
      width: '400px',
      panelClass: 'user-account-filter-dialog',
      autoFocus: false,
      hasBackdrop: true,
      backdropClass: 'user-account-filter-backdrop',
      data: this.appliedFilters ?? null,

      position: {
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
      },
    });

    this.filterDialogRef.afterClosed().subscribe((filters: UserAccountFilter | undefined) => {
      this.isFilterOpen = false;
      this.filterDialogRef = null;
      // Remove focus from the filter button to prevent highlight
      button.blur();
      if (filters) {
        this.applyDialogFilters(filters);
      }
    });
  }

  private applyDialogFilters(filters: UserAccountFilter): void {
    this.appliedFilters = filters;
    this.filterChips = UserAccountFilterChipsUtils.convertFiltersToChips(filters);
    this.loadUserAccounts();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedFilters = UserAccountFilterChipsUtils.removeFilterByChipKey(
      this.appliedFilters,
      chipKey
    );
    this.filterChips = UserAccountFilterChipsUtils.convertFiltersToChips(this.appliedFilters);
    this.loadUserAccounts();
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.filterChips = [];
    this.loadUserAccounts();
  }

  /**
   * Subscribe to chapter changes to reload data
   * Following the pattern from donor-access-class.ts
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}