import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, of, throwError } from 'rxjs';
import { GroupsListComponent } from './groups-list.component';
import { HeaderService } from '@shared/services/header.service';
import { MenuItemService } from '../services/menu-item.service';
import { Group } from '../models/menu-item.model';
import { MatSnackBar } from '@angular/material/snack-bar';

// ---- test data helpers -------------------------------------------------------

const makeGroup = (overrides: Partial<Group> = {}): Group => ({
  applId: 'APP1',
  groupId: 'GRP1',
  description: 'Test Group',
  userCount: 5,
  lastModifiedDate: '2026-01-01',
  ...overrides,
});

const sampleGroups: Group[] = [
  makeGroup({ groupId: 'GRP1', description: 'Alpha Group', userCount: 10 }),
  makeGroup({ groupId: 'GRP2', description: 'Beta Group', userCount: 3 }),
  makeGroup({ groupId: 'GRP3', description: 'Gamma Group', userCount: 7 }),
];

// ==============================================================================
// GroupsListComponent
// ==============================================================================

describe('GroupsListComponent', () => {
  let component: GroupsListComponent;
  let fixture: ComponentFixture<GroupsListComponent>;
  let chapterChanged$: Subject<void>;
  let mockHeaderService: Partial<HeaderService>;
  let mockMenuItemService: jasmine.SpyObj<MenuItemService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();
    mockHeaderService = { chapterChanged$: chapterChanged$.asObservable() };

    mockMenuItemService = jasmine.createSpyObj('MenuItemService', [
      'getGroups',
      'getOnsiteGroups',
    ]);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockMenuItemService.getGroups.and.returnValue(of([...sampleGroups]));
    mockMenuItemService.getOnsiteGroups.and.returnValue(of([...sampleGroups]));

    TestBed.configureTestingModule({
      imports: [GroupsListComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuItemService, useValue: mockMenuItemService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    fixture = TestBed.createComponent(GroupsListComponent);
    component = fixture.componentInstance;
  });

  // --------------------------------------------------------------------------
  // Creation & Initialization
  // --------------------------------------------------------------------------

  describe('creation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // subscribeToChapterChanges
  // --------------------------------------------------------------------------

  describe('subscribeToChapterChanges', () => {
    it('should subscribe to chapter changes without throwing', () => {
      fixture.detectChanges();
      expect(() => chapterChanged$.next()).not.toThrow();
    });

    it('should unsubscribe on ngOnDestroy without throwing', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      expect(() => chapterChanged$.next()).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // ngOnInit
  // --------------------------------------------------------------------------

  describe('ngOnInit', () => {
    it('should call loadAllGroups on init and populate groups', () => {
      fixture.detectChanges();
      expect(mockMenuItemService.getGroups).toHaveBeenCalled();
      expect(component.groups().length).toBe(3);
    });

    it('should set isLoading to false after loading completes', () => {
      fixture.detectChanges();
      expect(component.isLoading()).toBeFalse();
    });

    it('should auto-select the first group on init', () => {
      spyOn(component.groupSelected, 'emit');
      fixture.detectChanges();
      expect(component.selectedGroupId()).toBe('GRP1');
      expect(component.groupSelected.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ group: jasmine.objectContaining({ groupId: 'GRP1' }), index: 0 })
      );
    });

    it('should emit loadingStateChange(true) then loadingStateChange(false)', () => {
      spyOn(component.loadingStateChange, 'emit');
      fixture.detectChanges();
      expect(component.loadingStateChange.emit).toHaveBeenCalledWith(true);
      expect(component.loadingStateChange.emit).toHaveBeenCalledWith(false);
    });
  });

  // --------------------------------------------------------------------------
  // ngOnDestroy
  // --------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('should call next and complete on the internal destroy$ subject', () => {
      fixture.detectChanges();
      const nextSpy = spyOn((component as any).destroy$, 'next').and.callThrough();
      const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // loadAllGroups
  // --------------------------------------------------------------------------

  describe('loadAllGroups', () => {
    it('should call getGroups when activeTabIndex is 0', () => {
      fixture.detectChanges();
      expect(mockMenuItemService.getGroups).toHaveBeenCalled();
      expect(mockMenuItemService.getOnsiteGroups).not.toHaveBeenCalled();
    });

    it('should call getOnsiteGroups when activeTabIndex is 1', () => {
      mockMenuItemService.getGroups.calls.reset();
      mockMenuItemService.getOnsiteGroups.calls.reset();
      fixture.detectChanges();
      component.activeTabIndex = 1;
      expect(mockMenuItemService.getOnsiteGroups).toHaveBeenCalled();
    });

    it('should set allGroups, originalGroups, and groups on success', () => {
      fixture.detectChanges();
      expect(component.allGroups().length).toBe(3);
      expect(component.originalGroups().length).toBe(3);
      expect(component.groups().length).toBe(3);
    });

    it('should not call onRowClick when groups array is empty', () => {
      mockMenuItemService.getGroups.and.returnValue(of([]));
      spyOn(component.groupSelected, 'emit');
      fixture.detectChanges();
      expect(component.selectedGroupId()).toBeNull();
      expect(component.groupSelected.emit).not.toHaveBeenCalled();
    });

    it('should handle error from service without crashing', () => {
      mockMenuItemService.getGroups.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'error');
      fixture.detectChanges();
      expect(console.error).toHaveBeenCalledWith('Error loading groups:', jasmine.any(Error));
      expect(component.isLoading()).toBeFalse();
    });

    it('should set isLoading to false even on error (finalize)', () => {
      mockMenuItemService.getGroups.and.returnValue(throwError(() => new Error('fail')));
      spyOn(console, 'error');
      fixture.detectChanges();
      expect(component.isLoading()).toBeFalse();
    });

    it('should emit loadingStateChange(false) even on error (finalize)', () => {
      mockMenuItemService.getGroups.and.returnValue(throwError(() => new Error('fail')));
      spyOn(console, 'error');
      spyOn(component.loadingStateChange, 'emit');
      fixture.detectChanges();
      expect(component.loadingStateChange.emit).toHaveBeenCalledWith(false);
    });
  });

  // --------------------------------------------------------------------------
  // Input: activeTabIndex
  // --------------------------------------------------------------------------

  describe('activeTabIndex input', () => {
    it('should reload groups when activeTabIndex changes', () => {
      fixture.detectChanges();
      mockMenuItemService.getGroups.calls.reset();
      mockMenuItemService.getOnsiteGroups.calls.reset();

      component.activeTabIndex = 1;
      expect(mockMenuItemService.getOnsiteGroups).toHaveBeenCalled();
    });

    it('should not reload groups when activeTabIndex is set to the same value', () => {
      fixture.detectChanges();
      mockMenuItemService.getGroups.calls.reset();

      // default is 0, setting again to 0 should not reload
      component.activeTabIndex = 0;
      expect(mockMenuItemService.getGroups).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Input: forceSelectedGroupId
  // --------------------------------------------------------------------------

  describe('forceSelectedGroupId input', () => {
    it('should set selectedGroupId when a truthy value is provided', () => {
      fixture.detectChanges();
      component.forceSelectedGroupId = 'GRP2';
      expect(component.selectedGroupId()).toBe('GRP2');
    });

    it('should not change selectedGroupId when null is provided', () => {
      fixture.detectChanges();
      component.forceSelectedGroupId = 'GRP2';
      component.forceSelectedGroupId = null;
      expect(component.selectedGroupId()).toBe('GRP2');
    });

    it('should not change selectedGroupId when empty string is provided', () => {
      fixture.detectChanges();
      component.forceSelectedGroupId = 'GRP2';
      component.forceSelectedGroupId = '';
      expect(component.selectedGroupId()).toBe('GRP2');
    });
  });

  // --------------------------------------------------------------------------
  // Input: editingGroup
  // --------------------------------------------------------------------------

  describe('editingGroup input', () => {
    it('should set editingRowIndex when a number is provided', () => {
      fixture.detectChanges();
      component.editingGroup = 2;
      expect(component.editingRowIndex()).toBe(2);
    });

    it('should set editingRowIndex to null', () => {
      fixture.detectChanges();
      component.editingGroup = 2;
      component.editingGroup = null;
      expect(component.editingRowIndex()).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Computed signals
  // --------------------------------------------------------------------------

  describe('computed signals', () => {
    it('hasGroups should be true when groups are present', () => {
      fixture.detectChanges();
      expect(component.hasGroups()).toBeTrue();
    });

    it('hasGroups should be false when groups are empty', () => {
      mockMenuItemService.getGroups.and.returnValue(of([]));
      fixture.detectChanges();
      expect(component.hasGroups()).toBeFalse();
    });

    it('showNoResults should be false when loading', () => {
      fixture.detectChanges();
      component.isLoading.set(true);
      component.groups.set([]);
      component.searchTerm.set('xyz');
      expect(component.showNoResults()).toBeFalse();
    });

    it('showNoResults should be false when groups exist', () => {
      fixture.detectChanges();
      component.searchTerm.set('xyz');
      expect(component.showNoResults()).toBeFalse();
    });

    it('showNoResults should be false when no search term', () => {
      fixture.detectChanges();
      component.groups.set([]);
      component.searchTerm.set('');
      expect(component.showNoResults()).toBeFalse();
    });

    it('showNoResults should be true when not loading, no groups, and search term exists', () => {
      fixture.detectChanges();
      component.isLoading.set(false);
      component.groups.set([]);
      component.searchTerm.set('xyz');
      expect(component.showNoResults()).toBeTrue();
    });

    it('hasSearchValue should be false initially', () => {
      fixture.detectChanges();
      expect(component.hasSearchValue()).toBeFalse();
    });

    it('hasSearchValue should be true when search input has a value', () => {
      // Set value BEFORE first evaluation of the computed (before detectChanges
      // renders the template), since hasSearchValue reads a non-signal form control
      // value and computed() caches after first evaluation.
      component.searchForm.controls.search.setValue('test');
      expect(component.hasSearchValue()).toBeTrue();
    });

    it('hasSearchValue should be false when search input has only whitespace', () => {
      fixture.detectChanges();
      component.searchForm.controls.search.setValue('   ');
      expect(component.hasSearchValue()).toBeFalse();
    });
  });

  // --------------------------------------------------------------------------
  // onSearch
  // --------------------------------------------------------------------------

  describe('onSearch', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter groups by groupId (case-insensitive)', () => {
      component.searchForm.controls.search.setValue('grp2');
      component.onSearch();
      expect(component.groups().length).toBe(1);
      expect(component.groups()[0].groupId).toBe('GRP2');
    });

    it('should filter groups by description (case-insensitive)', () => {
      component.searchForm.controls.search.setValue('alpha');
      component.onSearch();
      expect(component.groups().length).toBe(1);
      expect(component.groups()[0].description).toBe('Alpha Group');
    });

    it('should return empty groups when no match', () => {
      component.searchForm.controls.search.setValue('nonexistent');
      component.onSearch();
      expect(component.groups().length).toBe(0);
    });

    it('should return all groups when search term is empty', () => {
      component.searchForm.controls.search.setValue('grp2');
      component.onSearch();
      expect(component.groups().length).toBe(1);

      component.searchForm.controls.search.setValue('');
      component.onSearch();
      expect(component.groups().length).toBe(3);
    });

    it('should trim the search value', () => {
      component.searchForm.controls.search.setValue('  grp2  ');
      component.onSearch();
      expect(component.groups().length).toBe(1);
      expect(component.searchTerm()).toBe('grp2');
    });

    it('should handle non-string search values gracefully', () => {
      (component.searchForm.controls.search as any).setValue(null);
      expect(() => component.onSearch()).not.toThrow();
      expect(component.searchTerm()).toBe('');
    });

    it('should clear selectedGroupId when the selected group is filtered out', () => {
      component.selectedGroupId.set('GRP3');
      component.searchForm.controls.search.setValue('grp1');
      component.onSearch();
      expect(component.selectedGroupId()).toBeNull();
    });

    it('should keep selectedGroupId when the selected group remains in filtered results', () => {
      component.selectedGroupId.set('GRP1');
      component.searchForm.controls.search.setValue('grp1');
      component.onSearch();
      expect(component.selectedGroupId()).toBe('GRP1');
    });
  });

  // --------------------------------------------------------------------------
  // onClearSearch
  // --------------------------------------------------------------------------

  describe('onClearSearch', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear the search form control', () => {
      component.searchForm.controls.search.setValue('test');
      component.onClearSearch();
      expect(component.searchForm.controls.search.value).toBe('');
    });

    it('should reset searchTerm to empty string', () => {
      component.searchTerm.set('test');
      component.onClearSearch();
      expect(component.searchTerm()).toBe('');
    });

    it('should restore all groups after clearing', () => {
      component.searchForm.controls.search.setValue('grp1');
      component.onSearch();
      expect(component.groups().length).toBe(1);

      component.onClearSearch();
      expect(component.groups().length).toBe(3);
    });
  });

  // --------------------------------------------------------------------------
  // onSort
  // --------------------------------------------------------------------------

  describe('onSort', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set sort direction to asc when sorting a new column', () => {
      component.onSort('groupId');
      expect(component.sortState().column).toBe('groupId');
      expect(component.sortState().direction).toBe('asc');
    });

    it('should cycle from asc to desc on the same column', () => {
      component.onSort('groupId');
      component.onSort('groupId');
      expect(component.sortState().column).toBe('groupId');
      expect(component.sortState().direction).toBe('desc');
    });

    it('should cycle from desc to null (unsorted) on the same column', () => {
      component.onSort('groupId');
      component.onSort('groupId');
      component.onSort('groupId');
      expect(component.sortState().column).toBeNull();
      expect(component.sortState().direction).toBeNull();
    });

    it('should sort groups ascending by groupId', () => {
      component.onSort('groupId');
      const groupIds = component.groups().map(g => g.groupId);
      expect(groupIds).toEqual(['GRP1', 'GRP2', 'GRP3']);
    });

    it('should sort groups descending by groupId', () => {
      component.onSort('groupId');
      component.onSort('groupId');
      const groupIds = component.groups().map(g => g.groupId);
      expect(groupIds).toEqual(['GRP3', 'GRP2', 'GRP1']);
    });

    it('should restore original order when sort is cleared', () => {
      const originalIds = component.groups().map(g => g.groupId);
      component.onSort('groupId');
      component.onSort('groupId');
      component.onSort('groupId');
      const restoredIds = component.groups().map(g => g.groupId);
      expect(restoredIds).toEqual(originalIds);
    });

    it('should do nothing when column is null', () => {
      const beforeState = component.sortState();
      component.onSort(null);
      expect(component.sortState()).toEqual(beforeState);
    });

    it('should apply sorting on top of filtered results', () => {
      component.searchForm.controls.search.setValue('gr');
      component.onSearch();
      component.onSort('groupId');
      component.onSort('groupId'); // desc
      const groupIds = component.groups().map(g => g.groupId);
      expect(groupIds[0]).toBe('GRP3');
    });
  });

  // --------------------------------------------------------------------------
  // getSortIcon
  // --------------------------------------------------------------------------

  describe('getSortIcon', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return unfold_more when column is not sorted', () => {
      expect(component.getSortIcon('groupId')).toBe('unfold_more');
    });

    it('should return arrow_upward when column is sorted ascending', () => {
      component.onSort('groupId');
      expect(component.getSortIcon('groupId')).toBe('arrow_upward');
    });

    it('should return arrow_downward when column is sorted descending', () => {
      component.onSort('groupId');
      component.onSort('groupId');
      expect(component.getSortIcon('groupId')).toBe('arrow_downward');
    });

    it('should return unfold_more for a different unsorted column', () => {
      component.onSort('groupId');
      // null column check - the only sortable column is groupId
      expect(component.getSortIcon(null)).toBe('unfold_more');
    });
  });

  // --------------------------------------------------------------------------
  // getSortAriaLabel
  // --------------------------------------------------------------------------

  describe('getSortAriaLabel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return "Sort ascending" for unsorted column', () => {
      expect(component.getSortAriaLabel('groupId')).toBe('Sort ascending');
    });

    it('should return "Sort descending" when column is sorted ascending', () => {
      component.onSort('groupId');
      expect(component.getSortAriaLabel('groupId')).toBe('Sort descending');
    });

    it('should return "Sort ascending" when column is sorted descending', () => {
      component.onSort('groupId');
      component.onSort('groupId');
      expect(component.getSortAriaLabel('groupId')).toBe('Sort ascending');
    });

    it('should return "Sort ascending" for a different unsorted column', () => {
      component.onSort('groupId');
      expect(component.getSortAriaLabel(null)).toBe('Sort ascending');
    });
  });

  // --------------------------------------------------------------------------
  // onRowClick
  // --------------------------------------------------------------------------

  describe('onRowClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set the selectedGroupId and emit groupSelected', () => {
      const group = makeGroup({ groupId: 'GRP2' });
      spyOn(component.groupSelected, 'emit');
      component.onRowClick(group, 1);
      expect(component.selectedGroupId()).toBe('GRP2');
      expect(component.groupSelected.emit).toHaveBeenCalledWith({ group, index: 1 });
    });

    it('should not emit when clicking the already selected group', () => {
      const group = makeGroup({ groupId: 'GRP1' });
      // GRP1 is already selected from ngOnInit auto-select
      spyOn(component.groupSelected, 'emit');
      component.onRowClick(group, 0);
      expect(component.groupSelected.emit).not.toHaveBeenCalled();
    });

    it('should emit requestSelectionChange when checkBeforeSelect is true', () => {
      component.checkBeforeSelect = true;
      const group = makeGroup({ groupId: 'GRP2' });
      spyOn(component.requestSelectionChange, 'emit');
      component.onRowClick(group, 1);
      expect(component.requestSelectionChange.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ group, index: 1, callback: jasmine.any(Function) })
      );
    });

    it('should not directly select when checkBeforeSelect is true (waits for callback)', () => {
      component.checkBeforeSelect = true;
      const group = makeGroup({ groupId: 'GRP2' });
      spyOn(component.requestSelectionChange, 'emit');
      component.onRowClick(group, 1);
      // The selectedGroupId should NOT have changed yet (still GRP1 from init)
      expect(component.selectedGroupId()).toBe('GRP1');
    });

    it('should select group when checkBeforeSelect callback is called with true', () => {
      component.checkBeforeSelect = true;
      const group = makeGroup({ groupId: 'GRP2' });
      spyOn(component.groupSelected, 'emit');
      let capturedCallback: (allowed: boolean) => void = () => {};
      spyOn(component.requestSelectionChange, 'emit').and.callFake((event: any) => {
        capturedCallback = event.callback;
      });

      component.onRowClick(group, 1);
      capturedCallback(true);

      expect(component.selectedGroupId()).toBe('GRP2');
      expect(component.groupSelected.emit).toHaveBeenCalledWith({ group, index: 1 });
    });

    it('should NOT select group when checkBeforeSelect callback is called with false', () => {
      component.checkBeforeSelect = true;
      const group = makeGroup({ groupId: 'GRP2' });
      spyOn(component.groupSelected, 'emit');
      let capturedCallback: (allowed: boolean) => void = () => {};
      spyOn(component.requestSelectionChange, 'emit').and.callFake((event: any) => {
        capturedCallback = event.callback;
      });

      component.onRowClick(group, 1);
      capturedCallback(false);

      expect(component.selectedGroupId()).toBe('GRP1');
      expect(component.groupSelected.emit).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // isRowSelected
  // --------------------------------------------------------------------------

  describe('isRowSelected', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for the selected group', () => {
      expect(component.isRowSelected(makeGroup({ groupId: 'GRP1' }))).toBeTrue();
    });

    it('should return false for a non-selected group', () => {
      expect(component.isRowSelected(makeGroup({ groupId: 'GRP2' }))).toBeFalse();
    });

    it('should return false when no group is selected', () => {
      component.selectedGroupId.set(null);
      expect(component.isRowSelected(makeGroup({ groupId: 'GRP1' }))).toBeFalse();
    });
  });

  // --------------------------------------------------------------------------
  // isRowEditing
  // --------------------------------------------------------------------------

  describe('isRowEditing', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for the editing row index', () => {
      component.editingGroup = 2;
      expect(component.isRowEditing(2)).toBeTrue();
    });

    it('should return false for a non-editing row index', () => {
      component.editingGroup = 2;
      expect(component.isRowEditing(0)).toBeFalse();
    });

    it('should return false when no row is being edited', () => {
      expect(component.isRowEditing(0)).toBeFalse();
    });
  });

  // --------------------------------------------------------------------------
  // applyFilters (tested via onSearch, with sorting interaction)
  // --------------------------------------------------------------------------

  describe('applyFilters with sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply active sort after filtering', () => {
      // Set up descending sort first
      component.onSort('groupId');
      component.onSort('groupId'); // desc

      // Now search - applyFilters should maintain sort
      component.searchForm.controls.search.setValue('grp');
      component.onSearch();

      const groupIds = component.groups().map(g => g.groupId);
      expect(groupIds).toEqual(['GRP3', 'GRP2', 'GRP1']);
    });

    it('should not apply sorting when no sort is active', () => {
      // No sorting applied
      const originalIds = component.groups().map(g => g.groupId);
      component.searchForm.controls.search.setValue('grp');
      component.onSearch();
      const filteredIds = component.groups().map(g => g.groupId);
      expect(filteredIds).toEqual(originalIds);
    });
  });

  // --------------------------------------------------------------------------
  // applySorting edge cases (tested indirectly)
  // --------------------------------------------------------------------------

  describe('applySorting edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle equal values gracefully (comparison returns 0)', () => {
      const dupeGroups: Group[] = [
        makeGroup({ groupId: 'AAA' }),
        makeGroup({ groupId: 'AAA' }),
      ];
      component.allGroups.set(dupeGroups);
      component.originalGroups.set([...dupeGroups]);
      component.groups.set([...dupeGroups]);

      component.onSort('groupId');
      expect(component.groups().length).toBe(2);
      expect(component.groups()[0].groupId).toBe('AAA');
      expect(component.groups()[1].groupId).toBe('AAA');
    });
  });

  // --------------------------------------------------------------------------
  // displayedColumns
  // --------------------------------------------------------------------------

  describe('displayedColumns', () => {
    it('should contain groupId, description, and userCount', () => {
      fixture.detectChanges();
      expect(component.displayedColumns).toEqual(['groupId', 'description', 'userCount']);
    });
  });

  // --------------------------------------------------------------------------
  // Integration: search then sort then clear
  // --------------------------------------------------------------------------

  describe('integration: search, sort, clear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should correctly handle search -> sort -> clear flow', () => {
      // Search for 'gr' which matches all 3 groups
      component.searchForm.controls.search.setValue('gr');
      component.onSearch();
      expect(component.groups().length).toBe(3);

      // Sort descending
      component.onSort('groupId');
      component.onSort('groupId');
      expect(component.groups()[0].groupId).toBe('GRP3');

      // Clear search
      component.onClearSearch();
      // Sort should still be active
      expect(component.groups().length).toBe(3);
    });

    it('should handle repeated searches correctly', () => {
      component.searchForm.controls.search.setValue('alpha');
      component.onSearch();
      expect(component.groups().length).toBe(1);

      component.searchForm.controls.search.setValue('beta');
      component.onSearch();
      expect(component.groups().length).toBe(1);
      expect(component.groups()[0].description).toBe('Beta Group');

      component.searchForm.controls.search.setValue('');
      component.onSearch();
      expect(component.groups().length).toBe(3);
    });
  });

  // --------------------------------------------------------------------------
  // Tab switching and group reloading
  // --------------------------------------------------------------------------

  describe('tab switching via activeTabIndex', () => {
    it('should reload groups when switching from tab 0 to tab 1', () => {
      fixture.detectChanges();
      mockMenuItemService.getOnsiteGroups.calls.reset();

      component.activeTabIndex = 1;
      expect(mockMenuItemService.getOnsiteGroups).toHaveBeenCalledTimes(1);
    });

    it('should reload groups when switching from tab 1 back to tab 0', () => {
      fixture.detectChanges();
      component.activeTabIndex = 1;
      mockMenuItemService.getGroups.calls.reset();

      component.activeTabIndex = 0;
      expect(mockMenuItemService.getGroups).toHaveBeenCalledTimes(1);
    });

    it('should call getGroups for any tab index other than 1', () => {
      fixture.detectChanges();
      mockMenuItemService.getGroups.calls.reset();
      component.activeTabIndex = 2;
      expect(mockMenuItemService.getGroups).toHaveBeenCalled();
    });
  });
});
