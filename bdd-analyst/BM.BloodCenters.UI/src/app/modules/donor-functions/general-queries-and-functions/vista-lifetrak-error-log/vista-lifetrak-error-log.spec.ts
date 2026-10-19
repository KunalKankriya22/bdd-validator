import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { VistaLifeTrakErrorLogComponent } from './vista-lifetrak-error-log';
import { VistaLifeTrakErrorLogService } from './vista-lifetrak-error-log.service';
import { VistaLifeTrakErrorLogDto } from './vista-lifetrak-error-log.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService, createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('VistaLifeTrakErrorLogComponent', () => {
  let component: VistaLifeTrakErrorLogComponent;
  let fixture: ComponentFixture<VistaLifeTrakErrorLogComponent>;
  let mockVistaService: jasmine.SpyObj<VistaLifeTrakErrorLogService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let chapterChanged$: Subject<void>;

  const mockData: VistaLifeTrakErrorLogDto[] = [
    {
      transactionId: 'TXN001',
      insertDate: '2026-05-15T10:30:00',
      messageType: 'ERROR',
      errorText: 'Connection timed out',
    },
    {
      transactionId: 'TXN002',
      insertDate: '2026-05-16T14:00:00',
      messageType: null,
      errorText: null,
    },
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    mockVistaService = jasmine.createSpyObj('VistaLifeTrakErrorLogService', ['getErrorLogs']);
    mockPageHeaderService = createMockPageHeaderService();
    mockHeaderService = createMockHeaderService();
    mockSnackbarService = createMockSnackbarService();

    mockPageHeaderService.pageHeaderData.and.returnValue(undefined);
    mockPageHeaderService.getTitle.and.returnValue(undefined);
    mockPageHeaderService.getSubtitle.and.returnValue(undefined);
    mockVistaService.getErrorLogs.and.returnValue(of({ data: [], total: 0 }));
    Object.defineProperty(mockHeaderService, 'chapterChanged$', {
      value: chapterChanged$.asObservable(),
      writable: true,
    });



      TestBed.configureTestingModule({
      imports: [VistaLifeTrakErrorLogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VistaLifeTrakErrorLogService, useValue: mockVistaService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
      ],
    });


    


      mockVistaService.getErrorLogs.calls.reset();


      mockPageHeaderService.pageHeaderData.calls.reset();


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockPageHeaderService.pageHeaderData.and.returnValue(undefined);


      mockPageHeaderService.getTitle.and.returnValue(undefined);


      mockPageHeaderService.getSubtitle.and.returnValue(undefined);


      mockVistaService.getErrorLogs.and.returnValue(of({ data: [], total: 0 }));
    fixture = TestBed.createComponent(VistaLifeTrakErrorLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ─── Creation & initial state ─────────────────────────────────────────────

  describe('Component creation', () => {


    it('should initialise with default state', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasRetrieved).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.pagedData).toEqual([]);
      expect(component.totalCount).toBe(0);
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(0);
      expect(component.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should initialise filterForm with fromDate required and toDate optional', () => {
      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
      expect(component.filterForm.get('fromDate')?.hasError('required')).toBeTrue();
      expect(component.filterForm.get('toDate')?.hasError('required')).toBeFalse();
    });

    it('should set maxDate to today or earlier (not a future date)', () => {
      const tomorrow = moment().add(1, 'day').startOf('day');
      expect(component.maxDate.isBefore(tomorrow)).toBeTrue();
    });

    it('should have fromDateErrorMatcher and toDateErrorMatcher defined', () => {
      expect(component.fromDateErrorMatcher).toBeDefined();
      expect(component.toDateErrorMatcher).toBeDefined();
    });
  });

  // ─── isRetrieveDisabled ───────────────────────────────────────────────────

  describe('isRetrieveDisabled', () => {
    it('should be true when fromDate is empty', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be false when fromDate is set', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));
      expect(component.isRetrieveDisabled).toBeFalse();
    });



    it('should be true when toDate is before fromDate (dateRangeInvalid)', () => {
      // auto-fill sets toDate = fromDate, then override with earlier date
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-10'));
      component.filterForm.get('toDate')!.setValue(moment('2026-05-05'));
      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });

  // ─── getFromDateError ─────────────────────────────────────────────────────

  describe('getFromDateError()', () => {


    it('should return required message when touched and empty', () => {
      component.filterForm.get('fromDate')!.markAsTouched();
      expect(component.getFromDateError()).toBe('From Date is required');
    });





    it('should return future-date message on matDatepickerMax error', () => {
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ matDatepickerMax: { max: moment(), actual: moment().add(1, 'day') } });
      expect(component.getFromDateError()).toBe('From Date cannot be a future date');
    });

    it('should return range message when fromDate > toDate and fromDate was last changed', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-20'));
      component.filterForm.get('fromDate')!.markAsTouched();
      component.filterForm.get('toDate')!.setValue(moment('2026-05-10'));
      (component as any).lastChangedDate = 'from';
      expect(component.getFromDateError()).toBe('From Date must be less than or equal to To Date');
    });

    it('should not return range message when toDate was last changed', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-20'));
      component.filterForm.get('fromDate')!.markAsTouched();
      component.filterForm.get('toDate')!.setValue(moment('2026-05-10'));
      (component as any).lastChangedDate = 'to';
      expect(component.getFromDateError()).toBe('');
    });

    it('should not return range message when lastChangedDate is null', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-20'));
      component.filterForm.get('fromDate')!.markAsTouched();
      component.filterForm.get('toDate')!.setValue(moment('2026-05-10'));
      (component as any).lastChangedDate = null;
      expect(component.getFromDateError()).toBe('');
    });
  });

  // ─── getToDateError ───────────────────────────────────────────────────────

  describe('getToDateError()', () => {








    it('should return range message on matDatepickerMin error when toDate was last changed', () => {
      const ctrl = component.filterForm.get('toDate')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ matDatepickerMin: { min: moment(), actual: moment().subtract(1, 'day') } });
      (component as any).lastChangedDate = 'to';
      expect(component.getToDateError()).toBe('To Date must be greater than or equal to From Date');
    });

    it('should return range message from form errors when toDate was last changed', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-20'));
      component.filterForm.get('toDate')!.setValue(moment('2026-05-10'));
      component.filterForm.get('toDate')!.markAsTouched();
      (component as any).lastChangedDate = 'to';
      expect(component.getToDateError()).toBe('To Date must be greater than or equal to From Date');
    });

    it('should not return range message when fromDate was last changed', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-20'));
      component.filterForm.get('toDate')!.setValue(moment('2026-05-10'));
      component.filterForm.get('toDate')!.markAsTouched();
      (component as any).lastChangedDate = 'from';
      expect(component.getToDateError()).toBe('');
    });

    it('should not return range message when lastChangedDate is null', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-20'));
      component.filterForm.get('toDate')!.setValue(moment('2026-05-10'));
      component.filterForm.get('toDate')!.markAsTouched();
      (component as any).lastChangedDate = null;
      expect(component.getToDateError()).toBe('');
    });
  });

  // ─── toDate auto-fill ─────────────────────────────────────────────────────

  describe('toDate auto-fill from fromDate', () => {
    it('should copy fromDate into toDate when toDate is empty', () => {
      const from = moment('2026-05-10');
      component.filterForm.get('fromDate')!.setValue(from);
      expect(component.filterForm.get('toDate')!.value).toEqual(from);
    });

    it('should mark toDate as touched after auto-fill', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-10'));
      expect(component.filterForm.get('toDate')!.touched).toBeTrue();
    });

    it('should not overwrite toDate when it already has a value', () => {
      const existingTo = moment('2026-05-08');
      component.filterForm.get('toDate')!.setValue(existingTo);
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-10'));
      expect(component.filterForm.get('toDate')!.value).toEqual(existingTo);
    });

    it('should not clear toDate when fromDate is cleared', () => {
      const from = moment('2026-05-10');
      component.filterForm.get('fromDate')!.setValue(from); // auto-fills toDate = from
      component.filterForm.get('fromDate')!.setValue(null); // clearing fromDate must NOT wipe toDate
      expect(component.filterForm.get('toDate')!.value).toEqual(from);
    });

    it('should set lastChangedDate to from when fromDate changes', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-10'));
      expect((component as any).lastChangedDate).toBe('from');
    });

    it('should set lastChangedDate to to when toDate changes', () => {
      component.filterForm.get('toDate')!.setValue(moment('2026-05-15'));
      expect((component as any).lastChangedDate).toBe('to');
    });
  });

  // ─── onFromDateInput ──────────────────────────────────────────────────────

  describe('onFromDateInput()', () => {
    it('should set lastChangedDate to from', () => {
      const event = { target: { value: '10-MAY-2026' } } as unknown as Event;
      component.onFromDateInput(event);
      expect((component as any).lastChangedDate).toBe('from');
    });

    it('should set required error when user clears the field', () => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-10'));
      const event = { target: { value: '' } } as unknown as Event;
      component.onFromDateInput(event);
      expect(component.filterForm.get('fromDate')!.hasError('required')).toBeTrue();
    });


  });

  // ─── onToDateInput ────────────────────────────────────────────────────────

  describe('onToDateInput()', () => {
    it('should set lastChangedDate to to', () => {
      const event = { target: { value: '15-MAY-2026' } } as unknown as Event;
      component.onToDateInput(event);
      expect((component as any).lastChangedDate).toBe('to');
    });




  });

  // ─── retrieve ─────────────────────────────────────────────────────────────

  describe('retrieve()', () => {




    it('should reset pageIndex to 0 before fetching', fakeAsync(() => {
      mockVistaService.getErrorLogs.and.returnValue(of({ data: mockData, total: 2 }));
      component.pageIndex = 3;
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));
      component.retrieve();
      tick();
      expect(component.pageIndex).toBe(0);
    }));

    it('should call getErrorLogs with formatted dates and default page params', fakeAsync(() => {
      mockVistaService.getErrorLogs.and.returnValue(of({ data: mockData, total: 2 }));
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));
      component.filterForm.get('toDate')!.setValue(moment('2026-05-15'));
      component.retrieve();
      tick();

      expect(mockVistaService.getErrorLogs).toHaveBeenCalledWith(
        25, 0,
        { fromDate: '2026-05-01', toDate: '2026-05-15' }
      );
    }));

    it('should call getErrorLogs with null toDate when toDate is empty', fakeAsync(() => {
      mockVistaService.getErrorLogs.and.returnValue(of({ data: [], total: 0 }));
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));
      // Clear the auto-filled toDate without triggering a valueChange that fires the subscription
      component.filterForm.get('toDate')!.setValue(null, { emitEvent: false });
      component.retrieve();
      tick();

      expect(mockVistaService.getErrorLogs).toHaveBeenCalledWith(
        25, 0,
        { fromDate: '2026-05-01', toDate: null }
      );
    }));

    it('should set hasRetrieved, pagedData and totalCount on success', fakeAsync(() => {
      mockVistaService.getErrorLogs.and.returnValue(of({ data: mockData, total: 2 }));
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));
      component.retrieve();
      tick();

      expect(component.hasRetrieved).toBeTrue();
      expect(component.pagedData).toEqual(mockData);
      expect(component.totalCount).toBe(2);
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
    }));

    it('should set hasError and show snackbar on API failure', fakeAsync(() => {
      mockVistaService.getErrorLogs.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));
      component.retrieve();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.pagedData).toEqual([]);
      expect(component.totalCount).toBe(0);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should include errorCode in snackbar message when present', fakeAsync(() => {
      mockVistaService.getErrorLogs.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { errorCode: ' ERR500 ', error: 'Internal error' } },
        }))
      );
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));
      component.retrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error ERR500: Internal error');
    }));

    it('should fall back to default message when API error has no message', fakeAsync(() => {
      mockVistaService.getErrorLogs.and.returnValue(throwError(() => ({ error: {} })));
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));
      component.retrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Failed to retrieve error logs. Please try again.'
      );
    }));
  });

  // ─── onPageChange ─────────────────────────────────────────────────────────

  describe('onPageChange()', () => {


    it('should calculate skip as pageSize * pageIndex', fakeAsync(() => {
      mockVistaService.getErrorLogs.and.returnValue(of({ data: [], total: 0 }));
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));

      component.onPageChange({ pageSize: 50, pageIndex: 3, length: 200, previousPageIndex: 2 });
      tick();

      expect(mockVistaService.getErrorLogs).toHaveBeenCalledWith(50, 150, jasmine.any(Object));
    }));
  });

  // ─── clearAll ─────────────────────────────────────────────────────────────

  describe('clearAll()', () => {


    it('should reset all state flags and data', () => {
      component.pagedData = mockData;
      component.totalCount = 2;
      component.pageIndex = 3;
      component.hasRetrieved = true;
      component.hasError = true;
      (component as any).lastChangedDate = 'from';

      component.clearAll();

      expect(component.pagedData).toEqual([]);
      expect(component.totalCount).toBe(0);
      expect(component.pageIndex).toBe(0);
      expect(component.hasRetrieved).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect((component as any).lastChangedDate).toBeNull();
    });
  });

  // ─── chapterChanged$ ──────────────────────────────────────────────────────

  describe('chapterChanged$ subscription', () => {
    it('should clear all state when chapter changes', fakeAsync(() => {
      component.filterForm.get('fromDate')!.setValue(moment('2026-05-01'));
      component.hasRetrieved = true;
      component.pagedData = [...mockData];

      chapterChanged$.next();
      tick();

      expect(component.filterForm.get('fromDate')!.value).toBeNull();
      expect(component.hasRetrieved).toBeFalse();
      expect(component.pagedData).toEqual([]);
    }));
  });

  // ─── formatDate ───────────────────────────────────────────────────────────

  describe('formatDate()', () => {






    it('should format date string to D-MMM-YYYY HH:mm in uppercase', () => {
      expect(component.formatDate('2026-05-15T10:30:00')).toBe('15-MAY-2026 10:30');
    });

    it('should format single-digit day without leading zero', () => {
      expect(component.formatDate('2026-05-05T09:05:00')).toBe('5-MAY-2026 09:05');
    });
  });

  // ─── ngOnDestroy ──────────────────────────────────────────────────────────
});
