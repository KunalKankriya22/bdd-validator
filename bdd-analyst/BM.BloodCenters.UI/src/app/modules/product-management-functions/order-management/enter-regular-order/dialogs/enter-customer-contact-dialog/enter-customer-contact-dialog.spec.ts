import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import moment from 'moment';

import {
  EnterCustomerContactDialogComponent,
  EnterCustomerContactDialogData,
} from './enter-customer-contact-dialog';
import { RegularOrderApiService } from '../../services/regular-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

describe('EnterCustomerContactDialogComponent', () => {
  let component: EnterCustomerContactDialogComponent;
  let fixture: ComponentFixture<EnterCustomerContactDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EnterCustomerContactDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<RegularOrderApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockDialogData: EnterCustomerContactDialogData = {
    customerId: 'CUST001',
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('RegularOrderApiService', [
      'getContactTypes',
      'getSalutationsLookup',
      'getContacts',
    ]);
    apiServiceSpy.getContacts.and.returnValue(of([]));
    apiServiceSpy.getContactTypes.and.returnValue(of([
      { code: 'D', description: 'Default' },
      { code: 'B', description: 'Billing' },
    ]));
    apiServiceSpy.getSalutationsLookup.and.returnValue(of([
      { code: 'MR', description: 'Mr.' },
      { code: 'MS', description: 'Ms.' },
    ]));
    headerServiceSpy = createMockHeaderService();

    await TestBed.configureTestingModule({
      imports: [EnterCustomerContactDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: RegularOrderApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterCustomerContactDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize contact form with required fields', () => {
    expect(component.contactForm).toBeTruthy();
    expect(component.contactForm.get('lastName')).toBeTruthy();
    expect(component.contactForm.get('firstName')).toBeTruthy();
    expect(component.contactForm.get('contactTypeCode')).toBeTruthy();
    expect(component.contactForm.get('dayPhone')).toBeTruthy();
    expect(component.contactForm.get('effDate')).toBeTruthy();
  });

  it('should default contactTypeCode to D', () => {
    expect(component.contactForm.get('contactTypeCode')?.value).toBe('D');
  });

  it('should require lastName, firstName, contactTypeCode, dayPhone, and effDate', () => {
    component.contactForm.patchValue({
      lastName: '',
      firstName: '',
      contactTypeCode: '',
      dayPhone: '',
      effDate: null,
    });
    component.contactForm.markAllAsTouched();
    expect(component.contactForm.get('lastName')?.hasError('required')).toBeTrue();
    expect(component.contactForm.get('firstName')?.hasError('required')).toBeTrue();
    expect(component.contactForm.get('contactTypeCode')?.hasError('required')).toBeTrue();
    expect(component.contactForm.get('dayPhone')?.hasError('required')).toBeTrue();
    expect(component.contactForm.get('effDate')?.hasError('required')).toBeTrue();
  });

  it('should load contact types on init', () => {
    expect(apiServiceSpy.getContactTypes).toHaveBeenCalled();
    expect(component.contactTypes().length).toBe(2);
  });

  it('should load salutations on init', () => {
    expect(apiServiceSpy.getSalutationsLookup).toHaveBeenCalled();
    expect(component.salutations().length).toBe(2);
  });

  it('should validate phone number format', () => {
    const ctrl = component.contactForm.get('dayPhone');
    ctrl?.setValue('abc');
    expect(ctrl?.hasError('phoneFormat')).toBeTrue();

    ctrl?.setValue('123');
    expect(ctrl?.hasError('phoneFormat')).toBeTrue();

    ctrl?.setValue('1234567');
    expect(ctrl?.valid).toBeTrue();

    ctrl?.setValue('1234567890');
    expect(ctrl?.valid).toBeTrue();
  });

  it('should format 7-digit phone number correctly', () => {
    const formatted = EnterCustomerContactDialogComponent.formatPhoneNumber('5551234');
    expect(formatted).toBe('555-1234');
  });

  it('should format 10-digit phone number correctly', () => {
    const formatted = EnterCustomerContactDialogComponent.formatPhoneNumber('2145551234');
    expect(formatted).toBe('214-555-1234');
  });

  it('should close dialog with form data on valid save', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    component.contactForm.patchValue({
      lastName: 'Smith',
      firstName: 'John',
      contactTypeCode: 'D',
      dayPhone: '555-1234',
      effDate: futureDate,
    });
    component.onSave();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
      lastName: 'Smith',
      firstName: 'John',
    }));
  });

  it('should not save when form is invalid', () => {
    component.contactForm.patchValue({ lastName: '', firstName: '' });
    component.onSave();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should close dialog with null on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  // ─── ngOnDestroy ──────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySub = (component as any).destroy$;
      const nextSpy = spyOn(destroySub, 'next');
      const completeSpy = spyOn(destroySub, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ─── f getter ─────────────────────────────────────────────────────

  describe('f getter', () => {
    it('should return contactForm controls', () => {
      expect(component.f).toBe(component.contactForm.controls);
    });

    it('should expose individual controls through f', () => {
      expect(component.f['lastName']).toBe(component.contactForm.get('lastName')!);
      expect(component.f['firstName']).toBe(component.contactForm.get('firstName')!);
    });
  });

  // ─── Form initialization ─────────────────────────────────────────

  describe('form initialization', () => {
    it('should initialize optional fields without required validators', () => {
      expect(component.contactForm.get('salutation')?.hasError('required')).toBeFalse();
      expect(component.contactForm.get('title')?.hasError('required')).toBeFalse();
      expect(component.contactForm.get('termDate')?.hasError('required')).toBeFalse();
    });

    it('should initialize faxNumber, nightPhone, telexNumber with phone validator but not required', () => {
      const fax = component.contactForm.get('faxNumber');
      const night = component.contactForm.get('nightPhone');
      const telex = component.contactForm.get('telexNumber');

      // Empty values should be valid (not required)
      expect(fax?.valid).toBeTrue();
      expect(night?.valid).toBeTrue();
      expect(telex?.valid).toBeTrue();

      // Invalid phone should fail
      fax?.setValue('abc');
      expect(fax?.hasError('phoneFormat')).toBeTrue();

      night?.setValue('12');
      expect(night?.hasError('phoneFormat')).toBeTrue();

      telex?.setValue('999!');
      expect(telex?.hasError('phoneFormat')).toBeTrue();
    });

    it('should set minDate on init', () => {
      expect(component.minDate).toBeTruthy();
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });

    it('should set terminationMinDate on init', () => {
      expect(component.terminationMinDate).toBeTruthy();
      expect(moment.isMoment(component.terminationMinDate)).toBeTrue();
    });
  });

  // ─── selectedContactTypeDescription computed signal ───────────────

  describe('selectedContactTypeDescription', () => {
    it('should return the description for the selected contact type code', () => {
      component.selectedContactTypeCode.set('D');
      component.contactTypes.set([
        { code: 'D', description: 'Default' },
        { code: 'B', description: 'Billing' },
      ]);
      expect(component.selectedContactTypeDescription()).toBe('Default');
    });

    it('should return the code when no matching type found', () => {
      component.selectedContactTypeCode.set('X');
      component.contactTypes.set([
        { code: 'D', description: 'Default' },
      ]);
      expect(component.selectedContactTypeDescription()).toBe('X');
    });

    it('should update when contactTypeCode form control changes', () => {
      component.contactTypes.set([
        { code: 'D', description: 'Default' },
        { code: 'B', description: 'Billing' },
      ]);
      component.contactForm.get('contactTypeCode')!.setValue('B');
      expect(component.selectedContactTypeCode()).toBe('B');
      expect(component.selectedContactTypeDescription()).toBe('Billing');
    });
  });

  // ─── loadContactTypes sets filteredContactTypes / filteredSalutations ──

  describe('loadContactTypes', () => {
    it('should populate filteredContactTypes with loaded types', () => {
      expect(component.filteredContactTypes().length).toBe(2);
      expect(component.filteredContactTypes()[0].code).toBe('D');
    });

    it('should populate filteredSalutations with loaded salutations', () => {
      expect(component.filteredSalutations().length).toBe(2);
      expect(component.filteredSalutations()[0].code).toBe('MR');
    });
  });

  // ─── phoneNumberValidator static method ────────────────────────────

  describe('phoneNumberValidator', () => {
    it('should return null for empty value', () => {
      const ctrl = component.contactForm.get('faxNumber')!;
      ctrl.setValue('');
      const result = EnterCustomerContactDialogComponent.phoneNumberValidator(ctrl);
      expect(result).toBeNull();
    });

    it('should return null for null value', () => {
      const ctrl = component.contactForm.get('faxNumber')!;
      ctrl.setValue(null);
      const result = EnterCustomerContactDialogComponent.phoneNumberValidator(ctrl);
      expect(result).toBeNull();
    });

    it('should reject letters in phone number', () => {
      const ctrl = component.contactForm.get('faxNumber')!;
      ctrl.setValue('123abc');
      const result = EnterCustomerContactDialogComponent.phoneNumberValidator(ctrl);
      expect(result).toEqual({ phoneFormat: 'Phone number must contain only digits and dashes' });
    });

    it('should reject special characters in phone number', () => {
      const ctrl = component.contactForm.get('faxNumber')!;
      ctrl.setValue('123@456');
      const result = EnterCustomerContactDialogComponent.phoneNumberValidator(ctrl);
      expect(result).toEqual({ phoneFormat: 'Phone number must contain only digits and dashes' });
    });

    it('should reject wrong digit count', () => {
      const ctrl = component.contactForm.get('faxNumber')!;
      ctrl.setValue('12345');
      const result = EnterCustomerContactDialogComponent.phoneNumberValidator(ctrl);
      expect(result).toEqual({ phoneFormat: 'Phone number must be 7 or 10 digits' });
    });

    it('should accept 7-digit phone with dashes', () => {
      const ctrl = component.contactForm.get('faxNumber')!;
      ctrl.setValue('555-1234');
      const result = EnterCustomerContactDialogComponent.phoneNumberValidator(ctrl);
      expect(result).toBeNull();
    });

    it('should accept 10-digit phone with dashes', () => {
      const ctrl = component.contactForm.get('faxNumber')!;
      ctrl.setValue('214-555-1234');
      const result = EnterCustomerContactDialogComponent.phoneNumberValidator(ctrl);
      expect(result).toBeNull();
    });
  });

  // ─── formatPhoneNumber static method ──────────────────────────────

  describe('formatPhoneNumber', () => {
    it('should return empty string for empty input', () => {
      expect(EnterCustomerContactDialogComponent.formatPhoneNumber('')).toBe('');
    });

    it('should return the value as-is for null-like input', () => {
      expect(EnterCustomerContactDialogComponent.formatPhoneNumber(null as any)).toBeFalsy();
    });

    it('should return unchanged value for non-standard length', () => {
      expect(EnterCustomerContactDialogComponent.formatPhoneNumber('12345')).toBe('12345');
    });

    it('should return unchanged value if already formatted 7-digit', () => {
      // Input has dashes; after stripping dashes = 7 digits, re-formats
      expect(EnterCustomerContactDialogComponent.formatPhoneNumber('555-1234')).toBe('555-1234');
    });

    it('should return unchanged value if already formatted 10-digit', () => {
      expect(EnterCustomerContactDialogComponent.formatPhoneNumber('214-555-1234')).toBe('214-555-1234');
    });

    it('should format 7 raw digits', () => {
      expect(EnterCustomerContactDialogComponent.formatPhoneNumber('5551234')).toBe('555-1234');
    });

    it('should format 10 raw digits', () => {
      expect(EnterCustomerContactDialogComponent.formatPhoneNumber('2145551234')).toBe('214-555-1234');
    });

    it('should return value unchanged when digits contain non-digit characters after dash removal', () => {
      // '12a4567' - has 7 chars after removing dashes, but not all digits
      expect(EnterCustomerContactDialogComponent.formatPhoneNumber('12a4567')).toBe('12a4567');
    });
  });

  // ─── onPhoneBlur ──────────────────────────────────────────────────

  describe('onPhoneBlur', () => {
    it('should format the phone value and mark as touched', () => {
      const ctrl = component.contactForm.get('dayPhone')!;
      ctrl.setValue('5551234');
      component.onPhoneBlur('dayPhone');
      expect(ctrl.value).toBe('555-1234');
      expect(ctrl.touched).toBeTrue();
    });

    it('should not update value if formatted is same as current', () => {
      const ctrl = component.contactForm.get('dayPhone')!;
      ctrl.setValue('555-1234');
      const setValueSpy = spyOn(ctrl, 'setValue');
      component.onPhoneBlur('dayPhone');
      expect(setValueSpy).not.toHaveBeenCalled();
      expect(ctrl.touched).toBeTrue();
    });

    it('should do nothing if control does not exist', () => {
      expect(() => component.onPhoneBlur('nonExistentControl')).not.toThrow();
    });

    it('should do nothing if control value is empty', () => {
      const ctrl = component.contactForm.get('dayPhone')!;
      ctrl.setValue('');
      expect(() => component.onPhoneBlur('dayPhone')).not.toThrow();
    });

    it('should do nothing if control value is null', () => {
      const ctrl = component.contactForm.get('faxNumber')!;
      ctrl.setValue(null);
      expect(() => component.onPhoneBlur('faxNumber')).not.toThrow();
    });

    it('should format 10-digit phone on blur for faxNumber', () => {
      const ctrl = component.contactForm.get('faxNumber')!;
      ctrl.setValue('2145551234');
      component.onPhoneBlur('faxNumber');
      expect(ctrl.value).toBe('214-555-1234');
    });

    it('should format nightPhone on blur', () => {
      const ctrl = component.contactForm.get('nightPhone')!;
      ctrl.setValue('5551234');
      component.onPhoneBlur('nightPhone');
      expect(ctrl.value).toBe('555-1234');
    });

    it('should format telexNumber on blur', () => {
      const ctrl = component.contactForm.get('telexNumber')!;
      ctrl.setValue('5551234');
      component.onPhoneBlur('telexNumber');
      expect(ctrl.value).toBe('555-1234');
    });
  });

  // ─── onEffectiveDateChange ────────────────────────────────────────

  describe('onEffectiveDateChange', () => {
    it('should set lastChangedDateField to effective', () => {
      component.onEffectiveDateChange();
      expect((component as any).lastChangedDateField).toBe('effective');
    });

    it('should mark effDate as touched and dirty', () => {
      component.onEffectiveDateChange();
      const effDate = component.contactForm.get('effDate')!;
      expect(effDate.touched).toBeTrue();
      expect(effDate.dirty).toBeTrue();
    });

    it('should update terminationMinDate when effective date is after minDate', () => {
      const futureDate = moment().add(10, 'days');
      component.contactForm.get('effDate')!.setValue(futureDate);
      component.onEffectiveDateChange();
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    });

    it('should keep terminationMinDate as minDate when effective date is before minDate', () => {
      const pastDate = moment('2000-01-01');
      component.contactForm.get('effDate')!.setValue(pastDate);
      component.onEffectiveDateChange();
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });

    it('should keep terminationMinDate as minDate when effective date is null', () => {
      component.contactForm.get('effDate')!.setValue(null);
      component.onEffectiveDateChange();
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });

    it('should handle Date object as effective date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      component.contactForm.get('effDate')!.setValue(futureDate);
      component.onEffectiveDateChange();
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(moment(futureDate).format('YYYY-MM-DD'));
    });

    it('should call updateValueAndValidity on the form', () => {
      const spy = spyOn(component.contactForm, 'updateValueAndValidity');
      component.onEffectiveDateChange();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ─── onTerminationDateChange ──────────────────────────────────────

  describe('onTerminationDateChange', () => {
    it('should set lastChangedDateField to termination', () => {
      component.onTerminationDateChange();
      expect((component as any).lastChangedDateField).toBe('termination');
    });

    it('should mark termDate as touched and dirty', () => {
      component.onTerminationDateChange();
      const termDate = component.contactForm.get('termDate')!;
      expect(termDate.touched).toBeTrue();
      expect(termDate.dirty).toBeTrue();
    });

    it('should call updateValueAndValidity on the form', () => {
      const spy = spyOn(component.contactForm, 'updateValueAndValidity');
      component.onTerminationDateChange();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ─── onEffectiveDateInput ─────────────────────────────────────────

  describe('onEffectiveDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '01-Jan-2030' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(spy).toHaveBeenCalledWith('01-Jan-2030', component.contactForm.get('effDate'));
    });

    it('should handle empty input', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(spy).toHaveBeenCalledWith('', component.contactForm.get('effDate'));
    });
  });

  // ─── onTerminationDateInput ───────────────────────────────────────

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-Dec-2030' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('31-Dec-2030', component.contactForm.get('termDate'), false);
    });

    it('should handle empty input', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('', component.contactForm.get('termDate'), false);
    });
  });

  // ─── getEffectiveDateError ────────────────────────────────────────

  describe('getEffectiveDateError', () => {
    it('should pass form errors when lastChangedDateField is effective', () => {
      (component as any).lastChangedDateField = 'effective';
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('effDate'),
        'Effective Date',
        'Termination Date',
        component.contactForm.errors
      );
    });

    it('should pass null for form errors when lastChangedDateField is not effective', () => {
      (component as any).lastChangedDateField = 'termination';
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('effDate'),
        'Effective Date',
        'Termination Date',
        null
      );
    });

    it('should pass null for form errors when lastChangedDateField is null', () => {
      (component as any).lastChangedDateField = null;
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('effDate'),
        'Effective Date',
        'Termination Date',
        null
      );
    });
  });

  // ─── getTerminationDateError ──────────────────────────────────────

  describe('getTerminationDateError', () => {
    it('should pass form errors when lastChangedDateField is termination', () => {
      (component as any).lastChangedDateField = 'termination';
      const spy = spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('termDate'),
        'Termination Date',
        'Effective Date',
        component.contactForm.errors
      );
    });

    it('should pass null for form errors when lastChangedDateField is not termination', () => {
      (component as any).lastChangedDateField = 'effective';
      const spy = spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('termDate'),
        'Termination Date',
        'Effective Date',
        null
      );
    });

    it('should pass null for form errors when lastChangedDateField is null', () => {
      (component as any).lastChangedDateField = null;
      const spy = spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('termDate'),
        'Termination Date',
        'Effective Date',
        null
      );
    });
  });

  // ─── onSave ───────────────────────────────────────────────────────

  describe('onSave', () => {
    it('should mark all form controls as touched', () => {
      const spy = spyOn(component.contactForm, 'markAllAsTouched');
      component.onSave();
      expect(spy).toHaveBeenCalled();
    });

    it('should call clearOptionalDateErrors for termDate', () => {
      const spy = spyOn(DateFieldValidationUtility, 'clearOptionalDateErrors');
      component.onSave();
      expect(spy).toHaveBeenCalledWith(component.contactForm, 'termDate');
    });

    it('should set lastChangedDateField to effective when dateRangeInvalid and lastChangedDateField is null', () => {
      // Set up a form-level dateRangeInvalid error
      const futureDate = moment().add(10, 'days');
      const pastDate = moment().add(5, 'days');
      component.contactForm.patchValue({
        lastName: 'Smith',
        firstName: 'John',
        contactTypeCode: 'D',
        dayPhone: '555-1234',
        effDate: futureDate,
        termDate: pastDate,
      });
      // Force dateRangeInvalid error on the form (term < eff)
      component.contactForm.setErrors({ dateRangeInvalid: true });
      (component as any).lastChangedDateField = null;
      component.onSave();
      expect((component as any).lastChangedDateField).toBe('effective');
    });

    it('should not change lastChangedDateField when dateRangeInvalid but lastChangedDateField is already set', () => {
      component.contactForm.setErrors({ dateRangeInvalid: true });
      (component as any).lastChangedDateField = 'termination';
      component.onSave();
      expect((component as any).lastChangedDateField).toBe('termination');
    });

    it('should serialize effDate using serializeDateForApi when valid', () => {
      const futureDate = moment().add(30, 'days');
      component.contactForm.patchValue({
        lastName: 'Doe',
        firstName: 'Jane',
        contactTypeCode: 'D',
        dayPhone: '555-1234',
        effDate: futureDate,
      });
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalled();
      const closeArg = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(closeArg.effectiveDate).toBe(futureDate.format('YYYY-MM-DD'));
    });

    it('should pass null for terminationDate when termDate is not set', () => {
      const futureDate = moment().add(30, 'days');
      component.contactForm.patchValue({
        lastName: 'Doe',
        firstName: 'Jane',
        contactTypeCode: 'D',
        dayPhone: '555-1234',
        effDate: futureDate,
        termDate: null,
      });
      component.onSave();
      const closeArg = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(closeArg.terminationDate).toBeNull();
    });

    it('should serialize both dates when both are provided', () => {
      const effDate = moment().add(30, 'days');
      const termDate = moment().add(60, 'days');
      component.contactForm.patchValue({
        lastName: 'Doe',
        firstName: 'Jane',
        contactTypeCode: 'D',
        dayPhone: '555-1234',
        effDate: effDate,
        termDate: termDate,
      });
      component.onSave();
      const closeArg = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(closeArg.effectiveDate).toBe(effDate.format('YYYY-MM-DD'));
      expect(closeArg.terminationDate).toBe(termDate.format('YYYY-MM-DD'));
    });

    it('should pass null effectiveDate when effDate is null on valid form', () => {
      // This branch is unlikely in real use (effDate is required), but tests the null guard
      const spy = spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue(null);
      // Make form valid by bypassing validators
      component.contactForm.patchValue({
        lastName: 'Doe',
        firstName: 'Jane',
        contactTypeCode: 'D',
        dayPhone: '555-1234',
        effDate: moment().add(30, 'days'),
      });
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should include all form fields in close data', () => {
      const futureDate = moment().add(30, 'days');
      component.contactForm.patchValue({
        lastName: 'Doe',
        firstName: 'Jane',
        salutation: 'MR',
        title: 'Manager',
        contactTypeCode: 'D',
        dayPhone: '555-1234',
        faxNumber: '555-5678',
        nightPhone: '555-9012',
        telexNumber: '555-3456',
        effDate: futureDate,
      });
      component.onSave();
      const closeArg = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(closeArg.lastName).toBe('Doe');
      expect(closeArg.firstName).toBe('Jane');
      expect(closeArg.salutation).toBe('MR');
      expect(closeArg.title).toBe('Manager');
      expect(closeArg.contactTypeCode).toBe('D');
      expect(closeArg.dayPhone).toBe('555-1234');
      expect(closeArg.faxNumber).toBe('555-5678');
      expect(closeArg.nightPhone).toBe('555-9012');
      expect(closeArg.telexNumber).toBe('555-3456');
    });
  });

  // ─── Search filters ───────────────────────────────────────────────

  describe('search filters', () => {
    it('should filter contact types by code on search', fakeAsync(() => {
      component.contactTypes.set([
        { code: 'D', description: 'Default' },
        { code: 'B', description: 'Billing' },
        { code: 'S', description: 'Shipping' },
      ]);
      component.contactTypeSearchCtrl.setValue('b');
      tick(200);
      expect(component.filteredContactTypes().length).toBe(1);
      expect(component.filteredContactTypes()[0].code).toBe('B');
    }));

    it('should filter contact types by description on search', fakeAsync(() => {
      component.contactTypes.set([
        { code: 'D', description: 'Default' },
        { code: 'B', description: 'Billing' },
        { code: 'S', description: 'Shipping' },
      ]);
      component.contactTypeSearchCtrl.setValue('ship');
      tick(200);
      expect(component.filteredContactTypes().length).toBe(1);
      expect(component.filteredContactTypes()[0].code).toBe('S');
    }));

    it('should show all contact types when search is empty', fakeAsync(() => {
      component.contactTypes.set([
        { code: 'D', description: 'Default' },
        { code: 'B', description: 'Billing' },
      ]);
      component.contactTypeSearchCtrl.setValue('');
      tick(200);
      expect(component.filteredContactTypes().length).toBe(2);
    }));

    it('should show all contact types when search is null', fakeAsync(() => {
      component.contactTypes.set([
        { code: 'D', description: 'Default' },
        { code: 'B', description: 'Billing' },
      ]);
      component.contactTypeSearchCtrl.setValue(null);
      tick(200);
      expect(component.filteredContactTypes().length).toBe(2);
    }));

    it('should filter salutations by code on search', fakeAsync(() => {
      component.salutations.set([
        { code: 'MR', description: 'Mr.' },
        { code: 'MS', description: 'Ms.' },
        { code: 'DR', description: 'Dr.' },
      ]);
      component.salutationSearchCtrl.setValue('dr');
      tick(200);
      expect(component.filteredSalutations().length).toBe(1);
      expect(component.filteredSalutations()[0].code).toBe('DR');
    }));

    it('should filter salutations by description on search', fakeAsync(() => {
      component.salutations.set([
        { code: 'MR', description: 'Mr.' },
        { code: 'MS', description: 'Ms.' },
        { code: 'DR', description: 'Dr.' },
      ]);
      component.salutationSearchCtrl.setValue('mr');
      tick(200);
      expect(component.filteredSalutations().length).toBe(1);
      expect(component.filteredSalutations()[0].code).toBe('MR');
    }));

    it('should show all salutations when search is empty', fakeAsync(() => {
      component.salutations.set([
        { code: 'MR', description: 'Mr.' },
        { code: 'MS', description: 'Ms.' },
      ]);
      component.salutationSearchCtrl.setValue('');
      tick(200);
      expect(component.filteredSalutations().length).toBe(2);
    }));

    it('should show all salutations when search is null', fakeAsync(() => {
      component.salutations.set([
        { code: 'MR', description: 'Mr.' },
        { code: 'MS', description: 'Ms.' },
      ]);
      component.salutationSearchCtrl.setValue(null);
      tick(200);
      expect(component.filteredSalutations().length).toBe(2);
    }));

    it('should return no results when search matches nothing', fakeAsync(() => {
      component.contactTypes.set([
        { code: 'D', description: 'Default' },
        { code: 'B', description: 'Billing' },
      ]);
      component.contactTypeSearchCtrl.setValue('xyz');
      tick(200);
      expect(component.filteredContactTypes().length).toBe(0);
    }));

    it('should debounce search input', fakeAsync(() => {
      component.contactTypes.set([
        { code: 'D', description: 'Default' },
        { code: 'B', description: 'Billing' },
      ]);
      component.contactTypeSearchCtrl.setValue('b');
      tick(100); // Less than debounce time
      // Should still show all (filter not yet applied)
      expect(component.filteredContactTypes().length).toBe(2);
      tick(100); // Now debounce fires
      expect(component.filteredContactTypes().length).toBe(1);
    }));
  });

  // ─── data injection ───────────────────────────────────────────────

  describe('data injection', () => {
    it('should inject dialog data with customerId', () => {
      expect(component.data.customerId).toBe('CUST001');
    });
  });

  // ─── effDateErrorMatcher / termDateErrorMatcher ───────────────────

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
});
