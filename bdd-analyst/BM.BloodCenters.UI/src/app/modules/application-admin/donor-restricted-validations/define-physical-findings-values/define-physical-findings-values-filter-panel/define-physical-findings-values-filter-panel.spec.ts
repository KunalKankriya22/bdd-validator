import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DefinePhysicalFindingsValuesFilterPanel } from './define-physical-findings-values-filter-panel';
import { DefinePhysicalFindingsValuesFilterFormValue } from '../utils/filter-chips.utils';
import { HeaderService } from '@shared/services/header.service';

describe('DefinePhysicalFindingsValuesFilterPanel', () => {
  let component: DefinePhysicalFindingsValuesFilterPanel;
  let fixture: ComponentFixture<DefinePhysicalFindingsValuesFilterPanel>;

  const mockLookups = {
    donationTypes: [
      { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' },
      { key: 'DI', value: 'Directed' }
    ],
    procedureCodes: [
      { key: 'm9', value: 'test m9' },
      { key: 'WB', value: 'Whole Blood' }
    ],
    physicalCodes: [
      { key: 'AGE', value: 'Donor age not acceptable' },
      { key: 'PULEV', value: 'Pulse Evaluation' }
    ],
    interdictionCodes: [
      { key: '00008', value: 'Test Interdiction 1' },
      { key: '00009', value: 'Test Interdiction 2' }
    ],
    equipmentTypes: [
      { key: '500', value: 'Equipment Type 500' },
      { key: '1000', value: 'Equipment Type 1000' }
    ]
  };

  const mockHeaderService = {
    chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('UTC')
  };

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        DefinePhysicalFindingsValuesFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DefinePhysicalFindingsValuesFilterPanel);
    component = fixture.componentInstance;
    component.lookups = mockLookups;


    });

  describe('Component Initialization', () => {

    it('should initialize form with null values by default', () => {
      component.currentFilters = null;
      component.ngOnInit();

      expect(component.filterForm.get('operator')?.value).toBeNull();
      expect(component.filterForm.get('interdiction')?.value).toBeNull();
      expect(component.filterForm.get('manualAuditFindingsFlag')?.value).toBeNull();
      expect(component.filterForm.get('equipmentType')?.value).toBeNull();
      expect(component.filterForm.get('periodType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });

    it('should populate form with current filters if provided', () => {
      const filters: DefinePhysicalFindingsValuesFilterFormValue = {
        operator: 'BETWEEN',
        interdiction: '00008',
        manualAuditFindingsFlag: 'Y',
        equipmentType: '1000',
        periodType: 'After',
        effectiveDate: new Date('2026-04-02'),
        terminationDate: null,
        terminationPeriodType: null
      };
      component.currentFilters = filters;
      component.lookups = { ...mockLookups, operators: [
        { key: 'BETWEEN', value: 'BETWEEN' },
        { key: 'EQUAL', value: 'EQUAL' }
      ]};
      component.ngOnInit();

      expect(component.filterForm.get('operator')?.value).toEqual({ key: 'BETWEEN', value: 'BETWEEN' });
      expect(component.filterForm.get('interdiction')?.value).toEqual({ key: '00008', value: 'Test Interdiction 1' });
      expect(component.filterForm.get('manualAuditFindingsFlag')?.value).toBe('Y');
      expect(component.filterForm.get('equipmentType')?.value).toEqual({ key: '1000', value: 'Equipment Type 1000' });
      expect(component.filterForm.get('periodType')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toBeDefined();
    });

    it('should populate operator dropdown with dynamic values from lookups', () => {
      component.lookups = { ...mockLookups, operators: [
        { key: 'BETWEEN', value: 'BETWEEN' },
        { key: 'EQUAL', value: 'EQUAL' },
        { key: 'LESS', value: 'LESS' },
        { key: 'MORE', value: 'MORE' },
        { key: 'INRANGE', value: 'INRANGE' }
      ]};
      component.ngOnInit();

      expect(component.filteredOperators().length).toBe(5);
      expect(component.filteredOperators().some(op => op.key === 'BETWEEN')).toBe(true);
      expect(component.filteredOperators().some(op => op.key === 'EQUAL')).toBe(true);
      expect(component.filteredOperators().some(op => op.key === 'LESS')).toBe(true);
      expect(component.filteredOperators().some(op => op.key === 'MORE')).toBe(true);
      expect(component.filteredOperators().some(op => op.key === 'INRANGE')).toBe(true);
    });


    it('should handle missing lookups gracefully', () => {
      component.lookups = null;
      component.ngOnInit();

      expect(component.filteredInterdictions().length).toBe(0);
      expect(component.filteredEquipmentTypes().length).toBe(0);
      expect(component.filteredOperators().length).toBe(0);
    });

    it('should have manual audit flags options', () => {
      component.lookups = { ...mockLookups, manualAuditFlags: [{ key: 'Y', value: 'Yes' }, { key: 'N', value: 'No' }] };
      component.ngOnInit();
      expect(component.filteredManualAuditFlags().length).toBe(2);
      expect(component.filteredManualAuditFlags().some(f => f.key === 'Y')).toBe(true);
      expect(component.filteredManualAuditFlags().some(f => f.key === 'N')).toBe(true);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should require period type when effective date is selected', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2026-04-02'),
        periodType: null
      });

      component['validatePeriodType']();

      expect(component.filterForm.get('periodType')?.hasError('required')).toBe(true);
    });

    it('should not require period type when effective date is not selected', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        periodType: null
      });

      component['validatePeriodType']();

      expect(component.filterForm.get('periodType')?.hasError('required')).toBe(false);
    });

    it('should clear period type error when both fields are filled', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2026-04-02'),
        periodType: 'After'
      });

      component['validatePeriodType']();

      expect(component.filterForm.get('periodType')?.errors).toBeNull();
    });


  });

  describe('Apply Filters', () => {
    beforeEach(() => {
      component.ngOnInit();
    });




    it('should convert moment date to Date object', () => {
      spyOn(component.apply, 'emit');
      const mockMoment = {
        toDate: jasmine.createSpy('toDate').and.returnValue(new Date('2026-04-02'))
      };

      component.filterForm.patchValue({
        operator: { key: 'BETWEEN', value: 'BETWEEN' },
        periodType: 'After',
        effectiveDate: mockMoment
      });

      component.onApply();

      expect(mockMoment.toDate).toHaveBeenCalled();
      expect(component.apply.emit).toHaveBeenCalled();
    });

    it('should handle native Date objects', () => {
      spyOn(component.apply, 'emit');
      const date = new Date('2026-04-02');

      component.filterForm.patchValue({
        operator: { key: 'BETWEEN', value: 'BETWEEN' },
        periodType: 'After',
        effectiveDate: date
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDate).toBeInstanceOf(Date);
    });
  });

  describe('Clear Filters', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should reset all form fields to null', () => {
      component.filterForm.patchValue({
        operator: { key: 'BETWEEN', value: 'BETWEEN' },
        interdiction: { key: '00008', value: 'Test Interdiction 1' },
        manualAuditFindingsFlag: 'Y',
        equipmentType: { key: '1000', value: 'Equipment Type 1000' },
        periodType: 'After',
        effectiveDate: new Date('2026-04-02')
      });

      component.onClear();

      expect(component.filterForm.get('operator')?.value).toBeNull();
      expect(component.filterForm.get('interdiction')?.value).toBeNull();
      expect(component.filterForm.get('manualAuditFindingsFlag')?.value).toBeNull();
      expect(component.filterForm.get('equipmentType')?.value).toBeNull();
      expect(component.filterForm.get('periodType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });

  describe('Searchable Select - Filter Fields', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set up filtered computed signals on init', () => {
      expect(component.filteredOperators).toBeDefined();
      expect(component.filteredInterdictions).toBeDefined();
      expect(component.filteredEquipmentTypes).toBeDefined();
    });

    it('should display filter item value', () => {
      const item = { key: 'BETWEEN', value: 'BETWEEN' };
      expect(component.displayFilterItem(item)).toBe('BETWEEN');
    });

    it('should display filter item value when different from key', () => {
      const item = { key: '00008', value: 'Test Interdiction 1' };
      expect(component.displayFilterItem(item)).toBe('Test Interdiction 1');
    });

    it('should display empty string for null', () => {
      expect(component.displayFilterItem(null)).toBe('');
    });

    it('should display string as-is for typed text', () => {
      expect(component.displayFilterItem('typed')).toBe('typed');
    });


    it('should not reset search control when select is opened', () => {
      component.operatorSearchCtrl.setValue('BET');
      component.onSelectOpenedChange(component.operatorSearchCtrl, true);

      expect(component.operatorSearchCtrl.value).toBe('BET');
    });

    it('should compare lookup items by key', () => {
      const a = { key: 'BETWEEN', value: 'BETWEEN' };
      const b = { key: 'BETWEEN', value: 'BETWEEN' };
      const c = { key: 'EQUAL', value: 'EQUAL' };

      expect(component.compareLookupItems(a, b)).toBe(true);
      expect(component.compareLookupItems(a, c)).toBe(false);
      expect(component.compareLookupItems(null, b)).toBe(false);
      expect(component.compareLookupItems(a, null)).toBe(false);
    });

    it('should filter operators by search text', () => {
      component.lookups = { ...mockLookups, operators: [
        { key: 'BETWEEN', value: 'BETWEEN' },
        { key: 'EQUAL', value: 'EQUAL' },
        { key: 'LESS', value: 'LESS' },
        { key: 'MORE', value: 'MORE' },
        { key: 'INRANGE', value: 'INRANGE' }
      ]};
      component.ngOnInit();

      expect(component.filteredOperators().length).toBe(5);

      component.operatorSearchCtrl.setValue('BET');

      const filtered = component.filteredOperators();
      expect(filtered.some(op => op.key === 'BETWEEN')).toBe(true);
      expect(filtered.some(op => op.key === 'EQUAL')).toBe(false);
    });
  });

  describe('Date Input Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });




    it('should mark control as touched on date input with empty value', () => {
      const mockEvent = { target: { value: '' } } as unknown as Event;
      component.onDateInput(mockEvent, 'effectiveDate');

      expect(component.filterForm.get('effectiveDate')?.touched).toBe(true);
    });
  });

  describe('Period Type Validation Persistence', () => {
    beforeEach(() => {
      component.ngOnInit();
    });


    it('should clear period required validator when date is cleared', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2026-04-02'),
        periodType: null
      });
      component['validatePeriodType']();

      // Now clear the date
      component.filterForm.patchValue({ effectiveDate: null });
      component['validatePeriodType']();

      const periodTypeControl = component.filterForm.get('periodType');
      expect(periodTypeControl?.hasError('required')).toBe(false);
    });

  });

  describe('Form Field Interactions', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should allow selecting and deselecting operator', () => {
      const operatorObj = { key: 'BETWEEN', value: 'BETWEEN' };
      component.filterForm.patchValue({ operator: operatorObj });
      expect(component.filterForm.get('operator')?.value).toEqual(operatorObj);

      component.filterForm.patchValue({ operator: null });
      expect(component.filterForm.get('operator')?.value).toBeNull();
    });

    it('should allow selecting and deselecting interdiction', () => {
      const interdictionObj = { key: '00008', value: 'Test Interdiction 1' };
      component.filterForm.patchValue({ interdiction: interdictionObj });
      expect(component.filterForm.get('interdiction')?.value).toEqual(interdictionObj);

      component.filterForm.patchValue({ interdiction: null });
      expect(component.filterForm.get('interdiction')?.value).toBeNull();
    });

    it('should allow selecting and deselecting manual audit flag', () => {
      component.filterForm.patchValue({ manualAuditFindingsFlag: 'Y' });
      expect(component.filterForm.get('manualAuditFindingsFlag')?.value).toBe('Y');

      component.filterForm.patchValue({ manualAuditFindingsFlag: null });
      expect(component.filterForm.get('manualAuditFindingsFlag')?.value).toBeNull();
    });

    it('should allow selecting and deselecting equipment type', () => {
      const equipmentObj = { key: '1000', value: 'Equipment Type 1000' };
      component.filterForm.patchValue({ equipmentType: equipmentObj });
      expect(component.filterForm.get('equipmentType')?.value).toEqual(equipmentObj);

      component.filterForm.patchValue({ equipmentType: null });
      expect(component.filterForm.get('equipmentType')?.value).toBeNull();
    });
  });
});
