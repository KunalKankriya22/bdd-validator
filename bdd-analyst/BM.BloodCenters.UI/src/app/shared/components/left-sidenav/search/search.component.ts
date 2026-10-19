import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UI, UI_META } from '../../../../core/constants/ui.constants';
import { MenuItem } from '../../../services/menu.service';
import { MenuTextFormatPipe } from '../../../pipes/menu-text-format.pipe';

export interface SearchResult {
  item: MenuItem;
  breadcrumb: string[]; // Full path: ['Parent', 'Child', 'Current']
  route?: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, TranslateModule, MenuTextFormatPipe],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
  // Inputs
  menuItems = input.required<MenuItem[]>();
  isExpanded = input.required<boolean>();
  isCollapsed = input<boolean>(false); // Whether sidebar is in collapsed state

  // Outputs
  resultSelected = output<SearchResult>();

  // Services
  private translateService = inject(TranslateService);

  // ViewChild
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  
  // Method to clear search (can be called from parent)
  clearSearchValue(): void {
    this.searchQuery.set('');
    this.showDropdown.set(false);
    this.focusedResultIndex.set(-1);
  }

  // Constants
  readonly UI = UI;
  readonly UI_META = UI_META;
  readonly MIN_SEARCH_CHARS = 3;

  // Signals
  searchQuery = signal<string>('');
  showDropdown = signal<boolean>(false);
  focusedResultIndex = signal<number>(-1);

  // Computed signals
  searchResults = computed(() => {
    const query = this.searchQuery().trim();
    if (query.length < this.MIN_SEARCH_CHARS) {
      return [];
    }

    return this.searchMenuItems(this.menuItems(), query.toLowerCase(), []);
  });

  hasResults = computed(() => this.searchResults().length > 0);

  shouldShowDropdown = computed(() => {
    const query = this.searchQuery().trim();
    return this.showDropdown() && query.length >= this.MIN_SEARCH_CHARS;
  });

  noResultsMessage = computed(() => {
    return this.translateService.instant(this.UI.NAVIGATION.SEARCH.NO_RESULTS);
  });

  resultsCountAriaLabel = computed(() => {
    const count = this.searchResults().length;
    return this.translateService.instant(this.UI_META.NAVIGATION.SEARCH.ARIA.RESULTS_COUNT, {
      count,
    });
  });

  constructor() {
    // Effect to handle document click for closing dropdown
    effect(() => {
      if (this.shouldShowDropdown()) {
        // Click outside handling is done via template event binding
      }
    });
  }

  /**
   * Recursively search through menu items - LEAF ITEMS only
   */
  private searchMenuItems(
    items: MenuItem[],
    query: string,
    parentPath: string[]
  ): SearchResult[] {
    const results: SearchResult[] = [];

    items.forEach((item) => {
      const itemLabel = item.label.toLowerCase();
      const currentPath = [...parentPath, item.label];

      const isLeaf = !item.children || item.children.length === 0;

      // Only include leaf items that match the query
      if (isLeaf && itemLabel.includes(query)) {
        results.push({
          item,
          breadcrumb: currentPath
        });
      }

      // Recursively search children (to find nested leaves)
      if (item.children && item.children.length > 0) {
        const childResults = this.searchMenuItems(item.children, query, currentPath);
        results.push(...childResults);
      }
    });

    return results;
  }

  /**
   * Handle search input change
   */
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.focusedResultIndex.set(-1);

    if (value.trim().length >= this.MIN_SEARCH_CHARS) {
      this.showDropdown.set(true);
    } else {
      this.showDropdown.set(false);
    }
  }

  /**
   * Handle keyboard navigation
   */
  onKeyDown(event: KeyboardEvent): void {
    const results = this.searchResults();
    const currentIndex = this.focusedResultIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < results.length - 1) {
          this.focusedResultIndex.set(currentIndex + 1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          this.focusedResultIndex.set(currentIndex - 1);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < results.length) {
          this.selectResult(results[currentIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.clearSearch();
        break;
    }
  }

  /**
   * Select a search result
   */
  selectResult(result: SearchResult): void {
    this.resultSelected.emit(result);
    this.clearSearch();
  }

  /**
   * Clear search input and hide dropdown
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.showDropdown.set(false);
    this.focusedResultIndex.set(-1);
  }

  /**
   * Handle click on result item
   */
  onResultClick(result: SearchResult, index: number): void {
    this.focusedResultIndex.set(index);
    this.selectResult(result);
  }

  /**
   * Handle mouse enter on result item
   */
  onResultMouseEnter(index: number): void {
    this.focusedResultIndex.set(index);
  }

  /**
   * Get breadcrumb display text (show TOPMOST parent only)
   */
  getBreadcrumbText(breadcrumb: string[]): string {
    // Show topmost parent (FIRST item in path)
    // For path ['Donor Functions', 'Sub Menu', 'Donor Registration'], show 'Donor Functions'
    // For path ['System Admin'], return '' (no parent - it's Level 1)
    if (breadcrumb.length > 1) {
      return breadcrumb[0]; // TOPMOST parent
    }
    return '';
  }

  /**
   * Check if breadcrumb should be shown (not for Level 1 items)
   */
  shouldShowBreadcrumb(breadcrumb: string[]): boolean {
    return breadcrumb.length > 1;
  }

  /**
   * Handle click outside to close dropdown (called from host element)
   */
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const searchContainer = target.closest('.search-container');
    
    if (!searchContainer && this.showDropdown()) {
      this.showDropdown.set(false);
    }
  }

  /**
   * Get ARIA label for result item
   */
  getResultAriaLabel(result: SearchResult): string {
    return this.translateService.instant(this.UI_META.NAVIGATION.SEARCH.ARIA.RESULT_ITEM, {
      item: result.breadcrumb.join(', '),
    });
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByRoute(index: number, result: SearchResult): string {
    return result.route || index.toString();
  }
}
