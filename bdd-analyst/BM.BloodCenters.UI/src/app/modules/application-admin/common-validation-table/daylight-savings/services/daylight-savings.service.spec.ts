import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { DaylightSavingsService } from './daylight-savings.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DaylightSavingsModel,
  DaylightSavingsParamsDto,
  DaylightSavingsFilterLov,
  DaylightSavingsDropdownLov,
  DaylightSavingsDto,
  UpdateDaylightSavingsDto
} from '../models/daylight-savings.model';

describe('DaylightSavingsService', () => {
  let service: DaylightSavingsService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockDaylightSavingsData: DaylightSavingsModel[] = [
    {
      chapterId: 'DAL',
      chapterName: 'Dallas Blood Center',
      startTime: '2026-03-09T02:00:00.000Z',
      endTime: '2026-11-02T02:00:00.000Z',
      baseOffSet: '-6',
      dstOffSet: -5,
      timeZoneRegion: 'UTC -06:00'
    },
    {
      chapterId: 'NYC',
      chapterName: 'New York Blood Center',
      startTime: '2026-03-09T02:00:00.000Z',
      endTime: '2026-11-02T02:00:00.000Z',
      baseOffSet: '-5',
      dstOffSet: -4,
      timeZoneRegion: 'UTC -05:00'
    }
  ];

  const mockFilterLovData: DaylightSavingsFilterLov = {
    chapterId: ['DAL', 'NYC', 'LAX'],
    chapterName: ['Dallas Blood Center', 'New York Blood Center', 'Los Angeles Blood Center'],
    timeZone: ['GMT-05:00', 'GMT-06:00', 'GMT-07:00'],
    timeZoneRegion: ['America/New_York', 'America/Chicago', 'America/Denver'],
    dstOffSet: [-8, -7, -6, -5, -4, 0]
  };

  const mockDropdownLovData: DaylightSavingsDropdownLov = {
    timeZone: ['GMT-05:00', 'GMT-06:00', 'GMT-07:00', 'GMT-08:00', 'GMT+05:30'],
    timeZoneRegion: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Asia/Kolkata']
  };

  const mockChapters = [
    { chapterId: 'DAL', chapterName: 'Dallas Blood Center' },
    { chapterId: 'NYC', chapterName: 'New York Blood Center' },
    { chapterId: 'LAX', chapterName: 'Los Angeles Blood Center' }
  ];

  const mockTimeZones = ['UTC -05:00', 'UTC -06:00', 'UTC -07:00'];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DaylightSavingsService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(DaylightSavingsService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getDaylightSavings', () => {
    it('should fetch daylight savings data successfully', (done) => {
      const take = 10;
      const skip = 0;
      const params: DaylightSavingsParamsDto = {
        searchKeyword: 'test'
      };

      const mockResponse = {
        success: true,
        data: mockDaylightSavingsData,
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getDaylightSavings(take, skip, params).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockDaylightSavingsData);
          expect(result.totalRecords).toBe(2);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS(take, skip),
            params
          );
          done();
        }
      });
    });



    it('should fetch data with filters', (done) => {
      const take = 25;
      const skip = 25;
      const params: DaylightSavingsParamsDto = {
        chapterId: 'DAL',
        chapterName: 'Dallas Blood Center',
        timeZoneRegion: 'UTC -06:00'
      };

      const mockResponse = {
        success: true,
        data: [mockDaylightSavingsData[0]],
        total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getDaylightSavings(take, skip, params).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.totalRecords).toBe(1);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS(take, skip),
            params
          );
          done();
        }
      });
    });


    it('should fetch data with sort parameter', (done) => {
      const take = 10;
      const skip = 0;
      const params: DaylightSavingsParamsDto = {
        sort: 'A'
      };

      const mockResponse = {
        success: true,
        data: mockDaylightSavingsData,
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getDaylightSavings(take, skip, params).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockDaylightSavingsData);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS(take, skip),
            params
          );
          done();
        }
      });
    });



    it('should fetch data with all filter parameters', (done) => {
      const take = 10;
      const skip = 0;
      const params: DaylightSavingsParamsDto = {
        chapterId: 'DAL',
        chapterName: 'Dallas',
        timeZoneRegion: 'UTC -06:00',
        searchKeyword: 'test',
        sort: 'D'
      };

      const mockResponse = {
        success: true,
        data: mockDaylightSavingsData,
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getDaylightSavings(take, skip, params).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockDaylightSavingsData);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS(take, skip),
            params
          );
          done();
        }
      });
    });
  });

  describe('getDaylightSavingsFilters', () => {
    it('should fetch filter LOV data successfully', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        error: null,
        statusCode: 200,
        data: [mockFilterLovData],
        total: 1
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDaylightSavingsFilters().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_FILTERS
          );
          done();
        }
      });
    });

    it('should handle empty filter LOV response', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        error: null,
        statusCode: 200,
        data: [],
        total: 0
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDaylightSavingsFilters().subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          done();
        }
      });
    });

    it('should handle filter LOV API error', (done) => {
      const errorResponse = { status: 404, statusText: 'Not Found' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getDaylightSavingsFilters().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });

  describe('getDaylightSavingsDropdown', () => {
    it('should fetch dropdown LOV data successfully', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        error: null,
        statusCode: 200,
        data: [mockDropdownLovData],
        total: 1
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDaylightSavingsDropdown().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_DROPDOWN
          );
          done();
        }
      });
    });

    it('should handle empty dropdown response', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        error: null,
        statusCode: 200,
        data: [],
        total: 0
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDaylightSavingsDropdown().subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          done();
        }
      });
    });

    it('should handle dropdown API error', (done) => {
      const errorResponse = { status: 500, statusText: 'Internal Server Error' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getDaylightSavingsDropdown().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('getChapters', () => {
    const mockChaptersResponse = {
      success: true,
      message: 'Active chapters retrieved successfully',
      error: null,
      statusCode: 200,
      data: [
        { chapterId: 'DAL', chapterName: 'Dallas Blood Center' },
        { chapterId: 'NYC', chapterName: 'New York Blood Center' }
      ],
      total: 2
    };

    beforeEach(() => {
      apiService.get.and.returnValue(of(mockChaptersResponse));
    });


    it('should return chapters data from API', (done) => {
      service.getChapters().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result).toContainEqual(jasmine.objectContaining({ chapterId: 'DAL', chapterName: 'Dallas Blood Center' }));
          expect(result).toContainEqual(jasmine.objectContaining({ chapterId: 'NYC', chapterName: 'New York Blood Center' }));
          done();
        }
      });
    });

    it('should complete the observable', (done) => {
      service.getChapters().subscribe({
        complete: () => {
          expect(true).toBe(true);
          done();
        }
      });
    });

  });

  describe('addDaylightSavings', () => {
    it('should add daylight savings record successfully', (done) => {
      const newRecord: DaylightSavingsDto = {
        chapterId: 'LAX',
        startTime: '2026-03-09T02:00:00.000Z',
        endTime: '2026-11-02T02:00:00.000Z',
        timeZone: 'America/Los_Angeles',
        timeZoneRegion: 'UTC -08:00',
        baseOffSet: '-7',
        dstOffSet: -6
      };

      const mockResponse = {
        success: true,
        message: 'Record added successfully',
        error: null,
        statusCode: 201,
        data: [mockDaylightSavingsData[0]],
        total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addDaylightSavings(newRecord).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_ADD_EDIT,
            newRecord
          );
          done();
        }
      });
    });

    it('should handle add daylight savings API error', (done) => {
      const newRecord: DaylightSavingsDto = {
        chapterId: 'LAX',
        startTime: '2026-03-09T02:00:00.000Z',
        endTime: '2026-11-02T02:00:00.000Z',
        timeZone: 'America/Los_Angeles',
        timeZoneRegion: 'UTC -08:00',
        baseOffSet: '-7',
        dstOffSet: -6
      };

      const errorResponse = { status: 400, statusText: 'Bad Request' };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.addDaylightSavings(newRecord).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(400);
          done();
        }
      });
    });

    it('should handle validation error when adding', (done) => {
      const invalidRecord: DaylightSavingsDto = {
        chapterId: '',
        startTime: '',
        endTime: '',
        timeZone: '',
        timeZoneRegion: '',
        baseOffSet: '',
        dstOffSet: 0
      };

      const errorResponse = {
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { message: 'Validation failed' }
      };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.addDaylightSavings(invalidRecord).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(422);
          done();
        }
      });
    });
  });

  describe('updateDaylightSavings', () => {
    it('should update daylight savings record successfully', (done) => {
      const updateRecord: UpdateDaylightSavingsDto = {
        chapterId: 'DAL',
        startTime: '2026-03-09T02:00:00.000Z',
        endTime: '2026-11-02T02:00:00.000Z',
        timeZone: 'America/Chicago',
        timeZoneRegion: 'UTC -06:00',
        baseOffSet: '-6',
        dstOffSet: -4
      };

      const mockResponse = {
        success: true,
        message: 'Record updated successfully',
        error: null,
        statusCode: 200,
        data: [{ ...mockDaylightSavingsData[0], dstOffSet: -4 }],
        total: 1
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateDaylightSavings(updateRecord).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.put).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS_ADD_EDIT,
            updateRecord
          );
          done();
        }
      });
    });

    it('should handle update daylight savings API error', (done) => {
      const updateRecord: UpdateDaylightSavingsDto = {
        chapterId: 'DAL',
        startTime: '2026-03-09T02:00:00.000Z',
        endTime: '2026-11-02T02:00:00.000Z',
        timeZone: 'America/Chicago',
        timeZoneRegion: 'UTC -06:00',
        baseOffSet: '-6',
        dstOffSet: -4
      };

      const errorResponse = { status: 404, statusText: 'Not Found' };

      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateDaylightSavings(updateRecord).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(404);
          done();
        }
      });
    });

    it('should handle conflict error when updating', (done) => {
      const updateRecord: UpdateDaylightSavingsDto = {
        chapterId: 'DAL',
        startTime: '2026-03-09T02:00:00.000Z',
        endTime: '2026-11-02T02:00:00.000Z',
        timeZone: 'America/Chicago',
        timeZoneRegion: 'UTC -06:00',
        baseOffSet: '-6',
        dstOffSet: -4
      };

      const errorResponse = {
        status: 409,
        statusText: 'Conflict',
        error: { message: 'Record already exists' }
      };

      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateDaylightSavings(updateRecord).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(409);
          done();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle large pagination values', (done) => {
      const take = 100;
      const skip = 500;
      const params: DaylightSavingsParamsDto = {};

      const mockResponse = {
        success: true,
        data: mockDaylightSavingsData,
        total: 1000
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getDaylightSavings(take, skip, params).subscribe({
        next: (result) => {
          expect(result.totalRecords).toBe(1000);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.DAYLIGHT_SAVINGS(take, skip),
            params
          );
          done();
        }
      });
    });

    it('should handle empty params object', (done) => {
      const params: DaylightSavingsParamsDto = {};

      const mockResponse = {
        success: true,
        data: mockDaylightSavingsData,
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getDaylightSavings(10, 0, params).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockDaylightSavingsData);
          done();
        }
      });
    });

    it('should handle empty timeZoneRegion in add request', (done) => {
      const newRecord: DaylightSavingsDto = {
        chapterId: 'LAX',
        startTime: '2026-03-09T02:00:00.000Z',
        endTime: '2026-11-02T02:00:00.000Z',
        timeZone: 'America/Los_Angeles',
        timeZoneRegion: '',
        baseOffSet: '-7',
        dstOffSet: -6
      };

      const mockResponse = {
        success: true,
        item: mockDaylightSavingsData[0]
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addDaylightSavings(newRecord).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          done();
        }
      });
    });

    it('should handle unauthorized error (401)', (done) => {
      const take = 10;
      const skip = 0;
      const params: DaylightSavingsParamsDto = {};
      const errorResponse = { status: 401, statusText: 'Unauthorized' };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.getDaylightSavings(take, skip, params).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(401);
          done();
        }
      });
    });

    it('should handle forbidden error (403)', (done) => {
      const updateRecord: UpdateDaylightSavingsDto = {
        chapterId: 'DAL',
        startTime: '2026-03-09T02:00:00.000Z',
        endTime: '2026-11-02T02:00:00.000Z',
        timeZone: 'America/Chicago',
        timeZoneRegion: 'UTC -06:00',
        baseOffSet: '-6',
        dstOffSet: -4
      };

      const errorResponse = { status: 403, statusText: 'Forbidden' };

      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateDaylightSavings(updateRecord).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(403);
          done();
        }
      });
    });
  });
});
