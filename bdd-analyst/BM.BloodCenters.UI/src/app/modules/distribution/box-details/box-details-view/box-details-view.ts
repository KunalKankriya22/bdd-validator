import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { BoxDetailsService } from '../services/box-details.service';
import { BoxDetails, BoxProduct } from '../models/box-details.model';

/**
 * Box Details View Component
 * JIRA: MLT-14101
 * Oracle Form: SHQBOXDT (BOXDTQ)
 * Displays detailed box information and products
 */
@Component({
  selector: 'app-box-details-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    DataTable,
    SearchBar,
  ],
  templateUrl: './box-details-view.html',
  styleUrls: ['./box-details-view.scss'],
})
export class BoxDetailsViewComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly boxDetailsService = inject(BoxDetailsService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly boxDetails = signal<BoxDetails | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  // Products filtering
  private searchText = '';
  protected readonly paginatedProducts = signal<BoxProduct[]>([]);
  private filteredProducts: BoxProduct[] = [];

  // Sorting
  private productSortColumn: string | undefined = 'UnitId';
  private productSortOrder: 'ASC' | 'DESC' | undefined = 'DESC';

  // Table configuration
  productsTableConfig!: DataTableConfig<BoxProduct>;

  // Search configuration
  productSearchConfig: SearchBarConfig = {
    placeholder: 'Search By Unit ID',
    minLength: 1,
    searchOnEnterOnly: false,
  };

  // Parent title from menu for breadcrumb
  protected readonly parentTitle = computed<string>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return pageData?.title || 'Distribution Box Management';
  });

  ngOnInit(): void {
    this.initProductsTableConfig();
    this.loadBoxDetails();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initProductsTableConfig(): void {
    this.productsTableConfig = {
      columns: [
        {
          key: 'unitId',
          header: 'Unit ID',
          width: '160px',
          sortable: true,
          valueFormatter: (value: string, row: BoxProduct) =>
            row.checkDigit ? `${value} ${row.checkDigit}` : value,
        },
        {
          key: 'collectionDate',
          header: 'Collection Date',
          width: '130px',
          sortable: false,
          valueFormatter: (value: string) =>
            value ? moment(value).format('DD-MMM-YYYY').toUpperCase() : '',
        },
        {
          key: 'productCode',
          header: 'Product',
          width: '100px',
          sortable: false,
        },
        {
          key: 'bloodTypeDescription',
          header: 'ABO/Rh',
          width: '100px',
          sortable: false,
        },
        {
          key: 'expirationDate',
          header: 'Expiration Date',
          width: '140px',
          sortable: false,
          valueFormatter: (value: string) =>
            value ? moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase() : '',
        },
        {
          key: 'pickSlipId',
          header: 'Pick Slip',
          width: '130px',
          sortable: false,
        },
        {
          key: 'productStatus',
          header: 'Status',
          width: '80px',
          sortable: false,
          valueFormatter: (value: string | null) => this.formatProductStatus(value),
        },
      ],
      stickyHeader: true,
      showPagination: false,
      emptyMessage: 'No products in this box',
      noDataIcon: 'inventory_2',
      enableRowHighlight: false,
      sortConfig: {
        column: 'unitId',
        direction: 'D',
      },
    };
  }

  private updateUnitIdHeader(count: number): void {
    if (this.productsTableConfig?.columns?.[0]) {
      this.productsTableConfig.columns[0].header = `Unit ID (${count})`;
    }
  }

  private loadBoxDetails(): void {
    const boxId = this.route.snapshot.paramMap.get('boxId');

    if (!boxId) {
      this.error.set('Box ID is required.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.boxDetailsService
      .getBoxDetails(boxId, this.productSortColumn, this.productSortOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (box) => {
          this.boxDetails.set(box);
          this.updateUnitIdHeader(box.products.length);
          this.updatePaginatedProducts();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading box details:', err);
          if (err.status === 404) {
            this.error.set(`Box '${boxId}' not found.`);
          } else {
            this.error.set('Failed to load box details. Please try again.');
          }
          this.snackbarService.showError(this.error() || 'An error occurred');
          this.loading.set(false);
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.goBack();
      });
  }

  private updatePaginatedProducts(): void {
    const box = this.boxDetails();
    if (!box) {
      this.paginatedProducts.set([]);
      this.filteredProducts = [];
      return;
    }

    // Filter products by search text
    if (this.searchText) {
      this.filteredProducts = box.products.filter(p =>
        p.unitId.toLowerCase().includes(this.searchText.toLowerCase())
      );
    } else {
      this.filteredProducts = box.products;
    }

    // Show all filtered products (no pagination)
    this.paginatedProducts.set(this.filteredProducts);
  }

  onProductSearch(searchText: string): void {
    this.searchText = searchText?.trim() || '';
    this.updatePaginatedProducts();
  }

  onSortChange(event: TableSortEvent): void {
    if (this.productsTableConfig.sortConfig) {
      this.productsTableConfig.sortConfig.column = event.column;
      this.productsTableConfig.sortConfig.direction = event.direction;
    }

    if (event.direction === 'default') {
      this.productSortColumn = undefined;
      this.productSortOrder = undefined;
    } else {
      this.productSortColumn = 'UnitId';
      this.productSortOrder = event.direction === 'A' ? 'ASC' : 'DESC';
    }

    this.loadBoxDetails();
  }

  private formatProductStatus(status: string | null): string {
    if (!status) return '';
    const statusMap: Record<string, string> = {
      'PK': 'Packed',
      'AV': 'Available',
      'O': 'Open',
      'CL': 'Closed',
      'RD': 'Ready',
    };
    return statusMap[status] || status;
  }

  goBack(): void {
    this.router.navigate(['/distribution/box-details']);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    return moment(value).format('DD-MMM-YYYY HH:mm').toUpperCase();
  }

  formatTemperature(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return `${value}°C`;
  }

  formatValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }
}
