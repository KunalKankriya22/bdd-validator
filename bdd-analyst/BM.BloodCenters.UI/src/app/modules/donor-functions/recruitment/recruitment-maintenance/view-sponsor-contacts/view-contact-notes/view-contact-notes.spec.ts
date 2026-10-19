import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';

import { ViewContactNotesComponent } from './view-contact-notes';
import { SponsorContactModel, SponsorContactDetailModel } from '../../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';

describe('ViewContactNotesComponent', () => {
  let component: ViewContactNotesComponent;
  let fixture: ComponentFixture<ViewContactNotesComponent>;

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

  const mockNotes = [
    {
      noteId: 'NOTE001',
      contactId: 'CONTACT123',
      notes: 'This is the first note about the contact.',
      createdBy: 'John Smith',
      createdDate: '2024-01-15',
      version: '1.0'
    },
    {
      noteId: 'NOTE002',
      contactId: 'CONTACT123',
      notes: 'Follow up scheduled for next week.',
      createdBy: 'Jane Doe',
      createdDate: '2024-02-20',
      version: '2.0'
    },
    {
      noteId: 'NOTE003',
      contactId: 'CONTACT123',
      notes: 'Contact confirmed availability.',
      createdBy: 'Bob Johnson',
      createdDate: '2024-03-10',
      version: '3.0'
    }
  ];

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
    notes: mockNotes,
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
      imports: [ViewContactNotesComponent],
      providers: [
        provideNoopAnimations()
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ViewContactNotesComponent);
    component = fixture.componentInstance;
    component.data = mockContactData;
    component.detailData = mockContactDetail;


    });

  describe('Component Initialization', () => {

    it('should load notes from detailData on init', () => {
      fixture.detectChanges();

      expect(component.notes).toEqual(mockNotes);
    });

    it('should initialize notes array', () => {
      fixture.detectChanges();

      expect(component.notes).toEqual(mockNotes);
      expect(component.notes.length).toBe(3);
    });
  });

  describe('Notes Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate notes from contact detail', () => {
      expect(component.notes).toEqual(mockNotes);
    });

    it('should handle empty notes array', () => {
      const detailWithoutNotes = {
        ...mockContactDetail,
        notes: []
      };
      component.detailData = detailWithoutNotes;

      component.ngOnInit();

      expect(component.notes).toEqual([]);
    });

    it('should handle null notes', () => {
      const detailWithNullNotes = {
        ...mockContactDetail,
        notes: null as any
      };
      component.detailData = detailWithNullNotes;

      component.ngOnInit();

      expect(component.notes).toEqual([]);
    });

    it('should handle undefined notes', () => {
      const detailWithUndefinedNotes = {
        ...mockContactDetail,
        notes: undefined as any
      };
      component.detailData = detailWithUndefinedNotes;

      component.ngOnInit();

      expect(component.notes).toEqual([]);
    });
  });

  describe('Initials Generation', () => {
    it('should generate initials from first and last name', () => {
      const initials = component.getInitials('John Smith');
      expect(initials).toBe('JS');
    });

    it('should generate initials from multi-word name', () => {
      const initials = component.getInitials('Mary Jane Watson');
      expect(initials).toBe('MW');
    });

    it('should generate initials from single name', () => {
      const initials = component.getInitials('John');
      expect(initials).toBe('JO');
    });

    it('should handle empty name', () => {
      const initials = component.getInitials('');
      expect(initials).toBe('?');
    });

    it('should handle null name', () => {
      const initials = component.getInitials(null as any);
      expect(initials).toBe('?');
    });

    it('should handle undefined name', () => {
      const initials = component.getInitials(undefined as any);
      expect(initials).toBe('?');
    });

    it('should convert initials to uppercase', () => {
      const initials = component.getInitials('john doe');
      expect(initials).toBe('JD');
    });

    it('should handle names with extra spaces', () => {
      const initials = component.getInitials('  John   Doe  ');
      expect(initials).toBe('JD');
    });
  });

  describe('Date Formatting', () => {
    it('should format valid date in uppercase', () => {
      const formatted = component.formatDate('2024-01-15');
      expect(formatted).toMatch(/^[0-9]{2}-[A-Z]{3}-[0-9]{4}$/);
    });




    it('should return "-" for invalid date', () => {
      const formatted = component.formatDate('invalid-date');
      expect(formatted).toBe('-');
    });

    it('should handle various date formats', () => {
      const formatted1 = component.formatDate('2024-01-15');
      const formatted2 = component.formatDate('15-JAN-2024');

      expect(formatted1).toMatch(/^[0-9]{2}-[A-Z]{3}-[0-9]{4}$/);
      expect(formatted2).toMatch(/^[0-9]{2}-[A-Z]{3}-[0-9]{4}$/);
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

      expect(component.notes).toEqual([]);
    });
  });

  describe('OnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update notes when detailData changes', () => {
      const newDetailData = {
        ...mockContactDetail,
        notes: [
          {
            noteId: 'NOTE999',
            contactId: 'CONTACT999',
            notes: 'New note',
            createdBy: 'Test User',
            createdDate: '2024-04-01',
            version: '1.0'
          }
        ]
      };

      component.detailData = newDetailData;
      component.ngOnChanges({
        detailData: new SimpleChange(mockContactDetail, newDetailData, false)
      });

      expect(component.notes).toEqual(newDetailData.notes);
      expect(component.notes.length).toBe(1);
    });

    it('should update notes when data changes', () => {
      const newData = {
        ...mockContactData,
        sponsorId: 'SPONSOR999'
      };

      component.data = newData;
      component.ngOnChanges({
        data: new SimpleChange(mockContactData, newData, false)
      });

      // Notes should still be from detailData
      expect(component.notes).toEqual(mockNotes);
    });
  });

  describe('Data Handling With Different Inputs', () => {

    it('should handle null data', () => {
      component.data = null;

      component.ngOnInit();

      expect(component.notes).toEqual(mockNotes);
    });

    it('should use detailData for notes regardless of data state', () => {
      component.data = null;
      component.detailData = mockContactDetail;

      component.ngOnInit();

      expect(component.notes).toEqual(mockNotes);
    });

    it('should handle when detailData is null', () => {
      component.data = mockContactData;
      component.detailData = null;

      component.ngOnInit();

      expect(component.notes).toEqual([]);
    });
  });
});
