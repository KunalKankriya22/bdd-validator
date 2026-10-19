import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { AddEditContactComponent } from './add-edit-contact.component';
import { CustomerContactApiService } from '../services/customer-contact-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { CustomerContactDto, ContactTypeDto } from '../models/customer-contact.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditContactComponent', () => {
  let component: AddEditContactComponent;
  let fixture: ComponentFixture<AddEditContactComponent>;
  let apiServiceSpy: jasmine.SpyObj<CustomerContactApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockContactTypes: ContactTypeDto[] = [
    { code: 'D', description: 'Director' },
    { code: 'F', description: 'Financial' }
  ];

  const mockContact: CustomerContactDto = {
    customerId: 'CUST001',
    instId: '0001',
    contactType: 'D',
    contactTypeDesc: 'Director',
    firstName: 'John',
    lastName: 'Smith',
    salutation: 'Mr.',
    title: 'Dr.',
    dayPhoneNo: '555-1234',
    nightPhoneNo: '555-5678',
    faxNo: '555-9999',
    effDate: '2024-01-01T00:00:00',
    termDate: null
  };

  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();
    apiServiceSpy = jasmine.createSpyObj('CustomerContactApiService', [
      'getContactTypes', 'createCustomerContact', 'updateCustomerContact'
    ]);
    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable()
    });

    apiServiceSpy.getContactTypes.and.returnValue(of(mockContactTypes));

    await TestBed.configureTestingModule({
      imports: [AddEditContactComponent, NoopAnimationsModule],
      providers: [
        { provide: CustomerContactApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditContactComponent);
    component = fixture.componentInstance;
    component.mode = 'add';
    component.data = { customerId: 'CUST001', effDate: '' };
    component.customerName = 'Okinawa Japan Hospital';
  });

  describe('Contact Types Loading', () => {
    it('should load contact types on init', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getContactTypes).toHaveBeenCalled();
      expect(component.contactTypeOptions.length).toBe(2);
    });

    it('should handle contact type load error gracefully', () => {
      apiServiceSpy.getContactTypes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.isLoadingContactTypes).toBeFalse();
      expect(component.contactTypeOptions.length).toBe(0);
    });
  });

  describe('Panel Title', () => {
    it('should show Add title in add mode', () => {
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Contact for Okinawa Japan Hospital');
    });

    it('should show Edit title in edit mode', () => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Contact for Okinawa Japan Hospital');
    });

    it('should show plain Add title when customerName is empty', () => {
      component.customerName = '';
      component.data = { customerId: 'CUST001', effDate: '' };
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Contact');
    });

    it('should show plain Edit title when customerName is empty', () => {
      component.mode = 'edit';
      component.customerName = '';
      component.data = { ...mockContact, customerName: undefined };
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Contact');
    });

    it('should fall back to data.customerName if customerName input is empty', () => {
      component.mode = 'edit';
      component.customerName = '';
      component.data = { ...mockContact, customerName: 'Fallback Hospital' };
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Contact for Fallback Hospital');
    });
  });

  describe('Form Validation — Required Fields', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should mark contactType as required', () => {
      const ctrl = component.contactForm.get('contactType');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeTrue();
    });

    it('should mark firstName as required', () => {
      const ctrl = component.contactForm.get('firstName');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeTrue();
    });

    it('should mark lastName as required', () => {
      const ctrl = component.contactForm.get('lastName');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeTrue();
    });

    it('should mark dayPhoneNo as required', () => {
      const ctrl = component.contactForm.get('dayPhoneNo');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeTrue();
    });

    it('should mark effectiveDate as required', () => {
      const ctrl = component.contactForm.get('effectiveDate');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeTrue();
    });

    it('should not require salutation', () => {
      const ctrl = component.contactForm.get('salutation');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeFalsy();
    });

    it('should not require title', () => {
      const ctrl = component.contactForm.get('title');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeFalsy();
    });

    it('should not require nightPhoneNo', () => {
      const ctrl = component.contactForm.get('nightPhoneNo');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeFalsy();
    });

    it('should not require faxNo', () => {
      const ctrl = component.contactForm.get('faxNo');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeFalsy();
    });

    it('should not require terminationDate', () => {
      const ctrl = component.contactForm.get('terminationDate');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.errors?.['required']).toBeFalsy();
    });
  });

  describe('Max Length Validation', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should reject firstName exceeding 50 characters', () => {
      const ctrl = component.contactForm.get('firstName');
      ctrl?.setValue('A'.repeat(51));
      expect(ctrl?.errors?.['maxlength']).toBeTruthy();
    });

    it('should reject lastName exceeding 50 characters', () => {
      const ctrl = component.contactForm.get('lastName');
      ctrl?.setValue('B'.repeat(51));
      expect(ctrl?.errors?.['maxlength']).toBeTruthy();
    });

    it('should reject salutation exceeding 10 characters', () => {
      const ctrl = component.contactForm.get('salutation');
      ctrl?.setValue('A'.repeat(11));
      expect(ctrl?.errors?.['maxlength']).toBeTruthy();
    });

    it('should reject title exceeding 10 characters', () => {
      const ctrl = component.contactForm.get('title');
      ctrl?.setValue('B'.repeat(11));
      expect(ctrl?.errors?.['maxlength']).toBeTruthy();
    });
  });

  describe('Name Pattern Validation', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should accept standard letters', () => {
      component.contactForm.get('firstName')?.setValue('John');
      expect(component.contactForm.get('firstName')?.errors?.['pattern']).toBeFalsy();
    });

    it('should accept hyphenated names (Smith-Jones)', () => {
      component.contactForm.get('lastName')?.setValue('Smith-Jones');
      expect(component.contactForm.get('lastName')?.errors?.['pattern']).toBeFalsy();
    });

    it('should accept apostrophe names (O\'Brien)', () => {
      component.contactForm.get('lastName')?.setValue("O'Brien");
      expect(component.contactForm.get('lastName')?.errors?.['pattern']).toBeFalsy();
    });

    it('should accept accented characters (García)', () => {
      component.contactForm.get('lastName')?.setValue('García');
      expect(component.contactForm.get('lastName')?.errors?.['pattern']).toBeFalsy();
    });

    it('should accept names with periods (Jr.)', () => {
      component.contactForm.get('lastName')?.setValue('Smith Jr.');
      expect(component.contactForm.get('lastName')?.errors?.['pattern']).toBeFalsy();
    });

    it('should reject numbers in name fields', () => {
      component.contactForm.get('firstName')?.setValue('John1');
      expect(component.contactForm.get('firstName')?.errors?.['pattern']).toBeTruthy();
    });

    it('should reject special characters in name fields', () => {
      component.contactForm.get('firstName')?.setValue('John@#');
      expect(component.contactForm.get('firstName')?.errors?.['pattern']).toBeTruthy();
    });
  });

  describe('Phone Formatting', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should strip non-digits on focus', () => {
      component.contactForm.get('dayPhoneNo')?.setValue('555-123-4567');
      component.stripPhoneOnFocus('dayPhoneNo');
      expect(component.contactForm.get('dayPhoneNo')?.value).toBe('5551234567');
    });

    it('should not change value when no non-digits exist', () => {
      component.contactForm.get('dayPhoneNo')?.setValue('5551234567');
      component.stripPhoneOnFocus('dayPhoneNo');
      expect(component.contactForm.get('dayPhoneNo')?.value).toBe('5551234567');
    });

    it('should not alter null values on focus', () => {
      component.contactForm.get('dayPhoneNo')?.setValue(null);
      component.stripPhoneOnFocus('dayPhoneNo');
      expect(component.contactForm.get('dayPhoneNo')?.value).toBeNull();
    });

    it('should format 10-digit number on blur', () => {
      component.contactForm.get('dayPhoneNo')?.setValue('5551234567');
      component.formatPhoneOnBlur('dayPhoneNo');
      expect(component.contactForm.get('dayPhoneNo')?.value).toBe('555-123-4567');
    });

    it('should format 7-digit number on blur', () => {
      component.contactForm.get('nightPhoneNo')?.setValue('5551234');
      component.formatPhoneOnBlur('nightPhoneNo');
      expect(component.contactForm.get('nightPhoneNo')?.value).toBe('555-1234');
    });

    it('should not format numbers with other digit counts', () => {
      component.contactForm.get('faxNo')?.setValue('12345');
      component.formatPhoneOnBlur('faxNo');
      expect(component.contactForm.get('faxNo')?.value).toBe('12345');
    });

    it('should not alter null values on blur', () => {
      component.contactForm.get('faxNo')?.setValue(null);
      component.formatPhoneOnBlur('faxNo');
      expect(component.contactForm.get('faxNo')?.value).toBeNull();
    });
  });

  describe('onlyNumbers', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should allow digit keys', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Backspace', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Tab', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow ArrowLeft', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+C (copy)', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should prevent letter keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      const result = component.onlyNumbers(event);
      expect(result).toBeFalse();
    });

    it('should allow Delete key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Home key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow End key', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow metaKey combinations', () => {
      const event = new KeyboardEvent('keydown', { key: 'v', metaKey: true });
      expect(component.onlyNumbers(event)).toBeTrue();
    });
  });

  describe('onDateFieldKeyPress', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should allow alphanumeric and hyphen characters', () => {
      const event = new KeyboardEvent('keydown', { key: 'A' });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow digits', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].forEach(key => {
        const event = new KeyboardEvent('keydown', { key });
        spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should prevent special characters', () => {
      const event = new KeyboardEvent('keydown', { key: '@' });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow Ctrl key combinations', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow metaKey combinations', () => {
      const event = new KeyboardEvent('keydown', { key: 'v', metaKey: true });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow hyphen character', () => {
      const event = new KeyboardEvent('keydown', { key: '-' });
      spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowUp and ArrowDown', () => {
      ['ArrowUp', 'ArrowDown'].forEach(key => {
        const event = new KeyboardEvent('keydown', { key });
        spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });
  });

  describe('Effective Date Display (edit mode)', () => {
    it('should show formatted date in edit mode', () => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      expect(component.effectiveDateDisplay).not.toBe('--');
    });

    it('should show -- when effDate is null', () => {
      component.mode = 'edit';
      component.data = { ...mockContact, effDate: '' };
      fixture.detectChanges();
      expect(component.effectiveDateDisplay).toBe('--');
    });
  });

  describe('isSaveEnabled', () => {
    it('should be false when form is invalid', () => {
      fixture.detectChanges();
      component.contactForm.get('firstName')?.setValue(null);
      expect(component.isSaveEnabled).toBeFalse();
    });

    it('should be true in add mode when form is valid', () => {
      fixture.detectChanges();
      component.contactForm.patchValue({
        contactType: 'D',
        firstName: 'John',
        lastName: 'Smith',
        dayPhoneNo: '5551234567',
        effectiveDate: moment().add(1, 'day')
      });
      expect(component.isSaveEnabled).toBeTrue();
    });

    it('should be false in edit mode when form unchanged', () => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      (component as any).populateForm();
      expect(component.isSaveEnabled).toBeFalse();
    });

    it('should be true in edit mode when form is changed', () => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      (component as any).populateForm();
      component.contactForm.get('firstName')?.setValue('Changed');
      expect(component.isSaveEnabled).toBeTrue();
    });
  });

  describe('isFormChanged (edit mode)', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      (component as any).populateForm();
    });

    it('should detect firstName change', () => {
      component.contactForm.get('firstName')?.setValue('Changed');
      expect(component.isFormChanged).toBeTrue();
    });

    it('should detect contactType change', () => {
      component.contactForm.get('contactType')?.setValue('F');
      expect(component.isFormChanged).toBeTrue();
    });

    it('should detect lastName change', () => {
      component.contactForm.get('lastName')?.setValue('Different');
      expect(component.isFormChanged).toBeTrue();
    });

    it('should detect salutation change', () => {
      component.contactForm.get('salutation')?.setValue('Mrs.');
      expect(component.isFormChanged).toBeTrue();
    });

    it('should detect title change', () => {
      component.contactForm.get('title')?.setValue('Prof.');
      expect(component.isFormChanged).toBeTrue();
    });

    it('should detect dayPhoneNo change', () => {
      component.contactForm.get('dayPhoneNo')?.setValue('999-8888');
      expect(component.isFormChanged).toBeTrue();
    });

    it('should detect nightPhoneNo change', () => {
      component.contactForm.get('nightPhoneNo')?.setValue('111-2222');
      expect(component.isFormChanged).toBeTrue();
    });

    it('should detect faxNo change', () => {
      component.contactForm.get('faxNo')?.setValue('333-4444');
      expect(component.isFormChanged).toBeTrue();
    });

    it('should detect terminationDate change (null to set)', () => {
      component.contactForm.get('terminationDate')?.setValue(moment().add(30, 'days'));
      expect(component.isFormChanged).toBeTrue();
    });

    it('should detect terminationDate change (set to different)', () => {
      component.mode = 'edit';
      component.data = { ...mockContact, termDate: '2025-06-01T00:00:00' };
      fixture.detectChanges();
      component.contactForm.get('terminationDate')?.setValue(moment('2025-12-31'));
      expect(component.isFormChanged).toBeTrue();
    });

    it('should return false when no fields changed', () => {
      expect(component.isFormChanged).toBeFalse();
    });

    it('should return false when form is invalid', () => {
      component.contactForm.get('firstName')?.setValue(null);
      expect(component.isFormChanged).toBeFalse();
    });
  });

  describe('setupDateValidationListeners', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should set lastChangedDateField to effective on effectiveDate change', () => {
      component.contactForm.get('effectiveDate')?.setValue(moment().add(5, 'days'));
      expect(component.lastChangedDateField).toBe('effective');
    });

    it('should call updateTerminationMinDate when effectiveDate changes', () => {
      const futureDate = moment().add(100, 'days');
      component.contactForm.get('effectiveDate')?.setValue(futureDate);
      expect(component.terminationMinDate).toBeTruthy();
    });

    it('should update terminationDate validity when effectiveDate changes', () => {
      const termCtrl = component.contactForm.get('terminationDate');
      const spy = spyOn(termCtrl!, 'updateValueAndValidity');
      component.contactForm.get('effectiveDate')?.setValue(moment().add(2, 'days'));
      expect(spy).toHaveBeenCalledWith({ emitEvent: false });
    });

    it('should set lastChangedDateField to termination on terminationDate change', () => {
      component.contactForm.get('terminationDate')?.setValue(moment().add(30, 'days'));
      expect(component.lastChangedDateField).toBe('termination');
    });

    it('should update effDateError signal on effectiveDate change', () => {
      component.contactForm.get('effectiveDate')?.setValue(moment().add(5, 'days'));
      expect(typeof (component as any).effDateError()).toBe('string');
    });

    it('should update termDateError signal on terminationDate change', () => {
      component.contactForm.get('terminationDate')?.setValue(moment().add(30, 'days'));
      expect(typeof (component as any).termDateError()).toBe('string');
    });
  });

  describe('updateTerminationMinDate', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should use minDate when effectiveDate is null', () => {
      component.contactForm.get('effectiveDate')?.setValue(null, { emitEvent: false });
      (component as any).updateTerminationMinDate();
      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should use effectiveDate when it is after minDate (Moment)', () => {
      const futureDate = moment().add(100, 'days');
      component.contactForm.get('effectiveDate')?.setValue(futureDate, { emitEvent: false });
      (component as any).updateTerminationMinDate();
      expect(component.terminationMinDate.isSameOrAfter(futureDate, 'day')).toBeTrue();
    });

    it('should use minDate when effectiveDate is before minDate', () => {
      const pastDate = moment('1900-01-01');
      component.contactForm.get('effectiveDate')?.setValue(pastDate, { emitEvent: false });
      (component as any).updateTerminationMinDate();
      expect(component.terminationMinDate.isSameOrAfter(component.minDate, 'day')).toBeTrue();
    });

    it('should handle Date object input', () => {
      const futureJsDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
      component.contactForm.get('effectiveDate')?.setValue(futureJsDate, { emitEvent: false });
      (component as any).updateTerminationMinDate();
      expect(component.terminationMinDate).toBeTruthy();
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return string result', () => {
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should pass form errors when lastChangedDateField is effective', () => {
      component.lastChangedDateField = 'effective';
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('Range error');
      component.getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('effectiveDate'),
        'Effective Date',
        'Termination Date',
        component.contactForm.errors
      );
    });

    it('should pass null for formErrors when lastChangedDateField is not effective', () => {
      component.lastChangedDateField = 'termination';
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('effectiveDate'),
        'Effective Date',
        'Termination Date',
        null
      );
    });

    it('should pass null for formErrors when lastChangedDateField is null', () => {
      component.lastChangedDateField = null;
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('effectiveDate'),
        'Effective Date',
        'Termination Date',
        null
      );
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return string result', () => {
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });

    it('should pass form errors when lastChangedDateField is termination', () => {
      component.lastChangedDateField = 'termination';
      const spy = spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('Range error');
      component.getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('terminationDate'),
        'Termination Date',
        'Effective Date',
        component.contactForm.errors
      );
    });

    it('should pass null for formErrors when lastChangedDateField is not termination', () => {
      component.lastChangedDateField = 'effective';
      const spy = spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(
        component.contactForm.get('terminationDate'),
        'Termination Date',
        'Effective Date',
        null
      );
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const mockEvent = { target: { value: '15-JAN-2025' } } as unknown as Event;
      component.onEffectiveDateInput(mockEvent);
      expect(spy).toHaveBeenCalledWith('15-JAN-2025', component.contactForm.get('effectiveDate'));
    });
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should delegate to DateFieldValidationUtility.handleEndDateInput in add mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const mockEvent = { target: { value: '20-DEC-2025' } } as unknown as Event;
      component.onTerminationDateInput(mockEvent);
      expect(spy).toHaveBeenCalledWith('20-DEC-2025', component.contactForm.get('terminationDate'), false);
    });

    it('should pass isEdit=true in edit mode', () => {
      component.mode = 'edit';
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const mockEvent = { target: { value: '20-DEC-2025' } } as unknown as Event;
      component.onTerminationDateInput(mockEvent);
      expect(spy).toHaveBeenCalledWith('20-DEC-2025', component.contactForm.get('terminationDate'), true);
    });
  });

  describe('onSave — Add Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.contactForm.patchValue({
        contactType: 'D',
        firstName: 'NewFirst',
        lastName: 'NewLast',
        dayPhoneNo: '5551234567',
        effectiveDate: moment().add(1, 'day')
      });
      component.contactForm.markAsDirty();
    });

    it('should call createCustomerContact on save', () => {
      apiServiceSpy.createCustomerContact.and.returnValue(of({ success: true, message: 'Created' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(apiServiceSpy.createCustomerContact).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show error snackbar on create failure', () => {
      apiServiceSpy.createCustomerContact.and.returnValue(throwError(() => ({ error: { message: 'Duplicate' } })));

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate');
      expect(component.isSaving).toBeFalse();
    });

    it('should handle error with errorResponse shape', () => {
      apiServiceSpy.createCustomerContact.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '0302', error: 'Invalid customer' } }
      })));

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 0302: Invalid customer');
    });

    it('should use fallback error message', () => {
      apiServiceSpy.createCustomerContact.and.returnValue(throwError(() => ({ error: {} })));

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to add contact.');
    });

    it('should not save when form is invalid', () => {
      component.contactForm.get('firstName')?.setValue(null);

      component.onSave();

      expect(apiServiceSpy.createCustomerContact).not.toHaveBeenCalled();
    });

    it('should set formValidationMessage when form is invalid', () => {
      component.contactForm.get('firstName')?.setValue(null);

      component.onSave();

      expect(component.formValidationMessage).toContain('Please correct');
      expect(component.formValidationMessage).toContain('error');
    });

    it('should clear formValidationMessage before validation', () => {
      component.formValidationMessage = 'Previous error';
      apiServiceSpy.createCustomerContact.and.returnValue(of({ success: true, message: 'Created' }));

      component.onSave();

      expect(component.formValidationMessage).toBe('');
    });

    it('should not save when data is null', () => {
      component.data = null;

      component.onSave();

      expect(apiServiceSpy.createCustomerContact).not.toHaveBeenCalled();
    });

    it('should use fallback success message when response has no message', () => {
      apiServiceSpy.createCustomerContact.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');

      component.onSave();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New contact added to Customer ID CUST001.');
    });

    it('should handle error with errorCode at top level', () => {
      apiServiceSpy.createCustomerContact.and.returnValue(throwError(() => ({
        error: { errorCode: '0201', error: 'Field required' }
      })));

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 0201: Field required');
    });
  });

  describe('onSave — Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      (component as any).populateForm();
      component.contactForm.get('firstName')?.setValue('Changed');
      component.contactForm.markAsDirty();
    });

    it('should call updateCustomerContact on save', () => {
      apiServiceSpy.updateCustomerContact.and.returnValue(of({ success: true, message: 'Updated' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(apiServiceSpy.updateCustomerContact).toHaveBeenCalledWith('CUST001', 'D', jasmine.any(Object));
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show error snackbar on update failure', () => {
      apiServiceSpy.updateCustomerContact.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Update failed');
      expect(component.isSaving).toBeFalse();
    });

    it('should use default success message when response has no message', () => {
      apiServiceSpy.updateCustomerContact.and.returnValue(of({ success: true }));

      component.onSave();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Contact for Customer ID CUST001 is saved.');
    });

    it('should abort if dateRangeInvalid form error exists', () => {
      Object.defineProperty(component.contactForm, 'errors', {
        get: () => ({ dateRangeInvalid: true }),
        configurable: true
      });

      component.onSave();

      expect(apiServiceSpy.updateCustomerContact).not.toHaveBeenCalled();
    });

    it('should set formValidationMessage when dateRangeInvalid', () => {
      Object.defineProperty(component.contactForm, 'errors', {
        get: () => ({ dateRangeInvalid: true }),
        configurable: true
      });

      component.onSave();

      expect(component.formValidationMessage).toBe('Please correct the errors in the form before saving.');
    });

    it('should set newContactType when contactType changed', () => {
      component.contactForm.get('contactType')?.setValue('F');
      apiServiceSpy.updateCustomerContact.and.returnValue(of({ success: true, message: 'Updated' }));

      component.onSave();

      const dto = apiServiceSpy.updateCustomerContact.calls.mostRecent().args[2];
      expect(dto.newContactType).toBe('F');
    });

    it('should set newContactType to null when contactType unchanged', () => {
      apiServiceSpy.updateCustomerContact.and.returnValue(of({ success: true, message: 'Updated' }));

      component.onSave();

      const dto = apiServiceSpy.updateCustomerContact.calls.mostRecent().args[2];
      expect(dto.newContactType).toBeNull();
    });

    it('should handle update error with errorResponse shape', () => {
      apiServiceSpy.updateCustomerContact.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '4503', error: 'Term before eff' } }
      })));

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 4503: Term before eff');
    });

    it('should use fallback update error message', () => {
      apiServiceSpy.updateCustomerContact.and.returnValue(throwError(() => ({ error: {} })));

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update contact.');
    });
  });

  describe('onAddAndCreateAnother', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.contactForm.patchValue({
        contactType: 'D',
        firstName: 'NewFirst',
        lastName: 'NewLast',
        dayPhoneNo: '5551234567',
        effectiveDate: moment().add(1, 'day')
      });
      component.contactForm.markAsDirty();
    });

    it('should create contact and reset form', () => {
      apiServiceSpy.createCustomerContact.and.returnValue(of({ success: true, message: 'Created' }));
      spyOn(component.saveSuccess, 'emit');

      component.onAddAndCreateAnother();

      expect(apiServiceSpy.createCustomerContact).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.contactForm.pristine).toBeTrue();
    });

    it('should not create when in edit mode', () => {
      component.mode = 'edit';

      component.onAddAndCreateAnother();

      expect(apiServiceSpy.createCustomerContact).not.toHaveBeenCalled();
    });

    it('should not create when form is invalid', () => {
      component.contactForm.get('firstName')?.setValue(null);

      component.onAddAndCreateAnother();

      expect(apiServiceSpy.createCustomerContact).not.toHaveBeenCalled();
    });

    it('should set formValidationMessage when form is invalid', () => {
      component.contactForm.get('firstName')?.setValue(null);

      component.onAddAndCreateAnother();

      expect(component.formValidationMessage).toContain('Please correct');
      expect(component.formValidationMessage).toContain('error');
    });

    it('should not create when data is null', () => {
      component.data = null;

      component.onAddAndCreateAnother();

      expect(apiServiceSpy.createCustomerContact).not.toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    it('should reset form in add mode', () => {
      fixture.detectChanges();
      component.contactForm.patchValue({ firstName: 'Test' });

      component.onClearAll();

      expect(component.contactForm.get('firstName')?.value).toBeNull();
    });

    it('should revert to original values in edit mode', () => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      (component as any).populateForm();
      component.contactForm.get('firstName')?.setValue('Changed');

      component.onClearAll();

      expect(component.contactForm.get('firstName')?.value).toBe('John');
      expect(component.contactForm.get('lastName')?.value).toBe('Smith');
    });

    it('should mark form as dirty after clear', () => {
      fixture.detectChanges();
      component.contactForm.patchValue({ firstName: 'Test' });

      component.onClearAll();

      expect(component.contactForm.dirty).toBeTrue();
    });

    it('should restore all fields in edit mode including optional ones', () => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      (component as any).populateForm();
      component.contactForm.get('salutation')?.setValue('Changed');
      component.contactForm.get('title')?.setValue('Changed');
      component.contactForm.get('nightPhoneNo')?.setValue('000-0000');
      component.contactForm.get('faxNo')?.setValue('111-1111');

      component.onClearAll();

      expect(component.contactForm.get('salutation')?.value).toBe('Mr.');
      expect(component.contactForm.get('title')?.value).toBe('Dr.');
      expect(component.contactForm.get('nightPhoneNo')?.value).toBe('555-5678');
      expect(component.contactForm.get('faxNo')?.value).toBe('555-9999');
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel event', () => {
      fixture.detectChanges();
      spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('Populate Form — Edit Mode', () => {
    it('should populate form with contact data', () => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      (component as any).populateForm();

      expect(component.contactForm.get('contactType')?.value).toBe('D');
      expect(component.contactForm.get('firstName')?.value).toBe('John');
      expect(component.contactForm.get('lastName')?.value).toBe('Smith');
      expect(component.contactForm.get('salutation')?.value).toBe('Mr.');
      expect(component.contactForm.get('dayPhoneNo')?.value).toBe('555-1234');
    });

    it('should set lastModifiedDisplay when lastModifiedDate exists', () => {
      component.mode = 'edit';
      component.data = { ...mockContact, lastModifiedDate: '2024-06-15T10:30:00' };
      fixture.detectChanges();
      (component as any).populateForm();

      expect(component.lastModifiedDisplay).toContain('Last Modified:');
    });

    it('should clear lastModifiedDisplay in add mode', () => {
      fixture.detectChanges();
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should clear lastModifiedDisplay when lastModifiedDate is missing in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockContact, lastModifiedDate: undefined };
      fixture.detectChanges();
      (component as any).populateForm();
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should set originalEffectiveDate and originalTermDate in edit mode', () => {
      const contactWithTerm = { ...mockContact, termDate: '2025-12-31T00:00:00' };
      component.mode = 'edit';
      component.data = contactWithTerm;
      fixture.detectChanges();
      (component as any).populateForm();

      expect((component as any).originalEffectiveDate).toBeTruthy();
      expect((component as any).originalTermDate).toBeTruthy();
    });

    it('should reset originalDates to null in add mode', () => {
      component.mode = 'add';
      component.data = { customerId: 'CUST001', effDate: '' };
      fixture.detectChanges();

      expect((component as any).originalEffectiveDate).toBeNull();
      expect((component as any).originalTermDate).toBeNull();
    });

    it('should handle populating with null termDate', () => {
      component.mode = 'edit';
      component.data = { ...mockContact, termDate: null };
      fixture.detectChanges();
      (component as any).populateForm();

      expect(component.contactForm.get('terminationDate')?.value).toBeNull();
      expect((component as any).originalTermDate).toBeNull();
    });
  });

  describe('formatLastModified', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should format a valid date string', () => {
      const result = (component as any).formatLastModified('2024-06-15T10:30:00');
      expect(result).toContain('15-JUN-2024');
      expect(result).toContain('10:30');
    });

    it('should return original string for invalid date', () => {
      const result = (component as any).formatLastModified('not-a-date');
      expect(result).toBe('not-a-date');
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should update minDate and terminationMinDate on chapter change', () => {
      fixture.detectChanges();
      const initialMinDate = component.minDate.clone();
      chapterChangedSubject.next();
      expect(component.minDate).toBeTruthy();
      expect(component.terminationMinDate).toBeTruthy();
    });
  });

  describe('ngOnChanges', () => {
    it('should repopulate form when mode changes', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockContact;
      component.ngOnChanges({
        mode: {
          previousValue: 'add',
          currentValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.contactForm.get('firstName')?.value).toBe('John');
    });

    it('should repopulate form when data changes', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = { ...mockContact, firstName: 'Jane' };
      component.ngOnChanges({
        data: {
          previousValue: null,
          currentValue: component.data,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.contactForm.get('firstName')?.value).toBe('Jane');
    });

    it('should not repopulate when unrelated changes occur', () => {
      fixture.detectChanges();
      component.contactForm.get('firstName')?.setValue('TestValue');
      component.ngOnChanges({
        customerName: {
          previousValue: 'Old',
          currentValue: 'New',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.contactForm.get('firstName')?.value).toBe('TestValue');
    });
  });

  describe('ngOnInit mode branching', () => {
    it('should enable effectiveDate in edit mode', () => {
      component.mode = 'edit';
      component.data = mockContact;
      fixture.detectChanges();
      expect(component.contactForm.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should enable effectiveDate in add mode (setupAddModeValidators)', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.contactForm.get('effectiveDate')?.enabled).toBeTrue();
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique componentId', () => {
      fixture.detectChanges();
      expect((component as any).componentId).toMatch(/^add-edit-contact-\d+$/);
    });

    it('should generate element IDs', () => {
      fixture.detectChanges();
      const id = (component as any).elementId('form');
      expect(id).toMatch(/^add-edit-contact-\d+-form$/);
    });

    it('should generate error IDs', () => {
      fixture.detectChanges();
      const id = (component as any).errorId('firstName');
      expect(id).toMatch(/^add-edit-contact-\d+-firstName-error$/);
    });

    it('should generate label IDs', () => {
      fixture.detectChanges();
      const id = (component as any).labelId('contactType');
      expect(id).toMatch(/^add-edit-contact-\d+-contactType-label$/);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should call next on destroy$ subject', () => {
      fixture.detectChanges();
      const nextSpy = spyOn((component as any).destroy$, 'next');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
    });
  });

  describe('stripPhone (private)', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should strip non-digits from phone value', () => {
      const result = (component as any).stripPhone('555-123-4567');
      expect(result).toBe('5551234567');
    });

    it('should return null for null input', () => {
      const result = (component as any).stripPhone(null);
      expect(result).toBeNull();
    });

    it('should return empty string for empty input', () => {
      const result = (component as any).stripPhone('');
      expect(result).toBe('');
    });
  });

  describe('Error State Matchers', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
    });
  });
});
