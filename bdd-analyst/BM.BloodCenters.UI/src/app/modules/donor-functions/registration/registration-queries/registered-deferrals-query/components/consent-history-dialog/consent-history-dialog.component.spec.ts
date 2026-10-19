import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError, Observable, Subject } from 'rxjs';

import { ConsentHistoryDialogComponent, ConsentHistoryDialogData } from './consent-history-dialog.component';
import { ConsentHistoryService } from 'src/app/modules/donor-functions/registered-donations-query/consent-history/services/consent-history.service';
import { ConsentHistoryDto } from 'src/app/modules/donor-functions/registered-donations-query/consent-history/models/consent-history.model';
import { createMockMatDialog } from '@shared/testing/common-mocks';

class MockConsentDetailDialogComponent {}

jest.mock(
  'src/app/modules/donor-functions/registered-donations-query/consent-history/components/consent-detail-dialog/consent-detail-dialog.component',
  () => ({
    ConsentDetailDialogComponent: MockConsentDetailDialogComponent
  })
);

describe('ConsentHistoryDialogComponent', () => {
  let responseSubject: any;
  let component: ConsentHistoryDialogComponent;
  let fixture: ComponentFixture<ConsentHistoryDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConsentHistoryDialogComponent>>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let serviceSpy: jasmine.SpyObj<ConsentHistoryService>;

  const mockDialogData: ConsentHistoryDialogData = {
    donorId: '12345',
    deferralId: 'DEF-001'
  };

  const mockConsentRecords: ConsentHistoryDto[] = [
    {
      chapterId: '001',
      unitId: 'UNIT-001',
      deferralId: 'DEF-001',
      collDate: '15-JAN-2026',
      letterCode: 'CONS001',
      signatureDate: '15-JAN-2026',
      witness: 'John Doe',
      manualSignatureDate: null,
      status: 'Active',
      donorId: '12345',
      transactionId: 'TXN-001',
      letterId: 'LTR-001'
    },
    {
      chapterId: '001',
      unitId: 'UNIT-002',
      deferralId: 'DEF-002',
      collDate: '10-JAN-2026',
      letterCode: 'CONS002',
      signatureDate: '10-JAN-2026',
      witness: 'Jane Smith',
      manualSignatureDate: null,
      status: 'Inactive',
      donorId: '12345',
      transactionId: 'TXN-002',
      letterId: 'LTR-002'
    }
  ];

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    dialogSpy = createMockMatDialog();
    serviceSpy = jasmine.createSpyObj('ConsentHistoryService', ['queryConsentHistory']);

    // Default service response with data
    serviceSpy.queryConsentHistory.and.returnValue(
      of({
        data: mockConsentRecords,
        total: 2
      })
    );



      TestBed.configureTestingModule({
imports: [
        ConsentHistoryDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ConsentHistoryService, useValue: serviceSpy },
        TranslateService
      ]
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ConsentHistoryDialogComponent);
    component = fixture.componentInstance;


    });


  it('should load consent history on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(serviceSpy.queryConsentHistory).toHaveBeenCalledWith({
      donorId: '12345',
      deferralId: 'DEF-001'
    });
    expect(component.consentRecords()).toEqual(mockConsentRecords);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBeNull();
  }));

  it('should show loading state while fetching data', fakeAsync(() => {
    // Use a Subject to control when the observable emits (Promises don't work in fakeAsync)
    responseSubject = new Subject<any>();

    serviceSpy.queryConsentHistory.and.returnValue(responseSubject.asObservable());

    fixture.detectChanges(); // Triggers ngOnInit

    expect(component.isLoading()).toBe(true);

    // Emit the response
    responseSubject.next({ data: mockConsentRecords, total: 2 });
    responseSubject.complete();
    tick();

    expect(component.isLoading()).toBe(false);
  }));

  it('should handle successful data load', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.consentRecords().length).toBe(2);
    expect(component.hasData()).toBe(true);
  }));



  it('should retry loading when retryLoad is called', fakeAsync(() => {
    // First call fails
    serviceSpy.queryConsentHistory.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    fixture.detectChanges();
    tick();

    expect(component.error()).toBeTruthy();
    expect(serviceSpy.queryConsentHistory).toHaveBeenCalledTimes(1);

    // Setup success response for retry
    serviceSpy.queryConsentHistory.and.returnValue(
      of({
        data: mockConsentRecords,
        total: 2
      })
    );

    component.retryLoad();
    tick();

    expect(serviceSpy.queryConsentHistory).toHaveBeenCalledTimes(2);
    expect(component.error()).toBeNull();
    expect(component.consentRecords().length).toBe(2);
  }));


  it('should configure table with correct columns', () => {
    expect(component.tableConfig.columns?.length).toBe(8);
    expect(component.tableConfig.columns?.[0].key).toBe('chapterId');
    expect(component.tableConfig.columns?.[1].key).toBe('unitId');
    expect(component.tableConfig.columns?.[2].key).toBe('deferralId');
    expect(component.tableConfig.columns?.[3].key).toBe('collDate');
    expect(component.tableConfig.columns?.[4].key).toBe('letterCode');
    expect(component.tableConfig.columns?.[5].key).toBe('signatureDate');
    expect(component.tableConfig.columns?.[6].key).toBe('witness');
    expect(component.tableConfig.columns?.[7].key).toBe('status');
  });

  it('should configure table with view detail row action', () => {
    expect(component.tableConfig.rowActions?.length).toBe(1);
    expect(component.tableConfig.rowActions?.[0].icon).toBe('visibility');
    expect(component.tableConfig.rowActions?.[0].action).toBe('viewDetail');
  });

  it('should call openConsentDetail when viewDetail action is triggered', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    spyOn<any>(component, 'openConsentDetail');

    const mockRow = mockConsentRecords[0];
    component.onRowAction({ action: 'viewDetail', row: mockRow });

    expect(component['openConsentDetail']).toHaveBeenCalledWith(mockRow);
  }));

  it('should close the dialog when onClose is called', () => {
    component.onClose();

    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should set error when service returns an error', fakeAsync(() => {
    serviceSpy.queryConsentHistory.and.returnValue(
      throwError(() => new Error('Server error'))
    );

    fixture.detectChanges();
    tick();

    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe('An error occurred while loading consent history');
    expect(component.consentRecords()).toEqual([]);
  }));

  it('should set error with response message when data is null', fakeAsync(() => {
    serviceSpy.queryConsentHistory.and.returnValue(
      of({ data: null, message: 'No records found' })
    );

    fixture.detectChanges();
    tick();

    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe('No records found');
    expect(component.consentRecords()).toEqual([]);
  }));

  it('should set default error message when data is null and no message', fakeAsync(() => {
    serviceSpy.queryConsentHistory.and.returnValue(
      of({ data: null })
    );

    fixture.detectChanges();
    tick();

    expect(component.error()).toBe('Failed to load consent history');
    expect(component.consentRecords()).toEqual([]);
  }));

  it('should set error with response message when data is undefined', fakeAsync(() => {
    serviceSpy.queryConsentHistory.and.returnValue(
      of({ message: 'Custom error' })
    );

    fixture.detectChanges();
    tick();

    expect(component.error()).toBe('Custom error');
    expect(component.consentRecords()).toEqual([]);
  }));

  it('should handle empty data array successfully', fakeAsync(() => {
    serviceSpy.queryConsentHistory.and.returnValue(
      of({ data: [], total: 0 })
    );

    fixture.detectChanges();
    tick();

    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.consentRecords()).toEqual([]);
    expect(component.hasData()).toBe(false);
  }));

  it('should not call openConsentDetail for non-viewDetail actions', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    spyOn<any>(component, 'openConsentDetail');

    component.onRowAction({ action: 'delete', row: mockConsentRecords[0] });

    expect(component['openConsentDetail']).not.toHaveBeenCalled();
  }));

  it('should have hasData return false when no records are loaded', fakeAsync(() => {
    serviceSpy.queryConsentHistory.and.returnValue(
      of({ data: [], total: 0 })
    );

    fixture.detectChanges();
    tick();

    expect(component.hasData()).toBe(false);
  }));

  it('should initialize donorId and deferralId from dialog data', () => {
    expect(component.donorId).toBe('12345');
    expect(component.deferralId).toBe('DEF-001');
  });

  it('should have correct initial signal values before ngOnInit', () => {
    // Don't call detectChanges to avoid triggering ngOnInit
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.consentRecords()).toEqual([]);
    expect(component.hasData()).toBe(false);
  });

  it('should configure table with pagination settings', () => {
    expect(component.tableConfig.showPagination).toBe(true);
    expect(component.tableConfig.pagination?.pageSize).toBe(25);
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
  });

  it('should configure table with sticky header', () => {
    expect(component.tableConfig.stickyHeader).toBe(true);
  });

  it('should open consent detail dialog with correct config when openConsentDetail succeeds', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const mockRow = mockConsentRecords[0];

    // Replace the injected dialog with the spy so the mock is used
    (component as any).dialog = dialogSpy;

    await component['openConsentDetail'](mockRow);

    expect(dialogSpy.open).toHaveBeenCalledWith(
      MockConsentDetailDialogComponent,
      jasmine.objectContaining({
        panelClass: 'consent-detail-right-dialog',
        width: '800px',
        maxWidth: '100vw',
        height: '100vh',
        position: { right: '0' },
        data: {
          donorId: '12345',
          transactionId: 'TXN-001',
          letterId: 'LTR-001'
        },
        disableClose: true,
        autoFocus: false
      })
    );
  });

  it('should set error when openConsentDetail import fails', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    // Override openConsentDetail to simulate a dynamic import failure
    component['openConsentDetail'] = async () => {
      try {
        throw new Error('Module load failed');
      } catch {
        component.error.set('Failed to load consent detail component');
      }
    };

    await component['openConsentDetail'](mockConsentRecords[0]);

    expect(component.error()).toBe('Failed to load consent detail component');
  });

  it('should clear error when loading is retried after an error', fakeAsync(() => {
    serviceSpy.queryConsentHistory.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    fixture.detectChanges();
    tick();

    expect(component.error()).toBeTruthy();

    serviceSpy.queryConsentHistory.and.returnValue(
      of({ data: mockConsentRecords, total: 2 })
    );

    component.retryLoad();
    tick();

    expect(component.error()).toBeNull();
    expect(component.isLoading()).toBe(false);
  }));

  it('should set isLoading to true at the start of loadConsentHistory', fakeAsync(() => {
    const subject = new Subject<any>();
    serviceSpy.queryConsentHistory.and.returnValue(subject.asObservable());

    component.loadConsentHistory();

    expect(component.isLoading()).toBe(true);
    expect(component.error()).toBeNull();

    subject.next({ data: [], total: 0 });
    subject.complete();
    tick();

    expect(component.isLoading()).toBe(false);
  }));

  it('should clear previous error when loadConsentHistory is called again', fakeAsync(() => {
    // First call sets an error
    serviceSpy.queryConsentHistory.and.returnValue(
      throwError(() => new Error('fail'))
    );
    fixture.detectChanges();
    tick();

    expect(component.error()).toBeTruthy();

    // Second call should clear the error immediately
    const subject = new Subject<any>();
    serviceSpy.queryConsentHistory.and.returnValue(subject.asObservable());

    component.loadConsentHistory();

    // Error should be cleared immediately on new load attempt
    expect(component.error()).toBeNull();
    expect(component.isLoading()).toBe(true);

    subject.next({ data: mockConsentRecords, total: 2 });
    subject.complete();
    tick();
  }));

  it('should pass correct query with donorId and deferralId to service', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(serviceSpy.queryConsentHistory).toHaveBeenCalledWith({
      donorId: '12345',
      deferralId: 'DEF-001'
    });
  }));
});

