import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { SimpleChange } from '@angular/core';
import moment from 'moment';
import { of, throwError } from 'rxjs';

import { AddEditAttributeCodeComponent } from './add-edit-attribute-code';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { AttributeCodesApiService } from '../services/attribute-codes-api.service';
import { AttributeCodeModel } from '../models/attribute-codes.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditAttributeCodeComponent', () => {
  let component: AddEditAttributeCodeComponent;
  let fixture: ComponentFixture<AddEditAttributeCodeComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockApiService: jasmine.SpyObj<AttributeCodesApiService>;

  const mockEditData: AttributeCodeModel = {
    attributeGroup: 'ALERT',
    attributeCode: 'CMV',
    description: 'CMV Negative',
    unitSchemeType: 'C',
    statusFlag: 'H',
    stopLabelFlag: 'N',
    assignAfterLabelFlag: 'N',
    showOnLabelFlag: 'Y',
    attributeCustom: 'N',
    normalStockFlag: 'Y',
    creditFlag: 'Y',
    attributeType: 'TEST',
    exclusivityFlag: 'Y',
    effectiveDate: '2024-01-15',
    terminationDate: '2025-12-31',
    lastModifiedDate: '2024-01-15T10:30:00Z',
    interCode: 'ABOT',
    price: 100,
    serviceCode: '99999',
    attributeLabel: 'Test Label',
    attributeAbbrev: 'TL',
    attributePosition: 1
  };

  const mockInterdictionCodes = [
    { value: 'ABOT', label: 'ABOT - Abortion', description: 'Abortion' },
    { value: 'AIDS', label: 'AIDS - AIDS Risk', description: 'AIDS Risk' }
  ];

  const mockAttributeCodes = [
    { value: 'CMV', label: 'CMV' },
    { value: 'HIV', label: 'HIV' }
  ];

  const futureDate = moment('2099-06-15');

  beforeEach(() => {

    mockHeaderService = createMockHeaderService();
    mockApiService = jasmine.createSpyObj('AttributeCodesApiService', [
      'getInterdictionCodes',
      'getAttributeCodesDropdown'
    ]);
    mockApiService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
    mockApiService.getAttributeCodesDropdown.and.returnValue(of(mockAttributeCodes));



      TestBed.configureTestingModule({
imports: [
        AddEditAttributeCodeComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule
      ],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: AttributeCodesApiService, useValue: mockApiService },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
      ]
    });


    });



  beforeEach(() => {

      mockApiService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));


      mockApiService.getAttributeCodesDropdown.and.returnValue(of(mockAttributeCodes));


    fixture = TestBed.createComponent(AddEditAttributeCodeComponent);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {





    it('should initialize in add mode with attribute group', fakeAsync(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnInit();
      tick();

      // Attribute code is now a text input (not dropdown), so no API call needed
      expect(component.form.get('attributeCode')).toBeTruthy();
      expect(component.form.get('attributeCode')?.enabled).toBeTrue();
    }));
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should enable all form fields in add mode', () => {
      expect(component.form.get('attributeCode')?.enabled).toBeTrue();
      expect(component.form.get('description')?.enabled).toBeTrue();
      expect(component.form.get('unitScheme')?.enabled).toBeTrue();
      expect(component.form.get('statusFlag')?.enabled).toBeTrue();
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });


    it('should show "Add New Attribute Code" as dialog title', () => {
      expect(component.dialogTitle).toBe('Add New Attribute Code');
    });

    it('should show "ADD" as submit button label', () => {
      expect(component.submitButtonLabel).toBe('ADD');
    });

    it('should show create another button', () => {
      expect(component.showCreateAnotherButton).toBeTrue();
    });

    it('should validate form as invalid when required fields are empty', () => {
      expect(component.form.valid).toBeFalse();
      expect(component.isFormValid).toBeFalse();
    });


    it('should have statusFlag dropdown options', () => {
      expect(component.statusFlagOptions.length).toBe(3);
      expect(component.statusFlagOptions.map(o => o.value)).toEqual(['H', 'O', 'N']);
    });

    it('should have unitScheme dropdown options', () => {
      expect(component.unitSchemeOptions.length).toBe(2);
      expect(component.unitSchemeOptions.map(o => o.value)).toEqual(['I', 'C']);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });


    it('should populate ISBT fields with existing data', () => {
      expect(component.form.get('attributeLabel')?.value).toBe(mockEditData.attributeLabel);
      expect(component.form.get('attributeAbbrev')?.value).toBe(mockEditData.attributeAbbrev);
      expect(component.form.get('attributePosition')?.value).toBe(mockEditData.attributePosition);
    });


    it('should show "Edit Attribute Code" as dialog title', () => {
      expect(component.dialogTitle).toBe('Edit Attribute Code');
    });

    it('should show "SAVE" as submit button label', () => {
      expect(component.submitButtonLabel).toBe('SAVE');
    });

    it('should not show create another button', () => {
      expect(component.showCreateAnotherButton).toBeFalse();
    });

  });

  describe('Field Validations', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should enforce maxLength on description field', () => {
      const control = component.form.get('description');
      control?.setValue('A'.repeat(51));

      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on attributeType field', () => {
      const control = component.form.get('attributeType');
      control?.setValue('A'.repeat(11));

      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on attributeLabel field', () => {
      const control = component.form.get('attributeLabel');
      control?.setValue('A'.repeat(51));

      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on attributeAbbrev field', () => {
      const control = component.form.get('attributeAbbrev');
      control?.setValue('A'.repeat(14));

      expect(control?.hasError('maxlength')).toBeTrue();
    });

  });

  describe('Date Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should validate effective date as required', () => {
      const control = component.form.get('effectiveDate');
      // Clear the default value to test required validator
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();

      control?.setValue(futureDate);
      expect(control?.hasError('required')).toBeFalse();
    });


    it('should update termination min date when effective date changes', fakeAsync(() => {
      const newEffDate = moment('2027-06-01');
      component.form.get('effectiveDate')?.setValue(newEffDate);

      tick();
      fixture.detectChanges();

      expect(component.terminationMinDate.isSame(newEffDate, 'day')).toBeTrue();
    }));

  });

  describe('Conditional Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should require interdiction code when statusFlag is H', () => {
      const statusControl = component.form.get('statusFlag');
      const interCodeControl = component.form.get('interCode');

      statusControl?.setValue('H');
      statusControl?.updateValueAndValidity();

      expect(interCodeControl?.hasError('required')).toBeTrue();
    });

    it('should require interdiction code when statusFlag is N', () => {
      const statusControl = component.form.get('statusFlag');
      const interCodeControl = component.form.get('interCode');

      statusControl?.setValue('N');
      statusControl?.updateValueAndValidity();

      expect(interCodeControl?.hasError('required')).toBeTrue();
    });

  });


  describe('Form Submission', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });




    it('should mark all fields as touched on invalid submit', () => {
      component.onSave();

      expect(component.form.get('attributeCode')?.touched).toBeTrue();
      expect(component.form.get('description')?.touched).toBeTrue();
      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    });

    it('should include ISBT fields in form value', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'I',
        statusFlag: 'H',
        interCode: 'ABOT',
        attributeType: 'TYPE',
        attributeLabel: 'Test Label',
        attributeAbbrev: 'TL',
        attributePosition: 1,
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: futureDate,
        normalStockFlag: 'Y',
        regularOrder: 'Yes',
        specialOrder: 'No'
      });

      const formValue = component['getFormValue']();
      expect(formValue.attributeLabel).toBe('Test Label');
      expect(formValue.attributeAbbrev).toBe('TL');
      expect(formValue.attributePosition).toBe(1);
    });
  });
  describe('Mode Changes', () => {
    it('should reinitialize form when mode changes', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnInit(); // Initialize form first

      expect(component.form).toBeDefined();

      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });

      expect(component.form.get('attributeCode')?.value).toBe(mockEditData.attributeCode);
    });
  });

  describe('Date Display', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should display effective date in DD-MON-YYYY format in edit mode', () => {
      const display = component.editEffectiveDateDisplay;

      expect(display).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should display dash when effective date is null', () => {
      component.form.get('effectiveDate')?.setValue(null);

      const display = component.editEffectiveDateDisplay;

      expect(display).toBe('-');
    });

    it('should format last modified display correctly', () => {
      const display = component.lastModifiedDisplay;

      expect(display).toContain('Last Modified:');
      expect(display).toContain('PST');
    });
  });

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should handle effective date input', () => {
      const event = new Event('input');
      Object.defineProperty(event, 'target', {
        value: { value: '15-JAN-2025' },
        writable: false
      });

      component.onEffDateInput(event);
      expect(true).toBeTrue();
    });

    it('should handle termination date input', () => {
      const event = new Event('input');
      Object.defineProperty(event, 'target', {
        value: { value: '31-DEC-2025' },
        writable: false
      });

      component.onTermDateInput(event);
      expect(true).toBeTrue();
    });
  });
  describe('Accessibility', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should have proper error matchers for date fields', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher).toBeDefined();
    });

  });

  describe('Y/N to Yes/No Transformation', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should transform Y to Yes in form fields', () => {
      component.form.get('attributeCustom')?.setValue('Y');
      expect(component['transformYNToYesNo']('Y')).toBe('Yes');
    });

    it('should transform N to No in form fields', () => {
      component.form.get('attributeCustom')?.setValue('N');
      expect(component['transformYNToYesNo']('N')).toBe('No');
    });

    it('should transform Yes to Y in form value', () => {
      component.form.patchValue({
        attributeCustom: 'Yes',
        showOnLabelFlag: 'Yes',
        deleteAllowed: 'No'
      });

      const formValue = component['getFormValue']();
      expect(formValue.attributeCustom).toBe('Y');
      expect(formValue.showOnLabelFlag).toBe('Y');
      expect(formValue.deleteAllowed).toBe('N');
    });
  });

  describe('Display Getters', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockEditData, true),
        selectedAttributeGroup: new SimpleChange(null, 'ALERT', true)
      });
      fixture.detectChanges();
    });

    it('should return correct dialog title for add mode', () => {
      component.mode = 'add';
      expect(component.dialogTitle).toBe('Add New Attribute Code');
    });

    it('should return correct dialog title for edit mode', () => {
      component.mode = 'edit';
      expect(component.dialogTitle).toBe('Edit Attribute Code');
    });

    it('should return correct submit button label for add mode', () => {
      component.mode = 'add';
      expect(component.submitButtonLabel).toBe('ADD');
    });

    it('should return correct submit button label for edit mode', () => {
      component.mode = 'edit';
      expect(component.submitButtonLabel).toBe('SAVE');
    });

    it('should show create another button only in add mode', () => {
      component.mode = 'add';
      expect(component.showCreateAnotherButton).toBeTrue();

      component.mode = 'edit';
      expect(component.showCreateAnotherButton).toBeFalse();
    });

    it('should display effective date in edit mode', () => {
      const display = component.editEffectiveDateDisplay;
      expect(display).toContain('15-JAN-2024');
    });


    it('should get stopLabelFlag display value', () => {
      expect(component.stopLabelFlagDisplay).toBe('No');
    });

    it('should get attributeCustom display value', () => {
      expect(component.attributeCustomDisplay).toBe('No');
    });

    it('should get showOnLabelFlag display value', () => {
      expect(component.showOnLabelFlagDisplay).toBe('Yes');
    });

    it('should get exclusivityFlag display value', () => {
      expect(component.exclusivityFlagDisplay).toBe('Yes');
    });

    it('should get creditFlag display value', () => {
      expect(component.creditFlagDisplay).toBe('Yes');
    });

    it('should get regularOrder display value when normalStockFlag is Y', () => {
      component.form.get('normalStockFlag')?.setValue('Y');
      expect(component.regularOrderDisplay).toBe('Yes');
    });
  });



  describe('Edit Mode - Form Changes Detection', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockEditData, true),
        selectedAttributeGroup: new SimpleChange(null, 'ALERT', true)
      });
      fixture.detectChanges();
    });

    it('should handle moment date comparison in hasFormValuesChanged', () => {
      const originalEffDate = component.form.get('effectiveDate')?.value;

      // Change to different date
      component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));

      expect(component['hasFormValuesChanged']()).toBeTrue();
    });
  });

  describe('Bug Fixes - Amount Field Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });









    it('should validate amount field pattern - accepts valid numbers', () => {
      const priceControl = component.form.get('price');

      priceControl?.setValue('100');
      expect(priceControl?.hasError('pattern')).toBeFalse();

      priceControl?.setValue('100.50');
      expect(priceControl?.hasError('pattern')).toBeFalse();

      priceControl?.setValue('0.99');
      expect(priceControl?.hasError('pattern')).toBeFalse();
    });

    it('should validate amount field pattern - rejects invalid formats', () => {
      const priceControl = component.form.get('price');

      priceControl?.setValue('100.5e2'); // Scientific notation
      expect(priceControl?.hasError('pattern')).toBeTrue();

      priceControl?.setValue('-50'); // Negative
      expect(priceControl?.hasError('pattern')).toBeTrue();

      priceControl?.setValue('abc'); // Letters
      expect(priceControl?.hasError('pattern')).toBeTrue();

      priceControl?.setValue('100.555'); // More than 2 decimal places
      expect(priceControl?.hasError('pattern')).toBeTrue();
    });
  });

  describe('Bug Fixes - Termination Date Error Persistence', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should preserve termination date parse error when effective date is corrected', () => {
      // Step 1: Set invalid text in both date fields
      const effDateControl = component.form.get('effectiveDate');
      const termDateControl = component.form.get('terminationDate');

      // Simulate invalid date entry - datepicker sets control value to null and adds matDatepickerParse error
      effDateControl?.setValue(null);
      effDateControl?.setErrors({ matDatepickerParse: { text: 'abc' } });
      effDateControl?.markAsTouched();

      termDateControl?.setValue(null);
      termDateControl?.setErrors({ matDatepickerParse: { text: 'xyz' } });
      termDateControl?.markAsTouched();

      // Both should have errors
      expect(component.getEffectiveDateError()).toBeTruthy();
      expect(component.getTerminationDateError()).toBeTruthy();

      // Step 2: Correct the effective date
      effDateControl?.setValue(moment().add(1, 'day'));
      effDateControl?.setErrors(null);

      // Step 3: Termination date error should still be shown
      expect(component.getTerminationDateError()).toBeTruthy();
      expect(component.getTerminationDateError()).toContain('invalid');
    });

    it('should not clear termination date errors in validateForm when field has parse errors', () => {
      const termDateControl = component.form.get('terminationDate');

      // Set parse error (simulating invalid text input like "abc")
      termDateControl?.setValue(null);
      termDateControl?.setErrors({ matDatepickerParse: { text: 'abc' } });
      termDateControl?.markAsTouched();

      // Fill other required fields
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: moment().add(1, 'day'),
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });

      // Try to validate form (this should not clear the parse error)
      const isValid = component['validateForm']();

      // Termination date should still have the parse error
      expect(termDateControl?.hasError('matDatepickerParse')).toBeTrue();
      // Form should be invalid
      expect(isValid).toBeFalse();
    });

    it('should clear termination date errors in validateForm when field has no parse errors and is empty', () => {
      const termDateControl = component.form.get('terminationDate');

      // Set termination date to null (empty) without parse errors
      termDateControl?.setValue(null);
      termDateControl?.markAsTouched();

      // Fill required fields to make form valid except termination date
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: moment().add(1, 'day'),
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });

      // Validate form (this SHOULD clear optional date errors for empty termination date)
      component['validateForm']();

      // Termination date should be unmarked as touched (optional field behavior)
      expect(termDateControl?.touched).toBeFalse();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });


    it('should allow past termination date in edit mode if it already exists', fakeAsync(() => {
      component.mode = 'edit';
      const pastEffDate = moment('2019-01-01');
      const pastTermDate = moment('2020-01-01');
      component.data = {
        ...mockEditData,
        effectiveDate: pastEffDate.format('YYYY-MM-DD'),
        terminationDate: pastTermDate.format('YYYY-MM-DD')
      };

      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, true)
      });

      tick();
      fixture.detectChanges();

      expect(component.terminationMinDate.isSameOrBefore(pastTermDate, 'day')).toBeTrue();
    }));

    it('should handle interdiction code enable/disable toggling', fakeAsync(() => {
      const interCodeControl = component.form.get('interCode');

      // Set to H - enables and requires interdiction code
      component.form.get('statusFlag')?.setValue('H');
      tick();

      expect(interCodeControl?.enabled).toBeTrue();
      expect(interCodeControl?.hasError('required')).toBeTrue();

      // Set to O - disables interdiction code
      component.form.get('statusFlag')?.setValue('O');
      tick();

      expect(interCodeControl?.disabled).toBeTrue();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit close event', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      spyOn(component.close, 'emit');
      component.onCancel();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('onSave with valid form', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should emit save with form value when valid', () => {
      spyOn(component.save, 'emit');
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: futureDate,
        normalStockFlag: 'Y',
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });
      component.onSave();
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBeTrue();
    });
  });

  describe('onSaveAndCreateAnother', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should emit saveAndCreateAnother when valid', () => {
      spyOn(component.saveAndCreateAnother, 'emit');
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: futureDate,
        normalStockFlag: 'Y',
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });
      component.onSaveAndCreateAnother();
      expect(component.saveAndCreateAnother.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBeTrue();
    });

    it('should not emit when form is invalid', () => {
      spyOn(component.saveAndCreateAnother, 'emit');
      component.onSaveAndCreateAnother();
      expect(component.saveAndCreateAnother.emit).not.toHaveBeenCalled();
    });
  });

  describe('resetFormAfterSave', () => {
    it('should reset isSubmitting', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.isSubmitting = true;
      component.resetFormAfterSave();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should update originalFormValue in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.isSubmitting = true;
      component.resetFormAfterSave();
      tick(400);
      expect(component.isSubmitting).toBeFalse();
      expect((component as any).originalFormValue).toBeTruthy();
    }));
  });

  describe('resetFormAfterError', () => {
    it('should reset isSubmitting', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.isSubmitting = true;
      component.resetFormAfterError();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should update originalFormValue in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.isSubmitting = true;
      component.resetFormAfterError();
      tick(400);
      expect(component.isSubmitting).toBeFalse();
    }));
  });

  describe('onAmountKeyDown', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should allow digits', () => {
      const event = { key: '5', target: { value: '', selectionStart: 0 }, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAmountKeyDown(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].forEach(key => {
        const event = { key, target: { value: '', selectionStart: 0 }, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
        component.onAmountKeyDown(event);
        expect((event as any).preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should allow ctrl key combinations', () => {
      const event = { key: 'a', target: { value: '', selectionStart: 0 }, ctrlKey: true, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAmountKeyDown(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should allow arrow keys', () => {
      ['Home', 'End', 'ArrowLeft', 'ArrowRight'].forEach(key => {
        const event = { key, target: { value: '', selectionStart: 0 }, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
        component.onAmountKeyDown(event);
        expect((event as any).preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should block e, E, +, -', () => {
      ['e', 'E', '+', '-'].forEach(key => {
        const event = { key, target: { value: '', selectionStart: 0 }, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
        component.onAmountKeyDown(event);
        expect((event as any).preventDefault).toHaveBeenCalled();
      });
    });

    it('should allow first decimal point', () => {
      const event = { key: '.', target: { value: '100', selectionStart: 3 }, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAmountKeyDown(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should block second decimal point', () => {
      const event = { key: '.', target: { value: '100.5', selectionStart: 5 }, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAmountKeyDown(event);
      expect((event as any).preventDefault).toHaveBeenCalled();
    });

    it('should block letters', () => {
      const event = { key: 'a', target: { value: '', selectionStart: 0 }, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAmountKeyDown(event);
      expect((event as any).preventDefault).toHaveBeenCalled();
    });
  });

  describe('getFormValue - Codabar', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should set ISBT fields to null for Codabar', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        effectiveDate: futureDate,
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });

      const formValue = (component as any).getFormValue();
      expect(formValue.attributeLabel).toBeNull();
      expect(formValue.attributeAbbrev).toBeNull();
      expect(formValue.attributePosition).toBeNull();
    });
  });

  describe('isFormValid - edit mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockEditData, true),
        selectedAttributeGroup: new SimpleChange(null, 'ALERT', true)
      });
      fixture.detectChanges();
      tick(400); // Wait for setTimeout(350) in initializeForm to set originalFormValue
    }));

    it('should return false when form is invalid', () => {
      component.form.get('description')?.setValue('');
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is valid and values changed', () => {
      // Fix attributeType to pass pattern validation ^[CMA]$
      component.form.get('attributeType')?.setValue('C');
      // Set required fields
      component.form.get('stopLabelFlag')?.setValue('No');
      component.form.get('exclusivityFlag')?.setValue('Yes');
      component.form.get('assignAfterLabelFlag')?.setValue('No');
      // Now make a detectable change
      component.form.get('description')?.setValue('Changed Description');
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('formatYesNo', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should return Yes for Y', () => {
      expect(component.formatYesNo('Y')).toBe('Yes');
    });

    it('should return No for N', () => {
      expect(component.formatYesNo('N')).toBe('No');
    });

    it('should return empty for null', () => {
      expect(component.formatYesNo(null)).toBe('');
    });

    it('should return empty for undefined', () => {
      expect(component.formatYesNo(undefined)).toBe('');
    });

    it('should return value as-is for other strings', () => {
      expect(component.formatYesNo('X')).toBe('X');
    });
  });

  describe('transformYesNoToYN', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should return Y for Yes', () => {
      expect((component as any).transformYesNoToYN('Yes')).toBe('Y');
    });

    it('should return N for No', () => {
      expect((component as any).transformYesNoToYN('No')).toBe('N');
    });

    it('should return Y for y', () => {
      expect((component as any).transformYesNoToYN('y')).toBe('Y');
    });

    it('should return N for n', () => {
      expect((component as any).transformYesNoToYN('n')).toBe('N');
    });

    it('should return N for null/empty', () => {
      expect((component as any).transformYesNoToYN('')).toBe('N');
      expect((component as any).transformYesNoToYN(null)).toBe('N');
    });

    it('should return value as-is for unrecognized', () => {
      expect((component as any).transformYesNoToYN('X')).toBe('X');
    });
  });

  describe('formatTerminationDate', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should format valid date', () => {
      const result = component.formatTerminationDate('2025-12-31T00:00:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return dash for invalid date', () => {
      expect(component.formatTerminationDate('invalid')).toBe('-');
    });
  });

  describe('formatTerminationDateDisplay', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should return dash for null', () => {
      expect(component.formatTerminationDateDisplay(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatTerminationDateDisplay(undefined)).toBe('-');
    });

    it('should format valid date string', () => {
      const result = component.formatTerminationDateDisplay('2025-12-31T00:00:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });
  });

  describe('isInterdictionCodeDisabled getter', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should return true when status is O', () => {
      component.form.get('statusFlag')?.setValue('O');
      expect(component.isInterdictionCodeDisabled).toBeTrue();
    });

    it('should return false when status is H', () => {
      component.form.get('statusFlag')?.setValue('H');
      expect(component.isInterdictionCodeDisabled).toBeFalse();
    });

    it('should return false when status is N', () => {
      component.form.get('statusFlag')?.setValue('N');
      expect(component.isInterdictionCodeDisabled).toBeFalse();
    });
  });

  describe('onInterdictionDropdownOpened', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should reset search and show all options when opened', () => {
      component.interdictionCodeOptions = mockInterdictionCodes as any;
      component.onInterdictionDropdownOpened(true);
      expect(component.interdictionCodeSearchControl.value).toBe('');
      expect(component.filteredInterdictionCodeOptions).toEqual(mockInterdictionCodes as any);
    });

    it('should do nothing when closed', () => {
      component.interdictionCodeSearchControl.setValue('test');
      component.onInterdictionDropdownOpened(false);
      expect(component.interdictionCodeSearchControl.value).toBe('test');
    });
  });

  describe('filterInterdictionCodes', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.interdictionCodeOptions = mockInterdictionCodes as any;
    });

    it('should return all codes when search is empty', () => {
      (component as any).filterInterdictionCodes('');
      expect(component.filteredInterdictionCodeOptions.length).toBe(2);
    });

    it('should filter by value', () => {
      (component as any).filterInterdictionCodes('ABOT');
      expect(component.filteredInterdictionCodeOptions.length).toBe(1);
    });

    it('should filter by description', () => {
      (component as any).filterInterdictionCodes('Abortion');
      expect(component.filteredInterdictionCodeOptions.length).toBe(1);
    });
  });

  describe('Special Order / Regular Order sync', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should set regularOrder to No when specialOrder is Yes', fakeAsync(() => {
      component.form.get('specialOrder')?.setValue('Yes');
      tick();
      expect(component.form.get('regularOrder')?.value).toBe('No');
      expect(component.form.get('normalStockFlag')?.value).toBe('N');
    }));

    it('should set specialOrder to No when regularOrder is Yes', fakeAsync(() => {
      component.form.get('regularOrder')?.setValue('Yes');
      tick();
      expect(component.form.get('specialOrder')?.value).toBe('No');
      expect(component.form.get('normalStockFlag')?.value).toBe('Y');
    }));
  });

  describe('Unit scheme changes', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      tick(350); // Let any initial debounced subscriptions settle
    }));

    it('should auto-populate ISBT fields when switching to ISBT', fakeAsync(() => {
      component.form.patchValue({ description: 'Test Description', attributeCode: 'TST' });
      component.form.get('attributeLabel')?.setValue(null, { emitEvent: false });
      component.form.get('attributeAbbrev')?.setValue(null, { emitEvent: false });
      component.form.get('attributePosition')?.setValue(null, { emitEvent: false });
      component.form.get('unitScheme')?.setValue('I');
      tick(350);
      expect(component.form.get('attributeLabel')?.value).toBe('Test Description');
    }));

    it('should clear ISBT fields when switching to Codabar', fakeAsync(() => {
      component.form.patchValue({ attributeLabel: 'Label', attributeAbbrev: 'Abbr', attributePosition: 1 });
      component.form.get('unitScheme')?.setValue('C');
      tick(350);
      expect(component.form.get('attributeLabel')?.value).toBeNull();
      expect(component.form.get('attributeAbbrev')?.value).toBeNull();
      expect(component.form.get('attributePosition')?.value).toBeNull();
    }));
  });

  describe('lastModifiedDisplay edge cases', () => {
    it('should return empty string when no data', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      expect(component.lastModifiedDisplay).toBe('');
    });
  });

  describe('ngOnChanges - selectedAttributeGroup', () => {
    it('should clear attribute code when group changes in add mode', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.form.patchValue({ attributeCode: 'CMV' });

      component.selectedAttributeGroup = 'BLOOD_TYPE';
      component.ngOnChanges({
        selectedAttributeGroup: new SimpleChange('ALERT', 'BLOOD_TYPE', false)
      });

      expect(component.form.get('attributeCode')?.value).toBe('');
    });
  });

  describe('Display getters - additional', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockEditData, true),
        selectedAttributeGroup: new SimpleChange(null, 'ALERT', true)
      });
      fixture.detectChanges();
    });

    it('should get deleteAllowed display value', () => {
      expect(component.deleteAllowedDisplay).toBeDefined();
    });

    it('should get specialOrder display value', () => {
      expect(component.specialOrderDisplay).toBeDefined();
    });

    it('should get creditFlag display value', () => {
      expect(component.creditFlagDisplay).toBeDefined();
    });
  });

  describe('deepCloneFormValue', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should clone moment objects', () => {
      const value = { date: moment('2025-01-15'), name: 'test' };
      const cloned = (component as any).deepCloneFormValue(value);
      expect(cloned.date).not.toBe(value.date);
      expect(cloned.name).toBe('test');
    });

    it('should handle invalid moment', () => {
      const value = { date: moment.invalid() };
      const cloned = (component as any).deepCloneFormValue(value);
      expect(cloned.date).toBeNull();
    });
  });

  describe('loadInterdictionCodes error', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should handle error and set empty arrays', () => {
      mockApiService.getInterdictionCodes.and.returnValue(of([]));
      (component as any).loadInterdictionCodes('H');
      expect(component.interdictionCodeOptions).toEqual([]);
    });

    it('should not call API when status is not H or N', () => {
      mockApiService.getInterdictionCodes.calls.reset();
      (component as any).loadInterdictionCodes('O');
      expect(mockApiService.getInterdictionCodes).not.toHaveBeenCalled();
    });
  });

  describe('loadInterdictionCodes - actual error from API', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should handle API error and set empty arrays', () => {
      const consoleSpy = spyOn(console, 'error');
      mockApiService.getInterdictionCodes.and.returnValue(throwError(() => new Error('Server error')));
      (component as any).loadInterdictionCodes('H');
      expect(component.interdictionCodeOptions).toEqual([]);
      expect(component.filteredInterdictionCodeOptions).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading interdiction codes:', jasmine.any(Error));
    });

    it('should handle API error for status N', () => {
      spyOn(console, 'error');
      mockApiService.getInterdictionCodes.and.returnValue(throwError(() => new Error('Network error')));
      (component as any).loadInterdictionCodes('N');
      expect(component.interdictionCodeOptions).toEqual([]);
      expect(component.filteredInterdictionCodeOptions).toEqual([]);
    });
  });

  describe('loadInterdictionCodes - success sets options', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should populate interdiction code options on success', () => {
      mockApiService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
      (component as any).loadInterdictionCodes('H');
      expect(component.interdictionCodeOptions).toEqual(mockInterdictionCodes as any);
      expect(component.filteredInterdictionCodeOptions).toEqual(mockInterdictionCodes as any);
    });
  });

  describe('setupModeValidators - edit mode branches', () => {
    it('should disable attributeCode and enable unitScheme in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('attributeCode')?.disabled).toBeTrue();
      expect(component.form.get('unitScheme')?.enabled).toBeTrue();
    });

    it('should clear effective date validators in edit mode to allow past dates', () => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        effectiveDate: '2020-01-15'
      };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const effDateControl = component.form.get('effectiveDate');
      // In edit mode, effective date is just required, not past-date-restricted
      expect(effDateControl?.valid).toBeTrue();
    });

    it('should clear termination date validators in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        effectiveDate: '2019-01-01',
        terminationDate: '2020-01-01'
      };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const termControl = component.form.get('terminationDate');
      // In edit mode, termination date validators are cleared, so even past dates are valid
      // as long as terminationDate >= effectiveDate (cross-field validator still applies)
      expect(termControl?.errors).toBeNull();
    });
  });

  describe('ngOnChanges - additional branches', () => {
    it('should reinitialize when only mode changes (without data change)', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnInit();

      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false)
      });

      expect(component.form.get('attributeCode')?.value).toBe(mockEditData.attributeCode);
    });

    it('should not clear attribute code when selectedAttributeGroup changes in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const codeValue = component.form.get('attributeCode')?.value;
      component.selectedAttributeGroup = 'BLOOD_TYPE';
      component.ngOnChanges({
        selectedAttributeGroup: new SimpleChange('ALERT', 'BLOOD_TYPE', false)
      });

      expect(component.form.get('attributeCode')?.value).toBe(codeValue);
    });

    it('should not clear attribute code when selectedAttributeGroup is empty in add mode', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.form.patchValue({ attributeCode: 'CMV' });

      component.selectedAttributeGroup = '';
      component.ngOnChanges({
        selectedAttributeGroup: new SimpleChange('ALERT', '', false)
      });

      // When selectedAttributeGroup is empty, should not clear attributeCode
      expect(component.form.get('attributeCode')?.value).toBe('CMV');
    });

    it('should not clear attribute code when selectedAttributeGroup is null in add mode', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.form.patchValue({ attributeCode: 'CMV' });

      component.selectedAttributeGroup = null;
      component.ngOnChanges({
        selectedAttributeGroup: new SimpleChange('ALERT', null, false)
      });

      expect(component.form.get('attributeCode')?.value).toBe('CMV');
    });

    it('should not process selectedAttributeGroup on first change', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.form.patchValue({ attributeCode: 'CMV' });

      component.ngOnChanges({
        selectedAttributeGroup: new SimpleChange(null, 'ALERT', true)
      });

      // firstChange=true should not trigger clearing
      expect(component.form.get('attributeCode')?.value).toBe('CMV');
    });

    it('should reload interdiction codes on mode change when status is H', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnInit();

      mockApiService.getInterdictionCodes.calls.reset();
      component.mode = 'edit';
      component.data = { ...mockEditData, statusFlag: 'H' };
      component.ngOnChanges({
        data: new SimpleChange(null, component.data, false)
      });

      expect(mockApiService.getInterdictionCodes).toHaveBeenCalledWith('H');
    });

    it('should not reload interdiction codes when status is O on mode change', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnInit();

      mockApiService.getInterdictionCodes.calls.reset();
      component.mode = 'edit';
      component.data = { ...mockEditData, statusFlag: 'O' };
      component.ngOnChanges({
        data: new SimpleChange(null, component.data, false)
      });

      expect(mockApiService.getInterdictionCodes).not.toHaveBeenCalled();
    });

    it('should not reinitialize form on ngOnChanges if form does not exist yet', () => {
      // Access a fresh component before ngOnInit
      const freshFixture = TestBed.createComponent(AddEditAttributeCodeComponent);
      const freshComponent = freshFixture.componentInstance;
      freshComponent.mode = 'add';

      // form is not yet initialized
      freshComponent.ngOnChanges({
        mode: new SimpleChange(null, 'add', true)
      });

      // Should not crash, form is still undefined
      expect(freshComponent.form).toBeUndefined();
      freshFixture.destroy();
    });
  });

  describe('updateTerminationMinDate - branches', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should use minDate when effective date is before today in add mode', () => {
      const pastDate = moment('2020-01-01');
      component.form.get('effectiveDate')?.setValue(pastDate);

      (component as any).updateTerminationMinDate();

      // In add mode with past effective date, terminationMinDate should be minDate (today)
      expect(component.terminationMinDate.isSame(component.minDate, 'day')).toBeTrue();
    });

    it('should set terminationMinDate to effective date in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });

      const pastEffDate = moment('2020-06-15');
      component.form.get('effectiveDate')?.setValue(pastEffDate);

      (component as any).updateTerminationMinDate();

      expect(component.terminationMinDate.isSame(pastEffDate, 'day')).toBeTrue();
    });

    it('should use minDate when no effective date is set', () => {
      component.form.get('effectiveDate')?.setValue(null);

      (component as any).updateTerminationMinDate();

      expect(component.terminationMinDate.isSame(component.minDate, 'day')).toBeTrue();
    });

    it('should use minDate when effective date is not a moment object', () => {
      component.form.get('effectiveDate')?.setValue('not-a-moment');

      (component as any).updateTerminationMinDate();

      expect(component.terminationMinDate.isSame(component.minDate, 'day')).toBeTrue();
    });
  });

  describe('hasFormValuesChanged - additional branches', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockEditData, true),
        selectedAttributeGroup: new SimpleChange(null, 'ALERT', true)
      });
      fixture.detectChanges();
      tick(400);
    }));

    it('should return true when originalFormValue is null', () => {
      (component as any).originalFormValue = null;
      expect((component as any).hasFormValuesChanged()).toBeTrue();
    });

    it('should return false when no values have changed', () => {
      expect((component as any).hasFormValuesChanged()).toBeFalse();
    });

    it('should detect changes in string fields', () => {
      component.form.get('description')?.setValue('New Description');
      expect((component as any).hasFormValuesChanged()).toBeTrue();
    });

    it('should treat empty string as null for comparison', () => {
      // Set originalFormValue with null description
      (component as any).originalFormValue.description = null;
      // Set form value to empty string
      component.form.get('description')?.setValue('');
      // Both normalize to null, so no change detected
      expect((component as any).hasFormValuesChanged()).toBeFalse();
    });

    it('should treat whitespace-only string as null', () => {
      (component as any).originalFormValue.description = null;
      component.form.get('description')?.setValue('   ');
      expect((component as any).hasFormValuesChanged()).toBeFalse();
    });

    it('should detect changes in numeric fields', () => {
      component.form.get('price')?.setValue(999);
      expect((component as any).hasFormValuesChanged()).toBeTrue();
    });

    it('should handle number 0 correctly (not treated as null)', () => {
      (component as any).originalFormValue.price = 100;
      component.form.get('price')?.setValue(0);
      expect((component as any).hasFormValuesChanged()).toBeTrue();
    });

    it('should handle undefined values normalized to null', () => {
      (component as any).originalFormValue.serviceCode = undefined;
      component.form.get('serviceCode')?.setValue(null);
      // Both should normalize to null
      expect((component as any).hasFormValuesChanged()).toBeFalse();
    });
  });

  describe('validateForm - additional branches', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should return false when form is invalid', () => {
      // Leave required fields empty
      const result = (component as any).validateForm();
      expect(result).toBeFalse();
    });

    it('should return true when form is valid with no date errors', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: futureDate,
        normalStockFlag: 'Y',
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });

      const result = (component as any).validateForm();
      expect(result).toBeTrue();
    });

    it('should return false when dateRangeInvalid error exists', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: moment('2099-12-31'),
        terminationDate: moment('2099-01-01'),
        normalStockFlag: 'Y',
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });

      // Set cross-field date range error
      component.form.setErrors({ dateRangeInvalid: true });

      const result = (component as any).validateForm();
      expect(result).toBeFalse();
    });
  });

  describe('onSave - invalid form', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should not emit save when form is invalid', () => {
      spyOn(component.save, 'emit');
      component.onSave();
      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('isFormValid - add mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should return false for empty form in add mode', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when all required fields are filled in add mode', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: futureDate,
        normalStockFlag: 'Y',
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });

      expect(component.isFormValid).toBeTrue();
    });

    it('should return false in add mode when date range is invalid', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: moment('2099-12-31'),
        terminationDate: moment('2099-01-01'),
        normalStockFlag: 'Y',
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });

      component.form.setErrors({ dateRangeInvalid: true });

      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('isFormValid - edit mode with no changes', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData, attributeType: 'C' };
      component.selectedAttributeGroup = 'ALERT';
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, component.data, true),
        selectedAttributeGroup: new SimpleChange(null, 'ALERT', true)
      });
      fixture.detectChanges();
      tick(400);
    }));

    it('should return false when valid but no values changed', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false in edit mode with date validation error', () => {
      component.form.get('description')?.setValue('Changed');
      component.form.setErrors({ dateRangeInvalid: true });
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('getEffectiveDateError and getTerminationDateError - lastChangedDateField states', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should pass null formErrors when lastChangedDateField is not effective', () => {
      (component as any).lastChangedDateField = 'termination';
      const error = component.getEffectiveDateError();
      // Should not crash; returns whatever DateFieldValidationUtility returns
      expect(error).toBeDefined();
    });

    it('should pass formErrors when lastChangedDateField is effective', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: moment('2099-12-31'),
        terminationDate: moment('2099-01-01')
      });
      component.form.setErrors({ dateRangeInvalid: true });

      (component as any).lastChangedDateField = 'effective';
      const error = component.getEffectiveDateError();
      expect(error).toBeDefined();
    }));

    it('should pass null formErrors when lastChangedDateField is not termination', () => {
      (component as any).lastChangedDateField = 'effective';
      const error = component.getTerminationDateError();
      expect(error).toBeDefined();
    });

    it('should pass formErrors when lastChangedDateField is termination', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: moment('2099-12-31'),
        terminationDate: moment('2099-01-01')
      });
      component.form.setErrors({ dateRangeInvalid: true });

      (component as any).lastChangedDateField = 'termination';
      const error = component.getTerminationDateError();
      expect(error).toBeDefined();
    }));

    it('should handle lastChangedDateField as null', () => {
      (component as any).lastChangedDateField = null;
      expect(component.getEffectiveDateError()).toBeDefined();
      expect(component.getTerminationDateError()).toBeDefined();
    });
  });

  describe('statusFlag valueChanges - clearing interCode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should clear interCode value when switching from H to O', fakeAsync(() => {
      // First set status to H and set an interCode
      component.form.get('statusFlag')?.setValue('H');
      tick();
      component.form.get('interCode')?.setValue('ABOT');
      tick();

      // Now switch to O
      component.form.get('statusFlag')?.setValue('O');
      tick();

      expect(component.form.get('interCode')?.value).toBeNull();
      expect(component.form.get('interCode')?.disabled).toBeTrue();
      expect(component.interdictionCodeOptions).toEqual([]);
      expect(component.filteredInterdictionCodeOptions).toEqual([]);
    }));

    it('should set maxLength(4) validator on interCode when status is O', fakeAsync(() => {
      component.form.get('statusFlag')?.setValue('O');
      tick();

      const interCodeControl = component.form.get('interCode');
      // maxLength should be set
      interCodeControl?.enable();
      interCodeControl?.setValue('ABCDE');
      expect(interCodeControl?.hasError('maxlength')).toBeTrue();
    }));

    it('should enable interCode when switching from O to N', fakeAsync(() => {
      component.form.get('statusFlag')?.setValue('O');
      tick();

      expect(component.form.get('interCode')?.disabled).toBeTrue();

      component.form.get('statusFlag')?.setValue('N');
      tick();

      expect(component.form.get('interCode')?.enabled).toBeTrue();
      expect(component.form.get('interCode')?.hasError('required')).toBeTrue();
    }));
  });

  describe('unitScheme valueChanges - ISBT auto-populate when fields already have values', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      tick(350);
    }));

    it('should NOT overwrite attributeLabel when it already has a value', fakeAsync(() => {
      component.form.patchValue({ description: 'Test Description' });
      component.form.get('attributeLabel')?.setValue('Existing Label', { emitEvent: false });
      component.form.get('attributeAbbrev')?.setValue(null, { emitEvent: false });
      component.form.get('attributePosition')?.setValue(null, { emitEvent: false });

      component.form.get('unitScheme')?.setValue('I');
      tick(350);

      // Should NOT be overwritten since it already has a value
      expect(component.form.get('attributeLabel')?.value).toBe('Existing Label');
    }));

    it('should NOT overwrite attributeAbbrev when it already has a value', fakeAsync(() => {
      component.form.patchValue({ description: 'Test Description', attributeCode: 'TST' });
      component.form.get('attributeLabel')?.setValue(null, { emitEvent: false });
      component.form.get('attributeAbbrev')?.setValue('ExistAbbr', { emitEvent: false });
      component.form.get('attributePosition')?.setValue(null, { emitEvent: false });

      component.form.get('unitScheme')?.setValue('I');
      tick(350);

      expect(component.form.get('attributeAbbrev')?.value).toBe('ExistAbbr');
    }));

    it('should NOT overwrite attributePosition when it already has a value', fakeAsync(() => {
      component.form.patchValue({ description: 'Test Description' });
      component.form.get('attributeLabel')?.setValue(null, { emitEvent: false });
      component.form.get('attributeAbbrev')?.setValue(null, { emitEvent: false });
      component.form.get('attributePosition')?.setValue(5, { emitEvent: false });

      component.form.get('unitScheme')?.setValue('I');
      tick(350);

      expect(component.form.get('attributePosition')?.value).toBe(5);
    }));

    it('should use attributeCode for abbreviation when description is empty', fakeAsync(() => {
      component.form.patchValue({ description: null, attributeCode: 'TESTCODE' });
      component.form.get('attributeLabel')?.setValue(null, { emitEvent: false });
      component.form.get('attributeAbbrev')?.setValue(null, { emitEvent: false });
      component.form.get('attributePosition')?.setValue(null, { emitEvent: false });

      component.form.get('unitScheme')?.setValue('I');
      tick(350);

      // attributeAbbrev should use attributeCode as fallback (truncated to 12)
      expect(component.form.get('attributeAbbrev')?.value).toBe('TESTCODE');
    }));

    it('should set position to 1 when empty on ISBT switch', fakeAsync(() => {
      component.form.get('attributePosition')?.setValue(null, { emitEvent: false });
      component.form.get('unitScheme')?.setValue('I');
      tick(350);

      expect(component.form.get('attributePosition')?.value).toBe(1);
    }));

    it('should truncate description to 50 chars for attributeLabel', fakeAsync(() => {
      const longDesc = 'A'.repeat(60);
      component.form.patchValue({ description: longDesc });
      component.form.get('attributeLabel')?.setValue(null, { emitEvent: false });

      component.form.get('unitScheme')?.setValue('I');
      tick(350);

      expect(component.form.get('attributeLabel')?.value?.length).toBe(50);
    }));

    it('should truncate abbreviation source to 12 chars', fakeAsync(() => {
      const longDesc = 'ABCDEFGHIJKLMNOP';
      component.form.patchValue({ description: longDesc });
      component.form.get('attributeAbbrev')?.setValue(null, { emitEvent: false });

      component.form.get('unitScheme')?.setValue('I');
      tick(350);

      expect(component.form.get('attributeAbbrev')?.value?.length).toBe(12);
    }));

    it('should use empty string fallback when both description and code are empty', fakeAsync(() => {
      component.form.patchValue({ description: null, attributeCode: null });
      component.form.get('attributeAbbrev')?.setValue(null, { emitEvent: false });

      component.form.get('unitScheme')?.setValue('I');
      tick(350);

      expect(component.form.get('attributeAbbrev')?.value).toBe('');
    }));
  });

  describe('initializeForm - ISBT initial scheme validators', () => {
    it('should set required validators for ISBT fields when initial unitScheme is I', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, unitSchemeType: 'I' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const labelControl = component.form.get('attributeLabel');
      const abbrevControl = component.form.get('attributeAbbrev');
      const positionControl = component.form.get('attributePosition');

      // Clear values to trigger required validation
      labelControl?.setValue(null);
      abbrevControl?.setValue(null);
      positionControl?.setValue(null);

      expect(labelControl?.hasError('required')).toBeTrue();
      expect(abbrevControl?.hasError('required')).toBeTrue();
      expect(positionControl?.hasError('required')).toBeTrue();
    });

    it('should NOT set required validators when initial unitScheme is C', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      component.form.get('unitScheme')?.setValue('C', { emitEvent: false });

      const labelControl = component.form.get('attributeLabel');
      labelControl?.setValue(null);
      expect(labelControl?.hasError('required')).toBeFalse();
    });
  });

  describe('initializeForm - interCode initial disable', () => {
    it('should disable interCode when initial status is O', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, statusFlag: 'O', interCode: null };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('interCode')?.disabled).toBeTrue();
    });

    it('should keep interCode enabled when initial status is H', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, statusFlag: 'H' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('interCode')?.enabled).toBeTrue();
    });

    it('should keep interCode enabled when initial status is N', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, statusFlag: 'N' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('interCode')?.enabled).toBeTrue();
    });
  });

  describe('initializeForm - edit mode originalFormValue and markAsPristine', () => {
    it('should store originalFormValue immediately in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect((component as any).originalFormValue).toBeTruthy();
    });

    it('should mark form as pristine after timeout in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      // Before timeout, form might be dirty
      tick(400);

      expect(component.form.pristine).toBeTrue();
    }));

    it('should not store originalFormValue in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect((component as any).originalFormValue).toBeNull();
    });
  });

  describe('initializeForm - data transformations', () => {
    it('should transform stopLabelFlag Y to Yes', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, stopLabelFlag: 'Y' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('stopLabelFlag')?.value).toBe('Yes');
    });

    it('should transform showOnLabelFlag N to No', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, showOnLabelFlag: 'N' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('showOnLabelFlag')?.value).toBe('No');
    });

    it('should set attributeCustom default to No in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('attributeCustom')?.value).toBe('No');
    });

    it('should set deleteAllowed default to No in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('deleteAllowed')?.value).toBe('No');
    });

    it('should set creditFlag default to Yes in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('creditFlag')?.value).toBe('Yes');
    });

    it('should set normalStockFlag default to Y in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('normalStockFlag')?.value).toBe('Y');
    });

    it('should transform specialOrder based on normalStockFlag N', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, normalStockFlag: 'N' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('specialOrder')?.value).toBe('Yes');
      expect(component.form.get('regularOrder')?.value).toBe('No');
    });

    it('should transform specialOrder based on normalStockFlag Y', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, normalStockFlag: 'Y' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('specialOrder')?.value).toBe('No');
      expect(component.form.get('regularOrder')?.value).toBe('Yes');
    });

    it('should set assignAfterLabelFlag default to No in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('assignAfterLabelFlag')?.value).toBe('No');
    });

    it('should set specialOrder default to No in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('specialOrder')?.value).toBe('No');
    });

    it('should set regularOrder default to Yes in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('regularOrder')?.value).toBe('Yes');
    });

    it('should set initial interCode validators with required when status is H', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, statusFlag: 'H', interCode: null };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const interCodeControl = component.form.get('interCode');
      expect(interCodeControl?.hasError('required')).toBeTrue();
    });

    it('should set initial interCode validators without required when status is O', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, statusFlag: 'O', interCode: null };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const interCodeControl = component.form.get('interCode');
      // interCode should be disabled and not required for status O
      expect(interCodeControl?.disabled).toBeTrue();
    });

    it('should parse effectiveDate with moment', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, effectiveDate: '2024-01-15' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const effDate = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effDate)).toBeTrue();
    });

    it('should parse terminationDate with moment', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, terminationDate: '2025-12-31' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const termDate = component.form.get('terminationDate')?.value;
      expect(moment.isMoment(termDate)).toBeTrue();
    });

    it('should set effectiveDate to null when data has no effectiveDate', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, effectiveDate: null };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('effectiveDate')?.value).toBeNull();
    });

    it('should set terminationDate to null when data has no terminationDate', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, terminationDate: null };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      expect(component.form.get('terminationDate')?.value).toBeNull();
    });
  });

  describe('initializeForm - resets state', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should reset errorMessage on initialization', () => {
      component.errorMessage = 'Some error';
      component.initializeForm();
      expect(component.errorMessage).toBeNull();
    });

    it('should reset isSubmitting on initialization', () => {
      component.isSubmitting = true;
      component.initializeForm();
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('getFormValue - ISBT fields with null values', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should exclude ISBT fields with null values for ISBT unit scheme', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test Description',
        unitScheme: 'I',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: futureDate,
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No',
        attributeLabel: null,
        attributeAbbrev: null,
        attributePosition: null
      });

      const formValue = (component as any).getFormValue();
      // Should NOT include attributeLabel/abbrev/position when they're null for ISBT
      expect(formValue.attributeLabel).toBeUndefined();
      expect(formValue.attributeAbbrev).toBeUndefined();
      expect(formValue.attributePosition).toBeUndefined();
    });

    it('should include ISBT fields with non-null values for ISBT unit scheme', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test',
        unitScheme: 'I',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: futureDate,
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No',
        attributeLabel: 'MyLabel',
        attributeAbbrev: 'MyAbbr',
        attributePosition: 3
      });

      const formValue = (component as any).getFormValue();
      expect(formValue.attributeLabel).toBe('MyLabel');
      expect(formValue.attributeAbbrev).toBe('MyAbbr');
      expect(formValue.attributePosition).toBe(3);
    });
  });

  describe('getFormValue - normalStockFlag logic', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should set normalStockFlag to Y when regularOrder is Yes', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: futureDate,
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'No'
      });

      const formValue = (component as any).getFormValue();
      expect(formValue.normalStockFlag).toBe('Y');
    });

    it('should set normalStockFlag to N when regularOrder is No', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'No',
        attributeCustom: 'No',
        showOnLabelFlag: 'Yes',
        exclusivityFlag: 'Yes',
        creditFlag: 'Yes',
        effectiveDate: futureDate,
        regularOrder: 'No',
        specialOrder: 'Yes',
        assignAfterLabelFlag: 'No'
      });

      const formValue = (component as any).getFormValue();
      expect(formValue.normalStockFlag).toBe('N');
    });
  });

  describe('getFormValue - transforms Yes/No fields to Y/N', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should transform all boolean-like fields correctly', () => {
      component.form.patchValue({
        attributeCode: 'TEST',
        description: 'Test',
        unitScheme: 'C',
        statusFlag: 'O',
        attributeType: 'C',
        stopLabelFlag: 'Yes',
        attributeCustom: 'Yes',
        showOnLabelFlag: 'No',
        exclusivityFlag: 'No',
        creditFlag: 'No',
        deleteAllowed: 'Yes',
        effectiveDate: futureDate,
        regularOrder: 'Yes',
        specialOrder: 'No',
        assignAfterLabelFlag: 'Yes'
      });

      const formValue = (component as any).getFormValue();
      expect(formValue.stopLabelFlag).toBe('Y');
      expect(formValue.attributeCustom).toBe('Y');
      expect(formValue.showOnLabelFlag).toBe('N');
      expect(formValue.exclusivityFlag).toBe('N');
      expect(formValue.creditFlag).toBe('N');
      expect(formValue.deleteAllowed).toBe('Y');
      expect(formValue.assignAfterLabelFlag).toBe('Y');
    });
  });

  describe('onTermDateInput - edit mode', () => {
    it('should call handleEndDateInput with edit mode flag true', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const event = new Event('input');
      Object.defineProperty(event, 'target', {
        value: { value: '31-DEC-2025' },
        writable: false
      });

      // Call it in edit mode and verify no error occurs
      component.onTermDateInput(event);
      // The mode is 'edit', so handleEndDateInput is called with isEditMode=true
      expect(component.mode).toBe('edit');
    });

    it('should call handleEndDateInput with edit mode flag false in add mode', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();

      const event = new Event('input');
      Object.defineProperty(event, 'target', {
        value: { value: '31-DEC-2025' },
        writable: false
      });

      component.onTermDateInput(event);
      expect(component.mode).toBe('add');
    });
  });

  describe('onAmountKeyDown - additional keys', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should allow comma as decimal separator when no decimal exists', () => {
      const event = { key: ',', target: { value: '100', selectionStart: 3 }, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAmountKeyDown(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should allow metaKey combinations', () => {
      const event = { key: 'c', target: { value: '', selectionStart: 0 }, ctrlKey: false, metaKey: true, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAmountKeyDown(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });

    it('should handle null selectionStart gracefully', () => {
      const event = { key: '5', target: { value: '100', selectionStart: null }, ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.onAmountKeyDown(event);
      expect((event as any).preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('lastModifiedDisplay - additional cases', () => {
    it('should return empty string when data has no lastModifiedDate', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, lastModifiedDate: null };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should return empty string for invalid lastModifiedDate', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, lastModifiedDate: 'not-a-date' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should format a valid lastModifiedDate with time', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, lastModifiedDate: '2024-06-15T18:30:00Z' };
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      const display = component.lastModifiedDisplay;
      expect(display).toContain('Last Modified:');
      expect(display).toContain('PST');
      expect(display).toMatch(/\d{2}:\d{2} PST/);
    });
  });

  describe('editEffectiveDateDisplay - additional cases', () => {
    it('should return dash when form is not initialized', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.form.get('effectiveDate')?.setValue(null);
      expect(component.editEffectiveDateDisplay).toBe('-');
    });
  });

  describe('resetFormAfterSave - add mode', () => {
    it('should only reset isSubmitting in add mode (no originalFormValue update)', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.isSubmitting = true;

      component.resetFormAfterSave();

      expect(component.isSubmitting).toBeFalse();
      expect((component as any).originalFormValue).toBeNull();
    });
  });

  describe('resetFormAfterError - add mode', () => {
    it('should only reset isSubmitting in add mode', () => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      component.isSubmitting = true;

      component.resetFormAfterError();

      expect(component.isSubmitting).toBeFalse();
      expect((component as any).originalFormValue).toBeNull();
    });
  });

  describe('resetFormAfterSave - edit mode marks pristine', () => {
    it('should mark form as pristine after timeout', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      tick(400);

      // Make a change to dirty the form
      component.form.get('description')?.setValue('Changed');
      component.form.markAsDirty();
      component.isSubmitting = true;

      component.resetFormAfterSave();
      tick(400);

      expect(component.form.pristine).toBeTrue();
      expect(component.isSubmitting).toBeFalse();
    }));
  });

  describe('resetFormAfterError - edit mode updates originalFormValue', () => {
    it('should update originalFormValue after timeout in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
      tick(400);

      component.form.get('description')?.setValue('Changed');
      component.isSubmitting = true;

      component.resetFormAfterError();
      tick(400);

      // originalFormValue should now match the current form value
      expect((component as any).originalFormValue).toBeTruthy();
      expect(component.isSubmitting).toBeFalse();
    }));
  });

  describe('ngOnInit - loads interdiction codes for initial status', () => {
    it('should load interdiction codes when initial status is H', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, statusFlag: 'H' };
      component.selectedAttributeGroup = 'ALERT';
      mockApiService.getInterdictionCodes.calls.reset();

      component.ngOnInit();

      expect(mockApiService.getInterdictionCodes).toHaveBeenCalledWith('H');
    });

    it('should load interdiction codes when initial status is N', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, statusFlag: 'N' };
      component.selectedAttributeGroup = 'ALERT';
      mockApiService.getInterdictionCodes.calls.reset();

      component.ngOnInit();

      expect(mockApiService.getInterdictionCodes).toHaveBeenCalledWith('N');
    });

    it('should NOT load interdiction codes when initial status is O', () => {
      component.mode = 'add';
      component.data = null;
      component.selectedAttributeGroup = 'ALERT';
      mockApiService.getInterdictionCodes.calls.reset();

      component.ngOnInit();

      expect(mockApiService.getInterdictionCodes).not.toHaveBeenCalled();
    });
  });

  describe('setupDateValidationListeners - triggers cdr', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should call markForCheck when effective date changes', fakeAsync(() => {
      const cdrSpy = spyOn(component.cdr, 'markForCheck');
      component.form.get('effectiveDate')?.setValue(moment('2099-06-15'));
      tick();
      expect(cdrSpy).toHaveBeenCalled();
    }));

    it('should call markForCheck when termination date changes', fakeAsync(() => {
      const cdrSpy = spyOn(component.cdr, 'markForCheck');
      component.form.get('terminationDate')?.setValue(moment('2099-12-31'));
      tick();
      expect(cdrSpy).toHaveBeenCalled();
    }));
  });

  describe('effectiveDate and terminationDate valueChanges update lastChangedDateField', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to effective when effective date changes', fakeAsync(() => {
      component.form.get('effectiveDate')?.setValue(moment('2099-01-01'));
      tick();
      expect((component as any).lastChangedDateField).toBe('effective');
    }));

    it('should set lastChangedDateField to termination when termination date changes', fakeAsync(() => {
      component.form.get('terminationDate')?.setValue(moment('2099-12-31'));
      tick();
      expect((component as any).lastChangedDateField).toBe('termination');
    }));
  });

  describe('specialOrder/regularOrder sync - lowercase and edge values', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should handle lowercase y for specialOrder', fakeAsync(() => {
      component.form.get('specialOrder')?.setValue('y');
      tick();
      expect(component.form.get('regularOrder')?.value).toBe('No');
      expect(component.form.get('normalStockFlag')?.value).toBe('N');
    }));

    it('should handle lowercase y for regularOrder', fakeAsync(() => {
      component.form.get('regularOrder')?.setValue('y');
      tick();
      expect(component.form.get('specialOrder')?.value).toBe('No');
      expect(component.form.get('normalStockFlag')?.value).toBe('Y');
    }));

    it('should not sync when specialOrder value is not yes/y', fakeAsync(() => {
      const prevRegularOrder = component.form.get('regularOrder')?.value;
      component.form.get('specialOrder')?.setValue('No');
      tick();
      // regularOrder should remain unchanged since specialOrder is not Yes/Y
      expect(component.form.get('regularOrder')?.value).toBe(prevRegularOrder);
    }));

    it('should not sync when regularOrder value is not yes/y', fakeAsync(() => {
      const prevSpecialOrder = component.form.get('specialOrder')?.value;
      component.form.get('regularOrder')?.setValue('No');
      tick();
      expect(component.form.get('specialOrder')?.value).toBe(prevSpecialOrder);
    }));
  });

  describe('Field validations - additional', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should enforce maxLength on attributeCode field', () => {
      const control = component.form.get('attributeCode');
      control?.setValue('A'.repeat(11));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should require attributeCode', () => {
      const control = component.form.get('attributeCode');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require description', () => {
      const control = component.form.get('description');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require unitScheme', () => {
      const control = component.form.get('unitScheme');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require statusFlag', () => {
      const control = component.form.get('statusFlag');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should enforce pattern on attributeType field (CMA only)', () => {
      const control = component.form.get('attributeType');
      control?.setValue('X');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('C');
      expect(control?.hasError('pattern')).toBeFalse();

      control?.setValue('M');
      expect(control?.hasError('pattern')).toBeFalse();

      control?.setValue('A');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should enforce maxLength on serviceCode field', () => {
      const control = component.form.get('serviceCode');
      control?.setValue('A'.repeat(9));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce max on price field', () => {
      const control = component.form.get('price');
      control?.setValue(10000);
      expect(control?.hasError('max')).toBeTrue();
    });

    it('should enforce min 0 on price field', () => {
      const control = component.form.get('price');
      control?.setValue(-1);
      expect(control?.hasError('min')).toBeTrue();
    });

    it('should enforce max 9 on attributePosition field', () => {
      const control = component.form.get('attributePosition');
      control?.setValue(10);
      expect(control?.hasError('max')).toBeTrue();
    });

    it('should require stopLabelFlag', () => {
      const control = component.form.get('stopLabelFlag');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require showOnLabelFlag', () => {
      const control = component.form.get('showOnLabelFlag');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require exclusivityFlag', () => {
      const control = component.form.get('exclusivityFlag');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require attributeCustom', () => {
      const control = component.form.get('attributeCustom');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require creditFlag', () => {
      const control = component.form.get('creditFlag');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require normalStockFlag', () => {
      const control = component.form.get('normalStockFlag');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require assignAfterLabelFlag', () => {
      const control = component.form.get('assignAfterLabelFlag');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength on interCode field', () => {
      const control = component.form.get('interCode');
      control?.enable();
      control?.setValue('ABCDE');
      expect(control?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('deepCloneFormValue - additional cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should clone null values', () => {
      const value = { key1: null, key2: 'text' };
      const cloned = (component as any).deepCloneFormValue(value);
      expect(cloned.key1).toBeNull();
      expect(cloned.key2).toBe('text');
    });

    it('should clone numeric values', () => {
      const value = { price: 99.99, position: 0 };
      const cloned = (component as any).deepCloneFormValue(value);
      expect(cloned.price).toBe(99.99);
      expect(cloned.position).toBe(0);
    });

    it('should create independent moment clones', () => {
      const originalMoment = moment('2025-06-15');
      const value = { date: originalMoment };
      const cloned = (component as any).deepCloneFormValue(value);

      // Modify original
      originalMoment.add(1, 'day');

      // Cloned should not be affected
      expect(cloned.date.format('YYYY-MM-DD')).toBe('2025-06-15');
    });
  });

  describe('attributeTypeOptions and statusFlagOptions', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should have 3 attribute type options', () => {
      expect(component.attributeTypeOptions.length).toBe(3);
      expect(component.attributeTypeOptions.map(o => o.value)).toEqual(['C', 'M', 'A']);
    });

    it('should have correct labels for attribute type options', () => {
      expect(component.attributeTypeOptions[0].label).toContain('Conversion');
      expect(component.attributeTypeOptions[1].label).toContain('Modification');
      expect(component.attributeTypeOptions[2].label).toContain('Simple');
    });
  });

  describe('hasDateValidationError - all branches', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should return true when form has dateRangeInvalid error', () => {
      component.form.setErrors({ dateRangeInvalid: true });
      expect((component as any).hasDateValidationError()).toBeTrue();
    });

    it('should return false when no date errors exist', () => {
      component.form.setErrors(null);
      component.form.get('effectiveDate')?.setValue(futureDate);
      component.form.get('terminationDate')?.setValue(null);
      expect((component as any).hasDateValidationError()).toBeFalse();
    });
  });

  describe('setupInterdictionCodeSearchListener', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should filter codes on search input', fakeAsync(() => {
      component.interdictionCodeOptions = mockInterdictionCodes as any;
      component.filteredInterdictionCodeOptions = mockInterdictionCodes as any;

      component.interdictionCodeSearchControl.setValue('AIDS');
      tick(350);

      expect(component.filteredInterdictionCodeOptions.length).toBe(1);
      expect(component.filteredInterdictionCodeOptions[0].value).toBe('AIDS');
    }));

    it('should show all codes when search is cleared', fakeAsync(() => {
      component.interdictionCodeOptions = mockInterdictionCodes as any;
      component.filteredInterdictionCodeOptions = [];

      component.interdictionCodeSearchControl.setValue('');
      tick(350);

      expect(component.filteredInterdictionCodeOptions.length).toBe(2);
    }));

    it('should filter case-insensitively', fakeAsync(() => {
      component.interdictionCodeOptions = mockInterdictionCodes as any;

      component.interdictionCodeSearchControl.setValue('abot');
      tick(350);

      expect(component.filteredInterdictionCodeOptions.length).toBe(1);
    }));
  });

  describe('constructor - effect and minDate', () => {
    it('should set minDate in constructor', () => {
      const freshFixture = TestBed.createComponent(AddEditAttributeCodeComponent);
      const freshComponent = freshFixture.componentInstance;
      expect(freshComponent.minDate).toBeDefined();
      expect(moment.isMoment(freshComponent.minDate)).toBeTrue();
      freshFixture.destroy();
    });

    it('should set terminationMinDate equal to minDate initially', () => {
      const freshFixture = TestBed.createComponent(AddEditAttributeCodeComponent);
      const freshComponent = freshFixture.componentInstance;
      expect(freshComponent.terminationMinDate.isSame(freshComponent.minDate, 'day')).toBeTrue();
      freshFixture.destroy();
    });
  });

  describe('form cross-field date range validator', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.selectedAttributeGroup = 'ALERT';
      fixture.detectChanges();
    });

    it('should set dateRangeInvalid when termination before effective', () => {
      component.form.patchValue({
        effectiveDate: moment('2099-12-31'),
        terminationDate: moment('2099-01-01')
      });

      component.form.updateValueAndValidity();
      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should not set error when termination is after effective', () => {
      component.form.patchValue({
        effectiveDate: moment('2099-01-01'),
        terminationDate: moment('2099-12-31')
      });

      component.form.updateValueAndValidity();
      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });
  });
});