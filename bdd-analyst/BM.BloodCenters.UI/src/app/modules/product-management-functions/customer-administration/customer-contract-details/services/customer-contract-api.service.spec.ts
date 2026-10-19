import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CustomerContractApiService } from './customer-contract-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  CustomerContractDto,
  CreateCustomerContractRequestDto,
  UpdateCustomerContractRequestDto,
  ReturnResult
} from '../models/customer-contract.model';

describe('CustomerContractApiService', () => {
  let service: CustomerContractApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockContract: CustomerContractDto = {
    contractId: 'DI0121-001',
    customerId: 'WAD-DI0121',
    rotationFlag: 'Y',
    poNumber: 'PO-12345',
    creditLimit: 5000.00,
    startTerm: '01-Jan-2026',
    endTerm: '31-Dec-2026',
    effDate: '01-Jan-2026',
    termDate: null,
    lastModifiedDate: '06-Jun-2026'
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CustomerContractApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(CustomerContractApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getCustomerContracts', () => {
    it('should retrieve customer contracts', (done) => {
      const mockResponse: ReturnResult<CustomerContractDto> = {
        data: [mockContract],
        total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getCustomerContracts('WAD-DI0121', 25, 0).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.data[0]).toEqual(mockContract);
        done();
      });
    });

    it('should pass query parameters when provided', (done) => {
      const mockResponse: ReturnResult<CustomerContractDto> = {
        data: [mockContract],
        total: 1
      };
      const query = { customerId: 'WAD-DI0121', sortColumn: 'contractCode', sortOrder: 'ASC' };

      apiService.post.and.returnValue(of(mockResponse));

      service.getCustomerContracts('WAD-DI0121', 25, 0, query).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          jasmine.any(String),
          query
        );
        done();
      });
    });

    it('should pass empty object when no query provided', (done) => {
      const mockResponse: ReturnResult<CustomerContractDto> = {
        data: [],
        total: 0
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getCustomerContracts('WAD-DI0121', 25, 0).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          jasmine.any(String),
          {}
        );
        done();
      });
    });

    it('should handle empty data in response', (done) => {
      const mockResponse: ReturnResult<CustomerContractDto> = {
        data: undefined,
        total: undefined
      };

      apiService.post.and.returnValue(of(mockResponse as any));

      service.getCustomerContracts('WAD-DI0121', 25, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate errors', (done) => {
      const error = new Error('Network error');
      apiService.post.and.returnValue(throwError(() => error));

      service.getCustomerContracts('WAD-DI0121', 25, 0).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getCustomerContractById', () => {
    it('should retrieve a specific contract from data array', (done) => {
      const mockResponse: ReturnResult<CustomerContractDto> = {
        data: [mockContract]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getCustomerContractById('WAD-DI0121', 'DI0121-001').subscribe(result => {
        expect(result).toEqual(mockContract);
        done();
      });
    });

    it('should retrieve a specific contract from item', (done) => {
      const mockResponse: ReturnResult<CustomerContractDto> = {
        item: mockContract
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getCustomerContractById('WAD-DI0121', 'DI0121-001').subscribe(result => {
        expect(result).toEqual(mockContract);
        done();
      });
    });

    it('should return null when no data found', (done) => {
      const mockResponse: ReturnResult<CustomerContractDto> = {
        data: [],
        item: undefined
      };

      apiService.get.and.returnValue(of(mockResponse as any));

      service.getCustomerContractById('WAD-DI0121', 'DI0121-001').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate errors', (done) => {
      const error = new Error('Not found');
      apiService.get.and.returnValue(throwError(() => error));

      service.getCustomerContractById('WAD-DI0121', 'DI0121-001').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('createCustomerContract', () => {
    it('should create a new contract', (done) => {
      const createDto: CreateCustomerContractRequestDto = {
        creditLimit: 5000,
        effDate: '2026-01-30',
        rotationFlag: 'Y',
        poNumber: 'PO-123',
        startTerm: '2026-01-30',
        endTerm: '2026-12-31'
      };

      const mockResponse: ReturnResult<void> = {
        success: true,
        message: 'Contract created successfully'
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.createCustomerContract('WAD-DI0121', createDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should propagate errors on create', (done) => {
      const createDto: CreateCustomerContractRequestDto = {
        creditLimit: 5000,
        effDate: '2026-01-30'
      };

      const error = { error: { message: 'Validation failed' } };
      apiService.post.and.returnValue(throwError(() => error));

      service.createCustomerContract('WAD-DI0121', createDto).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('updateCustomerContract', () => {
    it('should update an existing contract', (done) => {
      const updateDto: UpdateCustomerContractRequestDto = {
        contractId: 'DI0121-001',
        creditLimit: 10000,
        effDate: '2026-02-01',
        rotationFlag: 'N',
        poNumber: 'PO-456',
        startTerm: '2026-02-01',
        endTerm: '2026-12-31'
      };

      const mockResponse: ReturnResult<void> = {
        success: true,
        message: 'Contract updated successfully'
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateCustomerContract('WAD-DI0121', 'DI0121-001', updateDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should propagate errors on update', (done) => {
      const updateDto: UpdateCustomerContractRequestDto = {
        contractId: 'DI0121-001',
        creditLimit: 10000,
        effDate: '2026-02-01'
      };

      const error = { error: { message: 'Update failed' } };
      apiService.put.and.returnValue(throwError(() => error));

      service.updateCustomerContract('WAD-DI0121', 'DI0121-001', updateDto).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('deleteCustomerContract', () => {
    it('should delete a contract', (done) => {
      const mockResponse: ReturnResult<void> = {
        success: true,
        message: 'Contract deleted successfully'
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteCustomerContract('WAD-DI0121', 'DI0121-001').subscribe(result => {
        expect(result.success).toBeTrue();
        expect(apiService.delete).toHaveBeenCalled();
        done();
      });
    });

    it('should propagate errors on delete', (done) => {
      const error = { error: { message: 'Delete failed' } };
      apiService.delete.and.returnValue(throwError(() => error));

      service.deleteCustomerContract('WAD-DI0121', 'DI0121-001').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });
});
