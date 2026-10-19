import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { VehicleFilterPanel } from './vehicle-filter-panel';
import { VehicleDetailsService } from '../services/vehicle-details.service';

describe('VehicleFilterPanel', () => {
  let component: VehicleFilterPanel;
  let fixture: ComponentFixture<VehicleFilterPanel>;
  let mockService: jasmine.SpyObj<VehicleDetailsService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('VehicleDetailsService', [
      'getVehicleIds',
      'getVehicleTypes'
    ]);
    mockService.getVehicleIds.and.returnValue(of([
      { value: 'V001', label: 'Vehicle 001' },
      { value: 'V002', label: 'Vehicle 002' }
    ]));
    mockService.getVehicleTypes.and.returnValue(of([
      { value: 'BUS', label: 'Bus' },
      { value: 'VAN', label: 'Van' }
    ]));

    TestBed.configureTestingModule({
      imports: [VehicleFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: VehicleDetailsService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(VehicleFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.filterForm.value.vehicleId).toBeNull();
    expect(component.filterForm.value.vehicleType).toBeNull();
    expect(component.filterForm.value.showTerminated).toBeFalse();
    expect(component.filterForm.value.effectiveDatePeriod).toBeNull();
    expect(component.filterForm.value.effectiveDate).toBeNull();
  });

  it('should load vehicle IDs and types on init', () => {
    expect(mockService.getVehicleIds).toHaveBeenCalledWith(false);
    expect(mockService.getVehicleTypes).toHaveBeenCalledWith(false);
  });

  describe('isApplyDisabled', () => {
    it('should return true when no fields are populated', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when vehicleId is set', () => {
      component.filterForm.patchValue({ vehicleId: 'V001' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when vehicleType is set', () => {
      component.filterForm.patchValue({ vehicleType: 'BUS' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when showTerminated is true', () => {
      component.filterForm.patchValue({ showTerminated: true });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when date format errors exist', () => {
      component.filterForm.patchValue({ vehicleId: 'V001' });
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('onApply', () => {
    it('should emit apply with filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ vehicleId: 'V001', vehicleType: 'BUS' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          vehicleId: 'V001',
          vehicleType: 'BUS',
          showTerminated: false
        })
      );
    });

    it('should not emit when form is invalid', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.patchValue({ effectiveDate: new Date() });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    it('should reset form, search control, and interaction flag', () => {
      spyOn(component.clearAll, 'emit');

      component.filterForm.patchValue({ vehicleId: 'V001', vehicleType: 'BUS' });
      component.vehicleIdSearchControl.setValue('search');
      component.formInteracted = true;

      component.onClearAll();

      expect(component.filterForm.value.vehicleId).toBeNull();
      expect(component.filterForm.value.vehicleType).toBeNull();
      expect(component.vehicleIdSearchControl.value).toBe('');
      expect(component.formInteracted).toBeFalse();
      expect(component.clearAll.emit).toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('onShowTerminatedChange', () => {
    it('should reload dropdowns when showTerminated changes', () => {
      mockService.getVehicleIds.calls.reset();
      mockService.getVehicleTypes.calls.reset();

      component.onShowTerminatedChange();

      expect(mockService.getVehicleIds).toHaveBeenCalled();
      expect(mockService.getVehicleTypes).toHaveBeenCalled();
    });
  });

  describe('date validation', () => {
    it('should set period as required when effective date is set', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date() });
      tick();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();
    }));

    it('should clear period required when effective date is cleared', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date() });
      tick();
      component.filterForm.patchValue({ effectiveDate: null });
      tick();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBeFalsy();
    }));
  });

  describe('vehicle ID search', () => {
    it('should filter vehicle IDs by search term', fakeAsync(() => {
      component.vehicleIdSearchControl.setValue('001');
      tick();

      const filtered = component.filteredVehicleIds();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('V001');
    }));

    it('should return all vehicle IDs when search is empty', () => {
      component.vehicleIdSearchControl.setValue('');
      const filtered = component.filteredVehicleIds();
      expect(filtered.length).toBe(2);
    });
  });
});
