import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import moment from 'moment';

import { DonationsOnHoldQueryComponent } from './donations-on-hold-query';
import { DonationsOnHoldQueryService } from './services/donations-on-hold-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  DonationOnHold,
  DonationsOnHoldLookups,
} from './models/donations-on-hold-query.model';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DonationsOnHoldQueryComponent', () => {
  let component: DonationsOnHoldQueryComponent;
  let fixture: ComponentFixture<DonationsOnHoldQueryComponent>;
  let mockService: jasmine.SpyObj<DonationsOnHoldQueryService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const mockLookups: DonationsOnHoldLookups = {
    showTerms: [
      { code: 'N', description: 'No' },
      { code: 'Y', description: 'Yes' },
    ],
    drives: [{ code: 'DRV001', description: 'Drive 001' }],
    users: [{ code: 'USR001', description: 'User 001' }],
    donationTypes: [
      { code: 'WB', description: 'Whole Blood' },
      { code: 'AL', description: 'Allogeneic' },
    ],
    procedureCodes: [{ code: 'PC01', description: 'Procedure 01' }],
    holds: [{ code: 'H1', description: 'Hold Type 1' }],
  };

  const mockDonationsOnHold: DonationOnHold[] = [
    {
      unitId: 'W633317102804',
      displayUnitId: 'W633317102804-L',
      driveId: 'DRV0164777',
      collDate: '2025-01-11',
      donorId: 'DN30120470',
      donationType: 'AL',
      procedureCode: 'WB',
      insertUser: 'CELHUN',
      insertDate: '2025-01-11T09:05:00',
      auditFlag: '--',
      transactionId: 'TXN001',
    },
    {
      unitId: 'W633317102805',
      displayUnitId: 'W633317102805-K',
      driveId: 'DRV0164778',
      collDate: '2025-01-12',
      donorId: 'DN30120471',
      donationType: 'AL',
      procedureCode: 'WB',
      insertUser: 'CYNCUL',
      insertDate: '2025-01-12T10:15:00',
      auditFlag: '--',
      transactionId: 'TXN002',
    },
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('DonationsOnHoldQueryService', [
      'getLookups',
      'search',
      'getDonationHolds',
      'getDonorHolds',
      'getDrivesLookup',
      'getUsersLookup',
    ]);

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });

    mockHeaderService = createMockHeaderService();
    mockSnackbarService = createMockSnackbarService();
    mockService.getLookups.and.returnValue(of(mockLookups));
    mockService.search.and.returnValue(of({ data: mockDonationsOnHold, total: 20 }));
    mockService.getDrivesLookup.and.returnValue(of(mockLookups.drives));
    mockService.getUsersLookup.and.returnValue(of(mockLookups.users));



      TestBed.configureTestingModule({
      imports: [DonationsOnHoldQueryComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: DonationsOnHoldQueryService, useValue: mockService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
      ],
    });

      mockService.getLookups.and.returnValue(of(mockLookups));


      mockService.search.and.returnValue(of({ data: mockDonationsOnHold, total: 20 }));


      mockService.getDrivesLookup.and.returnValue(of(mockLookups.drives));


      mockService.getUsersLookup.and.returnValue(of(mockLookups.users));


    fixture = TestBed.createComponent(DonationsOnHoldQueryComponent);
    component = fixture.componentInstance;


    });


  describe('Component Initialization', () => {


    it('should initialize table config with 9 columns', () => {
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.columns.length).toBe(9);
      expect(component.tableConfig.columns[0].key).toBe('displayUnitId');
      expect(component.tableConfig.columns[1].key).toBe('driveId');
      expect(component.tableConfig.columns[8].key).toBe('auditFlag');
    });



    it('should initialize table config with 5 row actions', () => {
      expect(component.tableConfig.rowActions?.length).toBe(5);
      expect(component.tableConfig.rowActions?.[0].action).toBe('entry-details');
      expect(component.tableConfig.rowActions?.[1].action).toBe('hold-reason');
      expect(component.tableConfig.rowActions?.[2].action).toBe('attach-donor');
      expect(component.tableConfig.rowActions?.[3].action).toBe('update-regis');
      expect(component.tableConfig.rowActions?.[4].action).toBe('update-audit');
    });

    it('should initialize filter form with all controls', () => {
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('showTerm')).toBeDefined();
      expect(component.filterForm.get('fromDate')).toBeDefined();
      expect(component.filterForm.get('toDate')).toBeDefined();
      expect(component.filterForm.get('drive')).toBeDefined();
      expect(component.filterForm.get('user')).toBeDefined();
      expect(component.filterForm.get('donationType')).toBeDefined();
      expect(component.filterForm.get('procedureCode')).toBeDefined();
      expect(component.filterForm.get('hold')).toBeDefined();
    });

    it('should initialize hold as empty array for multi-select', () => {
      expect(component.filterForm.get('hold')?.value).toEqual([]);
    });



    it('should handle error when loading lookups', () => {
      mockService.getLookups.and.returnValue(throwError(() => new Error('API Error')));
      component.ngOnInit();
      expect(component.isLoadingDropdowns).toBe(false);
    });

    it('should subscribe to chapter changes on init', () => {
      component.ngOnInit();
      chapterChangedSubject.next();

      expect(mockService.getLookups).toHaveBeenCalled();
      expect(component.dataSource).toEqual([]);
      expect(component.totalFound).toBe(0);
    });
  });

  describe('Form Validation', () => {


    it('should not require other filter fields', () => {
      expect(component.filterForm.get('fromDate')?.hasError('required')).toBe(false);
      expect(component.filterForm.get('toDate')?.hasError('required')).toBe(false);
      expect(component.filterForm.get('drive')?.hasError('required')).toBe(false);
      expect(component.filterForm.get('user')?.hasError('required')).toBe(false);
      expect(component.filterForm.get('donationType')?.hasError('required')).toBe(false);
      expect(component.filterForm.get('procedureCode')?.hasError('required')).toBe(false);
      expect(component.filterForm.get('hold')?.hasError('required')).toBe(false);
    });

    it('should validate future dates on fromDate', () => {
      const futureDate = moment().add(5, 'days');
      component.filterForm.get('fromDate')?.setValue(futureDate);
      expect(component.filterForm.get('fromDate')?.hasError('futureDate')).toBe(true);
    });

    it('should validate future dates on toDate', () => {
      const futureDate = moment().add(5, 'days');
      component.filterForm.get('toDate')?.setValue(futureDate);
      expect(component.filterForm.get('toDate')?.hasError('futureDate')).toBe(true);
    });

    it('should allow past dates without error', () => {
      const pastDate = moment().subtract(5, 'days');
      component.filterForm.get('fromDate')?.setValue(pastDate);
      expect(component.filterForm.get('fromDate')?.hasError('futureDate')).toBe(false);
    });

  });

  describe('Date Error Messages', () => {
    it('should return future date error for fromDate', () => {
      const futureDate = moment().add(5, 'days');
      component.filterForm.get('fromDate')?.setValue(futureDate);
      component.filterForm.get('fromDate')?.markAsTouched();
      expect(component.getFromDateError()).toBe('Date cannot be in the future');
    });

    it('should return future date error for toDate', () => {
      const futureDate = moment().add(5, 'days');
      component.filterForm.get('toDate')?.setValue(futureDate);
      component.filterForm.get('toDate')?.markAsTouched();
      expect(component.getToDateError()).toBe('Date cannot be in the future');
    });


  });
  describe('Clear All', () => {
    it('should reset all form fields and hold to empty array', () => {
      component.filterForm.patchValue({
        showTerm: 'Y',
        donationType: 'WB',
        hold: ['H1', 'H2'],
      });
      component.dataSource = mockDonationsOnHold;
      component.totalFound = 20;

      component.onClearAll();

      expect(component.filterForm.get('showTerm')?.value).toBe('N');
      expect(component.filterForm.get('donationType')?.value).toBeNull();
      expect(component.filterForm.get('hold')?.value).toEqual([]);
      expect(component.dataSource).toEqual([]);
      expect(component.totalFound).toBe(0);
      expect(component.errorMessage).toBeNull();
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      component.filterForm.patchValue({ showTerm: 'Y' });
    });

    it('should call search service when retrieve is clicked', () => {
      component.onRetrieve();
      expect(mockService.search).toHaveBeenCalled();
      expect(component.dataSource).toEqual(mockDonationsOnHold);
    });

    it('should update totalFound from response', () => {
      component.onRetrieve();
      expect(component.totalFound).toBe(20);
    });





    it('should set error message on API error', () => {
      const errorResponse = {
        error: { errorResponse: { error: 'Server error occurred' } },
      };
      mockService.search.and.returnValue(throwError(() => errorResponse));
      component.onRetrieve();
      expect(component.errorMessage).toBe('Server error occurred');
    });

    it('should send correct request parameters', () => {
      component.filterForm.patchValue({
        showTerm: 'Y',
        donationType: 'WB',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-01-31'),
      });

      component.onRetrieve();

      const callArgs = mockService.search.calls.mostRecent().args[0];
      expect(callArgs.ShowTerminated).toBe(true);
      expect(callArgs.DonationType).toBe('WB');
      expect(callArgs.FromDate).toBe('2025-01-01');
      expect(callArgs.ToDate).toBe('2025-01-31');
    });

    it('should send hold codes as array', () => {
      component.filterForm.patchValue({
        showTerm: 'Y',
        hold: ['H1', 'H2'],
      });

      component.onRetrieve();

      const callArgs = mockService.search.calls.mostRecent().args[0];
      expect(callArgs.HoldCodes).toEqual(['H1', 'H2']);
    });

    it('should not include empty optional params in request', () => {
      component.filterForm.patchValue({ showTerm: 'Y' });
      component.onRetrieve();

      const callArgs = mockService.search.calls.mostRecent().args[0];
      expect(callArgs.ShowTerminated).toBe(true);
      expect(callArgs.UnitId).toBeUndefined();
      expect(callArgs.DonationType).toBeUndefined();
      expect(callArgs.DriveId).toBeUndefined();
      expect(callArgs.HoldCodes).toBeUndefined();
    });
  });



  describe('Row Actions', () => {
    const mockRow: DonationOnHold = mockDonationsOnHold[0];





    it('should set selectedRecord for hold-reason action', () => {
      component.onRowAction({ action: 'hold-reason', row: mockRow });

      expect(component.selectedRecord).toEqual({
        transactionId: mockRow.transactionId,
        donorId: mockRow.donorId,
        unitId: mockRow.unitId,
        collectionDate: mockRow.collDate,
      });
    });









    it('should handle update-audit action', () => {
      component.onRowAction({ action: 'update-audit', row: mockRow });
      // update-audit now navigates to the audit page via router
      expect(component.selectedRecord).toBeFalsy();
    });

    it('should clear selectedRecord on closeSidePanel', () => {
      component.onRowAction({ action: 'hold-reason', row: mockRow });
      expect(component.selectedRecord).toBeTruthy();

      component.closeSidePanel();
      expect(component.selectedRecord).toBeNull();
    });
  });
  describe('Date Formatting', () => {


    it('should handle empty date string', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format datetime correctly', () => {
      const result = component.formatDateTime('2025-01-11T09:05:00');
      expect(result).toContain('11-JAN-2025');
      expect(result).toContain('AM');
    });

    it('should handle empty datetime string', () => {
      expect(component.formatDateTime('')).toBe('');
    });

    it('should handle null date for API formatting', () => {
      const formatted = component['formatDateForApi'](null);
      expect(formatted).toBe('');
    });
  });
});
