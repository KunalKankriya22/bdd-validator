import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { PooledComponentQueryApiService } from './pooled-component-query-api.service';
import { API } from '@core/constants/api.constants';
import { PooledComponentDto, PooledComponentUnitDto, ReturnResult } from '../models/pooled-component-query.model';

describe('PooledComponentQueryApiService', () => {
  let service: PooledComponentQueryApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockHeaderResponse: ReturnResult<PooledComponentDto> = {
    success: true,
    statusCode: 200,
    message: 'Pool data retrieved successfully',
    data: [{
      poolId: 'W454511559559',
      patientId: '65981',
      patientFirstName: 'HENRY',
      patientLastName: 'POWERS',
      facility: 'OKINAWA',
      productCode: 'E2987V00',
      productDescription: 'POOLED PLATELETS|NS/XX/20-24C',
      catalogNumber: '1PM1111111',
      lotNumber: 'PM1111111',
      filterLotNumber: undefined,
      poolDate: '2018-03-01T19:20:00',
      poolExpiryDate: '2018-06-26T15:20:00',
      totalComponentCount: 5,
    }],
    total: 1,
  };

  const mockUnitsResponse: ReturnResult<PooledComponentUnitDto> = {
    success: true,
    statusCode: 200,
    message: 'Component units retrieved successfully',
    data: [{
      unitId: 'W1234-18-031310-Z',
      checkDigit: 'Z',
      productCode: '12000',
      productDescription: 'Platelets',
      componentPrefix: '1',
      expiryDate: '2018-03-13T19:20:00',
      aboRhDescription: 'NFT NO',
    }],
    total: 1,
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        PooledComponentQueryApiService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(PooledComponentQueryApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getPoolHeader', () => {
    it('should call GET with correct URL', () => {
      apiServiceSpy.get.and.returnValue(of(mockHeaderResponse));

      service.getPoolHeader('W454511559559').subscribe((result) => {
        expect(result).toEqual(mockHeaderResponse);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.POOLED_COMPONENT.GET_HEADER('W454511559559')
      );
    });

    it('should encode special characters in pool ID', () => {
      apiServiceSpy.get.and.returnValue(of(mockHeaderResponse));

      service.getPoolHeader('POOL/123');

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.POOLED_COMPONENT.GET_HEADER('POOL/123')
      );
    });
  });

  describe('getPoolUnits', () => {
    it('should call GET with correct URL', () => {
      apiServiceSpy.get.and.returnValue(of(mockUnitsResponse));

      service.getPoolUnits('W454511559559').subscribe((result) => {
        expect(result).toEqual(mockUnitsResponse);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.POOLED_COMPONENT.GET_UNITS('W454511559559')
      );
    });
  });

  describe('searchPools', () => {
    it('should call POST with correct URL and body', () => {
      const mockSearchResponse: ReturnResult<PooledComponentDto> = {
        success: true,
        statusCode: 200,
        message: 'Search results',
        data: [],
        total: 0,
      };
      apiServiceSpy.post.and.returnValue(of(mockSearchResponse));
      const query = { searchKeyword: 'test' };

      service.searchPools(query, 10, 0).subscribe((result) => {
        expect(result).toEqual(mockSearchResponse);
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.POOLED_COMPONENT.SEARCH(10, 0),
        query
      );
    });
  });
});
