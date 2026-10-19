import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReagentQueryService } from './reagent-query.service';
import { environment } from '../../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  TestIdOption,
  ReagentCodeOption,
  LotNumberOption,
  ReagentIdOption,
  ReagentSearchRequest,
} from '../models/reagent-query.model';

describe('ReagentQueryService', () => {
  let service: ReagentQueryService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReagentQueryService],
    });
    service = TestBed.inject(ReagentQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTestIds', () => {
    it('should return test IDs from the API', () => {
      const mockTestIds: TestIdOption[] = [
        { testId: 'T001', testDesc: 'Test One' },
        { testId: 'T002', testDesc: 'Test Two' },
      ];

      service.getTestIds().subscribe(result => {
        expect(result).toEqual(mockTestIds);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.REAGENT_QUERY.TESTS_DROPDOWN}`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockTestIds, success: true });
    });

  });

  describe('getReagentCodes', () => {
    it('should return reagent codes for a given testId', () => {
      const mockCodes: ReagentCodeOption[] = [
        { reagentCode: 'RC001', reagentName: 'Reagent One' },
      ];

      service.getReagentCodes('T001').subscribe(result => {
        expect(result).toEqual(mockCodes);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}${API.REAGENT_QUERY.REAGENT_CODES_DROPDOWN}` &&
        r.params.get('testId') === 'T001'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockCodes, success: true });
    });

  });

  describe('getLotNumbers', () => {
    it('should return lot numbers for a given testId', () => {
      const mockLots: LotNumberOption[] = [{ lotNumber: 'LOT001' }];

      service.getLotNumbers('T001').subscribe(result => {
        expect(result).toEqual(mockLots);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}${API.REAGENT_QUERY.LOT_NUMBERS_DROPDOWN}` &&
        r.params.get('testId') === 'T001'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockLots, success: true });
    });

    it('should include reagentCode param when provided', () => {
      service.getLotNumbers('T001', 'RC001').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}${API.REAGENT_QUERY.LOT_NUMBERS_DROPDOWN}` &&
        r.params.get('testId') === 'T001' &&
        r.params.get('reagentCode') === 'RC001'
      );
      req.flush({ data: [], success: true });
    });
  });

  describe('searchReagents', () => {
    it('should map BE response to ReagentSearchResponse', () => {
      const request: ReagentSearchRequest = {
        testId: 'T001',
        skip: 0,
        take: 10,
      };

      const beResponse = {
        data: [{
          reagentCode: 'RC001',
          reagentName: 'Reagent One',
          reagentId: 'RID001',
          receivedDate: '2024-01-01',
          supplierCode: 'SUP001',
          supplierName: 'Supplier One',
          expiryDate: '2025-01-01',
          disposition: 'Active',
          kitLotNumber: 'KIT001',
          lotNumber: 'LOT001',
          receivedBy: 'User1',
          containerId: 'CTN001',
          controlInd: 'Y',
          storageLocation: 'LOC01',
          minStorageTemp: '2',
          maxStorageTemp: '8',
          noOfTests: '100',
          visualQcFlag: 'Pass',
          packageInsertDate: '2023-12-01',
          rejectReasonCode: null,
          rejectReasonDescription: null,
          reagentType: 'Type A',
          remainingTests: '50',
          noteId: 1,
          preparationFlag: 'P',
        }],
        total: 1,
        success: true,
      };

      service.searchReagents(request).subscribe(result => {
        expect(result.totalRecords).toBe(1);
        expect(result.reagents.length).toBe(1);
        expect(result.reagents[0].reagent).toBe('RC001');
        expect(result.reagents[0].reagentDescription).toBe('Reagent One');
        expect(result.reagents[0].reagentId).toBe('RID001');
        expect(result.reagents[0].noteId).toBe(1);
        expect(result.reagents[0].preparationFlag).toBe('P');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.REAGENT_QUERY.SEARCH}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(beResponse);
    });

  });

  describe('getTestKits', () => {
    it('should return test kits for a given reagentId and testId', () => {
      const mockKitEntry = { reagentId: 'RID001', kits: [{ kitId: 'K001', qcStatus: 'QC Complete' }] };

      service.getTestKits('RID001', 'T001').subscribe(result => {
        expect(result.reagentId).toBe('RID001');
        expect(result.kits.length).toBe(1);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}${API.REAGENT_QUERY.BASE}/RID001/test-kits` &&
        r.params.get('testId') === 'T001'
      );
      expect(req.request.method).toBe('GET');
      // API returns data as an array — service extracts first element via r.data[0]
      req.flush({ data: [mockKitEntry], success: true });
    });


  });
  describe('getReagentIds', () => {
    it('should return reagent IDs for a given testId', () => {
      const mockIds: ReagentIdOption[] = [{ reagentId: 'RID001' }, { reagentId: 'RID002' }];

      service.getReagentIds('T001').subscribe(result => {
        expect(result).toEqual(mockIds);
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('reagent-ids') && r.params.get('testId') === 'T001'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockIds, success: true });
    });

  });

  describe('getPreparationDetails', () => {
    it('should return preparation details for a given reagentId', () => {
      const mockDetails = [{ reagentId: 'RID001', reagentName: 'R1', reagentType: 'T', expiryDate: '2025-01-01', lotNumber: 'L1', quantity: '5' }];

      service.getPreparationDetails('RID001').subscribe(result => {
        expect(result).toEqual(mockDetails);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.REAGENT_QUERY.BASE}/RID001/preparation-details`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockDetails, success: true });
    });

  });
});
