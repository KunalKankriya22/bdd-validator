import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';

import { ReleaseStandingOrdersBatchComponent } from './release-standing-orders-batch';
import { ReleaseStandingOrdersBatchApiService } from './services/release-standing-orders-batch-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ReleaseStandingOrdersBatchResponseDto, GeneratedOrderDto, FailedOrderDto } from './models/release-standing-orders-batch.model';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';
import moment from 'moment';

describe('ReleaseStandingOrdersBatchComponent', () => {
  let header: any;
  let summaryStats: any;
  let emptyState: any;
  let failedItems: any;
  let orderItems: any;
  let mockDialogRef: any;
  let component: ReleaseStandingOrdersBatchComponent;
  let fixture: ComponentFixture<ReleaseStandingOrdersBatchComponent>;
  let apiServiceSpy: jasmine.SpyObj<ReleaseStandingOrdersBatchApiService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockBatchResult: ReleaseStandingOrdersBatchResponseDto = {
    processedCount: 3,
    generatedOrders: [
      {
        orderNo: '26146-0001',
        customerId: 'CUST001',
        contractId: 'CONT001',
        consigneeId: 'CONS001',
        itemCount: 5,
        orderStatus: 'OR',
        reportSubmitted: true,
      },
      {
        orderNo: '26146-0002',
        customerId: 'CUST002',
        contractId: 'CONT002',
        consigneeId: 'CONS002',
        itemCount: 3,
        orderStatus: 'HO',
        reportSubmitted: true,
      },
    ],
    failedOrders: [
      {
        contractId: 'CONT003',
        customerId: 'CUST003',
        consigneeId: 'CONS003',
        errorMessage: 'Database constraint violation',
        weekDay: 'MON',
      },
    ],
    processedAt: '2026-05-26T14:30:00Z',
    weekDay: 'MON',
  };

  const mockEmptyResult: ReleaseStandingOrdersBatchResponseDto = {
    processedCount: 0,
    generatedOrders: [],
    failedOrders: [],
    processedAt: '2026-05-26T14:30:00Z',
    weekDay: 'MON',
  };

  const mockSuccessResult: ReleaseStandingOrdersBatchResponseDto = {
    processedCount: 2,
    generatedOrders: [
      {
        orderNo: '26146-0001',
        customerId: 'CUST001',
        contractId: 'CONT001',
        consigneeId: 'CONS001',
        itemCount: 5,
        orderStatus: 'OR',
        reportSubmitted: true,
      },
      {
        orderNo: '26146-0002',
        customerId: 'CUST002',
        contractId: 'CONT002',
        consigneeId: 'CONS002',
        itemCount: 3,
        orderStatus: 'OR',
        reportSubmitted: true,
      },
    ],
    failedOrders: [],
    processedAt: '2026-05-26T14:30:00Z',
    weekDay: 'TUE',
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ReleaseStandingOrdersBatchApiService', ['processBatch']);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], { pageHeaderData: jasmine.createSpy().and.returnValue(null) });
    headerServiceSpy = createMockHeaderService();
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['convertGmtToLocal']);
    chapterTimezoneServiceSpy.convertGmtToLocal.and.callFake((m: moment.Moment) => m.clone().add(-300, 'minutes'));



      TestBed.configureTestingModule({
      imports: [ReleaseStandingOrdersBatchComponent, NoopAnimationsModule],
      providers: [
        { provide: ReleaseStandingOrdersBatchApiService, useValue: apiServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ],
    });
    TestBed.overrideComponent(ReleaseStandingOrdersBatchComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });
    fixture = TestBed.createComponent(ReleaseStandingOrdersBatchComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should have initial state', () => {
      fixture.detectChanges();
      expect(component.isLoading()).toBeFalse();
      expect(component.batchResult()).toBeNull();
      expect(component.error()).toBeNull();
    });

    it('should generate unique component ID', () => {
      expect((component as any).componentId).toMatch(/^release-standing-orders-batch-\d+$/);
    });
  });

  describe('Action Section Display', () => {
    it('should show action section with release button initially', () => {
      fixture.detectChanges();

      const actionSection = fixture.debugElement.query(By.css('.action-section'));
      expect(actionSection).toBeTruthy();
      expect(actionSection.nativeElement.textContent).toContain('Click on this button to release all standby orders.');
    });

    it('should show RELEASE ALL STANDBY ORDERS button', () => {
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.action-section button'));
      expect(button).toBeTruthy();
      expect(button.nativeElement.textContent.trim()).toContain('RELEASE ALL STANDBY ORDERS');
    });




  });

  describe('Process Batch Functionality', () => {
    it('should open confirmation dialog when processing', () => {
      mockDialogRef = { afterClosed: () => of(false) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);

      fixture.detectChanges();
      component.onProcessBatch();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.title).toBe('Release All Standby Orders');
      expect(dialogData.message).toBe('Are you sure you want to release all standby orders?');
      expect(dialogData.confirmText).toBe('YES, RELEASE ALL ORDERS');
      expect(dialogData.cancelText).toBe('NO, GO BACK');
    });

    it('should process batch when dialog is confirmed', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);
      apiServiceSpy.processBatch.and.returnValue(of(mockBatchResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();

      expect(apiServiceSpy.processBatch).toHaveBeenCalledWith({
        includeReports: true,
        previewOnly: false,
      });
      expect(component.batchResult()).toEqual(mockBatchResult);
      expect(component.isLoading()).toBeFalse();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));



    it('should handle batch processing with no orders found', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);
      apiServiceSpy.processBatch.and.returnValue(of(mockEmptyResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();

      expect(component.batchResult()).toEqual(mockEmptyResult);
      expect(component.processedCount()).toBe(0);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No standing orders found for today');
    }));

    it('should handle batch processing error', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);
      const errorResponse = { message: 'Processing failed', error: 'Database error' };
      apiServiceSpy.processBatch.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();

      expect(component.isLoading()).toBeFalse();
      expect(component.error()).toBeTruthy();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));




  });

  describe('Results Display', () => {
    beforeEach(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);
    });

    it('should display generated orders', fakeAsync(() => {
      apiServiceSpy.processBatch.and.returnValue(of(mockBatchResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();
      fixture.detectChanges();

      orderItems = fixture.debugElement.queryAll(By.css('.order-item.success-item'));
      expect(orderItems.length).toBe(2);
      expect(orderItems[0].nativeElement.textContent).toContain('26146-0001');
      expect(orderItems[1].nativeElement.textContent).toContain('26146-0002');
    }));

    it('should display failed orders', fakeAsync(() => {
      apiServiceSpy.processBatch.and.returnValue(of(mockBatchResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();
      fixture.detectChanges();

      failedItems = fixture.debugElement.queryAll(By.css('.order-item.failed-item'));
      expect(failedItems.length).toBe(1);
      expect(failedItems[0].nativeElement.textContent).toContain('CONT003');
      expect(failedItems[0].nativeElement.textContent).toContain('Database constraint violation');
    }));

    it('should display empty state when no orders found', fakeAsync(() => {
      apiServiceSpy.processBatch.and.returnValue(of(mockEmptyResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();
      fixture.detectChanges();

      emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('No Standing Orders Found');
    }));

    it('should display summary statistics', fakeAsync(() => {
      apiServiceSpy.processBatch.and.returnValue(of(mockBatchResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();
      fixture.detectChanges();

      summaryStats = fixture.debugElement.query(By.css('.summary-stats'));
      expect(summaryStats).toBeTruthy();
      expect(summaryStats.nativeElement.textContent).toContain('Total Processed:');
      expect(summaryStats.nativeElement.textContent).toContain('Successful:');
      expect(summaryStats.nativeElement.textContent).toContain('Failed:');
    }));

    it('should display results header', fakeAsync(() => {
      apiServiceSpy.processBatch.and.returnValue(of(mockBatchResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();
      fixture.detectChanges();

      header = fixture.debugElement.query(By.css('.results-header'));
      expect(header).toBeTruthy();
      expect(header.nativeElement.textContent).toContain('Batch Processing Results');
    }));
  });

  describe('Clear Results Functionality', () => {
    it('should clear all results and show action section again', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);
      apiServiceSpy.processBatch.and.returnValue(of(mockBatchResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();

      expect(component.batchResult()).not.toBeNull();

      component.clearResults();

      expect(component.batchResult()).toBeNull();
      expect(component.error()).toBeNull();

      fixture.detectChanges();

      const actionSection = fixture.debugElement.query(By.css('.action-section'));
      expect(actionSection).toBeTruthy();
    }));
  });

  describe('Computed Values', () => {
    it('should compute hasBatchResult correctly', () => {
      expect(component.hasBatchResult()).toBeFalse();

      component.batchResult.set(mockBatchResult);
      expect(component.hasBatchResult()).toBeTrue();
    });

    it('should compute processedCount correctly', () => {
      component.batchResult.set(mockBatchResult);
      expect(component.processedCount()).toBe(3);
    });

    it('should compute generatedOrdersCount correctly', () => {
      component.batchResult.set(mockBatchResult);
      expect(component.generatedOrdersCount()).toBe(2);
    });

    it('should compute failedOrdersCount correctly', () => {
      component.batchResult.set(mockBatchResult);
      expect(component.failedOrdersCount()).toBe(1);
    });

    it('should compute showEmptyState correctly', () => {
      component.batchResult.set(mockEmptyResult);
      expect(component.showEmptyState()).toBeTrue();

      component.batchResult.set(mockBatchResult);
      expect(component.showEmptyState()).toBeFalse();
    });

    it('should compute weekDayDisplay correctly', () => {
      component.batchResult.set(mockBatchResult);
      expect(component.weekDayDisplay()).toBe('Monday');

      component.batchResult.set(mockSuccessResult);
      expect(component.weekDayDisplay()).toBe('Tuesday');
    });
  });

  describe('Helper Methods', () => {
    it('should format order status correctly', () => {
      expect(component.getOrderStatusDisplay('OR')).toBe('Ordered');
      expect(component.getOrderStatusDisplay('HO')).toBe('Hold');
      expect(component.getOrderStatusDisplay('UNKNOWN')).toBe('UNKNOWN');
    });



    it('should handle invalid date time', () => {
      expect(component.formatDateTime(null)).toBe('-');
      expect(component.formatDateTime(undefined)).toBe('-');
      expect(component.formatDateTime('invalid')).toBe('-');
    });

    it('should format valid UTC datetime using chapter timezone offset', () => {
      // spy offsets UTC by -300 min (UTC-5), so 14:30 UTC → 09:30 local
      const result = component.formatDateTime('2026-05-26T14:30:00Z');
      expect(result).toBe('26-MAY-2026 09:30:00');
      expect(chapterTimezoneServiceSpy.convertGmtToLocal).toHaveBeenCalled();
    });

    it('should track orders by orderNo', () => {
      const order: GeneratedOrderDto = {
        orderNo: '26146-0001',
        customerId: 'CUST001',
        contractId: 'CONT001',
        consigneeId: 'CONS001',
        itemCount: 5,
        orderStatus: 'OR',
        reportSubmitted: true,
      };
      expect(component.trackByOrderNo(0, order)).toBe('26146-0001');
    });

    it('should track failed orders by composite key', () => {
      const failure: FailedOrderDto = {
        contractId: 'CONT003',
        customerId: 'CUST003',
        consigneeId: 'CONS003',
        errorMessage: 'Error',
        weekDay: 'MON',
      };
      expect(component.trackByContractId(0, failure)).toBe('CONT003-CUST003-CONS003');
    });
  });
  describe('Chapter Change Subscription', () => {
    it('should clear results when chapter changes', fakeAsync(() => {
      const mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);
      apiServiceSpy.processBatch.and.returnValue(of(mockBatchResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();

      expect(component.batchResult()).not.toBeNull();

      (headerServiceSpy as any).chapterChanged$ = of(true);
      component.ngOnInit();
      tick();

      expect(component.batchResult()).toBeNull();
    }));
  });

  describe('Process Batch - Additional Branch Coverage', () => {
    beforeEach(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);
    });

    it('should show success message when all orders processed with no failures', fakeAsync(() => {
      apiServiceSpy.processBatch.and.returnValue(of(mockSuccessResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Successfully released 2 standing orders');
    }));

    it('should use singular form when exactly one order is processed with no failures', fakeAsync(() => {
      const singularResult: ReleaseStandingOrdersBatchResponseDto = {
        processedCount: 1,
        generatedOrders: [{
          orderNo: '26146-0001', customerId: 'CUST001', contractId: 'CONT001',
          consigneeId: 'CONS001', itemCount: 1, orderStatus: 'OR', reportSubmitted: false,
        }],
        failedOrders: [],
        processedAt: '2026-05-26T14:30:00Z',
        weekDay: 'MON',
      };
      apiServiceSpy.processBatch.and.returnValue(of(singularResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Successfully released 1 standing order');
    }));

    it('should use singular form when exactly one order is processed with failures', fakeAsync(() => {
      const singularWithFailResult: ReleaseStandingOrdersBatchResponseDto = {
        processedCount: 1,
        generatedOrders: [{
          orderNo: '26146-0001', customerId: 'CUST001', contractId: 'CONT001',
          consigneeId: 'CONS001', itemCount: 1, orderStatus: 'OR', reportSubmitted: false,
        }],
        failedOrders: [{
          contractId: 'CONT002', customerId: 'CUST002', consigneeId: 'CONS002',
          errorMessage: 'Failed', weekDay: 'MON',
        }],
        processedAt: '2026-05-26T14:30:00Z',
        weekDay: 'MON',
      };
      apiServiceSpy.processBatch.and.returnValue(of(singularWithFailResult));

      fixture.detectChanges();
      component.onProcessBatch();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Released 1 standing order, 1 failed');
    }));
  });

  describe('Computed Values - Additional Branch Coverage', () => {
    it('should fall back to raw weekDay code when code is not in WEEK_DAY_MAP', () => {
      const unknownResult = { ...mockBatchResult, weekDay: 'XYZ' };
      component.batchResult.set(unknownResult);
      expect(component.weekDayDisplay()).toBe('XYZ');
    });

    it('should return 0 for generatedOrdersCount when batchResult is null', () => {
      expect(component.generatedOrdersCount()).toBe(0);
    });

    it('should return 0 for failedOrdersCount when batchResult is null', () => {
      expect(component.failedOrdersCount()).toBe(0);
    });

    it('should return 0 for processedCount when batchResult is null', () => {
      expect(component.processedCount()).toBe(0);
    });

    it('should return empty string for weekDayDisplay when batchResult is null', () => {
      expect(component.weekDayDisplay()).toBe('');
    });
  });

});

describe('ReleaseStandingOrdersBatchComponent - Effect pageHeader with router', () => {
  let localFixture: ComponentFixture<ReleaseStandingOrdersBatchComponent>;
  let localComponent: ReleaseStandingOrdersBatchComponent;

  beforeEach(() => {
    const localApiServiceSpy = jasmine.createSpyObj('ReleaseStandingOrdersBatchApiService', ['processBatch']);
    const localPageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue({ title: 'Release Orders', subtitle: 'Batch Processing' })
    });
    const localHeaderServiceSpy = createMockHeaderService();
    const localSnackbarServiceSpy = createMockSnackbarService();
    const localDialogSpy = createMockMatDialog();
    const localChapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['convertGmtToLocal']);
    localChapterTimezoneServiceSpy.convertGmtToLocal.and.callFake((m: moment.Moment) => m.clone().add(-300, 'minutes'));

    TestBed.configureTestingModule({
      imports: [ReleaseStandingOrdersBatchComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ReleaseStandingOrdersBatchApiService, useValue: localApiServiceSpy },
        { provide: PageHeaderService, useValue: localPageHeaderServiceSpy },
        { provide: HeaderService, useValue: localHeaderServiceSpy },
        { provide: SnackbarService, useValue: localSnackbarServiceSpy },
        { provide: MatDialog, useValue: localDialogSpy },
        { provide: ChapterTimezoneService, useValue: localChapterTimezoneServiceSpy },
      ],
    });
    TestBed.overrideComponent(ReleaseStandingOrdersBatchComponent, {
      add: { providers: [{ provide: MatDialog, useValue: localDialogSpy }] }
    });

    localFixture = TestBed.createComponent(ReleaseStandingOrdersBatchComponent);
    localComponent = localFixture.componentInstance;
  });

  it('should update headerConfig title and breadcrumbs when pageHeaderData is truthy', () => {
    localFixture.detectChanges();
    expect(localComponent.headerConfig.title).toBe('Release Orders');
    expect(localComponent.headerConfig.subtitle).toBe('Batch Processing');
    expect(localComponent.headerConfig.breadcrumbs.length).toBe(2);
    expect(localComponent.headerConfig.breadcrumbs[1].label).toBe('Release Orders');
  });
});
