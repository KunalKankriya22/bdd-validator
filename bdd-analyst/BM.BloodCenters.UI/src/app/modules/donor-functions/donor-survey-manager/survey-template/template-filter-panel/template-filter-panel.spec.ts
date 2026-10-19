import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { TemplateFilterPanel } from './template-filter-panel';

describe('TemplateFilterPanel', () => {
  let component: TemplateFilterPanel;
  let cdrSpy: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(() => {
    cdrSpy = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['markForCheck']);
    component = new TemplateFilterPanel(new FormBuilder(), cdrSpy);
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should require period when effective date is set', () => {
    const emitSpy = spyOn(component.apply, 'emit');

    component.filterForm.patchValue({
      effDate: new Date('2026-01-01'),
      effDatePeriod: null,
    });
    component.onApply();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.getEffDatePeriodError()).toBe('Period is required');
  });

  it('should emit normalized filters when form is valid', () => {
    const emitSpy = spyOn(component.apply, 'emit');

    component.filterForm.patchValue({
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: 'before',
      termDate: new Date('2026-02-01'),
    });

    component.onApply();

    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        effDatePeriod: 'after',
        termDatePeriod: 'before',
      })
    );
    expect(component.hasChanges).toBeFalse();
  });


  it('should clear all fields on clear', () => {
    component.filterForm.patchValue({
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: 'before',
      termDate: new Date('2026-02-01'),
    });

    component.onClear();

    expect(component.filterForm.value).toEqual({
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: null,
    });
  });

});
