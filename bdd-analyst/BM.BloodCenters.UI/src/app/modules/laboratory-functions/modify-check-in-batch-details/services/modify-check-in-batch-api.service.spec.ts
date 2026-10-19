import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ModifyCheckInBatchApiService } from './modify-check-in-batch-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';

describe('ModifyCheckInBatchApiService', () => {
  let service: ModifyCheckInBatchApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ModifyCheckInBatchApiService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(ModifyCheckInBatchApiService);
  });

  describe('getCheckInBatches', () => {
    it('should fetch check-in batches with pagination', (done) => {
      const mockResponse = {
        data: [
          {
            batchId: '111619-CB9006',
            contract: 'INTERNAL',
            description: 'Brooke Army Hospital',
            minTemperature: 25,
            maxTemperature: 25,
            productType: 'FFP',
            cartonCount: 1,
            numberOfUnits: 1,
            shippedDate: '2025-12-10',
            receivedDate: '2025-12-10',
            qcDate: '2025-12-10',
            batchDate: '2025-01-11',
            checkInUserId: 'CELIHUN',
            userName: 'MARINE HUNTER',
          },
        ],
        total: 1,
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getCheckInBatches(25, 0).subscribe((result) => {
        expect(result).toEqual({ data: mockResponse.data, total: 1 });
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.CHECK_IN_BATCH_DATA.LIST(25, 0),
          {}
        );
        done();
      });
    });

    it('should include query parameters when provided', (done) => {
      const mockResponse = { data: [], total: 0 };
      mockApiService.post.and.returnValue(of(mockResponse));
      const params = {
        searchKeyword: '111619',
        productType: 'FFP',
        sortColumn: 'batchId',
        sortOrder: 'ASC' as const,
      };

      service.getCheckInBatches(25, 0, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.CHECK_IN_BATCH_DATA.LIST(25, 0),
          params
        );
        done();
      });
    });
  });

  describe('getProductTypes', () => {
    it('should fetch product types', (done) => {
      const mockOptions = {
        data: [{ productType: 'FFP' }],
      };
      mockApiService.get.and.returnValue(of(mockOptions));

      service.getProductTypes().subscribe((result) => {
        expect(result).toEqual(mockOptions.data);
        expect(mockApiService.get).toHaveBeenCalledWith(API.CHECK_IN_BATCH_DATA.PRODUCT_TYPES);
        done();
      });
    });
  });

  describe('getProductTypeFilters', () => {
    it('should fetch product type filters', (done) => {
      const mockOptions = {
        data: [{ productType: 'RBC' }, { productType: 'PLT' }],
      };
      mockApiService.get.and.returnValue(of(mockOptions));

      service.getProductTypeFilters().subscribe((result) => {
        expect(result).toEqual(mockOptions.data);
        expect(mockApiService.get).toHaveBeenCalledWith(API.CHECK_IN_BATCH_DATA.PRODUCT_TYPE_FILTERS);
        done();
      });
    });
  });

  describe('getCheckinUsers', () => {
    it('should fetch check-in users', (done) => {
      const mockUsers = {
        data: [{ userId: 'CELIHUN', userName: 'MARINE HUNTER' }],
      };
      mockApiService.get.and.returnValue(of(mockUsers));

      service.getCheckinUsers().subscribe((result) => {
        expect(result).toEqual(mockUsers.data);
        expect(mockApiService.get).toHaveBeenCalledWith(API.CHECK_IN_BATCH_DATA.CHECKIN_USERS);
        done();
      });
    });
  });

  describe('updateCheckInBatch', () => {
    it('should update a batch', (done) => {
      const batchId = '111619-CB9006';
      const updateData = {
        minTemp: 30,
        maxTemp: 35,
        productType: 'RBC',
        cartonCount: 2,
        numberOfUnits: 2,
        shippedDate: '2025-12-11',
        receivedDate: '2025-12-11',
        qcDate: '2025-12-11',
        batchDate: '2025-01-12',
      };
      mockApiService.put.and.returnValue(of(undefined));

      service.updateCheckInBatch(batchId, updateData).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          API.MODIFY_CHECK_IN_BATCH.UPDATE(batchId),
          updateData
        );
        done();
      });
    });
  });

  describe('getBatchComments', () => {
    it('should fetch comments for a batch', (done) => {
      const batchId = '111619-CB9006';
      const mockComments = [
        {
          noteId: 100,
          noteSeq: 1,
          note: 'Test comment',
          auditKey: 456,
          insertUser: 'JLEE',
          insertUserName: 'John Lee',
          insertDate: '2025-11-01T10:00:00Z',
        },
      ];
      const mockApiResponse = { success: true, message: '', statusCode: 200, data: mockComments };
      mockApiService.get.and.returnValue(of(mockApiResponse));

      service.getBatchComments(batchId).subscribe((result) => {
        expect(result).toEqual(mockComments);
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.MODIFY_CHECK_IN_BATCH.COMMENTS.LIST(batchId)
        );
        done();
      });
    });
  });

  describe('createBatchComment', () => {
    it('should create a comment', (done) => {
      const batchId = '111619-CB9006';
      const commentData = { note: 'New comment' };
      const mockComment = {
        noteId: 100,
        noteSeq: 2,
        note: 'New comment',
        auditKey: null,
        insertUser: 'JLEE',
        insertUserName: 'John Lee',
        insertDate: '2025-11-01T11:00:00Z',
      };
      const mockApiResponse = { success: true, message: '', statusCode: 200, data: mockComment };
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.createBatchComment(batchId, commentData).subscribe((result) => {
        expect(result).toEqual(mockComment);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.MODIFY_CHECK_IN_BATCH.COMMENTS.CREATE(batchId),
          commentData
        );
        done();
      });
    });
  });

  describe('updateBatchComment', () => {
    it('should update a comment', (done) => {
      const batchId = '111619-CB9006';
      const auditKey = '456';
      const updateData = { note: 'Updated comment' };
      mockApiService.put.and.returnValue(of(undefined));

      service.updateBatchComment(batchId, auditKey, updateData).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          API.MODIFY_CHECK_IN_BATCH.COMMENTS.UPDATE(batchId, auditKey),
          updateData
        );
        done();
      });
    });
  });

  describe('deleteBatchComment', () => {
    it('should delete a comment', (done) => {
      const batchId = '111619-CB9006';
      const auditKey = '456';
      mockApiService.delete.and.returnValue(of(undefined));

      service.deleteBatchComment(batchId, auditKey).subscribe(() => {
        expect(mockApiService.delete).toHaveBeenCalledWith(
          API.MODIFY_CHECK_IN_BATCH.COMMENTS.DELETE(batchId, auditKey)
        );
        done();
      });
    });
  });
});
