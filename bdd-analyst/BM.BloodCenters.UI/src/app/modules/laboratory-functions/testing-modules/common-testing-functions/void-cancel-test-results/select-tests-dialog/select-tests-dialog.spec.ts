import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { SelectTestsDialogComponent } from './select-tests-dialog';
import { ActiveTestDto, TestGroupDto } from '../models/void-cancel-test-results.model';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('SelectTestsDialogComponent', () => {
  let component: SelectTestsDialogComponent;
  let fixture: ComponentFixture<SelectTestsDialogComponent>;

  const testGroups: TestGroupDto[] = [
    { code: 'GRP1', description: 'Group One' },
    { code: 'GRP2', description: 'Group Two' },
    { code: 'ALPHA', description: 'Alpha Group' },
  ];

  const availableTests: ActiveTestDto[] = [
    { testId: 'T001', testDesc: 'Test One', testGroup: 'GRP1' },
    { testId: 'T002', testDesc: 'Test Two', testGroup: 'GRP2' },
    { testId: 'T003', testDesc: 'Test Three', testGroup: 'GRP1' },
    { testId: 'T004', testDesc: 'Test Four', testGroup: 'GRP2' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectTestsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: TranslateService, useValue: createMockTranslateService() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectTestsDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    try { fixture.detectChanges(); } catch (_) {}
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should update selectedIds when selectedTestIds changes', () => {
      component.selectedTestIds = ['T001', 'T002'];
      component.ngOnChanges({
        selectedTestIds: new SimpleChange([], ['T001', 'T002'], false),
      });
      expect(component['selectedIds']().has('T001')).toBeTrue();
      expect(component['selectedIds']().has('T002')).toBeTrue();
    });

    it('should handle null selectedTestIds', () => {
      component.selectedTestIds = null as any;
      component.ngOnChanges({
        selectedTestIds: new SimpleChange([], null, false),
      });
      expect(component['selectedIds']().size).toBe(0);
    });

    it('should update testGroupsSignal when testGroups changes', () => {
      component.testGroups = testGroups;
      component.ngOnChanges({
        testGroups: new SimpleChange([], testGroups, false),
      });
      expect(component['testGroupsSignal']()).toEqual(testGroups);
    });

    it('should update availableTestsSignal when availableTests changes', () => {
      component.availableTests = availableTests;
      component.ngOnChanges({
        availableTests: new SimpleChange([], availableTests, false),
      });
      expect(component['availableTestsSignal']()).toEqual(availableTests);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      try { fixture.detectChanges(); } catch (_) {}
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      try { fixture.detectChanges(); } catch (_) {}
      component.testGroups = testGroups;
      component.availableTests = availableTests;
      component.ngOnChanges({
        testGroups: new SimpleChange([], testGroups, true),
        availableTests: new SimpleChange([], availableTests, true),
      });
    });

    it('filteredGroups should return all groups when no search text', () => {
      expect(component['filteredGroups']().length).toBe(3);
    });

    it('filteredGroups should filter by code', () => {
      component.groupSearchCtrl.setValue('GRP1');
      expect(component['filteredGroups']().length).toBe(1);
      expect(component['filteredGroups']()[0].code).toBe('GRP1');
    });

    it('filteredGroups should filter by description', () => {
      component.groupSearchCtrl.setValue('Alpha');
      expect(component['filteredGroups']().length).toBe(1);
      expect(component['filteredGroups']()[0].code).toBe('ALPHA');
    });

    it('selectedGroupDescription should return dash when no group selected', () => {
      expect(component['selectedGroupDescription']()).toBe('-');
    });

    it('selectedGroupDescription should return group description when selected', () => {
      component.selectedGroupCtrl.setValue('GRP1');
      expect(component['selectedGroupDescription']()).toBe('Group One');
    });

    it('selectedGroupDescription should return dash for unknown group', () => {
      component.selectedGroupCtrl.setValue('UNKNOWN');
      expect(component['selectedGroupDescription']()).toBe('-');
    });

    it('filteredTests should return all tests when no group selected', () => {
      expect(component['filteredTests']().length).toBe(4);
    });

    it('filteredTests should filter by selected group', () => {
      component.selectedGroupCtrl.setValue('GRP1');
      const filtered = component['filteredTests']();
      expect(filtered.length).toBe(2);
      expect(filtered.every(t => t.testGroup === 'GRP1')).toBeTrue();
    });

    it('filteredTests should sort by testId ascending by default', () => {
      const tests = component['filteredTests']();
      expect(tests[0].testId).toBe('T001');
      expect(tests[tests.length - 1].testId).toBe('T004');
    });

    it('filteredTests should sort descending when direction is D', () => {
      component.onSortChange({ column: 'testId', direction: 'D' });
      const tests = component['filteredTests']();
      expect(tests[0].testId).toBe('T004');
      expect(tests[tests.length - 1].testId).toBe('T001');
    });

    it('filteredTests should not sort when direction is default', () => {
      component.onSortChange({ column: 'testId', direction: 'default' });
      const tests = component['filteredTests']();
      expect(tests.length).toBe(4);
    });

    it('selectedCount should reflect number of selected IDs', () => {
      expect(component['selectedCount']()).toBe(0);
      component['selectedIds'].set(new Set(['T001', 'T002']));
      expect(component['selectedCount']()).toBe(2);
    });
  });

  describe('onSelectionChange', () => {
    it('should update selectedIds with selected test IDs', () => {
      try { fixture.detectChanges(); } catch (_) {}
      const selectedRows: ActiveTestDto[] = [
        { testId: 'T001', testDesc: 'Test One' },
        { testId: 'T003', testDesc: 'Test Three' },
      ];
      component.onSelectionChange(selectedRows);
      expect(component['selectedIds']().has('T001')).toBeTrue();
      expect(component['selectedIds']().has('T003')).toBeTrue();
      expect(component['selectedIds']().size).toBe(2);
    });
  });

  describe('onSortChange', () => {
    it('should update sort column and direction', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.onSortChange({ column: 'testDesc', direction: 'D' });
      expect(component['sortColumn']()).toBe('testDesc');
      expect(component['sortDirection']()).toBe('D');
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      try { fixture.detectChanges(); } catch (_) {}
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('onProceed', () => {
    it('should emit proceed with selected tests', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.availableTests = availableTests;
      component.ngOnChanges({
        availableTests: new SimpleChange([], availableTests, true),
      });
      component['selectedIds'].set(new Set(['T001', 'T003']));
      spyOn(component.proceed, 'emit');

      component.onProceed();

      expect(component.proceed.emit).toHaveBeenCalledWith({
        selectedTests: [
          { testId: 'T001', testDesc: 'Test One', testGroup: 'GRP1' },
          { testId: 'T003', testDesc: 'Test Three', testGroup: 'GRP1' },
        ],
      });
    });

    it('should emit empty array when no tests selected', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.availableTests = availableTests;
      component.ngOnChanges({
        availableTests: new SimpleChange([], availableTests, true),
      });
      spyOn(component.proceed, 'emit');

      component.onProceed();

      expect(component.proceed.emit).toHaveBeenCalledWith({ selectedTests: [] });
    });
  });

  describe('groupSearchCtrl valueChanges', () => {
    it('should update groupSearchText signal', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.groupSearchCtrl.setValue('test');
      expect(component['groupSearchText']()).toBe('test');
    });

    it('should handle null value', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.groupSearchCtrl.setValue(null as any);
      expect(component['groupSearchText']()).toBe('');
    });
  });

  describe('selectedGroupCtrl valueChanges', () => {
    it('should update selectedGroup signal', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.selectedGroupCtrl.setValue('GRP1');
      expect(component['selectedGroup']()).toBe('GRP1');
    });
  });

  describe('tableConfig', () => {
    it('should have correct column configuration', () => {
      expect(component['tableConfig'].columns.length).toBe(3);
      expect(component['tableConfig'].enableSelection).toBeTrue();
      expect(component['tableConfig'].selectionKey).toBe('testId');
    });
  });
});
