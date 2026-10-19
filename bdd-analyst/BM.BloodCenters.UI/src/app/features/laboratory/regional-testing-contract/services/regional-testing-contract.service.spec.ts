import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { RegionalTestingContractService } from './regional-testing-contract.service';
import { environment } from '../../../../../environments/environment';
import {
  RegionalTestingContract,
  CreateRegionalTestingContractDto,
  UpdateRegionalTestingContractDto,
  RegionalTestingContractQueryDto
} from '../models/regional-testing-contract.models';

describe('RegionalTestingContractService', () => {
  let service: RegionalTestingContractService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/regional-testing-contract`;

  const mockContract: RegionalTestingContract = {
    contractId: 'CNT20260616120000',
    chapterId: 'OBK',
    contractType: 'T',
    customerName: 'Test Lab',
    customerId: 'CUST001',
    exportCode: 'US',
    agreementDate: '2026-05-30T00:00:00Z',
    effDate: '2026-06-01T00:00:00Z',
    termDate: null,
    addressId: 100,
    contactName: 'C',
    lastModifiedDate: '2026-06-16T00:00:00Z',
    programId: 'RGICNTCT',
    auditKey: 1000
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegionalTestingContractService]
    });
    service = TestBed.inject(RegionalTestingContractService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getContracts', () => {
    it('should retrieve contracts with pagination', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockContract],
        totalCount: 1
      };

      service.getContracts(10, 0).subscribe(response => {
        expect(response.data?.length).toBe(1);
        expect(response.data?.[0]).toEqual(mockContract);
        expect(response.totalCount).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should apply query filters', () => {
      const query: RegionalTestingContractQueryDto = {
        contractType: 'T',
        searchKeyword: 'test',
        showTerminated: false,
        sortColumn: 'EffDate',
        sortOrder: 'DESC'
      };

      service.getContracts(10, 0, query).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.body.contractType).toBe('T');
      expect(req.request.body.searchKeyword).toBe('test');
      expect(req.request.body.showTerminated).toBe(false);
      req.flush({ success: true, data: [], totalCount: 0 });
    });
  });

  describe('getContractById', () => {
    it('should retrieve a single contract by ID', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Contract retrieved successfully',
        data: [mockContract]
      };

      service.getContractById('CNT20260616120000').subscribe(contract => {
        expect(contract).toEqual(mockContract);
      });

      const req = httpMock.expectOne(`${baseUrl}/CNT20260616120000`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createContract', () => {
    it('should create a new contract', () => {
      const dto: CreateRegionalTestingContractDto = {
        contractType: 'T',
        customerName: 'New Lab',
        customerId: 'CUST002',
        exportCode: 'CA',
        effDate: '2026-07-01',
        termDate: null
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Contract created successfully',
        data: [{ contractId: 'CNT20260616130000' }]
      };

      service.createContract(dto).subscribe(result => {
        expect(result.contractId).toBe('CNT20260616130000');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('updateContract', () => {
    it('should update an existing contract', () => {
      const dto: UpdateRegionalTestingContractDto = {
        contractType: 'R',
        customerName: 'Updated Lab',
        customerId: 'CUST001',
        exportCode: 'US',
        effDate: '2026-06-01',
        termDate: '2027-06-01'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Contract updated successfully'
      };

      service.updateContract('CNT20260616120000', dto).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/CNT20260616120000`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });
  describe('getContractTypes', () => {
    it('should return contract types', () => {
      const types = service.getContractTypes();
      expect(types.length).toBe(3);
      expect(types[0]).toEqual({ code: 'R', description: 'Regional' });
      expect(types[1]).toEqual({ code: 'T', description: 'Testing' });
      expect(types[2]).toEqual({ code: 'S', description: 'Supplier' });
    });
  });

  describe('isValidContractType', () => {
    it('should validate contract type R', () => {
      expect(service.isValidContractType('R')).toBe(true);
    });

    it('should validate contract type T', () => {
      expect(service.isValidContractType('T')).toBe(true);
    });

    it('should validate contract type S', () => {
      expect(service.isValidContractType('S')).toBe(true);
    });

    it('should reject invalid contract type', () => {
      expect(service.isValidContractType('X')).toBe(false);
    });

  });
});
