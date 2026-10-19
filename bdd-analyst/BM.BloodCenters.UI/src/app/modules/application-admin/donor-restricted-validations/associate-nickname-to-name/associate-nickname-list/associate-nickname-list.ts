import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { Subject, takeUntil } from 'rxjs';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AssociateNicknameToNameApiService } from '../services/associate-nickname-to-name-api.service';
import {
  AssociateNicknameToName,
  AssociateNicknameFilter,
  AssociateNicknameFormData,
} from '../models/associate-nickname-to-name.model';
import { AddUpdateAssociateNicknameComponent } from '../add-update-associate-nickname/add-update-associate-nickname';
import { FilterAssociateNicknameComponent } from '../filter-associate-nickname/filter-associate-nickname';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { formatTableDate } from 'src/app/modules/system-administration/application-sequence-numbers/utils/table-display.util';

@Component({
  selector: 'app-associate-nickname-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    AddUpdateAssociateNicknameComponent,
    FilterChips,
    SearchBar,
  ],
  templateUrl: './associate-nickname-list.html',
  styleUrls: ['./associate-nickname-list.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    }
  ]
})
export class AssociateNicknameListComponent implements OnInit, AfterViewInit, OnDestroy {
  private service = inject(AssociateNicknameToNameApiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private pageHeaderService = inject(PageHeaderService);
  private headerService = inject(HeaderService);
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'ADD NEW NICKNAME',
        icon: 'add',
        color: 'accent',
        ariaLabel: 'Add new nickname association',
        onClick: () => this.openAddDialog(),
      },
    ],
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Nick Name or First Name',
    minLength: 1,
    ariaLabel: 'Search by Nick Name or First Name',
    searchOnEnterOnly: true
  };

  dataSource = new MatTableDataSource<AssociateNicknameToName>([]);

  displayedColumns: string[] = [
    'nickName',
    'firstName',
    'effDate',
    'termDate',
    'actions',
  ];

  isLoading = false;
  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  sortColumn = 'nickName';
  sortDirection: 'A' | 'D' | 'default' = 'default';

  searchTerm = '';
  currentFilters: AssociateNicknameFilter = {};
  activeFilterChips: FilterChip[] = [];
  isFilterPanelOpen = false;

  // Side panel state
  isSidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: AssociateNicknameToName | null = null;

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

  ngOnInit(): void {
    this.loadAssociateNicknames();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    // Sorting is handled server-side via API, not client-side
    // No need to connect MatSort to dataSource
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

loadAssociateNicknames(): void {
    this.isLoading = true;

    const skip = this.pageIndex * this.pageSize;
    const take = this.pageSize;

    // Build filter - only include non-empty values
    const filter: AssociateNicknameFilter = {
      includeTerminated: false,
      sort: this.sortDirection === 'default' ? 'A' : this.sortDirection,
    };

    if (this.currentFilters.searchItem) {
      filter.searchItem = this.currentFilters.searchItem;
    }
    if (this.currentFilters.effectiveDate) {
      filter.effectiveDate = this.currentFilters.effectiveDate;
    }
    if (this.currentFilters.effectivePeriod) {
      filter.effectivePeriod = this.currentFilters.effectivePeriod;
    }
    if (this.currentFilters.terminationDate) {
      filter.terminationDate = this.currentFilters.terminationDate;
    }
    if (this.currentFilters.terminationPeriod) {
      filter.terminationPeriod = this.currentFilters.terminationPeriod;
    }

    this.service.getAssociateNicknames(take, skip, filter).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalRecords = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading associate nicknames:', error);
        this.isLoading = false;
        this.showError('Failed to load nickname associations. Please try again.');
      },
    });
  }

  onSearch(searchText: string): void {
    this.searchTerm = searchText.trim();

    // Add search term to filters
    if (this.searchTerm) {
      this.currentFilters.searchItem = this.searchTerm;
    } else {
      delete this.currentFilters.searchItem;
    }

    this.pageIndex = 0;
    this.loadAssociateNicknames();
  }

  onSortClick(): void {
    this.sortDirection = this.sortDirection === 'default' || this.sortDirection === 'D' ? 'A' : 'D';
    this.pageIndex = 0;
    this.loadAssociateNicknames();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadAssociateNicknames();
  }

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const dialogWidth = 360;
    const spacing = 8;
    const left = Math.min(rect.left, window.innerWidth - dialogWidth - spacing);

    this.isFilterPanelOpen = true;

    const dialogRef = this.dialog.open(FilterAssociateNicknameComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      data: this.currentFilters,
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`,
      },
      autoFocus: false, // Prevent auto-focus on first element
      restoreFocus: false, // Prevent focus restoration to button
    });

    // Reset state immediately when dialog starts closing
    dialogRef.beforeClosed().subscribe(() => {
      this.isFilterPanelOpen = false;
    });

    dialogRef.afterClosed().subscribe((filters: AssociateNicknameFilter | null) => {
      // null means user closed without applying — do nothing
      // {} or populated object means user clicked Apply (including Clear All + Apply)
      if (filters !== null && filters !== undefined) {
        const searchItem = this.currentFilters.searchItem;
        this.currentFilters = filters;
        if (searchItem) {
          this.currentFilters.searchItem = searchItem;
        }
        this.buildFilterChips();
        this.pageIndex = 0;
        this.loadAssociateNicknames();
      }
    });
  }

  buildFilterChips(): void {
    const chips: FilterChip[] = [];

    if (this.currentFilters.effectiveDate && this.currentFilters.effectivePeriod) {
      const formattedDate = formatTableDate(this.currentFilters.effectiveDate);
      const symbol = this.currentFilters.effectivePeriod === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: this.currentFilters.effectiveDate,
      });
    }

    if (this.currentFilters.terminationDate && this.currentFilters.terminationPeriod) {
      const formattedDate = formatTableDate(this.currentFilters.terminationDate);
      const symbol = this.currentFilters.terminationPeriod === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: this.currentFilters.terminationDate,
      });
    }

    this.activeFilterChips = chips;
  }

  removeFilter(key: string): void {
    switch (key) {
      case 'effectiveDate':
        delete this.currentFilters.effectiveDate;
        delete this.currentFilters.effectivePeriod;
        break;
      case 'terminationDate':
        delete this.currentFilters.terminationDate;
        delete this.currentFilters.terminationPeriod;
        break;
    }

    this.buildFilterChips();
    this.pageIndex = 0;
    this.loadAssociateNicknames();
  }

  clearAllFilters(): void {
    const searchItem = this.currentFilters.searchItem;
    this.currentFilters = { ...(searchItem ? { searchItem } : {}) };
    this.buildFilterChips();
    this.pageIndex = 0;
    this.loadAssociateNicknames();
  }

  openAddDialog(): void {
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.isSidePanelOpen = true;
  }

  openEditDialog(row: AssociateNicknameToName): void {
    // Fetch the latest data before opening side panel using composite key
    this.isLoading = true;
    this.service.getAssociateNicknameByKey(row.nickName, row.firstName).subscribe({
      next: (nicknameData) => {
        this.isLoading = false;
        this.sidePanelMode = 'edit';
        this.sidePanelData = nicknameData;
        this.isSidePanelOpen = true;
      },
      error: (error) => {
        console.error('Error fetching nickname association:', error);
        this.isLoading = false;
        this.showError('Failed to fetch nickname association details. Please try again.');
      },
    });
  }

  formatDate(dateString: string): string {
    return formatTableDate(dateString);
  }

  getStatusClass(row: AssociateNicknameToName): string {
    return row.isActive ? 'status-active' : 'status-inactive';
  }

  getStatusText(row: AssociateNicknameToName): string {
    return row.isActive ? 'Active' : 'Inactive';
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  onPanelClose(): void {
    this.isSidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(result: AssociateNicknameFormData): void {
    this.pageIndex = 0;
    this.loadAssociateNicknames();
  }

  onModeChange(mode: 'add' | 'edit'): void {
    this.sidePanelMode = mode;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

}
