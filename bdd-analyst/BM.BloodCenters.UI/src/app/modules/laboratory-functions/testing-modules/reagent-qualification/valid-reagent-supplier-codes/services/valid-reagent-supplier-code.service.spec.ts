import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ValidReagentSupplierCodeService } from './valid-reagent-supplier-code.service';
import {
  ValidReagentSupplierCode,
  CreateValidReagentSupplierCodeDto,
  UpdateValidReagentSupplierCodeDto,
  ValidReagentSupplierCodeQueryDto,
  ValidReagentSupplierCodeApiResponse,
  ValidReagentSupplierCodeOperationResponse
} from '../models/valid-reagent-supplier-code.model';

describe('ValidReagentSupplierCodeService', () => {
  let service: ValidReagentSupplierCodeService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  const mockSupplier: ValidReagentSupplierCode = {
    supplierCode: 'SUP01',
    supplierName: 'Test Supplier',
    effDate: '2026-01-01',
    termDate: null,
    lastModifyDate: null,
    lastModifyUser: null
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ValidReagentSupplierCodeService,
        { provide: HttpClient, useValue: spy }
      ]
    });

    service = TestBed.inject(ValidReagentSupplierCodeService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('getAll', () => {
    it('should return data and totalRecords', (done) => {
      const query: ValidReagentSupplierCodeQueryDto = {};
      const mockResponse: ValidReagentSupplierCodeApiResponse<ValidReagentSupplierCode> = {
        success: true,
        data: [mockSupplier],
        total: 1,
        message: null,
        statusCode: 200
      };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.getAll(10, 0, query).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.totalRecords).toBe(1);
          expect(httpSpy.post).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should return empty array when data is null', (done) => {
      const query: ValidReagentSupplierCodeQueryDto = {};
      const mockResponse: ValidReagentSupplierCodeApiResponse<ValidReagentSupplierCode> = {
        success: true,
        data: null,
        total: 0,
        message: null,
        statusCode: 200
      };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.getAll(10, 0, query).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.totalRecords).toBe(0);
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should return 0 totalRecords when total is undefined', (done) => {
      const query: ValidReagentSupplierCodeQueryDto = {};
      const mockResponse = {
        success: true,
        data: [],
        total: undefined,
        message: null,
        statusCode: 200
      } as any;
      httpSpy.post.and.returnValue(of(mockResponse));

      service.getAll(10, 0, query).subscribe({
        next: (result) => {
          expect(result.totalRecords).toBe(0);
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should propagate error on getAll failure', (done) => {
      const query: ValidReagentSupplierCodeQueryDto = {};
      const errorResponse = { status: 500, message: 'Server Error' };
      httpSpy.post.and.returnValue(throwError(() => errorResponse));

      service.getAll(10, 0, query).subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getById', () => {
    it('should return first item from data array', (done) => {
      const mockResponse: ValidReagentSupplierCodeApiResponse<ValidReagentSupplierCode> = {
        success: true,
        data: [mockSupplier],
        total: 1,
        message: null,
        statusCode: 200
      };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getById('SUP01').subscribe({
        next: (result) => {
          expect(result).toEqual(mockSupplier);
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should return null when data array is empty', (done) => {
      const mockResponse: ValidReagentSupplierCodeApiResponse<ValidReagentSupplierCode> = {
        success: true,
        data: [],
        total: 0,
        message: null,
        statusCode: 200
      };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getById('NOTEXIST').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should return null when data is null', (done) => {
      const mockResponse: ValidReagentSupplierCodeApiResponse<ValidReagentSupplierCode> = {
        success: true,
        data: null,
        total: 0,
        message: null,
        statusCode: 200
      };
      httpSpy.get.and.returnValue(of(mockResponse));

      service.getById('NOTEXIST').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should propagate error on getById failure', (done) => {
      const errorResponse = { status: 404, message: 'Not Found' };
      httpSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getById('SUP01').subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('create', () => {
    it('should post create request and return operation response', (done) => {
      const dto: CreateValidReagentSupplierCodeDto = {
        supplierCode: 'SUP02',
        supplierName: 'New Supplier',
        effDate: '2026-01-01',
        termDate: null
      };
      const mockResponse: ValidReagentSupplierCodeOperationResponse = {
        success: true,
        message: 'Created',
        statusCode: 201
      };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.create(dto).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(httpSpy.post).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should propagate error on create failure', (done) => {
      const dto: CreateValidReagentSupplierCodeDto = {
        supplierCode: 'SUP02',
        supplierName: 'New Supplier',
        effDate: '2026-01-01',
        termDate: null
      };
      const errorResponse = { status: 400, message: 'Bad Request' };
      httpSpy.post.and.returnValue(throwError(() => errorResponse));

      service.create(dto).subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('update', () => {
    it('should put update request and return operation response', (done) => {
      const dto: UpdateValidReagentSupplierCodeDto = {
        supplierName: 'Updated Supplier',
        effDate: '2026-01-01',
        termDate: null
      };
      const mockResponse: ValidReagentSupplierCodeOperationResponse = {
        success: true,
        message: 'Updated',
        statusCode: 200
      };
      httpSpy.put.and.returnValue(of(mockResponse));

      service.update('SUP01', dto).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(httpSpy.put).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should propagate error on update failure', (done) => {
      const dto: UpdateValidReagentSupplierCodeDto = {
        supplierName: 'Updated Supplier',
        effDate: '2026-01-01',
        termDate: null
      };
      const errorResponse = { status: 500, message: 'Server Error' };
      httpSpy.put.and.returnValue(throwError(() => errorResponse));

      service.update('SUP01', dto).subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete supplier code and return operation response', (done) => {
      const mockResponse: ValidReagentSupplierCodeOperationResponse = {
        success: true,
        message: 'Deleted',
        statusCode: 200
      };
      httpSpy.delete.and.returnValue(of(mockResponse));

      service.delete('SUP01').subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(httpSpy.delete).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should propagate error on delete failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      httpSpy.delete.and.returnValue(throwError(() => errorResponse));

      service.delete('SUP01').subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });
});
