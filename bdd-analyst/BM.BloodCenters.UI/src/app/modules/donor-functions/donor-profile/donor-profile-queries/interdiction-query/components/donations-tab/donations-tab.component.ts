import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { DonationRecord } from '../../models/interdiction-query.model';

export interface Sort {
  active: string;
  direction: 'asc' | 'desc' | '';
}

export type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-donations-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './donations-tab.component.html',
  styleUrls: ['./donations-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonationsTabComponent implements OnChanges {

  @Input() donations: DonationRecord[] = [];
  @Input() expandedRows: Set<string> = new Set<string>();
  @Input() optionType: 'Interdiction' | 'Hold' = 'Interdiction';
  @Input() currentSort: Sort | null = null;
  @Input() loading = false;
  @Input() highlightedRow: DonationRecord | null = null;

  @Output() toggleRow = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() expandAll = new EventEmitter<void>();
  @Output() collapseAll = new EventEmitter<void>();
  @Output() otherHolds = new EventEmitter<string>();
  @Output() donorInformation = new EventEmitter<string>();

  // Track which row's menu is currently open
  activeMenuRow: DonationRecord | null = null;

  get allExpanded(): boolean {
    if (this.donations.length === 0) return false;
    return this.donations.every(donation => this.expandedRows.has(donation.unitId));
  }

  get someExpanded(): boolean {
    return this.donations.some(donation => this.expandedRows.has(donation.unitId));
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset is handled by parent component
  }

  getSortIcon(columnKey: string): string {
    if (!this.currentSort || this.currentSort.active !== columnKey) {
      return 'unfold_more';
    }
    return this.currentSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  getAriaSortValue(columnKey: string): 'ascending' | 'descending' | 'none' {
    if (!this.currentSort || this.currentSort.active !== columnKey) {
      return 'none';
    }
    return this.currentSort.direction === 'asc' ? 'ascending' : 'descending';
  }

  getSortButtonLabel(columnName: string, columnKey: string): string {
    if (!this.currentSort || this.currentSort.active !== columnKey) {
      return `Sort by ${columnName}`;
    }
    const direction = this.currentSort.direction === 'asc' ? 'ascending' : 'descending';
    return `Sort by ${columnName}, currently sorted ${direction}`;
  }

  onToggleSort(columnKey: string): void {
    let newDirection: SortDirection = 'desc';

    if (this.currentSort && this.currentSort.active === columnKey) {
      // Toggle between asc and desc
      newDirection = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    }

    const sortEvent: Sort = {
      active: columnKey,
      direction: newDirection
    };

    this.sortChange.emit(sortEvent);
  }

  // Columns for Interdiction option
  interdictionColumns: string[] = [
    'expand',
    'unitId',
    'collectionDate',
    'donationType',
    'procedureCode',
    'interdiction',
    'effectiveDate',
    'terminationDate',
    'releaseDate',
    'releaseUser',
    'origin',
    'reason'
  ];

  // Columns for Hold option - simpler table per Figma
  holdColumns: string[] = [
    'unitId',
    'collectionDate',
    'driveId',
    'effectiveDate',
    'terminationDate',
    'actions'
  ];

  get donationsColumns(): string[] {
    return this.optionType === 'Hold' ? this.holdColumns : this.interdictionColumns;
  }

  isRowExpanded(unitId: string): boolean {
    return this.expandedRows.has(unitId);
  }

  onToggleRow(unitId: string): void {
    this.toggleRow.emit(unitId);
  }

  onToggleAllRows(): void {
    if (this.allExpanded) {
      this.collapseAll.emit();
    } else {
      this.expandAll.emit();
    }
  }

  /**
   * Display value with fallback to '-' for empty values
   */
  displayValue(value: any): string {
    if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
      return '-';
    }
    return String(value);
  }

  /**
   * Handle Other Holds menu action
   */
  onOtherHolds(unitId: string): void {
    this.otherHolds.emit(unitId);
  }

  /**
   * Handle Donor Information menu action
   */
  onDonorInformation(donorId: string): void {
    this.donorInformation.emit(donorId);
  }

  /**
   * Handle menu opened event - track which row's menu is open
   */
  onMenuOpened(row: DonationRecord): void {
    this.activeMenuRow = row;
  }

  /**
   * Handle menu closed event - clear active menu row
   */
  onMenuClosed(): void {
    this.activeMenuRow = null;
  }

  /**
   * Check if a row's menu is currently active
   */
  isMenuActive(row: DonationRecord): boolean {
    return this.activeMenuRow === row;
  }

  /**
   * Check if a row should be highlighted (menu is open OR other holds panel is open for this row)
   * Matches the pattern from distribution-master-codes and shared data-table
   */
  isRowHighlighted(row: DonationRecord): boolean {
    return this.activeMenuRow === row || this.highlightedRow === row;
  }

}
