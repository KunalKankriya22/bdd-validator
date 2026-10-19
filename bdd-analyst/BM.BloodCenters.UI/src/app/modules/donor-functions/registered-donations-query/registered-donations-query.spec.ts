import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import moment from 'moment';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { RegisteredDonationsQuery } from './registered-donations-query';
import { RegisteredDonationsQueryService } from './services/registered-donations-query.service';
import { RegisteredDonationsQueryStateService } from './services/registered-donations-query-state.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DonationEntryDetailsDialogComponent } from '@shared/components/donation-entry-details-dialog/donation-entry-details-dialog';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DonationDeferralAuditDrawerComponent } from '../registration/audit-donation/components/donation-deferral-audit-drawer/donation-deferral-audit-drawer';
import { HoldReasonDialogComponent } from '../registration/registration-queries/donations-on-hold-query/hold-reason-dialog/hold-reason-dialog';
import { PhlebotomyDetailsDialogComponent } from './phlebotomy-details-dialog/phlebotomy-details-dialog';
import { DonationQueryResult } from './models/registered-donations-query.model';
import { createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('RegisteredDonationsQuery', () => {
  let component: RegisteredDonationsQuery;
  let fixture: ComponentFixture<RegisteredDonationsQuery>;
  let mockService: jasmine.SpyObj<RegisteredDonationsQueryService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockStateService: jasmine.SpyObj<RegisteredDonationsQueryStateService>;
  let mockRouter: any;
  let chapterChanged$: Subject<void>;

  const mockDonationData: DonationQueryResult[] = [
    {
      unitId: 'W0352001234',
      setId: 'SET001',
      driveId: 'D001',
      collectionDate: '2026-01-15T00:00:00',
      donorId: 'DON001',
      donationType: 'WB',
      procedureCode: 'PROC1',
      insertUser: 'USER1',
      insertDate: '2026-01-15T10:30:00',
      auditFlag: 'Y',
      transactionId: 'TXN001'
    },
    {
      unitId: 'W0352005678',
      setId: 'SET002',
      driveId: 'D002',
      collectionDate: '2026-01-16T00:00:00',
      donorId: 'DON002',
      donationType: 'PLT',
      procedureCode: 'PROC2',
      insertUser: 'USER2',
      insertDate: '2026-01-16T14:00:00',
      auditFlag: null,
      transactionId: 'TXN002'
    }
  ];

  const mockDrives = [
    { driveId: 'D001', driveName: 'Drive One' },
    { driveId: 'D002', driveName: 'Drive Two' }
  ];

  const mockUsers = [
    { userId: 'USR1', userName: 'John Doe' },
    { userId: 'USR2', userName: 'Jane Smith' }
  ];

  const mockSets = [
    { setId: 'SET001', collectionDate: '2026-01-15' },
    { setId: 'SET002', collectionDate: '2026-01-16' }
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('RegisteredDonationsQueryService', [
      'searchDonations',
      'getDrivesDropdown',
      'getUsersDropdown',
      'getSetsDropdown',
      'getLovLimit'
    ]);

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({
        title: 'Registered Donations Query',
        subtitle: ''
      })
    });

    chapterChanged$ = new Subject<void>();

    mockHeaderService = createMockHeaderService({
      chapterChanged$: chapterChanged$.asObservable()
    });

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate'
    ]);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(
      moment('2026-04-30', 'YYYY-MM-DD')
    );

    mockDialog = createMockMatDialog();
    mockStateService = jasmine.createSpyObj('RegisteredDonationsQueryStateService', [
      'save',
      'restore',
      'hasSavedState',
    ]);
    mockStateService.restore.and.returnValue(null);
    mockStateService.hasSavedState.and.returnValue(false);

    mockRouter = {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
      getCurrentNavigation: jasmine.createSpy('getCurrentNavigation').and.returnValue(null),
      events: EMPTY,
      url: '/registered-donations-query',
    };

    mockService.getDrivesDropdown.and.returnValue(of({ data: [] }));
    mockService.getUsersDropdown.and.returnValue(of({ data: [] }));
    mockService.getSetsDropdown.and.returnValue(of({ data: [] }));
    mockService.getLovLimit.and.returnValue(of(21));

    TestBed.configureTestingModule({
      imports: [RegisteredDonationsQuery, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: RegisteredDonationsQueryService, useValue: mockService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: RegisteredDonationsQueryStateService, useValue: mockStateService },
        { provide: Router, useValue: mockRouter },
      ]
    });

    fixture = TestBed.createComponent(RegisteredDonationsQuery);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {

    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('driveDateFrom')).toBeDefined();
      expect(component.filterForm.get('driveDateTo')).toBeDefined();
      expect(component.filterForm.get('driveId')).toBeDefined();
      expect(component.filterForm.get('userId')).toBeDefined();
      expect(component.filterForm.get('setId')).toBeDefined();
    });

    it('should initialize form controls with null values', () => {
      expect(component.filterForm.get('driveDateFrom')?.value).toBeNull();
      expect(component.filterForm.get('driveDateTo')?.value).toBeNull();
      expect(component.filterForm.get('driveId')?.value).toBeNull();
      expect(component.filterForm.get('userId')?.value).toBeNull();
      expect(component.filterForm.get('setId')?.value).toBeNull();
    });



  });

  describe('Table Configuration', () => {




    it('should display Batch ID column in grid', () => {
      const batchIdColumn = component.tableConfig.columns.find(c => c.key === 'setId');
      expect(batchIdColumn).toBeTruthy();
      expect(batchIdColumn!.header).toBe('Batch ID');
      expect(batchIdColumn!.sortable).toBeTrue();
    });

    it('should have correct row action labels', () => {
      const labels = component.tableConfig.rowActions?.map(a => a.label);
      expect(labels).toEqual([
        'Entry Details', 'Audit Details', 'Phlebotomy Details', 'Hold Reason', 'Consents'
      ]);
    });

    it('should have actions shown as menu', () => {
      expect(component.tableConfig.showActionsAsMenu).toBeTrue();
    });

    it('should have row highlight disabled', () => {
      expect(component.tableConfig.enableRowHighlight).toBeFalse();
    });


  });

  describe('Value Formatters', () => {
    it('should return "--" for null unitId', () => {
      const formatter = component.tableConfig.columns[0].valueFormatter!;
      expect(formatter(null, {} as any)).toBe('--');
    });

    it('should return value for non-null unitId', () => {
      const formatter = component.tableConfig.columns[0].valueFormatter!;
      expect(formatter('W001', {} as any)).toBe('W001');
    });

    it('should return "--" for null setId', () => {
      const formatter = component.tableConfig.columns[1].valueFormatter!;
      expect(formatter(null, {} as any)).toBe('--');
    });

    it('should return value for non-null setId', () => {
      const formatter = component.tableConfig.columns[1].valueFormatter!;
      expect(formatter('SET001', {} as any)).toBe('SET001');
    });

    it('should return "--" for null collectionDate', () => {
      const formatter = component.tableConfig.columns[3].valueFormatter!;
      expect(formatter(null, {} as any)).toBe('--');
    });

    it('should format collectionDate with uppercase month', () => {
      const formatter = component.tableConfig.columns[3].valueFormatter!;
      const result = formatter('2026-01-15T12:00:00', {} as any);
      expect(result).toBe('15-JAN-2026');
    });

    it('should return "Yes" for auditFlag "Y"', () => {
      const formatter = component.tableConfig.columns[9].valueFormatter!;
      expect(formatter('Y', {} as any)).toBe('Yes');
    });

    it('should return "--" for auditFlag null', () => {
      const formatter = component.tableConfig.columns[9].valueFormatter!;
      expect(formatter(null, {} as any)).toBe('--');
    });

    it('should return "--" for auditFlag "N"', () => {
      const formatter = component.tableConfig.columns[9].valueFormatter!;
      expect(formatter('N', {} as any)).toBe('--');
    });

    it('should return "--" for null insertDate', () => {
      const formatter = component.tableConfig.columns[8].valueFormatter!;
      expect(formatter(null, {} as any)).toBe('--');
    });

    it('should format insertDate with uppercase month and AM/PM', () => {
      const formatter = component.tableConfig.columns[8].valueFormatter!;
      const result = formatter('2026-01-15T12:30:00', {} as any);
      expect(result).toBe('15-JAN-2026, 12:30 PM');
    });
  });

  describe('Dropdown Loading', () => {
    it('should populate drive options on successful load', () => {
      mockService.getDrivesDropdown.and.returnValue(of({ data: mockDrives }));
      component.ngOnInit();
      expect(component.driveOptions()).toEqual(mockDrives);
      expect(component.isLoadingDrives).toBeFalse();
    });

    it('should set empty drives on error', () => {
      mockService.getDrivesDropdown.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.driveOptions()).toEqual([]);
      expect(component.isLoadingDrives).toBeFalse();
    });

    it('should populate user options on successful load', () => {
      mockService.getUsersDropdown.and.returnValue(of({ data: mockUsers }));
      component.ngOnInit();
      expect(component.userOptions()).toEqual(mockUsers);
      expect(component.isLoadingUsers).toBeFalse();
    });

    it('should set empty users on error', () => {
      mockService.getUsersDropdown.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.userOptions()).toEqual([]);
      expect(component.isLoadingUsers).toBeFalse();
    });

    it('should load sets dropdown options', () => {
      mockService.getSetsDropdown.and.returnValue(of({ data: mockSets }));
      component.ngOnInit();
      expect(component.setOptions()).toEqual(mockSets);
      expect(component.isLoadingSets).toBeFalse();
    });

    it('should set empty sets on error', () => {
      mockService.getSetsDropdown.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.setOptions()).toEqual([]);
      expect(component.isLoadingSets).toBeFalse();
    });
  });

  describe('Dropdown Filtering (Computed Signals)', () => {
    it('should return all drives when search is empty', () => {
      component.driveOptions.set(mockDrives);
      component.driveSearch.set('');
      expect(component.filteredDrives()).toEqual(mockDrives);
    });



    it('should filter drives by driveName case-insensitively', () => {
      component.driveOptions.set([
        { driveId: 'DRV001', driveName: 'CREEK COMMUNITY' },
        { driveId: 'DRV002', driveName: 'DOWNTOWN CENTER' },
      ]);
      component.driveSearch.set('creek');
      expect(component.filteredDrives().length).toBe(1);
      expect(component.filteredDrives()[0].driveId).toBe('DRV001');
    });

    it('should return empty when no drives match', () => {
      component.driveOptions.set(mockDrives);
      component.driveSearch.set('NOMATCH');
      expect(component.filteredDrives().length).toBe(0);
    });

    it('should return all users when search is empty', () => {
      component.userOptions.set(mockUsers);
      component.userSearch.set('');
      expect(component.filteredUsers()).toEqual(mockUsers);
    });

    it('should filter users by userId', () => {
      component.userOptions.set(mockUsers);
      component.userSearch.set('USR1');
      expect(component.filteredUsers().length).toBe(1);
    });

    it('should filter users by userName case-insensitively', () => {
      component.userOptions.set([
        { userId: 'USR1', userName: 'Smith, John' },
        { userId: 'USR2', userName: 'Doe, Jane' },
      ]);
      component.userSearch.set('smith');
      expect(component.filteredUsers().length).toBe(1);
      expect(component.filteredUsers()[0].userId).toBe('USR1');
    });

    describe('filteredSets', () => {
      it('should return all sets when search is empty', () => {
        component.setOptions.set(mockSets);
        component.setSearch.set('');
        expect(component.filteredSets()).toEqual(mockSets);
      });

      it('should filter sets by setId', () => {
        component.setOptions.set(mockSets);
        component.setSearch.set('SET001');
        expect(component.filteredSets().length).toBe(1);
        expect(component.filteredSets()[0].setId).toBe('SET001');
      });

      it('should filter sets by collectionDate', () => {
        component.setOptions.set(mockSets);
        component.setSearch.set('2026-01-15');
        expect(component.filteredSets().length).toBe(1);
        expect(component.filteredSets()[0].setId).toBe('SET001');
      });
    });
  });

  describe('Date Validation', () => {
    it('should set futureDate error when From date is in the future', () => {
      const futureDate = moment('2027-06-01', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(futureDate);

      const fromControl = component.filterForm.get('driveDateFrom');
      expect(fromControl?.hasError('futureDate')).toBeTrue();
    });

    it('should set futureDate error when To date is in the future', () => {
      const futureDate = moment('2027-06-01', 'YYYY-MM-DD');
      component.filterForm.get('driveDateTo')?.setValue(futureDate);

      const toControl = component.filterForm.get('driveDateTo');
      expect(toControl?.hasError('futureDate')).toBeTrue();
    });

    it('should not set futureDate error for past dates', () => {
      const pastDate = moment('2025-01-01', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(pastDate);

      const fromControl = component.filterForm.get('driveDateFrom');
      expect(fromControl?.hasError('futureDate')).toBeFalse();
    });

    it('should set fromAfterTo error when From is after To', () => {
      const fromDate = moment('2026-03-15', 'YYYY-MM-DD');
      const toDate = moment('2026-03-01', 'YYYY-MM-DD');

      component.filterForm.get('driveDateTo')?.setValue(toDate, { emitEvent: false });
      component.filterForm.get('driveDateFrom')?.setValue(fromDate);

      const fromControl = component.filterForm.get('driveDateFrom');
      expect(fromControl?.hasError('fromAfterTo')).toBeTrue();
    });

    it('should not set fromAfterTo error when From equals To', () => {
      const date = moment('2026-03-15', 'YYYY-MM-DD');

      component.filterForm.get('driveDateTo')?.setValue(date.clone(), { emitEvent: false });
      component.filterForm.get('driveDateFrom')?.setValue(date.clone());

      const fromControl = component.filterForm.get('driveDateFrom');
      expect(fromControl?.hasError('fromAfterTo')).toBeFalse();
    });

    it('should not set fromAfterTo error when From is before To', () => {
      const fromDate = moment('2026-03-01', 'YYYY-MM-DD');
      const toDate = moment('2026-03-15', 'YYYY-MM-DD');

      component.filterForm.get('driveDateTo')?.setValue(toDate, { emitEvent: false });
      component.filterForm.get('driveDateFrom')?.setValue(fromDate);

      const fromControl = component.filterForm.get('driveDateFrom');
      expect(fromControl?.hasError('fromAfterTo')).toBeFalse();
    });

    it('should clear custom date errors when dates become valid', () => {
      const futureDate = moment('2027-06-01', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(futureDate);
      expect(component.filterForm.get('driveDateFrom')?.hasError('futureDate')).toBeTrue();

      const pastDate = moment('2025-01-01', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(pastDate);
      expect(component.filterForm.get('driveDateFrom')?.hasError('futureDate')).toBeFalse();
    });

    it('should preserve matDatepickerParse errors when clearing custom errors', () => {
      const fromControl = component.filterForm.get('driveDateFrom');
      fromControl?.setErrors({ matDatepickerParse: { text: 'invalid' } });

      component.filterForm.get('driveDateTo')?.setValue(null);

      expect(fromControl?.hasError('matDatepickerParse')).toBeTrue();
    });

    it('should skip validation when matDatepickerParse error exists', () => {
      const fromControl = component.filterForm.get('driveDateFrom');
      fromControl?.setErrors({ matDatepickerParse: { text: 'bad' } });
      fromControl?.setValue(moment('2027-06-01', 'YYYY-MM-DD'), { emitEvent: false });

      expect(fromControl?.hasError('futureDate')).toBeFalse();
    });
  });

  describe('No Auto-populate To Date', () => {
    it('should not auto-populate To date when From date is set', () => {
      const fromDate = moment('2026-03-15', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(fromDate);

      expect(component.filterForm.get('driveDateTo')?.value).toBeNull();
    });
  });

  describe('onFromDateInput / onToDateInput', () => {
    it('should call DateFieldValidationUtility for from date input', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const mockEvent = { target: { value: '15-JAN-2026' } } as unknown as Event;

      component.onFromDateInput(mockEvent);

      expect(spy).toHaveBeenCalledWith('15-JAN-2026', component.filterForm.get('driveDateFrom'));
    });

    it('should call DateFieldValidationUtility for to date input', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const mockEvent = { target: { value: '31-JAN-2026' } } as unknown as Event;

      component.onToDateInput(mockEvent);

      expect(spy).toHaveBeenCalledWith('31-JAN-2026', component.filterForm.get('driveDateTo'));
    });
  });

  describe('Date Change — Dropdown Refresh', () => {


    it('should reload dropdowns on date change', () => {
      mockService.getDrivesDropdown.calls.reset();
      mockService.getUsersDropdown.calls.reset();
      mockService.getSetsDropdown.calls.reset();

      const date = moment('2026-02-01', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(date);

      expect(mockService.getDrivesDropdown).toHaveBeenCalled();
      expect(mockService.getUsersDropdown).toHaveBeenCalled();
      expect(mockService.getSetsDropdown).toHaveBeenCalled();
    });

    it('should reload sets dropdown when date range changes', () => {
      mockService.getSetsDropdown.calls.reset();

      const fromDate = moment('2026-03-01', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(fromDate);

      expect(mockService.getSetsDropdown).toHaveBeenCalled();
    });

    it('should not reload dropdowns when dates have errors', () => {
      mockService.getDrivesDropdown.calls.reset();
      mockService.getUsersDropdown.calls.reset();
      mockService.getSetsDropdown.calls.reset();

      const futureDate = moment('2027-12-01', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(futureDate);

      expect(mockService.getDrivesDropdown).not.toHaveBeenCalled();
      expect(mockService.getUsersDropdown).not.toHaveBeenCalled();
      expect(mockService.getSetsDropdown).not.toHaveBeenCalled();
    });
  });

  describe('To Date without From Date — Error on dropdown open', () => {
    it('should not show error immediately when only To date is set', () => {
      const toDate = moment('2026-03-15', 'YYYY-MM-DD');
      component.filterForm.get('driveDateTo')?.setValue(toDate);

      expect(component.fromDateRequiredError).toBeFalse();
    });

    it('should show fromDateRequiredError when dropdown opens with only To date', () => {
      component.filterForm.patchValue({
        driveDateTo: moment('2026-03-15', 'YYYY-MM-DD')
      }, { emitEvent: false });

      component.onDropdownOpened(true);

      expect(component.fromDateRequiredError).toBeTrue();
    });

    it('should clear fromDateRequiredError when dropdown closes', () => {
      component.fromDateRequiredError = true;

      component.onDropdownOpened(false);

      expect(component.fromDateRequiredError).toBeFalse();
    });

    it('should not load dropdowns when only To date is set', () => {
      mockService.getDrivesDropdown.calls.reset();
      mockService.getUsersDropdown.calls.reset();
      mockService.getSetsDropdown.calls.reset();

      const toDate = moment('2026-03-15', 'YYYY-MM-DD');
      component.filterForm.get('driveDateTo')?.setValue(toDate);

      expect(mockService.getDrivesDropdown).not.toHaveBeenCalled();
      expect(mockService.getUsersDropdown).not.toHaveBeenCalled();
      expect(mockService.getSetsDropdown).not.toHaveBeenCalled();
    });

    it('should disable Retrieve when fromDateRequiredError is true', () => {
      component.fromDateRequiredError = true;

      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should clear fromDateRequiredError on clear all', () => {
      component.fromDateRequiredError = true;

      component.onClearAll();

      expect(component.fromDateRequiredError).toBeFalse();
    });
  });

  describe('Auto-populate To Date on dropdown open', () => {
    it('should set To date from From date when dropdown opens and To is empty', () => {
      const fromDate = moment('2026-03-15', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(fromDate, { emitEvent: false });

      component.onDropdownOpened(true);

      const toValue = component.filterForm.get('driveDateTo')?.value;
      expect(toValue).toBeTruthy();
      expect(toValue.format('YYYY-MM-DD')).toBe('2026-03-15');
    });

    it('should not overwrite existing To date when dropdown opens', () => {
      component.filterForm.patchValue({
        driveDateFrom: moment('2026-03-01', 'YYYY-MM-DD'),
        driveDateTo: moment('2026-03-20', 'YYYY-MM-DD')
      }, { emitEvent: false });

      component.onDropdownOpened(true);

      expect(component.filterForm.get('driveDateTo')?.value.format('YYYY-MM-DD')).toBe('2026-03-20');
    });

    it('should not set To date when From is also empty', () => {
      component.onDropdownOpened(true);

      expect(component.filterForm.get('driveDateTo')?.value).toBeNull();
    });

    it('should not trigger on dropdown close', () => {
      const fromDate = moment('2026-03-15', 'YYYY-MM-DD');
      component.filterForm.get('driveDateFrom')?.setValue(fromDate, { emitEvent: false });

      component.onDropdownOpened(false);

      expect(component.filterForm.get('driveDateTo')?.value).toBeNull();
    });
  });

  describe('onRetrieve', () => {
    it('should set hasRetrievedData and hide empty state', () => {
      mockService.searchDonations.and.returnValue(
        of({ data: mockDonationData, totalRecords: 2 })
      );

      component.onRetrieve();

      expect(component.showEmptyState).toBeFalse();
      expect(component.hasRetrievedData).toBeTrue();
    });

    it('should call service with correct request params', () => {
      mockService.searchDonations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.filterForm.patchValue({ driveId: 'D001', userId: 'USR1' }, { emitEvent: false });
      component.onRetrieve();

      const callArgs = mockService.searchDonations.calls.mostRecent().args[0];
      expect(callArgs.driveId).toBe('D001');
      expect(callArgs.userId).toBe('USR1');
      expect(callArgs.sortDirection).toBe('ASC');
    });

    it('should include setId in search request when set is selected', () => {
      mockService.searchDonations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.filterForm.patchValue({ setId: 'SET001' }, { emitEvent: false });
      component.onRetrieve();

      const callArgs = mockService.searchDonations.calls.mostRecent().args[0];
      expect(callArgs.setId).toBe('SET001');
    });


    it('should populate data on success', () => {
      mockService.searchDonations.and.returnValue(
        of({ data: mockDonationData, totalRecords: 2 })
      );

      component.onRetrieve();

      expect(component.allData).toEqual(mockDonationData);
      expect(component.dataSource.length).toBe(2);
      expect(component.totalFound).toBe(2);
      expect(component.isLoadingData).toBeFalse();
    });

    it('should clear data on error', () => {
      mockService.searchDonations.and.returnValue(throwError(() => new Error('API fail')));

      component.onRetrieve();

      expect(component.allData).toEqual([]);
      expect(component.dataSource).toEqual([]);
      expect(component.totalFound).toBe(0);
      expect(component.isLoadingData).toBeFalse();
    });

    it('should auto-populate dates and send null for other empty fields', () => {
      mockService.searchDonations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onRetrieve();

      const callArgs = mockService.searchDonations.calls.mostRecent().args[0];
      expect(callArgs.driveDateFrom).toBeTruthy();
      expect(callArgs.driveDateTo).toBeTruthy();
      expect(callArgs.driveId).toBeNull();
      expect(callArgs.userId).toBeNull();
      expect(callArgs.unitId).toBeNull();
      expect(callArgs.setId).toBeNull();
    });
  });

  describe('onClearAll', () => {

    it('should clear data', () => {
      component.allData = mockDonationData;
      component.dataSource = [...mockDonationData];
      component.totalFound = 2;

      component.onClearAll();

      expect(component.allData).toEqual([]);
      expect(component.dataSource).toEqual([]);
      expect(component.totalFound).toBe(0);
    });


    it('should reset display state', () => {
      component.showEmptyState = false;
      component.hasRetrievedData = true;

      component.onClearAll();

      expect(component.showEmptyState).toBeTrue();
      expect(component.hasRetrievedData).toBeFalse();
    });



    it('should clear setId when CLEAR ALL is clicked', () => {
      component.filterForm.get('setId')?.setValue('SET001', { emitEvent: false });
      component.setOptions.set(mockSets);

      component.onClearAll();

      expect(component.filterForm.get('setId')?.value).toBeNull();
      expect(component.setOptions()).toEqual([]);
    });

    it('should reset truncation flags', () => {
      component.isDriveTruncated = true;
      component.isUserTruncated = true;
      component.isSetTruncated = true;

      component.onClearAll();

      expect(component.isDriveTruncated).toBeFalse();
      expect(component.isUserTruncated).toBeFalse();
      expect(component.isSetTruncated).toBeFalse();
    });
  });

  describe('onSortChange', () => {

    it('should sort data locally without calling API', () => {
      component.allData = [...mockDonationData];
      component.dataSource = [...mockDonationData];

      component.onSortChange({ column: 'unitId', direction: 'A' });

      expect(mockService.searchDonations).not.toHaveBeenCalled();
      expect(component.dataSource[0].unitId).toBe('W0352001234');
      expect(component.dataSource[1].unitId).toBe('W0352005678');
    });


    it('should sort by driveId column', () => {
      component.allData = [...mockDonationData];
      component.dataSource = [...mockDonationData];

      component.onSortChange({ column: 'driveId', direction: 'D' });

      expect(component.currentSortColumn).toBe('driveId');
      expect(component.currentSortDirection).toBe('D');
      expect(component.dataSource[0].driveId).toBe('D002');
      expect(component.dataSource[1].driveId).toBe('D001');
    });

    it('should sort by collectionDate column as date', () => {
      component.allData = [...mockDonationData];
      component.dataSource = [...mockDonationData];

      component.onSortChange({ column: 'collectionDate', direction: 'D' });

      expect(component.currentSortColumn).toBe('collectionDate');
      expect(component.dataSource[0].collectionDate).toBe('2026-01-16T00:00:00');
      expect(component.dataSource[1].collectionDate).toBe('2026-01-15T00:00:00');
    });

    it('should sort by insertDate column as date', () => {
      component.allData = [...mockDonationData];
      component.dataSource = [...mockDonationData];

      component.onSortChange({ column: 'insertDate', direction: 'A' });

      expect(component.currentSortColumn).toBe('insertDate');
      expect(component.dataSource[0].insertDate).toBe('2026-01-15T10:30:00');
      expect(component.dataSource[1].insertDate).toBe('2026-01-16T14:00:00');
    });

    it('should handle null values by sorting them to the end', () => {
      const dataWithNull: DonationQueryResult[] = [
        { ...mockDonationData[0], auditFlag: null },
        { ...mockDonationData[1], auditFlag: 'Y' }
      ];
      component.allData = dataWithNull;
      component.dataSource = [...dataWithNull];

      component.onSortChange({ column: 'auditFlag', direction: 'A' });

      expect(component.dataSource[0].auditFlag).toBe('Y');
      expect(component.dataSource[1].auditFlag).toBeNull();
    });

    it('should default to ascending when direction is undefined', () => {
      component.allData = [...mockDonationData];
      component.dataSource = [...mockDonationData];

      component.onSortChange({ column: 'unitId', direction: undefined as any });

      expect(component.currentSortDirection).toBe('A');
    });
  });

  describe('onRowAction', () => {
    let afterClosedSubject: Subject<void>;

    beforeEach(() => {
      afterClosedSubject = new Subject<void>();
      mockDialog.open.and.returnValue({
        afterClosed: () => afterClosedSubject.asObservable()
      } as MatDialogRef<any>);
    });

    it('should set isDialogOpen to true when entry details is clicked', () => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'entryDetails', row });

      expect(component.isDialogOpen).toBeTrue();
    });

    it('should set activeRow via setTimeout on entry details click', fakeAsync(() => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'entryDetails', row });
      tick();

      expect(component.dataTableComponent.activeRow).toBe(row);
    }));

    it('should clear activeRow and isDialogOpen when dialog closes', fakeAsync(() => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'entryDetails', row });
      tick();
      expect(component.dataTableComponent.activeRow).toBe(row);
      expect(component.isDialogOpen).toBeTrue();

      afterClosedSubject.next();
      afterClosedSubject.complete();

      expect(component.isDialogOpen).toBeFalse();
      expect(component.dataTableComponent.activeRow).toBeNull();
    }));

    it('should not throw when dataTableComponent is not set', () => {
      component.dataTableComponent = undefined as any;

      expect(() => {
        component.onRowAction({ action: 'entryDetails', row: mockDonationData[0] });
      }).not.toThrow();
    });


    it('should not open dialog when unitId is null', () => {
      const row: DonationQueryResult = { ...mockDonationData[0], unitId: null };
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'entryDetails', row });

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(component.isDialogOpen).toBeFalse();
    });



    it('should not open audit drawer when transactionId is null', () => {
      const row: DonationQueryResult = { ...mockDonationData[0], transactionId: null };
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'auditDetails', row });

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(component.isDialogOpen).toBeFalse();
    });

    it('should set activeRow via setTimeout on audit details click', fakeAsync(() => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'auditDetails', row });
      tick();

      expect(component.dataTableComponent.activeRow).toBe(row);
    }));

    it('should clear activeRow and isDialogOpen when audit drawer closes', fakeAsync(() => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'auditDetails', row });
      tick();
      expect(component.isDialogOpen).toBeTrue();

      afterClosedSubject.next();
      afterClosedSubject.complete();

      expect(component.isDialogOpen).toBeFalse();
      expect(component.dataTableComponent.activeRow).toBeNull();
    }));

    it('should pass correct dialog config', () => {
      const row = mockDonationData[1];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'entryDetails', row });

      expect(mockDialog.open).toHaveBeenCalledWith(
        DonationEntryDetailsDialogComponent,
        jasmine.objectContaining({
          data: { unitId: 'W0352005678', collDate: '2026-01-16T00:00:00' },
          maxWidth: '100vw',
          disableClose: false,
          panelClass: 'code-dialog-panel-right',
          position: { right: '0', top: '64px' },
          hasBackdrop: true,
          backdropClass: 'code-dialog-backdrop',
        })
      );
    });


    it('should not open hold reason dialog when transactionId is null', () => {
      const row: DonationQueryResult = { ...mockDonationData[0], transactionId: null };
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'holdReason', row });

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(component.isDialogOpen).toBeFalse();
    });

    it('should set activeRow via setTimeout on hold reason click', fakeAsync(() => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'holdReason', row });
      tick();

      expect(component.dataTableComponent.activeRow).toBe(row);
    }));

    it('should clear activeRow and isDialogOpen when hold reason dialog closes', fakeAsync(() => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'holdReason', row });
      tick();
      expect(component.isDialogOpen).toBeTrue();

      afterClosedSubject.next();
      afterClosedSubject.complete();

      expect(component.isDialogOpen).toBeFalse();
      expect(component.dataTableComponent.activeRow).toBeNull();
    }));

    it('should pass empty strings for nullable fields in hold reason data', () => {
      const row: DonationQueryResult = {
        ...mockDonationData[0],
        unitId: null,
        collectionDate: null,
        donorId: null,
        transactionId: 'TXN001',
      };
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'holdReason', row });

      expect(mockDialog.open).toHaveBeenCalledWith(
        HoldReasonDialogComponent,
        jasmine.objectContaining({
          data: {
            unitId: '',
            collDate: '',
            donorId: '',
            donorName: '',
            transactionId: 'TXN001',
          },
        })
      );
    });


    it('should skip phlebotomy details when transactionId is null', () => {
      const row: DonationQueryResult = { ...mockDonationData[0], transactionId: null };
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'phlebotomyDetails', row });

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(component.isDialogOpen).toBeFalse();
    });

    it('should set activeRow via setTimeout on phlebotomy details click', fakeAsync(() => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'phlebotomyDetails', row });
      tick();

      expect(component.dataTableComponent.activeRow).toBe(row);
    }));

    it('should clear activeRow and isDialogOpen when phlebotomy details dialog closes', fakeAsync(() => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'phlebotomyDetails', row });
      tick();
      expect(component.isDialogOpen).toBeTrue();

      afterClosedSubject.next();
      afterClosedSubject.complete();

      expect(component.isDialogOpen).toBeFalse();
      expect(component.dataTableComponent.activeRow).toBeNull();
    }));

    it('should not navigate to consents when donorId is null', () => {
      const row: DonationQueryResult = { ...mockDonationData[0], donorId: null };
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'consents', row });

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });
  describe('Chapter Changes', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should clear all state when chapter changes', () => {
      component.allData = mockDonationData;
      component.dataSource = [...mockDonationData];
      component.totalFound = 2;
      component.hasRetrievedData = true;
      component.showEmptyState = false;
      component.driveOptions.set(mockDrives);
      component.userOptions.set(mockUsers);

      chapterChanged$.next();

      expect(component.allData).toEqual([]);
      expect(component.dataSource).toEqual([]);
      expect(component.totalFound).toBe(0);
      expect(component.hasRetrievedData).toBeFalse();
      expect(component.showEmptyState).toBeTrue();
    });

    it('should reload dropdowns and LOV limit when chapter changes', () => {
      mockService.getDrivesDropdown.calls.reset();
      mockService.getUsersDropdown.calls.reset();
      mockService.getSetsDropdown.calls.reset();
      mockService.getLovLimit.calls.reset();

      chapterChanged$.next();

      expect(mockService.getDrivesDropdown).toHaveBeenCalled();
      expect(mockService.getUsersDropdown).toHaveBeenCalled();
      expect(mockService.getSetsDropdown).toHaveBeenCalled();
      expect(mockService.getLovLimit).toHaveBeenCalled();
    });


  });

  describe('Dropdown Tooltip Display', () => {
    describe('selectedDriveDisplay', () => {

      it('should return driveId with driveName when both exist', () => {
        component.driveOptions.set(mockDrives);
        component.filterForm.get('driveId')?.setValue('D001');
        expect(component.selectedDriveDisplay()).toBe('D001 - Drive One');
      });

      it('should return only driveId when driveName is empty', () => {
        component.driveOptions.set([{ driveId: 'D003', driveName: '' }]);
        component.filterForm.get('driveId')?.setValue('D003');
        expect(component.selectedDriveDisplay()).toBe('D003');
      });

      it('should return selectedId when drive is not found in options', () => {
        component.driveOptions.set([]);
        component.filterForm.get('driveId')?.setValue('UNKNOWN');
        expect(component.selectedDriveDisplay()).toBe('UNKNOWN');
      });
    });

    describe('selectedUserDisplay', () => {

      it('should return userId with userName when both exist', () => {
        component.userOptions.set(mockUsers);
        component.filterForm.get('userId')?.setValue('USR1');
        expect(component.selectedUserDisplay()).toBe('USR1 - John Doe');
      });

      it('should return only userId when userName is empty', () => {
        component.userOptions.set([{ userId: 'USR3', userName: '' }]);
        component.filterForm.get('userId')?.setValue('USR3');
        expect(component.selectedUserDisplay()).toBe('USR3');
      });

      it('should return selectedId when user is not found in options', () => {
        component.userOptions.set([]);
        component.filterForm.get('userId')?.setValue('UNKNOWN');
        expect(component.selectedUserDisplay()).toBe('UNKNOWN');
      });
    });

    describe('checkDriveTruncation', () => {
      it('should set isDriveTruncated to true when text is truncated', () => {
        const el = { scrollWidth: 250, clientWidth: 200 } as HTMLElement;
        component.checkDriveTruncation(el);
        expect(component.isDriveTruncated).toBeTrue();
      });

      it('should set isDriveTruncated to false when text fits', () => {
        const el = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
        component.checkDriveTruncation(el);
        expect(component.isDriveTruncated).toBeFalse();
      });

      it('should set isDriveTruncated to false when widths are equal', () => {
        const el = { scrollWidth: 200, clientWidth: 200 } as HTMLElement;
        component.checkDriveTruncation(el);
        expect(component.isDriveTruncated).toBeFalse();
      });
    });

    describe('checkUserTruncation', () => {
      it('should set isUserTruncated to true when text is truncated', () => {
        const el = { scrollWidth: 250, clientWidth: 200 } as HTMLElement;
        component.checkUserTruncation(el);
        expect(component.isUserTruncated).toBeTrue();
      });

      it('should set isUserTruncated to false when text fits', () => {
        const el = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
        component.checkUserTruncation(el);
        expect(component.isUserTruncated).toBeFalse();
      });
    });

    describe('selectedSetDisplay', () => {
      it('should display setId with collectionDate for selectedSetDisplay', () => {
        component.setOptions.set(mockSets);
        component.filterForm.get('setId')?.setValue('SET001');
        expect(component.selectedSetDisplay()).toBe('SET001 - 2026-01-15');
      });

      it('should display only setId when collectionDate is empty', () => {
        component.setOptions.set([{ setId: 'SET003', collectionDate: '' }]);
        component.filterForm.get('setId')?.setValue('SET003');
        expect(component.selectedSetDisplay()).toBe('SET003');
      });

      it('should return raw selectedId when set not found in options', () => {
        component.setOptions.set([]);
        component.filterForm.get('setId')?.setValue('UNKNOWN');
        expect(component.selectedSetDisplay()).toBe('UNKNOWN');
      });
    });

    describe('checkSetTruncation', () => {
      it('should set isSetTruncated to true when text overflows', () => {
        const el = { scrollWidth: 250, clientWidth: 200 } as HTMLElement;
        component.checkSetTruncation(el);
        expect(component.isSetTruncated).toBeTrue();
      });

      it('should set isSetTruncated to false when text fits', () => {
        const el = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
        component.checkSetTruncation(el);
        expect(component.isSetTruncated).toBeFalse();
      });
    });

    it('should initialize truncation flags as false', () => {
      expect(component.isDriveTruncated).toBeFalse();
      expect(component.isUserTruncated).toBeFalse();
    });
  });

  describe('isClearAllDisabled', () => {

    it('should be enabled when a date is set', () => {
      component.filterForm.get('driveDateFrom')?.setValue(moment('2026-03-15', 'YYYY-MM-DD'), { emitEvent: false });
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should be enabled when a dropdown is selected', () => {
      component.filterForm.get('driveId')?.setValue('D001', { emitEvent: false });
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should become disabled after clearing all', () => {
      component.filterForm.get('driveId')?.setValue('D001', { emitEvent: false });
      expect(component.isClearAllDisabled).toBeFalse();

      component.onClearAll();
      expect(component.isClearAllDisabled).toBeTrue();
    });
  });

  describe('isRetrieveDisabled', () => {
    it('should be true when isLoadingData is true', () => {
      component.isLoadingData = true;
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be true when filterForm has errors', () => {
      component.filterForm.get('driveDateFrom')?.setErrors({ futureDate: true });
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be true when fromDateRequiredError is true', () => {
      component.fromDateRequiredError = true;
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be true when unit validation state is validating', () => {
      component.unitIdField = { validationState: 'validating' } as any;
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be false when all conditions are met', () => {
      component.isLoadingData = false;
      component.fromDateRequiredError = false;
      component.unitIdField = { validationState: 'idle' } as any;
      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  describe('applyDefaultDatesIfEmpty', () => {
    it('should auto-populate dates when all filters are empty on retrieve', () => {
      mockService.searchDonations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onRetrieve();

      const from = component.filterForm.get('driveDateFrom')?.value;
      const to = component.filterForm.get('driveDateTo')?.value;
      expect(from).toBeTruthy();
      expect(to).toBeTruthy();
      expect(to.format('YYYY-MM-DD')).toBe('2026-04-30');
      expect(from.format('YYYY-MM-DD')).toBe(
        moment('2026-04-30', 'YYYY-MM-DD').subtract(21, 'days').format('YYYY-MM-DD')
      );
    });

    it('should not auto-populate dates when a filter has value', () => {
      mockService.searchDonations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.filterForm.get('driveId')?.setValue('D001', { emitEvent: false });
      component.onRetrieve();

      expect(component.filterForm.get('driveDateFrom')?.value).toBeNull();
      expect(component.filterForm.get('driveDateTo')?.value).toBeNull();
    });

    it('should use lovLimit from API for default retrieve', () => {
      mockService.getLovLimit.and.returnValue(of(15));
      component.ngOnInit();

      mockService.searchDonations.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      component.onRetrieve();

      const from = component.filterForm.get('driveDateFrom')?.value;
      const to = component.filterForm.get('driveDateTo')?.value;
      expect(from.format('YYYY-MM-DD')).toBe(
        moment('2026-04-30', 'YYYY-MM-DD').subtract(15, 'days').format('YYYY-MM-DD')
      );
      expect(to.format('YYYY-MM-DD')).toBe('2026-04-30');
    });

  });
  describe('State Preservation', () => {
    beforeEach(() => {
      const afterClosedSubject = new Subject<void>();
      mockDialog.open.and.returnValue({
        afterClosed: () => afterClosedSubject.asObservable(),
      } as MatDialogRef<any>);
    });

    it('should save state before navigating to consents', () => {
      const row = mockDonationData[0];
      component.dataTableComponent = { activeRow: null } as any;
      component.allData = [...mockDonationData];
      component.dataSource = [...mockDonationData];
      component.totalFound = 2;
      component.hasRetrievedData = true;
      component.showEmptyState = false;

      component.onRowAction({ action: 'consents', row });

      expect(mockStateService.save).toHaveBeenCalledWith(
        jasmine.objectContaining({
          allData: mockDonationData,
          totalFound: 2,
          hasRetrievedData: true,
          showEmptyState: false,
        })
      );
    });



    it('should restore state on init when saved state exists', () => {
      const savedState = {
        filterFormValues: {
          driveDateFrom: moment('2026-03-01', 'YYYY-MM-DD'),
          driveDateTo: moment('2026-03-31', 'YYYY-MM-DD'),
          driveId: 'D001',
          userId: 'USR1',
          setId: 'SET001',
        },
        unitIdRaw: '',
        allData: mockDonationData,
        dataSource: [...mockDonationData],
        totalFound: 2,
        hasRetrievedData: true,
        showEmptyState: false,
        currentSortColumn: 'driveId',
        currentSortDirection: 'D' as const,
        driveOptions: mockDrives,
        userOptions: mockUsers,
        setOptions: mockSets,
      };
      mockStateService.restore.and.returnValue(savedState);

      component.ngOnInit();

      expect(component.allData).toEqual(mockDonationData);
      expect(component.dataSource).toEqual(mockDonationData);
      expect(component.totalFound).toBe(2);
      expect(component.hasRetrievedData).toBeTrue();
      expect(component.showEmptyState).toBeFalse();
      expect(component.currentSortColumn).toBe('driveId');
      expect(component.currentSortDirection).toBe('D');
      expect(component.driveOptions()).toEqual(mockDrives);
      expect(component.userOptions()).toEqual(mockUsers);
      expect(component.setOptions()).toEqual(mockSets);
      expect(component.filterForm.get('driveId')?.value).toBe('D001');
      expect(component.filterForm.get('userId')?.value).toBe('USR1');
      expect(component.filterForm.get('setId')?.value).toBe('SET001');
    });

    it('should not load dropdowns when restoring saved state', () => {
      const savedState = {
        filterFormValues: {
          driveDateFrom: null,
          driveDateTo: null,
          driveId: null,
          userId: null,
          setId: null,
        },
        unitIdRaw: '',
        allData: [],
        dataSource: [],
        totalFound: 0,
        hasRetrievedData: false,
        showEmptyState: true,
        currentSortColumn: 'unitId',
        currentSortDirection: 'A' as const,
        driveOptions: [],
        userOptions: [],
        setOptions: [],
      };
      mockStateService.restore.and.returnValue(savedState);
      mockService.getDrivesDropdown.calls.reset();
      mockService.getUsersDropdown.calls.reset();
      mockService.getSetsDropdown.calls.reset();

      component.ngOnInit();

      expect(mockService.getDrivesDropdown).not.toHaveBeenCalled();
      expect(mockService.getUsersDropdown).not.toHaveBeenCalled();
      expect(mockService.getSetsDropdown).not.toHaveBeenCalled();
    });

    it('should load dropdowns normally when no saved state', () => {
      mockStateService.restore.and.returnValue(null);
      mockService.getDrivesDropdown.calls.reset();
      mockService.getUsersDropdown.calls.reset();
      mockService.getSetsDropdown.calls.reset();

      component.ngOnInit();

      expect(mockService.getDrivesDropdown).toHaveBeenCalled();
      expect(mockService.getUsersDropdown).toHaveBeenCalled();
      expect(mockService.getSetsDropdown).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should restore unit ID when pendingUnitIdRestore is set', () => {
      (component as any).pendingUnitIdRestore = 'UNIT123';
      const setValueSpy = jasmine.createSpy('setValue');
      component.unitIdField = {
        unitIdControl: { setValue: setValueSpy }
      } as any;

      component.ngAfterViewInit();

      expect(setValueSpy).toHaveBeenCalledWith('UNIT123', { emitEvent: false });
      expect((component as any).pendingUnitIdRestore).toBe('');
    });

    it('should not set unit ID when no pending restore', () => {
      (component as any).pendingUnitIdRestore = '';
      const setValueSpy = jasmine.createSpy('setValue');
      component.unitIdField = {
        unitIdControl: { setValue: setValueSpy }
      } as any;

      component.ngAfterViewInit();

      expect(setValueSpy).not.toHaveBeenCalled();
    });
  });
});
