import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SelectTestDialogComponent, SelectTestDialogData } from './select-test-dialog';

const mockTests = [
  { testId: 'T001', testDesc: 'Test One', testGroup: 'GRP1' },
  { testId: 'T002', testDesc: 'Test Two', testGroup: 'GRP1' },
  { testId: 'T003', testDesc: 'Test Three', testGroup: 'GRP2' },
];

describe('SelectTestDialogComponent', () => {
  let component: SelectTestDialogComponent;
  let fixture: ComponentFixture<SelectTestDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SelectTestDialogComponent>>;

  function setup(data: SelectTestDialogData = { availableTests: mockTests, selectedTestIds: [] }) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [SelectTestDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(SelectTestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Initialization', () => {
    it('should create the component', () => {
      setup();
      expect(component).toBeTruthy();
    });

    it('should default selectBy to ALL', () => {
      setup();
      expect(component['selectBy']()).toBe('ALL');
    });

    it('should pre-populate selectedIds from selectedTestIds on ngOnInit', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001', 'T003'] });
      expect(component['selectedIds']().has('T001')).toBeTrue();
      expect(component['selectedIds']().has('T003')).toBeTrue();
      expect(component['selectedIds']().has('T002')).toBeFalse();
    });

    it('should handle empty selectedTestIds', () => {
      setup({ availableTests: mockTests, selectedTestIds: [] });
      expect(component['selectedIds']().size).toBe(0);
    });

    it('should handle undefined selectedTestIds gracefully', () => {
      setup({ availableTests: mockTests, selectedTestIds: (undefined as any) });
      expect(component['selectedIds']().size).toBe(0);
    });
  });

  describe('groupIds computed', () => {
    it('should return unique sorted group IDs', () => {
      setup();
      expect(component['groupIds']()).toEqual(['GRP1', 'GRP2']);
    });

    it('should return empty array when no tests', () => {
      setup({ availableTests: [], selectedTestIds: [] });
      expect(component['groupIds']()).toEqual([]);
    });
  });

  describe('contractDescription computed', () => {
    it('should return "-" when no group is selected', () => {
      setup();
      expect(component['contractDescription']()).toBe('-');
    });

    it('should return group description when a group is selected and found', () => {
      setup();
      component['onGroupChange']('GRP1');
      expect(component['contractDescription']()).toBe('GRP1 Tests');
    });

    it('should return "-" when selected group has no matching test', () => {
      setup();
      component['selectedGroupId'].set('NONEXISTENT');
      expect(component['contractDescription']()).toBe('-');
    });
  });

  describe('filteredTests computed', () => {
    it('should return all tests when selectBy is ALL', () => {
      setup();
      expect(component['filteredTests']()).toEqual(mockTests);
    });

    it('should return all tests when selectBy is GROUP but no group selected', () => {
      setup();
      component['onSelectByChange']('GROUP');
      expect(component['filteredTests']()).toEqual(mockTests);
    });

    it('should filter by group when selectBy is GROUP and group is selected', () => {
      setup();
      component['onSelectByChange']('GROUP');
      component['onGroupChange']('GRP1');
      const filtered = component['filteredTests']();
      expect(filtered.length).toBe(2);
      expect(filtered.every(t => t.testGroup === 'GRP1')).toBeTrue();
    });
  });

  describe('isAllSelected computed', () => {
    it('should return false when filtered tests are empty', () => {
      setup({ availableTests: [], selectedTestIds: [] });
      expect(component['isAllSelected']()).toBeFalse();
    });

    it('should return false when not all filtered tests are selected', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001'] });
      expect(component['isAllSelected']()).toBeFalse();
    });

    it('should return true when all filtered tests are selected', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001', 'T002', 'T003'] });
      expect(component['isAllSelected']()).toBeTrue();
    });

    it('should reflect group-filtered isAllSelected', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001', 'T002'] });
      component['onSelectByChange']('GROUP');
      component['onGroupChange']('GRP1');
      expect(component['isAllSelected']()).toBeTrue();
    });
  });

  describe('isIndeterminate computed', () => {
    it('should return false when nothing is selected', () => {
      setup();
      expect(component['isIndeterminate']()).toBeFalse();
    });

    it('should return true when some but not all are selected', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001'] });
      expect(component['isIndeterminate']()).toBeTrue();
    });

    it('should return false when all are selected', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001', 'T002', 'T003'] });
      expect(component['isIndeterminate']()).toBeFalse();
    });
  });

  describe('onSelectByChange', () => {
    it('should set selectBy to GROUP', () => {
      setup();
      component['onSelectByChange']('GROUP');
      expect(component['selectBy']()).toBe('GROUP');
    });

    it('should clear selectedGroupId when changing to ALL', () => {
      setup();
      component['onGroupChange']('GRP1');
      component['onSelectByChange']('ALL');
      expect(component['selectedGroupId']()).toBe('');
    });

    it('should not clear selectedGroupId when changing to GROUP', () => {
      setup();
      component['onGroupChange']('GRP1');
      component['onSelectByChange']('GROUP');
      expect(component['selectedGroupId']()).toBe('GRP1');
    });
  });

  describe('onGroupChange', () => {
    it('should update selectedGroupId', () => {
      setup();
      component['onGroupChange']('GRP2');
      expect(component['selectedGroupId']()).toBe('GRP2');
    });
  });

  describe('onToggleAll', () => {
    it('should add all filtered tests when checked is true', () => {
      setup();
      component['onToggleAll'](true);
      const ids = component['selectedIds']();
      expect(ids.has('T001')).toBeTrue();
      expect(ids.has('T002')).toBeTrue();
      expect(ids.has('T003')).toBeTrue();
    });

    it('should remove all filtered tests when checked is false', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001', 'T002', 'T003'] });
      component['onToggleAll'](false);
      expect(component['selectedIds']().size).toBe(0);
    });

    it('should only toggle tests in the current filter (GROUP mode)', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T003'] });
      component['onSelectByChange']('GROUP');
      component['onGroupChange']('GRP1');
      component['onToggleAll'](true);
      const ids = component['selectedIds']();
      expect(ids.has('T001')).toBeTrue();
      expect(ids.has('T002')).toBeTrue();
      expect(ids.has('T003')).toBeTrue();
    });
  });

  describe('onToggleTest', () => {
    it('should add testId when checked is true', () => {
      setup();
      component['onToggleTest']('T001', true);
      expect(component['selectedIds']().has('T001')).toBeTrue();
    });

    it('should remove testId when checked is false', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001'] });
      component['onToggleTest']('T001', false);
      expect(component['selectedIds']().has('T001')).toBeFalse();
    });
  });

  describe('isTestSelected', () => {
    it('should return true when test is selected', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001'] });
      expect(component['isTestSelected']('T001')).toBeTrue();
    });

    it('should return false when test is not selected', () => {
      setup();
      expect(component['isTestSelected']('T001')).toBeFalse();
    });
  });

  describe('onProceed', () => {
    it('should close dialog with the selected tests', () => {
      setup({ availableTests: mockTests, selectedTestIds: ['T001', 'T003'] });
      component['onProceed']();
      expect(dialogRefSpy.close).toHaveBeenCalledWith([
        { testId: 'T001', testDesc: 'Test One', testGroup: 'GRP1' },
        { testId: 'T003', testDesc: 'Test Three', testGroup: 'GRP2' },
      ]);
    });

    it('should close dialog with empty array when no tests are selected', () => {
      setup();
      component['onProceed']();
      expect(dialogRefSpy.close).toHaveBeenCalledWith([]);
    });
  });

  describe('onGoBack', () => {
    it('should close dialog with null', () => {
      setup();
      component['onGoBack']();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });
  });
});
