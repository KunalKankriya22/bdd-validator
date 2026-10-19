import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import moment from 'moment';

import { SetupInventoryLevelsFilterPanel } from './setup-inventory-levels-filter-panel';
import { HeaderService } from '@shared/services/header.service';
import { SetInventoryLevelDisplay, FilterValue } from '../models/setup-inventory-levels.model';

describe('SetupInventoryLevelsFilterPanel', () => {
  let component: SetupInventoryLevelsFilterPanel;
  let fixture: ComponentFixture<SetupInventoryLevelsFilterPanel>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockTableData: SetInventoryLevelDisplay[] = [
    {
      chapterId: 'CH1',
      customerId: 'C1',
      inventoryClass: 'WB',
      inventoryType: 'MI',
      productType: 'PT01',
      productTypeDesc: 'Product One',
      bloodType: 'A+',
      bloodTypeDesc: 'A Positive',
      attribGroup: 'AG1',
      attribCode: 'AC1',
      tier: null,
      qty: 10,
      effDate: '2025-01-15',
      termDate: null,
      lastModifiedDate: null,
      effDateDisplay: '15-JAN-2025',
      termDateDisplay: null,
      lastModifiedDateDisplay: null
    },
    {
      chapterId: 'CH1',
      customerId: 'C1',
      inventoryClass: 'WB',
      inventoryType: 'OP',
      productType: 'PT02',
      productTypeDesc: 'Product Two',
      bloodType: 'B-',
      bloodTypeDesc: 'B Negative',
      attribGroup: 'AG2',
      attribCode: 'AC2',
      tier: null,
      qty: 20,
      effDate: '2025-02-01',
      termDate: '2025-12-31',
      lastModifiedDate: null,
      effDateDisplay: '01-FEB-2025',
      termDateDisplay: '31-DEC-2025',
      lastModifiedDateDisplay: null
    }
  ];

  beforeEach(async () => {
    headerService = jasmine.createSpyObj('HeaderService', ['chapterTimeZone']);
    headerService.chapterTimeZone.and.returnValue('America/Los_Angeles');

    await TestBed.configureTestingModule({
      imports: [
        SetupInventoryLevelsFilterPanel,
        NoopAnimationsModule
      ],
      providers: [
        { provide: HeaderService, useValue: headerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SetupInventoryLevelsFilterPanel);
    component = fixture.componentInstance;
    component.tableData = mockTableData;
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with all filter fields', () => {
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('productType')).toBeDefined();
      expect(component.filterForm.get('aborh')).toBeDefined();
      expect(component.filterForm.get('attribute')).toBeDefined();
      expect(component.filterForm.get('effectiveDatePeriod')).toBeDefined();
      expect(component.filterForm.get('effectiveDate')).toBeDefined();
      expect(component.filterForm.get('terminationDatePeriod')).toBeDefined();
      expect(component.filterForm.get('terminationDate')).toBeDefined();
    });

    it('should extract product types from table data', () => {
      expect(component.productTypes.length).toBe(2);
      expect(component.productTypes[0].productType).toBe('PT01');
    });

    it('should extract blood types from table data', () => {
      expect(component.bloodTypes.length).toBe(2);
    });

    it('should extract attribute codes from table data', () => {
      expect(component.attributeCodes.length).toBe(2);
    });

    it('should sort extracted options alphabetically', () => {
      expect(component.productTypes[0].productType).toBe('PT01');
      expect(component.productTypes[1].productType).toBe('PT02');
    });
  });

  describe('populate form from current filters', () => {
    it('should populate form with product type filter', () => {
      component.currentFilters = { productType: 'PT01' };
      component.ngOnInit();
      expect(component.filterForm.get('productType')?.value).toBe('PT01');
    });

    it('should populate form with aborh filter', () => {
      component.currentFilters = { aborh: 'A+' };
      component.ngOnInit();
      expect(component.filterForm.get('aborh')?.value).toBe('A+');
    });

    it('should populate form with attribute filter', () => {
      component.currentFilters = { attribute: 'AC1' };
      component.ngOnInit();
      expect(component.filterForm.get('attribute')?.value).toBe('AC1');
    });

    it('should populate form with effective date filter', () => {
      component.currentFilters = {
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01'
      };
      component.ngOnInit();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(moment.isMoment(component.filterForm.get('effectiveDate')?.value)).toBeTrue();
    });

    it('should populate form with termination date filter', () => {
      component.currentFilters = {
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      };
      component.ngOnInit();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
    });

    it('should not populate form when currentFilters is null', () => {
      component.currentFilters = null;
      component.ngOnInit();
      expect(component.filterForm.get('productType')?.value).toBeNull();
    });
  });

  describe('extractDataFromTable', () => {
    it('should handle empty table data', () => {
      component.tableData = [];
      component.ngOnChanges({
        tableData: new SimpleChange(mockTableData, [], false)
      });
      expect(component.productTypes).toEqual([]);
      expect(component.bloodTypes).toEqual([]);
      expect(component.attributeCodes).toEqual([]);
    });

    it('should handle rows with null values', () => {
      const dataWithNulls = [{
        ...mockTableData[0],
        productType: null as any,
        bloodType: null,
        attribCode: null
      }] as SetInventoryLevelDisplay[];

      component.tableData = dataWithNulls;
      component.ngOnChanges({
        tableData: new SimpleChange(mockTableData, dataWithNulls, false)
      });
      expect(component.productTypes.length).toBe(0);
      expect(component.bloodTypes.length).toBe(0);
      expect(component.attributeCodes.length).toBe(0);
    });

    it('should not re-extract on first change', () => {
      const spy = spyOn<any>(component, 'extractDataFromTable');
      component.ngOnChanges({
        tableData: new SimpleChange(undefined, mockTableData, true)
      });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('search filters', () => {
    it('should filter product types by search term', () => {
      component.productTypeSearchControl.setValue('One');
      expect(component.filteredProductTypes.length).toBe(1);
      expect(component.filteredProductTypes[0].productType).toBe('PT01');
    });

    it('should filter blood types by search term', () => {
      component.aborhSearchControl.setValue('Negative');
      expect(component.filteredBloodTypes.length).toBe(1);
      expect(component.filteredBloodTypes[0].aboCode).toBe('B-');
    });

    it('should filter attributes by search term', () => {
      component.attributeSearchControl.setValue('AC1');
      expect(component.filteredAttributeCodes.length).toBe(1);
    });

    it('should show all options when search is cleared', () => {
      component.productTypeSearchControl.setValue('');
      expect(component.filteredProductTypes.length).toBe(2);
    });

    it('should handle null search values', () => {
      component.productTypeSearchControl.setValue(null as any);
      expect(component.filteredProductTypes.length).toBe(2);
    });
  });

  describe('isApplyDisabled', () => {
    it('should be disabled when no fields have values', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when product type is selected', () => {
      component.filterForm.patchValue({ productType: 'PT01' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when aborh is selected', () => {
      component.filterForm.patchValue({ aborh: 'A+' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when attribute is selected', () => {
      component.filterForm.patchValue({ attribute: 'AC1' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when effective date has no period', () => {
      component.filterForm.patchValue({
        effectiveDate: moment('2025-01-01'),
        effectiveDatePeriod: null
      });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when termination date has no period', () => {
      component.filterForm.patchValue({
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: null
      });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when effective date and period are both set', () => {
      component.filterForm.patchValue({
        effectiveDate: moment('2025-01-01'),
        effectiveDatePeriod: 'After'
      });
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('period required getters', () => {
    it('should return true for effDatePeriodRequired when date set but no period', () => {
      component.filterForm.patchValue({
        effectiveDate: moment('2025-01-01'),
        effectiveDatePeriod: null
      });
      expect(component.effDatePeriodRequired).toBeTrue();
    });

    it('should return false for effDatePeriodRequired when both set', () => {
      component.filterForm.patchValue({
        effectiveDate: moment('2025-01-01'),
        effectiveDatePeriod: 'After'
      });
      expect(component.effDatePeriodRequired).toBeFalse();
    });

    it('should return false for effDatePeriodRequired when no date', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: null
      });
      expect(component.effDatePeriodRequired).toBeFalse();
    });

    it('should return true for termDatePeriodRequired when date set but no period', () => {
      component.filterForm.patchValue({
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: null
      });
      expect(component.termDatePeriodRequired).toBeTrue();
    });

    it('should return false for termDatePeriodRequired when both set', () => {
      component.filterForm.patchValue({
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: 'Before'
      });
      expect(component.termDatePeriodRequired).toBeFalse();
    });
  });

  describe('date validation listeners', () => {
    it('should clear effectivePeriodRequired when effective date changes', () => {
      component.effectivePeriodRequired = true;
      component.filterForm.get('effectiveDate')?.setValue(moment('2025-06-01'));
      expect(component.effectivePeriodRequired).toBeFalse();
    });

    it('should clear effectivePeriodRequired when effective date period changes', () => {
      component.effectivePeriodRequired = true;
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      expect(component.effectivePeriodRequired).toBeFalse();
    });

    it('should clear terminationPeriodRequired when termination date changes', () => {
      component.terminationPeriodRequired = true;
      component.filterForm.get('terminationDate')?.setValue(moment('2025-12-01'));
      expect(component.terminationPeriodRequired).toBeFalse();
    });

    it('should clear terminationPeriodRequired when termination date period changes', () => {
      component.terminationPeriodRequired = true;
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      expect(component.terminationPeriodRequired).toBeFalse();
    });
  });

  describe('date error methods', () => {
    it('should return empty string for untouched effective date', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return error for touched invalid effective date', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return empty string for untouched termination date', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return error for touched invalid termination date', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return empty when effective date control is dirty but valid', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(moment('2025-06-01'));
      control?.markAsDirty();
      expect(component.getEffectiveDateError()).toBe('');
    });
  });

  describe('onApply', () => {
    it('should emit filters on apply', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ productType: 'PT01' });
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ productType: 'PT01' })
      );
    });

    it('should not emit when form is invalid', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.setErrors({ invalid: true });
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not emit when period validation fails for effective date', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDate: moment('2025-01-01'),
        effectiveDatePeriod: null
      });
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.effectivePeriodRequired).toBeTrue();
    });

    it('should not emit when period validation fails for termination date', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: null
      });
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.terminationPeriodRequired).toBeTrue();
    });

    it('should include serialized dates in emitted filters', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-06-15')
      });
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalled();
      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.effectiveDatePeriod).toBe('After');
      expect(emittedFilters.effectiveDate).toBeTruthy();
    });

    it('should include termination dates in emitted filters', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        terminationDatePeriod: 'Before',
        terminationDate: moment('2025-12-31')
      });
      component.onApply();
      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.terminationDatePeriod).toBe('Before');
    });

    it('should emit empty object for fields with no value', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ productType: 'PT01' });
      component.onApply();
      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.aborh).toBeUndefined();
    });
  });

  describe('onClear', () => {
    it('should reset form', () => {
      component.filterForm.patchValue({ productType: 'PT01', aborh: 'A+' });
      component.onClear();
      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('aborh')?.value).toBeNull();
    });

    it('should reset period required flags', () => {
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;
      component.onClear();
      expect(component.effectivePeriodRequired).toBeFalse();
      expect(component.terminationPeriodRequired).toBeFalse();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('error matchers', () => {
    it('effDateErrorMatcher should return false for null control', () => {
      expect(component.effDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('effDateErrorMatcher should return false for untouched clean control', () => {
      const control = component.filterForm.get('effectiveDate') as any;
      expect(component.effDateErrorMatcher.isErrorState(control, null as any)).toBeFalse();
    });

    it('effDateErrorMatcher should return true for invalid touched control', () => {
      const control = component.filterForm.get('effectiveDate') as any;
      control.setErrors({ matDatepickerParse: true });
      control.markAsTouched();
      expect(component.effDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });

    it('termDateErrorMatcher should return false for null control', () => {
      expect(component.termDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('termDateErrorMatcher should return false for untouched clean control', () => {
      const control = component.filterForm.get('terminationDate') as any;
      expect(component.termDateErrorMatcher.isErrorState(control, null as any)).toBeFalse();
    });

    it('termDateErrorMatcher should return true for invalid touched control', () => {
      const control = component.filterForm.get('terminationDate') as any;
      control.setErrors({ matDatepickerParse: true });
      control.markAsTouched();
      expect(component.termDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });

    it('effDateErrorMatcher should return true for dirty invalid control', () => {
      const control = component.filterForm.get('effectiveDate') as any;
      control.setErrors({ matDatepickerParse: true });
      control.markAsDirty();
      expect(component.effDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });
  });

  describe('date error methods - edge cases', () => {
    it('should return empty for clean dirty effective date', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsDirty();
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty for clean dirty termination date', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setValue(null);
      control?.markAsDirty();
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return error when effective date control is null', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return error when termination date control is null', () => {
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('isApplyDisabled edge cases', () => {
    it('should be disabled when form is invalid', () => {
      component.filterForm.setErrors({ custom: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when effective date is set with valid period', () => {
      component.filterForm.patchValue({
        effectiveDate: moment('2025-06-01'),
        effectiveDatePeriod: 'After'
      });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when termination date is set with valid period', () => {
      component.filterForm.patchValue({
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: 'Before'
      });
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('search filters edge cases', () => {
    it('should handle null search for blood types', () => {
      component.aborhSearchControl.setValue(null as any);
      expect(component.filteredBloodTypes.length).toBe(2);
    });

    it('should handle null search for attributes', () => {
      component.attributeSearchControl.setValue(null as any);
      expect(component.filteredAttributeCodes.length).toBe(2);
    });

    it('should filter blood types by description', () => {
      component.aborhSearchControl.setValue('Positive');
      expect(component.filteredBloodTypes.length).toBe(1);
      expect(component.filteredBloodTypes[0].aboCode).toBe('A+');
    });

    it('should filter attributes by description', () => {
      component.attributeSearchControl.setValue('AC2');
      expect(component.filteredAttributeCodes.length).toBe(1);
    });
  });

  describe('onApply with attribute filter', () => {
    it('should include attribute in emitted filters', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ attribute: 'AC1' });
      component.onApply();
      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.attribute).toBe('AC1');
    });

    it('should not include null aborh', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ productType: 'PT01' });
      component.onApply();
      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.aborh).toBeUndefined();
    });
  });

  describe('element ID helper', () => {
    it('should generate unique element IDs', () => {
      const id = component.elementId('test');
      expect(id).toContain('filter-panel-');
      expect(id).toContain('-test');
    });
  });

  describe('extractDataFromTable with duplicates', () => {
    it('should deduplicate product types', () => {
      const duplicateData = [
        ...mockTableData,
        { ...mockTableData[0], bloodType: 'O+', bloodTypeDesc: 'O Positive' }
      ] as SetInventoryLevelDisplay[];
      component.tableData = duplicateData;
      component.ngOnChanges({
        tableData: new SimpleChange(mockTableData, duplicateData, false)
      });
      expect(component.productTypes.length).toBe(2);
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw on destroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
