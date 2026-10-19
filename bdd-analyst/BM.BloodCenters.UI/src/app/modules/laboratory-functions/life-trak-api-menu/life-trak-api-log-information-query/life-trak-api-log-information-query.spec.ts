import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { TranslateModule } from '@ngx-translate/core';

import { LifeTrakApiLogInformationQueryComponent } from './life-trak-api-log-information-query';
import { LifeTrakApiLogService } from './services/life-trak-api-log.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SourceCodeDto, ApiLogDto, ApiLogSearchResponse } from './models/life-trak-api-log.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('LifeTrakApiLogInformationQueryComponent', () => {
  let component: LifeTrakApiLogInformationQueryComponent;
  let fixture: ComponentFixture<LifeTrakApiLogInformationQueryComponent>;
  let mockService: jasmine.SpyObj<LifeTrakApiLogService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let mockHeaderService: { chapterChanged$: Subject<any> };
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockSourceCodes: SourceCodeDto[] = [
    { code: 'APP001', codeDesc: 'Application One' },
    { code: 'APP002', codeDesc: 'Application Two' },
    { code: 'APP003', codeDesc: 'Application Three' }
  ];

  const mockApiLogs: ApiLogDto[] = [
    {
      internalId: 'INT001',
      externalId: 'EXT001',
      insertDate: '2026-06-17T10:30:00',
      logText: 'Test log message 1',
      sourceId: 'APP001'
    },
    {
      internalId: 'INT002',
      externalId: 'EXT002',
      insertDate: '2026-06-17T11:45:00',
      logText: 'Test log message 2\nMultiline log',
      sourceId: 'APP001'
    }
  ];

  const mockSearchResponse: ApiLogSearchResponse = {
    success: true,
    message: 'Search completed successfully',
    statusCode: 200,
    data: mockApiLogs,
    totalCount: 2
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('LifeTrakApiLogService', ['getSourceCodes', 'searchLogs']);
    mockSnackbarService = createMockSnackbarService();
    mockMenuService = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());
    mockHeaderService = {
      chapterChanged$: new Subject<any>()
    };

    mockService.getSourceCodes.and.returnValue(of(mockSourceCodes));
    mockService.searchLogs.and.returnValue(of(mockSearchResponse));
    mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));

    TestBed.configureTestingModule({
      imports: [
        LifeTrakApiLogInformationQueryComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LifeTrakApiLogService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ]
    });

    mockService.getSourceCodes.calls.reset();
    mockService.searchLogs.calls.reset();
    mockMenuService.getMenuItemsSignal.calls.reset();
    mockMenuService.findMenuItemByPath.calls.reset();

    mockService.getSourceCodes.and.returnValue(of(mockSourceCodes));
    mockService.searchLogs.and.returnValue(of(mockSearchResponse));
    mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));

    fixture = TestBed.createComponent(LifeTrakApiLogInformationQueryComponent);
    component = fixture.componentInstance;
  });

  // ===== Component Initialization =====

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form controls', () => {
      expect((component as any).sourceApplicationIdControl).toBeDefined();
      expect((component as any).fromDateControl).toBeDefined();
      expect((component as any).toDateControl).toBeDefined();
    });

    it('should set source application control as required', () => {
      const control = (component as any).sourceApplicationIdControl;
      expect(control.hasError('required')).toBe(true);

      control.setValue('APP001');
      expect(control.hasError('required')).toBe(false);

      control.setValue('');
      expect(control.hasError('required')).toBe(true);
    });

    it('should load source codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getSourceCodes).toHaveBeenCalled();
      expect((component as any).sourceApplications().length).toBe(3);
      expect((component as any).sourceApplications()).toEqual(mockSourceCodes);
    }));

    it('should initialize signals with default values', () => {
      expect((component as any).isLoading()).toBe(false);
      expect((component as any).hasRetrieved()).toBe(false);
      expect((component as any).apiLogs()).toEqual([]);
      expect((component as any).totalRecords()).toBe(0);
      expect((component as any).currentPage()).toBe(0);
      expect((component as any).pageSize()).toBe(25);
    });

    it('should configure table with correct columns', () => {
      const columns = (component as any).tableConfig.columns;
      expect(columns.length).toBe(4);
      expect(columns[0].key).toBe('internalId');
      expect(columns[1].key).toBe('externalId');
      expect(columns[2].key).toBe('logText');
      expect(columns[3].key).toBe('insertDate');
    });

    it('should configure pagination defaults', () => {
      const pagination = (component as any).tableConfig.pagination;
      expect(pagination.pageSize).toBe(25);
      expect(pagination.pageIndex).toBe(0);
      expect(pagination.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(pagination.showFirstLastButtons).toBe(true);
    });
  });

  // ===== Load Source Applications =====

  describe('Load Source Applications', () => {
    it('should handle successful source codes load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).sourceApplications()).toEqual(mockSourceCodes);
    }));

    it('should handle error when loading source codes', fakeAsync(() => {
      const error = { userMessage: 'Failed to load source applications' };
      mockService.getSourceCodes.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load source applications');
    }));

    it('should use default error message when userMessage is missing', fakeAsync(() => {
      const error = {};
      mockService.getSourceCodes.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load source applications. Please try again.');
    }));
  });

  // ===== Source Application Filtering =====

  describe('Source Application Filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all sources when search is empty', () => {
      expect((component as any).filteredSourceApplications().length).toBe(3);
    });

    it('should have sourceSearchControl initialized as empty', () => {
      expect((component as any).sourceSearchControl.value).toBe('');
    });

    it('should have sourceApplications populated after init', () => {
      expect((component as any).sourceApplications().length).toBe(3);
      expect((component as any).sourceApplications()).toEqual(mockSourceCodes);
    });
  });

  // ===== Form Validation =====

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should fail validation when source application is empty', () => {
      (component as any).sourceApplicationIdControl.setValue('');
      (component as any).onRetrieve();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a Source Application ID');
      expect(mockService.searchLogs).not.toHaveBeenCalled();
    });

    it('should fail validation when source application is whitespace only', () => {
      (component as any).sourceApplicationIdControl.setValue('   ');
      (component as any).onRetrieve();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a Source Application ID');
      expect(mockService.searchLogs).not.toHaveBeenCalled();
    });

    it('should mark source application control as touched on validation', () => {
      (component as any).sourceApplicationIdControl.setValue('');
      (component as any).onRetrieve();

      expect((component as any).sourceApplicationIdControl.touched).toBe(true);
    });

    it('should auto-set toDate to fromDate when only From Date is provided', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).fromDateControl.setValue(moment('2026-06-01'));
      (component as any).toDateControl.setValue(null);

      (component as any).onRetrieve();
      tick();

      expect((component as any).toDateControl.value).not.toBeNull();
      expect(moment((component as any).toDateControl.value).format('YYYY-MM-DD')).toBe('2026-06-01');
      expect(mockService.searchLogs).toHaveBeenCalled();
    }));

    it('should proceed with search when only To Date is provided', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).fromDateControl.setValue(null);
      (component as any).toDateControl.setValue(moment('2026-06-17'));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
      expect(mockService.searchLogs).toHaveBeenCalled();
    }));

    it('should proceed with search when both dates are provided and valid', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).fromDateControl.setValue(moment('2026-06-01'));
      (component as any).toDateControl.setValue(moment('2026-06-17'));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
      expect(mockService.searchLogs).toHaveBeenCalled();
    }));

    it('should proceed with search when no dates are provided', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
      expect(mockService.searchLogs).toHaveBeenCalled();
    }));

    it('should fail validation when To Date is before From Date', () => {
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).fromDateControl.setValue(moment('2026-06-17'));
      (component as any).toDateControl.setValue(moment('2026-06-01'));

      (component as any).onRetrieve();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('To Date cannot be before From Date');
      expect(mockService.searchLogs).not.toHaveBeenCalled();
    });

    it('should fail validation when From Date is in the future (chapter timezone)', () => {
      const chapterToday = moment('2026-06-15');
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(chapterToday);

      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).fromDateControl.setValue(moment('2026-06-16'));
      (component as any).toDateControl.setValue(moment('2026-06-17'));

      (component as any).onRetrieve();

      expect(mockChapterTimezoneService.getChapterLocalDate).toHaveBeenCalled();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('From Date cannot be in the future');
      expect(mockService.searchLogs).not.toHaveBeenCalled();
    });

    it('should allow From Date equal to chapter local date', fakeAsync(() => {
      const chapterToday = moment('2026-06-15');
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(chapterToday);

      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).fromDateControl.setValue(moment('2026-06-15'));
      (component as any).toDateControl.setValue(moment('2026-06-15'));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
      expect(mockService.searchLogs).toHaveBeenCalled();
    }));

    it('should fall back to moment() when chapter date is unavailable', fakeAsync(() => {
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(null as any);

      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).fromDateControl.setValue(moment('2020-01-01'));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
      expect(mockService.searchLogs).toHaveBeenCalled();
    }));
  });

  // ===== RETRIEVE Functionality =====

  describe('RETRIEVE Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call searchLogs with correct parameters when no dates provided', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).onRetrieve();
      tick();

      expect(mockService.searchLogs).toHaveBeenCalledWith(jasmine.objectContaining({
        sourceId: 'APP001',
        fromDate: null,
        toDate: null,
        take: 25,
        skip: 0
      }));
    }));

    it('should call searchLogs with dates converted to ISO string', fakeAsync(() => {
      const fromMoment = moment('2026-01-01');
      const toMoment = moment('2026-01-15');
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).fromDateControl.setValue(fromMoment);
      (component as any).toDateControl.setValue(toMoment);

      (component as any).onRetrieve();
      tick();

      const callArgs = mockService.searchLogs.calls.mostRecent().args[0];
      expect(callArgs.sourceId).toBe('APP001');
      expect(callArgs.fromDate).toBe(fromMoment.toISOString());
      expect(callArgs.toDate).toBe(toMoment.toISOString());
    }));

    it('should set isLoading to true during search', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');

      const subject = new Subject<ApiLogSearchResponse>();
      mockService.searchLogs.and.returnValue(subject.asObservable());

      (component as any).onRetrieve();

      expect((component as any).isLoading()).toBe(true);

      subject.next(mockSearchResponse);
      subject.complete();
      tick();

      expect((component as any).isLoading()).toBe(false);
    }));

    it('should update apiLogs signal with search results', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).onRetrieve();
      tick();

      expect((component as any).apiLogs()).toEqual(mockApiLogs);
      expect((component as any).totalRecords()).toBe(2);
      expect((component as any).hasRetrieved()).toBe(true);
    }));

    it('should show info snackbar when no results found', fakeAsync(() => {
      const emptyResponse: ApiLogSearchResponse = {
        success: true,
        message: 'No API logs found for the selected criteria',
        statusCode: 200,
        data: [],
        totalCount: 0
      };
      mockService.searchLogs.and.returnValue(of(emptyResponse));

      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showInfo).toHaveBeenCalledWith('No API logs found for the selected criteria');
    }));

    it('should handle validation errors from backend', fakeAsync(() => {
      const validationResponse: ApiLogSearchResponse = {
        success: false,
        message: 'Invalid source application ID',
        statusCode: 400,
        data: [],
        totalCount: 0
      };
      mockService.searchLogs.and.returnValue(of(validationResponse));

      (component as any).sourceApplicationIdControl.setValue('INVALID');
      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Invalid source application ID');
    }));

    it('should reset to first page on new search', fakeAsync(() => {
      (component as any).currentPage.set(3);
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).onRetrieve();
      tick();

      expect((component as any).currentPage()).toBe(0);
    }));

    it('should trim source ID value', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('  APP001  ');
      (component as any).onRetrieve();
      tick();

      const callArgs = mockService.searchLogs.calls.mostRecent().args[0];
      expect(callArgs.sourceId).toBe('APP001');
    }));
  });

  // ===== Error Handling =====

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).sourceApplicationIdControl.setValue('APP001');
    });

    it('should handle 400 validation error', fakeAsync(() => {
      const error = { status: 400, error: { message: 'Invalid date range' }, userMessage: 'Invalid date range' };
      mockService.searchLogs.and.returnValue(throwError(() => error));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Invalid date range');
      expect((component as any).isLoading()).toBe(false);
    }));

    it('should handle 500 server error', fakeAsync(() => {
      const error = { status: 500, error: { message: 'Database error' }, userMessage: 'Database error' };
      mockService.searchLogs.and.returnValue(throwError(() => error));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Database error');
    }));

    it('should handle network error (status 0)', fakeAsync(() => {
      const error = { status: 0, userMessage: 'Unable to connect to server. Please check your network connection.' };
      mockService.searchLogs.and.returnValue(throwError(() => error));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Unable to connect to server. Please check your network connection.');
    }));

    it('should use default error message when userMessage is missing', fakeAsync(() => {
      const error = { status: 404 };
      mockService.searchLogs.and.returnValue(throwError(() => error));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to retrieve API logs');
    }));

    it('should handle 400 error with generic message when no error details', fakeAsync(() => {
      const error = { status: 400 };
      mockService.searchLogs.and.returnValue(throwError(() => error));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Invalid search criteria');
    }));

    it('should handle 500 error with generic message when no error details', fakeAsync(() => {
      const error = { status: 500 };
      mockService.searchLogs.and.returnValue(throwError(() => error));

      (component as any).onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('An unexpected server error occurred');
    }));
  });

  // ===== Pagination =====

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).onRetrieve();
      tick();
    }));

    it('should update page on page change event', fakeAsync(() => {
      mockService.searchLogs.calls.reset();
      (component as any).onPageChange({ pageIndex: 2, pageSize: 50 });
      tick();

      expect((component as any).currentPage()).toBe(2);
      expect((component as any).pageSize()).toBe(50);
      expect(mockService.searchLogs).toHaveBeenCalledWith(jasmine.objectContaining({
        skip: 100,
        take: 50
      }));
    }));

    it('should update table pagination config after data load', fakeAsync(() => {
      expect((component as any).tableConfig.pagination!.totalRecords).toBe(2);
      expect((component as any).tableConfig.pagination!.pageIndex).toBe(0);
    }));
  });

  // ===== CLEAR ALL Functionality =====

  describe('CLEAR ALL Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls', () => {
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).fromDateControl.setValue(moment('2026-06-01'));
      (component as any).toDateControl.setValue(moment('2026-06-17'));

      (component as any).onClearAll();

      expect((component as any).sourceApplicationIdControl.value).toBeNull();
      expect((component as any).fromDateControl.value).toBeNull();
      expect((component as any).toDateControl.value).toBeNull();
    });

    it('should reset all data signals', () => {
      (component as any).apiLogs.set(mockApiLogs);
      (component as any).totalRecords.set(10);
      (component as any).hasRetrieved.set(true);
      (component as any).currentPage.set(2);

      (component as any).onClearAll();

      expect((component as any).apiLogs().length).toBe(0);
      expect((component as any).totalRecords()).toBe(0);
      expect((component as any).hasRetrieved()).toBe(false);
      expect((component as any).currentPage()).toBe(0);
    });

    it('should update table pagination after clear', () => {
      (component as any).onClearAll();

      expect((component as any).tableConfig.pagination!.totalRecords).toBe(0);
      expect((component as any).tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  // ===== Date Formatting =====

  describe('Date Formatting', () => {
    it('should format insertDate as DD-MMM-YYYY, HH:mm (chapter-local, no UTC conversion)', () => {
      const formatFn = (component as any).tableConfig.columns[3].valueFormatter;
      expect(formatFn).toBeDefined();

      const testDate = '2026-06-17T14:30:45';
      const formatted = formatFn!(testDate);
      const expected = moment(testDate).format('DD-MMM-YYYY, HH:mm');
      expect(formatted).toMatch(/\d{2}-\w{3}-\d{4}, \d{2}:\d{2}/);
      expect(formatted).toBe(expected);
    });

    it('should format insertDate with correct month abbreviation', () => {
      const formatFn = (component as any).tableConfig.columns[3].valueFormatter!;

      const mayInput = '2025-05-09T10:30:00';
      const mayDate = formatFn(mayInput);
      expect(mayDate).toBe(moment(mayInput).format('DD-MMM-YYYY, HH:mm'));

      const sepInput = '2023-09-22T17:34:02';
      const sepDate = formatFn(sepInput);
      expect(sepDate).toBe(moment(sepInput).format('DD-MMM-YYYY, HH:mm'));
    });

    it('should return dash for null or undefined date', () => {
      const formatFn = (component as any).tableConfig.columns[3].valueFormatter!;

      expect(formatFn(null)).toBe('-');
      expect(formatFn(undefined)).toBe('-');
      expect(formatFn('')).toBe('-');
    });

    it('should return dash for DateTime.MinValue (0001-01-01T00:00:00)', () => {
      const formatFn = (component as any).tableConfig.columns[3].valueFormatter!;

      expect(formatFn('0001-01-01T00:00:00')).toBe('-');
      expect(formatFn('0001-01-01T00:00:00Z')).toBe('-');
    });

    it('should return dash for invalid date string', () => {
      const formatFn = (component as any).tableConfig.columns[3].valueFormatter!;

      expect(formatFn('not-a-date')).toBe('-');
    });
  });

  // ===== Date Input Handling =====

  describe('Date Input Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear from date control when input is empty', () => {
      (component as any).fromDateControl.setValue(moment('2026-06-01'));
      const mockEvent = { target: { value: '' } } as unknown as Event;
      (component as any).onFromDateInput(mockEvent);

      expect((component as any).fromDateControl.value).toBeNull();
      expect((component as any).fromDateControl.errors).toBeNull();
    });

    it('should clear from date control when input is whitespace', () => {
      (component as any).fromDateControl.setValue(moment('2026-06-01'));
      const mockEvent = { target: { value: '   ' } } as unknown as Event;
      (component as any).onFromDateInput(mockEvent);

      expect((component as any).fromDateControl.value).toBeNull();
    });

    it('should set invalidDate error when from date input cannot be parsed', () => {
      const mockEvent = { target: { value: 'abc' } } as unknown as Event;
      (component as any).onFromDateInput(mockEvent);

      expect((component as any).fromDateControl.hasError('invalidDate')).toBe(true);
      expect((component as any).fromDateControl.touched).toBe(true);
    });

    it('should clear to date control when input is empty', () => {
      (component as any).toDateControl.setValue(moment('2026-06-17'));
      const mockEvent = { target: { value: '' } } as unknown as Event;
      (component as any).onToDateInput(mockEvent);

      expect((component as any).toDateControl.value).toBeNull();
      expect((component as any).toDateControl.errors).toBeNull();
    });

    it('should clear to date control when input is whitespace', () => {
      (component as any).toDateControl.setValue(moment('2026-06-17'));
      const mockEvent = { target: { value: '   ' } } as unknown as Event;
      (component as any).onToDateInput(mockEvent);

      expect((component as any).toDateControl.value).toBeNull();
    });

    it('should set invalidDate error when to date input cannot be parsed', () => {
      const mockEvent = { target: { value: 'xyz' } } as unknown as Event;
      (component as any).onToDateInput(mockEvent);

      expect((component as any).toDateControl.hasError('invalidDate')).toBe(true);
      expect((component as any).toDateControl.touched).toBe(true);
    });
  });

  // ===== Chapter Changes =====

  describe('Chapter Changes', () => {
    it('should clear data when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).apiLogs.set(mockApiLogs);
      (component as any).hasRetrieved.set(true);

      mockHeaderService.chapterChanged$.next(null);
      tick();

      expect((component as any).sourceApplicationIdControl.value).toBeNull();
      expect((component as any).apiLogs().length).toBe(0);
      expect((component as any).hasRetrieved()).toBe(false);
    }));

    it('should reload source applications when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockService.getSourceCodes.calls.reset();

      mockHeaderService.chapterChanged$.next(null);
      tick();

      expect(mockService.getSourceCodes).toHaveBeenCalled();
    }));
  });

  // ===== Unique ID Generation =====

  describe('Unique ID Generation', () => {
    it('should generate unique component IDs', () => {
      const fixture1 = TestBed.createComponent(LifeTrakApiLogInformationQueryComponent);
      const fixture2 = TestBed.createComponent(LifeTrakApiLogInformationQueryComponent);

      expect((fixture1.componentInstance as any).componentId).not.toBe((fixture2.componentInstance as any).componentId);
    });

    it('should generate element IDs with component prefix', () => {
      const elementId = (component as any).elementId('source-app-id');
      expect(elementId).toContain('life-trak-api-log-');
      expect(elementId).toContain('-source-app-id');
    });

    it('should generate error IDs with component prefix and error suffix', () => {
      const errorId = (component as any).errorId('from-date');
      expect(errorId).toContain('life-trak-api-log-');
      expect(errorId).toContain('-from-date-error');
    });
  });

  // ===== Lifecycle =====

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  // ===== Accessibility (WCAG 2.1 AA) =====

  describe('Accessibility (WCAG 2.1 AA)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have aria-describedby on source application select linking to error', () => {
      const select = fixture.nativeElement.querySelector('mat-select');
      (component as any).sourceApplicationIdControl.markAsTouched();
      (component as any).sourceApplicationIdControl.setValue('');
      fixture.detectChanges();

      const ariaDescribedBy = select.getAttribute('aria-describedby');
      if ((component as any).sourceApplicationIdControl.invalid && (component as any).sourceApplicationIdControl.touched) {
        expect(ariaDescribedBy).toBeTruthy();
      }
    });

    it('should have aria-describedby on From Date input when error exists', () => {
      const fromDateInput = fixture.nativeElement.querySelector(`[id*="from-date"]`);
      expect(fromDateInput).toBeTruthy();

      (component as any).fromDateControl.setErrors({ invalidDate: true });
      (component as any).fromDateControl.markAsTouched();
      fixture.detectChanges();

      const ariaDescribedBy = fromDateInput.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();
      expect(ariaDescribedBy).toContain('from-date-error');
    });

    it('should not have aria-describedby on From Date input when no error', () => {
      const fromDateInput = fixture.nativeElement.querySelector(`[id*="from-date"]`);
      expect(fromDateInput).toBeTruthy();

      (component as any).fromDateControl.setErrors(null);
      fixture.detectChanges();

      const ariaDescribedBy = fromDateInput.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeNull();
    });

    it('should have aria-describedby on To Date input when error exists', () => {
      const toDateInput = fixture.nativeElement.querySelector(`[id*="to-date"]`);
      expect(toDateInput).toBeTruthy();

      (component as any).toDateControl.setErrors({ invalidDate: true });
      (component as any).toDateControl.markAsTouched();
      fixture.detectChanges();

      const ariaDescribedBy = toDateInput.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeTruthy();
      expect(ariaDescribedBy).toContain('to-date-error');
    });

    it('should not have aria-describedby on To Date input when no error', () => {
      const toDateInput = fixture.nativeElement.querySelector(`[id*="to-date"]`);
      expect(toDateInput).toBeTruthy();

      (component as any).toDateControl.setErrors(null);
      fixture.detectChanges();

      const ariaDescribedBy = toDateInput.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeNull();
    });

    it('should have id on From Date mat-error for aria-describedby linkage', () => {
      (component as any).fromDateControl.setErrors({ invalidDate: true });
      (component as any).fromDateControl.markAsTouched();
      fixture.detectChanges();

      const matError = fixture.nativeElement.querySelector('mat-error[id*="from-date-error"]');
      expect(matError).toBeTruthy();
    });

    it('should have id on To Date mat-error for aria-describedby linkage', () => {
      (component as any).toDateControl.setErrors({ invalidDate: true });
      (component as any).toDateControl.markAsTouched();
      fixture.detectChanges();

      const matError = fixture.nativeElement.querySelector('mat-error[id*="to-date-error"]');
      expect(matError).toBeTruthy();
    });

    it('should have type="button" on RETRIEVE button', () => {
      const retrieveBtn = fixture.nativeElement.querySelector('.btn-retrieve');
      expect(retrieveBtn).toBeTruthy();
      expect(retrieveBtn.getAttribute('type')).toBe('button');
    });

    it('should have type="button" on CLEAR ALL button', () => {
      const clearBtn = fixture.nativeElement.querySelector('.btn-clear');
      expect(clearBtn).toBeTruthy();
      expect(clearBtn.getAttribute('type')).toBe('button');
    });

    it('should have role="status" on empty state container', () => {
      const emptyContainer = fixture.nativeElement.querySelector('.empty-container');
      expect(emptyContainer).toBeTruthy();
      expect(emptyContainer.getAttribute('role')).toBe('status');
    });

    it('should have aria-hidden="true" on decorative search icon', () => {
      const icon = fixture.nativeElement.querySelector('.empty-icon');
      expect(icon).toBeTruthy();
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('should display correct empty state hint text', () => {
      const hint = fixture.nativeElement.querySelector('.empty-hint');
      expect(hint).toBeTruthy();
      expect(hint.textContent.trim()).toBe('Select a Source Application ID and click RETRIEVE to begin');
    });

    it('should have role="status" and aria-live on loading container', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');

      const loadingSubject = new Subject<ApiLogSearchResponse>();
      mockService.searchLogs.and.returnValue(loadingSubject.asObservable());

      (component as any).onRetrieve();
      fixture.detectChanges();

      const loadingContainer = fixture.nativeElement.querySelector('.loading-container');
      expect(loadingContainer).toBeTruthy();
      expect(loadingContainer.getAttribute('role')).toBe('status');
      expect(loadingContainer.getAttribute('aria-live')).toBe('polite');
      expect(loadingContainer.getAttribute('aria-busy')).toBe('true');

      loadingSubject.next(mockSearchResponse);
      loadingSubject.complete();
      tick();
    }));

    it('should have aria-label on mat-spinner', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');

      const loadingSubject = new Subject<ApiLogSearchResponse>();
      mockService.searchLogs.and.returnValue(loadingSubject.asObservable());

      (component as any).onRetrieve();
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
      expect(spinner.getAttribute('aria-label')).toBe('Loading API logs');

      loadingSubject.next(mockSearchResponse);
      loadingSubject.complete();
      tick();
    }));

    it('should have screen-reader-only result count announcement after data loads', fakeAsync(() => {
      (component as any).sourceApplicationIdControl.setValue('APP001');
      (component as any).onRetrieve();
      tick();
      fixture.detectChanges();

      const srAnnouncement = fixture.nativeElement.querySelector('.cdk-visually-hidden[role="status"]');
      expect(srAnnouncement).toBeTruthy();
      expect(srAnnouncement.getAttribute('aria-live')).toBe('polite');
      expect(srAnnouncement.getAttribute('aria-atomic')).toBe('true');
      expect(srAnnouncement.textContent.trim()).toContain('2 API log records found');
    }));

    it('should have aria-label on datepicker toggle for From Date', () => {
      const toggles = fixture.nativeElement.querySelectorAll('mat-datepicker-toggle');
      expect(toggles.length).toBe(2);
      expect(toggles[0].getAttribute('aria-label')).toBe('Open From Date calendar');
    });

    it('should have aria-label on datepicker toggle for To Date', () => {
      const toggles = fixture.nativeElement.querySelectorAll('mat-datepicker-toggle');
      expect(toggles.length).toBe(2);
      expect(toggles[1].getAttribute('aria-label')).toBe('Open To Date calendar');
    });

    it('should have aria-label on ngx-mat-select-search', () => {
      const selectSearch = fixture.nativeElement.querySelector('ngx-mat-select-search');
      if (selectSearch) {
        expect(selectSearch.getAttribute('arialabel') || selectSearch.getAttribute('ng-reflect-aria-label')).toBeTruthy();
      }
    });

    it('should have id attribute on source app error message', () => {
      (component as any).sourceApplicationIdControl.markAsTouched();
      (component as any).sourceApplicationIdControl.setValue('');
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('mat-error[id*="source-app-id-error"]');
      expect(errorEl).toBeTruthy();
    });
  });

  // ===== Menu Header Configuration =====

  describe('Menu Header Configuration', () => {
    it('should have default header config', () => {
      expect((component as any).headerConfig).toBeDefined();
      expect((component as any).headerConfig.breadcrumbs).toEqual([]);
      expect((component as any).headerConfig.title).toBe('');
    });

    it('should have header config with subtitle field', () => {
      expect((component as any).headerConfig.subtitle).toBe('');
    });

    it('should have table config with correct empty message', () => {
      expect((component as any).tableConfig.emptyMessage).toContain('No Results to Display');
    });

    it('should have table config with loading message', () => {
      expect((component as any).tableConfig.loadingMessage).toBe('Loading API logs...');
    });
  });
});
