import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FilterCommunicationTypesComponent } from '../../filter-communication-types/filter-communication-types';
import {
  CommunicationTypesService,
  CommunicationRecord,
  CommTypeFilter,
  CreateCommRecordRequest,
} from '../../services/communication-types.service';
import { AddUpdateCode } from '../add-update-code/add-update-code';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { CommTypesFilterChipsUtils } from '../../utils/filter-chips.utils';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { convertUTCToTimezone } from '@shared/date/timezone.util';
import { ROUTES } from '../../../../../core/constants/route.constants';

@Component({
  selector: 'app-view-communication-type-codes',
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
    FilterChips,
    PageHeaderWithBreadcrumb,
    SearchBar,
  ],
  templateUrl: './view-communication-type-codes.html',
  styleUrl: './view-communication-type-codes.scss',
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
export class ViewCommunicationTypeCodesComponent implements OnInit, OnDestroy {
  filterChips: FilterChip[] = [];
  descriptionTooltipDisabled = new Map<string, boolean>();

  displayedColumns: string[] = [
    'code',
    'description',
    'days',
    'effectiveDate',
    'terminationDate',
    'action',
  ];

  codes: CommunicationRecord[] = [];
  filteredCodes: CommunicationRecord[] = [];
  selectedRow: CommunicationRecord | null = null;

  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  sortColumn = '';
  sortDirection: 'ASC' | 'DESC' | '' = '';

  searchTerm = '';
  isLoading = false;
  isFilterPanelOpen = false;

  currentFilters: CommTypeFilter = {};
  codeTypeParam = '';
  codeTypeDescription = '';
  codeTypeStatus = '';
  Math = Math;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    subtitle: '',
    actions: [],
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code or description',
    minLength: 3,
    ariaLabel: 'Search by code or description',
    searchOnEnterOnly: true,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private commTypesService: CommunicationTypesService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['codeType']) {
        this.codeTypeParam = params['codeType'];
        this.loadCodes();
      }
    });
    this.subscribeToChapterChanges();

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.codeTypeDescription = navigation.extras.state['codeTypeDescription'] || '';
      this.codeTypeStatus = navigation.extras.state['codeTypeStatus'] || '';
    } else if (history?.state) {
      this.codeTypeDescription = history.state.codeTypeDescription || '';
      this.codeTypeStatus = history.state.codeTypeStatus || '';
    }

    this.headerConfig = {
      title: this.codeTypeDescription
        ? `${this.codeTypeParam}-${this.codeTypeDescription}`
        : this.codeTypeParam || 'Code Type',
      subtitle: `${this.codeTypeParam || 'code'} | ${this.capitalizeFirst(this.codeTypeStatus || 'Active')}`,
      breadcrumbs: [
        { label: 'Home', link: ROUTES.HOME },
        {
          label: 'Define Communication Types',
          link: '/donor-functions/donor-communication/define-communication-types',
        },
        {
          label: this.codeTypeParam || 'Code Type',
          link: null,
        },
      ],
      showBackButton: true,
      onBackClick: () => this.onBack(),
      actions: [
        {
          label: 'ADD NEW CODE',
          icon: 'add',
          onClick: () => this.onAddNew(),
        },
      ],
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCodes(): void {
    if (!this.codeTypeParam) return;

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
      .search(this.codeTypeParam, take, skip, filterPayload)
      .subscribe({
        next: (response) => {
          this.codes = response.data;
          this.filteredCodes = response.data;
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
    this.loadCodes();
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
    this.loadCodes();
  }

  getSortIcon(): string {
    if (!this.sortDirection) return 'unfold_more';
    return this.sortDirection === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadCodes();
  }

  onAddNew(): void {
    if (!this.codeTypeParam) return;

    const dialogRef = this.dialog.open(AddUpdateCode, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      autoFocus: false,
      data: {
        mode: 'add',
        codeType: this.codeTypeParam,
        codeTypeDescription: this.codeTypeDescription,
      },
    });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        const payload: CreateCommRecordRequest = {
          commType: this.codeTypeParam,
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
            this.loadCodes();
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

    const dialogRef = this.dialog.open(AddUpdateCode, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      autoFocus: false,
      data: {
        mode: 'edit',
        codeType: this.codeTypeParam,
        codeTypeDescription: this.codeTypeDescription,
        commCode: row.commCode,
        description: row.description,
        targetDays: row.targetDays,
        effDate: row.effDate,
        termDate: row.termDate,
      },
    });

    dialogRef
      .afterClosed()
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

        this.commTypesService.update(this.codeTypeParam, row.commCode, updateData).subscribe({
          next: (response) => {
            dialogRef.close();
            this.snackbarService.showSuccess(response.message);
            this.loadCodes();
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

  onBack(): void {
    this.router.navigate(['/donor-functions/donor-communication/define-communication-types']);
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
    this.loadCodes();
  }

  removeFilterChip(chipKey: string): void {
    const updatedFilters = CommTypesFilterChipsUtils.removeFilterByChipKey(this.currentFilters, chipKey);

    if (updatedFilters) {
      this.currentFilters = updatedFilters;
      this.filterChips = CommTypesFilterChipsUtils.convertFiltersToChips(updatedFilters);
      this.pageIndex = 0;
      this.loadCodes();
    } else {
      this.clearAllFiltersChips();
    }
  }

  clearAllFiltersChips(): void {
    this.currentFilters = {};
    this.filterChips = [];
    this.pageIndex = 0;
    this.loadCodes();
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
        this.loadCodes();
      }
    });
  }

  private capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
