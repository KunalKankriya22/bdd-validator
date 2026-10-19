import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ReagentFilterPanel } from './reagent-filter-panel';
import { ReagentFilterValue } from '../models/commit-reagents-for-component.model';

describe('ReagentFilterPanel', () => {
  let component: ReagentFilterPanel;
  let fixture: ComponentFixture<ReagentFilterPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [ReagentFilterPanel, NoopAnimationsModule, HttpClientTestingModule],
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ReagentFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ── Initialization ──────────────────────────────────────────────────────────

  describe('Initialization', () => {

    it('should initialize filterForm with null values', () => {
      expect(component.filterForm.get('period')?.value).toBeNull();
      expect(component.filterForm.get('expirationDate')?.value).toBeNull();
    });

    it('should expose period options', () => {
      expect(component.periodOptions.length).toBe(3);
      const values = component.periodOptions.map(o => o.value);
      expect(values).toContain('after');
      expect(values).toContain('before');
      expect(values).toContain('on');
    });
  });

  // ── Pre-fill from currentFilters ────────────────────────────────────────────

  describe('currentFilters input', () => {
    it('should pre-fill form when currentFilters is provided', () => {
      const filters: ReagentFilterValue = { period: 'after', expirationDate: '2025-06-15T00:00:00Z' };
      component.currentFilters = filters;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.filterForm.get('period')?.value).toBe('after');
      expect(component.filterForm.get('expirationDate')?.value).toBeTruthy();
    });
  });

  // ── isApplyDisabled ─────────────────────────────────────────────────────────

  describe('isApplyDisabled', () => {

    it('should be true when only period is set (no date)', () => {
      component.filterForm.patchValue({ period: 'after', expirationDate: null });
      component.validatePeriod();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be true when only date is set (no period)', () => {
      component.filterForm.patchValue({ period: null, expirationDate: new Date() });
      component.validatePeriod();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be false when both period and date are set', () => {
      component.filterForm.patchValue({ period: 'after', expirationDate: new Date() });
      component.validatePeriod();
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  // ── validatePeriod ──────────────────────────────────────────────────────────

  describe('validatePeriod', () => {
    it('should set periodRequired when date is set but period is not', () => {
      component.filterForm.patchValue({ period: null, expirationDate: new Date() });
      component.validatePeriod();
      expect(component.periodRequired).toBeTrue();
      expect(component.dateRequired).toBeFalse();
    });

    it('should set dateRequired when period is set but date is not', () => {
      component.filterForm.patchValue({ period: 'before', expirationDate: null });
      component.validatePeriod();
      expect(component.dateRequired).toBeTrue();
      expect(component.periodRequired).toBeFalse();
    });

    it('should clear both flags when both are set', () => {
      component.filterForm.patchValue({ period: 'on', expirationDate: new Date() });
      component.validatePeriod();
      expect(component.periodRequired).toBeFalse();
      expect(component.dateRequired).toBeFalse();
    });
  });

  // ── onApply ─────────────────────────────────────────────────────────────────

  describe('onApply', () => {
    it('should emit apply event with correct ReagentFilterValue', () => {
      const applySpy = jasmine.createSpy('apply');
      component.apply.subscribe(applySpy);
      const date = new Date(2025, 5, 15);
      component.filterForm.patchValue({ period: 'after', expirationDate: date });

      component.onApply();

      expect(applySpy).toHaveBeenCalled();
      const emitted: ReagentFilterValue = applySpy.calls.mostRecent().args[0];
      expect(emitted.period).toBe('after');
      expect(emitted.expirationDate).toBeTruthy();
    });

  });

  // ── onClearAll ───────────────────────────────────────────────────────────────

  describe('onClearAll', () => {

    it('should clear validation flags', () => {
      component.periodRequired = true;
      component.dateRequired = true;
      component.onClearAll();

      expect(component.periodRequired).toBeFalse();
      expect(component.dateRequired).toBeFalse();
    });
  });

  // ── onClose ──────────────────────────────────────────────────────────────────
});
