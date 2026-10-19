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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FilterDonorMasterCodesComponent } from '../../filter-donor-master-codes/filter-donor-master-codes';
import { CodeType, CodeTypeFilter, DonorMasterCodesService, CodeTypeResponse, CreateCodeRequest } from '../../services/donor-master-codes.service';
import { AddUpdateCodeType } from '../add-update-code-type/add-update-code-type';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonorMasterCodesFilterChipsUtils } from '../../utils/filter-chips.utils';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-view-code-type',
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
    FilterChips,
    PageHeaderWithBreadcrumb,
    SearchBar,
  ],
  templateUrl: './view-code-type.html',
  styleUrl: './view-code-type.scss',
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
export class ViewCodeType implements OnInit, OnDestroy {
  filterChips: FilterChip[] = [];
  descriptionTooltipDisabled = new Map<string, boolean>();

  displayedColumns: string[] = [
    'code',
    'description',
    'effectiveDate',
    'terminationDate',
    'numberalValue',
    'sequence1',
    'sequence2',
    'sequence3',
    'action'
  ];

  masterCodes: CodeType[] = [];
  filteredCodes: CodeType[] = [];
  selectedRow: CodeType | null = null;

  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  sortDirection: 'A' | 'D' | '' = '';

  searchTerm = '';
  isLoading = false;
  isFilterPanelOpen = false;

  filterForm: FormGroup;
  currentFilters: CodeTypeFilter = {};
  codeParam: string = '';
  codeTypeDescription: string = '';
  codeTypeStatus: string = '';
  Math = Math;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    subtitle: '',
    actions: []
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code or description',
    minLength: 2,
    ariaLabel: 'Search by code or description',
    searchOnEnterOnly: true
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private donorMasterCodesService: DonorMasterCodesService,
    private snackBar: MatSnackBar,
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
    // Get route params
    this.activatedRoute.params.subscribe((params) => {
      if (params['code']) {
        this.codeParam = params['code'];
        this.loadMasterCodes();
      }
    });

