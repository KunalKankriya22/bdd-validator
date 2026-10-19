import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';

import { DriveLocationInternationalAddressComponent } from './international-address';
import { MaintainDriveLocationService } from '../services/maintain-drive-location.service';

describe('DriveLocationInternationalAddressComponent', () => {
  let component: DriveLocationInternationalAddressComponent;
  let fixture: ComponentFixture<DriveLocationInternationalAddressComponent>;
  let mockDriveLocationService: jasmine.SpyObj<MaintainDriveLocationService>;

  beforeEach(() => {

    mockDriveLocationService = jasmine.createSpyObj('MaintainDriveLocationService', [
      'getCountries'
    ]);

    // Mock getCountries to return test data
    mockDriveLocationService.getCountries.and.returnValue(of([
      { code: 'CA', description: 'Canada' },
      { code: 'MX', description: 'Mexico' },
      { code: 'UK', description: 'United Kingdom' }
    ]));



      TestBed.configureTestingModule({
      imports: [
        DriveLocationInternationalAddressComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MaintainDriveLocationService, useValue: mockDriveLocationService },
        provideHttpClient()
      ]
    });




      mockDriveLocationService.getCountries.calls.reset();


    fixture = TestBed.createComponent(DriveLocationInternationalAddressComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should load countries on init', () => {
      component.ngOnInit();

      expect(component.countryOptions).toBeDefined();
      expect(component.countryOptions.length).toBeGreaterThan(0);
    });


  });

  describe('Form Setup and Required Fields', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should require address1', () => {
      const control = component.form.get('address1');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();

      control?.setValue('123 Main St');
      expect(control?.hasError('required')).toBeFalse();
    });

    it('should require country', () => {
      const control = component.form.get('country');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();

      control?.setValue('CA');
      expect(control?.hasError('required')).toBeFalse();
    });

    it('should not require address2, address3, address4', () => {
      expect(component.form.get('address2')?.hasError('required')).toBeFalse();
      expect(component.form.get('address3')?.hasError('required')).toBeFalse();
      expect(component.form.get('address4')?.hasError('required')).toBeFalse();
    });

    it('should not require postalCode, email, or phone fields', () => {
      expect(component.form.get('postalCode')?.hasError('required')).toBeFalse();
      expect(component.form.get('email')?.hasError('required')).toBeFalse();
      expect(component.form.get('workPhone')?.hasError('required')).toBeFalse();
      expect(component.form.get('homePhone')?.hasError('required')).toBeFalse();
      expect(component.form.get('mobilePhone')?.hasError('required')).toBeFalse();
      expect(component.form.get('fax')?.hasError('required')).toBeFalse();
      expect(component.form.get('extension')?.hasError('required')).toBeFalse();
    });
  });

  describe('Form Validation - Maxlength', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should enforce maxlength of 50 on address1', () => {
      const control = component.form.get('address1');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBeTrue();

      control?.setValue('a'.repeat(50));
      expect(control?.hasError('maxlength')).toBeFalse();
    });

    it('should enforce maxlength of 50 on address2', () => {
      const control = component.form.get('address2');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength of 50 on address3', () => {
      const control = component.form.get('address3');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength of 50 on address4', () => {
      const control = component.form.get('address4');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength of 50 on country', () => {
      const control = component.form.get('country');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength of 15 on postalCode', () => {
      const control = component.form.get('postalCode');
      control?.setValue('a'.repeat(16));
      expect(control?.hasError('maxlength')).toBeTrue();

      control?.setValue('a'.repeat(15));
      expect(control?.hasError('maxlength')).toBeFalse();
    });

    it('should enforce maxlength of 8 on extension', () => {
      const control = component.form.get('extension');
      control?.setValue('123456789');
      expect(control?.hasError('maxlength')).toBeTrue();

      control?.setValue('12345678');
      expect(control?.hasError('maxlength')).toBeFalse();
    });

    it('should enforce maxlength of 20 on workPhone', () => {
      const control = component.form.get('workPhone');
      control?.setValue('1'.repeat(21));
      expect(control?.hasError('maxlength')).toBeTrue();

      control?.setValue('1'.repeat(20));
      expect(control?.hasError('maxlength')).toBeFalse();
    });

    it('should enforce maxlength of 20 on homePhone', () => {
      const control = component.form.get('homePhone');
      control?.setValue('1'.repeat(21));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength of 20 on mobilePhone', () => {
      const control = component.form.get('mobilePhone');
      control?.setValue('1'.repeat(21));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength of 20 on fax', () => {
      const control = component.form.get('fax');
      control?.setValue('1'.repeat(21));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength of 128 on email', () => {
      const control = component.form.get('email');
      const longEmail = 'a'.repeat(120) + '@test.com';
      control?.setValue(longEmail);
      expect(control?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('Numeric Field Validation - Pattern', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should validate extension accepts only numeric values', () => {
      const control = component.form.get('extension');

      control?.setValue('abc');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('123');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should validate workPhone accepts only numeric values', () => {
      const control = component.form.get('workPhone');

      control?.setValue('abc123');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('1234567890');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should validate homePhone accepts only numeric values', () => {
      const control = component.form.get('homePhone');

      control?.setValue('123-456-7890');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('1234567890');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should validate mobilePhone accepts only numeric values', () => {
      const control = component.form.get('mobilePhone');

      control?.setValue('+1234567890');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('1234567890');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should validate fax accepts only numeric values', () => {
      const control = component.form.get('fax');

      control?.setValue('(123) 456-7890');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('1234567890');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should allow empty values for numeric fields', () => {
      const extension = component.form.get('extension');
      const workPhone = component.form.get('workPhone');

      extension?.setValue('');
      workPhone?.setValue('');

      expect(extension?.hasError('pattern')).toBeFalse();
      expect(workPhone?.hasError('pattern')).toBeFalse();
    });
  });

  describe('Email Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should validate email format', () => {
      const control = component.form.get('email');

      control?.setValue('invalid-email');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('valid@email.com');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should accept valid email addresses', () => {
      const control = component.form.get('email');
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@domain.org',
        'firstname.lastname@company.com'
      ];

      validEmails.forEach(email => {
        control?.setValue(email);
        expect(control?.hasError('pattern')).toBeFalse();
      });
    });

    it('should reject invalid email addresses', () => {
      const control = component.form.get('email');
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user name@example.com',
        'user@.com'
      ];

      invalidEmails.forEach(email => {
        control?.setValue(email);
        expect(control?.hasError('pattern')).toBeTrue();
      });
    });
  });



  describe('US Address Blocking', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should show warning when hasUSAddressData is true', () => {
      component.hasUSAddressData = true;
      component.ngOnInit();

      expect(component.showBlockedWarning).toBeTrue();
    });

    it('should not show warning when hasUSAddressData is false', () => {
      component.hasUSAddressData = false;
      component.ngOnInit();

      expect(component.showBlockedWarning).toBeFalse();
    });



    it('should keep form enabled when no US address data', () => {
      component.hasUSAddressData = false;
      component.ngOnInit();

      expect(component.form.disabled).toBeFalse();
    });


  });

  describe('Existing Data Population', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should populate form with existing data when provided', (done) => {
      const existingData = {
        intlAddress1: '123 International St',
        intlAddress2: 'Apt 5',
        intlAddress3: 'Building B',
        intlAddress4: 'Floor 3',
        countryName: 'Canada',
        intlPostalCode: 'A1B 2C3',
        intlWorkPhoneExt: '456',
        intlWorkPhoneNo: '1234567890',
        intlHomePhoneNo: '0987654321',
        intlMobilePhoneNo: '1112223333',
        intlFaxNo: '4445556666',
        intlEmail: 'test@example.com'
      };

      component.existingData = existingData;
      component.ngOnInit();

      // Wait for async operations (setTimeout in loadCountries)
      setTimeout(() => {
        expect(component.form.get('address1')?.value).toBe('123 International St');
        expect(component.form.get('address2')?.value).toBe('Apt 5');
        expect(component.form.get('address3')?.value).toBe('Building B');
        expect(component.form.get('address4')?.value).toBe('Floor 3');
        expect(component.form.get('country')?.value).toBe('CA'); // Country code, not name
        expect(component.form.get('postalCode')?.value).toBe('A1B 2C3');
        expect(component.form.get('extension')?.value).toBe('456');
        expect(component.form.get('workPhone')?.value).toBe('1234567890');
        expect(component.form.get('homePhone')?.value).toBe('0987654321');
        expect(component.form.get('mobilePhone')?.value).toBe('1112223333');
        expect(component.form.get('fax')?.value).toBe('4445556666');
        expect(component.form.get('email')?.value).toBe('test@example.com');
        done();
      }, 150);
    });

    it('should handle partial existing data', (done) => {
      const existingData = {
        intlAddress1: '123 Street',
        countryName: 'Mexico'
      };

      component.existingData = existingData;
      component.ngOnInit();

      // Wait for async operations
      setTimeout(() => {
        expect(component.form.get('address1')?.value).toBe('123 Street');
        expect(component.form.get('country')?.value).toBe('MX'); // Country code, not name
        expect(component.form.get('address2')?.value).toBe('');
        expect(component.form.get('email')?.value).toBe('');
        done();
      }, 150);
    });


  });

  describe('Country Options', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should load country options', () => {
      expect(component.countryOptions).toBeDefined();
      expect(component.countryOptions.length).toBeGreaterThan(0);
    });

    it('should have countries with code and description', () => {
      const country = component.countryOptions[0];
      expect(country.code).toBeDefined();
      expect(country.description).toBeDefined();
    });

    it('should include common countries', () => {
      const countryCodes = component.countryOptions.map(c => c.code);
      expect(countryCodes).toContain('CA'); // Canada
      expect(countryCodes).toContain('MX'); // Mexico
      expect(countryCodes).toContain('UK'); // United Kingdom
    });
  });

  describe('onApply', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });



    it('should mark all fields as touched when form is invalid', () => {
      component.form.patchValue({
        address1: '',
        country: ''
      });

      component.onApply();

      expect(component.form.get('address1')?.touched).toBeTrue();
      expect(component.form.get('country')?.touched).toBeTrue();
    });





    it('should set null for empty/whitespace values', () => {
      spyOn(component.applyData, 'emit');

      component.form.patchValue({
        address1: '123 Street',
        country: 'CA',
        address2: '   ',
        postalCode: ''
      });

      component.onApply();

      const emittedData = (component.applyData.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.intlAddress2).toBeNull();
      expect(emittedData.intlPostalCode).toBeNull();
    });




  });



  describe('isFormValid', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });





    it('should return false when blocked by US address', () => {
      component.showBlockedWarning = true;

      component.form.patchValue({
        address1: '123 Street',
        country: 'CA'
      });

      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('Loading States', () => {




    it('should not load address when locationId is null', () => {
      component.locationId = null;
      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });

    it('should handle locationId being provided', () => {
      component.locationId = 'LOC123';
      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should convert whitespace-only values to null after trim', () => {
      spyOn(component.applyData, 'emit');

      component.form.patchValue({
        address1: '  123 Street  ',
        country: 'CA',
        address2: '   ',
        postalCode: '   ABC  '
      });

      component.onApply();

      expect(component.applyData.emit).toHaveBeenCalled();
      const emittedData = (component.applyData.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.intlAddress1).toBe('123 Street');
      expect(emittedData.intlAddress2).toBeNull();
      expect(emittedData.intlPostalCode).toBe('ABC');
    });

    it('should handle very long numeric phone numbers', () => {
      const control = component.form.get('workPhone');
      const longNumber = '12345678901234567890'; // 20 digits

      control?.setValue(longNumber);

      expect(control?.hasError('pattern')).toBeFalse();
      expect(control?.hasError('maxlength')).toBeFalse();
    });

    it('should handle all fields being optional except address1 and country', () => {
      component.form.patchValue({
        address1: '123 Street',
        country: 'CA'
        // All other fields empty
      });

      expect(component.form.valid).toBeTrue();
    });

    it('should handle special characters in address fields', () => {
      const control = component.form.get('address1');
      control?.setValue('123 Main St. #456 & Co.');

      expect(control?.valid).toBeTrue();
    });
  });

  describe('Form State and Dirty Tracking', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should mark form as pristine initially', () => {
      expect(component.form.pristine).toBeTrue();
      expect(component.form.dirty).toBeFalse();
    });

    it('should track form touched state', () => {
      expect(component.form.untouched).toBeTrue();

      component.form.get('address1')?.markAsTouched();

      expect(component.form.touched).toBeTrue();
    });

    it('should mark individual fields as touched on apply when invalid', () => {
      component.form.patchValue({
        address1: '',
        country: ''
      });

      component.onApply();

      expect(component.form.get('address1')?.touched).toBeTrue();
      expect(component.form.get('country')?.touched).toBeTrue();
    });

    it('should mark individual fields as touched on apply when invalid', () => {
      component.form.patchValue({
        address1: '',
        country: ''
      });

      component.onApply();

      expect(component.form.get('address1')?.touched).toBeTrue();
      expect(component.form.get('country')?.touched).toBeTrue();
    });

    it('should have valid form when required fields are filled', () => {
      component.form.patchValue({
        address1: 'New Address',
        country: 'CA'
      });

      expect(component.form.valid).toBeTrue();
    });
  });

  describe('Complete Form Validation Scenarios', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should be invalid with only address1 (missing required country)', () => {
      component.form.patchValue({
        address1: '123 Street'
      });

      expect(component.form.valid).toBeFalse();
      expect(component.form.get('country')?.hasError('required')).toBeTrue();
    });

    it('should be invalid with only country (missing required address1)', () => {
      component.form.patchValue({
        country: 'CA'
      });

      expect(component.form.valid).toBeFalse();
      expect(component.form.get('address1')?.hasError('required')).toBeTrue();
    });

    it('should be valid with minimum required fields', () => {
      component.form.patchValue({
        address1: '123 Street',
        country: 'CA'
      });

      expect(component.form.valid).toBeTrue();
    });

    it('should be valid with all fields filled correctly', () => {
      component.form.patchValue({
        address1: '123 Main St',
        address2: 'Apt 5',
        address3: 'Building B',
        address4: 'Floor 3',
        country: 'Canada',
        postalCode: 'A1B 2C3',
        extension: '456',
        workPhone: '1234567890',
        homePhone: '0987654321',
        mobilePhone: '1112223333',
        fax: '4445556666',
        email: 'test@example.com'
      });

      expect(component.form.valid).toBeTrue();
    });

    it('should be invalid with invalid email format', () => {
      component.form.patchValue({
        address1: '123 Street',
        country: 'CA',
        email: 'invalid-email'
      });

      expect(component.form.valid).toBeFalse();
      expect(component.form.get('email')?.hasError('pattern')).toBeTrue();
    });

    it('should be invalid with non-numeric phone number', () => {
      component.form.patchValue({
        address1: '123 Street',
        country: 'CA',
        workPhone: 'abc123'
      });

      expect(component.form.valid).toBeFalse();
      expect(component.form.get('workPhone')?.hasError('pattern')).toBeTrue();
    });

    it('should be invalid when address1 exceeds maxlength', () => {
      component.form.patchValue({
        address1: 'a'.repeat(51),
        country: 'CA'
      });

      expect(component.form.valid).toBeFalse();
      expect(component.form.get('address1')?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('Boundary Value Testing', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should accept address1 with exactly 50 characters', () => {
      const control = component.form.get('address1');
      control?.setValue('a'.repeat(50));

      expect(control?.hasError('maxlength')).toBeFalse();
      expect(control?.valid).toBeTrue();
    });

    it('should accept postalCode with exactly 15 characters', () => {
      const control = component.form.get('postalCode');
      control?.setValue('a'.repeat(15));

      expect(control?.hasError('maxlength')).toBeFalse();
      expect(control?.valid).toBeTrue();
    });

    it('should accept extension with exactly 8 digits', () => {
      const control = component.form.get('extension');
      control?.setValue('12345678');

      expect(control?.hasError('maxlength')).toBeFalse();
      expect(control?.hasError('pattern')).toBeFalse();
      expect(control?.valid).toBeTrue();
    });

    it('should accept workPhone with exactly 20 digits', () => {
      const control = component.form.get('workPhone');
      control?.setValue('1'.repeat(20));

      expect(control?.hasError('maxlength')).toBeFalse();
      expect(control?.hasError('pattern')).toBeFalse();
      expect(control?.valid).toBeTrue();
    });

    it('should accept email with exactly 128 characters', () => {
      const control = component.form.get('email');
      const email = 'a'.repeat(118) + '@test.com'; // Exactly 128 chars

      control?.setValue(email);

      expect(control?.hasError('maxlength')).toBeFalse();
    });

    it('should reject address1 with 51 characters', () => {
      const control = component.form.get('address1');
      control?.setValue('a'.repeat(51));

      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should reject extension with 9 digits', () => {
      const control = component.form.get('extension');
      control?.setValue('123456789');

      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should reject workPhone with 21 digits', () => {
      const control = component.form.get('workPhone');
      control?.setValue('1'.repeat(21));

      expect(control?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('Multiple Field Combinations', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should handle all address fields filled', () => {
      component.form.patchValue({
        address1: 'Line 1',
        address2: 'Line 2',
        address3: 'Line 3',
        address4: 'Line 4',
        country: 'CA'
      });

      expect(component.form.valid).toBeTrue();
    });

    it('should handle all phone fields filled', () => {
      component.form.patchValue({
        address1: '123 Street',
        country: 'CA',
        workPhone: '1234567890',
        homePhone: '0987654321',
        mobilePhone: '1112223333',
        fax: '4445556666',
        extension: '123'
      });

      expect(component.form.valid).toBeTrue();
    });

    it('should handle mix of valid and empty optional fields', () => {
      component.form.patchValue({
        address1: '123 Street',
        address2: '',
        address3: 'Building C',
        address4: '',
        country: 'CA',
        postalCode: 'ABC123',
        workPhone: '1234567890',
        email: 'test@example.com'
      });

      expect(component.form.valid).toBeTrue();
    });


  });

  describe('Data Transformation in onApply', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should include all fields in emitted data structure', () => {
      spyOn(component.applyData, 'emit');

      component.form.patchValue({
        address1: '123 Street',
        address2: 'Apt 5',
        address3: 'Building B',
        address4: 'Floor 3',
        country: 'Canada',
        postalCode: 'A1B 2C3',
        extension: '456',
        workPhone: '1234567890',
        homePhone: '0987654321',
        mobilePhone: '1112223333',
        fax: '4445556666',
        email: 'test@example.com'
      });

      component.onApply();

      const emittedData = (component.applyData.emit as jasmine.Spy).calls.mostRecent().args[0];

      expect(emittedData.intlAddrFlag).toBe('Y');
      expect(emittedData.intlAddress1).toBe('123 Street');
      expect(emittedData.intlAddress2).toBe('Apt 5');
      expect(emittedData.intlAddress3).toBe('Building B');
      expect(emittedData.intlAddress4).toBe('Floor 3');
      expect(emittedData.countryName).toBe('Canada');
      expect(emittedData.intlPostalCode).toBe('A1B 2C3');
      expect(emittedData.intlHomePhoneNo).toBe('0987654321');
      expect(emittedData.intlWorkPhoneNo).toBe('1234567890');
      expect(emittedData.intlWorkPhoneExt).toBe('456');
      expect(emittedData.intlMobilePhoneNo).toBe('1112223333');
      expect(emittedData.intlFaxNo).toBe('4445556666');
      expect(emittedData.intlEmail).toBe('test@example.com');
    });

    it('should handle null values for all optional fields', () => {
      spyOn(component.applyData, 'emit');

      component.form.patchValue({
        address1: '123 Street',
        country: 'CA'
        // All optional fields empty
      });

      component.onApply();

      const emittedData = (component.applyData.emit as jasmine.Spy).calls.mostRecent().args[0];

      expect(emittedData.intlAddress2).toBeNull();
      expect(emittedData.intlAddress3).toBeNull();
      expect(emittedData.intlAddress4).toBeNull();
      expect(emittedData.intlPostalCode).toBeNull();
      expect(emittedData.intlHomePhoneNo).toBeNull();
      expect(emittedData.intlWorkPhoneNo).toBeNull();
      expect(emittedData.intlWorkPhoneExt).toBeNull();
      expect(emittedData.intlMobilePhoneNo).toBeNull();
      expect(emittedData.intlFaxNo).toBeNull();
      expect(emittedData.intlEmail).toBeNull();
    });

    it('should trim leading and trailing spaces from text fields', () => {
      spyOn(component.applyData, 'emit');

      component.form.patchValue({
        address1: '  123 Street  ',
        address2: '  Apt 5  ',
        country: 'CA',
        postalCode: '  ABC123  '
      });

      component.onApply();

      expect(component.applyData.emit).toHaveBeenCalled();
      const emittedData = (component.applyData.emit as jasmine.Spy).calls.mostRecent().args[0];

      expect(emittedData.intlAddress1).toBe('123 Street');
      expect(emittedData.intlAddress2).toBe('Apt 5');
      expect(emittedData.intlPostalCode).toBe('ABC123');
    });
  });

  describe('US Address Blocking - Additional Scenarios', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should prevent form submission when blocked by US address', () => {
      spyOn(component.applyData, 'emit');

      component.hasUSAddressData = true;
      component.ngOnInit();

      component.form.patchValue({
        address1: '123 Street',
        country: 'CA'
      });

      component.onApply();

      // Form should be disabled, so onApply shouldn't emit
      expect(component.form.disabled).toBeTrue();
    });



    it('should keep form enabled when initialized without US address data', () => {
      component.hasUSAddressData = false;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.showBlockedWarning).toBeFalse();
      expect(component.form.enabled).toBeTrue();
    });
  });

  describe('Event Emission Sequences', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should emit events in correct order on apply: applyData then closePanel', () => {
      const eventOrder: string[] = [];

      component.applyData.subscribe(() => eventOrder.push('applyData'));
      component.closePanel.subscribe(() => eventOrder.push('closePanel'));

      component.form.patchValue({
        address1: '123 Street',
        country: 'CA'
      });

      component.onApply();

      expect(eventOrder).toEqual(['applyData', 'closePanel']);
    });

    it('should not emit any events on cancel except closePanel', () => {
      spyOn(component.applyData, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(component.applyData.emit).not.toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('Form Reset and Clear Scenarios', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should allow form reset', () => {
      component.form.patchValue({
        address1: '123 Street',
        country: 'CA',
        email: 'test@example.com'
      });

      expect(component.form.value.address1).toBe('123 Street');

      component.form.reset();

      expect(component.form.value.address1).toBeNull();
      expect(component.form.value.country).toBeNull();
      expect(component.form.value.email).toBeNull();
    });

    it('should clear form values on reset', () => {
      component.form.patchValue({
        address1: '123 Street',
        country: 'CA',
        postalCode: 'ABC123',
        workPhone: '1234567890'
      });

      component.form.reset();

      expect(component.form.get('address1')?.value).toBeNull();
      expect(component.form.get('country')?.value).toBeNull();
      expect(component.form.get('postalCode')?.value).toBeNull();
      expect(component.form.get('workPhone')?.value).toBeNull();
    });

    it('should mark form as untouched after reset', () => {
      component.form.get('address1')?.markAsTouched();
      component.form.get('country')?.markAsTouched();

      expect(component.form.touched).toBeTrue();

      component.form.reset();

      expect(component.form.untouched).toBeTrue();
    });
  });

  describe('Existing Data - Complex Scenarios', () => {
    it('should handle existing data with all fields populated', (done) => {
      const existingData = {
        intlAddress1: 'Existing Address 1',
        intlAddress2: 'Existing Address 2',
        intlAddress3: 'Existing Address 3',
        intlAddress4: 'Existing Address 4',
        countryName: 'United Kingdom',
        intlPostalCode: '75001',
        intlWorkPhoneExt: '999',
        intlWorkPhoneNo: '9876543210',
        intlHomePhoneNo: '1234567890',
        intlMobilePhoneNo: '5555555555',
        intlFaxNo: '6666666666',
        intlEmail: 'existing@example.com'
      };

      component.existingData = existingData;
      component.ngOnInit();
      fixture.detectChanges();

      // Wait for async operations
      setTimeout(() => {
        expect(component.form.value).toEqual({
          address1: 'Existing Address 1',
          address2: 'Existing Address 2',
          address3: 'Existing Address 3',
          address4: 'Existing Address 4',
          country: 'UK', // Country code
          postalCode: '75001',
          extension: '999',
          workPhone: '9876543210',
          homePhone: '1234567890',
          mobilePhone: '5555555555',
          fax: '6666666666',
          email: 'existing@example.com'
        });
        done();
      }, 150);
    });

    it('should handle existing data with only required fields', (done) => {
      const existingData = {
        intlAddress1: 'Required Address',
        countryName: 'Mexico'
      };

      component.existingData = existingData;
      component.ngOnInit();
      fixture.detectChanges();

      // Wait for async operations
      setTimeout(() => {
        expect(component.form.get('address1')?.value).toBe('Required Address');
        expect(component.form.get('country')?.value).toBe('MX'); // Country code
        expect(component.form.get('address2')?.value).toBe('');
        expect(component.form.get('postalCode')?.value).toBe('');
        done();
      }, 150);
    });

    it('should override existing data with new form values', (done) => {
      const existingData = {
        intlAddress1: 'Old Address',
        countryName: 'Canada'
      };

      component.existingData = existingData;
      component.ngOnInit();
      fixture.detectChanges();

      // Wait for async operations
      setTimeout(() => {
        expect(component.form.get('address1')?.value).toBe('Old Address');

        component.form.patchValue({
          address1: 'New Address',
          country: 'MX'
        });

        expect(component.form.get('address1')?.value).toBe('New Address');
        expect(component.form.get('country')?.value).toBe('MX');
        done();
      }, 150);
    });
  });

  describe('Initialization with Different Input Combinations', () => {
    it('should initialize with locationId provided', () => {
      component.locationId = 'LOC123';
      component.ngOnInit();

      expect(component.locationId).toBe('LOC123');
      expect(component.isLoading).toBeFalse();
    });

    it('should initialize without locationId', () => {
      component.locationId = null;
      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });

    it('should initialize with hasUSAddressData true', () => {
      component.hasUSAddressData = true;
      component.ngOnInit();

      expect(component.showBlockedWarning).toBeTrue();
      expect(component.form.disabled).toBeTrue();
    });

    it('should initialize with all inputs provided', (done) => {
      component.locationId = 'LOC123';
      component.hasUSAddressData = false;
      component.existingData = {
        intlAddress1: 'Test Address',
        countryName: 'Canada'
      };

      component.ngOnInit();

      expect(component.locationId).toBe('LOC123');
      expect(component.showBlockedWarning).toBeFalse();

      // Wait for async operations
      setTimeout(() => {
        expect(component.form.get('address1')?.value).toBe('Test Address');
        done();
      }, 150);
    });
  });

  describe('Form Validation Error Messages', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should have required error on address1 when empty and touched', () => {
      const control = component.form.get('address1');
      control?.setValue('');
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTrue();
      expect(control?.touched).toBeTrue();
    });

    it('should have required error on country when empty and touched', () => {
      const control = component.form.get('country');
      control?.setValue('');
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTrue();
      expect(control?.touched).toBeTrue();
    });

    it('should have pattern error on extension with letters', () => {
      const control = component.form.get('extension');
      control?.setValue('abc');
      control?.markAsTouched();

      expect(control?.hasError('pattern')).toBeTrue();
    });



    it('should have maxlength error when address1 exceeds limit', () => {
      const control = component.form.get('address1');
      control?.setValue('a'.repeat(51));
      control?.markAsTouched();

      expect(control?.hasError('maxlength')).toBeTrue();
      expect(control?.errors?.['maxlength'].requiredLength).toBe(50);
    });
  });

  describe('onNumericKeyPress', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should allow digit key presses (0-9)', () => {
      const event = { which: 48, keyCode: 48, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();

      const event9 = { which: 57, keyCode: 57, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event9);
      expect(event9.preventDefault).not.toHaveBeenCalled();
    });

    it('should block non-digit key presses', () => {
      const event = { which: 65, keyCode: 65, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow backspace, delete, tab, escape, enter', () => {
      [8, 46, 9, 27, 13].forEach(charCode => {
        const event = { which: charCode, keyCode: charCode, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
        component.onNumericKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should allow Ctrl+A', () => {
      const event = { which: 65, keyCode: 65, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C', () => {
      const event = { which: 67, keyCode: 67, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+V', () => {
      const event = { which: 86, keyCode: 86, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+X', () => {
      const event = { which: 88, keyCode: 88, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Country Search — filterCountries', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should filter countries by description when searchTerm is provided', () => {
      component.countrySearchControl.setValue('can');

      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CA');
    });

    it('should filter countries by code', () => {
      component.countrySearchControl.setValue('MX');

      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].description).toBe('Mexico');
    });

    it('should restore all countries when searchTerm cleared', () => {
      component.countrySearchControl.setValue('can');
      component.countrySearchControl.setValue('');

      expect(component.filteredCountryOptions().length).toBe(3);
    });

    it('should return empty array when no countries match', () => {
      component.countrySearchControl.setValue('zzzzz');

      expect(component.filteredCountryOptions().length).toBe(0);
    });

    it('should be case-insensitive in search', () => {
      component.countrySearchControl.setValue('CANADA');

      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CA');
    });

    it('should show all countries when search is empty', () => {
      component.countrySearchControl.setValue('');

      expect(component.filteredCountryOptions().length).toBe(3);
    });

    it('should filter countries by code (uk)', () => {
      component.countrySearchControl.setValue('uk');

      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].description).toBe('United Kingdom');
    });

    it('should return empty array when no countries match (xyz)', () => {
      component.countrySearchControl.setValue('xyz_no_match');

      expect(component.filteredCountryOptions().length).toBe(0);
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should populate form when existingData changes and countries are loaded', (done) => {
      // Countries are already loaded from ngOnInit

      const changes = {
        existingData: {
          currentValue: { intlAddress1: 'Changed Address', countryName: 'Mexico' },
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      } as any;

      component.existingData = { intlAddress1: 'Changed Address', countryName: 'Mexico' };
      component.ngOnChanges(changes);

      setTimeout(() => {
        expect(component.form.get('address1')?.value).toBe('Changed Address');
        expect(component.form.get('country')?.value).toBe('MX');
        done();
      }, 150);
    });

    it('should not populate form when existingData change is missing', () => {
      const changes = {
        locationId: {
          currentValue: 'LOC456',
          previousValue: 'LOC123',
          firstChange: false,
          isFirstChange: () => false
        }
      } as any;

      component.ngOnChanges(changes);
      // No error thrown, form unchanged
      expect(component.form.get('address1')?.value).toBe('');
    });

    it('should not call populateFormWithExistingData when countries are not yet loaded', () => {
      // countriesLoaded is false before ngOnInit completes
      mockDriveLocationService.getCountries.and.returnValue(new Subject().asObservable());
      component.ngOnInit();

      component.existingData = { intlAddress1: 'Address', countryName: 'Canada' };
      const changes = {
        existingData: {
          currentValue: component.existingData,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      };
      // form might not exist yet if setupForm hasn't run — so no error expected
      expect(() => component.ngOnChanges(changes as any)).not.toThrow();
    });
  });

  describe('loadCountries error handling', () => {
    it('should set empty arrays on error', () => {
      spyOn(console, 'error');
      mockDriveLocationService.getCountries.and.returnValue(throwError(() => new Error('Load Error')));

      fixture = TestBed.createComponent(DriveLocationInternationalAddressComponent);
      component = fixture.componentInstance;
      component.ngOnInit();
      fixture.detectChanges();

      expect(console.error).toHaveBeenCalledWith('Error loading countries:', jasmine.any(Error));
      expect(component.countryOptions).toEqual([]);
      expect(component.filteredCountryOptions()).toEqual([]);
    });
  });

  describe('loadCountries error path', () => {
    it('should handle getCountries error and reset options', () => {
      mockDriveLocationService.getCountries.and.returnValue(throwError(() => new Error('Network error')));

      component.ngOnInit();

      expect(component.countryOptions).toEqual([]);
      expect(component.filteredCountryOptions()).toEqual([]);
    });
  });

  describe('onApply with country code lookup', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should resolve country name from code when applying', () => {
      spyOn(component.applyData, 'emit');

      component.form.patchValue({
        address1: '123 Street',
        country: 'CA'
      });

      component.onApply();

      const emittedData = (component.applyData.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.countryName).toBe('Canada');
    });

    it('should use raw country value when code is not found in options', () => {
      spyOn(component.applyData, 'emit');

      component.form.patchValue({
        address1: '123 Street',
        country: 'ZZ'
      });

      component.onApply();

      const emittedData = (component.applyData.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.countryName).toBe('ZZ');
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should return true when form is valid and not blocked', () => {
      component.showBlockedWarning = false;
      component.form.patchValue({
        address1: '123 Street',
        country: 'CA'
      });

      expect(component.isFormValid).toBeTrue();
    });

    it('should return false when form is invalid', () => {
      component.showBlockedWarning = false;
      component.form.patchValue({
        address1: '',
        country: ''
      });

      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('populateFormWithExistingData with no data', () => {
    it('should not throw when existingData is null', () => {
      component.existingData = null;
      component.ngOnInit();
      fixture.detectChanges();

      // Form stays at default values
      expect(component.form.get('address1')?.value).toBe('');
    });
  });

  describe('populateFormWithExistingData — country not found in options', () => {
    it('should set countryCode to empty string when country name has no match', (done) => {
      component.existingData = { intlAddress1: 'Some St', countryName: 'UnknownCountry' };
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        // Country code should be empty since 'UnknownCountry' is not in options
        expect(component.form.get('country')?.value).toBe('');
        done();
      }, 150);
    });

    it('should populate form even when existingData has no countryName', (done) => {
      component.existingData = { intlAddress1: '999 Nowhere St' };
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.form.get('address1')?.value).toBe('999 Nowhere St');
        done();
      }, 150);
    });

    it('should use empty fallback for null intlAddress fields in patchData', (done) => {
      // existingData has null fields -> the || '' fallback arms are covered
      component.existingData = {
        intlAddress1: null, intlAddress2: null, intlAddress3: null, intlAddress4: null,
        countryName: 'Canada', intlPostalCode: null, intlWorkPhoneExt: null,
        intlWorkPhoneNo: null, intlHomePhoneNo: null, intlMobilePhoneNo: null,
        intlFaxNo: null, intlEmail: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.form.get('address1')?.value).toBe('');
        expect(component.form.get('address2')?.value).toBe('');
        done();
      }, 200);
    });

    it('should use empty array when getCountries returns null', (done) => {
      mockDriveLocationService.getCountries.and.returnValue(of(null as any));
      component.existingData = null;
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.countryOptions).toEqual([]);
        done();
      }, 200);
    });

    it('should skip countryCode when existingData.countryName is empty', (done) => {
      component.existingData = { intlAddress1: '123 St', countryName: '' };
      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        // countryName is empty -> countryCode = '' -> no country set
        expect(component.form.get('country')?.value).toBe('');
        done();
      }, 200);
    });
  });

  describe('isFormValid getter', () => {
    beforeEach(() => {
      component.existingData = null;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should return false when showBlockedWarning is true', () => {
      (component as any).showBlockedWarning = true;
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when form is invalid (required fields empty)', () => {
      (component as any).showBlockedWarning = false;
      expect(component.isFormValid).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // setupCountrySearch subscription wired after ngOnInit
  // -------------------------------------------------------------------------
  describe('setupCountrySearch — subscription via ngOnInit', () => {
    beforeEach(() => {
      component.existingData = null;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should filter countries when countrySearchControl value changes to a term', () => {
      component.countrySearchControl.setValue('can');
      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CA');
    });

    it('should restore all countries when countrySearchControl is cleared', () => {
      component.countrySearchControl.setValue('can');
      component.countrySearchControl.setValue('');
      expect(component.filteredCountryOptions().length).toBe(3);
    });

    it('should handle null value from countrySearchControl by showing all countries', () => {
      component.countrySearchControl.setValue('can');
      component.countrySearchControl.setValue(null);
      expect(component.filteredCountryOptions().length).toBe(3);
    });
  });
});
