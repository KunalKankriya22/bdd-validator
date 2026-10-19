import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';

import { ViewSponsorContactsComponent } from './view-sponsor-contacts';
import { MaintainSponsorContactsService } from '../../recruitment-administration/maintain-sponsor-contacts/services/maintain-sponsor-contacts.service';
import {
  SponsorContactModel,
  SponsorLookupItem,
  ContactNameLookupItem,
  SponsorContactDetailModel
} from '../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockMatSnackBar, createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ViewSponsorContactsComponent', () => {
  let component: ViewSponsorContactsComponent;
  let fixture: ComponentFixture<ViewSponsorContactsComponent>;
  let mockSponsorContactsService: jasmine.SpyObj<MaintainSponsorContactsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;

  const mockSponsorOptions: SponsorLookupItem[] = [
    { sponsorId: 'SPONSOR001', name: 'Test Sponsor 1' },
    { sponsorId: 'SPONSOR002', name: 'Test Sponsor 2' }
  ];

  const mockContactNames: ContactNameLookupItem[] = [
    { firstName: 'John', lastName: 'Doe' },
    { firstName: 'Jane', lastName: 'Smith' }
  ];

  const mockContactData: SponsorContactModel[] = [
    {
      sponsorId: 'SPONSOR001',
      contactId: 'CONTACT001',
      addressId: 'ADDR001',
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
      sponsorName: 'Test Sponsor 1',
      chapterId: 'CHAPTER1',
      programId: 'PROGRAM1',
      insertDate: '01-JAN-2020',
      insertUser: 'testuser',
      auditKey: 1
    },
    {
      sponsorId: 'SPONSOR002',
      contactId: 'CONTACT002',
      addressId: 'ADDR002',
      contactType: 'SECONDARY',
      contactTypeDescription: 'Secondary Contact',
      salutation: 'MRS',
      salutationDescription: 'Mrs.',
      firstName: 'Jane',
      lastName: 'Smith',
      title: 'DIR',
      titleDescription: 'Director',
      effDate: '20-JUL-2021',
      termDate: null,
      sponsorName: 'Test Sponsor 2',
      chapterId: 'CHAPTER1',
      programId: 'PROGRAM1',
      insertDate: '15-JUN-2021',
      insertUser: 'testuser',
      auditKey: 2
    }
  ];

  const mockContactDetail: SponsorContactDetailModel = {
    sponsorId: 'SPONSOR001',
    contactId: 'CONTACT001',
    addressId: 'ADDR001',
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
    sponsorName: 'Test Sponsor 1',
    notes: [],
    address: {
      addressId: 'ADDR001',
      streetName: '123 Main St',
      city: 'New York',
      zip: '10001',
      uspsId: 123
    },
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser'
  };

  beforeEach(() => {

    mockSponsorContactsService = jasmine.createSpyObj('MaintainSponsorContactsService', [
      'getSponsorIds',
      'getContactNames',
      'getSponsorContacts',
      'getContactDetail'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = createMockPageHeaderService();

    mockSponsorContactsService.getSponsorIds.and.returnValue(of(mockSponsorOptions));
    mockSponsorContactsService.getContactNames.and.returnValue(of(mockContactNames));
    mockSponsorContactsService.getSponsorContacts.and.returnValue(
      of({ data: mockContactData, totalRecords: 2 })
    );
    mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));
      TestBed.configureTestingModule({
      imports: [ViewSponsorContactsComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideNoopAnimations(),
        FormBuilder,
        { provide: MaintainSponsorContactsService, useValue: mockSponsorContactsService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });
      mockSponsorContactsService.getSponsorIds.and.returnValue(of(mockSponsorOptions));


      mockSponsorContactsService.getContactNames.and.returnValue(of(mockContactNames));


      mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));
    fixture = TestBed.createComponent(ViewSponsorContactsComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should initialize search form', () => {
      fixture.detectChanges();

      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('sponsorId')).toBeDefined();
      expect(component.searchForm.get('contactName')).toBeDefined();
      expect(component.searchForm.get('matchType')).toBeDefined();
      expect(component.searchForm.get('showTerminated')).toBeDefined();
    });



    it('should have sponsorId as required field', () => {
      fixture.detectChanges();

      const sponsorIdControl = component.searchForm.get('sponsorId');
      expect(sponsorIdControl?.hasError('required')).toBeTrue();

      sponsorIdControl?.setValue('SPONSOR001');
      expect(sponsorIdControl?.hasError('required')).toBeFalse();
    });

    it('should initialize side panel as closed', () => {
      fixture.detectChanges();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should set current year', () => {
      fixture.detectChanges();

      const currentYear = new Date().getFullYear();
      expect(component.currentYear).toBe(currentYear);
    });
  });

  describe('Dropdown Lookups', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load sponsor options on init', () => {
      expect(mockSponsorContactsService.getSponsorIds).toHaveBeenCalledWith('TST');
      expect(component.sponsorOptionsSignal()).toEqual(mockSponsorOptions);
    });

    it('should load contact name options on init', () => {
      expect(mockSponsorContactsService.getContactNames).toHaveBeenCalledWith('TST');
      expect(component.contactNameOptionsSignal()).toEqual(mockContactNames);
    });

    it('should handle sponsor lookup error', fakeAsync(() => {
      mockSponsorContactsService.getSponsorIds.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component['loadSponsorLookup']();
      tick();

      expect(component.sponsorOptionsSignal()).toEqual([]);
    }));

    it('should handle contact names lookup error', fakeAsync(() => {
      mockSponsorContactsService.getContactNames.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component['loadContactNames']();
      tick();

      expect(component.contactNameOptionsSignal()).toEqual([]);
    }));
  });

  describe('Sponsor Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should return all sponsors when search is empty', () => {
      component.sponsorSearch.set('');

      const filtered = component.filteredSponsorOptions();
      expect(filtered.length).toBe(2);
    });


  });

  describe('Contact Name Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should return all contacts when search is empty', () => {
      component.contactNameSearch.set('');

      const filtered = component.filteredContactNameOptions();
      expect(filtered.length).toBe(2);
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should retrieve data when form is valid', () => {
      component.searchForm.patchValue({ sponsorId: 'SPONSOR001' });
      component.onRetrieve();

      expect(component.hasRetrieved).toBeTrue();
      expect(mockSponsorContactsService.getSponsorContacts).toHaveBeenCalled();
    });

    it('should reset pagination on retrieve', () => {
      component.tableConfig.pagination!.pageIndex = 2;

      component.searchForm.patchValue({ sponsorId: 'SPONSOR001' });
      component.onRetrieve();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should build request state from form values', () => {
      component.searchForm.patchValue({
        sponsorId: 'SPONSOR001',
        contactName: 'John Doe',
        matchType: 'Exact',
        showTerminated: true
      });

      component.onRetrieve();

      expect(component.requestState.sponsorId).toBe('SPONSOR001');
      expect(component.requestState.contactName).toBe('John Doe');
      expect(component.requestState.matchType).toBe('Exact');
      expect(component.requestState.showTerminated).toBeTrue();
    });

    it('should trim contact name', () => {
      component.searchForm.patchValue({
        sponsorId: 'SPONSOR001',
        contactName: '  John Doe  '
      });

      component.onRetrieve();

      expect(component.requestState.contactName).toBe('John Doe');
    });

    it('should handle empty optional fields', () => {
      component.searchForm.patchValue({
        sponsorId: 'SPONSOR001',
        contactName: '',
        matchType: '',
        showTerminated: ''
      });

      component.onRetrieve();

      expect(component.requestState.contactName).toBeUndefined();
      expect(component.requestState.matchType).toBeUndefined();
      expect(component.requestState.showTerminated).toBeUndefined();
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should populate data source on successful load', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.dataSource).toEqual(mockContactData);
      expect(component.isLoading).toBeFalse();
    }));

    it('should update total records', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
    }));



    it('should calculate skip and take for pagination', () => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();

      const callArgs = mockSponsorContactsService.getSponsorContacts.calls.mostRecent().args;
      expect(callArgs[0]).toBe(25); // take
      expect(callArgs[1]).toBe(50); // skip (2 * 25)
    });
  });



  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.hasRetrieved = true;
    });



    it('should update request state sort', () => {
      component.onSortChange({ column: 'lastName', direction: 'D' });

      expect(component.requestState.sort).toBe('D');
    });




  });

  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open view panel on view action', () => {
      component.onRowAction({ row: mockContactData[0], action: 'view' });

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('view');
      expect(component.sidePanelData).toEqual(mockContactData[0]);
    });

    it('should open address panel on address action', () => {
      component.onRowAction({ row: mockContactData[0], action: 'address' });

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('address');
    });

    it('should open international address panel on intlAddress action', () => {
      component.onRowAction({ row: mockContactData[0], action: 'intlAddress' });

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('intlAddress');
    });

    it('should open notes panel on notes action', () => {
      component.onRowAction({ row: mockContactData[0], action: 'notes' });

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('notes');
    });

    it('should set menu row on menu action', () => {
      component.onRowAction({ row: mockContactData[0], action: 'menu' });

      expect(component.menuRow).toEqual(mockContactData[0]);
    });
  });

  describe('Menu Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.menuRow = mockContactData[0];
    });

    it('should open address panel from menu', () => {
      component.onMenuAction('address');

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('address');
    });

    it('should open international address panel from menu', () => {
      component.onMenuAction('intlAddress');

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('intlAddress');
    });

    it('should open notes panel from menu', () => {
      component.onMenuAction('notes');

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('notes');
    });



    it('should not open panel when menuRow is null', () => {
      component.menuRow = null;
      component.sidePanelOpen = false;

      component.onMenuAction('address');

      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('Side Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open view contact panel', () => {
      component.openViewContact(mockContactData[0]);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('view');
      expect(component.sidePanelData).toEqual(mockContactData[0]);
    });

    it('should open contact address panel', () => {
      component.openContactAddress(mockContactData[0]);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('address');
      expect(component.sidePanelData).toEqual(mockContactData[0]);
    });

    it('should open international address panel', () => {
      component.openInternationalAddress(mockContactData[0]);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('intlAddress');
      expect(component.sidePanelData).toEqual(mockContactData[0]);
    });

    it('should open contact notes panel', () => {
      component.openContactNotes(mockContactData[0]);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('notes');
      expect(component.sidePanelData).toEqual(mockContactData[0]);
    });


  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should not respond to other keys', () => {
      component.sidePanelOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const initialState = component.sidePanelOpen;

      component.handleKeyboardShortcut(event);

      expect(component.sidePanelOpen).toBe(initialState);
    });
  });

  describe('Clear Field', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear specified field', () => {
      component.searchForm.patchValue({ contactName: 'John Doe' });

      const event = new Event('click');
      spyOn(event, 'stopPropagation');

      component.clearField('contactName', event);

      expect(component.searchForm.get('contactName')?.value).toBe('');
      expect(event.stopPropagation).toHaveBeenCalled();
    });


  });

  describe('Date Formatting', () => {


    it('should pad day with zero', () => {
      const date = new Date('2024-01-05');
      const formatted = component['formatDateDisplay'](date);

      expect(formatted).toContain('05-');
    });

    it('should use uppercase month abbreviation', () => {
      const date = new Date('2024-06-15');
      const formatted = component['formatDateDisplay'](date);

      expect(formatted).toContain('-JUN-');
    });
  });
});
