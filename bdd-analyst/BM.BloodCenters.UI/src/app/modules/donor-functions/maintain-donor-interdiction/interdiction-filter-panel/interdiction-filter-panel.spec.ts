import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InterdictionFilterPanel } from './interdiction-filter-panel';
import { InterdictionFilters } from '../models/maintain-donor-interdiction.models';
import moment from 'moment';

describe('InterdictionFilterPanel', () => {
  let component: InterdictionFilterPanel;
  let fixture: ComponentFixture<InterdictionFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InterdictionFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InterdictionFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('showTerminated')?.value).toBeFalse();
      expect(component.filterForm.get('userId')?.value).toBe('');
      expect(component.filterForm.get('originated')?.value).toBe('');
      expect(component.filterForm.get('groupMode')?.value).toBe('');
      expect(component.filterForm.get('groupId')?.value).toBe('');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should populate form from currentFilters input', () => {
      component.currentFilters = {
        showTerminated: true,
        userId: 'USER1',
        originated: 'SYSTEM'
      };
      fixture.detectChanges();

      expect(component.filterForm.get('showTerminated')?.value).toBeTrue();
      expect(component.filterForm.get('userId')?.value).toBe('USER1');
      expect(component.filterForm.get('originated')?.value).toBe('SYSTEM');
    });

    it('should accept dropdown options via inputs', () => {
      component.userIdOptions = ['USER1', 'USER2'];
      component.originatedOptions = ['SYSTEM', 'MANUAL'];
      component.groupModeOptions = ['MODE1'];
      component.groupIdOptions = ['GRP1'];
      fixture.detectChanges();

      expect(component.userIdOptions.length).toBe(2);
      expect(component.originatedOptions.length).toBe(2);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values on applyFilter', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        showTerminated: true,
        userId: 'USER1'
      });

      component.applyFilter();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        showTerminated: true,
        userId: 'USER1'
      }));
    });

    it('should include date filters when both date and period are set', () => {
      spyOn(component.apply, 'emit');

      const testDate = moment('2025-06-15');
      component.filterForm.patchValue({
        showTerminated: true,
        effectiveDate: testDate,
        effectiveDatePeriod: 'After'
      });

      component.applyFilter();

      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.effectiveDatePeriod).toBe('After');
      expect(emitted.effectiveDate).toBeTruthy();
    });

    it('should not include date filters when period is missing', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        showTerminated: true,
        effectiveDate: moment('2025-06-15'),
        effectiveDatePeriod: null
      });

      component.applyFilter();

      // Should show period error and not emit
      expect(component.showEffectiveDatePeriodError).toBeTrue();
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls on clearAll', () => {
      component.filterForm.patchValue({
        showTerminated: true,
        userId: 'USER1',
        originated: 'SYSTEM'
      });

      component.clearAll();

      expect(component.filterForm.get('showTerminated')?.value).toBeFalse();
      expect(component.filterForm.get('userId')?.value).toBe('');
      expect(component.filterForm.get('originated')?.value).toBe('');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });

    it('should reset error flags', () => {
      component.showEffectiveDatePeriodError = true;
      component.showTerminationDatePeriodError = true;

      component.clearAll();

      expect(component.showEffectiveDatePeriodError).toBeFalse();
      expect(component.showTerminationDatePeriodError).toBeFalse();
    });
  });

  describe('Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.closePanel();

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

    it('should be enabled when showTerminated is true', () => {
      component.filterForm.patchValue({ showTerminated: true });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when userId is set', () => {
      component.filterForm.patchValue({ userId: 'USER1' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when date period is required but missing', () => {
      component.filterForm.patchValue({
        effectiveDate: moment(),
        effectiveDatePeriod: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Date Error Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return effective date invalid error', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return termination date invalid error', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return empty string when no errors and untouched', () => {
      expect(component.getEffectiveDateError()).toBe('');
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('Period Validation Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for effDatePeriodRequired when date is set without period', () => {
      component.filterForm.patchValue({
        effectiveDate: moment(),
        effectiveDatePeriod: null
      });

      expect(component.effDatePeriodRequired).toBeTrue();
    });

    it('should return false for effDatePeriodRequired when both set', () => {
      component.filterForm.patchValue({
        effectiveDate: moment(),
        effectiveDatePeriod: 'After'
      });

      expect(component.effDatePeriodRequired).toBeFalse();
    });

    it('should return true for termDatePeriodRequired when date is set without period', () => {
      component.filterForm.patchValue({
        terminationDate: moment(),
        terminationDatePeriod: null
      });

      expect(component.termDatePeriodRequired).toBeTrue();
    });
  });
});
