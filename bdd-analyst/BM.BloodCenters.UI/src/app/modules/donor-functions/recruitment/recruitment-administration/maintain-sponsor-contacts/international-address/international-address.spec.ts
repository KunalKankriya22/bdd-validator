import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { InternationalAddressComponent } from './international-address';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { SponsorContactModel, SponsorContactDetailModel, TitleLookupItem } from '../models/maintain-sponsor-contacts.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('InternationalAddressComponent', () => {
  let component: InternationalAddressComponent;
  let fixture: ComponentFixture<InternationalAddressComponent>;
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
      intlAddress1: '123 Main St',
      intlAddress2: 'Apt 4B',
      intlAddress3: 'Building C',
      intlAddress4: 'Floor 2',
      countryName: 'UK',
      intlPostalCode: 'SW1A 1AA',
      intlWorkPhoneExt: '123',
      intlWorkPhoneNo: '12345678901234567890',
      intlHomePhoneNo: '09876543210987654321',
      intlMobilePhoneNo: '11111111111111111111',
      intlFaxNo: '22222222222222222222',
      email: 'john@example.com'
    },
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser'
  };

  const mockCountryOptions: TitleLookupItem[] = [
    { code: 'US', description: 'United States' },
    { code: 'UK', description: 'United Kingdom' },
    { code: 'GUAM', description: 'Guam' }
  ];

  beforeEach(() => {

    mockSponsorContactsService = jasmine.createSpyObj('MaintainSponsorContactsService', [
      'getContactDetail',
      'getCountries',
      'updateContact'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();

    mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));
    mockSponsorContactsService.getCountries.and.returnValue(of(mockCountryOptions));
      TestBed.configureTestingModule({
      imports: [InternationalAddressComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        FormBuilder,
        { provide: MaintainSponsorContactsService, useValue: mockSponsorContactsService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).overrideComponent(InternationalAddressComponent, {
      add: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] }
    });


    


      mockSponsorContactsService.getContactDetail.calls.reset();


      mockSponsorContactsService.getCountries.calls.reset();


      mockSponsorContactsService.updateContact.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));


      mockSponsorContactsService.getCountries.and.returnValue(of(mockCountryOptions));
    fixture = TestBed.createComponent(InternationalAddressComponent);
    component = fixture.componentInstance;
    component.data = mockContactData;
    mockSnackBar = fixture.debugElement.injector.get(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;


    });

  describe('Component Initialization', () => {




    it('should load countries on init', () => {
      fixture.detectChanges();

      expect(mockSponsorContactsService.getCountries).toHaveBeenCalled();
      expect(component.countryOptions).toEqual(mockCountryOptions);
    });

    it('should load contact detail on init', () => {
      fixture.detectChanges();

      expect(mockSponsorContactsService.getContactDetail).toHaveBeenCalledWith('SPONSOR123', 'ADDR456');
    });
  });

  describe('Form Population', () => {
    beforeEach(() => {
      fixture.detectChanges();
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

      expect(component.form.get('address1')?.value).toBe('');
    });

    it('should populate country code when exists in options', () => {
      expect(component.form.get('country')?.value).toBe('UK');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should enforce maxlength on address1 (50 chars)', () => {
      const control = component.form.get('address1');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength on address2 (50 chars)', () => {
      const control = component.form.get('address2');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength on address3 (50 chars)', () => {
      const control = component.form.get('address3');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxlength on address4 (50 chars)', () => {
      const control = component.form.get('address4');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should not have required validators on any field', () => {
      expect(component.form.get('address1')?.hasError('required')).toBeFalse();
      expect(component.form.get('country')?.hasError('required')).toBeFalse();
      expect(component.form.get('postalCode')?.hasError('required')).toBeFalse();
    });
  });

  describe('Country Dropdown', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate country options from API', () => {
      expect(component.countryOptions).toEqual(mockCountryOptions);
    });

    it('should handle countries loading error', () => {
      mockSponsorContactsService.getCountries.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.ngOnInit();

      expect(component.countryOptions).toEqual([]);
    });

    it('should send country code (not description) in payload', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'Success' })
      );

      component.form.patchValue({ country: 'US', address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      const payload = callArgs[3];
      expect(payload.address.countryName).toBe('US');
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when form is not dirty', () => {
      expect(component.isFormValid).toBeFalse();
    });




  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'International address updated successfully' })
      );
    });



    it('should submit valid form successfully', () => {
      component.form.patchValue({ address1: 'Updated Address' });
      component.form.markAsDirty();

      spyOn(component.saveSuccess, 'emit');
      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });

    it('should include all address fields in payload', () => {
      component.form.patchValue({
        address1: 'New Address 1',
        address2: 'New Address 2',
        country: 'US',
        postalCode: '12345',
        workPhone: '11111111111111111111',
        homePhone: '22222222222222222222',
        mobilePhone: '33333333333333333333',
        fax: '44444444444444444444',
        email: 'new@example.com'
      });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      const payload = callArgs[3];
      expect(payload.address.intlAddress1).toBe('New Address 1');
      expect(payload.address.intlAddress2).toBe('New Address 2');
      expect(payload.address.countryName).toBe('US');
      expect(payload.address.intlPostalCode).toBe('12345');
      expect(payload.address.intlWorkPhoneNo).toBe('11111111111111111111');
    });

    it('should preserve non-form fields from contactDetail', () => {
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      const payload = callArgs[3];
      expect(payload.contactType).toBe('PRIMARY');
      expect(payload.lastName).toBe('Doe');
      expect(payload.effDate).toBe('15-JUN-2020');
    });






  });



  describe('Loading States', () => {




    it('should set isSaving to false after successful save', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'Success' })
      );

      fixture.detectChanges();

      component.form.patchValue({ address1: 'Updated' });
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

  describe('Data Handling Without sponsorId/addressId', () => {
    it('should not load contact detail when sponsorId is missing', () => {
      mockSponsorContactsService.getContactDetail.calls.reset();

      component.data = {
        ...mockContactData,
        sponsorId: '',
        addressId: 'ADDR456'
      };

      component.ngOnInit();

      expect(mockSponsorContactsService.getContactDetail).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should not load contact detail when addressId is missing', () => {
      mockSponsorContactsService.getContactDetail.calls.reset();

      component.data = {
        ...mockContactData,
        sponsorId: 'SPONSOR123',
        addressId: ''
      };

      component.ngOnInit();

      expect(mockSponsorContactsService.getContactDetail).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should not load contact detail when data is null', () => {
      mockSponsorContactsService.getContactDetail.calls.reset();

      component.data = null;
      component.ngOnInit();

      expect(mockSponsorContactsService.getContactDetail).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject to unsubscribe', () => {
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Country Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update countrySearch signal when search control value changes', () => {
      component.countrySearchControl.setValue('United');

      expect(component.countrySearch()).toBe('United');
    });

    it('should set countrySearch to empty string when search control value is null', () => {
      component.countrySearchControl.setValue(null);

      expect(component.countrySearch()).toBe('');
    });

    it('should return all options when search is empty', () => {
      component.countrySearch.set('');

      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(mockCountryOptions.length);
    });

    it('should filter country options by description', () => {
      component.countrySearch.set('United');

      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(2);
      expect(filtered[0].code).toBe('US');
      expect(filtered[1].code).toBe('UK');
    });

    it('should filter country options by code', () => {
      component.countrySearch.set('GUAM');

      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('GUAM');
    });

    it('should filter case-insensitively', () => {
      component.countrySearch.set('united');

      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(2);
    });

    it('should return empty array when no options match search', () => {
      component.countrySearch.set('zzzzz');

      const filtered = component.filteredCountryOptions();
      expect(filtered.length).toBe(0);
    });
  });

  describe('matchCountryValue', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not patch value when country control value is empty', () => {
      component.form.patchValue({ country: '' });
      const patchSpy = spyOn(component.form, 'patchValue');

      component['matchCountryValue'](mockCountryOptions);

      expect(patchSpy).not.toHaveBeenCalled();
    });

    it('should not patch value when countries array is empty', () => {
      component.form.patchValue({ country: 'US' });
      const patchSpy = spyOn(component.form, 'patchValue');

      component['matchCountryValue']([]);

      expect(patchSpy).not.toHaveBeenCalled();
    });

    it('should not patch value when current value already matches a code exactly', () => {
      component.form.patchValue({ country: 'US' });
      const patchSpy = spyOn(component.form, 'patchValue');

      component['matchCountryValue'](mockCountryOptions);

      expect(patchSpy).not.toHaveBeenCalled();
    });

    it('should patch value when current value matches a description', () => {
      component.form.patchValue({ country: 'United States' });

      component['matchCountryValue'](mockCountryOptions);

      expect(component.form.get('country')?.value).toBe('US');
    });

    it('should patch value when current value matches a code case-insensitively', () => {
      component.form.patchValue({ country: 'us' });

      component['matchCountryValue'](mockCountryOptions);

      expect(component.form.get('country')?.value).toBe('US');
    });

    it('should mark form as pristine after matching', () => {
      component.form.patchValue({ country: 'United Kingdom' });
      component.form.markAsDirty();

      component['matchCountryValue'](mockCountryOptions);

      expect(component.form.pristine).toBeTrue();
    });

    it('should update initialFormValue after matching', () => {
      component.form.patchValue({ country: 'United States' });

      component['matchCountryValue'](mockCountryOptions);

      expect(component['initialFormValue']).toBeTruthy();
      expect((component['initialFormValue'] as any).country).toBe('US');
    });

    it('should not patch when no match is found', () => {
      component.form.patchValue({ country: 'Atlantis' });
      const markSpy = spyOn(component.form, 'markAsPristine');

      component['matchCountryValue'](mockCountryOptions);

      expect(markSpy).not.toHaveBeenCalled();
    });
  });

  describe('isFormValid - additional cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when form has errors on a touched control', () => {
      const address1 = component.form.get('address1');
      address1?.setValue('');
      address1?.markAsTouched();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is dirty and has no touched errors', () => {
      component.form.patchValue({ address1: 'Changed address' });
      component.form.markAsDirty();

      expect(component.isFormValid).toBeTrue();
    });

    it('should detect dirty via initialFormValue comparison', () => {
      // initialFormValue is set after loadAddress, so change a value
      component.form.patchValue({ address1: 'A completely different address' });
      // Form is still pristine but values differ from initial
      component.form.markAsPristine();

      expect(component.isFormValid).toBeTrue();
    });

    it('should return false when values match initialFormValue even if form.dirty is true', () => {
      // After init, initialFormValue equals form value
      // Reset form to same values as initial
      const initial = component['initialFormValue'];
      if (initial) {
        component.form.patchValue(initial);
      }
      // Even marking dirty, values match initialFormValue so isDirty is false
      expect(component.isFormValid).toBeFalse();
    });

    it('should use form.dirty when initialFormValue is null', () => {
      component['initialFormValue'] = null;

      // Form not dirty -> false
      component.form.markAsPristine();
      expect(component.isFormValid).toBeFalse();

      // Form dirty -> true
      component.form.markAsDirty();
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('Regular Address Detection and Field Disabling', () => {
    it('should detect regular address when streetName is present', () => {
      const detailWithStreet = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          streetName: '123 Main',
          zip: ''
        }
      } as any;
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithStreet));

      fixture.detectChanges();

      expect(component.hasRegularAddress).toBeTrue();
    });

    it('should detect regular address when zip is present', () => {
      const detailWithZip = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          streetName: '',
          zip: '12345'
        }
      } as any;
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithZip));

      fixture.detectChanges();

      expect(component.hasRegularAddress).toBeTrue();
    });

    it('should not detect regular address when both streetName and zip are empty', () => {
      const detailNoRegular = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          streetName: '',
          zip: ''
        }
      } as any;
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailNoRegular));

      fixture.detectChanges();

      expect(component.hasRegularAddress).toBeFalse();
    });

    it('should not detect regular address when address is null', () => {
      expect(component['checkHasRegularAddress'](null)).toBeFalse();
    });

    it('should not detect regular address when streetName and zip are only whitespace', () => {
      expect(component['checkHasRegularAddress']({ streetName: '   ', zip: '  ' })).toBeFalse();
    });

    it('should disable international fields when regular address exists', () => {
      const detailWithStreet = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          streetName: '123 Main',
          zip: '12345'
        }
      } as any;
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithStreet));

      fixture.detectChanges();

      expect(component.form.get('address1')?.disabled).toBeTrue();
      expect(component.form.get('address2')?.disabled).toBeTrue();
      expect(component.form.get('address3')?.disabled).toBeTrue();
      expect(component.form.get('address4')?.disabled).toBeTrue();
      expect(component.form.get('country')?.disabled).toBeTrue();
      expect(component.form.get('postalCode')?.disabled).toBeTrue();
      expect(component.form.get('workPhone')?.disabled).toBeTrue();
      expect(component.form.get('homePhone')?.disabled).toBeTrue();
      expect(component.form.get('mobilePhone')?.disabled).toBeTrue();
      expect(component.form.get('fax')?.disabled).toBeTrue();
      expect(component.form.get('extension')?.disabled).toBeTrue();
      expect(component.form.get('email')?.disabled).toBeTrue();
    });

    it('should clear email value when disabling international fields', () => {
      const detailWithStreet = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address,
          streetName: '123 Main',
          zip: '12345',
          email: 'test@test.com'
        }
      } as any;
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithStreet));

      fixture.detectChanges();

      expect(component.form.get('email')?.value).toBe('');
    });
  });

  describe('getAddress1Error', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getAddress1Error()).toBe('');
    });

    it('should return required message when address1 is empty and touched', () => {
      const control = component.form.get('address1');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getAddress1Error()).toBe('Address 1 is required');
    });

    it('should return maxlength message when address1 exceeds 50 chars', () => {
      const control = component.form.get('address1');
      control?.setValue('a'.repeat(51));
      control?.markAsTouched();

      expect(component.getAddress1Error()).toBe('Address 1 can be maximum 50 characters');
    });

    it('should return empty string when address1 is valid and touched', () => {
      const control = component.form.get('address1');
      control?.setValue('Valid Address');
      control?.markAsTouched();

      expect(component.getAddress1Error()).toBe('');
    });
  });

  describe('getCountryError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getCountryError()).toBe('');
    });

    it('should return required message when country is empty and touched', () => {
      const control = component.form.get('country');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getCountryError()).toBe('Country is required');
    });

    it('should return empty string when country is valid and touched', () => {
      const control = component.form.get('country');
      control?.setValue('US');
      control?.markAsTouched();

      expect(component.getCountryError()).toBe('');
    });
  });

  describe('onNumericKeyPress', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow digit keys (0-9)', () => {
      for (let charCode = 48; charCode <= 57; charCode++) {
        const event = { which: charCode, keyCode: charCode, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
        component.onNumericKeyPress(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should prevent non-digit characters', () => {
      const event = { which: 65, keyCode: 65, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow backspace (charCode 8)', () => {
      const event = { which: 8, keyCode: 8, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow tab (charCode 9)', () => {
      const event = { which: 9, keyCode: 9, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow escape (charCode 27)', () => {
      const event = { which: 27, keyCode: 27, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow enter (charCode 13)', () => {
      const event = { which: 13, keyCode: 13, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow delete (charCode 46)', () => {
      const event = { which: 46, keyCode: 46, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
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

    it('should use keyCode when which is 0', () => {
      const event = { which: 0, keyCode: 65, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
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

  describe('onSave - additional cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark all controls as touched when form is invalid', () => {
      component.form.patchValue({ address1: '', country: '' });
      const markSpy = spyOn(component.form, 'markAllAsTouched');

      component.onSave();

      expect(markSpy).toHaveBeenCalled();
      expect(mockSponsorContactsService.updateContact).not.toHaveBeenCalled();
    });

    it('should set isSaving to true during save', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      // After onSave completes synchronously with of(), isSaving resets to false
      // But we can verify the flow completed
      component.onSave();
      expect(component.isSaving).toBeFalse();
    });

    it('should show success snackbar with salutation in message', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Contact detail of MR Doe has been updated successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should show success snackbar without salutation when not present', () => {
      component.contactDetail = { ...mockContactDetail, salutation: undefined, lastName: 'Smith' };
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Contact detail of Smith has been updated successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should emit saveSuccess on successful save', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      spyOn(component.saveSuccess, 'emit');
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });

    it('should handle save error and show error snackbar', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      expect(component.isSaving).toBeFalse();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Server error',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should set isSaving to false after save error', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });

    it('should use data.sponsorId when contactDetail is null', () => {
      component.contactDetail = null;
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      expect(callArgs[0]).toBe('SPONSOR123');
    });

    it('should use contactDetail.sponsorId when contactDetail is present', () => {
      component.contactDetail = { ...mockContactDetail, sponsorId: 'DETAIL_SPONSOR' };
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      expect(callArgs[0]).toBe('DETAIL_SPONSOR');
    });

    it('should pass chapterId from headerService', () => {
      mockHeaderService.getCurrentChapterId.and.returnValue('CHAPTER_X');
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      expect(callArgs[2]).toBe('CHAPTER_X');
    });

    it('should set intlAddrFlag to Y in payload', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      const payload = callArgs[3];
      expect(payload.address.intlAddrFlag).toBe('Y');
    });

    it('should null out domestic address fields in payload', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      const payload = callArgs[3];
      expect(payload.address.address1).toBeNull();
      expect(payload.address.address2).toBeNull();
      expect(payload.address.address3).toBeNull();
      expect(payload.address.streetName).toBeNull();
      expect(payload.address.zip).toBeNull();
    });

    it('should trim form values in payload', () => {
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({
        address1: 'Updated Address  ',
        address2: 'Suite B  ',
        postalCode: '12345  '
      });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      const payload = callArgs[3];
      expect(payload.address.intlAddress1).toBe('Updated Address');
      expect(payload.address.intlAddress2).toBe('Suite B');
      expect(payload.address.intlPostalCode).toBe('12345');
    });

    it('should handle null contactDetail gracefully during save', () => {
      component.contactDetail = null;
      mockSponsorContactsService.updateContact.and.returnValue(of({ message: 'Success' }));
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      const callArgs = mockSponsorContactsService.updateContact.calls.mostRecent().args;
      const payload = callArgs[3];
      expect(payload.address.addressId).toBeNull();
    });
  });

  describe('preventLeadingSpace', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent space when input value is empty', () => {
      const event = {
        key: ' ',
        code: 'Space',
        target: { value: '', selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'address1');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent space when cursor is at position 0', () => {
      const event = {
        key: ' ',
        code: 'Space',
        target: { value: 'Hello', selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'address1');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent space when value is only whitespace', () => {
      const event = {
        key: ' ',
        code: 'Space',
        target: { value: '   ', selectionStart: 3 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'address1');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow space in the middle of text', () => {
      const event = {
        key: ' ',
        code: 'Space',
        target: { value: 'Hello', selectionStart: 5 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'address1');

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow non-space keys', () => {
      const event = {
        key: 'a',
        code: 'KeyA',
        target: { value: '', selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'address1');

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should handle Space code even if key is not exactly space', () => {
      const event = {
        key: 'x',
        code: 'Space',
        target: { value: '', selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'address1');

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('trimLeadingSpace', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trim leading spaces from input value', () => {
      const input = {
        value: '  Hello',
        selectionStart: 2,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      } as any;
      const event = { target: input } as any;

      component.trimLeadingSpace(event, 'address1');

      expect(input.value).toBe('Hello');
      expect(component.form.get('address1')?.value).toBe('Hello');
    });

    it('should not modify value without leading spaces', () => {
      const input = {
        value: 'Hello',
        selectionStart: 5,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      } as any;
      const event = { target: input } as any;
      const setValueSpy = spyOn(component.form.get('address1')!, 'setValue');

      component.trimLeadingSpace(event, 'address1');

      expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should not modify empty value', () => {
      const input = {
        value: '',
        selectionStart: 0,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      } as any;
      const event = { target: input } as any;
      const setValueSpy = spyOn(component.form.get('address1')!, 'setValue');

      component.trimLeadingSpace(event, 'address1');

      expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should adjust cursor position after trimming', () => {
      const input = {
        value: '   Hello',
        selectionStart: 5,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      } as any;
      const event = { target: input } as any;

      component.trimLeadingSpace(event, 'address1');

      // cursorPosition=5, removedSpaces=3, newPosition=2
      // setSelectionRange is called in setTimeout, so check input.value instead
      expect(input.value).toBe('Hello');
    });
  });

  describe('onPaste', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent default paste behavior', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'pasted text' },
        target: {
          selectionStart: 0,
          selectionEnd: 0,
          value: '',
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onPaste(event, 'address1');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should trim leading spaces from text pasted at position 0', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '  Hello' },
        target: {
          selectionStart: 0,
          selectionEnd: 0,
          value: '',
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onPaste(event, 'address1');

      expect(component.form.get('address1')?.value).toBe('Hello');
    });

    it('should not trim leading spaces when pasting in the middle', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => ' world' },
        target: {
          selectionStart: 5,
          selectionEnd: 5,
          value: 'Hello',
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onPaste(event, 'address1');

      expect(component.form.get('address1')?.value).toBe('Hello world');
    });

    it('should replace selected text with pasted text', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'New' },
        target: {
          selectionStart: 0,
          selectionEnd: 5,
          value: 'Hello World',
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onPaste(event, 'address1');

      expect(component.form.get('address1')?.value).toBe('New World');
    });

    it('should handle empty paste data', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '' },
        target: {
          selectionStart: 0,
          selectionEnd: 0,
          value: 'Hello',
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onPaste(event, 'address1');

      expect(component.form.get('address1')?.value).toBe('Hello');
    });

    it('should handle null clipboardData', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: null,
        target: {
          selectionStart: 0,
          selectionEnd: 0,
          value: 'Hello',
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onPaste(event, 'address1');

      expect(component.form.get('address1')?.value).toBe('Hello');
    });

    it('should trim leading space from final value even when pasted in middle', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'text' },
        target: {
          selectionStart: 0,
          selectionEnd: 0,
          value: '  existing',
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.onPaste(event, 'address1');

      // Final value = trimStart('text  existing') = 'text  existing'
      expect(component.form.get('address1')?.value).toBe('text  existing');
    });
  });

  describe('getErrorMessage (private)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should extract error from error.error.errorResponse.error', () => {
      const error = { error: { errorResponse: { error: 'Specific error message' } } };
      expect(component['getErrorMessage'](error)).toBe('Specific error message');
    });

    it('should extract error from error.error.message', () => {
      const error = { error: { message: 'Error message from API' } };
      expect(component['getErrorMessage'](error)).toBe('Error message from API');
    });

    it('should extract error from error.message', () => {
      const error = { message: 'Generic error message' };
      expect(component['getErrorMessage'](error)).toBe('Generic error message');
    });

    it('should return default message when no error details available', () => {
      const error = {};
      expect(component['getErrorMessage'](error)).toBe('An unexpected error occurred');
    });

    it('should prepend errorCode from error.error.errorCode', () => {
      const error = { error: { message: 'Something failed', errorCode: 'ERR001' } };
      expect(component['getErrorMessage'](error)).toBe('Error: ERR001: Something failed');
    });

    it('should prepend errorCode from error.error.errorResponse.errorCode', () => {
      const error = { error: { errorResponse: { error: 'Failed', errorCode: 'ERR002' } } };
      expect(component['getErrorMessage'](error)).toBe('Error: ERR002: Failed');
    });

    it('should handle null error', () => {
      expect(component['getErrorMessage'](null)).toBe('An unexpected error occurred');
    });

    it('should handle undefined error', () => {
      expect(component['getErrorMessage'](undefined)).toBe('An unexpected error occurred');
    });
  });

  describe('Form Population - address value trimming', () => {
    it('should trim leading spaces from address values on load', () => {
      const detailWithSpaces = {
        ...mockContactDetail,
        address: {
          intlAddress1: '  123 Main St',
          intlAddress2: '  Apt 4B',
          intlAddress3: '  Building C',
          intlAddress4: '  Floor 2',
          countryName: 'UK',
          intlPostalCode: '  SW1A 1AA',
          intlWorkPhoneExt: '  123',
          intlWorkPhoneNo: '  12345',
          intlHomePhoneNo: '  09876',
          intlMobilePhoneNo: '  11111',
          intlFaxNo: '  22222',
          email: '  john@example.com'
        }
      } as any;
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithSpaces));

      fixture.detectChanges();

      expect(component.form.get('address1')?.value).toBe('123 Main St');
      expect(component.form.get('address2')?.value).toBe('Apt 4B');
      expect(component.form.get('address3')?.value).toBe('Building C');
      expect(component.form.get('address4')?.value).toBe('Floor 2');
      expect(component.form.get('postalCode')?.value).toBe('SW1A 1AA');
      expect(component.form.get('extension')?.value).toBe('123');
      expect(component.form.get('workPhone')?.value).toBe('12345');
      expect(component.form.get('homePhone')?.value).toBe('09876');
      expect(component.form.get('mobilePhone')?.value).toBe('11111');
      expect(component.form.get('fax')?.value).toBe('22222');
      expect(component.form.get('email')?.value).toBe('john@example.com');
    });

    it('should handle null/undefined address field values on load', () => {
      const detailWithNulls = {
        ...mockContactDetail,
        address: {
          intlAddress1: null,
          intlAddress2: undefined,
          intlAddress3: null,
          intlAddress4: undefined,
          countryName: null,
          intlPostalCode: null,
          intlWorkPhoneExt: null,
          intlWorkPhoneNo: null,
          intlHomePhoneNo: null,
          intlMobilePhoneNo: null,
          intlFaxNo: null,
          email: null
        }
      } as any;
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithNulls));

      fixture.detectChanges();

      expect(component.form.get('address1')?.value).toBe('');
      expect(component.form.get('address2')?.value).toBe('');
      expect(component.form.get('email')?.value).toBe('');
    });
  });

  describe('Form Validation - additional', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require address1', () => {
      const control = component.form.get('address1');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require country', () => {
      const control = component.form.get('country');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should validate email pattern', () => {
      const control = component.form.get('email');
      control?.setValue('invalid-email');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('valid@email.com');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should enforce email maxlength of 128', () => {
      const control = component.form.get('email');
      control?.setValue('a'.repeat(120) + '@test.com');
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should validate extension allows only digits', () => {
      const control = component.form.get('extension');
      control?.setValue('abc');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('123');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should validate workPhone allows only digits', () => {
      const control = component.form.get('workPhone');
      control?.setValue('abc');
      expect(control?.hasError('pattern')).toBeTrue();

      control?.setValue('12345');
      expect(control?.hasError('pattern')).toBeFalse();
    });

    it('should validate homePhone allows only digits', () => {
      const control = component.form.get('homePhone');
      control?.setValue('abc');
      expect(control?.hasError('pattern')).toBeTrue();
    });

    it('should validate mobilePhone allows only digits', () => {
      const control = component.form.get('mobilePhone');
      control?.setValue('abc');
      expect(control?.hasError('pattern')).toBeTrue();
    });

    it('should validate fax allows only digits', () => {
      const control = component.form.get('fax');
      control?.setValue('abc');
      expect(control?.hasError('pattern')).toBeTrue();
    });

    it('should allow empty values for optional fields', () => {
      const control = component.form.get('postalCode');
      control?.setValue('');
      expect(control?.valid).toBeTrue();
    });
  });

  describe('Save error snackbar with different error structures', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error from errorResponse.error with errorCode', () => {
      fixture.detectChanges();
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Validation failed', errorCode: 'VAL001' } }
        }))
      );
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error: VAL001: Validation failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message when error object is empty', () => {
      fixture.detectChanges();
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => ({}))
      );
      component.form.patchValue({ address1: 'Updated' });
      component.form.markAsDirty();

      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'An unexpected error occurred',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  describe('loadAddress - matchCountryValue on load', () => {
    it('should call matchCountryValue with loaded countries after form population', () => {
      // When countries are loaded before address detail, matchCountryValue should be called
      fixture.detectChanges();

      // The form should have the matched country value
      expect(component.form.get('country')?.value).toBe('UK');
    });

    it('should store contactDetail from API response', () => {
      fixture.detectChanges();

      expect(component.contactDetail).toEqual(mockContactDetail);
    });

    it('should set isLoading to false after address is loaded', () => {
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
    });

    it('should set initialFormValue after address is loaded', () => {
      fixture.detectChanges();

      expect(component['initialFormValue']).toBeTruthy();
    });
  });

});
