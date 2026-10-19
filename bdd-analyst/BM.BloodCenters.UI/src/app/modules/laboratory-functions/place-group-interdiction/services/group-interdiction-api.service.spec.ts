import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { GroupInterdictionApiService } from './group-interdiction-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  PlaceGroupInterdictionRequestDto,
  PlaceGroupInterdictionResultDto,
  ValidInterdictionDto,
  AffectedUnitsDto,
  DriveDto,
  BatchDto,
  CollectionDateDto,
  LotNumberDto,
  ApiResponse,
} from '../models/group-interdiction.model';

describe('GroupInterdictionApiService', () => {
  let service: GroupInterdictionApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        GroupInterdictionApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(GroupInterdictionApiService);
  });

  describe('placeInterdictions', () => {
    it('should call POST endpoint with correct URL and payload', (done) => {
      const request: PlaceGroupInterdictionRequestDto = {
        controlMode: 'DRIVE',
        selectionValue: 'DRIVE1',
        interdictionCodes: ['CODE1', 'CODE2'],
      };

      const mockResponse: ApiResponse<PlaceGroupInterdictionResultDto> = {
        success: true,
        statusCode: 200,
        item: {
          controlMode: 'DRIVE',
          selectionValue: 'DRIVE1',
          interdictionsPlaced: 10,
          message: 'Successfully placed 10 interdictions',
        },
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.placeInterdictions(request).subscribe({
        next: (result) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(API.GROUP_INTERDICTION.PLACE, request);
          expect(result).toEqual(mockResponse.item!);
          done();
        },
      });
    });

    it('should handle error when placing interdictions', (done) => {
      const request: PlaceGroupInterdictionRequestDto = {
        controlMode: 'DRIVE',
        selectionValue: 'DRIVE1',
        interdictionCodes: ['CODE1'],
      };

      const errorResponse = { message: 'API Error' };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.placeInterdictions(request).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        },
      });
    });
  });

  describe('getActiveInterdictions', () => {
    it('should call GET endpoint with correct URL', (done) => {
      const mockInterdictions: ValidInterdictionDto[] = [
        { interCode: 'CODE1', interDesc: 'Description 1', interType: 'NFT' },
        { interCode: 'CODE2', interDesc: 'Description 2', interType: 'HOLD' },
      ];

      apiServiceSpy.get.and.returnValue(of(mockInterdictions));

      service.getActiveInterdictions().subscribe({
        next: (result) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.GROUP_INTERDICTION.ACTIVE_INTERDICTIONS);
          expect(result).toEqual(mockInterdictions);
          done();
        },
      });
    });

  });

  describe('previewAffectedUnits', () => {
    it('should call GET endpoint with query parameters', (done) => {
      const mockUnits: AffectedUnitsDto[] = [
        { unitId: 'UNIT001', collDate: '2024-05-26T00:00:00Z', chkDigit: '5' },
        { unitId: 'UNIT002', collDate: '2024-05-26T00:00:00Z', chkDigit: '7' },
      ];

      apiServiceSpy.get.and.returnValue(of(mockUnits));

      service.previewAffectedUnits('DRIVE', 'DRIVE1').subscribe({
        next: (result) => {
          const expectedUrl = `${API.GROUP_INTERDICTION.PREVIEW}?controlMode=DRIVE&selectionValue=DRIVE1`;
          expect(apiServiceSpy.get).toHaveBeenCalledWith(expectedUrl);
          expect(result).toEqual(mockUnits);
          done();
        },
      });
    });

    it('should URL encode query parameters', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      service.previewAffectedUnits('COLL DATE', '2024-05-26').subscribe({
        next: () => {
          const expectedUrl = `${API.GROUP_INTERDICTION.PREVIEW}?controlMode=COLL%20DATE&selectionValue=2024-05-26`;
          expect(apiServiceSpy.get).toHaveBeenCalledWith(expectedUrl);
          done();
        },
      });
    });
  });

  describe('getDrives', () => {
    it('should call GET endpoint for drives', (done) => {
      const mockDrives: DriveDto[] = [
        { driveId: 'DRIVE1' },
        { driveId: 'DRIVE2' },
      ];

      apiServiceSpy.get.and.returnValue(of(mockDrives));

      service.getDrives().subscribe({
        next: (result) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.GROUP_INTERDICTION.DROPDOWN_DRIVES);
          expect(result).toEqual(mockDrives);
          done();
        },
      });
    });
  });

  describe('getBatches', () => {
    it('should call GET endpoint for batches', (done) => {
      const mockBatches: BatchDto[] = [
        { batchId: 'BATCH001' },
        { batchId: 'BATCH002' },
      ];

      apiServiceSpy.get.and.returnValue(of(mockBatches));

      service.getBatches().subscribe({
        next: (result) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.GROUP_INTERDICTION.DROPDOWN_BATCHES);
          expect(result).toEqual(mockBatches);
          done();
        },
      });
    });
  });

  describe('getCollectionDates', () => {
    it('should call GET endpoint for collection dates', (done) => {
      const mockDates: CollectionDateDto[] = [
        { collDate: '2024-05-26T00:00:00Z', formattedDate: '26-MAY-2024' },
        { collDate: '2024-05-25T00:00:00Z', formattedDate: '25-MAY-2024' },
      ];

      apiServiceSpy.get.and.returnValue(of(mockDates));

      service.getCollectionDates().subscribe({
        next: (result) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.GROUP_INTERDICTION.DROPDOWN_COLLECTION_DATES);
          expect(result).toEqual(mockDates);
          done();
        },
      });
    });
  });

  describe('getLotNumbers', () => {
    it('should call GET endpoint for lot numbers', (done) => {
      const mockLots: LotNumberDto[] = [
        { lotNumber: 'LOT123' },
        { lotNumber: 'LOT456' },
      ];

      apiServiceSpy.get.and.returnValue(of(mockLots));

      service.getLotNumbers().subscribe({
        next: (result) => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.GROUP_INTERDICTION.DROPDOWN_LOT_NUMBERS);
          expect(result).toEqual(mockLots);
          done();
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should log errors to console', (done) => {
      spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Test Error')));

      service.getActiveInterdictions().subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('Error fetching active interdictions:', jasmine.any(Error));
          done();
        },
      });
    });
  });
});
