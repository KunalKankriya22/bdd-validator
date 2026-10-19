import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  ProductAntigenSearchResult,
  UnitAntigenDetail
} from '../../models/products-with-antigens.models';

@Component({
  selector: 'app-pagq-results-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './pagq-results-table.component.html',
  styleUrl: './pagq-results-table.component.scss'
})
export class PagqResultsTableComponent implements OnChanges {
  private static nextId = 0;
  protected readonly componentId = `pagq-results-table-${PagqResultsTableComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @Input() results: ProductAntigenSearchResult[] = [];
  @Input() loading = false;
  @Input() totalCount = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() rowSelect = new EventEmitter<ProductAntigenSearchResult | null>();

  dataSource = new MatTableDataSource<ProductAntigenSearchResult>([]);

  displayedColumns: string[] = [
    'unitId',
    'productCode',
    'aboRhType',
    'expirationDate',
    'warehouseId'
  ];

  protected readonly selectedRow = signal<ProductAntigenSearchResult | null>(null);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly isEmpty = signal<boolean>(true);
  protected readonly isLoading = signal<boolean>(false);

  pageSizeOptions = [10, 25, 50, 100];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading']) {
      this.isLoading.set(this.loading);
    }
    if (changes['results']) {
      this.dataSource.data = this.results || [];
      this.isEmpty.set(!this.results || this.results.length === 0);
      if (this.results && this.results.length > 0) {
        this.hasSearched.set(true);
      }
      // Clear selection when results change
      this.selectedRow.set(null);
    }
    if (changes['totalCount'] && this.totalCount > 0) {
      this.hasSearched.set(true);
    }
  }

  onRowSelect(row: ProductAntigenSearchResult): void {
    if (this.selectedRow()?.unitId === row.unitId) {
      // Deselect if clicking the same row
      this.selectedRow.set(null);
      this.rowSelect.emit(null);
    } else {
      this.selectedRow.set(row);
      this.rowSelect.emit(row);
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';

      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
      return '-';
    }
  }

  getConfirmedAntigens(row: ProductAntigenSearchResult): UnitAntigenDetail[] {
    if (!row?.antigenProfile) return [];
    return row.antigenProfile;
  }

  hasData(): boolean {
    return !this.isEmpty() && !this.isLoading() && this.hasSearched();
  }

  getAntigenIconClass(antigen: UnitAntigenDetail): string {
    const result = antigen.result?.toUpperCase();
    if (result === 'P' || result === 'POSITIVE') {
      return 'positive';
    } else if (result === 'N' || result === 'NEGATIVE') {
      return 'negative';
    } else {
      return 'not-tested';
    }
  }

  getAntigenInitial(antigenId: string): string {
    return antigenId ? antigenId.charAt(0).toUpperCase() : '?';
  }

  trackByAntigenId(index: number, antigen: UnitAntigenDetail): string {
    return antigen.antigenId;
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
}
