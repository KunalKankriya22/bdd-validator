import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DefineDefaultDriveChecklistService } from './define-default-drive-checklist.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineDefaultDriveChecklistService', () => {
  let service: DefineDefaultDriveChecklistService;
  let apiService: jasmine.SpyObj<ApiService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    headerService = createMockHeaderService({ chapterId: () => 'CH001' });

    TestBed.configureTestingModule({
      providers: [
        DefineDefaultDriveChecklistService,
        { provide: ApiService, useValue: apiService },
        { provide: HeaderService, useValue: headerService },
      ],
    });
    service = TestBed.inject(DefineDefaultDriveChecklistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDriveChecklist', () => {
    const params = { searchKeyword: 'test' };

    it('should POST to correct endpoint with take/skip in URL', (done) => {
      apiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.getDriveChecklist(10, 0, params).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/donor/drive-checklist/10/0',
          params,
          jasmine.objectContaining({ headers: jasmine.anything() })
        );
        done();
      });
    });

    it('should map response data and total correctly', (done) => {
      const mockItems = [
        { actionCode: 'A1', actionDescription: 'Action 1', targetDays: 5 },
        { actionCode: 'A2', actionDescription: 'Action 2', targetDays: 10 },
      ];
      apiService.post.and.returnValue(of({ data: mockItems, total: 2 }));

      service.getDriveChecklist(10, 0, params).subscribe((result) => {
        expect(result.data).toEqual(mockItems as any);
        expect(result.totalRecords).toBe(2);
        done();
      });
    });

    it('should default to empty array and zero total when response fields are missing', (done) => {
      apiService.post.and.returnValue(of({} as any));

      service.getDriveChecklist(10, 0, params).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should return empty result for 404 with success=true (no data found)', (done) => {
      const notFoundError = { status: 404, error: { success: true } };
      apiService.post.and.returnValue(throwError(() => notFoundError));

      service.getDriveChecklist(10, 0, params).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should propagate error for non-404 failures', (done) => {
      spyOn(console, 'error');
      const serverError = { status: 500, message: 'Server error' };
      apiService.post.and.returnValue(throwError(() => serverError));

      service.getDriveChecklist(10, 0, params).subscribe({
        error: (err) => {
          expect(err).toBe(serverError);
          expect(console.error).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should propagate error for 404 without success=true', (done) => {
      spyOn(console, 'error');
      const error = { status: 404, error: { success: false } };
      apiService.post.and.returnValue(throwError(() => error));

      service.getDriveChecklist(10, 0, params).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      apiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.getDriveChecklist(10, 0, params).subscribe(() => {
        const callArgs = apiService.post.calls.mostRecent().args;
        const headers = callArgs[2].headers;
        expect(headers.get('X-Chapter-Id')).toBe('CH001');
        done();
      });
    });

    it('should propagate error for 404 without error property', (done) => {
      spyOn(console, 'error');
      const error = { status: 404 };
      apiService.post.and.returnValue(throwError(() => error));

      service.getDriveChecklist(10, 0, params).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should construct correct URL with different take/skip values', (done) => {
      apiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.getDriveChecklist(25, 50, params).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/donor/drive-checklist/25/50',
          params,
          jasmine.objectContaining({ headers: jasmine.anything() })
        );
        done();
      });
    });

    it('should pass search params to POST body', (done) => {
      const fullParams = {
        searchKeyword: 'reminder',
        targetDays: 5,
        targetDaysCondition: 'GE',
        timeline: 'BD,AD',
        sort: 'A',
      };
      apiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.getDriveChecklist(10, 0, fullParams).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/donor/drive-checklist/10/0',
          fullParams,
          jasmine.objectContaining({ headers: jasmine.anything() })
        );
        done();
      });
    });
  });

  describe('getDriveChecklistFilters', () => {
    it('should GET from filter-dropdown endpoint', (done) => {
      apiService.get.and.returnValue(of({ data: [{}] }));

      service.getDriveChecklistFilters().subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          '/api/v1/donor/drive-checklist/filter-dropdown',
          jasmine.objectContaining({ headers: jasmine.anything() })
        );
        done();
      });
    });

    it('should return first item from data array', (done) => {
      const filterData = { timeline: [{ key: 'B', value: 'Before' }] };
      apiService.get.and.returnValue(of({ data: [filterData, { timeline: [] }] }));

      service.getDriveChecklistFilters().subscribe((result) => {
        expect(result).toEqual(filterData as any);
        done();
      });
    });

    it('should return empty object when data array is empty', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getDriveChecklistFilters().subscribe((result) => {
        expect(result).toEqual({} as any);
        done();
      });
    });

    it('should return empty object when data is null', (done) => {
      apiService.get.and.returnValue(of({ data: null }));

      service.getDriveChecklistFilters().subscribe((result) => {
        expect(result).toEqual({} as any);
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      apiService.get.and.returnValue(of({ data: [{}] }));

      service.getDriveChecklistFilters().subscribe(() => {
        const callArgs = apiService.get.calls.mostRecent().args;
        const headers = callArgs[1].headers;
        expect(headers.get('X-Chapter-Id')).toBe('CH001');
        done();
      });
    });

    it('should propagate errors', (done) => {
      spyOn(console, 'error');
      const error = { status: 500 };
      apiService.get.and.returnValue(throwError(() => error));

      service.getDriveChecklistFilters().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching drive checklist filters:',
            error
          );
          done();
        },
      });
    });
  });

  describe('getDriveChecklistAddDropdowns', () => {
    it('should GET from add-dropdown endpoint', (done) => {
      apiService.get.and.returnValue(of({ data: [{}] }));

      service.getDriveChecklistAddDropdowns().subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          '/api/v1/donor/drive-checklist/add-dropdown',
          jasmine.objectContaining({ headers: jasmine.anything() })
        );
        done();
      });
    });

    it('should return first item from add-dropdown endpoint', (done) => {
      const dropdownData = {
        actionCodes: [{ key: 'C', value: 'Call' }],
        nextSequence: 5,
      };
      apiService.get.and.returnValue(of({ data: [dropdownData] }));

      service.getDriveChecklistAddDropdowns().subscribe((result) => {
        expect(result).toEqual(dropdownData as any);
        done();
      });
    });

    it('should return empty object when data is null', (done) => {
      apiService.get.and.returnValue(of({ data: null }));

      service.getDriveChecklistAddDropdowns().subscribe((result) => {
        expect(result).toEqual({} as any);
        done();
      });
    });

    it('should return empty object when data array is empty', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getDriveChecklistAddDropdowns().subscribe((result) => {
        expect(result).toEqual({} as any);
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      apiService.get.and.returnValue(of({ data: [{}] }));

      service.getDriveChecklistAddDropdowns().subscribe(() => {
        const callArgs = apiService.get.calls.mostRecent().args;
        const headers = callArgs[1].headers;
        expect(headers.get('X-Chapter-Id')).toBe('CH001');
        done();
      });
    });

    it('should propagate errors', (done) => {
      spyOn(console, 'error');
      const error = { status: 500 };
      apiService.get.and.returnValue(throwError(() => error));

      service.getDriveChecklistAddDropdowns().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching drive checklist add dropdowns:',
            error
          );
          done();
        },
      });
    });
  });

  describe('addDriveChecklist', () => {
    const newItem = {
      actionCode: 'NEW',
      chapterId: 'CH001',
      targetDays: 7,
      timeFlag: 'B',
    };

    it('should POST to base URL with data and headers', (done) => {
      apiService.post.and.returnValue(of({ success: true, data: [] }));

      service.addDriveChecklist(newItem).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/donor/drive-checklist',
          newItem,
          jasmine.objectContaining({ headers: jasmine.anything() })
        );
        done();
      });
    });

    it('should return the API response on success', (done) => {
      const mockResponse = { success: true, data: ['created'], total: 1 };
      apiService.post.and.returnValue(of(mockResponse));

      service.addDriveChecklist(newItem).subscribe((result) => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      apiService.post.and.returnValue(of({ success: true, data: [] }));

      service.addDriveChecklist(newItem).subscribe(() => {
        const callArgs = apiService.post.calls.mostRecent().args;
        const headers = callArgs[2].headers;
        expect(headers.get('X-Chapter-Id')).toBe('CH001');
        done();
      });
    });

    it('should propagate errors on failure', (done) => {
      spyOn(console, 'error');
      const error = { status: 409, message: 'Conflict' };
      apiService.post.and.returnValue(throwError(() => error));

      service.addDriveChecklist(newItem).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error adding drive checklist item:',
            error
          );
          done();
        },
      });
    });
  });

  describe('updateDriveChecklist', () => {
    const updateData = {
      originalActionCode: 'OLD',
      chapterId: 'CH001',
      targetDays: 14,
      timeFlag: 'A',
    };

    it('should PUT to base URL with update data', (done) => {
      apiService.put.and.returnValue(of({ success: true, data: [] }));

      service.updateDriveChecklist(updateData).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          '/api/v1/donor/drive-checklist',
          updateData,
          jasmine.objectContaining({ headers: jasmine.anything() })
        );
        done();
      });
    });

    it('should return the API response on success', (done) => {
      const mockResponse = { success: true, data: ['updated'], total: 1 };
      apiService.put.and.returnValue(of(mockResponse));

      service.updateDriveChecklist(updateData).subscribe((result) => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      apiService.put.and.returnValue(of({ success: true, data: [] }));

      service.updateDriveChecklist(updateData).subscribe(() => {
        const callArgs = apiService.put.calls.mostRecent().args;
        const headers = callArgs[2].headers;
        expect(headers.get('X-Chapter-Id')).toBe('CH001');
        done();
      });
    });

    it('should propagate errors on failure', (done) => {
      spyOn(console, 'error');
      const error = { status: 400 };
      apiService.put.and.returnValue(throwError(() => error));

      service.updateDriveChecklist(updateData).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error updating drive checklist item:',
            error
          );
          done();
        },
      });
    });
  });

  describe('deleteDriveChecklist', () => {
    it('should DELETE with actionCode and chapterId in URL', (done) => {
      apiService.delete.and.returnValue(of({ success: true, data: [] }));

      service.deleteDriveChecklist('ACT01', 'CH001').subscribe(() => {
        expect(apiService.delete).toHaveBeenCalledWith(
          '/api/v1/donor/drive-checklist/ACT01/CH001',
          jasmine.objectContaining({ headers: jasmine.anything() })
        );
        done();
      });
    });

    it('should return the API response on success', (done) => {
      const mockResponse = { success: true, data: ['deleted'], total: 0 };
      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteDriveChecklist('ACT01', 'CH001').subscribe((result) => {
        expect(result).toEqual(mockResponse as any);
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      apiService.delete.and.returnValue(of({ success: true, data: [] }));

      service.deleteDriveChecklist('ACT01', 'CH001').subscribe(() => {
        const callArgs = apiService.delete.calls.mostRecent().args;
        const headers = callArgs[1].headers;
        expect(headers.get('X-Chapter-Id')).toBe('CH001');
        done();
      });
    });

    it('should construct correct URL with special characters in actionCode', (done) => {
      apiService.delete.and.returnValue(of({ success: true, data: [] }));

      service.deleteDriveChecklist('ACT/01', 'CH002').subscribe(() => {
        expect(apiService.delete).toHaveBeenCalledWith(
          '/api/v1/donor/drive-checklist/ACT/01/CH002',
          jasmine.objectContaining({ headers: jasmine.anything() })
        );
        done();
      });
    });

    it('should propagate errors on failure', (done) => {
      spyOn(console, 'error');
      const error = { status: 404 };
      apiService.delete.and.returnValue(throwError(() => error));

      service.deleteDriveChecklist('MISSING', 'CH001').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error deleting drive checklist item:',
            error
          );
          done();
        },
      });
    });
  });
});
