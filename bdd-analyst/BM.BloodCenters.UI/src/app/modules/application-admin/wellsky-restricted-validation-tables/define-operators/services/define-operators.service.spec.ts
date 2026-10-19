import { TestBed } from '@angular/core/testing';
import { DefineOperatorsService } from './define-operators.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import { ValidOperatorFilter, CreateValidOperator, UpdateValidOperator } from '../models/define-operators.model';

describe('DefineOperatorsService', () => {
  let service: DefineOperatorsService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockListResponse = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: [
      { operator: 'EQ', description: 'Equal to', valueStyle: 'S', effectiveDate: '2026-01-01T00:00:00Z', terminationDate: null },
      { operator: 'NE', description: 'Not equal to', valueStyle: 'S', effectiveDate: '2026-01-15T00:00:00Z', terminationDate: null }
    ],
    total: 2
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        DefineOperatorsService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DefineOperatorsService);
  });

  describe('getValidOperators', () => {

    it('should map response to { data, totalRecords }', (done) => {
      mockApiService.post.and.returnValue(of(mockListResponse));

      service.getValidOperators(25, 0, {}).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        expect(result.data[0].operator).toBe('EQ');
        done();
      });
    });


  });

  describe('addValidOperator', () => {
    it('should call apiService.post with correct endpoint and data', () => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      const payload: CreateValidOperator = {
        operator: 'LIKE',
        description: 'Pattern matching',
        valueStyle: 'S',
        effectiveDate: '2026-02-13T00:00:00Z'
      };

      service.addValidOperator(payload).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/valid-operators',
        payload
      );
    });

    it('should return response on success', (done) => {
      const response = { success: true, message: 'Operator added successfully' };
      mockApiService.post.and.returnValue(of(response));

      service.addValidOperator({
        operator: 'LIKE',
        valueStyle: 'S',
        effectiveDate: '2026-02-13T00:00:00Z'
      }).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should propagate 409 conflict error', (done) => {
      const error = { status: 409, error: { message: "Operator 'EQ' already exists." } };
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addValidOperator({
        operator: 'EQ',
        valueStyle: 'S',
        effectiveDate: '2026-02-13T00:00:00Z'
      }).subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
          done();
        }
      });
    });
  });

  describe('updateValidOperator', () => {
    it('should call apiService.put with correct endpoint and data', () => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      const payload: UpdateValidOperator = {
        description: 'Updated description',
        valueStyle: 'R',
        effectiveDate: '2026-01-01T00:00:00Z'
      };

      service.updateValidOperator('EQ', payload).subscribe();

      expect(mockApiService.put).toHaveBeenCalledWith(
        '/api/v1/valid-operators/EQ',
        payload
      );
    });

    it('should encode operator code in URL', () => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateValidOperator('ALL OF', {
        valueStyle: 'M',
        effectiveDate: '2026-01-01T00:00:00Z'
      }).subscribe();

      expect(mockApiService.put).toHaveBeenCalledWith(
        '/api/v1/valid-operators/ALL OF',
        jasmine.any(Object)
      );
    });

  });
});
