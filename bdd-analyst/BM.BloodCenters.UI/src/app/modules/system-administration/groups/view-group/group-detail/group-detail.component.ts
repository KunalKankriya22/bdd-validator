import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

import { Group, GroupDetail, GroupMember } from '../../models/group.model';
import { GroupService } from '../../services/group.service';
import { UI, UI_META } from '../../../../../core/constants/ui.constants';
import { SearchBar, SearchBarConfig } from '../../../../../shared/components/search-bar/search-bar';

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = 'userId' | 'name' | 'staffId' | 'accessLevel' | null;

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

interface GroupDetailDialogData {
  group: Group;
  groupDetail: GroupDetail;
  currentIndex: number;
  totalGroups: number;
  allGroups: Group[];
}

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    TranslateModule,
    SearchBar,
  ],
  templateUrl: './group-detail.component.html',
  styleUrl: './group-detail.component.scss'
})
export class GroupDetailComponent {
  private groupService = inject(GroupService);

  // Constants for template
  readonly UI = UI;
  readonly UI_META = UI_META;

  searchQuery = '';
  displayedColumns: string[] = ['userId', 'name', 'staffId', 'accessLevel'];
  filteredMembers: GroupMember[] = [];
  originalMembers: GroupMember[] = [];
  sortState: SortState = { column: null, direction: null };

  // Check if no results state should be shown
  get showNoResults(): boolean {
    return this.filteredMembers.length === 0 && this.searchQuery.length > 0;
  }

  // Check if empty state (no members at all) should be shown
  get showEmptyState(): boolean {
    return this.filteredMembers.length === 0 && this.searchQuery.length === 0;
  }

  // Get appropriate message for no data
  getNoDataMessage(): string {
    return 'No added members & access available to display';
  }

  group: Group;
  groupDetail: GroupDetail;
  currentIndex: number;
  totalGroups: number;
  allGroups: Group[];

  // Search bar configuration
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by ID, Name, or Access Level',
    minLength: 1,
    ariaLabel: 'Search members by ID, name, or access level',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  constructor(
    public dialogRef: MatDialogRef<GroupDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupDetailDialogData
  ) {
    this.group = data.group;
    this.groupDetail = data.groupDetail;
    this.currentIndex = data.currentIndex;
    this.totalGroups = data.totalGroups;
    this.allGroups = data.allGroups;
    this.filteredMembers = [...this.groupDetail.members];
    this.originalMembers = [...this.groupDetail.members];
  }

  public onSearch(searchText: string): void {
    this.searchQuery = searchText.toLowerCase();
    this.applyFilters();
  }

  public onSearchCleared(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  public onSort(column: SortColumn): void {
    if (!column) return;

    const currentSort = this.sortState;
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

    this.sortState = {
      column: newDirection ? column : null,
      direction: newDirection
    };

    // Re-apply filters (search + sort) to maintain search results
    this.applyFilters();
  }

  private applySorting(members: GroupMember[]): GroupMember[] {
    const { column, direction } = this.sortState;
    
    if (!column || !direction) {
      return members;
    }

    return [...members].sort((a, b) => {
      let comparison = 0;
      
      if (column === 'userId') {
        comparison = a.userId.localeCompare(b.userId);
      } else if (column === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (column === 'staffId') {
        comparison = a.staffId.localeCompare(b.staffId);
      } else if (column === 'accessLevel') {
        comparison = a.accessLevel - b.accessLevel;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  public getSortIcon(column: SortColumn): string {
    const currentSort = this.sortState;
    
    if (currentSort.column !== column) {
      return 'unfold_more';
    }
    
    return currentSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  public getSortAriaLabel(column: SortColumn): string {
    if (!column) return '';
    
    const currentSort = this.sortState;
    
    if (currentSort.column === column) {
      return currentSort.direction === 'asc' 
        ? `Sort ${column} descending`
        : `Sort ${column} ascending`;
    }
    
    return `Sort by ${column}`;
  }

  public closeDialog(): void {
    this.dialogRef.close();
  }

  public getCurrentGroupIndex(): number {
    return this.currentIndex;
  }

  public getTotalGroups(): number {
    return this.totalGroups;
  }

  public navigateToPreviousGroup(): void {
    if (this.currentIndex > 1) {
      const prevGroup = this.allGroups[this.currentIndex - 2];
      this.loadGroupDetail(prevGroup, true); // Preserve search when navigating
    }
  }

  public navigateToNextGroup(): void {
    if (this.currentIndex < this.totalGroups) {
      const nextGroup = this.allGroups[this.currentIndex];
      this.loadGroupDetail(nextGroup, true); // Preserve search when navigating
    }
  }

  public isFirstGroup(): boolean {
    return this.currentIndex === 1;
  }

  public isLastGroup(): boolean {
    return this.currentIndex === this.totalGroups;
  }

  private loadGroupDetail(group: Group, preserveSearch: boolean = false): void {
    this.groupService.getGroupDetail(group.applId, group.groupId).subscribe({
      next: (groupDetail) => {
        this.group = group;
        this.groupDetail = groupDetail;
        this.currentIndex = this.allGroups.findIndex(g => g.groupId === group.groupId) + 1;

        if (preserveSearch && this.searchQuery) {
          // Reapply existing search and sort to new data
          this.applyFilters();
        } else {
          // No search to preserve, show all members
          this.searchQuery = '';
          this.originalMembers = [...groupDetail.members];
          this.filteredMembers = [...groupDetail.members];
        }
      }
    });
  }

  /**
   * Apply search and sorting filters
   */
  private applyFilters(): void {
    // First apply search
    let filtered: GroupMember[];

    if (!this.searchQuery) {
      filtered = [...this.groupDetail.members];
    } else {
      const searchLower = this.searchQuery.toLowerCase();
      filtered = this.groupDetail.members.filter((member: GroupMember) =>
        member.userId.toLowerCase().includes(searchLower) ||
        member.name.toLowerCase().includes(searchLower) ||
        member.accessLevel.toString().includes(searchLower)
      );
    }

    // Store as originalMembers for unsorted state
    this.originalMembers = [...filtered];

    // Then apply sorting if active
    if (this.sortState.column && this.sortState.direction) {
      filtered = this.applySorting(filtered);
    }

    this.filteredMembers = filtered;
  }

  /**
   * Refresh current group data while preserving search
   */
  public refreshGroupDetail(): void {
    this.loadGroupDetail(this.group, true);
  }
}
