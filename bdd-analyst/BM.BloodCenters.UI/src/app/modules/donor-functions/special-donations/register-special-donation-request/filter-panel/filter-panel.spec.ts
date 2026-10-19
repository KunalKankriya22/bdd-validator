import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SpecialDonationFilterPanel } from './filter-panel';
import { SpecialDonationFilterValue } from '../register-special-donation-request.models';
import { RegisterSpecialDonationRequestService } from '../register-special-donation-request.service';
import moment from 'moment';

describe('SpecialDonationFilterPanel', () => {
  let component: SpecialDonationFilterPanel;
  let fixture: ComponentFixture<SpecialDonationFilterPanel>;
  let mockService: jasmine.SpyObj<RegisterSpecialDonationRequestService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('RegisterSpecialDonationRequestService', [
      'getShipLocations',
      'getPatientStatuses'
    ]);
    mockService.getShipLocations.and.returnValue(of({
      data: [
        { shipId: 'SHIP1', shipLocnName: 'Location 1' },
        { shipId: 'SHIP2', shipLocnName: 'Location 2' }
      ]
    }));
    mockService.getPatientStatuses.and.returnValue(of([
      { code: 'A', description: 'Active' },
      { code: 'I', description: 'Inactive' }
    ]));

    await TestBed.configureTestingModule({
      imports: [
        SpecialDonationFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: RegisterSpecialDonationRequestService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialDonationFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('status')?.value).toBeNull();
      expect(component.filterForm.get('shipTo')?.value).toBeNull();
      expect(component.filterForm.get('surgeryDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('surgeryDate')?.value).toBeNull();
      expect(component.filterForm.get('neededByPeriod')?.value).toBeNull();
      expect(component.filterForm.get('neededBy')?.value).toBeNull();
    });

    it('should load ship locations from service', () => {
      fixture.detectChanges();

      expect(mockService.getShipLocations).toHaveBeenCalled();
      expect(component.shipToOptions.length).toBe(2);
    });

    it('should handle service error when loading ship locations', () => {
      mockService.getShipLocations.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.shipToOptions).toEqual([]);
    });

    it('should have status options with Active and Inactive', () => {
      fixture.detectChanges();

      expect(component.filteredStatusOptions()).toEqual([
        { value: '', label: 'All' },
        { value: 'A', label: 'Active' },
        { value: 'I', label: 'Inactive' }
      ]);
    });

    it('should have period options with after and before', () => {
      fixture.detectChanges();

      expect(component.periodOptions).toEqual([
        { value: 'after', label: 'After' },
        { value: 'before', label: 'Before' }
      ]);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values on apply with status', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ status: 'A' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        status: 'A',
        shipTo: null,
        surgeryDate: null,
        neededBy: null
      }));
    });

    it('should not emit when apply is disabled', () => {
      spyOn(component.apply, 'emit');

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should format dates for API when applying', () => {
      spyOn(component.apply, 'emit');

      const testDate = moment('2025-06-15');
      component.filterForm.patchValue({
        surgeryDatePeriod: 'after',
        surgeryDate: testDate
      });
      component.onApply();

      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.surgeryDate).toBe('2025-06-15');
      expect(emitted.surgeryDatePeriod).toBe('after');
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls on clear', () => {
      component.filterForm.patchValue({
        status: 'A',
        shipTo: 'SHIP1',
        surgeryDatePeriod: 'after',
        surgeryDate: moment()
      });

      component.onClear();

      expect(component.filterForm.get('status')?.value).toBeNull();
      expect(component.filterForm.get('shipTo')?.value).toBeNull();
      expect(component.filterForm.get('surgeryDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('surgeryDate')?.value).toBeNull();
      expect(component.filterForm.get('neededByPeriod')?.value).toBeNull();
      expect(component.filterForm.get('neededBy')?.value).toBeNull();
    });

    it('should reset search controls', () => {
      component.statusSearchControl.setValue('Active');
      component.shipToSearchControl.setValue('Location');

      component.onClear();

      expect(component.statusSearchControl.value).toBe('');
      expect(component.shipToSearchControl.value).toBe('');
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

    it('should be enabled when status is selected', () => {
      component.filterForm.patchValue({ status: 'A' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when surgery date is set without period', () => {
      component.filterForm.patchValue({
        surgeryDate: moment(),
        surgeryDatePeriod: null
      });
      // Trigger validation
      component.filterForm.get('surgeryDatePeriod')?.updateValueAndValidity();

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Period Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return period required error for surgery date', () => {
      const control = component.filterForm.get('surgeryDatePeriod');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getSurgeryDatePeriodError()).toBe('Period is required');
    });

    it('should return period required error for needed by', () => {
      const control = component.filterForm.get('neededByPeriod');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getNeededByPeriodError()).toBe('Period is required');
    });

    it('should return empty string when no period errors', () => {
      expect(component.getSurgeryDatePeriodError()).toBe('');
      expect(component.getNeededByPeriodError()).toBe('');
    });
  });

  describe('Date Error Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null when no date errors', () => {
      expect(component.getSurgeryDateError()).toBeNull();
      expect(component.getNeededByError()).toBeNull();
    });

    it('should return error for min date violation', () => {
      component.filterForm.get('surgeryDate')?.setErrors({ matDatepickerMin: true });

      expect(component.getSurgeryDateError()).toBe('Date is too early');
    });

    it('should return error for max date violation', () => {
      component.filterForm.get('neededBy')?.setErrors({ matDatepickerMax: true });

      expect(component.getNeededByError()).toBe('Date is too late');
    });
  });

  describe('Dropdown Closed Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear status search on dropdown close', () => {
      component.statusSearchControl.setValue('test');

      component.onStatusDropdownClosed();

      expect(component.statusSearchControl.value).toBe('');
    });

    it('should clear shipTo search on dropdown close', () => {
      component.shipToSearchControl.setValue('test');

      component.onShipToDropdownClosed();

      expect(component.shipToSearchControl.value).toBe('');
    });
  });
});
