import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { WarehouseFilterComponent, WarehouseFilters } from '../warehouse-filter/warehouse-filter';
import { UserDropdownOption, WarehouseFilterRequest, WarehouseService, WarehouseUserResponse } from '../services/warehouse.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Overlay, OverlayRef, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AssignUserWarehouseChapterComponent } from '../assign-user-warehouse-chapter/assign-user-warehouse-chapter';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';

export interface WarehouseRow {
  warehouse: string;
  warehouseDescription: string;
  chapterId: string;
  chapterName: string;
  defaultPrinter: string;
  printerDescription: string;
  effectiveDate: string;
  terminationDate: string;
  modifiedDate: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-view-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatDialogModule, MatSelectModule, NgxMatSelectSearchModule, MatInputModule, MatFormFieldModule, RouterModule, PageHeaderWithBreadcrumb, FilterChips, MatMomentDateModule, SearchBar],
  templateUrl: './view-warehouse.html',
  styleUrl: './view-warehouse.scss',
  providers: [{ provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }]
})
export class ViewWarehouseComponent implements OnInit, OnDestroy{
  @ViewChild('warehousePanel', { read: ElementRef }) warehousePanel!: ElementRef<HTMLElement>;
  @ViewChild('filterBtn', { read: ElementRef }) filterBtn!: ElementRef<HTMLElement>;
  @ViewChild(SearchBar) searchBar!: SearchBar;

  // Page header configuration
  readonly headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'User Warehouse', link: null }
    ]
  };

  constructor(
    private dialog: MatDialog,
    private warehouseService: WarehouseService,
    private router: Router,
    private route: ActivatedRoute,
    private overlay: Overlay,
    private headerService: HeaderService
  ) {}
  /*SEARCH BY USER*/
  userIdControl = new FormControl('');
  userSearchControl = new FormControl('');
  userOptions: UserDropdownOption[] = [];
  filteredUserOptions: UserDropdownOption[] = [];
  userId = '';
  retrievedUserId = '';
  hasSearched = false;
  userFullName = '';
  userGroup = '';
  displayUserId = '';  // Uppercase userId for display, set only after successful search

  /*DATA STATE*/
  isLoading = false;
  hasError = false;

  assignments: WarehouseRow[] = [];
  filteredAssignments: WarehouseRow[] = [];
  pagedAssignments: WarehouseRow[] = [];

  /* SEARCH (TABLE)*/
  tableSearch = '';
  searchQuery = '';
  tableSearchConfig: SearchBarConfig = {
    placeholder: 'Search by Chapter',
    minLength: 2,
    ariaLabel: 'Search by Chapter',
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  /*TABLE STATE*/
  sortDirection: 'asc' | 'desc' | null = null;
  private destroy$ = new Subject<void>();
  appliedFilters: WarehouseFilters = {};
  private overlayRef: OverlayRef | null = null;
  isFilterOpen = false;
  editingRowIndex: number | null = null;

  allWarehouses: { value: string; display: string }[] = [];
  allChapters: { value: string; display: string }[] = [];
  filterChips: FilterChip[] = [];

  ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  if (this.overlayRef) {
    this.overlayRef.dispose();
  }
}

 ngOnInit(): void {
    this.loadUsersDropdown();
    this.setupUserSearch();

    // Sync userId with userIdControl
    this.userIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.userId = value || '';
      });

    // Check for userId in query parameters
    this.route.queryParams.subscribe(params => {
      if (params['userId']) {
        this.userId = params['userId'];
        this.userIdControl.setValue(params['userId'], { emitEvent: false });
        this.onRetrieve();
      }
    });

    // Subscribe to chapter changes from header
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Clear current user search and reset to initial state
        this.userId = '';
        this.retrievedUserId = '';
        this.userIdControl.setValue(null, { emitEvent: false });
        this.userSearchControl.setValue('');
        this.displayUserId = '';
        this.hasSearched = false;
        this.userFullName = '';
        this.userGroup = '';
        this.assignments = [];
        this.filteredAssignments = [];
        this.pagedAssignments = [];
        this.appliedFilters = {};
        this.filterChips = [];
        this.tableSearch = '';
        this.pageIndex = 0;

        // Reload users dropdown for new chapter
        this.loadUsersDropdown();
      });
  }

  private loadUsersDropdown(): void {
    this.warehouseService.getUsersDropdown()
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
      .subscribe(value => {
        this.filterUsers(value || '');
      });
  }

  private filterUsers(search: string): void {
    if (!search) {
      this.filteredUserOptions = this.userOptions;
      return;
    }
    const lowerSearch = search.toLowerCase();
    this.filteredUserOptions = this.userOptions.filter(user =>
      user.userId.toLowerCase().includes(lowerSearch) ||
      user.userName?.toLowerCase().includes(lowerSearch)
    );
  }

  /*RETRIEVE USER*/
