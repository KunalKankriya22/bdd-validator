import { TestBed } from '@angular/core/testing';
import { AnyLotNumberQueryService } from './any-lot-number-query.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import { API } from 'src/app/core/constants/api.constants';

describe('AnyLotNumberQueryService', () => {
  let service: AnyLotNumberQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        AnyLotNumberQueryService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(AnyLotNumberQueryService);
  });

  describe('getLotTypes', () => {
    it('should call GET and return lot types', () => {
      const mockResponse = {
        success: true,
        data: [
          { bagCode: '01', codeDesc: 'Bag with no anticoagulant' },
          { bagCode: '51', codeDesc: 'Single CPD' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLotTypes().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].bagCode).toBe('01');
        expect(result[1].codeDesc).toBe('Single CPD');
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.LOT_NUMBER_QUERY.LOT_TYPES);
    });

    it('should return empty array when data is undefined', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getLotTypes().subscribe(result => {
        expect(result).toEqual([]);
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getLotTypes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        },
      });
    });
  });

  describe('getLotNumbers', () => {
    it('should call GET with lot type and return lot numbers', () => {
      const mockResponse = {
        success: true,
        data: [
          { lotNumber: 'CPD45C', vendorName: 'Vendor A', dateReceived: '2023-01-01' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLotNumbers('51').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].lotNumber).toBe('CPD45C');
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.LOT_NUMBER_QUERY.LOT_NUMBERS('51'));
    });

    it('should return empty array when data is undefined', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getLotNumbers('51').subscribe(result => {
        expect(result).toEqual([]);
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getLotNumbers('51').subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        },
      });
    });
  });

  describe('queryByLotNumber', () => {
    it('should call POST and return units with components', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            unitId: 'W633311080613',
            collDate: '2011-08-06T00:00:00',
            sourceTable: 'UNITS',
            components: [
              { productCode: 'E2940V00', componentStatus: 'Lab', systemLabelDecision: 'O Pos', destination: 'IN STOCK' },
            ],
          },
        ],
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.queryByLotNumber({ lotType: '51', lotNumber: 'CPD45C' }).subscribe(result => {
        expect(result.totalUnits).toBe(1);
        expect(result.units.length).toBe(1);
        expect(result.units[0].unitId).toBe('W633311080613');
        expect(result.units[0].components.length).toBe(1);
        expect(result.units[0].components[0].productCode).toBe('E2940V00');
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.LOT_NUMBER_QUERY.QUERY,
        { lotType: '51', lotNumber: 'CPD45C' }
      );
    });

    it('should return empty units when data is undefined', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.queryByLotNumber({ lotType: '51', lotNumber: 'CPD45C' }).subscribe(result => {
        expect(result.units).toEqual([]);
        expect(result.totalUnits).toBe(0);
      });
    });

    it('should handle null component fields with nullish coalescing', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            unitId: 'U001',
            collDate: null,
            sourceTable: 'UNITS',
            components: [
              { productCode: null, componentStatus: null, systemLabelDecision: null, aboLabel: null, destination: null },
            ],
          },
        ],
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.queryByLotNumber({ lotType: '51', lotNumber: 'CPD45C' }).subscribe(result => {
        const comp = result.units[0].components[0];
        expect(comp.productCode).toBeNull();
        expect(comp.componentStatus).toBeNull();
        expect(comp.systemLabelDecision).toBeNull();
        expect(comp.aboLabel).toBeNull();
        expect(comp.destination).toBeNull();
      });
    });

    it('should handle unit with no components array', () => {
      const mockResponse = {
        success: true,
        data: [
          { unitId: 'U001', collDate: null, sourceTable: 'UNITS' },
        ],
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.queryByLotNumber({ lotType: '51', lotNumber: 'CPD45C' }).subscribe(result => {
        expect(result.units[0].components).toEqual([]);
      });
    });

    it('should propagate errors', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Server error')));

      service.queryByLotNumber({ lotType: '51', lotNumber: 'CPD45C' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });
});
