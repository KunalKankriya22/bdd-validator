import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OfflineProductPackingService } from './offline-product-packing.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  OrderPackingDto,
  OrderPackingDetailDto,
  OrderPackingQueryDto,
  CreateBoxRequestDto,
  CreateBoxResponseDto,
  BoxContentsItem,
  PackStatusResponse,
  BoxTypeLookupDto,
  PickSlipLookupDto,
  PackProductRequest,
  PackProductResponse,
  QuarantineProductRequest,
  QuarantineProductResponse,
  CloseBoxRequest
} from '../models/offline-product-packing.model';

describe('OfflineProductPackingService', () => {
  let service: OfflineProductPackingService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockOrdersResponse: ApiResponse<OrderPackingDto> = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: [
      {
        orderNo: 'ORD-12345',
        chapterId: '0001',
        customerId: 'CUST001',
        consigneeId: 'CONS001',
        orderType: 'RG',
        orderStatus: 'OR',
        orderClass: 'ST',
        orderedBy: 'John Doe',
        firstShipDate: '2024-06-15T00:00:00Z',
        orderClassDesc: 'Standard',
        consigneeAddress: 'ABC Hospital, 123 Main St',
        remoteCustomer: 'N'
      }
    ],
    totalCount: 1,
    total: 1
  };

  const mockOrderDetailResponse: ApiResponse<OrderPackingDetailDto> = {
    success: true,
    statusCode: 200,
    message: 'Order retrieved successfully',
    data: [
      {
        orderNo: 'ORD-12345',
        chapterId: '0001',
        customerId: 'CUST001',
        consigneeId: 'CONS001',
        orderType: 'RG',
        orderStatus: 'OR',
        orderClass: 'ST',
        orderedBy: 'John Doe',
        firstShipDate: '2024-06-15T00:00:00Z',
        orderClassDesc: 'Standard',
        consigneeAddress: 'ABC Hospital, 123 Main St',
        remoteCustomer: 'N',
        items: [
          {
            itemNo: 1,
            productType: 'RBC',
            bloodType: 'O+',
            requiredQty: 5,
            canceledQty: 0,
            systemCancelQty: 0,
            actualRequiredQty: 5,
            itemStatus: 'OR',
            tier: 1,
            subOk: 'Y',
            productTypeDesc: 'Red Blood Cells',
            aboDesc: 'O Positive',
            itemStatusDesc: 'Ordered',
            attributes: 'IRR Y'
          }
        ]
      }
    ],
    total: 1
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        OfflineProductPackingService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(OfflineProductPackingService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getAllOrders', () => {
    it('should call API with correct endpoint and default pagination', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockOrdersResponse));

      service.getAllOrders().subscribe(response => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          `${API.OFFLINE_PRODUCT_PACKING.GET_ALL}/10/0`,
          {}
        );
        expect(response.success).toBeTrue();
        expect(response.data.length).toBe(1);
        expect(response.data[0].orderNo).toBe('ORD-12345');
        done();
      });
    });

    it('should call API with custom pagination', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockOrdersResponse));

      service.getAllOrders(25, 50).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          `${API.OFFLINE_PRODUCT_PACKING.GET_ALL}/25/50`,
          {}
        );
        done();
      });
    });

    it('should call API with filter query', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockOrdersResponse));

      const query: OrderPackingQueryDto = {
        orderStatus: 'OR',
        customerId: 'CUST001',
        sortColumn: 'OrderNo',
        sortOrder: 'ASC'
      };

      service.getAllOrders(10, 0, query).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          `${API.OFFLINE_PRODUCT_PACKING.GET_ALL}/10/0`,
          query
        );
        done();
      });
    });
  });

  describe('searchOrders', () => {
    it('should return empty array if search keyword is less than 2 characters', (done) => {
      service.searchOrders('a').subscribe(result => {
        expect(result).toEqual([]);
        expect(apiServiceSpy.post).not.toHaveBeenCalled();
        done();
      });
    });

    it('should return empty array if search keyword is empty', (done) => {
      service.searchOrders('').subscribe(result => {
        expect(result).toEqual([]);
        expect(apiServiceSpy.post).not.toHaveBeenCalled();
        done();
      });
    });

    it('should return empty array if search keyword is null or undefined', (done) => {
      service.searchOrders(null as any).subscribe(result => {
        expect(result).toEqual([]);
        expect(apiServiceSpy.post).not.toHaveBeenCalled();
        done();
      });
    });

    it('should call API with search keyword when valid', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockOrdersResponse));

      service.searchOrders('hospital').subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          `${API.OFFLINE_PRODUCT_PACKING.GET_ALL}/25/0`,
          jasmine.objectContaining({
            searchKeyword: 'hospital',
            sortColumn: 'OrderNo',
            sortOrder: 'ASC'
          })
        );
        expect(result.length).toBe(1);
        expect(result[0].orderNo).toBe('ORD-12345');
        done();
      });
    });

    it('should use custom take parameter', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockOrdersResponse));

      service.searchOrders('test', 50).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          `${API.OFFLINE_PRODUCT_PACKING.GET_ALL}/50/0`,
          jasmine.anything()
        );
        done();
      });
    });

    it('should return empty array when response data is null', (done) => {
      const nullDataResponse: ApiResponse<OrderPackingDto> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null as any
      };
      apiServiceSpy.post.and.returnValue(of(nullDataResponse));

      service.searchOrders('test').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getOrderDetails', () => {
    it('should call API with correct endpoint and order number', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockOrderDetailResponse));

      service.getOrderDetails('ORD-12345').subscribe(response => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.OFFLINE_PRODUCT_PACKING.GET_DETAIL}/ORD-12345`
        );
        expect(response.success).toBeTrue();
        expect(response.data.length).toBe(1);
        expect(response.data[0].items.length).toBe(1);
        done();
      });
    });

    it('should encode order number in URL', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockOrderDetailResponse));

      service.getOrderDetails('ORD/12345').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.OFFLINE_PRODUCT_PACKING.GET_DETAIL}/ORD%2F12345`
        );
        done();
      });
    });
  });

  describe('getOrderDetail', () => {
    it('should return first order from response', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockOrderDetailResponse));

      service.getOrderDetail('ORD-12345').subscribe(result => {
        expect(result).not.toBeNull();
        expect(result?.orderNo).toBe('ORD-12345');
        expect(result?.items.length).toBe(1);
        done();
      });
    });

    it('should return null when response success is false', (done) => {
      const failureResponse: ApiResponse<OrderPackingDetailDto> = {
        success: false,
        statusCode: 404,
        message: 'Not found',
        data: []
      };
      apiServiceSpy.get.and.returnValue(of(failureResponse));

      service.getOrderDetail('INVALID').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response data is empty array', (done) => {
      const emptyResponse: ApiResponse<OrderPackingDetailDto> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: []
      };
      apiServiceSpy.get.and.returnValue(of(emptyResponse));

      service.getOrderDetail('ORD-99999').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response data is null', (done) => {
      const nullDataResponse: ApiResponse<OrderPackingDetailDto> = {
        success: true,
        statusCode: 200,
        message: 'No data',
        data: null as any
      };
      apiServiceSpy.get.and.returnValue(of(nullDataResponse));

      service.getOrderDetail('ORD-99999').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('createBox', () => {
    it('should call API with correct endpoint and request', (done) => {
      const mockResponse: ApiResponse<CreateBoxResponseDto> = {
        success: true,
        statusCode: 200,
        message: 'Box created',
        data: [{ boxId: 'BX-001', boxStatus: 'OP', message: 'Success' }]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      const request: CreateBoxRequestDto = {
        orderNo: 'ORD-12345',
        boxType: 'SM',
        productGrouping: 'BL',
        closeCurrentBox: false
      };

      service.createBox(request).subscribe(response => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.BOX_CREATE,
          request
        );
        expect(response.success).toBeTrue();
        expect(response.data[0].boxId).toBe('BX-001');
        done();
      });
    });
  });

  describe('packProduct', () => {
    it('should call API with correct endpoint and request', (done) => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true,
        statusCode: 200,
        message: 'Packed',
        data: [{
          orderNo: 'ORD-12345',
          unitId: 'U123',
          productCode: 'RBC',
          boxId: 'BOX-001',
          status: 'PK'
        }]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      const request: PackProductRequest = {
        orderNo: 'ORD-12345',
        boxId: 'BOX-001',
        unitId: 'U123',
        productCode: 'RBC',
        itemNo: 1,
        qcPassed: true
      };

      service.packProduct(request).subscribe(response => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.PACK_PRODUCT,
          request
        );
        expect(response.success).toBeTrue();
        expect(response.data[0].status).toBe('PK');
        done();
      });
    });
  });

  describe('quarantineProduct', () => {
    it('should call API with correct endpoint and request', (done) => {
      const mockResponse: ApiResponse<QuarantineProductResponse> = {
        success: true,
        statusCode: 200,
        message: 'Quarantined',
        data: [{
          unitId: 'U123',
          productCode: 'RBC',
          status: 'QR'
        }]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      const request: QuarantineProductRequest = {
        orderNo: 'ORD-12345',
        unitId: 'U123',
        productCode: 'RBC',
        reason: 'VSUAL'
      };

      service.quarantineProduct(request).subscribe(response => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.QUARANTINE,
          request
        );
        expect(response.success).toBeTrue();
        expect(response.data[0].status).toBe('QR');
        done();
      });
    });
  });

  describe('closeBox', () => {
    it('should call API with correct endpoint and request', (done) => {
      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Box closed',
        data: [true]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      const request: CloseBoxRequest = {
        boxId: 'BOX-001',
        orderNo: 'ORD-12345',
        allProperlyPacked: true
      };

      service.closeBox(request).subscribe(response => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.BOX_CLOSE,
          request
        );
        expect(response.success).toBeTrue();
        done();
      });
    });
  });

  describe('getPackStatus', () => {
    it('should call API with correct endpoint for the order', (done) => {
      const mockResponse: ApiResponse<PackStatusResponse> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [],
        item: {
          packedProducts: [{ unitId: 'U1', productCode: 'RBC' }],
          allocatedProducts: [{ unitId: 'U2', productCode: 'PLT' }]
        }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPackStatus('ORD-12345').subscribe(response => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.PACK_STATUS('ORD-12345')
        );
        expect(response.success).toBeTrue();
        expect(response.item?.packedProducts.length).toBe(1);
        expect(response.item?.allocatedProducts.length).toBe(1);
        done();
      });
    });
  });

  describe('getBoxContents', () => {
    it('should call API with correct endpoint for the box', (done) => {
      const mockResponse: ApiResponse<BoxContentsItem> = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [
          { unitId: 'U1', productCode: 'RBC', aboDesc: 'O Positive' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getBoxContents('BOX-001').subscribe(response => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.BOX_CONTENTS('BOX-001')
        );
        expect(response.success).toBeTrue();
        expect(response.data.length).toBe(1);
        expect(response.data[0].unitId).toBe('U1');
        done();
      });
    });
  });

  describe('getBoxTypes', () => {
    it('should return array directly when response is an array', (done) => {
      const mockBoxTypes: BoxTypeLookupDto[] = [
        { value: 'SM', label: 'Small' },
        { value: 'MD', label: 'Medium' },
        { value: 'LG', label: 'Large' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockBoxTypes));

      service.getBoxTypes().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.BOX_TYPES
        );
        expect(result).toEqual(mockBoxTypes);
        expect(result.length).toBe(3);
        expect(result[0].value).toBe('SM');
        done();
      });
    });

    it('should extract data from wrapped response', (done) => {
      const mockBoxTypes: BoxTypeLookupDto[] = [
        { value: 'SM', label: 'Small' },
        { value: 'LG', label: 'Large' }
      ];
      const wrappedResponse = { success: true, data: mockBoxTypes };
      apiServiceSpy.get.and.returnValue(of(wrappedResponse));

      service.getBoxTypes().subscribe(result => {
        expect(result).toEqual(mockBoxTypes);
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should return empty array when wrapped response has no data', (done) => {
      const wrappedResponse = { success: true };
      apiServiceSpy.get.and.returnValue(of(wrappedResponse));

      service.getBoxTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when wrapped response data is null', (done) => {
      const wrappedResponse = { success: true, data: null };
      apiServiceSpy.get.and.returnValue(of(wrappedResponse));

      service.getBoxTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getPickSlips', () => {
    it('should call API with correct endpoint and map standard field names', (done) => {
      const rawSlips = [
        {
          pickSlipId: 'PA17-00130048',
          orderNo: 'ORD-12345',
          customerId: 'CUST001',
          createdDate: '2024-06-15T00:00:00Z',
          status: 'OP',
          statusDesc: 'Open'
        }
      ];
      apiServiceSpy.get.and.returnValue(of(rawSlips));

      service.getPickSlips('ORD-12345').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.PICK_SLIPS('ORD-12345')
        );
        expect(result.length).toBe(1);
        expect(result[0].pickSlipId).toBe('PA17-00130048');
        expect(result[0].orderNo).toBe('ORD-12345');
        expect(result[0].customerId).toBe('CUST001');
        expect(result[0].status).toBe('OP');
        expect(result[0].statusDesc).toBe('Open');
        done();
      });
    });

    it('should extract data from wrapped response', (done) => {
      const wrappedResponse = {
        success: true,
        data: [
          {
            pickSlipId: 'PA17-00130048',
            orderNo: 'ORD-12345',
            customerId: 'CUST001',
            createdDate: '2024-06-15T00:00:00Z',
            status: 'OP',
            statusDesc: 'Open'
          }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(wrappedResponse));

      service.getPickSlips('ORD-12345').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].pickSlipId).toBe('PA17-00130048');
        done();
      });
    });

    it('should handle alternative field name packSlipId', (done) => {
      const rawSlips = [
        {
          packSlipId: 'PS-001',
          order_no: 'ORD-001',
          customer_id: 'C001',
          created_date: '2024-01-01',
          status: 'CL',
          status_desc: 'Closed'
        }
      ];
      apiServiceSpy.get.and.returnValue(of(rawSlips));

      service.getPickSlips('ORD-001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].pickSlipId).toBe('PS-001');
        expect(result[0].orderNo).toBe('ORD-001');
        expect(result[0].customerId).toBe('C001');
        expect(result[0].createdDate).toBe('2024-01-01');
        expect(result[0].statusDesc).toBe('Closed');
        done();
      });
    });

    it('should handle alternative field name pick_slip_id', (done) => {
      const rawSlips = [
        {
          pick_slip_id: 'PS-002',
          order_no: 'ORD-002'
        }
      ];
      apiServiceSpy.get.and.returnValue(of(rawSlips));

      service.getPickSlips('ORD-002').subscribe(result => {
        expect(result[0].pickSlipId).toBe('PS-002');
        expect(result[0].orderNo).toBe('ORD-002');
        done();
      });
    });

    it('should fall back to id field for pickSlipId', (done) => {
      const rawSlips = [
        { id: 'FALLBACK-ID', orderNo: 'ORD-003' }
      ];
      apiServiceSpy.get.and.returnValue(of(rawSlips));

      service.getPickSlips('ORD-003').subscribe(result => {
        expect(result[0].pickSlipId).toBe('FALLBACK-ID');
        done();
      });
    });

    it('should default to empty string for missing pickSlipId fields', (done) => {
      const rawSlips = [{ orderNo: 'ORD-004' }];
      apiServiceSpy.get.and.returnValue(of(rawSlips));

      service.getPickSlips('ORD-004').subscribe(result => {
        expect(result[0].pickSlipId).toBe('');
        expect(result[0].orderNo).toBe('ORD-004');
        done();
      });
    });

    it('should default nullable fields to null when not present', (done) => {
      const rawSlips = [{ pickSlipId: 'PS-005', orderNo: 'ORD-005' }];
      apiServiceSpy.get.and.returnValue(of(rawSlips));

      service.getPickSlips('ORD-005').subscribe(result => {
        expect(result[0].customerId).toBeNull();
        expect(result[0].createdDate).toBeNull();
        expect(result[0].status).toBeNull();
        expect(result[0].statusDesc).toBeNull();
        done();
      });
    });

    it('should return empty array when wrapped response has no data', (done) => {
      const wrappedResponse = { success: true };
      apiServiceSpy.get.and.returnValue(of(wrappedResponse));

      service.getPickSlips('ORD-NONE').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getOpenBoxes', () => {
    it('should call API with correct endpoint for the order', (done) => {
      const mockBoxes: BoxTypeLookupDto[] = [
        { value: 'BX-001', label: 'Box 1 - Small' },
        { value: 'BX-002', label: 'Box 2 - Large' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockBoxes));

      service.getOpenBoxes('ORD-12345').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.OPEN_BOXES('ORD-12345')
        );
        expect(result).toEqual(mockBoxes);
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should return empty array when no open boxes exist', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      service.getOpenBoxes('ORD-EMPTY').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getProductCodes', () => {
    it('should call API with correct endpoint for the unit', (done) => {
      const mockCodes: BoxTypeLookupDto[] = [
        { value: 'RBC', label: 'Red Blood Cells' },
        { value: 'PLT', label: 'Platelets' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockCodes));

      service.getProductCodes('U123').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.PRODUCT_CODES('U123')
        );
        expect(result).toEqual(mockCodes);
        expect(result.length).toBe(2);
        expect(result[0].value).toBe('RBC');
        done();
      });
    });
  });

  describe('getValidBloodTypes', () => {
    it('should call API with correct endpoint for unit and product code', (done) => {
      const mockBloodTypes: BoxTypeLookupDto[] = [
        { value: 'O+', label: 'O Positive' },
        { value: 'A-', label: 'A Negative' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockBloodTypes));

      service.getValidBloodTypes('U123', 'RBC').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.BLOOD_TYPES('U123', 'RBC')
        );
        expect(result).toEqual(mockBloodTypes);
        expect(result.length).toBe(2);
        expect(result[0].value).toBe('O+');
        done();
      });
    });
  });

  describe('getValidAliquots', () => {
    it('should call API with correct endpoint for unit and product code', (done) => {
      const mockAliquots: BoxTypeLookupDto[] = [
        { value: 'ALQ1', label: 'Aliquot 1' },
        { value: 'ALQ2', label: 'Aliquot 2' }
      ];
      apiServiceSpy.get.and.returnValue(of(mockAliquots));

      service.getValidAliquots('U456', 'PLT').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.ALIQUOTS('U456', 'PLT')
        );
        expect(result).toEqual(mockAliquots);
        expect(result.length).toBe(2);
        expect(result[0].value).toBe('ALQ1');
        done();
      });
    });
  });

  describe('updateBackOrderStatus', () => {
    it('should call API with correct endpoint and order number in body', (done) => {
      const mockResponse = { success: true, statusCode: 200, message: 'Updated' };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.updateBackOrderStatus('ORD-12345').subscribe(response => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.OFFLINE_PRODUCT_PACKING.UPDATE_BACK_ORDER,
          { orderNo: 'ORD-12345' }
        );
        expect(response.success).toBeTrue();
        done();
      });
    });
  });
});
