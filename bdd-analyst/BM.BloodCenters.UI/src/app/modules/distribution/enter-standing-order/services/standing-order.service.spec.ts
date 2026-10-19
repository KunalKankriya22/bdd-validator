import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StandingOrderService } from './standing-order.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  StandingOrderDto,
  StandingOrderQueryDto,
  CreateStandingOrderDto,
  UpdateStandingOrderItemDto,
  StandingOrderItemDto,
  CreateStandingOrderItemDto
} from '../models/standing-order.model';

describe('StandingOrderService', () => {
  let service: StandingOrderService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockStandingOrderDto: StandingOrderDto = {
    chapterId: 'CH01',
    contractId: 'C001',
    consigneeId: 'CN001',
    weekDay: 'MON',
    confirmFlag: 'Y',
    requiredTime: 8,
    effDate: '2024-06-01T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2024-06-01T10:30:00Z'
  };

  const mockStandingOrderItemDto: StandingOrderItemDto = {
    itemNo: 1,
    productType: 'RBC',
    productTypeShortName: 'Red Blood Cells',
    bloodType: 'O+',
    tier: '1',
    qty: 5,
    subOk: 'Y',
    minQty: 3,
    effDate: '2024-06-01T00:00:00Z',
    termDate: null
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        StandingOrderService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(StandingOrderService);
  });

  describe('Standing Order Header Operations', () => {
    describe('getStandingOrders', () => {
      it('should fetch standing orders list with pagination', (done) => {
        const mockResponse: ApiResponse<StandingOrderDto> = {
          success: true,
          statusCode: 200,
          message: 'Success',
          data: [mockStandingOrderDto],
          totalCount: 1
        };

        apiServiceSpy.post.and.returnValue(of(mockResponse));

        const queryDto: StandingOrderQueryDto = {
          contractId: 'C001'
        };

        service.getStandingOrders(25, 0, queryDto).subscribe(result => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.STANDING_ORDERS.LIST(25, 0),
            queryDto
          );
          expect(result.data.length).toBe(1);
          expect(result.totalRecords).toBe(1);
          expect(result.data[0].weekDayDisplay).toBe('Monday');
          expect(result.data[0].confirmation).toBe('Yes');
          expect(result.data[0].timeRequired).toBe('8:00 AM');
          done();
        });
      });

    });

    describe('getStandingOrderById', () => {
      it('should fetch a specific standing order', (done) => {
        const mockResponse: ApiResponse<StandingOrderDto> = {
          success: true,
          statusCode: 200,
          message: 'Success',
          data: [mockStandingOrderDto],
          totalCount: 1
        };

        apiServiceSpy.get.and.returnValue(of(mockResponse));

        service.getStandingOrderById('C001', 'CN001', 'MON').subscribe(result => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.STANDING_ORDERS.GET('C001', 'CN001', 'MON')
          );
          expect(result).toEqual(mockStandingOrderDto);
          done();
        });
      });

    });

    describe('createStandingOrder', () => {
      it('should create a new standing order', (done) => {
        const createDto: CreateStandingOrderDto = {
          contractId: 'C001',
          consigneeId: 'CN001',
          weekDay: 'MON',
          confirmFlag: 'Y',
          requiredTime: 8,
          effDate: '2024-06-01'
        };

        const mockResponse: ApiResponse<any> = {
          success: true,
          statusCode: 201,
          message: 'Standing order created successfully',
          data: [{ contractId: 'C001', consigneeId: 'CN001', weekDay: 'MON' }]
        };

        apiServiceSpy.post.and.returnValue(of(mockResponse));

        service.createStandingOrder(createDto).subscribe(result => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.STANDING_ORDERS.CREATE,
            createDto
          );
          expect(result.success).toBeTrue();
          done();
        });
      });
    });

    describe('updateStandingOrder', () => {
      it('should update an existing standing order', (done) => {
        const updateDto = {
          confirmFlag: 'N',
          requiredTime: 10,
          effDate: '2024-06-01'
        };

        const mockResponse: ApiResponse<any> = {
          success: true,
          statusCode: 200,
          message: 'Updated successfully',
          data: null
        };

        apiServiceSpy.put.and.returnValue(of(mockResponse));

        service.updateStandingOrder('C001', 'CN001', 'MON', updateDto).subscribe(result => {
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            API.STANDING_ORDERS.UPDATE('C001', 'CN001', 'MON'),
            updateDto
          );
          expect(result.success).toBeTrue();
          done();
        });
      });
    });

    describe('deleteStandingOrder', () => {
      it('should delete a standing order', (done) => {
        const mockResponse: ApiResponse<boolean> = {
          success: true,
          statusCode: 200,
          message: 'Deleted successfully',
          data: [true]
        };

        apiServiceSpy.delete.and.returnValue(of(mockResponse));

        service.deleteStandingOrder('C001', 'CN001', 'MON').subscribe(result => {
          expect(apiServiceSpy.delete).toHaveBeenCalledWith(
            API.STANDING_ORDERS.DELETE('C001', 'CN001', 'MON')
          );
          expect(result.success).toBeTrue();
          done();
        });
      });
    });
  });

  describe('Standing Order Items Operations', () => {
    describe('getStandingOrderItems', () => {
      it('should fetch standing order items list', (done) => {
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true,
          statusCode: 200,
          message: 'Success',
          data: [mockStandingOrderItemDto],
          totalCount: 1
        };

        apiServiceSpy.post.and.returnValue(of(mockResponse));

        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.STANDING_ORDERS.ITEMS.LIST('C001', 'CN001', 'MON', 25, 0),
            {}
          );
          expect(result.data.length).toBe(1);
          expect(result.totalRecords).toBe(1);
          expect(result.data[0].productName).toBe('Red Blood Cells');
          expect(result.data[0].substitution).toBe('Yes - Allowed');
          done();
        });
      });
    });

    describe('createStandingOrderItem', () => {
      it('should create a new standing order item', (done) => {
        const createDto: CreateStandingOrderItemDto = {
          productType: 'RBC',
          bloodType: 'O+',
          tier: '1',
          qty: 5,
          subOk: 'Y',
          minQty: 3,
          effDate: '2024-06-01'
        };

        const mockResponse: ApiResponse<any> = {
          success: true,
          statusCode: 201,
          message: 'Item created successfully',
          data: [{ itemNo: 1 }]
        };

        apiServiceSpy.post.and.returnValue(of(mockResponse));

        service.createStandingOrderItem('C001', 'CN001', 'MON', createDto).subscribe(result => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.STANDING_ORDERS.ITEMS.CREATE('C001', 'CN001', 'MON'),
            createDto
          );
          expect(result.success).toBeTrue();
          done();
        });
      });
    });

    describe('deleteStandingOrderItem', () => {
      it('should delete a standing order item', (done) => {
        const mockResponse: ApiResponse<boolean> = {
          success: true,
          statusCode: 200,
          message: 'Item deleted successfully',
          data: [true]
        };

        apiServiceSpy.delete.and.returnValue(of(mockResponse));

        service.deleteStandingOrderItem('C001', 'CN001', 'MON', 1).subscribe(result => {
          expect(apiServiceSpy.delete).toHaveBeenCalledWith(
            API.STANDING_ORDERS.ITEMS.DELETE('C001', 'CN001', 'MON', 1)
          );
          expect(result.success).toBeTrue();
          done();
        });
      });
    });
  });

  describe('Standing Order Header - edge cases', () => {
    describe('getStandingOrders', () => {
      it('should use total when totalCount is absent', (done) => {
        const mockResponse: ApiResponse<StandingOrderDto> = {
          success: true,
          statusCode: 200,
          message: 'Success',
          data: [mockStandingOrderDto],
          total: 5
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrders(25, 0, {}).subscribe(result => {
          expect(result.totalRecords).toBe(5);
          done();
        });
      });

      it('should return 0 when neither totalCount nor total present', (done) => {
        const mockResponse: any = { success: true, statusCode: 200, message: 'ok', data: null };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrders(25, 0, {}).subscribe(result => {
          expect(result.totalRecords).toBe(0);
          expect(result.data).toEqual([]);
          done();
        });
      });

      it('should format terminationDate as -- when null', (done) => {
        const dtoWithNoTerm: StandingOrderDto = { ...mockStandingOrderDto, termDate: null, lastModifiedDate: null, requiredTime: null };
        const mockResponse: ApiResponse<StandingOrderDto> = {
          success: true, statusCode: 200, message: 'ok',
          data: [dtoWithNoTerm], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrders(25, 0, {}).subscribe(result => {
          expect(result.data[0].terminationDate).toBe('--');
          expect(result.data[0].modificationDate).toBeNull();
          expect(result.data[0].timeRequired).toBe('--');
          done();
        });
      });

      it('should format modificationDate when present', (done) => {
        const dtoWithMod: StandingOrderDto = { ...mockStandingOrderDto, lastModifiedDate: '2024-06-10T14:30:00Z' };
        const mockResponse: ApiResponse<StandingOrderDto> = {
          success: true, statusCode: 200, message: 'ok', data: [dtoWithMod], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrders(25, 0, {}).subscribe(result => {
          expect(result.data[0].modificationDate).toBeTruthy();
          done();
        });
      });

      it('should format confirmation as No for confirmFlag N', (done) => {
        const dtoN: StandingOrderDto = { ...mockStandingOrderDto, confirmFlag: 'N' };
        const mockResponse: ApiResponse<StandingOrderDto> = {
          success: true, statusCode: 200, message: 'ok', data: [dtoN], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrders(25, 0, {}).subscribe(result => {
          expect(result.data[0].confirmation).toBe('No');
          done();
        });
      });

      it('should return -- for unknown confirmFlag', (done) => {
        const dtoUnknown: any = { ...mockStandingOrderDto, confirmFlag: 'X' };
        const mockResponse: ApiResponse<StandingOrderDto> = {
          success: true, statusCode: 200, message: 'ok', data: [dtoUnknown], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrders(25, 0, {}).subscribe(result => {
          expect(result.data[0].confirmation).toBe('--');
          done();
        });
      });
    });

    describe('getStandingOrderById', () => {
      it('should return null when data array is empty', (done) => {
        const mockResponse: ApiResponse<StandingOrderDto> = {
          success: true, statusCode: 200, message: 'ok', data: []
        };
        apiServiceSpy.get.and.returnValue(of(mockResponse));
        service.getStandingOrderById('C001', 'CN001', 'MON').subscribe(result => {
          expect(result).toBeNull();
          done();
        });
      });

      it('should return null when data is null', (done) => {
        const mockResponse: ApiResponse<StandingOrderDto> = {
          success: true, statusCode: 200, message: 'ok', data: null
        };
        apiServiceSpy.get.and.returnValue(of(mockResponse));
        service.getStandingOrderById('C001', 'CN001', 'MON').subscribe(result => {
          expect(result).toBeNull();
          done();
        });
      });
    });
  });

  describe('Standing Order Items - edge cases', () => {
    describe('getStandingOrderItems', () => {
      it('should use total when totalCount absent', (done) => {
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok',
          data: [mockStandingOrderItemDto], total: 7
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.totalRecords).toBe(7);
          done();
        });
      });

      it('should format termDate as -- when null', (done) => {
        const itemNoTerm: StandingOrderItemDto = { ...mockStandingOrderItemDto, termDate: null };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemNoTerm], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].terminationDate).toBe('--');
          done();
        });
      });

      it('should use bloodType when bloodTypeDescription is absent', (done) => {
        const itemNoDesc: StandingOrderItemDto = { ...mockStandingOrderItemDto, bloodTypeDescription: null };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemNoDesc], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].abOrh).toBe('O+');
          done();
        });
      });

      it('should show -- for abOrh when bloodType and bloodTypeDescription both absent', (done) => {
        const itemNoBlood: StandingOrderItemDto = { ...mockStandingOrderItemDto, bloodType: '', bloodTypeDescription: null };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemNoBlood], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].abOrh).toBe('--');
          done();
        });
      });

      it('should show -- for tier when absent', (done) => {
        const itemNoTier: StandingOrderItemDto = { ...mockStandingOrderItemDto, tier: null };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemNoTier], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].tier).toBe('--');
          done();
        });
      });

      it('should show -- for minimumQuantity when absent', (done) => {
        const itemNoMin: StandingOrderItemDto = { ...mockStandingOrderItemDto, minQty: null };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemNoMin], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].minimumQuantity).toBe('--');
          done();
        });
      });

      it('should show -- for attributeDisplay when absent', (done) => {
        const itemNoAttr: StandingOrderItemDto = { ...mockStandingOrderItemDto, attributeDisplay: null };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemNoAttr], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].attributeDisplay).toBe('--');
          done();
        });
      });

      it('should show No for subOk N', (done) => {
        const itemSubNo: StandingOrderItemDto = { ...mockStandingOrderItemDto, subOk: 'N' };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemSubNo], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].substitution).toBe('No');
          done();
        });
      });

      it('should show -- for unknown subOk value', (done) => {
        const itemSubUnknown: any = { ...mockStandingOrderItemDto, subOk: null };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemSubUnknown], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].substitution).toBe('--');
          done();
        });
      });

      it('should use weekDay code when weekDay is absent in item', (done) => {
        const itemNoWeekDay: StandingOrderItemDto = { ...mockStandingOrderItemDto, weekDay: undefined };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemNoWeekDay], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].weekDay).toBe('');
          done();
        });
      });

      it('should use productType when productTypeShortName is absent', (done) => {
        const itemNoName: StandingOrderItemDto = { ...mockStandingOrderItemDto, productTypeShortName: null };
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [itemNoName], totalCount: 1
        };
        apiServiceSpy.post.and.returnValue(of(mockResponse));
        service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
          expect(result.data[0].productName).toBe('RBC');
          done();
        });
      });
    });

    describe('getStandingOrderItemById', () => {
      it('should return null when data is empty', (done) => {
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: []
        };
        apiServiceSpy.get.and.returnValue(of(mockResponse));
        service.getStandingOrderItemById('C001', 'CN001', 'MON', 1).subscribe(result => {
          expect(result).toBeNull();
          done();
        });
      });

      it('should return null when data is null', (done) => {
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: null
        };
        apiServiceSpy.get.and.returnValue(of(mockResponse));
        service.getStandingOrderItemById('C001', 'CN001', 'MON', 1).subscribe(result => {
          expect(result).toBeNull();
          done();
        });
      });

      it('should return the item when data has an entry', (done) => {
        const mockResponse: ApiResponse<StandingOrderItemDto> = {
          success: true, statusCode: 200, message: 'ok', data: [mockStandingOrderItemDto]
        };
        apiServiceSpy.get.and.returnValue(of(mockResponse));
        service.getStandingOrderItemById('C001', 'CN001', 'MON', 1).subscribe(result => {
          expect(result).toEqual(mockStandingOrderItemDto);
          done();
        });
      });
    });

    describe('updateStandingOrderItem', () => {
      it('should call put with correct url and dto', (done) => {
        const updateDto: UpdateStandingOrderItemDto = {
          productType: 'RBC', bloodType: 'O+', tier: '1', qty: 5, subOk: 'Y'
        };
        const mockResponse: ApiResponse<any> = {
          success: true, statusCode: 200, message: 'Updated', data: null
        };
        apiServiceSpy.put.and.returnValue(of(mockResponse));
        service.updateStandingOrderItem('C001', 'CN001', 'MON', 1, updateDto).subscribe(result => {
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            API.STANDING_ORDERS.ITEMS.UPDATE('C001', 'CN001', 'MON', 1),
            updateDto
          );
          expect(result.success).toBeTrue();
          done();
        });
      });
    });
  });

  describe('Lookup / Dropdown Methods', () => {
    it('getCustomerTypes should map code and description', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'HO', description: 'Hospital' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomerTypes().subscribe(result => {
        expect(result[0].code).toBe('HO');
        expect(result[0].description).toBe('Hospital');
        done();
      });
    });

    it('getCustomerTypes should use code for description when description absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ Code: 'HO' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomerTypes().subscribe(result => {
        expect(result[0].code).toBe('HO');
        expect(result[0].description).toBe('HO');
        done();
      });
    });

    it('getCustomers with customerType should append query param', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ contractId: 'C001', customerName: 'Hospital A', customerId: 'HO01' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomers('HO').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.stringContaining('customerType=HO'));
        expect(result[0].code).toBe('C001');
        expect(result[0].description).toBe('Hospital A');
        expect(result[0].customerId).toBe('HO01');
        done();
      });
    });

    it('getCustomers without customerType should not append query param', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok', data: []
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomers().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.stringContaining('customers'));
        expect(apiServiceSpy.get).not.toHaveBeenCalledWith(jasmine.stringContaining('customerType'));
        expect(result).toEqual([]);
        done();
      });
    });

    it('getConsignees should map consigneeId and name', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ consigneeId: 'CN001', name: 'Main Branch' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getConsignees('CUST01').subscribe(result => {
        expect(result[0].code).toBe('CN001');
        expect(result[0].description).toBe('Main Branch');
        done();
      });
    });

    it('getCustomers maps PascalCase CustomerId fallback when customerId is absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ ContractId: 'C002', CustomerName: 'Clinic B', CustomerId: 'CL02' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomers().subscribe(result => {
        expect(result[0].customerId).toBe('CL02');
        done();
      });
    });

    it('getCustomers uses empty string when both customerId and CustomerId are absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ contractId: 'C003', customerName: 'Other' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomers().subscribe(result => {
        expect(result[0].customerId).toBe('');
        done();
      });
    });

    it('getConsignees maps PascalCase ConsigneeId fallback when consigneeId is absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ ConsigneeId: 'CN002', Name: 'Branch' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getConsignees('CUST01').subscribe(result => {
        expect(result[0].code).toBe('CN002');
        done();
      });
    });

    it('getConsignees maps code fallback when both consigneeId and ConsigneeId are absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'CN003' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getConsignees('CUST01').subscribe(result => {
        expect(result[0].code).toBe('CN003');
        done();
      });
    });

    it('getWeekDays should map weekDay fields', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'MON', description: 'Monday' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getWeekDays().subscribe(result => {
        expect(result[0].code).toBe('MON');
        expect(result[0].description).toBe('Monday');
        done();
      });
    });

    it('getProductTypes with no customerId returns all types', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ productType: 'RBC', productTypeShortName: 'Red Blood Cells' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getProductTypes().subscribe(result => {
        expect(result[0].code).toBe('RBC');
        expect(result[0].description).toBe('Red Blood Cells');
        done();
      });
    });

    it('getProductTypes with customerId and consigneeId appends params', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok', data: []
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getProductTypes('CUST01', 'CN001').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.stringContaining('customerId=CUST01'));
        done();
      });
    });

    it('getBloodTypes should map aboCode and aboDesc', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ aboCode: 'O+', aboDesc: 'O Positive' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getBloodTypes('RBC').subscribe(result => {
        expect(result[0].code).toBe('O+');
        expect(result[0].description).toBe('O Positive');
        done();
      });
    });

    it('getTiers should map tier and description', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ tier: 1, description: 'Tier 1' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getTiers('RBC').subscribe(result => {
        expect(result[0].code).toBe('1');
        expect(result[0].description).toBe('Tier 1');
        done();
      });
    });

    it('getTiers should use tier as description when description absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ Tier: 2 }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getTiers('RBC').subscribe(result => {
        expect(result[0].code).toBe('2');
        expect(result[0].description).toBe('2');
        done();
      });
    });

    it('getAttributeGroups should map attribGroup and attribDesc', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ attribGroup: 'GRP1', attribDesc: 'Group One' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeGroups().subscribe(result => {
        expect(result[0].code).toBe('GRP1');
        expect(result[0].description).toBe('Group One');
        done();
      });
    });

    it('getAttributeCodes should map attribCode and attribDesc', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ attribCode: 'CODE1', attribDesc: 'Code One' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeCodes('GRP1').subscribe(result => {
        expect(result[0].code).toBe('CODE1');
        expect(result[0].description).toBe('Code One');
        done();
      });
    });
  });

  describe('Lookup / Dropdown Methods — extended fallbacks', () => {

    it('getCustomerTypes returns empty array when res.data is null', (done) => {
      const mockRes: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomerTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('getCustomerTypes maps Description fallback when description absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'HO', Description: 'Hospital Types' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomerTypes().subscribe(result => {
        expect(result[0].description).toBe('Hospital Types');
        done();
      });
    });

    it('getCustomerTypes maps code (lowercase) as description when description and Description absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'HO' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomerTypes().subscribe(result => {
        expect(result[0].code).toBe('HO');
        expect(result[0].description).toBe('HO');
        done();
      });
    });

    it('getCustomers returns empty array when res.data is null', (done) => {
      const mockRes: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomers('HO').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('getCustomers maps ContractId fallback when contractId absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ ContractId: 'C004', customerName: 'Delta' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomers().subscribe(result => {
        expect(result[0].code).toBe('C004');
        done();
      });
    });

    it('getCustomers maps CustomerName fallback when customerName absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ contractId: 'C005', CustomerName: 'Echo Clinic' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getCustomers().subscribe(result => {
        expect(result[0].description).toBe('Echo Clinic');
        done();
      });
    });

    it('getConsignees returns empty array when res.data is null', (done) => {
      const mockRes: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getConsignees('CUST01').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('getConsignees uses consigneeId as description when name and Name absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ consigneeId: 'CN010' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getConsignees('CUST01').subscribe(result => {
        expect(result[0].description).toBe('CN010');
        done();
      });
    });

    it('getConsignees uses ConsigneeId as description when name, Name, consigneeId absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ ConsigneeId: 'CN011' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getConsignees('CUST01').subscribe(result => {
        expect(result[0].description).toBe('CN011');
        done();
      });
    });

    it('getConsignees uses empty string description when all fields absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'CN012' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getConsignees('CUST01').subscribe(result => {
        expect(result[0].description).toBe('');
        done();
      });
    });

    it('getWeekDays returns empty array when res.data is null', (done) => {
      const mockRes: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getWeekDays().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('getWeekDays maps Code fallback when code absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ Code: 'TUE', description: 'Tuesday' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getWeekDays().subscribe(result => {
        expect(result[0].code).toBe('TUE');
        done();
      });
    });

    it('getWeekDays maps weekDay fallback when code and Code absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ weekDay: 'WED', weekDayFull: 'Wednesday' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getWeekDays().subscribe(result => {
        expect(result[0].code).toBe('WED');
        done();
      });
    });

    it('getWeekDays maps Description fallback when description absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'THU', Description: 'Thursday' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getWeekDays().subscribe(result => {
        expect(result[0].description).toBe('Thursday');
        done();
      });
    });

    it('getWeekDays maps weekDayFull fallback when description and Description absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'FRI', weekDayFull: 'Friday' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getWeekDays().subscribe(result => {
        expect(result[0].description).toBe('Friday');
        done();
      });
    });

    it('getWeekDays returns empty string description when all description fields absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'SAT' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getWeekDays().subscribe(result => {
        expect(result[0].description).toBe('');
        done();
      });
    });

    it('getProductTypes returns empty array when res.data is null', (done) => {
      const mockRes: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getProductTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('getProductTypes maps ProductType fallback when productType absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ ProductType: 'PLT', productTypeShortName: 'Platelets' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getProductTypes().subscribe(result => {
        expect(result[0].code).toBe('PLT');
        done();
      });
    });

    it('getProductTypes maps code fallback when productType and ProductType absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'FFP', description: 'Fresh Frozen Plasma' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getProductTypes().subscribe(result => {
        expect(result[0].code).toBe('FFP');
        done();
      });
    });

    it('getProductTypes maps ProductTypeShortName fallback when productTypeShortName absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ productType: 'PLT', ProductTypeShortName: 'PLT Short' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getProductTypes().subscribe(result => {
        expect(result[0].description).toBe('PLT Short');
        done();
      });
    });

    it('getProductTypes maps description fallback when productTypeShortName and ProductTypeShortName absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ productType: 'PLT', description: 'Platelets Desc' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getProductTypes().subscribe(result => {
        expect(result[0].description).toBe('Platelets Desc');
        done();
      });
    });

    it('getProductTypes returns empty string description when all description fields absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ productType: 'CRYO' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getProductTypes().subscribe(result => {
        expect(result[0].description).toBe('');
        done();
      });
    });

    it('getBloodTypes returns empty array when res.data is null', (done) => {
      const mockRes: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getBloodTypes('RBC').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('getBloodTypes maps AboCode fallback when aboCode absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ AboCode: 'A+', aboDesc: 'A Positive' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getBloodTypes('RBC').subscribe(result => {
        expect(result[0].code).toBe('A+');
        done();
      });
    });

    it('getBloodTypes maps code fallback when aboCode and AboCode absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'B+', description: 'B Positive' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getBloodTypes('RBC').subscribe(result => {
        expect(result[0].code).toBe('B+');
        done();
      });
    });

    it('getBloodTypes maps AboDesc fallback when aboDesc absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ aboCode: 'AB+', AboDesc: 'AB Positive' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getBloodTypes('RBC').subscribe(result => {
        expect(result[0].description).toBe('AB Positive');
        done();
      });
    });

    it('getBloodTypes maps description fallback when aboDesc and AboDesc absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ aboCode: 'O-', description: 'O Negative' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getBloodTypes('RBC').subscribe(result => {
        expect(result[0].description).toBe('O Negative');
        done();
      });
    });

    it('getBloodTypes returns empty string description when all fields absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ aboCode: 'AB-' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getBloodTypes('RBC').subscribe(result => {
        expect(result[0].description).toBe('');
        done();
      });
    });

    it('getTiers returns empty array when res.data is null', (done) => {
      const mockRes: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getTiers('RBC').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('getTiers maps code fallback when tier and Tier absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'T3', description: 'Tier 3' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getTiers('RBC').subscribe(result => {
        expect(result[0].code).toBe('T3');
        done();
      });
    });

    it('getTiers maps Description fallback when description absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ tier: 4, Description: 'Tier Four' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getTiers('RBC').subscribe(result => {
        expect(result[0].description).toBe('Tier Four');
        done();
      });
    });

    it('getTiers returns empty string description when all description and tier fields absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'T5' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getTiers('RBC').subscribe(result => {
        expect(result[0].description).toBe('');
        done();
      });
    });

    it('getAttributeGroups returns empty array when res.data is null', (done) => {
      const mockRes: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeGroups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('getAttributeGroups maps AttribGroup fallback when attribGroup absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ AttribGroup: 'GRP2', attribDesc: 'Group Two' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeGroups().subscribe(result => {
        expect(result[0].code).toBe('GRP2');
        done();
      });
    });

    it('getAttributeGroups maps code fallback when attribGroup and AttribGroup absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'GRP3', description: 'Group Three' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeGroups().subscribe(result => {
        expect(result[0].code).toBe('GRP3');
        done();
      });
    });

    it('getAttributeGroups maps AttribDesc fallback when attribDesc absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ attribGroup: 'GRP4', AttribDesc: 'Group Four Desc' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeGroups().subscribe(result => {
        expect(result[0].description).toBe('Group Four Desc');
        done();
      });
    });

    it('getAttributeGroups maps description fallback when attribDesc and AttribDesc absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ attribGroup: 'GRP5', description: 'Group Five Generic' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeGroups().subscribe(result => {
        expect(result[0].description).toBe('Group Five Generic');
        done();
      });
    });

    it('getAttributeGroups returns empty string description when all fields absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ attribGroup: 'GRP6' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeGroups().subscribe(result => {
        expect(result[0].description).toBe('');
        done();
      });
    });

    it('getAttributeCodes returns empty array when res.data is null', (done) => {
      const mockRes: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeCodes('GRP1').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('getAttributeCodes maps AttribCode fallback when attribCode absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ AttribCode: 'CODE2', attribDesc: 'Code Two' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeCodes('GRP1').subscribe(result => {
        expect(result[0].code).toBe('CODE2');
        done();
      });
    });

    it('getAttributeCodes maps code fallback when attribCode and AttribCode absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ code: 'CODE3', description: 'Code Three' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeCodes('GRP1').subscribe(result => {
        expect(result[0].code).toBe('CODE3');
        done();
      });
    });

    it('getAttributeCodes maps AttribDesc fallback when attribDesc absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ attribCode: 'CODE4', AttribDesc: 'Code Four Desc' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeCodes('GRP1').subscribe(result => {
        expect(result[0].description).toBe('Code Four Desc');
        done();
      });
    });

    it('getAttributeCodes maps description fallback when attribDesc and AttribDesc absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ attribCode: 'CODE5', description: 'Code Five Generic' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeCodes('GRP1').subscribe(result => {
        expect(result[0].description).toBe('Code Five Generic');
        done();
      });
    });

    it('getAttributeCodes returns empty string description when all fields absent', (done) => {
      const mockRes: ApiResponse<any> = {
        success: true, statusCode: 200, message: 'ok',
        data: [{ attribCode: 'CODE6' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockRes));
      service.getAttributeCodes('GRP1').subscribe(result => {
        expect(result[0].description).toBe('');
        done();
      });
    });

    it('formatDate returns -- for invalid date string (via getStandingOrders)', (done) => {
      const dtoInvalidDate: StandingOrderDto = {
        ...mockStandingOrderDto,
        effDate: 'not-a-date',
        termDate: 'also-invalid',
        lastModifiedDate: 'bad-datetime'
      };
      const mockResponse: ApiResponse<StandingOrderDto> = {
        success: true, statusCode: 200, message: 'ok',
        data: [dtoInvalidDate], totalCount: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));
      service.getStandingOrders(25, 0, {}).subscribe(result => {
        expect(result.data[0].effectiveDate).toBe('--');
        expect(result.data[0].terminationDate).toBe('--');
        expect(result.data[0].modificationDate).toBe('--');
        done();
      });
    });

    it('getStandingOrderItems returns empty array when res.data is null', (done) => {
      const mockResponse: any = { success: true, statusCode: 200, message: 'ok', data: null };
      apiServiceSpy.post.and.returnValue(of(mockResponse));
      service.getStandingOrderItems('C001', 'CN001', 'MON', 25, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });
  });

  describe('Date Formatting', () => {

    it('should serialize dates to YYYY-MM-DD for API', () => {
      const date = new Date('2024-06-15');
      const serialized = service.serializeDateForApi(date);
      expect(serialized).toBe('2024-06-15');
    });

    it('should return null when date is null', () => {
      expect(service.serializeDateForApi(null)).toBeNull();
    });

    it('should return null when date is undefined', () => {
      expect(service.serializeDateForApi(undefined)).toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(service.serializeDateForApi('not-a-date')).toBeNull();
    });

    it('should serialize string date', () => {
      expect(service.serializeDateForApi('2024-06-15')).toBe('2024-06-15');
    });

  });
});