    // Get route state (passed from navigation)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.codeTypeDescription = navigation.extras.state['codeTypeDescription'] || '';
      this.codeTypeStatus = navigation.extras.state['codeTypeStatus'] || '';
    } else if (history?.state) {
      // Fallback: try to get from history.state
      this.codeTypeDescription = history.state.codeTypeDescription || '';
      this.codeTypeStatus = history.state.codeTypeStatus || '';
    }

    // Set header config
    this.headerConfig = {
      title: this.codeTypeDescription || 'Code Type',
      subtitle: `${this.codeParam || 'code'} | ${this.codeTypeStatus || 'Active'}`,
      breadcrumbs: [
        { label: 'Home', link: '/' },
        { label: 'Donor Master Codes', link: '/application-administration/donor-restricted/donor-master-codes' },
        { label: this.codeParam || 'Code', link: null }
      ],
      showBackButton: true,
      onBackClick: () => this.onBack(),
      actions: [
        {
          label: 'ADD NEW CODE',
          icon: 'add',
          onClick: () => this.onAddNew()
        }
      ]
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMasterCodes(): void {
    if (!this.codeParam) {
      return;
    }

    this.isLoading = true;

    const skip = this.pageIndex * this.pageSize;
    const take = this.pageSize;

    // Build filter object from current state (code is passed as query param)
    const filter: CodeTypeFilter = {
      searchKeyword: this.searchTerm || '',
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

    this.donorMasterCodesService.getMasterCodesByCode(this.codeParam, take, skip, filter).subscribe({
      next: (response) => {
        // Map items and add calculated status field
        this.masterCodes = (response.data || []).map(item => ({
          ...item,
          status: this.getStatus(item.termDate)
        }));
        this.filteredCodes = this.masterCodes;
        this.totalRecords = response.total || 0;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  isEditDisabled(row: CodeType): boolean {
    return row.changeControlFlag?.toUpperCase() === 'D';
  }

  onSearch(searchKeyword: string): void {
    this.searchTerm = searchKeyword;
    this.pageIndex = 0;
    this.loadMasterCodes();
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
      return 'unfold_more';  // No sort applied
    }
    if (this.sortDirection === 'A') {
      return 'arrow_upward';  // Ascending
    }
    return 'arrow_downward';  // Descending
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadMasterCodes();
  }

  onAddNew(): void {
    if (!this.codeParam) {
      return;
    }

    const dialogRef = this.dialog.open(AddUpdateCodeType, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      autoFocus: false,
      ariaLabel: 'Add new code',
      data: {
        mode: 'add',
        codeType: this.codeParam,
        codeTypeDescription: this.codeTypeDescription
      }
    });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        const newCode: CreateCodeRequest = {
          codeType: result.codeType,
          code: result.code,
          description: result.description,
          effectiveDate: result.effectiveDate || DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()).format('YYYY-MM-DD'),
          terminationDate: result.termDate || null,
          sequence1: result.sequence1 || 0,
          sequence2: result.sequence2 || 0,
          sequence3: result.sequence3 || 0,
          numericalValue: result.numberalValue || 0,
          codeBehavior: '',
          changeControlFlag: 'D',
          loggedInUserName: this.loginService.getStoredUsername(),
          chapterId: this.headerService.getCurrentChapterId()
        };

        this.donorMasterCodesService.createCode(newCode).subscribe({
          next: () => {
            dialogRef.close();
            this.snackbarService.showSuccess(`New Code ${result.code} has been successfully added to ${this.codeParam}.`);
            this.loadMasterCodes();
          },
          error: (error) => {
            dialogRef.componentInstance.isSaving = false;
            const errorResponse = error.error?.errorResponse;
            const errorMessage = errorResponse
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : (error.error?.message || error.message || 'Failed to add code. Please try again.');
            this.snackbarService.showError(errorMessage);
          }
        });
      });
  }

  isRowHighlighted(row: CodeType): boolean {
    return this.selectedRow?.code === row.code;
  }

  onEdit(row: CodeType): void {
    this.selectedRow = row;
    if (!this.codeParam || !row.code) {
      return;
    }

    const dialogRef = this.dialog.open(AddUpdateCodeType, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      autoFocus: false,
      ariaLabel: 'Edit code ' + row.code,
      data: {
        mode: 'edit',
        codeType: row.codeType,
        codeTypeDescription: this.codeTypeDescription,
        code: row.code,
        description: row.description,
        effectiveDate: row.effDate,
        termDate: row.termDate,
        numberalValue: row.numberalValue || null,
        sequence1: row.sequence1 || null,
        sequence2: row.sequence2 || null,
        sequence3: row.sequence3 || null
      }
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
          codeType: result.codeType,
          code: result.code,
          description: result.description,
          effectiveDate: result.effectiveDate || DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone()).format('YYYY-MM-DD'),
          terminationDate: result.termDate || null,
          sequence1: result.sequence1 || 0,
          sequence2: result.sequence2 || 0,
          sequence3: result.sequence3 || 0,
          numericalValue: result.numberalValue || 0,
          codeBehavior: '',
          changeControlFlag: 'U',
          chapterId: this.headerService.getCurrentChapterId(),
          loggedInUserName: this.loginService.getStoredUsername()
        };

        this.donorMasterCodesService.updateCode(row.codeType, row.code, updateData).subscribe({
          next: () => {
            dialogRef.close();
            this.snackbarService.showSuccess(`Code ${result.code} has been successfully updated in ${this.codeParam}.`);
            this.loadMasterCodes();
          },
          error: (error) => {
            dialogRef.componentInstance.isSaving = false;
            const errorResponse = error.error?.errorResponse;
            const errorMessage = errorResponse
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : (error.error?.message || error.message || 'Failed to update code. Please try again.');
            this.snackbarService.showError(errorMessage);
          }
        });
      });
  }
 
  onBack(): void {
    this.router.navigate(['/application-administration/donor-restricted/donor-master-codes']);
  }

  formatDate(date: Date | null): string {
    if (!date) return '-';
    const d = new Date(date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getStatus(termDate: Date | null): string {
    if (this.codeTypeStatus.toLowerCase() === 'inactive') 
      return 'inactive';

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
    this.filterChips = [];
    this.filterForm.reset({
      effectiveDatePeriod: 'AFTER',
      terminationDatePeriod: 'BEFORE'
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
  
    const left = Math.min(
      rect.left,
      window.innerWidth - dialogWidth - spacing
    );
  
    this.isFilterPanelOpen = true;

    const dialogRef = this.dialog.open(FilterDonorMasterCodesComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'error-filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      ariaLabel: 'Filter codes',
      data: this.currentFilters,
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`
      }
    });

    dialogRef.afterClosed().subscribe((filters: CodeTypeFilter) => {
      this.isFilterPanelOpen = false;
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
