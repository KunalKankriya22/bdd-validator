import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import moment from 'moment';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ConsentHistoryComponent } from './consent-history.component';
import { ConsentHistoryService } from './services/consent-history.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ConsentDetailDialogComponent } from './components/consent-detail-dialog/consent-detail-dialog.component';
import { ConsentHistoryDto } from './models/consent-history.model';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('ConsentHistoryComponent', () => {
  let component: ConsentHistoryComponent;
  let fixture: ComponentFixture<ConsentHistoryComponent>;
  let mockService: jasmine.SpyObj<ConsentHistoryService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRouter: any;
  let chapterChanged$: Subject<void>;
  let menuItemsSignal: any;

  const mockConsentData: ConsentHistoryDto[] = [
    {
      chapterId: 'CH01',
      unitId: 'W0352001234',
      deferralId: 'DEF001',
      collDate: '2028-01-15T00:00:00',
      letterCode: 'LC01',
      signatureDate: '2028-01-15T10:30:00',
      witness: 'WITNESS1',
      manualSignatureDate: null,
      status: 'Accepted',
      donorId: 'DON001',
      transactionId: 'TXN001',
      letterId: 'LTR001',
    },
    {
      chapterId: 'CH01',
      unitId: null,
      deferralId: null,
      collDate: '2028-01-16T00:00:00',
      letterCode: 'LC02',
      signatureDate: '2028-01-16T14:00:00',
      witness: null,
      manualSignatureDate: '2028-01-16T00:00:00',
      status: 'Decline',
      donorId: 'DON001',
      transactionId: 'TXN002',
      letterId: 'LTR002',
    },
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ConsentHistoryService', [
      'queryConsentHistory',
      'getDonorInfo',
    ]);

    chapterChanged$ = new Subject<void>();

    menuItemsSignal = jasmine.createSpy('menuItemsSignal').and.returnValue([]);
    const mockMenuService = {
      getMenuItemsSignal: jasmine.createSpy('getMenuItemsSignal').and.returnValue(menuItemsSignal),
      findMenuItemByPath: jasmine.createSpy('findMenuItemByPath').and.returnValue(undefined),
    };

    const mockHeaderService = {
      chapterChanged$: chapterChanged$.asObservable(),
    };

    mockDialog = createMockMatDialog();
    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
      events: EMPTY,
      url: '/consent-history',
    };

    const mockPageHeaderService = {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null),
    };

    mockService.queryConsentHistory.and.returnValue(
      of({ data: [], total: 0 })
    );
    mockService.getDonorInfo.and.returnValue(
      of({ donorId: 'DON001', donorName: 'Smith, John', address: '123 Main St' })
    );

    TestBed.configureTestingModule({
      imports: [ConsentHistoryComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: ConsentHistoryService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
      ],
    });

    mockService.queryConsentHistory.calls.reset();
    mockService.getDonorInfo.calls.reset();
    mockDialog.open.calls.reset();

    fixture = TestBed.createComponent(ConsentHistoryComponent);
    component = fixture.componentInstance;
    (component as any).dialog = mockDialog;
  });

  describe('Component Initialization', () => {
    it('should initialize with empty data', () => {
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBeFalse();
      expect(component.hasRetrievedData).toBeFalse();
      expect(component.isDialogOpen).toBeFalse();
    });

    it('should initialize donorId as empty string', () => {
      expect(component.donorId).toBe('');
    });

    it('should call getDonorInfo but not queryConsentHistory on init when only donorId is in state', () => {
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001' },
      });
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.donorId).toBe('DON001');
      expect(mockService.getDonorInfo).toHaveBeenCalledWith('DON001');
      expect(mockService.queryConsentHistory).not.toHaveBeenCalled();
    });

    it('should redirect to registered-donations-query when no donorId in state', () => {
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: {},
      });
      component.ngOnInit();
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/donor-functions/registration/registered-donations-query',
      ]);
      expect(mockService.queryConsentHistory).not.toHaveBeenCalled();
    });
  });

  describe('Donor Info Loading', () => {
    it('should update header with uppercase donor name on success', () => {
      mockService.getDonorInfo.and.returnValue(
        of({ donorId: 'DON001', donorName: 'Smith, John', address: '123 Main St, Chicago, IL 60606' })
      );
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001' },
      });
      component.ngOnInit();

      expect(component.donorName).toBe('Smith, John');
      expect(component.donorAddress).toBe('123 Main St, Chicago, IL 60606');
      expect(component.headerConfig.title).toBe('SMITH, JOHN');
      expect(component.headerConfig.subtitle).toBe('');
    });

    it('should handle null address', () => {
      mockService.getDonorInfo.and.returnValue(
        of({ donorId: 'DON001', donorName: 'Smith, John', address: null })
      );
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001' },
      });
      component.ngOnInit();

      expect(component.donorAddress).toBe('');
    });
  });

  describe('Table Configuration', () => {
    it('should have one row action (viewDetail)', () => {
      expect(component.tableConfig.rowActions?.length).toBe(1);
      expect(component.tableConfig.rowActions?.[0].action).toBe('viewDetail');
      expect(component.tableConfig.rowActions?.[0].icon).toBe('visibility');
    });

    it('should not show actions as menu', () => {
      expect(component.tableConfig.showActionsAsMenu).toBeFalse();
    });

    it('should have row highlight disabled', () => {
      expect(component.tableConfig.enableRowHighlight).toBeFalse();
    });
  });

  describe('Value Formatters', () => {
    it('should return "--" for null chapterId', () => {
      const formatter = component.tableConfig.columns[0].valueFormatter!;
      expect(formatter(null as any, {} as any)).toBe('--');
    });

    it('should return chapterId value when present', () => {
      const formatter = component.tableConfig.columns[0].valueFormatter!;
      expect(formatter('CH01', {} as any)).toBe('CH01');
    });

    it('should return "--" for null unitId', () => {
      const formatter = component.tableConfig.columns[1].valueFormatter!;
      expect(formatter(null, {} as any)).toBe('--');
    });

    it('should return unitId value when present', () => {
      const formatter = component.tableConfig.columns[1].valueFormatter!;
      expect(formatter('W001', {} as any)).toBe('W001');
    });

    it('should return "--" for null collDate', () => {
      const formatter = component.tableConfig.columns[3].valueFormatter!;
      expect(formatter(null, {} as any)).toBe('--');
    });

    it('should format collDate as DD-MMM-YYYY uppercase', () => {
      const formatter = component.tableConfig.columns[3].valueFormatter!;
      expect(formatter('2028-01-15T00:00:00', {} as any)).toBe('15-JAN-2028');
    });

    it('should return "--" for invalid date string', () => {
      const formatter = component.tableConfig.columns[3].valueFormatter!;
      expect(formatter('not-a-date', {} as any)).toBe('--');
    });

    it('should format signatureDate correctly', () => {
      const formatter = component.tableConfig.columns[5].valueFormatter!;
      expect(formatter('2028-03-20T08:00:00', {} as any)).toBe('20-MAR-2028');
    });

    it('should format manualSignatureDate correctly', () => {
      const formatter = component.tableConfig.columns[7].valueFormatter!;
      expect(formatter('2028-06-01T00:00:00', {} as any)).toBe('01-JUN-2028');
    });

    it('should return "--" for null status', () => {
      const formatter = component.tableConfig.columns[8].valueFormatter!;
      expect(formatter(null, {} as any)).toBe('--');
    });

    it('should return status value when present', () => {
      const formatter = component.tableConfig.columns[8].valueFormatter!;
      expect(formatter('Accepted', {} as any)).toBe('Accepted');
    });
  });

  describe('Filter Form', () => {
    it('should initialize with all null values', () => {
      expect(component.filterForm.get('collDateFrom')?.value).toBeNull();
      expect(component.filterForm.get('collDateTo')?.value).toBeNull();
      expect(component.filterForm.get('deferralId')?.value).toBeNull();
    });

    it('isClearAllDisabled should return true when all filters empty', () => {
      expect(component.isClearAllDisabled).toBeTrue();
    });

    it('isClearAllDisabled should return false when deferralId is set', () => {
      component.filterForm.patchValue({ deferralId: 'DEF001' });
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('onClearAll should reset form without reloading data', () => {
      component.donorId = 'DON001';
      component.filterForm.patchValue({ deferralId: 'DEF001' });
      mockService.queryConsentHistory.calls.reset();

      component.onClearAll();

      expect(component.filterForm.get('collDateFrom')?.value).toBeNull();
      expect(component.filterForm.get('collDateTo')?.value).toBeNull();
      expect(component.filterForm.get('deferralId')?.value).toBeNull();
      expect(component.dataSource).toEqual([]);
      expect(component.hasRetrievedData).toBeFalse();
      expect(mockService.queryConsentHistory).not.toHaveBeenCalled();
    });
  });

  describe('loadData', () => {
    beforeEach(() => {
      component.donorId = 'DON001';
    });

    it('should populate dataSource on success', () => {
      mockService.queryConsentHistory.and.returnValue(
        of({ data: mockConsentData, total: 2 })
      );

      (component as any).loadData();

      expect(component.dataSource).toEqual(mockConsentData);
      expect(component.isLoading).toBeFalse();
      expect(component.hasRetrievedData).toBeTrue();
    });

    it('should set empty dataSource on error', () => {
      mockService.queryConsentHistory.and.returnValue(
        throwError(() => new Error('API fail'))
      );

      (component as any).loadData();

      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBeFalse();
      expect(component.hasRetrievedData).toBeTrue();
    });

    it('should set isLoading to true at start of load', () => {
      const subject = new Subject<any>();
      mockService.queryConsentHistory.and.returnValue(subject.asObservable());

      (component as any).loadData();

      expect(component.isLoading).toBeTrue();
      expect(component.hasRetrievedData).toBeFalse();

      subject.next({ data: [], total: 0 });
      subject.complete();

      expect(component.isLoading).toBeFalse();
    });

    it('should pass donorId and null filters when form is empty', () => {
      mockService.queryConsentHistory.and.returnValue(
        of({ data: [], total: 0 })
      );

      (component as any).loadData();

      expect(mockService.queryConsentHistory).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donorId: 'DON001',
          fromDate: null,
          toDate: null,
          unitId: null,
          deferralId: null,
        })
      );
    });

    it('should pass deferralId filter when set', () => {
      component.filterForm.patchValue({ deferralId: 'DEF123' });
      mockService.queryConsentHistory.and.returnValue(
        of({ data: [], total: 0 })
      );

      (component as any).loadData();

      expect(mockService.queryConsentHistory).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donorId: 'DON001',
          deferralId: 'DEF123',
        })
      );
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      component.donorId = 'DON001';
      (component as any).subscribeToChapterChanges();
    });

    it('should clear data without reloading when chapter changes', () => {
      component.dataSource = [...mockConsentData];
      component.hasRetrievedData = true;
      mockService.queryConsentHistory.calls.reset();

      chapterChanged$.next();

      expect(component.dataSource).toEqual([]);
      expect(component.hasRetrievedData).toBeFalse();
      expect(mockService.queryConsentHistory).not.toHaveBeenCalled();
    });
  });

  describe('onRowAction', () => {
    let afterClosedSubject: Subject<void>;

    beforeEach(() => {
      afterClosedSubject = new Subject<void>();
      mockDialog.open.and.returnValue({
        afterClosed: () => afterClosedSubject.asObservable(),
      } as MatDialogRef<any>);
    });

    it('should set activeRow when action is triggered', () => {
      const row = mockConsentData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'viewDetail', row });

      expect(component.dataTableComponent.activeRow).toBe(row);
    });

    it('should set isDialogOpen to true on viewDetail', () => {
      const row = mockConsentData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'viewDetail', row });

      expect(component.isDialogOpen).toBeTrue();
    });

    it('should pass correct dialog config', () => {
      const row = mockConsentData[1];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'viewDetail', row });

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConsentDetailDialogComponent,
        jasmine.objectContaining({
          data: {
            donorId: 'DON001',
            transactionId: 'TXN002',
            letterId: 'LTR002',
          },
          maxWidth: '100vw',
          height: '100vh',
          position: { right: '0' },
          disableClose: true,
          autoFocus: false,
        })
      );
    });

    it('should clear activeRow and isDialogOpen when dialog closes', () => {
      const row = mockConsentData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'viewDetail', row });
      expect(component.isDialogOpen).toBeTrue();
      expect(component.dataTableComponent.activeRow).toBe(row);

      afterClosedSubject.next();
      afterClosedSubject.complete();

      expect(component.isDialogOpen).toBeFalse();
      expect(component.dataTableComponent.activeRow).toBeNull();
    });

    it('should not open dialog for non-viewDetail actions', () => {
      const row = mockConsentData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'otherAction', row });

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(component.isDialogOpen).toBeFalse();
    });

    it('should still set activeRow for non-viewDetail actions', () => {
      const row = mockConsentData[0];
      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'otherAction', row });

      expect(component.dataTableComponent.activeRow).toBe(row);
    });

    it('should not throw when dataTableComponent is not set', () => {
      component.dataTableComponent = undefined as any;

      expect(() => {
        component.onRowAction({
          action: 'viewDetail',
          row: mockConsentData[0],
        });
      }).not.toThrow();
    });
  });
  describe('onRetrieve', () => {
    it('should set requiredWithPair error on To field when only From is filled', () => {
      component.donorId = 'DON001';
      component.filterForm.patchValue({
        collDateFrom: moment('2028-01-01', 'YYYY-MM-DD'),
      }, { emitEvent: false });
      mockService.queryConsentHistory.calls.reset();

      component.onRetrieve();

      expect(component.filterForm.get('collDateTo')?.hasError('requiredWithPair')).toBeTrue();
      expect(mockService.queryConsentHistory).not.toHaveBeenCalled();
    });

    it('should set requiredWithPair error on From field when only To is filled', () => {
      component.donorId = 'DON001';
      component.filterForm.patchValue({
        collDateTo: moment('2028-01-15', 'YYYY-MM-DD'),
      }, { emitEvent: false });
      mockService.queryConsentHistory.calls.reset();

      component.onRetrieve();

      expect(component.filterForm.get('collDateFrom')?.hasError('requiredWithPair')).toBeTrue();
      expect(mockService.queryConsentHistory).not.toHaveBeenCalled();
    });

    it('should clear requiredWithPair error when missing date is filled', () => {
      component.donorId = 'DON001';
      component.filterForm.patchValue({
        collDateFrom: moment('2028-01-01', 'YYYY-MM-DD'),
      }, { emitEvent: false });

      component.onRetrieve();
      expect(component.filterForm.get('collDateTo')?.hasError('requiredWithPair')).toBeTrue();

      component.filterForm.patchValue({
        collDateTo: moment('2028-01-15', 'YYYY-MM-DD'),
      });

      expect(component.filterForm.get('collDateTo')?.hasError('requiredWithPair')).toBeFalse();
    });
  });

  describe('Unit ID callbacks', () => {
    it('should not throw on onUnitValidated', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });

    it('should not throw on onUnitCleared', () => {
      expect(() => component.onUnitCleared()).not.toThrow();
    });

    it('should set filtersChanged on onUnitValidated when auto-loaded', () => {
      component.isAutoLoaded = true;
      component.onUnitValidated({} as any);
      expect(component.filtersChanged).toBeTrue();
    });

    it('should set filtersChanged on onUnitCleared when auto-loaded', () => {
      component.isAutoLoaded = true;
      component.onUnitCleared();
      expect(component.filtersChanged).toBeTrue();
    });

    it('should not set filtersChanged on onUnitValidated when not auto-loaded', () => {
      component.isAutoLoaded = false;
      component.onUnitValidated({} as any);
      expect(component.filtersChanged).toBeFalse();
    });
  });

  describe('Auto-populate from parent state', () => {
    beforeEach(() => {
      mockService.queryConsentHistory.and.returnValue(
        of({ data: mockConsentData, total: 2 })
      );
    });

    it('should auto-populate collDateFrom and collDateTo from collectionDate', () => {
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001', collectionDate: '2026-01-15T00:00:00' },
      });
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.filterForm.get('collDateFrom')?.value).toBeTruthy();
      expect(component.filterForm.get('collDateTo')?.value).toBeTruthy();
    });

    it('should auto-fetch data when unitId and collectionDate are in state', () => {
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001', unitId: 'W633325021701', collectionDate: '2026-01-15T00:00:00' },
      });
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockService.queryConsentHistory).toHaveBeenCalled();
      expect(component.dataSource).toEqual(mockConsentData);
    });

    it('should pass initialUnitId in query when auto-fetching', () => {
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001', unitId: 'W633325021701', collectionDate: '2026-01-15T00:00:00' },
      });
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockService.queryConsentHistory).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donorId: 'DON001',
          unitId: 'W633325021701',
        })
      );
    });

    it('should set isAutoLoaded after auto-fetch completes', () => {
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001', unitId: 'W633325021701', collectionDate: '2026-01-15T00:00:00' },
      });
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.isAutoLoaded).toBeTrue();
    });

    it('should not auto-fetch when no unitId or collectionDate in state', () => {
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001' },
      });
      component.ngOnInit();
      fixture.detectChanges();

      expect(mockService.queryConsentHistory).not.toHaveBeenCalled();
      expect(component.isAutoLoaded).toBeFalse();
    });

    it('should not auto-populate dates when collectionDate is null', () => {
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001', unitId: 'W633325021701' },
      });
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.filterForm.get('collDateFrom')?.value).toBeNull();
      expect(component.filterForm.get('collDateTo')?.value).toBeNull();
    });
  });
  describe('onClearAll with auto-load state', () => {
    it('should reset isAutoLoaded and filtersChanged', () => {
      component.isAutoLoaded = true;
      component.filtersChanged = true;
      (component as any).initialUnitId = 'W633325021701';

      component.onClearAll();

      expect(component.isAutoLoaded).toBeFalse();
      expect(component.filtersChanged).toBeFalse();
      expect((component as any).initialUnitId).toBeNull();
    });
  });

  describe('onBack', () => {
    it('should navigate to registered donations query path by default', () => {
      (component as any).sourcePath = null;
      (component as any).sourceDonorId = null;

      component.onBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/donor-functions/registration/registered-donations-query',
      ]);
    });

    it('should navigate with reopenDonorId when sourcePath and sourceDonorId exist', () => {
      (component as any).sourcePath = '/some-other-path';
      (component as any).sourceDonorId = 'DON001';

      component.onBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/some-other-path'],
        { state: { reopenDonorId: 'DON001' } }
      );
    });
  });

  describe('onFromDateInput / onToDateInput', () => {
    it('should call DateFieldValidationUtility.handleEndDateInput for from date', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const mockEvent = { target: { value: '15-JAN-2028' } } as unknown as Event;

      component.onFromDateInput(mockEvent);

      expect(spy).toHaveBeenCalledWith(
        '15-JAN-2028',
        component.filterForm.get('collDateFrom')
      );
    });

    it('should call DateFieldValidationUtility.handleEndDateInput for to date', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const mockEvent = { target: { value: '31-JAN-2028' } } as unknown as Event;

      component.onToDateInput(mockEvent);

      expect(spy).toHaveBeenCalledWith(
        '31-JAN-2028',
        component.filterForm.get('collDateTo')
      );
    });
  });

  describe('validateDates', () => {
    it('should set futureDate error when from date is in the future', () => {
      const futureDate = moment('2029-06-01', 'YYYY-MM-DD');
      component.filterForm.get('collDateFrom')?.setValue(futureDate);

      const fromControl = component.filterForm.get('collDateFrom');
      expect(fromControl?.hasError('futureDate')).toBeTrue();
    });

    it('should set fromAfterTo error when from date is after to date', () => {
      const fromDate = moment('2025-03-15', 'YYYY-MM-DD');
      const toDate = moment('2025-03-01', 'YYYY-MM-DD');

      component.filterForm.get('collDateTo')?.setValue(toDate, { emitEvent: false });
      component.filterForm.get('collDateFrom')?.setValue(fromDate);

      const fromControl = component.filterForm.get('collDateFrom');
      expect(fromControl?.hasError('fromAfterTo')).toBeTrue();
    });

    it('should clear custom errors when dates are valid', () => {
      const futureDate = moment('2029-06-01', 'YYYY-MM-DD');
      component.filterForm.get('collDateFrom')?.setValue(futureDate);
      expect(component.filterForm.get('collDateFrom')?.hasError('futureDate')).toBeTrue();

      const pastDate = moment('2025-01-01', 'YYYY-MM-DD');
      component.filterForm.get('collDateFrom')?.setValue(pastDate);
      expect(component.filterForm.get('collDateFrom')?.hasError('futureDate')).toBeFalse();
    });
  });

  describe('isRetrieveDisabled', () => {
    it('should be true when loading', () => {
      component.isLoading = true;
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be false when not loading and form is valid', () => {
      component.isLoading = false;
      component.isAutoLoaded = false;
      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('loadDonorInfo error', () => {
    it('should handle error when loadDonorInfo fails', () => {
      mockService.getDonorInfo.and.returnValue(
        throwError(() => new Error('API fail'))
      );
      Object.defineProperty(window.history, 'state', {
        writable: true,
        configurable: true,
        value: { donorId: 'DON001' },
      });
      component.ngOnInit();

      expect(component.headerConfig.title).toBe('DON001');
      expect(component.headerConfig.subtitle).toBe('');
    });
  });
});
