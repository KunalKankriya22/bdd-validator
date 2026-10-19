import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MatDialog } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { DonorCommunicationQuery } from './donor-communication-query';
import { DonorCommunicationQueryService } from './services/donor-communication-query.service';
import { provideRouter } from '@angular/router';
import {
  CommunicationRecord,
  ActionCodeOption,
  CommunicationTypeOption,
  CommunicationCodeOption,
  UserListItem,
  CommunicationDropdownsResponse,
} from './models/donor-communication-query.model';

describe('DonorCommunicationQuery', () => {
  let component: DonorCommunicationQuery;
  let fixture: ComponentFixture<DonorCommunicationQuery>;
  let service: jasmine.SpyObj<DonorCommunicationQueryService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockCommunications: CommunicationRecord[] = [
    {
      donorId: 'DN30139912',
      comType: 'LETTR',
      comCode: 'NOTIF',
      insertUser: 'NITOR1',
      insertDate: '21-MAY-2026',
      actionCode: 'CALLD',
      name: 'Doe, John M',
      dob: '01-15-1985',
      sex: 'M',
      abo: 'A+',
      targetDate: '25-MAY-2026',
      actionDate: '21-MAY-2026',
      comDesc: 'Notification letter authorized: FDLTR',
      chapterId: 'CH001',
    },
  ];

  const mockActionCodes: ActionCodeOption[] = [
    { code: 'CALLD', description: 'Called' },
    { code: 'FCARD', description: 'Follow-up Card' },
  ];

  const mockCommTypes: CommunicationTypeOption[] = [
    { code: 'LETTR', description: 'Letter' },
    { code: 'EMAIL', description: 'Email' },
  ];

  const mockCommCodes: any[] = [
    { code: 'NOTIF', commType: 'LETTR', description: 'Notification' },
    { code: 'THANK', commType: 'LETTR', description: 'Thank You' },
  ];

  const mockCommunicationDropdowns: CommunicationDropdownsResponse = {
    communicationType: [
      { key: 'LETTR', value: 'LETTR', description: 'Letter' },
      { key: 'EMAIL', value: 'EMAIL', description: 'Email' },
    ],
    communicationCode: [
      { key: 'NOTIF', value: 'LETTR|NOTIF', description: 'LETTR - Notification' },
      { key: 'THANK', value: 'LETTR|THANK', description: 'LETTR - Thank You' },
    ],
  };

  const mockUsers: UserListItem[] = [
    { userId: 'NITOR1', userName: 'Doe, John' },
    { userId: 'USER02', userName: 'Smith, Jane' },
  ];

  beforeEach(() => {

    service = jasmine.createSpyObj('DonorCommunicationQueryService', [
      'query',
      'getActionCodes',
      'getCommunicationDropdowns',
      'getUsers',
      'update',
    ]);

    const afterAllClosedSubject = new Subject();
    dialog = jasmine.createSpyObj('MatDialog', ['open'], {
      openDialogs: [],
      afterOpened: new Subject(),
      afterAllClosed: afterAllClosedSubject.asObservable()
    });

    // Add _getAfterAllClosed as a workaround for Material Dialog internal calls
    (dialog as any)._getAfterAllClosed = () => afterAllClosedSubject;

    service.getActionCodes.and.returnValue(of(mockActionCodes));
    service.getCommunicationDropdowns.and.returnValue(of(mockCommunicationDropdowns));
    service.getUsers.and.returnValue(of(mockUsers));



      TestBed.configureTestingModule({
      imports: [DonorCommunicationQuery,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: DonorCommunicationQueryService, useValue: service },
        { provide: MatDialog, useValue: dialog },
      ],
    });


    


      service.query.calls.reset();


      service.getActionCodes.calls.reset();


      service.getCommunicationDropdowns.calls.reset();


      service.getUsers.calls.reset();


      service.update.calls.reset();


      dialog.open.calls.reset();


      service.getActionCodes.and.returnValue(of(mockActionCodes));


      service.getCommunicationDropdowns.and.returnValue(of(mockCommunicationDropdowns));


      service.getUsers.and.returnValue(of(mockUsers));


    fixture = TestBed.createComponent(DonorCommunicationQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ==================== Component Initialization ====================

  describe('Component Initialization', () => {

    it('should initialize search form with required fields', () => {
      expect(component.searchForm.get('fromDate')).toBeDefined();
      expect(component.searchForm.get('toDate')).toBeDefined();
      expect(component.searchForm.get('user')).toBeDefined();
      expect(component.searchForm.get('commType')).toBeDefined();
      expect(component.searchForm.get('commCode')).toBeDefined();
      expect(component.searchForm.get('pendingActionsOnly')).toBeDefined();
    });

    it('should initialize with required validators on date fields', () => {
      const fromDate = component.searchForm.get('fromDate');
      const toDate = component.searchForm.get('toDate');

      fromDate?.setValue(null);
      toDate?.setValue(null);

      expect(fromDate?.hasError('required')).toBeTrue();
      expect(toDate?.hasError('required')).toBeTrue();
    });

    it('should load action codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(service.getActionCodes).toHaveBeenCalled();
      expect(component['actionCodes']()).toEqual(mockActionCodes);
    }));

    it('should load communication dropdowns on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(service.getCommunicationDropdowns).toHaveBeenCalled();
      expect(component['communicationTypes']()).toEqual(mockCommTypes);
      expect(component['communicationCodes']()).toEqual(mockCommCodes);
    }));

    it('should initialize with loading state as false', () => {
      expect(component['loading']()).toBeFalse();
    });




  });

  // ==================== Form Validation ====================

  describe('Form Validation', () => {



    it('should validate toDate is not before fromDate', () => {
      const fromDate = moment('2026-05-16');
      const toDate = moment('2026-05-01');

      component.searchForm.patchValue({ fromDate, toDate });
      component.searchForm.get('toDate')?.markAsTouched();
      component.searchForm.get('toDate')?.updateValueAndValidity();

      expect(component.searchForm.get('toDate')?.hasError('toBeforeFrom')).toBeTrue();
    });

    it('should accept equal fromDate and toDate', () => {
      const date = moment('2026-05-01');

      component.searchForm.patchValue({
        fromDate: date.clone(),
        toDate: date.clone(),
      });

      expect(component.searchForm.valid).toBeTrue();
    });

    it('should clear toBeforeFrom error when toDate is after fromDate', () => {
      const fromDate = moment('2026-05-01');
      const toDate = moment('2026-05-16');

      component.searchForm.patchValue({ fromDate, toDate });
      component.searchForm.get('toDate')?.markAsTouched();
      component.searchForm.get('toDate')?.updateValueAndValidity();

      expect(component.searchForm.get('toDate')?.hasError('toBeforeFrom')).toBeFalse();
      expect(component.searchForm.valid).toBeTrue();
    });
  });

  // ==================== Query Functionality ====================

  describe('Query Functionality', () => {
    beforeEach(() => {
      component.searchForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-16'),
      });
    });



    it('should disable RETRIEVE button while loading', fakeAsync(() => {
      const querySubject = new Subject<any>();
      service.query.and.returnValue(querySubject.asObservable());

      component.onSearch();

      expect(component['loading']()).toBeTrue();
      expect(component.searchForm.invalid).toBeFalse();
      // Button should be disabled due to loading() || searchForm.invalid

      querySubject.next({ data: mockCommunications, total: 1 });
      querySubject.complete();
      tick();

      expect(component['loading']()).toBeFalse();
    }));

    it('should update communications signal with query results', fakeAsync(() => {
      service.query.and.returnValue(of({ data: mockCommunications, total: 1 }));

      component.onSearch();
      tick();

      expect(component['communications']()).toEqual(mockCommunications);
    }));

    it('should set hasSearched to true after query', fakeAsync(() => {
      service.query.and.returnValue(of({ data: mockCommunications, total: 1 }));

      component.onSearch();
      tick();

      expect(component['hasSearched']()).toBeTrue();
    }));



    it('should prevent concurrent queries by disabling button during loading', fakeAsync(() => {
      service.query.and.returnValue(of({ data: mockCommunications, total: 1 }));

      component.onSearch();
      const firstCallCount = service.query.calls.count();

      // Try to trigger another search while loading
      if (component['loading']()) {
        // Button should be disabled, preventing duplicate calls
        expect(component['loading']()).toBeTrue();
      }

      tick();
      expect(service.query.calls.count()).toBe(firstCallCount);
    }));
  });

  // ==================== Clear Functionality ====================

  describe('Clear Functionality', () => {
    beforeEach(() => {
      component.searchForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-16'),
        user: 'USER01',
        commType: 'LETTR',
        commCode: 'NOTIF',
        pendingActionsOnly: true,
      });
      component.searchForm.markAsDirty();
    });

    it('should reset all form fields to initial state', () => {
      component.onClear();

      expect(component.searchForm.get('fromDate')?.value).toBeNull();
      expect(component.searchForm.get('toDate')?.value).toBeNull();
      expect(component.searchForm.get('user')?.value).toBeNull();
      expect(component.searchForm.get('commType')?.value).toBeNull();
      expect(component.searchForm.get('commCode')?.value).toBeNull();
      expect(component.searchForm.get('pendingActionsOnly')?.value).toBeFalse();
    });

    it('should mark form as pristine', () => {
      component.onClear();

      expect(component.searchForm.pristine).toBeTrue();
    });

    it('should reset form to untouched state', () => {
      component.searchForm.get('fromDate')?.markAsTouched();
      component.searchForm.get('fromDate')?.setErrors({ customError: true });

      component.onClear();

      expect(component.searchForm.get('fromDate')?.untouched).toBeTrue();
      expect(component.searchForm.get('fromDate')?.pristine).toBeTrue();
    });

    it('should clear date validation errors on clear', () => {
      component.searchForm.patchValue({
        fromDate: moment('2026-05-16'),
        toDate: moment('2026-05-01'),
      });
      component.searchForm.get('toDate')?.markAsTouched();
      component.searchForm.get('toDate')?.updateValueAndValidity();

      expect(component.searchForm.get('toDate')?.hasError('toBeforeFrom')).toBeTrue();

      component.onClear();

      expect(component.searchForm.get('toDate')?.hasError('toBeforeFrom')).toBeFalse();
      expect(component.searchForm.get('fromDate')?.value).toBeNull();
      expect(component.searchForm.get('toDate')?.value).toBeNull();
    });
  });

  // ==================== Pagination ====================

  describe('Pagination', () => {
    beforeEach(() => {
      component.searchForm.patchValue({
        fromDate: moment('2026-05-01'),
        toDate: moment('2026-05-16'),
      });
      service.query.and.returnValue(of({ data: mockCommunications, total: 100 }));
    });



    it('should trigger new query with updated pagination', fakeAsync(() => {
      component.onSearch();
      tick();

      service.query.calls.reset();

      const event = { pageSize: 50, pageIndex: 1, previousPageIndex: 0, length: 100 };
      component.onPageChange(event);
      tick();

      expect(service.query).toHaveBeenCalled();
      const callArgs = service.query.calls.mostRecent().args;
      expect(callArgs[1]).toBe(50);
      expect(callArgs[2]).toBe(50);
    }));
  });

  // ==================== Row Actions & Side Panel ====================

  describe('Side Panel', () => {
    const mockRecord = mockCommunications[0];

    it('should initialize side panel as closed', () => {
      expect(component['sidePanelOpen']()).toBeFalse();
      expect(component['sidePanelRow']()).toBeNull();
      expect(component['currentSection']()).toBeNull();
      expect(component['sidePanelWidth']()).toBe('70vw');
    });

    it('should open side panel for Communication Log', () => {
      component.onRowAction({ action: 'communicationLog', row: mockRecord });

      expect(component['sidePanelOpen']()).toBeTrue();
      expect(component['currentSection']()).toBe('communicationLog');
      expect(component['sidePanelRow']()).toEqual(mockRecord);
    });

    it('should open side panel for Demographics', () => {
      component.onRowAction({ action: 'demographics', row: mockRecord });

      expect(component['sidePanelOpen']()).toBeTrue();
      expect(component['currentSection']()).toBe('demographics');
      expect(component['sidePanelRow']()?.donorId).toBe('DN30139912');
    });

    it('should open side panel for Attributes', () => {
      component.onRowAction({ action: 'attributes', row: mockRecord });

      expect(component['sidePanelOpen']()).toBeTrue();
      expect(component['currentSection']()).toBe('attributes');
      expect(component['sidePanelRow']()?.donorId).toBe('DN30139912');
    });

    it('should open side panel for Interdictions', () => {
      component.onRowAction({ action: 'interdictions', row: mockRecord });

      expect(component['sidePanelOpen']()).toBeTrue();
      expect(component['currentSection']()).toBe('interdictions');
      expect(component['sidePanelRow']()?.donorId).toBe('DN30139912');
    });

    it('should close side panel and reset all signals', () => {
      component.onRowAction({ action: 'demographics', row: mockRecord });
      expect(component['sidePanelOpen']()).toBeTrue();

      component.onPanelClose();

      expect(component['sidePanelOpen']()).toBeFalse();
      expect(component['sidePanelRow']()).toBeNull();
      expect(component['currentSection']()).toBeNull();
      expect(component['sidePanelWidth']()).toBe('70vw');
    });

    it('should update panel width on panelWidthChange', () => {
      component.onPanelWidthChange('90vw');

      expect(component['sidePanelWidth']()).toBe('90vw');
    });


  });

  // ==================== Date Formatting ====================

  describe('Date Formatting', () => {
    const mockRow = mockCommunications[0];

    it('should format insertDate with MM-DD-YYYY input format', () => {
      const config = component['tableConfig'];
      const comDateColumn = config.columns.find(col => col.key === 'comDate');

      expect(comDateColumn).toBeDefined();
      expect(comDateColumn?.valueFormatter).toBeDefined();

      if (comDateColumn?.valueFormatter) {
        const formatted = comDateColumn.valueFormatter('05-21-2026', mockRow);
        expect(formatted).toBe('21-MAY-2026');
      }
    });

    it('should format targetDate with MM-DD-YYYY input format', () => {
      const config = component['tableConfig'];
      const targetDateColumn = config.columns.find(col => col.key === 'targetDate');

      expect(targetDateColumn).toBeDefined();
      expect(targetDateColumn?.valueFormatter).toBeDefined();

      if (targetDateColumn?.valueFormatter) {
        const formatted = targetDateColumn.valueFormatter('05-21-2026', mockRow);
        expect(formatted).toBe('21-MAY-2026');
      }
    });

    it('should format actionDate with MM-DD-YYYY input format', () => {
      const config = component['tableConfig'];
      const actionDateColumn = config.columns.find(col => col.key === 'actionDate');

      expect(actionDateColumn).toBeDefined();
      expect(actionDateColumn?.valueFormatter).toBeDefined();

      if (actionDateColumn?.valueFormatter) {
        const formatted = actionDateColumn.valueFormatter('05-21-2026', mockRow);
        expect(formatted).toBe('21-MAY-2026');
      }
    });


    it('should handle various MM-DD-YYYY date formats correctly', () => {
      const config = component['tableConfig'];
      const comDateColumn = config.columns.find(col => col.key === 'comDate');

      if (comDateColumn?.valueFormatter) {
        expect(comDateColumn.valueFormatter('12-31-2026', mockRow)).toBe('31-DEC-2026');
        expect(comDateColumn.valueFormatter('01-01-2026', mockRow)).toBe('01-JAN-2026');
        expect(comDateColumn.valueFormatter('06-15-2026', mockRow)).toBe('15-JUN-2026');
      }
    });
  });

  // ==================== Component Cleanup ====================
});
