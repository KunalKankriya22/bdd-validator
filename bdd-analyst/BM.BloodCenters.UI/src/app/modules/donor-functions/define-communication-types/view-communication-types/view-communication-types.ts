import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { Subject, takeUntil } from 'rxjs';
import { FilterCommunicationTypesComponent } from '../filter-communication-types/filter-communication-types';
import {
  CommunicationTypesService,
  CommunicationRecord,
  CommTypeFilter,
  CreateCommRecordRequest,
} from '../services/communication-types.service';
import { AddUpdateCommunicationType } from '../add-update-communication-type/add-update-communication-type';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { ROUTES } from '../../../../core/constants/route.constants';
import { HeaderService } from '@shared/services/header.service';
import { CommTypesFilterChipsUtils } from '../utils/filter-chips.utils';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { convertUTCToTimezone, getDateInTimezone } from '@shared/date/timezone.util';

@Component({
  selector: 'app-view-communication-types',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FilterCommunicationTypesComponent,
    PageHeaderWithBreadcrumb,
    FilterChips,
    SearchBar,
  ],
  templateUrl: './view-communication-types.html',
  styleUrl: './view-communication-types.scss',
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      },
    },
  ],
})
export class ViewCommunicationTypesComponent implements OnInit, OnDestroy {
  private pageHeaderService = inject(PageHeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME },
      { label: 'Define Communication Types', link: null },
    ],
    subtitle: '',
    actions: [
      {
        label: 'ADD NEW CODE TYPE',
        icon: 'add',
        onClick: () => this.onAddNew(),
      },
    ],
  };

  filterChips: FilterChip[] = [];
  descriptionTooltipDisabled = new Map<string, boolean>();

  displayedColumns: string[] = [
    'codeType',
    'description',
    'days',
    'effectiveDate',
    'terminationDate',
    'action',
    'navigate',
  ];

  commTypes: CommunicationRecord[] = [];
  filteredTypes: CommunicationRecord[] = [];
  selectedRow: CommunicationRecord | null = null;

  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  sortColumn = '';
  sortDirection: 'ASC' | 'DESC' | '' = '';

  searchTerm = '';
  isLoading = false;
  isFilterPanelOpen = false;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code type or description',
    minLength: 3,
    ariaLabel: 'Search by code type or description',
    searchOnEnterOnly: true,
  };

  currentFilters: CommTypeFilter = {};
  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private commTypesService: CommunicationTypesService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: ROUTES.HOME },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearFilters();
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;

    const skip = this.pageIndex * this.pageSize;
    const take = this.pageSize;

    const filterPayload: any = {
      searchKeyword: this.searchTerm || '',
      effectiveDate: this.currentFilters.effectiveDate
        ? this.formatDateForApi(this.currentFilters.effectiveDate)
        : undefined,
      terminationDate: this.currentFilters.terminationDate
        ? this.formatDateForApi(this.currentFilters.terminationDate)
        : undefined,
      effectiveDatePeriod: this.currentFilters.effectiveDatePeriod || undefined,
      terminationDatePeriod: this.currentFilters.terminationDatePeriod || undefined,
      sortColumn: this.sortColumn || undefined,
      sortOrder: this.sortDirection || undefined,
    };

    this.commTypesService
      .search('COMTP', take, skip, filterPayload)
      .subscribe({
        next: (response) => {
          this.commTypes = response.data;
          this.filteredTypes = response.data;
          this.totalRecords = response.totalCount;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  onSearch(searchKeyword: string): void {
    this.searchTerm = searchKeyword;
    this.pageIndex = 0;
    this.loadData();
  }

  onSort(): void {
    if (!this.sortDirection) {
      this.sortDirection = 'ASC';
      this.sortColumn = 'code';
    } else if (this.sortDirection === 'ASC') {
      this.sortDirection = 'DESC';
    } else {
      this.sortDirection = '';
      this.sortColumn = '';
    }

    this.pageIndex = 0;
    this.loadData();
  }

  getSortIcon(): string {
    if (!this.sortDirection) return 'unfold_more';
    return this.sortDirection === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadData();
  }

  onAddNew(): void {
    const dialogRef = this.dialog.open(AddUpdateCommunicationType, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      data: { mode: 'add' },
    });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        const payload: CreateCommRecordRequest = {
          commType: 'COMTP',
          commCode: result.commCode,
          description: result.description,
          targetDays: result.targetDays,
          effDate:
            result.effDate ||
            DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()).format('YYYY-MM-DD'),
          termDate: result.termDate || null,
        };

        this.commTypesService.create(payload).subscribe({
          next: (response) => {
            if (result.addAnother) {
              dialogRef.componentInstance.resetFormForAddAnother();
            } else {
              dialogRef.close();
            }
            this.snackbarService.showSuccess(response.message);
            this.loadData();
          },
          error: (error) => {
            dialogRef.componentInstance.isSaving = false;
            const body = error?.error;
            const errorCode = body?.errorCode || body?.errorResponse?.errorCode || '';
            const errorText = body?.error || body?.errorResponse?.error || body?.message || error.message;
            const errorMessage = errorCode ? `Error ${errorCode}: ${errorText}` : errorText;
            this.snackbarService.showError(errorMessage);
          },
        });
      });
  }

  isRowHighlighted(row: CommunicationRecord): boolean {
    return this.selectedRow?.commCode === row.commCode;
  }

  onEdit(row: CommunicationRecord): void {
    this.selectedRow = row;
    const dialogRef = this.dialog.open(AddUpdateCommunicationType, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      data: {
        mode: 'edit',
        commCode: row.commCode,
        description: row.description,
        targetDays: row.targetDays,
        effDate: row.effDate,
        termDate: row.termDate,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedRow = null;
        (document.activeElement as HTMLElement)?.blur();
      });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        const updateData = {
          description: result.description,
          targetDays: result.targetDays,
          effDate: result.effDate,
          termDate: result.termDate || null,
        };

        this.commTypesService.update('COMTP', row.commCode, updateData).subscribe({
          next: (response) => {
            dialogRef.close();
            this.snackbarService.showSuccess(response.message);
            this.loadData();
          },
          error: (error) => {
            dialogRef.componentInstance.isSaving = false;
            const body = error?.error;
            const errorCode = body?.errorCode || body?.errorResponse?.errorCode || '';
            const errorText = body?.error || body?.errorResponse?.error || body?.message || error.message;
            const errorMessage = errorCode ? `Error ${errorCode}: ${errorText}` : errorText;
            this.snackbarService.showError(errorMessage);
          },
        });
      });
  }

  onNavigate(row: CommunicationRecord): void {
    this.router.navigate(
      ['/donor-functions/donor-communication/communication-type-codes', row.commCode],
      {
        state: {
          codeTypeDescription: row.description,
          codeTypeStatus: this.getStatusClass(row.termDate),
          codeType: row.commCode,
        },
      }
    );
  }

  private formatDateForApi(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const chapterTz = this.headerService.chapterTimeZone();
    const noonUtc = date.replace(/T.*$/, 'T12:00:00Z');
    const d = convertUTCToTimezone(noonUtc, chapterTz);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getStatusClass(termDate: string | null | undefined): string {
    if (!termDate) return 'active';
    const chapterTz = this.headerService.chapterTimeZone();
    const termDateInTz = convertUTCToTimezone(termDate, chapterTz);
    termDateInTz.setHours(0, 0, 0, 0);
    const chapterToday = getDateInTimezone(chapterTz);
    const todayDate = new Date(chapterToday.year, chapterToday.month, chapterToday.day);
    return termDateInTz < todayDate ? 'inactive' : 'active';
  }

  onDescriptionHover(event: MouseEvent, key: string): void {
    const el = event.currentTarget as HTMLElement;
    if (el.scrollWidth <= el.clientWidth) {
      this.descriptionTooltipDisabled.set(key, true);
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.currentFilters = {};
    this.filterChips = [];
    this.pageIndex = 0;
    this.sortDirection = '';
    this.sortColumn = '';
  }

  removeFilterChip(chipKey: string): void {
    const updatedFilters = CommTypesFilterChipsUtils.removeFilterByChipKey(this.currentFilters, chipKey);

    if (updatedFilters) {
      this.currentFilters = updatedFilters;
      this.filterChips = CommTypesFilterChipsUtils.convertFiltersToChips(updatedFilters);
      this.pageIndex = 0;
      this.loadData();
    } else {
      this.clearAllFiltersChips();
    }
  }

  clearAllFiltersChips(): void {
    this.currentFilters = {};
    this.filterChips = [];
    this.pageIndex = 0;
    this.loadData();
  }

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    const dialogWidth = 400;
    const spacing = 8;
    const left = Math.min(rect.left, window.innerWidth - dialogWidth - spacing);

    this.isFilterPanelOpen = true;

    const dialogRef = this.dialog.open(FilterCommunicationTypesComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'error-filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      data: this.currentFilters,
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`,
      },
    });

    dialogRef.afterClosed().subscribe((filters: CommTypeFilter) => {
      this.isFilterPanelOpen = false;
      button.blur();
      if (filters) {
        this.currentFilters = filters;
        this.filterChips = CommTypesFilterChipsUtils.convertFiltersToChips(filters);
        this.pageIndex = 0;
        this.loadData();
      }
    });
  }
}
