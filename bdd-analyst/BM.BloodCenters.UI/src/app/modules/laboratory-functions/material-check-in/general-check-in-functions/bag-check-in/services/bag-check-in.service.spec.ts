import { TestBed } from '@angular/core/testing';
import { BagCheckInService } from './bag-check-in.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import { API } from '@core/constants/api.constants';
import {
  BagBatch,
  BagUnit,
  BagValidateUnitResponse,
  BagCatalog,
  BagLot,
  BagCheckInRequest,
  BagCheckInResponse,
  TubeFormat,
  TubeCheckInEntry,
  TubeCheckInSubmitRequest,
  TubeCheckInSubmitResponse,
  TubeValidateUnitResponse,
} from '../models/bag-check-in.model';

describe('BagCheckInService', () => {
  let service: BagCheckInService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockBatch: BagBatch = { batchId: 'B001', minTemp: 1, maxTemp: 6, unitCount: 3 };
  const mockUnit: BagUnit = { unitId: 'U001', catalogNumber: 'CAT001', lotNumber: 'LOT001' };
  const mockValidateResponse: BagValidateUnitResponse = { alreadyCheckedIn: false, hasTubeData: false };
  const mockCatalog: BagCatalog = { catalogNumber: 'CAT001' };
  const mockLot: BagLot = { lotNumber: 'LOT001' };
  const mockCheckInRequest: BagCheckInRequest = { unitId: 'U001', catalogNumber: 'CAT001', lotNumber: 'LOT001', minTemp: 1, maxTemp: 6 };
  const mockCheckInResponse: BagCheckInResponse = { batchId: 'B001', unitId: 'U001' };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [BagCheckInService, { provide: ApiService, useValue: apiServiceSpy }],
    });
    service = TestBed.inject(BagCheckInService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getBatches', () => {
    it('should return batches from data array', (done) => {
      apiService.get.and.returnValue(of({ data: [mockBatch] }));
      service.getBatches().subscribe((result) => {
        expect(result).toEqual([mockBatch]);
        expect(apiService.get).toHaveBeenCalledWith(API.BAG_CHECKIN.GET_BATCHES);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({}));
      service.getBatches().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Network error');
      apiService.get.and.returnValue(throwError(() => error));
      service.getBatches().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getBatchDetail', () => {
    it('should return batch detail from item', (done) => {
      apiService.get.and.returnValue(of({ item: mockBatch }));
      service.getBatchDetail('B001').subscribe((result) => {
        expect(result).toEqual(mockBatch);
        expect(apiService.get).toHaveBeenCalledWith(API.BAG_CHECKIN.GET_BATCH_DETAIL('B001'));
        done();
      });
    });

    it('should return null when item is undefined', (done) => {
      apiService.get.and.returnValue(of({}));
      service.getBatchDetail('B001').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Not found');
      apiService.get.and.returnValue(throwError(() => error));
      service.getBatchDetail('B001').subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getBatchUnits', () => {
    it('should return batch units without sort parameters', (done) => {
      apiService.get.and.returnValue(of({ data: [mockUnit] }));
      service.getBatchUnits('B001').subscribe((result) => {
        expect(result).toEqual([mockUnit]);
        expect(apiService.get).toHaveBeenCalledWith(API.BAG_CHECKIN.GET_BATCH_UNITS('B001'));
        done();
      });
    });

    it('should append sort query params when sortColumn is provided', (done) => {
      apiService.get.and.returnValue(of({ data: [mockUnit] }));
      service.getBatchUnits('B001', 'unitId', 'DESC').subscribe((result) => {
        expect(result).toEqual([mockUnit]);
        const expectedUrl = API.BAG_CHECKIN.GET_BATCH_UNITS('B001') + '?sortColumn=unitId&sortOrder=DESC';
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });

    it('should default sortOrder to ASC when sortColumn is provided but sortOrder is undefined', (done) => {
      apiService.get.and.returnValue(of({ data: [mockUnit] }));
      service.getBatchUnits('B001', 'catalogNumber').subscribe((result) => {
        expect(result).toEqual([mockUnit]);
        const expectedUrl = API.BAG_CHECKIN.GET_BATCH_UNITS('B001') + '?sortColumn=catalogNumber&sortOrder=ASC';
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({}));
      service.getBatchUnits('B001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Server error');
      apiService.get.and.returnValue(throwError(() => error));
      service.getBatchUnits('B001').subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('validateUnit', () => {
    it('should return validate unit response', (done) => {
      apiService.get.and.returnValue(of({ item: mockValidateResponse }));
      service.validateUnit('U001').subscribe((result) => {
        expect(result).toEqual(mockValidateResponse);
        expect(apiService.get).toHaveBeenCalledWith(API.BAG_CHECKIN.VALIDATE_UNIT('U001'));
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Validation failed');
      apiService.get.and.returnValue(throwError(() => error));
      service.validateUnit('U001').subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getCatalogNumbers', () => {
    it('should return catalog numbers', (done) => {
      apiService.get.and.returnValue(of({ data: [mockCatalog] }));
      service.getCatalogNumbers().subscribe((result) => {
        expect(result).toEqual([mockCatalog]);
        expect(apiService.get).toHaveBeenCalledWith(API.BAG_CHECKIN.GET_CATALOG_NUMBERS);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({}));
      service.getCatalogNumbers().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Catalog error');
      apiService.get.and.returnValue(throwError(() => error));
      service.getCatalogNumbers().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('validateCatalog', () => {
    it('should return true when success is true', (done) => {
      apiService.get.and.returnValue(of({ success: true }));
      service.validateCatalog('CAT001').subscribe((result) => {
        expect(result).toBeTrue();
        expect(apiService.get).toHaveBeenCalledWith(API.BAG_CHECKIN.VALIDATE_CATALOG('CAT001'));
        done();
      });
    });

    it('should return false when success is false', (done) => {
      apiService.get.and.returnValue(of({ success: false }));
      service.validateCatalog('CAT001').subscribe((result) => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should return false when success is undefined', (done) => {
      apiService.get.and.returnValue(of({}));
      service.validateCatalog('CAT001').subscribe((result) => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Validate catalog error');
      apiService.get.and.returnValue(throwError(() => error));
      service.validateCatalog('CAT001').subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getLotNumbers', () => {
    it('should return lot numbers', (done) => {
      apiService.get.and.returnValue(of({ data: [mockLot] }));
      service.getLotNumbers('CAT001').subscribe((result) => {
        expect(result).toEqual([mockLot]);
        const expectedUrl = API.BAG_CHECKIN.GET_LOT_NUMBERS + '?catalogNumber=CAT001';
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({}));
      service.getLotNumbers('CAT001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should encode special characters in catalog number', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));
      service.getLotNumbers('CAT/001&test').subscribe((result) => {
        expect(result).toEqual([]);
        const expectedUrl = API.BAG_CHECKIN.GET_LOT_NUMBERS + '?catalogNumber=' + encodeURIComponent('CAT/001&test');
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Lot error');
      apiService.get.and.returnValue(throwError(() => error));
      service.getLotNumbers('CAT001').subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('checkIn', () => {
    it('should post check-in request and return response', (done) => {
      apiService.post.and.returnValue(of({ item: mockCheckInResponse }));
      service.checkIn(mockCheckInRequest).subscribe((result) => {
        expect(result).toEqual(mockCheckInResponse);
        expect(apiService.post).toHaveBeenCalledWith(API.BAG_CHECKIN.CHECK_IN, mockCheckInRequest);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Check-in failed');
      apiService.post.and.returnValue(throwError(() => error));
      service.checkIn(mockCheckInRequest).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getTubeFormats', () => {
    const mockFormat: TubeFormat = { formatCode: 'PPR', description: 'Purple-Purple-Red', fields: [] };

    it('should return tube formats from data array', (done) => {
      apiService.get.and.returnValue(of({ data: [mockFormat] }));
      service.getTubeFormats().subscribe((result) => {
        expect(result).toEqual([mockFormat]);
        expect(apiService.get).toHaveBeenCalledWith(API.TUBE_CHECKIN.GET_FORMATS);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({}));
      service.getTubeFormats().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Formats error');
      apiService.get.and.returnValue(throwError(() => error));
      service.getTubeFormats().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getTubeEntries', () => {
    const mockEntry: TubeCheckInEntry = { unitId: 'U001', redTop1: 'R1', redTop2: 'R2', purpleTop1: 'P1', purpleTop2: 'P2' };

    it('should return tube entries from data array', (done) => {
      apiService.get.and.returnValue(of({ data: [mockEntry] }));
      service.getTubeEntries().subscribe((result) => {
        expect(result).toEqual([mockEntry]);
        expect(apiService.get).toHaveBeenCalledWith(API.TUBE_CHECKIN.GET_ENTRIES);
        done();
      });
    });

    it('should append sort query params when sortColumn is provided', (done) => {
      apiService.get.and.returnValue(of({ data: [mockEntry] }));
      service.getTubeEntries('unitId', 'DESC').subscribe((result) => {
        expect(result).toEqual([mockEntry]);
        const expectedUrl = API.TUBE_CHECKIN.GET_ENTRIES + '?sortColumn=unitId&sortOrder=DESC';
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });

    it('should default sortOrder to ASC when sortColumn is provided but sortOrder is undefined', (done) => {
      apiService.get.and.returnValue(of({ data: [mockEntry] }));
      service.getTubeEntries('redTop1').subscribe((result) => {
        expect(result).toEqual([mockEntry]);
        const expectedUrl = API.TUBE_CHECKIN.GET_ENTRIES + '?sortColumn=redTop1&sortOrder=ASC';
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiService.get.and.returnValue(of({}));
      service.getTubeEntries().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Entries error');
      apiService.get.and.returnValue(throwError(() => error));
      service.getTubeEntries().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('validateTubeUnit', () => {
    const mockTubeValidateResponse: TubeValidateUnitResponse = { alreadyCheckedIn: false };

    it('should post validate request with unitId and tubeType and return response', (done) => {
      apiService.post.and.returnValue(of({ item: mockTubeValidateResponse }));
      service.validateTubeUnit('U001', 'red1').subscribe((result) => {
        expect(result).toEqual(mockTubeValidateResponse);
        expect(apiService.post).toHaveBeenCalledWith(API.TUBE_CHECKIN.VALIDATE_UNIT, { unitId: 'U001', tubeType: 'red1' });
        done();
      });
    });

    it('should return response with alreadyCheckedIn true', (done) => {
      const checkedInResponse: TubeValidateUnitResponse = { alreadyCheckedIn: true, errorCode: '0150', errorMessage: 'Already checked in' };
      apiService.post.and.returnValue(of({ item: checkedInResponse }));
      service.validateTubeUnit('U002', 'purple1').subscribe((result) => {
        expect(result).toEqual(checkedInResponse);
        expect(result.alreadyCheckedIn).toBeTrue();
        expect(result.errorCode).toBe('0150');
        done();
      });
    });

    it('should return default response when item is undefined', (done) => {
      apiService.post.and.returnValue(of({}));
      service.validateTubeUnit('U001', 'red1').subscribe((result) => {
        expect(result).toEqual({ alreadyCheckedIn: false });
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Tube validation error');
      apiService.post.and.returnValue(throwError(() => error));
      service.validateTubeUnit('U001', 'red1').subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('submitTubeCheckIn', () => {
    const mockRequest: TubeCheckInSubmitRequest = { formatCode: 'PPR', unitId: 'U001' };
    const mockResponse: TubeCheckInSubmitResponse = { masterUnitId: 'M001', message: 'Success' };

    it('should post tube check-in request and return response', (done) => {
      apiService.post.and.returnValue(of({ item: mockResponse }));
      service.submitTubeCheckIn(mockRequest).subscribe((result) => {
        expect(result).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(API.TUBE_CHECKIN.SUBMIT, mockRequest);
        done();
      });
    });

    it('should propagate error from API', (done) => {
      const error = new Error('Submit error');
      apiService.post.and.returnValue(throwError(() => error));
      service.submitTubeCheckIn(mockRequest).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
