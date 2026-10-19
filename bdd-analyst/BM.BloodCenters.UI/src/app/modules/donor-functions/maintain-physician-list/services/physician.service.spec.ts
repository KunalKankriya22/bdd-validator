import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PhysicianService } from './physician.service';
import { PhysicianApiService } from './physician-api.service';
import { PhysicianMapper } from '../utils/physician-mapper.util';
import { HeaderService } from '../../../../shared/services/header.service';
import { ApiService } from '../../../../shared/services/api.service';

describe('PhysicianService', () => {
  let service: PhysicianService;
  let physicianApiSpy: jasmine.SpyObj<PhysicianApiService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  const mockDto: any = { phyId: 'P1', lastName: 'Smith' };
  const mockModel: any = { physicianId: 'P1', lastName: 'Smith' };

  beforeEach(() => {
    physicianApiSpy = jasmine.createSpyObj('PhysicianApiService', [
      'searchPhysicians', 'getPhysicianById', 'createPhysician',
      'updatePhysician', 'deletePhysician',
    ]);
    headerSpy = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId']);
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        PhysicianService,
        { provide: PhysicianApiService, useValue: physicianApiSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(PhysicianService);
  });

  // -----------------------------------------------------------------------
  // getPhysicians
  // -----------------------------------------------------------------------
  describe('getPhysicians', () => {
    it('maps params and transforms response', (done) => {
      spyOn(PhysicianMapper, 'toModel').and.returnValue(mockModel);
      physicianApiSpy.searchPhysicians.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [mockDto],
        totalCount: 1,
      } as any));

      service.getPhysicians({
        searchText: 'Smith',
        effectiveDateFrom: '2024-01-01',
        effectiveDateTo: '2024-12-31',
        terminationDateFrom: '2024-06-01',
        terminationDateTo: '2024-06-30',
        sortColumn: 'FirstName',
        sortDirection: 'desc',
      }).subscribe(result => {
        expect(result.data).toEqual([mockModel]);
        expect(result.total).toBe(1);
        const req = physicianApiSpy.searchPhysicians.calls.mostRecent().args[0];
        expect(req.searchKeyword).toBe('Smith');
        expect(req.sortColumn).toBe('FirstName');
        expect(req.sortOrder).toBe('DESC');
        done();
      });
    });

    it('uses defaults when params are empty', (done) => {
      spyOn(PhysicianMapper, 'toModel').and.returnValue(mockModel);
      physicianApiSpy.searchPhysicians.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], totalCount: 0,
      } as any));

      service.getPhysicians().subscribe(() => {
        const req = physicianApiSpy.searchPhysicians.calls.mostRecent().args[0];
        expect(req.searchKeyword).toBeNull();
        expect(req.sortColumn).toBe('LastName');
        expect(req.sortOrder).toBe('ASC');
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getPhysicians (single result lookup)
  // -----------------------------------------------------------------------
  describe('getPhysicians single result', () => {
    it('passes search params and returns mapped results', (done) => {
      spyOn(PhysicianMapper, 'toModel').and.returnValue(mockModel);
      physicianApiSpy.searchPhysicians.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [mockDto],
        totalCount: 1,
      } as any));

      service.getPhysicians({ searchText: 'Smith' }).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0]).toEqual(mockModel);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // createPhysician
  // -----------------------------------------------------------------------
  describe('createPhysician', () => {
    it('maps request and response through PhysicianMapper', (done) => {
      const mockApiRequest: any = { firstName: 'John' };
      spyOn(PhysicianMapper, 'toCreateRequest').and.returnValue(mockApiRequest);
      spyOn(PhysicianMapper, 'toModel').and.returnValue(mockModel);
      physicianApiSpy.createPhysician.and.returnValue(of(mockDto));

      service.createPhysician({} as any).subscribe(result => {
        expect(result).toEqual(mockModel);
        expect(PhysicianMapper.toCreateRequest).toHaveBeenCalled();
        expect(physicianApiSpy.createPhysician).toHaveBeenCalledWith(mockApiRequest);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // updatePhysician
  // -----------------------------------------------------------------------
  describe('updatePhysician', () => {
    it('maps request and sends chapterId from request', (done) => {
      const mockApiRequest: any = { firstName: 'Jane' };
      spyOn(PhysicianMapper, 'toUpdateRequest').and.returnValue(mockApiRequest);
      spyOn(PhysicianMapper, 'toModel').and.returnValue(mockModel);
      physicianApiSpy.updatePhysician.and.returnValue(of(mockDto));

      service.updatePhysician('P1', { chapterId: 'CH1' } as any).subscribe(result => {
        expect(result).toEqual(mockModel);
        expect(physicianApiSpy.updatePhysician).toHaveBeenCalledWith('P1', 'CH1', mockApiRequest);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // deletePhysician
  // -----------------------------------------------------------------------
  describe('deletePhysician', () => {
    it('calls delete and maps to void', (done) => {
      physicianApiSpy.deletePhysician.and.returnValue(of(true as any));

      service.deletePhysician('P1', 'CH1').subscribe(result => {
        expect(result).toBeUndefined();
        expect(physicianApiSpy.deletePhysician).toHaveBeenCalledWith('P1', 'CH1');
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // getSpecialties
  // -----------------------------------------------------------------------
  describe('getSpecialties', () => {
    it('filters active items and maps to specialty model', (done) => {
      apiSpy.get.and.returnValue(of({
        success: true,
        data: [
          { code: 'SP1', description: 'Cardiology', isActive: true },
          { code: 'SP2', description: 'Inactive', isActive: false },
        ],
      }));

      service.getSpecialties().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ code: 'SP1', description: 'Cardiology', codeType: 'PHYSP' });
        done();
      });
    });

    it('returns empty array when response has no data', (done) => {
      apiSpy.get.and.returnValue(of({ success: false, data: null }));

      service.getSpecialties().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // lookupZipCode
  // -----------------------------------------------------------------------
  describe('lookupZipCode', () => {
    it('maps zip code results', (done) => {
      apiSpy.get.and.returnValue(of({
        success: true,
        data: [{ zip: '12345', city: 'Springfield', state: 'IL', uspsId: 'U1' }],
      }));

      service.lookupZipCode('12345').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].city).toBe('Springfield');
        expect(result[0].state).toBe('IL');
        done();
      });
    });

    it('returns empty array when no data', (done) => {
      apiSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.lookupZipCode('00000').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  // -----------------------------------------------------------------------
  // lookupZipCode
  // -----------------------------------------------------------------------
  describe('lookupZipCode', () => {
    it('returns mapped zip code results', (done) => {
      apiSpy.get.and.returnValue(of({
        success: true,
        data: [{ zip: '76102', city: 'Fort Worth', state: 'TX', uspsId: 123 }],
      }));

      service.lookupZipCode('76102').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].city).toBe('Fort Worth');
        done();
      });
    });
  });
});
