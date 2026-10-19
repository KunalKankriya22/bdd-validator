import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';

import { HeaderService } from '@shared/services/header.service';
import { LabUserAccessService } from '../services/lab-user-access.service';
import {
  UserInfo,
  AccessClass,
  UserDropdownOption
} from '../models/lab-user-access.model';
import { ViewAttachedUsersPanelComponent } from '../view-attached-users-panel/view-attached-users-panel';
import { AddEditAccessClassPanelComponent } from '../add-edit-access-class-panel/add-edit-access-class-panel';

@Component({
  selector: 'app-lab-user-access',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    A11yModule,
    PageHeaderWithBreadcrumb,
    ViewAttachedUsersPanelComponent,
    AddEditAccessClassPanelComponent
  ],
  templateUrl: './lab-user-access.html',
  styleUrl: './lab-user-access.scss'
})
export class LabUserAccessComponent implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Lab User Access', link: null }
    ],
    actions: []
  };

  // Form
  form: FormGroup;

  // User dropdown
  userSearchControl = new FormControl('');
  userOptions: UserDropdownOption[] = [];
  filteredUserOptions: UserDropdownOption[] = [];

  // User data
  userId = '';
  displayUserId = '';  // Uppercase userId for display, set only after successful search
  userInfo: UserInfo | null = null;
  accessClasses: AccessClass[] = [];
  filteredAccessClasses: AccessClass[] = [];

  // State
  hasSearched = false;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Action menu
  showActionMenu = false;
  activeMenuIndex: number | null = null;
  menuOpenAbove = false;
  // 2 menu items × 48px each + 16px padding
  private readonly ACTION_MENU_HEIGHT = 112;

  // Sorting
  sortColumn: 'accessClass' | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  // Add/Edit Access Class Side panel
  addEditPanelOpen = false;
  addEditPanelMode: 'add' | 'edit' = 'add';
  addEditPanelData: AccessClass | null = null;

  // View Attached Users Side panel
  viewUsersPanelOpen = false;
  viewUsersPanelAccessClass = '';
  viewUsersPanelDescription = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private labUserAccessService: LabUserAccessService,
    private headerService: HeaderService
  ) {
    this.form = this.fb.group({
      userId: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsersDropdown();
    this.setupUserSearch();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.addEditPanelOpen = false;
        this.addEditPanelData = null;
        this.viewUsersPanelOpen = false;
        this.loadUsersDropdown();
      });
  }

  private loadUsersDropdown(): void {
    this.labUserAccessService
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

  // =========================
  // SEARCH & RETRIEVE
  // =========================

  onRetrieve(): void {
    const userId = this.form.value.userId?.trim();
    if (!userId) {
      return;
    }

    this.userId = userId;
    this.hasSearched = true;
    this.isLoading = true;
    this.hasError = false;

    this.labUserAccessService
      .getLabUserAccessDetails(userId.toUpperCase())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.displayUserId = userId.toUpperCase();
          this.userInfo = {
            userId: this.displayUserId,  // Use uppercase displayUserId for consistent display
            userName: response.userName || userId,
            department: response.department || ''
          };

          this.accessClasses = response.data || [];
          this.filteredAccessClasses = [...this.accessClasses];
          this.applySorting();
        },
        error: (error) => {
          this.hasError = true;
          this.errorMessage = error.error?.message || 'User not found or error loading access classes';
          this.userInfo = null;
          this.accessClasses = [];
          this.filteredAccessClasses = [];
        }
      });
  }

  onClear(): void {
    this.form.reset();
    this.userId = '';
    this.displayUserId = '';
    this.hasSearched = false;
    this.userInfo = null;
    this.accessClasses = [];
    this.filteredAccessClasses = [];
    this.hasError = false;
    this.errorMessage = '';
    this.sortColumn = null;
    this.sortDirection = null;
    this.showActionMenu = false;
    this.activeMenuIndex = null;
  }

  // =========================
  // SORTING
  // =========================

  onSort(column: 'accessClass'): void {
    if (this.sortColumn === column) {
      // Toggle through: asc -> desc -> null (default)
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
      // Reset to original order
      this.filteredAccessClasses = [...this.accessClasses];
      return;
    }

    this.filteredAccessClasses = [...this.accessClasses].sort((a, b) => {
      const aValue = a[this.sortColumn!];
      const bValue = b[this.sortColumn!];

      if (!aValue) return 1;
      if (!bValue) return -1;

      const comparison = aValue.localeCompare(bValue);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // =========================
  // ACTION MENU
  // =========================

  toggleActionMenu(index: number, event: Event): void {
    event.stopPropagation();

    if (this.activeMenuIndex === index && this.showActionMenu) {
      this.showActionMenu = false;
      this.activeMenuIndex = null;
    } else {
      const trigger = event.target as HTMLElement;
      const triggerRect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      this.menuOpenAbove = spaceBelow < this.ACTION_MENU_HEIGHT;
      this.showActionMenu = true;
      this.activeMenuIndex = index;
    }
  }

  closeActionMenus(): void {
    this.showActionMenu = false;
    this.activeMenuIndex = null;
  }

  // =========================
  // DIALOG ACTIONS
  // =========================

  openAddAccessClass(): void {
    if (!this.userInfo) return;

    this.addEditPanelMode = 'add';
    this.addEditPanelData = null;
    this.addEditPanelOpen = true;
  }

  openEditClass(accessClass: AccessClass, event: Event): void {
    event.stopPropagation();
    this.closeActionMenus();

    this.addEditPanelMode = 'edit';
    this.addEditPanelData = accessClass;
    this.addEditPanelOpen = true;
  }

  // =========================
  // SIDE PANEL
  // =========================

  openViewAttachedUsers(accessClass: AccessClass, event: Event): void {
    event.stopPropagation();
    this.closeActionMenus();

    this.viewUsersPanelAccessClass = accessClass.accessClass;
    this.viewUsersPanelDescription = accessClass.description;
    this.viewUsersPanelOpen = true;
  }

  closeAddEditPanel(): void {
    this.addEditPanelOpen = false;
    this.addEditPanelData = null;
  }

  closeViewUsersPanel(): void {
    this.viewUsersPanelOpen = false;
  }

  onAddEditPanelSaved(): void {
    this.onRetrieve(); // Refresh data
  }

  onAddEditModeChange(newMode: 'add' | 'edit'): void {
    this.addEditPanelMode = newMode;
    if (newMode === 'add') {
      this.addEditPanelData = null;
    }
  }

  // =========================
  // KEYBOARD SHORTCUTS
  // =========================

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: Event): void {
    // Close action menu when clicking outside
    if (this.showActionMenu) {
      this.closeActionMenus();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+A: Assign Access Class
    if (event.altKey && event.key.toLowerCase() === 'a' && this.userInfo) {
      event.preventDefault();
      this.openAddAccessClass();
    }

    // Escape: Close side panels
    if (event.key === 'Escape') {
      if (this.viewUsersPanelOpen) {
        event.preventDefault();
        this.closeViewUsersPanel();
      } else if (this.addEditPanelOpen) {
        event.preventDefault();
        this.closeAddEditPanel();
      }
    }
  }

  // =========================
  // HELPERS
  // =========================

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    if (!m.isValid()) return '-';
    return m.format('DD-MMM-YYYY').toUpperCase();
  }
}
