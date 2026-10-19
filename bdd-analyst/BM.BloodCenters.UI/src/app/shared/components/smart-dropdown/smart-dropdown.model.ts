import { Observable } from 'rxjs';

export interface DropdownItem {
  code: string;
  description: string;
}

export interface DropdownPage {
  items: DropdownItem[];
  totalCount: number;
  hasMore: boolean;
  isPaginated: boolean;
}

export type DropdownFetchFn = (
  search: string,
  skip: number,
  take: number,
  includeSelected?: string[]
) => Observable<DropdownPage>;

export type SelectionMode = 'individual' | 'all' | 'all-except';

export interface DropdownSelectionState {
  mode: SelectionMode;
  selectedCodes: Set<string>;
  excludedCodes: Set<string>;
  searchContext: string | null;
}
