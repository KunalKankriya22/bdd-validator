import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  DonorInterdictionsService,
  DonorInterdiction,
  DonorInterdictionSearchParams,
  InterdictionDropdownDto,
  InterdictionLookupsResult,
  mapDonorInterdictionFromApi,
} from './donor-interdictions';

import { ApiService } from '../../../../shared/services/api.service';

// ─── Suite: DonorInterdictionsService ─────────────────────────────────────────

describe('DonorInterdictionsService', () => {
  let service: DonorInterdictionsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        DonorInterdictionsService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service       = TestBed.inject(DonorInterdictionsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ─── getAll ───────────────────────────────────────────────────────────────

  it('should get all donor interdictions and map from API response', () => {
    const apiResponse = [
      { Code: 'ADH', INTER_TYPE: 'CAUTN', INTER_OWNER: 'Donor' },
    ];
    apiServiceSpy.get.and.returnValue(of(apiResponse));

    service.getAll().subscribe(result => {
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('ADH');
      expect(result[0].type).toBe('CAUTN');
      expect(result[0].owner).toBe('Donor');
    });

    expect(apiServiceSpy.get).toHaveBeenCalledWith('api/v1/donor-interdictions');
  });


  // ─── getByCode ────────────────────────────────────────────────────────────

  it('should get donor interdiction by code', () => {
    const apiResponse = { Code: 'ADH', INTER_TYPE: 'CAUTN', INTER_OWNER: 'Donor' };
    apiServiceSpy.get.and.returnValue(of(apiResponse));

    service.getByCode('ADH').subscribe(result => {
      expect(result.code).toBe('ADH');
      expect(result.type).toBe('CAUTN');
      expect(result.owner).toBe('Donor');
    });

    expect(apiServiceSpy.get).toHaveBeenCalledWith('api/v1/donor-interdictions/ADH');
  });


  // ─── searchSortFilter ─────────────────────────────────────────────────────

  it('should search, sort and filter donor interdictions', () => {
    const params: DonorInterdictionSearchParams = {
      owner: 'Donor',
      sortBy: 'code',
      sortDirection: 'ASC',
    };
    const apiResponse = {
      Success: true,
      StatusCode: 200,
      Data: [{ Code: 'ADH', INTER_TYPE: 'CAUTN', INTER_OWNER: 'Donor' }],
      Total: 1,
    };
    apiServiceSpy.post.and.returnValue(of(apiResponse));

    service.searchSortFilter(10, 0, params).subscribe(result => {
      expect(result.success).toBeTrue();
      expect(result.statusCode).toBe(200);
      expect(result.total).toBe(1);
      expect(result.data[0].code).toBe('ADH');
    });

    expect(apiServiceSpy.post).toHaveBeenCalledWith(
      'api/v1/donor-interdictions/search-sort-filter/10/0',
      params
    );
  });

  it('should compute skip as pageIndex * pageSize', () => {
    const apiResponse = { Success: true, StatusCode: 200, Data: [], Total: 0 };
    apiServiceSpy.post.and.returnValue(of(apiResponse));

    service.searchSortFilter(25, 50, {}).subscribe();

    expect(apiServiceSpy.post).toHaveBeenCalledWith(
      'api/v1/donor-interdictions/search-sort-filter/25/50',
      {}
    );
  });

  it('should map multiple rows in searchSortFilter response', () => {
    const apiResponse = {
      Success: true,
      StatusCode: 200,
      Data: [
        { Code: 'ADH', INTER_TYPE: 'CAUTN', INTER_OWNER: 'Donor' },
        { code: 'XYZ', type: 'EXCL', owner: 'U', effectiveDate: '2025-06-01' },
      ],
      Total: 2,
    };
    apiServiceSpy.post.and.returnValue(of(apiResponse));

    service.searchSortFilter(10, 0, {}).subscribe(result => {
      expect(result.data.length).toBe(2);
      expect(result.data[0].code).toBe('ADH');
      expect(result.data[1].code).toBe('XYZ');
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  it('should create donor interdiction via POST', () => {
    const payload: DonorInterdiction = {
      code: 'NEW',
      type: 'TEMP',
      owner: 'Donor',
      effectiveDate: '2025-01-01',
    };
    apiServiceSpy.post.and.returnValue(of('SUCCESS'));

    service.create(payload).subscribe(result => {
      expect(result).toBe('SUCCESS');
    });

    expect(apiServiceSpy.post).toHaveBeenCalledWith(
      'api/v1/donor-interdictions/save-donor-interdiction',
      payload,
      { responseType: 'text' as 'json' }
    );
  });

  // ─── update ───────────────────────────────────────────────────────────────

  it('should update donor interdiction via PUT', () => {
    const payload: DonorInterdiction = {
      code: 'ADH',
      type: 'CAUTN',
      owner: 'Donor',
      effectiveDate: '2025-01-01',
    };
    apiServiceSpy.put.and.returnValue(of('UPDATED'));

    service.update(payload).subscribe(result => {
      expect(result).toBe('UPDATED');
    });

    expect(apiServiceSpy.put).toHaveBeenCalledWith(
      'api/v1/donor-interdictions/update-donor-interdiction',
      payload,
      { responseType: 'text' as 'json' }
    );
  });

  // ─── getLookups ───────────────────────────────────────────────────────────

  it('should call getLookups endpoint', () => {
    const apiResponse = {
      interTypes: [
        { code: 'CAUTN', codeType: 'INTER', description: 'Caution' },
      ],
      periodTypes: [
        { code: 'P', codeType: 'PERIOD', description: 'Permanent' },
      ],
      labFlags: [
        { code: 'A', codeType: 'LBHLD', description: 'Discard all' },
      ],
      viewLimit: 3,
    };
    apiServiceSpy.get.and.returnValue(of(apiResponse));

    service.getLookups().subscribe(result => {
      expect(result.dropdowns.typeItems.length).toBe(1);
      expect(result.dropdowns.typeItems[0].code).toBe('CAUTN');
      expect(result.dropdowns.types).toEqual(['CAUTN']);
      expect(result.dropdowns.periodItems.length).toBe(1);
      expect(result.dropdowns.periods).toEqual(['P']);
      expect(result.dropdowns.viewLimit).toBe(3);
      expect(result.labFlags.length).toBe(1);
      expect(result.labFlags[0].code).toBe('A');
    });

    expect(apiServiceSpy.get).toHaveBeenCalledWith('api/v1/donor-interdictions/lookups');
  });

  it('should return empty arrays when getLookups response has no items', () => {
    apiServiceSpy.get.and.returnValue(of({}));

    service.getLookups().subscribe(result => {
      expect(result.dropdowns.typeItems).toEqual([]);
      expect(result.dropdowns.types).toEqual([]);
      expect(result.dropdowns.periodItems).toEqual([]);
      expect(result.dropdowns.periods).toEqual([]);
      expect(result.dropdowns.viewLimit).toBe(0);
      expect(result.labFlags).toEqual([]);
    });
  });

  it('should map multiple type items in getLookups', () => {
    const apiResponse = {
      interTypes: [
        { code: 'CAUTN', codeType: 'INTER', description: 'Caution' },
        { code: 'EXCL',  codeType: 'INTER', description: 'Exclusion' },
      ],
      periodTypes: [],
      labFlags: [],
      viewLimit: 5,
    };
    apiServiceSpy.get.and.returnValue(of(apiResponse));

    service.getLookups().subscribe(result => {
      expect(result.dropdowns.typeItems.length).toBe(2);
      expect(result.dropdowns.types).toEqual(['CAUTN', 'EXCL']);
      expect(result.dropdowns.viewLimit).toBe(5);
    });
  });
});

// ─── Suite: mapDonorInterdictionFromApi ───────────────────────────────────────

describe('mapDonorInterdictionFromApi', () => {
  it('should map PascalCase API response (Code, INTER_TYPE, INTER_OWNER)', () => {
    const api = { Code: 'ADH', INTER_TYPE: 'CAUTN', INTER_OWNER: 'Donor' };
    const result = mapDonorInterdictionFromApi(api);
    expect(result.code).toBe('ADH');
    expect(result.type).toBe('CAUTN');
    expect(result.owner).toBe('Donor');
  });

  it('should map camelCase API response', () => {
    const api = { code: 'XYZ', type: 'TEMP', owner: 'U', effectiveDate: '2025-01-01' };
    const result = mapDonorInterdictionFromApi(api);
    expect(result.code).toBe('XYZ');
    expect(result.type).toBe('TEMP');
    expect(result.owner).toBe('U');
    expect(result.effectiveDate).toBe('2025-01-01');
  });


  it('should map all optional numeric fields', () => {
    const api = { code: 'A', type: 'B', owner: 'D', effectiveDate: '2025-01-01', value: 10, minValue: 5, viewLevel: 2 };
    const result = mapDonorInterdictionFromApi(api);
    expect(result.value).toBe(10);
    expect(result.minValue).toBe(5);
    expect(result.viewLevel).toBe(2);
  });

  it('should map all flag fields', () => {
    const api = {
      code: 'A', type: 'B', owner: 'D', effectiveDate: '2025-01-01',
      deferral: 'Y', fixedPeriod: 'N', multipleFlag: 'Y',
      upgradeFlag: 'N', manualFlag: 'Y', labFlag: 'A',
      changeControlFlag: 'S',
    };
    const result = mapDonorInterdictionFromApi(api);
    expect(result.deferral).toBe('Y');
    expect(result.fixedPeriod).toBe('N');
    expect(result.multipleFlag).toBe('Y');
    expect(result.upgradeFlag).toBe('N');
    expect(result.manualFlag).toBe('Y');
    expect(result.labFlag).toBe('A');
    expect(result.changeControlFlag).toBe('S');
  });


  it('should prefer camelCase over PascalCase when both present', () => {
    const api = { code: 'LOWER', Code: 'UPPER', type: 'T', owner: 'D', effectiveDate: '2025-01-01' };
    const result = mapDonorInterdictionFromApi(api);
    expect(result.code).toBe('LOWER');
  });


  it('should return undefined for missing optional fields', () => {
    const api = { code: 'A', type: 'B', owner: 'D', effectiveDate: '2025-01-01' };
    const result = mapDonorInterdictionFromApi(api);
    expect(result.terminationDate).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.value).toBeUndefined();
    expect(result.labFlag).toBeUndefined();
  });
});
