import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeleteUnitService } from './delete-unit.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  ValidateUnitRequest,
  ValidateUnitResponse,
  DeleteUnitRequest,
  DeleteUnitResponse
} from '../models/delete-unit.model';

describe('DeleteUnitService', () => {
  let service: DeleteUnitService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockValidateResponse: ValidateUnitResponse = {
    success: true,
    message: 'Unit found',
    statusCode: 200,
    item: {
      canDelete: true,
      unitId: 'TEST123',
      validationErrors: [],
      unitReferences: [
        { tableName: 'DONATIONS', columnName: 'UNIT_ID', recordCount: 1, hasRecords: true }
      ],
      hasPooledProducts: false,
      hasActiveComponents: false,
      unitExists: true
    },
    errorResponse: {
      errorCode: '',
      error: ''
    }
  };

  const mockDeleteResponse: DeleteUnitResponse = {
    success: true,
    message: 'Unit deleted successfully',
    statusCode: 200,
    errorResponse: {
      errorCode: '',
      error: ''
    }
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DeleteUnitService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DeleteUnitService);
  });

  describe('validateUnit', () => {
    it('should validate unit by ID', (done) => {
      const request: ValidateUnitRequest = { unitId: 'TEST123' };
      mockApiService.get.and.returnValue(of(mockValidateResponse));

      service.validateUnit(request).subscribe({
        next: (response) => {
          expect(response).toEqual(mockValidateResponse);
          expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/laboratory/delete-unit/validate/TEST123');
          done();
        }
      });
    });

  });

  describe('deleteUnit', () => {
    it('should delete unit from all laboratory tables', (done) => {
      const request: DeleteUnitRequest = { unitId: 'TEST123', confirmed: true };
      mockApiService.delete.and.returnValue(of(mockDeleteResponse));

      service.deleteUnit(request).subscribe({
        next: (response) => {
          expect(response).toEqual(mockDeleteResponse);
          expect(mockApiService.delete).toHaveBeenCalledWith('/api/v1/laboratory/delete-unit', { body: request });
          done();
        }
      });
    });

    it('should handle delete error', (done) => {
      const request: DeleteUnitRequest = { unitId: 'TEST123', confirmed: true };
      const error = { error: { message: 'Delete failed' } };
      mockApiService.delete.and.returnValue(throwError(() => error));

      service.deleteUnit(request).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });
});