onRetrieve(): void {
  if (!this.userId || !this.userId.trim()) {
    return;
  }

  this.retrievedUserId = this.userId;
  this.hasSearched = true;
  this.isLoading = true;
  this.hasError = false;

  // Set user display info from dropdown selection so ASSIGN button is always visible
  // even when the user has no existing warehouse assignments
  this.displayUserId = this.userId.toUpperCase();
  const selectedUser = this.userOptions.find(u => u.userId === this.userId);
  this.userFullName = selectedUser?.userName || this.userId.toUpperCase();
  this.userGroup = '';

  // Clear filters, chips, and table search when searching for a new user
  this.appliedFilters = {};
  this.filterChips = [];
  this.tableSearch = '';
  this.searchBar?.clearSearch();

  this.loadWarehouses();
}

  /*NAVIGATION*/
  goHome(): void {
    this.router.navigate(['/home']);
  }

  /*TABLE SEARCH*/
  onTableSearch(query: string): void {
    this.tableSearch = query;
    this.applyTableSearch();
  }

 applyTableSearch(): void {
  this.pageIndex = 0;
  this.applyAllFilters();
}

  clearUserSearch(): void {
  this.userId = '';
  this.userIdControl.setValue(null, { emitEvent: false });
  this.userSearchControl.setValue('');
  this.displayUserId = '';
  this.hasSearched = false;
}

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.filteredAssignments = [...this.assignments];
    } else {
      this.filteredAssignments = this.assignments.filter(row =>
        row.warehouse.toLowerCase().includes(query) ||
        row.chapterName.toLowerCase().includes(query)
      );
    }

    this.pageIndex = 0;
    this.applyPagination();
  }

  /*SORT*/
  toggleSort(): void {
    if (this.sortDirection === null) {
      this.sortDirection = 'asc';
    } else if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = null;
    }

    if (this.sortDirection === null) {
      // Reset to original order from assignments array
      this.applyAllFilters();
    } else {
      this.filteredAssignments.sort((a, b) =>
        this.sortDirection === 'asc'
          ? a.warehouse.localeCompare(b.warehouse)
          : b.warehouse.localeCompare(a.warehouse)
      );
      this.applyPagination();
    }
  }

  /*PAGINATION*/
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  get startRow(): number {
  return this.filteredAssignments.length === 0
    ? 0
    : this.pageIndex * this.pageSize + 1;
}

get endRow(): number {
  return Math.min(
    (this.pageIndex + 1) * this.pageSize,
    this.filteredAssignments.length
  );
}

applyPagination(): void {
  const start = this.pageIndex * this.pageSize;
  const end = start + this.pageSize;
  this.pagedAssignments = this.filteredAssignments.slice(start, end);
}

nextPage(): void {
  if ((this.pageIndex + 1) * this.pageSize < this.filteredAssignments.length) {
    this.pageIndex++;
    this.applyPagination();
  }
}

prevPage(): void {
  if (this.pageIndex > 0) {
    this.pageIndex--;
    this.applyPagination();
  }
}

goToFirst(): void {
  this.pageIndex = 0;
  this.applyPagination();
}

goToLast(): void {
  this.pageIndex = Math.floor(
    (this.filteredAssignments.length - 1) / this.pageSize
  );
  this.applyPagination();
}

onPageSizeChange(): void {
  this.pageIndex = 0;
  this.applyPagination();
}

  /*STATUS*/
  isActive(row: WarehouseRow): boolean {
  return row.status === 'Active';
}

  getAbsoluteRowIndex(pagedIndex: number): number {
    return this.pageIndex * this.pageSize + pagedIndex;
  }

  isRowEditing(pagedIndex: number): boolean {
    return this.editingRowIndex === this.getAbsoluteRowIndex(pagedIndex);
  }

