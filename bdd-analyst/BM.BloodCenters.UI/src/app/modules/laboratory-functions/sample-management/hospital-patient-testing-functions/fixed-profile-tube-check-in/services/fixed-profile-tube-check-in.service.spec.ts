import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FixedProfileTubeCheckInService } from './fixed-profile-tube-check-in.service';
import { API } from '@core/constants/api.constants';
import {
  ContractDropdownDto,
  BatchDropdownDto,
  FixedProfileTubeCheckinDto,
  CreateTubeCheckinRequestDto,
  TubeCheckinQueryDto,
  ReturnResult,
} from '../models/fixed-profile-tube-check-in.model';

describe('FixedProfileTubeCheckInService', () => {
  let service: FixedProfileTubeCheckInService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FixedProfileTubeCheckInService],
    });
    service = TestBed.inject(FixedProfileTubeCheckInService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should post query and return records', () => {
      const query: TubeCheckinQueryDto = { contractId: 'FC001' };
      const mockData: FixedProfileTubeCheckinDto[] = [
        {
          osUnitId: 'W001',
          unitId: 'W001',
          collDate: '2026-01-09T00:00:00Z',
          receivedDate: '2026-01-09T00:00:00Z',
          chapterId: 'H',
          batchId: 'B001',
          contractId: 'FC001',
          redTubeFlag: 'Y',
          purpleTubeFlag: null,
          redTube2: null,
          serumPlasmaInd: null,
          warehouseId: null,
          programId: null,
          insertDats: null,
          osChkDigit: null,
          chkDigit: null,
          unitSeq: null,
        },
      ];

      service.getAll(10, 0, query).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(API.FIXED_PROFILE_TUBES.LIST(10, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush({ success: true, message: '', statusCode: 200, data: mockData, total: 1 });
    });
  });

  describe('create', () => {
    it('should post create request', () => {
      const dto: CreateTubeCheckinRequestDto = {
        osUnitId: 'W001',
        contractId: 'FC001',
        redTubeFlag: 'Y',
      };

      service.create(dto).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(API.FIXED_PROFILE_TUBES.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true, message: 'Created', statusCode: 201, data: null });
    });
  });

  describe('getContracts', () => {
    it('should fetch and map contracts', () => {
      const mockContracts: ContractDropdownDto[] = [
        { contractId: 'FC001', company: 'Hospital A' },
      ];

      service.getContracts().subscribe((contracts) => {
        expect(contracts.length).toBe(1);
        expect(contracts[0].contractId).toBe('FC001');
        expect(contracts[0].description).toBe('Hospital A');
      });

      const req = httpMock.expectOne(API.FIXED_PROFILE_TUBES.CONTRACTS);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', statusCode: 200, data: mockContracts });
    });
  });

  describe('getBatches', () => {
    it('should fetch batches with contractId param', () => {
      const mockBatches: BatchDropdownDto[] = [
        { batchId: 'B001', receivedDate: '2026-01-09T00:00:00Z' },
      ];

      service.getBatches('FC001').subscribe((batches) => {
        expect(batches.length).toBe(1);
        expect(batches[0].batchId).toBe('B001');
      });

      const req = httpMock.expectOne(
        `${API.FIXED_PROFILE_TUBES.BATCHES}?contractId=FC001`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', statusCode: 200, data: mockBatches });
    });
  });
});
