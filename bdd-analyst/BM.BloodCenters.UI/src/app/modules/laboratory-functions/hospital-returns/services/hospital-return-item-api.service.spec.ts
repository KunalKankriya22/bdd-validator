import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HospitalReturnItemApiService } from './hospital-return-item-api.service';
import {
  HospitalReturnItemDto,
  HospitalReturnItemQueryDto,
  CreateHospitalReturnItemDto,
  UpdateHospitalReturnItemDto,
  HospitalReturnItemApiResponse,
  DropdownOption,
  OpenReturnAdviceResult,
  ReturnAdviceDetail,
  CustomerSearchResult,
  ReturnReasonListResult,
  ProductCodeListResult,
  BloodTypeListResult,
  ContactListResult,
  ScanProductRequest,
  ScanProductResult,
  EvaluateReturnRequest,
  EvaluateReturnResult,
  CommitReturnRequest,
  CommitReturnResult,
  PrinterResult,
  CloseReturnAdviceRequest,
  ReturnAdviceQueryDto,
  CreateReturnAdviceDto,
  UpdateReturnAdviceDto,
} from '../models/hospital-return-item.model';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import { ApiService } from 'src/app/shared/services/api.service';

describe('HospitalReturnItemApiService', () => {
  let service: HospitalReturnItemApiService;
  let httpMock: HttpTestingController;

  const mockItem: HospitalReturnItemDto = {
    unitId: 'UNIT001',
    returnAdviceId: 'ADVICE001',
    productCode: 'PROD001',
    expDate: '2024-12-31T23:59:00Z',
    returnReasonCode: 'RR001',
    locationId: 'LOC001',
    chapterId: 'TEST',
    collDate: '2024-06-15',
    insertDate: '2024-06-20T10:00:00Z',
    customerId: 'CUST001',
    programId: 'IMIRETN',
    crDbInd: 'CR',
    moveDate: '2024-06-20',
  };

  const mockApiResponse: HospitalReturnItemApiResponse<HospitalReturnItemDto> = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: [mockItem],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HospitalReturnItemApiService, ApiService],
    });

    service = TestBed.inject(HospitalReturnItemApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should retrieve all hospital return items', () => {
      const queryDto: HospitalReturnItemQueryDto = {
        returnAdviceId: 'ADVICE001',
      };

      service.getAll(queryDto).subscribe((response) => {
        expect(response).toEqual(mockApiResponse);
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_ALL}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(queryDto);
      req.flush(mockApiResponse);
    });

    it('should handle empty query DTO', () => {
      service.getAll().subscribe((response) => {
        expect(response).toEqual(mockApiResponse);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_ALL}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockApiResponse);
    });

    it('should handle filter parameters', () => {
      const queryDto: HospitalReturnItemQueryDto = {
        returnAdviceId: 'ADVICE001',
        customerId: 'CUST001',
        sortColumn: 'unitId',
        sortOrder: 'ASC',
      };

      service.getAll(queryDto).subscribe((response) => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_ALL}`,
      );
      expect(req.request.body).toEqual(queryDto);
      req.flush(mockApiResponse);
    });
  });

  describe('getById', () => {
    it('should retrieve a single hospital return item by ID', () => {
      const unitId = 'UNIT001';
      const returnAdviceId = 'ADVICE001';

      service.getById(unitId, returnAdviceId).subscribe((response) => {
        expect(response).toEqual(mockApiResponse);
        expect(response.data[0].unitId).toBe(unitId);
        expect(response.data[0].returnAdviceId).toBe(returnAdviceId);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_BY_ID(unitId, returnAdviceId)}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should handle URL encoding for special characters', () => {
      const unitId = 'UNIT/001';
      const returnAdviceId = 'ADVICE#001';

      service.getById(unitId, returnAdviceId).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_BY_ID(unitId, returnAdviceId)}`,
      );
      expect(req.request.url).toContain(encodeURIComponent(unitId));
      expect(req.request.url).toContain(encodeURIComponent(returnAdviceId));
      req.flush(mockApiResponse);
    });
  });

  describe('create', () => {
    it('should create a new hospital return item', () => {
      const createDto: CreateHospitalReturnItemDto = {
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
        productCode: 'PROD001',
            expDate: '2024-12-31T23:59:00Z',
        returnReasonCode: 'RR001',
        locationId: 'LOC001',
        collDate: '2024-06-15',
        customerId: 'CUST001',
        crDbInd: 'CR',
        moveDate: '2024-06-20',
      };

      const createResponse: HospitalReturnItemApiResponse<HospitalReturnItemDto> = {
        success: true,
        statusCode: 201,
        message: 'Hospital return item created successfully',
        data: [mockItem],
      };

      service.create(createDto).subscribe((response) => {
        expect(response).toEqual(createResponse);
        expect(response.statusCode).toBe(201);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_CREATE}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(createResponse);
    });

    it('should create with minimal required fields', () => {
      const createDto: CreateHospitalReturnItemDto = {
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
      };

      service.create(createDto).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_CREATE}`,
      );
      expect(req.request.body).toEqual(createDto);
      req.flush(mockApiResponse);
    });
  });

  describe('update', () => {
    it('should update an existing hospital return item', () => {
      const unitId = 'UNIT001';
      const returnAdviceId = 'ADVICE001';
      const updateDto: UpdateHospitalReturnItemDto = {
        productCode: 'PROD002',
        returnReasonCode: 'RR002',
      };

      const updateResponse: HospitalReturnItemApiResponse<HospitalReturnItemDto> = {
        success: true,
        statusCode: 200,
        message: 'Hospital return item updated successfully',
        data: [],
      };

      service.update(unitId, returnAdviceId, updateDto).subscribe((response) => {
        expect(response).toEqual(updateResponse);
        expect(response.message).toContain('updated');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_UPDATE(unitId, returnAdviceId)}`,
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updateResponse);
    });
  });

  describe('delete', () => {
    it('should delete a hospital return item', () => {
      const unitId = 'UNIT001';
      const returnAdviceId = 'ADVICE001';

      const deleteResponse: HospitalReturnItemApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Record deleted successfully',
        data: [true],
      };

      service.delete(unitId, returnAdviceId).subscribe((response) => {
        expect(response).toEqual(deleteResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_DELETE(unitId, returnAdviceId)}`,
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(deleteResponse);
    });
  });

  describe('deleteMultiple', () => {
    it('should delete multiple hospital return items', (done) => {
      const items: HospitalReturnItemDto[] = [
        { ...mockItem, unitId: 'UNIT001', returnAdviceId: 'ADVICE001' },
        { ...mockItem, unitId: 'UNIT002', returnAdviceId: 'ADVICE002' },
      ];

      const deleteResponse: HospitalReturnItemApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Record deleted successfully',
        data: [true],
      };

      service.deleteMultiple(items).subscribe((result) => {
        expect(result).toBeTrue();
        done();
      });

      // Expect two DELETE requests
      const req1 = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_DELETE('UNIT001', 'ADVICE001')}`,
      );
      expect(req1.request.method).toBe('DELETE');
      req1.flush(deleteResponse);

      const req2 = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_DELETE('UNIT002', 'ADVICE002')}`,
      );
      expect(req2.request.method).toBe('DELETE');
      req2.flush(deleteResponse);
    });

    it('should handle empty items array', (done) => {
      const items: HospitalReturnItemDto[] = [];

      service.deleteMultiple(items).subscribe((result) => {
        expect(result).toBeTrue();
        done();
      });
    });
  });

  describe('getByReturnAdviceId', () => {
    it('should retrieve items by return advice ID without pagination', () => {
      const returnAdviceId = 'ADVICE001';

      service.getByReturnAdviceId(returnAdviceId).subscribe((response) => {
        expect(response).toEqual(mockApiResponse);
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_BY_ADVICE}`) &&
        r.params.get('returnAdviceId') === 'ADVICE001',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });
  });

  describe('scanProduct', () => {
    it('should call scan-product endpoint', () => {
      const request = { scannedUnitId: 'UNIT001', returnAdviceId: 'ADVICE001' };

      service.scanProduct(request).subscribe((response) => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_SCAN_PRODUCT}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [] });
    });
  });

  describe('evaluateReturn', () => {
    it('should call evaluate-return endpoint', () => {
      const request = {
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
        returnReasonCode: 'NOAPP',
      };

      service.evaluateReturn(request).subscribe((response) => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_EVALUATE_RETURN}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.returnReasonCode).toBe('NOAPP');
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [] });
    });
  });

  describe('commitReturn', () => {
    it('should call commit-return endpoint', () => {
      const request = {
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
        returnReasonCode: 'NOAPP',
        creditDecision: 'CR',
        routingDecision: 'RE',
        locationId: 'QUARANTINE',
        visuallyChecked: true,
      };

      service.commitReturn(request).subscribe((response) => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_COMMIT_RETURN}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.visuallyChecked).toBeTrue();
      req.flush({ success: true, statusCode: 200, message: 'Success', data: [] });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP 404 error', () => {
      const unitId = 'NONEXISTENT';
      const returnAdviceId = 'NONEXISTENT';

      service.getById(unitId, returnAdviceId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_BY_ID(unitId, returnAdviceId)}`,
      );
      req.flush(
        { success: false, message: 'Not found' },
        { status: 404, statusText: 'Not Found' },
      );
    });

    it('should handle validation errors on create', () => {
      const createDto: CreateHospitalReturnItemDto = {
        unitId: '',
        returnAdviceId: '',
      };

      service.create(createDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_CREATE}`,
      );
      req.flush(
        { success: false, message: 'Validation error' },
        { status: 400, statusText: 'Bad Request' },
      );
    });
  });

  describe('getByReturnAdviceId - branch coverage', () => {
    it('should not set returnAdviceId param when called with null', () => {
      service.getByReturnAdviceId(null).subscribe((response) => {
        expect(response).toEqual(mockApiResponse);
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_BY_ADVICE}`) &&
        !r.params.has('returnAdviceId'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should not set returnAdviceId param when called with undefined', () => {
      service.getByReturnAdviceId(undefined).subscribe((response) => {
        expect(response).toEqual(mockApiResponse);
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_BY_ADVICE}`) &&
        !r.params.has('returnAdviceId'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should not set returnAdviceId param when called with empty string', () => {
      service.getByReturnAdviceId('').subscribe((response) => {
        expect(response).toEqual(mockApiResponse);
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_BY_ADVICE}`) &&
        !r.params.has('returnAdviceId'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });
  });

  describe('deleteMultiple - branch coverage', () => {
    it('should return false when one delete fails', (done) => {
      const items: HospitalReturnItemDto[] = [
        { ...mockItem, unitId: 'UNIT001', returnAdviceId: 'ADVICE001' },
        { ...mockItem, unitId: 'UNIT002', returnAdviceId: 'ADVICE002' },
      ];

      const successResponse: HospitalReturnItemApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Deleted',
        data: [true],
      };

      const failResponse: HospitalReturnItemApiResponse<boolean> = {
        success: false,
        statusCode: 200,
        message: 'Failed',
        data: [false],
      };

      service.deleteMultiple(items).subscribe((result) => {
        expect(result).toBeFalse();
        done();
      });

      const req1 = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_DELETE('UNIT001', 'ADVICE001')}`,
      );
      req1.flush(successResponse);

      const req2 = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_DELETE('UNIT002', 'ADVICE002')}`,
      );
      req2.flush(failResponse);
    });

    it('should return false when all deletes fail', (done) => {
      const items: HospitalReturnItemDto[] = [
        { ...mockItem, unitId: 'UNIT001', returnAdviceId: 'ADVICE001' },
      ];

      const failResponse: HospitalReturnItemApiResponse<boolean> = {
        success: false,
        statusCode: 500,
        message: 'Error',
        data: [false],
      };

      service.deleteMultiple(items).subscribe((result) => {
        expect(result).toBeFalse();
        done();
      });

      const req1 = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_DELETE('UNIT001', 'ADVICE001')}`,
      );
      req1.flush(failResponse);
    });
  });

  describe('getPrinters', () => {
    it('should return mapped printer list on success', (done) => {
      const mockPrinters: PrinterResult[] = [
        { printerId: 'PR001', printerDescription: 'Main Printer' },
        { printerId: 'PR002', printerDescription: 'Lab Printer' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<PrinterResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockPrinters,
      };

      service.getPrinters().subscribe((result) => {
        expect(result).toEqual(mockPrinters);
        expect(result.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_PRINTERS}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
      };

      service.getPrinters().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_PRINTERS}`,
      );
      req.flush(apiResponse);
    });

    it('should return empty array on error', (done) => {
      service.getPrinters().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_PRINTERS}`,
      );
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('closeReturnAdvice', () => {
    it('should call close endpoint with PUT method', () => {
      const returnAdviceId = 'ADVICE001';
      const request: CloseReturnAdviceRequest = {
        printerId: 'PR001',
        printPickSlip: true,
      };

      const closeResponse: HospitalReturnItemApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Closed',
        data: [],
      };

      service.closeReturnAdvice(returnAdviceId, request).subscribe((response) => {
        expect(response).toEqual(closeResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CLOSE(returnAdviceId)}`,
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(closeResponse);
    });

    it('should handle close with printPickSlip false', () => {
      const returnAdviceId = 'ADVICE002';
      const request: CloseReturnAdviceRequest = {
        printerId: 'PR002',
        printPickSlip: false,
      };

      service.closeReturnAdvice(returnAdviceId, request).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CLOSE(returnAdviceId)}`,
      );
      expect(req.request.body.printPickSlip).toBeFalse();
      req.flush({ success: true, statusCode: 200, message: 'Closed', data: [] });
    });
  });

  describe('getReturnIds', () => {
    it('should return mapped dropdown options on success', (done) => {
      const mockOpenAdvices: OpenReturnAdviceResult[] = [
        { returnAdviceId: 'ADV001', consigneeId: 'CON001' },
        { returnAdviceId: 'ADV002', consigneeId: 'CON002' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<OpenReturnAdviceResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockOpenAdvices,
      };

      service.getReturnIds().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ value: 'ADV001', label: 'ADV001 · CON001' });
        expect(result[1]).toEqual({ value: 'ADV002', label: 'ADV002 · CON002' });
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_OPEN}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
      };

      service.getReturnIds().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_OPEN}`,
      );
      req.flush(apiResponse);
    });

    it('should return empty array on error', (done) => {
      service.getReturnIds().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_OPEN}`,
      );
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getReturnAdviceDetails', () => {
    it('should return the first detail when data is present', (done) => {
      const mockDetail: ReturnAdviceDetail = {
        returnAdviceId: 'ADV001',
        consigneeId: 'CON001',
        customerId: 'CUST001',
        customerName: 'Test Hospital',
        returnDate: '2024-06-20',
        adviceStatus: 'OPEN',
      };

      const apiResponse: HospitalReturnItemApiResponse<ReturnAdviceDetail> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockDetail],
      };

      service.getReturnAdviceDetails('ADV001').subscribe((result) => {
        expect(result).toEqual(mockDetail);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_GET_BY_ID('ADV001')}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return null when data is empty array', (done) => {
      const apiResponse: HospitalReturnItemApiResponse<ReturnAdviceDetail> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
      };

      service.getReturnAdviceDetails('ADV999').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_GET_BY_ID('ADV999')}`,
      );
      req.flush(apiResponse);
    });

    it('should return null when data is null', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
      };

      service.getReturnAdviceDetails('ADV999').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_GET_BY_ID('ADV999')}`,
      );
      req.flush(apiResponse);
    });

    it('should return null on error', (done) => {
      service.getReturnAdviceDetails('ADV999').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_GET_BY_ID('ADV999')}`,
      );
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getCustomerIds', () => {
    it('should return mapped dropdown options with customer name', (done) => {
      const mockCustomers: CustomerSearchResult[] = [
        { customerId: 'CUST001', customerName: 'General Hospital' },
        { customerId: 'CUST002', customerName: 'City Clinic' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<CustomerSearchResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockCustomers,
      };

      service.getCustomerIds('Gen').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({
          value: 'CUST001',
          label: 'CUST001 - General Hospital',
        });
        expect(result[1]).toEqual({
          value: 'CUST002',
          label: 'CUST002 - City Clinic',
        });
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CUSTOMERS}`) &&
        r.params.get('searchText') === 'Gen',
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return label without customer name when customerName is absent', (done) => {
      const mockCustomers: CustomerSearchResult[] = [
        { customerId: 'CUST003' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<CustomerSearchResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockCustomers,
      };

      service.getCustomerIds().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ value: 'CUST003', label: 'CUST003' });
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CUSTOMERS}`) &&
        !r.params.has('searchText'),
      );
      req.flush(apiResponse);
    });

    it('should not set searchText param when searchText is undefined', (done) => {
      const apiResponse: HospitalReturnItemApiResponse<CustomerSearchResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
      };

      service.getCustomerIds(undefined).subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CUSTOMERS}`) &&
        !r.params.has('searchText'),
      );
      req.flush(apiResponse);
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
      };

      service.getCustomerIds().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CUSTOMERS}`),
      );
      req.flush(apiResponse);
    });

    it('should return empty array on error', (done) => {
      service.getCustomerIds().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CUSTOMERS}`),
      );
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getContacts', () => {
    it('should return mapped dropdown options', (done) => {
      const mockContacts: ContactListResult[] = [
        { returnedBy: 'John Doe' },
        { returnedBy: 'Jane Smith' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<ContactListResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockContacts,
      };

      service.getContacts('CUST001').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ value: 'John Doe', label: 'John Doe' });
        expect(result[1]).toEqual({ value: 'Jane Smith', label: 'Jane Smith' });
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CONTACTS}`) &&
        r.params.get('customerId') === 'CUST001',
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
      };

      service.getContacts('CUST001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CONTACTS}`),
      );
      req.flush(apiResponse);
    });

    it('should return empty array on error', (done) => {
      service.getContacts('CUST001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CONTACTS}`),
      );
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getProductCodes', () => {
    it('should return mapped dropdown options with description', (done) => {
      const mockProducts: ProductCodeListResult[] = [
        { productCode: 'RBC001', productDescription: 'Red Blood Cells' },
        { productCode: 'PLT001', productDescription: 'Platelets' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<ProductCodeListResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockProducts,
      };

      service.getProductCodes('UNIT001').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({
          value: 'RBC001',
          label: 'RBC001 - Red Blood Cells',
        });
        expect(result[1]).toEqual({
          value: 'PLT001',
          label: 'PLT001 - Platelets',
        });
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_PRODUCT_CODES}`) &&
        r.params.get('unitId') === 'UNIT001' &&
        !r.params.has('codeScheme'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return label without description when productDescription is absent', (done) => {
      const mockProducts: ProductCodeListResult[] = [
        { productCode: 'RBC002' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<ProductCodeListResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockProducts,
      };

      service.getProductCodes('UNIT001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ value: 'RBC002', label: 'RBC002' });
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_PRODUCT_CODES}`),
      );
      req.flush(apiResponse);
    });

    it('should include codeScheme param when provided', (done) => {
      const apiResponse: HospitalReturnItemApiResponse<ProductCodeListResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
      };

      service.getProductCodes('UNIT001', 'ISBT').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_PRODUCT_CODES}`) &&
        r.params.get('unitId') === 'UNIT001' &&
        r.params.get('codeScheme') === 'ISBT',
      );
      req.flush(apiResponse);
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
      };

      service.getProductCodes('UNIT001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_PRODUCT_CODES}`),
      );
      req.flush(apiResponse);
    });

    it('should return empty array on error', (done) => {
      service.getProductCodes('UNIT001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_PRODUCT_CODES}`),
      );
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAboRhOptions', () => {
    it('should return mapped dropdown options with description', (done) => {
      const mockBloodTypes: BloodTypeListResult[] = [
        { aboCode: 'O+', aboDescription: 'O Positive' },
        { aboCode: 'A-', aboDescription: 'A Negative' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<BloodTypeListResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockBloodTypes,
      };

      service.getAboRhOptions('UNIT001', 'PROD001').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({
          value: 'O+',
          label: 'O+ - O Positive',
        });
        expect(result[1]).toEqual({
          value: 'A-',
          label: 'A- - A Negative',
        });
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_BLOOD_TYPES}`) &&
        r.params.get('unitId') === 'UNIT001' &&
        r.params.get('productCode') === 'PROD001' &&
        !r.params.has('aliquot') &&
        !r.params.has('codeScheme') &&
        !r.params.has('collDate') &&
        !r.params.has('shipmentNo'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return label without description when aboDescription is absent', (done) => {
      const mockBloodTypes: BloodTypeListResult[] = [
        { aboCode: 'B+' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<BloodTypeListResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockBloodTypes,
      };

      service.getAboRhOptions('UNIT001', 'PROD001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ value: 'B+', label: 'B+' });
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_BLOOD_TYPES}`),
      );
      req.flush(apiResponse);
    });

    it('should include all optional params when provided', (done) => {
      const apiResponse: HospitalReturnItemApiResponse<BloodTypeListResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
      };

      service.getAboRhOptions('UNIT001', 'PROD001', 'ALQ01', 'ISBT', '2024-06-15', 'SHIP001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_BLOOD_TYPES}`) &&
        r.params.get('unitId') === 'UNIT001' &&
        r.params.get('productCode') === 'PROD001' &&
        r.params.get('aliquot') === 'ALQ01' &&
        r.params.get('codeScheme') === 'ISBT' &&
        r.params.get('collDate') === '2024-06-15' &&
        r.params.get('shipmentNo') === 'SHIP001',
      );
      req.flush(apiResponse);
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
      };

      service.getAboRhOptions('UNIT001', 'PROD001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_BLOOD_TYPES}`),
      );
      req.flush(apiResponse);
    });

    it('should return empty array on error', (done) => {
      service.getAboRhOptions('UNIT001', 'PROD001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes(`${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_BLOOD_TYPES}`),
      );
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAllReturnAdvices', () => {
    it('should retrieve all return advices with pagination and queryDto', () => {
      const queryDto: ReturnAdviceQueryDto = {
        customerId: 'CUST001',
        status: 'OPEN',
        sortColumn: 'returnAdviceId',
        sortOrder: 'ASC',
      };

      const mockDetails: ReturnAdviceDetail[] = [
        { returnAdviceId: 'ADV001', customerId: 'CUST001', adviceStatus: 'OPEN' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<ReturnAdviceDetail> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockDetails,
        total: 1,
      };

      service.getAllReturnAdvices(10, 0, queryDto).subscribe((response) => {
        expect(response).toEqual(apiResponse);
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_GET_ALL(10, 0)}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(queryDto);
      req.flush(apiResponse);
    });

    it('should send empty object when queryDto is undefined', () => {
      const apiResponse: HospitalReturnItemApiResponse<ReturnAdviceDetail> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        total: 0,
      };

      service.getAllReturnAdvices(20, 5).subscribe((response) => {
        expect(response).toEqual(apiResponse);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_GET_ALL(20, 5)}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(apiResponse);
    });
  });

  describe('createReturnAdvice', () => {
    it('should create a new return advice', () => {
      const dto: CreateReturnAdviceDto = {
        consigneeId: 'CON001',
        customerId: 'CUST001',
        returnedBy: 'John Doe',
      };

      const mockDetail: ReturnAdviceDetail = {
        returnAdviceId: 'ADV_NEW',
        consigneeId: 'CON001',
        customerId: 'CUST001',
        returnedBy: 'John Doe',
      };

      const apiResponse: HospitalReturnItemApiResponse<ReturnAdviceDetail> = {
        success: true,
        statusCode: 201,
        message: 'Created',
        data: [mockDetail],
      };

      service.createReturnAdvice(dto).subscribe((response) => {
        expect(response).toEqual(apiResponse);
        expect(response.statusCode).toBe(201);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CREATE}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(apiResponse);
    });

    it('should create return advice with minimal fields', () => {
      const dto: CreateReturnAdviceDto = {};

      service.createReturnAdvice(dto).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CREATE}`,
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ success: true, statusCode: 201, message: 'Created', data: [] });
    });
  });

  describe('updateReturnAdvice', () => {
    it('should update an existing return advice', () => {
      const returnAdviceId = 'ADV001';
      const dto: UpdateReturnAdviceDto = {
        consigneeId: 'CON002',
        returnedBy: 'Jane Smith',
      };

      const apiResponse: HospitalReturnItemApiResponse<ReturnAdviceDetail> = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [{ returnAdviceId: 'ADV001', consigneeId: 'CON002', returnedBy: 'Jane Smith' }],
      };

      service.updateReturnAdvice(returnAdviceId, dto).subscribe((response) => {
        expect(response).toEqual(apiResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_UPDATE(returnAdviceId)}`,
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(apiResponse);
    });
  });

  describe('deleteReturnAdvice', () => {
    it('should delete a return advice', () => {
      const returnAdviceId = 'ADV001';

      const deleteResponse: HospitalReturnItemApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Deleted',
        data: [true],
      };

      service.deleteReturnAdvice(returnAdviceId).subscribe((response) => {
        expect(response).toEqual(deleteResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_DELETE(returnAdviceId)}`,
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(deleteResponse);
    });

    it('should handle delete error', () => {
      const returnAdviceId = 'ADV_INVALID';

      service.deleteReturnAdvice(returnAdviceId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_DELETE(returnAdviceId)}`,
      );
      req.flush(
        { success: false, message: 'Not found' },
        { status: 404, statusText: 'Not Found' },
      );
    });
  });

  describe('getReturnCodes', () => {
    it('should return mapped dropdown options with description', (done) => {
      const mockReasons: ReturnReasonListResult[] = [
        { code: 'NOAPP', codeDescription: 'Not Appropriate' },
        { code: 'EXPRD', codeDescription: 'Expired Product' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<ReturnReasonListResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockReasons,
      };

      service.getReturnCodes().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({
          value: 'NOAPP',
          label: 'NOAPP - Not Appropriate',
          destination: '',
          creditNoCredit: '',
        });
        expect(result[1]).toEqual({
          value: 'EXPRD',
          label: 'EXPRD - Expired Product',
          destination: '',
          creditNoCredit: '',
        });
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_RETURN_REASONS}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should return label without description when codeDescription is absent', (done) => {
      const mockReasons: ReturnReasonListResult[] = [
        { code: 'OTHER' },
      ];

      const apiResponse: HospitalReturnItemApiResponse<ReturnReasonListResult> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockReasons,
      };

      service.getReturnCodes().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ value: 'OTHER', label: 'OTHER', destination: '', creditNoCredit: '' });
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_RETURN_REASONS}`,
      );
      req.flush(apiResponse);
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
      };

      service.getReturnCodes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_RETURN_REASONS}`,
      );
      req.flush(apiResponse);
    });

    it('should return empty array on error', (done) => {
      service.getReturnCodes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_RETURN_REASONS}`,
      );
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
