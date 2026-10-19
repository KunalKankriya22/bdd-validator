import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TerritoryService } from './territory.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { of } from 'rxjs';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('TerritoryService', () => {
  let service: TerritoryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    headerServiceSpy = createMockHeaderService();
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    // Mock return values
    loginServiceSpy.getStoredUsername.and.returnValue('TESTUSER');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TerritoryService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy }
      ]
    });

    service = TestBed.inject(TerritoryService);
  });

  describe('getTerritories', () => {
    it('should call POST with correct endpoint', () => {
      const mockResponse = {
        data: [{ territoryId: 'TERRY001', territoryShortName: 'TEST' }],
        total: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getTerritories(25, 0, {}).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/territories/search-sort-filter/25/0',
        {}
      );
    });

  });

  describe('addTerritory', () => {
    it('should call POST with correct endpoint and payload', () => {
      const payload = {
        territoryShortName: 'TEST',
        territoryName: 'Test Territory',
        territoryGroup: null,
        territoryType: 'TRTMR',
        effDate: '2025-01-01',
        termDate: null,
        comments: null
      };
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.addTerritory(payload).subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/territories',
        payload
      );
    });
  });

  describe('updateTerritory', () => {
    it('should call PUT with correct endpoint', () => {
      const payload = {
        territoryId: 'TERRY001',
        originalTerritoryShortName: 'TEST',
        territoryShortName: 'TEST2',
        territoryName: 'Test Territory Updated',
        territoryGroup: null,
        territoryType: 'TRTMR',
        effDate: '2025-01-01',
        termDate: null,
        comments: null
      };
      apiServiceSpy.put.and.returnValue(of({ success: true }));

      service.updateTerritory(payload).subscribe();

      expect(apiServiceSpy.put).toHaveBeenCalledWith(
        '/api/v1/territories',
        payload
      );
    });
  });

  describe('getFilterOptions', () => {
    it('should call GET and return groups and types', () => {
      const mockResponse = {
        data: {
          groups: [{ code: 'CCOLL', description: 'Collection' }],
          types: [{ code: 'TRTMR', description: 'Territory' }]
        }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFilterOptions().subscribe(result => {
        expect(result.groups.length).toBe(1);
        expect(result.types.length).toBe(1);
        expect(result.groups[0].code).toBe('CCOLL');
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/territories/filter-options'
      );
    });

  });
});
