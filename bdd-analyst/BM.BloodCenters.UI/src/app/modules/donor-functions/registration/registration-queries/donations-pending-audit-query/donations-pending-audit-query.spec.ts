import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { DonationsPendingAuditQuery } from './donations-pending-audit-query';
import { DonationsPendingAuditQueryService } from './services/donations-pending-audit-query.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DonationEntryDetailsDialogComponent } from '@shared/components/donation-entry-details-dialog/donation-entry-details-dialog';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DonationsPendingAuditQuery', () => {
  let component: DonationsPendingAuditQuery;
  let fixture: ComponentFixture<DonationsPendingAuditQuery>;
  let mockService: jasmine.SpyObj<DonationsPendingAuditQueryService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRouter: jasmine.SpyObj<Router>;
  let chapterChanged$: Subject<void>;

  const mockChapterDate = new Date('2024-02-15');
  const mockDrives = [
    { driveId: 'DRV001', sponsorName: 'Test Drive 1', driveDate: '2024-01-15' },
    { driveId: 'DRV002', sponsorName: 'Test Drive 2', driveDate: '2024-01-16' }
  ];
  const mockDonations = [
    {
      unitId: '1234567890123',
      driveId: 'DRV001',
      collDate: '2024-01-15',
      donorId: 'DN12345',
      donationType: 'WB',
      procedureCode: 'PR001',
      insertUser: 'USER01',
      insertDate: '2024-01-15T10:30:00Z',
      transactionId: '123456'
    }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('DonationsPendingAuditQueryService', [
      'searchDonationsPendingAudit',
      'getDrivesDropdown'
    ]);
    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({
        title: 'Donations Pending Audit Query',
        subtitle: 'View donations pending audit'
      })
    });
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate'
    ], {
      chapterLocalDate: signal(moment(mockChapterDate))
    });
    mockSnackBar = createMockMatSnackBar();
    mockDialog = createMockMatDialog();
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment(mockChapterDate));
    mockService.getDrivesDropdown.and.returnValue(of({ data: mockDrives }));



      TestBed.configureTestingModule({
      imports: [DonationsPendingAuditQuery,
        ReactiveFormsModule,
        NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: DonationsPendingAuditQueryService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog }
      ]
    });


    


      mockService.searchDonationsPendingAudit.calls.reset();


      mockService.getDrivesDropdown.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockHeaderService.getCurrentChapterTimezone.calls.reset();


      mockChapterTimezoneService.getChapterLocalDate.calls.reset();


      mockDialog.open.calls.reset();


      mockRouter.navigateByUrl.calls.reset();


      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment(mockChapterDate));
      mockService.getDrivesDropdown.and.returnValue(of({ data: mockDrives }));


    fixture = TestBed.createComponent(DonationsPendingAuditQuery);
    component = fixture.componentInstance;

    // Override router for navigation tests
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));


    });

  describe('Initialization', () => {
    it('should initialize form with null dates initially', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('status')?.value).toBe('R');
      expect(component.filterForm.get('driveId')?.value).toBe('');
      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
    });

    it('should not have required validators on date fields initially', () => {
      fixture.detectChanges();

      const fromDateControl = component.filterForm.get('fromDate');
      const toDateControl = component.filterForm.get('toDate');

      expect(fromDateControl?.hasError('required')).toBeFalse();
      expect(toDateControl?.hasError('required')).toBeFalse();
    });

    it('should load drives on init', () => {
      fixture.detectChanges();

      // Drives are loaded initially - backend applies default 30-day range
      expect(component.driveOptions().length).toBe(2);
    });

    it('should initialize status options', () => {
      expect(component.statusOptions().length).toBe(3);
      expect(component.statusOptions()).toContainEqual({ code: 'A', description: 'All' });
      expect(component.statusOptions()).toContainEqual({ code: 'R', description: 'Ready for Audit' });
      expect(component.statusOptions()).toContainEqual({ code: 'N', description: 'No Donor' });
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require toDate when fromDate is selected', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      const toDateControl = component.filterForm.get('toDate');

      // Set fromDate
      fromDateControl?.setValue(moment('2024-02-01'));
      tick();

      // toDate should now be required
      expect(toDateControl?.hasError('required')).toBeTrue();
    }));

    it('should require fromDate when toDate is selected', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      const toDateControl = component.filterForm.get('toDate');

      // Set toDate
      toDateControl?.setValue(moment('2024-02-15'));
      tick();

      // fromDate should now be required
      expect(fromDateControl?.hasError('required')).toBeTrue();
    }));

    it('should clear required error when both dates are filled', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      const toDateControl = component.filterForm.get('toDate');

      // Set both dates
      fromDateControl?.setValue(moment('2024-02-01'));
      toDateControl?.setValue(moment('2024-02-15'));
      tick();

      // Neither should have required error
      expect(fromDateControl?.hasError('required')).toBeFalse();
      expect(toDateControl?.hasError('required')).toBeFalse();
    }));

    it('should not have required errors when both dates are null', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      const toDateControl = component.filterForm.get('toDate');

      // Ensure both are null
      fromDateControl?.setValue(null);
      toDateControl?.setValue(null);
      tick();

      // Neither should have required error
      expect(fromDateControl?.hasError('required')).toBeFalse();
      expect(toDateControl?.hasError('required')).toBeFalse();
    }));

    it('should validate that fromDate is not after toDate', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      const toDateControl = component.filterForm.get('toDate');

      fromDateControl?.setValue(moment('2024-02-15'));
      toDateControl?.setValue(moment('2024-02-01'));
      tick();

      expect(fromDateControl?.hasError('fromAfterTo')).toBeTrue();
    }));

    it('should validate that dates are not in the future', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      const futureDate = moment(mockChapterDate).add(1, 'day');

      fromDateControl?.setValue(futureDate);
      tick();

      expect(fromDateControl?.hasError('futureDate')).toBeTrue();
    }));

    it('should reload drives when both dates are selected and valid', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      const toDateControl = component.filterForm.get('toDate');

      // Reset spy to track only new calls
      mockService.getDrivesDropdown.calls.reset();

      // Set fromDate first - drives should not reload yet (toDate is still null)
      fromDateControl?.setValue(moment('2024-02-01'));
      tick();
      expect(mockService.getDrivesDropdown.calls.count()).toBe(0);

      // Set toDate - now drives should reload
      toDateControl?.setValue(moment('2024-02-15'));
      tick();
      expect(mockService.getDrivesDropdown.calls.count()).toBe(1);

      // Verify the call was made with correct date parameters
      const callArgs = mockService.getDrivesDropdown.calls.mostRecent().args;
      expect(callArgs[0]).toBe('2024-02-01'); // fromDate
      expect(callArgs[1]).toBe('2024-02-15'); // toDate
    }));

    it('should not reload drives if dates have validation errors', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      const toDateControl = component.filterForm.get('toDate');

      // Reset spy to track only new calls
      mockService.getDrivesDropdown.calls.reset();

      // Set fromDate after toDate (validation error)
      toDateControl?.setValue(moment('2024-02-01'));
      tick();
      fromDateControl?.setValue(moment('2024-02-15'));
      tick();

      // Should not reload drives because fromAfterTo error exists
      expect(mockService.getDrivesDropdown.calls.count()).toBe(0);
    }));
  });

  describe('Retrieve Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call service with correct parameters on retrieve', () => {
      // Set dates manually since they're no longer set by default
      component.filterForm.patchValue({
        fromDate: moment('2024-02-01'),
        toDate: moment('2024-02-15')
      });

      mockService.searchDonationsPendingAudit.and.returnValue(of({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          resp: mockDonations,
          donationType: [],
          procedureCode: []
        },
        totalCount: 1
      }));

      component.onRetrieve();

      expect(mockService.searchDonationsPendingAudit).toHaveBeenCalled();
      const callArgs = mockService.searchDonationsPendingAudit.calls.mostRecent().args[0];
      expect(callArgs.status).toBe('R');
      expect(callArgs.fromDate).toBeTruthy();
      expect(callArgs.toDate).toBeTruthy();
    });

    it('should update dataSource with retrieved data and send take/skip params', () => {
      // Set dates manually since they're no longer set by default
      component.filterForm.patchValue({
        fromDate: moment('2024-02-01'),
        toDate: moment('2024-02-15')
      });

      mockService.searchDonationsPendingAudit.and.returnValue(of({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          resp: mockDonations,
          donationType: [],
          procedureCode: []
        },
        totalCount: 1
      }));

      component.onRetrieve();

      const callArgs = mockService.searchDonationsPendingAudit.calls.mostRecent().args[0];
      expect(callArgs.take).toBe(25);
      expect(callArgs.skip).toBe(0);
      expect(component.dataSource.length).toBe(1);
      expect(component.totalFound).toBe(1);
      expect(component.hasRetrievedData).toBe(true);
    });


  });


  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Set dates manually since they're no longer set by default
      component.filterForm.patchValue({
        fromDate: moment('2024-02-01'),
        toDate: moment('2024-02-15')
      });
      mockService.searchDonationsPendingAudit.and.returnValue(of({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          resp: mockDonations,
          donationType: [],
          procedureCode: []
        },
        totalCount: 100
      }));
    });

    it('should update pagination state and refetch data', () => {
      mockService.searchDonationsPendingAudit.and.returnValue(of({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          resp: mockDonations,
          donationType: [],
          procedureCode: []
        },
        totalCount: 100
      }));

      component.onPageChange({ pageIndex: 1, pageSize: 50, previousPageIndex: 0 });

      expect(component.tableConfig.pagination?.pageIndex).toBe(1);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(mockService.searchDonationsPendingAudit).toHaveBeenCalled();
      expect(component.searchKeyword).toBe('');
    });
  });

  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open DonationEntryDetailsDialog on entryDetails action', () => {
      const mockRow = mockDonations[0];

      component.onRowAction({ action: 'entryDetails', row: mockRow });

      expect(mockDialog.open).toHaveBeenCalledWith(
        DonationEntryDetailsDialogComponent,
        jasmine.objectContaining({
          data: { unitId: mockRow.unitId }
        })
      );
    });



  });

  describe('Drive Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should return all drives when search is empty', () => {
      component.driveOptions.set(mockDrives);
      component.driveSearchControl.setValue('');

      const filtered = component.filteredDrives();

      expect(filtered.length).toBe(2);
    });
  });
  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and data', () => {
      component.hasRetrievedData = true;
      component.dataSource = mockDonations;
      component.filterForm.patchValue({ driveId: 'DRV001', status: 'N' });

      component.onClearAll();

      expect(component.dataSource.length).toBe(0);
      expect(component.hasRetrievedData).toBe(false);
      expect(component.filterForm.get('status')?.value).toBe('R');
      expect(component.filterForm.get('driveId')?.value).toBe('');
    });


  });

  describe('Search Functionality', () => {
    const mockSearchResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: {
        resp: [
          {
            unitId: '1234567890123',
            driveId: 'DRV001',
            collDate: '2024-01-15',
            donorId: 'DN12345',
            donationType: 'WB',
            procedureCode: 'PR001',
            insertUser: 'USER01',
            insertDate: '2024-01-15T10:30:00Z',
            transactionId: '123456'
          }
        ],
        donationType: [],
        procedureCode: []
      },
      totalCount: 1
    };

    const mockEmptyResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: {
        resp: [],
        donationType: [],
        procedureCode: []
      },
      totalCount: 0
    };

    beforeEach(() => {
      // Set up form with valid dates (required for onRetrieve)
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31')
      });
      component.tableConfig.pagination = {
        pageSize: 25,
        pageIndex: 0,
        totalRecords: 0,
        pageSizeOptions: [25, 50, 100]
      };
    });

    it('should set search keyword and call onRetrieve when searching', () => {
      // Arrange
      mockService.searchDonationsPendingAudit.and.returnValue(of(mockSearchResponse));
      spyOn(component, 'onRetrieve').and.callThrough();

      // Act
      component.onSearch('DN12345');

      // Assert
      expect(component.searchKeyword).toBe('DN12345');
      expect(component.onRetrieve).toHaveBeenCalled();
    });

    it('should send search keyword to server in API request', () => {
      // Arrange
      mockService.searchDonationsPendingAudit.and.returnValue(of(mockSearchResponse));

      // Act
      component.onSearch('DN12345');

      // Assert
      expect(mockService.searchDonationsPendingAudit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          searchKeyword: 'DN12345'
        })
      );
    });


    it('should send empty/null searchKeyword when search is cleared', () => {
      // Arrange
      mockService.searchDonationsPendingAudit.and.returnValue(of(mockEmptyResponse));
      component.searchKeyword = 'previous-search';

      // Act
      component.onSearch('');

      // Assert
      expect(component.searchKeyword).toBe('');
      expect(mockService.searchDonationsPendingAudit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          searchKeyword: null
        })
      );
    });

    it('should update dataSource with filtered results from server', () => {
      // Arrange
      mockService.searchDonationsPendingAudit.and.returnValue(of(mockSearchResponse));

      // Act
      component.onSearch('DN12345');

      // Assert
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].donorId).toBe('DN12345');
      expect(component.totalFound).toBe(1);
    });

  });
});
