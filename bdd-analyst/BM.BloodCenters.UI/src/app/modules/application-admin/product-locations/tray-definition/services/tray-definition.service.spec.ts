import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TrayDefinitionService } from './tray-definition.service';
import {
  TrayDto,
  CreateTrayRequestDto,
  UpdateTrayRequestDto,
  TrayQueryDto,
  TrayStatusLovDto,
  ApiResponse
} from '../models/tray-definition.model';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';

describe('TrayDefinitionService', () => {
  let service: TrayDefinitionService;
  let httpMock: HttpTestingController;
  let baseUrl: string;

  const mockTrayDto: TrayDto = {
    chapterId: '0001',
    trayNumber: '1234',
    trayDescription: 'Test Tray',
    itemCount: 10,
    trayStatus: 'IN',
    productType: 'RBC',
    effectiveDate: new Date('2024-01-01'),
    termDate: null,
    lastModifiedDate: new Date('2024-01-01T10:00:00Z')
  };

  const mockStatusLov: TrayStatusLovDto[] = [
    { code: 'IN', description: 'In Stock' },
    { code: 'OU', description: 'Out of Stock' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TrayDefinitionService]
    });

    service = TestBed.inject(TrayDefinitionService);
    httpMock = TestBed.inject(HttpTestingController);
    baseUrl = `${environment.apiUrl}${API.TRAY_DEFINITION.BASE}`;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAllTrays', () => {
    it('should retrieve all trays with pagination', () => {
      const take = 25;
      const skip = 0;
      const mockResponse: ApiResponse<TrayDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockTrayDto],
        total: 1
      };

      service.getAllTrays(take, skip).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        expect(result.data[0]).toEqual(mockTrayDto);
      });

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should apply filters when provided', () => {
      const take = 25;
      const skip = 0;
      const filters: TrayQueryDto = {
        trayStatus: 'IN',
        searchKeyword: 'test'
      };
      const mockResponse: ApiResponse<TrayDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockTrayDto],
        total: 1
      };

      service.getAllTrays(take, skip, filters).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.body).toEqual(filters);
      req.flush(mockResponse);
    });

    it('should return empty data when response data is missing', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: null, total: 0 };

      service.getAllTrays(25, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      req.flush(mockResponse);
    });

    it('should propagate error from API', () => {
      service.getAllTrays(25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle client-side ErrorEvent in handleError', () => {
      service.getAllTrays(25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Network connection failed');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      req.error(new ErrorEvent('network', { message: 'Network connection failed' }));
    });

    it('should use error.error.message when errorResponse is absent', () => {
      service.getAllTrays(25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Custom body message');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      req.flush(
        { message: 'Custom body message' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should fall back to HttpErrorResponse message when error body is null', () => {
      service.getAllTrays(25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBeDefined();
          expect(typeof error.message).toBe('string');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/25/0`);
      req.flush(null, { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('getTrayById', () => {
    it('should retrieve a single tray by ID', () => {
      const chapterId = '0001';
      const trayNumber = '1234';
      const mockResponse: ApiResponse<TrayDto> = {
        success: true,
        statusCode: 200,
        message: 'Record retrieved successfully',
        data: mockTrayDto
      };

      service.getTrayById(chapterId, trayNumber).subscribe(result => {
        expect(result).toEqual(mockTrayDto);
      });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${trayNumber}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate error when getTrayById fails', () => {
      const chapterId = '0001';
      const trayNumber = 'XXXX';

      service.getTrayById(chapterId, trayNumber).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${trayNumber}`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

  });

  describe('getTrayStatusLov', () => {
    it('should retrieve tray status options', () => {
      const mockResponse: ApiResponse<TrayStatusLovDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Tray status list retrieved successfully',
        data: mockStatusLov
      };

      service.getTrayStatusLov().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result).toEqual(mockStatusLov);
      });

      const req = httpMock.expectOne(`${baseUrl}/tray-status-lov`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when response data is not an array', () => {
      const mockResponse = { data: null, total: 0 };

      service.getTrayStatusLov().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/tray-status-lov`);
      req.flush(mockResponse);
    });

    it('should return empty array when response data is an object (not array)', () => {
      const mockResponse = { data: { code: 'IN', description: 'In Stock' }, total: 1 };

      service.getTrayStatusLov().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/tray-status-lov`);
      req.flush(mockResponse);
    });

    it('should propagate error when getTrayStatusLov fails', () => {
      service.getTrayStatusLov().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/tray-status-lov`);
      req.flush({ message: 'Internal error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('createTray', () => {
    it('should create a new tray', () => {
      const payload: CreateTrayRequestDto = {
        trayNumber: '1234',
        trayDescription: 'New Tray',
        itemCount: 0,
        trayStatus: 'IN',
        effectiveDate: '2024-06-01'
      };
      const mockResponse: ApiResponse<{ chapterId: string; trayNumber: string }> = {
        success: true,
        statusCode: 201,
        message: 'Tray created successfully',
        data: { chapterId: '0001', trayNumber: '1234' }
      };

      service.createTray(payload).subscribe(result => {
        expect(result.chapterId).toBe('0001');
        expect(result.trayNumber).toBe('1234');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should handle duplicate tray number error (0319)', () => {
      const payload: CreateTrayRequestDto = {
        trayNumber: '1234',
        trayDescription: 'Duplicate Tray',
        trayStatus: 'IN',
        effectiveDate: '2024-06-01'
      };
      const errorResponse = {
        success: false,
        statusCode: 400,
        errorCode: '0319',
        errorResponse: {
          errorCode: '0319',
          error: 'Tray number already exists'
        }
      };

      service.createTray(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.errorCode).toBe('0319');
          expect(error.message).toContain('Tray number already exists');
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle invalid tray status error (0365)', () => {
      const payload: CreateTrayRequestDto = {
        trayNumber: '1234',
        trayDescription: 'Test Tray',
        trayStatus: 'XX',
        effectiveDate: '2024-06-01'
      };
      const errorResponse = {
        success: false,
        statusCode: 400,
        errorCode: '0365',
        errorResponse: {
          errorCode: '0365',
          error: 'Invalid tray status code'
        }
      };

      service.createTray(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.errorCode).toBe('0365');
          expect(error.message).toContain('Invalid tray status code');
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTray', () => {
    it('should update an existing tray', () => {
      const chapterId = '0001';
      const trayNumber = '1234';
      const payload: UpdateTrayRequestDto = {
        trayDescription: 'Updated Tray',
        itemCount: 20,
        trayStatus: 'OU',
        effectiveDate: '2024-01-01',
        termDate: '2024-12-31'
      };
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Tray updated successfully',
        data: undefined as any
      };

      service.updateTray(chapterId, trayNumber, payload).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${trayNumber}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should propagate error when updateTray fails', () => {
      const chapterId = '0001';
      const trayNumber = '1234';
      const payload: UpdateTrayRequestDto = {
        trayDescription: 'Test',
        trayStatus: 'IN',
        effectiveDate: '2024-01-01'
      };

      service.updateTray(chapterId, trayNumber, payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${trayNumber}`);
      req.flush({ message: 'Update failed' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('deleteTray', () => {
    it('should soft delete a tray', () => {
      const chapterId = '0001';
      const trayNumber = '1234';
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Tray deleted successfully',
        data: undefined as any
      };

      service.deleteTray(chapterId, trayNumber).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${trayNumber}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should propagate error when deleteTray fails', () => {
      const chapterId = '0001';
      const trayNumber = '1234';

      service.deleteTray(chapterId, trayNumber).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${trayNumber}`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });
  });
});
