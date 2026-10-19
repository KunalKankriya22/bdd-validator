import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartDropdownComponent } from './smart-dropdown';
import { DropdownItem, SelectionMode } from './smart-dropdown.model';

describe('SmartDropdownComponent', () => {
  let component: SmartDropdownComponent;
  let fixture: ComponentFixture<SmartDropdownComponent>;

  const itemA: DropdownItem = { code: 'A', description: 'Alpha' };
  const itemB: DropdownItem = { code: 'B', description: 'Beta' };
  const itemC: DropdownItem = { code: 'C', description: 'Charlie' };
  const itemD: DropdownItem = { code: 'D', description: 'Delta' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SmartDropdownComponent],
    });
    TestBed.overrideComponent(SmartDropdownComponent, {
      set: { template: '<div></div>' },
    });

    fixture = TestBed.createComponent(SmartDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── displayItems ──────────────────────────────────────────────────

  describe('displayItems', () => {
    it('returns filteredItems in client mode', () => {
      component.isServerMode.set(false);
      component.filteredItems.set([itemA, itemB]);

      expect(component.displayItems()).toEqual([itemA, itemB]);
    });

    it('returns items in server mode', () => {
      component.isServerMode.set(true);
      component.items.set([itemC, itemD]);

      expect(component.displayItems()).toEqual([itemC, itemD]);
    });
  });

  // ── allDisplayedSelected ──────────────────────────────────────────

  describe('allDisplayedSelected', () => {
    it('returns false when not in multiple mode', () => {
      component.filteredItems.set([itemA]);
      component.value.set(['A']);

      expect(component.allDisplayedSelected()).toBe(false);
    });

    it('returns false when value is empty array', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA]);
      component.value.set([]);

      expect(component.allDisplayedSelected()).toBe(false);
    });

    it('returns false when value is not an array', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA]);
      component.value.set(null);

      expect(component.allDisplayedSelected()).toBe(false);
    });

    it('returns false when display items are empty', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([]);
      component.value.set(['A']);

      expect(component.allDisplayedSelected()).toBe(false);
    });

    it('returns true when all displayed items are selected', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA, itemB]);
      component.value.set(['A', 'B']);

      expect(component.allDisplayedSelected()).toBe(true);
    });

    it('returns false when some displayed items are not selected', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA, itemB]);
      component.value.set(['A']);

      expect(component.allDisplayedSelected()).toBe(false);
    });
  });

  // ── someDisplayedSelected ─────────────────────────────────────────

  describe('someDisplayedSelected', () => {
    it('returns false when not in multiple mode', () => {
      component.filteredItems.set([itemA, itemB]);
      component.value.set(['A']);

      expect(component.someDisplayedSelected()).toBe(false);
    });

    it('returns true when some but not all displayed items selected', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA, itemB, itemC]);
      component.value.set(['A', 'B']);

      expect(component.someDisplayedSelected()).toBe(true);
    });

    it('returns false when all displayed items are selected', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA, itemB]);
      component.value.set(['A', 'B']);

      expect(component.someDisplayedSelected()).toBe(false);
    });

    it('returns false when no items are selected', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA, itemB]);
      component.value.set([]);

      expect(component.someDisplayedSelected()).toBe(false);
    });
  });

  // ── getSelectedCount ──────────────────────────────────────────────

  describe('getSelectedCount', () => {
    it('returns 0 when value is not an array', () => {
      component.value.set(null);

      expect(component.getSelectedCount()).toBe(0);
    });

    it('returns value length for normal selection', () => {
      component.value.set(['A', 'B', 'C']);

      expect(component.getSelectedCount()).toBe(3);
    });

    it('returns totalCount when in ALL mode and server mode', () => {
      component.isAllMode.set(true);
      component.isServerMode.set(true);
      component.totalCount.set(250);
      component.value.set(['A']);

      expect(component.getSelectedCount()).toBe(250);
    });
  });

  // ── getVisibleChips ───────────────────────────────────────────────

  describe('getVisibleChips', () => {
    it('returns empty array when value is empty', () => {
      component.value.set([]);

      expect(component.getVisibleChips()).toEqual([]);
    });

    it('returns empty array when value is null', () => {
      component.value.set(null);

      expect(component.getVisibleChips()).toEqual([]);
    });

    it('returns items limited by maxVisibleChips', () => {
      fixture.componentRef.setInput('staticItems', [itemA, itemB, itemC]);
      component.value.set(['A', 'B', 'C']);
      fixture.componentRef.setInput('maxVisibleChips', 2);

      const chips = component.getVisibleChips();

      expect(chips.length).toBe(2);
      expect(chips[0].code).toBe('A');
      expect(chips[1].code).toBe('B');
    });

    it('creates fallback item when code not found in items', () => {
      fixture.componentRef.setInput('staticItems', []);
      component.value.set(['UNKNOWN']);

      const chips = component.getVisibleChips();

      expect(chips[0]).toEqual({ code: 'UNKNOWN', description: 'UNKNOWN' });
    });

    it('uses items signal in server mode', () => {
      component.isServerMode.set(true);
      component.items.set([itemA, itemB]);
      component.value.set(['A']);

      const chips = component.getVisibleChips();

      expect(chips[0].description).toBe('Alpha');
    });
  });

  // ── getRemainingChipsCount ────────────────────────────────────────

  describe('getRemainingChipsCount', () => {
    it('returns 0 when selected count is within maxVisibleChips', () => {
      fixture.componentRef.setInput('maxVisibleChips', 3);
      component.value.set(['A', 'B']);

      expect(component.getRemainingChipsCount()).toBe(0);
    });

    it('returns remaining count when exceeding maxVisibleChips', () => {
      fixture.componentRef.setInput('maxVisibleChips', 1);
      component.value.set(['A', 'B', 'C']);

      expect(component.getRemainingChipsCount()).toBe(2);
    });
  });

  // ── hasMoreChips ──────────────────────────────────────────────────

  describe('hasMoreChips', () => {
    it('returns true when remaining count is positive', () => {
      fixture.componentRef.setInput('maxVisibleChips', 1);
      component.value.set(['A', 'B']);

      expect(component.hasMoreChips()).toBe(true);
    });

    it('returns false when all chips are visible', () => {
      fixture.componentRef.setInput('maxVisibleChips', 3);
      component.value.set(['A', 'B']);

      expect(component.hasMoreChips()).toBe(false);
    });
  });

  // ── getHiddenChipsTooltip ─────────────────────────────────────────

  describe('getHiddenChipsTooltip', () => {
    it('returns empty string when value is not an array', () => {
      component.value.set('single' as any);

      expect(component.getHiddenChipsTooltip()).toBe('');
    });

    it('returns descriptions of hidden chips joined by newline', () => {
      fixture.componentRef.setInput('staticItems', [itemA, itemB, itemC]);
      fixture.componentRef.setInput('maxVisibleChips', 1);
      component.value.set(['A', 'B', 'C']);

      const tooltip = component.getHiddenChipsTooltip();

      expect(tooltip).toContain('Beta');
      expect(tooltip).toContain('Charlie');
    });

    it('uses code as fallback when item not found', () => {
      fixture.componentRef.setInput('staticItems', []);
      fixture.componentRef.setInput('maxVisibleChips', 0);
      component.value.set(['UNKNOWN']);

      expect(component.getHiddenChipsTooltip()).toBe('UNKNOWN');
    });
  });

  // ── onValueChange ─────────────────────────────────────────────────

  describe('onValueChange', () => {
    it('sets the value signal', () => {
      component.onValueChange('newVal');

      expect(component.value()).toBe('newVal');
    });

    it('sets array value for multi-select', () => {
      component.onValueChange(['A', 'B']);

      expect(component.value()).toEqual(['A', 'B']);
    });
  });

  // ── clearAll ──────────────────────────────────────────────────────

  describe('clearAll', () => {
    it('resets value to empty array and exits ALL mode', () => {
      component.value.set(['A', 'B']);
      component.isAllMode.set(true);
      const event = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

      component.clearAll(event);

      expect(component.value()).toEqual([]);
      expect(component.isAllMode()).toBe(false);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('emits selectionChange with empty array', () => {
      const spy = jasmine.createSpy('selectionChange');
      component.selectionChange.subscribe(spy);
      const event = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

      component.clearAll(event);

      expect(spy).toHaveBeenCalledWith([]);
    });

    it('emits selectionModeChange with individual', () => {
      const spy = jasmine.createSpy('selectionModeChange');
      component.selectionModeChange.subscribe(spy);
      const event = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

      component.clearAll(event);

      expect(spy).toHaveBeenCalledWith('individual');
    });
  });

  // ── removeChip ────────────────────────────────────────────────────

  describe('removeChip', () => {
    it('removes the specified code from value', () => {
      component.value.set(['A', 'B', 'C']);
      const event = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

      component.removeChip('B', event);

      expect(component.value()).toEqual(['A', 'C']);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('exits ALL mode and emits events', () => {
      component.value.set(['A', 'B']);
      component.isAllMode.set(true);
      const modeSpy = jasmine.createSpy('selectionModeChange');
      const selSpy = jasmine.createSpy('selectionChange');
      component.selectionModeChange.subscribe(modeSpy);
      component.selectionChange.subscribe(selSpy);
      const event = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

      component.removeChip('A', event);

      expect(component.isAllMode()).toBe(false);
      expect(modeSpy).toHaveBeenCalledWith('individual');
      expect(selSpy).toHaveBeenCalledWith(['B']);
    });

    it('does not modify value when value is not an array', () => {
      component.value.set('single' as any);
      const event = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

      component.removeChip('single', event);

      expect(component.value()).toBe('single' as any);
    });
  });

  // ── onSelectionChange ─────────────────────────────────────────────

  describe('onSelectionChange', () => {
    it('exits ALL mode when item deselected in ALL mode', () => {
      fixture.componentRef.setInput('multiple', true);
      component.isAllMode.set(true);
      component.filteredItems.set([itemA, itemB, itemC]);
      const modeSpy = jasmine.createSpy('selectionModeChange');
      component.selectionModeChange.subscribe(modeSpy);

      component.onSelectionChange({ value: ['A', 'B'], source: null } as any);

      expect(component.isAllMode()).toBe(false);
      expect(modeSpy).toHaveBeenCalledWith('individual');
    });

    it('auto-enters ALL mode when all items manually selected without search', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('staticItems', [itemA, itemB]);
      component.filteredItems.set([itemA, itemB]);
      component.searchControl.setValue('', { emitEvent: false });
      const modeSpy = jasmine.createSpy('selectionModeChange');
      component.selectionModeChange.subscribe(modeSpy);

      component.onSelectionChange({ value: ['A', 'B'], source: null } as any);

      expect(component.isAllMode()).toBe(true);
      expect(modeSpy).toHaveBeenCalledWith('all');
    });

    it('does not enter ALL mode when search filter is active', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('staticItems', [itemA, itemB]);
      component.filteredItems.set([itemA, itemB]);
      component.searchControl.setValue('alpha', { emitEvent: false });

      component.onSelectionChange({ value: ['A', 'B'], source: null } as any);

      expect(component.isAllMode()).toBe(false);
    });

    it('uses totalCount for ALL mode check in server mode', () => {
      fixture.componentRef.setInput('multiple', true);
      component.isServerMode.set(true);
      component.totalCount.set(2);
      component.items.set([itemA, itemB]);
      component.searchControl.setValue('', { emitEvent: false });

      component.onSelectionChange({ value: ['A', 'B'], source: null } as any);

      expect(component.isAllMode()).toBe(true);
    });

    it('emits selectionChange with event value', () => {
      const spy = jasmine.createSpy('selectionChange');
      component.selectionChange.subscribe(spy);

      component.onSelectionChange({ value: 'A', source: null } as any);

      expect(spy).toHaveBeenCalledWith('A');
    });
  });

  // ── toggleSelectAll ───────────────────────────────────────────────

  describe('toggleSelectAll', () => {
    it('deselects all displayed items when all are selected', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA, itemB]);
      component.value.set(['A', 'B', 'C']);

      component.toggleSelectAll();

      expect(component.value()).toEqual(['C']);
      expect(component.isAllMode()).toBe(false);
    });

    it('selects all displayed items when not all are selected', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA, itemB, itemC]);
      component.value.set(['A']);
      component.searchControl.setValue('', { emitEvent: false });

      component.toggleSelectAll();

      const val = component.value() as string[];
      expect(val).toContain('A');
      expect(val).toContain('B');
      expect(val).toContain('C');
    });

    it('merges with existing selection from other filters', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA, itemB]);
      component.value.set(['X', 'Y']);
      component.searchControl.setValue('', { emitEvent: false });

      component.toggleSelectAll();

      const val = component.value() as string[];
      expect(val).toContain('X');
      expect(val).toContain('Y');
      expect(val).toContain('A');
      expect(val).toContain('B');
    });

    it('enters ALL mode in server mode without search', () => {
      fixture.componentRef.setInput('multiple', true);
      component.isServerMode.set(true);
      component.items.set([itemA, itemB]);
      component.value.set([]);
      component.searchControl.setValue('', { emitEvent: false });
      const modeSpy = jasmine.createSpy('selectionModeChange');
      component.selectionModeChange.subscribe(modeSpy);

      component.toggleSelectAll();

      expect(component.isAllMode()).toBe(true);
      expect(modeSpy).toHaveBeenCalledWith('all');
    });

    it('enters ALL mode in client mode when all static items selected', () => {
      fixture.componentRef.setInput('multiple', true);
      fixture.componentRef.setInput('staticItems', [itemA, itemB]);
      component.filteredItems.set([itemA, itemB]);
      component.value.set([]);
      component.searchControl.setValue('', { emitEvent: false });

      component.toggleSelectAll();

      expect(component.isAllMode()).toBe(true);
    });

    it('does not enter ALL mode when search filter is active', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA]);
      component.value.set([]);
      component.searchControl.setValue('alpha', { emitEvent: false });

      component.toggleSelectAll();

      expect(component.isAllMode()).toBe(false);
    });

    it('emits selectionChange and selectionModeChange', () => {
      fixture.componentRef.setInput('multiple', true);
      component.filteredItems.set([itemA]);
      component.value.set([]);
      const selSpy = jasmine.createSpy('selectionChange');
      const modeSpy = jasmine.createSpy('selectionModeChange');
      component.selectionChange.subscribe(selSpy);
      component.selectionModeChange.subscribe(modeSpy);

      component.toggleSelectAll();

      expect(selSpy).toHaveBeenCalled();
      expect(modeSpy).toHaveBeenCalled();
    });
  });

  // ── onScroll ──────────────────────────────────────────────────────

  describe('onScroll', () => {
    it('does nothing when not in server mode', () => {
      component.isServerMode.set(false);
      component.items.set([itemA, itemB, itemC, itemD]);

      expect(() => component.onScroll(0)).not.toThrow();
    });

    it('triggers loadMore when scroll reaches threshold in server mode', () => {
      component.isServerMode.set(true);
      component.items.set([itemA, itemB, itemC, itemD]);
      fixture.componentRef.setInput('itemSize', 42);
      const loadMoreSubject = (component as any).loadMore$;
      let emitted = false;
      loadMoreSubject.subscribe(() => emitted = true);

      component.onScroll(10);

      expect(emitted).toBe(true);
    });
  });

  // ── getViewportHeight ─────────────────────────────────────────────

  describe('getViewportHeight', () => {
    it('calculates based on item count and size', () => {
      fixture.componentRef.setInput('itemSize', 42);
      component.filteredItems.set([itemA, itemB, itemC]);

      expect(component.getViewportHeight()).toBe(3 * 42);
    });

    it('caps at 6 items', () => {
      fixture.componentRef.setInput('itemSize', 42);
      component.filteredItems.set(Array(10).fill(itemA));

      expect(component.getViewportHeight()).toBe(6 * 42);
    });
  });

  // ── trackByCode ───────────────────────────────────────────────────

  describe('trackByCode', () => {
    it('returns item code', () => {
      expect(component.trackByCode(0, itemA)).toBe('A');
    });
  });
});
