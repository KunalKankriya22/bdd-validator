import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SpecialProcessingFilterPanel } from './special-processing-filter-panel';

describe('SpecialProcessingFilterPanel', () => {
  let component: SpecialProcessingFilterPanel;
  let fixture: ComponentFixture<SpecialProcessingFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SpecialProcessingFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(SpecialProcessingFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('termDate')?.value).toBeNull();
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      effDatePeriod: 'after',
      effDate: '2025-01-01T00:00:00.000Z',
      termDatePeriod: 'before',
      termDate: '2025-12-31T00:00:00.000Z'
    } as any;
    fixture.detectChanges();

    expect(component.filterForm.get('effDatePeriod')?.value).toBe('after');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({
      effDatePeriod: 'after',
      effDate: new Date(2025, 5, 15),
      termDatePeriod: null,
      termDate: null
    });

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      effDatePeriod: 'after'
    }));
  });

  it('should reset form and validation flags on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ effDatePeriod: 'after', effDate: new Date() });
    component.effectivePeriodRequired = true;

    component.onClear();

    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.effectivePeriodRequired).toBeFalse();
    expect(component.terminationPeriodRequired).toBeFalse();
    expect(component.effectiveDateRequired).toBeFalse();
    expect(component.terminationDateRequired).toBeFalse();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should set effectivePeriodRequired when date is set without period', fakeAsync(() => {
    fixture.detectChanges();

    component.filterForm.patchValue({ effDate: new Date(2025, 0, 1), effDatePeriod: null });
    tick();

    component.validateEffectivePeriod();
    expect(component.effectivePeriodRequired).toBeTrue();
  }));

  it('should set effectiveDateRequired when period is set without date', () => {
    fixture.detectChanges();

    component.filterForm.patchValue({ effDatePeriod: 'after', effDate: null });
    component.validateEffectivePeriod();

    expect(component.effectiveDateRequired).toBeTrue();
  });

  it('should disable apply when validation requirements not met', () => {
    fixture.detectChanges();

    component.effectivePeriodRequired = true;
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should disable apply when no filters have complete values', () => {
    fixture.detectChanges();
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should have After and Before period options', () => {
    fixture.detectChanges();
    expect(component.periodOptions.length).toBe(2);
    expect(component.periodOptions.map(o => o.value)).toEqual(['after', 'before']);
    expect(component.periodOptions.map(o => o.display)).toEqual(['After', 'Before']);
  });

  it('should emit date in YYYY-MM-DD format', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({
      termDatePeriod: 'before',
      termDate: new Date(2025, 11, 31),
      effDatePeriod: null,
      effDate: null
    });

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      termDate: '2025-12-31'
    }));
  });
});
