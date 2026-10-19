import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorCodeFacadeService } from './error-code-facade.service';
import { ErrorCodeApiService } from './error-code-api.service';
import { ErrorCodeStateService } from './error-code-state.service';
import { TabType } from '../models/error-code.model';

describe('ErrorCodeFacadeService', () => {
  let service: ErrorCodeFacadeService;
  let apiSpy: jasmine.SpyObj<ErrorCodeApiService>;
  let stateSpy: jasmine.SpyObj<ErrorCodeStateService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ErrorCodeApiService', [
      'getErrorCodes', 'createErrorCode', 'updateErrorCode',
    ]);

    stateSpy = jasmine.createSpyObj('ErrorCodeStateService', [
      'setLoading', 'buildListRequest', 'setErrorCodes', 'setTotalRecords',
      'setCurrentTab', 'setFilters', 'clearFilters', 'setSearchKeyword',
      'setPagination', 'setSort',
    ]);

    // Signal-like computed properties accessed as functions
    (stateSpy as any).currentTab$ = jasmine.createSpy('currentTab$').and.returnValue(TabType.DONOR);
    (stateSpy as any).errorCodes$ = jasmine.createSpy('errorCodes$').and.returnValue([]);
    (stateSpy as any).loading$ = jasmine.createSpy('loading$').and.returnValue(false);
    (stateSpy as any).totalRecords$ = jasmine.createSpy('totalRecords$').and.returnValue(0);
    (stateSpy as any).currentFilters$ = jasmine.createSpy('currentFilters$').and.returnValue({});
    (stateSpy as any).searchKeyword$ = jasmine.createSpy('searchKeyword$').and.returnValue('');
    (stateSpy as any).pagination$ = jasmine.createSpy('pagination$').and.returnValue({ take: 25, skip: 0 });
    (stateSpy as any).sort$ = jasmine.createSpy('sort$').and.returnValue(null);
    stateSpy.buildListRequest.and.returnValue({});

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        ErrorCodeFacadeService,
        { provide: ErrorCodeApiService, useValue: apiSpy },
        { provide: ErrorCodeStateService, useValue: stateSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    service = TestBed.inject(ErrorCodeFacadeService);
  });

  // -----------------------------------------------------------------------
  // loadErrorCodes
  // -----------------------------------------------------------------------
  describe('loadErrorCodes', () => {
    it('sets error codes and total on success', (done) => {
      const response = { data: [{ errorCode: 'E1' }], total: 1 };
      apiSpy.getErrorCodes.and.returnValue(of(response));

      service.loadErrorCodes();

      expect(stateSpy.setLoading).toHaveBeenCalledWith(true);
      expect(stateSpy.setErrorCodes).toHaveBeenCalledWith(response.data);
      expect(stateSpy.setTotalRecords).toHaveBeenCalledWith(1);
      expect(stateSpy.setLoading).toHaveBeenCalledWith(false);
      done();
    });

    it('logs error on failure', (done) => {
      spyOn(console, 'error');
      const error = { error: { message: 'Server error' } };
      apiSpy.getErrorCodes.and.returnValue(throwError(() => error));

      service.loadErrorCodes();

      expect(console.error).toHaveBeenCalledWith('Load error codes failed:', error);
      expect(stateSpy.setLoading).toHaveBeenCalledWith(false);
      done();
    });
  });

  // -----------------------------------------------------------------------
  // createErrorCode
  // -----------------------------------------------------------------------
  describe('createErrorCode', () => {
    it('shows success message and reloads on success', (done) => {
      const mockRequest = { errorCode: 'E1', errorType: 'D', auditFlag: 'Y', error: 'Test' };
      apiSpy.createErrorCode.and.returnValue(of({ message: 'Created', success: true }));
      apiSpy.getErrorCodes.and.returnValue(of({ data: [], total: 0 }));

      service.createErrorCode(mockRequest as any).subscribe({
        next: () => {
          expect(snackBarSpy.open).toHaveBeenCalled();
          expect(apiSpy.getErrorCodes).toHaveBeenCalled();
          done();
        },
      });
    });

    it('propagates error to observer on failure', (done) => {
      spyOn(console, 'error');
      const error = { error: { message: 'Duplicate' } };
      apiSpy.createErrorCode.and.returnValue(throwError(() => error));

      service.createErrorCode({} as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // updateErrorCode
  // -----------------------------------------------------------------------
  describe('updateErrorCode', () => {
    it('shows success message and reloads on success', (done) => {
      apiSpy.updateErrorCode.and.returnValue(of({ message: 'Updated', success: true }));
      apiSpy.getErrorCodes.and.returnValue(of({ data: [], total: 0 }));

      service.updateErrorCode('E1', {} as any).subscribe({
        next: () => {
          expect(snackBarSpy.open).toHaveBeenCalled();
          expect(apiSpy.getErrorCodes).toHaveBeenCalled();
          done();
        },
      });
    });

    it('propagates error to observer on failure', (done) => {
      spyOn(console, 'error');
      const error = { error: { message: 'Not found' } };
      apiSpy.updateErrorCode.and.returnValue(throwError(() => error));

      service.updateErrorCode('E1', {} as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // changeTab
  // -----------------------------------------------------------------------
  describe('changeTab', () => {
    it('sets current tab and reloads', (done) => {
      apiSpy.getErrorCodes.and.returnValue(of({ data: [], total: 0 }));

      service.changeTab(TabType.LAB);

      expect(stateSpy.setCurrentTab).toHaveBeenCalledWith(TabType.LAB);
      expect(apiSpy.getErrorCodes).toHaveBeenCalled();
      done();
    });
  });

  // -----------------------------------------------------------------------
  // applyFilters
  // -----------------------------------------------------------------------
  describe('applyFilters', () => {
    it('sets filters and reloads', (done) => {
      const filters = { codeFrom: 'A', codeTo: 'Z', errorType: null, auditFlag: null, showEmpty: false };
      apiSpy.getErrorCodes.and.returnValue(of({ data: [], total: 0 }));

      service.applyFilters(filters);

      expect(stateSpy.setFilters).toHaveBeenCalledWith(filters);
      expect(apiSpy.getErrorCodes).toHaveBeenCalled();
      done();
    });
  });

  // -----------------------------------------------------------------------
  // clearFilters
  // -----------------------------------------------------------------------
  describe('clearFilters', () => {
    it('clears filters and reloads', (done) => {
      apiSpy.getErrorCodes.and.returnValue(of({ data: [], total: 0 }));

      service.clearFilters();

      expect(stateSpy.clearFilters).toHaveBeenCalled();
      expect(apiSpy.getErrorCodes).toHaveBeenCalled();
      done();
    });
  });

  // -----------------------------------------------------------------------
  // search
  // -----------------------------------------------------------------------
  describe('search', () => {
    it('sets search keyword and reloads', (done) => {
      apiSpy.getErrorCodes.and.returnValue(of({ data: [], total: 0 }));

      service.search('test');

      expect(stateSpy.setSearchKeyword).toHaveBeenCalledWith('test');
      expect(apiSpy.getErrorCodes).toHaveBeenCalled();
      done();
    });
  });

  // -----------------------------------------------------------------------
  // changePagination
  // -----------------------------------------------------------------------
  describe('changePagination', () => {
    it('sets pagination and reloads', (done) => {
      const params = { take: 50, skip: 25 };
      apiSpy.getErrorCodes.and.returnValue(of({ data: [], total: 0 }));

      service.changePagination(params);

      expect(stateSpy.setPagination).toHaveBeenCalledWith(params);
      expect(apiSpy.getErrorCodes).toHaveBeenCalled();
      done();
    });
  });

  // -----------------------------------------------------------------------
  // changeSort
  // -----------------------------------------------------------------------
  describe('changeSort', () => {
    it('sets sort and reloads', (done) => {
      apiSpy.getErrorCodes.and.returnValue(of({ data: [], total: 0 }));

      service.changeSort('errorCode ASC');

      expect(stateSpy.setSort).toHaveBeenCalledWith('errorCode ASC');
      expect(apiSpy.getErrorCodes).toHaveBeenCalled();
      done();
    });
  });
});
