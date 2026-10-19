import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MergeDuplicateDonorRecordsService } from './merge-duplicate-donor-records.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  BatchLookupModel,
  BatchSearchDto,
  BatchRetrieveResponseModel,
  DuplicateDonorModel,
  MergeDonorRequest,
  MergeDonorResultModel,
  MergePreviewRequest,
  MergePreviewResponse,
  ResolveDonorRequest,
  ReturnResult
} from '../models/merge-duplicate-donor-records.model';

describe('MergeDuplicateDonorRecordsService', () => {
  let service: MergeDuplicateDonorRecordsService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  const formatDate = (d: Date): string => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const formatDateTime = (d: Date): string => {
    const dateStr = formatDate(d);
    const hours = d.getHours() % 12 || 12;
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    return `${dateStr}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(yesterday);
  const todayDateTimeStr = formatDateTime(today);
  const yesterdayDateTimeStr = formatDateTime(yesterday);

  const mockBatchSearchDto: BatchSearchDto = {
    setId: 'DPI00000033'
  };

  const mockBatchLookupData: BatchLookupModel[] = [
    { setId: 'DPI00000033', foundOn: todayDateTimeStr },
    { setId: 'DPI00000034', foundOn: yesterdayDateTimeStr }
  ];

  const mockDonor1: DuplicateDonorModel = {
    donorId: 'DN30132273',
    donorName: 'SHELIA ROGERS',
    dateOfBirth: '13-FEB-1997',
    gender: 'F',
    sex: 'Female',
    mergeFlag: 'PRIMR',
    flag: 'Primary'
  };

  const mockDonor2: DuplicateDonorModel = {
    donorId: 'DN30132192',
    donorName: 'SHELIA PANERAHE',
    dateOfBirth: '13-FEB-1997',
    gender: 'F',
    sex: 'Female',
    mergeFlag: 'SECND',
    flag: 'Secondary'
  };

  const mockBatchRetrieveResponse: BatchRetrieveResponseModel = {
    setId: 'DPI00000033',
    foundOn: todayDateTimeStr,
    duplicates: [mockDonor1, mockDonor2]
  };

  beforeEach(() => {
    const apiServiceSpyObj = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        MergeDuplicateDonorRecordsService,
        { provide: ApiService, useValue: apiServiceSpyObj }
      ]
    });

    service = TestBed.inject(MergeDuplicateDonorRecordsService);
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchBatchesLov', () => {
    it('should search batches and return data', (done) => {
      const mockResponse: ReturnResult<BatchLookupModel> = {
        data: mockBatchLookupData,
        total: 2,
        success: true
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.searchBatchesLov(50, 0, mockBatchSearchDto).subscribe(result => {
        expect(result.data).toEqual(mockBatchLookupData);
        expect(result.total).toBe(2);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.DUPLICATE_SETS(50, 0),
          mockBatchSearchDto
        );
        done();
      });
    });


  });

  describe('retrieveBatch', () => {
    it('should retrieve batch details', (done) => {
      const mockResponse: ReturnResult<BatchRetrieveResponseModel> = {
        item: mockBatchRetrieveResponse,
        success: true
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.retrieveBatch(mockBatchSearchDto).subscribe(result => {
        expect(result).toEqual(mockBatchRetrieveResponse);
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.GET_SET('DPI00000033')
        );
        done();
      });
    });

    it('should handle response with data array', (done) => {
      const mockResponse: ReturnResult<BatchRetrieveResponseModel> = {
        data: [mockBatchRetrieveResponse],
        success: true
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.retrieveBatch(mockBatchSearchDto).subscribe(result => {
        expect(result).toEqual(mockBatchRetrieveResponse);
        done();
      });
    });


  });

  describe('previewMerge', () => {
    it('should preview merge successfully', (done) => {
      const previewRequest: MergePreviewRequest = {
        primaryDonorId: 'DN30132273',
        secondaryDonorId: 'DN30132192'
      };

      const mockResponse: ReturnResult<MergePreviewResponse> = {
        success: true,
        item: {
          primaryDonor: {
            donorId: 'DN30132273',
            firstName: 'SHELIA',
            lastName: 'ROGERS',
            dateOfBirth: '13-FEB-1997',
            gender: 'F',
            bloodType: 'O+'
          },
          secondaryDonor: {
            donorId: 'DN30132192',
            firstName: 'SHELIA',
            lastName: 'PANERAHE',
            dateOfBirth: '13-FEB-1997',
            gender: 'F',
            bloodType: 'O+'
          },
          aboMismatch: false,
          warnings: []
        }
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.previewMerge(previewRequest).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.item?.aboMismatch).toBe(false);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.PREVIEW,
          previewRequest
        );
        done();
      });
    });

  });

  describe('mergeDonors', () => {
    it('should merge donors successfully', (done) => {
      const mergeRequest: MergeDonorRequest = {
        setId: 'DPI00000033',
        primaryDonorId: 'DN30132273',
        secondaryDonorId: 'DN30132192',
        note: 'Test merge'
      };

      const mockResponse: ReturnResult<MergeDonorResultModel> = {
        success: true,
        message: 'Donors merged successfully',
        item: {
          primaryDonorId: 'DN30132273',
          secondaryDonorId: 'DN30132192',
          setId: 'DPI00000033',
          status: 'Success',
          interdictions: [],
          holdUnits: []
        }
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.mergeDonors(mergeRequest).subscribe(result => {
        expect(result.success).toBe(true);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.MERGE,
          mergeRequest
        );
        done();
      });
    });

  });

  describe('resolveDonors', () => {
    it('should resolve donors successfully', (done) => {
      const resolveRequest: ResolveDonorRequest = {
        setId: 'DPI00000033',
        firstDonorId: 'DN30132192',
        secondDonorId: 'DN30132273'
      };

      const mockResponse: ReturnResult<any> = {
        success: true,
        message: 'Donors resolved successfully'
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.resolveDonors(resolveRequest).subscribe(result => {
        expect(result.success).toBe(true);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.DONOR_PROFILE.MERGE_DUPLICATE_DONORS.RESOLVE,
          resolveRequest
        );
        done();
      });
    });

  });
});
