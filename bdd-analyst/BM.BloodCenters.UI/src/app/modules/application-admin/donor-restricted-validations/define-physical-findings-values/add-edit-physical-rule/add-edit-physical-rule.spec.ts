import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { AddEditPhysicalRule } from './add-edit-physical-rule';
import { DefinePhysicalFindingsValuesService } from '../services/define-physical-findings-values.service';
import { DefinePhysicalFindingsValuesModel } from '../models/define-physical-findings-values.model';
import { HeaderService } from '@shared/services/header.service';

describe('AddEditPhysicalRule', () => {
  let component: AddEditPhysicalRule;
  let fixture: ComponentFixture<AddEditPhysicalRule>;
  let mockService: jasmine.SpyObj<DefinePhysicalFindingsValuesService>;
  let mockHeaderService: any;

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

  const mockData: DefinePhysicalFindingsValuesModel = {
    physicalCode: 'AGE',
    physicalCodeDescription: 'Donor age not acceptable',
    dataType: 'N',
    minimumValue: '11',
    maximumValue: '112',
    operator: 'BETWEEN',
    gender: 'A',
    fromAge: 11,
    toAge: 111,
    interdiction: '00008',
    interdictionDescription: 'Test Interdiction 1',
    equipmentType: '1000',
    equipmentTypeDescription: 'Equipment Type 1000',
    commentsRequired: 'Y',
    manualAuditRequired: 'Y',
    effectiveDate: '2026-04-02T13:00:00',
    terminationDate: '2026-04-29T13:00:00',
    donationType: 'UAT2',
    donationTypeDescription: 'LOCAL TIME TESTING UAT 2',
    procedureCode: 'm9',
    procedureCodeDescription: 'test m9'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefinePhysicalFindingsValuesService', [
      'getLookups',
      'createPhysicalRule',
      'updatePhysicalRule'
    ]);

    mockHeaderService = {
      chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('UTC'),
      getCurrentChapterId: jasmine.createSpy('getCurrentChapterId').and.returnValue('1')
    };

    mockService.getLookups.and.returnValue(of(mockLookups));
    mockService.createPhysicalRule.and.returnValue(of({ success: true, message: 'Created successfully' }));
    mockService.updatePhysicalRule.and.returnValue(of({ success: true, message: 'Updated successfully' }));



      TestBed.configureTestingModule({
      imports: [
        AddEditPhysicalRule,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: DefinePhysicalFindingsValuesService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockService.getLookups.calls.reset();


      mockService.createPhysicalRule.calls.reset();


      mockService.updatePhysicalRule.calls.reset();


      mockService.getLookups.and.returnValue(of(mockLookups));


      mockService.createPhysicalRule.and.returnValue(of({ success: true, message: 'Created successfully' }));


      mockService.updatePhysicalRule.and.returnValue(of({ success: true, message: 'Updated successfully' }));


    fixture = TestBed.createComponent(AddEditPhysicalRule);
    component = fixture.componentInstance;


    });


  describe('Component Initialization', () => {
    it('should initialize in add mode by default', () => {
      expect(component.mode).toBe('add');
      expect(component.data).toBeNull();
      expect(component.isSubmitting).toBe(false);
      expect(component.errorMessage).toBe('');
    });



    it('should populate form with null values in add mode (no pre-selection)', () => {
      component.mode = 'add';
      component.data = null;
      component.ngOnInit();

      expect(component.physicalRuleForm.get('dataType')?.value).toBeNull();
      expect(component.physicalRuleForm.get('operator')?.value).toBeNull();
      expect(component.physicalRuleForm.get('gender')?.value).toBeNull();
      expect(component.physicalRuleForm.get('commentsRequired')?.value).toBeNull();
      expect(component.physicalRuleForm.get('manualAuditRequired')?.value).toBeNull();
      expect(component.physicalRuleForm.get('effectiveDate')?.value).toBeNull();
    });





    it('should use pre-loaded lookups if provided', () => {
      component.lookups = mockLookups;
      component.ngOnInit();

      expect(component.filteredDonationTypes().length).toBe(2);
      expect(component.filteredProcedureCodes().length).toBe(2);
      expect(component.filteredPhysicalCodes().length).toBe(2);
      expect(component.filteredInterdictions().length).toBe(2);
      expect(component.filteredEquipmentTypes().length).toBe(2);
      expect(mockService.getLookups).not.toHaveBeenCalled();
    });


  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should have required fields', () => {
      const form = component.physicalRuleForm;

      expect(form.get('donationType')?.hasError('required')).toBe(true);
      expect(form.get('procedureCode')?.hasError('required')).toBe(true);
      expect(form.get('physicalCode')?.hasError('required')).toBe(true);
      expect(form.get('dataType')?.hasError('required')).toBe(true); // No default in add mode
      expect(form.get('operator')?.hasError('required')).toBe(true); // No default in add mode
      expect(form.get('gender')?.hasError('required')).toBe(true); // No default in add mode
      expect(form.get('interdiction')?.hasError('required')).toBe(false); // Optional field
      expect(form.get('equipmentType')?.hasError('required')).toBe(false); // Optional field
      expect(form.get('effectiveDate')?.hasError('required')).toBe(true); // No default in add mode
    });







    it('should allow optional fields to be null', () => {
      component.physicalRuleForm.patchValue({
        donationType: { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' },
        procedureCode: { key: 'm9', value: 'test m9' },
        physicalCode: { key: 'AGE', value: 'Donor age not acceptable' },
        minimumValue: '10',
        maximumValue: null,
        operator: { key: 'EQUAL', value: 'EQUAL' },
        fromAge: null,
        toAge: null,
        terminationDate: null
      });

      expect(component.physicalRuleForm.get('minimumValue')?.valid).toBe(true);
      expect(component.physicalRuleForm.get('maximumValue')?.valid).toBe(true);
      expect(component.physicalRuleForm.get('fromAge')?.valid).toBe(true);
      expect(component.physicalRuleForm.get('toAge')?.valid).toBe(true);
      expect(component.physicalRuleForm.get('terminationDate')?.valid).toBe(true);
    });

    it('should not require maximumValue even with BETWEEN operator', () => {
      component.physicalRuleForm.patchValue({
        operator: { key: 'BETWEEN', value: 'BETWEEN' },
        maximumValue: null
      });
      expect(component.physicalRuleForm.get('maximumValue')?.hasError('required')).toBe(false);
    });

    it('should not require maximumValue even with INRANGE operator', () => {
      component.physicalRuleForm.patchValue({
        operator: { key: 'INRANGE', value: 'INRANGE' },
        maximumValue: null
      });
      expect(component.physicalRuleForm.get('maximumValue')?.hasError('required')).toBe(false);
    });

    it('should require minimumValue', () => {
      component.physicalRuleForm.patchValue({ minimumValue: null });
      expect(component.physicalRuleForm.get('minimumValue')?.hasError('required')).toBe(true);
    });

    it('should invalidate when maximumValue is less than or equal to minimumValue for numeric types', () => {
      component.physicalRuleForm.patchValue({
        dataType: 'N',
        minimumValue: '100',
        maximumValue: '50'
      });
      component.physicalRuleForm.updateValueAndValidity();
      expect(component.physicalRuleForm.hasError('maxMustBeGreaterThanMin')).toBe(true);
    });

    it('should clear minimumValue when dataType changes', () => {
      component.physicalRuleForm.patchValue({
        dataType: 'N',
        minimumValue: '123'
      });
      const minControl = component.physicalRuleForm.get('minimumValue');

      component.physicalRuleForm.patchValue({ dataType: 'C' });

      expect(minControl?.value).toBe('');
      expect(minControl?.touched).toBe(false);
    });

    it('should clear maximumValue when dataType changes', () => {
      component.physicalRuleForm.patchValue({
        dataType: 'N',
        maximumValue: '456'
      });
      const maxControl = component.physicalRuleForm.get('maximumValue');

      component.physicalRuleForm.patchValue({ dataType: 'C' });

      expect(maxControl?.value).toBe('');
      expect(maxControl?.touched).toBe(false);
    });



    it('should mark min/max as touched in edit mode so cross-field errors show immediately', () => {
      const editData = { ...mockData, minimumValue: '200', maximumValue: '50' };
      component.mode = 'edit';
      component.data = editData;
      component.lookups = mockLookups;
      component.ngOnInit();

      const minControl = component.physicalRuleForm.get('minimumValue');
      const maxControl = component.physicalRuleForm.get('maximumValue');

      expect(minControl?.touched).toBe(true);
      expect(maxControl?.touched).toBe(true);
      expect(component.physicalRuleForm.hasError('maxMustBeGreaterThanMin')).toBe(true);
    });

    it('should not validate max > min for character data type', () => {
      component.physicalRuleForm.patchValue({
        dataType: 'C',
        minimumValue: 'ZZZ',
        maximumValue: 'AAA'
      });
      component.physicalRuleForm.updateValueAndValidity();
      expect(component.physicalRuleForm.hasError('maxMustBeGreaterThanMin')).toBe(false);
    });
  });

  describe('Description Getters', () => {
    beforeEach(() => {
      component.lookups = mockLookups;
      component.ngOnInit();
    });

    it('should get donation type description from object', () => {
      component.physicalRuleForm.patchValue({ donationType: { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' } });
      expect(component.donationTypeDescription).toBe('LOCAL TIME TESTING UAT 2');
    });

    it('should get procedure code description from object', () => {
      component.physicalRuleForm.patchValue({ procedureCode: { key: 'm9', value: 'test m9' } });
      expect(component.procedureCodeDescription).toBe('test m9');
    });

    it('should get physical code description from object', () => {
      component.physicalRuleForm.patchValue({ physicalCode: { key: 'AGE', value: 'Donor age not acceptable' } });
      expect(component.physicalCodeDescription).toBe('Donor age not acceptable');
    });




  });

  describe('Submit Functionality', () => {
    beforeEach(() => {
      component.lookups = mockLookups;
      component.ngOnInit();
    });





    it('should call createPhysicalRule in add mode', () => {
      component.mode = 'add';
      fillValidForm();

      component.onSubmit();

      expect(mockService.createPhysicalRule).toHaveBeenCalled();
      expect(mockService.updatePhysicalRule).not.toHaveBeenCalled();
    });

    it('should call updatePhysicalRule in edit mode', () => {
      component.mode = 'edit';
      fillValidForm();

      component.onSubmit();

      expect(mockService.updatePhysicalRule).toHaveBeenCalled();
      expect(mockService.createPhysicalRule).not.toHaveBeenCalled();
    });

    it('should set isSubmitting to true during submission', (done) => {
      mockService.createPhysicalRule.and.returnValue(
        of({ success: true, message: 'Created successfully' }).pipe(
          // Add a small delay to test the loading state
          delay(10)
        )
      );
      fillValidForm();
      component.onSubmit();

      // Check immediately after calling onSubmit
      expect(component.isSubmitting).toBe(true);

      // Wait for observable to complete
      setTimeout(() => {
        done();
      }, 50);
    });

    it('should emit saveSuccess and close panel on successful save', (done) => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component, 'onClose');
      fillValidForm();

      component.onSubmit();

      setTimeout(() => {
        expect(component.saveSuccess.emit).toHaveBeenCalled();
        expect(component.onClose).toHaveBeenCalled();
        expect(component.isSubmitting).toBe(false);
        done();
      }, 100);
    });



    it('should convert date objects properly', () => {
      fillValidForm();

      component.onSubmit();

      const callArgs = mockService.createPhysicalRule.calls.mostRecent().args[0];
      expect(callArgs.effectiveDate).toBeInstanceOf(Date);
    });
  });

  describe('Panel Title', () => {
    it('should show Add title in add mode', () => {
      component.mode = 'add';
      expect(component.panelTitle).toBe('Add New Physical Rule');
    });

    it('should show Edit title in edit mode', () => {
      component.mode = 'edit';
      expect(component.panelTitle).toBe('Edit Physical Rule');
    });
  });
  describe('Static Dropdown Options', () => {
    it('should have correct data types', () => {
      expect(component.dataTypes.length).toBe(3);
      expect(component.dataTypes).toContainEqual({ value: 'N', display: 'Numeric' });
      expect(component.dataTypes).toContainEqual({ value: 'C', display: 'Character' });
      expect(component.dataTypes).toContainEqual({ value: 'D', display: 'Decimal' });
    });

    it('should have correct operator options', () => {
      expect(component.operatorOptions.length).toBe(5);
      expect(component.operatorOptions).toContainEqual({ key: 'BETWEEN', value: 'BETWEEN' });
      expect(component.operatorOptions).toContainEqual({ key: 'EQUAL', value: 'EQUAL' });
      expect(component.operatorOptions).toContainEqual({ key: 'LESS', value: 'LESS' });
      expect(component.operatorOptions).toContainEqual({ key: 'MORE', value: 'MORE' });
      expect(component.operatorOptions).toContainEqual({ key: 'INRANGE', value: 'INRANGE' });
    });

    it('should have correct gender options', () => {
      expect(component.genderOptions.length).toBe(3);
      expect(component.genderOptions).toContainEqual({ value: 'M', display: 'Male' });
      expect(component.genderOptions).toContainEqual({ value: 'F', display: 'Female' });
      expect(component.genderOptions).toContainEqual({ value: 'A', display: 'All' });
    });

    it('should have correct yes/no options', () => {
      expect(component.yesNoOptions.length).toBe(2);
      expect(component.yesNoOptions).toContainEqual({ value: 'Y', display: 'Yes' });
      expect(component.yesNoOptions).toContainEqual({ value: 'N', display: 'No' });
    });
  });

  describe('Searchable Select Dropdowns', () => {
    beforeEach(() => {
      component.lookups = mockLookups;
      component.ngOnInit();
    });

    it('should set up filtered computed signals after lookups load', () => {
      expect(component.filteredDonationTypes).toBeDefined();
      expect(component.filteredProcedureCodes).toBeDefined();
      expect(component.filteredPhysicalCodes).toBeDefined();
      expect(component.filteredInterdictions).toBeDefined();
      expect(component.filteredEquipmentTypes).toBeDefined();
      expect(component.filteredOperators).toBeDefined();
    });

    it('should return all items when no search is active', () => {
      expect(component.filteredDonationTypes().length).toBe(2);
      expect(component.filteredProcedureCodes().length).toBe(2);
      expect(component.filteredPhysicalCodes().length).toBe(2);
      expect(component.filteredInterdictions().length).toBe(2);
      expect(component.filteredEquipmentTypes().length).toBe(2);
      expect(component.filteredOperators().length).toBe(5);
    });

    it('should display lookup item with key - value format', () => {
      const item = { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' };
      expect(component.displayLookupItem(item)).toBe('UAT2 - LOCAL TIME TESTING UAT 2');
    });

    it('should display only key when key equals value', () => {
      const item = { key: 'BETWEEN', value: 'BETWEEN' };
      expect(component.displayLookupItem(item)).toBe('BETWEEN');
    });

    it('should display empty string for null', () => {
      expect(component.displayLookupItem(null)).toBe('');
    });

    it('should display string as-is for typed text', () => {
      expect(component.displayLookupItem('typed')).toBe('typed');
    });

    it('should compare lookup items by key', () => {
      const a = { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' };
      const b = { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' };
      expect(component.compareLookupItems(a, b)).toBe(true);
    });

    it('should return false when comparing lookup items with different keys', () => {
      const a = { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' };
      const b = { key: 'DI', value: 'Directed' };
      expect(component.compareLookupItems(a, b)).toBe(false);
    });





    it('should not reset search control when select opens', () => {
      component.donationTypeSearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.donationTypeSearchCtrl, true);
      expect(component.donationTypeSearchCtrl.value).toBe('test');
    });

    it('should set form values to matching objects in edit mode', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.lookups = mockLookups;
      component.ngOnInit();

      const donationValue = component.physicalRuleForm.get('donationType')?.value;
      expect(donationValue).toEqual({ key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' });

      const interdictionValue = component.physicalRuleForm.get('interdiction')?.value;
      expect(interdictionValue).toEqual({ key: '00008', value: 'Test Interdiction 1' });
    });

    it('should extract keys from objects on form submit', () => {
      fillValidForm();
      component.onSubmit();

      const callArgs = mockService.createPhysicalRule.calls.mostRecent().args[0];
      expect(callArgs.donationType).toBe('UAT2');
      expect(callArgs.procedureCode).toBe('m9');
      expect(callArgs.physicalCode).toBe('AGE');
      expect(callArgs.operator).toBe('BETWEEN');
      expect(callArgs.interdiction).toBe('00008');
      expect(callArgs.equipmentType).toBe('1000');
    });

    it('should reset all fields to null on resetForm', () => {
      fillValidForm();
      component['resetForm']();

      expect(component.physicalRuleForm.get('donationType')?.value).toBeNull();
      expect(component.physicalRuleForm.get('procedureCode')?.value).toBeNull();
      expect(component.physicalRuleForm.get('physicalCode')?.value).toBeNull();
      expect(component.physicalRuleForm.get('interdiction')?.value).toBeNull();
      expect(component.physicalRuleForm.get('equipmentType')?.value).toBeNull();
      expect(component.physicalRuleForm.get('operator')?.value).toBeNull();
      expect(component.physicalRuleForm.get('dataType')?.value).toBeNull();
      expect(component.physicalRuleForm.get('gender')?.value).toBeNull();
      expect(component.physicalRuleForm.get('commentsRequired')?.value).toBeNull();
      expect(component.physicalRuleForm.get('manualAuditRequired')?.value).toBeNull();
      expect(component.physicalRuleForm.get('effectiveDate')?.value).toBeNull();
    });
  });
  describe('Lookups Error Handling', () => {
    it('should handle lookups loading error', (done) => {
      mockService.getLookups.and.returnValue(
        throwError(() => new Error('Failed to load lookups'))
      );
      component.lookups = null;

      component.ngOnInit();

      setTimeout(() => {
        expect(component.errorMessage).toBeTruthy();
        expect(component.isLoadingDropdowns).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should mark control as touched on effective date input', () => {
      const mockEvent = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(mockEvent);
      expect(component.physicalRuleForm.get('effectiveDate')?.touched).toBe(true);
    });

    it('should mark control as touched on termination date input with text', () => {
      const mockEvent = { target: { value: '15-APR-2027' } } as unknown as Event;
      component.onTerminationDateInput(mockEvent);
      expect(component.physicalRuleForm.get('terminationDate')?.touched).toBe(true);
    });

    it('should reject past effective dates via validator', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      component.physicalRuleForm.patchValue({ effectiveDate: pastDate });

      const control = component.physicalRuleForm.get('effectiveDate');
      control?.markAsTouched();
      control?.updateValueAndValidity();

      expect(control?.hasError('effectiveDatePast')).toBe(true);
    });

    it('should accept future effective dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      component.physicalRuleForm.patchValue({ effectiveDate: futureDate });

      const control = component.physicalRuleForm.get('effectiveDate');
      control?.updateValueAndValidity();

      expect(control?.hasError('effectiveDatePast')).toBe(false);
    });

    it('should have dateRangeInvalid form error when termination date is before effective date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const earlierDate = new Date(futureDate);
      earlierDate.setDate(earlierDate.getDate() - 5);

      component.physicalRuleForm.patchValue({
        effectiveDate: futureDate,
        terminationDate: earlierDate
      });
      component.physicalRuleForm.updateValueAndValidity();

      expect(component.physicalRuleForm.hasError('dateRangeInvalid')).toBe(true);
    });

    it('should not have dateRangeInvalid form error when termination date is after effective date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const laterDate = new Date(futureDate);
      laterDate.setDate(laterDate.getDate() + 5);

      component.physicalRuleForm.patchValue({
        effectiveDate: futureDate,
        terminationDate: laterDate
      });
      component.physicalRuleForm.updateValueAndValidity();

      expect(component.physicalRuleForm.hasError('dateRangeInvalid')).toBe(false);
    });

    it('should not have dateRangeInvalid error when termination date is null', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      component.physicalRuleForm.patchValue({
        effectiveDate: futureDate,
        terminationDate: null
      });
      component.physicalRuleForm.updateValueAndValidity();

      expect(component.physicalRuleForm.hasError('dateRangeInvalid')).toBe(false);
    });
  });

  // Helper function to fill form with valid data
  function fillValidForm(): void {
    // Use a future date to avoid effectiveDateNotPastValidator rejection
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    component.physicalRuleForm.patchValue({
      donationType: { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' },
      procedureCode: { key: 'm9', value: 'test m9' },
      physicalCode: { key: 'AGE', value: 'Donor age not acceptable' },
      dataType: 'N',
      minimumValue: '11',
      maximumValue: '112',
      operator: { key: 'BETWEEN', value: 'BETWEEN' },
      gender: 'A',
      fromAge: 11,
      toAge: 111,
      interdiction: { key: '00008', value: 'Test Interdiction 1' },
      commentsRequired: 'Y',
      manualAuditRequired: 'Y',
      equipmentType: { key: '1000', value: 'Equipment Type 1000' },
      effectiveDate: futureDate,
      terminationDate: null
    });
  }
});
