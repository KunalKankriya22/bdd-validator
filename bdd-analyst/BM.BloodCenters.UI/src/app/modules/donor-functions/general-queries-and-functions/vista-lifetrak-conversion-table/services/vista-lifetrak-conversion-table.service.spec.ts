import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { VistaLifeTrakConversionTableService, ApiResponse } from './vista-lifetrak-conversion-table.service';
import { ApiService } from '@shared/services/api.service';
import { ValidMasterCodesService } from '@shared/services/valid-master-codes.service';
import { API } from 'src/app/core/constants/api.constants';
import { IdpConvRefValueDto } from '../models/vista-lifetrak-conversion-table.model';

describe('VistaLifeTrakConversionTableService', () => {
  let service: VistaLifeTrakConversionTableService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let lookupServiceSpy: jasmine.SpyObj<ValidMasterCodesService>;

  const mockRecord: IdpConvRefValueDto = {
    convRefId: 1,
    sourceId: 'DRM',
    targetId: 'LFTRK',
    sourceCodeType: 'DRVTY',
    sourceValue: 'BLD',
    sourceTable: null,
    sourceColumn: null,
    targetCodeType: 'DRVTY',
    targetValue: 'WHOLE',
    targetTable: null,
    targetColumn: null,
    effDate: '2025-01-01T00:00:00',
    termDate: null,
    convProcCall: null,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    lookupServiceSpy = jasmine.createSpyObj('ValidMasterCodesService', ['getByCodeType']);

    TestBed.configureTestingModule({
      providers: [
        VistaLifeTrakConversionTableService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ValidMasterCodesService, useValue: lookupServiceSpy },
      ],
    });

    service = TestBed.inject(VistaLifeTrakConversionTableService);
  });

  describe('getById', () => {
    it('should call GET with correct URL and return data', (done) => {
      const response: ApiResponse<IdpConvRefValueDto> = {
        success: true,
        data: mockRecord,
        message: 'Successfully fetched IDP Conversion Reference Value',
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getById(1).subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.IDP_CONVERSION.GET_BY_ID(1));
        expect(result).toEqual(mockRecord);
        done();
      });
    });

  });

  describe('getConversionCodes', () => {
    it('should call POST with query params and return grid response', (done) => {
      const response: ApiResponse<IdpConvRefValueDto[]> = {
        success: true,
        data: [mockRecord],
        totalCount: 1,
      };
      apiServiceSpy.post.and.returnValue(of(response));

      service
        .getConversionCodes(25, 0, { sourceId: 'DRM', targetId: 'LFTRK' })
        .subscribe((result) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.IDP_CONVERSION.LIST(25, 0),
            { sourceId: 'DRM', targetId: 'LFTRK' }
          );
          expect(result.data.length).toBe(1);
          expect(result.totalCount).toBe(1);
          done();
        });
    });

    it('should include optional search and sort params', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: [], totalCount: 0 }));

      service
        .getConversionCodes(25, 0, {
          sourceId: 'DRM',
          targetId: 'LFTRK',
          searchKeyword: 'WHOLE',
          sortColumn: 'TargetValue',
          sortOrder: 'DESC',
        })
        .subscribe(() => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args[1] as Record<string, unknown>;
          expect(callArgs['searchKeyword']).toBe('WHOLE');
          expect(callArgs['sortColumn']).toBe('TargetValue');
          expect(callArgs['sortOrder']).toBe('DESC');
          done();
        });
    });

  });

  describe('create', () => {
    it('should call POST with create DTO', (done) => {
      const dto = {
        sourceId: 'DRM',
        targetId: 'LFTRK',
        sourceCodeType: 'DRVTY',
        sourceValue: 'BLD',
        targetCodeType: 'DRVTY',
        targetValue: 'WHOLE',
      };
      const response: ApiResponse<IdpConvRefValueDto> = { success: true, data: mockRecord, statusCode: 201 };
      apiServiceSpy.post.and.returnValue(of(response));

      service.create(dto).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.IDP_CONVERSION.CREATE, dto);
        expect(result.success).toBeTrue();
        done();
      });
    });

    it('should propagate 409 conflict error', (done) => {
      apiServiceSpy.post.and.returnValue(
        throwError(() => ({ status: 409, error: { errorCode: '0319', errorResponse: { error: 'Duplicate entry' } } }))
      );

      service.create({ sourceId: 'DRM', targetId: 'LFTRK', sourceCodeType: 'X', sourceValue: 'Y', targetCodeType: 'X', targetValue: 'Y' }).subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should call PUT with convRefId and update DTO', (done) => {
      const dto = {
        sourceCodeType: 'DRVTY',
        sourceValue: 'BLD',
        targetCodeType: 'DRVTY',
        targetValue: 'WHOLE_UPDATED',
      };
      const response: ApiResponse<IdpConvRefValueDto> = { success: true, data: { ...mockRecord, targetValue: 'WHOLE_UPDATED' } };
      apiServiceSpy.put.and.returnValue(of(response));

      service.update(1, dto).subscribe((result) => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(API.IDP_CONVERSION.UPDATE(1), dto);
        expect(result.success).toBeTrue();
        done();
      });
    });
  });

  describe('lookup methods', () => {
    const mockLookups = [{ code: 'DRM', description: 'DRM System', effDate: '', termDate: null, isActive: true }];

    it('should call getByCodeType with IDPSR for source ID lookup', () => {
      lookupServiceSpy.getByCodeType.and.returnValue(of(mockLookups as any));
      service.getSourceIdLookup().subscribe();
      expect(lookupServiceSpy.getByCodeType).toHaveBeenCalledWith('IDPSR');
    });

    it('should call getByCodeType with IDPTR for target ID lookup', () => {
      lookupServiceSpy.getByCodeType.and.returnValue(of(mockLookups as any));
      service.getTargetIdLookup().subscribe();
      expect(lookupServiceSpy.getByCodeType).toHaveBeenCalledWith('IDPTR');
    });

    it('should call getByCodeType with IDPTP for source type lookup', () => {
      lookupServiceSpy.getByCodeType.and.returnValue(of(mockLookups as any));
      service.getSourceTypeLookup().subscribe();
      expect(lookupServiceSpy.getByCodeType).toHaveBeenCalledWith('IDPTP');
    });

    it('should call getByCodeType with IDPTV for target type lookup', () => {
      lookupServiceSpy.getByCodeType.and.returnValue(of(mockLookups as any));
      service.getTargetTypeLookup().subscribe();
      expect(lookupServiceSpy.getByCodeType).toHaveBeenCalledWith('IDPTV');
    });
  });

  describe('getTargetValueLookups', () => {
    it('should call GET with target code type and return lookup items', (done) => {
      const response = {
        success: true,
        data: [{ code: 'WHOLE', description: 'Whole Blood' }],
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getTargetValueLookups('DRVTY').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.IDP_CONVERSION.TARGET_VALUE_LOOKUPS('DRVTY'));
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('WHOLE');
        done();
      });
    });

    it('should return empty array on null response data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getTargetValueLookups('DRVTY').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
