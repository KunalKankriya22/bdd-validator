import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TestingContractFilterPanelComponent } from './testing-contract-filter-panel';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';

describe('TestingContractFilterPanelComponent', () => {
  let component: TestingContractFilterPanelComponent;
  let fixture: ComponentFixture<TestingContractFilterPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TestingContractFilterPanelComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(TestingContractFilterPanelComponent);
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
      contractId: 'TC001',
      contractType: 'STANDARD',
      effDatePeriod: 'After',
      effDate: null,
      termDatePeriod: null,
      termDate: null
    };
    fixture.detectChanges();

    expect(component.filterForm.get('contractId')?.value).toBe('TC001');
    expect(component.filterForm.get('contractType')?.value).toBe('STANDARD');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ contractId: 'TC002', contractType: 'PREMIUM' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      contractId: 'TC002',
      contractType: 'PREMIUM'
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
    component.filterForm.patchValue({ contractId: 'TC001' });

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

  it('should return true for hasValidationErrors when period is invalid', () => {
    fixture.detectChanges();
    component.filterForm.get('effDatePeriod')?.setErrors({ required: true });

    expect(component.hasValidationErrors).toBeTrue();
  });

  it('should filter contracts based on search input', () => {
    component.contracts = [
      { contractId: 'TC001', description: 'ABC Testing' },
      { contractId: 'TC002', description: 'XYZ Testing' }
    ] as any[];
    fixture.detectChanges();

    component.contractSearchCtrl.setValue('xyz');

    expect(component.filteredContracts.length).toBe(1);
    expect(component.filteredContracts[0].contractId).toBe('TC002');
  });

  it('should filter contract types based on search input', () => {
    component.contractTypes = [
      { code: 'STD', description: 'Standard' },
      { code: 'PRE', description: 'Premium' }
    ] as any[];
    fixture.detectChanges();

    component.contractTypeSearchCtrl.setValue('prem');

    expect(component.filteredContractTypes.length).toBe(1);
    expect(component.filteredContractTypes[0].code).toBe('PRE');
  });
});
