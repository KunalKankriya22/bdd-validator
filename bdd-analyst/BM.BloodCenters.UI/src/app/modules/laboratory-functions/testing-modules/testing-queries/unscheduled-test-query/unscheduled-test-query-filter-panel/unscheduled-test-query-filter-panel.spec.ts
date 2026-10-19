import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  UnscheduledTestQueryFilterPanel,
  UnscheduledTestFilterValue,
} from './unscheduled-test-query-filter-panel';

describe('UnscheduledTestQueryFilterPanel', () => {
  let component: UnscheduledTestQueryFilterPanel;
  let fixture: ComponentFixture<UnscheduledTestQueryFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnscheduledTestQueryFilterPanel, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(UnscheduledTestQueryFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

    it('should initialize form with default null values', () => {
    fixture.detectChanges();
      const raw = component.form.getRawValue();
      expect(raw.reactive).toBeNull();
      expect(raw.ntsFlag).toBeNull();
      expect(raw.showCancel).toBeNull();
    });

    it('should populate form with currentFilters input', () => {
      component.currentFilters = { reactive: 'Y', ntsFlag: 'Y', showCancel: null };
      fixture.detectChanges();

      const raw = component.form.getRawValue();
      expect(raw.reactive).toBe('Y');
      expect(raw.ntsFlag).toBe('Y');
      expect(raw.showCancel).toBeNull();
  });

    it('should handle null currentFilters gracefully', () => {
      component.currentFilters = null as any;
    fixture.detectChanges();

      const raw = component.form.getRawValue();
      expect(raw.reactive).toBeNull();
      expect(raw.ntsFlag).toBeNull();
      expect(raw.showCancel).toBeNull();
  });
  });

  describe('isApplyDisabled', () => {
    it('should return true when form values match initial values', () => {
      component.currentFilters = { reactive: 'Y', ntsFlag: null, showCancel: null };
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when form values differ from initial', () => {
      component.currentFilters = { reactive: null, ntsFlag: null, showCancel: null };
      fixture.detectChanges();

      component.form.get('reactive')?.setValue('Y');
      expect(component.isApplyDisabled).toBeFalse();
  });

    it('should return true after changing back to initial values', () => {
      component.currentFilters = { reactive: null, ntsFlag: null, showCancel: null };
    fixture.detectChanges();
    component.form.patchValue({ reactive: 'Y', ntsFlag: 'Y' });

      component.form.get('reactive')?.setValue('Y');
      expect(component.isApplyDisabled).toBeFalse();

      component.form.get('reactive')?.setValue(null);
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('isClearDisabled', () => {
    it('should return true when all fields are null', () => {
      fixture.detectChanges();
      expect(component.isClearDisabled).toBeTrue();
    });

    it('should return false when reactive has a value', () => {
      fixture.detectChanges();
      component.form.get('reactive')?.setValue('Y');
      expect(component.isClearDisabled).toBeFalse();
    });

    it('should return false when ntsFlag has a value', () => {
      fixture.detectChanges();
      component.form.get('ntsFlag')?.setValue('Y');
      expect(component.isClearDisabled).toBeFalse();
    });

    it('should return false when showCancel has a value', () => {
      fixture.detectChanges();
      component.form.get('showCancel')?.setValue('Y');
      expect(component.isClearDisabled).toBeFalse();
    });
  });

  describe('onApply()', () => {
    it('should emit form values via apply output', () => {
    fixture.detectChanges();
      component.form.patchValue({ reactive: 'Y', ntsFlag: null, showCancel: 'Y' });

      let emitted: UnscheduledTestFilterValue | undefined;
      component.apply.subscribe((v) => (emitted = v));

      component.onApply();

      expect(emitted).toBeDefined();
      expect(emitted!.reactive).toBe('Y');
      expect(emitted!.ntsFlag).toBeNull();
      expect(emitted!.showCancel).toBe('Y');
  });

    it('should emit all-null when no changes made', () => {
    fixture.detectChanges();

      let emitted: UnscheduledTestFilterValue | undefined;
      component.apply.subscribe((v) => (emitted = v));

      component.onApply();

      expect(emitted).toBeDefined();
      expect(emitted!.reactive).toBeNull();
      expect(emitted!.ntsFlag).toBeNull();
      expect(emitted!.showCancel).toBeNull();
    });
  });

  describe('onClear()', () => {
    it('should reset all form fields to null', () => {
    fixture.detectChanges();
      component.form.patchValue({ reactive: 'Y', ntsFlag: 'Y', showCancel: 'Y' });

      component.onClear();

      const raw = component.form.getRawValue();
      expect(raw.reactive).toBeNull();
      expect(raw.ntsFlag).toBeNull();
      expect(raw.showCancel).toBeNull();
  });

    it('should not emit any events', () => {
    fixture.detectChanges();
      component.form.patchValue({ reactive: 'Y', ntsFlag: 'Y', showCancel: 'Y' });

      let applyEmitted = false;
      let closeEmitted = false;
      component.apply.subscribe(() => (applyEmitted = true));
      component.close.subscribe(() => (closeEmitted = true));

      component.onClear();

      expect(applyEmitted).toBeFalse();
      expect(closeEmitted).toBeFalse();
    });
  });

  describe('onClose()', () => {
    it('should emit close event', () => {
    fixture.detectChanges();

      let closeEmitted = false;
      component.close.subscribe(() => (closeEmitted = true));

      component.onClose();

      expect(closeEmitted).toBeTrue();
    });
  });

  describe('dropdown options', () => {
    it('should have reactiveOptions with Y value', () => {
      expect(component.reactiveOptions.length).toBe(1);
      expect(component.reactiveOptions[0].value).toBe('Y');
      expect(component.reactiveOptions[0].label).toBe('Reactive Only');
    });

    it('should have ntsFlagOptions with Y value', () => {
      expect(component.ntsFlagOptions.length).toBe(1);
      expect(component.ntsFlagOptions[0].value).toBe('Y');
    });

    it('should have showCancelOptions with Y value', () => {
      expect(component.showCancelOptions.length).toBe(1);
      expect(component.showCancelOptions[0].value).toBe('Y');
    });
  });
});
