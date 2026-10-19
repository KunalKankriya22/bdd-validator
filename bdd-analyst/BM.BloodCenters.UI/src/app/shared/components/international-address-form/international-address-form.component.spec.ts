import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { InternationalAddressFormComponent } from './international-address-form.component';
import { InternationalAddressService } from '../../services/international-address.service';
import { CountryModel, InternationalAddressModel } from '../../models/international-address.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('InternationalAddressFormComponent', () => {
  let component: InternationalAddressFormComponent;
  let fixture: ComponentFixture<InternationalAddressFormComponent>;
  let mockService: jasmine.SpyObj<InternationalAddressService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockCountries: CountryModel[] = [
    { code: 'USA', description: 'United States' },
    { code: 'CAN', description: 'Canada' },
    { code: 'MEX', description: 'Mexico' },
    { code: 'GBR', description: 'United Kingdom' }
  ];

  const mockExistingAddress: InternationalAddressModel = {
    streetName: '123 Main St',
    addr1: 'Apt 4B',
    addr2: null,
    addr3: null,
    country: 'USA',
    postalCode: '12345',
    homePhoneNo: '1234567890',
    workPhoneNo: '0987654321',
    workPhoneExt: '123',
    mobilePhoneNo: '5555555555',
    faxNo: '1111111111',
    email: 'test@example.com',
    intlAddrFlag: 'Y',
    modifiedFlag: 'Y'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('InternationalAddressService', [
      'getCountries',
      'saveAddress',
      'setInternationalAddress',
      'clearInternationalAddress'
    ]);
    mockSnackBar = createMockMatSnackBar();

    mockService.getCountries.and.returnValue(of(mockCountries));



      TestBed.configureTestingModule({
      imports: [
        InternationalAddressFormComponent,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule],
      providers: [
        { provide: InternationalAddressService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    })
    .overrideComponent(InternationalAddressFormComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    });


    


      mockService.getCountries.calls.reset();


      mockService.saveAddress.calls.reset();


      mockService.setInternationalAddress.calls.reset();


      mockService.clearInternationalAddress.calls.reset();


      mockService.getCountries.and.returnValue(of(mockCountries));


    fixture = TestBed.createComponent(InternationalAddressFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Form Initialization', () => {


    it('should have all expected form fields', () => {
      const expectedFields = [
        'addr1', 'addr2', 'addr3', 'addr4', 'country',
        'postalCode', 'homePhoneNo', 'workPhoneNo', 'workPhoneExt',
        'mobilePhoneNo', 'faxNo', 'email'
      ];
      expectedFields.forEach(field => {
        expect(component.addressForm.get(field)).toBeDefined();
      });
    });

    it('should pre-populate form when existingAddress input is provided', () => {
      const newFixture = TestBed.createComponent(InternationalAddressFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.componentRef.setInput('existingAddress', mockExistingAddress);
      newFixture.detectChanges();

      expect(newComponent.addressForm.get('addr1')?.value).toBe('123 Main St');
      expect(newComponent.addressForm.get('addr2')?.value).toBe('');
      expect(newComponent.addressForm.get('country')?.value).toBe('USA');
      expect(newComponent.addressForm.get('postalCode')?.value).toBe('12345');
      expect(newComponent.addressForm.get('email')?.value).toBe('test@example.com');
    });
  });

  describe('Form Validation', () => {
    it('should require addr1 field', () => {
      const addr1 = component.addressForm.get('addr1');
      addr1?.setValue('');
      expect(addr1?.hasError('required')).toBeTruthy();

      addr1?.setValue('123 Main St');
      expect(addr1?.hasError('required')).toBeFalsy();
    });

    it('should require country field', () => {
      const country = component.addressForm.get('country');
      country?.setValue('');
      expect(country?.hasError('required')).toBeTruthy();

      country?.setValue('USA');
      expect(country?.hasError('required')).toBeFalsy();
    });

    it('should enforce maxLength(50) on addr1', () => {
      const addr1 = component.addressForm.get('addr1');
      addr1?.setValue('a'.repeat(51));
      expect(addr1?.hasError('maxlength')).toBeTruthy();

      addr1?.setValue('a'.repeat(50));
      expect(addr1?.hasError('maxlength')).toBeFalsy();
    });

    it('should enforce maxLength(50) on addr2, addr3, addr4', () => {
      ['addr2', 'addr3', 'addr4'].forEach(field => {
        const control = component.addressForm.get(field);
        control?.setValue('a'.repeat(51));
        expect(control?.hasError('maxlength')).toBeTruthy(`Expected ${field} to fail maxlength at 51`);

        control?.setValue('a'.repeat(50));
        expect(control?.hasError('maxlength')).toBeFalsy(`Expected ${field} to pass maxlength at 50`);
      });
    });

    it('should enforce maxLength(50) on country', () => {
      const country = component.addressForm.get('country');
      country?.setValue('a'.repeat(51));
      expect(country?.hasError('maxlength')).toBeTruthy();

      country?.setValue('a'.repeat(50));
      expect(country?.hasError('maxlength')).toBeFalsy();
    });

    it('should enforce maxLength(15) on postalCode', () => {
      const postalCode = component.addressForm.get('postalCode');
      postalCode?.setValue('a'.repeat(16));
      expect(postalCode?.hasError('maxlength')).toBeTruthy();

      postalCode?.setValue('a'.repeat(15));
      expect(postalCode?.hasError('maxlength')).toBeFalsy();
    });

    it('should enforce maxLength(20) and numeric pattern on phone fields', () => {
      ['homePhoneNo', 'workPhoneNo', 'mobilePhoneNo', 'faxNo'].forEach(field => {
        const control = component.addressForm.get(field);

        control?.setValue('1'.repeat(21));
        expect(control?.hasError('maxlength')).toBeTruthy(`Expected ${field} to fail maxlength at 21`);

        control?.setValue('1'.repeat(20));
        expect(control?.hasError('maxlength')).toBeFalsy(`Expected ${field} to pass maxlength at 20`);

        control?.setValue('abc123');
        expect(control?.hasError('pattern')).toBeTruthy(`Expected ${field} to fail pattern for non-numeric`);

        control?.setValue('1234567890');
        expect(control?.hasError('pattern')).toBeFalsy(`Expected ${field} to pass pattern for numeric`);
      });
    });

    it('should enforce maxLength(8) and numeric pattern on workPhoneExt', () => {
      const workExt = component.addressForm.get('workPhoneExt');

      workExt?.setValue('1'.repeat(9));
      expect(workExt?.hasError('maxlength')).toBeTruthy();

      workExt?.setValue('1'.repeat(8));
      expect(workExt?.hasError('maxlength')).toBeFalsy();

      workExt?.setValue('12a');
      expect(workExt?.hasError('pattern')).toBeTruthy();

      workExt?.setValue('123');
      expect(workExt?.hasError('pattern')).toBeFalsy();
    });

    it('should enforce maxLength(128) on email', () => {
      const email = component.addressForm.get('email');
      email?.setValue('a'.repeat(129));
      expect(email?.hasError('maxlength')).toBeTruthy();

      email?.setValue('test@example.com');
      expect(email?.hasError('maxlength')).toBeFalsy();
    });

    it('should validate email format', () => {
      const email = component.addressForm.get('email');

      email?.setValue('invalid-email');
      expect(email?.hasError('email')).toBeTruthy();

      email?.setValue('valid@example.com');
      expect(email?.hasError('email')).toBeFalsy();
    });

    it('should allow empty optional fields without validation errors', () => {
      const optionalFields = [
        'addr2', 'addr3', 'addr4', 'postalCode',
        'homePhoneNo', 'workPhoneNo', 'workPhoneExt',
        'mobilePhoneNo', 'faxNo', 'email'
      ];
      optionalFields.forEach(field => {
        const control = component.addressForm.get(field);
        control?.setValue('');
        expect(control?.valid).toBeTruthy(`Expected empty ${field} to be valid`);
      });
    });
  });

  describe('Country Loading', () => {
    it('should load countries on init', () => {
      expect(mockService.getCountries).toHaveBeenCalled();
      expect(component.countries().length).toBe(4);
      expect(component.filteredCountries().length).toBe(4);
    });



    it('should handle country loading error gracefully', () => {
      mockService.getCountries.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      const newFixture = TestBed.createComponent(InternationalAddressFormComponent);
      newFixture.detectChanges();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to load countries',
        'Close',
        { duration: 5000 }
      );
      expect(newFixture.componentInstance.countries().length).toBe(0);
      expect(newFixture.componentInstance.isLoadingCountries()).toBe(false);
    });
  });

  describe('Country Autocomplete', () => {


    it('should filter countries by description', fakeAsync(() => {
      component.countrySearchControl.setValue('united');
      tick(300);
      fixture.detectChanges();

      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(2);
      expect(filtered.some(c => c.description === 'United States')).toBeTruthy();
      expect(filtered.some(c => c.description === 'United Kingdom')).toBeTruthy();
    }));

    it('should show all countries when search value is empty', fakeAsync(() => {
      component.countrySearchControl.setValue('test');
      tick(300);

      component.countrySearchControl.setValue('');
      tick(300);
      fixture.detectChanges();

      expect(component.filteredCountries().length).toBe(mockCountries.length);
    }));

    it('should filter countries based on search control', () => {
      component.countrySearchControl.setValue('USA');
      expect(component.filteredCountries().length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('onSubmit - without targetTable (emit mode)', () => {
    beforeEach(() => {
      component.addressForm.patchValue({
        addr1: '123 Main St',
        country: 'USA'
      });
    });

    it('should call setInternationalAddress and emit applied when form is valid', () => {
      const appliedSpy = spyOn(component.applied, 'emit');

      component.onSubmit();

      expect(mockService.setInternationalAddress).toHaveBeenCalled();
      expect(appliedSpy).toHaveBeenCalled();
      const emittedValue = appliedSpy.calls.mostRecent().args[0];
      expect(emittedValue).toBeTruthy();
      expect(emittedValue?.streetName).toBe('123 Main St');
      expect(emittedValue?.country).toBe('USA');
    });

    it('should set isSubmitting back to false after submit', () => {
      component.onSubmit();
      expect(component.isSubmitting()).toBe(false);
    });



    it('should mark form as touched when invalid and show snackbar', () => {
      component.addressForm.patchValue({ addr1: '' });

      component.onSubmit();

      expect(component.addressForm.touched).toBeTruthy();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Please fix validation errors',
        'Close',
        { duration: 3000 }
      );
    });
  });

  describe('onSubmit - with targetTable (save mode)', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('targetTable', 'SPONSOR_CONTACT');
      fixture.componentRef.setInput('recordKeyValues', ['KEY1', 'KEY2']);
      fixture.componentRef.setInput('chapterId', 'CH01');
      fixture.detectChanges();

      component.addressForm.patchValue({
        addr1: '456 Oak Ave',
        country: 'Canada'
      });
    });

    it('should call saveAddress and emit saved on success', () => {
      const savedSpy = spyOn(component.saved, 'emit');
      const appliedSpy = spyOn(component.applied, 'emit');
      mockService.saveAddress.and.returnValue(of({ message: 'Address saved', item: 42 }));

      component.onSubmit();

      expect(mockService.saveAddress).toHaveBeenCalled();
      const request = mockService.saveAddress.calls.mostRecent().args[0];
      expect(request.targetTable).toBe('SPONSOR_CONTACT');
      expect(request.recordKeyValues).toEqual(['KEY1', 'KEY2']);
      expect(request.chapterId).toBe('CH01');
      expect(request.address.streetName).toBe('456 Oak Ave');
      expect(request.address.country).toBe('Canada');

      expect(savedSpy).toHaveBeenCalledWith(42);
      expect(appliedSpy).not.toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });

    it('should pass existingAddressId in the save request', () => {
      fixture.componentRef.setInput('existingAddressId', 99);
      fixture.detectChanges();

      mockService.saveAddress.and.returnValue(of({ message: 'Updated', item: 99 }));

      component.onSubmit();

      const request = mockService.saveAddress.calls.mostRecent().args[0];
      expect(request.existingAddressId).toBe(99);
    });



    it('should show default message when response has no message', () => {
      mockService.saveAddress.and.returnValue(of({ item: 1 }));

      component.onSubmit();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Address saved',
        'Close',
        { duration: 3000 }
      );
    });

    it('should handle save error and show snackbar', () => {
      mockService.saveAddress.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate address' } }))
      );

      component.onSubmit();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Duplicate address',
        'Close',
        { duration: 5000 }
      );
      expect(component.isSubmitting()).toBe(false);
    });

    it('should show default error message when error has no message', () => {
      mockService.saveAddress.and.returnValue(
        throwError(() => ({}))
      );

      component.onSubmit();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to save international address',
        'Close',
        { duration: 5000 }
      );
    });


  });

  describe('onCreateAndAddAnother', () => {
    beforeEach(() => {
      component.addressForm.patchValue({
        addr1: '789 Pine Rd',
        country: 'Mexico'
      });
    });

    it('should emit createdAndAddAnother and reset form without targetTable', () => {
      const createdSpy = spyOn(component.createdAndAddAnother, 'emit');

      component.onCreateAndAddAnother();

      expect(mockService.setInternationalAddress).toHaveBeenCalled();
      expect(createdSpy).toHaveBeenCalled();
      const emitted = createdSpy.calls.mostRecent().args[0];
      expect(emitted.streetName).toBe('789 Pine Rd');
      expect(emitted.country).toBe('Mexico');
    });

    it('should save to backend and emit when targetTable is provided', () => {
      fixture.componentRef.setInput('targetTable', 'SPONSOR_CONTACT');
      fixture.componentRef.setInput('recordKeyValues', ['K1']);
      fixture.componentRef.setInput('chapterId', 'CH01');
      fixture.detectChanges();

      const createdSpy = spyOn(component.createdAndAddAnother, 'emit');
      mockService.saveAddress.and.returnValue(of({ message: 'Saved', item: 10 }));

      component.onCreateAndAddAnother();

      expect(mockService.saveAddress).toHaveBeenCalled();
      expect(createdSpy).toHaveBeenCalled();
    });


  });

  describe('onClear', () => {
    it('should reset the form', () => {
      component.addressForm.patchValue({
        addr1: '123 Main St',
        country: 'USA',
        email: 'test@example.com'
      });

      component.onClear();

      expect(component.addressForm.get('addr1')?.value).toBe('');
      expect(component.addressForm.get('country')?.value).toBe('');
      expect(component.addressForm.get('email')?.value).toBe('');
    });




  });
  describe('getFormValue', () => {
    it('should map form values to InternationalAddressModel', () => {
      component.addressForm.patchValue({
        addr1: '123 Main St',
        addr2: 'Suite 5',
        addr3: '',
        addr4: '',
        country: 'USA',
        postalCode: '12345',
        homePhoneNo: '1234567890',
        workPhoneNo: '',
        workPhoneExt: '',
        mobilePhoneNo: '',
        faxNo: '',
        email: 'test@example.com'
      });

      const result = component.getFormValue();

      expect(result.streetName).toBe('123 Main St');
      expect(result.addr1).toBe('123 Main St');
      expect(result.addr2).toBe('Suite 5');
      expect(result.addr3).toBeNull();
      expect(result.addr4).toBeNull();
      expect(result.country).toBe('USA');
      expect(result.postalCode).toBe('12345');
      expect(result.homePhoneNo).toBe('1234567890');
      expect(result.workPhoneNo).toBeNull();
      expect(result.workPhoneExt).toBeNull();
      expect(result.mobilePhoneNo).toBeNull();
      expect(result.faxNo).toBeNull();
      expect(result.email).toBe('test@example.com');
    });





    it('should always set modifiedFlag to "Y"', () => {
      component.addressForm.patchValue({
        addr1: '123 Main St',
        country: 'Canada'
      });

      const result = component.getFormValue();
      expect(result.modifiedFlag).toBe('Y');
    });

    it('should convert empty strings to null for optional fields', () => {
      component.addressForm.patchValue({
        addr1: 'Street',
        country: 'Country',
        addr2: '',
        postalCode: '',
        homePhoneNo: '',
        email: ''
      });

      const result = component.getFormValue();
      expect(result.addr2).toBeNull();
      expect(result.postalCode).toBeNull();
      expect(result.homePhoneNo).toBeNull();
      expect(result.email).toBeNull();
    });
  });

  describe('Input defaults', () => {
    it('should have default input values', () => {
      expect(component.existingAddress()).toBeNull();
      expect(component.showActions()).toBe(true);
      expect(component.showCreateAndAddAnother()).toBe(false);
      expect(component.submitLabel()).toBe('APPLY');
      expect(component.targetTable()).toBeNull();
      expect(component.recordKeyValues()).toEqual([]);
      expect(component.chapterId()).toBe('');
      expect(component.existingAddressId()).toBeNull();
    });
  });



  describe('stripNonNumeric', () => {
    it('should strip non-numeric characters from pasted text', () => {
      component.addressForm.controls.workPhoneNo.setValue('123abc456');
      component.stripNonNumeric('workPhoneNo');
      expect(component.addressForm.controls.workPhoneNo.value).toBe('123456');
    });

    it('should not modify value if already numeric', () => {
      component.addressForm.controls.homePhoneNo.setValue('1234567890');
      component.stripNonNumeric('homePhoneNo');
      expect(component.addressForm.controls.homePhoneNo.value).toBe('1234567890');
    });

    it('should handle empty value', () => {
      component.addressForm.controls.faxNo.setValue('');
      component.stripNonNumeric('faxNo');
      expect(component.addressForm.controls.faxNo.value).toBe('');
    });

    it('should strip all characters if fully non-numeric', () => {
      component.addressForm.controls.mobilePhoneNo.setValue('abcdef');
      component.stripNonNumeric('mobilePhoneNo');
      expect(component.addressForm.controls.mobilePhoneNo.value).toBe('');
    });
  });

  describe('Character Counter (Address fields)', () => {
    it('should show character counter when address field has value', () => {
      component.addressForm.controls.addr1.setValue('Hello');
      fixture.detectChanges();

      const counter = fixture.nativeElement.querySelector('.character-counter');
      expect(counter).toBeTruthy();
      expect(counter.textContent).toContain('45/50');
    });

    it('should not show character counter when address field is empty', () => {
      component.addressForm.controls.addr1.setValue('');
      fixture.detectChanges();

      const counters = fixture.nativeElement.querySelectorAll('.character-counter');
      expect(counters.length).toBe(0);
    });

    it('should update counter as text length changes', () => {
      component.addressForm.controls.addr1.setValue('ab');
      fixture.detectChanges();

      const counter = fixture.nativeElement.querySelector('.character-counter');
      expect(counter.textContent).toContain('48/50');

      component.addressForm.controls.addr1.setValue('abcdefghij');
      fixture.detectChanges();

      expect(counter.textContent).toContain('40/50');
    });
  });

  describe('Email validation message', () => {
    it('should show "Please enter a valid email address" for invalid email', () => {
      const email = component.addressForm.get('email');
      email?.setValue('invalid-email');
      email?.markAsTouched();
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('mat-error');
      expect(errorEl?.textContent?.trim()).toBe('Please enter a valid email address');
    });
  });

  describe('Signal initial states', () => {
    it('should initialize isSubmitting to false', () => {
      expect(component.isSubmitting()).toBe(false);
    });

    it('should have countries populated after init', () => {
      expect(component.countries().length).toBeGreaterThan(0);
    });

    it('should have filteredCountries populated after init', () => {
      expect(component.filteredCountries().length).toBeGreaterThan(0);
    });
  });

  describe('showCountrySearch', () => {
    it('should return true when 3 or more countries', () => {
      expect(component.showCountrySearch).toBe(true);
    });

    it('should return false when fewer than 3 countries', () => {
      component.countries.set([{ code: 'US', description: 'United States' }]);
      expect(component.showCountrySearch).toBe(false);
    });
  });

  describe('isApplyEnabled', () => {
    it('should return false when isSubmitting', () => {
      component.isSubmitting.set(true);
      expect(component.isApplyEnabled).toBe(false);
    });

    it('should return true when form is cleared and had existing address', () => {
      component.isFormCleared.set(true);
      component.hadExistingAddress.set(true);
      expect(component.isApplyEnabled).toBe(true);
    });

    it('should return true when form is valid and required fields filled', () => {
      component.addressForm.patchValue({ addr1: '123 Test', country: 'USA' });
      expect(component.isApplyEnabled).toBe(true);
    });

    it('should return false when required fields empty', () => {
      component.addressForm.patchValue({ addr1: '', country: '' });
      expect(component.isApplyEnabled).toBe(false);
    });
  });

  describe('isClearEnabled', () => {
    it('should return false when isSubmitting', () => {
      component.isSubmitting.set(true);
      expect(component.isClearEnabled).toBe(false);
    });

    it('should return true when form has data', () => {
      component.addressForm.patchValue({ addr1: 'Something' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return false when form is empty', () => {
      component.addressForm.reset();
      expect(component.isClearEnabled).toBe(false);
    });

    it('should return true when email has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ email: 'test@test.com' });
      expect(component.isClearEnabled).toBe(true);
    });
  });

  describe('onSubmit with empty form', () => {
    it('should emit null and call clearInternationalAddress when form is empty', () => {
      const appliedSpy = spyOn(component.applied, 'emit');
      component.addressForm.reset();
      component.onSubmit();
      expect(mockService.clearInternationalAddress).toHaveBeenCalled();
      expect(appliedSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('onCancel', () => {
    it('should emit cancelled', () => {
      const cancelledSpy = spyOn(component.cancelled, 'emit');
      component.onCancel();
      expect(cancelledSpy).toHaveBeenCalled();
    });
  });

  describe('onNumericKeyPress', () => {
    it('should allow numeric characters', () => {
      const event = { which: 50, keyCode: 50, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block non-numeric characters', () => {
      const event = { which: 65, keyCode: 65, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow backspace (8)', () => {
      const event = { which: 8, keyCode: 8, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow tab (9)', () => {
      const event = { which: 9, keyCode: 9, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+A', () => {
      const event = { which: 65, keyCode: 65, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C', () => {
      const event = { which: 67, keyCode: 67, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+V', () => {
      const event = { which: 86, keyCode: 86, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+X', () => {
      const event = { which: 88, keyCode: 88, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow escape (27)', () => {
      const event = { which: 27, keyCode: 27, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow enter (13)', () => {
      const event = { which: 13, keyCode: 13, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow delete (46)', () => {
      const event = { which: 46, keyCode: 46, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should use keyCode when which is 0', () => {
      const event = { which: 0, keyCode: 48, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('getCountryString', () => {
    it('should return empty string for falsy value', () => {
      expect((component as any).getCountryString(null)).toBe('');
      expect((component as any).getCountryString('')).toBe('');
    });

    it('should return string as-is', () => {
      expect((component as any).getCountryString('USA')).toBe('USA');
    });

    it('should return description from CountryModel object', () => {
      expect((component as any).getCountryString({ code: 'US', description: 'United States' })).toBe('United States');
    });
  });

  describe('getFormValue intlAddrFlag', () => {
    it('should set intlAddrFlag to Y when addr fields have data', () => {
      component.addressForm.patchValue({ addr1: 'Street 1', country: 'US' });
      const result = component.getFormValue();
      expect(result.intlAddrFlag).toBe('Y');
    });

    it('should set intlAddrFlag to N when no addr fields have data', () => {
      component.addressForm.patchValue({ addr1: '', addr2: '', addr3: '', addr4: '', country: 'US' });
      const result = component.getFormValue();
      expect(result.intlAddrFlag).toBe('N');
    });
  });

  describe('setupFormChangeTracking', () => {
    it('should reset isFormCleared when user starts entering data after clear', () => {
      component.addressForm.patchValue({ addr1: '123 Main St', country: 'USA' });
      component.onClear();
      expect(component.isFormCleared()).toBe(true);
      component.addressForm.markAsDirty();
      component.addressForm.patchValue({ addr1: 'New Data' });
      expect(component.isFormCleared()).toBe(false);
    });
  });

  describe('bindExistingAddress with addr1 fallback', () => {
    it('should use addr1 when streetName is null', () => {
      const newFixture = TestBed.createComponent(InternationalAddressFormComponent);
      const addr = { ...mockExistingAddress, streetName: null, addr1: 'Fallback Addr' };
      newFixture.componentRef.setInput('existingAddress', addr);
      newFixture.detectChanges();
      expect(newFixture.componentInstance.addressForm.get('addr1')?.value).toBe('Fallback Addr');
      expect(newFixture.componentInstance.hadExistingAddress()).toBe(true);
    });
  });

  describe('onClear additional', () => {
    it('should emit cleared and call clearInternationalAddress', () => {
      const clearedSpy = spyOn(component.cleared, 'emit');
      component.onClear();
      expect(mockService.clearInternationalAddress).toHaveBeenCalled();
      expect(clearedSpy).toHaveBeenCalled();
      expect(component.isFormCleared()).toBe(true);
    });
  });

  describe('onCreateAndAddAnother invalid form', () => {
    it('should not emit when form is invalid', () => {
      const createdSpy = spyOn(component.createdAndAddAnother, 'emit');
      component.addressForm.patchValue({ addr1: '', country: '' });
      component.onCreateAndAddAnother();
      expect(createdSpy).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit empty form - snackbar and state', () => {
    it('should show success snackbar when submitting empty form', () => {
      component.addressForm.reset();
      component.onSubmit();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'International address updated',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['success-snackbar'] })
      );
    });

    it('should reset isFormCleared to false after submitting empty form', () => {
      component.isFormCleared.set(true);
      component.addressForm.reset();
      component.onSubmit();
      expect(component.isFormCleared()).toBe(false);
    });

    it('should toggle isSubmitting back to false after empty submit', () => {
      component.addressForm.reset();
      component.onSubmit();
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('onSubmit non-DB mode - snackbar and state', () => {
    it('should show success snackbar after successful non-DB submit', () => {
      component.addressForm.patchValue({ addr1: '123 Main St', country: 'USA' });
      component.onSubmit();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'International address updated',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['success-snackbar'] })
      );
    });

    it('should reset isFormCleared after successful non-DB submit', () => {
      component.isFormCleared.set(true);
      component.addressForm.patchValue({ addr1: '123 Main St', country: 'USA' });
      component.onSubmit();
      expect(component.isFormCleared()).toBe(false);
    });
  });

  describe('onCreateAndAddAnother - form reset', () => {
    it('should reset form after emitting without targetTable', () => {
      component.addressForm.patchValue({ addr1: '789 Pine Rd', country: 'Mexico' });
      spyOn(component.createdAndAddAnother, 'emit');
      component.onCreateAndAddAnother();
      expect(component.addressForm.get('addr1')?.value).toBe('');
      expect(component.addressForm.get('country')?.value).toBe('');
    });

    it('should mark form touched and show snackbar when invalid', () => {
      component.addressForm.patchValue({ addr1: '', country: '' });
      component.onCreateAndAddAnother();
      expect(component.addressForm.touched).toBeTruthy();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Please fix validation errors',
        'Close',
        { duration: 3000 }
      );
    });
  });

  describe('onCreateAndAddAnother with targetTable - error handling', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('targetTable', 'SPONSOR_CONTACT');
      fixture.componentRef.setInput('recordKeyValues', ['K1']);
      fixture.componentRef.setInput('chapterId', 'CH01');
      fixture.detectChanges();
      component.addressForm.patchValue({ addr1: '100 Oak Ave', country: 'CAN' });
    });

    it('should handle backend error on create and add another', () => {
      mockService.saveAddress.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.onCreateAndAddAnother();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Server error',
        'Close',
        { duration: 5000 }
      );
      expect(component.isSubmitting()).toBe(false);
    });

    it('should reset form after successful backend save with addAnother', () => {
      mockService.saveAddress.and.returnValue(of({ message: 'Saved', item: 20 }));
      spyOn(component.createdAndAddAnother, 'emit');
      component.onCreateAndAddAnother();
      expect(component.addressForm.get('addr1')?.value).toBe('');
    });
  });

  describe('setupFormChangeTracking - edge cases', () => {
    it('should not reset isFormCleared when form is cleared and dirty but has no data', () => {
      component.addressForm.patchValue({ addr1: 'test', country: 'US' });
      component.onClear();
      expect(component.isFormCleared()).toBe(true);

      // Mark as dirty but keep all fields empty
      component.addressForm.markAsDirty();
      component.addressForm.patchValue({ addr1: '', addr2: '', addr3: '', addr4: '', country: '', postalCode: '' });
      expect(component.isFormCleared()).toBe(true);
    });

    it('should not change isFormCleared when form is not cleared', () => {
      component.isFormCleared.set(false);
      component.addressForm.markAsDirty();
      component.addressForm.patchValue({ addr1: 'New data' });
      expect(component.isFormCleared()).toBe(false);
    });
  });

  describe('isClearEnabled - individual field branches', () => {
    it('should return true when only addr2 has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ addr2: 'Suite 1' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when only addr3 has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ addr3: 'Floor 2' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when only addr4 has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ addr4: 'Building C' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when only country has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ country: 'USA' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when only postalCode has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ postalCode: '12345' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when only homePhoneNo has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ homePhoneNo: '1234567890' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when only workPhoneNo has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ workPhoneNo: '9876543210' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when only workPhoneExt has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ workPhoneExt: '123' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when only mobilePhoneNo has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ mobilePhoneNo: '5551234567' });
      expect(component.isClearEnabled).toBe(true);
    });

    it('should return true when only faxNo has data', () => {
      component.addressForm.reset();
      component.addressForm.patchValue({ faxNo: '1112223333' });
      expect(component.isClearEnabled).toBe(true);
    });
  });

  describe('isApplyEnabled - additional branches', () => {
    it('should return false when isFormCleared is true but hadExistingAddress is false', () => {
      component.isFormCleared.set(true);
      component.hadExistingAddress.set(false);
      component.addressForm.patchValue({ addr1: '', country: '' });
      expect(component.isApplyEnabled).toBe(false);
    });

    it('should return false when form has required data but is invalid (maxlength exceeded)', () => {
      component.addressForm.patchValue({
        addr1: 'a'.repeat(51),
        country: 'USA'
      });
      expect(component.isApplyEnabled).toBe(false);
    });

    it('should return false when addr1 is whitespace only', () => {
      component.addressForm.patchValue({ addr1: '   ', country: 'USA' });
      expect(component.isApplyEnabled).toBe(false);
    });

    it('should return false when country is empty but addr1 is filled', () => {
      component.addressForm.patchValue({ addr1: '123 Main', country: '' });
      expect(component.isApplyEnabled).toBe(false);
    });
  });

  describe('stripNonNumeric - non-existent control', () => {
    it('should not throw when control name does not exist', () => {
      expect(() => component.stripNonNumeric('nonExistentField')).not.toThrow();
    });
  });

  describe('filterCountries - filter by code', () => {
    it('should filter countries by code', fakeAsync(() => {
      component.countrySearchControl.setValue('USA');
      tick(300);
      fixture.detectChanges();

      const filtered = component.filteredCountries();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('USA');
    }));

    it('should return empty when no match', fakeAsync(() => {
      component.countrySearchControl.setValue('ZZZ');
      tick(300);
      fixture.detectChanges();

      expect(component.filteredCountries().length).toBe(0);
    }));
  });

  describe('bindExistingAddress - null fields', () => {
    it('should set empty strings for null optional fields', () => {
      const newFixture = TestBed.createComponent(InternationalAddressFormComponent);
      const addr: InternationalAddressModel = {
        streetName: '123 Main',
        addr1: null,
        addr2: null,
        addr3: null,
        addr4: null,
        country: null,
        postalCode: null,
        homePhoneNo: null,
        workPhoneNo: null,
        workPhoneExt: null,
        mobilePhoneNo: null,
        faxNo: null,
        email: null,
        intlAddrFlag: 'N',
        modifiedFlag: 'N'
      };
      newFixture.componentRef.setInput('existingAddress', addr);
      newFixture.detectChanges();

      const c = newFixture.componentInstance;
      expect(c.addressForm.get('addr1')?.value).toBe('123 Main');
      expect(c.addressForm.get('addr2')?.value).toBe('');
      expect(c.addressForm.get('addr3')?.value).toBe('');
      expect(c.addressForm.get('addr4')?.value).toBe('');
      expect(c.addressForm.get('country')?.value).toBe('');
      expect(c.addressForm.get('postalCode')?.value).toBe('');
      expect(c.addressForm.get('homePhoneNo')?.value).toBe('');
      expect(c.addressForm.get('workPhoneNo')?.value).toBe('');
      expect(c.addressForm.get('workPhoneExt')?.value).toBe('');
      expect(c.addressForm.get('mobilePhoneNo')?.value).toBe('');
      expect(c.addressForm.get('faxNo')?.value).toBe('');
      expect(c.addressForm.get('email')?.value).toBe('');
      expect(c.hadExistingAddress()).toBe(true);
      expect(c.isFormCleared()).toBe(false);
    });

    it('should use streetName over addr1 when both are present', () => {
      const newFixture = TestBed.createComponent(InternationalAddressFormComponent);
      const addr: InternationalAddressModel = {
        ...mockExistingAddress,
        streetName: 'Street Name',
        addr1: 'Addr1 Value',
      };
      newFixture.componentRef.setInput('existingAddress', addr);
      newFixture.detectChanges();
      expect(newFixture.componentInstance.addressForm.get('addr1')?.value).toBe('Street Name');
    });
  });

  describe('getFormValue with CountryModel object', () => {
    it('should extract description from CountryModel object for country', () => {
      component.addressForm.patchValue({
        addr1: 'Street',
        country: { code: 'US', description: 'United States' } as any,
      });
      const result = component.getFormValue();
      expect(result.country).toBe('United States');
    });

    it('should return empty string for country when value is null/undefined', () => {
      component.addressForm.patchValue({
        addr1: 'Street',
        country: '',
      });
      const result = component.getFormValue();
      expect(result.country).toBe('');
    });
  });

  describe('onSubmit - partially filled form (not all addr fields empty)', () => {
    it('should treat form as non-empty when only addr2 has data', () => {
      const appliedSpy = spyOn(component.applied, 'emit');
      component.addressForm.reset();
      component.addressForm.patchValue({ addr2: 'Suite 100', addr1: 'Addr', country: 'US' });
      component.onSubmit();
      expect(appliedSpy).toHaveBeenCalled();
      expect(appliedSpy.calls.mostRecent().args[0]).not.toBeNull();
    });

    it('should treat form as non-empty when only postalCode has data along with required fields', () => {
      const appliedSpy = spyOn(component.applied, 'emit');
      component.addressForm.reset();
      component.addressForm.patchValue({ postalCode: '12345', addr1: 'Street', country: 'US' });
      component.onSubmit();
      expect(appliedSpy).toHaveBeenCalled();
      const emitted = appliedSpy.calls.mostRecent().args[0];
      expect(emitted).not.toBeNull();
      expect(emitted?.postalCode).toBe('12345');
    });
  });

  describe('saveToBackend - success message variations', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('targetTable', 'DONOR');
      fixture.componentRef.setInput('recordKeyValues', ['D1']);
      fixture.componentRef.setInput('chapterId', 'CH');
      fixture.detectChanges();
      component.addressForm.patchValue({ addr1: 'Street', country: 'CAN' });
    });

    it('should show response message when available', () => {
      mockService.saveAddress.and.returnValue(of({ message: 'Custom success', item: 5 }));
      component.onSubmit();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Custom success',
        'Close',
        { duration: 3000 }
      );
    });

    it('should call setInternationalAddress on successful backend save', () => {
      mockService.saveAddress.and.returnValue(of({ message: 'Saved', item: 7 }));
      component.onSubmit();
      expect(mockService.setInternationalAddress).toHaveBeenCalled();
    });
  });

  describe('showCountrySearch boundary', () => {
    it('should return true when exactly 3 countries', () => {
      component.countries.set([
        { code: 'A', description: 'Alpha' },
        { code: 'B', description: 'Bravo' },
        { code: 'C', description: 'Charlie' },
      ]);
      expect(component.showCountrySearch).toBe(true);
    });

    it('should return false when exactly 2 countries', () => {
      component.countries.set([
        { code: 'A', description: 'Alpha' },
        { code: 'B', description: 'Bravo' },
      ]);
      expect(component.showCountrySearch).toBe(false);
    });

    it('should return false when no countries', () => {
      component.countries.set([]);
      expect(component.showCountrySearch).toBe(false);
    });
  });

  describe('getFormValue - intlAddrFlag edge cases', () => {
    it('should set intlAddrFlag to Y when only addr2 has data', () => {
      component.addressForm.patchValue({ addr1: '', addr2: 'Suite', addr3: '', addr4: '', country: 'US' });
      const result = component.getFormValue();
      expect(result.intlAddrFlag).toBe('Y');
    });

    it('should set intlAddrFlag to Y when only addr3 has data', () => {
      component.addressForm.patchValue({ addr1: '', addr2: '', addr3: 'Floor', addr4: '', country: 'US' });
      const result = component.getFormValue();
      expect(result.intlAddrFlag).toBe('Y');
    });

    it('should set intlAddrFlag to Y when only addr4 has data', () => {
      component.addressForm.patchValue({ addr1: '', addr2: '', addr3: '', addr4: 'Bldg', country: 'US' });
      const result = component.getFormValue();
      expect(result.intlAddrFlag).toBe('Y');
    });
  });

  describe('getCountryString edge cases', () => {
    it('should return empty string for undefined', () => {
      expect((component as any).getCountryString(undefined)).toBe('');
    });

    it('should return empty string for 0', () => {
      expect((component as any).getCountryString(0)).toBe('');
    });

    it('should return empty string when CountryModel has no description', () => {
      expect((component as any).getCountryString({ code: 'US' })).toBe('');
    });
  });

  describe('onSubmit - invalid form guard', () => {
    it('should not emit applied or call service when form is invalid with data', () => {
      const appliedSpy = spyOn(component.applied, 'emit');
      component.addressForm.patchValue({ addr1: 'a'.repeat(51), country: 'US' });
      component.onSubmit();
      expect(appliedSpy).not.toHaveBeenCalled();
      expect(mockService.setInternationalAddress).not.toHaveBeenCalled();
    });
  });

  describe('saveToBackend - default error message', () => {
    it('should use default message when error has null error property', () => {
      fixture.componentRef.setInput('targetTable', 'TABLE');
      fixture.componentRef.setInput('recordKeyValues', ['K']);
      fixture.componentRef.setInput('chapterId', 'C');
      fixture.detectChanges();
      component.addressForm.patchValue({ addr1: 'St', country: 'US' });
      mockService.saveAddress.and.returnValue(throwError(() => null));
      component.onSubmit();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to save international address',
        'Close',
        { duration: 5000 }
      );
    });
  });

  describe('isLoadingCountries signal', () => {
    it('should set isLoadingCountries to false after countries load', () => {
      expect(component.isLoadingCountries()).toBe(false);
    });

    it('should set isLoadingCountries to false after error', () => {
      mockService.getCountries.and.returnValue(throwError(() => new Error('err')));
      const newFixture = TestBed.createComponent(InternationalAddressFormComponent);
      newFixture.detectChanges();
      expect(newFixture.componentInstance.isLoadingCountries()).toBe(false);
    });
  });

  describe('onSubmit with empty addr fields but non-empty postalCode', () => {
    it('should not treat as empty when postalCode has data', () => {
      const appliedSpy = spyOn(component.applied, 'emit');
      component.addressForm.reset();
      component.addressForm.patchValue({ postalCode: '12345', addr1: 'St', country: 'US' });
      component.onSubmit();
      const emitted = appliedSpy.calls.mostRecent()?.args[0];
      expect(emitted).not.toBeNull();
    });
  });

  describe('onSubmit with whitespace-only addr fields', () => {
    it('should treat whitespace-only addr1 as empty for isEmpty check', () => {
      const appliedSpy = spyOn(component.applied, 'emit');
      component.addressForm.patchValue({
        addr1: '   ',
        addr2: '   ',
        addr3: '   ',
        addr4: '   ',
        country: '',
        postalCode: '   '
      });
      component.onSubmit();
      // Form is considered empty since all addr fields are whitespace-only
      expect(mockService.clearInternationalAddress).toHaveBeenCalled();
      expect(appliedSpy).toHaveBeenCalledWith(null);
    });
  });

});
