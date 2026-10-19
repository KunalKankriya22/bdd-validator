import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { MaintainSponsorContactsComponent } from './maintain-sponsor-contacts';
import { MaintainSponsorContactsService } from './services/maintain-sponsor-contacts.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SponsorContactModel, SponsorLookupItem } from './models/maintain-sponsor-contacts.model';
import { InternationalAddressService } from '@shared/services/international-address.service';

describe('MaintainSponsorContactsComponent', () => {
  let component: MaintainSponsorContactsComponent;
  let fixture: ComponentFixture<MaintainSponsorContactsComponent>;
  let mockService: jasmine.SpyObj<MaintainSponsorContactsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  // Reuse signal instances across tests — must be module-level so they survive beforeEach
  const chapterIdSig = signal<string>('CHAPTER1');
  const pageHeaderDataSig = signal<any>(null);

  const mockContact: SponsorContactModel = {
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
    effDate: '2026-01-15',
    termDate: null,
    sponsorName: 'Test Sponsor',
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '2026-01-01',
    insertUser: 'testuser',
    auditKey: 1
  };

  beforeEach(async () => {
    // Reset signals before each test
    chapterIdSig.set('CHAPTER1');
    pageHeaderDataSig.set(null);

    mockService = jasmine.createSpyObj('MaintainSponsorContactsService', [
      'getSponsorIds',
      'getSponsorContacts',
      'getSalutations',
      'getContactTypes',
      'getTitles',
      'getZipCodes',
      'createContact',
      'getContactDetail',
      'updateContact',
      'addContactNote',
      'updateContactNote',
      'deleteContactNote',
      'getCountries',
      'getLookupValues'
    ]);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockService.getSponsorIds.and.returnValue(of([]));
    mockService.getSponsorContacts.and.returnValue(of({ data: [], totalRecords: 0 }));
    mockService.getSalutations.and.returnValue(of([]));
    mockService.getContactTypes.and.returnValue(of([]));
    mockService.getTitles.and.returnValue(of([]));
    mockService.getZipCodes.and.returnValue(of([]));
    mockService.getContactDetail.and.returnValue(of({ notes: [], address: {} } as any));
    mockService.getCountries.and.returnValue(of([]));

    const mockIntlAddressService = jasmine.createSpyObj('InternationalAddressService', ['getCountries']);
    mockIntlAddressService.getCountries.and.returnValue(of([]));

    const mockHeaderSvc = {
      chapterId: chapterIdSig,
      getCurrentChapterId: jasmine.createSpy('getCurrentChapterId').and.returnValue('CHAPTER1'),
      getCurrentChapterTimezone: jasmine.createSpy('getCurrentChapterTimezone').and.returnValue('America/New_York')
    };

    const mockPageHeaderSvc = {
      pageHeaderData: pageHeaderDataSig,
      getTitle: jasmine.createSpy('getTitle').and.returnValue(''),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue('')
    };

    await TestBed.configureTestingModule({
      imports: [MaintainSponsorContactsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        FormBuilder,
        { provide: MaintainSponsorContactsService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderSvc },
        { provide: PageHeaderService, useValue: mockPageHeaderSvc },
        { provide: InternationalAddressService, useValue: mockIntlAddressService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MaintainSponsorContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==================== ngOnDestroy ====================

  describe('ngOnDestroy', () => {
    it('should complete destroy$', () => {
      const nextSpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ==================== loadSponsorLookup ====================

  describe('loadSponsorLookup', () => {
    it('should set sponsorOptionsSignal on success', () => {
      const sponsors: SponsorLookupItem[] = [{ sponsorId: 'S1', name: 'Sponsor 1' }];
      mockService.getSponsorIds.and.returnValue(of(sponsors));
      (component as any).loadSponsorLookup();
      expect(component.sponsorOptionsSignal()).toEqual(sponsors);
    });

    it('should clear sponsorOptionsSignal on error', () => {
      mockService.getSponsorIds.and.returnValue(throwError(() => new Error('API Error')));
      (component as any).loadSponsorLookup();
      expect(component.sponsorOptionsSignal()).toEqual([]);
    });
  });

  // ==================== filteredSponsorOptions ====================

  describe('filteredSponsorOptions', () => {
    it('should return all options when search is empty', () => {
      const sponsors: SponsorLookupItem[] = [
        { sponsorId: 'S1', name: 'Alpha' },
        { sponsorId: 'S2', name: 'Beta' }
      ];
      component.sponsorOptionsSignal.set(sponsors);
      component.sponsorSearch.set('');
      expect(component.filteredSponsorOptions()).toEqual(sponsors);
    });

    it('should filter by sponsorId', () => {
      const sponsors: SponsorLookupItem[] = [
        { sponsorId: 'S1', name: 'Alpha' },
        { sponsorId: 'S2', name: 'Beta' }
      ];
      component.sponsorOptionsSignal.set(sponsors);
      component.sponsorSearch.set('s1');
      expect(component.filteredSponsorOptions().length).toBe(1);
      expect(component.filteredSponsorOptions()[0].sponsorId).toBe('S1');
    });

    it('should filter by sponsor name', () => {
      const sponsors: SponsorLookupItem[] = [
        { sponsorId: 'S1', name: 'Alpha Inc' },
        { sponsorId: 'S2', name: 'Beta Corp' }
      ];
      component.sponsorOptionsSignal.set(sponsors);
      component.sponsorSearch.set('alpha');
      expect(component.filteredSponsorOptions().length).toBe(1);
      expect(component.filteredSponsorOptions()[0].name).toBe('Alpha Inc');
    });

    it('should return empty array when nothing matches', () => {
      const sponsors: SponsorLookupItem[] = [
        { sponsorId: 'S1', name: 'Alpha' }
      ];
      component.sponsorOptionsSignal.set(sponsors);
      component.sponsorSearch.set('XXXXXX');
      expect(component.filteredSponsorOptions()).toEqual([]);
    });
  });

  // ==================== activeHighlightedRow ====================

  describe('activeHighlightedRow', () => {
    it('should return sidePanelData when set', () => {
      component.sidePanelData = mockContact;
      expect(component.activeHighlightedRow).toBe(mockContact);
    });

    it('should return menuHighlightedRow when sidePanelData is null', () => {
      component.sidePanelData = null;
      component.menuHighlightedRow = mockContact;
      expect(component.activeHighlightedRow).toBe(mockContact);
    });

    it('should return null when both are null', () => {
      component.sidePanelData = null;
      component.menuHighlightedRow = null;
      expect(component.activeHighlightedRow).toBeNull();
    });
  });

  // ==================== sponsorSearchControl ====================

  describe('sponsorSearchControl valueChanges', () => {
    it('should update sponsorSearch signal on value change', fakeAsync(() => {
      component.sponsorSearchControl.setValue('test search');
      tick();
      expect(component.sponsorSearch()).toBe('test search');
    }));

    it('should set sponsorSearch to empty string when null', fakeAsync(() => {
      component.sponsorSearchControl.setValue(null);
      tick();
      expect(component.sponsorSearch()).toBe('');
    }));
  });

  // ==================== onRetrieve ====================

  describe('onRetrieve', () => {
    it('should mark sponsorId as touched when invalid', () => {
      component.searchForm.get('sponsorId')?.setValue('');
      component.onRetrieve();
      expect(component.searchForm.get('sponsorId')?.touched).toBeTrue();
    });

    it('should not call loadData when sponsorId is empty', () => {
      spyOn(component, 'loadData');
      component.searchForm.get('sponsorId')?.setValue('');
      component.onRetrieve();
      expect(component.loadData).not.toHaveBeenCalled();
    });

    it('should call loadData when sponsorId is valid', () => {
      spyOn(component, 'loadData');
      component.searchForm.get('sponsorId')?.setValue('SPONSOR123');
      component.onRetrieve();
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should set hasRetrieved to true', () => {
      component.searchForm.get('sponsorId')?.setValue('SPONSOR123');
      component.onRetrieve();
      expect(component.hasRetrieved).toBeTrue();
    });

    it('should reset page index to 0', () => {
      component.searchForm.get('sponsorId')?.setValue('SPONSOR123');
      component.tableConfig.pagination!.pageIndex = 5;
      component.onRetrieve();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should build requestState from form values', () => {
      component.searchForm.patchValue({
        sponsorId: 'SPONSOR123',
        contactName: '  John  ',
        matchType: 'Exact',
        showTerminated: true
      });
      component.onRetrieve();
      expect(component.requestState.sponsorId).toBe('SPONSOR123');
      expect(component.requestState.contactName).toBe('John');
      expect(component.requestState.matchType).toBe('Exact');
      expect(component.requestState.showTerminated).toBeTrue();
    });

    it('should omit showTerminated when empty string', () => {
      component.searchForm.patchValue({ sponsorId: 'S1', showTerminated: '' });
      component.onRetrieve();
      expect(component.requestState.showTerminated).toBeUndefined();
    });
  });

  // ==================== loadData ====================

  describe('loadData', () => {
    it('should populate dataSource on success', () => {
      const mockData = [mockContact];
      mockService.getSponsorContacts.and.returnValue(of({ data: mockData, totalRecords: 1 }));
      component.loadData();
      expect(component.dataSource.length).toBe(1);
      expect(component.tableConfig.pagination!.totalRecords).toBe(1);
      expect(component.isLoading).toBeFalse();
    });

    it('should clear dataSource on error', () => {
      mockService.getSponsorContacts.and.returnValue(throwError(() => new Error()));
      component.loadData();
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBeFalse();
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should trim leading spaces from response data', () => {
      const rawContact = {
        ...mockContact,
        firstName: '  John',
        lastName: '  Doe',
        salutationDescription: '  Mr.'
      };
      mockService.getSponsorContacts.and.returnValue(of({ data: [rawContact], totalRecords: 1 }));
      component.loadData();
      expect(component.dataSource[0].firstName).toBe('John');
      expect(component.dataSource[0].lastName).toBe('Doe');
    });
  });

  // ==================== trimContactData ====================

  describe('trimContactData', () => {
    it('should trim leading spaces from all text fields', () => {
      const data = [{
        ...mockContact,
        firstName: '  John',
        lastName: '  Doe',
        salutationDescription: '  Mr.',
        contactTypeDescription: '  Primary',
        titleDescription: '  Manager'
      }];
      const result = (component as any).trimContactData(data);
      expect(result[0].firstName).toBe('John');
      expect(result[0].lastName).toBe('Doe');
      expect(result[0].salutationDescription).toBe('Mr.');
      expect(result[0].contactTypeDescription).toBe('Primary');
      expect(result[0].titleDescription).toBe('Manager');
    });

    it('should preserve null fields', () => {
      const data = [{ ...mockContact, firstName: null as any, lastName: 'Doe' }];
      const result = (component as any).trimContactData(data);
      expect(result[0].firstName).toBeNull();
    });
  });

  // ==================== onPageChange ====================

  describe('onPageChange', () => {
    it('should update pagination and reload', () => {
      spyOn(component, 'loadData');
      component.onPageChange({ pageIndex: 2, pageSize: 50 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  // ==================== onSortChange ====================

  describe('onSortChange', () => {
    it('should update sort config and reload', () => {
      spyOn(component, 'loadData');
      component.onSortChange({ column: 'lastName', direction: 'A' });
      expect(component.tableConfig.sortConfig!.column).toBe('lastName');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(component.requestState.sort).toBe('A');
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should set sort to undefined when direction is default', () => {
      spyOn(component, 'loadData');
      component.onSortChange({ column: 'lastName', direction: 'default' });
      expect(component.requestState.sort).toBeUndefined();
    });
  });

  // ==================== onRowAction ====================

  describe('onRowAction', () => {
    it('should call openEditContact on edit action', () => {
      spyOn(component, 'openEditContact');
      component.onRowAction({ action: 'edit', row: mockContact });
      expect(component.openEditContact).toHaveBeenCalledWith(mockContact);
    });

    it('should set menuRow and menuHighlightedRow on menu action', fakeAsync(() => {
      component.onRowAction({ action: 'menu', row: mockContact });
      tick(0);
      expect(component.menuRow).toBe(mockContact);
      expect(component.menuHighlightedRow).toBe(mockContact);
    }));

    it('should call openContactAddress on address action', () => {
      spyOn(component, 'openContactAddress');
      component.onRowAction({ action: 'address', row: mockContact });
      expect(component.openContactAddress).toHaveBeenCalledWith(mockContact);
    });

    it('should call openInternationalAddress on intlAddress action', () => {
      spyOn(component, 'openInternationalAddress');
      component.onRowAction({ action: 'intlAddress', row: mockContact });
      expect(component.openInternationalAddress).toHaveBeenCalledWith(mockContact);
    });

    it('should call openContactNotes on notes action', () => {
      spyOn(component, 'openContactNotes');
      component.onRowAction({ action: 'notes', row: mockContact });
      expect(component.openContactNotes).toHaveBeenCalledWith(mockContact);
    });
  });

  // ==================== onMenuAction ====================

  describe('onMenuAction', () => {
    it('should do nothing when menuRow is null', () => {
      component.menuRow = null;
      spyOn(component, 'openContactAddress');
      component.onMenuAction('address');
      expect(component.openContactAddress).not.toHaveBeenCalled();
    });

    it('should open contact address when action is address', () => {
      component.menuRow = mockContact;
      spyOn(component, 'openContactAddress');
      component.onMenuAction('address');
      expect(component.openContactAddress).toHaveBeenCalledWith(mockContact);
      expect(component.menuRow).toBeNull();
    });

    it('should open international address when action is intlAddress', () => {
      component.menuRow = mockContact;
      spyOn(component, 'openInternationalAddress');
      component.onMenuAction('intlAddress');
      expect(component.openInternationalAddress).toHaveBeenCalledWith(mockContact);
      expect(component.menuRow).toBeNull();
    });

    it('should open contact notes when action is notes', () => {
      component.menuRow = mockContact;
      spyOn(component, 'openContactNotes');
      component.onMenuAction('notes');
      expect(component.openContactNotes).toHaveBeenCalledWith(mockContact);
      expect(component.menuRow).toBeNull();
    });

    it('should set menuActionTriggered to true', () => {
      component.menuRow = mockContact;
      component.onMenuAction('address');
      expect((component as any).menuActionTriggered).toBeTrue();
    });
  });

  // ==================== onContextMenuClosed ====================

  describe('onContextMenuClosed', () => {
    it('should clear menuHighlightedRow when no action was triggered', () => {
      component.menuHighlightedRow = mockContact;
      (component as any).menuActionTriggered = false;
      component.onContextMenuClosed();
      expect(component.menuHighlightedRow).toBeNull();
    });

    it('should keep menuHighlightedRow when action was triggered', () => {
      component.menuHighlightedRow = mockContact;
      (component as any).menuActionTriggered = true;
      component.onContextMenuClosed();
      expect(component.menuHighlightedRow).toBe(mockContact);
    });

    it('should reset menuActionTriggered', () => {
      (component as any).menuActionTriggered = true;
      component.onContextMenuClosed();
      expect((component as any).menuActionTriggered).toBeFalse();
    });
  });

  // ==================== clearField ====================

  describe('clearField', () => {
    it('should clear the specified form field and stop propagation', () => {
      component.searchForm.get('contactName')?.setValue('John Doe');
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');
      component.clearField('contactName', event);
      expect(component.searchForm.get('contactName')?.value).toBe('');
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  // ==================== openAddNewContact ====================

  describe('openAddNewContact', () => {
    it('should not open when sponsorId is invalid', () => {
      component.searchForm.get('sponsorId')?.setValue('');
      component.openAddNewContact();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should mark sponsorId as touched when invalid', () => {
      component.searchForm.get('sponsorId')?.setValue('');
      component.openAddNewContact();
      expect(component.searchForm.get('sponsorId')?.touched).toBeTrue();
    });

    it('should open add panel when sponsorId is valid', () => {
      component.searchForm.get('sponsorId')?.setValue('SPONSOR123');
      component.openAddNewContact();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });
  });

  // ==================== openEditContact ====================

  describe('openEditContact', () => {
    it('should open edit panel with contact data', () => {
      component.openEditContact(mockContact);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('edit');
      expect(component.sidePanelData).toBe(mockContact);
    });
  });

  // ==================== openContactAddress ====================

  describe('openContactAddress', () => {
    it('should open address panel with contact data', () => {
      component.openContactAddress(mockContact);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('address');
      expect(component.sidePanelData).toBe(mockContact);
    });
  });

  // ==================== openInternationalAddress ====================

  describe('openInternationalAddress', () => {
    it('should open international address panel', () => {
      component.openInternationalAddress(mockContact);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('intlAddress');
      expect(component.sidePanelData).toBe(mockContact);
    });
  });

  // ==================== openContactNotes ====================

  describe('openContactNotes', () => {
    it('should open notes panel', () => {
      component.openContactNotes(mockContact);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelType).toBe('notes');
      expect(component.sidePanelData).toBe(mockContact);
    });
  });

  // ==================== closeSidePanel ====================

  describe('closeSidePanel', () => {
    it('should close side panel and clear all state', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockContact;
      component.menuHighlightedRow = mockContact;
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.menuHighlightedRow).toBeNull();
    });
  });

  // ==================== onSaveSuccess ====================

  describe('onSaveSuccess', () => {
    it('should close panel and not reload when hasRetrieved is false', () => {
      spyOn(component, 'loadData');
      component.hasRetrieved = false;
      component.sidePanelOpen = true;
      component.sidePanelData = mockContact;
      component.onSaveSuccess();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.loadData).not.toHaveBeenCalled();
    });

    it('should close panel and reload when hasRetrieved is true', () => {
      spyOn(component, 'loadData');
      component.hasRetrieved = true;
      component.sidePanelOpen = true;
      component.onSaveSuccess();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  // ==================== onAddAndContinue ====================

  describe('onAddAndContinue', () => {
    it('should reload when hasRetrieved is true', () => {
      spyOn(component, 'loadData');
      component.hasRetrieved = true;
      component.onAddAndContinue();
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should not reload when hasRetrieved is false', () => {
      spyOn(component, 'loadData');
      component.hasRetrieved = false;
      component.onAddAndContinue();
      expect(component.loadData).not.toHaveBeenCalled();
    });
  });

  // ==================== handleKeyboardShortcut ====================

  describe('handleKeyboardShortcut', () => {
    it('should open add new contact on Alt+C', () => {
      spyOn(component, 'openAddNewContact');
      const event = new KeyboardEvent('keydown', { key: 'c', altKey: true, cancelable: true });
      component.handleKeyboardShortcut(event);
      expect(component.openAddNewContact).toHaveBeenCalled();
    });

    it('should open add new contact on Alt+C uppercase', () => {
      spyOn(component, 'openAddNewContact');
      const event = new KeyboardEvent('keydown', { key: 'C', altKey: true, cancelable: true });
      component.handleKeyboardShortcut(event);
      expect(component.openAddNewContact).toHaveBeenCalled();
    });

    it('should close side panel on Escape when panel is open', () => {
      component.sidePanelOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      component.handleKeyboardShortcut(event);
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not close side panel on Escape when panel is already closed', () => {
      component.sidePanelOpen = false;
      const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      component.handleKeyboardShortcut(event);
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not act on unrelated keys', () => {
      spyOn(component, 'openAddNewContact');
      const event = new KeyboardEvent('keydown', { key: 'a', altKey: false });
      component.handleKeyboardShortcut(event);
      expect(component.openAddNewContact).not.toHaveBeenCalled();
    });
  });

  // ==================== formatSponsorDisplay ====================

  describe('formatSponsorDisplay', () => {
    it('should return sponsorId when name is empty string', () => {
      expect(component.formatSponsorDisplay('S1', '')).toBe('S1');
    });

    it('should return sponsorId when name is null', () => {
      expect(component.formatSponsorDisplay('S1', null)).toBe('S1');
    });

    it('should return sponsorId when name is whitespace only', () => {
      expect(component.formatSponsorDisplay('S1', '   ')).toBe('S1');
    });

    it('should return full display when name length is within limit', () => {
      expect(component.formatSponsorDisplay('S1', 'Short')).toBe('S1 - Short');
    });

    it('should truncate long names with ellipsis', () => {
      const result = component.formatSponsorDisplay('S1', 'A Very Long Sponsor Name Here');
      expect(result).toContain('...');
      expect(result.startsWith('S1 - ')).toBeTrue();
    });

    it('should use exactly 5 chars before ellipsis for long names', () => {
      const result = component.formatSponsorDisplay('SPID', 'ABCDEFGHIJKLMNOPQ');
      expect(result).toBe('SPID - ABCDE...');
    });
  });

  // ==================== getSponsorTooltip ====================

  describe('getSponsorTooltip', () => {
    it('should return sponsorId when name is null', () => {
      expect(component.getSponsorTooltip('S1', null)).toBe('S1');
    });

    it('should return sponsorId when name is undefined', () => {
      expect(component.getSponsorTooltip('S1', undefined)).toBe('S1');
    });

    it('should return sponsorId when name is whitespace', () => {
      expect(component.getSponsorTooltip('S1', '  ')).toBe('S1');
    });

    it('should return full display string', () => {
      expect(component.getSponsorTooltip('S1', 'Sponsor Name')).toBe('S1 - Sponsor Name');
    });
  });

  // ==================== preventLeadingSpace ====================

  describe('preventLeadingSpace', () => {
    it('should prevent space when input is empty', () => {
      const inputEl = document.createElement('input');
      inputEl.value = '';
      const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.preventLeadingSpace(event, 'contactName');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent space when input has only spaces', () => {
      const inputEl = document.createElement('input');
      inputEl.value = '   ';
      const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.preventLeadingSpace(event, 'contactName');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow space when input has content beyond cursor', () => {
      const inputEl = document.createElement('input');
      inputEl.value = 'abc';
      Object.defineProperty(inputEl, 'selectionStart', { value: 3 });
      const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.preventLeadingSpace(event, 'contactName');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not act on non-space keys', () => {
      const inputEl = document.createElement('input');
      inputEl.value = '';
      const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.preventLeadingSpace(event, 'contactName');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ==================== trimLeadingSpace ====================

  describe('trimLeadingSpace', () => {
    it('should trim leading space from input', () => {
      const inputEl = document.createElement('input');
      inputEl.value = '  Test';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.searchForm.get('contactName')?.setValue('  Test');
      component.trimLeadingSpace(event, 'contactName');
      expect(inputEl.value).toBe('Test');
      expect(component.searchForm.get('contactName')?.value).toBe('Test');
    });

    it('should not modify input when no leading space', () => {
      const inputEl = document.createElement('input');
      inputEl.value = 'Test';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.trimLeadingSpace(event, 'contactName');
      expect(inputEl.value).toBe('Test');
    });
  });

  // ==================== onPaste ====================

  describe('onPaste', () => {
    it('should paste trimmed text and update form control', fakeAsync(() => {
      component.searchForm.get('contactName')?.setValue('');
      const inputEl = document.createElement('input');
      inputEl.value = '';
      Object.defineProperty(inputEl, 'selectionStart', { value: 0 });
      Object.defineProperty(inputEl, 'selectionEnd', { value: 0 });
      const clipboardData = { getData: jasmine.createSpy().and.returnValue('  pasted text') };
      const event = { preventDefault: jasmine.createSpy(), clipboardData, target: inputEl } as any;
      component.onPaste(event, 'contactName');
      tick(0);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.searchForm.get('contactName')?.value).toBe('pasted text');
    }));

    it('should handle null clipboardData', fakeAsync(() => {
      const inputEl = document.createElement('input');
      inputEl.value = '';
      Object.defineProperty(inputEl, 'selectionStart', { value: 0 });
      Object.defineProperty(inputEl, 'selectionEnd', { value: 0 });
      const event = { preventDefault: jasmine.createSpy(), clipboardData: null, target: inputEl } as any;
      expect(() => component.onPaste(event, 'contactName')).not.toThrow();
      tick(0);
    }));
  });

  // ==================== getTableColumns valueFormatters ====================

  describe('getTableColumns valueFormatters', () => {
    let columns: any[];

    beforeEach(() => {
      columns = (component as any).getTableColumns();
    });

    it('should format effDate with a date value', () => {
      const effDateCol = columns.find((c: any) => c.key === 'effDate');
      const result = effDateCol?.valueFormatter('2026-01-15');
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should return dash for null effDate', () => {
      const effDateCol = columns.find((c: any) => c.key === 'effDate');
      expect(effDateCol?.valueFormatter(null)).toBe('-');
    });

    it('should return dash for falsy effDate', () => {
      const effDateCol = columns.find((c: any) => c.key === 'effDate');
      expect(effDateCol?.valueFormatter('')).toBe('-');
    });

    it('should format termDate with a date value', () => {
      const termDateCol = columns.find((c: any) => c.key === 'termDate');
      const result = termDateCol?.valueFormatter('2026-06-15');
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should return dash for null termDate', () => {
      const termDateCol = columns.find((c: any) => c.key === 'termDate');
      expect(termDateCol?.valueFormatter(null)).toBe('-');
    });
  });

  // ==================== pageHeaderData effect ====================

  describe('pageHeaderData effect', () => {
    it('should update headerConfig title when pageHeaderData changes', () => {
      pageHeaderDataSig.set({ title: 'New Title', subtitle: 'New Subtitle' });
      fixture.detectChanges();
      expect(component.headerConfig.title).toBe('New Title');
    });

    it('should set subtitle to empty string when subtitle is null', () => {
      pageHeaderDataSig.set({ title: 'Title', subtitle: null });
      fixture.detectChanges();
      expect(component.headerConfig.subtitle).toBe('');
    });

    it('should not update headerConfig when pageHeaderData is null', () => {
      pageHeaderDataSig.set(null);
      fixture.detectChanges();
      expect(component.headerConfig).toBeDefined();
    });
  });

  // ==================== formatDateDisplay ====================

  describe('formatDateDisplay', () => {
    it('should format a date as DD-MMM-YYYY', () => {
      const date = new Date(2026, 0, 5); // Jan 5, 2026
      const result = (component as any).formatDateDisplay(date);
      expect(result).toBe('05-JAN-2026');
    });

    it('should zero-pad single-digit days', () => {
      const date = new Date(2026, 11, 1); // Dec 1, 2026
      const result = (component as any).formatDateDisplay(date);
      expect(result).toBe('01-DEC-2026');
    });
  });
});
