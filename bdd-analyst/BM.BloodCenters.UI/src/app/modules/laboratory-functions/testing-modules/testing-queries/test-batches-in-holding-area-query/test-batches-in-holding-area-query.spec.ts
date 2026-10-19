import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';

import { TestBatchesInHoldingAreaQueryComponent } from './test-batches-in-holding-area-query';
import { TestBatchesInHoldingAreaQueryService } from './test-batches-in-holding-area-query.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  HoldingTestModel,
  ReturnResult,
  ViewInterdictionModel,
  MenuAccessResult,
  FilterValuesResult,
} from './test-batches-in-holding-area-query.model';

describe('TestBatchesInHoldingAreaQueryComponent', () => {
  let component: TestBatchesInHoldingAreaQueryComponent;
  let fixture: ComponentFixture<TestBatchesInHoldingAreaQueryComponent>;
  let service: jasmine.SpyObj<TestBatchesInHoldingAreaQueryService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let headerService: { chapterChanged$: Subject<any> };
  let router: jasmine.SpyObj<Router>;

  const mockTestIds: ReturnResult<string[]> = {
    success: true,
    statusCode: 200,
    data: ['HBSAG', 'ABORH', 'HIVNAT'],
  };

  const mockBatchIds: ReturnResult<string[]> = {
    success: true,
    statusCode: 200,
    data: ['092809-TB6124', '092809-TB6125'],
  };

  const mockHoldingTests: HoldingTestModel[] = [
    {
      tbId: '092809-TB6124',
      unitId: 'W454509926003',
      testId: 'HBSAG',
      absorbance: '0.045',
      ratio: '1.2',
      resultStatus: 'NR',
      resultDate: '2026-06-17T14:30:00Z',
      holdingStatus: 'Upload',
      batchCreationDate: '2026-06-17T10:00:00Z',
    },
    {
      tbId: '092809-TB6124',
      unitId: 'W454509926004',
      testId: 'HBSAG',
      absorbance: '0.089',
      ratio: '2.1',
      resultStatus: 'R',
      resultDate: '2026-06-17T15:00:00Z',
      holdingStatus: null,
      batchCreationDate: '2026-06-17T10:00:00Z',
    },
  ];

  const mockSearchResponse: ReturnResult<HoldingTestModel[]> = {
    success: true,
    statusCode: 200,
    data: mockHoldingTests,
    total: 2,
  };

  const mockInterdictions: ViewInterdictionModel[] = [
    { unitId: 'W454509926003', collDate: '2026-06-15', interCode: 'HOLD' },
  ];

  const mockMenuAccessGranted: MenuAccessResult = {
    success: true,
    statusCode: 200,
  };

  const mockMenuAccessDenied: MenuAccessResult = {
    success: false,
    statusCode: 200,
    message: 'Access denied',
  };

  beforeEach(() => {

    service = jasmine.createSpyObj('TestBatchesInHoldingAreaQueryService', [
      'getHoldingTests',
      'getTestIds',
      'getBatchIds',
      'getInterdictions',
      'checkMenuAccess',
      'getFilterValues',
      'getCachedMenuAccess',
      'setCachedMenuAccess',
    ]);

    snackbarService = createMockSnackbarService();

    loggingService = jasmine.createSpyObj('LoggingService', ['error', 'info']);

    headerService = {
      chapterChanged$: new Subject<any>(),
    };

    router = jasmine.createSpyObj('Router', ['navigate']);
    (router as any).events = of();

    service.getTestIds.and.returnValue(of(mockTestIds));
    service.getBatchIds.and.returnValue(of(mockBatchIds));
    service.getHoldingTests.and.returnValue(of(mockSearchResponse));
    service.getInterdictions.and.returnValue(
      of({ success: true, statusCode: 200, data: mockInterdictions })
    );
    service.checkMenuAccess.and.returnValue(of(mockMenuAccessGranted));
    service.getFilterValues.and.returnValue(
      of({
        success: true,
        statusCode: 200,
        item: {
          testIds: ['HBSAG'],
          absorbances: ['0.045'],
          ratios: ['1.2'],
          resultValues: ['NR'],
          statuses: ['Upload'],
        },
      } as ReturnResult<FilterValuesResult>)
    );
    service.getCachedMenuAccess.and.returnValue(undefined);



      TestBed.configureTestingModule({
      imports: [
        TestBatchesInHoldingAreaQueryComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: TestBatchesInHoldingAreaQueryService, useValue: service },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: LoggingService, useValue: loggingService },
        { provide: HeaderService, useValue: headerService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    });


    


      service.getHoldingTests.calls.reset();


      service.getTestIds.calls.reset();


      service.getBatchIds.calls.reset();


      service.getInterdictions.calls.reset();


      service.checkMenuAccess.calls.reset();


      service.getFilterValues.calls.reset();


      service.getCachedMenuAccess.calls.reset();


      service.setCachedMenuAccess.calls.reset();


      loggingService.error.calls.reset();


      loggingService.info.calls.reset();


      service.getTestIds.and.returnValue(of(mockTestIds));


      service.getBatchIds.and.returnValue(of(mockBatchIds));


      service.getHoldingTests.and.returnValue(of(mockSearchResponse));


      service.checkMenuAccess.and.returnValue(of(mockMenuAccessGranted));


      service.getCachedMenuAccess.and.returnValue(undefined);


    fixture = TestBed.createComponent(TestBatchesInHoldingAreaQueryComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize header configuration with Home breadcrumb', () => {
      const config = component.headerConfig();
      expect(config.breadcrumbs.length).toBeGreaterThanOrEqual(1);
      expect(config.breadcrumbs[0].label).toBe('Home');
    });

    it('should initialize table configuration with correct columns', () => {
      expect(component.tableConfig.columns.length).toBe(8);
      const keys = component.tableConfig.columns.map((c) => c.key);
      expect(keys).toEqual([
        'tbId',
        'unitId',
        'testId',
        'absorbance',
        'ratio',
        'resultStatus',
        'resultDate',
        'holdingStatus',
      ]);
    });

    it('should initialize searchForm with default values', () => {
      fixture.detectChanges();
      expect(component.searchForm.get('allOrPending')?.value).toBe('P');
      expect(component.searchForm.get('testId')?.value).toBeNull();
      expect(component.searchForm.get('tbId')?.value).toBeNull();
    });





    it('should populate test IDs and batch IDs after load', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.testIds).toEqual(['HBSAG', 'ABORH', 'HIVNAT']);
        expect(component.batchIds).toEqual([
          '092809-TB6124',
          '092809-TB6125',
        ]);
        done();
      });
    });

    it('should set hasSearched to false initially', () => {
      expect(component.hasSearched).toBe(false);
    });

    it('should set dataSource to empty initially', () => {
      expect(component.dataSource).toEqual([]);
    });

    it('should preload menu access on init', () => {
      fixture.detectChanges();
      expect(service.checkMenuAccess).toHaveBeenCalledWith('CPINTER');
      expect(service.checkMenuAccess).toHaveBeenCalledWith('CPIRINT');
    });

    it('should configure row actions for interdictions', () => {
      expect(component.tableConfig.rowActions?.length).toBe(3);
      expect(component.tableConfig.rowActions?.[0].action).toBe(
        'placeInterdictions'
      );
      expect(component.tableConfig.rowActions?.[1].action).toBe(
        'removeInterdictions'
      );
      expect(component.tableConfig.rowActions?.[2].action).toBe(
        'viewInterdictions'
      );
    });
  });

  describe('Required Field Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable retrieve button when no criteria provided', () => {
      component.searchForm.patchValue({ testId: null, tbId: null });
      component.validatedUnitId = null;
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('should enable retrieve button when testId is provided', () => {
      component.searchForm.patchValue({ testId: 'HBSAG', tbId: null });
      component.validatedUnitId = null;
      expect(component.isRetrieveDisabled).toBe(false);
    });

    it('should enable retrieve button when tbId is provided', () => {
      component.searchForm.patchValue({ testId: null, tbId: '092809-TB6124' });
      component.validatedUnitId = null;
      expect(component.isRetrieveDisabled).toBe(false);
    });

    it('should enable retrieve button when unitId is provided', () => {
      component.searchForm.patchValue({ testId: null, tbId: null });
      component.validatedUnitId = 'W454509926003';
      expect(component.isRetrieveDisabled).toBe(false);
    });

    it('should show error when onRetrieve called with no criteria', () => {
      component.searchForm.patchValue({ testId: null, tbId: null });
      component.validatedUnitId = null;
      component.onRetrieve();
      expect(snackbarService.showError).toHaveBeenCalledWith(
        'At least one of Test ID, Test Batch ID, or Unit ID is required'
      );
      expect(service.getHoldingTests).not.toHaveBeenCalled();
    });

    it('should not show error when onRetrieve called with criteria', () => {
      component.searchForm.patchValue({ testId: 'HBSAG' });
      component.onRetrieve();
      expect(snackbarService.showError).not.toHaveBeenCalled();
      expect(service.getHoldingTests).toHaveBeenCalled();
    });
  });

  describe('Retrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should set hasSearched to true after retrieve', () => {
      component.searchForm.patchValue({ testId: 'HBSAG' });
      component.onRetrieve();
      expect(component.hasSearched).toBe(true);
    });

    it('should populate dataSource from response', (done) => {
      component.searchForm.patchValue({ testId: 'HBSAG' });
      component.onRetrieve();
      setTimeout(() => {
        expect(component.dataSource).toEqual(mockHoldingTests);
        expect(component.isLoading).toBe(false);
        done();
      });
    });

    it('should set recordCount from response total', (done) => {
      component.searchForm.patchValue({ testId: 'HBSAG' });
      component.onRetrieve();
      setTimeout(() => {
        expect(component.recordCount).toBe(2);
        done();
      });
    });



    it('should set creation date and time from first record', (done) => {
      component.searchForm.patchValue({ testId: 'HBSAG' });
      component.onRetrieve();
      setTimeout(() => {
        expect(component.creationDate).toBeTruthy();
        expect(component.creationTime).toBeTruthy();
        done();
      });
    });



    it('should handle unsuccessful response', (done) => {
      service.getHoldingTests.and.returnValue(
        of({
          success: false,
          statusCode: 400,
          message: 'Failed to retrieve data',
        })
      );
      component.searchForm.patchValue({ testId: 'HBSAG' });
      component.onRetrieve();
      setTimeout(() => {
        expect(component.dataSource).toEqual([]);
        expect(snackbarService.showError).toHaveBeenCalledWith(
          'Failed to retrieve data'
        );
        done();
      });
    });



    it('should pass form values and validated unit ID in request', () => {
      component.searchForm.patchValue({
        allOrPending: 'A',
        testId: 'HBSAG',
        tbId: '092809-TB6124',
      });
      component.validatedUnitId = 'W454509926003';
      component.onRetrieve();

      const callArgs = service.getHoldingTests.calls.mostRecent().args[0];
      expect(callArgs.allOrPending).toBe('A');
      expect(callArgs.testId).toBe('HBSAG');
      expect(callArgs.tbId).toBe('092809-TB6124');
      expect(callArgs.unitId).toBe('W454509926003');
    });

    it('should pass applied grid filters in request', () => {
      component.searchForm.patchValue({ testId: 'HBSAG' });
      component.appliedFilters = {
        testId: null,
        absorbance: '0.045',
        ratio: '1.2',
        resultValue: 'NR',
        status: 'Pending',
      };
      component.onRetrieve();

      const callArgs = service.getHoldingTests.calls.mostRecent().args[0];
      expect(callArgs.absorbance).toBe('0.045');
      expect(callArgs.ratio).toBe('1.2');
      expect(callArgs.resultStatus).toBe('NR');
      expect(callArgs.holdingStatus).toBe('Pending');
    });

    it('should pass null filters when no grid filters applied', () => {
      component.searchForm.patchValue({ testId: 'HBSAG' });
      component.appliedFilters = null;
      component.onRetrieve();

      const callArgs = service.getHoldingTests.calls.mostRecent().args[0];
      expect(callArgs.absorbance).toBeNull();
      expect(callArgs.ratio).toBeNull();
      expect(callArgs.resultStatus).toBeNull();
      expect(callArgs.holdingStatus).toBeNull();
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form controls and validated unit ID', () => {
      component.searchForm.patchValue({
        allOrPending: 'A',
        testId: 'HBSAG',
        tbId: '092809-TB6124',
      });
      component.validatedUnitId = 'W454509926003';
      component.onClearAll();

      expect(component.searchForm.get('allOrPending')?.value).toBe('P');
      expect(component.searchForm.get('testId')?.value).toBeNull();
      expect(component.searchForm.get('tbId')?.value).toBeNull();
      expect(component.validatedUnitId).toBeNull();
    });

    it('should reset state flags', () => {
      component.hasSearched = true;
      component.dataSource = mockHoldingTests;
      component.recordCount = 5;
      component.creationDate = '17-JUN-2026';
      component.creationTime = '10:00';

      component.onClearAll();

      expect(component.hasSearched).toBe(false);
      expect(component.dataSource).toEqual([]);
      expect(component.recordCount).toBeNull();
      expect(component.creationDate).toBeNull();
      expect(component.creationTime).toBeNull();
    });




  });






  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open view interdictions panel', (done) => {
      component.onRowAction({
        action: 'viewInterdictions',
        row: mockHoldingTests[0],
      });

      setTimeout(() => {
        expect(service.getInterdictions).toHaveBeenCalledWith('092809-TB6124');
        expect(component.sidePanelOpen).toBe(true);
        expect(component.interdictionsPanelData).toEqual(mockInterdictions);
        done();
      });
    });

    it('should navigate to place interdictions with cached access', () => {
      service.getCachedMenuAccess.and.returnValue(true);

      component.onRowAction({
        action: 'placeInterdictions',
        row: mockHoldingTests[0],
      });

      expect(router.navigate).toHaveBeenCalledWith(
        jasmine.arrayContaining([jasmine.stringContaining('enter-component-interdiction')]),
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({
            tbId: '092809-TB6124',
            unitId: 'W454509926003',
            testId: 'HBSAG',
          }),
        })
      );
    });

    it('should handle place interdictions with no access', () => {
      service.getCachedMenuAccess.and.returnValue(false);

      component.onRowAction({
        action: 'placeInterdictions',
        row: mockHoldingTests[0],
      });

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'You do not have access to this function'
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to remove interdictions with cached access', () => {
      service.getCachedMenuAccess.and.returnValue(true);

      component.onRowAction({
        action: 'removeInterdictions',
        row: mockHoldingTests[0],
      });

      expect(router.navigate).toHaveBeenCalledWith(
        jasmine.arrayContaining([jasmine.stringContaining('release-component-interdiction')]),
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({
            tbId: '092809-TB6124',
            unitId: 'W454509926003',
            testId: 'HBSAG',
          }),
        })
      );
    });

    it('should check menu access and navigate when not cached', (done) => {
      service.getCachedMenuAccess.and.returnValue(undefined);
      service.checkMenuAccess.and.returnValue(of(mockMenuAccessGranted));

      component.onRowAction({
        action: 'placeInterdictions',
        row: mockHoldingTests[0],
      });

      setTimeout(() => {
        expect(service.checkMenuAccess).toHaveBeenCalledWith('CPINTER');
        expect(service.setCachedMenuAccess).toHaveBeenCalledWith(
          'CPINTER',
          true
        );
        expect(router.navigate).toHaveBeenCalled();
        done();
      });
    });

    it('should handle menu access check failure', (done) => {
      service.getCachedMenuAccess.and.returnValue(undefined);
      service.checkMenuAccess.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.onRowAction({
        action: 'placeInterdictions',
        row: mockHoldingTests[0],
      });

      setTimeout(() => {
        expect(snackbarService.showError).toHaveBeenCalledWith(
          'Failed to check menu access'
        );
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });
  describe('Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should detect active filters', () => {
      component.appliedFilters = {
        testId: 'HBSAG',
        absorbance: null,
        ratio: null,
        resultValue: null,
        status: null,
      };
      expect(component.hasActiveFilters()).toBe(true);
    });






  });

  describe('Cascading Dropdowns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reload dropdowns when allOrPending changes', () => {
      service.getTestIds.calls.reset();
      service.getBatchIds.calls.reset();

      component.searchForm.get('allOrPending')?.setValue('A');

      expect(service.getTestIds).toHaveBeenCalledWith('A');
      expect(service.getBatchIds).toHaveBeenCalledWith('A');
    });



    it('should clear tbId when allOrPending changes', () => {
      component.searchForm.patchValue({ tbId: '092809-TB6124' });

      component.searchForm.get('allOrPending')?.setValue('A');

      expect(component.searchForm.get('tbId')?.value).toBeNull();
    });
  });

  describe('Search Filter Controls', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return all test IDs when search is empty', (done) => {
      component.testIds = ['HBSAG', 'ABORH', 'HIVNAT'];
      component.filteredTestIds = [...component.testIds];

      component.testIdSearchControl.setValue('');

      setTimeout(() => {
        expect(component.filteredTestIds.length).toBe(3);
        done();
      });
    });


  });

  describe('Chapter Changes', () => {
    it('should clear data and reload dropdowns when chapter changes', () => {
      fixture.detectChanges();
      service.getTestIds.calls.reset();
      service.getBatchIds.calls.reset();

      component.hasSearched = true;
      component.dataSource = mockHoldingTests;

      headerService.chapterChanged$.next(null);

      expect(component.hasSearched).toBe(false);
      expect(component.dataSource).toEqual([]);
      expect(service.getTestIds).toHaveBeenCalled();
      expect(service.getBatchIds).toHaveBeenCalled();
    });
  });

  describe('Column Value Formatters', () => {
    const dummyRow = mockHoldingTests[0];

    it('should format holdingStatus column', () => {
      const statusCol = component.tableConfig.columns.find(
        (c) => c.key === 'holdingStatus'
      );
      expect(statusCol?.valueFormatter?.('Upload', dummyRow)).toBe('Upload');
      expect(statusCol?.valueFormatter?.(null, dummyRow)).toBe('Pending');
      expect(statusCol?.valueFormatter?.(undefined, dummyRow)).toBe('Pending');
    });




  });
});
