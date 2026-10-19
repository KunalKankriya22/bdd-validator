import { Observable } from 'rxjs';
import { TableColumn } from '@shared/interfaces/data-table.interface';
import { SearchBarConfig } from '../search-bar/search-bar';

/**
 * Configuration for Generic Lookup Dialog
 *
 * @template T The type of data items being displayed in the lookup
 */
export interface LookupDialogConfig<T> {
  /**
   * Dialog title displayed in the header
   * Example: "Select HLA/RBC Request", "Select Test", "Select Donor"
   */
  title: string;

  /**
   * Table columns configuration
   * Defines which fields to display, headers, widths, sorting, formatters
   */
  columns: TableColumn[];

  /**
   * Data source for the lookup
   * Can be a static array or an Observable that emits the data
   */
  data: T[] | Observable<T[]>;

  /**
   * Selection mode
   * - 'single': User can select only one item
   * - 'multi': User can select multiple items (with checkboxes)
   */
  selectionMode: 'single' | 'multi';

  /**
   * Key property used to uniquely identify each item
   * Used for tracking selections and row highlighting
   */
  selectionKey: keyof T;

  /**
   * Fields to search when user types in the search bar
   * If not provided, search is disabled
   * Example: ['requestId', 'patientName', 'hospitalName']
   */
  searchFields?: (keyof T)[];

  /**
   * Search bar configuration
   * Optional - if not provided, uses default search config
   */
  searchConfig?: Partial<SearchBarConfig>;

  /**
   * Enable pagination
   * Default: true
   */
  enablePagination?: boolean;

  /**
   * Page size options for pagination
   * Default: [10, 25, 50]
   */
  pageSizeOptions?: number[];

  /**
   * Default page size
   * Default: 10
   */
  defaultPageSize?: number;

  /**
   * Custom value formatters for specific columns
   * Key is the column key, value is a formatter function
   * Example: { insertDate: (value) => formatDateTime(value) }
   */
  formatters?: Record<string, (value: any) => string>;

  /**
   * Default sort column
   * Optional - if not provided, no default sorting
   */
  defaultSortColumn?: string;

  /**
   * Default sort direction
   * Optional - if not provided, defaults to 'A' (ascending)
   */
  defaultSortDirection?: 'A' | 'D' | 'default';

  /**
   * Empty message when no data is available
   * Default: "No data found"
   */
  emptyMessage?: string;

  /**
   * Loading message while data is being fetched
   * Default: "Loading..."
   */
  loadingMessage?: string;

  /**
   * Initial search term to pre-fill the search bar
   * The lookup will automatically filter results on open
   */
  initialSearchTerm?: string;

  /**
   * Width of the dialog
   * Default: '900px'
   */
  width?: string;

  /**
   * Height of the dialog
   * Default: '650px'
   */
  height?: string;
}

/**
 * Result returned when dialog is closed
 * Contains the selected item(s) or null if cancelled
 */
export interface LookupDialogResult<T> {
  /**
   * Selected item (for single selection mode)
   */
  selectedItem?: T;

  /**
   * Selected items (for multi selection mode)
   */
  selectedItems?: T[];

  /**
   * Whether the dialog was cancelled
   */
  cancelled: boolean;
}
