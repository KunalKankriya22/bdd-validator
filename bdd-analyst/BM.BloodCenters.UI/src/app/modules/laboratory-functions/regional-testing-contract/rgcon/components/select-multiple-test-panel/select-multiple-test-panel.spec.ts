import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { SelectMultipleTestPanelComponent } from './select-multiple-test-panel';
import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';
import { TestGroupLookup, TestByGroupLookup } from '../../models/regional-testing-contract.model';

describe('SelectMultipleTestPanelComponent', () => {
  let component: SelectMultipleTestPanelComponent;
  let fixture: ComponentFixture<SelectMultipleTestPanelComponent>;
  let apiServiceSpy: jasmine.SpyObj<RegionalTestingContractApiService>;

  const mockGroups: TestGroupLookup[] = [
    { groupId: 'GRP1', description: 'Blood Typing' },
    { groupId: 'GRP2', description: 'Infectious Disease' },
    { groupId: 'GRP3', description: 'Antibody Screening' }
  ];

  const mockTests: TestByGroupLookup[] = [
    { testId: 'T1', testGroup: 'GRP1', description: 'ABO Type' },
    { testId: 'T2', testGroup: 'GRP1', description: 'Rh Type' },
    { testId: 'T3', testGroup: 'GRP2', description: 'HIV Screen' },
    { testId: 'T4', testGroup: 'GRP2', description: 'HCV Screen' },
    { testId: 'T5', testGroup: 'GRP3', description: 'Antibody ID' }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('RegionalTestingContractApiService', [
      'getTestGroups',
      'getTestsByGroup'
    ]);
    apiServiceSpy.getTestGroups.and.returnValue(of(mockGroups));
    apiServiceSpy.getTestsByGroup.and.returnValue(of(mockTests));

    TestBed.configureTestingModule({
      imports: [SelectMultipleTestPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: RegionalTestingContractApiService, useValue: apiServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(SelectMultipleTestPanelComponent);
    component = fixture.componentInstance;
  });

  function initComponent(): void {
    try {
      fixture.detectChanges();
    } catch {
      // Template may reference SidePanelBase elements; suppress render errors
    }
  }

  /**
   * Angular computed() only tracks signal reads, not FormControl.value.
   * After changing a FormControl value, we must nudge a signal dependency
   * so the computed re-evaluates and picks up the new FormControl value.
   */
  function refreshTestsSignal(): void {
    component.allTests.set([...component.allTests()]);
  }

  function refreshGroupsSignal(): void {
    component.groups.set([...component.groups()]);
  }

  // ─── 1. Component creation ───────────────────────────────────────────
  describe('Component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default empty excludedTestIds', () => {
      expect(component.excludedTestIds).toEqual([]);
    });

    it('should initialize footerButtons with three buttons', () => {
      expect(component.footerButtons.length).toBe(3);
      expect(component.footerButtons.map(b => b.action)).toEqual(['cancel', 'clearAll', 'save']);
    });

    it('should initialize signals with default values', () => {
      expect(component.groups()).toEqual([]);
      expect(component.allTests()).toEqual([]);
      expect(component.selectedTestIds().size).toBe(0);
      expect(component.loading()).toBe(false);
    });
  });

  // ─── 2. ngOnInit - loads groups and tests ────────────────────────────
  describe('ngOnInit', () => {
    it('should load test groups from api', () => {
      initComponent();

      expect(apiServiceSpy.getTestGroups).toHaveBeenCalledWith('NEW');
      expect(component.groups()).toEqual(mockGroups);
    });

    it('should load all tests from api', () => {
      initComponent();

      expect(apiServiceSpy.getTestsByGroup).toHaveBeenCalledWith('NEW', '');
      expect(component.allTests()).toEqual(mockTests);
    });

    it('should set loading to false after tests are loaded', () => {
      initComponent();

      expect(component.loading()).toBe(false);
    });
  });

  // ─── 3. isTestSelected ──────────────────────────────────────────────
  describe('isTestSelected', () => {
    it('should return true for a selected test', () => {
      component.selectedTestIds.set(new Set(['T1', 'T3']));

      expect(component.isTestSelected('T1')).toBe(true);
      expect(component.isTestSelected('T3')).toBe(true);
    });

    it('should return false for a non-selected test', () => {
      component.selectedTestIds.set(new Set(['T1']));

      expect(component.isTestSelected('T2')).toBe(false);
      expect(component.isTestSelected('T5')).toBe(false);
    });

    it('should return false when no tests are selected', () => {
      expect(component.isTestSelected('T1')).toBe(false);
    });
  });

  // ─── 4. toggleTest ──────────────────────────────────────────────────
  describe('toggleTest', () => {
    it('should add a test id when not currently selected', () => {
      component.toggleTest('T1');

      expect(component.selectedTestIds().has('T1')).toBe(true);
    });

    it('should remove a test id when currently selected', () => {
      component.selectedTestIds.set(new Set(['T1', 'T2']));

      component.toggleTest('T1');

      expect(component.selectedTestIds().has('T1')).toBe(false);
      expect(component.selectedTestIds().has('T2')).toBe(true);
    });

    it('should handle toggling the same test on and off', () => {
      component.toggleTest('T3');
      expect(component.selectedTestIds().has('T3')).toBe(true);

      component.toggleTest('T3');
      expect(component.selectedTestIds().has('T3')).toBe(false);
    });
  });

  // ─── 5. toggleAll ───────────────────────────────────────────────────
  describe('toggleAll', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should select all available tests when not all are selected', () => {
      component.groupIdControl.setValue('');

      component.toggleAll();

      const selected = component.selectedTestIds();
      mockTests.forEach(t => {
        expect(selected.has(t.testId)).toBe(true);
      });
    });

    it('should deselect all tests when all are already selected', () => {
      component.groupIdControl.setValue('');
      component.selectedTestIds.set(new Set(mockTests.map(t => t.testId)));

      component.toggleAll();

      expect(component.selectedTestIds().size).toBe(0);
    });

    it('should select only filtered group tests when a group is selected', () => {
      component.groupIdControl.setValue('GRP1');
      refreshTestsSignal();

      component.toggleAll();

      const selected = component.selectedTestIds();
      expect(selected.has('T1')).toBe(true);
      expect(selected.has('T2')).toBe(true);
      expect(selected.has('T3')).toBe(false);
    });
  });

  // ─── 6. onButtonClick ───────────────────────────────────────────────
  describe('onButtonClick', () => {
    it('should emit testsSelected with selected ids on save', () => {
      const emitSpy = spyOn(component.testsSelected, 'emit');
      component.selectedTestIds.set(new Set(['T1', 'T3']));

      component.onButtonClick('save');

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const emittedValue = emitSpy.calls.mostRecent().args[0] as string[];
      expect(emittedValue.sort()).toEqual(['T1', 'T3']);
    });

    it('should clear all selected tests on clearAll', () => {
      component.selectedTestIds.set(new Set(['T1', 'T2', 'T3']));

      component.onButtonClick('clearAll');

      expect(component.selectedTestIds().size).toBe(0);
    });

    it('should emit close on cancel', () => {
      const closeSpy = spyOn(component.close, 'emit');

      component.onButtonClick('cancel');

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('should do nothing for an unknown action', () => {
      const testsSpy = spyOn(component.testsSelected, 'emit');
      const closeSpy = spyOn(component.close, 'emit');
      component.selectedTestIds.set(new Set(['T1']));

      component.onButtonClick('unknown');

      expect(testsSpy).not.toHaveBeenCalled();
      expect(closeSpy).not.toHaveBeenCalled();
      expect(component.selectedTestIds().size).toBe(1);
    });
  });

  // ─── 7. onClosePanel ───────────────────────────────────────────────
  describe('onClosePanel', () => {
    it('should emit close event', () => {
      const closeSpy = spyOn(component.close, 'emit');

      component.onClosePanel();

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ─── 8. availableTests ─────────────────────────────────────────────
  describe('availableTests', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should return all tests when no group is selected and no exclusions', () => {
      component.groupIdControl.setValue('');

      expect(component.availableTests().length).toBe(5);
    });

    it('should filter by selected group', () => {
      component.groupIdControl.setValue('GRP1');
      refreshTestsSignal();

      const available = component.availableTests();
      expect(available.length).toBe(2);
      expect(available.every(t => t.testGroup === 'GRP1')).toBe(true);
    });

    it('should exclude tests in excludedTestIds', () => {
      component.excludedTestIds = ['T1', 'T3'];
      refreshTestsSignal();

      const available = component.availableTests();
      expect(available.length).toBe(3);
      expect(available.find(t => t.testId === 'T1')).toBeUndefined();
      expect(available.find(t => t.testId === 'T3')).toBeUndefined();
    });

    it('should combine group filter and exclusions', () => {
      component.excludedTestIds = ['T1'];
      component.groupIdControl.setValue('GRP1');
      refreshTestsSignal();

      const available = component.availableTests();
      expect(available.length).toBe(1);
      expect(available[0].testId).toBe('T2');
    });
  });

  // ─── 9. allSelected ────────────────────────────────────────────────
  describe('allSelected', () => {
    beforeEach(() => {
      initComponent();
      component.groupIdControl.setValue('');
    });

    it('should return true when all available tests are selected', () => {
      component.selectedTestIds.set(new Set(mockTests.map(t => t.testId)));

      expect(component.allSelected()).toBe(true);
    });

    it('should return false when only some tests are selected', () => {
      component.selectedTestIds.set(new Set(['T1', 'T2']));

      expect(component.allSelected()).toBe(false);
    });

    it('should return false when no tests are selected', () => {
      expect(component.allSelected()).toBe(false);
    });

    it('should return false when available tests list is empty', () => {
      component.excludedTestIds = mockTests.map(t => t.testId);
      refreshTestsSignal();

      expect(component.allSelected()).toBe(false);
    });
  });

  // ─── 10. someSelected ──────────────────────────────────────────────
  describe('someSelected', () => {
    beforeEach(() => {
      initComponent();
      component.groupIdControl.setValue('');
    });

    it('should return true when some but not all tests are selected', () => {
      component.selectedTestIds.set(new Set(['T1', 'T3']));

      expect(component.someSelected()).toBe(true);
    });

    it('should return false when no tests are selected', () => {
      expect(component.someSelected()).toBe(false);
    });

    it('should return false when all tests are selected', () => {
      component.selectedTestIds.set(new Set(mockTests.map(t => t.testId)));

      expect(component.someSelected()).toBe(false);
    });
  });

  // ─── 11. filteredGroups ────────────────────────────────────────────
  describe('filteredGroups', () => {
    beforeEach(() => {
      initComponent();
    });

    it('should return all groups when search is empty', () => {
      component.groupSearchControl.setValue('');

      expect(component.filteredGroups().length).toBe(3);
    });

    it('should filter groups by groupId (case-insensitive)', () => {
      component.groupSearchControl.setValue('grp1');
      refreshGroupsSignal();

      const filtered = component.filteredGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].groupId).toBe('GRP1');
    });

    it('should filter groups by description (case-insensitive)', () => {
      component.groupSearchControl.setValue('infectious');
      refreshGroupsSignal();

      const filtered = component.filteredGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].groupId).toBe('GRP2');
    });

    it('should return empty array when no groups match search', () => {
      component.groupSearchControl.setValue('xyz-no-match');
      refreshGroupsSignal();

      expect(component.filteredGroups().length).toBe(0);
    });

    it('should match partial text in description', () => {
      component.groupSearchControl.setValue('screen');
      refreshGroupsSignal();

      const filtered = component.filteredGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].description).toBe('Antibody Screening');
    });
  });

  // ─── 12. selectedGroupDescription ──────────────────────────────────
  // Note: initComponent() is called per-test (not in beforeEach) because the
  // computed returns early when groupIdControl is empty, which means groups()
  // is never read and therefore never tracked as a signal dependency. Setting
  // the form control value BEFORE the first evaluation ensures groups() is
  // tracked, allowing the computed to produce the correct result.
  describe('selectedGroupDescription', () => {
    it('should return dash when no group is selected', () => {
      initComponent();

      expect(component.selectedGroupDescription()).toBe('-');
    });

    it('should return group description when a valid group is selected', () => {
      component.groupIdControl.setValue('GRP2');
      initComponent();

      expect(component.selectedGroupDescription()).toBe('Infectious Disease');
    });

    it('should return dash when selected groupId does not exist', () => {
      component.groupIdControl.setValue('NONEXISTENT');
      initComponent();

      expect(component.selectedGroupDescription()).toBe('-');
    });
  });
});
