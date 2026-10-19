import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ModifyCheckInBatchApiService } from './modify-check-in-batch-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';

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
      // Arrange
      const mockResponse = {
        items: [
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
        totalRecords: 1,
      };
      mockApiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getCheckInBatches(25, 0).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockApiService.get).toHaveBeenCalledWith(API.MODIFY_CHECK_IN_BATCH.LIST(25, 0));
        done();
      });
    });

    it('should include query parameters when provided', (done) => {
      // Arrange
      const mockResponse = { items: [], totalRecords: 0 };
      mockApiService.get.and.returnValue(of(mockResponse));
      const params = {
        searchKeyword: '111619',
        productType: 'FFP',
        sortColumn: 'batchId',
        sortOrder: 'ASC' as const,
      };

      // Act
      service.getCheckInBatches(25, 0, params).subscribe(() => {
        // Assert
        const expectedUrl = `${API.MODIFY_CHECK_IN_BATCH.LIST(25, 0)}?searchKeyword=111619&productType=FFP&sortColumn=batchId&sortOrder=ASC`;
        expect(mockApiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });
  });

  describe('getCheckInBatchById', () => {
    it('should fetch a single batch by ID', (done) => {
      // Arrange
      const batchId = '111619-CB9006';
      const mockBatch = {
        batchId,
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
      };
      mockApiService.get.and.returnValue(of(mockBatch));

      // Act
      service.getCheckInBatchById(batchId).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockBatch);
        expect(mockApiService.get).toHaveBeenCalledWith(API.MODIFY_CHECK_IN_BATCH.GET_BY_ID(batchId));
        done();
      });
    });
  });

  describe('updateCheckInBatch', () => {
    it('should update a batch', (done) => {
      // Arrange
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

      // Act
      service.updateCheckInBatch(batchId, updateData).subscribe(() => {
        // Assert
        expect(mockApiService.put).toHaveBeenCalledWith(
          API.MODIFY_CHECK_IN_BATCH.UPDATE(batchId),
          updateData
        );
        done();
      });
    });
  });

  describe('getDropdownOptions', () => {
    it('should fetch dropdown options', (done) => {
      // Arrange
      const mockOptions = {
        productTypes: [{ code: 'FFP', description: 'Fresh Frozen Plasma' }],
        checkInUsers: [{ userId: 'CELIHUN', userName: 'MARINE HUNTER' }],
      };
      mockApiService.get.and.returnValue(of(mockOptions));

      // Act
      service.getDropdownOptions().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockOptions);
        expect(mockApiService.get).toHaveBeenCalledWith(API.MODIFY_CHECK_IN_BATCH.DROPDOWN_OPTIONS);
        done();
      });
    });
  });

  describe('getBatchComments', () => {
    it('should fetch comments for a batch', (done) => {
      // Arrange
      const batchId = '111619-CB9006';
      const mockComments = [
        {
          commentId: '1',
          batchId,
          userId: 'JLEE',
          userName: 'John Lee',
          commentText: 'Test comment',
          createdDate: '2025-11-01T10:00:00Z',
        },
      ];
      mockApiService.get.and.returnValue(of(mockComments));

      // Act
      service.getBatchComments(batchId).subscribe((result) => {
        // Assert
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
      // Arrange
      const batchId = '111619-CB9006';
      const commentData = { commentText: 'New comment' };
      const mockResponse = {
        commentId: '2',
        batchId,
        userId: 'JLEE',
        userName: 'John Lee',
        commentText: 'New comment',
        createdDate: '2025-11-01T11:00:00Z',
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createBatchComment(batchId, commentData).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
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
      // Arrange
      const batchId = '111619-CB9006';
      const commentId = '1';
      const updateData = { commentText: 'Updated comment' };
      mockApiService.put.and.returnValue(of(undefined));

      // Act
      service.updateBatchComment(batchId, commentId, updateData).subscribe(() => {
        // Assert
        expect(mockApiService.put).toHaveBeenCalledWith(
          API.MODIFY_CHECK_IN_BATCH.COMMENTS.UPDATE(batchId, commentId),
          updateData
        );
        done();
      });
    });
  });

  describe('deleteBatchComment', () => {
    it('should delete a comment', (done) => {
      // Arrange
      const batchId = '111619-CB9006';
      const commentId = '1';
      mockApiService.delete.and.returnValue(of(undefined));

      // Act
      service.deleteBatchComment(batchId, commentId).subscribe(() => {
        // Assert
        expect(mockApiService.delete).toHaveBeenCalledWith(
          API.MODIFY_CHECK_IN_BATCH.COMMENTS.DELETE(batchId, commentId)
        );
        done();
      });
    });
  });
});
