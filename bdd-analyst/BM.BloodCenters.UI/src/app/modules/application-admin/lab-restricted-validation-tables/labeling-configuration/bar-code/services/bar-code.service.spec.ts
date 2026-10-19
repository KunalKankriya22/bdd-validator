import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { BarCodeService } from './bar-code.service';
import { ApiService } from '@shared/services/api.service';
import { BarCodeCreateDto, BarCodeUpdateDto } from '../models/bar-code.model';
import { API } from 'src/app/core/constants/api.constants';

describe('BarCodeService', () => {
  let service: BarCodeService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BarCodeService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(BarCodeService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getBarCodes', () => {
    it('should fetch bar codes with filters', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { barcodeValue: 'BC001', testId: 'T001', resultCode: 'N' },
          { barcodeValue: 'BC002', testId: 'T002', resultCode: 'P' }
        ],
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getBarCodes({}).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should default data to empty array when response.data is null', (done) => {
      const mockResponse = { success: true, data: null, total: 5 };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getBarCodes({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(5);
        done();
      });
    });

    it('should default data to empty array when response.data is undefined', (done) => {
      const mockResponse = { success: true, total: 3 };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getBarCodes({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(3);
        done();
      });
    });

    it('should default totalRecords to 0 when response.total is null', (done) => {
      const mockResponse = { success: true, data: [], total: null };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getBarCodes({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should default totalRecords to 0 when response.total is undefined', (done) => {
      const mockResponse = { success: true, data: [] };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getBarCodes({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should call the correct endpoint with provided params', (done) => {
      const mockResponse = { success: true, data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse) as any);
      const params = { testId: 'T001', resultCode: 'N' };

      service.getBarCodes(params).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_LIST,
          params
        );
        done();
      });
    });

    it('should propagate error through catchError', (done) => {
      const mockError = new Error('Network error');
      apiService.post.and.returnValue(throwError(() => mockError));
      spyOn(console, 'error');

      service.getBarCodes({}).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching bar code data:', mockError);
          done();
        }
      });
    });

  });

  describe('getBarcodeLookups', () => {
    it('should fetch barcode lookups and return array when response is an array', (done) => {
      const mockLookups = [
        { code: 'BC001', description: 'Barcode 1' },
        { code: 'BC002', description: 'Barcode 2' }
      ];
      apiService.get.and.returnValue(of(mockLookups) as any);

      service.getBarcodeLookups().subscribe(result => {
        expect(result).toEqual(mockLookups);
        expect(result.length).toBe(2);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_LOOKUP_BARCODES
        );
        done();
      });
    });

    it('should return empty array when response is not an array', (done) => {
      apiService.get.and.returnValue(of({} as any));

      service.getBarcodeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      apiService.get.and.returnValue(of(null as any));

      service.getBarcodeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is a string', (done) => {
      apiService.get.and.returnValue(of('not an array' as any));

      service.getBarcodeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return the array as-is when response is an empty array', (done) => {
      apiService.get.and.returnValue(of([] as any));

      service.getBarcodeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error through catchError', (done) => {
      const mockError = new Error('Lookup fetch failed');
      apiService.get.and.returnValue(throwError(() => mockError));
      spyOn(console, 'error');

      service.getBarcodeLookups().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching barcode lookups:', mockError);
          done();
        }
      });
    });
  });

  describe('getTestIdLookups', () => {
    it('should fetch test ID lookups and return array when response is an array', (done) => {
      const mockLookups = [
        { code: 'T001', description: 'Test 1' },
        { code: 'T002', description: null }
      ];
      apiService.get.and.returnValue(of(mockLookups) as any);

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual(mockLookups);
        expect(result.length).toBe(2);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_LOOKUP_TEST_IDS
        );
        done();
      });
    });

    it('should return empty array when response is not an array', (done) => {
      apiService.get.and.returnValue(of({ data: 'something' } as any));

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      apiService.get.and.returnValue(of(null as any));

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is a number', (done) => {
      apiService.get.and.returnValue(of(42 as any));

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return the array as-is when response is an empty array', (done) => {
      apiService.get.and.returnValue(of([] as any));

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error through catchError', (done) => {
      const mockError = new Error('Test ID lookup failed');
      apiService.get.and.returnValue(throwError(() => mockError));
      spyOn(console, 'error');

      service.getTestIdLookups().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching test ID lookups:', mockError);
          done();
        }
      });
    });
  });

  describe('createBarCode', () => {
    it('should create a new bar code configuration', (done) => {
      const newBarCode: BarCodeCreateDto = {
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
        effDate: '2024-01-01T00:00:00Z',
        termDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Bar code configuration added successfully'
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.createBarCode(newBarCode).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should call the correct endpoint with the provided data', (done) => {
      const newBarCode: BarCodeCreateDto = {
        barcodeValue: 'BC099',
        testId: 'T099',
        resultCode: 'P',
        effDate: '2025-01-01T00:00:00Z',
        termDate: '2025-12-31T00:00:00Z'
      };
      const mockResponse = { success: true };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.createBarCode(newBarCode).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_ADD,
          newBarCode
        );
        done();
      });
    });

    it('should propagate error through catchError', (done) => {
      const newBarCode: BarCodeCreateDto = {
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N'
      };
      const mockError = new Error('Create failed');
      apiService.post.and.returnValue(throwError(() => mockError));
      spyOn(console, 'error');

      service.createBarCode(newBarCode).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(console.error).toHaveBeenCalledWith('Error creating bar code configuration:', mockError);
          done();
        }
      });
    });
  });

  describe('updateBarCode', () => {
    it('should update an existing bar code configuration', (done) => {
      const updateData: BarCodeUpdateDto = {
        effDate: '2024-06-01T00:00:00Z',
        termDate: '2025-12-31T00:00:00Z'
      };

      const mockResponse = {
        success: true,
        message: 'Bar code configuration updated successfully'
      };

      apiService.put.and.returnValue(of(mockResponse) as any);

      service.updateBarCode('BC001', 'T001', 'N', updateData).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should call the correct endpoint with URL-encoded parameters', (done) => {
      const updateData: BarCodeUpdateDto = {
        testId: 'T002',
        resultCode: 'P',
        effDate: '2025-01-01T00:00:00Z'
      };
      const mockResponse = { success: true };
      apiService.put.and.returnValue(of(mockResponse) as any);

      service.updateBarCode('BC001', 'T001', 'N', updateData).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_UPDATE('BC001', 'T001', 'N'),
          updateData
        );
        done();
      });
    });

    it('should propagate error through catchError', (done) => {
      const updateData: BarCodeUpdateDto = {
        effDate: '2024-06-01T00:00:00Z'
      };
      const mockError = new Error('Update failed');
      apiService.put.and.returnValue(throwError(() => mockError));
      spyOn(console, 'error');

      service.updateBarCode('BC001', 'T001', 'N', updateData).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(console.error).toHaveBeenCalledWith('Error updating bar code configuration:', mockError);
          done();
        }
      });
    });
  });
});
