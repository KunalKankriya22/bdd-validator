import { TemplateRef } from '@angular/core';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  headerIcon?: string; // Material icon name to display instead of text
  headerTooltip?: string; // Tooltip shown on an info icon next to the header text
  sortable?: boolean;
  sticky?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  type?: 'text' | 'number' | 'date' | 'custom';
  truncate?: boolean;
  truncateLength?: number;
  cellTemplate?: TemplateRef<any>;
  valueFormatter?: (value: any, row: T) => string;
  headerClass?: string;
  cellClass?: string;
}

export interface RowAction<T = any> {
  icon?: string;
  iconSvg?: string;
  label?: string;
  ariaLabel?: string;
  color?: 'default' | 'primary' | 'accent' | 'warn';
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  action: string;

}

export interface PaginationConfig {
  pageSize: number;
  pageIndex: number;
  totalRecords: number;
  pageSizeOptions: number[];
  showFirstLastButtons?: boolean;
}

export interface SortConfig {
  column: string;
  direction: 'A' | 'D' | 'default';
}

export interface SortIconMap {
  ascending?: string;
  descending?: string;
  default?: string;
}

export interface ColumnGroup {
  label: string;
  startColumn: string; // key of the first column in the group
  endColumn: string;   // key of the last column in the group
}

export interface DataTableConfig<T = any> {
  columns: TableColumn<T>[];
  columnGroups?: ColumnGroup[];
  rowActions?: RowAction<T>[];
  pagination?: PaginationConfig;
  sortConfig?: SortConfig;
  sortIconMap?: SortIconMap;
  stickyHeader?: boolean;
  stickyActionsColumn?: boolean;
  showActionsAsMenu?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  loadingMessage?: string;
  noDataIcon?: string;
  showPagination?: boolean;
  menuPanelClass?: string;
  enableSelection?: boolean;
  selectionPosition?: 'first' | 'last';
  isRowSelectable?: (row: T) => boolean;
  selectionKey?: keyof T;
  showFooter?: boolean;
  stickyFooter?: boolean;
  footerData?: { [key: string]: any };
  /** When true, shows table header with empty row instead of icon+message when no data */
  showTableOnEmpty?: boolean;
  enableRowHighlight?: boolean; // default true — set false to disable click highlight
  /** When true, hides the expand-all toggle button from the expand column header */
  hideExpandAllInHeader?: boolean;
  /** When true, hides the column header row */
  hideHeader?: boolean;
  actionsColumnHeader?: string;
  hideActionsTooltip?: boolean;
  /** WCAG: descriptive caption announced by screen readers (overrides generic "Data table with N records") */
  caption?: string;
  /** WCAG: row key used to build a meaningful row aria-label (e.g. 'productType' → "Row 1: RBC") */
  rowLabelKey?: keyof T;
}


export interface TablePageEvent {
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
}

export interface TableSortEvent {
  column: string;
  direction: 'A' | 'D' | 'default';
}

export interface TableRowActionEvent<T = any> {
  action: string;
  row: T;
}   