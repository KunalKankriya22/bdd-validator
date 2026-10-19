import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { Subject, takeUntil } from 'rxjs';
import { FilterDonorMasterCodesComponent } from '../filter-donor-master-codes/filter-donor-master-codes';
import {
  DonorMasterCodesService,
  MasterCode,
  MasterCodeFilter,
  CreateCodeTypeRequest,
} from '../services/donor-master-codes.service';
import { AddUpdateDonorMasterCodes } from '../add-update-donor-master-codes/add-update-donor-master-codes';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { ROUTES } from '../../../../core/constants/route.constants';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { DonorMasterCodesFilterChipsUtils } from '../utils/filter-chips.utils';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-view-donor-master-codes',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    FilterDonorMasterCodesComponent,
    PageHeaderWithBreadcrumb,
    FilterChips,
    SearchBar,
  ],
  templateUrl: './view-donor-master-codes.html',
  styleUrl: './view-donor-master-codes.scss',
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
export class ViewDonorMasterCodes implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME },
      { label: 'Donor Master Codes', link: null }
    ],
    actions: [{
      label: 'ADD NEW CODE TYPE',
      icon: 'add',
      onClick: () => this.onAddNew()
    }]
  };

  filterChips: FilterChip[] = [];
  descriptionTooltipDisabled = new Map<string, boolean>();

  displayedColumns: string[] = [
    'codeType',
    'description',
    'effectiveDate',
    'terminationDate',
    'action',
    'navigate',
  ];

  masterCodes: MasterCode[] = [];
  filteredCodes: MasterCode[] = [];
  selectedRow: MasterCode | null = null;

  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  sortDirection: 'A' | 'D' | '' = '';

  searchTerm = '';
  isLoading = false;
  isFilterPanelOpen = false;

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code type or description',
    minLength: 2,
    ariaLabel: 'Search by code type or description',
    searchOnEnterOnly: true
  };

  filterForm: FormGroup;
  currentFilters: MasterCodeFilter = {};
  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private donorMasterCodesService: DonorMasterCodesService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private loginService: LoginService
  ) {
    this.filterForm = this.fb.group({
      searchKeyword: [''],
      effectiveDate: [null],
      terminationDate: [null],
      effectiveDatePeriod: ['AFTER'],
      terminationDatePeriod: ['BEFORE'],
    });
  }

  ngOnInit(): void {
    this.loadMasterCodes();
    this.subscribeToChapterChanges();
  }

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

  loadMasterCodes(): void {
    this.isLoading = true;

    const skip = this.pageIndex * this.pageSize;
    const take = this.pageSize;

    // Build filter object from current state
    const filter: MasterCodeFilter = {
      searchKeyword: this.searchTerm,
      effectiveDate: this.currentFilters.effectiveDate,
      terminationDate: this.currentFilters.terminationDate,
    };

    // Only send period when a date is actually selected
    if (this.currentFilters.effectiveDate) {
      filter.effectiveDatePeriod = this.currentFilters.effectiveDatePeriod || 'AFTER';
    }
    if (this.currentFilters.terminationDate) {
      filter.terminationDatePeriod = this.currentFilters.terminationDatePeriod || 'BEFORE';
    }

    if (this.sortDirection) {
      filter.sort = this.sortDirection as 'A' | 'D';
    }

    this.donorMasterCodesService.getMasterCodes(take, skip, filter).subscribe({
      next: (response: { data: MasterCode[]; total: number }) => {
        this.masterCodes = response.data;
        this.filteredCodes = response.data;
        this.totalRecords = response.total;
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
    this.loadMasterCodes();
  }

  onSearchInput(): void {
    if (!this.searchTerm.trim()) {
      this.pageIndex = 0;
      this.loadMasterCodes();
    }
  }

  onSort(): void {
    if (!this.sortDirection) {
      this.sortDirection = 'A';
    } else if (this.sortDirection === 'A') {
      this.sortDirection = 'D';
    } else {
      this.sortDirection = '';
    }

    this.pageIndex = 0;
    this.loadMasterCodes();
  }

  getSortIcon(): string {
    if (!this.sortDirection) {
      return 'unfold_more';
    } else if (this.sortDirection === 'A') {
      return 'arrow_upward';
    } else {
      return 'arrow_downward';
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadMasterCodes();
  }

  isEditDisabled(row: MasterCode): boolean {
    return row.changeControlFlag?.toUpperCase() === 'D';
  }
  

  onAddNew(): void {
    const dialogRef = this.dialog.open(AddUpdateDonorMasterCodes, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      ariaLabel: 'Add new code type',
      data: { mode: 'add' },
    });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        const newMasterCode: CreateCodeTypeRequest = {
          codeType: result.codeType,
          description: result.description,
          effectiveDate: result.effDate || DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()).format('YYYY-MM-DD'),
          terminationDate: result.terminationDate || null,
          changeControlFlag: 'D',
          loggedInUserName: this.loginService.getStoredUsername(),
          chapterId: this.headerService.getCurrentChapterId()
        };

        this.donorMasterCodesService.createMasterCode(newMasterCode).subscribe({
          next: () => {
            dialogRef.close();
            this.snackbarService.showSuccess(`New Code Type ${result.codeType} has been successfully added.`);
            this.loadMasterCodes();
          },
          error: (error) => {
            dialogRef.componentInstance.isSaving = false;
            const errorResponse = error.error?.errorResponse;
            const errorMessage = errorResponse
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : (error.error?.message || error.message || 'Failed to add code type. Please try again.');
            this.snackbarService.showError(errorMessage);
          }
        });
      });
  }

  isRowHighlighted(row: MasterCode): boolean {
    return this.selectedRow?.code === row.code;
  }

  onEdit(row: MasterCode): void {
    this.selectedRow = row;
    const dialogRef = this.dialog.open(AddUpdateDonorMasterCodes, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      ariaLabel: 'Edit code type ' + row.code,
      data: {
        mode: 'edit',
        codeType: row.codeType,
        code: row.code,
        description: row.description,
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
      .subscribe(result => {
        const updateData = {
          description: result.description,
          effectiveDate: result.effDate || DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()).format('YYYY-MM-DD'),
          terminationDate: result.terminationDate || null,
          chapterId: this.headerService.getCurrentChapterId(),
          loggedInUserName: this.loginService.getStoredUsername()
        };

        this.donorMasterCodesService.updateMasterCode(row.codeType, row.code, updateData).subscribe({
          next: () => {
            dialogRef.close();
            this.snackbarService.showSuccess(`Code Type ${result.code} has been successfully updated.`);
            this.loadMasterCodes();
          },
          error: (error) => {
            dialogRef.componentInstance.isSaving = false;
            const errorResponse = error.error?.errorResponse;
            const errorMessage = errorResponse
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : (error.error?.message || error.message || 'Failed to update code type. Please try again.');
            this.snackbarService.showError(errorMessage);
          }
        });
      });
  }

  onNavigate(row: MasterCode): void {
    this.router.navigate(['/application-administration/donor-restricted/code-type', row.code], {
      state: {
        codeTypeDescription: row.description,
        codeTypeStatus: this.getStatusClass(row.termDate),
        codeType: row.codeType,
        code: row.code,
      },
    });
  }

  onBack(): void {
    this.router.navigate(['/application-administration']);
  }

  formatDate(date: Date | null): string {
    if (!date) return '-';
    const d = new Date(date);
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getStatusClass(termDate: Date | null): string {
    if (!termDate) return 'active';

    const chapterToday = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    const termMoment = moment(termDate).startOf('day');
    return termMoment.isBefore(chapterToday) ? 'inactive' : 'active';
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
    this.filterForm.reset({
      effectiveDatePeriod: 'AFTER',
      terminationDatePeriod: 'BEFORE',
    });
    this.pageIndex = 0;
    this.sortDirection = '';
    this.loadMasterCodes();
  }

  removeFilterChip(chipKey: string): void {
    const updatedFilters = DonorMasterCodesFilterChipsUtils.removeFilterByChipKey(
      this.currentFilters,
      chipKey
    );

    if (updatedFilters) {
      this.currentFilters = updatedFilters;
      this.filterChips = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(updatedFilters);
      this.filterForm.patchValue(updatedFilters);
      this.pageIndex = 0;
      this.loadMasterCodes();
    } else {
      this.clearAllFiltersChips();
    }
  }

  clearAllFiltersChips(): void {
    this.currentFilters = {};
    this.filterChips = [];
    this.filterForm.reset({
      effectiveDatePeriod: 'AFTER',
      terminationDatePeriod: 'BEFORE'
    });
    this.pageIndex = 0;
    this.loadMasterCodes();
  }

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    const dialogWidth = 400;
    const spacing = 8;

    const left = Math.min(rect.left, window.innerWidth - dialogWidth - spacing);

    this.isFilterPanelOpen = true;

    const dialogRef = this.dialog.open(FilterDonorMasterCodesComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'error-filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      ariaLabel: 'Filter donor master codes',
      data: this.currentFilters,
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`,
      },
    });

    dialogRef.afterClosed().subscribe((filters: MasterCodeFilter) => {
      this.isFilterPanelOpen = false;
      // Remove focus from filter button
      button.blur();
      if (filters) {
        this.currentFilters = filters;
        this.filterChips = DonorMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
        this.pageIndex = 0;
        this.loadMasterCodes();
      }
    });
  }
}
