import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule, DateAdapter } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import moment from 'moment';
import { DonorsByEventsQuery } from './donors-by-events-query';
import { DonorsByEventsQueryService } from './services/donors-by-events-query.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { SearchType, ValueCodeOption, DonorSearchResultDto } from './models/donors-by-events-query.model';

describe('DonorsByEventsQuery - Code Description Feature', () => {
  let servicespy: any;
  let component: DonorsByEventsQuery;
  let fixture: ComponentFixture<DonorsByEventsQuery>;
  let service: jasmine.SpyObj<DonorsByEventsQueryService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  beforeEach(() => {

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'isChapterLocalDateAvailable', 'getChapterLocalDate'
    ]);
    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));

    servicespy = jasmine.createSpyObj('DonorsByEventsQueryService', [
      'getSearchTypes',
      'getValueCodes',
      'getDrivesLov',
      'searchDonors'
    ]);



      TestBed.configureTestingModule({
      imports: [
        DonorsByEventsQuery,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatNativeDateModule,
        MatSnackBarModule,
        MatTableModule,
        MatPaginatorModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: DonorsByEventsQueryService, useValue: servicespy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: DateAdapter, useValue: {} },
        provideRouter([])
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });


    


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.calls.reset();


      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();


      servicespy.getSearchTypes.calls.reset();


      servicespy.getValueCodes.calls.reset();


      servicespy.getDrivesLov.calls.reset();


      servicespy.searchDonors.calls.reset();


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);


      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));


    service = TestBed.inject(DonorsByEventsQueryService) as jasmine.SpyObj<DonorsByEventsQueryService>;
    service.getSearchTypes.and.returnValue(of([
      { code: SearchType.Complaint, description: 'Complaint' },
      { code: SearchType.Reaction, description: 'Reaction' }
    ]));
    service.getValueCodes.and.returnValue(of([]));
    service.getDrivesLov.and.returnValue(of([]));
    service.searchDonors.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: [],
      total: 0
    }));

    fixture = TestBed.createComponent(DonorsByEventsQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Code Description Lookup', () => {
    it('should initialize codeDescription signal as null', () => {
      expect(component.codeDescription()).toBeNull();
    });

    it('should display code description when valid code is entered', (done) => {
      const valueCodes: ValueCodeOption[] = [
        { code: 'C001', description: 'Minor Complaint' },
        { code: 'C002', description: 'Major Complaint' }
      ];

      component.searchForm.patchValue({
        searchType: SearchType.Complaint,
        code: 'C001'
      });
      component.valueCodes.set(valueCodes);

      component['updateCodeDescription']();
      expect(component.codeDescription()).toBe('Minor Complaint');
      done();
    });



    it('should clear description when code is cleared', () => {
      const valueCodes: ValueCodeOption[] = [
        { code: 'C001', description: 'Minor Complaint' }
      ];

      component.searchForm.patchValue({
        searchType: SearchType.Complaint,
        code: 'C001'
      });
      component.valueCodes.set(valueCodes);
      component['updateCodeDescription']();
      expect(component.codeDescription()).toBe('Minor Complaint');

      // Clear code
      component.searchForm.patchValue({ code: '' });
      component['updateCodeDescription']();
      expect(component.codeDescription()).toBeNull();
    });



    it('should not show description for DOBYR search type', () => {
      component.valueCodes.set([]);
      component.searchForm.patchValue({
        searchType: SearchType.DOBYR,
        code: '5'
      });
      component['updateCodeDescription']();
      expect(component.codeDescription()).toBeNull();
    });

    it('should not show description for Units search type', () => {
      component.valueCodes.set([]);
      component.searchForm.patchValue({
        searchType: SearchType.Units,
        code: '10'
      });
      component['updateCodeDescription']();
      expect(component.codeDescription()).toBeNull();
    });

    it('should not show description for Credits search type', () => {
      component.valueCodes.set([]);
      component.searchForm.patchValue({
        searchType: SearchType.Credits,
        code: '3'
      });
      component['updateCodeDescription']();
      expect(component.codeDescription()).toBeNull();
    });

    it('should show description for Request codes', () => {
      const valueCodes: ValueCodeOption[] = [
        { code: 'R001', description: 'Urgent Request' }
      ];

      component.searchForm.patchValue({
        searchType: SearchType.Request,
        code: 'R001'
      });
      component.valueCodes.set(valueCodes);
      component['updateCodeDescription']();
      expect(component.codeDescription()).toBe('Urgent Request');
    });

    it('should not show description for FirstTimeFixed search type', () => {
      component.valueCodes.set([]);
      component.searchForm.patchValue({
        searchType: SearchType.FirstTimeFixed,
        code: 'ANY'
      });
      component['updateCodeDescription']();
      expect(component.codeDescription()).toBeNull();
    });

    it('should show description for DonCorr codes', () => {
      const valueCodes: ValueCodeOption[] = [
        { code: 'D001', description: 'Donor Correspondence' }
      ];

      component.searchForm.patchValue({
        searchType: SearchType.DonCorr,
        code: 'D001'
      });
      component.valueCodes.set(valueCodes);
      component['updateCodeDescription']();
      expect(component.codeDescription()).toBe('Donor Correspondence');
    });

    it('should show description for Reaction codes', () => {
      const valueCodes: ValueCodeOption[] = [
        { code: 'RCT001', description: 'Adverse Reaction' }
      ];

      component.searchForm.patchValue({
        searchType: SearchType.Reaction,
        code: 'RCT001'
      });
      component.valueCodes.set(valueCodes);
      component['updateCodeDescription']();
      expect(component.codeDescription()).toBe('Adverse Reaction');
    });



    it('should work with debounced code changes', fakeAsync(() => {
      const valueCodes: ValueCodeOption[] = [
        { code: 'C001', description: 'Complaint' }
      ];

      component.searchForm.patchValue({
        searchType: SearchType.Complaint
      });
      component.valueCodes.set(valueCodes);

      // Simulate rapid code changes
      component.searchForm.get('code')?.setValue('C');
      tick(100);
      component.searchForm.get('code')?.setValue('C0');
      tick(100);
      component.searchForm.get('code')?.setValue('C001');
      tick(300);

      expect(component.codeDescription()).toBe('Complaint');
    }));
  });

  describe('Numeric Input Restriction', () => {










    it('should strip non-numeric characters on input', () => {
      component.searchForm.patchValue({ searchType: SearchType.Units });
      const mockInput = document.createElement('input');
      mockInput.value = '5A3B2';
      const event = { target: mockInput };

      component.searchForm.get('code')?.setValue('5A3B2');
      component.onNumericInput(event);

      expect(mockInput.value).toBe('532');
    });

    it('should not modify input if all characters are numeric', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '532';
      const event = { target: mockInput };

      component.searchForm.get('code')?.setValue('532');
      component.onNumericInput(event);

      expect(mockInput.value).toBe('532');
    });

    it('should handle empty numeric input', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '';
      const event = { target: mockInput };

      component.searchForm.get('code')?.setValue('');
      component.onNumericInput(event);

      expect(mockInput.value).toBe('');
    });







    it('should not validate pattern for non-numeric fields', () => {
      component.searchForm.patchValue({
        searchType: SearchType.Complaint
      });

      const codeControl = component.searchForm.get('code');
      codeControl?.setValue('ABC');
      expect(codeControl?.hasError('pattern')).toBe(false);
    });




  });

  describe('Length Validation', () => {
    it('should enforce max 3 digits for Units (numeric validation)', () => {
      component.searchForm.patchValue({
        searchType: SearchType.Units
      });

      const codeControl = component.searchForm.get('code');
      codeControl?.setValue('99');
      expect(codeControl?.hasError('maxlength')).toBe(false);

      codeControl?.setValue('999');
      expect(codeControl?.hasError('maxlength')).toBe(false);

      codeControl?.setValue('9999');
      expect(codeControl?.hasError('maxlength')).toBe(true);
    });



    it('should enforce max 3 digits for Credits', () => {
      component.searchForm.patchValue({
        searchType: SearchType.Credits
      });

      const codeControl = component.searchForm.get('code');
      codeControl?.setValue('50');
      expect(codeControl?.hasError('maxlength')).toBe(false);

      codeControl?.setValue('999');
      expect(codeControl?.hasError('maxlength')).toBe(false);

      codeControl?.setValue('99999');
      expect(codeControl?.hasError('maxlength')).toBe(true);
    });

    it('should enforce max 20 characters for Complaint codes', () => {
      component.searchForm.patchValue({
        searchType: SearchType.Complaint
      });

      const codeControl = component.searchForm.get('code');
      codeControl?.setValue('C001');
      expect(codeControl?.hasError('maxlength')).toBe(false);

      codeControl?.setValue('C001234567890123456789'); // 21 chars
      expect(codeControl?.hasError('maxlength')).toBe(true);

      codeControl?.setValue('C00123456789012345'); // 18 chars
      expect(codeControl?.hasError('maxlength')).toBe(false);
    });












  });

  describe('Communications Side Panel', () => {
    const mockRow: DonorSearchResultDto = {
      donorId: 'D001',
      donorName: 'SMITH, JOHN',
      ssn: null,
      dateOfBirth: new Date('1985-06-15'),
      dobDay: 'Saturday',
      gender: 'M',
      bloodType: 'O+',
      totalDonations: 5,
      totalCredits: 3,
      totalGallons: 2,
      lastDonationDate: new Date('2024-01-10'),
      lastUnitId: 'U123',
      homePhoneNo: '5551234567',
      dayPhoneNo: null,
      mobilePhone: null,
      donorAddress: '123 Main St'
    };

    it('should initialize showCommunicationsPanel as false', () => {
      expect(component.showCommunicationsPanel).toBeFalse();
    });



    it('should open the communications side panel on viewCommunicationLog action', () => {
      component.onRowAction('viewCommunicationLog', mockRow);

      expect(component.showCommunicationsPanel).toBeTrue();
      expect(component.selectedDonorForCommunications).toBe(mockRow);
    });



    it('should close the communications side panel and clear donor', () => {
      component.onRowAction('viewCommunicationLog', mockRow);
      expect(component.showCommunicationsPanel).toBeTrue();

      component.closeCommunicationsPanel();

      expect(component.showCommunicationsPanel).toBeFalse();
      expect(component.selectedDonorForCommunications).toBeNull();
    });
  });

  describe('Form Initialization', () => {
    it('should initialize search form with required controls', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('searchType')).toBeDefined();
      expect(component.searchForm.get('startDate')).toBeDefined();
      expect(component.searchForm.get('endDate')).toBeDefined();
      expect(component.searchForm.get('code')).toBeDefined();
      expect(component.searchForm.get('driveId')).toBeDefined();
    });

    it('should load search types on init', () => {
      expect(service.getSearchTypes).toHaveBeenCalled();
      expect(component.searchTypes().length).toBe(2);
    });
  });

  describe('onRetrieve', () => {
    const mockSearchResult = {
      success: true, statusCode: 200, message: 'ok',
      data: [{ donorId: 'D001', donorName: 'DOE, JOHN', ssn: null, dateOfBirth: new Date('1990-01-01'), dobDay: 'Mon', gender: 'M', bloodType: 'O+', totalDonations: 5, totalCredits: 3, totalGallons: 2, lastDonationDate: new Date('2025-01-01'), lastUnitId: 'U1', homePhoneNo: null, dayPhoneNo: null, mobilePhone: null, donorAddress: null }],
      total: 1
    };

    it('should not search when form is invalid', () => {
      service.searchDonors.calls.reset();
      component.onRetrieve();
      expect(service.searchDonors).not.toHaveBeenCalled();
    });

    it('should search when form is valid', () => {
      service.searchDonors.and.returnValue(of(mockSearchResult));
      component.searchForm.patchValue({
        searchType: SearchType.Complaint,
        startDate: moment().subtract(5, 'days'),
        endDate: moment(),
        code: 'C001'
      });
      component.onRetrieve();
      expect(service.searchDonors).toHaveBeenCalled();
      expect(component.dataSource.length).toBe(1);
      expect(component.totalCount()).toBe(1);
      expect(component.hasSearched()).toBeTrue();
    });

    it('should handle search error', () => {
      service.searchDonors.and.returnValue(throwError(() => ({ message: 'Search failed' })));
      component.searchForm.patchValue({
        searchType: SearchType.Complaint,
        startDate: moment().subtract(5, 'days'),
        endDate: moment(),
        code: 'C001'
      });
      component.onRetrieve();
      expect(component.dataSource).toEqual([]);
      expect(component.totalCount()).toBe(0);
    });

    it('should reset expanded rows and sort on retrieve', () => {
      component.expandedRows = { 'D001': true };
      component.donorIdSortDir = 'ASC';
      service.searchDonors.and.returnValue(of(mockSearchResult));
      component.searchForm.patchValue({
        searchType: SearchType.Complaint,
        startDate: moment().subtract(5, 'days'),
        endDate: moment(),
        code: 'C001'
      });
      component.onRetrieve();
      expect(component.expandedRows).toEqual({});
      expect(component.donorIdSortDir).toBeNull();
    });
  });

  describe('onPageChange', () => {
    it('should update page size and index and trigger search', () => {
      service.searchDonors.and.returnValue(of({ data: [], total: 0, success: true, statusCode: 200, message: '' }));
      component.searchForm.patchValue({
        searchType: SearchType.Complaint,
        startDate: moment().subtract(5, 'days'),
        endDate: moment(),
        code: 'C001'
      });
      service.searchDonors.calls.reset();

      component.onPageChange({ pageSize: 50, pageIndex: 2, length: 100 } as any);

      expect(component.pageSize).toBe(50);
      expect(component.pageIndex).toBe(2);
      expect(service.searchDonors).toHaveBeenCalled();
    });
  });

  describe('onDonorIdSort', () => {
    it('should toggle sort direction and trigger search', () => {
      service.searchDonors.and.returnValue(of({ data: [], total: 0, success: true, statusCode: 200, message: '' }));
      component.searchForm.patchValue({
        searchType: SearchType.Complaint,
        startDate: moment().subtract(5, 'days'),
        endDate: moment(),
        code: 'C001'
      });

      component.onDonorIdSort();
      expect(component.donorIdSortDir).toBe('ASC');
      expect(component.pageIndex).toBe(0);

      component.onDonorIdSort();
      expect(component.donorIdSortDir).toBe('DESC');
    });
  });

  describe('getDonorIdSortIcon', () => {
    it('should return unfold_more when no sort', () => {
      component.donorIdSortDir = null;
      expect(component.getDonorIdSortIcon()).toBe('unfold_more');
    });

    it('should return arrow_upward for ASC', () => {
      component.donorIdSortDir = 'ASC';
      expect(component.getDonorIdSortIcon()).toBe('arrow_upward');
    });

    it('should return arrow_downward for DESC', () => {
      component.donorIdSortDir = 'DESC';
      expect(component.getDonorIdSortIcon()).toBe('arrow_downward');
    });
  });

  describe('Row Actions', () => {
    const mockRow: DonorSearchResultDto = {
      donorId: 'D001', donorName: 'SMITH, JOHN', ssn: null,
      dateOfBirth: new Date('1985-06-15'), dobDay: 'Saturday', gender: 'M',
      bloodType: 'O+', totalDonations: 5, totalCredits: 3, totalGallons: 2,
      lastDonationDate: new Date('2024-01-10'), lastUnitId: 'U123',
      homePhoneNo: null, dayPhoneNo: null, mobilePhone: null, donorAddress: null
    };

    it('should open alternate address dialog', () => {
      const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(null) } as any);
      component.onRowAction('viewAlternateAddress', mockRow);
      expect(dialogSpy).toHaveBeenCalled();
    });

    it('should open donor eligibility panel', () => {
      component.onRowAction('donorEligibility', mockRow);
      expect(component.showEligibilityPanel).toBeTrue();
      expect(component.selectedDonorForEligibility?.donorId).toBe('D001');
    });

    it('should open interdictions panel', () => {
      component.onRowAction('viewInterdictions', mockRow);
      expect(component.showInterdictionsPanel).toBeTrue();
      expect(component.selectedDonorIdForInterdictions).toBe('D001');
    });

    it('should open attributes panel', () => {
      component.onRowAction('viewAttributes', mockRow);
      expect(component.showAttributesPanel).toBeTrue();
      expect(component.selectedDonorIdForAttributes).toBe('D001');
    });

    it('should open demographics panel', () => {
      component.onRowAction('demographics', mockRow);
      expect(component.showDemographicsPanel).toBeTrue();
      expect(component.selectedDonorIdForDemographics).toBe('D001');
    });

    it('should open donation details dialog for donorHistory', () => {
      const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(null) } as any);
      component.onRowAction('donorHistory', mockRow);
      expect(dialogSpy).toHaveBeenCalled();
    });
  });

  describe('Close panel methods', () => {
    it('should close eligibility panel', () => {
      component.showEligibilityPanel = true;
      component.closeEligibilityPanel();
      expect(component.showEligibilityPanel).toBeFalse();
      expect(component.selectedDonorForEligibility).toBeNull();
    });

    it('should close eligibility on result selected', () => {
      component.showEligibilityPanel = true;
      component.onEligibilitySelected({} as any);
      expect(component.showEligibilityPanel).toBeFalse();
    });

    it('should close interdictions panel', () => {
      component.showInterdictionsPanel = true;
      component.closeInterdictionsPanel();
      expect(component.showInterdictionsPanel).toBeFalse();
      expect(component.selectedDonorIdForInterdictions).toBeNull();
    });

    it('should close attributes panel', () => {
      component.showAttributesPanel = true;
      component.closeAttributesPanel();
      expect(component.showAttributesPanel).toBeFalse();
      expect(component.selectedDonorIdForAttributes).toBeNull();
    });

    it('should close demographics panel', () => {
      component.showDemographicsPanel = true;
      component.closeDemographicsPanel();
      expect(component.showDemographicsPanel).toBeFalse();
      expect(component.selectedDonorIdForDemographics).toBeNull();
    });
  });

  describe('Expand/Collapse', () => {
    const mockRows: DonorSearchResultDto[] = [
      { donorId: 'D001', donorName: 'DOE', ssn: null, dateOfBirth: null, dobDay: '', gender: '', bloodType: '', totalDonations: 0, totalCredits: 0, totalGallons: 0, lastDonationDate: null, lastUnitId: '', homePhoneNo: null, dayPhoneNo: null, mobilePhone: null, donorAddress: null },
      { donorId: 'D002', donorName: 'SMITH', ssn: null, dateOfBirth: null, dobDay: '', gender: '', bloodType: '', totalDonations: 0, totalCredits: 0, totalGallons: 0, lastDonationDate: null, lastUnitId: '', homePhoneNo: null, dayPhoneNo: null, mobilePhone: null, donorAddress: null }
    ];

    it('should toggle row expansion', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any;
      component.toggleExpand(mockRows[0], event);
      expect(component.isExpanded(mockRows[0])).toBeTrue();
      expect(event.stopPropagation).toHaveBeenCalled();

      component.toggleExpand(mockRows[0], event);
      expect(component.isExpanded(mockRows[0])).toBeFalse();
    });

    it('should expand all rows', () => {
      component.dataSource = mockRows;
      component.toggleExpandAll();
      expect(component.isAllExpanded).toBeTrue();
    });

    it('should collapse all rows when all expanded', () => {
      component.dataSource = mockRows;
      component.toggleExpandAll();
      expect(component.isAllExpanded).toBeTrue();

      component.toggleExpandAll();
      expect(component.isAllExpanded).toBeFalse();
    });

    it('should return false for isAllExpanded when no data', () => {
      component.dataSource = [];
      expect(component.isAllExpanded).toBeFalse();
    });
  });

  describe('formatDate', () => {
    it('should format valid date', () => {
      const result = component.formatDate('2025-01-10');
      expect(result).toBe('10-JAN-2025');
    });

    it('should return empty for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty for invalid date', () => {
      expect(component.formatDate('invalid')).toBe('');
    });
  });

  describe('Date Validation', () => {
    it('getFromDateError should return empty when untouched', () => {
      expect(component.getFromDateError()).toBe('');
    });

    it('getFromDateError should return required error', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.markAsTouched();
      ctrl?.setValue(null);
      ctrl?.updateValueAndValidity();
      expect(component.getFromDateError()).toBe('From Date is required');
    });

    it('getFromDateError should return invalid for matDatepickerParse', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ matDatepickerParse: true });
      expect(component.getFromDateError()).toBe('From Date is invalid');
    });

    it('getFromDateError should return invalid for invalidDateFormat', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ invalidDateFormat: true });
      expect(component.getFromDateError()).toBe('From Date is invalid');
    });

    it('getFromDateError should return future date error', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ futureDate: true });
      expect(component.getFromDateError()).toBe('From Date cannot be a future date');
    });

    it('getFromDateError should return date range error', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ dateRangeInvalid: true });
      expect(component.getFromDateError()).toBe('From Date must be before or equal to To Date');
    });

    it('getToDateError should return empty when untouched', () => {
      expect(component.getToDateError()).toBe('');
    });

    it('getToDateError should return required error', () => {
      const ctrl = component.searchForm.get('endDate');
      ctrl?.markAsTouched();
      ctrl?.setValue(null);
      ctrl?.updateValueAndValidity();
      expect(component.getToDateError()).toBe('To Date is required');
    });

    it('getToDateError should return invalid for matDatepickerParse', () => {
      const ctrl = component.searchForm.get('endDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ matDatepickerParse: true });
      expect(component.getToDateError()).toBe('To Date is invalid');
    });

    it('getToDateError should return future date error', () => {
      const ctrl = component.searchForm.get('endDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ futureDate: true });
      expect(component.getToDateError()).toBe('To Date cannot be a future date');
    });

    it('getToDateError should return date range error', () => {
      const ctrl = component.searchForm.get('endDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ dateRangeInvalid: true });
      expect(component.getToDateError()).toBe('To Date must be on or after From Date');
    });
  });

  describe('onDateInput', () => {
    it('should set invalidDateFormat when input has value but control is null', () => {
      const input = document.createElement('input');
      input.value = 'bad-date';
      component.onDateInput('startDate', input);
      expect(component.searchForm.get('startDate')?.hasError('invalidDateFormat')).toBeTrue();
    });

    it('should not set error when input is empty', () => {
      const input = document.createElement('input');
      input.value = '';
      component.onDateInput('startDate', input);
    });
  });

  describe('onDateBlur', () => {
    it('should set invalidDateFormat when input value exists but control value is null', () => {
      const input = document.createElement('input');
      input.value = 'bad-date';
      component.onDateBlur('endDate', input);
      expect(component.searchForm.get('endDate')?.hasError('invalidDateFormat')).toBeTrue();
    });

    it('should not set error when input is empty', () => {
      const input = document.createElement('input');
      input.value = '';
      component.onDateBlur('endDate', input);
    });
  });

  describe('isRetrieveDisabled', () => {
    it('should be disabled when searching', () => {
      component.isSearching.set(true);
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be disabled when form invalid', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be enabled when search type and dates are set', () => {
      component.searchForm.patchValue({
        searchType: SearchType.Complaint,
        startDate: moment().subtract(5, 'days'),
        endDate: moment()
      });
      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  describe('Getter properties', () => {
    it('hasValueCodeDropdown should reflect valueCodes', () => {
      component.valueCodes.set([]);
      expect(component.hasValueCodeDropdown).toBeFalse();
      component.valueCodes.set([{ code: 'C1', description: 'Test' }]);
      expect(component.hasValueCodeDropdown).toBeTrue();
    });

    it('hasDrivesDropdown should be true for FirstTimeFixed', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.FirstTimeFixed);
      expect(component.hasDrivesDropdown).toBeTrue();
    });

    it('hasDrivesDropdown should be false for other types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      expect(component.hasDrivesDropdown).toBeFalse();
    });

    it('showValueField should be false for DOBYR', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.DOBYR);
      expect(component.showValueField).toBeFalse();
    });

    it('showValueField should be false for FirstTimeFixed', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.FirstTimeFixed);
      expect(component.showValueField).toBeFalse();
    });

    it('showValueField should be true for Action', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Action);
      expect(component.showValueField).toBeTrue();
    });

    it('valueFieldLabel should return correct label for each type', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Action);
      expect(component.valueFieldLabel).toBe('Action Code');

      component.searchForm.get('searchType')?.setValue(SearchType.Units);
      expect(component.valueFieldLabel).toBe('No. of Donations');

      component.searchForm.get('searchType')?.setValue(SearchType.Credits);
      expect(component.valueFieldLabel).toBe('Donation Credits');

      component.searchForm.get('searchType')?.setValue(SearchType.Reaction);
      expect(component.valueFieldLabel).toBe('Reaction Code');

      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      expect(component.valueFieldLabel).toBe('Complaint Code');

      component.searchForm.get('searchType')?.setValue(SearchType.DonCorr);
      expect(component.valueFieldLabel).toBe('Correspondence Code');

      component.searchForm.get('searchType')?.setValue(SearchType.Request);
      expect(component.valueFieldLabel).toBe('Request Code');
    });

    it('valuePlaceholder should return correct placeholder', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Units);
      expect(component.valuePlaceholder).toBe('e.g. 10');

      component.searchForm.get('searchType')?.setValue(SearchType.Credits);
      expect(component.valuePlaceholder).toBe('e.g. 3');

      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      expect(component.valuePlaceholder).toBe('');
    });

    it('valueFieldHint should return correct hint', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Units);
      expect(component.valueFieldHint).toBe('Enter numeric donation count');

      component.searchForm.get('searchType')?.setValue(SearchType.Credits);
      expect(component.valueFieldHint).toBe('Enter numeric credit count');

      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      expect(component.valueFieldHint).toBe('Select complaint code or leave blank for all');
    });

    it('maxDate should return a moment', () => {
      expect(moment.isMoment(component.maxDate)).toBeTrue();
    });

    it('minToDate should return null when no startDate', () => {
      expect(component.minToDate).toBeNull();
    });

    it('minToDate should return startDate value', () => {
      const start = moment().subtract(5, 'days');
      component.searchForm.get('startDate')?.setValue(start);
      expect(component.minToDate).toBeTruthy();
    });
  });

  describe('getInputMaxLength', () => {
    it('should return 3 for numeric types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Units);
      expect(component.getInputMaxLength()).toBe(3);
    });

    it('should return 20 for code types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      expect(component.getInputMaxLength()).toBe(20);
    });
  });

  describe('getMaxLengthErrorMessage', () => {
    it('should return 3 digits message for Units', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Units);
      expect(component.getMaxLengthErrorMessage()).toBe('Maximum 3 digits allowed');
    });

    it('should return 3 digits message for Credits', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Credits);
      expect(component.getMaxLengthErrorMessage()).toBe('Maximum 3 digits allowed');
    });

    it('should return 20 chars message for other types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      expect(component.getMaxLengthErrorMessage()).toBe('Maximum 20 characters allowed');
    });
  });

  describe('onNumericKeyPress', () => {
    it('should allow digits for numeric types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Units);
      const event = { key: '5', preventDefault: jasmine.createSpy() } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit for numeric types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Units);
      const event = { key: 'a', ctrlKey: false, metaKey: false, preventDefault: jasmine.createSpy() } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow Backspace for numeric types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Units);
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy() } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ctrl keys for numeric types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Units);
      const event = { key: 'a', ctrlKey: true, metaKey: false, preventDefault: jasmine.createSpy() } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not restrict for non-numeric types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      const event = { key: 'a', preventDefault: jasmine.createSpy() } as any;
      component.onNumericKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onNumericInput for non-numeric types', () => {
    it('should not strip characters for non-numeric types', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      const input = document.createElement('input');
      input.value = 'ABC123';
      component.onNumericInput({ target: input });
      expect(input.value).toBe('ABC123');
    });
  });

  describe('Search type change listener', () => {
    it('should load value codes for dropdown types', fakeAsync(() => {
      service.getValueCodes.and.returnValue(of([{ code: 'C1', description: 'Comp1' }]));
      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      tick(400);
      expect(service.getValueCodes).toHaveBeenCalledWith(SearchType.Complaint);
      expect(component.valueCodes().length).toBe(1);
    }));

    it('should clear value codes for non-dropdown types', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue(SearchType.DOBYR);
      tick(400);
      expect(component.valueCodes()).toEqual([]);
    }));

    it('should load drives LOV for FirstTimeFixed', fakeAsync(() => {
      service.getDrivesLov.and.returnValue(of([{ driveId: 'DR1', description: 'Drive 1' }]));
      component.searchForm.get('searchType')?.setValue(SearchType.FirstTimeFixed);
      tick(400);
      expect(service.getDrivesLov).toHaveBeenCalled();
    }));

    it('should clear drives for non-FirstTimeFixed types', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue(SearchType.Complaint);
      tick(400);
      expect(component.drivesLov()).toEqual([]);
    }));
  });

  describe('loadSearchTypes error', () => {
    it('should handle error when loading search types', () => {
      service.getSearchTypes.and.returnValue(throwError(() => ({ message: 'fail' })));

      // Re-create to trigger the error
      fixture = TestBed.createComponent(DonorsByEventsQuery);
      component = fixture.componentInstance;
      try { fixture.detectChanges(); } catch(e) { /* ignore */ }

      expect(component.isLoadingTypes()).toBeFalse();
    });
  });

  describe('loadValueCodes error', () => {
    it('should handle error when loading value codes', fakeAsync(() => {
      service.getValueCodes.and.returnValue(throwError(() => new Error('fail')));
      component.searchForm.get('searchType')?.setValue(SearchType.Action);
      tick(400);
      expect(component.valueCodes()).toEqual([]);
      expect(component.isLoadingValueCodes()).toBeFalse();
    }));
  });

  describe('loadDrivesLov error', () => {
    it('should handle error when loading drives', fakeAsync(() => {
      service.getDrivesLov.and.returnValue(throwError(() => new Error('fail')));
      component.searchForm.get('searchType')?.setValue(SearchType.FirstTimeFixed);
      tick(400);
      expect(component.drivesLov()).toEqual([]);
      expect(component.isLoadingDrives()).toBeFalse();
    }));
  });

  describe('filtered computed signals', () => {
    it('should filter search types by search text', () => {
      component['searchTypeSearch'].set('comp');
      const filtered = component.filteredSearchTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].description).toBe('Complaint');
    });

    it('should return all search types when search empty', () => {
      component['searchTypeSearch'].set('');
      expect(component.filteredSearchTypes().length).toBe(2);
    });

    it('should filter value codes by search text', () => {
      component.valueCodes.set([{ code: 'C1', description: 'Minor' }, { code: 'C2', description: 'Major' }]);
      component['valueCodeSearch'].set('minor');
      expect(component.filteredValueCodes().length).toBe(1);
    });

    it('should filter drives by search text', () => {
      component.drivesLov.set([{ driveId: 'DR1', description: 'Main Drive' }, { driveId: 'DR2', description: 'West' }]);
      component['driveSearch'].set('main');
      expect(component.filteredDrivesLov().length).toBe(1);
    });
  });

  describe('search control subscriptions', () => {
    it('should update searchTypeSearch from control', () => {
      component.searchTypeSearchControl.setValue('test');
      expect(component['searchTypeSearch']()).toBe('test');
    });

    it('should update valueCodeSearch from control', () => {
      component.valueCodeSearchControl.setValue('code');
      expect(component['valueCodeSearch']()).toBe('code');
    });

    it('should update driveSearch from control', () => {
      component.driveSearchControl.setValue('drive');
      expect(component['driveSearch']()).toBe('drive');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('dateRangeValidator', () => {
    it('should detect invalid date range', () => {
      component.searchForm.patchValue({
        startDate: moment().subtract(1, 'days'),
        endDate: moment().subtract(5, 'days')
      });
      expect(component.searchForm.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should accept valid date range', () => {
      component.searchForm.patchValue({
        startDate: moment().subtract(5, 'days'),
        endDate: moment().subtract(1, 'days')
      });
      expect(component.searchForm.hasError('dateRangeInvalid')).toBeFalse();
    });
  });

  describe('pastOrTodayValidator', () => {
    it('should reject future dates', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.setValue(moment().add(5, 'days'));
      expect(ctrl?.hasError('futureDate')).toBeTrue();
    });

    it('should accept past dates', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.setValue(moment().subtract(5, 'days'));
      expect(ctrl?.hasError('futureDate')).toBeFalse();
    });
  });

  describe('updateFieldValidation', () => {
    it('should clear validators for DOBYR', () => {
      component.searchForm.get('searchType')?.setValue(SearchType.DOBYR);
      const codeCtrl = component.searchForm.get('code');
      codeCtrl?.setValue('');
      expect(codeCtrl?.valid).toBeTrue();
    });
  });
});
