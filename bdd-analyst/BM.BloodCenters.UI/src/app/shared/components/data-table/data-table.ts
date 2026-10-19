import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, HostListener, TemplateRef } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule, MatTooltip } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent,
} from '@shared/interfaces/data-table.interface';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatCheckboxModule,
    TranslateModule
  ],
  templateUrl: './data-table.html',
  styleUrls: ['./data-table.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    }
  ]
})
export class DataTable<T = any> implements OnChanges {
  @Input() config!: DataTableConfig<T>;
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() keepActiveRow = false;
  @Input() highlightedRow: T | null = null;
  @Input() expandTemplate?: TemplateRef<any>;
  @Input() expandedRows = new Set<any>();
  @Input() expandRowKey?: string;
  @Input() externalSelectedIds?: Set<any>;

  @Output() pageChange = new EventEmitter<TablePageEvent>();
  @Output() sortChange = new EventEmitter<TableSortEvent>();
  @Output() rowAction = new EventEmitter<TableRowActionEvent<T>>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() rowExpandToggle = new EventEmitter<T>();
  @Output() expandAllToggle = new EventEmitter<boolean>();

  dataSource = new MatTableDataSource<T>([]);
  displayedColumns: string[] = [];
  groupHeaderColumns: { key: string; label: string; colspan: number }[] = [];
  groupHeaderColumnDefs: string[] = [];
  selectedRows: T[] = [];
  selectedIds = new Set<any>();
  isAllSelected = false;
  isAllPagesSelected = false;
  activeRow: T | null = null;
  activeMenuRow: T | null = null;

