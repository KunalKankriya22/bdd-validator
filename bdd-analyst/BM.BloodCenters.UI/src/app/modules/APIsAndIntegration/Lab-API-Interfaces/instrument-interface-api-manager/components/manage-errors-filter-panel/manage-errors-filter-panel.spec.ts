import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ManageErrorsFilterPanel, ManageErrorsFilterValue } from './manage-errors-filter-panel';

describe('ManageErrorsFilterPanel', () => {
  let component: ManageErrorsFilterPanel;
  let fixture: ComponentFixture<ManageErrorsFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ManageErrorsFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(ManageErrorsFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize the form with null values when no currentFilters provided', () => {
    fixture.detectChanges();

    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('machineTestId')?.value).toBeNull();
    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('termDate')?.value).toBeNull();
  });

  it('should initialize the form with currentFilters when provided', () => {
    const filters: ManageErrorsFilterValue = {
      machineTestId: 'TEST-01',
      effDatePeriod: 'after',
      effDate: new Date(2025, 0, 1),
      termDatePeriod: 'before',
      termDate: new Date(2025, 11, 31)
    };
    component.currentFilters = filters;
    fixture.detectChanges();

    expect(component.filterForm.get('machineTestId')?.value).toBe('TEST-01');
    expect(component.filterForm.get('effDatePeriod')?.value).toBe('after');
    expect(component.filterForm.get('effDate')?.value).toEqual(new Date(2025, 0, 1));
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({
      machineTestId: 'MT-100',
      effDatePeriod: 'after',
      effDate: new Date(2025, 5, 15),
      termDatePeriod: null,
      termDate: null
    });

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      machineTestId: 'MT-100',
      effDatePeriod: 'after'
    }));
  });

  it('should not emit apply when form is invalid', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    // Set a date without a period to trigger validation error
    component.filterForm.patchValue({ effDate: new Date(), effDatePeriod: null });
    component.onApply();

    expect(component.apply.emit).not.toHaveBeenCalled();
  });

  it('should reset form values on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({
      machineTestId: 'MT-100',
      effDatePeriod: 'after',
      effDate: new Date()
    });

    component.onClear();

    expect(component.filterForm.get('machineTestId')?.value).toBeNull();
    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');

    component.onClose();

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should set hasActiveFilters to true when machineTestId is set', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ machineTestId: 'ID-1' });

    expect(component.hasActiveFilters).toBeTrue();
  });

  it('should set hasActiveFilters to false when all controls are empty', () => {
    fixture.detectChanges();
    component.onClear();

    expect(component.hasActiveFilters).toBeFalse();
  });

  it('should filter machineTestIds based on search input', () => {
    component.machineTestIds = ['ABC-001', 'DEF-002', 'ABC-003'];
    fixture.detectChanges();

    component.machineTestIdSearchControl.setValue('ABC');

    const filtered = component.filteredMachineTestIds();
    expect(filtered.length).toBe(2);
    expect(filtered).toContain('ABC-001');
    expect(filtered).toContain('ABC-003');
  });

  it('should detect hasChanges when form differs from snapshot', () => {
    fixture.detectChanges();
    expect(component.hasChanges).toBeFalse();

    component.filterForm.patchValue({ machineTestId: 'NEW-ID' });
    expect(component.hasChanges).toBeTrue();
  });
});
