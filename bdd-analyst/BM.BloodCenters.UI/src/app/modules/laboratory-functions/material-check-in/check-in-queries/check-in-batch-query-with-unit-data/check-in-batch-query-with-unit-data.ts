import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';

import { CheckInBatchQueryApiService } from './services/check-in-batch-query-api.service';
import { BatchIdLovItem, BatchUnitDto } from './models/check-in-batch-query.model';

@Component({
  selector: 'app-check-in-batch-query-with-unit-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    SearchBar,
    DataTable,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './check-in-batch-query-with-unit-data.html',
  styleUrls: ['./check-in-batch-query-with-unit-data.scss'],
})
export class CheckInBatchQueryWithUnitDataComponent implements OnInit, OnDestroy {
  private readonly service = inject(CheckInBatchQueryApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;

  pageHeaderConfig: PageHeaderConfig = this.getPageHeaderConfig();

  batchIdControl = new FormControl('', [Validators.required]);
  allBatchIds: BatchIdLovItem[] = [];
  filteredBatchIds: BatchIdLovItem[] = [];

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by unit ID',
    ariaLabel: 'Search by unit ID',
    minLength: 1,
    searchOnEnterOnly: false,
    alwaysShowTooltip: false,
  };

  tableConfig: DataTableConfig<BatchUnitDto> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true,
        width: '200px',
        valueFormatter: (value, row) => this.formatUnitIdWithCheckDigit(value, row),
      },
      {
        key: 'collDate',
        header: 'Collection Date',
        width: '130px',
        valueFormatter: (value) => this.formatDateForDisplay(value),
      },
      {
        key: 'donorDecisionCode',
        header: 'Cue',
        width: '80px',
        valueFormatter: (value) => this.formatYesNo(value),
      },
      { key: 'catalogNumber', header: 'Catalog Number', width: '130px' },
      { key: 'groupSiteId', header: 'Group/\nSite ID', width: '120px' },
      {
        key: 'redTubeFlag',
        header: 'Red\nTube 1',
        width: '100px',
        valueFormatter: (value) => this.formatYesNo(value),
      },
      {
        key: 'redTube2',
        header: 'Red\nTube 2',
        width: '100px',
        valueFormatter: (value) => this.formatYesNo(value),
      },
      {
        key: 'purpleTubeFlag',
        header: 'Purple\nTube 1',
        width: '110px',
        valueFormatter: (value) => this.formatYesNo(value),
      },
      {
        key: 'serumPlasmaInd',
        header: 'Purple\nTube 2',
        width: '110px',
        valueFormatter: (value) => this.formatYesNo(value),
      },
      {
        key: 'bleedStartTime',
        header: 'Bleed\nstart time',
        width: '120px',
        valueFormatter: (value) => this.formatTimeForDisplay(value),
      },
      {
        key: 'bleedEndTime',
        header: 'Bleed\nend time',
        width: '120px',
        valueFormatter: (value) => this.formatTimeForDisplay(value),
      },
      {
        key: 'qcCheckinDate',
        header: 'QC Date',
        width: '170px',
        valueFormatter: (value) => this.formatDateForDisplay(value),
      },
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'unitId',
      direction: 'default',
    },
    stickyHeader: true,
    showPagination: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    noDataIcon: 'search',
    loadingMessage: 'Loading unit data...',
  };

  allUnits: BatchUnitDto[] = [];
  dataSource: BatchUnitDto[] = [];
  unitCount = 0;
  isLoading = false;
  hasRetrieved = false;
  private searchKeyword = '';

  ngOnInit(): void {
    this.loadBatchIds();
    this.subscribeToChapterChanges();
    this.setupBatchFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getPageHeaderConfig(): PageHeaderConfig {
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.pageHeaderService.getTitle() || 'Check in Batch Query with Unit Data', link: null },
      ],
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadBatchIds();
      });
  }

  private loadBatchIds(): void {
    this.service
      .getBatchIdsLov()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (batchIds) => {
          this.allBatchIds = batchIds;
          this.filteredBatchIds = batchIds.slice();
        },
        error: () => {
          this.allBatchIds = [];
          this.filteredBatchIds = [];
        },
      });
  }

  private setupBatchFilter(): void {
    this.batchIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterBatchIds();
      });
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    if (this.autoTrigger.panelOpen) {
      this.autoTrigger.closePanel();
    } else {
      this.filteredBatchIds = this.allBatchIds.slice();
      this.autoTrigger.openPanel();
    }
  }

  onBatchOptionSelected(): void {
    this.filteredBatchIds = this.allBatchIds.slice();
  }

  private filterBatchIds(): void {
    const search = (this.batchIdControl.value || '').toUpperCase();
    if (!search) {
      this.filteredBatchIds = this.allBatchIds.slice();
      return;
    }
    this.filteredBatchIds = this.allBatchIds.filter((b) =>
      b.batchId.toUpperCase().includes(search)
    );
  }

  onRetrieve(): void {
    this.batchIdControl.markAsTouched();
    const batchId = this.batchIdControl.value?.trim();
    if (!batchId || this.batchIdControl.invalid) return;

    this.isLoading = true;
    this.hasRetrieved = true;
    this.searchKeyword = '';

    this.service
      .getUnitsByBatchId(batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allUnits = response.units;
          this.unitCount = response.unitCount;
          this.applyClientFilters();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          const errorMessage = this.getErrorMessage(error);
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
          this.allUnits = [];
          this.dataSource = [];
          this.unitCount = 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onClear(): void {
    this.batchIdControl.reset('');
    this.batchIdControl.markAsTouched();
    this.allUnits = [];
    this.dataSource = [];
    this.unitCount = 0;
    this.hasRetrieved = false;
    this.searchKeyword = '';
    this.filteredBatchIds = this.allBatchIds.slice();
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
      this.tableConfig.pagination.totalRecords = 0;
    }
    this.tableConfig = { ...this.tableConfig };
    this.cdr.detectChanges();
  }

  onUnitSearch(keyword: string): void {
    this.searchKeyword = keyword?.trim() || '';
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = 0;
    }
    this.applyClientFilters();
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
    this.applyClientFilters();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }
    this.applyClientFilters();
  }

  private applyClientFilters(): void {
    let filtered = [...this.allUnits];

    if (this.searchKeyword) {
      const term = this.searchKeyword.toUpperCase();
      filtered = filtered.filter((u) =>
        u.unitId.toUpperCase().includes(term)
      );
    }

    const sortConfig = this.tableConfig.sortConfig;
    if (sortConfig && sortConfig.direction !== 'default') {
      const col = sortConfig.column as keyof BatchUnitDto;
      const dir = sortConfig.direction === 'A' ? 1 : -1;
      filtered.sort((a, b) => {
        const aVal = a[col] ?? '';
        const bVal = b[col] ?? '';
        return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
      });
    }

    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.totalRecords = filtered.length;
      const { pageIndex, pageSize } = this.tableConfig.pagination;
      const start = pageIndex * pageSize;
      this.dataSource = filtered.slice(start, start + pageSize);
    } else {
      this.dataSource = filtered;
    }

    this.tableConfig = { ...this.tableConfig };
    this.cdr.detectChanges();
  }

  private formatUnitIdWithCheckDigit(unitId: string, row: BatchUnitDto): string {
    if (!unitId) return '';
    return row.chkDigit ? `${unitId} ${row.chkDigit}` : unitId;
  }

  private formatYesNo(value: string | null): string {
    if (!value) return '-';
    const upperValue = value.toUpperCase();
    if (upperValue === 'Y') return 'Yes';
    if (upperValue === 'N') return 'No';
    return value;
  }

  private formatDateForDisplay(date: string | null): string {
    if (!date) return '';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : date;
  }

  private getErrorMessage(error: any): string {
    const apiMessage = error?.error?.message || error?.error?.error;
    if (apiMessage) return apiMessage;
    const errorCode = error?.error?.errorCode;
    if (errorCode === '1130') return 'Invalid Batch ID';
    if (errorCode === '0085') return 'No units found for this batch';
    return 'Failed to retrieve batch data';
  }

  private formatDateTimeForDisplay(dateTime: string | null): string {
    if (!dateTime) return '';
    const m = moment(dateTime);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : dateTime;
  }

  private formatTimeForDisplay(dateTime: string | null): string {
    if (!dateTime) return '';
    const m = moment(dateTime);
    return m.isValid() ? m.format('H:mm') : dateTime;
  }
}
