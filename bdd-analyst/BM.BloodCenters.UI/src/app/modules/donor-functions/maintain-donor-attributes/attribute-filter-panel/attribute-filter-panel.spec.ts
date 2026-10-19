import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { AttributeFilterPanel } from './attribute-filter-panel';
import { AttributeFilters } from '../models/maintain-donor-attributes.models';
import moment from 'moment';

describe('AttributeFilterPanel', () => {
  let component: AttributeFilterPanel;
  let fixture: ComponentFixture<AttributeFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AttributeFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AttributeFilterPanel);
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
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effDate')?.value).toBeNull();
      expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('termDate')?.value).toBeNull();
    });

    it('should populate form from currentFilters input', () => {
      const filters: AttributeFilters = {
        showTerminated: true,
        effDatePeriod: 'after',
        effDate: '2025-01-15T00:00:00.000Z',
        termDatePeriod: undefined,
        termDate: undefined
      };
      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('showTerminated')?.value).toBeTrue();
      expect(component.filterForm.get('effDatePeriod')?.value).toBe('after');
    });

    it('should have period options with after and before', () => {
      fixture.detectChanges();

      expect(component.periodOptions).toEqual([
        { value: 'after', display: 'After' },
        { value: 'before', display: 'Before' }
      ]);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values with showTerminated on apply', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ showTerminated: true });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        showTerminated: true
      }));
    });

    it('should emit date filters when both date and period are set', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effDatePeriod: 'after',
        effDate: moment('2025-06-15')
      });
      component.onApply();

      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.effDatePeriod).toBe('after');
      expect(emitted.effDate).toBeTruthy();
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls on clear', () => {
      component.filterForm.patchValue({
        showTerminated: true,
        effDatePeriod: 'after',
        effDate: moment(),
        termDatePeriod: 'before',
        termDate: moment()
      });

      component.onClear();

      expect(component.filterForm.get('showTerminated')?.value).toBeFalse();
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effDate')?.value).toBeNull();
      expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('termDate')?.value).toBeNull();
    });

    it('should reset validation flags on clear', () => {
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;
      component.effectiveDateRequired = true;
      component.terminationDateRequired = true;

      component.onClear();

      expect(component.effectivePeriodRequired).toBeFalse();
      expect(component.terminationPeriodRequired).toBeFalse();
      expect(component.effectiveDateRequired).toBeFalse();
      expect(component.terminationDateRequired).toBeFalse();
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

    it('should be enabled when showTerminated is true', () => {
      component.filterForm.patchValue({ showTerminated: true });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when period is required but missing', () => {
      component.effectivePeriodRequired = true;

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when date has format error', () => {
      component.filterForm.patchValue({ showTerminated: true });
      component.filterForm.get('effDate')?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set effectivePeriodRequired when date is set without period', () => {
      component.filterForm.patchValue({
        effDate: moment(),
        effDatePeriod: null
      });

      component.validateEffectivePeriod();

      expect(component.effectivePeriodRequired).toBeTrue();
    });

    it('should set effectiveDateRequired when period is set without date', () => {
      component.filterForm.patchValue({
        effDatePeriod: 'after',
        effDate: null
      });

      component.validateEffectivePeriod();

      expect(component.effectiveDateRequired).toBeTrue();
    });

    it('should clear flags when both date and period are set', () => {
      component.filterForm.patchValue({
        effDate: moment(),
        effDatePeriod: 'after'
      });

      component.validateEffectivePeriod();

      expect(component.effectivePeriodRequired).toBeFalse();
      expect(component.effectiveDateRequired).toBeFalse();
    });

    it('should validate termination period the same way', () => {
      component.filterForm.patchValue({
        termDate: moment(),
        termDatePeriod: null
      });

      component.validateTerminationPeriod();

      expect(component.terminationPeriodRequired).toBeTrue();
    });
  });
});
