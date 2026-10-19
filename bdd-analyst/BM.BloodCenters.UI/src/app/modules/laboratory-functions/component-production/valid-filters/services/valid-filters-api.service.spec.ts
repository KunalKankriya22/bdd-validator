import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ValidFiltersApiService } from './valid-filters-api.service';

describe('ValidFiltersApiService', () => {
  let service: ValidFiltersApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ValidFiltersApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ValidFiltersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getValidFilters', () => {
    it('should call POST with correct URL and payload', () => {
      const params = { vendorName: 'Pall', sortColumn: 'VendorName', sortOrder: 'ASC' as const };

      service.getValidFilters(25, 0, params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalCount).toBe(1);
      });

      const req = httpMock.expectOne('/api/v1/valid-filters/25/0');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.vendorName).toBe('Pall');
      expect(req.request.body.sortColumn).toBe('VendorName');

      req.flush({
        success: true,
        data: [{ vendorName: 'Pall Corporation', catalogNumber: 'PLX-100', productType: 'RBC', numberOfDays: 42, effDate: '2028-01-15T00:00:00Z' }],
        totalCount: 1
      });
    });
  });

  describe('createValidFilter', () => {
    it('should call POST with correct payload', () => {
      const dto = {
        vendorName: 'Pall',
        catalogNumber: 'PLX-100',
        productType: 'RBC',
        numberOfDays: 42,
        effDate: '2028-06-01'
      };

      service.createValidFilter(dto).subscribe(result => {
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne('/api/v1/valid-filters');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, statusCode: 201, data: dto });
    });
  });

  describe('updateValidFilter', () => {
    it('should call PUT without origProductType when not provided', () => {
      const dto = { vendorName: 'Pall', productType: 'RBC', numberOfDays: 35 };

      service.updateValidFilter('PLX-100', dto).subscribe(result => {
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne('/api/v1/valid-filters/PLX-100');
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, statusCode: 200, data: dto });
    });

    it('should append origProductType query param when provided', () => {
      const dto = { vendorName: 'Pall', productType: 'CFFP', numberOfDays: 35 };

      service.updateValidFilter('PLX-100', dto, 'RBC').subscribe(result => {
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne('/api/v1/valid-filters/PLX-100?origProductType=RBC');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.productType).toBe('CFFP');
      req.flush({ success: true, statusCode: 200, data: dto });
    });
  });

  describe('getFilterDropdown', () => {
    it('should call GET without search keyword', () => {
      service.getFilterDropdown().subscribe(result => {
        expect(result.manufacturerNames.length).toBe(1);
        expect(result.catalogs.length).toBe(1);
        expect(result.productTypes.length).toBe(1);
      });

      const req = httpMock.expectOne('/api/v1/valid-filters/filter-dropdown');
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: {
          manufacturerNames: [{ code: 'Pall', description: 'Pall' }],
          catalogs: [{ code: 'PLX-100', description: 'PLX-100' }],
          productTypes: [{ code: 'RBC', description: 'Red Blood Cells' }]
        }
      });
    });
  });

  describe('getAddDropdown', () => {
    it('should call GET and return add dropdown values', () => {
      service.getAddDropdown().subscribe(result => {
        expect(result.catalogs.length).toBe(1);
        expect(result.productTypes.length).toBe(1);
      });

      const req = httpMock.expectOne('/api/v1/valid-filters/add-dropdown');
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: {
          catalogs: [{ vendorName: 'Pall', catalogNumber: 'PLX-100', description: 'Filter Set' }],
          productTypes: [{ code: 'RBC', description: 'Red Blood Cells' }]
        }
      });
    });
  });
});