openFilter(): void {
  if (this.overlayRef) {
    this.overlayRef.dispose();
    this.overlayRef = null;
    this.isFilterOpen = false;
    return;
  }

  this.isFilterOpen = true;

  const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
    .position()
    .flexibleConnectedTo(this.filterBtn)
    .withPositions([
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetX: 0,
        offsetY: 4
      }
    ])
    .withPush(true)
    .withViewportMargin(16)
    .withFlexibleDimensions(false)
    .withGrowAfterOpen(false);

  this.overlayRef = this.overlay.create({
    positionStrategy,
    hasBackdrop: true,
    backdropClass: 'cdk-overlay-transparent-backdrop',
    scrollStrategy: this.overlay.scrollStrategies.block(),
    width: '320px',
    minWidth: '320px',
    maxWidth: '320px'
  });

  const portal = new ComponentPortal(WarehouseFilterComponent);
  const componentRef = this.overlayRef.attach(portal);

  componentRef.instance.currentFilters = this.appliedFilters;
  componentRef.instance.warehouses = this.allWarehouses;
  componentRef.instance.chapters = this.allChapters;

  componentRef.instance.apply
    .pipe(takeUntil(this.destroy$))
    .subscribe((filters: WarehouseFilters) => {
      this.appliedFilters = filters;
      this.updateFilterChips();
      this.pageIndex = 0;
      this.applyFrontendFilters();
      this.closeFilter();
    });

  componentRef.instance.close
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.closeFilter();
    });

  this.overlayRef.backdropClick()
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.closeFilter();
    });
}

closeFilter(): void {
  if (this.overlayRef) {
    this.overlayRef.dispose();
    this.overlayRef = null;
  }
  this.isFilterOpen = false;
}

/**
 * Apply both frontend filters (warehouse, chapter, dates) AND table search
 * Filters are applied first, then search is applied to the filtered results
 */
private applyAllFilters(): void {
  let result = [...this.assignments];

  // Step 1: Apply frontend filters (warehouse, chapter, dates)
  result = result.filter(row => {
    // Filter by warehouse
    if (this.appliedFilters.warehouse && row.warehouse !== this.appliedFilters.warehouse) {
      return false;
    }

    // Filter by chapter
    if (this.appliedFilters.chapter && row.chapterId !== this.appliedFilters.chapter) {
      return false;
    }

    // Filter by effective date
    if (this.appliedFilters.effectiveDate) {
      const rowDate = new Date(row.effectiveDate);
      const filterDate = new Date(this.appliedFilters.effectiveDate);
      if (!isNaN(rowDate.getTime())) {
        // Normalize both dates to start of day for accurate comparison
        rowDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        if (this.appliedFilters.effectiveDatePeriod === 'AFTER') {
          if (rowDate < filterDate) return false;
        } else if (this.appliedFilters.effectiveDatePeriod === 'BEFORE') {
          if (rowDate > filterDate) return false;
        }
      }
    }

    // Filter by termination date
    if (this.appliedFilters.terminationDate) {
      // Skip rows with invalid/missing termination dates (e.g., '-')
      if (!row.terminationDate || row.terminationDate === '-') {
        return false;
      }
      const rowDate = new Date(row.terminationDate);
      const filterDate = new Date(this.appliedFilters.terminationDate);
      if (!isNaN(rowDate.getTime())) {
        // Normalize both dates to start of day for accurate comparison
        rowDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        if (this.appliedFilters.terminationDatePeriod === 'AFTER') {
          if (rowDate < filterDate) return false;
        } else if (this.appliedFilters.terminationDatePeriod === 'BEFORE') {
          if (rowDate > filterDate) return false;
        }
      } else {
        // Exclude rows with invalid dates when filtering by termination date
        return false;
      }
    }

    return true;
  });

  // Step 2: Apply table search on the filtered results
  const query = this.tableSearch?.toLowerCase().trim() ?? '';
  if (query) {
    result = result.filter(row => {
      const chapterId = (row.chapterId ?? '').toLowerCase();
      const chapterName = (row.chapterName ?? '').toLowerCase();
      const chapterCombined = `${chapterId} - ${chapterName}`;
      const printerId = (row.defaultPrinter ?? '').toLowerCase();
      const printerDescription = (row.printerDescription ?? '').toLowerCase();
      const printerCombined = printerDescription ? `${printerId} - ${printerDescription}` : printerId;

      return (
        chapterCombined.includes(query) ||
        printerCombined.includes(query)
      );
    });
  }

  this.filteredAssignments = result;
  this.applyPagination();
}

