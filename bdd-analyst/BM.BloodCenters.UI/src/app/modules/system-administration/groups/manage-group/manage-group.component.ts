import { Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

import { GroupService } from '../services/group.service';
import { Group } from '../models/group.model';
import { UI, UI_META } from '../../../../core/constants/ui.constants';
import { EditGroupComponent } from '../view-group/edit-group/edit-group';
import { GroupDetailComponent } from '../view-group/group-detail/group-detail.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderService } from '@shared/services/page-header.service';

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = 'groupId' | null;

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

@Component({
  selector: 'app-manage-group',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    TranslateModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
  ],
  templateUrl: './manage-group.component.html',
  styleUrl: './manage-group.component.scss',
})
export class ManageGroupComponent implements OnInit {
  private groupService = inject(GroupService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private pageHeaderService = inject(PageHeaderService);

  // Constants for template
  readonly UI = UI;
  readonly UI_META = UI_META;

  // Page header configuration (dynamic — populated from PageHeaderService)
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: ''
  };

  constructor() {
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

  // Table columns
  readonly displayedColumns: string[] = ['groupId', 'description', 'userCount', 'actions', 'view'];

  // Signals for reactive state management
  readonly groups = signal<Group[]>([]);
  readonly originalGroups = signal<Group[]>([]); // Store original order for unsort
  readonly allGroups = signal<Group[]>([]); // Store ALL groups for client-side filtering
  readonly isLoading = signal<boolean>(false);
  readonly totalGroups = signal<number>(0);
  readonly searchTerm = signal<string>('');
  readonly sortState = signal<SortState>({ column: null, direction: null });
  readonly editingRowIndex = signal<number | null>(null);
  readonly viewingRowIndex = signal<number | null>(null);
  readonly isEditDialogOpen = signal<boolean>(false);
  readonly isViewDialogOpen = signal<boolean>(false);

  // Computed signals
  readonly hasGroups = computed(() => this.groups().length > 0);
  readonly showNoResults = computed(
    () => !this.isLoading() && !this.hasGroups() && this.searchTerm().length > 0,
  );
  readonly showEmptyState = computed(
    () => !this.isLoading() && !this.hasGroups() && this.searchTerm().length === 0,
  );

  // Get appropriate empty/no-results message
  getNoDataMessage(): string {
    return 'No define groups available to display';
  }

  // Search bar configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Group ID or Description',
    minLength: 3,
    ariaLabel: 'Search groups by ID or description',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  ngOnInit(): void {
    this.loadAllGroups();
  }

  /**
   * Load all groups once on init (no search param - get everything)
   * @param preserveFilters If true, re-apply existing search and sort filters after loading
   */
  private loadAllGroups(preserveFilters = false): void {
    this.isLoading.set(true);

    this.groupService.getGroups().subscribe({
      next: (groups) => {
        // Store all groups for filtering
        this.allGroups.set([...groups]);

        if (preserveFilters) {
          // Re-apply existing search and sort filters
          this.applyFilters();
        } else {
          // Fresh load, show all groups
          this.originalGroups.set([...groups]);
          this.groups.set([...groups]);
          this.totalGroups.set(groups.length);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMessage = error.status === 0
          ? 'Network error. Please check your connection and try again.'
          : error.status === 403
          ? 'You do not have permission to view groups.'
          : 'Failed to load groups. Please try again or contact support.';

        this.snackBar.open(errorMessage, 'Retry', {
          duration: 0,
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        }).onAction().subscribe(() => {
          this.loadAllGroups(preserveFilters);
        });
      },
    });
  }

  /**
   * Apply client-side search and sorting to display groups
   */
  private applyFilters(): void {
    let filteredGroups = [...this.allGroups()];

    // Apply search filter
    const search = this.searchTerm().trim();
    if (search) {
      const searchLower = search.toLowerCase();
      filteredGroups = filteredGroups.filter(
        (group) =>
          group.groupId.toLowerCase().includes(searchLower) ||
          group.description.toLowerCase().includes(searchLower),
      );
    }

    // Store as original for sorting
    this.originalGroups.set([...filteredGroups]);

    // Apply sorting if active
    if (this.sortState().column) {
      filteredGroups = this.applySorting(filteredGroups);
    }

    this.groups.set(filteredGroups);
    this.totalGroups.set(filteredGroups.length);
  }

  /**
   * Apply client-side sorting to groups array
   */
  private applySorting(groups: Group[]): Group[] {
    const { column, direction } = this.sortState();

    if (!column || !direction) {
      return groups;
    }

    return [...groups].sort((a, b) => {
      const comparison = a.groupId.localeCompare(b.groupId);
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Handle search from SearchBar component
   */
  onSearch(searchText: string): void {
    this.searchTerm.set(searchText);
    this.applyFilters();
  }

  /**
   * Handle cleared event from SearchBar component
   */
  onSearchCleared(): void {
    this.searchTerm.set('');
    this.applyFilters();
  }

  /**
   * Handle column header click for sorting
   */
  onSort(column: SortColumn): void {
    if (!column) return;

    const currentSort = this.sortState();
    let newDirection: SortDirection;

    if (currentSort.column === column) {
      // Cycle through: asc -> desc -> null
      if (currentSort.direction === 'asc') {
        newDirection = 'desc';
      } else if (currentSort.direction === 'desc') {
        newDirection = null;
      } else {
        newDirection = 'asc';
      }
    } else {
      // New column, start with ascending
      newDirection = 'asc';
    }

    this.sortState.set({
      column: newDirection ? column : null,
      direction: newDirection,
    });

    // Re-apply filters (search + sort) to maintain search results
    this.applyFilters();
  }

  /**
   * Get sort icon for column header
   */
  getSortIcon(column: SortColumn): string {
    const currentSort = this.sortState();

    if (currentSort.column !== column) {
      return 'unfold_more'; // Unsorted
    }

    return currentSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  /**
   * Get ARIA label for sort button
   */
  getSortAriaLabel(column: SortColumn): string {
    if (!column) {
      return '';
    }

    const currentSort = this.sortState();

    if (currentSort.column === column) {
      return currentSort.direction === 'asc'
        ? this.UI.SYSTEM_ADMIN.GROUPS.VIEW.ARIA.SORT_ASCENDING
        : this.UI.SYSTEM_ADMIN.GROUPS.VIEW.ARIA.SORT_DESCENDING;
    }

    return 'Sort by group ID';
  }

  /**
   * Handle edit action for a group
   */
  onEdit(group: Group): void {
    // Prevent multiple dialogs from opening
    if (this.isEditDialogOpen()) {
      return;
    }

    this.isEditDialogOpen.set(true);

    // Set editing row index for highlighting
    const currentGroups = this.groups();
    const editIndex = currentGroups.findIndex((g) => g.groupId === group.groupId);
    this.editingRowIndex.set(editIndex);

    const dialogRef = this.dialog.open(EditGroupComponent, {
      width: '700px',
      ariaLabel: `Edit group ${group.applId}, ${group.groupId}`,
      panelClass: 'edit-group-dialog',
      disableClose: true,
      autoFocus: false,
      data: { group },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.editingRowIndex.set(null);
      this.isEditDialogOpen.set(false);
      if (result && result.updated) {
        // Reload groups to show updated data while preserving search/sort filters
        this.loadAllGroups(true);
      }
    });
  }

  /**
   * Handle view action for a group
   */
  onView(group: Group): void {
    // Prevent multiple dialogs from opening
    if (this.isViewDialogOpen()) {
      return;
    }

    this.isViewDialogOpen.set(true);

    // Set viewing row index for highlighting
    const currentGroups = this.groups();
    const viewIndex = currentGroups.findIndex((g) => g.groupId === group.groupId);
    this.viewingRowIndex.set(viewIndex);

    // Fetch group detail from service
    this.groupService
      .getGroupDetail(group.applId, group.groupId)
      .subscribe({
        next: (groupDetail) => {
          const currentIndex = currentGroups.findIndex((g) => g.groupId === group.groupId);

          const dialogRef = this.dialog.open(GroupDetailComponent, {
            width: '50%',
            height: '100vh',
            position: { right: '0' },
            panelClass: 'group-detail-right-dialog',
            disableClose: true,
            autoFocus: false,
            data: {
              group,
              groupDetail,
              currentIndex: currentIndex + 1,
              totalGroups: currentGroups.length,
              allGroups: currentGroups,
            },
          });

          dialogRef.afterClosed().subscribe(() => {
            this.viewingRowIndex.set(null);
            this.isViewDialogOpen.set(false);
          });
        },
        error: (error) => {
          this.viewingRowIndex.set(null);
          this.isViewDialogOpen.set(false);
          const errorMessage = error.status === 404
            ? 'Group details not found.'
            : error.status === 403
            ? 'You do not have permission to view this group.'
            : 'Failed to load group details. Please try again.';

          this.snackBar.open(errorMessage, 'OK', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        },
      });
  }

  /**
   * Check if row is being edited
   */
  isRowEditing(index: number): boolean {
    return this.editingRowIndex() === index;
  }

  /**
   * Check if row is being viewed
   */
  isRowViewing(index: number): boolean {
    return this.viewingRowIndex() === index;
  }

  /**
   * Track by function for ngFor performance
   */
  trackByGroupId(index: number, group: Group): string {
    return group.groupId;
  }
}
