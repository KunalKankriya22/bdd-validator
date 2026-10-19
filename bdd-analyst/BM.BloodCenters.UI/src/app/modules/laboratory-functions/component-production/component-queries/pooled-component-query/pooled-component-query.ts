import { Component, ChangeDetectionStrategy, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { PooledComponentQueryApiService } from './services/pooled-component-query-api.service';
import { PooledComponentDto, PooledComponentUnitDto, PooledComponentLookupDto } from './models/pooled-component-query.model';

@Component({
  selector: 'app-pooled-component-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    PageHeaderWithBreadcrumb,
    DataTable,
  ],
  templateUrl: './pooled-component-query.html',
  styleUrl: './pooled-component-query.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PooledComponentQueryComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(PooledComponentQueryApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  poolIdControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
    title: '',
    subtitle: '',
    actions: [],
  };

  readonly isLoading = signal(false);
  readonly hasResults = signal(false);
  readonly poolHeader = signal<PooledComponentDto | null>(null);
  readonly poolUnits = signal<PooledComponentUnitDto[]>([]);
  readonly allPools = signal<PooledComponentLookupDto[]>([]);
  readonly filteredPools = signal<PooledComponentLookupDto[]>([]);

  private readonly unitColumns: TableColumn<PooledComponentUnitDto>[] = [
    { key: 'unitId', header: 'Unit ID', sortable: false, width: '220px', minWidth: '180px', valueFormatter: (v: string, row: PooledComponentUnitDto) => row.checkDigit ? `${v}-${row.checkDigit}` : v },
    { key: 'productCode', header: 'Product Code', sortable: false, width: '140px', minWidth: '120px' },
    { key: 'productDescription', header: 'Description', sortable: false, width: '300px', minWidth: '200px', truncate: true },
    { key: 'componentPrefix', header: 'Sequence Number', sortable: false, width: '150px', minWidth: '120px' },
    { key: 'expiryDate', header: 'Expiration Date', sortable: false, width: '180px', minWidth: '150px', valueFormatter: (v: string) => this.formatDateTimeValue(v) },
    { key: 'aboRhDescription', header: 'SLD', sortable: false, width: '100px', minWidth: '80px' },
  ];

  unitsTableConfig: DataTableConfig<PooledComponentUnitDto> = {
    columns: this.unitColumns,
    showPagination: true,
    pagination: { pageSize: 25, pageIndex: 0, totalRecords: 0, pageSizeOptions: [10, 25, 50, 100] },
    sortConfig: { column: 'unitId', direction: 'default' },
    stickyHeader: true,
    noDataIcon: 'edit',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || '', link: null },
          ],
          title: pageData.title || '',
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadPoolList();

    this.poolIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const keyword = (typeof value === 'string' ? value.trim() : '').toUpperCase();
        if (!keyword) {
          this.filteredPools.set(this.allPools());
          return;
        }
        this.filteredPools.set(
          this.allPools().filter((p) =>
            p.poolId.toUpperCase().includes(keyword) ||
            (p.patientLastName?.toUpperCase().includes(keyword)) ||
            (p.patientFirstName?.toUpperCase().includes(keyword))
          )
        );
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearResults();
        this.loadPoolList();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPoolIdKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      this.searchPool();
    }
  }

  onPoolSelected(poolId: string): void {
    this.poolIdControl.setValue(poolId, { emitEvent: false });
    this.searchPool();
  }

  private loadPoolList(): void {
    this.apiService.searchPools({}, 1000, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result?.success && result.data) {
          this.allPools.set(result.data);
          this.filteredPools.set(result.data);
        }
      });
  }

  searchPool(): void {
    const poolId = this.poolIdControl.value.trim();
    if (!poolId) {
      this.poolIdControl.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.hasResults.set(false);

    forkJoin({
      header: this.apiService.getPoolHeader(poolId),
      units: this.apiService.getPoolUnits(poolId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ header, units }) => {
          this.isLoading.set(false);

          if (header.success && header.data && header.data.length > 0) {
            const pool = header.data[0];
            this.poolHeader.set(pool);

            const unitList = units.success && units.data ? units.data : [];
            this.poolUnits.set(unitList);

            this.updateUnitColumnHeader(pool.totalComponentCount);
            this.unitsTableConfig = {
              ...this.unitsTableConfig,
              pagination: {
                ...this.unitsTableConfig.pagination!,
                totalRecords: unitList.length,
                pageIndex: 0,
              },
            };

            this.hasResults.set(true);
          } else {
            this.snackbarService.showError(header.message || 'Invalid Pool ID');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Invalid Pool ID')
          );
        },
      });
  }

  clearResults(): void {
    this.poolIdControl.reset();
    this.poolHeader.set(null);
    this.poolUnits.set([]);
    this.hasResults.set(false);
    this.isLoading.set(false);
    this.updateUnitColumnHeader(0);
    this.unitsTableConfig = {
      ...this.unitsTableConfig,
      pagination: { ...this.unitsTableConfig.pagination!, totalRecords: 0, pageIndex: 0 },
    };
  }

  onPageChange(event: TablePageEvent): void {
    this.unitsTableConfig = {
      ...this.unitsTableConfig,
      pagination: {
        ...this.unitsTableConfig.pagination!,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      },
    };
  }

  onSortChange(event: TableSortEvent): void {
    this.unitsTableConfig = {
      ...this.unitsTableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
  }

  formatDateTimeValue(dateString: string): string {
    if (!dateString) return '-';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '-';
  }

  private updateUnitColumnHeader(count: number): void {
    const updatedColumns = this.unitColumns.map((col) =>
      col.key === 'unitId' ? { ...col, header: `Unit ID (${count})` } : col
    );
    this.unitsTableConfig = { ...this.unitsTableConfig, columns: updatedColumns };
  }
}
