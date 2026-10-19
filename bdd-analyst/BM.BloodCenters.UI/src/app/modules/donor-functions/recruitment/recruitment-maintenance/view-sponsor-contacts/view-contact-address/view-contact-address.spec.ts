import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';

import { ViewContactAddressComponent } from './view-contact-address';
import { SponsorContactModel, SponsorContactDetailModel } from '../../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';

describe('ViewContactAddressComponent', () => {
  let component: ViewContactAddressComponent;
  let fixture: ComponentFixture<ViewContactAddressComponent>;

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
      city: 'New York',
      uspsId: 123,
      dAreaCode: '310',
      dPhoneNo: '5551234',
      hAreaCode: '310',
      hPhoneNo: '5554321',
      fAreaCode: '310',
      fPhoneNo: '5559999',
      email: 'john@example.com',
      webAddress: 'www.example.com'
    },
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser'
  };

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [ViewContactAddressComponent, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        FormBuilder
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ViewContactAddressComponent);
    component = fixture.componentInstance;
    component.data = mockContactData;
    component.detailData = mockContactDetail;


    });

  describe('Component Initialization', () => {


    it('should use detailData on init', () => {
      fixture.detectChanges();

      expect(component.address).toEqual(mockContactDetail.address);
    });

    it('should have all form fields enabled for readonly binding', () => {
      fixture.detectChanges();

      expect(component.form.get('street')?.disabled).toBeFalse();
      expect(component.form.get('zipCode')?.disabled).toBeFalse();
      expect(component.form.get('city')?.disabled).toBeFalse();
      expect(component.form.get('workPhone')?.disabled).toBeFalse();
      expect(component.form.get('homePhone')?.disabled).toBeFalse();
      expect(component.form.get('fax')?.disabled).toBeFalse();
      expect(component.form.get('email')?.disabled).toBeFalse();
      expect(component.form.get('website')?.disabled).toBeFalse();
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

      expect(component.form.get('street')?.value).toBe('');
      expect(component.form.get('zipCode')?.value).toBe('');
      expect(component.form.get('city')?.value).toBe('');
    });

    it('should handle missing phone area codes', () => {
      const detailWithoutAreaCodes = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address!,
          dAreaCode: undefined,
          hAreaCode: undefined,
          fAreaCode: undefined
        }
      };
      component.detailData = detailWithoutAreaCodes;

      component.ngOnInit();

      expect(component.form.get('workPhone')?.value).toBe('5551234');
      expect(component.form.get('homePhone')?.value).toBe('5554321');
      expect(component.form.get('fax')?.value).toBe('5559999');
    });

    it('should handle missing phone numbers', () => {
      const detailWithoutPhones = {
        ...mockContactDetail,
        address: {
          ...mockContactDetail.address!,
          dAreaCode: undefined,
          dPhoneNo: undefined,
          hAreaCode: undefined,
          hPhoneNo: undefined,
          fAreaCode: undefined,
          fPhoneNo: undefined
        }
      };
      component.detailData = detailWithoutPhones;

      component.ngOnInit();

      expect(component.form.get('workPhone')?.value).toBe('-');
      expect(component.form.get('homePhone')?.value).toBe('-');
      expect(component.form.get('fax')?.value).toBe('-');
    });
  });

  describe('Phone Formatting', () => {
    it('should format phone with area code and number', () => {
      const formatted = component.getFormattedPhone('310', '5551234');
      expect(formatted).toBe('(310) 5551234');
    });

    it('should return only phone number when no area code', () => {
      const formatted = component.getFormattedPhone(undefined, '5551234');
      expect(formatted).toBe('5551234');
    });

    it('should return only area code when no phone number', () => {
      const formatted = component.getFormattedPhone('310', undefined);
      expect(formatted).toBe('310');
    });

    it('should return "-" when both are missing', () => {
      const formatted = component.getFormattedPhone(undefined, undefined);
      expect(formatted).toBe('-');
    });

    it('should return "-" when both are empty strings', () => {
      const formatted = component.getFormattedPhone('', '');
      expect(formatted).toBe('-');
    });
  });


  describe('Loading States', () => {
    it('should accept isLoading input', () => {
      component.isLoading = true;
      expect(component.isLoading).toBeTrue();

      component.isLoading = false;
      expect(component.isLoading).toBeFalse();
    });

    it('should initialize with isLoading false by default', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should handle null detailData', () => {
      component.detailData = null;
      component.ngOnInit();

      expect(component.address).toEqual({});
    });
  });

  describe('OnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update address when detailData changes', () => {
      const newDetailData: SponsorContactDetailModel = {
        ...mockContactDetail,
        address: {
          streetName: '456 New St',
          zip: '20002',
          city: 'Washington',
          uspsId: 456,
          email: 'new@example.com',
          webAddress: 'www.newsite.com'
        }
      };

      component.detailData = newDetailData;
      component.ngOnChanges({
        detailData: new SimpleChange(mockContactDetail, newDetailData, false)
      });

      expect(component.address).toEqual(newDetailData.address);
      expect(component.form.get('street')?.value).toBe('456 New St');
      expect(component.form.get('zipCode')?.value).toBe('20002');
      expect(component.form.get('city')?.value).toBe('Washington');
    });

  });

  describe('Data Handling With Different Inputs', () => {
    it('should use detailData address when available', () => {
      component.data = mockContactData;
      component.detailData = mockContactDetail;

      component.ngOnInit();

      expect(component.address).toEqual(mockContactDetail.address);
    });

    it('should handle null detailData', () => {
      component.data = mockContactData;
      component.detailData = null;

      component.ngOnInit();

      expect(component.address).toEqual({});
    });

    it('should handle both inputs being null', () => {
      component.data = null;
      component.detailData = null;

      component.ngOnInit();

      expect(component.address).toEqual({});
    });

    it('should handle detailData with null address', () => {
      component.data = mockContactData;
      component.detailData = {
        ...mockContactDetail,
        address: null as any
      };

      component.ngOnInit();

      expect(component.address).toEqual({});
    });
  });
});
