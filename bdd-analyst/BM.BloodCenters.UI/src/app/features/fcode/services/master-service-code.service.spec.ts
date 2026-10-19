import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MasterServiceCodeService } from './master-service-code.service';
import {
  MasterServiceCodeDto,
  CreateMasterServiceCodeDto,
  UpdateMasterServiceCodeDto,
  MasterServiceCodeQueryDto,
  ApiResponse
} from '../models/master-service-code.model';
import { environment } from '../../../../environments/environment';

describe('MasterServiceCodeService', () => {
  let service: MasterServiceCodeService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/master-service-codes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MasterServiceCodeService]
    });

    service = TestBed.inject(MasterServiceCodeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should fetch master service codes with pagination', () => {
      const mockResponse: ApiResponse<MasterServiceCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [
          {
            billingCode: 'TEST123',
            codeDesc: 'Test Service Code',
            effDate: '2024-01-01',
            termDate: null
          }
        ],
        total: 1
      };

      const take = 10;
      const skip = 0;
      const queryDto: MasterServiceCodeQueryDto = {
        searchKeyword: 'test'
      };

      service.getAll(take, skip, queryDto).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data).toBeDefined();
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(queryDto);
      req.flush(mockResponse);
    });
  });

  describe('getByCode', () => {
    it('should fetch a single master service code by billing code', () => {
      const billingCode = 'TEST123';
      const mockResponse: ApiResponse<MasterServiceCodeDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Record retrieved successfully',
        data: [
          {
            billingCode: 'TEST123',
            codeDesc: 'Test Service Code',
            effDate: '2024-01-01',
            termDate: null
          }
        ],
        total: 1
      };

      service.getByCode(billingCode).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data).toBeDefined();
        expect(response.data?.[0].billingCode).toBe(billingCode);
      });

      const req = httpMock.expectOne(`${baseUrl}/${billingCode}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('create', () => {
    it('should create a new master service code', () => {
      const dto: CreateMasterServiceCodeDto = {
        billingCode: 'NEWCODE',
        codeDesc: 'New Service Code',
        effDate: '2024-06-01',
        termDate: null
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Record created successfully'
      };

      service.create(dto).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should update an existing master service code', () => {
      const billingCode = 'TEST123';
      const dto: UpdateMasterServiceCodeDto = {
        codeDesc: 'Updated Description',
        effDate: '2024-01-01',
        termDate: '2025-12-31'
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Record updated successfully'
      };

      service.update(billingCode, dto).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/${billingCode}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should delete a master service code', () => {
      const billingCode = 'TEST123';
      const mockResponse: ApiResponse<boolean[]> = {
        success: true,
        statusCode: 200,
        message: 'Record deleted successfully',
        data: [true],
        total: 0
      };

      service.delete(billingCode).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.[0]).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/${billingCode}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
