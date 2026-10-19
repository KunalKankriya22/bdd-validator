import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { InitiateHospitalTransferFilterPanel, FilterValues, FilterOptions } from './initiate-hospital-transfer-filter-panel';

describe('InitiateHospitalTransferFilterPanel', () => {
  let component: InitiateHospitalTransferFilterPanel;
  let fixture: ComponentFixture<InitiateHospitalTransferFilterPanel>;

  const defaultOptions: FilterOptions = {
    aboRhOptions: ['O+', 'A+', 'B+'],
    requiredQtyOptions: ['1', '2', '3'],
    allocatedQtyOptions: ['0', '1', '2'],
    remainingQtyOptions: ['0', '1']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        InitiateHospitalTransferFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(InitiateHospitalTransferFilterPanel);
    component = fixture.componentInstance;
    component.options = defaultOptions;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with empty string values by default', () => {
    fixture.detectChanges();

    expect(component.filterForm.value.aboRh).toBe('');
    expect(component.filterForm.value.requiredQuantity).toBe('');
    expect(component.filterForm.value.allocatedQuantity).toBe('');
    expect(component.filterForm.value.remainingQuantity).toBe('');
  });

  it('should initialize with currentFilters when provided', () => {
    component.currentFilters = {
      aboRh: 'O+',
      requiredQuantity: '2',
      allocatedQuantity: '1',
      remainingQuantity: '1'
    };
    fixture.detectChanges();

    expect(component.filterForm.value.aboRh).toBe('O+');
    expect(component.filterForm.value.requiredQuantity).toBe('2');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({
      aboRh: 'A+',
      requiredQuantity: '3',
    });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith({
      aboRh: 'A+',
      requiredQuantity: '3',
      allocatedQuantity: '',
      remainingQuantity: ''
    });
  });

  it('should reset all values and emit clear on onClear', () => {
    fixture.detectChanges();
    spyOn(component.clear, 'emit');

    component.filterForm.patchValue({
      aboRh: 'B+',
      requiredQuantity: '1',
    });

    component.onClear();

    expect(component.filterForm.value.aboRh).toBe('');
    expect(component.filterForm.value.requiredQuantity).toBe('');
    expect(component.filterForm.value.allocatedQuantity).toBe('');
    expect(component.filterForm.value.remainingQuantity).toBe('');
    expect(component.clear.emit).toHaveBeenCalled();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should handle null currentFilters gracefully', () => {
    component.currentFilters = null;
    fixture.detectChanges();

    expect(component.filterForm.value.aboRh).toBe('');
    expect(component.filterForm.value.requiredQuantity).toBe('');
  });

  it('should handle partial currentFilters', () => {
    component.currentFilters = {
      aboRh: 'O+',
      requiredQuantity: '',
      allocatedQuantity: '',
      remainingQuantity: ''
    };
    fixture.detectChanges();

    expect(component.filterForm.value.aboRh).toBe('O+');
    expect(component.filterForm.value.requiredQuantity).toBe('');
  });

  it('should disable apply when no filters are set', () => {
    fixture.detectChanges();
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should enable apply when a filter is set', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ aboRh: 'O+' });
    expect(component.isApplyDisabled).toBeFalse();
  });
});