applyFrontendFilters(): void {
  this.applyAllFilters();
}

private updateFilterChips(): void {
  const chips: FilterChip[] = [];

  if (this.appliedFilters.warehouse) {
    const warehouseDisplay = this.allWarehouses.find(w => w.value === this.appliedFilters.warehouse)?.display || this.appliedFilters.warehouse;
    chips.push({
      key: 'warehouse',
      value: this.appliedFilters.warehouse,
      label: `Warehouse: ${warehouseDisplay}`
    });
  }

  if (this.appliedFilters.chapter) {
    const chapterDisplay = this.allChapters.find(c => c.value === this.appliedFilters.chapter)?.display || this.appliedFilters.chapter;
    chips.push({
      key: 'chapter',
      value: this.appliedFilters.chapter,
      label: `Chapter: ${chapterDisplay}`
    });
  }

  if (this.appliedFilters.effectiveDate && this.appliedFilters.effectiveDatePeriod) {
    const symbol = this.appliedFilters.effectiveDatePeriod === 'AFTER' ? '≥' : '≤';
    chips.push({
      key: 'effectiveDate',
      value: this.appliedFilters.effectiveDate,
      label: `Effective Date ${symbol} ${this.formatDate(this.appliedFilters.effectiveDate)}`
    });
  }

  if (this.appliedFilters.terminationDate && this.appliedFilters.terminationDatePeriod) {
    const symbol = this.appliedFilters.terminationDatePeriod === 'AFTER' ? '≥' : '≤';
    chips.push({
      key: 'terminationDate',
      value: this.appliedFilters.terminationDate,
      label: `Termination Date ${symbol} ${this.formatDate(this.appliedFilters.terminationDate)}`
    });
  }

  this.filterChips = chips;
}

removeChip(chipKey: string): void {
  // Create a new object to ensure change detection
  this.appliedFilters = { ...this.appliedFilters };

  if (chipKey === 'warehouse') {
    delete this.appliedFilters.warehouse;
  }

  if (chipKey === 'chapter') {
    delete this.appliedFilters.chapter;
  }

  if (chipKey === 'effectiveDate') {
    delete this.appliedFilters.effectiveDate;
    delete this.appliedFilters.effectiveDatePeriod;
  }

  if (chipKey === 'terminationDate') {
    delete this.appliedFilters.terminationDate;
    delete this.appliedFilters.terminationDatePeriod;
  }

  this.updateFilterChips();
  this.pageIndex = 0;
  this.applyFrontendFilters();
}


clearFilters(): void {
  this.appliedFilters = {};
  this.filterChips = [];
  this.pageIndex = 0;
  this.applyFrontendFilters();
}

getEmptyMessage(): string {
  const hasActiveSearch = !!this.tableSearch?.trim();
  const hasActiveFilters = !!(
    this.appliedFilters.warehouse ||
    this.appliedFilters.chapter ||
    this.appliedFilters.effectiveDate ||
    this.appliedFilters.terminationDate
  );

  if (hasActiveSearch || hasActiveFilters) {
    return 'No warehouse assignments available to display.';
  }

  return 'No warehouse assignments available to display.';
}

formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

loadWarehouses(): void {
  const userId = this.userId.trim();

  if (!userId) {
    return;
  }

  this.warehouseService
    .getWarehouses(userId.toUpperCase())
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: response => {
        this.isLoading = false;
        this.handleWarehouseResponse(response);
      },
      error: err => {
        this.isLoading = false;
        this.hasError = true;
        console.error('API ERROR:', err);
      }
    });
}

