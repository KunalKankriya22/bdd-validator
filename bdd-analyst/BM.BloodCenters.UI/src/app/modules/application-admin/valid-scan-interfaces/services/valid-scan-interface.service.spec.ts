import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ValidScanInterfaceService } from './valid-scan-interface.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { ValidScanInterfaceDto, ValidScanInterfaceParamsDto, ValidScanInterfaceUpdateDto } from '../models/valid-scan-interface.model';

describe('ValidScanInterfaceService', () => {
  let service: ValidScanInterfaceService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ValidScanInterfaceService,
        { provide: ApiService, useValue: apiServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ValidScanInterfaceService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getValidScanInterfaces', () => {
    it('should fetch valid scan interfaces with sort parameter', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            scanType: 'TYPE1',
            startCount: 2,
            startCode: 'AB',
            stopSize: 1,
            stopCode: 'X',
            stringSize: 10,
            effectiveDate: new Date(),
            terminationDate: null,
            modificationDate: new Date()
          }
        ],
        total: 1
      };

      const params: ValidScanInterfaceParamsDto = { sort: 'A', searchKeyword: 'TYPE1' };
      apiService.get.and.returnValue(of(mockResponse));

      service.getValidScanInterfaces(params).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.totalRecords).toBe(1);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.VALID_SCAN_INTERFACES,
          jasmine.objectContaining({
            params: jasmine.any(HttpParams)
          }) as any
        );
        // Verify the HttpParams contains the correct values
        const callArgs = apiService.get.calls.mostRecent().args;
        const httpParams = callArgs[1]?.params as HttpParams;
        expect(httpParams.get('sort')).toBe('A');
        expect(httpParams.get('searchKeyword')).toBe('TYPE1');
        done();
      });
    });

    it('should handle errors when fetching valid scan interfaces', (done) => {
      const params: ValidScanInterfaceParamsDto = { sort: 'A' };
      const errorResponse = { message: 'Error fetching data' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getValidScanInterfaces(params).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('addValidScanInterface', () => {
    it('should create a new valid scan interface', (done) => {
      const dto: ValidScanInterfaceDto = {
        scanType: 'TYPE1',
        startCount: 2,
        startCode: 'AB',
        stopSize: 1,
        stopCode: 'X',
        stringSize: 10,
        effectiveDate: new Date(),
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Valid scan interface created successfully'
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addValidScanInterface(dto).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Valid scan interface created successfully');
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.CREATE_VALID_SCAN_INTERFACE,
          dto
        );
        done();
      });
    });

    it('should handle error when creating valid scan interface', (done) => {
      const dto: ValidScanInterfaceDto = {
        scanType: 'TYPE1',
        startCount: 2,
        startCode: 'AB',
        stopSize: 1,
        stopCode: 'X',
        stringSize: 10,
        effectiveDate: new Date(),
        terminationDate: null
      };

      const errorResponse = { message: 'Scan type already exists' };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.addValidScanInterface(dto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Scan type already exists');
          done();
        }
      });
    });
  });

  describe('updateValidScanInterface', () => {
    it('should update an existing valid scan interface', (done) => {
      const updateDto: ValidScanInterfaceUpdateDto = {
        originalScanType: 'TYPE1',
        startCount: 3,
        startCode: 'ABC',
        stopSize: 2,
        stopCode: 'YZ',
        stringSize: 15,
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Valid scan interface updated successfully'
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateValidScanInterface(updateDto).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Valid scan interface updated successfully');
        expect(apiService.put).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.UPDATE_VALID_SCAN_INTERFACE,
          updateDto
        );
        done();
      });
    });

    it('should handle error when updating valid scan interface', (done) => {
      const updateDto: ValidScanInterfaceUpdateDto = {
        originalScanType: 'TYPE1',
        startCount: 3,
        startCode: 'ABC',
        stopSize: 2,
        stopCode: 'YZ',
        stringSize: 15,
        terminationDate: null
      };

      const errorResponse = { message: 'Scan type not found' };

      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateValidScanInterface(updateDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Scan type not found');
          done();
        }
      });
    });
  });
});
