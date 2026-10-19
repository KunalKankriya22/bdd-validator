import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { DriveProfileFilterPanel } from './drive-profile-filter-panel';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';

describe('DriveProfileFilterPanel', () => {
  let component: DriveProfileFilterPanel;
  let fixture: ComponentFixture<DriveProfileFilterPanel>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getDriveProfileTypes',
      'getCodes'
    ]);

    mockService.getDriveProfileTypes.and.returnValue(of([
      { code: 'ALYX', description: 'ALYX Desc' },
      { code: 'BP', description: 'Blood Pressure' }
    ]));
    mockService.getCodes.and.returnValue(of([
      { code: '500', description: '500gm weight' },
      { code: '1000', description: '1000gm weight' }
    ]));



      TestBed.configureTestingModule({
      imports: [DriveProfileFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: DriveEquipmentParametersService, useValue: mockService }
      ]
    });


    


      mockService.getDriveProfileTypes.calls.reset();


      mockService.getCodes.calls.reset();


    fixture = TestBed.createComponent(DriveProfileFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });
  describe('Filter Functionality', () => {
    it('should disable Apply when no filters selected', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable Apply when a filter is selected', () => {
      component.form.patchValue({ driveProfileType: 'ALYX' });

      expect(component.isApplyDisabled).toBeFalse();
    });






  });

  describe('Date Period Validation', () => {
    it('should show error when date is selected without period', () => {
      component.form.patchValue({ effDate: new Date() });
      component.form.updateValueAndValidity();

      expect(component.hasEffDateError()).toBeTrue();
      expect(component.getEffDateError()).toBe('Period is required');
    });

    it('should not show error when both date and period are selected', () => {
      component.form.patchValue({
        effDate: new Date(),
        effDatePeriod: 'After'
      });
      component.form.updateValueAndValidity();

      expect(component.hasEffDateError()).toBeFalse();
    });
  });

  describe('Searchable Dropdowns', () => {
    it('should have search controls initialized', () => {
      expect(component.driveProfileTypeSearchCtrl).toBeDefined();
      expect(component.codeSearchCtrl).toBeDefined();
    });





    it('should search by description as well', () => {
      component.codeSearchCtrl.setValue('weight');

      const filtered = component.filteredCodes();
      expect(filtered.length).toBe(2);
    });

    it('should return all items when search is empty', () => {
      component.driveProfileTypeSearchCtrl.setValue('');

      const filtered = component.filteredDriveProfileTypes();
      expect(filtered.length).toBe(2);
    });


  });
});
