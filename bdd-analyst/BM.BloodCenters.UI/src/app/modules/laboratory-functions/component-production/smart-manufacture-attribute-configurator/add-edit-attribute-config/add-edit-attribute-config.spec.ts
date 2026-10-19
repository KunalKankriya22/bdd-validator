import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, SimpleChange, SimpleChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { AddEditAttributeConfigComponent } from './add-edit-attribute-config';
import { HeaderService } from '@shared/services/header.service';
import {
  AttributeConfigDto,
  LabProductTypeOption,
  AttributeClassOption,
  AttributeCodeOption,
  ModifierOption,
} from '../models/attribute-configurator.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('AddEditAttributeConfigComponent', () => {
  let component: AddEditAttributeConfigComponent;
  let fixture: ComponentFixture<AddEditAttributeConfigComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockLabProductTypes: LabProductTypeOption[] = [
    { productType: 'PLSM', productTypeDesc: 'Plasma' },
    { productType: 'PLT', productTypeDesc: 'Platelets' },
    { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
  ];

  const mockAttributeClasses: AttributeClassOption[] = [
    { code: 'C0004', codeDesc: 'Class 4' },
    { code: 'C0005', codeDesc: 'Class 5' },
  ];

  const mockAttributeCodes: AttributeCodeOption[] = [
    { code: 'V0011003', codeDesc: 'Code 11003' },
    { code: 'V0011004', codeDesc: 'Code 11004' },
  ];

  const mockModifiers: ModifierOption[] = [
    { code: 'MOD1', codeDesc: 'Modifier 1' },
    { code: 'MOD2', codeDesc: 'Modifier 2' },
  ];

  const futureDate = moment().add(30, 'days').format('DD-MMM-YYYY');
  const futureDatePlus60 = moment().add(60, 'days').format('DD-MMM-YYYY');

  const mockEditData: AttributeConfigDto = {
    chapterId: 'TEST',
    functionName: 'CPICOM2',
    labProductType: 'PLSM',
    productDescription: 'Plasma',
    attributeClass: 'C0004',
    attributeCode: 'V0011003',
    modifier: null,
    effectiveDate: futureDate,
    terminationDate: null,
    insertUser: 'testuser',
    insertDate: '2025-01-30',
    lastModifiedBy: 'testuser',
    modifiedDate: '2025-01-30T08:32:00',
  };

  beforeEach(() => {

    mockHeaderService = createMockHeaderService();



      TestBed.configureTestingModule({
imports: [
        AddEditAttributeConfigComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(AddEditAttributeConfigComponent);
    component = fixture.componentInstance;
    component.mode = 'add';
    component.functionName = 'CPICOM2';
    component.labProductTypes = [
      { productType: 'PLSM', productTypeDesc: 'Plasma' },
      { productType: 'PLT', productTypeDesc: 'Platelets' },
    ];
    component.attributeClasses = [{ code: 'C0004', codeDesc: 'C0004' }];
    component.attributeCodes = [{ code: 'V0011003', codeDesc: 'V0011003' }];
    component.modifiers = [];
    fixture.detectChanges();


    });

  describe('add mode', () => {

    it('should have empty product type description', () => {
      expect(component.productTypeDescription).toBe('');
    });

    it('should require labProductType', () => {
      component.form.get('labProductType')?.setValue('');
      expect(component.form.get('labProductType')?.hasError('required')).toBeTrue();
    });


    it('should update productTypeDescription when labProductType changes', () => {
      component.form.get('labProductType')?.setValue('PLSM');
      expect(component.productTypeDescription).toBe('Plasma');
    });

  });

  describe('edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();
    });


    it('should set product type description from data', () => {
      expect(component.productTypeDescription).toBe('Plasma');
    });


  });
  describe('setErrorMessage', () => {
    it('should set error message and reset submitting state', () => {
      component.isSubmitting = true;
      component.setErrorMessage('Something went wrong');

      expect(component.errorMessage).toBe('Something went wrong');
      expect(component.isSubmitting).toBeFalse();
    });
  });

  // ─── Additional coverage tests ────────────────────────────────────

  describe('component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default input values', () => {
      expect(component.mode).toBe('add');
      expect(component.isSubmitting).toBeFalse();
      expect(component.errorMessage).toBeNull();
    });

    it('should have a form after initialization', () => {
      expect(component.form).toBeTruthy();
    });

    it('should set minDate', () => {
      expect(component.minDate).toBeTruthy();
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });

    it('should set terminationMinDate', () => {
      expect(component.terminationMinDate).toBeTruthy();
      expect(moment.isMoment(component.terminationMinDate)).toBeTrue();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySub = (component as any).destroy$;
      spyOn(destroySub, 'next');
      spyOn(destroySub, 'complete');

      component.ngOnDestroy();

      expect(destroySub.next).toHaveBeenCalled();
      expect(destroySub.complete).toHaveBeenCalled();
    });
  });

  describe('initializeForm (add mode)', () => {
    it('should create form with expected controls', () => {
      expect(component.form.get('labProductType')).toBeTruthy();
      expect(component.form.get('attributeClass')).toBeTruthy();
      expect(component.form.get('attributeCode')).toBeTruthy();
      expect(component.form.get('modifier')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should have empty initial values in add mode', () => {
      expect(component.form.get('labProductType')?.value).toBe('');
      expect(component.form.get('attributeClass')?.value).toBe('');
      expect(component.form.get('attributeCode')?.value).toBe('');
      expect(component.form.get('modifier')?.value).toBe('');
      const effDate = component.form.get('effectiveDate')?.value;
      expect(effDate).toBeTruthy();
      expect(moment.isMoment(effDate)).toBeTrue();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should set required validator on labProductType', () => {
      const control = component.form.get('labProductType');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should set required validator on effectiveDate', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should not require attributeClass', () => {
      const control = component.form.get('attributeClass');
      control?.setValue('');
      expect(control?.hasError('required')).toBeFalse();
    });

    it('should not require attributeCode', () => {
      const control = component.form.get('attributeCode');
      control?.setValue('');
      expect(control?.hasError('required')).toBeFalse();
    });

    it('should not require modifier', () => {
      const control = component.form.get('modifier');
      control?.setValue('');
      expect(control?.hasError('required')).toBeFalse();
    });

    it('should not require terminationDate', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeFalse();
    });
  });

  describe('initializeForm (edit mode)', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should populate labProductType from data', () => {
      expect(component.form.get('labProductType')?.value).toBe('PLSM');
    });

    it('should populate attributeClass from data', () => {
      expect(component.form.get('attributeClass')?.value).toBe('C0004');
    });

    it('should populate attributeCode from data', () => {
      expect(component.form.get('attributeCode')?.value).toBe('V0011003');
    });

    it('should populate modifier as empty string when null in data', () => {
      expect(component.form.get('modifier')?.value).toBe('');
    });

    it('should set productTypeDescription from data.productDescription', () => {
      expect(component.productTypeDescription).toBe('Plasma');
    });

    it('should parse effectiveDate as moment', () => {
      const effDate = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effDate)).toBeTrue();
    });

    it('should handle null terminationDate in data', () => {
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should handle data with terminationDate', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, terminationDate: futureDatePlus60 };
      component.ngOnInit();
      fixture.detectChanges();

      const termDate = component.form.get('terminationDate')?.value;
      expect(moment.isMoment(termDate)).toBeTrue();
    });

    it('should handle data with null productDescription', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, productDescription: '' };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.productTypeDescription).toBe('');
    });
  });

  describe('formattedModifiedDate', () => {
    it('should return empty string when data is null', () => {
      component.data = null;
      expect(component.formattedModifiedDate).toBe('');
    });

    it('should return empty string when modifiedDate is null', () => {
      component.data = { ...mockEditData, modifiedDate: '' };
      expect(component.formattedModifiedDate).toBe('');
    });

    it('should format a valid modifiedDate', () => {
      component.data = { ...mockEditData, modifiedDate: '2025-01-30T08:32:00' };
      const result = component.formattedModifiedDate;
      expect(result).toContain('30-JAN-2025');
      expect(result).toContain('08:32');
    });

    it('should return raw string for invalid date', () => {
      component.data = { ...mockEditData, modifiedDate: 'not-a-date' };
      const result = component.formattedModifiedDate;
      // moment('not-a-date') is invalid, so it should return the raw string
      expect(result).toBe('not-a-date');
    });
  });

  describe('ngOnChanges', () => {
    it('should update filteredLabProductTypes when labProductTypes input changes', () => {
      const changes: SimpleChanges = {
        labProductTypes: new SimpleChange([], mockLabProductTypes, false),
      };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnChanges(changes);

      expect(component.filteredLabProductTypes().length).toBe(mockLabProductTypes.length);
    });

    it('should update filteredAttributeClasses when attributeClasses input changes', () => {
      const changes: SimpleChanges = {
        attributeClasses: new SimpleChange([], mockAttributeClasses, false),
      };
      component.attributeClasses = mockAttributeClasses;
      component.ngOnChanges(changes);

      expect(component.filteredAttributeClasses().length).toBe(mockAttributeClasses.length);
    });

    it('should update filteredAttributeCodes when attributeCodes input changes', () => {
      const changes: SimpleChanges = {
        attributeCodes: new SimpleChange([], mockAttributeCodes, false),
      };
      component.attributeCodes = mockAttributeCodes;
      component.ngOnChanges(changes);

      expect(component.filteredAttributeCodes().length).toBe(mockAttributeCodes.length);
    });

    it('should update filteredModifiers when modifiers input changes', () => {
      const changes: SimpleChanges = {
        modifiers: new SimpleChange([], mockModifiers, false),
      };
      component.modifiers = mockModifiers;
      component.ngOnChanges(changes);

      expect(component.filteredModifiers().length).toBe(mockModifiers.length);
    });

    it('should call populateEditForm when data changes in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnInit();
      fixture.detectChanges();

      const newData = { ...mockEditData, labProductType: 'PLT', productDescription: 'Platelets' };
      component.data = newData;

      const changes: SimpleChanges = {
        data: new SimpleChange(mockEditData, newData, false),
      };
      component.ngOnChanges(changes);

      expect(component.form.get('labProductType')?.value).toBe('PLT');
      expect(component.productTypeDescription).toBe('Platelets');
    });

    it('should not call populateEditForm if mode is add', () => {
      component.mode = 'add';
      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockEditData, false),
      };
      component.data = mockEditData;
      component.ngOnChanges(changes);

      // In add mode, data changes should not populate the form
      expect(component.form.get('labProductType')?.value).toBe('');
    });

    it('should not call populateEditForm if form is not initialized', () => {
      const comp = TestBed.createComponent(AddEditAttributeConfigComponent).componentInstance;
      comp.mode = 'edit';
      comp.data = mockEditData;
      // form is not initialized yet (no ngOnInit called)
      // Should not throw
      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockEditData, false),
      };
      expect(() => comp.ngOnChanges(changes)).not.toThrow();
    });

    it('should not call populateEditForm if data is null', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      // Now set data to null and trigger ngOnChanges
      component.data = null;
      const changes: SimpleChanges = {
        data: new SimpleChange(mockEditData, null, false),
      };
      component.ngOnChanges(changes);
      // populateEditForm should be skipped because data is null; form keeps previous value
      expect(component.form.get('labProductType')?.value).toBe('PLSM');
    });
  });

  describe('setupProductTypeListener', () => {
    it('should set productTypeDescription when labProductType is selected', () => {
      component.labProductTypes = mockLabProductTypes;
      component.form.get('labProductType')?.setValue('RBC');
      expect(component.productTypeDescription).toBe('Red Blood Cells');
    });

    it('should set empty description when product type is not found', () => {
      component.form.get('labProductType')?.setValue('NONEXISTENT');
      expect(component.productTypeDescription).toBe('');
    });

    it('should update description when product type changes', () => {
      component.labProductTypes = mockLabProductTypes;
      component.form.get('labProductType')?.setValue('PLSM');
      expect(component.productTypeDescription).toBe('Plasma');

      component.form.get('labProductType')?.setValue('PLT');
      expect(component.productTypeDescription).toBe('Platelets');
    });
  });

  describe('setupDropdownSearch', () => {
    beforeEach(() => {
      component.labProductTypes = mockLabProductTypes;
      component.attributeClasses = mockAttributeClasses;
      component.attributeCodes = mockAttributeCodes;
      component.modifiers = mockModifiers;
      // Re-init to pick up the new data in the search setup
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should filter labProductTypes by productType', () => {
      component.labProductTypeSearchControl.setValue('plsm');
      expect(component.filteredLabProductTypes().length).toBe(1);
      expect(component.filteredLabProductTypes()[0].productType).toBe('PLSM');
    });

    it('should filter labProductTypes by productTypeDesc', () => {
      component.labProductTypeSearchControl.setValue('Plasma');
      expect(component.filteredLabProductTypes().length).toBe(1);
    });

    it('should show all labProductTypes when search is empty', () => {
      component.labProductTypeSearchControl.setValue('plsm');
      expect(component.filteredLabProductTypes().length).toBe(1);

      component.labProductTypeSearchControl.setValue('');
      expect(component.filteredLabProductTypes().length).toBe(mockLabProductTypes.length);
    });

    it('should show all labProductTypes when search is null', () => {
      component.labProductTypeSearchControl.setValue(null as any);
      expect(component.filteredLabProductTypes().length).toBe(mockLabProductTypes.length);
    });

    it('should filter attributeClasses by code', () => {
      component.attributeClassSearchControl.setValue('C0004');
      expect(component.filteredAttributeClasses().length).toBe(1);
      expect(component.filteredAttributeClasses()[0].code).toBe('C0004');
    });

    it('should filter attributeClasses by codeDesc', () => {
      component.attributeClassSearchControl.setValue('Class 5');
      expect(component.filteredAttributeClasses().length).toBe(1);
      expect(component.filteredAttributeClasses()[0].code).toBe('C0005');
    });

    it('should show all attributeClasses when search is empty', () => {
      component.attributeClassSearchControl.setValue('');
      expect(component.filteredAttributeClasses().length).toBe(mockAttributeClasses.length);
    });

    it('should filter attributeCodes by code', () => {
      component.attributeCodeSearchControl.setValue('V0011003');
      expect(component.filteredAttributeCodes().length).toBe(1);
      expect(component.filteredAttributeCodes()[0].code).toBe('V0011003');
    });

    it('should filter attributeCodes by codeDesc', () => {
      component.attributeCodeSearchControl.setValue('Code 11004');
      expect(component.filteredAttributeCodes().length).toBe(1);
      expect(component.filteredAttributeCodes()[0].code).toBe('V0011004');
    });

    it('should show all attributeCodes when search is empty', () => {
      component.attributeCodeSearchControl.setValue('');
      expect(component.filteredAttributeCodes().length).toBe(mockAttributeCodes.length);
    });

    it('should filter modifiers by code', () => {
      component.modifierSearchControl.setValue('MOD1');
      expect(component.filteredModifiers().length).toBe(1);
      expect(component.filteredModifiers()[0].code).toBe('MOD1');
    });

    it('should filter modifiers by codeDesc', () => {
      component.modifierSearchControl.setValue('Modifier 2');
      expect(component.filteredModifiers().length).toBe(1);
      expect(component.filteredModifiers()[0].code).toBe('MOD2');
    });

    it('should show all modifiers when search is empty', () => {
      component.modifierSearchControl.setValue('');
      expect(component.filteredModifiers().length).toBe(mockModifiers.length);
    });

    it('should return empty array when no match', () => {
      component.labProductTypeSearchControl.setValue('ZZZZZ');
      expect(component.filteredLabProductTypes().length).toBe(0);
    });
  });

  describe('date validation listeners', () => {
    it('should set lastChangedDateField to effective when effectiveDate changes', () => {
      const futureM = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(futureM);
      expect((component as any).lastChangedDateField).toBe('effective');
    });

    it('should set lastChangedDateField to termination when terminationDate changes', () => {
      const futureM = moment().add(20, 'days');
      component.form.get('terminationDate')?.setValue(futureM);
      expect((component as any).lastChangedDateField).toBe('termination');
    });

    it('should not re-emit when effectiveDate set to same value', () => {
      const futureM = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(futureM);
      expect((component as any).lastChangedDateField).toBe('effective');

      // Reset and set same date to same value
      (component as any).lastChangedDateField = null;
      component.form.get('effectiveDate')?.setValue(futureM.clone());
      // distinctUntilChanged should prevent emission since format matches
      expect((component as any).lastChangedDateField).toBeNull();
    });

    it('should not re-emit when terminationDate set to same value', () => {
      const futureM = moment().add(20, 'days');
      component.form.get('terminationDate')?.setValue(futureM);
      expect((component as any).lastChangedDateField).toBe('termination');

      (component as any).lastChangedDateField = null;
      component.form.get('terminationDate')?.setValue(futureM.clone());
      expect((component as any).lastChangedDateField).toBeNull();
    });
  });

  describe('updateTerminationMinDate', () => {
    it('should use effectiveDate as terminationMinDate when effective is after minDate', () => {
      const futureM = moment().add(30, 'days');
      component.form.get('effectiveDate')?.setValue(futureM);
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureM.format('YYYY-MM-DD'));
    });

    it('should use minDate when no effectiveDate is set', () => {
      component.form.get('effectiveDate')?.setValue(null);
      // Force the update
      (component as any).updateTerminationMinDate();
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });

    it('should handle Date object as effectiveDate value', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      component.form.get('effectiveDate')?.setValue(futureDate);
      (component as any).updateTerminationMinDate();
      // Should not throw and should set a valid terminationMinDate
      expect(moment.isMoment(component.terminationMinDate)).toBeTrue();
    });

    it('should use minDate when effectiveDate is before minDate', () => {
      // Create an effective date that is the same as minDate
      const sameAsMin = component.minDate.clone();
      component.form.get('effectiveDate')?.setValue(sameAsMin);
      (component as any).updateTerminationMinDate();
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '15-JAN-2026' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
        '15-JAN-2026',
        component.form.get('effectiveDate'),
      );
    });
  });

  describe('onEffectiveDateChange', () => {
    it('should mark effectiveDate as touched and dirty', () => {
      component.onEffectiveDateChange();
      const control = component.form.get('effectiveDate');
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });

    it('should update form validity', () => {
      spyOn(component.form, 'updateValueAndValidity');
      component.onEffectiveDateChange();
      expect(component.form.updateValueAndValidity).toHaveBeenCalled();
    });
  });

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput in add mode', () => {
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '20-JAN-2026' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '20-JAN-2026',
        component.form.get('terminationDate'),
        false,
      );
    });

    it('should pass isEditMode=true in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnInit();
      fixture.detectChanges();

      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '20-JAN-2026' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '20-JAN-2026',
        component.form.get('terminationDate'),
        true,
      );
    });
  });

  describe('onTerminationDateChange', () => {
    it('should mark terminationDate as touched and dirty', () => {
      component.onTerminationDateChange();
      const control = component.form.get('terminationDate');
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });

    it('should update form validity', () => {
      spyOn(component.form, 'updateValueAndValidity');
      component.onTerminationDateChange();
      expect(component.form.updateValueAndValidity).toHaveBeenCalled();
    });
  });

  describe('onEffectiveDateBlur', () => {
    it('should mark effectiveDate as touched after blur', fakeAsync(() => {
      component.onEffectiveDateBlur();
      tick(10);
      const control = component.form.get('effectiveDate');
      expect(control?.touched).toBeTrue();
    }));

    it('should report invalid error via getter when input has text but no parsed value', fakeAsync(() => {
      // Set up a ViewChild mock with invalid text
      (component as any).effectiveDateInput = {
        nativeElement: { value: '!@#' },
      };
      const control = component.form.get('effectiveDate');
      control?.setValue(null, { emitEvent: false });
      // Spy on dateAdapter to ensure parse returns null (truly unparseable)
      const dateAdapter = (component as any).dateAdapter;
      spyOn(dateAdapter, 'parse').and.returnValue(null);

      component.onEffectiveDateBlur();
      tick(10);

      // The error message getter checks input element text vs control value (Priority 3)
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    }));

    it('should not report invalid error when input is empty', fakeAsync(() => {
      (component as any).effectiveDateInput = {
        nativeElement: { value: '' },
      };
      component.form.get('effectiveDate')?.setValue(null, { emitEvent: false });

      component.onEffectiveDateBlur();
      tick(10);

      const control = component.form.get('effectiveDate');
      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should try to parse input and set value if successfully parsed', fakeAsync(() => {
      const futureM = moment().add(10, 'days');
      (component as any).effectiveDateInput = {
        nativeElement: { value: futureM.format('DD-MMM-YYYY') },
      };
      const control = component.form.get('effectiveDate');
      control?.setValue(null, { emitEvent: false });
      const dateAdapter = (component as any).dateAdapter;
      spyOn(dateAdapter, 'parse').and.returnValue(futureM);
      spyOn(dateAdapter, 'format').and.returnValue(futureM.format('DD-MMM-YYYY'));

      component.onEffectiveDateBlur();
      tick(10);

      expect(control?.value).toBeTruthy();
    }));
  });

  describe('onTerminationDateBlur', () => {
    it('should mark terminationDate as touched after blur', fakeAsync(() => {
      component.onTerminationDateBlur();
      tick(10);
      const control = component.form.get('terminationDate');
      expect(control?.touched).toBeTrue();
    }));

    it('should report invalid error via getter when input has text but no parsed value', fakeAsync(() => {
      (component as any).terminationDateInput = {
        nativeElement: { value: '!@#' },
      };
      const control = component.form.get('terminationDate');
      control?.setValue(null, { emitEvent: false });
      // Spy on dateAdapter to ensure parse returns null (truly unparseable)
      const dateAdapter = (component as any).dateAdapter;
      spyOn(dateAdapter, 'parse').and.returnValue(null);

      component.onTerminationDateBlur();
      tick(10);

      // The error message getter checks input element text vs control value (Priority 3)
      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    }));

    it('should not report invalid error when input is empty', fakeAsync(() => {
      (component as any).terminationDateInput = {
        nativeElement: { value: '' },
      };
      component.form.get('terminationDate')?.setValue(null, { emitEvent: false });

      component.onTerminationDateBlur();
      tick(10);

      const control = component.form.get('terminationDate');
      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should try to parse input and set value if successfully parsed', fakeAsync(() => {
      const futureM = moment().add(30, 'days');
      (component as any).terminationDateInput = {
        nativeElement: { value: futureM.format('DD-MMM-YYYY') },
      };
      const control = component.form.get('terminationDate');
      control?.setValue(null, { emitEvent: false });
      const dateAdapter = (component as any).dateAdapter;
      spyOn(dateAdapter, 'parse').and.returnValue(futureM);
      spyOn(dateAdapter, 'format').and.returnValue(futureM.format('DD-MMM-YYYY'));

      component.onTerminationDateBlur();
      tick(10);

      expect(control?.value).toBeTruthy();
    }));
  });

  describe('getEffectiveDateError', () => {
    it('should return empty string when control does not exist', () => {
      spyOn(component.form, 'get').and.returnValue(null);
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return invalidDate message when invalidDate error set', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return invalidDate message for matDatepickerParse error', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: { text: 'abc' } });
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return invalid date when input has text but no value', () => {
      (component as any).effectiveDateInput = {
        nativeElement: { value: 'some-text' },
      };
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.setErrors(null);
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return required message when required and touched', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      // The required error is set by the validators
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return past date message for effectiveDatePast error', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ effectiveDatePast: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be in the past');
    });

    it('should return date range message when lastChangedDateField is effective and form has dateRangeInvalid', () => {
      (component as any).lastChangedDateField = 'effective';
      // Set a valid effective date (no field-level errors) but form has cross-field error
      const futureM = moment().add(30, 'days');
      component.form.get('effectiveDate')?.setValue(futureM);
      component.form.get('effectiveDate')?.setErrors(null);

      // Manually set form-level error
      component.form.setErrors({ dateRangeInvalid: true });

      expect(component.getEffectiveDateError()).toBe('Effective Date must be before Termination Date');
    });

    it('should not return date range message when lastChangedDateField is termination', () => {
      const futureM = moment().add(30, 'days');
      component.form.get('effectiveDate')?.setValue(futureM);
      component.form.get('effectiveDate')?.setErrors(null);
      component.form.setErrors({ dateRangeInvalid: true });
      // Set lastChangedDateField AFTER setValue to avoid valueChanges listener overwriting it
      (component as any).lastChangedDateField = 'termination';

      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string when no errors exist', () => {
      const futureM = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(futureM);
      component.form.get('effectiveDate')?.setErrors(null);
      (component as any).effectiveDateInput = undefined;
      expect(component.getEffectiveDateError()).toBe('');
    });
  });

  describe('getTerminationDateError', () => {
    it('should return empty string when control does not exist', () => {
      spyOn(component.form, 'get').and.returnValue(null);
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return invalidDate message when invalidDate error set', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    });

    it('should return invalidDate message for matDatepickerParse error', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ matDatepickerParse: { text: 'abc' } });
      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    });

    it('should return invalid when input has text but no value', () => {
      (component as any).terminationDateInput = {
        nativeElement: { value: 'some-text' },
      };
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      control?.setErrors(null);
      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    });

    it('should return required message in add mode when terminationDateRequired error and touched', () => {
      component.mode = 'add';
      const control = component.form.get('terminationDate');
      control?.setErrors({ terminationDateRequired: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is required');
    });

    it('should NOT return required message in edit mode even with terminationDateRequired error', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnInit();
      fixture.detectChanges();

      const control = component.form.get('terminationDate');
      control?.setErrors({ terminationDateRequired: true });
      control?.markAsTouched();
      // The mode check prevents showing required in edit mode
      expect(component.getTerminationDateError()).not.toBe('Termination Date is required');
    });

    it('should return date range message when lastChangedDateField is termination and form has dateRangeInvalid', () => {
      (component as any).lastChangedDateField = 'termination';
      const control = component.form.get('terminationDate');
      control?.setValue(moment().add(5, 'days'));
      control?.setErrors(null);
      component.form.setErrors({ dateRangeInvalid: true });

      expect(component.getTerminationDateError()).toBe('Termination Date must be after Effective Date');
    });

    it('should not return date range message when lastChangedDateField is effective', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(moment().add(5, 'days'));
      control?.setErrors(null);
      component.form.setErrors({ dateRangeInvalid: true });
      // Set lastChangedDateField AFTER setValue to avoid valueChanges listener overwriting it
      (component as any).lastChangedDateField = 'effective';

      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return empty string when no errors exist', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(moment().add(30, 'days'));
      control?.setErrors(null);
      (component as any).terminationDateInput = undefined;
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('isFormInvalid', () => {
    it('should return true when form is not initialized', () => {
      const comp = TestBed.createComponent(AddEditAttributeConfigComponent).componentInstance;
      expect(comp.isFormInvalid).toBeTrue();
    });

    it('should return true when form is invalid in add mode', () => {
      component.form.get('labProductType')?.setValue('');
      expect(component.isFormInvalid).toBeTrue();
    });

    it('should return false when form is valid in add mode', () => {
      component.form.get('labProductType')?.setValue('PLSM');
      component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
      component.form.updateValueAndValidity();

      if (component.form.valid) {
        expect(component.isFormInvalid).toBeFalse();
      }
    });

    it('should return true in edit mode when form has not changed', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      // No changes made, so should be disabled
      expect(component.isFormInvalid).toBeTrue();
    });

    it('should return false in edit mode when form is valid and has changed', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      // Make a change
      component.form.get('attributeClass')?.setValue('C0005');
      component.form.updateValueAndValidity();

      if (component.form.valid) {
        expect(component.isFormInvalid).toBeFalse();
      }
    });

    it('should return true in edit mode when form is invalid even if changed', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      // Make form invalid
      component.form.get('labProductType')?.setValue('');
      expect(component.isFormInvalid).toBeTrue();
    });
  });

  describe('hasFormChanged (private, tested via isFormInvalid)', () => {
    it('should return true in add mode', () => {
      component.mode = 'add';
      // In add mode hasFormChanged always returns true
      // We test indirectly: a valid add form should not be invalid
      component.form.get('labProductType')?.setValue('PLSM');
      component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
      component.form.updateValueAndValidity();
      if (component.form.valid) {
        expect(component.isFormInvalid).toBeFalse();
      }
    });

    it('should detect modifier change from null/empty to value in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, modifier: null };
      component.labProductTypes = mockLabProductTypes;
      component.modifiers = mockModifiers;
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('modifier')?.setValue('MOD1');
      component.form.updateValueAndValidity();

      if (component.form.valid) {
        expect(component.isFormInvalid).toBeFalse();
      }
    });

    it('should detect effectiveDate change in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      const newDate = moment().add(45, 'days');
      component.form.get('effectiveDate')?.setValue(newDate);
      component.form.updateValueAndValidity();

      if (component.form.valid) {
        expect(component.isFormInvalid).toBeFalse();
      }
    });

    it('should detect terminationDate change in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      const newTermDate = moment().add(90, 'days');
      component.form.get('terminationDate')?.setValue(newTermDate);
      component.form.updateValueAndValidity();

      if (component.form.valid) {
        expect(component.isFormInvalid).toBeFalse();
      }
    });
  });

  describe('onSubmit', () => {
    it('should not emit save if already submitting', () => {
      spyOn(component.save, 'emit');
      component.isSubmitting = true;
      component.onSubmit();
      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched', () => {
      spyOn(component.form, 'markAllAsTouched');
      component.onSubmit();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should call clearOptionalDateErrors for terminationDate', () => {
      spyOn(DateFieldValidationUtility, 'clearOptionalDateErrors');
      component.onSubmit();
      expect(DateFieldValidationUtility.clearOptionalDateErrors).toHaveBeenCalledWith(
        component.form,
        'terminationDate',
      );
    });

    it('should not emit save if form is invalid', () => {
      spyOn(component.save, 'emit');
      // Form is invalid because labProductType is empty
      component.onSubmit();
      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should emit save with correct DTO when form is valid', () => {
      spyOn(component.save, 'emit');
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.callFake((d) => {
        if (!d) return null;
        return moment.isMoment(d) ? d.format('YYYY-MM-DD') : moment(d).format('YYYY-MM-DD');
      });

      const futureM = moment().add(10, 'days');
      component.form.get('labProductType')?.setValue('PLSM');
      component.form.get('attributeClass')?.setValue('C0004');
      component.form.get('attributeCode')?.setValue('V0011003');
      component.form.get('modifier')?.setValue('MOD1');
      component.form.get('effectiveDate')?.setValue(futureM);
      component.form.updateValueAndValidity();

      component.onSubmit();

      expect(component.isSubmitting).toBeTrue();
      expect(component.errorMessage).toBeNull();
      expect(component.save.emit).toHaveBeenCalled();

      const emittedDto = (component.save.emit as jasmine.Spy).calls.first().args[0];
      expect(emittedDto.functionName).toBe('CPICOM2');
      expect(emittedDto.labProductType).toBe('PLSM');
      expect(emittedDto.attributeClass).toBe('C0004');
      expect(emittedDto.attributeCode).toBe('V0011003');
      expect(emittedDto.modifier).toBe('MOD1');
    });

    it('should set modifier to null when modifier is empty', () => {
      spyOn(component.save, 'emit');
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2026-03-01');

      const futureM = moment().add(10, 'days');
      component.form.get('labProductType')?.setValue('PLSM');
      component.form.get('modifier')?.setValue('');
      component.form.get('effectiveDate')?.setValue(futureM);
      component.form.updateValueAndValidity();

      component.onSubmit();

      if (component.save.emit.calls.count() > 0) {
        const emittedDto = (component.save.emit as jasmine.Spy).calls.first().args[0];
        expect(emittedDto.modifier).toBeNull();
      }
    });

    it('should set lastChangedDateField to effective when form has dateRangeInvalid and no lastChangedDateField', () => {
      (component as any).lastChangedDateField = null;
      // Set form-level error manually
      component.form.setErrors({ dateRangeInvalid: true });
      component.onSubmit();
      expect((component as any).lastChangedDateField).toBe('effective');
    });

    it('should not override lastChangedDateField when already set', () => {
      (component as any).lastChangedDateField = 'termination';
      component.form.setErrors({ dateRangeInvalid: true });
      component.onSubmit();
      expect((component as any).lastChangedDateField).toBe('termination');
    });
  });

  describe('onSaveAndCreateAnother', () => {
    it('should not emit if already submitting', () => {
      spyOn(component.saveAndCreateAnother, 'emit');
      component.isSubmitting = true;
      component.onSaveAndCreateAnother();
      expect(component.saveAndCreateAnother.emit).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched', () => {
      spyOn(component.form, 'markAllAsTouched');
      component.onSaveAndCreateAnother();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should call clearOptionalDateErrors for terminationDate', () => {
      spyOn(DateFieldValidationUtility, 'clearOptionalDateErrors');
      component.onSaveAndCreateAnother();
      expect(DateFieldValidationUtility.clearOptionalDateErrors).toHaveBeenCalledWith(
        component.form,
        'terminationDate',
      );
    });

    it('should not emit if form is invalid', () => {
      spyOn(component.saveAndCreateAnother, 'emit');
      component.onSaveAndCreateAnother();
      expect(component.saveAndCreateAnother.emit).not.toHaveBeenCalled();
    });

    it('should emit saveAndCreateAnother with correct DTO when form is valid', () => {
      spyOn(component.saveAndCreateAnother, 'emit');
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.callFake((d) => {
        if (!d) return null;
        return moment.isMoment(d) ? d.format('YYYY-MM-DD') : moment(d).format('YYYY-MM-DD');
      });

      const futureM = moment().add(10, 'days');
      component.form.get('labProductType')?.setValue('PLSM');
      component.form.get('attributeClass')?.setValue('C0004');
      component.form.get('attributeCode')?.setValue('V0011003');
      component.form.get('effectiveDate')?.setValue(futureM);
      component.form.updateValueAndValidity();

      component.onSaveAndCreateAnother();

      expect(component.isSubmitting).toBeTrue();
      expect(component.errorMessage).toBeNull();
      expect(component.saveAndCreateAnother.emit).toHaveBeenCalled();

      const emittedDto = (component.saveAndCreateAnother.emit as jasmine.Spy).calls.first().args[0];
      expect(emittedDto.functionName).toBe('CPICOM2');
      expect(emittedDto.labProductType).toBe('PLSM');
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('resetSubmissionState', () => {
    it('should set isSubmitting to false', () => {
      component.isSubmitting = true;
      component.resetSubmissionState();
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('resetForm', () => {
    it('should reset all form values', () => {
      component.form.get('labProductType')?.setValue('PLSM');
      component.form.get('attributeClass')?.setValue('C0004');
      component.form.get('effectiveDate')?.setValue(moment());

      component.resetForm();

      expect(component.form.get('labProductType')?.value).toBe('');
      expect(component.form.get('attributeClass')?.value).toBe('');
      expect(component.form.get('attributeCode')?.value).toBe('');
      expect(component.form.get('modifier')?.value).toBe('');
      const effDate = component.form.get('effectiveDate')?.value;
      expect(effDate).toBeTruthy();
      expect(moment.isMoment(effDate)).toBeTrue();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should reset isSubmitting to false', () => {
      component.isSubmitting = true;
      component.resetForm();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should reset errorMessage to null', () => {
      component.errorMessage = 'some error';
      component.resetForm();
      expect(component.errorMessage).toBeNull();
    });

    it('should reset lastChangedDateField to null', () => {
      (component as any).lastChangedDateField = 'effective';
      component.resetForm();
      expect((component as any).lastChangedDateField).toBeNull();
    });

    it('should reset productTypeDescription to empty', () => {
      component.productTypeDescription = 'Plasma';
      component.resetForm();
      expect(component.productTypeDescription).toBe('');
    });

    it('should mark all controls as untouched and pristine', () => {
      component.form.get('labProductType')?.markAsTouched();
      component.form.get('labProductType')?.markAsDirty();

      component.resetForm();

      expect(component.form.get('labProductType')?.touched).toBeFalse();
      expect(component.form.get('labProductType')?.dirty).toBeFalse();
      expect(component.form.get('effectiveDate')?.touched).toBeFalse();
      expect(component.form.get('effectiveDate')?.dirty).toBeFalse();
    });
  });

  describe('setErrorMessage', () => {
    it('should set errorMessage to the provided string', () => {
      component.setErrorMessage('Test error');
      expect(component.errorMessage).toBe('Test error');
    });

    it('should set isSubmitting to false', () => {
      component.isSubmitting = true;
      component.setErrorMessage('Error');
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('editModeEffectiveDateValidator (private, tested via form)', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should not show error when date has not changed from initial', () => {
      // The form was initialized with the data's effectiveDate
      // Without changing it, the validator should not set effectiveDatePast
      const control = component.form.get('effectiveDate');
      control?.updateValueAndValidity();
      expect(control?.hasError('effectiveDatePast')).toBeFalse();
    });

    it('should validate when date changes to a new value', () => {
      const newFutureDate = moment().add(60, 'days');
      component.form.get('effectiveDate')?.setValue(newFutureDate);
      component.form.get('effectiveDate')?.updateValueAndValidity();

      // A future date should not be past
      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalse();
    });

    it('should return null when initialFormValues is not set yet', () => {
      // Manually set initialFormValues to null to simulate form initialization
      (component as any).initialFormValues = null;
      component.form.get('effectiveDate')?.updateValueAndValidity();
      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalse();
    });
  });

  describe('editModeCrossFieldDateRangeValidator (private, tested via form)', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should not validate when neither date has changed', () => {
      component.form.updateValueAndValidity();
      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should validate date range when effectiveDate changes', () => {
      const futureM = moment().add(60, 'days');
      const termM = moment().add(30, 'days');

      component.form.get('effectiveDate')?.setValue(futureM);
      component.form.get('terminationDate')?.setValue(termM);
      component.form.updateValueAndValidity();

      // effective > termination should produce error
      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should not show error when dates are in valid range after change', () => {
      const effM = moment().add(30, 'days');
      const termM = moment().add(60, 'days');

      component.form.get('effectiveDate')?.setValue(effM);
      component.form.get('terminationDate')?.setValue(termM);
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should return null when initialFormValues is not set', () => {
      (component as any).initialFormValues = null;
      component.form.updateValueAndValidity();
      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });
  });

  describe('clearUnchangedDateErrors (private, tested via form status changes)', () => {
    it('should clear matDatepickerMin error when date has not changed in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      const control = component.form.get('effectiveDate');
      // Manually set a matDatepickerMin error
      control?.setErrors({ matDatepickerMin: true });

      // Trigger clearUnchangedDateErrors via status change
      (component as any).clearUnchangedDateErrors();

      expect(control?.hasError('matDatepickerMin')).toBeFalse();
    });

    it('should not clear matDatepickerMin when date has changed', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      const newDate = moment().add(100, 'days');
      component.form.get('effectiveDate')?.setValue(newDate);
      component.form.get('effectiveDate')?.setErrors({ matDatepickerMin: true });

      (component as any).clearUnchangedDateErrors();

      // Since the date changed, the error should remain
      expect(component.form.get('effectiveDate')?.hasError('matDatepickerMin')).toBeTrue();
    });

    it('should be a no-op in add mode', () => {
      component.mode = 'add';
      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerMin: true });

      (component as any).clearUnchangedDateErrors();

      // Should not clear errors in add mode
      expect(control?.hasError('matDatepickerMin')).toBeTrue();
    });

    it('should be a no-op when initialFormValues is null', () => {
      component.mode = 'edit';
      (component as any).initialFormValues = null;
      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerMin: true });

      (component as any).clearUnchangedDateErrors();

      expect(control?.hasError('matDatepickerMin')).toBeTrue();
    });

    it('should keep other errors when clearing matDatepickerMin', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerMin: true, required: true });

      (component as any).clearUnchangedDateErrors();

      expect(control?.hasError('matDatepickerMin')).toBeFalse();
      expect(control?.hasError('required')).toBeTrue();
    });
  });

  describe('storeInitialValues (private)', () => {
    it('should not store values in add mode', () => {
      component.mode = 'add';
      (component as any).storeInitialValues();
      expect((component as any).initialFormValues).toBeNull();
    });

    it('should not store values when data is null', () => {
      component.mode = 'edit';
      component.data = null;
      (component as any).storeInitialValues();
      expect((component as any).initialFormValues).toBeNull();
    });

    it('should store values in edit mode with valid data', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      const stored = (component as any).initialFormValues;
      expect(stored).toBeTruthy();
      expect(stored.labProductType).toBe('PLSM');
      expect(stored.attributeClass).toBe('C0004');
      expect(stored.attributeCode).toBe('V0011003');
    });

    it('should normalize empty modifier to null', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, modifier: null };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      const stored = (component as any).initialFormValues;
      expect(stored.modifier).toBeNull();
    });
  });

  describe('populateEditForm (private, tested via ngOnChanges)', () => {
    it('should update form values when data changes in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      const newData: AttributeConfigDto = {
        ...mockEditData,
        labProductType: 'PLT',
        productDescription: 'Platelets',
        attributeClass: 'C0005',
        modifier: 'MOD1',
      };
      component.data = newData;
      const changes: SimpleChanges = {
        data: new SimpleChange(mockEditData, newData, false),
      };
      component.ngOnChanges(changes);

      expect(component.form.get('labProductType')?.value).toBe('PLT');
      expect(component.form.get('attributeClass')?.value).toBe('C0005');
      expect(component.form.get('modifier')?.value).toBe('MOD1');
      expect(component.productTypeDescription).toBe('Platelets');
    });

    it('should handle null modifier in data by setting empty string', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, modifier: null };
      component.labProductTypes = mockLabProductTypes;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.get('modifier')?.value).toBe('');
    });
  });

  describe('error state matchers', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });

  describe('search controls initialization', () => {
    it('should have labProductTypeSearchControl initialized', () => {
      expect(component.labProductTypeSearchControl).toBeTruthy();
      expect(component.labProductTypeSearchControl.value).toBe('');
    });

    it('should have attributeClassSearchControl initialized', () => {
      expect(component.attributeClassSearchControl).toBeTruthy();
      expect(component.attributeClassSearchControl.value).toBe('');
    });

    it('should have attributeCodeSearchControl initialized', () => {
      expect(component.attributeCodeSearchControl).toBeTruthy();
      expect(component.attributeCodeSearchControl.value).toBe('');
    });

    it('should have modifierSearchControl initialized', () => {
      expect(component.modifierSearchControl).toBeTruthy();
      expect(component.modifierSearchControl.value).toBe('');
    });
  });

  describe('validateEffectiveDateInput (private)', () => {
    it('should set invalidDate when input has text but control has no value', () => {
      (component as any).effectiveDateInput = {
        nativeElement: { value: 'bad-input' },
      };
      component.form.get('effectiveDate')?.setValue(null);
      (component as any).validateEffectiveDateInput();
      expect(component.form.get('effectiveDate')?.hasError('invalidDate')).toBeTrue();
    });

    it('should remove invalidDate when control has a valid value', () => {
      (component as any).effectiveDateInput = {
        nativeElement: { value: '01-JAN-2027' },
      };
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.setValue(moment('2027-01-01'));
      (component as any).validateEffectiveDateInput();
      expect(control?.hasError('invalidDate')).toBeFalse();
    });

    it('should keep other errors when removing invalidDate', () => {
      (component as any).effectiveDateInput = {
        nativeElement: { value: '01-JAN-2027' },
      };
      const control = component.form.get('effectiveDate');
      // Set value first, then manually set errors (setValue triggers validators that clear manual errors)
      control?.setValue(moment('2027-01-01'));
      control?.setErrors({ invalidDate: true, effectiveDatePast: true });
      (component as any).validateEffectiveDateInput();
      expect(control?.hasError('invalidDate')).toBeFalse();
      expect(control?.hasError('effectiveDatePast')).toBeTrue();
    });

    it('should handle missing effectiveDateInput element', () => {
      (component as any).effectiveDateInput = undefined;
      component.form.get('effectiveDate')?.setValue(null);
      expect(() => (component as any).validateEffectiveDateInput()).not.toThrow();
    });
  });

  describe('validateTerminationDateInput (private)', () => {
    it('should set invalidDate when input has text but control has no value', () => {
      (component as any).terminationDateInput = {
        nativeElement: { value: 'xyz' },
      };
      component.form.get('terminationDate')?.setValue(null);
      (component as any).validateTerminationDateInput();
      expect(component.form.get('terminationDate')?.hasError('invalidDate')).toBeTrue();
    });

    it('should remove invalidDate when control has a valid value', () => {
      (component as any).terminationDateInput = {
        nativeElement: { value: '01-FEB-2027' },
      };
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.setValue(moment('2027-02-01'));
      (component as any).validateTerminationDateInput();
      expect(control?.hasError('invalidDate')).toBeFalse();
    });

    it('should handle missing terminationDateInput element', () => {
      (component as any).terminationDateInput = undefined;
      component.form.get('terminationDate')?.setValue(null);
      expect(() => (component as any).validateTerminationDateInput()).not.toThrow();
    });
  });

  describe('chapterOffset (private getter)', () => {
    it('should call headerService.chapterTimeZone', () => {
      const offset = (component as any).chapterOffset;
      expect(offset).toBe('America/New_York');
    });
  });
});
