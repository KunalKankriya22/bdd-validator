import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EquipmentStatusQueryApiService } from './equipment-status-query-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

describe('EquipmentStatusQueryApiService', () => {
  let service: EquipmentStatusQueryApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        EquipmentStatusQueryApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });
    service = TestBed.inject(EquipmentStatusQueryApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getEquipmentList ─────────────────────────────────────────────────────────

  describe('getEquipmentList', () => {
    it('should POST query to the LIST endpoint', (done) => {
      const query = { equipType: 'FRIDGE', status: 'ACTIVE' } as any;
      const mockResult = { data: [{ equipId: 'EQ-001' }], total: 1 };
      apiServiceSpy.post.and.returnValue(of(mockResult));

      service.getEquipmentList(query).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.EQUIPMENT_QUERY.LIST, query);
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should propagate errors from the API', (done) => {
      spyOn(console, 'error');
      const query = {} as any;
      const error = new Error('Server error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.getEquipmentList(query).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should pass all query filters to POST body', (done) => {
      const query = {
        equipmentType: 'CENT', equipmentId: 'E001', reference: 'EQ-000001',
        status: 'IN', searchKeyword: 'test', sortColumn: 'equipId', sortOrder: 'ASC',
      } as any;
      apiServiceSpy.post.and.returnValue(of({ data: [] }));

      service.getEquipmentList(query).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.EQUIPMENT_QUERY.LIST, query);
        done();
      });
    });
  });

  // ── getEquipmentById ─────────────────────────────────────────────────────────

  describe('getEquipmentById', () => {
    it('should GET from the GET_BY_ID endpoint with all three parameters', (done) => {
      const equipType = 'FRIDGE';
      const equipId = 'EQ-001';
      const equipReference = 'REF-A';
      const mockResult = { data: [{ equipId: 'EQ-001' }] };
      apiServiceSpy.get.and.returnValue(of(mockResult));

      service.getEquipmentById(equipType, equipId, equipReference).subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.EQUIPMENT_QUERY.GET_BY_ID(equipType, equipId, equipReference),
        );
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should propagate errors from the API', (done) => {
      const error = new Error('Not found');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getEquipmentById('X', 'Y', 'Z').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── getEquipmentTypes ────────────────────────────────────────────────────────

  describe('getEquipmentTypes', () => {
    it('should GET from the TYPES endpoint', (done) => {
      const mockResult = { data: [{ code: 'FRIDGE', description: 'Refrigerator' }] };
      apiServiceSpy.get.and.returnValue(of(mockResult));

      service.getEquipmentTypes().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.EQUIPMENT_QUERY.TYPES);
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should propagate errors from the API', (done) => {
      const error = new Error('Unauthorized');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getEquipmentTypes().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── getEquipmentStatuses ─────────────────────────────────────────────────────

  describe('getEquipmentStatuses', () => {
    it('should GET from the STATUSES endpoint', (done) => {
      const mockResult = { data: [{ code: 'ACTIVE' }, { code: 'INACTIVE' }] };
      apiServiceSpy.get.and.returnValue(of(mockResult));

      service.getEquipmentStatuses().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.EQUIPMENT_QUERY.STATUSES);
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should propagate errors from the API', (done) => {
      const error = new Error('Server error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getEquipmentStatuses().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── getEquipmentIds ──────────────────────────────────────────────────────────

  describe('getEquipmentIds', () => {
    it('should GET from the IDS_BY_TYPE endpoint with equipType', (done) => {
      const equipType = 'CENTRIFUGE';
      const mockResult = { data: [{ equipId: 'C-001' }, { equipId: 'C-002' }] };
      apiServiceSpy.get.and.returnValue(of(mockResult));

      service.getEquipmentIds(equipType).subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.EQUIPMENT_QUERY.IDS_BY_TYPE(equipType));
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should propagate errors from the API', (done) => {
      const error = new Error('Bad request');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getEquipmentIds('INVALID').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── getEquipmentReferences ───────────────────────────────────────────────────

  describe('getEquipmentReferences', () => {
    it('should GET from the REFERENCES endpoint with equipType and equipId', (done) => {
      const equipType = 'FRIDGE';
      const equipId = 'EQ-001';
      const mockResult = { data: [{ reference: 'REF-A' }, { reference: 'REF-B' }] };
      apiServiceSpy.get.and.returnValue(of(mockResult));

      service.getEquipmentReferences(equipType, equipId).subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.EQUIPMENT_QUERY.REFERENCES(equipType, equipId),
        );
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should propagate errors from the API', (done) => {
      const error = new Error('Not found');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getEquipmentReferences('X', 'Y').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── getStatistics ────────────────────────────────────────────────────────────

  describe('getStatistics', () => {
    it('should GET from the STATISTICS endpoint with all three parameters', (done) => {
      const equipType = 'FRIDGE';
      const equipId = 'EQ-001';
      const equipReference = 'REF-A';
      const mockResult = { data: [{ avgTemp: 4.2, minTemp: 2.0, maxTemp: 6.1 }] };
      apiServiceSpy.get.and.returnValue(of(mockResult));

      service.getStatistics(equipType, equipId, equipReference).subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.EQUIPMENT_QUERY.STATISTICS(equipType, equipId, equipReference),
        );
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should propagate errors from the API', (done) => {
      const error = new Error('Server error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getStatistics('X', 'Y', 'Z').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ── getEquipmentParmValues ───────────────────────────────────────────────────

  describe('getEquipmentParmValues', () => {
    it('should GET from the PARAMETERS endpoint with all three parameters', (done) => {
      const equipType = 'FRIDGE';
      const equipId = 'EQ-001';
      const equipReference = 'REF-A';
      const mockResult = { data: [{ paramName: 'Temperature', paramValue: '4.5' }] };
      apiServiceSpy.get.and.returnValue(of(mockResult));

      service.getEquipmentParmValues(equipType, equipId, equipReference).subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.EQUIPMENT_QUERY.PARAMETERS(equipType, equipId, equipReference),
        );
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should propagate errors from the API', (done) => {
      spyOn(console, 'error');
      const error = new Error('Network error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getEquipmentParmValues('X', 'Y', 'Z').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should handle empty data response', (done) => {
      const mockResult = { data: [], totalCount: 0 };
      apiServiceSpy.get.and.returnValue(of(mockResult));

      service.getEquipmentParmValues('A', 'B', 'C').subscribe((result) => {
        expect(result.data).toEqual([]);
        done();
      });
    });
  });
});