private handleWarehouseResponse(
  response: WarehouseUserResponse[]
): void {

  if (!response || response.length === 0) {
    // No warehouse assignments — keep userFullName/displayUserId set in onRetrieve()
    // so the ASSIGN WAREHOUSE button remains visible for users with no assignments
    this.assignments = [];
    this.filteredAssignments = [];
    this.pagedAssignments = [];
    this.appliedFilters = {};
    this.filterChips = [];
    this.tableSearch = '';
    this.pageIndex = 0;
    return;
  }

  // USER INFO - Update with full details from warehouse response
  const first = response[0];
  this.displayUserId = this.userId.toUpperCase();
  this.userFullName = `${first.UserFirstName} ${first.UserLastName}`;
  this.userGroup = first.Department || 'N/A';

  // TABLE DATA
  this.assignments = response.map(item =>
    this.mapToWarehouseRow(item)
  );

  // FILTER DROPDOWN DATA
  const warehouseMap = new Map<string, string>();
  const chapterMap = new Map<string, string>();
  response.forEach(r => {
    if (r.WarehouseId) {
      warehouseMap.set(r.WarehouseId, r.WarehouseDescription || '');
    }
    if (r.ChapterId) {
      chapterMap.set(r.ChapterId, r.ChapterName || '');
    }
  });

  this.allWarehouses = Array.from(warehouseMap.entries()).map(([id, desc]) => ({
    value: id,
    display: desc ? `${id} - ${desc}` : id
  }));

  this.allChapters = Array.from(chapterMap.entries()).map(([id, name]) => ({
    value: id,
    display: name ? `${id} - ${name}` : id
  }));

  // Reapply filters and search after loading new data
  this.pageIndex = 0;
  this.applyAllFilters();
}


private mapToWarehouseRow(item: WarehouseUserResponse): WarehouseRow {
  return {
    warehouse: item.WarehouseId || '-',
    warehouseDescription: item.WarehouseDescription || '',
    chapterId: item.ChapterId || '-',
    chapterName: item.ChapterDescription || item.ChapterName || '-',
    defaultPrinter: item.PrinterId || '-',
    printerDescription: item.PrinterDescription || '',
    effectiveDate: item.EffDate || '-',
    terminationDate: item.TermDate || '-',
    modifiedDate: item.LastModifiedDate || '-',
    status: item.Status === 'ACTIVE' ? 'Active' : 'Inactive'
  };
}

openAssignWarehouseDialog(): void {
  if (!this.userId || !this.userId.trim()) {
    console.warn('User ID is required to assign warehouse');
    return;
  }

  this.dialog.open(AssignUserWarehouseChapterComponent, {
    panelClass: 'assign-user-warehouse-right-dialog',
    width: '960px',
    maxWidth: '100vw',
    height: '100vh',
    position: {
      right: '0'
    },
    autoFocus: false,
    disableClose: true,
    data: {
      mode: 'add',
      user: {
        userId: this.displayUserId,  // Use uppercase displayUserId
        userName: this.userFullName,
        department: this.userGroup
      }
    }
  }).afterClosed().subscribe(result => {
    if (result) {
      this.loadWarehouses();
    }
  });
}

openEditWarehouseDialog(row: WarehouseRow, index: number): void {
  this.editingRowIndex = index;
  this.dialog.open(AssignUserWarehouseChapterComponent, {
    panelClass: 'assign-user-warehouse-right-dialog',
    width: '960px',
    maxWidth: '100vw',
    height: '100vh',
    position: { right: '0' },
    autoFocus: false,
    disableClose: true,
    data: {
      mode: 'edit',
      index,
      assignment: {
        warehouseId: row.warehouse,
        warehouseName: row.warehouseDescription || row.warehouse,
        chapterId: row.chapterId,
        chapterName: row.chapterName,
        printerId: row.defaultPrinter !== '-' ? row.defaultPrinter : null,
        printer: row.printerDescription || (row.defaultPrinter !== '-' ? row.defaultPrinter : null),
        effectiveDate: row.effectiveDate,
        terminationDate:
          row.terminationDate !== '-' ? row.terminationDate : null
      },
      user: {
        userId: this.displayUserId,  // Use uppercase displayUserId
        userName: this.userFullName,
        department: this.userGroup
      }
    }
  }).afterClosed().subscribe(result => {
    this.editingRowIndex = null;
    if (result) {
      this.loadWarehouses();
    }
  });
}

close(): void {
  this.router.navigate(['../'], {
    relativeTo: this.route
  });
}
}  

