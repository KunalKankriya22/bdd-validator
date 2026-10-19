import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { QcDependencyFilterPanel } from './qc-dependency-filter-panel';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { QcDependencyModel } from '../../models/drive-equipment-parameters.model';

describe('QcDependencyFilterPanel', () => {
  let component: QcDependencyFilterPanel;
  let fixture: ComponentFixture<QcDependencyFilterPanel>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;

  const mockTableData: QcDependencyModel[] = [
    {
      deviceType: 'EQUIP',
      equipmentSupplyCode: 'EQ001',
      sourceParamCode: 'TEMP',
      sourceParamDescription: 'Temperature',
      dependentCode: 'PRES',
      dependentDescription: 'Pressure',
      effectiveDate: '2026-01-01',
      terminationDate: null,
      modificationDate: '2026-01-01',
      auditKey: 1
    },
    {
      deviceType: 'EQUIP',
      equipmentSupplyCode: 'EQ001',
      sourceParamCode: 'PRES',
      sourceParamDescription: 'Pressure',
      dependentCode: 'FLOW',
      dependentDescription: 'Flow Rate',
      effectiveDate: '2026-01-01',
      terminationDate: null,
      modificationDate: '2026-01-01',
      auditKey: 2
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getQcDependencySourceParamCodes',
      'getQcDependencyDependentParamCodes'
    ]);



      TestBed.configureTestingModule({
      imports: [QcDependencyFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: DriveEquipmentParametersService, useValue: mockService }
      ]
    });


    


      mockService.getQcDependencySourceParamCodes.calls.reset();


      mockService.getQcDependencyDependentParamCodes.calls.reset();


    fixture = TestBed.createComponent(QcDependencyFilterPanel);
    component = fixture.componentInstance;
    // Set tableData to populate dropdown options
    component.tableData = mockTableData;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {




    it('should populate dropdown options from table data', () => {
      const sourceParamOptions = component['sourceParamOptions']();
      const dependentCodeOptions = component['dependentCodeOptions']();

      expect(sourceParamOptions.length).toBe(2);
      expect(sourceParamOptions[0].code).toBe('PRES');
      expect(sourceParamOptions[1].code).toBe('TEMP');

      expect(dependentCodeOptions.length).toBe(2);
      expect(dependentCodeOptions[0].code).toBe('FLOW');
      expect(dependentCodeOptions[1].code).toBe('PRES');
    });
  });

  describe('Filter Functionality', () => {
    it('should return false for hasFiltersSelected when empty', () => {
      expect(component.hasFiltersSelected()).toBeFalse();
    });

    it('should return true for hasFiltersSelected when filter applied', () => {
      component.form.patchValue({ sourceParamCode: 'TEMP' });

      expect(component.hasFiltersSelected()).toBeTrue();
    });






  });

  describe('Date Period Validation', () => {
    it('should show error when date is selected without period', () => {
      component.form.patchValue({ effDate: new Date() });
      component.effDateTouched = true;
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
      expect(component.sourceParamSearchCtrl).toBeDefined();
      expect(component.dependentCodeSearchCtrl).toBeDefined();
    });







    it('should return all items when search is empty', () => {
      component.sourceParamSearchCtrl.setValue('');

      const filtered = component.filteredSourceParamList();
      expect(filtered.length).toBe(2);
    });


  });
});
