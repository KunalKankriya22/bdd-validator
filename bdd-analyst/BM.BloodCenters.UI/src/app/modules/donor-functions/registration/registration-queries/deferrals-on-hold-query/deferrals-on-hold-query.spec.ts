import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { DeferralsOnHoldQueryComponent } from './deferrals-on-hold-query';
import { DeferralsOnHoldQueryService } from './services/deferrals-on-hold-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DeferralHoldModel } from './models/deferrals-on-hold-query.model';
import { HoldReasonDialog } from './components/hold-reason-dialog/hold-reason-dialog';
import { DeferralEntryDetailsDialogComponent } from '@shared/components/deferral-entry-details-dialog/deferral-entry-details-dialog';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('DeferralsOnHoldQueryComponent', () => {
  let chapterTimezoneSpy: any;
  let component: DeferralsOnHoldQueryComponent;
  let fixture: ComponentFixture<DeferralsOnHoldQueryComponent>;
  let mockQueryService: jasmine.SpyObj<DeferralsOnHoldQueryService>;
  let dialog: MatDialog;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const mockSummaryData: DeferralHoldModel[] = [
    {
      deferralId: '01012018',
      transactionId: 'TR02866892',
      driveId: 'DRV0164777',
      donorId: 'DN30120470',
      collDate: '2025-01-10',
      donorName: 'JOHN SMITH',
      donationType: 'AL',
      procedureCode: 'WB',
      user: 'CELHUN',
      dateTimeOfRegistration: '2025-01-11T09:05:00',
      auditComplete: '',
    },
    {
      deferralId: '02022018',
      transactionId: 'TR02866893',
      driveId: 'DRV0164778',
      donorId: 'DN30120471',
      collDate: '2025-01-11',
      donorName: 'JANE DOE',
      donationType: 'AL',
      procedureCode: 'WB',
      user: 'CYNCUL',
      dateTimeOfRegistration: '2025-01-12T10:15:00',
      auditComplete: 'Yes',
    },
  ];

  beforeEach(() => {

    mockQueryService = jasmine.createSpyObj('DeferralsOnHoldQueryService', [
      'searchDeferralHolds',
      'getDrivesLov',
      'getDeferralsLov',
      'getTransactionsLov',
      'getUsersLov',
      'getInterdictionCodesLov',
      'getDonorInterdictions',
      'getDonationInterdictions',
      'getSetsLov',
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of(),
    });
    mockRouter.createUrlTree.and.returnValue({});
    mockRouter.serializeUrl.and.returnValue('');
    mockSnackbarService = createMockSnackbarService();

    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate'
    ], {
      chapterLocalDate: signal(moment())
    });
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });

    mockQueryService.getDrivesLov.and.returnValue(of([{ code: 'DRV001', description: 'Drive 1' }]));
    mockQueryService.getDeferralsLov.and.returnValue(of([{ code: 'DEF001', description: 'DEF001' }]));
    mockQueryService.getTransactionsLov.and.returnValue(of([{ code: 'TR001', description: 'Trans 1' }]));
    mockQueryService.getUsersLov.and.returnValue(of([{ code: 'USER01', description: 'User 1' }]));
    mockQueryService.getInterdictionCodesLov.and.returnValue(of([{ code: 'DRDEF', description: 'Deferral Hold' }]));
    mockQueryService.getSetsLov.and.returnValue(of([]));
    mockQueryService.searchDeferralHolds.and.returnValue(of({ data: mockSummaryData, total: 2 }));



      TestBed.configureTestingModule({
      imports: [DeferralsOnHoldQueryComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatDialogModule],
      providers: [
        provideHttpClient(),
        { provide: DeferralsOnHoldQueryService, useValue: mockQueryService },
        { provide: Router, useValue: mockRouter },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    });


    


      mockQueryService.searchDeferralHolds.calls.reset();


      mockQueryService.getDrivesLov.calls.reset();


      mockQueryService.getDeferralsLov.calls.reset();


      mockQueryService.getTransactionsLov.calls.reset();


      mockQueryService.getUsersLov.calls.reset();


      mockQueryService.getInterdictionCodesLov.calls.reset();


      mockQueryService.getDonorInterdictions.calls.reset();


      mockQueryService.getDonationInterdictions.calls.reset();


      mockQueryService.getSetsLov.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      chapterTimezoneSpy.getChapterLocalDate.calls.reset();


      mockRouter.createUrlTree.and.returnValue({});


      mockRouter.serializeUrl.and.returnValue('');


      chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());


      mockQueryService.getDrivesLov.and.returnValue(of([{ code: 'DRV001', description: 'Drive 1' }]));


      mockQueryService.getDeferralsLov.and.returnValue(of([{ code: 'DEF001', description: 'DEF001' }]));


      mockQueryService.getTransactionsLov.and.returnValue(of([{ code: 'TR001', description: 'Trans 1' }]));


      mockQueryService.getUsersLov.and.returnValue(of([{ code: 'USER01', description: 'User 1' }]));


      mockQueryService.getInterdictionCodesLov.and.returnValue(of([{ code: 'DRDEF', description: 'Deferral Hold' }]));


      mockQueryService.getSetsLov.and.returnValue(of([]));


      mockQueryService.searchDeferralHolds.and.returnValue(of({ data: mockSummaryData, total: 2 }));


    mockChapterTimezoneService = TestBed.inject(ChapterTimezoneService) as jasmine.SpyObj<ChapterTimezoneService>;

    fixture = TestBed.createComponent(DeferralsOnHoldQueryComponent);
    component = fixture.componentInstance;
    dialog = component['dialog'];
    spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(null) } as any);


    });

  describe('Component Initialization', () => {
    it('should initialize header config with breadcrumbs', () => {
      expect(component.headerConfig).toBeDefined();
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThan(0);
    });

    it('should initialize table config with 11 columns', () => {
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.columns.length).toBe(11);
    });


    it('should initialize filter form with 7 controls', () => {
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('driveDateFrom')).toBeDefined();
      expect(component.filterForm.get('driveDateTo')).toBeDefined();
      expect(component.filterForm.get('driveId')).toBeDefined();
      expect(component.filterForm.get('deferralId')).toBeDefined();
      expect(component.filterForm.get('transactionId')).toBeDefined();
      expect(component.filterForm.get('userId')).toBeDefined();
      expect(component.filterForm.get('interdictionCode')).toBeDefined();
    });

    it('should load only driveIds and interdictionCodes on init', () => {
      component.ngOnInit();
      expect(mockQueryService.getDrivesLov).toHaveBeenCalled();
      expect(mockQueryService.getInterdictionCodesLov).toHaveBeenCalled();
      expect(mockQueryService.getDeferralsLov).not.toHaveBeenCalled();
      expect(mockQueryService.getTransactionsLov).not.toHaveBeenCalled();
      expect(mockQueryService.getUsersLov).not.toHaveBeenCalled();
    });

    it('should populate only driveIds and interdictionCodes after loading', async () => {
      component.ngOnInit();
      await fixture.whenStable();
      expect(component.driveIds.length).toBe(1);
      expect(component.interdictionCodes.length).toBe(1);
      expect(component.deferralIds.length).toBe(0);
      expect(component.transactionIds.length).toBe(0);
      expect(component.users.length).toBe(0);
    });

  });

  describe('Retrieve Button State', () => {
    it('should enable retrieve when no filter values are set', () => {
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should enable retrieve when at least one filter value is set', () => {
      component.filterForm.get('driveId')?.setValue('DRV001');
      expect(component.isRetrieveDisabled).toBeFalse();
    });


    it('should call API when retrieve is clicked with no filters', () => {
      mockQueryService.searchDeferralHolds.calls.reset();
      component.onRetrieve();
      expect(mockQueryService.searchDeferralHolds).toHaveBeenCalledWith(25, 0, jasmine.any(Object));
      expect(component.dataSource).toEqual(mockSummaryData);
      expect(component.totalCount).toBe(2);
      expect(component.hasSearched).toBeTrue();
    });
  });

  describe('Data Loading', () => {
    it('should load data when retrieve is clicked', () => {
      component.filterForm.get('driveId')?.setValue('DRV001');
      component.onRetrieve();
      expect(mockQueryService.searchDeferralHolds).toHaveBeenCalledWith(25, 0, jasmine.any(Object));
      expect(component.dataSource).toEqual(mockSummaryData);
      expect(component.totalCount).toBe(2);
    });

    it('should include deferralId in search request when set', () => {
      component.filterForm.get('deferralId')?.setValue('DEF001');
      component.onRetrieve();
      expect(mockQueryService.searchDeferralHolds).toHaveBeenCalledWith(
        25, 0, jasmine.objectContaining({ deferralId: 'DEF001' })
      );
    });

    it('should join interdictionCode array with commas when multiple selected', () => {
      component.filterForm.get('interdictionCode')?.setValue(['DRDEF', 'HOLD']);
      component.onRetrieve();
      expect(mockQueryService.searchDeferralHolds).toHaveBeenCalledWith(
        25, 0, jasmine.objectContaining({ interdictionCode: 'DRDEF,HOLD' })
      );
    });

    it('should set hasSearched to true after retrieve', () => {
      component.filterForm.get('driveId')?.setValue('DRV001');
      component.onRetrieve();
      expect(component.hasSearched).toBeTrue();
    });

    it('should handle error on data loading', () => {
      const error = { status: 500, error: { message: 'Server error' } };
      mockQueryService.searchDeferralHolds.and.returnValue(throwError(() => error));

      component.filterForm.get('driveId')?.setValue('DRV001');
      component.onRetrieve();

      expect(component.dataSource).toEqual([]);
      expect(component.errorMessage).toBe('Server error');
      expect(component.isLoadingData).toBeFalse();
    });

    it('should set generic error message when no specific message', () => {
      mockQueryService.searchDeferralHolds.and.returnValue(throwError(() => ({})));

      component.filterForm.get('driveId')?.setValue('DRV001');
      component.onRetrieve();

      expect(component.errorMessage).toBe('An error occurred while loading data');
    });

    it('should show empty state when search returns no results', () => {
      mockQueryService.searchDeferralHolds.and.returnValue(of({ data: [], total: 0 }));

      component.filterForm.get('driveId')?.setValue('DRV001');
      component.onRetrieve();

      expect(component.dataSource).toEqual([]);
      expect(component.totalCount).toBe(0);
      expect(component.hasSearched).toBeTrue();
      expect(component.errorMessage).toBeNull();
      expect(component.isLoadingData).toBeFalse();
    });
  });

  describe('Clear All', () => {
    it('should reset form and data on clear all', () => {
      component.dataSource = mockSummaryData;
      component.totalCount = 2;
      component.hasSearched = true;

      component.onClearAll();

      expect(component.dataSource).toEqual([]);
      expect(component.totalCount).toBe(0);
      expect(component.hasSearched).toBeFalse();
      expect(component.errorMessage).toBeNull();
    });

    it('should reset search controls on clear all', () => {
      component.ngOnInit();
      component.driveIdSearchControl.setValue('test');
      component.deferralIdSearchControl.setValue('test');
      component.transactionIdSearchControl.setValue('test');
      component.userSearchControl.setValue('test');
      component.interdictionCodeSearchControl.setValue('test');

      component.onClearAll();

      expect(component.driveIdSearchControl.value).toBe('');
      expect(component.deferralIdSearchControl.value).toBe('');
      expect(component.transactionIdSearchControl.value).toBe('');
      expect(component.userSearchControl.value).toBe('');
      expect(component.interdictionCodeSearchControl.value).toBe('');
    });

    it('should reset filtered arrays to full source arrays on clear all', () => {
      component.ngOnInit();
      component.driveIdSearchControl.setValue('NONEXISTENT');

      component.onClearAll();

      expect(component.filteredDriveIds()).toEqual(component.driveIds);
      expect(component.filteredDeferralIds()).toEqual([]);
      expect(component.filteredTransactionIds()).toEqual([]);
      expect(component.filteredUsers()).toEqual([]);
      expect(component.filteredInterdictionCodes()).toEqual(component.interdictionCodes);
    });
  });

  describe('isClearAllDisabled', () => {







    it('should become disabled after onClearAll', () => {
      component.hasSearched = true;
      component.dataSource = mockSummaryData;
      component.filterForm.markAsDirty();
      expect(component.isClearAllDisabled).toBeFalse();

      component.onClearAll();
      expect(component.isClearAllDisabled).toBeTrue();
    });
  });
  describe('Date Validation', () => {


    it('should return error when from date has invalid format', () => {
      const control = component.filterForm.get('driveDateFrom');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      expect(component.getFromDateError()).toBe('Drive Date From is invalid');
    });

  });

  describe('Drive Date To Validation', () => {


    it('should return error when to date has invalid format', () => {
      const control = component.filterForm.get('driveDateTo');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      expect(component.getToDateError()).toBe('Drive Date To is invalid');
    });

    it('should return error when to date has matDatepickerParse error', () => {
      const control = component.filterForm.get('driveDateTo');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getToDateError()).toBe('Drive Date To is invalid');
    });

  });

  describe('Audit Complete Formatting', () => {
    it('should format empty audit complete as "--"', () => {
      const auditCol = component.tableConfig.columns.find(c => c.key === 'auditComplete');
      expect(auditCol?.valueFormatter?.('', mockSummaryData[0])).toBe('--');
    });

    it('should keep non-empty audit complete value', () => {
      const auditCol = component.tableConfig.columns.find(c => c.key === 'auditComplete');
      expect(auditCol?.valueFormatter?.('Yes', mockSummaryData[1])).toBe('Yes');
    });
  });

  describe('Sorting', () => {

    it('should preserve page index on sort change', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.onSortChange({ column: 'collDate', direction: 'D' });
      expect(component.tableConfig.pagination?.pageIndex).toBe(3);
    });


    it('should include sort params in search request', () => {
      component.filterForm.get('driveId')?.setValue('DRV001');
      component.tableConfig.sortConfig = { column: 'collDate', direction: 'D' };
      component.onRetrieve();
      expect(mockQueryService.searchDeferralHolds).toHaveBeenCalledWith(
        25, 0, jasmine.objectContaining({ sortBy: 'collDate', sortDirection: 'DESC' })
      );
    });

  });

  describe('Pagination', () => {

    it('should reset page index when retrieve is clicked', () => {
      component.filterForm.get('driveId')?.setValue('DRV001');
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 2;
      }
      component.onRetrieve();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('Side Panel State', () => {
    it('should initialize sidePanelOpen as false', () => {
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should initialize sidePanelMode as "add"', () => {
      expect(component.sidePanelMode).toBe('add');
    });


  });
  describe('maxDate', () => {
    it('should initialize maxDate from ChapterTimezoneService', () => {
      expect(component.maxDate).toBeDefined();
      expect(moment.isMoment(component.maxDate)).toBeTrue();
    });
  });

  describe('Future Date Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set futureDate error when Drive Date From is in the future', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      component.filterForm.get('driveDateFrom')?.setValue(futureDate);
      expect(component.filterForm.get('driveDateFrom')?.hasError('futureDate')).toBeTrue();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should set futureDate error when Drive Date To is in the future', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      component.filterForm.get('driveDateTo')?.setValue(futureDate);
      expect(component.filterForm.get('driveDateTo')?.hasError('futureDate')).toBeTrue();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should not set futureDate error for today or past dates', fakeAsync(() => {
      const pastDate = moment().subtract(1, 'day');
      component.filterForm.get('driveDateFrom')?.setValue(pastDate);
      expect(component.filterForm.get('driveDateFrom')?.hasError('futureDate')).toBeFalse();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should return futureDate error message from getFromDateError', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      const control = component.filterForm.get('driveDateFrom');
      control?.setValue(futureDate);
      control?.markAsTouched();
      expect(component.getFromDateError()).toBe('Drive Date From cannot be in the future');
      tick(600);
      discardPeriodicTasks();
    }));

    it('should return futureDate error message from getToDateError', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      const control = component.filterForm.get('driveDateTo');
      control?.setValue(futureDate);
      control?.markAsTouched();
      expect(component.getToDateError()).toBe('Drive Date To cannot be in the future');
      tick(600);
      discardPeriodicTasks();
    }));
  });

  describe('From-After-To Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set fromAfterTo error when from date is after to date', fakeAsync(() => {
      component.filterForm.get('driveDateTo')?.setValue(moment('2025-03-10'));
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-15'));
      expect(component.filterForm.get('driveDateFrom')?.hasError('fromAfterTo')).toBeTrue();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should not set fromAfterTo error when from date equals to date', fakeAsync(() => {
      const date = moment('2025-03-15');
      component.filterForm.get('driveDateFrom')?.setValue(date);
      component.filterForm.get('driveDateTo')?.setValue(date.clone());
      expect(component.filterForm.get('driveDateFrom')?.hasError('fromAfterTo')).toBeFalse();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should not set fromAfterTo error when from date is before to date', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-10'));
      component.filterForm.get('driveDateTo')?.setValue(moment('2025-03-15'));
      expect(component.filterForm.get('driveDateFrom')?.hasError('fromAfterTo')).toBeFalse();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should return fromAfterTo error message from getFromDateError', fakeAsync(() => {
      component.filterForm.get('driveDateTo')?.setValue(moment('2025-03-10'));
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-15'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();
      expect(component.getFromDateError()).toBe('Drive Date From cannot be after Drive Date To');
      tick(600);
      discardPeriodicTasks();
    }));
  });

  describe('Drive Date To Required Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set toDateRequired error when driveDateFrom is set but driveDateTo is empty', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-10'));
      expect(component.filterForm.get('driveDateTo')?.hasError('toDateRequired')).toBeTrue();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should not set toDateRequired error when both dates are set', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-10'));
      component.filterForm.get('driveDateTo')?.setValue(moment('2025-03-15'));
      expect(component.filterForm.get('driveDateTo')?.hasError('toDateRequired')).toBeFalse();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should clear toDateRequired error when driveDateFrom is cleared', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-10'));
      expect(component.filterForm.get('driveDateTo')?.hasError('toDateRequired')).toBeTrue();

      component.filterForm.get('driveDateFrom')?.setValue(null);
      expect(component.filterForm.get('driveDateTo')?.hasError('toDateRequired')).toBeFalse();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should return toDateRequired error message from getToDateError', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-10'));
      component.filterForm.get('driveDateTo')?.markAsTouched();
      expect(component.getToDateError()).toBe('Drive Date To is required when Drive Date From is entered');
      tick(600);
      discardPeriodicTasks();
    }));

    it('should disable retrieve when toDateRequired error exists', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-10'));
      expect(component.isRetrieveDisabled).toBeTrue();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should not set toDateRequired error when neither date is set', () => {
      expect(component.filterForm.get('driveDateTo')?.hasError('toDateRequired')).toBeFalse();
    });
  });

  describe('Searchable Dropdowns', () => {
    beforeEach(() => {
      mockQueryService.getDrivesLov.and.returnValue(of([
        { code: 'DRV001', description: 'DRV001 - Main Center' },
        { code: 'DRV002', description: 'DRV002 - West Branch' },
        { code: 'DRV003', description: 'DRV003 - East Campus' },
      ]));
      mockQueryService.getDeferralsLov.and.returnValue(of([
        { code: 'DEF001', description: 'DEF001' },
        { code: 'DEF002', description: 'DEF002' },
      ]));
      mockQueryService.getTransactionsLov.and.returnValue(of([
        { code: 'TR001', description: 'TR001 - 2025-01-10' },
        { code: 'TR002', description: 'TR002 - 2025-01-11' },
      ]));
      mockQueryService.getUsersLov.and.returnValue(of([
        { code: 'USER01', description: 'USER01 - John Smith' },
        { code: 'USER02', description: 'USER02 - Jane Doe' },
      ]));
      mockQueryService.getInterdictionCodesLov.and.returnValue(of([
        { code: 'DRDEF', description: 'Deferral Hold' },
        { code: 'DNHLD', description: 'Donation Hold' },
      ]));
      component.ngOnInit();
      // Manually set date-dependent LOVs since they no longer load on init
      component.deferralIds = [
        { code: 'DEF001', description: 'DEF001' },
        { code: 'DEF002', description: 'DEF002' },
      ];
      component.deferralIdsSignal.set(component.deferralIds);
      component.transactionIds = [
        { code: 'TR001', description: 'TR001 - 2025-01-10' },
        { code: 'TR002', description: 'TR002 - 2025-01-11' },
      ];
      component.transactionIdsSignal.set(component.transactionIds);
      component.users = [
        { code: 'USER01', description: 'USER01 - John Smith' },
        { code: 'USER02', description: 'USER02 - Jane Doe' },
      ];
      component.usersSignal.set(component.users);
    });

    it('should initialize filtered arrays after dropdown load', () => {
      expect(component.filteredDriveIds().length).toBe(3);
      expect(component.filteredDeferralIds().length).toBe(2);
      expect(component.filteredTransactionIds().length).toBe(2);
      expect(component.filteredUsers().length).toBe(2);
      expect(component.filteredInterdictionCodes().length).toBe(2);
    });











  });

  describe('Date-Dependent LOV Loading', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should load deferralIds, transactionIds, and users when both dates are valid', fakeAsync(() => {
      mockQueryService.getDrivesLov.calls.reset();
      mockQueryService.getDeferralsLov.calls.reset();
      mockQueryService.getTransactionsLov.calls.reset();
      mockQueryService.getUsersLov.calls.reset();

      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'));
      component.filterForm.get('driveDateTo')?.setValue(moment('2025-03-15'));
      component['reloadDateFilteredLovs']();

      expect(mockQueryService.getDeferralsLov).toHaveBeenCalled();
      expect(mockQueryService.getTransactionsLov).toHaveBeenCalled();
      expect(mockQueryService.getUsersLov).toHaveBeenCalled();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should load date-dependent LOVs when only fromDate is set', fakeAsync(() => {
      mockQueryService.getDrivesLov.calls.reset();
      mockQueryService.getDeferralsLov.calls.reset();
      mockQueryService.getTransactionsLov.calls.reset();
      mockQueryService.getUsersLov.calls.reset();

      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'));
      component['reloadDateFilteredLovs']();

      expect(mockQueryService.getDeferralsLov).toHaveBeenCalledWith('2025-03-01', undefined, undefined);
      expect(mockQueryService.getTransactionsLov).toHaveBeenCalledWith('2025-03-01', undefined, undefined);
      expect(mockQueryService.getUsersLov).toHaveBeenCalledWith('2025-03-01', undefined, undefined);
      expect(mockQueryService.getDrivesLov).toHaveBeenCalledWith('2025-03-01', undefined);
      tick(600);
      discardPeriodicTasks();
    }));

    it('should reload date-dependent LOVs when toDate is cleared but fromDate is still set', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'));
      component.filterForm.get('driveDateTo')?.setValue(moment('2025-03-15'));
      component['reloadDateFilteredLovs']();
      expect(component.deferralIds.length).toBe(1);

      component.filterForm.get('driveDateTo')?.setValue(null);
      mockQueryService.getDeferralsLov.calls.reset();
      component['reloadDateFilteredLovs']();

      expect(mockQueryService.getDeferralsLov).toHaveBeenCalledWith('2025-03-01', undefined, undefined);
      expect(component.deferralIds.length).toBe(1);
      tick(600);
      discardPeriodicTasks();
    }));

    it('should clear date-dependent LOVs when fromDate is cleared', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'));
      component['reloadDateFilteredLovs']();
      expect(component.deferralIds.length).toBe(1);

      component.filterForm.get('driveDateFrom')?.setValue(null);
      component['reloadDateFilteredLovs']();

      expect(component.deferralIds.length).toBe(0);
      expect(component.transactionIds.length).toBe(0);
      expect(component.users.length).toBe(0);
      expect(component.filterForm.get('deferralId')?.value).toBeNull();
      expect(component.filterForm.get('transactionId')?.value).toBeNull();
      expect(component.filterForm.get('userId')?.value).toBeNull();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should return false for areDateFiltersComplete when dates are incomplete', () => {
      expect(component.areDateFiltersComplete).toBeFalse();
    });

    it('should return true for areDateFiltersComplete when both dates are valid', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'));
      component.filterForm.get('driveDateTo')?.setValue(moment('2025-03-15'));
      expect(component.areDateFiltersComplete).toBeTrue();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should return false for areDateFiltersComplete when from is after to', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-15'));
      component.filterForm.get('driveDateTo')?.setValue(moment('2025-03-01'));
      expect(component.areDateFiltersComplete).toBeFalse();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should return true for areDateFiltersComplete when only fromDate is set', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'));
      expect(component.areDateFiltersComplete).toBeTrue();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should return false for areDateFiltersComplete when only toDate is set', fakeAsync(() => {
      component.filterForm.get('driveDateTo')?.setValue(moment('2025-03-15'));
      expect(component.areDateFiltersComplete).toBeFalse();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should clear transactions when driveId changes and dates are incomplete', () => {
      component.transactionIds = [{ code: 'TR001', description: 'Trans 1' }];
      component.transactionIdsSignal.set(component.transactionIds);

      component['reloadTransactionsLov']();

      expect(component.transactionIds.length).toBe(0);
      expect(component.filterForm.get('transactionId')?.value).toBeNull();
    });

    it('should reload transactions when driveId changes and only fromDate is set', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'));
      mockQueryService.getTransactionsLov.calls.reset();

      component['reloadTransactionsLov']();

      expect(mockQueryService.getTransactionsLov).toHaveBeenCalledWith('2025-03-01', undefined, undefined);
      tick(600);
      discardPeriodicTasks();
    }));

  });

  describe('onRowAction dispatch', () => {
    it('should call onDeferralEntry for deferral-entry action', () => {
      const row = mockSummaryData[0];
      spyOn<any>(component, 'onDeferralEntry');
      component.onRowAction({ action: 'deferral-entry', row } as any);
      expect(component['onDeferralEntry']).toHaveBeenCalledWith(row);
    });

    it('should call onHoldReason for hold-reason action', () => {
      const row = mockSummaryData[0];
      spyOn<any>(component, 'onHoldReason');
      component.onRowAction({ action: 'hold-reason', row } as any);
      expect(component['onHoldReason']).toHaveBeenCalledWith(row);
    });

    it('should call onAttachDonor for attach-donor action', () => {
      const row = mockSummaryData[0];
      spyOn<any>(component, 'onAttachDonor');
      component.onRowAction({ action: 'attach-donor', row } as any);
      expect(component['onAttachDonor']).toHaveBeenCalledWith(row);
    });

    it('should call onUpdateDeferral for update-deferral action', () => {
      const row = mockSummaryData[0];
      spyOn<any>(component, 'onUpdateDeferral');
      component.onRowAction({ action: 'update-deferral', row } as any);
      expect(component['onUpdateDeferral']).toHaveBeenCalledWith(row);
    });

    it('should call onUpdateAudit for update-audit action', () => {
      const row = mockSummaryData[0];
      spyOn<any>(component, 'onUpdateAudit');
      component.onRowAction({ action: 'update-audit', row } as any);
      expect(component['onUpdateAudit']).toHaveBeenCalledWith(row);
    });
  });

  describe('onDeferralEntry', () => {
    it('should open DeferralEntryDetailsDialog with donor data', () => {
      const row = mockSummaryData[0];
      component['onDeferralEntry'](row);
      expect(dialog.open).toHaveBeenCalledWith(DeferralEntryDetailsDialogComponent, jasmine.objectContaining({
        data: jasmine.objectContaining({ donorId: row.donorId })
      }));
    });

    it('should show error when donorId is missing', () => {
      const row = { ...mockSummaryData[0], donorId: '' };
      component['onDeferralEntry'](row);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Donor ID is required to view deferral entry details.');
    });
  });

  describe('onHoldReason', () => {
    it('should open HoldReasonDialog with row data', () => {
      const row = mockSummaryData[0];
      component['onHoldReason'](row);
      expect(dialog.open).toHaveBeenCalledWith(HoldReasonDialog, jasmine.objectContaining({
        data: jasmine.objectContaining({ deferralId: row.deferralId, donorId: row.donorId })
      }));
    });
  });

  describe('onAttachDonor', () => {
    it('should navigate to attach donor route', () => {
      const row = mockSummaryData[0];
      component['onAttachDonor'](row);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [ROUTE_REGISTRY[RouteKey.AttachDonor].path],
        jasmine.objectContaining({ state: jasmine.objectContaining({ fromDeferralsOnHoldQuery: true }) })
      );
    });
  });

  describe('onUpdateDeferral', () => {
    it('should navigate to update deferral route with deferralId', () => {
      const row = mockSummaryData[0];
      component['onUpdateDeferral'](row);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [ROUTE_REGISTRY[RouteKey.UpdateDeferral].path],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({ deferralId: row.deferralId }),
          state: jasmine.objectContaining({ fromDeferralsOnHoldQuery: true })
        })
      );
    });
  });

  describe('onUpdateAudit', () => {
    it('should navigate to audit drawer route with deferralId', () => {
      const row = mockSummaryData[0];
      component['onUpdateAudit'](row);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [ROUTE_REGISTRY[RouteKey.DonationDeferralAuditDrawer].path],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({ deferralId: row.deferralId })
        })
      );
    });

    it('should show error when deferralId is missing', () => {
      const row = { ...mockSummaryData[0], deferralId: '' };
      component['onUpdateAudit'](row);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Deferral ID is required to view audit details.');
    });
  });

  describe('onPageChange', () => {
    it('should update pagination and reload data', () => {
      mockQueryService.searchDeferralHolds.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100 } as any);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(mockQueryService.searchDeferralHolds).toHaveBeenCalled();
    });
  });

  describe('closeSidePanel', () => {
    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockSummaryData[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('onSortChange', () => {
    it('should update sort config and reload', () => {
      mockQueryService.searchDeferralHolds.calls.reset();
      component.onSortChange({ column: 'deferralId', direction: 'A' });
      expect(component.tableConfig.sortConfig?.column).toBe('deferralId');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(mockQueryService.searchDeferralHolds).toHaveBeenCalled();
    });
  });

  describe('onRetrieve scenarios', () => {
    it('should auto-set dates when only userId is set', () => {
      component.filterForm.get('userId')?.setValue('USER01');
      component.onRetrieve();
      expect(component.filterForm.get('driveDateFrom')?.value).toBeTruthy();
      expect(component.filterForm.get('driveDateTo')?.value).toBeTruthy();
    });

    it('should auto-set driveDateTo when only driveDateFrom is set', () => {
      const from = moment('2025-03-10');
      component.filterForm.get('driveDateFrom')?.setValue(from);
      component.onRetrieve();
      expect(component.filterForm.get('driveDateTo')?.value).toBeTruthy();
    });

    it('should not auto-set dates when driveId is set', () => {
      component.filterForm.get('driveId')?.setValue('DRV001');
      component.filterForm.get('driveDateFrom')?.setValue(null, { emitEvent: false });
      component.filterForm.get('driveDateTo')?.setValue(null, { emitEvent: false });
      component.onRetrieve();
      // Should not modify dates since driveId is a filter
      expect(mockQueryService.searchDeferralHolds).toHaveBeenCalled();
    });

    it('should include sort params with ASC direction', () => {
      component.tableConfig.sortConfig = { column: 'deferralId', direction: 'A' };
      component.onRetrieve();
      expect(mockQueryService.searchDeferralHolds).toHaveBeenCalledWith(
        25, 0, jasmine.objectContaining({ sortBy: 'deferralId', sortDirection: 'ASC' })
      );
    });
  });

  describe('onDateBlur and tryParseDDMMYYShorthand', () => {
    it('should parse 6-digit shorthand date', () => {
      const event = { target: { value: '100325' } } as any;
      component.onDateBlur(event, 'driveDateFrom');
      const val = component.filterForm.get('driveDateFrom')?.value;
      expect(val).toBeTruthy();
    });

    it('should not parse invalid 6-digit date', () => {
      const event = { target: { value: '999999' } } as any;
      component.onDateBlur(event, 'driveDateFrom');
      // Falls through to DateFieldValidationUtility.handleEndDateInput
    });

    it('should fall through for non-6-digit input', () => {
      const event = { target: { value: '10-MAR-2025' } } as any;
      component.onDateBlur(event, 'driveDateFrom');
    });
  });

  describe('onFromDateInput', () => {
    it('should handle from date input', () => {
      const event = { target: { value: '10-MAR-2025' } } as any;
      component.onFromDateInput(event);
    });
  });

  describe('onToDateInput', () => {
    it('should handle to date input', () => {
      const event = { target: { value: '15-MAR-2025' } } as any;
      component.onToDateInput(event);
    });
  });

  describe('loadData error responses', () => {
    it('should handle errorResponse.error format', () => {
      mockQueryService.searchDeferralHolds.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Custom error message' } }
      })));
      component.onRetrieve();
      expect(component.errorMessage).toBe('Custom error message');
    });

    it('should handle generic message format', () => {
      mockQueryService.searchDeferralHolds.and.returnValue(throwError(() => ({
        message: 'Generic error'
      })));
      component.onRetrieve();
      expect(component.errorMessage).toBe('Generic error');
    });
  });

  describe('formatDate', () => {
    it('should format valid date string', () => {
      const formatted = component['formatDate']('2025-01-10');
      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should return empty string for empty date', () => {
      const formatted = component['formatDate']('');
      expect(formatted).toBe('');
    });
  });

  describe('Collection Date column valueFormatter', () => {
    it('should format collection date via valueFormatter', () => {
      const collDateCol = component.tableConfig.columns.find(c => c.key === 'collDate');
      const formatted = collDateCol?.valueFormatter?.('2025-01-10', mockSummaryData[0]);
      expect(formatted).toBeTruthy();
    });
  });

  describe('Registration Date column valueFormatter', () => {
    it('should format datetime value', () => {
      const regCol = component.tableConfig.columns.find(c => c.key === 'dateTimeOfRegistration');
      const formatted = regCol?.valueFormatter?.('2025-01-11T09:05:00', mockSummaryData[0]);
      expect(formatted).toBeTruthy();
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

  describe('getFilterStateForUrl', () => {
    it('should include _fromChild flag', () => {
      const state = component['getFilterStateForUrl']();
      expect(state['_fromChild']).toBe('true');
    });

    it('should include all filter values', () => {
      component.filterForm.patchValue({
        driveDateFrom: moment('2025-03-01'),
        driveDateTo: moment('2025-03-15'),
        driveId: 'DRV001',
        batchId: 'BATCH01',
        deferralId: 'DEF001',
        transactionId: 'TR001',
        userId: 'USER01',
        interdictionCode: ['DRDEF', 'HOLD']
      });
      const state = component['getFilterStateForUrl']();
      expect(state['driveDateFrom']).toBe('2025-03-01');
      expect(state['driveDateTo']).toBe('2025-03-15');
      expect(state['driveId']).toBe('DRV001');
      expect(state['batchId']).toBe('BATCH01');
      expect(state['deferralId']).toBe('DEF001');
      expect(state['transactionId']).toBe('TR001');
      expect(state['userId']).toBe('USER01');
      expect(state['interdictionCode']).toBe('DRDEF,HOLD');
    });
  });

  describe('reloadDeferralsLov', () => {
    it('should clear deferrals when no date and no driveId', () => {
      component.deferralIds = [{ code: 'DEF001', description: 'DEF001' }];
      component['reloadDeferralsLov']();
      expect(component.deferralIds.length).toBe(0);
    });

    it('should load deferrals when driveId is set', fakeAsync(() => {
      component.filterForm.get('driveId')?.setValue('DRV001', { emitEvent: false });
      mockQueryService.getDeferralsLov.calls.reset();
      component['reloadDeferralsLov']();
      expect(mockQueryService.getDeferralsLov).toHaveBeenCalled();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should clear selected deferralId if not in new list', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'), { emitEvent: false });
      component.filterForm.get('deferralId')?.setValue('NONEXISTENT', { emitEvent: false });
      mockQueryService.getDeferralsLov.and.returnValue(of([{ code: 'DEF001', description: 'DEF001' }]));
      component['reloadDeferralsLov']();
      expect(component.filterForm.get('deferralId')?.value).toBeNull();
      tick(600);
      discardPeriodicTasks();
    }));
  });

  describe('reloadUsersLov', () => {
    it('should clear users when no date and no driveId', () => {
      component.users = [{ code: 'USER01', description: 'User 1' }];
      component['reloadUsersLov']();
      expect(component.users.length).toBe(0);
    });

    it('should load users when driveId is set', fakeAsync(() => {
      component.filterForm.get('driveId')?.setValue('DRV001', { emitEvent: false });
      mockQueryService.getUsersLov.calls.reset();
      component['reloadUsersLov']();
      expect(mockQueryService.getUsersLov).toHaveBeenCalled();
      tick(600);
      discardPeriodicTasks();
    }));

    it('should clear selected userId if not in new list', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'), { emitEvent: false });
      component.filterForm.get('userId')?.setValue('NONEXISTENT', { emitEvent: false });
      mockQueryService.getUsersLov.and.returnValue(of([{ code: 'USER01', description: 'User 1' }]));
      component['reloadUsersLov']();
      expect(component.filterForm.get('userId')?.value).toBeNull();
      tick(600);
      discardPeriodicTasks();
    }));
  });

  describe('reloadTransactionsLov with driveId', () => {
    it('should reload transactions when driveId is set without dates', fakeAsync(() => {
      component.filterForm.get('driveId')?.setValue('DRV001', { emitEvent: false });
      mockQueryService.getTransactionsLov.calls.reset();
      component['reloadTransactionsLov']();
      expect(mockQueryService.getTransactionsLov).toHaveBeenCalledWith(undefined, undefined, 'DRV001');
      tick(600);
      discardPeriodicTasks();
    }));

    it('should clear selected transactionId if not in new list', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2025-03-01'), { emitEvent: false });
      component.filterForm.get('transactionId')?.setValue('NONEXISTENT', { emitEvent: false });
      mockQueryService.getTransactionsLov.and.returnValue(of([{ code: 'TR001', description: 'Trans 1' }]));
      component['reloadTransactionsLov']();
      expect(component.filterForm.get('transactionId')?.value).toBeNull();
      tick(600);
      discardPeriodicTasks();
    }));
  });

  describe('computed filtered signals', () => {
    it('should filter batchIds by search', () => {
      component.batchIdsSignal.set([
        { code: 'BATCH01', description: 'Batch One' },
        { code: 'BATCH02', description: 'Batch Two' }
      ]);
      component.batchIdSearchControl.setValue('one');
      const filtered = component.filteredBatchIds();
      expect(filtered.length).toBe(1);
    });

    it('should return all batchIds when search is empty', () => {
      component.batchIdsSignal.set([
        { code: 'BATCH01', description: 'Batch One' },
        { code: 'BATCH02', description: 'Batch Two' }
      ]);
      component.batchIdSearchControl.setValue('');
      const filtered = component.filteredBatchIds();
      expect(filtered.length).toBe(2);
    });

    it('should filter interdiction codes by search', () => {
      component.interdictionCodesSignal.set([
        { code: 'DRDEF', description: 'Deferral Hold' },
        { code: 'DNHLD', description: 'Donation Hold' }
      ]);
      component.interdictionCodeSearchControl.setValue('deferral');
      const filtered = component.filteredInterdictionCodes();
      expect(filtered.length).toBe(1);
    });
  });

  describe('hasDateErrors', () => {
    it('should return false for non-existent control', () => {
      expect(component['hasDateErrors']('nonExistent')).toBeFalse();
    });

    it('should return true when control has matDatepickerParse error', () => {
      component.filterForm.get('driveDateFrom')?.setErrors({ matDatepickerParse: true });
      expect(component['hasDateErrors']('driveDateFrom')).toBeTrue();
    });

    it('should return true when control has invalidDate error', () => {
      component.filterForm.get('driveDateFrom')?.setErrors({ invalidDate: true });
      expect(component['hasDateErrors']('driveDateFrom')).toBeTrue();
    });
  });

  describe('isClearAllDisabled additional', () => {
    it('should be disabled when loading data', () => {
      component.isLoadingData = true;
      expect(component.isClearAllDisabled).toBeTrue();
    });

    it('should be enabled when data exists', () => {
      component.dataSource = mockSummaryData;
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should be enabled when hasSearched is true', () => {
      component.hasSearched = true;
      expect(component.isClearAllDisabled).toBeFalse();
    });
  });

  describe('getFromDateError additional', () => {
    it('should return empty when control not touched', () => {
      expect(component.getFromDateError()).toBe('');
    });

    it('should return invalid for matDatepickerParse error', () => {
      const ctrl = component.filterForm.get('driveDateFrom');
      ctrl?.setErrors({ matDatepickerParse: true });
      ctrl?.markAsTouched();
      expect(component.getFromDateError()).toBe('Drive Date From is invalid');
    });

    it('should return invalid for invalidDate error', () => {
      const ctrl = component.filterForm.get('driveDateFrom');
      ctrl?.setErrors({ invalidDate: true });
      ctrl?.markAsTouched();
      expect(component.getFromDateError()).toBe('Drive Date From is invalid');
    });
  });

  describe('getToDateError additional', () => {
    it('should return empty when control not touched', () => {
      expect(component.getToDateError()).toBe('');
    });

    it('should return invalid for invalidDate error', () => {
      const ctrl = component.filterForm.get('driveDateTo');
      ctrl?.setErrors({ invalidDate: true });
      ctrl?.markAsTouched();
      expect(component.getToDateError()).toBe('Drive Date To is invalid');
    });
  });
});
