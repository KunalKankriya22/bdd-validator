import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { QcParametersFilterPanel } from './qc-parameters-filter-panel';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { MasterCodeModel, QcParametersModel } from '../../models/drive-equipment-parameters.model';

describe('QcParametersFilterPanel', () => {
  let component: QcParametersFilterPanel;
  let fixture: ComponentFixture<QcParametersFilterPanel>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;

  const mockTableData: QcParametersModel[] = [
    {
      deviceType: 'EQUIP',
      equipmentSupply: 'EQ001',
      sortSequence: 1,
      qcParameterCode: 'P001',
      qcParameterDescription: 'Parameter 1',
      qcCheckCode: 'KRNG',
      qcCheckDescription: 'K Range',
      dataType: 'N',
      qcTargetValue: '100',
      rangeFlag: 'Y',
      scanRequest: 'N',
      effectiveDate: '2026-01-01',
      terminationDate: null,
      modificationDate: '2026-01-01'
    },
    {
      deviceType: 'EQUIP',
      equipmentSupply: 'EQ001',
      sortSequence: 2,
      qcParameterCode: 'P002',
      qcParameterDescription: 'Parameter 2',
      qcCheckCode: 'TEMP',
      qcCheckDescription: 'Temperature',
      dataType: 'C',
      qcTargetValue: 'PASS',
      rangeFlag: 'N',
      scanRequest: 'N',
      effectiveDate: '2026-01-01',
      terminationDate: null,
      modificationDate: '2026-01-01'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getQcDataTypes',
      'getQcCheckCodes'
    ]);



      TestBed.configureTestingModule({
      imports: [QcParametersFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: DriveEquipmentParametersService, useValue: mockService }
      ]
    });


    


      mockService.getQcDataTypes.calls.reset();


      mockService.getQcCheckCodes.calls.reset();


    fixture = TestBed.createComponent(QcParametersFilterPanel);
    component = fixture.componentInstance;
    // Set tableData to populate dropdown options
    component.tableData = mockTableData;


    });

  describe('Component Initialization', () => {




    it('should populate dropdown options from table data', () => {
      fixture.detectChanges();

      const qcCheckCodeOptions = component['qcCheckCodeOptions']();
      const dataTypeOptions = component.dataTypeOptions;

      expect(qcCheckCodeOptions.length).toBe(2);
      expect(qcCheckCodeOptions[0].code).toBe('KRNG');
      expect(qcCheckCodeOptions[0].description).toBe('K Range');
      expect(qcCheckCodeOptions[1].code).toBe('TEMP');
      expect(qcCheckCodeOptions[1].description).toBe('Temperature');

      expect(dataTypeOptions.length).toBe(2);
      expect(dataTypeOptions).toContain('N');
      expect(dataTypeOptions).toContain('C');
    });
  });

  describe('Table Data Extraction', () => {
    it('should extract unique QC check codes from table data', () => {
      const testData: QcParametersModel[] = [
        { ...mockTableData[0], qcCheckCode: 'KRNG', qcCheckDescription: 'K Range' },
        { ...mockTableData[0], qcCheckCode: 'TEMP', qcCheckDescription: 'Temperature' },
        { ...mockTableData[0], qcCheckCode: 'KRNG', qcCheckDescription: 'K Range' } // Duplicate
      ];

      component.tableData = testData;

      const qcCheckCodeOptions = component['qcCheckCodeOptions']();
      expect(qcCheckCodeOptions.length).toBe(2);
      expect(qcCheckCodeOptions[0].code).toBe('KRNG');
      expect(qcCheckCodeOptions[1].code).toBe('TEMP');
    });

    it('should extract unique data types from table data', () => {
      const testData: QcParametersModel[] = [
        { ...mockTableData[0], dataType: 'N' },
        { ...mockTableData[0], dataType: 'C' },
        { ...mockTableData[0], dataType: 'N' }, // Duplicate
        { ...mockTableData[0], dataType: 'D' }
      ];

      component.tableData = testData;

      expect(component.dataTypeOptions.length).toBe(3);
      expect(component.dataTypeOptions).toContain('N');
      expect(component.dataTypeOptions).toContain('C');
      expect(component.dataTypeOptions).toContain('D');
    });



    it('should sort options alphabetically', () => {
      const testData: QcParametersModel[] = [
        { ...mockTableData[0], qcCheckCode: 'ZTEST', qcCheckDescription: 'Z Test' },
        { ...mockTableData[0], qcCheckCode: 'ATEST', qcCheckDescription: 'A Test' },
        { ...mockTableData[0], qcCheckCode: 'MTEST', qcCheckDescription: 'M Test' }
      ];

      component.tableData = testData;

      const qcCheckCodeOptions = component['qcCheckCodeOptions']();
      expect(qcCheckCodeOptions[0].code).toBe('ATEST');
      expect(qcCheckCodeOptions[1].code).toBe('MTEST');
      expect(qcCheckCodeOptions[2].code).toBe('ZTEST');
    });
  });



  describe('Date Period Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set "After" period when effDateFrom exists', () => {
      component.currentFilters = {
        effDateFrom: '2026-01-01'
      };

      component.ngOnInit();

      expect(component.form.get('effDatePeriod')?.value).toBe('After');
    });

    it('should set "Before" period when effDateTo exists', () => {
      component.currentFilters = {
        effDateTo: '2026-12-31'
      };

      component.ngOnInit();

      expect(component.form.get('effDatePeriod')?.value).toBe('Before');
    });

    it('should set "After" period when termDateFrom exists', () => {
      component.currentFilters = {
        termDateFrom: '2026-01-01'
      };

      component.ngOnInit();

      expect(component.form.get('termDatePeriod')?.value).toBe('After');
    });

    it('should set "Before" period when termDateTo exists', () => {
      component.currentFilters = {
        termDateTo: '2026-12-31'
      };

      component.ngOnInit();

      expect(component.form.get('termDatePeriod')?.value).toBe('Before');
    });

    it('should build filter with effDateFrom when period is After', () => {
      spyOn(component.apply, 'emit');

      component.form.patchValue({
        effDatePeriod: 'After',
        effDate: new Date('2026-01-01')
      });

      component.onApply();

      const emittedValue: any = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effDateFrom).toBeDefined();
      expect(emittedValue.effDateTo).toBeUndefined();
    });

    it('should build filter with effDateTo when period is Before', () => {
      spyOn(component.apply, 'emit');

      component.form.patchValue({
        effDatePeriod: 'Before',
        effDate: new Date('2026-12-31')
      });

      component.onApply();

      const emittedValue: any = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effDateFrom).toBeUndefined();
      expect(emittedValue.effDateTo).toBeDefined();
    });

    it('should show error when date is touched without period selected', () => {
      component.form.patchValue({
        effDatePeriod: null,
        effDate: null
      });

      component.effDateTouched = true;

      expect(component.hasEffDateError()).toBeTrue();
    });

    it('should reset touched flag when period changes', (done) => {
      component.effDateTouched = true;

      component.form.patchValue({ effDatePeriod: 'Before' });

      setTimeout(() => {
        expect(component.effDateTouched).toBeFalse();
        done();
      }, 0);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no filters selected', () => {
      expect(component.hasFiltersSelected()).toBeFalse();
    });

    it('should return true when any filter is selected', () => {
      component.form.patchValue({ qcCheckCode: 'KRNG' });

      expect(component.hasFiltersSelected()).toBeTrue();
    });



    it('should return true when date period and date are both provided', () => {
      component.form.patchValue({
        effDatePeriod: 'After',
        effDate: new Date('2026-01-01')
      });

      expect(component.hasFiltersSelected()).toBeTrue();
    });
  });

  describe('Error Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when effective date is touched without period', () => {
      component.form.patchValue({
        effDatePeriod: null,
        effDate: null
      });
      component.effDateTouched = true;

      expect(component.hasEffDateError()).toBeTrue();
      expect(component.getEffDateError()).toBe('Period is required');
    });

    it('should not show error when effective date is not touched', () => {
      component.form.patchValue({
        effDatePeriod: 'After',
        effDate: null
      });
      component.effDateTouched = false;

      expect(component.hasEffDateError()).toBeFalse();
    });

    it('should show error when termination date is touched without period', () => {
      component.form.patchValue({
        termDatePeriod: null,
        termDate: null
      });
      component.termDateTouched = true;

      expect(component.hasTermDateError()).toBeTrue();
      expect(component.getTermDateError()).toBe('Period is required');
    });
  });
});
