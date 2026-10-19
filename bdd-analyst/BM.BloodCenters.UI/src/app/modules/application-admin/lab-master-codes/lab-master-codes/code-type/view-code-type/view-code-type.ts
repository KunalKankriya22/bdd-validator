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
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FilterLabMasterCodesComponent } from '../../filter-lab-master-codes/filter-lab-master-codes';
import { CodeTypeFilter, LabMasterCodesService, MasterCodeDetail } from '../../services/lab-master-codes.service';
import {
  AddEditLabMasterWithinCode,
  LabMasterCodeDialogData
} from '../../../add-edit-lab-master-within-code/add-edit-lab-master-within-code';
import { LabMasterWithinCodeApiService } from '../../../services/lab-master-within-code-api.service';
import { CreateLabMasterCodeDto, UpdateLabMasterCodeDto } from '../../../models/lab-master-within-code.models';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { CodeTypeFilterChipsUtils } from '../utils/code-type-filter-chips.utils';
import { ROUTES } from '../../../../../../core/constants/route.constants';
import { SnackbarService } from '../../../../../../shared/services/snackbar.service';

/**
 * Custom MatPaginatorIntl to change "Items per page" to "Rows per page"
 */
export function getCodeTypePaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

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
    FilterLabMasterCodesComponent,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: getCodeTypePaginatorIntl() }
  ],
  templateUrl: './view-code-type.html',
  styleUrl: './view-code-type.scss',
})
export class ViewLabCodeType implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'code',
    'description',
    'effectiveDate',
    'terminationDate',
    'numericalValue',
    'sequence1',
    'sequence2',
    'sequence3',    
    'modificationDate',
    'action'
  ];

  masterCodes: MasterCodeDetail[] = [];
  filteredCodes: MasterCodeDetail[] = [];
  selectedRow: MasterCodeDetail | null = null;

  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  sortDirection: 'A' | 'D' | '' = '';

  searchTerm = '';
  isLoading = false;

  filterForm: FormGroup;
  currentFilters: CodeTypeFilter = {};
  codeParam: string = '';
  codeTypeDescription: string = '';
  codeTypeStatus: string = '';
  Math = Math;

  // Header and Search configuration
  headerConfig!: PageHeaderConfig;
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code or description',
    minLength: 2,
    ariaLabel: 'Search master codes',
    searchOnEnterOnly: true
  };

  // Filter chips
  filterChips: FilterChip[] = [];

  isFilterPanelOpen = false;

  descriptionTooltipDisabled = new Map<string, boolean>();

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private labMasterCodesService: LabMasterCodesService,
    private labMasterWithinCodeApiService: LabMasterWithinCodeApiService,
    private snackbarService: SnackbarService
  ) {
    this.filterForm = this.fb.group({
      searchKeyword: [''],
      effectiveDate: [null],
      terminationDate: [null],
      effectiveDatePeriod: [null],
      terminationDatePeriod: [null],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    // Get route params
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
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
      this.codeTypeDescription = history.state.codeTypeDescription || '';
      this.codeTypeStatus = history.state.codeTypeStatus || '';
    }

    // Initialize header config
    this.initializeHeaderConfig();
  }

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      title: this.codeTypeDescription || 'Lab Master Code Type',
      subtitle: `${this.codeParam} | ${this.codeTypeStatus || 'Active'}`,
      breadcrumbs: [
        { label: 'Home', link: ROUTES.HOME },
        { label: 'Lab Master Codes', link: '/application-administration/lab-restricted/lab-master-codes' },
        { label: this.codeTypeDescription || this.codeParam || 'Code Type', link: null }
      ],
      actions: [
        {
          label: 'ADD NEW CODE',
          icon: 'add',
          onClick: () => this.onAddNew(),
          color: 'primary'
        }
      ],
      showBackButton: true,
      onBackClick: () => this.onBack()
    };
  }

  loadMasterCodes(): void {
    if (!this.codeParam) {
      return;
    }

    this.isLoading = true;

    const skip = this.pageIndex * this.pageSize;
    const take = this.pageSize;

    const filter: CodeTypeFilter = {
      searchKeyword: this.searchTerm || undefined,
      effectiveDate: this.currentFilters.effectiveDate,
      terminationDate: this.currentFilters.terminationDate,
      effectiveDatePeriod: this.currentFilters.effectiveDatePeriod,
      terminationDatePeriod: this.currentFilters.terminationDatePeriod,
      sort: this.sortDirection || undefined
    };

    this.labMasterCodesService.getLabMasterCodesByType(this.codeParam, take, skip, filter).subscribe({
      next: (response) => {
        this.masterCodes = response.data;
        this.filteredCodes = response.data;
        this.totalRecords = response.total;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  isEditDisabled(row: MasterCodeDetail): boolean {
    return row.changeControlFlag === 'D';
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.pageIndex = 0;
    this.loadMasterCodes();
  }

  onAddNew(): void {
    if (!this.codeParam) {
      return;
    }

    const dialogRef = this.dialog.open(AddEditLabMasterWithinCode, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      data: {
        mode: 'add',
        codeType: this.codeParam,
        codeTypeDescription: this.codeTypeDescription
      } as LabMasterCodeDialogData,
      autoFocus: false,
      ariaLabel: 'Add New Code',
    });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        const createDto: CreateLabMasterCodeDto = {
          codeType: result.codeType,
          code: result.code,
          description: result.description,
          effectiveDate: result.effectiveDate,
          terminationDate: result.terminationDate || null,
          numericalValue: result.numericalValue ?? null,
          sequence1: result.sequence1 ?? null,
          sequence2: result.sequence2 ?? null,
          sequence3: result.sequence3 ?? null,
          changeControlFlag: 'D'
        };

        this.labMasterWithinCodeApiService.createCode(createDto).subscribe({
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

  isRowHighlighted(row: MasterCodeDetail): boolean {
    return this.selectedRow?.code === row.code;
  }

  onEdit(row: MasterCodeDetail): void {
    this.selectedRow = row;
    if (!this.codeParam || !row.code) {
      return;
    }

    const dialogRef = this.dialog.open(AddEditLabMasterWithinCode, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      data: {
        mode: 'edit',
        codeType: this.codeParam,
        code: row.code,
        description: row.description,
        effectiveDate: row.effDate,
        terminationDate: row.termDate,
        numericalValue: row.numericalValue,
        sequence1: row.sequence1,
        sequence2: row.sequence2,
        sequence3: row.sequence3,
        codeTypeDescription: this.codeTypeDescription,
        modificationDate: row.lastModifiedDate,
      } as LabMasterCodeDialogData,
      autoFocus: false,
      ariaLabel: 'Edit Code ' + row.code,
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
        const updateDto: UpdateLabMasterCodeDto = {
          description: result.description,
          effectiveDate: result.effectiveDate,
          terminationDate: result.terminationDate || null,
          numericalValue: result.numericalValue ?? null,
          sequence1: result.sequence1 ?? null,
          sequence2: result.sequence2 ?? null,
          sequence3: result.sequence3 ?? null
        };

        this.labMasterWithinCodeApiService.updateCode(this.codeParam, row.code, updateDto).subscribe({
          next: () => {
            dialogRef.close();
            this.snackbarService.showSuccess(`Code ${result.code} has been successfully updated to ${this.codeParam}.`);
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
    this.router.navigate(['/application-administration/lab-restricted/lab-master-codes']);
  }

  // Filter chip methods
  removeFilterChip(chipKey: string): void {
    const updatedFilters = CodeTypeFilterChipsUtils.removeFilterByChipKey(
      this.currentFilters,
      chipKey
    );

    if (updatedFilters) {
      this.currentFilters = updatedFilters;
      this.filterChips = CodeTypeFilterChipsUtils.convertFiltersToChips(updatedFilters);
      this.pageIndex = 0;
      this.loadMasterCodes();
    } else {
      this.clearAllFiltersChips();
    }
  }

  clearAllFiltersChips(): void {
    this.currentFilters = {};
    this.filterChips = [];
    this.filterForm.reset();
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
      return 'unfold_more';
    }
    if (this.sortDirection === 'A') {
      return 'arrow_upward';
    }
    return 'arrow_downward';
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadMasterCodes();
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

  getStatusClass(termDate: Date | null): string {
    const status = termDate && new Date(termDate) < new Date() ? 'inactive' : 'active';
    return status;
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
    this.filterForm.reset();
    this.pageIndex = 0;
    this.sortDirection = '';
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

    const dialogRef = this.dialog.open(FilterLabMasterCodesComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'error-filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      data: this.currentFilters,
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`
      },
      ariaLabel: 'Filter Codes',
    });

    dialogRef.afterClosed().subscribe((filters: CodeTypeFilter) => {
      this.isFilterPanelOpen = false;
      button.blur();
      if (filters) {
        this.currentFilters = filters;
        this.filterChips = CodeTypeFilterChipsUtils.convertFiltersToChips(filters);
        this.pageIndex = 0;
        this.loadMasterCodes();
      }
    });
  }
}
