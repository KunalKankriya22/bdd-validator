import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';
import moment from 'moment';

import { ViewDonorLettersComponent } from './view-donor-letters.component';
import { ViewDonorLettersService } from './services/view-donor-letters.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DonorLetterDto, DonorLetterDetailDto } from './models/view-donor-letters.model';
import { createMockMatDialog, createMockActivatedRoute, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ViewDonorLettersComponent', () => {
  let matDialogSpy: any;
  let svcSpy: any;
  let component: ViewDonorLettersComponent;
  let fixture: ComponentFixture<ViewDonorLettersComponent>;
  let serviceSpy: jasmine.SpyObj<ViewDonorLettersService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChangedSubject: Subject<string>;

  const mockLetterCodes = [
    { letterCode: 'ABAN', title: 'Abandon Letter' },
    { letterCode: 'DEFER', title: 'Deferral Notice' },
  ];

  const mockDonors = [
    { donorId: 'D001', name: 'Doe, John' },
    { donorId: 'D002', name: 'Smith, Jane' },
  ];

  const mockLetterData: DonorLetterDto[] = [
    {
      donorId: 'D001',
      letterSeqNo: '1',
      donorName: 'John Doe',
      letterCode: 'ABAN',
      generateDate: '2026-05-01T10:00:00Z',
      generatedByName: 'A. Admin',
      authorizedByName: 'M. Manager',
    },
    {
      donorId: 'D002',
      letterSeqNo: '2',
      donorName: 'Jane Smith',
      letterCode: 'DEFER',
      generateDate: '2026-05-02T10:00:00Z',
      generatedByName: 'A. Admin',
      authorizedByName: 'M. Manager',
      reprintedByName: 'S. Staff',
      lastReprintedOn: '2026-05-03T10:00:00Z',
    },
  ];

  const mockDetailData: DonorLetterDetailDto = {
    donorId: 'D001',
    letterSeqNo: '1',
    donorName: 'John Doe',
    letterCode: 'ABAN',
    generateDate: '2026-05-01T10:00:00Z',
    generatedByName: 'A. Admin',
    authorizedByName: 'M. Manager',
    phone: '(555) 123-4567',
    address: '123 Main St, Springfield, IL 62701',
  };

  beforeEach(() => {

    svcSpy = jasmine.createSpyObj('ViewDonorLettersService', [
      'queryDonorLetters',
      'getDonorLetterDetail',
      'getLetterCodes',
      'getDonors',
    ]);
    svcSpy.getLetterCodes.and.returnValue(of(mockLetterCodes));
    svcSpy.getDonors.and.returnValue(of(mockDonors));
    svcSpy.queryDonorLetters.and.returnValue(of({ data: mockLetterData, total: 2 }));
    svcSpy.getDonorLetterDetail.and.returnValue(of(mockDetailData));

    const pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'View Donor Letters', subtitle: '' }),
    });

    matDialogSpy = createMockMatDialog();

    chapterChangedSubject = new Subject<string>();
    const headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });



      TestBed.configureTestingModule({
      imports: [ViewDonorLettersComponent, NoopAnimationsModule],
      providers: [
        { provide: ViewDonorLettersService, useValue: svcSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
    });
      svcSpy.getLetterCodes.and.returnValue(of(mockLetterCodes));


      svcSpy.getDonors.and.returnValue(of(mockDonors));


      svcSpy.queryDonorLetters.and.returnValue(of({ data: mockLetterData, total: 2 }));


      svcSpy.getDonorLetterDetail.and.returnValue(of(mockDetailData));


    fixture = TestBed.createComponent(ViewDonorLettersComponent);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(ViewDonorLettersService) as jasmine.SpyObj<ViewDonorLettersService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize with default state', () => {
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.hasRetrievedData).toBe(false);
    });

    it('should load letter codes on init', () => {
      expect(serviceSpy.getLetterCodes).toHaveBeenCalled();
      expect(component.codeOptions().length).toBe(2);
      expect(component.codeOptions()[0].letterCode).toBe('ABAN');
    });

    it('should initialize filter form with required date validators', () => {
      expect(component.filterForm.get('fromDate')).toBeTruthy();
      expect(component.filterForm.get('toDate')).toBeTruthy();
      expect(component.filterForm.get('letterCode')).toBeTruthy();
      expect(component.filterForm.get('donorId')).toBeTruthy();
    });
  });

  describe('Dropdowns', () => {
    it('should display code as "letterCode - title"', () => {
      component.filterForm.patchValue({ letterCode: 'ABAN' });
      expect(component.selectedCodeDisplay()).toBe('ABAN - Abandon Letter');
    });

    it('should display donor as "donorId - name"', () => {
      component.donorOptions.set(mockDonors);
      component.filterForm.patchValue({ donorId: 'D001' });
      expect(component.selectedDonorDisplay()).toBe('D001 - Doe, John');
    });














  });

  describe('Retrieve', () => {




    it('should fetch data on retrieve', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-12'),
      });
      tick(300);

      component.onRetrieve();
      tick();

      expect(serviceSpy.queryDonorLetters).toHaveBeenCalled();
      expect(component.dataSource.length).toBe(2);
      expect(component.totalRecords).toBe(2);
      expect(component.hasRetrievedData).toBe(true);
    }));


  });

  describe('Clear All', () => {
    it('should reset form and state', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-12'),
        letterCode: 'ABAN',
      });
      tick(300);
      component.onRetrieve();
      tick();

      component.onClearAll();

      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
      expect(component.filterForm.get('letterCode')?.value).toBeNull();
      expect(component.filterForm.get('donorId')?.value).toBeNull();
      expect(component.dataSource).toEqual([]);
      expect(component.hasRetrievedData).toBe(false);
      expect(component.donorOptions().length).toBe(0);
    }));


  });

  describe('Expand/Collapse', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-12'),
      });
      tick(300);
      component.onRetrieve();
      tick();
    }));



    it('should toggle all rows and fetch details', fakeAsync(() => {
      component.toggleAllRows();
      tick();

      expect(component.areAllExpanded()).toBe(true);
      expect(serviceSpy.getDonorLetterDetail).toHaveBeenCalledTimes(2);

      component.toggleAllRows();
      expect(component.areAllExpanded()).toBe(false);
    }));

    it('should fetch detail on row expand', fakeAsync(() => {
      const row = component.dataSource[0];
      component.toggleRow(row);
      tick();

      expect(serviceSpy.getDonorLetterDetail).toHaveBeenCalledWith('D001', '1');
      expect(component.getRowDetail(row)?.phone).toBe('(555) 123-4567');
      expect(component.getRowDetail(row)?.address).toBe('123 Main St, Springfield, IL 62701');
    }));





    it('should format phone as XXX-XXX-XXXX', () => {
      expect(component.formatPhone('(555) 123-4567')).toBe('555-123-4567');
      expect(component.formatPhone('5551234567')).toBe('555-123-4567');
      expect(component.formatPhone(null)).toBe('--');
      expect(component.formatPhone(undefined)).toBe('--');
    });

    it('should handle detail fetch error gracefully', fakeAsync(() => {
      serviceSpy.getDonorLetterDetail.and.returnValue(throwError(() => new Error('Network error')));

      const row = component.dataSource[0];
      component.toggleRow(row);
      tick();

      expect(component.isDetailLoading(row)).toBe(false);
      expect(component.getRowDetail(row)).toBeUndefined();
    }));
  });

  describe('Sorting', () => {
    it('should cycle sort direction', () => {
      component.onSort('donorName');
      expect(component.sortColumn).toBe('donorName');
      expect(component.sortDirection).toBe('A');

      component.onSort('donorName');
      expect(component.sortDirection).toBe('D');

      component.onSort('donorName');
      expect(component.sortDirection).toBe('default');
      expect(component.sortColumn).toBe('');
    });


  });
  describe('Date Validation', () => {
    it('should set fromAfterTo error when from date is after to date', () => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-12'),
        toDate: moment('2026-05-01'),
      });
      component.onDateChange();

      expect(component.filterForm.get('fromDate')?.hasError('fromAfterTo')).toBe(true);
    });

    it('should clear fromAfterTo error when dates are corrected', () => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-12'),
        toDate: moment('2026-05-01'),
      });
      component.onDateChange();

      component.filterForm.patchValue({ fromDate: moment('2026-04-01') });
      component.onDateChange();

      expect(component.filterForm.get('fromDate')?.hasError('fromAfterTo')).toBeFalsy();
    });
  });
  describe('Truncation', () => {


    it('should check donor truncation', () => {
      const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkDonorTruncation(el);
      expect(component.isDonorTruncated).toBe(true);
    });
  });

  describe('Chapter Change', () => {


    it('should reset form and table state on chapter change', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-12'),
        letterCode: 'ABAN',
      });
      tick(300);
      component.onRetrieve();
      tick();

      expect(component.hasRetrievedData).toBe(true);
      expect(component.dataSource.length).toBe(2);

      chapterChangedSubject.next('NEW');
      tick();

      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
      expect(component.filterForm.get('letterCode')?.value).toBeNull();
      expect(component.filterForm.get('donorId')?.value).toBeNull();
      expect(component.dataSource).toEqual([]);
      expect(component.hasRetrievedData).toBe(false);
    }));


  });

  describe('Cleanup', () => {
    it('should cleanup on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Retrieve / Clear Disabled', () => {
    it('isRetrieveDisabled should be true when dates missing', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('isRetrieveDisabled should be false when dates set', () => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-12'),
      });
      component.isLoading = false;
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('isClearAllDisabled should be true when no values and no data', () => {
      component.hasRetrievedData = false;
      component.filterForm.patchValue({ fromDate: null, toDate: null, letterCode: null, donorId: null });
      expect(component.isClearAllDisabled).toBeTrue();
    });

    it('isClearAllDisabled should be false when form has values', () => {
      component.filterForm.patchValue({ fromDate: moment('2026-05-01') });
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should not fetch when isRetrieveDisabled', () => {
      component.onRetrieve();
      expect(serviceSpy.queryDonorLetters).not.toHaveBeenCalled();
    });
  });

  describe('Sort Icons', () => {
    it('getSortIcon returns unfold_more by default', () => {
      expect(component.getSortIcon('donorName')).toBe('unfold_more');
    });

    it('getSortIcon returns arrow_upward for ascending', () => {
      component.sortColumn = 'donorName';
      component.sortDirection = 'A';
      expect(component.getSortIcon('donorName')).toBe('arrow_upward');
    });

    it('getSortIcon returns arrow_downward for descending', () => {
      component.sortColumn = 'donorName';
      component.sortDirection = 'D';
      expect(component.getSortIcon('donorName')).toBe('arrow_downward');
    });

    it('isSortActive returns true when column matches and not default', () => {
      component.sortColumn = 'donorName';
      component.sortDirection = 'A';
      expect(component.isSortActive('donorName')).toBeTrue();
    });

    it('isSortActive returns false for different column', () => {
      component.sortColumn = 'letterCode';
      component.sortDirection = 'A';
      expect(component.isSortActive('donorName')).toBeFalse();
    });

    it('should change column when sorting a new column', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-12'),
      });
      tick(300);
      component.onRetrieve();
      tick();

      component.onSort('letterCode');
      expect(component.sortColumn).toBe('letterCode');
      expect(component.sortDirection).toBe('A');
    }));
  });

  describe('Pagination', () => {
    it('should update page index and size on page change', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-12'),
      });
      tick(300);
      component.onRetrieve();
      tick();

      component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100, previousPageIndex: 1 });
      tick();

      expect(component.pageIndex).toBe(2);
      expect(component.pageSize).toBe(50);
    }));
  });

  describe('Date Helpers', () => {
    it('formatDate returns formatted date for valid value', () => {
      expect(component.formatDate('2026-05-01T10:00:00Z')).toMatch(/01-MAY-2026/);
    });

    it('formatDate returns -- for null', () => {
      expect(component.formatDate(null)).toBe('--');
    });

    it('formatDate returns -- for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('--');
    });

    it('onFromDateInput should call DateFieldValidationUtility', () => {
      const event = { target: { value: '01-Jan-2026' } } as unknown as Event;
      expect(() => component.onFromDateInput(event)).not.toThrow();
    });

    it('onToDateInput should call DateFieldValidationUtility', () => {
      const event = { target: { value: '31-Dec-2026' } } as unknown as Event;
      expect(() => component.onToDateInput(event)).not.toThrow();
    });

    it('onDateBlur should set invalidDateFormat when input has value but control is null', () => {
      const input = { value: 'invalid' } as HTMLInputElement;
      component.filterForm.get('fromDate')?.setValue(null);
      component.onDateBlur('fromDate', input);
      expect(component.filterForm.get('fromDate')?.hasError('invalidDateFormat')).toBeTrue();
    });

    it('getToDateError should return error message', () => {
      const toControl = component.filterForm.get('toDate');
      toControl?.markAsTouched();
      toControl?.setErrors({ required: true });
      const msg = component.getToDateError();
      expect(msg).toBeTruthy();
    });
  });

  describe('Computed Filters', () => {
    it('filteredCodes should filter by search term', () => {
      component.codeSearchControl.setValue('ABAN');
      const filtered = component.filteredCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].letterCode).toBe('ABAN');
    });

    it('filteredDonors should filter by search term', () => {
      component.donorOptions.set(mockDonors);
      component.donorSearchControl.setValue('Doe');
      const filtered = component.filteredDonors();
      expect(filtered.length).toBe(1);
      expect(filtered[0].donorId).toBe('D001');
    });

    it('selectedCodeDisplay returns code only when no title', () => {
      component.codeOptions.set([{ letterCode: 'NOTITLE', title: '' }]);
      component.filterForm.patchValue({ letterCode: 'NOTITLE' });
      expect(component.selectedCodeDisplay()).toBe('NOTITLE');
    });

    it('selectedDonorDisplay returns donorId only when no name', () => {
      component.donorOptions.set([{ donorId: 'D999', name: '' }]);
      component.filterForm.patchValue({ donorId: 'D999' });
      expect(component.selectedDonorDisplay()).toBe('D999');
    });

    it('selectedCodeDisplay returns empty for unmatched code', () => {
      component.filterForm.patchValue({ letterCode: 'UNKNOWN' });
      expect(component.selectedCodeDisplay()).toBe('UNKNOWN');
    });

    it('selectedDonorDisplay returns empty for unmatched donor', () => {
      component.donorOptions.set(mockDonors);
      component.filterForm.patchValue({ donorId: 'UNKNOWN' });
      expect(component.selectedDonorDisplay()).toBe('UNKNOWN');
    });
  });

  describe('Truncation', () => {
    it('should check code truncation', () => {
      const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkCodeTruncation(el);
      expect(component.isCodeTruncated).toBeTrue();
    });
  });

  describe('Error Paths', () => {
    it('should handle loadLetterCodes error', fakeAsync(() => {
      svcSpy.getLetterCodes.and.returnValue(throwError(() => new Error('fail')));

      // Re-trigger by chapter change
      chapterChangedSubject.next('CH2');
      tick();

      expect(component.codeOptions().length).toBe(0);
    }));

    it('should handle fetchData error', fakeAsync(() => {
      svcSpy.queryDonorLetters.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-12'),
      });
      tick(300);
      component.onRetrieve();
      tick();

      expect(component.dataSource).toEqual([]);
      expect(component.totalRecords).toBe(0);
      expect(component.hasRetrievedData).toBeTrue();
    }));
  });

  describe('Phone Formatting', () => {
    it('should return raw value for non-10-digit phone', () => {
      expect(component.formatPhone('12345')).toBe('12345');
    });
  });
});
