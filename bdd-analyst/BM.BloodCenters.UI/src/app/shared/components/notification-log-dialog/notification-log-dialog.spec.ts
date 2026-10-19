import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { NotificationLogDialogComponent, NotificationLogDialogData } from './notification-log-dialog';
import { NotificationLogService } from '../../services/notification-log.service';

describe('NotificationLogDialogComponent', () => {
  let dialogRefSpy: any;
  let serviceSpy: any;
  let component: NotificationLogDialogComponent;
  let fixture: ComponentFixture<NotificationLogDialogComponent>;
  let service: jasmine.SpyObj<NotificationLogService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<NotificationLogDialogComponent>>;

  const mockData: NotificationLogDialogData = {
    donorId: 'D12345',
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('NotificationLogService', [
      'getDonorInfo',
      'getCommunicationTypes',
      'getCommunicationCodes',
      'getNotificationLogs',
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [NotificationLogDialogComponent],
      providers: [
        { provide: NotificationLogService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ]
    });


    


      serviceSpy.getDonorInfo.calls.reset();


      serviceSpy.getCommunicationTypes.calls.reset();


      serviceSpy.getCommunicationCodes.calls.reset();


      serviceSpy.getNotificationLogs.calls.reset();


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(NotificationLogDialogComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(NotificationLogService) as jasmine.SpyObj<NotificationLogService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<NotificationLogDialogComponent>>;


    });


  it('should have correct dialog data injected', () => {
    // Assert
    expect(component.data).toEqual(mockData);
    expect(component.data.donorId).toBe('D12345');
  });

  it('should load communication types on init', () => {
    // Arrange
    const mockDonorInfo = {
      donorName: 'Doe, John',
      dateOfBirth: '01-15-1980',
      sex: 'M',
      abo: 'O+',
      address: '123 Main St',
      homePhone: '555-1234',
      businessPhone: '555-5678',
    };
    const mockTypes = [
      { code: 'EMAIL', description: 'Email Communication' },
      { code: 'PHONE', description: 'Phone Call' },
    ];
    service.getDonorInfo.and.returnValue(of(mockDonorInfo));
    service.getCommunicationTypes.and.returnValue(of(mockTypes));
    service.getNotificationLogs.and.returnValue(of([]));

    // Act
    component.ngOnInit();

    // Assert
    expect(service.getCommunicationTypes).toHaveBeenCalledWith('D12345');
    expect(component.communicationTypes().length).toBe(2);
    expect(component.communicationTypes()[0].value).toBe('EMAIL');
    expect(component.communicationTypes()[0].label).toBe('EMAIL - Email Communication');
    expect(component.communicationTypes()[1].value).toBe('PHONE');
  });

  it('should load initial data on init', () => {
    // Arrange
    const mockDonorInfo = {
      donorName: 'Doe, John',
      dateOfBirth: '01-15-1980',
      sex: 'M',
      abo: 'O+',
      address: '123 Main St',
      homePhone: '555-1234',
      businessPhone: '555-5678',
    };
    const mockCommunications = [
      {
        dateAndTime: '2026-04-28T10:30:00Z',
        communicationType: 'EMAIL',
        communicationTypeDescription: 'Email Communication',
        communicationCode: 'APPT',
        communicationCodeDescription: 'Appointment Reminder',
        actionCode: '',
        actionCodeDescription: '',
        comments: '',
        staffId: '',
        staffName: '',
        insertUserName: 'Test User',
        letterId: '',
      },
    ];
    service.getDonorInfo.and.returnValue(of(mockDonorInfo));
    service.getCommunicationTypes.and.returnValue(of([]));
    service.getNotificationLogs.and.returnValue(of(mockCommunications));

    // Act
    component.ngOnInit();

    // Assert
    expect(service.getDonorInfo).toHaveBeenCalledWith('D12345');
    expect(service.getCommunicationTypes).toHaveBeenCalledWith('D12345');
    expect(service.getNotificationLogs).toHaveBeenCalledWith('D12345');
    expect(component.donorInfo()).toEqual(mockDonorInfo);
    expect(component.dataSource().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should load communication codes when type changes', () => {
    // Arrange
    const mockCodes = [
      { code: 'APPT', description: 'Appointment Reminder' },
      { code: 'CONF', description: 'Confirmation' },
    ];
    service.getCommunicationCodes.and.returnValue(of(mockCodes));
    component.selectedComType.set('EMAIL');

    // Act
    component.onComTypeChange();

    // Assert
    expect(service.getCommunicationCodes).toHaveBeenCalledWith('D12345', 'EMAIL');
    expect(component.communicationCodes().length).toBe(2);
    expect(component.selectedComCode()).toBe('');
  });





  it('should select row when clicked', () => {
    // Arrange
    const mockRow = {
      dateAndTime: '2026-04-28T10:30:00Z',
      communicationType: 'EMAIL',
      communicationTypeDescription: 'Email Communication',
      communicationCode: 'APPT',
      communicationCodeDescription: 'Appointment',
      actionCode: '',
      actionCodeDescription: '',
      comments: 'Test',
      staffId: '',
      staffName: '',
      insertUserName: 'User',
      letterId: '',
    };

    // Act
    component.onRowClick(mockRow);

    // Assert
    expect(component.selectedRow()).toEqual(mockRow);
  });



  it('should handle error when loading initial data fails', () => {
    // Arrange
    const error = new Error('API Error');
    service.getDonorInfo.and.returnValue(throwError(() => error));
    service.getCommunicationTypes.and.returnValue(of([]));
    service.getNotificationLogs.and.returnValue(of([]));
    spyOn(console, 'error');

    // Act
    component.ngOnInit();

    // Assert
    expect(console.error).toHaveBeenCalledWith('Failed to load initial data:', error);
    expect(component.initialLoading()).toBe(false);
  });



  it('should show all types when search is cleared', (done) => {
    // Arrange
    service.getDonorInfo.and.returnValue(of({
      donorName: 'Test', dateOfBirth: '01-01-1990', sex: 'M', abo: 'O+',
      address: '', homePhone: '', businessPhone: ''
    }));
    service.getCommunicationTypes.and.returnValue(of([
      { code: 'EMAIL', description: 'Email Communication' },
      { code: 'PHONE', description: 'Phone Call' },
    ]));
    service.getNotificationLogs.and.returnValue(of([]));

    // Initialize component to set up subscriptions
    component.ngOnInit();
    fixture.detectChanges();

    // First filter, then clear
    component.comTypeSearchControl.setValue('email');
    setTimeout(() => {
      component.comTypeSearchControl.setValue('');

      // Assert - should show all types
      setTimeout(() => {
        expect(component.filteredComTypes().length).toBe(2);
        done();
      }, 100);
    }, 100);
  });

  // --- Helper to init component with defaults ---
  function initComponent(comms: any[] = []) {
    service.getDonorInfo.and.returnValue(of({
      donorName: 'Test', dateOfBirth: '01-01-1990', sex: 'M', abo: 'O+',
      address: '', homePhone: '', businessPhone: ''
    }));
    service.getCommunicationTypes.and.returnValue(of([
      { code: 'EMAIL', description: 'Email' },
      { code: 'PHONE', description: 'Phone' },
    ]));
    service.getNotificationLogs.and.returnValue(of(comms));
    component.ngOnInit();
  }

  it('should close dialog on onClose', () => {
    initComponent();
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should call trackByValue correctly', () => {
    expect(component.trackByValue(0, { value: 'ABC', label: 'test' })).toBe('ABC');
  });

  it('should clear all selections and reload on onClearAll', () => {
    initComponent();
    component.selectedComType.set('EMAIL');
    component.selectedComCode.set('APPT');
    component.communicationCodes.set([{ value: 'APPT', label: 'APPT' }]);
    component.currentSearchText.set('test');

    // Reset calls to track reload
    service.getNotificationLogs.calls.reset();
    component.onClearAll();

    expect(component.selectedComType()).toBe('');
    expect(component.selectedComCode()).toBe('');
    expect(component.communicationCodes().length).toBe(0);
    expect(component.currentSearchText()).toBe('');
    expect(service.getNotificationLogs).toHaveBeenCalledWith('D12345', undefined, undefined);
  });

  it('should not call loadNotificationLogs when onRetrieve is called without comType', () => {
    initComponent();
    spyOn(console, 'warn');
    component.selectedComType.set('');
    component.selectedComCode.set('APPT');

    service.getNotificationLogs.calls.reset();
    component.onRetrieve();

    // getNotificationLogs should NOT be called again for a retrieve since comType is empty
    expect(service.getNotificationLogs).not.toHaveBeenCalled();
  });

  it('should load notification logs when onRetrieve is called with type and code', () => {
    initComponent();
    component.selectedComType.set('EMAIL');
    component.selectedComCode.set('APPT');
    service.getNotificationLogs.calls.reset();

    component.onRetrieve();

    expect(service.getNotificationLogs).toHaveBeenCalledWith('D12345', 'EMAIL', 'APPT');
  });

  it('should handle onComTypeChange when no type selected', () => {
    initComponent();
    component.selectedComType.set('');
    component.onComTypeChange();
    expect(service.getCommunicationCodes).not.toHaveBeenCalled();
    expect(component.selectedComCode()).toBe('');
  });

  it('should handle onComCodeChange without error', () => {
    initComponent();
    expect(() => component.onComCodeChange()).not.toThrow();
  });

  it('should handle sort change', () => {
    initComponent([
      { communicationType: 'EMAIL', dateAndTime: '2026-01-01T10:00:00Z', communicationCode: 'A', communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
      { communicationType: 'PHONE', dateAndTime: '2026-02-01T10:00:00Z', communicationCode: 'B', communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
    ]);
    component.tableConfig.sortConfig = { column: 'dateAndTime', direction: 'A' };
    component.onSortChange({ column: 'communicationType', direction: 'A' });
    expect(component.tableConfig.sortConfig!.column).toBe('communicationType');
    expect(component.tableConfig.sortConfig!.direction).toBe('A');
  });

  it('should handle onRowAction', () => {
    initComponent();
    const mockRow = { communicationType: 'EMAIL', communicationCode: 'APPT' } as any;
    component.onRowAction({ action: 'view', row: mockRow });
    expect(component.selectedRow()).toEqual(mockRow);
  });

  it('should filter communications on search with >= 3 chars', () => {
    initComponent([
      { communicationType: 'EMAIL', communicationCode: 'A', dateAndTime: null, communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
      { communicationType: 'PHONE', communicationCode: 'B', dateAndTime: null, communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
    ]);
    component.onSearch('EMA');
    expect(component.dataSource().length).toBe(1);
    expect(component.dataSource()[0].communicationType).toBe('EMAIL');
  });

  it('should show all communications when search < 3 chars', () => {
    initComponent([
      { communicationType: 'EMAIL', communicationCode: 'A', dateAndTime: null, communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
      { communicationType: 'PHONE', communicationCode: 'B', dateAndTime: null, communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
    ]);
    component.onSearch('EM');
    expect(component.dataSource().length).toBe(2);
  });

  it('should clear search on onSearchCleared', () => {
    initComponent([
      { communicationType: 'EMAIL', communicationCode: 'A', dateAndTime: null, communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
    ]);
    component.onSearch('EMA');
    component.onSearchCleared();
    expect(component.currentSearchText()).toBe('');
    expect(component.dataSource().length).toBe(1);
  });

  it('should handle ngAfterViewInit without error', () => {
    initComponent();
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });

  it('should handle ngOnDestroy without error', () => {
    initComponent();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should open new communication dialog', () => {
    initComponent();
    const afterClosed$ = new Subject<any>();
    const dialogServiceSpy = spyOn(component['dialogService'], 'open').and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

    component.openNewCommunication();
    expect(dialogServiceSpy).toHaveBeenCalled();

    // Simulate save result - should reload
    service.getNotificationLogs.calls.reset();
    afterClosed$.next({ action: 'save', data: {} });
    expect(service.getNotificationLogs).toHaveBeenCalled();
  });

  it('should not reload after new communication cancel', () => {
    initComponent();
    const afterClosed$ = new Subject<any>();
    spyOn(component['dialogService'], 'open').and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

    component.openNewCommunication();
    service.getNotificationLogs.calls.reset();
    afterClosed$.next(undefined);
    expect(service.getNotificationLogs).not.toHaveBeenCalled();
  });

  it('should open details dialog and refresh on save', () => {
    initComponent();
    const afterClosed$ = new Subject<any>();
    const dialogServiceSpy = spyOn(component['dialogService'], 'open').and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);
    const mockRow = { communicationType: 'EMAIL' } as any;

    component.openDetails(mockRow);
    expect(dialogServiceSpy).toHaveBeenCalled();

    service.getNotificationLogs.calls.reset();
    afterClosed$.next({ action: 'save', data: {} });
    expect(service.getNotificationLogs).toHaveBeenCalled();
  });

  it('should open details and refresh codes when comType is selected', () => {
    initComponent();
    component.selectedComType.set('EMAIL');
    const afterClosed$ = new Subject<any>();
    spyOn(component['dialogService'], 'open').and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

    service.getCommunicationCodes.and.returnValue(of([{ code: 'X', description: 'Y' }]));
    component.openDetails({} as any);

    service.getCommunicationCodes.calls.reset();
    afterClosed$.next({ action: 'save', data: {} });
    expect(service.getCommunicationCodes).toHaveBeenCalledWith('D12345', 'EMAIL');
  });

  it('should open letter details dialog', () => {
    initComponent();
    const afterClosed$ = new Subject<any>();
    const dialogServiceSpy = spyOn(component['dialogService'], 'open').and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);
    const mockRow = { communicationType: 'LETTER' } as any;

    component.openLetterDetails(mockRow);
    expect(dialogServiceSpy).toHaveBeenCalled();

    afterClosed$.next(undefined);
    // No error expected
  });

  it('should handle loadCommunicationCodes error', () => {
    initComponent();
    component.selectedComType.set('EMAIL');
    service.getCommunicationCodes.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.onComTypeChange();

    expect(component.loadingCodes()).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle loadNotificationLogs error on retrieve', () => {
    initComponent();
    component.selectedComType.set('EMAIL');
    component.selectedComCode.set('APPT');
    service.getNotificationLogs.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.onRetrieve();

    expect(component.loading()).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('should sort by string columns', () => {
    initComponent([
      { communicationType: 'PHONE', communicationCode: 'B', dateAndTime: null, communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
      { communicationType: 'EMAIL', communicationCode: 'A', dateAndTime: null, communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
    ]);
    component.tableConfig.sortConfig = { column: 'communicationType', direction: 'A' };
    component.onSortChange({ column: 'communicationType', direction: 'A' });
    expect(component.dataSource()[0].communicationType).toBe('EMAIL');
  });

  it('should sort by date columns descending', () => {
    initComponent([
      { communicationType: 'EMAIL', dateAndTime: '2026-01-01T10:00:00Z', communicationCode: '', communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
      { communicationType: 'PHONE', dateAndTime: '2026-06-01T10:00:00Z', communicationCode: '', communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
    ]);
    component.tableConfig.sortConfig = { column: 'dateAndTime', direction: 'D' };
    component.onSortChange({ column: 'dateAndTime', direction: 'D' });
    expect(component.dataSource()[0].communicationType).toBe('PHONE');
  });

  it('should handle null values in sort', () => {
    initComponent([
      { communicationType: 'EMAIL', dateAndTime: null, actionCode: null, communicationCode: '', communicationTypeDescription: '', communicationCodeDescription: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
      { communicationType: 'PHONE', dateAndTime: '2026-06-01T10:00:00Z', actionCode: 'ACT', communicationCode: '', communicationTypeDescription: '', communicationCodeDescription: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
    ]);
    component.tableConfig.sortConfig = { column: 'actionCode', direction: 'A' };
    component.onSortChange({ column: 'actionCode', direction: 'A' });
    // null should sort to end
    expect(component.dataSource()[0].actionCode).toBe('ACT');
  });

  it('should set shouldAddTopPadding on 404 error', () => {
    service.getDonorInfo.and.returnValue(throwError(() => ({ status: 404 })));
    service.getCommunicationTypes.and.returnValue(of([]));
    service.getNotificationLogs.and.returnValue(of([]));
    spyOn(console, 'error');

    component.ngOnInit();

    expect(component.shouldAddTopPadding()).toBe(true);
  });

  it('should clear selected row when filtered out by search', () => {
    initComponent([
      { communicationType: 'EMAIL', communicationCode: 'A', dateAndTime: null, communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
      { communicationType: 'PHONE', communicationCode: 'B', dateAndTime: null, communicationTypeDescription: '', communicationCodeDescription: '', actionCode: '', actionCodeDescription: '', comments: '', staffId: '', staffName: '', insertUserName: '', letterId: '' },
    ]);
    // Select the PHONE row
    component.onRowClick(component.dataSource()[1]);
    expect(component.selectedRow()!.communicationType).toBe('PHONE');

    // Search for EMAIL - PHONE should be deselected
    component.onSearch('EMA');
    expect(component.selectedRow()).toBeNull();
  });

  it('should filter com code search', (done) => {
    initComponent();
    component.selectedComType.set('EMAIL');
    service.getCommunicationCodes.and.returnValue(of([
      { code: 'APPT', description: 'Appointment' },
      { code: 'CONF', description: 'Confirmation' },
    ]));
    component.onComTypeChange();
    fixture.detectChanges();

    component.comCodeSearchControl.setValue('appt');
    setTimeout(() => {
      expect(component.filteredComCodes().length).toBe(1);
      expect(component.filteredComCodes()[0].value).toBe('APPT');
      done();
    }, 100);
  });

  it('should format date columns via valueFormatter', () => {
    initComponent();
    const dateCol = component.tableConfig.columns.find(c => c.key === 'dateAndTime');
    expect(dateCol).toBeTruthy();
    if (dateCol?.valueFormatter) {
      const result = dateCol.valueFormatter('2026-03-15T14:30:00Z', {} as any);
      expect(result).toContain('2026');
      expect(dateCol.valueFormatter(null, {} as any)).toBe('-');
    }
  });

  it('should format targetDate via valueFormatter', () => {
    initComponent();
    const col = component.tableConfig.columns.find(c => c.key === 'targetDate');
    expect(col).toBeTruthy();
    if (col?.valueFormatter) {
      const result = col.valueFormatter('2026-03-15', {} as any);
      expect(result).toContain('2026');
      expect(col.valueFormatter(null, {} as any)).toBe('-');
    }
  });

  it('should format actionCode via valueFormatter', () => {
    initComponent();
    const col = component.tableConfig.columns.find(c => c.key === 'actionCode');
    if (col?.valueFormatter) {
      expect(col.valueFormatter('ACT', {} as any)).toBe('ACT');
      expect(col.valueFormatter('', {} as any)).toBe('-');
    }
  });

  it('should format actionDate via valueFormatter', () => {
    initComponent();
    const col = component.tableConfig.columns.find(c => c.key === 'actionDate');
    if (col?.valueFormatter) {
      expect(col.valueFormatter('2026-03-15', {} as any)).toContain('2026');
      expect(col.valueFormatter(null, {} as any)).toBe('-');
    }
  });

  it('should refresh new communication with comType filter and reload codes', () => {
    initComponent();
    component.selectedComType.set('EMAIL');
    const afterClosed$ = new Subject<any>();
    spyOn(component['dialogService'], 'open').and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);
    service.getCommunicationCodes.and.returnValue(of([{ code: 'X', description: 'Y' }]));

    component.openNewCommunication();

    service.getNotificationLogs.calls.reset();
    service.getCommunicationCodes.calls.reset();
    afterClosed$.next({ action: 'save', data: {} });
    expect(service.getNotificationLogs).toHaveBeenCalledWith('D12345', 'EMAIL', undefined);
    expect(service.getCommunicationCodes).toHaveBeenCalledWith('D12345', 'EMAIL');
  });
});