  constructor(private translate: TranslateService, private elementRef: ElementRef) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.keepActiveRow) return;
    if (this.activeRow && !this.elementRef.nativeElement.contains(event.target)) {
      this.activeRow = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['config'] && this.config) || changes['expandTemplate']) {
      this.updateDisplayedColumns();
      this.buildGroupHeaderColumns();
    }
    if (changes['externalSelectedIds'] && this.externalSelectedIds !== undefined) {
      this.selectedIds = new Set(this.externalSelectedIds);
      this.isAllPagesSelected = false;
      this.updateSelectionFromIds();
    }
    if (changes['data']) {
      this.dataSource.data = this.data || [];
      this.updateSelectionFromIds();
    }
    if (changes['highlightedRow'] && this.highlightedRow !== null) {
      this.activeRow = null;
    }
  }

  /** Returns true when table should show (has data OR showTableOnEmpty is enabled) */
  get shouldShowTable(): boolean {
    return this.dataSource.data.length > 0 || !!this.config?.showTableOnEmpty;
  }

  /** Returns true when empty state icon/message should show */
  get shouldShowEmptyState(): boolean {
    return this.dataSource.data.length === 0 && !this.config?.showTableOnEmpty;
  }

  private buildGroupHeaderColumns(): void {
    this.groupHeaderColumns = [];
    this.groupHeaderColumnDefs = [];

    if (!this.config.columnGroups || this.config.columnGroups.length === 0) return;

    const allColumns = [...this.displayedColumns];
    let i = 0;

    while (i < allColumns.length) {
      const colKey = allColumns[i];
      const group = this.config.columnGroups.find(g => g.startColumn === colKey);

      if (group) {
        const startIdx = i;
        const endIdx = allColumns.indexOf(group.endColumn);
        const colspan = endIdx - startIdx + 1;
        const groupKey = `group_${colKey}`;
        this.groupHeaderColumns.push({ key: groupKey, label: group.label, colspan });
        this.groupHeaderColumnDefs.push(groupKey);
        i = endIdx + 1;
      } else {
        const emptyKey = `empty_${colKey}`;
        this.groupHeaderColumns.push({ key: emptyKey, label: '', colspan: 1 });
        this.groupHeaderColumnDefs.push(emptyKey);
        i++;
      }
    }
  }

  getGroupHeaderColspan(key: string): number {
    const col = this.groupHeaderColumns.find(c => c.key === key);
    return col ? col.colspan : 1;
  }

  getGroupHeaderLabel(key: string): string {
    const col = this.groupHeaderColumns.find(c => c.key === key);
    return col ? col.label : '';
  }

  private updateDisplayedColumns(): void {
    this.displayedColumns = [];

    // Add expand column at the beginning if expansion is configured
    if (this.expandTemplate) {
      this.displayedColumns.push('expand');
    }

    // Add regular columns
    this.displayedColumns.push(...this.config.columns.map(col => col.key));

    // Add actions column at the end if row actions exist
    if (this.config.rowActions && this.config.rowActions.length > 0) {
      this.displayedColumns.push('actions');
    }

    if (this.config.enableSelection) {
      if (this.config.selectionPosition === 'first') {
        this.displayedColumns.unshift('select');
      } else {
        this.displayedColumns.push('select');
      }
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      previousPageIndex: event.previousPageIndex ?? 0
    });
  }


  private lastSortTimestamp = 0;

  toggleSort(column: any): void {
    if (!column.sortable) return;

    const now = Date.now();
    if (now - this.lastSortTimestamp < 50) return;
    this.lastSortTimestamp = now;

    let newDirection: 'A' | 'D' | 'default';

    if (!this.config.sortConfig || this.config.sortConfig.column !== column.key) {
      newDirection = 'A';
    } else {
      switch (this.config.sortConfig.direction) {
        case 'default':
          newDirection = 'A';
          break;
        case 'A':
          newDirection = 'D';
          break;
        case 'D':
          newDirection = 'A';  // Toggle back to ascending instead of default
          break;
        default:
          newDirection = 'A';
      }
    }

    this.sortChange.emit({
      column: column.key,
      direction: newDirection
    });
  }

  getSortIcon(column: any): string {
    if (!column.sortable) return '';

    const iconMap = this.config.sortIconMap;
    const ascIcon = iconMap?.ascending || 'arrow_upward';
    const descIcon = iconMap?.descending || 'arrow_downward';
    const defaultIcon = iconMap?.default || 'unfold_more';

    if (this.config.sortConfig?.column === column.key) {
      switch (this.config.sortConfig?.direction) {
        case 'A':
          return ascIcon;
        case 'D':
          return descIcon;
        default:
          return defaultIcon;
      }
    }

    return defaultIcon;
  }

  getSortAriaLabel(column: any): string {
    if (!column.sortable) return column.header;

    let state = 'Not sorted';
    if (this.config.sortConfig?.column === column.key) {
      switch (this.config.sortConfig?.direction) {
        case 'A':
          state = 'Sorted ascending';
          break;
        case 'D':
          state = 'Sorted descending';
          break;
      }
    }

    return `Sort by ${column.header}. ${state}`;
  }

  isSortActive(column: any): boolean {
    return this.config.sortConfig?.column === column.key &&
      this.config.sortConfig?.direction !== 'default';
  }

  onRowActionClick(action: string, row: T): void {
    // Select the row when an action button is clicked
    if (this.config?.enableRowHighlight) {
      this.activeRow = row;
    }
    this.rowAction.emit({ action, row });
  }

  isRowActionVisible(action: any, row: T): boolean {
    if (typeof action.visible === 'function') {
      return action.visible(row);
    }

    if (typeof action.show === 'function') {
      return action.show(row);
    }

    return true;
  }

  isRowActionDisabled(action: any, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  getActionAriaLabel(action: any, row: T): string {
    const ariaLabel = action.ariaLabel || action.label;

    if (!ariaLabel) {
      return '';
    }

    // Replace placeholders like {{propertyName}} with actual row values
    return ariaLabel.replace(/\{\{(\w+)\}\}/g, (_match: string, propertyName: string) => {
      const value = (row as any)[propertyName];
      return value !== null && value !== undefined ? String(value) : '';
    });
  }

  getCellValue(column: any, row: T): string {
    const value = (row as any)[column.key];

    if (column.valueFormatter) {
      const formattedValue = column.valueFormatter(value, row);
      // If valueFormatter returns empty string, null, or undefined, show '-'
      if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
        return '-';
      }
      // Check if it's a string and trim it, otherwise convert to string
      const stringValue = typeof formattedValue === 'string' ? formattedValue : String(formattedValue);
      return stringValue.trim() !== '' ? stringValue : '-';
    }

    // For raw values, show '-' if empty, null, undefined, or whitespace-only
    if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
      return '-';
    }

    return String(value);
  }

  getFooterValue(columnKey: string): string {
    if (!this.config.footerData) {
      return '';
    }
    const value = this.config.footerData[columnKey];
    return value !== null && value !== undefined && value !== '' ? String(value) : '';
  }

  getTooltipText(column: any, row: T): string | null {
    if (!column.truncate) return null;

    const value = this.getCellValue(column, row);
    const maxLength = column.truncateLength || 50;

    return value.length > maxLength ? value : null;
  }

  truncateText(column: any, row: T): string {
    const value = this.getCellValue(column, row);
    const maxLength = column.truncateLength || 50;

    if (value.length <= maxLength) {
      return value;
    }

    const truncated = value.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }

  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getRowAriaLabel(row: T, index: number): string {
    if (this.config.rowLabelKey) {
      const val = (row as any)[this.config.rowLabelKey as string];
      if (val) return `Row ${index + 1}: ${val}`;
    }
    return `Table row ${index + 1}`;
  }

  hasIconActions(): boolean {
    if (!this.config.rowActions || this.config.rowActions.length === 0) {
      return false;
    }
    return this.config.rowActions.some(action => action.icon || action.iconSvg);
  }

  shouldUseMenu(): boolean {
    if (!this.config.rowActions || this.config.rowActions.length === 0) {
      return false;
    }
    // Use menu when there are multiple actions and none have icons
    return this.config.rowActions.length > 1 && !this.hasIconActions();
  }

  toggleSelectAll(): void {
    if (this.isAllPagesSelected || this.isAllSelected) {
      // Clear all selections
      this.selectedIds.clear();
      this.selectedRows = [];
      this.isAllSelected = false;
      this.isAllPagesSelected = false;
    } else {
      // Select all items across all pages
      this.isAllPagesSelected = true;
      this.isAllSelected = true;

      // Add selectable items to selected IDs
      const selectableRows = this.data.filter(row => this.isRowSelectable(row));
      selectableRows.forEach(row => {
        const id = this.getRowId(row);
        if (id !== undefined) {
          this.selectedIds.add(id);
        }
      });

      this.selectedRows = [...selectableRows];
    }
    this.selectionChange.emit(this.selectedRows);
  }

  toggleRowSelection(row: T): void {
    const id = this.getRowId(row);

    if (id === undefined) {
      // Fallback to object reference if no selection key is configured
      const index = this.selectedRows.indexOf(row);
      if (index > -1) {
        this.selectedRows.splice(index, 1);
      } else {
        this.selectedRows.push(row);
      }
    } else {
      // Use ID-based selection
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
        const index = this.selectedRows.findIndex(r => this.getRowId(r) === id);
        if (index > -1) {
          this.selectedRows.splice(index, 1);
        }
      } else {
        this.selectedIds.add(id);
        this.selectedRows.push(row);
      }
    }

    this.updateSelectionState();
    this.selectionChange.emit(this.selectedRows);
  }

  isRowSelectable(row: T): boolean {
    return this.config.isRowSelectable ? this.config.isRowSelectable(row) : true;
  }

  isRowSelected(row: T): boolean {
    const id = this.getRowId(row);
    if (id !== undefined && this.config.selectionKey) {
      return this.selectedIds.has(id);
    }
    return this.selectedRows.includes(row);
  }

  private getRowId(row: T): any {
    if (!this.config.selectionKey) {
      return undefined;
    }
    return (row as any)[this.config.selectionKey];
  }

  private updateSelectionFromIds(): void {
    if (!this.config || !this.config.selectionKey) {
      return;
    }

    if (this.isAllPagesSelected) {
      // When all pages are selected, automatically add current page items to selectedIds
      this.data.forEach(row => {
        const id = this.getRowId(row);
        if (id !== undefined) {
          this.selectedIds.add(id);
        }
      });
      this.selectedRows = [...this.data];
    } else {
      // Rebuild selectedRows from current page data based on selectedIds
      this.selectedRows = this.data.filter(row => {
        const id = this.getRowId(row);
        return id !== undefined && this.selectedIds.has(id);
      });
    }

    this.updateSelectionState();
  }

  private updateSelectionState(): void {
    const totalRecords = this.config.pagination?.totalRecords || this.data.length;
    this.isAllSelected = this.selectedRows.length === this.data.length && this.data.length > 0;
    this.isAllPagesSelected = this.selectedIds.size === totalRecords && totalRecords > 0;
  }

  onRowClick(row: T): void {
    if (this.config.enableRowHighlight !== false) {
      this.activeRow = this.activeRow === row ? null : row;
    }
    this.rowClick.emit(row);
  }

  isRowActive(row: T): boolean {
    if (this.highlightedRow !== null) {
      return this.highlightedRow === row || this.selectedRows.includes(row) || this.activeMenuRow === row;
    }
    return this.activeRow === row || this.selectedRows.includes(row) || this.activeMenuRow === row;
  }

  onMenuOpened(row: T): void {
    this.activeMenuRow = row;
  }

  onMenuClosed(): void {
    this.activeMenuRow = null;
  }

  isMenuActive(row: T): boolean {
    return this.activeMenuRow === row;
  }

  toggleRowExpand(event: Event, row: T): void {
    event.stopPropagation();
    this.rowExpandToggle.emit(row);
  }

  isRowExpanded(row: T): boolean {
    if (!this.expandRowKey) return this.expandedRows.has(row);
    return this.expandedRows.has((row as any)[this.expandRowKey]);
  }

  get allRowsExpanded(): boolean {
    const data = this.dataSource.data;
    return data.length > 0 && this.expandedRows.size >= data.length;
  }

  toggleExpandAll(event: Event): void {
    event.stopPropagation();
    this.expandAllToggle.emit(!this.allRowsExpanded);
  }
}