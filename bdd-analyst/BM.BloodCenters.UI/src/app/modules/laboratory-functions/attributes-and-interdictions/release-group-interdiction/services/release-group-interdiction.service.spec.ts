import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ReleaseGroupInterdictionService } from './release-group-interdiction.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ReleaseGroupInterdictionDto,
  ReleaseGroupInterdictionDeleteRequestDto,
  ReleaseGroupInterdictionUnitInfoDto,
  ApiResponse,
} from '../models/release-group-interdiction.models';

describe('ReleaseGroupInterdictionService', () => {
  let service: ReleaseGroupInterdictionService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockInterdictions: ReleaseGroupInterdictionDto[] = [
    {
      unitId: 'W334826061101', collDate: '2026-01-10T00:00:00',
      chapterId: 'OBK', interCode: 'ABOD', interDesc: 'ABO/Rh Donor Discrepancy',
      interType: 'HOLD', sourceTestId: 'BATCH', effDate: '1998-06-01T00:00:00',
      termDate: '2026-06-30T00:00:00', driveId: null, batchId: '061126-IM1006', lotNumber: null,
    },
  ];

  const mockUnitsInfo: ReleaseGroupInterdictionUnitInfoDto[] = [
    { unitId: 'W334826061101', chkDigit: null, collDate: '2026-01-10T00:00:00' },
    { unitId: 'W334826061102', chkDigit: null, collDate: '2026-01-10T00:00:00' },
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReleaseGroupInterdictionService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(ReleaseGroupInterdictionService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ── getAll ──────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('should POST to getAll endpoint with query payload', (done) => {
      const apiResponse: ApiResponse<ReleaseGroupInterdictionDto> = {
        success: true, message: '', statusCode: 200,
        data: mockInterdictions, total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(apiResponse));

      const query = { sourceTestId: 'BATCH', batchId: '061126-IM1006' };
      service.getAll(100, 0, query as any).subscribe((result) => {
        expect(result.data).toEqual(mockInterdictions);
        expect(result.totalCount).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.RELEASE_GROUP_INTERDICTION.GET_ALL(100, 0),
          query,
          jasmine.any(Object),
        );
        done();
      });
    });


  });

  // ── deleteInterdictions ─────────────────────────────────────────────────────

  describe('deleteInterdictions', () => {
    it('should POST delete request', (done) => {
      const deleteResponse = { success: true, message: 'Deleted' };
      apiServiceSpy.post.and.returnValue(of(deleteResponse));

      const request: ReleaseGroupInterdictionDeleteRequestDto = {
        controlMode: 'BATCH', filterValue: '061126-IM1006', interCodes: ['ABOD'],
      };

      service.deleteInterdictions(request).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.RELEASE_GROUP_INTERDICTION.DELETE,
          request,
        );
        done();
      });
    });

  });

  // ── getUnitsInfo ────────────────────────────────────────────────────────────

  describe('getUnitsInfo', () => {
    it('should GET units info with query params', (done) => {
      const apiResponse: ApiResponse<ReleaseGroupInterdictionUnitInfoDto> = {
        success: true, message: '', statusCode: 200,
        data: mockUnitsInfo,
      };
      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getUnitsInfo('BATCH', '061126-IM1006').subscribe((result) => {
        expect(result).toEqual(mockUnitsInfo);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringContaining('controlMode=BATCH'),
          jasmine.any(Object),
        );
        done();
      });
    });

    it('should return empty array on null data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null } as any));

      service.getUnitsInfo('BATCH', 'X').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // ── Dropdowns ───────────────────────────────────────────────────────────────

  describe('Dropdowns', () => {
    beforeEach(() => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [], message: '', statusCode: 200 }));
    });

    it('should call drives dropdown endpoint', (done) => {
      service.getDrivesDropdown('DRIVE').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringContaining('dropdown/drives'),
          jasmine.any(Object),
        );
        done();
      });
    });

    it('should call batches dropdown endpoint', (done) => {
      service.getBatchesDropdown('BATCH').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringContaining('dropdown/batches'),
          jasmine.any(Object),
        );
        done();
      });
    });

    it('should call collection dates dropdown endpoint', (done) => {
      service.getCollectionDatesDropdown('COLL DATE').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringContaining('dropdown/collection-dates'),
          jasmine.any(Object),
        );
        done();
      });
    });

    it('should call lot numbers dropdown endpoint', (done) => {
      service.getLotNumbersDropdown('LOT').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringContaining('dropdown/lot-numbers'),
          jasmine.any(Object),
        );
        done();
      });
    });

    it('should call TB IDs dropdown endpoint', (done) => {
      service.getTbIdsDropdown('TBID').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringContaining('dropdown/tb-ids'),
          jasmine.any(Object),
        );
        done();
      });
    });

    it('should pass sourceTestId as query param', (done) => {
      service.getDrivesDropdown('DRIVE').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringContaining('sourceTestId=DRIVE'),
          jasmine.any(Object),
        );
        done();
      });
    });
  });
});
