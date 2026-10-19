import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CryoMethodsService } from './cryo-methods.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CryoMethodDto,
  CryoMethodQueryParamsDto,
  CreateCryoMethodRequestDto,
  UpdateCryoMethodRequestDto
} from '../models/cryo-methods.model';

describe('CryoMethodsService', () => {
  let service: CryoMethodsService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  const mockCryoMethodDto: CryoMethodDto = {
    thawMethod: 'Bath',
    methodDesc: 'Water Bath Method',
    minTemp: 1.00,
    maxTemp: 6.00,
    minWsFreezeTime: 0.01,
    maxWsFreezeTime: 6.00,
    minSepFreezeTime: 0.10,
    maxSepFreezeTime: 0.55,
    effDate: '2024-01-01',
    termDate: null,
    lastModifiedDate: '2024-01-15'
  };

  const mockSuccessResponse = {
    success: true,
    message: 'Operation successful',
    data: [mockCryoMethodDto],
    totalCount: 1
  };

  const mockErrorResponse = {
    success: false,
    message: 'Operation failed',
    errorResponse: {
      errorCode: 'ERR001',
      error: 'Validation failed'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CryoMethodsService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CryoMethodsService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCryoMethods', () => {
    it('should retrieve cryo methods with pagination', (done) => {
      const take = 25;
      const skip = 0;
      const params: CryoMethodQueryParamsDto = {};

      service.getCryoMethods(take, skip, params).subscribe({
        next: (response) => {
          expect(response.data).toEqual([mockCryoMethodDto]);
          expect(response.totalRecords).toBe(1);
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.LIST(take, skip);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl) && request.method === 'POST'
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockSuccessResponse);
    });

    it('should handle filtering by thawMethod', (done) => {
      const take = 25;
      const skip = 0;
      const params: CryoMethodQueryParamsDto = { thawMethod: 'Bath' };

      service.getCryoMethods(take, skip, params).subscribe({
        next: (response) => {
          expect(response.data.length).toBe(1);
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.LIST(take, skip);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      expect(req.request.body).toEqual(params);
      req.flush(mockSuccessResponse);
    });

    it('should handle sorting parameters', (done) => {
      const take = 25;
      const skip = 0;
      const params: CryoMethodQueryParamsDto = {
        sortColumn: 'ThawMethod',
        sortOrder: 'ASC'
      };

      service.getCryoMethods(take, skip, params).subscribe({
        next: (response) => {
          expect(response.data).toBeDefined();
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.LIST(take, skip);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      expect(req.request.body.sortColumn).toBe('ThawMethod');
      expect(req.request.body.sortOrder).toBe('ASC');
      req.flush(mockSuccessResponse);
    });


    it('should use total field as fallback for totalRecords', (done) => {
      const take = 25;
      const skip = 0;
      const responseWithTotal = {
        success: true,
        data: [mockCryoMethodDto],
        total: 1 // Using 'total' instead of 'totalCount'
      };

      service.getCryoMethods(take, skip, {}).subscribe({
        next: (response) => {
          expect(response.totalRecords).toBe(1);
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.LIST(take, skip);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      req.flush(responseWithTotal);
    });


  });

  describe('getCryoMethodById', () => {
    it('should retrieve a single cryo method by thawMethod', (done) => {
      const thawMethod = 'Bath';

      service.getCryoMethodById(thawMethod).subscribe({
        next: (response) => {
          expect(response).toEqual(mockCryoMethodDto);
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.GET_BY_ID(thawMethod);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl) && request.method === 'GET'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockSuccessResponse);
    });



    it('should return first item when multiple items are returned', (done) => {
      const thawMethod = 'Bath';
      const multipleResponse = {
        success: true,
        data: [mockCryoMethodDto, { ...mockCryoMethodDto, thawMethod: 'Other' }]
      };

      service.getCryoMethodById(thawMethod).subscribe({
        next: (response) => {
          expect(response).toEqual(mockCryoMethodDto);
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.GET_BY_ID(thawMethod);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      req.flush(multipleResponse);
    });
  });

  describe('createCryoMethod', () => {
    const createDto: CreateCryoMethodRequestDto = {
      thawMethod: 'Test',
      methodDesc: 'Test Method',
      minTemp: 1.0,
      maxTemp: 6.0,
      minWsFreezeTime: 0.01,
      maxWsFreezeTime: 6.0,
      minSepFreezeTime: 0.1,
      maxSepFreezeTime: 0.55,
      effDate: '2024-01-01',
      termDate: null
    };

    it('should create a new cryo method', (done) => {
      service.createCryoMethod(createDto).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.message).toBe('Operation successful');
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.CREATE;
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl) && request.method === 'POST'
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockSuccessResponse);
    });

    it('should handle successful creation with termination date', (done) => {
      const dtoWithTermDate = { ...createDto, termDate: '2024-12-31' };

      service.createCryoMethod(dtoWithTermDate).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.CREATE;
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      expect(req.request.body.termDate).toBe('2024-12-31');
      req.flush(mockSuccessResponse);
    });


    it('should handle server errors', (done) => {
      service.createCryoMethod(createDto).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.CREATE;
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle duplicate key errors', (done) => {
      const duplicateError = {
        success: false,
        errorResponse: {
          errorCode: '5220',
          error: 'Thaw Method already exists'
        }
      };

      service.createCryoMethod(createDto).subscribe({
        error: (error) => {
          expect(error.error.errorResponse.errorCode).toBe('5220');
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.CREATE;
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      req.flush(duplicateError, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateCryoMethod', () => {
    const thawMethod = 'Bath';
    const updateDto: UpdateCryoMethodRequestDto = {
      methodDesc: 'Updated Description',
      minTemp: 2.0,
      maxTemp: 8.0,
      minWsFreezeTime: 0.5,
      maxWsFreezeTime: 8.0,
      minSepFreezeTime: 0.2,
      maxSepFreezeTime: 1.0,
      effDate: '2024-01-01',
      termDate: null
    };

    it('should update an existing cryo method', (done) => {
      service.updateCryoMethod(thawMethod, updateDto).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.message).toBe('Operation successful');
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.UPDATE(thawMethod);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl) && request.method === 'PUT'
      );

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockSuccessResponse);
    });

    it('should handle updating with termination date', (done) => {
      const dtoWithTermDate = { ...updateDto, termDate: '2024-12-31' };

      service.updateCryoMethod(thawMethod, dtoWithTermDate).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.UPDATE(thawMethod);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      expect(req.request.body.termDate).toBe('2024-12-31');
      req.flush(mockSuccessResponse);
    });

    it('should handle not found errors', (done) => {
      service.updateCryoMethod('NonExistent', updateDto).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.UPDATE('NonExistent');
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });


    it('should handle temperature range validation errors', (done) => {
      const rangeError = {
        success: false,
        errorResponse: {
          errorCode: '5230',
          error: 'Minimum temp cannot be greater than maximum temp'
        }
      };

      service.updateCryoMethod(thawMethod, updateDto).subscribe({
        error: (error) => {
          expect(error.error.errorResponse.errorCode).toBe('5230');
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.UPDATE(thawMethod);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      req.flush(rangeError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('deleteCryoMethod', () => {
    it('should delete (soft delete) a cryo method', (done) => {
      const thawMethod = 'Bath';

      service.deleteCryoMethod(thawMethod).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.message).toBe('Operation successful');
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.DELETE(thawMethod);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl) && request.method === 'DELETE'
      );

      expect(req.request.method).toBe('DELETE');
      req.flush(mockSuccessResponse);
    });

    it('should handle not found errors on delete', (done) => {
      const thawMethod = 'NonExistent';

      service.deleteCryoMethod(thawMethod).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.DELETE(thawMethod);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle server errors on delete', (done) => {
      const thawMethod = 'Bath';

      service.deleteCryoMethod(thawMethod).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const expectedUrl = API.CRYO_METHODS.DELETE(thawMethod);
      const req = httpMock.expectOne((request) =>
        request.url.includes(expectedUrl)
      );

      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

});
