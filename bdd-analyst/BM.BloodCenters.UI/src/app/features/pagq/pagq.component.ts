import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { Sort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';

import { PagqSearchFormComponent } from './components/pagq-search-form/pagq-search-form.component';

import { ProductsWithAntigensService } from './services/products-with-antigens.service';
import {
  ProductAntigenSearchRequest,
  ProductAntigenSearchResult
} from './models/products-with-antigens.models';
import { LoggingService } from '@shared/services/logging.service';

@Component({
  selector: 'app-pagq',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    PagqSearchFormComponent
  ],
  templateUrl: './pagq.component.html',
  styleUrl: './pagq.component.scss'
})
export class PagqComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `pagq-${PagqComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly service = inject(ProductsWithAntigensService);
  private readonly loggingService = inject(LoggingService);
  private readonly pageHeaderService = inject(PageHeaderService);

  protected readonly results = signal<ProductAntigenSearchResult[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalCount = signal<number>(0);
  protected readonly pageSize = signal<number>(25);
  protected readonly pageIndex = signal<number>(0);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly selectedRow = signal<ProductAntigenSearchResult | null>(null);

  displayedColumns: string[] = ['unitId', 'productCode', 'aboRhType', 'expirationDate', 'warehouseId'];

  private currentSearchRequest: ProductAntigenSearchRequest | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ]
  };

  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ]
        };
      }
    });
  }

  ngOnInit(): void {
    // Component initialized - no auto-search, user must submit search form
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(searchRequest: ProductAntigenSearchRequest): void {
    this.currentSearchRequest = {
      ...searchRequest,
      take: this.pageSize()
    };
    this.pageIndex.set(0);
    this.hasSearched.set(true);
    this.executeSearch(this.currentSearchRequest);
  }

  onClear(): void {
    this.currentSearchRequest = null;
    this.results.set([]);
    this.totalCount.set(0);
    this.pageIndex.set(0);
    this.error.set(null);
    this.hasSearched.set(false);
    this.selectedRow.set(null);
  }

  onPageChange(event: PageEvent): void {
    if (!this.currentSearchRequest) return;

    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);

    const updatedRequest: ProductAntigenSearchRequest = {
      ...this.currentSearchRequest,
      take: event.pageSize,
      skip: event.pageIndex * event.pageSize
    };

    this.executeSearch(updatedRequest);
  }

  onSortChange(sort: Sort): void {
    if (!this.currentSearchRequest) return;

    const sortColumn = sort.active as 'UnitId' | 'ExpirationDate' | 'ProductCode' | null;
    const sortOrder = sort.direction === '' ? null : (sort.direction.toUpperCase() as 'ASC' | 'DESC');

    const updatedRequest: ProductAntigenSearchRequest = {
      ...this.currentSearchRequest,
      sortColumn: sortColumn,
      sortOrder: sortOrder,
      skip: 0
    };

    this.pageIndex.set(0);
    this.executeSearch(updatedRequest);
  }

  onRowSelect(row: ProductAntigenSearchResult): void {
    if (this.selectedRow()?.unitId === row.unitId) {
      this.selectedRow.set(null);
    } else {
      this.selectedRow.set(row);
    }
  }

  isSelected(row: ProductAntigenSearchResult): boolean {
    return this.selectedRow()?.unitId === row.unitId;
  }

  getAntigenResultLabel(result: string): string {
    switch (result?.toUpperCase()) {
      case 'P':
      case 'POSITIVE':
        return 'Positive';
      case 'N':
      case 'NEGATIVE':
        return 'Negative';
      case 'R':
      case 'REACTIVE':
        return 'Reactive';
      case 'NT':
        return 'Not Tested';
      default:
        return result || '-';
    }
  }

  private executeSearch(request: ProductAntigenSearchRequest): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedRow.set(null);

    this.service.searchProducts(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.results.set(response.results || []);
          this.totalCount.set(response.totalCount || 0);
          this.loading.set(false);

          this.loggingService.log('Products with Antigens search completed', {
            resultsCount: response.results?.length || 0,
            totalCount: response.totalCount || 0
          });
        },
        error: (err) => {
          this.loggingService.error('Error searching products with antigens', err);
          this.error.set(this.getErrorMessage(err));
          this.results.set([]);
          this.totalCount.set(0);
          this.loading.set(false);
        }
      });
  }

  private getErrorMessage(error: any): string {
    const errorCode = error?.error?.errorCode || error?.errorCode;

    const errorMessages: Record<string, string> = {
      '0322': 'Invalid product type selected.',
      '0300': 'Invalid blood type for the current chapter.',
      '5307': 'Invalid inventory class selected.',
      '1105': 'Invalid antigen group selected.',
      '0350': 'Invalid warehouse ID selected.',
      '2201': 'Duplicate antigen specified. Each antigen can only appear once.',
      '0320': 'Invalid antigen ID selected.',
      '1316': 'Antigen result must be either Positive (P) or Negative (N).',
      '5340': 'At least one antigen must be specified in the search criteria.',
      '5200': 'Result is required for each antigen entered.'
    };

    if (errorCode && errorMessages[errorCode]) {
      return errorMessages[errorCode];
    }

    return error?.error?.message || error?.message || 'An error occurred while searching. Please try again.';
  }
}
