import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { RbcAntigenProductTypeService } from './rbc-antigen-product-type.service';
import { ApiService } from '@shared/services/api.service';
import { RbcAntigenProductTypeCreateDto, RbcAntigenProductTypeUpdateDto } from '../models/rbc-antigen-product-type.model';
import { API } from 'src/app/core/constants/api.constants';

describe('RbcAntigenProductTypeService', () => {
  let service: RbcAntigenProductTypeService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RbcAntigenProductTypeService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(RbcAntigenProductTypeService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAgPrintProdTypes', () => {
    it('should return data and total from a successful response', (done) => {
      const mockResponse = {
        data: [
          { productType: 'PT001', effDate: '2024-01-01', termDate: null },
          { productType: 'PT002', effDate: '2024-02-01', termDate: '2024-12-31' }
        ],
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getAgPrintProdTypes({ searchKeyword: null }).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.data[0].productType).toBe('PT001');
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_LIST,
          { searchKeyword: null }
        );
        done();
      });
    });

    it('should return empty data and total 0 when response is null', (done) => {
      apiService.post.and.returnValue(of(null) as any);

      service.getAgPrintProdTypes({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should return empty data and total 0 when response is undefined', (done) => {
      apiService.post.and.returnValue(of(undefined) as any);

      service.getAgPrintProdTypes({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should default data to empty array when response.data is undefined', (done) => {
      const mockResponse = { total: 5 };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getAgPrintProdTypes({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(5);
        done();
      });
    });

    it('should use data.length as total when response.total is null', (done) => {
      const mockResponse = {
        data: [
          { productType: 'PT001', effDate: '2024-01-01', termDate: null },
          { productType: 'PT002', effDate: '2024-02-01', termDate: null },
          { productType: 'PT003', effDate: '2024-03-01', termDate: null }
        ],
        total: null
      };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getAgPrintProdTypes({}).subscribe(result => {
        expect(result.total).toBe(3);
        expect(result.data.length).toBe(3);
        done();
      });
    });

    it('should use data.length as total when response.total is undefined', (done) => {
      const mockResponse = {
        data: [{ productType: 'PT001', effDate: '2024-01-01', termDate: null }]
      };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getAgPrintProdTypes({}).subscribe(result => {
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should return total 0 when response.total is 0', (done) => {
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getAgPrintProdTypes({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should pass filter body to the API call', (done) => {
      const body = {
        productType: 'PT001',
        effDateAfter: '2024-01-01',
        effDateBefore: '2024-12-31',
        sort: 'productType'
      };
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getAgPrintProdTypes(body).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_LIST,
          body
        );
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const mockError = new Error('Network error');
      const consoleSpy = spyOn(console, 'error');
      apiService.post.and.returnValue(throwError(() => mockError));

      service.getAgPrintProdTypes({}).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching AG print prod type data:', mockError);
          done();
        }
      });
    });
  });

  describe('getProductTypeLookups', () => {
    it('should fetch product type lookup values', (done) => {
      const mockResponse = [
        { code: 'PT001', description: 'Product Type 001' }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getProductTypeLookups().subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should return the array as-is when response is a valid array', (done) => {
      const mockResponse = [
        { code: 'PT001', description: 'Product Type 001' },
        { code: 'PT002', description: 'Product Type 002' },
        { code: 'PT003', description: null }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getProductTypeLookups().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.length).toBe(3);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_LOOKUP_TYPES
        );
        done();
      });
    });

    it('should return empty array when response is not an array (object)', (done) => {
      apiService.get.and.returnValue(of({ data: [] }) as any);

      service.getProductTypeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      apiService.get.and.returnValue(of(null) as any);

      service.getProductTypeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is undefined', (done) => {
      apiService.get.and.returnValue(of(undefined) as any);

      service.getProductTypeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is a string', (done) => {
      apiService.get.and.returnValue(of('not an array') as any);

      service.getProductTypeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return the array when response is an empty array', (done) => {
      apiService.get.and.returnValue(of([]) as any);

      service.getProductTypeLookups().subscribe(result => {
        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const mockError = new Error('Server error');
      const consoleSpy = spyOn(console, 'error');
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getProductTypeLookups().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching product type lookups:', mockError);
          done();
        }
      });
    });
  });

  describe('createRecord', () => {
    it('should create a new RBC antigen product type', (done) => {
      const newRecord: RbcAntigenProductTypeCreateDto = {
        productType: 'PT001',
        effDate: '2024-01-01T00:00:00Z',
        termDate: null
      };

      const mockResponse = { success: true, message: 'Created successfully' };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.createRecord(newRecord).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should call apiService.post with the correct endpoint and data', (done) => {
      const newRecord: RbcAntigenProductTypeCreateDto = {
        productType: 'PT_NEW',
        effDate: '2025-01-01T00:00:00Z',
        termDate: '2025-12-31T00:00:00Z'
      };

      apiService.post.and.returnValue(of({}) as any);

      service.createRecord(newRecord).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_ADD,
          newRecord
        );
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const newRecord: RbcAntigenProductTypeCreateDto = {
        productType: 'PT001',
        effDate: '2024-01-01T00:00:00Z',
        termDate: null
      };

      const mockError = new Error('Duplicate key');
      const consoleSpy = spyOn(console, 'error');
      apiService.post.and.returnValue(throwError(() => mockError));

      service.createRecord(newRecord).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error creating AG print prod type:', mockError);
          done();
        }
      });
    });
  });

  describe('updateRecord', () => {
    it('should update an existing RBC antigen product type', (done) => {
      const updateData: RbcAntigenProductTypeUpdateDto = {
        effDate: '2024-06-01T00:00:00Z',
        termDate: null
      };

      const mockResponse = { success: true, message: 'Updated successfully' };
      apiService.put.and.returnValue(of(mockResponse) as any);

      service.updateRecord('PT001', updateData).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should call apiService.put with the correct endpoint and data', (done) => {
      const updateData: RbcAntigenProductTypeUpdateDto = {
        effDate: '2025-03-15T00:00:00Z',
        termDate: '2025-09-30T00:00:00Z'
      };

      apiService.put.and.returnValue(of({}) as any);

      service.updateRecord('PT_XYZ', updateData).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_UPDATE('PT_XYZ'),
          updateData
        );
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const updateData: RbcAntigenProductTypeUpdateDto = {
        effDate: '2024-06-01T00:00:00Z',
        termDate: null
      };

      const mockError = new Error('Not found');
      const consoleSpy = spyOn(console, 'error');
      apiService.put.and.returnValue(throwError(() => mockError));

      service.updateRecord('PT001', updateData).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error updating AG print prod type:', mockError);
          done();
        }
      });
    });
  });

  describe('deleteRecord', () => {
    it('should delete an RBC antigen product type', (done) => {
      const mockResponse = { success: true, message: 'Deleted successfully' };
      apiService.delete.and.returnValue(of(mockResponse) as any);

      service.deleteRecord('PT001').subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.delete).toHaveBeenCalled();
        done();
      });
    });

    it('should call apiService.delete with the correct endpoint', (done) => {
      apiService.delete.and.returnValue(of({}) as any);

      service.deleteRecord('PT_ABC').subscribe(() => {
        expect(apiService.delete).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.AG_PRINT_DELETE('PT_ABC')
        );
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const mockError = new Error('Forbidden');
      const consoleSpy = spyOn(console, 'error');
      apiService.delete.and.returnValue(throwError(() => mockError));

      service.deleteRecord('PT001').subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error deleting AG print prod type:', mockError);
          done();
        }
      });
    });
  });
});
