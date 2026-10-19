import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GroupInterdictionFilterPanel } from './filter-panel';
import {
  GroupInterdictionFilterValue,
  ValidInterdictionDto
} from '../models/group-interdiction.model';

describe('GroupInterdictionFilterPanel', () => {
  let component: GroupInterdictionFilterPanel;
  let fixture: ComponentFixture<GroupInterdictionFilterPanel>;

  const mockInterdictionCodes: ValidInterdictionDto[] = [
    { interCode: 'INT001', interDesc: 'Hold Type 1' },
    { interCode: 'INT002', interDesc: 'NFT Type 2' }
  ] as ValidInterdictionDto[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GroupInterdictionFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GroupInterdictionFilterPanel);
    component = fixture.componentInstance;
    component.interdictionCodes = mockInterdictionCodes;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('interCode')?.value).toBeNull();
    });

    it('should populate form from currentFilters input', () => {
      component.currentFilters = {
        interType: 'HOLD',
        interCode: 'INT001'
      };
      fixture.detectChanges();

      expect(component.filterForm.get('interType')?.value).toBe('HOLD');
      expect(component.filterForm.get('interCode')?.value).toBe('INT001');
    });

    it('should initialize filtered inter code options', () => {
      fixture.detectChanges();

      expect(component.filteredInterCodeOptions).toEqual(mockInterdictionCodes);
    });

    it('should have interType options with HOLD and NFT', () => {
      fixture.detectChanges();

      expect(component.interTypeOptions).toEqual([
        { value: 'HOLD', label: 'Hold' },
        { value: 'NFT', label: 'NFT' }
      ]);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values on apply', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ interType: 'HOLD' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({ interType: 'HOLD' });
    });

    it('should emit both interType and interCode when set', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        interType: 'HOLD',
        interCode: 'INT001'
      });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        interType: 'HOLD',
        interCode: 'INT001'
      });
    });

    it('should emit empty object when values are falsy', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        interType: null,
        interCode: null
      });
      // Need to set a value first to make it not disabled
      component.filterForm.patchValue({ interType: 'HOLD' });
      component.filterForm.patchValue({ interType: null });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({});
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls on clear', () => {
      component.filterForm.patchValue({
        interType: 'HOLD',
        interCode: 'INT001'
      });

      component.onClear();

      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('interCode')?.value).toBeNull();
    });

    it('should reset search control and filtered options', () => {
      component.interCodeSearchControl.setValue('INT');

      component.onClear();

      expect(component.filteredInterCodeOptions).toEqual(mockInterdictionCodes);
    });
  });

  describe('Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be disabled when no filters are set', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when values match initial filters (no change)', () => {
      component.currentFilters = { interType: 'HOLD' };
      component.ngOnInit();

      component.filterForm.patchValue({ interType: 'HOLD' });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when values differ from initial filters', () => {
      component.currentFilters = { interType: 'HOLD' };
      component.ngOnInit();

      component.filterForm.patchValue({ interType: 'NFT' });

      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('Inter Code Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter inter codes by search term on code', () => {
      component.interCodeSearchControl.setValue('INT001');

      // Allow debounce to settle
      fixture.detectChanges();

      // Direct filter call for synchronous test
      const result = (component as any).filterInterCodes('INT001');
      expect(result.length).toBe(1);
      expect(result[0].interCode).toBe('INT001');
    });

    it('should filter inter codes by search term on description', () => {
      const result = (component as any).filterInterCodes('Hold');
      expect(result.length).toBe(1);
      expect(result[0].interDesc).toBe('Hold Type 1');
    });

    it('should return all codes when search is empty', () => {
      const result = (component as any).filterInterCodes('');
      expect(result.length).toBe(2);
    });
  });

  describe('getInterCodeDisplay', () => {
    it('should format display string', () => {
      fixture.detectChanges();

      const result = component.getInterCodeDisplay(mockInterdictionCodes[0]);
      expect(result).toBe('INT001 - Hold Type 1');
    });
  });
});