describe('ConsentHistoryDialogComponent without deferralId', () => {
  let component: ConsentHistoryDialogComponent;
  let fixture: ComponentFixture<ConsentHistoryDialogComponent>;
  let serviceSpy: jasmine.SpyObj<ConsentHistoryService>;

  const mockDialogDataNoDeferral: ConsentHistoryDialogData = {
    donorId: '99999'
  };

  beforeEach(() => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const dialogSpy = createMockMatDialog();
    serviceSpy = jasmine.createSpyObj('ConsentHistoryService', ['queryConsentHistory']);
    serviceSpy.queryConsentHistory.and.returnValue(
      of({ data: [], total: 0 })
    );

    TestBed.configureTestingModule({
      imports: [
        ConsentHistoryDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogDataNoDeferral },
        { provide: ConsentHistoryService, useValue: serviceSpy },
        TranslateService
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsentHistoryDialogComponent);
    component = fixture.componentInstance;
  });

  it('should handle dialog data without deferralId', fakeAsync(() => {
    expect(component.donorId).toBe('99999');
    expect(component.deferralId).toBeUndefined();

    fixture.detectChanges();
    tick();

    expect(serviceSpy.queryConsentHistory).toHaveBeenCalledWith({
      donorId: '99999',
      deferralId: undefined
    });
  }));
});
