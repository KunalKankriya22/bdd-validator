import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatDrawer } from '@angular/material/sidenav';
import { signal, WritableSignal } from '@angular/core';
import moment from 'moment';

import { MultipleDonorsQuery } from './multiple-donors-query';
import { MultipleDonorsQueryService } from './services/multiple-donors-query.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DonorSearchResult, MDONQ_ERROR_MESSAGES } from './models/multiple-donors-query.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('MultipleDonorsQuery', () => {
  let chapterTimezoneServiceSpy: any;
  let snackbarServiceSpy: any;
  let pageHeaderServiceSpy: any;
  let headerServiceSpy: any;
  let queryServiceSpy: any;
  // Patch MatDrawer to handle null/invalid activeElement in headless environments
  beforeAll(() => {
    const originalIsFocusWithinDrawer = (MatDrawer.prototype as any)._isFocusWithinDrawer;
    (MatDrawer.prototype as any)._isFocusWithinDrawer = function() {
      try {
        if (document.activeElement && document.activeElement instanceof Node) {
          return originalIsFocusWithinDrawer?.call(this) || false;
        }
        return false;
      } catch {
        return false;
      }
    };
  });

  let component: MultipleDonorsQuery;
  let fixture: ComponentFixture<MultipleDonorsQuery>;
  let queryService: jasmine.SpyObj<MultipleDonorsQueryService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const chapterChanged$ = new Subject<void>();

  const mockDonorData: DonorSearchResult[] = [
    {
      donorId: '0000017648',
      donorName: 'ROGERS ALLESIA',
      dateOfBirth: '1994-01-11',
      dobDay: 'TUE',
      gender: 'Female',
      bloodType: 'O+',
      totalDonations: 0,
      totalCredits: 0,
      totalGallons: 0,
      lastDonationDate: null,
      lastUnitId: null,
      dayPhoneNo: '414-645-0340',
      homePhoneNo: '414-442-7022',
      mobilePhone: null,
      donorAddress: '3432 W HADLEY ST YOUR CITY, AK 0000'
    },
    {
      donorId: '0000017649',
      donorName: 'ROGERS JAMES',
      dateOfBirth: '1988-02-22',
      dobDay: 'MON',
      gender: 'Male',
      bloodType: 'A+',
      totalDonations: 1,
      totalCredits: 0,
      totalGallons: 0,
      lastDonationDate: null,
      lastUnitId: null,
      dayPhoneNo: null,
      homePhoneNo: '555-123-4567',
      mobilePhone: '555-987-6543',
      donorAddress: '123 MAIN ST ANYTOWN, CA 90210'
    }
  ];

  const mockSearchResponse = {
    data: mockDonorData,
    totalRecords: 2,
    message: ''
  };

  beforeEach(async () => {
    queryServiceSpy = jasmine.createSpyObj('MultipleDonorsQueryService', [
      'searchDonors',
      'getMaxRowsLimit'
    ]);
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({
        title: 'Multiple Donors Query',
        subtitle: 'View Multiple Donors Query'
      })
    });
    snackbarServiceSpy = createMockSnackbarService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate'], {
      chapterLocalDate: signal(moment())
    });
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());

    queryServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
    queryServiceSpy.getMaxRowsLimit.and.returnValue(of(200));

    TestBed.configureTestingModule({
      imports: [MultipleDonorsQuery, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: MultipleDonorsQueryService, useValue: queryServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });

    fixture = TestBed.createComponent(MultipleDonorsQuery);
    component = fixture.componentInstance;
    queryService = TestBed.inject(MultipleDonorsQueryService) as jasmine.SpyObj<MultipleDonorsQueryService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
  });
  describe('Form Validation — Retrieve disabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable retrieve when no search criteria provided', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should disable retrieve when phone has error', () => {
      component.searchForm.patchValue({ phoneNumber: '12345' });
      component.validatePhoneInput();
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve with valid lastName', () => {
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should enable retrieve with valid donorId', () => {
      component.searchForm.patchValue({ donorId: '0000017648' });
      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  describe('Phone Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set phoneMin error when less than 10 digits', () => {
      component.searchForm.patchValue({ phoneNumber: '12345' });
      component.validatePhoneInput();
      expect(component.getPhoneError()).toBe(MDONQ_ERROR_MESSAGES.PHONE_MIN);
    });

    it('should clear error for valid 10-digit phone', () => {
      component.searchForm.patchValue({ phoneNumber: '1234567890' });
      component.validatePhoneInput();
      expect(component.getPhoneError()).toBe('');
    });

    it('should clear error when phone is empty', () => {
      component.searchForm.patchValue({ phoneNumber: '' });
      component.validatePhoneInput();
      expect(component.getPhoneError()).toBe('');
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error for future DOB via matDatepickerMax', () => {
      const futureDate = moment().add(1, 'day');
      component.searchForm.patchValue({ dob: futureDate });
      component.searchForm.get('dob')?.markAsTouched();
      expect(component.getDobError()).toContain('future date');
    });

    it('should show error for future Collection Date via matDatepickerMax', () => {
      const futureDate = moment().add(1, 'day');
      component.searchForm.patchValue({ collectionDate: futureDate });
      component.searchForm.get('collectionDate')?.markAsTouched();
      expect(component.getCollDateError()).toContain('future date');
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should populate dataSource on successful response', () => {
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].donorName).toBe('ROGERS ALLESIA');
      expect(component.totalRecords).toBe(2);
    });



    it('should handle 400 error as too many results', () => {
      queryService.searchDonors.and.returnValue(throwError(() => ({ status: 400 })));
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith(MDONQ_ERROR_MESSAGES.TOO_MANY_RESULTS);
    });

    it('should handle 404 error as no results', () => {
      queryService.searchDonors.and.returnValue(throwError(() => ({ status: 404 })));
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith(MDONQ_ERROR_MESSAGES.NO_RESULTS);
    });

    it('should handle 500 error as load error', () => {
      queryService.searchDonors.and.returnValue(throwError(() => ({ status: 500 })));
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith(MDONQ_ERROR_MESSAGES.LOAD_ERROR);
    });



    it('should reset pagination to first page on retrieve', () => {
      component.pageIndex = 3;
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
      expect(component.pageIndex).toBe(0);
    });




  });



  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
    });

    it('should default to DESC', () => {
      expect(component.currentSortDirection).toBe('DESC');
    });





  });

  describe('Expandable Rows', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should track multiple expanded rows', () => {
      component.toggleRow('0000017648');
      component.toggleRow('0000017649');
      expect(component.isRowExpanded('0000017648')).toBeTrue();
      expect(component.isRowExpanded('0000017649')).toBeTrue();
    });

    it('should clear expanded rows on page change', () => {
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
      component.toggleRow('0000017648');
      expect(component.isRowExpanded('0000017648')).toBeTrue();

      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 100 });
      expect(component.isRowExpanded('0000017648')).toBeFalse();
    });
  });

  describe('Row Actions', () => {
    const mockRow: DonorSearchResult = {
      donorId: '0000017648',
      donorName: 'ROGERS ALLESIA',
      dateOfBirth: '1994-01-11',
      dobDay: 'TUE',
      gender: 'Female',
      bloodType: 'O+',
      totalDonations: 0,
      totalCredits: 0,
      totalGallons: 0,
      lastDonationDate: null,
      lastUnitId: null,
      dayPhoneNo: null,
      homePhoneNo: null,
      mobilePhone: null,
      donorAddress: null
    };

    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have all 6 menu actions defined', () => {
      expect(component.rowMenuActions.length).toBe(6);
      expect(component.rowMenuActions.map(a => a.action)).toEqual([
        'alternateAddress', 'communicationLog', 'attributes',
        'interdictions', 'donations', 'demographics'
      ]);
    });
  });

  describe('Chapter Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
    });

    it('should reset component on chapter change', () => {
      expect(component.dataSource.length).toBe(2);
      chapterChanged$.next();
      expect(component.dataSource.length).toBe(0);
      expect(component.hasSearched()).toBeFalse();
      expect(component.searchForm.get('lastName')?.value).toBe('');
      expect(component.currentSortDirection).toBe('DESC');
    });

    it('should update maxDate on chapter change', () => {
      const newChapterDate = moment('2025-06-15');
      const tzService = TestBed.inject(ChapterTimezoneService) as any;
      (tzService.chapterLocalDate as WritableSignal<moment.Moment | null>).set(newChapterDate);
      fixture.detectChanges();
      expect(component.maxDate).toBeDefined();
      expect(component.maxDate.format('YYYY-MM-DD')).toBe('2025-06-15');
    });

    it('should reset side panel state on chapter change', () => {
      component.sidePanelOpen.set(true);
      component.sidePanelRow.set(mockDonorData[0]);
      component.currentSection.set('interdictions');

      chapterChanged$.next();

      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.sidePanelRow()).toBeNull();
      expect(component.currentSection()).toBeNull();
    });
  });

  describe('Clear All / Reset', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
    });

    it('should reset all form fields on clear all', () => {
      component.onClearAll();
      expect(component.searchForm.get('lastName')?.value).toBe('');
      expect(component.searchForm.get('lastNameOption')?.value).toBe('Like');
      expect(component.searchForm.get('dob')?.value).toBeNull();
      expect(component.searchForm.get('sex')?.value).toBe('Either');
      expect(component.searchForm.get('firstName')?.value).toBe('');
      expect(component.searchForm.get('phoneNumber')?.value).toBe('');
      expect(component.searchForm.get('donorId')?.value).toBe('');
      expect(component.searchForm.get('previousDonorId')?.value).toBe('');
      expect(component.searchForm.get('collectionDate')?.value).toBeNull();
    });

    it('should clear dataSource and pagination on clear all', () => {
      component.onClearAll();
      expect(component.dataSource).toEqual([]);
      expect(component.totalRecords).toBe(0);
      expect(component.pageIndex).toBe(0);
    });

    it('should reset signals on clear all', () => {
      component.onClearAll();
      expect(component.hasSearched()).toBeFalse();
      expect(component.isLoading()).toBeFalse();
      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.sidePanelRow()).toBeNull();
      expect(component.currentSection()).toBeNull();
      expect(component.selectedRowId()).toBeNull();
    });

    it('should reset sort direction to DESC on clear all', () => {
      component.currentSortDirection = 'ASC';
      component.onClearAll();
      expect(component.currentSortDirection).toBe('DESC');
    });

    it('should clear expanded rows on clear all', () => {
      component.toggleRow('0000017648');
      component.onClearAll();
      expect(component.expandedRows.size).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should display values correctly', () => {
      expect(component.displayValue('test')).toBe('test');
      expect(component.displayValue(0)).toBe('0');
      expect(component.displayValue(null)).toBe('--');
      expect(component.displayValue(undefined)).toBe('--');
      expect(component.displayValue('')).toBe('--');
    });

    it('should format valid date', () => {
      expect(component.formatDate('2024-01-15')).toBe('15-JAN-2024');
    });

    it('should return -- for empty date', () => {
      expect(component.formatDate('')).toBe('--');
    });

    it('should return original value for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('Sort Toggle', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
    });

    it('should toggle sort direction from DESC to ASC', () => {
      component.onSortChange();
      expect(component.currentSortDirection).toBe('ASC');
    });

    it('should toggle sort direction back from ASC to DESC', () => {
      component.onSortChange();
      component.onSortChange();
      expect(component.currentSortDirection).toBe('DESC');
    });

    it('should return arrow_upward for ASC', () => {
      component.currentSortDirection = 'ASC';
      expect(component.getSortIcon()).toBe('arrow_upward');
    });

    it('should return arrow_downward for DESC', () => {
      component.currentSortDirection = 'DESC';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });
  });

  describe('Toggle All Rows', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
    });

    it('should expand all rows', () => {
      component.toggleAllRows();
      expect(component.isAllExpanded()).toBeTrue();
    });

    it('should collapse all rows when already expanded', () => {
      component.toggleAllRows();
      component.toggleAllRows();
      expect(component.isAllExpanded()).toBeFalse();
    });

    it('should return false for isAllExpanded when dataSource is empty', () => {
      component.dataSource = [];
      expect(component.isAllExpanded()).toBeFalse();
    });
  });

  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set selectedRowId and open side panel for interdictions action', () => {
      component.onRowAction('interdictions', mockDonorData[0]);
      expect(component.selectedRowId()).toBe('0000017648');
      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('interdictions');
    });

    it('should open side panel for demographics action', () => {
      component.onRowAction('demographics', mockDonorData[0]);
      expect(component.currentSection()).toBe('demographics');
      expect(component.sidePanelOpen()).toBeTrue();
    });

    it('should open side panel for attributes action', () => {
      component.onRowAction('attributes', mockDonorData[0]);
      expect(component.currentSection()).toBe('attributes');
    });

    it('should open side panel for communicationLog action', () => {
      component.onRowAction('communicationLog', mockDonorData[0]);
      expect(component.currentSection()).toBe('communications');
    });
  });

  describe('Panel Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close side panel and reset state', () => {
      component.sidePanelOpen.set(true);
      component.sidePanelRow.set(mockDonorData[0]);
      component.currentSection.set('demographics');

      component.onPanelClose();

      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.sidePanelRow()).toBeNull();
      expect(component.currentSection()).toBeNull();
    });

    it('should update side panel width', () => {
      component.onPanelWidthChange('50vw');
      expect(component.sidePanelWidth()).toBe('50vw');
    });
  });

  describe('Phone Input', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should strip non-numeric characters on phone input', () => {
      const mockInput = { value: '123-abc-456', target: null as any };
      mockInput.target = mockInput as any;
      const event = { target: { value: '123abc456' } } as unknown as Event;
      component.onPhoneInput(event);
      expect(component.searchForm.get('phoneNumber')?.value).toMatch(/^\d*$/);
    });

    it('should return phoneMax error when phone exceeds max length', () => {
      component.searchForm.patchValue({ phoneNumber: '123456789012345678' });
      component.validatePhoneInput();
      expect(component.getPhoneError()).toBeTruthy();
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset component when onClearAll is called', () => {
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.dataSource = mockDonorData;
      component.totalRecords = 2;
      component.hasSearched.set(true);

      component.onClearAll();

      expect(component.dataSource.length).toBe(0);
      expect(component.hasSearched()).toBeFalse();
      expect(component.searchForm.get('lastName')?.value).toBe('');
    });
  });

  describe('Search Error with displayMessage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show displayMessage from error response', () => {
      queryServiceSpy.searchDonors.and.returnValue(throwError(() => ({ displayMessage: 'Custom error message' })));
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Custom error message');
    });

    it('should show NO_RESULTS when response has empty data', () => {
      queryServiceSpy.searchDonors.and.returnValue(of({ data: [], totalRecords: 0, message: '' }));
      component.searchForm.patchValue({ lastName: 'ROGERS' });
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(MDONQ_ERROR_MESSAGES.NO_RESULTS);
    });

    it('should not call search when phone has error', () => {
      queryServiceSpy.searchDonors.calls.reset();
      component.searchForm.patchValue({ phoneNumber: '12345' });
      component.validatePhoneInput();
      component.onRetrieve();
      expect(queryServiceSpy.searchDonors).not.toHaveBeenCalled();
    });
  });

  describe('Validate Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not show error when no criteria entered', () => {
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
    });
  });

  describe('isRetrieveDisabled edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable when isLoading is true', () => {
      component.isLoading.set(true);
      component.searchForm.patchValue({ lastName: 'TEST' });
      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });
});
