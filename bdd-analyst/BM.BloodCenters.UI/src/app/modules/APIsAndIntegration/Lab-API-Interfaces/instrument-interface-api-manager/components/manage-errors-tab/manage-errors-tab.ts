import { Component, Input, signal, computed, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { take } from 'rxjs';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ErrorCode, ErrorHandlingFilterRequest, MachineTestId } from '../../models/instrument-interface.model';
import { ErrorDialog } from '../error-dialog/error-dialog';
import { ManageErrorsFilterPanel, ManageErrorsFilterValue } from '../manage-errors-filter-panel/manage-errors-filter-panel';
import { buildManageErrorsFilterChips } from '../../utils/manage-errors-filter-chips.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

@Component({
  selector: 'app-manage-errors-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    OverlayModule,
    SearchBar,
    FilterChips,
    ManageErrorsFilterPanel,
    DatePipe,
  ],
  templateUrl: './manage-errors-tab.html',
  styleUrls: ['./manage-errors-tab.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    }
  ],
})
export class ManageErrorsTab implements OnChanges {
  @Input() chapterId!: string;
  @Input() instrumentId!: string;

  private instrumentService = inject(InstrumentInterfaceService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);

  // Signals
  errorCodeList = signal<ErrorCode[]>([]);
  machineTestIds = signal<MachineTestId[]>([]);
  machineTestIdStrings = computed(() => this.machineTestIds().map(item => item.machineTestId));
  paginatedData = signal<ErrorCode[]>([]);
  loading = signal<boolean>(false);
  hasLoadedData = signal<boolean>(false);
  searchText = signal<string>('');
  pageIndex = signal<number>(0);
  pageSize = signal<number>(25);
  totalItems = signal<number>(0);
  sortDirection = signal<'asc' | 'desc' | ''>('desc');
  sortColumn = signal<string>('machineTestId');

  // Filter
  isFilterOpen = false;
  currentFilters = signal<ManageErrorsFilterValue>({
    machineTestId: null,
    effDatePeriod: null,
    effDate: null,
    termDatePeriod: null,
    termDate: null
  });
  filterChips: FilterChip[] = [];

  displayedColumns: string[] = [
    'machineTestId',
    'errorCode',
    'errorDescription',
    'skipAbort',
    'effectiveDate',
    'terminationDate',
    'actions',
  ];

