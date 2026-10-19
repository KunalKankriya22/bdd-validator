import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';

import { AntqlQuery } from './antql-query';
import { AntqlQueryService } from './services/antql-query.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  UnitDonorTestedAntigenResponse,
  ScheduledTest,
  UnscheduledTest,
  DonorTest
} from './models/antql-query.model';

describe('AntqlQuery', () => {
  let component: any;
  let fixture: ComponentFixture<AntqlQuery>;
  let antqlQueryServiceSpy: jasmine.SpyObj<AntqlQueryService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockScheduledTest: ScheduledTest = {
    testId: 'ABORH',
    testSeqNo: 1,
    resultDescription: 'AB NEG',
    resultDateTime: '2017-11-09T18:24:20',
    testBatchId: '110917-00P1302',
    technician: 'SBCSYS',
    source: 'Sched'
  };

  const mockUnscheduledTest: UnscheduledTest = {
    testId: 'CMV',
    testSeqNo: 1,
    resultDescription: 'NEGATIVE',
    resultDateTime: '2024-03-15T11:00:00',
    testBatchId: 'BATCH002',
    technician: 'TECH02',
    source: 'Unsched'
  };

  const mockDonorTest: DonorTest = {
    testId: 'ANTIGEN',
    resultDescription: 'POSITIVE',
    insertDateTime: '2024-03-15T09:00:00',
    isConfirmed: true,
    source: 'Donor'
  };

  const mockResponse: UnitDonorTestedAntigenResponse = {
    unitId: 'W12341707029',
    collectionDate: '2017-11-03T00:00:00',
    hasResults: true,
    scheduledTests: [mockScheduledTest],
    unscheduledTests: [mockUnscheduledTest],
    donorTests: [mockDonorTest]
  };

  beforeEach(() => {

    const queryParams = of({});
    activatedRoute = {
      queryParams: queryParams
    };

    antqlQueryServiceSpy = jasmine.createSpyObj('AntqlQueryService', [
      'queryTestedAntigens'
    ]);
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['log', 'info', 'error', 'warn']);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj(
      'PageHeaderService',
      ['getTitle', 'getSubtitle', 'getCurrentMenuItem'],
      { pageHeaderData: jasmine.createSpy().and.returnValue(null) }
    );
    translateServiceSpy = createMockTranslateService();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    antqlQueryServiceSpy.queryTestedAntigens.and.returnValue(of(mockResponse));

      TestBed.configureTestingModule({
      imports: [AntqlQuery, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AntqlQueryService, useValue: antqlQueryServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    });

      antqlQueryServiceSpy.queryTestedAntigens.calls.reset();
      loggingServiceSpy.log.calls.reset();
      loggingServiceSpy.info.calls.reset();
      loggingServiceSpy.error.calls.reset();
      loggingServiceSpy.warn.calls.reset();
      pageHeaderServiceSpy.getTitle.calls.reset();
      pageHeaderServiceSpy.getSubtitle.calls.reset();
      pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();
      routerSpy.navigate.calls.reset();
      antqlQueryServiceSpy.queryTestedAntigens.and.returnValue(of(mockResponse));

    fixture = TestBed.createComponent(AntqlQuery);
    component = fixture.componentInstance;
    });

  describe('Component Initialization', () => {
    it('should generate unique component ID', () => {
      expect(component.componentId).toMatch(/^antql-query-\d+$/);
    });
  });

  describe('Unit ID Validation', () => {
    it('should load data when unit ID is validated', fakeAsync(() => {
      fixture.detectChanges();

      const mockValidation = {
        parsedUnitId: 'W12341707029',
        barcodeType: 'CODE128',
        isValid: true
      };

      component.onUnitIdValidated(mockValidation);
      tick();

      expect(antqlQueryServiceSpy.queryTestedAntigens).toHaveBeenCalledWith('W12341707029');
      expect(component.unitId()).toBe('W12341707029');
    }));
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', fakeAsync(() => {
      const error = {
        status: 404,
        message: 'Unit not found. Please verify the unit ID.'
      };
      antqlQueryServiceSpy.queryTestedAntigens.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      const mockValidation = {
        parsedUnitId: 'INVALID',
        barcodeType: 'CODE128',
        isValid: true
      };

      component.onUnitIdValidated(mockValidation);
      tick();
      fixture.detectChanges();

      expect(component.error()).toBe('Unit not found. Please verify the unit ID.');
      expect(component.loading()).toBeFalse();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
    }));

    it('should handle "No test data found" error', fakeAsync(() => {
      const error = {
        status: 404,
        message: 'No test data found for this unit'
      };
      antqlQueryServiceSpy.queryTestedAntigens.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      const mockValidation = {
        parsedUnitId: 'W12341707029',
        barcodeType: 'CODE128',
        isValid: true
      };

      component.onUnitIdValidated(mockValidation);
      tick();

      expect(component.error()).toBe('No test results found for this unit');
    }));
  });

  describe('Data Display', () => {
    it('should display test results when data is loaded', fakeAsync(() => {
      fixture.detectChanges();

      const mockValidation = {
        parsedUnitId: 'W12341707029',
        barcodeType: 'CODE128',
        isValid: true
      };

      component.onUnitIdValidated(mockValidation);
      tick();
      fixture.detectChanges();

      expect(component.scheduledTests().length).toBe(1);
      expect(component.unscheduledTests().length).toBe(1);
      expect(component.donorTests().length).toBe(1);
      expect(component.hasResults()).toBeTrue();
    }));

    it('should display all three sections in the unified table', fakeAsync(() => {
      fixture.detectChanges();

      const mockValidation = {
        parsedUnitId: 'W12341707029',
        barcodeType: 'CODE128',
        isValid: true
      };

      component.onUnitIdValidated(mockValidation);
      tick();
      fixture.detectChanges();

      const sections = fixture.debugElement.queryAll(By.css('.section-panel'));
      expect(sections.length).toBe(3);

      const ribbons = fixture.debugElement.queryAll(By.css('.section-ribbon'));
      expect(ribbons.length).toBe(3);
    }));
  });

  describe('Clear Functionality', () => {
    it('should clear all data when clear button is clicked', fakeAsync(() => {
      fixture.detectChanges();

      const mockValidation = {
        parsedUnitId: 'W12341707029',
        barcodeType: 'CODE128',
        isValid: true
      };

      component.onUnitIdValidated(mockValidation);
      tick();

      component.unitIdField = { clear: jasmine.createSpy('clear') };

      component.onClear();

      expect(component.unitId()).toBeNull();
      expect(component.collectionDate()).toBeNull();
      expect(component.scheduledTests().length).toBe(0);
      expect(component.unscheduledTests().length).toBe(0);
      expect(component.donorTests().length).toBe(0);
      expect(component.hasSearched()).toBeFalse();
    }));
  });

  describe('Date Formatting', () => {
    it('should format date correctly to DD-MMM-YYYY', () => {
      const formatted = component.formatDate('2017-11-03T00:00:00');
      expect(formatted).toBe('03-NOV-2017');
    });

    it('should format datetime correctly to DD-MMM-YYYY HH:MM:SS', () => {
      const formatted = component.formatDateTime('2017-11-09T18:24:20');
      expect(formatted).toContain('09-NOV-2017');
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Retry Functionality', () => {
    it('should retry loading data on retry button click', fakeAsync(() => {
      fixture.detectChanges();

      component.unitId.set('W12341707029');
      component.onRetry();

      expect(antqlQueryServiceSpy.queryTestedAntigens).toHaveBeenCalledWith('W12341707029');
    }));
  });
});
