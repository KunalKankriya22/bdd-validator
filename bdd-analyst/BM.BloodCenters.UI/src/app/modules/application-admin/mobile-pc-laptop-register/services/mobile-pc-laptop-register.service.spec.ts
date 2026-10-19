import { MatSnackBar } from '@angular/material/snack-bar';
import { MobilePcLaptopRegisterService } from './mobile-pc-laptop-register.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  MobilePcLaptopRegisterModel,
  MobilePcLaptopRegisterParamsDto,
  MobilePcLaptopRegisterDto,
  UpdateMobilePcLaptopRegisterDto,
  MobilePcLaptopRegisterRawData,
  ChapterLookup
} from '../models/mobile-pc-laptop-register.model';

describe('MobilePcLaptopRegisterService', () => {
  let service: MobilePcLaptopRegisterService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockRawData: MobilePcLaptopRegisterRawData[] = [
    {
      laptopId: 'LTP-101',
      ltTempId: 'A1',
      chapterId: 'DAL',
      insertDate: '2025-01-15T10:30:00Z',
      insertUser: 'admin',
      currentSeq: 10542,
      incrementBy: 1,
      refreshDate: '2025-12-02T00:00:00Z',
      location: '  LAB  ',
      detail1: '  Server detail A  ',
      detail2: '  Config type 1  ',
      detail3: 'C1',
      detail4: 'C1'
    },
    {
      laptopId: 'LTP-102',
      ltTempId: 'B2',
      chapterId: 'DAL',
      insertDate: '2025-02-20T14:00:00Z',
      insertUser: 'user1',
      currentSeq: 9876,
      incrementBy: 2,
      refreshDate: '2025-04-15T00:00:00Z',
      location: 'OFFICE',
      detail1: '',
      detail2: '',
      detail3: '',
      detail4: ''
    }
  ];

  const mockApiResponse = {
    success: true,
    message: '',
    statusCode: 200,
    data: mockRawData,
    total: 2,
    errorResponse: { errorCode: '', error: '' }
  };

  const mockChapters = [
    { chapterId: 'DAL' },
    { chapterId: 'HOU' },
    { chapterId: 'AUS' }
  ];

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    mockSnackBar = createMockMatSnackBar();

        service = new MobilePcLaptopRegisterService(mockApiService as any, mockSnackBar as any);
  });


  describe('getMobilePcLaptopRegister', () => {




    it('should map raw data to model correctly', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe(result => {
        const firstRecord = result.data[0];

        expect(firstRecord.laptopId).toBe('LTP-101');
        expect(firstRecord.temporaryId).toBe('A1');
        expect(firstRecord.chapterId).toBe('DAL');
        expect(firstRecord.chapter).toBe('DAL');
        expect(firstRecord.currentSequence).toBe(10542);
        expect(firstRecord.auditIncrement).toBe(1);
        expect(firstRecord.location).toBe('LAB'); // Should be trimmed
        expect(firstRecord.detail1).toBe('Server detail A'); // Should be trimmed
        expect(firstRecord.createdBy).toBe('admin');
        expect(firstRecord.createdDate).toBeInstanceOf(Date);
        expect(firstRecord.refreshDate).toBeInstanceOf(Date);
        done();
      });
    });



    it('should handle pagination parameters correctly', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getMobilePcLaptopRegister(25, 50, {}).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/mobile-pc-laptop-register\/25\/50/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should default data to empty array when response.data is null', (done) => {
      const responseWithNullData = { ...mockApiResponse, data: null as any, total: 5 };
      mockApiService.post.and.returnValue(of(responseWithNullData));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(5);
        done();
      });
    });

    it('should default data to empty array when response.data is undefined', (done) => {
      const responseWithUndefinedData = { ...mockApiResponse, data: undefined as any, total: 3 };
      mockApiService.post.and.returnValue(of(responseWithUndefinedData));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(3);
        done();
      });
    });

    it('should default totalRecords to 0 when response.total is null', (done) => {
      const responseWithNullTotal = { ...mockApiResponse, data: [], total: null as any };
      mockApiService.post.and.returnValue(of(responseWithNullTotal));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe(result => {
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should default totalRecords to 0 when response.total is undefined', (done) => {
      const responseWithUndefinedTotal = { ...mockApiResponse, data: [], total: undefined as any };
      mockApiService.post.and.returnValue(of(responseWithUndefinedTotal));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe(result => {
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should set createdDate and modifiedDate to undefined when insertDate is falsy', (done) => {
      const rawDataNoDate: MobilePcLaptopRegisterRawData[] = [{
        laptopId: 'LTP-200',
        ltTempId: 'X1',
        chapterId: 'HOU',
        insertDate: '' as any,
        insertUser: 'user2',
        currentSeq: 100,
        incrementBy: 1,
        refreshDate: '2025-06-01T00:00:00Z',
        location: 'SITE',
        detail1: 'D1',
        detail2: 'D2',
        detail3: 'D3',
        detail4: 'D4'
      }];
      mockApiService.post.and.returnValue(of({ ...mockApiResponse, data: rawDataNoDate, total: 1 }));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe(result => {
        expect(result.data[0].createdDate).toBeUndefined();
        expect(result.data[0].modifiedDate).toBeUndefined();
        done();
      });
    });

    it('should set refreshDate to undefined when refreshDate is falsy', (done) => {
      const rawDataNoRefresh: MobilePcLaptopRegisterRawData[] = [{
        laptopId: 'LTP-201',
        ltTempId: 'X2',
        chapterId: 'AUS',
        insertDate: '2025-01-01T00:00:00Z',
        insertUser: 'user3',
        currentSeq: 200,
        incrementBy: 1,
        refreshDate: '' as any,
        location: 'OFFICE',
        detail1: 'A',
        detail2: 'B',
        detail3: 'C',
        detail4: 'D'
      }];
      mockApiService.post.and.returnValue(of({ ...mockApiResponse, data: rawDataNoRefresh, total: 1 }));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe(result => {
        expect(result.data[0].refreshDate).toBeUndefined();
        expect(result.data[0].createdDate).toBeInstanceOf(Date);
        done();
      });
    });

    it('should default location to empty string when location is null', (done) => {
      const rawDataNullLocation: MobilePcLaptopRegisterRawData[] = [{
        laptopId: 'LTP-202',
        ltTempId: 'X3',
        chapterId: 'DAL',
        insertDate: '2025-01-01T00:00:00Z',
        insertUser: 'user4',
        currentSeq: 300,
        incrementBy: 1,
        refreshDate: '2025-06-01T00:00:00Z',
        location: null as any,
        detail1: null as any,
        detail2: null as any,
        detail3: null as any,
        detail4: null as any
      }];
      mockApiService.post.and.returnValue(of({ ...mockApiResponse, data: rawDataNullLocation, total: 1 }));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe(result => {
        expect(result.data[0].location).toBe('');
        expect(result.data[0].detail1).toBe('');
        expect(result.data[0].detail2).toBe('');
        expect(result.data[0].detail3).toBe('');
        expect(result.data[0].detail4).toBe('');
        done();
      });
    });

    it('should return correct totalRecords from response', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe(result => {
        expect(result.totalRecords).toBe(2);
        expect(result.data.length).toBe(2);
        done();
      });
    });

    it('should pass params to the API call', (done) => {
      const params: MobilePcLaptopRegisterParamsDto = {
        searchKeyword: 'test',
        chapterId: 'DAL',
        sort: 'A'
      };
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getMobilePcLaptopRegister(10, 0, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.any(String),
          params
        );
        done();
      });
    });

  });
  describe('getMobilePcLaptopRegisterFilters', () => {
    it('should return filters on success', (done) => {
      const mockFilters = { chapters: [{ chapterId: 'DAL', chapterName: 'Dallas' }] };
      mockApiService.get.and.returnValue(of(mockFilters));

      service.getMobilePcLaptopRegisterFilters().subscribe(result => {
        expect(result.chapters.length).toBe(1);
        expect(result.chapters[0].chapterId).toBe('DAL');
        expect(result.chapters[0].chapterName).toBe('Dallas');
        done();
      });
    });

    it('should show snackbar with error.error.message on error', (done) => {
      const error = { error: { message: 'Server filter error' }, message: 'Fallback msg' };
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getMobilePcLaptopRegisterFilters().subscribe({
        error: (err) => {
          expect(mockSnackBar.open).toHaveBeenCalledWith(
            'Server filter error',
            'Close',
            jasmine.objectContaining({
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            })
          );
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should show snackbar with error.message when error.error.message is absent', (done) => {
      const error = { message: 'Network filter error' };
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getMobilePcLaptopRegisterFilters().subscribe({
        error: (err) => {
          expect(mockSnackBar.open).toHaveBeenCalledWith(
            'Network filter error',
            'Close',
            jasmine.objectContaining({ duration: 5000 })
          );
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should show default snackbar message when no error message properties exist', (done) => {
      const error = {};
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getMobilePcLaptopRegisterFilters().subscribe({
        error: (err) => {
          expect(mockSnackBar.open).toHaveBeenCalledWith(
            'Error loading filters',
            'Close',
            jasmine.objectContaining({ duration: 5000 })
          );
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should show default snackbar message when error is null-like', (done) => {
      const error = null;
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getMobilePcLaptopRegisterFilters().subscribe({
        error: (err) => {
          expect(mockSnackBar.open).toHaveBeenCalledWith(
            'Error loading filters',
            'Close',
            jasmine.objectContaining({ duration: 5000 })
          );
          done();
        }
      });
    });
  });

  describe('getChapters', () => {


    it('should map chapters correctly', (done) => {
      mockApiService.get.and.returnValue(of(mockChapters));

      service.getChapters().subscribe(result => {
        expect(result.length).toBe(3);
        // Results are sorted by chapterId: AUS, DAL, HOU
        expect(result[0].chapterId).toBe('AUS');
        expect(result[0].chapterName).toBe('AUS'); // Falls back to chapterId when chapterName absent
        expect(result[1].chapterId).toBe('DAL');
        expect(result[2].chapterId).toBe('HOU');
        done();
      });
    });

    it('should use chapterName when it is provided', (done) => {
      const chaptersWithNames = [
        { chapterId: 'DAL', chapterName: 'Dallas' },
        { chapterId: 'HOU', chapterName: 'Houston' }
      ];
      mockApiService.get.and.returnValue(of(chaptersWithNames));

      service.getChapters().subscribe(result => {
        expect(result[0].chapterName).toBe('Dallas');
        expect(result[1].chapterName).toBe('Houston');
        done();
      });
    });

    it('should fall back to chapterId when chapterName is undefined', (done) => {
      const chaptersNoName = [
        { chapterId: 'AUS' },
        { chapterId: 'DAL', chapterName: '' }
      ];
      mockApiService.get.and.returnValue(of(chaptersNoName));

      service.getChapters().subscribe(result => {
        expect(result[0].chapterName).toBe('AUS');
        // empty string is falsy, so should fall back to chapterId
        expect(result[1].chapterName).toBe('DAL');
        done();
      });
    });

    it('should sort chapters by chapterId alphabetically', (done) => {
      const unsortedChapters = [
        { chapterId: 'HOU' },
        { chapterId: 'AUS' },
        { chapterId: 'DAL' }
      ];
      mockApiService.get.and.returnValue(of(unsortedChapters));

      service.getChapters().subscribe(result => {
        expect(result[0].chapterId).toBe('AUS');
        expect(result[1].chapterId).toBe('DAL');
        expect(result[2].chapterId).toBe('HOU');
        done();
      });
    });

    it('should show snackbar with error.error.message on error', (done) => {
      const error = { error: { message: 'Server chapter error' }, message: 'Fallback' };
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getChapters().subscribe({
        error: (err) => {
          expect(mockSnackBar.open).toHaveBeenCalledWith(
            'Server chapter error',
            'Close',
            jasmine.objectContaining({
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            })
          );
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should show snackbar with error.message when error.error.message is absent', (done) => {
      const error = { message: 'Network chapter error' };
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getChapters().subscribe({
        error: (err) => {
          expect(mockSnackBar.open).toHaveBeenCalledWith(
            'Network chapter error',
            'Close',
            jasmine.objectContaining({ duration: 5000 })
          );
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should show default snackbar message when no error message properties exist', (done) => {
      const error = {};
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getChapters().subscribe({
        error: (err) => {
          expect(mockSnackBar.open).toHaveBeenCalledWith(
            'Error loading chapters',
            'Close',
            jasmine.objectContaining({ duration: 5000 })
          );
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should show default snackbar message when error is null', (done) => {
      const error = null;
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getChapters().subscribe({
        error: () => {
          expect(mockSnackBar.open).toHaveBeenCalledWith(
            'Error loading chapters',
            'Close',
            jasmine.objectContaining({ duration: 5000 })
          );
          done();
        }
      });
    });
  });

  describe('addMobilePcLaptopRegister', () => {
    it('should call apiService.post with correct endpoint and data', (done) => {
      const mockResponse = { success: true };
      mockApiService.post.and.returnValue(of(mockResponse));

      const newRecord: MobilePcLaptopRegisterDto = {
        laptopId: 'LTP-103',
        ltTempId: 'C3',
        chapterId: 'DAL',
        currentSeq: 1000,
        incrementBy: 1,
        refreshDate: '2025-12-31T00:00:00Z',
        location: 'LAB',
        detail1: 'Test',
        detail2: '',
        detail3: '',
        detail4: ''
      };

      service.addMobilePcLaptopRegister(newRecord).subscribe(result => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/mobile-pc-laptop-register$/),
          newRecord
        );
        expect(result.success).toBeTrue();
        done();
      });
    });
  });

  describe('updateMobilePcLaptopRegister', () => {
    it('should call apiService.put with correct endpoint and data', (done) => {
      const mockResponse = { success: true };
      mockApiService.put.and.returnValue(of(mockResponse));

      const updateRecord: UpdateMobilePcLaptopRegisterDto = {
        OldLaptopId: 'LTP-101',
        OldChapterId: 'DAL',
        newLaptopId: 'LTP-101-UPDATED',
        chapterId: 'DAL',
        ltTempId: 'A1',
        currentSeq: 10543,
        incrementBy: 2,
        refreshDate: '2025-12-31T00:00:00Z',
        location: 'LAB-2',
        detail1: 'Updated',
        detail2: '',
        detail3: '',
        detail4: ''
      };

      service.updateMobilePcLaptopRegister(updateRecord).subscribe(result => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          jasmine.stringMatching(/mobile-pc-laptop-register$/),
          updateRecord
        );
        expect(result.success).toBeTrue();
        done();
      });
    });
  });

  describe('formatDateForApi', () => {
    it('should format date to ISO string', () => {
      const testDate = new Date('2025-03-05T10:30:00');
      const result = service.formatDateForApi(testDate);

      expect(result).toContain('2025-03-05');
      expect(result).toContain('T');
    });

    it('should return empty string when date is null', () => {
      const result = service.formatDateForApi(null);
      expect(result).toBe('');
    });

  });

  describe('Error Handling', () => {
    it('should propagate errors from getMobilePcLaptopRegister', (done) => {
      const error = { error: { message: 'API Error' } };
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getMobilePcLaptopRegister(10, 0, {}).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });



    it('should propagate errors from addMobilePcLaptopRegister', (done) => {
      const error = { error: { message: 'Failed to add record' } };
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addMobilePcLaptopRegister({} as MobilePcLaptopRegisterDto).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should propagate errors from updateMobilePcLaptopRegister', (done) => {
      const error = { error: { message: 'Failed to update record' } };
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateMobilePcLaptopRegister({} as UpdateMobilePcLaptopRegisterDto).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });
});
