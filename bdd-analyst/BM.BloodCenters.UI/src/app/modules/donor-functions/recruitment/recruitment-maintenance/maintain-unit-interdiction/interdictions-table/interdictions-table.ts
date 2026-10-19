import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UnitInterdiction } from '../models/unit-interdiction.model';

class CustomPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Rows per page:';
}

export interface InterdictionTableAction {
  type: 'terminate' | 'release';
  interdiction: UnitInterdiction;
}

@Component({
  selector: 'app-interdictions-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }
  ],
  templateUrl: './interdictions-table.html',
  styleUrls: ['./interdictions-table.scss']
})
export class InterdictionsTableComponent implements OnInit, OnChanges {
  @Input() dataSource: UnitInterdiction[] = [];
  @Input() isLoading = false;
  @Input() totalRecords = 0;
  @Input() pageSize = 25;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() highlightedRow: UnitInterdiction | null = null;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() actionClick = new EventEmitter<InterdictionTableAction>();

  displayedColumns: string[] = [
    'code',
    'description',
    'type',
    'effectiveDate',
    'terminationDate',
    'releaseDate',
    'userId',
    'originated',
    'reason',
    'groupMode',
    'groupId',
    'actions'
  ];

  activeMenuRow: UnitInterdiction | null = null;
  currentSortDirection: 'asc' | 'desc' | '' = '';

  ngOnInit(): void {
    // Component initialization
  }

  getSortIcon(): string {
    if (this.currentSortDirection === 'asc') {
      return 'arrow_upward';
    } else if (this.currentSortDirection === 'desc') {
      return 'arrow_downward';
    }
    return 'unfold_more';
  }

  onCodeSort(): void {
    if (this.currentSortDirection === '') {
      this.currentSortDirection = 'asc';
    } else if (this.currentSortDirection === 'asc') {
      this.currentSortDirection = 'desc';
    } else {
      this.currentSortDirection = 'asc';
    }

    this.sortChange.emit({
      active: 'code',
      direction: this.currentSortDirection
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSource']) {
      // Handle data source changes
    }
  }

  onMenuOpened(row: UnitInterdiction): void {
    this.activeMenuRow = row;
  }

  onMenuClosed(): void {
    this.activeMenuRow = null;
  }

  isMenuActive(row: UnitInterdiction): boolean {
    return this.activeMenuRow === row;
  }

  isRowActive(row: UnitInterdiction): boolean {
    return this.activeMenuRow === row || this.highlightedRow === row;
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onTerminate(interdiction: UnitInterdiction): void {
    this.actionClick.emit({ type: 'terminate', interdiction });
  }

  onRelease(interdiction: UnitInterdiction): void {
    this.actionClick.emit({ type: 'release', interdiction });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
}
