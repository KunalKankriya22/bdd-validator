import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';
import { DefineClassFilterComponent, DefineClassFilter } from '../filter/define-class-filter';
import { CreateEditRecordComponent, CreateEditRecordData } from '../create-edit-record/create-edit-record';
import { ViewAssociatedInterdictionComponent } from '../../view-associated-interdiction/view-associated-interdiction';
import { DefineAccessClassService, DefineAccessClassRow } from '../services/define-access-class.service';
import { HeaderService } from '@shared/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OnInit, OnDestroy } from '@angular/core';
import { AttachedUsersDialogComponent } from '../attached-users-dialog/attached-users-dialog';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DefineAccessClassFilterChipsUtils } from '../utils/filter-chips.utils';

@Component({
  selector: 'app-define-access-class',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    ViewAssociatedInterdictionComponent,
    MatSnackBarModule,
    MatDialogModule,
    OverlayModule,
    A11yModule,
    FilterChips,
    DefineClassFilterComponent,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
  ],
  templateUrl: './define-access-class.html',
  styleUrls: ['./define-access-class.scss'],
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
export class DefineAccessClassComponent implements OnInit, OnDestroy {
  form: FormGroup;

  /** Class dropdown */
  classSearchControl = new FormControl('');
  classOptions: { code: string; description: string }[] = [];
  filteredClassOptions: { code: string; description: string }[] = [];

  /** SEARCH STATE */
  classCode = '';
  hasSearched = false;
  isLoading = false;

  /** HEADER INFO */
  selectedClassCode = '';
  selectedClassDescription = '';

  /** TABLE */
  sortDirection: 'default' | 'asc' | 'desc' = 'default';
  tableSearch = '';

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Type or Description',
    minLength: 2,
    ariaLabel: 'Search by Type or Description',
    searchOnEnterOnly: true
  };

  tableData: DefineAccessClassRow[] = [];

  filteredAssignments: DefineAccessClassRow[] = [];
  pagedAssignments: DefineAccessClassRow[] = [];
  appliedClassFilters: DefineClassFilter | null = null;

  pageSize = 25;
  pageIndex = 0;
  filterChips: FilterChip[] = [];

  private destroy$ = new Subject<void>();

  // Filter overlay state
  isFilterOpen = false;

  // Right panel state
  isPanelOpen = false;
  selectedAccessClassCode = '';
  selectedAccessClassDescription = '';

  // Row highlight state
  selectedRow: DefineAccessClassRow | null = null;

  /** Page header configuration */
  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Access Class', link: null }
    ]
  };

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private defineAccessClassService: DefineAccessClassService,
    private headerService: HeaderService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      classCode: [''],
    });
  }

  ngOnInit(): void {
    this.loadClassesDropdown();
    this.setupClassSearch();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clear();
        this.clearAllFilters();
        this.tableSearch = '';
        this.sortDirection = 'default';
        this.isPanelOpen = false;
        this.selectedAccessClassCode = '';
        this.selectedAccessClassDescription = '';
        this.pagedAssignments = [];
        this.pageIndex = 0;
        this.loadClassesDropdown();
      });
  }

  private loadClassesDropdown(): void {
    this.defineAccessClassService
      .getAccessClassesDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classes) => {
          this.classOptions = classes;
          this.filteredClassOptions = classes;
        },
        error: () => {
          this.classOptions = [];
          this.filteredClassOptions = [];
        }
      });
  }

  private setupClassSearch(): void {
    this.classSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        const term = (searchTerm || '').toLowerCase();
        this.filteredClassOptions = this.classOptions.filter((cls) =>
          cls.code.toLowerCase().includes(term) ||
          cls.description.toLowerCase().includes(term)
        );
      });
  }

  /* RETRIEVE */
