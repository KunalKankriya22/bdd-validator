import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ValidCatalogNumbersService } from './valid-catalog-numbers.service';
import { API } from '@core/constants/api.constants';
import {
  ValidCatalogDto,
  ValidCatalogQueryParams,
  CreateValidCatalogDto,
  UpdateValidCatalogDto,
  CatalogNumberDropdownDto,
  ManufacturerDropdownDto,
  BagTypeDropdownDto,
  AnticoagulantDropdownDto,
  AdditiveDropdownDto,
  ApiResponse,
} from '../models/valid-catalog-numbers.model';

describe('ValidCatalogNumbersService', () => {
  let service: ValidCatalogNumbersService;
  let httpMock: HttpTestingController;

  const mockCatalog: ValidCatalogDto = {
    catalogNumber: 'CAT001',
    manufacturerCode: 'MFR01',
    manufacturer: 'Test Manufacturer',
    totalBagsInSet: 3,
    numberOfProds: 2,
    bagType: 'Single',
    bagVolume: 450,
    weightOfBag: 50,
    collectionVolume: 500,
    anticoagulant: 'CPD',
    additiveSolution: 'AS-1',
    instSpecificCode: null,
    bagStorageRestriction: null,
    effDate: '2025-01-01',
    termDate: null,
  };

  const mockCatalog2: ValidCatalogDto = {
    catalogNumber: 'CAT002',
    manufacturerCode: 'MFR02',
    manufacturer: 'Another Manufacturer',
    totalBagsInSet: 4,
    numberOfProds: 3,
    bagType: 'Double',
    bagVolume: 300,
    weightOfBag: 40,
    collectionVolume: 350,
    anticoagulant: 'ACD-A',
    additiveSolution: null,
    instSpecificCode: 'ISC01',
    bagStorageRestriction: 'COLD',
    effDate: '2025-06-01',
    termDate: '2026-12-31',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ValidCatalogNumbersService],
    });

    service = TestBed.inject(ValidCatalogNumbersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getValidCatalogs', () => {
    it('should fetch valid catalogs with pagination and map response correctly', (done) => {
      const mockResponse: ApiResponse<ValidCatalogDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockCatalog, mockCatalog2],
        total: 2,
      };

      service.getValidCatalogs(10, 0).subscribe((result) => {
        expect(result.items.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        expect(result.items[0].catalogNumber).toBe('CAT001');
        expect(result.items[1].catalogNumber).toBe('CAT002');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.LIST(10, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should send query params in request body when provided', (done) => {
      const queryParams: ValidCatalogQueryParams = {
        catalogNumber: 'CAT001',
        manufacturerCode: 'MFR01',
        showTerminated: 'N',
        sortColumn: 'catalogNumber',
        sortOrder: 'ASC',
      };

      const mockResponse: ApiResponse<ValidCatalogDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockCatalog],
        total: 1,
      };

      service.getValidCatalogs(25, 50, queryParams).subscribe((result) => {
        expect(result.items.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.LIST(25, 50));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(queryParams);
      req.flush(mockResponse);
    });

    it('should return empty items array when response data is not an array', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null,
        total: 0,
      };

      service.getValidCatalogs(10, 0).subscribe((result) => {
        expect(result.items).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.LIST(10, 0));
      req.flush(mockResponse);
    });

    it('should default totalRecords to 0 when response total is undefined', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
      };

      service.getValidCatalogs(10, 0).subscribe((result) => {
        expect(result.items).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.LIST(10, 0));
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', (done) => {
      service.getValidCatalogs(10, 0).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.LIST(10, 0));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getValidCatalogById', () => {
    it('should fetch a valid catalog by ID and return first item when successful', (done) => {
      const mockResponse: ApiResponse<ValidCatalogDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockCatalog],
      };

      service.getValidCatalogById('CAT001').subscribe((result) => {
        expect(result).toBeTruthy();
        expect(result!.catalogNumber).toBe('CAT001');
        expect(result!.manufacturer).toBe('Test Manufacturer');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.GET_BY_ID('CAT001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when response success is false', (done) => {
      const mockResponse: ApiResponse<ValidCatalogDto> = {
        success: false,
        message: 'Not found',
        statusCode: 404,
        data: [],
      };

      service.getValidCatalogById('NONEXIST').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.GET_BY_ID('NONEXIST'));
      req.flush(mockResponse);
    });

    it('should return null when response data is empty array', (done) => {
      const mockResponse: ApiResponse<ValidCatalogDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
      };

      service.getValidCatalogById('EMPTY').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.GET_BY_ID('EMPTY'));
      req.flush(mockResponse);
    });

    it('should return null when response data is not an array', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null,
      };

      service.getValidCatalogById('NULL_DATA').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.GET_BY_ID('NULL_DATA'));
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', (done) => {
      service.getValidCatalogById('CAT001').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.GET_BY_ID('CAT001'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createValidCatalog', () => {
    it('should create a valid catalog number', (done) => {
      const createDto: CreateValidCatalogDto = {
        catalogNumber: 'CAT003',
        manufacturerCode: 'MFR01',
        totalBagsInSet: 2,
        numberOfProds: 1,
        bagType: 'Single',
        bagVolume: 450,
        weightOfBag: 50,
        collectionVolume: 500,
        anticoagulant: 'CPD',
        additiveSolution: null,
        instSpecificCode: null,
        bagStorageRestriction: null,
        effDate: '2025-01-01',
        termDate: null,
      };

      const mockResponse: ApiResponse<ValidCatalogDto> = {
        success: true,
        message: 'Created successfully',
        statusCode: 201,
        data: [{ ...mockCatalog, catalogNumber: 'CAT003' }],
      };

      service.createValidCatalog(createDto).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Created successfully');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors on create', (done) => {
      const createDto: CreateValidCatalogDto = {
        catalogNumber: 'CAT003',
        manufacturerCode: 'MFR01',
        totalBagsInSet: 2,
        numberOfProds: 1,
        bagType: 'Single',
        bagVolume: 450,
        weightOfBag: 50,
        collectionVolume: 500,
        anticoagulant: null,
        additiveSolution: null,
        instSpecificCode: null,
        bagStorageRestriction: null,
        effDate: '2025-01-01',
        termDate: null,
      };

      service.createValidCatalog(createDto).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.CREATE);
      expect(req.request.method).toBe('POST');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateValidCatalog', () => {
    it('should update a valid catalog number', (done) => {
      const updateDto: UpdateValidCatalogDto = {
        originalCatalogNumber: 'CAT001',
        catalogNumber: 'CAT001',
        manufacturerCode: 'MFR01',
        manufacturer: 'Updated Manufacturer',
        totalBagsInSet: 5,
        numberOfProds: 3,
        bagType: 'Triple',
        bagVolume: 600,
        weightOfBag: 70,
        collectionVolume: 650,
        anticoagulant: 'ACD-A',
        additiveSolution: 'AS-3',
        instSpecificCode: null,
        bagStorageRestriction: null,
        effDate: '2025-01-01',
        termDate: null,
      };

      const mockResponse: ApiResponse<ValidCatalogDto> = {
        success: true,
        message: 'Updated successfully',
        statusCode: 200,
        data: [{ ...mockCatalog, manufacturer: 'Updated Manufacturer' }],
      };

      service.updateValidCatalog('CAT001', updateDto).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Updated successfully');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.UPDATE('CAT001'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors on update', (done) => {
      const updateDto: UpdateValidCatalogDto = {
        originalCatalogNumber: 'CAT001',
        catalogNumber: 'CAT001',
        manufacturerCode: 'MFR01',
        manufacturer: 'Test',
        totalBagsInSet: 1,
        numberOfProds: 1,
        bagType: 'Single',
        bagVolume: null,
        weightOfBag: null,
        collectionVolume: null,
        anticoagulant: null,
        additiveSolution: null,
        instSpecificCode: null,
        bagStorageRestriction: null,
        effDate: '2025-01-01',
        termDate: null,
      };

      service.updateValidCatalog('CAT001', updateDto).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.UPDATE('CAT001'));
      expect(req.request.method).toBe('PUT');
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('getManufacturers', () => {
    it('should fetch manufacturer codes', (done) => {
      const mockManufacturers: ManufacturerDropdownDto[] = [
        { code: 'MFR01', description: 'Manufacturer 1' },
        { code: 'MFR02', description: 'Manufacturer 2' },
      ];

      service.getManufacturers().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('MFR01');
        expect(result[1].description).toBe('Manufacturer 2');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.MANUFACTURERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockManufacturers);
    });

    it('should propagate HTTP errors', (done) => {
      service.getManufacturers().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.MANUFACTURERS);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getBagTypes', () => {
    it('should fetch bag types', (done) => {
      const mockBagTypes: BagTypeDropdownDto[] = [
        { code: 'SGL', description: 'Single' },
        { code: 'DBL', description: 'Double' },
        { code: 'TRP', description: 'Triple' },
      ];

      service.getBagTypes().subscribe((result) => {
        expect(result.length).toBe(3);
        expect(result[0].code).toBe('SGL');
        expect(result[2].description).toBe('Triple');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.BAG_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockBagTypes);
    });

    it('should propagate HTTP errors', (done) => {
      service.getBagTypes().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.BAG_TYPES);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAnticoagulants', () => {
    it('should fetch anticoagulants', (done) => {
      const mockAnticoagulants: AnticoagulantDropdownDto[] = [
        { code: 'CPD', description: 'Citrate Phosphate Dextrose' },
        { code: 'ACD-A', description: 'Acid Citrate Dextrose A' },
      ];

      service.getAnticoagulants().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('CPD');
        expect(result[1].code).toBe('ACD-A');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.ANTICOAGULANTS);
      expect(req.request.method).toBe('GET');
      req.flush(mockAnticoagulants);
    });

    it('should propagate HTTP errors', (done) => {
      service.getAnticoagulants().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.ANTICOAGULANTS);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAdditives', () => {
    it('should fetch additives', (done) => {
      const mockAdditives: AdditiveDropdownDto[] = [
        { code: 'AS-1', description: 'Additive Solution 1' },
        { code: 'AS-3', description: 'Additive Solution 3' },
      ];

      service.getAdditives().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('AS-1');
        expect(result[1].description).toBe('Additive Solution 3');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.ADDITIVES);
      expect(req.request.method).toBe('GET');
      req.flush(mockAdditives);
    });

    it('should propagate HTTP errors', (done) => {
      service.getAdditives().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.ADDITIVES);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getFilterCatalogNumbers', () => {
    it('should fetch filter catalog numbers', (done) => {
      const mockCatalogNumbers: CatalogNumberDropdownDto[] = [
        { code: 'CAT001', description: 'Catalog 001' },
        { code: 'CAT002', description: 'Catalog 002' },
      ];

      service.getFilterCatalogNumbers().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('CAT001');
        expect(result[1].code).toBe('CAT002');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.FILTER.CATALOG_NUMBERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockCatalogNumbers);
    });

    it('should handle empty filter catalog numbers', (done) => {
      service.getFilterCatalogNumbers().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.FILTER.CATALOG_NUMBERS);
      req.flush([]);
    });

    it('should propagate HTTP errors', (done) => {
      service.getFilterCatalogNumbers().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.FILTER.CATALOG_NUMBERS);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getFilterManufacturers', () => {
    it('should fetch filter manufacturers', (done) => {
      const mockManufacturers: ManufacturerDropdownDto[] = [
        { code: 'MFR01', description: 'Filter Manufacturer 1' },
        { code: 'MFR02', description: 'Filter Manufacturer 2' },
      ];

      service.getFilterManufacturers().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('MFR01');
        expect(result[1].description).toBe('Filter Manufacturer 2');
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.FILTER.MANUFACTURERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockManufacturers);
    });

    it('should handle empty filter manufacturers', (done) => {
      service.getFilterManufacturers().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.FILTER.MANUFACTURERS);
      req.flush([]);
    });

    it('should propagate HTTP errors', (done) => {
      service.getFilterManufacturers().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(API.VALID_CATALOG_NUMBERS.FILTER.MANUFACTURERS);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
