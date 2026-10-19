import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ValidReagentCodeFilterPanel } from './valid-reagent-code-filter-panel';
import { ValidReagentCodeService } from '../services/valid-reagent-code.service';

describe('ValidReagentCodeFilterPanel', () => {
  let component: ValidReagentCodeFilterPanel;
  let fixture: ComponentFixture<ValidReagentCodeFilterPanel>;
  let mockService: jasmine.SpyObj<ValidReagentCodeService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ValidReagentCodeService', [
      'getReagentTypesLov',
      'getControlFlagsLov'
    ]);
    mockService.getReagentTypesLov.and.returnValue(of([]));
    mockService.getControlFlagsLov.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [
        ValidReagentCodeFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ValidReagentCodeService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(ValidReagentCodeFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('showTerminated')?.value).toBeNull();
    expect(component.filterForm.get('reagentType')?.value).toBeNull();
    expect(component.filterForm.get('controlFlag')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDateAfter')?.value).toBeNull();
  });

  it('should emit apply and close events on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');
    spyOn(component.close, 'emit');

    component.filterForm.patchValue({ showTerminated: 'Y' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should reset form and validation flags on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ reagentType: 'R' });
    component.effPeriodRequired = true;

    component.onClear();

    expect(component.filterForm.get('reagentType')?.value).toBeNull();
    expect(component.effPeriodRequired).toBeFalse();
    expect(component.termPeriodRequired).toBeFalse();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should enable controlFlag when reagentType is C', () => {
    fixture.detectChanges();

    component.filterForm.get('reagentType')?.setValue('C');

    expect(component.filterForm.get('controlFlag')?.enabled).toBeTrue();
  });

  it('should disable controlFlag when reagentType is not C', () => {
    fixture.detectChanges();

    component.filterForm.get('reagentType')?.setValue('R');

    expect(component.filterForm.get('controlFlag')?.disabled).toBeTrue();
    expect(component.filterForm.get('controlFlag')?.value).toBeNull();
  });

  it('should load dropdown data from service', () => {
    const reagentTypes = [{ code: 'R', description: 'Regular' }];
    const controlFlags = [{ code: 'C', description: 'Control' }];
    mockService.getReagentTypesLov.and.returnValue(of(reagentTypes));
    mockService.getControlFlagsLov.and.returnValue(of(controlFlags));

    fixture.detectChanges();

    expect(component.reagentTypes).toEqual(reagentTypes as any);
    expect(component.controlFlags).toEqual(controlFlags as any);
    expect(component.isLoadingDropdowns).toBeFalse();
  });

  it('should set effPeriodRequired when date is set without period', () => {
    fixture.detectChanges();

    component.filterForm.get('effectiveDateAfter')?.setValue(new Date(2025, 0, 1));
    component.validateEffPeriod();

    expect(component.effPeriodRequired).toBeTrue();
  });

  it('should return true for isApplyDisabled when no filters are set', () => {
    fixture.detectChanges();
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should not require effPeriod when no date is set', () => {
    fixture.detectChanges();

    component.filterForm.get('effectiveDateAfter')?.setValue(null);
    component.validateEffPeriod();

    expect(component.effPeriodRequired).toBeFalse();
  });

  it('should set termPeriodRequired when term date is set without period', () => {
    fixture.detectChanges();

    component.filterForm.get('terminationDateAfter')?.setValue(new Date(2025, 6, 1));
    component.validateTermPeriod();

    expect(component.termPeriodRequired).toBeTrue();
  });

  it('should not require termPeriod when no date is set', () => {
    fixture.detectChanges();

    component.filterForm.get('terminationDateAfter')?.setValue(null);
    component.validateTermPeriod();

    expect(component.termPeriodRequired).toBeFalse();
  });

  it('should return false for isApplyDisabled when showTerminated is set', () => {
    fixture.detectChanges();

    component.filterForm.patchValue({ showTerminated: 'Y' });

    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should return false for isApplyDisabled when reagentType is set', () => {
    fixture.detectChanges();

    component.filterForm.patchValue({ reagentType: 'R' });

    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should return reagent type display text', () => {
    fixture.detectChanges();
    component.reagentTypes = [
      { code: 'R', description: 'Reagent' },
      { code: 'C', description: 'Control' }
    ] as any;

    expect(component.getReagentTypeDisplay('R')).toBe('R - Reagent');
    expect(component.getReagentTypeDisplay('C')).toBe('C - Control');
    expect(component.getReagentTypeDisplay('X')).toBe('X');
  });

  it('should return control flag display text', () => {
    fixture.detectChanges();
    component.controlFlags = [
      { code: 'P', description: 'Positive' },
      { code: 'N', description: 'Negative' }
    ] as any;

    expect(component.getControlFlagDisplay('P')).toBe('P - Positive');
    expect(component.getControlFlagDisplay('N')).toBe('N - Negative');
    expect(component.getControlFlagDisplay('X')).toBe('X');
  });

  it('should handle dropdown load error gracefully', () => {
    mockService.getReagentTypesLov.and.returnValue(throwError(() => new Error('API error')));
    mockService.getControlFlagsLov.and.returnValue(throwError(() => new Error('API error')));

    fixture.detectChanges();

    expect(component.isLoadingDropdowns).toBeFalse();
  });

  it('should clear controlFlag when reagentType is cleared', () => {
    fixture.detectChanges();

    component.filterForm.get('reagentType')?.setValue('C');
    component.filterForm.get('controlFlag')?.setValue('P');

    component.filterForm.get('reagentType')?.setValue(null);

    expect(component.filterForm.get('controlFlag')?.value).toBeNull();
    expect(component.filterForm.get('controlFlag')?.disabled).toBeTrue();
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      testId: 'ABORh',
      testDesc: 'ABO',
      showTerminated: 'Y',
      reagentType: 'R',
      controlFlag: null,
      effectiveDatePeriod: null,
      effectiveDateAfter: null,
      effectiveDateBefore: null,
      terminationDatePeriod: null,
      terminationDateAfter: null,
      terminationDateBefore: null
    };

    fixture.detectChanges();

    expect(component.filterForm.get('showTerminated')?.value).toBe('Y');
    expect(component.filterForm.get('reagentType')?.value).toBe('R');
  });
});
