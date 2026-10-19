import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComponentRef } from '@angular/core';

import { SearchComponent, SearchResult } from './search.component';
import { MenuItem } from '../../../services/menu.service';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let componentRef: ComponentRef<SearchComponent>;
  let translateService: TranslateService;

  const menuItems: MenuItem[] = [
    {
      label: 'Donor Functions',
      children: [
        { label: 'Donor Registration', children: [] },
        { label: 'Donor Search', children: [] },
        {
          label: 'Sub Menu',
          children: [
            { label: 'Nested Item', children: [] },
          ],
        },
      ],
    },
    {
      label: 'Laboratory Functions',
      children: [
        { label: 'Sample Management', children: [] },
      ],
    },
    { label: 'System Admin', children: [] },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('menuItems', menuItems);
    componentRef.setInput('isExpanded', true);

    translateService = TestBed.inject(TranslateService);
    spyOn(translateService, 'instant').and.callFake((key: string) => key);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('searchResults computed signal', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty when query is less than MIN_SEARCH_CHARS', () => {
      component.searchQuery.set('Do');
      expect(component.searchResults().length).toBe(0);
    });

    it('should find leaf items matching query', () => {
      component.searchQuery.set('Donor');
      const results = component.searchResults();
      expect(results.length).toBe(2); // Donor Registration, Donor Search
      expect(results[0].item.label).toBe('Donor Registration');
      expect(results[1].item.label).toBe('Donor Search');
    });

    it('should find nested leaf items', () => {
      component.searchQuery.set('Nested');
      const results = component.searchResults();
      expect(results.length).toBe(1);
      expect(results[0].item.label).toBe('Nested Item');
      expect(results[0].breadcrumb).toEqual(['Donor Functions', 'Sub Menu', 'Nested Item']);
    });

    it('should not include parent items (non-leaf)', () => {
      component.searchQuery.set('Donor Functions');
      const results = component.searchResults();
      // "Donor Functions" is a parent with children, so it should NOT appear
      expect(results.every(r => r.item.label !== 'Donor Functions')).toBeTrue();
    });

    it('should be case-insensitive', () => {
      component.searchQuery.set('sample');
      const results = component.searchResults();
      expect(results.length).toBe(1);
      expect(results[0].item.label).toBe('Sample Management');
    });
  });

  describe('hasResults', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when there are search results', () => {
      component.searchQuery.set('Donor');
      expect(component.hasResults()).toBeTrue();
    });

    it('should return false when there are no results', () => {
      component.searchQuery.set('ZZZZZZZZZ');
      expect(component.hasResults()).toBeFalse();
    });
  });

  describe('shouldShowDropdown', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when dropdown is visible and query is long enough', () => {
      component.searchQuery.set('Donor');
      component.showDropdown.set(true);
      expect(component.shouldShowDropdown()).toBeTrue();
    });

    it('should return false when dropdown is hidden', () => {
      component.searchQuery.set('Donor');
      component.showDropdown.set(false);
      expect(component.shouldShowDropdown()).toBeFalse();
    });

    it('should return false when query is too short', () => {
      component.searchQuery.set('Do');
      component.showDropdown.set(true);
      expect(component.shouldShowDropdown()).toBeFalse();
    });
  });

  describe('onSearchInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update searchQuery and show dropdown for valid input', () => {
      component.onSearchInput('Donor Reg');
      expect(component.searchQuery()).toBe('Donor Reg');
      expect(component.showDropdown()).toBeTrue();
      expect(component.focusedResultIndex()).toBe(-1);
    });

    it('should hide dropdown for short input', () => {
      component.showDropdown.set(true);
      component.onSearchInput('Do');
      expect(component.showDropdown()).toBeFalse();
    });

    it('should handle empty input', () => {
      component.onSearchInput('');
      expect(component.searchQuery()).toBe('');
      expect(component.showDropdown()).toBeFalse();
    });
  });

  describe('onKeyDown', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchQuery.set('Donor');
      component.showDropdown.set(true);
    });

    it('ArrowDown should increment focused index', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');
      component.onKeyDown(event);
      expect(component.focusedResultIndex()).toBe(0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ArrowDown should not go past last result', () => {
      const results = component.searchResults();
      component.focusedResultIndex.set(results.length - 1);
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      component.onKeyDown(event);
      expect(component.focusedResultIndex()).toBe(results.length - 1);
    });

    it('ArrowUp should decrement focused index', () => {
      component.focusedResultIndex.set(1);
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');
      component.onKeyDown(event);
      expect(component.focusedResultIndex()).toBe(0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ArrowUp should not go below 0', () => {
      component.focusedResultIndex.set(0);
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.onKeyDown(event);
      expect(component.focusedResultIndex()).toBe(0);
    });

    it('Enter should select focused result', () => {
      component.focusedResultIndex.set(0);
      spyOn(component, 'selectResult');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeyDown(event);
      expect(component.selectResult).toHaveBeenCalled();
    });

    it('Enter should do nothing when no result is focused', () => {
      component.focusedResultIndex.set(-1);
      spyOn(component, 'selectResult');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeyDown(event);
      expect(component.selectResult).not.toHaveBeenCalled();
    });

    it('Escape should clear search', () => {
      spyOn(component, 'clearSearch');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onKeyDown(event);
      expect(component.clearSearch).toHaveBeenCalled();
    });
  });

  describe('selectResult', () => {
    it('should emit resultSelected and clear search', () => {
      fixture.detectChanges();
      const result: SearchResult = {
        item: { label: 'Test' },
        breadcrumb: ['Parent', 'Test'],
      };
      spyOn(component.resultSelected, 'emit');
      spyOn(component, 'clearSearch');

      component.selectResult(result);

      expect(component.resultSelected.emit).toHaveBeenCalledWith(result);
      expect(component.clearSearch).toHaveBeenCalled();
    });
  });

  describe('clearSearch', () => {
    it('should reset search state', () => {
      fixture.detectChanges();
      component.searchQuery.set('test');
      component.showDropdown.set(true);
      component.focusedResultIndex.set(2);

      component.clearSearch();

      expect(component.searchQuery()).toBe('');
      expect(component.showDropdown()).toBeFalse();
      expect(component.focusedResultIndex()).toBe(-1);
    });
  });

  describe('clearSearchValue', () => {
    it('should reset search state (public API)', () => {
      fixture.detectChanges();
      component.searchQuery.set('test');
      component.showDropdown.set(true);
      component.focusedResultIndex.set(2);

      component.clearSearchValue();

      expect(component.searchQuery()).toBe('');
      expect(component.showDropdown()).toBeFalse();
      expect(component.focusedResultIndex()).toBe(-1);
    });
  });

  describe('onResultClick', () => {
    it('should set focused index and select result', () => {
      fixture.detectChanges();
      const result: SearchResult = {
        item: { label: 'Test' },
        breadcrumb: ['Test'],
      };
      spyOn(component.resultSelected, 'emit');

      component.onResultClick(result, 3);

      // selectResult is called which clears search (resetting focusedResultIndex)
      // Verify the result was emitted and search was cleared
      expect(component.resultSelected.emit).toHaveBeenCalledWith(result);
      expect(component.searchQuery()).toBe('');
    });
  });

  describe('onResultMouseEnter', () => {
    it('should set focused result index', () => {
      fixture.detectChanges();
      component.onResultMouseEnter(5);
      expect(component.focusedResultIndex()).toBe(5);
    });
  });

  describe('getBreadcrumbText', () => {
    it('should return topmost parent for multi-level breadcrumb', () => {
      expect(component.getBreadcrumbText(['Donor Functions', 'Sub Menu', 'Item'])).toBe('Donor Functions');
    });

    it('should return empty string for single-level breadcrumb', () => {
      expect(component.getBreadcrumbText(['System Admin'])).toBe('');
    });
  });

  describe('shouldShowBreadcrumb', () => {
    it('should return true for multi-level breadcrumb', () => {
      expect(component.shouldShowBreadcrumb(['Parent', 'Child'])).toBeTrue();
    });

    it('should return false for single-level breadcrumb', () => {
      expect(component.shouldShowBreadcrumb(['Single'])).toBeFalse();
    });
  });

  describe('onClickOutside', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dropdown when clicking outside search container', () => {
      component.showDropdown.set(true);
      const mockElement = document.createElement('div');
      const event = { target: mockElement } as unknown as MouseEvent;
      component.onClickOutside(event);
      expect(component.showDropdown()).toBeFalse();
    });

    it('should not close dropdown when clicking inside search container', () => {
      component.showDropdown.set(true);
      const container = document.createElement('div');
      container.classList.add('search-container');
      const child = document.createElement('span');
      container.appendChild(child);
      document.body.appendChild(container);

      const event = { target: child } as unknown as MouseEvent;
      component.onClickOutside(event);
      expect(component.showDropdown()).toBeTrue();

      document.body.removeChild(container);
    });
  });

  describe('getResultAriaLabel', () => {
    it('should call translateService.instant with joined breadcrumb', () => {
      fixture.detectChanges();
      const result: SearchResult = {
        item: { label: 'Test' },
        breadcrumb: ['Parent', 'Child', 'Test'],
      };
      component.getResultAriaLabel(result);
      expect(translateService.instant).toHaveBeenCalled();
    });
  });

  describe('trackByRoute', () => {
    it('should return route when available', () => {
      const result: SearchResult = {
        item: { label: 'Test' },
        breadcrumb: ['Test'],
        route: '/test/route',
      };
      expect(component.trackByRoute(0, result)).toBe('/test/route');
    });

    it('should return index as string when no route', () => {
      const result: SearchResult = {
        item: { label: 'Test' },
        breadcrumb: ['Test'],
      };
      expect(component.trackByRoute(3, result)).toBe('3');
    });
  });

  describe('noResultsMessage', () => {
    it('should call translate service', () => {
      fixture.detectChanges();
      component.noResultsMessage();
      expect(translateService.instant).toHaveBeenCalled();
    });
  });

  describe('resultsCountAriaLabel', () => {
    it('should return translated results count', () => {
      fixture.detectChanges();
      component.searchQuery.set('Donor');
      const label = component.resultsCountAriaLabel();
      expect(translateService.instant).toHaveBeenCalledWith(
        component.UI_META.NAVIGATION.SEARCH.ARIA.RESULTS_COUNT,
        { count: component.searchResults().length }
      );
      expect(typeof label).toBe('string');
    });

    it('should return zero count when no results', () => {
      fixture.detectChanges();
      component.searchQuery.set('ZZZZZZZZZ');
      component.resultsCountAriaLabel();
      expect(translateService.instant).toHaveBeenCalledWith(
        component.UI_META.NAVIGATION.SEARCH.ARIA.RESULTS_COUNT,
        { count: 0 }
      );
    });
  });

  describe('isCollapsed input', () => {
    it('should default to false', () => {
      fixture.detectChanges();
      expect(component.isCollapsed()).toBeFalse();
    });

    it('should accept true value', () => {
      componentRef.setInput('isCollapsed', true);
      fixture.detectChanges();
      expect(component.isCollapsed()).toBeTrue();
    });
  });

  describe('constructor effect', () => {
    it('should execute effect when shouldShowDropdown is true', () => {
      fixture.detectChanges();
      component.searchQuery.set('Donor');
      component.showDropdown.set(true);
      // Trigger change detection to run the effect
      fixture.detectChanges();
      expect(component.shouldShowDropdown()).toBeTrue();
    });

    it('should execute effect when shouldShowDropdown is false', () => {
      fixture.detectChanges();
      component.searchQuery.set('Do');
      component.showDropdown.set(true);
      fixture.detectChanges();
      expect(component.shouldShowDropdown()).toBeFalse();
    });
  });

  describe('onKeyDown with unhandled key', () => {
    it('should not change state for unrecognized keys', () => {
      fixture.detectChanges();
      component.searchQuery.set('Donor');
      component.showDropdown.set(true);
      component.focusedResultIndex.set(0);

      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      component.onKeyDown(event);

      expect(component.focusedResultIndex()).toBe(0);
    });
  });

  describe('onClickOutside edge case', () => {
    it('should not change state when dropdown is already closed', () => {
      fixture.detectChanges();
      component.showDropdown.set(false);
      const mockElement = document.createElement('div');
      const event = { target: mockElement } as unknown as MouseEvent;
      component.onClickOutside(event);
      expect(component.showDropdown()).toBeFalse();
    });
  });

  describe('searchResults with empty menu items', () => {
    it('should return empty results for empty menu items', () => {
      componentRef.setInput('menuItems', []);
      fixture.detectChanges();
      component.searchQuery.set('Donor');
      expect(component.searchResults()).toEqual([]);
    });
  });

  describe('searchResults with whitespace query', () => {
    it('should trim whitespace and apply MIN_SEARCH_CHARS check', () => {
      fixture.detectChanges();
      component.searchQuery.set('   Do   ');
      expect(component.searchResults().length).toBe(0);
    });

    it('should find results with leading/trailing whitespace if trimmed length is sufficient', () => {
      fixture.detectChanges();
      component.searchQuery.set('  Donor  ');
      expect(component.searchResults().length).toBe(2);
    });
  });

  describe('onSearchInput with whitespace-only input', () => {
    it('should hide dropdown for whitespace-only input', () => {
      fixture.detectChanges();
      component.onSearchInput('   ');
      expect(component.showDropdown()).toBeFalse();
    });
  });

  describe('selectResult without spy', () => {
    it('should emit result and clear search state', () => {
      fixture.detectChanges();
      const result: SearchResult = {
        item: { label: 'Test Item' },
        breadcrumb: ['Parent', 'Test Item'],
        route: '/test',
      };
      const emitSpy = spyOn(component.resultSelected, 'emit');

      component.selectResult(result);

      expect(emitSpy).toHaveBeenCalledWith(result);
      expect(component.searchQuery()).toBe('');
      expect(component.showDropdown()).toBeFalse();
      expect(component.focusedResultIndex()).toBe(-1);
    });
  });

  describe('getResultAriaLabel details', () => {
    it('should join breadcrumb items with comma-space', () => {
      fixture.detectChanges();
      const result: SearchResult = {
        item: { label: 'Nested Item' },
        breadcrumb: ['Donor Functions', 'Sub Menu', 'Nested Item'],
      };
      component.getResultAriaLabel(result);
      expect(translateService.instant).toHaveBeenCalledWith(
        component.UI_META.NAVIGATION.SEARCH.ARIA.RESULT_ITEM,
        { item: 'Donor Functions, Sub Menu, Nested Item' }
      );
    });
  });

  describe('getBreadcrumbText edge cases', () => {
    it('should return topmost parent for two-level breadcrumb', () => {
      expect(component.getBreadcrumbText(['Parent', 'Child'])).toBe('Parent');
    });

    it('should return empty for empty breadcrumb array', () => {
      expect(component.getBreadcrumbText([])).toBe('');
    });
  });

  describe('searchResults includes System Admin leaf', () => {
    it('should find top-level leaf items', () => {
      fixture.detectChanges();
      component.searchQuery.set('System');
      const results = component.searchResults();
      expect(results.length).toBe(1);
      expect(results[0].item.label).toBe('System Admin');
      expect(results[0].breadcrumb).toEqual(['System Admin']);
    });
  });

  describe('onKeyDown Enter with out-of-range index', () => {
    it('should not select result when index exceeds results length', () => {
      fixture.detectChanges();
      component.searchQuery.set('Donor');
      component.showDropdown.set(true);
      component.focusedResultIndex.set(100);
      spyOn(component, 'selectResult');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeyDown(event);
      expect(component.selectResult).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    it('should render search input when expanded', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.search-input')).toBeTruthy();
    });

    it('should render search icon when collapsed', () => {
      componentRef.setInput('isExpanded', false);
      componentRef.setInput('isCollapsed', true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.search-icon-only')).toBeTruthy();
    });

    it('should show clear button when query has text', () => {
      fixture.detectChanges();
      component.searchQuery.set('test');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.clear-button')).toBeTruthy();
    });

    it('should not show clear button when query is empty', () => {
      fixture.detectChanges();
      component.searchQuery.set('');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.clear-button')).toBeFalsy();
    });

    it('should show dropdown with results when searching', () => {
      fixture.detectChanges();
      component.searchQuery.set('Donor');
      component.showDropdown.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.search-results-dropdown')).toBeTruthy();
      expect(compiled.querySelectorAll('.result-item').length).toBe(2);
    });

    it('should show no-results message when search has no matches', () => {
      fixture.detectChanges();
      component.searchQuery.set('ZZZZZZZZZ');
      component.showDropdown.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.no-results')).toBeTruthy();
    });

    it('should show breadcrumb for nested results', () => {
      fixture.detectChanges();
      component.searchQuery.set('Nested');
      component.showDropdown.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.result-breadcrumb')).toBeTruthy();
    });

    it('should not show breadcrumb for top-level results', () => {
      fixture.detectChanges();
      component.searchQuery.set('System');
      component.showDropdown.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.result-breadcrumb')).toBeFalsy();
    });
  });
});
