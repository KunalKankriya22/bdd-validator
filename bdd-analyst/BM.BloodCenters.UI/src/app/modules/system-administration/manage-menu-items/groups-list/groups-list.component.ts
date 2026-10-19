import { Component, computed, inject, signal, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HeaderService } from '@shared/services/header.service';

import { MenuItemService } from '../services/menu-item.service';
import { Group } from '../models/menu-item.model';
import { GroupSelectionEvent } from '../interfaces/selection-event.interface';
import { UI_META } from '../../../../core/constants/ui.constants';

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = 'groupId' | null;

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './groups-list.component.html',
  styleUrl: './groups-list.component.scss',
})
export class GroupsListComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private menuItemService = inject(MenuItemService);
  private snackBar = inject(MatSnackBar);
  private headerService = inject(HeaderService);

  private destroy$ = new Subject<void>();

  readonly UI_META = UI_META.SYSTEM_ADMIN.MANAGE_MENU_ITEMS.GROUPS_LIST;
  readonly displayedColumns: string[] = ['groupId', 'description', 'userCount'];

  readonly groups = signal<Group[]>([]);
  readonly originalGroups = signal<Group[]>([]);
  readonly allGroups = signal<Group[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly sortState = signal<SortState>({ column: null, direction: null });
  readonly selectedGroupId = signal<string | null>(null);
  readonly editingRowIndex = signal<number | null>(null);

  readonly hasGroups = computed(() => this.groups().length > 0);
  readonly showNoResults = computed(
    () => !this.isLoading() && !this.hasGroups() && this.searchTerm().length > 0,
  );
  readonly hasSearchValue = computed(() => {
    const value = this.searchForm.controls.search.value;
    return typeof value === 'string' && value.trim().length > 0;
  });

  readonly searchForm = this.fb.nonNullable.group({
    search: [''],
  });

  @Output() groupSelected = new EventEmitter<GroupSelectionEvent>();
  @Output() loadingStateChange = new EventEmitter<boolean>();
  @Input() checkBeforeSelect: boolean = false;
  @Output() requestSelectionChange = new EventEmitter<{ group: Group, index: number, callback: (allowed: boolean) => void }>();

  @Input() set forceSelectedGroupId(groupId: string | null) {
    if (groupId) {
      this.selectedGroupId.set(groupId);
    }
  }

  @Input() set editingGroup(index: number | null) {
    this.editingRowIndex.set(index);
  }

  private _activeTabIndex = 0;
  @Input() set activeTabIndex(index: number) {
    const changed = this._activeTabIndex !== index;
    this._activeTabIndex = index;
    if (changed) {
      this.loadAllGroups();
    }
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.loadAllGroups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter change events from header
   * Empty subscription as this component only displays a list
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Empty subscription - no dropdown data to reload
      });
  }

  private loadAllGroups(): void {
    this.isLoading.set(true);
    this.loadingStateChange.emit(true);

    const groups$ = this._activeTabIndex === 1
      ? this.menuItemService.getOnsiteGroups()
      : this.menuItemService.getGroups();

    groups$
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.loadingStateChange.emit(false);
        })
      )
      .subscribe({
        next: (groups) => {
          this.allGroups.set([...groups]);
          this.originalGroups.set([...groups]);
          this.groups.set([...groups]);

          if (groups.length > 0) {
            this.onRowClick(groups[0], 0);
          }
        },
        error: (error) => {
          console.error('Error loading groups:', error);
        },
      });
  }

  onSearch(): void {
    const rawValue = this.searchForm.controls.search.value;
    const searchValue = typeof rawValue === 'string' ? rawValue.trim() : '';
    this.searchTerm.set(searchValue);
    this.applyFilters();
  }

  onClearSearch(): void {
    this.searchForm.controls.search.setValue('');
    this.searchTerm.set('');
    this.applyFilters();
  }

  private applyFilters(): void {
    let filteredGroups = [...this.allGroups()];

    const search = this.searchTerm().trim();
    if (search) {
      const searchLower = search.toLowerCase();
      filteredGroups = filteredGroups.filter(
        (group) =>
          group.groupId.toLowerCase().includes(searchLower) ||
          group.description.toLowerCase().includes(searchLower),
      );
    }

    this.originalGroups.set([...filteredGroups]);

    if (this.sortState().column) {
      filteredGroups = this.applySorting(filteredGroups);
    }

    this.groups.set(filteredGroups);

    const selectedId = this.selectedGroupId();
    if (selectedId && !filteredGroups.find(g => g.groupId === selectedId)) {
      this.selectedGroupId.set(null);
    }
  }

  private applySorting(groups: Group[]): Group[] {
    const { column, direction } = this.sortState();
    if (!column || !direction) return groups;

    return [...groups].sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  onSort(column: SortColumn): void {
    if (!column) return;

    const currentSort = this.sortState();
    let newDirection: SortDirection;

    if (currentSort.column === column) {
      if (currentSort.direction === 'asc') {
        newDirection = 'desc';
      } else if (currentSort.direction === 'desc') {
        newDirection = null;
      } else {
        newDirection = 'asc';
      }
    } else {
      newDirection = 'asc';
    }

    this.sortState.set({
      column: newDirection ? column : null,
      direction: newDirection,
    });

    if (newDirection === null) {
      this.groups.set([...this.originalGroups()]);
    } else {
      const sortedGroups = this.applySorting([...this.originalGroups()]);
      this.groups.set(sortedGroups);
    }
  }

  getSortIcon(column: SortColumn): string {
    const currentSort = this.sortState();

    if (currentSort.column !== column) {
      return 'unfold_more';
    }

    return currentSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  getSortAriaLabel(column: SortColumn): string {
    const currentSort = this.sortState();

    if (currentSort.column === column) {
      return currentSort.direction === 'asc'
        ? 'Sort descending'
        : 'Sort ascending';
    }

    return 'Sort ascending';
  }

  onRowClick(group: Group, index: number): void {
    if (this.selectedGroupId() === group.groupId) {
      return;
    }

    if (this.checkBeforeSelect) {
      this.requestSelectionChange.emit({
        group,
        index,
        callback: (allowed: boolean) => {
          if (allowed) {
            this.selectedGroupId.set(group.groupId);
            this.groupSelected.emit({ group, index });
          }
        }
      });
    } else {
      this.selectedGroupId.set(group.groupId);
      this.groupSelected.emit({ group, index });
    }
  }

  isRowSelected(group: Group): boolean {
    return this.selectedGroupId() === group.groupId;
  }

  isRowEditing(index: number): boolean {
    return this.editingRowIndex() === index;
  }
}
