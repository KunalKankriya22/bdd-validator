import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { ContactAddressComponent } from './contact-address';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { SponsorContactModel, SponsorContactDetailModel, ZipCodeLookupItem } from '../models/maintain-sponsor-contacts.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ContactAddressComponent', () => {
  let component: ContactAddressComponent;
  let fixture: ComponentFixture<ContactAddressComponent>;
  let mockSponsorContactsService: jasmine.SpyObj<MaintainSponsorContactsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockContactData: SponsorContactModel = {
    sponsorId: 'SPONSOR123',
    contactId: 'CONTACT123',
    addressId: 'ADDR456',
    contactType: 'PRIMARY',
    contactTypeDescription: 'Primary Contact',
    salutation: 'MR',
    salutationDescription: 'Mr.',
    firstName: 'John',
    lastName: 'Doe',
    title: 'MGR',
    titleDescription: 'Manager',
    effDate: '15-JUN-2020',
    termDate: null,
    sponsorName: 'Test Sponsor',
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser',
    auditKey: 1
  };

  const mockContactDetail: SponsorContactDetailModel = {
    sponsorId: 'SPONSOR123',
    contactId: 'CONTACT123',
    addressId: 'ADDR456',
    contactType: 'PRIMARY',
    contactTypeDescription: 'Primary Contact',
    salutation: 'MR',
    salutationDescription: 'Mr.',
    firstName: 'John',
    lastName: 'Doe',
    title: 'MGR',
    titleDescription: 'Manager',
    effDate: '15-JUN-2020',
    termDate: undefined,
    sponsorName: 'Test Sponsor',
    notes: [],
    address: {
      streetName: '123 Main St',
      zip: '10001',
      uspsId: 123,
      dAreaCode: '123',
      dPhoneNo: '4567890',
      hAreaCode: '765',
      hPhoneNo: '4321098',
      fAreaCode: '111',
      fPhoneNo: '1111222',
      email: 'john@example.com',
      webAddress: 'www.example.com'
    },
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser'
  };

  const mockZipCodeOptions: ZipCodeLookupItem[] = [
    { uspsId: 123, city: 'New York', state: 'NY', zip: '10001' },
    { uspsId: 124, city: 'Brooklyn', state: 'NY', zip: '10001' }
  ];

  beforeEach(() => {

    mockSponsorContactsService = jasmine.createSpyObj('MaintainSponsorContactsService', [
      'getContactDetail',
      'getZipCodes',
      'updateContact'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();

    mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));
    mockSponsorContactsService.getZipCodes.and.returnValue(of(mockZipCodeOptions));
      TestBed.configureTestingModule({
      imports: [ContactAddressComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        FormBuilder,
        { provide: MaintainSponsorContactsService, useValue: mockSponsorContactsService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockSponsorContactsService.getContactDetail.calls.reset();


      mockSponsorContactsService.getZipCodes.calls.reset();


      mockSponsorContactsService.updateContact.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));


      mockSponsorContactsService.getZipCodes.and.returnValue(of(mockZipCodeOptions));
    fixture = TestBed.createComponent(ContactAddressComponent);
    component = fixture.componentInstance;
    component.data = mockContactData;


    });

  describe('Component Initialization', () => {




    it('should load contact detail on init', () => {
      fixture.detectChanges();

      expect(mockSponsorContactsService.getContactDetail).toHaveBeenCalledWith('SPONSOR123', 'ADDR456');
    });

    it('should disable city field initially', () => {
      // Create a new component without pre-loaded data to check initial state
      const freshFixture = TestBed.createComponent(ContactAddressComponent);
      const freshComponent = freshFixture.componentInstance;
      freshComponent.data = { ...mockContactData, addressId: '' }; // No addressId so address won't load

      freshFixture.detectChanges();

      expect(freshComponent.form.get('city')?.disabled).toBeTrue();
    });
  });

  describe('Form Population', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should load city from zip code on population', () => {
      expect(mockSponsorContactsService.getZipCodes).toHaveBeenCalledWith('10001');
      expect(component.cityOptions).toEqual(mockZipCodeOptions);
      expect(component.form.get('city')?.value).toBe(123);
      expect(component.form.get('city')?.enabled).toBeTrue();
    });

    it('should mark form as pristine after population', () => {
      expect(component.form.pristine).toBeTrue();
    });

    it('should handle missing address data', () => {
      const detailWithoutAddress = {
        ...mockContactDetail,
        address: null
      } as any;
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithoutAddress));

      component.ngOnInit();

      expect(component.form.get('street')?.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark street as required', () => {
      component.form.patchValue({ street: '' });
      component.form.get('street')?.markAsTouched();

      expect(component.form.get('street')?.hasError('required')).toBeTrue();
      expect(component.getStreetError()).toBe('Street is required');
    });

    it('should mark zipCode as required', () => {
      component.form.patchValue({ zipCode: '' });
      component.form.get('zipCode')?.markAsTouched();

      expect(component.form.get('zipCode')?.hasError('required')).toBeTrue();
      expect(component.getZipCodeError()).toBe('Zip Code is required');
    });

    it('should mark city as required', () => {
      component.form.get('city')?.enable();
      component.form.patchValue({ city: '' });
      component.form.get('city')?.markAsTouched();

      expect(component.form.get('city')?.hasError('required')).toBeTrue();
      expect(component.getCityError()).toBe('City is required');
    });

    it('should show zipNotFound error', () => {
      component.form.get('zipCode')?.setErrors({ zipNotFound: true });
      component.form.get('zipCode')?.markAsTouched();

      expect(component.getZipCodeError()).toBe('Zip Code does not exist');
    });

    it('should enforce maxlength on street (50 chars)', () => {
      component.form.patchValue({ street: 'a'.repeat(60) });

      expect(component.form.get('street')?.hasError('maxlength')).toBeTrue();
    });


  });

  describe('allowOnlyNumbers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    function makeKeyEvent(key: string, extras: Partial<KeyboardEventInit> = {}): KeyboardEvent {
      return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extras });
    }

    it('should allow digit keys 0-9', () => {
      for (const digit of ['0', '1', '5', '9']) {
        const event = makeKeyEvent(digit);
        component.allowOnlyNumbers(event);
        expect(event.defaultPrevented).toBeFalse();
      }
    });

    it('should block non-digit printable characters', () => {
      for (const char of ['a', 'z', '-', '.', ' ', 'A', '@']) {
        const event = makeKeyEvent(char);
        component.allowOnlyNumbers(event);
        expect(event.defaultPrevented).toBeTrue();
      }
    });

    it('should allow navigation and control keys', () => {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
      for (const key of allowedKeys) {
        const event = makeKeyEvent(key);
        component.allowOnlyNumbers(event);
        expect(event.defaultPrevented).toBeFalse();
      }
    });

    it('should allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X', () => {
      for (const key of ['a', 'c', 'v', 'x']) {
        const event = makeKeyEvent(key, { ctrlKey: true });
        component.allowOnlyNumbers(event);
        expect(event.defaultPrevented).toBeFalse();
      }
    });

    it('should allow Meta+A, Meta+C, Meta+V, Meta+X', () => {
      for (const key of ['a', 'c', 'v', 'x']) {
        const event = makeKeyEvent(key, { metaKey: true });
        component.allowOnlyNumbers(event);
        expect(event.defaultPrevented).toBeFalse();
      }
    });
  });

  describe('Zip Code Change Handler', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call API when zip code reaches 5 characters', () => {
      mockSponsorContactsService.getZipCodes.calls.reset();

      component.form.patchValue({ zipCode: '12345' });
      component.onZipCodeChange();

      expect(mockSponsorContactsService.getZipCodes).toHaveBeenCalledWith('12345');
    });



    it('should populate city options on successful lookup', () => {
      component.form.patchValue({ zipCode: '12345' });
      component.onZipCodeChange();

      expect(component.cityOptions).toEqual(mockZipCodeOptions);
      expect(component.form.get('city')?.enabled).toBeTrue();
    });

    it('should set error when no cities found', () => {
      mockSponsorContactsService.getZipCodes.and.returnValue(of([]));

      component.form.patchValue({ zipCode: '99999' });
      component.onZipCodeChange();

      expect(component.form.get('zipCode')?.hasError('zipNotFound')).toBeTrue();
      expect(component.form.get('city')?.disabled).toBeTrue();
    });

    it('should handle zip code API error', () => {
      mockSponsorContactsService.getZipCodes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.form.patchValue({ zipCode: '12345' });
      component.onZipCodeChange();

      expect(component.cityOptions).toEqual([]);
      expect(component.form.get('zipCode')?.hasError('zipNotFound')).toBeTrue();
    });

    it('should clear previous zip error on successful lookup', () => {
      component.form.get('zipCode')?.setErrors({ zipNotFound: true });

      component.form.patchValue({ zipCode: '12345' });
      component.onZipCodeChange();

      expect(component.form.get('zipCode')?.hasError('zipNotFound')).toBeFalse();
    });

    it('should strip non-digit characters from pasted value', () => {
      mockSponsorContactsService.getZipCodes.calls.reset();

      component.form.get('zipCode')?.setValue('1a2b3', { emitEvent: false });
      component.onZipCodeChange();

      expect(component.form.get('zipCode')?.value).toBe('123');
      expect(mockSponsorContactsService.getZipCodes).not.toHaveBeenCalled();
    });

    it('should strip non-digits and call API when result is 5 digits', () => {
      mockSponsorContactsService.getZipCodes.calls.reset();

      component.form.get('zipCode')?.setValue('1a2b3c4d5', { emitEvent: false });
      component.onZipCodeChange();

      expect(component.form.get('zipCode')?.value).toBe('12345');
      expect(mockSponsorContactsService.getZipCodes).toHaveBeenCalledWith('12345');
    });

    it('should not mutate value when it is already all digits', () => {
      mockSponsorContactsService.getZipCodes.calls.reset();

      component.form.get('zipCode')?.setValue('10001', { emitEvent: false });
      component.onZipCodeChange();

      expect(component.form.get('zipCode')?.value).toBe('10001');
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no changes made', () => {
      (component as any).initialFormValue = component.form.getRawValue();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when initialFormValue is not set', () => {
      (component as any).initialFormValue = null;

      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form values differ from initial', () => {
      (component as any).initialFormValue = component.form.getRawValue();
      component.form.patchValue({ street: 'New Street' });
      component.form.get('city')?.enable();
      component.form.patchValue({ city: '123' });

      expect(component.isFormValid).toBeTrue();
    });


  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'Address updated successfully' })
      );
    });



    it('should submit valid form successfully', () => {
      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: '123'
      });
      component.form.get('city')?.enable();
      component.form.markAsDirty();

      spyOn(component.saveSuccess, 'emit');
      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });

    it('should include selected city uspsId in payload', () => {
      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: '123'
      });
      component.form.get('city')?.enable();
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      const payload = callArgs[3];
      expect(payload.address.uspsId).toBe('123');
    });





    it('should preserve existing address fields not in form', () => {
      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: '123'
      });
      component.form.get('city')?.enable();
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      const payload = callArgs[3];
      // Should preserve fields from contactDetail that aren't in the form
      expect(payload.address).toBeDefined();
    });
  });



  describe('Loading States', () => {




    it('should set isSaving to false after successful save', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'Success' })
      );

      fixture.detectChanges();

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: '123'
      });
      component.form.get('city')?.enable();
      component.form.markAsDirty();

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });

    it('should handle contact detail loading error', () => {
      mockSponsorContactsService.getContactDetail.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject on destroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
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

  describe('Error Message Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('getEmailError', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getEmailError()).toBe('');
      });

      it('should return pattern error message for invalid email', () => {
        component.form.patchValue({ email: 'invalid-email' });
        component.form.get('email')?.markAsTouched();

        expect(component.getEmailError()).toBe('Please enter a valid email address');
      });

      it('should return maxlength error message when email exceeds 128 chars', () => {
        const longEmail = 'a'.repeat(120) + '@test.com';
        component.form.patchValue({ email: longEmail });
        component.form.get('email')?.markAsTouched();

        expect(component.getEmailError()).toBe('Email can be maximum 128 characters');
      });

      it('should return empty string for valid email', () => {
        component.form.patchValue({ email: 'test@example.com' });
        component.form.get('email')?.markAsTouched();

        expect(component.getEmailError()).toBe('');
      });
    });

    describe('getWebsiteError', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getWebsiteError()).toBe('');
      });

      it('should return maxlength error for long website', () => {
        component.form.patchValue({ website: 'https://' + 'a'.repeat(50) + '.com' });
        component.form.get('website')?.markAsTouched();

        expect(component.getWebsiteError()).toBe('Website can be maximum 128 characters');
      });

      it('should return invalidUrl error for invalid URL', () => {
        component.form.patchValue({ website: 'not a url!!!' });
        component.form.get('website')?.markAsTouched();

        expect(component.getWebsiteError()).toBe('Please enter a valid website URL (e.g., www.example.com or https://example.com)');
      });

      it('should return empty string for valid URL', () => {
        component.form.patchValue({ website: 'www.example.com' });
        component.form.get('website')?.markAsTouched();

        expect(component.getWebsiteError()).toBe('');
      });
    });

    describe('getFaxError', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getFaxError()).toBe('');
      });

      it('should return invalidPhone error for incomplete fax', () => {
        component.form.patchValue({ fax: '(123) 456' });
        component.form.get('fax')?.markAsTouched();

        expect(component.getFaxError()).toBe('Please enter a complete Fax number (XXX) XXX-XXXX');
      });

      it('should return empty string for valid fax', () => {
        component.form.patchValue({ fax: '(123) 456-7890' });
        component.form.get('fax')?.markAsTouched();

        expect(component.getFaxError()).toBe('');
      });
    });

    describe('getWorkPhoneError', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getWorkPhoneError()).toBe('');
      });

      it('should return invalidPhone error for incomplete work phone', () => {
        component.form.patchValue({ workPhone: '(123) 456' });
        component.form.get('workPhone')?.markAsTouched();

        expect(component.getWorkPhoneError()).toBe('Please enter a complete Work Phone number (XXX) XXX-XXXX');
      });

      it('should return empty string for valid work phone', () => {
        component.form.patchValue({ workPhone: '(123) 456-7890' });
        component.form.get('workPhone')?.markAsTouched();

        expect(component.getWorkPhoneError()).toBe('');
      });
    });

    describe('getHomePhoneError', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getHomePhoneError()).toBe('');
      });

      it('should return invalidPhone error for incomplete home phone', () => {
        component.form.patchValue({ homePhone: '(123) 456' });
        component.form.get('homePhone')?.markAsTouched();

        expect(component.getHomePhoneError()).toBe('Please enter a complete Home Phone number (XXX) XXX-XXXX');
      });

      it('should return empty string for valid home phone', () => {
        component.form.patchValue({ homePhone: '(123) 456-7890' });
        component.form.get('homePhone')?.markAsTouched();

        expect(component.getHomePhoneError()).toBe('');
      });
    });

    describe('getStreetError - untouched', () => {
      it('should return empty string when control is not touched', () => {
        component.form.patchValue({ street: '' });
        // Don't mark as touched
        expect(component.getStreetError()).toBe('');
      });
    });

    describe('getCityError - untouched', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getCityError()).toBe('');
      });
    });

    describe('getZipCodeError - untouched', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getZipCodeError()).toBe('');
      });
    });
  });

  describe('formatPhoneNumber', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    function createInputEvent(value: string, selStart: number = 0): { event: Event; input: HTMLInputElement } {
      const input = document.createElement('input');
      input.value = value;
      Object.defineProperty(input, 'selectionStart', { value: selStart, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: selStart, writable: true });
      spyOn(input, 'setSelectionRange');
      const event = { target: input } as unknown as Event;
      return { event, input };
    }

    it('should format digits into phone format for workPhone', () => {
      const { event, input } = createInputEvent('1234567890', 10);

      component.formatPhoneNumber(event, 'workPhone');

      expect(input.value).toBe('(123) 456-7890');
      expect(component.form.get('workPhone')?.value).toBe('(123) 456-7890');
    });

    it('should format partial digits', () => {
      const { event, input } = createInputEvent('123', 3);

      component.formatPhoneNumber(event, 'homePhone');

      expect(input.value).toBe('(123) ');
    });

    it('should format less than 3 digits', () => {
      const { event, input } = createInputEvent('12', 2);

      component.formatPhoneNumber(event, 'fax');

      expect(input.value).toBe('(12');
    });

    it('should handle empty input', () => {
      const { event, input } = createInputEvent('', 0);

      component.formatPhoneNumber(event, 'workPhone');

      expect(input.value).toBe('');
    });

    it('should truncate to 10 digits maximum', () => {
      const { event, input } = createInputEvent('12345678901234', 14);

      component.formatPhoneNumber(event, 'workPhone');

      expect(input.value).toBe('(123) 456-7890');
    });

    it('should mark control as touched', () => {
      const { event } = createInputEvent('1234567890', 10);

      component.formatPhoneNumber(event, 'workPhone');

      expect(component.form.get('workPhone')?.touched).toBeTrue();
    });
  });

  describe('onZipCodeKeydown', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    function makeKeyEvent(key: string, extras: Partial<KeyboardEventInit> = {}): KeyboardEvent {
      return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extras });
    }

    it('should prevent non-numeric, non-control keys', () => {
      const event = makeKeyEvent('a');
      component.onZipCodeKeydown(event);
      expect(event.defaultPrevented).toBeTrue();
    });

    it('should allow digit keys', () => {
      const event = makeKeyEvent('5');
      component.onZipCodeKeydown(event);
      expect(event.defaultPrevented).toBeFalse();
    });

    it('should allow Backspace key', () => {
      const event = makeKeyEvent('Backspace');
      component.onZipCodeKeydown(event);
      expect(event.defaultPrevented).toBeFalse();
    });

    it('should allow Ctrl+c', () => {
      const event = makeKeyEvent('c', { ctrlKey: true });
      component.onZipCodeKeydown(event);
      expect(event.defaultPrevented).toBeFalse();
    });

    it('should allow Meta+v', () => {
      const event = makeKeyEvent('v', { metaKey: true });
      component.onZipCodeKeydown(event);
      expect(event.defaultPrevented).toBeFalse();
    });

    it('should prevent Tab when zipCode has errors', () => {
      component.form.get('zipCode')?.setErrors({ required: true });
      const event = makeKeyEvent('Tab');

      component.onZipCodeKeydown(event);

      expect(event.defaultPrevented).toBeTrue();
      expect(component.form.get('zipCode')?.touched).toBeTrue();
    });

    it('should prevent Tab and set shouldFocusCityAfterLoad when lookup in progress', () => {
      component.form.patchValue({ zipCode: '12345' });
      component.form.get('zipCode')?.setErrors(null);
      component.form.get('city')?.disable();
      (component as any).zipCodeLookupInProgress = true;

      const event = makeKeyEvent('Tab');
      component.onZipCodeKeydown(event);

      expect(event.defaultPrevented).toBeTrue();
      expect((component as any).shouldFocusCityAfterLoad).toBeTrue();
    });

    it('should allow Tab when city is enabled and no lookup in progress', () => {
      component.form.patchValue({ zipCode: '12345' });
      component.form.get('zipCode')?.setErrors(null);
      component.form.get('city')?.enable();
      (component as any).zipCodeLookupInProgress = false;

      const event = makeKeyEvent('Tab');
      component.onZipCodeKeydown(event);

      expect(event.defaultPrevented).toBeFalse();
    });

    it('should allow Shift+Tab without preventing default', () => {
      component.form.patchValue({ zipCode: '12345' });
      component.form.get('zipCode')?.setErrors(null);

      const event = makeKeyEvent('Tab', { shiftKey: true });
      component.onZipCodeKeydown(event);

      expect(event.defaultPrevented).toBeFalse();
    });
  });

  describe('onZipCodeChange - additional branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset city and clear options on change', () => {
      component.form.get('city')?.enable();
      component.form.patchValue({ city: 123 });
      (component as any).cityOptions = mockZipCodeOptions;

      component.form.patchValue({ zipCode: '123' });
      component.onZipCodeChange();

      expect(component.form.get('city')?.value).toBeNull();
      expect(component.form.get('city')?.disabled).toBeTrue();
      expect(component.cityOptions).toEqual([]);
    });

    it('should clear errors when zip code has 1-4 digits', () => {
      component.form.get('zipCode')?.setErrors({ zipNotFound: true });

      component.form.patchValue({ zipCode: '123' });
      component.onZipCodeChange();

      expect(component.form.get('zipCode')?.errors).toBeNull();
    });

    it('should not clear errors when zip code is empty', () => {
      component.form.patchValue({ zipCode: '' });
      component.onZipCodeChange();

      // With empty value, required validator is in play
      expect(component.form.get('zipCode')?.hasError('required')).toBeTrue();
    });

    it('should auto-select city when only one option returned', () => {
      const singleOption: ZipCodeLookupItem[] = [
        { uspsId: 999, city: 'Solo City', state: 'SC', zip: '55555' }
      ];
      mockSponsorContactsService.getZipCodes.and.returnValue(of(singleOption));

      component.form.patchValue({ zipCode: '55555' });
      component.onZipCodeChange();

      expect(component.form.get('city')?.value).toBe(999);
    });
  });

  describe('preventLeadingSpace', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent space at start of empty input', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: input });

      component.preventLeadingSpace(event, 'street');

      expect(event.defaultPrevented).toBeTrue();
    });

    it('should prevent space when input only contains spaces', () => {
      const input = document.createElement('input');
      input.value = '   ';
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: input });

      component.preventLeadingSpace(event, 'street');

      expect(event.defaultPrevented).toBeTrue();
    });

    it('should allow space when input has non-space content', () => {
      const input = document.createElement('input');
      input.value = 'Hello';
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: input });

      component.preventLeadingSpace(event, 'street');

      expect(event.defaultPrevented).toBeFalse();
    });

    it('should allow non-space keys on empty input', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: input });

      component.preventLeadingSpace(event, 'street');

      expect(event.defaultPrevented).toBeFalse();
    });
  });

  describe('trimLeadingSpace', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trim leading spaces from input value', () => {
      const input = document.createElement('input');
      input.value = '  Hello';
      const event = { target: input } as unknown as Event;

      component.trimLeadingSpace(event, 'street');

      expect(input.value).toBe('Hello');
      expect(component.form.get('street')?.value).toBe('Hello');
    });

    it('should not modify input that does not start with space', () => {
      const input = document.createElement('input');
      input.value = 'Hello World';
      const event = { target: input } as unknown as Event;

      component.trimLeadingSpace(event, 'street');

      expect(input.value).toBe('Hello World');
    });

    it('should handle empty input', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as unknown as Event;

      component.trimLeadingSpace(event, 'street');

      expect(input.value).toBe('');
    });
  });

  describe('onPaste', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trim leading spaces from pasted text', () => {
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 0, writable: true });
      spyOn(input, 'setSelectionRange');

      const clipboardData = { getData: jasmine.createSpy('getData').and.returnValue('  Pasted Text') };
      const event = {
        target: input,
        clipboardData,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as ClipboardEvent;

      component.onPaste(event, 'street');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('street')?.value).toBe('Pasted Text');
    });

    it('should insert pasted text at cursor position', () => {
      const input = document.createElement('input');
      input.value = 'Hello World';
      Object.defineProperty(input, 'selectionStart', { value: 5, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 5, writable: true });
      spyOn(input, 'setSelectionRange');

      const clipboardData = { getData: jasmine.createSpy('getData').and.returnValue('XYZ') };
      const event = {
        target: input,
        clipboardData,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as ClipboardEvent;

      component.onPaste(event, 'street');

      expect(component.form.get('street')?.value).toBe('HelloXYZ World');
    });

    it('should replace selected text with pasted content', () => {
      const input = document.createElement('input');
      input.value = 'Hello World';
      Object.defineProperty(input, 'selectionStart', { value: 6, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 11, writable: true });
      spyOn(input, 'setSelectionRange');

      const clipboardData = { getData: jasmine.createSpy('getData').and.returnValue('Universe') };
      const event = {
        target: input,
        clipboardData,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as ClipboardEvent;

      component.onPaste(event, 'street');

      expect(component.form.get('street')?.value).toBe('Hello Universe');
    });

    it('should handle null clipboard data', () => {
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 0, writable: true });
      spyOn(input, 'setSelectionRange');

      const event = {
        target: input,
        clipboardData: null,
        preventDefault: jasmine.createSpy('preventDefault')
      } as unknown as ClipboardEvent;

      component.onPaste(event, 'street');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('street')?.value).toBe('');
    });
  });

  describe('toUpperCaseAndTrim', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should convert input to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'hello';
      Object.defineProperty(input, 'selectionStart', { value: 5, writable: true });
      spyOn(input, 'setSelectionRange');
      const event = { target: input } as unknown as Event;

      component.toUpperCaseAndTrim(event, 'street');

      expect(input.value).toBe('HELLO');
      expect(component.form.get('street')?.value).toBe('HELLO');
    });

    it('should trim leading spaces and convert to uppercase', () => {
      const input = document.createElement('input');
      input.value = '  hello';
      Object.defineProperty(input, 'selectionStart', { value: 7, writable: true });
      spyOn(input, 'setSelectionRange');
      const event = { target: input } as unknown as Event;

      component.toUpperCaseAndTrim(event, 'street');

      expect(input.value).toBe('HELLO');
      expect(component.form.get('street')?.touched).toBeTrue();
    });

    it('should not modify already uppercase, trimmed value', () => {
      const input = document.createElement('input');
      input.value = 'HELLO';
      Object.defineProperty(input, 'selectionStart', { value: 5, writable: true });
      spyOn(input, 'setSelectionRange');
      const event = { target: input } as unknown as Event;

      component.toUpperCaseAndTrim(event, 'street');

      // No changes needed so setSelectionRange should not be called
      expect(input.setSelectionRange).not.toHaveBeenCalled();
    });
  });

  describe('onNumericKeyPress', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow numeric characters (48-57)', () => {
      for (let charCode = 48; charCode <= 57; charCode++) {
        const event = { which: charCode, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
        component.onNumericKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should block non-numeric printable characters', () => {
      const event = { which: 65, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow backspace (8)', () => {
      const event = { which: 8, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow delete (46)', () => {
      const event = { which: 46, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow tab (9)', () => {
      const event = { which: 9, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow escape (27)', () => {
      const event = { which: 27, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow enter (13)', () => {
      const event = { which: 13, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+A (65 with ctrlKey)', () => {
      const event = { which: 65, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C (67 with ctrlKey)', () => {
      const event = { which: 67, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+V (86 with ctrlKey)', () => {
      const event = { which: 86, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+X (88 with ctrlKey)', () => {
      const event = { which: 88, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should use keyCode when which is 0', () => {
      const event = { which: 0, keyCode: 65, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('filteredCityOptions computed signal', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all options when search is empty', () => {
      (component as any).cityOptionsSignal.set(mockZipCodeOptions);
      (component as any).citySearch.set('');

      const result = component.filteredCityOptions();

      expect(result).toEqual(mockZipCodeOptions);
    });

    it('should filter by city name', () => {
      (component as any).cityOptionsSignal.set(mockZipCodeOptions);
      (component as any).citySearch.set('new york');

      const result = component.filteredCityOptions();

      expect(result.length).toBe(1);
      expect(result[0].city).toBe('New York');
    });

    it('should filter by uspsId', () => {
      (component as any).cityOptionsSignal.set(mockZipCodeOptions);
      (component as any).citySearch.set('124');

      const result = component.filteredCityOptions();

      expect(result.length).toBe(1);
      expect(result[0].city).toBe('Brooklyn');
    });

    it('should return empty array when no matches', () => {
      (component as any).cityOptionsSignal.set(mockZipCodeOptions);
      (component as any).citySearch.set('xyz');

      const result = component.filteredCityOptions();

      expect(result.length).toBe(0);
    });
  });

  describe('URL Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should accept valid URLs', () => {
      const validUrls = [
        'www.example.com',
        'https://example.com',
        'http://www.example.com',
        'https://example.com/path?query=value'
      ];
      for (const url of validUrls) {
        component.form.patchValue({ website: url });
        expect(component.form.get('website')?.hasError('invalidUrl')).toBeFalse();
      }
    });

    it('should reject invalid URLs', () => {
      component.form.patchValue({ website: '!!!invalid!!!' });
      expect(component.form.get('website')?.hasError('invalidUrl')).toBeTrue();
    });

    it('should allow empty website (optional field)', () => {
      component.form.patchValue({ website: '' });
      expect(component.form.get('website')?.hasError('invalidUrl')).toBeFalse();
    });

    it('should allow whitespace-only website (optional field)', () => {
      component.form.patchValue({ website: '   ' });
      expect(component.form.get('website')?.hasError('invalidUrl')).toBeFalse();
    });
  });

  describe('Phone Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should accept complete 10-digit phone', () => {
      component.form.patchValue({ workPhone: '(123) 456-7890' });
      expect(component.form.get('workPhone')?.hasError('invalidPhone')).toBeFalse();
    });

    it('should reject partial phone number', () => {
      component.form.patchValue({ workPhone: '(123) 456' });
      expect(component.form.get('workPhone')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should allow empty phone (optional field)', () => {
      component.form.patchValue({ workPhone: '' });
      expect(component.form.get('workPhone')?.hasError('invalidPhone')).toBeFalse();
    });

    it('should allow whitespace-only phone (optional field)', () => {
      component.form.patchValue({ workPhone: '   ' });
      expect(component.form.get('workPhone')?.hasError('invalidPhone')).toBeFalse();
    });
  });

  describe('International Address', () => {
    it('should detect international address when intlAddress1 is populated', () => {
      const detailWithIntl = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          intlAddress1: '123 International St'
        }
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithIntl));

      fixture.detectChanges();

      expect(component.hasInternationalAddress).toBeTrue();
    });

    it('should detect international address when countryName is populated', () => {
      const detailWithIntl = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          countryName: 'Canada'
        }
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithIntl));

      fixture.detectChanges();

      expect(component.hasInternationalAddress).toBeTrue();
    });

    it('should detect international address when intlPostalCode is populated', () => {
      const detailWithIntl = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          intlPostalCode: 'A1B 2C3'
        }
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithIntl));

      fixture.detectChanges();

      expect(component.hasInternationalAddress).toBeTrue();
    });

    it('should not detect international address when all intl fields are empty', () => {
      fixture.detectChanges();

      expect(component.hasInternationalAddress).toBeFalse();
    });

    it('should not detect international address when intl fields are whitespace only', () => {
      const detailWithWhitespace = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          intlAddress1: '   ',
          intlAddress2: '  ',
          countryName: ' '
        }
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithWhitespace));

      fixture.detectChanges();

      expect(component.hasInternationalAddress).toBeFalse();
    });

    it('should return false for null address in international check', () => {
      const result = (component as any).checkHasInternationalAddress(null);
      expect(result).toBeFalse();
    });

    it('should disable regular address fields when international address exists', () => {
      const detailWithIntl = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          intlAddress1: '123 International St'
        }
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithIntl));

      fixture.detectChanges();

      expect(component.form.get('street')?.disabled).toBeTrue();
      expect(component.form.get('zipCode')?.disabled).toBeTrue();
      expect(component.form.get('city')?.disabled).toBeTrue();
      expect(component.form.get('workPhone')?.disabled).toBeTrue();
      expect(component.form.get('homePhone')?.disabled).toBeTrue();
      expect(component.form.get('fax')?.disabled).toBeTrue();
      expect(component.form.get('website')?.disabled).toBeTrue();
      expect(component.form.get('email')?.disabled).toBeTrue();
    });
  });

  describe('loadAddress edge cases', () => {
    it('should set isLoading false when data has no sponsorId', () => {
      component.data = { ...mockContactData, sponsorId: '' };
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(mockSponsorContactsService.getContactDetail).not.toHaveBeenCalled();
    });

    it('should set isLoading false when data has no addressId', () => {
      component.data = { ...mockContactData, addressId: '' };
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(mockSponsorContactsService.getContactDetail).not.toHaveBeenCalled();
    });

    it('should set isLoading false when data is null', () => {
      component.data = null;
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
    });

    it('should handle address with no zip code', () => {
      const detailNoZip = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          zip: null
        }
      } as any;
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailNoZip));
      mockSponsorContactsService.getZipCodes.calls.reset();

      fixture.detectChanges();

      expect(mockSponsorContactsService.getZipCodes).not.toHaveBeenCalled();
      expect((component as any).initialFormValue).not.toBeNull();
    });

    it('should trim leading spaces from address fields during population', () => {
      const detailWithSpaces = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          streetName: '  123 Main St',
          email: '  john@example.com',
          webAddress: '  www.example.com',
          zip: '  10001'
        }
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithSpaces));

      fixture.detectChanges();

      expect(component.form.get('street')?.value).toBe('123 Main St');
      expect(component.form.get('email')?.value).toBe('john@example.com');
      expect(component.form.get('website')?.value).toBe('www.example.com');
    });
  });

  describe('loadCityFromZip edge cases', () => {
    it('should handle zip code lookup error during load', () => {
      const detailWithZip = { ...mockContactDetail };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithZip));
      mockSponsorContactsService.getZipCodes.and.returnValue(
        throwError(() => new Error('Zip lookup failed'))
      );

      fixture.detectChanges();

      expect(component.cityOptions).toEqual([]);
      expect(component.form.pristine).toBeTrue();
      expect((component as any).initialFormValue).not.toBeNull();
    });

    it('should not select city when uspsId does not match any option', () => {
      const detailWithMismatch = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          uspsId: 999
        }
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithMismatch));

      fixture.detectChanges();

      // City should not be set to 999 since no matching option
      const cityValue = component.form.get('city')?.value;
      expect(cityValue).not.toBe(999);
    });

    it('should not set city when uspsId is not provided', () => {
      const detailNoUspsId = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          uspsId: undefined
        }
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailNoUspsId));

      fixture.detectChanges();

      // City should be enabled but not set
      expect(component.form.get('city')?.enabled).toBeTrue();
    });
  });

  describe('onSave - additional scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit when form is invalid', () => {
      component.form.patchValue({ street: '' });
      component.form.get('street')?.markAsTouched();

      component.onSave();

      expect(mockSponsorContactsService.updateContact).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched when form is invalid', () => {
      component.form.patchValue({ street: '' });

      component.onSave();

      expect(component.form.get('street')?.touched).toBeTrue();
      expect(component.form.get('zipCode')?.touched).toBeTrue();
    });

    it('should set isSaving true during save', () => {
      let savingDuringCall = false;
      mockSponsorContactsService.updateContact.and.callFake((..._args: any[]) => {
        savingDuringCall = component.isSaving;
        return of({ message: 'Success' });
      });

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      expect(savingDuringCall).toBeTrue();
      expect(component.isSaving).toBeFalse();
    });

    it('should show success snackbar with salutation when present', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      (component as any).contactDetail = {
        ...mockContactDetail,
        salutation: 'MR',
        lastName: 'Smith'
      };

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Contact detail of MR Smith has been updated successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should show success snackbar without salutation when not present', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      (component as any).contactDetail = {
        ...mockContactDetail,
        salutation: null,
        lastName: 'Smith'
      };

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Contact detail of Smith has been updated successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should handle save error with error response', () => {
      const errorObj = {
        error: {
          errorResponse: {
            error: 'Contact not found',
            errorCode: 'ERR001'
          }
        }
      };
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => errorObj)
      );
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      expect(component.isSaving).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error: ERR001: Contact not found',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should handle save error with error.message', () => {
      const errorObj = {
        error: {
          message: 'Server error'
        }
      };
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => errorObj)
      );
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Server error',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should handle save error with generic message', () => {
      const errorObj = {
        message: 'Network error'
      };
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => errorObj)
      );
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Network error',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should fallback to default error message', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => ({}))
      );
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'An unexpected error occurred',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should split phone numbers correctly in save payload', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123,
        workPhone: '(555) 123-4567',
        homePhone: '(555) 987-6543',
        fax: '(555) 111-2222'
      });
      component.form.get('city')?.enable();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.address.dAreaCode).toBe('555');
      expect(payload.address.dPhoneNo).toBe('1234567');
      expect(payload.address.hAreaCode).toBe('555');
      expect(payload.address.hPhoneNo).toBe('9876543');
      expect(payload.address.fAreaCode).toBe('555');
      expect(payload.address.fPhoneNo).toBe('1112222');
    });

    it('should handle empty phone numbers in save payload', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123,
        workPhone: '',
        homePhone: '',
        fax: ''
      });
      component.form.get('city')?.enable();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.address.dAreaCode).toBeNull();
      expect(payload.address.dPhoneNo).toBeNull();
      expect(payload.address.hAreaCode).toBeNull();
      expect(payload.address.hPhoneNo).toBeNull();
    });

    it('should use contactDetail sponsorId when available', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      (component as any).contactDetail = { ...mockContactDetail, sponsorId: 'DETAIL_SPONSOR' };

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      expect(callArgs[0]).toBe('DETAIL_SPONSOR');
    });

    it('should pass chapterId from headerService', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      mockHeaderService.getCurrentChapterId.and.returnValue('CHAPTER_XYZ');

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      expect(callArgs[2]).toBe('CHAPTER_XYZ');
    });

    it('should emit saveSuccess on successful save', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });

    it('should trim and trimStart street in payload', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));

      component.form.patchValue({
        street: '  456 Elm St  ',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.address.streetName).toBe('456 Elm St');
    });
  });

  describe('getErrorMessage - private method via onSave', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle error with errorCode in errorResponse', () => {
      const errorObj = {
        error: {
          errorResponse: {
            error: 'Something went wrong',
            errorCode: 'E500'
          }
        }
      };
      const result = (component as any).getErrorMessage(errorObj);
      expect(result).toBe('Error: E500: Something went wrong');
    });

    it('should handle error with errorCode at top level', () => {
      const errorObj = {
        error: {
          message: 'Bad request',
          errorCode: 'E400'
        }
      };
      const result = (component as any).getErrorMessage(errorObj);
      expect(result).toBe('Error: E400: Bad request');
    });

    it('should return default message for null error', () => {
      const result = (component as any).getErrorMessage(null);
      expect(result).toBe('An unexpected error occurred');
    });

    it('should return default message for undefined error', () => {
      const result = (component as any).getErrorMessage(undefined);
      expect(result).toBe('An unexpected error occurred');
    });
  });

  describe('combinePhoneNumber - private method via loadAddress', () => {
    it('should combine area code and phone number', () => {
      const result = (component as any).combinePhoneNumber('123', '4567890');
      expect(result).toBe('(123) 456-7890');
    });

    it('should return empty string when both are null', () => {
      const result = (component as any).combinePhoneNumber(null, null);
      expect(result).toBe('');
    });

    it('should return empty string when both are undefined', () => {
      const result = (component as any).combinePhoneNumber(undefined, undefined);
      expect(result).toBe('');
    });

    it('should handle area code only', () => {
      const result = (component as any).combinePhoneNumber('123', null);
      expect(result).toBe('(123) ');
    });

    it('should handle phone number only', () => {
      const result = (component as any).combinePhoneNumber(null, '4567890');
      expect(result).toBe('(456) 789-0');
    });

    it('should trim whitespace from parts', () => {
      const result = (component as any).combinePhoneNumber('  123  ', '  4567890  ');
      expect(result).toBe('(123) 456-7890');
    });
  });

  describe('splitPhoneNumber - private method', () => {
    it('should split formatted phone into area code and phone number', () => {
      const result = (component as any).splitPhoneNumber('(123) 456-7890');
      expect(result).toEqual({ areaCode: '123', phoneNo: '4567890' });
    });

    it('should handle empty string', () => {
      const result = (component as any).splitPhoneNumber('');
      expect(result).toEqual({ areaCode: '', phoneNo: '' });
    });

    it('should handle null/undefined', () => {
      const result = (component as any).splitPhoneNumber(null);
      expect(result).toEqual({ areaCode: '', phoneNo: '' });
    });
  });

  describe('buildPhoneFormat - private method', () => {
    it('should format 10 digits into full phone format', () => {
      const result = (component as any).buildPhoneFormat('1234567890');
      expect(result).toBe('(123) 456-7890');
    });

    it('should format less than 3 digits', () => {
      const result = (component as any).buildPhoneFormat('12');
      expect(result).toBe('(12');
    });

    it('should format exactly 3 digits', () => {
      const result = (component as any).buildPhoneFormat('123');
      expect(result).toBe('(123) ');
    });

    it('should format 4-6 digits', () => {
      const result = (component as any).buildPhoneFormat('12345');
      expect(result).toBe('(123) 45');
    });

    it('should format 6+ digits with dash', () => {
      const result = (component as any).buildPhoneFormat('123456');
      expect(result).toBe('(123) 456-');
    });

    it('should return empty string for empty input', () => {
      const result = (component as any).buildPhoneFormat('');
      expect(result).toBe('');
    });

    it('should return empty string for null input', () => {
      const result = (component as any).buildPhoneFormat(null);
      expect(result).toBe('');
    });
  });

  describe('getPhoneCursorPos - private method', () => {
    it('should return 0 for digitIndex 0', () => {
      expect((component as any).getPhoneCursorPos(0)).toBe(0);
    });

    it('should add 1 for digits 1-3 (after opening paren)', () => {
      expect((component as any).getPhoneCursorPos(1)).toBe(2);
      expect((component as any).getPhoneCursorPos(2)).toBe(3);
      expect((component as any).getPhoneCursorPos(3)).toBe(4);
    });

    it('should add 3 for digits 4-6 (after close paren and space)', () => {
      expect((component as any).getPhoneCursorPos(4)).toBe(7);
      expect((component as any).getPhoneCursorPos(5)).toBe(8);
      expect((component as any).getPhoneCursorPos(6)).toBe(9);
    });

    it('should add 4 for digits 7+ (after dash)', () => {
      expect((component as any).getPhoneCursorPos(7)).toBe(11);
      expect((component as any).getPhoneCursorPos(10)).toBe(14);
    });
  });

  describe('isFormValid - additional branches', () => {
    it('should return false when form is undefined', () => {
      (component as any).form = undefined;
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when form is valid but no changes made', () => {
      fixture.detectChanges();
      (component as any).initialFormValue = component.form.getRawValue();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when changes made but form is invalid', () => {
      fixture.detectChanges();
      (component as any).initialFormValue = component.form.getRawValue();
      component.form.patchValue({ street: '' }); // required field empty

      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('citySearchControl valueChanges subscription', () => {
    it('should update citySearch signal when citySearchControl value changes', () => {
      fixture.detectChanges();

      component.citySearchControl.setValue('new york');

      expect((component as any).citySearch()).toBe('new york');
    });

    it('should set empty string when citySearchControl value is null', () => {
      fixture.detectChanges();

      component.citySearchControl.setValue(null);

      expect((component as any).citySearch()).toBe('');
    });
  });

  describe('setupZipCodeLookup - focus behavior', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should focus city select when shouldFocusCityAfterLoad is true and data loads', () => {
      const mockCitySelect = jasmine.createSpyObj('MatSelect', ['focus']);
      (component as any).citySelect = mockCitySelect;
      (component as any).shouldFocusCityAfterLoad = true;

      mockSponsorContactsService.getZipCodes.and.returnValue(of(mockZipCodeOptions));

      component.form.patchValue({ zipCode: '12345' });
      component.onZipCodeChange();

      // shouldFocusCityAfterLoad should be reset to false
      expect((component as any).shouldFocusCityAfterLoad).toBeFalse();
    });

    it('should reset shouldFocusCityAfterLoad when no cities found', () => {
      (component as any).shouldFocusCityAfterLoad = true;
      mockSponsorContactsService.getZipCodes.and.returnValue(of([]));

      component.form.patchValue({ zipCode: '99999' });
      component.onZipCodeChange();

      expect((component as any).shouldFocusCityAfterLoad).toBeFalse();
    });
  });

  describe('Form population - phone number combining', () => {
    it('should combine phone numbers correctly during load', () => {
      fixture.detectChanges();

      expect(component.form.get('workPhone')?.value).toBe('(123) 456-7890');
      expect(component.form.get('homePhone')?.value).toBe('(765) 432-1098');
      expect(component.form.get('fax')?.value).toBe('(111) 111-1222');
    });

    it('should handle missing phone fields during load', () => {
      const detailNoPhone = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          dAreaCode: null,
          dPhoneNo: null,
          hAreaCode: null,
          hPhoneNo: null,
          fAreaCode: null,
          fPhoneNo: null
        }
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailNoPhone));

      fixture.detectChanges();

      expect(component.form.get('workPhone')?.value).toBe('');
      expect(component.form.get('homePhone')?.value).toBe('');
      expect(component.form.get('fax')?.value).toBe('');
    });
  });

  describe('onSave - payload structure', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
    });

    it('should include intlAddrFlag N in payload', () => {
      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.address.intlAddrFlag).toBe('N');
      expect(payload.address.intlAddress1).toBeNull();
      expect(payload.address.intlAddress2).toBeNull();
    });

    it('should include contact detail fields in payload', () => {
      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.contactType).toBe('PRIMARY');
      expect(payload.lastName).toBe('Doe');
      expect(payload.effDate).toBe('15-JUN-2020');
    });

    it('should handle null contactDetail gracefully', () => {
      (component as any).contactDetail = null;

      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123
      });
      component.form.get('city')?.enable();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.address).toBeDefined();
    });

    it('should set email and website to null when empty in payload', () => {
      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123,
        email: '',
        website: ''
      });
      component.form.get('city')?.enable();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.address.email).toBeNull();
      expect(payload.address.webAddress).toBeNull();
    });

    it('should pass valid email and website in payload', () => {
      component.form.patchValue({
        street: '456 Elm St',
        zipCode: '12345',
        city: 123,
        email: 'test@example.com',
        website: 'www.test.com'
      });
      component.form.get('city')?.enable();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.address.email).toBe('test@example.com');
      expect(payload.address.webAddress).toBe('www.test.com');
    });
  });
});
