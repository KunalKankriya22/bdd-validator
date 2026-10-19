import { Component, OnInit, OnDestroy, effect } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
import { FilterLabMasterCodesComponent } from '../filter-lab-master-codes/filter-lab-master-codes';
import { LabMasterCodesService, MasterCodeListItem, MasterCodeFilter } from '../services/lab-master-codes.service';
import {
  AddEditLabMasterCodeType,
  MasterCodeDialogData
} from '../../add-edit-lab-master-code-type/add-edit-lab-master-code-type';
import { LabMasterCodeTypeApiService } from '../../services/lab-master-code-type-api.service';
import {
  CreateLabMasterCodeTypeDto,
  UpdateLabMasterCodeTypeDto
} from '../../models/lab-master-code-type.models';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { LabMasterCodesFilterChipsUtils } from '../utils/filter-chips.utils';
import { ROUTES } from '../../../../../core/constants/route.constants';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';

/**
 * Custom MatPaginatorIntl to change "Items per page" to "Rows per page"
 */
export function getLabMasterCodesPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Rows per page:';
  return paginatorIntl;
}

@Component({
  selector: 'app-view-lab-master-codes',
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
    { provide: MatPaginatorIntl, useValue: getLabMasterCodesPaginatorIntl() }
  ],
  templateUrl: './view-lab-master-codes.html',
  styleUrl: './view-lab-master-codes.scss',
})
export class ViewLabMasterCodes implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'code',
    'description',
    'effectiveDate',
    'terminationDate',
    'modificationDate',
    'action',
    'navigate',
  ];

  masterCodes: MasterCodeListItem[] = [];
  filteredCodes: MasterCodeListItem[] = [];
  selectedRow: MasterCodeListItem | null = null;

  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  sortDirection: 'A' | 'D' | '' = '';

  searchTerm = '';
  isLoading = false;

  isFilterPanelOpen = false;

  filterForm: FormGroup;
  currentFilters: MasterCodeFilter = {};
  Math = Math;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME },
      { label: 'Application Administration', link: '/application-administration' },
      { label: 'Lab Master Codes', link: null }
    ],
    actions: [
      {
        label: 'ADD NEW CODE TYPE',
        icon: 'add',
        onClick: () => this.onAddNew()
      }
    ]
  };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code type or description',
    minLength: 2,
    ariaLabel: 'Search by code type or description',
    searchOnEnterOnly: true
  };

  filterChips: FilterChip[] = [];

  descriptionTooltipDisabled = new Map<string, boolean>();

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private labMasterCodesService: LabMasterCodesService,
    private labMasterCodeTypeApiService: LabMasterCodeTypeApiService,
    private snackbarService: SnackbarService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService
  ) {
    this.filterForm = this.fb.group({
      searchKeyword: [''],
      effectiveDate: [null],
      terminationDate: [null],
      effectiveDatePeriod: [null],
      terminationDatePeriod: [null],
    });

    // Bind header data from API/menu service
    effect(() => {
      const menuItem = this.pageHeaderService.getCurrentMenuItem();
      if (menuItem) {
        const subtitle = (menuItem.subtitle && menuItem.subtitle.trim())
          ? menuItem.subtitle
          : menuItem.remarks;

        this.headerConfig = {
          ...this.headerConfig,
          title: menuItem.label,
          subtitle: subtitle,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: menuItem.label, link: null }
          ]
        };
      }
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

    const filter: MasterCodeFilter = {
      searchKeyword: this.searchTerm || '',
      effectiveDate: this.currentFilters.effectiveDate,
      terminationDate: this.currentFilters.terminationDate,
      effectiveDatePeriod: this.currentFilters.effectiveDatePeriod,
      terminationDatePeriod: this.currentFilters.terminationDatePeriod,
      sort: this.sortDirection as 'A' | 'D' | undefined
    };

    this.labMasterCodesService.getMasterCodes(take, skip, filter).subscribe({
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
      return 'unfold_more';
    }
    return this.sortDirection === 'A' ? 'arrow_upward' : 'arrow_downward';
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadMasterCodes();
  }

  onAddNew(): void {
    const dialogRef = this.dialog.open(AddEditLabMasterCodeType, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      data: { mode: 'add' } as MasterCodeDialogData,
      ariaLabel: 'Add New Code Type',
    });

    dialogRef.componentInstance.saveRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        const createDto: CreateLabMasterCodeTypeDto = {
          codeType: result.code,
          description: result.description,
          effectiveDate: result.effectiveDate,
          terminationDate: result.termDate || null,
          changeControlFlag: 'D'
        };

        this.labMasterCodeTypeApiService.createCodeType(createDto).subscribe({
          next: () => {
            dialogRef.close();
            this.snackbarService.showSuccess(`New Code Type ${result.code} has been successfully added.`);
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

  isRowHighlighted(row: MasterCodeListItem): boolean {
    return this.selectedRow?.code === row.code;
  }

  onEdit(row: MasterCodeListItem): void {
    this.selectedRow = row;
    const dialogRef = this.dialog.open(AddEditLabMasterCodeType, {
      width: '50vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'right-side-dialog',
      position: { right: '0', top: '64px' },
      data: {
        mode: 'edit',
        code: row.code,
        description: row.description,
        effectiveDate: row.effDate ?? undefined,
        termDate: row.termDate ?? null,
        modificationDate: row.lastModifiedDate ?? undefined
      } as MasterCodeDialogData,
      ariaLabel: 'Edit Code Type ' + row.code,
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
        const updateDto: UpdateLabMasterCodeTypeDto = {
          codeType: row.code,
          description: result.description,
          effectiveDate: result.effectiveDate,
          terminationDate: result.termDate || null
        };

        this.labMasterCodeTypeApiService.updateCodeType(row.code, updateDto).subscribe({
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

  onNavigate(row: MasterCodeListItem): void {
    this.router.navigate(['/application-administration/lab-restricted/code', row.code], {
      state: {
        codeTypeDescription: row.description,
        codeTypeStatus: this.getStatusClass(row.termDate),
        codeType: row.code
      }
    });
  }

  isEditDisabled(row: MasterCodeListItem): boolean {
    return row.changeControlFlag === 'D';
  }

  onBack(): void {
    this.router.navigate(['/application-administration']);
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

    const dialogWidth = 380;
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
      ariaLabel: 'Filter Lab Master Codes',
    });

    dialogRef.afterClosed().subscribe((filters: MasterCodeFilter) => {
      this.isFilterPanelOpen = false;
      button.blur();
      if (filters) {
        this.currentFilters = filters;
        this.filterChips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
        this.pageIndex = 0;
        this.loadMasterCodes();
      }
    });
  }

  removeFilterChip(chipKey: string): void {
    const updatedFilters = LabMasterCodesFilterChipsUtils.removeFilterByChipKey(
      this.currentFilters,
      chipKey
    );

    if (updatedFilters) {
      this.currentFilters = updatedFilters;
      this.filterChips = LabMasterCodesFilterChipsUtils.convertFiltersToChips(updatedFilters);
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
}
