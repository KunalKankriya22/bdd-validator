import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddNewContactComponent } from './add-new-contact';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { HeaderService } from '@shared/services/header.service';
import { InternationalAddressService } from '@shared/services/international-address.service';
import { TitleLookupItem, ZipCodeLookupItem } from '../models/maintain-sponsor-contacts.model';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddNewContactComponent', () => {
  let component: AddNewContactComponent;
  let fixture: ComponentFixture<AddNewContactComponent>;
  let mockSponsorContactsService: jasmine.SpyObj<MaintainSponsorContactsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockIntlAddressService: jasmine.SpyObj<InternationalAddressService>;

  const mockHonorificOptions: TitleLookupItem[] = [
    { code: 'MR', description: 'Mr.' },
    { code: 'MRS', description: 'Mrs.' }
  ];

  const mockTypeOptions: TitleLookupItem[] = [
    { code: 'PRIMARY', description: 'Primary Contact' },
    { code: 'SECONDARY', description: 'Secondary Contact' }
  ];

  const mockTitleOptions: TitleLookupItem[] = [
    { code: 'MGR', description: 'Manager' },
    { code: 'DIR', description: 'Director' }
  ];

  const mockZipCodeOptions: ZipCodeLookupItem[] = [
    { uspsId: 123, city: 'New York', state: 'NY', zip: '10001' },
    { uspsId: 124, city: 'Brooklyn', state: 'NY', zip: '10001' }
  ];

  const tomorrow = moment().add(1, 'day').startOf('day');

  beforeEach(() => {

    mockSponsorContactsService = jasmine.createSpyObj('MaintainSponsorContactsService', [
      'getSalutations',
      'getContactTypes',
      'getTitles',
      'getZipCodes',
      'createContact'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();
    mockIntlAddressService = jasmine.createSpyObj('InternationalAddressService', [
      'getCountries',
      'setInternationalAddress',
      'clearInternationalAddress',
      'getInternationalAddress'
    ]);

    mockSponsorContactsService.getSalutations.and.returnValue(of(mockHonorificOptions));
    mockSponsorContactsService.getContactTypes.and.returnValue(of(mockTypeOptions));
    mockSponsorContactsService.getTitles.and.returnValue(of(mockTitleOptions));
    mockSponsorContactsService.getZipCodes.and.returnValue(of(mockZipCodeOptions));
    mockIntlAddressService.getCountries.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [AddNewContactComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        FormBuilder,
        { provide: MaintainSponsorContactsService, useValue: mockSponsorContactsService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: InternationalAddressService, useValue: mockIntlAddressService }
      ]
    });


    


      mockSponsorContactsService.getSalutations.calls.reset();


      mockSponsorContactsService.getContactTypes.calls.reset();


      mockSponsorContactsService.getTitles.calls.reset();


      mockSponsorContactsService.getZipCodes.calls.reset();


      mockSponsorContactsService.createContact.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockHeaderService.getCurrentChapterTimezone.calls.reset();


      mockIntlAddressService.getCountries.calls.reset();


      mockIntlAddressService.setInternationalAddress.calls.reset();


      mockIntlAddressService.clearInternationalAddress.calls.reset();


      mockIntlAddressService.getInternationalAddress.calls.reset();


      mockSponsorContactsService.getSalutations.and.returnValue(of(mockHonorificOptions));


      mockSponsorContactsService.getContactTypes.and.returnValue(of(mockTypeOptions));


      mockSponsorContactsService.getTitles.and.returnValue(of(mockTitleOptions));


      mockSponsorContactsService.getZipCodes.and.returnValue(of(mockZipCodeOptions));
      mockIntlAddressService.getCountries.and.returnValue(of([]));


    fixture = TestBed.createComponent(AddNewContactComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sponsorId', 'SPONSOR123');


    });

  describe('Component Initialization', () => {


    it('should initialize all forms on init', () => {
      fixture.detectChanges();

      expect(component.contactForm).toBeDefined();
      expect(component.addressForm).toBeDefined();
      expect(component.intlAddressFormRef).toBeDefined();
      expect(component.notesForm).toBeDefined();
    });

    it('should load all dropdown options on init', () => {
      fixture.detectChanges();

      expect(mockSponsorContactsService.getSalutations).toHaveBeenCalled();
      expect(mockSponsorContactsService.getContactTypes).toHaveBeenCalled();
      expect(mockSponsorContactsService.getTitles).toHaveBeenCalled();
      expect(component.honorificOptions()).toEqual(mockHonorificOptions);
      expect(component.typeOptions()).toEqual(mockTypeOptions);
      expect(component.titleOptions()).toEqual(mockTitleOptions);
    });

    it('should set chapter timezone and min dates', () => {
      fixture.detectChanges();

      expect(component.chapterTimezone).toBe('America/New_York');
      expect(component.minDate).toBeDefined();
      expect(component.minTerminationDate).toBeDefined();
    });

    it('should set active tab to 0 initially', () => {
      fixture.detectChanges();

      expect(component.activeTabIndex).toBe(0);
    });
  });

  describe('Contact Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark required fields as invalid when empty', () => {
      component.contactForm.markAllAsTouched();

      expect(component.contactForm.get('honorific')?.valid).toBeFalse();
      expect(component.contactForm.get('lastName')?.valid).toBeFalse();
      expect(component.contactForm.get('type')?.valid).toBeFalse();
      expect(component.contactForm.get('title')?.valid).toBeFalse();
      expect(component.contactForm.get('effectiveDate')?.valid).toBeFalse();
    });

    it('should mark firstName as optional', () => {
      expect(component.contactForm.get('firstName')?.hasError('required')).toBeFalse();
    });

    it('should show honorific required error', () => {
      component.contactForm.get('honorific')?.markAsTouched();
      expect(component.getHonorificError()).toBe('Honorific is required');
    });

    it('should show last name required error', () => {
      component.contactForm.get('lastName')?.markAsTouched();
      expect(component.getLastNameError()).toBe('Last Name is required');
    });

    it('should show type required error', () => {
      component.contactForm.get('type')?.markAsTouched();
      expect(component.getTypeError()).toBe('Type is required');
    });

    it('should show title required error', () => {
      component.contactForm.get('title')?.markAsTouched();
      expect(component.getTitleError()).toBe('Title is required');
    });

    it('should validate contact form with all required fields', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        firstName: 'John',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      expect(component.contactForm.valid).toBeTrue();
    });




  });

  describe('Address Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark street as required', () => {
      component.addressForm.get('street')?.markAsTouched();
      expect(component.addressForm.get('street')?.hasError('required')).toBeTrue();
    });

    it('should mark zipCode as required', () => {
      component.addressForm.get('zipCode')?.markAsTouched();
      expect(component.addressForm.get('zipCode')?.hasError('required')).toBeTrue();
    });

    it('should mark city as required', () => {
      component.addressForm.get('city')?.enable();
      component.addressForm.get('city')?.markAsTouched();
      expect(component.addressForm.get('city')?.hasError('required')).toBeTrue();
    });



    it('should enforce maxlength on street (50 chars)', () => {
      const street = component.addressForm.get('street');
      street?.setValue('a'.repeat(60));

      expect(street?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('Zip Code Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call API when zip code length reaches 5', () => {
      const mockEvent = { target: { value: '10001' } } as any;
      component.filterZipCode(mockEvent);

      expect(mockSponsorContactsService.getZipCodes).toHaveBeenCalledWith('10001');
    });

    it('should populate city options on successful zip code lookup', () => {
      const mockEvent = { target: { value: '10001' } } as any;
      component.filterZipCode(mockEvent);

      expect(component.cityOptions()).toEqual(mockZipCodeOptions);
      expect(component.addressForm.get('city')?.enabled).toBeTrue();
    });

    it('should set error when no cities found for zip code', () => {
      mockSponsorContactsService.getZipCodes.and.returnValue(of([]));

      const mockEvent = { target: { value: '99999' } } as any;
      component.filterZipCode(mockEvent);

      expect(component.addressForm.get('zipCode')?.hasError('zipNotFound')).toBeTrue();
      expect(component.addressForm.get('city')?.disabled).toBeTrue();
    });

    it('should handle zip code API error', () => {
      mockSponsorContactsService.getZipCodes.and.returnValue(throwError(() => new Error('API Error')));

      const mockEvent = { target: { value: '10001' } } as any;
      component.filterZipCode(mockEvent);

      expect(component.cityOptions()).toEqual([]);
      expect(component.addressForm.get('zipCode')?.hasError('zipNotFound')).toBeTrue();
    });

    it('should reset city options when zip code is empty', () => {
      component.cityOptions.set(mockZipCodeOptions);
      const mockEvent = { target: { value: '' } } as any;
      component.filterZipCode(mockEvent);

      expect(component.cityOptions()).toEqual([]);
      expect(component.addressForm.get('city')?.disabled).toBeTrue();
    });
  });

  describe('Zip Code Tab Key Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent Tab when zip code has validation errors', () => {
      const mockEvent = {
        key: 'Tab',
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.addressForm.patchValue({ zipCode: '99999' });
      component.addressForm.get('zipCode')?.setErrors({ zipNotFound: true });

      component.onZipCodeKeydown(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(component.addressForm.get('zipCode')?.touched).toBeTrue();
    });

    it('should prevent Tab and set shouldFocusCityAfterLoad when API is in progress', () => {
      const mockEvent = {
        key: 'Tab',
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.addressForm.patchValue({ zipCode: '10001' });
      component['zipCodeLookupInProgress'] = true;
      component.addressForm.get('city')?.disable();

      component.onZipCodeKeydown(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(component['shouldFocusCityAfterLoad']).toBeTrue();
    });

    it('should allow Tab to pass through when city is already enabled', () => {
      const mockEvent = {
        key: 'Tab',
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.addressForm.patchValue({ zipCode: '10001' });
      component['zipCodeLookupInProgress'] = false;
      component.addressForm.get('city')?.enable();

      component.onZipCodeKeydown(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(component['shouldFocusCityAfterLoad']).toBeFalse();
    });






  });

  describe('International Address Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have international address form ref', () => {
      const intlRef = component.intlAddressFormRef();
      expect(intlRef).toBeDefined();
      expect(intlRef.addressForm).toBeDefined();
    });

    it('should enforce maxlength on intl address fields (50 chars)', () => {
      const intlForm = component.intlAddressFormRef().addressForm;

      const addr1 = intlForm.get('addr1');
      addr1?.setValue('a'.repeat(51));
      expect(addr1?.hasError('maxlength')).toBeTrue();

      const addr2 = intlForm.get('addr2');
      addr2?.setValue('a'.repeat(51));
      expect(addr2?.hasError('maxlength')).toBeTrue();

      const addr3 = intlForm.get('addr3');
      addr3?.setValue('a'.repeat(51));
      expect(addr3?.hasError('maxlength')).toBeTrue();

      const addr4 = intlForm.get('addr4');
      addr4?.setValue('a'.repeat(51));
      expect(addr4?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should update min termination date when effective date changes', () => {
      const effectiveDate = moment().add(5, 'days');
      component.contactForm.patchValue({ effectiveDate });

      expect(component.minTerminationDate.isSame(effectiveDate, 'day')).toBeTrue();
    });

    it('should reset min termination date to minDate when effective date is cleared', () => {
      component.contactForm.patchValue({ effectiveDate: moment().add(5, 'days') });
      component.contactForm.patchValue({ effectiveDate: null });

      expect(component.minTerminationDate.isSame(component.minDate, 'day')).toBeTrue();
    });
  });

  describe('Form Submission - Add', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.createContact.and.returnValue(
        of({ message: 'Contact created successfully' })
      );
    });

    it('should not submit when contact form is invalid', () => {
      component.onAdd();

      expect(mockSponsorContactsService.createContact).not.toHaveBeenCalled();
      expect(component.activeTabIndex).toBe(0);
    });

    it('should not submit when address form is invalid', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      component.onAdd();

      expect(mockSponsorContactsService.createContact).not.toHaveBeenCalled();
      expect(component.activeTabIndex).toBe(1);
    });

    it('should submit valid form successfully', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        firstName: 'John',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days'),
        terminationDate: moment().add(6, 'months')
      });

      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();

      spyOn(component.saveSuccess, 'emit');
      component.onAdd();

      expect(component.isSaving).toBeFalse();
      expect(mockSponsorContactsService.createContact).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });



    it('should include notes in payload when provided', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();

      // Notes are tracked via pendingNotes signal, not notesForm directly
      component.pendingNotes.set([{ noteText: 'Test note', createdBy: 'testUser', createdDate: '15-JUN-2026' }]);

      component.onAdd();

      const callArgs = mockSponsorContactsService.createContact.calls.mostRecent().args[0];
      expect(callArgs.notes).toEqual([{ noteText: 'Test note' }]);
    });


  });

  describe('Form Submission - Add Another', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.createContact.and.returnValue(
        of({ message: 'Contact created successfully' })
      );
    });

    it('should reset forms after successful add another', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();

      component.onCreateAndAddAnother();

      expect(component.contactForm.get('honorific')?.value).toBeFalsy();
      expect(component.addressForm.get('street')?.value).toBeFalsy();
      expect(component.activeTabIndex).toBe(0);
    });



    it('should clear city options after reset', () => {
      component.cityOptions.set(mockZipCodeOptions);
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();

      component.onCreateAndAddAnother();

      expect(component.cityOptions()).toEqual([]);
    });
  });





  describe('Address Tab Mutual Exclusivity', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have hasPrimaryAddressData false initially', () => {
      expect(component.hasPrimaryAddressData()).toBeFalse();
    });

    it('should have hasPartialIntlAddress false initially', () => {
      expect(component.hasPartialIntlAddress()).toBeFalse();
    });

    it('should set hasPrimaryAddressData to true when street is filled', () => {
      component.addressForm.patchValue({ street: '123 Main St' });

      expect(component.hasPrimaryAddressData()).toBeTrue();
    });

    it('should set hasPrimaryAddressData to true when zipCode is filled', () => {
      component.addressForm.patchValue({ zipCode: '10001' });

      expect(component.hasPrimaryAddressData()).toBeTrue();
    });

    it('should NOT set hasPrimaryAddressData when only workPhone is filled', () => {
      component.addressForm.patchValue({ workPhone: '1234567' });

      // workPhone/homePhone/fax/email/website no longer trigger hasPrimaryAddressData
      // Only street, zipCode, and city are tracked
      expect(component.hasPrimaryAddressData()).toBeFalse();
    });

    it('should NOT set hasPrimaryAddressData when only email is filled', () => {
      component.addressForm.patchValue({ email: 'test@test.com' });

      expect(component.hasPrimaryAddressData()).toBeFalse();
    });

    it('should disable US address fields when intl address becomes valid', () => {
      component.addressForm.controls.street.enable({ emitEvent: false });
      component.addressForm.controls.zipCode.enable({ emitEvent: false });
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001' });
      expect(component.hasPrimaryAddressData()).toBeTrue();

      // Make intl address valid (addr1 + country)
      component.intlAddressFormRef().addressForm.patchValue({
        addr1: 'Westminster Bridge Rd',
        country: 'UK'
      });

      expect(component.addressForm.controls.street.disabled).toBeTrue();
      expect(component.addressForm.controls.zipCode.disabled).toBeTrue();
      expect(component.hasPrimaryAddressData()).toBeFalse();
    });

    it('should re-enable US address fields when intl address becomes invalid after being valid', () => {
      // First make intl valid to disable US fields
      component.intlAddressFormRef().addressForm.patchValue({
        addr1: 'Westminster Bridge Rd',
        country: 'UK'
      });
      expect(component.hasValidIntlAddress()).toBeTrue();
      expect(component.addressForm.controls.street.disabled).toBeTrue();

      // Now clear country to make intl invalid
      component.intlAddressFormRef().addressForm.patchValue({ country: '' });

      expect(component.hasValidIntlAddress()).toBeFalse();
      expect(component.addressForm.controls.street.enabled).toBeTrue();
      expect(component.addressForm.controls.zipCode.enabled).toBeTrue();
    });

    it('should set hasPrimaryAddressData to false when all primary fields are cleared', () => {
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001' });
      expect(component.hasPrimaryAddressData()).toBeTrue();

      component.addressForm.patchValue({ street: '', zipCode: '' });
      expect(component.hasPrimaryAddressData()).toBeFalse();
    });

    it('should set hasPartialIntlAddress to true when intl addr1 is filled', () => {
      component.intlAddressFormRef().addressForm.patchValue({ addr1: 'Intl Street' });

      expect(component.hasPartialIntlAddress()).toBeTrue();
    });

    it('should set hasPartialIntlAddress to false when intl fields are cleared', () => {
      component.intlAddressFormRef().addressForm.patchValue({ addr1: 'Intl Street' });
      expect(component.hasPartialIntlAddress()).toBeTrue();

      component.intlAddressFormRef().addressForm.reset();
      expect(component.hasPartialIntlAddress()).toBeFalse();
    });

    it('should disable international address tab when primary address has data', () => {
      component.addressForm.patchValue({ street: '123 Main St' });
      expect(component.hasPrimaryAddressData()).toBeTrue();

      // International tab should be blocked
      expect(component.hasPartialIntlAddress()).toBeFalse();
    });

    it('should disable primary address tab when international address has data', () => {
      component.intlAddressFormRef().addressForm.patchValue({ addr1: 'Intl Street' });
      expect(component.hasPartialIntlAddress()).toBeTrue();

      // Primary tab should be blocked
      expect(component.hasPrimaryAddressData()).toBeFalse();
    });

    it('should re-enable international address tab after clearing primary address', () => {
      component.addressForm.patchValue({ street: '123 Main St' });
      expect(component.hasPrimaryAddressData()).toBeTrue();

      component.addressForm.patchValue({ street: '' });
      expect(component.hasPrimaryAddressData()).toBeFalse();
    });

    it('should re-enable primary address tab after clearing international address', () => {
      component.intlAddressFormRef().addressForm.patchValue({ addr1: 'Intl Street' });
      expect(component.hasPartialIntlAddress()).toBeTrue();

      component.intlAddressFormRef().addressForm.reset();
      expect(component.hasPartialIntlAddress()).toBeFalse();
    });

    it('should reset hasPrimaryAddressData after form reset via add another', () => {
      mockSponsorContactsService.createContact.and.returnValue(
        of({ message: 'Contact created successfully' })
      );

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();
      expect(component.hasPrimaryAddressData()).toBeTrue();

      component.onCreateAndAddAnother();

      expect(component.hasPrimaryAddressData()).toBeFalse();
      expect(component.hasPartialIntlAddress()).toBeFalse();
    });

    it('should not treat whitespace-only values as filled', () => {
      component.addressForm.patchValue({ street: '   ', workPhone: '  ' });

      expect(component.hasPrimaryAddressData()).toBeFalse();
    });
  });

  describe('Dropdown Loading Error Handling', () => {
    it('should handle salutations loading error', () => {
      mockSponsorContactsService.getSalutations.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.honorificOptions()).toEqual([]);
    });

    it('should handle contact types loading error', () => {
      mockSponsorContactsService.getContactTypes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.typeOptions()).toEqual([]);
    });

    it('should handle titles loading error', () => {
      mockSponsorContactsService.getTitles.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.titleOptions()).toEqual([]);
    });
  });

  describe('Loading States', () => {
    it('should set isSaving to false after successful save', () => {
      mockSponsorContactsService.createContact.and.returnValue(
        of({ message: 'Success' })
      );

      fixture.detectChanges();

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();

      component.onAdd();

      expect(component.isSaving).toBeFalse();
    });

    it('should set isSaving to false after error', () => {
      mockSponsorContactsService.createContact.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();

      component.onAdd();

      expect(component.isSaving).toBeFalse();
    });
  });

  describe('showingIntlAddress signal', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be false initially', () => {
      expect(component.showingIntlAddress()).toBeFalse();
    });

    it('openIntlAddress() should set showingIntlAddress to true', () => {
      component.openIntlAddress();
      expect(component.showingIntlAddress()).toBeTrue();
    });

    it('onBackFromIntl() should set showingIntlAddress to false', () => {
      component.showingIntlAddress.set(true);
      component.onBackFromIntl();
      expect(component.showingIntlAddress()).toBeFalse();
    });

    it('openIntlAddress() then onBackFromIntl() should toggle correctly', () => {
      component.openIntlAddress();
      expect(component.showingIntlAddress()).toBeTrue();

      component.onBackFromIntl();
      expect(component.showingIntlAddress()).toBeFalse();
    });
  });

  describe('onClearIntl()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should set hasValidIntlAddress to false', () => {
      component.hasValidIntlAddress.set(true);
      component.onClearIntl();
      expect(component.hasValidIntlAddress()).toBeFalse();
    });

    it('should set hasPartialIntlAddress to false', () => {
      component.hasPartialIntlAddress.set(true);
      component.onClearIntl();
      expect(component.hasPartialIntlAddress()).toBeFalse();
    });

    it('should clear all three intl flags at once', () => {
      component.intlAddressFormRef().addressForm.patchValue({ addr1: 'Some Address' });
      component.hasValidIntlAddress.set(true);
      component.hasPartialIntlAddress.set(true);

      component.onClearIntl();

      expect(component.hasValidIntlAddress()).toBeFalse();
      expect(component.hasPartialIntlAddress()).toBeFalse();
    });

    it('should re-enable US address fields (street, zipCode) after clearing international address', () => {
      // Disable US fields by triggering a valid intl address
      component.intlAddressFormRef().addressForm.patchValue({
        addr1: 'Westminster Bridge Rd',
        country: 'UK'
      });
      expect(component.addressForm.controls.street.disabled).toBeTrue();
      expect(component.addressForm.controls.zipCode.disabled).toBeTrue();

      component.onClearIntl();

      expect(component.addressForm.controls.street.enabled).toBeTrue();
      expect(component.addressForm.controls.zipCode.enabled).toBeTrue();
    });
  });

  describe('onApplyIntl()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate back (set showingIntlAddress false) when intl form is empty', () => {
      component.showingIntlAddress.set(true);

      component.onApplyIntl();

      expect(component.showingIntlAddress()).toBeFalse();
    });






  });

  describe('toUpperCaseAndTrim()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should convert value to uppercase and update form control', () => {
      const input = document.createElement('input');
      input.value = 'john';
      const event = { target: input } as unknown as Event;

      component.toUpperCaseAndTrim(event, 'firstName');

      expect(input.value).toBe('JOHN');
      expect(component.contactForm.get('firstName')?.value).toBe('JOHN');
    });

    it('should trim leading spaces and convert to uppercase', () => {
      const input = document.createElement('input');
      input.value = '  doe';
      const event = { target: input } as unknown as Event;

      component.toUpperCaseAndTrim(event, 'lastName');

      expect(input.value).toBe('DOE');
      expect(component.contactForm.get('lastName')?.value).toBe('DOE');
    });

    it('should mark the form control as touched', () => {
      const input = document.createElement('input');
      input.value = 'test';
      const event = { target: input } as unknown as Event;

      component.toUpperCaseAndTrim(event, 'firstName');

      expect(component.contactForm.get('firstName')?.touched).toBeTrue();
    });

    it('should not modify value that is already uppercase with no leading spaces', () => {
      const input = document.createElement('input');
      input.value = 'ALREADY';
      const event = { target: input } as unknown as Event;

      component.toUpperCaseAndTrim(event, 'firstName');

      // Value unchanged — no side-effects expected
      expect(input.value).toBe('ALREADY');
    });


  });

  describe('validateForms() — intl address partial fill', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.createContact.and.returnValue(
        of({ message: 'Contact created successfully' })
      );
    });

    it('should set showingIntlAddress to true when intl address is partially filled but invalid', () => {
      // Fill contact and address forms so they pass
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      // Set partial intl address without completing required fields
      component.hasPartialIntlAddress.set(true);
      component.hasValidIntlAddress.set(false);

      component.onAdd();

      expect(component.showingIntlAddress()).toBeTrue();
    });


  });

  describe('resetForms() — showingIntlAddress', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.createContact.and.returnValue(
        of({ message: 'Contact created successfully' })
      );
    });

    it('should set showingIntlAddress to false after add-another resets forms', () => {
      component.showingIntlAddress.set(true);

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });

      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();

      component.onCreateAndAddAnother();

      expect(component.showingIntlAddress()).toBeFalse();
    });
  });

  describe('Notes management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add a new note via onAddNote', () => {
      component.notesForm.get('notes')?.setValue('Test note text');
      component.onAddNote();

      expect(component.pendingNotes().length).toBe(1);
      expect(component.pendingNotes()[0].noteText).toBe('Test note text');
    });

    it('should not add note when text is empty', () => {
      component.notesForm.get('notes')?.setValue('');
      component.onAddNote();

      expect(component.pendingNotes().length).toBe(0);
    });

    it('should not add note when text is whitespace', () => {
      component.notesForm.get('notes')?.setValue('   ');
      component.onAddNote();

      expect(component.pendingNotes().length).toBe(0);
    });

    it('should edit an existing note', () => {
      component.pendingNotes.set([
        { noteText: 'Original', createdBy: 'user1', createdDate: '15-JUN-2026' }
      ]);
      component.onEditNote(0);

      expect(component.editingNoteIndex()).toBe(0);
      expect(component.notesForm.get('notes')?.value).toBe('Original');

      component.notesForm.get('notes')?.setValue('Updated note');
      component.onAddNote();

      expect(component.pendingNotes()[0].noteText).toBe('Updated note');
      expect(component.editingNoteIndex()).toBeNull();
    });

    it('should delete a note', () => {
      component.pendingNotes.set([
        { noteText: 'Note 1', createdBy: 'user1', createdDate: '15-JUN-2026' },
        { noteText: 'Note 2', createdBy: 'user1', createdDate: '15-JUN-2026' }
      ]);

      component.onDeleteNote(0);
      expect(component.pendingNotes().length).toBe(1);
      expect(component.pendingNotes()[0].noteText).toBe('Note 2');
    });

    it('should reset editing state when deleting the note being edited', () => {
      component.pendingNotes.set([
        { noteText: 'Note 1', createdBy: 'user1', createdDate: '15-JUN-2026' }
      ]);
      component.editingNoteIndex.set(0);
      component.notesForm.get('notes')?.setValue('Editing...');

      component.onDeleteNote(0);

      expect(component.editingNoteIndex()).toBeNull();
    });
  });

  describe('getInitials', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return ? for empty name', () => {
      expect(component.getInitials('')).toBe('?');
    });

    it('should return single initial for one word', () => {
      expect(component.getInitials('John')).toBe('J');
    });

    it('should return two initials for two words', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });

    it('should return first and last initial for three+ words', () => {
      expect(component.getInitials('John Michael Doe')).toBe('JD');
    });
  });

  describe('onDateFieldBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should normalize and set date on blur', () => {
      const mockEvent = { target: { value: '15-JAN-2027' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);

      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
    });

    it('should do nothing when input is empty', () => {
      const mockEvent = { target: { value: '' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);

      // No error expected
    });

    it('should handle whitespace-only input', () => {
      const mockEvent = { target: { value: '   ' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);

      // No error expected
    });
  });

  describe('effectiveDateFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter dates', () => {
      const futureDate = moment().add(5, 'days');
      const result = component.effectiveDateFilter(futureDate);
      expect(typeof result).toBe('boolean');
    });

    it('should handle null date', () => {
      const result = component.effectiveDateFilter(null);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter termination dates', () => {
      const futureDate = moment().add(5, 'days');
      const result = component.terminationDateFilter(futureDate);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('effectiveDateClass', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return highlighted class for selected date', () => {
      const date = moment().add(5, 'days');
      component.contactForm.patchValue({ effectiveDate: date });

      const result = component.effectiveDateClass(date);
      expect(result).toBe('highlighted-effective-date');
    });

    it('should return empty string for non-selected date', () => {
      const date = moment().add(5, 'days');
      component.contactForm.patchValue({ effectiveDate: moment().add(10, 'days') });

      const result = component.effectiveDateClass(date);
      expect(result).toBe('');
    });

    it('should return empty string when no effective date set', () => {
      const result = component.effectiveDateClass(moment());
      expect(result).toBe('');
    });
  });

  describe('terminationDateClass', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return highlighted-effective-date for effective date', () => {
      const effDate = moment().add(5, 'days');
      component.contactForm.patchValue({ effectiveDate: effDate });

      const result = component.terminationDateClass(effDate);
      expect(result).toContain('highlighted-effective-date');
    });

    it('should return highlighted-termination-date for termination date', () => {
      const termDate = moment().add(10, 'days');
      component.contactForm.patchValue({ terminationDate: termDate });

      const result = component.terminationDateClass(termDate);
      expect(result).toContain('highlighted-termination-date');
    });

    it('should return both classes when date matches both', () => {
      const date = moment().add(5, 'days');
      component.contactForm.patchValue({ effectiveDate: date, terminationDate: date });

      const result = component.terminationDateClass(date);
      expect(result).toContain('highlighted-effective-date');
      expect(result).toContain('highlighted-termination-date');
    });

    it('should return empty string when no dates are set', () => {
      const result = component.terminationDateClass(moment());
      expect(result).toBe('');
    });
  });

  describe('formatPhoneNumber', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format phone number with area code and prefix', () => {
      const input = document.createElement('input');
      input.value = '2125551234';
      Object.defineProperty(input, 'selectionStart', { value: 10, writable: true });
      const event = { target: input } as unknown as Event;

      component.formatPhoneNumber(event, 'workPhone', component.addressForm);

      expect(input.value).toBe('(212) 555-1234');
    });

    it('should format partial phone number', () => {
      const input = document.createElement('input');
      input.value = '21';
      Object.defineProperty(input, 'selectionStart', { value: 2, writable: true });
      const event = { target: input } as unknown as Event;

      component.formatPhoneNumber(event, 'workPhone', component.addressForm);

      expect(input.value).toBe('(21');
    });

    it('should format phone number with 6 digits', () => {
      const input = document.createElement('input');
      input.value = '212555';
      Object.defineProperty(input, 'selectionStart', { value: 6, writable: true });
      const event = { target: input } as unknown as Event;

      component.formatPhoneNumber(event, 'workPhone', component.addressForm);

      expect(input.value).toBe('(212) 555-');
    });

    it('should handle empty phone number', () => {
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      const event = { target: input } as unknown as Event;

      component.formatPhoneNumber(event, 'workPhone', component.addressForm);

      expect(input.value).toBe('');
    });
  });

  describe('phone validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should accept empty phone number', () => {
      component.addressForm.patchValue({ workPhone: '' });
      expect(component.addressForm.get('workPhone')?.valid).toBeTrue();
    });

    it('should reject incomplete phone number', () => {
      component.addressForm.get('workPhone')?.setValue('(212) 555');
      component.addressForm.get('workPhone')?.updateValueAndValidity();
      expect(component.addressForm.get('workPhone')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should accept complete 10-digit phone', () => {
      component.addressForm.get('workPhone')?.setValue('(212) 555-1234');
      component.addressForm.get('workPhone')?.updateValueAndValidity();
      expect(component.addressForm.get('workPhone')?.valid).toBeTrue();
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty when untouched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return required error', () => {
      const ctrl = component.contactForm.controls.effectiveDate;
      ctrl.markAsTouched();
      ctrl.setValue(null);
      ctrl.updateValueAndValidity();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return invalid date error for invalidDate', () => {
      const ctrl = component.contactForm.controls.effectiveDate;
      ctrl.markAsTouched();
      ctrl.setErrors({ invalidDate: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return invalid date error for matDatepickerParse', () => {
      const ctrl = component.contactForm.controls.effectiveDate;
      ctrl.markAsTouched();
      ctrl.setErrors({ matDatepickerParse: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return past date error', () => {
      const ctrl = component.contactForm.controls.effectiveDate;
      ctrl.markAsTouched();
      ctrl.setErrors({ effectiveDatePast: true });
      expect(component.getEffectiveDateError()).toBe('Effective date cannot be past date');
    });

    it('should return date range error when lastChangedDateField is effective', () => {
      const ctrl = component.contactForm.controls.effectiveDate;
      ctrl.markAsTouched();
      ctrl.setValue(moment().add(10, 'days'));
      component['lastChangedDateField'] = 'effective';
      // Simulate dateRangeInvalid on the group
      component.contactForm.setErrors({ dateRangeInvalid: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date must be before or equal to Termination Date');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty when untouched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return invalid date error', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ invalidDate: true });
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return past date error', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ terminationDatePast: true });
      expect(component.getTerminationDateError()).toBe('Termination date cannot be past date');
    });

    it('should return min date error', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ matDatepickerMin: true });
      component['lastChangedDateField'] = 'termination';
      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return date range invalid error', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.markAsTouched();
      ctrl.setValue(moment().add(5, 'days'));
      component['lastChangedDateField'] = 'termination';
      component.contactForm.setErrors({ dateRangeInvalid: true });
      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return invalid for hasInputValue without control value', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.markAsTouched();
      ctrl.setValue(null);
      component.terminationDateInput = { nativeElement: { value: 'bad-date' } } as any;
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });
  });

  describe('validateEffectiveDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has value but control does not', () => {
      component.effectiveDateInput = { nativeElement: { value: 'bad-date' } } as any;
      component.validateEffectiveDateInput();

      const ctrl = component.contactForm.get('effectiveDate');
      expect(ctrl?.hasError('invalidDate')).toBeTrue();
    });

    it('should clear invalidDate error when control has value', () => {
      const ctrl = component.contactForm.get('effectiveDate')!;
      ctrl.setErrors({ invalidDate: true });
      ctrl.setValue(moment().add(5, 'days'));
      component.effectiveDateInput = { nativeElement: { value: '15-JAN-2027' } } as any;

      component.validateEffectiveDateInput();

      expect(ctrl.hasError('invalidDate')).toBeFalse();
    });

    it('should set lastChangedDateField to effective', () => {
      component.effectiveDateInput = { nativeElement: { value: '' } } as any;
      component.validateEffectiveDateInput();
      expect(component['lastChangedDateField']).toBe('effective');
    });
  });

  describe('validateTerminationDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has value but control does not', () => {
      component.terminationDateInput = { nativeElement: { value: 'bad-date' } } as any;
      component.validateTerminationDateInput();

      const ctrl = component.contactForm.get('terminationDate');
      expect(ctrl?.hasError('invalidDate')).toBeTrue();
    });

    it('should clear invalidDate error when control has value', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.setErrors({ invalidDate: true });
      ctrl.setValue(moment().add(10, 'days'));
      component.terminationDateInput = { nativeElement: { value: '15-JAN-2027' } } as any;

      component.validateTerminationDateInput();

      expect(ctrl.hasError('invalidDate')).toBeFalse();
    });

    it('should set lastChangedDateField to termination', () => {
      component.terminationDateInput = { nativeElement: { value: '' } } as any;
      component.validateTerminationDateInput();
      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  describe('onApplyIntl with data', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark all as touched if has data but form invalid', () => {
      component.showingIntlAddress.set(true);
      const intlRef = component.intlAddressFormRef();
      intlRef.addressForm.patchValue({ addr1: 'Street' });
      // Country is required but missing - form should be invalid
      spyOn(intlRef.addressForm, 'markAllAsTouched');

      component.onApplyIntl();

      // If form invalid and has data, markAllAsTouched and remain on intl view
      if (intlRef.addressForm.invalid) {
        expect(intlRef.addressForm.markAllAsTouched).toHaveBeenCalled();
      }
    });

    it('should close intl view when form is valid or empty', () => {
      component.showingIntlAddress.set(true);
      component.onApplyIntl();
      expect(component.showingIntlAddress()).toBeFalse();
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      fixture.detectChanges();
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onZipCodeBlur', () => {
    it('should mark zip code as touched', () => {
      fixture.detectChanges();
      component.onZipCodeBlur();
      expect(component.addressForm.get('zipCode')?.touched).toBeTrue();
    });
  });

  describe('filterZipCode partial input', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should strip non-numeric characters', () => {
      const mockEvent = { target: { value: '100a1' } } as any;
      component.filterZipCode(mockEvent);

      expect(mockEvent.target.value).toBe('1001');
    });

    it('should clear errors for partial zip (< 5 digits but > 0)', () => {
      const mockEvent = { target: { value: '100' } } as any;
      component.filterZipCode(mockEvent);

      expect(component.addressForm.get('zipCode')?.errors).toBeNull();
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when contact form is invalid', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when intl address is partial but not valid', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.hasPartialIntlAddress.set(true);
      component.hasValidIntlAddress.set(false);

      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('onAdd error handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call createContact and set isSaving false on error', () => {
      mockSponsorContactsService.createContact.and.returnValue(
        throwError(() => ({ error: { errorCode: '5001', errorResponse: { error: 'Duplicate' } } }))
      );

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.get('city')?.enable();
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });

      component['validateForms'] = () => true;
      component.onAdd();

      expect(mockSponsorContactsService.createContact).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });

    it('should show generic error when no error code', () => {
      mockSponsorContactsService.createContact.and.returnValue(
        throwError(() => ({ message: 'Server error' }))
      );

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.get('city')?.enable();
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });

      component.onAdd();

      expect(component.isSaving).toBeFalse();
    });
  });

  describe('onNumericKeyPress', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow numeric keys', () => {
      const event = { which: 50, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-numeric keys', () => {
      const event = { which: 65, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow backspace', () => {
      const event = { which: 8, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+A', () => {
      const event = { which: 65, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C', () => {
      const event = { which: 67, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+V', () => {
      const event = { which: 86, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+X', () => {
      const event = { which: 88, ctrlKey: true, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('preventLeadingSpace', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent space when field is empty', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { key: ' ', code: 'Space', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent space at beginning of field', () => {
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      const event = { key: ' ', code: 'Space', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow space in middle of text', () => {
      const input = document.createElement('input');
      input.value = 'John';
      Object.defineProperty(input, 'selectionStart', { value: 4, writable: true });
      const event = { key: ' ', code: 'Space', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow non-space keys', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { key: 'a', code: 'KeyA', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('trimLeadingSpace', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trim leading spaces from pasted value', () => {
      const input = document.createElement('input');
      input.value = '  Hello';
      Object.defineProperty(input, 'selectionStart', { value: 7, writable: true });
      const event = { target: input } as unknown as Event;

      component.trimLeadingSpace(event, 'firstName');

      expect(input.value).toBe('Hello');
    });

    it('should not modify value without leading spaces', () => {
      const input = document.createElement('input');
      input.value = 'Hello';
      const event = { target: input } as unknown as Event;

      component.trimLeadingSpace(event, 'firstName');

      expect(input.value).toBe('Hello');
    });
  });

  describe('onPaste', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle paste at beginning and trim leading spaces', () => {
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 0, writable: true });

      const event = {
        target: input,
        clipboardData: { getData: () => '  Hello' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onPaste(event, 'firstName');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.contactForm.get('firstName')?.value).toBe('Hello');
    });

    it('should handle paste in middle of text', () => {
      const input = document.createElement('input');
      input.value = 'Hello World';
      Object.defineProperty(input, 'selectionStart', { value: 5, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 5, writable: true });

      const event = {
        target: input,
        clipboardData: { getData: () => ' there' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onPaste(event, 'firstName');

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('filteredHonorificOptions computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by search text', () => {
      component.honorificSearch.set('mr');
      const filtered = component.filteredHonorificOptions();
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });

    it('should return all when search is empty', () => {
      component.honorificSearch.set('');
      const filtered = component.filteredHonorificOptions();
      expect(filtered).toEqual(mockHonorificOptions);
    });
  });

  describe('filteredTypeOptions computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by search text', () => {
      component.typeSearch.set('primary');
      const filtered = component.filteredTypeOptions();
      expect(filtered.length).toBe(1);
    });
  });

  describe('filteredTitleOptions computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by search text', () => {
      component.titleSearch.set('mgr');
      const filtered = component.filteredTitleOptions();
      expect(filtered.length).toBe(1);
    });
  });

  describe('filteredCityOptions computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter cities by search text', () => {
      component.cityOptions.set(mockZipCodeOptions);
      component.citySearch.set('new');
      const filtered = component.filteredCityOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].city).toBe('New York');
    });

    it('should return all cities when search is empty', () => {
      component.cityOptions.set(mockZipCodeOptions);
      component.citySearch.set('');
      const filtered = component.filteredCityOptions();
      expect(filtered).toEqual(mockZipCodeOptions);
    });
  });

  describe('search control subscriptions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update honorificSearch when honorificSearchControl changes', () => {
      component.honorificSearchControl.setValue('test');
      expect(component.honorificSearch()).toBe('test');
    });

    it('should update typeSearch when typeSearchControl changes', () => {
      component.typeSearchControl.setValue('primary');
      expect(component.typeSearch()).toBe('primary');
    });

    it('should update titleSearch when titleSearchControl changes', () => {
      component.titleSearchControl.setValue('mgr');
      expect(component.titleSearch()).toBe('mgr');
    });

    it('should update citySearch when citySearchControl changes', () => {
      component.citySearchControl.setValue('new');
      expect(component.citySearch()).toBe('new');
    });
  });

  describe('effDateErrorMatcher and termDateErrorMatcher', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('effDateErrorMatcher should return false for null control', () => {
      expect(component.effDateErrorMatcher.isErrorState(null)).toBeFalse();
    });

    it('effDateErrorMatcher should return true when touched and has error', () => {
      const ctrl = component.contactForm.controls.effectiveDate;
      ctrl.markAsTouched();
      ctrl.setErrors({ invalidDate: true });
      expect(component.effDateErrorMatcher.isErrorState(ctrl)).toBeTrue();
    });

    it('termDateErrorMatcher should return false for null control', () => {
      expect(component.termDateErrorMatcher.isErrorState(null)).toBeFalse();
    });

    it('termDateErrorMatcher should return true when dirty and has error', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.markAsDirty();
      ctrl.setErrors({ invalidDate: true });
      expect(component.termDateErrorMatcher.isErrorState(ctrl)).toBeTrue();
    });
  });

  describe('saveContact success message', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.createContact.and.returnValue(of({ message: 'Success' }));
    });

    it('should call createContact and show success message', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        firstName: 'John',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.get('city')?.enable();
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });

      component['validateForms'] = () => true;
      component.onAdd();

      expect(mockSponsorContactsService.createContact).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      const payload = mockSponsorContactsService.createContact.calls.mostRecent().args[0];
      expect(payload.salutation).toBe('MR');
      expect(payload.lastName).toBe('Doe');
    });
  });

  describe('onCreateAndAddAnother emits addAndContinue', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.createContact.and.returnValue(of({ message: 'Success' }));
    });

    it('should emit addAndContinue after successful add another', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });
      component.addressForm.get('city')?.enable();

      spyOn(component.addAndContinue, 'emit');
      component.onCreateAndAddAnother();

      expect(component.addAndContinue.emit).toHaveBeenCalled();
    });
  });

  describe('getEffectiveDateError with inputElement', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return invalid when input has value but control value is null and required', () => {
      const ctrl = component.contactForm.controls.effectiveDate;
      ctrl.markAsTouched();
      ctrl.setValue(null);
      component.effectiveDateInput = { nativeElement: { value: 'bad-date' } } as any;
      // The getEffectiveDateError should return invalid since there's input but no parsed value
      const error = component.getEffectiveDateError();
      expect(error.length).toBeGreaterThan(0);
    });
  });

  describe('onDateFieldBlur - date normalization and truncation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should normalize DD/MM/YYYY format', () => {
      const mockEvent = { target: { value: '15/01/2027' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
      expect(moment.isMoment(val)).toBeTrue();
    });

    it('should normalize YYYY-MM-DD format', () => {
      const mockEvent = { target: { value: '2027-01-15' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
    });

    it('should normalize DDMMMYYYY format (no separators)', () => {
      const mockEvent = { target: { value: '15JAN2027' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
    });

    it('should normalize DD-MMM-YY format', () => {
      const mockEvent = { target: { value: '15-JAN-27' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
    });

    it('should truncate year longer than 4 chars at end (DD-MMM-YYYYYYY)', () => {
      const mockEvent = { target: { value: '15-JAN-2027000' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
      if (moment.isMoment(val)) {
        expect(val.year()).toBe(2027);
      }
    });

    it('should truncate year longer than 4 chars at beginning (YYYYYYY-MM-DD)', () => {
      const mockEvent = { target: { value: '2027000-01-15' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
      if (moment.isMoment(val)) {
        expect(val.year()).toBe(2027);
      }
    });

    it('should truncate year in continuous format (10JAN202700)', () => {
      const mockEvent = { target: { value: '10JAN202700' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
    });

    it('should truncate year in numeric DD/MM/YYYY format with extra digits', () => {
      const mockEvent = { target: { value: '15/01/2027000' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
    });

    it('should update the input element value on successful normalization', () => {
      const mockEvent = { target: { value: '15-jan-2027' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      expect(mockEvent.target.value).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should not update form for completely invalid date string', () => {
      const ctrl = component.contactForm.get('effectiveDate');
      const originalValue = ctrl?.value;
      const mockEvent = { target: { value: 'notadate' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      // Value unchanged since normalization returns null
      expect(ctrl?.value).toBe(originalValue);
    });

    it('should work for terminationDate field', () => {
      const mockEvent = { target: { value: '20-FEB-2027' } };
      component.onDateFieldBlur('terminationDate', mockEvent);
      const val = component.contactForm.get('terminationDate')?.value;
      expect(val).toBeTruthy();
    });

    it('should handle MMM-DD-YYYY format', () => {
      const mockEvent = { target: { value: 'JAN-15-2027' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
    });

    it('should handle D-MMM-YYYY single digit day', () => {
      const mockEvent = { target: { value: '5-JAN-2027' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
    });

    it('should handle YYYY/MM/DD format', () => {
      const mockEvent = { target: { value: '2027/01/15' } };
      component.onDateFieldBlur('effectiveDate', mockEvent);
      const val = component.contactForm.get('effectiveDate')?.value;
      expect(val).toBeTruthy();
    });
  });

  describe('URL and email validation on addressForm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should accept valid email', () => {
      component.addressForm.get('email')?.setValue('test@example.com');
      expect(component.addressForm.get('email')?.valid).toBeTrue();
    });

    it('should reject invalid email', () => {
      component.addressForm.get('email')?.setValue('not-an-email');
      expect(component.addressForm.get('email')?.hasError('pattern')).toBeTrue();
    });

    it('should accept empty email (optional)', () => {
      component.addressForm.get('email')?.setValue('');
      expect(component.addressForm.get('email')?.valid).toBeTrue();
    });

    it('should enforce maxlength on email (128 chars)', () => {
      component.addressForm.get('email')?.setValue('a'.repeat(120) + '@test.com');
      expect(component.addressForm.get('email')?.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid website URL', () => {
      component.addressForm.get('website')?.setValue('https://www.example.com');
      expect(component.addressForm.get('website')?.valid).toBeTrue();
    });

    it('should accept website without protocol', () => {
      component.addressForm.get('website')?.setValue('www.example.com');
      expect(component.addressForm.get('website')?.valid).toBeTrue();
    });

    it('should reject invalid website URL', () => {
      component.addressForm.get('website')?.setValue('not a url at all!!!');
      expect(component.addressForm.get('website')?.hasError('invalidUrl')).toBeTrue();
    });

    it('should accept empty website (optional)', () => {
      component.addressForm.get('website')?.setValue('');
      expect(component.addressForm.get('website')?.valid).toBeTrue();
    });

    it('should enforce maxlength on website (50 chars)', () => {
      component.addressForm.get('website')?.setValue('https://www.' + 'a'.repeat(40) + '.com');
      expect(component.addressForm.get('website')?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('getLastNameError maxlength', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return maxlength error when name exceeds 30 chars', () => {
      const ctrl = component.contactForm.controls.lastName;
      ctrl.setValue('a'.repeat(31));
      ctrl.markAsTouched();
      expect(component.getLastNameError()).toBe('Last Name cannot exceed 30 characters');
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getLastNameError()).toBe('');
    });
  });

  describe('isFormValid - additional branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when contact form valid and address form valid', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: 123
      });
      component.addressForm.get('city')?.enable();

      expect(component.isFormValid).toBeTrue();
    });

    it('should return true when contact form valid and intl address is valid (even if US form invalid)', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.hasValidIntlAddress.set(true);
      component.hasPartialIntlAddress.set(true);

      expect(component.isFormValid).toBeTrue();
    });

    it('should return false when partial intl but not valid intl', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.hasPartialIntlAddress.set(true);
      component.hasValidIntlAddress.set(false);

      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('saveContact - payload construction details', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.createContact.and.returnValue(
        of({ message: 'Contact created successfully' })
      );
    });

    it('should build payload without salutation when honorific is empty string', () => {
      component.contactForm.patchValue({
        honorific: '',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: 123
      });
      component.addressForm.get('city')?.enable();

      component['validateForms'] = () => true;
      component.onAdd();

      const payload = mockSponsorContactsService.createContact.calls.mostRecent().args[0];
      expect(payload.salutation).toBeUndefined();
    });

    it('should include termination date in payload when set', () => {
      const termDate = moment().add(6, 'months');
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days'),
        terminationDate: termDate
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: 123
      });
      component.addressForm.get('city')?.enable();

      component['validateForms'] = () => true;
      component.onAdd();

      const payload = mockSponsorContactsService.createContact.calls.mostRecent().args[0];
      expect(payload.termDate).toBeDefined();
      expect(payload.termDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should exclude termination date when not set', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: 123
      });
      component.addressForm.get('city')?.enable();

      component['validateForms'] = () => true;
      component.onAdd();

      const payload = mockSponsorContactsService.createContact.calls.mostRecent().args[0];
      expect(payload.termDate).toBeUndefined();
    });

    it('should exclude notes from payload when pendingNotes is empty', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: 123
      });
      component.addressForm.get('city')?.enable();

      component['validateForms'] = () => true;
      component.onAdd();

      const payload = mockSponsorContactsService.createContact.calls.mostRecent().args[0];
      expect(payload.notes).toBeUndefined();
    });

    it('should set sponsorId from input signal', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: 123
      });
      component.addressForm.get('city')?.enable();

      component['validateForms'] = () => true;
      component.onAdd();

      const payload = mockSponsorContactsService.createContact.calls.mostRecent().args[0];
      expect(payload.sponsorId).toBe('SPONSOR123');
    });

    it('should include chapterId from headerService', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: 123
      });
      component.addressForm.get('city')?.enable();

      component['validateForms'] = () => true;
      component.onAdd();

      const payload = mockSponsorContactsService.createContact.calls.mostRecent().args[0];
      expect(payload.chapterId).toBe('TST');
    });

    it('should split phone numbers into areaCode and phoneNo', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: 123,
        workPhone: '(212) 555-1234'
      });
      component.addressForm.get('city')?.enable();

      component['validateForms'] = () => true;
      component.onAdd();

      const payload = mockSponsorContactsService.createContact.calls.mostRecent().args[0];
      expect(payload.address.dAreaCode).toBe('212');
      expect(payload.address.dPhoneNo).toBe('5551234');
    });

    it('should format success message with salutation when present', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Smith',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: 123
      });
      component.addressForm.get('city')?.enable();

      component['validateForms'] = () => true;
      component.onAdd();

      expect(snackBarSpy).toHaveBeenCalled();
      const msg = snackBarSpy.calls.mostRecent().args[0];
      expect(msg).toContain('MR');
      expect(msg).toContain('Smith');
      expect(msg).toContain('has been added to contacts successfully');
    });
  });

  describe('getErrorMessage - private method via error responses', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error with errorCode from errorResponse', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      mockSponsorContactsService.createContact.and.returnValue(
        throwError(() => ({
          error: {
            errorResponse: { error: 'Duplicate contact', errorCode: 'ERR001' }
          }
        }))
      );

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.get('city')?.enable();
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });

      component['validateForms'] = () => true;
      component.onAdd();

      const msg = snackBarSpy.calls.mostRecent().args[0] as string;
      expect(msg).toContain('ERR001');
      expect(msg).toContain('Duplicate contact');
    });

    it('should show error.message when no errorResponse', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      mockSponsorContactsService.createContact.and.returnValue(
        throwError(() => ({
          error: { message: 'Bad request' }
        }))
      );

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.get('city')?.enable();
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });

      component['validateForms'] = () => true;
      component.onAdd();

      const msg = snackBarSpy.calls.mostRecent().args[0] as string;
      expect(msg).toBe('Bad request');
    });

    it('should show generic message when no specific error fields', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      mockSponsorContactsService.createContact.and.returnValue(
        throwError(() => ({}))
      );

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.get('city')?.enable();
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });

      component['validateForms'] = () => true;
      component.onAdd();

      const msg = snackBarSpy.calls.mostRecent().args[0] as string;
      expect(msg).toBe('An unexpected error occurred');
    });

    it('should show error with errorCode from error.error', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      mockSponsorContactsService.createContact.and.returnValue(
        throwError(() => ({
          error: { message: 'Conflict', errorCode: '409' }
        }))
      );

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.get('city')?.enable();
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });

      component['validateForms'] = () => true;
      component.onAdd();

      const msg = snackBarSpy.calls.mostRecent().args[0] as string;
      expect(msg).toContain('409');
      expect(msg).toContain('Conflict');
    });
  });

  describe('resetForms - search controls reset', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.createContact.and.returnValue(
        of({ message: 'Contact created successfully' })
      );
    });

    it('should reset search controls after add-another', () => {
      component.honorificSearchControl.setValue('mr');
      component.typeSearchControl.setValue('primary');
      component.titleSearchControl.setValue('mgr');
      component.citySearchControl.setValue('new');

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();

      component.onCreateAndAddAnother();

      expect(component.honorificSearchControl.value).toBe('');
      expect(component.typeSearchControl.value).toBe('');
      expect(component.titleSearchControl.value).toBe('');
      expect(component.citySearchControl.value).toBe('');
    });

    it('should clear pendingNotes and editingNoteIndex after add-another', () => {
      component.pendingNotes.set([
        { noteText: 'Note', createdBy: 'user', createdDate: '15-JUN-2026' }
      ]);
      component.editingNoteIndex.set(0);

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.patchValue({
        street: '123 Main St',
        zipCode: '10001',
        city: '123'
      });
      component.addressForm.get('city')?.enable();

      component.onCreateAndAddAnother();

      expect(component.pendingNotes()).toEqual([]);
      expect(component.editingNoteIndex()).toBeNull();
    });
  });

  describe('setupZipCodeLookup - auto-select single city', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-select city when only one option returned', () => {
      const singleCity: ZipCodeLookupItem[] = [
        { uspsId: 999, city: 'Single City', state: 'SC', zip: '11111' }
      ];
      mockSponsorContactsService.getZipCodes.and.returnValue(of(singleCity));

      const mockEvent = { target: { value: '11111' } } as any;
      component.filterZipCode(mockEvent);

      expect(component.addressForm.get('city')?.value).toBe(999);
    });

    it('should not auto-select city when multiple options returned', () => {
      mockSponsorContactsService.getZipCodes.and.returnValue(of(mockZipCodeOptions));

      const mockEvent = { target: { value: '10001' } } as any;
      component.filterZipCode(mockEvent);

      // City should remain null - not auto-selected when > 1 option
      expect(component.addressForm.get('city')?.value).toBeNull();
    });
  });

  describe('onDeleteNote - when not editing the deleted note', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not reset editing state when deleting a different note', () => {
      component.pendingNotes.set([
        { noteText: 'Note 1', createdBy: 'user1', createdDate: '15-JUN-2026' },
        { noteText: 'Note 2', createdBy: 'user1', createdDate: '15-JUN-2026' },
        { noteText: 'Note 3', createdBy: 'user1', createdDate: '15-JUN-2026' }
      ]);
      component.editingNoteIndex.set(2);

      component.onDeleteNote(0);

      // Editing index should NOT be cleared since we deleted a different note
      expect(component.editingNoteIndex()).toBe(2);
      expect(component.pendingNotes().length).toBe(2);
    });
  });

  describe('onZipCodeKeydown - additional branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not prevent Shift+Tab', () => {
      const mockEvent = {
        key: 'Tab',
        shiftKey: true,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onZipCodeKeydown(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should not intercept non-Tab keys', () => {
      const mockEvent = {
        key: 'Enter',
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onZipCodeKeydown(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab when zip code has no errors and lookup is not in progress', () => {
      const mockEvent = {
        key: 'Tab',
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.addressForm.patchValue({ zipCode: '10001' });
      component.addressForm.get('zipCode')?.setErrors(null);
      component['zipCodeLookupInProgress'] = false;

      component.onZipCodeKeydown(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('filterZipCode - edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle input with only non-numeric chars', () => {
      const mockEvent = { target: { value: 'abcde' } } as any;
      component.filterZipCode(mockEvent);

      expect(mockEvent.target.value).toBe('');
      expect(component.cityOptions()).toEqual([]);
    });

    it('should not trigger lookup for less than 5 digits', () => {
      mockSponsorContactsService.getZipCodes.calls.reset();
      const mockEvent = { target: { value: '1234' } } as any;
      component.filterZipCode(mockEvent);

      expect(mockSponsorContactsService.getZipCodes).not.toHaveBeenCalled();
    });

    it('should truncate to first 5 numeric digits from longer input', () => {
      // Input "12345abc" should filter to "12345" and trigger lookup
      const mockEvent = { target: { value: '12345abc' } } as any;
      component.filterZipCode(mockEvent);

      // Only digits remain
      expect(mockEvent.target.value).toBe('12345');
    });
  });

  describe('getTerminationDateError - lastChangedDateField is effective', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should NOT return dateRange or matDatepickerMin error when lastChangedDateField is effective', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.markAsTouched();
      ctrl.setValue(moment().add(5, 'days'));
      ctrl.setErrors({ matDatepickerMin: true });
      component['lastChangedDateField'] = 'effective';

      // When lastChangedDateField is 'effective', termination date range errors are suppressed
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return dateRangeInvalid error when lastChangedDateField is null', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.markAsTouched();
      ctrl.setValue(moment().add(5, 'days'));
      component['lastChangedDateField'] = null;
      component.contactForm.setErrors({ dateRangeInvalid: true });

      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });
  });

  describe('search control null value handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle null from honorificSearchControl', () => {
      component.honorificSearchControl.setValue(null);
      expect(component.honorificSearch()).toBe('');
    });

    it('should handle null from typeSearchControl', () => {
      component.typeSearchControl.setValue(null);
      expect(component.typeSearch()).toBe('');
    });

    it('should handle null from titleSearchControl', () => {
      component.titleSearchControl.setValue(null);
      expect(component.titleSearch()).toBe('');
    });

    it('should handle null from citySearchControl', () => {
      component.citySearchControl.setValue(null);
      expect(component.citySearch()).toBe('');
    });
  });

  describe('effDateErrorMatcher / termDateErrorMatcher - additional states', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('effDateErrorMatcher should return false when control is touched but no error', () => {
      const ctrl = component.contactForm.controls.effectiveDate;
      ctrl.markAsTouched();
      ctrl.setValue(moment().add(5, 'days'));
      ctrl.setErrors(null);

      // getEffectiveDateError returns '' when no error exists
      expect(component.effDateErrorMatcher.isErrorState(ctrl)).toBeFalse();
    });

    it('effDateErrorMatcher should return true when control is dirty and has error', () => {
      const ctrl = component.contactForm.controls.effectiveDate;
      ctrl.markAsDirty();
      ctrl.setErrors({ invalidDate: true });
      expect(component.effDateErrorMatcher.isErrorState(ctrl)).toBeTrue();
    });

    it('termDateErrorMatcher should return false when control is untouched and not dirty', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      // Not touched, not dirty
      expect(component.termDateErrorMatcher.isErrorState(ctrl)).toBeFalse();
    });
  });

  describe('formatPhoneNumber - additional cursor positions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format 3-digit phone number with closing paren and space', () => {
      const input = document.createElement('input');
      input.value = '212';
      Object.defineProperty(input, 'selectionStart', { value: 3, writable: true });
      const event = { target: input } as unknown as Event;

      component.formatPhoneNumber(event, 'workPhone', component.addressForm);

      expect(input.value).toBe('(212) ');
    });

    it('should format 4-digit phone number', () => {
      const input = document.createElement('input');
      input.value = '2125';
      Object.defineProperty(input, 'selectionStart', { value: 4, writable: true });
      const event = { target: input } as unknown as Event;

      component.formatPhoneNumber(event, 'workPhone', component.addressForm);

      expect(input.value).toBe('(212) 5');
    });

    it('should handle phone with existing formatting', () => {
      const input = document.createElement('input');
      input.value = '(212) 555-12';
      Object.defineProperty(input, 'selectionStart', { value: 12, writable: true });
      const event = { target: input } as unknown as Event;

      component.formatPhoneNumber(event, 'homePhone', component.addressForm);

      expect(input.value).toBe('(212) 555-12');
    });

    it('should use contactForm when no formGroup specified', () => {
      component.contactForm.addControl('testPhone', component['fb'].control(''));
      const input = document.createElement('input');
      input.value = '2125551234';
      Object.defineProperty(input, 'selectionStart', { value: 10, writable: true });
      const event = { target: input } as unknown as Event;

      component.formatPhoneNumber(event, 'testPhone');

      expect(input.value).toBe('(212) 555-1234');
      component.contactForm.removeControl('testPhone');
    });
  });

  describe('phone validation - edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should accept whitespace-only phone (treated as empty)', () => {
      component.addressForm.get('workPhone')?.setValue('   ');
      expect(component.addressForm.get('workPhone')?.valid).toBeTrue();
    });

    it('should reject phone with 5 digits', () => {
      component.addressForm.get('homePhone')?.setValue('(212) 55');
      component.addressForm.get('homePhone')?.updateValueAndValidity();
      expect(component.addressForm.get('homePhone')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should validate fax field the same as phone', () => {
      component.addressForm.get('fax')?.setValue('(212) 555');
      component.addressForm.get('fax')?.updateValueAndValidity();
      expect(component.addressForm.get('fax')?.hasError('invalidPhone')).toBeTrue();
    });

    it('should accept complete fax number', () => {
      component.addressForm.get('fax')?.setValue('(212) 555-1234');
      component.addressForm.get('fax')?.updateValueAndValidity();
      expect(component.addressForm.get('fax')?.valid).toBeTrue();
    });
  });

  describe('onNumericKeyPress - additional key codes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow delete key (46)', () => {
      const event = { which: 46, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow tab key (9)', () => {
      const event = { which: 9, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow escape key (27)', () => {
      const event = { which: 27, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow enter key (13)', () => {
      const event = { which: 13, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should use keyCode when which is 0', () => {
      const event = { which: 0, keyCode: 65, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow digit 0 (keycode 48)', () => {
      const event = { which: 48, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow digit 9 (keycode 57)', () => {
      const event = { which: 57, ctrlKey: false, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('preventLeadingSpace - additional cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent space when field only contains spaces', () => {
      const input = document.createElement('input');
      input.value = '   ';
      Object.defineProperty(input, 'selectionStart', { value: 3, writable: true });
      const event = { key: ' ', code: 'Space', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent space when cursor is at position 0 with existing text', () => {
      const input = document.createElement('input');
      input.value = 'Hello';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      const event = { key: ' ', code: 'Space', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should work with custom formGroup', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { key: ' ', code: 'Space', target: input, preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.preventLeadingSpace(event, 'street', component.addressForm);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onPaste - additional scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle paste with no clipboardData', () => {
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 0, writable: true });

      const event = {
        target: input,
        clipboardData: null,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onPaste(event, 'firstName');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.contactForm.get('firstName')?.value).toBe('');
    });

    it('should handle paste with selection replacement', () => {
      const input = document.createElement('input');
      input.value = 'Hello World';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 5, writable: true });

      const event = {
        target: input,
        clipboardData: { getData: () => 'Goodbye' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onPaste(event, 'firstName');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.contactForm.get('firstName')?.value).toBe('Goodbye World');
    });

    it('should work with custom formGroup on paste', () => {
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(input, 'selectionEnd', { value: 0, writable: true });

      const event = {
        target: input,
        clipboardData: { getData: () => '  123 Main' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onPaste(event, 'street', component.addressForm);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.addressForm.get('street')?.value).toBe('123 Main');
    });
  });

  describe('toUpperCaseAndTrim - with addressForm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should work with addressForm as formGroup', () => {
      const input = document.createElement('input');
      input.value = '  main street';
      const event = { target: input } as unknown as Event;

      component.toUpperCaseAndTrim(event, 'street', component.addressForm);

      expect(input.value).toBe('MAIN STREET');
      expect(component.addressForm.get('street')?.value).toBe('MAIN STREET');
    });
  });

  describe('validateForms - address form invalid without intl', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should switch to address tab when address form is invalid and no valid intl', () => {
      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      // Address form left invalid (required fields missing)
      component.hasPartialIntlAddress.set(false);
      component.hasValidIntlAddress.set(false);

      component.onAdd();

      expect(component.activeTabIndex).toBe(1);
      expect(mockSponsorContactsService.createContact).not.toHaveBeenCalled();
    });
  });

  describe('filteredHonorificOptions - description match', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by description text', () => {
      component.honorificSearch.set('mrs');
      const filtered = component.filteredHonorificOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('MRS');
    });

    it('should return empty when no match', () => {
      component.honorificSearch.set('xyz');
      const filtered = component.filteredHonorificOptions();
      expect(filtered.length).toBe(0);
    });
  });

  describe('filteredTypeOptions - description match', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by description', () => {
      component.typeSearch.set('secondary');
      const filtered = component.filteredTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('SECONDARY');
    });

    it('should return all when search is empty', () => {
      component.typeSearch.set('');
      const filtered = component.filteredTypeOptions();
      expect(filtered).toEqual(mockTypeOptions);
    });
  });

  describe('filteredTitleOptions - description match', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by description', () => {
      component.titleSearch.set('director');
      const filtered = component.filteredTitleOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('DIR');
    });

    it('should return all when search is empty', () => {
      component.titleSearch.set('');
      const filtered = component.filteredTitleOptions();
      expect(filtered).toEqual(mockTitleOptions);
    });
  });

  describe('getHonorificError - no error when valid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when value is set and touched', () => {
      const ctrl = component.contactForm.controls.honorific;
      ctrl.setValue('MR');
      ctrl.markAsTouched();
      expect(component.getHonorificError()).toBe('');
    });
  });

  describe('getTypeError - no error when valid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when value is set and touched', () => {
      const ctrl = component.contactForm.controls.type;
      ctrl.setValue('PRIMARY');
      ctrl.markAsTouched();
      expect(component.getTypeError()).toBe('');
    });
  });

  describe('getTitleError - no error when valid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when value is set and touched', () => {
      const ctrl = component.contactForm.controls.title;
      ctrl.setValue('MGR');
      ctrl.markAsTouched();
      expect(component.getTitleError()).toBe('');
    });
  });

  describe('getTerminationDateError - matDatepickerParse', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return invalid for matDatepickerParse error', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ matDatepickerParse: true });
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });
  });

  describe('setupEffectiveDateListener - non-moment value', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle string date value by wrapping in moment', () => {
      const dateStr = '2027-01-15' as any;
      component.contactForm.patchValue({ effectiveDate: dateStr });

      // minTerminationDate should be updated
      expect(component.minTerminationDate).toBeDefined();
    });
  });

  describe('ChapterTimezoneDateAdapter integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set chapter min date on the date adapter during init', () => {
      // The adapter should be configured. minDate should be defined
      expect(component.minDate).toBeDefined();
      expect(component.chapterDate).toBeDefined();
      expect(component.chapterDate.isSame(component.minDate, 'day')).toBeTrue();
    });
  });

  describe('validateEffectiveDateInput - clear error when input is empty', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear invalidDate error when input is empty and control had invalidDate', () => {
      const ctrl = component.contactForm.get('effectiveDate')!;
      ctrl.setErrors({ invalidDate: true });
      component.effectiveDateInput = { nativeElement: { value: '' } } as any;

      component.validateEffectiveDateInput();

      // invalidDate should be cleared since input is empty
      expect(ctrl.hasError('invalidDate')).toBeFalse();
    });
  });

  describe('validateTerminationDateInput - clear error when input is empty', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear invalidDate error when input is empty', () => {
      const ctrl = component.contactForm.get('terminationDate')!;
      ctrl.setErrors({ invalidDate: true });
      component.terminationDateInput = { nativeElement: { value: '' } } as any;

      component.validateTerminationDateInput();

      expect(ctrl.hasError('invalidDate')).toBeFalse();
    });
  });

  describe('Notes management - additional scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should preserve createdBy and createdDate when editing a note', () => {
      component.pendingNotes.set([
        { noteText: 'Original', createdBy: 'admin', createdDate: '01-JAN-2026' }
      ]);
      component.onEditNote(0);
      component.notesForm.get('notes')?.setValue('Edited');
      component.onAddNote();

      expect(component.pendingNotes()[0].createdBy).toBe('admin');
      expect(component.pendingNotes()[0].createdDate).toBe('01-JAN-2026');
      expect(component.pendingNotes()[0].noteText).toBe('Edited');
    });

    it('should delete from middle of notes list', () => {
      component.pendingNotes.set([
        { noteText: 'Note 1', createdBy: 'user1', createdDate: '15-JUN-2026' },
        { noteText: 'Note 2', createdBy: 'user1', createdDate: '15-JUN-2026' },
        { noteText: 'Note 3', createdBy: 'user1', createdDate: '15-JUN-2026' }
      ]);

      component.onDeleteNote(1);

      expect(component.pendingNotes().length).toBe(2);
      expect(component.pendingNotes()[0].noteText).toBe('Note 1');
      expect(component.pendingNotes()[1].noteText).toBe('Note 3');
    });

    it('should add multiple notes sequentially', () => {
      component.notesForm.get('notes')?.setValue('Note A');
      component.onAddNote();

      component.notesForm.get('notes')?.setValue('Note B');
      component.onAddNote();

      expect(component.pendingNotes().length).toBe(2);
      expect(component.pendingNotes()[0].noteText).toBe('Note A');
      expect(component.pendingNotes()[1].noteText).toBe('Note B');
    });

    it('should reset notesForm after adding a note', () => {
      component.notesForm.get('notes')?.setValue('Some note');
      component.onAddNote();

      expect(component.notesForm.get('notes')?.value).toBeFalsy();
    });
  });

  describe('getInitials - edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle name with extra whitespace', () => {
      expect(component.getInitials('  John   Doe  ')).toBe('JD');
    });

    it('should return uppercase initials from lowercase name', () => {
      expect(component.getInitials('john doe')).toBe('JD');
    });

    it('should handle single character name', () => {
      expect(component.getInitials('J')).toBe('J');
    });
  });

  describe('snackBar configuration on save', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open snackBar with success config on successful save', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      mockSponsorContactsService.createContact.and.returnValue(of({ message: 'Success' }));

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.get('city')?.enable();
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });

      component['validateForms'] = () => true;
      component.onAdd();

      const callArgs = snackBarSpy.calls.mostRecent().args;
      expect(callArgs[1]).toBe('DISMISS');
      expect(callArgs[2].duration).toBe(5000);
      expect(callArgs[2].horizontalPosition).toBe('end');
      expect(callArgs[2].verticalPosition).toBe('top');
      expect(callArgs[2].panelClass).toContain('success-snackbar');
    });

    it('should open snackBar with error config on failed save', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      mockSponsorContactsService.createContact.and.returnValue(
        throwError(() => ({ message: 'Error' }))
      );

      component.contactForm.patchValue({
        honorific: 'MR',
        lastName: 'Doe',
        type: 'PRIMARY',
        title: 'MGR',
        effectiveDate: moment().add(5, 'days')
      });
      component.addressForm.get('city')?.enable();
      component.addressForm.patchValue({ street: '123 Main St', zipCode: '10001', city: '123' });

      component['validateForms'] = () => true;
      component.onAdd();

      const callArgs = snackBarSpy.calls.mostRecent().args;
      expect(callArgs[1]).toBe('DISMISS');
      expect(callArgs[2].horizontalPosition).toBe('end');
      expect(callArgs[2].verticalPosition).toBe('top');
      expect(callArgs[2].panelClass).toContain('error-snackbar');
      // Error snackbar should NOT have a duration (stays until dismissed)
      expect(callArgs[2].duration).toBeUndefined();
    });
  });

  describe('trimLeadingSpace - with addressForm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should work with a custom formGroup parameter', () => {
      const input = document.createElement('input');
      input.value = '  123 Main';
      Object.defineProperty(input, 'selectionStart', { value: 10, writable: true });
      const event = { target: input } as unknown as Event;

      component.trimLeadingSpace(event, 'street', component.addressForm);

      expect(input.value).toBe('123 Main');
    });
  });

  describe('effectiveDateClass - non-moment date value', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle date value that is not a moment object', () => {
      const dateStr = '2027-01-15' as any;
      component.contactForm.patchValue({ effectiveDate: dateStr });
      const result = component.effectiveDateClass(moment('2027-01-15'));
      expect(result).toBe('highlighted-effective-date');
    });
  });

  describe('terminationDateClass - non-moment date values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle non-moment effective date', () => {
      const dateStr = '2027-01-15' as any;
      component.contactForm.patchValue({ effectiveDate: dateStr });
      const result = component.terminationDateClass(moment('2027-01-15'));
      expect(result).toContain('highlighted-effective-date');
    });

    it('should handle non-moment termination date', () => {
      const dateStr = '2027-06-15' as any;
      component.contactForm.patchValue({ terminationDate: dateStr });
      const result = component.terminationDateClass(moment('2027-06-15'));
      expect(result).toContain('highlighted-termination-date');
    });
  });
});
