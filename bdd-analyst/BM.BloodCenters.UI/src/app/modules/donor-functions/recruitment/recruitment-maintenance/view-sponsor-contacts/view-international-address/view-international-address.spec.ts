import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ViewInternationalAddressComponent } from './view-international-address';
import { MaintainSponsorContactsService } from '../../../recruitment-administration/maintain-sponsor-contacts/services/maintain-sponsor-contacts.service';
import { SponsorContactModel, SponsorContactDetailModel } from '../../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';

describe('ViewInternationalAddressComponent', () => {
  let component: ViewInternationalAddressComponent;
  let fixture: ComponentFixture<ViewInternationalAddressComponent>;
  let mockSponsorContactsService: jasmine.SpyObj<MaintainSponsorContactsService>;

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
      intlAddress1: '123 Oxford Street',
      intlAddress2: 'Apartment 4B',
      intlAddress3: 'Westminster',
      intlAddress4: 'Greater London',
      countryName: 'United Kingdom',
      intlPostalCode: 'W1D 1BS',
      intlWorkPhoneExt: '1234',
      intlWorkPhoneNo: '+44 20 7946 0958',
      intlHomePhoneNo: '+44 20 7946 0123',
      intlMobilePhoneNo: '+44 7911 123456',
      intlFaxNo: '+44 20 7946 0999',
      email: 'john.doe@example.co.uk'
    },
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser'
  };

  beforeAll(async () => {

    mockSponsorContactsService = jasmine.createSpyObj('MaintainSponsorContactsService', [
      'getContactDetail'
    ]);

    mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [ViewInternationalAddressComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        FormBuilder,
        { provide: MaintainSponsorContactsService, useValue: mockSponsorContactsService }
      ]
    }).compileComponents();


    });



  beforeEach(() => {


      mockSponsorContactsService.getContactDetail.calls.reset();


      mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));


    fixture = TestBed.createComponent(ViewInternationalAddressComponent);
    component = fixture.componentInstance;
    component.data = mockContactData;
    component.detailData = mockContactDetail;


    });

  describe('Component Initialization', () => {


    it('should load contact detail on init', () => {
      fixture.detectChanges();

      expect(component.address).toEqual(mockContactDetail.address);
    });

    it('should have all form fields enabled for readonly binding', () => {
      fixture.detectChanges();

      expect(component.form.get('address1')?.disabled).toBeFalse();
      expect(component.form.get('address2')?.disabled).toBeFalse();
      expect(component.form.get('address3')?.disabled).toBeFalse();
      expect(component.form.get('address4')?.disabled).toBeFalse();
      expect(component.form.get('country')?.disabled).toBeFalse();
      expect(component.form.get('postalCode')?.disabled).toBeFalse();
      expect(component.form.get('extension')?.disabled).toBeFalse();
      expect(component.form.get('workPhone')?.disabled).toBeFalse();
      expect(component.form.get('homePhone')?.disabled).toBeFalse();
      expect(component.form.get('mobilePhone')?.disabled).toBeFalse();
      expect(component.form.get('fax')?.disabled).toBeFalse();
      expect(component.form.get('email')?.disabled).toBeFalse();
    });
  });

  describe('Form Population', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should handle missing address data', () => {
      const detailWithoutAddress = {
        ...mockContactDetail,
        address: null
      } as any;
      component.detailData = detailWithoutAddress;

      component.ngOnInit();

      expect(component.form.get('address1')?.value).toBe('');
      expect(component.form.get('address2')?.value).toBe('');
      expect(component.form.get('address3')?.value).toBe('');
      expect(component.form.get('address4')?.value).toBe('');
      expect(component.form.get('country')?.value).toBe('');
      expect(component.form.get('postalCode')?.value).toBe('');
    });

    it('should handle partial address data', () => {
      const detailWithPartialAddress: SponsorContactDetailModel = {
        ...mockContactDetail,
        address: {
          intlAddress1: '123 Oxford Street',
          countryName: 'United Kingdom',
          intlPostalCode: 'W1D 1BS'
        }
      };
      component.detailData = detailWithPartialAddress;

      component.ngOnInit();

      expect(component.form.get('address1')?.value).toBe('123 Oxford Street');
      expect(component.form.get('address2')?.value).toBe('');
      expect(component.form.get('address3')?.value).toBe('');
      expect(component.form.get('address4')?.value).toBe('');
      expect(component.form.get('country')?.value).toBe('United Kingdom');
      expect(component.form.get('postalCode')?.value).toBe('W1D 1BS');
    });

    it('should handle missing phone numbers', () => {
      const detailWithoutPhones: SponsorContactDetailModel = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address!,
          intlWorkPhoneNo: undefined,
          intlHomePhoneNo: undefined,
          intlMobilePhoneNo: undefined,
          intlFaxNo: undefined
        }
      };
      component.detailData = detailWithoutPhones;

      component.ngOnInit();

      expect(component.form.get('workPhone')?.value).toBe('');
      expect(component.form.get('homePhone')?.value).toBe('');
      expect(component.form.get('mobilePhone')?.value).toBe('');
      expect(component.form.get('fax')?.value).toBe('');
    });
  });


  describe('Loading States', () => {


    it('should handle contact detail loading error', () => {
      component.detailData = null;
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(component.address).toEqual({});
    });
  });

  describe('OnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reload contact detail when data changes', () => {
      const newDetailData: SponsorContactDetailModel = {
        ...mockContactDetail,
        sponsorId: 'SPONSOR999',
        address: {
          intlAddress1: '456 New Street',
          intlPostalCode: 'SW1A 1AA',
          countryName: 'United Kingdom'
        }
      };

      component.detailData = newDetailData;
      component.ngOnChanges({
        detailData: new SimpleChange(mockContactDetail, newDetailData, false)
      });

      expect(component.address).toEqual(newDetailData.address);
      expect(component.form.get('address1')?.value).toBe('456 New Street');
    });

  });

  describe('Data Handling Without sponsorId/addressId', () => {
    it('should not load contact detail when sponsorId is missing', () => {
      component.data = {
        ...mockContactData,
        sponsorId: '',
        addressId: 'ADDR456'
      };
      component.detailData = null;

      component.ngOnInit();

      expect(component.address).toEqual({});
    });

    it('should not load contact detail when addressId is missing', () => {
      component.data = {
        ...mockContactData,
        sponsorId: 'SPONSOR123',
        addressId: ''
      };
      component.detailData = null;

      component.ngOnInit();

      expect(component.address).toEqual({});
    });

    it('should not load contact detail when both are missing', () => {
      component.data = {
        ...mockContactData,
        sponsorId: '',
        addressId: ''
      };
      component.detailData = null;

      component.ngOnInit();

      expect(component.address).toEqual({});
    });

    it('should not load contact detail when data is null', () => {
      component.data = null;
      component.detailData = null;

      component.ngOnInit();

      expect(component.address).toEqual({});
    });
  });
});
