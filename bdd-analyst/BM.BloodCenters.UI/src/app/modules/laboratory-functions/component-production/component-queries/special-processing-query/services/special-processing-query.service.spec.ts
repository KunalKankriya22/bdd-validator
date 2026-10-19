import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SpecialProcessingQueryService } from './special-processing-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ReturnResult,
  SpecialProcessingQueryResultDto,
} from '../models/special-processing-query.model';

describe('SpecialProcessingQueryService', () => {
  let service: SpecialProcessingQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockResponse: ReturnResult<SpecialProcessingQueryResultDto> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      {
        unitId: '12345678',
        chapterId: 'CH01',
        collDate: '2026-06-01',
        checkDigit: '01',
        specialProcessingRecords: [
          {
            unitId: '12345678',
            collDate: '2026-06-01',
            chapterId: 'CH01',
            productCode: 'RBC',
            componentPrefix: '01',
            processCode: 'SP01',
            processCodeDescription: 'Special Processing Type 1',
            insertDate: '2026-06-02T10:30:00',
            insertUserId: 'USER01',
            differentials: [
              {
                differentialId: 1,
                stageCode: 'STG1',
                insertDate: '2026-06-02T10:30:00',
                insertUserId: 'USER01',
                details: [
                  { cellCode: 'WBC', cellCodeDescription: 'White Blood Cells', cellCount: 100 },
                  { cellCode: 'RBC', cellCodeDescription: 'Red Blood Cells', cellCount: 5000 },
                ],
              },
            ],
            reagents: [
              {
                kitId: 101,
                stageCode: 'STG1',
                insertDate: '2026-06-02T11:00:00',
                insertUserId: 'USER01',
                details: [
                  {
                    reagentName: 'Reagent A',
                    manufacturer: 'Manufacturer X',
                    lotNumber: 'LOT123',
                    expirationDate: '2027-06-01',
                  },
                ],
              },
            ],
            spiking: [
              {
                spikingType: 'TYPE1',
                insertDate: '2026-06-02T12:00:00',
                insertUserId: 'USER01',
                bagLotNumber: 'BAG001',
                filterLotNumber: 'FLT001',
                bagsSpiked: 4,
                bagsForComponents: 3,
                bagsUsed: 2,
              },
            ],
          },
        ],
      },
    ],
    total: 1,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        SpecialProcessingQueryService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(SpecialProcessingQueryService);
  });

  describe('search', () => {
    it('should call API with correct endpoint and request payload', () => {
      const unitId = '12345678';
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.search(unitId).subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.SPECIAL_PROCESSING_QUERY.SEARCH,
        { unitId }
      );
    });

    it('should return special processing query results', (done) => {
      const unitId = '12345678';
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.search(unitId).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.data).toBeTruthy();
        expect(response.data!.length).toBe(1);
        expect(response.data![0].unitId).toBe(unitId);
        expect(response.data![0].specialProcessingRecords.length).toBe(1);
        done();
      });
    });

    it('should handle API errors gracefully', (done) => {
      const unitId = '12345678';
      const errorResponse: ReturnResult<SpecialProcessingQueryResultDto> = {
        success: false,
        message: 'Unit not found',
        errorCode: '0210',
        statusCode: 404,
        data: null,
      };

      apiServiceSpy.post.and.returnValue(of(errorResponse));

      service.search(unitId).subscribe((response) => {
        expect(response.success).toBeFalse();
        expect(response.errorCode).toBe('0210');
        expect(response.data).toBeNull();
        done();
      });
    });

  });
});
