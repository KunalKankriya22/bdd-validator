import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AdHocFilterPanelComponent } from './ad-hoc-filter-panel';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';

describe('AdHocFilterPanelComponent', () => {
  let component: AdHocFilterPanelComponent;
  let fixture: ComponentFixture<AdHocFilterPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AdHocFilterPanelComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(AdHocFilterPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('contractId')?.value).toBeNull();
    expect(component.filterForm.get('contractType')?.value).toBeNull();
    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('termDate')?.value).toBeNull();
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      contractId: 'C001',
      contractType: 'TYPE-A',
      effDatePeriod: 'After',
      effDate: null,
      termDatePeriod: null,
      termDate: null
    };
    fixture.detectChanges();

    expect(component.filterForm.get('contractId')?.value).toBe('C001');
    expect(component.filterForm.get('contractType')?.value).toBe('TYPE-A');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ contractId: 'C002', contractType: 'TYPE-B' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      contractId: 'C002',
      contractType: 'TYPE-B'
    }));
  });

  it('should not emit apply when isApplyDisabled is true', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.onApply();

    expect(component.apply.emit).not.toHaveBeenCalled();
  });

  it('should reset form on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ contractId: 'C001' });

    component.onClear();

    expect(component.filterForm.get('contractId')?.value).toBeNull();
    expect(component.filterForm.get('contractType')?.value).toBeNull();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should return true for isApplyDisabled when no values set', () => {
    fixture.detectChanges();
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return false for isApplyDisabled when contractId is set', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ contractId: 'C001' });
    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should set period validation error when date is set without period', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ effDate: new Date(2025, 0, 1), effDatePeriod: null });

    expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBeTrue();
  });

  it('should filter contracts based on search input', () => {
    component.contracts = [
      { contractId: 'C001', description: 'General Contract' },
      { contractId: 'C002', description: 'Special Contract' }
    ] as any[];
    fixture.detectChanges();

    component.contractSearchCtrl.setValue('special');

    expect(component.filteredContracts.length).toBe(1);
    expect(component.filteredContracts[0].contractId).toBe('C002');
  });
});