  searchConfig = {
    placeholder: 'Search by machine test ID, error code or description',
    ariaLabel: 'Search by machine test ID, error code or description',
    debounceTime: 300,
    searchOnEnterOnly: true,
    minLength: 1,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chapterId'] || changes['instrumentId']) {
      this.errorCodeList.set([]);
      this.paginatedData.set([]);
      this.totalItems.set(0);
      this.hasLoadedData.set(false);
      this.loading.set(false);
      this.searchText.set('');
      this.pageIndex.set(0);
      this.pageSize.set(25);
      this.sortDirection.set('desc');
      this.sortColumn.set('machineTestId');
      this.currentFilters.set({
        machineTestId: null,
        effDatePeriod: null,
        effDate: null,
        termDatePeriod: null,
        termDate: null
      });
      this.filterChips = [];
    }
  }

  loadMachineTestIds(): void {
    if (!this.chapterId || !this.instrumentId) {
      return;
    }
    this.instrumentService.getMachineTestIds(this.chapterId, this.instrumentId).subscribe({
      next: (data) => this.machineTestIds.set(data),
      error: () => this.machineTestIds.set([]),
    });
  }

  loadErrorCodes(): void {
    if (!this.chapterId || !this.instrumentId) {
      return;
    }

    this.loading.set(true);
    this.loadMachineTestIds();

    const filters = this.currentFilters();
    const payload: ErrorHandlingFilterRequest = {
      chapterId: this.chapterId,
      machineId: this.instrumentId,
      machineTestId: filters.machineTestId || null,
      searchItem: this.searchText() || '',
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(filters.effDate) || null,
      terminationDate: DateFieldValidationUtility.serializeDateForApi(filters.termDate) || null,
      periodEffDate: filters.effDatePeriod || null,
      periodTermDate: filters.termDatePeriod || null,
      sortDirection: this.sortDirection() || null,
    };

    const take = this.pageSize();
    const skip = this.pageIndex() * this.pageSize();

    this.instrumentService.filterErrorCodes(take, skip, payload).subscribe({
      next: (response) => {
        const errorData = Array.isArray(response.data) ? response.data : [];
        this.paginatedData.set(errorData);
        this.totalItems.set(response.total || 0);
        this.errorCodeList.set(errorData);
        this.hasLoadedData.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.paginatedData.set([]);
        this.totalItems.set(0);
        this.hasLoadedData.set(true);
        this.loading.set(false);
      },
    });
  }

  onSearch(searchText: string): void {
    this.searchText.set(searchText);
    this.pageIndex.set(0);
    this.loadErrorCodes();
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else if (this.sortDirection() === 'desc') {
        this.sortDirection.set('');
        this.sortColumn.set('');
      } else {
        this.sortDirection.set('asc');
      }
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.pageIndex.set(0);
    this.loadErrorCodes();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) {
      return 'unfold_more';
    }
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadErrorCodes();
  }

  openAddErrorDialog(): void {
    const dialogRef = this.dialog.open(ErrorDialog, {
      width: '745px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'test-dialog-panel-right',
      backdropClass: 'test-dialog-backdrop',
      hasBackdrop: true,
      disableClose: true,
      data: {
        mode: 'add',
        machineTestIds: this.machineTestIds(),
        chapterId: this.chapterId,
        instrumentId: this.instrumentId
      },
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
      if (result) {
        this.instrumentService.addErrorCode(result, this.chapterId, this.instrumentId).subscribe({
          next: (response) => {
            const successMessage = response?.message || `New error Code ${result.errorCode} added successfully.`;
            this.snackbarService.showSuccess(successMessage);
            this.loadErrorCodes();
          }
        });
      }
    });
  }

  openEditErrorDialog(errorCode: ErrorCode): void {
    // Show loading state
    this.loading.set(true);

    // Fetch error code details from API
    this.instrumentService
      .getErrorCodeDetails(
        this.chapterId,
        this.instrumentId,
        errorCode.machineTestId,
        errorCode.errorCode
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          // Extract the error data from the API response
          const errorData = response?.item || errorCode;

          const dialogRef = this.dialog.open(ErrorDialog, {
            width: '745px',
            height: 'calc(100vh - 64px)',
            maxWidth: '100vw',
            maxHeight: 'calc(100vh - 64px)',
            position: { right: '0', top: '64px' },
            panelClass: 'test-dialog-panel-right',
            backdropClass: 'test-dialog-backdrop',
            hasBackdrop: true,
            disableClose: true,
            data: {
              mode: 'edit',
              errorCode: errorData,
              machineTestIds: this.machineTestIds(),
              chapterId: this.chapterId,
              instrumentId: this.instrumentId
            },
          });

          dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
            if (result) {
              this.instrumentService.updateErrorCode(result, this.chapterId, this.instrumentId).subscribe({
                next: (updateResponse) => {
                  const successMessage = updateResponse?.message || `Error Code ${result.errorCode} updated successfully.`;
                  this.snackbarService.showSuccess(successMessage);
                  this.loadErrorCodes();
                },
                error: (err) => {
                  const errorMessage = this.extractErrorMessage(err, 'Failed to update error code.');
                  this.snackbarService.showError(errorMessage);
                },
              });
            }
          });
        },
        error: (err) => {
          this.loading.set(false);
        },
      });
  }

  trackByIndex(index: number): number {
    return index;
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onFilterApply(filters: ManageErrorsFilterValue): void {
    this.currentFilters.set(filters);
    this.filterChips = buildManageErrorsFilterChips(filters);
    this.isFilterOpen = false;
    this.pageIndex.set(0);
    this.loadErrorCodes();
  }

  onFilterClose(): void {
    this.isFilterOpen = false;
  }

  removeFilterChip(chipKey: string): void {
    const current = this.currentFilters();
    let updated: ManageErrorsFilterValue;

    switch (chipKey) {
      case 'machineTestId':
        updated = { ...current, machineTestId: null };
        break;
      case 'effDate':
        updated = { ...current, effDate: null, effDatePeriod: null };
        break;
      case 'termDate':
        updated = { ...current, termDate: null, termDatePeriod: null };
        break;
      default:
        updated = current;
    }

    this.currentFilters.set(updated);
    this.filterChips = buildManageErrorsFilterChips(updated);
    this.pageIndex.set(0);
    this.loadErrorCodes();
  }

  clearAllFilters(): void {
    this.currentFilters.set({
      machineTestId: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
    this.filterChips = [];
    this.pageIndex.set(0);
    this.loadErrorCodes();
  }

  /**
   * Extract meaningful error message from API error response
   * Handles multiple error response formats:
   * - err.error.errors[] (array of error messages)
   * - err.error.modelErrors{} (object with field-level errors)
   * - err.error.message (single error message)
   * - err.message (fallback)
   * @param err - The error object from HTTP response
   * @param defaultMessage - Fallback message if no specific error found
   * @returns Formatted error message string
   */
  private extractErrorMessage(err: any, defaultMessage: string): string {
    // Handle array of error messages
    if (err?.error?.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0) {
      return err.error.errors.join(', ');
    }

    // Handle model validation errors (object with field names as keys)
    if (err?.error?.modelErrors && typeof err.error.modelErrors === 'object') {
      const modelErrors = err.error.modelErrors;
      const errorMessages = Object.keys(modelErrors)
        .map(field => {
          const fieldErrors = modelErrors[field];
          if (Array.isArray(fieldErrors)) {
            return fieldErrors.join(', ');
          }
          return fieldErrors;
        })
        .filter(msg => msg);

      if (errorMessages.length > 0) {
        return errorMessages.join('; ');
      }
    }

    // Handle single error message in response
    if (err?.error?.message) {
      return err.error.message;
    }

    // Fallback to error.message or default message
    return err?.message || defaultMessage;
  }
}
