import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SpikeApiService } from './spike-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  CreateComponentSpikingDto,
  ComponentSpikingResponseDto,
  ProcessCodeDto,
  SpikingTypeDto,
  ProductDto,
  LotNumberDto,
  ApiResponse,
} from '../models/spike.model';

describe('SpikeApiService', () => {
  let service: SpikeApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [SpikeApiService, { provide: ApiService, useValue: spy }],
    });

    service = TestBed.inject(SpikeApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('createComponentSpiking', () => {
    it('should create component spiking record successfully', (done) => {
      const mockDto: CreateComponentSpikingDto = {
        unitId: 'UNIT001',
        collDate: '2024-01-15T00:00:00Z',
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        processCode: 'REG',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: 'FLOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      };

      const mockResponse: ApiResponse<ComponentSpikingResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Component spiking record created successfully',
        item: {
          unitId: 'UNIT001',
          collDate: '2024-01-15T00:00:00Z',
          chapterId: 'CH001',
          productCode: 'PROD01',
          componentPrefix: 'CP001',
          processCode: 'REG',
          spikingType: 'TYPE1',
          bagLotNumber: 'LOT001',
          filterLotNumber: 'FLOT001',
          bagsSpiked: 5,
          bagsForComponents: 3,
          bagsUsed: 0,
          insertDats: '2024-01-15T10:30:00Z',
          insertUserId: 'USER001',
          programId: 'FRISPIKE',
        },
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createComponentSpiking(mockDto).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse.item!);
          expect(apiServiceSpy.post).toHaveBeenCalledTimes(1);
          done();
        },
        error: () => fail('Should not have errored'),
      });
    });

  });

  describe('getProcessCodes', () => {
    it('should fetch process codes successfully', (done) => {
      const mockData: ProcessCodeDto[] = [
        { processCode: 'REG', processCodeDesc: 'Regular Processing' },
        { processCode: 'FR01', processCodeDesc: 'Special Process 1' },
      ];

      const mockResponse: ApiResponse<ProcessCodeDto[]> = {
        success: true,
        data: mockData,
        message: 'Process codes retrieved successfully',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(result.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        },
        error: () => fail('Should not have errored'),
      });
    });

  });

  describe('getSpikingTypes', () => {
    it('should fetch spiking types successfully', (done) => {
      const mockData: SpikingTypeDto[] = [
        { spikingType: 'TYPE1', spikingTypeDesc: 'Type 1 Spiking' },
        { spikingType: 'TYPE2', spikingTypeDesc: 'Type 2 Spiking' },
      ];

      const mockResponse: ApiResponse<SpikingTypeDto[]> = {
        success: true,
        data: mockData,
        message: 'Spiking types retrieved successfully',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSpikingTypes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(result.length).toBe(2);
          done();
        },
        error: () => fail('Should not have errored'),
      });
    });
  });

  describe('getUnitCollectionDates', () => {
    it('should fetch unit collection dates successfully', (done) => {
      const unitId = 'UNIT001';
      const mockData = [{ collDate: '2024-01-15' }];

      const mockResponse: ApiResponse<{ collDate: string }[]> = {
        success: true,
        data: mockData,
        message: 'Collection dates retrieved successfully',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUnitCollectionDates(unitId, 'DAL').subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(result.length).toBe(1);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.stringContaining('unitId=UNIT001'));
          done();
        },
        error: () => fail('Should not have errored'),
      });
    });

  });

  describe('getProducts', () => {
    it('should fetch products filtered by unit, date, and process code', () => {
      const mockData: ProductDto[] = [
        {
          productCode: 'PROD01',
          productDesc: 'Red Blood Cells',
          componentPrefix: 'CP001',
        },
        {
          productCode: 'PROD02',
          productDesc: 'Plasma',
          componentPrefix: 'CP002',
        },
      ];

      const mockResponse: ApiResponse<ProductDto[]> = {
        success: true,
        data: mockData,
        message: 'Products retrieved successfully',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      let result: ProductDto[] | undefined;
      service.getProducts('UNIT001', '2024-01-15T00:00:00Z', 'REG', 'DAL').subscribe(r => result = r);

      expect(result).toEqual(mockData);
      expect(result!.length).toBe(2);
      expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.stringContaining('unitId=UNIT001'));
      expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.stringContaining('processCode=REG'));
    });

  });

  describe('getBagLots', () => {
    it('should fetch bag lot numbers successfully', (done) => {
      const mockData: LotNumberDto[] = [
        { lotNumber: 'LOT001' },
        { lotNumber: 'LOT002' },
      ];

      const mockResponse: ApiResponse<LotNumberDto[]> = {
        success: true,
        data: mockData,
        message: 'Bag lot numbers retrieved successfully',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBagLots().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(result.length).toBe(2);
          done();
        },
        error: () => fail('Should not have errored'),
      });
    });
  });

  describe('getFilterLots', () => {
    it('should fetch filter lot numbers with product type', (done) => {
      const mockData: LotNumberDto[] = [
        { lotNumber: 'FLOT001' },
        { lotNumber: 'FLOT002' },
      ];

      const mockResponse: ApiResponse<LotNumberDto[]> = {
        success: true,
        data: mockData,
        message: 'Filter lot numbers retrieved successfully',
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFilterLots('RBC').subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.stringContaining('filter-lots'));
          done();
        },
        error: () => fail('Should not have errored'),
      });
    });

  });
});
