import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { StorageDeviceFilterPanel } from './storage-device-filter-panel';
import { StorageDeviceFilterValue, LovOption } from '../models/storage-device.model';
import { StorageDeviceService } from '../services/storage-device.service';

describe('StorageDeviceFilterPanel', () => {
  let component: StorageDeviceFilterPanel;
  let fixture: ComponentFixture<StorageDeviceFilterPanel>;
  let mockService: jasmine.SpyObj<StorageDeviceService>;

  const mockDeviceTypes: LovOption[] = [
    { code: 'FRIDGE', description: 'Refrigerator' },
    { code: 'FREEZER', description: 'Freezer' }
  ];

  const mockStatusCodes: LovOption[] = [
    { code: 'ACTIVE', description: 'Active' },
    { code: 'INACTIVE', description: 'Inactive' }
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('StorageDeviceService', [
      'getFilterDeviceTypes',
      'getFilterStatusCodes'
    ]);
    mockService.getFilterDeviceTypes.and.returnValue(of({ data: mockDeviceTypes } as any));
    mockService.getFilterStatusCodes.and.returnValue(of({ data: mockStatusCodes } as any));

    await TestBed.configureTestingModule({
      imports: [
        StorageDeviceFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: StorageDeviceService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StorageDeviceFilterPanel);
    component = fixture.componentInstance;
    component.warehouseId = 'WH01';
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('deviceType')?.value).toBeNull();
      expect(component.filterForm.get('statusCode')?.value).toBeNull();
      expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should populate form from currentFilters', () => {
      component.currentFilters = {
        deviceType: 'FRIDGE',
        statusCode: 'ACTIVE',
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('deviceType')?.value).toBe('FRIDGE');
      expect(component.filterForm.get('statusCode')?.value).toBe('ACTIVE');
    });

    it('should load filter options from service', () => {
      fixture.detectChanges();

      expect(mockService.getFilterDeviceTypes).toHaveBeenCalledWith('WH01');
      expect(mockService.getFilterStatusCodes).toHaveBeenCalledWith('WH01');
      expect(component.deviceTypeOptions()).toEqual(mockDeviceTypes);
      expect(component.statusCodeOptions()).toEqual(mockStatusCodes);
    });

    it('should handle service errors gracefully', () => {
      mockService.getFilterDeviceTypes.and.returnValue(throwError(() => new Error('fail')));
      mockService.getFilterStatusCodes.and.returnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();

      expect(component.deviceTypeOptions()).toEqual([]);
      expect(component.statusCodeOptions()).toEqual([]);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values on apply', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ deviceType: 'FRIDGE' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        deviceType: 'FRIDGE',
        statusCode: null
      }));
    });

    it('should not emit when form has errors', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });
      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls on clear', () => {
      component.filterForm.patchValue({
        deviceType: 'FRIDGE',
        statusCode: 'ACTIVE'
      });

      component.onClear();

      expect(component.filterForm.get('deviceType')?.value).toBeNull();
      expect(component.filterForm.get('statusCode')?.value).toBeNull();
      expect(component.filterForm.get('effectivePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.errors).toBeNull();
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

    it('should be enabled when deviceType is set', () => {
      component.filterForm.patchValue({ deviceType: 'FRIDGE' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when date format errors exist', () => {
      component.filterForm.patchValue({ deviceType: 'FRIDGE' });
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when period is set without date', () => {
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Date Error Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return effective date invalid error', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return termination date invalid error', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    });

    it('should return empty string when untouched', () => {
      expect(component.getEffectiveDateError()).toBe('');
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('Search Controls', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter device types by search term', () => {
      component.deviceTypeSearchControl.setValue('fridge');

      const filtered = component.filteredDeviceTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('FRIDGE');
    });

    it('should filter status codes by search term', () => {
      component.statusCodeSearchControl.setValue('inact');

      const filtered = component.filteredStatusCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('INACTIVE');
    });

    it('should show all options when search is empty', () => {
      component.deviceTypeSearchControl.setValue('');

      expect(component.filteredDeviceTypes().length).toBe(2);
    });
  });
});
