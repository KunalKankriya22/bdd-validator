import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DebitCreditQueryService } from './debit-credit-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CustomerDebitCreditQueryDto,
  CustomerDebitCreditQueryFilterDto,
  ApiResponse,
  LovOption
} from '../models/debit-credit-query.model';

describe('DebitCreditQueryService', () => {
  let service: DebitCreditQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockRecords: CustomerDebitCreditQueryDto[] = [
    {
      adviceId: 'ADV-001',
      insertDate: '2025-01-31T10:30:00Z',
      tranType: 'CR',
      tranTypeDesc: 'Credit',
      reasonCode: 'RATSD',
      reasonDesc: 'Ref/Trans Svc Debit',
      requestDate: '2025-01-30T00:00:00Z',
      requestedBy: 'CJH',
      orderNo: '17339-0016',
      serviceCode: 'F18200-02',
      serviceCodeDesc: 'Blood Collection Service',
      productCode: 'E0701V02',
      aliquot: null,
      unitId: 'W1234-18-031310-Z',
      quantity: 250,
      insertUserId: 'USER01',
      insertUserName: 'Samantha Green',
      amount: 25.00,
      errorCorrectFlag: 'Y',
      errorCorrectDate: '2025-02-12T09:30:00Z',
      errorCorrectUser: 'USER02',
      errorCorrectName: 'John Doe',
      patientName: 'Chris Hunter',
      note1: null,
      customerId: 'CUST001',
      chapterId: 'CH01',
      noteId: null
    }
  ];

  const mockApiResponse: ApiResponse<CustomerDebitCreditQueryDto> = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: mockRecords,
    totalCount: 1
  };

  const mockCustomerLov: LovOption[] = [
    { code: 'CUST001', description: 'Customer One' },
    { code: 'CUST002', description: 'Customer Two' }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DebitCreditQueryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(DebitCreditQueryService);
  });

  describe('getDebitCreditRecords', () => {
    it('should call POST with correct endpoint and filter DTO', (done) => {
      const filterDto: CustomerDebitCreditQueryFilterDto = {
        customerId: 'CUST001'
      };

      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      service.getDebitCreditRecords(10, 0, filterDto).subscribe({
        next: (result) => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.GET_PAGINATED(10, 0),
            filterDto
          );
          done();
        }
      });
    });

    it('should return data and totalRecords', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      const filterDto: CustomerDebitCreditQueryFilterDto = {
        customerId: 'CUST001'
      };

      service.getDebitCreditRecords(10, 0, filterDto).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockRecords);
          expect(result.totalRecords).toBe(1);
          done();
        }
      });
    });




    it('should handle pagination parameters correctly', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      const filterDto: CustomerDebitCreditQueryFilterDto = {};

      service.getDebitCreditRecords(25, 50, filterDto).subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.GET_PAGINATED(25, 50),
            filterDto
          );
          done();
        }
      });
    });

    it('should handle multiple filter criteria', (done) => {
      const complexFilterDto: CustomerDebitCreditQueryFilterDto = {
        customerId: 'CUST001',
        orderNo: 'ORD-001',
        adviceId: 'ADV-001',
        tranType: 'CR',
        insertDateFrom: '2025-01-01',
        insertDateTo: '2025-12-31'
      };

      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      service.getDebitCreditRecords(100, 0, complexFilterDto).subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.GET_PAGINATED(100, 0),
            complexFilterDto
          );
          done();
        }
      });
    });
  });

  describe('getByAdviceId', () => {

    it('should return single record from data array', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockApiResponse));

      service.getByAdviceId('ADV-001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockRecords[0]);
          done();
        }
      });
    });




    it('should encode advice ID in URL', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockApiResponse));

      service.getByAdviceId('ADV/001').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.GET_BY_ID('ADV/001')
          );
          done();
        }
      });
    });
  });

  describe('getCustomerLov', () => {
    const mockRawCustomerLov: { customerId: string; name: string }[] = [
      { customerId: 'CUST001', name: 'Customer One' },
      { customerId: 'CUST002', name: 'Customer Two' }
    ];


    it('should return LOV options array', (done) => {
      const lovResponse: ApiResponse<{ customerId: string; name: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockRawCustomerLov,
        totalCount: 2
      };

      apiServiceSpy.get.and.returnValue(of(lovResponse));

      service.getCustomerLov().subscribe({
        next: (result) => {
          expect(result).toEqual(mockCustomerLov);
          done();
        }
      });
    });


  });

  describe('API Endpoint Validation', () => {
    it('should use correct base URL for paginated endpoint', () => {
      const endpoint = API.CUSTOMER_DEBIT_CREDIT_QUERY.GET_PAGINATED(10, 0);
      expect(endpoint).toBe('/api/v1/customer-debit-credit-query/10/0');
    });

    it('should use correct URL for get by ID endpoint', () => {
      const endpoint = API.CUSTOMER_DEBIT_CREDIT_QUERY.GET_BY_ID('ADV-001');
      expect(endpoint).toContain('/api/v1/customer-debit-credit-query/');
      expect(endpoint).toContain('ADV-001');
    });

    it('should use correct URL for customer LOV endpoint', () => {
      const endpoint = API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV;
      expect(endpoint).toBe('/api/v1/customer-debit-credit-query/customer-lov');
    });
  });

  describe('Response Mapping', () => {

    it('should preserve all DTO fields in response', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockApiResponse));

      service.getDebitCreditRecords(10, 0, {}).subscribe({
        next: (result) => {
          const record = result.data[0];
          expect(record.adviceId).toBe('ADV-001');
          expect(record.insertDate).toBe('2025-01-31T10:30:00Z');
          expect(record.tranType).toBe('CR');
          expect(record.customerId).toBe('CUST001');
          expect(record.amount).toBe(25.00);
          done();
        }
      });
    });
  });

  describe('getDebitCreditRecords - null/empty branches', () => {
    it('should default data to empty array when res.data is null', (done) => {
      const nullDataResponse: ApiResponse<CustomerDebitCreditQueryDto> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null,
        totalCount: 0
      };
      apiServiceSpy.post.and.returnValue(of(nullDataResponse));

      service.getDebitCreditRecords(10, 0, {}).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.totalRecords).toBe(0);
          done();
        }
      });
    });

    it('should default totalRecords to 0 when res.totalCount is null or undefined', (done) => {
      const noTotalCountResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: mockRecords,
        totalCount: null as any
      };
      apiServiceSpy.post.and.returnValue(of(noTotalCountResponse));

      service.getDebitCreditRecords(10, 0, {}).subscribe({
        next: (result) => {
          expect(result.totalRecords).toBe(0);
          done();
        }
      });
    });

    it('should return empty data array when response has data as empty array', (done) => {
      const emptyDataResponse: ApiResponse<CustomerDebitCreditQueryDto> = {
        success: true,
        statusCode: 200,
        message: 'No records',
        data: [],
        totalCount: 0
      };
      apiServiceSpy.post.and.returnValue(of(emptyDataResponse));

      service.getDebitCreditRecords(10, 0, {}).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.totalRecords).toBe(0);
          done();
        }
      });
    });
  });

  describe('getByAdviceId - branches', () => {
    it('should call GET with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockApiResponse));

      service.getByAdviceId('ADV-001').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.GET_BY_ID('ADV-001')
          );
          done();
        }
      });
    });

    it('should return null when res.data is null', (done) => {
      const nullDataResponse: ApiResponse<CustomerDebitCreditQueryDto> = {
        success: true,
        statusCode: 200,
        message: 'Not found',
        data: null,
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(nullDataResponse));

      service.getByAdviceId('NONEXISTENT').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        }
      });
    });

    it('should return null when res.data is an empty array', (done) => {
      const emptyDataResponse: ApiResponse<CustomerDebitCreditQueryDto> = {
        success: true,
        statusCode: 200,
        message: 'Not found',
        data: [],
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(emptyDataResponse));

      service.getByAdviceId('NONEXISTENT').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        }
      });
    });

    it('should return first record when res.data has multiple records', (done) => {
      const secondRecord: CustomerDebitCreditQueryDto = {
        ...mockRecords[0],
        adviceId: 'ADV-002'
      };
      const multiResponse: ApiResponse<CustomerDebitCreditQueryDto> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [mockRecords[0], secondRecord],
        totalCount: 2
      };
      apiServiceSpy.get.and.returnValue(of(multiResponse));

      service.getByAdviceId('ADV-001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockRecords[0]);
          expect(result!.adviceId).toBe('ADV-001');
          done();
        }
      });
    });
  });

  describe('getCustomerLov - branches', () => {
    it('should call GET with correct endpoint', (done) => {
      const lovResponse: ApiResponse<{ customerId: string; name: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [{ customerId: 'CUST001', name: 'Customer One' }],
        totalCount: 1
      };
      apiServiceSpy.get.and.returnValue(of(lovResponse));

      service.getCustomerLov().subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV
          );
          done();
        }
      });
    });

    it('should return empty array when res.data is null', (done) => {
      const nullDataResponse: ApiResponse<{ customerId: string; name: string }> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null,
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(nullDataResponse));

      service.getCustomerLov().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should map customerId to code and name to description', (done) => {
      const lovResponse: ApiResponse<{ customerId: string; name: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [
          { customerId: 'C1', name: 'First Customer' },
          { customerId: 'C2', name: 'Second Customer' }
        ],
        totalCount: 2
      };
      apiServiceSpy.get.and.returnValue(of(lovResponse));

      service.getCustomerLov().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0]).toEqual({ code: 'C1', description: 'First Customer' });
          expect(result[1]).toEqual({ code: 'C2', description: 'Second Customer' });
          done();
        }
      });
    });
  });

  describe('searchCustomerLov', () => {
    it('should call GET with correct search endpoint', (done) => {
      const searchResponse: ApiResponse<LovOption> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [{ code: 'CUST001', description: 'Customer One' }],
        totalCount: 1
      };
      apiServiceSpy.get.and.returnValue(of(searchResponse));

      service.searchCustomerLov('Cust').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV_SEARCH('Cust')
          );
          done();
        }
      });
    });

    it('should return matching LOV options', (done) => {
      const searchResponse: ApiResponse<LovOption> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [
          { code: 'CUST001', description: 'Customer One' },
          { code: 'CUST002', description: 'Customer Two' }
        ],
        totalCount: 2
      };
      apiServiceSpy.get.and.returnValue(of(searchResponse));

      service.searchCustomerLov('Cust').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0]).toEqual({ code: 'CUST001', description: 'Customer One' });
          expect(result[1]).toEqual({ code: 'CUST002', description: 'Customer Two' });
          done();
        }
      });
    });

    it('should return empty array when res.data is null', (done) => {
      const nullResponse: ApiResponse<LovOption> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null,
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(nullResponse));

      service.searchCustomerLov('xyz').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array when no matches found', (done) => {
      const emptyResponse: ApiResponse<LovOption> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: [],
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(emptyResponse));

      service.searchCustomerLov('nonexistent').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('getOrderNoLov', () => {
    it('should call GET with correct endpoint', (done) => {
      const orderResponse: ApiResponse<{ orderNo: string; localInsDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [{ orderNo: 'ORD-001', localInsDate: '2025-03-15T00:00:00Z' }],
        totalCount: 1
      };
      apiServiceSpy.get.and.returnValue(of(orderResponse));

      service.getOrderNoLov('CUST001').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.ORDER_NO_LOV('CUST001')
          );
          done();
        }
      });
    });

    it('should map orderNo to code and format localInsDate to description', (done) => {
      const orderResponse: ApiResponse<{ orderNo: string; localInsDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [
          { orderNo: 'ORD-001', localInsDate: '2025-01-15T00:00:00Z' },
          { orderNo: 'ORD-002', localInsDate: '2025-07-04T00:00:00Z' }
        ],
        totalCount: 2
      };
      apiServiceSpy.get.and.returnValue(of(orderResponse));

      service.getOrderNoLov('CUST001').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('ORD-001');
          expect(result[0].description).toMatch(/\d{2}-JAN-2025/);
          expect(result[1].code).toBe('ORD-002');
          expect(result[1].description).toMatch(/\d{2}-JUL-2025/);
          done();
        }
      });
    });

    it('should return empty description when localInsDate is empty string', (done) => {
      const orderResponse: ApiResponse<{ orderNo: string; localInsDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [{ orderNo: 'ORD-001', localInsDate: '' }],
        totalCount: 1
      };
      apiServiceSpy.get.and.returnValue(of(orderResponse));

      service.getOrderNoLov('CUST001').subscribe({
        next: (result) => {
          expect(result[0].code).toBe('ORD-001');
          expect(result[0].description).toBe('');
          done();
        }
      });
    });

    it('should return empty description when localInsDate is null', (done) => {
      const orderResponse: ApiResponse<{ orderNo: string; localInsDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [{ orderNo: 'ORD-003', localInsDate: null as any }],
        totalCount: 1
      };
      apiServiceSpy.get.and.returnValue(of(orderResponse));

      service.getOrderNoLov('CUST001').subscribe({
        next: (result) => {
          expect(result[0].code).toBe('ORD-003');
          expect(result[0].description).toBe('');
          done();
        }
      });
    });

    it('should return original string as description when localInsDate is invalid', (done) => {
      const orderResponse: ApiResponse<{ orderNo: string; localInsDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [{ orderNo: 'ORD-004', localInsDate: 'not-a-date' }],
        totalCount: 1
      };
      apiServiceSpy.get.and.returnValue(of(orderResponse));

      service.getOrderNoLov('CUST001').subscribe({
        next: (result) => {
          expect(result[0].code).toBe('ORD-004');
          expect(result[0].description).toBe('not-a-date');
          done();
        }
      });
    });

    it('should return empty array when res.data is null', (done) => {
      const nullResponse: ApiResponse<{ orderNo: string; localInsDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null,
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(nullResponse));

      service.getOrderNoLov('CUST001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should format dates across different months correctly', (done) => {
      const monthsData = [
        { orderNo: 'M03', localInsDate: '2025-03-15T00:00:00Z' },
        { orderNo: 'M08', localInsDate: '2025-08-20T00:00:00Z' },
        { orderNo: 'M12', localInsDate: '2025-12-25T00:00:00Z' }
      ];
      const orderResponse: ApiResponse<{ orderNo: string; localInsDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: monthsData,
        totalCount: 3
      };
      apiServiceSpy.get.and.returnValue(of(orderResponse));

      service.getOrderNoLov('CUST001').subscribe({
        next: (result) => {
          expect(result.length).toBe(3);
          expect(result[0].description).toContain('MAR');
          expect(result[1].description).toContain('AUG');
          expect(result[2].description).toContain('DEC');
          done();
        }
      });
    });
  });

  describe('getAdviceIdLov', () => {
    it('should call GET with correct endpoint', (done) => {
      const adviceResponse: ApiResponse<{ adviceId: string; insertDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [{ adviceId: 'ADV-001', insertDate: '2025-01-31T10:30:00Z' }],
        totalCount: 1
      };
      apiServiceSpy.get.and.returnValue(of(adviceResponse));

      service.getAdviceIdLov('CUST001').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.ADVICE_ID_LOV('CUST001')
          );
          done();
        }
      });
    });

    it('should map adviceId to both code and description', (done) => {
      const adviceResponse: ApiResponse<{ adviceId: string; insertDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [
          { adviceId: 'ADV-001', insertDate: '2025-01-31T10:30:00Z' },
          { adviceId: 'ADV-002', insertDate: '2025-02-15T08:00:00Z' }
        ],
        totalCount: 2
      };
      apiServiceSpy.get.and.returnValue(of(adviceResponse));

      service.getAdviceIdLov('CUST001').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0]).toEqual({ code: 'ADV-001', description: 'ADV-001' });
          expect(result[1]).toEqual({ code: 'ADV-002', description: 'ADV-002' });
          done();
        }
      });
    });

    it('should return empty array when res.data is null', (done) => {
      const nullResponse: ApiResponse<{ adviceId: string; insertDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null,
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(nullResponse));

      service.getAdviceIdLov('CUST001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array when res.data is empty', (done) => {
      const emptyResponse: ApiResponse<{ adviceId: string; insertDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: [],
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(emptyResponse));

      service.getAdviceIdLov('CUST001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('getAdviceIdByOrderLov', () => {
    it('should call GET with correct endpoint including customerId and orderNo', (done) => {
      const adviceResponse: ApiResponse<{ adviceId: string; insertDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [{ adviceId: 'ADV-001', insertDate: '2025-01-31T10:30:00Z' }],
        totalCount: 1
      };
      apiServiceSpy.get.and.returnValue(of(adviceResponse));

      service.getAdviceIdByOrderLov('CUST001', 'ORD-001').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.CUSTOMER_DEBIT_CREDIT_QUERY.ADVICE_ID_BY_ORDER_LOV('CUST001', 'ORD-001')
          );
          done();
        }
      });
    });

    it('should map adviceId to both code and description', (done) => {
      const adviceResponse: ApiResponse<{ adviceId: string; insertDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved',
        data: [
          { adviceId: 'ADV-010', insertDate: '2025-03-01T00:00:00Z' },
          { adviceId: 'ADV-011', insertDate: '2025-03-02T00:00:00Z' }
        ],
        totalCount: 2
      };
      apiServiceSpy.get.and.returnValue(of(adviceResponse));

      service.getAdviceIdByOrderLov('CUST001', 'ORD-001').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0]).toEqual({ code: 'ADV-010', description: 'ADV-010' });
          expect(result[1]).toEqual({ code: 'ADV-011', description: 'ADV-011' });
          done();
        }
      });
    });

    it('should return empty array when res.data is null', (done) => {
      const nullResponse: ApiResponse<{ adviceId: string; insertDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null,
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(nullResponse));

      service.getAdviceIdByOrderLov('CUST001', 'ORD-001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array when res.data is empty', (done) => {
      const emptyResponse: ApiResponse<{ adviceId: string; insertDate: string }> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: [],
        totalCount: 0
      };
      apiServiceSpy.get.and.returnValue(of(emptyResponse));

      service.getAdviceIdByOrderLov('CUST001', 'ORD-001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('API Endpoint Validation - additional endpoints', () => {
    it('should use correct URL for customer LOV search endpoint', () => {
      const endpoint = API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV_SEARCH('test');
      expect(endpoint).toContain('/api/v1/customer-debit-credit-query/customer-lov');
      expect(endpoint).toContain('searchTerm=test');
    });

    it('should encode special characters in customer LOV search', () => {
      const endpoint = API.CUSTOMER_DEBIT_CREDIT_QUERY.CUSTOMER_LOV_SEARCH('test & value');
      expect(endpoint).toContain('searchTerm=test%20%26%20value');
    });

    it('should use correct URL for order number LOV endpoint', () => {
      const endpoint = API.CUSTOMER_DEBIT_CREDIT_QUERY.ORDER_NO_LOV('CUST001');
      expect(endpoint).toContain('/api/v1/customer-debit-credit-query/order-no-lov');
      expect(endpoint).toContain('customerId=CUST001');
    });

    it('should use correct URL for advice ID LOV endpoint', () => {
      const endpoint = API.CUSTOMER_DEBIT_CREDIT_QUERY.ADVICE_ID_LOV('CUST001');
      expect(endpoint).toContain('/api/v1/customer-debit-credit-query/advice-id-lov');
      expect(endpoint).toContain('customerId=CUST001');
    });

    it('should use correct URL for advice ID by order LOV endpoint', () => {
      const endpoint = API.CUSTOMER_DEBIT_CREDIT_QUERY.ADVICE_ID_BY_ORDER_LOV('CUST001', 'ORD-001');
      expect(endpoint).toContain('/api/v1/customer-debit-credit-query/advice-id-lov');
      expect(endpoint).toContain('customerId=CUST001');
      expect(endpoint).toContain('orderNo=ORD-001');
    });
  });
});
