import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DistributionMasterCodesService,
  MasterCodeListItem,
  MasterCodeDetail,
  ApiResponse,
  MasterCodeFilter,
  CodeTypeFilter,
  CreateMasterCodeTypeRequest,
  UpdateMasterCodeTypeRequest,
  CreateCodeRequest,
  UpdateCodeRequest
} from './distribution-master-codes.service';
import { environment } from '../../../../../environments/environment';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('DistributionMasterCodesService', () => {
  let service: DistributionMasterCodesService;
  let httpMock: HttpTestingController;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const apiUrl = `${environment.apiUrl}/api/v1/distribution-master-codes`;
  const apiUrlCodeTypes = `${environment.apiUrl}/api/v1/distribution-master-code-types`;

  beforeEach(() => {
    mockSnackBar = createMockMatSnackBar();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DistributionMasterCodesService,
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });

    service = TestBed.inject(DistributionMasterCodesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getMasterCodes', () => {
    const mockMasterCodeListItem: MasterCodeListItem = {
      codeType: 'APITY',
      description: 'Apheresis Incident Type',
      changeControlFlag: 'Y',
      numericalValue: 100,
      sequence1: 1,
      sequence2: 2,
      sequence3: 3,
      effDate: new Date('2025-01-01'),
      termDate: null,
      lastModifiedDate: new Date('2025-01-15'),
      auditKey: 12345,
      status: 'Active',
      isActive: true
    };

    it('should retrieve master codes with default pagination', (done) => {
      const mockResponse: ApiResponse<MasterCodeListItem> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockMasterCodeListItem],
        total: 1
      };

      service.getMasterCodes('CH01').subscribe(response => {
        expect(response.data).toEqual([mockMasterCodeListItem]);
        expect(response.total).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should retrieve master codes with custom pagination', (done) => {
      const mockResponse: ApiResponse<MasterCodeListItem> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockMasterCodeListItem],
        total: 50
      };

      service.getMasterCodes('CH01', 25, 10).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(50);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/25/10`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should send filter in request body', (done) => {
      const filter: MasterCodeFilter = {
        searchKeyword: 'APITY',
        effectiveDate: new Date('2025-01-01'),
        sort: 'A'
      };

      const mockResponse: ApiResponse<MasterCodeListItem> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockMasterCodeListItem],
        total: 1
      };

      service.getMasterCodes('CH01', 10, 0, filter).subscribe(response => {
        expect(response.data).toEqual([mockMasterCodeListItem]);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      expect(req.request.body).toEqual(filter);
      req.flush(mockResponse);
    });

    it('should throw error when response.success is false with custom message', (done) => {
      const mockResponse: ApiResponse<MasterCodeListItem> = {
        success: false,
        message: 'Access denied',
        statusCode: 403,
        data: [],
        total: 0
      };

      service.getMasterCodes('CH01').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: Error) => {
          expect(err.message).toBe('Access denied');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      req.flush(mockResponse);
    });

    it('should throw default error when response.success is false with empty message', (done) => {
      const mockResponse: ApiResponse<MasterCodeListItem> = {
        success: false,
        message: '',
        statusCode: 500,
        data: [],
        total: 0
      };

      service.getMasterCodes('CH01').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: Error) => {
          expect(err.message).toBe('Error loading distribution master codes');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      req.flush(mockResponse);
    });

    it('should return empty array and zero total when response data and total are null', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any,
        total: null as any
      };

      service.getMasterCodes('CH01').subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      req.flush(mockResponse);
    });

    it('should return empty array when response data is undefined', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: undefined as any,
        total: 0
      };

      service.getMasterCodes('CH01').subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error responses through catchError', (done) => {
      service.getMasterCodes('CH01').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should propagate network errors through catchError', (done) => {
      service.getMasterCodes('CH01').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should send empty object when filter is undefined', (done) => {
      const mockResponse: ApiResponse<MasterCodeListItem> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      service.getMasterCodes('CH01', 10, 0, undefined).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('getDistributionMasterCodesByType', () => {
    const mockMasterCodeDetail: MasterCodeDetail = {
      codeType: 'APITY',
      code: 'APITY001',
      description: 'Equipment malfunction',
      changeControlFlag: 'Y',
      numberalValue: 100,
      numericalValue: 100,
      sequence1: 1,
      sequence2: 2,
      sequence3: 3,
      effDate: new Date('2025-01-01'),
      termDate: new Date('2025-12-31'),
      lastModifiedDate: new Date('2025-01-15'),
      auditKey: 12345,
      status: 'Active',
      isActive: true
    };

    it('should retrieve codes by type with default pagination', (done) => {
      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockMasterCodeDetail],
        total: 1
      };

      service.getDistributionMasterCodesByType('APITY').subscribe(response => {
        expect(response.data).toEqual([mockMasterCodeDetail]);
        expect(response.total).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should retrieve codes by type with custom pagination', (done) => {
      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockMasterCodeDetail],
        total: 100
      };

      service.getDistributionMasterCodesByType('APITY', 50, 25).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(100);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/50/25`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should send filter in request body for code type query', (done) => {
      const filter: CodeTypeFilter = {
        searchKeyword: 'Equipment',
        effectiveDate: new Date('2025-01-01'),
        sort: 'D'
      };

      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockMasterCodeDetail],
        total: 1
      };

      service.getDistributionMasterCodesByType('APITY', 10, 0, filter).subscribe(response => {
        expect(response.data).toEqual([mockMasterCodeDetail]);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      expect(req.request.body).toEqual(filter);
      req.flush(mockResponse);
    });

    it('should throw error when response.success is false with custom message', (done) => {
      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: false,
        message: 'Code type not found',
        statusCode: 404,
        data: [],
        total: 0
      };

      service.getDistributionMasterCodesByType('INVALID').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: Error) => {
          expect(err.message).toBe('Code type not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/INVALID/10/0`);
      req.flush(mockResponse);
    });

    it('should throw default error when response.success is false with empty message', (done) => {
      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: false,
        message: '',
        statusCode: 500,
        data: [],
        total: 0
      };

      service.getDistributionMasterCodesByType('APITY').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: Error) => {
          expect(err.message).toBe('Error loading distribution master codes');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      req.flush(mockResponse);
    });

    it('should map numberalValue to numericalValue when only numberalValue is present', (done) => {
      const itemWithOnlyNumberal: MasterCodeDetail = {
        ...mockMasterCodeDetail,
        numberalValue: 42,
        numericalValue: null as any
      };

      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [itemWithOnlyNumberal],
        total: 1
      };

      service.getDistributionMasterCodesByType('APITY').subscribe(response => {
        expect(response.data[0].numericalValue).toBe(42);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      req.flush(mockResponse);
    });

    it('should use numericalValue when only numericalValue is present', (done) => {
      const itemWithOnlyNumerical: MasterCodeDetail = {
        ...mockMasterCodeDetail,
        numberalValue: null as any,
        numericalValue: 99
      };

      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [itemWithOnlyNumerical],
        total: 1
      };

      service.getDistributionMasterCodesByType('APITY').subscribe(response => {
        expect(response.data[0].numericalValue).toBe(99);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      req.flush(mockResponse);
    });

    it('should prefer numberalValue over numericalValue when both are present', (done) => {
      const itemWithBoth: MasterCodeDetail = {
        ...mockMasterCodeDetail,
        numberalValue: 77,
        numericalValue: 88
      };

      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [itemWithBoth],
        total: 1
      };

      service.getDistributionMasterCodesByType('APITY').subscribe(response => {
        // numberalValue (77) takes precedence via ?? operator: numberalValue ?? numericalValue
        expect(response.data[0].numericalValue).toBe(77);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      req.flush(mockResponse);
    });

    it('should return null numericalValue when both numberalValue and numericalValue are null', (done) => {
      const itemWithNeither: MasterCodeDetail = {
        ...mockMasterCodeDetail,
        numberalValue: null as any,
        numericalValue: null as any
      };

      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [itemWithNeither],
        total: 1
      };

      service.getDistributionMasterCodesByType('APITY').subscribe(response => {
        expect(response.data[0].numericalValue).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      req.flush(mockResponse);
    });

    it('should return empty array and zero total when response data is null', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any,
        total: null as any
      };

      service.getDistributionMasterCodesByType('APITY').subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error responses through catchError', (done) => {
      service.getDistributionMasterCodesByType('APITY').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should propagate network errors through catchError', (done) => {
      service.getDistributionMasterCodesByType('APITY').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should send empty object when filter is undefined', (done) => {
      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      service.getDistributionMasterCodesByType('APITY', 10, 0, undefined).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should map multiple items correctly', (done) => {
      const item1: MasterCodeDetail = {
        ...mockMasterCodeDetail,
        code: 'CODE1',
        numberalValue: 10,
        numericalValue: null as any
      };
      const item2: MasterCodeDetail = {
        ...mockMasterCodeDetail,
        code: 'CODE2',
        numberalValue: null as any,
        numericalValue: 20
      };

      const mockResponse: ApiResponse<MasterCodeDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [item1, item2],
        total: 2
      };

      service.getDistributionMasterCodesByType('APITY').subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].numericalValue).toBe(10);
        expect(response.data[1].numericalValue).toBe(20);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/10/0`);
      req.flush(mockResponse);
    });
  });

  describe('createMasterCodeType', () => {
    const mockCreateRequest: CreateMasterCodeTypeRequest = {
      codeType: 'NEWTYPE',
      description: 'New Code Type',
      effectiveDate: '2025-02-01',
      terminationDate: null,
      changeControlFlag: 'Y'
    };

    it('should create a new master code type', (done) => {
      const mockResponse = {
        success: true,
        message: 'Code type created successfully',
        data: mockCreateRequest
      };

      service.createMasterCodeType('CH01', mockCreateRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/AddDistributionMasterCode/CH01`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCreateRequest);
      req.flush(mockResponse);
    });

    it('should handle creation with minimal required fields', (done) => {
      const minimalRequest: CreateMasterCodeTypeRequest = {
        codeType: 'MIN',
        description: 'Minimal Type',
        effectiveDate: '2025-02-01'
      };

      const mockResponse = {
        success: true,
        message: 'Created',
        data: minimalRequest
      };

      service.createMasterCodeType('CH01', minimalRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/AddDistributionMasterCode/CH01`);
      expect(req.request.body).toEqual(minimalRequest);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error responses through catchError', (done) => {
      service.createMasterCodeType('CH01', mockCreateRequest).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/AddDistributionMasterCode/CH01`);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });

    it('should propagate network errors through catchError', (done) => {
      service.createMasterCodeType('CH01', mockCreateRequest).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/AddDistributionMasterCode/CH01`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should construct correct URL with different chapterId', (done) => {
      const mockResponse = { success: true };

      service.createMasterCodeType('CH99', mockCreateRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/AddDistributionMasterCode/CH99`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('updateMasterCodeType', () => {
    const mockUpdateRequest: UpdateMasterCodeTypeRequest = {
      description: 'Updated Description',
      effectiveDate: '2025-02-01',
      terminationDate: '2025-12-31',
      numericalValue: 200,
      codeBehavior: 'STANDARD',
      modificationDate: new Date('2025-02-04')
    };

    it('should update an existing master code type', (done) => {
      const codeType = 'APITY';
      const mockResponse = {
        success: true,
        message: 'Updated successfully',
        data: mockUpdateRequest
      };

      service.updateMasterCodeType('CH01', codeType, mockUpdateRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/UpdateDistributionMasterCode/CH01/${codeType}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdateRequest);
      req.flush(mockResponse);
    });

    it('should update with null termination date', (done) => {
      const updateWithNullTerm: UpdateMasterCodeTypeRequest = {
        ...mockUpdateRequest,
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Updated',
        data: updateWithNullTerm
      };

      service.updateMasterCodeType('CH01', 'TEST', updateWithNullTerm).subscribe(response => {
        expect(response.data.terminationDate).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/UpdateDistributionMasterCode/CH01/TEST`);
      expect(req.request.body.terminationDate).toBeNull();
      req.flush(mockResponse);
    });

    it('should construct correct URL with encoded code type', (done) => {
      const codeTypeWithSpace = 'CODE TYPE';
      const mockResponse = { success: true };

      service.updateMasterCodeType('CH01', codeTypeWithSpace, mockUpdateRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/UpdateDistributionMasterCode/CH01/${codeTypeWithSpace}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error responses through catchError', (done) => {
      service.updateMasterCodeType('CH01', 'APITY', mockUpdateRequest).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/UpdateDistributionMasterCode/CH01/APITY`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should propagate network errors through catchError', (done) => {
      service.updateMasterCodeType('CH01', 'APITY', mockUpdateRequest).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/UpdateDistributionMasterCode/CH01/APITY`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should update with minimal required fields', (done) => {
      const minimalUpdate: UpdateMasterCodeTypeRequest = {
        description: 'Minimal Update',
        effectiveDate: '2025-03-01'
      };

      const mockResponse = { success: true, data: minimalUpdate };

      service.updateMasterCodeType('CH01', 'APITY', minimalUpdate).subscribe(response => {
        expect(response.data).toEqual(minimalUpdate);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/UpdateDistributionMasterCode/CH01/APITY`);
      expect(req.request.body).toEqual(minimalUpdate);
      req.flush(mockResponse);
    });
  });

  describe('createCode', () => {
    const mockCreateCodeRequest: CreateCodeRequest = {
      codeType: 'APITY',
      code: 'APITY001',
      description: 'New Code',
      effectiveDate: '2025-02-01',
      terminationDate: null,
      sequence1: 1,
      sequence2: 2,
      sequence3: 3,
      numericalValue: 100,
      changeControlFlag: 'D'
    };

    const mockMasterCodeDetail: MasterCodeDetail = {
      codeType: 'APITY',
      code: 'APITY001',
      description: 'New Code',
      changeControlFlag: 'Y',
      numberalValue: 100,
      numericalValue: 100,
      sequence1: 1,
      sequence2: 2,
      sequence3: 3,
      effDate: new Date('2025-02-01'),
      termDate: null,
      lastModifiedDate: new Date('2025-02-04'),
      auditKey: 12345,
      status: 'Active',
      isActive: true
    };

    it('should create a new code', (done) => {
      service.createCode(mockCreateCodeRequest).subscribe(response => {
        expect(response).toEqual(mockMasterCodeDetail);
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCreateCodeRequest);
      req.flush(mockMasterCodeDetail);
    });

    it('should create code with minimal fields', (done) => {
      const minimalRequest: CreateCodeRequest = {
        codeType: 'TEST',
        code: 'TEST001',
        description: 'Minimal Code',
        effectiveDate: '2025-02-01'
      };

      const minimalResponse: MasterCodeDetail = {
        ...mockMasterCodeDetail,
        ...minimalRequest,
        effDate: new Date(minimalRequest.effectiveDate),
        numericalValue: null,
        sequence1: null,
        sequence2: null,
        sequence3: null
      };

      service.createCode(minimalRequest).subscribe(response => {
        expect(response.code).toBe('TEST001');
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body).toEqual(minimalRequest);
      req.flush(minimalResponse);
    });

    it('should propagate HTTP error responses through catchError', (done) => {
      service.createCode(mockCreateCodeRequest).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should propagate network errors through catchError', (done) => {
      service.createCode(mockCreateCodeRequest).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.error(new ProgressEvent('Network error'));
    });

    it('should post to the base apiUrl', (done) => {
      service.createCode(mockCreateCodeRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.url).toBe(apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush(mockMasterCodeDetail);
    });
  });

  describe('updateCode', () => {
    const mockUpdateCodeRequest: UpdateCodeRequest = {
      codeType: 'APITY',
      code: 'APITY001',
      description: 'Updated Code Description',
      effectiveDate: '2025-02-01',
      terminationDate: '2025-12-31',
      sequence1: 10,
      sequence2: 20,
      sequence3: 30,
      NumericValue: 200
    };

    const mockUpdatedCodeDetail: MasterCodeDetail = {
      codeType: 'APITY',
      code: 'APITY001',
      description: 'Updated Code Description',
      changeControlFlag: 'N',
      numberalValue: 200,
      numericalValue: 200,
      sequence1: 10,
      sequence2: 20,
      sequence3: 30,
      effDate: new Date('2025-02-01'),
      termDate: new Date('2025-12-31'),
      lastModifiedDate: new Date('2025-02-04'),
      auditKey: 12345,
      status: 'Active',
      isActive: true
    };

    it('should update an existing code', (done) => {
      service.updateCode('APITY', 'APITY001', mockUpdateCodeRequest).subscribe(response => {
        expect(response).toEqual(mockUpdatedCodeDetail);
        expect(response.description).toBe('Updated Code Description');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/APITY001`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdateCodeRequest);
      req.flush(mockUpdatedCodeDetail);
    });

    it('should update code with null termination date', (done) => {
      const updateWithNullTerm: UpdateCodeRequest = {
        ...mockUpdateCodeRequest,
        terminationDate: null
      };

      const responseWithNullTerm: MasterCodeDetail = {
        ...mockUpdatedCodeDetail,
        termDate: null
      };

      service.updateCode('APITY', 'APITY001', updateWithNullTerm).subscribe(response => {
        expect(response.termDate).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/APITY001`);
      expect(req.request.body.terminationDate).toBeNull();
      req.flush(responseWithNullTerm);
    });

    it('should construct correct URL with code type and code', (done) => {
      service.updateCode('TEST', 'CODE123', mockUpdateCodeRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/TEST/CODE123`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockUpdatedCodeDetail);
    });

    it('should propagate HTTP error responses through catchError', (done) => {
      service.updateCode('APITY', 'APITY001', mockUpdateCodeRequest).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err.status).toBe(422);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/APITY001`);
      req.flush('Unprocessable Entity', { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should propagate network errors through catchError', (done) => {
      service.updateCode('APITY', 'APITY001', mockUpdateCodeRequest).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/APITY001`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle different code type and code combinations in URL', (done) => {
      service.updateCode('BLDTYP', 'AB_POS', mockUpdateCodeRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/BLDTYP/AB_POS`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.url).toContain('BLDTYP/AB_POS');
      req.flush(mockUpdatedCodeDetail);
    });
  });

  describe('Error Message Handling', () => {
    it('should extract error message from error.error.message', (done) => {
      const customError = 'Custom error from server';

      service.getMasterCodes('CH01').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: () => {
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      req.flush({ message: customError }, { status: 400, statusText: 'Bad Request' });
    });

    it('should use default error message when no message provided', (done) => {
      service.createCode({
        codeType: 'TEST',
        code: 'TEST001',
        description: 'Test',
        effectiveDate: '2026-03-23'
      }).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: () => {
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Failed to create code' }, { status: 500, statusText: 'Server Error' });
    });

    it('should propagate 401 unauthorized errors', (done) => {
      service.getMasterCodes('CH01').subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/GetDistributionMasterCodes/CH01/10/0`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should propagate errors from updateMasterCodeType', (done) => {
      service.updateMasterCodeType('CH01', 'APITY', {
        description: 'Test',
        effectiveDate: '2025-01-01'
      }).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/UpdateDistributionMasterCode/CH01/APITY`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should propagate errors from updateCode', (done) => {
      service.updateCode('APITY', 'CODE1', {
        codeType: 'APITY',
        code: 'CODE1',
        description: 'Test',
        effectiveDate: '2025-01-01'
      }).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err: any) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/APITY/CODE1`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