onRetrieve(): void {
  const code = this.form.value.classCode?.trim();
  if (!code || code.length < 2) return;

  this.hasSearched = true;
  this.classCode = code;
  this.isLoading = true;

  this.defineAccessClassService
    .getDefineAccessClass(
      code,
      (this.sortDirection === 'default' ? 'ASC' : this.sortDirection.toUpperCase()) as 'ASC' | 'DESC'
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (rows) => {
        this.isLoading = false;
        this.tableData = rows;
        this.filteredAssignments = [...rows];
        this.pageIndex = 0;
        this.updatePagedAssignments();

        this.selectedClassCode = rows[0]?.class || code;
        this.selectedClassDescription = rows[0]?.classDescription || '';
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load access class data', err);

        this.tableData = [];
        this.filteredAssignments = [];
        this.pagedAssignments = [];

        this.snackBar.open(
          'Failed to load access class data',
          'Close',
          { duration: 4000 }
        );
      }
    });
}


  /*CLEAR*/
  clear(): void {
    this.form.reset();
    this.classCode = '';
    this.hasSearched = false;
    this.selectedClassCode = '';
    this.selectedClassDescription = '';
    this.tableData = [];
    this.filteredAssignments = [];
  }

  /*SORT*/
  toggleSort(): void {
  if (this.sortDirection === 'default') {
    this.sortDirection = 'asc';
  } else if (this.sortDirection === 'asc') {
    this.sortDirection = 'desc';
  } else {
    this.sortDirection = 'default';
  }

  if (this.sortDirection === 'default') {
    this.filteredAssignments = this.tableData.filter(row => this.filteredAssignments.includes(row));
    this.pageIndex = 0;
    this.updatePagedAssignments();
    return;
  }

  const dir = this.sortDirection === 'asc' ? 1 : -1;

  this.filteredAssignments.sort((a, b) => {
    const typeCompare =
      (a.type || '').localeCompare(b.type || '', undefined, { sensitivity: 'base' });
    if (typeCompare !== 0) {
      return typeCompare * dir;
    }

    const codeCompare =
      (a.code || '').localeCompare(b.code || '', undefined, { sensitivity: 'base' });
    if (codeCompare !== 0) {
      return codeCompare * dir;
    }

    return (a.description || '').localeCompare(
      b.description || '',
      undefined,
      { sensitivity: 'base' }
    ) * dir;
  });

  this.pageIndex = 0;
  this.updatePagedAssignments();
}

  /*TABLE SEARCH*/
  onTableSearch(query: string): void {
    this.tableSearch = query;
    this.applyTableSearch();
  }

  clearTableSearch(): void {
    this.tableSearch = '';
    this.applyTableSearch();
  }

  applyTableSearch(): void {
    const query = this.tableSearch.toLowerCase().trim();

    if (!query) {
      this.filteredAssignments = [...this.tableData];
    } else if (query.length < 2) {
      return;
    } else {
      this.filteredAssignments = this.tableData.filter(
        (row) =>
          row.type?.toLowerCase().includes(query) ||
          row.description?.toLowerCase().includes(query),
      );
    }

    this.pageIndex = 0;
    this.updatePagedAssignments();
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilter(): void {
    this.isFilterOpen = false;
  }

  applyFilters(filters: DefineClassFilter): void {
    this.appliedClassFilters = filters;
    this.filterChips = DefineAccessClassFilterChipsUtils.convertFiltersToChips(filters);
    this.closeFilter();
    this.applyDefineClassFilters();
  }

  private applyDefineClassFilters(): void {
    if (!this.appliedClassFilters) {
      this.filteredAssignments = [...this.tableData];
      this.pageIndex = 0;
      this.updatePagedAssignments();
      this.filterChips = [];
      return;
    }

    const { type, code, effectiveDate, effectiveDatePeriod, terminationDate, terminationDatePeriod, status } =
      this.appliedClassFilters;

    this.filteredAssignments = this.tableData.filter((row) => {
      let valid = true;

      // TYPE FILTER
      if (type) {
        valid = row.type?.toLowerCase() === type.toLowerCase();
      }

      // CODE FILTER
      if (valid && code) {
        valid = row.code?.toLowerCase() === code.toLowerCase();
      }

      // EFFECTIVE DATE FILTER
      if (valid && effectiveDate) {
        const rowDate = this.parseDisplayDate(row.effectiveDate);
        const filterDate = new Date(effectiveDate);

        if (rowDate) {
          valid = effectiveDatePeriod === 'AFTER' ? rowDate >= filterDate : rowDate <= filterDate;
        }
      }

      // TERMINATION DATE FILTER
      if (valid && terminationDate) {
        const rowDate = this.parseDisplayDate(row.terminationDate);
        const filterDate = new Date(terminationDate);

        if (rowDate) {
          valid = terminationDatePeriod === 'AFTER' ? rowDate >= filterDate : rowDate <= filterDate;
        }
      }

      // STATUS FILTER
      if (valid && status) {
        const isActive = !row.terminationDate || row.terminationDate === '-';
        valid = status === 'Active' ? isActive : !isActive;
      }

      return valid;
    });

    this.pageIndex = 0;
    this.updatePagedAssignments();
  }

  onRemoveFilterChip(chipKey: string): void {
    this.appliedClassFilters = DefineAccessClassFilterChipsUtils.removeFilterByChipKey(
      this.appliedClassFilters,
      chipKey
    );
    this.filterChips = DefineAccessClassFilterChipsUtils.convertFiltersToChips(this.appliedClassFilters);
    this.applyDefineClassFilters();
  }

  hasActiveFilters(): boolean {
    return DefineAccessClassFilterChipsUtils.hasActiveFilters(this.appliedClassFilters);
  }

  clearAllFilters(): void {
    this.appliedClassFilters = null;
    this.filterChips = [];
    this.applyDefineClassFilters();
  }

  openCreateRecord(): void {
    this.dialog
      .open(CreateEditRecordComponent, {
        width: '745px',
        disableClose: true,
        autoFocus: false,
        position: { right: '0' },
        panelClass: 'create-edit-record-drawer',
        data: {
          mode: 'add',
          classname: this.selectedClassCode,
          existingRows: this.tableData
        } as CreateEditRecordData
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { success?: boolean } | undefined) => {
        if (result?.success) {
          // Refresh the table data
          this.onRetrieve();
        }
      });
  }

  isRowHighlighted(row: DefineAccessClassRow): boolean {
    return this.selectedRow?.type === row.type && this.selectedRow?.code === row.code;
  }

  openEditRecord(row: DefineAccessClassRow): void {
    this.selectedRow = row;
    this.dialog
      .open(CreateEditRecordComponent, {
        width: '745px',
        disableClose: true,
        autoFocus: false,
        position: { right: '0' },
        panelClass: 'create-edit-record-drawer',
        data: {
          mode: 'edit',
          id: this.classCode,
          classname: this.selectedClassCode,
          codeType: row.type,
          codeValue: row.code,
          rowData: row
        } as CreateEditRecordData
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { success?: boolean } | undefined) => {
        this.selectedRow = null;
        if (result?.success) {
          this.onRetrieve();
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePagedAssignments();
  }

  private updatePagedAssignments(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAssignments = this.filteredAssignments.slice(start, end);
  }

  private parseDisplayDate(value?: string | null): Date | null {
    if (!value || value === '-') {
      return null;
    }

    // Handles: 02-NOV-2025
    const parsed = Date.parse(value.replace(/-/g, ' '));
    return isNaN(parsed) ? null : new Date(parsed);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openAssociatedInterdictions(row: DefineAccessClassRow): void {
    this.selectedAccessClassCode = row.class;
    this.selectedAccessClassDescription = row.classDescription;
    this.isPanelOpen = true;
  }

  closeInterdictionPanel(): void {
    this.isPanelOpen = false;
  }

  openAttachedUsers(): void {
    if (!this.selectedClassCode) {
      this.snackBar.open('Please retrieve a class first', 'Close', {
        duration: 3000
      });
      return;
    }

    this.dialog.open(AttachedUsersDialogComponent, {
      width: '754px',
      maxWidth: '754px',
      height: 'calc(100vh - 64px)',
      autoFocus: false,

      position: {
        top: '64px',
        right: '0'
      },

      panelClass: ['attached-users-right-panel'],
      hasBackdrop: true,
      backdropClass: 'right-panel-backdrop',
      disableClose: true,

      data: {
        accessClass: this.selectedClassCode,
        scope: 'ALL - All Interdictions'
      }
    });
  }

}