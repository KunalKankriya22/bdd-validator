import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContainerService } from './container.service';
import { API } from '@core/constants/api.constants';

describe('ContainerService', () => {
  let service: ContainerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContainerService],
    });
    service = TestBed.inject(ContainerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getContainers', () => {
    const catalogNumber = 'BASE-001';
    const take = 10;
    const skip = 0;

    it('should POST to the correct URL and map response to paginated format', (done) => {
      const mockResponse = {
        data: [{ catalogNumber: 'C-001' }, { catalogNumber: 'C-002' }],
        total: 2,
      };

      service.getContainers(catalogNumber, take, skip).subscribe((result) => {
        expect(result.items).toEqual(mockResponse.data);
        expect(result.totalRecords).toBe(2);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.LIST(take, skip));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should build default body when no queryParams provided', (done) => {
      const mockResponse = { data: [], total: 0 };

      service.getContainers(catalogNumber, take, skip).subscribe(() => done());

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.LIST(take, skip));
      expect(req.request.body).toEqual({
        catalogNumber: '',
        baseCatalogNo: catalogNumber,
        showTerminated: null,
        searchKeyword: '',
        sortColumn: '',
        sortOrder: '',
      });
      req.flush(mockResponse);
    });

    it('should pass queryParams into the request body', (done) => {
      const queryParams = {
        catalogNumber: 'C-FILTER',
        showTerminated: true,
        searchKeyword: 'test',
        sortColumn: 'catalogNumber',
        sortOrder: 'asc',
      };
      const mockResponse = { data: [], total: 0 };

      service.getContainers(catalogNumber, take, skip, queryParams).subscribe(() => done());

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.LIST(take, skip));
      expect(req.request.body).toEqual({
        catalogNumber: 'C-FILTER',
        baseCatalogNo: catalogNumber,
        showTerminated: true,
        searchKeyword: 'test',
        sortColumn: 'catalogNumber',
        sortOrder: 'asc',
      });
      req.flush(mockResponse);
    });

    it('should return empty items array when response.data is not an array', (done) => {
      const mockResponse = { data: null, total: 5 };

      service.getContainers(catalogNumber, take, skip).subscribe((result) => {
        expect(result.items).toEqual([]);
        expect(result.totalRecords).toBe(5);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.LIST(take, skip));
      req.flush(mockResponse);
    });

    it('should default totalRecords to 0 when response.total is undefined', (done) => {
      const mockResponse = { data: [] };

      service.getContainers(catalogNumber, take, skip).subscribe((result) => {
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.LIST(take, skip));
      req.flush(mockResponse);
    });
  });

  describe('createContainer', () => {
    it('should POST to the create endpoint with the provided data', (done) => {
      const createData = { catalogNumber: 'NEW-001', productType: 'Whole Blood' } as any;
      const mockResponse = { data: { catalogNumber: 'NEW-001' }, success: true };

      service.createContainer(createData).subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createData);
      req.flush(mockResponse);
    });
  });

  describe('updateContainer', () => {
    it('should PUT to the update endpoint with catalogNumber in URL', (done) => {
      const catalogNumber = 'UPD-001';
      const updateData = { productType: 'Platelets' } as any;
      const mockResponse = { data: { catalogNumber: 'UPD-001' }, success: true };

      service.updateContainer(catalogNumber, updateData).subscribe((result) => {
        expect(result).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.UPDATE(catalogNumber));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });
  });

  describe('getProductTypes', () => {
    it('should GET from the product types endpoint', (done) => {
      const mockTypes = [
        { id: 1, name: 'Whole Blood' },
        { id: 2, name: 'Platelets' },
      ];

      service.getProductTypes().subscribe((result) => {
        expect(result).toEqual(mockTypes as any);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.PRODUCT_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockTypes);
    });
  });

  describe('getContainerIds', () => {
    it('should GET from the container IDs endpoint', (done) => {
      const mockIds = [
        { id: 'CNT-01', description: 'Container A' },
        { id: 'CNT-02', description: 'Container B' },
      ];

      service.getContainerIds().subscribe((result) => {
        expect(result).toEqual(mockIds as any);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.CONTAINER_IDS);
      expect(req.request.method).toBe('GET');
      req.flush(mockIds);
    });
  });

  describe('getFilterCatalogNumbers', () => {
    it('should GET from the filter catalog numbers endpoint with baseCatalogNo', (done) => {
      const baseCatalogNo = 'BASE-100';
      const mockNumbers = [{ id: 'CAT-001' }, { id: 'CAT-002' }];

      service.getFilterCatalogNumbers(baseCatalogNo).subscribe((result) => {
        expect(result).toEqual(mockNumbers as any);
        done();
      });

      const req = httpMock.expectOne(
        API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.FILTER.CATALOG_NUMBERS(baseCatalogNo),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockNumbers);
    });

    it('should propagate HTTP errors', (done) => {
      spyOn(console, 'error');
      const baseCatalogNo = 'BAD-REQ';

      service.getFilterCatalogNumbers(baseCatalogNo).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(
        API.VALID_CATALOG_NUMBERS.CATALOG_DETAIL.FILTER.CATALOG_NUMBERS(baseCatalogNo),
      );
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });
});
