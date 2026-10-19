import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';

import { ViewContactDetailsComponent } from './view-contact-details';
import { SponsorContactModel, SponsorContactDetailModel } from '../../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';

describe('ViewContactDetailsComponent', () => {
  let component: ViewContactDetailsComponent;
  let fixture: ComponentFixture<ViewContactDetailsComponent>;

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
    termDate: '31-DEC-2026',
    sponsorName: 'Test Sponsor',
    notes: [],
    address: {
      streetName: '123 Main St',
      uspsId: 123,
      dPhoneNo: '1234567',
      hPhoneNo: '7654321',
      fPhoneNo: '1111111',
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
      imports: [ViewContactDetailsComponent, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        FormBuilder
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ViewContactDetailsComponent);
    component = fixture.componentInstance;
    component.data = mockContactData;
    component.detailData = mockContactDetail;


    });

  describe('Component Initialization', () => {


    it('should use detailData on init', () => {
      fixture.detectChanges();

      expect(component.contactDetail).toEqual(mockContactDetail);
    });

    it('should have all form fields enabled for readonly binding', () => {
      fixture.detectChanges();

      expect(component.form.get('honorific')?.disabled).toBeFalse();
      expect(component.form.get('firstName')?.disabled).toBeFalse();
      expect(component.form.get('lastName')?.disabled).toBeFalse();
      expect(component.form.get('type')?.disabled).toBeFalse();
      expect(component.form.get('title')?.disabled).toBeFalse();
      expect(component.form.get('effectiveDate')?.disabled).toBeFalse();
      expect(component.form.get('terminationDate')?.disabled).toBeFalse();
    });
  });

  describe('Form Population', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should format effective date correctly', () => {
      const effectiveDate = component.form.get('effectiveDate')?.value;
      expect(effectiveDate).toMatch(/^[0-9]{2}-[A-Z]{3}-[0-9]{4}$/);
    });

    it('should format termination date correctly', () => {
      const termDate = component.form.get('terminationDate')?.value;
      expect(termDate).toMatch(/^[0-9]{2}-[A-Z]{3}-[0-9]{4}$/);
    });

    it('should handle missing termination date', () => {
      const detailWithoutTermDate = {
        ...mockContactDetail,
        termDate: undefined
      };
      component.detailData = detailWithoutTermDate;

      component.ngOnInit();

      expect(component.form.get('terminationDate')?.value).toBe('-');
    });


    it('should handle missing contact detail', () => {
      component.contactDetail = null;

      // Should not throw error when contactDetail is null
      expect(() => component['populateForm']()).not.toThrow();

      // Form should remain unchanged (still has previous values)
      expect(component.form).toBeDefined();
    });
  });

  describe('Date Formatting', () => {
    it('should format valid date in uppercase', () => {
      const formatted = component.getFormattedDate('15-JUN-2020');
      expect(formatted).toMatch(/^[0-9]{2}-[A-Z]{3}-[0-9]{4}$/);
    });




    it('should return "-" for "-" value', () => {
      const formatted = component.getFormattedDate('-');
      expect(formatted).toBe('-');
    });

    it('should return "-" for invalid date', () => {
      const formatted = component.getFormattedDate('invalid-date');
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

    it('should use detailData when available', () => {
      fixture.detectChanges();

      expect(component.contactDetail).toEqual(mockContactDetail);
    });

    it('should fallback to data when detailData is not available', () => {
      component.detailData = null;
      component.ngOnInit();

      expect(component.contactDetail).toEqual(mockContactData);
    });
  });

  describe('OnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update contactDetail when detailData changes', () => {
      const newDetailData: SponsorContactDetailModel = {
        ...mockContactDetail,
        firstName: 'Jane',
        lastName: 'Smith'
      };

      component.detailData = newDetailData;
      component.ngOnChanges({
        detailData: new SimpleChange(mockContactDetail, newDetailData, false)
      });

      expect(component.contactDetail).toEqual(newDetailData);
      expect(component.form.get('firstName')?.value).toBe('Jane');
      expect(component.form.get('lastName')?.value).toBe('Smith');
    });

  });

  describe('Data Handling With Different Inputs', () => {
    it('should use detailData when both data and detailData are provided', () => {
      component.data = mockContactData;
      component.detailData = mockContactDetail;

      component.ngOnInit();

      expect(component.contactDetail).toEqual(mockContactDetail);
    });

    it('should fallback to data when detailData is null', () => {
      component.data = mockContactData;
      component.detailData = null;

      component.ngOnInit();

      expect(component.contactDetail).toEqual(mockContactData);
    });


  });
});
