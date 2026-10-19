import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PreparePooledComponentsService } from './prepare-pooled-components.service';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  PoolHeader,
  PoolUnit,
  CreatePoolRequest,
  PoolSearchRequest,
  ApiResponse,
} from '../models/prepare-pooled-components.model';

describe('PreparePooledComponentsService', () => {
  let service: PreparePooledComponentsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.PREPARE_POOLED_COMPONENTS.BASE}`;

  const mockPoolHeader: PoolHeader = {
    poolId: 'POOL123',
    chapterId: '1',
    patientId: 'PAT001',
    patientFirstName: 'John',
    patientLastName: 'Doe',
    facility: 'Test Facility',
    productCode: 'E2897V00',
    productDescription: 'POOLAND',
    bagId: '1BATRDSEF1',
    lotNumber: 'TRANSFFIR1',
    filterLotNumber: '',
    pooledAboRh: 'OPOS',
    aboDescription: 'O POS POOL',
    interCode: '',
    poolDats: '2024-07-14T22:15:00',
    poolExpiryDats: '2024-03-07T03:15:00',
    poolInsertDats: '',
    poolUserId: '',
    poolWeight: 165,
    programId: '',
    numberOfUnits: 4,
  };

  const mockPoolUnits: PoolUnit[] = [
    {
      unitId: 'W6333-26-123457-X',
      productCode: 'E2897V00',
      productDescription: 'PLATELETS(PQ7S)/PLAS(N)/L/20',
      expiryDate: '07-JUL-2024 22:50',
      systemLabelDecision: 'Discard',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PreparePooledComponentsService],
    });
    service = TestBed.inject(PreparePooledComponentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchPools', () => {
    it('should search pools with pagination', () => {
      const request: PoolSearchRequest = { poolId: 'POOL123' };
      const take = 10;
      const skip = 0;

      service.searchPools(take, skip, request).subscribe((response) => {
        expect(response.items.length).toBe(1);
        expect(response.items[0].poolId).toBe('POOL123');
        expect(response.totalRecords).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({
        success: true,
        data: [mockPoolHeader],
        total: 1,
      });
    });
  });

  describe('getPoolById', () => {
    it('should get pool by ID', () => {
      const poolId = 'POOL123';

      service.getPoolById(poolId).subscribe((response) => {
        expect(response.data).toEqual(mockPoolHeader);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(poolId)}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: mockPoolHeader,
      });
    });
  });

  describe('createPool', () => {
    it('should create pool', () => {
      const request: CreatePoolRequest = {
        poolId: 'POOL123',
        productCode: 'E2897V00',
        numberOfUnits: 4,
      };

      service.createPool(request).subscribe((pool) => {
        expect(pool).toEqual(mockPoolHeader);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({
        success: true,
        data: mockPoolHeader,
      });
    });
  });

  describe('updatePool', () => {
    it('should update pool', () => {
      const poolId = 'POOL123';
      const request: CreatePoolRequest = {
        poolId: 'POOL123',
        productCode: 'E2897V00',
        numberOfUnits: 5,
      };

      service.updatePool(poolId, request).subscribe((pool) => {
        expect(pool.numberOfUnits).toBe(5);
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(poolId)}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush({
        success: true,
        data: { ...mockPoolHeader, numberOfUnits: 5 },
      });
    });
  });

  describe('deletePool', () => {
    it('should delete pool', () => {
      const poolId = 'POOL123';

      service.deletePool(poolId).subscribe((result) => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(poolId)}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('getUnitsInPool', () => {
    it('should get units in pool', () => {
      const poolId = 'POOL123';

      service.getUnitsInPool(poolId).subscribe((units) => {
        expect(units.length).toBe(1);
        expect(units[0].unitId).toBe('W6333-26-123457-X');
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(poolId)}/units`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: mockPoolUnits,
      });
    });
  });

  describe('LOV endpoints', () => {
    it('should get valid products', () => {
      service.getValidProducts().subscribe((products) => {
        expect(products.length).toBe(1);
        expect(products[0].code).toBe('E2897V00');
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}/valid-products` &&
        request.params.get('codeScheme') === 'I'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: [{ code: 'E2897V00', description: 'POOLAND' }],
      });
    });

    it('should get valid ABO', () => {
      service.getValidAbo().subscribe((aboList) => {
        expect(aboList.length).toBe(1);
        expect(aboList[0].code).toBe('OPOS');
      });

      const req = httpMock.expectOne(`${baseUrl}/valid-abo`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: [{ code: 'OPOS', description: 'O POS POOL' }],
      });
    });

    it('should get valid lots', () => {
      service.getValidLots('PM1234567').subscribe((lots) => {
        expect(lots.length).toBe(1);
        expect(lots[0].code).toBe('TRANSFFIR1');
      });

      const req = httpMock.expectOne((r) =>
        r.url === `${baseUrl}/valid-lots` &&
        r.params.get('catalogNumber') === 'PM1234567'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: [{ code: 'TRANSFFIR1' }],
      });
    });

    it('should get valid catalogs', () => {
      service.getValidCatalogs().subscribe((catalogs) => {
        expect(catalogs.length).toBe(1);
        expect(catalogs[0].code).toBe('1BATRDSEF1');
      });

      const req = httpMock.expectOne(`${baseUrl}/valid-catalogs`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: [{ code: '1BATRDSEF1' }],
      });
    });
  });
});
