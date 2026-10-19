import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { GradedDonorsQueryComponent } from './graded-donors-query';
import { GradedDonorsQueryService } from './services/graded-donors-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockMatDialog, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  GradedDonationsQueryResponse,
  GradedDonorsQueryResponse,
  GradedDonationRecord,
  GradedDonorRecord,
  GRADED_DONORS_VALIDATION_MESSAGES
} from './models/graded-donors-query.model';

describe('GradedDonorsQueryComponent', () => {
  let component: GradedDonorsQueryComponent;
  let fixture: ComponentFixture<GradedDonorsQueryComponent>;
  let mockGradedDonorsQueryService: jasmine.SpyObj<GradedDonorsQueryService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterChangedSubject: Subject<any>;

  beforeEach(() => {

    chapterChangedSubject = new Subject();

    mockGradedDonorsQueryService = jasmine.createSpyObj('GradedDonorsQueryService', [
      'queryGradedDonations',
      'queryGradedDonationsRaw',
      'queryGradedDonors',
      'getUnitIdsLov',
      'getLastNamesLov'
    ]);

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({ title: 'Graded Donors Query', subtitle: 'Test subtitle' })
    });

    mockHeaderService = createMockHeaderService();

    mockDialog = createMockMatDialog();
    mockSnackBar = createMockMatSnackBar();

    mockGradedDonorsQueryService.getUnitIdsLov.and.returnValue(throwError(() => new Error('Not implemented')));
    mockGradedDonorsQueryService.getLastNamesLov.and.returnValue(throwError(() => new Error('Not implemented')));



      TestBed.configureTestingModule({
      imports: [
        GradedDonorsQueryComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatDatepickerModule,
        MatMomentDateModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: GradedDonorsQueryService, useValue: mockGradedDonorsQueryService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        },
        TranslateService
      ]
    });


    


      mockGradedDonorsQueryService.queryGradedDonations.calls.reset();


      mockGradedDonorsQueryService.queryGradedDonationsRaw.calls.reset();


      mockGradedDonorsQueryService.queryGradedDonors.calls.reset();


      mockGradedDonorsQueryService.getUnitIdsLov.calls.reset();


      mockGradedDonorsQueryService.getLastNamesLov.calls.reset();


      mockDialog.open.calls.reset();


      mockSnackBar.open.calls.reset();


      mockGradedDonorsQueryService.getUnitIdsLov.and.returnValue(throwError(() => new Error('Not implemented')));


      mockGradedDonorsQueryService.getLastNamesLov.and.returnValue(throwError(() => new Error('Not implemented')));


    TestBed.overrideComponent(GradedDonorsQueryComponent, {
      add: {
        providers: [
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    });

    fixture = TestBed.createComponent(GradedDonorsQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {


    it('should initialize query form with default values', () => {
      expect(component.queryForm).toBeDefined();
      expect(component.queryForm.get('unitId')?.value).toBe('');
      expect(component.queryForm.get('lastName')?.value).toBe('');
      expect(component.queryForm.get('fromDate')?.value).toBeNull();
      expect(component.queryForm.get('toDate')?.value).toBeNull();
    });

    it('should initialize with retrieve button disabled', () => {
      expect(component.isRetrieveDisabled()).toBe(true);
    });



    it('should initialize with empty data arrays', () => {
      expect(component.gradedDonations()).toEqual([]);
      expect(component.gradedDonors()).toEqual([]);
      expect(component.hasQueried()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should validate last name field for valid characters', () => {
      const lastNameControl = component.queryForm.get('lastName');

      lastNameControl?.setValue('Smith');
      expect(lastNameControl?.valid).toBeTruthy();

      lastNameControl?.setValue("O'Brien");
      expect(lastNameControl?.valid).toBeTruthy();

      lastNameControl?.setValue('Smith-Jones');
      expect(lastNameControl?.valid).toBeTruthy();
    });

    it('should invalidate last name with numbers', () => {
      const lastNameControl = component.queryForm.get('lastName');
      lastNameControl?.setValue('Smith123');
      expect(lastNameControl?.hasError('invalidLastName')).toBeTruthy();
    });

    it('should invalidate last name with special characters', () => {
      const lastNameControl = component.queryForm.get('lastName');
      lastNameControl?.setValue('Smith@Test');
      expect(lastNameControl?.hasError('invalidLastName')).toBeTruthy();
    });









    it('should invalidate unit ID with invalid length', () => {
      const unitIdControl = component.queryForm.get('unitId');
      unitIdControl?.setValue('123'); // Only 3 characters
      expect(unitIdControl?.hasError('invalidUnitId')).toBeTruthy();
    });

    it('should invalidate unit ID with 10 characters (not 7/8/13/15)', () => {
      const unitIdControl = component.queryForm.get('unitId');
      unitIdControl?.setValue('1234567890'); // 10 characters - invalid
      expect(unitIdControl?.hasError('invalidUnitId')).toBeTruthy();
    });

    it('should validate date range - from date before to date', () => {
      const fromDate = moment().subtract(7, 'days');
      const toDate = moment();

      component.queryForm.patchValue({
        fromDate: fromDate,
        toDate: toDate
      });

      expect(component.queryForm.hasError('dateRangeInvalid')).toBeFalsy();
    });

    it('should invalidate date range - from date after to date', () => {
      const fromDate = moment();
      const toDate = moment().subtract(7, 'days');

      component.queryForm.patchValue({
        fromDate: fromDate,
        toDate: toDate
      });

      expect(component.queryForm.hasError('dateRangeInvalid')).toBeTruthy();
    });

    it('should validate mutually exclusive fields - only unitId', () => {
      component.queryForm.patchValue({
        unitId: 'W1234567',
        lastName: '',
        fromDate: null,
        toDate: null
      });

      expect(component.queryForm.hasError('mutuallyExclusive')).toBeFalsy();
    });

    it('should invalidate when multiple criteria are filled', fakeAsync(() => {
      // Temporarily enable all fields to bypass UI mutual exclusivity logic
      component.queryForm.get('unitId')?.enable({ emitEvent: false });
      component.queryForm.get('lastName')?.enable({ emitEvent: false });
      component.queryForm.get('fromDate')?.enable({ emitEvent: false });
      component.queryForm.get('toDate')?.enable({ emitEvent: false });

      // Set both lastName and unitId (mutually exclusive)
      component.queryForm.patchValue({
        lastName: 'Smith',
        unitId: 'W1234567'
      }, { emitEvent: false });

      // Force form validation to run
      component.queryForm.updateValueAndValidity();
      fixture.detectChanges();
      tick();

      expect(component.queryForm.hasError('mutuallyExclusive')).toBe(true);
    }));
  });

  describe('Mutually Exclusive Fields', () => {






    it('should re-enable all fields when all values are cleared', fakeAsync(() => {
      component.queryForm.get('unitId')?.setValue('W1234567');
      tick();

      component.queryForm.get('unitId')?.setValue('');
      tick();

      expect(component.isUnitIdDisabled()).toBe(false);
      expect(component.isLastNameDisabled()).toBe(false);
      expect(component.isDateRangeDisabled()).toBe(false);
    }));
  });
  describe('Query Graded Donations', () => {
    beforeEach(() => {
      mockSnackBar.open.calls.reset();
      mockGradedDonorsQueryService.queryGradedDonations.calls.reset();
      mockGradedDonorsQueryService.queryGradedDonors.calls.reset();
    });

    it('should show error when retrieve is clicked without search criteria', () => {
      // Ensure form is completely empty
      component.queryForm.patchValue({
        unitId: '',
        lastName: '',
        fromDate: null,
        toDate: null
      });

      // Call onRetrieve with empty form
      component.onRetrieve();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        GRADED_DONORS_VALIDATION_MESSAGES.REQUIRED_FIELD,
        'Dismiss',
        jasmine.any(Object)
      );
    });

    it('should query graded donations successfully', fakeAsync(() => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [
          {
            transactionId: 'TXN001',
            unitId: 'W123456789012',
            unitIdWithCheckDigit: 'W123456789012',
            lastName: 'Smith',
            firstName: 'John',
            dateOfBirth: '1990-01-01',
            gender: 'M',
            ssn: null,
            activeFlag: 'Y',
            insertDate: '2025-01-01T10:00:00',
            insertUser: 'USER1',
            gradedDonors: [
              {
                donorId: 'DN001',
                grade: 1,
                dgmId: 100,
                lastName: 'Smith',
                firstName: 'John',
                dateOfBirth: '1990-01-01',
                gender: 'M',
                potentialDuplicateFlag: 'N'
              }
            ]
          }
        ],
        total: 1
      };

      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(of(mockResponse));

      component.queryForm.patchValue({ unitId: 'W123456789012' });
      fixture.detectChanges();
      tick();
      component.onRetrieve();
      tick();

      expect(mockGradedDonorsQueryService.queryGradedDonationsRaw).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W123456789012',
          unitDeferId: 'W123456789012',
          take: 500,
          skip: 0
        })
      );
      expect(component.gradedDonations().length).toBe(1);
      expect(component.gradedDonors().length).toBe(1);
      expect(component.hasQueried()).toBe(true);
      expect(component.isLoading()).toBe(false);
    }));



    it('should show error when more than 500 results (Error 16220)', fakeAsync(() => {
      const mockData = Array(501).fill(null).map((_, i) => ({
        transactionId: `TXN${i}`,
        unitId: `W${i}`,
        unitIdWithCheckDigit: `W${i}`,
        lastName: 'Smith',
        firstName: 'John',
        dateOfBirth: '1990-01-01',
        gender: 'M',
        ssn: null,
        activeFlag: 'Y',
        insertDate: '2025-01-01T10:00:00',
        insertUser: 'USER1',
        gradedDonors: []
      }));

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: mockData,
        total: 501
      };

      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(of(mockResponse));

      component.queryForm.patchValue({ unitId: 'W123456789012' });
      fixture.detectChanges();
      tick();
      component.onRetrieve();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        GRADED_DONORS_VALIDATION_MESSAGES.ERROR_16220,
        'Dismiss',
        jasmine.any(Object)
      );
      expect(component.gradedDonations().length).toBe(0);
      expect(component.gradedDonors().length).toBe(0);
      expect(component.hasQueried()).toBe(false);
    }));



    it('should map unitId 00000806 to unitId and unitDeferId params', fakeAsync(() => {
      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(
        of({ success: true, statusCode: 200, data: [], total: 0 })
      );

      component.queryForm.patchValue({ unitId: '00000806' });
      component.onRetrieve();
      tick();

      expect(mockGradedDonorsQueryService.queryGradedDonationsRaw).toHaveBeenCalledWith({
        lastName: undefined,
        unitId: '00000806',
        unitDeferId: '00000806',
        fromDate: undefined,
        toDate: undefined,
        take: 500,
        skip: 0
      });
    }));

    it('should trim whitespace from unitId before calling service', fakeAsync(() => {
      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(
        of({ success: true, statusCode: 200, data: [], total: 0 })
      );

      component.queryForm.patchValue({ unitId: '  W123456789012  ' });
      fixture.detectChanges();
      tick();
      component.onRetrieve();
      tick();

      expect(mockGradedDonorsQueryService.queryGradedDonationsRaw).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W123456789012',
          unitDeferId: 'W123456789012',
          take: 500,
          skip: 0
        })
      );
    }));

    it('should pass date range params when searching by date range', fakeAsync(() => {
      const fromDate = moment().subtract(7, 'days');
      const toDate = moment().subtract(1, 'days');

      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(
        of({ success: true, statusCode: 200, data: [], total: 0 })
      );

      component.queryForm.patchValue({ fromDate, toDate });
      component.onRetrieve();
      tick();

      expect(mockGradedDonorsQueryService.queryGradedDonationsRaw).toHaveBeenCalledWith(
        jasmine.objectContaining({
          fromDate,
          toDate,
          unitId: undefined,
          unitDeferId: undefined
        })
      );
    }));



    it('should fetch all records with take=500 and skip=0 (Bug Fix: MLT-12957)', fakeAsync(() => {
      // Bug: Screen was sending default pagination, limiting results even though there were more total
      // Fix: Explicitly set take: 500, skip: 0 to fetch all records (up to 500 max)
      const mockData = Array(18).fill(null).map((_, i) => ({
        transactionId: `TXN${i}`,
        unitId: `W${i}`,
        unitIdWithCheckDigit: `W${i}`,
        lastName: 'Smith',
        firstName: 'John',
        dateOfBirth: '1990-01-01',
        gender: 'M',
        ssn: null,
        activeFlag: 'Y',
        insertDate: '2025-01-01T10:00:00',
        insertUser: 'USER1',
        gradedDonors: []
      }));

      const mockResponse = {
        success: true,
        statusCode: 200,
        data: mockData,
        total: 18
      };

      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(of(mockResponse));

      component.queryForm.patchValue({
        fromDate: moment('2025-05-27'),
        toDate: moment('2026-06-02')
      });
      component.onRetrieve();
      tick();

      // Verify API was called with take=500, skip=0 to fetch all records
      expect(mockGradedDonorsQueryService.queryGradedDonationsRaw).toHaveBeenCalledWith(
        jasmine.objectContaining({
          fromDate: jasmine.any(Object),
          toDate: jasmine.any(Object),
          take: 500,
          skip: 0
        })
      );

      // Verify take/skip are set correctly
      const callArgs = mockGradedDonorsQueryService.queryGradedDonationsRaw.calls.mostRecent().args[0];
      expect(callArgs.take).toBe(500);
      expect(callArgs.skip).toBe(0);

      // Verify all 18 records are displayed
      expect(component.gradedDonations().length).toBe(18);
      expect(component.donationsTotalRecords()).toBe(18);
    }));
  });

  describe('Query Graded Donors', () => {
    beforeEach(() => {
      mockSnackBar.open.calls.reset();
      mockGradedDonorsQueryService.queryGradedDonations.calls.reset();
      mockGradedDonorsQueryService.queryGradedDonors.calls.reset();
    });

    it('should query graded donors successfully', fakeAsync(() => {
      // Mock raw API response with nested gradedDonors
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [
          {
            transactionId: 'TXN001',
            unitId: 'W123456789012',
            unitIdWithCheckDigit: 'W123456789012',
            lastName: 'Smith',
            firstName: 'John',
            dateOfBirth: '1990-01-01',
            gender: 'M',
            ssn: null,
            activeFlag: 'Y',
            insertDate: '2025-01-01T10:00:00',
            insertUser: 'USER1',
            gradedDonors: [
              {
                donorId: 'DN001',
                grade: 1,
                dgmId: 101,
                lastName: 'Smith',
                firstName: 'John',
                dateOfBirth: '1990-01-01',
                gender: 'M',
                potentialDuplicateFlag: 'Y'
              }
            ]
          }
        ],
        total: 1
      };

      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(of(mockResponse));

      component.selectedTabIndex.set(1);
      component.queryForm.patchValue({ unitId: 'W123456789012' });
      fixture.detectChanges();
      tick();
      component.onRetrieve();
      tick();

      expect(mockGradedDonorsQueryService.queryGradedDonationsRaw).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W123456789012',
          unitDeferId: 'W123456789012',
          take: 500,
          skip: 0
        })
      );
      expect(component.gradedDonors().length).toBe(1);
      expect(component.hasQueried()).toBe(true);
    }));

    it('should handle API error on donors tab', fakeAsync(() => {
      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.selectedTabIndex.set(1);
      component.queryForm.patchValue({ unitId: '00000806' });
      component.onRetrieve();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        GRADED_DONORS_VALIDATION_MESSAGES.API_ERROR,
        'Dismiss',
        jasmine.any(Object)
      );
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      const mockDonations: GradedDonationRecord[] = [
        {
          unitDeferId: 'W1234567',
          lastName: 'Smith',
          firstName: 'John',
          dateOfBirth: '01-JAN-1990',
          sex: 'M',
          status: 'Pending',
          insertDate: '01-JAN-2025 10:00',
          insertUser: 'USER1',
          donorId: 'DN001',
          driveId: 'DRV001'
        },
        {
          unitDeferId: 'W54321',
          lastName: 'Doe',
          firstName: 'Jane',
          dateOfBirth: '15-FEB-1985',
          sex: 'F',
          status: 'Reviewed',
          insertDate: '01-JAN-2025 11:00',
          insertUser: 'USER2',
          donorId: 'DN002',
          driveId: 'DRV002'
        }
      ];
      component.gradedDonations.set(mockDonations);
    });







    it('should return all donations when filters are "All"', () => {
      component.donationsFilters.set({ sex: 'All', status: 'All' });
      const filtered = component.filteredDonations();
      expect(filtered.length).toBe(2);
    });



    it('should exclude dash (-) from search results', () => {
      const testData: GradedDonationRecord[] = [
        { unitDeferId: 'W123', lastName: '', firstName: '', dateOfBirth: '', sex: '', status: '', insertDate: '', insertUser: '', transactionId: '', donorId: 'DN001' },
        { unitDeferId: '-', lastName: '', firstName: '', dateOfBirth: '', sex: '', status: '', insertDate: '', insertUser: '', transactionId: '', donorId: 'DN002' }
      ];
      component.gradedDonations.set(testData);
      component.donationsSearchText.set('-');

      const filtered = component.filteredDonations();
      expect(filtered.length).toBe(0);
    });
  });

  describe('Pagination', () => {




    it('should paginate donations correctly', () => {
      // Server-side pagination: API returns only current page data (10 items)
      const mockData = Array(10).fill(null).map((_, i) => ({
        unitDeferId: `W${i}`,
        lastName: 'Smith',
        firstName: 'John',
        dateOfBirth: '01-JAN-1990',
        sex: 'M',
        status: 'Pending',
        insertDate: '01-JAN-2025 10:00',
        insertUser: 'USER1',
        donorId: `DN${i}`,
        driveId: 'DRV001'
      }));

      component.gradedDonations.set(mockData);
      component.donationsTotalRecords.set(30); // Total records from server
      component.donationsPageIndex.set(0);
      component.donationsPageSize.set(10);

      const paginated = component.paginatedDonations();
      expect(paginated.length).toBe(10);
    });


  });

  describe('Record Count Footer', () => {
    it('should display total record count for donations', () => {
      component.donationsTotalRecords.set(139);
      expect(component.donationsTotalRecords()).toBe(139);
    });

    it('should display total record count for donors', () => {
      const mockDonors = Array(25).fill(null).map((_, i) => ({
        donorId: `DN${i}`,
        matchGrade: 'A1',
        dgmLocation: 'LOC-01',
        lastName: 'Smith',
        firstName: 'John',
        dateOfBirth: '01-JAN-1990',
        sex: 'M',
        mergeFlag: 'Y'
      }));
      component.gradedDonors.set(mockDonors);
      expect(component.donorsTotalCount).toBe(25);
    });

    it('should show 0 when no donations', () => {
      component.donationsTotalRecords.set(0);
      expect(component.donationsTotalRecords()).toBe(0);
    });

    it('should update record count after query', fakeAsync(() => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: Array(50).fill(null).map((_, i) => ({
          transactionId: `TXN${i}`,
          unitId: `W${i}`,
          unitIdWithCheckDigit: `W${i}`,
          lastName: 'Smith',
          firstName: 'John',
          dateOfBirth: '1990-01-01',
          gender: 'M',
          ssn: null,
          activeFlag: 'Y',
          insertDate: '2025-01-01T10:00:00',
          insertUser: 'USER1',
          gradedDonors: []
        })),
        total: 50
      };

      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(of(mockResponse));

      component.queryForm.patchValue({ unitId: 'W123456789012' });
      fixture.detectChanges();
      tick();
      component.onRetrieve();
      tick();

      expect(component.donationsTotalRecords()).toBe(50);
    }));
  });

  describe('Sorting', () => {










    it('should handle onDonationsSortChange event', () => {
      const sortEvent = { column: 'unitDeferId', direction: 'D' as const };
      component.onDonationsSortChange(sortEvent);

      expect(component.donationsSortColumn()).toBe('unitDeferId');
      expect(component.donationsSortDirection()).toBe('desc');
      expect(component.donationsPageIndex()).toBe(0);
    });

    it('should handle onDonorsSortChange event', () => {
      const sortEvent = { column: 'donorId', direction: 'A' as const };
      component.onDonorsSortChange(sortEvent);

      expect(component.donorsSortColumn()).toBe('donorId');
      expect(component.donorsSortDirection()).toBe('asc');
      expect(component.donorsPageIndex()).toBe(0);
    });

    it('should place dash (-) at top for ascending sort on unitDeferId', () => {
      const testData: GradedDonationRecord[] = [
        { unitDeferId: 'W123', lastName: 'A', firstName: '', dateOfBirth: '', sex: '', status: '', insertDate: '', insertUser: '', transactionId: '' },
        { unitDeferId: '-', lastName: 'B', firstName: '', dateOfBirth: '', sex: '', status: '', insertDate: '', insertUser: '', transactionId: '' },
        { unitDeferId: 'W456', lastName: 'C', firstName: '', dateOfBirth: '', sex: '', status: '', insertDate: '', insertUser: '', transactionId: '' }
      ];

      component.gradedDonations.set(testData);
      component.donationsSortColumn.set('unitDeferId');
      component.donationsSortDirection.set('asc');

      const filtered = component.filteredDonations();
      expect(filtered[0].unitDeferId).toBe('-');
      expect(filtered[1].unitDeferId).toBe('W123');
      expect(filtered[2].unitDeferId).toBe('W456');
    });

    it('should place dash (-) at bottom for descending sort on unitDeferId', () => {
      const testData: GradedDonationRecord[] = [
        { unitDeferId: 'W123', lastName: 'A', firstName: '', dateOfBirth: '', sex: '', status: '', insertDate: '', insertUser: '', transactionId: '' },
        { unitDeferId: '-', lastName: 'B', firstName: '', dateOfBirth: '', sex: '', status: '', insertDate: '', insertUser: '', transactionId: '' },
        { unitDeferId: 'W456', lastName: 'C', firstName: '', dateOfBirth: '', sex: '', status: '', insertDate: '', insertUser: '', transactionId: '' }
      ];

      component.gradedDonations.set(testData);
      component.donationsSortColumn.set('unitDeferId');
      component.donationsSortDirection.set('desc');

      const filtered = component.filteredDonations();
      expect(filtered[0].unitDeferId).toBe('W456');
      expect(filtered[1].unitDeferId).toBe('W123');
      expect(filtered[2].unitDeferId).toBe('-');
    });
  });


  describe('Mat-Select Dropdown with Search', () => {
    it('should filter unit IDs based on search input', () => {
      component.unitIdOptions.set([
        { unitId: 'W1234567', lastName: 'SMITH', displayValue: 'W1234567 - SMITH' },
        { unitId: 'W54321', lastName: 'DOE', displayValue: 'W54321 - DOE' },
        { unitId: 'A99999', lastName: 'JONES', displayValue: 'A99999 - JONES' }
      ]);

      const mockInput = { value: 'W' } as HTMLInputElement;
      const mockEvent = { target: mockInput } as unknown as Event;
      component.onUnitIdInput(mockEvent);

      const filtered = component.filteredUnitIds();
      expect(filtered.length).toBe(2);
      expect(filtered.some(u => u.unitId === 'W1234567')).toBe(true);
      expect(filtered.some(u => u.unitId === 'W54321')).toBe(true);
      expect(filtered.some(u => u.unitId === 'A99999')).toBe(false);
    });

    it('should filter last names based on search input', () => {
      component.lastNameOptions.set(['SMITH', 'JOHNSON', 'WILLIAMS']);

      const mockInput = { value: 'SM' } as HTMLInputElement;
      const mockEvent = { target: mockInput } as unknown as Event;
      component.onLastNameInput(mockEvent);

      const filtered = component.filteredLastNames();
      expect(filtered.length).toBe(1);
      expect(filtered).toContain('SMITH');
    });

    it('should convert unit ID search to uppercase', () => {
      component.unitIdOptions.set([]);
      const mockInput = { value: 'w12345' } as HTMLInputElement;
      const mockEvent = { target: mockInput } as unknown as Event;
      component.onUnitIdInput(mockEvent);

      expect(component.queryForm.get('unitId')?.value).toBe('W12345');
      expect(mockInput.value).toBe('W12345');
    });

    it('should convert last name search to uppercase', () => {
      component.lastNameOptions.set([]);
      const mockInput = { value: 'smith' } as HTMLInputElement;
      const mockEvent = { target: mockInput } as unknown as Event;
      component.onLastNameInput(mockEvent);

      expect(component.queryForm.get('lastName')?.value).toBe('SMITH');
      expect(mockInput.value).toBe('SMITH');
    });

    it('should filter case-insensitively', () => {
      component.unitIdOptions.set([
        { unitId: 'W1234567', lastName: 'SMITH', displayValue: 'W1234567 - SMITH' },
        { unitId: 'w54321', lastName: 'DOE', displayValue: 'w54321 - DOE' },
        { unitId: 'A99999', lastName: 'JONES', displayValue: 'A99999 - JONES' }
      ]);

      const mockInput = { value: 'w' } as HTMLInputElement;
      const mockEvent = { target: mockInput } as unknown as Event;
      component.onUnitIdInput(mockEvent);

      const filtered = component.filteredUnitIds();
      expect(filtered.length).toBe(2);
    });
  });
  describe('Date Auto-Fill Logic', () => {
    it('should auto-fill fromDate when toDate is entered and fromDate is empty', fakeAsync(() => {
      const toDate = moment('2025-05-31');
      const expectedFromDate = moment('2025-05-10'); // 21 days before

      component.queryForm.patchValue({
        fromDate: null,
        toDate: toDate
      });

      component.onToDateBlur();
      tick();

      const fromDateValue = component.queryForm.get('fromDate')?.value as moment.Moment;
      expect(fromDateValue).toBeTruthy();
      expect(fromDateValue.format('YYYY-MM-DD')).toBe(expectedFromDate.format('YYYY-MM-DD'));
    }));

    it('should not auto-fill fromDate when it already has a value', fakeAsync(() => {
      const existingFromDate = moment('2025-05-01');
      const toDate = moment('2025-05-31');

      component.queryForm.patchValue({
        fromDate: existingFromDate,
        toDate: toDate
      });

      component.onToDateBlur();
      tick();

      const fromDateValue = component.queryForm.get('fromDate')?.value as moment.Moment;
      expect(fromDateValue.format('YYYY-MM-DD')).toBe(existingFromDate.format('YYYY-MM-DD'));
    }));



    it('should calculate fromDate as 21 days before toDate', fakeAsync(() => {
      const toDate = moment('2025-06-21');
      const expectedFromDate = moment('2025-05-31'); // Exactly 21 days before

      component.queryForm.patchValue({
        fromDate: null,
        toDate: toDate
      });

      component.onToDateBlur();
      tick();

      const fromDateValue = component.queryForm.get('fromDate')?.value as moment.Moment;
      const daysDiff = toDate.diff(fromDateValue, 'days');
      expect(daysDiff).toBe(21);
    }));
  });

  describe('Autocomplete Options', () => {
    it('should load unit IDs successfully', fakeAsync(() => {
      mockGradedDonorsQueryService.getUnitIdsLov.and.returnValue(of([
        { unitId: 'W1234567', lastName: 'SMITH', displayValue: 'W1234567 - SMITH' },
        { unitId: 'W54321', lastName: 'DOE', displayValue: 'W54321 - DOE' }
      ]));

      component.ngOnInit();
      tick();

      expect(component.unitIdOptions().length).toBe(2);
    }));

    it('should handle unit IDs load failure gracefully', fakeAsync(() => {
      mockGradedDonorsQueryService.getUnitIdsLov.and.returnValue(
        throwError(() => new Error('Not implemented'))
      );

      component.ngOnInit();
      tick();

      expect(component.unitIdOptions().length).toBe(0);
    }));

    it('should load last names successfully', fakeAsync(() => {
      mockGradedDonorsQueryService.getLastNamesLov.and.returnValue(of(['Smith', 'Doe']));

      component.ngOnInit();
      tick();

      expect(component.lastNameOptions().length).toBe(2);
    }));

    it('should sort last names alphabetically when loaded', fakeAsync(() => {
      mockGradedDonorsQueryService.getLastNamesLov.and.returnValue(of(['WILLIAMS', 'ANDERSON', 'SMITH']));

      component.ngOnInit();
      tick();

      const lastNames = component.lastNameOptions();
      expect(lastNames.length).toBe(3);
      expect(lastNames[0]).toBe('ANDERSON');
      expect(lastNames[1]).toBe('SMITH');
      expect(lastNames[2]).toBe('WILLIAMS');
    }));
  });

  describe('Validation Messages', () => {
    beforeEach(() => {
      mockSnackBar.open.calls.reset();
    });

    it('should show error for invalid last name', () => {
      component.queryForm.get('lastName')?.setValue('Smith123');
      component.queryForm.get('lastName')?.markAsTouched();
      component.onRetrieve();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        GRADED_DONORS_VALIDATION_MESSAGES.INVALID_LAST_NAME,
        'Dismiss',
        jasmine.any(Object)
      );
    });

    it('should show error for mutually exclusive fields', fakeAsync(() => {
      // Mock the service to avoid TypeError if validation doesn't catch it
      mockGradedDonorsQueryService.queryGradedDonations.and.returnValue(of({
        success: true,
        statusCode: 200,
        data: [],
        total: 0
      }));

      // Temporarily enable all fields to bypass UI mutual exclusivity logic
      component.queryForm.get('unitId')?.enable({ emitEvent: false });
      component.queryForm.get('lastName')?.enable({ emitEvent: false });
      component.queryForm.get('fromDate')?.enable({ emitEvent: false });
      component.queryForm.get('toDate')?.enable({ emitEvent: false });

      // Set both fields to trigger mutual exclusivity error
      component.queryForm.patchValue({
        lastName: 'Smith',
        unitId: 'W1234567'
      }, { emitEvent: false });

      // Trigger validation
      component.queryForm.updateValueAndValidity();
      fixture.detectChanges();
      tick();

      component.onRetrieve();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        GRADED_DONORS_VALIDATION_MESSAGES.MUTUALLY_EXCLUSIVE,
        'Dismiss',
        jasmine.any(Object)
      );
    }));

    it('should show error for invalid date range', () => {
      component.queryForm.patchValue({
        fromDate: moment(),
        toDate: moment().subtract(7, 'days')
      });
      component.queryForm.updateValueAndValidity();
      fixture.detectChanges();

      component.onRetrieve();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        GRADED_DONORS_VALIDATION_MESSAGES.INVALID_DATE_RANGE,
        'Dismiss',
        jasmine.any(Object)
      );
    });
  });

  describe('Computed Properties', () => {
    it('should compute donations total count', () => {
      component.gradedDonations.set([
        { unitDeferId: 'W1' } as any,
        { unitDeferId: 'W2' } as any
      ]);
      component.donationsTotalRecords.set(2); // Server-side pagination: total from API

      expect(component.donationsTotalCount).toBe(2);
    });

    it('should compute donors total count', () => {
      component.gradedDonors.set([
        { donorId: 'DN1' } as any,
        { donorId: 'DN2' } as any,
        { donorId: 'DN3' } as any
      ]);
      // Client-side pagination for donors: count is from filtered results

      expect(component.donorsTotalCount).toBe(3);
    });
  });
  describe('Form Controls Getter', () => {
    it('should return form controls', () => {
      const controls = component.f;
      expect(controls).toBeDefined();
      expect(controls['unitId']).toBeDefined();
      expect(controls['lastName']).toBeDefined();
    });
  });

  describe('Responsive Layout', () => {


    it('should have retrieve button in form', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const retrieveButton = compiled.querySelector('.retrieve-button');
      expect(retrieveButton).toBeTruthy();
      expect(retrieveButton?.textContent?.trim()).toBe('RETRIEVE');
    });

    it('should have clear all button in form', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const clearAllButton = compiled.querySelector('.clear-all-button');
      expect(clearAllButton).toBeTruthy();
      expect(clearAllButton?.textContent?.trim()).toBe('CLEAR ALL');
    });

    it('should initialize all form fields', () => {
      expect(component.queryForm.get('unitId')).toBeTruthy();
      expect(component.queryForm.get('lastName')).toBeTruthy();
      expect(component.queryForm.get('fromDate')).toBeTruthy();
      expect(component.queryForm.get('toDate')).toBeTruthy();
    });
  });

  describe('Clear All Functionality', () => {
    it('should reset component when onClearAll is called', fakeAsync(() => {
      component.gradedDonations.set([{ unitDeferId: 'W1234567' } as any]);
      component.gradedDonors.set([{ donorId: 'DN001' } as any]);
      component.hasQueried.set(true);
      component.queryForm.patchValue({ unitId: 'W1234567' });

      component.onClearAll();
      tick();

      expect(component.gradedDonations().length).toBe(0);
      expect(component.gradedDonors().length).toBe(0);
      expect(component.hasQueried()).toBe(false);
      expect(component.queryForm.get('unitId')?.value).toBeFalsy();
    }));

    it('should clear all form fields when onClearAll is called', fakeAsync(() => {
      component.queryForm.patchValue({
        unitId: 'W1234567',
        lastName: 'Smith',
        fromDate: moment(),
        toDate: moment()
      });

      component.onClearAll();
      tick();

      expect(component.queryForm.get('unitId')?.value).toBeFalsy();
      expect(component.queryForm.get('lastName')?.value).toBeFalsy();
      expect(component.queryForm.get('fromDate')?.value).toBeNull();
      expect(component.queryForm.get('toDate')?.value).toBeNull();
    }));

    it('should re-enable all fields when onClearAll is called', fakeAsync(() => {
      component.queryForm.get('unitId')?.setValue('W1234567');
      tick();

      component.onClearAll();
      tick();

      expect(component.isUnitIdDisabled()).toBe(false);
      expect(component.isLastNameDisabled()).toBe(false);
      expect(component.isDateRangeDisabled()).toBe(false);
    }));











    it('should enable Clear All button immediately without waiting for data retrieval', fakeAsync(() => {
      // Set a value but don't query
      component.queryForm.get('unitId')?.setValue('W1234567');
      tick();

      // Clear All should be enabled even though hasQueried is false
      expect(component.hasQueried()).toBe(false);
      expect(component.isClearAllDisabled()).toBe(false);
    }));
  });

  describe('Scrolling Tables', () => {




    it('should render tables when data is available', fakeAsync(() => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [{
          transactionId: 'TXN001',
          unitId: 'W123456789012',
          unitIdWithCheckDigit: 'W123456789012',
          lastName: 'Smith',
          firstName: 'John',
          dateOfBirth: '1990-01-01',
          gender: 'M',
          ssn: null,
          activeFlag: 'Y',
          insertDate: '2025-01-01T10:00:00',
          insertUser: 'USER1',
          gradedDonors: []
        }],
        total: 1
      };

      mockGradedDonorsQueryService.queryGradedDonationsRaw.and.returnValue(of(mockResponse));

      component.queryForm.patchValue({ unitId: 'W123456789012' });
      fixture.detectChanges();
      tick();
      component.onRetrieve();
      tick();
      fixture.detectChanges();

      expect(component.hasQueried()).toBe(true);
      expect(component.gradedDonations().length).toBeGreaterThan(0);
    }));
  });

  describe('Error Validation Messages', () => {
    it('should have unit ID error getter method', () => {
      const unitIdControl = component.queryForm.get('unitId');
      unitIdControl?.setValue('123'); // Invalid length
      unitIdControl?.markAsTouched();

      const error = component.getUnitIdError();
      expect(error).toBeTruthy();
      expect(error).toContain('7, 8, 13, or 15 characters');
    });

    it('should have last name error getter method', () => {
      const lastNameControl = component.queryForm.get('lastName');
      lastNameControl?.setValue('Smith123'); // Invalid characters
      lastNameControl?.markAsTouched();

      const error = component.getLastNameError();
      expect(error).toBeTruthy();
      expect(error).toContain('Last Name can only contain letters, apostrophe (\'), and hyphen (-)');
    });




  });

  describe('Filter Chips', () => {


    it('should generate filter chips when donations filters are applied', () => {
      component.applyDonationsFilters({ sex: 'Male', status: 'Active' });

      const chips = component.donationsFilterChips();
      expect(chips.length).toBe(2);
      expect(chips[0].label).toBe('Sex: Male');
      expect(chips[1].label).toBe('Status: Active');
    });

    it('should generate filter chips when donors filters are applied', () => {
      component.applyDonorsFilters({ sex: 'Female', status: 'Inactive' });

      const chips = component.donorsFilterChips();
      expect(chips.length).toBe(2);
      expect(chips[0].label).toBe('Sex: Female');
      expect(chips[1].label).toBe('Merge Status: Inactive');
    });





    it('should clear all donations filters', () => {
      component.donationsFilters.set({ sex: 'Male', status: 'Active' });
      component.donationsFilterChips.set([
        { key: 'sex', label: 'Sex: Male', value: 'Male' }
      ]);

      component.clearDonationsFilters();

      expect(component.donationsFilters()).toEqual({ sex: 'All', status: 'All' });
      expect(component.donationsFilterChips()).toEqual([]);
      expect(component.donationsPageIndex()).toBe(0);
    });

    it('should clear all donors filters', () => {
      component.donorsFilters.set({ sex: 'Female', status: 'Inactive' });
      component.donorsFilterChips.set([
        { key: 'sex', label: 'Sex: Female', value: 'Female' }
      ]);

      component.clearDonorsFilters();

      expect(component.donorsFilters()).toEqual({ sex: 'All', status: 'All' });
      expect(component.donorsFilterChips()).toEqual([]);
      expect(component.donorsPageIndex()).toBe(0);
    });

    it('should not generate chips for "All" filter values', () => {
      component.applyDonationsFilters({ sex: 'All', status: 'All' });

      const chips = component.donationsFilterChips();
      expect(chips.length).toBe(0);
    });

    it('should map Male/Female display values to M/F codes when filtering', () => {
      const mockDonations: GradedDonationRecord[] = [
        {
          unitDeferId: 'W1',
          lastName: 'Smith',
          firstName: 'John',
          dateOfBirth: '01-JAN-1990',
          sex: 'M',
          status: 'Active',
          insertDate: '01-JAN-2025 10:00',
          insertUser: 'USER1'
        },
        {
          unitDeferId: 'W2',
          lastName: 'Doe',
          firstName: 'Jane',
          dateOfBirth: '15-FEB-1985',
          sex: 'F',
          status: 'Active',
          insertDate: '01-JAN-2025 11:00',
          insertUser: 'USER2'
        }
      ];

      component.gradedDonations.set(mockDonations);
      component.donationsFilters.set({ sex: 'Male', status: 'All' });

      const filtered = component.filteredDonations();
      expect(filtered.length).toBe(1);
      expect(filtered[0].sex).toBe('M');
      expect(filtered[0].lastName).toBe('Smith');
    });

    it('should generate sex options as Male/Female display values', () => {
      const mockDonations: GradedDonationRecord[] = [
        { sex: 'M' } as GradedDonationRecord,
        { sex: 'F' } as GradedDonationRecord
      ];

      component.gradedDonations.set(mockDonations);

      const sexOptions = component.availableDonationsSexOptions;
      expect(sexOptions).toContain('Male');
      expect(sexOptions).toContain('Female');
      expect(sexOptions).not.toContain('M');
      expect(sexOptions).not.toContain('F');
    });
  });
});
