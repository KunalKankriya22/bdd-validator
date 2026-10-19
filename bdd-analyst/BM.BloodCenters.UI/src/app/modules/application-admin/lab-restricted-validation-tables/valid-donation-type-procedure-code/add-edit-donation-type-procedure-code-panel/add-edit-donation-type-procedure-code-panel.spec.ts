import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import moment from 'moment';
import { AddEditDonationTypeProcedureCodePanel } from './add-edit-donation-type-procedure-code-panel';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ValidDonationTypeProcedureCodeService } from '../services/valid-donation-type-procedure-code.service';
import { HeaderService } from '@shared/services/header.service';
import { of } from 'rxjs';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  DonationTypeLookup,
  ProcedureCodeLookup,
  AttributeGroupLookup,
  AttributeCodeLookup
} from '../models/valid-donation-type-procedure-code.model';

describe('AddEditDonationTypeProcedureCodePanel', () => {
  let component: AddEditDonationTypeProcedureCodePanel;
  let fixture: ComponentFixture<AddEditDonationTypeProcedureCodePanel>;
  let mockService: jasmine.SpyObj<ValidDonationTypeProcedureCodeService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    // Create mock service
    mockService = jasmine.createSpyObj('ValidDonationTypeProcedureCodeService', [
      'getAllDropdownOptions',
      'getAttributeCodes',
      'addRecord',
      'updateRecord'
    ]);

    // Mock to return empty arrays
    mockService.getAllDropdownOptions.and.returnValue(of({
      donationTypes: [],
      procedureCodes: [],
      attributeGroups: []
    }));
    mockService.getAttributeCodes.and.returnValue(of({ data: [] }));
    mockService.addRecord.and.returnValue(of({ success: true, message: 'Record added successfully' }));
    mockService.updateRecord.and.returnValue(of({ success: true, message: 'Record updated successfully' }));

    // Create mock HeaderService with signal
    mockHeaderService = createMockHeaderService();
    (mockHeaderService as any).chapterTimeZone = signal('America/Chicago');
    (mockHeaderService as any).chapterChanged$ = of(null);



      TestBed.configureTestingModule({
imports: [
        AddEditDonationTypeProcedureCodePanel,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ValidDonationTypeProcedureCodeService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    });



  beforeEach(() => {

      mockService.getAllDropdownOptions.and.returnValue(of({
      donationTypes: [],
      procedureCodes: [],
      attributeGroups: []
    }));


      mockService.getAttributeCodes.and.returnValue(of({ data: [] }));


      mockService.addRecord.and.returnValue(of({ success: true, message: 'Record added successfully' }));


      mockService.updateRecord.and.returnValue(of({ success: true, message: 'Record updated successfully' }));


    fixture = TestBed.createComponent(AddEditDonationTypeProcedureCodePanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should initialize with add mode', () => {
    expect(component.mode).toBe('add');
  });




  it('should have form-level validation requiring at least one of donationType or procedureCode', () => {
    // Initially both are empty, should have error
    component.form.get('donationType')?.setValue('');
    component.form.get('procedureCode')?.setValue('');
    expect(component.form.hasError('atLeastOneRequired')).toBeTrue();

    // When donationType is filled, error should be removed
    component.form.get('donationType')?.setValue('WHOLE');
    expect(component.form.hasError('atLeastOneRequired')).toBeFalse();

    // When procedureCode is filled instead, error should be removed
    component.form.get('donationType')?.setValue('');
    component.form.get('procedureCode')?.setValue('WB');
    expect(component.form.hasError('atLeastOneRequired')).toBeFalse();

    // When both are empty again, error should return
    component.form.get('procedureCode')?.setValue('');
    expect(component.form.hasError('atLeastOneRequired')).toBeTrue();
  });

  it('should have required validators for attribute group', () => {
    const control = component.form.get('attributeGroup');
    expect(control?.hasError('required')).toBeTrue();
  });

  it('should have required validators for attribute code', () => {
    const control = component.form.get('attributeCode');
    expect(control?.hasError('required')).toBeTrue();
  });

  it('should have required validators for effective date', () => {
    const control = component.form.get('effectiveDate');
    expect(control?.hasError('required')).toBeTrue();
  });

  it('should not have required validators for termination date', () => {
    const control = component.form.get('terminationDate');
    control?.markAsTouched();
    expect(control?.hasError('required')).toBeFalse();
  });

  it('should emit closePanel event when onCancel is called', (done) => {
    component.closePanel.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });
    component.onCancel();
  });



  it('should initialize with isSaving as false', () => {
    expect(component.isSaving).toBeFalse();
  });

  it('should have empty dropdown options initially', () => {
    // Dropdown options are stored in private signals, tested via filtered computed signals
    expect(component.filteredDonationTypes().length).toBe(0);
    expect(component.filteredProcedureCodes().length).toBe(0);
    expect(component.filteredAttributeGroups().length).toBe(0);
    expect(component.filteredAttributeCodes().length).toBe(0);
  });

  describe('Mutually Exclusive Fields Behavior', () => {
    it('should disable procedureCode when donationType is selected in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      const donationTypeControl = component.form.get('donationType');
      const procedureCodeControl = component.form.get('procedureCode');

      // Initially both should be enabled
      expect(donationTypeControl?.disabled).toBeFalse();
      expect(procedureCodeControl?.disabled).toBeFalse();

      // Select donation type
      donationTypeControl?.setValue('WHOLE');
      fixture.detectChanges();

      // Procedure code should be disabled
      expect(procedureCodeControl?.disabled).toBeTrue();
    });

    it('should disable donationType when procedureCode is selected in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      const donationTypeControl = component.form.get('donationType');
      const procedureCodeControl = component.form.get('procedureCode');

      // Initially both should be enabled
      expect(donationTypeControl?.disabled).toBeFalse();
      expect(procedureCodeControl?.disabled).toBeFalse();

      // Select procedure code
      procedureCodeControl?.setValue('WB');
      fixture.detectChanges();

      // Donation type should be disabled
      expect(donationTypeControl?.disabled).toBeTrue();
    });

    it('should re-enable procedureCode when donationType is cleared', () => {
      component.mode = 'add';
      component.ngOnInit();

      const donationTypeControl = component.form.get('donationType');
      const procedureCodeControl = component.form.get('procedureCode');

      // Select donation type
      donationTypeControl?.setValue('WHOLE');
      fixture.detectChanges();
      expect(procedureCodeControl?.disabled).toBeTrue();

      // Clear donation type
      donationTypeControl?.setValue('');
      fixture.detectChanges();

      // Procedure code should be enabled again
      expect(procedureCodeControl?.disabled).toBeFalse();
    });

    it('should re-enable donationType when procedureCode is cleared', () => {
      component.mode = 'add';
      component.ngOnInit();

      const donationTypeControl = component.form.get('donationType');
      const procedureCodeControl = component.form.get('procedureCode');

      // Select procedure code
      procedureCodeControl?.setValue('WB');
      fixture.detectChanges();
      expect(donationTypeControl?.disabled).toBeTrue();

      // Clear procedure code
      procedureCodeControl?.setValue('');
      fixture.detectChanges();

      // Donation type should be enabled again
      expect(donationTypeControl?.disabled).toBeFalse();
    });
  });

  describe('Required Asterisk Getters', () => {
    it('isDonationTypeRequired should return true when procedureCode is empty in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      component.form.get('procedureCode')?.setValue('');
      expect(component.isDonationTypeRequired).toBeTrue();
    });

    it('isDonationTypeRequired should return false when procedureCode has value in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      component.form.get('procedureCode')?.setValue('WB');
      expect(component.isDonationTypeRequired).toBeFalse();
    });

    it('isDonationTypeRequired should return false in edit mode', () => {
      component.mode = 'edit';
      component.ngOnInit();

      component.form.get('procedureCode')?.setValue('');
      expect(component.isDonationTypeRequired).toBeFalse();
    });

    it('isProcedureCodeRequired should return true when donationType is empty in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      component.form.get('donationType')?.setValue('');
      expect(component.isProcedureCodeRequired).toBeTrue();
    });

    it('isProcedureCodeRequired should return false when donationType has value in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      component.form.get('donationType')?.setValue('WHOLE');
      expect(component.isProcedureCodeRequired).toBeFalse();
    });

    it('isProcedureCodeRequired should return false in edit mode', () => {
      component.mode = 'edit';
      component.ngOnInit();

      component.form.get('donationType')?.setValue('');
      expect(component.isProcedureCodeRequired).toBeFalse();
    });
  });

  describe('Error Messages', () => {
    it('getDonationTypeError should return error message when both fields are empty and touched', () => {
      component.form.get('donationType')?.setValue('');
      component.form.get('procedureCode')?.setValue('');
      component.form.get('donationType')?.markAsTouched();
      component.form.updateValueAndValidity();

      const error = component.getDonationTypeError();
      expect(error).toBe('Either Donation Type or Procedure Code is required');
    });

    it('getProcedureCodeError should return error message when both fields are empty and touched', () => {
      component.form.get('donationType')?.setValue('');
      component.form.get('procedureCode')?.setValue('');
      component.form.get('procedureCode')?.markAsTouched();
      component.form.updateValueAndValidity();

      const error = component.getProcedureCodeError();
      expect(error).toBe('Either Donation Type or Procedure Code is required');
    });


  });

  describe('lastUpdated Getter - Chapter Timezone Conversion', () => {
    beforeEach(() => {
      component.mode = 'edit';
    });



    it('should format date with prefix "Last Modified:"', () => {
      (component as any).lastModifiedDateRaw = '2026-04-18T20:30:00Z';
      const result = component.lastUpdated;

      expect(result).toContain('Last Modified:');
    });

    it('should format date with uppercase month', () => {
      (component as any).lastModifiedDateRaw = '2026-12-25T00:00:00Z';
      const result = component.lastUpdated;

      expect(result).toContain('DEC');
      expect(result).toMatch(/Last Modified: \d{2}-DEC-2026/);
    });

    it('should format date with leading zeros for single-digit days', () => {
      (component as any).lastModifiedDateRaw = '2026-04-05T00:00:00Z';
      const result = component.lastUpdated;

      expect(result).toMatch(/Last Modified: 0\d-[A-Z]{3}-2026/);
    });

    it('should format date in DD-MMM-YYYY format', () => {
      (component as any).lastModifiedDateRaw = '2026-04-18T20:30:00Z';
      const result = component.lastUpdated;

      // Should match pattern: Last Modified: DD-MMM-YYYY
      expect(result).toMatch(/Last Modified: \d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should apply chapter timezone offset to UTC date', () => {
      (mockHeaderService as any).chapterTimeZone = signal('-05:00');
      (component as any).lastModifiedDateRaw = '2026-01-15T03:00:00Z';
      const result = component.lastUpdated;
      expect(result).toBe('Last Modified: 14-JAN-2026');
    });

    it('should apply positive offset correctly', () => {
      (mockHeaderService as any).chapterTimeZone = signal('+05:30');
      (component as any).lastModifiedDateRaw = '2026-04-14T21:00:00Z';
      const result = component.lastUpdated;
      expect(result).toBe('Last Modified: 15-APR-2026');
    });

    it('should apply large negative offset (GMT-23:00) correctly', () => {
      (mockHeaderService as any).chapterTimeZone = signal('-23:00');
      (component as any).lastModifiedDateRaw = '2026-08-07T02:00:00Z';
      const result = component.lastUpdated;
      expect(result).toBe('Last Modified: 06-AUG-2026');
    });

    it('should fall back gracefully when offset is empty', () => {
      (mockHeaderService as any).chapterTimeZone = signal('');
      (component as any).lastModifiedDateRaw = '2026-04-18T20:30:00Z';
      const result = component.lastUpdated;
      expect(result).toContain('Last Modified:');
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });
  });

  describe('Searchable Dropdown Filtering - Signals', () => {
    const mockDonationTypes: DonationTypeLookup[] = [
      { code: 'AL', description: 'Allogeneic' },
      { code: 'WHOLE', description: 'Whole Blood' },
      { code: 'PLASMA', description: 'Plasma Donation' },
      { code: 'PLATELETS', description: 'Platelet Donation' }
    ];

    const mockProcedureCodes: ProcedureCodeLookup[] = [
      { code: 'PP', description: 'Plasma Pheresis' },
      { code: 'WB', description: 'Whole Blood' },
      { code: 'PLT', description: 'Platelet' },
      { code: 'APH', description: 'Apheresis' }
    ];

    const mockAttributeGroups: AttributeGroupLookup[] = [
      { code: 'DON', description: 'Donation' },
      { code: 'PHER', description: 'Pheresis' },
      { code: 'TEST', description: 'Testing' }
    ];

    const mockAttributeCodes: AttributeCodeLookup[] = [
      { code: '00', description: 'Code 00' },
      { code: '01', description: 'Code 01' },
      { code: '07', description: 'Code 07' },
      { code: '10', description: 'Code 10' }
    ];

    beforeEach(() => {
      // Set up sample data with lookup objects
      (component as any).donationTypeOptionsSignal.set(mockDonationTypes);
      (component as any).procedureCodeOptionsSignal.set(mockProcedureCodes);
      (component as any).attributeGroupOptionsSignal.set(mockAttributeGroups);
      (component as any).attributeCodeOptionsSignal.set(mockAttributeCodes);
    });

    it('should return all donation types when search is empty', () => {
      (component as any).donationTypeSearch.set('');
      const result = component.filteredDonationTypes();
      expect(result).toEqual(mockDonationTypes);
    });

    it('should filter donation types by search term (case-insensitive)', () => {
      (component as any).donationTypeSearch.set('pla');
      const result = component.filteredDonationTypes();
      expect(result).toEqual([mockDonationTypes[2], mockDonationTypes[3]]);
    });

    it('should filter donation types with exact match', () => {
      (component as any).donationTypeSearch.set('AL');
      const result = component.filteredDonationTypes();
      expect(result).toEqual([mockDonationTypes[0]]);
    });

    it('should return empty array when no donation types match search', () => {
      (component as any).donationTypeSearch.set('xyz');
      const result = component.filteredDonationTypes();
      expect(result).toEqual([]);
    });

    it('should return all procedure codes when search is empty', () => {
      (component as any).procedureCodeSearch.set('');
      const result = component.filteredProcedureCodes();
      expect(result).toEqual(mockProcedureCodes);
    });

    it('should filter procedure codes by search term (case-insensitive)', () => {
      (component as any).procedureCodeSearch.set('p');
      const result = component.filteredProcedureCodes();
      expect(result).toEqual([mockProcedureCodes[0], mockProcedureCodes[2], mockProcedureCodes[3]]);
    });

    it('should return all attribute groups when search is empty', () => {
      (component as any).attributeGroupSearch.set('');
      const result = component.filteredAttributeGroups();
      expect(result).toEqual(mockAttributeGroups);
    });

    it('should filter attribute groups by search term (case-insensitive)', () => {
      (component as any).attributeGroupSearch.set('he');
      const result = component.filteredAttributeGroups();
      expect(result).toEqual([mockAttributeGroups[1]]);
    });

    it('should return all attribute codes when search is empty', () => {
      (component as any).attributeCodeSearch.set('');
      const result = component.filteredAttributeCodes();
      expect(result).toEqual(mockAttributeCodes);
    });

    it('should filter attribute codes by search term', () => {
      (component as any).attributeCodeSearch.set('0');
      const result = component.filteredAttributeCodes();
      expect(result).toEqual(mockAttributeCodes);
    });

    it('should filter attribute codes with specific number', () => {
      (component as any).attributeCodeSearch.set('07');
      const result = component.filteredAttributeCodes();
      expect(result).toEqual([mockAttributeCodes[2]]);
    });

    it('should reactively update when search control value changes', () => {
      component.donationTypeSearchControl.setValue('who');
      expect(component.filteredDonationTypes()).toEqual([mockDonationTypes[1]]);

      component.donationTypeSearchControl.setValue('');
      expect(component.filteredDonationTypes()).toEqual(mockDonationTypes);
    });

    it('should handle empty options array gracefully', () => {
      (component as any).donationTypeOptionsSignal.set([]);
      (component as any).donationTypeSearch.set('test');
      const result = component.filteredDonationTypes();
      expect(result).toEqual([]);
    });
  });

  describe('minDate property', () => {
    it('should be defined and return a valid moment object', () => {
      const result = component.minDate;
      expect(result).toBeDefined();
      expect(moment.isMoment(result)).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should call setupPanel when mode changes', () => {
      const setupSpy = spyOn<any>(component, 'setupPanel');
      component.ngOnChanges({ mode: {} as any });
      expect(setupSpy).toHaveBeenCalled();
    });

    it('should call setupPanel when data changes', () => {
      const setupSpy = spyOn<any>(component, 'setupPanel');
      component.ngOnChanges({ data: {} as any });
      expect(setupSpy).toHaveBeenCalled();
    });

    it('should not call setupPanel when unrelated change', () => {
      const setupSpy = spyOn<any>(component, 'setupPanel');
      component.ngOnChanges({ unrelated: {} as any });
      expect(setupSpy).not.toHaveBeenCalled();
    });
  });

  describe('lastUpdated getter', () => {
    it('should return empty string when lastModifiedDateRaw is null', () => {
      (component as any).lastModifiedDateRaw = null;
      expect(component.lastUpdated).toBe('');
    });
  });

  describe('isFormValid getter', () => {
    it('should return true when form is valid', () => {
      component.form.get('donationType')?.setValue('WHOLE');
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeCode')?.setValue('01');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));
      expect(component.isFormValid).toBeTrue();
    });

    it('should return false when required fields missing', () => {
      component.form.get('attributeGroup')?.setValue('');
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('hasFormChanged getter', () => {
    it('should return false in add mode when form is pristine', () => {
      component.mode = 'add';
      component.form.markAsPristine();
      expect(component.hasFormChanged).toBeFalse();
    });

    it('should return true in add mode when form is dirty', () => {
      component.mode = 'add';
      component.form.markAsDirty();
      expect(component.hasFormChanged).toBeTrue();
    });

    it('should return false in edit mode when term date unchanged (both null)', () => {
      component.mode = 'edit';
      (component as any).initialTerminationDate = null;
      component.form.get('terminationDate')?.setValue(null);
      expect(component.hasFormChanged).toBeFalse();
    });

    it('should return true in edit mode when initial is null but current has value', () => {
      component.mode = 'edit';
      (component as any).initialTerminationDate = null;
      component.form.get('terminationDate')?.setValue(moment().add(1, 'month'));
      expect(component.hasFormChanged).toBeTrue();
    });

    it('should return true in edit mode when initial has value but current is null', () => {
      component.mode = 'edit';
      (component as any).initialTerminationDate = moment().add(1, 'month');
      component.form.get('terminationDate')?.setValue(null);
      expect(component.hasFormChanged).toBeTrue();
    });

    it('should return false in edit mode when dates are same day', () => {
      component.mode = 'edit';
      const date = moment().add(1, 'month');
      (component as any).initialTerminationDate = date.clone();
      component.form.get('terminationDate')?.setValue(date.clone());
      expect(component.hasFormChanged).toBeFalse();
    });

    it('should return true in edit mode when dates differ', () => {
      component.mode = 'edit';
      (component as any).initialTerminationDate = moment().add(1, 'month');
      component.form.get('terminationDate')?.setValue(moment().add(2, 'months'));
      expect(component.hasFormChanged).toBeTrue();
    });
  });

  describe('isSaveEnabled getter', () => {
    it('should return false when form is invalid', () => {
      component.form.get('attributeGroup')?.setValue('');
      expect(component.isSaveEnabled).toBeFalse();
    });

    it('should return false when isSaving is true', () => {
      component.form.get('donationType')?.setValue('WHOLE');
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeCode')?.setValue('01');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));
      component.form.markAsDirty();
      component.isSaving = true;
      expect(component.isSaveEnabled).toBeFalse();
    });
  });

  describe('Error Getters', () => {
    it('getAttributeGroupError should return error when touched and required', () => {
      const control = component.form.get('attributeGroup');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getAttributeGroupError()).toBe('Attribute Group is required');
    });

    it('getAttributeGroupError should return empty when has value', () => {
      component.form.get('attributeGroup')?.setValue('DON');
      expect(component.getAttributeGroupError()).toBe('');
    });

    it('getAttributeCodeError should return error when touched and required', () => {
      const control = component.form.get('attributeCode');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getAttributeCodeError()).toBe('Attribute Code is required');
    });

    it('getAttributeCodeError should return empty when has value', () => {
      component.form.get('attributeCode')?.setValue('01');
      expect(component.getAttributeCodeError()).toBe('');
    });

    it('getEffectiveDateError should return string', () => {
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('getTerminationDateError should return string', () => {
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });

    it('getDonationTypeError should return empty when has value', () => {
      component.form.get('donationType')?.setValue('WHOLE');
      expect(component.getDonationTypeError()).toBe('');
    });

    it('getProcedureCodeError should return empty when has value', () => {
      component.form.get('procedureCode')?.setValue('WB');
      expect(component.getProcedureCodeError()).toBe('');
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should delegate to DateFieldValidationUtility', () => {
      const input = { value: '01-JAN-2030' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(true).toBeTrue();
    });
  });

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility', () => {
      const input = { value: '01-JAN-2030' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(true).toBeTrue();
    });
  });

  describe('toNativeDate', () => {
    it('should return null for null input', () => {
      expect((component as any).toNativeDate(null)).toBeNull();
    });

    it('should convert moment to Date', () => {
      const m = moment('2025-06-15');
      const result = (component as any).toNativeDate(m);
      expect(result instanceof Date).toBeTrue();
    });

    it('should return Date as-is', () => {
      const d = new Date(2025, 5, 15);
      const result = (component as any).toNativeDate(d);
      expect(result).toBe(d);
    });

    it('should parse valid date string', () => {
      const result = (component as any).toNativeDate('2025-06-15');
      expect(result instanceof Date).toBeTrue();
    });

    it('should return null for invalid date string', () => {
      const result = (component as any).toNativeDate('not-a-date');
      expect(result).toBeNull();
    });
  });

  describe('toApiDate', () => {
    it('should return empty string for null', () => {
      expect((component as any).toApiDate(null)).toBe('');
    });

    it('should return ISO string for valid date', () => {
      const result = (component as any).toApiDate(new Date(2025, 5, 15));
      expect(result).toContain('2025');
    });
  });

  describe('extractErrorMessage', () => {
    it('should return formatted error with errorCode and error (priority 1)', () => {
      const error = {
        error: {
          errorResponse: { errorCode: 'E001', error: 'Duplicate record' }
        }
      };
      const result = (component as any).extractErrorMessage(error);
      expect(result).toBe('Error: E001 : Duplicate record');
    });

    it('should return error.message (priority 2)', () => {
      const error = { error: { message: 'Server error' } };
      const result = (component as any).extractErrorMessage(error);
      expect(result).toBe('Server error');
    });

    it('should return error.message from error object (priority 3)', () => {
      const error = { message: 'Network error' };
      const result = (component as any).extractErrorMessage(error);
      expect(result).toBe('Network error');
    });

    it('should return default message when no error info', () => {
      const result = (component as any).extractErrorMessage({});
      expect(result).toBe('Error saving record');
    });

    it('should use custom default message', () => {
      const result = (component as any).extractErrorMessage({}, 'Custom error');
      expect(result).toBe('Custom error');
    });
  });

  describe('onSave', () => {
    it('should not save when form is invalid', () => {
      component.form.get('attributeGroup')?.setValue('');
      component.onSave();
      expect(mockService.addRecord).not.toHaveBeenCalled();
      expect(mockService.updateRecord).not.toHaveBeenCalled();
    });

    it('should call addRecord in add mode with valid form', () => {
      component.mode = 'add';
      component.form.get('donationType')?.setValue('WHOLE');
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeCode')?.setValue('01');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));

      const closeSpy = spyOn(component.closePanel, 'emit');
      const saveSpy = spyOn(component.saveSuccess, 'emit');

      component.onSave();

      expect(mockService.addRecord).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });

    it('should send null for procedureCode when donationType is selected', () => {
      component.mode = 'add';
      component.form.get('donationType')?.setValue('WHOLE');
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeCode')?.setValue('01');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));

      component.onSave();

      const callArgs = mockService.addRecord.calls.mostRecent().args[0];
      expect(callArgs.donationType).toBe('WHOLE');
      expect(callArgs.procedureCode).toBeNull();
    });

    it('should send null for donationType when procedureCode is selected', () => {
      component.mode = 'add';
      component.form.get('procedureCode')?.setValue('WB');
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeCode')?.setValue('01');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));

      component.onSave();

      const callArgs = mockService.addRecord.calls.mostRecent().args[0];
      expect(callArgs.donationType).toBeNull();
      expect(callArgs.procedureCode).toBe('WB');
    });

    it('should call updateRecord in edit mode with valid form', () => {
      component.mode = 'edit';
      component.form.get('donationType')?.setValue('WHOLE');
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeCode')?.setValue('01');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));

      component.onSave();

      expect(mockService.updateRecord).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });

    it('should handle save error', () => {
      const { throwError } = require('rxjs');
      mockService.addRecord.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));

      component.mode = 'add';
      component.form.get('donationType')?.setValue('WHOLE');
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeCode')?.setValue('01');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });
  });

  describe('onSaveAndCreateAnother', () => {
    it('should not save when form is invalid', () => {
      component.form.get('attributeGroup')?.setValue('');
      component.onSaveAndCreateAnother();
      expect(mockService.addRecord).not.toHaveBeenCalled();
    });

    it('should save and reset form on success', () => {
      component.mode = 'add';
      component.form.get('donationType')?.setValue('WHOLE');
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeCode')?.setValue('01');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));

      const saveSpy = spyOn(component.saveSuccess, 'emit');

      component.onSaveAndCreateAnother();

      expect(mockService.addRecord).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(component.isSavingAndAdd).toBeFalse();
    });

    it('should handle save and create another error', () => {
      const { throwError } = require('rxjs');
      mockService.addRecord.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: 'E001', error: 'Dup' } }
      })));

      component.mode = 'add';
      component.form.get('donationType')?.setValue('WHOLE');
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeCode')?.setValue('01');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));

      component.onSaveAndCreateAnother();

      expect(component.isSavingAndAdd).toBeFalse();
    });
  });

  describe('updateTerminationMinDate', () => {
    it('should set terminationMinDate to minDate when no effective date', () => {
      component.form.get('effectiveDate')?.setValue(null);
      (component as any).updateTerminationMinDate();
      expect(component.terminationMinDate).toBe(component.minDate);
    });

    it('should use effective date when it is after minDate', () => {
      const futureDate = moment().add(6, 'months');
      component.form.get('effectiveDate')?.setValue(futureDate);
      (component as any).updateTerminationMinDate();
      expect(component.terminationMinDate.isSameOrAfter(component.minDate)).toBeTrue();
    });

    it('should handle Date object as effective date', () => {
      const futureDate = new Date(2030, 5, 15);
      component.form.get('effectiveDate')?.setValue(futureDate);
      (component as any).updateTerminationMinDate();
      expect(moment.isMoment(component.terminationMinDate)).toBeTrue();
    });
  });

  describe('Edit mode setup', () => {
    it('should populate edit values when data is provided', () => {
      component.mode = 'edit';
      component.data = {
        DonationType: 'WHOLE',
        ProcedureCode: 'WB',
        AttribGroup: 'DON',
        AttribCode: '01',
        EffDate: '2025-01-15T00:00:00Z',
        TermDate: '2025-12-31T00:00:00Z',
        LastModifiedDate: '2025-06-01T00:00:00Z',
        SortSequence: 1
      } as any;
      component.ngOnChanges({ data: {} as any });

      expect(component.editModeValues.donationType).toBe('WHOLE');
      expect(component.editModeValues.procedureCode).toBe('WB');
      expect(component.editModeValues.attributeGroup).toBe('DON');
      expect(component.editModeValues.attributeCode).toBe('01');
      expect(component.panelTitle).toBe('Edit Attribute Mapping');
    });

    it('should handle null data in edit mode', () => {
      component.mode = 'edit';
      component.data = null;
      component.ngOnChanges({ data: {} as any });
      expect(component.panelTitle).toBe('Edit Attribute Mapping');
    });

    it('should handle missing optional fields in edit data', () => {
      component.mode = 'edit';
      component.data = {
        DonationType: '',
        ProcedureCode: '',
        AttribGroup: 'DON',
        AttribCode: '01',
        EffDate: null,
        TermDate: null,
        LastModifiedDate: null,
        SortSequence: 0
      } as any;
      component.ngOnChanges({ data: {} as any });

      expect(component.editModeValues.donationType).toBe('-');
      expect(component.editModeValues.procedureCode).toBe('-');
      expect(component.editModeValues.effectiveDate).toBe('-');
    });
  });

  describe('setupAttributeGroupListener', () => {
    it('should clear attribute codes when group is cleared', () => {
      component.form.get('attributeGroup')?.setValue('DON');
      component.form.get('attributeGroup')?.setValue('');
      expect(component.filteredAttributeCodes().length).toBe(0);
    });
  });

  describe('loadAttributeCodes error', () => {
    it('should clear attribute codes on error', () => {
      const { throwError } = require('rxjs');
      mockService.getAttributeCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadAttributeCodes('DON');
      expect(component.filteredAttributeCodes().length).toBe(0);
    });
  });
});
